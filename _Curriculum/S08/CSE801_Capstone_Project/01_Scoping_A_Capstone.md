# Chapter 1 — Scoping a Capstone

> A capstone is the first project where nobody tells you when to stop. That sounds like freedom. It is the single most common reason capstones are abandoned at 70% complete.

---

## The Problem

The project bank already tells you *what* you could build — [CAP01 DSA Toolkit](../../../00_CURRICULUM/PROJECTS/CAP01_DSA_Toolkit.md), [CAP02 Microservice](../../../00_CURRICULUM/PROJECTS/CAP02_Microservice.md), [CAP03 Full-Stack](../../../00_CURRICULUM/PROJECTS/CAP03_FullStack.md), [CAP04 Distributed System](../../../00_CURRICULUM/PROJECTS/CAP04_DistributedSystem.md). Each has a spec. None of them is the hard part.

The hard part is that a capstone removes every external mechanism that normally stops a software project from expanding forever. Consider what's actually missing compared to professional work:

| Professional work | Capstone |
|---|---|
| A customer who wants a specific thing | You, imagining what would be impressive |
| A deadline someone else set | None, or one you can quietly move |
| Teammates blocked on your output | Nobody |
| A code reviewer who says "that's out of scope" | Nobody |
| A budget | Infinite time, in theory |

Every one of those is a *bounding* force. Remove them all and the project's scope is limited only by your ambition — which is unbounded, and which grows every time you learn something new mid-build.

**This chapter's claim:** capstones don't usually fail from technical difficulty. They fail from scope that was never bounded, hit an energy limit, and got abandoned in a state too incomplete to show anyone. The techniques below are all mechanisms for supplying, artificially, the constraints that professional work supplies naturally.

## 1.1 Why Your Estimate Is Wrong (Predictably)

Start with the estimate, because everything downstream depends on it.

You will underestimate. Not occasionally — systematically, and in a direction that's been measured for decades. Kahneman and Tversky named this the **planning fallacy** in 1979: the tendency to underestimate task-completion time *even when you know you've underestimated similar tasks before*. The bias survives knowing about the bias, which is what makes it dangerous.

The mechanism is worth understanding, because it tells you the fix. When estimating, you construct a mental model of the project going *as planned* — the "inside view." You imagine writing the code you can already picture. What that model structurally cannot include:

- Bugs you haven't met yet (by definition, you can't picture them)
- The library that doesn't do what its README implies
- The three days lost to an environment problem
- Everything you'll discover you need to learn *after* you start
- Life — work, illness, a weekend that evaporates

None of these are in your plan, and **all of them are in every project you've ever done.** The estimate isn't wrong because you're careless; it's wrong because you're estimating the wrong thing — the ideal path, not the actual distribution.

**The fix is the "outside view":** ignore the details of *this* project and ask what happened with *similar* projects. Not "how long should this take?" but "how long did the last thing I thought was two weekends actually take?" That question has an empirical answer you can look up in your own history — and if the honest ratio is 3×, apply 3× rather than arguing with it.

For a capstone specifically: **estimate, then decide what you'd cut if you had half the time.** Not as a pessimism exercise — as a design activity, because §1.3 shows the answer determines your build order.

## 1.2 Define "Done" Before You Start

Write down, before the first commit, the specific sentence that will be true when you stop.

This sounds trivial. It is the highest-leverage thirty minutes in the project, because "done" is exactly the thing that has no external definition here. Without it written down, "done" silently becomes *"when I run out of enthusiasm,"* and that moment arrives at an arbitrary point that is almost never a coherent stopping place.

A weak definition:

> *"A distributed key-value store."*

Unfalsifiable. Every day you can add another feature and it's still accurate — so it can never be satisfied, only abandoned.

A usable one:

> *"Three nodes, in Docker, replicating writes via Raft. A client can put and get. Killing one node loses no data and the cluster keeps serving. One page of documentation, and a script that demonstrates the whole thing in under two minutes."*

