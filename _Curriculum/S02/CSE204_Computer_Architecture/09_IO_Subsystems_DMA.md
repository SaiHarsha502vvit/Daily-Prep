# Chapter 09 — I/O Subsystems and DMA

> [← 08 Virtual Memory Quantitative](08_Virtual_Memory_Quantitative.md) | [Course Index](README.md) | [Next → 10 Performance Analysis](10_Performance_Analysis.md)

---

## The Problem: The CPU Should Not Play Doorbell

A disk read takes 10ms. A network packet arrives every 1μs under load. If the CPU checks ("polls") whether the disk is done or whether a packet has arrived — it wastes 30 million cycles per disk check and burns all throughput on packet polling.

**The challenge:** How do I/O devices talk to the CPU without the CPU wasting time watching them?

Two mechanisms solve this:
1. **Interrupts:** The device signals the CPU when it's done.
2. **DMA:** The device transfers data to memory by itself, without involving the CPU at all.

These two ideas are the foundation of all modern I/O — from USB to NVMe SSDs to network cards.

---

## I/O Device Interface

Every I/O device exposes a small set of registers to the CPU:

```
Typical device register set:
  Status register:    Is the device busy? Ready? Error?
  Command register:   Tell the device what to do (read, write, seek)
  Data register:      Transfer data one word at a time
  Address register:   Which memory location / disk sector?
```

**Two mapping styles:**

**Memory-mapped I/O (MMIO):**
Device registers appear at specific physical memory addresses. `lw t0, 0xFF000000` reads the device status register. Same load/store instructions used for memory work for I/O.

**Port-mapped I/O (PMIO, x86 only):**
Separate I/O address space accessed via special instructions (`IN`/`OUT` on x86). Not used in RISC architectures.

**Modern systems use MMIO exclusively.** The PCIe bus maps device BARs (Base Address Registers) into physical memory. The OS sets up these mappings; device drivers access device registers via the BAR addresses.

---

## Polling (Programmed I/O)

**The simplest approach:** The CPU writes a command to the device, then repeatedly reads the status register until it says "done."

```c
// Write command: transfer 512 bytes from disk sector 42 to buffer
write_register(DISK_ADDR_REG, 42);
write_register(DISK_COUNT_REG, 1);
write_register(DISK_CMD_REG, CMD_READ);

// Busy-wait (poll)
while (read_register(DISK_STATUS_REG) & STATUS_BUSY) {
    // spin...
}

// Now read data word by word from data register
for (int i = 0; i < 128; i++) {  // 128 words × 4 bytes = 512 bytes
    buffer[i] = read_register(DISK_DATA_REG);
}
```

**Problem:** Disk read takes 10ms = 30 million cycles. CPU spins in the while loop for 30 million cycles doing NOTHING else. 100% CPU utilization, 0% useful work.

**When polling is acceptable:**
- Ultra-low-latency cases where the device responds in < 100ns (modern NVMe SSD command submission)
- Simple embedded systems with no multitasking
- Kernel spin-locks waiting for very short operations

**When polling is catastrophically wasteful:**
- Any I/O with latency > 1μs (virtually all I/O from rotating disks to slow USB peripherals)

---

## Interrupts: Let the Device Call You

**The interrupt mechanism:**

