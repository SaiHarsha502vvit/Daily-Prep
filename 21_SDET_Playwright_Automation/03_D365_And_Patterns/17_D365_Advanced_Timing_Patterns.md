# 17. D365 Advanced — Timing Traps, Hidden DOM & Text Race Conditions

**Navigation**: [← Chapter 16: StorageState Chaining](./16_CrossSite_Pattern6_StorageState_Chaining.md) | [Index](../00_INDEX.md) | [→ Chapter 18: Mega POM Architecture](../04_Enterprise_Architecture/18_Mega_POM_Architecture.md)

**Cross-links:**
- [`08_Browser_Internals_for_SDETs.md`](../02_Core_Architecture/08_Browser_Internals_for_SDETs.md) — 4 browser trees, two-phase render
- [`10_Dynamics365_CRM_Testing.md`](./10_Dynamics365_CRM_Testing.md) — D365 DOM anatomy, `.ms-*` classes
- [`04_JS_TS_For_Automation.md`](../01_Foundations/04_JS_TS_For_Automation.md) — `async/await` and `Promise.all`

---

## 5W1H

- **WHAT**: A deep technical guide to every timing failure mode unique to Dynamics 365 — where elements exist in the DOM but aren't visible, are visible but have wrong text, have the right structure but no data, or exist in hidden states that Playwright cannot interact with.
- **WHY**: D365 is built on React + Microsoft Fluent UI + Dataverse OData queries. It renders in two phases: UI shell first, then data. Every standard wait strategy fails here in subtle ways that produce flaky tests.
- **WHO**: Any SDET automating Dynamics 365 forms, grids, command bars, or sub-grids.
- **WHEN**: Every time a D365 test times out, throws "element not visible," or asserts wrong data.
- **HOW**: By understanding exactly WHY each failure happens and using the matching precision wait strategy.

---

## 1. Why D365 Timing Is Uniquely Hard

Three systems fire in sequence when D365 renders a page:

```
Browser receives page HTML (fast: ~100ms)
         ↓
React renders component shells with EMPTY state (fast: ~200ms)
         ↓
Components fire Dataverse/OData API calls (slow: 2–12 seconds)
         ↓
API responses return → React re-renders with real data (~500ms)
         ↓
Fluent UI animations run (CSS transitions: ~300ms)
         ↓
Page is actually useful to the user
```

**Total time from navigation to "ready for testing": 3–15 seconds.**

Standard Playwright locators interact with the DOM after the FIRST render — the shell with empty text. This is why `waitFor({ state: 'visible' })` passes on an empty element and your test reads empty strings.

---

## 2. Problem 1 — Element in DOM but Text Not Loaded

**What you see:** The field is on screen. You can see it. Playwright finds it. But `.textContent()` returns `""` or `null`.

**Why it happens:**
```
Time 0ms:   React renders <span class="fieldControl-text">  </span>  ← empty
Time 50ms:  Playwright: waitFor({ state: 'visible' }) → PASSES (span is visible)
Time 51ms:  Your test: textContent() → ""  ← wrong!
Time 3000ms: OData API returns data
Time 3200ms: React re-renders: <span class="fieldControl-text">CIT-001234</span>
```

**The fix — wait for SPECIFIC TEXT, not just visibility:**

```typescript
// ❌ Wrong — passes before text loads
const statusField = page.locator('[data-automation-key="statecode"]');
await statusField.waitFor({ state: 'visible' });
const status = await statusField.textContent(); // "" — wrong!

// ✅ Correct — waits until text is exactly 'Active'
await expect(statusField).toHaveText('Active', { timeout: 30000 });

// ✅ Also correct — waits until any non-empty text is present
await expect(statusField).not.toHaveText('', { timeout: 30000 });

// ✅ Also correct — waits until text matches a pattern
await expect(statusField).toContainText('CIT-', { timeout: 30000 });

// Only AFTER one of the above passes, read the value:
const actualStatus = (await statusField.textContent())?.trim() ?? '';
```

**Key rule:** `waitFor({ state: 'visible' })` tells you the element EXISTS. `toHaveText(expected)` tells you the element has the RIGHT CONTENT. Always use `toHaveText` or `not.toHaveText('')` before reading text from D365 fields.

