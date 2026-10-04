# CSE401 — Operating Systems

## Semester 4 · Computer Science Core

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can reason about OS-level resource management, write concurrent code that is free from deadlock and race conditions, implement core OS subsystems (scheduler, memory manager, file system), and understand how containers achieve isolation.
> **Capstone:** Build a toy MLFQ scheduler in C or Java with syscall tracing.

---

## Navigation

| Course                                                                             | Description |
| ---------------------------------------------------------------------------------- | ----------- |
| **[CSE401 — Operating Systems](README.md)**                                      | This course |
| **[CSE402 — Computer Networks](../CSE402_Computer_Networks/README.md)**               | S04 sibling |
| **[CSE403 — Cryptography & Security](../CSE403_Cryptography_And_Security/README.md)** | S04 sibling |
| **[CSE404 — Information Retrieval](../CSE404_Information_Retrieval/README.md)**       | S04 sibling |

| Related Modules                                               | Cross-Reference                         |
| ------------------------------------------------------------- | --------------------------------------- |
| `13_Developer_Essentials/19_Concurrency_Models_Coroutines.md` | Concurrency patterns                    |
| `07_Modern_Java/`                                             | Java threads, `java.util.concurrent`    |
| `22_DevOps/`                                                  | Container runtime, cgroups, namespaces  |
| `02_Data_Structures/`                                         | Queue, heap, tree structures used in OS |
| `14_Mental_Models/`                                           | System-level reasoning frameworks       |

---

## Prerequisites

- `02_Data_Structures/01a_Memory_Foundations.md` — stack vs heap, pointer basics
- `02_Data_Structures/01d_Stack_Queue.md` — queue semantics (used by scheduler)
- `02_Data_Structures/01f_Trees_Heaps.md` — heap structure (priority queue scheduling)
- Working knowledge of C or Java (memory allocation, pointers/references, syscalls)

**Constraint:** If you are coming from a managed language (Python, JavaScript), budget 5–8 hours extra in Weeks 1–3 to get comfortable with manual memory management in C. The OS is written in C — you will read it.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Processes & Threads (Weeks 1–3)

**Learning Outcomes:**

- Explain the life cycle of a process from `fork()` to `exec()` to `wait()`
- Implement a simple shell that spawns processes and pipelines them
- Analyze scheduling algorithms: FCFS, SJF, Round Robin, MLFQ — knowing their tradeoffs
- Measure context-switching cost and explain why it matters in production

---

#### Week 1 — Process Model & System Calls

| Day | Topic                                                      | Read                                                         | Do                                                                    |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| 1   | What is an OS? Kernel vs user space, system call interface | `02_Data_Structures/01a_Memory_Foundations.md` §1-2          | Draw kernel/user mode boundary diagram                                |
| 2   | Process Control Block (PCB): what the kernel tracks        | `02_Data_Structures/01c_LinkedList.md` §1 (as state machine) | Trace PCB fields through `fork()`                                     |
| 3   | `fork()` — copy-on-write semantics, parent/child split     | Linux `fork(2)` man page                                     | Implement: count how many processes `fork()` creates before `exec()`  |
| 4   | `exec()` family — replacing process image                  | Linux `execve(2)` man page                                   | Write: `my-shell.c` that runs `ls -la` via `fork()+exec()`            |
| 5   | Lab Session                                                | —                                                            | **Lab:** Build a minimal shell with `fork/exec/wait`, handle `Ctrl+C` |
| 6–7 | Review + Problem Set OS-PS1                                | —                                                            | `CSE401_Operating_Systems/01_PROBLEM_SETS.md` PS-1                    |

**Section Challenge (fork/exec):**

You run this C program:

```c
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main() {
    for (int i = 0; i < 3; i++) {
        pid_t p = fork();
        if (p == 0) {
            printf("child pid=%d\n", getpid());
            _exit(0);
        }
        wait(NULL);
    }
    printf("parent pid=%d\n", getpid());
    return 0;
}
```

How many lines of output are produced? In what order? Trace the state transitions.

<details>
<summary>Answer</summary>

**7 lines total.** The loop runs 3 times. Each iteration forks exactly one child (p == 0 branch), which exits immediately. The parent calls `wait(NULL)` before the next iteration, so children are serialised — not concurrent. The output order is deterministic:

```
child pid=<some>
child pid=<some>
child pid=<some>
parent pid=<parent>
```

Why `wait(NULL)` matters: without it, the parent could exit before children print (init reaps orphans), and the order of child prints vs parent print would be non-deterministic. `wait()` forces the parent to block until that specific child exits, establishing happens-before for the print statements.

</details>

---

#### Week 2 — Scheduling Algorithms

| Day | Topic                                                                | Read                                                          | Do                                                    |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | CPU scheduler: dispatcher, scheduler, preemption                     | Linux kernel scheduler overview (`kernel/sched/`)             | Trace scheduler invocation on `fork()`                |
| 2   | FCFS (First-Come-First-Served) — convoy effect                       | `14_Mental_Models/` (throughput reasoning)                    | Compute avg wait time for `[P1=24, P2=3, P3=3]` FCFS  |
| 3   | SJF (Shortest Job First) — optimal avg wait, impossible to implement | `03_Algorithms/05_Trees.md` (priority reasoning)              | Prove SJF optimality for non-preemptive case          |
| 4   | Round Robin — time quantum, context switch overhead                  | `02_Data_Structures/01d_Stack_Queue.md` §5 (queue semantics)  | Simulate RR with quantum=4 on `[6,3,1,7]`             |
| 5   | MLFQ (Multi-Level Feedback Queue) — the dominant Linux scheduler     | `14_Mental_Models/03_Graph_Tree_Thinking.md` (decision trees) | Trace a CPU-bound vs I/O-bound job through MLFQ       |
| 6–7 | Review + Problem Set OS-PS2                                          | —                                                             | PS-2 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md` |

**Section Challenge (MLFQ):**

```c
// Simulate MLFQ with 3 queues: Q0 (quantum=8), Q1 (quantum=16), Q2 FCFS
// Jobs: A (CPU-bound, 30ms), B (I/O-bound, 5ms blocking every 2ms)
// Trace A and B through all 3 queues. How many context switches?
// What is A's response time vs B's response time?
```

<details>
<summary>Answer</summary>

**MLFQ trace:**

- A starts in Q0 (quantum=8). Uses full 8ms → demoted to Q1.
- A in Q1 (quantum=16). Uses 16ms → demoted to Q2 (FCFS). Remaining 6ms in Q2.
- B starts in Q0. Runs 2ms, blocks for I/O (5ms). When B wakes, it is **boosted** back to Q0 (typical CFS behavior).
- A's response time: 8 + 16 + 6 = **30ms** (total, no boost needed).
- B's response time: 2ms (first slice) + 5ms (I/O) + 2ms (second slice) = **~9ms**.
- Context switches: A×3 (Q0→Q1, Q1→Q2, then runs to completion), B×2 (Q0 slice, wake, Q0 slice) + 2 I/O transitions = **~4-5 context switches**.

**WHY this matters in production:** A long-running batch job (CPU-bound) in MLFQ slowly demotes to the lowest queue. An interactive job that occasionally blocks will be boosted. This prevents starvation while keeping latency low. Kubernetes pod scheduling uses similar logic: `Guaranteed` pods get dedicated CPU time, `Burstable` pods share, `BestEffort` gets leftovers.

</details>

---

#### Week 3 — Threads & Context Switching

| Day | Topic | Read | Do |
||-----|-------|------|-----|
| 1 | Process vs thread: shared address space, separate stacks | `02_Data_Structures/01c_LinkedList.md` §2 (node independence) | Draw memory layout diagram: process with 3 threads |
| 2 | POSIX threads (`pthread_create`, `pthread_join`, `pthread_detach`) | `07_Modern_Java/Ch18_JMM_GC_Deep.md` §Thread (JVM thread model) | Write: create 4 threads, each prints its TID |
| 3 | Context switching — register save/restore, TCB vs PCB | `02_Data_Structures/01a_Memory_Foundations.md` §3 (register model) | Measure: `getpid()` vs `pthread_self()` cost |
| 4 | Thread pools — work queue, fixed-size pool, queuing theory | `13_Developer_Essentials/19_Concurrency_Models_Coroutines.md` | Implement thread pool in C using a ring buffer queue |
| 5 | Lab | — | **Lab:** Measure context-switch overhead with `clock_gettime(CLOCK_MONOTONIC)` |
| 6–7 | Review + Problem Set OS-PS3 | — | PS-3 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md` |

