# Chapter 5 — Prototyping Methods

> A prototype's job is to be wrong cheaply. The moment it costs something to change, it has stopped doing that job — whatever it looks like.

---

## The Problem

Chapter 2 identified *what* to build — research, personas, journey maps, user stories grounded in real evidence. Chapters 3 and 4 evaluate *existing* designs against structured frameworks. Between those two sits a real gap: how do you test whether an *idea* actually works, before paying the full cost of building it?

This is exactly Chapter 2 §2.1's corrected cost-of-change argument, applied concretely. Building the real thing — with real data, real edge cases, real integration work — is expensive to redo if the underlying idea turns out wrong. A **prototype** exists specifically to let that discovery happen while it's still cheap: something built quickly enough, and disposably enough, that being wrong about it costs almost nothing.

## 5.1 Fidelity Is Not One Dial — Deriving the Actual Dimensions

The intuitive model treats prototyping as a single ladder: paper at the bottom, fully-coded interactive at the top, "higher fidelity" always meaning "more finished." This framing causes real mistakes, because fidelity isn't one dimension — it's at least three, and they move **independently**:

- **Visual fidelity** — does it look like the finished product (real typography, real spacing, real color) or a rough sketch?
- **Interaction fidelity** — does clicking/tapping/typing actually respond, with real transitions and timing, or is it static?
- **Content fidelity** — is the actual, researched copy and real data present, or placeholder ("Lorem ipsum," generic labels)?

These can be set independently, and doing so deliberately is a real design choice, not an accident. A **paper sketch with real, carefully-written microcopy** is high content fidelity and zero interaction fidelity simultaneously — useful for testing whether an error message actually makes sense to a real reader, useless for testing whether a gesture feels responsive. A **fully clickable Figma prototype with lorem-ipsum text** is high interaction fidelity and low content fidelity — the reverse trade, useful for testing navigation flow, useless for testing whether specific wording lands.

**The derivable principle:** don't ask "how high-fidelity should this prototype be?" — ask "which of these three dimensions does the actual question I'm testing depend on?", and dial only that one up. Turning up a dimension the question doesn't need doesn't make the test better; it just costs more time to build something extra whose realism was never actually being evaluated.

## 5.2 Matching Fidelity to the Actual Question

Rudd, Stern, and Isensee's influential [1996 analysis](https://dl.acm.org/doi/10.1145/223500.223514) of the low-vs-high fidelity debate found each end of the spectrum genuinely strong at a different kind of question — not that one is simply better than the other.

**Low fidelity is strong for broad, structural, early-stage questions**: is this concept even the right direction? Does the information architecture make sense — can people find things where they'd expect them? Are we solving the right problem at all? It's cheap enough to build several competing directions in an afternoon and throw away the losing ones without a second thought — and *because* it visibly looks unfinished, feedback tends to stay at the structural level, which is exactly the level low-fidelity prototypes are cheap enough to act on.

**High fidelity is strong for precise, late-stage questions**: does this specific micro-interaction feel responsive? Is this exact visual hierarchy clear? What's the actual measured task-completion time for this real flow? These questions are meaningless to ask of a paper sketch — "does this hover state feel right" has no answer when nothing can be hovered — because the question depends on exactly the realism low fidelity deliberately omits.

**The mismatch that actually causes damage:** testing a structural question with a high-fidelity prototype, or a precision question with a low-fidelity one. Both waste real effort — the first burns significant build time before learning the direction is wrong at all; the second asks a sketch a question it structurally cannot answer, and gets an unreliable answer back that looks like data.

## 5.3 The Fidelity Trap — Why Polish Actively Suppresses Feedback

Beyond simply being unable to answer precision questions, low fidelity has a second, less obvious advantage that Rudd, Stern, and Isensee's analysis and much subsequent work both point to: **it tends to produce more honest, more structural criticism than a polished prototype does**, for reasons that have nothing to do with what either prototype technically can or can't do.

