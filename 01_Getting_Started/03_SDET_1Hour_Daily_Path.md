# The 1-Hour Daily SDET & Architecture Path

**Navigation**: [Index](../00_MASTER_INDEX.md) | [← Back to Study Calendar](02_Study_Plan_Calendar.md)

---

## 5W1H — Why This Schedule?

- **WHAT**: A focused, 5-days-a-week study schedule designed strictly around a 1-hour daily time limit.
- **WHY**: Working as an SDET on complex systems (Dynamics 365, JSP apps, ASPX apps, SOAP APIs) is mentally exhausting. Trying to study 4 hours a day leads to burnout. 1 hour of _deep, unbroken focus_ yields massive results over a year.
- **WHO**: New-to-mid SDETs looking to master Playwright automation, TypeScript, API testing, SQL, and architecture.
- **WHEN**: Start this immediately.
- **HOW**: By rotating through 5 specific domains (one for each day of the week) using the materials in this repository.

---

## 1. The Rules of the 1-Hour Limit

1. **Set a Timer:** When 60 minutes is up, you stop. Even if you are in the middle of a problem. Close the laptop. This builds urgency and prevents burnout.
2. **Active Recall Only:** Do not spend the hour "reading" passively. Read a section, hide it, and type out the code or explanation from memory. If you can't, you didn't learn it.
3. **Weekends are OFF:** Rest your brain. Your subconscious needs time to organise the information.

---

## 2. The Weekly Rotation — 10-Week Full Cycle

This schedule uses **Spaced Repetition** across 5 domains. Each week you visit each domain once but go deeper each time.

---

### 🔵 MONDAY: TypeScript & Playwright Architecture

**Goal:** Stop fighting the framework. Understand async, types, and POM deeply enough to debug any test.

| Week | 60-Min Focus                                                | Chapter Link                                                                                           |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1    | JS essentials — async/await, `forEach` trap, ES6            | [04_JS_TS_For_Automation](../21_SDET_Playwright_Automation/04_JS_TS_For_Automation.md) Part 1          |
| 2    | async/await deep dive — `Promise.all`, typed returns        | [04_JS_TS_For_Automation](../21_SDET_Playwright_Automation/04_JS_TS_For_Automation.md) Part 2-3        |
| 3    | POM patterns — lazy eval, `as const`, typed dicts           | [05_POM_Architecture_Deep_Dive](../21_SDET_Playwright_Automation/05_POM_Architecture_Deep_Dive.md)     |
| 4    | Custom Fixtures — `test.extend`, `scope:worker`, `yield`    | [06_Custom_Fixtures_Architecture](../21_SDET_Playwright_Automation/06_Custom_Fixtures_Architecture.md) |
| 5    | E2E Architecture — 15-step skeleton, Data Accumulator       | [07_test_step_E2E_Architecture](../21_SDET_Playwright_Automation/07_test_step_E2E_Architecture.md)     |
| 6    | Parallel Execution — Workers, data collision, `test.serial` | [09_Parallel_Execution_Workers](../21_SDET_Playwright_Automation/09_Parallel_Execution_Workers.md)     |
| 7    | TypeScript Advanced — generics, `Record`, enums             | [17_TypeScript/02_TS_Advanced_Types](../17_TypeScript/02_TS_Advanced_Types.md)                         |
| 8    | TypeScript Patterns — class design, access modifiers        | [17_TypeScript/03_TS_Patterns_BestPractices](../17_TypeScript/03_TS_Patterns_BestPractices.md)         |
| 9    | Playwright Basics review + config deep dive                 | [01_Playwright_TS_Basics](../21_SDET_Playwright_Automation/01_Playwright_TS_Basics.md)                 |
| 10   | Playwright Library: `browser`, `context`, `page` lifecycle  | [17_TypeScript/04_TS_Deep_Reasoning](../17_TypeScript/04_TS_Deep_Reasoning.md)                         |

---

### 🟢 TUESDAY: Browser Internals & Enterprise UI Testing

**Goal:** Understand WHY elements can't be found and HOW to write waits that never time out unnecessarily.