**Section Challenge (context switch cost):**

You benchmark two implementations of a concurrent counter increment:

```c
// Version A: process-based
volatile int counter = 0;
for (int i = 0; i < N; i++) {
    if (fork() == 0) { counter++; _exit(0); }
    wait(NULL);
}

// Version B: thread-based
void* inc(void* arg) { counter++; return NULL; }
pthread_t t[N];
for (int i = 0; i < N; i++) pthread_create(&t[i], NULL, inc, NULL);
for (int i = 0; i < N; i++) pthread_join(t[i], NULL);
```

Both produce the same answer (N). But version A is 40× slower. Explain why. What is the actual cost?

<details>
<summary>Answer</summary>

**Root cause: process context switch is ~40× more expensive than thread context switch.**

Version A creates N processes. Each `fork()` duplicates the address space (copy-on-write, but still involves page table duplication and TLB shootdown). Each `wait(NULL)` is a kernel-mode transition. The scheduler must context-switch between parent and child N times.

Version B creates N threads in the **same process**. They share the address space, page table, and TLB entries. Context switches between threads only save/restore registers and stack pointer — no MMU remapping.

**Measured cost breakdown:**

- Thread context switch (Linux): ~0.5–1.5 µs
- Process context switch: ~5–25 µs (depends on cache state)

**Why it matters in production:** A service that forks a new process per request (e.g., CGI) vs a thread-per-request server will have dramatically different throughput. Nginx and Node.js both use event-driven + thread pool models (not process-per-connection) specifically to avoid this. Go's goroutine scheduler is even cheaper because it multiplexes thousands of goroutines onto ~GOMAXPROCS OS threads.

**Constraint:** The `volatile` on `counter` is necessary to prevent compiler from optimising away the increment, but does nothing for memory ordering between processes (there is no shared memory). Use `volatile` only for demonstration; real inter-process communication needs `mmap` or `sysv` shared memory.

</details>

---

### UNIT 2 — Virtual Memory (Weeks 4–6)

**Learning Outcomes:**

- Explain paging, page tables, TLB, and inverted page tables
- Handle page faults; understand demand paging and working-set model
- Diagnose thrashing and OOM conditions in production Linux systems
- Implement a page replacement simulator (LRU, FIFO, Clock)

---

#### Week 4 — Paging & Address Translation

| Day | Topic                                                 | Read                                                                   | Do                                                                      |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Logical vs physical addresses, segmentation tradeoff  | `02_Data_Structures/01a_Memory_Foundations.md` §4                      | Draw address translation: VA 0x00402004 → PA                            |
| 2   | Page tables: single-level, multi-level (hierarchical) | `02_Data_Structures/01f_Trees_Heaps.md` §1-2 (tree representation)     | Compute: 4KB pages, 32-bit VA, 2-level PT — how many entries per level? |
| 3   | TLB — hardware cache for page table entries           | `04_Patterns_Templates/06_Binary_Search_Patterns.md` (cache reasoning) | Trace TLB hit/miss ratio for sequential vs random access                |
| 4   | Inverted page tables, radix tree (x86-64)             | Linux kernel `mm/` directory                                           | Explain why x86-64 uses 4-level page tables                             |
| 5   | Lab                                                   | —                                                                      | **Lab:** Use `strace -f` on a program to observe `mmap/munmap` syscalls |
| 6–7 | Review + Problem Set OS-PS4                           | —                                                                      | PS-4 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`                   |

**Section Challenge (TLB):**

A program accesses an array of 4096 integers (16KB total) sequentially in a loop 1000 times. Each integer is 4 bytes, and the array fits in exactly 4 pages (1KB per page for this machine's page size assumption, actually 4KB pages → 4 pages total for 16KB).

- With an 8-entry LRU TLB, what is the TLB hit rate? Show your reasoning.
- What happens to hit rate if the array size grows to 1MB (256 pages)?

<details>
<summary>Answer</summary>

**4-page array, 8-entry TLB:**

- Sequential access: first access to each page causes 1 TLB miss, 3 subsequent accesses to that page hit.
- 4 pages × 4 bytes × 1024 elements per page? Actually: 16KB / 4 bytes = 4096 integers. Page size = 4KB. So 4 pages, each holding 1024 integers.
- Sequential scan hits the same page 1024 times before moving to next page.
- TLB hit rate: (1024 - 1) / 1024 ≈ **99.9% per page**. Overall ~99.9%.

**1MB array (256 pages):**

- 8-entry TLB can only hold 8 entries simultaneously.
- After scanning page 0 (1 miss), page 1 (1 miss), ... page 8 → page 0's entry is evicted.
- Revisiting page 0 causes another miss. TLB hit rate drops to **7/8 = 87.5%** in the steady-state (working set > TLB size).
- At 1000 iterations over 256 pages: only 8 pages fit in TLB. Hit rate ≈ 7/8 = 87.5%.

**WHY this matters in production:** PostgreSQL and Linux use huge pages (2MB or 1GB) for large shared buffers specifically to increase TLB hit rates for workloads that touch many pages. Java's G1 GC uses region sizes that map well to CPU cache lines and TLB entries. An OOM kill on a machine with many page faults often traces back to working set exceeding physical memory + swap — the OS spends more time servicing page faults than doing useful work.

</details>

---

#### Week 5 — Page Faults & Demand Paging

| Day | Topic                                                   | Read                                                          | Do                                                                   |
| --- | ------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Page fault handler — what the OS does on a miss         | Linux `mm/filemap.c`, `mm/memory.c`                           | Trace: `mmap` a file, touch one byte, watch page fault count         |
| 2   | Demand paging vs prepaging — when does prepaging help?  | `02_Data_Structures/01e_HashTable.md` §2 (cache analogy)      | Write: simulate demand paging with a trace file                      |
| 3   | Copy-on-write fork — pages marked read-only until write | Linux `mm/cow.c`                                              | Prove COW reduces memory usage with `fork()` + `ps aux`              |
| 4   | Memory-mapped files — `mmap`, `munmap`, `msync`         | `22_DevOps/00_DevOps_Fundamentals.md` §5 (memory constraints) | Implement: memory-map a 100MB file and search it without `read()`    |
| 5   | Lab                                                     | —                                                             | **Lab:** Build a demand paging simulator in Java — track page faults |
| 6–7 | Review + Problem Set OS-PS5                             | —                                                             | PS-5 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`                |

**Section Challenge (copy-on-write fork):**

```c
char buf[4096];
memset(buf, 'A', 4096);
pid_t p = fork();
// Parent continues, child never touches buf
for (int i = 0; i < 100; i++) {
    if (p == 0) _exit(0);
    wait(NULL);
    p = fork();
}
```

How many distinct physical pages does this program use? Walk through the COW mechanics.

<details>
<summary>Answer</summary>

**Answer: 1 physical page (4KB)** — all processes share the same read-only copy.

**Step-by-step COW mechanics:**

1. Parent writes `buf` with `A`s → kernel marks the page as read-only in parent's page table.
2. `fork()` → child gets a **copy** of the parent's page table entry, also pointing to the same physical page, both marked read-only (COW).
3. Neither parent nor child ever write to `buf` after fork. The kernel marks both PTEs as pointing to the same physical page in the "shared page" list.
4. When the child exits 100 times, each `wait()` in the parent reaps it. The physical page is only freed when the last process sharing it exits.

