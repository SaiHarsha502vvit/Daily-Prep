> **Navigation**: [Fundamentals](00_DevOps_Fundamentals.md) | [Advanced](01_DevOps_Advanced.md) | [Networking & Security](02_Networking_Security.md) | [Service Mesh & Cloud Native](03_ServiceMesh_CloudNative.md)

# 🚀 DevOps — Complete Library Index

> Progressive mastery path from fundamentals through deep-dive networking, infrastructure, and production engineering.

---

## 🧭 Learning Path — First Principles to Advanced

Read in this order. Each stage only uses ideas from earlier stages, so nothing is a black box when you meet it. **Numbered chapters** (00–23) are the canonical home of each topic; the **internals series (I-chapters)** goes below the tool to the kernel/mechanism and is linked from the numbered chapter, never copied into it. Planned chapters are marked 🔜.

| Stage | You learn | Why it comes here | Read, in order |
| --- | --- | --- | --- |
| **0. Orientation** | What problem DevOps solves, the delivery pipeline, the vocabulary | You need the map before the territory | [00 Fundamentals](00_DevOps_Fundamentals.md) (skim; return to [01 Advanced](01_DevOps_Advanced.md) at Stage 8) |
| **1. The machine** | Processes, memory, files, scheduling, users, services | Every container, pipeline and pod is a Linux process | [I01 `ls`](internals/I01_What_Really_Happens_When_You_Type_ls.md) → I02 🔜 files/VFS → I03 🔜 virtual memory → I04 🔜 scheduling → [16 Linux Administration](16_Linux_Administration.md) → I09 🔜 systemd/boot |
| **2. The network** | Bits to packets to connections to names to HTTP to TLS | Everything distributed is a conversation over a network | [04](04_Networking_Complete.md) → [05 IP](05_IP_Addressing_Subnets.md) → [06 TCP/UDP](06_TCP_UDP_Deep_Dive.md) → [07 DNS](07_DNS_Complete.md) → [08 HTTP](08_HTTP_Complete.md) → [09 TLS](09_TLS_Encryption.md) → [10 Firewalls](10_Firewalls_Access_Control.md) → [14 SSH](14_SSH_Remote_Access.md) → [15 Debugging](15_Network_Debugging.md) → I07 🔜 kernel networking; [11 Load balancing](11_Load_Balancing_Proxies.md), [12 WiFi](12_WiFi_AP_Enterprise.md) (optional), [13 VPC](13_Cloud_Networking_VPC.md) after Stage 6 basics |
| **3. Isolation** | Namespaces, cgroups, images, runtimes, privilege | A container is a process with a restricted view, not a small VM | I05 🔜 container by hand → I06 🔜 runtimes and images → I08 🔜 security primitives → [17 Docker](17_Docker_Complete.md) |
| **4. Orchestration** | Declarative desired state, schedulers, controllers, service discovery | One machine's problems multiply across many machines | [18 Kubernetes](18_Kubernetes_Complete.md) → I11 🔜 Kubernetes internals → [03 Service mesh and cloud-native](03_ServiceMesh_CloudNative.md) |
| **5. Delivery** | Version control, build, test, release, rollback, supply chain | Shipping safely is a system, not a script | Git in [13 Developer Essentials](../13_Developer_Essentials/01_Git_Version_Control.md) → [19 CI/CD](19_CICD_Pipelines.md) → [Jenkins J01–J12](jenkins/README.md) 🔜 → [23 GitOps](23_GitOps_Deployments.md) → I12 🔜 supply chain |
| **6. Infrastructure and cloud** | Infrastructure as code, cloud primitives (identity, compute, storage), secrets and PKI, configuration management | Infrastructure you cannot recreate from text is a liability | [20 Terraform](20_Terraform_IaC.md) → I13 🔜 IaC + AWS on LocalStack → 24 🔜 cloud fundamentals → 25 🔜 secrets and PKI → 26 🔜 configuration management |
| **7. Operate** | Metrics, logs, traces, SLOs, incidents, capacity, backup and recovery | You cannot fix or promise what you cannot measure | [21 Monitoring](21_Monitoring_Observability.md) → I10 🔜 observing the kernel → [22 SRE](22_SRE_Practices.md) → I14 🔜 operating model → 27 🔜 backup, disaster recovery, capacity |
| **8. Secure** | DevSecOps, supply chain, policy as code, zero trust, compliance | Security added last is security that fails | [02 Networking and security](02_Networking_Security.md) → I08 🔜 → I12 🔜 → 31 🔜 DevSecOps, policy and compliance |
| **9. Architect** | Design an enterprise platform: accounts and landing zone, network topology, identity, microservice architecture on the platform, multi-region, cost, migration | A senior engineer is trusted with decisions, not commands | [28 Enterprise reference architecture](28_Enterprise_Reference_Architecture.md) → 29 🔜 microservices on the platform → 30 🔜 platform engineering → 33 🔜 FinOps and cost architecture → 34 🔜 migration and modernisation → [01 DevOps Advanced](01_DevOps_Advanced.md) |
| **10. Lead and prove it** | Org design, governance, decision records, on-call, game days, architecture defence | Systems are run by people; mastery is shown by building and defending | 35 🔜 organisation and operating model → capstones C1–C4 🔜 → SENIOR_READINESS 🔜 (the self-assessment and exam) |

