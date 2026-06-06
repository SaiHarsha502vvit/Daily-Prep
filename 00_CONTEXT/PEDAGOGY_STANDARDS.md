# Technical Pedagogy Standards

Purpose: make every guide teach durable reasoning, not only answers or templates.

Use this file when adding, repairing, or reviewing learning content.

## Core Teaching Shape

Every substantial technical section should answer:

1. What problem does this concept solve?
2. What is the naive or brute-force approach?
3. What repeated work or failure mode appears?
4. Which data structure, algorithm, language feature, or system pattern removes that pain?
5. What invariant makes the optimized approach correct?
6. What constraints break the approach?
7. What edge cases expose bugs?

Short sections can be lighter, but they should still preserve the local topic and the key invariant.

## Challenge Block Standard

Section challenges must be local to the section being taught.

Good challenge prompts ask the reader to trace, diagnose, compare, or rewrite:

```text
Who/what causes the behavior?
When does the bug or tradeoff appear?
What constraint changes the solution?
How would you rewrite the brute force version?
Why does the optimized invariant hold?
```

Avoid generic recycled prompts unless the section is explicitly reviewing that exact concept.

## Replacement Standard

When replacing contaminated or duplicated challenge content:

1. Preserve the section and surrounding learning content.
2. Replace only the wrong-domain or duplicated challenge block.
3. Make the new challenge match the local topic.
4. Include a concise `<details><summary>Answer</summary>` answer.
5. Prefer concrete failure modes over vague theory.
6. Log repeated contamination families in `00_CONTEXT/CONTAMINATION_GUARDS.md`.

## Constraint-First DSA Standard

DSA and algorithm content must teach selection logic:

```text
constraints -> brute force -> bottleneck -> data structure/algorithm -> invariant -> edge cases
```

Examples:

- Negative numbers break many sum-based sliding-window proofs; switch to prefix sum + hashmap/tree/deque.
- Online updates break static prefix sums; switch to Fenwick tree or segment tree.
- Weighted edges break BFS shortest-path logic; switch to Dijkstra, 0-1 BFS, or Bellman-Ford depending on weights.
- Deep recursion in Java can stack overflow; rewrite with an explicit stack or iterative pointer/state transitions.

## Open-Source Reference Standard

Open-source repositories may be used as anchors.

Use the following format (D009 + D012):

```markdown
📎 **Reference Anchor:** [Library/Class name](STABLE_PERMALINK_URL)  
**Invariant learned:** What specific design decision or invariant this code demonstrates.  
**Local rewrite:** How to apply this in Java/interview context (see challenge above).  
**Constraint warning:** When this source's language, API, or production model does NOT match the problem.
```

Strong anchor sources:

- **[AtCoder Library (ACL)](https://github.com/atcoder/ac-library)** — Fenwick trees, segment trees, lazy segment trees. Best for contest DSA.
- **[KACTL](https://github.com/kth-competitive-programming/kactl)** — Compact, contest-tested templates. Best for algorithmic invariant checking.
- **[cp-algorithms.com](https://cp-algorithms.com)** — Proof-oriented explanations for graphs, DP, number theory.
- **[OpenJDK](https://github.com/openjdk/jdk)** — Java collection internals, JVM behavior, production API tradeoffs.
- **[Linux kernel](https://github.com/torvalds/linux)** — Low-level systems invariants (scheduler, memory, I/O).
- **[PostgreSQL source](https://github.com/postgres/postgres)** — SQL executor, planner, WAL, MVCC internals.
- **[Spring Framework](https://github.com/spring-projects/spring-framework)** — Spring DI, AOP, transaction management internals.
- **[jjwt](https://github.com/jwtk/jjwt)** — JWT parsing and verification in Java.
- **[Caffeine](https://github.com/ben-manes/caffeine)** — Production Java LRU/TinyLFU cache internals.

Do not paste large source files. Link the exact class/function and explain the design choice.

## Domain Boundary Standard

Keep examples in their canonical home:

- SQL examples belong in SQL files unless a Java/Spring section is teaching persistence integration.
- Java/Spring examples belong in Java/Spring files unless an algorithm chapter is teaching Java implementation cost.
- Frontend examples belong in frontend files unless a system design section is explicitly bridging client/server behavior.
- DSA pattern examples belong in DSA, algorithm, pattern, problem-solving, or mental-model files.

If a section compares domains, say so explicitly.

## Parallel Agent Coordination

When another agent is active (Codex, another Antigravity session, or any external agent):

1. **Before editing any file:** Run `tools/update_context.ps1 -Mode check`. Files in the stale report were recently changed — inspect them, do not overwrite blindly.
2. **Claim file batches, not individual files:** Edit a group of related files, run context update, then move to the next batch. This minimizes stale window overlap.
3. **The repo is the shared communication channel:** Do not use chat transcripts to coordinate file ownership. The manifest timestamp is the ground truth.
4. **Before final verification:** Run both update and check so both agents share the current repo truth.
5. **If check becomes stale again** after your update because the other agent edited concurrently: report the active file conflict instead of overwriting.
6. **Codex-specific note:** Codex may edit files faster than manifest updates propagate. Always re-run the check immediately before touching a critical context file (`DECISIONS.md`, `CONTAMINATION_GUARDS.md`, `PEDAGOGY_STANDARDS.md`, `REPO_MAP.md`).

## Repo Cleanliness Standard

The repo is a learning resource, not a draft notepad. Keep it clean:

- **No double `<details>` per challenge:** Each Section Challenge block has exactly one `<details><summary>Answer</summary>` block. Duplicated answers from old boilerplate should be removed during sanitization.
- **No orphaned answer blocks:** If a new Challenge 1 is inserted and the old boilerplate answer remains below, delete the old answer to prevent two `<details>` blocks for one question.
- **No double section headers:** If two consecutive `🔬 **Section Challenge**` blocks appear with no content between them, merge or separate them with meaningful content.
- **No cross-domain challenge contamination:** Before writing a challenge, read the section header to confirm the topic. If the section is about JWT but the challenge asks about SQL, it is wrong-domain contamination.
- **Consistent challenge title format:** `**Challenge 1 (Topic Name):**` — include a specific topic in parentheses, not just `(Reasoning)` as a generic placeholder.

## Final Quality Checklist

Before finishing content work:

```text
[ ] Local challenge matches local section.
[ ] Brute force or naive reasoning is present where useful.
[ ] Optimized method names the invariant.
[ ] Constraints and breaking cases are explicit.
[ ] Edge cases are concrete.
[ ] Open-source links use stable permalinks (D012) and are explained, not copied.
[ ] No orphaned old answer blocks remain after challenge replacement.
[ ] Context journal/guards/decisions updated when standards changed.
[ ] Registry and manifest regenerated after meaningful edits.
[ ] Parallel agent stale check passed before final commit.
```
