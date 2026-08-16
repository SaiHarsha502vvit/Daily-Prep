# Chapter 6 — Usability Testing & Measurement

> Every method so far has been a proxy: heuristics predict problems, POUR audits structure, prototypes rehearse reactions cheaply. This chapter is the one where a real person attempts a real task on the real thing, and you watch, rather than predict, what happens.

---

## The Problem

Chapter 3's heuristic evaluation catches known-category problems without needing a single user. Chapter 4's accessibility audit checks conformance against a fixed standard. Chapter 5's prototypes rehearse reactions cheaply, before full commitment. All three are genuinely valuable, and all three share a limit stated explicitly at the end of Chapter 3: none of them can catch a problem specific to *your* actual users, in *their* actual context, doing *their* actual task — because none of them involve a real person actually doing the thing.

Usability testing closes that gap directly. It's also the most expensive method in this course to run, which is exactly why the other five chapters exist first — to catch the cheap, known-category problems before spending the time this chapter's method costs, and to prototype ideas cheaply before testing a fully-built version of the wrong one.

## 6.1 Deriving the Test Plan's Required Structure

"Watch a user try the product" sounds simple enough to improvise. Improvised sessions reliably produce unusable results, for reasons worth deriving rather than taking on faith.

**Without a defined research question, findings can't be compared across sessions.** If each session wanders based on what seems interesting in the moment, session three isn't testing the same thing session one was, and there's nothing to aggregate. The plan needs an explicit question upfront: *what specifically are we trying to learn* — can new users complete checkout unassisted? Does the redesigned navigation reduce the time to find a specific setting?

**Without written task scenarios, the moderator will unconsciously lead the participant.** "Try to update your shipping address" is a neutral task. "Click on the address icon in settings to update it" has already told the participant where to look — the exact thing the test exists to find out. Scenarios need to describe a **goal**, phrased the way a real user would think about their own intent, never a **path** — because the path is precisely what's being tested.

**Without participant screening criteria derived from Chapter 2's personas, the sample doesn't represent anyone real.** A team's own developers make poor test participants for exactly this reason — they already have an accurate mental model of the system's structure, which is the one thing a real first-time user won't have. Screening criteria should be pulled directly from the personas built in Chapter 2, not improvised on the day.

**Without predefined success metrics, "how did it go" becomes a subjective impression** rather than comparable data — the same problem Chapter 3 §3.3 solved for heuristic findings with a structured severity scale, appearing again at the planning stage instead of the analysis stage. Metrics should be set *before* the session: task completion (did they succeed, unassisted?), time on task, number of errors, and — this chapter's next section — a standardized post-task questionnaire.

## 6.2 Think-Aloud — Deriving Why Watching Isn't Enough

Simply observing what a participant clicks tells you *what* happened. It says nothing about *why* — whether a hesitation before clicking meant genuine confusion, a moment of careful reading, or an unrelated distraction. Two participants clicking the identical button after an identical pause can be having completely different experiences, invisible from outside.

