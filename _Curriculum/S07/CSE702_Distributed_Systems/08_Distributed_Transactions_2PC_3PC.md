# Chapter 8 — Distributed Transactions: Two-Phase & Three-Phase Commit

> Two-Phase Commit doesn't fail because anyone implemented it wrong. It fails because it asks a question — is the coordinator merely slow, or truly gone? — that Chapter 1 already proved has no reliable answer, and then bets every participant's forward progress on guessing right anyway.

---

## The Problem

Chapter 7 closed on an operation Chapters 6 and 7 together can't safely execute: "transfer seat 114 from Order #4471 to Order #4988." Consistent hashing has likely placed those two orders on two different nodes entirely, and TicketFast also wants the change reflected in a third place — an audit log, for compliance, on a third node again. The requirement is exactly what the word "transaction" has always meant: all three nodes apply their piece, or none of them do. Order #4471 can't end up short a seat while Order #4988 never receives it; the audit log can't record a transfer that silently didn't happen.

Nothing about this requirement gets easier because the pieces now live on different machines — every failure mode Chapter 1 established is still fully in play. Any one of the three nodes can crash mid-operation. Any message between them can be delayed or lost, and — this is the crux of the whole chapter — a node waiting to hear from a silent peer still cannot tell "slow" from "gone" within any finite amount of waiting. Whatever protocol TicketFast builds has to produce all-or-nothing behavior across three independently-failing nodes, using only messages that can't be trusted to arrive.

## 8.1 Deriving the Requirement, and Why One Round Isn't Enough

Start with the simplest possible idea: the coordinator just tells every participant to do its part, and if one of them fails, tells the others to undo theirs. Look closely at what "undo" would have to mean here. The moment a participant is told to do its part and it succeeds, that's a real, finalized change — the seat really is gone from Order #4471's row, for real, in a form other transactions can already see. If a *different* participant then discovers thirty seconds later that it can't complete its own piece, "undo" isn't a clean cancellation anymore; it's a second, separate operation racing against whatever else might have read the first change in the meantime.

The fix is to stop conflating two different questions: *"are you able and willing to do this"* and *"actually do it, for real, right now."* Separate them into two rounds, and nothing commits for real until every participant has already answered the first question. That single restructuring — ask first, act only once everyone has agreed — is the entire idea behind Two-Phase Commit.

## 8.2 Two-Phase Commit, Derived

