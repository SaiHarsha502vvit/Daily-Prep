# Chapter 3 — Usability Heuristics & Evaluation

> "This feels off" is a real signal and a useless bug report. Nobody can prioritize it, estimate it, or verify it's fixed. Heuristic evaluation exists to turn that feeling into something with a name, a severity, and a place in a backlog.

---

## The Problem

Chapter 2 built a process for finding out what to build — research, personas, journey maps. But once something is *built*, a different question arises: does this specific, finished screen actually work? "It feels a bit clunky" doesn't survive contact with a sprint planning meeting. It needs to become something specific enough to fix, prioritize, and verify.

The naive fix is a full usability study — real users, a moderator, recorded sessions (Chapter 6's subject). That's the right tool for validating a design against real behavior, and it's also expensive to run every time a button gets moved. What's needed first is something cheaper: a structured way to catch a large fraction of the *known-category* problems — the ones that recur across products because they violate the same handful of principles every time — without needing to schedule a single user session.

## 3.1 Where the Ten Heuristics Actually Came From

It's easy to treat "Nielsen's 10 heuristics" as a list someone wrote down from experience and taste. That's not how they were built, and the actual origin matters for how much weight to give the list.

Jakob Nielsen and Rolf Molich published the original method in [1990](https://dl.acm.org/doi/10.1145/97243.97281). Four years later, Nielsen refined it through a **factor analysis of 249 real usability problems**, collected from actual evaluations of real interfaces — distilling down to the specific set of principles with the *maximum explanatory power* for the problems that had actually been found. The list isn't ten intuitions; it's the output of an empirical process asking "which small set of categories accounts for the most real, previously-observed usability failures?"

That origin sets the right expectation for using them: the heuristics are strong at catching **recurring, well-understood** categories of problem — the same handful of ways interfaces go wrong, over and over, across completely different products. They are not a substitute for observing an actual user with an actual task, because a 1994 factor analysis cannot anticipate a problem specific to *your* users, *your* domain, or *your* novel interaction pattern. Chapter 3.6 returns to precisely this limit.

## 3.2 A Few Heuristics, Derived Rather Than Listed

Ten one-line heuristics memorized as a list produce shallow evaluation — "consistency: check." Understanding *why* each one predicts a real failure is what makes an evaluator actually catch instances of it. Three, chosen because they connect directly to earlier chapters:

**Visibility of system status.** The system should always keep users informed, through appropriate feedback, within reasonable time. The failure this prevents: a user clicks something and nothing visibly happens. They don't know if it worked, is loading, or silently failed — so they click again, potentially triggering a duplicate action, or they abandon the task assuming it's broken. The underlying mechanism is uncertainty itself imposing a cost: an interface with no status feedback forces the user to *hold open* the question "did that work?" for as long as the silence lasts, which is a form of the extraneous cognitive load Chapter 1 §1.5 argued should be minimized — the system is offloading its own bookkeeping onto the user's working memory.

**User control and freedom — specifically, undo.** Users often choose functions by mistake and need a clearly marked "emergency exit" without an extended dialogue. This is the interface-design expression of the same idea [CSE801 Ch01](../CSE801_Capstone_Project/01_Scoping_A_Capstone.md) and [Ch02](../CSE801_Capstone_Project/02_Architecture_And_Design_Documents.md) built an entire methodology around at the *system-design* level: **reversibility determines how much caution an action deserves.** A destructive click with no undo needs a confirmation dialog, extra friction, and careful wording, because it's a one-way door — exactly CSE801's Type 1 decision. The same action with reliable undo can be fast and frictionless, because a mistake costs one more click to fix rather than lost work. Undo isn't a nice-to-have feature; it's what converts a one-way door into a two-way one, and the entire weight of "how careful does this interaction need to be" hangs on which side of that line it falls.

**Recognition rather than recall.** Minimize the user's memory load by making objects, actions, and options visible, rather than requiring the user to remember information from one part of the interface to another. This is Chapter 1 §1.5 and §1.4 (Miller's working-memory limit) applied directly: recall — retrieving something from memory with no cue — is measurably harder and slower than recognition — matching against something currently visible. A dropdown showing all valid options is recognition; a text field requiring the user to remember and retype an exact category name from a previous screen is recall. Same information, same underlying task, very different cognitive cost — and this is precisely the mechanism §1.4 used to explain why menu grouping helps in practice: it keeps the relevant options visible rather than requiring them to be held in mind.

**The remaining seven** — match between system and the real world, consistency and standards, error prevention, flexibility and efficiency of use, aesthetic and minimalist design, help users recognize/diagnose/recover from errors, and help and documentation — follow the same pattern: each names a *specific, recurring mechanism* by which an interface creates friction or confusion, derived from real observed failures rather than asserted as taste.

## 3.3 Deriving the Severity Scale — Why Three Dimensions, Not One

An evaluator using the heuristics will find many problems in one pass. Not all of them matter equally, and "how bad is it?" turns out to need more than one number to answer honestly.

Consider two problems: (a) a confusing icon that *every* user misreads for a few seconds before figuring it out, and (b) an edge case that *rarely* triggers, but when it does, silently deletes the user's work with no error and no recovery. Problem (a) is common but trivially recoverable. Problem (b) is rare but catastrophic. **A single "how bad" score would collapse two genuinely different situations into the same number** — and whichever way you'd resolve the tie, you'd be wrong for the other case.

Nielsen's severity rating separates the causes of "bad" into three independent factors that must each be assessed:

- **Frequency** — how common is the problem (rare, or does every user hit it)?
- **Impact** — how hard is it for the user to work around or recover from, if it occurs?
- **Persistence** — is it a one-time confusion (annoying once, then learned) or does it bother the user on every single use?

Combined judgment then maps to a fixed 0–4 scale:

```
0 — Not a usability problem at all
1 — Cosmetic only — fix if time allows
2 — Minor — low priority
3 — Major — important, high priority
4 — Catastrophe — must fix before release
```

Reworking the two examples through this lens: the confusing-but-common icon is high frequency, low impact (once seen, learned), likely persistent only briefly — probably a **2**. The rare-but-catastrophic data-loss bug is low frequency, maximum impact, and — crucially — its *low* frequency doesn't save it, because catastrophic impact dominates the score regardless of how rarely it triggers. That's a **4**, and it needs to be fixed before release even though almost no user will ever hit it. **The three-factor structure is what prevents "it's rare" from being used to justify shipping something catastrophic** — a single frequency-weighted score would systematically under-prioritize exactly the class of bug most worth catching before release.

## 3.4 Why Multiple Evaluators, Not One

A single evaluator, working alone through the heuristics against an interface, reliably misses a large fraction of the real problems — not from carelessness, but because **different evaluators, applying the identical checklist, notice different things.** Each person's background, familiarity with the product, and mental model of "what a user would do" shapes which violations jump out and which slide past unnoticed.

The practical response — used throughout Nielsen and Molich's own methodology — is **independent evaluation by 3–5 evaluators**, each working alone (so one evaluator's findings don't anchor another's attention), with results pooled and de-duplicated afterward. Independent evaluators catch substantially more combined than any one of them catches alone, precisely because their misses are only partially overlapping — evaluator A tends to catch what evaluator B missed, and pooling recovers coverage that no single pass would have found. This is a direct structural analogue of Chapter 2 §2.3's split between quantitative and qualitative research: a single method, run once, systematically under-samples the space of real problems, and the fix in both cases is combining independent sources rather than trusting one pass to be complete.