| Week | 60-Min Focus                                                 | Chapter Link                                                                                                    |
| ---- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1    | Browser rendering pipeline — 4 trees overview                | [16_JavaScript/09_Browser_Internals_Rendering](../16_JavaScript/09_Browser_Internals_Rendering.md) Sections 1-3 |
| 2    | Browser Internals for SDETs — D365 two-phase render          | [08_Browser_Internals_for_SDETs](../21_SDET_Playwright_Automation/08_Browser_Internals_for_SDETs.md)            |
| 3    | Enterprise Locators — XPath axes, chaining, filtering        | [02_Enterprise_Locators_XPath](../21_SDET_Playwright_Automation/02_Enterprise_Locators_XPath.md)                |
| 4    | Browser Console Scripting — DOM scripts, XPath finder        | [03_Browser_Console_Scripting](../21_SDET_Playwright_Automation/03_Browser_Console_Scripting.md)                |
| 5    | Dynamics 365 — IFrames, `.ms-*` classes, menuitem trap       | [10_Dynamics365_CRM_Testing](../21_SDET_Playwright_Automation/10_Dynamics365_CRM_Testing.md) Sections 1-4       |
| 6    | Dynamics 365 — data-automation-key, console scripts, tab nav | [10_Dynamics365_CRM_Testing](../21_SDET_Playwright_Automation/10_Dynamics365_CRM_Testing.md) Sections 5-8       |
| 7    | React rendering — how SPA components re-render               | [15_React_Frontend/01_React_Fundamentals](../15_React_Frontend/01_React_Fundamentals.md)                        |
| 8    | CSS selectors — specificity, pseudo-classes                  | [18_CSS_Complete/01_CSS_Foundations](../18_CSS_Complete/01_CSS_Foundations.md)                                  |
| 9    | JS DOM APIs — `querySelector`, events, MutationObserver      | [16_JavaScript/05_JS_DOM_BrowserAPIs](../16_JavaScript/05_JS_DOM_BrowserAPIs.md)                                |
| 10   | JS Async deep dive — event loop, microtask queue             | [16_JavaScript/04_JS_Async_Promises](../16_JavaScript/04_JS_Async_Promises.md)                                  |

---

### 🟠 WEDNESDAY: Advanced API Testing

**Goal:** Master REST, SOAP, complex headers, and the factory pattern that makes API tests maintainable.

| Week | 60-Min Focus                                                           | Chapter Link                                                                                            |
| ---- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1    | API foundations — REST vs SOAP, status codes, `request` fixture        | [01_API_Testing_Foundations](../22_Advanced_API_Testing/01_API_Testing_Foundations.md)                  |
| 2    | Complex JSON — nested parsing, optional chaining, arrays               | [02_Complex_JSON_and_SOAP](../22_Advanced_API_Testing/02_Complex_JSON_and_SOAP.md)                      |
| 3    | Enterprise headers — Bearer, `x-agent`, `x-correlation-id`, SOAPAction | [03_Enterprise_Headers_Auth](../22_Advanced_API_Testing/03_Enterprise_Headers_Auth.md)                  |
| 4    | APIUtils — wrapper pattern, `getEndpointDescription` dissected         | [04_API_Utils_Factory_Pattern](../22_Advanced_API_Testing/04_API_Utils_Factory_Pattern.md) Sections 1-3 |
| 5    | Factory Pattern — HeadersCrm, PayloadCrm, endpoint assembly            | [04_API_Utils_Factory_Pattern](../22_Advanced_API_Testing/04_API_Utils_Factory_Pattern.md) Sections 4-6 |
| 6    | Data From API To Test — typed interfaces, safe extraction              | [05_Data_From_API_To_Test](../22_Advanced_API_Testing/05_Data_From_API_To_Test.md) Sections 1-4         |
| 7    | API→UI bridge, parameterised tests, response validators                | [05_Data_From_API_To_Test](../22_Advanced_API_Testing/05_Data_From_API_To_Test.md) Sections 5-8         |
| 8    | HTTP complete — how requests actually travel the network               | [22_DevOps/08_HTTP_Complete](../22_DevOps/08_HTTP_Complete.md)                                          |
| 9    | Design Patterns — Factory, Builder, Strategy                           | [06_OOP_Design/02_Design_Patterns](../06_OOP_Design/02_Design_Patterns.md) Sections on Factory/Builder  |
| 10   | OOP in TypeScript — class design, static methods                       | [17_TypeScript/03_TS_Patterns_BestPractices](../17_TypeScript/03_TS_Patterns_BestPractices.md)          |

---

### 🔴 THURSDAY: Database Testing & Complex SQL

**Goal:** Prove the data was actually written to the system of record. Join the DB layer to your Playwright tests.

| Week | 60-Min Focus                                                         | Chapter Link                                                                                           |
| ---- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1    | DB connection from Playwright — mssql fixture, parameterised queries | [06_DB_Testing_SQL_Bridge](../22_Advanced_API_Testing/06_DB_Testing_SQL_Bridge.md) Sections 1-3        |
| 2    | JOIN queries for SDET — multi-table verification patterns            | [06_DB_Testing_SQL_Bridge](../22_Advanced_API_Testing/06_DB_Testing_SQL_Bridge.md) Sections 4-5        |
| 3    | CTEs + transactions for DB teardown                                  | [06_DB_Testing_SQL_Bridge](../22_Advanced_API_Testing/06_DB_Testing_SQL_Bridge.md) Sections 6-7        |
| 4    | JOINs deep dive — INNER, LEFT, RIGHT, FULL                           | [08_SQL/07_JOINs_Complete](../08_SQL/07_JOINs_Complete.md)                                             |
| 5    | CTEs and Subqueries                                                  | [08_SQL/08_Subqueries_CTEs](../08_SQL/08_Subqueries_CTEs.md)                                           |
| 6    | Window functions — ROW_NUMBER, RANK, LAG, LEAD                       | [08_SQL/09_Window_Functions](../08_SQL/09_Window_Functions.md)                                         |
| 7    | Aggregations — GROUP BY, HAVING                                      | [08_SQL/06_Aggregations_GroupBy](../08_SQL/06_Aggregations_GroupBy.md)                                 |
| 8    | Transactions, ACID, isolation levels                                 | [08_SQL/13_Transactions_ACID](../08_SQL/13_Transactions_ACID.md)                                       |
| 9    | Query optimisation — indexes, EXPLAIN                                | [08_SQL/14_Query_Optimization](../08_SQL/14_Query_Optimization.md)                                     |
| 10   | Real-world SQL scenarios                                             | [08_SQL/38_RealWorld_Production_Scenarios_Part1](../08_SQL/38_RealWorld_Production_Scenarios_Part1.md) |

