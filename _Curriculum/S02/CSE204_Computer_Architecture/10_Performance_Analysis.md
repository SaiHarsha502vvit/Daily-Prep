# Chapter 10 — Performance Analysis: CPI, Amdahl's Law, and Benchmarking

> [← 09 I/O Subsystems and DMA](09_IO_Subsystems_DMA.md) | [Course Index](README.md)

---

## The Problem: You Made Something Faster. How Much Faster?

You optimized the matrix multiply loop. On your laptop it ran in 4.2 seconds before and 1.1 seconds after. Is that good? How does it compare to other architectures? If you made memory accesses twice as fast, how much faster would the full program be?

These questions require a **quantitative performance model** — a mathematical framework that lets you predict, measure, and compare performance across machines and optimizations. This chapter derives the complete model from first principles.

---

## The Iron Law of Computer Performance

**Total execution time = Instruction count × CPI × Clock period**

```
Time = IC × CPI × (1 / clock_rate)
     = IC × CPI / clock_rate

Where:
  IC         = number of instructions executed (dynamic count, not static)
  CPI        = cycles per instruction (average)
  clock_rate = cycles per second (Hz)
```

**This is the Iron Law.** Every performance optimization changes one or more of these three terms. Understanding WHICH term your optimization affects tells you the maximum possible speedup.

| Optimization | Affects | Example |
|---|---|---|
| Better compiler | IC (fewer instructions) | Loop unrolling, dead code elimination |
| Better ISA | IC (more powerful instructions) | SIMD (one instruction, 8 adds) |
| Pipelining | CPI (more IPC) | 5-stage pipeline: CPI → 1 |
| Out-of-order | CPI (IPC > 1) | Superscalar: 4 instructions/cycle |
| Higher GHz | clock_rate | Better process node (7nm → 5nm) |
| Cache | CPI (fewer stall cycles) | L2 cache: miss penalty 150→15 cycles |
| Branch prediction | CPI (fewer flush stalls) | TAGE: 99% accuracy |

---

## The Full CPI Formula

Expanding CPI to account for all stall sources:

```
CPI_actual = CPI_base + stall_CPI

CPI_base = 1.0 (ideal pipelined, no hazards)

stall_CPI = data_hazard_stalls
           + control_hazard_stalls
           + memory_stall_cycles_per_instruction

Breaking down memory stalls:
memory_stall = (load+store fraction) × miss_rate_L1 
               × [L2_hit_time + L2_miss_rate × (L3_hit_time + L3_miss_rate × DRAM_penalty)]

Expanding all:
CPI = 1.0
    + (frac_load_store × miss_rate_L1 × miss_penalty_L1→L2)
    + (frac_load_store × miss_rate_L1 × miss_rate_L2 × miss_penalty_L2→L3)
    + (frac_load_store × miss_rate_L1 × miss_rate_L2 × miss_rate_L3 × DRAM_penalty)
    + (frac_branch × mispred_rate × mispred_penalty)
    + (frac_load × frac_load_use × 1)  [load-use stall]
    + (frac_mem × TLB_miss_rate_L1 × TLB_miss_penalty)
```

**Worked example (realistic server workload):**

```
CPI_base = 1.0

Load-use stalls:
  30% loads, 20% of those are load-use → 0.30 × 0.20 × 1 = 0.06

Branch misprediction:
  15% branches, 2% misprediction rate, 14-cycle penalty
  → 0.15 × 0.02 × 14 = 0.042

L1 cache miss stalls:
  40% memory ops, 4% L1 miss rate, L2 hit in 12 cycles
  → 0.40 × 0.04 × (fraction missing to L2 × L2 hit) + (fraction missing to DRAM × DRAM)
  
  Simplified: 40% memory × 4% L1 miss × 
              [12 + 0.20 × (40 + 0.50 × 150)]
  = 0.40 × 0.04 × [12 + 0.20 × 115]
  = 0.40 × 0.04 × [12 + 23]
  = 0.40 × 0.04 × 35
  = 0.56

TLB stalls:
  40% memory × 1% L1 TLB miss × (4 + 0.15 × 20)
  = 0.40 × 0.01 × 7
  = 0.028

CPI_total = 1.0 + 0.06 + 0.042 + 0.56 + 0.028 = 1.69

Performance killers (in order of impact):
  L1 cache misses:     0.56 / 0.69 = 81% of all stalls
  Load-use hazards:    0.06 / 0.69 = 8.7%
  Branch mispredicts:  0.042/ 0.69 = 6.1%
  TLB misses:          0.028/ 0.69 = 4.1%
```