---

## 3. Problem 2 — Element Visible But Wrong Text (Stale Render)

**What you see:** You navigate to Customer B's record. The page shows Customer B's form layout. But the name field still shows "Customer A" for 2 seconds.

**Why it happens:** SPA navigation doesn't reload the page. React reuses the existing components (Customer A's data) and starts loading Customer B's data. The component shows old data during the transition.

**Your test passes with Customer A's data — and you don't know it.**

```typescript
// ❌ Wrong — reads stale data from previous navigation
await page.locator('.ms-DetailsList-row').first().click(); // navigate to customer
const customerName = await page.locator('[data-automation-key="fullname"]').textContent();
// customerName = "Customer A" (previous record's name still showing!)

// ✅ Correct — wait for the EXACT expected value
const expectedCustomer = 'John Smith'; // you know which customer you clicked
await expect(
  page.locator('[data-automation-key="fullname"]')
).toHaveText(expectedCustomer, { timeout: 30000 });

// Now safe to read:
const customerName = await page.locator('[data-automation-key="fullname"]').textContent();
```

**Pattern for grid→record navigation:**

```typescript
async function navigateToCustomerAndWait(
  page: Page,
  rowLocator: Locator,
  expectedCustomerName: string
): Promise<void> {
  await rowLocator.click();

  // Wait for a URL change (D365 hash changes on record open)
  await page.waitForURL(/entityname=contact/, { timeout: 15000 });

  // Wait for spinner to clear
  await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 30000 });

  // Wait for the SPECIFIC customer's name — rejects stale renders
  await expect(
    page.locator('[data-automation-key="fullname"]')
  ).toHaveText(expectedCustomerName, { timeout: 30000 });
}
```

---

## 4. Problem 3 — Element Hidden But Still in DOM

D365 hides elements in 4 different ways. Each has different Playwright behavior:

```
Method 1: display: none
  → Element IS in the DOM
  → Element has NO space on screen
  → Playwright isVisible() returns: FALSE ✓
  → Playwright count() returns: 1 (it's there!)
  → You CAN'T interact with it

Method 2: visibility: hidden
  → Element IS in the DOM
  → Element HAS space on screen (blank area)
  → Playwright isVisible() returns: FALSE ✓
  → Playwright count() returns: 1
  → You CAN'T interact with it

Method 3: opacity: 0
  → Element IS in the DOM
  → Element HAS space on screen
  → Playwright isVisible() returns: FALSE ✓
  → Playwright count() returns: 1

Method 4: height: 0 / width: 0 / overflow: hidden
  → Element IS in the DOM
  → Element technically has a box (zero-size)
  → Playwright isVisible() returns: FALSE ✓
  → count() returns: 1
```

**Why this matters for D365:**

D365 hides tab content, collapsed form sections, and conditional fields using these CSS techniques. A locator for a field on Tab 2 returns `count() = 1` even when Tab 1 is active — but it's hidden.

**How to distinguish "not in DOM" vs "hidden in DOM":**

```typescript
const fieldLocator = page.locator('[data-automation-key="creditlimit"]');

// These two tell you VERY DIFFERENT things:
const domCount = await fieldLocator.count();       // 1 = in DOM (could be hidden)
const isVisible = await fieldLocator.isVisible();  // false = hidden or not in DOM

if (domCount === 0) {
  console.log('Element not rendered by React at all');
} else if (!isVisible) {
  console.log('Element exists but is CSS-hidden — check: display, visibility, opacity, size');
} else {
  console.log('Element is visible and ready');
}

// Use state: 'attached' to just confirm DOM presence without visibility check:
await fieldLocator.waitFor({ state: 'attached', timeout: 10000 }); // in DOM, don't care about visibility

// Use state: 'visible' when you need to interact:
await fieldLocator.waitFor({ state: 'visible', timeout: 20000 });
```

**Tab-specific fields:**

