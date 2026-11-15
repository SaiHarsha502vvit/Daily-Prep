> **Navigation**: [DevOps Index](00_INDEX.md) | [Folder context](CONTEXT.md)

# DevOps Reading Map — Which Book Chapter Goes With Which Lesson

> Verified on 2026-11-15. Every chapter number and title below was read from the book's own table of contents, the publisher or author page, or the official documentation page listed in [Sources checked](#sources-checked). Where a number could not be confirmed, the entry names the book and topic and is marked **(chapter not verified)**. Nothing here is copied from a book; each "what it adds" sentence is original wording.

---

## 1. How to use books with this curriculum

1. **Read our chapter first.** It gives you the mental model, the commands and the failure modes in one place.
2. **Then read the book chapter in the table.** A second author explains the same idea from a different angle, and the mismatch between the two explanations is where understanding sticks. Read only the named chapters, in the order listed, not the whole book.
3. **Then do the lab.** The lab proves you can use the idea; the book proves you can explain it. If the lab result surprises you, go back to the book chapter and look for the sentence that predicts the surprise.
4. **Free resources are linked in full.** Paid books are cited by title, authors, edition and chapter only.
5. **Chapter numbers differ between editions.** The edition is stated for every paid book; if you own a different edition, match by title.

**Legend.** FREE = readable online at the URL shown. PAID = buy or borrow. Section numbers such as 7.6 are the book's own.

---

## 2. Reading map by stage

Stage names and chapter order follow the Learning Path table in [00_INDEX.md](00_INDEX.md). Chapters marked 🔜 in the index (planned, not yet written) are included so the reading is ready when they land.

### Stage 0 — Orientation

| Our chapter | Book | Read | What it adds beyond our chapter |
| --- | --- | --- | --- |
| [00 Fundamentals](00_DevOps_Fundamentals.md) | *The Site Reliability Workbook* (FREE) — https://sre.google/workbook/table-of-contents/ | Ch 1 "How SRE Relates to DevOps" | A short argument from the SRE side for how reliability engineering and DevOps overlap and where they differ, which sharpens the vocabulary our chapter introduces. |
| 00 Fundamentals | *Site Reliability Engineering* (FREE) — https://sre.google/sre-book/table-of-contents/ | Ch 1 "Introduction", Ch 2 "The Production Environment at Google, from the Viewpoint of an SRE" | Shows what a large production fleet looks like end to end, so the pipeline in our chapter has a real-world shape behind it. |
| 00 Fundamentals | *Accelerate*, Forsgren, Humble, Kim (PAID, IT Revolution, 2018) | Part One, Ch 1 "Accelerate" and Ch 2 "Measuring Performance" | Gives the research evidence for which delivery metrics predict team and business performance, rather than asserting that DevOps works. |
| 00 Fundamentals | *Continuous Delivery*, Humble and Farley (PAID, Addison-Wesley, published 2010, copyright 2011) | Ch 1 "The Problem of Delivering Software" | Describes the pain of manual, infrequent releases in detail, which is the problem the whole curriculum is a response to. |
| 00 Fundamentals | *The Phoenix Project*, Kim, Behr, Spafford (PAID, IT Revolution, 5th Anniversary Edition, 2018) | Whole book (a novel; no chapter references needed) | A story that makes the cultural side of DevOps felt rather than listed; read it for motivation, not for technique. |

### Stage 1 — The machine