**Cache misses dominate.** This is why cache-friendly code (data layout, access patterns, prefetching) gives larger speedups than branch prediction improvements for memory-intensive code.

---

## Amdahl's Law

**The fundamental limit on parallel speedup.**

A program has two parts:
- Fraction `f` that CAN be sped up (parallelizable / optimizable)
- Fraction `1-f` that CANNOT (serial bottleneck, I/O bound, etc.)

You speed up the parallelizable part by factor `k`.

```
Speedup(k) = 1 / [(1-f) + f/k]

As k → ∞ (infinite optimization of the f fraction):
  Speedup_max = 1 / (1-f)
```

**Example: 90% parallelizable (f = 0.9):**
```
k=2:   1/(0.1 + 0.9/2)  = 1/(0.1+0.45) = 1.82×
k=4:   1/(0.1 + 0.9/4)  = 1/(0.1+0.225) = 3.08×
k=8:   1/(0.1 + 0.9/8)  = 1/(0.1+0.1125) = 4.71×
k=16:  1/(0.1 + 0.9/16) = 1/(0.1+0.0562) = 6.40×
k=∞:   1/0.1 = 10×      (maximum possible speedup, regardless of how many cores!)
```

**The brutal insight:** Even if you parallelize 90% of the work perfectly, you can NEVER achieve more than 10× speedup. The 10% serial fraction is the absolute ceiling.

```
Speedup vs cores for 90% parallel fraction:
Cores:    1    2    4    8   16   32   64   ∞
Speedup:  1   1.8  3.1  4.7  6.4  7.8  8.8  10
```

After 16 cores, adding more cores gives diminishing returns. The serial 10% is the bottleneck.

**Amdahl's Law in practice (multi-core CPU):**

| Fraction parallel | Max speedup (∞ cores) |
|---|---|
| 50% | 2× |
| 75% | 4× |
| 90% | 10× |
| 95% | 20× |
| 99% | 100× |

This is why single-threaded performance still matters enormously in CPUs — and why Intel and AMD continue to push single-core GHz even in 2024, not just core counts.

---

## Gustafson's Law: A Different View

**Amdahl's critique:** Assumes fixed problem size. As you add parallelism, you keep the problem the same and just go faster.

**Gustafson's insight:** Larger machines are often used for LARGER problems. As cores scale from 1 to 100, researchers use 100× bigger datasets — the serial fraction stays approximately constant as an absolute time, not a fraction.

```
Gustafson's Law:
Scaled speedup(k) = (1-f) + k × f
               = k - f × (k-1)

For f = 0.9, k = 100:
Gustafson: 100 - 0.9 × 99 = 100 - 89.1 = 10.9× (relative to serial on the same data)
But actual throughput: 100× (you processed 100× more data in the same time!)
```

**The difference:** Amdahl measures "how fast can you do the SAME thing?" Gustafson measures "how much MORE can you do in the SAME time?" For scale-out workloads (databases, ML training), Gustafson's view is more relevant.

---

## Roofline Model

The roofline model maps a program onto two limits: **compute bound** vs **memory bound**.

```
Peak compute: CPU can do P FLOPS/second (floating point ops)
Peak memory bandwidth: memory system delivers B bytes/second

Operational intensity I = FLOPS / bytes_accessed
(How many operations do you do per byte transferred from memory?)

Attainable performance = min(P, I × B)

                    ───────────── P (peak compute) ─────────────
GFLOPS/s            /
                   /  slope = B (memory bandwidth)
                  /
─────────────────
             I_ridge = P/B     →  Operational Intensity
```

