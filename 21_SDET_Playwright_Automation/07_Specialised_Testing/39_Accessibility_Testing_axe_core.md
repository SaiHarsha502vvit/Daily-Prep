# 39. Accessibility Testing — axe-core, WCAG 2.1, and Automated A11y

**Navigation**: [â† Chapter 38: Contract Testing](./38_Contract_Testing_Pact.md) | [Index](../00_INDEX.md) | [→ Chapter 40: Security Test Automation](./40_Security_Testing_OWASP.md)

**Open-Source Tools Referenced:**
- **axe-core** — https://github.com/dequelabs/axe-core (MPL 2.0) — the world's leading accessibility testing engine, by Deque Systems
- **@axe-core/playwright** — https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright (MPL 2.0)
- **axe-html-reporter** — https://github.com/lpelypenko/axe-html-reporter (MIT) — beautiful HTML reports

**Online References:**
- https://www.w3.org/WAI/WCAG21/quickref/ — WCAG 2.1 Quick Reference (W3C)
- https://dequeuniversity.com/rules/axe/ — axe rule descriptions (Deque University)
- https://web.dev/accessibility/ — Google's accessibility guide
- https://a11y.coffee/ — Community accessibility guide

**Cross-references (this repo):**
- [`../../15_React_Frontend`](../../../15_React_Frontend) — ARIA attributes in React components
- [`../../18_CSS_Complete`](../../../18_CSS_Complete) — Focus styles, colour contrast CSS

---

## 5W1H

- **WHAT**: Automated checking of web pages against the WCAG 2.1 (Web Content Accessibility Guidelines) standard — finding missing ARIA labels, inadequate colour contrast, keyboard trap issues, and dozens of other problems that prevent disabled users from using your application.
- **WHY**: (1) Legal: WCAG 2.1 Level AA is legally required in the UK (Equality Act 2010), EU (EN 301 549), and US (ADA, Section 508). Enterprise portals that are inaccessible expose organisations to legal action. (2) Practical: 1 in 5 people in the UK have a disability. (3) SEO: Screen reader accessibility overlaps with search crawler accessibility.
- **WHO**: Every SDET. Accessibility is not optional — it's part of quality.
- **WHEN**: After functional tests are green. Run in CI on every PR. Block PRs that introduce new failures.
- **HOW**: `@axe-core/playwright` injects the axe engine into the page and returns violations. You assert `violations.length === 0` (or filter to specific impact levels).

---

## 1. The WCAG Framework — What You're Testing Against