1. CPU writes command to device, then continues executing other instructions (don't wait!)
2. Device performs the operation autonomously
3. When done, device asserts an **interrupt line** (a hardware wire to the CPU's interrupt controller)
4. CPU finishes its current instruction, then jumps to the **Interrupt Service Routine (ISR)**
5. ISR handles the completion (e.g., copies data, wakes up waiting process)
6. CPU resumes where it left off

```
CPU timeline:
    Issue disk read
    |──────── execute other processes ──────────|── ISR ──|── resume ──
                                                     ↑
                                              Interrupt fires
                                              (disk done, 10ms later)
```

**The interrupt controller (APIC on x86, PLIC on RISC-V):**
Collects interrupts from multiple devices, priorities them, delivers them to the right CPU core.

```
Devices → Interrupt controller → CPU interrupt pins → pipeline
(NIC, USB, SSD, keyboard, timer, ...)
```

**Interrupt vector table:** Maps interrupt number to ISR address. On x86: first 1MB of physical memory (or IDTR register) holds the IDT (Interrupt Descriptor Table).

---

## Interrupt Overhead

**Cost of one interrupt:**
```
1. Finish current instruction                           ~5 cycles
2. Save processor state (PC, EFLAGS, GPRs)            ~50-100 cycles (to stack)
3. Load ISR address from interrupt vector table        ~10 cycles
4. Execute ISR (acknowledge device, copy data, etc.)   ~500-5000 cycles
5. Restore processor state                             ~50-100 cycles
6. Resume prior instruction stream                     ~10 cycles

Total overhead: ~600-5000 cycles per interrupt
```

**At 1 interrupt per microsecond** (1M interrupts/second, e.g., a fast network at 1M packets/second):
```
Interrupt overhead: 1M × 600 cycles = 600M cycles/second
At 3 GHz: 600M / 3G = 20% of CPU time just handling interrupts!
```

This is why high-throughput network drivers use **interrupt coalescing** (batch multiple packets per interrupt) and **NAPI (New API polling)**: at very high packet rates, the NIC switches to polling mode to avoid interrupt overhead.

---

## DMA: The CPU Doesn't Move the Data

Even with interrupts, the CPU still has to copy data between the device's register and memory:

```c
// After disk interrupt:
for (int i = 0; i < 128; i++) {
    buffer[i] = read_register(DISK_DATA_REG);  // CPU copies each word
}
```

For 512 bytes: 128 memory reads + 128 device register reads = 256 CPU operations. For a 4KB disk block: 1024 CPU operations. For 100MB/s throughput: the CPU spends 25M operations/second just moving data!

**DMA (Direct Memory Access):**

The DMA controller is a separate hardware engine that performs memory-to-memory and device-to-memory transfers WITHOUT CPU involvement.

```
DMA transfer setup (by CPU):
  write DMA_SOURCE = device_data_register_address
  write DMA_DESTINATION = buffer_physical_address
  write DMA_COUNT = 512  (bytes)
  write DMA_CONTROL = START

DMA engine takes over:
  → Reads from device's data register
  → Writes directly to physical memory at buffer_physical_address
  → CPU is free to do other work!

When transfer complete:
  → DMA controller fires an interrupt (ONE interrupt for the whole transfer)
  → CPU ISR: buffer is ready, wake up the process
```

**The key insight:** DMA moves data via the system bus WITHOUT touching the CPU's pipeline. The CPU sets it up, then returns to executing instructions. One interrupt at the end signals completion.

---

## PCIe: The Modern I/O Bus

**PCIe (Peripheral Component Interconnect Express):** The standard high-speed I/O bus in all modern systems since 2004 (replaced PCI and AGP).

**Architecture:**
- Point-to-point connections (not shared bus like old PCI)
- Each device has dedicated lanes (×1, ×4, ×8, ×16 lanes)
- Each lane = 2 pairs of wires (1 pair for TX, 1 for RX = full duplex)

**Bandwidth per generation:**

| Generation | Width | Bandwidth (per direction) | Example Device |
|------------|-------|--------------------------|----------------|
| PCIe 3.0 | ×16 | 16 GB/s | GPU, old NVMe SSD |
| PCIe 4.0 | ×16 | 32 GB/s | High-end GPU, NVMe Gen 4 |
| PCIe 5.0 | ×16 | 64 GB/s | AMD Zen 4, Intel Raptor Lake |
| PCIe 6.0 | ×16 | 128 GB/s | Emerging (2024+) |

**NVMe SSD vs SATA SSD:**
- SATA III: 600 MB/s maximum (1970s protocol over modern SATA connector)
- NVMe Gen 3 ×4: 3.5 GB/s (PCIe 3.0 ×4 = 4 lanes) → 5.8× faster
- NVMe Gen 4 ×4: 7 GB/s → 11.7× faster than SATA

---

## I/O Performance: Latency and Bandwidth

**Two metrics matter for I/O:**

**Latency:** Time from issuing a request to getting the result.
- SSD (NVMe): 50-100 μs
- SSD (SATA): 100-500 μs
- HDD: 5-15 ms (seek time dominates)
- DRAM: 60-100 ns
- PCIe round trip: ~1 μs

**Bandwidth:** Maximum sustained data transfer rate.
- PCIe 4.0 ×16: 32 GB/s
- NVMe Gen 4: 7 GB/s
- DRAM (DDR5-5600): 89.6 GB/s (total, dual-channel)

**The latency-bandwidth tradeoff for I/O:**
```
Small I/O (1KB): latency dominates — use NVMe (50μs) not HDD (10ms)
Large I/O (1GB): bandwidth dominates — use NVMe Gen 4 (7 GB/s)

For sequential file reads:
  HDD: 100-200 MB/s (bandwidth) but first-access latency 10ms
  NVMe: 5,000+ MB/s bandwidth, 50μs latency
  
HDD still competitive for: large sequential cold-read (archive), cheap bulk storage.
NVMe wins for: databases, OS, anything with random access.
```

---

## Interrupt vs Polling vs DMA: When to Use Which

| Mechanism | Best for | When NOT to use |
|-----------|----------|-----------------|
| Polling | < 1μs devices, NVMe queue submit | Slow devices (disk, network at moderate load) |
| Interrupts | Slow devices, moderate load | > 100K events/second (interrupt overhead dominates) |
| DMA | Any bulk data transfer > 4KB | Tiny transfers (DMA setup overhead > transfer cost) |
| Interrupt coalescing | High-speed networks, NVMe | Low-latency applications (adds latency) |

**Modern NVMe uses a hybrid:** Polling for the submission queue (CPU writes command, device picks it up), interrupt for completion (device notifies CPU when done). At very high IOPS (> 1M/s), even the interrupt is dropped and the driver polls the completion queue.

---

## Section Challenge

> ### I/O Bandwidth and Interrupt Analysis
>
> A server has: 3.0 GHz CPU, PCIe 3.0 ×4 NVMe SSD (3.5 GB/s), DMA controller, 1Gbps network card.
>
> **Q1:** Without DMA, the CPU copies 1MB of data from the SSD to memory. Each word is 8 bytes. How many load-from-device-register operations does the CPU perform? At 3 GHz with 1 cycle per load, how long does the transfer take? What fraction of CPU time does this occupy per second if you do 100 such transfers?
>
> **Q2:** With DMA transferring the same 1MB at SSD bandwidth (3.5 GB/s): how long does the transfer take? What does the CPU do during this time? How many interrupts does the CPU receive?
>
> **Q3:** A 1 Gbps network card receives packets of 1500 bytes (MTU). At maximum throughput, how many packets per second arrive? If each packet generates one interrupt with 1000-cycle overhead at 3 GHz, what fraction of CPU time is consumed by interrupt handling?
>
> **Q4:** To address Q3's overhead, the driver switches to interrupt coalescing: batch 8 packets per interrupt. How does this change interrupt frequency and CPU overhead? What is the trade-off?
>
> **Q5 (Stretch):** A database performs 500,000 random 4KB reads per second from an NVMe SSD (50μs latency per I/O). (a) What is the maximum possible IOPS (given latency and parallelism — the SSD has 8 independent queues each serving requests in parallel)? (b) If interrupt overhead is 600 cycles per I/O completion and the CPU runs at 3 GHz, what fraction of CPU time goes to interrupt handling? (c) At what IOPS threshold does switching from interrupt to polling completion queue become beneficial?

<details>
<summary>Full answers</summary>

```
Q1: CPU copy without DMA

Transfer size: 1MB = 1,048,576 bytes.
Word size: 8 bytes → 1,048,576 / 8 = 131,072 words = 131,072 device register reads.
Plus 131,072 memory writes = 262,144 total CPU operations.

At 3 GHz, 1 cycle per operation:
Time = 262,144 cycles / (3 × 10^9 cycles/s) = 87.4 μs per 1MB transfer.

Note: SSD bandwidth is 3.5 GB/s. Time to transfer 1MB via DMA: 1MB / 3.5GB = 286 μs.
CPU copy is FASTER than SSD bandwidth in this case — the bottleneck is SSD, not CPU copy time.
But at 3.5 GB/s, the CPU would need:
  3.5 GB/s / 8 bytes = 437.5M reads/second = 437.5M cycles/second = 14.6% of a 3 GHz CPU!

100 transfers per second × 87.4 μs = 8.74 ms/s = 0.874% of CPU time.
(At 100% SSD throughput this would be much higher.)

──────────────────────────────────────────────────────

Q2: DMA transfer

DMA transfer at 3.5 GB/s:
Time = 1MB / 3.5 GB/s = 1,048,576 / (3.5 × 10^9) ≈ 299 μs (≈ 300 μs).

During the transfer:
  CPU is completely free to execute other code.
  DMA controller moves data from SSD → PCIe → memory controller → DRAM.
  No CPU cycles consumed during the transfer itself.

Interrupts received: 1 interrupt (DMA completion interrupt when 1MB is transferred).
ISR overhead: ~600 cycles (about 0.2 μs at 3 GHz).

CPU cost per 1MB transfer: 600 cycles (ISR) + overhead for DMA setup (~100 cycles) = ~700 cycles.
Compare to CPU copy: 262,144 cycles — DMA is 374× more CPU-efficient per transfer!

──────────────────────────────────────────────────────

Q3: Network interrupt overhead

1 Gbps = 10^9 bits/second.
Packet size: 1500 bytes = 12,000 bits.
Packets per second = 10^9 / 12,000 = 83,333 packets/second.

Interrupt overhead per packet: 1000 cycles.
Total interrupt cycles/second: 83,333 × 1,000 = 83.3M cycles/second.
At 3 GHz: 83.3M / 3,000M = 2.78% of CPU time.

This seems manageable, but this assumes only 1 Gbps. With 10 Gbps or 25 Gbps:
  10 Gbps: 833,333 packets/s → 27.8% CPU time on interrupts alone!
  25 Gbps: 2,083,333 packets/s → 69.4% CPU time — effectively impossible!

This is why 10+ Gbps networking requires interrupt coalescing and DPDK (polling-based).

──────────────────────────────────────────────────────

Q4: Interrupt coalescing (8 packets per interrupt)

New interrupt rate: 83,333 / 8 = 10,416 interrupts/second.
Total interrupt cycles: 10,416 × 1,000 = 10.4M cycles/second.
CPU overhead: 10.4M / 3,000M = 0.35% — 8× reduction!

Trade-off:
  Pros: 8× less CPU overhead → CPU available for application code.
  Cons: Latency increases. The first packet in a batch waits for 7 more to arrive
        before an interrupt fires. At 83,333 packets/s: batch fills in ~96 μs.
        First packet in a batch experiences up to 96 μs extra latency!

For throughput-sensitive applications (bulk file transfer): coalescing is great.
For latency-sensitive applications (trading systems, real-time gaming): coalescing
is catastrophic (96 μs added latency is unacceptable — target latency might be 10 μs).

Modern NICs allow configuring coalescing parameters or per-flow settings.

──────────────────────────────────────────────────────

Q5: NVMe IOPS and interrupt threshold

(a) Maximum IOPS with 8 independent queues at 50μs latency:

Each queue can serve: 1 I/O per 50μs = 20,000 I/Os per second per queue.
8 queues: 8 × 20,000 = 160,000 IOPS maximum from latency alone.
(In practice, NVMe SSDs are advertised at 500K-1M IOPS — this comes from much lower
latency for cached/warm operations, not the 50μs cold latency we assumed.)

With 500,000 desired IOPS: 500,000 / 8 queues = 62,500 I/Os/queue/second.
Required latency: 1/62,500 = 16μs per I/O. Faster than our 50μs assumption.
At 50μs: maximum with 8 queues = 160,000 IOPS (can't reach 500K with this assumption).
Let's proceed with 160,000 IOPS as the realistic maximum.

(b) Interrupt overhead at 160,000 IOPS:
Interrupts per second: 160,000.
Cycles per second: 160,000 × 600 = 96M cycles/second.
CPU fraction: 96M / 3,000M = 3.2%.

At 500,000 IOPS (if achievable): 500,000 × 600 / 3,000M = 10% CPU time.
At 1,000,000 IOPS: 1M × 600 / 3B = 20% CPU time — significant!

(c) Threshold where polling beats interrupts:

Polling cost: continuously reading the completion queue ring buffer.
  At 1 completion/cycle (optimistic), CPU reads ~1 cache line per completion check.
  At 1B checks/second: each check = ~1 cycle.

If there are always completions available (high IOPS): polling is ~1 cycle per completion.
Interrupt: 600 cycles per completion.
Polling wins when: IOPS × 1 cycle/completion < IOPS × 600 cycles = always for high IOPS!

But when IOPS is LOW:
  Polling at 100 IOPS: CPU does 3B checks/second for 100 completions = 30M wasted cycles/completion.
  Interrupts at 100 IOPS: 100 × 600 = 60K cycles/second = 0.002% CPU time.

Threshold: polling is better when IOPS is high enough that poll cycles per completion are lower.
Rough threshold: if completion rate > 1M/s (CPU spends every cycle checking), polling efficient.
At < 100K IOPS: interrupts are less wasteful.

Practical threshold: Linux NVMe driver switches to polling (io_uring with SQPOLL) when
queue depth > 64 outstanding I/Os, indicating high load. Below that, interrupts used.
```

</details>

---

## Common Misconceptions

**"Interrupts are always better than polling"**
At very high I/O rates (> 1M events/second), interrupt overhead (save/restore state, context switch) exceeds the actual work being done. NVMe at 1M IOPS and 10Gbps NICs both use polling mode for this reason. The right choice depends on event rate.

**"DMA is free"**
DMA uses memory bus bandwidth. When the DMA controller writes to DRAM, it competes with the CPU for the memory bus. A 3.5 GB/s DMA transfer consumes 3.5 GB/s of DRAM bandwidth — which may significantly slow down CPU memory accesses. DMA and CPU memory accesses are NOT fully independent.

**"PCIe is the bottleneck for NVMe SSDs"**
PCIe 3.0 ×4 bandwidth = 3.5 GB/s. Fast NVMe Gen 4 SSDs achieve 7 GB/s → require PCIe 4.0 ×4. But NAND flash latency (50-100μs) means the IOPS bottleneck is usually the flash controller, not the PCIe bus.

---

## Connections

- **CSE104 Ch12 — I/O Files and Unix Philosophy:** Covered the software I/O stack (VFS, page cache, file descriptors). This chapter covers the HARDWARE I/O stack: DMA, interrupt controllers, PCIe.
- **Chapter 10 — Performance Analysis:** I/O stalls add to CPI when the CPU is stalled waiting for I/O. Modern CPUs with DMA minimize this, but cache miss stalls from I/O-induced working set eviction remain.
- **Chapter 06 — Cache Design:** DMA bypasses the cache hierarchy (it writes directly to DRAM, not through the CPU's cache). After a DMA transfer, the CPU must invalidate or flush cache lines that overlap with the DMA region to avoid reading stale data.

---

> [← 08 Virtual Memory Quantitative](08_Virtual_Memory_Quantitative.md) | [Course Index](README.md) | [Next → 10 Performance Analysis](10_Performance_Analysis.md)
