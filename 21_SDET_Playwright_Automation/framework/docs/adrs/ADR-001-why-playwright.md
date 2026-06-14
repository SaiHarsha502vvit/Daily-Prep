# ADR-001: Adopt Playwright for End-to-End Testing

## Status

- Accepted (2026-06-10)

## Context

The QA team evaluated three end-to-end testing frameworks — Cypress, Selenium WebDriver, and Microsoft Playwright — to address critical issues with our existing Selenium-based test suite:

- **Flakiness**: Our Selenium test suite exhibited a 15% flake rate, with intermittent failures due to timing issues, stale elements, and race conditions in CI environments.
- **Slow execution**: A full regression run took 45 minutes, creating bottlenecks in the CI/CD pipeline and delaying releases.
- **Debugging difficulty**: Test failures in CI required manual reproduction locally, with limited visibility into the root cause of failures.
- **Maintenance burden**: Element selectors were brittle, requiring frequent updates as the application evolved.

### Evaluation Criteria

We evaluated each framework against the following criteria:

| Criteria                 | Cypress       | Selenium           | Playwright         |
| ------------------------ | ------------- | ------------------ | ------------------ |
| Auto-waiting             | Yes           | No                 | Yes                |
| Multi-browser support    | Chromium only | All major browsers | All major browsers |
| TypeScript support       | Yes           | Via WebDriverJS    | Native             |
| Trace viewer             | Third-party   | No                 | Built-in           |
| CI/CD performance        | Good          | Slow               | Excellent          |
| Codegen / Playwright CLI | Limited       | No                 | Yes                |
| Community size           | Large         | Very large         | Growing rapidly    |

## Decision

We will adopt **Playwright 1.40+** as our primary end-to-end testing framework, with the following architectural decisions:

1. **Language**: TypeScript for all new E2E tests, leveraging Playwright's native support.
2. **CI Strategy**: Implement test sharding across 4 parallel workers to reduce full-suite runtime to under 12 minutes.
3. **Local Development**: Provide Docker Compose setup with pre-configured browsers for consistent local reproduction of CI failures.
4. **Migration Plan**: Existing Selenium tests are frozen. Critical-path Selenium tests will be rewritten in Playwright within Q2 2026.

### Technology Stack

- Playwright 1.40+ (TypeScript API)
- Node.js 20+ LTS
- Docker + Playwright Docker image for CI
- Allure Reports for test reporting

## Consequences

### Positive

- **Reduced flakiness**: Playwright's auto-waiting mechanism eliminates explicit `sleep()` calls and handles DOM readiness automatically, targeting <2% flake rate.
- **Faster test execution**: Parallel browser contexts and sharded CI reduce full-suite runtime from 45 min to ~12 min.
- **Improved debugging**: Playwright's trace viewer captures network requests, console logs, and DOM snapshots, making CI failure diagnosis trivial.
- **Codegen acceleration**: `playwright codegen` accelerates test authoring, reducing new test creation time by ~40%.
- **Native TypeScript**: First-class TypeScript support improves code quality, IDE support, and type safety.

### Negative

- **Learning curve**: Team members experienced with Selenium must learn a new API and mental model (~1 sprint for proficiency).
- **Migration effort**: Rewriting critical Selenium tests to Playwright requires approximately 2 sprints of dedicated effort.
- **Library maturity**: While rapidly growing, Playwright's ecosystem is smaller than Selenium's, potentially limiting third-party integrations.
- **Browser support scope**: Requires Chromium, Firefox, and WebKit installed in CI; Docker image adds ~500MB to CI cache.

### Risks

| Risk                                  | Likelihood | Impact | Mitigation                                                      |
| ------------------------------------- | ---------- | ------ | --------------------------------------------------------------- |
| Team resists framework change         | Medium     | High   | Conduct 2-hour hands-on workshop; provide migration cheat sheet |
| Migration takes longer than 2 sprints | Medium     | Medium | Prioritize critical-path tests; defer low-priority rewrites     |
| Playwright API breaking changes       | Low        | Medium | Pin Playwright version; review changelog before upgrades        |
| Docker image CI caching issues        | Low        | Low    | Document cache-busting steps; use Buildkite layer caching       |

## Compliance

1. **New E2E tests**: All new end-to-end tests must use Playwright with TypeScript. No new Selenium tests are permitted.
2. **Selenium freeze**: As of 2026-06-10, no new Selenium tests may be created. Existing Selenium tests are maintained but not enhanced.
3. **CI validation**: All Playwright tests must pass in CI with `--shard=1/N` before merge. Flake rate must remain below 2% (measured over 30-day rolling window).
4. **Code review**: E2E test PRs require approval from at least one team member with Playwright expertise.
5. **Quarterly review**: Re-evaluate Playwright adoption metrics (flake rate, execution time, team satisfaction) in Q3 2026.

## Related

- **Ch44 - Enterprise API Client**: ADR for API testing approach; Playwright's API testing capabilities complement this
- **Ch25 - CI/CD Integration**: Playwright integrates with our GitHub Actions workflow via `@playwright/test` action
- **Ch65 - SDET Curriculum**: Framework decisions align with SDET training materials
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright GitHub](https://github.com/microsoft/playwright)