| Our chapter | Book | Read | What it adds beyond our chapter |
| --- | --- | --- | --- |
| [I01 What really happens when you type `ls`](internals/I01_What_Really_Happens_When_You_Type_ls.md) | *Operating Systems: Three Easy Pieces* (OSTEP, FREE) — https://pages.cs.wisc.edu/~remzi/OSTEP/ | Ch 4 Processes → Ch 5 Process API → Ch 6 Direct Execution | Builds the process, fork/exec/wait and the user/kernel boundary from the ground up, so each step in our `ls` trace has a stated reason. |
| I01 | *The Linux Programming Interface* (TLPI), Kerrisk (PAID, No Starch, 2010) — https://man7.org/tlpi/ | Ch 3 System Programming Concepts, Ch 24 Process Creation, Ch 27 Program Execution, Ch 4 File I/O: The Universal I/O Model | The authoritative description of the Linux system calls you see in a trace, with the exact semantics and error cases. |
| I02 🔜 files / VFS | OSTEP (FREE) | Ch 39 Files and Directories → Ch 40 File System Implementation → Ch 42 FSCK and Journaling | Explains inodes, directories, allocation and crash consistency as design problems, which is the reasoning behind the Linux file layer. |
| I02 | TLPI (PAID) | Ch 14 File Systems, Ch 18 Directories and Links, Ch 15 File Attributes | The Linux-specific behaviour of mounts, hard and symbolic links and file metadata. |
| I03 🔜 virtual memory | OSTEP (FREE) | Ch 13 Address Spaces → Ch 15 Address Translation → Ch 18 Introduction to Paging → Ch 19 Translation Lookaside Buffers → Ch 20 Advanced Page Tables → Ch 21 Swapping: Mechanisms → Ch 22 Swapping: Policies → Ch 23 Complete VM Systems | A step-by-step derivation of why paging exists, what the TLB saves and when swapping hurts; the last chapter walks through two real systems. |
| I03 | TLPI (PAID) | Ch 7 Memory Allocation, Ch 49 Memory Mappings, Ch 50 Virtual Memory Operations | What `malloc`, `mmap` and `mprotect` do on Linux, which is the user-facing side of the machinery OSTEP derives. |
| I03 | Linux kernel docs (FREE) — https://docs.kernel.org/admin-guide/index.html | "Memory Management" under the Admin Guide | The kernel's own administrator-level description of tunables and behaviour for memory. |
| I04 🔜 scheduling | OSTEP (FREE) | Ch 7 CPU Scheduling → Ch 8 Multi-level Feedback → Ch 9 Lottery Scheduling → Ch 10 Multi-CPU Scheduling | Compares scheduling policies by the metric each one optimises, so you can see what a Linux scheduler is trading off. |
| I04 | TLPI (PAID) | Ch 35 Process Priorities and Scheduling | How `nice` values, real-time policies and CPU affinity are exposed to programs. |
| [16 Linux Administration](16_Linux_Administration.md) | TLPI (PAID) | Ch 8 Users and Groups, Ch 9 Process Credentials, Ch 17 Access Control Lists, Ch 37 Daemons | The programming-level truth behind permissions, setuid, ACLs and what makes a process a daemon. |
| 16 | *Systems Performance*, 2nd ed., Brendan Gregg (PAID, Addison-Wesley, 2020) | Ch 2 Methodology, Ch 3 Operating Systems, Ch 4 Observability Tools, Ch 6 CPUs, Ch 7 Memory | A method for finding a bottleneck before you reach for a tool, then a tour of the OS facts those tools report on. |
| 16 | Linux kernel docs (FREE) — https://docs.kernel.org/admin-guide/index.html | "Documentation for /proc/sys" (sysctl), "The kernel's command-line parameters" | The primary reference for the kernel tunables our performance section mentions. |
| I09 🔜 systemd / boot | TLPI (PAID) | Ch 37 Daemons | Covers the classic daemon-start conventions that systemd replaced. No verified systemd source is listed here; **(systemd manual chapter not verified)**. |

### Stage 2 — The network

