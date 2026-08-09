# Chapter 5 — Consensus II: Raft

> Paxos proves that a small set of rules is enough for safety, and stops there. A proof doesn't have to answer a second question: is it enough for an engineer to hold the whole thing in their head during a 2 AM incident, and still get it right?

---

## The Problem

Chapter 4 gave TicketFast's five-node coordination cluster a real safety proof — zero violations across 20,000 adversarial trials — but left two complaints on the table. First, 128 of those trials (0.64%) never reached a decision at all: dueling proposers kept pre-empting each other's proposal numbers before either finished, and Basic Paxos, as derived, has no built-in way to reduce how many nodes try to propose at once. Second, the engineers actually maintaining this thing find it genuinely hard to reason about: the algorithm has no notion of "who's in charge," so understanding any given failure means reconstructing which proposal numbers which nodes had promised, from scratch, every time.

In 2014, Diego Ongaro and John Ousterhout published *"In Search of an Understandable Consensus Algorithm"* at the USENIX Annual Technical Conference (it won Best Paper) with exactly this complaint as its stated motivation — not "Paxos is incorrect," but "Paxos is needlessly hard to teach, implement, and reason about," and they set out to design something that reached the same safety guarantee through a structure a working engineer could actually hold in their head. The result was Raft. TicketFast's engineers want to know: what would consensus look like if a single leader were an explicit, first-class part of the algorithm from the start, rather than a patch bolted on after the fact?

## 5.1 Same Guarantee, Different Shape: Why a Leader Helps

Look at what Paxos's Prepare/Promise phase is actually *for*: discovering whether some other proposer might already have gotten a value chosen, so a new proposer doesn't blindly overwrite it. That entire discovery step exists to handle multiple, uncoordinated proposers. Remove that condition — designate exactly *one* node the leader, and make every other node refuse to propose anything at all while a leader is healthy — and the discovery problem doesn't need solving on every single decision anymore, because there's only ever one node deciding.

That single change splits consensus into two narrower, separable questions instead of one tangled two-phase dance: **(1) how do all the nodes safely agree on who the one leader is**, including when nodes disagree, timeouts fire, or the old leader isn't really dead but just slow, and **(2) once there is a single leader, how does it safely replicate a growing sequence of decisions** — not one isolated value, but an ordered log of them — to the rest of the cluster? Raft is built as exactly these two mechanisms, **leader election** and **log replication**, plus one safety rule connecting them. Each piece maps to a real, separable sub-problem instead of Paxos's single, harder-to-decompose proof — which is precisely the "understandability" Ongaro and Ousterhout were after.

## 5.2 Deriving Leader Election: Why a Fixed Timeout Guarantees Deadlock

Start with the obvious mechanism: every follower runs a timer, and if it hears nothing from a leader before the timer expires, it assumes the leader is dead and starts an election. What should that timer's length be? Try the simplest possible answer first: the *same* fixed value on every node. Simulate a leader dying and all five followers racing to notice, 100,000 independent trials:

```
fixed (all 5 nodes share one fixed timeout): clean single-winner rounds = 0/100000 (0.00%)
fixed: over 5,000 independent election sequences (retry until a round produces 1 winner, cap 50 rounds)
       -> never succeeded within 50 rounds: 5000/5000
```

Zero successes — not "rare," *zero*, across 100,000 single-round trials and 5,000 full retry-sequences capped at 50 attempts each. Here's why it's not a matter of bad luck: with an identical fixed timeout, every follower's timer expires at *exactly* the same simulated instant the leader goes silent, so all five become candidates simultaneously, every single round, forever. There is nothing in the next round to break the tie either — the timeout is still identical, so the same five-way simultaneous candidacy repeats. This is dueling proposers from Chapter 4, but worse: Paxos's version was a probabilistic nuisance that occasionally stalled a round; a fixed election timeout stalls *every* round, permanently, by construction.

## 5.3 The Fix: Randomized Timeouts, and How Much Randomness Is Enough

