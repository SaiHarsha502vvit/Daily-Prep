# Chapter 2 — The CAP Theorem: Proof and Practical Trade-offs

> "Pick two of three" makes CAP sound like a menu. It isn't — partition tolerance was never actually on offer, because real networks partition whether you order it or not. The only decision left is what your system does in the seconds after one happens.

---

## The Problem

TicketFast runs a flash sale for a stadium show: 40,000 seats, one remaining-seat counter per section, and a userbase spread across a continent. To keep checkout latency low, TicketFast replicates each section's counter to a node in US-East and a node in US-West, and routes each buyer to whichever region is closer. On a good day, both nodes agree on every counter within milliseconds of each other, and nobody notices there are two of them.

Then a backbone router between the coasts drops offline for ninety seconds — long enough for both regions to keep serving buyers, short enough that nobody pages anyone. Section 114 has exactly one seat left. In that ninety-second window, a buyer in Atlanta hits the US-East node and a buyer in Seattle hits the US-West node at nearly the same instant. Each node can see its own copy of the counter — it reads 1 — and each node has to decide, right now, with no way to ask the other side what it thinks: sell the seat, or don't?

This isn't a bug fixable with more careful code. It's a structural fact about what a node can and can't know about a partner it currently cannot reach. Whatever TicketFast's engineers decide — sell now and reconcile later, or refuse to sell until the network heals — they are making the same decision every distributed system with replicated state eventually has to make, whether they name it or not. The CAP theorem is the precise version of that decision, plus a proof that there was never a way to dodge making it.

## 2.1 Naming the Three Properties Precisely

"Consistency" and "availability" are two of the most overloaded words in computing, so the theorem only means something once they're pinned to the specific technical claims the proof in §2.3 actually uses:

- **Consistency (C)**, here, means *linearizability*: every read returns the result of the most recent completed write, as if there were only one copy of the data and every operation executed atomically in real-time order. This is a strong guarantee — stronger than the "C" in ACID, which is about constraints holding, not about replicas agreeing.
- **Availability (A)** means every request to a node that is up and reachable by *some* client must eventually receive a non-error response — a promise about *whether* the node answers, not about what the answer says.
- **Partition tolerance (P)** means the system keeps operating — nodes keep accepting requests — even when an arbitrary number of messages between them are dropped or arbitrarily delayed.

The theorem's claim: no system can guarantee all three simultaneously. Not "it's hard" and not "nobody's built it yet" — provably impossible, the way you provably cannot 2-color a triangle's vertices so that no edge joins two same-colored ones. §2.3 gives the actual proof, but the shape is worth previewing here: once a partition is real — messages genuinely are being dropped — an available node has to answer from local information alone, and local information alone cannot reflect a write that the partition is actively hiding from it. No cleverness gets around that; it's a statement about what information physically exists at a location, not about algorithm quality.

## 2.2 Partition Tolerance Isn't a Choice You Get to Make

The term "CA system" shows up occasionally, describing something that promises Consistency and Availability while implicitly not tolerating partitions. Chapter 1 already named why that's a fragile framing rather than a legitimate third option: fallacy #1 is "the network is reliable," and it's false of every real network, not just the unreliable-looking ones — cables get backhoed, switches run out of buffer, routers misapply a VLAN change, an availability zone loses power. Given long enough, a partition happens. Given a large enough fleet, it happens often.