**Constraint that breaks this:** If either process writes to `buf` after `fork()`, the kernel copies the page (typically ~0.5–2ms for 4KB), marks the writer's PTE as writable, and leaves the other process with the original page. This is why `fork()+exec()` is expensive for large processes — `exec()` unmaps the entire address space, but `fork()` alone triggers COW overhead proportional to dirty pages.

**Production incident:** PostgreSQL uses `fork()` to create checkpointer and walwriter processes. With large `shared_buffers` (e.g., 64GB), a `fork()` can trigger significant COW overhead because many pages are already dirty. This is one reason PostgreSQL is migrating toward `posix_spawn()` or multi-threaded architectures (PostgreSQL 15+ parallelism).

</details>

---

#### Week 6 — Thrashing & Working Set Model

| Day | Topic                                                                  | Read                                                                 | Do                                                                      |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Thrashing — when paging activity dominates useful work                 | Linux `mm/vmscan.c` (kswapd, page reclaim)                           | Monitor: `vmstat 1` during `stress --vm 2 --vm-bytes 90%`               |
| 2   | Working-set model — W(t, τ), locality of reference                     | `14_Mental_Models/09_Complexity_Intuition.md` (throughput reasoning) | Compute working set for a trace: [1,2,1,3,1,2,4,1,2] with τ=3           |
| 3   | Page replacement algorithms: FIFO, LRU, Optimal, Clock (Second Chance) | `02_Data_Structures/01f_Trees_Heaps.md` §5 (heap for LRU)            | Implement LRU page replacement; compare hit rates                       |
| 4   | Allocator design: slab, slub, buddy system                             | Linux `mm/slab.c`, `mm/slub.c`                                       | Trace `kmalloc` sizes and alignment                                     |
| 5   | Lab                                                                    | —                                                                    | **Lab:** Implement a page replacement visualizer (FIFO vs LRU vs Clock) |
| 6–7 | Review + Problem Set OS-PS6                                            | —                                                                    | PS-6 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`                   |

**Section Challenge (thrashing):**

A Linux server has 16GB RAM. You deploy 12 containers, each configured with 2GB memory limit, but no CPU limits. Kubernetes sets cgroup `memory.limit_in_bytes=2G` per container. All 12 containers run a JVM with a 1.8GB heap. Suddenly, all containers start OOMKilling processes.

**5WHY Analysis:**

| Why   | Answer                                                                                                                                                                                                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WHY 1 | The 12 JVMs collectively try to use 21.6GB, exceeding the 16GB physical host memory.                                                                                                                                                                                                |
| WHY 2 | cgroup `memory.limit_in_bytes` only limits the container's view of memory, not the host's total. No host-level overcommit guard exists between containers.                                                                                                                          |
| WHY 3 | The JVM's `+HeapDumpOnOutOfMemoryError` triggers a heap dump (writing 1.8GB to disk) which itself requires memory (direct I/O buffer) during the dump, pushing the cgroup over limit.                                                                                               |
| WHY 4 | The OS has no per-container swap enforcement (cgroup `memory.memsw.limit_in_bytes` is unset). Swap is global to the host.                                                                                                                                                           |
| WHY 5 | Kubernetes does not set `memory.memsw.limit_in_bytes` by default (requires explicit `--feature-gates=MemorySwappiness=false` on some setups). The solution is to set `--kubelet-flags` or use `v1.ResourceMemory` with a limit that accounts for heap + native memory + page cache. |

**Constraint violation:** Setting `memory.limit_in_bytes` equal to the JVM heap size is wrong. JVM needs: heap + native memory (native code, JNI) + Metaspace + thread stacks + page cache for I/O + room for heap dump. Rule of thumb: set memory limit to `1.5 × heap size` minimum.

```bash
# Corrected Kubernetes deployment fragment
resources:
  requests:
    memory: "2Gi"
  limits:
    memory: "3Gi"   # 1.5× heap; allows for native + page cache
    cpu: "2"
```

</details>

---

### UNIT 3 — Concurrency & Synchronization (Weeks 7–9)

**Learning Outcomes:**

- Implement mutual exclusion using mutexes, semaphores, and monitor objects
- Reason about deadlock: the four necessary conditions, detection vs prevention
- Solve classic synchronization problems: Dining Philosophers, Readers-Writers
- Understand memory ordering and the Java Memory Model (JMM) happens-before

---

#### Week 7 — Mutual Exclusion & Synchronization Primitives

| Day | Topic                                           | Read                                                             | Do                                                                 |
| --- | ----------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Race conditions — why `counter++` is not atomic | `07_Modern_Java/Ch18_JMM_GC_Deep.md` §1-2                        | Write: 10 threads increment shared counter; measure final value    |
| 2   | Mutexes & spinlocks — test-and-set, ticket lock | `13_Developer_Essentials/19_Concurrency_Models_Coroutines.md` §2 | Implement `Mutex` using `pthread_mutex_init`                       |
| 3   | Semaphores — `sem_init`, `sem_wait`, `sem_post` | `07_Modern_Java/07_CONCURRENCY_PROBLEM_SETS.md` §1-2             | Solve producer-consumer with bounded buffer                        |
| 4   | Monitors — Java `synchronized`, `wait/notify`   | `07_Modern_Java/Ch18_JMM_GC_Deep.md` §3-4                        | Implement a monitor-based bounded queue                            |
| 5   | Lab                                             | —                                                                | **Lab:** Fix 5 intentional race conditions in a provided C program |
| 6–7 | Review + Problem Set OS-PS7                     | —                                                                | PS-7 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`              |

**Section Challenge (mutex deadlock):**

```c
// Two threads, two mutexes: m1 and m2
// Thread A: lock(m1), lock(m2), critical section, unlock(m2), unlock(m1)
// Thread B: lock(m2), lock(m1), critical section, unlock(m1), unlock(m2)
```

Under what interleavings does deadlock occur? Draw the state machine. What is the prevention strategy?

<details>
<summary>Answer</summary>

**Deadlock occurs when:**
Thread A acquires `m1`, Thread B acquires `m2` (or vice versa) before either can acquire the second lock. The threads are now each holding one lock and waiting for the other — circular wait.

```
Thread A: lock(m1) ──────────────────► waiting for m2
Thread B:                lock(m2) ───► waiting for m1
                        ↑__________________↓
                         DEADLOCK
```

**Prevention strategies (pick one):**

1. **Lock ordering:** Always acquire `m1` before `m2` in ALL threads. Thread B becomes: `lock(m1), lock(m2)`. This eliminates circular wait — a partial order exists on lock acquisition.
2. **Try-lock with backoff:** Replace `lock(m2)` with `pthread_mutex_trylock`. On failure, release `m1` and retry.
3. **Single global lock:** Consolidate to one mutex — eliminates deadlock but destroys concurrency.
4. **Holds-before graph:** Kernel-level approach — maintain a wait-for graph, detect cycles, abort one transaction (used in database lock managers).

**Production incident:** The 2019 Kubernetes `etcd` deadlock — two goroutines in `etcd` server tried to acquire raft log mutex and backend boltDB mutex in opposite orders under high disk I/O latency. The cluster stopped accepting writes. The fix enforced a consistent lock order across all code paths (Go-style: `mu.Lock(); defer mu.Unlock()` with a mutex ordering lint rule).

**Constraint:** Lock ordering only works when all code paths are known. Dynamic lock acquisition (e.g., callbacks, plugin systems) makes static ordering impossible — use try-lock + deadlock detection instead.

</details>

---

#### Week 8 — Classic Synchronization Problems