From [w3.org/WAI/WCAG21](https://www.w3.org/WAI/WCAG21/quickref/):

```
WCAG 2.1 has 4 principles (POUR):
  P — Perceivable:   Users can perceive all content
  O — Operable:      Users can operate all UI
  U — Understandable: Content is understandable
  R — Robust:        Works with assistive technologies

Each principle has guidelines. Each guideline has success criteria at 3 levels:
  A   — minimum level (must meet)
  AA  — standard level (legally required in UK/EU/US for enterprise)
  AAA — highest level (enhanced, aspirational)

Most organisations target AA.

Key WCAG 2.1 AA rules you'll encounter:
  1.1.1 Non-text Content (A)     → Images must have alt text
  1.3.1 Info and Relationships   → Table headers with scope
  1.4.3 Colour Contrast (AA)     → 4.5:1 ratio for normal text
  1.4.11 Non-text Contrast (AA)  → 3:1 for UI components
  2.1.1 Keyboard (A)             → All functionality via keyboard
  2.4.3 Focus Order (A)          → Logical tab order
  2.4.7 Focus Visible (AA)       → Focus ring must be visible
  3.1.1 Language of Page (A)     → lang attribute on <html>
  4.1.2 Name, Role, Value (A)    → Form elements must have labels
```

---

## 2. Installation and Setup

```bash
# Install the Playwright-specific axe integration:
npm install --save-dev @axe-core/playwright

# For HTML reports:
npm install --save-dev axe-html-reporter

# Check versions (axe-core updates its rule database regularly):
npm show @axe-core/playwright version   # → e.g., 4.9.1
npm show axe-core version               # → e.g., 4.9.1
```

---

## 3. The Axe Fixture — Auto-Run A11y on Every Page

```typescript
// fixtures/accessibility.fixture.ts
import AxeBuilder from '@axe-core/playwright';
import type { AxeResults, Result } from 'axe-core';

export interface AccessibilityFixtures {
  // Run axe on the current page and return results
  runA11y: (options?: A11yOptions) => Promise<AxeResults>;
  // Assert zero violations at the given impact levels
  assertA11y: (options?: A11yOptions) => Promise<void>;
}

export interface A11yOptions {
  // WCAG level to test against: 'wcag2a' | 'wcag2aa' | 'wcag2aaa' | 'wcag21a' | 'wcag21aa'
  tags?: string[];
  // Specific rules to enable or disable
  runOnly?: string[];
  // CSS selectors to exclude from scanning (e.g. third-party widgets you can't fix)
  exclude?: string[];
  // Impact levels to fail on: 'critical' | 'serious' | 'moderate' | 'minor'
  failOnImpact?: ('critical' | 'serious' | 'moderate' | 'minor')[];
}

export const test = base.extend<AccessibilityFixtures>({

  runA11y: async ({ page }, use) => {
    const runner = async (options: A11yOptions = {}): Promise<AxeResults> => {
      const builder = new AxeBuilder({ page })
        .withTags(options.tags ?? ['wcag2a', 'wcag2aa', 'wcag21aa'])  // target WCAG 2.1 AA
        .exclude(options.exclude ?? [
          // Common exclusions in enterprise apps:
          '[data-testid="third-party-chat-widget"]',  // third-party we can't fix
          '.ms-CommandBar-overflowButton',             // D365 Fluent UI overflow (known issue)
        ]);

      if (options.runOnly) {
        builder.withRules(options.runOnly);
      }

      const results = await builder.analyze();

      // Attach results to test report for visibility
      const { test } = await import('@playwright/test');
      test.info().attach('axe-results', {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json',
      });

      return results;
    };

    await use(runner);
  },

  assertA11y: async ({ runA11y }, use) => {
    const asserter = async (options: A11yOptions = {}): Promise<void> => {
      const results = await runA11y(options);
      const impactThreshold = options.failOnImpact ?? ['critical', 'serious'];

      // Filter to only violations at or above the impact threshold
      const failures = results.violations.filter(v =>
        impactThreshold.includes(v.impact as any)
      );

      if (failures.length > 0) {
        // Format a human-readable failure message
        const message = failures.map(v =>
          `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n` +
          `  Help: ${v.helpUrl}\n` +
          v.nodes.slice(0, 3).map(n =>
            `  → ${n.target.join(', ')}: ${n.failureSummary}`
          ).join('\n')
        ).join('\n\n');

        throw new Error(
          `${failures.length} accessibility violation(s) found:\n\n${message}`
        );
      }
    };

    await use(asserter);
  },
});
```

---

## 4. Using Axe in Tests

### Basic Usage

```typescript
// tests/specs/accessibility/citation-pages.a11y.spec.ts
import { test, expect } from '../../fixtures';

test.describe('Accessibility @a11y @wcag', () => {

  test('Citation search page — no WCAG 2.1 AA violations', async ({
    page,
    assertA11y,
  }) => {
    await page.goto('/citations');
    await page.waitForLoadState('networkidle');  // wait for dynamic content to load

    // Assert: zero critical or serious violations
    await assertA11y({
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      failOnImpact: ['critical', 'serious'],
    });
  });

  test('Citation creation form — all form fields are labelled', async ({
    page,
    runA11y,
  }) => {
    await page.goto('/citations/new');

    const results = await runA11y({
      // Only test form-labelling rules — specific assertion
      runOnly: ['label', 'label-content-name-mismatch', 'select-name', 'form-field-multiple-labels'],
    });

    // Zero violations for form labelling rules
    expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
  });

  test('Citation detail page — screen reader accessible', async ({
    page,
    runA11y,
    testCitation,
  }) => {
    await page.goto(`/citations/${testCitation.citationId}`);

    const results = await runA11y({
      // Focus on ARIA rules — critical for screen readers
      tags: ['cat.aria', 'wcag2a', 'wcag2aa'],
    });

    const critical = results.violations.filter(v => v.impact === 'critical');
    const serious  = results.violations.filter(v => v.impact === 'serious');

    // Zero critical ARIA violations
    if (critical.length > 0) {
      throw new Error(`${critical.length} critical ARIA violation(s):\n${formatViolations(critical)}`);
    }

    // Warn on serious (don't block, but log)
    if (serious.length > 0) {
      console.warn(`[A11y Warning] ${serious.length} serious violation(s):\n${formatViolations(serious)}`);
    }
  });
});

// Helper: format violations for readable error messages
function formatViolations(violations: import('axe-core').Result[]): string {
  return violations.map(v =>
    `• [${v.impact}] ${v.id}: ${v.description}\n` +
    `  Rule: https://dequeuniversity.com/rules/axe/${v.id}\n` +
    `  Nodes: ${v.nodes.map(n => n.target.join(', ')).join(' | ')}`
  ).join('\n\n');
}
```

### Testing Keyboard Navigation

```typescript
test('Citation form is fully keyboard navigable', async ({ page }) => {
  await page.goto('/citations/new');

  // Tab through all form fields — verify focus moves correctly
  const focusableElements = page.locator(':focus-visible');

  await page.keyboard.press('Tab');
  // First focusable element should be the first form field
  await expect(focusableElements).toBeFocused();
  const firstLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  expect(firstLabel, 'First focusable element must have aria-label').toBeTruthy();

  // Tab through all 5 fields and the submit button
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
  }
  // Last focused should be Submit button
  const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
  expect(['button', 'input[type="submit"]']).toContain(activeTag);

  // Tab once more — focus should NOT get trapped
  await page.keyboard.press('Tab');
  // If focus is now outside the form → no keyboard trap ✅
});

