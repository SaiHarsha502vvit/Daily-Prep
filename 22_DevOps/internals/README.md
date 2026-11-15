# DevOps Internals — How It Actually Works, Why It Exists, When To Use It

> **Navigation**: [← DevOps Index](../00_INDEX.md)

The chapters in the parent folder teach *what to run*. This series teaches *what the machine does when you run it*, *what problem the tool was invented to solve*, *what teams did before it existed*, *what the alternatives are*, and *when each is the right choice*. It is written for engineers who will own production systems, not just operate them.

Every chapter follows the same eight-part spine, so you always know where to look:

| # | Part | The question it answers |
| --- | --- | --- |
| 1 | **The world before** | What was painful or impossible, with a concrete failure story? |
| 2 | **How the solution emerged** | Who built what, in what order, with dates — including the dead ends |
| 3 | **The mechanism, at kernel / system level** | What actually happens, traced with real commands (`strace`, `/proc`, `ip`, …) and real output |
| 4 | **The alternatives** | How do the competing designs work, and what does each trade away? |
| 5 | **How it became the standard** | Why did *this* one win — technology, politics, timing, standards bodies? |
| 6 | **When to use it — and when not to** | Decision rules an architect can apply, with the cost of being wrong |
| 7 | **How it fails** | The failure modes you will meet at 3 a.m., and how to diagnose each |
| 8 | **Challenges and a Reality Check** | Scenario questions with worked answers; misconceptions corrected |

## Standards every chapter must meet

- **Derived, not asserted.** Each claim about the kernel or a tool is backed by a command you can run. Output shown in the chapter was produced on **Linux 6.6.87 (WSL2, Ubuntu 24.04)** unless stated otherwise, and says so.
- **History is cited.** Dates, authors and "first release" claims are checked against a primary source (RFC, kernel commit/changelog, project announcement, paper). Where the folklore is wrong, the chapter says so.
- **Alternatives are described fairly**, including the cases where the alternative is the better choice.
- **No version-fog.** Kernel / tool versions are named when behaviour depends on them (e.g. cgroup v1 vs v2, EEVDF vs CFS, iptables vs nftables).
- **Enterprise framing.** Each "when to use" part covers scale, security, compliance, cost and operability — not only "does it work".

## Chapter map

### Part A — Linux Internals (what the kernel does)

| Chapter | Covers |
| --- | --- |
| I01 — What Really Happens When You Type `ls` | fork/clone/execve, ELF and the dynamic loader, syscalls and the vDSO, wait/exit/signals, zombies and PID 1 |
| I02 — Files, the VFS and the Page Cache | inode/dentry/file/fd, the read and write paths, writeback and `fsync`, `mmap`, `epoll`/`io_uring`, why deleting a log doesn't free space |
| I03 — Virtual Memory | page tables, faults, copy-on-write, `mmap`, overcommit, the OOM killer, swap, why containers misread `/proc/meminfo` |
| I04 — Scheduling and CPU | CFS → EEVDF, priorities, load average, cgroup `cpu.max` throttling and Kubernetes CPU limits |
| I05 — Namespaces, cgroups, and a Container by Hand | `chroot` → jails → zones → LXC → Docker; build a container with `unshare` |
| I06 — Container Runtimes and Images | OCI spec, `runc`, containerd/CRI-O, overlayfs layers, registries; Podman, gVisor, Kata, Firecracker |
| I07 — Networking in the Kernel | socket → TCP → IP → netfilter → NIC, veth/bridge, conntrack, iptables → nftables → eBPF |
| I08 — Linux Security Primitives | capabilities, seccomp, LSMs (SELinux/AppArmor), user namespaces, rootless containers |
| I09 — systemd, Boot and Services | SysV → Upstart → systemd, units, cgroup integration, journald, the boot sequence |
| I10 — Observing the Kernel | `/proc`, `/sys`, `perf`, `strace`, eBPF/bpftrace, the USE method |

### Part B — Platform Engineering (how the industry built on it)

| Chapter | Covers |
| --- | --- |
| I11 — Kubernetes Internals | Borg → Kubernetes, etcd and Raft, API server and watches, controllers, scheduler, kubelet / CRI / CNI / CSI; Swarm, Nomad, ECS |
| I12 — CI/CD and the Software Supply Chain | Cron → CruiseControl → Jenkins → Travis → Actions; hermetic builds; SLSA, Sigstore, SBOMs |
| I13 — Infrastructure as Code and AWS with LocalStack | Config-management lineage, Terraform graph and state, CloudFormation, Pulumi; runnable AWS labs on LocalStack |
| I14 — Observability, SRE and the Enterprise Operating Model | Nagios → Prometheus → OpenTelemetry, Google SRE, release engineering, DR, compliance, FinOps |

Status of each chapter is tracked in the table at the bottom of this file.

## How to use these chapters

1. Read the **world before** and **how it emerged** parts first — the mechanism makes far more sense once you know what it was fighting.
2. **Run every command** in part 3 yourself (a WSL2 Ubuntu or any Linux VM is enough; no root is needed for most). Reading the trace is not the same as producing it.
3. Attempt each **Section Challenge** before opening the answer.
4. Use part 6 as a checklist in design reviews.

## Status

| Chapter | State |
| --- | --- |
| [I01 — What Really Happens When You Type `ls`](I01_What_Really_Happens_When_You_Type_ls.md) | ✅ Written — 8 diagrams, traced on Linux 6.6.87; kernel functions checked against the v6.6 source |
| [I02 — Files, the VFS and the Page Cache](I02_Files_The_VFS_And_The_Page_Cache.md) | ✅ Written — 10 diagrams, 13 challenge blocks, lab; verified on Linux 6.6.87 (WSL2); kernel names checked against the v6.6 files available; XFS, btrfs, NFS, writeback-stall and crash behaviour marked not verified here |
| I03–I14 | Planned — see commit history for what has landed |
