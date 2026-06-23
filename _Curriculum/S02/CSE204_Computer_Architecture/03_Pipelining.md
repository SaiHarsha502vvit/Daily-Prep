# Chapter 03 — Pipelining: Overlapping Execution

> [← 02 Single-Cycle Datapath](02_Single_Cycle_Datapath.md) | [Course Index](README.md) | [Next → 04 Pipeline Hazards](04_Pipeline_Hazards.md)

---

## The Problem: A 900ps Clock Is Unacceptably Slow

Single-cycle design: every instruction takes 900ps (the load word critical path). Even an `add` that only needs 650ps must wait for the 900ps clock. At 900ps per instruction:

```
Clock frequency = 1/0.9ns ≈ 1.11 GHz
IPC (instructions per cycle) = 1
Throughput = 1.11 × 10⁹ instructions/second
```

Modern CPUs run at 3-5 GHz and complete 3-4 instructions per cycle (superscalar). The gap is roughly 10-20×. Where does the speedup come from?

The answer is in your laundry room.

---

## The Laundry Analogy

You have 4 loads of laundry. Each load takes:
- Wash: 30 minutes
- Dry: 40 minutes
- Fold: 20 minutes
- Total: 90 minutes per load

**Sequential (single-cycle equivalent):**
- Load 1: wash (30) + dry (40) + fold (20) = 90 min
- Load 2: wait for load 1 to finish, then start → 90 min
- Load 3: 90 min
- Load 4: 90 min
- **Total: 4 × 90 = 360 minutes**

**Pipelined (overlapped):**
- t=0: Wash L1
- t=30: Dry L1, Wash L2
- t=70: Fold L1, Dry L2, Wash L3
- t=90: Done L1, Fold L2, Dry L3, Wash L4
- t=110: Done L2, Fold L3, Dry L4
- t=150: Done L3, Fold L4
- t=170: Done L4
- **Total: 170 minutes** (instead of 360)

**The pipeline sustains one completion per stage-time (40 min here) in steady state.**

For instructions: instead of one per 900ps, pipelining sustains one per 200ps (the delay of one stage), giving ~5× speedup.

---

## The 5-Stage RISC Pipeline

Divide the single-cycle datapath into 5 stages, each with its own work:

```
Stage 1 — IF  (Instruction Fetch):
  Read 32-bit instruction from instruction memory at PC.
  Compute PC+4 (next sequential PC).

Stage 2 — ID  (Instruction Decode / Register Read):
  Decode opcode → generate control signals.
  Read rs1 and rs2 from Register File.
  Sign-extend immediate field.

Stage 3 — EX  (Execute):
  ALU computes: arithmetic result, memory address, or branch comparison.
  Branch target address = PC + offset (computed in parallel).

Stage 4 — MEM (Memory Access):
  Load: read Data Memory at ALU-computed address.
  Store: write Data Memory at ALU-computed address.
  Non-memory instructions: pass through (ALU result unchanged).

Stage 5 — WB  (Write Back):
  Write result to rd in Register File.
  Source: ALU result (R/I-type) or Data Memory read (lw).
```

**Pipeline registers** between stages hold the outputs of each stage until the next stage is ready:

```
IF/ID register:  holds instruction + PC+4
ID/EX register:  holds control signals + rs1_val + rs2_val + imm + rd
EX/MEM register: holds control signals + ALU result + rs2_val + rd
MEM/WB register: holds control signals + ALU result or mem_data + rd
```

---

## Timing Diagram: 5 Instructions in Flight

```
Clock cycle:    1    2    3    4    5    6    7    8    9
─────────────────────────────────────────────────────────────
I1 (add):      IF   ID   EX  MEM   WB
I2 (lw):            IF   ID   EX  MEM   WB
I3 (sub):                IF   ID   EX  MEM   WB
I4 (sw):                      IF   ID   EX  MEM   WB
I5 (beq):                          IF   ID   EX  MEM   WB
```

At cycle 5, all 5 stages are active simultaneously — one instruction per stage. This is full pipeline utilization.

