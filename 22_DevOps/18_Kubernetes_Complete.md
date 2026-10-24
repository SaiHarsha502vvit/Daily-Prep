> **Navigation**: [← Docker](17_Docker_Complete.md) | [Index](00_INDEX.md) | [Next → CI/CD](19_CICD_Pipelines.md)

# ☸️ Chapter 18: Kubernetes Complete — Orchestrating Containers at Scale

> _"Docker runs ONE container. Kubernetes runs THOUSANDS across HUNDREDS of machines, handles failures, scales automatically, and rolls out updates without downtime. That's the leap."_

---

# PART 1: Why Kubernetes? — The Problem It Solves

---

```
WITH DOCKER ALONE (10 containers):
  You manually: start containers, map ports, restart on crash, place on servers.
  Manageable at small scale.

WITH 500 CONTAINERS ACROSS 50 SERVERS:
  Which server should this container run on? (Resource-aware scheduling)
  Server 12 died — restart its 20 containers somewhere else. (Self-healing)
  Traffic spiked 10x — need more containers NOW. (Auto-scaling)
  New version deploy — don't take down the WHOLE service. (Rolling updates)
  Services need to find each other. (Service discovery)
  Some containers need persistent storage. (Volume management)

  KUBERNETES HANDLES ALL OF THIS AUTOMATICALLY.

KUBERNETES ARCHITECTURE:

  CONTROL PLANE (brain):               WORKER NODES (muscle):
  ┌─────────────────────────┐          ┌──────────────────────┐
  │ API Server              │          │ kubelet              │
  │ (all communication      │          │ (manages pods        │
  │  goes through here)     │←────────→│  on this node)       │
  │                         │          │                      │
  │ etcd                    │          │ kube-proxy           │
  │ (key-value store,       │          │ (network rules,      │
  │  ALL cluster state)     │          │  service routing)    │
  │                         │          │                      │
  │ Scheduler               │          │ Container Runtime    │
  │ (which node for each    │          │ (containerd/CRI-O    │
  │  pod?)                  │          │  runs containers)    │
  │                         │          │                      │
  │ Controller Manager      │          │ ┌──────┐ ┌──────┐    │
  │ (desired state vs actual│          │ │ Pod  │ │ Pod  │    │
  │  state reconciliation)  │          │ │┌────┐│ │┌────┐│    │
  └─────────────────────────┘          │ ││cntr││ ││cntr││    │
                                       │ │└────┘│ │└────┘│    │
                                       │ └──────┘ └──────┘    │
                                       └──────────────────────┘

THE RECONCILIATION LOOP:
  YOU declare: "I want 3 replicas of my-api running."
  K8s: "There are currently 2. Let me start 1 more."
  Server dies (1 pod lost): "There are now 2. Let me start 1 more on a healthy server."

  THIS IS THE CORE PRINCIPLE: declarative desired state → K8s reconciles actual state.
```

---

# PART 2: Core Resources — Pods, Deployments, Services

---

```yaml
# ── POD: the smallest deployable unit ──
# A pod = 1 or more containers that share network + storage.
# In practice: usually 1 container per pod. Multi-container = sidecars.

apiVersion: v1
kind: Pod
metadata:
  name: my-api
  labels:
    app: my-api
    version: v1
spec:
  containers:
    - name: api
      image: myregistry/my-api:1.2.3
      ports:
        - containerPort: 8000
      resources:
        requests: # guaranteed allocation
          memory: "256Mi"
          cpu: "250m" # 250 millicores = 0.25 CPU core
        limits: # max allowed
          memory: "512Mi" # exceeds → OOM killed
          cpu: "500m" # exceeds → throttled (not killed)
      livenessProbe: # "is the process stuck?"
        httpGet:
          path: /health
          port: 8000
        initialDelaySeconds: 15
        periodSeconds: 10
        failureThreshold: 3 # 3 failures → restart container
      readinessProbe: # "is it ready to receive traffic?"
        httpGet:
          path: /ready
          port: 8000
        initialDelaySeconds: 5
        periodSeconds: 5
      startupProbe: # "has it finished starting?"
        httpGet:
          path: /health
          port: 8000
        failureThreshold: 30 # 30 × 10s = 5 minutes to start
        periodSeconds: 10
      env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
      volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
  volumes:
    - name: config
      configMap:
        name: api-config
```

