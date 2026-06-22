# CSE604 — Java Concurrency & JVM Internals

## Semester 6 · Full-Stack Specialization (Backend Track)

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can reason about the Java Memory Model from happens-before edges (not from rules), choose between thread pools / CompletableFuture / virtual threads based on workload profile, diagnose memory issues from a heap dump, and tune GC for a given latency/throughput target.
> **Capstone:** Take a blocking Spring Boot service. Profile it. Convert hot paths to virtual threads (Loom) or CompletableFuture. Measure throughput improvement. Tune GC for tail latency. Write up the analysis with flame graphs.

---

## Navigation

| Course                                                                                                                              | Description |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **[CSE601 — Spring Boot & Microservices](../CSE601_Spring_Boot_And_Microservices/README.md)** | S06 sibling — consumer of this knowledge |
| **[CSE602 — API Design & Testing](../CSE602_API_Design_And_Testing/README.md)**                                                     | S06 sibling |
| **[CSE603 — DevOps & CI/CD](../CSE603_DevOps_And_CICD/README.md)**                                                                  | S06 sibling — runs the profiled apps |
| **CSE604 — Java Concurrency & JVM Internals**                                                                                       | This course |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `07_Modern_Java/`                          | Primary source — Chapters 15-22 (concurrency, JVM, streams)    |
| `13_Developer_Essentials/19_Concurrency_Models_Coroutines.md` | Cross-language concurrency comparison       |
| `CSE401 Operating Systems`                 | Threads, scheduling, memory at the OS level                    |

---

## Prerequisites

- `CSE401 Operating Systems` — threads, scheduling, memory model at OS level
- `07_Modern_Java/Ch01_Java_Foundations.md` through `Ch14_Exceptions.md` — Java fluency
- Working dev environment with JDK 21+ and a profiler (async-profiler or JFR)

**Constraint:** Concurrency bugs are NOT debuggable by reading code. You will spend significant time using profilers, thread dumps, and JFR recordings. If you can't read a flame graph by Week 4, the rest of the course won't stick.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Java Memory Model (Weeks 1–3)

**Learning Outcomes:**

- State happens-before relationships for synchronized, volatile, final
- Predict reordering effects on lock-free code
- Use `VarHandle` for safe lock-free programming (cautiously)

#### Week 1 — Thread Basics + happens-before

`07_Modern_Java/Ch15_Threads_Basics.md` — Thread lifecycle, why busy-wait is wrong, happens-before edges.

#### Week 2 — synchronized + volatile + final

`07_Modern_Java/Ch16_JMM_VolatileSynchronized.md` — what each guarantees and what it doesn't.

**Section Challenge (JMM subtlety):**

> A `volatile boolean done = false;` field is set to `true` by Thread A. Thread B reads it in a `while (!done)` loop. With volatile, Thread B is guaranteed to see the change. Now imagine a `volatile Map<String, String> config = new HashMap<>();` — Thread A populates the map, then sets a volatile flag `ready = true`. Thread B sees `ready = true`, then reads from `config`. Is the map content visible to Thread B? Why or why not?

<details>
<summary>Answer</summary>

