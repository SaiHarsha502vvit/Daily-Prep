# Chapter 04 — Machine Code & Assembly Basics

> [← 03 Floating-Point Numbers](03_Floating_Point_IEEE754.md) | [Course Index](README.md) | [Next → 05 Processor Architecture & Pipelining](05_Processor_Architecture_Pipelining.md)

---

## The Stack of Abstractions

When you write `int x = a + b;` in Java, it becomes:
1. **Source code** → Compiler → 
2. **Bytecode** (JVM intermediate) → JIT Compiler →
3. **Machine code** (CPU instructions) →
4. **Microoperations** inside the CPU pipeline

Machine code is what the CPU actually executes. It's just bytes — sequences of numbers encoding operations and operands. **Assembly language** is a human-readable text representation of machine code: one assembly instruction = one machine instruction.

Understanding this layer reveals WHERE performance bottlenecks live, HOW security vulnerabilities like buffer overflows work, and WHY certain programming patterns are faster than others.

---

## The x86-64 Register File

The CPU has a small set of ultra-fast storage locations called **registers**. On x86-64, the general-purpose registers are:

| 64-bit | 32-bit | 16-bit | 8-bit (low) | Common use |
|--------|--------|--------|-------------|------------|
| `rax` | `eax` | `ax` | `al` | Return value, accumulator |
| `rbx` | `ebx` | `bx` | `bl` | Callee-saved |
| `rcx` | `ecx` | `cx` | `cl` | 4th argument, loop counter |
| `rdx` | `edx` | `dx` | `dl` | 3rd argument, I/O |
| `rsi` | `esi` | `si` | `sil` | 2nd argument, source index |
| `rdi` | `edi` | `di` | `dil` | 1st argument, dest index |
| `rsp` | `esp` | `sp` | `spl` | Stack pointer (top of stack) |
| `rbp` | `ebp` | `bp` | `bpl` | Frame pointer |
| `r8`–`r15` | `r8d`–`r15d` | `r8w`–`r15w` | `r8b`–`r15b` | Extra, args 5-8 |

**Why multiple names for the same register?** `rax`/`eax`/`ax`/`al` are all the SAME physical register — just different widths. Writing to `eax` (32-bit) zero-extends into `rax` (64-bit). Writing to `ax` (16-bit) leaves the upper 48 bits unchanged. Writing to `al` (8-bit) leaves the upper 56 bits unchanged.

```
rax: | 63 ............. 32 | 31 ............. 16 | 15 ..... 8 | 7 ..... 0 |
                                         eax covers 31-0
                                                         ax covers 15-0
                                                                    al: 7-0
```

---

## x86-64 Instruction Categories

### Data Movement

```asm
mov rax, 42          ; rax = 42  (immediate → register)
mov rax, rbx         ; rax = rbx (register → register)
mov rax, [rsp]       ; rax = memory[rsp] (load from memory)
mov [rsp], rax       ; memory[rsp] = rax (store to memory)
mov rax, [rbx + 8]   ; rax = memory[rbx + 8] (base + displacement)
mov rax, [rbx + rcx*4 + 16]  ; array element: base + index*scale + offset
```

Square brackets `[...]` mean "the memory address containing...". Without brackets: the value. With brackets: dereference (like `*ptr` in C).

### Arithmetic

```asm
add rax, rbx    ; rax = rax + rbx
sub rax, 5      ; rax = rax - 5
imul rax, rbx   ; rax = rax * rbx (signed multiply, result in rax)
idiv rbx        ; rax = rdx:rax / rbx, rdx = remainder
neg rax         ; rax = -rax
inc rax         ; rax = rax + 1
dec rax         ; rax = rax - 1
```

### Bitwise

```asm
and rax, rbx    ; rax = rax & rbx
or  rax, rbx    ; rax = rax | rbx
xor rax, rax    ; rax = 0  (fastest way to zero a register)
not rax         ; rax = ~rax
shl rax, 2      ; rax = rax << 2
shr rax, 2      ; rax = rax >> 2  (logical, fills with 0)
sar rax, 2      ; rax = rax >> 2  (arithmetic, sign-extends)
```

### Comparison and Jumps

```asm
cmp rax, rbx    ; compute rax - rbx, set flags (ZF, SF, OF, CF)
test rax, rax   ; compute rax & rax, set flags (efficient: checks if rax == 0)

; Unconditional jump
jmp label

; Conditional jumps (read flags after cmp/test)
je label        ; jump if equal (ZF=1)
jne label       ; jump if not equal (ZF=0)
jl label        ; jump if less (signed, SF≠OF)
jg label        ; jump if greater (signed)
jle label       ; jump if ≤ (signed)
jb label        ; jump if below (unsigned, CF=1)
ja label        ; jump if above (unsigned)
```

