> **Navigation**: [Fundamentals](00_DevOps_Fundamentals.md) | [Advanced](01_DevOps_Advanced.md) | [Networking & Security](02_Networking_Security.md) | [Service Mesh & Cloud Native](03_ServiceMesh_CloudNative.md)

# 🚀 DevOps — Complete Library Index

> Progressive mastery path from fundamentals through deep-dive networking, infrastructure, and production engineering.

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