| Day | Topic                                                                  | Read                                                              | Do                                                                                   |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Dining Philosophers — resource hierarchy solution                      | `14_Mental_Models/05_Universal_Problem_Framework.md`              | Implement DP with 5 philosophers in C using semaphores                               |
| 2   | Readers-Writers Problem — readers-preference, writers-preference, fair | `07_Modern_Java/07_CONCURRENCY_PROBLEM_SETS.md` §3                | Implement RW lock in Java; measure reader throughput                                 |
| 3   | Condition variables — signal vs broadcast, spurious wakeups            | `07_Modern_Java/Ch18_JMM_GC_Deep.md` §4                           | Implement a barrier: N threads wait, then all proceed                                |
| 4   | Lamport's bakery algorithm — lock-free ordering                        | `03_Algorithms/18_Bitwise_Trie_Java_Complete.md` (ordering logic) | Implement bakery algorithm; why is it rarely used?                                   |
| 5   | Lab                                                                    | —                                                                 | **Lab:** Implement Dining Philosophers with resource hierarchy AND try-lock fallback |
| 6–7 | Review + Problem Set OS-PS8                                            | —                                                                 | PS-8 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`                                |

**Section Challenge (readers-writers):**

```java
// Java implementation with a flaw
class ReadWriteLock {
    private int readers = 0;
    private boolean writerActive = false;

    public synchronized void readLock() throws InterruptedException {
        while (writerActive) wait();
        readers++;
    }

    public synchronized void readUnlock() {
        readers--;
        notifyAll();
    }

    public synchronized void writeLock() throws InterruptedException {
        while (writerActive || readers > 0) wait();
        writerActive = true;
    }

    public synchronized void writeUnlock() {
        writerActive = false;
        notifyAll();
    }
}
```

**Identify two distinct bugs. When do they manifest?**

<details>
<summary>Answer</summary>

**Bug 1: Readers-writers priority inversion (writer starvation)**

`readLock()` only checks `writerActive`. If `readers` is large and constantly non-zero, a waiting writer may never acquire `writeLock()` because `while (writerActive || readers > 0) wait()` is always true.

Fix: Track waiting writers separately. When a writer requests the lock, no new readers should be admitted. This is the classic **readers-preference vs writers-preference** tradeoff. The solution is a **fair RW lock** that tracks `waitingWriters` and blocks new readers when a writer is waiting.

**Bug 2: Spurious wakeups + missing re-check**

`while (writerActive)` is correct (re-checks on wakeup). However, `notifyAll()` in `readUnlock()` wakes ALL waiters, including writers. If many readers are waiting, they all get woken, read, then `readUnlock()` calls `notifyAll()` again. This creates a **thundering herd** — many threads wake up, all try to re-acquire the monitor, only one succeeds, rest go back to sleep.

Fix: Use `notify()` (wakes exactly one waiter) for `readUnlock()` when you know only readers are waiting. Use `notifyAll()` for `writeUnlock()` when both readers and writers may be waiting.

**Real-world constraint:** Java's `ReentrantReadWriteLock` solves both bugs with a ` Sync` implementation using CAS operations and a wait queue with reader/writer nodes in order. It provides both fair and non-fair modes. Always prefer the standard library implementation over hand-rolled synchronization for production code.

</details>

---

#### Week 9 — Deadlock, Memory Ordering & the Java Memory Model

| Day | Topic                                                                              | Read                                                                  | Do                                                            |
| --- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | Deadlock conditions: mutual exclusion, hold-and-wait, no preemption, circular wait | `14_Mental_Models/08_Debugging_DryRun.md`                             | Prove: breaking any one condition prevents deadlock           |
| 2   | Banker's algorithm — deadlock avoidance with known maximum claims                  | `03_Algorithms/14_Union_Find_DSU_Complete.md` (graph cycle detection) | Implement Banker's algorithm in C                             |
| 3   | Live-lock — non-blocking butprogressless execution                                 | `13_Developer_Essentials/19_Concurrency_Models_Coroutines.md` §3      | Implement: two threads trying to pass each other in a hallway |
| 4   | Java Memory Model — happens-before, volatile, `synchronized`                       | `07_Modern_Java/Ch18_JMM_GC_Deep.md` §5-6                             | Trace: why `volatile boolean flag` fixes visibility           |
| 5   | Lab                                                                                | —                                                                     | **Lab:** Build a deadlock detector using a wait-for graph     |
| 6–7 | Review + Problem Set OS-PS9                                                        | —                                                                     | PS-9 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`         |

**Section Challenge (happens-before):**

```java
class ProducerConsumer {
    private int value = 0;
    private volatile boolean ready = false;

    void producer() {
        value = 42;       // A
        ready = true;     // B
    }

    int consumer() {
        while (!ready);   // C — spin wait
        return value;     // D
    }
}
```

Is `consumer()` guaranteed to return `42`? What is the happens-before chain? What role does `volatile` play?

<details>
<summary>Answer</summary>

**Yes, `consumer()` always returns `42`.** The `volatile` on `ready` establishes a happens-before edge between `producer()` and `consumer()`.

**Happens-before chain:**

```
A (write value=42) → program order within producer → B (write ready=true, volatile write)
                                                                 │
                                             volatile read semantics
                                                                 │
C (read ready=true, volatile read) → program order within consumer → D (read value)
```

**Why `volatile` is necessary (constraint violation):**
Without `volatile`, the JVM is allowed to reorder the writes in `producer()`: `ready=true` could be reordered before `value=42` (as long as it doesn't change program behavior from the JVM's perspective). The CPU may also reorder writes in its store buffer. `ready` being `volatile` prevents both compiler reordering and CPU store-store reordering. The JMM guarantees that a volatile write to `ready` happens-before every subsequent volatile read of `ready`.

**Why the spin-wait works:** `while (!ready)` repeatedly reads `ready` from main memory (not from a register or stale cache) because `ready` is volatile. This is a `volatile` read which has a happens-before relationship with the volatile write.

**Production incident:** The 2011 Java `Thread.interrupt()` visibility bug — an `interrupt()` call from another thread was not immediately visible to the interrupted thread's interrupt flag due to CPU store buffers. The fix was to make the interrupt flag access `volatile`. Always use `volatile` or `AtomicBoolean` for flags shared across threads.

**5WHY: Why does this matter for OS developers?**

| Why   | Answer                                                                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WHY 1 | OS kernels use lock-free data structures for per-CPU data (Linux per-CPU variables use `smp_wmb()`/`smp_rmb()` barriers).                                                              |
| WHY 2 | Without memory barriers, a CPU could observe a write to a data structure before seeing the write that initialised it, causing crashes or data corruption.                              |
| WHY 3 | Linux uses `volatile` only for I/O registers (MMIO). For synchronization, it uses `smp_*_mb()` explicit memory barriers.                                                               |
| WHY 4 | Go's memory model is similar to C11 — explicit `sync/atomic` or `sync.Mutex` is required for cross-goroutine communication.                                                            |
| WHY 5 | Understanding memory ordering is the difference between code that works on a single-core development machine and code that fails intermittently in production on multi-socket servers. |

</details>

---

### UNIT 4 — File Systems & I/O (Weeks 10–12)

**Learning Outcomes:**

- Explain inode structure, directory entries, and free space management
- Implement a simple file system using FUSE or in-memory block layer
- Understand journaling (ext4) and how it guarantees consistency after crash
- Use async I/O (`epoll`/`select`/`poll`) to build event-driven I/O handlers

---

#### Week 10 — File System Structure

