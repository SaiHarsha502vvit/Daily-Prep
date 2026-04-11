**Navigation**: [< Previous](Ch66_Event_Sourcing_CQRS.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch68_Distributed_Patterns.md)

# ☸️ Chapter 41 — Kubernetes Deep Dive: How Container Orchestration Actually Works

**"kubectl apply -f deployment.yaml — and within seconds, Kubernetes has scheduled your pods across nodes, pulled images, created containers, set up networking, attached storage, and started health checks. Understanding this machinery is the difference between deploying apps and debugging production outages at 3 AM."**

---

## Table of Contents

1. [The Big Picture — What Kubernetes Actually Solves](#1-the-big-picture--what-kubernetes-actually-solves)
2. [Architecture — Control Plane vs Worker Nodes](#2-architecture--control-plane-vs-worker-nodes)
3. [Pods — The Smallest Deployable Unit](#3-pods--the-smallest-deployable-unit)
4. [Deployments — How Rolling Updates Work](#4-deployments--how-rolling-updates-work)
5. [Services — How Networking Works Inside the Cluster](#5-services--how-networking-works-inside-the-cluster)
6. [Ingress — How External Traffic Reaches Your App](#6-ingress--how-external-traffic-reaches-your-app)
7. [ConfigMaps and Secrets — Configuration Management](#7-configmaps-and-secrets--configuration-management)
8. [StatefulSets — For Databases and Stateful Apps](#8-statefulsets--for-databases-and-stateful-apps)
9. [Resource Management — Requests, Limits, and QoS](#9-resource-management--requests-limits-and-qos)
10. [Health Checks — Liveness, Readiness, Startup Probes](#10-health-checks--liveness-readiness-startup-probes)
11. [How Scheduling Works — From YAML to Running Pod](#11-how-scheduling-works--from-yaml-to-running-pod)
12. [Common Production Patterns](#12-common-production-patterns)

---

## 1. The Big Picture — What Kubernetes Actually Solves

```
  WITHOUT KUBERNETES:
  ═══════════════════
  
  3 servers, 5 microservices. You manually:
  ❌ Decide which service runs where
  ❌ SSH into servers to deploy new versions
  ❌ Restart crashed services (if you notice!)
  ❌ Scale up manually when traffic increases
  ❌ Update one by one, hoping nothing breaks
  ❌ Configure networking between services manually
  ❌ Manage environment variables per server
  
  
  WITH KUBERNETES:
  ════════════════
  
  You DECLARE desired state: "Run 3 replicas of order-service, version 2.1"
  
  Kubernetes CONTINUOUSLY ensures reality matches desired state:
  ✅ Schedules pods onto healthy nodes with sufficient resources
  ✅ Restarts crashed containers automatically
  ✅ Scales up/down based on CPU/memory metrics
  ✅ Rolling updates: new version deployed with zero downtime
  ✅ Service discovery: services find each other by name
  ✅ Load balancing: traffic distributed across healthy pods
  ✅ Config management: environment variables, secrets, mounted files
  
  
  THE CORE PRINCIPLE: Declarative, not Imperative
  ════════════════════════════════════════════════
  
  Imperative (without K8s): "Start container X on server A"
  Declarative (with K8s):    "I want 3 instances of X running"
                              K8s figures out the HOW
```

---



🔬 **Section Challenge — 1. The Big Picture — What Kubernetes Actually Solves**

**Challenge 1 (Reasoning):** Your K8s pod is stuck in `CrashLoopBackOff`. How do you diagnose it step by step?
<details><summary>Answer</summary>

1) `kubectl describe pod <name>` — check Events section for reasons. 2) `kubectl logs <pod> --previous` — see logs from the CRASHED container (not the current restart). 3) Check: OOMKilled (out of memory → increase memory limit), exit code 1 (app error → check logs), exit code 137 (SIGKILL from OOM or liveness probe). 4) If liveness probe failing: disable temporarily to investigate live state. 5) Check startup probe vs liveness probe config — maybe app needs more init time.
</details>

**Challenge 2 (Design):** Explain the difference between a liveness probe and a readiness probe. What happens when each fails?
<details><summary>Answer</summary>

**Liveness**: is the pod healthy? Failure → K8s KILLS and restarts the pod. Use for: hung processes that are running but unresponsive. **Readiness**: is the pod ready to serve traffic? Failure → pod is REMOVED from Service endpoints (no traffic sent), but NOT restarted. Use for: app still initializing, temporarily overloaded, downstream dependency unavailable. Common mistake: using liveness for readiness scenarios → pod gets killed/restarted when it should just be temporarily excluded from load balancing.
</details>


## 2. Architecture — Control Plane vs Worker Nodes

```
  ┌─── CONTROL PLANE (Master) ─────────────────────────────────────────────┐
  │                                                                         │
  │  ┌── API Server (kube-apiserver) ──────────────────────────────────┐  │
  │  │ • Front door to the cluster (REST API)                          │  │
  │  │ • ALL communication goes through here                           │  │
  │  │ • kubectl → API Server → etcd                                   │  │
  │  │ • Authentication, Authorization, Admission Control              │  │
  │  └─────────────────────────────────────────────────────────────────┘  │
  │                                                                         │
  │  ┌── etcd ─────────────────────────────────────────────────────────┐  │
  │  │ • Distributed key-value store                                    │  │
  │  │ • SINGLE SOURCE OF TRUTH for cluster state                      │  │
  │  │ • Stores: all resource definitions, pod locations, configs      │  │
  │  │ • Uses Raft consensus for consistency                            │  │
  │  │ • If etcd dies, cluster is brain-dead                            │  │
  │  └─────────────────────────────────────────────────────────────────┘  │
  │                                                                         │
  │  ┌── Scheduler (kube-scheduler) ───────────────────────────────────┐  │
  │  │ • Watches for unscheduled pods                                   │  │
  │  │ • Decides which node to place each pod on                       │  │
  │  │ • Considers: resources, affinity, taints, topology              │  │
  │  └─────────────────────────────────────────────────────────────────┘  │
  │                                                                         │
  │  ┌── Controller Manager ───────────────────────────────────────────┐  │
  │  │ • Runs control loops that reconcile desired vs actual state     │  │
  │  │ • Deployment Controller: manages ReplicaSets                    │  │
  │  │ • ReplicaSet Controller: ensures right number of pods           │  │
  │  │ • Node Controller: monitors node health                          │  │
  │  │ • Job Controller: manages batch jobs                             │  │
  │  └─────────────────────────────────────────────────────────────────┘  │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘
  
  ┌─── WORKER NODE 1 ──────────────────────────────────────────────────────┐
  │                                                                         │
  │  ┌── kubelet ──────────────────────────────────────────────────────┐  │
  │  │ • Agent on every node                                            │  │
  │  │ • Talks to API Server: "What pods should I run?"                │  │
  │  │ • Talks to container runtime: "Start/stop this container"       │  │
  │  │ • Reports node status and pod health back to API Server         │  │
  │  └─────────────────────────────────────────────────────────────────┘  │
  │                                                                         │
  │  ┌── kube-proxy ───────────────────────────────────────────────────┐  │
  │  │ • Network proxy on every node                                    │  │
  │  │ • Maintains iptables/IPVS rules for Service routing             │  │
  │  │ • Enables: service-name → pod-IP load balancing                 │  │
  │  └─────────────────────────────────────────────────────────────────┘  │
  │                                                                         │
  │  ┌── Container Runtime (containerd) ───────────────────────────────┐  │
  │  │ • Actually runs the containers                                   │  │
  │  │ • Pulls images, manages container lifecycle                     │  │
  │  │ • containerd (default), CRI-O, Docker (deprecated as runtime)   │  │
  │  └─────────────────────────────────────────────────────────────────┘  │
  │                                                                         │
  │  ┌── Pods ─────────────────────────────────────────────────────────┐  │
  │  │  [order-svc-abc12]  [payment-svc-def34]  [user-svc-ghi56]     │  │
  │  └─────────────────────────────────────────────────────────────────┘  │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Pods — The Smallest Deployable Unit

```
  A Pod is NOT a container. A Pod CONTAINS one or more containers.
  
  
  SINGLE-CONTAINER POD (most common):
  ════════════════════════════════════
  
  ┌─── Pod: order-service-7d4f5b-abc12 ──────────────────────────────────┐
  │                                                                        │
  │  IP: 10.244.1.5 (unique pod IP within cluster)                        │
  │                                                                        │
  │  ┌── Container: order-service ─────────────────────────────────────┐ │
  │  │  Image: myregistry/order-service:2.1                             │ │
  │  │  Ports: 8080                                                     │ │
  │  │  Resources: 256Mi memory, 250m CPU                               │ │
  │  │  Environment: SPRING_PROFILES_ACTIVE=prod                        │ │
  │  └──────────────────────────────────────────────────────────────────┘ │
  │                                                                        │
  │  Volumes: [config-vol mounted at /config]                              │
  │                                                                        │
  └────────────────────────────────────────────────────────────────────────┘
  
  
  MULTI-CONTAINER POD (sidecar pattern):
  ══════════════════════════════════════
  
  ┌─── Pod ───────────────────────────────────────────────────────────────┐
  │                                                                        │
  │  IP: 10.244.1.6 (SHARED between all containers)                      │
  │                                                                        │
  │  ┌── Container: app ──────┐  ┌── Container: log-shipper ──────────┐ │
  │  │  Image: my-app:1.0      │  │  Image: fluentd:latest              │ │
  │  │  Writes to /var/log     │  │  Reads from /var/log               │ │
  │  └─────────────────────────┘  │  Ships to Elasticsearch             │ │
  │                                │                                     │ │
  │  Shared Volume: [log-vol]     └─────────────────────────────────────┘ │
  │  (mounted at /var/log in BOTH containers)                              │
  │                                                                        │
  │  Containers in same pod:                                               │
  │  • Share network namespace (localhost works between them!)            │
  │  • Share volumes (can read/write same files)                          │
  │  • Share IPC namespace                                                 │
  │  • Scheduled together on same node                                     │
  │  • Live and die together                                               │
  │                                                                        │
  └────────────────────────────────────────────────────────────────────────┘
  
  
  POD LIFECYCLE:
  
  Pending → Running → Succeeded/Failed
     │         │
     │         └── containers running + health checks passing
     │
     └── waiting for scheduling, image pull, or init containers
```

---

## 4. Deployments — How Rolling Updates Work

```yaml


🔬 **Section Challenge — 4. Deployments — How Rolling Updates Work**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3                    # I want 3 pods running
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                # Create 1 extra pod during update
      maxUnavailable: 0          # Never go below 3 healthy pods
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: myregistry/order-service:2.1
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

```
  ROLLING UPDATE — What happens when you change image to :2.2
  ═══════════════════════════════════════════════════════════

  BEFORE (v2.1):
  [Pod-A v2.1 ✅] [Pod-B v2.1 ✅] [Pod-C v2.1 ✅]
  
  Step 1: Create new pod with v2.2 (maxSurge=1 allows 4 pods temporarily)
  [Pod-A v2.1 ✅] [Pod-B v2.1 ✅] [Pod-C v2.1 ✅] [Pod-D v2.2 🔄 starting]
  
  Step 2: Pod-D passes readiness check
  [Pod-A v2.1 ✅] [Pod-B v2.1 ✅] [Pod-C v2.1 ✅] [Pod-D v2.2 ✅]
  
  Step 3: Terminate oldest v2.1 pod (maxUnavailable=0, we have 4 healthy)
  [Pod-A v2.1 ❌ terminating] [Pod-B v2.1 ✅] [Pod-C v2.1 ✅] [Pod-D v2.2 ✅]
  
  Step 4-5: Repeat for remaining pods
  [Pod-B v2.1 ✅] [Pod-C v2.1 ✅] [Pod-D v2.2 ✅] [Pod-E v2.2 🔄]
  → [Pod-C v2.1 ✅] [Pod-D v2.2 ✅] [Pod-E v2.2 ✅] [Pod-F v2.2 🔄]
  
  FINAL:
  [Pod-D v2.2 ✅] [Pod-E v2.2 ✅] [Pod-F v2.2 ✅]
  
  → ZERO DOWNTIME! At least 3 healthy pods at all times
  → If v2.2 fails readiness check → rollout pauses → v2.1 still serving


  HIERARCHY:
  ══════════
  
  Deployment (you manage this)
      │
      ├── creates ReplicaSet-v2.1  (manages v2.1 pods)
      │   └── Pod-A, Pod-B, Pod-C
      │
      └── creates ReplicaSet-v2.2  (manages v2.2 pods)
          └── Pod-D, Pod-E, Pod-F
```

---

## 5. Services — How Networking Works Inside the Cluster

```
  PROBLEM: Pods get random IPs. Pods die and get recreated with new IPs.
  How does "payment-service" find "order-service"?
  
  
  ANSWER: Kubernetes Service = stable DNS name + load balancer
  
  
  ┌─── Service: order-service ──────────────────────────────────────────┐
  │                                                                      │
  │  Type: ClusterIP (internal only, default)                           │
  │  Cluster IP: 10.96.45.123 (stable, doesn't change)                 │
  │  DNS: order-service.default.svc.cluster.local                       │
  │  Port: 80 → targetPort: 8080                                       │
  │                                                                      │
  │  Selector: app=order-service                                         │
  │                                                                      │
  │  Endpoints (discovered by selector):                                 │
  │  ├── 10.244.1.5:8080  (Pod-D, healthy ✅)                          │
  │  ├── 10.244.2.8:8080  (Pod-E, healthy ✅)                          │
  │  └── 10.244.3.2:8080  (Pod-F, healthy ✅)                          │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
  
  When payment-service calls: http://order-service/api/orders
  
  1. DNS lookup: "order-service" → 10.96.45.123
  2. kube-proxy (iptables/IPVS) intercepts traffic to 10.96.45.123
  3. Load-balances to one of the endpoint pods (round-robin)
  4. If a pod dies → removed from endpoints → no traffic routed to it
  
  
  SERVICE TYPES:
  ══════════════
  
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ Type          │ Scope                │ Use Case                          │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ ClusterIP     │ Internal only        │ Service-to-service communication  │
  │ (default)     │ Cluster IP assigned  │ Databases, internal APIs          │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ NodePort      │ External via node IP │ Direct access for testing         │
  │               │ Port 30000-32767     │ $NodeIP:$NodePort → pod           │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ LoadBalancer  │ External via cloud LB│ Production external access        │
  │               │ Provisions cloud LB  │ AWS ALB, GCP LB, Azure LB        │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ ExternalName  │ DNS alias            │ Map to external service           │
  │               │ CNAME record         │ external-db.company.com           │
  └──────────────────────────────────────────────────────────────────────────┘
```

---



🔬 **Section Challenge — 5. Services — How Networking Works Inside the Cluster**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## 6. Ingress — How External Traffic Reaches Your App

```
  The single entry point for external HTTP(S) traffic into the cluster.
  
  Internet → Ingress Controller → Services → Pods
  
  
  ┌─── Internet ───────────────────────────────────────────────────────────┐
  │  User browses: https://api.myapp.com/orders                           │
  └───────────────────────────────┬─────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─── Ingress Controller (NGINX/Traefik/HAProxy) ────────────────────────┐
  │                                                                        │
  │  TLS termination: decrypt HTTPS → HTTP                                │
  │                                                                        │
  │  Route by rules:                                                       │
  │  ├── api.myapp.com/orders   → order-service:80                        │
  │  ├── api.myapp.com/payments → payment-service:80                      │
  │  ├── api.myapp.com/users    → user-service:80                         │
  │  └── myapp.com/*            → frontend-service:80                     │
  │                                                                        │
  └───────────────────────────────┬─────────────────────────────────────────┘
                                  │
                                  ▼
  ┌─── ClusterIP Services → Pods ─────────────────────────────────────────┐
  │                                                                        │
  │  order-service → [Pod1] [Pod2] [Pod3]                                 │
  │  payment-service → [Pod4] [Pod5]                                      │
  │                                                                        │
  └────────────────────────────────────────────────────────────────────────┘
```

```yaml


🔬 **Section Challenge — 6. Ingress — How External Traffic Reaches Your App**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  tls:
  - hosts:
    - api.myapp.com
    secretName: tls-secret
  rules:
  - host: api.myapp.com
    http:
      paths:
      - path: /orders
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 80
      - path: /payments
        pathType: Prefix
        backend:
          service:
            name: payment-service
            port:
              number: 80
```

---

## 7. ConfigMaps and Secrets — Configuration Management

```yaml
# ConfigMap — for non-sensitive configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  SPRING_PROFILES_ACTIVE: "prod"
  DATABASE_URL: "jdbc:postgresql://db-service:5432/orders"
  LOG_LEVEL: "INFO"
  
---
# Secret — for sensitive data (Base64 encoded, NOT encrypted by default!)
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DB_PASSWORD: cGFzc3dvcmQxMjM=    # base64("password123")
  JWT_SECRET: c3VwZXJzZWNyZXQ=     # base64("supersecret")
```

```
  HOW PODS USE THEM:
  ══════════════════

  METHOD 1: Environment variables
  
  env:
  - name: DB_URL
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: DATABASE_URL
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: DB_PASSWORD
  
  
  METHOD 2: Volume mounts (files)
  
  volumes:
  - name: config-volume
    configMap:
      name: app-config
  
  containers:
  - volumeMounts:
    - name: config-volume
      mountPath: /etc/config
      # Creates files: /etc/config/SPRING_PROFILES_ACTIVE
      #                /etc/config/DATABASE_URL
      #                /etc/config/LOG_LEVEL
  
  
  ⚠️ SECRETS ARE NOT ENCRYPTED: Base64 encoding is NOT security.
  For production, use:
  • External secrets (AWS Secrets Manager, HashiCorp Vault)
  • Sealed Secrets (encrypted in Git, decrypted in cluster)
  • etcd encryption at rest
```

---

## 8. StatefulSets — For Databases and Stateful Apps

```
  DEPLOYMENT vs STATEFULSET:
  ══════════════════════════
  
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                     │ Deployment              │ StatefulSet              │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Pod names           │ Random (app-7d4f-abc)   │ Ordered (app-0, app-1)  │
  │ Startup order       │ All at once              │ Sequential (0, 1, 2)    │
  │ Shutdown order      │ Any order               │ Reverse (2, 1, 0)       │
  │ Network identity    │ No stable hostname       │ app-0.service, app-1... │
  │ Storage             │ Shared or ephemeral     │ Each pod owns its PVC   │
  │ Use case            │ Stateless apps          │ Databases, Kafka, ZK    │
  └──────────────────────────────────────────────────────────────────────────┘
  
  
  WHY DATABASES NEED STATEFULSETS:
  ════════════════════════════════
  
  PostgreSQL with replication:
  
  ┌── StatefulSet: postgres ──────────────────────────────────────────────┐
  │                                                                        │
  │  postgres-0 (PRIMARY)                                                 │
  │  ├── Hostname: postgres-0.postgres-headless.default.svc               │
  │  ├── PVC: data-postgres-0 → 100Gi SSD (survives pod restart!)       │
  │  └── Role: accepts reads AND writes                                   │
  │                                                                        │
  │  postgres-1 (REPLICA)                                                 │
  │  ├── Hostname: postgres-1.postgres-headless.default.svc               │
  │  ├── PVC: data-postgres-1 → 100Gi SSD (its OWN separate disk)       │
  │  └── Role: read-only replica, streams WAL from postgres-0            │
  │                                                                        │
  │  postgres-2 (REPLICA)                                                 │
  │  ├── Hostname: postgres-2.postgres-headless.default.svc               │
  │  ├── PVC: data-postgres-2 → 100Gi SSD                               │
  │  └── Role: read-only replica                                          │
  │                                                                        │
  └────────────────────────────────────────────────────────────────────────┘
  
  If postgres-1 dies and restarts:
  → Gets SAME name (postgres-1), SAME PVC (data-postgres-1)
  → Reattaches to its data → no data loss!
  
  With Deployment: pod gets random name, different PVC → DATA LOST
```

---

## 9. Resource Management — Requests, Limits, and QoS

```yaml
resources:
  requests:           # "I NEED at least this much"
    memory: "256Mi"   # Used for SCHEDULING decisions
    cpu: "250m"       # Scheduler won't place pod on node without this available
  limits:             # "NEVER use more than this"
    memory: "512Mi"   # If exceeded → OOMKilled! (Out of Memory)
    cpu: "500m"       # If exceeded → throttled (not killed)
```

```
  CPU UNITS:
  ══════════
  1 CPU = 1000m (millicores)
  250m = 25% of one CPU core
  0.5 = 500m = half a core
  
  MEMORY UNITS:
  ═════════════
  Mi = Mebibytes (1024-based)
  256Mi = 268,435,456 bytes
  
  
  QoS CLASSES (determined by how you set requests/limits):
  ════════════════════════════════════════════════════════
  
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ QoS Class     │ Condition                                │ Eviction     │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Guaranteed    │ requests == limits for ALL containers    │ Last to die  │
  │               │ (CPU and memory both set and equal)      │ Most stable  │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Burstable     │ At least one request OR limit set        │ Middle       │
  │               │ (requests < limits, or only one set)     │              │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ BestEffort    │ NO requests AND NO limits set            │ First to die │
  │               │ (gets whatever is left over)              │ Avoid in prod│
  └──────────────────────────────────────────────────────────────────────────┘
  
  When node runs out of memory:
  1. Kill BestEffort pods first
  2. Kill Burstable pods exceeding requests
  3. Kill Guaranteed pods only as last resort
  
  PRODUCTION RULE: ALWAYS set requests and limits.
  Prefer Guaranteed for critical services (DB, payment).
  Burstable OK for general services (tolerate occasional eviction).
```

---

## 10. Health Checks — Liveness, Readiness, Startup Probes

```
  THREE TYPES OF PROBES:
  ══════════════════════

  ┌──────────────────────────────────────────────────────────────────────────┐
  │ Probe      │ Question                   │ If Fails                      │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Startup    │ "Has the app STARTED?"     │ Keep waiting (don't restart)  │
  │            │ Runs once at beginning      │ If exceeds timeout → restart  │
  │            │                              │ Protects slow-starting apps   │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Liveness   │ "Is the app ALIVE?"        │ RESTART the container         │
  │            │ Runs continuously            │ (kills and recreates)         │
  │            │                              │ For deadlocks, hung states    │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Readiness  │ "Can the app SERVE traffic?"│ REMOVE from service endpoints │
  │            │ Runs continuously            │ (stop sending requests)       │
  │            │                              │ For warmup, dependency down   │
  └──────────────────────────────────────────────────────────────────────────┘
```

```yaml


🔬 **Section Challenge — 10. Health Checks — Liveness, Readiness, Startup Probes**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


# Spring Boot health check configuration
containers:
- name: order-service
  image: order-service:2.1
  
  startupProbe:
    httpGet:
      path: /actuator/health
      port: 8080
    failureThreshold: 30        # Try 30 times
    periodSeconds: 10           # Every 10 seconds = 300s max startup time
  
  livenessProbe:
    httpGet:
      path: /actuator/health/liveness
      port: 8080
    initialDelaySeconds: 0      # Startup probe handles initial delay
    periodSeconds: 10
    failureThreshold: 3         # 3 consecutive failures → restart
  
  readinessProbe:
    httpGet:
      path: /actuator/health/readiness
      port: 8080
    periodSeconds: 5
    failureThreshold: 3         # 3 failures → remove from service
```

---

## 11. How Scheduling Works — From YAML to Running Pod

```
  kubectl apply -f deployment.yaml
       │
       ▼
  Step 1: kubectl sends to API Server
          POST /apis/apps/v1/namespaces/default/deployments
       │
  Step 2: API Server validates, writes to etcd
          etcd stores Deployment spec
       │
  Step 3: Deployment Controller sees new Deployment
          Creates ReplicaSet → API Server → etcd
       │
  Step 4: ReplicaSet Controller sees desired replicas = 3
          Creates 3 Pod objects (status: Pending) → etcd
       │
  Step 5: Scheduler sees 3 unscheduled pods
          FOR EACH POD:
          │
          ├── FILTERING (which nodes CAN run this pod?):
          │   ├── Does node have enough CPU? (request: 250m)
          │   ├── Does node have enough memory? (request: 256Mi)
          │   ├── Does pod have node selector/affinity? (match?)
          │   ├── Is node tainted? Does pod tolerate it?
          │   └── Result: 2 of 3 nodes pass
          │
          ├── SCORING (which node SHOULD run this pod?):
          │   ├── Balance pods across nodes (spread)
          │   ├── Node with more available resources (score higher)
          │   ├── Prefer nodes where image already pulled
          │   ├── Anti-affinity rules (don't colocate with same app)
          │   └── Result: Node-2 scores highest
          │
          └── BIND: assign pod to Node-2 → update in etcd
       │
  Step 6: kubelet on Node-2 sees new pod assigned to it
          │
          ├── Pull image (if not cached): docker pull myregistry/order-service:2.1
          ├── Create container via containerd
          ├── Set up networking (CNI plugin): assign pod IP
          ├── Mount volumes (ConfigMap, Secret, PVC)
          ├── Start container: java -jar app.jar
          ├── Run startup probe → wait for success
          ├── Pod status: Running
          └── Report status back to API Server
       │
  Step 7: kube-proxy updates iptables/IPVS rules
          Service endpoints now include this pod
          Traffic can flow to the new pod
```

---



🔬 **Section Challenge — 11. How Scheduling Works — From YAML to Running Pod**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## 12. Common Production Patterns

### Pod Disruption Budget

```yaml


# "Always keep at least 2 pods running during voluntary disruptions"
# (node drain, rolling update, cluster upgrade)
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: order-service-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: order-service
```

### Horizontal Pod Autoscaler

```yaml
# Auto-scale between 3-10 pods based on CPU
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70   # Scale up when avg CPU > 70%
```

### Pod Anti-Affinity

```yaml
# Spread pods across different nodes (survive node failure)
spec:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: app
              operator: In
              values:
              - order-service
          topologyKey: kubernetes.io/hostname
```

---

**Next Chapter**: [Distributed Patterns & Consensus →](Ch68_Distributed_Patterns.md)

---

## 🏋️ Practice & Interview Questions — DevOps & Networking

### Predict / Trace
**Q1.** What happens when you type `https://google.com` in a browser?
<details><summary>Answer</summary>

1. DNS lookup: resolve `google.com` → IP (recursive resolver → root → TLD → authoritative NS)
2. TCP connection: 3-way handshake (SYN → SYN-ACK → ACK) to port 443
3. TLS handshake: ClientHello → ServerHello → certificate verification → key exchange → session keys
4. HTTP/2 GET request sent
5. Server responds with HTML (GZIP compressed)
6. Browser parses HTML → fetches CSS/JS → CSSOM + DOM → render tree → paint
</details>

**Q2.** `curl -I https://example.com` returns `Connection: keep-alive`. What does this mean?
<details><summary>Answer</summary>

The TCP connection won't be closed after the response — it stays open for reuse. Avoiding TCP+TLS handshake overhead for subsequent requests. HTTP/1.1 default; HTTP/2 always multiplexes on one connection.
</details>

### Coding / Commands
**Q3.** ⭐ Write a Dockerfile for a Java Spring Boot app — multi-stage build.
<details><summary>Solution</summary>

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY gradlew build.gradle settings.gradle ./
COPY gradle gradle/
RUN ./gradlew dependencies --no-daemon
COPY src src/
RUN ./gradlew bootJar --no-daemon

# Stage 2: Runtime (smaller image)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```
</details>

**Q4.** ⭐ Write a Kubernetes deployment with liveness and readiness probes.
<details><summary>Solution</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: myapp:1.0
        resources:
          requests: { memory: "256Mi", cpu: "250m" }
          limits:   { memory: "512Mi", cpu: "500m" }
        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          initialDelaySeconds: 10
          periodSeconds: 5
```
</details>

**Q5.** ⭐⭐ Design a zero-downtime deployment strategy.
<details><summary>Answer</summary>

**Blue-Green**: run two identical envs, switch load balancer. Instant rollback. Double the infra cost.
**Rolling**: replace pods one-by-one. K8s default. Slower, but no extra infra.
**Canary**: route 5% traffic to new version, monitor errors/latency, gradually increase. Most risk-controlled.
**Feature flags**: deploy code but disable feature — decouple deployment from release.
</details>

### Interview Questions
**Q6.** TCP vs UDP — when to use each?
<details><summary>Answer</summary>

**TCP**: reliable (acknowledgments, retransmission), ordered, connection-based. Use for: HTTP, databases, SSH, email — anywhere correctness matters more than speed.
**UDP**: unreliable, unordered, connectionless. Use for: video streaming, gaming, DNS, VoIP — where speed matters more than perfect delivery, or app handles reliability itself.
</details>

**Q7.** What is a memory limit vs memory request in Kubernetes?
<details><summary>Answer</summary>

`request`: guaranteed allocation — K8s won't schedule pod on node with less available. `limit`: maximum usage — if exceeded, pod is OOM-killed. Set requests for scheduling accuracy; set limits to prevent noisy neighbor problems. Best practice: requests=expected P50 usage, limits=expected P99 surge.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | HTTP status code 429 | Too Many Requests (rate limited) |
| 2 | HTTP status code 503 | Service Unavailable (server down/overloaded) |
| 3 | DNS record type for IP address | A record (IPv4), AAAA record (IPv6) |
| 4 | Load balancer Layer 4 vs 7 | L4: TCP/UDP level; L7: HTTP/application level (content-aware) |
| 5 | TLS/SSL terminates where | At load balancer (termination), or all the way to pod (passthrough) |
| 6 | `docker exec -it container bash` does | Opens interactive shell in running container |
| 7 | Kubernetes etcd stores | Cluster state (all K8s object definitions) |
| 8 | CI/CD — what triggers a pipeline? | Code push, PR, tag, schedule, or manual trigger |

---

## 🧠 Deep Conceptual Questions — Networking & DevOps Internals

**C1. TCP three-way handshake: WHY three steps? Can it be done in two?**
<details><summary>Deep Answer</summary>

Two-way fails: both sides need to confirm the OTHER side can send AND receive. 
- SYN (client→server): "I want to connect, my sequence starts at X"
- SYN-ACK (server→client): "Got your SYN, my sequence starts at Y, ack=X+1"  
- ACK (client→server): "Got your SYN-ACK, ack=Y+1"

Without the third ACK: client knows server is alive, but server doesn't know the client received the SYN-ACK. If SYN-ACK lost: server has allocated resources (TCB) thinking connection established, client doesn't know. The ACK confirms the server's sequence number was received. This asymmetric confirmation requires 3 messages minimum. Four-way teardown: TCP is full-duplex — each direction closed independently, hence 4 steps.
</details>

**C2. What happens when you run `docker run`? Trace the full execution path.**
<details><summary>Deep Answer</summary>

1. **Docker CLI** parses the command, sends REST API request to Docker daemon (`/run`)
2. **Docker daemon** (dockerd) receives the request
3. If image not local: **pull from registry** (Docker Hub → HTTPS, layer downloads)
4. Daemon calls **containerd** (container runtime interface)
5. containerd calls **runc** (OCI runtime)
6. runc creates **Linux namespaces**: PID, NET, MNT, UTS, IPC, USER — isolates the process
7. runc sets up **cgroups**: limits CPU, memory, I/O
8. runc **pivot_root**: changes the filesystem root to the container's overlay filesystem
9. runc executes the entrypoint process (PID 1 in the container)
10. Container stdout/stderr connected through Docker daemon to your terminal
</details>

**C3. Why does Kubernetes use etcd and what would happen if etcd went down?**
<details><summary>Deep Answer</summary>

etcd = distributed key-value store using the Raft consensus algorithm. Stores ALL cluster state: pod specs, deployments, services, secrets, configmaps, RBAC, CRDs. Raft ensures consistency across a cluster of 3-5 etcd nodes (quorum = (N/2)+1). **If etcd goes down**: API server can't read/write state. kubectl commands fail. Scheduler can't schedule new pods. Controller manager can't reconcile state. EXISTING running pods continue running (they don't constantly check etcd — they're managed by kubelet on each node). New pods can't be scheduled. No updates possible. This is why etcd backup + restore is the most critical K8s operation.
</details>

**C4. TLS handshake: what is forward secrecy and why does it matter?**
<details><summary>Deep Answer</summary>

Without forward secrecy: if attacker records encrypted traffic now, and later compromises the server's private key, they can decrypt ALL past traffic retroactively. The server's private key decrypts the session key which decrypts the data. **Forward secrecy** (TLS 1.3 default): each session uses an **ephemeral key pair** (ECDHE). Session keys derived from ephemeral keys + DH exchange. Session key is never stored. If private key compromised later: past sessions can't be decrypted (the ephemeral keys are gone). This is why TLS 1.3 mandates forward secrecy and deprecated non-FS cipher suites. Practically: enables safer long-term data archival.
</details>

**C5. DNS propagation: why does it take "up to 48 hours"?**
<details><summary>Deep Answer</summary>

DNS uses hierarchical caching. Each DNS record has a TTL (time-to-live). When you update a DNS record, authoritative NS serves the new value immediately. But: resolvers worldwide have cached the OLD value until their cache TTL expires. TTL varies: some ISPs set their resolver cache TTL aggressively (override your TTL), some ignore TTL and cache for hours regardless. "48 hours" = worst-case TTL of most records (common: 3600s=1hr, 86400s=1day). Reduce before migration: lower TTL to 60s a week before planned change → faster propagation. After change: most resolvers pick up the new value within minutes. "48 hours" is a legacy conservative estimate.
</details>

**C6. Load balancer: what is the difference between Layer 4 and Layer 7?**
<details><summary>Deep Answer</summary>

**Layer 4 (Transport)**: routes based on TCP/UDP. Sees: IP address, port. Doesn't read HTTP content. Faster (no packet inspection, can be done in-kernel). Can't do URL-based routing, auth injection, session affinity by cookie. Examples: AWS NLB, HAProxy in TCP mode. **Layer 7 (Application)**: reads HTTP headers, URL, body. Can route `/api` to one backend, `/static` to another. Can inject headers (`X-Real-IP`), handle SSL termination, do health checks on HTTP endpoints, session affinity by cookie. More CPU-intensive (full packet inspection). Examples: NGINX, AWS ALB, Envoy. Modern microservices use L7 (Envoy/Istio) for fine-grained traffic control.
</details>

