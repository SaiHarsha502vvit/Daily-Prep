# SDET Interview Bank

Three sections: **system design** (50), **technical/practical** (depth, framework, patterns), **behavioural STAR** (real stories you build over time).

## How to use this

- Don't memorise answers. Memorise _frameworks for thinking about the question_.
- When you can answer 35/50 system design Qs confidently, you are interview-ready for senior SDET roles.
- Every behavioural answer must be **a real story with numbers**. Vague = lying.

---

## Section A — System Design (50 questions)

### Test architecture & framework

1. Design a Playwright framework for 3 web apps + 2 mobile apps + 5 API services. Where do shared utilities live? How do you avoid coupling?
2. Two teams own different parts of your suite. How do you keep their POMs from drifting apart while still letting them move fast?
3. Tests take 90 minutes. You have a budget for 3 more CI runners. How do you cut wall time the most?
4. You inherit a 500-test legacy suite at 60% pass rate. First 30 days?
5. Design test data management for a system with strict PII rules — no real customer data allowed in test envs.

### Flakiness & reliability

6. Test passes locally, fails 30% of the time in CI. Walk through your diagnosis order.
7. You can either (a) fix the flake or (b) move it to a nightly suite. When is (b) the right call?
8. Define a "flake budget" for your team. How do you enforce it?
9. A test fails once a month, always at 2am Sunday. How do you reproduce?
10. Your team's flakiness metric is "% retries used." Why is that the wrong metric? What's better?

### Cross-system flows

11. Test must create a user in service A, send a message via B, verify it lands in C's audit log. Sketch.
12. Same flow, but A is async — the message arrives in B's queue 2–5 seconds later. How do you wait without `sleep`?
13. Service C is rate-limited to 10 req/min. Your suite has 1,000 tests touching it. Strategy?
14. Two tests need the same admin account at once. Three solutions, picked tradeoffs?
15. Customer signs up, gets a magic link, signs in. End-to-end test. No real email account allowed. How?

### CI/CD & parallel

16. Why does Playwright `--workers=4` give you 4 separate Node.js processes, not 4 threads? Why does that matter for fixtures?
17. Sharding splits tests by file. What if one file has 50 tests and another has 2?
18. Tests run on PR. PRs get merged to main 30/day. How do you keep main's tests green?
19. Designing test selection: only run affected tests. When is the heuristic safe to use, when not?
20. PR gate runs 800 tests in 14 minutes. CEO wants ≤5 minutes. Two real strategies, two trade-offs each.

### API & contract

21. UI test passes; API returned the wrong field. UI didn't render it. How does your test catch this?
22. Same shape, both sides. Contract testing with Pact — when worth it, when not?
23. Backend ships a new field. UI not yet consuming it. Should your test break? Pass? Warn?
24. Stale mock returns 200 with old shape, real API returns 500. How do you keep mock fidelity high?
25. API has 50 endpoints. How many domain clients do you build, vs one giant `APIUtils`?

### Test data & environment

26. Tests depend on data seeded once nightly. Two tests mutate the same record. Plan?
27. You don't own the database. How do you reset state between runs?
28. Staging env returns different data on Tuesdays. Why might that be, what do you change?
29. Test creates an order, cleanup deletes the order. Test passes; cleanup throws. Should the test report pass or fail? Why?
30. You have one shared "test customer" account. New SDET joins, breaks it. How to avoid in future?

### Reporting & observability

31. Manager asks weekly: "are we shipping faster?" Which metric do you show?
32. Failure is identical across 12 tests. Reporting tool shows them as 12 unrelated failures. Fix the report or the suite?
33. You have to convince leadership to invest in test analytics. Three slides?
34. Two tests fail. Which one do you triage first — the smoke or the long-tail edge case? Why?
35. Build vs buy: ReportPortal vs custom dashboard. Decision framework?

### Tooling & platform

36. Build vs adopt: when do you write a custom Playwright reporter vs use the built-in?
37. Your team uses Selenium. You think Playwright would be better. Pitch & migration plan?
38. Component testing vs E2E for forms — when does each win?
39. Mutation testing on the auth module: pitch to a sceptical engineering manager?
40. Synthetic monitoring on production. What's the smallest viable setup that doesn't wake people up for nothing?

### People & process

41. Junior on your team writes brittle tests using `nth-child`. How do you correct without crushing them?
42. Sprint commitment says "test the feature." Dev finished it at 4pm Friday. Plan?
43. Manager wants you to test 100% of the app. Response?
44. Frontend dev says "your test is wrong, my code is right." How do you investigate without ego?
45. You're new at the company. First test runs as a synthetic, pages on-call by mistake. Recovery?

### Career & growth

46. You want to move into DevSecOps. First three concrete steps you'd take from current SDET role?
47. Open-source contribution strategy: which Playwright issue do you pick, why?
48. Mock interview yourself: "what's wrong with your most recent test you wrote at work?"
49. You're up for promotion to senior SDET. What three artifacts would you produce in advance?
50. Five years out — describe the role you want. Work backward to "what skill am I underweight on today?"

---

## Section B — Technical / Practical (build your own answers)

Answer each in writing the first time, then refine:

- Walk through the lifecycle of a Playwright test from `npx playwright test` to report.
- Explain Browser → BrowserContext → Page in your own words. Why each layer exists.
- What does `await` do at the bytecode level? Why does Playwright require it?
- Difference between `getByRole` and `locator('button')`. When does each fail?
- Why does `proper-lockfile` work for cross-process locking when a JS `Map` doesn't?
- When does `expect.poll` beat `waitForResponse`? Vice versa?
- Define "flaky test" in one sentence. Now in one paragraph. Which definition do you use on the team?

---

## Section C — Behavioural / STAR bank

Build at least **five** real stories from your own work. Template per story:

### Story title: **************\_\_\_**************

**Situation**: where, when, what was happening
**Task**: what was your responsibility
**Action**: what _you_ did (not "we") — specifics
**Result**: numbers — flakes dropped from X% to Y%, runtime cut from Am to Bm, etc.
**Reflection**: what you'd do differently

Slots to fill — pick the ones that match your real experiences:

- A time I fought to add a test the team thought was unnecessary, and it caught a P0 bug
- A time my test broke production and how I responded
- A time I disagreed with a senior engineer about test architecture
- A time I cut suite runtime by ≥30%
- A time I learned a new technique mid-sprint and applied it
- A time I taught another engineer something they didn't know
- A time my team's flakiness was unacceptable and I changed it
- A time I built a tool nobody asked for, but everyone used

Real numbers turn these into stories interviewers remember.