## 3.5 When It Breaks: "Five Users Find 85% of Problems"

The most widely repeated number in usability research is Jakob Nielsen's claim, from a [2000 article](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/): **test with five users and you'll find 85% of usability problems.** It's worth deriving the actual formula behind it, because the number is correct exactly where its assumption holds — and that assumption is far more fragile than the popular version of the claim suggests.

**The formula.** If each user independently has probability `p` of encountering any given usability problem, the probability that at least one of `n` users encounters it is:

```
found(n) = 1 - (1-p)^n
```

Nielsen used an assumed average discovery rate of **p = 0.31**. Computed directly:

```
n= 1  ->  31.0% of problems found
n= 2  ->  52.4%
n= 3  ->  67.1%
n= 5  ->  84.4%     <- the famous "85% with 5 users" claim
n=10  ->  97.6%
n=20  ->  99.9%
```

*(Verified — this is exactly where the popular number comes from, and at `p=0.31` it's arithmetically correct.)*

**The fragility.** That whole result rests on `p=0.31` being the right value for *your* interface, *your* users, *your* problem set. Vary it and hold `n=5` fixed:

```
p=0.10 -> only 41.0% found at n=5   (need n=18 for 85%)
p=0.20 -> 67.2% found at n=5        (need n=8.5 for 85%)
p=0.31 -> 84.4% found at n=5        (need n=5.1 for 85%)
p=0.40 -> 92.2% found at n=5
```

*(Verified.)* At a genuinely plausible lower discovery rate of 0.10 — meaning most problems are individually rare, which is common for complex or specialized software — five users find under half the problems, and reaching 85% coverage would actually require **eighteen** users, not five. The entire headline claim is a single point estimate riding on one specific, unverified value of `p`.

**The empirical confirmation.** This isn't a hypothetical objection — Laura Faulkner tested it directly, running real usability evaluations with 60 users and repeatedly sampling random subsets of 5. If the formula's single 85% figure were the reliable expectation, random 5-user samples should cluster tightly around it. They didn't: **individual 5-user samples found anywhere from 55% to 99%** of the known problems, depending purely on which five people happened to be selected. With 10 users, the *worst* sample's coverage rose to 80%; with 20, to 95%. The formula's headline number is real, but it's an average masking enormous sample-to-sample variance — and a team running exactly one 5-user study, taking the outcome at face value, has no way to know whether they landed near the 99% end or the 55% end of that range.

**The corrected takeaway.** Small-sample testing genuinely works well for the category of problem heuristic evaluation is best at — common, high-`p` issues that most users hit — which is exactly where §3.1 said the heuristics excel. It's much less reliable for rare, high-impact problems (Chapter 3.3's severity-4 category), which is precisely where a single small study is most likely to land in Faulkner's unlucky 55% tail. "Five users are enough" survives as a genuine, useful heuristic for one specific class of finding; it is not a universal guarantee, and treating a single small study as complete coverage is the same mistake as trusting a single evaluator's heuristic pass instead of pooling several — an unlucky sample looks identical to a thorough one from the inside.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §3.3 gave the "rare but catastrophic" data-loss bug a severity of 4 despite low frequency, arguing impact should dominate. Construct a case where the opposite is true — where a HIGH-frequency, LOW-impact problem should also rate as a 3 or 4, and explain why frequency alone can push severity that high even without catastrophic impact.</summary>

