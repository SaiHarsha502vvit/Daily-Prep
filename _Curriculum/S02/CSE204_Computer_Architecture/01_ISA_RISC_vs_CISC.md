# Chapter 01 — Instruction Set Architecture: RISC vs CISC

> [Course Index](README.md) | [Next → 02 Single-Cycle Datapath](02_Single_Cycle_Datapath.md)

---

## The Problem: Who Does the Work?

A CPU needs to execute `a = b + c`. At the machine level, it can do this in at least two ways:

**Way 1 (many simple instructions):**
```asm
LOAD  r1, [b]       ; load b from memory into register r1
LOAD  r2, [c]       ; load c from memory into register r2
ADD   r3, r1, r2    ; r3 = r1 + r2
STORE r3, [a]       ; store result to memory
```

**Way 2 (one complex instruction):**
```asm
ADD   [a], [b], [c]  ; memory + memory + memory, hardware handles the rest
```

Way 2 looks nicer. But which is actually faster? Which is easier to build? Which scales better when you add transistors?

The answer revealed a religious war in computer architecture: **RISC vs CISC**, settled empirically in the 1980s-90s but still misunderstood today. This chapter derives WHY from first principles.

---

## The Instruction Set Architecture (ISA)

**Definition:** The ISA is the contract between hardware and software — the set of instructions a CPU must support, their encoding, and their semantics. It's an abstraction layer:

```
High-level code (Java, C)
       ↓  compiler
Assembly / machine code ← THE ISA LIVES HERE
       ↓  hardware implements
Transistors, gates, circuits
```

**Why this boundary matters:** Multiple hardware implementations can share one ISA (Intel and AMD both implement x86). One chip can execute many ISAs in principle (translated or emulated). The ISA defines what's possible, not how it's done.

**What an ISA specifies:**
1. **Register file:** How many registers, how wide (32-bit, 64-bit), special roles (stack pointer, program counter, link register)
2. **Instruction set:** Arithmetic, logical, memory access, control flow — which operations exist
3. **Addressing modes:** How operands are located (register, immediate, register-indirect, base+offset, PC-relative)
4. **Instruction encoding:** How bits in the instruction word encode opcode + operands
5. **Memory model:** Word size, byte ordering (big/little endian), alignment requirements

---

## CISC: Complex Instruction Set Computer

**Historical motivation (1960s-1970s):**

Memory was expensive and slow. Compilers were primitive. Assembly programmers needed compact code. The solution: jam as much into each instruction as possible.

**Hallmarks of CISC (x86 is the canonical example):**
- Hundreds to thousands of instructions
- Instructions take 1-15+ bytes (variable length encoding)
- Instructions can operate directly on memory (`ADD [rax+4], rbx`)
- Single instructions do complex things: `LOOP`, `REP MOVSB`, `ENTER`, `LEAVE`
- Many addressing modes: `[base + index * scale + offset]`

**The compelling argument:** A single instruction like `ADD [rax], rbx` does what 3 RISC instructions do. Smaller code → fits more in instruction cache → fewer cache misses.

**The hidden cost:**

To implement `ADD [rax], rbx`:
1. Decode the instruction (variable-length — is it 2 bytes? 3? 6?)
2. Calculate the memory address (rax + displacement)
3. Issue a memory read
4. Wait for memory read to complete (could be 100+ cycles on a cache miss)
5. Execute the addition
6. Write back to memory

This is a **6-step micro-program** internally. The hardware must be complex enough to sequence these micro-steps. Pipelining (next chapter) becomes very hard when instructions take different numbers of micro-steps.

---

## RISC: Reduced Instruction Set Computer

**The 1980 insight (Patterson, Hennessy, Stanford MIPS, UC Berkeley RISC):**

Studies of actual programs showed that **95% of executed instructions** were simple: loads, stores, adds, compares, branches. The complex CISC instructions were rarely used, yet their complexity dominated chip design.

**Key insight: Amdahl's law applied to ISA design.** If 95% of your work is simple and 5% is complex:
- Make the 95% fast → huge wins
- Sacrifice some ease on the 5% → small losses

**RISC design principles (derived, not arbitrary):**

**Principle 1: Load/Store architecture.** ONLY `LOAD` and `STORE` instructions access memory. ALL other instructions (ADD, AND, CMP, etc.) operate on registers only.

```
RISC: 
  lw  r1, 0(r2)      ; LOAD: memory → register
  lw  r3, 4(r2)      ; LOAD: memory → register
  add r4, r1, r3     ; ADD: register op register
  sw  r4, 8(r2)      ; STORE: register → memory

CISC:
  add [r2+8], [r2], [r2+4]  ; one instruction, but requires 3 memory accesses internally
```

**Why?** Every arithmetic instruction completes in one cycle when operands are in registers. Memory access latency is variable and unpredictable. Separating them makes timing deterministic — essential for pipelining.

