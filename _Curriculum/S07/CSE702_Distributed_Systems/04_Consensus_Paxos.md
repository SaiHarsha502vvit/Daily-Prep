# Chapter 4 — Consensus I: The Paxos Algorithm

> Getting one machine to remember a value is trivial. Getting five machines — some slow, some briefly unreachable, some mid-conversation with a different proposer entirely — to agree on the same value, and never silently disagree, is a different kind of problem. It isn't solved with a better data structure. It's solved with a discipline for who is allowed to speak, and when their words are still binding.

---

## The Problem

Chapter 3 left TicketFast able to prove, with certainty, that Alice's and Bob's purchases of seat 114 were concurrent — genuinely independent, no causal link between them. It also left them stuck on the question certainty didn't answer: which sale counts? TicketFast's fix is to stop letting any single node decide that unilaterally. Instead, whenever a conflict like this needs resolving, a small coordination cluster — five nodes, chosen odd for exactly the quorum reasons Chapter 2 derived — votes on a single outcome, and every node must end up agreeing on the same one. Even though: nodes can be briefly unreachable, messages between them can be lost or delayed, and — critically — more than one of TicketFast's app servers might notice the same conflict at the same moment and each try to resolve it independently, each proposing its own answer. Multiple simultaneous, uncoordinated attempts to settle the *same* question is exactly what a real deployment produces, not a rare edge case.

Can the five nodes just each accept whichever proposal reaches them first, and call a value "decided" once three of the five — a majority — happen to agree on it?

## 4.1 The Naive Approach: Just Send It to a Majority

Try the simplest possible scheme. No coordination protocol at all: a proposer sends its preferred value directly to whichever acceptors it can reach, each acceptor unconditionally overwrites whatever it's currently holding with the newest thing it receives, and "decided" means whichever value a majority (3 of 5) happen to hold at the instant someone checks. Run this with several competing proposers, random message loss, and a fully randomized interleaving of every individual message across 20,000 trials:

```
NAIVE     trials=20000  safety violations=13163 (65.81%)  trials with >=1 value decided=19635
```

Nearly two-thirds of trials end with two *different* values each legitimately holding a majority at some point. Here's the mechanism, and it's simpler than it sounds: acceptor 3 might hold value "A" (part of a live 3-of-5 majority right now), and thirty milliseconds later a late-arriving message for value "B" lands on acceptor 3 and *overwrites* it — nothing in this scheme gives an acceptor any way to know that its current value is backing an active majority, so it just does what "last write wins" always does. The moment that overwrite happens, acceptor 3 flips from backing "A" to backing "B," and if enough of the *other* acceptors already happened to hold "B," a second majority silently forms for a completely different value — while the first majority, for "A," was real, observable, and actionable at the moment it existed. Any client that checked in between the two moments made a perfectly reasonable decision based on a majority that later evaporated out from under it. That's "flapping majority," and it isn't a bug in the implementation above — it's what has to happen any time acceptors have no way to refuse a message.

## 4.2 First Fix: Proposal Numbers and the Right to Refuse

The naive scheme's actual defect: acceptors have no way to tell "this message supersedes what I have" from "this message is stale and should be ignored." Give every proposal a **number** — unique per attempt, and totally ordered across every proposer, no ties possible — and give every acceptor a rule: *remember the highest-numbered message you've ever promised to honor, and refuse anything numbered lower than that.*

Concretely: each acceptor tracks `promised_n`. A proposer picks a number `n` and asks the acceptor to promise to honor it (a **Prepare** request); the acceptor promises — sets `promised_n = n` — only if `n` is higher than anything it has promised before, and refuses otherwise. Once an acceptor has promised `n`, any later message (from any proposer) numbered below `n` bounces off it. This closes the exact hole §4.1 exploited: a stale, late-arriving overwrite from an earlier, lower-numbered attempt can no longer silently clobber a value that a higher-numbered attempt has already superseded.

It is *not* sufficient on its own. Add proposal numbers and the promise-to-refuse rule, but leave everything else the same — a proposer, once it has a majority of promises, just goes ahead and pushes *its own* preferred value — and run the identical 20,000-trial stress test:

```
BROKEN    trials=20000  safety violations=11882 (59.41%)  trials with >=1 value decided=19872
```

59.41%. Barely better than no discipline at all. Numbering stopped the *stale-overwrite* failure specifically, but it did nothing about a second, subtler race — one that needs its own derivation.

## 4.3 Second Fix: Discover-Before-You-Decide

Here's the race numbering alone doesn't touch. Proposer X gets a majority of promises, finds nobody has accepted anything yet, and proposes its own value — legitimately, correctly, exactly as designed. A majority accepts it. **X's value is now chosen — for good, by the definition every acceptor and every future proposer is supposed to respect.** Then proposer Y, who has no idea X ever ran, starts its own attempt with a higher number, gets promises from a majority of its own, finds that the acceptors *it* happened to reach report nothing accepted — and, using only the "numbering" fix from §4.2, concludes it's free to push its own, different value. If Y's majority overlaps X's by even one acceptor (and it must — more on that in a moment) and Y overwrites that shared acceptor, X's majority silently shrinks below 3 while Y's grows to 3. Two different values, each genuinely chosen at some point in real time. That's the 59.41%.

The missing piece: a Promise response shouldn't just say *yes, I'll honor your number* — it should also report **anything this acceptor has already accepted**, if there is such a thing. And a proposer receiving promises must, before doing anything else, check every response for a previously-accepted value; if *any* of them reported one, the proposer is not free to use its own value at all — it must adopt the value from the **highest-numbered** accepted proposal reported, discarding its own preference entirely.

