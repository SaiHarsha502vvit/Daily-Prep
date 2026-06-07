# 53. Mutation Testing with Stryker — Are Your Tests Actually Testing Anything?

**Navigation**: [← 52. Component Testing](../05_Advanced_Topics/52_Component_Testing_With_Playwright_CT.md) | [Index](../00_INDEX.md) | [→ 54. Synthetic Monitoring](../05_Advanced_Topics/54_Synthetic_Monitoring.md)

---

## 5W1H

- **WHAT**: A tool that introduces small, deliberate bugs (mutants) in your production code and re-runs your tests. If tests still pass, the mutant **survived** — your test is asserting too little.
- **WHY**: Code coverage measures *which lines were executed*. Mutation testing measures *which lines are actually being asserted against*. Coverage of 100% can still have surviving mutants.
- **WHO**: Teams that already have decent test coverage and want to know if it means anything.
- **WHEN**: After you have a real test suite (~50+ tests). Not as your first quality tool.
- **HOW**: [Stryker Mutator](https://stryker-mutator.io/) for JS/TS. Runs your existing tests against mutated code, scores mutation kill rate.

---

## 1. The insight

Imagine a function:

```typescript
function isAdult(age: number): boolean {
  return age >= 18;
}
```

And a test:

```typescript
test('30 is adult', () => {
  expect(isAdult(30)).toBe(true);
});
```

Coverage tool says: 100% — that line ran.

Stryker mutates `>=` to `>`. Now `isAdult(18) === false`. The test still passes (it tested 30, not 18). Mutant **survived**.

The fix is a better test, not better coverage:

```typescript
test('exactly 18 is adult', () => expect(isAdult(18)).toBe(true));
test('17 is not adult', () => expect(isAdult(17)).toBe(false));
```

Both these kill the mutant.

---

## 2. Where this lives for an SDET

This chapter is in the SDET module on purpose: **the SDET who advocates for mutation testing is the SDET who gets noticed**. Most teams have never heard of it. Bringing it up in a code review or quality meeting is rare and high-signal.

That said: you don't run Stryker against Playwright E2E tests (too slow). You run it against the codebase the E2E suite *exercises*, or against unit tests in the same repo.

---

## 3. Setup (for a TS project)

```bash
npm i -D @stryker-mutator/core @stryker-mutator/typescript-checker @stryker-mutator/jest-runner
```

```javascript
// stryker.conf.json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "mutate": ["src/**/*.ts", "!src/**/*.spec.ts"],
  "testRunner": "jest",
  "reporters": ["html", "clear-text", "progress"],
  "coverageAnalysis": "perTest",
  "tsconfigFile": "tsconfig.json",
  "checkers": ["typescript"]
}
```

```bash
npx stryker run
```

You get an HTML report with every surviving mutant highlighted.

---

## 4. Reading a Stryker report

| Status | Meaning | Action |
|---|---|---|
| Killed | A test failed for the mutant | ✅ good |
| Survived | All tests passed | ❌ your tests aren't asserting enough |
| Timeout | Mutant caused infinite loop, tests timed out | Counts as killed |
| NoCoverage | No test exercised the line | Add a test |
| CompileError | Mutant didn't typecheck | Counts as killed |

**Target mutation score**: 60% is realistic for legacy code. 80% is strong. 95% is research territory.

---

## 5. Common mistakes

1. **Running Stryker against E2E tests.** Each E2E spec takes 30s — Stryker mutates the same code N times. You'll wait days. Run against unit/integration tests instead.
2. **Aiming for 100% mutation score.** Some mutants are equivalent (`x++` vs `x = x + 1`). Diminishing returns past 80%.
3. **Reading the percentage and stopping.** The actual value is **which** mutants survived. Open the HTML report and look at the lines.
4. **Adding Stryker without sign-off.** Mutation runs are CPU-heavy. CI bills can jump. Negotiate with your team first.

---

## 6. Senior SDET perspective

Mutation testing is the most direct answer to "are my tests doing what I think they are?" Most teams can't answer that. A single 30-minute mutation run on a legacy module is often the highest-signal quality artifact a team will see all quarter.

This is also a great **interview talking point**. "I introduced mutation testing on our auth module and identified 14 surviving mutants — we added 23 missing assertions and dropped our security-incident rate" is a story that lands.

---

## 7. DevSecOps seed

Mutation testing on security-critical code (auth, crypto, input validation) is **high-yield**. Surviving mutants in `validateJWT()` are not "code coverage gaps" — they're potentially exploitable holes your test suite missed.

Run a one-time Stryker pass on your team's security modules. Bring the report to the security lead.

---

## 8. Exercise

1. Take a small TS module from the [`framework/`](../framework/) folder — `data.loader.ts` is a good candidate.
2. Write Jest tests for it until coverage is 100%.
3. Run Stryker. Note the mutation score.
4. For each surviving mutant, write the test that would kill it.
5. Re-run Stryker. Target ≥ 80%.

You will learn more about assertion quality in this single exercise than from 20 chapters about testing.