After the pipeline fills, the throughput is **one instruction completed per clock cycle** (CPI → 1), even though each individual instruction still takes 5 cycles end-to-end (latency = 5 cycles).

---

## Latency vs Throughput

**Latency:** Time for one instruction to complete = 5 stages × 200ps = 1000ps. (Slightly SLOWER than single-cycle 900ps — pipelining adds pipeline register overhead.)

**Throughput:** Number of instructions completed per second = 1 per 200ps = 5 GHz (in theory).

**Speedup ratio (ideal pipeline):** throughput speedup ≈ number of stages = 5×.

**Single-cycle vs pipelined:**
```
Single-cycle: CPI=1, cycle=900ps → throughput = 1.11 × 10⁹ instructions/s
Pipelined:    CPI=1, cycle=200ps → throughput = 5.0  × 10⁹ instructions/s
Speedup: 5.0/1.11 ≈ 4.5×
```

(Not exactly 5× because the pipeline cycle is slightly longer than 900/5=180ps — pipeline registers add ~20ps overhead per stage.)

---

## Clock Cycle Time in a Pipeline

Each stage must complete within one clock cycle. The clock cycle is determined by the SLOWEST STAGE:

| Stage | Components active | Delay |
|-------|-------------------|-------|
| IF | Instruction Memory read | 200ps |
| ID | Register File read + sign extend | 150ps + 20ps = 170ps |
| EX | ALU | 200ps |
| MEM | Data Memory read or write | 250ps |
| WB | Register File write setup | 100ps |

**Critical stage: MEM at 250ps.** Clock cycle = 250ps + pipeline register overhead (~10ps) ≈ 260ps.

```
Throughput = 1/260ps ≈ 3.85 GHz
Speedup over single-cycle: 900/260 ≈ 3.46×
```

This is why engineers try to balance stage delays: an unbalanced pipeline is bottlenecked by its slowest stage. Modern processors split long stages into sub-stages.

---

## Pipeline Registers in Detail

**IF/ID register** (written at end of IF, read at start of ID):
```
IF/ID.instruction = Mem[PC]    // 32-bit instruction
IF/ID.PCplus4     = PC + 4    // for branch target or auipc
```

**ID/EX register** (written at end of ID, read at start of EX):
```
ID/EX.control    = {RegWrite, ALUSrc, MemRead, MemWrite, Branch, MemToReg, ALUOp}
ID/EX.rs1_val    = RegisterFile[rs1]
ID/EX.rs2_val    = RegisterFile[rs2]
ID/EX.imm_ext    = sign_extend(immediate)
ID/EX.rd         = instruction[11:7]    // destination register number
ID/EX.rs1        = instruction[19:15]   // for hazard detection
ID/EX.rs2        = instruction[24:20]   // for hazard detection
```

**EX/MEM register**:
```
EX/MEM.control   = {RegWrite, MemRead, MemWrite, Branch, MemToReg}
EX/MEM.ALU_result
EX/MEM.rs2_val   = (for stores: data to write)
EX/MEM.rd
EX/MEM.Zero      = (ALU zero flag, for branch)
```

**MEM/WB register**:
```
MEM/WB.control   = {RegWrite, MemToReg}
MEM/WB.ALU_result
MEM/WB.mem_data  = (data read from memory)
MEM/WB.rd
```

---

## Pipeline Performance Formula

With n instructions and k stages (k=5), ignoring hazards:

```
Cycles for n instructions = k + (n - 1)   [k cycles to fill, then 1 per instruction]
Time = [k + (n-1)] × cycle_time

For large n: Cycles ≈ n, CPI ≈ 1
```

**With hazard stalls (Chapter 04):** CPI increases above 1.

```
CPI_actual = 1 + stalls_per_instruction

Common breakdown:
  Load-use hazard (lw followed by dependent instr): stall 1 cycle
  Branch hazard: varies (1-3 cycles if mispredicted)
  Cache miss: many cycles (Chapter 06)
```

**Real CPUs:** Intel Core i9 achieves CPI ≈ 0.25 (IPC ≈ 4) by executing 4+ instructions per cycle (superscalar out-of-order). CPI < 1 is possible with superscalar — we cover this in Chapter 05.

