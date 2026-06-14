# Step 2 — Baseline Shape & Folder Boundaries

**Date:** 2026-06-14
**Folder:** `15_React_Frontend/`
**Verify command:** `test -f 15_React_Frontend/CONTEXT.md && test -f 15_React_Frontend/00_INDEX.md`

## Result

✅ **CONTEXT.md and 00_INDEX.md both exist**

## CONTEXT.md (15_React_Frontend/CONTEXT.md)

**Purpose:** Teach React components, hooks, state, context, rendering, architecture, and React-specific deep reasoning.

**Writing Style:**
- Component and state-flow reasoning.
- Hook rules and lifecycle mental models.
- Production frontend tradeoffs.
- Keep examples inspectable and concrete.

**Boundaries:**
- Plain JavaScript belongs in `16_JavaScript`.
- Type-level design belongs in `17_TypeScript`.
- Layout and styling belong in `18_CSS_Complete`.

**Update Triggers:** Update this file when React architecture, canonical React topics, or frontend boundary rules change.

## 00_INDEX.md (15_React_Frontend/00_INDEX.md)

**Reading Order:** 13 entries listed (Ch01-Ch13) — but Ch13 file is MISSING from disk (documented in STEP1).

**Cross-Reference:** "Hands-On Practice" section points to `../19_Frontend_Integration/frontend_challenges/` for DOM sync, race conditions, stacking contexts, stale closures, deep immutability.

## Baseline Grep Stats (for upgrade comparison)

| Metric | Baseline | Files | Success Criterion |
|--------|----------|-------|-------------------|
| HE year-regex (2006-2024) | 5 files | 5/15 | Exceeds baseline of 3 |
| PR phrases (failure modes / production incidents) | 7 files | 7/15 | Exceeds baseline of 3 |
| invariant / trade-off / variant mentions | 2 files | 2/15 | Exceeds baseline |
| 5W1H blocks (D014) | 11 files | 11/15 | >= 1 (preserve) |
| Diagram chars (Unicode box-drawing) | 10 files | 10/15 | >= baseline (don't decrease) |

## Boundary Enforcement for Phase 2

- **Plain JS topics:** redirect to 16_JavaScript (e.g., event loop mechanics, closures, prototypes)
- **TypeScript type-level design:** redirect to 17_TypeScript (e.g., conditional types, mapped types)
- **CSS layout/styling:** redirect to 18_CSS_Complete (e.g., grid, flexbox, animations)
- **React-specific scope (keep here):** components, JSX, hooks, state, context, rendering, reconciliation, Fiber, Suspense, Concurrent Mode, Server Components, performance (memo/useMemo/useCallback/Profiler), testing (RTL/Jest), routing (React Router/Next.js App Router), state management libs (Redux/Zustand/Recoil/Jotai/TanStack Query), SSR/SSG (Next.js/Remix/Astro)

## Implication for Phase 1 Audit (step-3)

The audit subagent must:
1. Score all 12 chapters (Ch01-Ch12) + 00_INDEX + CONTEXT + 15_PROBLEM_SETS = 15 files
2. Apply Combined Lens rubric (CD/TB/PR/HE/PC, 0-3 each)
3. Flag files where avg < 2.0 OR any dim = 0
4. Note: PR=7 already at baseline >3 means some chapters already have production failure language; HE=5 > 3 means some have year references; need to grow these across more chapters
5. Note: 5W1H=11 files — far exceeds the D014 baseline of 1 (must preserve all)

## Verification Exit Code

`test -f 15_React_Frontend/CONTEXT.md && test -f 15_React_Frontend/00_INDEX.md` returned success.
