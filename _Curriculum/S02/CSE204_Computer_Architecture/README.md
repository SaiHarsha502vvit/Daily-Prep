# CSE204 — Computer Architecture

**Semester:** S02 | **Hours:** ~20h | **Prerequisite:** S01 (CSE104 Computer Systems)

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

## Chapters

| # | Chapter |
|---|---------|
| [01](01_ISA_RISC_vs_CISC.md) | Instruction Set Architecture: RISC vs CISC |
| [02](02_Single_Cycle_Datapath.md) | Single-Cycle Datapath |
| [03](03_Pipelining.md) | Pipelining: Overlapping Execution |
| [04](04_Pipeline_Hazards.md) | Pipeline Hazards and Solutions |
| [05](05_Branch_Prediction.md) | Branch Prediction |
| [06](06_Cache_Design_AMAT.md) | Cache Design and AMAT |
| [07](07_Cache_Replacement_Write_Policies.md) | Cache Replacement and Write Policies |
| [08](08_Virtual_Memory_Quantitative.md) | Virtual Memory: Quantitative Analysis |
| [09](09_IO_Subsystems_DMA.md) | I/O Subsystems and DMA |
| [10](10_Performance_Analysis.md) | Performance Analysis: CPI, Amdahl's Law, and Benchmarking |

## Linked Content

- [Developer Essentials — systems background](../../../13_Developer_Essentials/) (foundations)
- [CSE401 Operating Systems — hardware abstraction layer](../../S04/CSE401_Operating_Systems/README.md)
