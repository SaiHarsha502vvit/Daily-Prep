# 📋 Exam Bank — Midterms & Finals (Semesters 1–4)

> **Exams in this bank (six, covering all four semesters):** Semester 1 — Midterm 1 (DSA). Semester 2 — Final 1 (Systems & Design). Semester 3 — Midterm 2 (Full-Stack, Week 8) and Final 2 (Full-Stack & DevOps, Week 16). Semester 4 — Midterm 3 (Python/ML & Testing Fundamentals, Week 8) and Final 3 (SDET & Enterprise Systems, Week 16). Every question's answer key cites the repo chapter it comes from; answer keys for Final 2, Midterm 3 and Final 3 also state which answers were verified by running code.
>
> **Format:** University-style. 90 minutes each exam. Open notes permitted (repo only). No internet.  
> **Grading:** Each question has a point value. Full answers require explanation — just the code is not enough.  
> **Instructions:** Create `JavaSolutions/exams/` (it does not exist yet) and write your answers there — one file per exam.

---

## 🎓 MIDTERM 1 — Data Structures & Algorithms (Semester 1, Week 8)

**Total: 100 points | Time: 90 min**

---

### Section A — Theory (40 points)

**Q1 (10 pts).** Explain why `HashMap` has O(1) average-case lookup but can degrade to O(n). What two conditions cause worst-case? What does Java 8 do to mitigate it?

**Q2 (10 pts).** Trace BFS on this graph starting from node A. Show the queue state after each step. What is the shortest path from A to F?

```
A -- B -- E
|         |
C -- D -- F
```

**Q3 (10 pts).** Why does Dynamic Programming require "optimal substructure" and "overlapping subproblems"? Give one example of a problem that has optimal substructure but NOT overlapping subproblems (therefore DP is wrong for it).

**Q4 (10 pts).** Compare: Merge Sort vs QuickSort. Under what specific input does QuickSort degrade to O(n²)? What pivot strategy prevents this?

<details><summary>Answer Key</summary>

**Q1:** O(n) when: (1) all keys hash to the same bucket (hash collision attack — e.g., all Strings hash to 0 because `hashCode()` uses content and attacker crafts equal-hash inputs). (2) table load factor exceeds threshold but resize hasn't triggered. Java 8: when a bucket's chain reaches 8 nodes, it converts to a Red-Black tree → O(log n) worst-case per bucket. Resize at 75% load keeps average < 1 element per bucket.

**Q2:** Queue: [A] → dequeue A, enqueue B,C → [B,C] → dequeue B, enqueue E → [C,E] → dequeue C, enqueue D → [E,D] → dequeue E, enqueue F → [D,F] → dequeue D (F already enqueued/visited) → [F] → dequeue F → DONE. Shortest path A→F: A→B→E→F (length 3) OR A→C→D→F (length 3).

**Q3:** Optimal substructure: the globally optimal solution contains optimal solutions to sub-problems. Overlapping: same sub-problems are solved multiple times. Counter-example: Merge Sort has optimal substructure (correctly merge-sorted halves = correctly sorted whole) but NO overlapping subproblems — each sub-array is distinct. Therefore Divide & Conquer (not DP) is correct. Activity Selection (greedy) also has optimal substructure without overlapping sub-problems.

**Q4:** QuickSort degrades to O(n²) when pivot always = min or max element (sorted/reverse-sorted input with naive first-element pivot). Each partition produces one sub-array of size 0 and one of size n-1. Fix: randomized pivot, or median-of-three (compare first/middle/last, use median). Merge Sort: always O(n log n) but requires O(n) extra space. QuickSort: O(log n) space (stack) average, cache-friendly, faster in practice.

</details>

---

### Section B — Implementation (40 points)

**Q5 (20 pts).** Implement `LRUCache<K,V>` supporting `get(key)` and `put(key, value)` — both O(1). Evicts the least recently used item when capacity is exceeded.

```java
// skeleton:
class LRUCache<K, V> {
    private final int capacity;
    // Hint: use LinkedHashMap with accessOrder=true
    // OR use HashMap + custom doubly linked list

    public LRUCache(int capacity) { /* TODO */ }
    public V get(K key) { /* TODO: return null if not found */ }
    public void put(K key, V value) { /* TODO: evict LRU if full */ }
}
```

<details><summary>Model Answer</summary>

```java
class LRUCache<K, V> {
    private final int capacity;
    // LinkedHashMap(capacity, loadFactor, accessOrder=true):
    // accessOrder=true → iterates in access order (LRU first)
    private final LinkedHashMap<K, V> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
                return size() > capacity; // auto-evict when over capacity
            }
        };
    }

    public synchronized V get(K key) { return map.getOrDefault(key, null); }

    public synchronized void put(K key, V value) { map.put(key, value); }
}
```

**Alternative (explicit doubly linked list):** HashMap maps key → Node. DLL maintains order: head = LRU, tail = MRU. `get`: move accessed node to tail. `put`: add to tail; if full, remove head. O(1) for both because HashMap lookup + DLL pointer operations are O(1).

</details>

---

**Q6 (20 pts).** Given a binary tree, return the level-order traversal as a `List<List<Integer>>` (each inner list = one level).

```java
// Input:    3
//          / \
//         9  20
//            / \
//           15   7
// Output: [[3], [9, 20], [15, 7]]

List<List<Integer>> levelOrder(TreeNode root) {
    // TODO: BFS with level-tracking (size snapshot pattern)
}
```

<details><summary>Model Answer</summary>

```java
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size(); // snapshot — queue grows as we add children
        List<Integer> level = new ArrayList<>();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left  != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}
// Time: O(n), Space: O(n) — queue holds at most one full level at a time
```

</details>

---

### Section C — Design (20 points)

**Q7 (20 pts).** Design a task queue system that:

- Processes tasks with priorities (HIGH/MEDIUM/LOW)
- Guarantees HIGH tasks are processed before MEDIUM, MEDIUM before LOW
- Supports concurrent producers (multiple threads submitting tasks)

Name the data structure. Explain your design. Write the Java class signature and the key method bodies (10–15 lines max).

<details><summary>Model Answer</summary>

**Data structure:** `PriorityBlockingQueue<Task>` — thread-safe, priority-ordered, blocking.

```java
enum Priority { HIGH, MEDIUM, LOW }
record Task(String id, Priority priority, Runnable work)
    implements Comparable<Task> {
    public int compareTo(Task other) {
        return this.priority.compareTo(other.priority); // HIGH < MEDIUM < LOW by ordinal
    }
}

class PriorityTaskQueue {
    private final PriorityBlockingQueue<Task> queue = new PriorityBlockingQueue<>();
    private final ExecutorService workers;

    PriorityTaskQueue(int workerCount) {
        workers = Executors.newFixedThreadPool(workerCount);
        for (int i = 0; i < workerCount; i++) {
            workers.submit(() -> {
                while (!Thread.interrupted()) {
                    try { queue.take().work().run(); } // blocks when empty
                    catch (InterruptedException e) { break; }
                }
            });
        }
    }

    void submit(Task task) { queue.offer(task); } // thread-safe
}
```

</details>

---

## 🎓 FINAL EXAM 1 — Systems & Design (Semester 2, Week 16)

**Total: 100 points | Time: 90 min**

---

### Section A — Theory (30 points)

**Q1 (10 pts).** Your Spring Boot service has a method annotated `@Transactional`. A developer calls it from another method IN THE SAME BEAN without going through the proxy. Does the transaction start? Explain exactly why using Spring's AOP proxy mechanism.

**Q2 (10 pts).** Explain the N+1 query problem. Given this JPA code, write the SQL it generates and write the fix:

```java
// Problem code:
List<Order> orders = orderRepo.findAll();
for (Order order : orders) {
    System.out.println(order.getCustomer().getName()); // N queries!
}
```

**Q3 (10 pts).** What is the CAP theorem? A social media "likes" counter uses eventual consistency. A bank "account balance" uses strong consistency. Explain WHY each made that choice in terms of CAP trade-offs.

<details><summary>Answer Key</summary>

**Q1:** Spring `@Transactional` works via AOP proxy — a wrapper class generated at runtime (CGLIB). The transaction begins when the PROXY intercepts the call. When method A (in the same bean) calls method B directly, it calls `this.methodB()` — bypassing the proxy entirely. `this` is the real bean, not the proxy. No interception = no transaction. Fix: inject the service into itself (`@Autowired ApplicationContext`) and call via `context.getBean(MyService.class).methodB()`, or extract methodB into a separate Spring bean.

**Q2:** `findAll()` = 1 SQL: `SELECT * FROM orders` (returns 100 orders). Then each `order.getCustomer()` triggers 1 SQL: `SELECT * FROM customers WHERE id = ?` → 100 additional queries = 101 total. Fix: `@EntityGraph(attributePaths = "customer")` on the repository method, or JPQL `JOIN FETCH o.customer`. This generates 1 SQL with a JOIN.

**Q3:** CAP: Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (system works despite network splits). You can only guarantee 2 of 3 during a partition. Likes counter: choose AP — serve possibly stale like count (availability matters, slight staleness acceptable). Bank balance: choose CP — reject the request if nodes can't agree (consistency is legally mandatory, brief unavailability acceptable over showing wrong balance).

</details>

---

### Section B — Implementation (50 points)

**Q4 (25 pts).** Design the entity model for a hotel booking system. Identify: aggregate roots, value objects, and domain invariants. Then write the Java class skeletons for `Reservation` (aggregate root) and `DateRange` (value object). Include at least 2 domain methods on `Reservation`.

**Q5 (25 pts).** Write a Spring Boot REST controller for `GET /api/books` with:

- Optional query params: `?author=Alice&genre=fiction&page=0&size=20`
- Returns `Page<BookDto>` (JPA Pageable)
- Proper HTTP semantics (200, 400, 404)
- MockMvc test for: (a) successful search, (b) invalid page parameter

---

### Section C — Architecture (20 points)

**Q6 (20 pts).** You're asked to design a notification system for an e-commerce platform. Users must receive: order confirmations (email), shipping updates (SMS + push), and promotional offers (email only). New notification types will be added every quarter.

Draw the class diagram (text format). Apply at least 2 GoF patterns. Explain: what happens when a new notification type "WhatsApp" is added? How many files change?

<details><summary>Model Answer Summary</summary>

**Patterns:** Strategy (each channel: EmailStrategy, SMSStrategy, PushStrategy) + Observer (events trigger notifications) + Factory (NotificationFactory creates the right strategies for each event type).

```
NotificationService
  ├── EventBus (Observer)
  └── NotificationFactory
        ├── EmailChannel (Strategy)
        ├── SMSChannel (Strategy)
        └── PushChannel (Strategy)

OrderConfirmationEvent → [EmailChannel]
ShippingUpdateEvent    → [SMSChannel, PushChannel]
PromoOfferEvent        → [EmailChannel]
```

**Adding WhatsApp:** Add `WhatsAppChannel implements NotificationChannel`. Register in `NotificationFactory`. Zero changes to `NotificationService` or event classes. Open-Closed Principle maintained.

</details>

---

## 🎓 MIDTERM 2 — Full-Stack (Semester 3, Week 8)

**Total: 100 points | Time: 90 min**

---

### Section A — JavaScript/TypeScript (40 points)

**Q1 (10 pts).** What is the output? Explain each line.

```javascript
const p1 = new Promise((resolve) => {
  setTimeout(() => resolve("A"), 100);
});
const p2 = new Promise((resolve) => {
  setTimeout(() => resolve("B"), 50);
});
const p3 = Promise.reject("C");

Promise.allSettled([p1, p2, p3]).then((results) => {
  results.forEach((r) => console.log(r.status, r.value ?? r.reason));
});
```

**Q2 (10 pts).** Write a TypeScript type `DeepPartial<T>` that makes ALL nested properties optional (not just top level).

**Q3 (20 pts).** A React component fetches user data and updates a chart whenever the user changes. Identify ALL bugs and fix them:

```tsx
function UserChart({ userId }) {
  const [data, setData] = useState([]);

  useEffect(async () => {
    const res = await fetch(`/api/users/${userId}/stats`);
    setData(await res.json());
  }); // ← missing deps array

  const processedData = data.map((item) => ({
    ...item,
    value: item.raw * 1.15,
  }));

  return <Chart data={processedData} />;
}
```