```yaml
# ── DEPLOYMENT: manages pod replicas with rolling updates ──
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # create 1 extra pod during update
      maxUnavailable: 0 # never have fewer than 3 running → zero downtime!
  template:
    metadata:
      labels:
        app: my-api
        version: v1.2.3
    spec:
      terminationGracePeriodSeconds: 30 # time for graceful shutdown
      containers:
        - name: api
          image: myregistry/my-api:1.2.3
          # ... (same as pod spec above)
```

```yaml
# ── SERVICE: stable endpoint for pods (load balancing + discovery) ──
apiVersion: v1
kind: Service
metadata:
  name: my-api-service
  namespace: production
spec:
  type: ClusterIP # internal only (most common for microservices)
  selector:
    app: my-api # route to ALL pods with label app=my-api
  ports:
    - port: 80 # service port (what clients use)
      targetPort: 8000 # pod port (what your app listens on)
      protocol: TCP

# Service types:
# ClusterIP (default): internal only. Accessible within K8s cluster.
# NodePort: exposes on each node's IP at a static port (30000-32767).
# LoadBalancer: creates cloud provider LB (AWS ELB/NLB, GCP LB).
#   Used for: exposing services to the internet.
# ExternalName: alias to external DNS name (CNAME).
```

```yaml
# ── INGRESS: HTTP routing (host/path → service) ──
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: main-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
    - hosts:
        - api.myapp.com
        - www.myapp.com
      secretName: myapp-tls
  rules:
    - host: api.myapp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-api-service
                port:
                  number: 80
    - host: www.myapp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

---

# PART 3: Scaling & Self-Healing

---

```yaml
# ── HORIZONTAL POD AUTOSCALER (HPA) ──
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70 # scale up when CPU > 70%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30 # wait 30s before scaling up more
    scaleDown:
      stabilizationWindowSeconds: 300 # wait 5min before scaling down (avoid flapping)
```

```
SELF-HEALING MECHANISMS:

1. POD RESTART (livenessProbe fails):
   K8s restarts the container. CrashLoopBackOff if repeatedly fails.

2. POD RESCHEDULING (node dies):
   Controller notices pod is gone → schedules new pod on healthy node.

3. READINESS (readinessProbe fails):
   Pod removed from service endpoints → no traffic. Still running (might recover).

4. POD DISRUPTION BUDGET:
   "NEVER have fewer than 2 pods running, even during maintenance."
   kubectl drain node-3 → K8s moves pods to other nodes, respecting the budget.
```

---

# PART 4: Configuration & Secrets

---

```yaml
# ── ConfigMap (non-sensitive configuration) ──
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  LOG_LEVEL: "info"
  CACHE_TTL: "300"
  config.yaml: |
    server:
      port: 8000
      workers: 4
    features:
      analytics: true
      beta_ui: false

# ── Secret (sensitive data, base64 encoded) ──
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0BkYjo1NDMyL215YXBw  # base64 encoded!
  password: c3VwZXJzZWNyZXQ=

# WARNING: K8s Secrets are base64 encoded, NOT encrypted!
# For real production secrets, use:
# - AWS Secrets Manager + External Secrets Operator
# - HashiCorp Vault
# - Sealed Secrets (Bitnami)
# - SOPS (Mozilla) for encrypted secrets in Git
```

```bash
# ── KUBECTL ESSENTIALS ──

# Cluster inspection
kubectl get nodes                      # cluster nodes + status
kubectl get pods -A                    # ALL pods in ALL namespaces
kubectl get pods -o wide               # pods with node + IP info
kubectl get svc,deploy,ing             # multiple resource types