**Principle 2: Fixed-length instructions.** All instructions are exactly 32 bits (4 bytes).

**Why?** Instruction fetch becomes trivial: every cycle, fetch 4 bytes, decode in one step. Variable-length decoding (x86 goes from 1-15 bytes) requires a complex multi-cycle decode stage.

**Principle 3: Few, uniform instruction formats.** MIPS has 3 formats (R/I/J); RISC-V has 6. Most of the opcode field, rs/rt/rd fields, immediate fields are at the same bit positions across formats.

**Why?** Register reads can begin before decoding finishes — you read rs and rt speculatively while still decoding, because they're always at the same bit positions. This saves a pipeline stage.

**Principle 4: Many registers.** MIPS/RISC-V have 32 integer registers. x86 historically had 8 (extended to 16 in x86-64).

**Why?** If you have 32 registers, common variables stay in registers across multiple instructions. With 8 registers (CISC), you spill frequently to memory (defeating the whole purpose of registers).

---

## RISC-V Instruction Formats

RISC-V (the modern open-source RISC ISA) has 6 instruction formats. Understanding them shows how the principles play out in bits:

```
R-type (register-register):
  31..25   24..20  19..15  14..12  11..7    6..0
  funct7   rs2     rs1     funct3  rd       opcode
  7 bits   5 bits  5 bits  3 bits  5 bits   7 bits

I-type (immediate, loads, arithmetic with constant):
  31..20      19..15  14..12  11..7    6..0
  imm[11:0]   rs1     funct3  rd       opcode
  12 bits     5 bits  3 bits  5 bits   7 bits

S-type (store):
  31..25      24..20  19..15  14..12  11..7        6..0
  imm[11:5]   rs2     rs1     funct3  imm[4:0]     opcode
  7 bits      5 bits  5 bits  3 bits  5 bits       7 bits
  [imm split so rs1/rs2 stay at the same bit positions as R-type]
```

**Key observation:** rs1 is always bits 19-15. rs2 is always bits 24-20. The register file can start reading rs1 and rs2 immediately, before the rest of the decode is complete. This "early register read" trick saves pipeline cycles.

---

## Addressing Modes

**RISC-V / MIPS addressing modes (minimal):**
1. **Register:** `ADD r1, r2, r3` — operands in registers
2. **Immediate:** `ADDI r1, r2, 100` — one operand is a 12-bit constant encoded in instruction
3. **Base + offset:** `LW r1, 100(r2)` — memory address = r2 + 100 (for struct fields, array elements)
4. **PC-relative:** `BEQ r1, r2, target` — branch target = PC + offset (position-independent code)

**x86 addressing modes (extensive):**
- Register: `ADD eax, ebx`
- Immediate: `ADD eax, 100`
- Direct: `MOV eax, [0x4020A0]`
- Register indirect: `MOV eax, [rbx]`
- Base + displacement: `MOV eax, [rbx + 8]`
- Base + index: `MOV eax, [rbx + rcx]`
- Base + index × scale + displacement: `MOV eax, [rbx + rcx*4 + 8]` (for `arr[i]` where elements are 4 bytes)

**The RISC argument:** Base + offset handles 95% of cases. The hardware to compute `base + index * scale + displacement` is complex, large, and adds latency to every instruction's address generation stage.

---

## The Performance Comparison

**CISC claim:** Fewer instructions = less work = faster.
**RISC response:** What matters is cycles per second × seconds per instruction, not instructions per program.

```
Time = Instruction count × CPI × (1/clock rate)
```

| Factor | CISC | RISC |
|--------|------|------|
| Instruction count | Fewer | More (typically 1.3-1.5×) |
| CPI | Higher (complex decode) | Lower (1-2 typical) |
| Clock rate | Lower (complex logic) | Higher (simple stages) |

Modern RISC wins on clock rate AND CPI because:
1. Simple fixed-length decode → shorter critical path → higher GHz
2. Load/store separation → pipeline stages balanced → CPI close to 1

**The final resolution:** Intel's modern x86 chips internally translate x86 instructions into RISC-like "micro-ops" (µops) that execute on a RISC-style out-of-order engine. The x86 ISA is CISC for compatibility; the execution engine is RISC for performance.

```
x86 instruction → Front-end decoder → µop queue → RISC-style out-of-order engine
```

CISC won the compatibility war. RISC won the design war. Modern chips do both.

---

## Endianness: Big-Endian vs Little-Endian

A 32-bit integer `0x12345678` stored at address `0x1000` — which byte comes first?

**Big-endian (most significant byte first):**
```
Address: 0x1000  0x1001  0x1002  0x1003
Byte:     0x12    0x34    0x56    0x78
```
SPARC, PowerPC (historically), network byte order.