**The mechanism.** A rough sketch visibly signals "this isn't finished, and it's expected to change" — so a reviewer, whether an internal stakeholder or a real user in a test session, naturally offers structural criticism: "I don't think this flow makes sense," "why would I need this step at all?" A polished, high-fidelity prototype visually signals the opposite — "this is basically done" — and that signal is read *before* any conscious evaluation happens. Reviewers unconsciously shift from "is the underlying idea right?" to "is this specific execution right?", offering surface feedback (color choices, wording, minor layout) while leaving the deeper structural assumptions — the ones actually most expensive to discover wrong later — unexamined, because the polish has already implied those questions are settled.

**This connects directly to [CSE801 Ch01](../CSE801_Capstone_Project/01_Scoping_A_Capstone.md)'s reversibility framing.** A low-fidelity prototype is maximally reversible — throwing away a paper sketch costs nothing, so there's no psychological resistance to hearing "start over." A polished, interactive high-fidelity prototype has accumulated real hours of work, and that sunk cost pushes *both* the team and reviewers toward treating the direction as settled, exactly when the underlying idea is still just as easy — or hard — to change as it was on paper. The visual polish doesn't make the idea more correct; it makes everyone, including the people building it, less willing to hear that it isn't.

**The practical response, following directly from the mechanism:** build low fidelity first and *deliberately* solicit structural criticism while the reversibility is still real and the polish hasn't yet suppressed it — "what's wrong with this direction, fundamentally?" rather than "does this look right?" Reserve high fidelity for after the structural questions are actually settled, when what's left to validate genuinely is the precision-level detail high fidelity is suited to.

## 5.4 Wizard of Oz — Testing the Idea Before Building the Automation

Some capabilities are prohibitively expensive to prototype honestly with either end of the fidelity spectrum — anything involving real automation, especially anything resembling AI. Building even a rough version of "the system understands natural language and responds intelligently" can take months, and if users turn out not to want that capability at all, those months were spent learning something a much cheaper test could have shown first.

**Wizard of Oz prototyping** solves this by having a **human secretly operate the "automated" parts from behind the scenes**, while the test participant believes they're interacting with a working system. The name was coined by Jeff Kelley in his [1983 dissertation](https://en.wikipedia.org/wiki/Wizard_of_Oz_experiment) on natural-language interfaces — though worth noting precisely, since the naming and the first use aren't the same event: **Don Norman and Allan Munro had already used the underlying technique in 1973**, a decade earlier, testing an airport automated travel assistant, before Kelley's dissertation gave the method its now-standard name.

**The derivation of why this is a genuinely different test than a static or low-fidelity mockup:** it separates two risks that a fixed prototype conflates. Any static prototype only tests "would a user want this *if it existed exactly as shown*" — it says nothing about whether the underlying capability is even *buildable*, because nothing behind it is real. Wizard of Oz instead tests "does a user actually want and successfully use this capability" using a *fully functional-feeling* system, without committing to whether or how the real automation will eventually work. **It isolates the desirability question from the feasibility question** — exactly the kind of decomposition that prevents discovering, after months of engineering effort, that users didn't want the automated capability at all, or discovering the reverse (a validated, wanted capability that then turns out to be technically infeasible, which is at least now a known, bounded engineering problem rather than an open-ended design guess).

## 5.5 When It Breaks: Validating Something You Can't Actually Build

Wizard of Oz's core strength — a human can convincingly simulate *any* capability, however sophisticated — is also its central risk, and it cuts in the opposite direction from the failure §5.4 was built to prevent.

A skilled human "wizard" can respond with a level of nuance, context-sensitivity, and genuine understanding that current technology may not be able to replicate — especially for language understanding, ambiguous requests, or judgment calls. If the test succeeds, and users respond enthusiastically, that positive result is only actionable **if the real, automated version can deliver a comparably good experience**. Validate desirability for a capability that turns out to require capabilities beyond what's actually buildable, and the enthusiastic result is genuine — and worthless, because it was never testing something reachable in the first place.

**The general principle, and it's the same failure mode as §5.2's mismatch, appearing at a different point in the process:** a prototype — of any fidelity, using any technique — only produces a *useful* answer when its realism is matched to what can actually be shipped, not just to what can be convincingly demonstrated in a test session. §5.2 was about matching fidelity to the *question being asked*; this is about matching fidelity to the *constraint of what's actually buildable* — a distinct check, and one that's easy to skip specifically because a successful Wizard-of-Oz session feels like validation, when it has validated desire for an experience rather than feasibility of delivering it.