```typescript
// ❌ Wrong — reads field from hidden Tab 2 when Tab 1 is active
const tab2Field = page.locator('[data-automation-key="bankaccount"]');
const value = await tab2Field.textContent(); // returns empty or errors

// ✅ Correct — click tab first, then read its fields
await page.getByRole('tab', { name: 'Banking' }).click();
await expect(page.getByRole('tab', { name: 'Banking' })).toHaveAttribute('aria-selected', 'true');
await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 10000 });
// Now the tab is active and its fields are visible
await expect(tab2Field).toBeVisible({ timeout: 10000 });
const value = await tab2Field.textContent();
```

---

## 5. Problem 4 — Structure Loads But Text Takes 10+ Seconds

D365 Dataverse queries (OData calls to Microsoft's cloud DB) can take 8–12 seconds on large datasets.

**What you see:**
- Grid appears immediately (skeleton structure)
- Rows appear: but cells show `...` or nothing
- After 10 seconds: real data appears in cells

**Never use `waitForTimeout`:**

```typescript
// ❌ NEVER do this — hard sleep is always wrong
await page.waitForTimeout(10000); // fails in fast envs, too slow in slow envs

// ✅ Content-based wait with generous timeout
await expect(
  page.locator('.ms-DetailsList-row').first()
).not.toHaveText('', { timeout: 45000 });

// ✅ Wait for a specific known value in the first row
await expect(
  page.locator('.ms-DetailsList-row').first().locator('[data-automation-key="name"]')
).toContainText('CIT-', { timeout: 45000 }); // citation IDs start with CIT-

// ✅ Advanced: waitForFunction for custom DOM conditions
await page.waitForFunction(
  () => {
    const rows = document.querySelectorAll('.ms-DetailsList-row');
    if (rows.length === 0) return false;
    const firstCell = rows[0].querySelector('[data-automation-key]');
    return firstCell !== null && firstCell.textContent !== null && firstCell.textContent.trim().length > 0;
  },
  { timeout: 45000, polling: 500 }
);
```

---

## 6. Problem 5 — Tab Click → Component Unmounts and Re-Mounts

In standard D365 Pivot tabs, clicking a tab does NOT just show/hide panels. React UNMOUNTS the previous tab's component and MOUNTS the new tab's component. Any locator references you saved before the tab click become STALE.

```typescript
// ❌ Wrong — storing locator before tab switch
const contactsGrid = page.locator('.contacts-subgrid-container');
await page.getByRole('tab', { name: 'Contacts' }).click();
await contactsGrid.waitFor({ state: 'visible' }); // might work...

// Later:
const rowCount = await contactsGrid.locator('.ms-DetailsList-row').count();
// ↑ MIGHT fail: the component was unmounted/remounted, locator might be detached

// ✅ Correct — re-instantiate locators AFTER tab switch + load
await page.getByRole('tab', { name: 'Contacts' }).click();
await expect(page.getByRole('tab', { name: 'Contacts' })).toHaveAttribute('aria-selected', 'true');
await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 20000 });

// NOW create the locator (after the component has fully mounted)
const contactRows = page.locator('.contacts-subgrid-container .ms-DetailsList-row');
await expect(contactRows.first()).toBeVisible({ timeout: 15000 });
const rowCount = await contactRows.count();
```

**Rule:** In D365, get locators AFTER navigation/tab switches, not before.

---

## 7. Problem 6 — IFrame Inside IFrame

D365 dialog boxes sometimes open in a new IFrame that is inside the main content IFrame:

```
page (main browser context)
└── iframe[name="contentIFrame0"]   ← main D365 content
    └── .form-content
        └── .dialog-container
            └── iframe[name="InlineDialog_iframe"]  ← nested dialog IFrame!
                └── .dialog-form-content
                    └── (the actual dialog content)
```

```typescript
// ❌ Won't find elements inside nested IFrame
const mainFrame = page.frameLocator('iframe[name="contentIFrame0"]');
await mainFrame.locator('#dialogButton').click(); // dialog content not here

// ✅ Chain frameLocator calls
const mainFrame = page.frameLocator('iframe[name="contentIFrame0"]');
const dialogFrame = mainFrame.frameLocator('iframe[name="InlineDialog_iframe"]');

// Now you can reach the dialog content
await dialogFrame.locator('.dialog-confirm-button').click();

// Finding the nested IFrame name — browser console script:
// page.frameLocator('iframe[name="contentIFrame0"]')
//   .locator('iframe').evaluateAll(iframes =>
//     iframes.map(f => ({ name: f.name, id: f.id, src: f.src.substring(0, 80) }))
//   );
```

---

## 8. Problem 7 — React StrictMode Double-Render (Dev/Staging Environments)

In development and staging D365 environments, React StrictMode causes effects to run TWICE deliberately. This means elements can flash: appear → disappear → appear again.

```typescript
// What StrictMode does (simplified):
// 1. Mount component → element appears → isVisible() = true
// 2. Unmount component → element disappears → isVisible() = false
// 3. Re-mount component → element appears again → isVisible() = true (for real this time)

// ❌ Sometimes fails: catches element in step 1 (first mount)
await element.waitFor({ state: 'visible' });
// → element briefly disappears in step 2 WHILE PLAYWRIGHT IS INTERACTING
// → "element is not visible" error mid-test

// ✅ Playwright's built-in retry handles this:
// expect().toBeVisible() retries automatically and waits for STABLE visibility
await expect(element).toBeVisible({ timeout: 10000 });
// Playwright retries this assertion internally. If element briefly disappears, it retries.

// ✅ For interactions that need stable element:
await expect(element).toBeVisible();
await element.click(); // Playwright auto-waits for actionability before clicking
```

---

## 9. The Complete D365 Diagnostic Flowchart

```
My D365 locator failed or returned wrong data
                 │
                 ▼
    Does count() return 0?
    (page.locator('...').count())
                 │
         ┌───── YES ─────────────────────────────────────────────┐
         │                                                        │
         ▼                                                        │
  Is element inside an IFrame?                                   │
  (Run browser console IFrame dump script)                       │
         │                                                        │
    ┌─── YES                                                      │
    │    └─► Use frameLocator('iframe[name="..."]').locator(...)  │
    │        If still 0: check for nested IFrame                  │
    │                                                             │
    └─── NO                                                       │
         │                                                        │
         ▼                                                        │
  Has the component rendered yet?                                 │
  (Is this a tab content, dialog, or conditional field?)          │
         │                                                        │
    ┌─── YES: Click the tab/open the dialog first ──────────────►│
    └─── NO: Wrong selector — check data-automation-key dump      │
                                                                  │
    ────────────────────────────────────────────────────────────►│
                                                                  │
    count() returns 1+ but isVisible() = false                    │
                 │                                                │
                 ▼                                                │
    Is element on inactive tab? ─► YES: Click the tab first      │
    Is element display:none? ──► YES: Check for conditional rule  │
    Is element height:0? ──────► YES: Check collapsed section     │
                                                                  │
    count() > 0, isVisible() = true, but textContent is wrong/empty
                 │
                 ▼
    Is this STALE render? ─► YES: Use toHaveText(expectedValue)   │
    Is data still loading? ─► YES: Use not.toHaveText('')          │
    Is spinner still showing? → Wait for spinner to go             │
    Is it OData slow? ──────► toHaveText(expected, {timeout:45000})│
```

---

## 10. Wait Strategy Decision Table

| Situation | Strategy | Code |
|---|---|---|
| Need specific text | Content wait | `await expect(el).toHaveText('Value')` |
| Need any non-empty text | Non-empty wait | `await expect(el).not.toHaveText('')` |
| Text matches pattern | Regex wait | `await expect(el).toContainText('CIT-')` |
| D365 data loading | Spinner then content | `toHaveCount(0)` then `toHaveText()` |
| Check element is in DOM (any state) | Attached wait | `waitFor({ state: 'attached' })` |
| Need to interact with element | Visible wait | `await expect(el).toBeVisible()` |
| Async side effect (eventual consistency) | Polling | `await expect.poll(...)` |
| Custom DOM condition | waitForFunction | `page.waitForFunction(() => ...)` |
| New page loaded (JSP) | Load state | `page.waitForLoadState('domcontentloaded')` |
| **Never use** | Hard sleep | ~~`waitForTimeout(5000)`~~ |

---

## 11. Problem 8 — CommandBar Button Disabled State

D365 command bar buttons can appear enabled but actually be disabled via `aria-disabled` rather than the standard `disabled` attribute. This is a Fluent UI pattern.

```typescript
// ❌ Wrong: only checks HTML 'disabled' attribute
const saveBtn = page.locator('[aria-label="Save"]');
await expect(saveBtn).not.toBeDisabled(); // PASSES even when button is aria-disabled!

// Why: Playwright's .toBeDisabled() checks the HTML 'disabled' attribute.
// Fluent UI buttons use 'aria-disabled="true"' and prevent clicks via JavaScript,
// NOT the HTML disabled attribute.

// ✅ Correct: check aria-disabled attribute explicitly
await expect(saveBtn).toHaveAttribute('aria-disabled', 'false', { timeout: 10000 });
// Or verify it doesn't have aria-disabled set to 'true':
const ariaDisabled = await saveBtn.getAttribute('aria-disabled');
expect(ariaDisabled, 'Save button should not be aria-disabled').not.toBe('true');

// ✅ For verifying a button IS correctly disabled (testing read-only forms):
await expect(saveBtn).toHaveAttribute('aria-disabled', 'true');

// Helper function for D365 CommandBar:
export async function assertCommandBarButton(
  page: import('@playwright/test').Page,
  buttonLabel: string,
  expectedState: 'enabled' | 'disabled'
): Promise<void> {
  const btn = page.locator(`[aria-label="${buttonLabel}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 15_000 });
  const expected = expectedState === 'disabled' ? 'true' : 'false';
  await expect(btn).toHaveAttribute('aria-disabled', expected, { timeout: 10_000 });
}

// Usage:
await assertCommandBarButton(page, 'Save', 'enabled');    // after making an edit
await assertCommandBarButton(page, 'Save', 'disabled');   // on a read-only record
await assertCommandBarButton(page, 'Activate', 'disabled'); // on already-active record
```

---

## 12. Problem 9 — Lookup Field Interaction (Hardest D365 Control)

The D365 Lookup field is the most complex control to automate. It fires OData searches on each keystroke and renders results in a floating panel outside the main DOM hierarchy.

```typescript
// D365 Lookup field interaction sequence:
// 1. Click the lookup field (focus it)
// 2. Type search text (fires OData search)
// 3. Wait for results panel to appear (async OData response)
// 4. Click the desired result item
// 5. Wait for the field to show the selected value (another render cycle)

async function selectLookupValue(
  page:         import('@playwright/test').Page,
  fieldLabel:   string,    // e.g., 'Customer'
  searchText:   string,    // e.g., 'John'
  selectText:   string,    // the result item to click (must match displayed text)
  timeout = 30_000
): Promise<void> {
  const { expect } = await import('@playwright/test');

  // Step 1: Click the lookup input field
  // D365 lookup fields: input role with the field label as aria-label
  const lookupInput = page.getByRole('combobox', { name: fieldLabel });
  await lookupInput.click();
  await lookupInput.clear();

  // Step 2: Type the search text
  await lookupInput.type(searchText, { delay: 100 }); // slight delay to avoid OData debounce

  // Step 3: Wait for the suggestion panel to appear
  // D365 renders suggestions in a listbox that overlays the form
  const suggestionPanel = page.locator('[role="listbox"]');
  await suggestionPanel.waitFor({ state: 'visible', timeout });

  // Step 4: Wait for at least one option to be populated (OData may take 3-5s)
  const targetOption = suggestionPanel.getByRole('option', { name: selectText, exact: false });
  await targetOption.waitFor({ state: 'visible', timeout });

  // Step 5: Click the option
  await targetOption.click();

  // Step 6: Verify the lookup field now shows the selected value
  await expect(lookupInput).toHaveValue(selectText, { timeout: 10_000 });
}

// Usage:
await selectLookupValue(page, 'Customer', 'John', 'John Smith');
await selectLookupValue(page, 'Owner', 'Service', 'Service Team Alpha');

// COMMON FAILURE: typing too fast
// If you use .fill() instead of .type() with delay, OData may not fire a search
// because .fill() doesn't dispatch keyboard events that trigger the lookup.
// Always use .type() with a small delay for D365 lookup fields.
```

---

## 13. OData Request Interception — Speed Up Specific Tests

For tests that don't need real Dataverse data (e.g., UI layout tests), intercept OData calls and return mock data to avoid 8–12 second data load times:

```typescript
// Use ONLY for tests that verify UI behaviour, not data correctness
test('Citation form shows validation errors when required fields are empty', async ({ page }) => {
  // Intercept the OData call that loads the form's lookup options
  // This makes the form load instantly instead of waiting 8 seconds
  await page.route('**/api/data/v9.2/citations**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        '@odata.context': '...',
        value: [],  // empty data — we're testing the FORM, not the data
      }),
    });
  });

  await page.goto('/citations/new');
  // Form loads immediately (no 8-second OData wait)
  await expect(page.locator('[data-automation-key="name"]')).toBeVisible({ timeout: 5000 });

  // Test the UI validation behaviour:
  await page.click('[aria-label="Save"]');
  await expect(page.locator('.ms-MessageBar--error')).toBeVisible({ timeout: 5000 });
  // Verify the required field error message appears
});

