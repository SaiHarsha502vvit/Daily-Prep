# Change Journal

Add short entries when context, structure, or domain boundaries change.

## 2026-06-01 — 02_Data_Structures: Pedagogy Refinement (Depth/Theory/5W1H)

Changed:

- Updated `02_Data_Structures/01a_Memory_Foundations.md` through `01g_DS_Internals.md` — Added 5W1H framing and Challenge blocks.
- Updated `02_Data_Structures/02a_DS_Variants_Core.md` and `02b_DS_Variants_Advanced.md` — Added 5W1H framing.
- Updated `02_Data_Structures/03_Collections_Java.md` — Added 5W1H framing.
- Updated `02_Data_Structures/04_2D_Arrays_Matrix.md` — Added 5W1H framing.
- Updated `02_Data_Structures/05_DS_In_Production.md` — Added 5W1H framing.
- Updated `02_Data_Structures/00_DS_PROBLEM_BRIDGES.md` — Added 5W1H framing.

Reason:

- The user requested applying the pedagogical lens (5W1H and depth/theory challenges) to all modules in the `02_Data_Structures` folder.

Verification:

- Pending `update_context.ps1 -Mode update` and `check`.

## 2026-06-01 — 15_React_Frontend: Pedagogy Refinement (Depth/Theory/5W1H)

Changed:

- Updated `15_React_Frontend/07_React_Testing.md` — Added 5W1H framing.
- Updated `15_React_Frontend/08_React_Performance.md` — Added 5W1H, Practice Challenges, and Cross-References.
- Updated `15_React_Frontend/09_React_Deep_Reasoning.md` — Added 5W1H framing.
- Updated `15_React_Frontend/10_Custom_Hooks_Library.md` — Added 5W1H framing.
- Updated `15_React_Frontend/11_Complex_UI_Pages_Patterns.md` — Added 5W1H and Practice Challenges.
- Updated `15_React_Frontend/12_Hands_On_React_Projects.md` — Added 5W1H framing.

Reason:

- The user requested applying the pedagogical lens (5W1H and depth/theory challenges) to the remaining modules in the `15_React_Frontend` folder.

Verification:

- `update_context.ps1 -Mode update` completed.
- `update_context.ps1 -Mode check` passed.

## 2026-06-01 — 21_SDET_Playwright_Automation: Core Architecture Updated

Changed:

- Updated `21_SDET_Playwright_Automation/02_Core_Architecture/07_test_step_E2E_Architecture.md` — Added references for `test.step`, soft assertions, test timeouts, multi-page contexts, global teardown, and `test.info()`.
- Updated `21_SDET_Playwright_Automation/02_Core_Architecture/08_Browser_Internals_for_SDETs.md` — Added references for Actionability checks, wait semantics, CDP Session API, Rendering performance, accessibility tree, and CDP Viewer.
- Updated `21_SDET_Playwright_Automation/02_Core_Architecture/09_Parallel_Execution_Workers.md` — Added references for parallelism, sharding, test annotations, GitHub Actions, Node event loop, and merge-reports.

Reason:

- The user requested that verified links/references be included in all upgraded content within the `21_SDET_Playwright_Automation` module (Folder 02–08).

Verification:

- `update_context.ps1 -Mode update` completed.
- `update_context.ps1 -Mode check` passed.

## 2026-05-30 — 21_SDET_Playwright_Automation: 01_Environment_Setup_and_First_Test.md created

Changed:

- Added `21_SDET_Playwright_Automation/01_Environment_Setup_and_First_Test.md` — the Day Zero setup chapter that every other chapter in the module assumes is complete.
  - 5W1H scoped to readers who have not yet run `npm init playwright@latest`.
  - Section 1: Node.js install — check command, download link, verify, why Node.js is needed.
  - Section 2: VS Code + Playwright Extension, ESLint, Prettier — what the extension sidebar and Pick Locator button actually do.
  - Section 3: `npm init playwright@latest` — CLI prompts walk-through, generated project structure table, one-sentence purpose for each file.
  - Section 4: Three run modes (headless, headed, single file) — real passing and failing output; `npx playwright show-report`.
  - Section 5: Inspector (`--debug`) — step panel, DOM panel, locator highlighting, `page.pause()` usage, Pick Locator button.
  - Section 6: Codegen — what it does, ❌ three reasons not to paste output as-is (fragile selectors, no POM, no await), ✅ how to use it as a locator explorer.
  - Section 7: First real test from scratch — `playwright.dev` navigation + assertion; line-by-line commentary explaining async, CDP, retrying assertions, and locator selection hierarchy table.
  - Section 8: Where to go next (bullet list only).
  - 3 Practice Challenges: MCQ (Inspector vs headed), Spot the Bug (codegen output with 4 problems), Write it yourself (the-internet.herokuapp.com login).
  - Navigation header + footer matching the requested format.

Reason:

- Every existing chapter assumes `npm init playwright@latest` has been run. This file fills that genuine gap for anyone starting from zero.

Verification:

- `update_context.ps1 -Mode update` completed: 588 active Markdown files registered.
- `update_context.ps1 -Mode check` passed: Context fresh.

## 2026-05-30 — 21_SDET_Playwright_Automation: 00_Start_Here.md created

Changed:

- Added `21_SDET_Playwright_Automation/00_Start_Here.md` — navigation-only module entry point (no teaching content).
  - One-paragraph intro scoped to working SDETs on D365/JSP/ASPX, not beginners.
  - Prerequisites table: JS (`16_JavaScript/`), TS (`17_TypeScript/`), Testing Fundamentals (`00_Testing_Fundamentals/`), env setup.
  - Environment Setup one-liner pointing to `01_Environment_Setup_and_First_Test.md`.
  - 4 reading paths by background: new to automation / D365 job starter / interview prep / senior SDET architect.
  - Full file map table (all 44+ chapters + quizzes + new files) sourced from `00_INDEX.md`.
  - Cross-module links section: API Testing, TypeScript, DevOps/CI, SQL/DB, DSA (SDET→SDE bridge).
  - Also noted: context was stale due to `00_Testing_Fundamentals/` files moving from `23_Mobile_Dev_And_Testing/` to `21_SDET_Playwright_Automation/` and new Android chapters added; this file was not affected by those moves.

Reason:

- Module needed a navigation anchor that lets readers find the right reading path without re-reading the full index.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.

## 2026-05-30 — 20_Interview_Mastery: 17_Production_Incident_Lessons.md created

Changed:

- Added `20_Interview_Mastery/17_Production_Incident_Lessons.md` — 5 production incident stories teaching technical concepts through narrative (1113 lines).
  - Incident 1: "The Boundary Attack" — Fixed-window vs sliding-window rate limiting (DSA + Spring Boot, P2).
  - Incident 2: "The Ghost Cache" — READ_ONLY vs READ_WRITE cache strategy + missing collection annotation (Spring Boot + DSA, P1).
  - Incident 3: "The Kafka Déjà Vu" — At-least-once delivery + Redis SETNX idempotency (Spring Boot + SDET, P2).
  - Incident 4: "The Cascade" — N+1 problem under load; O(N) round-trips; @EntityGraph fix (Spring Boot + DSA, P1).
  - Incident 5: "The Immortal Lock" — Distributed lock without lease; Redisson tryLock fix (Spring Boot + DSA, P1).
  - Summary table: all 5 incidents, bug type, domain, what would have caught it.
  - Interview usage guide: opening pattern, signal, when to use each incident.

Reason:

- Engineers remember stories far better than abstract concepts. Each incident follows alert → investigation timeline → root cause deep-dive → fix → test → what this teaches → interview connection format.
  Context check passed (fresh) before creation.

Verification:

- Fence parity: Fences=68 EVEN-OK, Lines=1113.
- `update_context.ps1 -Mode update` completed: 568 active Markdown files registered.
- `update_context.ps1 -Mode check` passed: Context fresh.

## 2026-05-30 — 20_Interview_Mastery: 15_Quick_Reference_Cards.md created

Changed:

- Added `20_Interview_Mastery/15_Quick_Reference_Cards.md` — 10-card pre-interview cheat-sheet (410 lines).
  - Card 1: Test slice annotation decision tree + reference table.
  - Card 2: MockMvc vs WebTestClient vs TestRestTemplate decision tree + API comparison table.
  - Card 3: JPA L2C cache strategy decision tree + write-behaviour table.
  - Card 4: Rate limiting algorithm decision tree + comparison table.
  - Card 5: DSA complexity table (11 structures, SDET/Spring Boot use column).
  - Card 6: Spring Boot interview keyword activator (6 topics, exact phrases).
  - Card 7: SDET interview keyword activator (5 topics, exact phrases).
  - Card 8: 5-point answer framework + worked rate-limiter example with code.
  - Card 9: Common latency numbers table + rationale section.
  - Card 10: One-line rapid-fire definitions (10 terms).

Reason:

- Pre-interview reference file requested. Dense, scannable, ASCII decision trees.
  Context check passed (fresh) before creation.

Verification:

- Fence parity: Fences=12 EVEN-OK, Lines=410.
- `update_context.ps1 -Mode update` completed: 567 active Markdown files registered.

## 2026-05-28 (SDET, Playwright & Advanced API Curriculum Integration)

Changed:

**New SDET Modules Created:**
- `21_SDET_Playwright_Automation/` — Added 4 chapters focused on shifting from manual QA to SDET, Playwright TypeScript basics, Enterprise locators (XPath vs getByRole for Dynamics 365), and browser console scripting for DOM traversal.
- `22_Advanced_API_Testing/` — Added 3 chapters focusing on REST vs SOAP, deep JSON array traversal via Optional Chaining/array methods, XML-to-JSON parsing for SOAP, and enterprise headers/authentication mocking.

**Study Plan Upgraded:**
- Added `01_Getting_Started/03_SDET_1Hour_Daily_Path.md` — Created a custom 5-day rotation schedule strictly bounded to 1 hour/day, blending the new SDET/API modules with existing SQL, TypeScript, and DSA chapters.
- `00_MASTER_INDEX.md` — Integrated the two new modules into the main table of contents and Quick Links.

Reason:

- User transitioned to a new SDET role using Playwright/TypeScript and testing complex Dynamics 365 enterprise apps (deeply nested JSON, SOAP APIs, dynamic DOM elements). The curriculum needed to pivot to a "Zero to Mastery" automation track that complements the existing Java/DSA architecture content while respecting a 1-hour/day learning constraint.

Verification:

- `update_context.ps1 -Mode update` and `-Mode check` both passed: 511 active Markdown files match manifest.

## 2026-05-28 (Phase 6 — Context Upgrade + Orphan Cleanup + OSS Enrichment)

Changed:

**Context System Upgrades (`00_CONTEXT/`):**
- `PEDAGOGY_STANDARDS.md` — Added concrete OSS reference format template (D009+D012), `Repo Cleanliness Standard` section (no orphaned answers, no double `<details>`, consistent challenge titles), expanded Parallel Agent Coordination with Codex-specific notes, expanded Final Quality Checklist.
- `REPO_MAP.md` — Added `tools/update_context.ps1` root file row, SQL location clarification (some files in `20_Interview_Mastery`), expanded `_archive` rules (4 rules), added `Agent Quick Start` powershell block.
- `UPDATE_PROTOCOL.md` — Added `When Another Agent Is Active` section with 5-step Codex coordination protocol.

