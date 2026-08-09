# Chapter 2 — Architecture & Design Documents

> "How much should I design before I start coding?" is the wrong question, because it assumes one answer. The right question is which *specific* decisions are expensive to unmake — and that question has a different answer for every project.

---

## The Problem

Chapter 1 bounded the scope and fixed the build order. What remains undecided is the shape of the thing: which components exist, how they talk, where state lives, what runs synchronously.

Two familiar pieces of advice point in opposite directions:

- *"Design it properly before writing code."* Follow it strictly and you spend three of your six weekends producing diagrams for a system whose real constraints you'll only discover in week four.
- *"YAGNI — just start building."* Follow that strictly and in week four you discover your data model can't express a requirement, and every feature built on it needs rewriting.

Both are right about something and neither is a rule. This chapter derives the actual decision procedure, which turns out not to be about *how much* design but about *which decisions* deserve it.

## 2.1 Design Effort Should Track Reversibility

The useful reframe comes from Jeff Bezos's [2015 shareholder letter](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF), which splits decisions in two:

- **Type 1 — one-way doors.** Hard or impossible to reverse. Warrant slow, deliberate analysis.
- **Type 2 — two-way doors.** Easily undone. Should be made quickly, with roughly **70% of the information you'd ideally want**, because the cost of delay reliably exceeds the cost of a correctable mistake.

Bezos's warning is that organisations drift toward applying Type 1 process to Type 2 decisions, producing slowness and timidity. **Solo builders have the mirror failure**: applying Type 2 speed to Type 1 decisions, because there's no reviewer to slow them down and moving fast feels productive.

So the procedure isn't "design more" or "design less." It's:

> Estimate the **cost of being wrong** × the **difficulty of changing it later**. Spend design effort in proportion. For everything else, decide at 70% and move.

The whole skill is classifying correctly — and software has a stable, learnable pattern of which is which.

## 2.2 What Is Actually Expensive to Change

**One-way doors (design these deliberately):**

| Decision | Why reversal is expensive |
|---|---|
| **Data model / schema** | Every layer above encodes assumptions about it. Changing it means migrating data *and* rewriting consumers — and unlike code, data can't be rolled back by a deploy |
| **Sync vs async boundaries** | Converting a synchronous call to a queue-based one changes error handling, ordering guarantees, and the caller's entire model of the operation. Not a refactor — a redesign |
| **Public API contracts** | Once something else depends on the shape, changing it is a coordination problem, not a code problem |
| **Consistency model** | "Is this eventually consistent?" propagates into every feature's correctness argument. Retrofitting strong consistency onto a system designed around eventual is close to a rewrite |
| **Language / runtime** | Rarely reversed at all in practice |

**Two-way doors (decide at 70%, fix later if wrong):**

| Decision | Why reversal is cheap |
|---|---|
| Internal module structure | Refactoring is local; nothing outside sees it |
| Library choices (behind an interface) | Swap the implementation, keep the seam |
| UI layout and styling | No downstream dependencies |
| Logging format, config layout | Trivially changed |
| Algorithm inside a function | If the signature holds, the body is free |

**The pattern behind the pattern:** a decision is expensive to reverse in proportion to **how many things depend on it that you don't control**. A schema is expensive because *data* depends on it, and existing data can't be edited by changing code. An API is expensive because *other systems* depend on it. Internal structure is cheap because only *your* code depends on it, and you can change all of it at once.

For a solo capstone, that gives a sharp simplification: **the expensive decisions are the ones involving persisted data and process boundaries.** Almost everything else is a two-way door — so design the schema and the component boundaries carefully, and decide the rest at 70% while building.

## 2.3 Diagram at the Right Level

Having identified the boundaries worth designing, you need to record them, and the usual failure is a single diagram trying to show everything at once — boxes for services, classes, database tables, and a load balancer, all on one page, useful to nobody.

The fix is the **C4 model**, created by Simon Brown between 2006 and 2011 as a lighter alternative to UML. Four levels, each a zoom step, each answering a different question:

| Level | Shows | Answers |
|---|---|---|
| **1. Context** | Your system as one box, plus users and external systems | What is this, and who/what talks to it? |
| **2. Container** | Deployable/runnable units — web app, API, database, worker | What are the moving parts and how do they communicate? |
| **3. Component** | Major pieces inside one container | How is this service organised internally? |
| **4. Code** | Classes/functions | (Usually skipped — the code says this, and it goes stale immediately) |

**For a capstone, draw levels 1 and 2. Skip 3 unless one container is genuinely complex; never draw 4.**

Level 2 is where the value is, because containers are exactly the **process boundaries** §2.2 identified as one-way doors. A container diagram forces you to make explicit: what runs as a separate process, what protocol connects them, and what's synchronous. Those are the decisions worth an hour of thought before coding.

A capstone container diagram is honestly this small:

```
[Browser] --HTTPS--> [React SPA]
                          |
                     JSON/HTTPS
                          v
                   [Spring Boot API] --JDBC--> [PostgreSQL]
                          |
                     publishes
                          v
                     [Redis queue] <--consumes-- [Email worker]
```

Five boxes and four labelled arrows. It fits on an index card, took ten minutes, and it already surfaces the questions that matter: is email sending synchronous with the request? (No — hence the queue.) What happens if the worker is down? Does the API talk to the database directly or through a repository layer? That last one is a two-way door; the first two are not.

## 2.4 The Capstone Design Document

One page. Written before the first vertical slice, revised as you learn.

```markdown
# <Project> — Design

## What it does
Two sentences. Falsifiable, from Ch01's definition of done.

## Non-goals
The Ch01 list. Repeated here because this is the document you'll reread.

## Container diagram
[the sketch]

## Data model
The core entities and their relationships. THE most important
section — this is the expensive one-way door.

## Key decisions
Links to ADRs. Don't restate them here.

## Risks
What could sink this, and the cheapest experiment that would
tell you early.
```

Two sections earn their place beyond the obvious.

**Data model** deserves the most attention on the page, because §2.2 identified it as the most expensive thing to change and everything else depends on it. Getting entities and relationships roughly right before writing code is the single highest-return design activity in a capstone.

**Risks** is the section people skip and shouldn't. For each risk, name **the cheapest experiment that would resolve it**. If you're unsure Raft will work the way you think, don't design around the uncertainty — spend two hours on a three-node toy and find out. That's a *spike*: a timeboxed experiment whose output is knowledge, not production code, and which is thrown away afterward. Spikes are how you convert a Type 1 decision you can't yet make into one you can.

## 2.5 When It Breaks: The Design That Survives Contact

Your design will be wrong somewhere. That isn't a failure of the process — it's a property of designing before building.

The failure mode is what happens *next*, and there are two:

**Defending the design.** The document said three services, week three shows two would be simpler, and you build three anyway because that's the plan. The design document has stopped being a tool and become an obligation. **A design document is a hypothesis, not a contract** — and the whole point of vertical slices (Ch01 §1.3) is to test it early enough that revising is cheap.

**Abandoning design entirely.** The opposite reaction — the design was wrong once, so it was worthless, so stop maintaining it. Now nothing records why the system is shaped as it is, and you're back to re-deriving decisions at 1am.

The resolution is that **the design's job is not to be right — it's to make being wrong cheap to discover.** Judge a design document by whether it surfaced problems early, not by whether the final system matches it.

Which suggests a concrete practice: when reality diverges, **update the document and write an ADR explaining why.** "ADR-007: split the notification service back into the API — the async boundary wasn't buying anything at this scale, and it doubled local dev setup" is a genuinely strong artefact. It shows a design, a hypothesis, contact with reality, and a reasoned revision. That's the shape of real engineering, and it interviews far better than a system that happens to match a diagram drawn before anything was known.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §2.2 classifies "library choices (behind an interface)" as a two-way door. But suppose you pick a library and, six weeks later, want to swap it. When is that genuinely cheap — and what makes some library choices one-way doors in disguise?</summary>

It's cheap when the library sits **behind a seam you control** and its concepts don't leak through. A JSON parser, a logging library, a date formatter: your code calls your own interface, the library is one implementation, and swapping means rewriting one adapter.

**It becomes a one-way door when the library's model becomes your model.** The signature is that the library's concepts appear in code that shouldn't know about it:

- **A framework, not a library.** Spring, Django, or Rails don't sit behind your interface — your application sits inside *theirs*. Their idioms shape every file. That's a one-way door, and it's why "which framework" deserves genuine deliberation while "which JSON library" doesn't.
- **An ORM whose entities are your domain model.** If `@Entity` classes are passed around the whole application, the ORM's assumptions about identity, laziness, and transactions are baked into business logic that never mentions the ORM by name.
- **A database driver whose query language you use directly.** Raw SQL scattered through the codebase makes "swap PostgreSQL for MongoDB" a rewrite — which is *also* why §2.2 listed the data model separately: the *store* might be swappable, the *model* usually isn't.
- **Anything defining your concurrency model.** Adopting an async runtime colours every function that touches it ("function colouring") — a change that propagates through the entire call graph.

**The test:** if you deleted the library today, how many files would fail to compile? A handful means two-way door. Hundreds means one-way, whatever the library's own docs claim about being lightweight.

**The practical move** is that you can *convert* one-way to two-way by inserting a seam — a repository interface over the ORM, a port over the message broker. That costs a little indirection and buys reversibility, so it's worth doing exactly where you're least confident and skipping where you're sure.
</details>

<details>
<summary><strong>Q2.</strong> §2.1 says decide two-way doors at 70% of the information you'd like. Why 70% rather than 90%? What actually goes wrong at 90% — and is there a case for lower than 70%?</summary>

**What goes wrong at 90%** is that the last stretch of certainty is disproportionately expensive and often unobtainable at all.