---

## Why Pipelining Works: The Abstraction

The pipeline works because instructions are (mostly) independent. While I2 is executing in EX, I1 is accessing memory in MEM — neither needs what the other is computing (in the ideal case).

Think of an assembly line: the chassis is being painted while the engine is being assembled while the tires are being mounted — different cars at different stations. Same principle.

**The key assumption:** Instructions don't need each other's results until their own EX stage begins (roughly). When this assumption breaks, we get **hazards** (Chapter 04).

---

## Section Challenge

> ### Pipeline Timing and Throughput Analysis
>
> A pipelined CPU has 5 stages: IF(200ps), ID(180ps), EX(220ps), MEM(240ps), WB(120ps). Pipeline registers add 10ps overhead.
>
> **Q1:** What is the clock cycle time? What is the theoretical maximum clock frequency?
>
> **Q2:** For 1000 instructions with no hazards, compute: (a) total execution time, (b) CPI, (c) throughput in MIPS (millions of instructions per second).
>
> **Q3:** The single-cycle version of this CPU has a clock cycle of 200+180+220+240+120 = 960ps. What is the speedup from pipelining? Is it exactly 5×? Why not?
>
> **Q4:** A program has the following instruction mix: 30% lw, 10% sw, 40% arithmetic, 15% branch, 5% other. Due to load-use hazards, 40% of lw instructions are followed by an instruction that uses the loaded value, causing a 1-cycle stall. What is the effective CPI (including stalls)?
>
> **Q5 (Stretch):** A 10-stage pipeline (stages split for higher frequency) has each stage taking 110ps + 10ps register overhead = 120ps per stage. The single-cycle version took 960ps. (a) What is the maximum theoretical speedup? (b) Why might the actual speedup be less? (c) If the branch misprediction penalty increases from 1 cycle to 4 cycles, and 15% of instructions are branches with a 20% misprediction rate, what is the new CPI contribution from branches alone? Compare to the 5-stage pipeline.

<details>
<summary>Full answers</summary>