### Stack Operations

```asm
push rax        ; rsp -= 8; memory[rsp] = rax
pop  rax        ; rax = memory[rsp]; rsp += 8
call function   ; push rip+instruction_size; jmp function
ret             ; pop rip (return to caller)
```

---

## From C to Assembly: A Worked Translation

Let's trace a simple C function to assembly:

```c
int add(int a, int b) {
    return a + b;
}
```

On x86-64 Linux (System V AMD64 ABI):
- Arguments passed in: `rdi` (1st), `rsi` (2nd), `rdx` (3rd), `rcx` (4th)
- Return value: `rax`

```asm
add:
    ; rdi = a, rsi = b (set up by caller)
    mov eax, edi     ; eax = a  (use 32-bit: int is 32-bit)
    add eax, esi     ; eax = a + b
    ret              ; return eax (low 32 bits of rax)
```

A slightly more complex example — a loop:

```c
int sum(int* arr, int n) {
    int total = 0;
    for (int i = 0; i < n; i++) {
        total += arr[i];
    }
    return total;
}
```

```asm
sum:
    ; rdi = arr (pointer), esi = n
    xor eax, eax       ; total = 0  (faster than mov eax, 0)
    xor ecx, ecx       ; i = 0
    cmp esi, 0         ; if n == 0, skip loop
    je  .done

.loop:
    mov edx, [rdi + rcx*4]   ; edx = arr[i]  (int = 4 bytes)
    add eax, edx              ; total += arr[i]
    inc ecx                   ; i++
    cmp ecx, esi              ; i < n?
    jl  .loop                 ; if yes, repeat

.done:
    ret                        ; return total in eax
```

---

## The Call Stack

When a function is called, the CPU needs to:
1. Pass arguments
2. Remember where to return (the return address)
3. Save/restore registers the callee will overwrite
4. Allocate space for local variables

All of this lives on the **call stack** — a region of memory that grows downward (toward lower addresses) as functions are called.

```
Higher addresses
┌─────────────────────┐
│   main()'s frame    │  ← rbp (frame pointer at start of frame)
│   local vars        │
│   saved registers   │
│   return address    │
│─────────────────────│
│   sum()'s frame     │
│   local vars        │
│   saved registers   │
│   return address    │
│─────────────────────│
│    ...              │  ← rsp (stack pointer = top of stack)
└─────────────────────┘
Lower addresses
```

**Stack frame layout** (x86-64, System V ABI):

```asm
foo:
    push rbp           ; save caller's frame pointer
    mov  rbp, rsp      ; establish this frame's base
    sub  rsp, 32       ; allocate 32 bytes for local variables
    ; ... function body ...
    mov  rsp, rbp      ; restore stack pointer
    pop  rbp           ; restore caller's frame pointer
    ret
```

The space between `rbp` and the saved `rbp` is the **stack frame** for this function. Local variables live there. Arguments beyond the 6-register limit are passed on the stack above `rbp`.

---

## Buffer Overflow: When the Stack Gets Corrupted

Consider this C function:

```c
void vulnerable(char* input) {
    char buffer[16];
    strcpy(buffer, input);    // copies until '\0', no bounds check!
}
```

Stack layout before `strcpy`:
```
High addresses
┌──────────────┐
│ return addr  │  ← what we want to corrupt
│ saved rbp    │
│ buffer[15]   │
│ buffer[14]   │
│  ...         │
│ buffer[0]    │  ← rsp  (strcpy writes here first)
└──────────────┘
Low addresses
```

If `input` is 24 bytes, `strcpy` writes past `buffer[15]`, into the saved `rbp`, then into the **return address**. The attacker can overwrite the return address with the address of their own code. When `vulnerable` returns, it jumps to the attacker's code.

This is a **stack buffer overflow** — the most famous class of memory vulnerabilities. Defenses:
- **Stack canaries:** GCC places a random value (canary) between local vars and return address. Checks it before returning. Writing past `buffer` corrupts the canary → program aborts.
- **ASLR (Address Space Layout Randomization):** Randomizes where the stack is loaded, so attacker can't hardcode the target address.
- **NX bit (No-Execute):** Stack memory marked non-executable — even if attacker injects code, the CPU refuses to execute it.
- **Bounds-checked functions:** Use `strncpy(buffer, input, 16)`, `snprintf`, or safe languages.

