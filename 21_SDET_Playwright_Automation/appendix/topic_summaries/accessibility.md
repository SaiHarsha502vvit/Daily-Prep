# Accessibility Testing — axe-core

> **Canonical lesson:** [39 Accessibility Testing axe core](../../07_Specialised_Testing/39_Accessibility_Testing_axe_core.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> Specialised reference for WCAG 2.1/2.2 compliance testing via `@axe-core/playwright`. The POUR principles, what axe catches vs misses, keyboard-only flows, screen reader fundamentals, color contrast, focus management, and the "100% axe-clean ≠ accessible" trap.

---

## Table of contents

1. [Why accessibility matters](#1-why)
2. [WCAG 2.2 — A, AA, AAA](#2-wcag)
3. [The POUR principles](#3-pour)
4. [`@axe-core/playwright` setup](#4-axe-setup)
5. [What axe catches (about 30%)](#5-axe-catches)
6. [What axe misses (the other 70%)](#6-axe-misses)
7. [Keyboard-only flows](#7-keyboard)
8. [Focus trap testing (modals)](#8-focus-trap)
9. [Color contrast](#9-color-contrast)
10. [Screen reader simulation](#10-screen-reader)
11. [aria-snapshot for regression](#11-aria-snapshot)
12. [Accessibility debt tracking](#12-debt)
13. [Common production failures](#13-common-failures)
14. [Anti-patterns](#14-anti-patterns)

---

## 1. Why

Beyond compliance:

- 15% of people have disabilities (WHO).
- Accessibility law: ADA, Section 508 (US), EAA (EU), Equality Act (UK).
- Lawsuit risk: 4,000+ ADA-related lawsuits filed yearly in the US.
- SEO: most a11y improvements also improve SEO.
- Better UX for everyone: keyboard nav, screen readers, larger touch targets.

---

## 2. WCAG

Three levels:

| Level | Use when                                                   |
| ----- | ---------------------------------------------------------- |
| A     | Bare minimum; most apps must hit this                      |
| AA    | Industry standard; legal requirement in many jurisdictions |
| AAA   | Aspirational; rarely fully achievable                      |

Default target: **WCAG 2.2 AA**.

---

## 3. POUR

| Principle          | Means                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **Perceivable**    | Content is presentable in ways users can perceive (alt text, captions, sufficient contrast) |
| **Operable**       | UI components are operable (keyboard accessible, enough time, no seizures)                  |
| **Understandable** | Information is readable and predictable                                                     |
| **Robust**         | Content works with assistive technology (semantic HTML, ARIA)                               |

Every test should target one of these.

---

## 4. axe setup

```bash
npm i -D @axe-core/playwright
```

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage is accessible", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### 4.1 Scoping the scan

```typescript
const results = await new AxeBuilder({ page })
  .include("main") // scan only inside <main>
  .exclude(".third-party-widget") // exclude vendor widget
  .analyze();
```

### 4.2 Rule selection

```typescript
const results = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa"]) // standards
  .withRules(["color-contrast", "image-alt"]) // specific rules only
  .disableRules(["region"]) // disable a rule
  .analyze();
```

Common tags:

- `wcag2a`, `wcag2aa`, `wcag2aaa` — WCAG 2.0 levels
- `wcag21a`, `wcag21aa` — WCAG 2.1
- `wcag22a`, `wcag22aa` — WCAG 2.2
- `best-practice` — beyond WCAG
- `experimental` — newer rules

### 4.3 The result shape

```typescript
{
  violations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      tags: ['wcag2aa', 'wcag143'],
      description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
      nodes: [
        {
          html: '<button class="cta">Sign up</button>',
          target: ['.cta'],
          failureSummary: 'Fix any of the following:\n  Element has insufficient color contrast of 2.99 (foreground color: #ffffff, background color: #999999, font size: 14.0pt (18.6667px), font weight: normal). Expected contrast ratio of 4.5:1',
        },
      ],
    },
  ],
  passes: [/* ... */],
  incomplete: [/* needs review */],
  inapplicable: [/* not relevant */],
}
```

Impact levels: `minor`, `moderate`, `serious`, `critical`. For CI, fail on `serious`+ at minimum.

### 4.4 The fixture pattern

```typescript
const test = base.extend<{ runA11yScan: () => Promise<void> }>({
  runA11yScan: async ({ page }, use) => {
    const scan = async () => {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2aa"])
        .analyze();
      const serious = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact!),
      );
      expect(
        serious,
        JSON.stringify(
          serious.map((v) => v.id),
          null,
          2,
        ),
      ).toEqual([]);
    };
    await use(scan);
  },
});

test("checkout page is accessible", async ({ page, runA11yScan }) => {
  await page.goto("/checkout");
  await runA11yScan();
});
```

---

## 5. axe catches (about 30%)

axe reliably catches:

| Category                    | Examples                                   |
| --------------------------- | ------------------------------------------ |
| Missing alt text            | `<img>` without `alt`                      |
| Insufficient color contrast | text-bg ratio too low                      |
| Missing form labels         | `<input>` not associated with `<label>`    |
| Empty headings              | `<h1></h1>`                                |
| Improperly nested headings  | `<h1>` then `<h4>`                         |
| Missing landmarks           | No `<main>` or no `<nav>`                  |
| Tab order issues            | Negative tabindex without explanation      |
| ARIA misuse                 | `role="button"` without `aria-label`       |
| Color-only information      | Status indicated by color alone            |
| Missing language            | `<html>` without `lang`                    |
| Inaccessible form controls  | Custom dropdowns without keyboard handlers |
| Improper list structure     | `<li>` outside `<ul>`/`<ol>`               |

### 5.1 The "best-practice" tag

Beyond WCAG, axe has best-practice rules like:

- Use `<button>` not `<div onclick>`.
- Use semantic HTML.
- Avoid `target="_blank"` without warning.

Enable with `.withTags(['best-practice'])`.

---

## 6. axe misses (the other 70%)

axe is automated — it can't test:

| Issue                                                               | Why not                       |
| ------------------------------------------------------------------- | ----------------------------- |
| Screen reader actually announces correctly                          | Requires real SR (NVDA, JAWS) |
| Keyboard nav order makes sense                                      | Requires human judgment       |
| Focus visible after keyboard navigation                             | Subjective (style)            |
| Content "makes sense" when read linearly                            | Semantic                      |
| Heading hierarchy is logical                                        | Semantic                      |
| Form labels are descriptive ("Email" vs "Email address (required)") | Subjective                    |
| Animations don't trigger seizures                                   | Requires temporal analysis    |
| Mobile touch targets are large enough                               | Layout-dependent              |
| Error messages help users                                           | UX judgment                   |
| Captions are accurate                                               | Content review                |

For the 70% axe misses: **manual testing with assistive tech**. There's no shortcut.

### 6.1 The "100% axe-clean" trap

A site passing all axe rules can still be unusable:

- Buttons that don't have keyboard handlers.
- Modals without focus trap.
- Error messages only shown in red (screen reader doesn't know).
- Auto-playing videos with no pause.

Don't claim "WCAG compliant" because axe passes. axe is the floor, not the ceiling.

---

## 7. Keyboard-only

Test the workflow without a mouse.

### 7.1 Tab navigation

```typescript
test("keyboard navigation through checkout", async ({ page }) => {
  await page.goto("/checkout");

  // Tab to first focusable
  await page.keyboard.press("Tab");
  let focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(focused).toBe("INPUT");

  // Tab through fields in order
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  focused = await page.evaluate(() =>
    document.activeElement?.getAttribute("name"),
  );
  expect(focused).toBe("email");
});
```

### 7.2 Asserting focus

```typescript
await expect(page.locator(":focus")).toBe(page.getByLabel("Email"));
```

Or:

```typescript
const focused = await page.evaluate(() =>
  document.activeElement?.getAttribute("aria-label"),
);
expect(focused).toBe("Email address");
```

### 7.3 Skip links

```typescript
test("skip link works", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.locator(":focus");
  await expect(skipLink).toContainText("Skip to main content");

  await page.keyboard.press("Enter");
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(focused).toBe("MAIN"); // or whatever the target
});
```

### 7.4 Arrow keys in menus

```typescript
test("arrow keys navigate menu", async ({ page }) => {
  await page.getByRole("button", { name: "Open menu" }).click();

  await page.keyboard.press("ArrowDown");
  let focused = await page.evaluate(() => document.activeElement?.textContent);
  expect(focused).toBe("First item");

  await page.keyboard.press("ArrowDown");
  focused = await page.evaluate(() => document.activeElement?.textContent);
  expect(focused).toBe("Second item");
});
```

### 7.5 Escape closes modal

```typescript
await page.getByRole("button", { name: "Edit" }).click();
await expect(page.getByRole("dialog")).toBeVisible();

await page.keyboard.press("Escape");
await expect(page.getByRole("dialog")).not.toBeVisible();
```

---

## 8. Focus trap

A modal must trap focus — Tab cycles WITHIN the modal, not out to the page behind.

```typescript
test("modal traps focus", async ({ page }) => {
  await page.getByRole("button", { name: "Edit" }).click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();

  const focusableInModal = modal.locator(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const count = await focusableInModal.count();

  // Tab through all focusable; ensure focus stays in modal
  for (let i = 0; i <= count; i++) {
    await page.keyboard.press("Tab");
    const inModal = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog?.contains(document.activeElement);
    });
    expect(inModal, `Focus left modal at iteration ${i}`).toBe(true);
  }
});
```

---

## 9. Color contrast

axe catches contrast failures. To check programmatically:

```typescript
const ratio = await page.locator(".btn-primary").evaluate((el) => {
  const styles = getComputedStyle(el);
  const fg = styles.color;
  const bg = styles.backgroundColor;
  // contrast ratio calculation
  // (use a library; this is illustrative)
  return calculateContrastRatio(fg, bg);
});
expect(ratio).toBeGreaterThan(4.5); // AA for normal text
```

For visual tests of contrast, screen-capture against known-color background:

```typescript
// Capture the button, save, manually inspect
await expect(page.locator(".btn-primary")).toHaveScreenshot("btn-primary.png");
```

---

## 10. Screen reader

Playwright can't drive a real screen reader (NVDA, JAWS, VoiceOver). But:

### 10.1 The accessibility tree

```typescript
// page.accessibility.snapshot() has been REMOVED from Playwright (undefined in 1.60).
// ariaSnapshot() is the current API — it returns a compact YAML tree.
const snapshot = await page.locator("body").ariaSnapshot();
console.log(snapshot);
// - form "Login":
//   - text: Email
//   - textbox "Email"
//   - button "Sign in"
```

Returns the browser's interpretation of the page for assistive tech. What a screen reader would announce.

### 10.2 Asserting on the tree

```typescript
test("login form is announced correctly", async ({ page }) => {
  await page.goto("/login");

  // Partial match: only the listed nodes must be present, in this order.
  await expect(page.locator("form")).toMatchAriaSnapshot(`
    - textbox "Email"
    - button "Sign in"
  `);

  // The aria snapshot does not list "required", so check that state directly.
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveJSProperty("required", true);
});

function findInTree(node: any, predicate: (n: any) => boolean): any {
  if (predicate(node)) return node;
  for (const child of node.children ?? []) {
    const result = findInTree(child, predicate);
    if (result) return result;
  }
  return null;
}
```

### 10.3 What this doesn't catch

- Whether NVDA/JAWS use the right pronunciation.
- Whether the order announced makes sense.
- Whether navigation gestures work.

For that: manual testing with real SR. Allocate time per release.

---

## 11. aria-snapshot

Since v1.48: `toMatchAriaSnapshot` captures the accessibility tree as a string.

```typescript
test("matches aria snapshot", async ({ page }) => {
  await page.goto("/");
  await expect(page).toMatchAriaSnapshot(`
    - heading "Welcome" [level=1]
    - navigation:
      - link "Home"
      - link "About"
    - main:
      - heading "Latest products" [level=2]
      - list:
        - listitem:
          - link "Product 1"
        - listitem:
          - link "Product 2"
  `);
});
```

Like visual regression but for the SEMANTIC tree. Catches regressions where the visible layout is fine but the a11y tree broke (e.g., heading level changed).

---

## 12. Debt

Real apps have accessibility violations. Track them:

```typescript
// a11y-debt.ts
const KNOWN_VIOLATIONS = [
  {
    id: "color-contrast",
    target: ".legacy-button",
    addedAt: "2025-01-15",
    ticketId: "A11Y-123",
  },
];

test("accessibility", async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const unexpected = results.violations.filter(
    (v) =>
      !KNOWN_VIOLATIONS.some(
        (k) =>
          k.id === v.id && v.nodes.some((n) => n.target.join() === k.target),
      ),
  );
  expect(unexpected).toEqual([]);
});
```

Catches NEW violations while accepting known ones. Each known item has a ticket assigned.

---

## 13. Common failures

### Failure 1 — axe reports "color-contrast" in headless that doesn't appear headed

**Cause:** Headless can render fonts slightly differently. Contrast can be miscalculated for thin font weights.
**Fix:** Tweak font weight; verify with visual inspection.

### Failure 2 — Tests pass but real SR can't navigate

**Cause:** axe doesn't simulate SR. Need manual testing.
**Fix:** Pair automated tests with manual SR audit.

### Failure 3 — `withTags(['wcag2a'])` reports rules from wcag22aa

**Cause:** axe's tags overlap.
**Fix:** Read axe-core's docs; understand the tag taxonomy.

### Failure 4 — Disabled rule comes back

**Cause:** axe rule version update introduced a new variant.
**Fix:** Re-disable; track in debt.

---

## 14. Anti-patterns

| ❌                                          | ✅                              |
| ------------------------------------------- | ------------------------------- |
| "We're WCAG compliant because axe passes"   | Manual testing required         |
| Ignore "incomplete" results                 | Investigate; either pass or fix |
| Scan only homepage                          | Scan every page type            |
| Apply same rules to admin and public pages  | Risk-based rule selection       |
| Block all PRs on a11y failures              | Tier by impact                  |
| Ignore keyboard nav testing                 | Test keyboard flows explicitly  |
| Treat a11y as one engineer's responsibility | Embed in PR checklist           |

---

## Cross-references

- Locator priority (semantic first): [`../reference/03_locators.md`](../quick_reference/03_locators.md)
- ARIA snapshots and roles: [`../reference/03_locators.md §4`](../quick_reference/03_locators.md#4-getbyrole)
- Performance (Lighthouse a11y): [`./performance.md`](./performance.md)
- Visual regression (color tests): [`./visual_regression.md`](./visual_regression.md)
