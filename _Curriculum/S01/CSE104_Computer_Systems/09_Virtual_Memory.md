# Chapter 09 — Virtual Memory

> [← 08 Processes & System Calls](08_Processes_System_Calls.md) | [Course Index](README.md) | [Next → 10 Dynamic Memory & the Heap](10_Dynamic_Memory_Heap.md)

---

## The Illusion Every Process Believes

Run two programs simultaneously. Both believe they own address 0x400000. Both believe they have gigabytes of RAM. Yet they never interfere with each other. Your laptop has 16 GB of RAM but your processes collectively allocate 50 GB without issue.

How is any of this possible?

Virtual memory is the answer. Every address your program sees is a **virtual address** — a fiction maintained by the CPU and OS in collaboration. Translating that fiction to real physical memory is the core mechanism of virtual memory.

---

## The Physical Reality: Address Translation

Each process has its own **virtual address space** — a private 48-bit (or 64-bit) range of addresses. These are NOT physical DRAM addresses.

The CPU's **Memory Management Unit (MMU)** translates every virtual address to a physical address, using a data structure maintained by the OS: the **page table**.

```
Virtual Address:  0x0000_0040_0000  (process A's "main" function)
                        ↓ MMU + page table
Physical Address: 0x0000_0200_0000  (actual DRAM location)

Virtual Address:  0x0000_0040_0000  (process B's "main" function — SAME virtual addr!)
                        ↓ MMU + page table (different page table for process B!)
Physical Address: 0x0000_0500_0000  (different DRAM location)
```

The two processes share the same virtual address (0x400000) but their page tables map it to DIFFERENT physical addresses. Neither can access the other's physical memory — their page tables simply don't map to each other's physical pages.

**Security:** If process A tries to access virtual address X and its page table has no valid mapping for X → hardware fault → OS kills the process with SIGSEGV (segmentation fault). There's no way to read process B's memory from process A.

---

## Pages and Page Tables

Virtual memory is divided into fixed-size **pages** (typically 4 KB = 4096 bytes).
Physical memory is divided into same-size **frames**.

```
Virtual address = [Virtual Page Number (VPN)] [Page Offset]
                      (52 bits)                   (12 bits, for 4 KB pages)

Physical address = [Physical Frame Number (PFN)] [Page Offset (unchanged)]
```

The **page offset** is passed through unchanged — only the page number is translated.

```
Example: 4 KB pages, virtual address 0x4002A8

VPN = 0x400 (page 1024)
Offset = 0x2A8 (680 bytes into the page)

Page table says: VPN 0x400 → PFN 0x200

Physical address = PFN 0x200 + offset 0x2A8 = 0x0002002A8
```

### Page Table Structure (x86-64: 4-level)

A flat page table for a 64-bit address space would need 2^52 entries × 8 bytes = 32 PB. Impractical. Instead, x86-64 uses a 4-level hierarchical page table:

```
Virtual address (48 significant bits):
  [L4 index: 9 bits][L3 index: 9 bits][L2 index: 9 bits][L1 index: 9 bits][Offset: 12 bits]

CR3 register: physical address of the L4 page table (per-process)

Translation walk (page table walk):
  1. L4 table[L4_idx] → physical address of L3 table
  2. L3 table[L3_idx] → physical address of L2 table
  3. L2 table[L2_idx] → physical address of L1 table
  4. L1 table[L1_idx] → physical frame number (PFN)
  5. Physical address = PFN × 4096 + Offset
```

Four memory accesses just to translate ONE address. This would be intolerably slow...

---

## The TLB: Caching Address Translations

The **Translation Lookaside Buffer (TLB)** is a hardware cache for recent page table lookups.

```
Memory access:
  1. Is VPN in TLB? → TLB HIT → get PFN in 1 cycle
  2. Not in TLB → TLB MISS → hardware page table walk (4 memory accesses) → cache in TLB → use PFN
```

Typical TLB: 64-1024 entries. Hit rate: >99% for programs with good locality.

**Why locality matters for TLB:** 
- A 4 KB page accessed 1000 times → 1 TLB miss (first access), 999 TLB hits.
- A program with 64 hot pages (256 KB working set) needs only 64 TLB entries.
- A program that randomly touches millions of pages has poor TLB hit rate → slow.

**TLB shootdown:** When a page table is modified (e.g., on `munmap()`), the OS must invalidate the TLB on ALL CPU cores that might have the old translation cached. This is a cross-core IPI (inter-processor interrupt) — expensive in multi-core programs.

---

## Page Faults: The Demand-Paging Mechanism

When a TLB miss occurs and the page table walk finds a page marked **not present**, the CPU raises a **page fault** exception.

The OS page fault handler decides what to do:
1. **Valid virtual address, page not in RAM** → allocate a physical frame, copy the page from disk (swap), mark present, resume.
2. **Invalid access (NULL, wrong address)** → SIGSEGV.
3. **Write to read-only page** → copy-on-write (see below), or SIGSEGV if truly read-only.

