# ADR-005: No BDD/Cucumber Layer — Plain @playwright/test with test.step

## Status

- Accepted (2026-07-25)

## Context

Gherkin-based BDD (Cucumber + playwright-bdd or cucumber-js) is a recurring stakeholder request: "readable scenarios anyone can write." The honest cost accounting (Ch46 covers this at length):

- A second abstraction layer: every step definition is glue code to maintain; step-name refactors ripple through feature files.
- The promised author never materializes: in practice product owners do not write Gherkin; engineers write it *for* them, so the layer buys a reading format, not an authoring one.
- Debugging indirection: a trace points at a step definition, one hop from the actual Playwright call.
- Tooling friction: parallelism, fixtures, and projects all work through an adapter instead of natively.

Meanwhile `test.step()` + good test titles already produce a readable execution report (HTML/Allure show nested steps in plain English), and the Data Accumulator + POM architecture (Ch07/Ch24) keeps specs declarative.

## Decision

The framework uses **plain `@playwright/test`**. Readability requirements are met by:

1. Test titles written as behavior statements (`'rejects login when password expired'`).
2. `test.step('Given an employee with pending leave', …)` nesting for report structure.
3. Tags (`@smoke`, `@regression`) for slicing, not feature files.

BDD is re-evaluated only if a *named* non-engineer commits to authoring scenarios for one quarter (the condition that historically never triggers — see Ch46's adoption-cost analysis).

## Consequences

### Positive

- One abstraction layer fewer: trace → spec line, no glue hop; all Playwright tooling (UI mode, codegen, fixtures, projects) works natively.
- No step-definition registry to keep DRY across teams — the POM layer is the shared vocabulary instead.
- Reports remain stakeholder-readable via step nesting without a parallel file format.

### Negative

- No feature-file artifact for compliance shops that audit "requirements ↔ tests" mapping. Mitigated: tags carry ticket IDs (`@JIRA-1234`), and the Allure report groups by epic annotation.
- Teams arriving from Cucumber shops lose a familiar workflow — onboarding covers the `test.step` equivalence explicitly.

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A regulated client mandates Gherkin | Low | Medium | playwright-bdd can wrap existing POMs later; the POM/fixture investment is BDD-agnostic |
| Spec readability decays without the Gherkin constraint | Medium | Low | Code-review rubric enforces behavior-style titles and step usage |

## Related

- Ch46 BDD with Cucumber — the full cost-benefit teaching chapter
- Ch07 / Ch24 — the architecture that makes plain specs readable
- `career/CODE_REVIEW_RUBRIC.md` — the enforcement instrument