Break the symmetry: give each follower its own randomly-chosen timeout instead of a shared fixed one, so that with high probability exactly one node's timer fires first and it gets a head start collecting votes before anyone else even notices the leader is gone. "Add randomness" isn't yet a complete answer, though — *how much* randomness actually matters, and it's worth quantifying rather than asserting. Measured across 100,000 trials each, widening the range from two possible timeout values up to the actual range the Raft paper specifies (150–300ms):

```
coarse2    (2 discrete timeout values):   clean single-winner rounds = 57,212/100,000 (57.21%)
coarse5    (5 discrete timeout values):   clean single-winner rounds = 91,702/100,000 (91.70%)
raft_range (randint(150,300), the paper's actual range): clean single-winner rounds = 99,988/100,000 (99.99%)
```

And the practical consequence — how many election rounds a cluster actually burns through before a leader emerges, retrying with fresh random timeouts each time a round fails:

```
coarse2:     avg rounds to succeed = 1.749   (0/5,000 sequences ever failed to converge within 50 rounds)
raft_range:  avg rounds to succeed = 1.000   (0/5,000 sequences ever failed to converge within 50 rounds)
```

Both randomized settings eventually converge — unlike the fixed case, nothing here can deadlock forever — but a narrow range (`coarse2`) wastes almost three-quarters of a round on average re-running failed elections, while the paper's actual 150–300ms range succeeds on essentially the first attempt every time. This is a genuine, tunable trade-off, not a solved problem with one correct answer: too narrow a range and collisions eat into availability during every failover; too wide a range and the cluster sits leaderless longer than it needs to before even *starting* to elect (since every follower is, by design, waiting out at least its own randomly-chosen delay). 150–300ms is Ongaro and Ousterhout's own empirically-chosen point on that curve, not a value derived from first principles — and the 99.99% figure above is exactly why it was a good one.

## 5.4 The Election Restriction: Never Elect a Leader Missing Committed Data

Randomized timeouts solve *contention* — who gets to run for leader without everyone colliding. They say nothing about *safety* — whether the node that wins is actually fit to lead. A node that's been partitioned away for the last ten log entries could, in principle, have the shortest timeout and win a fair, uncontested election; if it's then allowed to start dictating the log, whatever it's missing gets treated as if it never happened.

Raft closes this with a rule attached directly to voting, not to the leader once elected: a node must refuse to vote for a candidate whose log is *less up to date* than its own. "Up to date" is decided by comparing each side's last log entry — first by **term** (a higher term always wins the comparison, regardless of length), and only if terms are equal, by **length** (the longer log wins). A candidate that fails this check against a given voter simply doesn't get that voter's vote, no matter how early its timeout fired. Section 5.6 is built entirely around why the term comparison has to come *first* — it looks like a minor tiebreak rule right up until it's the only thing standing between a cluster and silently losing data.

## 5.5 Worked Trace: Electing a Leader and Replicating a Log

Five nodes. Node 1 wins a clean term-1 election (the mechanism from §5.2–5.3), then the client sends three commands:

```
Leader appends (1,'RESERVE-201') at index 1, replicates to {2,3,4} (Node 5 misses it - network lag)
Leader appends (1,'SELL-201')    at index 2, replicates to {2,3,4} (Node 5 misses it)
Leader appends (1,'REFUND-114')  at index 3, replicates to {2,3,4} (Node 5 misses it)
Commit index after all 3: index 3 (each entry independently reached a majority of {1,2,3,4} = 4/5)

  Node 1: [1:RESERVE-201, 1:SELL-201, 1:REFUND-114]
  Node 2: [1:RESERVE-201, 1:SELL-201, 1:REFUND-114]
  Node 3: [1:RESERVE-201, 1:SELL-201, 1:REFUND-114]
  Node 4: [1:RESERVE-201, 1:SELL-201, 1:REFUND-114]
  Node 5: []
```

