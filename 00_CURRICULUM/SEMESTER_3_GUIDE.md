# 📅 Semester 3 Guide — Full-Stack Engineering

## JavaScript · TypeScript · React · CSS · DevOps · Java Concurrency

> **Total estimated time:** ~130 hours (16 weeks): about 7h/week of guided study in Weeks 1–14 (~100h, including mini-projects P07–P09) plus the 30h capstone in Weeks 15–16.  
> **Outcome:** Build complete full-stack applications, deploy with Docker + CI/CD, write concurrent Java, and understand how the browser renders and runs your code.  
> **Capstone:** Build "DevBoard", a full-stack application (React + TypeScript + Spring Boot + PostgreSQL + Docker).

**How to read the tables:** every path in a **Read** column is a real file in this repo, and `§Name` is a heading inside it. Where a chapter organises its content into `PART`/`Part` blocks without sub-headings, the table says "Part N" instead of a `§`. **Problem-set rows** point at the real problem-set file for the module (e.g. `16_JavaScript/16_PROBLEM_SETS.md`); work the named set there.

### ⏱️ Time budget by unit

| Unit                                | Weeks | Module hours (from the [Curriculum Overview](CURRICULUM_OVERVIEW.md)) |
| ----------------------------------- | ----- | --------------------------------------------------------------------- |
| 1. JavaScript Runtime & Async       | 1–3   | 12h                                                                   |
| 2. TypeScript Type System           | 4–5   | 10h                                                                   |
| 3. React & State Management         | 6–9   | 16h + P08 (6–8h)                                                      |
| 4. CSS Architecture & Build Tools   | 10    | CSS 8h + Frontend Integration 8h (shared with Unit 3 reading)         |
| 5. DevOps & CI/CD                   | 11–12 | 16h (incl. Git) + P09 (5h)                                            |
| 6. Java Concurrency                 | 13–14 | 12h + P07 (5–6h)                                                      |
| 7. Capstone 3                       | 15–16 | 30h                                                                   |

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — JavaScript Runtime & Async (Weeks 1–3)

**Learning Outcomes:**

- Explain the JavaScript event loop, call stack, task queue, and microtask queue
- Write correct async/await code and handle errors properly
- Understand closures, prototypes, and the `this` binding rules

**Week 1 — JavaScript Core & Event Loop**

| Day | Topic                                                        | Read                                                                                                                          | Do                                                        |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | JS types, coercion, `==` vs `===` traps                      | `16_JavaScript/01_JS_Foundations.md` §Type Coercion; `16_JavaScript/01_JS_Foundations.md` §The == vs === Rule                 | Fix 5 coercion bugs from the chapter's Predict / Trace set |
| 2   | Closures, scope chain, lexical environment                   | `16_JavaScript/02_JS_Functions_Closures.md` §Closures                                                                         | Implement a `makeCounter()` factory using closures        |
| 3   | `this` binding — the priority rules + arrow function exception | `16_JavaScript/02_JS_Functions_Closures.md` §The 5 Rules of                                                                 | Trace `this` in 6 code snippets                           |
| 4   | Event loop: call stack, Web API, task queue, microtask queue | `16_JavaScript/04_JS_Async_Promises.md` §The Event Loop; `16_JavaScript/04_JS_Async_Promises.md` §Microtasks vs Macrotasks    | Predict output order for 5 mixed async snippets           |
| 5   | Lab                                                          | —                                                                                                                             | Build a `EventEmitter` class from scratch (Node.js-style) |
| 6–7 | Problem Set JS-PS1 — Closures, `this`, and Scope             | `16_JavaScript/16_PROBLEM_SETS.md` §Problem Set JS-PS1                                                                        | 5 closure + 5 `this` problems from the set                |

**Week 2 — Promises & Async/Await**

