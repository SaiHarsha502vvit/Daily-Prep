# Locators

> **Canonical lesson:** [02 Enterprise Locators XPath](../../01_Foundations/02_Enterprise_Locators_XPath.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> The authoritative reference for finding elements in any DOM — clean React apps, D365 Fluent UI, Salesforce LWC, legacy JSP/ASPX. Internal mechanics of Playwright's locator engine, every getter, every filter, every cross-browser quirk, every production failure mode.

---

## Table of contents

1. [The DOM as a problem space](#1-the-dom-as-a-problem-space)
2. [Locator vs ElementHandle — what's actually returned](#2-locator-vs-elementhandle)
3. [The priority hierarchy](#3-the-priority-hierarchy)
4. [`getByRole` — internal mechanics and full role reference](#4-getbyrole)
5. [`getByText`, `getByLabel`, `getByPlaceholder`, `getByAltText`, `getByTitle`](#5-the-other-semantic-getters)
6. [`getByTestId` and `testIdAttribute`](#6-getbytestid)
7. [CSS selectors — Playwright's extensions](#7-css-selectors)
8. [XPath — when to reach for it](#8-xpath)
9. [Filtering — `filter()`, `and`, `or`](#9-filtering)
10. [Composing — `first`, `last`, `nth`, chained `locator()`](#10-composing)
11. [Strict mode — Playwright's "exactly one" contract](#11-strict-mode)
12. [Lazy evaluation — when the DOM is actually queried](#12-lazy-evaluation)
13. [Auto-waiting — the 5 actionability checks](#13-auto-waiting)
14. [Shadow DOM](#14-shadow-dom)
15. [IFrames](#15-iframes)
16. [D365 / Fluent UI cookbook](#16-d365--fluent-ui-cookbook)
17. [Salesforce LWC cookbook](#17-salesforce-lwc-cookbook)
18. [Cross-browser role differences](#18-cross-browser-role-differences)
19. [Performance — selector cost](#19-performance)
20. [Common production failures](#20-common-production-failures)
21. [Anti-pattern catalog](#21-anti-pattern-catalog)

---

## 1. The DOM as a problem space

Every HTML page is a tree. The browser parses HTML into a Document Object Model — a tree of `Element` nodes. Your locator is a path query over this tree.

```
document
└── html
    ├── head
    └── body
        └── div.crm-container
            ├── header.ms-CommandBar
            │   └── button[data-id="newRecord"]  "New Citation"
            └── main
                └── div.ms-DetailsList
                    ├── div.ms-DetailsList-headerWrapper
                    │   └── div[role="row"]
                    │       ├── div[role="columnheader"] "Citation ID"
                    │       └── div[role="columnheader"] "Status"
                    └── div.ms-DetailsList-contentWrapper
                        ├── div[role="row"][aria-rowindex="1"]
                        │   ├── div[role="gridcell"] "CIT-001"
                        │   └── div[role="gridcell"] "PENDING"
                        └── div[role="row"][aria-rowindex="2"]
                            ├── div[role="gridcell"] "CIT-002"
                            └── div[role="gridcell"] "PAID"
```

### 1.1 The mental model

```
1. Find an ANCHOR — an element with stable, unique identifying properties
   (a data-testid, a known text label, a stable aria attribute)

2. NAVIGATE from the anchor to your target
   (up to a common ancestor, then down to the target — or filter the anchor's descendants)

3. SCOPE the search — never query the whole document if you can query a subtree
   (page.locator('.citation-grid').locator('[role="row"]') searches only inside the grid)
```

### 1.2 What "stable" actually means

A stable locator survives:

| Change                                                 | Stable locator must…                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Developer renames `.btn-primary` to `.btn-cta`         | …not depend on class names that describe styling                                                |
| Marketing changes button text "Save" → "Save Changes"  | …allow regex matching OR use a non-text anchor (data-testid, aria-label)                        |
| DOM reorder swaps two sibling divs                     | …not depend on `:nth-child` for non-positional data                                             |
| React reconciliation re-mounts a component             | …not hold an `ElementHandle` reference (Playwright Locators are lazy and immune to this)        |
| Designer adds a wrapper `<div>` around the input       | …not depend on `parent > child` direct descendant when the parent isn't semantically meaningful |
| A11y team adds `role="region"` for screen reader users | …respect ARIA, ideally use ARIA as the primary anchor                                           |
| A/B test adds a new variant card                       | …scope to a known container (e.g., `data-testid="primary-card"`)                                |

A locator that survives all of these is rare. A locator that survives the top 3 is good. Anything that breaks on the first three needs to be rewritten.

### 1.3 The unit cost of every test maintenance day

Industry-typical numbers:

- Each broken locator costs ~30 min to diagnose, fix, and verify.
- A 500-test suite with 5% locator breakage per sprint = 25 tests = 12.5 hours.
- Over a year (26 sprints) = 325 hours = 8 weeks of one engineer's time.

Treating locator quality as a first-class concern returns 80% of that.

---

## 2. Locator vs ElementHandle

Playwright has two element representations. Understanding which is which is critical.

### 2.1 Locator — the lazy description

```typescript
const button: Locator = page.getByRole("button", { name: "Save" });
```

- Created synchronously.
- No browser round-trip on creation.
- Holds a SELECTOR description, not a reference to an element.
- Every action re-queries the DOM at the current moment.
- Survives DOM re-renders automatically.
- The default. Use this everywhere unless you have a specific reason not to.

### 2.2 ElementHandle — the eager reference (legacy)

```typescript
const buttonHandle: ElementHandle = await page.$('button[data-id="save"]');
```

- `$` and `$$` are LEGACY APIs.
- Created with an immediate browser query.
- Holds a JS handle to a SPECIFIC DOM element in the browser process.
- If the element is removed from the DOM (React unmount, etc.), the handle becomes detached — every action throws.
- The same staleness problem Selenium has.

### 2.3 Decision

Always prefer `Locator`. The only case for `ElementHandle`:

- You need to pass an element to `page.evaluate(el => ...)` and use it inside browser-side JavaScript.

```typescript
const handle = await page.locator(".chart").elementHandle();
await page.evaluate((el) => {
  el.scrollIntoView({ behavior: "smooth" });
}, handle);
await handle.dispose(); // ALWAYS dispose handles to avoid memory leaks
```

Even here, you can often avoid `ElementHandle` by using `locator.evaluate()`:

```typescript
await page
  .locator(".chart")
  .evaluate((el) => el.scrollIntoView({ behavior: "smooth" }));
```

This handles the handle for you and disposes after.

---

## 3. The priority hierarchy

Pick the highest priority that reliably resolves your element.

| #   | Locator                                                            | Stability                | When it works                                          | When it doesn't                                              |
| --- | ------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------ | ------------------------------------------------------------ |
| 1   | `getByRole('button', { name: 'Save' })`                            | Highest                  | App has semantic HTML or ARIA                          | Pure `<div>` soup with no roles                              |
| 2   | `getByTestId('submit-btn')`                                        | High                     | App ships `data-testid` (or your configured attribute) | Apps where you can't get devs to add test IDs                |
| 3   | `getByLabel('Email address')`                                      | High                     | Form inputs with `<label>`                             | Inputs labelled via `aria-label` only (covered by getByRole) |
| 4   | `getByPlaceholder('Search...')`                                    | Medium                   | Inputs with placeholder                                | Placeholder changes with marketing copy                      |
| 5   | `getByText('Order confirmed', { exact: true })`                    | Medium                   | Visible text uniquely identifies                       | Text changes; multiple elements with same text               |
| 6   | `getByAltText('Company logo')`                                     | Medium                   | Images / icons with alt text                           | Decorative images with empty alt                             |
| 7   | `getByTitle('Edit user')`                                          | Medium                   | Elements with `title` attribute (tooltips)             | `title` is not always present; obsolete in modern UIs        |
| 8   | `page.locator('[data-automation-key="fullname"]')`                 | High (if app ships them) | D365, Salesforce, custom enterprise apps               | Generic apps                                                 |
| 9   | `page.locator('.btn-primary.large')`                               | Low                      | Last resort for clean DOMs                             | Always brittle                                               |
| 10  | `page.locator('//div[contains(@class,"row")][.//text()="Alice"]')` | Low                      | Tree navigation that CSS can't express                 | When CSS can express it (which is almost always)             |

### 3.1 The "test-driven hierarchy" alternative

Some teams prefer a different priority based on test-ID coverage:

1. `getByTestId` (most stable in practice, if your team commits to adding them)
2. `getByRole` (semantic, accessible)
3. `getByLabel`, `getByText` (user-visible)
4. CSS / XPath (only when nothing else works)

Either ordering is defensible. The principle is: **never start with brittle selectors when stable ones exist**.

### 3.2 Why getByRole is preferred over getByTestId in many teams

`getByRole` validates accessibility along the way. If `getByRole('button', { name: 'Save' })` fails, the button has either:

- Wrong role (probably `<div onclick>`, an accessibility bug)
- Wrong accessible name (probably no label, an accessibility bug)
- Or doesn't exist

Each of those is worth fixing. `getByTestId` just blindly hooks an element — it ignores accessibility entirely. Teams optimising for screen-reader users prefer `getByRole`.

---

## 4. `getByRole`

The workhorse. Backed by the accessibility tree, not the DOM tree.

### 4.1 What "role" means

Every HTML element has a default ARIA role. Examples:

| HTML                      | Implicit role                 | Notes                                                       |
| ------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `<button>`                | `button`                      |                                                             |
| `<a href>`                | `link`                        | `<a>` without href has no role                              |
| `<input type="text">`     | `textbox`                     |                                                             |
| `<input type="password">` | `textbox`                     | Yes, same as text input                                     |
| `<input type="email">`    | `textbox`                     |                                                             |
| `<input type="search">`   | `searchbox`                   |                                                             |
| `<input type="number">`   | `spinbutton`                  |                                                             |
| `<input type="radio">`    | `radio`                       |                                                             |
| `<input type="checkbox">` | `checkbox`                    |                                                             |
| `<input type="submit">`   | `button`                      |                                                             |
| `<input type="file">`     | (no role)                     | Treat as `[type="file"]`                                    |
| `<select>`                | `combobox`                    |                                                             |
| `<select multiple>`       | `listbox`                     |                                                             |
| `<textarea>`              | `textbox`                     |                                                             |
| `<h1>` – `<h6>`           | `heading`                     | Use `{ level: N }` to specify                               |
| `<table>`                 | `table`                       |                                                             |
| `<tr>`                    | `row`                         | Only inside `<table>`                                       |
| `<th>`                    | `columnheader` or `rowheader` |                                                             |
| `<td>`                    | `cell`                        |                                                             |
| `<nav>`                   | `navigation`                  |                                                             |
| `<main>`                  | `main`                        |                                                             |
| `<aside>`                 | `complementary`               |                                                             |
| `<header>`                | `banner`                      | Only if direct child of body                                |
| `<footer>`                | `contentinfo`                 | Only if direct child of body                                |
| `<form>`                  | `form`                        | Only if labelled (`aria-label` or `<form aria-labelledby>`) |
| `<dialog>`                | `dialog`                      |                                                             |
| `<details>`/`<summary>`   | `group`/`button`              | `<summary>` is button on Firefox, no role on Chromium       |
| `<ul>`/`<ol>`             | `list`                        |                                                             |
| `<li>`                    | `listitem`                    |                                                             |
| `<img alt="…">`           | `img`                         | Empty alt → no role (decorative)                            |

You can override the implicit role with an explicit one:

- `<div role="dialog">` — div is now a dialog
- `<div role="alert">` — div is now an alert

### 4.2 Accessible name calculation

The "name" in `getByRole('button', { name: 'Save' })` is the element's **accessible name**, computed by an algorithm specified in WAI-ARIA. The sources, in priority order:

1. `aria-labelledby` pointing to another element's text
2. `aria-label` attribute value
3. The element's `<label>` (for form controls)
4. The element's own text content
5. `title` attribute
6. (For images) `alt` attribute
7. (For form controls without labels) the `placeholder` (Chrome only — fallback)

A button with no label, no `aria-label`, no inner text, no `title`, and no related `<label>` has NO accessible name. Screen readers say nothing. `getByRole('button')` without a `name` still works, but with multiple unlabelled buttons strict mode will fire.

### 4.3 The `getByRole` options

```typescript
page.getByRole("button", {
  name: "Save", // string OR RegExp
  exact: false, // when name is string — substring vs exact match
  level: 2, // headings only (1–6)
  pressed: true, // toggle buttons — aria-pressed state
  expanded: true, // disclosure buttons — aria-expanded
  selected: false, // tabs, options — aria-selected
  checked: "mixed", // checkboxes — true | false | 'mixed'
  disabled: false, // aria-disabled or HTML disabled attribute
  includeHidden: false, // by default, only visible elements
});
```

### 4.4 The complete role list

ARIA defines ~80 roles, but only ~40 are commonly used. Playwright's TypeScript types accept all of them:

```
alert, alertdialog, application, article, banner, blockquote, button,
caption, cell, checkbox, code, columnheader, combobox, complementary,
contentinfo, definition, deletion, dialog, directory, document, emphasis,
feed, figure, form, generic, grid, gridcell, group, heading, img,
insertion, link, list, listbox, listitem, log, main, marquee, math,
meter, menu, menubar, menuitem, menuitemcheckbox, menuitemradio,
navigation, none, note, option, paragraph, presentation, progressbar,
radio, radiogroup, region, row, rowgroup, rowheader, scrollbar, search,
searchbox, separator, slider, spinbutton, status, strong, subscript,
superscript, switch, tab, table, tablist, tabpanel, term, textbox, time,
timer, toolbar, tooltip, tree, treegrid, treeitem
```

### 4.5 Frequently confused roles

| Looks similar                          | Actually distinct                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `button` vs `link`                     | `<button>` triggers an action; `<a href>` navigates. Don't use `button` for a link or vice versa.   |
| `textbox` vs `searchbox` vs `combobox` | textbox = generic input; searchbox = `<input type="search">`; combobox = `<select>` or autocomplete |
| `tab` vs `link`                        | tab is part of a tablist with role-of-state; link navigates                                         |
| `menuitem` vs `button`                 | menuitem is inside a menu/menubar; button is anywhere. **D365 uses menuitem for command bar.**      |
| `dialog` vs `alertdialog`              | alertdialog is for confirmations requiring response; dialog is generic                              |
| `row` vs `listitem`                    | row is in a table/grid; listitem is in a list/listbox                                               |

### 4.6 When `getByRole` is NOT the answer

- App built before ARIA standards (legacy ASP.NET WebForms, old JSP): elements have no roles. Use `getByTestId` or CSS.
- D365 command bar items render as `menuitem`, not `button`. If you use `getByRole('button', { name: 'Edit' })`, it won't find the D365 Edit command. This is a frequent bug — see Section 16.
- Custom web components with closed Shadow DOM: the role may be inside the shadow tree and inaccessible.

---

## 5. The other semantic getters

### 5.1 `getByText`

```typescript
page.getByText("Order confirmed", { exact: true });
page.getByText("Order", { exact: false }); // substring match
page.getByText(/^Order\s+confirmed$/); // regex
```

Behaviour:

- Matches the element's text content (including nested elements' text).
- `exact: false` (default) is substring match — `'order'` matches `'Your order has shipped'`.
- `exact: true` is whole-string match.
- Regex is matched against the full text content; partial regex matches the full string.
- Hidden elements are skipped by default.
- Whitespace is normalised — multiple spaces, newlines, tabs collapse to single space.

### 5.2 `getByLabel`

```typescript
page.getByLabel("Email address");
page.getByLabel(/^Email/, { exact: false });
```

Resolves the input that's labelled by:

- A `<label for="x">Email</label>` with `<input id="x">`
- A wrapping `<label>Email <input></label>`
- `aria-labelledby` pointing to a labelling element
- `aria-label` attribute (despite the name "Label", `getByLabel` includes `aria-label` matches)

This is the input-finding workhorse for accessible forms.

### 5.3 `getByPlaceholder`

```typescript
page.getByPlaceholder("Search...");
page.getByPlaceholder(/search/i);
```

Matches the `placeholder` attribute of inputs. Use as a fallback when no label exists. Brittle to copy changes.

### 5.4 `getByAltText`

```typescript
page.getByAltText("Company logo");
page.getByAltText(/profile picture/);
```

For images, area maps, and `<input type="image">`. The `alt` attribute is the accessible name for images, so this overlaps with `getByRole('img', { name: 'Company logo' })`.

### 5.5 `getByTitle`

```typescript
page.getByTitle("Edit user");
```

Matches the `title` attribute. Rare in modern UIs because mobile devices don't show titles. Sometimes useful for legacy desktop-targeting apps.

### 5.6 Choosing between them

| Element                            | Best getter                                                      |
| ---------------------------------- | ---------------------------------------------------------------- |
| Button with text                   | `getByRole('button', { name })`                                  |
| Button with icon and `aria-label`  | `getByRole('button', { name })`                                  |
| Form input with `<label>`          | `getByLabel(...)`                                                |
| Form input with `aria-label`       | `getByLabel(...)` OR `getByRole('textbox', { name })`            |
| Form input with only `placeholder` | `getByPlaceholder(...)`                                          |
| Heading                            | `getByRole('heading', { name, level })`                          |
| Link                               | `getByRole('link', { name })`                                    |
| Image                              | `getByRole('img', { name })` OR `getByAltText(...)`              |
| Status / toast / notification      | `getByRole('alert')` or `getByRole('status')`                    |
| Row in a grid                      | `getByRole('row', { name })` (matches the row's accessible name) |
| Cell in a grid                     | `getByRole('cell', { name })` or `getByRole('gridcell')`         |
| Tab                                | `getByRole('tab', { name })`                                     |

---

## 6. `getByTestId`

```typescript
page.getByTestId("submit-btn");
// Equivalent to:
page.locator('[data-testid="submit-btn"]');
```

### 6.1 Configuring the attribute name

By default `getByTestId` reads `data-testid`. Many apps use different attributes:

```typescript
// playwright.config.ts
use: {
  testIdAttribute: 'data-automation-id',     // D365 uses this
}
```

Common test ID attributes by ecosystem:

| Ecosystem                        | Attribute                                 |
| -------------------------------- | ----------------------------------------- |
| React Testing Library convention | `data-testid`                             |
| Microsoft D365 / Power Platform  | `data-automation-id`                      |
| Cypress convention               | `data-cy`                                 |
| Salesforce LWC                   | sometimes `data-id`, sometimes `data-key` |
| Custom enterprise                | whatever your platform team standardised  |

Always check what's already in production HTML before changing the config. Mixed conventions in one app is the worst-case state.

### 6.2 Conventions

Good test ID naming:

- Stable: never include positional info (`submit-btn-2` is bad).
- Semantic: describe what the element IS, not how it looks (`save-button` not `green-button`).
- Hierarchical: scoped if there are multiple instances (`user-table.row.email`).
- Long enough to be specific (`submit` is too generic; `customer-form-submit` is better).

Bad conventions seen in production:

- `data-testid="btn1"`, `data-testid="btn2"` (positional, not semantic)
- `data-testid="0a4f3b21"` (UUID — meaningless to humans)
- `data-testid="Submit"` (capitalisation matters; standardise on kebab-case)

### 6.3 When test IDs aren't enough

Even with test IDs, sometimes you need to scope:

```typescript
// 5 forms on the page, all have submit buttons with data-testid="submit"
page.getByTestId("user-form").getByTestId("submit").click();
```

This is exactly what locator chaining is for — see Section 10.

---

## 7. CSS selectors

Playwright's CSS engine is a superset of the standard CSS3 spec with several extensions.

### 7.1 Standard CSS that matters

| Selector                                    | Matches                                                           |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `.class`                                    | Element with class                                                |
| `#id`                                       | Element with id                                                   |
| `element`                                   | All elements of type                                              |
| `[attr]`                                    | Element with attribute                                            |
| `[attr="value"]`                            | Exact attribute value                                             |
| `[attr~="value"]`                           | Whitespace-separated word in attribute                            |
| `[attr\|="value"]`                          | Hyphen-separated prefix (lang codes)                              |
| `[attr^="value"]`                           | Attribute starts with                                             |
| `[attr$="value"]`                           | Attribute ends with                                               |
| `[attr*="value"]`                           | Attribute contains                                                |
| `parent > child`                            | Direct child                                                      |
| `ancestor descendant`                       | Any descendant                                                    |
| `prev + next`                               | Adjacent sibling                                                  |
| `prev ~ siblings`                           | All following siblings                                            |
| `:not(selector)`                            | Negation                                                          |
| `:nth-child(n)`                             | Positional (1-indexed)                                            |
| `:nth-of-type(n)`                           | Positional within same tag                                        |
| `:first-child`, `:last-child`               | Boundary                                                          |
| `:focus`, `:hover`, `:disabled`, `:checked` | State                                                             |
| `:is(a, b)`                                 | Match any of                                                      |
| `:where(a, b)`                              | Match any of, zero specificity (for CSS but irrelevant for query) |

### 7.2 Playwright CSS extensions

| Selector                    | Matches                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `:has-text("foo")`          | Element whose text content contains "foo" (case-insensitive) |
| `:text("foo")`              | Element whose text content is exactly "foo"                  |
| `:text-is("foo")`           | Same as `:text` (alias)                                      |
| `:text-matches("/foo.*/i")` | Element whose text matches regex                             |
| `:visible`                  | Element with non-zero dimensions, not display:none, etc.     |
| `:has(selector)`            | Element that has a descendant matching selector              |
| `:near(selector)`           | Element near another (proximity-based)                       |
| `:right-of(selector)`       | Element to the right of another                              |
| `:left-of(selector)`        | Element to the left of another                               |
| `:above(selector)`          | Element above another                                        |
| `:below(selector)`          | Element below another                                        |
| `:scope`                    | The current locator's scope                                  |
| `:light(selector)`          | Pierce Shadow DOM (see Section 14)                           |
| `nth-match(selector, n)`    | The Nth matching element across the whole DOM                |

### 7.3 `:has-text` vs `getByText`

```typescript
// :has-text — element whose text contains "Save"
page.locator('button:has-text("Save")');

// getByText — element whose accessible text is "Save"
page.getByText("Save");
```

Differences:

- `:has-text` is text content (DOM text including nested elements).
- `getByText` is accessible text (after `aria-hidden` filtering, etc.).
- `:has-text` is substring by default; `getByText` defaults to substring but supports `{ exact: true }`.
- `:has-text` is case-insensitive; `getByText` is case-sensitive by default.

For finding "this button that says X", prefer `getByRole('button', { name: 'X' })` — it's semantic AND combines role + text.

### 7.4 `:has(...)` — the killer feature

`:has()` is the inverse of descendant selector. It says "elements that CONTAIN a matching descendant":

```typescript
// "Find the row that contains a status cell saying Active"
page.locator('tr:has(td.status:has-text("Active"))');
```

Before `:has()`, this required XPath:

```typescript
page.locator('//tr[.//td[@class="status"][text()="Active"]]');
```

`:has()` is universally supported in Playwright (it's a Playwright extension, even though it's now standard CSS in browsers as of 2023).

### 7.5 `:visible` — the filter that saves tests

```typescript
page.locator(".menu-item:visible").click();
```

Without `:visible`, a hidden menu item (display:none, off-screen, opacity:0) can be the first match, and `click()` will scroll-to-element and click an invisible thing — usually wrong.

With `:visible`, only currently-visible elements match. Note: `:visible` is computed from layout, not CSS rules alone. It checks:

- Element has non-zero `offsetWidth` and `offsetHeight`
- Not `display: none`
- Not inside a `[hidden]` ancestor
- Not `visibility: hidden`

It does NOT check `opacity: 0` (an element with opacity 0 is technically visible in DOM terms even if invisible to humans).

### 7.6 Layout selectors — `:right-of`, `:below`, etc.

These let you locate elements by their visual position relative to anchors:

```typescript
// Click the "Edit" button that's to the right of "John Smith"
page.locator('button:right-of(:text("John Smith"))').click();

// Click the input below the "Email" label
page.locator('input:below(:text("Email"))').first().click();
```

Use cases:

- Tabular layouts where positional relationships are stable but DOM relationships aren't.
- Form layouts where labels are visually adjacent to inputs but not programmatically associated.

Pitfalls:

- "Right-of" is computed at action time, based on current layout. If the DOM hasn't fully rendered, results are unpredictable.
- These selectors are slow — they require layout computation for every candidate.
- For accessible apps, `getByLabel` is always better.

---

## 8. XPath

XPath is the original DOM query language. Playwright supports it but you should reach for it sparingly.

### 8.1 When XPath is actually needed

| Task                                               | XPath needed?                                              |
| -------------------------------------------------- | ---------------------------------------------------------- |
| Find by class                                      | No — CSS `.class`                                          |
| Find by attribute value                            | No — CSS `[attr="value"]`                                  |
| Find by descendant                                 | No — CSS `:has()`                                          |
| Find by text content                               | No — `getByText` or `:has-text`                            |
| Find ANCESTOR by descendant property               | YES — CSS can't go up the tree                             |
| Find by sibling relationship in specific direction | Usually no — CSS `+`, `~` work                             |
| Find first ancestor with class                     | YES — XPath `ancestor-or-self::*[contains(@class, "foo")]` |
| Find by index across a complex tree                | Usually no — chain locators with `.nth()`                  |

### 8.2 XPath syntax that's worth knowing

```typescript
// Absolute path (avoid — brittle)
page.locator("/html/body/div[1]/main/button");

// Relative path (preferred)
page.locator('//button[@type="submit"]');

// Attribute equality
page.locator('//input[@name="email"]');

// Attribute contains
page.locator('//div[contains(@class, "alert")]');

// Text equality
page.locator('//button[text()="Save"]');

// Text contains
page.locator('//button[contains(text(), "Save")]');

// Descendant text contains
page.locator('//tr[.//td[contains(text(), "Alice")]]');

// Up the tree — find the row containing this text
page.locator('//*[text()="Alice"]/ancestor::tr');

// Following sibling
page.locator('//label[text()="Email"]/following-sibling::input[1]');

// Multiple conditions
page.locator('//button[@type="submit" and contains(@class, "primary")]');

// Position
page.locator('//div[@class="row"][2]'); // 2nd row (1-indexed in XPath!)
```

### 8.3 XPath performance

XPath in Playwright translates to a synchronous DOM walk in the browser process. Performance is comparable to CSS for short queries; slower for queries with complex predicates.

Benchmark — finding "the row containing 'CIT-001'" in a 1000-row table:

| Approach                                              | Time  |
| ----------------------------------------------------- | ----- |
| `page.locator('.row').filter({ hasText: 'CIT-001' })` | ~3 ms |
| `page.locator('//tr[.//td[text()="CIT-001"]]')`       | ~5 ms |
| `page.locator('tr:has(td:has-text("CIT-001"))')`      | ~4 ms |

The performance difference is negligible for normal test suites. Pick what reads better in code.

### 8.4 XPath in Playwright tooling

The Playwright Inspector (`PWDEBUG=1 npx playwright test`) and the codegen (`npx playwright codegen`) prefer CSS and `getByRole` over XPath. The trace viewer's "Pick locator" feature also generates CSS and getter-based selectors. You won't see XPath unless you explicitly write it.

---

## 9. Filtering

`filter()` narrows a locator set without rewriting the selector.

### 9.1 The four filter options

```typescript
const rows = page.locator("tr");

rows.filter({ hasText: "Alice" }); // text contains "Alice"
rows.filter({ hasText: /^Alice/ }); // matches regex
rows.filter({ hasNotText: "Header" }); // text does NOT contain "Header"
rows.filter({ has: page.locator(".active") }); // contains an .active descendant
rows.filter({ hasNot: page.locator(".disabled") }); // does NOT contain a .disabled descendant
```

You can combine all four:

```typescript
rows
  .filter({ hasText: "Alice" })
  .filter({ has: page.locator(".active") })
  .filter({ hasNotText: "Pending" })
  .click();
```

### 9.2 `and` and `or`

```typescript
// Match elements that are EITHER buttons OR links named 'Save'
page
  .getByRole("button", { name: "Save" })
  .or(page.getByRole("link", { name: "Save" }));

// Match elements that are BOTH visible AND enabled
page
  .locator("button")
  .and(page.locator(":visible"))
  .and(page.locator(":enabled"));
```

`and` is useful when stacking constraints. `or` is useful when handling polymorphic UIs (sometimes a button, sometimes a link).

### 9.3 Filter chains — order matters for readability

```typescript
// Top-down — start broad, narrow
const grid = page.locator(".citations-grid");
const row = grid.locator('[role="row"]').filter({ hasText: "CIT-001" });
const cell = row.locator('[role="gridcell"]').nth(2);
await cell.click();
```

This reads top-down and is easy to debug — you can `await grid.count()` to check the grid found, `await row.count()` to check the row, etc.

---

## 10. Composing

### 10.1 Positional helpers

```typescript
page.locator(".row").first(); // 1st match
page.locator(".row").last(); // last match
page.locator(".row").nth(2); // 3rd (0-indexed!)
page.locator(".row").count(); // returns Promise<number>
```

### 10.2 Chained `locator()`

```typescript
// Scope: find rows INSIDE .citations-grid
page.locator(".citations-grid").locator(".row");

// Equivalent CSS
page.locator(".citations-grid .row");
```

Both work. Chained `.locator()` is more composable when the inner selector is a variable:

```typescript
function rowByCustomer(grid: Locator, name: string): Locator {
  return grid.locator(".row").filter({ hasText: name });
}

await rowByCustomer(page.locator(".citations-grid"), "Alice").click();
await rowByCustomer(page.locator(".payments-grid"), "Bob").click();
```

### 10.3 The `nth-match` global selector

```typescript
page.locator(":nth-match(button.primary, 3)");
```

This is the 3rd `button.primary` across the WHOLE DOM, not the 3rd within a parent. Rarely useful — usually `.nth(2)` after a chained `.locator()` is what you want.

### 10.4 Composing across page and frame

```typescript
const dialog = page.locator(".dialog");
const frame = page.frameLocator('iframe[name="content"]');

// dialog inside main page
await dialog.locator(".save-btn").click();

// element inside a frame
await frame.locator(".input").fill("hello");

// Cannot do: dialog.locator(frame.locator('.input')) — different DOM trees
```

Page locators and frame locators are different types. You can't filter one against the other.

---

## 11. Strict mode

Every Playwright action assumes the locator resolves to EXACTLY ONE element. Resolving to 0 is "element not found"; resolving to 2+ is "strict mode violation".

### 11.1 Strict mode errors

```typescript
await page.locator(".btn").click();
// Error: strict mode violation: locator('.btn') resolved to 3 elements:
//   1) <button class="btn primary">Save</button> aka getByRole('button', { name: 'Save' })
//   2) <button class="btn secondary">Cancel</button> aka getByRole('button', { name: 'Cancel' })
//   3) <button class="btn small">×</button> aka getByLabel('Close')
```

The error message even suggests better locators based on what each element actually is.

### 11.2 How to disambiguate

| Strategy              | Code                                               |
| --------------------- | -------------------------------------------------- |
| Use a better selector | `page.getByRole('button', { name: 'Save' })`       |
| Pick by position      | `page.locator('.btn').first()`                     |
| Filter                | `page.locator('.btn').filter({ hasText: 'Save' })` |
| Scope to parent       | `page.locator('.dialog').locator('.btn')`          |
| Use `.nth()`          | `page.locator('.btn').nth(0)`                      |

Avoid `.first()` for data-driven selection. If "the first .btn" changes when the data changes, the test breaks silently. Use `.filter({ hasText })` instead.

### 11.3 Methods that DON'T require strict mode

Some methods accept any cardinality:

| Method                       | Strict?                        |
| ---------------------------- | ------------------------------ |
| `count()`                    | No — returns 0+                |
| `all()`                      | No — returns array of Locators |
| `allTextContents()`          | No                             |
| `allInnerTexts()`            | No                             |
| `first()`, `last()`, `nth()` | No — themselves narrow         |
| `filter()`                   | No                             |
| `or()`                       | No                             |

```typescript
const labels = await page.locator(".label").allTextContents();
// labels: ['Email', 'Password', 'Phone']
```

### 11.4 `expect(locator).toHaveCount(N)` — explicit cardinality

For cases where N>1 is correct:

```typescript
await expect(page.locator(".notification")).toHaveCount(3);
await expect(page.locator(".error")).toHaveCount(0); // no errors
```

These don't fire strict mode — they're explicit cardinality assertions.

---

## 12. Lazy evaluation

### 12.1 The Locator object is a description, not a query

```typescript
const btn = page.getByRole("button", { name: "Save" });
// AT THIS POINT — no browser round-trip has happened.
// btn is a JavaScript object describing "where to look later".
```

Compare to Selenium's `WebDriver.findElement()`:

```java
WebElement btn = driver.findElement(By.cssSelector(".save"));
// AT THIS POINT — Selenium has already queried the DOM and holds a reference.
// If the DOM changes, the reference goes stale.
```

### 12.2 When the DOM is queried

For every locator method that takes an action:

| Method                                                  | Queries DOM?                           |
| ------------------------------------------------------- | -------------------------------------- |
| `page.locator(...)`                                     | NO                                     |
| `page.getByRole(...)`, all getters                      | NO                                     |
| `.filter(...)`, `.first()`, `.nth()`, `.or()`, `.and()` | NO                                     |
| `.click()`, `.fill()`, `.hover()`, etc.                 | YES — waits for actionable, then acts  |
| `.textContent()`, `.innerText()`, `.getAttribute()`     | YES — single snapshot                  |
| `.count()`, `.all()`                                    | YES                                    |
| `expect(loc).toBeVisible()`, `.toHaveText(...)`, etc.   | YES — re-queries until pass or timeout |
| `.elementHandle()`, `.elementHandles()`                 | YES — converts to handles              |
| `.waitFor(...)`                                         | YES — waits for state                  |

### 12.3 Why this matters for POMs

```typescript
class CustomerDetailsPage {
  readonly customerName: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    // No await, no async — pure object construction.
    this.customerName = page.locator('[data-automation-key="fullname"]');
    this.editButton = page.getByRole("menuitem", { name: "Edit" });
  }
}

// Construct once, use many times — every action re-queries the current DOM.
const pom = new CustomerDetailsPage(page);
await pom.editButton.click(); // queries DOM now
await page.waitForURL("/edit");
await pom.editButton.click(); // queries the NEW DOM at the new URL
```

A POM constructed once works across navigations because nothing was queried at construction time.

### 12.4 What this means for performance

A locator chain that produces 5 locators (filter + first + filter + nth + locator) involves zero browser round-trips. The first round-trip is the action. So:

```typescript
// Three round-trips: count, then click, then expect
await rows.filter({ hasText: "Alice" }).count();
await rows.filter({ hasText: "Alice" }).first().click();
await expect(rows.filter({ hasText: "Alice" })).toHaveCount(1);

// Three round-trips: count, click, expect — same cost
const targetRow = rows.filter({ hasText: "Alice" });
await targetRow.count();
await targetRow.first().click();
await expect(targetRow).toHaveCount(1);
```

The expression `rows.filter({ hasText: 'Alice' })` is free to evaluate as many times as you want.

---

## 13. Auto-waiting

Every Playwright action waits for the element to be actionable before acting. "Actionable" has a precise definition.

### 13.1 The 5 actionability checks

Before `click()`, `fill()`, `type()`, `check()`, `selectOption()`, `tap()`, `dblclick()`:

1. **Attached** to the DOM (in the document tree).
2. **Visible** — has non-zero `offsetWidth`/`offsetHeight`, not `display: none`, not `visibility: hidden`.
3. **Stable** — not animating. Determined by 2 consecutive `requestAnimationFrame` calls with the same bounding box.
4. **Receives events** — the centre point passes a hit test (not covered by another element).
5. **Enabled** — not `[disabled]` or `aria-disabled`.

All 5 must pass within the action timeout. If any fails, the action retries until timeout.

### 13.2 What this prevents

| Without auto-wait                                                   | With auto-wait                    |
| ------------------------------------------------------------------- | --------------------------------- |
| Click on a button while a modal is fading in over it → silent miss  | Wait for hit-testable, then click |
| Fill an input that's hidden behind a tab not yet active → fail      | Wait for visible                  |
| Click a button mid-animation → click registers at wrong coordinates | Wait for stable bounding box      |
| Click a disabled submit button → no-op, test reports "passed"       | Throw `element is not enabled`    |

### 13.3 Override per-action

```typescript
await page.locator(".btn").click({
  force: true, // skip ALL actionability checks — click anyway
  trial: true, // run all checks but DON'T click (use for assertions)
  noWaitAfter: true, // don't wait for post-click navigation
  timeout: 5000,
  position: { x: 10, y: 10 }, // click at specific coords
  modifiers: ["Control", "Shift"],
  button: "right", // 'left' | 'middle' | 'right'
  clickCount: 2, // for double-click via single API
  delay: 100, // ms between mousedown and mouseup
});
```

`force: true` is for adversarial UIs (testing what happens if a user manages to click a "shouldn't-be-clickable" element). Use sparingly.

### 13.4 Action-specific waits

| Action                  | Additional checks                                                     |
| ----------------------- | --------------------------------------------------------------------- |
| `fill(text)`            | Element must be editable (`<input>`, `<textarea>`, `contenteditable`) |
| `check()` / `uncheck()` | Element must have role `checkbox` or `<input type="checkbox">`        |
| `selectOption(val)`     | Element must be `<select>`                                            |
| `setInputFiles(path)`   | Element must be `<input type="file">`                                 |
| `hover()`               | Visible + stable + not obscured                                       |
| `focus()`               | Just attached + can be focused                                        |
| `dispatchEvent(...)`    | Just attached — DOES NOT wait for actionability                       |

### 13.5 Assertion auto-retry

Every Playwright `expect(locator).toX()` assertion polls until pass or timeout:

```typescript
await expect(page.locator(".status")).toHaveText("Active");
// Internally:
//   loop {
//     read .status text
//     if text === 'Active' → return
//     if elapsed > timeout → throw
//     wait 100ms
//   }
```

The retry interval starts at 100ms and increases exponentially. Total retries are bounded by `expect.timeout` (default 5s).

| Assertion                                                                            | Polled?           |
| ------------------------------------------------------------------------------------ | ----------------- |
| `toBeVisible()`, `toBeHidden()`, `toBeAttached()`, `toBeEnabled()`, `toBeDisabled()` | YES               |
| `toHaveText()`, `toContainText()`, `toHaveValue()`, `toHaveAttribute()`              | YES               |
| `toHaveCount(N)`, `toBeFocused()`, `toHaveURL()`, `toHaveTitle()`                    | YES               |
| `toBeChecked()`, `toBeInViewport()`, `toBeEmpty()`                                   | YES               |
| `toMatch(regex)` (on a string value, not a locator)                                  | NO — single check |
| `toEqual(obj)` (object comparison)                                                   | NO — single check |

For non-polling values, wrap in `expect.poll()`:

```typescript
await expect
  .poll(
    async () => {
      const response = await api.getCitation(id);
      return response.status;
    },
    { timeout: 30_000 },
  )
  .toBe("PAID");
```

---

## 14. Shadow DOM

Web components (custom elements + Shadow DOM) hide their internal DOM from CSS selectors. Playwright pierces shadow boundaries by default for built-in queries.

### 14.1 The Shadow DOM model

```html
<my-card>
  #shadow-root (open)
  <div class="card-inner">
    <button>Save</button>
  </div>
</my-card>
```

The `<button>` is INSIDE the shadow root, not the light DOM. Standard CSS `document.querySelector('button')` doesn't find it.

### 14.2 Open vs closed shadow roots

- **Open**: `attachShadow({ mode: 'open' })` — accessible via `element.shadowRoot`.
- **Closed**: `attachShadow({ mode: 'closed' })` — `element.shadowRoot` returns null. Inaccessible to JS or any tool.

Closed shadow DOM is rare but exists. Apps that use it are unreachable by automation — by design.

### 14.3 Playwright's shadow piercing

By default, all locator queries pierce open shadow roots:

```typescript
page.locator("button"); // finds buttons in main DOM AND open shadows
page.getByRole("button", { name: "Save" }); // pierces
page.locator("my-card").locator(".card-inner button"); // pierces through my-card's shadow
```

This is different from browser DevTools, which DOES NOT pierce by default — you have to use `>>>` to combine shadow selectors. Playwright's default is "act like a screen reader" — pierce open shadows automatically.

### 14.4 The `:light()` escape

If you specifically want the LIGHT DOM only (don't pierce):

```typescript
page.locator(":light(button)"); // only buttons in main DOM, NOT in shadow roots
```

Rarely needed in practice.

### 14.5 Shadow DOM + filter

Filters work through shadows:

```typescript
page
  .locator("my-card")
  .filter({ has: page.locator("button.save") })
  .first();
```

This finds the `<my-card>` whose shadow root contains a `button.save`.

### 14.6 Salesforce LWC, Polymer, Lit, Stencil

All major web component frameworks use Shadow DOM. Playwright handles them transparently:

- **Salesforce LWC**: heavy shadow DOM use. `getByRole('button', { name })` works as expected.
- **Polymer / Lit**: same — shadow piercing handles it.
- **Stencil**: same.

The cases that break are intentionally closed-shadow web components, which are a niche.

---

## 15. IFrames

IFrames are separate DOM trees. Standard locators don't cross frame boundaries — you need `frameLocator()`.

### 15.1 Basic frame locator

```typescript
const frame = page.frameLocator('iframe[name="content"]');
await frame.locator("button").click();
```

`frameLocator` returns a `FrameLocator` object. It has the same locator API as `Page` (locator, getByRole, etc.) but scoped to that frame.

### 15.2 Nested frames

```typescript
const outer = page.frameLocator('iframe[name="main"]');
const inner = outer.frameLocator('iframe[name="detail"]');
await inner.getByRole("button", { name: "Save" }).click();
```

Chain `frameLocator` for nested frames. Each level is its own scope.

### 15.3 IFrame timing

Frames load asynchronously. The `<iframe>` element exists before the frame's content loads. `frameLocator(...).locator(...)` waits for the frame element AND its content to be ready before acting.

If the frame is created dynamically:

```typescript
// Frame doesn't exist yet
const frame = page.frameLocator('iframe[name="lazy"]');
await page.locator("#load-frame-btn").click();
// Frame is created here
await frame.locator("button").click(); // waits for frame, then clicks
```

### 15.4 Cross-origin restrictions

A frame from a different origin (e.g., a third-party widget) is mostly accessible to Playwright (it controls the browser at the network level, not via injected scripts). But:

- You cannot read/modify the frame's URL via JS injection in your page.
- `frame.evaluate()` runs in the frame's JS context, which has its own globals.
- Cookies and storage are origin-scoped.

For testing cross-origin OAuth IdPs, Playwright handles them natively (unlike Cypress, which requires `cy.origin`).

### 15.5 `page.frames()` and `page.frame(name)` — legacy

Before `frameLocator`, you had to use:

```typescript
const frame = page.frame({ name: "content" });
await frame!.click(".btn");
```

`frame()` returns a `Frame` or `null` — eager evaluation, possible null. Prefer `frameLocator()` everywhere.

---

## 16. D365 / Fluent UI cookbook

Microsoft's Fluent UI (D365, Dynamics, Power Platform, Office 365 web apps) has specific patterns. The most common gotchas:

### 16.1 The `menuitem` trap

Command bar buttons in D365 render as `<button role="menuitem">`, NOT `role="button"`.

```typescript
// ❌ NEVER works in D365 command bar
page.getByRole("button", { name: "Edit" });

// ✅
page.getByRole("menuitem", { name: "Edit" });
```

This is THE most common D365 bug. Always check the role in DevTools first.

### 16.2 The `.ms-Spinner` wait

D365 shows `.ms-Spinner` elements during async operations:

```typescript
// Wait for ALL spinners to disappear before reading data
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30_000 });
```

`toHaveCount(0)` auto-retries — it polls until either the spinner is gone OR timeout. Always use this instead of `waitForTimeout(5000)`.

### 16.3 `data-automation-id` and `data-automation-key`

D365 ships test hooks via `data-automation-id` and `data-automation-key`. Configure:

```typescript
// playwright.config.ts
use: {
  testIdAttribute: "data-automation-id";
}

// Now:
page.getByTestId("fullname-field");
```

For `data-automation-key` (used for grid columns):

```typescript
page.locator('[data-automation-key="statecode"]');
```

### 16.4 The `.ms-DetailsList-row` pattern

D365 grids use `.ms-DetailsList`. To find a row by its content:

```typescript
const grid = page.locator(".ms-DetailsList");
const row = grid.locator(".ms-DetailsList-row").filter({ hasText: "CIT-001" });
await row.click();
```

To click a specific cell within that row:

```typescript
await row.locator('[data-automation-key="statecode"]').click();
```

### 16.5 The IFrame trap

Model-driven D365 forms render INSIDE an iframe named `AppLandingPage` or `pages-iframe-XXX`. You must enter the frame:

```typescript
const formFrame = page.frameLocator('iframe[name^="pages-iframe"]');
await formFrame.getByLabel("Account Name").fill("Contoso");
```

`name^="pages-iframe"` is a CSS attribute-starts-with selector — the numeric suffix changes per session.

### 16.6 The two-phase render

D365 forms render in TWO phases:

1. Shell + fields render with empty values.
2. OData call returns; fields populate.

Reading a field's text content right after navigation may get an empty string. Always wait for the data:

```typescript
const field = formFrame.locator('[data-automation-key="name"]');
await expect(field).not.toBeEmpty({ timeout: 30_000 });
```

### 16.7 Dropdown / combobox interaction

D365 dropdowns are NOT standard `<select>` elements. They're custom combobox components:

```typescript
// Click to open
await formFrame.locator('[aria-label="Status"]').click();

// Wait for the option list to render
const options = page.getByRole("option");
await expect(options.first()).toBeVisible();

// Click the option
await page.getByRole("option", { name: "Active" }).click();
```

Note: the option list often renders at the body level OUTSIDE the iframe, so use `page.getByRole` not `formFrame.getByRole`.

### 16.8 The notification panel

D365 success messages appear in a notification area with `role="alert"`:

```typescript
const notification = page.getByRole("alert");
await expect(notification).toContainText("Record saved");
```

For multiple notifications:

```typescript
await expect(page.locator('[role="alert"]')).toHaveCount(2);
```

---

## 17. Salesforce LWC cookbook

Salesforce Lightning Web Components heavily use Shadow DOM and custom elements.

### 17.1 Lightning component tags

```typescript
// LWC components are <lightning-input>, <lightning-button>, etc.
page
  .locator('lightning-input[name="email"]')
  .locator("input")
  .fill("user@example.com");

// Or with getByRole (since Lightning components expose ARIA roles):
page.getByRole("textbox", { name: "Email" }).fill("user@example.com");
```

The second form is preferred — it pierces shadow DOM and uses semantic queries.

### 17.2 The `data-key` attribute

Salesforce sometimes ships `data-key` instead of `data-testid`. Configure:

```typescript
use: {
  testIdAttribute: "data-key";
}
```

### 17.3 Visualforce iframes

Legacy Visualforce pages embedded in Lightning use iframes. Same pattern as D365:

```typescript
const vfFrame = page.frameLocator('iframe[title="Account Detail"]');
await vfFrame.locator('input[name="acc.Name"]').fill("Contoso");
```

### 17.4 The publishing state pattern

LWC components publish state via events. To wait for "saved" state:

```typescript
await page.evaluate(() => {
  return new Promise<void>((resolve) => {
    document.addEventListener("record-saved", () => resolve(), { once: true });
  });
});
```

Or — more often — wait for a visible status change:

```typescript
await expect(page.getByRole("status")).toContainText("Saved");
```

---

## 18. Cross-browser role differences

Chromium, Firefox, and WebKit implement ARIA roles slightly differently. The most-impactful differences:

| Element                                  | Chromium role | Firefox role  | WebKit role   |
| ---------------------------------------- | ------------- | ------------- | ------------- |
| `<summary>`                              | (no role)     | `button`      | (no role)     |
| `<details>`                              | `group`       | `group`       | (no role)     |
| `<dialog>` (open)                        | `dialog`      | `dialog`      | `dialog`      |
| `<dialog>` (closed)                      | (no role)     | (no role)     | (no role)     |
| `<header>` outside `<body>` direct child | (no role)     | `banner`      | `banner`      |
| `<footer>` outside `<body>` direct child | (no role)     | `contentinfo` | `contentinfo` |
| `<input type="search">`                  | `searchbox`   | `searchbox`   | `searchbox`   |
| `<input>` with no type                   | `textbox`     | `textbox`     | `textbox`     |

### 18.1 The `<summary>` trap

```typescript
// ❌ Works in Firefox, FAILS in Chromium with "no role"
page.getByRole("button", { name: "More info" }); // targeting a <summary>

// ✅ Cross-browser safe
page.locator("summary", { hasText: "More info" });
```

### 18.2 Accessible name calculation differences

The most subtle browser difference. The accessible name algorithm has many edge cases that browsers implement slightly differently:

- Label inheritance through `<button><span>Text</span></button>` is consistent.
- Label inheritance through `<button>Save <span>changes</span></button>` is mostly consistent.
- Label from `aria-labelledby` referencing an element with both inline text and child elements: subtle differences in whitespace handling.

If a test passes in Chromium but fails in Firefox with "element not found", the first thing to check is accessible name normalisation. Use `aria-label` explicitly:

```html
<!-- Cross-browser safe -->
<button aria-label="Save changes">
  Save <span class="badge">changes</span>
</button>
```

### 18.3 Visibility differences

`visibility: hidden` on a parent making children invisible: consistent.

`opacity: 0` is NOT considered hidden in any browser by the accessibility tree (an opacity-0 element is still in the a11y tree). `:visible` selector also doesn't filter opacity-0 elements.

### 18.4 Mitigation

For cross-browser tests, prefer:

- `getByTestId` (no role differences)
- `getByText` (text is canonical)
- `getByLabel` (labels are canonical)

Reserve `getByRole` for primary navigation and form controls where roles are universally implemented.

---

## 19. Performance

Locator-related performance considerations for large suites.

### 19.1 Selector evaluation cost

Most locator evaluations are sub-millisecond in the browser. Exceptions:

| Selector                                  | Cost                                    |
| ----------------------------------------- | --------------------------------------- |
| `#id`                                     | < 1 ms — direct hash lookup             |
| `.class`                                  | < 1 ms                                  |
| `[attr="value"]`                          | < 1 ms                                  |
| `getByRole('button', { name })`           | 1–5 ms — walks accessibility tree       |
| `:has(...)`                               | 1–10 ms — depends on subtree size       |
| `:right-of(...)`, layout selectors        | 10–100 ms — requires layout computation |
| Complex XPath                             | 1–50 ms                                 |
| `getByText` in a 10000-character document | ~5 ms — full text scan                  |

### 19.2 Locator caching

A `Locator` object is cheap to create — about the cost of a function call. There's no reason to cache it in a variable for performance, only for readability:

```typescript
// Both are equally fast
for (let i = 0; i < 10; i++) {
  await page.locator(".btn").click();
}

const btn = page.locator(".btn");
for (let i = 0; i < 10; i++) {
  await btn.click();
}
```

### 19.3 `count()` and `all()` cost

`count()` and `all()` do a single query. Calling them in a loop is wasteful:

```typescript
// ❌ N queries
for (let i = 0; i < 10; i++) {
  if ((await page.locator(".row").count()) > 0) {
    /* ... */
  }
}

// ✅ 1 query
const rowCount = await page.locator(".row").count();
for (let i = 0; i < 10; i++) {
  if (rowCount > 0) {
    /* ... */
  }
}
```

### 19.4 `expect.toHaveCount` is the right wait

Polling for elements to appear:

```typescript
// ✅
await expect(page.locator(".row")).toHaveCount(10, { timeout: 30_000 });

// ❌ Manual polling — reimplements what toHaveCount does
let count = 0;
const start = Date.now();
while (count < 10 && Date.now() - start < 30_000) {
  count = await page.locator(".row").count();
  await page.waitForTimeout(500);
}
```

The `toHaveCount` form is faster (no fixed sleep), more reliable (no race window), and shorter.

### 19.5 Locator vs ElementHandle perf

Locators always re-query. ElementHandle uses a cached browser-side reference. For micro-benchmarks, ElementHandle is ~10% faster. For real tests, the cost is dominated by network and rendering — locator overhead is irrelevant.

The right answer is always `Locator` unless you have a specific need (passing to `page.evaluate`).

---

## 20. Common production failures

Real bugs we've debugged. Each with symptom, cause, and fix.

### Failure 1 — Tests pass locally, fail in CI with "strict mode violation"

**Symptom:** `getByRole('button', { name: 'Save' })` finds one button locally, two in CI.

**Cause:** CI runs in headless mode at a different viewport. A button that's hidden behind responsive CSS becomes visible at the CI viewport. The hidden button at one viewport is the visible button at another.

**Fix:** Use `.filter({ has: page.locator(':visible') })` or scope to a specific panel: `page.locator('.form-panel').getByRole('button', { name: 'Save' })`.

### Failure 2 — `getByText('OK')` matches wrong element

**Symptom:** `getByText('OK')` clicks a header instead of the modal button.

**Cause:** Multiple elements contain "OK" substring. Default match is substring, not exact.

**Fix:** Use `{ exact: true }` or use a more specific role: `getByRole('button', { name: 'OK', exact: true })`.

### Failure 3 — D365 test passes once, fails on rerun

**Symptom:** The test creates a record successfully on first run; on second run, "row not found".

**Cause:** Previous test data still exists. The grid filter `data-automation-key="name"="CIT-001"` matches multiple rows (one from this run, one from a previous run that wasn't cleaned up).

**Fix:** Use unique data per run (e.g., timestamp suffix). Clean up test data in `afterEach`.

### Failure 4 — Locator works in headed mode, times out in headless

**Symptom:** Test runs visually fine; headless times out at the click.

**Cause:** A modal overlay is invisible because `display: none` in headless but rendered in headed. The element being clicked is OBSCURED by the modal — auto-wait's hit-test check fails.

**Fix:** Add a wait for the modal to be hidden before clicking. Or use `force: true` if the modal is irrelevant test pollution.

### Failure 5 — `getByLabel` finds nothing despite label existing

**Symptom:** DOM shows `<label>Email <input></label>` but `getByLabel('Email')` returns 0.

**Cause:** The label has text adjacent to the input but the input has `aria-hidden="true"` set elsewhere. `getByLabel` respects accessibility tree hidden states.

**Fix:** Remove `aria-hidden` if it's wrong (probably it is — inputs shouldn't be a11y-hidden). Or fall back to CSS: `page.locator('label:has-text("Email") input')`.

### Failure 6 — `expect(loc).toHaveText(...)` fails with subtle whitespace differences

**Symptom:** `Expected: "Welcome, Alice"\nReceived: "Welcome,  Alice"` (two spaces).

**Cause:** The rendered text has a non-breaking space (`&nbsp;`) which doesn't normalise like regular whitespace.

**Fix:** Use `toContainText` if you don't care about exact whitespace, OR regex: `toHaveText(/Welcome,\s+Alice/)`, OR normalise yourself:

```typescript
const text = (await loc.textContent())?.replace(/\s+/g, " ").trim();
```

### Failure 7 — `getByRole('row')` matches header row when you want data row

**Symptom:** Clicking the "Alice" row clicks the column header that contains a sort indicator labelled "Alice".

**Cause:** `<thead>` rows have `role="row"` too. Header rows aren't excluded.

**Fix:** Scope: `page.locator('tbody').getByRole('row', { name: /Alice/ })`.

### Failure 8 — Iframe locator hangs forever

**Symptom:** `frameLocator(...).locator('button').click()` never returns; eventually times out.

**Cause:** The iframe element exists but the frame's URL never loads (404, network timeout, or the iframe `src` is wrong). The frame stays at `about:blank` indefinitely.

**Fix:** Check the iframe's `src` attribute. Add a wait for the iframe to navigate: `await page.locator('iframe').first().waitFor()` then verify URL.

### Failure 9 — `getByRole` test passes in Chromium, breaks in WebKit

**Symptom:** `getByRole('button', { name: 'Save' })` on a `<summary>` works in Firefox but not WebKit.

**Cause:** WebKit doesn't give `<summary>` an implicit button role. See Section 18.

**Fix:** Use CSS: `page.locator('summary:has-text("Save")')`.

### Failure 10 — Shadow DOM piercing breaks when component goes closed-shadow

**Symptom:** A component update changes `attachShadow({ mode: 'open' })` to `'closed'`. All tests against that component fail with "element not found".

**Cause:** Playwright can't pierce closed shadows.

**Fix:** This is an app-side change — push back on the dev team. Closed shadow DOM is rare and only appropriate for security-isolated components (e.g., third-party widgets). If they insist, you may have to test the component in isolation (CT) instead of E2E.

### Failure 11 — Click resolves before navigation

**Symptom:** `await page.click('.submit')` then `expect(page).toHaveURL(/dashboard/)` — sometimes the URL check fires before navigation completes.

**Cause:** Click doesn't auto-wait for navigation. The page may still be on the old URL when the next line runs.

**Fix:** Either use `Promise.all` with `waitForNavigation` (older API), or wait explicitly:

```typescript
await page.click(".submit");
await page.waitForURL(/dashboard/);
```

### Failure 12 — `nth(2)` matches different element after a re-render

**Symptom:** Test that clicks `rows.nth(2)` works initially. After a row is added at the top, it clicks the wrong row.

**Cause:** `nth()` is positional — it matches the 3rd element in DOM order. If a row was prepended, position 2 is now position 3.

**Fix:** Use `filter({ hasText })` for data-driven selection.

---

## 21. Anti-pattern catalog

A comprehensive list of locator anti-patterns and their fixes.

| ❌ Anti-pattern                                                           | ✅ Fix                                                                         | Why                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `page.locator('button')` for the only button                              | `page.getByRole('button')`                                                     | Semantic; survives changing tag to `<a role="button">` |
| `page.locator('#submit-button')` when the ID is generated (`#submit-2-3`) | `page.getByTestId('submit')` or `page.getByRole('button', { name: 'Submit' })` | Generated IDs are unstable                             |
| `page.locator('.css-1q2w3e4')` (hashed CSS class)                         | `page.getByRole(...)`                                                          | Hashed classes change on every build                   |
| `page.locator('div > div > div > button')`                                | Find a stable anchor, scope from there                                         | Position-based selectors break on DOM restructure      |
| `for (i=0; i<count; i++) nth(i)` to find a row                            | `.filter({ hasText: 'Alice' })`                                                | Manual loop is slow, race-prone, ignores auto-retry    |
| `page.locator('.btn').first()` for "the Save button"                      | `getByRole('button', { name: 'Save' })`                                        | `.first()` breaks when DOM order changes               |
| `page.locator('button:nth-of-type(3)')`                                   | filter or specific selector                                                    | Positional in a sea of buttons                         |
| `await page.waitForTimeout(5000)` then `expect(...)`                      | `await expect(...).toHaveText(..., { timeout: 30_000 })`                       | Fixed sleeps are flaky                                 |
| `expect(await loc.textContent()).toBe('...')`                             | `await expect(loc).toHaveText('...')`                                          | Latter polls; former is single snapshot                |
| `page.locator('//div[1]/div[2]/button')`                                  | Find an anchor by attribute or role                                            | Absolute XPath is the most brittle locator possible    |
| `page.locator('button.btn.btn-primary.btn-large.btn-rounded')`            | Reduce to minimum needed                                                       | Multi-class chains break when any class is removed     |
| `getByText('Save')` for a button                                          | `getByRole('button', { name: 'Save' })`                                        | Semantic; won't match a heading "Save your work"       |
| `page.locator('span:has-text("Alice")')` for clicking a row               | `page.locator('tr').filter({ hasText: 'Alice' })`                              | Click the row, not the span inside it                  |
| Storing locators in a global `const buttons = { save: '...' }`            | Lazy locators inside POMs                                                      | Loses the page context                                 |
| `Promise.race([loc.click(), wait])` to "force a timeout"                  | Set proper `actionTimeout`                                                     | Race is the wrong primitive                            |
| `page.evaluate(() => document.querySelector('.btn').click())`             | `page.locator('.btn').click()`                                                 | Bypasses actionability checks; flaky                   |
| Holding an `ElementHandle` across navigation                              | Use `Locator` instead                                                          | Handles go stale; locators don't                       |
| `page.locator('button >> nth=0')` (legacy syntax)                         | `page.locator('button').first()`                                               | New syntax is clearer                                  |
| Building selectors with string concatenation                              | Pass values as locator options                                                 | `getByRole('button', { name: variable })`              |
| Putting selectors in a constants file                                     | Page Object Model                                                              | Selectors belong with the page they describe           |

---

## Cross-references

- POM construction: [`./04_fixtures.md`](./04_fixtures.md) and [`../learn/03_pom.md`](../short_course/03_pom.md)
- Strict mode + assertions: [`../learn/04_architecture_walkthrough.md`](../short_course/04_architecture_walkthrough.md)
- D365 deep dive: [`../deep_dives/d365.md`](../topic_summaries/d365.md)
- Cross-site patterns (IFrames, popups): [`../deep_dives/cross_site_patterns.md`](../topic_summaries/cross_site_patterns.md)
- Locator practice problems: Q5, Q7, Q19 in [`../09_Practice_And_Quizzes/quiz_02_solutions/`](../../09_Practice_And_Quizzes/quiz_02_solutions/)