test('Modal closes on Escape key', async ({ page }) => {
  await page.goto('/citations/new');
  await page.locator('[data-testid="help-modal-trigger"]').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // Accessibility requirement: modals must close on Escape
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 2000 });

  // Focus must return to the trigger element after modal closes
  const activeEl = await page.evaluate(() =>
    document.activeElement?.getAttribute('data-testid')
  );
  expect(activeEl).toBe('help-modal-trigger');
});
```

### Colour Contrast Check (Specific Rule)

```typescript
test('Colour contrast meets WCAG AA (4.5:1 for normal text)', async ({ page, runA11y }) => {
  await page.goto('/citations');

  const results = await runA11y({
    runOnly: ['color-contrast', 'color-contrast-enhanced'],
  });

  // Map contrast violations to human-readable format
  if (results.violations.length > 0) {
    const details = results.violations.flatMap(v =>
      v.nodes.map(n => ({
        element: n.target.join(', '),
        foreground: n.any[0]?.data?.fgColor,
        background: n.any[0]?.data?.bgColor,
        ratio: n.any[0]?.data?.contrastRatio,
        required: v.id === 'color-contrast' ? '4.5:1' : '7:1',
      }))
    );
    console.table(details);
    throw new Error(`${results.violations.length} colour contrast violation(s) found (see table above)`);
  }
});
```

---

## 5b. `aria-live` Region Testing — Dynamic Content Announcements

Screen readers use `aria-live` regions to announce dynamic content changes. Test that these regions work correctly:

```typescript
test('Search results count is announced to screen readers via aria-live', async ({ page }) => {
  await page.goto('/citations');

  // Find the aria-live region that announces result counts
  const liveRegion = page.locator('[aria-live]');

  // Verify the live region exists and has the correct politeness level
  await expect(liveRegion).toHaveCount({ minimum: 1 });
  const politeness = await liveRegion.first().getAttribute('aria-live');
  // 'polite' = announced after current speech finishes (correct for search results)
  // 'assertive' = interrupts current speech (for urgent alerts only)
  expect(politeness, 'Search result announcement should be polite').toBe('polite');

  // Trigger a search
  await page.fill('#searchInput', 'CIT-001');
  await page.click('#searchBtn');

  // Wait for the live region to be updated with the result count
  await expect(liveRegion.first()).toContainText(/results found|no results/i, { timeout: 15_000 });
});

test('Error messages are announced immediately via aria-live assertive', async ({ page }) => {
  await page.goto('/citations/new');

  // Submit empty form to trigger validation errors
  await page.click('#submitBtn');

  const errorRegion = page.locator('[aria-live="assertive"]');
  await expect(errorRegion).toBeVisible({ timeout: 5000 });
  await expect(errorRegion).not.toBeEmpty();
  // Assertive = screen reader announces immediately, interrupting current speech
  // This is correct for form validation errors (user needs to know NOW)
});

