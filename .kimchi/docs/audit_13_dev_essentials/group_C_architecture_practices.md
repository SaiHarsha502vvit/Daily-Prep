# Group C Audit: System Design + Dev Tools + Production + Monitoring + Agile + Problem Sets

## Overall Verdict

**Needs Polish** — The group contains two severely under-scoped files (11 and 12 at ~300 and ~200 lines respectively) that break the folder's consistency and pedagogical promise. The remaining files (09, 10, 13) are genuinely strong with good production depth and historical context. The PROBLEM_SETS file is pedagogically excellent but has a structural issue (the `🟡 Erklärung` label pattern doesn't match the curriculum's `<details><summary>Answer</summary>` standard). The primary action is: expand 11 and 12 to match their index-declared scope, then do a pass on craft consistency across all files.

---

## File-by-file findings

### 09_System_Design.md

- **Depth score:** 2/3
- **Breadth score:** 2/3
- **Production score:** 3/3
- **History score:** 1/3
- **Craft score:** 2/3
- **Average:** 2.0

**Strengths:**
- The "From Single Server to Global Scale" level diagram (lines ~20-34) is an excellent WHY-first mental model — clearly establishes the problem before introducing solutions.
- The `CAP Theorem` section (lines ~280-315) explicitly states the invariant and traces the CP/AP encoding in replication protocols — this is university-level depth.
- The Conceptual Depth section at the end (~lines 450-480) explicitly names the invariant, the constraint that breaks it, and a practical signal — exactly what PEDAGOGY_STANDARDS requires.
- Production Reality section names four specific failure modes: cache stampede on hot key, consistency vs availability during partition, connection pool exhaustion from connection leaks, retry storm. These are specific and actionable (lines ~440-455).
- Challenge blocks are local and topic-matched. Challenge 1 (Reasoning) on vertical scaling (lines ~42-53) asks exactly the right question about hardware ceilings vs horizontal scaling.
- The token bucket trace challenge (lines ~360-370) is a textbook example of constraint-driven selection logic — it forces the learner to trace state changes.

**Weaknesses:**
- Historical Evolution dimension is very weak. The only year mentioned is "PODC 2000" for CAP theorem and "Gilbert-Lynch 2002" for the formal proof. No predecessor technologies, no evolution narrative, no modern production anchors with years.
- WHY/WHAT/WHERE/WHEN/WHO/HOW framing is only partially present. The file has WHY and WHAT sections but no explicit WHO or WHEN headers. The 5W1H scaffold is incomplete.
- The Load Balancer section (lines ~70-100) has no mention of health check protocols (HTTP vs TCP vs HTTPS health checks), failure detection interval trade-offs, or active vs passive health checks — these are practical production details.
- The Back-of-Envelope section (lines ~395-420) has a typo: "1 server handles: ~10,000 concurrent connections" — this conflates connections with requests per second. A server can handle 10K connections with 100 concurrent requests.
- Challenge block titles are inconsistent: some say `(Reasoning)`, `(Design)`, `(Trace)` — matching the contamination pattern of generic placeholder titles flagged in REPO_CLEANLINESS_STANDARD. Should be `(System Design — Vertical Scaling)`, `(System Design — Token Bucket)` etc.

**Contamination flags:** None — no wrong-domain challenges detected. All examples stay within the systems/devops/tooling boundary.

**Top 3 specific improvements:**
1. **Add historical timeline to Load Balancer and Caching sections** — name HAProxy (2001), Varnish (2005), nginx as load balancer (2004), Memcached (2003), Redis (2009) with their production motivations. This directly addresses the History score.
2. **Complete the 5W1H scaffold** — add explicit `WHO:` (who invented/popularized this — Brewer for CAP, etc.) and `WHEN:` (when to use each pattern) section headers that mirror the `WHY:` and `WHAT:` already present.
3. **Fix challenge title format** — change `(Reasoning)` → `(System Design — Vertical Scaling)` across all challenges to match the repo's cleanliness standard for specific topic-in-parentheses format.

