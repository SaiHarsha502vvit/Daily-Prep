# Chapter 1 — HCI Foundations: Fitts's Law, Hick's Law & the Limits of Pure Decision Models

> "Make it intuitive" is not a specification — it's a wish. This chapter replaces the wish with arithmetic: two equations that predict, in milliseconds, how a specific button placement or menu design will actually perform, before a single user touches it.

---

## The Problem

Two developers each build a settings page. Both are functionally correct — every option is reachable, every click does what it says. One feels instant. The other feels like wading through mud. Neither developer can explain why, because "feels like wading through mud" isn't the kind of thing code review catches.

HCI's founding insight is that interaction speed and error rate aren't vibes — they're **measurable properties of the human motor and cognitive system**, discovered the same way physical constants are: controlled experiments, decades of replication, equations that predict new cases correctly. This chapter derives the two oldest and most load-bearing of them, verifies what they actually predict with real numbers, and — importantly — shows where a naive application of them gives a wrong answer, because that failure is as instructive as the success.

## 1.1 Fitts's Law — Deriving Why Size and Distance Trade Off

**The task Paul Fitts studied in 1954:** move a pointer from a starting position to a target of width `W`, a distance `A` (amplitude) away, as fast as possible without missing. This is *exactly* what clicking a button is.

**The derivation's intuition.** Movement toward a target has two phases: a fast, ballistic approach that gets you roughly there, and a slower, corrective phase that fine-tunes onto the target. The correction phase is where difficulty lives — and difficulty should depend on the target's size **relative to** how far you had to travel, not on either alone. A target twice as far away is harder to hit at the same size; a target twice as large is easier to hit at the same distance. What actually matters is the *ratio*.

Fitts formalised "difficulty" as an information-theoretic quantity — bits of positioning precision required — and found movement time is **linear in that quantity**:

```
ID = log2(2A / W)                    Index of Difficulty, in bits
MT = a + b · ID                      Movement Time
```

`a` and `b` are empirical constants fit to a person's specific input device (Card, English & Burr's classic 1978 mouse study is the canonical source). This chapter uses illustrative values `a=0.1s, b=0.17s` throughout — the shape of the results matters, not these specific numbers.

**Verified: same distance, different target sizes.**

```
Tiny icon far away           A=600px W= 16px  ID=6.23 bits  MT=1159 ms
Normal button, same distance A=600px W= 48px  ID=4.64 bits  MT= 889 ms
Large button, same distance  A=600px W=120px  ID=3.32 bits  MT= 665 ms
```

Same distance, and shrinking the target from 120px to 16px **nearly doubles** the predicted time — not because the click itself is different, but because hitting a small target reliably requires that slow corrective phase to do more work.

**Verified: same target, different distances.**

```
Nearby toolbar button   A= 80px W=40px  ID=2.00 bits  MT=440 ms
Across-screen button    A=800px W=40px  ID=5.32 bits  MT=1005 ms
```

Same button, moved across the screen: **more than double** the time. This is the whole argument for keeping frequent actions near where the user's attention already is, rather than banishing them to a distant toolbar for visual tidiness.

## 1.2 The Edge Effect — Verified, Not Just Asserted

A specific, famous consequence: **targets pinned to a screen edge are effectively easier to hit than their pixel width suggests**, because a cursor moving toward the edge physically cannot overshoot past it — the operating system stops it there. In effect, the target's usable width in the direction of travel is much larger than its drawn width. This is the textbook justification for the original Macintosh's screen-top menu bar.

Modelling this honestly matters, because the naive version of this example breaks the formula. Plug in an enormous `W` to represent "infinite effective width" and `ID = log2(2A/W)` goes **negative** — `W=100000px` at `A=600px` gives `ID = -6.38`, a nonsensical negative predicted time. The formula's derivation assumes `W < 2A`; past that point you're outside where the model was fit, and it will hand you garbage without complaint. **A model doesn't stop returning numbers when you leave its domain — it just stops meaning anything, so checking the domain is part of using it correctly.**

The valid comparison uses a large but bounded effective width — say, a button spanning much of the screen edge rather than an absurdity:

```
Normal floating button (48px)                          A=600px W= 48px  ID=4.64 bits  MT=889 ms
Screen-edge button (400px effective, can't overshoot)   A=600px W=400px  ID=1.58 bits  MT=369 ms
```

