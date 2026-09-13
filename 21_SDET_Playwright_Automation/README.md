# SDET & Playwright Automation

Enterprise reference for Playwright + TypeScript test automation on Dynamics 365 CRM, JSP, and ASP.NET applications. Two layers:

- **[`reference/`](./reference/)** — flat, topical lookup. Open one file, find one answer.
- **[`learn/`](./learn/)** — curriculum path if you're working through the material in order.

Backed by a runnable framework in [`framework/`](./framework/) and graded exercises in [`challenges/`](./challenges/) + [`08_Practice_And_Quizzes/`](./08_Practice_And_Quizzes/).

> If this is your first time here: open [`reference/01_quickstart.md`](./reference/01_quickstart.md). Five minutes, then you have a passing test.

---

## Reference — daily lookup

| #   | Topic                                                | Use when                                                                           |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 01  | [Quickstart](./reference/01_quickstart.md)           | Day one. Install, first test, project layout.                                      |
| 02  | [Config](./reference/02_config.md)                   | Every `playwright.config.ts` field. Timeouts, reporters, projects, trace, devices. |
| 03  | [Locators](./reference/03_locators.md)               | `getByRole` vs CSS vs XPath. Filtering, chaining, strict mode.                     |
| 04  | [Fixtures](./reference/04_fixtures.md)               | `test.extend`, test vs worker scope, options pattern, account pool.                |
| 05  | [Auth](./reference/05_auth.md)                       | `storageState`, OAuth2 + PKCE, OIDC, SAML, MFA TOTP, mTLS — decision tree.         |
| 06  | [API testing](./reference/06_api_testing.md)         | `APIRequestContext`, factories, typed clients, schema validation.                  |
| 07  | [Parallelism](./reference/07_parallelism.md)         | Workers, `fullyParallel`, sharding, data collision avoidance.                      |
| 08  | [Reliability](./reference/08_reliability.md)         | Flakiness diagnosis, timing patterns, war stories, `expect.poll`.                  |
| 09  | [File I/O](./reference/09_file_io.md)                | `setInputFiles`, `waitForEvent('download')`, CSV/PDF assertions.                   |
| 10  | [CI + Docker](./reference/10_ci_docker.md)           | GitHub Actions, Azure DevOps, `mcr.microsoft.com/playwright`, sharding.            |
| 11  | [Reporting](./reference/11_reporting.md)             | HTML / JUnit / Allure / Trace Viewer / UI Mode.                                    |
| 12  | [Test data](./reference/12_data.md)                  | Seeding strategies, lifecycle, DB verification, cleanup.                           |
| 13  | [Mocking](./reference/13_mocking.md)                 | `page.route`, `waitForResponse`, GraphQL, WebSocket.                               |
| 14  | [Tool comparison](./reference/14_tool_comparison.md) | Cypress / Selenium / WebdriverIO — when to pick what.                              |

## Learn — study in order

| #   | Chapter                                                                                                            | Hrs |
| --- | ------------------------------------------------------------------------------------------------------------------ | --- |
| 01  | [SDET mindset & testing pyramid](./learn/01_mindset.md)                                                            | 0.5 |
| 02  | [TypeScript for tests (basic → advanced)](./learn/02_typescript_for_tests.md)                                      | 3   |
| 03  | [Page Object Model — POM + Mega POM](./learn/03_pom.md)                                                            | 2   |
| 04  | [E2E architecture walkthrough — 15-step skeleton](./learn/04_architecture_walkthrough.md)                          | 1   |
| 05  | [Browser internals for SDETs](./learn/05_browser_internals.md)                                                     | 1   |
| 06  | [Enterprise project structure](./learn/06_enterprise_structure.md)                                                 | 1.5 |
| 07  | [Interview prep — LADDER, system design, STAR (canonical Ch32)](./06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md) | 2   |

## Deep dives — optional reads

