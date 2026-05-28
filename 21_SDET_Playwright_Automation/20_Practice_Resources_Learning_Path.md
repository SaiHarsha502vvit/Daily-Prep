# 20. Real-World Practice Sites, Open Source Repos & Learning Resources

**Navigation**: [← Chapter 19: Console Scripts & Security](19_Advanced_Console_Scripts_Security.md) | [Index](00_INDEX.md)

**Cross-links:**
- [`QUIZ_01_Playwright_MCQ.md`](QUIZ_01_Playwright_MCQ.md) — Test your knowledge after practice
- [`17_D365_Advanced_Timing_Patterns.md`](17_D365_Advanced_Timing_Patterns.md) — Apply timing patterns on practice sites

---

## 5W1H

- **WHAT**: A curated, explained set of practice websites, open source repos, Playwright resources, and structured 10-week challenges — all specifically chosen to mirror your D365/JSP/ASPX/API work environment.
- **WHY**: Reading theory without practice is 30% as effective as reading + doing. Every concept in Chapters 01–19 needs to be applied against a real running application.
- **WHO**: You — the SDET learning Playwright, D365, API testing, and POM architecture.
- **WHEN**: Alongside your 1-hour daily study sessions. Challenges map to the weekly rotation in the daily path.
- **HOW**: Install the apps, write your own automation frameworks against them, compare with the open source examples.

---

## SECTION 1 — Practice Websites (Mirroring Your Stack)

### 1. Dynamics 365 — Free Trial (Your Exact Environment)

**URL**: https://www.microsoft.com/en-us/dynamics-365/free-trial  
**Closest to your work**: ⭐⭐⭐⭐⭐

The Microsoft 365 Developer Program gives you a free sandbox with:
- Full D365 Sales/Customer Service
- Dataverse backend (the OData API)
- React + Fluent UI components — identical to your production environment

**How to get it:**
1. Go to https://developer.microsoft.com/en-us/microsoft-365/dev-program
2. Click "Join Now" (free)
3. Set up a Developer Sandbox (25 user licences, 90 days renewable)
4. Enable Dynamics 365 Trial from the M365 Admin Center

**Practice tasks:**
- Write a `ContactsPage` POM for the Contacts module
- Automate: create a new Contact → verify it appears in the grid
- Automate: use the CommandBar to run a specific command (watch for `menuitem` role)
- Write a `waitForD365GridToLoad` helper and test it against the Accounts grid

---

### 2. OrangeHRM Demo — SPA Similar to CRM

**URL**: https://opensource-demo.orangehrmlive.com  
**Login**: admin / admin123  
**Closest to your work**: ⭐⭐⭐⭐ (SPA, dynamic content, tables, forms)

OrangeHRM is an HR management system built as a SPA with Vue.js. It has:
- Login with session management (test storageState)
- Data tables with sorting, filtering, pagination (like D365 grids)
- Complex forms with validation
- Admin panel (manage users) + Employee panel — dual-role scenario

**Practice tasks:**
- Write a full POM for the Employee List page (table with 200+ employees)
- Write a `EmployeeList_ResultsGrid` component POM
- E2E test: Admin creates employee → employee logs in → employee views their profile
- Dual context: admin changes a setting → employee sees the change

---

### 3. The Internet Herokuapp — 30 Dedicated Test Scenario Pages

**URL**: https://the-internet.herokuapp.com  
**Closest to your work**: ⭐⭐⭐ (covers specific scenarios you encounter daily)

30 separate pages, each testing one specific automation challenge:

| Page | Maps to Your Work | Challenge |
|---|---|---|
| `/frames` | D365 IFrame content | Automate a form INSIDE an IFrame |
| `/dynamic_loading` | D365 two-phase render | Wait correctly without `waitForTimeout` |
| `/dynamic_controls` | D365 conditional fields | Handle elements appearing/disappearing |
| `/windows` | New tab handling | Implement Pattern 2 (Chapter 12) correctly |
| `/javascript_alerts` | JSP form confirms | Handle `dialog` events |
| `/shadow_dom` | Web Components | Use shadow DOM piercer script |
| `/upload` | File attachment in CRM | `page.setInputFiles()` |
| `/drag_and_drop` | D365 drag-reorder | `dragAndDrop()` API |
| `/infinite_scroll` | Large D365 grids | Scroll + wait for new rows |
| `/tables` | Any sortable grid | Get specific cell values by row+column |
| `/checkboxes` | D365 checkboxes | `check()`, `uncheck()`, verify `isChecked()` |
| `/hovers` | D365 hover menus | `hover()` then wait for menu |
| `/redirect_link` | SSO redirects | Track redirect URL, verify final landing |
| `/status_codes` | API response codes | Verify 200/401/403/404 from browser |

