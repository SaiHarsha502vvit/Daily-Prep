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

> **Navigation**: [← SRE](22_SRE_Practices.md) | [Index](00_INDEX.md)
