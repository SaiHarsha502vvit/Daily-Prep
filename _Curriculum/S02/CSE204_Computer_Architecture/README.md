# CSE204 — Computer Architecture

**Semester:** S02 | **Hours:** ~20h | **Prerequisite:** S01 (CSE104 Introduction to Computer Systems)

## Description

Computer Architecture explores the hardware-software interface: instruction set architectures (RISC vs CISC), datapath and control unit design, pipelining and hazards, memory hierarchy (cache, virtual memory, TLB), I/O subsystems, and performance measurement. The course builds a deep, quantitative understanding of where cycles go and how to write code that works with, not against, the hardware.

## Learning Outcomes

- Explain the fetch-decode-execute cycle and the role of registers, ALU, and control unit
- Write simple assembly programs for a RISC-style ISA
- Analyze pipelining speedup, identify hazards (structural, data, control), and explain forwarding
- Evaluate cache performance using hit rate, miss rate, and AMAT (average memory access time)
- Understand virtual memory, page tables, TLB, and how context switches affect performance
- Apply knowledge to write cache-friendly, performance-conscious code

## Syllabus Outline

- Instruction set architectures: RISC vs CISC, registers, addressing modes, instruction formats
- Datapath design: single-cycle vs multi-cycle implementation
- Pipelining: 5-stage pipeline, speedup analysis, pipeline registers
- Hazards: structural, data (RAW), control; forwarding, stalling, branch prediction
- Cache: direct-mapped, set-associative, fully associative; write policy, replacement policy
- Virtual memory: pages, page tables, TLB, page faults, segmentation
- I/O: polling, interrupts, DMA, bus architectures
- Performance: CPI, clock rate, Amdahl's law, benchmarks (SPEC, CoreMark)

## Content Status

**Shell — TBD** — populated in Phase 2/3.

## Linked Content

- [Developer Essentials — systems background](../../../13_Developer_Essentials/) (foundations)
- [Operating Systems — hardware abstraction layer](../../../00_CURRICULUM/) (Phase 3)