---

### 10_Dev_Tools_Productivity.md

- **Depth score:** 2/3
- **Breadth score:** 2/3
- **Production score:** 2/3
- **History score:** 1/3
- **Craft score:** 2/3
- **Average:** 1.8

**Strengths:**
- The IDE shortcut tables (lines ~60-120) are genuinely useful reference material — comprehensive and platform-differentiated (Windows/Linux vs Mac).
- The Performance Profiling section (lines ~160-200) is strong. The `@Timed` aspect with `ProceedingJoinPoint` shows actual production instrumentation code, not toy examples.
- The debugging section (lines ~130-155) explicitly names the exact step controls (F7 vs F8 vs Shift+F8) — practical, runnable.
- The challenge block on profiling bottleneck diagnosis (lines ~210-225) is excellent — it forces the learner through an actual diagnostic workflow (Actuator → thread dump → N+1 query → JOIN FETCH fix).
- The Production Reality section names three specific failure modes: IDE plugin crash, SSH key rotation overhead, outdated toolchain causing CI failure (lines ~270-285). These are realistic operational pain points.
- The cheat sheet section (lines ~240-270) with the frequency heatmap is good pedagogical scaffolding — it answers "which shortcuts matter most" with a clear hierarchy.

**Weaknesses:**
- Historical Evolution is again very thin. No mention of when IntelliJ first shipped, when Maven/Gradle rivalry emerged, or when Spring Boot's `@SpringBootApplication` convention was introduced (2014).
- The file lacks WHO/HOW/WHEN section headers — it has WHY and WHAT but no explicit 5W1H structure beyond those two.
- The "WHERE: Daily Workflow Optimization" section (lines ~230-260) has a good idea but the execution is thin — it doesn't show actual PR workflow with branch protection rules, CODEOWNERS, or squash-merge strategies.
- No explicit invariant in any section — the pedagogical standards require each section to name the conserved property or invariant. The profiling section comes closest (N+1 queries are the bottleneck) but doesn't frame it as an invariant.
- The Maven/Gradle comparison (lines ~175-195) is one-directional (Gradle "faster" without naming trade-offs like Gradle's steeper learning curve or Maven's wider enterprise adoption).
- Challenge titles use generic `(Scenario)` and `(Reasoning)` — same contamination pattern as in 09. Should use `(Dev Tools — Profiling Bottleneck)`, `(Dev Tools — Sampling vs Instrumentation)`, etc.

**Contamination flags:** None — all content is appropriate for developer tooling.

**Top 3 specific improvements:**
1. **Add a historical timeline for the tool categories** — Maven (2002) vs Gradle (2007), the JetBrains founding (2000), the rise of Postman (2012) — with brief motivation sentences.
2. **Complete the 5W1H scaffold** — add WHO (JetBrains for IntelliJ, HashiCorp for Vault, etc.) and WHEN (when to use each tool tier) section headers.
3. **Fix challenge titles** — replace `(Scenario)` and `(Reasoning)` with topic-specific parentheticals per the repo cleanliness standard.

---

### 11_Production_Code_Practices.md

- **Depth score:** 2/3
- **Breadth score:** 1/3
- **Production score:** 2/3
- **History score:** 1/3
- **Craft score:** 1/3
- **Average:** 1.4

**Strengths:**
- The 12-Factor App section (lines ~15-35) is a solid, well-organized summary — each factor named and explained in one line. This is useful reference content.
- The MDC correlation ID example (lines ~75-90) is excellent production code — the `finally` block is explicitly called out as "load-bearing, not optional" which is exactly the kind of invariant teaching the rubric requires.
- The error handling section (lines ~115-145) has a strong OWASP information disclosure warning — this crosses into security education which is appropriate for production practices.
- The `catch (Exception e) { e.printStackTrace(); }` challenge (lines ~150-165) is a perfect local challenge — it's specific to production error handling, not a generic DSA problem.
- The Conceptual Depth section at the end (lines ~240-260) explicitly states the invariant and traces each of the 12 factors to a specific friction they remove. This is university-level reasoning.

