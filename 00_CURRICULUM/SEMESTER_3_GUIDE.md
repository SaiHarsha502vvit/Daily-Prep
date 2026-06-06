# 📅 Semester 3 Guide — Full-Stack Engineering
## JavaScript · TypeScript · React · CSS · DevOps · Java Concurrency

> **Total estimated time:** ~140 hours (16 weeks, ~9h/week)  
> **Outcome:** Build complete full-stack applications, deploy with Docker + CI/CD, write concurrent Java, and understand browser internals.  
> **Capstone:** Build a full-stack application (React + Spring Boot + PostgreSQL + Docker).

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — JavaScript Runtime & Async (Weeks 1–3)

**Learning Outcomes:**
- Explain the JavaScript event loop, call stack, task queue, and microtask queue
- Write correct async/await code and handle errors properly
- Understand closures, prototypes, and the `this` binding rules

**Week 1 — JavaScript Core & Event Loop**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | JS types, coercion, `==` vs `===` traps | `16_JavaScript/01_JS_Core.md` §1-2 | Fix 5 coercion bugs |
| 2 | Closures, scope chain, lexical environment | `16_JavaScript/01_JS_Core.md` §Closures | Implement a `makeCounter()` factory using closures |
| 3 | `this` binding — 4 rules + arrow function exception | `16_JavaScript/02_JS_Advanced.md` §this | Trace `this` in 6 code snippets |
| 4 | Event loop: call stack, Web API, task queue, microtask queue | `16_JavaScript/03_Async_JS.md` §EventLoop | Predict output order for 5 mixed async snippets |
| 5 | Lab | — | Build a `EventEmitter` class from scratch (Node.js-style) |
| 6–7 | Problem Set JS-PS1 | — | Self-written: 5 closure + 5 `this` problems |

**Week 2 — Promises & Async/Await**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Promise states, chaining, `.then()` / `.catch()` / `.finally()` | `16_JavaScript/03_Async_JS.md` §Promises | Convert callback hell to Promise chain |
| 2 | `Promise.all`, `Promise.allSettled`, `Promise.race`, `Promise.any` | `16_JavaScript/03_Async_JS.md` §Promise API | Implement parallel API calls with `Promise.all` |
| 3 | `async/await` — syntactic sugar over Promises | `16_JavaScript/03_Async_JS.md` §Async | Rewrite Promise chain to async/await |
| 4 | Error handling: try/catch in async, unhandled rejections | `16_JavaScript/03_Async_JS.md` §Errors | Fix 3 silently-failing async functions |
| 5 | Lab | — | Build an `AsyncRetry(fn, attempts, delay)` utility |
| 6–7 | Problem Set JS-PS2 | — | 5 async problems (predict order + implement) |

**Week 3 — Prototypes, ES Modules & Modern JS**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Prototype chain, `Object.create`, `class` as syntactic sugar | `16_JavaScript/02_JS_Advanced.md` §Prototypes | Implement class inheritance without `class` keyword |
| 2 | ES Modules: `import/export`, named vs default, tree shaking | `16_JavaScript/04_Modules_Build.md` | Convert CommonJS (`require`) to ES module |
| 3 | Generators & Iterators — `function*`, `yield`, custom iterables | `16_JavaScript/02_JS_Advanced.md` §Generators | Implement `range(start, end, step)` as a generator |
| 4 | WeakMap, WeakRef, FinalizationRegistry — memory management | `16_JavaScript/02_JS_Advanced.md` §WeakRefs | Implement a private field pattern using WeakMap |
| 5 | Lab | — | Build a lazy `Pipeline` class using generators |
| 6–7 | Review all JS topics | — | Mini quiz: 20 JS tricky questions |

---

### UNIT 2 — TypeScript Type System (Weeks 4–5)

**Learning Outcomes:**
- Use generics, conditional types, mapped types, and template literals
- Design type-safe APIs that prevent runtime errors at compile time
- Write `.d.ts` declaration files for untyped JS libraries