**Little-endian (least significant byte first):**
```
Address: 0x1000  0x1001  0x1002  0x1003
Byte:     0x78    0x56    0x34    0x12
```
x86, x86-64, ARM (default), RISC-V.

**Why it matters:** When you cast a `char*` to `int*` or read binary files, endianness determines whether you get the right value. Network protocols (TCP/IP) use big-endian ("network byte order") — hence `htonl()` / `ntohl()` in C socket code to convert.

**Why little-endian won:** Extending an integer from 8-bit to 16-bit to 32-bit doesn't change the address of the least significant byte. Adding a byte of precision at the top doesn't move the base address. Useful for variable-width integer storage.

---

## RISC-V in Practice: Writing Assembly

RISC-V assembly for `int sum = 0; for (int i = 0; i < n; i++) sum += a[i];`:

```asm
# Arguments: a0 = pointer to array a[], a1 = n
# Returns:   a0 = sum

  li   t0, 0         # sum = 0
  li   t1, 0         # i = 0
loop:
  bge  t1, a1, done  # if i >= n, jump to done
  slli t2, t1, 2     # t2 = i * 4  (byte offset for 32-bit ints)
  add  t3, a0, t2    # t3 = &a[i]
  lw   t4, 0(t3)     # t4 = a[i]
  add  t0, t0, t4    # sum += a[i]
  addi t1, t1, 1     # i++
  j    loop          # jump back
done:
  mv   a0, t0        # return value in a0
  ret
```

Count: 9 instruction types, 8 instructions per iteration (excluding loop setup). A CISC version might use 3-4 instructions per iteration — but each CISC instruction might take 2-4 cycles vs RISC's ~1 CPI in steady state.

---

## Section Challenge

> ### ISA Analysis and Encoding
>
> **Q1:** A RISC-V I-type instruction encodes a 12-bit signed immediate. What is the range of immediate values representable? The `ADDI r1, r2, imm` instruction computes r1 = r2 + sign_extend(imm). If r2 = 0 (the zero register), what values can you load into r1 with a single `ADDI`?
>
> **Q2:** To load a 32-bit constant `0xDEADBEEF` into a RISC-V register, you need two instructions: `LUI r1, upper20` followed by `ADDI r1, r1, lower12`. Explain the split. Why does `LUI` load the upper 20 bits (not upper 16 or upper 24)? Hint: what's left for the `ADDI` immediate?
>
> **Q3:** x86 has the instruction `LOOP label` which decrements ECX and jumps to label if ECX ≠ 0. In RISC-V, write the equivalent using separate instructions. How many RISC-V instructions replace one CISC `LOOP`? Does this mean RISC is "worse"?
>
> **Q4:** Give a concrete scenario where big-endian vs little-endian produces a bug. Write the C code that triggers the bug and the fix using `ntohl()`.
>
> **Q5 (Stretch):** A program has the following instruction mix: 30% loads, 10% stores, 40% arithmetic, 15% branches, 5% other. On RISC, each instruction takes 1 cycle on average (CPI = 1). On CISC, the compiler generates 30% fewer total instructions, but complex addressing modes add 0.5 cycles average overhead (CPI = 1.5). If the RISC clock runs at 3.0 GHz and CISC runs at 2.4 GHz (due to more complex logic), which architecture is faster? Use: Time = IC × CPI / GHz.

<details>
<summary>Full answers</summary>