# Debugging
kubectl describe pod my-api-xyz        # detailed status + events
kubectl logs my-api-xyz                # container logs
kubectl logs my-api-xyz -f --tail=50   # follow last 50 lines
kubectl logs my-api-xyz -c sidecar     # specific container in multi-container pod
kubectl exec -it my-api-xyz -- bash    # shell into running pod
kubectl port-forward svc/my-api 8080:80  # local access to cluster service

# Deployment
kubectl apply -f deployment.yaml       # create/update resources
kubectl rollout status deploy/my-api   # watch rollout progress
kubectl rollout history deploy/my-api  # see revision history
kubectl rollout undo deploy/my-api     # rollback to previous version!

# Scaling
kubectl scale deploy/my-api --replicas=5
kubectl autoscale deploy/my-api --min=3 --max=20 --cpu-percent=70

# Namespace management
kubectl create namespace staging
kubectl config set-context --current --namespace=staging  # switch default NS
kubectl get pods -n production         # peek at another namespace
```

---

# PART 5: RBAC — Role-Based Access Control

---

```yaml
# ── WHO CAN DO WHAT IN THE CLUSTER? ──
# RBAC = Role-Based Access Control. K8s default auth model.

# ROLE: permissions within a SINGLE namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
  - apiGroups: [""] # "" = core API group (pods, services, etc.)
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["get", "list"]

---
# ROLEBINDING: attach the role to a user/group/service account
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-binding
  namespace: production
subjects:
  - kind: User
    name: developer@mycompany.com
    apiGroup: rbac.authorization.k8s.io
  - kind: Group
    name: developers # LDAP/OIDC group
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io

---
# CLUSTERROLE: permissions across ALL namespaces
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"] # read-only, no list/watch

---
# SERVICE ACCOUNT: identity for PODS (not humans)
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-service-account
  namespace: production
  annotations:
    # AWS IRSA: map K8s SA to AWS IAM role (no hardcoded creds!)
    eks.amazonaws.com/role-arn: arn:aws:iam::123456:role/api-s3-reader
```

```
RBAC BEST PRACTICES:
  1. LEAST PRIVILEGE: give only the permissions needed. Never cluster-admin.
  2. Use Groups not Users: manage permissions at the group level.
  3. Audit regularly: kubectl auth can-i --list --as=developer@mycompany.com
  4. Service accounts per service: not the default SA!
  5. Disable auto-mounting SA tokens: automountServiceAccountToken: false
```

---

# PART 6: StatefulSets & DaemonSets — Beyond Deployments

---

```yaml
# ── STATEFULSET: for apps that need STABLE identity + PERSISTENT storage ──
# Deployments: pods are interchangeable (cattle). pod-abc123 → pod-xyz789.
# StatefulSets: pods have STABLE names. pod-0, pod-1, pod-2. Always.
# Used for: databases (PostgreSQL, MongoDB), message queues (Kafka), caches.

apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: production
spec:
  serviceName: "postgres" # headless service for DNS
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: pg-secret
                  key: password
          volumeMounts:
            - name: pg-data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates: # each pod gets its OWN PVC!
    - metadata:
        name: pg-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: gp3
        resources:
          requests:
            storage: 100Gi

# This creates:
# Pod: postgres-0 → PVC: pg-data-postgres-0 → PV: 100Gi EBS volume
# Pod: postgres-1 → PVC: pg-data-postgres-1 → PV: 100Gi EBS volume
# Pod: postgres-2 → PVC: pg-data-postgres-2 → PV: 100Gi EBS volume
# If postgres-1 crashes → new pod is STILL postgres-1, mounted to SAME PVC!
```

```yaml
# ── DAEMONSET: run exactly ONE pod per NODE ──
# Used for: log collectors, monitoring agents, network plugins.

apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd-logging
spec:
  selector:
    matchLabels:
      name: fluentd
  template:
    metadata:
      labels:
        name: fluentd
    spec:
      tolerations:
        - key: node-role.kubernetes.io/control-plane
          effect: NoSchedule # run even on control plane nodes!
      containers:
        - name: fluentd
          image: fluent/fluentd:v1.16
          volumeMounts:
            - name: varlog
              mountPath: /var/log # mount host's /var/log into container
      volumes:
        - name: varlog
          hostPath:
            path: /var/log

