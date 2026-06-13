# 65. Architecture Decision Records (ADRs) & Test Strategy

 [← 64. Self-Healing Locators](./64_Self_Healing_Locators.md) | [Index](../00_INDEX.md) | [→ 66. Data Anonymization](./66_Data_Anonymization_And_PII_Masking.md)

---

## 5W1H

| Question | Answer |
|----------|--------|
| **What** | ADRs are lightweight documents that capture significant architectural decisions—why a choice was made, what alternatives were considered, and what consequences follow. A test strategy document is the broader artifact that defines how quality is assured across the engineering organization. |
| **Why** | Teams forget why they chose a tool, a pattern, or an infrastructure setup. New engineers repeat old debates. Leadership lacks context for future pivots. Written decisions preserve institutional memory and accelerate onboarding. |
| **Who** | Principal engineers, staff engineers, tech leads, and senior SDETs author ADRs. The entire engineering team consumes them. QA leadership owns the test strategy document. |
| **Where** | ADRs live in version control (typically `docs/architecture/` or `adr/`). Test strategy lives in the team wiki or a dedicated quality handbook. |
| **When** | Before committing to a significant change: tool adoption, infrastructure migration, pattern change, or test organization restructuring. Write the ADR during the decision process, not after the decision is irreversible. |
| **How** | Use a standardized template, enforce lightweight review (like a PR), link decisions to code, and maintain a decision log that can be superseded when context changes. |

---

## Table of Contents

