> **Navigation**: [← SECTION: DESIGN PROBLEMS](21_Design.md) | [Chapter index](00_INDEX.md) | [Edge Cases Master Guide →](23_Edge_Cases.md)


---

# 📚 SECTION 13: HACKEREARTH & CODEFORCES MIXED PROBLEMS

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Constraint-Based Selection](../04_Patterns_Templates/25_Constraint_Based_Pattern_Selection.md), [Pattern Master Guide](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md) |
| **You will learn** | Problems that need two or more patterns, plus contest-style input handling and time limits |
| **Leads to** | [Linked List](15_LinkedList.md) |
| **Abstraction level** | One pattern per problem → **patterns composed** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Mixed & Competitive Problems

### 1. The bottom line

Harder problems combine patterns, for example binary search over a greedy check, or a heap plus a hash map.

### 2. The textbook core

- Read the constraints to choose the budget.
- Identify the sub-patterns.
- Test each sub-pattern alone.
- Use fast I/O in contests.
- Watch constants as well as asymptotics.

### 3. The real-world analogy

A **recipe that needs two techniques**, such as searing then braising.

### 4. Walkthrough

1. Problem: split an array into `k` parts minimising the largest sum.
2. Observation: answer is monotone in the allowed maximum.
3. Binary search the maximum; check feasibility with a greedy pass.
4. Total `O(n log S)`.

> [!NOTE]
> **Quick check:** What two patterns combine in "split array largest sum"? *Binary search on the answer and a greedy feasibility check.*

---


**COMPETITIVE PROGRAMMING PATTERNS**

```text
WHY PRACTICE THESE PLATFORMS?
- Different problem styles than LeetCode
- Focus on mathematical thinking
- Time complexity matters more
- Better at handling edge cases

COMMON TOPICS:
• Number Theory (primes, GCD, modular arithmetic)
• Combinatorics
• Bit Manipulation
• Sorting & Searching variations
• Implementation problems
• Ad-hoc problems (pattern recognition)
```


### 5. Check yourself

**Q1.** Split `[7,2,5,10,8]` into 2 parts minimising the largest part sum.

<details><summary>Answer</summary>

**18** (`[7,2,5]` and `[10,8]`).

</details>

**Q2.** Which two patterns solve that problem?

<details><summary>Answer</summary>

Binary search on the answer plus a greedy feasibility check.

</details>

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [13.1 Number Theory Problems](14_Mixed_Competitive/01_number_theory_problems.md) | 13.1 Number Theory Problems | 192 |
| 2 | [13.2 Bit Manipulation](14_Mixed_Competitive/02_bit_manipulation.md) | 13.2 Bit Manipulation | 137 |
| 3 | [13.3 Implementation Problems](14_Mixed_Competitive/03_implementation_problems.md) | 13.3 Implementation Problems | 177 |
| 4 | [13.4 Sorting & Searching Variations](14_Mixed_Competitive/04_sorting_searching_variations.md) | 13.4 Sorting & Searching Variations · 13.5 Ad-hoc & Pattern Recognition | 222 |
| 5 | [CONGRATULATIONS! ALL SECTIONS COMPLETE!](14_Mixed_Competitive/05_congratulations_all_sections_complete.md) | CONGRATULATIONS! ALL SECTIONS COMPLETE! | 447 |

## 🏢 Enterprise Lens — Mixed & Competitive Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Contests, hard interview rounds |
| **Failure modes** | Choosing one pattern and forcing it |
| **Testing and verification** | Test each stage separately and compare with brute force |

---

## Reality Check

**"Mixed sets are for after mastering each topic"** → Mixed practice IS the mastery mechanism, not its reward: interleaving forces the retrieve-and-route step (which pattern?) that blocked practice never exercises, and that routing step is precisely what interviews test. The research-backed schedule is blocked-first-then-interleaved per topic, with mixed sets making up the bulk of the final month — not a graduation treat after topic perfection, which never arrives.

**"Timing yourself adds stress without value"** → Untimed practice trains a different skill than the assessed one: bounded-time solving includes triage (solvable in budget?), checkpointing (brute force banked before optimizing), and abandon-decisions — none of which exist untimed. The calibration: 25 minutes for mediums with the LAST five reserved for testing; consistently exceeding it means the recognition layer needs work, not more grinding. Stress inoculation is a real, trainable effect.

**"A solved problem is finished"** → The rate-limiting resource is INSIGHT-PER-PROBLEM, and it is harvested after the accept: what was the trigger cue, which wrong path ate the time, what one-sentence lesson generalizes. Ten problems with post-mortems beat forty without — the forty build familiarity with titles, the ten build transferable routing rules. A problems-log with a lessons column doubles the value of every hour already spent.

**"Contest tricks are irrelevant to interview prep"** → Three transfer directly: reading constraints as the complexity contract before the statement (contest habit, interview superpower), banking partial credit (brute force first — in interviews this means a working solution exists before optimization begins), and the wrong-answer debugging ladder (small counterexample generation over stare-and-hope). What does NOT transfer: golfed code and silence — interviews grade narration, contests penalize it.

**"Plateaus mean grinding more of the same"** → Plateaus localize to a LAYER, and each layer has a different fix: recognition failures (cannot start) want pattern-trigger drills and constraint-reading; execution failures (idea right, code wrong) want typing-out-templates until boring; composition failures (mediums fine, hards opaque) want the two-pattern problems specifically. Diagnosing which layer stalls you — from your own problems-log — beats undifferentiated volume every time.