// Pattern: intercept specific OData entities by entity name
const oDataRoutePattern = '**/api/data/v9.2/cr123_citations*';
await page.route(oDataRoutePattern, route => route.fulfill({
  status:      200,
  contentType: 'application/json',
  body:        JSON.stringify({ value: mockedCitations }),
}));

// When to use OData interception:
//   ✅ UI layout / rendering tests
//   ✅ Validation / error state tests
//   ✅ Conditional field logic (show/hide rules)
// When NOT to use it:
//   ❌ End-to-end data flow tests (need real Dataverse)
//   ❌ Tests that verify data was saved correctly
//   ❌ Tests that test search/filter behaviour
```

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Which wait strategy?

A D365 form loads. You need to assert that a "Customer Name" field shows "John Smith". The field is definitely visible. Which is correct?

A) `await expect(nameField).toBeVisible()`  
B) `await expect(nameField).toHaveText('John Smith', { timeout: 30000 })`  
C) `await nameField.waitFor({ state: 'visible' }); const txt = await nameField.textContent();`  
D) `await page.waitForTimeout(5000); const txt = await nameField.textContent();`  

<details><summary>Answer</summary>

**B** — `toHaveText('John Smith', { timeout: 30000 })` waits until the field specifically contains "John Smith". This handles the two-phase render: if the field loads empty first, this keeps retrying until the text arrives.

A = only verifies visibility, doesn't check text. C = reads text immediately after `waitFor` — the element is visible but might still show "" from phase 1. D = hard sleep (never acceptable).
</details>

---

### Challenge 2 [Spot the Bug]

```typescript
async function getCustomerStatus(page: Page): Promise<string> {
  const statusLocator = page.locator('[data-automation-key="statecode"]');
  await statusLocator.waitFor({ state: 'visible' });
  return (await statusLocator.textContent()) ?? '';
}

