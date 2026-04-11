> **Navigation**: [← SRE](22_SRE_Practices.md) | [Index](00_INDEX.md)

# 🔀 Chapter 23: GitOps & Deployment Strategies — Git as the Single Source of Truth

> _"In GitOps, Git is not just where code lives — it's where ALL state lives. Infrastructure, configuration, deployments, policies. If it's not in Git, it doesn't exist. One pull request to rule them all."_

---

# PART 1: GitOps Principles

---

```
TRADITIONAL DEPLOYMENT:
  Developer → CI builds image → CI pushes image → CI runs kubectl apply → cluster changes.
  CI server has production credentials! CI failure → can't deploy!
  "Push" model: CI PUSHES changes to the cluster.

GITOPS DEPLOYMENT:
  Developer → PR to Git → Git repo updated → ArgoCD NOTICES → ArgoCD applies to cluster.
  Git is the single source of truth. ArgoCD has credentials, not CI.
  "Pull" model: cluster PULLS desired state from Git.

THE 4 PRINCIPLES:

1. DECLARATIVE: desired state is described declaratively (YAML, HCL, etc.).
   "I want 3 replicas of my-api:v2.1." NOT "Scale from 2 to 3."

2. VERSIONED AND IMMUTABLE: all desired state is stored in Git.
   Git history = deployment history. Rollback = git revert.
   Audit log? → git log. Who changed what? → git blame.

3. PULLED AUTOMATICALLY: agents in the cluster detect Git changes and apply.
   No human runs kubectl. No CI pushes to production.
   ArgoCD polls Git every 3 minutes → detects drift → auto-syncs.

4. CONTINUOUSLY RECONCILED: agents ensure actual state matches desired state.
   Someone manually changes a K8s resource? → ArgoCD detects drift → reverts!
   "Self-healing" infrastructure.
```

---

# PART 2: ArgoCD — The GitOps Controller

---

```
ARGO CD ARCHITECTURE:

  ┌─────────────────┐         ┌──────────────────┐
  │ Git Repository   │◄────────│ ArgoCD Server     │
  │ (desired state)  │         │ (watches Git +    │
  │                  │         │  reconciles K8s)  │
  │ apps/            │         └──────────┬────────┘
  │ ├── my-api/      │                    │
  │ │   ├── deploy.yaml                   │ sync
  │ │   ├── service.yaml                  │
  │ │   └── ingress.yaml                  ▼
  │ ├── my-frontend/ │         ┌──────────────────┐
  │ │   └── ...      │         │ Kubernetes Cluster│
  │ └── monitoring/  │         │ (actual state)    │
  └─────────────────┘         └──────────────────┘

HOW IT WORKS:
1. ArgoCD watches a Git repo (e.g., github.com/myorg/k8s-manifests).
2. Developer creates PR → changes my-api/deploy.yaml (image tag v2.1).
3. PR is reviewed and merged.
4. ArgoCD detects the change (polls every 3 min or webhook).
5. ArgoCD compares Git (desired) vs cluster (actual).
6. If different → ArgoCD syncs: applies the new manifests to the cluster.
7. ArgoCD reports sync status in its dashboard.

DRIFT DETECTION:
  Someone runs: kubectl edit deployment my-api (manual change!).
  ArgoCD detects: actual ≠ desired (Git).
  Option 1: Alert (manual sync required).
  Option 2: Auto-sync → revert the manual change (enforce Git as truth).
```

```yaml
# ── ARGO CD APPLICATION ──
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-api
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/k8s-manifests
    targetRevision: main
    path: apps/my-api           # directory in repo with K8s manifests

  destination:
    server: https://kubernetes.default.svc
    namespace: production

  syncPolicy:
    automated:
      prune: true               # delete resources removed from Git
      selfHeal: true            # revert manual cluster changes
    syncOptions:
    - CreateNamespace=true
    retry:
      limit: 3
      backoff:
        duration: 5s
        maxDuration: 3m
```

---

# PART 3: Helm — Kubernetes Package Manager

---

```
HELM = package manager for Kubernetes.
  Like apt for Ubuntu, npm for Node.js → Helm for K8s.
  
  A HELM CHART = a package of K8s manifests with templating.
  Instead of hardcoding values → use templates with configurable values.

WHY?
  WITHOUT HELM: duplicate YAML files for each environment.
  staging/deploy.yaml: replicas: 1, image: api:staging
  production/deploy.yaml: replicas: 5, image: api:v2.1
  3 environments × 10 files = 30 files. Change a label? → change 30 files.
  
  WITH HELM: ONE template, different values per environment.
  templates/deploy.yaml: replicas: {{ .Values.replicas }}
  staging/values.yaml:   replicas: 1
  production/values.yaml: replicas: 5
```

