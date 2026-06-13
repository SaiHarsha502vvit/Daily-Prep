# Quiz 02 — Reference Solutions

**Navigation**: [← Quiz 02](../QUIZ_02_Playwright_CodeChallenge.md) | [Quiz 01](../QUIZ_01_Playwright_MCQ.md) | [Index](../../00_INDEX.md)

> Reference implementations for every challenge in `QUIZ_02_Playwright_CodeChallenge.md`.  
> Each file contains: the original question as a header comment → the fixed/written code → a `// WHY` block.

---

## File Index

### Part A — Spot the Bug (Challenges 1–6)

| File | Challenge | Difficulty | Core concept |
|---|---|---|---|
| [Q01_forEach_async_trap.ts](./Q01_forEach_async_trap.ts) | 1 — The forEach Async Trap | MEDIUM | `forEach` drops Promises; use `for...of` |
| [Q02_new_tab_race_condition.ts](./Q02_new_tab_race_condition.ts) | 2 — The New Tab Race Condition | HARD | `Promise.all` — register listener before trigger |
| [Q03_module_level_state_parallel.ts](./Q03_module_level_state_parallel.ts) | 3 — Module-Level State in Parallel Tests | HARD | `test.describe.serial` + object accumulator |
| [Q04_wrong_wait_strategy.ts](./Q04_wrong_wait_strategy.ts) | 4 — Wrong Wait Strategy | MEDIUM | Replace `waitForTimeout` with content-based waits |
| [Q05_aria_role_type.ts](./Q05_aria_role_type.ts) | 5 — Missing AriaRole Type | MEDIUM | `Parameters<Page['getByRole']>[0]` type extraction |
| [Q06_storage_state_saved_early.ts](./Q06_storage_state_saved_early.ts) | 6 — StorageState Saved Too Early | HARD | `waitForURL` before `storageState()` |

### Part B — Explain This Code (Challenges 7–9)

| File | Challenge | Difficulty | Core concept |
|---|---|---|---|
| [Q07_pom_lazy_locators.ts](./Q07_pom_lazy_locators.ts) | 7 — Why Doesn't This POM Query the DOM? | MEDIUM | Locators are lazy — DOM queried on action, not construction |
| [Q08_worker_scope_savings.ts](./Q08_worker_scope_savings.ts) | 8 — Explain scope: 'worker' Savings | MEDIUM | 4 calls vs 40 calls; when to use each scope |
| [Q09_optional_chaining_chain.ts](./Q09_optional_chaining_chain.ts) | 9 — Explain Optional Chaining Chain | HARD | `?.` short-circuits on null/undefined; `?? null` |

### Part C — Write It Yourself (Challenges 10–20)

| File | Challenge | Difficulty | Core concept |
|---|---|---|---|
| [Q10_open_in_new_tab_helper.ts](./Q10_open_in_new_tab_helper.ts) | 10 — Write the New Tab Handler | MEDIUM | Reusable `openInNewTab(page, locator)` helper |
| [Q11_d365_spinner_wait.ts](./Q11_d365_spinner_wait.ts) | 11 — Write the D365 Spinner Wait | MEDIUM | `toHaveCount(0)` spinner + optional title guard |
| [Q12_typed_response_interface.ts](./Q12_typed_response_interface.ts) | 12 — Write the Typed Response Interface | EASY | `OrderResponse` interface + `string \| null` gotcha |
| [Q13_expect_object_containing.ts](./Q13_expect_object_containing.ts) | 13 — Write expect.objectContaining | MEDIUM | `toContainEqual` + `expect.objectContaining` + `expect.any` |
| [Q14_create_teardown_fixture.ts](./Q14_create_teardown_fixture.ts) | 14 — Write Create/Teardown Fixture | HARD | `test.extend` + `await use()` teardown guarantee |
| [Q15_component_split_pom.ts](./Q15_component_split_pom.ts) | 15 — Write the Component Split | HARD | Orchestrator + component POMs; Single Responsibility |
| [Q16_api_mocking_trap.ts](./Q16_api_mocking_trap.ts) | 16 — The API Mocking Trap | HARD | `route.continue()` required; `waitForResponse` for spying |
| [Q17_fixture_scope_mismatch.ts](./Q17_fixture_scope_mismatch.ts) | 17 — Fixture Dependency Scope Mismatch | MEDIUM | Worker fixture cannot depend on test-scoped fixture |
| [Q18_graphql_mocking_operation.ts](./Q18_graphql_mocking_operation.ts) | 18 — GraphQL Mocking by Operation Name | HARD | `postDataJSON().operationName` dispatch pattern |
| [Q19_locator_nth_antipattern.ts](./Q19_locator_nth_antipattern.ts) | 19 — The Locator nth Anti-Pattern | MEDIUM | `filter({ hasText })` replaces manual nth loop |
| [Q20_dynamic_fixture_options.ts](./Q20_dynamic_fixture_options.ts) | 20 — Dynamic Fixture Options | HARD | `{ option: true }` + `test.use({})` override pattern |