// In the test:
const status = await getCustomerStatus(page);
expect(status).toBe('Active'); // fails 40% of the time with status = ''
```

<details><summary>Answer</summary>

`waitFor({ state: 'visible' })` passes when the `statecode` element is visible — which happens after React's phase 1 render (shell with empty text). The `textContent()` call then reads `""` before the OData data arrives.

Fix:
```typescript
async function getCustomerStatus(page: Page): Promise<string> {
  const statusLocator = page.locator('[data-automation-key="statecode"]');
  // Wait for non-empty text instead of just visibility
  await expect(statusLocator).not.toHaveText('', { timeout: 30000 });
  return (await statusLocator.textContent() ?? '').trim();
}
```

Or if you know the expected value:
```typescript
await expect(statusLocator).toHaveText('Active', { timeout: 30000 });
```
</details>

---

### Challenge 3 [Write It Yourself]

Write a reusable `waitForD365GridToLoad(page, minRows)` function that:
1. Waits for any `.ms-Spinner` to disappear
2. Waits for at least `minRows` rows to appear
3. Waits for the first row's first data cell to have non-empty text
4. Accepts a configurable timeout (default: 45 seconds)

<details><summary>Answer</summary>

```typescript
async function waitForD365GridToLoad(
  page: import('@playwright/test').Page,
  minRows: number = 1,
  timeout: number = 45000
): Promise<void> {
  const { expect } = await import('@playwright/test');

  // Step 1: Spinner must disappear
  await expect(
    page.locator('.ms-Spinner')
  ).toHaveCount(0, { timeout });

  // Step 2: Minimum row count must be met
  await expect(
    page.locator('.ms-DetailsList-row')
  ).toHaveCount({ minimum: minRows } as never, { timeout });
  // Alternative using toHaveCount minimum (if your Playwright version supports it):
  // Or use: await expect(page.locator('.ms-DetailsList-row').nth(minRows - 1)).toBeVisible({ timeout });

  // Step 3: First row's data cell must have non-empty text
  const firstDataCell = page.locator('.ms-DetailsList-row').first().locator('[data-automation-key]').first();
  await expect(firstDataCell).not.toHaveText('', { timeout: 10000 });
}

