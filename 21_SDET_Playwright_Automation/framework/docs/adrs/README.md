# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Playwright E2E testing framework.

## What is an ADR?

An **Architecture Decision Record (ADR)** is a document that captures an important architectural decision made along with its context and consequences. ADRs serve as:

- A **historical record** of why specific technical choices were made
- A **knowledge transfer** mechanism for new team members
- A **living document** that can be revisited as circumstances change
- A **compliance tool** to ensure decisions are consistently applied

## Why ADRs Exist

Over time, engineering teams accumulate implicit knowledge about why certain technical decisions were made. ADRs make this implicit knowledge explicit, preventing:

- **"But why did we choose this?"** — Lost institutional knowledge
- **Renegotiation of settled decisions** — Unnecessary debates
- **Inconsistent implementation** — Teams unaware of past choices
- **Project restart syndrome** — Repeating past mistakes

## How to Write a New ADR

### Step 1: Copy the Template

```bash
cp adrs/adr-template.md adrs/ADR-NNN-title-of-decision.md
```

Replace `NNN` with the next sequential number (check existing ADRs below) and give it a descriptive title in kebab-case.

### Step 2: Fill in the Template

| Section          | Description                                                                             |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Status**       | Start with `Proposed`. Change to `Accepted` after team approval.                        |
| **Context**      | Describe the problem or motivation. Include data (metrics, pain points) when available. |
| **Decision**     | State the specific change being made. Be concrete and actionable.                       |
| **Consequences** | List positive outcomes, negative outcomes, and identified risks with mitigations.       |
| **Compliance**   | Define how the team verifies this decision is followed.                                 |
| **Related**      | Link to other ADRs, curriculum chapters, documentation, or external resources.          |

### Step 3: Open a Pull Request

1. Create a branch: `git checkout -b docs/add-adr-001-playwright-decision`
2. Add your ADR file
3. Commit with message: `docs(adrs): add ADR-001 for Playwright adoption`
4. Open a PR with the ADR for team review
5. After approval, merge and update status to `Accepted` with the approval date

### Writing Guidelines

- **Be concise**: ADRs should be 1-3 pages. If it's longer, consider splitting.
- **Use data**: "15% flake rate" is better than "flaky tests"
- **Present tense**: Use "we will adopt" not "we adopted"
- **Imperative mood**: "Adopt Playwright" not "Playwright adoption"
- **One decision per ADR**: If you're covering multiple unrelated decisions, create multiple ADRs

## Relationship to Curriculum Ch65

The SDET curriculum (Ch65) covers test automation architecture patterns and industry best practices. Our ADRs document how we apply those principles in our specific context:

| Curriculum Topic            | ADR Application                                    |
| --------------------------- | -------------------------------------------------- |
| Framework selection         | ADR-001: Why we chose Playwright over alternatives |
| CI/CD integration           | Referenced in ADR-001; future ADR planned          |
| Test data management        | Future ADR planned                                 |
| Reporting and observability | Future ADR planned                                 |
| Cross-browser testing       | Built into Playwright via ADR-001                  |

## Index of Existing ADRs

| ADR Number                             | Title                                   | Status   | Date       |
| -------------------------------------- | --------------------------------------- | -------- | ---------- |
| [ADR-001](./ADR-001-why-playwright.md) | Adopt Playwright for End-to-End Testing | Accepted | 2026-06-10 |

## Quick Reference

- **Location**: `21_SDET_Playwright_Automation/framework/docs/adrs/`
- **Template**: `adr-template.md`
- **Naming convention**: `ADR-NNN-short-description.md`
- **Status values**: `Proposed` → `Accepted` → `Deprecated` | `Superseded`

## Further Reading

- [Michael Nygard's Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
