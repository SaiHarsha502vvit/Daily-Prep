# Résumé Bullets — Project → CV Line

Turn what you build here into résumé lines that pass a 6-second skim and a 30-minute interview probe.

## Template for any line

> [Verb] [thing built] [scale / tech] [outcome with number]

Bad: _"Wrote Playwright tests for the app"_
Good: _"Built parallel-safe Playwright/TS framework for 4-app enterprise suite; cut PR feedback from 38 min to 9 min."_

The number is what makes interviewers ask follow-ups. Volunteer numbers.

---

## Bullets per project — fill these in as you ship

### Project: this module's `framework/` (Tier 1 portfolio repo)

- [ ] Designed and shipped a TypeScript Playwright framework demonstrating enterprise patterns (POM with dual locator strategy, file-locked account pool for parallel safety, typed APIUtils HTTP wrapper, config validation at boot).
- [ ] Open-sourced framework under MIT; X stars / Y forks in Z weeks.

### Project: CH02 OrangeHRM POM

- [ ] Authored a hardened POM suite for a public demo app with N tests across happy + negative paths, zero hardcoded data, zero flakes across 100 parallel runs.

### Project: CH07 cross-site enterprise flow

- [ ] Built a representative production E2E flow touching admin UI + customer UI + new tab + notifications API + cleanup — all seven framework laws applied, fully traceable.

### Capstone C1: Flaky-Test Detector

- [ ] Designed and shipped a CLI tool that ingests Playwright JSON reports across N runs and produces a ranked flake list using a pass-rate-based score; identifies tests for quarantine within a configurable threshold.
- [ ] Adopted by [your team / open source community / N companies] to triage flake debt.

### Capstone C2: Custom Reporter

- [ ] Implemented a Playwright reporter (`Reporter` API) that ships self-contained HTML output with per-owner aggregation, JIRA linking, and pass-rate trends — drop-in replacement consumed by N suites.

### Capstone C3: Test Analytics Dashboard

- [ ] Designed and deployed a full-stack analytics pipeline (Playwright → Node ingester → Postgres → React dashboard) under Docker Compose; visualises pass rate trends, slowest tests, and per-owner ownership across teams.
- [ ] Integrated as a GitHub Actions reusable workflow used by N pipelines.

### Open-source contribution

- [ ] Merged a [feature / bug fix / docs] PR to [project] addressing [problem]; reviewed and discussed with maintainers across [N] iterations.

### Work bullets — fill in from your actual job

- [ ] Reduced flaky test rate from X% to Y% over Z sprints by introducing [specific change — locator strategy / wait pattern / fixture redesign].
- [ ] Cut PR test runtime from X min to Y min via sharding and affected-test selection; preserved coverage by always running smoke + affected.
- [ ] Owned the rollout of [Allure / ReportPortal / Custom Reporter] to N teams; standardised JIRA linking and owner tagging.
- [ ] Designed and implemented a parallel-safe account pool fixture using `proper-lockfile`, eliminating account collision incidents in CI from N/week to 0.
- [ ] Built and maintained synthetic monitors for [N critical flows] using Playwright on a Y-minute cadence; surfaced [N] production incidents before customer reports.
- [ ] Introduced mutation testing (Stryker) on the [auth / payments] module; uncovered [N] surviving mutants and added [M] missing assertions.

## "What did you learn here" answers

Each project also needs a 1-line story for the spoken interview:

| Project             | Spoken summary (15s)                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework           | "I shipped an enterprise Playwright framework with seven explicit laws — no locators in specs, file-locked accounts, typed APIs. It's the scaffolding I'd want on any new team." |
| Flaky-Test Detector | "Most teams react to flakes with retries. I built a tool that turns flake into a number you can fix — pass-rate-based score, quarantine ranking, CI gate."                       |
| Analytics Dashboard | "I treated test data as production data — Postgres schema, idempotent ingestion, an actual dashboard. It made me think like a platform engineer."                                |
| OSS PR              | "I picked the issue, read the contribution guide, iterated with maintainers across N rounds. It taught me what code review looks like at scale."                                 |

## Numbers checklist before sending the CV

- Every bullet has at least one number, or starts with a verb signalling scale ("designed," "led," "owned").
- Numbers are real (or labelled "demo" — never inflated).
- No "responsibilities" — only outcomes.
- No "team player" / "passionate" / "results-driven" — interviewers read past those.
- Tech stack mentioned in the line itself, not in a separate "skills" salad.

## What recruiters skim for (literally)

Years of experience, top-3 tech keywords, a name they recognise (employer or repo), one striking number. Make sure each appears in the **first half of your CV**.