---

## Reading Compiler Output

You can see the assembly your compiler produces:

```bash
# C → assembly (Linux/Mac)
gcc -O2 -S -masm=intel foo.c -o foo.s

# Inspect disassembly of compiled binary
objdump -d foo | less

# Or use Godbolt Compiler Explorer: https://godbolt.org
```

**Reading compiler output teaches you:**
- Whether your optimization is actually being optimized.
- Why two seemingly identical loops have different performance.
- How inlining, loop unrolling, and SIMD vectorization appear.

---

## Section Challenge

> ### Trace the Assembly
>
> Here is an x86-64 function in assembly (Intel syntax, 32-bit int arguments):
>
> ```asm
> mystery:
>     xor eax, eax          ; line 1
>     test edi, edi         ; line 2
>     jle .done             ; line 3
>     mov ecx, edi          ; line 4
> .loop:
>     xor edx, edx          ; line 5
>     test ecx, 1           ; line 6
>     sete dl               ; line 7
>     add eax, edx          ; line 8
>     shr ecx, 1            ; line 9
>     jnz .loop             ; line 10
> .done:
>     ret                   ; line 11
> ```
>
> The function is called with one `int` argument (in `edi`).
>
> **Q1:** Trace the execution for `mystery(12)`. What does `eax` hold after each loop iteration?
>
> **Q2:** What does `sete dl` do? (Hint: it sets `dl` to 1 if ZF=1 after the preceding instruction, else 0.)
>
> **Q3:** What does `mystery` compute? Express as a mathematical function.
>
> **Q4:** What does `test ecx, 1` test? Why is this more efficient than `cmp ecx, 0`?
>
> **Q5 (Stretch):** Rewrite `mystery` in C. What is the time complexity?

<details>
<summary>Full answers</summary>

