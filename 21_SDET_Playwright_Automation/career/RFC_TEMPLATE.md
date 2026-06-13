# RFC Template

| Field | Value |
|-------|-------|
| **RFC ID** | RFC-YYYY-NNN |
| **Author(s)** | Name(s) |
| **Date** | YYYY-MM-DD |
| **Status** | Draft / Proposed / Approved / Rejected / Superseded |
| **Stakeholders** | Team A, Team B, QA Org |
| **Reviewers** | @handle1, @handle2 |

---

## 1. Summary

One-paragraph elevator pitch of the proposed change. What is being proposed and what outcome is expected?

---

## 2. Motivation

### Why now?
What recent event, metric, or strategic priority makes this proposal relevant today?

### What problem are we solving?
Describe the current pain point. Include data: failure rates, time lost, customer impact, or maintenance burden.

### Who is affected?
List teams, systems, or user groups that experience this problem.

---

## 3. Proposal

### Detailed Change
Describe the proposed solution in sufficient detail that an engineer could begin implementation.
- Architecture changes
- New components or services
- API modifications
- Configuration changes

### Scope
- In scope: specific deliverables
- Out of scope: explicit exclusions to prevent scope creep

### Dependencies
List any prerequisites or dependent RFCs that must land first.

---

## 4. Alternatives Considered

### Alternative 1: [Option Name]
- **Description:** Brief summary of the alternative approach
- **Rejection reason:** Why this path was not chosen (cost, risk, compatibility, etc.)

### Alternative 2: [Option Name]
- **Description:** Brief summary
- **Rejection reason:** Specific trade-off that made it inferior

### Alternative 3: [Option Name] (if applicable)
- **Description:** Brief summary
- **Rejection reason:** Rationale for rejection

---

## 5. Impact

### Teams Affected
| Team | Impact | Action Required |
|------|--------|-----------------|
| Team A | High | Migration of test suite |
| Team B | Medium | Update CI pipeline config |

### Migration Path
1. Phase 1: Set up new system in parallel
2. Phase 2: Migrate critical paths
3. Phase 3: Deprecate old system
4. Phase 4: Remove old system

### Backward Compatibility
Describe any breaking changes and how they will be managed.

---

## 6. Rollout Plan

| Phase | Timeline | Deliverables | Owner | Success Signal |
|-------|----------|--------------|-------|----------------|
| Phase 1 | Week 1-2 | Infrastructure setup | Platform Team | PR merged |
| Phase 2 | Week 3-6 | Pilot with 2 teams | Pilot Teams | Green dashboards |
| Phase 3 | Week 7-10 | Org-wide migration | All Teams | 80% migrated |
| Phase 4 | Week 11-12 | Cleanup & deprecation | Platform Team | Old system removed |

---

## 7. Success Criteria

- **Metric 1:** Target value and measurement method
- **Metric 2:** Target value and measurement method
- **Metric 3:** Target value and measurement method

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Risk description | Medium | High | Mitigation strategy |
| Risk description | Low | Medium | Mitigation strategy |

---

# FILLED EXAMPLE: Migrate from Puppeteer to Playwright

| Field | Value |
|-------|-------|
| **RFC ID** | RFC-2024-042 |
| **Author(s)** | Jordan Lee (Senior SDET) |
| **Date** | 2024-06-10 |
| **Status** | Proposed |
| **Stakeholders** | Checkout Team, Search Team, Mobile Web Team, QA Platform |
| **Reviewers** | @sarah-platform, @mike-checkout |

## Summary

Propose migrating all browser-based E2E tests from Puppeteer to Playwright across the organization. This change aims to reduce test flakiness by ~40%, cut test execution time by ~25%, and provide native cross-browser testing (Chromium, Firefox, WebKit) with a single API.

## Motivation

### Why now?
Recent quarterly metrics show Puppeteer-based E2E suites flaking at 8.3% (target: <3%). Developer toil from reruns consumes ~120 engineer-hours per week. Playwright has reached maturity (v1.44+) and is now the industry standard.

### What problem are we solving?
- Flaky tests due to Puppeteer's less-reliable auto-waiting
- Chrome-only coverage missing Safari regressions (12% of our user base)
- Maintenance burden: Puppeteer API churn requires frequent test rewrites
- No native parallelization; we built custom sharding that is brittle

### Who is affected?
All 6 teams with E2E test suites (42 suites, ~2,800 tests total).

## Proposal

