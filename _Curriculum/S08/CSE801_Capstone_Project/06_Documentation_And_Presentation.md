# Chapter 6 — Documentation & Presentation

> You will spend six weekends building and twenty minutes explaining. The twenty minutes determine what the six weekends were worth.

---

## The Problem

Five chapters have optimised for one reader: the person who clones the repository, runs one command, and evaluates a working system. That reader is real, and rare.

The actual path most people take is a funnel, and every stage loses most of what remains:

```
sees a link
   → reads the first screen of the README
      → looks at an image, if there is one
         → skims one or two files
            → clones and runs it
```

Everything in Chapters 1–5 serves the *last* stage. Nothing yet serves the first three, which is where nearly all the traffic is.

This isn't a complaint about people being lazy — it's a rational allocation of attention by someone assessing many projects. Which means the artefact isn't finished. **A project nobody understands has roughly the same career value as one that doesn't run**; the difference is only visible to someone who already invested effort they had no reason to invest.

## 6.1 The README's First Screen

The first screen — what's visible without scrolling — does almost all the work. Most READMEs waste it on installation instructions, answering a question the reader hasn't reached and won't reach unless the earlier ones are answered first.

Three things belong there, in this order:

**1. What it is, in one sentence, jargon-free.**

> *A distributed key-value store that keeps serving reads and writes when a node dies.*

Not "a distributed system built with Go, gRPC, and Raft." That's the *how*, and it means nothing to a reader who doesn't yet know what the thing does.

**2. The interesting problem, as a question.**

> *When three machines each hold a copy of your data and one dies mid-write, how do the survivors agree on what the value actually is?*

This is the single highest-leverage sentence in the repository. It converts "another key-value store" into a question the reader now wants answered — and it demonstrates that you understand *why the problem is hard*, which is a different and rarer signal than having written code.

**3. Proof it works** — a GIF, a screenshot, or a short terminal capture, above the fold.

Then, and only then: the one command from Chapter 5 §5.3, the architecture diagram from Chapter 2 §2.3, key decisions linking to your ADRs, and finally the detailed setup.

**The ordering principle:** answer *why should I care* before *what is it built with* before *how do I run it*. Most READMEs run that exactly backwards, leading with a tech-stack badge wall — which describes tools rather than judgement, and which every project has.

## 6.2 Visual Proof Beats Description

A paragraph describing a working system asks the reader to take your word and construct a mental image. An image gives them the thing directly, in about a second, with no trust required.

What's worth making, cheapest first:

- **A terminal GIF** of your demo script running. If the project is a service or CLI, this is the whole demo in ten seconds, and tools like `asciinema` or a screen recorder make it a five-minute job.
- **The Chapter 2 container diagram.** It already exists. Putting it in the README converts skimming into structural understanding — the reader learns the shape of the system without reading code.
- **A screenshot**, if there's a UI.
- **One before/after or failure-mode image** if your project's claim is about resilience. For CAP04, a GIF showing a node being killed and the cluster continuing *is the entire value proposition*, demonstrated rather than asserted.

That last one generalises: **find the image that shows your central claim being true.** If the claim is "survives node failure," show a node failing. If it's "handles 10k requests/sec," show the load-test output. One well-chosen image does more than several paragraphs, because it's evidence rather than assertion.

## 6.3 Surface the Decisions

The ADRs from Chapter 2 §1.4 are the most differentiating content in the repository — and they're currently in a subdirectory nobody will open.

Why they matter more than the code: plenty of people can write a working service. Far fewer can explain *why it's shaped that way*, what alternatives they rejected, and what the costs of their choice were. Code shows you can build; ADRs show you can **judge**, which is what distinguishes a senior engineer from a productive one.

So put a short section in the README:

