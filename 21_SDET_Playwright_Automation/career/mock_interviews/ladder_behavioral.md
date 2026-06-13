# Mock Interview Transcript: Behavioral Round (30 min)

**Role:** Senior SDET (L6/L7)  
**Interviewer:** Engineering Manager  
**Format:** 5 STAR-format questions with example strong answers

---

## Q1: Tell me about a time you reduced test flakiness.

### Strong Answer (STAR)

**Situation:** Our E2E suite had a 12% flakiness rate. Reruns consumed ~15 hours of CI time per day and developers stopped trusting red builds.

**Task:** I was tasked with bringing flakiness under 3% within one quarter without reducing test coverage.

**Action:**
- I built a dashboard aggregating test results by failure category (network timeout, race condition, selector timeout, environment issue).
- The top 5 flaky tests accounted for 60% of all flakes. I root-caused each:
  - Two tests used `page.waitForTimeout` instead of waiting for a DOM state. Replaced with Playwright auto-waiting locators.
  - One test ran against a shared staging DB; races between parallel jobs caused state pollution. Migrated to per-test Docker DB.
  - Two tests hit a rate-limited third-party API. Replaced with WireMock in CI.
- I introduced automatic retry-on-failure (max 2) at the framework level, not in test code.
- I worked with the team to enforce a "no merge with new flaky tests" policy by adding a CI check that flagged any test with <95% pass rate over its first 20 runs.

**Result:** Flakiness dropped from 12% to 2.4% in 8 weeks. CI reruns fell by 78%. Developer confidence in red builds increased (measured by post-mortem survey).

---

## Q2: Tell me about a time you influenced a team to adopt better testing practices.

### Strong Answer (STAR)

**Situation:** A backend team had zero contract tests. Integration issues between services were caught only in staging, causing a 3-4 day feedback loop.

**Task:** I needed to introduce contract testing (Pact) with minimal disruption to the team's existing workflow.

**Action:**
- I paired with one engineer for two afternoons to write Pact tests for a single service pair. We demoed the setup in a team meeting.
- I created an internal "Pact in 15 minutes" guide with copy-pasteable templates for our tech stack.
- I worked with Platform to add Pact Broker to our CI pipeline so contract verification ran automatically.
- I proposed a "no new cross-service endpoint without a contract test" guideline, which the EM accepted after a pilot month.

**Result:** Within three months, 8 of 10 service pairs had contract tests. Integration bugs found in staging dropped by 60%. The team's backend lead later presented the approach at an internal tech talk.

---

## Q3: Tell me about a time you had to ship with known quality issues.

### Strong Answer (STAR)

**Situation:** A critical payment feature had a race condition bug in the receipt generation flow. It reproduced in 1 in ~200 transactions under load. The fix required a significant refactor of the order state machine.

**Task:** Product wanted to ship the feature for Black Friday (2 weeks away). I had to provide a clear quality assessment and recommend a path forward.

**Action:**
- I reproduced the bug consistently using a load-test script that drove 500 concurrent checkouts.
- I documented the exact failure rate, customer impact (missing receipt email, order still successful), and the engineering effort to fix (estimated 2 weeks).
- I proposed shipping with a monitoring alert on the receipt-generation failure metric, a manual fallback (customer support can trigger receipt resend), and a hard commitment to fix in the following sprint.
- I worked with Product and the EM to write a runbook for the support team.

**Result:** The feature shipped on time. The race condition occurred 4 times during Black Friday (out of 120K transactions). All cases were handled by support within 2 hours. The fix landed the following week.

---

## Q4: Tell me about a time you mentored a junior SDET.

### Strong Answer (STAR)

**Situation:** A junior SDET on my team was struggling with test independence. Their tests frequently failed in isolation but passed when run as a suite because of leaked state.

**Task:** I was their onboarding buddy and needed to help them reach autonomy within the standard 90-day ramp.

**Action:**
- I started by observing them write a test, then asked them to run it in isolation and explain why it failed. This made the problem concrete rather than abstract.
- I introduced them to the AAA pattern (Arrange-Act-Assert) and test data factories as a way to ensure each test owned its own state.
- We pair-programmed refactoring their three most problematic tests together, then I asked them to refactor two more independently while I observed.
- I recommended two chapters from "Growing Object-Oriented Software" on test design and followed up with a 15-minute discussion.

**Result:** By week 6, their PRs consistently passed CI without state leaks. By week 10, they were independently authoring tests for complex async flows and their code review turnaround time matched the team average.

---

## Q5: Tell me about a time you disagreed with a PM about quality priorities.

### Strong Answer (STAR)

**Situation:** A PM deprioritized accessibility testing to hit a tight launch deadline. I believed this created legal and user-exclusion risk.

**Task:** I needed to advocate for accessibility without derailing the launch timeline.

**Action:**
- I gathered data: 3 critical user journeys were currently unreachable via keyboard navigation. I ran a quick screen-reader test and documented the failure.
- Instead of asking for a full accessibility audit, I scoped a "critical path only" accessibility pass that would take 2 days.
- I presented the business risk (potential ADA complaint, user base includes ~8% screen-reader users per analytics) and the 2-day compromise to the PM and EM.
- We agreed to do the critical path pass pre-launch and schedule a full WCAG 2.1 AA audit for the following quarter.

**Result:** The 2-day pass caught and fixed 5 keyboard-trap issues. The product launched on time. The full audit was completed in Q2 with zero critical issues because the worst problems had already been addressed.

---

## Evaluation Rubric

| Dimension | Exceeds Expectations | Meets Expectations | Below Expectations |
|-----------|----------------------|--------------------|--------------------|
| **STAR Structure** | Every answer follows Situation-Task-Action-Result clearly and concisely | Mostly follows STAR; one answer may be slightly vague | Rambling; missing key STAR components |
| **Leadership Evidence** | Shows initiative, influence across teams, and ownership of outcomes | Shows ownership within own team | Only describes tasks they were assigned |
| **Problem-Solving Depth** | Explains root cause analysis, trade-offs, and multiple considered options | Explains what they did and why | Only states actions without reasoning |
| **Collaboration** | Demonstrates working with engineers, PMs, EMs, and support to reach outcomes | Works with immediate team | Works in isolation or blames others |
| **Results Orientation** | Quantifies outcomes (percentages, time saved, defect reduction) | Mentions outcomes but not always quantified | No outcomes discussed; only describes activity |