---

### Section B — React Architecture (40 points)

**Q4 (20 pts).** Build a `useFetch<T>(url: string)` custom hook that:

- Returns `{ data: T | null, loading: boolean, error: Error | null }`
- Handles race conditions (URL changes before previous fetch completes)
- Aborts the fetch on component unmount

**Q5 (20 pts).** Explain the difference between these two data fetching approaches and when to use each:

```tsx
// Approach A:
const { data } = useQuery({ queryKey: ["user", id], queryFn: fetchUser });

// Approach B:
const [user, setUser] = useState(null);
useEffect(() => {
  fetchUser(id).then(setUser);
}, [id]);
```

---

### Section C — DevOps (20 points)

**Q6 (20 pts).** Write a `Dockerfile` for a Node.js + React (Vite) app that:

- Builds the static assets in a build stage
- Serves them via Nginx in the final stage
- Final image must be < 50MB

```dockerfile
# Stage 1: Build — complete this
FROM node:20-alpine AS build
WORKDIR /app
# TODO: efficient layer caching for npm dependencies
# TODO: build the app

# Stage 2: Serve — complete this
FROM nginx:alpine
# TODO: copy built assets to nginx's serve directory
# TODO: custom nginx.conf for SPA routing (all routes → index.html)
EXPOSE 80
```

<details><summary>Model Answer</summary>

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false  # install all deps including devDeps
COPY . .
RUN npm run build  # outputs to /app/dist

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf — SPA routing
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # All unknown paths → index.html (React Router handles routing)
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

**Why < 50MB:** `nginx:alpine` base = ~5MB. Built React app ≈ 5–20MB. Total ≈ 10–25MB. No Node.js runtime in final image.

</details>

---

## 🎓 FINAL EXAM 2 — Full-Stack & DevOps (Semester 3, Week 16)

**Total: 100 points | Time: 90 min**

> **Scope:** everything `SEMESTER_3_GUIDE.md` teaches in Units 1–5 and the Capstone 3 brief (JS runtime & async, TypeScript types, React state & performance, CSS layout, Docker/Compose, CI/CD). Java concurrency (Unit 6) is covered by the JAVA-PS3 problem sets, not by this paper.

---

### Section A — JavaScript & TypeScript (30 points)

**Q1 (10 pts).** Give the exact order in which the letters are printed (Node.js). Then state, in terms of the microtask and macrotask queues, why `B` prints before `E` even though `B`'s timer was registered first and `E`'s timer was registered later _by the same `0` ms delay_ — and why `D` prints before `F`.

```javascript
console.log("A");

setTimeout(() => console.log("B"), 0);

async function load() {
  console.log("C");
  await null;
  console.log("D");
  await new Promise((r) => setTimeout(r, 0));
  console.log("E");
}

load();

Promise.resolve()
  .then(() => console.log("F"))
  .then(() => console.log("G"));

queueMicrotask(() => console.log("H"));

console.log("I");
```

**Q2 (10 pts).** DevBoard's "import tasks" button calls `saveAll`. Users report that the toast says `saved 0 of 3` even though two tasks do appear a moment later, and that in Node (the SSR/BFF layer) the process sometimes dies with an uncaught `HTTP 422`. (a) Explain both symptoms precisely. (b) Why does the `try/catch` not help? (c) Rewrite `saveAll` so it reports the true count _and_ names the failures, without crashing.

```javascript
const saved = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// stand-in for POST /api/projects/{id}/tasks — the server rejects task 2
async function saveTask(task) {
  await sleep(10);
  if (task.id === 2) throw new Error("HTTP 422");
  saved.push(task.id);
}

async function saveAll(tasks) {
  try {
    tasks.forEach(async (t) => {
      await saveTask(t);
    });
    return `saved ${saved.length} of ${tasks.length}`;
  } catch (e) {
    return "failed: " + e.message;
  }
}

saveAll([{ id: 1 }, { id: 2 }, { id: 3 }]).then(console.log);
```

**Q3 (10 pts).** All of this file is compiled with `"strict": true` (and nothing else extra). (a) For each marked line say **error** or **OK**, and for every error give the reason (6 pts). (b) A teammate adds a fourth variant `{ kind: "assigned"; taskId: number; userId: number }` to `BoardEvent` and changes nothing else. What does the compiler do, and on which line? Why is that useful? (4 pts)

```typescript
type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

type BoardEvent =
  | { kind: "moved"; taskId: number; to: TaskStatus }
  | { kind: "renamed"; taskId: number; title: string }
  | { kind: "deleted"; taskId: number };

function assertNever(x: never): never {
  throw new Error("unhandled: " + JSON.stringify(x));
}

function describe(e: BoardEvent): string {
  switch (e.kind) {
    case "moved":
      return `task ${e.taskId} -> ${e.to}`;
    case "renamed":
      return `task ${e.taskId} is now "${e.title}"`;
    case "deleted":
      return `task ${e.taskId} removed`;
    default:
      return assertNever(e);                              // (b) matters here
  }
}

const ev: BoardEvent = { kind: "moved", taskId: 1, to: "DONE" };
console.log(ev.title);                                    // L1
const bad: BoardEvent = { kind: "moved", taskId: 2, to: "ARCHIVED" }; // L2

function firstTitle(titles: string[]) {
  const t = titles[0];
  return t.toUpperCase();                                 // L3
}
const maybe: Record<string, number> = {};
const n: number = maybe["x"];                             // L4
let s: string = null;                                     // L5

type ToArray<T> = T extends unknown ? T[] : never;
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;
const r1: ToArray<string | number> = [1, "a"];            // L6
const r2: ToArrayNonDist<string | number> = [1, "a"];     // L7
```

<details><summary>Answer Key</summary>

**Q1 (6 pts order, 4 pts reasoning):** `A C I D F H G B E`

Trace (sources: `16_JavaScript/04_JS_Async_Promises.md` §1 The Event Loop and §6 Microtasks vs Macrotasks):