### Detailed Change
- Replace `puppeteer` npm dependency with `@playwright/test` in all E2E packages
- Convert page-object models to Playwright's locator API
- Replace custom wait helpers with Playwright's built-in auto-waiting
- Adopt Playwright's test runner (replacing Jest for E2E only)
- Configure projects for Chromium, Firefox, and WebKit in CI
- Enable trace-on-failure for flaky-test debugging

### Scope
- **In scope:** All E2E tests using Puppeteer; CI pipeline integration; local dev scripts
- **Out of scope:** Unit tests (remain on Jest); API integration tests (remain on Supertest); visual regression (separate RFC)

### Dependencies
- DPL-2024-011 (CI runner image with Playwright browsers pre-installed) must land first

## Alternatives Considered

### Alternative 1: Upgrade Puppeteer to latest and patch flakiness
- **Description:** Stay on Puppeteer, upgrade to v22+, and invest in custom stabilization helpers
- **Rejection reason:** Puppeteer still lacks native cross-browser support. Patching flakiness is whack-a-mole. Estimated effort is comparable to migration with fewer long-term benefits.

### Alternative 2: Adopt Cypress
- **Description:** Migrate to Cypress for its rich ecosystem and time-travel debugging
- **Rejection reason:** Cypress requires architecture changes (cy.origin limitations, restricted network stubbing). Playwright's API is closer to our existing Puppeteer patterns, reducing migration cost by ~40%.

### Alternative 3: Build an abstraction layer over both
- **Description:** Create internal wrapper supporting both Puppeteer and Playwright
- **Rejection reason:** Adds permanent complexity and maintenance. Delays benefits by months. No clear exit strategy from Puppeteer.

## Impact

### Teams Affected
| Team | Impact | Action Required |
|------|--------|-----------------|
| Checkout | High | Migrate 14 suites (~900 tests) |
| Search | High | Migrate 10 suites (~700 tests) |
| Mobile Web | Medium | Migrate 8 suites (~500 tests) |
| Platform | Medium | Maintain shared page objects; update CI templates |

### Migration Path
1. **Phase 1:** Set up Playwright in `e2e-platform` repo; create shared base fixtures
2. **Phase 2:** Pilot with Checkout team (high flakiness = highest ROI)
3. **Phase 3:** Roll out to Search, Mobile Web, remaining teams by priority
4. **Phase 4:** Freeze Puppeteer tests (no new tests); run deprecation clock for 30 days
5. **Phase 5:** Remove Puppeteer dependency and custom sharding code

### Backward Compatibility
No user-facing changes. Internal test APIs may change; team migration guides will be provided.

## Rollout Plan

| Phase | Timeline | Deliverables | Owner | Success Signal |
|-------|----------|--------------|-------|----------------|
| Phase 1 | Week 1-2 | Playwright infra + base fixtures | Platform Team | PR merged, CI green |
| Phase 2 | Week 3-5 | Checkout pilot migrated | Checkout + Platform | Flakiness <3% on migrated suites |
| Phase 3 | Week 6-10 | Search, Mobile Web, others migrated | Respective Teams | 80% of suites migrated |
| Phase 4 | Week 11 | Freeze + deprecation notice | Platform Team | Announcement sent |
| Phase 5 | Week 12 | Remove Puppeteer | Platform Team | Zero Puppeteer imports in monorepo |

## Success Criteria

- **Flakiness rate:** E2E flakiness drops from 8.3% to <3% (measured by CI rerun analytics)
- **Execution time:** Average E2E suite runtime reduced by >=20% (measured by CI duration metrics)
- **Coverage:** Safari/WebKit tests running in CI for all migrated suites (measured by test reporter)
- **Adoption:** 100% of Puppeteer E2E suites migrated within 12 weeks (measured by package.json audit)
- **Developer NPS:** Post-migration survey score >= 7/10 for E2E authoring experience

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration takes longer than planned, delaying other work | Medium | High | Phased approach; freeze Puppeteer at Phase 4 regardless of adoption gaps. Provide dedicated office hours. |
| WebKit tests expose new flaky behavior | Medium | Medium | Start WebKit runs in non-blocking mode; promote to blocking after 2 weeks of stability. |
| Team knowledge gap in Playwright APIs | Medium | Medium | Run 2 training sessions; maintain migration guide with before/after code samples. |
| CI costs increase with 3 browsers | Low | Medium | Use sharding; run Firefox/WebKit on PR only for changed app paths; full suite nightly. |
