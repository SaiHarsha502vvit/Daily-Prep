# Accessibility (A11Y) Testing Module

Provides automated accessibility testing using axe-core integrated with Playwright.

## Overview

This module runs axe-core accessibility scans on pages and asserts zero violations, ensuring your application meets WCAG accessibility standards.

## Prerequisites

Install `@axe-core/playwright` for accessibility scanning:

```bash
npm install @axe-core/playwright --save-dev
```

If not installed, the runner will throw a helpful error with installation instructions.

## Usage

### Running an Accessibility Scan

```typescript
import { runAxe, assertNoViolations } from '../../a11y/runner';

test('page is accessible', async ({ page }) => {
  await page.goto('/some-page');
  const results = await runAxe(page);
  assertNoViolations(results);
});
```

### Filtering by Tags

```typescript
const results = await runAxe(page, { tags: ['wcag2a', 'wcag2aa'] });
```

Common axe-core tags:

- `wcag2a` - WCAG 2.0 Level A
- `wcag2aa` - WCAG 2.0 Level AA
- `wcag21a` - WCAG 2.1 Level A
- `wcag21aa` - WCAG 2.1 Level AA

### Scanning Specific Containers

```typescript
// Scan a specific element instead of the whole page
const container = page.locator('#main-content');
const results = await runAxe(await container.elementHandle());
```

## Test Tags

Use `@a11y` tag to run only accessibility tests:

```bash
npx playwright test --grep @a11y
```

## Interpreting Results

The `assertNoViolations` function will throw with a detailed report if violations are found:

```
Found 3 accessibility violation(s):

- [serious] color-contrast: Elements must have sufficient color contrast
    Target: #username, .input-field
    HTML: <input type="text" id="username" />

- [critical] region: Regions should be landmarks
    Target: div.wrapper
    HTML: <div class="wrapper">...</div>
```

Each violation includes:

- **Impact level**: critical, serious, moderate, minor
- **Rule ID**: e.g., `color-contrast`, `region`
- **Description**: What the issue is
- **Target**: CSS selector(s) affected
- **Help URL**: Link to axe-core documentation

## Adding Custom Rules

Configure axe-core options in `runner.ts` for custom rules and filters. See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md) for options.
