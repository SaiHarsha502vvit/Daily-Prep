# Chapter 4 — Accessibility: The POUR Framework

> Nielsen's heuristics were distilled from 249 general usability problems. None of them were specifically asking "does this work for someone who can't see color, can't use a mouse, or can't hear audio." Accessibility needs its own structured framework because it's checking for a category of exclusion that general usability evaluation was never built to catch.

---

## The Problem

Chapter 3's heuristic evaluation is powerful for the failure modes it was built from — but its 249 source problems weren't systematically sampled from disabled users' experiences. An interface can score well on every one of Nielsen's ten heuristics and still be completely unusable for someone who navigates by keyboard alone, or who can't distinguish the two colors your error state depends on, or who's using a screen reader that reads your custom dropdown as a meaningless string of nested `<div>`s.

This needs a framework built around a different, more specific question: not "is this generally usable," but "does this exclude anyone based on a specific, identifiable barrier?" That's what the **[Web Content Accessibility Guidelines](https://www.w3.org/TR/WCAG21/)** (WCAG), maintained by the W3C, provide.

> **Scope note.** This chapter builds the *conceptual framework* — why it's structured this way, what the conformance levels mean, and where the practice of checking for accessibility genuinely breaks down. The implementation details — semantic HTML, ARIA roles, keyboard navigation patterns, focus management, screen reader testing — are covered in full in [`19_Frontend_Integration/07_Web_Accessibility_A11y.md`](../../../19_Frontend_Integration/07_Web_Accessibility_A11y.md), a 644-line chapter that already exists in this curriculum. This chapter doesn't repeat that content; it gives you the framework for understanding why it's organized the way it is.

## 4.1 Deriving POUR — Four Categories as Four Pipeline Stages