// Usage:
await adminPortal.goto();
await waitForD365GridToLoad(page, 5); // wait for at least 5 rows with data
```
</details>

---

### Challenge 4 [CommandBar + Lookup]

Write the test steps (as pseudocode or real Playwright code) for this scenario: Open a D365 citation record → set the Owner lookup to "Support Team Alpha" → click Save → verify the Save button becomes disabled (record saved) → verify the Owner field shows "Support Team Alpha" after save.

<details><summary>Answer</summary>

```typescript
test('Set citation owner to Support Team Alpha', async ({ page, account }) => {
  const data = {
    ownerSet:  false,
    savedOk:   false,
  };

  await test.step('Open citation record', async () => {
    await page.goto(`${process.env.D365_URL}/citations/${testCitationId}`);
    await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 30_000 });
    // Wait for the record name to confirm correct record loaded
    await expect(page.locator('[data-automation-key="name"]')).not.toHaveText('', { timeout: 30_000 });
  });

  await test.step('Set Owner lookup to Support Team Alpha', async () => {
    await selectLookupValue(page, 'Owner', 'Support', 'Support Team Alpha');
    data.ownerSet = true;
  });

  await test.step('Save the record', async () => {
    await page.locator('[aria-label="Save"]').click();
    // Save button should become aria-disabled='true' after successful save
    await assertCommandBarButton(page, 'Save', 'disabled');
    data.savedOk = true;
  });

  await test.step('Verify Owner field after save', async () => {
    // After save: the lookup field should show the saved value
    const ownerField = page.getByRole('combobox', { name: 'Owner' });
    await expect(ownerField).toHaveValue('Support Team Alpha', { timeout: 15_000 });
  });
});
```

Key points:
- Wait for spinner gone + field non-empty to confirm page loaded
- Use `selectLookupValue` (type + wait for listbox + click option)
- After save: `assertCommandBarButton('Save', 'disabled')` — NOT `.toBeDisabled()` (Fluent UI uses aria-disabled)
- Wait for the lookup field value to update after save (another render cycle)
</details>

---

### Challenge 5 [OData Interception]

Your D365 test suite has 40 tests that navigate to the Citations list view. Each test waits 8–12 seconds for Dataverse to load citations data. Total suite time: 6–8 minutes just in data load waits. What's the correct strategy?

<details><summary>Answer</summary>

**Split the tests into two groups:**

**Group 1: Data-dependent tests (keep real OData)**
- Citation search by status, amount range, date
- Tests that verify data was created/updated correctly
- Tests that verify filter/sort behaviour
- These MUST use real Dataverse (cannot mock)

**Group 2: UI-only tests (mock OData)**
- Form layout and field visibility tests
- CommandBar button state tests (enabled/disabled)
- Conditional field show/hide rule tests
- Validation error message tests
- These can use `page.route()` to intercept OData and return minimal mock data instantly

```typescript
// globalSetup or a shared fixture:
export const interceptODataForUITests = async (page: Page) => {
  await page.route('**/api/data/v9.2/cr123_citations*', route => {
    route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify({ value: [minimalCitationMock] }),
    });
  });
};