| Our chapter | Book | Read | What it adds beyond our chapter |
| --- | --- | --- | --- |
| [04 Networking](04_Networking_Complete.md) | *TCP/IP Illustrated, Volume 1: The Protocols*, 2nd ed., Stevens and Fall (PAID, Addison-Wesley Professional, 2011) | Ch 1 Introduction, Ch 3 Link Layer | Layering and the link layer shown with real packet captures from the era's tools, which reinforces the model with evidence. |
| 04 | *Computer Networking: A Top-Down Approach*, Kurose and Ross (PAID, Pearson, 9th ed.) | Chapters on the Internet overview and the link layer **(chapter numbers not verified)** | A teaching-oriented view that starts from the application and works downward, a useful reversal of our bottom-up path. |
| [05 IP addressing](05_IP_Addressing_Subnets.md) | TCP/IP Illustrated Vol. 1, 2nd ed. (PAID) | Ch 2 The Internet Address Architecture, Ch 4 ARP, Ch 5 The Internet Protocol (IP), Ch 6 System Configuration: DHCP and Autoconfiguration, Ch 7 Firewalls and Network Address Translation (NAT), Ch 8 ICMPv4 and ICMPv6 | The packet-level detail behind addressing, resolving, forwarding, NAT and error reporting, with the header fields explained. |
| 05 | Beej's Guide to Network Programming (FREE) — https://beej.us/guide/bgnet/html/ | Ch 3 "IP Addresses, `struct`s, and Data Munging" (3.1 IP Addresses, versions 4 and 6; 3.2 Byte Order) | How addresses and byte order appear in actual C code. |
| [06 TCP and UDP](06_TCP_UDP_Deep_Dive.md) | RFC 9293 *Transmission Control Protocol (TCP)*, August 2022 (FREE) — https://www.rfc-editor.org/rfc/rfc9293 | Section 3 "Functional Specification" | The primary source for the state machine and segment handling; it replaces RFC 793 and several later fixes. |
| 06 | RFC 5681 *TCP Congestion Control*, September 2009 (FREE) — https://www.rfc-editor.org/rfc/rfc5681 | Section 3 "Congestion Control Algorithms" | The standard definition of slow start and congestion avoidance that our congestion section summarises. |
| 06 | TCP/IP Illustrated Vol. 1, 2nd ed. (PAID) | Ch 10 User Datagram Protocol (UDP) and IP Fragmentation, Ch 12 TCP: The Transmission Control Protocol (Preliminaries), Ch 13 TCP Connection Management, Ch 14 TCP Timeout and Retransmission, Ch 15 TCP Data Flow and Window Management, Ch 16 TCP Congestion Control, Ch 17 TCP Keepalive | Each TCP mechanism traced in captures, so you can match a retransmission or a zero window in Wireshark to the rule that caused it. |
| 06 | RFC 9000 *QUIC: A UDP-Based Multiplexed and Secure Transport*, May 2021 (FREE) — https://www.rfc-editor.org/rfc/rfc9000 | Whole RFC (sections not verified) | The primary source for the QUIC material in our chapter. |
| 06 | Beej's Guide (FREE) | Ch 2 "What is a socket?", Ch 5 "System Calls or Bust" (5.4 `connect()`, 5.5 `listen()`, 5.6 `accept()`, 5.7 `send()` and `recv()`) | Shows the handshake and data flow from the programmer's side: which call triggers which kernel action. |
| 06 | TLPI (PAID) | Ch 56 Sockets: Introduction, Ch 58 Sockets: Fundamentals of TCP/IP Networks, Ch 59 Sockets: Internet Domains, Ch 61 Sockets: Advanced Topics | Linux socket behaviour and TCP details as the API exposes them. |
| [07 DNS](07_DNS_Complete.md) | RFC 1034 *Domain Names - Concepts and Facilities*, November 1987 (FREE) — https://www.rfc-editor.org/rfc/rfc1034 | Sections on the domain name space and resource records, name servers, resolvers and the closing scenario **(section numbers not verified)** | The original design reasoning for the namespace tree, zones and resolvers. |
| 07 | RFC 1035 *Domain Names - Implementation and Specification*, November 1987 (FREE) — https://www.rfc-editor.org/rfc/rfc1035 | Sections on RR definitions, messages and master files **(section numbers not verified)** | The wire format of DNS messages and zone-file syntax, which our record-type tables abbreviate. |
| 07 | TCP/IP Illustrated Vol. 1, 2nd ed. (PAID) | Ch 11 Name Resolution and the Domain Name System (DNS) | DNS behaviour observed on the wire, including caching effects. |
| [08 HTTP](08_HTTP_Complete.md) | RFC 9110 *HTTP Semantics*, June 2022 (FREE) — https://www.rfc-editor.org/rfc/rfc9110 | Section 3 "Terminology and Core Concepts", Section 4 "Identifiers in HTTP", Section 5 "Fields", Section 6 "Message Abstraction" | The definitive meaning of methods, headers and messages, independent of protocol version. |
| 08 | RFC 9113 *HTTP/2*, June 2022 (FREE) — https://www.rfc-editor.org/rfc/rfc9113 | Whole RFC (sections not verified) | The primary source for framing, streams and multiplexing. |
| 08 | RFC 9114 *HTTP/3*, June 2022 (FREE) — https://www.rfc-editor.org/rfc/rfc9114 | Whole RFC (sections not verified) | The mapping of HTTP onto QUIC, the reason head-of-line blocking changes. |
| [09 TLS](09_TLS_Encryption.md) | RFC 8446 *The Transport Layer Security (TLS) Protocol Version 1.3*, August 2018 (FREE) — https://www.rfc-editor.org/rfc/rfc8446 | Section 2 "Protocol Overview" (2.1 Incorrect DHE Share, 2.2 Resumption and Pre-Shared Key (PSK), 2.3 0-RTT Data), Section 4 "Handshake Protocol" (4.1 Key Exchange Messages through 4.6 Post-Handshake Messages), Section 5 "Record Protocol", Section 8 "0-RTT and Anti-Replay" | The message-by-message handshake our diagram abstracts, plus the exact reasoning for the replay risk of early data. |
| 09 | TCP/IP Illustrated Vol. 1, 2nd ed. (PAID) | Ch 18 Security: EAP, IPsec, TLS, DNSSEC, and DKIM | One chapter relating TLS and DNSSEC to the rest of the stack; shorter than the RFC and easier to start from. |
| [10 Firewalls](10_Firewalls_Access_Control.md) | TCP/IP Illustrated Vol. 1, 2nd ed. (PAID) | Ch 7 Firewalls and Network Address Translation (NAT) | How filtering and translation interact, which is why rule order and state tracking matter. |
| 10 | *Building Secure & Reliable Systems* (FREE) — https://sre.google/books/ (full text and TOC: https://google.github.io/building-secure-and-reliable-systems/raw/toc.html) | Ch 5 "Design for Least Privilege", Ch 10 "Mitigating Denial-of-Service Attacks" | Treats access control and denial-of-service as design problems with trade-offs, not only as rules to write. |
| [11 Load balancing](11_Load_Balancing_Proxies.md) | *Site Reliability Engineering* (FREE) | Ch 19 "Load Balancing at the Frontend", Ch 20 "Load Balancing in the Datacenter", Ch 21 "Handling Overload" | The reasoning behind choosing a balancing method and what to do when demand exceeds capacity. |
| [12 WiFi](12_WiFi_AP_Enterprise.md) (optional) | TCP/IP Illustrated Vol. 1, 2nd ed. (PAID) | Ch 3 Link Layer (**coverage of 802.11 not verified**) | Link-layer background; for wireless specifically, see Kurose and Ross **(chapter not verified)**. |
| [13 Cloud networking (VPC)](13_Cloud_Networking_VPC.md) | No verified source | None | A vendor docs page (AWS VPC) was not fetched, so none is listed. Use Ch 5 and Ch 7 of TCP/IP Illustrated for the underlying routing and NAT ideas. |
| [14 SSH](14_SSH_Remote_Access.md) | TLPI (PAID) | Ch 62 Terminals, Ch 64 Pseudoterminals | Explains the pseudoterminal mechanism an SSH session relies on to behave like a local shell. |
| 14 | RFC 8446 (FREE) | Section 2 "Protocol Overview" | A good comparison point for key exchange, even though SSH uses its own protocol; no SSH RFC was fetched, so none is listed. |
| [15 Network debugging](15_Network_Debugging.md) | *Systems Performance*, 2nd ed. (PAID) | Ch 10 Network, Ch 13 perf | Method and tooling for locating where time or packets go, with the kernel's view of the network path. |
| 15 | TCP/IP Illustrated Vol. 1, 2nd ed. (PAID) | Ch 8 ICMPv4 and ICMPv6, Ch 14 TCP Timeout and Retransmission | Teaches how to read what you capture, tying each symptom to its protocol cause. |
| I07 🔜 kernel networking | TLPI (PAID) | Ch 58 Sockets: Fundamentals of TCP/IP Networks, Ch 59 Sockets: Internet Domains | The system-call boundary of the kernel's networking stack. |
| I07 | *Systems Performance*, 2nd ed. (PAID) | Ch 10 Network | How the Linux network stack is instrumented and where queues build up. |