This "lazy loading" is **demand paging** — pages are only brought into RAM when first accessed. This is how `malloc(1GB)` can return immediately: no physical memory is allocated until you actually write to the pages.

```
Process calls:  char* p = malloc(1073741824);  // allocate 1 GB
malloc returns: immediately — no physical RAM allocated yet

Process writes: p[0] = 'A';    // first access to page 0
  → Page fault! OS: allocate physical frame, map it, zero-fill it.
  → p[0] = 'A' executes.

Process writes: p[4096] = 'B'; // first access to page 1
  → Another page fault! OS allocates page 1.
  
... continues page-by-page as program actually uses memory.
```

This is why `malloc(1GB)` succeeds even when you only have 500 MB of free RAM — as long as you never actually use all 1 GB simultaneously.

---

## Copy-On-Write (COW) — Why fork() Is Fast

When `fork()` is called, the child needs a copy of the parent's address space. But physically copying all of the parent's RAM would be slow (GBs of data).

**COW solution:**
1. `fork()` creates a new page table for the child that maps to the **same physical frames** as the parent.
2. Both page tables mark all pages **read-only**.
3. When EITHER process writes to a page → page fault → OS copies that one page → one process now has its own private copy → marks it writable.
4. Pages that are never written are NEVER copied.

```
Parent page table:     Child page table (after fork):
  VPN 0 → PFN 10 (RW)    VPN 0 → PFN 10 (RO)  ← both point to same frame!
  VPN 1 → PFN 11 (RW)    VPN 1 → PFN 11 (RO)
  ...                      ...

Parent writes to VPN 0:
  Page fault! OS: allocate new PFN 20, copy PFN 10 → PFN 20.
  Parent's page table: VPN 0 → PFN 20 (RW)   ← parent has private copy
  Child's page table:  VPN 0 → PFN 10 (RW)   ← child still has original
```

`fork()` + `exec()` is fast because exec() replaces the address space entirely — the COW pages are never written, so no copying happens.

---

## Memory-Mapped Files: mmap()

`mmap()` maps a file (or anonymous memory) directly into the virtual address space.

```c
#include <sys/mman.h>

int fd = open("data.bin", O_RDONLY);
size_t size = 1000000;   // 1 MB

// Map the file into virtual memory
char* data = mmap(NULL, size, PROT_READ, MAP_PRIVATE, fd, 0);

// Now you can access file bytes as memory!
char first_byte = data[0];    // page fault → OS reads page from disk → returns
char tenth_byte = data[9999]; // probably already in cache from previous access

munmap(data, size);
close(fd);
```

**What mmap() does:**
- Creates virtual address entries for the file.
- Marks them **not present** (no physical frames yet).
- On first access → page fault → OS reads the file page from disk → maps the page.
- Subsequent accesses (if in cache) → no fault, direct memory speed.

**Why mmap() for large files:**
- No need to `read()` into a buffer first.
- OS page cache IS the buffer — a large file is accessed like RAM.
- Random access is efficient (only touched pages are loaded).
- Shared libraries (`libc.so`) are mmap'd — all processes share the same physical pages.

---

## Swap Space: When RAM Runs Out

When physical RAM is full and a new page is needed, the OS must **evict** an existing page to disk (swap space / page file).

```
Physical RAM is full (all frames in use).
New page fault: need to load page P.

OS page eviction:
  1. Pick a victim frame (LRU approximation — "clock algorithm").
  2. If dirty (modified since loaded): write victim to swap on disk.
  3. If clean (disk copy is up-to-date): just discard (reload from file if needed).
  4. Map the freed frame to the new virtual page.
  5. Resume the faulting instruction.
```

**The thrashing problem:** If the active working set > physical RAM, every memory access evicts a page that will soon be needed again → constant disk I/O → program grinds to a halt.

Modern OS response: OOM killer. When system is critically low on memory and swapping is chronic, the Linux OOM (Out-Of-Memory) killer selects a process (heuristic: large memory use, low priority, recent) and sends SIGKILL. Better to kill one process than to let the whole system thrash.

---

## The Virtual Memory Map of a Process

```
┌────────────────────────────────────┐ 0xFFFFFFFF_FFFFFFFF (top)
│         Kernel Space               │  ← OS kernel, not user-accessible
│    (same physical pages mapped     │
│     into every process for speed)  │
├────────────────────────────────────┤ 0x0000_7FFF_FFFF_FFFF (user/kernel boundary)
│            Stack                   │  ← grows downward
│              ↓                     │     local variables, return addresses
│         (stack guard page)         │  ← unmapped → stack overflow = SIGSEGV
│                                    │
│         [Random gap — ASLR]        │
│                                    │
│             Heap                   │  ← grows upward (brk/mmap)
│              ↑                     │     malloc/new allocations
│                                    │
│    Memory-Mapped Region            │  ← mmap, shared libraries (.so), files
│    (libc.so, libm.so, etc.)        │
│                                    │
│            .bss                    │  ← uninitialized globals (zero-filled)
│            .data                   │  ← initialized globals
│            .rodata                 │  ← string literals, const
│            .text                   │  ← code (executable, read-only)
└────────────────────────────────────┘ 0x00000000_00400000 (typical text base)
```