**Phase 1 (Prepare):** the coordinator asks every participant "can you commit this?" Each participant does everything short of making it permanent — acquires whatever locks it needs, writes its half of the change to a durable log — and replies YES (I can and will, if told to) or NO (I can't). Nothing is final yet; a YES is a promise, not an action.

**Phase 2 (Commit/Abort):** if every participant said YES, the coordinator tells all of them to finalize; if any said NO, it tells all of them to roll back. A participant that voted YES has already committed to obeying whatever the coordinator decides — that's the price of the promise made in Phase 1.

```
Coordinator: Prepare(txn='move seat 114') -> all participants
  Order-4471-node: acquires lock, writes prepare record, votes YES
  Order-4988-node: acquires lock, writes prepare record, votes YES
  Audit-node: acquires lock, writes prepare record, votes YES
Coordinator collects votes: all YES -> decision: COMMIT
  Coordinator -> Order-4471-node: COMMIT. Finalizes and releases its lock.
  Coordinator -> Order-4988-node: COMMIT. Finalizes and releases its lock.
  Coordinator -> Audit-node: COMMIT. Finalizes and releases its lock.
Transaction complete. No participant blocked.
```

Clean, and it's easy to see why 2PC is attributed independently to Butler Lampson and Howard Sturgis's 1976 Xerox PARC report *"Crash Recovery in a Distributed Data Storage System"* and Jim Gray's 1978 *"Notes on Data Base Operating Systems"* — separating "promise" from "act" is close to the only reasonable way to build cross-node atomicity at all. The question the happy path never has to answer is what any of the three nodes should do if the coordinator disappears in between the two phases.

## 8.3 When It Breaks: The Coordinator Crashes Mid-Decision

Run the identical transaction, but this time the coordinator crashes the instant after collecting all three YES votes — after deciding to commit, but before telling anyone:

```
Coordinator collects votes: all YES -> decides COMMIT
*** Coordinator CRASHES right here - before sending COMMIT to anyone ***

  Order-4471-node: still holding its lock in PREPARED state. Can it decide unilaterally?
    - Assume COMMIT? Unsafe: coordinator might have seen a NO from a participant this
      node doesn't know about, and decided ABORT.
    - Assume ABORT? Unsafe: other participants may have already been told COMMIT
      before the crash, and would now disagree.
    - Ask ANOTHER participant what it knows? No help - every participant only knows
      ITS OWN vote, never the coordinator's actual decision.
    -> Order-4471-node has no safe move. It waits, lock held, until the coordinator recovers.

Every one of the 3 participants is now blocked with no safe unilateral move.
```

Notice that asking a neighboring participant genuinely doesn't help, and it's worth seeing precisely why: each participant only ever learns its *own* vote. Comparing notes with Order-4988-node reveals "we both said yes" — which was already known — but says nothing about what the *coordinator* decided, since the coordinator might have heard a NO from a fourth, unknown participant, or crashed for reasons unrelated to any vote at all. The only node that ever held the actual decision is the one that's gone. Every participant is stuck holding its lock — and every subsequent operation that touches the same locked data queues up behind it, growing for as long as the coordinator stays down:

```
  outage (s)   mean queued requests   p95 queued
           1                    0.5            2
          10                    4.9            9
          60                   30.0           39
         300                  150.1          171
         600                  300.4          330
```

At a modest 0.5 requests/second touching the locked order, a ten-minute coordinator outage leaves roughly 300 requests stuck in a queue that only drains once a human restarts the coordinator — this is 2PC's actual, named failure mode: not "occasionally slow," but a queue with no natural ceiling, growing for as long as recovery takes.

## 8.4 Three-Phase Commit: Adding a Phase to Remove the Ambiguity

Trace the ambiguity in §8.3 to its exact source: "PREPARED" doesn't distinguish *"I voted yes, and so did everyone else"* from *"I voted yes, but I have no idea what anyone else said."* A participant stuck in that state genuinely cannot tell those two situations apart, and each one calls for the opposite action.

Dale Skeen's fix, published as *"Nonblocking Commit Protocols"* (SIGMOD 1981): insert an explicit **PreCommit** phase between Prepare and Commit, and — critically — have the coordinator send it *only* once every participant has voted YES. Reaching `PRECOMMITTED` is no longer a private belief about one's own vote; it's proof, delivered by the coordinator, that the *entire group* was ready. That proof is exactly what turns "ambiguous, must wait forever" into "resolvable on a timeout, safely, without the coordinator":

- A participant still in `PREPARED` when it times out can safely **ABORT** — nothing could possibly have committed, anywhere, without every participant first passing through PreCommit, which this node never received.
- A participant already in `PRECOMMITTED` when it times out can safely **COMMIT** — PreCommit is only ever sent after every participant said yes, so there's no scenario in which any peer needed to abort after reaching this same state.

Replay §8.3's exact crash — this time the coordinator gets as far as sending PreCommit to everyone before it dies:

```
Coordinator sees all YES -> sends PreCommit -> all participants
  Order-4471-node: receives PreCommit, state=PRECOMMITTED
  Order-4988-node: receives PreCommit, state=PRECOMMITTED
  Audit-node: receives PreCommit, state=PRECOMMITTED
*** Coordinator CRASHES right here - before sending the final Commit ***

  Order-4471-node: was PRECOMMITTED -> times out -> unilaterally COMMITs
  Order-4988-node: was PRECOMMITTED -> times out -> unilaterally COMMITs
  Audit-node: was PRECOMMITTED -> times out -> unilaterally COMMITs

All participants agree: True  (transaction completed correctly - coordinator never recovered)
```

Every participant reaches the same, correct decision, entirely on its own, and the queue from §8.3 never has the chance to form. The coordinator crash that permanently blocked 2PC resolves itself here in exactly one timeout interval.

## 8.5 When 3PC Still Breaks: Partitions, Not Just Crashes

Look at what the timeout rule in §8.4 actually assumes: that a participant timing out reliably means the coordinator (or a peer) is *gone*, not merely unreachable *right now*. Chapter 1 proved precisely this assumption doesn't hold — no timeout can distinguish "dead" from "partitioned but alive" in an asynchronous or partially synchronous network, which is the only kind that exists. Play the same scenario forward, but this time it's a genuine network partition, not a clean coordinator crash:

```
  Order-4471-node: receives PreCommit -> state=PRECOMMITTED
*** A network partition now separates Order-4471-node from the other two ***
*** ...and separately, the coordinator becomes unreachable to everyone ***
  Order-4988-node: PreCommit never arrives (partition) -> state stays PREPARED
  Audit-node:      PreCommit never arrives (partition) -> state stays PREPARED

  Order-4471-node: was PRECOMMITTED -> times out -> unilaterally COMMITs
  Order-4988-node: still PREPARED (never saw PreCommit) -> times out -> unilaterally ABORTs
  Audit-node: still PREPARED (never saw PreCommit) -> times out -> unilaterally ABORTs

Final decisions across all participants: {'Order-4471-node': 'COMMIT', 'Order-4988-node': 'ABORT', 'Audit-node': 'ABORT'}
All participants agree: False
*** SPLIT-BRAIN: part of the transaction committed, part aborted. ***
```

Every single participant followed its rule exactly as designed — nothing here is a bug in any individual node's logic. The rule itself was built on an assumption about timeouts that Chapter 1 already disproved in general, and Chapter 2 already named precisely: 3PC's non-blocking guarantee is a Consistency-vs-Availability choice wearing different clothes. It resolves 2PC's blocking (an Availability failure) by letting participants proceed on a timeout, but a real partition — which Chapter 2 already established is not optional to plan for — turns that same proceed-anyway rule into exactly the Consistency failure CAP's proof predicts. Three-Phase Commit doesn't defeat the CAP result; it just moves where, inside that trade-off, the failure shows up.

## 8.6 The Practical Answer: Sagas

Both 2PC and 3PC share a structural feature worth naming directly: every participant holds a lock, waiting on a decision that has to come from somewhere else, for the entire span between Prepare and the final outcome. That waiting window is exactly where both protocols' failures live. The alternative real systems reach for at scale doesn't try to make that window safer — it removes the window.

Instead of one distributed transaction spanning three nodes, break "move seat 114" into three small, independent **local** transactions, each of which commits immediately and permanently the moment it runs — no cross-node lock, no waiting on a remote coordinator's decision, ever. If a later step fails, don't roll anything back; run a **compensating transaction** that undoes the earlier step's effect with a new, separate operation. TicketFast's transfer becomes: (1) add the seat to Order #4988 — commits immediately; (2) remove the seat from Order #4471 — commits immediately; if step 2 fails for some reason, a compensating step (3) removes what step 1 just added, rather than any node ever holding a lock waiting to find out whether the other side succeeded.

This is the **Saga pattern**, already covered in full — choreography vs. orchestration, compensating-transaction design, the outbox pattern for reliably publishing the events that drive it — at [`10_Enterprise_Systems/09_Distributed_Patterns.md`](../../../10_Enterprise_Systems/09_Distributed_Patterns.md), and this chapter deliberately doesn't re-derive it. What's worth being explicit about here, using the vocabulary this chapter just built: a saga is not a loophole in anything Chapters 2 or 8 proved. It's a decision to give up strong, moment-to-moment atomicity (there's a real, visible window where seat 114 is on both orders, or neither) in exchange for never blocking and never needing a coordinator at all — the same Consistency-for-Availability trade Chapter 2 named from the very first partition scenario, chosen deliberately here instead of arrived at by accident under a crash.