Node 5 is a legitimately lagging follower — nothing is wrong with it, it's just been missing every AppendEntries. Node 1 now crashes. Suppose Node 5's randomized timeout happens to fire *first*:

```
Node 2 (log len 3, last term 1) receives RequestVote from Node 5 (log len 0, last term 0): REFUSES (Node 5 is less up to date)
Node 3 (log len 3, last term 1) receives RequestVote from Node 5 (log len 0, last term 0): REFUSES
Node 4 (log len 3, last term 1) receives RequestVote from Node 5 (log len 0, last term 0): REFUSES
Node 5 collects 1/5 votes -> election fails, Node 5 cannot become leader
```

§5.4's rule does exactly its job: being first to time out buys Node 5 nothing, because every voter it asks can see its log is behind and refuses on those grounds alone. Node 2 (holding the fullest log) runs next:

```
Node 3 receives RequestVote from Node 2: GRANTS
Node 4 receives RequestVote from Node 2: GRANTS
Node 5 receives RequestVote from Node 2: GRANTS
Node 2 collects 4/5 votes -> ELECTED
```

Node 2, now leader, reconciles Node 5's log by replicating its own via AppendEntries:

```
  Node 1: [1:RESERVE-201, 1:SELL-201, 1:REFUND-114]
  Node 2: [1:RESERVE-201, 1:SELL-201, 1:REFUND-114]
  Node 3: [1:RESERVE-201, 1:SELL-201, 1:REFUND-114]
  Node 4: [1:RESERVE-201, 1:SELL-201, 1:REFUND-114]
  Node 5: [1:RESERVE-201, 1:SELL-201, 1:REFUND-114]
All live nodes now hold an identical log: True
```

No data lost, no conflicting log ever accepted — the crash cost the cluster one election's worth of latency and nothing else.

## 5.6 When It Breaks: Why a Majority Isn't Always Enough to Commit

Here's a scenario, structurally identical to the Raft paper's own Figure 8, where a *fair, protocol-legal* election is still not enough to guarantee safety, and it's worth building step by step because the failure is genuinely counter-intuitive: an entry sitting on an actual majority of nodes gets silently erased, with nothing in the election restriction able to stop it. Run it once under a plausible-but-wrong commit rule ("an entry is committed as soon as *any* term's entry reaches a majority"), then again under Raft's actual rule.

**Under the naive rule — commit by counting replicas, regardless of term:**

```
(a) Node1 (leader, term2) appends (2,'Y'), replicates to {Node2} only. Replica count = 2/5. Node1 crashes.
(b) Election: Node5's log [(1,'X')] vs Node3 [(1,'X')], Node4 [(1,'X')] (same term, same length)
    -> Node5 wins votes from itself+3+4 = 3/5. Node5 leader, term3.
(b) Node5 appends (3,'Z') LOCALLY ONLY, then crashes before replicating it.
(c) Election: Node1's log [(1,'X'),(2,'Y')] (term2) is at least as up to date as Node2 (term2, same
    length) and Node3 (term1, shorter) -> Node1 wins votes from itself+2+3 = 3/5. Node1 leader, term4.
(c) Node1 replicates its log to Node3 -> Node3 now holds [(1,'X'),(2,'Y')]
(c) Entry (2,'Y') now held by 3/5 nodes - a MAJORITY. Leader's current term is 4; this entry's term
    is 2 (not current). Naive rule says commit-now = True.
(c) Node1 crashes AGAIN - before replicating anything from its own term 4.
(d) Election: Node5's log [(1,'X'),(3,'Z')] (last term 3) beats Node2's and Node3's (last term 2)
    -> Node5 wins votes from itself+2+3 = 3/5, purely on term, despite a SHORTER log. Node5 leader, term5.
(d) Node5 replicates ITS log to Node2 and Node3, overwriting their entry at index 2.

  Node 1: [1:X, 2:Y]        Node 2: [1:X, 3:Z]        Node 3: [1:X, 3:Z]
  Node 4: [1:X]             Node 5: [1:X, 3:Z]

Entries this rule had already declared committed: [(2, 'Y')]
Of those, entries no longer present on the current majority: [(2, 'Y')]
```