**ASLR (Address Space Layout Randomization):** Stack, heap, and library base addresses are randomized on each run. An attacker who knows your function is at "stack – 128 bytes" can't hardcode that address because it changes every run.

---

## Section Challenge

> ### Virtual Memory Analysis
>
> A system has:
> - 4 KB pages
> - 48-bit virtual addresses (4-level page table, 9+9+9+9+12 bit split)
> - 32 GB physical RAM
> - TLB with 256 entries, fully-associative, LRU replacement
> - 128 MB swap partition
>
> A process runs a tight inner loop that accesses:
> - Array A: 16 MB (starts at virtual address 0x10000000)
> - Array B: 16 MB (starts at virtual address 0x11000000)
> - 10 local variables on the stack
>
> **Q1:** How many pages does Array A occupy? How many TLB entries needed to hold all of A's translations?
>
> **Q2:** If the loop alternates accessing all of A then all of B repeatedly, what is the TLB behavior? Will all translations fit in the 256-entry TLB?
>
> **Q3:** The loop is then modified to access random elements of A and B (no sequential pattern). Describe the TLB behavior and expected TLB miss rate.
>
> **Q4:** After the loop runs, 60 GB of other data is `malloc()`'d. Physical RAM (32 GB) + swap (128 MB) cannot hold it all. What happens? What process does the OS likely target with the OOM killer?
>
> **Q5 (Stretch):** The programmer optimizes by using `mmap()` to map both arrays from a single file `data.bin` (32 MB). Two separate processes both mmap the same file. How many physical frames do they share? What happens when Process 1 writes to element A[0] with `MAP_PRIVATE`, while Process 2 reads A[0]?

<details>
<summary>Full answers</summary>

