# Chapter 07 — Linking, Loading & the Build Process

> [← 06 Memory Hierarchy & Caching](06_Memory_Hierarchy_Caching.md) | [Course Index](README.md) | [Next → 08 Processes & System Calls](08_Processes_System_Calls.md)

---

## The Problem: Separate Compilation

You write a program in 50 source files. Each file uses functions defined in other files, in the C standard library, and in third-party libraries. Yet the final program is a single executable that can run.

How do the pieces get connected?

The answer is a multi-stage process: **Compile → Assemble → Link → Load**.

Understanding this process explains:
- Why "undefined reference" and "multiple definition" linker errors happen
- How shared libraries (.dll / .so) work and why they exist
- Why C programs can call printf without including the actual printf code
- How dynamic loading (`dlopen`) powers plugin systems and scripting engines
- Why some bugs only appear in release builds (link-time optimization)

---

## Stage 1: Preprocessing

The C preprocessor runs BEFORE the compiler. It's a text substitution engine.

```c
// hello.c — before preprocessing
#include <stdio.h>
#define PI 3.14159
#define MAX(a, b)  ((a) > (b) ? (a) : (b))

int main() {
    printf("PI = %f\n", PI);
    int x = MAX(3, 5);
}
```

After `cc -E hello.c` (preprocessing only):
```c
// <stdio.h> contents get pasted here (thousands of lines!)

int main() {
    printf("PI = %f\n", 3.14159);       // macro replaced
    int x = ((3) > (5) ? (3) : (5));   // MAX expanded inline
}
```

**Preprocessing rules:**
- `#include "file.h"` → paste file contents here (relative path)
- `#include <stdio.h>` → paste from system include directories
- `#define NAME value` → text substitution, no type checking
- `#define FUNC(a,b)` → "function-like" macro, always parenthesize args
- `#ifdef / #ifndef / #endif` → conditional compilation (target OS, debug flags)

**The danger:** `#define MAX(a, b) a > b ? a : b` (missing parens)
```c
int x = MAX(1+2, 3);
// expands to: 1+2 > 3 ? 1+2 : 3 — precedence wrong!
// correct:    ((1+2) > (3) ? (1+2) : (3))
```

---

## Stage 2: Compilation

The compiler (cc1 / clang) translates C source to assembly (`.s` file).

```bash
cc -S hello.c       # produces hello.s (assembly text)
cc -c hello.c       # produces hello.o (object file, binary)
```

**What the compiler does:**
1. Lexing + parsing → Abstract Syntax Tree (AST)
2. Semantic analysis (type checking, scoping)
3. Optimization (dead code elimination, constant folding, inlining)
4. Code generation → x86-64 assembly
5. Assembly → machine code bytes

**Optimization levels** (gcc/clang):
- `-O0`: No optimization. All variables live in memory. Easiest to debug.
- `-O1`: Basic: common subexpressions, dead code removed.
- `-O2`: Standard production. Most aggressive safe optimizations.
- `-O3`: Enables auto-vectorization (SIMD), loop unrolling. Can be slower if cache effects dominate.
- `-Os`: Optimize for binary SIZE (embedded systems).

**Key optimization: inlining**

```c
// Without inline:
int square(int x) { return x * x; }
int result = square(5);   // function call overhead: push frame, call, pop, return

// With inline (compiler decides, or forced with __attribute__((always_inline))):
int result = 5 * 5;       // call eliminated, body inserted at call site
```

LTO (Link-Time Optimization) performs inlining ACROSS compilation units — it defers some optimization until the link step when it sees all code together.

---

## Stage 3: Object Files (.o)

Each `.c` file compiles to one `.o` (object file) — a binary file containing:

```
ELF Object File (Executable and Linkable Format, on Linux)
┌─────────────────────────────────────────────────┐
│  ELF Header (file type, architecture, entry)    │
│  .text section: machine code for this file      │
│  .data section: initialized global variables    │
│  .bss section:  uninitialized globals (no bytes)│
│  .rodata:       read-only data (string literals)│
│  Symbol Table:  all defined/referenced symbols  │
│  Relocation Table: addresses to patch at link   │
└─────────────────────────────────────────────────┘
```

**Symbol table** — every name the file defines or uses:

```
Defined symbols (GLOBAL, can be used by other files):
  main          at .text offset 0x00
  square        at .text offset 0x20

Undefined symbols (used but not defined here):
  printf        ??? (the linker must find this)
  sqrt          ??? (from libm)
```

**Relocation entries** — placeholders for addresses the linker will fill:

```asm
; Code for: printf("hello\n")
mov  rdi, ???        ; address of "hello\n" in .rodata — UNKNOWN at compile time
call ???             ; address of printf — UNKNOWN at compile time

; Relocation entry added:
; At offset X in .text, patch with address of "hello\n"  (R_X86_64_PC32)
; At offset Y in .text, patch with address of printf     (R_X86_64_PLT32)
```