// Apply it in tests tagged @ui-only:
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.tags.includes('@ui-only')) {
    await interceptODataForUITests(page);
  }
});
```

Result: Group 2 tests load in <2 seconds. Group 1 tests take the full time but are fewer. Expected suite time reduction: 60-70%.
</details>

---

## 14. OData Response-Time Measurement — Distinguish Load vs. Regression

Measure actual Dataverse response times in tests and attach them to the Playwright report. This lets you distinguish "expected 8s load" from "new 20s regression":

```typescript
// utils/odata-performance.util.ts

interface ODataCallMetric {
  url:          string;
  entity:       string;
  durationMs:   number;
  statusCode:   number;
  rowCount:     number | null;
}

export async function measureODataCalls(
  page: import('@playwright/test').Page,
  action: () => Promise<void>,
  entityFilter?: string   // optional: only measure calls for specific entity
): Promise<ODataCallMetric[]> {
  const metrics: ODataCallMetric[] = [];
  const timings = new Map<string, number>(); // url → start time

  page.on('request', req => {
    if (req.url().includes('/api/data/v9.2/')) {
      if (!entityFilter || req.url().includes(entityFilter)) {
        timings.set(req.url(), Date.now());
      }
    }
  });

  page.on('response', async resp => {
    const startTime = timings.get(resp.url());
    if (startTime === undefined) return;

    const durationMs = Date.now() - startTime;
    let rowCount: number | null = null;

    try {
      const body = await resp.json().catch(() => null);
      rowCount = Array.isArray(body?.value) ? body.value.length : null;
    } catch { /* response not JSON */ }

    const entityMatch = resp.url().match(/\/api\/data\/v9\.2\/([^?$/]+)/);
    metrics.push({
      url:        resp.url().substring(0, 100),
      entity:     entityMatch?.[1] ?? 'unknown',
      durationMs,
      statusCode: resp.status(),
      rowCount,
    });
  });

  await action();
  return metrics;
}