**The corrected practice:** before running a Wizard of Oz test, have a rough, honest sense of what the real automated system will actually be capable of — not full technical certainty, but at least a bound on the plausible range. Design the wizard's responses to stay within that bound rather than performing at the wizard's own full human capability, even though the human operator technically *could* do better. A test that validates something you have good reason to believe is buildable is worth running; a test that validates something only a human could do is measuring the wrong thing, however positive the result looks.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §5.1 said the three fidelity dimensions — visual, interaction, content — can be set independently. Using [Chapter 3](03_Usability_Heuristics_And_Evaluation.md)'s heuristic of "recognition rather than recall," construct a case where testing with LOW content fidelity (placeholder text) specifically produces a misleading result about that exact heuristic.</summary>

Take a navigation menu being tested with placeholder labels — "Menu Item 1," "Menu Item 2," "Category A" — rather than the real category names it will eventually ship with, while interaction and visual fidelity are both high (a fully clickable, polished prototype).

Testing "recognition over recall" here is specifically about whether users can **recognize** the right destination from its visible label without having to recall or guess. Placeholder labels make this impossible to test honestly in either direction. A user might click the wrong placeholder item purely because "Menu Item 3" gives zero semantic information to recognize *against* — a failure that looks like a navigation-structure problem but is actually just an artifact of the test having no real content to recognize. Equally, a user might succeed by pure luck of trying items in order, producing a false-positive "this navigation works fine" result that says nothing about whether the *real* labels will be recognizable once they're in place.

**Why this specific combination is dangerous rather than just "not useful":** high interaction and visual fidelity make the prototype *feel* complete and trustworthy — exactly §5.3's fidelity-trap mechanism — so a team is likely to treat navigation-flow results from this test as meaningful, precisely because everything else about the prototype looks finished. The one dimension actually needed to answer the recognition-over-recall question (content fidelity) is the one silently missing, and nothing about the polished exterior signals that gap to whoever is reading the results.

**The fix, following directly from §5.1's framing:** identify which heuristic or question is actually being tested *before* deciding which fidelity dimensions to invest in, rather than defaulting to "make it look real" as a blanket policy. Testing recognition specifically requires real content fidelity — the actual candidate labels — even if interaction fidelity stays low (a static, non-clickable mockup with real labels can validate recognizability just as well as a fully interactive one, for this specific question).
</details>

<details>
<summary><strong>Q2.</strong> §5.3 argued high fidelity suppresses structural criticism because it signals "this is basically done." Is there a situation where you'd deliberately want high fidelity specifically <em>because</em> that signal is useful, despite the general recommendation to start low?</summary>

Yes — when the actual goal isn't structural feedback on the interaction design at all, but a **decision from a stakeholder who needs to see something concrete enough to commit resources to.**