| Day | Topic                                                           | Read                                                                            | Do                                                                                |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Files, directories, file descriptors, open file table           | `02_Data_Structures/01d_Stack_Queue.md` §4 (file descriptor as resource handle) | Use `lsof` to trace open file descriptors of a process                            |
| 2   | Inodes — direct/indirect blocks, `stat`, `inode` structure      | Linux `fs/ext4/ext4.h`                                                          | Compute: 4KB block, 4-byte block pointers, 12 direct + 1 indirect → max file size |
| 3   | Directory implementation — linear list vs hash table vs B+ tree | `02_Data_Structures/01f_Trees_Heaps.md` §3 (B+ tree)                            | Trace: `ext4` directory indexing with `debugfs`                                   |
| 4   | Free space management — bitmap vs linked list                   | `02_Data_Structures/01e_HashTable.md` §2 (bitmap for free slots)                | Implement a simple block bitmap allocator                                         |
| 5   | Lab                                                             | —                                                                               | **Lab:** Use `debugfs` / ` dumpe2fs` to inspect an ext4 filesystem                |
| 6–7 | Review + Problem Set OS-PS10                                    | —                                                                               | PS-10 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`                            |

**Section Challenge (inode capacity):**

An ext4 filesystem uses 4KB blocks. Each block pointer is 4 bytes. An inode is 256 bytes.

- Calculate the maximum file size if the inode uses 12 direct blocks, 1 single-indirect, 1 double-indirect, 1 triple-indirect.
- How does `extents` mode (ext4 default) change this calculation?

<details>
<summary>Answer</summary>

**Traditional block pointer calculation:**

- **Direct blocks:** 12 × 4KB = 48KB
- **Single indirect:** 1 block × (4KB / 4 bytes) entries × 4KB = 1 × 1024 × 4KB = **4MB**
- **Double indirect:** 1 block × (4KB / 4 bytes)² × 4KB = 1 × 1024² × 4KB = **4GB**
- **Triple indirect:** 1 block × (4KB / 4 bytes)³ × 4KB = 1 × 1024³ × 4KB = **4TB**

**Max file size:** 48KB + 4MB + 4GB + 4TB ≈ **4.004TB**

**extents mode changes the calculation:**
Extents replaces the traditional block pointer tree with an **extent tree** — each extent describes a contiguous range of blocks as `{logical start, physical start, length}`.

- Each extent node stores up to 4 extent entries (uncompressed) or uses inline extents in the inode itself.
- Maximum file size with extents: limited by the **extent depth**. A 3-level extent tree can address up to ~16TB on a 4KB block system.
- **Advantage:** Extents dramatically reduce metadata overhead for contiguous files. A 1GB contiguous file needs 1 extent entry vs 262,144 block pointers.
- **Constraint:** Extents only work well for contiguous allocation. Fragmented files still need many extent entries.

**Real-world:** PostgreSQL's tablespaces use direct I/O to bypass the page cache and manage its own file layout. ext4's extent mode is ideal for sequential writes but causes fragmentation under heavy random updates ( PostgreSQL's VACUUM reclaims space). The Linux `noatime` mount option removes the need to update inode access times on every read — significant I/O reduction for read-heavy workloads.

</details>

---

#### Week 11 — Journaling & Crash Consistency

| Day | Topic                                                                       | Read                                                                     | Do                                                                      |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 1   | The crash consistency problem — update-in-place vs journaling               | `22_DevOps/00_DevOps_Fundamentals.md` §5                                 | Run: `sync; echo c > /proc/sysrq-trigger` (in VM!) to observe fsck      |
| 2   | Journaling (write-ahead log): tx journal, commit block, checkpoint          | Linux `fs/jbd2/`                                                         | Trace a `write()` system call through ext4's journal                    |
| 3   | Journal modes: journal, ordered, writeback — the consistency/speed tradeoff | `22_DevOps/01_DevOps_Advanced.md` §3                                     | Compare: `data=journal` vs `data=ordered` on the same workload          |
| 4   | RAID levels 0–6 — striping, mirroring, parity, rebuild time                 | `03_Algorithms/05d_Graphs_Advanced_Algos.md` §MST (redundancy reasoning) | Compute: RAID-5 with 5 disks, one fails — what's the rebuild time?      |
| 5   | Lab                                                                         | —                                                                        | **Lab:** Use `dtrace` / `perf` to trace ext4 journal commits under load |
| 6–7 | Review + Problem Set OS-PS11                                                | —                                                                        | PS-11 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`                  |

**Section Challenge (journaling):**

A database writes 3 blocks: A (data block), B (index block), C (journal commit). In `data=ordered` mode (ext4 default), in what order are these written to disk? Why is A written before B? What consistency guarantee does this provide, and what does it NOT guarantee?

<details>
<summary>Answer</summary>

**Write order in `data=ordered` mode:**

1. A (data block) — written to disk first
2. B (index block) — written to disk second
3. C (journal commit) — written last

**Why A before B:** In `data=ordered`, the journal records only metadata (inode, indirect blocks), but all data blocks must be written to disk BEFORE the corresponding metadata is written to the journal. This prevents the "torn write" problem where a crash leaves an index block pointing to uninitialised data blocks.

**Guarantee provided:** After a crash, `e2fsck` (ext4 fsck) can replay the journal or detect inconsistencies and repair them. The filesystem is guaranteed to be in a consistent state — either the full transaction is present (A, B, C all written) or none of it is (journal rolled back).

**What it does NOT guarantee:**

- **Application-level durability:** `data=ordered` only guarantees filesystem consistency, NOT application-level durability. The application may have written to a write-ahead log in the database, but if the application crashes after A,B are on disk but before its own commit record, data may be lost.
- **Power-fail durability:** If the drive has a volatile write cache (common in enterprise HDDs), A,B may be in the drive's cache but not on persistent media even after the OS reports the write as complete. Use `fsync()` or `data=journal` + battery-backed RAID controller.
- **Cross-filesystem atomicity:** Moving a file across filesystems (rename across directories) is not atomic in ext4.

**Real-world incident:** The 2015 MongoDB data loss incident — MongoDB's `journal` directory was on the same ext4 partition as the data files, and `data=ordered` mode meant data blocks reached the drive cache before the journal entry. On a power failure, the drive's volatile cache lost the data blocks but the journal had already committed. fsck saw a committed journal entry pointing to zeroed blocks → silent data loss. The fix: use `data=journal` or store the journal on a separate XFS partition with its own `sync` mount option.

</details>

---

#### Week 12 — Async I/O, epoll & the VFS Layer

| Day | Topic                                                                      | Read                                                          | Do                                                                              |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Synchronous vs asynchronous I/O — `read`/`write` vs `aio_read`/`aio_write` | `07_Modern_Java/Ch05_DateTime_Regex.md` §NIO (async patterns) | Compare: `sync read 1GB` vs `aio_read 1GB` with `libaio`                        |
| 2   | `select`/`poll` — fd_set, O(n) scan, FD limits                             | `22_DevOps/06_TCP_UDP_Deep_Dive.md` §5 (event loop)           | Write: echo server using `select()` on 1000 FDs                                 |
| 3   | `epoll` — red-black tree + wait queue, O(1) notification                   | Linux `fs/eventpoll.c`                                        | Rewrite the echo server with `epoll_create1()` + `EPOLLET` edge-triggered       |
| 4   | VFS (Virtual File System) — superblock, inode, dentry, file abstraction    | Linux `fs/`                                                   | Trace: `open("test.txt")` through VFS layers to ext4                            |
| 5   | Lab                                                                        | —                                                             | **Lab:** Build a high-performance echo server using epoll; benchmark with `wrk` |
| 6–7 | Review + Problem Set OS-PS12                                               | —                                                             | PS-12 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`                          |

**Section Challenge (epoll vs select):**

You are building a chat server that handles 100,000 concurrent connections. You are deciding between `select()`, `poll()`, and `epoll()`.

| Approach   | Max FDs                     | Scalability          | Edge/Level Triggered              |
| ---------- | --------------------------- | -------------------- | --------------------------------- |
| `select()` | FD_SETSIZE (typically 1024) | O(n) scan per call   | Level-triggered                   |
| `poll()`   | Unlimited (array-based)     | O(n) scan per call   | Level-triggered                   |
| `epoll()`  | Unlimited (red-black tree)  | O(1) per ready event | Edge-triggered (default) or level |

Write the code for an `epoll`-based echo server handling 100k connections. Why does `select()` fail at this scale?

```c
// Skeleton: epoll echo server
int epfd = epoll_create1(0);
struct epoll_event ev = { .events = EPOLLIN, .data.fd = listen_fd };
epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);

