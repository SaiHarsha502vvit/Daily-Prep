# CSE603 — DevOps & CI/CD

## Semester 6 · Full-Stack Specialization (Backend Track)

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can write Dockerfiles that build in seconds and ship under 100MB, orchestrate stateful and stateless workloads in Kubernetes from raw manifests, build CI/CD pipelines that fail fast on regressions, and instrument the cluster with metrics, logs, and traces correlated end-to-end.
> **Capstone:** Take a Spring Boot microservice from "runs locally" to "deployed in production K8s with full observability, blue-green deployment, rollback, and CI/CD pipeline." Includes IaC for the cluster.

---

## Navigation

| Course                                                                                                                              | Description |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **[CSE601 — Spring Boot & Microservices](../CSE601_Spring_Boot_And_Microservices/README.md)** | S06 sibling — produces what we deploy |
| **[CSE602 — API Design & Testing](../CSE602_API_Design_And_Testing/README.md)**                                                     | S06 sibling — runs in our CI |
| **CSE603 — DevOps & CI/CD**                                                                                                         | This course |
| **[CSE604 — Java Concurrency & JVM Internals](../CSE604_Java_Concurrency_And_JVM_Internals/README.md)** | S06 sibling |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `22_DevOps/`                               | Primary source — every chapter cited below                     |
| `13_Developer_Essentials/`                 | Git, shell, networking fundamentals                            |
| `CSE401 Operating Systems`                 | Cgroups + namespaces underlie containers                       |
| `CSE402 Computer Networks`                 | TCP/IP, DNS, TLS underlying every CI/CD action                 |

---

## Prerequisites

- `CSE401 Operating Systems` — process model, namespaces, cgroups
- `CSE402 Computer Networks` — DNS, HTTP, TLS
- `CSE601 Spring Boot` — Unit 1-2 (something to deploy)
- Working dev environment with Docker Desktop or Linux

**Constraint:** This course is hands-on. Plan to spin up real clusters (kind/minikube + a free cloud tier). Reading about K8s without typing `kubectl` for 16 weeks produces nothing transferable.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Containerization (Weeks 1–3)

**Learning Outcomes:**

- Build minimal Docker images with multi-stage builds and distroless bases
- Reason about container isolation (namespaces, cgroups, capabilities)
- Choose bridge vs host vs overlay networking based on requirements

#### Week 1 — Docker Fundamentals

`22_DevOps/17_Docker_Complete.md` §1-3 — images vs containers, layered filesystem, image cache mechanics.

#### Week 2 — Multi-Stage Builds + Networking

`22_DevOps/17_Docker_Complete.md` §4-7 — multi-stage build, distroless, bridge vs host vs macvlan.

**Section Challenge** — see the multi-stage build size diagnosis already in [`22_DevOps/17_Docker_Complete.md`](../../../22_DevOps/17_Docker_Complete.md) Section Challenges.

#### Week 3 — Docker Compose for Local Dev

Building reproducible local environments; volume types; depends_on with health-check awareness.

---

### UNIT 2 — Kubernetes Core (Weeks 4–7)

**Learning Outcomes:**

- Translate a docker-compose stack to K8s manifests
- Understand the reconcile loop and its implications
- Use ConfigMaps + Secrets correctly (and recognize Secrets are base64, not encrypted)

#### Week 4 — Pods, Deployments, Services

`22_DevOps/18_Kubernetes_Complete.md` §1-3 — Pod lifecycle, Deployment vs ReplicaSet vs DaemonSet, Service types (ClusterIP/NodePort/LoadBalancer).

#### Week 5 — Networking + Ingress

`22_DevOps/18_Kubernetes_Complete.md` §4-5 — CNI overview, Service DNS, Ingress controllers.

#### Week 6 — Storage + StatefulSets

`22_DevOps/18_Kubernetes_Complete.md` §6 — PV/PVC, StorageClass, StatefulSet vs Deployment semantics.

#### Week 7 — ConfigMaps, Secrets, RBAC, NetworkPolicies

`22_DevOps/18_Kubernetes_Complete.md` §7-8 — config injection, RBAC roles + bindings, NetworkPolicy egress rules.

---

### UNIT 3 — CI/CD (Weeks 8–10)

#### Week 8 — Pipeline Fundamentals

`22_DevOps/19_CICD_Pipelines.md` §1-2 — pipeline anatomy, artifacts, cache, matrix builds, GitHub Actions syntax.

#### Week 9 — Advanced CI/CD

`22_DevOps/19_CICD_Pipelines.md` §3-4 — secret management, self-hosted runners, monorepo strategies.

#### Week 10 — Deployment Strategies

Blue-green, canary, rolling update; feature flags + decoupling deploy from release.

---

### UNIT 4 — Infrastructure as Code (Weeks 11–12)

#### Week 11 — Terraform

`22_DevOps/20_Terraform_IaC.md` §1-3 — HCL, providers, state management, remote backend, workspaces.

#### Week 12 — Drift Detection + GitOps Preview

`22_DevOps/20_Terraform_IaC.md` §4-5 + GitOps preview (Week 14).

---

### UNIT 5 — Observability (Weeks 13–14)

#### Week 13 — Metrics + Logs

`22_DevOps/21_Monitoring_Observability.md` §1-3 — Prometheus, Grafana dashboards, Loki for logs, structured logging.

#### Week 14 — Distributed Tracing

`22_DevOps/21_Monitoring_Observability.md` §4-5 — OpenTelemetry, Tempo/Jaeger, sampling strategies.

---

### UNIT 6 — GitOps (Week 15)

`22_DevOps/23_GitOps_Deployments.md` — ArgoCD, declarative deployments, drift reconciliation, secrets-in-GitOps (see existing Section Challenges).

---

### UNIT 7 — Capstone (Week 16)

End-to-end: take a Spring Boot service, write Dockerfile, K8s manifests, CI/CD pipeline (GitHub Actions), deploy to a real cluster (kind locally or free EKS/GKE tier), set up Prometheus + Grafana + Tempo, perform a blue-green deployment, demonstrate rollback.

---

## Problem Sets

Across `22_DevOps/*_PROBLEM_SETS.md` files where present.

## Exam Prep

- `22_DevOps/01_DevOps_Mindset.md` — frame
- `00_CURRICULUM/EXAM_BANK.md` — S06 DevOps section