**Weaknesses:**
- **This file is severely under-scoped.** The INDEX declares it as ~300 lines but it is exactly 300 lines, while neighboring files (09_System_Design ~520 lines, 10_Dev_Tools ~530 lines) are nearly double. The "Part X" numbering stops at Part 7 (API Best Practices). Missing: testing in production, deployment strategies (blue-green, canary), database migration strategies, feature flags, observability integration (the monitoring file 12 handles this separately but there should be cross-references).
- Topical Breadth is weak — the file covers 12-Factor (which is breadth), but the subsequent parts don't enumerate variants or trade-offs. For example, the API versioning section mentions "URI: /api/v1/" vs "Header" but doesn't discuss which trade-offs favor which approach.
- Historical Evolution is minimal — the 12-Factor was published by Heroku in 2011 (Adam Wiggins et al.), but no year, author, or motivation is mentioned.
- The file has NO explicit `WHY:` / `WHAT:` / `WHERE:` / `WHO:` / `WHEN:` / `HOW:` headers — it jumps straight into "Part 1: The 12-Factor App." This breaks the curriculum's canonical chapter scaffold.
- Only 4 challenge blocks total across 300 lines — this is below the challenge density expected per the pedagogical standards. Each Part should have a Section Challenge.
- The health check section (lines ~195-215) mentions "Readiness vs Liveness" but doesn't explain the Kubernetes controller distinction or what happens when you confuse them in practice.
- No `🔬 **Section Challenge**` labels in most sections — the file uses inline challenges inconsistently. The structured challenge format is not uniformly applied.

**Contamination flags:** None — content is correctly domain-appropriate.

**Top 3 specific improvements:**
1. **Expand to ~600+ lines** — add sections on: (a) Database migration strategies (Flyway/ Liquibase with rollback patterns), (b) Feature flags (LaunchDarkly-style progressive rollouts), (c) Deployment strategies (blue-green with nginx config, canary with weighted routing), (d) Testing in production (dark launches, A/B testing). This fills the index promise.
2. **Add complete 5W1H scaffold** — WHY: why does production code differ from tutorial code; WHAT: core patterns; WHERE: real company examples; WHEN: when each pattern applies; WHO: who created/deploys each pattern; HOW: concrete code/config examples.
3. **Add historical evolution** — 12-Factor was published by Heroku in 2011. Spring Boot 1.0 released 2014. Cloud-native as a term gained traction ~2015. Add these with motivation sentences.

---

### 12_Monitoring_Observability.md

- **Depth score:** 2/3
- **Breadth score:** 2/3
- **Production score:** 3/3
- **History score:** 2/3
- **Craft score:** 2/3
- **Average:** 2.2

**Strengths:**
- The Historical Evolution section (lines ~200-235) is **exceptional** — it names Etsy StatsD (2008/2011), SoundCloud Prometheus (2012), Grafana (2014), OpenTracing (2015), Google SRE Book (2016), Honeycomb (2016), Peter Bourgon's Three Pillars talk (2017), and OpenTelemetry (2019). This is the strongest historical treatment in the entire group.
- Production Reality is excellent (lines ~240-285). Seven named failure modes: log loss during incident (AWS S3 2017), alert fatigue (Atlassian 2018), missing correlation ID, cascading failure via alerting gap (AWS Kinesis 2020), high-cardinality metric explosion (Shopify 2019), P99 vs average hiding tail latency, SLO violation cascade. Each has a specific company/year and concrete fix.
- The Three Pillars section (lines ~15-35) uses a clear table format distinguishing what each pillar measures and the question it answers.
- The Prometheus Counter vs Gauge challenge (lines ~95-105) is a great local reasoning challenge — it forces understanding of monotonicity and why `decrease()` can't exist on Counters.
- The Golden Signals table (lines ~55-65) is production-anchored and practical.
- OpenTelemetry is named and explained with its 2019 formation from OpenTracing + OpenCensus — this is precise and accurate.