---

## How to use these files

1. **Attempt the quiz first** — open `QUIZ_02_Playwright_CodeChallenge.md` and try each challenge before looking here.
2. **Compare, don't copy** — the goal is to understand the *why*. Read the `// WHY` block even when your code matches.
3. **Run them** — every `.ts` file is valid TypeScript. Add your own `baseURL` and you can run most tests against a real target.

### Typecheck the solutions standalone

```bash
cd 21_SDET_Playwright_Automation/08_Practice_And_Quizzes/quiz_02_solutions
npx tsc --strict --noEmit --module node16 --moduleResolution node16 \
        --target ES2022 --lib ES2022 \
        --esModuleInterop true \
        Q*.ts
```

Or, from `framework/`, since these files import from `@playwright/test` which is already installed:

```bash
cd 21_SDET_Playwright_Automation/framework
npx tsc --noEmit --project tsconfig.json \
        ../08_Practice_And_Quizzes/quiz_02_solutions/Q*.ts
```

---

## Key patterns by category

| If you struggled with… | Re-read… |
|---|---|
| Async loops (Q01) | [Ch 04 JS/TS for Automation](../../01_Foundations/04_JS_TS_For_Automation.md) |
| Race conditions (Q02, Q16) | [Ch 12 Cross-Site Pattern 2 (New Tab)](../../03_D365_And_Patterns/12_CrossSite_Pattern2_NewTab_SharedContext.md) |
| Parallel test isolation (Q03) | [Ch 09 Parallel Execution & Workers](../../02_Core_Architecture/09_Parallel_Execution_Workers.md) |
| Wait strategies (Q04) | [Ch 17 D365 Advanced Timing Patterns](../../03_D365_And_Patterns/17_D365_Advanced_Timing_Patterns.md) |
| TypeScript types (Q05, Q09, Q12) | [Ch 36 TypeScript Type System Mastery](../../06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md) |
| storageState (Q06) | [Ch 16 Cross-Site Pattern 6 (storageState chaining)](../../03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md) |
| Locators / lazy evaluation (Q07, Q19) | [Ch 05 POM Architecture Deep Dive](../../02_Core_Architecture/05_POM_Architecture_Deep_Dive.md) |
| Fixture scopes (Q08, Q14, Q17, Q20) | [Ch 06 Custom Fixtures Architecture](../../02_Core_Architecture/06_Custom_Fixtures_Architecture.md) |
| API / route mocking (Q16, Q18) | [Ch 31 API Mocking via `page.route`](../../05_Advanced_Topics/31_API_Mocking_page_route.md) |
| POM component split (Q15) | [Ch 18 Mega POM Architecture](../../04_Enterprise_Architecture/18_Mega_POM_Architecture.md) |

---

**Navigation**: [← Quiz 02](../QUIZ_02_Playwright_CodeChallenge.md) | [Index](../../00_INDEX.md)