**Orphan Cleanup (boilerplate answer blocks removed after prior challenge replacements):**
- `07_Modern_Java/Ch06_Functional_Programming.md` — Removed 2 orphaned "Not until collect()" boilerplate answers from Creating Streams and Intermediate Ops sections.
- `07_Modern_Java/Ch43_SB_Auth_Security.md` — Removed 4 orphaned OAuth2 authorization-code and JWT-vs-session answer blocks from JWT, Pre/PostAuthorize, OAuth2, and API-key sections.
- `07_Modern_Java/Ch50_SB_DSA_Applications.md` — Removed 1 orphaned Trie/LIKE% answer block from Dijkstra routing section.
- `07_Modern_Java/Ch19_JVM_Object_Model.md` — Sanitized 4 duplicate boolean memory layout challenges with domain-appropriate 5W1H challenges.
- `07_Modern_Java/Ch07_Modern_Java_9to21.md` — Sanitized 4 duplicate virtual threads challenges with domain-appropriate 5W1H challenges.
- `13_Developer_Essentials/19_Concurrency_Models_Coroutines.md` — Reviewed ExecutorService usage (verified clean).

**Open-Source Reference Anchors added (D009+D012 format):**
- `02_Data_Structures/01g_DS_Internals.md` — OpenJDK `HashMap.java` Poisson distribution / TREEIFY_THRESHOLD constant anchor after the HashMap.Put() Deep Dive challenge.
- `07_Modern_Java/Ch06_Functional_Programming.md` — OpenJDK `ReferencePipeline.java` StatelessOp/StatefulOp chain laziness anchor after Creating Streams section.
- `07_Modern_Java/Ch43_SB_Auth_Security.md` — jjwt `DefaultJwtParser.java` constant-time signature comparison anchor after JWT Signature Verification challenge.
- `07_Modern_Java/Ch50_SB_DSA_Applications.md` — cp-algorithms Dijkstra (greedy choice + negative-weight constraint) anchor and OpenJDK `TreeMap.java` Red-Black Tree (reverseOrder, rank count) anchor.

Reason:

- Per D009 and D012: enrich learning content with stable OSS anchors explaining the real invariant behind each challenge, with explicit constraint warnings for when the source model diverges from the local context. Per Repo Cleanliness Standard: removed all orphaned boilerplate answer duplicates found during sanitization audit.

Verification:

- `update_context.ps1 -Mode update` and `-Mode check` both passed: 503 active Markdown files match manifest.

## 2026-05-28 (Phase 5 Systematic Deduplication - Batch 3)


Changed:

- `08_SQL/21_Database_Internals.md` - replaced 2 Java string identity/immutability challenge blocks with local database buffer-pool, checkpoint, LRU/flush-list, and doublewrite-buffer challenges.
- `08_SQL/42_RealWorld_Production_Scenarios_Part5.md` - replaced a Java string challenge in the HikariCP exhaustion scenario with connection hold-time and pool-sizing reasoning; fixed the challenge/code-fence placement around the YAML snippet.
- `08_SQL/44_Interview_Scenarios_Explained_Part1.md` - replaced a Java string challenge in the connection-pool exhaustion scenario with transaction-scope and emergency-session-termination reasoning; fixed the challenge/code-fence placement around the YAML snippet.
- `08_SQL/47_Theory_Deep_Dive_Database_Internals.md` - replaced a Java string challenge with buffer-cache hit-ratio and shared-buffer sizing tradeoffs.
- `08_SQL/48_Problem_Variants_Bank.md` - replaced a Java string challenge with Little's Law pool-sizing and zombie-connection guardrail reasoning.
- `08_SQL/33_SQL_Security_Injection.md` - replaced a JWT/session-cookie challenge with SQL logging/redaction security reasoning.
- Updated `00_CONTEXT/CONTAMINATION_GUARDS.md` with the JWT/session-cookie contamination family.

Reason:

- Continued the parallel pedagogy cleanup by removing wrong-domain Java/security prompts from SQL-first sections while preserving surrounding content.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.

## 2026-05-28 (Pedagogy Standards Institutionalization)

Changed:

- Added `00_CONTEXT/PEDAGOGY_STANDARDS.md` as the shared teaching-quality standard for future agents.
- Updated `AGENTS.md` and `00_CONTEXT/README.md` so agents read the standards before editing content.
- Added D010 to `00_CONTEXT/DECISIONS.md`.
- Expanded `00_CONTEXT/CONTAMINATION_GUARDS.md` with Phase 5 duplicate challenge families and linked the replacement rule to the pedagogy standards.

Reason:

- The parallel Antigravity work is systematically replacing wrong-domain challenge boilerplate. This makes the standard explicit, model-agnostic, and reusable instead of leaving it implicit in one conversation.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.

## 2026-05-28

Changed:

- Added a permanent open-source reference rule to `00_CONTEXT/DECISIONS.md`.
- Added open-source reference anchor guidance to the constraint-based pattern guide and pattern trigger guide.
- Added linked-list implementation anchors and replaced a wrong-domain prefix-sum challenge with a linked-list constraint rewrite challenge.
- Updated pattern and mental-model folder context to preserve this convention for future agents.

Reason:

- The owner wants future agents to enrich guides with strong open-source implementations while keeping explanations constraint-first and avoiding blind copy-paste.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.

## 2026-05-26 (Phase 5 Systematic Deduplication — Batch 1)

Changed:

- `Ch22_Java_Deep_Reasoning.md` — 5 duplicate `new String("hello") == "hello"` blocks replaced: Integer cache boundary, final three meanings, autoboxing loop penalty, fail-fast iterator, default method diamond.
- `Ch55_Spring_Internals.md` — 8 duplicate `BeanCurrentlyInCreationException` boilerplate blocks replaced: @Autowired ambiguity resolution, CGLIB final class failure, @ConditionalOnMissingBean ordering, @ComponentScan package boundary, @Profile misfire, third-bean circular dependency fix, DispatcherServlet 404 flow, startup-to-shutdown lifecycle trace.
- `Ch58_SB_Deep_Reasoning.md` — 10 cross-domain contaminations replaced (JWT, @Async proxy bypass, JS Promise.all, SQL T1/T2 anomaly) with section-specific Spring Boot challenges: Filter vs Interceptor selection, @SpringBootApplication without @EnableAutoConfiguration, AutoConfiguration negative match debug, @Transactional private method, IoC test pain, constructor injection immutability, request-scoped prototype, 401 vs 403 filter trace, property source priority order, @Async thread pool exhaustion.
- `Ch53_SB_Distributed_Tracing.md` — 4 duplicate `Trace ID vs Span ID` blocks replaced: Kafka header propagation break, tail-based vs head-based sampling, Zipkin slow-span cs/sr timing analysis, TestObservationRegistry assertion.
- `Ch34_SB_Security_Part4.md` — 6 wrong-domain blocks replaced: JDBC HikariCP connection pool exhaustion, @OneToMany EAGER N+1 + OOM, Spring Data derived query OR/AND ambiguity, @Transactional REQUIRES_NEW outbox problem, HTTP POST idempotency key pattern, @MockBean vs @SpyBean behavioral difference.
- `13_Greedy.md` — 7 duplicate `interval scheduling sort by end time` blocks replaced: exchange argument proof, coin change greedy failure condition, Jump Game II greedy choice, gas station O(n) circular reset, Task Scheduler formula, digit maximization monotonic stack, Huffman coding prefix-free property.
- `03b_Recursion_Fundamentals.md` — 7 duplicate `Stack<State> replaces call stack` blocks replaced: factorial stack memory cost, binary recursion O(n) tree visit, tail recursion in Java (no TCO), mutual recursion base case completeness, merge sort auxiliary space, linked list reversal pointer order, tree traversal order selection (pre/in/post).
- `05c_Graphs_Fundamentals.md` — 7 duplicate `BFS unweighted shortest path` + 2 binary-search contaminations replaced: adjacency list vs matrix memory, DAG cycle detection 3-color, DFS stack overflow risk, BFS completeness guarantee proof, connected components BFS outer loop, topological sort DFS vs Kahn's, Dijkstra correctness and negative edge failure.