**Below the ridge (I < P/B):** Memory bound. Performance = I × B. Doubling compute doesn't help; doubling memory bandwidth does.

**Above the ridge (I > P/B):** Compute bound. Performance = P. Doubling memory bandwidth doesn't help; doubling FLOPS (SIMD, higher GHz) does.

**Worked example:**

```
GPU: P = 20 TFLOPS, B = 2 TB/s (HBM memory bandwidth)
Ridge: I_ridge = 20 × 10^12 / (2 × 10^12) = 10 FLOPS/byte

Matrix multiply (large matrices): I ≈ 500 FLOPS/byte → compute bound
  Attainable = P = 20 TFLOPS ✓ (GPU is excellent for this)

Memory bandwidth streaming (simple sum): I ≈ 0.25 FLOPS/byte → memory bound
  Attainable = 0.25 × 2 TB/s = 500 GFLOPS (only 2.5% of peak FLOPS!)
```

**The roofline diagnostic:**
1. Compute your workload's operational intensity I.
2. If I < I_ridge: optimize memory access patterns, use SIMD to increase bytes processed per fetch.
3. If I > I_ridge: optimize compute (better algorithm, SIMD, more cores).

---

## Benchmarks: Measuring Real Performance

**What makes a good benchmark:**
1. **Representative:** Reflects actual workload (not just `dhrystone` which measures what compilers can optimize away)
2. **Reproducible:** Same result every run (not dependent on OS scheduler)
3. **Fair:** No vendor-specific tuning unfairly advantages one platform

**SPEC CPU2017:** The standard benchmark for CPU performance.
- SPECrate: throughput (multiple copies of the workload)
- SPECspeed: single-instance latency
- Integer suite (C, C++, Fortran integer programs)
- Floating-point suite (scientific computation)
- Companies tune compilers and microarchitectures for SPEC — results should be interpreted cautiously

- **PARSEC:** Parallel workloads (multithreaded benchmarks)
- **STREAM:** Memory bandwidth measurement (the definitive test of DRAM throughput)
- **CoreMark:** Embedded CPU benchmark (standardized, hard to game)
- **MLPerf:** ML inference and training benchmarks

**The Heisenbench problem:** Measuring performance changes performance. Hardware performance counters read the cache hierarchy, branch predictor state, etc. — the act of measuring can cause pipeline flushes or TLB invalidations. Always take multiple samples and report statistics.

---

## Performance Counters

Modern CPUs include **hardware performance counters** — registers that count microarchitectural events:

```
PMC (Performance Monitoring Counter) events:
  INST_RETIRED:         instructions actually completed
  CPU_CYCLES:           total clock cycles
  CACHE_MISSES_L1:      L1 cache miss count
  CACHE_REFERENCES_L1:  total L1 cache accesses
  BRANCH_MISSES:        mispredicted branches
  TLB_MISSES:           TLB miss count
  MEM_LOAD_RETIRED:     memory loads that completed
```

**Tools:**
- `perf stat` (Linux): reads performance counters, gives CPI, IPC, cache miss rates
- `Intel VTune`, `AMD uProf`: detailed profiling with flame graphs
- `valgrind --tool=cachegrind`: simulate cache and report miss rates

**Example `perf stat` output:**
```
$ perf stat ./matrix_multiply

 Performance counter stats for './matrix_multiply':

         14,234.5 ms      elapsed time
    42,703,144,023      instructions    # 1.24 insn per cycle
    34,445,281,045      cycles
     2,841,209,302      cache-misses    # 6.65 % of all cache refs
    42,719,854,231      cache-references
       315,208,947      branch-misses   # 1.23% of all branches

       14.234 seconds time elapsed
```

