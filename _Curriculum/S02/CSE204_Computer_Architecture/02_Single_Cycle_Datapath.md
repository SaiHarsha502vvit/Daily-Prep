# Chapter 02 — Single-Cycle Datapath

> [← 01 ISA: RISC vs CISC](01_ISA_RISC_vs_CISC.md) | [Course Index](README.md) | [Next → 03 Pipelining](03_Pipelining.md)

---

## The Problem: How Does the CPU Actually Execute an Instruction?

You write `int c = a + b;`. The compiler turns this into:

```asm
lw   t1, 0(s0)   # load a from memory
lw   t2, 4(s0)   # load b from memory
add  t3, t1, t2  # t3 = a + b
sw   t3, 8(s0)   # store c to memory
```

But what does it mean for the CPU to "execute" `add t3, t1, t2`? Somewhere, electrons flow through transistors in a specific sequence. This chapter traces exactly which hardware components activate, in which order, to make that happen — and then shows how those components connect into the complete single-cycle datapath.

---

## The Five Components of Any CPU

Every CPU, from a simple microcontroller to a modern Core i9, has these five functional blocks:

**1. Instruction Memory (IM):** Stores the program. Indexed by the program counter (PC), it outputs the 32-bit instruction at address PC.

**2. Register File (RF):** A small, fast array of registers. For RISC-V: 32 registers × 32 bits. Two read ports (rs1, rs2) and one write port (rd). Reads are combinational (instant). Writes happen on the clock edge.

**3. ALU (Arithmetic Logic Unit):** Performs ADD, SUB, AND, OR, SLT (set-less-than), etc. Takes two 32-bit inputs, produces a 32-bit result and a "zero" flag (useful for branch decisions).

**4. Data Memory (DM):** Stores data (variables, arrays). Accessed by `lw` (load word) and `sw` (store word). Separate from instruction memory in the Harvard architecture; unified in von Neumann (most real systems).

**5. Control Unit (CU):** Decodes the instruction opcode and generates control signals (RegWrite, MemRead, MemWrite, ALUSrc, Branch, etc.) that configure all the other components for this instruction type.

---

## The Fetch-Decode-Execute Cycle

Every instruction goes through this sequence:

```
1. FETCH:   Read instruction at address PC from Instruction Memory
            PC ← PC + 4  (next instruction, assuming no branch)

2. DECODE:  Control Unit interprets the opcode
            Register File reads rs1 and rs2 simultaneously

3. EXECUTE: ALU performs the operation
            For R-type:  result = rs1 op rs2
            For I-type:  result = rs1 op sign_extend(imm)
            For branches: compare rs1 and rs2, compute branch target

4. MEMORY:  For loads:  read Data Memory at ALU-computed address
            For stores: write Data Memory at ALU-computed address
            All other instructions: skip this stage

5. WRITEBACK: For R/I arithmetic: write ALU result to rd in Register File
              For loads: write data from Data Memory to rd
              For stores/branches: no register writeback
```

In a **single-cycle** design, all five stages happen in ONE clock cycle simultaneously for the SAME instruction. This is simple but slow — the cycle time must accommodate the SLOWEST possible instruction path.

---

## Data Path for Each Instruction Type

### R-type: `add rd, rs1, rs2`

```
Control signals: RegWrite=1, ALUSrc=0, MemToReg=0, MemRead=0, MemWrite=0, Branch=0

Flow:
PC → Instruction Memory → instruction bits
                        → Control Unit → control signals
                        → Register File (reads rs1, rs2)
                                → ALU (op = ADD, inputs = rs1, rs2)
                                            → Register File write port (rd ← ALU result)
```

**ALUSrc = 0:** ALU second operand comes from Register File (rs2), NOT from immediate.
**MemToReg = 0:** Register write data comes from ALU result, NOT from Data Memory.

---

### I-type Load: `lw rd, imm(rs1)`

```
Control signals: RegWrite=1, ALUSrc=1, MemToReg=1, MemRead=1, MemWrite=0, Branch=0

Flow:
Instruction bits → Sign-extend imm12 to 32-bit imm32
Register File reads rs1
ALU computes: address = rs1 + imm32   [ALUSrc=1: second ALU input = imm32]
Data Memory reads: data = Mem[address]  [MemRead=1]
Register File write: rd ← data   [MemToReg=1: write data from memory, not ALU]
```

**ALUSrc = 1:** ALU second operand is sign-extended immediate (not rs2).
**MemToReg = 1:** Register write data comes from Data Memory output.

---

### S-type Store: `sw rs2, imm(rs1)`

```
Control signals: RegWrite=0, ALUSrc=1, MemRead=0, MemWrite=1, Branch=0

Flow:
Instruction bits → Sign-extend imm (split between bits [11:5] and [4:0])
Register File reads rs1 AND rs2
ALU computes: address = rs1 + imm32
Data Memory writes: Mem[address] ← rs2   [MemWrite=1]
(No register writeback — RegWrite=0)
```