| Day | Topic                                                              | Read                                                                                                                | Do                                                 |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Promise states, chaining, `.then()` / `.catch()` / `.finally()`    | `16_JavaScript/04_JS_Async_Promises.md` §Callbacks; `16_JavaScript/04_JS_Async_Promises.md` §Promises                | Convert callback hell to Promise chain             |
| 2   | `Promise.all`, `Promise.allSettled`, `Promise.race`, `Promise.any` | `16_JavaScript/04_JS_Async_Promises.md` §Promise Static Methods                                                     | Implement parallel API calls with `Promise.all`    |
| 3   | `async/await` — syntactic sugar over Promises                      | `16_JavaScript/04_JS_Async_Promises.md` §Async/Await                                                                | Rewrite Promise chain to async/await               |
| 4   | Error handling: try/catch in async, unhandled rejections           | `16_JavaScript/04_JS_Async_Promises.md` §Error Handling Patterns; `16_JavaScript/07_JS_Error_Handling_Debugging.md` §try/catch/finally | Fix 3 silently-failing async functions     |
| 5   | Lab                                                                | —                                                                                                                   | Build an `AsyncRetry(fn, attempts, delay)` utility |
| 6–7 | Problem Set JS-PS2 — Promises & Async/Await                        | `16_JavaScript/16_PROBLEM_SETS.md` §Problem Set JS-PS2                                                              | 5 async problems (predict order + implement)       |

**Week 3 — Prototypes, ES Modules & Modern JS**

| Day | Topic                                                           | Read                                                                                                                  | Do                                                  |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Prototype chain, `Object.create`, `class` as syntactic sugar    | `16_JavaScript/03_JS_Objects_Prototypes.md` §Prototypes; `16_JavaScript/03_JS_Objects_Prototypes.md` §ES6 Classes     | Implement class inheritance without `class` keyword |
| 2   | ES Modules: `import/export`, named vs default, tree shaking     | `16_JavaScript/06_JS_Modern_ES6Plus.md` §Modules; `19_Frontend_Integration/03_Build_Tools_Ecosystem.md` §Tree Shaking | Convert CommonJS (`require`) to ES module           |
| 3   | Generators & Iterators — `function*`, `yield`, custom iterables | `16_JavaScript/06_JS_Modern_ES6Plus.md` §Iterators & Generators                                                       | Implement `range(start, end, step)` as a generator  |
| 4   | WeakMap, WeakRef, FinalizationRegistry — memory management      | `16_JavaScript/06_JS_Modern_ES6Plus.md` §WeakRef & FinalizationRegistry; `16_JavaScript/06_JS_Modern_ES6Plus.md` §Map & Set | Implement a private field pattern using WeakMap |
| 5   | Lab                                                             | —                                                                                                                     | Build a lazy `Pipeline` class using generators      |
| 6–7 | Review all JS topics                                            | `16_JavaScript/08_JS_Deep_Reasoning.md` §Interview Quick-Fire                                                         | Mini quiz: 20 JS tricky questions                   |

---

### UNIT 2 — TypeScript Type System (Weeks 4–5)

**Learning Outcomes:**

- Use generics, conditional types, mapped types, and template literals
- Design type-safe APIs that prevent runtime errors at compile time
- Write `.d.ts` declaration files for untyped JS libraries

**Week 4 — TypeScript Fundamentals**

