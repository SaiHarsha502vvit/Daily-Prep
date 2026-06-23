# Chapter 04 — Pipeline Hazards and Solutions

> [← 03 Pipelining](03_Pipelining.md) | [Course Index](README.md) | [Next → 05 Branch Prediction](05_Branch_Prediction.md)

---

## The Problem: Instructions Aren't Independent

The pipeline assumes consecutive instructions don't interfere. But in real programs:

```c
int a = x + y;     // instruction 1
int b = a * 2;     // instruction 2 — uses result of instruction 1!
```

In assembly:
```asm
add  t1, t2, t3    # I1: t1 = t2 + t3
mul  t4, t1, t5    # I2: uses t1 — but t1 isn't written until I1's WB stage!
```

While I2 is in EX (needing t1), I1 is only in MEM. The Register File hasn't been written yet. I2 reads a STALE value of t1.

This is a **pipeline hazard** — a situation where the pipeline cannot immediately execute the next instruction in the normal pipelined manner.

Three types:
1. **Data hazards** — instruction needs a result not yet computed
2. **Structural hazards** — two instructions need the same hardware resource simultaneously
3. **Control hazards** — pipeline doesn't know which instruction to fetch next (branches)

---

## Type 1: Data Hazards (RAW — Read After Write)

**RAW (Read After Write):** Instruction B reads a register that instruction A writes, and A hasn't finished yet.

```
I1: add  t1, t2, t3    # writes t1 in WB (cycle 5)
I2: sub  t4, t1, t5    # reads t1 in ID (cycle 3) ← reads STALE value!
I3: and  t6, t1, t7    # reads t1 in ID (cycle 4) ← reads STALE value!
I4: or   t8, t1, t9    # reads t1 in ID (cycle 5) ← reads it just in time (WB same cycle)
I5: xor  t10, t1, t11  # reads t1 in ID (cycle 6) ← safe! WB completed in cycle 5
```

**Timing diagram:**
```
       Cycle: 1   2   3   4   5   6   7
I1 (add):    IF  ID  EX  MEM  WB              ← writes t1 at end of cycle 5
I2 (sub):        IF  ID  EX  MEM  WB          ← reads t1 at cycle 3 ← STALE!
I3 (and):             IF  ID  EX  MEM  WB     ← reads t1 at cycle 4 ← STALE!
I4 (or):                  IF  ID  EX  MEM  WB ← reads t1 at cycle 5 ← borderline
I5 (xor):                      IF  ID  ...    ← reads t1 at cycle 6 ← SAFE
```

I2 and I3 have RAW hazards. I4 has a borderline case (depends on whether WB writes in the first half of the cycle and ID reads in the second half — most designs handle this with "register file bypassing" on the write port).

---

## Solution 1: Forwarding (Data Bypassing)

**Key insight:** The correct value for t1 exists BEFORE WB completes. After I1's EX stage, the ALU computed t1 and it sits in the EX/MEM pipeline register. Why not route it directly to I2's EX stage?

**Forwarding** adds data paths from the output of one pipeline stage directly to the input of a later instruction's earlier stage:

```
EX/MEM.ALU_result → (forwarded) → EX stage ALU input (for I2)
MEM/WB.ALU_result → (forwarded) → EX stage ALU input (for I3)
MEM/WB.mem_data   → (forwarded) → EX stage ALU input (for lw-use chain)
```

**Forwarding unit logic:**
```
// Forward A: check if the register I2 reads (rs1) was written by I1 or I0
if (EX/MEM.RegWrite AND EX/MEM.rd ≠ x0 AND EX/MEM.rd == ID/EX.rs1):
    ForwardA = EX_forwarding    // use EX/MEM.ALU_result for ALU input A

else if (MEM/WB.RegWrite AND MEM/WB.rd ≠ x0 AND MEM/WB.rd == ID/EX.rs1):
    ForwardA = MEM_forwarding   // use MEM/WB.ALU_result or mem_data

else:
    ForwardA = NO_forwarding    // use Register File value (normal)

// Same logic for ForwardB (checking ID/EX.rs2)
```

