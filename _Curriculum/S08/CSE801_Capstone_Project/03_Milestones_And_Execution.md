# Chapter 3 — Milestones & Execution

> A plan that can't tell you it's failing isn't a plan. It's a wish with dates attached — and the dates are decoration if nothing happens when you miss one.

---

## The Problem

Chapter 1 fixed the destination. Chapter 2 fixed the shape. Between "start" and "done" there is currently **no signal at all**.

That's the gap Chapter 2's Q3 identified: the first honest measurement of whether the plan was realistic arrives when you either finish or don't — and by then the only available response is to accept the outcome. Every useful response (cut scope, simplify, drop a feature) requires knowing you're behind *while there's still time*.

So this chapter builds the feedback loop. Three parts: milestones that can actually be evaluated, dates that make a slip visible, and a decision — made in advance — about what gives when one is missed.

## 3.1 Milestones Must Be Binary

The standard milestone is useless:

> *"Week 3: authentication mostly working."*

"Mostly" cannot be evaluated. On the day, you will feel it is mostly working — you always do — and you'll move on. Two weeks later it's still not finished, and you'll have no record that you were already behind.

Compare:

> *"Week 3: a user can register, log in, and call an authenticated endpoint. Demonstrated by `./demo-auth.sh` running green."*

Either the script passes or it doesn't. There is no interpretation available, which is the entire point.

**Why "binary" specifically.** Chapter 1's planning fallacy hides in exactly the space that partial-credit language creates. A task can sit at "90% done" for three weeks, because the remaining 10% is the unknown work the estimate never included. Percentage-complete self-reports don't track reality — they track how much of the *imagined* work is finished, and the imagined work was always the easy part.

Binary milestones remove the hiding place. This is Chapter 1's definition-of-done discipline applied recursively: the project has one falsifiable finish line, and each milestone is a smaller one.

**And "demoable" is not an extra requirement — it's how you make it binary.** A milestone whose completion test is "run this and watch it work" cannot be fudged. It also composes: three demo scripts at week 3 are the beginning of the final demo from Chapter 1 §1.2, so the work isn't overhead.

## 3.2 Dates Make Slips Detectable

A milestone without a date can't tell you anything. It can only be "not done yet," indefinitely.

The objection is obvious: Chapter 1 established your estimates are systematically wrong, so why date something you know you'll get wrong?

**Because the date's job isn't to be accurate — it's to be *comparable*.** When week 3 arrives and milestone 2 isn't done, you learn something real: your estimation ratio for this project is worse than assumed. That's information you cannot get any other way, and it arrives early enough to act on. An inaccurate date that generates a signal beats no date generating nothing.

For a weekend-scale capstone, a workable shape:

| | Milestone | Test |
|---|---|---|
| Weekend 1 | Walking skeleton — one trivial path end-to-end | `./demo.sh` returns a hardcoded value through every layer |
| Weekend 2 | Core feature 1 real | Script exercises it against a real datastore |
| Weekend 3 | Core feature 2 real | Script covers both |
| Weekend 4 | The hard/risky thing (see Ch02 §2.4 Risks) | Script demonstrates it working |
| Weekend 5 | Hardening — errors, edge cases, docs | Demo survives deliberate misuse |
| Weekend 6 | Presentation, README, buffer | A stranger can run it from a clean clone |

Two deliberate choices here. **Weekend 1 is a walking skeleton** — the thinnest possible end-to-end path — which front-loads integration risk exactly as Chapter 1 §1.3 argued. **The risky thing is weekend 4, not weekend 6**, because it needs to fail while there's still time to route around it; scheduling your biggest unknown last guarantees discovering it too late.

## 3.3 Reading a Slip

Milestone 2 was due Sunday and it's Wednesday. What does that tell you?

Apply Chapter 1's outside view **recursively**: the ratio you're observing now is your best estimate of the ratio for what's left. If milestone 2 took 1.5× its budget, the honest projection is that the remaining four take 1.5× theirs. Six weekends of plan becomes nine — and you have six.

