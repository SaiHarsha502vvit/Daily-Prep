# Chapter 2 — The User-Centered Design Process

> Chapter 1 gave you the physics of a good interaction — fast to reach, quick to choose, honest about what's grouped. None of it answers whether you're optimizing the right interaction at all. A perfectly-Fitts's-Law-tuned button on a feature nobody needed is still a wasted button.

---

## The Problem

A team builds a feature based on what feels obviously right — an internal assumption about what users want, argued out in a meeting, never checked against an actual user. It ships. Users don't use it, or use it wrong, or it turns out to solve a problem nobody had.

This isn't a failure of skill. Chapter 1's laws govern interactions that are *already decided on* — they say nothing about whether the interaction should exist. A team can build a flawlessly Fitts's-Law-optimized, WCAG-compliant, Gestalt-correct interface for the wrong feature, and every chapter-1 technique will have made zero difference to the outcome.

The question this chapter answers: how do you find out you're wrong about what users need *before* you've built it, when being wrong is still cheap to fix?

## 2.1 Why "Before" Matters — and What the Actual Data Says

The intuitive argument is that catching a wrong assumption early is cheaper than catching it late. This is true, and it's worth being precise about *how* true, because the commonly-cited version of this argument is not what the data actually supports.

**What's often repeated:** "a bug costs 100× more to fix in production than in requirements" — usually attributed to an "IBM Systems Sciences Institute" study. **This study does not exist.** Tracing the citation chain leads to Roger Pressman's textbook, which attributes the number to internal, unpublished "IBM81" course notes — no underlying dataset was ever produced or published. It's a number that has been cited for decades without ever having a real source.

**What the actual research shows:** Barry Boehm assembled real cost-to-fix data at TRW, corroborated with IBM, GTE, and Bell Labs' Safeguard program, published in *Software Engineering Economics* (1981, first presented 1976). The genuine findings:

- For **typical projects**, the cost-of-change ratio from early to late is closer to **1:4**, not 1:100
- Ratios approaching 100× occur specifically for what Boehm called **"architecture-breakers"** — rare cases where a fundamental structural assumption is wrong and isn't discovered until after customers are using the system
- In a 2001 follow-up, Boehm and Victor Basili noted the curve is **meaningfully flatter** for small, agile, CI/CD-equipped projects than the 1981 data suggested — the finding wasn't wrong, it was treated as more universal and timeless than the data supported

The corrected, honest version of the argument: catching a wrong assumption before building typically saves a **few times** the cost, not a hundred times — except in the specific case of a wrong architectural assumption, where it can be catastrophic. **That's still a real, sufficient argument for research before building** — it just isn't the dramatic 100× number that gets repeated, and citing the real ratio is more credible than citing a myth, because anyone who checks the myth will find nothing behind it.

## 2.2 Deriving the Human-Centred Design Process (ISO 9241-210)

Given that assumptions need checking before they're expensive, what does a process for checking them actually require? Work it out from what has to be true, rather than starting from a standard's checklist.

**Requirement 1: you need to know what "checking against" even means.** You can't validate an assumption against "the user" in the abstract — you need an explicit, specific understanding of who they are, what they're trying to accomplish, and the conditions they're operating under. Guessing this is exactly the failure mode from §2.1.

**Requirement 2: the check has to involve real users, not proxies for them.** A team debating internally what a user would want is still guessing, however confidently — the only way to find out is to involve actual users, and to do it *throughout*, not as a single kickoff interview that gets treated as settled forever.

**Requirement 3: the check has to actually change the design when it disagrees.** Research that's collected and then ignored isn't a check at all — it's theatre. The process needs evaluation against real users to be the thing that *drives* revisions, not a box ticked alongside decisions already made.

**Requirement 4: one check isn't enough**, because the first design is a guess informed by research, not a guarantee — it needs to be re-tested and refined, which means the process has to loop rather than run once.