**Tricky detail:** The store immediate is split across the instruction word (bits [31:25] and [11:7]) precisely so rs1 and rs2 are at the same bit positions as in R-type. This allows the Register File to start reading before the full immediate is assembled.

---

### B-type Branch: `beq rs1, rs2, offset`

```
Control signals: RegWrite=0, ALUSrc=0, Branch=1, MemRead=0, MemWrite=0

Flow:
Register File reads rs1 and rs2
ALU computes: rs1 - rs2 (SUB), sets Zero flag if result = 0
Branch target address = PC + sign_extend(offset) × 2   [computed in parallel]

Next PC selection:
  If (Branch=1 AND Zero=1):  PC ← branch_target
  Else:                       PC ← PC + 4
```

The branch target address and PC+4 are both computed in parallel. A 2-input multiplexer (controlled by Branch AND Zero) selects which becomes the next PC.

---

## The Complete Datapath: Wiring It Together

```
                    ┌─────────────────┐
                    │   PC Register   │
                    └────────┬────────┘
                             │ current PC
               ┌─────────────┴──────────────┐
               ↓                            ↓
    ┌──────────────────┐          ┌──────────────────┐
    │ Instruction Mem  │          │   PC + 4 adder   │
    │   Output: instr  │          │   Output: PC+4   │
    └──────┬───────────┘          └──────────────────┘
           │                                ↑  ↓ (to next-PC MUX)
    ┌──────┴──────────────────┐
    │     Control Unit        │ → ALUOp, RegWrite, MemRead,
    │   (decodes opcode)      │   MemWrite, ALUSrc, MemToReg,
    └──────┬──────────────────┘   Branch
           │ instruction bits
    ┌──────┴──────────────────────────────────────┐
    │            Register File                    │
    │  Read port 1: rs1 → A                      │
    │  Read port 2: rs2 → B                      │
    │  Write port:  rd ← WD (gated by RegWrite)  │
    └──────────┬──────────────────────────────────┘
               │ A      B
               ↓        ↓ ←── or sign_ext(imm) [ALUSrc MUX]
         ┌───────────┐
         │    ALU    │
         │  op=ALUOp │
         │  Result   │
         │  Zero     │
         └─────┬─────┘
               │ Result (address or arithmetic result)
    ┌──────────┴──────────────────┐
    │     Data Memory             │
    │  Read (MemRead):  RD        │
    │  Write (MemWrite): B → Mem  │
    └──────────┬──────────────────┘
               │ RD (memory read data)
               ↓ ←── or ALU Result [MemToReg MUX]
    (Register File Write Data)
```

The two critical multiplexers:
- **ALUSrc MUX:** Selects ALU second operand: Register (rs2) vs Immediate
- **MemToReg MUX:** Selects register write data: ALU result vs Data Memory read

---

## Control Truth Table

| Instruction | RegWrite | ALUSrc | MemRead | MemWrite | Branch | MemToReg | ALUOp |
|-------------|----------|--------|---------|----------|--------|----------|-------|
| R-type (add,sub,...) | 1 | 0 | 0 | 0 | 0 | 0 | func |
| I-type load (lw) | 1 | 1 | 1 | 0 | 0 | 1 | ADD |
| S-type store (sw) | 0 | 1 | 0 | 1 | 0 | X | ADD |
| B-type branch (beq) | 0 | 0 | 0 | 0 | 1 | X | SUB |

The Control Unit is a combinational circuit that maps opcode bits → this table. It's a lookup table implemented with logic gates.

---

## Critical Path and Cycle Time

**Critical path:** The longest combinational delay through the datapath determines the minimum clock cycle time.

For a **load word** instruction (`lw rd, imm(rs1)`):

```
Path:
  Instruction Memory read  → 200ps
  Register File read       → 150ps
  ALU (address compute)    → 200ps
  Data Memory read         → 250ps
  Register File write      → 100ps (setup time)
  Total:                     900ps
```

The clock cycle must be at least 900ps → maximum clock frequency = 1/0.9ns ≈ 1.1 GHz.

**Problem:** ALL instructions must take 900ps, even `add` which needs only:
```
  Instruction Memory read  → 200ps
  Register File read       → 150ps
  ALU                      → 200ps
  Register File write      → 100ps
  Total:                     650ps   (wasted 250ps for every add)
```

This is the fundamental problem with single-cycle design. The critical path is set by the slowest instruction. **Pipelining** (Chapter 03) solves this.

---

## The ALU Design

The ALU performs multiple operations based on a control signal:

```
ALU control:
  0000: AND
  0001: OR
  0010: ADD
  0110: SUB  (A + two's complement of B = A + ~B + 1)
  0111: SLT  (set-less-than: output = 1 if A < B, else 0)
  1100: NOR

Key hardware:
  Full adder: 1-bit adder with carry-in → carry-out
  Ripple carry: chain 32 full adders (simple, slow)
  Carry-lookahead: compute carries in parallel (fast)
  
  For SUB: Binvert signal flips all bits of B, then Cin=1 → B+1 = -B in two's complement
  For SLT: result = sign bit of (A - B) [overflow-adjusted]
```

The **zero flag** (output of ALU) is 1 when all 32 output bits are 0. Used by `BEQ` to determine if rs1 == rs2 (since BEQ computes rs1 - rs2 and branches if Zero=1).

---

## Section Challenge

> ### Datapath Trace and Critical Path Analysis
>
> **Q1:** Trace the single-cycle datapath for `sw t2, 12(s0)` (store word). List every component that activates, in order, and the value of each control signal. What does the ALU compute? What is written to where?
>
> **Q2:** The instruction `beq s0, s1, -20` branches backward by 20 bytes (5 instructions back) if s0 == s1. (a) What does the ALU compute? (b) What does the branch target adder compute? (c) Which value becomes the next PC when s0 == s1 vs s0 ≠ s1?
>
> **Q3:** Why does the single-cycle design use TWO separate memories (instruction memory and data memory) rather than one unified memory? What would happen if there was only one memory? (Hint: consider what happens when `lw t1, 0(s0)` runs — it needs instruction fetch AND data memory access in the same cycle.)
>
> **Q4:** Identify the critical path for an R-type instruction (e.g., `add rd, rs1, rs2`). Using the same component delays as in the text (IM=200ps, RF_read=150ps, ALU=200ps, DM=250ps, RF_write=100ps), what is the total delay? How much time is "wasted" compared to a load instruction? What percentage overhead does the critical path impose on an R-type?
>
> **Q5 (Stretch):** A new instruction `lw` variant is proposed: `LWI rd, imm` which loads from address `imm` (a 20-bit absolute address) rather than `rs1 + imm`. How would you modify the datapath to support this? What new mux(es) and control signal(s) do you need? Sketch the modified ALUSrc mux selection.

<details>
<summary>Full answers</summary>

