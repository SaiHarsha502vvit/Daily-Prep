# Group A Audit: Git + Linux + Docker + CI/CD

## Overall Verdict

This group is **strong but structurally inconsistent** — Git and Docker are near-publication quality (avg 2.8 and 3.0), while Linux (2.4) and especially CI/CD (2.2) have measurable gaps. The CI/CD file is missing the WHO origin section and a dedicated WHEN decision guide entirely, which are mandatory per the curriculum's own 5W1H framework. Docker's historical evolution lives in the wrong position (after WHEN instead of inside WHO). Linux has no WHEN section header despite a WHEN-style decision block. These are not polish issues — they are structural scaffold violations that make the curriculum feel uneven. Contamination is clean across all four files; no cross-domain challenges detected.

---

## File-by-file findings

### 01_Git_Version_Control.md

- **Depth score:** 3/3
- **Breadth score:** 3/3
- **Production score:** 3/3
- **History score:** 2/3
- **Craft score:** 3/3
- **Average:** 2.8

**Strengths:**

- The three production disaster stories at the top (Section 0) are the best opening gambit in the group — specific, non-obvious, and immediately establish production stakes. Force-push-with-lease, secret-in-history, and shared-branch rebase scenarios are all real incident patterns.
- Mental model teaching is excellent: the snapshot-vs-delta distinction (WHAT: Mental Model 1) is explained with the invariant that identical content deduplicates to the same blob. The linked-list commit model (Mental Model 3) with the hash-parent-pointer cascading integrity argument is exactly the kind of first-principles reasoning the rubric rewards.
- `git add` + `git commit` internals section (HOW Internals) is the standout technical segment in the group — it traces the exact object creation sequence with SHA-1 computation at each step. Lines ~460–490 are production-quality internals teaching.
- Challenge blocks are uniformly local and well-constructed. The SHA-1 challenge (why Git's history is still trustworthy despite 2017 collision) is a brilliant reasoning puzzle that distinguishes integrity protection from adversarial security. The reflog career-saving insight (90-day GC window) is a production reality gem buried in HOW Internals.
- The `git push --force-with-lease` recommendation is correct and the lease-vs-force distinction is well-explained.
- Branch creation is correctly explained as "one 41-byte file" creation — this is precise and memorable.
- Production Reality section at the end (lines ~770–790) is a clean synthesis: four named failure modes (force-push, reflog ignorance, secret exposure, merge vs rebase collision) each with recovery steps and mitigation discipline.

**Weaknesses:**

- **History score 2/3**: The historical section (WHO: The Origin Story) is solid on the 2005 BitKeeper origin and Linus quote, but there is no mention of what existed before distributed VCS (CVS, SVN) and why they failed at scale. The 2005–2008 period (when Git matured to handle the Linux kernel) is absent. The SHA-1 2017 collision is mentioned but only inside a challenge answer, not in the main historical narrative.
- Section 0 (Git Disasters) is a brilliant innovation but sits outside the 5W1H structure — it's an unframed intro block. Consider whether it could be absorbed into the WHY section to give it a formal home, or explicitly label it as a "Production Scenarios" prequel.
- No explicit side-by-side comparison *table* for Git Flow vs GitHub Flow — there are diagrams but the selection criteria table that would live in WHEN is implicit rather than explicit.
- The cheat sheet at the end lacks the Production Reality callouts that Linux and Docker include — no indication of which commands are dangerous in production.

**Contamination flags:** None. All challenges are Git-local. No DSA patterns, no SQL, no Java Streams, no React.

**Top 3 specific improvements:**

1. **Add pre-Git VCS context in WHO** — name CVS (1986) and SVN (2000) as predecessors and explain why distributed VCS solved what centralized couldn't (offline commits, no single point of failure). This is the missing link between "2004 shared folder" and "Git was built."
2. **Move Section 0 into the WHY structure** — the three disaster stories are too good to live in an unlabeled prequel. Make them the "Problem Statement" sub-section under WHY, then the 2004 shared-folder scenario becomes context, not the hook.
3. **Add a selection criteria table in WHEN** — the WHEN section has good guidance but no structured comparison. A table contrasting merge vs rebase vs reset vs revert across axes (rewrites history, safe on shared branches, generates new commit, recoverable via reflog) would make selection explicit rather than requiring readers to infer from prose.

---

### 02_Linux_CLI_Shell.md

- **Depth score:** 2/3
- **Breadth score:** 2/3
- **Production score:** 3/3
- **History score:** 2/3
- **Craft score:** 2/3
- **Average:** 2.2

**Strengths:**

- Production Reality section is the strongest in the group — the fd-leak pattern (JVM not closing FileInputStream → "Too many open files" → silent failure) is a genuinely elite production insight. The `truncate -s 0` trick for clearing logs without killing the open file handle is a specific, correct, and rarely-taught recovery pattern. The "process is alive but disk is full so it can't write logs" incident pattern is also exactly the kind of non-obvious failure mode that separates junior from senior debugging.
- The `grep --line-buffered` one-liner explanation (why grep buffers in pipes and how `--line-buffered` fixes it) is a precise production gotcha. The `tail -f` pipeline in the senior challenge is runnable and practical.
- The `/proc/<PID>/` virtual filesystem explanation is excellent — the fd leak diagnosis via `/proc/1234/fd/` and the memory map inspection via `/proc/1234/maps` are exactly the right "diagnose without tools" insights.
- Shell variant comparison table (Bash/Zsh/Fish/PowerShell) with year introduced, default status, best-for, and plugin ecosystem is a genuinely useful selection tool.
- The `--line-buffered` fix is explained with the correct technical mechanism (8KB buffer, not a terminal).

**Weaknesses:**

- **No dedicated WHEN section header** — the file has a WHEN-style decision block (the question-answer table at lines ~320–325) but no `## WHEN:` section header. Per the curriculum's own 00_INDEX.md, every chapter MUST follow WHY/WHAT/WHERE/WHEN/WHO/HOW. This is a structural violation. The content exists; it just lacks the header.
- **Conceptual Depth 2/3**: The "everything in Linux is a file" insight is stated (a good invariant) but never named as such. The word "invariant" does not appear anywhere in the file. The mechanism explanation for shell-to-kernel syscall translation is good but doesn't state which kernel subsystem handles it (system call interface, not "kernel calls" generically).
- **Pedagogical Craft 2/3**: The challenge blocks exist but some have generic titles: `**Challenge 1 (Reasoning):**` and `**Challenge 2 (Senior/Debug):**` — the `(Senior/Debug)` tag is inconsistent with the `(Reasoning)` format used elsewhere in the group. Also, the "Debugging a Production Issue" section has `**Challenge 1 (Scenario):**` and `**Challenge 2 (Senior/Debug):**` — two different naming conventions in one file.
- No side-by-side comparison table in WHAT — the file uses comparison tables in shell variants but not in the core file permissions or process management sections, where a permissions numeric system table (rwx → 421) could be extended to show real scenarios.
- The backup script exercise (Exercise 3) has no challenge block associated with it — it ends with the script prompt and then jumps straight to the Production Reality section header. The other exercises (Exercise 1 and 2) each have a challenge; Exercise 3 should too.
- The "WHEN: Decision Guide" table (lines ~320–325) is very sparse — 4 rows and only one column. It doesn't address "when to use `kill -3` vs `kill -9`" or "when to use `top` vs `htop` vs `ps aux`" which are actual daily developer decisions on Linux.
- No historical timeline table — the 1991 origin, UNIX 1969, and GNU 1983 are mentioned in prose but not structured as a timeline. Historical Evolution is scored 2/3 because the timeline is present but not formally presented.

**Contamination flags:** None. All challenges are Linux-local.

**Top 3 specific improvements:**

1. **Add `## WHEN:` section header** — the existing decision guide content (lines ~320–325) should be wrapped in a `## WHEN: Decision Guide` header. Extend it with 2 additional rows: "when to `kill -3` vs `kill -9`" and "when to use `top` vs `htop` vs `ps`."
2. **Name the invariant explicitly** — add a line: `**Invariant**: Everything exposed by the kernel is a file descriptor. Every I/O operation (disk, network, process, device) maps to a numeric fd that can be read, written, or polled.` This makes the mental model evaluable for the Conceptual Depth rubric.
3. **Standardize challenge titles** — replace `**Challenge 2 (Senior/Debug):**` with `**Challenge 2 (Production Debug):**` to maintain consistency with the `(Reasoning)` / `(Trace)` / `(Comparison)` / `(Scenario)` / `(Design)` tags used elsewhere. Add a challenge block to Exercise 3.

---

### 03_Docker_Containers.md

- **Depth score:** 3/3
- **Breadth score:** 3/3
- **Production score:** 3/3
- **History score:** 3/3
- **Craft score:** 3/3
- **Average:** 3.0

**Strengths:**

- This is the strongest file in the group. The WHY section's "works on MY machine" framing is the right pedagogical entry point. The container-vs-VM analogy ("separate houses vs shared building") is memorable and accurate.
- The Copy-on-Write mechanism is explained precisely: shared read-only layers + one writable layer per container, not 10 copies of a 500MB image. This is the kind of mechanism explanation the rubric rewards.
- Security depth is exemplary: CVE-2019-5736 (privileged container escape), gVisor vs Kata vs standard containers trade-off, Docker group privilege escalation risk, and the JDK-vs-JRE attack surface (jmap heap dump, jdb code modification) are all correct and non-obvious.
- The "layer cache optimization" insight (`COPY pom.xml` before `COPY src/` to preserve Maven dependency cache) is the single most impactful Docker performance teaching point, and it is explained correctly with the "invalidates all subsequent layers" cascade rule.
- Container runtime comparison table (Docker/Podman/containerd/CRI-O) with architecture, root requirements, Kubernetes fit, year introduced, and best-for is a model of what a selection table should look like.
- The historical evolution section (2002 namespaces → 2007 cgroups → 2008 LXC → 2013 Docker → 2015 OCI → 2015 Kubernetes) is the most complete timeline in the group.
- The Open Source Reference block for BuildKit (moby/buildkit) correctly explains the invariant (layer invalidation cascades downward) and gives a local rewrite (BuildKit `RUN --mount=type=cache` bypasses layer caching for dependency caches). The constraint warning is also correct.
- Exercise 2 challenge (JDK vs JRE security surface area) is excellent — it connects image size to attack surface in a way that is non-obvious and actionable.
- Production Reality has the "OOM-killed container loses logs" pattern with the correct fix (ship logs to remote store before container terminates).

**Weaknesses:**

- **WHO section is not a named header** — the origin story ("2013: Solomon Hykes at dotCloud") is embedded in the narrative paragraph rather than under a `## WHO: Origin` header. The historical evolution section that follows covers WHO content but doesn't have the section marker. This creates an inconsistency with 01_Git and the curriculum index.
- The `Historical Evolution` section appears after WHERE and WHEN (lines ~350–400), which is the wrong position. In Git's file, the historical content lives inside the WHO section. In this file, it is detached and placed after the WHEN decision guide. The content is correct; the placement is inconsistent with the curriculum's own stated structure.
- The `🔬 **Section Challenge — Exercise 3: Compose Full Stack**` block appears at the very bottom of the file, after the Production Reality section, with no surrounding content. The preceding Exercise 3 text block (`"Create docker-compose.yml..."`) is present, but the challenge block ends up visually orphaned at the bottom of the entire document — it lacks the Exercise 3 text context immediately above it (the file jumps from Production Reality directly to the Exercise 3 challenge). This is a structural nesting issue.
- The Open Source Reference uses a note-style format rather than the required `📎 Reference Anchor` format from the PEDAGOGY_STANDARDS.md (D012 standard). The correct format is: `📎 **Reference Anchor:** [Library/Class name](STABLE_PERMALINK_URL)` followed by invariant, local rewrite, and constraint warning. The current block uses `> [!NOTE]` which does not follow the canonical format.

**Contamination flags:** None. The Spring Boot/Java multi-stage Dockerfile example is canonical for this domain — developer tooling chapters appropriately use Java applications as examples.

**Top 3 specific improvements:**

1. **Add `## WHO: Origin Story` section header** — the existing paragraph ("2013: Solomon Hykes at dotCloud...") should be moved to a `## WHO: Origin Story` section, and the Historical Evolution content should be moved into or cross-referenced from it. The current placement of Historical Evolution (after WHEN) is inconsistent with the Git file's structure where historical context lives in WHO.
2. **Fix Open Source Reference format** — replace the `> [!NOTE]` block with the canonical `📎 **Reference Anchor:** [moby/buildkit](https://github.com/moby/buildkit) → **Invariant:** Layer invalidation cascades downward. **Local rewrite:** ... **Constraint warning:** ...` format per D012.
3. **Move Exercise 3 challenge block** — the Exercise 3 challenge should appear directly after the Exercise 3 text block (before Production Reality), not at the document's very bottom. Move it to be immediately after the `"## Exercise 3: Compose Full Stack"` text block to maintain visual grouping.

---

### 04_CICD_Pipelines.md

- **Depth score:** 2/3
- **Breadth score:** 2/3
- **Production score:** 3/3
- **History score:** 2/3
- **Craft score:** 2/3
- **Average:** 2.2

**Strengths:**

- Production Reality section is excellent — four named failure modes with concrete recovery steps. The pipeline race condition on artifact promotion (two builds overwriting staging before smoke tests run) is non-obvious. The missing smoke test pattern (deploy succeeds but app returns 503s) is a real incident pattern. The "flaky tests blocking 30% of merges" and the quarantine protocol (>5% flake rate) is the kind of operational maturity teaching that distinguishes university-level content.
- The "CI theater vs CI pipeline" distinction ("if your automated pipeline has 3+ manual steps that vary by environment, you have CI theater") is an excellent invariant formulation.
- Pipeline Invariant section (lines ~440–470) has the right conceptual content but the word "invariant" is not explicitly used in the section header or introduction. This is scored as partial for the "invariant stated explicitly" sub-check.
- Historical Evolution section is strong — 2009 DevOpsDays, 2010 Continuous Delivery book, 2011 Jenkins/Hudson fork, 2014 GitLab CI, 2018 GitHub Actions. The 12-Factor App reference (Adam Wiggins, Heroku, 2011) is appropriate and well-contextualized.
- Matrix strategy explanation (test 3 Java versions × 2 OS = 6 parallel jobs) is a good concrete example of how matrix builds work.

**Weaknesses:**

- **Missing WHO section entirely** — the curriculum requires every chapter to have a WHO section. 04_CICD has no origin story for CI/CD (who coined "DevOps," who wrote the Continuous Delivery book, who built the first CI server). The Historical Evolution section has this content but is not labeled as WHO. This is a structural violation of the curriculum's own scaffolding.
- **Missing WHEN section entirely** — there is no `## WHEN:` section header. The WHEN content (CI vs CD vs CD distinction) is embedded in WHAT. The decision tree diagram (CI Gate → Staging → CD Gate) is WHEN material but lives under a WHAT subsection. A proper WHEN: Decision Guide section is absent.
- **Conceptual Depth 2/3**: The pipeline invariant concept is present ("Every commit should pass through the same automated gate") but the section is titled "Conceptual Depth: The Pipeline Invariant" without using `## WHEN:` structure. The constraint-driven selection logic (when does the invariant break) is implicit rather than explicit.
- **Breadth 2/3**: The tools comparison table (GitHub Actions/Jenkins/GitLab CI/CircleCI) is good but the WHERE section is a single bullet list with no prose explanation of when to pick which. The CI/CD tool selection criteria are in the table but not explained in prose.
- The `🔬 **Section Challenge — Full Pipeline: Build → Test → Docker → Deploy**` challenge block about Docker layers is awkwardly placed — it sits between the YAML example and the "Pipeline Visualization" diagram, acting as an interlude rather than belonging to a section. This is not inherently wrong, but the challenge topic (Docker layer invalidation) would fit better in the Docker chapter, not the CI/CD chapter. Checking: the challenge asks "if you modify a file in layer 3, what happens to layers 4 and 5?" This is a Docker concept being tested in the CI/CD chapter. It's borderline contamination — the CI/CD file shouldn't be testing Docker layer knowledge. The answer itself is correct, but the challenge feels like it was copy-pasted from the Docker chapter.
- No dedicated side-by-side comparison table for GitHub Actions vs Jenkins vs GitLab beyond the tools table. The CI/CD decision tree diagram covers WHEN material but is not framed as a WHEN section.

**Contamination flags:** Minor — the Docker layer invalidation challenge in the CI/CD chapter tests Docker knowledge (Docker layer invalidation cascade) inside a CI/CD file. The challenge itself is correct, but testing Docker internals inside the CI/CD chapter blurs domain boundaries. Consider replacing with a CI/CD-local challenge (e.g., "if two builds run concurrently, what determines which one marks staging as ready?").

**Top 3 specific improvements:**

1. **Add `## WHO: Origin Story` section** — create a dedicated section covering: Patrick Debois and the 2009 DevOpsDays coinage, Jez Humble & David Farley (Continuous Delivery book 2010), the Hudson/Jenkins fork (2011), Travis CI and CircleCI (2011), GitHub Actions (2018/2019). Move Historical Evolution content here or cross-reference it. This is mandatory per the 5W1H curriculum scaffold.
2. **Add `## WHEN: Decision Guide` section** — the CI/CD decision tree diagram should be moved into a `## WHEN: Decision Guide` section with prose guidance: when to use CI (every push) vs when to add scheduled runs, when to use path filtering, when to require manual approval, when to use canary vs blue-green. The current structure puts WHEN content inside WHAT.
3. **Replace Docker layer challenge with CI/CD-local challenge** — the "Docker layer invalidation" challenge tests Docker knowledge in a CI/CD context. Replace with: "If your CI pipeline's `needs: docker` dependency fails after the `test` job passes, what happens to the test job's artifacts? Can they be recovered?" This tests CI/CD dependency graph knowledge rather than Docker internals.

---

## Cross-file flow observations

**What works:**

The progression from Git → Linux → Docker → CI/CD is logically sound — it maps to a developer's growing operational scope: version your code (Git), operate on servers (Linux), package for any environment (Docker), automate delivery (CI/CD). Each file builds on the previous: Docker's layer caching explanation references Git's snapshot model (`git gc`), Linux's shell scripting uses Docker as a deployment target, CI/CD's Docker build step uses Docker. The cross-references (`[Next: Docker >]`, `[< Linux CLI]`) make navigation seamless.

**What doesn't work:**

1. **Structural inconsistency undermines the curriculum contract.** The 00_INDEX.md explicitly states: "Each Chapter Follows This Structure: WHY → WHAT → WHERE → WHEN → WHO → HOW." Yet:
   - `02_Linux_CLI_Shell.md` — no `## WHEN:` header (content exists but unlabeled)
   - `03_Docker_Containers.md` — no `## WHO:` header (origin embedded in narrative)
   - `04_CICD_Pipelines.md` — no `## WHEN:` header, no `## WHO:` header at all

   This is not a minor issue. Students using 00_INDEX.md as a navigation map will look for these sections and find either nothing (CI/CD) or content under the wrong header (Docker: historical content is there but labeled as "Historical Evolution" rather than "WHO").

2. **Historical Evolution is positioned inconsistently.** In 01_Git, historical context lives inside the WHO section. In 03_Docker, it appears after WHERE and WHEN as a standalone unnumbered block. In 04_CICD, it appears near the bottom after WHERE. A curriculum reader encountering Historical Evolution in Docker might not connect it to the WHO dimension the curriculum defines.

3. **Section challenge blocks create structural noise.** Several challenge blocks appear between major section headers with no intermediate content, creating the appearance of orphaned blocks:
   - `01_Git`: Three challenge blocks between WHEN and the HOW Internals header
   - `03_Docker`: Exercise 3 challenge block at the very bottom, visually disconnected from Exercise 3 text
   - `04_CICD`: Challenge block between the full pipeline YAML and the Pipeline Visualization diagram

   These are not pedagogically wrong (the challenges are appropriate), but they create a fragmented reading experience. Consider grouping challenges after the content they test, not between unrelated sections.

4. **Duplication of "Production Reality" position.** All four files end with a Production Reality section — this is good consistency. However, Docker's Production Reality includes a note (`> [!NOTE]`) about BuildKit cache mounts that breaks the established pattern of Open Source Reference blocks (Git has the reference anchor format in HOW Internals; Docker uses a note).

5. **Git's Section 0 is the best structural innovation but breaks the 5W1H pattern.** Opening with three production disaster stories is inspired pedagogy — it answers "why should I care?" before "what is it?" However, Section 0 has no 5W1H label. It could be labeled as an extended WHY/prologue. This is worth resolving: either integrate it into the WHY section or label it as `## WHY (Extended): Git Disasters That Actually Happen`.

---

## Recommended action plan

**Priority 1 (Structural scaffolding — fix before any content changes):**

1. **04_CICD: Add `## WHO:` section** — extract the historical evolution content into a properly labeled `## WHO: Origin Story` section. Reference the DevOpsDays 2009, Jenkins fork 2011, GitHub Actions 2018. This is the only file in the group missing a WHO section entirely.
2. **04_CICD: Add `## WHEN:` section** — create a `## WHEN: Decision Guide` section with prose guidance on CI trigger selection (push vs schedule vs workflow_dispatch), path filtering, concurrency limits, and manual approval gate strategy. Move the CI/CD decision tree diagram here.
3. **02_Linux: Add `## WHEN:` section header** — wrap the existing decision guide content in a proper section header. Extend the table with 2 additional rows: "when to `kill -3` vs `kill -9`" and "when to `top` vs `htop` vs `ps`."

**Priority 2 (Domain integrity — contamination and boundary fixes):**

4. **04_CICD: Replace Docker layer challenge** — the Docker layer invalidation challenge in the CI/CD file tests Docker internals in a CI/CD chapter. Replace with a CI/CD-local challenge on dependency graph failure recovery.
5. **03_Docker: Fix Open Source Reference format** — replace `> [!NOTE]` block with the canonical `📎 **Reference Anchor:** [moby/buildkit](https://github.com/moby/buildkit)` format per D012 standard.

**Priority 3 (Pedagogical consistency — challenge and reference quality):**

6. **02_Linux: Add Exercise 3 challenge block** — Exercise 3 (backup script) currently has no associated challenge. Add one matching the pattern used for Exercises 1 and 2.
7. **02_Linux: Standardize challenge titles** — replace `**Challenge 2 (Senior/Debug):**` with `**Challenge 2 (Production Debug):**` for consistency. Add a brief prose bridge before the Exercise 2 challenge block.
8. **03_Docker: Add `## WHO:` section header** — label the existing origin content ("2013: Solomon Hykes at dotCloud") under a `## WHO: Origin Story` header. Move or cross-reference the Historical Evolution section into/from WHO.
9. **03_Docker: Reposition Exercise 3 challenge block** — move it to directly follow the Exercise 3 text, before Production Reality, to eliminate the visual orphan at the file's bottom.

**Priority 4 (Content quality — minor enhancements):**

10. **01_Git: Add predecessor VCS context** — add CVS (1986) and SVN (2000) as named predecessors in the WHO section, with 1–2 sentences explaining why distributed VCS solved what centralized couldn't.
11. **01_Git: Move Section 0 into WHY** — label it `## WHY (Extended): Git Disasters That Actually Happen` or integrate the three stories as a "Problem Statement" sub-section under the existing WHY header. This preserves the innovation without breaking the 5W1H scaffold.
12. **03_Docker: Move Historical Evolution into WHO** — the 2002–2015 timeline should live inside the WHO section, not as a standalone block after WHEN.
13. **04_CICD: Make pipeline invariant explicit** — change the section header from "### Conceptual Depth: The Pipeline Invariant" to include the word "invariant" in the body text introduction. Add one sentence: "The invariant of a production CI/CD pipeline is: Every commit that passes automated gates must reach production through an identical automated path."

**Estimated effort:** Priority 1 fixes are structural/section-header additions that take ~15 minutes each. Priority 2 contamination fixes are small substitutions. Priority 3 exercise/challenge additions are ~10 minutes each. Priority 4 content enhancements are the only substantive writing changes.