*(Verified — both within the formula's valid domain.)* A **58% reduction in predicted time**, from the edge alone — a real, substantial, and correctly-modelled effect, not the broken infinite-width version.

## 1.3 Hick's Law — Deriving Why More Choices Means Slower Decisions

Fitts's Law governs *physical* movement to a known target. A different question: given `n` options, how long does it take to **decide** which one you want?

**W. E. Hick's 1952 experiment:** subjects faced `n` lamps, each mapped to a response key, and had to press the key matching whichever lamp lit. Reaction time grew with `n` — but logarithmically, matching the same information-theoretic logic as Fitts: choosing among `n` equally likely options resolves `log2(n)` bits of uncertainty, and Hyman's 1953 extension showed the real driver is the **entropy** of the choice, not merely the count.

```
RT = a_h + b_h · log2(n + 1)
```

**Verified: reaction time as a flat menu grows.**

```
   4 items  ->  RT =  548 ms
   8 items  ->  RT =  675 ms
  16 items  ->  RT =  813 ms
  32 items  ->  RT =  957 ms
  64 items  ->  RT = 1103 ms
 128 items  ->  RT = 1252 ms
```

*(Illustrative constants `a_h=0.2s, b_h=0.15s`, matching §1.1's convention of showing the shape rather than claiming universal numbers.)* The **logarithmic** growth is the headline result: going from 4 to 128 options — a **32× increase in choices** — only doubles decision time, because each doubling of `n` costs a constant *additional* bit, not a constant additional fraction of the total.

## 1.4 The Surprising Result: Naive Chunking Doesn't Help

Conventional UX advice says: break a large flat menu into grouped categories, because it's "faster" per Hick's Law. This is worth actually computing rather than repeating, because the computation gives a different answer than the folklore.

Model it directly: a 64-item menu, either as one flat choice, or as two sequential Hick's-Law choices — first among 8 categories, then among 8 items within the chosen one:

```
flat 64-item menu:          1103 ms
8 categories x 8 items:      675 + 675 = 1351 ms

chunking is SLOWER by 248 ms, despite requiring the same total information (log2(64)=6 bits either way)
```

*(Verified.)* Sweeping the number of hierarchy levels for the same 64 items confirms it: under this model, decision time **strictly increases** with depth, and the minimum is a single flat 64-way choice.

This is not the expected outcome walking in, and getting it is more useful than confirming the expected one — it means the common "chunk your menus, Hick's Law says so" advice is citing the *wrong mechanism*, and understanding why is the actual lesson.

**Why the naive model is incomplete.** Hick's Law describes laboratory choice-reaction time: all `n` alternatives presented **simultaneously**, already known, with an instant, forced, single decision. Splitting into two sequential Hick's-Law decisions doesn't reduce total entropy (`log2(8) + log2(8) = log2(64)`, exactly) — it just pays the model's **fixed per-decision overhead** (`a_h`) twice instead of once. So under a model where the *only* cost is decision entropy, chunking can only make things worse, and the arithmetic above shows precisely that.

**What the model is missing — and where real menus actually benefit from grouping:**

- **Visual search isn't Hick's Law.** Hick's Law assumes you already perceive all `n` alternatives and are only choosing among known options. Scanning an unsorted flat list of 64 items to *find* the one you want is a **visual search** problem, and unsorted search scales roughly *linearly* with item count — far worse than `log2(n)`. Grouping by category doesn't shrink the decision's entropy; it shrinks the *visible set you must search at each moment*, which is a different cost the Hick's Law model doesn't represent at all.
- **Working memory is a separate constraint.** George Miller's 1956 paper proposed short-term memory holds roughly **seven items, plus or minus two**. Worth stating precisely, since it's widely over-cited as a hard rule: Miller himself intended the figure as more of a rhetorical framing than a strict capacity limit, and Cowan's 2001 review revised the practical figure down to roughly **four** chunks under controlled conditions. Either way, the point survives — a flat 64-item list exceeds any plausible short-term memory span by an order of magnitude, forcing repeated re-scanning that no Hick's Law calculation accounts for.

**The corrected conclusion:** chunking is real UX advice with a real justification — it just isn't the one usually cited. It reduces visual search cost and working-memory load, not choice-reaction entropy. Citing Hick's Law to justify menu grouping is citing the wrong law for the right practice — and this chapter's own naive computation is what exposed that, rather than a hand-wave.

## 1.5 Cognitive Load: The Third Cost, Named Properly

§1.4 already introduced the idea informally — decisions cost more when the person is also holding information in mind. **Cognitive load theory** (Sweller, building through the 1980s–90s) names three distinct sources, worth separating because each has a different fix:

- **Intrinsic load** — inherent to the task itself (filling a tax form has real complexity no interface can remove)
- **Extraneous load** — imposed by *bad design*: unclear labels, inconsistent placement, needing to remember a value from one screen to enter on the next
- **Germane load** — effort that builds useful understanding (learning an app's structure so it becomes fast to use later)

**Only extraneous load is what interface design should minimise.** Intrinsic load is the task's floor; germane load is often worth preserving, since removing all of it produces an interface a user can't build a mental model of. The common design mistake is treating all three as one thing to minimise uniformly — stripping out germane load along with extraneous load produces something simple to look at on first use and impossible to get faster at with practice.

## 1.6 Gestalt Principles — What the Eye Groups Before You Decide Anything

Before Fitts's Law governs reaching for something, and before Hick's Law governs choosing among options, the visual system has already **grouped the screen into perceived units** — and it does this automatically, based on rules discovered by early-20th-century Gestalt psychologists, independent of what the designer intended.

The load-bearing ones for interface work:

- **Proximity** — elements placed close together are perceived as related, whether or not that's true in the code
- **Similarity** — elements sharing colour, shape, or size are grouped, even across physical distance
- **Common region** — a shared background or border groups its contents more strongly than proximity alone
- **Closure** — the eye completes implied shapes from partial information

The practical stakes: these aren't stylistic suggestions, they're **predictions about what a user will assume**, made by their visual system before any conscious choice runs. Placing an unrelated "Delete Account" button close to "Save Changes" invokes proximity whether or not you intended a relationship — the user's perceptual system supplies one regardless of the code's actual structure. Getting spacing "wrong" here isn't an aesthetic failure; it's a **false signal**, and false signals about what's related to what are exactly the kind of thing that produces a wrong click with real consequences.

## Section Challenge

<details>
<summary><strong>Q1.</strong> A designer wants a "danger zone" delete button to feel deliberately harder to hit — reducing accidental deletions. Using Fitts's Law and your own numbers, propose a specific change to <code>A</code> and/or <code>W</code> that meaningfully increases required movement time, and verify the effect by computing it.</summary>

The lever is any change that **increases the Index of Difficulty**, `log2(2A/W)` — which means increasing `A` (put it farther away), decreasing `W` (make it smaller), or both.

A concrete proposal: move the delete button from a convenient toolbar position to the bottom of a scrolled settings page, and shrink it from a normal 48px button to a deliberately small 20px one.

```
Normal delete button (toolbar, easy)    A=100px  W=48px  ID=2.06 bits  MT= 450 ms
Deliberately hard delete button         A=900px  W=20px  ID=6.49 bits  MT=1204 ms
```

*(Computed using this chapter's `a=0.1, b=0.17` convention.)* Roughly **2.7× the movement time** — a real, quantifiable friction increase, not just "make it feel further away."

**The important caveat, and it's a real limitation of using Fitts's Law alone here:** this only adds *motor* friction — more distance and precision required. It does nothing about *decision* friction, and accidental deletions are usually decision failures (misidentifying which button is which, or clicking on autopilot) rather than motor-precision failures. A well-designed "danger zone" combines the Fitts's Law lever from this question with a genuinely separate mechanism — a confirmation step, which forces a second, deliberate decision (invoking Hick's Law territory, not Fitts's) — because a small, far-away button clicked on autopilot is still an accident, just a slower one. The two laws address different failure modes, and a real safety design usually needs both.
</details>

<details>
<summary><strong>Q2.</strong> §1.4 showed that under the simple model, chunking a 64-item menu into 8×8 is <em>slower</em> by Hick's Law's own arithmetic. Does this mean flat menus are always better than categorized ones? What would have to be true about a specific menu for chunking to actually help?</summary>

No — and the reasoning in §1.4 already contains the answer, it just needs to be applied rather than restated. Chunking helps precisely when the costs Hick's Law *doesn't* model are the ones actually dominating.

**Chunking helps when:**

- **The item count exceeds working memory span.** §1.5's ~4–7 item range means a genuinely flat 64-item list cannot be held in mind at once regardless of how the Hick's Law arithmetic comes out — the user will scan and re-scan, and that scanning cost isn't in the equation at all.
- **Items aren't presented simultaneously and pre-known.** Hick's Law assumes instant, complete presentation of all alternatives — the lab condition. A real flat menu of 64 items usually requires scrolling, meaning most options aren't even visible when the decision starts. Grouping brings the relevant subset into view without scrolling, which is a visual-search fix, not a decision-entropy fix.
- **Categories map onto the user's own mental model.** If "Settings → Privacy → Blocked Users" matches how a user would naturally describe the goal, the first-level choice is closer to instant recognition than an actual `log2(8)`-bit deliberation — Hick's Law's per-decision cost assumes genuine uncertainty, and a well-labelled category collapses much of that uncertainty before the formula's clock even starts.
- **The categories are used repeatedly.** §1.5's germane load argument: a structure learned once becomes fast on every subsequent use, while a flat 64-item list must be re-scanned in full, every time, forever.

**Flat stays better when:** the item count is small enough to sit within working memory span (§1.4's "8 flat items = 675ms" case, well under Miller's range), when items are used rarely enough that learning a hierarchy's structure never pays for itself, or when the categories don't map cleanly onto how the user actually thinks about the choice — a bad taxonomy adds a real decision cost (which category is this even in?) without buying back any of the visual-search or memory benefit that justified grouping in the first place.

**The general principle this question is really testing:** don't cite Hick's Law (or any model) to justify a design choice unless the model's *actual assumptions* — simultaneous presentation, pre-known alternatives, a single forced choice — match the real situation. §1.4's whole point was that citing the right-sounding law for the wrong reason produces a plausible-sounding justification for what the arithmetic actually contradicts.
</details>

<details>
<summary><strong>Q3.</strong> Fitts's Law, Hick's Law, and Gestalt grouping were each derived independently and describe different things — physical movement, choice reaction time, and perceptual grouping. Construct a single interface scenario where a design decision made to help one of these three actively hurts one of the other two.</summary>

**Scenario:** a settings page redesign groups 12 related toggle switches tightly together under a shared "Advanced" heading with a common background — a deliberate, correct application of §1.6's proximity and common-region principles, making the relationship between the toggles immediately legible.

**The Fitts's Law cost this creates:** to fit 12 toggles into a visually tight, clearly-bounded group, each toggle's hit target shrinks — smaller `W` — and if the grouping also pulls the section further down the page to keep it visually separate from more common settings, `A` grows too. By §1.1's arithmetic, both changes increase `ID` and therefore `MT` for every single toggle in the group. The Gestalt-motivated fix for *legibility* was paid for with a Fitts's-Law cost in *motor efficiency*, for every interaction with that section, forever.

**A second, sharper version, using Hick's Law:** the same tight visual grouping, applied to 12 toggles that are *not* actually related in function (grouped only because they're all "advanced," a weak organizing principle), invokes proximity's implicit promise — the user's perceptual system asserts these are meaningfully connected — while the actual decision the user faces is still effectively a 12-way choice among unrelated options, no easier than before by Hick's Law's own count. The visual grouping *claims* a category structure exists without providing the actual reduction in decision entropy that real chunking (§1.4's honest analysis) requires — a false Gestalt signal riding on top of an unreduced Hick's Law cost.

**The general lesson:** none of these three models is "the" model of usability — each captures one real, measurable cost, and they are not always simultaneously minimisable. A change that's correct by one is not automatically correct, or even neutral, by the others. This is precisely why a real evaluation needs more than picking a favourite law and reasoning from it in isolation — which is exactly what Chapter 3's structured heuristic evaluation exists to provide: a way of checking a design against multiple independent failure modes rather than optimising one model and hoping the rest follow.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Fitts's Law | `MT = a + b·log2(2A/W)` — movement time to a target grows with distance, shrinks with size, and specifically with their *ratio* |
| Verified: size | Same 600px distance, target 16px→120px: predicted time nearly **doubles** (1159ms → 665ms) |
| Verified: distance | Same 40px target, 80px→800px away: predicted time **more than doubles** (440ms → 1005ms) |
| The edge effect | Real and verified (889ms → 369ms) once modelled within the formula's valid domain — the naive "infinite width" version breaks the model and returns nonsense |
| Model domain matters | `W < 2A` is required for a meaningful (non-negative) result — a model doesn't warn you when you leave its domain |
| Hick's Law | `RT = a + b·log2(n+1)` — decision time grows **logarithmically** with option count: 32× more choices only doubles the time |
| Naive chunking, verified | An 8×8 hierarchy for 64 items is **predicted slower** than one flat choice (1351ms vs 1103ms) under pure additive Hick's Law — contradicts common "grouping is faster" folklore |
| Why chunking still helps in practice | Not reduced decision entropy — reduced **visual search** cost (unsorted scanning is far worse than log2) and reduced **working-memory load** |
| Miller's 7±2 (1956) | Often over-cited as a hard rule; Miller intended it more rhetorically, and Cowan (2001) revised the practical figure to ~4 |
| Cognitive load (Sweller) | Intrinsic (task's floor) vs extraneous (bad design — minimise this) vs germane (builds mastery — often worth keeping) |
| Gestalt grouping | Proximity, similarity, common region, closure — automatic, pre-conscious perceptual assumptions. Getting spacing "wrong" sends a false signal about relationships, not just a look wrong |

## Where We Go Next

This chapter measured how fast and accurately a *known* interaction happens — reaching a target, choosing among known options, perceiving groups. None of it addresses a prior question: how do you know which interactions a real user actually needs, in what order, solving what actual problem? Fitts's Law can tell you a button is easy to click; it has nothing to say about whether the button should exist.

Chapter 2 builds the user-centered design process that answers that — research, personas, and journey mapping — so that the speed and clarity this chapter optimises for is being spent on the right interactions in the first place.

*Next: [02_User_Centered_Design_Process.md](02_User_Centered_Design_Process.md)*
