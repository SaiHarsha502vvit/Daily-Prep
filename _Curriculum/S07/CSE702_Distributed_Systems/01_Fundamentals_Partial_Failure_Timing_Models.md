# Chapter 1 — Fundamentals: Partial Failure & Timing Models

> On one machine, a function either returns or the process is dead and you know it. Split that function across a network, and there's a third outcome nobody's single-machine intuition prepared them for: you don't know, and you can't find out in bounded time.

---

## The Problem

You've written correct code for a single machine. A function call either returns a value, throws, or the process crashes — and if the process crashes, *every other part of that process* crashes with it, so there's no ambiguity about state.

Now split that same logic across two machines connected by a network, and change exactly one thing: a function call becomes a message sent to another process. What breaks?

## 1.1 What a Network Call Doesn't Give You

A local function call and a network call look similar in code — both are `result = do_thing(args)`. The resemblance is where the trouble starts, because the network call silently drops guarantees the local call had for free:

| Guarantee a local call has | Does a network call have it? |
|---|---|
| If it doesn't crash, it returns | No — it can also just... never come back |
| Failure is total (if the callee dies, so does the caller) | No — the callee can die while the caller keeps running, or vice versa |
| A clock reading means the same thing to both sides | No — the two machines' clocks can disagree, drift, or jump |
| Memory is shared — both sides see the same state instantly | No — each side only has messages it has already received |
| "No response yet" and "will never respond" are the same wait | No — one of those is temporary, the other is permanent, and from where you're standing they look identical |

That last row is the one this whole course is built around. Call it **partial failure**: in a distributed system, some parts can fail while others keep running, and — critically — *the parts that are still running usually cannot immediately tell which category a silent peer falls into.* A single machine either works or it's off. A distributed system can be in a state no single machine can ever be in: half-alive, from the outside indistinguishable from fully dead for as long as you're willing to keep waiting.

## 1.2 The Fallacies: Assumptions That Don't Survive the Network

In 1994, L. Peter Deutsch (with contributions from Bill Joy and Dave Lyon) wrote down the assumptions programmers reliably bring from single-machine thinking into distributed systems and get burned by. James Gosling added an eighth around 1997. The list is old enough that entire generations of infrastructure (retries, circuit breakers, service meshes) exist specifically to paper over it — which is itself evidence the underlying problems were never actually solved, only mitigated:

1. The network is reliable.
2. Latency is zero.
3. Bandwidth is infinite.
4. The network is secure.
5. Topology doesn't change.
6. There is one administrator.
7. Transport cost is zero.
8. The network is homogeneous.

*(Source: [Fallacies of distributed computing, Wikipedia](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing).)*

Notice what these have in common: every one of them is true often enough, for long enough, that code written as if they always hold will *work in testing and demos* — and then fail in production, at the exact moment scale or an unlucky network blip makes the assumption false. That pattern — "wrong assumption, right often enough to ship, catastrophic when it isn't" — is why distributed-systems bugs are disproportionately the ones that show up at 3 AM instead of in code review. The rest of this chapter derives the two fallacies with the sharpest teeth: #1 (the network is reliable) and its consequence for #2 (latency is zero, so a slow response and a lost one look the same).

## 1.3 The Two Generals' Problem: Why "Just Add an Acknowledgment" Doesn't Fix #1

Here's the natural first fix for "the network might drop a message": require an acknowledgment, and resend if you don't get one. Does that actually solve the unreliability problem, or just move it?

**Setup.** Two generals, A and B, command armies on opposite hills, overlooking a common enemy in the valley. They will win only if they attack **at the same time** — either one attacking alone loses. They can only communicate by sending a messenger through the valley, and the messenger might be captured (message lost) with some nonzero probability. General A sends "attack at dawn." For B to be *certain* it's safe to attack, does B need to acknowledge? Does A then need to acknowledge the acknowledgment?

**Derivation — why acknowledgment doesn't terminate the problem, it just relocates it.**

- A sends "attack at dawn." If A doesn't hear back, A can't tell whether the message was lost, or B got it and B's *ack* was lost. So A can't safely attack without confirmation.
- Suppose B sends an ack. Now B faces the mirror problem: B doesn't know if the ack arrived. If it didn't, A won't attack, and B attacking alone loses. So B can't safely attack without confirming *A received the ack*.
- That confirmation is itself a message, which needs its own confirmation, which needs its own confirmation — every message added to "fix" the uncertainty about the previous message has exactly the same uncertainty about itself.

