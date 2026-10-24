# 📝 Data Structures — Problem Sets

## `02_Data_Structures` Module | MIT 6.006 Style

## 5W1H — Why This Chapter?

> **WHAT:** MIT 6.006-style exam-quality problem sets covering every core data structure (array, linked list, stack/queue, hash table, tree, heap), with constraint-first framing, invariant reasoning, edge-case enumeration, and Erklärung (common-mistake) blocks. Each problem is a pen-and-paper proof OR a hand-coded implementation with JUnit verification.
>
> **WHY:** Data structures are not learned by reading — they are learned by *solving problems that test the boundary cases*. A student who can recite "ArrayList is amortized O(1) append" but cannot prove the amortized bound from a geometric series has not yet understood the data structure. Problem sets at MIT 6.006 / ETH / KTH level force this understanding by requiring proofs, edge-case enumeration, and trade-off analysis.
>
> **WHO:** Engineers preparing for university exams (CS algorithms, data structures, competitive programming), Staff/Principal interviews (Bar Raiser, system design coding), and research roles (algorithmic reasoning, paper reading).
>
> **WHEN:** After reading the chapter (`01a` through `01f` for foundations; `02a`/`02b` for variants). Before moving to `03_Algorithms`. Revisit weekly for 3-6 months to consolidate.
>
> **WHERE:** Use as the central assessment loop for the folder. Each problem has an `Erklärung` block — if your answer does not match the Erklärung reasoning, you have a gap. Close the gap by re-reading the relevant chapter.
>
> **HOW:** Three passes per problem:
> 1. **Read constraints** — extract the (n, time, memory) triple.
> 2. **Solve on paper** — pseudocode + complexity + edge cases.
> 3. **Implement + verify** — Java skeleton at the bottom of each set; run JUnit; green = pass. Red = read Erklärung.

> **How to use this file:**
>
> 1. Attempt each problem before reading the answer.
> 2. Implement Part B code in Java (skeleton at the bottom of each set).
> 3. Run the provided JUnit test stub — green = pass.
> 4. If you fail: read the 🔴 **Erklärung** block — it tells you _exactly_ why.

---

## 💬 Explain It Like a Study Partner — Solving DS Problem Sets

> [!TIP]
> **Ask yourself first:** *"I read the solution and it made sense. Why can't I solve a new problem on my own?"*

### 1. The bottom line

Solve problems by reading the **constraints first**, picking the structure they point to, and checking your idea against the cost you are allowed.

### 2. The textbook core

- Constraint-first method: `n` (size) → allowed time (n ≤ 10⁵ → about O(n log n); n ≤ 10³ → O(n²) is fine), values, ordering, memory, and whether the data changes.
- Map signals to structures: lookups → hash map; order/range → tree or sorted array; "next greater" → monotonic stack; level-by-level → queue; top-k → heap.
- Work in this loop: **brute force → bottleneck → structure that removes it → code → test edge cases (empty, one element, duplicates, extremes)**.
- State the invariant of your loop or structure before coding.

### 3. The real-world analogy

A **doctor's diagnosis**: they do not try every treatment; they read the symptoms (constraints), form a hypothesis (structure), check it against test results (complexity), and only then prescribe (code).

### 4. Walkthrough: "find two numbers that add up to a target" with n = 10⁵

1. **Constraint:** n = 10⁵ rules out O(n²) pair checking (about 10¹⁰ steps).
2. **Brute force:** check every pair → O(n²), the bottleneck is "searching for the partner".
3. **Structure:** a hash map gives O(1) partner lookup.
4. **Code idea:** for each `x`, check whether `target - x` is in the map, then store `x`.
5. **Edge cases:** duplicates (`[3, 3]` with target 6), negative numbers, no answer.
6. Result: O(n) time, O(n) space.

> [!NOTE]
> **Quick check:** what if memory were tiny? *Sort and use two pointers: O(n log n) time, O(1) extra space.*

---

## Historical Evolution of Algorithm Problem Sets in CS Education

Algorithm problem sets did not appear fully formed — they evolved through distinct eras, each solving a specific pedagogical or practical need. Understanding this lineage clarifies why MIT 6.006 problem sets look the way they do and how they differ from competitive-programming judges or interview-prep platforms.

### Timeline