# Result: every node in the cluster gets exactly 1 fluentd pod.
# New node added? → DaemonSet automatically schedules fluentd on it!
```

---

# PART 7: Network Policies — Pod-Level Firewalls

---

```yaml
# ── DEFAULT DENY ALL (start with zero trust!) ──
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {} # applies to ALL pods in namespace
  policyTypes:
    - Ingress
    - Egress
  # No ingress/egress rules → deny everything!

---
# ── ALLOW API TO RECEIVE TRAFFIC FROM INGRESS CONTROLLER ──
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-to-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: my-api
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx # only from ingress namespace
      ports:
        - port: 8000
          protocol: TCP

---
# ── ALLOW API TO TALK TO DATABASE ──
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: my-api
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - port: 5432
    - to: # also allow DNS!
        - namespaceSelector: {}
      ports:
        - port: 53
          protocol: UDP
        - port: 53
          protocol: TCP

# PATTERN: default deny → whitelist specific traffic paths.
# API → DB: allowed. API → payment-service: allowed.
# API → other-random-service: DENIED.
# Compromised pod can only reach explicitly allowed targets.
```

---

# PART 8: Persistent Storage — Volumes That Survive Pod Death

---

```
KUBERNETES STORAGE MODEL:

  PersistentVolume (PV):     The actual storage (EBS, GCE PD, NFS, Ceph).
  PersistentVolumeClaim (PVC): a REQUEST for storage by a pod.
  StorageClass:               defines HOW to provision PVs dynamically.

  LIFECYCLE:
  1. Admin creates StorageClass: "gp3 = AWS EBS gp3, encrypted, 3000 IOPS."
  2. Pod requests storage via PVC: "I need 50Gi of gp3 storage."
  3. K8s dynamically provisions PV (creates EBS volume in AWS).
  4. K8s binds PVC to PV.
  5. Pod mounts the PVC.
  6. Pod deleted → PVC persists → data survives!
  7. PVC deleted → PV retained OR deleted (based on reclaimPolicy).

  ACCESS MODES:
  ReadWriteOnce (RWO): one node can mount read-write (EBS, default).
  ReadOnlyMany (ROX):  many nodes can mount read-only (NFS, S3).
  ReadWriteMany (RWX): many nodes can mount read-write (EFS, NFS, CephFS).
```

```yaml
# ── StorageClass for AWS EBS gp3 ──
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer # provision in same AZ as pod!
reclaimPolicy: Retain # keep volume after PVC deletion
parameters:
  type: gp3
  encrypted: "true"
  iops: "3000"
  throughput: "125"

---
# ── PVC: requesting 50Gi of gp3 ──
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data
  namespace: production
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: gp3
  resources:
    requests:
      storage: 50Gi
