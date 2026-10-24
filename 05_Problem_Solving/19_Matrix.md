> **Navigation**: [← SECTION 16: BIT MANIPULATION &…](18_BitManipulation.md) | [Chapter index](00_INDEX.md) | [SECTION: DESIGN PROBLEMS →](21_Design.md)

# 19. Matrix / Grid — Complete Problem Guide

> **Matrix / grid mastery guide**: from theory to hard problems, in an academic style.
>
> - Part 0: theory and grid fundamentals
> - Part 1: easy (4 problems)
> - Part 2: medium (10 problems)
> - Part 3: hard (4 problems)
> - Part 4: cheat sheet and pattern reference


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [2D Arrays](../02_Data_Structures/04_2D_Arrays_Matrix.md), [Matrix + Grid](../04_Patterns_Templates/19_Matrix_Plus_Grid_Traversal.md) |
| **You will learn** | Traversal orders, rotation, search in sorted matrices, flood fill, DP on grids and multi-source BFS |
| **Leads to** | [Sorting](20_Sorting.md) |
| **Abstraction level** | Nested loops → **grid as an implicit graph** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Matrix & Grid Problems

### 1. The bottom line

A grid is a graph whose neighbours come from direction offsets; use BFS, DFS or DP on it.

### 2. The textbook core

- Direction arrays and bounds checks.
- Rotate = transpose + reverse rows.
- Search a row/column-sorted matrix from a corner.
- Multi-source BFS for spreading problems.
- DP on grids by rows.

### 3. The real-world analogy

A **chessboard**.

### 4. Walkthrough

1. Rotate `[[1,2],[3,4]]` 90° clockwise.
2. Transpose: `[[1,3],[2,4]]`.
3. Reverse each row: `[[3,1],[4,2]]`.
4. Done in place.

> [!NOTE]
> **Quick check:** How do you rotate a matrix 90° clockwise in place? *Transpose, then reverse each row.*


### 5. Check yourself

**Q1.** Spiral order of `[[1,2,3],[4,5,6],[7,8,9]]`.

<details><summary>Answer</summary>

`1,2,3,6,9,8,7,4,5`.

</details>

**Q2.** Searching a matrix whose rows and columns are sorted: where do you start?

<details><summary>Answer</summary>

At the top-right (or bottom-left); each comparison removes a row or a column: `O(m + n)`.

</details>

---


## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [THEORY — Grid Fundamentals (MIT/KTH Style)](19_Matrix/01_theory_grid_fundamentals_mit_kth_style.md) | THEORY — Grid Fundamentals (MIT/KTH Style) | 209 |
| 2 | [Easy Problems](19_Matrix/02_easy_problems.md) | Easy Problems · 1. [Number of… · 2. [Rotting… · 3. [01… · 4. [Spiral… · … | 807 |
| 3 | [9. [Pacific Atlantic Water…](19_Matrix/03_pacific_atlantic_water_flow_https_leetcode.md) | 9. [Pacific Atlantic Water… · 10. Game of Life (LC 289) ⭐⭐ Medium | 178 |
| 4 | [Hard Problems](19_Matrix/04_hard_problems.md) | Hard Problems | 388 |
| 5 | [Cheat Sheets and Reference](19_Matrix/05_cheat_sheets_and_reference.md) | Cheat Sheets and Reference | 256 |

## 🏢 Enterprise Lens — Matrix & Grid Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Image processing, game maps, layouts |
| **Failure modes** | Row/column mix-ups; out-of-bounds |
| **Testing and verification** | Small grids against brute force |

---

## Reality Check

**"Matrix problem practice duplicates grid-traversal practice"** → The traversal chapter owns movement; this set owns TRANSFORMS and STRUCTURE: rotation compositions (transpose plus reflections generate all eight symmetries — knowing the group means never memorizing a second rotation), search exploiting double-sortedness (staircase elimination), and simultaneity encoding for in-place updates. The two sets share a board and almost nothing else; conflating them leaves the transform muscles untrained.

**"Spiral order is a solved snippet to paste"** → Spiral's value is as the BOUNDARY-BOOKKEEPING stress test: four cursors, four walls, and the two degenerate finishes (single remaining row, single remaining column) that duplicate elements in naive versions. The after-each-side shrink-and-recheck discipline it forces is the same discipline diagonal traversals, layer-by-layer rotations, and onion-peeling problems need — practice it as bookkeeping training, and the snippet writes itself forever after.

**"Set-matrix-zeroes teaches the marker trick"** → It teaches CONSTANT-SPACE STATE SMUGGLING: the first row and column become the marker store, with two scalar flags remembering their own original state — order of the final write-back matters (marked cells first, first row/col last). The generalizable move is reusing input real estate as scratch when the problem forbids allocation; game-of-life's two-bit encoding is the same move with different packing. Both interview well precisely because the follow-up ("now without extra space") is pre-baked.

**"Word-search belongs to backtracking, not matrices"** → It belongs to both, and its matrix-side lessons are the ones people miss: prune by CHARACTER-FREQUENCY before searching (if the board lacks the letters, skip), start from the rarer end of the word, and mark-in-place with restore. Word-search-II adds the trie so ALL words share one board walk — the canonical structure-fusion problem (trie times DFS) and the standard hard follow-up. Practicing it only as generic backtracking leaves those matrix-specific accelerations undiscovered.

**"Largest square/rectangle of ones is exotic DP"** → Maximal-square is three-neighbor min-plus-one DP (the cleanest 2D recurrence in the catalog), and maximal-RECTANGLE is histogram-largest-rectangle applied row by row — heights accumulate downward, monotonic stack per row. The pair is the standard demonstration that hard matrix problems decompose into a per-row 1D problem plus an accumulation rule; that decomposition question ("is there a 1D problem hiding in each row?") belongs in the routing checklist for every new matrix hard.