These four requirements are, independently derived, **exactly** the four principles [ISO 9241-210](https://www.iso.org/standard/52075.html) (*Ergonomics of human-system interaction — human-centred design for interactive systems*, first published 2010, revised 2019) states for human-centred design: explicit understanding of users/tasks/environment, user involvement throughout, user-centred evaluation driving refinement, and an iterative process. The standard isn't an arbitrary checklist — it's the minimum structure required for "check before building expensively" to actually function.

## 2.3 Research Methods Answer Different Questions — Deriving Which to Use When

"Do user research" isn't one activity. The methods split cleanly along one axis, and picking the wrong one for your actual question wastes the research even when it's executed perfectly.

**The split:** some questions are about **scale** — how many, how often, what proportion. Others are about **mechanism** — why does this happen, what is the person actually trying to do, what's confusing them.

A survey answers the first kind well and the second kind badly. Ask "why did you abandon checkout?" in a survey and you get whatever explanation the respondent can articulate after the fact — often a rationalization, not the actual moment-by-moment reasoning, because people are reliably bad at introspecting their own decision process in retrospect. It scales to thousands of respondents and produces numbers, but the numbers describe *what* happened, not *why*.

**Contextual inquiry** — observing someone use the actual system in their actual context, asking questions in the moment rather than after the fact — answers the mechanism question well and the scale question badly. You might interview five people. But you *see* the actual moment of confusion rather than a post-hoc explanation of it, which is exactly the information a survey structurally cannot capture.

| Method | Answers | Doesn't answer |
|---|---|---|
| **Survey / analytics** | How many, how often, which segment | Why, what were they thinking, what's the actual friction |
| **Interview** | What they say their goals/problems are | What they actually do (self-report drifts from behavior) |
| **Contextual inquiry** | What actually happens, in the moment, with real friction visible | Doesn't scale — 5-8 sessions is typical, not statistically representative |
| **Usability testing** (Ch06) | Whether a *specific design* works, concretely | Whether you're solving the right problem at all |

**The derivable rule:** pick the method by what kind of question you're actually asking, not by which method is fastest to run or most familiar. A team that only ever runs surveys will confidently measure the wrong thing precisely, and a team that only ever runs a handful of interviews will never know if what they observed generalizes. Most real research programs combine both — quantitative to find *where* the problem is (which step has the highest drop-off), qualitative to find out *why*.

## 2.4 Personas — Deriving Why a Concrete Fiction Beats an Accurate Abstraction

Research produces a lot of variance — different users, different goals, different contexts. The **persona** — a specific, named, fictional individual synthesized from real research — is the tool for making that variance usable in day-to-day design decisions. First introduced publicly by Alan Cooper in *[The Inmates Are Running the Asylum](https://en.wikipedia.org/wiki/Alan_Cooper_(software_designer))* (1998).

**Why a concrete fiction, rather than just presenting the research findings directly?** This connects back to Chapter 1 §1.5's cognitive load argument. A design team in a meeting, asked "would *the user base* want this?", is being asked to reason about a statistical abstraction — a mental operation people are genuinely bad at doing quickly and consistently. Asked instead "would *Priya*, who's described as juggling this app between meetings on a phone with one hand free, want this?" — the team is reasoning about a single concrete case, which is exactly the kind of reasoning human cognition handles fast and consistently. The persona isn't a simplification for its own sake; it's a *format change* that matches how the design team's own cognition actually processes the information, chosen for the same underlying reason Chapter 1 argued interfaces should reduce extraneous cognitive load — this time applied to the team's decision-making process rather than the end user's.

**Why this is also the technique's biggest failure mode.** A persona built from actual research constrains decisions usefully — "Priya has one hand free and is on a 4G connection in a moving vehicle" rules out design choices in a way grounded in evidence. A persona built from *assumptions* ("busy young professional who loves technology") is a stereotype wearing a research-shaped costume — and because it *looks* like a research artifact, a team defers to it exactly as confidently as if it were grounded in real data, encoding untested bias into every subsequent decision with the authority of having "already been researched." **A persona is only as good as the research underneath it, and its formatting gives no visible indication of whether that research actually happened.**

## 2.5 Journey Mapping — Deriving Why the Interface Isn't the Whole System

A persona describes *who*. A **journey map** traces *what happens over time* — every step a user takes toward a goal, including the parts entirely outside the product: how they heard about it, what they tried before, what happens after they finish, whether they need support.

**The derivation for why this matters:** a design process that only examines the interface is implicitly assuming the interface is the whole system the user experiences. It usually isn't. A checkout flow can be flawless by every Chapter-1 metric and still fail if the step *before* it — finding the product, understanding the price — was confusing, or the step *after* — a confirmation email, a support contact — leaves the user uncertain whether anything actually happened. **The user doesn't experience your product as a bounded artifact; they experience an unbroken sequence, and a break anywhere in that sequence is a break in the experience**, whether or not it happens to fall inside the piece your team owns.

A journey map's practical value is exposing *ownership gaps* — the steps that are broken and belong to no one's Jira board, because they cross a team boundary (marketing owns discovery, product owns the app, support owns the help desk) that the user never perceives at all. Mapping the full journey is often the first time anyone on a team sees the whole thing laid out end to end.

## 2.6 User Stories — Deriving Why "So That" Is the Load-Bearing Clause

Research and personas inform *what to build*; user stories are the format that carries that intent into day-to-day development work. The now-standard template — *"As a [role], I want [function], so that [benefit]"* — was devised by agile coach Rachel Davies at [Connextra](https://en.wikipedia.org/wiki/User_story) in London, in the early 2000s.

**The derivation of why the format has three clauses and not two.** "As a [role], I want [function]" alone is indistinguishable from a plain feature request — and Davies's own account of why the template emerged is specifically that the "so that" clause was missing at first, and its absence was the problem: stakeholders (often from sales and marketing) would write down the *feature* they wanted, but developers needed to understand the *underlying goal* — which the feature-only version doesn't communicate at all.

The "so that" clause forces the *reason* into the artifact itself, and that reason is what stays valuable once implementation starts, for two concrete reasons:

- **It lets an engineer propose a better solution.** "As a user, I want a bigger search box, so that I can find products faster" gives the engineer room to suggest autocomplete or filters — better paths to the same *goal* — where "I want a bigger search box" alone specifies the *implementation* and forecloses anything better.
- **It's what a persona actually gets used for.** "So that I can find products faster" is testable against Chapter 1's laws and against the persona from §2.4 — does the actual proposed function serve the actual described goal for the actual described person? Without the "so that," there's nothing to check the function against at all.

**When it breaks:** a story with a hollow "so that" — "so that the feature is complete," "so that we meet the requirement" — isn't really a user story, it's a feature request wearing the template's grammar without its substance. The tell is that a hollow "so that" restates the "I want" clause instead of explaining a goal beyond it; a genuine one names a real benefit to the person, independent of the specific function proposed to achieve it.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §2.1 corrected the "100× cheaper to fix early" myth to a real ratio of roughly 1:4 for typical projects, with rare exceptions up to ~100× for "architecture-breakers." Given the corrected numbers, is early user research still worth prioritizing for a small solo project — or was the whole argument really built on the inflated myth?</summary>

Still worth it, and the corrected numbers actually make a *more* defensible case than the myth did, for a specific reason: the myth's inflated 100× figure invited being cited uncritically and then dismissed once someone noticed it had no real source — which is exactly what has started happening as more people trace the citation and find nothing behind it. An argument resting on a debunked number is one bad Google search away from collapsing entirely.

The real 1:4 ratio for typical projects is smaller, but it's **real, sourced, and directionally exactly what the original argument needed** — catching a wrong assumption before building genuinely does cost meaningfully less than catching it after, just by four times rather than a hundred.

**The sharper, more useful case for a small project specifically is the "architecture-breaker" category**, not the typical-case ratio. A solo project has no team to catch a fundamental wrong assumption through code review or a second opinion — if the *core premise* is wrong (building a tool for a workflow that doesn't actually match how the target user works), that's exactly Boehm's architecture-breaker scenario, and it's discovered only after most of the building is done, when a rewrite is the only fix. A single structured conversation with a real prospective user, before writing code, is cheap insurance against precisely that failure mode — not against every bug, just the one category of bug that's genuinely catastrophic to discover late.

This also connects directly to [CSE801 Ch01](../CSE801_Capstone_Project/01_Scoping_A_Capstone.md)'s reversibility framing: research-before-building is cheap when the thing being checked is a one-way door (the core premise), and less critical for anything that's actually a two-way door you could fix later regardless.
</details>

<details>
<summary><strong>Q2.</strong> §2.4 says a persona built from assumptions is a stereotype "wearing a research-shaped costume," dangerous specifically because it looks grounded when it isn't. How would you actually tell, looking at a finished persona document, whether it was built from real research or built from assumptions?</summary>

The formatting genuinely gives no reliable signal — a fabricated persona can include a name, a photo, demographics, and a quote, identical in structure to a researched one. The tell has to come from what's *inside* the content, not the template.

**Signals of a genuinely researched persona:**

- **Specific, slightly odd details that wouldn't occur to someone inventing a stereotype.** "Checks the app three times during her commute because the office wifi is unreliable" is oddly specific in a way that reads as *observed*, not imagined — invented personas tend toward generic, socially-expected traits ("busy," "tech-savvy," "values efficiency") because those are the traits people reach for without data.
- **Details that cut against the obvious assumption.** A researched persona for a "busy professional" persona sometimes turns out to have plenty of downtime but low trust in the product — a finding that surprised the researchers. A fabricated persona rarely contains a surprise, because it was built entirely from what the team already expected to find.
- **Traceability to actual sources.** A rigorous persona doc cites which interviews or sessions specific traits came from, or at minimum states the sample size and method ("synthesized from 12 contextual inquiry sessions, March 2026"). Its total absence isn't proof of fabrication, but its *presence* is strong evidence against it — nobody fabricating a persona bothers inventing a fake methods section.
- **Multiple personas that actually differ in ways that matter for design decisions**, rather than several personas who are cosmetically different (different names, same underlying assumptions) — real research tends to surface genuine variance in goals and constraints; invented personas tend to be soft variations on the same stereotype because they all originated from the same unexamined mental model.

**The practical takeaway**, since the tell is genuinely hard to spot after the fact: the more reliable fix is procedural rather than diagnostic — require the methods section as a mandatory part of the artifact, so that "how do we know this" is answered at creation time rather than reconstructed later by someone trying to detect a fabrication after the fact, which is a much harder problem than simply requiring the evidence up front.
</details>

<details>
<summary><strong>Q3.</strong> §2.6 explains why the "so that" clause matters for engineers deciding <em>how</em> to build something. Using §2.3's research-method distinctions, explain what's still missing from even a well-written user story with a genuine "so that" clause — what question does it leave completely unanswered?</summary>

A well-written user story answers "what does this specific type of user want, and why" — but it says nothing at all about **how many** users this actually represents, or **how important** this goal is relative to every other user story in the backlog. That's precisely the axis §2.3 called the "scale" question, and a user story is a qualitative artifact by construction — it was never built to carry that information.

"As a returning customer, I want my saved payment method pre-filled, so that checkout is faster" might be a genuine, well-researched, well-articulated goal — for 2% of the current user base, or for 60% of it, and the story's format gives no way to distinguish those two radically different situations. Prioritization built purely from how *compelling* a story reads, rather than how many users it actually represents, is exactly the trap of over-indexing on qualitative research's strength (the *why*) while ignoring the quantitative question it structurally cannot answer (the *how many*) — the same asymmetry §2.3 laid out for interviews versus surveys, just showing up one layer downstream in the artifact interviews eventually produce.

**What actually closes the gap:** the story needs to be paired with quantitative evidence before it drives prioritization — usage analytics on how many users hit the relevant flow, survey data on how commonly the underlying problem occurs, or a count of how many research sessions surfaced the same need independently. A backlog of only well-written stories, with no accompanying sense of scale, risks systematically over-weighting whichever user was most articulate or memorable in an interview — a real, well-documented bias in qualitative-only prioritization, and a direct consequence of using a single-source, single-method research process for a question that structurally requires two different kinds of evidence.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The problem | Chapter 1's laws optimize *given* interactions already decided on — they say nothing about whether the interaction should exist at all |
| Cost of change, corrected | The famous "100× cheaper to fix early" claim traces to a study that doesn't exist. Boehm's real data: ~1:4 for typical projects, up to ~100× only for rare "architecture-breakers" |
| ISO 9241-210, derived | Four requirements — explicit understanding, real user involvement, evaluation-driven refinement, iteration — fall out independently just from asking what "check before building" actually requires |
| Research methods split | By question type, not convenience: scale questions (survey/analytics) vs mechanism questions (interview/contextual inquiry). Most real programs need both |
| Personas, why they work | A concrete named individual is easier for a team to reason about consistently than a statistical abstraction — the same cognitive-load logic from Ch01, applied to the design team's own decisions |
| Personas, the failure mode | A persona built from assumptions is formatted identically to one built from research — it's only as good as the evidence underneath, and the format gives no visible signal either way |
| Journey mapping | The user experiences an unbroken sequence, not a bounded product — a break anywhere (discovery, support, a different team's territory) is a break in the experience |
| User stories, the "so that" | Connextra/Rachel Davies, early 2000s — added specifically because "I want [function]" alone specifies implementation and hides the actual goal from the engineer who could propose something better |
| User stories' blind spot | Qualitative by construction — genuinely well-written stories still say nothing about how many users the goal represents, or how it should be prioritized against every other story |

## Where We Go Next

This chapter's process produces personas, journey maps, and user stories grounded in real research — the *inputs* to design. It doesn't yet provide a way to check whether a *specific finished design* actually serves those inputs well, in a structured, comparable way across a whole team.

Chapter 3 builds that check: Nielsen's heuristics, a fixed set of usability principles an interface can be evaluated against directly, with severity ratings that turn "this feels off" into something specific, prioritizable, and actionable.

*Next: [03_Usability_Heuristics_And_Evaluation.md](03_Usability_Heuristics_And_Evaluation.md)*
