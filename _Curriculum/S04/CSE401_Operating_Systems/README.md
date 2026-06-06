# CSE401 — Operating Systems

## Description

Operating Systems is where software meets hardware. This course covers process management, memory management, file systems, I/O subsystems, concurrency, and system-level programming in C — giving you the deep understanding of how computers actually work that separates senior engineers from the rest.

> **Note:** OS labs will teach C programming on-the-go. No prior C required — you will learn by doing.

## Learning Outcomes

- Explain the OS role: kernel, user space, system calls, privilege levels, and context switching
- Design and implement concurrent programs using processes, threads, and synchronization primitives
- Analyze CPU scheduling algorithms (FCFS, SJF, RR, Priority, Multilevel Queue) with simulation
- Understand memory management: virtual memory, paging, segmentation, page replacement algorithms
- Implement synchronization primitives: mutexes, semaphores, condition variables, barriers
- Debug low-level system behavior using strace, gdb, valgrind, and kernel tracing tools

## Syllabus Outline

- **Unit 1:** OS Overview — History, kernel architectures, system calls, boot process
- **Unit 2:** Processes & Threads — PCB, process creation, scheduling, context switches
- **Unit 3:** Process Synchronization — Mutual exclusion, semaphores, monitors, deadlocks (Banker's algorithm)
- **Unit 4:** CPU Scheduling — Scheduling algorithms, real-time scheduling, multiprocessor scheduling
- **Unit 5:** Memory Management — Virtual memory, paging, TLB, page replacement (LRU, Clock, Working Set)
- **Unit 6:** File Systems — inode, ext2/ext4, VFS, journaling, FUSE
- **Unit 7:** I/O & Device Management — DMA, interrupts, device drivers, SSD/HDD characteristics

## Existing Content

> **TBD — Phase 3** — No existing content linked yet. This shell is scaffolded for Phase 3 content development.

## Subdirectories

- `lectures/` — Topic-by-topic lecture notes
- `labs/` — Hands-on OS labs in C (processes, threads, synchronization, memory)
- `assignments/` — Graded implementation and analysis tasks
- `projects/` — Capstone: implement a process scheduler or file system
- `rubrics/` — Grading criteria for all deliverables