Every individual step is protocol-legal — Node 5's term-5 election is completely fair under §5.4's up-to-date rule; a higher term legitimately outranks a longer log by that rule's own definition. And yet an entry that had genuinely reached a majority — and that the naive rule had already told a client was safely committed — is now simply gone, quietly replaced by `(3,'Z')`. Anyone who trusted that acknowledgment was lied to.

**Identical message pattern, Raft's actual rule — commit by counting replicas *only for the leader's current term*:**

```
(c) Entry (2,'Y') now held by 3/5 nodes - a MAJORITY. Leader's current term is 4; this entry's term
    is 2 (not current). Raft's rule says commit-now = False.
...
Entries this rule had already declared committed: []
Of those, entries no longer present on the current majority: []
```

Nothing was ever falsely promised, so there's nothing to lose. Node 1, at step (c), simply has to wait — it cannot tell a client "committed" for `(2,'Y')` until it has *also* replicated something from its own term (4) to a majority. That extra requirement is what actually protects the entry: once a current-term entry reaches a majority, the same up-to-date rule from §5.4 guarantees no future leader can win an election without holding it (a leader missing that entry would have a strictly lower last-log-term and lose every up-to-date comparison against any voter who has it), which by Raft's Log Matching Property makes everything earlier in the log safe too, permanently. Ongaro and Ousterhout state the rule directly in section 5.4.2 of the paper: *"Raft never commits log entries from previous terms by counting replicas."* It's a small, easy-to-miss addition on top of the election restriction — and, as the naive trace above shows concretely, not an optional one.

## Section Challenge

<details>
<summary><strong>Q1.</strong> TicketFast wants faster failover and proposes narrowing the randomized election timeout from 150-300ms down to a tight 150-155ms window. Using this chapter's numbers, what does that trade away?</summary>

A narrower range means less separation between nodes' randomly-drawn timeouts, which pushes the cluster back toward the low end of §5.3's spectrum — closer to `coarse2`'s 57.21% clean-single-round rate than `raft_range`'s 99.99%. Concretely, that means more election rounds fail outright (candidates split, nobody reaches a majority) and have to retry with freshly-redrawn timeouts, which costs an extra full timeout-and-election cycle *per failed round*. The paper's own numbers make the trade explicit: `coarse2` averaged 1.749 rounds to converge versus `raft_range`'s 1.000 — so a narrower window can easily make the *typical* time-to-new-leader longer, not shorter, even though each individual timeout is nominally quicker, because the cluster now frequently pays for a wasted round on top of it. Tightening the range doesn't just risk occasional collisions; on this data, it makes collision the *common* case rather than the rare one, which is precisely backwards from the "faster failover" goal.
</details>

<details>
<summary><strong>Q2.</strong> In §5.6's naive-rule trace, Node 5 legitimately wins the term-5 election — nothing about the election itself broke any rule from §5.4. If the election was fair, where did the actual danger come from?</summary>

The danger was never in the election step — it's exactly right that Node 5, holding a higher last-log-term, should win against Node 2 and Node 3's lower-term logs; that's the up-to-date rule from §5.4 working precisely as designed, and it's not the thing that failed here. The actual failure happened one step earlier, at (c): the naive rule declared `(2,'Y')` "committed" the instant it saw a bare majority holding it, without checking whether that majority came with a current-term entry backing it up. §5.4's election restriction only promises that a new leader has everything that was *safely, correctly* committed under Raft's real rule — it makes no promise at all about an entry that merely reached a majority's disks without that additional check.

Put differently: this chapter's safety rests on two separate mechanisms doing two separate jobs — the election restriction (§5.4) guarantees a new leader can't *lose* anything that was genuinely committed, and the current-term-only commit rule (§5.6) guarantees that "genuinely committed" is a claim actually worth trusting in the first place. The naive trace didn't break the first mechanism; it never engaged the second one at all, and that gap was enough on its own to lose data despite a completely fair, by-the-book election.
</details>