```markdown
## Key decisions

- [ADR-002: Raft over Paxos](docs/adr/002-raft-over-paxos.md) — chose
  understandability over theoretical minimalism; I needed to be able to
  debug it alone
- [ADR-005: synchronous replication](docs/adr/005-sync-replication.md) —
  accepted higher write latency to avoid reconciling conflicts
- [ADR-007: dropped dynamic membership](docs/adr/007-static-membership.md) —
  cut at the midpoint to protect the demo; see FUTURE.md
```

Note the third entry. **Documenting a cut, with its reasoning, is a strength rather than an admission.** It shows scope control (Chapter 3 §3.3), and it pre-empts "why didn't you do X?" by answering it before it's asked — with a reason, which is a much better position than being asked and improvising.

## 6.4 The Spoken Narrative

Presenting live is a different medium. A reader skims and re-reads at will; a listener gets one linear pass and can't go back.

A structure that works for ten to fifteen minutes:

| Section | Time | Content |
|---|---|---|
| **The problem** | 2 min | The §6.1 question. Why it's hard. No implementation yet |
| **The approach** | 3 min | The Chapter 2 container diagram, and the *one or two* decisions that mattered most |
| **The demo** | 5 min | Live, and it must work (§6.5) |
| **What I'd do differently** | 3 min | The strongest section — see below |
| **Questions** | rest | |

**"What I'd do differently" is the part people cut and shouldn't.** It's where you demonstrate that you can evaluate your own work — which is a rarer skill than producing it, and one that interviewers are specifically probing for. It also converts every weakness from a vulnerability into evidence of judgement:

> *"I made writes synchronous, which was right for correctness but means write latency scales with the slowest node. If I were extending this, I'd add a quorum write with a configurable consistency level — I'd already sketched it in FUTURE.md but cut it at the midpoint to protect the demo."*

That single answer demonstrates: you know the limitation, you know the fix, you know why you didn't do it, and you made the trade-off deliberately. A weakness you identified yourself reads as competence. The same weakness found by an interviewer reads as an oversight.

**Practical notes:** rehearse the demo at least twice end to end; have the demo script running from a *clean* start rather than a terminal already in some state; and know the one thing you'd show if you had sixty seconds instead of fifteen minutes, because sometimes you will.

## 6.5 When It Breaks: The Live Demo Fails

It happens. Wifi dies, a container won't start, a port is taken, the borrowed laptop is a different architecture (Chapter 5 §5.6).

**Prevention first**, since most failures are avoidable:

- Run the demo on the presentation machine, on the presentation network, **before** presenting
- Pre-pull all images; assume no internet
- Have the stack already running before you start talking — don't `docker compose up` live and watch it pull
- Know which port everything is on, so a conflict is a ten-second fix rather than a search

**And a recorded fallback.** A two-minute screen capture of the working demo, saved locally, is the single highest-value insurance available. If the live demo fails, you say *"the environment isn't cooperating — here's a recording, and I'll happily debug it after"* and continue without losing the room. Without it, a failed demo consumes the remaining time and there's nothing to show.

**If it fails anyway, the recovery is the signal.** Panicking or apologising at length is worse than the failure. Diagnosing calmly out loud — *"health endpoint says the API is up but can't reach the database, so it's the compose network, not the application"* — is genuinely impressive, because it's exactly what the job consists of. Chapter 5's health endpoint and structured logs are what make that recovery possible, which is the argument for having built them.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §6.1 says lead with the interesting problem, not the tech stack. But a reader is often specifically looking for evidence of particular technologies. Doesn't burying the stack hurt?</summary>

The stack should be **present and findable, just not first** — and the distinction is about what each element accomplishes.

Two different readers are in play:

*A human evaluating capability* wants to know whether you can think. A tech-stack list tells them almost nothing, because every project has one and listing tools is not evidence of using them well. This reader is won by the problem statement and the decisions.

*A keyword scan* — automated filtering, or a recruiter matching a requisition — genuinely does look for terms. That reader isn't reading prose at all; they're pattern-matching, and position on the page is irrelevant to them.

