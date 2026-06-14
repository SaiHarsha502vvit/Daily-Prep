# Quiz 02 — Reference Solutions

Working, compile-ready TypeScript implementations for all 20 Quiz 02 challenges.
Each file is runnable in a Playwright test context and demonstrates both the trap and the fix (where applicable).

## Part A: Spot the Bug (Ch1-6)

| #   | File                                               | Topic                                           |
| --- | -------------------------------------------------- | ----------------------------------------------- |
| 1   | `part-a-spot-the-bug/challenge-01-forEach-trap.ts` | forEach does not await async callbacks          |
| 2   | `part-a-spot-the-bug/challenge-02-new-tab-race.ts` | Popup event listener attached too late          |
| 3   | `part-a-spot-the-bug/challenge-03-module-state.ts` | Module-level mutable state in parallel tests    |
| 4   | `part-a-spot-the-bug/challenge-04-wrong-wait.ts`   | waitForTimeout instead of proper waits          |
| 5   | `part-a-spot-the-bug/challenge-05-as-const.ts`     | Missing `as const` causes type widening         |
| 6   | `part-a-spot-the-bug/challenge-06-storagestate.ts` | StorageState saved before async login completes |

## Part B: Explain This (Ch7-9)

| #   | File                                               | Topic                                     |
| --- | -------------------------------------------------- | ----------------------------------------- |
| 7   | `part-b-explain/challenge-07-pom-constructor.ts`   | Why POM constructors do not query the DOM |
| 8   | `part-b-explain/challenge-08-worker-scope.ts`      | What `scope: 'worker'` actually saves     |
| 9   | `part-b-explain/challenge-09-optional-chaining.ts` | Optional chaining for safe nested access  |

## Part C: Write It Yourself (Ch10-20)

| #   | File                                               | Topic                                      |
| --- | -------------------------------------------------- | ------------------------------------------ |
| 10  | `part-c-write-it/challenge-10-new-tab-handler.ts`  | Race-free new-tab helper                   |
| 11  | `part-c-write-it/challenge-11-d365-spinner.ts`     | Dynamics 365 loading spinner wait          |
| 12  | `part-c-write-it/challenge-12-typed-interface.ts`  | Typed interfaces from JSON response        |
| 13  | `part-c-write-it/challenge-13-objectContaining.ts` | Partial matching with objectContaining     |
| 14  | `part-c-write-it/challenge-14-fixture-teardown.ts` | Fixture with automatic teardown            |
| 15  | `part-c-write-it/challenge-15-component-split/`    | Monolithic POM → component split           |
| 16  | `part-c-write-it/challenge-16-api-mocking.ts`      | API route mocking trap                     |
| 17  | `part-c-write-it/challenge-17-scope-mismatch.ts`   | Fixture dependency scope mismatch          |
| 18  | `part-c-write-it/challenge-18-graphql-mocking.ts`  | GraphQL mocking by operation name          |
| 19  | `part-c-write-it/challenge-19-nth-antipattern.ts`  | Locator nth() anti-pattern                 |
| 20  | `part-c-write-it/challenge-20-dynamic-fixture.ts`  | Dynamic fixture parameters with test.use() |

## Running

Type-check all solutions:

```bash
npx tsc --noEmit
```

Run the demo spec:

```bash
npx playwright test quiz-solutions/quiz-solutions.spec.ts
```