```
THE ANSWER: YES, the map contents are visible — but for a reason that's
NOT just "volatile on config."

THE MECHANISM — HAPPENS-BEFORE TRANSITIVITY:
  Thread A: config.put("k", "v"); ready = true;
  Thread B: if (ready) { String v = config.get("k"); }

  Volatile write to `ready` happens-before volatile read of `ready`.
  config.put() happens-before the volatile write of `ready` (program order).
  Volatile read of `ready` happens-before config.get() (program order).

  TRANSITIVITY: config.put → ready=true → reads ready=true → config.get
  → all data Thread A wrote before `ready=true` is visible to Thread B
  AFTER it sees `ready=true`.

WHY "config IS VOLATILE" IS A RED HERRING:
  Making `config` field volatile only ensures that REPLACING the reference
  is atomically visible. It does NOT ensure the MAP CONTENTS are visible.
  The map contents are visible because of the `ready` flag's happens-before
  edge — the volatile FLAG carries the synchronization, not the volatile
  MAP REFERENCE.

WHAT GOES WRONG IF YOU REMOVE volatile FROM `ready`:
  No happens-before edge between Thread A's put() and Thread B's get().
  Thread B may see ready=true but read partial/null map contents because
  the put() can be REORDERED past the non-volatile flag write.
  This is a classic data race producing torn writes.

PRINCIPLE:
  Volatile on a field protects the FIELD's value, not the OBJECT it points to.
  For object-graph publication, use a synchronizer (volatile flag,
  AtomicReference, ConcurrentMap, or explicit synchronized block).
  HashMap is NOT thread-safe even with volatile reference.

PRODUCTION TRAP:
  Common pattern: "I made it volatile, so it's thread-safe."
  Reality: volatile guarantees only single-field visibility, not
  multi-field consistency. For configuration maps, use
  ConcurrentHashMap (which guarantees internal consistency) or
  copy-on-write semantics with AtomicReference<Map>.
```

</details>

#### Week 3 — Atomics + VarHandle

`07_Modern_Java/Ch17_Atomics_VarHandle.md` — CAS, ABA problem, when AtomicReference vs lock.

---

### UNIT 2 — Thread Pools + Executors (Weeks 4–5)

#### Week 4 — Executor Framework

`07_Modern_Java/Ch18_Executor_ThreadPools.md` — ThreadPoolExecutor sizing (Little's Law), queue strategies, rejection policies.

#### Week 5 — ForkJoinPool + Parallel Streams

`07_Modern_Java/Ch19_ForkJoin_Streams.md` — work-stealing, RecursiveTask, when parallel streams hurt.

---

### UNIT 3 — Async & Reactive (Weeks 6–7)

#### Week 6 — CompletableFuture

`07_Modern_Java/Ch21_CompletableFuture.md` — composition, exception handling, thenApply vs thenCompose, async executor selection.

#### Week 7 — Virtual Threads (Loom)

`07_Modern_Java/Ch41_VirtualThreads_Loom.md` — carrier threads, pinning, when virtual threads beat reactive, when they don't.

---

### UNIT 4 — JVM Internals (Weeks 8–11)

**Learning Outcomes:**

- Read a heap dump and identify retention paths
- Choose GC (G1 vs ZGC vs Shenandoah) based on latency vs throughput requirements
- Tune JIT for specific workloads

#### Week 8 — Class Loading + Runtime Data Areas

`07_Modern_Java/Ch01_Java_Foundations.md` §7 + JVM-specific chapter — class file format, class loaders, metaspace.

#### Week 9 — Garbage Collection

`07_Modern_Java/Ch08_Collections_Internals.md` + GC chapter — generational hypothesis, G1 regions, ZGC concurrent.

#### Week 10 — JIT Compilation

Tiered compilation (C1 → C2), hot code detection, inlining, escape analysis.

#### Week 11 — Memory Diagnostics

JFR, async-profiler, jstack, jmap; reading heap histograms and dominator trees.

---

### UNIT 5 — Performance Tuning (Weeks 12–14)

Real-world: profile a Spring Boot service, identify bottleneck, apply fix, measure improvement.

---

### UNIT 6 — Capstone (Weeks 15–16)

Take a blocking service. Profile baseline. Convert to virtual threads or CompletableFuture. Tune GC. Document throughput + tail latency improvement with flame graphs.

---

## Problem Sets

[`07_Modern_Java/07_PROBLEM_SETS.md`](../../../07_Modern_Java/07_PROBLEM_SETS.md) — concurrency sections.

## Exam Prep

[`07_Modern_Java/Ch22_Java_Deep_Reasoning.md`](../../../07_Modern_Java/Ch22_Java_Deep_Reasoning.md) — 13 freeze moments.
