# Mock Interview Transcript: System Design Round (45 min)

**Role:** Senior SDET (L6/L7)  
**Interviewer:** Staff Engineer / Principal Engineer  
**Prompt:** "Design a flaky-test detection and quarantine system at scale."

---

## Candidate Thinking Out Loud

- We are dealing with a large codebase thousands of tests running across many CI pipelines.
- Flaky tests erode trust in CI. I need a system that detects, scores, quarantines, and alerts about them.
- Scale means we cannot store every test result forever. We need sampling or TTL.
- The system should integrate with existing CI/test runners without forcing teams to change tooling.
- Key data: test name, suite, status, duration, git branch, retry count, timestamp.
- Scoring: some kind of pass-rate over a rolling window. Maybe 50 or 100 recent runs.
- Quarantine: flaky tests should still run (to gather data) but not block merges.
- Alerting: notify test OWNERS, not a broadcast spam channel.
- Dashboard: team-level and org-level views of flakiness trends.

---

## Interviewer Follow-Up Questions

**Q1:** How do you avoid marking a genuinely broken test as flaky?

**Q2:** Your system ingests 100,000 test results per hour. How do you store and query flakiness scores efficiently?

**Q3:** A quarantined test eventually passes 50 times in a row. What happens?

**Q4:** How do you handle test renaming or refactoring that breaks the identity of a test across history?

---

## Good Answer Skeleton: Key Architectural Decisions

### Decision 1: Ingestion Pipeline
- CI runners publish test results (JUnit XML or JSON) to a message queue (Kafka / SQS)
- Lightweight ingestion service normalizes, enriches (adds repo, branch, commit), and writes to time-series DB (InfluxDB or ClickHouse)
- Idempotency: deduplicate by (run_id, test_id, attempt_number)

### Decision 2: Scoring Engine
- Rolling window: last 50 executions on main branch (ignore feature branches for scoring)
- Flakiness score = (number of status flips / total runs in window) * 100
- A flip = adjacent runs with different outcomes (pass->fail or fail->pass)
- Thresholds: >10% score = flagged; >20% score = quarantine candidate
- Separate scoring per (test, browser, OS) combo for parameterized tests

### Decision 3: Storage Strategy
- Hot data (last 90 days): ClickHouse for fast analytical queries
- Cold data (>90 days): S3 in Parquet format for historical trend analysis
- Aggregated scores: Redis for real-time dashboard lookups (TTL 7 days, refreshed daily)
- Test identity mapping: PostgreSQL stores test metadata, ownership, and aliases

### Decision 4: Alerting
- Flaky test detected -> Slack DM to CODEOWNERS of the test file
- Weekly digest to EM + TL with top 10 flaky tests and their owners
- PagerDuty only when org-wide flakiness exceeds 5% (indicates systemic issue)
- Auto-create Jira ticket for quarantine candidate with 48-hour SLA

### Decision 5: Quarantine & Dashboard
- Quarantine: CI job fetches quarantine list from API before running tests
- Quarantined tests run in a separate non-blocking job, their results logged but not gating
- Auto-unquarantine if test passes 30 consecutive runs on main
- Dashboard: Grafana with panels per team showing flakiness trend, quarantine queue size, mean time to fix

---

## Evaluation Rubric

| Dimension | Exceeds Expectations | Meets Expectations | Below Expectations |
|-----------|----------------------|--------------------|--------------------|
| **Data Model & Scale** | Chooses appropriate storage (time-series, columnar) for write-heavy ingestion; addresses TTL and cost | Picks a reasonable DB but misses scale or cost concerns | Proposes a single RDBMS for everything without indexing strategy |
| **Algorithmic Correctness** | Defines flakiness rigorously (e.g., status flips vs simple pass rate); handles parameterized tests and retries | Uses a reasonable heuristic but misses edge cases | Vague "pass rate" with no definition of window or retries |
| **Integration & Adoption** | Design integrates with existing CI; no forced migration; minimal test runner changes | Requires some CI changes but they are documented and reasonable | Requires teams to rewrite tests or switch runners |
| **Operational Rigor** | Covers ownership, alerting SLAs, auto-unquarantine, and data retention policy | Has alerting but no SLA or ownership tracking | Missing operational story entirely |
| **System Completeness** | End-to-end design from ingestion to action (quarantine, alert, dashboard) with clear component boundaries | Covers most components but one area is vague (e.g., no dashboard) | Large gaps; missing ingestion, storage, or action mechanism |