The wrong response, which feels responsible, is *"I'll work harder / make up the time."* That assumes the overrun came from insufficient effort. It almost never does. It came from work the estimate didn't contain, and the remaining milestones contain the same kind of unknown work in the same proportion.

The right response is to **cut now, while cutting is a choice.** Concretely:

1. Recompute using the observed ratio, not the original estimate
2. Look at Chapter 1's definition of done and identify what can be removed while keeping it *coherent* — a complete smaller thing, never a partial larger one
3. Move it to `FUTURE.md`
4. Write an ADR: *"Cut X — milestone 2 ran 1.5× and finishing X would risk the demo. Deferred, not abandoned."*

That ADR matters more than it looks. It converts "didn't finish" into "consciously scoped," which is a completely different thing to explain in an interview — and it's true, provided you actually did the reasoning.

## 3.4 Decide What's Negotiable Before You Need To

The classic triangle is scope / time / quality: fix any two, the third moves. For a solo capstone one of them is fixed in a way it usually isn't professionally.

**Time is genuinely fixed.** Not by a manager — by the fact that weekends are finite and, more importantly, that motivation decays. A capstone running months past its intended end has usually already failed, whatever its state, because the energy that would finish it is gone. Deadline pressure can be added in a job; it cannot be manufactured alone.

So the trade is between **scope** and **quality**, and the asymmetry between them decides it:

- Cut **scope** and you get a smaller thing that fully works. Demoable, explicable, honest.
- Cut **quality** and you get the intended thing, broken. Not demoable — and a demo that fails live is worse than one you never had, because it actively demonstrates the opposite of competence.

**Quality has a floor that scope doesn't.** Below "it runs reliably enough to demonstrate," the artefact's value goes to roughly zero regardless of how ambitious it was. Scope has no such floor: a *small* working system is worth a great deal.

That gives the rule, and it should be written into the plan on day one so it isn't relitigated under pressure:

> **Scope is the variable. Quality is a floor. Time is fixed.**

Worth being precise about what "quality" means here, since it isn't uniform. **Non-negotiable:** the demo path works, no data loss, errors don't crash the process, `main` always runs. **Negotiable:** test coverage beyond the demo path, edge cases outside it, performance, UI polish, code elegance in non-core modules. Deciding *this specific split* in advance is what stops week-five panic from cutting the wrong thing.

## 3.5 When It Breaks: Work Expanding, Work Deferred

Two well-documented effects turn a capstone's flexible schedule against it, and they compose badly.

