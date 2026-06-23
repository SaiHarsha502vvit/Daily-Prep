# Chapter 05 — Branch Prediction

> [← 04 Pipeline Hazards](04_Pipeline_Hazards.md) | [Course Index](README.md) | [Next → 06 Cache Design and AMAT](06_Cache_Design_AMAT.md)

---

## The Problem: 15% of Instructions Are Branches

In a 5-stage pipeline, every branch potentially wastes 1-2 cycles (control hazard). With 15% of instructions being branches:

```
CPI cost (no prediction, always flush) = 0.15 × 2 cycles = 0.30 extra CPI

A processor running at 3 GHz with CPI = 1.30:
  Throughput = 3.0 / 1.30 = 2.31 GIPS

Vs ideal (no branch cost, CPI = 1.0):
  Throughput = 3.0 GIPS

Branch stalls alone reduce throughput by 23%.
```

Modern out-of-order processors with 20+ pipeline stages have branch misprediction penalties of 15-20 cycles. The stakes are enormous.

The solution is **branch prediction**: guess the outcome before the pipeline finishes computing it. If the guess is right, zero penalty. If wrong, flush and pay the full penalty.

The key question: how accurately can the CPU guess?

---

## Static vs Dynamic Prediction

**Static prediction** (done at compile time, fixed behavior):
- Always predict "not taken" — fetch the next sequential instruction
- Always predict "taken" — fetch from the branch target
- Predict based on branch direction: backward branches (loops) → predict taken; forward branches (if/else) → predict not taken

Static accuracy: 55-70%. Better than 50% (random), but leaves a lot of performance on the table.

**Dynamic prediction** (done at runtime using hardware state):
- Learn from the history of each branch — has it been taken recently?
- Exploit patterns in program behavior (loops are taken 99%+ of the time)

Dynamic accuracy: 90-99% for modern predictors.

---

## 1-Bit Predictor (Bimodal)

**Hardware:** A table of 1-bit state machines, indexed by the lower bits of the branch PC.

**State machine (per branch):**
```
State T = predict TAKEN
State N = predict NOT TAKEN

Transition:
  In T, branch actually taken → stay T
  In T, branch actually not-taken → move to N
  In N, branch actually taken → move to T
  In N, branch actually not-taken → stay N
```

**Problem with 1-bit predictor — loop example:**

A loop that runs 10 iterations:
```
Iteration 1-9:  branch taken (loop back)     → predict T → correct (T→T)
Iteration 10:   branch NOT taken (exit loop) → predict T → WRONG (T→N)
Next invocation:
  Iteration 1:  branch taken → predict N → WRONG (N→T)
  Iteration 2-9: predict T → correct (T→T)
  Iteration 10: WRONG again
```

**For a 10-iteration loop: 2 mispredictions per 10 iterations = 80% accuracy.**
Better, but still 2 mispredictions every loop invocation.

---

## 2-Bit Predictor (Saturating Counter)

**State machine (4 states):**
```
State 00 = Strongly NOT Taken (SNT)
State 01 = Weakly NOT Taken (WNT)
State 10 = Weakly Taken (WT)
State 11 = Strongly Taken (ST)

Predict TAKEN if state ≥ 10.
Predict NOT TAKEN if state ≤ 01.

Transition:
  Taken:     00→01→10→11  (shift up, saturate at 11)
  Not-Taken: 11→10→01→00  (shift down, saturate at 00)
```

**Why 2 bits?** A single misprediction doesn't flip the prediction. The predictor has "hysteresis" — it takes two consecutive wrong outcomes to change prediction direction.

**Loop re-analysis (2-bit):**
- Start in ST (11) after several taken iterations.
- Iteration 10 (not-taken): ST→WT. Prediction was TAKEN → WRONG. (1 misprediction)
- Next invocation, iteration 1 (taken): WT→ST. Prediction was TAKEN → CORRECT! (0 mispredictions)
- Iterations 2-9: predict TAKEN → correct.
- Iteration 10: same as before.