From this:
- CPI = 1/IPC = 1/1.24 = 0.81 (superscalar: issuing > 1 instruction per cycle)
- Cache miss rate = 6.65% (high — suggests memory-bound code)
- Branch miss rate = 1.23% (acceptable)

---

## Section Challenge

> ### Full Performance Analysis
>
> A server CPU has: 3.5 GHz clock, 4-wide superscalar (CPI_base = 0.25 = 4 IPC ideal), L1 cache (3 cycles, 5% miss rate), L2 cache (15 cycles, 20% of L1 misses), L3 cache (45 cycles, 40% of L2 misses), DRAM (180 cycles).
>
> **Q1:** Calculate the memory stall CPI contribution for a program with 35% memory operations. What is the total CPI (base + memory stalls)?
>
> **Q2:** A new L2 cache halves the L2 hit time to 7 cycles and reduces the L2 miss rate to 15%. Recalculate CPI and the speedup achieved.
>
> **Q3:** Amdahl's Law: 75% of the program's execution time can be sped up 8× by an optimization (vectorization + cache improvement). The remaining 25% is serial I/O. What is the overall speedup? What is the maximum possible speedup (infinite improvement to the 75%)?
>
> **Q4:** The program processes 100GB of data, performing 4 floating-point operations per byte. The CPU's peak FLOPS = 500 GFLOPS, DRAM bandwidth = 40 GB/s. Is this program compute-bound or memory-bound? What is the attainable performance? Where is the roofline ridge (operational intensity threshold)?
>
> **Q5 (Stretch):** You have two architectures:
> - CPU: 3.5 GHz, CPI = 1.4, IC = 10 billion instructions for a workload
> - GPU: 1.8 GHz, CPI = 0.25 (4 IPC), IC = 50 billion micro-operations (more operations but massively parallel)
>
> Calculate total execution time for each. Then apply Amdahl's Law: if 80% of the workload can run on the GPU (with GPU's execution time for that fraction) but 20% must run on the CPU, and GPU processing is 10× faster than CPU for the parallelizable part — what is the total system speedup from using GPU for the 80%?

<details>
<summary>Full answers</summary>