**Parkinson's Law** — *"Work expands so as to fill the time available for its completion"* — from Cyril Northcote Parkinson's [1955 essay in *The Economist*](https://en.wikipedia.org/wiki/Parkinson%27s_law), drawn from observing bureaucracies. Give a two-day task a two-week budget and it reliably takes two weeks, not through laziness but through gold-plating, refactoring, and exploring adjacent problems. All of it feels like real work.

**Student syndrome** — coined by Eliyahu Goldratt in *Critical Chain* (1997) — is the complement: given slack, people start at the latest possible moment, so any buffer is consumed *before* work begins rather than protecting against overrun at the end.

Together they explain the characteristic pattern: a project consumes all available time and still finishes late. The buffer is spent up front (student syndrome), and the work that does happen expands to fill what's left (Parkinson).

**What actually counters them:**

*Short, fixed intervals.* A weekend is a good unit precisely because it's too short to expand into. Milestones every 4–6 weeks give both effects room to operate; milestones every weekend don't.

*A "good enough" bar defined in advance* — §3.4's negotiable/non-negotiable split. Gold-plating is Parkinson's Law's main vector, and the defence is having already written down what "done" means for this milestone so that improving past it is visibly out of scope.

*Start with the hard part of each milestone.* Student syndrome defers the unpleasant thing; deliberately front-loading it within each weekend means the unknown work surfaces while there's still time in the interval.

**One caution on the other side.** Cutting all slack is a different failure — a plan with zero buffer breaks on the first ordinary surprise, and there is always one. The point isn't to eliminate buffer but to make it **explicit and protected**: weekend 6 in §3.2 *is* the buffer, named as such, rather than slack quietly distributed into every task where both effects can eat it invisibly.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §3.2 puts the risky/unknown part at weekend 4 of 6. Why not weekend 1, when energy is highest and there's maximum time to recover?</summary>

It's a real tension, and the answer depends on *what kind* of risk it is.

**The case for weekend 4** — which is what the schedule takes — is that most "risky" parts aren't independently attackable. Raft consensus needs nodes that can already talk to each other; a payment integration needs an order model to attach to. Attempting the hard thing first means building scaffolding to support it anyway, and then you've done the integration work in the worst order (Chapter 1 §1.3's argument against horizontal building). Weekend 4 arrives with the surrounding system real, so the risky work is tested in its actual context — and there are still two weekends to route around failure.

**The case for weekend 1** is stronger when the risk is *existential to the design* — where failure invalidates the architecture rather than costing a feature. If the whole project is "a distributed store using Raft" and Raft turns out unworkable at your skill level in the time available, discovering that in week 4 means four wasted weekends, because everything was built to serve it.

**The resolution is Chapter 2 §2.4's spike.** Don't schedule the *implementation* first, schedule a **timeboxed experiment** first — four hours in weekend 1 wiring three toy processes into a leader election, thrown away afterward. That buys the knowledge without the ordering cost: you learn whether the design is viable while it's still cheap to change, and the real implementation still happens at weekend 4 when it has context to live in.

**The general rule:** *de-risk* early, *build* in dependency order. They're different activities and only the second has to respect the architecture.
</details>

<details>
<summary><strong>Q2.</strong> §3.3 says apply the observed overrun ratio to the remaining work. But suppose milestone 2 ran 1.5× because of one specific problem — a library bug, now fixed and gone. Isn't extrapolating that overrun to unrelated future work simply wrong?</summary>

This is the single most seductive reasoning error in project tracking, and it's worth being precise about why it's usually wrong while occasionally being right.

**Why it's usually wrong.** The argument is "that overrun had a specific, non-recurring cause, so it won't repeat." True about *that* cause — and irrelevant, because the estimate didn't include that cause either. The estimate assumed *no* library bugs, and the future estimates also assume no library bugs, no environment problems, no misread documentation. Every remaining milestone is estimated with the same optimism, and the world will supply a *different* specific problem to each of them.

This is exactly Chapter 1's inside view reasserting itself. Each overrun always has an identifiable, one-off-looking cause — that's what makes the reasoning so persuasive. But the *rate* at which such causes appear is stable, and that rate is what the ratio measures. Dismissing each one individually means never updating at all.

**When it's legitimately right.** Two cases:

*A genuinely one-time fixed cost, now paid.* If milestone 2 overran because you spent a day setting up Docker, CI, and the project skeleton — infrastructure every later milestone now inherits — that cost really is non-recurring. The honest move is to separate it: "milestone 2 was 1.5×, of which 0.3× was one-time setup, so my working ratio is 1.2×."

*A skill step-change.* If the overrun was learning a technology you'll now use throughout, later work genuinely goes faster. Real, but usually smaller than it feels.

**The discipline that keeps you honest:** write the adjustment down *before* the next milestone, then check it. "I'm discounting this to 1.2× because setup was one-time" is a prediction. If milestone 3 also runs 1.5×, you had two data points saying 1.5 and chose to believe neither — at which point the pattern is the answer.
</details>

<details>
<summary><strong>Q3.</strong> §3.1 makes every milestone demoable via a script, and §3.4 makes "the demo path works" non-negotiable. But a demo script that passes proves only that <em>one</em> path works. What's the gap, and what would close it without expanding scope?</summary>

**The gap is that a demo script is a happy-path integration test with an audience.** It proves the components connect and one sequence produces the expected result — genuinely valuable, and much better than nothing, but silent on everything else:

- What happens on **bad input**? The demo passes valid data by construction.
- What happens when a **dependency fails** — the database is down, the network drops mid-request?
- Do individual components work in **isolation**, or does the script pass because two bugs cancel out?
- **Concurrency** — the demo is one user, one request at a time.
- **Regressions** — the script tests today's feature; nothing checks weekend 2's still works.

That last one is the most dangerous in a capstone, because it accumulates silently. Without regression coverage, week 5's refactor can break week 2's feature and you find out during the live demo.

**What closes it without expanding scope** — and the constraint matters, since §3.4 says scope is the variable:

*Keep every demo script and run them all, every time.* Weekend 3 runs demos 1, 2, and 3. That's a regression suite assembled from work already done — zero new scope, and it directly protects the non-negotiable.

*Unit-test only the genuinely tricky logic.* Not everything — the parts where you'd be embarrassed to be wrong and where a bug is hard to spot from the outside: the consensus rule, the pricing calculation, the retry logic. Testing trivial code costs scope and buys nothing.

*One deliberate failure test per external dependency.* Kill the database, confirm you get a clean error rather than a crash. That's minutes of work and it defends "errors don't crash the process," which §3.4 also made non-negotiable.

The underlying principle is that testing is subject to the same reversibility logic as Chapter 2's design decisions: **test heavily where being wrong is expensive and hard to detect; test lightly where it's cheap and obvious.** Which is Chapter 4.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The gap | Without intermediate signal, the first honest measurement arrives when it's too late to respond |
| Binary milestones | "Mostly working" can't be evaluated and is where the planning fallacy hides — a task sits at "90%" for weeks |
| Demoable = binary | A completion test of "run this and watch" can't be fudged, and the scripts compose into the final demo |
| Dates | Not for accuracy — for **comparability**. A missed date is the only early signal that your ratio is off |
| Schedule shape | Walking skeleton first (front-loads integration risk), risky work at weekend 4 not 6, explicit buffer at the end |
| Reading a slip | Apply the observed ratio to remaining work. "I'll work harder" assumes the overrun was effort; it was unknown work |
| Cut while it's a choice | Remove scope to keep the result **coherent** — a complete smaller thing, never a partial larger one. Record it in an ADR |
| The fixed variable | Time is genuinely fixed (motivation decays), quality has a floor (below "demoable" the artefact is worth ~0), so **scope is the variable** |
| Quality split | Non-negotiable: demo works, no data loss, no crashes, `main` runs. Negotiable: coverage beyond the demo path, polish, performance |
| Parkinson's Law | Parkinson, 1955 — work expands to fill available time, mostly via gold-plating that feels productive |
| Student syndrome | Goldratt, 1997 — slack is consumed at the start, so buffers protect nothing. Together with Parkinson: all the time, still late |
| The counter | Short fixed intervals, a "good enough" bar written in advance, hard-part-first within each interval, and buffer that is **explicit and protected** rather than distributed |

## Where We Go Next

The project now has a feedback loop: binary milestones, dates that make slips visible, and a pre-agreed answer for what gives. What it doesn't have is any check on correctness beyond a single happy path.

Q3 mapped that gap — demo scripts prove one sequence works and say nothing about bad input, failed dependencies, concurrency, or whether last week's feature still functions. Chapter 4 covers testing at capstone scale, applying the same reversibility logic Chapter 2 used for design decisions: test heavily where being wrong is expensive and hard to detect, lightly where it's cheap and obvious — and treat the accumulated demo scripts as the regression suite you've already built.

*Next: [04_Testing_And_Quality_Strategy.md](04_Testing_And_Quality_Strategy.md)*