```
Q1: Trace for mystery(12)

Initial: edi = 12 (argument)
Line 1: eax = 0
Line 2: test edi, edi → edi & edi = 12, non-zero → ZF=0, SF=0
Line 3: jle .done? NO (12 > 0)
Line 4: ecx = 12

LOOP ITERATION 1: ecx = 12 = 1100₂
  Line 5: edx = 0
  Line 6: test ecx, 1 → 1100 & 0001 = 0000 → ZF=1
  Line 7: sete dl → ZF=1 → dl = 1... wait: ZF=1 means result=0, sete sets to 1 if equal (ZF=1)?
          Actually: sete sets dl = 1 if ZF=1 (zero flag = the test gave 0).
          test 12, 1 = 0 → ZF=1 → dl = 1? 
          
          Hold on: test sets ZF if result is 0. 12 & 1 = 0 → ZF=1 → sete dl: dl=1.
          But wait — bit 0 of 12 (=1100₂) is 0. We're testing if bit 0 is 1.
          bit 0 = 0 → test = 0 → ZF = 1 → sete = 1.
          
          Hmm, that seems inverted. Let me reconsider: sete stands for "set if equal."
          "Equal" after test/cmp means ZF=1.
          test ecx, 1 = 0 means ecx's bit 0 IS 0 (even number). ZF=1 → sete dl = 1.
          
          Wait — "set if bit 0 is 0" gives 1? That means we're adding 1 when the bit is 0?
          Let me re-examine: actually this might be counting 0-bits, or maybe sete is setne.
          
          Let me re-read: "sete dl" = set if equal to 0 = set if ZF=1.
          test ecx, 1: ZF=1 iff bit 0 of ecx = 0 (even).
          So dl = 1 when ecx is EVEN.
          
          Actually, I think this might be setne (not equal), not sete. Let me re-examine
          assuming the problem means to count SET bits (popcount):
          If line 6-7 were: test ecx, 1 / setne dl → dl=1 when bit 0 IS set.
          
          With "sete" as written: we count when bit 0 is 0 (i.e., count ZERO bits).
          
          For 12 = 1100₂:
          bit positions (counting from low): bit0=0, bit1=0, bit2=1, bit3=1.
          Zero-bits count = 2. Let's verify.

  Line 8: eax = 0 + 1 = 1   (bit 0 of 12 is 0, sete gives 1)
  Line 9: shr ecx, 1 → ecx = 6 (12 >> 1)
  Line 10: 6 ≠ 0 → loop continues

ITERATION 2: ecx = 6 = 110₂
  edx = 0
  test 6, 1 = 0 → ZF=1 → dl = 1
  eax = 1 + 1 = 2
  shr ecx, 1 → ecx = 3
  3 ≠ 0 → loop

ITERATION 3: ecx = 3 = 11₂
  test 3, 1 = 1 → ZF=0 → dl = 0
  eax = 2 + 0 = 2
  shr ecx, 1 → ecx = 1

ITERATION 4: ecx = 1 = 1₂
  test 1, 1 = 1 → ZF=0 → dl = 0
  eax = 2 + 0 = 2
  shr ecx, 1 → ecx = 0
  0 = 0 → jnz NOT taken → exit loop

eax = 2. Return 2.

──────────────────────────────────────────────────────

Q2: sete dl

"sete" = "Set byte if Equal" = set the byte register to 1 if ZF=1, else 0.
After `test ecx, 1`, ZF=1 means the AND result was 0, meaning bit 0 of ecx is 0.
So: dl = 1 when ecx is even (bit 0 clear); dl = 0 when ecx is odd (bit 0 set).

──────────────────────────────────────────────────────

Q3: What mystery computes

12 = 1100₂. Zero-bits in binary representation: 2 (the two trailing 0s).
Our trace gave 2. ✓

mystery(n) = number of 0-bits in n's binary representation.

More precisely: number of 0-bits while shifting n right until it becomes 0.
This counts only the bits up to the most significant 1-bit.
(It does NOT count leading zeros of the full 32-bit int — it stops when ecx=0.)

mystery(12) = mystery(1100₂) = 2 zero-bits in 1100 (positions 0 and 1). ✓
mystery(7) = mystery(111₂) = 0 zero-bits. Result: 0.
mystery(8) = mystery(1000₂) = 3 zero-bits. Result: 3.

──────────────────────────────────────────────────────

Q4: test ecx, 1 vs cmp ecx, 0

cmp ecx, 0 computes (ecx - 0) and discards the result.
test ecx, 1 computes (ecx & 1) and discards the result.

Both set ZF. But:
- test is one byte shorter in encoding (no immediate 0 needed for the AND version).
- test is semantically clearer for bit checking.
- cmp with 0 can be replaced by test with itself (test eax, eax → checks if eax == 0).

Modern CPUs execute both in the same time, but test is preferred by convention
and is what compilers emit.

──────────────────────────────────────────────────────

Q5: C implementation

int mystery(int n) {
    if (n <= 0) return 0;    // jle .done
    int count = 0;
    while (n != 0) {         // jnz .loop
        if ((n & 1) == 0) {  // test n, 1 / sete
            count++;
        }
        n >>= 1;             // shr ecx, 1
    }
    return count;
}

// Equivalently:
int mystery(int n) {
    return n <= 0 ? 0 : __builtin_size_of_n - __builtin_popcount(n);
    // ... but this depends on total bit-width of representation
}

Time complexity: O(log n) — loops once per bit in n's binary representation.
For 32-bit int: always ≤ 32 iterations.
```

</details>

---

## Common Mistakes

**Mistake 1: Confusing `mov rax, rbx` (register copy) with `mov rax, [rbx]` (memory load)**
- Brackets = dereference = pointer access. No brackets = the register value itself.

**Mistake 2: Thinking assembly is always slower than high-level code**
- Compilers are excellent at optimizing. Hand-written assembly is often SLOWER than compiler output for regular code. Assembly is useful for SIMD intrinsics, specific hardware instructions, and hot paths where the compiler misses an optimization.

**Mistake 3: Forgetting function calling conventions**
- Which registers must be preserved across calls? (Callee-saved: rbx, rbp, r12-r15 on x86-64 Linux). Violating this corrupts the caller's data. Different OSes have different calling conventions (Windows uses rcx, rdx, r8, r9 for first four args, not rdi, rsi, rdx, rcx).

---

## Connections

- **Chapter 02 — Integers:** ALU operations (add, sub, imul) directly implement two's complement arithmetic and set the status flags.
- **Chapter 05 — Processor:** Each assembly instruction maps to microoperations that execute in the CPU pipeline. Instruction selection affects pipeline efficiency.
- **Chapter 06 — Memory:** `mov rax, [rbx]` is a memory LOAD — potentially slow (100+ cycles if cache miss). Understanding this is key to writing cache-friendly code.
- **Chapter 08 — Processes:** System calls are made via `syscall` instruction. The kernel is entered at privilege level 0; user code runs at level 3.

---

> [← 03 Floating-Point Numbers](03_Floating_Point_IEEE754.md) | [Course Index](README.md) | [Next → 05 Processor Architecture & Pipelining](05_Processor_Architecture_Pipelining.md)