**Visual for add → sub with forwarding:**
```
       Cycle: 1   2   3   4   5
I1 (add):    IF  ID  EX  MEM  WB
                         ↓ EX/MEM.ALU_result forwarded...
I2 (sub):        IF  ID  EX  MEM  WB
                         ↑ ...directly to I2's EX ALU input
```

**Forwarding eliminates most RAW hazards at zero cycle cost.** The pipeline continues without stalling.

---

## The Load-Use Hazard: One Stall is Unavoidable

Forwarding can't save the **load-use** case:

```asm
lw   t1, 0(s0)     # I1: t1 available after MEM stage (cycle 4)
add  t2, t1, t3    # I2: needs t1 in EX stage (cycle 3) ← too early!
```

```
       Cycle: 1   2   3   4   5   6
I1 (lw):    IF  ID  EX  MEM  WB
                             ↓ t1 available from memory here (cycle 4)
I2 (add):       IF  ID  EX  MEM  WB
                         ↑ needs t1 HERE (cycle 3) — one cycle too early!
```

The memory read result exists only after cycle 4, but I2 needs it in cycle 3 EX. Even forwarding from MEM/WB→EX is one cycle too late.

**Solution: Insert a bubble (stall one cycle):**
```
       Cycle: 1   2   3   4   5   6   7
I1 (lw):    IF  ID  EX  MEM  WB
I2 (add):       IF  ID  **  EX  MEM  WB     ← stalled 1 cycle
               [bubble/NOP]
```