**For 10-iteration loop: 1 misprediction per 10 iterations = 90% accuracy.**

2-bit predictors are implemented in hardware as an array of 2-bit saturating counters indexed by PC[k:2] (lower k bits of branch instruction address).

---

## Correlating Predictors (2-Level Adaptive)

**Insight:** Branch outcomes often correlate with other recent branches.

```c
if (a == 0)           // branch B1
    ...
if (b == 0)           // branch B2
    ...
if (a == 0 && b == 0) // branch B3 — correlated with B1 and B2!
    ...
```

If B1 was not-taken (a ≠ 0), B3 is certainly not-taken.

**Global history register (GHR):** A shift register that records the last n branch outcomes (T/N for each).

```
GHR = [T, N, T, T]   (last 4 branches: taken, not-taken, taken, taken)
```

**PHT (Pattern History Table):** A table of 2-bit saturating counters indexed by GHR value.

```
Table lookup: index = GHR value
  GHR = 0101 → PHT[0101] → 2-bit counter → prediction

Update: after branch resolves, shift GHR, update PHT[old_GHR_value]
```

**Combined PC + GHR indexing (gshare):**
```
index = PC[k:2] XOR GHR
```
Different branches at the same PC-indexed entry are separated by their global history context. This dramatically improves accuracy for correlated branches.

**Tournament predictor (modern hybrid):**
- Run a local predictor and a global predictor in parallel.
- A meta-predictor (2-bit counter) tracks which one was right recently for each branch.
- Use the currently better predictor.

Used in: Alpha 21264, AMD Ryzen, Intel Core i-series.

---

## Branch Target Buffer (BTB)

Even if we predict TAKEN, we need to know WHERE to fetch from. The branch target address isn't computed until the EX stage.

**BTB (Branch Target Buffer):** A cache of recently-seen branches, mapping PC → branch target address.

```
Lookup on EVERY instruction fetch (using current PC):
  If PC in BTB AND prediction = taken:
    Fetch from BTB[PC].target  (speculative fetch from predicted target)
  Else:
    Fetch from PC+4            (predict not-taken or BTB miss)
```

With a BTB, a taken-predicted branch has ZERO fetch penalty — the target address was pre-computed and cached. The BTB miss rate is typically low (branches repeat predictably).

**Combined prediction flow:**
```
1. Fetch instruction at PC
2. Simultaneously: look up PC in BTB, look up PC in predictor
3. If BTB hit AND predictor says "taken":
     Fetch next from BTB[PC].target
4. Else:
     Fetch next from PC+4
5. At EX stage: verify prediction
6. If mispredicted: flush, correct PC, pay penalty
```

---

## Return Address Stack (RAS)

Function calls (`jal rd, offset`) and returns (`jalr x0, rd, 0`) are indirect branches — the target depends on a register value, not the instruction.

**The problem:** A function called from 20 different sites returns to 20 different addresses. BTB can only cache one target per PC. Indirect branch predictors are needed.

**RAS (Return Address Stack):** A small hardware stack (typically 8-16 entries) that pushes the return address on `call` and pops it on `ret`:

```
Hardware detects: CALL instruction (jal to a function)
  → Push (PC+4) onto RAS

Hardware detects: RET instruction (jalr with link register)
  → Pop top of RAS → use as predicted return target
```

**Accuracy:** Near-perfect for direct function calls. Fails only on mismatched push/pop (indirect jumps, coroutines, longjmp). Typical accuracy: 95-99%.

---

## Misprediction Recovery

When a misprediction is detected in EX:

```
1. All instructions fetched after the branch (1-2 of them, in IF/ID) are squashed
   (turned into NOPs/bubbles)
2. PC is redirected to the correct target
3. Predictor state is updated (was this branch taken or not-taken?)
4. BTB is updated with the correct target address
```