**The goal is senior-level independence:** after the ten stages you should be able to design, build, secure, run and defend a whole enterprise platform — landing zone, networks, identity, Kubernetes, microservices, delivery, observability, DR and cost — on your own. The proof is the capstones (C1 one service end to end → C2 a microservices platform → C3 a multi-environment enterprise estate → C4 disaster recovery, game day, cost review and a written architecture defence) and the readiness rubric, not a count of chapters read. Versions and practices are checked against official sources at writing time and dated in each chapter.

**Every chapter ends with the same four things** so progress is checkable: a **Lab** with an expected result and a check command, **Challenges** (scenario questions with worked answers), a **Reality Check** (misconceptions corrected), and **Books** — where to read more (see [BOOKS.md](BOOKS.md)). The chapter spine is defined in [CONTEXT.md](CONTEXT.md).

**Canonical homes (no duplicate teaching).**

| Topic | Teach in | Deeper mechanism | Short pointer only in |
| --- | --- | --- | --- |
| Linux processes, files, memory | [16 Linux Administration](16_Linux_Administration.md) | I01–I04 | [13/02 Linux CLI](../13_Developer_Essentials/02_Linux_CLI_Shell.md) |
| Containers | [17 Docker](17_Docker_Complete.md) | I05, I06 | [13/03 Docker](../13_Developer_Essentials/03_Docker_Containers.md) |
| CI/CD | [19 CI/CD](19_CICD_Pipelines.md), Jenkins | I12 | [13/04 CI/CD](../13_Developer_Essentials/04_CICD_Pipelines.md) |
| Infrastructure as code | [20 Terraform](20_Terraform_IaC.md) | I13 | [13/16 IaC](../13_Developer_Essentials/16_IaC_Terraform.md) |
| Monitoring and observability | [21 Monitoring](21_Monitoring_Observability.md) | I10, I14 | [13/12 Monitoring](../13_Developer_Essentials/12_Monitoring_Observability.md) |
| Servers, ports, networking basics | [04](04_Networking_Complete.md)–[08](08_HTTP_Complete.md) | I07 | [13/17 Servers and ports](../13_Developer_Essentials/17_Servers_Ports_Networking.md) |

---

## 📚 Chapter Map

### Foundation Guides (Overview Level)

| #   | Chapter                                                      | Focus                                                                         |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 00  | [DevOps Fundamentals](00_DevOps_Fundamentals.md)             | History, Linux basics, Docker intro, K8s intro, CI/CD intro, Prometheus intro |
| 01  | [DevOps Advanced](01_DevOps_Advanced.md)                     | Terraform intro, Helm, GitOps overview, OpenTelemetry, Advanced pipelines     |
| 02  | [Networking & Security](02_Networking_Security.md)           | DNS→TCP→TLS→HTTP journey, DevSecOps pipelines, K8s NetworkPolicy              |
| 03  | [Service Mesh & Cloud Native](03_ServiceMesh_CloudNative.md) | Istio/Linkerd, Serverless, FinOps, Platform Engineering, CNCF                 |

### Deep-Dive: Networking (12 Chapters)

| #   | Chapter                                                      | What You'll Master                                                         |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 04  | [Networking Fundamentals](04_Networking_Complete.md)         | Physical layer (copper/fiber/WiFi), OSI/TCP-IP models, switches, VLANs     |
| 05  | [IP Addressing & Subnets](05_IP_Addressing_Subnets.md)       | Binary math, CIDR subnetting, NAT deep dive, ARP, IPv6, DHCP, BGP routing  |
| 06  | [TCP & UDP Deep Dive](06_TCP_UDP_Deep_Dive.md)               | Header anatomy, 3-way handshake, state machine, congestion control, QUIC   |
| 07  | [DNS Complete](07_DNS_Complete.md)                           | Resolution process, all record types, DNSSEC, DoH/DoT, Route53             |
| 08  | [HTTP Complete](08_HTTP_Complete.md)                         | HTTP/1.1→2→3, methods, status codes, headers, cURL mastery, REST design    |
| 09  | [TLS & Encryption](09_TLS_Encryption.md)                     | Symmetric/asymmetric crypto, Diffie-Hellman, TLS 1.3 handshake, PKI, mTLS  |
| 10  | [Firewalls & Access Control](10_Firewalls_Access_Control.md) | iptables/nftables, hardware firewalls, AWS SG vs NACL, OWASP Top 10        |
| 11  | [Load Balancing & Proxies](11_Load_Balancing_Proxies.md)     | L4/L7 LB, algorithms, production nginx config, CDN                         |
| 12  | [WiFi, APs & Enterprise](12_WiFi_AP_Enterprise.md)           | AP deployment, 802.1X RADIUS, enterprise WiFi, channel planning            |
| 13  | [Cloud Networking (VPC)](13_Cloud_Networking_VPC.md)         | AWS VPC architecture, Transit Gateway, PrivateLink, Terraform VPC          |
| 14  | [SSH & Remote Access](14_SSH_Remote_Access.md)               | Key management, SSH config, tunneling (local/remote/SOCKS), VPN, hardening |
| 15  | [Network Debugging](15_Network_Debugging.md)                 | Layer-by-layer methodology, tcpdump, Wireshark, nmap, K8s debugging        |