```
Q1: Memory stall CPI

L3 miss penalty (goes to DRAM):
  L1 miss → L2 → L3 → DRAM
  L2 miss fraction: 20% of L1 misses.
  L3 miss fraction: 40% of L2 misses = 0.40 × 0.20 = 8% of L1 misses → DRAM.
  
  Average miss penalty per L1 miss:
  = 15 cycles (L2 hit prob 80%) + 0.20 × [45 cycles (L3 hit prob 60%) + 0.40 × 180]
  = 0.80 × 15 + 0.20 × [0.60 × 45 + 0.40 × 180]
  = 12 + 0.20 × [27 + 72]
  = 12 + 0.20 × 99
  = 12 + 19.8
  = 31.8 cycles per L1 miss

memory_stall_CPI = frac_mem × L1_miss_rate × avg_miss_penalty
                 = 0.35 × 0.05 × 31.8
                 = 0.557

Total CPI = CPI_base + memory_stall = 0.25 + 0.557 = 0.807.

Performance = 3.5 GHz / 0.807 CPI = 4.34 GIPS
(compared to ideal 3.5 / 0.25 = 14 GIPS — memory stalls cost 68% of peak!)

──────────────────────────────────────────────────────

Q2: New L2 cache (7 cycles, 15% miss rate)

New average miss penalty per L1 miss:
= 0.85 × 7 + 0.15 × [0.60 × 45 + 0.40 × 180]
= 5.95 + 0.15 × [27 + 72]
= 5.95 + 0.15 × 99
= 5.95 + 14.85
= 20.8 cycles

New memory_stall_CPI = 0.35 × 0.05 × 20.8 = 0.364

New total CPI = 0.25 + 0.364 = 0.614

Speedup = Old_CPI / New_CPI = 0.807 / 0.614 = 1.31×

The new L2 cache provides a 31% speedup by:
  - Reducing per-miss penalty from 31.8 to 20.8 cycles (35% reduction per miss)
  - Reducing L2 miss rate from 20% to 15%

──────────────────────────────────────────────────────

Q3: Amdahl's Law

f = 0.75 (fraction sped up), k = 8 (speedup on that fraction), (1-f) = 0.25 serial.

Speedup = 1 / [(1-f) + f/k]
        = 1 / [0.25 + 0.75/8]
        = 1 / [0.25 + 0.09375]
        = 1 / 0.34375
        = 2.91×

Maximum possible speedup (k → ∞):
  Speedup_max = 1 / (1-f) = 1 / 0.25 = 4×

Even with infinite speedup on 75% of the work, the maximum overall speedup is 4×.
The 25% serial I/O is the hard ceiling.

The k=8 optimization achieves 2.91/4 = 73% of the theoretical maximum speedup.

──────────────────────────────────────────────────────

Q4: Roofline model

Operational intensity: I = FLOPS/byte = 4 FLOPS / 1 byte = 4 FLOPS/byte.
Peak compute: P = 500 GFLOPS.
Memory bandwidth: B = 40 GB/s.

Ridge point: I_ridge = P / B = 500 / 40 = 12.5 FLOPS/byte.

Our program: I = 4 FLOPS/byte < 12.5 FLOPS/byte → MEMORY BOUND.

Attainable performance = min(P, I × B) = min(500, 4 × 40) = min(500, 160) = 160 GFLOPS.

We achieve only 160/500 = 32% of peak FLOPS — limited by memory bandwidth.

To become compute-bound: need I > 12.5 FLOPS/byte.
Options:
  1. Use SIMD to do more work per byte loaded (e.g., 16 FLOPS per 8 bytes loaded = 2 FLOPS/byte — wait, this doesn't help if it's the same data)
  
  Actually: to increase operational intensity, you must either:
  a. Do more computation per byte (e.g., run more loop iterations over cached data before accessing new data)
  b. Access less data (cache-tiling: compute over a small tile many times before moving on)
  
  Matrix tiling at 12.5 FLOPS/byte would make it just compute-bound.
  Standard matrix multiply (large n) already achieves I ≈ n/2 FLOPS/byte — for large n, this is compute-bound.
  
For our workload (4 FLOPS/byte), doubling memory bandwidth to 80 GB/s would give:
  Attainable = 4 × 80 = 320 GFLOPS (2× speedup)
  Still memory bound (ridge is now at 500/80 = 6.25 FLOPS/byte — and 4 < 6.25).

──────────────────────────────────────────────────────

Q5: CPU vs GPU + Amdahl for GPU offload

CPU execution time:
  Time_CPU = IC × CPI / clock_rate
           = 10 × 10^9 × 1.4 / (3.5 × 10^9)
           = 14 / 3.5 = 4.0 seconds.

GPU execution time:
  Time_GPU = IC_GPU × CPI_GPU / clock_rate_GPU
           = 50 × 10^9 × 0.25 / (1.8 × 10^9)
           = 12.5 / 1.8 = 6.94 seconds.

Wait — the GPU is SLOWER despite being "massively parallel"? Yes, for this workload:
  More micro-operations + lower clock rate → 6.94s vs CPU's 4.0s.
  The GPU's IPC advantage (4 vs 0.71 on CPU) is offset by 5× more instructions.
  This shows GPU is only better when the PARALLELISM reduces IC dramatically.
  (Real GPU workloads are structured so that GPU IC × CPI / GHz < CPU IC × CPI / GHz.)

Amdahl with GPU offload (using the given "10× faster for 80% of work"):

If the serial CPU time is T_serial = 4.0 seconds:
  80% portion (GPU, 10× faster): time = 0.80 × 4.0 / 10 = 0.32 seconds on GPU.
  20% portion (CPU serial): time = 0.20 × 4.0 = 0.80 seconds on CPU.
  Total: 0.32 + 0.80 = 1.12 seconds.

Speedup = 4.0 / 1.12 = 3.57×.

Amdahl formula check:
  f = 0.80, k = 10.
  Speedup = 1 / [(1-0.80) + 0.80/10] = 1/[0.20 + 0.08] = 1/0.28 = 3.57×. ✓

Maximum possible speedup (GPU is infinitely fast on 80%):
  Speedup_max = 1/(1-0.80) = 1/0.20 = 5×.

The 20% serial CPU work limits the maximum speedup to 5×, regardless of how fast the GPU is.
```