struct epoll_event events[MAX_EVENTS];
while (1) {
    int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
    for (int i = 0; i < n; i++) {
        int fd = events[i].data.fd;
        if (fd == listen_fd) {
            // accept all incoming, add to epoll
        } else if (events[i].events & EPOLLIN) {
            // read and echo back
            read(fd, buf, sizeof(buf));
            write(fd, buf, n);  // partial write issue!
            // Better: switch to EPOLLOUT after buffering
        }
    }
}
```

**One critical bug in the code above. Identify and fix it.**

<details>
<summary>Answer</summary>

**Critical bug: partial write handling.**

`write(fd, buf, n)` may write fewer than `n` bytes if the socket send buffer is full (back-pressure). The code ignores the return value of `write()`. If `write()` returns `k < n`, only `k` bytes are sent, and the remaining `n-k` bytes are silently dropped.

**Fix: switch to EPOLLOUT mode after a partial write, or use non-blocking I/O with a write buffer:**

```c
// Fixed echo handler using edge-triggered EPOLLOUT
if (events[i].events & EPOLLIN) {
    ssize_t r = read(fd, buf, sizeof(buf));
    if (r > 0) {
        memcpy(write_buf[fd], buf, r);  // persistent write buffer
        events[i].events = EPOLLOUT;     // arm for output
        epoll_ctl(epfd, EPOLL_CTL_MOD, fd, &events[i]);
    } else if (r == 0) {
        close(fd);
    }
} else if (events[i].events & EPOLLOUT) {
    ssize_t w = write(fd, write_buf[fd] + write_offset[fd],
                      write_len[fd] - write_offset[fd]);
    if (w > 0) {
        write_offset[fd] += w;
        if (write_offset[fd] == write_len[fd]) {
            // all data sent; switch back to read mode
            events[i].events = EPOLLIN;
            epoll_ctl(epfd, EPOLL_CTL_MOD, fd, &events[i]);
        }
    }
}
```

**Why `select()` fails at 100k connections:**

- `select()` uses `FD_SET` (a bitset of size `FD_SETSIZE`, often 1024). Even if you recompile the kernel with a larger limit, `select()` copies the entire bitset to kernel space and scans it linearly — O(n) per call where n = 100,000.
- At 100k FDs and 10k events/second, this is 1 billion operations/second just for the kernel scan.
- `epoll` uses a red-black tree for FD registration (O(log n) insert/remove) and a wait queue for sleeping threads — only O(1) per event notification. The scanning cost is amortised to only the ready FDs.

**5WHY: Why does this matter?**

| Why   | Answer                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WHY 1 | High-throughput servers (Nginx, Redis, Envoy) use `epoll`/`kqueue` specifically to handle 100k+ connections without O(n) scan overhead.                |
| WHY 2 | C10k problem (and now C10M) describes the transition from select/poll to event-driven I/O.                                                             |
| WHY 3 | Go's netpoller and Java NIO's `Selector` are higher-level abstractions built on epoll/kqueue.                                                          |
| WHY 4 | Misusing `select()` on a high-concurrency server causes latency spikes and CPU saturation from constant O(n) scanning.                                 |
| WHY 5 | Connection pool exhaustion (too many FDs) also causes "too many open files" errors — always set `ulimit -n` and `/proc/sys/fs/file-max` appropriately. |

</details>

---

### UNIT 5 — OS Security & Containers (Weeks 13–14)

**Learning Outcomes:**

- Explain cgroups and namespaces: what isolation each provides and what it does NOT provide
- Implement seccomp profiles and understand Linux capabilities
- Compare containers vs VMs: the security tradeoff, attack surface, and escape vulnerabilities
- Design a secure container runtime configuration

---

#### Week 13 — cgroups & Namespace Isolation

| Day | Topic                                                             | Read                                                 | Do                                                                      |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | cgroups v2 hierarchy — memory, CPU, I/O controllers               | `13_Developer_Essentials/03_Docker_Containers.md` §1-2             | List your current cgroups: `cat /sys/fs/cgroup/cgroup.controllers`      |
| 2   | Namespace types — PID, network, mount, user, UTS, IPC             | `13_Developer_Essentials/03_Docker_Containers.md` §3 | Run `unshare -p -f --mount-proc` and observe isolated PID namespace     |
| 3   | Container memory limits — `memory.max`, `memory.high`, OOM events | `22_DevOps/01_DevOps_Advanced.md` §5                 | Trigger OOM in a container: `stress --vm 1 --vm-bytes 90%`              |
| 4   | CPU cgroup — CPUacct, CFS bandwidth control, CPU throttle         | `13_Developer_Essentials/03_Docker_Containers.md` §2 | Measure: `docker run --cpus=0.5` actual CPU usage with `top`            |
| 5   | Lab                                                               | —                                                    | **Lab:** Build a custom container using `unshare` + `runc` from scratch |
| 6–7 | Review + Problem Set OS-PS13                                      | —                                                    | PS-13 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`                  |

**Section Challenge (cgroup OOM):**

A Kubernetes pod has:

```yaml
resources:
  limits:
    memory: "512Mi"
  requests:
    memory: "256Mi"
```

The container runs a Node.js process with `--max-old-space-size=400m`. Under what conditions will the container be OOMKilled? Trace the exact sequence of kernel events when memory pressure triggers the kill.

<details>
<summary>Answer</summary>

**Conditions for OOMKill:**

- The container's cgroup memory usage exceeds `memory.max` (set to 512Mi by the limit).
- The container's cgroup memory usage exceeds `memory.high` (soft limit, set slightly above `requests` = 256Mi by Kubernetes' pod cgroup settings).
- The kernel's global memory is also under pressure (cgroup v2 `memory.max` only limits the container; if the host is not in OOM, the container process may just be throttled via `memory.high`).

**Sequence of kernel events:**

```
1. Process allocates → cgroup usage increases
2. Usage > memory.high (soft limit):
   → kernel invokes throttling (memory.high)
   → process is slowed (excess pages are reclaimed aggressively)
3. Usage > memory.max (hard limit):
   → kernel attempts synchronous memory reclaim in the cgroup
   → if reclaim fails: OOM killer invoked IN the cgroup
4. OOM killer selects a "victim" process (heuristic: highest memory usage, oom_score)
5. Victim is sent SIGKILL (cannot be caught or ignored)
6. cgroup's memory.peak is updated; OOM event written to cgroup.events
7. Kubernetes kubelet detects the exit code 137 (SIGKILL from OOM)
8. kubelet marks pod as OOMKilled; container restart policy applies
```

**Constraint violation:** `--max-old-space-size=400m` leaves only 112Mi for: V8 external memory, stack, code space, and OS overhead. Under GC pressure or during async I/O buffer allocation, the process may push past 512Mi. **Correct setting:** `--max-old-space-size=350m` (leave ~30% headroom) or set `memory.limit_in_bytes` to at least `1.3 × heap`.

**Real-world incident:** The 2017 Docker escape via cgroup memory `mmap` — a container with `memory.max` set but no `memory.memsw.max` could trigger an OOM within the container but the kernel's global OOM killer could still target processes inside the container (not just the cgroup-limited process). This was a cgroup v1 issue where `memory.memsw` isolation was not enforced. The fix: always set both `memory.max` AND `memory.swap.max` in cgroup v2.

</details>

---

#### Week 14 — Linux Capabilities, seccomp & Container Security

| Day | Topic                                                                 | Read                                                  | Do                                                                    |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | Privileged vs unprivileged — capability sets (CAP_SYS_ADMIN, etc.)    | `13_Developer_Essentials/08_Security_Fundamentals.md` | List your capabilities: `capsh --print`                               |
| 2   | seccomp — whitelist syscalls, `SECCOMP_RET_ERRNO`                     | Linux `seccomp(2)` man page                           | Write: seccomp filter that allows only `read,write,exit,_exit`        |
| 3   | Container vs VM security — side-channel attacks, hypervisor isolation | `13_Developer_Essentials/03_Docker_Containers.md` §4-5              | Draw: attack surface comparison table                                 |
| 4   | Rootless containers — user namespaces, `newuidmap`                    | `13_Developer_Essentials/03_Docker_Containers.md` §6  | Run `docker --userns=host` and verify no CAP_SYS_ADMIN in container   |
| 5   | Lab                                                                   | —                                                     | **Lab:** Build a minimal seccomp profile for nginx using `libseccomp` |
| 6–7 | Review + Problem Set OS-PS14                                          | —                                                     | PS-14 in `CSE401_Operating_Systems/01_PROBLEM_SETS.md`                |