Reason:

- D005: Challenge blocks must match local domain. Continued systematic elimination of stamped boilerplate. Each replacement produces a unique 5W1H (Who/When/What) trace-reasoning challenge aligned with the section's actual topic.

Contamination families identified and logged in CONTAMINATION_GUARDS.md:

- `new String("hello") == "hello"` — stamped into Ch22 sections 4, 7, 9, 10, 12.
- `BeanCurrentlyInCreationException` circular dependency — stamped into Ch55 sections 5-13.
- `@Async proxy bypass` / `JWT vs session cookies` / `Promise.all` / `T1/T2 balance UPDATE` — mixed contamination stamped into Ch58 sections 1-12.
- `Trace ID vs Span ID` — stamped into Ch53 sections 8, 9, 11, 12.
- `ROLE_ prefix hasRole convention` + `N+1 JPA` + `T1/T2` — stamped into Ch34 sections JDBC, Entity, Repository, Transaction, REST, Testing.
- `interval scheduling sort by end time` — stamped 7× into 13_Greedy sections.
- `Stack<State> replaces call stack` — stamped 7× into 03b sections.
- `BFS finds shortest path in unweighted graphs` + `binary search [1,3,5,7,9]` — stamped into 05c sections.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.

## 2026-05-28 (Phase 5 Systematic Deduplication — Batch 2)

Changed:

- `19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md` — 8 prefix-zero duplicates replaced: sentinel vs non-sentinel ArrayIndexOutOfBounds, HashMap put(0,1) for index-0 subarray miss, XOR self-inverse property, XOR HashMap count, negative modulo pitfall in Java (prefix % k + k) % k, 2D inclusion-exclusion PIE signs, 2D row-major memory layout, 2D use-case area query complexity.
- `Ch02_Strings_Immutability.md` — 4 concat-loop duplicates replaced (sections 2, 3, 5, 7): intern() pool vs heap OOM, compile-time vs runtime concat with invokedynamic, Compact Strings LATIN1/UTF16 coder field, substring() memory sharing Java 6 vs 7 OOM fix.
- `Ch03_Enums_Records_Sealed.md` — 6 Record DTO duplicates replaced (sections 5, 7, 11, PART3, 13, 16): enum singleton JVM class-loading thread safety, enum compiler output + values() defensive copy + == safety, Record + Jackson @JsonCreator fix, sealed class permits enforcement at compile + JVM level, pattern matching switch exhaustiveness checker, non-sealed payment domain model.
- `Ch05_DateTime_Regex.md` — 6 LocalDateTime duplicates replaced (sections 5, 6, 8, 9, 10, 12): Duration vs Period DST skip pitfall, DateTimeFormatter immutability + RFC_1123_DATE_TIME, ReDoS catastrophic backtracking + possessive quantifiers, Matcher.find() vs matches() full-string semantics, capturing group back-reference $1 vs \\1 confusion, String.replaceAll() with user input ReDoS risk.
- `Ch13_Networking_NIO.md` — 6 NIO vs IO duplicates replaced (sections 2, 3, 6, 8, 9, 10): blocking socket C10K thread model, ServerSocket accept() SocketException shutdown pattern, ByteBuffer flip() position/limit semantics + silent write-0 bug, Selector OP_WRITE CPU spin bug, non-blocking partial write retry strategy, SSL/TLS PKIX path building failure diagnosis.
- `10_Graphs.md` — 6 BFS duplicates replaced (sections PART0, 9.1, 9.2, 9.5, 9.6, Real-World): adjacency list vs matrix memory calculation, BFS iterative vs recursive traversal order difference + visited timing, undirected vs directed cycle detection false positive, Union-Find path compression + rank amortized O(α(n)), Dijkstra lazy deletion stale-entry pattern, real-world algorithm selection (GPS/cycle/reachability).
- `25_Problem_Origins.md` — 5 binary-search/two-pointer/HashMap cross-domain contaminations replaced: BFS level tracking (size snapshot pattern), DFS call stack depth StackOverflow risk + iterative fix, BST search path trace + degeneration condition, open addressing vs chaining (Java HashMap treeify threshold), Two Sum HashMap vs sort+two-pointer constraint difference.
- `02_Code_Templates.md` — 1 sliding window duplicate fixed: variable window section replaced with while-loop shrink condition + LC 76 Minimum Window Substring logic.