---

### 4. ReqRes.in — Mock REST API

**URL**: https://reqres.in  
**Closest to your work**: ⭐⭐⭐⭐ (REST API practice with realistic JSON)

A publicly available REST API that returns realistic JSON responses. No auth setup needed for reads.

```typescript
// Practice target: write a complete typed API test suite

interface ReqResUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

interface ReqResListResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: ReqResUser[];
  support: { url: string; text: string };
}
```

**Practice tasks:**
- Write `ReqResApiClient.ts` with fully typed methods: `getUsers(page)`, `getUserById(id)`, `createUser(data)`, `updateUser(id, data)`, `deleteUser(id)`
- Write assertions for paginated responses (Chapters 5 + 7 patterns)
- Test error cases: `getUserById(9999)` → verify 404 handling
- Write `test.each` test covering all CRUD operations

---

### 5. JSONPlaceholder — Deeply Nested JSON Practice

**URL**: https://jsonplaceholder.typicode.com  
**Closest to your work**: ⭐⭐⭐⭐ (nested JSON like your API responses)

Provides deeply nested data:
- `/users` → each user has `address.geo.lat`, `address.city`
- `/posts` → each post has `userId`
- `/comments` → each comment has `postId`
- `/albums` → each album has `userId`
- `/photos` → each photo has `albumId`

**Practice tasks (Chapter 7 patterns):**
```typescript
// Challenge 1: Get all posts for a user and verify each post has their userId
const user = await request.get('https://jsonplaceholder.typicode.com/users/1');
const posts = await request.get('https://jsonplaceholder.typicode.com/posts?userId=1');
const postsJson = await posts.json();
expect(postsJson.every((p: { userId: number }) => p.userId === 1)).toBe(true);

// Challenge 2: Get a post's comments and verify each comment has an email
const comments = await request.get('https://jsonplaceholder.typicode.com/comments?postId=1');
const commentsJson = await comments.json();
expect(commentsJson).toContainEqual(
  expect.objectContaining({ email: expect.stringContaining('@') })
);
```

---

### 6. DemoQA — Complex UI Components

**URL**: https://demoqa.com  
**Closest to your work**: ⭐⭐⭐ (complex form components, date pickers, tables)

- **Tables**: Sortable, editable grids — like D365 sub-grids
- **Date Picker**: Calendar widgets — like D365 date fields
- **Drag and Drop**: List reordering
- **Alerts/Popups**: Browser-level dialogs
- **Accordion**: Collapsed/expanded sections (like D365 form sections)

**Practice task:** Write a POM for the DemoQA `Web Tables` page with:
- `addNewRecord(data)` method
- `searchByName(name)` method
- `editRow(name, newData)` method
- `deleteRow(name)` method

---

### 7. OWASP WebGoat — Security Practice (Local)

**Setup:** (Docker required)
```bash
docker run -p 8080:8080 -p 9090:9090 webgoat/goat-and-wolf
# Access: http://localhost:8080/WebGoat
# Register any user account
```

**What it is:** A deliberately insecure web application for security testing practice.

**Practice tasks using Chapter 19 scripts:**
- Run the Cookie Security Audit script on WebGoat
- Run the Auth Enforcement test
- Find ID patterns in URLs, test IDOR
- Run the XSS tester on WebGoat's search forms (it IS vulnerable by design)
- Write a Playwright security test suite that documents WebGoat's vulnerabilities

---

## SECTION 2 — Open Source Repos to Study

### 1. `microsoft/playwright` (The Framework Itself)

**URL**: https://github.com/microsoft/playwright  
**Why read it:** Understanding internals makes you write better tests.

**Files to read:**
- `packages/playwright-core/src/client/page.ts` — How `Page` object works
- `packages/playwright-core/src/client/locator.ts` — How Locator's auto-waiting works
- `packages/playwright-test/src/common/fixtures.ts` — How `test.extend` works internally
- `docs/src/api/class-page.mdx` — The complete API (bookmark this)

