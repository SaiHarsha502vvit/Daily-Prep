# CSE804 — Career Mastery & Interview Readiness

## Semester 8 · Final Year (Capstone Semester)

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can map any algorithmic problem to its constraint-driven pattern within 60 seconds, lead a system design round driven by capacity estimation (not pattern matching), tell behavioral stories that demonstrate growth (not bragging), and negotiate offers using TC bands and BATNA mechanics.
> **Capstone:** Run a full mock-interview loop for the company you're targeting: phone screen → onsite coding (3) → system design → behavioral. Record each round. Self-evaluate against published rubrics. Iterate until you would hire yourself.

---

## Navigation

| Course                                                                                  | Description |
| --------------------------------------------------------------------------------------- | ----------- |
| **[CSE801 — Capstone Project](../CSE801_Capstone_Project/README.md)**                    | S08 sibling |
| **[CSE802 — HCI](../CSE802_Human_Computer_Interaction/README.md)**                      | S08 sibling |
| **[CSE803 — Ethics](../CSE803_Ethics_And_Professional_Practice/README.md)**             | S08 sibling |
| **CSE804 — Career Mastery & Interview Readiness**                                        | This course |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `09_Career_Reference/`                     | Resume, behavioral, career strategy                            |
| `20_Interview_Mastery/`                    | Primary source — every chapter cited below                     |
| `06_OOP_Design/03_System_Design.md`        | System design depth                                            |
| `12_Daily_Practice/`                       | Daily problem-solving drills                                   |

---

## Prerequisites

- All prior semesters S01-S07 — interview tests the synthesis of everything
- `09_Career_Reference/00_INDEX.md` — career framework baseline
- `20_Interview_Mastery/00_INDEX.md` — interview framework baseline

**Constraint:** You can't fake this course. The interview process tests what you've ACTUALLY learned, not what you've read. If you skipped derivations in S02-S03 and now want to "interview prep" them, this course will reveal that. Budget extra time accordingly.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Career Strategy + Resume (Weeks 1–3)

#### Week 1 — Target Setting

`09_Career_Reference/02_Career_Guide_Part1A.md` — company tiers, role tiers, scoping where you fit and where you stretch.

#### Week 2 — Resume + LinkedIn

`09_Career_Reference/01_Career_TechnoFunctional.md` — ATS optimization, quantifying impact, the "X by Y by Z" pattern (action + metric + method).

#### Week 3 — Portfolio + Open Source

`09_Career_Reference/04_Career_Projects_Part1.md` through `06_Career_Projects_Part3.md` — what to build, how to show your work.

---

### UNIT 2 — Coding Interviews (Weeks 4–8)

**Learning Outcomes:**

- Map constraints to pattern within 60 seconds
- Communicate while coding (clarify → approach → code → test)
- Recover from getting stuck without freezing

#### Week 4 — The Constraint-to-Pattern Map

`20_Interview_Mastery/02_Constraint_to_Algorithm_Map.md` — the lookup table that converts "n ≤ 20" into "bitmask," "n ≤ 10^5" into "O(n log n)" etc.

#### Week 5 — Pattern Recognition Engine

`20_Interview_Mastery/03_DSA_Pattern_Recognition_Engine.md` — when the problem screams "sliding window" vs "two pointers" vs "monotonic stack."

**Section Challenge (interview triage):**

> Five problems are described to you in succession. You have 90 seconds total to pick ONE pattern hint for each. Practice this with the following:
> 1. "Given an integer array nums and integer k, return the kth largest element."
> 2. "Given a string, find the length of the longest substring without repeating characters."
> 3. "A 2D grid of 0/1 where 1 is land. Count distinct islands."
> 4. "Find shortest transformation from word A to word B by changing one letter at a time."
> 5. "Given an unsorted array of integers, find the longest consecutive elements sequence."

<details>
<summary>Answer (with the reasoning chain)</summary>

```
1. "kth largest" → "selection problem"
   - Sort: O(n log n)
   - Heap of size k: O(n log k)
   - QuickSelect: O(n) average
   ANSWER: QuickSelect (partition around pivot)

2. "longest substring NO repeats" → "variable-window sliding window"
   - The window valid condition: no repeated chars
   - When violated: shrink from left until valid
   - Track best window size
   ANSWER: Sliding window + HashSet

3. "2D grid, connected components" → "DFS/BFS on grid"
   - Treat each '1' as a graph node
   - Adjacency = 4-neighbor (or 8 if diagonals)
   - Count traversal starts
   ANSWER: DFS with visited matrix

4. "shortest transformation, one step at a time" → "BFS on words"
   - Graph: word → word' if they differ by one letter
   - Shortest path on unweighted graph = BFS
   ANSWER: BFS from start word, expand by 1-letter variants

5. "longest consecutive elements" → "HashSet trick"
   - Naive: sort O(n log n)
   - Hash all to set
   - For each x where (x-1) NOT in set, count consecutive forward
   - O(n) amortized
   ANSWER: HashSet + "only start counting from minimum"

THE META-PATTERN:
  Don't memorize "what algorithm solves this problem."
  Memorize "what constraint shape implies what algorithm."
  - "kth" → selection problem
  - "longest/shortest with condition" → window or DP
  - "connected component on grid" → DFS/BFS
  - "shortest transformation step-by-step" → BFS
  - "longest consecutive in unsorted" → hash + careful iteration

  60 SECONDS is enough TIME but only if you train this mapping.
```

</details>

---

#### Week 6-8 — Topic Sprints

Drill problems by topic: arrays/strings (Week 6), trees/graphs (Week 7), DP/backtracking (Week 8). Use:
- `20_Interview_Mastery/10_DSA_Problems_Arrays_Strings_Hashing.md`
- `20_Interview_Mastery/11_DSA_Problems_LinkedList_Stack_Queue_Heap.md`
- `20_Interview_Mastery/12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md`

---

### UNIT 3 — System Design (Weeks 9–11)

#### Week 9 — System Design Blueprint

`20_Interview_Mastery/06_System_Design_Blueprint.md` — Requirements → Capacity Estimation → API → DB Choice → Scale → Tradeoffs.

#### Week 10 — Canonical Problems

`20_Interview_Mastery/06b_System_Design_Problems.md` — URL shortener, design Twitter, design Uber, design Netflix.

#### Week 11 — Internals

`20_Interview_Mastery/06c_System_Design_Internals.md` — Kafka internals, Cassandra internals, CDN internals.

---

### UNIT 4 — Behavioral (Week 12)

`09_Career_Reference/15_Behavioral_Interview.md` — STAR method, growth stories, leadership principles, the "tell me about a failure" trap.

---

### UNIT 5 — Cross-Domain (Week 13)

`20_Interview_Mastery/10_Elite_Cross_Domain_Rounds.md` — problems that require combining DSA + SQL + System Design + behavioral judgment.

---

### UNIT 6 — Negotiation (Week 14)

Salary band research (levels.fyi), BATNA, anchoring, total comp = base + bonus + equity + benefits. Email templates.

---

### UNIT 7 — Mock Interview Loop (Weeks 15–16)

Full simulated loop with recording:
- 1× phone screen (45 min, 1-2 problems)
- 3× onsite coding (45 min each)
- 1× system design (60 min)
- 1× behavioral (45 min)

Record each. Self-grade against rubrics. Identify weak signals. Iterate.

---

## Problem Sets

`20_Interview_Mastery/*` files have problems embedded.

## Exam Prep

- The course IS the exam prep — every week is interview practice
- `09_Career_Reference/11_Quick_Reference.md` — week-before cheatsheet