<details>
<summary><strong>Q3.</strong> TicketFast's cluster is unavailable for roughly one election's worth of time (a few hundred milliseconds, per §5.3) during every leader failover — during that window, zero writes are accepted, even with 4 of 5 nodes healthy and reachable. Is that a bug, or is it the same trade-off this course keeps re-deriving under a new name? What would a system have to give up to avoid that window entirely?</summary>

It's the same trade-off, not a bug — this is PACELC's ELC half (Chapter 2, §2.7) showing up again, outside of any partition. Raft is choosing Consistency (a single, strictly-ordered log with exactly one writer at a time) at the cost of Latency/Availability during the specific window where that one writer is being re-established; that's not incidental to the design, it's the design. Every chapter since Chapter 2 has been a variation on this same choice wearing different clothes.

To avoid the failover window entirely, a system would have to give up the thing that creates it: a single leader deciding order for everyone. Let multiple nodes accept writes simultaneously, all the time, with no election ever required — but that reopens exactly the problem Chapters 2 and 3 already proved is real: independent, concurrent writes with no natural causal order between them (recall TicketFast's own double-sold seat 114). Electing a leader was this chapter's way of *preventing* that conflict from ever arising, at the cost of a brief gap whenever leadership changes. The alternative isn't a free lunch — it's a different bet: let the conflicts happen, and either resolve them after the fact or design the data so conflicting writes merge automatically. That's exactly the fork Chapter 6 explores: primary-backup replication (Raft/Paxos-flavored — one writer, safety over availability) versus multi-leader and leaderless designs that accept conflicts as the price of never blocking a write.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Why a leader helps | With one designated proposer, Paxos's "discover whether a value is already chosen" step becomes unnecessary in the common case — consensus splits into two separable problems: electing a leader, and replicating its log |
| Fixed election timeout | Guarantees deadlock, not just risks it — every follower's timer fires at the same instant, every round, forever (verified: 0/100,000 clean rounds; 5,000/5,000 sequences never converged within 50 rounds) |
| Randomized timeouts | Break the symmetry; the amount of randomness matters and is measurable — 57.21% (2 slots) -> 91.70% (5 slots) -> 99.99% (150-300ms, the paper's actual range) clean single-round elections |
| The range is a real trade-off | Too narrow = frequent collisions and wasted rounds (avg 1.749 rounds at the narrow end); too wide = slower failover even when uncontested |
| Election restriction | A candidate must be at least as up to date as a voter (compare last-log term first, then length) or the voter refuses its vote — protects already-committed data from a leader that's missing it |
| Log replication | Leader appends locally, replicates via AppendEntries; an entry is safe to apply once a majority holds it *and* the commit rule (below) clears it |
| The commit-index safety rule | Never commit by counting replicas for an entry from a previous term — only for the leader's *current* term (verified: naive rule loses a majority-held "committed" entry in a Figure-8-shaped trace; Raft's actual rule loses nothing in the identical scenario) |
| The trade-off underneath it all | Leader-based consensus buys a simple, understandable structure at the cost of a real (if brief) unavailability window during every failover — PACELC's ELC trade-off, not a flaw |

## Where We Go Next

Raft and Paxos both center on a single authoritative log, decided by one leader at a time — which is exactly what buys their safety guarantees, and exactly what creates the failover gap Q3 just named. Not every system is willing to pay for that gap, and not every system needs a single global order for every write at all. The next question is what replaces "elect a leader to prevent conflicts" when a system instead decides to let conflicts happen — accepting writes on multiple nodes simultaneously, all the time, and dealing with the consequences after the fact rather than before. That's the design space Chapter 6 opens up: primary-backup, multi-leader, and leaderless replication.

*Next: [06_Replication_Strategies.md](06_Replication_Strategies.md)*