Why does checking a mere majority of promises reliably catch a prior acceptance? Because of the exact fact Chapter 2 §2.6 already proved about majorities of five: any two majorities must share at least one member (3 + 3 − 5 = 1 guaranteed overlap — there's no way to carve two disjoint majorities out of five nodes). If X's value was chosen, it's sitting in a majority of acceptors' state; whatever majority Y's Prepare reaches is *mathematically guaranteed* to include at least one acceptor that has it, and that acceptor's Promise response is where the previously-accepted value surfaces. Quorum overlap, which Chapter 2 used to explain an *availability* trade-off, is doing genuine *safety* work here — it's the mechanism that makes "discover before you decide" actually reliable instead of a probabilistic nicety.

## 4.4 Paxos, Assembled

With both fixes derived from the specific failures they close, the full algorithm — Leslie Lamport's Paxos, first written up as *"The Part-Time Parliament"* (ACM Transactions on Computer Systems, May 1998; drafted around 1989 and famously hard to get published because reviewers found the Greek-parliament framing more confusing than illuminating — Lamport re-published the same ideas in plainer language as *"Paxos Made Simple,"* ACM SIGACT News, December 2001) — is just these two phases, run in order:

**Phase 1 — Prepare / Promise.** The proposer picks a number `n` higher than any it has used before and sends `Prepare(n)` to the acceptors. Each acceptor that receives it: if `n` is higher than anything it has already promised, it records `promised_n = n` and replies `Promise(n, accepted_n, accepted_v)` — including its own highest previously-*accepted* proposal, if it has one. Otherwise, it ignores the request (or replies with a rejection).

**Phase 2 — Accept / Accepted.** Once the proposer has collected promises from a *majority*, it must choose a value: if any promise reported a previously-accepted value, it adopts the value from the highest-numbered one among them; only if none did is it free to use its own preferred value. It sends `Accept(n, v)` to the acceptors. Each acceptor that receives it: if `n` is still at least as high as anything it has promised since (no one has pre-empted it with a higher number in the meantime), it accepts — records `accepted_n = n, accepted_v = v` — and replies `Accepted(n, v)`. Otherwise, it ignores the request.

A value is **chosen** the moment a majority of acceptors hold `Accepted` for the same `(n, v)`. Two rules, each traceable to a specific failure — refuse stale numbers (§4.2, stops overwrite-based flapping), adopt any already-accepted value your quorum reveals (§4.3, stops the discovery gap) — are the entire algorithm. Nothing else is load-bearing.

## 4.5 Worked Trace: X and Y Collide

Script the exact race from §4.3 and run it twice — once with the adoption rule turned off (§4.2's incomplete fix), once with it on — against the same five acceptors, same message pattern.

**Without the adoption rule:**

```
Proposer X: Prepare(n=(1,X)) -> acceptors {0,1,2}      all three PROMISE
X collects 3/5 promises; none had a prior accepted value -> X proposes its own value 'X'
Proposer X: Accept(n=(1,X), v='X') -> acceptors {0,1,2}   all three ACCEPTED
  [after X's accept phase] currently-visible majority: {'X'}   | ever-chosen so far: {'X'}

Proposer Y: Prepare(n=(2,Y)) -> acceptors {2,3,4}   (never reaches acceptor 0 or 1)
  acceptor2: PROMISE (already accepted ((1, 'X'), 'X'))
  acceptor3, acceptor4: PROMISE
Y collects 3/5 promises; reported prior-accepted pairs: [((1, 'X'), 'X'), (None, None), (None, None)]
ADOPTION RULE OFF: Y ignores the prior-accepted value it was just told about -> proposes its own 'Y'
Proposer Y: Accept(n=(2,Y), v='Y') -> acceptors {2,3,4}   all three ACCEPTED
  [after Y's accept phase] currently-visible majority: {'Y'}   | ever-chosen so far: {'X', 'Y'}

>>> Ever-chosen values across the whole run: {'X', 'Y'}   *** SAFETY VIOLATION ***
```

Acceptor 2 is the overlap node §4.3 predicted — it shows up in *both* X's accept-quorum and Y's promise-quorum, exactly as the pigeonhole argument guarantees for any two majorities of five. Its Promise response to Y does correctly report `(1, 'X')` — the information needed to prevent the collision was delivered. The broken variant just doesn't look at it. X was legitimately, observably chosen after its accept phase; two lines later, a different value is *also* chosen, and nothing in this variant of the protocol ever notices the contradiction.

**With the adoption rule (identical message pattern, nothing else changed):**

```
Proposer Y: Prepare(n=(2,Y)) -> acceptors {2,3,4}
  acceptor2: PROMISE (already accepted ((1, 'X'), 'X'))
  acceptor3, acceptor4: PROMISE
ADOPTION RULE ON: acceptor 2 already accepted ((1, 'X'), 'X') -> Y is REQUIRED to propose 'X' instead of its own 'Y'
Proposer Y: Accept(n=(2,Y), v='X') -> acceptors {2,3,4}   all three ACCEPTED
  [after Y's accept phase] currently-visible majority: {'X'}   | ever-chosen so far: {'X'}

>>> Ever-chosen values across the whole run: {'X'}   (safe - only one value ever chosen)
```

Same acceptors, same message pattern, same higher proposal number for Y — the only change is that Y is now *forced* to notice acceptor 2's report and propose `'X'` instead of `'Y'`. Y's attempt still succeeds (its higher number still wins the numbering contest, and it still gets a fresh majority), but it reinforces the value that was already underway instead of fighting it. That's the entire mechanism, made concrete on five nodes.

## 4.6 Verifying Safety Across Thousands of Adversarial Trials

The hand-traced scenario is one instance. It doesn't prove the algorithm — it illustrates the mechanism. Verification means throwing many independent, randomized, adversarial conditions at all three variants and checking whether *any two different values are ever both chosen in the same run* — with three competing proposers (not two), 20% independent message loss on every individual request *and* every individual response, and a fully randomized interleaving of every proposer's steps, repeated 20,000 times per variant:

```
NAIVE     trials=20000  safety violations=13163 (65.81%)  trials with >=1 value decided=19635
BROKEN    trials=20000  safety violations=11882 (59.41%)  trials with >=1 value decided=19872
CORRECT   trials=20000  safety violations=    0 ( 0.00%)  trials with >=1 value decided=19872
```

Zero violations for the correct algorithm, across 20,000 trials with real contention (three simultaneous proposers, not a token one-competitor setup) and heavy, realistic message loss — and it isn't zero because nothing ever gets decided: 19,872 of those 20,000 trials (99.4%) *did* reach a chosen value, the same completion rate as the broken variant, just without the broken variant's 59.41% failure rate riding along with it. The two derived fixes from §4.2 and §4.3, and nothing more, are sufficient to hold safety at exactly zero violations under adversarial conditions that break both weaker schemes the majority of the time.

## 4.7 When It Breaks: Safety Isn't the Same as Termination

Paxos's safety guarantee — never two different chosen values — held at 0/20,000 above. Look more closely at the other number in that row: 20,000 − 19,872 = **128 trials (0.64%) where no value was ever chosen at all**, even after each proposer got four separate attempts. That's not a safety failure — nothing incorrect happened — but it's a real limit worth naming precisely, because it's exactly the gap Chapter 1's FLP result predicts: no deterministic consensus protocol in an asynchronous network can guarantee both safety *and* termination if messages can be delayed arbitrarily. Paxos doesn't break that impossibility; it resolves it by keeping safety absolute and letting termination become merely *probable* rather than guaranteed.

The mechanism behind those 128 stalled trials is called **dueling proposers**: proposer X sends `Prepare(1)`, starts collecting promises; before X can send its `Accept`, proposer Y sends `Prepare(2)`, which pre-empts X's promises at some acceptors; before Y can send its `Accept`, proposer Z sends `Prepare(3)`, pre-empting Y in turn — and if the timing keeps working out that way, every proposer's `Accept` keeps arriving just after a higher `Prepare` has already invalidated it, and the cluster can churn indefinitely without ever completing a Phase 2. Safety is untouched throughout (nothing ever gets `Accepted` with two different values, because nothing much gets `Accepted` at all) — but the system produces no decision, which is its own kind of production outage. This is precisely why practically every real deployment of Paxos adds something the algorithm as derived here is deliberately silent about: a way to cut down on *how many* proposers are active at once.

## Section Challenge

<details>
<summary><strong>Q1.</strong> Proposer Z sends <code>Prepare(5)</code> and collects promises from a majority, none of whom report a previously-accepted value. Before Z sends its <code>Accept(5, ...)</code>, it stalls for a long time. Could a different value become chosen during that stall, even though no other proposer has learned anything about Z's attempt?</summary>

Yes — and it's not a safety violation when it happens. A *promise* is not a reservation on the outcome, only a commitment about which proposal *numbers* an acceptor will still honor. While Z is stalled, nothing stops a different proposer W from sending `Prepare(6)` to an overlapping majority — since none of those acceptors have *accepted* anything yet (Z only got as far as promises, never sent its Accept), W's promise quorum reports nothing previously accepted, and W is free — correctly, under §4.3's rule — to propose its own value and get it accepted by a majority.

When Z finally wakes up and sends its stale `Accept(5, ...)`, every acceptor that already promised `6` to W will reject it outright (`5 < 6`), so Z's proposal simply fails to be chosen — it does not somehow conflict with W's already-chosen value. This is the precise distinction the question is testing: "promised" only narrows what an acceptor will accept *at that number or below*; it grants no claim on the eventual outcome. Nothing is safe until `Accept` actually succeeds at a majority — which is exactly why the algorithm needs the adoption rule to run at Accept-time, checking the freshest available information, rather than trusting whatever was true back when Prepare succeeded.
</details>

<details>
<summary><strong>Q2.</strong> TicketFast considers loosening the quorum requirement from "a majority" (3 of 5) to "any 2 acceptors," to make each round faster. Using Chapter 2's quorum-overlap reasoning, what specifically breaks?</summary>

Two disjoint pairs can be carved out of five acceptors with zero shared members — {0,1} and {2,3}, for instance, share nothing at all, unlike any two majorities of five, which are mathematically guaranteed to overlap (3 + 3 − 5 = 1, the exact fact §4.3 leans on). If "quorum" only requires 2 acceptors, a proposer X could get `(1, "X")` accepted by exactly {0,1}, and a proposer Y could simultaneously get `(2, "Y")` accepted by exactly {2,3} — and neither one's Prepare phase would ever be *guaranteed* to touch an acceptor the other one used. Y's Prepare could easily reach only {2,3,4}, learn nothing about X's acceptance at {0,1}, and correctly-by-its-own-rules choose its own value — because the adoption rule in §4.3 can only work with information a quorum overlap is guaranteed to surface, and a 2-of-5 quorum offers no such guarantee.

This is Chapter 2 §2.6's majority-overlap math doing double duty: there, a majority requirement was about making sure at most one side of a network partition stays *available*; here, the identical arithmetic is what makes discovery of a prior acceptance *reliable* rather than lucky. Shrinking the quorum below a true majority breaks both guarantees for the same underlying reason — smaller quorums stop being pairwise guaranteed to intersect.
</details>

<details>
<summary><strong>Q3.</strong> TicketFast's engineers are glad Paxos never violated safety in the stress test, but they're unhappy about the 128 stalled trials from §4.7, and newer engineers find the Prepare/Promise/Accept/Accepted machinery genuinely hard to reason about. Does Paxos, as derived in this chapter, offer any built-in way to designate who should be proposing values, to cut down on dueling?</summary>

No — and that omission is deliberate, not a gap in this chapter's derivation. Basic Paxos, as built here, treats every node as free to become a proposer at any moment, for any attempt, with no built-in preference for any one of them. That flexibility is exactly what makes the algorithm general enough to prove correct from first principles, and it's exactly what causes dueling proposers: nothing discourages two or three nodes from all deciding, at the same moment, that *they* should be the one to propose.

Real deployments almost always bolt a leader-election layer on top — designate one node the preferred proposer most of the time, and only let others step in when the leader is suspected dead — specifically to keep the common case free of the contention that caused 0.64% of this chapter's trials to stall. If picking a single leader up front fixes both the liveness problem *and* gives new engineers one clear "who's in charge right now" story instead of tracking every node's proposal history, the natural next question is why not design the algorithm around an explicit leader from the very start, rather than retrofitting one. That's precisely the motivation behind Chapter 5: Raft, designed from the ground up — leader election, log replication, and all — specifically for understandability.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The naive scheme | No proposal discipline at all → "flapping majority": a value can be legitimately, observably chosen and then silently overwritten — 65.81% of stress-test trials produced two different chosen values |
| Proposal numbers alone | Acceptors refuse stale-numbered messages, stopping overwrite-based flapping — but proposers still push their own value blindly, so safety violations barely drop (59.41%) |
| The missing rule | A promise must report any value the acceptor already accepted; the proposer must adopt the highest-numbered one reported instead of its own preference |
| Why a majority quorum is what makes discovery reliable | Any two majorities of N acceptors are guaranteed to share at least one member (Ch2 §2.6's math) — that shared acceptor is what makes an already-chosen value surface during Prepare, not luck |
| Paxos, assembled | Phase 1 (Prepare/Promise): reserve a proposal number, learn of any prior acceptance. Phase 2 (Accept/Accepted): propose the adopted (or, if none exists, the proposer's own) value; a value is chosen once a majority accepts the same (n, v) |
| Verified safety | 0/20,000 adversarial trials (3 competing proposers, 20% message loss, random interleaving) ever chose two different values — vs. 65.81% and 59.41% for the two incomplete schemes |
| The limit: liveness | Safety held at 0 violations, but 128/20,000 trials (0.64%) never chose *any* value — dueling proposers repeatedly pre-empting each other before either reaches Accept. This is FLP (Ch1) made concrete: safety without a termination guarantee |

## Where We Go Next

Paxos proves that safety and liveness under dueling proposers pull in different directions, and the practical fix — designate a preferred proposer most of the time — was never part of the algorithm this chapter derived, only a common patch bolted on afterward. That leaves an open design question: what would a consensus algorithm look like if leader election were a first-class part of the protocol from the start, built specifically so that engineers could read the algorithm and trust their own understanding of it, rather than trusting a correctness proof they'd need a research paper to follow? Chapter 5 builds exactly that: Raft.

*Next: [05_Consensus_Raft.md](05_Consensus_Raft.md)*
