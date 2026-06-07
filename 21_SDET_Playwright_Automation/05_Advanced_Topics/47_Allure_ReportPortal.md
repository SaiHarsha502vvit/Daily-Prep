# 47. Allure & ReportPortal — Test Reporting That Scales Beyond `report.html`

**Navigation**: [← 46. BDD with Cucumber](./46_BDD_With_Cucumber.md) | [Index](../00_INDEX.md) | [→ 48. Sharding & Test Selection](./48_Sharding_And_Test_Selection.md)

---

## 5W1H

- **WHAT**: Two reporting systems — Allure (file-based, opens in any browser) and ReportPortal (hosted server with history, search, AI failure clustering).
- **WHY**: Playwright's built-in HTML report is single-run, single-machine. Once you have 1k+ tests across multiple projects, branches, and developers, you need persistent history, owner tagging, and search.
- **WHO**: Teams with > ~200 tests, more than one CI pipeline, or stakeholders outside the immediate team.
- **WHEN**: Once you find yourself answering "did test X fail yesterday too?" by digging through CI artifacts. That's the signal.
- **HOW**: Add a reporter to `playwright.config.ts`. For Allure, generate locally / on CI. For ReportPortal, point it at the hosted server with a token.

---

## 1. The two flavours

| | Allure | ReportPortal |
|---|---|---|
| **Hosting** | None — `npx allure open` locally | Self-hosted or SaaS |
| **History** | Per artefact run | Persistent DB |
| **Cost** | Free | Free OSS, paid SaaS |
| **Best for** | Mid-size teams, CI artifact viewing | Large orgs, multi-team aggregation |
| **Killer feature** | Categories, severity, owners on every test | Failure auto-clustering, defect tracker |

For most teams: **Allure first, ReportPortal when the org demands it.**

---

## 2. Allure — minimum wire-up

```bash
npm i -D allure-playwright allure-commandline
```

```typescript
// playwright.config.ts
reporter: [
  ['list'],
  ['html', { open: 'never' }],
  ['allure-playwright', { detail: true, outputFolder: 'allure-results' }],
],
```

```bash
# After the run
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

## 3. Allure — making it actually useful

```typescript
import { test } from '@playwright/test';
import { allure } from 'allure-playwright';

test('@smoke admin creates a customer', async ({ page }) => {
  await allure.epic('Customer Management');
  await allure.feature('Customer Creation');
  await allure.story('Admin happy path');
  await allure.severity('critical');
  await allure.owner('mawa@example.com');
  await allure.tms('JIRA-1234');
  await allure.issue('JIRA-9876', 'Known flake on Friday');

  // ...
});
```

After that, your Allure UI lets you filter by epic, severity, owner, and link straight to JIRA.

---

## 4. ReportPortal — when you grow into it

```bash
npm i -D @reportportal/agent-js-playwright
```

```typescript
// playwright.config.ts
reporter: [
  ['list'],
  [
    '@reportportal/agent-js-playwright',
    {
      apiKey: process.env.RP_API_KEY!,
      endpoint: 'https://reportportal.yourorg.com/api/v1',
      project: 'your-project',
      launch: 'sdet-playwright',
      attributes: [
        { key: 'branch', value: process.env.GITHUB_REF_NAME ?? 'local' },
        { key: 'env', value: process.env.ENV ?? 'local' },
      ],
    },
  ],
],
```

What ReportPortal does that Allure doesn't:

- **Auto-analyser** — clusters identical failures across runs. "33 tests failed with the same NoSuchElement on Tuesday — likely env issue."
- **Defect classification** — Product Bug / Automation Bug / System Issue / No Defect. Forces a triage discipline.
- **Cross-suite search** — "show me every test that ever failed with `oxd-spinner` in the stack trace."

---

## 5. What to put on EVERY test (regardless of reporter)

Make this a code review rule:

```typescript
test('@smoke @owner:sdet-team customers list paginates', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'jira', description: 'PROJ-1234' });
  testInfo.annotations.push({ type: 'severity', description: 'critical' });
  // ...
});
```

Annotations flow into both Allure and ReportPortal. Test titles encode the tag (`@smoke`, `@owner:...`). Reports become useful instead of decorative.

---

## 6. Common mistakes

1. **Treating the report as the source of truth.** It's a view. The source of truth is the JSON results file (`reporter: [['json', ...]]`).
2. **Not tagging owners.** Every flaky test ends up "team-wide pain." Owners turn it into "Bob owns this one."
3. **Including `allure-results/` in git.** It's a build artefact. Gitignore it.
4. **Running both Allure and ReportPortal "for safety."** Pick one. Two of them is two flake surfaces for reporting.

---

## 7. Senior SDET perspective

The report is the daily artefact your team interacts with. If it's ugly, slow, or noisy, every conversation about quality starts on the back foot. Invest one focused day on reporting once you cross ~200 tests — the ROI is enormous.

---

## 8. Exercise

1. Wire Allure into [`framework/`](../framework/).
2. Add `allure.severity('critical')` and `allure.owner('you@example.com')` to one test.
3. Run the suite, open Allure, click the test, screenshot the page, paste into your notes.
4. Now break one test deliberately. Re-run. See whether the Allure history page surfaces it.

Result: you now have a reporting layer recruiters will recognise on sight.