WCAG organizes every one of its success criteria under exactly four principles, introduced with WCAG 2.0 in [2008](https://www.w3.org/TR/WCAG20/): **Perceivable, Operable, Understandable, Robust** — POUR. Rather than memorizing four words, derive them from the actual sequence a person goes through to use any interface at all.

Using an interface, stripped to its logical steps, requires:

1. **Getting the information into your senses at all** — seeing the text, hearing the audio, perceiving the layout
2. **Acting on it** — clicking, typing, navigating, activating controls
3. **Making sense of what happened** — understanding labels, instructions, error messages, and what state the system is now in
4. **Having this keep working** — across different assistive technology, browsers, and time, not just in the one configuration a designer happened to test

Each of POUR's four principles maps exactly onto one of these stages, and — this is the part worth noticing — **each one names a different point where an interface can exclude someone, independent of the other three**:

- **Perceivable** fails when content can't reach the senses at all — an image with no text alternative excludes a screen reader user regardless of how easy the rest of the interface is to operate
- **Operable** fails when a control can't be *acted on* — a click handler with no keyboard equivalent excludes anyone who can't use a mouse, even if they perceived the button perfectly
- **Understandable** fails when the *meaning* doesn't land — a cryptic error message excludes someone with a cognitive disability, or simply anyone under stress, even if they perceived it and could technically interact with it
- **Robust** fails when the *first three work today but stop working tomorrow* — a custom component with no semantic markup might work with today's screen reader through luck, and break with the next one, because nothing about it was actually specified to work

**The structural insight:** these four are close to *independent* failure modes. Fixing a Perceivable violation (adding alt text) does nothing for an Operable violation (a mouse-only interaction) elsewhere on the same page. That's exactly why WCAG doesn't organize its 80+ success criteria into one undifferentiated checklist — a single flat list would obscure that a page can be excellent on three principles and completely fail on the fourth, in a way that four separate categories make visible immediately.

## 4.2 Deriving Why Conformance Is Tiered, Not Binary

WCAG defines three [conformance levels](https://www.w3.org/TR/WCAG21/) — A, AA, AAA — and they're **cumulative**: AA conformance requires satisfying every Level A criterion *plus* every Level AA criterion; AAA requires all of A, AA, and AAA.

Why tiers instead of one fixed bar? Because success criteria vary enormously along two independent dimensions that don't move together: **implementation cost**, and **how many people benefit**. A criterion can be cheap and high-impact (adding `alt` text costs almost nothing and benefits every screen-reader user who encounters that image), cheap and narrow (a specific ARIA attribute fixing one edge case), or genuinely expensive and narrow (sign-language interpretation for every video, a Level AAA criterion).

A single pass/fail bar set at the AAA level would demand the expensive, narrow criteria from every project regardless of resources — and the realistic outcome of an unreachable bar isn't universal compliance, it's universal non-compliance, because organizations that can't reach the top tier have no achievable target at all. A bar set at Level A alone would let organizations skip cheap, high-impact fixes (many are Level AA) that clearly should be table stakes. **Tiering solves this by letting Level A capture "the floor below which real exclusion is happening," Level AA capture "achievable by virtually any organization and where most legal/regulatory requirements actually sit," and Level AAA capture "genuinely excellent, not always feasible for every context."** This is the same reasoning [Chapter 3 §3.3](03_Usability_Heuristics_And_Evaluation.md) used for severity ratings — collapsing genuinely different situations into one number produces worse decisions than a structure that keeps the real variation visible.

**In practice, Level AA is the target virtually every organization should aim for** — it's what most accessibility laws and procurement standards actually reference, and it captures the criteria with the strongest cost-to-impact ratio.

## 4.3 Verifying the Contrast Ratio Formula

Success Criterion 1.4.3 requires a contrast ratio of **4.5:1** for normal text and **3:1** for large text (18pt+, or 14pt+ bold) against Level AA; Level AAA raises these to 7:1 and 4.5:1. These aren't round numbers chosen for memorability — they come from an actual formula, worth computing rather than trusting.

**The formula**, from the [WCAG 2.0 techniques](https://www.w3.org/TR/WCAG20-TECHS/G18.html):

```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
```

where `L1` is the relative luminance of the lighter color, `L2` the darker, and relative luminance is a **weighted, gamma-corrected** sum of the sRGB channels:

```
L = 0.2126·R + 0.7152·G + 0.0722·B
```

*(with each channel first linearized from its sRGB-encoded value — the weights 0.2126/0.7152/0.0722 reflect that the human eye is far more sensitive to green than to red or blue, which is why a "bright" green and a "bright" blue of the same raw pixel value don't look equally bright.)*

**Sanity check first — the known maximum.** Pure black on pure white should give exactly 21:1, the highest ratio physically possible with this formula:

```
black/white contrast = 21.00:1     MATCH
```

*(Verified — confirming the implementation is correct before trusting any other output from it.)*

**Real UI color pairs, computed directly:**

```
Pure black text on white           #000000/#FFFFFF  ratio=21.00:1   AA-normal PASS  AAA PASS
Dark gray text on white            #767676/#FFFFFF  ratio= 4.54:1   AA-normal PASS  AAA FAIL
Medium gray text on white          #999999/#FFFFFF  ratio= 2.85:1   AA-normal FAIL  AAA FAIL
Placeholder gray (very common)     #AAAAAA/#FFFFFF  ratio= 2.32:1   AA-normal FAIL  AAA FAIL
White text on brand blue           #FFFFFF/#2563EB  ratio= 5.17:1   AA-normal PASS  AAA FAIL
White text on light blue (bad)     #FFFFFF/#93C5FD  ratio= 1.80:1   AA-normal FAIL  AAA FAIL
```

*(All verified by direct computation.)* Two results worth sitting with:

`#767676` clears AA by the barest possible margin — 4.54 against a 4.5 requirement. This isn't a coincidence in the industry; it's close to the *specific* gray many design systems standardize on precisely because it's the darkest gray that still reads as "gray" rather than "black" while barely clearing the legal minimum — a genuinely tight, deliberately-chosen boundary case.

**The placeholder gray result is the one worth remembering.** `#AAAAAA` is an extremely common default for placeholder text — many browsers' and OS-level default styles land in this exact range — and it fails AA at 2.32:1, **not narrowly, by less than half the required ratio.** This is a real, widespread, largely invisible failure: placeholder text is functionally illegible to a meaningful fraction of low-vision users on a huge fraction of the web's forms, by default, without anyone having made an active decision to exclude them — a strong illustration of Chapter 3's point that a common, unremarkable-feeling problem can still be a genuine severity-3 or 4 issue once you account for how many people it touches.

## 4.4 When It Breaks: Automated Testing's Real Ceiling

A natural instinct, once a formula like §4.3's exists, is to assume the whole accessibility problem is now mechanically checkable — run a scanner, fix what's red, done. This significantly overstates what's actually possible, and the honest numbers are worth knowing before trusting a green scan result as "accessible."

**The coverage figures, and why they disagree.** [Deque's own study](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/) — sampling over 2,000 real audits and nearly 300,000 documented issues — found their `axe-core` tooling caught **57%** of real accessibility issues on average. Other independent estimates put automated coverage closer to **30–40%**. Worth naming directly: **Deque runs the study on their own tool**, which isn't a reason to dismiss the number, but is a reason to treat the higher end of the range with some skepticism rather than taking a vendor's self-assessment as the ceiling — the same instinct Chapter 2 §2.1 applied to an unsourced statistic, here applied to a sourced-but-self-interested one.

**Why there's a structural ceiling at all, not just a "tools aren't good enough yet" gap.** Some WCAG criteria are mechanically checkable — does an `<img>` have an `alt` attribute at all, does the computed contrast ratio meet 4.5:1, is there a `lang` attribute on the page. A scanner can verify all of these with certainty. But a large fraction of what actually determines whether an interface is usable requires **semantic judgment a tool structurally cannot make**:

- **Is the alt text present, or is it *accurate and useful*?** `alt="image1.jpg"` passes every automated check — an `alt` attribute exists — while conveying zero actual information to the screen reader user it exists for. Whether alt text is *meaningful* is a judgment about meaning, not a syntax check.
- **Is the tab order logical**, given the actual visual layout and task flow — not just "does every element have a `tabindex`"?
- **Does an error message actually explain what went wrong** in a way a real person can act on, versus technically satisfying "an error is announced"?
- **Is a custom-built widget's ARIA role a genuinely accurate description of its behavior**, or is it a label that happens to make the automated check pass while the actual interaction pattern still confuses a real screen reader user?

Every one of these needs a human — usually one navigating with the actual assistive technology, or reading the content the way its intended audience would — to catch. **This isn't a temporary limitation waiting on better tooling; it's the same structural boundary as Chapter 3's finding that Nielsen's heuristics can't anticipate problems outside their known categories.** A scanner checks conformance against *syntax patterns* known to correlate with real problems; it cannot check whether the *actual experience* is good, because "good" here means "makes sense to a human," and that's not a property syntax alone determines.

**The corrected practice, following directly from the honest number:** run automated tools first — they're fast, cheap, and reliably catch the ~30-60% of issues that are mechanically checkable, which is real, valuable, low-cost coverage worth taking. Never treat a clean automated scan as equivalent to "accessible." The remaining 40-70% requires the same kind of structured manual evaluation Chapter 3 built for general usability — ideally including someone who actually uses assistive technology day-to-day, since their fluency with what real friction feels like is exactly the judgment an automated tool cannot substitute for.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §4.1 argued POUR's four principles are close to independent — fixing one does nothing for the others. Construct a case where fixing a Perceivable issue actually creates a new Operable or Understandable problem, showing the independence isn't total.</summary>

Take an image-heavy product gallery where every image is missing alt text — a clear Perceivable failure. The fix, done carelessly under deadline pressure: auto-generate alt text for all 400 images using a generic template, `"Product image {number}"`.

This closes the Perceivable gap in the narrow sense a scanner checks — every `<img>` now has a non-empty `alt` attribute. But it creates a new problem squarely in **Understandable**: a screen reader user navigating the gallery now hears "Product image 1," "Product image 2," "Product image 3"... with zero information distinguishing any of them, for potentially hundreds of images in a row. The *meaning* — which was the entire reason alt text exists — never arrived; only the mechanical presence of the attribute did. Worse, this can be actively worse than no alt text at all in one respect: it passes automated scans (exactly §4.4's point) and gives the *appearance* of having been fixed, potentially causing a team to move on and never revisit it, whereas an obviously-missing alt text is at least visibly incomplete and likely to draw attention again later.

**What this shows about the "independence" claim:** the four principles are independent as *categories of failure*, but a fix implemented purely to satisfy one category's checkable syntax — without engaging with what that category actually exists to accomplish — can absolutely create or worsen a failure in another category. The four-principle structure is a good map of *where* to look for problems; it doesn't protect against a fix that's technically-scoped to one box while ignoring the actual goal the box represents. This is a sharper version of §4.4's core point: syntax-level conformance and genuine accessibility are not the same thing, and the gap between them can widen, not just persist, when a fix optimizes for the checkable proxy instead of the real target.
</details>

<details>
<summary><strong>Q2.</strong> §4.3 showed <code>#AAAAAA</code> placeholder text fails WCAG AA contrast by a wide margin, and noted this is an extremely common default. If it's this common and this easy to detect automatically, why does it remain widespread across the web rather than having been fixed everywhere by now?</summary>

Three separate, compounding reasons, each worth distinguishing because they call for different fixes.

**It's often inherited, not authored.** Many instances of `#AAAAAA`-range placeholder text come from browser or OS default form-control styling, never explicitly set by the page's own CSS at all. A team can audit every color *they* wrote and still ship a failure they never directly chose, because the failing color lives in a user-agent stylesheet they never looked at — invisible to a code review that only checks the project's own files.

**Placeholder text is widely treated as decorative, not content.** Placeholder text disappears the moment a user starts typing, which creates a strong (and wrong) intuition that it's a hint rather than functional content someone needs to actually *read* to know what to enter. That intuition means it frequently escapes the same scrutiny a label or button gets, even from teams that are otherwise contrast-conscious — it's excluded from the mental category "text I need to check," not from the actual technical checking process.

**Automated tools genuinely do catch this one — and it still doesn't get fixed, which is the more interesting part.** Unlike §4.4's semantic-judgment gap, contrast ratio is exactly the kind of criterion a scanner checks with certainty. So the persistence of this specific failure **isn't** primarily a detection problem — it's a *prioritization* problem. A contrast failure on placeholder text usually doesn't block core functionality (the field is still usable, just harder to read before typing), so it often lands as a low-severity finding in Chapter 3's terms, competing against feature work for the same limited engineering time, and frequently loses that competition indefinitely.

**The generalizable lesson:** "detectable" and "detected-and-then-actually-fixed" are different claims, and the gap between them is often organizational rather than technical — which is precisely why §4.4 argued the honest response to a scan result has to include what happens *after* detection, not just whether detection is possible.
</details>

<details>
<summary><strong>Q3.</strong> §4.2 said Level AA is the practical target for most organizations because it has the strongest cost-to-impact ratio. Under what circumstances would deliberately targeting Level AAA for a *specific* feature — not the whole site — actually be the right call, despite AAA generally being framed as "not always feasible"?</summary>

The framing in §4.2 — AAA as "genuinely excellent, not always feasible for every context" — is doing real work in that phrase "for every context." The right reading isn't "AAA is rarely worth it," it's "AAA's cost-to-impact ratio is unfavorable *averaged across an entire site*, which says nothing about specific features where the ratio flips."

**AAA becomes the right call for a specific feature when that feature disproportionately serves the population a given AAA criterion protects.** Two concrete cases:

- **A dedicated accessibility settings page or onboarding flow**, precisely because the population reaching that specific page skews heavily toward people who need exactly what AAA criteria provide. Targeting the general AA bar there under-serves the exact audience most likely to be using that page in the first place.
- **A core reading-heavy feature — an article view, a document reader** — where AAA's 7:1 contrast requirement (versus AA's 4.5:1) directly serves low-vision readers doing sustained reading, and the feature's entire value proposition depends on comfortable extended reading. The cost of the stricter contrast requirement here is close to zero (it's a color choice, not new engineering), while the benefit is concentrated exactly where the feature's core use case lives.

**The general principle, extending §4.2's own reasoning rather than contradicting it:** conformance level should be assessed per-feature against that feature's specific audience and cost structure, not applied as one uniform site-wide policy. A site-wide AA target with selectively-elevated AAA on the specific features where it's cheap and the audience match is strong is a *better* application of §4.2's cost/impact logic than either "AA everywhere" or "AAA everywhere" — it's the same tiered reasoning that justified conformance levels existing at all, applied one level down, to individual features rather than to a whole product.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Why POUR, not general usability | Nielsen's heuristics weren't built from disabled users' experiences specifically — accessibility needs a framework targeting a different, more specific category of exclusion |
| POUR, derived | Perceivable → Operable → Understandable → Robust maps directly onto the actual sequence of using any interface: sense it, act on it, make sense of it, have it keep working |
| Near-independence | Each principle names a failure mode the other three don't cover — a page can excel on three and completely fail the fourth |
| Why tiered conformance | A/AA/AAA (cumulative) exist because cost and impact vary independently per criterion — a single bar is either unreachable or too lenient |
| Level AA | The practical target for virtually every organization — best cost-to-impact ratio, what most legal/procurement standards reference |
| Contrast formula, verified | `(L1+0.05)/(L2+0.05)`, gamma-corrected relative luminance — black/white sanity-checked to exactly 21.00:1 |
| Verified real gotcha | `#AAAAAA` placeholder gray, extremely common by default, fails AA at 2.32:1 — not narrowly, by more than half |
| Automated tools' real ceiling | 30-57% coverage depending on source (Deque's own 57% figure warrants skepticism as a self-reported number). Ceiling is structural: syntax is checkable, meaning isn't |
| What tools can't catch | Whether alt text is *accurate*, whether tab order is *logical* for the actual task, whether an error message *actually helps* — all require human judgment |
| The corrected practice | Run automated tools for the cheap, reliable ~30-60%; never treat a clean scan as "accessible" — the majority of real accessibility work is the manual half |

## Where We Go Next

This chapter gave you the conceptual framework and confirmed the actual math behind the numbers WCAG runs on — but Q1 and Q2 both showed that satisfying the framework's checkable surface (an `alt` attribute exists, a contrast ratio passes) is not the same as solving what it exists to solve, and that gap only becomes visible when you actually build and test something a real person interacts with.

Chapter 5 moves from evaluating existing designs to creating new ones — prototyping methods, from paper sketches through high-fidelity interactive prototypes, and specifically how to test an idea cheaply *before* committing the implementation effort this chapter's own gaps only reveal after the fact.

*Next: [05_Prototyping_Methods.md](05_Prototyping_Methods.md)*
