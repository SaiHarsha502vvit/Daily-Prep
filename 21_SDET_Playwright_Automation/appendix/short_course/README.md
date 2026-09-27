# Learn — Curriculum Path

> The narrative layer. If `reference/` is the dictionary and `deep_dives/` is the specialist library, this is the textbook. Read in order. Each chapter is the JOURNEY through a topic — the why, the mental model, the trade-offs, the things you learn after doing it for a while. The HOW lives in `reference/` — these chapters cross-link rather than duplicate.

## The path

| #   | Chapter                                                                               | What you'll come away knowing                                                      | Time   |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| 01  | [Mindset](./01_mindset.md)                                                            | What an SDET is, how testing differs from developer testing, the pyramid           | 30 min |
| 02  | [TypeScript for tests](./02_typescript_for_tests.md)                                  | Type design that makes tests safer; generics where they belong                     | 2 hr   |
| 03  | [POM thinking](./03_pom.md)                                                           | When the POM pattern earns its complexity; the Mega POM                            | 90 min |
| 04  | [Architecture walkthrough](./04_architecture_walkthrough.md)                          | The 15-step E2E skeleton; cross-step data flow                                     | 60 min |
| 05  | [Browser internals](./05_browser_internals.md)                                        | DOM tree, accessibility tree, render pipeline; what this means for wait strategies | 60 min |
| 06  | [Enterprise structure](./06_enterprise_structure.md)                                  | Why the framework folder shape; the 5-layer API library                            | 90 min |
| 07  | [Interview prep (canonical Ch32)](../../08_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md) | LADDER framework; STAR answers; system design for testing                          | 2 hr   |

## How to use this layer

- **First read** — Cover-to-cover, in order. ~9 hours over 1–2 weeks.
- **Senior re-reads** — 03, 06, 07 as references when designing new frameworks or preparing for interviews.
- **Companion reading** — Each chapter cross-links to specific reference docs. Read the cited reference WHILE reading the chapter, not before/after.

## What's NOT here

This layer doesn't teach:

- Specific Playwright APIs — see `reference/`.
- Domain-specific patterns (D365, BDD, contract tests) — see `deep_dives/`.
- How to install Node — see `reference/01_quickstart.md`.

This layer is about the engineering principles that survive tool changes.

## Prerequisites

- Working knowledge of JavaScript/TypeScript.
- A Playwright environment set up (`reference/01_quickstart.md`).
- The runnable framework cloned and tests passing locally.
