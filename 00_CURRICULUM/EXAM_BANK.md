# 📋 Exam Bank — Midterms & Finals (Semesters 1–3 so far)

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

[← Back to Curriculum Overview](CURRICULUM_OVERVIEW.md)