Since the scanning reader doesn't care about placement and the human reader is lost by leading with tools, the resolution is straightforward: **problem first, stack visible slightly below** — in a short "Built with" line, in the architecture section where each choice appears with a reason, and in the repository's GitHub topics.

The stronger version is to make the stack *carry* information rather than just appear:

> *Built with Go and Raft (via hashicorp/raft), PostgreSQL for durable state, Docker Compose for the three-node cluster.*

That's scannable for keywords **and** informative to a human, because each item is attached to a role. Compare a bare badge wall, which is scannable and says nothing.

**The underlying point:** these aren't in conflict, they were just ordered wrongly. Nothing about leading with the problem requires hiding the stack.
</details>

<details>
<summary><strong>Q2.</strong> §6.4 says "what I'd do differently" is the strongest section. Isn't there a risk of talking yourself down — volunteering weaknesses an interviewer would never have found?</summary>

There's a real risk, but it's in the *framing*, not the practice. The distinction is between **self-criticism** and **self-assessment**, and they sound completely different.

Self-criticism volunteers a flaw with no reasoning: *"the error handling is pretty bad, I ran out of time, and the tests are thin."* That's an apology. It supplies negatives without evidence of judgement, and invites the listener to wonder what else is wrong.

Self-assessment states a limitation *with the reasoning that produced it*: *"I made writes synchronous, which costs latency but avoids conflict reconciliation — a deliberate trade for a system where correctness mattered more than throughput. At higher scale I'd move to quorum writes with a configurable consistency level."* That's not a weakness; it's a demonstration that you understood the design space and chose a point in it.

Three rules keep it on the right side:

1. **Every limitation comes with its reason** — the constraint you were under. A limitation without a reason is a mistake; with one, it's a trade-off.
2. **Every limitation comes with the fix you'd apply.** Knowing the remedy proves the gap was recognised, not missed.
3. **Never volunteer things that are just unfinished.** "I didn't write tests for the admin panel" isn't a design insight, it's an unforced negative. Discuss *decisions*, not *omissions*.

And the practical asymmetry that settles it: a competent interviewer **will** find the limitations. When they do, having named it first means you're discussing a shared trade-off; having not named it means you're defending an oversight. Same fact, very different conversation — and the second one is the harder one to recover from.
</details>

<details>
<summary><strong>Q3.</strong> Looking across all six chapters: nearly every technique here is a substitute for something a professional environment supplies automatically. Which ones remain valuable once you're on a team with all of that, and which were purely scaffolding?</summary>

The honest split is roughly two-thirds durable, one-third scaffolding — but the scaffolding third is the part most worth having practised, for a reason that isn't obvious.

**Durable — these are the job:**

- **ADRs** (Ch02). More valuable on a team, not less, because the audience includes people who weren't there. Teams that skip them relitigate settled decisions forever.
- **Reversibility-driven design effort** (Ch02). Knowing which decisions are one-way doors is arguably the core of senior engineering judgement, and it scales up.
- **Risk-based testing** (Ch04). The two-axis rule — expensive *and* hard to detect — is how experienced engineers allocate testing effort regardless of context.
- **Reproducibility** (Ch05). Onboarding time is a direct, recurring team cost. A README that works from a clean clone pays every time someone joins.
- **Self-assessment** (Ch06). Q2's distinction between naming trade-offs and apologising is a permanent professional skill, used in design review, postmortems, and promotion cases.

**Scaffolding — externally supplied later:**

