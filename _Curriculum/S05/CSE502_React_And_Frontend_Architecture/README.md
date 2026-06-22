# CSE502 — React & Frontend Architecture

## Semester 5 · Full-Stack Specialization (Frontend Track)

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can design component APIs that compose, debug re-render issues with React DevTools profiler, justify architectural decisions about state management based on the data's lifetime + scope, and write hooks that don't violate the rules of hooks under any code path.
> **Capstone:** Build a production-style React 19 application with Server Components, route-level data loaders, optimistic updates, accessibility, and a complete test suite. Document architectural decisions in ADRs.

---

## Navigation

| Course                                                                                  | Description |
| --------------------------------------------------------------------------------------- | ----------- |
| **[CSE501 — JavaScript & TypeScript Deep Dive](../CSE501_JavaScript_And_TypeScript_Deep_Dive/README.md)** | Prerequisite for this course |
| **CSE502 — React & Frontend Architecture**                                              | This course |
| **[CSE503 — CSS & Design Systems](../CSE503_CSS_And_Design_Systems/README.md)**         | S05 sibling |
| **[CSE504 — Frontend Integration & Performance](../CSE504_Frontend_Integration_And_Performance/README.md)** | S05 sibling |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `15_React_Frontend/`                       | Primary source — every chapter cited below                     |
| `17_TypeScript/`                           | TypeScript-typed React patterns (Ch05)                         |
| `18_CSS_Complete/`                         | Styling components — CSS-in-JS tradeoffs                       |
| `19_Frontend_Integration/`                 | Build pipeline, code splitting, bundle analysis                |
| `21_SDET_Playwright_Automation/`           | E2E testing React apps                                          |

---

## Prerequisites

- `CSE501 JavaScript & TypeScript Deep Dive` — TS generics, discriminated unions, hooks fluency baseline
- `15_React_Frontend/01_React_Fundamentals.md` §1-3 — JSX, props, state baseline
- Working dev environment with React 19+

**Constraint:** This is NOT a hooks tutorial. You should already know `useState`, `useEffect`, and basic component composition. We focus on the JUDGMENT: when does a hook violate idiomatic React? When does memoization HURT performance?

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Reasoning Foundations (Weeks 1–3)

**Learning Outcomes:**

- Trace render → commit → effect → paint pipeline
- Debug stale closure bugs in useEffect dependencies
- Design components that compose without prop drilling

#### Week 1 — Render Mental Model

| Day | Topic                              | Read                                              | Do                                                       |
| --- | ---------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | What is a render?                  | `15_React_Frontend/01_React_Fundamentals.md` §1-2 | Trace 5 setState calls; how many renders fire?           |
| 2   | Reconciliation + keys              | `15_React_Frontend/01_React_Fundamentals.md` §3   | Why does swapping array order without keys lose state?   |
| 3   | useEffect — when does it run?      | `15_React_Frontend/03_Hooks_Deep_Dive.md` §1-2    | Trace 4 effect cases: mount, update, deps, cleanup       |
| 4   | useEffect stale closure trap       | `15_React_Frontend/03_Hooks_Deep_Dive.md` §3      | Find the stale closure bug in `setInterval(() => setCount(count+1), 1000)` |
| 5–7 | Review + Problem Set REACT-PS1     | —                                                 | `15_React_Frontend/15_PROBLEM_SETS.md` PS-1              |

**Section Challenge (stale closure):**

> A user types in a search box. Each keystroke schedules a debounced API call:
> ```js
> useEffect(() => {
>   const timer = setTimeout(() => fetchResults(query), 300);
>   return () => clearTimeout(timer);
> }, []);
> ```
> The user reports: "the first letter I type IS searched, but every letter after that ignores my new query and searches for the first letter only." Explain the bug from the closure mechanics, and propose two fixes.

<details>
<summary>Answer</summary>