This isn't a flaw in a particular protocol — it's true of **every** protocol built purely from acknowledgments over a channel where messages can be silently lost. Simulated directly: run the ack chain for a fixed 6 rounds with a 10% loss probability per message, 100,000 trials.

```
Trials: 100,000
Chain broke before round 6 (some message lost):                 46,742  (46.7%)
Chain survived all 6 rounds, but last sender STILL has no certainty:  53,258  (53.3%)
Runs reaching mutual certainty:                                       0  (0.0%)
```

Zero runs reach certainty — not because 6 rounds is too few, but because **no finite round count reaches it.** Checked directly for message counts up to 10,000: whatever message N is, its delivery is confirmed only by message N+1, which has the identical problem. There is no N at which the regress stops.

*(The problem was first proved, in a different framing, by Akkoyunlu, Ekanadham, and Huber, "Some Constraints and Trade-offs in the Design of Network Communications" (1975); Jim Gray gave it the "Two Generals" name in "Notes on Data Base Operating Systems" (1978).)*

**This is the boundary, not a limitation of cleverness.** No amount of protocol design fixes it over a channel with silent, unbounded message loss — the fix has to change the *model*, not the protocol: real systems accept a nonzero (but boundable, tunable) probability of disagreement, rather than chasing certainty that provably doesn't exist. Every "retry with timeout," every "at-least-once delivery," every TCP handshake is, underneath, a negotiated trade-off with this impossibility — not a defeat of it.

## 1.4 Timing Models: What a Timeout Can and Can't Tell You

If certainty about message delivery is unreachable, the practical fallback is: wait, and if you don't hear back within some time `T`, assume the peer is dead. This works — approximately — and the word "approximately" is worth deriving precisely, because it explains why every distributed system has tunable timeouts instead of a single correct one.

**Three timing models, in order of how much they assume:**

- **Synchronous:** message delay and processing time both have a known, fixed upper bound. Under this model, a timeout is *exact*: if you haven't heard back after the bound, the peer is provably dead (or unreachable), because a live, connected peer is *mathematically guaranteed* to have responded by then.
- **Asynchronous:** no bound on delay at all — a message might take 1ms or 1 year, and both are consistent with the model. Under this model, **no timeout is ever safe** — you can never distinguish "about to arrive" from "never arriving," because both are always still possible no matter how long you've waited. (This is the formal setting behind the FLP result — Fischer, Lynch, and Paterson's 1985 proof that no deterministic consensus protocol can guarantee both safety and termination in a fully asynchronous system if even one process can fail. Chapters 4–5 return to this when consensus algorithms are built; the short version is that Paxos and Raft don't contradict FLP, they sidestep it by giving up *guaranteed* termination in exchange for termination that's overwhelmingly likely in practice.)
- **Partially synchronous:** the practical middle ground real systems live in — there *is* a bound, but you don't know what it is, or it only holds most of the time (the network is synchronous "eventually" or "usually," not provably always). This is where every real distributed system actually operates, and it's why timeouts are heuristics, not proofs.

**Quantified: what a timeout actually buys you.** A live-but-slow node's response-time distribution doesn't stop at some fixed point — it has a long tail (simulated below as exponentially distributed, mean 0.5s). Any *fixed* timeout `T` will misclassify some fraction of genuinely-alive-but-slow responses as "crashed":

```
timeout T=0.5s  ->  35.93% of LIVE slow responses wrongly classified as "crashed"
timeout T=1.0s  ->  13.72% of LIVE slow responses wrongly classified as "crashed"
timeout T=2.0s  ->   2.10% of LIVE slow responses wrongly classified as "crashed"
timeout T=5.0s  ->   0.02% of LIVE slow responses wrongly classified as "crashed"
```