---

### 2. `microsoft/fluentui` (D365's UI Library)

**URL**: https://github.com/microsoft/fluentui  
**Why read it:** Explains why D365 elements have the ARIA roles they do.

**Files to read:**
- `packages/react-components/react-button/src/Button.tsx` — Why `menuitem` vs `button`
- `packages/react-components/react-pivot/src/Pivot.tsx` — How tabs work (aria-selected)
- `packages/react-components/react-spinner/src/Spinner.tsx` — What triggers the spinner

---

### 3. `OrangeHRM/orangehrm` (Full Stack Practice App)

**URL**: https://github.com/orangehrm/orangehrm  
**Why use it:** Clone locally, write your own automation framework against a real codebase.

**Practice:** Set up OrangeHRM locally → write 10 tests from scratch → compare your POM structure with the framework patterns you've learned.

---

### 4. Community Playwright Framework Examples

**`testla-program/testla-playwright`**  
URL: https://github.com/testla-program/testla-playwright  
D365 + Playwright examples. Read their D365 page objects for comparison.

**`raptatinha/tau-playwright-workshop`**  
URL: https://github.com/raptatinha/tau-playwright-workshop  
Production-grade workshop with complete POM + fixture architecture. Follow along.

---

## SECTION 3 — Curated Official Documentation

### Playwright Docs — Pages You MUST Read (Not All of Them)

| Page | Why Read It | URL |
|---|---|---|
| **Locators** | The complete locator guide — all strategies | playwright.dev/docs/locators |
| **Actionability** | What Playwright checks BEFORE clicking/filling | playwright.dev/docs/actionability |
| **Auto-waiting** | How Playwright waits — and when it doesn't | playwright.dev/docs/actionability#waiting |
| **Test fixtures** | The complete fixture system | playwright.dev/docs/test-fixtures |
| **Authentication** | storageState, globalSetup | playwright.dev/docs/auth |
| **Network** | Interception, mocking, waitForResponse | playwright.dev/docs/network |
| **Page Object Models** | Official Playwright POM guide | playwright.dev/docs/pom |
| **Parallelism** | Workers, sharding, projects | playwright.dev/docs/test-parallel |

### TypeScript Handbook — Critical Sections for SDETs

| Section | Why |
|---|---|
| **Narrowing** | How to safely narrow `unknown` API response types |
| **Utility Types** | `Pick`, `Omit`, `Partial` for POM interfaces |
| **Template Literal Types** | Typed API endpoint strings |
| **Generics** | How `test.extend<Fixtures>()` works internally |

---

## SECTION 4 — 10-Week Structured Practice Challenges

Each challenge is designed to take exactly 1 hour (matches the daily path):

### Week 1: OrangeHRM — Login POM
Write a `LoginPage.ts` POM for OrangeHRM:
- Username/password inputs + login button
- Error message locator
- `login(username, password)` method
- `verifyLoginSuccessful()` method

### Week 2: OrangeHRM — Employee List POM with Component Split
Split into: `EmployeeListPage.ts` (orchestrator) + `EmployeeListGrid.ts` (component)
- Grid row locators, search input, sort headers
- `waitForGridLoad()`, `searchByName()`, `getRowCount()`

### Week 3: The Internet — IFrame Form
Go to `https://the-internet.herokuapp.com/frames`
Write a POM for the frame-based page that uses `frameLocator()` correctly.

### Week 4: The Internet — Dynamic Loading
Go to `https://the-internet.herokuapp.com/dynamic_loading/1`
Write a correct wait strategy (no `waitForTimeout`). Time how long it takes.
Verify your test is faster AND more reliable than one with `waitForTimeout(5000)`.

### Week 5: ReqRes.in — Full Typed API Suite
Write `ReqResApiClient.ts` with typed interfaces for every endpoint.
Write 8 API tests: GET list, GET single, POST create, PUT update, PATCH, DELETE, 404 handling, auth.

### Week 6: JSONPlaceholder — Nested Assertion Practice
Write 5 tests using the Chapter 7 assertion patterns:
- `toContainEqual`, `arrayContaining`, `objectContaining`
- Custom `expect.extend` with a `toBeValidUser()` matcher

### Week 7: DemoQA — Web Tables POM
Write a full POM for the DemoQA Web Tables page.
Test: add → search → edit → delete a record. Full CRUD.