**Week 4 — TypeScript Fundamentals**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | `interface` vs `type`, union types, intersection types | `17_TypeScript/01_TS_Core.md` §1-2 | Model a `Shape` union type hierarchy |
| 2 | Generics: `<T>`, constraints `<T extends Constraint>`, default types | `17_TypeScript/01_TS_Core.md` §Generics | Implement `Result<T, E>` type (like Rust's Result) |
| 3 | Utility types: `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record` | `17_TypeScript/02_TS_Advanced.md` §Utility | Use each utility type in a real scenario |
| 4 | Conditional types: `T extends U ? A : B`, `infer` keyword | `17_TypeScript/02_TS_Advanced.md` §Conditional | Implement `UnpackPromise<T>` type |
| 5 | Lab | — | Type a fully safe `EventBus<Events>` with per-event type checking |
| 6–7 | Problem Set TS-PS1 | — | 5 type challenges (type-level puzzles) |

**Week 5 — TypeScript Advanced & React Integration**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Mapped types: `{ [K in keyof T]: ... }` | `17_TypeScript/02_TS_Advanced.md` §Mapped | Implement `DeepReadonly<T>` |
| 2 | Template literal types: `"on${Capitalize<string>}"` | `17_TypeScript/02_TS_Advanced.md` §Template | Model DOM event names with template literals |
| 3 | Strict mode: `strictNullChecks`, `noUncheckedIndexedAccess` | `17_TypeScript/03_TS_Config.md` | Fix 10 strict mode errors in a sample codebase |
| 4 | Discriminated unions for state machines | `17_TypeScript/02_TS_Advanced.md` §Discriminated | Model a `LoadingState<T>` discriminated union |
| 5 | Lab | — | Build a type-safe HTTP client with response types |
| 6–7 | Problem Set TS-PS2 | — | 5 advanced type challenges |

---

### UNIT 3 — React & State Management (Weeks 6–9)

**Learning Outcomes:**
- Explain React's reconciliation algorithm and why keys matter
- Use all React 18 hooks correctly; understand when NOT to use useEffect
- Design scalable state architecture (local → Zustand → React Query)

**Week 6 — React Fundamentals & Hooks**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | JSX, components, props, children | `15_React_Frontend/01_React_Core.md` §1-2 | Build a `Card` component with slot-based children |
| 2 | `useState`, `useRef`, controlled vs uncontrolled inputs | `15_React_Frontend/01_React_Core.md` §Hooks | Build a controlled form with live validation |
| 3 | `useEffect` — when to use it, when NOT to | `15_React_Frontend/02_React_Advanced.md` §useEffect | Fix 3 misused useEffects (direct vs derived state) |
| 4 | `useCallback`, `useMemo`, `React.memo` — when they help vs hurt | `15_React_Frontend/02_React_Advanced.md` §Memoization | Profile before and after memoizing a slow list |
| 5 | Lab | — | Build a `useDebounce(value, delay)` custom hook |
| 6–7 | Problem Set REACT-PS1 | — | Self-written: hooks quiz + implementation |

**Week 7 — React Patterns & Context**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | `useContext` + `useReducer` — when to use over useState | `15_React_Frontend/02_React_Advanced.md` §Context | Build a theme toggler with context |
| 2 | Compound Components pattern | `15_React_Frontend/03_React_Patterns.md` §Compound | Build a `Tabs` component using compound pattern |
| 3 | Render Props and Custom Hooks patterns | `15_React_Frontend/03_React_Patterns.md` §Render | Extract `useFetch<T>(url)` custom hook |
| 4 | React 18: Suspense, `startTransition`, concurrent features | `15_React_Frontend/04_React_18.md` | Wrap a slow component in Suspense with a skeleton |
| 5 | Lab | — | Build `useLocalStorage<T>(key, initialValue)` custom hook |
| 6–7 | Problem Set REACT-PS2 | — | Compound component challenge |

**Week 8 — Data Fetching & React Query**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Client-side data fetching patterns: SWR vs React Query | `15_React_Frontend/05_Data_Fetching.md` §Patterns | Compare stale-while-revalidate vs cache-then-network |
| 2 | `useQuery`, `useMutation`, cache invalidation | `15_React_Frontend/05_Data_Fetching.md` §ReactQuery | Wire up Book list to Spring Boot API |
| 3 | Optimistic updates — update UI before server confirms | `15_React_Frontend/05_Data_Fetching.md` §Optimistic | Add optimistic update to a "like" button |
| 4 | Error boundaries + fallback UI | `15_React_Frontend/05_Data_Fetching.md` §Errors | Wrap the app in an ErrorBoundary |
| 5 | Lab | — | Connect the Library API (P04) to a React frontend |
| 6–7 | Problem Set REACT-PS3 | — | Data fetching patterns quiz |

**Week 9 — Performance & Accessibility**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | React DevTools Profiler — identify wasted renders | `15_React_Frontend/06_React_Performance.md` §Profile | Profile a list rendering 1000 items |
| 2 | Virtualization — `react-window`, `react-virtuoso` | `15_React_Frontend/06_React_Performance.md` §Virtual | Virtualize the 1000-item list |
| 3 | Code splitting — `React.lazy`, `Suspense`, route-based splitting | `15_React_Frontend/06_React_Performance.md` §Splitting | Split 3 route components lazily |
| 4 | Accessibility: ARIA roles, keyboard navigation, focus management | `19_Frontend_Integration/05_Accessibility.md` | Audit a form for WCAG 2.1 AA compliance |
| 5 | Lab | — | **Mini-Project P08 Start:** React Dashboard |
| 6–7 | Problem Set REACT-PS4 | — | Performance optimization challenge |

---

### UNIT 4 — CSS Architecture & Build Tools (Week 10)

**Week 10 — CSS & Build Tooling**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | CSS Box Model, Flexbox, Grid — when to use each | `18_CSS_Complete/01_CSS_Layout.md` | Implement a 3-column dashboard layout with CSS Grid |
| 2 | CSS Variables, `:root`, theming, dark mode | `18_CSS_Complete/02_CSS_Variables.md` | Build a light/dark toggle with CSS variables |
| 3 | CSS animations, transitions, `will-change` performance | `18_CSS_Complete/04_CSS_Animation.md` | Add a slide-in animation to a notification |
| 4 | Vite: hot module replacement, tree shaking, build optimization | `19_Frontend_Integration/03_Build_Tools.md` §Vite | Analyze bundle size before/after tree shaking |
| 5 | Lab | — | Complete P08 React Dashboard with full CSS |
| 6–7 | Review | — | Frontend integration review |

---

### UNIT 5 — DevOps & CI/CD (Weeks 11–12)

**Learning Outcomes:**
- Build Docker images; design multi-container setups with Compose
- Set up a GitHub Actions pipeline: lint → test → build → deploy
- Understand Kubernetes concepts (pods, services, deployments)

**Week 11 — Docker & Containerization**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Docker fundamentals: images, containers, layers, registry | `22_DevOps/01_Docker_Fundamentals.md` | Dockerize the Library REST API (P04) |
| 2 | `Dockerfile` best practices: multi-stage builds, .dockerignore | `22_DevOps/01_Docker_Fundamentals.md` §Dockerfile | Write a multi-stage Dockerfile for Spring Boot |
| 3 | Docker Compose: multi-container (API + DB + Redis) | `22_DevOps/02_Docker_Compose.md` | Run P04 + PostgreSQL with Compose |
| 4 | Docker networking: bridge, host, overlay basics | `22_DevOps/02_Docker_Compose.md` §Network | Explain: why can container A reach container B by name? |
| 5 | Lab | — | **Mini-Project P09:** Dockerize + Compose the full Library stack |
| 6–7 | Problem Set DEVOPS-PS1 | — | Docker + networking quiz |

**Week 12 — CI/CD & GitHub Actions**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | GitHub Actions: workflows, triggers, jobs, steps | `22_DevOps/05_CICD_GithubActions.md` §Core | Write a workflow: on push → run `mvn test` |
| 2 | Matrix builds: test across Java 17/21, multiple OS | `22_DevOps/05_CICD_GithubActions.md` §Matrix | Add matrix strategy to the workflow |
| 3 | Docker publish in CI: build + push to Docker Hub | `22_DevOps/05_CICD_GithubActions.md` §Docker | Add a build-and-push job |
| 4 | Secrets management, environment variables in Actions | `22_DevOps/05_CICD_GithubActions.md` §Secrets | Store DB credentials as repo secrets |
| 5 | Lab | — | Complete P09: full CI/CD pipeline for Library API |
| 6–7 | Problem Set DEVOPS-PS2 | — | Pipeline design challenge |

---

### UNIT 6 — Java Concurrency (Weeks 13–14)

**Learning Outcomes:**
- Design thread-safe classes using `synchronized`, `ReentrantLock`, `Atomic*`, and `volatile`
- Use `ExecutorService`, `CompletableFuture`, and `ForkJoinPool` correctly
- Identify and fix data races, deadlocks, and starvation

**Week 13 — Java Concurrency Fundamentals**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Thread creation, lifecycle, `Runnable` vs `Callable` | `07_Modern_Java/Ch15_Concurrency_Core.md` §1-2 | Create 5 threads that race to update a shared counter |
| 2 | `synchronized` — mutual exclusion, object monitor | `07_Modern_Java/Ch15_Concurrency_Core.md` §Sync | Fix the counter race with `synchronized` |
| 3 | `volatile` — visibility guarantee | `07_Modern_Java/Ch18_JMM_GC_Deep.md` §Volatile | Fix a visibility bug using `volatile` |
| 4 | `AtomicInteger`, `AtomicReference`, CAS operations | `07_Modern_Java/Ch16_Concurrency_Advanced.md` §Atomic | Compare `synchronized` vs `AtomicInteger` for throughput |
| 5 | Lab | — | Implement a thread-safe `BoundedBlockingQueue<T>` |
| 6–7 | Problem Set JAVA-PS3 | — | Concurrency quiz (identify bugs + fix) |

**Week 14 — ExecutorService & CompletableFuture**

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | `ExecutorService` — thread pools, `Executors` factory | `07_Modern_Java/Ch16_Concurrency_Advanced.md` §Executor | Compare Fixed vs Cached vs Work-Stealing pools |
| 2 | `CompletableFuture` — async pipelines, `thenApply`, `thenCompose` | `07_Modern_Java/Ch17_CompletableFuture.md` §Core | Rewrite a blocking sequential call to parallel CF pipeline |
| 3 | Deadlock detection and prevention strategies | `07_Modern_Java/Ch15_Concurrency_Core.md` §Deadlock | Trace a deadlock in two-lock scenario; apply lock ordering |
| 4 | `ReentrantReadWriteLock` — read-heavy optimization | `07_Modern_Java/Ch16_Concurrency_Advanced.md` §RWLock | Implement a thread-safe LRU cache using RWLock |
| 5 | Lab | — | **Mini-Project P07:** Concurrent Task Queue |
| 6–7 | Problem Set JAVA-PS3 (continued) | — | CompletableFuture chaining challenge |

---

### UNIT 7 — Semester 3 Capstone (Weeks 15–16)

**🏆 Capstone 3: Full-Stack Application from Scratch**

**Estimated time:** 30 hours  
→ Full spec: `00_CURRICULUM/PROJECTS/CAP03_FullStack.md`

Build a complete full-stack application:
- **Backend:** Spring Boot 3 REST API + JPA + PostgreSQL + Docker
- **Frontend:** React 18 + TypeScript + React Query + Tailwind (or vanilla CSS)
- **Auth:** JWT on backend, token stored in `httpOnly` cookie on frontend
- **CI/CD:** GitHub Actions pipeline → Docker Hub
- **Tests:** JUnit 5 (backend) + Vitest/RTL (frontend)

---

[← Semester 2](SEMESTER_2_GUIDE.md) | [Back to Overview](CURRICULUM_OVERVIEW.md) | [Semester 4 →](SEMESTER_4_GUIDE.md)