The difference is **falsifiability**. Every clause is something you can point at and say yes or no. The day all clauses are true, you're finished — and the project has an ending it can actually reach.

Two properties worth building in deliberately:

**A demo path.** "A script that demonstrates it in under two minutes" isn't decoration — it's what makes the project *showable*, which is what makes it worth having built. A capstone nobody can be walked through in a few minutes is, for career purposes, close to a capstone that doesn't exist.

**An explicit non-goals list.** Write down what you are *not* building — no authentication, no web UI, single datacenter, no dynamic cluster membership. This is the single best defence against mid-project scope creep, because when the idea arrives at week three (and it will, and it will feel essential), the decision was already made by a calmer version of you.

## 1.3 Build Vertically, Not Horizontally

Given a bounded scope, the build order determines whether an interrupted project is *salvageable* or *worthless*. This is where most of the real risk lives.

**Horizontal** (layer by layer) is the intuitive order: build the whole data layer, then the whole service layer, then the whole API, then the UI. It feels efficient — you stay in one mental context, you build each layer "properly."

**Vertical** (slice by slice) means: one narrow feature working end to end, through every layer, however crudely. Then the next.

The difference only shows up when you stop early — and you should assume you will stop early, because §1.1 says your timeline is wrong:

| Stopped at 60% | Horizontal | Vertical |
|---|---|---|
| What exists | A complete data layer, half a service layer, no API | 3 of 5 features working end to end |
| Can you demo it? | No | Yes |
| Does it prove anything works together? | No — the layers have never been connected | Yes — proven on every slice |
| Is it portfolio material? | No | Yes |

Horizontal build concentrates all integration risk at the end, which is the exact moment you have least energy and time. Vertical build front-loads it: the first slice is the slowest, because it's paying for all the plumbing — but when it's done, you *know* the pieces fit, and every subsequent slice is faster.

**The rule:** get one boring, ugly, end-to-end path working before you make anything good. A capstone that does one thing completely beats one that does five things partially, both as engineering and as something to show.

## 1.4 Record Decisions as You Make Them

Six weeks in, you will not remember why you chose PostgreSQL over MongoDB, and — more painfully — an interviewer will ask, and "it seemed right" is a bad answer to the most interesting question they could have asked.