**Penalty cost:** In a 5-stage pipeline with branch-resolved-in-EX: 2 cycles flushed.

In modern deep pipelines (Intel Core: ~14 stages, Cortex-A78: ~13 stages):
```
Penalty = stages from IF to branch resolution - 1
         ≈ 12-19 cycles
```

At 3 GHz and 15 cycles penalty: a mispredicted branch costs 15 × (1/3 GHz) = 5ns.
With 10% misprediction rate and 15% branch frequency: CPI += 0.15 × 0.10 × 15 = 0.225.

This is why **branch prediction accuracy** matters so much in modern CPUs.

---

## Modern Predictors: TAGE

**TAGE (Tagged Geometric History Length Predictor)** — state of the art (2006, André Seznec):

- Multiple predictor tables, each indexed by PC XOR different-length history (4, 8, 16, 32, 64, 128 bits)
- Each entry has a 3-bit confidence counter + tag for aliasing detection
- Longer history gives more context; TAGE uses the longest matching history that has high confidence
- Accuracy: 98-99% on SPEC CPU benchmarks

Modern CPUs (Apple M1/M2, AMD Zen 4, Intel Raptor Lake) use TAGE-derived predictors and achieve ~99% branch prediction accuracy — making branch mispredictions a minor concern for most code.

---

## Section Challenge

> ### Branch Prediction Analysis
>
> **Q1:** A 2-bit saturating counter is in state `01` (Weakly Not-Taken). The next 8 branches are: T, T, N, T, T, T, N, T. Trace the state after each branch and count the number of mispredictions.
>
> **Q2:** A loop runs n iterations and always takes the branch back to the top, then exits (not-taken) on iteration n. With a 2-bit predictor starting in Strongly Taken state, how many mispredictions occur per loop invocation? What is the prediction accuracy as n → ∞?
>
> **Q3:** A branch predicts "taken" and the BTB provides target address `0x4020`. But the branch is actually "not taken." What happens in the pipeline? List: (a) what was fetched speculatively, (b) what the pipeline does when the misprediction is detected in EX, (c) where execution continues.
>
> **Q4:** Estimate the CPI contribution of branch mispredictions for: 18% branch frequency, 6% misprediction rate, 14-cycle misprediction penalty. Compare this to a system with a 2-cycle penalty and 40% misprediction rate.
>
> **Q5 (Stretch):** A program has a branch that is taken 73% of the time. (a) What does a 1-bit predictor get for accuracy (assume steady state)? (b) What does a 2-bit predictor get? (c) If this branch is in a tight loop that runs 1000 iterations, and the BTB has 64 entries indexed by PC[7:2], and two other frequently-taken branches alias to the same BTB entry — what could go wrong, and what solution does the TAGE approach offer?

<details>
<summary>Full answers</summary>