```
THE BUG: empty dependency array [] means the effect runs ONCE on mount.
At mount, `query` is closed over with its initial value (empty string).
But wait — the user said the FIRST letter is searched. That means the
effect's closure captured `query` at first render after the first
keystroke... and never again, because [] tells React: "never re-run."

ACTUALLY MORE PRECISE:
  Effect runs after first render, captures `query` = "a" (first letter).
  setTimeout fires 300ms later → fetches "a".
  User types "ap" — component re-renders, but [] effect does NOT re-run.
  The stale setTimeout already fired, the cleanup function is captured
  in closure of original effect call — clearTimeout cancels a timer that
  already fired (no-op), and no new timer is scheduled.
  → No further searches happen.

FIX 1 — add query to deps:
  useEffect(() => {
    const timer = setTimeout(() => fetchResults(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  Every query change re-runs the effect. The cleanup of the PREVIOUS
  effect (clearTimeout) cancels the previous setTimeout. The NEW
  setTimeout closes over the new query. Debouncing works.

FIX 2 — use useRef to read latest value without re-running:
  const queryRef = useRef(query);
  useEffect(() => { queryRef.current = query; });
  useEffect(() => {
    const id = setInterval(() => fetchResults(queryRef.current), 300);
    return () => clearInterval(id);
  }, []);
  Useful when you DON'T want to recreate the timer on every keystroke
  (e.g., poll continuously, but read latest value when poll fires).

WHEN TO PICK WHICH:
  FIX 1 = debounce semantics (cancel previous, schedule new).
  FIX 2 = poll/listen semantics (constant cadence, read latest).
  The user's intent here is debounce → FIX 1 is correct.
```

</details>

---

#### Week 2 — Component Patterns

`15_React_Frontend/02_Component_Patterns.md` — compound components, render props, controlled vs uncontrolled, slot patterns.

#### Week 3 — Hooks Deep Dive

`15_React_Frontend/03_Hooks_Deep_Dive.md` — rules of hooks (and why), custom hook composition, useReducer for complex state.

---

### UNIT 2 — State Management (Weeks 4–6)

**Learning Outcomes:**

- Pick state storage based on data lifetime + scope (server, URL, local, global)
- Implement and reason about useReducer + Context patterns
- Choose between Zustand, Jotai, Redux Toolkit for different problem shapes

`15_React_Frontend/04_State_Management.md` — server state (React Query / TanStack Query) vs client state, when Context is fine vs when it bottlenecks.

---

### UNIT 3 — TypeScript + React (Weeks 7–8)

`15_React_Frontend/05_React_TypeScript.md` — typed props, generic components, polymorphic `as` prop, event types.

---

### UNIT 4 — Routing & Data (Weeks 9–10)

`15_React_Frontend/06_React_Router.md` — nested routes, loaders/actions (React Router v7), data preloading.

---

### UNIT 5 — Testing (Week 11)

`15_React_Frontend/07_React_Testing.md` — RTL principles, query priorities, async testing, MSW for API mocking.

---

### UNIT 6 — Performance (Weeks 12–13)

**Learning Outcomes:**

- Use React DevTools profiler to find waste
- Apply memo, useMemo, useCallback CORRECTLY (and recognize when they hurt)
- Implement virtualization for large lists

`15_React_Frontend/08_React_Performance.md` — when memoization is overhead, when it's essential; concurrent rendering with useTransition.

---

### UNIT 7 — React 19 + Server Components (Weeks 14–15)

`15_React_Frontend/11_Complex_UI_Pages_Patterns.md` — RSC architecture, Server Actions, use() hook, streaming.

---

### Week 16 — Capstone Integration

Build a production app combining all units. Write ADRs for major decisions (state library choice, routing strategy, performance budgets).

**Hands-on projects** — see `15_React_Frontend/12_Hands_On_React_Projects.md`.

---

## Problem Sets

[`15_React_Frontend/15_PROBLEM_SETS.md`](../../../15_React_Frontend/15_PROBLEM_SETS.md) — covers components, hooks, state, perf, testing.

## Exam Prep

[`15_React_Frontend/09_React_Deep_Reasoning.md`](../../../15_React_Frontend/09_React_Deep_Reasoning.md) — 13 freeze moments for senior interviews.