Two mechanisms:

*The cost curve is non-linear.* Getting from 40% to 70% confidence is usually cheap — read the docs, skim a comparison, check it does the thing. Getting 70% to 90% means prototyping both options, benchmarking, reading source. Often a multiple of the effort of the decision's actual consequences.

*Much of the missing 30% is unobtainable in advance.* You don't learn whether the library handles your real edge cases until you have real edge cases — which requires building. So waiting for 90% frequently means waiting for information that only *building* produces, which is a deadlock: you can't decide until you build, can't build until you decide.

And crucially, for a **two-way door** the downside is bounded by definition. If a 70% decision turns out wrong, you change it. Delay to reach 90% costs schedule with certainty, to avoid a cost that is both unlikely *and* recoverable — a bad trade on expected value.

**Is there a case for lower?** Yes, in two situations. When the decision is trivially reversible and the options are close, 50% plus a coin flip beats deliberating — the deliberation costs more than either outcome. And when the decision is genuinely *blocking* other work, the cost of delay is multiplied by everything queued behind it, so acting on less is correct.

**The inversion worth remembering:** for a true one-way door, 70% is *too low*. Schema design, consistency model, async boundaries — those warrant pushing toward 90%, or better, running a spike (§2.4) to buy real information cheaply. The number isn't universal; it's a default for the reversible majority.
</details>

<details>
<summary><strong>Q3.</strong> You now have a bounded scope (Ch01), a container diagram, and a data model. You start building — and three weekends later you're behind, though it's unclear by how much or why. What's missing, and what would you need to have set up in advance to know?</summary>

What's missing is a way to detect drift **while there's still time to respond**, rather than discovering it at the end.

Chapter 1 fixed the *destination* (definition of done) and this chapter fixed the *shape* (architecture). Neither provides intermediate checkpoints, so between start and finish there's no signal at all — the first honest measurement is when you either finish or don't.

**What's needed is milestones with two properties:**

*Binary and demoable.* "Auth mostly working" is not a milestone — "mostly" is unfalsifiable, and it's exactly where the planning fallacy hides, because a task can sit at 90% for weeks. "A user can register, log in, and hit an authenticated endpoint, demonstrated by a script" is binary. This is Ch01's definition-of-done discipline applied recursively to slices.

*Dated in advance.* A milestone without a date can't tell you you're late. The point isn't the date's accuracy — Ch01 §1.1 says your estimates are wrong — it's that a *missed* date is the earliest available signal that reality diverges from plan, and it arrives while you can still cut scope rather than fail.

**What to do with the signal:** if milestone 2 of 5 slips by 50%, the outside view says the remainder will too. That's the moment to cut — while the cut is a choice. The alternative is discovering it in the final week, when the only outcome available is an unfinished project.

Two things also missing: a **stop rule** for the timebox in Ch01 §1.5, and a decision about what "behind" means — behind on *features*, or behind on *quality*? Those trade against each other, and deciding which is negotiable *before* the pressure arrives is far easier than deciding during. Chapter 3.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The real question | Not "how much design?" but "which decisions are expensive to unmake?" — the answer differs per project |
| Type 1 / Type 2 | Bezos 2015: one-way doors warrant deliberation; two-way doors should be decided at ~70% of desired information |
| The solo failure mode | Organisations over-apply Type 1 process; solo builders under-apply it, because nothing slows them down |
| What's expensive | Data model, sync/async boundaries, public contracts, consistency model, runtime — all things where something *you don't control* depends on the choice |
| What's cheap | Internal structure, libraries behind a seam, UI, config, algorithms behind a stable signature |
| Capstone simplification | The expensive decisions are those involving **persisted data** and **process boundaries**. Design those; decide the rest at 70% |
| C4 model | Simon Brown, 2006-2011. Draw Context and Container; skip Component unless needed; never draw Code |
| Why Container matters | Containers *are* the process boundaries — the one-way doors — so the diagram forces the decisions worth an hour |
| Design doc | One page. Data model gets the most attention; Risks names the cheapest experiment (a **spike**) that would resolve each |
| When it breaks | A design document is a hypothesis, not a contract. Its job isn't to be right — it's to make being wrong cheap to discover |
| The good artefact | When reality diverges: update the doc, write an ADR explaining why. Design → contact → reasoned revision interviews better than a system matching a diagram drawn in ignorance |

## Where We Go Next

Scope is bounded and the shape is designed, with the expensive decisions deliberated and the cheap ones deferred. But as Q3 established, there is still no way to know whether you're on track until you either finish or don't — no intermediate signal, and therefore no moment where cutting scope is a choice rather than a consequence.

Chapter 3 builds the execution layer: milestones that are binary and demoable, dated in advance so a slip is *detectable*, and the rules for what to do when one is missed — including deciding, before the pressure arrives, whether features or quality is the negotiable one.

*Next: [03_Milestones_And_Execution.md](03_Milestones_And_Execution.md)*