test('Loading spinner has aria-label for screen readers', async ({ page }) => {
  await page.goto('/citations');
  await page.click('#searchBtn');

  const spinner = page.locator('.ms-Spinner, [role="progressbar"]').first();
  if (await spinner.isVisible()) {
    // Spinner must have either aria-label or aria-labelledby — otherwise screen reader says nothing
    const ariaLabel     = await spinner.getAttribute('aria-label');
    const ariaLabeledBy = await spinner.getAttribute('aria-labelledby');
    expect(
      ariaLabel || ariaLabeledBy,
      'Loading spinner must have aria-label or aria-labelledby for screen readers'
    ).toBeTruthy();
  }
});
```

---

## 5c. ARIA Tree Inspection via `page.evaluate`

For deep ARIA debugging, walk the accessibility tree from JavaScript:

```typescript
test('D365 CommandBar buttons are accessible', async ({ page }) => {
  await page.goto('/citations');

  // Walk the CommandBar accessibility tree
  const commandBarA11y = await page.evaluate(() => {
    const commandBar = document.querySelector('[role="menubar"], .ms-CommandBar');
    if (!commandBar) return null;

    const items = Array.from(commandBar.querySelectorAll('[role="menuitem"], [role="button"]'));
    return items.map(el => ({
      role:        el.getAttribute('role'),
      ariaLabel:   el.getAttribute('aria-label'),
      ariaDisabled: el.getAttribute('aria-disabled'),
      textContent: el.textContent?.trim().substring(0, 50),
      tabIndex:    (el as HTMLElement).tabIndex,
    }));
  });

  expect(commandBarA11y, 'CommandBar must be findable').not.toBeNull();

  for (const item of commandBarA11y ?? []) {
    // Every interactive item must have a name (label or text)
    expect(
      item.ariaLabel || item.textContent,
      `CommandBar item has no accessible name: role=${item.role}`
    ).toBeTruthy();
  }
});

// The D365/Fluent UI components that commonly fail axe — document as known exclusions:
// These are Microsoft Fluent UI issues, not your app's issues:
const fluentUIKnownAxeExclusions = [
  '.ms-CommandBar-overflowButton',  // overflow "..." button — aria-label missing in some Fluent versions
  '.ms-Spinner',                    // spinner lacks aria-label in older Fluent UI
  '.ms-DetailsHeader-checkTooltip', // checkbox tooltip in grid headers
  '[data-icon-name]',               // icon-only buttons without text in some Fluent versions
];
// Use these in your AxeBuilder exclude() call for known Fluent UI violations
// ALWAYS track these in KnownViolations with a Fluent UI version and expected fix date
```

---

```typescript
// After your test suite runs, generate a shareable HTML report:
// axe-html-reporter: https://github.com/lpelypenko/axe-html-reporter

import { createHtmlReport } from 'axe-html-reporter';
import fs from 'fs';

// In a globalTeardown or reporter:
async function generateA11yReport(allResults: AxeResults[]): Promise<void> {
  const combinedViolations = allResults.flatMap(r => r.violations);

  const htmlReport = createHtmlReport({
    results: { violations: combinedViolations } as AxeResults,
    options: {
      projectKey: 'Citations Management System',
      outputDir: 'accessibility-report',
      reportFileName: 'accessibility-report.html',
    },
  });

  fs.writeFileSync('accessibility-report/accessibility-report.html', htmlReport);
  console.log(`[A11y] Report: accessibility-report/accessibility-report.html`);
  console.log(`[A11y] Total violations: ${combinedViolations.length}`);
}
```

---

## 6. Axe in CI — Fail Fast, Notify Clearly

```yaml
# .github/workflows/playwright.yml — add accessibility job
accessibility-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '20', cache: 'npm' }
    - run: npm ci
    - run: npx playwright install chromium --with-deps

    - name: Run accessibility tests
      run: npx playwright test --grep "@a11y" --reporter=html
      env:
        CI: true

    - name: Upload accessibility report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: accessibility-report
        path: |
          playwright-report/
          accessibility-report/
        retention-days: 60  # keep longer — compliance evidence
```

---

## 7. The A11y Debt Strategy — Start Where You Are

Most enterprise apps have existing accessibility violations. Don't try to fix everything at once:

```typescript
// accessibility/known-violations.ts
// Document known violations that are being tracked but not yet fixed.
// This prevents "new violations" from being hidden by existing noise.

export const KnownViolations = {
  // Format: ruleId → number of known occurrences → review date
  'color-contrast': {
    count: 12,
    ticket: 'TICKET-8821',
    reviewDate: '2026-07-01',
    reason: 'D365 Fluent UI theme — waiting for Microsoft update',
  },
  'region': {
    count: 4,
    ticket: 'TICKET-8900',
    reviewDate: '2026-06-01',
    reason: 'Legacy JSP pages — refactor in progress',
  },
} as const;