The relocation table is the linker's work queue.

---

## Stage 4: The Linker

The linker (`ld`, invoked via `gcc` or `cc`) takes multiple `.o` files + libraries and produces an executable.

### What the linker does:

**1. Symbol Resolution** — match undefined references to definitions:

```
hello.o:    defines main; needs printf, sqrt
libm.a:     defines sqrt
libc.a:     defines printf

Linker resolves: hello.o's "printf" → libc.a's "printf" definition
                 hello.o's "sqrt"   → libm.a's "sqrt" definition
```

**2. Section Merging** — combine sections from all `.o` files:

```
hello.o:.text + math.o:.text → executable:.text (single merged code section)
hello.o:.data + math.o:.data → executable:.data
```

**3. Relocation** — fill in all the ??? addresses now that final positions are known:

```
printf is at address 0x400520 in the final executable.
Linker patches the call instruction: call 0x400520
```

### Common Linker Errors

**Undefined reference:**
```
hello.o: undefined reference to 'sqrt'
```
Fix: add `-lm` flag (`-l` = link library, `m` = libm). Order matters: `-lm` must come AFTER the file that uses sqrt.

**Multiple definition:**
```
error: /usr/bin/ld: hello.o: multiple definition of 'counter'
```
Fix: In `.h` files, use `extern int counter;` (declaration). Define only once in one `.c` file.

**Why `extern`?** Because `.h` files get `#include`d into EVERY `.c` file. If you write `int counter = 0;` in a `.h` file and include it in 5 `.c` files, you get 5 object files each defining `counter`. The linker sees 5 conflicting definitions.

---

## Static Libraries (.a) vs Shared Libraries (.so / .dll)

### Static Libraries (.a on Linux, .lib on Windows)

A `.a` file is an **archive** — a collection of `.o` files, like a zip. The linker pulls out only the `.o` files that contain symbols you actually use.

```bash
ar rcs libmath.a  square.o  cube.o  power.o
gcc hello.c -L. -lmath        # link against libmath.a
```

**What happens:** The linker copies `square.o` (and any other needed `.o` files) directly into your executable. The `.a` file is no longer needed at runtime.

**Result:** Larger executable. Fully self-contained — no runtime dependencies.

### Shared Libraries (.so on Linux, .dll on Windows, .dylib on macOS)

```bash
gcc -shared -fPIC -o libmath.so  square.c  cube.c  power.c
gcc hello.c -L. -lmath            # link against libmath.so
```

**What happens:** The linker records a *reference* to `libmath.so` in the executable. The actual code for `square()` is NOT copied. Instead, a stub (PLT entry) is inserted.

**At runtime:** The dynamic linker (`ld.so` on Linux) loads `libmath.so` into the process's virtual address space and patches the PLT stubs.

**Result:** Smaller executable. Multiple programs can share ONE copy of the library in memory. Updates to `libmath.so` are picked up by all programs automatically (no recompile needed) — but can introduce "DLL hell" (breaking API changes).

### Position-Independent Code (PIC)

Shared libraries are compiled with `-fPIC` because they don't know what address they'll be loaded at. PIC code uses the Global Offset Table (GOT) — all global addresses are indirect, through a table patched by the dynamic linker.

```
Without PIC: call 0x7f4a2000   ← hardcoded, can't be loaded at different address
With PIC:    call *[GOT + 8]   ← GOT entry patched at load time to actual address
```

---

## Dynamic Loading: dlopen

Programs can load libraries at runtime, without linking:

```c
#include <dlfcn.h>

// Open libmath.so at runtime
void* handle = dlopen("./libmath.so", RTLD_LAZY);

// Get a pointer to the "square" function by NAME
typedef int (*square_fn)(int);
square_fn square = (square_fn) dlsym(handle, "square");

int result = square(5);   // called through function pointer!
dlclose(handle);
```

**What this enables:**
- Plugin systems: load `.so` files at runtime based on user configuration
- Python C extensions: `import numpy` triggers `dlopen("numpy.so")`
- Java Native Interface (JNI): `System.loadLibrary("native")` → `dlopen`
- Hot reloading: replace a `.so` file while the program runs (with care)

---

## The Executable File Layout

A linked executable (ELF on Linux) has a specific layout loaded into memory:

```
Virtual Memory Layout (typical 64-bit Linux process):
┌────────────────────────────────────┐ 0xFFFFFFFF...  (high addresses)
│          Kernel Space              │  ← OS kernel, not accessible to user
├────────────────────────────────────┤ 0x7FFF...
│           Stack                    │  ← grows DOWN, local variables, frames
│             ↓                      │
│                                    │
│             ↑                      │
│           Heap                     │  ← grows UP, malloc/new allocations
├────────────────────────────────────┤
│       Shared Libraries             │  ← libc.so, libm.so, etc. mapped here
├────────────────────────────────────┤
│           .bss                     │  ← uninitialized globals (zero-filled)
│           .data                    │  ← initialized globals
│           .rodata                  │  ← string literals, const data
│           .text                    │  ← executable code
└────────────────────────────────────┘ 0x400000 (typical base)
```

**Address Space Layout Randomization (ASLR):** The OS randomizes the base addresses of stack, heap, and shared libraries on each run to defeat buffer overflow exploits that need hardcoded addresses.

---

## Build Systems: Why They Exist

With 100 `.c` files, recompiling everything on every change wastes time. Build systems track:
1. Which source files changed
2. What depends on what (dependency graph)
3. Which `.o` files need recompilation
4. What order to run commands

### Make (traditional)

```makefile
# Makefile
hello: hello.o math.o
    gcc -o hello hello.o math.o -lm    # link rule

hello.o: hello.c hello.h
    gcc -c -O2 hello.c                  # compile rule

math.o: math.c math.h
    gcc -c -O2 math.c
```

`make` checks timestamps: if `hello.c` is newer than `hello.o`, recompile. Otherwise skip.

**Problems with Make:** Header dependency tracking is manual and error-prone. Make files become complex quickly.

### CMake, Bazel, Gradle, Maven

Modern build systems add:
- Automatic header dependency tracking
- Cross-platform builds (Windows/Linux/Mac)
- Dependency management (download and build third-party libraries)
- Incremental builds at scale (Bazel: content-addressable cache, distributed builds)

### Java's Build Process

Java follows the same conceptual pipeline:
```
.java → (javac) → .class (bytecode) → (JVM) → native code (JIT-compiled)
```

- `.class` file ≈ `.o` file (bytecode, symbol references unresolved)
- JVM class loading ≈ dynamic linker (resolves class references at runtime)
- JIT compiler ≈ final optimization stage (compiles hot bytecode to native)

```
jar file = Java equivalent of .a static library (archive of .class files)
module path / classpath = Java equivalent of library search path (-L)
```

---

## Section Challenge

> ### Link-Time Bug Hunt
>
> You're working on a C project with these files:
>
> **`config.h`**
> ```c
> #ifndef CONFIG_H
> #define CONFIG_H
> int MAX_CONNECTIONS = 100;   // ← defined in header!
> void reset_config();
> #endif
> ```
>
> **`server.c`**
> ```c
> #include "config.h"
> void start_server() { /* uses MAX_CONNECTIONS */ }
> ```
>
> **`worker.c`**
> ```c
> #include "config.h"
> void run_workers() { /* uses MAX_CONNECTIONS */ }
> ```
>
> **`main.c`**
> ```c
> #include "config.h"
> int main() { start_server(); run_workers(); }
> ```
>
> Compiled and linked with:
> ```bash
> gcc -c server.c -o server.o
> gcc -c worker.c -o worker.o
> gcc -c main.c   -o main.o
> gcc server.o worker.o main.o -o server
> ```
>
> **Q1:** What linker error do you get and why?
>
> **Q2:** The build system also links against `libworker.so` (a shared library). A new version of `libworker.so` is installed on the server. Without recompiling, will the server binary pick up the new version? Under what condition would it NOT?
>
> **Q3:** `reset_config()` is declared in `config.h` but never implemented anywhere. Will this cause an error at compile time or link time? What if `reset_config()` is declared but only CALLED in code that's `#ifdef DEBUG` and the build uses `-DDEBUG=0`?
>
> **Q4 (Stretch):** Fix `config.h` to eliminate the multiple-definition error while keeping `MAX_CONNECTIONS` accessible from all three `.c` files. Write the corrected `config.h` and ONE additional change needed in the `.c` files.

<details>
<summary>Full answers</summary>