```yaml
# ── HELM CHART STRUCTURE ──
# my-api/
# ├── Chart.yaml           # metadata (name, version)
# ├── values.yaml           # default values
# ├── values-staging.yaml   # staging overrides
# ├── values-production.yaml# production overrides
# └── templates/
#     ├── deployment.yaml
#     ├── service.yaml
#     ├── ingress.yaml
#     └── hpa.yaml

# ── templates/deployment.yaml ──
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    app: {{ .Release.Name }}
    version: {{ .Values.image.tag }}
spec:
  replicas: {{ .Values.replicas }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    spec:
      containers:
      - name: {{ .Release.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        resources:
          requests:
            memory: {{ .Values.resources.requests.memory }}
            cpu: {{ .Values.resources.requests.cpu }}
          limits:
            memory: {{ .Values.resources.limits.memory }}

# ── values-production.yaml ──
replicas: 5
image:
  repository: ghcr.io/myorg/api
  tag: "2.1.0"
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
```

```bash
# ── HELM COMMANDS ──

# Install a chart
helm install my-api ./my-api-chart -f values-production.yaml -n production

# Upgrade (deploy new version)
helm upgrade my-api ./my-api-chart --set image.tag=2.2.0 -n production

# Rollback to previous release
helm rollback my-api 1 -n production    # rollback to revision 1

# List releases
helm list -n production

# Render templates (see what YAML will be applied — without applying)
helm template my-api ./my-api-chart -f values-production.yaml

# Use community charts from Helm Hub
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install redis bitnami/redis -n production
helm install postgresql bitnami/postgresql --set auth.postgresPassword=secret
```

---

# PART 4: The Complete GitOps Workflow

---

```
THE FULL PICTURE:

  Developer            CI Pipeline          Git (Config Repo)     ArgoCD → K8s
     │                      │                      │                   │
     │─── push code ───────>│                      │                   │
     │                      │── build + test ──>   │                   │
     │                      │── build Docker ──>   │                   │
     │                      │── push to registry   │                   │
     │                      │                      │                   │
     │                      │── update values.yaml │                   │
     │                      │   (new image tag) ──>│                   │
     │                      │   (automated PR)     │                   │
     │                      │                      │                   │
     │── review PR ────────────────────────────>   │                   │
     │── merge PR ─────────────────────────────>   │                   │
     │                      │                      │── detect change ──│
     │                      │                      │                   │
     │                      │                      │── sync manifests─>│
     │                      │                      │── reconcile ──────│
     │                      │                      │                   │
     │<──── notification: deployment complete ─────────────────────────│
  
  KEY INSIGHT:
  CI only builds and publishes. It NEVER touches production.
  ArgoCD (in the cluster) pulls from Git and applies.
  
  SEPARATION OF CONCERNS:
  Code repo (github.com/myorg/api):         application source code.
  Config repo (github.com/myorg/k8s-config): K8s manifests + Helm values.
  
  WHY separate?
  1. Different change velocity (code changes daily, infra changes weekly).
  2. Different access control (devs change code, SRE reviews infra).
  3. CI triggers only on code repo → doesn't re-trigger for config changes.
```

---

# PART 5: Argo Rollouts — Progressive Delivery

---

```yaml
# ── ARGO ROLLOUTS: Canary with Automatic Analysis ──
# Standard K8s Deployments: all-or-nothing rolling update.
# Argo Rollouts: gradual traffic shift with automated rollback.

apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-api
spec:
  replicas: 5
  selector:
    matchLabels:
      app: my-api
  template:
    # ... (same as Deployment spec)
  strategy:
    canary:
      steps:
      - setWeight: 5           # 5% traffic to new version
      - pause: { duration: 5m } # observe for 5 minutes
      - analysis:
          templates:
          - templateName: error-rate-check
      - setWeight: 25          # increase to 25%
      - pause: { duration: 10m }
      - analysis:
          templates:
          - templateName: error-rate-check
      - setWeight: 50          # 50%
      - pause: { duration: 10m }
      - setWeight: 100         # full rollout

---
# ANALYSIS TEMPLATE: automated rollback if metrics are bad
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate-check
spec:
  metrics:
  - name: error-rate
    interval: 60s
    successCondition: result[0] < 0.05    # error rate < 5%
    failureLimit: 3                        # 3 failures → auto-rollback!
    provider:
      prometheus:
        address: http://prometheus:9090
        query: |
          sum(rate(http_requests_total{status=~"5..",app="my-api",version="canary"}[5m]))
          /
          sum(rate(http_requests_total{app="my-api",version="canary"}[5m]))
```

