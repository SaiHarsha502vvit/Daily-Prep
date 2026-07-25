# CSE104 — Introduction to Computer Systems

> **Semester 1 · Course 4** | [← CSE103 Linear Algebra](../CSE103_Linear_Algebra/README.md) | [→ S02 Courses](../../S02/)

---

## What This Course Is

You write code in Python, Java, or TypeScript. But what does the computer actually DO with it? Where do bugs like integer overflow, segfaults, race conditions, and cache misses come from? Why does swapping two nested loops sometimes make code 10× faster?

This course answers those questions by peeling back every abstraction layer — from bits through transistors, logic gates, CPU pipelines, memory hierarchies, processes, and threads — until you understand what happens at the hardware level when your program runs.

**Inspired by:** CMU 15-213 (CS:APP), MIT 6.004 Computation Structures.

---

## Course Arc

```
Bits & Numbers → Machine Code → CPU → Memory → OS Abstractions → Concurrency
```

| Unit | Chapters | Topic |
|------|----------|-------|
| **Data** | 01-03 | How computers represent numbers, text, and real values |
| **Machine** | 04-05 | How instructions become computation; the CPU |
| **Memory** | 06-07 | Why memory hierarchy matters; caching and locality |
| **OS** | 08-10 | Processes, virtual memory, dynamic memory |
| **Concurrency** | 11-12 | Threads, race conditions, synchronization |

---

## Chapters

1. [Bits, Bytes & Data Representation](01_Bits_Bytes_Data_Representation.md)
2. [Integer Arithmetic & Two's Complement](02_Integer_Arithmetic_Twos_Complement.md)
3. [Floating-Point Numbers (IEEE 754)](03_Floating_Point_IEEE754.md)
4. [Machine Code & Assembly Basics](04_Machine_Code_Assembly.md)
5. [Processor Architecture & Pipelining](05_Processor_Architecture_Pipelining.md)
6. [Memory Hierarchy & Caching](06_Memory_Hierarchy_Caching.md)
7. [Linking, Loading & the Build Process](07_Linking_Loading_Build_Process.md)
8. [Processes & System Calls](08_Processes_System_Calls.md)
9. [Virtual Memory](09_Virtual_Memory.md)
10. [Dynamic Memory & the Heap](10_Dynamic_Memory_Heap.md)
11. [Threads & Synchronization](11_Threads_Synchronization.md)
12. [I/O, Files & the Unix Philosophy](12_IO_Files_Unix_Philosophy.md)

---

## Why This Matters for a Software Engineer

| System concept | Why it bites you |
|----------------|-----------------|
| Integer overflow | Silent data corruption; silent security bugs |
| Float imprecision | `0.1 + 0.2 ≠ 0.3` in every language |
| Cache misses | Same algorithm, 50× slower for poor memory access pattern |
| Virtual memory | Stack overflow, null pointer dereference, OOM kills |
| Race conditions | Non-deterministic bugs that vanish under debugger |
| Process isolation | Why your crashed service doesn't crash the kernel |

Understanding these from first principles makes you the engineer who can explain the unexplainable and fix what others can't.

---

> **Teaching standard:** derive-don't-state. Every mechanism is motivated by a real problem that forced its invention. Every concept gets a worked analogy, a traced example, and a Section Challenge with full solution.

---

## Linked Repo Content

The practical, tool-level companions to this course live in the main repo modules:

- [Git Version Control - Developer Essentials](../../../13_Developer_Essentials/01_Git_Version_Control.md)
- [Linux CLI and Shell - Developer Essentials](../../../13_Developer_Essentials/02_Linux_CLI_Shell.md)
- [Memory Foundations - Data Structures](../../../02_Data_Structures/01a_Memory_Foundations.md)
- [Concurrency Models and Coroutines - Developer Essentials](../../../13_Developer_Essentials/19_Concurrency_Models_Coroutines.md)

> Note: an earlier lightweight course shell (`CSE104_Introduction_To_Computer_Systems/`, README-only, a softer ~15h Linux/Git-flavoured design) was superseded by this full 12-chapter CS:APP-style build. The shell is preserved in `_archive/` for provenance.
