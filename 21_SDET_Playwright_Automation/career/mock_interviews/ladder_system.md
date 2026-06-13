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

---

## Full Mock Transcript (Dialogue, ~35 min)

The sections above are the *artifacts*. The transcript below is what the 35-minute dialogue between the interviewer (**I**) and candidate (**C**) actually sounds like — including the parts that go wrong, the clarifying detours, and the moment the candidate hedges. Use this to calibrate **pacing** more than content.

### [00:00–00:03] Setup and prompt

**I:** Hey, thanks for joining. We've got 45 minutes. The format: I'll give you an open-ended design prompt, you drive — ask me clarifying questions, sketch components, walk through trade-offs. I'll interrupt when I want to dig into something. Last 10 minutes I'll have specific follow-ups. Sound good?

**C:** Sounds great. Whiteboard or shared text?

**I:** Either. Most candidates pick the whiteboard, sketch boxes, narrate the data flow.

**C:** I'll do the whiteboard then.

**I:** Cool. Prompt: design a flaky-test detection and quarantine system at scale. Take a minute, ask me anything before you start.

### [00:03–00:07] Clarifying questions

**C:** Before I start, a few questions to bound this. First — what's "at scale" mean for us? Are we talking about a single product team's test suite, or a whole org?

**I:** Whole org. Assume 5000 engineers, 200 services, around 80,000 distinct tests in the canonical CI graph. About 100,000 test results land per hour during peak.

**C:** Got it. Second — does each team own their own CI today, or is there one centralized CI platform?

**I:** Mixed. There's a central Buildkite-style platform, but ~40% of teams use their own GitHub Actions setups for various reasons. We don't get to force a migration.

**C:** That's a real constraint. So the system has to be CI-agnostic. Third — what counts as "flaky" in your org's vocabulary? Some places use it for any non-deterministic test; others reserve it for tests that pass on retry. Do you have a definition I should anchor to?

**I:** That's actually part of what I want to see you propose. I won't anchor you.

**C:** OK, I'll come back to that. Last one — what's the action we want at the end? Just flag flaky tests for owners to fix, or actively quarantine them, or both?

**I:** Both. Plus visibility — leadership wants to see flakiness trends. So three downstream actions: alert, quarantine, dashboard.

**C:** Right. Three actions, CI-agnostic ingestion, 100k results/hour. Let me sketch the high-level shape and then we'll dig in.

### [00:07–00:15] High-level architecture

**C:** [draws four columns: **Ingest** → **Store** → **Score** → **Act**]

**C:** At the top, every CI system publishes test results to a single ingestion endpoint. Two choices here: REST API, or a message bus that they push to. At 100k/hour — that's about 28 per second average, but with bursts. A REST API behind a small queue works; we don't necessarily need full Kafka. I'd start with SQS or a Kinesis stream.

**I:** Why not Kafka? You said "burst." Bursts are exactly where Kafka shines.

**C:** Fair. Two reasons. One, Kafka adds operational cost — you need someone to own broker maintenance, partition rebalancing, consumer-group monitoring. SQS is managed. Two, the consumption pattern here is "ingest → write to store" with no fanout to multiple consumers. Kafka's superpower is fanout, and we don't need it yet. I'd start with SQS and migrate to Kafka if we discover a need for replay or multi-consumer.

**I:** Good. Continue.

**C:** Ingestion service is stateless. It pulls from the queue, normalizes the payload — junit XML or Playwright JSON or whatever — into a canonical TestResult shape, enriches it with git metadata (repo, branch, sha, author), and writes to the analytical store.

For storage I'd pick a columnar warehouse — ClickHouse — for two reasons. One, it handles 100k writes/sec easily on a 3-node cluster. Two, the queries we'll need are "give me the last 50 runs of test X on main" — those are highly selective with a small result set per query, but huge cardinality on the test dimension. Columnar storage with partition pruning by timestamp and ordering by (test_id, timestamp) makes these queries cheap.