### Week 8: OrangeHRM — Cross-Role E2E
Implement Pattern 3 (Dual Browser Context):
- Context A: admin creates an employee
- Context B: that employee logs in and sees their profile

### Week 9: The Internet + Sauce Demo — New Tab + Side Effects
- Sauce Demo: full checkout E2E using Pattern 5 (verify side effects via mocked API call)
- The Internet `/windows`: implement Pattern 2 (new tab handling) correctly

### Week 10: WebGoat — Security Test Suite
Run ALL security scripts from Chapter 19 against WebGoat.
Write a Playwright test file: `security.spec.ts` with 5 security tests.

---

## SECTION 5 — Online Resources

### Video (Free)
- **Playwright YouTube Channel** (Official): search "Playwright YouTube" — release notes, feature demos
- **Fireship**: "TypeScript in 100 seconds" and "Playwright in 100 seconds" — quick overviews
- **Jack Herrington**: Advanced TypeScript patterns (generics, utility types)

### Reading (Free)
- **Playwright Blog** (playwright.dev/blog): Release notes with new feature explanations
- **Testing Playground** (testing-playground.com): Paste HTML, find the best Playwright selector interactively
- **Regex101** (regex101.com): Build and test your XPath/regex patterns with explanation

### Practice Platforms
- **TestingChallenges.dev**: Free interactive test automation challenges
- **Awesome QA** (github.com/TesterR/awesome-qa): Curated list of QA resources

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Best Practice Site for D365 Practice

Which resource gives you the most realistic practice environment for your D365 testing work?

A) Sauce Demo — it has a shopping cart and checkout flow  
B) The Internet Herokuapp — it has 30 specific test scenarios  
C) Microsoft 365 Developer Program — free D365 sandbox with full Fluent UI and Dataverse  
D) JSONPlaceholder — it has REST APIs with realistic data  

<details><summary>Answer</summary>

**C** — The Microsoft 365 Developer Program gives you the ACTUAL Dynamics 365 environment: same React + Fluent UI components, same Dataverse OData backend, same CommandBar with `menuitem` ARIA roles. Every pattern from Chapters 10, 17 is directly applicable. The others are valuable for different things, but none mirror your D365 work environment.
</details>

---

### Challenge 2 [Spot the Bug — Practice Approach]

A junior SDET on your team sets up OrangeHRM practice like this:

```typescript
test('OrangeHRM: admin creates employee', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  await page.locator('input[placeholder="Username"]').fill('admin');
  await page.locator('input[placeholder="Password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  // ... rest of test
});
```

Three things are wrong here. Find them all.

<details><summary>Answer</summary>

1. **`waitForTimeout(3000)`** — hard sleep. Should be `await expect(page.locator('.oxd-topbar-header')).toBeVisible()` or `await page.waitForURL(/dashboard/)`

2. **No POM** — all locators are inline. The point of practice is to write a proper `LoginPage.ts` POM.

3. **No storageState** — logging in manually in every test. Should use `globalSetup.ts` to save the login state once, then load it via `storageState` in tests.

Refactored:
```typescript
// globalSetup.ts saves auth, playwright.config.ts loads it
test('admin creates employee', async ({ page }) => {
  // Start already logged in — no login needed in test body
  const adminPortal = new OrangeHRMAdminPage(page);
  await adminPortal.goto();
  // ... create employee
});
```
</details>

---

### Challenge 3 [Write It Yourself]

Write a `ReqResApiClient` method `createUser(name: string, job: string)` that:
1. POSTs to `https://reqres.in/api/users` with `{ name, job }`
2. Returns a typed `CreatedUser` interface: `{ id: string; name: string; job: string; createdAt: string }`
3. Throws a descriptive error if the response is not 201

<details><summary>Answer</summary>