| Topic                                                                                                                | When to read                                              |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [D365 / Fluent UI](./deep_dives/d365.md)                                                                             | Working on Dynamics 365 CRM tests                         |
| [Cross-site patterns catalog](./deep_dives/cross_site_patterns.md)                                                   | Multi-domain flows, OAuth redirects, dual contexts        |
| [Visual regression](./deep_dives/visual_regression.md)                                                               | UI screenshot testing                                     |
| [Component testing (Playwright CT)](./deep_dives/component_testing.md)                                               | Isolating React/Vue components for tests                  |
| [Performance](./deep_dives/performance.md)                                                                           | Lighthouse CI, k6, Core Web Vitals                        |
| [Accessibility](./deep_dives/accessibility.md)                                                                       | axe-core, WCAG, keyboard nav                              |
| [Security](./deep_dives/security.md)                                                                                 | OWASP Top 10, IDOR, injection, ZAP scans                  |
| [Contract testing](./deep_dives/contract_testing.md)                                                                 | Pact, consumer-driven contracts                           |
| [Mutation testing](./deep_dives/mutation_testing.md)                                                                 | Stryker, assertion quality                                |
| [Feature flags](./deep_dives/feature_flags.md)                                                                       | LaunchDarkly, fixture-driven flag injection               |
| [Email testing](./deep_dives/email_testing.md)                                                                       | Mailosaur, MailHog, OTP flows                             |
| [Synthetic monitoring](./deep_dives/synthetic_monitoring.md)                                                         | Checkly, cron-based monitors                              |
| [BDD with Cucumber](./deep_dives/bdd_cucumber.md)                                                                    | Stakeholder-readable Gherkin scenarios                    |
| [AI agents / MCP](./deep_dives/ai_mcp.md)                                                                            | Playwright MCP server, agentic test scaffolding           |
| [Ch57 Login Taxonomy — OAuth/OIDC/SAML/MFA/mTLS](./05_Advanced_Topics/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) | Beyond `reference/05_auth.md` — full SAML, MFA edge cases |

---

## Runnable assets

| Folder                                                                 | What it is                                                                                |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`framework/`](./framework/README.md)                                  | Production-grade Playwright + TS scaffold. The canonical example for every reference doc. |
| [`projects/starter-playwright-ts/`](./projects/starter-playwright-ts/) | Learning scaffold — intentionally incomplete, grow it chapter by chapter                  |
| [`challenges/`](./challenges/README.md)                                | 7 graded challenges (CH01–CH07) + 3 portfolio capstones (CAP_C1–C3)                       |
| [`08_Practice_And_Quizzes/`](./08_Practice_And_Quizzes/)               | Quizzes + 10-week practice plan + 20 reference solutions to Quiz 02                       |
| [`career/`](./career/README.md)                                        | Progress tracker, interview bank, portfolio plan, résumé bullets, DevSecOps thread        |

---

## How this module is organized

Four entry points live at the root; everything else is foldered by purpose:

| Path                                             | Purpose                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `README.md` / [`00_Start_Here.md`](./00_Start_Here.md) / [`00_INDEX.md`](./00_INDEX.md) / [`WHERE_TO_START.md`](./WHERE_TO_START.md) | Entry points — pick by how you like to navigate |
| [`00_Navigation/`](./00_Navigation/)             | Maps: [SITEMAP](./00_Navigation/SITEMAP.md), [lens index](./00_Navigation/LENS_INDEX.md), [code→chapter map](./00_Navigation/MAP_CODE_TO_CHAPTER.md) |
| [`00_Pathways/`](./00_Pathways/)                 | Guided routes: [learning](./00_Pathways/PATHWAY_01_LEARNING.md), [professional](./00_Pathways/PATHWAY_02_PROFESSIONAL.md), [office/D365](./00_Pathways/PATHWAY_03_OFFICE.md) |
| `01_Foundations/` … `08_Practice_And_Quizzes/`   | The numbered curriculum clusters (chapters Ch00–Ch62)                                        |
| `reference/`, `learn/`, `deep_dives/`            | Lookup cards, ordered mini-curriculum, optional deep reads                                   |
| `framework/`, `projects/`, `challenges/`         | Runnable code — scaffold, playground, graded exercises                                       |
| [`career/`](./career/README.md)                  | Career system incl. the [Principal readiness rubric](./career/READINESS_RUBRIC.md)          |
| [`_meta/`](./_meta/)                             | Module governance: [audit results](./_meta/AUDIT_RESULTS.md), [link-repair history](./_meta/KNOWN_BROKEN_LINKS.md), [context](./_meta/CONTEXT.md) |

---

## Quick reference — patterns you'll use weekly

### The `await` rule

```typescript
// Needs await: navigate, click, fill, type, check, hover, waitFor,
//              isVisible(), count(), textContent(), response.json()
// No await: page.locator(), getByRole(), getByText(), .nth(), .filter()
```

### New tab — listener before trigger

```typescript
const [newTab] = await Promise.all([
  page.context().waitForEvent("page"),
  page.click("#openButton"),
]);
```

### Download — same pattern, different event

```typescript
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.click("#exportBtn"),
]);
```

### D365 wait pattern