The lightweight solution is the **Architecture Decision Record**, popularised by Michael Nygard in a [November 2011 post](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions) while at Cognitect (building on Philippe Kruchten's earlier work on architectural decisions as first-class artefacts). One short file per significant decision:

```markdown
# ADR-003: Use PostgreSQL for the order store

## Status
Accepted — 2026-08-09

## Context
Orders need multi-row atomic updates (order + line items + inventory).
Expected volume is low (<1000/day). I need JSON storage for the
flexible metadata field.

## Decision
PostgreSQL, with JSONB for metadata.

## Consequences
+ Real transactions across tables — the atomicity requirement is met directly
+ JSONB gives document flexibility without a second datastore
− Heavier operationally than SQLite for a project this size
− Horizontal scaling would need work later, but volume doesn't demand it
```

Note the shape: **Context before Decision**, and consequences including the negative ones. That ordering is the whole value — it records the *constraints you were under*, so a later reader (usually you) can tell whether a decision is still valid when circumstances change. A decision without its context can't be re-evaluated; it can only be second-guessed.

For a capstone, ADRs pay off three times: they stop you re-litigating settled questions at 1am, they *are* your design documentation with no extra writing, and they turn "why did you build it that way?" from an ambush into the part of the interview you're most prepared for.

Five to ten ADRs is right for a capstone. Record the choices that were genuinely contested; skip the ones with no real alternative.

## 1.5 When It Breaks: The 70% Abandonment Pattern

The characteristic capstone failure has a recognisable shape:

1. Weeks 1–2: fast progress, high energy, the interesting architecture gets built
2. Week 3: a genuinely hard problem appears — an integration that won't cooperate, a concurrency bug
3. Week 4: progress slows; simultaneously a *new* idea appears that's more appealing than the current stuck problem
4. Week 5: scope quietly expands toward the new idea; the stuck problem is still stuck
5. Week 6+: too much unfinished to demo, too tangled to explain, energy exhausted. Abandoned.

**The diagnostic detail is step 3–4.** Scope creep at that point isn't ambition — it's *avoidance*. Adding a feature is more pleasant than fixing the thing that's blocking, and it feels like progress while actively converting a nearly-shippable project into an unshippable one.

Three concrete countermeasures:

**Timebox the stuck problem.** Give it a fixed budget — say four hours. If it isn't solved, take the documented workaround, note it in an ADR as a known limitation, and move on. "Known limitation, documented, with a rationale" is a *professional* outcome; a blocked project is not. Interviewers respond well to a candidate who can articulate a trade-off they consciously made.

**Freeze scope at the halfway point.** After the midpoint, the only permitted changes are *removals*. New ideas go in a `FUTURE.md` file, which costs nothing, preserves the thought, and keeps it out of the build.

**Keep it demoable at all times.** With vertical slices (§1.3), `main` should always run. If today's work would break the demo, it goes on a branch. This means the project is *never* in an unshowable state, which removes the failure mode where six weeks of real work produces nothing you can point to.

## Section Challenge

<details>
<summary><strong>Q1.</strong> You estimate CAP04 (distributed key-value store) at four weekends. §1.1 says apply an outside-view multiplier — suppose your honest history says 3×, giving twelve. You only have six. What should change, and what specifically should <em>not</em>?</summary>

**What should not change: the multiplier.** The temptation is to decide this project will be different — you understand it better, you'll be more focused. That's the inside view reasserting itself, and it's precisely the reasoning the planning fallacy predicts. The 3× came from what actually happened before; nothing about *believing harder* changes it.

**What changes is the scope**, and §1.2's definition of done is what you edit. Twelve weekends of ambition compressed to six means cutting roughly half the *scope*, not half the *quality* — a half-quality distributed system doesn't work at all, whereas a half-scope one does.

Concretely, for CAP04: keep the core claim (replication with consensus, survives one node failure), cut the periphery — dynamic membership, a web dashboard, multi-datacenter, persistence tuning, more than three nodes. Those go in `FUTURE.md`.

**The reframe that makes this easy:** you aren't building "a distributed KV store minus features." You're building "a three-node replicated store that provably survives a node failure" — a complete, coherent, demonstrable thing that happens to have a modest scope. That's a stronger artefact than an ambitious system that doesn't run, and it's a much better answer to "walk me through what you built."

**The one thing worth spending unbudgeted time on** is the demo script from §1.2. It's a small fraction of effort and it disproportionately determines whether anyone ever perceives the work.
</details>

<details>
<summary><strong>Q2.</strong> §1.3 argues for vertical slices, but the first vertical slice of a full-stack app means touching database, backend, API, and frontend before any of them is properly designed. Isn't that just building it badly? When is horizontal actually correct?</summary>

**It is deliberately building it badly, and that's the point.** The first slice's job isn't to be good — it's to *discover whether the pieces fit* and to expose integration problems while there's still time to respond. Hardcoded values, no error handling, ugly UI: correct for slice one.

The thing being optimised is **when you learn about integration problems**, and early is worth a lot, because integration failures are the ones that invalidate design assumptions rather than just costing an afternoon.

**Where horizontal genuinely wins** is when a layer has to be *right* before anything above it can be meaningfully built, because getting it wrong means rewriting everything on top:

- **CAP01 (DSA Toolkit)** — arguably the whole project is one layer. There's no vertical to slice; "one data structure, fully tested and benchmarked" *is* the vertical slice, and it happens to look horizontal.
- **A database schema with genuinely complex relational invariants** — some upfront design pays, because migrating a schema that five features depend on is far more expensive than thinking for an hour.
- **A public API contract other people will consume** — changing it later has coordination costs a solo capstone doesn't have, but a real product does.

**The synthesis most experienced builders land on:** design the *interfaces* horizontally (think about the whole schema, sketch the API shape), but *implement* vertically (one slice at a time through those interfaces). Cheap thinking is horizontal; expensive building is vertical. The failure mode the chapter warns against isn't horizontal thinking — it's horizontal *implementation*, where you build a complete, polished layer that has never once been exercised by a real caller.
</details>

<details>
<summary><strong>Q3.</strong> §1.4 says an ADR should record Context before Decision. Suppose you wrote only the decision — "Use PostgreSQL" — with no context. What specifically becomes impossible later, and what does that say about documentation generally?</summary>

**What becomes impossible is re-evaluating the decision** — as opposed to merely reversing it.

With context recorded, a later reader can check whether the *reasons* still hold. The ADR says PostgreSQL was chosen for cross-table atomicity, JSONB flexibility, and volume under 1000/day. If volume reaches 100,000/day, you can see immediately that one premise has expired while the others stand, and you know precisely what to re-examine.

Without context, all you have is a fact about the past. You can't tell whether it was a carefully-reasoned choice under constraints that have since changed, or a default nobody thought about. So the options collapse to two bad ones: treat it as sacred (nobody dares change what they don't understand), or ignore it entirely and re-derive from scratch, repeating any research already done.