1. Synchronous phase: `A`, then `setTimeout` only _registers_ `B`; `load()` runs synchronously up to its first `await` and prints `C`; `await null` queues the rest of `load` as a microtask; `.then(F)` and `queueMicrotask(H)` queue two more microtasks; `I` prints. Output so far: `A C I`.
2. Stack empty, the loop drains the **whole** microtask queue before touching any macrotask. Queue order is `[load-continuation, F, H]`: `D` prints; `load` then hits `await new Promise(setTimeout…)` and registers its timer (macrotask, behind `B`'s timer); `F` prints and queues `G`; `H` prints; `G` prints. Output: `D F H G`.
3. Microtasks empty → one macrotask: `B`. Next macrotask: the second timer resolves the promise, whose continuation is a microtask that prints `E`.

`B` before `E` because both are macrotasks and the queue is FIFO: `B`'s timer was registered during the synchronous phase, `E`'s timer was only registered later, from inside a microtask. `D` before `F` because `await null` queued `load`'s continuation as a microtask _before_ `.then(F)` was attached (FIFO within the microtask queue). Award 2 pts for microtasks-before-macrotasks, 2 pts for FIFO within each queue.

**Q2:** Run in Node 22: `saveAll` returns `saved 0 of 3`; ~10 ms later `saved` is `[1, 3]`; the 422 surfaces as an unhandled rejection.

(a) `forEach` ignores the promises its async callbacks return — it is "pure fire-and-forget" (`16_JavaScript/04_JS_Async_Promises.md` §Reality Check). The three `saveTask` calls start, but `saveAll` reaches `return` synchronously, so `saved.length` is still `0`. The saves finish later, which is why the tasks "appear a moment later". Task 2's rejection is a promise nobody awaits or `.catch`es → unhandled rejection; the chapter notes unhandled rejections crash Node (confirmed on Node 22: the process dies with `Error: HTTP 422` unless an `unhandledRejection` handler exists).

(b) `try/catch` only catches errors thrown (or rejections `await`ed) _inside_ its block while it is still executing. The rejection happens ~10 ms later inside a different callback chain, long after `saveAll` has returned (chapter §4 Challenge 2: Bug Hunt — "without `await`, the try/catch CANNOT catch it").

(c)

```javascript
async function saveAll(tasks) {
  const results = await Promise.allSettled(tasks.map((t) => saveTask(t)));
  const failed = results.filter((r) => r.status === "rejected");
  return (
    `saved ${results.length - failed.length} of ${tasks.length}` +
    (failed.length ? `; failed: ${failed.map((r) => r.reason.message).join(",")}` : "")
  );
}
// -> "saved 2 of 3; failed: HTTP 422"   (verified)
```

`map` returns the array of promises (all three start in parallel, total time ≈ 10 ms, not 30); `allSettled` never rejects and waits for every one (chapter §3 Promise Static Methods). `Promise.all` is also acceptable if the answer explains it fail-fast rejects on the first error while the other saves continue unobserved (so the count would be wrong) — give 3/4 for that on part (c). A sequential `for…of` + `await` loop is acceptable but serialises the requests (≈ 30 ms).

**Q3:** Compiled with `tsc --strict` (TypeScript 5.9.3):

| Line | Result | Reason |
| ---- | ------ | ------ |
| L1 `ev.title` | **error** TS2339 | `ev` is _narrowed by the assignment_ to the `"moved"` member (declared type is the union, but the initialiser narrows it); `moved` has no `title`. Even on the plain union the access would fail, because `title` does not exist on every member. |
| L2 `to: "ARCHIVED"` | **error** TS2322 | `"ARCHIVED"` is not in the `TaskStatus` literal union. |
| L3 `t.toUpperCase()` | **OK** | `titles[0]` is typed `string`; `strict` does **not** include `noUncheckedIndexedAccess`. |
| L4 `maybe["x"]` | **OK** | Index signature lookup is typed `number` for the same reason. (With `--noUncheckedIndexedAccess` both L3 and L4 become errors: `'t' is possibly 'undefined'`, `number | undefined` not assignable to `number`.) |
| L5 `let s: string = null` | **error** TS2322 | `strictNullChecks` (part of `strict`): `null` is not assignable to `string`. |
| L6 `ToArray<string \| number> = [1, "a"]` | **error** TS2322 | `ToArray` is a _distributive_ conditional type (bare `T`): it becomes `string[] \| number[]`; `(string \| number)[]` is not assignable to either. |
| L7 `ToArrayNonDist<…> = [1, "a"]` | **OK** | `[T] extends [unknown]` is not a bare type parameter, so no distribution: the result is `(string \| number)[]`. |

Marking: 1 pt per line correctly classified; withhold the point if the reason is missing for an error line (L3/L4 need the `noUncheckedIndexedAccess` remark for full credit on those two lines combined).

(b) Compiler error **TS2345** on the `assertNever(e)` line: `Argument of type '{ kind: "assigned"; taskId: number; userId: number; }' is not assignable to parameter of type 'never'`. After the three `case`s, `e` is narrowed to the one variant not handled; `assertNever` demands `never`, so the build breaks at exactly the switch that forgot the new variant ("adding a union member breaks every switch that must handle it — the type system as change-impact analysis", `17_TypeScript/03_TS_Patterns_BestPractices.md` §Reality Check). The `default` arm also turns a would-be silent bug into a loud runtime throw if untyped data (a JSON payload with an unknown `kind`) reaches the switch. (Verified: with the `default` arm removed, `strict` still reports TS2366 "Function lacks ending return statement" for a function that declares `: string` — so the arm's added value is the precise error at the right place plus the runtime guard.) Sources: `17_TypeScript/01_TS_Foundations.md` §5 Union & Intersection Types, `17_TypeScript/02_TS_Advanced_Types.md` §4 Conditional Types and §6 Discriminated Unions, `17_TypeScript/04_TS_Deep_Reasoning.md` (index-access blind spot), `SEMESTER_3_GUIDE.md` Week 5 Day 3.

</details>

---

### Section B — React & CSS (25 points)

**Q4 (10 pts).** In the component below, (a) after the user clicks **Add 3** once, what number does `count` show, and why? (b) After the page has been open for one second, what does `ticks` show, and why? (c) Fix both bugs with the smallest change.

```jsx
function Stepper() {
  const [count, setCount] = useState(0);
  const [ticks, setTicks] = useState(0);

  function addThree() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  useEffect(() => {
    const id = setInterval(() => {
      setTicks(ticks + 1);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <button onClick={addThree}>Add 3</button>
      <span>{count}</span> <span>{ticks}</span>
    </div>
  );
}
```

**Q5 (8 pts).** `Chart` is wrapped in `React.memo`, yet the Profiler shows it re-rendering on every keystroke in the search box. (a) How many times has `Chart` rendered after mount plus three keystrokes? (2 pts) (b) Why does `memo` not help here? (3 pts) (c) Give two minimal fixes. (3 pts)

```jsx
const Chart = React.memo(function Chart({ options, onPick }) {
  /* expensive render */
});

function Panel() {
  const [query, setQuery] = useState("");
  const options = { color: "blue" };
  const onPick = (id) => console.log(id);
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Chart options={options} onPick={onPick} />
    </>
  );
}
```

**Q6 (7 pts).** (a) In a 1000px-wide container, `display: grid; grid-template-columns: 200px 1fr 3fr; gap: 20px;` — what are the three column widths? (3 pts) (b) The Kanban board below is meant to give three equal columns in 900px. Instead the middle column grows to ~700px and the outer columns collapse to ~100px whenever a task title contains a long unbroken string (an imported file name, for example). Explain why and fix it. (4 pts)

```css
.board { display: flex; width: 900px; }
.col   { flex: 1; }
```

<details><summary>Answer Key</summary>

**Q4:** Run in Chromium with React 18.3.1: after one click the buggy `count` shows **1**; after ~1 s the buggy `ticks` shows **1** (the fixed version shows 3 and a steadily increasing number — about ten per second).

(a) All three calls read the same `count` captured by that render (`0`), so each schedules "set to 1"; React batches them into one update → `1` (`15_React_Frontend/03_Hooks_Deep_Dive.md` §useState; `15_React_Frontend/01_React_Fundamentals.md` §Part 5: State). Fix: `setCount((c) => c + 1)` three times — each updater receives the latest pending value → 3.

(b) The effect has `[]` deps, so it runs once on mount and the interval callback closes over the _first render's_ `ticks` (`0`) forever → every tick sets `1` → the display freezes at `1`. This is the **stale closure** row in `15_React_Frontend/03_Hooks_Deep_Dive.md` §Production Reality. Fix: `setTicks((t) => t + 1)` (the effect then genuinely depends on nothing, so `[]` is honest). Re-creating the interval on each `ticks` change by adding `ticks` to the deps also works, but it tears down and rebuilds the timer 10×/s — acceptable partial credit (3/4).

Marking: (a) 3 (answer + reason), (b) 3 (answer + reason), (c) 4.

**Q5:** Verified by counting renders in Chromium + React 18.3.1: after mount `Chart` has rendered once; each of 3 keystrokes adds one → **4 renders in total** (3 extra). After the fix: 1 total (0 extra).

(b) Each keystroke re-renders `Panel` (its state changed), which executes `const options = { … }` and `const onPick = …` again, producing **new object and function references**. `React.memo` compares props with `Object.is` (shallow): `{} !== {}` and `fn !== fn` → "props changed" → `Chart` re-renders (`15_React_Frontend/08_React_Performance.md` §Key Optimization Techniques and §Memoization Decision Flowchart: "passing new object/array/function refs each render → useMemo / useCallback the props").

(c) Any two: hoist `options` to a module-level constant (best — it never changes); `const options = useMemo(() => ({ color: "blue" }), [])`; `const onPick = useCallback((id) => console.log(id), [])`. (`15_React_Frontend/03_Hooks_Deep_Dive.md` §useMemo & useCallback, §Trap 2.) Bonus remark (not required): the flowchart says to measure with the Profiler before memoizing at all.

**Q6:** Measured with `getBoundingClientRect` in Chromium.

(a) `1fr` = one share of the _remaining_ space (`18_CSS_Complete/02_CSS_Layout_Systems.md` §Interview Quick-Fire). Remaining = 1000 − 200 − 2×20 (gaps) = 760; 760 / 4 shares = 190 → **200px, 190px, 570px**. (Award 2 pts for 190/570 shares, 1 pt for noticing the gaps are subtracted; answer 200/200/600 or 250/750 loses the gap point.)

(b) A flex item's `min-width` defaults to `auto`, i.e. it refuses to shrink below its min-content width (`18_CSS_Complete/02_CSS_Layout_Systems.md` §Reality Check). `flex: 1` means `1 1 0%`, so normally each column gets 300px, but the column holding the unbreakable string cannot be narrower than that string; it is frozen at its min-content width and the other two columns share what is left (measured here: 98 / 704 / 98 px; exact numbers depend on the font). Fix:

```css
.col { flex: 1; min-width: 0; }                 /* allow shrinking below content size */
.col .title { overflow-wrap: anywhere; }        /* let the long string wrap (or use text-overflow: ellipsis) */
```

With the fix the same page measured **300 / 300 / 300**. Marking: 2 pts cause (`min-width: auto`), 1 pt fix, 1 pt for wrapping/ellipsis so the text does not simply overflow visually.

</details>

---

### Section C — DevOps (30 points)

**Q7 (15 pts).** This `docker-compose.yml` starts, but the API crashes on boot with a connection error. Find **four** defects (3 pts each), say what happens because of each, and write the corrected file (3 pts).

```yaml
services:
  api:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/devboard_db
      - SPRING_DATASOURCE_USERNAME=devboard
      - SPRING_DATASOURCE_PASSWORD=secret
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=devboard
      - POSTGRES_USER=devboard
      - POSTGRES_PASSWORD=secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Q8 (15 pts).** (a) (9 pts) Review this workflow for the Capstone 3 repo. Name **four** problems and the consequence of each; then give the corrected YAML. (b) (6 pts) The frontend Dockerfile's first stage is below. A developer changes only `src/App.tsx` and rebuilds. Which instructions are re-executed, and what does that cost? Rewrite the stage so that only the code layer is rebuilt.

```yaml
name: DevBoard CI
on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"
      - run: mvn verify

  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          username: devboard-team
          password: hunter2
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: devboard-team/devboard:latest
```

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
```

<details><summary>Answer Key</summary>

**Q7:** Both files were parsed with `docker compose config` (Compose v2.31; the Docker daemon was not running, so the stack itself was not started — the semantics below come from the chapters).

1. **`localhost` in the datasource URL → `db`.** Inside the `api` container `localhost` is the container itself, where nothing listens on 5432 → "Connection refused" at boot. Compose puts services on a shared bridge network where each is reachable by its **service name** (`13_Developer_Essentials/03_Docker_Containers.md` §Networking: "WHY your Spring Boot connects to `db:5432` instead of `localhost:5432` inside Docker"; `22_DevOps/17_Docker_Complete.md` Part 4).
2. **`depends_on: - db` only orders container _start_, not readiness.** Postgres needs seconds to initialise; the JVM usually wins the race and fails. Add a `healthcheck` (`pg_isready`) to `db` and `depends_on: db: condition: service_healthy` (`22_DevOps/17_Docker_Complete.md` Part 5, "wait for DB health check!").
3. **Database name mismatch:** `POSTGRES_DB=devboard` creates `devboard`, the URL asks for `devboard_db` → `FATAL: database "devboard_db" does not exist`. Make them equal.
4. **`"5432:5432"` publishes Postgres on every host interface.** On a public host the database is reachable from outside. The API reaches it through the Docker network, so publish only to loopback for local debugging: `"127.0.0.1:5432:5432"` (`22_DevOps/17_Docker_Complete.md` §Port Publishing — EXPOSE vs -p). Equally acceptable: drop the `ports:` entry from `db` entirely.

Corrected file (validated with `docker compose config`):

```yaml
services:
  api:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/devboard
      - SPRING_DATASOURCE_USERNAME=devboard
      - SPRING_DATASOURCE_PASSWORD=secret
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    ports:
      - "127.0.0.1:5432:5432"
    environment:
      - POSTGRES_DB=devboard
      - POSTGRES_USER=devboard
      - POSTGRES_PASSWORD=secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devboard -d devboard"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

(The password is a placeholder in a teaching file; real deployments use secrets — the chapter's own example carries the same warning.) Marking: 3 pts per defect (1 identify + 2 consequence/fix); 3 pts for a corrected file that contains all four fixes.

**Q8 (a):** The YAML was parsed with `js-yaml` and the job graph inspected: the original has no `needs` edge at all, and `on:` has no branch filter.

1. **No `needs: test` on `docker`** → the two jobs run in parallel, so an image is built **and pushed** even when `mvn verify` fails. Fix: `needs: test` ("Only runs if tests pass", `13_Developer_Essentials/04_CICD_Pipelines.md` §Full Pipeline).
2. **Plaintext registry password in the workflow** → anyone who can read the repo owns the Docker Hub account. Fix: `${{ secrets.DOCKER_USERNAME }}` / `${{ secrets.DOCKER_PASSWORD }}` (§Environment Variables & Secrets).
3. **`on: push:` / `pull_request:` with no filters** → every push to every branch, and every PR update, runs the pipeline and (because the `docker` job is unconditional) can publish an image. Fix: `branches: [main]` and/or `if: github.event_name == 'push'` on the `docker` job so PRs only run tests.
4. **Only a mutable `:latest` tag** → you cannot tell which commit is running or roll back to a known image. Fix: tag with the commit, `${{ github.sha }}` (as the chapter's deploy workflow does).

```yaml
name: DevBoard CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"
      - run: mvn verify

  docker:
    needs: test
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: devboard-team/devboard:${{ github.sha }}
```

Marking: 2 pts per problem with consequence (8), 1 pt for a corrected file with all four fixes. (Not executed on GitHub — graded on the chapter's semantics: `needs` gives the dependency edge, so a failed `test` skips `docker`.)

**Q8 (b):** `COPY . .` is the third layer; its cache key includes every file in the build context, so editing `src/App.tsx` invalidates it, and **every later layer is invalid too**: `RUN npm ci` reinstalls all dependencies (minutes) and `npm run build` runs again. Only the `FROM`/`WORKDIR` layers are reused (`22_DevOps/17_Docker_Complete.md` Part 3: "BAD: any code change → COPY . invalidates → install reruns"). Rewrite so the dependency manifest is copied first:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

Now a source-only change re-executes just `COPY . .` and `npm run build`; `npm ci` is cached until `package.json`/`package-lock.json` change. (Not built — the Docker daemon was not running during authoring; the answer rests on the chapter's layer-cache rule.) Marking: 3 pts for the cascade explanation, 3 pts for the reordered stage.

</details>

---

### Section D — Architecture: Capstone 3 "DevBoard" (15 points)

**Q9 (15 pts).** A user drags a task card from **IN_PROGRESS** to **DONE** on the Kanban board ([CAP03](PROJECTS/CAP03_FullStack.md)).

(a) (6 pts) The spec's `Task.moveTo(newStatus)` is a stub with a TODO. Implement it so a task may move only to an **adjacent** column (one step forward or back, in the order `TODO → IN_PROGRESS → REVIEW → DONE`) and throw `IllegalStateException` otherwise. Also write `TimeEntry.stop(endedAt)` so the **server** computes `durationMinutes` and rejects an end before the start. Say what happens to the drag in (b) when `moveTo` throws.

(b) (5 pts) The frontend uses React Query with an optimistic update. Name the three mutation callbacks you use, what each does, and what the user sees when the server rejects the move.

(c) (4 pts) Two review findings on the same PR: "JWT is saved in `localStorage`" and "`durationMinutes` is sent by the browser". Explain the attack or failure for each and the fix the spec recommends.

<details><summary>Answer Key</summary>

**(a)** Compiled and run with JDK 21 (JPA annotations stripped from the test copy):

```java
enum TaskStatus { TODO, IN_PROGRESS, REVIEW, DONE }

public void moveTo(TaskStatus newStatus) {
    if (Math.abs(newStatus.ordinal() - status.ordinal()) != 1) {
        throw new IllegalStateException("Illegal move " + status + " -> " + newStatus);
    }
    this.status = newStatus;
}

// TimeEntry
public void stop(LocalDateTime endedAt) {
    if (this.endedAt != null) throw new IllegalStateException("already stopped");
    if (endedAt.isBefore(startedAt)) throw new IllegalArgumentException("endedAt before startedAt");
    this.endedAt = endedAt;
    this.durationMinutes = Duration.between(startedAt, endedAt).toMinutes();   // server-side, never from the client
}
```

Observed: `TODO→IN_PROGRESS→REVIEW→IN_PROGRESS` succeeds; `IN_PROGRESS→DONE` throws `Illegal move IN_PROGRESS -> DONE` (the drag in the question is **illegal under this rule**, which is the point of (b)); `TODO→TODO` also throws (distance 0); a 09:00–10:45:59 entry gives `duration = 105` (truncated whole minutes); a second `stop` and an end-before-start both throw. Any equivalent explicit transition table is acceptable. Mapping the exception to an HTTP `409`/`422` in the controller advice is the expected remark; the spec's endpoint is `PATCH /api/tasks/{id}/status`. Marking: 3 pts `moveTo` (adjacency rule, throws), 3 pts `stop` (server-side computation and guards).

**(b)** `PATCH /api/tasks/{id}/status` rejects the move, so the card must jump back. Callbacks (`15_React_Frontend/15_PROBLEM_SETS.md` §Problem Set REACT-PS3, A2; `15_React_Frontend/04_State_Management.md` Part 4): **`onMutate`** — `await queryClient.cancelQueries(...)` so an in-flight refetch cannot overwrite the optimistic state, snapshot the previous cache with `getQueryData`, move the card with `setQueryData`, return `{ previous }` as context; **`onError`** — restore the snapshot from `context.previous` (the card visibly snaps back to IN_PROGRESS; show a toast); **`onSettled`** — `invalidateQueries` so the cache is reconciled with the server whatever happened. The spec's failure table adds the motivation: without the optimistic update the board "flickers on status change (API latency)". Marking: 1 pt for each callback with its job, 2 pts for the user-visible rollback. (Text-grounded; not executed — `@tanstack/react-query` is not installed in the repo.)

**(c)** `00_CURRICULUM/PROJECTS/CAP03_FullStack.md` §Failure Scenarios:
- `localStorage` JWT: any XSS (a compromised npm dependency, an unescaped task description) can read the token with JavaScript and exfiltrate it → account takeover. Fix: store it in an **`httpOnly` cookie**, inaccessible to JS.
- Client-sent `durationMinutes`: the client can send any number (inflate billed hours, break analytics) → "Always calculate server-side: `endedAt − startedAt`" — which is exactly the `stop()` method in (a). Marking: 2 pts per finding (attack/failure 1, fix 1).

</details>

---

## 🎓 MIDTERM 3 — Python/ML & Testing Fundamentals (Semester 4, Week 8)

**Total: 100 points | Time: 90 min**

> **Scope and timing:** `SEMESTER_4_GUIDE.md` ends the Python/ML unit at Week 6 and teaches testing fundamentals (pyramid, JUnit/Mockito) in Week 7, so this exam is sat at the start of Week 8, before the Playwright weeks. It covers Unit 1 (Weeks 1–6: Python core, NumPy/Pandas, ML evaluation) and Week 7 (testing fundamentals). Deep learning and NLP (Weeks 5–6, second half) are left to the problem set PY-PS4, not examined here. Python snippets assume Python 3.10+, NumPy 2.x, pandas 2.x, scikit-learn 1.x.

---

### Section A — Python Core, NumPy & Pandas (30 points)

**Q1 (10 pts).** (a) What does each snippet print, and why? (3 pts each) (b) Fix both with the smallest change. (2 pts) (c) The dataclass at the bottom raises an error at _class definition time_. Which error, and what is the fix? (2 pts)

```python
# snippet 1
def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags

a = add_tag("bug")
b = add_tag("urgent")
print(a, b, a is b)

# snippet 2
checks = [lambda: i * 10 for i in range(3)]
print([f() for f in checks])

# snippet 3
from dataclasses import dataclass

@dataclass
class Team:
    name: str
    members: list = []
```

**Q2 (10 pts).** With `M = np.array([[1, 2, 3], [4, 5, 6]])`, `r = np.array([10, 20, 30])` and `c = np.array([10, 20])`: (a) give the result (or the error) of `M + r`, `M + c`, and `M + c.reshape(2, 1)` (4 pts). (b) After the code below, what are `a`, `b` and `d`? (4 pts) (c) Explain the difference between `b` and `d` in one sentence each (2 pts).

```python
a = np.arange(10)
b = a[2:6]
b[0] = 99
d = a[[2, 3, 4]]
d[1] = -1
```

**Q3 (10 pts).** Given the two DataFrames below: (a) Write the `merge` that keeps all orders and show the `location` of order 4 (3 pts). (b) How many rows does an inner merge return, and why does it differ? (2 pts) (c) For `merged.groupby("dept")["amount"].agg(["mean", "count", "sum"])`, give the row for `Eng` and explain why `mean` is not 50. (3 pts) (d) A teammate computes the normalised price with `df["p"].apply(lambda x: (x - df["p"].mean()) / df["p"].std())`. Rewrite it and say why the original is slow. (2 pts)

```python
orders = pd.DataFrame({
    "order_id": [1, 2, 3, 4, 5],
    "dept":     ["Eng", "Sales", "Eng", "HR", "Sales"],
    "amount":   [100.0, 50.0, None, 70.0, 30.0],
})
depts = pd.DataFrame({"dept": ["Eng", "Sales"], "location": ["NYC", "SF"]})
```

<details><summary>Answer Key</summary>

All outputs below were produced by running the snippets (Python 3.13, NumPy 2.3, pandas 2.3).

**Q1:**

(a) Snippet 1 prints `['bug', 'urgent'] ['bug', 'urgent'] True`. The default `[]` is evaluated **once, when `def` executes**, and that single list object is shared by every call that omits `tags`; both calls append to it and return the _same_ object, hence `a is b`. Snippet 2 prints `[20, 20, 20]`: the lambdas capture the variable `i` by reference (**late binding**), the loop leaves `i == 2`, and each lambda reads `i` when it is _called_ (`25_Python_ML_DL_NLP/01_Python_Core_Fundamentals.md` §Reality Check for the mutable default; §3.3 Closures & Lambda, Challenge 1 for late binding).

(b) `def add_tag(tag, tags=None): if tags is None: tags = []; …` → prints `['bug'] ['urgent']`. For the lambdas bind the current value through a default argument: `lambda i=i: i * 10` → `[0, 10, 20]` (default arguments are evaluated at definition time); `functools.partial` is accepted.

(c) `ValueError: mutable default <class 'list'> for field members is not allowed: use default_factory` — raised when the class is created, not when an instance is made. Fix: `members: list = field(default_factory=list)` (`25_Python_ML_DL_NLP/02_Python_Advanced.md` Part 7, "MUTABLE DEFAULT (use field!)"). Verified: two instances then have independent lists.

Marking: 3 + 3 for correct output and the _cause_ (output alone = 1 pt), 2 for both fixes, 2 for (c).

**Q2:**

(a) `M + r` → `[[11, 22, 33], [14, 25, 36]]` (shapes `(2,3)+(3,)`; `(3,)` is treated as `(1,3)` and broadcast down the rows). `M + c` → **`ValueError: operands could not be broadcast together with shapes (2,3) (2,)`** — shapes align from the right, `3` vs `2`, neither is 1. `M + c.reshape(2, 1)` → `[[11, 12, 13], [24, 25, 26]]` (`(2,1)` stretches across columns). (`25_Python_ML_DL_NLP/03_NumPy_Pandas_Essentials.md` §1.3 Broadcasting.) 1 pt each + 1 pt for the right-alignment rule.

(b) `a = [0, 1, 99, 3, 4, 5, 6, 7, 8, 9]`, `b = [99, 3, 4, 5]`, `d = [99, -1, 4]`. Note `d` is taken _after_ `b[0] = 99`, so it starts as `[99, 3, 4]`; the `-1` assignment changes `d` only. 1 pt each for `a`, `b`, `d`; 1 pt for noticing `d` contains the 99.

(c) A slice returns a **view** onto the same memory (`b.base is a` → `True`), so writing through `b` changes `a`. Indexing with a list of indices (fancy indexing) or a boolean mask returns a **copy** (`d.base` is `None`), so changing `d` leaves `a` untouched (§3.1 Views vs Copies).

**Q3:**

(a) `pd.merge(orders, depts, on="dept", how="left")`; order 4 (`HR`) has no match in `depts`, so its `location` is **`NaN`** (the row is kept, the right-hand columns are NULL-padded — the same as SQL `LEFT JOIN`; cf. `08_SQL/07_JOINs_Complete.md`).

(b) An inner merge returns **4** rows: the HR order has no match and is dropped (left merge keeps all 5).

(c) Row `Eng`: `mean = 100.0`, `count = 1`, `sum = 100.0`. Order 3 has `amount = NaN`; `mean` and `count` skip NaN, so the mean is taken over 1 value (100), not 2 (50 would be the result of treating the missing amount as 0). "mean skips NaN by default, changing the denominator" is the exact warning in `25_Python_ML_DL_NLP/03_NumPy_Pandas_Essentials.md` §Reality Check; the SQL analogue is `AVG` ignoring NULL (`08_SQL/06_Aggregations_GroupBy.md`). Other rows for reference: `HR` 70.0/1/70.0, `Sales` 40.0/2/80.0.

(d) `df["p"] = (df["p"] - df["p"].mean()) / df["p"].std()`. The `apply` version calls a Python lambda once per row _and_ recomputes `mean()` and `std()` over the whole column on every call (O(n²) work); the vectorised version computes each statistic once and does the element-wise arithmetic in compiled code (§2.2 Data Wrangling Operations, Challenge 1). Marking: 3 + 2 + 3 + 2.

</details>

---

### Section B — Machine-Learning Evaluation (35 points)

**Q4 (12 pts).** A fraud model scores 1,000 transactions, 50 of which are fraudulent. Two thresholds give these confusion matrices (rows = actual, columns = predicted):

| | Pred fraud | Pred legit |
|---|---|---|
| **Model A** — actual fraud | TP = 30 | FN = 20 |
| **Model A** — actual legit | FP = 10 | TN = 940 |
| **Model B** — actual fraud | TP = 40 | FN = 10 |
| **Model B** — actual legit | FP = 60 | TN = 890 |

(a) Compute accuracy, precision, recall and F1 for both models (6 pts). (b) What accuracy does a model that predicts "legit" for everything get, and what is its recall? (2 pts) (c) A missed fraud costs the bank $500, a false alarm costs $5 of analyst time. Which model do you ship, and which of the four metrics would have led you to the wrong answer? (4 pts)

**Q5 (12 pts).** The notebook below reports a test accuracy of **1.00** for predicting loan default; the manager is suspicious. (a) Find **two** distinct leakage problems (4 pts). (b) On our data the honest model scores 0.735 (the majority class is 50.8%). Removing the scaling problem alone does _not_ change the reported score at all — so is it still a bug? (3 pts) (c) Write the corrected code with a `Pipeline` and cross-validation (3 pts). (d) What quick checks would have raised the alarm before the manager did? (2 pts)

```python
df = pd.read_csv("loans.csv")   # income, debt, months_since_missed, default
X = df[["income", "debt", "months_since_missed"]].values
y = df["default"].values

X = StandardScaler().fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LogisticRegression().fit(X_train, y_train)
print(model.score(X_test, y_test))        # 1.0
```

**Q6 (11 pts).** You train decision trees of increasing `max_depth` on a 600-sample two-class dataset (70% train = 420, 30% validation = 180). Measured accuracy:

| max_depth | Train | Validation |
|---|---|---|
| 1 | 0.826 | 0.772 |
| 3 | 0.914 | 0.844 |
| 5 | 0.933 | 0.861 |
| None (grows to depth 12) | 1.000 | 0.850 |

(a) Diagnose depth 1 and depth `None` in bias/variance terms, citing the numbers (4 pts). (b) Which depth do you pick, and what is wrong with choosing by training accuracy? (3 pts) (c) The validation score of depth 5 beats depth `None` by 0.011 — how many validation samples is that, and what do you conclude? (2 pts) (d) Give one remedy for each of the two diagnosed problems (2 pts).

<details><summary>Answer Key</summary>

**Q4:** Verified with `sklearn.metrics` on arrays built from these counts.

(a)

| | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|
| Model A | (30+940)/1000 = **0.97** | 30/(30+10) = **0.75** | 30/(30+20) = **0.60** | 2·0.75·0.60/1.35 = **0.667** |
| Model B | (40+890)/1000 = **0.93** | 40/(40+60) = **0.40** | 40/(40+10) = **0.80** | 2·0.40·0.80/1.20 = **0.533** |

(`25_Python_ML_DL_NLP/05_ML_Fundamentals.md` §4.1 Classification Metrics.) 0.75 pts per cell.

(b) Always predicting "legit": accuracy = 950/1000 = **0.95**, recall = **0** (precision undefined, reported as 0 by scikit-learn with `zero_division=0`). Model A's 0.97 is only 2 points better than doing nothing — the chapter's "99 healthy, 1 cancer" lesson.

(c) Expected cost: A = 20 × $500 + 10 × $5 = **$10,050**; B = 10 × $500 + 60 × $5 = **$5,300**. Ship **B**. Accuracy (0.97 vs 0.93) and F1 (0.667 vs 0.533) both prefer A, because they weigh a missed fraud and a false alarm the same; here the costs are 100:1, so recall matters most (chapter: "Cancer detection: High RECALL … even at cost of false alarms"). Accept either "accuracy" or "accuracy and F1" as the misleading metrics; the justification must use the cost asymmetry. Marking: 1 pt per correct cost, 1 pt for the decision, 1 pt for naming the misleading metric(s) with the cost-asymmetry reason.

**Q5:** Verified on a synthetic loan dataset (2,000 rows; `months_since_missed` = 0–2 for defaulters, 12–47 for the rest).

(a) (1) **Target leakage:** `months_since_missed` only exists _after_ a missed payment — it encodes the label (`25_Python_ML_DL_NLP/05_ML_Fundamentals.md` §2.2 Feature Engineering, Challenge 1). With it, hold-out accuracy was **1.0** and every 5-fold CV score was 1.0; without it **0.735**. (2) **Train/test contamination via scaling:** `fit_transform` on the full matrix computes the mean/std from the test rows too (§2.1 Data Preprocessing, Challenge 1). 2 pts each.

(b) On this data the score is _identical_ (0.735) whether we scale before or after splitting — the statistics barely move (feature means 49.58 / 19.98 on all data vs 49.56 / 20.07 on the training split), and a logistic regression is insensitive to such a shift. It is still a bug: the test set is no longer a faithful stand-in for unseen production data, and with outliers or other preprocessing steps (imputation, target encoding) the same pattern can inflate scores. "No visible effect" is not evidence of safety; a leak is defined by the information flow, not by the metric change. Marking: 1 pt for "still a bug", 2 pts for the information-flow argument.

(c)

```python
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score

X = df[["income", "debt"]].values           # months_since_missed removed
pipe = Pipeline([("scaler", StandardScaler()), ("model", LogisticRegression())])
scores = cross_val_score(pipe, X, y, cv=5)  # scaler is re-fit on each training fold only
print(scores.mean())                        # ~0.71 on our data (folds: 0.735 0.692 0.712 0.675 0.72)
```

The Pipeline applies `fit` to the training folds only and `transform` to the held-out fold, "making leakage structurally impossible" (§2.1 Challenge 1). Marking: 1 pt drop the leaky feature, 1 pt Pipeline, 1 pt cross-validation / split first.

(d) Compare with the **majority-class baseline** (50.8% here); treat a suspiciously perfect or AUC > 0.95 score as a red flag; ask of every feature "would it be available _before_ the prediction is needed, and is it a cause rather than a consequence of the target?"; inspect feature importances/coefficients for a single dominant feature. 1 pt each, any two.

**Q6:** Numbers from `DecisionTreeClassifier` on `make_moons(n_samples=600, noise=0.35, random_state=7)`, 70/30 split.

(a) Depth 1: train 0.826 and validation 0.772 are both **low** and close (gap 0.054) → **high bias / underfitting**: a single split cannot represent the curved boundary. Depth `None`: train **1.000** vs validation 0.850 (gap 0.150), the tree has memorised the training set including noise → **high variance / overfitting** (`25_Python_ML_DL_NLP/05_ML_Fundamentals.md` Part 3: The Bias-Variance Tradeoff). 2 pts each.

(b) Depth **5** (highest validation score, 0.861; depth 3 is the simpler near-tie at 0.844). Training accuracy always rises with complexity — depth `None` wins on train by construction — so it measures memorisation, not generalisation. Choose by validation (better: cross-validation, §4.3), and since the validation set was now used for choosing, report the final number on a separate untouched test set (`25_Python_ML_DL_NLP/06_ML_Algorithms.md` Reality Check: tuning overfits the validation set). 2 pts choice+reason, 1 pt separate test set.

(c) 0.011 × 180 ≈ **2 samples** (155 vs 153 correct). That is well inside the noise of a 180-sample set (one sample = 0.56 points), so the data do not show that depth 5 is truly better than the unpruned tree; use k-fold CV, which averages over many splits, before claiming a winner. 1 pt each.

(d) Underfit: increase capacity — deeper tree, more/better features, a richer model. Overfit: reduce variance — limit `max_depth`/prune, more training data, ensembling (Random Forest), or stronger regularisation. 1 pt each.

</details>

---

### Section C — Testing Fundamentals (35 points)

**Q7 (12 pts).** Library API team's suite (the P04 project): 500 E2E tests, 100 integration tests, 50 unit tests. Assume 20 s per E2E test, 2 s per integration test, 5 ms per unit test, run serially. (a) Total run time (3 pts). (b) The team re-balances the same 650 tests to the 70 / 20 / 10 pyramid — how many tests per layer and what is the new run time? (3 pts) (c) With a 2% flake rate on E2E tests (each test fails spuriously 2% of the time), how many spurious failures per run before and after? (2 pts) (d) Assign each case to the lowest pyramid layer that can verify it, with a one-line reason (4 pts):

1. A late fee is $0.25/day after day 3, capped at $10.
2. `POST /api/loans` returns 409 when the book is already on loan.
3. A user logs in, searches for a title, borrows it and sees the confirmation banner.
4. `LoanRepository.findOverdue()` returns only loans past their due date.

**Q8 (12 pts).** Find the bug. This service passes its failure-path test, but production shows orders in the database for customers who were never charged.

```java
class OrderService {
    private final OrderRepository repo;
    private final PaymentGateway gateway;
    OrderService(OrderRepository repo, PaymentGateway gateway) { this.repo = repo; this.gateway = gateway; }

    void placeOrder(Order order) {
        repo.save(order);
        if (!gateway.charge(order.total())) throw new PaymentFailedException();
    }
}
```

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock OrderRepository orderRepo;
    @Mock PaymentGateway paymentGateway;
    @InjectMocks OrderService orderService;

    @Test
    void shouldNotSaveOrder_whenPaymentFails() {
        Order order = new Order("Laptop", 999.99);
        when(paymentGateway.charge(anyDouble())).thenReturn(false);

        assertThrows(PaymentFailedException.class, () -> orderService.placeOrder(order));
    }
}
```

(a) Why does the test pass although the service is wrong? (3 pts) (b) What single assertion makes the test fail on the buggy service, and what does it prove? (3 pts) (c) Fix `placeOrder`. (2 pts) (d) Without Mockito, write the same test with two hand-written doubles — a **stub** `PaymentGateway` that answers `false` and a **recording** `OrderRepository` — and state what each double is for. Skeleton below. (4 pts)

```java
class RecordingRepository implements OrderRepository {
    // TODO: remember every saved order
}
class StubGateway implements PaymentGateway {
    // TODO: return a canned answer
}
// TODO: run placeOrder with payment failing, then assert on what the doubles saw
```

**Q9 (11 pts).** This test file passes on a developer laptop and fails "randomly" in CI.

```python
import os, threading, time, unittest

results = []                                   # module-level
DELAY = float(os.environ.get("WORKER_DELAY", "0.01"))   # CI machines are slower

def export_async(items):
    def work():
        time.sleep(DELAY)                      # stand-in for disk / network
        results.extend(i.upper() for i in items)
    t = threading.Thread(target=work)
    t.start()
    return t

class ExportTests(unittest.TestCase):
    def test_a_uppercases(self):
        export_async(["a", "b"])
        time.sleep(0.1)                        # "that should be enough"
        self.assertEqual(results, ["A", "B"])

    def test_b_single_item(self):
        export_async(["z"]).join()
        self.assertEqual(results, ["Z"])
```

(a) Name the two root causes using the flakiness categories (timing dependence, shared state, test-order dependence, environment differences), and say which test each affects (4 pts). (b) How would you reproduce each failure on demand? (3 pts) (c) Rewrite the file so it is deterministic (3 pts). (d) A colleague proposes `--retries=3` in CI instead. Evaluate that (1 pt).

<details><summary>Answer Key</summary>

**Q7:** Arithmetic checked in Python. Source: `13_Developer_Essentials/06_Testing_Fundamentals.md` §The Testing Pyramid (Challenge 1: 500/100/50 inverted pyramid, 70/20/10 target, "2% flake rate across 500 tests = 10 random failures per run"); `21_SDET_Playwright_Automation/01_Foundations/00_SDET_Foundations_Mindset.md` §The Testing Pyramid and its interview Q3 ("the lowest pyramid layer that can verify the behaviour").

(a) 500 × 20 s + 100 × 2 s + 50 × 0.005 s = 10,000 + 200 + 0.25 = **10,200.25 s ≈ 170 min** (E2E is 98% of the time).

(b) 70 / 20 / 10 of 650 = **455 unit, 130 integration, 65 E2E**. Time = 65 × 20 + 130 × 2 + 455 × 0.005 = 1,300 + 260 + 2.275 = **1,562.3 s ≈ 26 min** (6.5× faster). Sharding the old suite over 8 runners would still take ≈ 21 min while keeping the fragile shape — parallelism is a complement, not a substitute.

(c) Before: 500 × 0.02 = **10**; after: 65 × 0.02 = **1.3** spurious failures per run.

(d) 1 → **unit** (pure arithmetic; no I/O; boundary values day 3/4 and the $10 cap). 2 → **integration / API** (controller + service + persistence rule, checked via HTTP status; no browser needed). 3 → **E2E** (a user journey across the real UI and stack; keep a few). 4 → **integration** with a real database (a query's correctness depends on SQL and the schema; `07_Modern_Java/Ch60_SB_Testing_Advanced.md` §Test Containers). Accept 4 → "repository slice test" or equivalent. 1 pt each, reason required.

**Q8:** Hand-rolled doubles compiled and run with JDK 21 against both the buggy and the fixed service: buggy → `threw=true | saved=1`, fixed → `threw=true | saved=0`. The Mockito snippets are taken from `13_Developer_Essentials/06_Testing_Fundamentals.md` §Mocking with Mockito (Mockito itself is not installed in this repo's tooling, so the Mockito syntax is checked against the chapter, not executed).

(a) `assertThrows` only proves the exception was thrown. The buggy service **saves first, then charges, then throws** — the exception still propagates, so the test is green while the order is already persisted. Exception assertions say nothing about side effects that happened _before_ the throw (§Mocking with Mockito, Challenge 2).

(b) `verify(orderRepo, never()).save(any());` — proves `save` was never invoked on the failure path, i.e. the failure is atomic. On the buggy service this verification fails (the hand-rolled equivalent below shows `saved = 1` instead of `0`). This is interaction (behaviour) verification, not just output checking. 3 pts: 1 for the assertion, 2 for what it proves.

(c)

```java
void placeOrder(Order order) {
    if (!gateway.charge(order.total())) throw new PaymentFailedException();
    repo.save(order);
}
```

(In a real system also consider what happens if `save` fails _after_ a successful charge — a compensating refund or an outbox; the exam asks only for the ordering fix.)

(d) Model answer (verified output below the code):

```java
class RecordingRepository implements OrderRepository {          // records interactions
    final List<Order> saved = new ArrayList<>();
    public void save(Order o) { saved.add(o); }
}
class StubGateway implements PaymentGateway {                  // canned answer
    final boolean answer; double lastAmount = -1;
    StubGateway(boolean answer) { this.answer = answer; }
    public boolean charge(double amount) { lastAmount = amount; return answer; }
}

RecordingRepository repo = new RecordingRepository();
StubGateway gw = new StubGateway(false);
try { new OrderService(repo, gw).placeOrder(new Order("Laptop", 999.99)); fail(); }
catch (PaymentFailedException expected) { }
assertEquals(0, repo.saved.size());       // fails on the buggy service (saved = 1)
assertEquals(999.99, gw.lastAmount);      // the right amount was charged
```

Run result: `buggy: threw=true | saved=1 | charged=999.99` and `fixed: threw=true | saved=0 | charged=999.99`. The **stub** controls an input (it makes the payment fail); the **recording repository** observes an output the code under test cannot return (what was persisted) — in Mockito terms `when(...).thenReturn(...)` versus `verify(...)`. Accept a `@Spy`/mock-based explanation consistent with the chapter (`@Mock` = no real code runs; `@Spy` wraps a real object). Marking: 2 pts stub, 2 pts recorder + assertions.

**Q9:** Reproduced by running the file under both delays (Python 3.13, `unittest`).

(a) (1) **Timing dependence / environment** — `test_a_uppercases` waits a fixed `time.sleep(0.1)` and hopes the worker is done; with `WORKER_DELAY=0.3` (slow CI) it fails with `[] != ['A', 'B']`. A hard sleep is "either too short (flaky on slow CI) or too long" (`21_SDET_Playwright_Automation/01_Foundations/00_SDET_Foundations_Mindset.md` anti-pattern table, row "Hardcoded Sleeps"; `13_Developer_Essentials/06_Testing_Fundamentals.md` §Production Reality: "async timing issues (`Thread.sleep`)"). (2) **Shared state / test-order dependence** — both tests write to the module-level `results`; `test_b_single_item` (runs second) sees `['A', 'B', 'Z']` and fails even with a fast worker. Run alone, each test passes (verified). 2 pts each (cause + test).

(b) Timing: raise the worker delay (here `WORKER_DELAY=0.3`), or repeat the test many times under CPU load (the Playwright analogue is `--repeat-each=20`, `21_SDET_Playwright_Automation/01_Foundations/00_SDET_Foundations_Mindset.md` Q2). Shared state/order: run the whole file vs each test alone (`python -m unittest file.Class.test_name`), then reverse or shuffle the order — a test that passes alone and fails in the suite is order-dependent. 1 pt for each technique, 1 pt for "make the failure deterministic before fixing".

(c)

```python
def export_async(items, sink):
    def work():
        time.sleep(DELAY)
        sink.extend(i.upper() for i in items)
    t = threading.Thread(target=work); t.start(); return t

class ExportTests(unittest.TestCase):
    def setUp(self):
        self.results = []                                  # fresh state per test

    def test_a_uppercases(self):
        export_async(["a", "b"], self.results).join(timeout=5)   # wait for the event, not the clock
        self.assertEqual(self.results, ["A", "B"])

    def test_b_single_item(self):
        export_async(["z"], self.results).join(timeout=5)
        self.assertEqual(self.results, ["Z"])
```

Verified green at both `WORKER_DELAY=0.01` and `0.3`. Marking: 1 pt isolate state, 1 pt synchronise on completion (`join`/event), 1 pt a timeout as an upper bound rather than a fixed wait.

(d) Retries hide the symptom: both failures here are _deterministic given the conditions_, so a retry just re-fails or, worse, makes red/green meaningless; the chapter's mitigation is one automatic retry **plus** a quarantine dashboard and actually fixing the flake, and warns that developers learn to ignore red CI (`13_Developer_Essentials/06_Testing_Fundamentals.md` §Production Reality). Above ~5% flake rate the test must be fixed or quarantined (`21_SDET_Playwright_Automation/01_Foundations/00_SDET_Foundations_Mindset.md` Q1).

</details>

---

## 🎓 FINAL EXAM 3 — SDET & Enterprise Systems (Semester 4, Week 16)

**Total: 100 points | Time: 90 min**

> **Scope:** `SEMESTER_4_GUIDE.md` Unit 2 (Playwright and the labs, Weeks 8–11) and Unit 3 (Kafka, resilience patterns, distributed design, Weeks 12–13), finishing in the Capstone 4 ("PulseNews") brief. Python/ML and testing fundamentals were examined in Midterm 3; mobile (Unit 4) is not examined. Ten questions in 90 minutes: budget about 8 minutes per 10-point question.

---

### Section A — Playwright & Test Automation (40 points)

**Q1 (10 pts).** The page below is the sign-up form under test. For each locator, give the number of elements it matches **and the reason** (1.5 pts each, count 0.5 + reason 1). Then answer (g).

```html
<form>
  <label for="u">Username</label><input id="u">
  <label for="pw">Password</label><input id="pw" type="password">
  <label for="pw2">Confirm password</label><input id="pw2" type="password">
  <label for="e">Email</label><input id="e" type="email" aria-label="Work email">
  <div class="field"><span>Phone</span><input id="ph"></div>
  <button type="submit">Login</button>
  <button type="button">Login with SSO</button>
  <button type="button" id="close"><svg width="16" height="16"></svg></button>
  <button type="button" aria-label="Close dialog"><svg width="16" height="16"></svg></button>
</form>
```

```typescript
page.getByRole("button", { name: "Login" })                    // (a)
page.getByRole("button", { name: "Login", exact: true })       // (b)
page.getByLabel("Password")                                    // (c)
page.getByLabel("Email", { exact: true })                      // (d)
page.getByLabel("Phone")                                       // (e)
page.getByRole("button", { name: "Close" })                    // (f)
```

(g) (1 pt) What happens when you call `.click()` on locator (a), and how do you fix (e) without touching the app code?

**Q2 (10 pts).** Find the bug. This test fails about one run in three on CI and never locally.

```typescript
test("payment shows PAID", async ({ page }) => {
  await page.goto("/orders/ORD-7");
  await page.getByRole("button", { name: "Pay" }).click();
  const status = await page.locator("#status").textContent();
  expect(status).toBe("PAID");
});
```

(a) Which flakiness type is this, and why does the symptom depend on the machine? (2 pts) (b) Fix the test, and say what the **default** timeout of your fix is and when you would change it (3 pts). (c) A different test fails in 5% of runs. After fixing it you run it 10 times and see 10 passes. Is it fixed? Show the calculation (3 pts). (d) Roughly how many consecutive passes give 95% confidence that the failure rate is now below 5%? (2 pts)

**Q3 (10 pts).** (a) (5 pts) The setup project logs in through the UI and calls `context.storageState({ path })`; every test then starts with `storageState: "state.json"`. Locally and in CI all tests land on `/login`, yet the setup test passes and the saved file contains cookies and `localStorage`. The app keeps its token in `sessionStorage`. Explain the symptom and give a fix that lives in a fixture. (b) (5 pts) Given the three handlers below (registered in this order, before navigation), what status does each request get? Then say what changes for `GET /api/books` if R3 calls `route.continue()` instead of `route.fallback()`, and what is wrong with registering R1 _after_ `page.goto()` when the page fetches on load.

```typescript
await page.route("**/api/books**",  (r) => r.fulfill({ status: 500, json: { source: "R1" } })); // R1
await page.route("**/api/books/1",  (r) => r.fulfill({ status: 200, json: { source: "R2" } })); // R2
await page.route("**/api/books",    (r) => r.fallback());                                        // R3

// requests: (i) GET /api/books/1   (ii) GET /api/books   (iii) GET /api/books?page=2   (iv) GET /api/books/2
```

**Q4 (10 pts).** Lab 03 (the parking-fine checkout, £19.99, slow payment API). (a) (3 pts) A test asserts `expect(Number(price) * 100).toBe(1999)` where `price = "19.99"`. What is `19.99 * 100` in JavaScript, and how should money be represented and asserted? (b) (4 pts) The double-click test below passes on a checkout that charges twice. Why? How do you make it fail on the buggy build? (c) (3 pts) A teammate then writes "assert the network log contains exactly one `POST /pay`". Does that pass on a **correct** system that uses an idempotency key? What should be asserted instead?

```typescript
test("double-click charges once", async ({ page, request }) => {
  await page.goto("/checkout/ORD-1");
  await page.getByRole("button", { name: "Pay" }).dblclick();
  const order = await (await request.get("/api/orders/ORD-1")).json();
  const succeeded = order.charges.filter((c) => c.status === "succeeded");
  expect(succeeded.length).toBeLessThanOrEqual(1);
});
```

<details><summary>Answer Key</summary>

Every Playwright claim below was run against Playwright 1.64.1 (Chromium) on local `node:http` pages and/or `page.setContent` pages, using the same `@playwright/test` version as `21_SDET_Playwright_Automation/labs`.

**Q1:** Source: `21_SDET_Playwright_Automation/01_Foundations/02_Enterprise_Locators_XPath.md` §11 (accessible-name computation), §13 (substring/`exact` matching), §14 (form-control name sources).

| | Count | Reason |
|---|---|---|
| (a) | **2** | `name` is a case-insensitive **substring** match on the accessible name: "Login" and "Login with SSO" both contain it. |
| (b) | **1** | `exact: true` = whole string, case-sensitive: only `Login`. |
| (c) | **2** | `getByLabel("Password")` is a substring match too: it also finds "Confirm password". Fix: `{ exact: true }`. |
| (d) | **0** | `aria-label="Work email"` outranks the `<label>`, so the accessible name is "Work email"; with `exact: true` the visible text "Email" no longer matches. (Without `exact`, `getByLabel("Email")` still finds it, as a substring of "Work email" — measured: 1.) |
| (e) | **0** | `Phone` sits in a `<span>`, not a `<label for>` or wrapping `<label>`, so the input has **no accessible name**: `getByLabel` and `getByRole("textbox", { name: "Phone" })` both return 0. |
| (f) | **1** | The second button's name is "Close dialog" (from `aria-label`), a substring of which is "Close". The first icon-only button has an empty name (its accessibility snapshot is just `button` with an `img` child) and cannot be matched by name. |

(g) `.click()` on (a) throws a **strict mode violation** ("resolved to 2 elements"), and the error message lists the unambiguous `aka getByRole(...)` alternatives; `.first()` would "fix" it only by silently picking one. For (e) scope the locator: `page.locator(".field").filter({ hasText: "Phone" }).getByRole("textbox")` (measured: 1) and report the missing label association as an accessibility defect (§14). Marking: (a)–(f) 1.5 each; (g) 1 pt (strict mode 0.5 + scoped-locator fix 0.5).

**Q2:** Sources: `21_SDET_Playwright_Automation/01_Foundations/01_Playwright_TS_Basics.md` §11 The Retryability Engine; `21_SDET_Playwright_Automation/06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md` §1 Taxonomy, §3 Type 1 Fix, §3d, Challenge 5. Reproduced: a page whose status flips from `PENDING` to `PAID` 300 ms after the click makes this test fail with `Expected: "PAID"  Received: "PENDING"`, while `await expect(locator).toHaveText("PAID")` passes.

(a) **Type 1 — timing / race condition**: `textContent()` is a **one-shot** read of the DOM _now_; it does not wait. A fast machine updates the DOM before the read, a slow CI machine does not — so the result depends on speed. (Notice that `click()` auto-waits for actionability, not for the _consequence_ of the click.)

(b)

```typescript
await page.getByRole("button", { name: "Pay" }).click();
await expect(page.locator("#status")).toHaveText("PAID");
```

An `expect(locator)` assertion re-evaluates the locator **and** the condition every ~100 ms until it passes or times out. Its default timeout is **5000 ms** (verified: with the status flipping after 7 s the fixed test fails with `Timeout: 5000ms`). Raise it per assertion for known-slow operations, e.g. `{ timeout: 20_000 }` for a payment confirmation (chapter §3 Type 1 Fix) — do **not** add `waitForTimeout`: a sleep is too short on slow CI and wastes time everywhere else. Marking: 1 pt assertion, 1 pt default value, 1 pt when/how to override. (The chapter's inline comment "30000ms in toHaveText" is not the default — it is a value you set; we measured 5000.)

(c) **Not proven fixed.** At a 5% failure rate P(10 passes in a row) = 0.95¹⁰ = **0.599** — a 60% chance of seeing exactly this result even if nothing was fixed (verified: 0.5987). Equivalently there is only a 40% chance (1 − 0.599) that ten runs would even have exposed the flake. Use the progressive protocol: `--repeat-each=50` before calling it done, `--repeat-each=200` before closing the ticket (§3d). Marking: 1 pt answer, 2 pts calculation.

(d) Solve 0.95ⁿ ≤ 0.05 → n ≈ **58.4, i.e. 59 consecutive passes** (for 99%: 0.95ⁿ ≤ 0.01 → 90). Extra insight (verified): with a true 1% failure rate even 200 clean runs still happen 13.4% of the time (0.99²⁰⁰), so the chapter's "200 runs = high confidence for ≥1%" means roughly 87%, not certainty. Marking: 1 pt method, 1 pt number.

**Q3:** Sources: `21_SDET_Playwright_Automation/03_Real_World_Scenarios/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md` §8; `21_SDET_Playwright_Automation/04_Cross_Site_Patterns_And_D365/16_CrossSite_Pattern6_StorageState_Chaining.md` §8; `21_SDET_Playwright_Automation/02_Test_Architecture/06_Custom_Fixtures_Architecture.md` §9 (overriding built-in fixtures); `21_SDET_Playwright_Automation/03_Real_World_Scenarios/31_API_Mocking_page_route.md` §3 and §6c.

(a) `storageState` captures **cookies and `localStorage`** (and IndexedDB only with `indexedDB: true`), but **not `sessionStorage`** (Ch57 §8: "came back `null`"). On the local server we measured the saved file: `cookies: ["visited"]`, `localStorage: ["theme"]`, no token. The new context therefore has no token, the app's guard redirects to `/login`, and every test ends there — while the setup test (which kept the original in-memory context) passes. (Ch16's 5W1H list says otherwise; Ch57 §8 flags the contradiction and gives the measured behaviour.) Fix: inject the token before any page script runs, in a fixture so no test repeats it:

```typescript
export const test = base.extend<{ token: string }>({
  token: "abc",   // in practice: fetched from the API with the `request` fixture
  page: async ({ page, token }, use) => {
    await page.addInitScript((t) => sessionStorage.setItem("token", t), token);
    await use(page);
  },
});
```

Verified: with this fixture and `storageState: "state.json"` the dashboard opens; without it the context lands on `/login`. Marking: 3 pts cause, 2 pts fix (`addInitScript` before navigation + fixture).

(b) Playwright matches handlers **newest first** (LIFO) and stops at the first one that handles the request; `fallback()` hands the request to the next-older matching handler (Ch31 §6c). Measured results: (i) `GET /api/books/1` → **200 / R2** (R3's pattern `**/api/books` does not match `…/books/1`; R2 is newer than R1). (ii) `GET /api/books` → R3 matches, falls back, R2 does not match, R1 does → **500 / R1**. (iii) `GET /api/books?page=2` → **500 / R1**: the glob is matched against the whole URL including the query string, so R3's `**/api/books` does not match and R1 does. (iv) `GET /api/books/2` → **500 / R1**. With `route.continue()` in R3, (ii) goes straight to the **real server** (measured `200:real`): `continue` ends the chain, R1 is never consulted. A route only intercepts requests made **after** it is registered: if R1 is added after `page.goto()` the request fired on load has already gone to the real server (measured: the page kept showing `200:real`, and only a reload showed the mock) — register before navigating and assert the mock was hit (Ch31 §3 "closure boolean"). Marking for (b): 0.5 pt per request (2 pts), 1.5 pts for the `continue` vs `fallback` difference, 1.5 pts for the late-registration problem.

**Q4:** Sources: `21_SDET_Playwright_Automation/03_Real_World_Scenarios/67_Payment_Gateway_Testing.md` §5 and §8; `21_SDET_Playwright_Automation/labs/03-checkout/README.md` (R2 and its debrief). Reproduced on a local server with a 400 ms payment API, a never-disabled Pay button and no idempotency key.

(a) `19.99 * 100` is **`1998.9999999999998`** (verified), so `toBe(1999)` fails — or worse, a rounding bug elsewhere passes unnoticed. Represent money as an **integer in minor units** (pence, `amountPence: 1999`), convert with `Math.round(19.99 * 100)` only at the edge (verified: `1999`), and assert the exact integer from the server (`amountPence === 1999`), never a formatted string. 1 pt each: the value, minor units, exact assertion.

(b) The test reads the order **before the second (and first) payment requests have been answered**: the API takes ~400 ms, `dblclick()` returns immediately, and the read sees **0** charges (measured) — and `≤ 1` is true for 0. The assertion is also weak (`≤ 1` instead of `== 1`). Fix: record the payment requests (`page.on("request", r => …r.response())`), wait for every response (or the success text) with `Promise.all`, _then_ read the order and assert **exactly 1** succeeded charge. Measured: the fixed test sees 2 requests and 2 charges on the buggy server and fails — the bug is now caught. 2 pts cause, 2 pts fix.

(c) **No** — it **fails on a correct system**: with an idempotency key both requests still arrive (chapter measurement: "2 POSTs, same key"); what the key prevents is the second _effect_. It would only pass for a disabled-button implementation, which does not protect against a refresh, a retry or a second tab. Assert on the **effect**: the order has exactly one succeeded charge of 1999 pence (Ch67 §5 "assert effects, not requests"; Reality Check "Idempotency keys stop duplicate effects"). Marking: 1 pt answer, 2 pts effect-not-requests.

</details>

---

### Section B — Event-Driven Design & Resilience (30 points)

**Q5 (10 pts).** The `order-events` topic has 3 partitions. The producer sends **without a key**, spreading records over P0, P1, P2 in turn (the simplified round-robin the chapters use). The payment-service consumer group runs 5 instances. Events in send order:

| # | Event | Partition |
|---|---|---|
| 1 | ORD-1 OrderPlaced | P0 |
| 2 | ORD-2 OrderPlaced | P1 |
| 3 | ORD-1 OrderPaid | P2 |
| 4 | ORD-3 OrderPlaced | P0 |
| 5 | ORD-1 OrderShipped | P1 |
| 6 | ORD-2 OrderCancelled | P2 |

(a) Which guarantee does Kafka give, and how can the group process ORD-2's _cancellation_ before its _placement_? (3 pts) (b) Fix the producer. After the fix, which of the six events must share a partition, and which partition each lands on? (3 pts) (c) How many of the 5 consumers are idle, and what is the correct way to raise throughput? What new risk does a key such as `customerId` introduce when one customer produces 99% of traffic? (4 pts)

**Q6 (10 pts).** The Capstone 4 consumer skeleton marks an event as processed _after_ the fan-out. At-least-once delivery means a crash makes the broker redeliver the uncommitted record.

```java
@KafkaListener(topics = "article-posted", groupId = "feed-fanout-service")
public void consume(ConsumerRecord<String, ArticlePostedEvent> record) {
    var event = record.value();
    if (processed.contains(event.eventId())) return;        // 1. check
    feedService.fanoutToFollowers(event.authorId(), event.articleId(), event.publishedAt()); // 2. effect
    processed.add(event.eventId());                          // 3. mark
}                                                            // 4. offset committed after return
```

(a) For a crash after each numbered step, say what the redelivery does (duplicate effect / lost effect / harmless) — and what happens if steps 2 and 3 are swapped (6 pts). (b) Give the design that is safe in both orders (2 pts). (c) Name two primitives that make the "have I seen this id?" check itself atomic under concurrent consumers (2 pts).

**Q7 (10 pts).** Implement a circuit breaker with these rules: it starts CLOSED; **3 consecutive failures** open it; while OPEN every call is rejected immediately with `CallNotPermittedException` and the downstream is **not** invoked; once **30 s** have passed since it opened, the next call is a single trial in HALF_OPEN: success closes the breaker, failure reopens it and restarts the 30 s timer.

```java
class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private State state = State.CLOSED;
    private int consecutiveFailures = 0;
    private long openedAt = 0;
    private final int failureThreshold;       // 3
    private final long resetTimeoutSec;       // 30

    <T> T call(long nowSec, Supplier<T> downstream) {
        // TODO
    }
}
```

(a) Write `call` (5 pts). (b) Trace this sequence (time in seconds; "healthy" says whether the downstream would succeed). For each call give: downstream invoked? result? state afterwards (4 pts). (c) At t = 10 the downstream was healthy, yet the call failed. Is that a bug? (1 pt)

| t | 0 | 1 | 2 | 3 | 10 | 32 | 33 | 50 | 63 | 64 |
|---|---|---|---|---|---|---|---|---|---|---|
| healthy? | yes | no | no | no | yes | no | no | yes | yes | no |

<details><summary>Answer Key</summary>

**Q5:** Sources: `07_Modern_Java/Ch54_Message_Queues_Kafka.md` Part 3 (How Messages Flow, Kafka Guarantees, Reality Check "Kafka partitions are like database shards"); `10_Enterprise_Systems/10_KAFKA_PROBLEM_SETS.md` §Problem Set ENTERPRISE-PS3 A1 and A2. The partition assignments were reproduced with a small Java program (round-robin vs `floorMod(key.hashCode(), 3)` as a teaching stand-in for the partitioner; real Kafka hashes the serialised key with murmur2, so *which* partition a key gets differs, but the invariant "same key → same partition" is what is tested).

(a) Kafka guarantees order **only within one partition**, not across partitions. ORD-2's placement is in P1 and its cancellation in P2; the two partitions are read by **different consumers running independently**, so the consumer owning P2 can handle the cancellation before the consumer owning P1 has handled the placement. The same holds for ORD-1 (Placed P0, Paid P2, Shipped P1). 3 pts: guarantee, why the two events are in different partitions, why different consumers are not synchronised.

(b) Send with a **partition key = orderId**: `kafkaTemplate.send("order-events", order.getId(), event)`. All events of one order then share a partition: {1, 3, 5} together (ORD-1), {2, 6} together (ORD-2), {4} (ORD-3). The exact partition numbers depend on the hash; in our run ORD-1→P2, ORD-2→P0, ORD-3→P1. Accept any consistent assignment. (The chapter's beginner trap: without a key "all messages for the same customer land on different partitions → processed out of order".) 1 pt key, 2 pts grouping.

(c) **2 idle** (3 partitions → at most 3 active consumers; each partition goes to exactly one consumer in the group; Ch54 Part 4 Challenge). Throughput can only be raised by adding **partitions first** and then consumers (partitions cannot be decreased later). A key such as `customerId` creates a **hot partition** when one customer dominates the traffic: that partition's single consumer becomes the bottleneck; PS3 A2 suggests a key suffix (`customerId-<n>`) at the cost of ordering among the sub-keys. 2 pts idle count + scaling rule, 2 pts hot partition.

**Q6:** Sources: `10_Enterprise_Systems/10_KAFKA_PROBLEM_SETS.md` §Problem Set ENTERPRISE-PS3 A3 (idempotent consumer, "Redis SETNX or DB unique key"); `07_Modern_Java/Ch54_Message_Queues_Kafka.md` Reality Check ("Consumer offset is managed by Kafka automatically"); `00_CURRICULUM/PROJECTS/CAP04_DistributedSystem.md` Part 2 (the skeleton). Simulated in Java with crash injection at each point and a broker that redelivers until the offset is committed:

| Order | Crash at | Deliveries | Effect count |
|---|---|---|---|
| mark → effect | between mark and effect | 2 | **0 — event lost** |
| effect → mark (the skeleton) | between effect and mark | 2 | **2 — duplicate** |
| effect → mark | after both, before the offset commit | 2 | 1 — harmless (the check skips the redelivery) |
| effect + mark in one transaction | inside the transaction | 2 | 1 (rolled back, redone once) |
| effect + mark in one transaction | after commit, before the offset commit | 2 | 1 (skipped) |

(a) Skeleton: crash after step 1 (check) → harmless, nothing happened yet (redelivery repeats the whole thing); after step 2 → **duplicate fan-out** (the effect ran but the id was never recorded); after step 3 → harmless (the id is recorded, so the redelivery is skipped); after step 4 nothing is pending. Swapping 2 and 3 (marking first) turns the duplicate into a **lost event**: a crash between mark and effect leaves the id recorded but the work undone, and the redelivery is skipped. This is why at-least-once delivery has the _duplicate_ failure mode and the consumer must tolerate it rather than trade it for loss. Marking: 2 pts for the duplicate after step 2, 2 pts for the lost event when the steps are swapped, 2 pts for the harmless cases (crash before the effect, or after the mark).

(b) Make the effect and the "processed" record **atomic**: one DB transaction that writes both (the unique id rejects a second insert), or make the effect itself idempotent (the same result however often it runs, as opposed to an increment) — then commit the offset only after processing, never before (Ch54 Reality Check: manual commit after successful processing). Marking: 2 pts. A cross-system pair (Redis effect + SQL dedup) cannot be made atomic by a transaction, so prefer an idempotent effect there, or put the dedup record in the same store as the effect. (Marking note: the rubric in CAP04 awards its top score for "Exactly-once with dedup key".)

(c) A **database unique key** (insert-or-fail) and **Redis `SETNX`/set-if-absent** (PS3 A3: "check if already processed via DB unique key or Redis SETNX"). A separate `existsById` followed by `save` is a check-then-act race when two consumers see the same event. 1 pt each.

**Q7:** Source: `10_Enterprise_Systems/09_Distributed_Patterns.md` §Circuit Breaker Pattern (state machine, "failing fast … <1ms once OPEN", Selection criterion). Implemented, compiled and run with JDK 21 using the exact sequence above.

(a)

```java
<T> T call(long nowSec, Supplier<T> downstream) {
    if (state == State.OPEN) {
        if (nowSec - openedAt >= resetTimeoutSec) state = State.HALF_OPEN;    // one trial
        else throw new CallNotPermittedException();                           // fail fast
    }
    try {
        T result = downstream.get();
        consecutiveFailures = 0;
        state = State.CLOSED;                                                 // success in CLOSED or HALF_OPEN
        return result;
    } catch (CallNotPermittedException e) {
        throw e;
    } catch (RuntimeException e) {
        consecutiveFailures++;
        if (state == State.HALF_OPEN || consecutiveFailures >= failureThreshold) {
            state = State.OPEN;
            openedAt = nowSec;                                                // (re)start the timer
        }
        throw e;
    }
}
```

Marking: 1 pt OPEN fast-fail without invoking the downstream, 1 pt timeout → HALF_OPEN trial, 1 pt success resets/closes, 1 pt failure counting and opening at the threshold, 1 pt HALF_OPEN failure reopens with a new `openedAt`.

(b) Verified trace:

| t | Downstream invoked | Result | State after |
|---|---|---|---|
| 0 | yes | ok | CLOSED |
| 1 | yes | failed | CLOSED (1 failure) |
| 2 | yes | failed | CLOSED (2) |
| 3 | yes | failed | **OPEN** (3rd consecutive; `openedAt = 3`) |
| 10 | **no** | rejected | OPEN |
| 32 | **no** | rejected (only 29 s elapsed) | OPEN |
| 33 | yes (trial) | failed | **OPEN**, timer restarted (`openedAt = 33`) |
| 50 | **no** | rejected (17 s elapsed) | OPEN |
| 63 | yes (trial, 30 s elapsed) | ok | **CLOSED** |
| 64 | yes | failed | CLOSED (failure count restarts at 1) |

The common errors: forgetting that the trial at t = 33 restarts the timer (so t = 50 is still rejected), and letting the success at t = 10 count (it is rejected — the downstream is never asked). 0.4 pts per row, rounded to 4.

(c) Not a bug — it is the pattern: while OPEN the breaker does not probe the downstream, so it cannot know it recovered until the reset timeout allows a trial; the price of failing in <1 ms is a short window of rejected requests to a healthy service. In production the chapter sets `minimumNumberOfCalls`, a failure-**rate** threshold over a sliding window, and several half-open trial calls; the 3-consecutive-failures rule here is a teaching simplification that is too twitchy for high-traffic services (§Circuit Breaker challenge: 60 failures of the last 100 calls is a 60% failure rate ≥ 50% → trips even for a 6% user-visible incident). 1 pt.

</details>

---

### Section C — Capstone 4 "PulseNews" Design (30 points)

**Q8 (10 pts).** From the [CAP04](PROJECTS/CAP04_DistributedSystem.md) capacity estimate: 1M DAU, each posting 1 article/day (2 KB each) and refreshing the feed 20 times/day; peak 50k writes/s and 100k reads/s. (a) Recompute the average writes/s and reads/s (3 pts). (b) The spec states "~3.6TB/year". Check it and correct the label if needed (4 pts). (c) How many times higher is the peak write rate than the average, and what does that say about how to size the system? Which sizing figure would you use for the Kafka topic and the shards? (3 pts)

**Q9 (10 pts).** (a) (4 pts) Under the hybrid fan-out rule (regular authors < 10k followers push on write; celebrities > 10k are pulled at read time), how many sorted-set writes does one new article cause for an author with 9,999 followers, with 10,001 followers, and with 10,000? What would a 10M-follower author cost under pure push, and how long would that take if each write costs 0.1 ms and writes are serial? (b) (3 pts) The design shards `articles` by `hash(author_id) % 16`. The team adds a 17th shard and keeps `% N`. Roughly what fraction of authors changes shard? The repo's consistent-hashing chapter says "every single key" — is that exactly right? (c) (3 pts) Why is `author_id` a better shard key than the article timestamp here?

**Q10 (10 pts).** Production incident. After a Redis latency spike the `ArticlePostedConsumer` group (12 partitions, 12 instances) falls behind: events arrive at 10,000/s but are processed at 8,000/s. (a) How long until the lag reaches 1M messages? (2 pts) (b) List three likely causes in order of likelihood with the command or metric you would use to check each (3 pts). (c) Management asks you to "just add 20 more consumer instances". What happens, and what is the real scaling lever? (2 pts) (d) The Article Service writes an article to PostgreSQL and then publishes `ArticlePosted`. Describe the failure that loses articles from feeds and the pattern that prevents it; why must the consumer still be idempotent afterwards? (3 pts)

<details><summary>Answer Key</summary>

All arithmetic in Q8–Q10 was checked in Python; the modulo-resharding fraction was measured over 1,000,000 consecutive integer keys.

**Q8:** Sources: `00_CURRICULUM/PROJECTS/CAP04_DistributedSystem.md` §1.1 Capacity Estimation; `13_Developer_Essentials/09_System_Design.md` §Back-of-Envelope Calculations (1 day = 86,400 s).

(a) Writes: 1,000,000 / 86,400 ≈ **11.6/s** (the spec rounds to ~12). Reads: 1M DAU × 20 = 20M/day / 86,400 ≈ **231/s** (spec: ~230). 1.5 pts each.

(b) 2 KB × 1M articles/day = 2 GB/day → × 365 = **730 GB per year** → × 5 years = **3.65 TB**. So "~3.6TB" is the **5-year total**, not a per-year figure; the label "/year" in the spec is wrong by a factor of 5 (a real per-year growth of about 0.73 TB is what capacity planning for disks/shards needs). Marking: 2 pts arithmetic, 2 pts spotting the label error (accept "3.6 TB over 5 years").

(c) 50,000 / 11.57 ≈ **4,320×** the average (reads: 100,000 / 231 ≈ 432×). Averages are irrelevant for sizing: a system must be provisioned and tested for the **peak** (and its burst shape), e.g. 50k writes/s over 16 shards ≈ 3,125 writes/s per shard if keys are evenly spread; the Kafka topic's partition count and consumer capacity must also cover the peak, with Kafka's role being to absorb the spike (buffering) while consumers work through it. 1 pt ratio, 2 pts "size for peak" with a figure.

**Q9:** Sources: `00_CURRICULUM/PROJECTS/CAP04_DistributedSystem.md` §1.4 Hybrid Fan-Out and §1.7 Sharding, plus its "Key Design Decisions" table; `03_Algorithms/07d_Probabilistic_DS_Deep.md` PART 5 §The Problem with standard Modulo Hashing; `13_Developer_Essentials/09_System_Design.md` §WHEN: Decision Guide ("User ID hash mod N … resharding is hard").

(a) 9,999 followers → **9,999** writes (push); 10,001 followers → **0** fan-out writes (pulled at read time, merged into the feed on each read); exactly 10,000 → the spec's two rules ("<10k" and ">10k") **do not cover it** — a gap a design review should close (e.g. "≥ 10k pull"). Pure push for a 10M-follower author: **10,000,000** writes; at 0.1 ms serial = 1,000 s ≈ **16.7 minutes** (and it would hammer Redis at the same time). The hybrid trades that storm for one extra fetch per feed read. 1 pt for each of the three counts, 1 pt for the 10M cost.

(b) About **94%** (16/17 = 94.1%; measured 0.9412 over 10⁶ consecutive integer keys): a key stays only if `h mod 16 == h mod 17`, which holds for just 1 in 17 values. The chapter's "every single key" is slightly overstated, but its conclusion holds: nearly all data must move, which is why `% N` is poor for elastic clusters and consistent hashing (or a fixed large number of logical shards mapped to nodes) is used instead. 1 pt number, 1 pt reasoning, 1 pt that the claim is "almost all" not "all".

(c) A timestamp key sends every new article to the **same shard** (the newest range) — a hot partition taking all 50k writes/s while the others idle (spec table: "Timestamp creates hot partition"). `author_id` hashes spread writes evenly and keep an author's articles together for profile queries. 2 pts hot shard, 1 pt `author_id` benefits.

**Q10:** Sources: `10_Enterprise_Systems/10_KAFKA_PROBLEM_SETS.md` §Problem Set ENTERPRISE-PS3 A4 (consumer lag diagnosis); `07_Modern_Java/Ch54_Message_Queues_Kafka.md` Part 4 Challenge, Pattern 4 Outbox; `10_Enterprise_Systems/09_Distributed_Patterns.md` PART 4 Outbox Pattern and §Circuit Breaker Pattern.

(a) The backlog grows by 10,000 − 8,000 = 2,000 messages/s → 1,000,000 / 2,000 = **500 s ≈ 8.3 min**. (2 pts)

(b) Following the PS3 A4 ranking: (1) **Slow processing** — each fan-out call waits on Redis/Article/User service; check p99 handler time (`@Timed`) and Redis latency; (2) **GC pauses** — `jstat -gcutil <PID> 1000`; (3) **Too few consumers / bad assignment** — `kafka-consumer-groups.sh --bootstrap-server … --describe --group feed-fanout-service` to see per-partition lag and the assignment; other valid answers: an error loop on one offset (look for the same offset in the logs) or a producer spike (compare the produce rate with baseline). 1 pt each (cause + check).

(c) With 12 partitions and 12 instances, every partition already has its own consumer; the 20 extra instances would sit **idle** (a partition is read by exactly one consumer of the group). The real levers: make each message cheaper (batch the Redis writes, async calls, `@KafkaListener(batch = true)`), shield slow downstream calls (a circuit breaker with a fallback), and, only if work per message is already minimal, **add partitions first** and then consumers. 1 pt idle explanation, 1 pt lever.

(d) If the service commits to PostgreSQL and then crashes (or the broker is down) before `send`, the article exists but **no event was ever published** — followers never see it. **Outbox pattern:** in the _same DB transaction_ insert the article and an `outbox` row; a relay (polling job or CDC/Debezium) publishes pending rows to Kafka and marks them published — "if the DB is updated, the event will be published (eventually)". The relay itself is at-least-once (it can crash after publishing and before marking), so the consumer must still deduplicate by `eventId` (Q6). 1 pt failure, 1 pt outbox mechanics, 1 pt why idempotency remains.

</details>

---

[← Back to Curriculum Overview](CURRICULUM_OVERVIEW.md)
