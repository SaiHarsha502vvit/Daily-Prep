# Portfolio Plan

What public artefacts you ship, in what order, and what each one signals.

## Why a portfolio matters more for SDETs

Most SDETs don't ship public work. So the ones who do **stand out instantly**. Three solid public repos is worth more than a year of unverified work-experience claims on a CV.

## The four-tier plan

```
┌────────────────────────────────────────────────────────────┐
│ Tier 1 — Framework                                         │
│   Public version of `framework/` from this module          │
│   Signal: you know enterprise patterns                     │
├────────────────────────────────────────────────────────────┤
│ Tier 2 — Capstone tool (pick ONE first)                    │
│   Flaky-Test Detector OR Custom Reporter OR Analytics Dash │
│   Signal: you build, you don't just configure              │
├────────────────────────────────────────────────────────────┤
│ Tier 3 — Open-source contribution                          │
│   A merged PR against Playwright OR a community tool       │
│   Signal: you can work in someone else's codebase          │
├────────────────────────────────────────────────────────────┤
│ Tier 4 — Writing                                           │
│   3 blog posts (Dev.to / Medium / your own site)           │
│   Signal: you can teach and communicate                    │
└────────────────────────────────────────────────────────────┘
```

## Tier 1 — Framework repo

**Goal**: a public version of [`framework/`](../framework/) you keep clean and presentable.

Required content:

- Working `npm install && npm test` on a clean clone
- README with: what, why, quick start, the seven laws, architecture diagram, screenshot of test output
- Example tests against a public site (OrangeHRM is fine)
- MIT licence
- Reasonable commit history (don't squash everything into "initial commit")

Avoid: forking the repo from work, including any actual company URLs/credentials, leaving TODOs in the README.

**Target ship date**: 2–4 weeks after completing CH02.

## Tier 2 — Capstone (pick one first)

The three options in [`../challenges/`](../challenges/):

| Capstone                 | Best for if you're targeting | Difficulty |
| ------------------------ | ---------------------------- | ---------- |
| Flaky-Test Detector      | Pure SDET roles              | Medium     |
| Custom HTML Reporter     | SDET → FE-adjacent           | Medium     |
| Test Analytics Dashboard | SDET → Platform/SRE/SDE      | High       |

Pick ONE. Ship it. Then the others, if you have time.

Each must include:

- Working demo (deployed if it has a web part)
- README with architecture diagram
- Decision log: a `DECISIONS.md` explaining 3–5 design choices
- Issues open for future work

**Target ship date**: capstone #1 within 8 weeks.

## Tier 3 — Open-source contribution

Three paths, easiest → hardest:

1. **Docs/typo PR to Playwright itself.** Minutes. Real value: your GitHub profile now shows an Anthropic-quality contribution.
2. **Bug fix in a Playwright community tool.** Pick from [awesome-playwright](https://github.com/mxschmitt/awesome-playwright). Look for `good-first-issue` labels.
3. **Feature/PR to Playwright core.** Hard. Months. Massive resume signal if it lands.

**Target ship date**: at least one merged PR within 12 weeks of starting this module.

## Tier 4 — Writing

Three posts is the minimum:

1. **Tutorial post** — "Set up enterprise Playwright with the seven laws" (mining this module is fine, in your voice).
2. **Story post** — "How I cut our suite from 90 min to 22 min" (build this story before you have it; ship after).
3. **Opinion post** — "Why your team probably doesn't need Cucumber" or "Mutation testing changed how I review tests."

Each: ~1,200–2,000 words, code examples, your conclusions, links to your repos.

**Target ship date**: 1 post / month for 3 months.

## What recruiters actually click

The order they look at, from observation:

1. **Pinned repos on your GitHub profile.** Pin all three tiers above.
2. **Most recent commit date.** Make sure something pinned has a commit in the last 30 days.
3. **README first paragraph.** Three sentences explaining what + why + tech.
4. **Issues + PRs activity.** Some open issues is fine; ghost-town is bad.
5. **Profile README.** A one-page intro. Photo, current focus, links.

Optimise for that order.

## A 6-month milestone table

| Month | Ship                                               |
| ----- | -------------------------------------------------- |
| 1     | Tier 1 framework public + first blog post          |
| 2     | CH01–CH04 completed; framework hardening           |
| 3     | Capstone #1 public, in working state               |
| 4     | Open-source PR merged (any size) + blog post 2     |
| 5     | Capstone #2 (or harden #1) + interview prep starts |
| 6     | Blog post 3 + start applying to senior SDET roles  |

Adjust dates for your actual pace. Don't ship something half-done — recruiters DO click around.