</details>

---

## Course Summary: What We Built

This course derived computer architecture from first principles — from transistors to performance models.

```
Chapter 01: ISA — the contract between hardware and software
Chapter 02: Single-Cycle Datapath — how gates implement the ISA
Chapter 03: Pipelining — overlapping execution for 3-5× throughput
Chapter 04: Hazards — what breaks the pipeline and how forwarding/stalls fix it
Chapter 05: Branch Prediction — near-eliminating control hazard cost (98% accuracy)
Chapter 06: Cache Design — 69× memory speedup via spatial/temporal locality
Chapter 07: Replacement & Write Policies — completing the cache design
Chapter 08: Virtual Memory — quantitative TLB model, huge pages, page faults
Chapter 09: I/O Subsystems — DMA, interrupts, PCIe bandwidth analysis
Chapter 10: Performance Analysis — Iron Law, Amdahl, Roofline, benchmarking
```

**The quantitative tools you now have:**
```
Time      = IC × CPI / clock_rate                        (Iron Law)
CPI       = base + load_use + branch + cache + TLB       (Full CPI model)
AMAT      = hit_time + miss_rate × miss_penalty          (Cache performance)
Speedup   = 1/[(1-f) + f/k]                             (Amdahl's Law)
Roofline  = min(P, I × B)                               (Compute vs memory bound)
```

**What comes next** in the architecture curriculum:
- Superscalar and out-of-order execution (CPI < 1, IPC > 1)
- SIMD / vector execution (AVX-512: 16 float adds per cycle)
- Memory consistency models (happens-before, acquire-release, C++ memory_order)
- GPU architecture (SIMT, warps, shared memory, coalesced access)
- Network-on-chip and multi-socket NUMA systems

---

## Common Misconceptions

**"Higher clock rate = better performance"**
Time = IC × CPI / GHz. A 5 GHz CPU with CPI = 4 is slower than a 3.5 GHz CPU with CPI = 1. AMD's Zen 4 often beats Intel's Raptor Lake clock-for-clock on heavily stalled workloads because of better cache design and branch prediction — not just raw GHz.

**"Amdahl's Law applies only to parallel programs"**
Amdahl's Law applies to ANY optimization that affects only a fraction of execution time. "I made the disk 100× faster" → applies only to the disk-I/O fraction → overall speedup limited to 1/(1-f_disk). Even in a single-threaded program, most speedups have an Amdahl-bounded ceiling.

**"Benchmarks tell you how a CPU will perform on your workload"**
Benchmarks (SPEC, CoreMark) are carefully chosen to stress specific parts of the microarchitecture. Vendors tune their chips specifically for published benchmarks. Always profile YOUR workload with `perf stat` or `VTune` — synthetic benchmarks are a guide, not a verdict.

---

## Connections

- **Chapter 01-09 — The Full Course:** This chapter provides the mathematical framework that integrates everything: ISA instructions set IC, pipelining and hazards set CPI_base and stall terms, cache sets memory_stall_CPI, branch prediction sets branch_stall_CPI.
- **CSE104 — Computer Systems:** CSE104 introduced the software-facing view (processes, virtual memory, threads). CSE204 revealed the hardware underneath. Together they form the complete picture.
- **CSE702 — Distributed Systems:** Amdahl's Law explains why distributed systems are hard — the serial coordination overhead is (1-f), and it limits the maximum throughput scaling no matter how many machines you add.

---

> [← 09 I/O Subsystems and DMA](09_IO_Subsystems_DMA.md) | [Course Index](README.md)
