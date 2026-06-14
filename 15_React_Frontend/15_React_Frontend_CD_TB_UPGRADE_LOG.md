# CD/TB Upgrade Log — 15_React_Frontend

**Ferment:** Combined Lens Upgrade — Phase 2, Step 4 (CD/TB enhancements)
**Date:** 2026-06-14
**Scope:** Add Conceptual Depth (CD) invariant statements and Topical Breadth (TB) variant trade-off tables to all 12 chapter files.

---

## Per-File Additions

| # | File | Addition | Type | Insertion Point |
|---|------|----------|------|-----------------|
| 01 | `01_React_Fundamentals.md` | React vs Vue vs Svelte vs Solid comparison | Variant Trade-off (TB) | After Production Reality, before Section 0 |
| 02 | `02_Component_Patterns.md` | HOC vs Render Props vs Hooks vs Compound Components | Variant Trade-off (TB) | After Production Reality, before Pattern 1 |
| 03 | `03_Hooks_Deep_Dive.md` | Hooks must be called in same order invariant | Invariant (CD) | After Production Reality, before useState section |
| 04 | `04_State_Management.md` | Context vs Redux vs Zustand vs Recoil vs Jotai vs TanStack Query (6-way) | Variant Trade-off (TB) | After Production Reality, before "When Do You Need State Management?" |
| 05 | `05_React_TypeScript.md` | JS vs TS vs JSDoc vs PropTypes in React apps | Variant Trade-off (TB) | After Production Reality, before Part 2 |
| 06 | `06_React_Router.md` | React Router vs Next.js App Router vs TanStack Router | Variant Trade-off (TB) | After Production Reality, before React Router v6 |
| 07 | `07_React_Testing.md` | Jest vs Vitest vs RTL vs Enzyme | Variant Trade-off (TB) | After Production Reality, before Testing Pyramid |
| 08 | `08_React_Performance.md` | Memoize only when profiler shows need | Invariant (CD) | After Production Reality, before Part 1 |
| 09 | `09_React_Deep_Reasoning.md` | Reconciliation is O(n) | Invariant (CD) | After Production Reality, before "Why This Chapter Exists" |
| 10 | `10_Custom_Hooks_Library.md` | useDebounce vs useThrottle vs custom polling | Variant Trade-off (TB) | After Production Reality, before Table of Contents |
| 11 | `11_Complex_UI_Pages_Patterns.md` | CSS Modules vs Tailwind vs styled-components vs CSS-in-JS | Variant Trade-off (TB) | After Production Reality, before Table of Contents |
| 12 | `12_Hands_On_React_Projects.md` | Next.js vs Remix vs Astro (SSR/SSG) | Variant Trade-off (TB) | After Production Reality, before Level 1 |

---

## Count Changes

| Metric | Before | After |
|--------|--------|-------|
| Files with `invariant`/`trade-off`/`variant` | ~2 | 12 |
| Variant Trade-off tables | ~1 | 11 |
| Invariant statements | ~1 | 3 |

---

## Meta File Verification

| File | Touched? |
|------|----------|
| `00_INDEX.md` | NO |
| `CONTEXT.md` | NO |
| `15_PROBLEM_SETS.md` | NO |
| `15_React_Frontend_AUDIT.md` | NO |
| `15_React_Frontend_DIAGRAM_INVENTORY.md` | NO |
| `15_React_Frontend_HE_UPGRADE_LOG.md` | NO |
| `15_React_Frontend_PR_UPGRADE_LOG.md` | NO |
| `15_React_Frontend_DIAGRAM_UPGRADE_LOG.md` | NO |

---

## 5W1H Preservation Check

All 12 chapters retain their 5W1H blocks. No 5W1H sections were modified.

---

## Methodology

- Used `edit` tool exclusively (surgical oldText/newText replacements)
- No file rewrites
- No existing code or diagram formatting modified
- One addition per chapter (either variant trade-off table or invariant statement)
- Mixed 9 variant trade-off tables with 3 invariant statements based on topic fit

Co-Authored-By: Kimchi <noreply@kimchi.dev>