```
HOW IT WORKS:
  1. New version deployed → 5% of traffic routed to canary pods.
  2. Argo Rollouts queries Prometheus: "Is the error rate < 5%?"
  3. YES → proceed to 25%, then 50%, then 100%.
  4. NO (3 consecutive failures) → automatic rollback to stable version!
  
  ZERO HUMAN INTERVENTION. The system validates its own deployments.
  
  vs STANDARD K8S DEPLOYMENT:
  Deployment: replaces pods, can't control traffic percentage.
  Rollout: controls EXACT traffic split using Istio/nginx/ALB.
```

---

# PART 6: Flux CD — The Alternative to ArgoCD

---

```
FLUX = GitOps toolkit by Weaveworks (CNCF graduated project).

ARGOCD vs FLUX:

┌─────────────────────┬──────────────────────┬──────────────────────┐
│ Feature              │ ArgoCD                │ Flux                  │
├─────────────────────┼──────────────────────┼──────────────────────┤
│ UI Dashboard         │ ✅ Rich web UI        │ ❌ CLI only (or Weave)│
│ Architecture         │ Monolithic server     │ Microservices toolkit │
│ Multi-tenancy        │ Projects + RBAC       │ Native (per-namespace)│
│ Helm support         │ ✅ Native              │ ✅ HelmRelease CRD    │
│ Kustomize            │ ✅ Native              │ ✅ Kustomization CRD  │
│ Notifications         │ Slack, Webhook        │ Built-in providers    │
│ Image automation     │ ❌ (use CI)            │ ✅ Auto-update images │
│ Progressive delivery │ Argo Rollouts addon   │ Flagger addon        │
│ Learning curve       │ Lower (UI helps)      │ Higher (CLI-first)   │
│ CNCF status          │ Graduated             │ Graduated            │
└─────────────────────┴──────────────────────┴──────────────────────┘

WHEN TO USE:
  ArgoCD: teams that want a visual dashboard, simpler setup, monolithic.
  Flux: teams that prefer CLI, want microservice architecture, image automation.
  
  Both are excellent. ArgoCD is more popular (by GitHub stars).
  Flux is more modular (use only the components you need).
```

---

# PART 7: Secrets in GitOps — The Hard Problem

---

```
THE PROBLEM:
  GitOps = everything in Git. But secrets (passwords, API keys) CANNOT be in Git!
  How do you manage secrets declaratively without exposing them?

SOLUTION 1: SEALED SECRETS (Bitnami):
  Encrypt secrets client-side → commit ENCRYPTED secret to Git.
  Sealed Secrets controller in cluster → decrypts at deploy time.
  
  kubeseal --cert pub-cert.pem < secret.yaml > sealed-secret.yaml
  # sealed-secret.yaml is safe to commit (encrypted with cluster's public key)
  # Only the controller in the cluster has the private key to decrypt

SOLUTION 2: SOPS (Mozilla — Secrets OPerationS):
  Encrypt YAML/JSON values (not keys!) with KMS, PGP, or age.
  Stored in Git: keys are readable, values are encrypted.
  
  sops --encrypt --kms arn:aws:kms:us-east-1:123:key/abc secret.yaml > secret.enc.yaml
  
  Result:
  apiVersion: v1
  kind: Secret
  data:
    password: ENC[AES256_GCM,data:abcdef123456,iv:...,tag:...]
    # Key "password" is readable. Value is encrypted.
  
  Flux has built-in SOPS decryption support.
  ArgoCD uses the argocd-vault-plugin or kustomize-sops.

SOLUTION 3: EXTERNAL SECRETS OPERATOR (ESO):
  Don't store secrets in Git at ALL.
  Store an ExternalSecret reference → ESO fetches from Vault/AWS/GCP.
  
  apiVersion: external-secrets.io/v1beta1
  kind: ExternalSecret
  metadata:
    name: db-credentials
  spec:
    refreshInterval: 1h
    secretStoreRef:
      name: aws-secrets-manager
      kind: ClusterSecretStore
    target:
      name: db-credentials
    data:
    - secretKey: password
      remoteRef:
        key: production/database
        property: password
  
  ESO creates a real K8s Secret by fetching from AWS Secrets Manager.
  Git only has the REFERENCE, not the actual secret value.

RECOMMENDATION:
  Small teams: Sealed Secrets (simplest).
  Medium teams: SOPS + Flux (encrypted in Git, decrypted at deploy).
  Enterprise: External Secrets Operator + HashiCorp Vault (centralized).
```