**The negative consequences matter for the same reason.** An ADR listing only benefits is marketing. Recording "heavier operationally than SQLite" means that when operational weight becomes painful, you can see it was a *known, accepted* cost rather than a discovered surprise — which is the difference between a trade-off and a mistake.

**Generalised:** documentation that records *what* has a short half-life, because the code already says what, and the doc drifts out of date the moment the code changes. Documentation that records *why* — constraints, alternatives rejected, conditions assumed — stays valuable precisely because that information exists nowhere else in the repository. The code cannot tell you what you considered and rejected.

This is also the practical answer to "documentation always goes stale": stale *why* is still useful, because it's a historical record of reasoning under conditions you can compare against today. Stale *what* is actively harmful, because it's a confident description that is now false.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The structural problem | A capstone removes every external force that normally bounds scope — customer, deadline, teammates, reviewer. Those constraints must be supplied artificially |
| Planning fallacy | Kahneman & Tversky, 1979 — systematic underestimation that *survives knowing about it*, because the inside view can't include unknown problems |
| Outside view | Don't ask "how long should this take?" — ask "how long did the last thing I thought was two weekends actually take?" Then apply that ratio |
| Definition of done | Write a falsifiable sentence before the first commit, including a demo path and an explicit non-goals list. Otherwise "done" becomes "when enthusiasm runs out" |
| Vertical over horizontal | Stopped at 60%, vertical gives 3 working features and a demo; horizontal gives disconnected layers and nothing to show |
| Integration risk | Horizontal concentrates it at the end — exactly when time and energy are lowest |
| ADRs | Nygard 2011 (on Kruchten's earlier work). Context *before* Decision, negatives included. 5-10 per capstone |
| The 70% pattern | Weeks 1-2 fast, week 3 stuck, week 4 scope creep as *avoidance*, week 6 abandoned |
| Countermeasures | Timebox the stuck problem (documented limitation > blocked project), freeze scope at the midpoint (removals only), keep `main` demoable at all times |

## Where We Go Next

Scope is bounded, "done" is written down, and the build order front-loads integration risk. What's still undecided is the shape of the thing itself — which components exist, how they communicate, where state lives, and which of those choices are genuinely load-bearing versus reversible later.

Chapter 2 covers architecture for a project of this size: how much design is worth doing before writing code, how to identify the decisions that are expensive to change (and therefore worth ADRs), and how to sketch a system so the vertical slices of §1.3 have something coherent to slice through.

*Next: [02_Architecture_And_Design_Documents.md](02_Architecture_And_Design_Documents.md)*