Consider pitching a new product direction to secure budget or executive buy-in. A rough paper sketch, appropriately, invites exactly the structural skepticism §5.3 describes as valuable during design — but that skepticism is actively counterproductive in a funding conversation where the underlying direction has already been validated through earlier low-fidelity testing (§5.2's proper use of it), and what's now needed is confidence that the team can execute, not another round of "is this the right idea at all." The "this is basically done" signal that suppresses useful critique during design is the *same* signal that builds justified confidence during a funding pitch — it's the identical mechanism, evaluated against a different goal.

**The general principle this exposes:** §5.3's caution isn't "high fidelity is bad" — it's "high fidelity suppresses exactly the kind of feedback you should still be seeking, if you're still seeking it." Once the structural questions are genuinely settled — validated through the appropriate earlier low-fidelity testing — high fidelity's confidence-inducing property stops being a bug and becomes the actual thing you want, whether the audience is a stakeholder deciding on funding, a user in a final validation test, or an engineer who needs concrete enough specs to start building.

**The trap version of this**, worth naming since it's the realistic failure mode: reaching for high fidelity *early*, specifically because its confident, finished look feels reassuring to build or to show — using the technique's most dangerous property as if it were a benefit, precisely at the stage where suppressing structural doubt is the last thing that should happen. The tool is the same in both cases; whether it's being used well depends entirely on whether the structural question has actually already been answered elsewhere.
</details>

<details>
<summary><strong>Q3.</strong> §5.4 said Wizard of Oz separates desirability from feasibility. §5.5 showed this separation can backfire if the wizard can do things the real system can't. Propose a concrete process change to a Wizard of Oz test protocol that would catch this failure mode <em>during</em> the test, rather than discovering it later when engineering tries to build the real thing.</summary>

**The core problem:** the wizard, sitting in another room typing responses in real time, has no built-in mechanism forcing them to stay within the bounds of what's actually buildable — nothing in the standard protocol prevents them from quietly using superhuman judgment to make every interaction go smoothly.

**A concrete fix: give the wizard an explicit, written constraint sheet before the session — a rough capability boundary sketched from an actual conversation with engineering — and require the wizard to genuinely fail or degrade in character whenever a request would exceed it,** rather than always producing a good response. Concretely: if the real system is expected to handle single, clear requests but not multi-step chained ones, the wizard should respond to a chained request the way the real system plausibly would — a clarifying question, a partial answer, an honest "I can only do one thing at a time" — not by quietly resolving all three steps because a human easily can.

**Why this genuinely catches the failure during the test rather than after:** it converts an invisible, silent risk into visible data. If study participants respond enthusiastically specifically to the wizard's *unconstrained* answers, and visibly lose interest or hit friction at the *constrained* ones, that difference is now a measured, comparable finding, available at the moment it can still cheaply redirect the design — not a gap discovered by engineering three months in, after the desirability result has already been treated as settled and resourcing decisions made on top of it.

**The generalizable version of the fix:** any technique whose findings depend on staying within an implicit, unstated constraint should make that constraint explicit and enforced within the test itself, rather than trusting it to hold by good intention. §5.5 diagnosed the failure as "validating something you can't build" — this turns that diagnosis into a concrete protocol change: build the buildability constraint into the test's own instrumentation, so violating it produces visible, comparable data rather than a silent gap nobody notices until it's expensive.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Why prototype at all | A prototype's job is to be wrong cheaply — the same cost-of-change logic from Ch02 §2.1, applied before full implementation rather than before any building at all |
| Fidelity, three dimensions | Visual, interaction, content — independently adjustable, not one ladder from "rough" to "finished" |
| Match dimension to question | Turning up a dimension the actual question doesn't depend on wastes build time without improving the test |
| Low vs high fidelity, Rudd/Stern/Isensee 1996 | Low fidelity strong for broad structural questions; high fidelity strong for precise, late-stage ones — different tools for different questions, not a quality hierarchy |
| The fidelity trap | Polish signals "basically done," which unconsciously shifts feedback from structural to surface-level — the most expensive-to-discover-late problems are exactly the ones this suppresses |
| Reversibility connection | A rough sketch is maximally reversible (costs nothing to discard); a polished prototype has accumulated sunk cost that resists exactly the criticism it most needs — the same logic as CSE801's one-way/two-way door framing |
| Wizard of Oz | Kelley named it in 1983; Norman & Munro used the underlying technique in 1973, a decade earlier. Separates "is this capability wanted" from "can we actually build it" |
| When it breaks | A skilled human wizard can simulate capability beyond what's actually buildable — validating desire for an experience that may never be deliverable |
| The fix | Constrain the wizard explicitly to plausible real-system behavior, including deliberate failure/degradation, so a buildability gap shows up as visible test data instead of a silent surprise discovered by engineering later |

## Where We Go Next

Prototyping methods let you test an idea cheaply before committing to full implementation — but everything in this chapter has been about generating a *design's* worth of confidence: does the direction seem right, does the interaction feel responsive, would people want this capability. None of it is a substitute for watching a specific real person attempt a specific real task on the actual thing and measuring, concretely, whether they succeed.

Chapter 6 closes the course with usability testing methodology proper — test plans, the think-aloud protocol, the System Usability Scale, and how to turn observed sessions into severity-rated, prioritizable findings using the same rating structure Chapter 3 built for heuristic evaluation. It's also this course's capstone: conducting a full usability study and accessibility audit on a real, existing application.

*Next: [06_Usability_Testing_And_Measurement.md](06_Usability_Testing_And_Measurement.md)*