| Era              | Milestone                                                                | Significance                                                                                                           |
| ---------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **1960s**        | Knuth, _The Art of Computer Programming_ (Vol 1, 1968)                   | First systematic algorithm exercises; TAOCP sets introduced rigorous proof-based problem design                        |
| **1970s**        | Abelson & Sussman, _SICP_ (published 1985, taught 1980s)                 | First lecture-integrated problem sets; MIT 6.001 style with S-expressions, recursion, and environment models           |
| **1975**         | Aho, Hopcroft & Ullman, _The Design and Analysis of Computer Algorithms_ | Academic rigor in problem selection; introduced the "prove your algorithm" standard now used in university courses     |
| **1980s**        | ACM ICPC (International Collegiate Programming Contest)                  | Competitive problem sets with strict time/memory limits; standardized what "hard" means in algorithmic problem design  |
| **1986**         | Skiena, _The Algorithm Design Manual_                                    | Practitioner-oriented problems: real-world case studies, algorithm visualization, and a "catalog of problems" approach |
| **1995**         | UVa Online Judge                                                         | First web-based judge; introduced auto-judged problem sets to the public                                               |
| **2001**         | TopCoder                                                                 | Modern competitive programming platform; algorithm taxonomies (SRM) and difficulty ratings                             |
| **2008**         | LeetCode founded                                                         | Interview-focused problem sets; "Blind 75" and pattern-based curricula emerged from this era                           |
| **2009**         | HackerRank, Codility                                                     | Assessment-driven problem sets; auto-scored with test-case suites for hiring                                           |
| **2010**         | Codeforces                                                               | Real-time contest platforms; problem quality and editorial standards raised significantly                              |
| **2015–onwards** | "Grokking the Coding Interview" (Educative)                              | Pattern-based curricula; taught problem-solvers to classify problems before solving                                    |
| **2022**         | AlphaCode (DeepMind), GPT-4 problem generation                           | AI-generated algorithm problems; raises questions about problem novelty and solution verification                      |

### Why MIT 6.006 Problem Sets Exist

MIT 6.006 (Introduction to Algorithms) was designed to bridge a specific gap: lectures teach algorithmic _theory_ (proofs, complexity, data structures), but students need to translate theory into _working code under exam conditions_. The problem set format achieves this by:

1. **Part A (Theory):** Verifies you can reason about an algorithm without running it — the exam skill.
2. **Part B (Implementation):** Verifies you can translate reasoning into clean Java — the engineer skill.
3. **Part C (Challenge):** Pushes past rote application into proof and design — the researcher skill.

This tri-part structure (theory → implementation → proof/design) is why MIT 6.006 problem sets are harder to fake than competitive-programming judges: they test understanding, not just pattern-matching.

### Why Competitive Programming Emerged

ICPC emerged because universities needed a **standardized comparison** of student ability across institutions. The competitive programming format solved problems of fairness (uniform test conditions) and scalability (automated judging). UVa, TopCoder, and Codeforces built on this with online access, but retained the core ICPC assumption: problems are self-contained, have a single correct answer, and are solved in isolation.

### Why LeetCode Emerged

Post-2008 tech interview inflation (Google, Facebook, Amazon all adopted algorithm interviews simultaneously) created demand for interview-specific problem sets. LeetCode problems are not designed for academic rigor — they are designed to mirror the specific question types that appear in coding interviews (two-sum variants, tree path sums, sliding-window subarray problems). The "Blind 75" emerged as a community-curated set of high-signal interview problems.

### Key Distinction: Academic vs. Competitive vs. Interview Problem Sets

| Dimension                   | MIT 6.006 Style              | Competitive (ICPC/Codeforces) | Interview (LeetCode)            |
| --------------------------- | ---------------------------- | ----------------------------- | ------------------------------- |
| **Primary goal**            | Prove understanding          | Win contests                  | Pass interviews                 |
| **Answer format**           | Proof + code                 | Code only                     | Code only                       |
| **Erklärung / editorial**   | Explicit mistake taxonomy    | Sparse                        | Moderate                        |
| **Problem independence**    | Problems build on each other | Problems are isolated         | Patterns repeat across problems |
| **Time pressure**           | Exam conditions (50 min)     | Contest (2 hr)                | None                            |
| **Pattern-matching reward** | Low                          | High                          | High                            |

MIT 6.006 problem sets sit at the intersection: they test competitive-level algorithmic thinking but require the proof rigor of academic exercises.

---


## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Problem-Solving Mental Models](02_PROBLEM_SETS/01_solving_mental_models.md) | Problem-Solving Mental Models · Problem Set DS-PS1 — Arrays & Complexity · Problem Set DS-PS2 — Hash Tables · Problem Set DS-PS3 — Linked Lists · Problem Set DS-PS4 — Stacks & Queues · … | 681 |
| 2 | [University-Level Exam Problem Bank](02_PROBLEM_SETS/02_university_level_exam_problem_bank.md) | University-Level Exam Problem Bank | 446 |