```typescript
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30_000 });
await expect(fieldLocator).toHaveText("Expected Value", { timeout: 30_000 });
```

### `menuitem` over `button` in D365

```typescript
// ❌ page.getByRole('button',  { name: 'Edit' })
// ✅ page.getByRole('menuitem', { name: 'Edit' })
```

### Data Accumulator across `test.step()`

```typescript
interface TestData {
  citationId: string | null;
}
const data: TestData = { citationId: null };
await test.step("create", async () => {
  data.citationId = await client.create();
});
await test.step("verify", async () => {
  await client.assertPaid(data.citationId!);
});
```

### Polling — never `for + waitForTimeout`

```typescript
await expect
  .poll(async () => (await citationsClient.getById(id)).status, {
    timeout: 120_000,
    intervals: [1_000, 2_000, 5_000, 10_000],
  })
  .toBe("PAID");
```

### Enterprise composition

```typescript
// import test from your fixtures barrel — NEVER from @playwright/test directly
import { test, expect } from "../../fixtures";

test("flow", async ({ page, account, citationsClient }) => {
  const dashboard = new DashboardPage(page); // POMs at top of test
  const data = { citationId: null as string | null };

  await test.step("API: create pending citation", async () => {
    const citation = await citationsClient.create(
      PayloadsCitation.pending({ customerId: account.userId }),
    );
    data.citationId = citation.id;
  });
  // ...
});
```

---

## Cross-module links

| Topic                                          | Where                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| API testing depth (REST, SOAP, contract)       | [`24_Advanced_API_Testing/`](../24_Advanced_API_Testing/)                                         |
| TypeScript foundations and advanced types      | [`17_TypeScript/`](../17_TypeScript/)                                                             |
| JavaScript fundamentals (async, DOM, closures) | [`16_JavaScript/`](../16_JavaScript/)                                                             |
| CSS selectors in depth                         | [`18_CSS_Complete/`](../18_CSS_Complete/)                                                         |
| DSA / Algorithms (interview bridge)            | [`03_Algorithms/`](../03_Algorithms/)                                                             |
| OOP design patterns                            | [Ch35 OOP Design Patterns for SDETs](./06_SDET_to_SDE_Bridge/35_OOP_Design_Patterns_for_SDETs.md) |
| SQL for DB verification                        | [`08_SQL/`](../08_SQL/)                                                                           |
| CI/CD beyond Playwright                        | [`22_DevOps/`](../22_DevOps/)                                                                     |
| Mobile / Appium                                | [`23_Mobile_Dev_And_Testing/`](../23_Mobile_Dev_And_Testing/)                                     |

---

## Roadmap — not yet covered

Documented gaps so readers know what's deliberate. This table previously listed OpenTelemetry, chaos engineering, and test impact analysis as gaps — all three are real and already written; see [`00_INDEX.md`](./00_INDEX.md) for the fuller, actively-maintained version of this roadmap (this file's copy had drifted out of sync with it — the same verify-against-the-filesystem lesson documented there, found again).

**Already covered:**
- **OpenTelemetry / APM** — [`framework/utilities/api/TELEMETRY_README.md`](./framework/utilities/api/TELEMETRY_README.md)
- **Chaos engineering** — [Ch65 Chaos Engineering for Playwright](./05_Advanced_Topics/65_Chaos_Engineering_For_Playwright.md)
- **Test impact analysis** — Ch48 §11, "Test Impact Analysis with madge"
- **Property-based testing** — [Ch34](./06_SDET_to_SDE_Bridge/34_Algorithms_in_Test_Automation.md) §11, `fast-check`'s shrink-search algorithm

**Genuinely not yet covered:**

| Topic                                          | Why deferred                                              |
| ----------------------------------------------- | --------------------------------------------------------- |
| Cloud device farms (BrowserStack, Sauce Labs)  | Vendor-specific; rotates faster than docs can keep up     |
| Screen-reader (NVDA / JAWS) automation         | Manual + assistive-tech specific; not Playwright's domain |

---

## House conventions

- **No `await` on locator creation** — only on actions and assertions.
- **POMs instantiated BEFORE `test.step()`** — so step names describe behaviour, not setup.
- **Object accumulator, not `let` primitive** — reference stability across steps.
- **Named factory calls** — `HeadersCrm.auth(token)`, not `{ Authorization: ... }` inline.
- **Tests import from fixtures barrel** — never from `@playwright/test` directly.
- **Real names in examples** — `MasterSearchPage`, `CitationsClient`, OrangeHRM. No `FooBar`.