---

# PART 8: Multi-Cluster Management with ApplicationSets

---

```yaml
# ── ApplicationSet: deploy to MULTIPLE clusters from ONE definition ──

apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: my-api-global
  namespace: argocd
spec:
  generators:
  - list:
      elements:
      - cluster: us-east-1
        url: https://k8s-us-east.mycompany.com
        values:
          replicas: "5"
          env: production
      - cluster: eu-west-1
        url: https://k8s-eu-west.mycompany.com
        values:
          replicas: "3"
          env: production
      - cluster: ap-south-1
        url: https://k8s-ap-south.mycompany.com
        values:
          replicas: "2"
          env: production
  template:
    metadata:
      name: my-api-{{cluster}}
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/k8s-manifests
        targetRevision: main
        path: apps/my-api
        helm:
          valueFiles:
          - values-{{values.env}}.yaml
          parameters:
          - name: replicas
            value: "{{values.replicas}}"
      destination:
        server: "{{url}}"
        namespace: production
      syncPolicy:
        automated:
          prune: true
          selfHeal: true

# ONE ApplicationSet → THREE ArgoCD Applications → THREE clusters!
# Change the Git repo → all 3 clusters update automatically.
```

---

# PART 9: Kustomize — Helm Alternative

---

```
KUSTOMIZE = template-free customization of K8s YAML.
  No templating language. No {{ .Values.x }}.
  Instead: overlay plain YAML with patches.
  Built into kubectl: kubectl apply -k ./overlays/production/

DIRECTORY STRUCTURE:
  k8s/
  ├── base/                          # shared resources
  │   ├── kustomization.yaml
  │   ├── deployment.yaml
  │   ├── service.yaml
  │   └── ingress.yaml
  ├── overlays/
  │   ├── staging/
  │   │   ├── kustomization.yaml     # patches for staging
  │   │   └── replica-patch.yaml
  │   └── production/
  │       ├── kustomization.yaml     # patches for production
  │       ├── replica-patch.yaml
  │       └── resource-patch.yaml
```

```yaml
# ── base/kustomization.yaml ──
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
- ingress.yaml
commonLabels:
  app: my-api

# ── overlays/production/kustomization.yaml ──
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base                       # inherit everything from base
namePrefix: prod-                   # prefix all resource names
namespace: production

patches:
- path: replica-patch.yaml
  target:
    kind: Deployment
    name: my-api

images:
- name: my-api                      # override image tag
  newName: ghcr.io/myorg/api
  newTag: "2.1.0"

# ── overlays/production/replica-patch.yaml ──
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
spec:
  replicas: 5
  template:
    spec:
      containers:
      - name: my-api
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
```

```
KUSTOMIZE vs HELM:
  Kustomize: plain YAML, no templating, simpler, built into kubectl.
  Helm: full templating, package management, dependency management.
  
  USE KUSTOMIZE WHEN: simple overlays (staging vs production).
  USE HELM WHEN: complex charts, community packages (Redis, PostgreSQL).
  USE BOTH: ArgoCD supports Helm + Kustomize in the same Application!
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **K8s resources** | [Ch 18: K8s](18_Kubernetes_Complete.md) — what GitOps deploys |
| **CI/CD (builds images)** | [Ch 19: CI/CD](19_CICD_Pipelines.md) — the build side |
| **Terraform (infra)** | [Ch 20: Terraform](20_Terraform_IaC.md) — provisions K8s cluster |
| **Monitoring (verify)** | [Ch 21: Observability](21_Monitoring_Observability.md) — post-deploy metrics |
| **SRE (error budgets)** | [Ch 22: SRE](22_SRE_Practices.md) — deploy velocity decisions |
| **Service mesh** | [Cloud Native](03_ServiceMesh_CloudNative.md) — Istio + ArgoCD |
| **Docker images** | [Ch 17: Docker](17_Docker_Complete.md) — what CI builds |
| **TLS certs** | [Ch 09: TLS](09_TLS_Encryption.md) — cert-manager + GitOps |
| **Secrets** | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — secrets management |

---


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


> **Navigation**: [← SRE](22_SRE_Practices.md) | [Index](00_INDEX.md)