1. [Why ADRs Matter in Test Engineering](#1-why-adrs-matter-in-test-engineering)
2. [ADR Anatomy](#2-adr-anatomy)
3. [ADR Template](#3-adr-template)
4. [Test Strategy Document Anatomy](#4-test-strategy-document-anatomy)
5. [RFC Writing for Testing Changes](#5-rfc-writing-for-testing-changes)
6. [Decision Log Maintenance](#6-decision-log-maintenance)
7. [Examples: 3 Realistic ADRs](#7-examples-3-realistic-adrs)
8. [Anti-Patterns](#8-anti-patterns)
9. [Senior/Principal Perspective](#9-seniorprincipal-perspective)
10. [DevSecOps Seed](#10-devsecops-seed)
11. [Exercise](#11-exercise)

---

## 1. Why ADRs Matter in Test Engineering

Testing decisions are architectural decisions. The choice of a framework, the shape of the test pyramid, the data strategy, and the CI gating policy all have consequences that ripple through the organization for years. ADRs make those consequences explicit and reviewable.

### 1.1 Team Memory

Engineers leave. Teams reorganize. A decision made in 2023 by a staff engineer who has since moved to another team is invisible to the 2025 hire who wants to know why the suite runs on Playwright instead of Cypress. An ADR captures the reasoning in a searchable, versioned document.

### 1.2 Onboarding Speed

New SDETs and QAEs spend their first weeks asking the same questions:

- Why do we use Docker for local tests but cloud runners in CI?
- Why is our E2E suite sharded by file rather than by scenario?
- Why did we reject visual regression testing two years ago?

A well-maintained ADR log answers these questions without consuming senior engineering time.

### 1.3 Decision Legitimacy

When a team proposes changing a tool or a process, the burden of proof is high. An ADR provides the historical context that makes the new proposal either clearly justified or clearly premature. It prevents teams from re-litigating settled questions every time a new engineer joins.

### 1.4 Alignment with Business Goals

A test strategy that includes ADRs for key decisions can be presented to leadership as evidence of engineering rigor. It demonstrates that quality investments are deliberate, measured, and accountable.

---

## 2. ADR Anatomy

A complete ADR contains six sections. Omitting any of them reduces the document's value.

### 2.1 Title

A concise, descriptive title. Include a number if your team maintains a sequential ADR log.

> **ADR-014: Adoption of Playwright as the Primary E2E Testing Framework**

### 2.2 Status

One of: `proposed`, `accepted`, `deprecated`, `superseded by ADR-NNN`. The status field is critical: it tells readers whether the decision is active, under discussion, or no longer valid.

### 2.3 Context

The forces at play: what problem are you solving? What constraints exist? What is the current state? This section should be rich with data: team size, test suite size, failure rates, maintenance burden, and stakeholder input.

### 2.4 Decision

The choice made, stated clearly and without ambiguity. Use an imperative sentence:

> We will adopt Playwright as the standard E2E testing framework for all new web applications.

Include a brief rationale inline: why this option over the others.

### 2.5 Consequences

The most important section, and the one most often skipped. Consequences are both positive and negative. They must be specific:

- **Positive**: Faster test execution (3x vs Cypress), built-in trace viewer, first-class TypeScript support.
- **Negative**: Team must learn a new API, existing Cypress tests require migration, CI runner images need updating.

Explicitly listing negative consequences builds trust. It shows the decision was made with eyes open.

### 2.6 Compliance

How will the team ensure this decision is followed? Lint rules, CI gates, code review checklists, and training plans all belong here.

> Compliance: All new web repositories must include a Playwright smoke test. Existing repositories will migrate during the Q3 maintenance window. The SDET guild will run a weekly Playwright clinic during the transition.

---

## 3. ADR Template

Below is the standard markdown template your team should use. Store it as `adr/template.md` in your repository.

```markdown
# ADR-NNN: [Short Title]

**Status**: proposed | accepted | deprecated | superseded by ADR-NNN

**Date**: YYYY-MM-DD

**Author(s)**: Name(s) of the authors

**Stakeholders**: Teams or individuals affected by this decision

---

## Context

[Describe the problem, constraints, and relevant background. Include metrics, user stories, and links to related documents or prior discussions.]

## Decision

[State the decision clearly and unambiguously. Use an imperative sentence.]

## Alternatives Considered

### [Alternative 1]

- **Pros**: ...
- **Cons**: ...
- **Why Rejected**: ...

### [Alternative 2]

- **Pros**: ...
- **Cons**: ...
- **Why Rejected**: ...

## Consequences

### Positive

- ...
- ...

### Negative

- ...
- ...

### Neutral

- ...

## Compliance

[Describe how this decision will be enforced and monitored.]

## Related Decisions

- [Link to related ADRs]
- [Link to RFCs or design docs]

## Notes

[Any additional context, meeting notes, or references.]
```

### 3.1 Template Usage Rules

1. **Copy the template**, never edit it in place.
2. **Name files sequentially**: `adr/014-playwright-adoption.md`.
3. **Link from an index**: Maintain `adr/README.md` with a table of all ADRs, statuses, and dates.
4. **Review via PR**: ADRs should be pull-requested and approved by at least two senior engineers before status moves to `accepted`.

---

## 4. Test Strategy Document Anatomy

A test strategy document is the ADR's elder sibling: broader, longer-lived, and more prescriptive. It answers the question "how does this organization assure quality?" rather than "why did we choose X?"

### 4.1 Executive Summary

One page. Readable by a non-technical VP of Engineering. Covers:

- Current quality posture (coverage, flakiness, MTTR).
- Top 3 quality risks.
- Planned investments for the next two quarters.
- Definition of "done" for features.

### 4.2 Scope

What is in scope and what is out of scope for the test effort. Be explicit:

> **In scope**: All customer-facing web applications, REST and GraphQL APIs, and critical batch jobs.
> **Out of scope**: Third-party integrations (tested via contract tests only), internal admin tools (tested manually), and mobile native apps (owned by a separate team).

### 4.3 The Test Pyramid

Document the target distribution:

| Layer | Target % | Current % | Tools | Ownership |
|-------|----------|-----------|-------|-----------|
| Unit | 70% | 65% | Jest, Vitest | Feature teams |
| Integration | 20% | 18% | MSW, Supertest | Feature teams |
| E2E | 10% | 12% | Playwright | SDET guild |
| Visual | 5% | 2% | Chromatic | SDET guild |
| Performance | — | — | k6 | Platform team |

### 4.4 Tools and Infrastructure

A definitive list of approved tools, versions, and deprecation timelines:

> **Approved**: Playwright 1.42+, Jest 29+, k6 0.48+, Docker 24+
> **Deprecated**: Cypress (migrate by Q4), Enzyme (migrate by Q3)
> **Under Evaluation**: Appium for mobile, Artillery for load testing

### 4.5 Environments

Define the environment topology:

- **Local**: Docker Compose, seeded local database.
- **CI**: Ephemeral containers, mock external services.
- **Staging**: Full environment, nightly data refresh, anonymized production snapshot.
- **Pre-production**: Mirror of production, limited access, final validation gate.
- **Production**: Smoke tests only, read-only assertions, synthetic monitoring.

### 4.6 CI Gates

What must pass before merge, before deploy, and in production:

| Gate | Required Checks | Slack Channel | On Failure |
|------|----------------|---------------|------------|
| PR | Unit tests, lint, typecheck | #dev-alerts | Block merge |
| Merge | Integration tests, build | #dev-alerts | Rollback |
| Deploy | E2E smoke, security scan | #oncall-qa | Halt pipeline |
| Post-deploy | Synthetic checks, alert validation | #oncall-qa | PagerDuty |

### 4.7 Data Strategy

How are test data created, managed, and cleaned up?

- **Factories**: Use faker-js and type-safe factories.
- **Snapshots**: Anonymized staging database refreshed weekly.
- **Cleanup**: Each test runs in a transaction; integration tests clean up via `afterEach`.
- **PII**: Never use real user data in tests. See Chapter 66 for full PII masking practices.

### 4.8 Flakiness Prevention

Document the flakiness budget and remediation process:

- Flakiness target: <1% of test runs.
- Any test flaking >3 times in a week is automatically quarantined.
- Quarantined tests must be fixed within 5 business days or deleted.
- Post-mortem required for any flaky test that reached production.

### 4.9 Success Metrics

| Metric | Target | Measured By |
|--------|--------|-------------|
| Code coverage (unit) | 80% | Jest coverage reporter |
| E2E pass rate | 99.5% | Playwright CI report |
| Mean time to detect (MTTD) | <5 min | CI pipeline duration |
| Mean time to repair (MTTR) | <4 hours | PagerDuty + incident logs |
| Flakiness rate | <1% | Weekly CI analytics |

---

## 5. RFC Writing for Testing Changes

An RFC (Request for Comments) precedes an ADR. It is the sociable, exploratory phase of decision-making.

### 5.1 Format

```markdown
# RFC: [Title]

**Author**: Name
**Date**: YYYY-MM-DD
**Status**: Draft | Under Review | Accepted | Rejected

## Problem Statement

[What are we trying to solve? Why does it matter?]

## Goals

[Measurable outcomes.]

## Non-Goals

[What is explicitly out of scope?]

## Proposed Solution

[High-level description.]

## Alternative Solutions

[At least two alternatives with trade-offs.]

## Impact Assessment

[List of teams, systems, and processes affected.]

## Timeline

[Proposed schedule.]

## Open Questions

[Questions you need the community to answer.]
```

### 5.2 Stakeholders

Identify who must review:

- **Direct owners**: SDETs, QAEs, developers on affected teams.
- **Indirect owners**: DevOps (CI changes), Security (auth changes), PMs (timeline impact).
- **Leadership**: Engineering manager for headcount or tooling budget, if applicable.

### 5.3 Review Process

1. **Post to a public channel**: Slack `#engineering-rfcs` or mailing list.
2. **Allow 5 business days** for feedback.
3. **Summarize feedback** in the RFC under a "Discussion Summary" section.
4. **Revise or reject** based on feedback.
5. **Escalate to ADR**: If accepted, the RFC's content becomes the ADR's Context and Decision sections.

---

## 6. Decision Log Maintenance

ADRs decay. Tools become obsolete. Teams reorganize. A decision log that is not maintained becomes archaeological debris, not a resource.

### 6.1 Where to Store

Store ADRs in the same version control system as your code. This ensures:

- Decisions are searchable via `git log` and `grep`.
- Pull requests can update ADRs alongside code changes.
- CI can validate that code changes are covered by an ADR when required.

### 6.2 How to Link

Cross-link aggressively:

- Link ADRs from the test strategy document.
- Link ADRs from relevant code comments: `// See ADR-014 for why we use Playwright.`
- Link ADRs from runbooks and onboarding docs.
- Link superseded ADRs to their replacements: `Superseded by ADR-023`.

### 6.3 When to Supersede

An ADR should be marked deprecated or superseded when:

- The tool it chose is being sunset.
- The organization structure has changed and the ownership model no longer applies.
- A new technology makes the original decision obsolete.
- The decision is no longer followed in practice.

Never delete an ADR. Deprecate it and link forward. History is valuable.

### 6.4 Quarterly Review

Schedule a 30-minute quarterly review of all `accepted` ADRs. Ask:

- Is this still relevant?
- Are we still following it?
- Has the context changed enough to warrant a new RFC?

---

## 7. Examples: 3 Realistic ADRs

### 7.1 ADR-014: Why We Chose Playwright Over Cypress

**Status**: accepted

**Date**: 2023-08-15

**Author**: Jane Doe, Staff SDET

---

#### Context

Our E2E test suite had grown to 400 Cypress tests across three web applications. In Q2 2023, we observed:

- Average CI run time: 42 minutes.
- Flakiness rate: 4.2% (18 tests).
- Most flaky tests were caused by Cypress's command queue timing issues and lack of auto-waiting for network idle.
- Parallelization was limited to 4 machines due to Cypress Dashboard pricing.

The team needed a faster, more stable alternative.

#### Decision

We will adopt Playwright as the standard E2E testing framework.

#### Alternatives Considered

**Cypress (status quo)**
- **Pros**: Team familiarity, large plugin ecosystem, excellent documentation.
- **Cons**: Slow execution, flaky network handling, expensive parallelization, no built-in trace viewer.
- **Why Rejected**: The flakiness and speed issues were structural, not solvable by configuration.

**WebdriverIO + Selenium Grid**
- **Pros**: Mature, cross-browser support (including legacy IE).
- **Cons**: Higher setup complexity, no built-in codegen or trace viewer, requires maintenance of a Grid.
- **Why Rejected**: Team lacks operational capacity to maintain a Grid. Playwright's managed browser binaries reduce infrastructure overhead.

#### Consequences

**Positive**
- E2E suite runs in 14 minutes (3x faster) due to parallel worker model.
- Flakiness dropped to 0.8% within one month.
- Built-in trace viewer reduced debugging time from ~2 hours to ~20 minutes per failure.
- First-class TypeScript support eliminated types mismatch bugs.

**Negative**
- 400 Cypress tests require migration over Q3–Q4.
- CI runner images must be updated to include Playwright dependencies.
- Two team members require upskilling; one is on parental leave until October.

**Neutral**
- Playwright uses a different assertion style (`expect(page).toHaveTitle` vs Cypress chains), which is a syntax change, not a semantic one.

#### Compliance

- All new web repositories must scaffold Playwright via `npm init playwright`.
- Migration tracker maintained in Jira epic `QA-2047`.
- SDET guild runs a Thursday afternoon Playwright clinic.

---

### 7.2 ADR-019: Why We Moved from Docker to Cloud Runners

**Status**: accepted

**Date**: 2024-01-10

**Author**: John Smith, Principal Engineer

---

#### Context

Our CI pipeline ran E2E tests inside Docker Compose on self-hosted GitHub Actions runners. Persistent issues included:

- Runner hardware failures every 2–3 weeks.
- Docker layer caching was unreliable, adding 8–12 minutes to builds.
- Engineers spent approximately 10 hours per month debugging runner issues.
- Peak load (Monday mornings) caused queue times of 20+ minutes.

#### Decision

We will migrate CI E2E jobs to GitHub-hosted cloud runners (`ubuntu-latest-4cores`).

#### Alternatives Considered

**Self-hosted runners with Kubernetes**
- **Pros**: Full control, persistent cache volumes, on-prem data residency.
- **Cons**: Requires dedicated SRE time, autoscaling is complex, still vulnerable to hardware failures.
- **Why Rejected**: The team does not have SRE headcount to maintain K8s runners.

**GitLab CI with shared runners**
- **Pros**: Integrated with our secondary GitLab instance.
- **Cons**: Would require migrating repositories and retraining the team.
- **Why Rejected**: Too disruptive; GitHub Actions is the standard across the org.

#### Consequences

**Positive**
- Queue time reduced to under 2 minutes.
- Zero runner hardware failures.
- Docker caching replaced by GitHub Actions cache, which is reliable.
- Team freed from runner maintenance.

**Negative**
- Cost increase of approximately $400/month in compute.
- Less control over runner environment configuration.
- Cloud runners have ephemeral storage, so very large artifacts must be uploaded to S3.

#### Compliance

- Cost monitored monthly via GitHub billing dashboard.
- All workflows must use the standard runner label; custom labels require approval.

---

### 7.3 ADR-027: Why We Implemented Test Sharding

**Status**: accepted

**Date**: 2024-05-22

**Author**: Alice Chen, Senior SDET

---

#### Context

The E2E suite grown to 800 Playwright tests. Even with Playwright's parallel workers, the longest shard took 28 minutes. The bottleneck was a single monolithic test file (`checkout.spec.ts`) with 45 test cases that could not be parallelized internally due to shared state.

#### Decision

We will shard tests dynamically by estimated duration using a custom sharding script, and split the monolithic checkout file into 3 domain-specific files.

#### Alternatives Considered

**File-based sharding (default Playwright behavior)**
- **Pros**: Zero configuration.
- **Cons**: Uneven distribution because `checkout.spec.ts` is 5x larger than the next largest file.
- **Why Rejected**: The longest shard still took 24 minutes.

**Test-level sharding with external orchestrator**
- **Pros**: Perfectly even distribution.
- **Cons**: Requires a custom orchestrator service; adds operational complexity.
- **Why Rejected**: The custom script with historical duration data achieves 90% of the benefit at 10% of the complexity.

#### Consequences

**Positive**
- Longest shard reduced from 28 minutes to 12 minutes.
- Checkout tests became readable and maintainable after file split.
- Shard script is reusable for other suites.

**Negative**
- Historical duration data must be refreshed weekly; stale data causes drift.
- File split required updating 15 page-object imports.

#### Compliance

- Shard script runs in CI; duration artifacts uploaded to S3.
- Checkout suite ownership assigned to Alice Chen.

---

## 8. Anti-Patterns

### 8.1 ADRs Without a Consequences Section

An ADR that lists only the decision and the context is a press release, not an engineering document. Readers need to know the trade-offs. Omitting consequences breeds distrust and encourages teams to quietly bypass the decision.

### 8.2 Not Linking ADRs to Code

An ADR that exists only in `docs/` is invisible to the developer editing the code. Add code comments that reference ADRs at the points of impact. When a developer sees `// See ADR-014`, they know the choice was deliberate.

### 8.3 Keeping Rejected ADRs Invisible

A rejected ADR is as valuable as an accepted one. It records why a path was not taken, preventing the next engineer from proposing the same rejected solution. Store rejected ADRs in the same directory with status `rejected`.

### 8.4 Not Reviewing Past Decisions

An ADR accepted in 2021 may no longer reflect reality. If nobody reviews the log, the team operates on outdated constraints. Schedule quarterly reviews.

### 8.5 ADRs as Blame Documents

Never use an ADR to assign blame for a past failure. The tone should be descriptive and forward-looking. Blame corrodes psychological safety and discourages honest documentation.

### 8.6 Writing ADRs After the Decision Is Already Irreversible

An ADR written after the migration is complete, the contracts are signed, and the old tool is already deleted is theater. It provides no opportunity for feedback and no record of debate. Write ADRs during the decision phase, update them after acceptance.

---

## 9. Senior/Principal Perspective: ADRs as Teaching Artifacts

A principal engineer's ADR is read for years. Write it as you would write a textbook chapter.

### 9.1 Clarity Over Cleverness

Use plain language. Avoid jargon that will confuse a new hire. Define acronyms. Include diagrams. The ADR that is never read is the ADR that failed.

### 9.2 Include the Road Not Taken

Future engineers will ask "why not X?" Answer them in the document. A thorough "Alternatives Considered" section saves hours of repeated explanation.

### 9.3 Teach the Organization to Decide

The best outcome of an ADR process is not the document itself, but the cultural shift toward deliberate, documented decision-making. When junior engineers start proposing RFCs without being asked, the process has succeeded.

### 9.4 Link ADRs to Career Growth

For senior and principal engineers, writing and shepherding ADRs is a visible leadership activity. It demonstrates systems thinking, communication, and the ability to build consensus across teams.

---

## 10. DevSecOps Seed: Security Decisions Belong in ADRs

Security architecture is not exempt from documentation. Auth strategies, data handling policies, and encryption decisions must be recorded with the same rigor as testing decisions.

### 10.1 Auth Strategy ADR

| Element | What to Document |
|---------|-----------------|
| Protocol | OAuth 2.0, SAML, OIDC, mTLS |
| Token storage | HttpOnly cookies, localStorage, in-memory |
| Rotation policy | Access token TTL, refresh token TTL, revocation strategy |
| Test implications | How do tests authenticate? Service accounts, mock tokens, or real IdP? |

### 10.2 Data Handling ADR

| Element | What to Document |
|---------|-----------------|
| PII classification | What data is considered PII in your jurisdiction |
| Test data sourcing | Synthetic, anonymized, or production snapshots |
| Masking strategy | How PII is redacted in logs, traces, and test artifacts |
| Retention | How long test outputs containing DOM snapshots are kept |

### 10.3 Compliance Linkage

Reference your ADRs during audits. An auditor who sees `ADR-031: Test Data Anonymization Strategy` with a `accepted` status and a clear compliance section has evidence of due diligence.

---

## 11. Exercise

### Task: Write an ADR for Adopting Visual Regression Testing

Your organization currently relies on manual QA for UI consistency checks. The design system team has proposed adopting Chromatic for visual regression testing. Your task is to write a complete ADR following the template in Section 3.

#### Requirements

1. **Title**: Use the format `ADR-NNN: Adoption of Visual Regression Testing via Chromatic`.
2. **Status**: `proposed`.
3. **Context**: Include realistic data:
   - Current manual QA time spent on visual checks: ~20 hours per sprint.
   - Two production bugs in the last quarter caused by unnoticed UI regressions.
   - Team size: 8 frontend engineers, 2 designers, 3 QAEs.
   - Existing component library uses Storybook.
4. **Decision**: State clearly whether to adopt Chromatic or not.
5. **Alternatives Considered**: Include at least two alternatives (e.g., Happo, Loki, or manual QA status quo) with pros, cons, and rejection rationale.
6. **Consequences**: At least three positive and two negative consequences.
7. **Compliance**: Describe how the team will enforce visual regression coverage (e.g., CI gate, Storybook story requirements, designer review workflow).

#### Self-Grading Rubric

| Criterion | 0 points | 1 point | 2 points |
|-----------|----------|---------|----------|
| **Title and Status** | Missing or malformed | Present but incomplete | Complete, follows template |
| **Context** | No data or irrelevant data | Some data but lacks specifics | Specific metrics, team size, real historical events |
| **Decision** | Ambiguous or missing | Stated but without rationale | Clear, imperative, with inline justification |
| **Alternatives** | None or one | Two alternatives, shallow analysis | Two+ alternatives with thorough pros/cons/rejection |
| **Consequences** | Missing or only positives | Mixed but fewer than required | At least 3 positive, 2 negative, specific and measurable |
| **Compliance** | Missing | Vague mention of enforcement | Concrete rules, CI gates, owner assignments, timelines |
| **Writing quality** | Unclear or unprofessional | Readable but uneven | Clear, professional, suitable for onboarding a new engineer |

**Total possible: 14 points**

- **12–14**: Excellent. This ADR could be submitted to leadership as-is.
- **9–11**: Good. Minor gaps in data depth or compliance detail.
- **6–8**: Needs work. Review Sections 2 and 3, then expand context and consequences.
- **0–5**: Significant revision required. Read the example ADRs in Section 7 and rewrite.

---

**Navigation**: [← 64. Self-Healing Locators](./64_Self_Healing_Locators.md) | [Index](../00_INDEX.md) | [→ 66. Data Anonymization](./66_Data_Anonymization_And_PII_Masking.md)