- **Self-imposed milestones and dates** (Ch03). A team has sprints, standups, and a manager tracking this.
- **Artificial scope discipline** (Ch01). Product managers and customers do this to you.
- **Deciding alone what's negotiable** (Ch03 §3.4). Becomes a negotiation with stakeholders, not a solo call.
- **Being your own reviewer** (Ch04's CI-as-substitute). Real reviewers exist.

**But the framing "scaffolding = temporary" is wrong in an important way.** Those mechanisms don't disappear on a team — they get *supplied by someone else*, which means someone has to be the person supplying them. The engineer who has personally felt scope expand until a project died is the one who later says "this is too big, what can we cut?" in a planning meeting. The one who has watched a milestone slip and extrapolated honestly is the one who flags a slipping project in week two rather than week ten.

**So the durable version of the scaffolding is the judgement, not the mechanism.** You stop needing to invent your own deadlines. You don't stop needing to know what an unrealistic plan looks like from the inside — and a capstone is one of the few low-stakes places to learn it, because the only person who suffers from getting it wrong is you.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The funnel | Link → first screen → image → skim → run. Chapters 1-5 served only the last and rarest stage |
| The stake | A project nobody understands has about the same career value as one that doesn't run |
| First screen order | What it is (jargon-free) → the interesting problem as a question → visual proof. *Then* setup |
| Why the problem statement | Highest-leverage sentence in the repo — it shows you understand why the problem is *hard*, a rarer signal than having written code |
| Visual proof | Find the image that shows your central claim being **true** — a node dying and the cluster surviving is evidence, not assertion |
| Surface the ADRs | Code shows you can build; ADRs show you can **judge**. Documenting a *cut* with reasoning is a strength — it pre-empts "why didn't you do X?" |
| Presentation shape | Problem (2) → approach (3) → live demo (5) → what I'd do differently (3) |
| "What I'd do differently" | The section people cut and shouldn't — self-*assessment*, not self-criticism: every limitation with its reason and its fix |
| The asymmetry | A weakness you name first is a shared trade-off. The same one found by an interviewer is an oversight |
| Demo failure | Prevent (rehearse on the real machine and network, pre-pull, start beforehand), insure (recorded fallback), and recover calmly — Ch05's health endpoint and logs are what make live diagnosis possible |

---

## Course Wrap-Up

Six chapters, and none of them about writing code — because the code was never the part that decides whether a capstone succeeds.

**The sequence:** [Ch01](01_Scoping_A_Capstone.md) bounded scope, because a capstone removes every external force that normally bounds it. [Ch02](02_Architecture_And_Design_Documents.md) spent design effort in proportion to reversibility. [Ch03](03_Milestones_And_Execution.md) built a feedback loop so a slip is detectable while cutting is still a choice. [Ch04](04_Testing_And_Quality_Strategy.md) allocated testing where being wrong is expensive *and* hard to detect. [Ch05](05_Shipping_And_Reproducibility.md) made it run for someone who isn't you. This chapter made it comprehensible to someone who never runs it at all.

**Three ideas ran through all of it:**

1. **Constraints have to be supplied deliberately.** Every technique here substitutes for something a job provides automatically — a deadline, a reviewer, a product manager saying no. Alone, you are all of those roles, and the failure mode is forgetting to play them.

2. **Effort should track consequence.** Design effort tracks reversibility (Ch02). Testing effort tracks expense × undetectability (Ch04). Both are the same instinct: uniform effort is wasted effort, because the things that matter aren't uniformly distributed.

3. **A finished project is not a working project.** Working is necessary and insufficient. Reproducible (Ch05) and comprehensible (Ch06) are separate properties requiring separate work — and they're the ones that decide whether anyone ever sees the working part.

**The failure this course exists to prevent** is the one from Ch01 §1.5: six weeks of genuine effort producing something 70% complete, undemoable, and abandoned. Not from lack of skill — from unbounded scope, no early signal, and no cut made while cutting was still possible. Every chapter here is a mechanism against some part of that.

**Now go build one.** Pick a track — [CAP01](../../../00_CURRICULUM/PROJECTS/CAP01_DSA_Toolkit.md), [CAP02](../../../00_CURRICULUM/PROJECTS/CAP02_Microservice.md), [CAP03](../../../00_CURRICULUM/PROJECTS/CAP03_FullStack.md), [CAP04](../../../00_CURRICULUM/PROJECTS/CAP04_DistributedSystem.md) — write the falsifiable definition of done before the first commit, and set the date you'll stop. The methodology only matters applied.