```typescript
interface CreatedUser {
  id: string;
  name: string;
  job: string;
  createdAt: string;
}

export class ReqResApiClient {
  constructor(
    private readonly request: import('@playwright/test').APIRequestContext
  ) {}

  async createUser(name: string, job: string): Promise<CreatedUser> {
    const response = await this.request.post('https://reqres.in/api/users', {
      data: { name, job },
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status() !== 201) {
      throw new Error(
        `createUser failed: expected 201 but got ${response.status()} — ${await response.text()}`
      );
    }

    const body = await response.json() as CreatedUser;

    if (!body.id || !body.createdAt) {
      throw new Error(`createUser response missing required fields: ${JSON.stringify(body)}`);
    }

    return body;
  }
}

// Usage in test:
test('create user returns 201 with id and timestamp', async ({ request }) => {
  const client = new ReqResApiClient(request);
  const user = await client.createUser('Test User', 'SDET');
  expect(user.name).toBe('Test User');
  expect(user.job).toBe('SDET');
  expect(user.id).toBeTruthy();
  expect(new Date(user.createdAt).getFullYear()).toBe(new Date().getFullYear());
});
```
</details>

### Challenge 4 [Skill Gap → Practice Site Mapping]

You have identified specific weak areas from your chapter reviews. Match each skill gap to the correct practice site and task:

| Skill Gap | Best Practice Site | Specific Task |
|---|---|---|
| Flaky tests from timing issues | The Internet `/dynamic_loading` | Rewrite the wait with `toHaveText` instead of `waitForTimeout` |
| Cannot write typed API tests | ReqRes.in | Write all 6 CRUD methods with typed interfaces |
| Never practiced dual-context E2E | OrangeHRM | Admin creates employee → employee logs in and verifies |
| IFrame locators not working | The Internet `/frames` | Write `frameLocator()` chain for nested IFrame |
| storageState not used in practice | OrangeHRM | Add `globalSetup.ts` + load state in `playwright.config.ts` |
| POM growing too large | OrangeHRM | Split `EmployeeListPage.ts` into Orchestrator + `ResultsGrid.ts` |
| No security testing experience | WebGoat (Docker) | Run CDP HttpOnly audit + rate limit test from Chapter 19 |
| D365-specific waits unknown | M365 Dev Sandbox | Write `waitForD365GridToLoad()` against real Contacts grid |
| Deep JSON assertions not practiced | JSONPlaceholder | Write `toContainEqual` + `objectContaining` tests for `/users` |

<details><summary>How to use this table</summary>

After each study session, mark which chapter you just completed. Check if that chapter has a matching skill gap row above. If yes — open the practice site immediately and complete that specific task before moving to the next chapter.

Example workflow:
1. Read Chapter 13 (API Testing)
2. Go to ReqRes.in
3. Write `ReqResApiClient.ts` with typed CRUD methods
4. Write 4 tests that cover GET, POST, PUT, DELETE
5. Verify all pass
6. THEN move to Chapter 14

This "read → apply → verify" loop is what separates SDETs who retain knowledge from those who don't.

</details>

---

## SECTION 6 — Completion Self-Assessment Checklist

Before claiming you have completed the Playwright SDET curriculum, verify you can do each of these from memory (no notes):

**Foundation (Chapters 01–05)**
- `[ ]` Write a POM with constructor, typed locators, and navigation method
- `[ ]` Use `getByRole`, `getByLabel`, `getByTestId`, `locator()` correctly
- `[ ]` Chain `filter({ hasText })` and `nth()` on a locator
- `[ ]` Write a custom fixture with `test.extend` and `scope: 'worker'`

**API & Cross-Site (Chapters 06–16)**
- `[ ]` Write a typed API client with error handling
- `[ ]` Assert deeply nested JSON with `objectContaining` and `arrayContaining`
- `[ ]` Write a `globalSetup.ts` that logs in 3 roles in parallel and saves storageState
- `[ ]` Write a worker-scoped fixture that checks JWT `exp` and refreshes proactively
- `[ ]` Implement dual browser context (two users, one test)

**D365 & Enterprise (Chapters 17–19)**
- `[ ]` Explain the 3-phase D365 render and name the correct wait for each phase
- `[ ]` Write `assertCommandBarButton(page, 'Save', 'disabled')` using `aria-disabled`
- `[ ]` Write a `selectLookupValue()` function that handles OData debounce
- `[ ]` Write a Playwright security test using CDP to verify HttpOnly flag
- `[ ]` Split a 500-line POM into Orchestrator + 2 Component classes without breaking tests

**If you cannot do any item above without notes:** go back to that chapter's challenges and practice until you can.

---
**Navigation**: [← Chapter 19: Console Scripts & Security](19_Advanced_Console_Scripts_Security.md) | [Index](00_INDEX.md)