**Weaknesses:**
- **This file is also severely under-scoped.** ~200 lines while the index promises it as a substantial chapter. Missing: (a) detailed SLO/SLI/Error Budget explanation (mentioned once in passing), (b) Service Level Objectives with concrete calculation examples, (c) on-call practices and runbook templates, (d) Alert routing (PagerDuty, OpsGenie, severity levels), (e) Dashboard design principles (what makes a good Grafana dashboard), (f) Tracing propagation details (W3C Trace Context, B3 headers).
- The file has NO explicit `WHY:` / `WHAT:` / `WHERE:` / `WHO:` / `WHEN:` / `HOW:` headers — same scaffold breakage as file 11. It jumps straight into "The Three Pillars."
- The Distributed Tracing section (lines ~165-200) is thin — it shows a diagram and OpenTelemetry boilerplate but doesn't explain sampling strategies (head-based vs tail-based), span tag cardinality limits, or how to instrument custom spans in Java.
- Challenge blocks: only 3 challenges across ~200 lines. Should have at least 1-2 per major section.
- The Alerting Best Practices section (lines ~205-220) is good but brief — it lacks concrete PromQL/SLOQL examples for the "good alert" patterns.
- No explicit invariant statement. The Three Pillars each have an implicit invariant (metrics measure rates, logs record events, traces show causality) but none are stated.

**Contamination flags:** None — content is correctly domain-appropriate.

**Top 3 specific improvements:**
1. **Expand to ~500+ lines** — add sections on: SLO/SLI calculation with concrete examples (99.9% = 8.76 hours downtime/month), tail-based sampling vs head-based sampling trade-offs, custom span instrumentation in Spring Boot with OpenTelemetry SDK, runbook template format, and PagerDuty/OpsGenie severity escalation workflows.
2. **Add complete 5W1H scaffold** — this file desperately needs WHY (why observability matters more than monitoring), WHAT (three pillars), WHERE (Grafana dashboards, ELK in practice), WHEN (which pillar to consult first in an incident), WHO (observability engineers, SREs), HOW (configuration examples for each pillar).
3. **Add 3-4 more challenge blocks** — one per major section (Metrics, Logs, Traces, Alerting). Challenge on SLO burn rate calculation, challenge on tail-based sampling strategy selection.

---

### 13_Agile_Scrum.md

- **Depth score:** 2/3
- **Breadth score:** 2/3
- **Production score:** 2/3
- **History score:** 1/3
- **Craft score:** 2/3
- **Average:** 1.8

**Strengths:**
- The Waterfall vs Agile diagram (lines ~55-75) is an excellent mental model — contrasting "customer sees product at Month 8" vs "every 2 weeks" is visceral and memorable.
- The sprint commitment overestimation challenge (lines ~200-215) is excellent — it names Goodhart's Law explicitly and explains why velocity as KPI fails. This is sophisticated economics-meets-engineering reasoning.
- The Start/Stop/Continue retrospective format is clearly explained with a table (lines ~130-140).
- The INVEST criteria section (lines ~260-280) is comprehensive — all 6 criteria explained with violations identified.
- The "Doing Agile" vs "Being Agile" mental model at the end (lines ~380-400) is genuinely brilliant — "Cargo Cult Agile" is the exact right vocabulary and the contrast between ceremony and feedback loops is pedagogically precise.
- Multiple challenge blocks throughout with varied types: Reasoning, Design, Trace — this is good craft diversity.
- The DoD bypass challenge (lines ~340-355) is specific and actionable — branch protection rules, CODEOWNERS, CI gate.