| Day | Topic                                                                      | Read                                                                                                                              | Do                                                                |
| --- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | `interface` vs `type`, union types, intersection types                     | `17_TypeScript/01_TS_Foundations.md` §Interfaces & Type Aliases; `17_TypeScript/01_TS_Foundations.md` §Union & Intersection Types | Model a `Shape` union type hierarchy                              |
| 2   | Generics: `<T>`, constraints `<T extends Constraint>`, default types       | `17_TypeScript/02_TS_Advanced_Types.md` §Generics Deep Dive; `17_TypeScript/02_TS_Advanced_Types.md` §Generic Constraints         | Implement `Result<T, E>` type (like Rust's Result)                |
| 3   | Utility types: `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record` | `17_TypeScript/02_TS_Advanced_Types.md` §Utility Types                                                                            | Use each utility type in a real scenario                          |
| 4   | Conditional types: `T extends U ? A : B`, `infer` keyword                  | `17_TypeScript/02_TS_Advanced_Types.md` §Conditional Types                                                                        | Implement `UnpackPromise<T>` type                                 |
| 5   | Lab                                                                        | —                                                                                                                                 | Type a fully safe `EventBus<Events>` with per-event type checking |
| 6–7 | Problem Set TS-PS1 — Type System Fundamentals                              | `17_TypeScript/17_PROBLEM_SETS.md` §Problem Set TS-PS1                                                                            | 5 type challenges (type-level puzzles)                            |

**Week 5 — TypeScript Advanced & React Integration**

| Day | Topic                                                       | Read                                                                                                                           | Do                                                                    |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 1   | Mapped types: `{ [K in keyof T]: ... }`                     | `17_TypeScript/02_TS_Advanced_Types.md` §Mapped Types                                                                          | Implement `DeepReadonly<T>`                                           |
| 2   | Template literal types: `"on${Capitalize<string>}"`         | `17_TypeScript/02_TS_Advanced_Types.md` §Template Literal Types                                                                | Model DOM event names with template literals                          |
| 3   | Strict mode: what `strict: true` turns on, and migrating to it | `17_TypeScript/01_TS_Foundations.md` §tsconfig.json; `17_TypeScript/03_TS_Patterns_BestPractices.md` §Migration Strategy    | Turn strict flags on one at a time in a sample codebase and fix each batch of errors; then add `noUncheckedIndexedAccess` yourself (it is not part of `strict`) |
| 4   | Discriminated unions for state machines                     | `17_TypeScript/02_TS_Advanced_Types.md` §Discriminated Unions                                                                  | Model a `LoadingState<T>` discriminated union                         |
| 5   | Lab                                                         | `17_TypeScript/03_TS_Patterns_BestPractices.md` §API Types Pattern; `15_React_Frontend/05_React_TypeScript.md` §Typing Hooks   | Build a type-safe HTTP client with response types                    |
| 6–7 | Problem Set TS-PS2 — Advanced Types, plus declaration files | `17_TypeScript/17_PROBLEM_SETS.md` §Problem Set TS-PS2; `17_TypeScript/03_TS_Patterns_BestPractices.md` §Declaration Files    | 5 advanced type challenges; write a `.d.ts` for a small untyped JS helper |

---

### UNIT 3 — React & State Management (Weeks 6–9)

**Learning Outcomes:**

- Explain React's reconciliation algorithm and why keys matter
- Use all React 18 hooks correctly; understand when NOT to use useEffect
- Design scalable state architecture (local → Zustand → React Query)

**Week 6 — React Fundamentals & Hooks**

| Day | Topic                                                           | Read                                                                                                                                                | Do                                                 |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | JSX, components, props, children; why keys matter               | `15_React_Frontend/01_React_Fundamentals.md` §Part 3: Components; `15_React_Frontend/01_React_Fundamentals.md` §Part 4: Props; `15_React_Frontend/01_React_Fundamentals.md` §Why Keys Matter | Build a `Card` component with slot-based children |
| 2   | `useState`, `useRef`, controlled vs uncontrolled inputs         | `15_React_Frontend/01_React_Fundamentals.md` §Part 5: State; `15_React_Frontend/03_Hooks_Deep_Dive.md` §useRef; `15_React_Frontend/02_Component_Patterns.md` §Pattern 7: Controlled vs Uncontrolled | Build a controlled form with live validation |
| 3   | `useEffect` — when to use it, when NOT to                       | `15_React_Frontend/03_Hooks_Deep_Dive.md` §useEffect; `15_React_Frontend/03_Hooks_Deep_Dive.md` §Trap 4: The Derivative State Anti-Pattern          | Fix 3 misused useEffects (direct vs derived state) |
| 4   | `useCallback`, `useMemo`, `React.memo` — when they help vs hurt | `15_React_Frontend/03_Hooks_Deep_Dive.md` §useMemo & useCallback; `15_React_Frontend/08_React_Performance.md` §Memoization Decision Flowchart        | Profile before and after memoizing a slow list     |
| 5   | Lab                                                             | `15_React_Frontend/10_Custom_Hooks_Library.md` §useDebounce (read after you have tried it yourself)                                                 | Build a `useDebounce(value, delay)` custom hook    |
| 6–7 | Problem Set REACT-PS1 — Hooks & Component Model                 | `15_React_Frontend/15_PROBLEM_SETS.md` §Problem Set REACT-PS1                                                                                        | Hooks quiz + implementation from the set           |

**Week 7 — React Patterns & Context**

| Day | Topic                                                      | Read                                                                                                                             | Do                                                        |
| --- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | `useContext` + `useReducer` — when to use over useState    | `15_React_Frontend/03_Hooks_Deep_Dive.md` §useContext; `15_React_Frontend/03_Hooks_Deep_Dive.md` §useReducer                     | Build a theme toggler with context                        |
| 2   | Compound Components pattern                                | `15_React_Frontend/02_Component_Patterns.md` §Pattern 2: Compound Components                                                     | Build a `Tabs` component using compound pattern           |
| 3   | Render Props and Custom Hooks patterns                     | `15_React_Frontend/02_Component_Patterns.md` §Pattern 3: Render Props; `15_React_Frontend/03_Hooks_Deep_Dive.md` §Custom Hooks    | Extract `useFetch<T>(url)` custom hook                    |
| 4   | React 18: Suspense, `startTransition`, concurrent features | `15_React_Frontend/03_Hooks_Deep_Dive.md` §useTransition; `15_React_Frontend/03_Hooks_Deep_Dive.md` §Suspense                    | Wrap a slow component in Suspense with a skeleton         |
| 5   | Lab                                                        | `15_React_Frontend/10_Custom_Hooks_Library.md` §useLocalStorage (read after you have tried it yourself)                          | Build `useLocalStorage<T>(key, initialValue)` custom hook |
| 6–7 | Problem Set REACT-PS2 — State Architecture & Patterns      | `15_React_Frontend/15_PROBLEM_SETS.md` §Problem Set REACT-PS2                                                                    | Compound component challenge from the set                 |

**Week 8 — Data Fetching & React Query**

| Day | Topic                                                                   | Read                                                                                                                                                                  | Do                                                                   |
| --- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Server state vs client state; client-side fetching patterns (SWR vs React Query) | `15_React_Frontend/04_State_Management.md` §When Do You Need State Management; `15_React_Frontend/04_State_Management.md` §Mixing Client State with Server State; `15_React_Frontend/06_React_Router.md` §Data Fetching Strategies | Compare stale-while-revalidate vs cache-then-network |
| 2   | `useQuery`, `useMutation`, cache invalidation; Zustand for UI state     | `15_React_Frontend/04_State_Management.md` Part 4 (React Query) and Part 5 (Zustand)                                                                                  | Wire up Book list to Spring Boot API; put list filters in a Zustand store |
| 3   | Optimistic updates — update UI before server confirms                   | `15_React_Frontend/04_State_Management.md` Part 4 (React Query); `15_React_Frontend/15_PROBLEM_SETS.md` §Problem Set REACT-PS3                                          | Add optimistic update to a "like" button                             |
| 4   | Error boundaries + fallback UI                                          | `15_React_Frontend/02_Component_Patterns.md` §Pattern 5: Error Boundaries                                                                                             | Wrap the app in an ErrorBoundary                                     |
| 5   | Lab                                                                     | `15_React_Frontend/06_React_Router.md` §API Layer Pattern                                                                                                              | Connect the Library API ([P04](PROJECTS/P04_Library_REST_API.md)) to a React frontend |
| 6–7 | Problem Set REACT-PS3 — Data Fetching & Async State                     | `15_React_Frontend/15_PROBLEM_SETS.md` §Problem Set REACT-PS3                                                                                                          | Data fetching patterns set                                           |

**Week 9 — Performance & Accessibility**

| Day | Topic                                                            | Read                                                                                                                                                         | Do                                          |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| 1   | React DevTools Profiler — identify wasted renders                | `15_React_Frontend/08_React_Performance.md` §Key Optimization Techniques; `19_Frontend_Integration/02_Frontend_Debugging.md` §React DevTools                  | Profile a list rendering 1000 items         |
| 2   | Virtualization — `react-window`, `react-virtuoso`                | `15_React_Frontend/11_Complex_UI_Pages_Patterns.md` §Infinite Scroll with Virtual List                                                                        | Virtualize the 1000-item list               |
| 3   | Code splitting — `React.lazy`, `Suspense`, route-based splitting | `19_Frontend_Integration/03_Build_Tools_Ecosystem.md` §Code Splitting; `15_React_Frontend/08_React_Performance.md` §Key Optimization Techniques               | Split 3 route components lazily             |
| 4   | Accessibility: ARIA roles, keyboard navigation, focus management | `19_Frontend_Integration/07_Web_Accessibility_A11y.md` §ARIA; `19_Frontend_Integration/07_Web_Accessibility_A11y.md` §Keyboard Navigation; `19_Frontend_Integration/07_Web_Accessibility_A11y.md` §Focus Management in SPAs | Audit a form for WCAG 2.1 AA compliance |
| 5   | Lab                                                              | [P08 spec](PROJECTS/P08_React_Dashboard.md)                                                                                                                   | **Mini-Project P08 Start:** React Dashboard |
| 6–7 | Problem Set REACT-PS4 — Performance & Accessibility              | `15_React_Frontend/15_PROBLEM_SETS.md` §Problem Set REACT-PS4                                                                                                  | Performance optimization challenge          |

---

### UNIT 4 — CSS Architecture & Build Tools (Week 10)

**Week 10 — CSS & Build Tooling**

| Day | Topic                                                          | Read                                                                                                                                        | Do                                                  |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | CSS Box Model, Flexbox, Grid — when to use each                | `18_CSS_Complete/01_CSS_Foundations.md` §The Box Model; `18_CSS_Complete/02_CSS_Layout_Systems.md` §Flex vs Grid                            | Implement a 3-column dashboard layout with CSS Grid |
| 2   | CSS Variables, `:root`, theming, dark mode                     | `18_CSS_Complete/04_CSS_Modern_Architecture.md` §CSS Custom Properties; `18_CSS_Complete/04_CSS_Modern_Architecture.md` §Dark Mode with Custom Properties | Build a light/dark toggle with CSS variables |
| 3   | CSS animations, transitions, `will-change` performance         | `18_CSS_Complete/03_CSS_Responsive_Animations.md` §CSS Transitions; `18_CSS_Complete/03_CSS_Responsive_Animations.md` §Performance Checklist for Animations; `18_CSS_Complete/04_CSS_Modern_Architecture.md` §Toast Notification | Add a slide-in animation to a notification |
| 4   | Vite: hot module replacement, tree shaking, build optimization | `19_Frontend_Integration/03_Build_Tools_Ecosystem.md` §Vite Configuration Explained; `19_Frontend_Integration/03_Build_Tools_Ecosystem.md` §Tree Shaking | Analyze bundle size before/after tree shaking |
| 5   | Lab                                                            | —                                                                                                                                           | Complete P08 React Dashboard with full CSS          |
| 6–7 | Frontend integration review: how the browser turns your code into pixels | `16_JavaScript/09_Browser_Internals_Rendering.md` §The Critical Rendering Path; `19_Frontend_Integration/06_Web_Performance_CoreWebVitals.md` §Core Web Vitals | CSS-PS1 in `18_CSS_Complete/18_PROBLEM_SETS.md` and FE-PS2 in `19_Frontend_Integration/19_PROBLEM_SETS.md` |

---

### UNIT 5 — DevOps & CI/CD (Weeks 11–12)

**Learning Outcomes:**

- Build Docker images; design multi-container setups with Compose
- Set up a GitHub Actions pipeline: lint → test → build → deploy
- Understand Kubernetes concepts (pods, services, deployments)

> **Where this unit lives:** the working-engineer path is `13_Developer_Essentials/03_Docker_Containers.md` and `13_Developer_Essentials/04_CICD_Pipelines.md` for the hands-on recipe, then `22_DevOps` chapters 17 (Docker), 18 (Kubernetes) and 19 (CI/CD) for the depth behind it. Chapter 16 (`22_DevOps/16_Linux_Administration.md`) is useful background if the Linux shell inside a container is unfamiliar.
>
> **In progress, not scheduled:** [`22_DevOps/internals/README.md`](../22_DevOps/internals/README.md) (a kernel-level "how it actually works" series) and [`22_DevOps/jenkins/README.md`](../22_DevOps/jenkins/README.md) (a Jenkins track) are still being written. Their chapters are not part of this plan yet; revisit the READMEs after the semester.

**Week 11 — Docker & Containerization**

| Day | Topic                                                          | Read                                                                                                                                                  | Do                                                               |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Docker fundamentals: images, containers, layers, registry      | `13_Developer_Essentials/03_Docker_Containers.md` §Images vs Containers; `13_Developer_Essentials/03_Docker_Containers.md` §Layers                     | Dockerize the Library REST API ([P04](PROJECTS/P04_Library_REST_API.md)) |
| 2   | `Dockerfile` best practices: multi-stage builds, .dockerignore | `13_Developer_Essentials/03_Docker_Containers.md` §Dockerfile for Spring Boot Application; `13_Developer_Essentials/03_Docker_Containers.md` §Dockerfile Best Practices; `22_DevOps/17_Docker_Complete.md` §Real-World Multi-Stage Patterns | Write a multi-stage Dockerfile for Spring Boot |
| 3   | Docker Compose: multi-container (API + DB + Redis)             | `13_Developer_Essentials/03_Docker_Containers.md` §Level 3: Docker Compose; `22_DevOps/17_Docker_Complete.md` Part 5 (Docker Compose)                | Run P04 + PostgreSQL with Compose                                |
| 4   | Docker networking: bridge, host, overlay basics                | `22_DevOps/17_Docker_Complete.md` §The Bridge Network; `22_DevOps/17_Docker_Complete.md` §Host Network                                                 | Explain: why can container A reach container B by name?          |
| 5   | Lab                                                            | [P09 spec](PROJECTS/P09_CICD_Pipeline.md)                                                                                                             | **Mini-Project P09:** Dockerize + Compose the full Library stack |
| 6–7 | Problem Set DEVOPS-PS1 — Docker & Containerization             | `22_DevOps/22_PROBLEM_SETS.md` §Problem Set DEVOPS-PS1                                                                                                | Docker + networking set                                          |

**Week 12 — CI/CD & GitHub Actions**

| Day | Topic                                                | Read                                                                                                                              | Do                                                |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | GitHub Actions: workflows, triggers, jobs, steps     | `13_Developer_Essentials/04_CICD_Pipelines.md` §Basic Pipeline; `13_Developer_Essentials/04_CICD_Pipelines.md` §Pipeline Triggers; `22_DevOps/19_CICD_Pipelines.md` Part 2 (GitHub Actions) | Write a workflow: on push → run `mvn test` |
| 2   | Matrix builds: test across Java 17/21, multiple OS   | `13_Developer_Essentials/04_CICD_Pipelines.md` §Matrix Strategy                                                                   | Add matrix strategy to the workflow               |
| 3   | Docker publish in CI: build + push to Docker Hub     | `13_Developer_Essentials/04_CICD_Pipelines.md` §Full Pipeline                                                                     | Add a build-and-push job                          |
| 4   | Secrets management, environment variables in Actions | `13_Developer_Essentials/04_CICD_Pipelines.md` §Environment Variables & Secrets; `13_Developer_Essentials/04_CICD_Pipelines.md` §Branch Protection Rules | Store DB credentials as repo secrets    |
| 5   | Lab                                                  | [P09 spec](PROJECTS/P09_CICD_Pipeline.md)                                                                                         | Complete P09: full CI/CD pipeline for Library API |
| 6–7 | Kubernetes concepts (pods, deployments, services); Problem Set DEVOPS-PS2 | `22_DevOps/18_Kubernetes_Complete.md` Part 2 (Pods, Deployments, Services); `22_DevOps/22_PROBLEM_SETS.md` §Problem Set DEVOPS-PS2 | Sketch the Library stack as a Deployment + Service; then the pipeline design challenge |

---

### UNIT 6 — Java Concurrency (Weeks 13–14)

**Learning Outcomes:**

- Design thread-safe classes using `synchronized`, `ReentrantLock`, `Atomic*`, and `volatile`
- Use `ExecutorService`, `CompletableFuture`, and `ForkJoinPool` correctly
- Identify and fix data races, deadlocks, and starvation

**Week 13 — Java Concurrency Fundamentals**

| Day | Topic                                                | Read                                                                                                                                          | Do                                                       |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | Thread creation, lifecycle, `Runnable` vs `Callable` | `07_Modern_Java/Ch15_Concurrency_Core.md` §Creating Threads; `07_Modern_Java/Ch15_Concurrency_Core.md` §Thread Lifecycle                       | Create 5 threads that race to update a shared counter    |
| 2   | `synchronized` — mutual exclusion, object monitor    | `07_Modern_Java/Ch15_Concurrency_Core.md` §The Race Condition; `07_Modern_Java/Ch15_Concurrency_Core.md` §The Basic Lock                      | Fix the counter race with `synchronized`                 |
| 3   | `volatile` — visibility guarantee                    | `07_Modern_Java/Ch18_JMM_GC_Deep.md` §Happens-Before; `07_Modern_Java/Ch18_JMM_GC_Deep.md` §volatile                                          | Fix a visibility bug using `volatile`                    |
| 4   | `AtomicInteger`, `AtomicReference`, CAS operations   | `07_Modern_Java/Ch15_Concurrency_Core.md` Part 5 (Atomic Classes); `07_Modern_Java/Ch16_Concurrency_Advanced.md` §The Hardware Reality       | Compare `synchronized` vs `AtomicInteger` for throughput |
| 5   | Lab                                                  | `07_Modern_Java/Ch15_Concurrency_Core.md` §Thread Communication; `07_Modern_Java/Ch15_Concurrency_Core.md` §The Modern Way                    | Implement a thread-safe `BoundedBlockingQueue<T>`        |
| 6–7 | Problem Set JAVA-PS3 — Concurrency Bugs & Fixes      | `07_Modern_Java/07_CONCURRENCY_PROBLEM_SETS.md` §Problem Set JAVA-PS3                                                                         | Part A: identify the bug and fix it                      |

**Week 14 — ExecutorService & CompletableFuture**

| Day | Topic                                                             | Read                                                                                                                                  | Do                                                         |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | `ExecutorService` — thread pools, `Executors` factory             | `07_Modern_Java/Ch16_Concurrency_Advanced.md` §Thread Pool Types; `07_Modern_Java/Ch16_Concurrency_Advanced.md` §The Formula          | Compare Fixed vs Cached vs Work-Stealing pools             |
| 2   | `CompletableFuture` — async pipelines, `thenApply`, `thenCompose` | `07_Modern_Java/Ch16_Concurrency_Advanced.md` Part 9 (CompletableFuture); `07_Modern_Java/Ch16_Concurrency_Advanced.md` §Combining Futures; `07_Modern_Java/Ch16_Concurrency_Advanced.md` §Error Handling | Rewrite a blocking sequential call to parallel CF pipeline |
| 3   | Deadlock detection and prevention strategies                      | `07_Modern_Java/Ch17_Concurrency_Synchronizers.md` §Livelock vs Deadlock vs Starvation; `07_Modern_Java/Ch17_Concurrency_Synchronizers.md` §The 4 Conditions for Deadlock | Trace a deadlock in two-lock scenario; apply lock ordering |
| 4   | `ReentrantReadWriteLock` — read-heavy optimization                | `07_Modern_Java/Ch17_Concurrency_Synchronizers.md` §ReadWriteLock                                                                     | Implement a thread-safe LRU cache using RWLock             |
| 5   | Lab                                                               | [P07 spec](PROJECTS/P07_Concurrent_Task_Queue.md)                                                                                     | **Mini-Project P07:** Concurrent Task Queue                |
| 6–7 | Problem Set JAVA-PS3 (continued)                                  | `07_Modern_Java/07_CONCURRENCY_PROBLEM_SETS.md` §Problem Set JAVA-PS3                                                                 | CompletableFuture chaining challenge                       |

---

### UNIT 7 — Semester 3 Capstone (Weeks 15–16)

**🏆 Capstone 3: "DevBoard" — Full-Stack Application from Scratch**

**Estimated time:** 30 hours  
→ Full spec: [`00_CURRICULUM/PROJECTS/CAP03_FullStack.md`](PROJECTS/CAP03_FullStack.md)

Build a developer task-board application (projects, tasks on a Kanban board, time tracking, analytics):

- **Backend:** Spring Boot 3 REST API + JPA + PostgreSQL, JWT auth, Docker
- **Frontend:** React 18 + TypeScript (strict, zero `any`) + React Query for all API calls + Zustand for UI state + a drag-and-drop Kanban board and `recharts` analytics
- **Auth:** JWT issued by the backend; the spec's failure-scenarios table recommends an `httpOnly` cookie over `localStorage`
- **CI/CD:** GitHub Actions pipeline: test → build → push Docker image; Docker Compose runs frontend + backend + PostgreSQL
- **Tests:** backend 80%+ coverage with JUnit 5 + MockMvc. Start from `07_Modern_Java/Ch59_SB_Testing_Fundamentals.md` §Controller Layer Testing. Frontend tests are not an acceptance criterion in the spec; if you add them, start from `15_React_Frontend/07_React_Testing.md` §React Testing Library

---

[← Semester 2](SEMESTER_2_GUIDE.md) | [Back to Overview](CURRICULUM_OVERVIEW.md) | [Semester 4 →](SEMESTER_4_GUIDE.md)