## Section Challenge

<details>
<summary><strong>Q1.</strong> In 2PC, what happens if a PARTICIPANT (not the coordinator) crashes after voting YES, then later recovers? Is this the same blocking problem as §8.3, or something else entirely?</summary>

Something meaningfully less severe. The coordinator is still alive in this scenario — it collected every vote and made an actual decision — so when the crashed participant recovers, it has a real source of truth to ask: it queries the coordinator directly for the outcome of this specific transaction, and gets an immediate, correct answer, because the coordinator has known the decision the entire time. The delay is bounded by how long that one participant took to recover, and it resolves the instant it's back online — nothing about it grows unboundedly the way §8.3's queue did.

§8.3's blocking failure specifically requires that the *one* node holding the actual decision — the coordinator — is the one that's unreachable. A participant crashing is recoverable because the information needed to recover was never lost; a coordinator crashing (before broadcasting its decision) is unrecoverable by the participants alone because the information genuinely doesn't exist anywhere else. Precisely locating the single point of failure this way is what makes it possible to see exactly what §8.4's PreCommit phase needs to fix: making sure that critical piece of information — "everyone was ready" — gets copied out to the participants themselves before the coordinator is allowed to become the only copy of it.
</details>

<details>
<summary><strong>Q2.</strong> A team says: "We've deployed Three-Phase Commit, so we've eliminated Two-Phase Commit's blocking problem, full stop." Is that claim accurate?</summary>