```
Q1: 2-bit predictor trace, starting in 01 (WNT)

State encoding: 00=SNT, 01=WNT, 10=WT, 11=ST
Predict N if state ≤ 01. Predict T if state ≥ 10.

Branch  Actual  Predict  State_before → State_after   Correct?
1       T       N (01)   01 → 10                      WRONG
2       T       T (10)   10 → 11                      CORRECT
3       N       T (11)   11 → 10                      WRONG
4       T       T (10)   10 → 11                      CORRECT
5       T       T (11)   11 → 11 (saturate)           CORRECT
6       T       T (11)   11 → 11                      CORRECT
7       N       T (11)   11 → 10                      WRONG
8       T       T (10)   10 → 11                      CORRECT

Mispredictions: 3 (branches 1, 3, 7).
Accuracy: 5/8 = 62.5%

Note: started from WNT (01) which was far from equilibrium for this mostly-taken branch.
If we wait for the predictor to saturate at ST (11), accuracy would be higher.

──────────────────────────────────────────────────────

Q2: 2-bit predictor and n-iteration loop

Starting state: Strongly Taken (ST = 11).

Iterations 1 to n-1 (branch taken): predict T → correct. State stays at 11.
Iteration n (branch NOT taken):
  Predict T → WRONG. Misprediction! State: 11 → 10 (WT).
  
Next loop invocation (reset to iteration 1):
Iteration 1 (branch taken):
  State 10 (WT) → predict T → CORRECT! State: 10 → 11.
Iterations 2 to n-1: predict T → correct. State stays 11.
Iteration n: predict T → WRONG again.

Mispredictions per loop invocation: exactly 1 (the exit branch).
(The 2-bit predictor's hysteresis means the entry to the NEXT invocation is correct.)

Prediction accuracy for n iterations:
  Total branches = n, mispredictions = 1.
  Accuracy = (n-1)/n.
  As n → ∞: accuracy → 100%.

For n=10: 9/10 = 90%. For n=100: 99/100 = 99%.
For n=2: 1/2 = 50% — loops of 2 iterations are hard for this predictor.

──────────────────────────────────────────────────────

Q3: Mispredicted taken branch

Setup: Predict taken, BTB says target = 0x4020. Actual outcome: not-taken.

(a) What was fetched speculatively:
  After the branch (in IF stage), the pipeline fetched instruction at 0x4020 (from BTB).
  That instruction (and possibly the next one if the branch was 2 stages from resolution)
  was loaded into IF/ID (and possibly ID/EX) pipeline registers.

(b) What happens when misprediction detected in EX:
  1. Hazard detected: branch was not-taken, but we fetched from 0x4020.
  2. Squash (flush): set IF/ID pipeline register to NOP.
     Set ID/EX pipeline register to NOP (if 2-stage penalty).
  3. Redirect PC: PC ← branch_PC + 4 (the correct next-sequential instruction).
  4. Update predictor: decrement counter (was predicted taken → move toward not-taken).
  5. Update BTB: BTB still holds 0x4020 as target (target is still correct for future taken branches),
     but the prediction state moves toward not-taken.

(c) Where execution continues:
  From branch_PC + 4 (the fall-through path, since branch was not taken).
  The incorrect instructions (from 0x4020) are discarded completely — they had no
  architectural side effects (they were speculative, register writes haven't committed).

──────────────────────────────────────────────────────

Q4: CPI contribution of branch mispredictions

System A (modern deep pipeline):
  CPI_branches = fraction × mispred_rate × penalty
              = 0.18 × 0.06 × 14
              = 0.1512

System B (shallow pipeline, lower prediction accuracy):
  CPI_branches = 0.18 × 0.40 × 2
              = 0.144

Interesting: System A (deep, accurate) contributes 0.151 CPI from branches.
System B (shallow, inaccurate) contributes 0.144 CPI from branches.
They're nearly equal! But System A runs at perhaps 2× higher clock rate.

Overall throughput comparison:
System A: 4.0 GHz / (1 + 0.151) = 3.47 GIPS
System B: 2.0 GHz / (1 + 0.144) = 1.75 GIPS

System A still wins 2× on throughput, even though branch CPI overhead is similar.
This illustrates why deep pipelines with good predictors beat shallow pipelines.

──────────────────────────────────────────────────────

Q5: Branch taken 73% of the time

(a) 1-bit predictor (steady state):

In steady state, the 1-bit predictor will oscillate. When it predicts T:
  73% of the time: branch T → correct, stay T.
  27% of the time: branch N → wrong, switch to N.
When it predicts N:
  27% of the time: branch N → correct, stay N.
  73% of the time: branch T → wrong, switch to T.

Steady-state: the predictor spends most time in T (73% of branch outcomes are T).
After each T: stay T (prob 0.73), go to N (prob 0.27).
After each N: stay N (prob 0.27), go to T (prob 0.73).

Fraction of time in T = 0.73 / (0.73 + 0.27) = 73% — the predictor tracks the bias.
Accuracy = 0.73 × 0.73 (predict T, was T) + 0.27 × 0.27 (predict N, was N) = 0.533 + 0.073 = 0.606
= 73% when in T + 27% when in N:
  = 0.73 × 0.73 + 0.27 × 0.27 = 0.5329 + 0.0729 = 60.6%

(b) 2-bit predictor (steady state):

The 2-bit predictor typically settles in ST (11) or WT (10) for a 73% taken branch.
Analysis shows it spends most time in ST and WT, predicting T most of the time.
Rough steady-state accuracy: ~73% + some improvement over 1-bit ≈ 80-85%.

Exact analysis requires solving the Markov chain for the 4-state machine.
Key insight: the 2-bit predictor is more accurate than 1-bit because it doesn't flip
prediction on a single deviation from the dominant behavior.

(c) BTB aliasing and TAGE solution:

BTB has 64 entries, indexed by PC[7:2] (6 bits → 64 entries).
If two other branches have the same PC[7:2] bits (alias), they share a BTB entry.

The aliasing problem:
  Branch A (PC = 0x1004): PC[7:2] = 001000 → entry 8
  Branch B (PC = 0x1044): PC[7:2] = 010001 → entry 17
  But if PC = 0x1044 and 0x1004 both have the same 6-bit index (possible with more entries)
  they can collide. Branch A's BTB entry gets overwritten by Branch B's target.
  Next time Branch A is encountered: BTB miss or wrong target → flush and refetch.

Problem in the loop: the two aliasing branches might thrash the BTB entry for our loop branch.
The loop branch goes to a different target than the aliasing branches.
Result: BTB repeatedly evicts the correct loop target → BTB misses → must wait for EX to resolve target every iteration → performance degrades.

TAGE solution:
  TAGE uses TAGGED entries (each entry has a partial tag from the branch PC).
  An aliasing branch from a different PC has a different tag → the lookup fails (tag mismatch)
  → TAGE knows this entry is for a different branch → falls back to a default prediction,
  avoids using the wrong target.

  Additionally: TAGE uses the global history to distinguish branches that ARE at the same PC
  (the same branch but in a different program context → different history → different TAGE entry).
  
This eliminates destructive aliasing, explaining why TAGE achieves 98-99% accuracy.
```