// In your assertion:
async function assertA11yWithDebtTracking(results: AxeResults): Promise<void> {
  for (const violation of results.violations) {
    const known = KnownViolations[violation.id as keyof typeof KnownViolations];
    if (known) {
      // Violation is known — check count hasn't grown
      if (violation.nodes.length > known.count) {
        throw new Error(
          `[A11y Debt] '${violation.id}' violation COUNT GREW: ` +
          `was ${known.count}, now ${violation.nodes.length}. ` +
          `Ticket: ${known.ticket}. NEW violations were introduced.`
        );
      }
      console.warn(`[A11y Debt] Known: ${violation.id} (${violation.nodes.length}/${known.count}) — ${known.ticket}`);
    } else {
      // Unknown violation — fail immediately
      throw new Error(`[A11y] NEW violation: ${violation.id}: ${violation.description}`);
    }
  }
}
// This way: existing violations don't block CI, but new violations do.
// The count-grows check catches regressions even in known categories.
```

---

## ðŸ‹ï¸ Practice Challenges

### Challenge 1 [MCQ] — Which axe Rule?

A D365 form has an input for "Customer Name" with a visible label next to it, but the `<input>` has no `id`, `for`, `aria-label`, or `aria-labelledby`. Which axe rule fires?

A) `color-contrast` — the label text has insufficient contrast  
B) `label` — form input has no associated label  
C) `region` — form is not wrapped in a landmark region  
D) `aria-required-attr` — input is missing required ARIA attribute  

<details><summary>Answer</summary>

**B** — `label` rule (WCAG 1.3.1, 4.1.2). The `label` element must be programmatically associated with its input using `for`/`id` pairing, or `aria-label`, or `aria-labelledby`. A visible label with no programmatic connection is invisible to screen readers. The user hears "edit text" — no indication of what to type.

Fix options:
```html
<!-- Option 1: for/id pair -->
<label for="customerName">Customer Name</label>
<input id="customerName" type="text" />

<!-- Option 2: aria-label -->
<input type="text" aria-label="Customer Name" />

<!-- Option 3: aria-labelledby (when label is a sibling element) -->
<span id="nameLabel">Customer Name</span>
<input type="text" aria-labelledby="nameLabel" />
```
</details>

---

**Key References:**
- [github.com/dequelabs/axe-core](https://github.com/dequelabs/axe-core) — axe-core engine (MPL 2.0)
- [dequeuniversity.com/rules/axe](https://dequeuniversity.com/rules/axe/) — every rule explained
- [w3.org/WAI/WCAG21/quickref](https://www.w3.org/WAI/WCAG21/quickref/) — WCAG 2.1 quick reference
- [web.dev/accessibility](https://web.dev/accessibility/) — Google accessibility guide

---

### Challenge 2 [Spot the A11y Bug]

Your page has this markup for a search filter dropdown:
```html
<div class="dropdown-container">
  <div class="dropdown-toggle" onclick="toggleDropdown()">Filter by Status ▼</div>
  <ul class="dropdown-menu" style="display:none">
    <li onclick="selectStatus('PAID')">Paid</li>
    <li onclick="selectStatus('PENDING')">Pending</li>
  </ul>
</div>
```
axe reports 3 violations on this component. What are they?

<details><summary>Answer</summary>

1. **`button-name` / `role` violation**: The `<div class="dropdown-toggle">` acts as a button (has onclick, is interactive) but is not a `<button>` and has no `role="button"`. Screen readers won't announce it as interactive.

2. **`listitem` / `keyboard` violation**: The `<li>` elements have onclick handlers but are not keyboard-operable. Users who don't use a mouse can't access them. Fix: use `<button>` inside `<li>`, or add `tabindex="0"` and keyboard event handlers.

3. **`aria-expanded` missing**: The dropdown toggle doesn't communicate its open/closed state. Screen readers can't tell if the menu is expanded. Fix:
```html
<button
  class="dropdown-toggle"
  aria-expanded="false"
  aria-haspopup="listbox"
  aria-controls="statusDropdown"
  onclick="toggleDropdown(this)"
>
  Filter by Status
</button>
<ul id="statusDropdown" role="listbox" aria-label="Filter by Status" hidden>
  <li role="option" onclick="selectStatus('PAID')" tabindex="0" onkeydown="handleKey(event, 'PAID')">Paid</li>
  <li role="option" onclick="selectStatus('PENDING')" tabindex="0" onkeydown="handleKey(event, 'PENDING')">Pending</li>
