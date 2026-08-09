# Chapter 7 — Partitioning & Consistent Hashing

> A key doesn't care how many servers exist. The moment a mapping from key to server is built out of the *total server count*, you've written a rule that's guaranteed to break itself the instant that count changes — which, for any cluster that survives contact with real traffic, is not a matter of if.

---

## The Problem

Chapter 6 closed on a question it deliberately left open: TicketFast's dataset — every seat, every order, every event, across thousands of shows — has grown past what any single node can hold, or usefully serve. It needs to be **partitioned**: split across many nodes, not just copied to several. The obvious first design: pick a hash function, compute `hash(key) % N` for `N` nodes, and send each key to the node its remainder points to. Simple, uniform, easy to implement in an afternoon.

Then Black Friday hits, TicketFast needs to add a fifth node to a four-node cluster to handle the load — precisely the moment the system can least afford a disruption — and someone has to answer: when `N` changes, what happens to every key that was already placed according to the *old* `N`?

## 7.1 The Naive Scheme: `hash(key) % N`

Run the obvious scheme forward and measure it directly. Take 100,000 keys, assign each to a node via `hash(key) % N`, change `N` by exactly one, and count how many keys land on a *different* node than before:

```
add 1 node (4->5)       :  80,057/100,000 keys remapped (80.06%)
remove 1 node (4->3)    :  75,047/100,000 keys remapped (75.05%)
add 1 node (10->11)     :  90,922/100,000 keys remapped (90.92%)
add 1 node (100->101)   :  99,036/100,000 keys remapped (99.04%)
```

Adding a single node to a four-node cluster relocates 80% of all keys. Adding one node to a hundred-node cluster relocates 99%. Not only is the naive scheme bad, it gets *worse* — not better — as the cluster grows, which is exactly backwards from what anyone would want out of a sharding scheme meant to scale. The mechanism is simple once named: `hash(key) % 4` and `hash(key) % 5` are, for almost any individual key, two functions with essentially no relationship to each other. A key's remainder when divided by 4 tells you nothing at all about its remainder when divided by 5 — changing the divisor doesn't nudge the answer, it recomputes it from scratch, for every key, independently. There was never a reason to expect only a *few* keys to move; the modulo operation ties every single key's placement to the *one* number that just changed.

## 7.2 When It Breaks: What "Nearly Everything Remaps" Actually Costs

This isn't an abstract inconvenience — name the concrete cost. Each of those 80,057 remapped keys is not an abstract label; it's a seat's reservation history, a customer's order record, real bytes that have to be physically read off one node and written to another before the new mapping is even valid. Adding one node to relieve load on an overloaded four-node cluster, under this scheme, means triggering a data migration touching 80% of everything the cluster holds — saturating exactly the disk and network bandwidth the team was trying to relieve, at exactly the moment (peak traffic) they can least afford to spend it on internal data shuffling instead of serving customers. The tool meant to fix an overload problem creates a second, larger overload problem as a side effect of running it. That's the concrete failure this chapter needs to fix, not just an ugly statistic.

## 7.3 Deriving Consistent Hashing

The naive scheme's flaw traced back to one specific design choice: a key's placement is computed as a function of `N`, the *total node count*. Remove that dependency entirely — make a key's placement depend only on the *node's own identity*, never on how many other nodes happen to exist — and adding or removing one node should only disturb whatever was near *that* node, nothing else.

Build it as a ring instead of a line. Hash every node's identity onto a large circular space (say, integers `0` to `2^32 - 1`, wrapping back to `0`); hash every key onto that same space; assign each key to the *first node reached going clockwise* from the key's position. A node's identity, and therefore its position on the ring, never depends on `N` — it's a property of the node alone, hashed once. This is **consistent hashing**, introduced by David Karger, Eric Lehman, Tom Leighton, Rina Panigrahy, Matthew Levine, and Daniel Lewin in *"Consistent Hashing and Random Trees"* (STOC 1997), originally built for exactly this operational reason: distributed web caches that couldn't afford a full reshuffle every time a cache server joined or left.

Here's why it structurally can't repeat §7.1's failure: removing a node only affects the arc of the ring that node used to own — every key in that arc now belongs to whichever node is next clockwise, and every other key on the ring, whose nearest clockwise node never moved, keeps exactly the assignment it always had. Nothing about a *different* node joining or leaving changes any other node's ring position, because positions were never a function of `N` in the first place.

## 7.4 Verifying the Fix — and an Honest Complication

Run the identical transitions from §7.1 through the ring instead of the modulo:

```
add 1 node (4->5)       :  18,600/100,000 keys remapped (18.60%)  [theoretical ~1/N = 20.00%]
remove 1 node (4->3)    :  59,596/100,000 keys remapped (59.60%)  [theoretical ~1/N = 33.33%]
add 1 node (10->11)     :   6,358/100,000 keys remapped ( 6.36%)  [theoretical ~1/N = 9.09%]
add 1 node (100->101)   :     480/100,000 keys remapped ( 0.48%)  [theoretical ~1/N = 0.99%]
```

Three of the four land close to the "roughly `1/N`" expectation — a massive improvement over §7.1's 80-99%. The removal case doesn't: 59.60%, nearly double the ~33% expected. That's not a bug — tracing it directly: with only one ring position per node, four points scattered by hash alone can land unevenly purely by chance, and in this specific run, the removed node genuinely had staked out 59.5% of the ring's circumference before it was removed. Nothing did anything wrong; the node it happened to remove was, by luck of the hash, unusually large.

That "by luck" is worth pinning down rather than waving away. Re-run the "add one node to four" scenario 30 times, each with freshly randomized node identities (so each trial gets a fresh, independent roll of where every point lands):

```
naive mod-N (4->5)                : mean=80.06%  stdev= 0.00%  min=80.06%  max=80.06%
consistent, 1 vnode/node (4->5)   : mean=15.35%  stdev=12.49%  min= 0.27%  max=56.01%
```

The naive scheme's `stdev = 0.00%` is itself informative: it is *catastrophic on every single trial*, with no variance at all, because its failure has nothing to do with luck. Consistent hashing's mean (15.35%) is roughly in the right neighborhood — but a standard deviation of 12.49%, on a metric whose best case is 0.27% and worst case is 56.01%, means a single point per node makes the *outcome of any one rebalance* close to a coin flip between "barely noticeable" and "worse than half the data moves." Fixing the *average* case wasn't the same as fixing the *reliability* of the fix.

## 7.5 Deriving Virtual Nodes

Trace the unreliability to its source: with one ring position per node, each node's entire share of the keyspace is a single, randomly-sized arc — and a handful of independent random draws (four, in §7.4's example) has no reason to land evenly. The fix follows directly from that diagnosis: instead of hashing each node to *one* ring position, hash it to *many* — dozens or hundreds of **virtual nodes**, all mapping back to the same physical node. A physical node's total keyspace share becomes the *sum* of many small, independent random arcs instead of one large one, and sums of many independent random pieces are exactly where the law of large numbers starts pulling hard toward the average. Nothing about the ring mechanism from §7.3 changes — only *how many* points each physical identity gets to claim.

Measured directly, holding the physical node count fixed at 8 and varying only how many virtual points each one gets:

```
vnodes/node=   1: std as % of mean=65.99%  max/min ratio=8.147  (max=26731, min=3281)
vnodes/node=  10: std as % of mean=30.32%  max/min ratio=2.408  (max=20024, min=8316)
vnodes/node=  50: std as % of mean=21.94%  max/min ratio=1.996  (max=18031, min=9035)
vnodes/node= 150: std as % of mean= 8.32%  max/min ratio=1.265  (max=14217, min=11237)
vnodes/node= 500: std as % of mean= 4.38%  max/min ratio=1.151  (max=13731, min=11928)
```

At one point per node, the busiest node holds over 8 times the keys of the least busy one — a real, operationally serious hot-spot risk, not a rounding error. At 150 virtual points per node, that ratio drops to 1.265, and by 500 it's down to 1.151: every physical node ends up holding close to its fair 1/8th share, every time, not just on average. The same fix pays off on the *reliability* question from §7.4 too — re-run with 150 virtual nodes per physical node instead of 1:

```
consistent, 150 vnodes/node (4->5): mean=20.05%  stdev= 1.05%  min=17.10%  max=21.90%
```

`stdev` collapses from 12.49% down to 1.05% — every trial now lands close to the theoretical 20%, not just the average of many trials. Virtual nodes and load balance turn out to be the same fix seen from two angles: both problems were caused by too few independent random draws per physical node, and both are solved by taking more of them.

## Section Challenge

<details>
<summary><strong>Q1.</strong> TicketFast's ops team picks <code>hash(key) % 100</code> for a 100-node cluster, reasoning: "We rarely resize, so the remapping cost barely matters." Using §7.1's data, evaluate this reasoning — especially for the day they finally do need to add node 101.</summary>

The reasoning has the trend exactly backwards. §7.1's own numbers show the naive scheme gets *worse*, not better, as the cluster grows — 80.06% at 4→5 nodes, climbing to 99.04% at 100→101. "We rarely resize" doesn't reduce how bad the eventual resize is; it just delays paying a bill that's been quietly growing the whole time the cluster scaled up. When a 100-node cluster running mod-100 finally does add its 101st node, the naive scheme doesn't merely relocate "the new node's fair share" — it relocates essentially the *entire dataset* (99.04% of it), which for a cluster that size means moving vastly more absolute data than the same operation would have moved back when the cluster was small. Avoiding frequent resizes doesn't dodge this cost, it concentrates it into one enormous migration at the worst possible moment: precisely when the team has grown the cluster to 100 nodes specifically because they're already under more load than 100 nodes were struggling to handle.
</details>

