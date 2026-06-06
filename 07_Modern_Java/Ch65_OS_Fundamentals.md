**Navigation**: [< Previous](Ch57_Spring_Security_Internals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch66_Event_Sourcing_CQRS.md)

# 🖥️ Chapter 39 — OS Fundamentals Every Backend Developer MUST Know

**"Your Spring Boot app runs ON an operating system. When your API is slow, it might not be your code — it's context switching between 200 threads, page faults from running out of physical memory, or file descriptor exhaustion from unclosed connections. You can't diagnose what you don't understand."**

---

## Table of Contents

1. [Process vs Thread — What Actually Runs Your Code](#1-process-vs-thread--what-actually-runs-your-code)
2. [How CPU Scheduling Works — Who Gets to Run](#2-how-cpu-scheduling-works--who-gets-to-run)
3. [Context Switching — The Hidden Cost](#3-context-switching--the-hidden-cost)
4. [Virtual Memory — Why Programs Think They Have Unlimited RAM](#4-virtual-memory--why-programs-think-they-have-unlimited-ram)
5. [Page Faults — When Memory Isn't Where You Think](#5-page-faults--when-memory-isnt-where-you-think)
6. [Threads vs Async I/O — Two Models for Concurrency](#6-threads-vs-async-io--two-models-for-concurrency)
7. [File Descriptors — Why "Too Many Open Files" Happens](#7-file-descriptors--why-too-many-open-files-happens)
8. [System Calls — How Your App Talks to the OS](#8-system-calls--how-your-app-talks-to-the-os)
9. [I/O Models — Blocking, Non-Blocking, Multiplexing](#9-io-models--blocking-non-blocking-multiplexing)
10. [Signals and Process Lifecycle](#10-signals-and-process-lifecycle)
11. [How the Network Stack Processes Your API Call](#11-how-the-network-stack-processes-your-api-call)
12. [OS Concepts in Java — Direct Mapping](#12-os-concepts-in-java--direct-mapping)
13. [Key Numbers Every Developer Should Know](#13-key-numbers-every-developer-should-know)

---

## 1. Process vs Thread — What Actually Runs Your Code

```
  PROCESS:
  ════════
  An instance of a running program.
  Has its OWN: address space, file descriptors, PID, memory allocation.
  
  When you run: java -jar app.jar
  → OS creates a PROCESS:
  
  ┌── Process (PID 1234) ──────────────────────────────────────────────────┐
  │                                                                         │
  │  ┌── Virtual Address Space ──────────────────────────────────────────┐ │
  │  │                                                                    │ │
  │  │  ┌─────────┐  High addresses (e.g., 0xFFFF...)                   │ │
  │  │  │  Stack   │  ← Local variables, method call frames              │ │
  │  │  │   ↓      │    (grows downward)                                 │ │
  │  │  ├─────────┤                                                      │ │
  │  │  │ (free)  │  ← Unused address space                              │ │
  │  │  ├─────────┤                                                      │ │
  │  │  │  Heap   │  ← Objects (new User()), managed by GC               │ │
  │  │  │   ↑      │    (grows upward, -Xmx controls max)               │ │
  │  │  ├─────────┤                                                      │ │
  │  │  │  BSS    │  ← Uninitialized static variables                    │ │
  │  │  ├─────────┤                                                      │ │
  │  │  │  Data   │  ← Initialized static variables                      │ │
  │  │  ├─────────┤                                                      │ │
  │  │  │  Text   │  ← Compiled code (JIT-compiled bytecode)             │ │
  │  │  └─────────┘  Low addresses (0x0000...)                           │ │
  │  │                                                                    │ │
  │  └────────────────────────────────────────────────────────────────────┘ │
  │                                                                         │
  │  File Descriptors: [0=stdin, 1=stdout, 2=stderr, 3=socket, ...]       │
  │  PID: 1234                                                             │
  │  Parent PID: 1 (init/systemd)                                          │
  │  State: RUNNING                                                        │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘
  
  
  THREAD:
  ═══════
  A unit of execution WITHIN a process.
  Shares: address space, heap, file descriptors, code.
  Has its OWN: stack, program counter, registers, thread ID.
  
  Your Spring Boot app with Tomcat:
  
  ┌── Process (java -jar app.jar) ─────────────────────────────────────────┐
  │                                                                         │
  │  SHARED: Heap (all objects), Code, File Descriptors                    │
  │                                                                         │
  │  ┌─── Thread: main ──────┐                                            │
  │  │ Stack: 1MB             │  ← Started Spring context                  │
  │  │ PC: 0x7fff...          │                                            │
  │  └────────────────────────┘                                            │
  │  ┌─── Thread: http-nio-8080-exec-1 ──┐                                │
  │  │ Stack: 1MB                          │  ← Handling GET /api/users    │
  │  │ PC: UserController.getUsers()       │                                │
  │  └─────────────────────────────────────┘                                │
  │  ┌─── Thread: http-nio-8080-exec-2 ──┐                                │
  │  │ Stack: 1MB                          │  ← Handling POST /api/orders  │
  │  │ PC: OrderService.createOrder()      │                                │
  │  └─────────────────────────────────────┘                                │
  │  ┌─── Thread: HikariPool-1 ──────────┐                                │
  │  │ Stack: 1MB                          │  ← Managing DB connections    │
  │  │ PC: waiting on connection return    │                                │
  │  └─────────────────────────────────────┘                                │
  │  ┌─── Thread: GC-thread ─────────────┐                                │
  │  │ Stack: 1MB                          │  ← Garbage collection         │
  │  └─────────────────────────────────────┘                                │
  │                                                                         │
  │  Total: ~200 threads for typical Spring Boot app                       │
  │  (Tomcat: 200     HikariCP: 10     GC: 4-8    Schedulers: varies)     │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘
  
  
  WHY THREADS NOT PROCESSES:
  ══════════════════════════
  Thread creation: ~1ms, ~1MB memory (stack)
  Process creation: ~100ms, full address space copy (or COW)
  Thread context switch: ~1-10μs (shared address space)
  Process context switch: ~10-100μs (TLB flush, page table swap)
```

---

## 2. How CPU Scheduling Works — Who Gets to Run

```
  THE PROBLEM:
  ════════════
  Your server has 4 CPU cores.
  Your Spring Boot app has 200+ threads.
  200 threads, 4 cores → 50 threads per core competing for time.
  
  The SCHEDULER decides who gets CPU time.
  
  
  LINUX CFS (Completely Fair Scheduler):
  ══════════════════════════════════════
  
  ┌─── CPU Core 0 ───────────────────────────────────────────┐
  │                                                           │
  │  Currently running: http-nio-exec-1                       │
  │                                                           │
  │  Run Queue (Red-Black Tree, sorted by vruntime):          │
  │                                                           │
  │       ┌──── vruntime: 100ms ────┐                        │
  │       │      /            \      │                        │
  │  ┌────────────┐     ┌────────────┐                        │
  │  │vrt: 50ms   │     │vrt: 150ms  │                        │
  │  │exec-2      │     │GC-thread   │                        │
  │  │(leftmost!) │     │            │                        │
  │  └────────────┘     └────────────┘                        │
  │                                                           │
  │  Rule: LOWEST vruntime gets to run next                   │
  │  vruntime = actual runtime × (weight factor)              │
  │  Higher priority → smaller weight → vruntime grows slower │
  │                                                           │
  └───────────────────────────────────────────────────────────┘
  
  
  SCHEDULING DECISIONS FOR YOUR APP:
  ══════════════════════════════════
  
  1. Tomcat request thread is CPU-bound (computing):
     → Scheduler gives it a time slice (1-10ms)
     → After time slice expires → preempted → back to run queue
     → Another thread gets to run
  
  2. Thread does I/O (database query):
     → Thread calls read() on socket
     → OS moves thread to WAITING state
     → Thread removed from run queue (not using CPU!)
     → When data arrives: OS moves thread back to RUNNABLE
     → Scheduler picks it up when a core is free
  
  3. Thread calls Thread.sleep() or Object.wait():
     → Thread moves to SLEEPING/WAITING
     → Not in run queue
     → Timer interrupt or notify() → back to RUNNABLE
  
  
  THREAD STATES (OS view):
  ════════════════════════
  
  RUNNING ← actually executing on CPU
     ↕ (preemption / scheduled)
  RUNNABLE ← ready to run, waiting for CPU
     ↕ (I/O request / I/O complete)
  WAITING ← blocked on I/O, lock, sleep
     ↕ (terminated)
  ZOMBIE ← finished but parent hasn't collected exit status
```

---



🔬 **Section Challenge — 2. How CPU Scheduling Works — Who Gets to Run**

**Challenge 1 (Reasoning):** If a Java thread enters a `synchronized` block and the lock is already held, what state does the thread transition into, and how does this affect the CPU scheduler?
<details><summary>Answer</summary>

Standard I/O requires the OS to read data from disk into Kernel Space, copy it to User Space (JVM buffer), and then copy it back to Kernel Space to send over a socket. `transferTo()` uses Zero-Copy DMA (Direct Memory Access). The OS transfers data directly from the disk buffer to the network socket buffer entirely within Kernel Space. It bypasses the JVM memory and avoids expensive CPU context switches between User and Kernel mode.
</details>


## 3. Context Switching — The Hidden Cost

```
  WHAT HAPPENS ON A CONTEXT SWITCH:
  ═════════════════════════════════
  
  Thread A is running → Time slice expires or Thread A blocks on I/O
  
  1. SAVE Thread A's state:
     ├── General registers (RAX, RBX, RCX, RDX, RSI, RDI, etc.)
     ├── Stack pointer (RSP)
     ├── Program counter (RIP) — where it was executing
     ├── Flags register (RFLAGS)
     └── FPU/SSE/AVX registers (floating point state)
     → All saved to Thread A's kernel stack (Thread Control Block)
  
  2. SWITCH to Thread B:
     ├── Restore Thread B's registers from its kernel stack
     ├── Restore stack pointer → now using Thread B's stack
     ├── Restore program counter → jump to where Thread B left off
     └── If different process: flush TLB (Translation Lookaside Buffer)
  
  3. HIDDEN COSTS (often larger than the switch itself):
     ├── CPU cache pollution: 
     │   Thread A had its working data in L1/L2 cache
     │   Thread B needs DIFFERENT data → cache misses!
     │   L1 miss: 1ns → L2: 4ns → L3: 12ns → RAM: 100ns
     │
     ├── TLB misses (if process switch):
     │   TLB caches virtual→physical page mappings
     │   Different process = different page table = TLB flush
     │   Each memory access after flush: TLB miss → page table walk
     │
     └── Pipeline flush:
         CPU was speculatively executing Thread A's instructions
         All that speculative work is thrown away


  THE COST IN NUMBERS:
  ════════════════════
  
  Direct cost (save/restore registers): ~1-2 μs
  Indirect cost (cache/TLB pollution): ~5-50 μs
  
  If 200 threads on 4 cores and each blocks after 1ms of work:
  → 200 context switches per millisecond
  → 200 × 10μs = 2ms of overhead per ms of work
  → That's 2/3 of CPU time wasted on switching!
  
  THIS IS WHY:
  - Virtual threads (Project Loom) exist: millions of virtual threads mapped to few OS threads
  - WebFlux/reactive exists: one thread handles many connections, no blocking
  - HikariCP pool is small (10): fewer threads = fewer switches
  - Node.js uses single thread + event loop: zero context switching for app code
```

---



🔬 **Section Challenge — 3. Context Switching — The Hidden Cost**

**Challenge 1 (Reasoning):** Why do heavily I/O-bound applications (like typical web servers) experience severe performance degradation when scaled to 10,000 concurrent threads, and how do Virtual Threads (Project Loom) solve this?
<details><summary>Answer</summary>

10,000 OS threads require ~10GB of memory just for stacks. More importantly, when threads constantly block on I/O, the OS performs thousands of context switches per second, destroying CPU caches (TLB/L1/L2 pollution) and wasting CPU cycles just swapping context. Virtual Threads solve this by mapping millions of lightweight threads onto a small pool of OS carrier threads. When a Virtual Thread blocks on I/O, the JVM 'unmounts' it in user-space without triggering an OS-level context switch.
</details>


## 4. Virtual Memory — Why Programs Think They Have Unlimited RAM

```
  THE ILLUSION:
  ═════════════
  
  Your Java process uses -Xmx4g (4GB heap).
  Server has 8GB physical RAM.
  10 Java services running = 40GB needed, but only 8GB exists!
  
  How? VIRTUAL MEMORY.
  
  Each process gets its own VIRTUAL address space (e.g., 128TB on 64-bit Linux).
  The OS maps virtual pages → physical frames ON DEMAND.


  ┌── Process 1 (Virtual Memory) ──┐     ┌── Physical RAM ───────────┐
  │                                 │     │                            │
  │  Virtual Page 0 ────────────────────→ Physical Frame 7            │
  │  Virtual Page 1 ────────────────────→ Physical Frame 2            │
  │  Virtual Page 2 (not yet used)  │     │ Physical Frame 3 (free)   │
  │  Virtual Page 3 ────────────────────→ Physical Frame 9            │
  │  Virtual Page 4 (swapped out)   │──→  │ [on disk: swap partition]  │
  │                                 │     │                            │
  └─────────────────────────────────┘     │ Physical Frame 5 ←──┐    │
                                          │                      │    │
  ┌── Process 2 (Virtual Memory) ──┐     │                      │    │
  │                                 │     │                      │    │
  │  Virtual Page 0 ────────────────────→ Physical Frame 0       │    │
  │  Virtual Page 1 ────────────────────────────────────────────┘    │
  │  Virtual Page 2 ────────────────────→ Physical Frame 4            │
  │                                 │     │                            │
  └─────────────────────────────────┘     └────────────────────────────┘
  
  
  PAGE TABLE TRANSLATION:
  ═══════════════════════
  
  virtual address = 0x00007fff12345678
       │
       ├── Top bits → Page Table Level 4 index (PML4)
       ├── Next bits → Page Table Level 3 index (PDPT)
       ├── Next bits → Page Table Level 2 index (PD)
       ├── Next bits → Page Table Level 1 index (PT)
       └── Bottom 12 bits → Offset within 4KB page
  
  4-level page table walk on every memory access?
  TOO SLOW! That's why TLB (Translation Lookaside Buffer) exists:
  
  TLB = CPU-level cache of recent virtual→physical translations
  TLB hit:   ~1ns (95%+ of accesses)
  TLB miss:  ~10-100ns (walk the page table)


  WHY THIS MATTERS FOR YOUR APP:
  ═══════════════════════════════
  
  1. JVM Heap is virtual until used:
     -Xmx4g allocates 4GB of VIRTUAL address space
     Physical pages allocated only when first written (page fault)
     
  2. Fork + exec is cheap (COW):
     fork() doesn't copy all pages
     Pages marked Copy-On-Write
     Physical copy only when child or parent MODIFIES a page
     
  3. Memory-mapped files (mmap):
     Map file contents directly into virtual address space
     OS handles reading from disk into pages on demand
     Used by: Kafka (log segments), databases (buffer pool), JVM (.class files)
```

---



🔬 **Section Challenge — 4. Virtual Memory — Why Programs Think They Have Unlimited RAM**

**Challenge 1 (Reasoning):** How can a Java process with `-Xmx4g` (4GB heap) successfully run on a server with only 2GB of physical RAM, and what is the severe performance risk of doing so?
<details><summary>Answer</summary>

The OS allocates 4GB of *Virtual Memory* address space. Physical memory frames are only mapped on demand when the JVM actually writes to the pages. The risk is that if the JVM actually tries to use >2GB, the OS will start 'swapping' pages to disk. When the Garbage Collector runs, it must scan the heap, triggering massive numbers of Major Page Faults as pages are pulled from disk. This can turn a 20ms GC pause into a 10-second system freeze.
</details>


## 5. Page Faults — When Memory Isn't Where You Think

```
  A page fault happens when a program accesses a virtual page
  that isn't currently in physical RAM.

  MINOR PAGE FAULT (soft fault):
  ══════════════════════════════
  Page exists but hasn't been mapped yet.
  
  1. Program accesses virtual page 42
  2. MMU: "Page 42 not in page table → trap to kernel"
  3. Kernel: "This is a valid mapping, just not loaded yet"
  4. Kernel: Allocate physical frame, zero it out
  5. Update page table: virtual page 42 → physical frame X
  6. Resume program
  
  Cost: ~1-5 μs
  Happens: First time accessing each heap page (JVM startup, object allocation)
  
  
  MAJOR PAGE FAULT (hard fault):
  ══════════════════════════════
  Page was swapped out to disk (or reading from mmap'd file).
  
  1. Program accesses virtual page 42
  2. MMU: "Page 42 not present → trap to kernel"
  3. Kernel: "Page 42 is in swap/disk"
  4. Kernel: Find a free physical frame (or EVICT one)
  5. Read page from disk → physical frame (disk I/O: ~5-10ms for HDD, ~100μs for SSD)
  6. Update page table
  7. Resume program
  
  Cost: ~100μs (SSD) to ~10ms (HDD)
  Happens: When physical RAM is exhausted and OS uses swap
  
  
  WHY YOUR APP SUDDENLY SLOWS DOWN:
  ═════════════════════════════════
  
  8GB RAM server running multiple services:
  
  Service A: 3GB heap (using 2.5GB)
  Service B: 3GB heap (using 2.8GB)
  Service C: 2GB heap (using 1.8GB)
  OS + buffers: 1GB
  
  Total: 8.1GB needed > 8GB physical RAM
  
  → OS starts SWAPPING: moves least-recently-used pages to disk
  → Your Java GC now:
    1. Scans heap (needs to READ every page)
    2. Pages swapped out → major page faults
    3. GC pause: 20ms → 5000ms (250x slower!)
  
  THIS IS WHY:
  - NEVER let servers swap. Set vm.swappiness = 1
  - Kubernetes: set memory LIMITS properly
  - JVM: -Xmx should be < available physical RAM
  - Monitor: vmstat, free -m, /proc/meminfo
```

---



🔬 **Section Challenge — 5. Page Faults — When Memory Isn't Where You Think**

**Challenge 1 (Reasoning):** What is the difference between a Minor Page Fault and a Major Page Fault, and which one occurs when a JVM first allocates an object in Eden space?
<details><summary>Answer</summary>

A Minor Page Fault occurs when a page is valid but not yet mapped to a physical frame in the MMU (resolved quickly in RAM). A Major Page Fault occurs when the page has been swapped out to disk and requires a slow disk I/O operation to retrieve. When the JVM allocates a new object in previously unused Eden space, a Minor Page Fault occurs as the OS provisions a new zeroed-out physical frame for that virtual page.
</details>


## 6. Threads vs Async I/O — Two Models for Concurrency

```
  MODEL 1: Thread-per-request (Tomcat / Spring MVC)
  ═════════════════════════════════════════════════
  
  Thread-1              Thread-2              Thread-3
  ────────              ────────              ────────
  Accept request        Accept request        Accept request
  │                     │                     │
  Parse JSON            Parse JSON            Parse JSON
  │                     │                     │
  Call DB ─────┐        Call DB ─────┐        Call DB ─────┐
  (BLOCKING)   │        (BLOCKING)   │        (BLOCKING)   │
  Thread WAITS │        Thread WAITS │        Thread WAITS │
  ... 5ms ...  │        ... 5ms ...  │        ... 5ms ...  │
  ◄────────────┘        ◄────────────┘        ◄────────────┘
  │                     │                     │
  Build response        Build response        Build response
  Send JSON             Send JSON             Send JSON
  
  → 10,000 concurrent requests = 10,000 threads
  → 10,000 × 1MB stack = 10GB just for stacks!
  → Context switching between 10K threads: severe overhead
  
  
  MODEL 2: Event loop / Async I/O (Node.js / Netty / WebFlux)
  ════════════════════════════════════════════════════════════
  
  ONE Thread (event loop):
  ────────────────────────
  Accept request-1   → start DB query (non-blocking!) → register callback
  Accept request-2   → start DB query → register callback
  Accept request-3   → start DB query → register callback
  ...
  [Event: DB response for request-1 ready!]
  Process request-1 response → send JSON
  [Event: DB response for request-3 ready!]
  Process request-3 response → send JSON
  ...
  
  → 10,000 concurrent requests = 1 thread (or few threads)
  → No context switching
  → No stack memory waste
  → But: one slow computation blocks EVERYTHING (no preemption)
  
  
  UNDERLYING OS MECHANISM — epoll (Linux):
  ════════════════════════════════════════
  
  int epoll_fd = epoll_create1(0);
  
  // Register interest in file descriptors:
  epoll_ctl(epoll_fd, EPOLL_CTL_ADD, socket_fd_1, {EPOLLIN});
  epoll_ctl(epoll_fd, EPOLL_CTL_ADD, socket_fd_2, {EPOLLIN});
  epoll_ctl(epoll_fd, EPOLL_CTL_ADD, socket_fd_3, {EPOLLIN});
  
  // Wait for ANY of them to be ready:
  int n = epoll_wait(epoll_fd, events, MAX_EVENTS, timeout);
  // Returns: "socket 2 and 3 have data ready!"
  // One syscall monitors thousands of connections!
  
  
  MODEL 3: Virtual Threads (Java 21+ / Project Loom)
  ═════════════════════════════════════════════════════
  
  The BEST of both worlds:
  
  1,000,000 virtual threads → mapped to ~4 OS (carrier) threads
  
  Virtual Thread:
  - Looks like a regular thread (blocking API works!)
  - When it blocks on I/O → JVM UNMOUNTS it from carrier thread
  - Carrier thread picks up another virtual thread
  - When I/O completes → virtual thread remounted on any carrier
  
  Code stays simple:     var user = userRepo.findById(id);   // looks blocking
  But underneath:         JVM does the async dance for you
```

---



🔬 **Section Challenge — 6. Threads vs Async I/O — Two Models for Concurrency**

**Challenge 1 (System Design):** In an event-loop architecture like Node.js or Spring WebFlux, a single thread can handle thousands of concurrent I/O operations without blocking. What underlying OS system call makes this possible?
<details><summary>Answer</summary>

System calls like `epoll` (Linux), `kqueue` (macOS), or `IOCP` (Windows). These allow a single thread to register interest in thousands of non-blocking file descriptors (sockets) and then 'sleep' until the OS notifies it that specific sockets have data ready to read or write. This I/O multiplexing eliminates the need for one thread per connection.
</details>

## 7. File Descriptors — Why "Too Many Open Files" Happens

```
  WHAT IS A FILE DESCRIPTOR:
  ══════════════════════════
  
  Small integer that represents an open "file" (file, socket, pipe, etc.)
  
  Per-process file descriptor table:
  ┌────────────────────────────────────────────────────────────┐
  │ FD │ Type         │ Description                            │
  ├────────────────────────────────────────────────────────────┤
  │  0 │ stdin        │ Standard input                         │
  │  1 │ stdout       │ Standard output (console)              │
  │  2 │ stderr       │ Standard error (console)               │
  │  3 │ socket       │ TCP connection to client 1             │
  │  4 │ socket       │ TCP connection to client 2             │
  │  5 │ socket       │ TCP connection to PostgreSQL           │
  │  6 │ socket       │ TCP connection to PostgreSQL           │
  │  7 │ file         │ /var/log/app.log (open for writing)    │
  │  8 │ socket       │ TCP connection to Redis                │
  │  9 │ pipe         │ IPC pipe to child process              │
  │ ...│ ...          │ ...                                     │
  │1023│ socket       │ TCP connection to client 997            │
  └────────────────────────────────────────────────────────────┘
  
  DEFAULT LIMIT: 1024 per process (Linux)
  
  
  HOW TO HIT THE LIMIT:
  ═════════════════════
  
  Spring Boot app with:
     200 Tomcat threads (potential connections) = 200 FDs
     10 HikariCP connections (to DB) = 10 FDs
     5 Redis connections = 5 FDs
     Log files = 2-5 FDs
     Misc (libs, temp files) = 10-20 FDs
     
  Total: ~240 FDs for normal operation
  Limit: 1024 — seems fine
  
  BUT: If clients connect faster than you can process:
  → 800+ open connections → 800+ FDs
  → Plus DB + Redis + logs
  → "Too many open files" → java.net.SocketException
  → App stops accepting connections!
  
  
  FIX:
  ════
  
  # Check current limit
  ulimit -n
  # 1024
  
  # Increase (temporary)
  ulimit -n 65535
  
  # Increase (permanent) — /etc/security/limits.conf:
  # appuser   soft   nofile   65535
  # appuser   hard   nofile   65535
  
  # System-wide max — /etc/sysctl.conf:
  # fs.file-max = 2097152
  
  
  REAL-WORLD LESSON:
  Connection pool leaks (not returning connections) slowly exhaust FDs.
  Monitor with: ls -la /proc/<PID>/fd | wc -l
```

---

## 8. System Calls — How Your App Talks to the OS

```
  USER SPACE vs KERNEL SPACE:
  ═══════════════════════════
  
  ┌────────────────────────────────────────┐
  │           USER SPACE                    │
  │  Your Java app                          │
  │  JDK libraries                          │
  │  C library (glibc)                      │
  │                                         │
  │  Cannot: access hardware, manage        │
  │  memory, talk to network directly       │
  │                                         │
  ├─────── System Call Boundary ────────────┤
  │                                         │
  │           KERNEL SPACE                  │
  │  Process scheduler                      │
  │  Memory manager                         │
  │  File system driver                     │
  │  Network stack (TCP/IP)                 │
  │  Device drivers                         │
  │                                         │
  │  CAN: access hardware, manage memory,   │
  │  everything — full privilege             │
  │                                         │
  └────────────────────────────────────────┘

  
  WHAT HAPPENS WHEN YOUR CODE READS FROM A FILE:
  ═══════════════════════════════════════════════
  
  Java: new FileInputStream("data.txt").read(buffer)
       │
       ▼
  JDK: FileInputStream.read() → native method
       │
       ▼
  JNI: call read(fd, buf, count) in C library
       │
       ▼
  glibc: set up registers (syscall number, arguments)
       │
       ▼
  SYSCALL instruction (trap from user → kernel mode)
       │ CONTEXT SWITCH: save user registers, switch to kernel stack
       ▼
  Kernel: sys_read(fd, buf, count)
       │
       ├── Look up fd in process's file descriptor table
       ├── Check permissions
       ├── Is data in page cache? 
       │   YES → copy from page cache to user buffer → return
       │   NO  → Issue I/O request to disk driver
       │         → Put thread to sleep (WAITING)
       │         → Disk DMA completes → interrupt → wake thread
       │         → Copy from page cache to user buffer → return
       │
       ▼
  Return to user space (restore user registers)
       │
       ▼
  Java: buffer now contains file data


  COMMON SYSTEM CALLS YOUR APP USES:
  ═══════════════════════════════════
  
  read()  / write()   → File/socket I/O
  open()  / close()   → File descriptor management
  socket() / connect() / accept() / bind() / listen()  → Networking
  mmap()  / munmap()  → Memory mapping
  epoll_create() / epoll_wait()  → I/O multiplexing
  futex()            → Fast user-space mutex (Thread.sleep, synchronized)
  clone()            → Thread/process creation
  brk() / mmap()     → Heap allocation (malloc → JVM heap growth)
```

---

## 9. I/O Models — Blocking, Non-Blocking, Multiplexing

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  MODEL                │  HOW IT WORKS           │  JAVA FRAMEWORK       │
  ├──────────────────────────────────────────────────────────────────────────┤
  │                       │                          │                       │
  │  BLOCKING I/O         │  Thread calls read()     │  java.io.*            │
  │                       │  Thread sleeps until     │  (InputSteam,         │
  │                       │  data arrives             │   OutputStream)       │
  │                       │  1 thread per connection  │  Tomcat (default)     │
  │                       │                          │                       │
  ├──────────────────────────────────────────────────────────────────────────┤
  │                       │                          │                       │
  │  NON-BLOCKING I/O     │  Thread calls read()     │  java.nio.*           │
  │                       │  Returns immediately      │  (Channel, Buffer,    │
  │                       │  (-1 if no data)          │   Selector)           │
  │                       │  Thread must poll/retry   │  Netty, WebFlux       │
  │                       │                          │                       │
  ├──────────────────────────────────────────────────────────────────────────┤
  │                       │                          │                       │
  │  I/O MULTIPLEXING     │  One thread monitors     │  java.nio.Selector    │
  │  (select/poll/epoll)  │  MANY FDs at once         │  (wraps epoll)        │
  │                       │  "Which FDs have data?"   │  Netty EventLoop      │
  │                       │  → process only ready ones│                       │
  │                       │                          │                       │
  ├──────────────────────────────────────────────────────────────────────────┤
  │                       │                          │                       │
  │  ASYNC I/O            │  Thread submits I/O      │  AsynchronousChannel  │
  │  (io_uring on Linux)  │  OS does the work        │  (rarely used in      │
  │                       │  Callback when done       │   practice)           │
  │                       │                          │                       │
  └──────────────────────────────────────────────────────────────────────────┘

  
  SELECT vs POLL vs EPOLL:
  ════════════════════════
  
  select():  O(n) — scans ALL file descriptors every call. Max 1024 FDs.
  poll():    O(n) — no FD limit, but still scans all on each call.
  epoll():   O(1) — kernel maintains interest list, notifies only ready FDs.
             ↑ This is what Netty/Tomcat NIO uses on Linux
  
  10,000 connections:
  select: scan 10,000 FDs every call → slow
  epoll:  kernel says "FDs 42, 99, 7031 are ready" → process only 3 → fast!
```

---



🔬 **Section Challenge — 9. I/O Models — Blocking, Non-Blocking, Multiplexing**

**Challenge 1 (Reasoning):** Why is reading a 1GB file in 4KB chunks using standard `FileInputStream.read()` significantly slower than using `FileChannel.transferTo()` (Zero-Copy)?
<details><summary>Answer</summary>

Standard I/O requires the OS to read data from disk into Kernel Space, copy it to User Space (JVM buffer), and then copy it back to Kernel Space to send over a socket. `transferTo()` uses Zero-Copy DMA (Direct Memory Access). The OS transfers data directly from the disk buffer to the network socket buffer entirely within Kernel Space. It bypasses the JVM memory and avoids expensive CPU context switches between User and Kernel mode.
</details>


## 10. Signals and Process Lifecycle

```
  PROCESS LIFECYCLE:
  ══════════════════
  
  fork() → child created (copy of parent)
  exec() → child replaces itself with new program
  exit() → process terminates
  wait() → parent collects child's exit status
  
  
  SIGNALS YOUR JVM CARES ABOUT:
  ═════════════════════════════
  
  Signal      │ Number │ Default Action │ Purpose
  ────────────┼────────┼────────────────┼─────────────────────────────
  SIGTERM     │  15    │ Terminate      │ Graceful shutdown request
              │        │                │ JVM runs shutdown hooks!
              │        │                │ Docker sends this first.
              │        │                │ Spring Boot graceful shutdown.
  ────────────┼────────┼────────────────┼─────────────────────────────
  SIGKILL     │   9    │ Terminate      │ Force kill. CANNOT be caught.
              │        │                │ No shutdown hooks, no cleanup.
              │        │                │ Docker sends after timeout.
  ────────────┼────────┼────────────────┼─────────────────────────────
  SIGHUP      │   1    │ Terminate      │ Terminal hangup. Sometimes
              │        │                │ used for config reload.
  ────────────┼────────┼────────────────┼─────────────────────────────
  SIGINT      │   2    │ Terminate      │ Ctrl+C in terminal.
              │        │                │ JVM runs shutdown hooks.
  ────────────┼────────┼────────────────┼─────────────────────────────
  SIGSEGV     │  11    │ Core dump      │ Segmentation fault.
              │        │                │ JVM crash (hs_err_pid.log).
  ────────────┼────────┼────────────────┼─────────────────────────────
  SIGQUIT     │   3    │ Core dump      │ Ctrl+\. JVM generates
              │        │                │ thread dump to stdout!
  
  
  KUBERNETES SHUTDOWN:
  ════════════════════

  Pod termination:
  1. K8s sends SIGTERM to PID 1 in container
  2. Spring Boot receives signal → triggers shutdown:
     → Stop accepting new requests
     → Wait for in-flight requests to finish (grace period)
     → Close DB connections (HikariCP shutdown)
     → Close application context
  3. If still running after terminationGracePeriodSeconds (default 30s):
  4. K8s sends SIGKILL → instant death, no cleanup
  
  Spring Boot config:
  server.shutdown=graceful
  spring.lifecycle.timeout-per-shutdown-phase=30s
```

---

## 11. How the Network Stack Processes Your API Call

```
  Client calls: GET http://your-app:8080/api/users
  
  ┌──────────── CLIENT SIDE ──────────────┐    ┌──────────── SERVER SIDE ──────────────┐
  │                                        │    │                                        │
  │ Application Layer (HTTP)               │    │ Application Layer (HTTP)               │
  │ GET /api/users HTTP/1.1               │    │ Parse HTTP request                     │
  │ Host: your-app:8080                   │    │ Route to controller                    │
  │         │                              │    │         ▲                              │
  │         ▼                              │    │         │                              │
  │ Transport Layer (TCP)                  │    │ Transport Layer (TCP)                  │
  │ ├── Source port: 52431 (ephemeral)     │    │ ├── Dest port: 8080                   │
  │ ├── Dest port: 8080                    │    │ ├── Assemble segments in order         │
  │ ├── Sequence number: track ordering    │    │ ├── ACK received segments              │
  │ ├── Segment data into packets          │    │ ├── Deliver complete stream to app     │
  │ └── Reliability: retransmit if no ACK  │    │ └── Flow control (receive window)      │
  │         │                              │    │         ▲                              │
  │         ▼                              │    │         │                              │
  │ Network Layer (IP)                     │    │ Network Layer (IP)                     │
  │ ├── Source IP: 10.0.1.5               │    │ ├── Dest IP check: is it for me?       │
  │ ├── Dest IP: 10.0.2.10               │    │ ├── Reassemble fragments                │
  │ ├── TTL: 64                            │    │ └── Pass to TCP layer                  │
  │ └── Fragment if > MTU (1500 bytes)     │    │         ▲                              │
  │         │                              │    │         │                              │
  │         ▼                              │    │         │                              │
  │ Link Layer (Ethernet)                  │    │ Link Layer (Ethernet)                  │
  │ ├── ARP: resolve IP → MAC address     │    │ ├── Check dest MAC address             │
  │ ├── Frame: src MAC → dest MAC         │    │ ├── Strip frame header                 │
  │ └── Send on wire/wifi                  │    │ └── Pass to IP layer                   │
  │                                        │    │                                        │
  └────────────────────────────────────────┘    └────────────────────────────────────────┘
                       │                                     ▲
                       └───── Physical network ──────────────┘
  
  
  TCP 3-WAY HANDSHAKE (before any data):
  ══════════════════════════════════════
  
  Client                          Server
  ──────                          ──────
  SYN (seq=100)          ────→
                         ←────    SYN-ACK (seq=300, ack=101)
  ACK (seq=101, ack=301) ────→
  
  Connection established! Now send HTTP data.
  
  Cost: 1.5 round trips before any data. 
  If RTT = 1ms → 1.5ms just to connect.
  If RTT = 100ms (cross-continent) → 150ms!
  
  THIS IS WHY connection pooling matters (HikariCP keeps connections open)
  and HTTP keep-alive reuses TCP connections.
```

---



🔬 **Section Challenge — 11. How the Network Stack Processes Your API Call**

**Challenge 1 (Reasoning):** What is the primary latency cost of establishing a new database connection over a WAN, and how does connection pooling mitigate it?
<details><summary>Answer</summary>

A new TCP connection requires a 3-way handshake (1.5 Round Trip Times) before any data is sent. Over a WAN with 100ms latency, this adds 150ms of pure overhead. If TLS is involved, it adds another 1-2 RTTs (up to 350ms total). Connection pooling (like HikariCP) mitigates this by keeping a pool of already-established TCP connections open and reusing them, reducing connection setup overhead to 0.
</details>

## 12. OS Concepts in Java — Direct Mapping

```
  ┌───────────────────────────────────────────────────────────────────────┐
  │ OS CONCEPT              │ JAVA EQUIVALENT                            │
  ├───────────────────────────────────────────────────────────────────────┤
  │ Process                 │ JVM instance (java -jar app.jar)           │
  │ Thread                  │ java.lang.Thread (maps 1:1 to OS thread)   │
  │ Virtual Thread          │ Thread.ofVirtual() (many:1 to OS thread)   │
  │ Mutex                   │ synchronized block / ReentrantLock          │
  │ Semaphore               │ java.util.concurrent.Semaphore             │
  │ Condition variable      │ Object.wait/notify or Condition            │
  │ Shared memory           │ Heap (all threads share same heap)         │
  │ File descriptor         │ FileInputStream, Socket, Channel           │
  │ Virtual memory          │ JVM address space (-Xmx)                   │
  │ Page fault              │ First access to allocated but untouched mem│
  │ Context switch          │ Thread scheduling (200 Tomcat threads)      │
  │ System call             │ Any I/O operation (file, network, etc.)     │
  │ Signal (SIGTERM)        │ Runtime.addShutdownHook()                   │
  │ Signal (SIGQUIT)        │ Thread dump to stdout (kill -3 PID)        │
  │ mmap                    │ MappedByteBuffer (FileChannel.map())       │
  │ epoll                   │ java.nio.Selector (NIO)                     │
  │ fork + exec             │ ProcessBuilder / Runtime.exec()             │
  │ Pipe                    │ PipedInputStream / PipedOutputStream        │
  │ Socket                  │ java.net.Socket / ServerSocket              │
  │ CPU affinity            │ Not directly exposed (use taskset)          │
  │ Nice value (priority)   │ Thread.setPriority() (hint, not guarantee) │
  └───────────────────────────────────────────────────────────────────────┘
```

---



🔬 **Section Challenge — 12. OS Concepts in Java — Direct Mapping**

**Challenge 1 (Reasoning):** If a developer uses `Runtime.getRuntime().exec("ls")` in Java, which two fundamental OS system calls are being triggered underneath?
<details><summary>Answer</summary>

The `fork()` and `exec()` system calls. The JVM first calls `fork()` to create a child process (copying the parent's file descriptors and virtual address space), and then the child calls `exec()` to replace its memory space with the `ls` executable. This is extremely heavy compared to simply spawning a new thread.
</details>


## 13. Key Numbers Every Developer Should Know

```
  ┌───────────────────────────────────────────────────────────────────┐
  │  OPERATION                             │  LATENCY                 │
  ├───────────────────────────────────────────────────────────────────┤
  │  L1 cache reference                    │  1 ns                    │
  │  L2 cache reference                    │  4 ns                    │
  │  L3 cache reference                    │  12 ns                   │
  │  Main memory reference (RAM)           │  100 ns                  │
  │  SSD random read                       │  16 μs                   │
  │  HDD random read (seek)                │  4 ms                    │
  │  Network round trip (same datacenter)  │  500 μs                  │
  │  Network round trip (cross-continent)  │  150 ms                  │
  │  Context switch (thread)               │  1-10 μs                 │
  │  System call                           │  0.5-1 μs                │
  │  Mutex lock/unlock (uncontended)       │  25 ns                   │
  │  Java object allocation (TLAB)         │  10 ns                   │
  │  TCP connection setup (handshake)      │  1.5 × RTT               │
  │  Read 1 MB from SSD                    │  50 μs                   │
  │  Read 1 MB from HDD                    │  2 ms                    │
  │  Read 1 MB from RAM                    │  3 μs                    │
  │  Read 1 MB from network (1 Gbps)      │  10 ms                   │
  │  Compress 1 KB with Snappy             │  3 μs                    │
  │  Send packet within same datacenter    │  200 μs                  │
  └───────────────────────────────────────────────────────────────────┘
  
  
  RULES OF THUMB:
  ═══════════════
  
  1. RAM is 100x faster than SSD, SSD is 1000x faster than HDD
  2. Network within datacenter: ~500μs. Cross-continent: ~150ms (300x slower)
  3. One disk seek = 400,000 ns = time for 4 million L1 cache reads
  4. Allocating an object in Java (TLAB) ≈ 10ns. Creating a thread: ~1,000,000ns
  5. If your API P99 > 100ms, you're probably doing too many network/disk hops
```

---

**Next Chapter**: [Event Sourcing & CQRS →](Ch66_Event_Sourcing_CQRS.md)