**I:** What about cost? You're going to keep every test result forever?

**C:** No. I'd tier. Hot in ClickHouse for 90 days. After that, dump to S3 in Parquet. The reason 90 days: scoring window is way smaller than that, and 90 days lets you do quarterly trend analysis without re-ingesting cold storage.

### [00:15–00:23] The flakiness definition + scoring

**I:** Let's pause. Earlier you said you'd come back to defining flaky. Define it.

**C:** Yeah. My working definition: a test is flaky if it produces **non-deterministic outcomes for the same input**. The challenge is operationalizing "same input." For our purposes I'll say: same test file, same parameter combo, same target branch, within a rolling window. If under that constraint the test sometimes passes and sometimes fails, it's flaky.

Concrete scoring: I'd use "status flips per window." A flip = two adjacent runs on main with different outcomes. So if I have pass-pass-fail-pass-pass over 5 runs, that's 2 flips. Window size: 50 runs on main, ignoring PR branches (PR branches have too much noise from in-progress work).

Flip rate > 10% → flagged. > 20% → quarantine candidate.

**I:** Why flip rate instead of pass rate? A test that's 50% pass-rate but ordered pass-pass-pass-fail-fail-fail-fail-fail isn't flaky — it's broken. Your flip rate would call it flaky too.

**C:** That's a great catch. Let me adjust. The simple flip-rate metric fails when the test transitions from working to broken. I'd add a secondary check: if the *last N consecutive runs* are all failures, classify as "broken" not "flaky." That changes the action — broken tests escalate to the on-call, not quietly quarantine.

**I:** OK. What about parameterized tests, where (test_name, browser, OS) is the real identity?

**C:** Score them independently. The unit of identity in my store is the tuple `(test_file, test_title, project, browser, os)`. A Playwright test that runs on Chromium and Firefox is two units. If Firefox is flaky but Chromium is solid, I want to flag only Firefox.

**I:** And how do you handle test renames? If I rename `it('login passes')` to `it('admin login succeeds')`, history is lost.

**C:** [pauses] This one's harder. Three options. One, hash by file + line + suite tree — fragile against refactors. Two, add an explicit test ID (`test('@id login-001', ...)`) and require teams to maintain it — invasive. Three, content-similarity heuristic — compare the test bodies of pre-rename and post-rename runs in the same diff. Cheap; works for ~80% of cases; breaks down for major rewrites.

In production I'd ship option three with a manual override: a CLI that lets a developer say "this test_id is a rename of that one." That keeps lineage usable for the common case without requiring every team to adopt an ID convention.

### [00:23–00:30] Quarantine mechanism

**I:** Move on. Quarantine. How does a CI runner know not to gate on a quarantined test?

**C:** A small API the CI calls before each run. Endpoint: `GET /quarantine/{repo}/{branch}` returns a list of test IDs. The CI runner uses this to either skip those tests, or — preferably — run them in a separate non-blocking job. Running them is important; you need data to know when they're safe to unquarantine.

**I:** A test passes 30 times in a row. What happens?

**C:** Auto-unquarantine. Specifically: a background job runs every hour, queries each quarantined test's last 30 main-branch runs, and if all 30 passed, removes it from the list. I'd also Slack the test owner saying "Hey, your test 'X' has been auto-unquarantined — please confirm the underlying issue is actually fixed before closing the ticket."

**I:** Why the human confirmation? You just said all 30 passed.

**C:** Because passing isn't always fixing. Sometimes a flaky test "self-heals" because the environment changed transiently — a flaky third-party API came back up, for example. Without owner confirmation you risk re-quarantining the same test in two weeks when the environment regresses again. The confirmation forces the owner to either (a) close the loop with a real fix, or (b) acknowledge "yeah, environment was unstable, watching."

**I:** OK. Alerts.