So "CA" doesn't describe a system that solved partitioning — it describes a system that hasn't had one yet, running on a network that will eventually deliver one anyway. The design decision was never "should I tolerate partitions" (there's no vote), it's "what do my nodes do in the finite number of seconds where a partition is actually in progress." That reframes the theorem from "pick 2 of 3" into something sharper: **partition tolerance is mandatory, and the theorem is really a statement about what you give up — C or A — during the partition window, and only during that window.** Outside of a partition, nothing stops a system from offering both at once — which is exactly the gap PACELC exists to describe (§2.7).

## 2.3 The Impossibility, Traced Mechanically

Strip the ticket-sales story to its smallest possible version: two nodes, A and B, each holding a copy of a single register `x`, connected by a network that a partition can sever. A client writes `v1` to A. For the two replicas to stay consistent, that write has to reach B — but the partition is, by definition, a promise that some messages don't arrive, and this one doesn't:

```
A commits write x=v1 locally. Propagation to B delivered? False
```

Now a second client, unaware of the first, reads from B. Availability says B must respond — not eventually, not once the network heals, but now, because now is the only time this client is asking. B has exactly one thing it's allowed to consult: its own local copy, which still reads `v0`, because the message telling it about `v1` never arrived and, under a genuine partition, might not arrive for an unbounded amount of time.

```
Client reads from B (must respond now if system is Available): x = 'v0'
B's answer matches the latest committed value on A? False
=> Consistency violated: True  (B was Available but not Consistent)
```

That's the whole proof, once it's laid out this way. It isn't a proof about a clever protocol failing — no protocol even runs here, just two nodes and one dropped message — it's a proof that **the information B needs to answer correctly is not physically present at B**, and Availability forbids B from waiting for it to arrive. The only way out is to shrink one of the two promises: let B decline to answer (give up A), or let B answer possibly-wrong (give up C). This is exactly the trade Eric Brewer's July 2000 PODC keynote, *"Towards Robust Distributed Systems,"* named — Brewer presented it as a conjecture drawn from operating large systems at Inktomi, not yet a formal theorem — and it's exactly what Seth Gilbert and Nancy Lynch proved rigorously two years later in *"Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services"* (ACM SIGACT News, 2002), generalizing essentially the argument traced above for both the asynchronous and partially synchronous network models from Chapter 1.

## 2.4 Worked Example: Overselling the Last Ticket

Back to Section 114's last seat, now with actual code standing in for TicketFast's two nodes. Both start with `value = 1` (one seat left, synced before the partition):

```
Before partition: A.value = 1  B.value = 1
--- network partition begins: A and B cannot exchange messages ---
Alice -> Node A: SOLD  (A.value now 0)
Bob   -> Node B: SOLD  (B.value now 0)
--- partition heals, nodes exchange logs ---
A.log: [('Alice', 'SOLD', 0)]
B.log: [('Bob', 'SOLD', 0)]
Both sales succeeded (oversold the single ticket): True
```

Both Alice and Bob get a confirmation email claiming seat 114. When the partition heals and the two logs merge, TicketFast has sold the same physical seat twice — not because of a bug, but because both nodes did exactly what an Available system is supposed to do: answer the request in front of them, right away, using the only information available. This is what choosing Availability over Consistency looks like while a partition is actually happening, not as a hypothetical.

Choosing Consistency over Availability instead looks like this:

```
Alice -> Node A: SOLD
Bob   -> Node B: UNAVAILABLE (refused to answer without quorum)
```

Node A still sells to Alice — nothing stops whichever side got there first — but Node B, unable to confirm with A that the seat is still free, refuses to answer at all rather than risk selling something that might already be gone. Bob sees a spinner, then an error. No overselling — but a live, healthy node just told a paying customer "no" while holding data that might well have been correct. Both outcomes are legitimate engineering choices. Neither one "solves" the problem; each simply picks which failure mode TicketFast would rather explain to a customer.

## 2.5 The Real Choice: CP vs AP Systems

Reframed this way, CAP is really a per-system, per-partition-window policy: what does a node do when it cannot reach its peers? Two answers dominate real deployments:

- **CP (consistency over availability):** a node that cannot confirm it holds a majority/quorum view of the data refuses writes — and often reads — rather than risk serving something stale or conflicting. ZooKeeper and etcd are built this way: both are coordination services used specifically because callers need one agreed-upon answer, and a minority-side node going silent is a safer failure than a minority-side node lying. Chapters 4 and 5 (Paxos, Raft) are the machinery that makes "confirm a majority" concrete.
- **AP (availability over consistency):** every reachable node keeps answering through the partition, and conflicts — like Section 114's double sale — get detected and reconciled after the fact instead of prevented up front. Cassandra and Riak default to this; Amazon's Dynamo design (Chapter 6) was built explicitly around it, on the reasoning that for a shopping cart, "add the item now, sort out duplicates later" loses less revenue than "sorry, try again."

Neither list is exhaustive, and most production systems are tunable rather than fixed — Cassandra, for instance, lets a query dial its own consistency level, shifting the same cluster between CP-like and AP-like behavior per request. What doesn't move is the underlying constraint: whichever way a system leans, that choice is only ever exercised *during* an actual partition. Outside of one, nothing is forcing the trade-off — which is exactly why §2.7 needs to explain what's still being traded away even then.

## 2.6 When It Breaks: Even-Sized Clusters and the Quorum Trap

CP systems avoid double-selling by requiring a **majority** of nodes to agree before accepting a write — strictly more than half, not just "more than the other side." That word, majority, has a sharp edge that catches teams who assume "more replicas is always safer." Split a cluster of size N into the most even halves a partition could produce, and check whether the larger half actually clears the majority bar:

```
  N  majority needed   even split  larger side  has majority?
  2                2          1-1            1          False
  3                2          2-1            2           True
  4                3          2-2            2          False
  5                3          3-2            3           True
  6                4          3-3            3          False
  7                4          4-3            4           True
  8                5          4-4            4          False
```

Every even N has a reachable split — the perfectly even one — where *neither* side clears the majority bar, so both halves go read/write-unavailable at once. That's strictly worse than the odd-N case, where an even split is impossible and the network can only ever divide unevenly, leaving exactly one side with a majority. This isn't just a theoretical worst case, either: a cluster deployed two nodes per datacenter across two datacenters (N=4) splits exactly 2-2 the moment the inter-DC link drops — precisely the reachable, everyday failure the table flags as unsafe. The degenerate extreme is N=2: majority of 2 is 2, so *any* partition at all — even one dropped heartbeat — leaves neither node able to prove it holds a majority, and a correctly-implemented CP system built on two nodes goes fully unavailable the instant its one link hiccups. This is exactly why quorum-based systems (Chapters 4 and 5) are built on odd cluster sizes — 3, 5, 7 — not because more nodes are inherently better, but because odd sizes are the only sizes where a majority is guaranteed to survive on *some* side of every possible split.

## 2.7 PACELC: The Trade-off With No Partition In Sight

§2.2 narrowed CAP down to "C vs A, and only during a partition." That narrowing is accurate, but it leaves something out: TicketFast's nodes make a consistency-related trade-off on every single write, including all the ones on all the days nothing is partitioned at all. Daniel Abadi named this gap PACELC, formalized in *"Consistency Tradeoffs in Modern Distributed Database System Design"* (IEEE Computer, 2012): **if Partitioned, choose A or C; Else — the normal case — choose Latency or Consistency.** The "Else" half is the part CAP is silent about, and it's in effect almost all the time, since partitions are rare compared to ordinary operation.

Here's the mechanism, with no partition anywhere in it. When node A accepts a write, it can handle replication to B two ways: wait for B to acknowledge before telling the client "done" (synchronous — the client's write is now guaranteed visible to a subsequent read on B, at the cost of a network round trip), or tell the client "done" immediately and replicate to B in the background (asynchronous — fast, but a read landing on B in the next few milliseconds can still see the old value). Simulated over 200,000 writes, with same-region replication delay modeled as exponential with a 4ms mean (a realistic inter-AZ figure) and a 0.3ms local fsync for the async path's client-facing ack:

```
SYNCHRONOUS replication (Consistency-favoring):
  p50 latency = 5.533 ms
  p99 latency = 36.721 ms
ASYNCHRONOUS replication (Latency-favoring):
  p50 latency = 0.208 ms
  p99 latency = 1.365 ms
  median speedup of async over sync: 26.59x
  reads landing on replica before replication catches up: 114,613/200,000 (57.31%) -> STALE READ
```

Async replication is roughly 27x faster at the median here — a real, permanent latency win a system can bank on every single request, partition or not. It's paid for by more than half of the reads that happen to land on the replica shortly after a write genuinely seeing stale data, not because anything failed, but because the background copy hadn't caught up yet. That's the ELC trade in full: not a rare edge case triggered by an outage, but a dial every replicated system is turning on every write it ever processes — and CAP alone, being entirely about partitions, has nothing to say about it.

## Section Challenge

<details>
<summary><strong>Q1.</strong> TicketFast's engineers propose: "Our database has 5 replicas and requires a majority — 3 of 5 — to accept a write, so during any partition, at most one side can accept writes. We've solved consistency AND we're always available, because <em>some</em> side is always up." Evaluate the claim.</summary>

The consistency half is correct and follows directly from §2.6's table: with N=5, the most even split a partition can produce is 3-2, and only the 3-side clears the majority bar of 3, so at most one side ever accepts writes — no two disjoint majorities of a 5-node set can both reach 3 nodes at once (that would need 6 nodes), so split-brain is genuinely impossible here. That part of the reasoning is sound.

"We're always available" is where the claim breaks, and it breaks on the precise definition from §2.1: Availability requires that *every request to a reachable node* gets a non-error response — not that *some node somewhere* is answering. A client routed to one of the 2 nodes on the minority side of the partition is talking to a live, healthy, reachable machine that is refusing to answer. From that client's point of view, the system is unavailable, full stop — the fact that the *other* 3 nodes are happily serving *other* clients doesn't change what this client experienced. What TicketFast has actually built is a textbook CP system: consistent everywhere, available only to the subset of clients whose requests happen to land on the majority side during a partition. That's a perfectly reasonable design — it's just not "solved availability," and describing it that way would badly mislead whoever's deciding whether this database is the right choice for a use case that can't tolerate a partial outage.
</details>

<details>
<summary><strong>Q2.</strong> A junior engineer says: "Let's just always use synchronous replication everywhere — the 27x latency cost in §2.7's simulation is worth it, since consistency bugs are worse than a slow request." Does switching every write to synchronous replication let TicketFast escape the CAP trade-off from §2.3 entirely — consistency with no availability cost, ever?</summary>