---

### 🟣 FRIDAY: DSA, Architecture & Software Engineering

**Goal:** Build the CS foundations that distinguish an average SDET from one who architects test systems and passes senior engineering interviews.

| Week | 60-Min Focus                                             | Chapter Link                                                                                                               |
| ---- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1    | Algorithm thinking — constraints, brute force, optimised | [03_Algorithms/01_Algorithm_Thinking](../03_Algorithms/01_Algorithm_Thinking.md)                                           |
| 2    | Arrays and HashMaps                                      | [02_Data_Structures/](../02_Data_Structures/)                                                                              |
| 3    | Design patterns for SDET — Factory, Strategy, Builder    | [06_OOP_Design/02_Design_Patterns](../06_OOP_Design/02_Design_Patterns.md)                                                 |
| 4    | OOP principles — SOLID applied to POM design             | [06_OOP_Design/01_OOPS_Principles](../06_OOP_Design/01_OOPS_Principles.md)                                                 |
| 5    | Concurrency — processes, threads, async models           | [13_Developer_Essentials/19_Concurrency_Models_Coroutines](../13_Developer_Essentials/19_Concurrency_Models_Coroutines.md) |
| 6    | CI/CD — GitHub Actions for Playwright                    | [22_DevOps/19_CICD_Pipelines](../22_DevOps/19_CICD_Pipelines.md)                                                           |
| 7    | Docker for containerised test execution                  | [13_Developer_Essentials/03_Docker_Containers](../13_Developer_Essentials/03_Docker_Containers.md)                         |
| 8    | System design fundamentals                               | [06_OOP_Design/03_System_Design](../06_OOP_Design/03_System_Design.md)                                                     |
| 9    | Trees and graphs (for parsing DOM trees)                 | [02_Data_Structures/](../02_Data_Structures/)                                                                              |
| 10   | Clean code — naming, functions, error handling           | [13_Developer_Essentials/05_Clean_Code](../13_Developer_Essentials/05_Clean_Code.md)                                       |

---

## 3. How to Use the Repository

When your 1-hour begins:

1. Open the chapter scheduled for today's day and week.
2. Read the **5W1H** at the top — understand WHY this matters.
3. Read the core material (max 40 minutes).
4. **Take the Practice Challenge** (last 20 minutes): Open your IDE and write the code _without looking at the solution_.
5. If you fail: read the `<details><summary>Answer</summary>` block, understand the mistake, and try again next week.

---

## 4. Emergency Reference — Most Used Patterns

**When a D365 button can't be found:**

```typescript
// Try: getByRole('menuitem') instead of getByRole('button')
// Use Chrome DevTools → Accessibility tab to find the real role
```

**When D365 shows empty data:**

```typescript
// Wait for spinner to disappear first:
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30000 });
// Then wait for content:
await expect(page.locator(".ms-DetailsList-row")).toHaveCount({ minimum: 1 });
```

**When a new tab opens:**

```typescript
const [newTab] = await Promise.all([
  page.context().waitForEvent("page"), // listen FIRST
  page.click("#trigger"), // then click
]);
```

**When API data needs to reach step 9:**

```typescript
const data = { citationId: null as string | null }; // typed accumulator
// Step 1: data.citationId = body.citations[0].citationId;
// Step 9: await page.fill('#input', data.citationId!);
```

---

## 🏋️ Practice Challenges

**Challenge 1 (The 1-Hour Constraint):** You are 55 minutes into your 1-hour Thursday session (Database Testing). You are struggling to get a complex SQL `JOIN` to execute correctly in your Playwright test. What is the correct action to take at the 60-minute mark according to this methodology?

<details><summary>Answer</summary>

**Answer:** Stop immediately. Close the laptop. The goal is consistency and burnout prevention, not heroic single-session problem solving. Note your blockers (e.g., "SQL syntax error near INNER JOIN") so you can resume exactly where you left off next Thursday.

</details>

**Challenge 2 (Active Recall):** You just finished reading the chapter on Playwright POM patterns for Week 3. What is the very next thing you should do before the hour ends?

<details><summary>Answer</summary>

**Answer:** Hide the material and attempt to type out the core POM structure (e.g., a constructor initializing locators, or the lazy evaluation pattern) from memory. Passive reading without active recall is a waste of your 1-hour session.

</details>