**C:** Slack DM to CODEOWNERS of the test file when newly flagged. Weekly digest to the engineering manager. PagerDuty only when org-wide flakiness exceeds 5% — that's a fire, not a notification. And critically, the alert volume per owner is capped: max 5 DMs per day per person. We don't want alert fatigue.

### [00:30–00:38] Pushback round

**I:** A few targeted questions. One — your ClickHouse cluster goes down for 4 hours. What happens?

**C:** Ingestion service buffers in the SQS queue. We have ~14 days of message retention on SQS by default; 4 hours is fine. Scoring API serves stale results from a Redis cache with a "data freshness" timestamp visible in the dashboard. Quarantine list is also cached in Redis. The system degrades but doesn't break.

**I:** Two — a team's CI is publishing duplicate test results. Like 3x for every test. How does that affect scoring?

**C:** Idempotency at ingestion. The dedup key is (run_id, test_id, attempt_number). If the same key arrives twice, the second write is a no-op. That's a property of the ingestion service, not of the upstream CI runners.

**I:** Three — leadership says "I want a single number that summarizes our org-wide test quality." Give me the metric.

**C:** I'd push back on a single number — it'll get gamed. But if forced, I'd offer two numbers, side by side: "Org-wide flaky test rate" (percent of tests with flip rate >10% in last 7 days) and "Failed-PR rate due to flaky tests" (percent of PR runs that failed solely because of a flagged-flaky test). The first measures the problem; the second measures the cost. Either alone is misleading.

**I:** I like that answer.

### [00:38–00:45] What you'd skip in v1 + risk

**I:** Last 7 minutes. Two things — what do you cut from v1, and what's the biggest risk?

**C:** I'd cut: ML-based prediction, fancy auto-unquarantine logic beyond the 30-run check, and per-team SLAs in v1. They're nice but they require working with stakeholders and tuning thresholds — too slow for a v1.

I'd keep: ingestion, ClickHouse, the flip-rate metric, basic quarantine API, Slack alerts. That's enough to ship in a quarter.

The biggest risk: **adoption**. The technical bits aren't hard. Getting 200 service teams to actually publish their test results to my endpoint, and trust the quarantine signal enough to follow up on tickets, is months of socialization. I'd invest more in evangelism, office hours, and seeded wins (visible quick fixes for 2–3 high-profile flaky tests in the first month) than I would in any single technical component.

**I:** That's a good answer. Any questions for me?

**C:** Two. One — does your org have an existing internal test-quality team I'd be working with, or am I founding it? That changes the timeline radically. Two — what's been tried before, and why didn't it stick?

**I:** [smiles] Both excellent questions. Founding it. Previous attempt was a static dashboard nobody owned — went stale in 3 months. I'll share more if we get to the offer stage. Thanks for the strong session.

---

## Calibration notes for the candidate (you, the reader)

What the interviewer rewarded:
- **Pushed back on the single-number metric** — showed product judgment, not just engineering.
- **Acknowledged renaming was a hard problem** — hedged honestly, picked a pragmatic middle ground (content-similarity + manual override).
- **Identified adoption as the biggest risk** — most candidates name a technical risk; the right answer in a 5000-engineer org is sociotechnical.

What the interviewer pushed on:
- **Why not Kafka?** — checking the candidate doesn't reach for the shiniest tool by default.
- **The flip-rate vs broken-test definition** — checking that definitions are operational, not vague.
- **The auto-unquarantine human confirmation** — checking the candidate understands self-healing isn't fixing.

Common ways this round goes wrong:
- Candidate jumps to architecture before defining "flaky" — interviewer pulls them back, time gets eaten.
- Candidate proposes Kafka + Spark + ML + Kubernetes for v1 — interviewer asks "what do you cut?" and candidate has nothing to cut.
- Candidate has no metric — when asked for "the number," they ramble. Have a metric ready (even one you'd push back on, like the example above).