Contamination families identified (new in Batch 2):

- `concat tight loop 10,000 times` — stamped 4× into Ch02 sections 2, 3, 5, 7.
- `Record vastly superior to class for DTOs` — stamped 6× into Ch03 sections 5, 7, 11, PART3, 13, 16.
- `java.util.Date replaced by java.time` — stamped 6× into Ch05 sections 5, 6, 8, 9, 10, 12.
- `NIO vastly superior to traditional IO` — stamped 6× into Ch13 sections 2, 3, 6, 8, 9, 10.
- `BFS finds shortest path in unweighted graphs` — stamped 6× into 10_Graphs sections.
- `binary search on [1,3,5,7,9] with target=6` — stamped 3× into 25_Problem_Origins (BFS, DFS, BST sections).

Verified-clean files (all challenges unique — not boilerplate):

- `12_Backtracking.md` (9 unique), `01g_DS_Internals.md` (9), `15_LinkedList.md` (7), `Ch65_OS_Fundamentals.md` (7), `03_Docker_Containers.md` (7), `03_DSA_Pattern_Recognition_Engine.md` (8), `21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md` (10), `01_TS_Foundations.md` (8), `Ch04_Generics_Exceptions.md` (6).

Reason:

- D005: Challenge blocks must match local domain. Systematic Phase 5 Batch 2 sweep.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`. (Completed — 503 files registered.)
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.

## 2026-05-26 (Previous Work)

Changed:

- Cleared the current Markdown code-fence structural warning list without changing topic ownership.
- Repaired malformed challenge/code blocks in onboarding and DSA files.
- Repaired missing or duplicated fence boundaries in selected Java, algorithm, and enterprise-system chapters.

Reason:

- Future agents use the generated registry and structural warnings as context-health signals. Balanced fences make file summaries, navigation, and later edits less error-prone.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.

## 2026-05-23

Changed:

- Reviewed latest Antigravity conversation context and continued from its context-system audit.
- Cleaned stale Antigravity replacements in `07_Modern_Java/Ch10_Reflection_Annotations.md` and `07_Modern_Java/Ch23_Streams_Deep_Reasoning.md`.
- Removed duplicated old answer tails left after new challenge blocks.
- Replaced repeated stream bug-hunt prompts with section-specific challenges for stream state, parallel mutation, pipeline fusion, and production side effects.
- Updated context commands to use `powershell -NoProfile` so user profile execution-policy errors do not poison future agent runs.
- Added reflection and stream duplicate-prompt families to contamination guards.

Reason:

- The latest Antigravity run found the new context system but also exposed stale manifest state and PowerShell profile noise. Continuing that work required cleaning the affected Java files before refreshing the context manifest.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.

## 2026-05-22

Changed:

- Added repository-level agent context system.
- Added `AGENTS.md` as the mandatory operating manual.
- Added `00_CONTEXT` human context files: repo map, decisions, update protocol, contamination guards, schema, and generated registry/manifest workflow.
- Added folder-level `CONTEXT.md` files for active modules.
- Added `tools/update_context.ps1` to generate `FILE_REGISTRY.md` and `CONTEXT_MANIFEST.json`, and to check freshness.

Reason:

- Future agents need stable model-agnostic context about what each file is, where it belongs, how content is written, and when context must be updated.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.