**Weaknesses:**
- Historical Evolution is thin — only the 2001 Snowbird date for the Manifesto is present. No mention of Scrum's origins (Schwaber & Sutherland 1993), XP's influence (Beck 1999), the pre-2001 method wars that motivated the manifesto, or the Scrum being just ONE of the signatories (XP, Crystal, FDD, DSDM were also represented).
- No explicit `WHO:` section header. The manifesto signatories, Schwaber, Sutherland, Beck are mentioned in passing but not organized under a historical figure section.
- The Kanban vs Scrum comparison table (lines ~315-330) is thin — it lists 6 aspects but misses critical differences: Scrum's timeboxed sprints vs Kanban's continuous flow creates different team cadences, which affects how bugs, interrupts, and tech debt are handled.
- The story points section (lines ~290-310) mentions Fibonacci but doesn't explain *why* Fibonacci is used (it reflects increasing uncertainty at larger stories — the gap between 13 and 21 is much larger than between 2 and 3).
- No invariant explicitly stated for the Agile Manifesto. The Conceptual Depth section at the end (~lines 425-445) does a good job but the word "invariant" isn't used.
- Challenge titles use generic `(Reasoning)` and `(Design)` — same contamination pattern.

**Contamination flags:** None — all content is correctly within the Agile/process domain.

**Top 3 specific improvements:**
1. **Add Scrum's 1993 origins and the pre-Manifesto method wars** — the Agile Manifesto was a response to the failure of heavyweight methods (CMM, RUP). Contextualizing this makes the values more meaningful. Also add Ken Schwaber and Jeff Sutherland's 1993 Scrum paper.
2. **Explain why Fibonacci for story points** — the exponential spacing reflects increasing uncertainty as story size grows. This is a teachable moment for estimation theory.
3. **Complete the Kanban vs Scrum comparison** — add rows for: how each handles production interrupts/bugs, how each manages tech debt allocation, and how team structure differs (cross-functional Scrum team vs specialized Kanban flow).

---

### 13_PROBLEM_SETS.md

- **Depth score:** 2/3
- **Breadth score:** 2/3
- **Production score:** 2/3
- **History score:** 2/3
- **Craft score:** 2/3
- **Average:** 2.0

**Strengths:**
- The Historical Evolution section (lines ~275-310) is excellent — same quality as file 12's history section. Names Elasticsearch (2010), StatsD (2008/2011), Prometheus (2012), Grafana (2014), OpenTracing (2015), SRE Book (2016), Three Pillars (2017). This is thorough.
- The `🟡 Erklärung` (German for "Explanation") label for deep reasoning notes is a distinctive pedagogical device — it signals "here is where your mental model breaks" which is pedagogically valuable.
- The DEV-PS1 Git problems are strong — the `git add` then `git commit` state table is exactly the right way to teach staging area mechanics. The BFG vs filter-branch comparison is production-accurate.
- The DEV-PS2 refactoring problem (lines ~130-185) is excellent — it shows a real "God class" before state and applies SRP, OCP, DIP to decompose it. The SOLID annotations are explicit.
- The DEV-PS3 p99 latency jump diagnostic (lines ~240-275) is the best problem in the file — it walks through metrics → traces → logs → fix → verify, which is exactly the production debugging workflow.
- Problems are difficulty-rated (Easy, Medium, Hard) — appropriate scaffolding.

**Weaknesses:**
- **Structural issue: `🟡 Erklärung` blocks are non-standard.** The curriculum mandates `<details><summary>Answer</summary>` for answer blocks. The `Erklärung` pattern appears to be a local convention that doesn't match the canonical format used everywhere else. This creates inconsistency when readers move between files.
- The file uses `<details><summary>Answer</summary>` for the primary answers but also uses `🔴 Erklärung` as a secondary deeper-explanation block. This dual-layer pattern is not documented anywhere in the curriculum's standards and could confuse readers about which block to check first.
- Only 3 problem sets (DEV-PS1, DEV-PS2, DEV-PS3) covering Git, API Design/Clean Code, and Monitoring. Missing: Docker, CI/CD, Linux CLI, Testing — all of which are in the folder's index. The problem sets don't cover all the chapters.
- The API design answer table (lines ~105-120) is strong but the REST rules listed (POST returns 201, DELETE returns 204) are stated as assertions without explaining *why* HTTP specifies these semantics — no invariant explanation.
- The Git cherry-pick vs merge vs rebase table (lines ~40-55) is excellent, but the "golden rule" warning about never rebasing pushed commits could be stronger — it should mention `git push --force-with-lease` as the safer alternative to `--force`.
- No explicit `WHY:` / `WHAT:` / `WHERE:` / `WHO:` / `WHEN:` / `HOW:` chapter headers. This file is structured as a problem set, not a chapter, so the scaffold expectation is different — but the absence of orientation material at the top means a reader doesn't know what prior knowledge is assumed.