**Section Challenge (capability least privilege):**

A container needs to: bind to port 80, read `/etc/passwd`, mount a tmpfs, and send UDP packets to port 53 for DNS.

Which capabilities does it actually need? List the minimum set. For each, state what a compromised container COULD do if it also held `CAP_SYS_ADMIN`.

<details>
<summary>Answer</summary>

**Minimum capabilities:**

| Capability             | Required For                    | Rationale                                                                    |
| ---------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| `CAP_NET_BIND_SERVICE` | Bind to port < 1024             | Linux requires this to bind ports below 1024 as non-root                     |
| `CAP_NET_RAW`          | Send raw UDP packets to port 53 | Required for DNS resolution; `CAP_NET_RAW` also allows forging any IP packet |
| `CAP_SYS_ADMIN`        | Mount tmpfs                     | Required for `mount(2)`. This is the most dangerous capability.              |

**What it does NOT need:** `CAP_DAC_OVERRIDE` (bypass file permission checks) — root in a user namespace can read `/etc/passwd` normally. `CAP_SYS_PTRACE` — not needed for DNS. `CAP_NET_ADMIN` — not needed (only for interface configuration, not raw sockets).

**What a compromised container with `CAP_SYS_ADMIN` can do:**

```
1. Mount a malicious /proc (hide processes)
2. Load kernel modules (inject rootkit via modprobe)
3. Create a cgroup trigger OOM kill on other containers
4. Pivot to host namespace: nsenter --all --target 1 (if host shares ns)
5. Use /dev/mem, /dev/kmem for direct hardware access
6. Remount /sys as rw and modify sysfs controls
```

**Security hardening:**

```yaml
# Kubernetes pod security context — minimum necessary
securityContext:
  capabilities:
    drop:
      - ALL
    add:
      - NET_BIND_SERVICE # only this for web server on port 80
      - NET_RAW # only this for DNS
  privileged: false
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

**5WHY: Why does this matter?**

| Why   | Answer                                                                                                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------- |
| WHY 1 | Container escapes (runC CVE-2019-5736, CVE-2021-30465) leverage `CAP_SYS_ADMIN` to escape to the host.                      |
| WHY 2 | The principle of least privilege means if a microservice doesn't need to mount filesystems, it should drop `CAP_SYS_ADMIN`. |
| WHY 3 | A compromised pod with `CAP_NET_RAW` can launchARP spoofing attacks against the cluster pod network.                        |
| WHY 4 | Kubernetes Pod Security Standards (PSS) enforce capability restrictions at the cluster level.                               |
| WHY 5 | Defense in depth: capabilities are one layer; seccomp, AppArmor/SELinux, and network policies provide additional isolation. |

</details>

---

### UNIT 6 — Capstone & Review (Weeks 15–16)

**Learning Outcomes:**

- Build a complete MLFQ scheduler from scratch with syscall tracing
- Trace program execution through OS subsystems (process creation → scheduling → memory allocation → I/O)
- Integrate knowledge across all 5 units in one project

---

#### Week 15 — Capstone: Build a Toy MLFQ Scheduler

| Day | Topic                                                         | Read                                                             | Do                                                                      |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | MLFQ design — queue count, quantum sizes, priority boosting   | Linux `kernel/sched/deadline.c`, `kernel/sched/fair.c`           | Read CFS scheduler source; note key data structures                     |
| 2   | Implementing the MLFQ — PCB, queue structure, timer interrupt | `02_Data_Structures/01d_Stack_Queue.md` §5 (priority queue)      | Design: PCB fields needed for MLFQ state tracking                       |
| 3   | Syscall tracing — `ptrace`, `strace`, `perf`                  | `22_DevOps/04_Networking_Complete.md` §Performance tracing       | Trace: run MLFQ simulator under `strace -c`; count `waitpid` calls      |
| 4   | MLFQ implementation — round-robin within queue, aging         | `13_Developer_Essentials/19_Concurrency_Models_Coroutines.md` §2 | Implement: `mlfq_run()` with aging after N ticks in lower queue         |
| 5   | Lab                                                           | —                                                                | **Capstone Lab Part A:** MLFQ scheduler skeleton in C with test harness |
| 6–7 | Capstone Lab Part B                                           | —                                                                | Implement `mlfq_enqueue`, `mlfq_dequeue`, `mlfq_tick`, `mlfq_boost`     |

**Capstone Project: MLFQ Scheduler in C**

**Specification file:** `CSE401_Operating_Systems/CAPSTONE_MLFQ.md`

**Core requirements:**

```c
// PCB structure for MLFQ
typedef struct {
    int pid;                    // process ID
    int arrival_time;           // when process enters the system
    int total_cpu_time;         // total CPU time used
    int current_queue;          // 0=highest, 3=lowest
    int ticks_in_queue;         // ticks since last demotion check
    int state;                  // NEW, READY, RUNNING, WAITING, TERMINATED
    int remaining_time;         // time remaining to complete
    int cpu_burst_history[10];  // recent CPU burst lengths (for I/O detection)
    int io_burst_history[10];   // recent I/O burst lengths
} pcb_t;

// MLFQ structure
typedef struct {
    pcb_t* queues[4];           // 4 priority queues
    int quantums[4];            // time quantum per queue: {8, 16, 32, FCFS}
    int boost_counter;          // ticks before priority boost
    pcb_t* running;             // currently running process
    int current_time;           // simulation time
} mlfq_t;

// Core functions to implement
mlfq_t* mlfq_init();
void mlfq_enqueue(mlfq_t* m, pcb_t* p);
pcb_t* mlfq_dequeue(mlfq_t* m);
void mlfq_tick(mlfq_t* m);      // called every simulation tick
void mlfq_boost(mlfq_t* m);     // priority boost
void mlfq_print_stats(mlfq_t* m);
```

**Syscall tracing requirement:**
Instrument your scheduler to trace all simulated syscalls:

```c
// Syscall trace entry
typedef struct {
    int pid;
    int time;
    char* syscall_name;
    int args[3];
    int return_value;
} trace_entry_t;

// Trace buffer with circular buffer
trace_entry_t trace_buf[TRACE_SIZE];
int trace_head = 0;
int trace_count = 0;

void trace_syscall(int pid, char* name, int a0, int a1, int a2, int ret) {
    trace_buf[trace_head % TRACE_SIZE] = (trace_entry_t){
        .pid = pid, .time = current_time(), .syscall_name = name,
        .args = {a0, a1, a2}, .return_value = ret
    };
    trace_head++;
    trace_count++;
}