```
Q1: Pages for Array A

Array A size: 16 MB = 16 × 1024 × 1024 = 16,777,216 bytes
Pages: 16,777,216 / 4,096 = 4,096 pages

TLB entries needed for all of A: 4,096 entries.

The TLB only has 256 entries. Array A alone needs 16× more entries than
the TLB can hold. The TLB cannot hold all of A's translations simultaneously.

──────────────────────────────────────────────────────

Q2: Alternating A then B — TLB behavior

Array A: 4,096 pages = 4,096 TLB entries needed
Array B: 4,096 pages = 4,096 TLB entries needed
Total: 8,192 entries needed vs 256 available.

Scenario: access all of A (filling TLB with A's translations), then all of B:
  Accessing B evicts A's entries (256 entries replaced with B's 256 current entries).
  Then accessing A again: all A's translations are gone → 4,096 misses again.
  
Actually with sequential access:
  Sequential through A: miss, hit×15, miss, hit×15... (1 miss per 16 sequential 
  accesses within a page, then 1 miss per new page) → miss rate ~1/16 per access.
  But between A and B transitions: TLB thrashes.

TLB behavior: 
  Within A (sequential): ~6.25% miss rate (1 miss per 16 accesses in a 4KB page
  that holds 16 ints of 256 bytes each... actually: sequential access within a 
  4KB page has 1 TLB miss per PAGE, not per element)

  Per-page miss rate: 1 miss per 1024 ints (1 page / 4096 bytes × 4 bytes per int)
  = 0.1% miss rate within the page. But each new page = 1 TLB miss.

  The core problem: 8,192 pages needed > 256 TLB entries.
  When switching between A and B phases, the TLB is completely cold for the other array.
  Each switch of A → B involves 4,096 page TLB misses. TLB thrashing.

──────────────────────────────────────────────────────

Q3: Random access TLB behavior

Random access to A (4,096 pages) and B (4,096 pages) = 8,192 unique pages.
TLB holds 256 entries (LRU).

Working set (8,192 pages) >> TLB capacity (256 entries).

Expected TLB behavior:
  Every access to a "new" page evicts an old translation.
  With 8,192 pages accessed randomly, and only 256 TLB slots,
  any given page has a 256/8192 = 1/32 ≈ 3.1% chance of being in the TLB.

  TLB miss rate ≈ 1 - (256/8192) ≈ 96.9% for random accesses.

Each TLB miss → 4-level page table walk → 4 memory accesses.
  Effective memory accesses per data access = 1 + 4×0.969 ≈ 4.9 memory accesses.

This is catastrophically slow: nearly every array access triggers a 4-memory-access
overhead for address translation alone.

Fix: reduce working set size. Process A then B sequentially (not randomly mixed),
or tile the access pattern so each tile fits in TLB-coverable memory.

──────────────────────────────────────────────────────

Q4: Exhausting RAM + swap

Available storage for pages: 32 GB RAM + 128 MB swap = 32,128 MB ≈ 32.125 GB
malloc(60 GB) requested.

malloc() itself returns immediately — no physical pages allocated yet.
First time the process writes each page of the 60 GB allocation:
  → page fault
  → OS needs a free frame
  → RAM full: evict a page to swap
  → swap full (after 128 MB used): no more space to evict!
  → OOM condition

OS response (Linux OOM killer):
  Calculates "badness score" for each process:
    - Proportional to memory use (larger = more likely to kill)
    - Adjusted for process priority (root processes protected)
    - The process that TRIGGERED the OOM (made the 60 GB malloc) is a
      very strong candidate
  
  Sends SIGKILL to selected process. The killed process releases all its
  pages. Other processes can continue.

  If the malloc-ing process IS the OOM trigger, it's very likely to be killed.

──────────────────────────────────────────────────────

Q5: mmap with MAP_PRIVATE and two processes

Two processes mmap the same file (data.bin, 32 MB = 8,192 pages).

Initial state (both MAP_PRIVATE, no writes yet):
  Both processes' page tables point to the SAME physical frames.
  32 MB file = 8,192 physical frames shared between both processes.
  Physical memory usage: 8,192 frames (ONE copy of the file in RAM).

Process 1 writes to A[0] with MAP_PRIVATE:
  MAP_PRIVATE = copy-on-write. Writes create process-private copies.
  
  Write triggers page fault (page was read-only due to COW).
  OS: allocate new physical frame, copy the 4KB page containing A[0].
  Process 1's page table: VPN of A[0]'s page → NEW private frame (writable).
  Process 2's page table: VPN of A[0]'s page → ORIGINAL file frame (read-only).

Process 2 reads A[0]:
  Reads from the ORIGINAL file-backed frame — sees the PRE-WRITE value.
  Process 2 is completely unaffected by Process 1's write.

Summary:
  Physical frames shared: 8,191 (all pages except the one Process 1 modified).
  Physical frames private to Process 1: 1 (the COW copy of A[0]'s page).
  
  This is how shared libraries work: libc.so is one physical copy in RAM,
  page-table-mapped into hundreds of processes' address spaces. Read-only pages
  (code, rodata) are shared forever. The tiny portion of writeable global state
  gets COW'd per-process.
```

</details>

---

## Common Mistakes

**Mistake 1: Thinking `malloc()` immediately consumes RAM**
- `malloc()` returns virtual address space. Physical RAM is committed only when you write to each page (demand paging). Allocating 1 GB and writing to 10 KB uses 10 KB of RAM, not 1 GB. This is why `htop`'s VIRT column is always larger than RES (resident).

**Mistake 2: Treating all memory accesses as equal cost**
- TLB hit: near-zero overhead. TLB miss: 4 memory accesses (for 4-level page table). Page fault: microseconds (physical RAM) to milliseconds (disk swap). The cost range is over a million-to-one. Cache-oblivious algorithms (Ch06) implicitly help TLB performance too.

**Mistake 3: Assuming SIGSEGV means "null pointer dereference"**
- Any invalid virtual address access (unmapped page, write to read-only page, execute no-execute page) causes SIGSEGV. Stack overflow (writing past the stack guard page), buffer overflows, use-after-free — all appear as SIGSEGV.

**Mistake 4: Not understanding that shared libraries share physical memory**
- 100 processes all using `libc.so` don't each have their own copy of libc in RAM — they share one copy (read-only pages). This is the whole point of shared libraries. Switching to static linking bloats every process and uses far more total RAM.

---

## Connections

- **Chapter 06 — Cache:** TLB is a cache for page table entries. Cache and TLB misses interact — a TLB miss causes a page table walk, which itself causes data cache accesses. Poor TLB behavior degrades cache performance.
- **Chapter 08 — Processes:** `fork()` creates a new page table (virtual address space). `mmap()` is the system call that creates virtual memory mappings. `brk()` extends the heap mapping.
- **Chapter 10 — Heap:** `malloc()` builds on top of `mmap()`/`brk()` to provide sub-page allocation granularity. The heap is a virtual memory mapping managed by the malloc implementation.
- **Chapter 11 — Threads:** Threads in the same process share one virtual address space (one set of page tables). This is why thread communication is fast (no page table switch) but data races are easy to create.

---

> [← 08 Processes & System Calls](08_Processes_System_Calls.md) | [Course Index](README.md) | [Next → 10 Dynamic Memory & the Heap](10_Dynamic_Memory_Heap.md)