### Depth Series (in progress)

The chapters above teach *what to run*. These series teach *what the machine does*, *why the tool exists*, *what came before*, *the alternatives*, and *when to use it* — every command traced on a real kernel, every diagram explained.

| Series | Start here | State |
| --- | --- | --- |
| Linux & platform internals (I01–I14) | [internals/README.md](internals/README.md) | I01 written: [What Really Happens When You Type `ls`](internals/I01_What_Really_Happens_When_You_Type_ls.md) |
| Jenkins, first principles to operations (J01–J12) | [jenkins/README.md](jenkins/README.md) | Roadmap only — chapters planned |

### Deep-Dive: DevOps Core (8 Chapters)

| #   | Chapter                                                      | What You'll Master                                                           |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 16  | [Linux Administration](16_Linux_Administration.md)           | Filesystem, permissions, processes, systemd, shell scripting, performance    |
| 17  | [Docker Complete](17_Docker_Complete.md)                     | Namespaces/cgroups, image layers, multi-stage builds, Compose, networking    |
| 18  | [Kubernetes Complete](18_Kubernetes_Complete.md)             | Architecture, pods/deployments/services/ingress, HPA, probes, kubectl        |
| 19  | [CI/CD Pipelines](19_CICD_Pipelines.md)                      | GitHub Actions (6-stage pipeline), deployment strategies (canary/blue-green) |
| 20  | [Terraform & IaC](20_Terraform_IaC.md)                       | HCL, modules, state management, backend locking, best practices              |
| 21  | [Monitoring & Observability](21_Monitoring_Observability.md) | Prometheus, PromQL, structured logging, OpenTelemetry, alerting              |
| 22  | [SRE Practices](22_SRE_Practices.md)                         | SLIs/SLOs/SLAs, error budgets, incident management, chaos engineering        |
| 23  | [GitOps & Deployments](23_GitOps_Deployments.md)             | ArgoCD, Helm charts, Git as source of truth, complete GitOps workflow        |
| 28  | [Enterprise Reference Architecture](28_Enterprise_Reference_Architecture.md) | Accounts and OUs, guardrails (SCPs), SSO identity, CIDR plan, hub-and-spoke, account factory |

---

## 🔗 Cross-Reference Map — How DevOps Connects to Everything

```
DevOps is NOT an island — it's the GLUE of the entire tech stack.
Every domain in this library is deployed, monitored, and scaled via DevOps.
```

| DevOps Topic              | Cross-Referenced Guide                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Docker containers**     | [DS Internals](../02_Data_Structures/01g_DS_Internals.md) — Linux cgroups + namespaces                            |
| **Kubernetes networking** | [Networking & Security](02_Networking_Security.md) — kube-proxy, iptables                                         |
| **CI/CD for ML models**   | [MLOps Production](../25_Python_ML_DL_NLP/13_MLOps_Production.md) — model versioning                              |
| **Terraform modules**     | [Distributed Patterns](../10_Enterprise_Systems/09_Distributed_Patterns.md) — infra for Sagas                     |
| **Database in Docker**    | [SQL Transactions](../08_SQL/13_Transactions_ACID.md) — WAL with Docker volumes                                   |
| **SQL Query tuning**      | [SQL Internals](../08_SQL/49_SQL_Internals_Deep.md) — EXPLAIN ANALYZE, buffer tuning                              |
| **Async Python servers**  | [Asyncio Internals](../25_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md) — FastAPI + uvloop                    |
| **React deployment**      | [React Fundamentals](../15_React_Frontend/01_React_Fundamentals.md) — nginx container                             |
| **JavaScript V8 perf**    | [JS Modern](../16_JavaScript/06_JS_Modern_ES6Plus.md) — memory leaks → OOM in K8s                                 |
| **CSS CDN**               | [CSS Modern](../18_CSS_Complete/04_CSS_Modern_Architecture.md) — versioned assets via CDN                         |
| **Graph algorithms**      | [Algorithms in Production](../03_Algorithms/13_Algorithms_In_Production.md) — topological sort, Dijkstra routing  |
| **DS in production**      | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) — LRU, queue = broker                            |
| **Sliding window**        | [TCP/UDP](06_TCP_UDP_Deep_Dive.md) ↔ [Patterns](../04_Patterns_Templates/01_Sliding_Window.md)                    |
| **Binary math**           | [IP Addressing](05_IP_Addressing_Subnets.md) ↔ [Bit Manipulation](../03_Algorithms/06a_Greedy_BitManip.md)        |
| **Consistent hashing**    | [Load Balancing](11_Load_Balancing_Proxies.md) ↔ [DS in Production](../02_Data_Structures/05_DS_In_Production.md) |

---

> **Navigation**: [Back to Master Index](../00_MASTER_INDEX.md)