```
Q1: 12-bit signed immediate range

A 12-bit two's complement number ranges from -2^11 to 2^11 - 1 = -2048 to +2047.

With ADDI r1, x0, imm (using r0/x0 = always 0):
r1 = 0 + sign_extend(imm) = imm

You can load constants in [-2048, 2047] directly.
For values outside this range, you need LUI + ADDI (Q2 explains this).

──────────────────────────────────────────────────────

Q2: LUI + ADDI for 32-bit constants

RISC-V registers are 32 bits. To load 0xDEADBEEF:
  Upper 20 bits: 0xDEADB (bits 31-12)
  Lower 12 bits: 0xEEF   (bits 11-0) = decimal 3823

LUI (Load Upper Immediate) loads a 20-bit value into bits 31-12, clears bits 11-0:
  LUI r1, 0xDEADB      # r1 = 0xDEADB000

ADDI then adds the lower 12 bits:
  ADDI r1, r1, 0xEEF   # but wait — 0xEEF is negative if sign-extended!
  
0xEEF = 0b111011101111 — MSB is 1, so sign-extended to 32 bits = 0xFFFFF EEF (negative!)
So we need: LUI with 0xDEADB + 1 = 0xDEADC to compensate:
  LUI r1, 0xDEADC        # r1 = 0xDEADC000
  ADDI r1, r1, -0x111    # r1 = 0xDEADC000 - 0x111 = 0xDEADBEEF

More carefully: 0xEEF sign-extended = -0x111 (since 0x1000 - 0xEEF = 0x111).
So LUI loads upper20+1 and ADDI subtracts the negative lower12.

Why 20+12 = 32 split? RISC-V instruction is 32 bits. Opcode is 7 bits, rd is 5 bits.
That leaves 20 bits for the immediate in LUI. 12 bits in I-type ADDI.
20 + 12 = 32 exactly covers a full 32-bit constant. Clean design.

──────────────────────────────────────────────────────

Q3: RISC-V replacement for x86 LOOP

x86 LOOP:
  LOOP label  ; ECX--; if (ECX != 0) jump label

RISC-V equivalent (3 instructions):
  addi  t0, t0, -1      # t0-- (decrement counter)
  bne   t0, x0, label   # if t0 != 0, branch to label

Actually only 2 instructions. (Or 3 if we need to compare to a value other than 0.)

Does this mean RISC is "worse"? No — two RISC instructions execute at ~CPI=1 each
= 2 cycles. The x86 LOOP takes 5 cycles on modern CPUs (complex decode + partial-flag
update). The RISC sequence is 2.5× faster despite being "more instructions."

The lesson: instruction count is not execution count. CPI × frequency is what matters.

──────────────────────────────────────────────────────

Q4: Endianness bug in C

Scenario: server (big-endian) sends a 32-bit integer via TCP. Client (little-endian x86) receives it.

Without ntohl():
  uint32_t received = 0x01000000;  // server sent 1, but bytes arrived as 0x00 0x00 0x00 0x01
  // little-endian reads: 0x01000000 = 16,777,216 (wrong!)

The bug:
  uint32_t val;
  recv(sock, &val, 4, 0);  // receives 4 bytes
  printf("%u\n", val);     // WRONG on little-endian: 16777216 instead of 1

The fix:
  uint32_t val;
  recv(sock, &val, 4, 0);
  val = ntohl(val);         // network-to-host-long: converts big-endian → host endian
  printf("%u\n", val);     // CORRECT: 1

ntohl() is a no-op on big-endian machines (value already in right order).
On little-endian (x86): it byte-swaps 0x01000000 → 0x00000001 = 1.

──────────────────────────────────────────────────────

Q5: RISC vs CISC performance comparison

Let N = instruction count on CISC.
RISC instruction count = N / 0.70 = 1.429N (30% more instructions)

Execution time:
  Time = IC × CPI / clock_rate

CISC: T_CISC = N × 1.5 / 2.4 = 0.625N (ns, with appropriate scaling)
RISC: T_RISC = 1.429N × 1.0 / 3.0 = 0.476N

RISC is faster: T_RISC / T_CISC = 0.476 / 0.625 = 0.762, so RISC is 24% faster.

The key insight: RISC's higher clock rate (3.0 vs 2.4 GHz = 25% advantage) more than
compensates for 43% more instructions, especially when CISC's CPI is also higher.

This is why ARM/RISC-V chips dominate mobile and embedded today:
  - Higher clock efficiency per transistor
  - Lower power per computation
  - Apple M1 (ARM) outperforms x86 per watt by 2-3× in practice
```

</details>

---

## Common Misconceptions

**"CISC has fewer instructions so it's faster"**
Fewer instructions per program ≠ fewer cycles per program. CISC instructions can take 3-20+ cycles each. RISC instructions target 1 cycle each (pipelined). The cycle is the unit of time, not the instruction.

**"RISC-V and ARM are the same"**
Both are RISC, but different ISAs. ARM is proprietary (licensed by Arm Holdings). RISC-V is open, royalty-free. Apple uses ARM (their own implementation — Apple Silicon). RISC-V is growing in embedded, server (Western Digital, NVIDIA), and open-source hardware communities.

**"The ISA determines the performance"**
The ISA constrains but doesn't determine performance. AMD and Intel both implement x86 but have different performance characteristics. Apple's M1 (ARM ISA) vastly outperforms Qualcomm's Snapdragon (also ARM ISA) in many workloads. The micro-architecture (how the ISA is implemented) matters enormously.

---

## Connections

- **CSE104 Ch04 — Machine Code:** Assembly language is a human-readable encoding of machine instructions. CSE204 goes deeper: we now understand WHY each instruction looks the way it does.
- **Chapter 02 — Single-Cycle Datapath:** The ISA defines WHAT each instruction must do. The datapath defines HOW — the actual hardware circuits that execute it.
- **Chapter 03-04 — Pipelining and Hazards:** Fixed-length RISC instructions make pipelining possible. CISC variable-length instructions make pipelining very hard (x86 does it anyway, but at a cost).

---

> [Course Index](README.md) | [Next → 02 Single-Cycle Datapath](02_Single_Cycle_Datapath.md)