```
Q1: Clock cycle time

Slowest stage: MEM = 240ps. Pipeline register overhead: 10ps.
Clock cycle = 240 + 10 = 250ps.
Maximum clock frequency = 1/250ps = 4.0 GHz.

──────────────────────────────────────────────────────

Q2: Execution time, CPI, throughput for 1000 instructions

Total cycles = k + (n-1) = 5 + 999 = 1004 cycles.
Total time = 1004 × 250ps = 251,000ps = 251ns ≈ 0.251 μs.

CPI = 1004 cycles / 1000 instructions = 1.004 ≈ 1.0 (ideal with no hazards).

Throughput = 1000 instructions / 251ns = 3.984 × 10⁹ instructions/s ≈ 3,984 MIPS.

──────────────────────────────────────────────────────

Q3: Speedup from pipelining

Single-cycle: 960ps per instruction → for 1000 instructions: 960,000ps.
Pipelined: 1004 × 250ps = 251,000ps.

Speedup = 960,000 / 251,000 = 3.82×.

NOT exactly 5× because:
1. The pipeline cycle is 250ps (bottlenecked by MEM=240ps), not 960/5=192ps.
   The imbalanced stages mean we don't get the full 5× from the clock increase.
   Clock speedup ratio: 960 / 250 = 3.84× (not 5×).

2. Pipeline fill time: the first 4 cycles don't complete any instruction (pipeline filling).
   For small n, this overhead matters. For n=1000, it's negligible (4/1004 = 0.4%).

Lesson: Pipeline speedup = (single_cycle_time) / (bottleneck_stage_time + reg_overhead).
For balanced stages: speedup approaches k = 5.
For imbalanced stages: the bottleneck stage limits speedup.

──────────────────────────────────────────────────────

Q4: CPI with load-use stalls

Load-use stall: 40% of lw instructions (30% of all) are followed by a dependent instruction.

Stall cycles = fraction_of_instructions × stall_cycles_per_occurrence
= 0.30 × 0.40 × 1 = 0.12 stall cycles per instruction.

CPI_actual = 1 + 0.12 = 1.12.

Throughput drops to: (1/1.12) × 4.0 GHz = 3.57 GIPS (compared to ideal 4.0 GIPS).
Performance penalty from load-use hazards: (1.12 - 1.0)/1.12 = 10.7% slowdown.

──────────────────────────────────────────────────────

Q5: 10-stage pipeline analysis

(a) Maximum theoretical speedup:
Single-cycle: 960ps. 10-stage clock: 120ps each (including overhead).
Speedup = 960/120 = 8× (not 10× — pipeline overhead of 10ps per stage reduces the clock
from 96ps ideal to 120ps, so we lose some speedup).

Actually: theoretical speedup from k stages = single_cycle / (single_cycle/k + reg_overhead)
= 960 / (96 + 10) = 960/106 ≈ 9.06× (closer to 10× with this formula; depends on overhead).
With 120ps clock: 960/120 = 8× exactly.

(b) Actual speedup is less because:
  - Hazard penalties increase with more stages:
    * Load-use stall: may become 2-3 cycles instead of 1 (value takes longer to reach EX).
    * Branch misprediction: 4+ cycles penalty vs 1-3 in 5-stage.
  - More hazard stalls per instruction → higher CPI.
  - Power and complexity: 10-stage needs more forwarding logic, bigger wiring overhead.

(c) Branch misprediction CPI contribution:
Misprediction rate = 20% of branches. Branch fraction = 15% of instructions.
Penalty per misprediction = 4 cycles.

Misprediction CPI contribution = 0.15 × 0.20 × 4 = 0.12 cycles per instruction.

For 5-stage pipeline (penalty = 1 cycle):
  0.15 × 0.20 × 1 = 0.03 cycles per instruction.

The 10-stage pipeline incurs 0.12 vs 0.03 = 4× more branch penalty overhead.
This partially erodes the clock-speed advantage of the deeper pipeline.

Total CPI comparison (branch hazards only):
  5-stage:  CPI = 1 + 0.03 = 1.03, throughput ≈ 3.88 GIPS (at 4.0 GHz)
  10-stage: CPI = 1 + 0.12 = 1.12, throughput ≈ 7.14 GIPS (at 8.0 GHz)

Net speedup with branch hazards: 7.14/3.88 = 1.84× (not 2× theoretical from clock).
Deeper pipelines win IF branch prediction is accurate. This is why Pentium 4's
20-stage NetBurst pipeline underperformed despite its 3.8 GHz clock.
```

</details>

---

## Common Misconceptions

**"Pipelining reduces instruction latency"**
False. Each instruction takes MORE time end-to-end in a pipeline (5 × 200ps = 1000ps vs 900ps single-cycle). Pipelining increases THROUGHPUT (instructions per second), not latency.

**"A 5-stage pipeline is exactly 5× faster"**
Only in the ideal case with perfectly balanced stages, no hazards, and n >> k. Real speedup is 3-4× due to imbalanced stages, hazard stalls, and pipeline fill/drain overhead.

**"Deeper pipelines are always better"**
Deeper pipelines increase throughput potential (higher GHz) but amplify hazard penalties. Intel's Pentium 4 had a 20-stage pipeline for 3.8 GHz — but was slower than AMD's 12-stage Athlon at 2.4 GHz on most tasks, because branch misprediction cost 20+ cycles per miss.

---

## Connections

- **Chapter 02 — Single-Cycle Datapath:** The pipeline IS the single-cycle datapath split into 5 stages with registers in between. Every component (IM, RF, ALU, DM) appears in both — we just spread them across time.
- **Chapter 04 — Pipeline Hazards:** The pipeline assumes independence between consecutive instructions. This chapter shows what happens when instructions DO depend on each other — and how the hardware resolves it.
- **Chapter 05 — Branch Prediction:** The branch hazard is the most expensive in a pipeline. Branch prediction is the hardware technique that makes the branch penalty nearly zero on average.

---

> [← 02 Single-Cycle Datapath](02_Single_Cycle_Datapath.md) | [Course Index](README.md) | [Next → 04 Pipeline Hazards](04_Pipeline_Hazards.md)