</details>

---

## Common Misconceptions

**"Branch prediction is just 'always predict taken'"**
Always-taken gives ~60-65% accuracy (matches average taken rate in programs). Modern hardware predictors achieve 98-99%. The difference in CPI contribution is enormous in deep pipelines.

**"Branch misprediction only wastes a few cycles"**
In a 5-stage pipeline: yes, 1-2 cycles. In a modern 20-stage pipeline: 15-20 cycles. At 3 GHz, a 15-cycle penalty = 5ns per misprediction. A program with 100M branch mispredictions per second loses 500ms per second — a 33% slowdown.

**"Static analysis can predict branches as well as dynamic hardware"**
For regular loops (always taken until exit): yes. For data-dependent branches (e.g., `if (x > threshold)` where x varies): no. Hardware sees actual runtime data and adapts; the compiler doesn't know the data.

---

## Connections

- **Chapter 04 — Hazards:** Branch prediction is the solution to the control hazard introduced there. Instead of flushing on every branch, we predict and only flush on mispredictions.
- **Chapter 06 — Cache Design:** Cache misses are the other major source of pipeline stalls. Memory latency stalls can be 50-200+ cycles — dwarfing branch penalties when they occur.
- **Chapter 10 — Performance Analysis:** The overall CPI formula accumulates all stall types: CPI = base + load_use_stalls + branch_stalls + cache_miss_stalls.

---

> [← 04 Pipeline Hazards](04_Pipeline_Hazards.md) | [Course Index](README.md) | [Next → 06 Cache Design and AMAT](06_Cache_Design_AMAT.md)