```
Q1: Datapath trace for sw t2, 12(s0)

Instruction: sw t2, 12(s0)  ← store t2 to memory address s0 + 12

Control signals:
  RegWrite  = 0  (no register written)
  ALUSrc    = 1  (ALU second input is immediate, not rs2=t2)
  MemRead   = 0
  MemWrite  = 1  (write to data memory)
  Branch    = 0
  MemToReg  = X  (don't care — no register write)
  ALUOp     = ADD

Step-by-step datapath:
  1. PC → Instruction Memory → 32-bit instruction
  2. Instruction bits → Control Unit → signals above
  3. Instruction bits[19:15] = s0 → Register File read port 1 → A = s0_value
     Instruction bits[24:20] = t2 → Register File read port 2 → B = t2_value
  4. Immediate from bits[31:25] concat bits[11:7] = 12 → sign_extend → 32-bit 12
  5. ALUSrc=1: ALU inputs are (A = s0_value, imm = 12) → ADD → address = s0_value + 12
  6. MemWrite=1: Data Memory writes t2_value to address (s0_value + 12)
  7. PC ← PC + 4 (no branch)

The ALU computes: s0 + 12 (the effective memory address for the store).
Written: t2_value is written to Data Memory at address (s0 + 12).
Nothing is written to the Register File (RegWrite=0).

──────────────────────────────────────────────────────

Q2: Branch instruction beq s0, s1, -20

(a) ALU computation:
The ALU computes s0 - s1 using SUB operation.
If s0 == s1: result = 0 → Zero flag = 1.
If s0 ≠ s1:  result ≠ 0 → Zero flag = 0.

(b) Branch target adder:
Branch target = PC + sign_extend(offset)
offset in RISC-V B-type is encoded in multiples of 2 (byte addressing).
"branch by -20 bytes" → offset field = -20.
Branch target = PC + (-20).

(c) Next PC selection:
BranchTaken = Branch AND Zero = 1 AND (s0==s1 ? 1 : 0)

If s0 == s1:  BranchTaken = 1 → Next PC = PC - 20 (jump back 5 instructions)
If s0 ≠ s1:  BranchTaken = 0 → Next PC = PC + 4 (fall through)

──────────────────────────────────────────────────────

Q3: Why two separate memories?

With ONE unified memory:
  lw t1, 0(s0) needs:
    1. Instruction Fetch: read instruction from memory at PC
    2. Data Access: read data from memory at (s0 + 0)
  Both happen in the SAME clock cycle — but one memory can only service one request at a time.
  This creates a structural hazard: the memory port is in use twice simultaneously.

The two-memory (Harvard architecture) solution:
  - Instruction Memory: read-only during execution, holds program text
  - Data Memory: read-write, holds heap/stack/global data
  Two separate memory buses → two accesses can happen simultaneously without conflict.

Modern CPUs handle this with separate L1 instruction cache and L1 data cache
(the "modified Harvard architecture"). Physically it's one DRAM, but the cache system
provides separate access ports, eliminating the conflict.

──────────────────────────────────────────────────────

Q4: R-type critical path

Path for add rd, rs1, rs2:
  Instruction Memory read  → 200ps
  Register File read       → 150ps
  ALU (add)                → 200ps
  (skip Data Memory)       →  0ps
  Register File write      → 100ps
  Total:                     650ps

Compare to lw (critical path): 900ps.

Time "wasted" per add: 900 - 650 = 250ps
This is 250/900 = 27.8% overhead — the add finishes 278ps before the clock edge.
Hardware sits idle for 250ps every add instruction.

In a system where ~40% of instructions are arithmetic (lw=30%, sw=10%, arith=40%):
Average wasted cycles per instruction type:
  arith: 250ps wasted (40% of instructions)
  branch: 900-550=350ps wasted (15% of instructions)
  load: 0ps wasted (30% of instructions — it IS the critical path)
  store: 900-800=100ps wasted (10% of instructions)

Overall average waste: 0.40×250 + 0.15×350 + 0.30×0 + 0.10×100 = 100+52.5+0+10 = 162.5ps
About 18% of each 900ps cycle is wasted on average. Pipelining reclaims this.

──────────────────────────────────────────────────────

Q5: LWI instruction datapath modification

LWI rd, imm20  ← load from absolute address imm20 (a 20-bit constant)

Problem: current ALU address = rs1 + imm12. For LWI, the address IS the immediate
(no rs1 addition needed). We need a way to use imm20 directly as the memory address.

Option 1: Extend immediate with a larger U-type format (20-bit immediate):
  The LUI instruction already uses a 20-bit immediate in upper bits.
  We could repurpose this format.

Datapath modification:
  1. Sign-extend (or zero-extend) the 20-bit immediate to 32 bits.
  2. Add a new ALUSrc option: 
     ALUSrc=0: rs2 (R-type)
     ALUSrc=1: imm12 (I-type loads)
     ALUSrc=2: imm20 (new LWI)  ← upgrade ALUSrc mux from 2-to-1 to 3-to-1
  3. When ALUSrc=2, feed the 20-bit immediate sign-extended into ALU input B.
     OR: bypass the ALU entirely with a new address MUX:
     AddrSrc=0: ALU result (rs1 + imm12)
     AddrSrc=1: imm20 extended (absolute address)
     
  New control signal: ALUSrc[1:0] (2-bit now, not 1-bit)
  - 00: rs2 (register-register)
  - 01: sign_extend(imm12) (normal load)
  - 10: sign_extend(imm20) (LWI absolute)

The ALU still does an ADD with rs1=x0 (zero register) if you want to reuse it:
  address = x0 + sign_extend(imm20) = sign_extend(imm20) ← effectively the immediate itself.

This requires no structural changes, just routing imm20 to the existing ALUSrc mux
and adding one mux input (or using a separate U-type immediate extraction circuit).
```

</details>

---

## Common Misconceptions

**"The register file has 32 entries, so reads are slow"**
Register files are implemented as SRAM cells with parallel read ports. All 32 registers are accessed simultaneously (the address bits select which output to connect to the bus). Read latency is ~150ps regardless of which register — it's not a sequential search.

**"The control unit is a program"**
The control unit is combinational logic (truth table implemented with gates). It does NOT execute code. Opcode bits map to control signals through fixed logic — no loops, no program counter. This is what makes it fast: the output is valid within nanoseconds of the input changing.

**"Single-cycle means one instruction per clock cycle"**
Correct! But the clock frequency is severely constrained by the critical path. Modern pipelined CPUs also execute one instruction per clock cycle in steady state (CPI → 1) but at much higher clock rates because each stage takes much less time.

---

## Connections

- **Chapter 01 — ISA:** The ISA defined the instruction set. This chapter implements it in hardware. R/I/S/B-type instructions map directly to the datapath paths traced above.
- **Chapter 03 — Pipelining:** The single-cycle datapath is the basis for pipelining. We split it into 5 stages (IF/ID/EX/MEM/WB) and add pipeline registers between stages — dramatically increasing throughput.
- **CSE104 Ch05 — Pipelining Basics:** CSE104 introduced pipelining conceptually. This chapter shows the hardware foundation. Chapter 03 merges both.

---

> [← 01 ISA: RISC vs CISC](01_ISA_RISC_vs_CISC.md) | [Course Index](README.md) | [Next → 03 Pipelining](03_Pipelining.md)
