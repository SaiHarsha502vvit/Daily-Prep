# Chapter 05 — Processor Architecture & Pipelining

> [← 04 Machine Code & Assembly](04_Machine_Code_Assembly.md) | [Course Index](README.md) | [Next → 06 Memory Hierarchy & Caching](06_Memory_Hierarchy_Caching.md)

---

## The Core Problem: Instructions Take Time

Executing a single instruction involves multiple steps:
1. **Fetch** the instruction from memory
2. **Decode** what it means (what operation, which registers/memory)
3. **Execute** the arithmetic or logic
4. **Memory access** (if it's a load or store)
5. **Write back** the result to a register

Each step takes time. A naive CPU that does one step at a time would be terribly slow. The solution is **pipelining** — overlapping these steps for multiple instructions simultaneously, like an assembly line.

---

## The Classic 5-Stage Pipeline

Think of a car assembly line: while one car is being painted, the next car is being fitted with doors, and the one after that is having its frame welded. All stages run in parallel.

```
Clock cycle:  1    2    3    4    5    6    7    8    9
              
Instruction 1: F    D    E    M    W
Instruction 2:      F    D    E    M    W
Instruction 3:           F    D    E    M    W
Instruction 4:                F    D    E    M    W
Instruction 5:                     F    D    E    M    W

F=Fetch, D=Decode, E=Execute, M=Memory, W=Writeback

In cycle 5: I1 writes back while I2 accesses memory while I3 executes
            while I4 decodes while I5 is being fetched.
5 instructions in flight simultaneously!
```

- Without pipelining: 5 instructions × 5 cycles each = 25 cycles.
- With pipelining: 5 + 4 = 9 cycles (5 stages + 4 fill cycles).
- For 1000 instructions: 1004 cycles vs 5000 cycles — nearly 5× speedup.

**Ideal throughput:** One instruction completed per cycle (after pipeline is full).

---

## Pipeline Hazards: When the Ideal Breaks Down

Hazards are situations where the pipeline can't proceed at full speed.

### 1. Data Hazard (RAW — Read After Write)

```asm
add rax, rbx    ; rax = rax + rbx   (writes rax in W stage, cycle 5)
mul rcx, rax    ; rcx = rcx * rax   (needs rax in E stage, cycle 3!)
```

The `mul` needs `rax` in cycle 3 (Execute), but `add` doesn't write `rax` until cycle 5 (Writeback). Two cycles of stalling required.

```
Cycle:    1    2    3    4    5    6    7
add:      F    D    E    M    W
mul:           F    D   STALL STALL E    M    W
```

**Solution: Forwarding (bypassing)**

The result of the ALU is forwarded directly to the next instruction's execute stage without waiting for writeback:

```
Cycle:    1    2    3    4    5
add:      F    D    E    M    W
mul:           F    D    E ← forwarded from add's E output
```

Modern CPUs implement forwarding for most common cases. Forwarding reduces stalls from 2 to 0 in this example.

### 2. Control Hazard (Branch)

```asm
cmp rax, 0
je  .target    ; jump if zero — where to fetch NEXT?
.fallthrough:
    mov rbx, 1  ← fetched speculatively
.target:
    mov rbx, 2  ← or this?
```

When the pipeline fetches the instruction after `je`, it doesn't know whether the branch will be taken (not evaluated until Execute stage). If it guesses wrong, the speculative instructions must be flushed.

**Branch penalty:** On a modern 14-20 stage deep pipeline, a mispredicted branch costs 15-20 cycles.

**Solutions:**

**1. Branch Prediction:** The CPU predicts whether the branch will be taken, speculatively executes the predicted path. Modern predictors are >99% accurate, reducing effective penalty to near zero.

**2. Branch Prediction Algorithms:**
- Static: always predict not-taken (or backward branches taken, forward not taken)
- Dynamic — 2-bit saturating counter: each branch has a state machine (Strongly Taken → Weakly Taken → Weakly Not Taken → Strongly Not Taken). Works well for loops.
- Pattern history table: uses last N branch outcomes to predict the next.
- Modern CPUs: neural network-based predictors, correlating with other branches.

**3. Branch-free code:** Compiler uses conditional moves (`cmov`) instead of jumps:
```asm
; if (rax > 0) rbx = 1; else rbx = 0;
; Without branch:
xor  rbx, rbx        ; rbx = 0
cmp  rax, 0
setg bl              ; bl = 1 if rax > 0
; No branch! cmov and set* instructions execute without a branch penalty.
```

### 3. Structural Hazard

Two instructions need the same hardware resource at the same time (e.g., two memory accesses). Solved by duplicating hardware (e.g., separate L1 instruction cache and data cache).

---

## Out-of-Order Execution

Modern CPUs are not limited to executing instructions in program order. The **out-of-order (OOO) engine** can:

1. Look ahead in the instruction stream (window of 100-300 instructions).
2. Find instructions whose inputs are ready (no data dependency).
3. Execute them in whatever order maximizes resource utilization.
4. Retire results in original program order (preserving the illusion of sequential execution).

```
Program order:     A → B → C → D

Dependency graph:  A ──┐
                   B   ├──→ D
                   C ──┘

B and C have no dependency on each other.
OOO engine can execute B and C in parallel!
A → (B,C in parallel) → D  ← fewer cycles than A → B → C → D.
```

**Instruction-level parallelism (ILP):** The parallelism within a single instruction stream. OOO CPUs exploit ILP automatically.

---

## Superscalar Execution

Even without OOO, a CPU can have MULTIPLE execution units and issue several instructions per cycle:

```
Cycle 1: [add rax, rbx]  [mul rcx, rdx]   ← two independent instructions issued together
Cycle 2: [sub r8, r9]    [xor r10, r11]   ← two more
```

A modern CPU can have:
- 4-8 ALUs (integer arithmetic)
- 2-4 FPUs (floating-point)
- 2+ load/store units
- 1-2 branch units

This is **superscalar execution** — multiple instructions retire per cycle. Modern x86 CPUs retire 4-6 instructions per cycle on average.

**IPC (Instructions Per Cycle):** A key CPU performance metric. Intel Core chips achieve IPC of 4-5 on real workloads.

---

## Spectre and Meltdown: When Speculation Goes Wrong

**2018 disclosure — affected nearly every CPU made since 1995.**

**Speculative execution** runs code before knowing if it should run (for branch prediction). The CPU executes speculatively, then rolls back if wrong — but the rollback doesn't erase side effects on the cache.

**Meltdown (simplified):**
```c
// User program, trying to read kernel memory (should be forbidden)
char* kernel_memory = (char*)0xFFFF000000000000;  // kernel address
char secret = *kernel_memory;   // OS protection: "ILLEGAL ACCESS!" exception
// But the CPU speculatively continued for a few cycles before exception handled...
// secret is briefly loaded into CPU internals and TOUCHES the cache
```

The attacker can't directly read `secret`. But they can measure which cache line got loaded (cache timing side-channel), recovering the secret byte-by-byte.

**Defense (Kernel Page-Table Isolation / KPTI):** Separate page tables for kernel and user mode, flushed on every transition. Cost: 5-30% overhead for syscall-heavy workloads. Pure user-space code barely affected.

**Why this matters:** Spectre/Meltdown showed that micro-architectural optimization assumptions (caching, speculation) can break security guarantees. You cannot reason about security at the software level alone.

---

## RISC vs CISC: Two Design Philosophies

**CISC (Complex Instruction Set Computing) — x86:**
- Many complex instructions (LOOP, SCASD, string operations)
- Variable instruction length (1-15 bytes for x86)
- Instructions can directly access memory (no load/store separation)
- Hardware complexity hides in CPU; software is simpler
- More transistors needed for decoding
- Intel/AMD

**RISC (Reduced Instruction Set Computing) — ARM, RISC-V:**
- Small set of simple, fixed-length instructions (4 bytes each)
- Load-store architecture: arithmetic only on registers, explicit loads/stores
- Simpler hardware → lower power consumption → better for mobile
- Compiler must work harder
- ARM: Phones, Apple M1/M2/M3, AWS Graviton servers
- RISC-V: Open ISA, growing in embedded, datacenters

**Interesting hybrid:** Modern x86 CPUs internally translate x86 instructions into RISC-like micro-operations (µops) that the OOO engine executes. The CISC interface is for backward compatibility; the RISC core is for efficiency.

---

## Section Challenge

> ### Pipeline Performance Analysis
>
> A 5-stage pipeline (F, D, E, M, W) with clock cycle time 1ns. Data hazards require 2 stall cycles unless forwarding is used. Branch mispredictions cost 3 stall cycles. Branch prediction accuracy is 90%.
>
> **Q1:** Without any hazards, how long does a sequence of 100 instructions take?
>
> **Q2:** In a loop that runs 1000 iterations, every 4th instruction causes a data hazard (no forwarding). The loop exits at the end via a branch. Total time?
>
> **Q3:** With forwarding added, the same data hazards are eliminated (0 stall cycles). How much time is saved?
>
> **Q4:** A branch-heavy function has 200 branches, 90% predicted correctly. Expected total stall cycles from mispredictions?
>
> **Q5 (Stretch):** A tight inner loop:
> ```asm
> .loop:
>     cmp rax, 0
>     je .exit
>     sub rax, 1
>     jmp .loop
> ```
> If rax starts at 1,000,000: how many branch mispredictions occur? What is the penalty?

<details>
<summary>Full answers</summary>

```
Q1: 100 instructions, no hazards

Pipeline fill: 4 cycles (F-D-E-M-W for first instruction, then 1 per additional)
Total: 4 + 100 = 104 cycles × 1ns = 104ns

Alternatively: last instruction finishes at cycle (4 + 100) = 104.
(First finishes at cycle 5, each subsequent finishes one cycle later.)

──────────────────────────────────────────────────────

Q2: 1000-iteration loop, every 4th instruction causes data hazard

Instructions per iteration (approximate): let's say 10 instructions.
  10 × 1000 = 10,000 instructions total.
  Plus 1 branch at the end = 10,001 instructions.

Every 4th instruction = 10,000/4 = 2,500 data hazard stalls × 2 cycles = 5,000 stall cycles.

The loop-exit branch: ONE misprediction (when rax finally reaches 0 and loop exits).
  90% accuracy → but this is ONE branch, mispredicted once.
  Stall: 3 cycles.

Actually the jmp at the end of the loop: the cmp/je branch checks loop condition.
In 1000 iterations: 999 times branch is NOT taken (loop continues), 1 time taken (exits).
If predictor predicts "not taken": 999 correct, 1 misprediction. Penalty: 3 cycles.

Pipeline fill: 4 cycles.

Total: 4 + 10,001 + 5,000 + 3 = 15,008 cycles × 1ns = 15,008ns ≈ 15μs

──────────────────────────────────────────────────────

Q3: With forwarding — time saved

With forwarding: 0 stall cycles from data hazards.
Savings: 5,000 stall cycles × 1ns = 5,000ns = 5μs

New total: 4 + 10,001 + 0 + 3 = 10,008 cycles × 1ns ≈ 10μs

Speedup from forwarding: 15,008 / 10,008 ≈ 1.5× faster

──────────────────────────────────────────────────────

Q4: Branch mispredictions, 200 branches, 90% accuracy

Mispredictions: 200 × (1 - 0.90) = 200 × 0.10 = 20 mispredictions
Stall cycles: 20 × 3 cycles = 60 stall cycles.

──────────────────────────────────────────────────────

Q5: Loop mispredictions for rax = 1,000,000

.loop:
  cmp rax, 0       ← compares rax to 0
  je .exit         ← taken only on LAST iteration (rax becomes 0)
  sub rax, 1       ← decrements rax
  jmp .loop        ← always taken (unconditional)

Number of iterations: 1,000,000 (rax counts down from 1,000,000 to 0)
Wait — let's trace:
  Start: rax = 1,000,000. cmp 1,000,000, 0: not zero → je not taken.
  sub: rax = 999,999. jmp: loop again.
  ...
  rax = 1: cmp 1, 0: not zero → not taken. sub: rax=0. jmp: loop again.
  rax = 0: cmp 0, 0: ZERO → je TAKEN → exit.

Total iterations: 1,000,001 (1M times through the body + 1 exit)

Branches:
  "je .exit": taken ONCE (final iteration), not-taken 1,000,000 times.
  "jmp .loop": unconditional, always taken. Predicted correctly always. No misprediction.

A good predictor for "je .exit": predicts NOT TAKEN every time (loop is mostly not-taken).
  1,000,000 correct predictions (not taken).
  1 misprediction (final iteration, when it IS taken).

Mispredictions from "je .exit": 1
Penalty: 1 × 3 cycles = 3 cycles.

Surprisingly, this tight counting loop has only ONE branch misprediction
for 1 million iterations! The predictor easily learns "this branch is almost
never taken" and the loop runs at near-peak throughput.

The expensive case is branches with RANDOM outcomes (like searching an
unsorted array — the comparison branch is 50% unpredictable).
```

</details>

---

## Common Mistakes

**Mistake 1: Thinking a "faster" algorithm always runs faster on real hardware**
- An O(n log n) sort with poor cache behavior can be SLOWER than an O(n²) sort that accesses memory sequentially. The pipeline + cache combination means access patterns matter as much as operation count.

**Mistake 2: Assuming instruction count equals execution time**
- A single `div` instruction (integer division) takes 20-90 cycles on x86. A simple `add` takes 1 cycle. Instruction count is misleading.

**Mistake 3: Writing branch-heavy code thinking the predictor handles it**
- Random or data-dependent branches (hash-dependent, binary search pivots) are unpredictable. Each misprediction is 15-20 cycle penalty on modern deep pipelines.

**Mistake 4: Underestimating memory latency vs CPU speed**
- CPU executes at ~3-5 GHz (0.3ns per cycle). DRAM access: ~100ns = 300 cycles.
- The memory bottleneck is FAR more important than instruction-level optimizations for many workloads. This leads into Chapter 06.

---

## Connections

- **Chapter 04 — Assembly:** Each assembly instruction = one or more micro-operations processed by the pipeline. Instruction encoding (length, operand types) affects decode complexity.
- **Chapter 06 — Memory:** The memory stage of the pipeline is where cache hits/misses are determined. A cache miss stalls the pipeline for hundreds of cycles.
- **Chapter 11 — Threads:** Out-of-order execution and cache coherence create the memory consistency issues that make multi-threaded programming hard. The CPU may reorder memory accesses.

---

> [← 04 Machine Code & Assembly](04_Machine_Code_Assembly.md) | [Course Index](README.md) | [Next → 06 Memory Hierarchy & Caching](06_Memory_Hierarchy_Caching.md)