### Stage 3 — Isolation

| Our chapter | Book | Read | What it adds beyond our chapter |
| --- | --- | --- | --- |
| I05 🔜 container by hand | `namespaces(7)` Linux manual page (FREE) — https://man7.org/linux/man-pages/man7/namespaces.7.html | "Namespace types", "The namespaces API", "The /proc/pid/ns/ directory", "Namespace lifetime" | The exact list of namespace types and the system calls that create or join them; use it to check every namespace claim in our lab. |
| I05 | Linux kernel docs, *Control Group v2* (FREE) — https://docs.kernel.org/admin-guide/cgroup-v2.html | "Basic Operations", "Resource Distribution Models" (Weights, Limits, Protections, Allocations), "Controllers" (CPU, Memory, IO, PID) | The kernel's own description of how limits and weights are expressed, including why memory limits behave differently from CPU limits. |
| I05 | TLPI (PAID) | Ch 36 Process Resources, Ch 39 Capabilities | The resource-limit and privilege primitives that sit beneath the container features. |
| I06 🔜 runtimes and images | *Docker Deep Dive*, Nigel Poulton (PAID; several editions — check the current one) | Chapters on images and containers **(chapter not verified)** | A practitioner's walk through images, layers and the engine's moving parts. |
| I06 | *Container Security*, Liz Rice (PAID, O'Reilly, first edition 2020; a second edition was reported late 2025) | Chapters on container images and on isolation **(chapter not verified)** | Explains how the Linux building blocks combine into a container and where isolation is thin. |
| I08 🔜 security primitives | TLPI (PAID) | Ch 38 Writing Secure Privileged Programs, Ch 39 Capabilities | The kernel privilege model, which determines what dropping capabilities really removes. |
| I08 | *Building Secure & Reliable Systems* (FREE) | Ch 5 "Design for Least Privilege", Ch 8 "Design for Resilience" | Applies least privilege as an architecture principle, beyond individual flags. |
| [17 Docker](17_Docker_Complete.md) | Docker Deep Dive (PAID) | **(chapter not verified)** | A second, hands-on explanation of images, networking and Compose. |
| 17 | *Systems Performance*, 2nd ed. (PAID) | Ch 11 Cloud Computing | Treats cloud computing as a performance topic; check its coverage of containers and resource limits before relying on it for that **(coverage not verified, only the chapter title was seen)**. |

### Stage 4 — Orchestration

| Our chapter | Book | Read | What it adds beyond our chapter |
| --- | --- | --- | --- |
| [18 Kubernetes](18_Kubernetes_Complete.md) | Kubernetes docs, Concepts (FREE) — https://kubernetes.io/docs/concepts/ | "Cluster Architecture" (Nodes; Communication between Nodes and the Control Plane; Controllers; Leases; Cloud Controller Manager; Kubernetes Self-Healing) → "Workloads" (Pods; Deployments; ReplicaSet; StatefulSets; DaemonSet; Jobs; CronJob) → "Services, Load Balancing, and Networking" (Service; Ingress; EndpointSlices; Network Policies; DNS for Services and Pods) | The maintained source of truth for object behaviour; use it to check version-specific details our chapter cannot keep current. |
| 18 | Kubernetes docs, Pod pages (FREE) — https://kubernetes.io/docs/concepts/workloads/ | "Pod Lifecycle", "Liveness, Readiness, and Startup Probes", "Disruptions", "Pod Quality of Service Classes"; "Horizontal Pod Autoscaling" under Autoscaling Workloads | The precise definitions of the states and signals our probes and HPA sections describe. |
| 18 | *Kubernetes in Action*, Marko Lukša (PAID, Manning; first edition 2017; Lukša and Conner, Second Edition listed) | Chapters on pods, deployments and services **(chapter not verified)** | A book-length derivation of how the objects relate, with worked examples. |
| I11 🔜 Kubernetes internals | Kubernetes docs (FREE) — https://kubernetes.io/docs/concepts/architecture/ | "Controllers", "Leases", "Communication between Nodes and the Control Plane" | The reconciliation-loop idea and the coordination primitive controllers use. |
| [03 Service mesh and cloud native](03_ServiceMesh_CloudNative.md) | Kubernetes docs (FREE) — https://kubernetes.io/docs/concepts/services-networking/ | "Gateway API", "Network Policies", "Topology Aware Routing" | The platform-level traffic features that a mesh builds on or replaces. No mesh vendor docs were fetched, so none are listed. |
| 03 | *Site Reliability Engineering* (FREE) | Ch 22 "Addressing Cascading Failures", Ch 21 "Handling Overload" | Why retries and load shedding determine whether a mesh helps or amplifies an outage. |
| 03 | *Release It!* 2nd ed., Michael Nygard (PAID, Pragmatic Bookshelf, 2018) | "Stability Antipatterns" and "Stability Patterns" in the part titled "Create Stability" (chapter numbers not shown by the publisher) | Names the patterns, such as timeouts and circuit breakers, that mesh features implement. |

### Stage 5 — Delivery

| Our chapter | Book | Read | What it adds beyond our chapter |
| --- | --- | --- | --- |
| Git in [13/01 Git](../13_Developer_Essentials/01_Git_Version_Control.md) | *Pro Git*, 2nd ed., Chacon and Straub (FREE) — https://git-scm.com/book/en/v2 | Ch 2 "Git Basics" → Ch 3 "Git Branching" (3.1 Branches in a Nutshell, 3.6 Rebasing) → Ch 7 "Git Tools" (7.1 Revision Selection, 7.6 Rewriting History, 7.7 Reset Demystified) → Ch 10 "Git Internals" (10.2 Git Objects, 10.3 Git References, 10.4 Packfiles) | Starts from the user's commands and ends with the object database, so the commands stop being incantations. |
| [19 CI/CD](19_CICD_Pipelines.md) | *Continuous Delivery*, Humble and Farley (PAID) | Ch 3 Continuous Integration → Ch 5 Anatomy of the Deployment Pipeline → Ch 6 Build and Deployment Scripting → Ch 7 Commit Testing Stage → Ch 8 Automated Acceptance Testing → Ch 10 Deploying and Releasing Applications | The origin of the pipeline model: what each stage is for and why a failing stage must stop the line. |
| 19 | *Site Reliability Engineering* (FREE) | Ch 8 "Release Engineering" | How a large organisation treats builds and releases as an engineering discipline. |
| 19 | *The Site Reliability Workbook* (FREE) | Ch 16 "Canarying Releases" | Practical detail on judging a canary, which our deployment-strategy section only outlines. |
| 19 | *Building Secure & Reliable Systems* (FREE) | Ch 14 "Deploying Code" | Adds integrity and provenance questions to the pipeline: who may deploy, and how you know what was deployed. |
| [Jenkins J01–J12](jenkins/README.md) 🔜 | Jenkins User Handbook (FREE) — https://www.jenkins.io/doc/book/ | "Installing Jenkins", "Using Jenkins", "Managing Jenkins", "Securing Jenkins", "Scaling Jenkins", "Troubleshooting Jenkins" | The official reference for configuration and operations. |
| Jenkins | Jenkins Pipeline docs (FREE) — https://www.jenkins.io/doc/book/pipeline/ | "Getting started with Pipeline", "Using a Jenkinsfile", "Pipeline Syntax", "Extending with Shared Libraries", "Pipeline Best Practices", "Scaling Pipelines" | The authoritative syntax and the maintainers' own guidance on pitfalls. |
| [23 GitOps](23_GitOps_Deployments.md) | *Continuous Delivery* (PAID) | Ch 14 Advanced Version Control, Ch 10 Deploying and Releasing Applications | The earlier, tool-neutral argument for keeping everything needed to release under version control. |
| 23 | *The Site Reliability Workbook* (FREE) | Ch 14 "Configuration Design and Best Practices", Ch 15 "Configuration Specifics" | Treats configuration as code with its own failure modes, the same concern GitOps addresses. |
| I12 🔜 supply chain | *Building Secure & Reliable Systems* (FREE) | Ch 12 "Writing Code", Ch 13 "Testing Code", Ch 14 "Deploying Code" | A lifecycle view of where tampering or mistakes can enter between a commit and production. |
| I12 | Pro Git (FREE) | 7.4 "Signing Your Work" | The mechanism behind signed commits and tags, one link in a provenance chain. |

### Stage 6 — Infrastructure and cloud

| Our chapter | Book | Read | What it adds beyond our chapter |
| --- | --- | --- | --- |
| [20 Terraform](20_Terraform_IaC.md) | *Terraform: Up & Running*, 3rd ed., Yevgeniy Brikman (PAID, 2022) | Ch 1 Why Terraform → Ch 2 Terraform Syntax → Ch 3 Terraform State → Ch 4 Terraform Modules → Ch 8 Production-Grade Terraform Code → Ch 9 How to Test Terraform Code → Ch 10 Using Terraform as a Team | A practitioner's view of state, module design and team workflow, covering the problems that appear after the first tutorial. |
| 20 | Terraform docs, State (FREE) — https://developer.hashicorp.com/terraform/language/state | "Purpose", "Manage state in remote backends", "Locking", "Workspaces", "Remote state" | The official definition of state behaviour; check here when a version changes semantics. |
| 20 | *Continuous Delivery* (PAID) | Ch 11 Managing Infrastructure and Environments | The reasoning for reproducible environments that predates Terraform. |
| I13 🔜 IaC and AWS on LocalStack | Terraform: Up & Running (PAID) | Ch 7 Working with Multiple Providers | How providers are configured and layered, relevant to pointing the same code at a local emulator. |
| 24 🔜 cloud fundamentals | No verified source | None | No IAM, compute or storage book or vendor page was fetched. Add one once the chapter is written. |
| 25 🔜 secrets | Terraform: Up & Running (PAID) | Ch 6 Managing Secrets with Terraform | Where secrets leak in IaC (state files, variables) and the standard mitigations. |
| 25 | *Building Secure & Reliable Systems* (FREE) | Ch 5 "Design for Least Privilege" | The access-design principles that determine who can read a secret. |
| 26 🔜 configuration management | *Continuous Delivery* (PAID) | Ch 2 Configuration Management | Defines the problem configuration management solves, independent of any tool. |
| 26 | *The Site Reliability Workbook* (FREE) | Ch 14, Ch 15 (as above) | Safer configuration rollout patterns. |

### Stage 7 — Operate

| Our chapter | Book | Read | What it adds beyond our chapter |
| --- | --- | --- | --- |
| [21 Monitoring](21_Monitoring_Observability.md) | *Site Reliability Engineering* (FREE) | Ch 6 "Monitoring Distributed Systems", Ch 10 "Practical Alerting" | Argues for what to measure and what deserves a page, which keeps alerting rules from multiplying without purpose. |
| 21 | *The Site Reliability Workbook* (FREE) | Ch 4 "Monitoring", Ch 5 "Alerting on SLOs" | Turns the earlier principles into concrete alert designs based on error budget burn. |
| 21 | Prometheus docs (FREE) — https://prometheus.io/docs/introduction/overview/ | Concepts: "Data model", "Metric types", "Jobs and instances"; Querying: "Basics", "Operators", "Functions"; Best practices: "Metric and label naming", "Histograms and summaries", "Alerting" | The tool's own definitions; the best-practices pages explain why a labelling or histogram choice becomes expensive later. |
| 21 | OpenTelemetry docs, Concepts (FREE) — https://opentelemetry.io/docs/concepts/ | "Observability primer", "Signals", "Context propagation", "Instrumentation", "Sampling" | The vendor-neutral vocabulary of traces, metrics and logs and how context travels between services. |
| 21 | *Observability Engineering*, Majors, Fong-Jones, Miranda (PAID, O'Reilly, first edition 2022) | Parts on observability fundamentals and on observability for teams **(chapter numbers not verified)** | Makes the case for high-cardinality event data and exploring unknown problems, a different stance from fixed dashboards. |
| 21 | *Systems Performance*, 2nd ed. (PAID) | Ch 2 Methodology, Ch 4 Observability Tools | Method for deciding which measurement to take first. |
| I10 🔜 observing the kernel | *Systems Performance*, 2nd ed. (PAID) | Ch 13 perf, Ch 14 Ftrace, Ch 15 BPF | Hands-on tracing tools with the reasoning for when each one fits. |
| I10 | Linux kernel docs (FREE) — https://docs.kernel.org/admin-guide/index.html | "Perf events and tool security", "Performance monitor support" | The kernel-side permissions and limits on profiling, relevant when tracing is denied in a container. |
| [22 SRE](22_SRE_Practices.md) | *Site Reliability Engineering* (FREE) | Ch 3 "Embracing Risk" → Ch 4 "Service Level Objectives" → Ch 5 "Eliminating Toil" → Ch 12 "Effective Troubleshooting" → Ch 13 "Emergency Response" → Ch 14 "Managing Incidents" → Ch 15 "Postmortem Culture: Learning from Failure" | The foundational argument that an availability target is a business decision with a cost, and the incident practices that follow from it. |
| 22 | *The Site Reliability Workbook* (FREE) | Ch 2 "Implementing SLOs", Ch 3 "SLO Engineering Case Studies", Ch 9 "Incident Response", Ch 10 "Postmortem Culture: Learning from Failure" | Worked examples that make the SLO and incident chapters usable on a real service. |
| 22 | *Release It!* 2nd ed. (PAID) | "Chaos Engineering" in the part titled "Solve Systemic Problems" (chapter number not shown) | The practice of injecting failure deliberately, with the reasoning for doing it safely. |
| I14 🔜 operating model | *Site Reliability Engineering* (FREE) | Ch 28 "Accelerating SREs to On-Call and Beyond", Ch 31 "Communication and Collaboration in SRE", Ch 32 "The Evolving SRE Engagement Model" | The organisational side: how teams onboard, hand off and decide where SRE engages. |
| I14 | *The Site Reliability Workbook* (FREE) | Ch 8 "On-Call", Ch 18 "SRE Engagement Model", Ch 20 "SRE Team Lifecycles", Ch 21 "Organizational Change Management in SRE" | Practical models for staffing and change. |
| 27 🔜 backup, disaster recovery, capacity | *Building Secure & Reliable Systems* (FREE) | Ch 9 "Design for Recovery", Ch 16 "Disaster Planning", Ch 18 "Recovery and Aftermath" | A thorough treatment of planning for loss before it happens, including restoration drills. |
| 27 | *Site Reliability Engineering* (FREE) | Ch 26 "Data Integrity: What You Read Is What You Wrote" | Why backups are only as good as your ability to restore and verify them. |
| 27 | *The Site Reliability Workbook* (FREE) | Ch 11 "Managing Load" | Capacity and load management as a design discipline. |
| 27 | *Designing Data-Intensive Applications*, Kleppmann (PAID, O'Reilly; copyright notice 2014–2019 on the author site) | Chapters on replication and on batch and stream processing **(chapter numbers not verified)** | Explains the trade-offs inside the storage systems you are backing up. |

### Stage 8 — Secure and scale the organisation

| Our chapter | Book | Read | What it adds beyond our chapter |
| --- | --- | --- | --- |
| [02 Networking and security](02_Networking_Security.md) | *Building Secure & Reliable Systems* (FREE) | Ch 2 "Understanding Adversaries", Ch 6 "Design for Understandability", Ch 7 "Design for a Changing Landscape" | A threat-driven way of thinking that lets you decide which pipeline or network control matters, instead of applying a checklist. |
| 02 | RFC 8446 and RFC 9110 (FREE) | See Stage 2 | Primary sources for the protocol journey summarised in this chapter. |
| [01 DevOps Advanced](01_DevOps_Advanced.md) | *Accelerate* (PAID) | Part One chapters on measuring performance **(later chapter numbers not verified)** | The measured link between delivery practices and outcomes behind the advanced-pipeline claims. |
| 01 | *Building Secure & Reliable Systems* (FREE) | Ch 20 "Understanding Roles and Responsibilities", Ch 21 "Building a Culture of Security and Reliability" | Ownership and culture as security controls. |
| [03 Service mesh, FinOps, platform engineering](03_ServiceMesh_CloudNative.md) | No verified source for FinOps or platform engineering | None | No FinOps or platform-engineering book was fetched, so none is listed. |

### Stage 9 — Capstones

| Our chapter | Book | Read | What it adds beyond our chapter |
| --- | --- | --- | --- |
| [22 Problem sets](22_PROBLEM_SETS.md) | *Site Reliability Engineering* (FREE) | Ch 27 "Reliable Product Launches at Scale", Appendix E "Launch Coordination Checklist" | A launch checklist to use as the template for a capstone readiness review. |
| Capstone design | *The Site Reliability Workbook* (FREE) | Ch 12 "Introducing Non-Abstract Large System Design", Ch 13 "Data Processing Pipelines" | A worked design process from requirements to capacity numbers, a model for writing your own design note. |
| Capstone operations | *Building Secure & Reliable Systems* (FREE) | Ch 17 "Crisis Management", Ch 18 "Recovery and Aftermath" | A guide for the incident drill that should close every capstone. |
| Capstone resilience | *Release It!* 2nd ed. (PAID) | "Design for Production" and "Deliver Your System" parts (chapter numbers not shown) | A checklist of production concerns to test your system against. |

---

## 3. The ten books to own first

Free titles are marked FREE. If you only read ten books for this curriculum, read these, in roughly this order.

| # | Book | Why first |
| --- | --- | --- |
| 1 | *Operating Systems: Three Easy Pieces*, Arpaci-Dusseau (FREE) — https://pages.cs.wisc.edu/~remzi/OSTEP/ | Every later topic sits on processes, memory and files, and this is the clearest free derivation of them. |
| 2 | *The Linux Programming Interface*, Kerrisk (PAID, No Starch, 2010) | The reference for what each Linux system call really does, which is what containers and tracing tools are built from. |
| 3 | *Computer Networking: A Top-Down Approach*, Kurose and Ross (PAID, Pearson, 9th ed.) | A well-paced route into networking; pair it with the RFCs linked in Stage 2 when you need the exact rule. |
| 4 | *Systems Performance*, 2nd ed., Gregg (PAID, Addison-Wesley, 2020) | Teaches a method for finding bottlenecks, and covers perf, Ftrace and BPF. |
| 5 | *Pro Git*, Chacon and Straub (FREE) — https://git-scm.com/book/en/v2 | Version control is the base of every delivery workflow, and the internals chapter removes the mystery. |
| 6 | *Site Reliability Engineering*, Google (FREE) — https://sre.google/sre-book/table-of-contents/ | The foundational text for SLOs, incidents and postmortems. |
| 7 | *The Site Reliability Workbook*, Google (FREE) — https://sre.google/workbook/table-of-contents/ | The practical companion that applies the first book's ideas to real services. |
| 8 | *Continuous Delivery*, Humble and Farley (PAID, Addison-Wesley) | The origin of the pipeline model that CI/CD tools implement. |
| 9 | *Kubernetes in Action*, Lukša (PAID, Manning) | A book-length treatment of the orchestration model; check the current edition. |
| 10 | *Terraform: Up & Running*, 3rd ed., Brikman (PAID, 2022) | The most direct route from "it works on my laptop" to code a team can safely apply. |

**Next after those ten.** *Building Secure & Reliable Systems* (FREE, https://sre.google/books/) for security design; *Designing Data-Intensive Applications*, Kleppmann (PAID) for storage and distribution trade-offs; *Accelerate* (PAID) for the evidence behind the practices; *Release It!* 2nd ed., Nygard (PAID) for production failure patterns; *TCP/IP Illustrated, Volume 1*, 2nd ed. (PAID) for packet-level networking; *Observability Engineering* (PAID) for the modern telemetry view. *The Phoenix Project* (PAID, a novel) is optional motivation.

---

## 4. A note on originality

The chapters in this repository explain ideas in original wording, derived from first principles and checked against commands run in the lab environment named in [CONTEXT.md](CONTEXT.md). Book content is **referenced, not reproduced**: this file names where to read and says in one sentence what each source adds, and it quotes no book text. If a chapter here and a book disagree, check the primary source (the RFC, the kernel documentation or the manual page) and then fix whichever of the two is wrong.

---

## Sources checked

Verified by fetching on 2026-11-15 (chapter numbers and titles as seen):

- OSTEP index — https://pages.cs.wisc.edu/~remzi/OSTEP/
- *Site Reliability Engineering* TOC — https://sre.google/sre-book/table-of-contents/
- *The Site Reliability Workbook* TOC — https://sre.google/workbook/table-of-contents/
- *Building Secure & Reliable Systems* TOC (authors Adkins, Beyer, Blankinship, Oprea, Lewandowski, Stubblefield per sre.google/books) — https://google.github.io/building-secure-and-reliable-systems/raw/toc.html
- *Pro Git* TOC — https://git-scm.com/book/en/v2
- Beej's Guide to Network Programming — https://beej.us/guide/bgnet/html/
- TLPI detailed TOC and author page — https://man7.org/tlpi/toc-detailed.html, https://man7.org/tlpi/
- *Systems Performance* 2nd ed. TOC — https://www.brendangregg.com/systems-performance-2nd-edition-book.html
- *Terraform: Up & Running* 3rd ed. TOC — https://www.terraformupandrunning.com/
- *Continuous Delivery* TOC — https://www.informit.com/store/continuous-delivery-reliable-software-releases-through-build-9780321601919
- *TCP/IP Illustrated, Volume 1*, 2nd ed. TOC — https://www.informit.com/store/tcp-ip-illustrated-volume-1-the-protocols-9780321336316
- *Release It!* 2nd ed. (titles only) — https://pragprog.com/titles/mnee2/release-it-second-edition/
- RFCs: 9293, 9110, 8446, 1034, 1035, 9113, 9114, 9000, 5681 at https://www.rfc-editor.org/rfc/rfcNNNN
- Linux kernel docs: https://docs.kernel.org/admin-guide/cgroup-v2.html and https://docs.kernel.org/admin-guide/index.html; manual page https://man7.org/linux/man-pages/man7/namespaces.7.html
- Kubernetes docs: https://kubernetes.io/docs/concepts/ and its architecture, workloads and services-networking sections
- Terraform state docs, Prometheus overview, OpenTelemetry concepts, Jenkins handbook and Pipeline section (URLs in the tables above)

Confirmed to exist only through publisher or search listings (no chapter numbers used unless stated): *Accelerate* (Part One Ch 1 and Ch 2 titles seen in a search-result listing of the publisher page), *Kubernetes in Action* (first edition 2017; a Second Edition by Lukša and Conner is listed by Manning), *Computer Networking: A Top-Down Approach* (9th ed., Pearson, 2025), *Designing Data-Intensive Applications*, *Observability Engineering*, *Container Security*, *Docker Deep Dive*, *The Phoenix Project*.