</ul>
```
Set `aria-expanded="true"` when open, `aria-expanded="false"` when closed.
</details>

---

### Challenge 3 [A11y Debt Strategy]

Your app has 47 axe violations. Your manager says "fix them all this sprint." Why is this the wrong approach, and what do you propose instead?

<details><summary>Answer</summary>

**Why "fix all" is wrong:**
- 47 violations likely span multiple teams/components. You can't own all of them.
- Some violations are in third-party libraries (D365 Fluent UI, Microsoft components) that YOU cannot fix.
- Fixing all 47 at once risks introducing new bugs while rushing.
- Not all violations have the same user impact — a `color-contrast` violation on a low-traffic page is less urgent than a `label` violation on the main login form.

**Proposed approach — A11y Debt Strategy:**

1. **Triage by impact**: Separate `critical` + `serious` (fix immediately) from `moderate` + `minor` (schedule).

2. **Classify ownership**: Which violations are in your code? Which are third-party (Fluent UI)?  Add third-party violations to `KnownViolations` and exclude them from blocking CI.

3. **Fix by page priority**: Fix violations on high-traffic pages first (login, main dashboard, primary workflows).

4. **Freeze the count**: Add the `assertA11yWithDebtTracking` function to CI. This doesn't block on existing violations but DOES block if any violation COUNT GROWS. This prevents regression while you fix the backlog.

5. **Set milestones**: Critical violations → 1 sprint. Serious → 1 quarter. Moderate → 6 months.
</details>

### Challenge 4 [Write It Yourself — Custom axe Configuration]

Your application uses a third-party chat widget (`#vendor-chat-iframe`) that has terrible color contrast. You cannot fix it because it's vendor code. Write an `AxeBuilder` Playwright test that analyzes the page but entirely ignores the `#vendor-chat-iframe` element, AND globally disables the `color-contrast` rule just in case.

<details><summary>Answer</summary>

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Dashboard is accessible except for vendor widgets', async ({ page }) => {
  await page.goto('/dashboard');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    // 1. Ignore the specific element entirely (all rules)
    .exclude('#vendor-chat-iframe')
    
    // 2. Disable a specific rule globally across the whole page
    .disableRules(['color-contrast'])
    
    // 3. Only run WCAG 2.1 AA rules
    .withTags(['wcag21aa'])
    
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

**SDE Principle**: Tooling pragmatism. In the real world, "zero violations" is hard when relying on third-party integrations. Building surgical exclusions prevents your team from turning off the *entire* a11y test suite out of frustration.

</details>

---

### Challenge 5 [Spot the Bug — Timing and A11y]

```typescript
test('Citation detail modal is accessible', async ({ page }) => {
  await page.goto('/citations');
  
  // Click the row to open the modal
  await page.click('.citation-row:has-text("CIT-001")');
  
  // Run axe immediately
  const results = await new AxeBuilder({ page }).analyze();
  
  expect(results.violations).toEqual([]);
});
```

The test consistently passes locally but randomly fails in CI, or it passes in CI but misses glaring accessibility violations in the modal. Why?

<details><summary>Answer</summary>

**Bug**: Axe analyzes the DOM *at the exact millisecond* it is invoked. 

When you `page.click()`, Playwright fires the click event. But the React/Vue modal might take 100ms to animate in, fetch data, and render its content. If you run `AxeBuilder` instantly, axe scans the page *before the modal is fully visible in the DOM*. 

It passes because it's scanning the background page, completely missing the modal.

**Fix**: Always wait for the specific UI state to settle before running axe.

```typescript
test('Citation detail modal is accessible', async ({ page }) => {
  await page.goto('/citations');
  
  await page.click('.citation-row:has-text("CIT-001")');
  
  // Wait for the modal animation to finish and content to render
  await page.waitForSelector('.modal-content', { state: 'visible' });
  
  // Optional: if the modal loads data, wait for the data
  await expect(page.locator('.modal-amount')).toContainText('£');
  
  // NOW analyze the settled DOM
  const results = await new AxeBuilder({ page })
    .include('.modal-content') // Optimization: only scan the modal!
    .analyze();
  
  expect(results.violations).toEqual([]);
});
```

**SDE Insight**: The DOM is highly mutable. Accessibility scanning, like visual regression testing, requires orchestrating the test runner to wait for exact application states before asserting.

</details>

---
**Navigation**: [← Chapter 38: Contract Testing](./38_Contract_Testing_Pact.md) | [Index](../00_INDEX.md) | [→ Chapter 40: Security Test Automation](./40_Security_Testing_OWASP.md)