// Usage: trace all state transitions
trace_syscall(p->pid, "wait", 0, 0, 0, 0);
trace_syscall(p->pid, "schedule", p->current_queue, m->current_time, 0, 0);
trace_syscall(p->pid, "io_request", BLOCKED, 0, 0, 0);
trace_syscall(p->pid, "io_complete", p->pid, 0, 0, 0);
```

**Acceptance criteria:**

- [ ] All 4 queues with correct quantums implemented
- [ ] Processes demote to lower queue after exhausting quantum
- [ ] Priority boost every `boost_counter` ticks
- [ ] I/O-bound processes detected (burst < quantum/2 → promote faster)
- [ ] Syscall trace buffer records all state transitions
- [ ] `perf stat` shows correct CPU utilization vs MLFQ fairness
- [ ] Test harness with 5 mixed workload scenarios (CPU-bound, I/O-bound, burst)
- [ ] All code compiles with `gcc -Wall -Wextra -pedantic -std=c11`
- [ ] Unit tests pass for each queue operation

**Challenge extensions (for extra credit):**

1. Implement **stride scheduling** (proportional-share) as an alternative to MLFQ and compare fairness.
2. Add **energy-aware scheduling**: track CPU frequency (`cpufreq`) and adjust quantum based on power budget.
3. Implement the scheduler as a **loadable kernel module** (LKM) that intercepts `schedule()`.

---

#### Week 16 — Integration Review & Exam Prep

| Day | Topic                                                             | Read                                                     | Do                                                                      |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Cross-unit integration: process → memory → I/O → network          | All unit README sections                                 | Draw the complete flow: `fork()` → memory allocation → I/O → `wait()`   |
| 2   | OS in production — reading kernel logs, `dmesg`, `strace`, `perf` | `13_Developer_Essentials/12_Monitoring_Observability.md` | Profile a real program with `perf record -g ./my_program`               |
| 3   | Review: scheduling algorithms (table comparison)                  | Weeks 1–3                                                | Create a decision matrix: when to use each scheduler                    |
| 4   | Review: memory management (table comparison)                      | Weeks 4–6                                                | Draw TLB + page table + physical memory diagram end-to-end              |
| 5   | Review: synchronization (when to use which primitive)             | Weeks 7–9                                                | Create a flowchart: mutex vs semaphore vs monitor vs condition variable |
| 6   | Review: file system & I/O (decision guide)                        | Weeks 10–12                                              | Compare: ext4 vs XFS vs Btrfs vs ZFS for specific workloads             |
| 7   | Capstone presentations + Exam review                              | —                                                        | Submit MLFQ capstone; review all problem sets                           |

**Final Review: Complete System Call Flow**

Trace the complete lifecycle of a file read through all OS layers:

```
User space                          Kernel space
   │                                     │
   │  read(fd, buf, 1024)                │
   │────────────────────────────────────►│ VFS: sys_read()
   │                                     │  ├─ check fd → struct file*
   │                                     │  ├─ file->f_op->read()
   │                                     │  └─ reach ext4_file_read_iter()
   │                                     │
   │                                     │  Page cache check (inode->i_data)
   │                                     │  ├─ HIT: copy_to_user() → return
   │                                     │  └─ MISS: submit_bh() → bio
   │                                     │       └─ I/O scheduler (noop/deadline/cfq)
   │                                     │            └─ block device driver
   │                                     │                 └─ PCIe NVMe DMA
   │                                     │
   │  ←─── 1024 bytes copied ─────────────│ copy_to_user()
   │  returns 1024
   │
   ▼
User space
```

**5WHY: End-to-end production trace-back**

| Why   | Answer                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WHY 1 | A slow `read()` on a database file traced back to: NVMe drive firmware bug (DMA not completing), resolved by `hdparm -W0 /dev/nvme0n1` (disable write cache).      |
| WHY 2 | The I/O scheduler (cfq) was causing latency spikes for the database's fsync pattern. Switched to `deadline` scheduler: removed the 40ms latency percentile spikes. |
| WHY 3 | ext4's `data=journal` was causing 2× write amplification. Switched to `data=ordered` + battery-backed RAID controller write cache.                                 |
| WHY 4 | The page cache was being evicted by a log rotation process (another container on the same host). Moved database to a dedicated cgroup with `memory.min=8G`.        |
| WHY 5 | The kernel parameter `vm.dirty_ratio` was too aggressive (20%), causing writeback to block reads. Tuned to `vm.dirty_ratio=5, vm.dirty_background_ratio=2`.        |

---

## 📋 Assessment Overview

| Assessment                                        | Unit | Weight   | Type                 |
| ------------------------------------------------- | ---- | -------- | -------------------- |
| Problem Set OS-PS1 (Processes & System Calls)     | 1    | 5%       | Written + code       |
| Problem Set OS-PS2 (Scheduling)                   | 1    | 5%       | Written              |
| Problem Set OS-PS3 (Threads & Context Switch)     | 1    | 5%       | Code + analysis      |
| Problem Set OS-PS4 (Paging & Address Translation) | 2    | 5%       | Written + trace      |
| Problem Set OS-PS5 (Page Faults & Demand Paging)  | 2    | 5%       | Code simulation      |
| Problem Set OS-PS6 (Thrashing & Replacement)      | 2    | 5%       | Written + simulation |
| Problem Set OS-PS7 (Mutexes & Semaphores)         | 3    | 5%       | Code                 |
| Problem Set OS-PS8 (Sync Problems)                | 3    | 5%       | Code + analysis      |
| Problem Set OS-PS9 (Deadlock & JMM)               | 3    | 5%       | Written + code       |
| Problem Set OS-PS10 (File System Structure)       | 4    | 5%       | Written              |
| Problem Set OS-PS11 (Journaling & RAID)           | 4    | 5%       | Written + analysis   |
| Problem Set OS-PS12 (Async I/O & epoll)           | 4    | 5%       | Code                 |
| Problem Set OS-PS13 (cgroups & Namespaces)        | 5    | 5%       | Written + lab        |
| Problem Set OS-PS14 (Capabilities & seccomp)      | 5    | 5%       | Written + lab        |
| **MLFQ Capstone**                                 | 6    | 15%      | Full project         |
| **Final Exam**                                    | All  | 15%      | Written + practical  |
| **Total**                                         |      | **100%** |                      |

---

## 📚 Reference Stack

### Primary Texts

- Silberschatz, Galvin, Gagne — _Operating System Concepts_ (10th ed.)
- Tanenbaum & Bos — _Modern Operating Systems_ (4th ed.)
- Love — _Linux Kernel Development_ (3rd ed.)

### Online References

- Linux kernel source: `kernel/sched/`, `mm/`, `fs/`, `net/`
- Linux `man` pages: `fork(2)`, `execve(2)`, `mmap(2)`, `epoll_ctl(2)`, `seccomp(2)`, `cgroups(7)`
- LWN.net kernel articles on CFS, memory management, cgroups

### Cross-References in This Course

| Module                                                        | Relevant Sections                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `13_Developer_Essentials/19_Concurrency_Models_Coroutines.md` | Goroutine scheduler model; compare with OS thread scheduler                 |
| `07_Modern_Java/Ch18_JMM_GC_Deep.md`                          | JMM happens-before, volatile, synchronized — OS memory model applied to JVM |
| `07_Modern_Java/07_CONCURRENCY_PROBLEM_SETS.md`               | Java concurrency problems — map to OS primitives                            |
| `13_Developer_Essentials/03_Docker_Containers.md`                           | Container runtime; cgroup/namespace implementation                          |
| `22_DevOps/01_DevOps_Advanced.md`                             | Memory limits, OOM, resource isolation in production                        |
| `02_Data_Structures/01a_Memory_Foundations.md`                | Memory layout — prerequisite for paging                                     |
| `02_Data_Structures/01d_Stack_Queue.md`                       | Queue — used in MLFQ, work queues, I/O scheduling                           |
| `02_Data_Structures/01f_Trees_Heaps.md`                       | Heap — priority queue scheduling; B+ trees in file systems                  |
| `14_Mental_Models/08_Debugging_DryRun.md`                     | Systematic debugging — trace OS subsystem failures                          |
| `14_Mental_Models/09_Complexity_Intuition.md`                 | Throughput/latency reasoning for scheduler comparison                       |

---

## 🔬 Section Challenge Answer Keys

All `<details>` blocks in this document contain the official answer key for their respective Section Challenge. Do not read them before attempting the challenge.

---

[← Back to Semester 4 Overview](../README.md) | [CSE402 Computer Networks →](../CSE402_Computer_Networks/README.md) | [CSE403 Cryptography →](../CSE403_Cryptography_And_Security/README.md) | [CSE404 Information Retrieval →](../CSE404_Information_Retrieval/README.md)
