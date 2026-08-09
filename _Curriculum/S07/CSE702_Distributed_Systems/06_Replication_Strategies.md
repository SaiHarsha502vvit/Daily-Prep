# Chapter 6 — Replication Strategies

> Every replication strategy in this chapter answers the same question, just with a different amount of patience: who is allowed to accept a write right now, and what do you do about everyone else finding out later?

---

## The Problem

TicketFast's Raft cluster from Chapters 4 and 5 works exactly as designed — one leader accepts every write, replicates it to followers, and the cluster survives node failures without ever disagreeing about the result. As the business grows, though, a shape in that design starts to hurt. TicketFast now sells to three continents, and every single write — every seat reservation, from every region — has to reach the *one* current leader before it's acknowledged, no matter which continent the leader happens to be running in this week. A buyer in Singapore reserving a seat pays a full round trip to wherever the leader lives, even though there's a perfectly healthy TicketFast node running in the same datacenter as that buyer. Meanwhile, read traffic — browsing listings, checking seat maps — scales beautifully, since any follower can serve a read.

Is the single-leader shape actually load-bearing for everything TicketFast does with its data, or just for some of it?

## 6.1 Primary-Backup: What Chapters 4 and 5 Already Built, Named

Give the shape TicketFast already has a name: **primary-backup**. One node (the primary — Raft's leader, or a Paxos-elected proposer acting in that role) accepts every write; the rest (backups/followers) replicate it and can serve reads. It's the simplest replication strategy there is, and Chapters 4–5 already derived why it's *safe*. What it doesn't promise is that it *scales* — specifically, not for the resource the primary alone provides. Read capacity grows with the cluster; write capacity does not, because there is exactly one node, ever, allowed to accept a write:

```
 N (total nodes)   write capacity   read capacity (incl. primary)
               1             1000                           1000
               2             1000                           2000
               3             1000                           3000
               5             1000                           5000
              10             1000                          10000
              20             1000                          20000
```

Adding nodes multiplies read capacity in direct proportion and does *nothing at all* for write capacity — the gap between the two columns only widens as the cluster grows, because it's structural, not a tuning problem. Latency has the identical shape: a follower fixes nothing about how far a *write* has to travel, only how far a *read* does. For TicketFast's Singapore buyer, adding ten more follower nodes anywhere in the world does not shave one millisecond off the round trip their reservation has to make to a leader that might be in Virginia.

## 6.2 Multi-Leader: Removing the Bottleneck, Reopening the Conflict

The direct fix for a bottleneck that's specifically about *where the one writable node is*: stop having only one. Give each region its own leader — Singapore writes to a Singapore leader, US-East writes to a US-East leader — and have the regional leaders replicate to each other in the background. Writes never leave the region that issued them, so every region gets local-write latency and stays available for writes even if it's cut off from every other region entirely. This is a genuine, structural fix for §6.1's bottleneck, not a workaround.

It reopens a problem Chapters 2 and 3 already proved is real, in a new location. Two leaders, no coordination between them, both touch the same key at (as far as either can tell) the same moment:

```
Shared starting state: 10
Leader A sells 1 seat (unaware of B) -> A's local state: 9, timestamp 1000.1
Leader B sells 1 seat (unaware of A) -> B's local state: 9, timestamp 1000.05
Naive last-write-wins replication picks the higher timestamp -> winner = Leader A
Final replicated value under LWW: 9
Actual correct value (both sales counted): 8
Lost update occurred: True  (one of the two sales vanished from every replica)
```

Ten seats become nine everywhere, when the true count — two independent sales — should be eight. This isn't a rare unlucky interleaving; it's what **last-write-wins** conflict resolution does *by construction*, every single time two writes to the same key are genuinely concurrent: it picks one and silently discards the other, because "keep the one with the bigger timestamp" has no way to represent "keep both effects." Worse, notice exactly which mechanism is doing the picking — a wall-clock timestamp comparison, the precise thing Chapters 1 through 3 spent three chapters proving can't reliably establish which of two events on different machines actually happened first. Multi-leader replication with LWW isn't just risking a conflict; it's resolving that conflict with the one tool this course has already shown doesn't do what it looks like it does.

## 6.3 Leaderless / Quorum-Based Replication: No Leader At All

Push the same idea one step further. If per-region leaders still leave *within-region* writes bottlenecked on one node, why have a leader at all? Let *any* replica accept a write, directly, for any key — this is the design Amazon described in *"Dynamo: Amazon's Highly Available Key-value Store"* (DeCandia et al., SOSP 2007), built for exactly this reasoning: a shopping cart write failing because the "right" node was unreachable was judged worse for the business than a rare conflict that gets fixed up later.

Without a leader, "did my read see the latest write" can't be answered by asking one designated node — it has to be answered by asking *several* replicas and reasoning about which ones you asked. Formalize it: out of N replicas holding a copy of a key, require every **write** to be acknowledged by at least `W` of them before it's considered successful, and require every **read** to collect responses from at least `R` of them before answering (returning whichever response is newest, if they disagree). The property TicketFast actually needs: *every possible read quorum must be guaranteed to overlap with every possible write quorum* — otherwise a read could query a set of replicas that includes none of the ones holding the latest write, and return stale data with no way to know it. Derive the exact condition by pigeonhole: if `R + W > N`, then any R-sized set and any W-sized set drawn from the same N nodes cannot both avoid each other (if they did, together they'd need at least `R + W` *distinct* nodes, but only `N < R + W` exist) — they're forced to share at least one member.

Verify this exhaustively — not sampled, every possible subset checked directly — for small clusters:

```
Total (N,R,W) combinations checked exhaustively: 139
Mismatches between 'R+W>N' prediction and actual exhaustive overlap check: 0

  N   R   W   R+W   R+W>N?   every R-set meets every W-set?   example disjoint pair (if any)
  3   2   2     4     True                             True                             None
  3   1   1     2    False                            False                     ((0,), (1,))
  5   3   3     6     True                             True                             None
  5   2   2     4    False                            False                 ((0, 1), (2, 3))
  5   1   5     6     True                             True                             None
  4   2   2     4    False                            False                 ((0, 1), (2, 3))
```

Zero mismatches across every `(N, R, W)` combination checked for clusters up to size 7 — the algebraic condition and the brute-force combinatorial reality agree completely. The examples make the boundary concrete: `N=5, R=3, W=3` guarantees overlap (`6 > 5`); `N=5, R=2, W=2` does not, and the table hands back an actual disjoint pair — nodes `{0,1}` could answer every read while nodes `{2,3}` absorbed every write, with node 4 as a bystander, and a read would never learn the write ever happened. `N=4, R=2, W=2` is the sharpest case: `R+W = N` exactly, and that's still not enough — the same disjoint pair `{0,1}` / `{2,3}` shows the condition needs to be *strictly* greater, not merely equal.

Overlap guarantees a read will *receive* a response from at least one replica holding the latest write — it doesn't, by itself, tell the reader *which* of its `R` responses that was, if they disagree. That's a real, separate problem, and it's the same one §6.2 just ran into: something still has to compare the conflicting responses, and Chapter 3's vector clocks — not wall-clock LWW — are exactly the tool built for telling a genuinely later write from a genuinely concurrent one once a quorum read surfaces both.

## 6.4 CRDTs: Making Multi-Leader Conflicts Resolve Themselves

Sections 6.2 and 6.3 both leave a comparison to make at read time — LWW compares timestamps (and loses data), quorum reads compare versions (and need something like a vector clock to do it correctly). Ask a different question: could the *data type itself* be designed so that any two divergent copies can be combined automatically, with nothing lost and no comparison needed at all?

Take §6.2's exact failure — two regions independently incrementing the same "seats sold" count — and change *how the count is stored*, not how it's compared. Instead of one shared number, give every region its own slot in a small vector, and let each region only ever increment its *own* slot:

```python
class GCounter:
    def increment(self, amount=1):
        self.counts[self.node_id] += amount        # only ever touches your own slot

    def merge(self, other):
        # combine two replicas by taking the larger value in EACH slot
        return {n: max(self.counts[n], other.counts[n]) for n in self.counts}

    def value(self):
        return sum(self.counts.values())            # total = sum across every region's slot
```

This is a **G-Counter** (grow-only counter), one of the structures formalized by Shapiro, Preguiça, Baquero, and Zawirski in *"Conflict-free Replicated Data Types"* (SSS 2011) — a **CRDT**. The reason it can't lose an update is structural, not incidental: Region A's sales live permanently in A's own slot, and merging never *removes* a value from a slot, it only ever takes the larger of two observations of that same slot — so no region's contribution can ever be erased by another region's merge, no matter what order the merges happen in.

Replay §6.2's exact scenario — Region A sells one ticket, Region B sells one, with zero coordination:

```
Counter at A after its own sale: {'A': 1, 'B': 0}  (value=1)
Counter at B after its own sale: {'A': 0, 'B': 1}  (value=1)
Merge order A-then-B: {'A': 1, 'B': 1}  (value=2)
Merge order B-then-A: {'A': 1, 'B': 1}  (value=2)
Both merge orders agree: True
Both sales counted (value == 2): True
```

Both sales survive, and — critically — it doesn't matter which region's update the other one hears about first. That "doesn't matter what order" claim is exactly what makes a CRDT safe for a leaderless, no-coordination setting, and it's not just true for this one example — it's an algebraic property of the merge function itself, checked against 20,000 randomly generated pairs and triples of counter states:

```
Trials: 20,000
Commutative  (merge(A,B) == merge(B,A)):                    20000/20000
Associative  (merge(merge(A,B),C) == merge(A,merge(B,C))):  20000/20000
Idempotent   (merge(A,A) == A):                              20000/20000
```

Commutative and associative together mean replicas can merge with each other in *any order, any number of times*, and always land on the same final state — no coordination protocol, no designated leader, no vector-clock comparison required to decide a winner, because there never is a "loser" to decide against. Idempotent means merging the same update twice (a message that got redelivered, say) causes no harm — a property plain arithmetic addition conspicuously lacks, which is exactly why the counter is built around `max` per slot instead of summing merged states directly.

A G-Counter only handles one specific shape of conflict: numbers that only ever go up, where "combine" obviously means "keep everyone's contribution." It says nothing about who gets to keep seat 114 when two people concurrently claim it — that conflict isn't a counting problem, and no merge function resolves it without a business rule (or a vote) deciding a winner. CRDTs are not a universal replacement for consensus; they're a trade — give up the ability to say "no" to a concurrent write, in exchange for a guarantee that whatever both sides did can always be combined later, *provided the operation is one that's actually safe to combine automatically in the first place.*

## Section Challenge

<details>
<summary><strong>Q1.</strong> TicketFast is building ticket scanning for venue entry gates — the scanner needs to keep accepting scans even if the venue's internet briefly drops, and it just needs to record which ticket IDs have been scanned. Should this use the Chapter 4/5 primary-backup cluster, or a multi-leader/leaderless design? Why?</summary>

Multi-leader (or fully leaderless) fits, and specifically because of the "keep working if the internet drops" requirement — that's an availability-during-partition demand, and §6.1 already showed primary-backup's answer to a lost connection is to simply stop: Chapter 5's failover only helps when the *primary itself* dies, not when a remote gate's link to a healthy, working primary goes down. If the venue's connection drops, a primary-backup design leaves the gate with no leader to write to and no legal way to accept a scan until connectivity returns — exactly the CP-flavored unavailability Chapter 2 named directly.

A multi-leader (or leaderless) design lets the gate's own local node keep accepting scans regardless of what's happening anywhere else, deferring reconciliation until the connection comes back. And "which ticket IDs have been scanned" is a strong candidate for §6.4's CRDT treatment specifically — it's a set that only ever grows (a ticket, once scanned, stays scanned), which is the same "only ever accumulates, never loses information" shape a G-Counter exploits, just for set membership instead of a count. The requirement — survive a dropped connection, no coordinator needed, nothing lost when reconnecting — points away from primary-backup's single point of write access and directly at exactly the design this chapter built to solve that problem.
</details>

<details>
<summary><strong>Q2.</strong> TicketFast configures a 5-node leaderless cluster with R=1, W=1 for maximum speed. Using §6.3's derivation, what is actually guaranteed, and what commonly-assumed guarantee is missing?</summary>

Nothing about freshness is guaranteed. Checking the derived condition directly: `R + W = 1 + 1 = 2`, and `2` is not greater than `N = 5` — this configuration fails the overlap requirement outright, the same shape as the table's `N=5, R=2, W=2` row (also `R+W ≤ N`), just with an even wider gap. A write only needs to reach 1 of the 5 replicas to succeed, and a read only needs to reach 1 of the 5 to answer — so a read is entirely capable of landing on one of the 4 replicas that never received the latest write, return confidently, and never surface any hint that a more recent value exists elsewhere in the cluster.

What TicketFast gets from `R=1, W=1` is real and not nothing: the fastest possible latency and the highest possible availability under this scheme, since a single reachable replica is enough for either operation to succeed. What's missing is the specific guarantee people tend to assume comes bundled with "the write succeeded" — that a subsequent read will see it. That guarantee is exactly what `R + W > N` buys, and this configuration is nowhere close to it.
</details>

<details>
<summary><strong>Q3.</strong> Every strategy in this chapter assumed each of the N replicas holds a full copy of TicketFast's entire dataset. What happens once the dataset is too large for any single node to hold, and does anything from this chapter — quorums, leaders, CRDTs — say which keys should live on which nodes?</summary>

Nothing in this chapter answers that, and it's worth being precise about why: this entire chapter has been about what happens *after* you already know which N nodes hold a copy of a given piece of data — how they stay consistent, how they handle conflicting writes, how a reader gets a trustworthy answer from them. It never addressed how those N nodes get *chosen* out of a much larger fleet, or what happens to that choice as the fleet grows or shrinks. Replication (this chapter) and partitioning — splitting the dataset itself across many nodes, rather than copying all of it to each — are separate, orthogonal concerns that combine in real systems (a typical design keeps, say, 3 replicas of *each* partition, using exactly the replication strategies just derived, once the partitioning decision has already been made).

That leaves a genuinely new problem: for a specific key, out of potentially thousands of nodes, which ones should store it — and can that assignment survive a node joining or leaving without reshuffling nearly everything else? Nothing about leaders, quorums, or CRDTs has an opinion on that question at all. That's exactly where Chapter 7 starts.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Primary-backup | What Chapters 4-5 already built — safe, simple, but write capacity is flat regardless of cluster size (verified: 1,000 writes/sec at N=1 *and* N=20) while read capacity scales linearly |
| Multi-leader | Fixes the write bottleneck by giving each region its own leader — but reopens concurrent-write conflicts; naive last-write-wins resolves them by reusing the untrustworthy wall-clock comparison Chapters 1-3 already discredited, and silently drops one write's effect every time (verified: 2 concurrent sales collapse to 1 under LWW) |
| Leaderless / quorum-based | No leader at all — any replica accepts writes; freshness depends on `R + W > N` so every read quorum is guaranteed to intersect every write quorum (verified exhaustively: 139/139 (N,R,W) combinations match the algebraic prediction, zero exceptions) |
| Quorum overlap's limit | Guarantees a stale-free response is *among* the R replies received — doesn't by itself say *which* one is freshest if they disagree; still needs Chapter 3's vector clocks (not wall-clock LWW) to resolve |
| CRDTs | Data types designed so any two divergent replicas merge automatically with nothing lost — G-Counter's per-node slots + elementwise-max merge verified commutative, associative, and idempotent across 20,000 randomized trials, and verified to fix the exact lost-update case that broke naive multi-leader replication |
| CRDTs' limit | Only work when the operation's semantics are actually mergeable (accumulating counts, grow-only sets) — don't resolve "who gets the one remaining seat," which still needs a business rule or a vote |

## Where We Go Next

Every strategy in this chapter assumed the N replicas involved each hold a complete copy of the same data — the only question was how they stay consistent with each other. That assumption stops holding the moment a dataset grows past what any single node can store, and TicketFast has to decide not just *how many* copies of a key to keep, but *which* nodes get to hold them in the first place — and what happens to that assignment when the cluster itself grows or shrinks. That's a genuinely different problem from anything replication solves, and it's where Chapter 7 begins: partitioning the data itself, and doing so in a way that doesn't require reshuffling almost everything every time a node joins or leaves.

*Next: [07_Partitioning_Consistent_Hashing.md](07_Partitioning_Consistent_Hashing.md)*