Take a confusing label on a primary navigation element — say, a "Submit" button whose actual behavior (save as draft vs. finalize) is genuinely ambiguous from its wording alone. Any individual instance is trivially recoverable: the user clicks, sees the wrong thing happened, and corrects it in a few seconds. By impact alone this looks like a 1 or 2.

But this button is on the **primary path**, hit by every single user, every single session — frequency is effectively 100%, and persistence is total (it never stops being confusing, because there's nothing to learn; the label is genuinely ambiguous, not just unfamiliar). Multiply a small individual cost by "happens to literally everyone, every time, forever," and the aggregate cost across the user base is enormous even though no single incident is dramatic — this rates a **3**, arguably higher.

**Why frequency alone can drive severity up without catastrophic impact:** the three-factor model isn't just "take the max of three scores" — it's closer to an aggregate cost, and a cost that's small-per-instance but occurs on nearly every session accumulates just as much real damage, spread across the whole user base, as a rare catastrophe concentrated in a few unlucky sessions. The severity scale's job is to compare *total cost*, and total cost has (at minimum) two independent routes to being large: rare-and-severe, or common-and-mild-but-relentless. Missing either route because you're anchored on "impact is what matters" is exactly the trap §3.3 built the three-factor scale to prevent — it just cuts in both directions, not only toward protecting rare catastrophes.
</details>

<details>
<summary><strong>Q2.</strong> §3.4 argued that pooling 3-5 independent evaluators catches substantially more than any evaluator catches alone. Suppose your team has exactly one HCI-trained person and four engineers with no HCI background. Is "5 evaluators" from this team equivalent to Nielsen's model, or does it break down — and if so, how?</summary>

It partly breaks down, and the mechanism is worth being precise about, because it's not simply "non-experts are worse at this."

**What pooling assumes:** each evaluator's *misses* are at least somewhat independent — evaluator A tends to catch some of what B missed, precisely because their attention is drawn to different things for different, largely uncorrelated reasons. That independence is what makes the pooled coverage exceed any individual's coverage.

**What breaks with four untrained engineers:** their misses are far more likely to be **correlated with each other**, not independent, because they share a common blind spot — none of them has been trained to notice the specific failure categories the heuristics name. Four engineers evaluating together are far more likely to all miss the same category of problem (say, anything involving screen-reader compatibility, or a subtle inconsistency in interaction pattern between two screens) than to each miss a *different* one — which is the opposite of the assumption that makes pooling valuable. Nielsen's own research on this point found untrained evaluators found meaningfully fewer usability problems than those with actual HCI expertise, particularly for the less "surface-obvious" heuristics.

**What the setup does still capture:** engineers, despite lacking formal HCI training, bring a *different* systematic blind spot than the HCI-trained evaluator does — they're likely to catch inconsistencies with underlying system behavior, edge cases in state transitions, or logically confusing flows that a design-trained eye might read past because it looks visually fine. So the group isn't worthless; it's just not doing what the "5 independent evaluators" model assumes. It's closer to **2 partially-independent sources** (the HCI-trained evaluator, and the engineering group's shared-but-different perspective) than 5 genuinely independent ones.

**The practical fix**, following directly from diagnosing the actual mechanism: don't count this as "5 evaluators" for coverage purposes. Either train the engineers briefly on the specific heuristics before their pass (converting some of their correlated blind spot into the trained evaluator's blind spot, at least partially), or explicitly weight the HCI-trained evaluator's pass more heavily and treat the engineers' combined findings as one supplementary source rather than four independent ones. The number of people in the room and the number of *independent perspectives* are not the same quantity, and §3.4's argument only works for the second one.
</details>

<details>
<summary><strong>Q3.</strong> §3.5 showed the "5 users, 85%" claim breaks down specifically for rare, high-impact problems — exactly the severity-4 category from §3.3. Given that heuristic evaluation is also weakest at catching problems specific to your actual users (§3.1's limit), what category of usability problem can BOTH techniques from this chapter systematically miss together?</summary>

The specific, dangerous intersection: **a rare, catastrophic problem that is also specific to your actual users' real context** — not a generic, well-known failure category, and not common enough to reliably surface in a small sample.

Concretely: a banking app's "confirm transfer" flow works flawlessly for every test scenario and every heuristic in Nielsen's list — clear status, reversible where it should be, recognizable rather than requiring recall. But for users on an unreliable mobile connection in an area with intermittent signal (a real context, invisible to evaluators testing on office wifi with a desktop), a specific timing window exists where a double-tap under network lag submits the transfer twice. This is:

- **Missed by heuristic evaluation**, because it isn't a known, previously-catalogued category from the 1994 factor analysis — it's an interaction between this specific interface's timing and this specific population's actual network conditions, exactly the kind of problem §3.1 said the heuristics can't anticipate.
- **Missed by a 5-user study**, because — being genuinely rare, triggered only under a specific network condition most test participants won't happen to have — it sits squarely in the low-`p` tail §3.5 showed the formula handles worst, and could easily land in Faulkner's unlucky 55% sample.

**Why the two methods don't independently reduce the shared blind spot in this case:** the natural assumption is that different methods compensate for each other's weaknesses in general — and that's often true. But here, the *same underlying cause* — this problem depends on a real-world context (network reliability during actual use) that neither method observes — defeats both simultaneously. Heuristic evaluation never leaves the interface's abstract logic to encounter real network conditions at all; a lab-based usability study, even a large one, typically doesn't either, unless the test protocol specifically simulates degraded conditions.

**What this points toward:** the gap isn't closed by running heuristic evaluation *and* a bigger usability study, if both happen in the same controlled, contextless setting. It requires methods that specifically incorporate **real usage context and real-world failure conditions** — which is exactly why production monitoring, error tracking, and post-release usability data matter as a genuinely distinct source, not a redundant one, alongside pre-release evaluation. Chapters 5-6 build the pre-release testing methodology further; the honest limit established here is that pre-release methods, however well combined, cannot fully substitute for observing what actually happens once real users, in real conditions, use the real thing.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The problem | "Feels off" isn't actionable — heuristic evaluation converts it into something named, severity-rated, and fixable |
| Origin of the 10 heuristics | Nielsen & Molich 1990, refined 1994 via factor analysis of **249 real usability problems** — empirically distilled, not brainstormed from taste |
| Visibility of system status | Silence forces the user to hold "did that work?" in working memory — an extraneous-load cost, same mechanism as Ch01 §1.5 |
| User control / undo | The interface expression of CSE801's reversibility principle — undo converts a one-way door into a two-way one, which is what determines how much friction the action deserves |
| Recognition over recall | Direct application of Ch01's Miller's-Law/cognitive-load argument: matching a visible option costs less than retrieving one from memory |
| Severity: 3 factors | Frequency × Impact × Persistence, on a 0-4 scale. Prevents "it's rare" from excusing a catastrophic bug, and — Q1 — prevents "it's minor" from excusing a problem that's simply everywhere |
| Multiple evaluators | 3-5 independent passes catch substantially more combined than any one evaluator, because misses are only partially overlapping — same logic as Ch02's multi-method research argument |
| "5 users find 85%" | **Verified:** true exactly at the assumed `p=0.31`. At `p=0.10`, only 41% is found at n=5, and reaching 85% needs **18** users, not 5 |
| Faulkner's empirical check | Real 5-user samples from a 60-user study ranged from **55% to 99%** — the formula's single number hides enormous sample variance |
| Corrected takeaway | Small-sample testing works well for common, high-`p` problems (heuristic evaluation's strength); unreliable for rare, high-severity ones — precisely where it matters most |

## Where We Go Next

Heuristic evaluation, even done well by multiple trained evaluators, checks a design against **known** categories of failure — and Q3 showed exactly where that runs out: a rare, context-specific problem invisible to both a fixed heuristic list and a small sample of users tested outside their real conditions.

Chapters 4 covers accessibility specifically as its own structured framework — POUR — bridging to the extensive implementation-level accessibility content that already exists elsewhere in this curriculum. Chapter 5 then builds prototyping methods for testing ideas before they're fully built, and Chapter 6 closes with real usability testing methodology — the technique that actually puts a design in front of a real person doing a real task, which is the only method in this course that can catch the category of problem this chapter's own limits just exposed.

*Next: [04_Accessibility_POUR_Framework.md](04_Accessibility_POUR_Framework.md)*