Overclaimed. It's accurate for the specific failure §8.4 targeted — a coordinator that crashes cleanly, in a network well-behaved enough for timeouts to mean what they're assumed to mean — and the chapter's own trace confirmed that case resolves correctly, without the coordinator, in one timeout interval. But §8.5 showed concretely that a genuine network *partition*, as opposed to a clean crash, can still produce an outcome from 3PC — just possibly the *wrong* one: a real split-brain where part of the transaction commits and part aborts, with every participant behaving exactly according to its rule.

The precise, defensible claim is narrower than "eliminated": 3PC trades one failure mode for a different one, rather than removing failure from the picture. 2PC fails by refusing to proceed without certainty (safe, but can block forever). 3PC fails by proceeding on a timeout regardless of whether that certainty actually exists (makes progress, but can be wrong when the timeout's core assumption — that "silent" means "gone" — turns out false). Chapter 2 already proved there's no way to have both guarantees unconditionally during a real partition; 3PC picked the opposite point on that same trade-off from 2PC, not a way around it.
</details>

<details>
<summary><strong>Q3.</strong> Sagas never hold a cross-node lock waiting on a remote decision. Does that mean sagas found a loophole in the CAP/FLP-style impossibilities this course has built up since Chapter 1, or are they making the same trade-off in a different place?</summary>

The same trade-off, relocated — not a loophole. Sagas buy their non-blocking behavior by giving up exactly the property that made 2PC and 3PC hard in the first place: the appearance, to any outside observer, that a multi-node operation happens as one indivisible instant. §8.6's own example has a real window where seat 114 sits on both orders, or on neither — a window in which the system is, by Chapter 2's precise definition, not linearizably Consistent, in exchange for never becoming Unavailable while waiting on a remote coordinator's decision.

That's the identical C-vs-A trade this course has been re-deriving since TicketFast's very first split-brain ticket sale in Chapter 2 — sagas just choose the Availability side up front, deliberately and by design, where 2PC chose the Consistency side up front (block rather than risk disagreement) and 3PC tried to have it both ways and inherited a partition-shaped failure for the attempt. Nothing in this course's arc — CAP, FLP, quorum overlap, the commit-index safety rule, this chapter's blocking proof — was ever a puzzle with a hidden trick that makes the trade-off disappear. Every protocol from Chapter 2 onward is a different, deliberate answer to the same question a real network forces on every distributed system that touches more than one machine: when you cannot have both safety and progress at the same instant, which one gives way, and for how long are you willing to let it?
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The requirement | An operation touching multiple independently-partitioned, independently-failing nodes must succeed everywhere or nowhere — using only messages Chapter 1 already proved can't be trusted to arrive |
| Why one round isn't enough | A finalized local commit isn't cleanly reversible — "can you do this" and "actually do this" have to be separated into two rounds before anything becomes permanent |
| Two-Phase Commit | Prepare (tentative, reversible, gather votes) then Commit/Abort (final, based on the vote) — correct and simple on the happy path (Lampson & Sturgis 1976; Gray 1978) |
| 2PC's blocking failure | If the coordinator crashes after deciding but before informing anyone, every participant is stuck — none can safely guess COMMIT or ABORT, and none can learn the decision from a peer, since no peer ever knew it either. Verified: an outage of minutes turns into hundreds of queued, blocked follow-on requests |
| Three-Phase Commit's fix | An explicit PreCommit phase, sent only once every participant is ready, gives participants *proof* the whole group was ready — turning an unresolvable ambiguity into a safe timeout rule (Skeen, 1981). Verified: the identical coordinator-crash scenario resolves correctly without the coordinator |
| 3PC's remaining failure | The timeout rule assumes silence reliably means "gone," which Chapter 1 already disproved — a genuine partition (not just a crash) can produce a real split-brain: part of the transaction commits, part aborts, with every node following its rule correctly. This is Chapter 2's CAP result, not a new phenomenon |
| Sagas | The practical answer at scale: small local transactions that commit immediately, undone by compensating transactions if a later step fails — no cross-node lock, no coordinator, at the cost of a real, visible window of partial state. Same C-vs-A trade as the rest of the course, chosen deliberately rather than hit by accident (full treatment: `10_Enterprise_Systems/09_Distributed_Patterns.md`) |

## Course Wrap-Up

Eight chapters ago, this course started from a single observation: split a working program across a network, and you introduce a kind of uncertainty no single machine ever has to live with — silence that might mean "dead" or might mean "slow," with no way to tell which inside any finite wait. Everything since has been the same fact, examined from a different angle each time. CAP turned it into a proof about what a network partition forces you to give up. Logical clocks turned it into a proof about what "happened before" can and can't mean across machines. Paxos and Raft turned it into a proof about how many independently-failing votes it actually takes to agree on one thing safely. Replication and partitioning turned it into a set of concrete trade-offs about who gets to write, and where data lives. This chapter turned it into a proof about why atomicity itself — the most basic transactional guarantee there is — gets genuinely harder, not just more annoying, the moment it has to span more than one machine.

None of that uncertainty ever went away over the course of these eight chapters, and it was never going to — that was the whole point of starting with Chapter 1's impossibility results instead of ending with them. What changed, chapter by chapter, was TicketFast's ability to *name* the trade-off precisely enough to choose it on purpose, instead of discovering it during an outage. That's the actual skill this course was built to teach: not a way around the uncertainty distributed systems live with, but the vocabulary and the derivations to see exactly where it's going to bite, and decide — deliberately, in advance — which failure mode you'd rather have.

Two threads from the course syllabus deliberately aren't in these eight chapters: event-driven architecture with Kafka, and Domain-Driven Design, Event Sourcing, and the Saga pattern in full (weeks 7–10). They're not missing — they're covered in depth at [`10_Enterprise_Systems/`](../../../10_Enterprise_Systems/), which this course's README links directly, and §8.6 leaned on that material rather than duplicating it. Read there for the rest of the syllabus; the eight chapters here are the foundation everything in that material assumes you already have.