<details>
<summary><strong>Q2.</strong> Given §7.5's numbers, why not just use 10,000 virtual nodes per physical node for the tightest possible load balance?</summary>

Because the improvement has clearly diminishing returns while the cost keeps climbing linearly. Going from 1 to 150 virtual nodes per physical node took the load imbalance (std as % of mean) from 65.99% down to 8.32% — a huge, cheap win. Going from 150 to 500 (over 3x more virtual points) only took it from 8.32% down to 4.38% — roughly half the improvement for more than three times the additional metadata. Every virtual node is a real ring entry every other node needs to know about, store, and keep updated whenever cluster membership changes — the metadata and gossip cost scales directly with the total virtual node count, while the balance benefit keeps shrinking per additional point added. Somewhere past a few hundred virtual nodes per physical node, TicketFast would be paying real, escalating coordination overhead for load-balance improvements too small to matter operationally — a genuine tuning trade-off, not a "more is strictly better" free parameter.
</details>

<details>
<summary><strong>Q3.</strong> With Chapter 6's replication and this chapter's partitioning combined, TicketFast's data is correctly split and copied across the cluster. Now consider "transfer seat 114 from Order #4471 to Order #4988" — an operation touching two different orders, which consistent hashing may well place on two entirely different physical nodes. Does anything covered so far guarantee this operation either fully happens or fully doesn't?</summary>

No — and it's worth being precise about the gap, because it's easy to assume replication or partitioning implicitly covers this. Chapter 6 guarantees that *once a node accepts a write*, that write is durably replicated and recoverable. This chapter guarantees that a *given key* can always be located, and that adding or removing nodes doesn't cause chaos. Neither one says anything at all about an operation that needs to touch *two different keys, on two different partitions, atomically* — succeeding on Order #4471's node while failing on Order #4988's node is entirely possible under everything built so far, and nothing here would even notice, let alone prevent it.

That's a genuinely new requirement — atomicity across independently-partitioned, independently-replicated pieces of data — and it's a different problem from anything replication or partitioning solves on their own. That's exactly where Chapter 8 starts: distributed transactions, and the specific protocols (two-phase and three-phase commit) built to make an operation spanning multiple nodes succeed or fail as one indivisible unit.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Naive sharding (`hash(key) % N`) | Ties every key's placement to the total node count — changing `N` by just one relocates the vast majority of keys (verified: 80-99% remapped, and the fraction *worsens* as the cluster grows) |
| Why it breaks operationally | Every remapped key is real data that must be physically copied before the new mapping is valid — a routine "add one node" becomes a cluster-wide migration, right when the cluster can least afford the extra load |
| Consistent hashing | Hash nodes and keys onto the same ring; a key belongs to the first node clockwise. Node placement never depends on `N`, so adding/removing one node only disturbs that node's own local arc |
| Verified improvement | Single-trial remaps drop to roughly `1/N` (18.60%, 6.36%, 0.48% vs. naive's 80-99%) — but a lucky/unlucky single node placement can still deviate sharply (one trial: 59.60% on a removal) |
| The reliability gap | With 1 ring point per node, the *average* outcome is good but any *single* rebalance is nearly a coin flip (stdev 12.49% across 30 trials, range 0.27%-56.01%) — one random draw per node isn't enough draws |
| Virtual nodes | Give each physical node many ring positions instead of one; its total share becomes a sum of many small draws, which the law of large numbers pulls toward the fair average |
| Verified fix | Load imbalance (max/min ratio) drops from 8.147 (1 vnode) to 1.151 (500 vnodes); rebalance reliability improves in lockstep (stdev 12.49% -> 1.05% at 150 vnodes) — both problems, same root cause, same fix |

## Where We Go Next

Replication (Chapter 6) and partitioning (this chapter) together tell TicketFast how to keep a copy of any given key safe, and how to find the right node for it without a full reshuffle every time the cluster changes shape. Neither one has anything to say about an operation that needs to touch *two* keys — possibly on two entirely different nodes — and succeed or fail as a single unit. That gap is exactly where distributed transactions begin: Chapter 8 builds two-phase and three-phase commit to make cross-node atomicity a guarantee instead of a hope.

*Next: [08_Distributed_Transactions_2PC_3PC.md](08_Distributed_Transactions_2PC_3PC.md)*