**Contamination flags:** None — content is correctly within the domain.

**Top 3 specific improvements:**
1. **Replace `🔴 Erklärung` with standard `<details><summary>Deep Dive</summary>`** — align with the curriculum's canonical answer block format. The `Erklärung` label adds no functional value that a `<details>` block with a "Key Insight" summary wouldn't provide, and creates format inconsistency.
2. **Expand to cover Docker and CI/CD problem sets** — add DEV-PS4 (Docker: writing a Dockerfile, docker-compose.yml, multi-stage build) and DEV-PS5 (CI/CD: writing a GitHub Actions pipeline with test, build, deploy stages). Currently missing 40% of the folder's chapters from problem coverage.
3. **Add problem for rate limiting / circuit breaker** — the System Design chapter (09) covers these patterns extensively but the problem sets don't include a problem on token bucket implementation or Resilience4j configuration. This is a gap between the chapter content and assessment.

---

## Cross-file flow observations

**The progression 09 → 10 → 11 → 12 → 13 → 13_PROBLEM_SETS makes logical sense:**
- 09 (System Design) teaches the *concepts* (load balancers, caches, queues, CAP)
- 10 (Dev Tools) teaches the *instrumentation* (profilers, debuggers, Postman, Actuator)
- 11 (Production Code) teaches the *code patterns* (12-factor, structured logging, error handling)
- 12 (Monitoring) teaches the *feedback loops* (metrics, logs, traces, alerting)
- 13 (Agile) teaches the *team process* (how the previous four files' outputs get delivered)

This is a coherent learning arc. The PROBLEM_SETS at the end serves as the assessment layer.

**However, there are critical sequencing problems:**

1. **Files 11 and 12 are stubs breaking the arc.** When a reader finishes 09 (System Design, ~520 lines) and moves to 10 (Dev Tools, ~530 lines), they expect 11 to continue at comparable depth. Instead they hit a ~300-line file that reads like a summary outline. The same happens with 12 (~200 lines). This creates a "fake cliff" — the content quality drops mid-chapter without warning. Readers may conclude the curriculum is unfinished.

2. **PROBLEM_SETS covers only 3 of 7 chapter topics.** The missing Docker, CI/CD, and Testing coverage means the problem sets can't serve as a comprehensive assessment for the folder. A reader who completes all problem sets still hasn't practiced Docker or CI/CD problems.

3. **The mental model cross-reference is inverted.** The navigation at the top of file 11 says: `🧠 Mental Model: See [Production Debugging Thinking](../14_Mental_Models/18_Production_Debugging_Thinking.md)`. This reference should be at the TOP of the file (orientation), not a footer. Similarly for file 12. Readers entering mid-curriculum won't know what prior knowledge is assumed.

4. **No bridge content between System Design (09) and Production Code (11).** The folder index says chapters build on each other, but 09 → 11 is a big jump. A reader finishing System Design doesn't know *why* they need Production Code Practices next. A single bridging sentence at the end of 09 ("now that you know how to design systems, let's look at how to implement them for production") would help.

---

## Recommended action plan

**Priority 1 (files scoring < 1.5 average or missing scaffold):**

1. **Expand 11_Production_Code_Practices.md to ~600+ lines** — add sections on: database migration patterns (Flyway with up/down migrations), feature flags, blue-green and canary deployment with concrete nginx/kubernetes config examples, testing in production (dark launches, shadow traffic). Add complete 5W1H scaffold at the top. This is the most critical fix — a 300-line chapter in a folder where all others are 500+ signals incompleteness.

2. **Expand 12_Monitoring_Observability.md to ~500+ lines** — add sections on: SLO/SLI/Error Budget with concrete calculations (99.9% SLO = X hours downtime), tail-based vs head-based sampling, custom OpenTelemetry span instrumentation in Spring Boot, runbook template, PagerDuty severity escalation. Add complete 5W1H scaffold. This is the second most critical fix for the same reason as #1.

**Priority 2 (craft consistency, scoring ~1.8-2.0):**

3. **Fix challenge title format across all 6 files** — replace generic `(Reasoning)`, `(Design)`, `(Scenario)` with topic-specific parentheticals: `(System Design — Vertical Scaling)`, `(Dev Tools — Sampling Profiler)`, `(Production — Error Handling)`, etc. Per REPO_CLEANLINESS_STANDARD: "include a specific topic in parentheses, not just `(Reasoning)` as a generic placeholder."

4. **Add historical evolution to files 09, 10, 13** — file 12 already has excellent history; files 09 and 10 are nearly absent on this dimension. 09 should add: when HAProxy (2001), Varnish (2005), Memcached (2003), Redis (2009) emerged and why. 10 should add: Maven (2002) vs Gradle (2007), JetBrains founding (2000). 13 should add: Scrum's 1993 origins, the pre-Manifesto method wars (CMM vs XP), Beck's Extreme Programming (1999).

5. **Standardize the `Erklärung` pattern in 13_PROBLEM_SETS** — replace `🔴 Erklärung` / `🟡 Erklärung` with standard `<details><summary>Key Insight</summary>` per the curriculum's canonical answer block format. This aligns the PROBLEM_SETS with all other files.

6. **Add a bridge sentence at the end of 09_System_Design.md** — "Having designed scalable systems, let's look at how to implement them in production. → [11_Production_Code_Practices.md]" This makes the reading arc explicit.

**Priority 3 (minor polish, scoring ~2.0+):**

7. **Expand PROBLEM_SETS to include Docker and CI/CD problems** — add DEV-PS4 (Docker multi-stage build, docker-compose, healthcheck) and DEV-PS5 (GitHub Actions with test/deploy stages, environment promotion). This closes the coverage gap.

8. **Complete 5W1H scaffold in files 09, 10** — add explicit WHO and WHEN headers. Files 11, 12, 13 are missing the scaffold entirely and need it added.

9. **Add challenge blocks to files 11 and 12** — both files have too few challenges for their length. 11 needs at least 2 more (one on database migrations, one on feature flags). 12 needs at least 3 more (one on SLO calculation, one on sampling strategy, one on runbook structure).

10. **Fix the typo in 09** — "1 server handles: ~10,000 concurrent connections" should clarify this means connections (not QPS) and note the distinction.

---

**Summary table:**

| File | Average | Primary Issue | Fix Priority |
|------|---------|---------------|--------------|
| 09_System_Design | 2.0 | Thin history, incomplete 5W1H | P3 |
| 10_Dev_Tools_Productivity | 1.8 | Thin history, challenge title format | P2 |
| 11_Production_Code_Practices | 1.4 | Severely under-scoped (300 lines) | **P1** |
| 12_Monitoring_Observability | 2.2 | Under-scoped (200 lines), thin on details | **P1** |
| 13_Agile_Scrum | 1.8 | Thin history, incomplete Kanban comparison | P2 |
| 13_PROBLEM_SETS | 2.0 | `Erklärung` non-standard, incomplete coverage | P2 |

**Files needing immediate upgrade ferments:** 11 and 12 (both scoring < 1.5 on Breadth or average < 2.0 with missing scaffold). Files 09, 10, 13 are "needs polish" — good content with targeted improvements. File 13_PROBLEM_SETS is "needs polish" — strong content with format consistency issues.