No — it just moves where TicketFast sits inside the trade-off, and pays for it differently depending on whether a partition is happening. Outside of a partition, "always synchronous" is a legitimate ELC choice: it makes the Latency cost from §2.7 permanent and unconditional in exchange for every read seeing every prior write, no staleness window at all. That part genuinely works, and for some data (TicketFast's seat counters, arguably) it's the right call.

But the moment an actual partition hits — B genuinely unreachable from A — "wait for B's acknowledgment before confirming the write" cannot be honored anymore, because B's ack is exactly the message §2.3 proved might never arrive. At that instant, "always synchronous" faces the identical dilemma the impossibility proof describes: either A blocks the client indefinitely waiting for an ack that may never come (giving up Availability), or A gives up and answers without it (falling back to exactly the async, possibly-stale behavior it was built to avoid, giving up Consistency). Synchronous replication is a *specific, permanent choice* of where to sit on the ELC side of PACELC — it doesn't touch the PC side at all, and §2.3's proof doesn't care what replication policy a system normally runs; it only cares what happens when a promised acknowledgment provably cannot arrive. There's no configuration flag that unproves a proof.
</details>

<details>
<summary><strong>Q3.</strong> After the partition heals, TicketFast's on-call engineer is reconciling the double-sold seat 114. Node A's log timestamps Alice's sale at 14:02:03.100 (A's local clock). Node B's log timestamps Bob's sale at 14:02:03.050 (B's local clock) — 50ms earlier. Can the engineer conclude Bob has the "real" claim to the seat because his purchase happened first? What would actually be needed to answer that question?</summary>

No, and for two separate reasons stacked on top of each other. The first is the one Chapter 1 already established: A's and B's clocks are two independent, unsynchronized physical clocks, each subject to its own drift and NTP correction, so a 50ms gap between two *different machines'* timestamps proves nothing about which event a neutral observer would call "first" — it might just as easily be measuring which machine's clock runs fast.

The second reason goes further than Chapter 1 did: even a hypothetical, perfectly synchronized wall clock wouldn't fully save this reconciliation, because Alice's and Bob's purchases weren't just *hard to compare* — per §2.3 and §2.4's trace, neither node knew about the other's write when it happened. They were **concurrent**: two events with no causal relationship between them, neither influencing nor aware of the other, occurring independently on two sides of a severed network. That's a fundamentally different situation from one event genuinely causing or following another, and no timestamp — however precise, however well-synchronized — can legitimately assign a "before" or "after" to two events that didn't actually have one. What TicketFast's engineer needs isn't a better clock; it's a way to derive order from causality itself — from what each node had actually seen when it acted — and, just as importantly, a way to *detect* that two events are concurrent rather than force a false ordering onto them. That is exactly the gap Chapter 3's logical clocks and vector clocks are built to close.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Consistency (C), precisely | Linearizability — every read reflects the most recent completed write, as if there were a single copy of the data |
| Availability (A), precisely | Every request to a reachable, non-crashed node gets a non-error response — a promise that it answers, not about what the answer says |
| Partition tolerance (P) | Not a design choice — real networks drop messages (Ch1 fallacy #1), so P is a fact you survive, not a feature you opt into |
| The impossibility | Once a message is provably undelivered, an available node must answer from local information alone, which cannot reflect a write the partition is hiding — proven mechanically (Brewer 2000, formalized by Gilbert & Lynch 2002) |
| CP vs AP | The real decision: refuse to answer without a quorum (CP — ZooKeeper, etcd) vs. answer regardless and reconcile later (AP — Cassandra, Dynamo) |
| Even-sized clusters | An even N has a reachable split where *neither* side has a majority — both halves go unavailable at once; a 2-node cluster is unavailable on any partition at all. Odd N guarantees exactly one side survives every split |
| PACELC | The trade-off CAP doesn't cover: even with zero partitions, synchronous replication buys consistency at a steep, permanent latency cost (~27x slower at the median here); asynchronous buys speed at the cost of a real, measurable stale-read rate (57.3% of reads in the simulated window) |

## Where We Go Next

This chapter settled what happens when two replicas disagree about who saw what — but the reconciliation TicketFast's engineer actually needs to run (did Alice's sale or Bob's sale happen first, or did they happen genuinely at the same time?) can't be answered by wall clocks, and Chapter 1 already showed why physical clocks fall short. What's needed is a way to derive event order from causality itself — from what each node actually knew when it acted — rather than from clocks that were never synchronized to begin with, and a way to tell the difference between "one caused the other" and "neither knew about the other." That's the gap logical clocks are built to close.

*Next: [03_Logical_Clocks_Lamport_Vector.md](03_Logical_Clocks_Lamport_Vector.md)*
