# Folder Context: 03_Algorithms

## Purpose

Teach algorithmic thinking, complexity, searching, recursion, DP, graphs, greedy, strings, number theory, bit manipulation, and advanced algorithm engineering. Also contains the **University Methodology Layer** (`A1..A4`) — the proof-based, complexity-based, lower-bound, and randomized algorithm chapters from MIT 6.006 / 6.046J, KTH DD1352 / DD2352, RWTH Aachen Algo I/II, and TU Munich IN0007.

## Writing Style

- Every chapter carries the standard blocks: **Bridge** (builds on / you will learn / leads to / abstraction level), **study-partner explainer** (bottom line, textbook core, analogy, walkthrough, quick check), an **At a Glance** Mermaid diagram + table where it adds value, and an **Enterprise Lens** (production use, failure modes, testing). See `00_LEARNING_PATH.md` for the dependency graph, abstraction ladder and coverage matrix.
- New or changed code must be compiled and cross-checked (brute force / known values) before it is documented.
- Brute force first, then optimized rewrite.
- State the invariant.
- Explain constraint triggers.
- Include why the algorithm works, when it fails, and how to debug edge cases.
- Prefer deep reasoning over template dumping.
- Catalog chapters may include a "🎓 University Proof Corner" near the top — a 1-3 page compression of 1-3 proofs from the `A*` chapters, with MIT/KTH/RWTH/TUM attribution and a "Full proofs: [link]" footer. See `00_CONTEXT/DECISIONS.md` D015.

## Boundaries

- Reusable interview templates belong in `04_Patterns_Templates`. Problem drills belong in `05_Problem_Solving`. Java-specific implementation gotchas belong in `07_Modern_Java` unless the algorithm lesson requires them.
- The `A*` chapters are the rigorous, university-style foundation. Catalog chapters (`01..12_*`) teach implementation; Proof Corners link to the `A*` chapters for the underlying theory.

## Update Triggers

Update this file when new algorithm families, competitive-programming strategies, university-methodology additions, or constraint-based selection rules are added.
