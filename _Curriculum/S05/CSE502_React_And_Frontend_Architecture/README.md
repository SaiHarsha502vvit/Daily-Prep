# CSE502 — React & Frontend Architecture

**Estimated time:** ~25h  
**Prerequisite:** [CSE501](./CSE501_JavaScript_And_TypeScript_Deep_Dive/README.md)

## Description

Comprehensive study of React 19 with Server Components, the Concurrent Renderer, Suspense boundaries, and the new Actions API. Covers component composition, state management patterns, performance optimization, and architectural decisions for scalable frontend applications.

## Learning Outcomes

1. Build React 19 applications using Server Components, Client Components, and the hybrid model
2. Master the Concurrent Renderer: useTransition, useDeferredValue, Suspense for data fetching
3. Design component APIs with compound components, render props, and controlled/uncontrolled patterns
4. Implement global state with Context, useReducer, and external state libraries (Zustand/Jotai)
5. Architect large-scale React applications: folder structure, code splitting, lazy loading, feature flags

## Syllabus Outline

| Week | Topic                                                                        |
| ---- | ---------------------------------------------------------------------------- |
| 1    | React 19 new features: Server Components, Server Actions, use() hook         |
| 2    | Concurrent rendering: Scheduler, priorities, useTransition, useDeferredValue |
| 3    | Suspense: data fetching patterns, transitions, error boundaries              |
| 4    | Component composition: compound components, context for state sharing        |
| 5    | State management: useReducer + Context, Zustand, Jotai comparison            |
| 6    | Performance: memo, useMemo, useCallback, avoidance of unnecessary renders    |
| 7    | Forms & validation: Actions, controlled inputs, Zod + React Hook Form        |
| 8    | Routing: React Router v7, nested routes, loaders, data mutations             |
| 9    | Testing: Vitest + React Testing Library, mocking server components           |
| 10   | Capstone: full-stack React 19 application with RSC                           |

## Linked Existing Content

- [React & Frontend Fundamentals](../../15_React_Frontend/)

## Assessment

- Weekly lab exercises (component architecture challenges)
- Multi-page React application with Server Components
- 2-hour practical exam (performance optimization + state design)