The **think-aloud protocol**, given its rigorous theoretical grounding by Ericsson and Simon in [1980](https://cecas.clemson.edu/cedar/wp-content/uploads/2016/07/Ericsson.pdf), asks the participant to continuously verbalize their thoughts while working — not explaining or justifying, simply narrating the reasoning as it happens: *"I'm looking for a settings icon... I don't see one, so I'll try this menu... okay, this isn't it, going back."* This converts an opaque behavior sequence into an observable reasoning trace, turning "they clicked the wrong thing" into "they clicked the wrong thing **because** they expected settings to be under that icon based on where it lives on a different app they use daily" — the second version is the one that's actually actionable.

**A real methodological choice worth deriving, not glossing over: concurrent versus retrospective.**

- **Concurrent** (thinking aloud *during* the task) captures reasoning in the moment, with nothing lost to memory decay — but the verbalization itself can change how the task is performed. Speaking your reasoning aloud is a different cognitive activity than silently doing something, and for tasks depending on fast, intuitive judgment, forcing conscious articulation can slow the participant down or change their strategy — a phenomenon called **reactivity**.
- **Retrospective** (silently completing the task, then narrating afterward, often while reviewing a recording) avoids altering the task itself — but relies on memory, which is reconstructive rather than a faithful replay, and a participant will sometimes rationalize a decision after the fact in a way that doesn't match what was actually happening moment to moment.

**Neither is strictly better — the choice should track the research question**, the same principle Chapter 5 §5.2 applied to prototype fidelity. Testing raw task-completion speed calls for retrospective (don't contaminate the timing data); testing the *reasoning process itself* — why a specific decision got made — calls for concurrent, because that reasoning is exactly what's being measured, and the risk of reactivity is worth accepting to capture it while it's still fresh rather than reconstructed after.

## 6.3 The System Usability Scale — Verified

Task-level metrics (completion, time, errors) measure whether a *specific task* succeeded. They say nothing about the participant's overall subjective sense of the *system* — and a system can have a participant complete every task while leaving them feeling the whole thing was effortful and unpleasant, a real, distinct finding neither task metric captures.

The **System Usability Scale**, developed by John Brooke at Digital Equipment Corporation in 1986, is a standardized 10-item questionnaire (alternating positive and negative statements, each rated 1-5) that produces a single comparable 0-100 score. The scoring, worth computing directly rather than trusting:

```
For odd items (1,3,5,7,9 — positively worded):   contribution = response - 1
For even items (2,4,6,8,10 — negatively worded):  contribution = 5 - response
Score = (sum of all 10 contributions) x 2.5
```

**Worked example**, one participant's actual 10 responses:

```
Q1 (positive): response=4  contributes 3
Q2 (negative): response=2  contributes 3
Q3 (positive): response=5  contributes 4
Q4 (negative): response=2  contributes 3
Q5 (positive): response=4  contributes 3
Q6 (negative): response=2  contributes 3
Q7 (positive): response=4  contributes 3
Q8 (negative): response=1  contributes 4
Q9 (positive): response=4  contributes 3
Q10(negative): response=2  contributes 3

sum x 2.5 = 80.0
```

*(Verified.)* [Bangor, Kortum, and Miller's 2008](https://www.researchgate.net/publication/228368593_Determining_What_Individual_SUS_Scores_Mean_Adding_an_Adjective_Rating_Scale) large-scale analysis established the empirical benchmark: the industry average is **68**, and scores map to letter grades — above 80.3 is A (excellent), 68-80.3 is B (good), below 51 is F (awful). Our worked example, 80.0, lands solidly in **B territory** — genuinely good, just short of excellent.

**The result worth noticing:**

```
All neutral responses (every item = 3)  ->  50.0   Grade: F
```

*(Verified.)* A participant who felt completely lukewarm about everything — no strong opinion in either direction — doesn't land at a middling grade. They score an **F**. This isn't a quirk of the arithmetic; it's the scale correctly reflecting something real: the alternating positive/negative item design means an *engaged* respondent, whether genuinely satisfied or genuinely frustrated, produces a response pattern that differs meaningfully from item to item. A flat "3 to everything" response pattern is itself informative — it typically indicates a disengaged respondent, or a system that failed to produce any strong reaction in either direction, and 50 sitting well below the 68 average (F territory) reflects that a product nobody has a real opinion about is not, in fact, a middling product — genuine indifference is a worse outcome than the scale's midpoint might naively suggest.

## 6.4 From Observation to Severity-Rated Finding

A raw observation — "participant hesitated 8 seconds before finding the export button, then said 'oh, it's under the three dots, that's not where I expected'" — isn't yet a usable finding. It becomes one by running it through exactly the machinery Chapter 3 built for heuristic evaluation, closing the loop between predicted and observed problems:

1. **Name the heuristic it violates** — here, most directly, *recognition rather than recall* (Chapter 3 §3.2): the control existed but wasn't visible/recognizable where expected.
2. **Rate its severity** using Chapter 3 §3.3's three factors — frequency (did multiple participants hit this, or just one?), impact (how long did recovery take, did they eventually succeed unassisted?), persistence (would this stop mattering once learned, or recur every session?).
3. **File it alongside heuristic-evaluation and accessibility-audit findings** in one prioritized list, because a usability-test finding and a heuristic-evaluation finding compete for the same limited engineering time, and a unified severity scale is what makes that prioritization decision comparable across sources rather than arbitrary.

This is the concrete mechanism by which this chapter's expensive, high-fidelity method and Chapter 3's cheap, no-user method end up feeding the *same* backlog, rated on the *same* scale — the whole course's methods converge into one shared, comparable output rather than several separate, incompatible reports.

## 6.5 When It Breaks: Being Watched Changes Behavior

A usability test's entire premise is watching someone use the product close to how they normally would. The act of watching is itself an intervention, and pretending otherwise produces misleadingly clean results.

**The observer effect, concretely:** a participant who knows they're being watched, recorded, and evaluated behaves differently than someone alone with the product at 11pm, mildly distracted, using it for a real reason rather than a assigned task. They're likely to be more careful, more patient with confusion, more reluctant to simply abandon a difficult task the way a real, unmonitored user would — because abandoning in a lab session feels like a personal failure in front of a moderator, in a way that closing a tab at home never does. This tends to make lab-observed completion rates look **better** than what happens in the wild, and it can also mask problems that would trigger a real user's actual instinct to give up.

**Countermeasures, each addressing a different piece of the mechanism:**

- **Moderator framing that explicitly relocates the "failure"** — telling participants directly, before starting, that the *product* is being tested, never the participant, measurably reduces the self-consciousness that drives the effect.
- **Minimize visible moderator presence** where the format allows — a moderator sitting silently to the side produces less self-monitoring than one hovering and reacting in real time to every action.
- **Corroborate lab findings with unmoderated data** — session recordings, analytics from real production usage, support tickets — none of which carry the observer effect, because nobody watching knew they were being watched at the time. A finding that shows up in *both* a lab session and real unmoderated usage data is far more trustworthy than one that appears only in the artificial setting.

**The generalizable lesson, closing the course on the same note several earlier chapters already struck**: no single method in this course — heuristic evaluation, accessibility audit, prototype testing, or lab-based usability testing — is free of its own structural blind spot. Chapter 3 showed heuristics miss context-specific problems; Chapter 4 showed automated tools have a hard ceiling; Chapter 5 showed prototypes can validate the undeliverable; this chapter shows even direct observation of a real person changes what's being observed. **The actual practice isn't finding the one correct method — it's knowing each method's specific blind spot well enough to combine methods that cover for each other**, which is precisely the reasoning this course has applied at every level: research methods (Ch02 §2.3), evaluators (Ch03 §3.4), fidelity dimensions (Ch05 §5.1), and now observation itself.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §6.3 showed a flat "all 3s" SUS response scores 50 (Grade F) — worse than the industry average, despite representing what looks like genuine neutrality. Construct a realistic scenario where a participant's honest, genuine experience would legitimately produce this exact response pattern, and explain what the resulting F grade would and wouldn't tell you.</summary>

**Scenario:** a participant tests an internal admin tool they'll use perhaps once a month, for a narrow, low-stakes task. They complete it successfully, hit no errors, and genuinely have no strong feelings about the experience either way — it wasn't impressive, it wasn't frustrating, it simply did the thing with no memorable friction and no memorable delight. Answering "3, neutral" to every item is a completely honest report of that actual experience.

**What the resulting F grade would tell you:** correctly, that this product produced no positive emotional engagement or perceived excellence — which is real, useful information if the goal is a product people actively enjoy or would recommend. The F is not measurement error; it's accurately capturing "unremarkable" as a genuine, if unflattering, place on the usability spectrum.

**What it would NOT tell you, and where relying on the number alone would mislead:** whether the task was actually *completed successfully*. SUS is a **subjective, holistic** measure — it says nothing directly about objective task performance (§6.1's completion rate, time-on-task, error count). A participant can score an F on SUS while succeeding at every task with zero errors, precisely as in this scenario — the emotional experience and the objective outcome are measuring genuinely different things, and collapsing them into "the SUS score tells me how usable it is" loses that distinction entirely.

**The practical implication, following directly from §6.1's original argument for having multiple predefined metrics rather than one:** SUS should never be the *only* metric in a test plan. For a low-stakes internal tool used rarely, an F alongside a 100% task completion rate and zero errors is a completely different, far less alarming finding than the same F paired with a 40% completion rate — and only having both metrics in the plan lets you tell the difference between "unremarkable but functional" and "actually broken." This is exactly why §6.1 derived the need for *multiple* predefined success metrics rather than any single one, including SUS, standing alone.
</details>

<details>
<summary><strong>Q2.</strong> §6.2 said concurrent think-aloud risks "reactivity" — the verbalization changing how the task is performed. Propose a specific type of task where this risk is severe enough that concurrent think-aloud should be avoided entirely, even though it's usually the richer data source.</summary>

**Any task whose core property being tested is speed, automaticity, or intuitive/System-1 judgment** — tasks the interface is specifically supposed to make fast and near-unconscious for a practiced user.

Concrete example: testing whether a redesigned data-entry form lets an experienced user maintain their normal fast typing/tabbing rhythm, versus introducing friction that breaks flow. This is precisely a case where the property under test — *fluent, low-conscious-effort execution* — is the exact cognitive mode concurrent think-aloud disrupts. Forcing continuous narration converts fast, largely automatic execution into slow, deliberate, consciously-monitored execution — not a side effect around the edges of the measurement, but a direct intervention on the *specific quantity being measured*. Any timing data collected under concurrent think-aloud here isn't a slightly-noisy version of the real number; it's measuring a fundamentally different cognitive process than the one the test exists to evaluate.

**Contrast with where concurrent think-aloud remains the right call despite the same reactivity risk existing in principle:** testing whether a first-time user can navigate an unfamiliar interface. Here, the task is *already* slow and consciously deliberated even without narration — a confused new user is by definition engaging System-2, effortful reasoning, not fluent automaticity. Concurrent think-aloud adds relatively little additional distortion to a process that was already slow and deliberate, while providing exactly the reasoning-trace data §6.2 argued is otherwise invisible.

**The general rule this derives:** reactivity's cost scales with how far the verbalization pushes the participant's cognitive mode away from what actually happens in real, unmonitored use. Retrospective think-aloud — or dropping verbal protocol entirely in favor of pure timing and behavioral observation — is the right call whenever the task's natural execution mode is fast and automatic; concurrent think-aloud is safe, and valuable, when the task is naturally slow and effortful already, since narration then changes comparatively little.
</details>

<details>
<summary><strong>Q3.</strong> This course's capstone combines heuristic evaluation (Ch03), an accessibility audit (Ch04), and usability testing (this chapter) into one study of an existing application. Given each method's distinct blind spot — established across §6.5's closing argument — what specific ORDER should these three run in, and why does the order itself matter rather than just running all three eventually?</summary>

**The derivable order: heuristic evaluation and accessibility audit first, in either order relative to each other, usability testing last — never the reverse.**

**Why cheap-and-fast has to precede expensive-and-slow, in general:** heuristic evaluation (Chapter 3) and an accessibility audit (Chapter 4) require no participant recruitment, no scheduling, and can be completed by the existing team in days. Usability testing (this chapter) requires recruiting real participants matching Chapter 2's personas, scheduling sessions, and running them — the most expensive step in the entire study by a wide margin. Running the cheap methods first means walking into the expensive step with a known set of already-identified problems, so usability-testing time gets spent specifically on what *only* real users, doing real tasks, can reveal — Chapter 3's own stated limit — rather than being spent re-discovering a missing `alt` attribute a five-minute automated scan would have caught for free.

**A second, more specific reason favoring this exact order, not just "cheap before expensive" in the abstract:** fixing heuristic and accessibility findings *before* the usability test changes what the usability test is actually testing. Running usability testing first, against a version still containing known, fixable structural problems, means test sessions get consumed by problems the team already knew about and could have fixed without spending a single participant's time — participants would spend their limited sessions rediscovering catalogued issues instead of surfacing the genuinely unknown ones. Fixing first means the expensive method is spent entirely on what's actually still unknown, which is the only thing it's uniquely positioned to find.

**What this order does NOT mean:** that heuristic and accessibility fixes must be fully completed and shipped before scheduling a single test session — for capstone-scale audits, "run the fast methods, triage and fix the clear, cheap wins, then test" is enough; low-severity cosmetic findings genuinely don't need to block scheduling. The requirement is specifically that the *severe or obviously-fixable* known issues (Chapter 3 §3.3's severity 3-4 findings) are resolved first, so the expensive method isn't spent re-finding what a five-minute automated scan or a single afternoon of heuristic evaluation would have caught for free.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Why this method last | It's the only one that observes a real person on a real task — and the most expensive, which is exactly why the cheaper methods run first |
| Test plan requirements | Explicit research question (comparability), goal-phrased task scenarios (not paths, which would lead the participant), persona-derived screening, predefined success metrics |
| Think-aloud | Ericsson & Simon 1980 — converts an opaque behavior sequence into an observable reasoning trace: not just what happened, but why |
| Concurrent vs retrospective | Concurrent risks reactivity (verbalizing changes the task); retrospective risks memory reconstruction. Choice should track the research question, same logic as Ch05's fidelity-matching |
| SUS, verified | Brooke 1986; `(odd: r-1) + (even: 5-r), sum x 2.5`. Worked example scores 80.0 (Grade B); industry average is 68 (Bangor/Kortum/Miller 2008) |
| The counterintuitive result | All-neutral responses score **50, Grade F** — genuine indifference is a worse outcome than the scale's naive midpoint suggests |
| SUS's real limit | Subjective/holistic only — Q1: a product can score an F while achieving 100% task completion. Never use it as the only metric |
| Closing the loop | Raw observations become findings by running through Ch03's exact severity machinery — heuristic-evaluation and usability-test findings end up in one shared, comparable backlog |
| Observer effect | Being watched changes behavior — typically inflating completion rates versus real unmonitored use. Countered by framing, minimizing visible moderation, and corroborating with unmoderated data |
| The course's throughline | Every method has a specific blind spot (Ch03: known categories only; Ch04: syntax not meaning; Ch05: buildability; Ch06: observation itself) — the actual skill is combining methods whose blind spots don't overlap |

---

## Course Wrap-Up

Six chapters, and the throughline was never "which technique is correct" — it was **matching a specific technique to the specific question it can actually answer, and knowing exactly where each one stops working.**

**The sequence:** [Ch01](01_HCI_Foundations_Fitts_Hick_Cognitive_Load.md) gave the physics of a single interaction — and its own naive Hick's Law calculation contradicted common chunking advice, teaching early that computing a model beats repeating a citation. [Ch02](02_User_Centered_Design_Process.md) built the process for finding out what to build at all, correcting the "100x cheaper to fix early" myth to Boehm's real, smaller, still-sufficient numbers along the way. [Ch03](03_Usability_Heuristics_And_Evaluation.md) gave a structured way to evaluate a finished design without a single user — and then showed the famous "5 users find 85%" claim is fragile, real only at one specific assumed discovery rate. [Ch04](04_Accessibility_POUR_Framework.md) applied the same structural thinking specifically to exclusion, verifying the actual contrast-ratio math and finding a widespread real-world failure (`#AAAAAA` placeholder text) along the way. [Ch05](05_Prototyping_Methods.md) built ways to test ideas before full commitment, and derived why polish itself suppresses the feedback a design most needs. This chapter closed with the one method that watches a real person, and immediately admitted that watching changes what's watched.

**Three ideas ran through all of it:**

1. **Every method has a specific, nameable blind spot**, not a vague "limitation." Heuristics miss what's outside their known categories. Automated accessibility tools can't judge meaning. Prototypes can validate the undeliverable. Observation changes behavior. Naming the blind spot precisely is what lets you choose a *complementary* method rather than a *redundant* one.

2. **Citations are claims, and claims get checked.** This course verified rather than repeated: Boehm's real cost-of-change ratio, the actual math behind "5 users, 85%," the real WCAG contrast formula computed on real colors, the real SUS formula and its counterintuitive F-for-neutral result. Several of the field's most repeated numbers turned out to be either mythical (the IBM 100x study) or far more conditional than their popular version suggests — and catching that mattered more than the popular version would have.

3. **Reversibility, cost, and confidence move together — and confidence can be the misleading one.** A polished prototype and a well-observed lab session both *feel* more trustworthy than a rough sketch or unmoderated data, and both are, in specific ways, less trustworthy — because polish suppresses criticism and observation changes behavior. The felt confidence of a method and its actual reliability are not the same axis, and this course kept finding that gap in a new place each chapter.

**To go further:** run the capstone protocol Q3 derived — heuristic evaluation and an accessibility audit first, fixes triaged, then a real usability test — on an application you didn't build. The gap between what you'd predict from Chapter 3 alone and what a real participant in Chapter 6 actually does is the whole reason this course has six chapters instead of one.