The hazard detection unit stalls I2 (and all subsequent instructions) by one cycle:
- Freeze PC (don't increment) and IF/ID register for one cycle
- Insert a NOP/bubble into ID/EX (clear all control signals to zero)

**After the stall, forward from MEM/WB → EX:**
```
       Cycle: 4 (MEM): lw result available
       Cycle: 5 (EX):  add gets forwarded value ← just in time!
```

**This is why the compiler inserts independent instructions between a load and its first use:**
```asm
lw   t1, 0(s0)         # load
lw   t2, 4(s0)         # independent load (fills the stall slot)
add  t3, t1, t2        # t1 and t2 both ready: t1 via MEM/WB forward, t2 via MEM/WB forward
```

---

## Type 2: Structural Hazards

A **structural hazard** occurs when two instructions need the same hardware resource in the same cycle.

**Classic example (unified memory):** If instruction memory and data memory share the same port:
- Cycle 5: I1 (lw) accesses Data Memory (MEM stage)
- Cycle 5: I5 is fetching from Instruction Memory (IF stage)
- CONFLICT: both need memory simultaneously.

**Solution:** Separate instruction and data caches (as discussed in Chapter 02). Modern CPUs have split L1 caches — no structural hazards from this source.

**Register file structural hazard:** If the register file has only one port:
- Two instructions trying to read different registers simultaneously would conflict.
- **Solution:** Provide two read ports and one write port (three-port SRAM). Most register files have 2R+1W or 3R+1W ports.

Structural hazards are mostly solved by hardware resource duplication. Data hazards require forwarding. Control hazards (Chapter 05) require branch prediction.

---

## Type 3: Control Hazards (Branches)

When the pipeline fetches a `beq` instruction:

```
       Cycle: 1   2   3   4   5
I1 (beq):   IF  ID  EX  MEM  WB
I2:              IF  ID  EX   ...    ← fetched speculatively (might be wrong!)
I3:                  IF  ...         ← also fetched speculatively
```

The branch decision (taken or not-taken) is computed in EX (cycle 3 for I1). But I2 and I3 have already been fetched (and I2 is in ID). If the branch IS taken, those two instructions are wrong — they must be squashed (turned into NOPs).

**Branch penalty = number of pipeline stages before branch decision = 2 cycles (IF + ID).**

**Naive solution: Flush (squash) on branch:**
```
If branch taken:
  - Set IF/ID register to NOP (squash I2)
  - Set ID/EX register to NOP (squash I3)
  - Set PC = branch_target
CPI cost: 2 cycles wasted per taken branch.
```

With 15% branches and 50% taken: CPI += 0.15 × 0.5 × 2 = 0.15.

**Optimization: Decide branch earlier (in ID instead of EX):**
Add a comparator to the ID stage to compute rs1 == rs2 (for beq) directly during register read. Now the branch decision is made one cycle earlier, reducing penalty from 2 to 1 cycle.

**Optimization: Assume branch not taken:**
Always fetch the next sequential instruction. If branch is NOT taken: no penalty. If branch IS taken: flush 1 instruction (the one incorrectly fetched). With 40-60% of branches not taken, this halves the average penalty.

**Best solution: Branch prediction (Chapter 05).**

---

## Hazard Summary

| Hazard Type | Cause | Detection | Solution | CPI Cost |
|-------------|-------|-----------|---------|----------|
| RAW (data) | Instruction reads a register written by recent instr | Compare rs1/rs2 to recent rd values | Forwarding | 0 (most cases) |
| Load-use | lw followed immediately by dependent instruction | Detect lw + matching rd=rs1/rs2 in next instr | Stall 1 cycle | +0.05-0.15 |
| Structural | Two instrs need same hardware port | Design-time analysis | Resource duplication | 0 (if designed correctly) |
| Control | Branch target unknown during fetch | — | Flush (2 cycles) or branch prediction | +0.10-0.30 |

---

## Code Reordering: Compiler's Role

The compiler can often reorder instructions to avoid hazards without stalls. This is called **instruction scheduling**:

**Original code (has load-use hazard):**
```asm
lw   t1, 0(s0)    # I1: load a
lw   t2, 4(s0)    # I2: load b
add  t3, t1, t2   # I3: a + b ← t1 and t2 from lw, will both stall!
lw   t4, 8(s0)    # I4: load c
add  t5, t3, t4   # I5: (a+b) + c
```

**Stalls:** I3 stalls 1 cycle after I1 (load-use t1), and 1 more after I2 (load-use t2). Total: 2 extra stall cycles.

**Reordered (compiler eliminates stalls):**
```asm
lw   t1, 0(s0)    # I1: load a
lw   t2, 4(s0)    # I2: load b (fills stall slot for t1)
lw   t4, 8(s0)    # I3: load c (fills stall slot for t2)
add  t3, t1, t2   # I4: a + b ← t1 and t2 both ready (1+ cycles after their loads)
add  t5, t3, t4   # I5: (a+b) + c ← t4 is ready too
```

**Zero stall cycles!** The compiler moved the independent `lw t4` up to fill the two stall slots. This is why modern compilers use pipeline-aware instruction scheduling passes.

---

## Section Challenge

> ### Hazard Detection and Resolution
>
> Consider this sequence:
> ```asm
> lw   s1, 0(a0)     # I1
> lw   s2, 4(a0)     # I2
> add  s3, s1, s2    # I3
> sw   s3, 8(a0)     # I4
> sub  s4, s1, s2    # I5
> ```
>
> **Q1:** Identify all RAW hazards in this sequence. For each, specify: which instruction reads what register from which earlier instruction, and at what cycle stages does the conflict occur.
>
> **Q2:** Which hazards can be resolved by forwarding alone (no stall)? Which require a stall plus forwarding? Draw a cycle-by-cycle timing diagram showing stalls as bubbles.
>
> **Q3:** How would the compiler reorder this sequence to eliminate all stalls, assuming there are more instructions available that are independent (e.g., `lw s5, 12(a0)` is available)?
>
> **Q4:** Consider `beq s3, s1, label` added after I5. With the simplified branch decision in ID (1-cycle penalty), how many cycles does a taken branch add? Write the forwarding condition that would allow the hazard detection unit to forward s3 to the beq comparator directly.
>
> **Q5 (Stretch):** A program segment has 20% lw instructions. Of those, 60% are followed within 1 instruction by a dependent use (load-use hazard). The pipeline has forwarding but not load-use elimination. Branch instructions make up 15% of all instructions; 70% of branches are taken, each incurring a 1-cycle penalty (branch decided in ID). What is the effective CPI? If the clock runs at 3.2 GHz, what is the instruction throughput in GIPS?

<details>
<summary>Full answers</summary>

```
Q1: Identify all RAW hazards

I1: lw s1, 0(a0)   → writes s1
I2: lw s2, 4(a0)   → writes s2
I3: add s3, s1, s2 → reads s1 (from I1) and s2 (from I2), writes s3
I4: sw s3, 8(a0)   → reads s3 (from I3)
I5: sub s4, s1, s2 → reads s1 (from I1) and s2 (from I2)

RAW hazards:
  I1→I3: I3 reads s1 written by I1 (lw). Distance = 2 instructions. Load-use.
  I2→I3: I3 reads s2 written by I2 (lw). Distance = 1 instruction. Load-use (worst case).
  I3→I4: I4 reads s3 written by I3 (add). Distance = 1 instruction.
          NOT load-use — I3 is an add, result available after EX. Forward EX/MEM→MEM stage.
  I1→I5: I5 reads s1 written by I1 (lw). Distance = 4 instructions. No hazard — safe.
  I2→I5: I5 reads s2 written by I2 (lw). Distance = 3 instructions. No hazard — safe.

──────────────────────────────────────────────────────

Q2: Which are forwarding-only vs stall+forward?

I1→I3 (s1, load-use, distance=2):
  I1 is lw. I3 is 2 instructions after I1.
  I1's MEM result is available at end of cycle 4 (I1 in MEM).
  I3's EX needs s1 at start of cycle 5 (I3 in EX... but wait, need to check if stall changes this).
  
  Let's trace carefully (no stall assumed first):
       C1   C2   C3   C4   C5   C6   C7
  I1: IF   ID   EX   MEM  WB
  I2:      IF   ID   EX   MEM  WB
  I3:           IF   ID   EX   MEM  WB
  
  I3 in EX at cycle 5. I1 MEM/WB available at end of cycle 4 (start of cycle 5).
  Forward MEM/WB → EX: available just in time! s1 (distance=2 from lw) can be forwarded.

I2→I3 (s2, load-use, distance=1):
  I2 is lw. I3 is 1 instruction after I2.
       C1   C2   C3   C4   C5   C6   C7
  I1: IF   ID   EX   MEM  WB
  I2:      IF   ID   EX   MEM  WB
  I3:           IF   ID   EX   MEM  WB
  
  I3 in EX at cycle 5. I2 MEM result available at end of cycle 5 (I2 WB).
  EX/MEM forward: I2's MEM result at cycle 5 end. I3 needs it at cycle 5 start → TOO LATE.
  STALL REQUIRED. Insert bubble after I2:
  
       C1   C2   C3   C4   C5   C6   C7   C8
  I1: IF   ID   EX   MEM  WB
  I2:      IF   ID   EX   MEM  WB
  [bubble]          IF   ID   **  (stall cycle)
  I3:                    IF   ID   EX   MEM  WB
  
  After stall, I3 EX at cycle 6. I2 MEM/WB at cycle 5→6. Forward MEM/WB → EX: just in time!

I3→I4 (s3, add result, distance=1):
  I3 is add (not lw). After stall:
       C5   C6   C7   C8   C9
  I3:  EX   MEM  WB
  I4:       EX   MEM  WB     ← I4 EX at cycle 7 (after stall + I4 in pipeline)
  
  Actually after the stall insertion, I4 follows I3 by 1 instruction:
  I3 EX at cycle 6 → EX/MEM result available end of cycle 6.
  I4 EX at cycle 7 → needs s3 at start of cycle 7. Forward EX/MEM → EX: on time. ✓
  NO STALL needed for I3→I4.

Summary:
  I1→I3: Forwarding only (distance=2 from lw is safe after stall inserted for I2→I3)
  I2→I3: STALL 1 cycle + forward (load-use, distance=1)
  I3→I4: Forwarding only (non-load arithmetic)

──────────────────────────────────────────────────────

Q3: Compiler reordering to eliminate stalls

Available independent instruction: lw s5, 12(a0)

Original:
  lw   s1, 0(a0)    # I1
  lw   s2, 4(a0)    # I2
  add  s3, s1, s2   # I3  ← load-use s2 (1-cycle stall needed here)
  sw   s3, 8(a0)    # I4
  sub  s4, s1, s2   # I5

Reordered:
  lw   s1, 0(a0)    # I1: load s1
  lw   s2, 4(a0)    # I2: load s2 (fills s1's "dangerous" slot; s1 is 2 away from I3)
  lw   s5, 12(a0)   # I3: independent load (fills s2's load-use stall slot!)
  add  s3, s1, s2   # I4: s1 from I1 (3 away, safe), s2 from I2 (2 away, safe after MEM/WB fwd)
  sw   s3, 8(a0)    # I5: s3 from I4 (add result, forwarded)
  sub  s4, s1, s2   # I6: no hazard (s1, s2 long since computed)

Zero stall cycles! The independent lw s5 fills the hazard slot perfectly.

──────────────────────────────────────────────────────

Q4: beq with forwarding to comparator

beq s3, s1, label follows I5 (sub s4, s1, s2).

If beq is in ID at cycle N, it needs s3 for the comparator.
s3 was computed by add (I3) → its result is in MEM/WB or beyond.

If s3 is far enough back: forward MEM/WB.ALU_result to the ID comparator.

Forwarding condition to ID comparator:
  if (MEM/WB.RegWrite AND MEM/WB.rd == beq_rs1 [s3]):
      forward MEM/WB.result to comparator input A

For a taken branch with 1-cycle penalty (decided in ID):
  If branch taken: flush the instruction fetched after beq (1 bubble inserted).
  CPI cost of this taken branch: +1 cycle.
  
  Branch penalty = 1 cycle × P(taken) = 1 × 1.0 = 1 cycle for this specific taken branch.
  Compared to 2-cycle penalty without early branch decision: saves 1 cycle per taken branch.

──────────────────────────────────────────────────────

Q5: Effective CPI and throughput

Load-use stalls:
  20% of all instructions are lw.
  60% of those have a load-use hazard → stall 1 cycle each.
  Stall contribution: 0.20 × 0.60 × 1 = 0.12 cycles/instruction.

Branch penalty:
  15% of all instructions are branches.
  70% are taken, each with 1-cycle penalty.
  Branch contribution: 0.15 × 0.70 × 1 = 0.105 cycles/instruction.

Effective CPI:
  CPI = 1.0 + 0.12 + 0.105 = 1.225

Throughput:
  Clock: 3.2 GHz
  Throughput = 3.2 GHz / 1.225 = 2.61 GIPS (billion instructions per second)

  Compare to ideal (no hazards): 3.2 GIPS.
  Hazards reduce throughput by: 1 - (2.61/3.2) = 18.4%.
```

</details>

---

## Common Misconceptions

**"Forwarding makes the pipeline hazard-free"**
Forwarding eliminates MOST data hazards at zero cost. But load-use hazards (lw immediately followed by dependent instruction) require exactly 1 stall cycle even with forwarding — this cannot be avoided without adding a bypass from the memory output to the EX input earlier than the hardware allows.

**"Stalls waste cycles entirely"**
A stall is a one-cycle bubble — the pipeline does nothing useful for one stage. But the instructions before the stall continue (they're in later stages), and the stalling instruction restarts the next cycle. It's not a global freeze, just a local pause.

**"WAR (Write After Read) and WAW (Write After Write) hazards also occur in simple pipelines"**
In a simple in-order 5-stage pipeline, WAR and WAW don't occur because instructions complete in order and the write (WB) always comes after the read (ID). These hazards appear in out-of-order superscalar processors (Chapter 05).

---

## Connections

- **Chapter 03 — Pipelining:** Hazards are what prevent the ideal CPI=1 pipeline. This chapter quantifies the damage and shows how forwarding and stalling recover most of it.
- **Chapter 05 — Branch Prediction:** Resolves the control hazard (the type we couldn't fully solve here). A good predictor reduces branch CPI contribution from 0.10+ to near 0.
- **Chapter 10 — Performance Analysis:** The CPI formula with stall terms (CPI = 1 + data_stalls + control_stalls + memory_stalls) is the quantitative tool for evaluating all optimizations.

---

> [← 03 Pipelining](03_Pipelining.md) | [Course Index](README.md) | [Next → 05 Branch Prediction](05_Branch_Prediction.md)