```
Q1: The linker error

When config.h is #include'd into server.c, worker.c, and main.c,
the preprocessor pastes: int MAX_CONNECTIONS = 100; into each.

After compilation:
  server.o: defines MAX_CONNECTIONS (GLOBAL, initialized)
  worker.o: defines MAX_CONNECTIONS (GLOBAL, initialized)
  main.o:   defines MAX_CONNECTIONS (GLOBAL, initialized)

Linker error:
  /usr/bin/ld: worker.o: multiple definition of 'MAX_CONNECTIONS'
  server.o: first defined here
  /usr/bin/ld: main.o: multiple definition of 'MAX_CONNECTIONS'
  collect2: error: ld returned 1 exit status

Root cause: a DEFINITION (allocates storage) must appear exactly once.
A DECLARATION (tells the compiler the symbol exists elsewhere) can appear many times.

──────────────────────────────────────────────────────

Q2: Shared library update behavior

YES — if the new libworker.so:
  1. Has the SAME ABI (function signatures, struct layouts unchanged)
  2. Is in the same search path (same filename)
  
The server binary at startup hands control to the dynamic linker, which
finds and loads libworker.so at runtime. No recompilation needed.

Would NOT pick up new version if:
  - The binary was compiled with -static (static linking — library code copied in)
  - The new .so has a different SONAME (e.g., libworker.so.2 vs libworker.so.1)
    (SONAME is embedded in the .so and in the executable at link time)
  - The new .so has incompatible ABI changes (changed function signatures,
    different struct sizes) — the binary might load but crash with memory corruption
  - LD_LIBRARY_PATH or /etc/ld.so.conf points to a different directory

──────────────────────────────────────────────────────

Q3: Declaration without definition — compile time or link time?

Compile time: NO error.
  The compiler sees the declaration void reset_config(); and trusts it.
  It generates a "call reset_config" instruction and an undefined symbol
  entry in the object file's relocation table.
  
Link time: ERROR (if reset_config is actually called).
  undefined reference to 'reset_config'
  
If reset_config is only called inside #ifdef DEBUG and -DDEBUG=0:
  The preprocessor removes the #ifdef DEBUG block entirely.
  The compiler never generates a call to reset_config.
  No relocation entry. Linker never sees a reference.
  → NO error at all. The missing definition is invisible.

This is why conditional compilation can hide bugs: code that compiles
and links in debug builds may have different errors in release builds.

──────────────────────────────────────────────────────

Q4: Fix for multiple definition

config.h (corrected):
─────────────────────────────────────
#ifndef CONFIG_H
#define CONFIG_H

extern int MAX_CONNECTIONS;   // DECLARATION only — no storage allocation
                               // extern = "defined elsewhere, just know it exists"
void reset_config();

#endif
─────────────────────────────────────

Now add ONE definition in exactly ONE .c file (e.g., config.c):
─────────────────────────────────────
// config.c — new file
#include "config.h"

int MAX_CONNECTIONS = 100;    // DEFINITION — storage allocated exactly once

void reset_config() {
    MAX_CONNECTIONS = 100;
}
─────────────────────────────────────

Build:
  gcc -c config.c  -o config.o
  gcc -c server.c  -o server.o
  gcc -c worker.c  -o worker.o
  gcc -c main.c    -o main.o
  gcc config.o server.o worker.o main.o -o server

Result:
  config.o defines MAX_CONNECTIONS (once).
  server.o, worker.o, main.o each have an extern reference to MAX_CONNECTIONS.
  Linker resolves all three references to config.o's definition.
  No multiple-definition error.

Alternative (C99+): use a .h-only pattern with inline:
  static int MAX_CONNECTIONS = 100;  ← each .c gets its OWN copy, changes not shared
  (Only appropriate for true constants, not shared mutable state)
```

</details>

---

## Common Mistakes

**Mistake 1: Defining variables in header files**
- Any `int x = 0;` in a `.h` file included in multiple `.c` files creates multiple definitions. Use `extern int x;` in the header, define once in one `.c` file.

**Mistake 2: Linker flag order matters**
- `gcc hello.c -lm` works. `gcc -lm hello.c` fails with "undefined reference to sqrt". The linker processes left-to-right: libraries only resolve symbols that are ALREADY pending when they're processed.

**Mistake 3: Confusing static libraries and static linking**
- "Static library" (`.a`) ≠ "statically linked binary". You can link a static library into a dynamically-linked executable. `-static` forces ALL libraries to be static; linking against a `.a` does not.

**Mistake 4: Ignoring ABI stability**
- Changing a struct's field order, adding a virtual function to a C++ class, or changing a function signature in a shared library BREAKS all binaries linked against it — even if you don't recompile them. ABI compatibility is why shared library versioning (SONAME, semantic versioning) exists.

---

## Connections

- **Chapter 04 — Assembly:** The linker resolves symbolic addresses in the call instructions that the assembler left as ???. Assembly is the last step before object files.
- **Chapter 06 — Memory:** At load time, the OS maps `.text`, `.data`, `.bss`, heap, and stack into the virtual address space. The chapter 09 virtual memory discussion covers this in depth.
- **Chapter 08 — Processes:** `exec()` is the system call that loads an executable and triggers the dynamic linker. The process starts in the dynamic linker, which resolves symbols before calling `main()`.
- **Chapter 09 — Virtual Memory:** Shared libraries are memory-mapped files. The same physical pages of `libc.so` are shared (read-only) across all processes using it — this is why shared libraries save RAM.

---

> [← 06 Memory Hierarchy & Caching](06_Memory_Hierarchy_Caching.md) | [Course Index](README.md) | [Next → 08 Processes & System Calls](08_Processes_System_Calls.md)