// Usage in a test:
test('Citations grid loads within acceptable OData thresholds', async ({ page }) => {
  const metrics = await measureODataCalls(
    page,
    async () => {
      await page.goto(`${process.env.D365_URL}/citations`);
      await expect(page.locator('.ms-DetailsList-row').first()).toBeVisible({ timeout: 45_000 });
    },
    'cr123_citations'  // only measure citation entity calls
  );

  // Attach timing report to the test artifact
  await test.info().attach('odata-timing', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  });

  // Enforce SLA thresholds:
  const slowCalls = metrics.filter(m => m.durationMs > 15_000);
  expect(
    slowCalls,
    `OData calls exceeding 15s threshold: ${JSON.stringify(slowCalls.map(m => ({ entity: m.entity, ms: m.durationMs })))}`
  ).toHaveLength(0);

  // Warn (but don't fail) if any call exceeds 8s:
  const warnCalls = metrics.filter(m => m.durationMs > 8_000);
  if (warnCalls.length > 0) {
    console.warn(`[odata-perf] Slow calls (>8s): ${JSON.stringify(warnCalls.map(m => ({ entity: m.entity, ms: m.durationMs })))}`);
  }
});
```

```
// Interpretation guide:
//
// Duration  | Classification
// --------- | -----------------------------------------------
// < 3s      | Excellent — standard Dataverse
// 3–8s      | Normal — expected for large entity sets
// 8–15s     | Slow — investigate query filters, indexes
// > 15s     | SLA breach — fail the test, file a defect
// Timeout   | Critical — likely Dataverse throttling (429)
//
// In CI: attach the JSON metrics artifact to every run.
// Compare P95 across 30 CI runs to detect regressions.
```

---
**Navigation**: [← Chapter 16: StorageState Chaining](./16_CrossSite_Pattern6_StorageState_Chaining.md) | [Index](../00_INDEX.md) | [→ Chapter 18: Mega POM Architecture](../04_Enterprise_Architecture/18_Mega_POM_Architecture.md)
