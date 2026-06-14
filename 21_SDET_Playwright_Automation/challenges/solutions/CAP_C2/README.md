# Playwright Team Reporter

A custom HTML reporter for Playwright that surfaces organisational context — owner, JIRA links, and per-team breakdowns — alongside standard pass/fail metrics. Drop it into any `playwright.config.ts` and get a self-contained `index.html` with no external dependencies.

## Installation

```bash
npm install playwright-team-reporter
# or reference via file path:
# npm install file:./path/to/CAP_C2
```

## Usage

In `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [["playwright-team-reporter", { outputFolder: "team-report" }]],
});
```

Run your suite normally:

```bash
npx playwright test
```

Output lands in `team-report/index.html` and `team-report/index.json`.

## Dashboard

The HTML page shows:

- **Top bar** — total / passed / failed / flaky / skipped counts with a pass-rate progress bar.
- **Per-project breakdown** — pass/fail counts per project defined in `playwright.config.ts`.
- **Per-owner breakdown** — aggregated results per team member (populated via `@owner` annotations).
- **Top 10 slowest tests** — sorted by duration descending.
- **Failed tests** — first error line + file location.
- **Filters** — buttons for "Failed Only", `@smoke`, `@regression`, and an owner dropdown when owners are present.

## Annotations

Add metadata to tests using Playwright's annotation API:

```typescript
test("my test", async ({ page }) => {
  // @owner alice
  // @jira https://jira.example.com/browse/TEST-123
  // ...
});
```

## Design Choices

The reporter is structured around three layers: **data aggregation**, **rendering**, and the **Playwright interface**.

The aggregation layer (`data/aggregate.ts`) is pure and side-effect free — it accepts raw `TestResult` objects and returns a serialisable `AggregatedResult`. This makes the logic easy to unit-test without spinning up Playwright. The `aggregate` function computes overall, per-project, and per-owner summaries in a single pass, and the flaky detection uses `resultsLength > 1 && lastResultPassed` which correctly handles tests that failed on first attempt but passed on retry.

The render layer (`render/html.ts`) produces a self-contained HTML string with CSS and JS inlined. Inlining means the report is portable — open it from CI artifact storage, email it as an attachment, or serve it from a static host with no server required. The CSS uses CSS custom properties for theming, and the JS is minimal client-side filtering without any framework.

The Playwright interface (`reporter.ts`) implements the `Reporter` interface and is intentionally minimal — it collects data across `onTestEnd` calls and emits output only in `onEnd`, which means the report is written once at the end of the run rather than streamed, making it reliable and atomic.
