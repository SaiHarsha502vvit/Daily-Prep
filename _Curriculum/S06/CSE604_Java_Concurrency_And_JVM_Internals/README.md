# CSE604 — Java Concurrency & JVM Internals

**Estimated time:** ~20h  
**Prerequisite:** S03 (OOP & Design Patterns — needed for understanding inheritance vs composition in concurrent contexts)

## Description

Deep dive into the Java Virtual Machine and concurrent programming. Covers JVM architecture (class loading, memory model, GC algorithms, JIT compilation) and modern Java concurrency (ForkJoinPool, CompletableFuture, Structured Concurrency, virtual threads). Essential for building high-performance, memory-efficient Spring Boot applications.

## Learning Outcomes

1. Explain JVM architecture: class file format, class loader subsystem, runtime data areas
2. Diagnose memory issues: heap vs stack, metaspace, off-heap (DirectByteBuffer), native memory tracking
3. Compare GC algorithms: G1, ZGC, Shenandoah — trade-offs, tuning flags, ergonomic defaults
4. Implement concurrent patterns: ForkJoinPool, CompletableFuture, parallel streams
5. Use modern concurrency: Structured Concurrency (JEP 480), scoped values, virtual threads (Project Loom)

## Syllabus Outline

| Week | Topic                                                                            |
| ---- | -------------------------------------------------------------------------------- |
| 1    | JVM architecture: class file structure, class loaders (bootstrap, app, custom)   |
| 2    | Runtime data areas: heap, stack (frames, native stacks), metaspace, PC registers |
| 3    | Memory model: happens-before, synchronized, volatile, final field semantics      |
| 4    | Garbage collection: generational hypothesis, mark-sweep-compact, G1 tuning       |
| 5    | ZGC and Shenandoah: NUMA-aware, concurrent compaction, pause-time goals          |
| 6    | JIT compilation: interpreter vs JIT, tiered compilation,热点代码 profiling       |
| 7    | ForkJoinPool: work-stealing, recursiveTask, parallel stream internals            |
| 8    | CompletableFuture: composition, exception handling, thenApply vs thenCompose     |
| 9    | Virtual threads (Project Loom): carrier threads, pinning, structured concurrency |
| 10   | Structured Concurrency (JEP 480): scope, cancellation, error propagation         |
| 11   | Thread debugging: async-profiler, jstack, jmap, Java Flight Recorder             |
| 12   | Capstone: implement a high-performance concurrent data pipeline                  |

## Linked Existing Content

- [Modern Java (Concurrency chapters)](../../07_Modern_Java/) — Chapters 15–19, 22

## Assessment

- JVM diagnostic report: analyze a given heap dump and GC log
- Concurrency implementation: replace blocking I/O with virtual threads
- Performance comparison: G1 vs ZGC vs Shenandoah on a given workload
- 2-hour exam: memory model analysis, GC algorithm comparison, concurrent code review