```

---

## 🔗 Cross-References

| Topic                            | Related Content                                                            |
| -------------------------------- | -------------------------------------------------------------------------- |
| **Docker (containers K8s runs)** | [Ch 17: Docker](17_Docker_Complete.md)                                     |
| **Container networking**         | [Ch 04-06](04_Networking_Complete.md) — pod-to-pod, services               |
| **DNS (CoreDNS)**                | [Ch 07: DNS](07_DNS_Complete.md) — K8s internal DNS                        |
| **Load balancing**               | [Ch 11: LB](11_Load_Balancing_Proxies.md) — kube-proxy, Ingress            |
| **Helm charts**                  | [Ch 23: GitOps](23_GitOps_Deployments.md) — Helm + ArgoCD                  |
| **Monitoring**                   | [Ch 21: Observability](21_Monitoring_Observability.md) — Prometheus in K8s |
| **Terraform provisions K8s**     | [Ch 20: Terraform](20_Terraform_IaC.md) — EKS/GKE modules                  |
| **Network policies**             | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — pod firewalls         |
| **Linux (kubelet, cgroups)**     | [Ch 16: Linux](16_Linux_Administration.md)                                 |
| **RBAC for security**            | [Networking & Security](02_Networking_Security.md) — zero trust            |
| **SQL in StatefulSets**          | [SQL Internals](../08_SQL/49_SQL_Internals_Deep.md) — PostgreSQL HA        |


---

## Reality Check

**"Kubernetes runs my containers"** — Kubernetes is a DECLARATIVE RECONCILIATION engine that happens to schedule containers: you declare desired state (three replicas, this image, these resources), and controllers continuously converge reality toward it — which reframes everything as "what is the desired state and why does actual differ" ([Terraform]'s reconciliation model, made continuous and container-native). The mystery behaviors decode from this: the pod that keeps restarting (reconciliation fighting a crash), the deployment that will not progress (a controller blocked on an unschedulable constraint), the deleted pod that reappears (the ReplicaSet reconciling). "Runs my containers" is the outcome; the reconciliation loop is the mechanism you actually debug.

**"Kubernetes makes applications highly available"** — k8s reschedules FAILED pods, which is HA for stateless, well-configured workloads and does nothing for the common failure modes teams actually hit: the missing readiness probe (traffic routed to a pod that is not ready — the [load-balancing] health-check lesson at pod scale), the missing resource requests/limits (the pod OOM-killed or the node oversubscribed into instability), the single replica (nothing to fail over TO), the stateful workload treated as stateless (the database pod rescheduled away from its data), and the app that does not handle graceful shutdown (the SIGTERM ignored, connections dropped on every deploy — [13_DE Docker]'s PID 1). k8s provides the MECHANISM for HA; the availability comes from configuring probes, resources, replicas, disruption budgets, and graceful shutdown correctly — the default is not HA, it is restart-on-crash.

**"kubectl apply and it's deployed"** — apply records desired state; whether it becomes reality is a separate, observable question that teams skip at their peril: the rollout that is stuck (ImagePullBackOff, insufficient resources, failing readiness — the deploy that "succeeded" per apply but has zero healthy pods), the config that applied but the app cannot use (the misconfigured env, the missing secret, the [13_DE Docker] works-locally gap), and the rollout strategy actually in effect (the default rolling update, or the recreate that caused downtime). The discipline is watching the rollout to completion and health, not treating apply's success as deploy's success — apply is "the cluster accepted my intent," which is the beginning of the deploy, not its confirmation.

**"Kubernetes networking just works"** — k8s networking is a layered abstraction whose layers are exactly what you debug: pod-to-pod (the flat network the CNI provides), Services as stable virtual IPs with load balancing (the ClusterIP, and the kube-proxy/iptables/IPVS mechanism behind it), DNS-based service discovery (the service-name resolution, [13_DE Docker networking] and [DNS] combined — the "cannot resolve my-service" that is a namespace or DNS issue), Ingress for external HTTP routing ([load-balancing] at the edge), and NetworkPolicies for segmentation ([networking-security]'s zero-trust — and the default of NO policy meaning all pods can reach all pods, the flat-internal-network risk). "Just works" holds until it does not, and then it is a specific layer — service DNS, endpoint health, network policy, or Ingress config — that the abstraction was hiding.

**"We need Kubernetes to scale"** — Kubernetes is a powerful, COMPLEX platform whose operational cost is frequently underestimated and frequently unjustified at the adopting team's scale ([cloud-native]'s point): the three-engineer team running a cluster spends its scarcest resource on platform toil (upgrades, CNI issues, the etcd that needs care, the security patching) that a managed container service or serverless would have absorbed, and the "scale" invoked as justification is often hypothetical (the app serving modest traffic on a Kubernetes cluster sized for Google). The honest questions: do you have the operational maturity to run it (or a managed control plane), does your scale justify the complexity, and would a simpler platform meet the actual (not aspirational) requirement — because Kubernetes solves real problems at real scale and manufactures problems below it.