The false-positive rate shrinks as `T` grows — but never reaches exactly zero at any finite `T` (it keeps approaching zero without ever quite touching it, the way the tail of an exponential distribution always does), and every increase in `T` is paid for directly in how long a *genuinely* crashed node's failure takes to detect. **This is the actual trade-off every production timeout value encodes**: not "the correct number," but a chosen point on a curve between false-positive rate and detection latency, picked for a specific system's tolerance for each. There is no timeout value that is simultaneously "detects real crashes instantly" and "never misclassifies a slow-but-alive node" — the fallacy (#2: latency is zero) is exactly what would have to be true for such a value to exist.

## Section Challenge

<details>
<summary><strong>Q1.</strong> A junior engineer proposes: "Let's fix the Two Generals' Problem by having General A send the attack message 1,000 times instead of once — surely one of them gets through." Does this solve the problem? What does it actually change?</summary>

It doesn't solve the problem — it changes the probability, not the guarantee. Sending the message 1,000 times (independently, each with the same loss probability `p`) makes the probability that *at least one copy* arrives very high (`1 - p^1000`, astronomically close to 1 for any `p < 1`), but General A still has no way to *know* that any copy arrived without an acknowledgment — and that acknowledgment has exactly the same "did it arrive?" problem the original message had. Sending 1,000 messages narrows the *practical* risk to something negligible; it does not, and cannot, produce the *certainty* the original problem asked for. This is precisely the shift described at the end of §1.3: real systems accept a tunably-small probability of failure instead of chasing an unreachable certainty. It's a good engineering answer — just not a proof, and conflating the two is exactly the mistake that leads to systems whose designers believe they've eliminated a failure mode they've only made rare.
</details>

<details>
<summary><strong>Q2.</strong> Which specific one of Deutsch's 8 fallacies, if it were actually true of a given network, would make the Two Generals' Problem disappear entirely — and why doesn't that help in practice?</summary>

Fallacy #1, "the network is reliable." If message delivery were truly guaranteed (zero loss probability), General A could send exactly one message and both generals could safely attack without any acknowledgment at all — there'd be nothing to be uncertain about. It doesn't help in practice because no real physical network offers that guarantee: packets get dropped by congestion, cables get cut, routers crash mid-forward, radio links fade. "Reliable network" is a simplifying assumption convenient for a first pass at a design, not a property any real deployed network has — which is exactly Deutsch's point in calling it a fallacy rather than a fact.
</details>

<details>
<summary><strong>Q3.</strong> Two nodes disagree about which of two events happened "first" — one says its local clock read 10:00:03.100, the other says 10:00:03.050, so by wall-clock time the second one looks earlier. Why might this conclusion be wrong, and what would you need instead of wall-clock timestamps to answer it reliably?</summary>

Wall-clock timestamps from two different machines aren't directly comparable — each machine's clock can drift, be skewed by NTP correction, or simply have been set slightly wrong, so a 50ms difference between two independent clocks proves nothing about which event actually happened first in any meaningful sense; it might just as easily reflect which machine's clock runs fast. What you need is a notion of order that comes from actual causal relationships between events (did one event's effect reach the other machine before it produced the second event?) rather than from unsynchronized local clocks. That's precisely the gap **logical clocks** — Lamport timestamps and vector clocks — are built to close, by deriving an ordering from message-passing causality instead of wall-clock readings.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Partial failure | A distributed system can be "half-alive" — some parts running, some dead, indistinguishable from outside for as long as you keep waiting; no single machine has this state |
| Fallacies of distributed computing | 8 single-machine assumptions (Deutsch 1994 + Gosling ~1997) that are true often enough to ship, false often enough to page someone at 3 AM |
| Two Generals' Problem | No finite acknowledgment protocol over a lossy channel reaches certainty — proved by the infinite regress, verified by simulation (0/100,000 trials reach certainty) |
| Practical resolution | Real systems trade unreachable certainty for a tunably small failure probability (send redundantly, retry, accept residual risk) — not a loophole in the impossibility, a different goal entirely |
| Synchronous timing model | Known bound on delay → a timeout is an exact, provable failure detector |
| Asynchronous timing model | No bound on delay → no timeout is ever safe (seeds the FLP impossibility result, Fischer/Lynch/Paterson 1985) |
| Partially synchronous | The real-world middle ground — bounds exist but are unknown or only usually hold; timeouts here are heuristics, not proofs |
| Timeout trade-off | False-positive rate (misclassifying a slow-alive node as dead) shrinks as `T` grows but never hits exactly zero; every real timeout value is a chosen point on that curve, not "the correct number" |

## Where We Go Next

This chapter established that distributed systems live with irreducible uncertainty about failure and no shared notion of time. The next natural question is what that uncertainty costs you when you *also* want your data to stay consistent across machines while tolerating a network partition — which is exactly the trade-off the CAP theorem makes precise.

*Next: [02_CAP_Theorem_PACELC.md](02_CAP_Theorem_PACELC.md)*
