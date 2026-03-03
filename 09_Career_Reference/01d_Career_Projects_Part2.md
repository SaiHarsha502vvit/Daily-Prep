> **Navigation**: [< Previous Chapter](01c_Career_Projects_Part1.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01e_Career_Projects_Part3.md)

---

        app: backend
    ports:
        - name: http
          port: 80
          targetPort: 8080

---
# ============================================
# 3. INGRESS - External HTTP access
# ============================================
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
    name: app-ingress
    namespace: production
    annotations:
        kubernetes.io/ingress.class: nginx
        cert-manager.io/cluster-issuer: letsencrypt-prod
        nginx.ingress.kubernetes.io/rate-limit: "100"
        nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
    tls:
        - hosts:
              - api.example.com
          secretName: api-tls-secret
    rules:
        - host: api.example.com
          http:
              paths:
                  - path: /api
                    pathType: Prefix
                    backend:
                        service:
                            name: backend-service
                            port:
                                number: 80
                  - path: /
                    pathType: Prefix
                    backend:
                        service:
                            name: frontend-service
                            port:
                                number: 80

---
# ============================================
# 4. CONFIGMAP - Configuration data
# ============================================
apiVersion: v1
kind: ConfigMap
metadata:
    name: backend-config
    namespace: production
data:
    application.yml: |
        server:
          port: 8080
        logging:
          level:
            root: INFO
            com.example: DEBUG

---
# ============================================
# 5. SECRET - Sensitive data
# ============================================
apiVersion: v1
kind: Secret
metadata:
    name: db-secrets
    namespace: production
type: Opaque
data:
    username: YWRtaW4= # base64 encoded
    password: cGFzc3dvcmQ=

---
# ============================================
# 6. HORIZONTAL POD AUTOSCALER (HPA)
# ============================================
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
    name: backend-hpa
    namespace: production
spec:
    scaleTargetRef:
        apiVersion: apps/v1
        kind: Deployment
        name: backend-deployment
    minReplicas: 3
    maxReplicas: 10
    metrics:
        - type: Resource
          resource:
              name: cpu
              target:
                  type: Utilization
                  averageUtilization: 70
        - type: Resource
          resource:
              name: memory
              target:
                  type: Utilization
                  averageUtilization: 80
    behavior:
        scaleDown:
            stabilizationWindowSeconds: 300 # Wait 5 min before scaling down
        scaleUp:
            stabilizationWindowSeconds: 60

---
# ============================================
# 7. PERSISTENT VOLUME CLAIM
# ============================================
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
    name: postgres-pvc
    namespace: production
spec:
    accessModes:
        - ReadWriteOnce
    storageClassName: gp3
    resources:
        requests:
            storage: 50Gi

---
# ============================================
# 8. STATEFULSET - For databases
# ============================================
apiVersion: apps/v1
kind: StatefulSet
metadata:
    name: postgres
    namespace: production
spec:
    serviceName: postgres
    replicas: 1
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
                  image: postgres:15
                  ports:
                      - containerPort: 5432
                  env:
                      - name: POSTGRES_PASSWORD
                        valueFrom:
                            secretKeyRef:
                                name: db-secrets
                                key: password
                  volumeMounts:
                      - name: postgres-storage
                        mountPath: /var/lib/postgresql/data
    volumeClaimTemplates:
        - metadata:
              name: postgres-storage
          spec:
              accessModes: ["ReadWriteOnce"]
              storageClassName: gp3
              resources:
                  requests:
                      storage: 50Gi
```

#### Helm - Kubernetes Package Manager

```yaml
# Chart.yaml - Helm chart definition
apiVersion: v2
name: my-app
description: A Helm chart for My Application
type: application
version: 1.0.0
appVersion: "1.2.3"
dependencies:
  - name: postgresql
    version: 12.1.0
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled

---
# values.yaml - Default configuration
replicaCount: 3

image:
  repository: myregistry/backend
  tag: "latest"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: api-tls
      hosts:
        - api.example.com

resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilization: 70

postgresql:
  enabled: true
  auth:
    username: app
    password: ""  # Set via --set
    database: appdb

---
# templates/deployment.yaml - Templated deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.service.targetPort }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

```bash
# Helm Commands Cheatsheet

# Add repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Search charts
helm search repo postgresql

# Install chart
helm install my-release ./my-app \
  --namespace production \
  --create-namespace \
  --set postgresql.auth.password=secretpass \
  --values custom-values.yaml

# Upgrade release
helm upgrade my-release ./my-app \
  --namespace production \
  --set image.tag=v1.3.0

# Rollback
helm rollback my-release 1  # Rollback to revision 1

# List releases
helm list -n production

# Uninstall
helm uninstall my-release -n production

# Template locally (debug)
helm template my-release ./my-app --debug
```

### GitOps with ArgoCD

```yaml
# ArgoCD Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
    name: my-app
    namespace: argocd
spec:
    project: default

    source:
        repoURL: https://github.com/myorg/my-app-manifests.git
        targetRevision: main
        path: kubernetes/production

        # For Helm charts
        helm:
            valueFiles:
                - values-production.yaml
            parameters:
                - name: image.tag
                  value: v1.2.3

    destination:
        server: https://kubernetes.default.svc
        namespace: production

    syncPolicy:
        automated:
            prune: true # Delete resources not in Git
            selfHeal: true # Revert manual changes
        syncOptions:
            - CreateNamespace=true
        retry:
            limit: 5
            backoff:
                duration: 5s
                factor: 2
                maxDuration: 3m

---
# ArgoCD Project
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
    name: production
    namespace: argocd
spec:
    description: Production applications
    sourceRepos:
        - "https://github.com/myorg/*"
    destinations:
        - namespace: production
          server: https://kubernetes.default.svc
    clusterResourceWhitelist:
        - group: ""
          kind: Namespace
    namespaceResourceWhitelist:
        - group: "*"
          kind: "*"
```

```
GITOPS WORKFLOW:
────────────────

1. Developer pushes code to app repo
2. CI pipeline builds & pushes Docker image
3. CI updates image tag in GitOps repo
4. ArgoCD detects change in GitOps repo
5. ArgoCD syncs Kubernetes cluster
6. Application deployed automatically

┌────────────┐     ┌────────────┐     ┌────────────┐
│   Code     │     │   Build    │     │  GitOps    │
│   Repo     │────►│   CI/CD    │────►│   Repo     │
└────────────┘     └────────────┘     └────────────┘
                                            │
                                            │ Watches
                                            ▼
                                      ┌────────────┐
                                      │   ArgoCD   │
                                      └────────────┘
                                            │
                                            │ Syncs
                                            ▼
                                      ┌────────────┐
                                      │ Kubernetes │
                                      │  Cluster   │
                                      └────────────┘
```

---

## Phase 8: Networking Fundamentals

### OSI Model & TCP/IP

```
┌─────────────────────────────────────────────────────────────────┐
│                    OSI MODEL vs TCP/IP                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OSI Model              TCP/IP Model     Protocols              │
│  ─────────              ───────────      ─────────              │
│                                                                  │
│  ┌───────────────┐                                              │
│  │ 7. Application │     ┌─────────────┐  HTTP, HTTPS, FTP,     │
│  ├───────────────┤      │ Application │  SMTP, DNS, SSH,       │
│  │ 6. Presentation│     │             │  WebSocket             │
│  ├───────────────┤      └─────────────┘                        │
│  │ 5. Session    │                                              │
│  ├───────────────┤      ┌─────────────┐                        │
│  │ 4. Transport  │      │  Transport  │  TCP, UDP              │
│  ├───────────────┤      └─────────────┘                        │
│  │ 3. Network    │      ┌─────────────┐  IP, ICMP, ARP         │
│  ├───────────────┤      │  Internet   │                        │
│  │ 2. Data Link  │      └─────────────┘                        │
│  ├───────────────┤      ┌─────────────┐  Ethernet, Wi-Fi       │
│  │ 1. Physical   │      │   Network   │                        │
│  └───────────────┘      │   Access    │                        │
│                         └─────────────┘                        │
│                                                                  │
│  DATA FLOW:                                                      │
│  ─────────                                                       │
│  Application Data                                                │
│       ↓ Add Header                                              │
│  [TCP Header | Data]                                            │
│       ↓ Add Header                                              │
│  [IP Header | TCP Header | Data]                                │
│       ↓ Add Header + Trailer                                    │
│  [Ethernet | IP | TCP | Data | FCS]                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### TCP vs UDP

```
┌─────────────────────────────────────────────────────────────────┐
│                      TCP vs UDP                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Feature              TCP                    UDP                 │
│  ───────              ───                    ───                 │
│  Connection           Connection-oriented    Connectionless     │
│  Reliability          Guaranteed delivery    Best effort        │
│  Ordering             Ordered delivery       No ordering        │
│  Flow Control         Yes (sliding window)   No                 │
│  Error Checking       Checksum + ACK         Checksum only      │
│  Speed                Slower                 Faster             │
│  Header Size          20-60 bytes            8 bytes            │
│  Use Cases            Web, Email, File       Video, Gaming,     │
│                       Transfer               DNS, VoIP          │
│                                                                  │
│  TCP 3-WAY HANDSHAKE:                                           │
│  ───────────────────                                            │
│  Client              Server                                      │
│    │                   │                                         │
│    │──── SYN ─────────►│  "Can we connect?"                     │
│    │                   │                                         │
│    │◄─── SYN-ACK ─────│  "Yes, let's connect"                   │
│    │                   │                                         │
│    │──── ACK ─────────►│  "Great, connected!"                   │
│    │                   │                                         │
│                                                                  │
│  TCP CONNECTION CLOSE (4-WAY):                                  │
│  ────────────────────────────                                   │
│  Client              Server                                      │
│    │──── FIN ─────────►│                                        │
│    │◄─── ACK ─────────│                                        │
│    │◄─── FIN ─────────│                                        │
│    │──── ACK ─────────►│                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### DNS - How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    DNS RESOLUTION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User types: www.example.com                                    │
│                                                                  │
│  ┌──────────┐                                                   │
│  │ Browser  │ 1. Check browser cache                            │
│  └────┬─────┘                                                   │
│       │ Not found                                               │
│  ┌────▼─────┐                                                   │
│  │   OS     │ 2. Check OS cache (/etc/hosts)                    │
│  └────┬─────┘                                                   │
│       │ Not found                                               │
│  ┌────▼─────────────┐                                           │
│  │ Local DNS        │ 3. Query local DNS (ISP/Router)           │
│  │ Resolver         │                                           │
│  └────┬─────────────┘                                           │
│       │ Not in cache                                            │
│  ┌────▼─────────────┐                                           │
│  │ Root DNS         │ 4. Query root server                      │
│  │ Server           │    "Who handles .com?"                    │
│  └────┬─────────────┘                                           │
│       │ Returns TLD server                                      │
│  ┌────▼─────────────┐                                           │
│  │ TLD DNS Server   │ 5. Query .com TLD server                  │
│  │ (.com)           │    "Who handles example.com?"             │
│  └────┬─────────────┘                                           │
│       │ Returns authoritative NS                                │
│  ┌────▼─────────────┐                                           │
│  │ Authoritative    │ 6. Query authoritative server             │
│  │ DNS Server       │    "What's IP for www.example.com?"       │
│  └────┬─────────────┘                                           │
│       │ Returns IP: 93.184.216.34                               │
│       ▼                                                         │
│  IP cached at each level with TTL                               │
│                                                                  │
│  DNS RECORD TYPES:                                              │
│  ────────────────                                               │
│  A      - IPv4 address (example.com → 93.184.216.34)           │
│  AAAA   - IPv6 address                                          │
│  CNAME  - Alias (www.example.com → example.com)                 │
│  MX     - Mail server                                           │
│  TXT    - Text records (SPF, DKIM, verification)               │
│  NS     - Nameserver                                            │
│  SOA    - Start of Authority                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Load Balancing Algorithms

```
┌─────────────────────────────────────────────────────────────────┐
│                  LOAD BALANCING ALGORITHMS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ROUND ROBIN                                                  │
│     Request 1 → Server A                                         │
│     Request 2 → Server B                                         │
│     Request 3 → Server C                                         │
│     Request 4 → Server A (repeat)                               │
│     Best for: Equal server capacity, stateless apps             │
│                                                                  │
│  2. WEIGHTED ROUND ROBIN                                        │
│     Server A (weight: 3) → Gets 3 requests                      │
│     Server B (weight: 2) → Gets 2 requests                      │
│     Server C (weight: 1) → Gets 1 request                       │
│     Best for: Servers with different capacities                 │
│                                                                  │
│  3. LEAST CONNECTIONS                                           │
│     Server A: 5 connections → Skip                              │
│     Server B: 2 connections → Choose this                       │
│     Server C: 8 connections → Skip                              │
│     Best for: Varying request processing times                  │
│                                                                  │
│  4. IP HASH                                                      │
│     hash(client_ip) % num_servers = server_index                │
│     Same client → Same server (session persistence)             │
│     Best for: Stateful applications                             │
│                                                                  │
│  5. LEAST RESPONSE TIME                                         │
│     Choose server with lowest response time                     │
│     Best for: Performance-critical applications                 │
│                                                                  │
│  LAYER 4 vs LAYER 7 LOAD BALANCING:                            │
│  ─────────────────────────────────                              │
│  Layer 4 (Transport):                                           │
│  ├── Works with TCP/UDP                                         │
│  ├── Faster (no content inspection)                             │
│  ├── Can't route based on content                               │
│  └── Example: AWS NLB                                           │
│                                                                  │
│  Layer 7 (Application):                                         │
│  ├── Works with HTTP/HTTPS                                      │
│  ├── Can inspect headers, cookies, URL                          │
│  ├── Content-based routing                                      │
│  └── Example: AWS ALB, Nginx                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### HTTPS/TLS Handshake

```
┌─────────────────────────────────────────────────────────────────┐
│                    TLS 1.3 HANDSHAKE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client                              Server                      │
│    │                                   │                         │
│    │────── ClientHello ──────────────►│                         │
│    │       + Supported Ciphers         │                         │
│    │       + Key Share (DH)            │                         │
│    │                                   │                         │
│    │◄───── ServerHello ───────────────│                         │
│    │       + Chosen Cipher             │                         │
│    │       + Key Share (DH)            │                         │
│    │       + Certificate               │                         │
│    │       + Certificate Verify        │                         │
│    │       + Finished                  │                         │
│    │                                   │                         │
│    │────── Finished ─────────────────►│                         │
│    │                                   │                         │
│    │◄═════ Encrypted Data ═══════════►│                         │
│    │                                   │                         │
│                                                                  │
│  TLS 1.3 IMPROVEMENTS over 1.2:                                 │
│  ├── 1-RTT handshake (was 2-RTT)                               │
│  ├── 0-RTT for repeat connections                               │
│  ├── Removed weak ciphers (RSA key exchange)                   │
│  ├── Forward secrecy mandatory                                  │
│  └── Encrypted handshake (from ServerHello)                    │
│                                                                  │
│  CERTIFICATE VALIDATION:                                        │
│  ──────────────────────                                         │
│  1. Check certificate not expired                               │
│  2. Verify signature chain to root CA                           │
│  3. Check certificate not revoked (OCSP/CRL)                   │
│  4. Verify domain name matches certificate                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔬 DEEP INTERNALS - How Everything ACTUALLY Works

> **This section answers: "What happens at EVERY step when a user accesses your server?"**

### Complete Request Journey: From Browser to Your Code

```
THE BIG PICTURE - WHAT HAPPENS WHEN USER TYPES "myapp.com":
═══════════════════════════════════════════════════════════

Your app runs on: localhost:3000 (inside your server)
But user accesses: https://myapp.com

HOW DOES THIS WORK? Let's trace EVERY step!

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   USER'S BROWSER                     YOUR SERVER                │
│   ──────────────                     ───────────                │
│                                                                  │
│   1. User types: myapp.com                                      │
│          │                                                       │
│          ▼                                                       │
│   2. DNS Resolution                                              │
│      "What's IP of myapp.com?"                                  │
│          │                                                       │
│          ▼                                                       │
│      DNS returns: 54.23.167.89 (Your server's PUBLIC IP)        │
│          │                                                       │
│          ▼                                                       │
│   3. Browser connects to 54.23.167.89:443 (HTTPS = port 443)    │
│          │                                                       │
│          ▼                                                       │
│   4. TLS Handshake (SSL certificate verification)               │
│          │                                                       │
│          ▼                                                       │
│   5. HTTP Request sent:                                          │
│      GET / HTTP/1.1                                              │
│      Host: myapp.com                                             │
│          │                                                       │
│          │                           ┌─────────────────────┐    │
│          │                           │    YOUR SERVER       │    │
│          │                           │                      │    │
│          │                           │  Public IP:          │    │
│          └──────────────────────────►│  54.23.167.89        │    │
│                                      │                      │    │
│                                      │  Nginx listens on    │    │
│                                      │  Port 80/443         │    │
│                                      │         │            │    │
│                                      │         ▼            │    │
│                                      │  Reverse Proxy to    │    │
│                                      │  localhost:3000      │    │
│                                      │         │            │    │
│                                      │         ▼            │    │
│                                      │  Your Node.js/       │    │
│                                      │  Spring Boot App     │    │
│                                      │  (Port 3000)         │    │
│                                      └─────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step: Complete Packet Journey

```
DETAILED BREAKDOWN - EVERY MILLISECOND:
═══════════════════════════════════════

STEP 1: DNS RESOLUTION (50-200ms first time, <1ms cached)
─────────────────────────────────────────────────────────

User types: myapp.com

Browser checks cache → Not found
OS checks /etc/hosts → Not found
OS checks DNS cache → Not found

Query to DNS Resolver (usually ISP):
┌──────────────────────────────────────────────────────────────┐
│ DNS Query Packet:                                             │
│ ─────────────────                                             │
│ Source IP: 192.168.1.100 (User's local IP)                   │
│ Dest IP: 8.8.8.8 (Google DNS or ISP DNS)                     │
│ Source Port: 54321 (random high port)                         │
│ Dest Port: 53 (DNS always uses port 53)                       │
│ Protocol: UDP                                                  │
│ Query: "What is A record for myapp.com?"                      │
└──────────────────────────────────────────────────────────────┘

DNS Response:
┌──────────────────────────────────────────────────────────────┐
│ myapp.com → 54.23.167.89                                      │
│ TTL: 300 seconds (cache for 5 minutes)                        │
└──────────────────────────────────────────────────────────────┘


STEP 2: TCP CONNECTION (3-way handshake, ~30-100ms)
───────────────────────────────────────────────────

Browser knows: Server IP = 54.23.167.89
Browser wants: Connect to port 443 (HTTPS)

Packet 1 - SYN:
┌──────────────────────────────────────────────────────────────┐
│ Source IP: 103.45.67.89 (User's PUBLIC IP via NAT)           │
│ Dest IP: 54.23.167.89                                         │
│ Source Port: 52431 (random)                                   │
│ Dest Port: 443                                                │
│ Flags: SYN                                                    │
│ Sequence: 1000 (random starting number)                       │
│ Window Size: 65535 (how much data can receive)               │
└──────────────────────────────────────────────────────────────┘

Packet 2 - SYN-ACK (Server responds):
┌──────────────────────────────────────────────────────────────┐
│ Source IP: 54.23.167.89                                       │
│ Dest IP: 103.45.67.89                                         │
│ Source Port: 443                                              │
│ Dest Port: 52431                                              │
│ Flags: SYN, ACK                                               │
│ Sequence: 5000 (server's starting number)                     │
│ Acknowledgment: 1001 (client's seq + 1)                       │
└──────────────────────────────────────────────────────────────┘

Packet 3 - ACK (Connection established!):
┌──────────────────────────────────────────────────────────────┐
│ Flags: ACK                                                    │
│ Sequence: 1001                                                │
│ Acknowledgment: 5001                                          │
│ → TCP CONNECTION ESTABLISHED!                                 │
└──────────────────────────────────────────────────────────────┘


STEP 3: TLS HANDSHAKE (~100-300ms)
──────────────────────────────────

Now browser and server exchange encryption keys...

Client Hello:
┌──────────────────────────────────────────────────────────────┐
│ TLS Version: 1.3                                              │
│ Supported Ciphers:                                            │
│   - TLS_AES_256_GCM_SHA384                                   │
│   - TLS_CHACHA20_POLY1305_SHA256                             │
│ Supported Groups: x25519, secp256r1                          │
│ Key Share: [client's public key for DH exchange]             │
│ SNI: myapp.com (Server Name Indication)                       │
└──────────────────────────────────────────────────────────────┘

Server Hello + Certificate:
┌──────────────────────────────────────────────────────────────┐
│ Chosen Cipher: TLS_AES_256_GCM_SHA384                        │
│ Key Share: [server's public key]                              │
│ Certificate: [X.509 certificate for myapp.com]               │
│ Certificate Chain: myapp.com → Intermediate CA → Root CA     │
└──────────────────────────────────────────────────────────────┘

→ Both sides now compute shared secret using Diffie-Hellman
→ All further communication is ENCRYPTED


STEP 4: HTTP REQUEST (inside encrypted TLS tunnel)
──────────────────────────────────────────────────

Encrypted HTTP Request:
┌──────────────────────────────────────────────────────────────┐
│ GET /api/users HTTP/1.1                                       │
│ Host: myapp.com                                               │
│ User-Agent: Chrome/120.0.0.0                                  │
│ Accept: application/json                                      │
│ Accept-Encoding: gzip, deflate, br                           │
│ Connection: keep-alive                                        │
│ Cookie: session=abc123                                        │
│                                                               │
│ (This entire request is encrypted before sending)            │
└──────────────────────────────────────────────────────────────┘


STEP 5: SERVER RECEIVES REQUEST
───────────────────────────────

Request arrives at server's Network Interface Card (NIC)

┌──────────────────────────────────────────────────────────────┐
│                         YOUR SERVER                           │
│                                                               │
│  ┌─────────────┐                                             │
│  │ Network Card│ ← Receives ethernet frame                   │
│  │ (NIC)       │                                             │
│  └──────┬──────┘                                             │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────┐                                             │
│  │ Linux Kernel│ ← Processes IP packet                       │
│  │ Network     │                                             │
│  │ Stack       │                                             │
│  └──────┬──────┘                                             │
│         │                                                     │
│         │ Kernel checks: Which process listens on port 443?  │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────┐                                             │
│  │   Nginx     │ ← Process bound to port 443                 │
│  │ (PID: 1234) │                                             │
│  └──────┬──────┘                                             │
│         │                                                     │
│         │ Nginx reads nginx.conf:                            │
│         │ "For myapp.com, proxy to localhost:3000"           │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────┐                                             │
│  │ Your App    │ ← Your code finally runs!                   │
│  │ (Port 3000) │                                             │
│  └─────────────┘                                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### How Port 80/443 Connects to Port 3000

```
THE KEY CONCEPT: REVERSE PROXY
══════════════════════════════

WHY can't we directly expose port 3000?
──────────────────────────────────────
1. Security: Don't expose app directly
2. SSL Termination: Let Nginx handle HTTPS
3. Multiple apps: Run many apps on one server
4. Load balancing: Distribute traffic
5. Static files: Nginx serves them faster

NGINX CONFIGURATION:
───────────────────

# /etc/nginx/sites-available/myapp.conf

server {
    listen 80;
    server_name myapp.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name myapp.com;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/myapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myapp.com/privkey.pem;

    # Reverse proxy to your app
    location / {
        proxy_pass http://127.0.0.1:3000;  # ← HERE! Forward to port 3000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}


FLOW DIAGRAM:
─────────────

Internet            Your Server
────────            ───────────

Browser ──────────► Port 443 (Nginx)
   │                     │
   │                     │ SSL Termination
   │                     │ (decrypt HTTPS)
   │                     │
   │                     ▼
   │                Port 3000 (Your App)
   │                     │
   │                     │ Process request
   │                     │
   │                     ▼
   │                Response
   │                     │
   │                     │ Encrypt with SSL
   │                     │
   │ ◄───────────────────┘
Response


WHAT HAPPENS IN LINUX KERNEL:
────────────────────────────

$ netstat -tlnp

Proto  Local Address    Foreign Address   State    PID/Program
tcp    0.0.0.0:80       0.0.0.0:*         LISTEN   1234/nginx
tcp    0.0.0.0:443      0.0.0.0:*         LISTEN   1234/nginx
tcp    127.0.0.1:3000   0.0.0.0:*         LISTEN   5678/node

Explanation:
- Nginx (PID 1234) listens on ports 80 and 443 (all interfaces: 0.0.0.0)
- Node.js (PID 5678) listens on port 3000 (only localhost: 127.0.0.1)
- Port 3000 is NOT accessible from outside (127.0.0.1 = localhost only)
```

### Local IP vs Public IP vs NAT

```
IP ADDRESS TYPES - COMPLETE EXPLANATION:
═══════════════════════════════════════

YOUR HOME NETWORK:
─────────────────

┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                  │
│                           │                                      │
│                    Public IP: 103.45.67.89                      │
│                    (Given by ISP)                                │
│                           │                                      │
│                     ┌─────▼─────┐                               │
│                     │  Router   │                               │
│                     │ (NAT)     │                               │
│                     └─────┬─────┘                               │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐              │
│    │ Laptop  │      │ Phone   │      │ Desktop │              │
│    │192.168. │      │192.168. │      │192.168. │              │
│    │  1.100  │      │  1.101  │      │  1.102  │              │
│    └─────────┘      └─────────┘      └─────────┘              │
│                                                                  │
│    These are PRIVATE IPs (not routable on internet)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


PRIVATE IP RANGES (RFC 1918):
────────────────────────────
10.0.0.0    - 10.255.255.255   (Class A: 16 million addresses)
172.16.0.0  - 172.31.255.255   (Class B: 1 million addresses)
192.168.0.0 - 192.168.255.255  (Class C: 65,536 addresses)

These IPs are NOT routable on the public internet!


NAT (Network Address Translation) - How it works:
────────────────────────────────────────────────

Your laptop (192.168.1.100) wants to access google.com

OUTGOING:
┌──────────────────────────────────────────────────────────────┐
│ Original packet from laptop:                                  │
│   Source: 192.168.1.100:54321                                │
│   Dest: 142.250.190.78:443 (google.com)                      │
│                                                               │
│ Router NAT translation table:                                 │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Internal IP:Port    │ External IP:Port  │ Destination │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ 192.168.1.100:54321 │ 103.45.67.89:40001│ google.com  │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ Packet sent to internet:                                      │
│   Source: 103.45.67.89:40001 (public IP)                     │
│   Dest: 142.250.190.78:443                                   │
└──────────────────────────────────────────────────────────────┘

INCOMING (response):
┌──────────────────────────────────────────────────────────────┐
│ Google responds:                                              │
│   Source: 142.250.190.78:443                                 │
│   Dest: 103.45.67.89:40001                                   │
│                                                               │
│ Router looks up NAT table:                                    │
│   40001 → 192.168.1.100:54321                                │
│                                                               │
│ Packet delivered to laptop:                                   │
│   Source: 142.250.190.78:443                                 │
│   Dest: 192.168.1.100:54321                                  │
└──────────────────────────────────────────────────────────────┘


PORT FORWARDING (for servers):
─────────────────────────────

Your home server runs on 192.168.1.50:3000
You want external access

Router port forwarding rule:
┌──────────────────────────────────────────────────────────────┐
│ External: 103.45.67.89:8080                                   │
│ Internal: 192.168.1.50:3000                                   │
│                                                               │
│ Now: http://103.45.67.89:8080 → your server!                 │
└──────────────────────────────────────────────────────────────┘


WHY SERVERS HAVE STATIC PUBLIC IPs:
──────────────────────────────────

Home connection: Dynamic IP (changes periodically)
Server (AWS/Azure): Static Elastic IP (never changes)

Without static IP:
- DNS record becomes invalid when IP changes
- Users can't reach your server

AWS Elastic IP:
- Reserved public IP for your account
- Stays same even if instance restarts
- Can move between instances
```

---

## 🧠 Operating System Internals - Process & Thread Management

### What is a Process?

```
PROCESS - COMPLETE EXPLANATION:
══════════════════════════════

When you run: node server.js

Operating System creates a PROCESS:
┌─────────────────────────────────────────────────────────────────┐
│                         PROCESS                                  │
│                     (PID: 5678)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    VIRTUAL MEMORY SPACE                      ││
│  │                   (4GB on 32-bit, 128TB on 64-bit)          ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                              ││
│  │  HIGH ADDRESSES (e.g., 0xFFFFFFFF)                          ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                    KERNEL SPACE                       │   ││
│  │  │        (OS kernel, not accessible by process)         │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                      STACK                            │   ││
│  │  │    - Function call frames                             │   ││
│  │  │    - Local variables                                  │   ││
│  │  │    - Return addresses                                 │   ││
│  │  │    - Grows DOWNWARD ↓                                 │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                         │                                    ││
│  │                         ▼ (grows down)                       ││
│  │                                                              ││
│  │                         ▲ (grows up)                         ││
│  │                         │                                    ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                      HEAP                             │   ││
│  │  │    - Dynamic memory allocation                        │   ││
│  │  │    - Objects, arrays                                  │   ││
│  │  │    - malloc(), new                                    │   ││
│  │  │    - Grows UPWARD ↑                                   │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                  BSS SEGMENT                          │   ││
│  │  │    - Uninitialized global variables                   │   ││
│  │  │    - static int count;                                │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                  DATA SEGMENT                         │   ││
│  │  │    - Initialized global variables                     │   ││
│  │  │    - static int count = 10;                           │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                  TEXT SEGMENT                         │   ││
│  │  │    - Executable code                                  │   ││
│  │  │    - Read-only                                        │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │  LOW ADDRESSES (e.g., 0x00000000)                           ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  PROCESS CONTROL BLOCK (PCB) - OS maintains this:              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PID: 5678                                                │   │
│  │ State: RUNNING / READY / BLOCKED / ZOMBIE               │   │
│  │ Program Counter: Current instruction address            │   │
│  │ CPU Registers: Saved register values                    │   │
│  │ Memory Limits: Stack/heap boundaries                    │   │
│  │ Open Files: File descriptors [0, 1, 2, 3...]           │   │
│  │ Parent PID: 1234                                        │   │
│  │ Priority: Nice value (-20 to +19)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


PROCESS LIFECYCLE:
─────────────────

    fork()           exec()            wait()
   ┌──────┐        ┌──────┐         ┌──────┐
   │ NEW  │───────►│READY │◄───────►│RUNNING│
   └──────┘        └──────┘         └──────┘
                       ▲                │
                       │                │ I/O request
                       │                ▼
                       │           ┌──────────┐
                       │           │ BLOCKED  │
                       │           │(waiting) │
                       │           └──────────┘
                       │                │
                       └────────────────┘
                         I/O complete
                                        │ exit()
                                        ▼
                                   ┌──────────┐
                                   │ ZOMBIE   │
                                   │(terminated│
                                   │but not   │
                                   │reaped)   │
                                   └──────────┘
```

### What is a Thread?

```
THREAD - COMPLETE EXPLANATION:
═════════════════════════════

Thread = Lightweight process (shares process resources)

┌─────────────────────────────────────────────────────────────────┐
│                         PROCESS                                  │
│                      (PID: 5678)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SHARED BETWEEN ALL THREADS:                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • Code (Text) segment                                        ││
│  │ • Data segment (global variables)                            ││
│  │ • Heap (dynamically allocated memory)                        ││
│  │ • Open files                                                 ││
│  │ • Signal handlers                                            ││
│  │ • Current working directory                                  ││
│  │ • User and group IDs                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  UNIQUE TO EACH THREAD:                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Thread 1   │  │   Thread 2   │  │   Thread 3   │          │
│  │   (Main)     │  │   (Worker)   │  │   (Worker)   │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ Thread ID    │  │ Thread ID    │  │ Thread ID    │          │
│  │ Stack        │  │ Stack        │  │ Stack        │          │
│  │ Registers    │  │ Registers    │  │ Registers    │          │
│  │ Program Cnt  │  │ Program Cnt  │  │ Program Cnt  │          │
│  │ Stack Ptr    │  │ Stack Ptr    │  │ Stack Ptr    │          │
│  │ Priority     │  │ Priority     │  │ Priority     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


THREAD vs PROCESS - KEY DIFFERENCES:
───────────────────────────────────

┌─────────────────────┬──────────────────────┬────────────────────┐
│     Aspect          │      Process         │       Thread       │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Memory              │ Separate address     │ Shared address     │
│                     │ space                │ space              │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Creation time       │ Heavy (~ms)          │ Light (~μs)        │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Context switch      │ Slow (TLB flush)     │ Fast               │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Communication       │ IPC (pipes, sockets, │ Direct memory      │
│                     │ shared memory)       │ access             │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Crash impact        │ Only that process    │ Whole process      │
│                     │ crashes              │ may crash          │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Resource overhead   │ High (own memory,    │ Low (shared        │
│                     │ file descriptors)    │ resources)         │
└─────────────────────┴──────────────────────┴────────────────────┘


THREAD MEMORY - STACK SIZE:
──────────────────────────

Default stack size per thread:
  Linux:   8 MB (can change with ulimit -s)
  Windows: 1 MB
  Java:    512 KB - 1 MB (depends on JVM)

With 100 threads:
  100 × 8MB = 800 MB just for stacks!

This is why thread pools matter!
```

### How Multiple Users Create Threads

```
WEB SERVER THREAD MODEL:
═══════════════════════

When 1000 users hit your server simultaneously...

TRADITIONAL MODEL (Thread per request):
──────────────────────────────────────

User 1 → Thread 1 → Process request → Response → Thread dies
User 2 → Thread 2 → Process request → Response → Thread dies
User 3 → Thread 3 → Process request → Response → Thread dies
...
User 1000 → Thread 1000 → Process request → Response → Thread dies

PROBLEM:
┌──────────────────────────────────────────────────────────────┐
│ 1000 threads × 1MB stack = 1GB RAM just for stacks!          │
│ Thread creation overhead: ~1ms per thread                     │
│ Context switching: OS must switch between 1000 threads        │
│ = SLOW and MEMORY HUNGRY                                      │
└──────────────────────────────────────────────────────────────┘


THREAD POOL MODEL (Reuse threads):
─────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                        THREAD POOL                               │
│                       (e.g., 200 threads)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   REQUEST QUEUE                          │   │
│  │    [Req1] [Req2] [Req3] ... [Req1000]                   │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐              │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│   ┌──────────┐       ┌──────────┐       ┌──────────┐          │
│   │ Thread 1 │       │ Thread 2 │       │Thread 200│          │
│   │ Pick Req │       │ Pick Req │       │ Pick Req │          │
│   │ Process  │       │ Process  │       │ Process  │          │
│   │ Return   │       │ Return   │       │ Return   │          │
│   │ Pick Next│       │ Pick Next│       │ Pick Next│          │
│   └──────────┘       └──────────┘       └──────────┘          │
│                                                                  │
│  Benefits:                                                       │
│  • Only 200 threads × 1MB = 200MB RAM                          │
│  • No thread creation overhead                                  │
│  • Less context switching                                       │
│  • Handles 1000+ requests with 200 threads                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


JAVA SPRING BOOT THREAD MODEL:
─────────────────────────────

# application.properties

# Tomcat thread pool settings
server.tomcat.threads.min-spare=10     # Minimum threads always running
server.tomcat.threads.max=200          # Maximum threads
server.tomcat.max-connections=10000    # Max pending connections
server.tomcat.accept-count=100         # Queue when max connections reached


EVENT LOOP MODEL (Node.js):
──────────────────────────

Node.js uses SINGLE THREAD + Event Loop (non-blocking I/O)

┌─────────────────────────────────────────────────────────────────┐
│                      NODE.JS EVENT LOOP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Single Thread (Main Thread):                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                   EVENT QUEUE                         │   ││
│  │  │  [HTTP Req] [Timer] [File Read Done] [DB Query Done] │   ││
│  │  └──────────────────────────┬───────────────────────────┘   ││
│  │                             │                                ││
│  │                             ▼                                ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                   EVENT LOOP                          │   ││
│  │  │                                                       │   ││
│  │  │  while(true) {                                       │   ││
│  │  │    event = queue.pop()                               │   ││
│  │  │    callback = getCallback(event)                     │   ││
│  │  │    callback()  // Execute synchronously              │   ││
│  │  │  }                                                   │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Background Thread Pool (libuv, 4 threads default):             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • File I/O                                                  ││
│  │  • DNS lookups                                               ││
│  │  • Some crypto operations                                    ││
│  │  • Compression                                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  OS handles (not threads):                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • Network I/O (uses epoll/kqueue/IOCP)                     ││
│  │  • Timers                                                    ││
│  │  • Async DNS (via c-ares)                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

WHY NODE.JS CAN HANDLE MANY CONNECTIONS:
───────────────────────────────────────
• Most time is spent WAITING for I/O (DB, files, network)
• While waiting, event loop handles other requests
• No thread per connection = low memory
• 1 thread can handle 10,000+ concurrent connections!

LIMITATION:
───────────
• CPU-intensive tasks block the event loop
• Heavy computation? Use Worker Threads or separate service
```

### System Overload - What Happens?

```
HOW SYSTEM OVERLOAD HAPPENS:
═══════════════════════════

SCENARIO: Your server gets more traffic than it can handle

┌─────────────────────────────────────────────────────────────────┐
│                    OVERLOAD PROGRESSION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 1: Normal Operation                                      │
│  ─────────────────────────                                      │
│  CPU: 40%   RAM: 60%   Response Time: 50ms                      │
│  Thread Pool: 50/200 threads active                             │
│  ✓ Everything fine                                              │
│                                                                  │
│  Stage 2: High Load                                             │
│  ───────────────────                                            │
│  CPU: 75%   RAM: 80%   Response Time: 200ms                     │
│  Thread Pool: 180/200 threads active                            │
│  ⚠ Getting busy, queue building up                              │
│                                                                  │
│  Stage 3: Saturation                                            │
│  ───────────────────                                            │
│  CPU: 95%   RAM: 90%   Response Time: 2000ms                    │
│  Thread Pool: 200/200 threads (MAX)                             │
│  Queue: 500 requests waiting                                    │
│  ⚠ Requests timing out                                          │
│                                                                  │
│  Stage 4: Collapse                                              │
│  ─────────────────                                              │
│  CPU: 100%  RAM: 98%   Response Time: TIMEOUT                   │
│  Thread Pool: All threads busy, new connections rejected        │
│  Queue: FULL (10000), dropping requests                         │
│  ✗ System unresponsive                                          │
│                                                                  │
│  Stage 5: OOM (Out of Memory)                                   │
│  ───────────────────────────                                    │
│  RAM: 100%                                                       │
│  OOM Killer: Kills processes to free memory                     │
│  ✗ Your app may be killed                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


WHAT HAPPENS IN EACH RESOURCE:
─────────────────────────────

CPU OVERLOAD:
┌──────────────────────────────────────────────────────────────┐
│ • Context switching overhead increases                        │
│ • CPU spends more time switching than doing work             │
│ • Scheduler can't keep up                                    │
│ • "Thrashing" - system doing work but nothing productive     │
└──────────────────────────────────────────────────────────────┘

RAM OVERLOAD:
┌──────────────────────────────────────────────────────────────┐
│ • Swap starts being used (disk as RAM - VERY SLOW)           │
│ • Constant swapping = "thrashing"                            │
│ • OOM killer may kill processes                              │
│ • malloc() starts failing                                    │
└──────────────────────────────────────────────────────────────┘

THREAD POOL OVERLOAD:
┌──────────────────────────────────────────────────────────────┐
│ • All threads busy                                           │
│ • New requests queue up                                      │
│ • Queue fills up                                             │
│ • New connections rejected (503 Service Unavailable)         │
└──────────────────────────────────────────────────────────────┘

NETWORK OVERLOAD:
┌──────────────────────────────────────────────────────────────┐
│ • Accept queue full (pending TCP connections)                │
│ • Packets dropped                                            │
│ • Connections refused or timing out                          │
│ • Bandwidth saturated                                        │
└──────────────────────────────────────────────────────────────┘


PROTECTION MECHANISMS:
─────────────────────

1. CONNECTION LIMITS:
   server.tomcat.max-connections=10000

2. RATE LIMITING:
   Max 100 requests/second per IP

3. CIRCUIT BREAKER:
   If service unhealthy → stop sending requests

4. LOAD BALANCER HEALTH CHECKS:
   Unhealthy server → remove from pool

5. AUTO-SCALING:
   CPU > 80% → spawn new server instances

6. BACKPRESSURE:
   Tell clients to slow down (HTTP 429)


MONITORING COMMANDS:
───────────────────

# CPU per process
$ top
$ htop

# Memory usage
$ free -m
$ cat /proc/meminfo

# Open files and connections
$ lsof -p <pid>
$ ss -s

# Thread count for process
$ ps -p <pid> -T | wc -l

# System load average
$ uptime
# Load average: 4.00, 3.50, 3.00
# (last 1 min, 5 min, 15 min)
# If load > number of CPU cores → system overloaded
```

### Complete Request Processing - OS Level

```
COMPLETE PICTURE: HTTP REQUEST → RESPONSE:
═════════════════════════════════════════

Step-by-step what happens in the OS:

1. PACKET ARRIVES AT SERVER:
───────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ Network Interface Card (NIC) receives electrical signals     │
│                         │                                    │
│                         ▼                                    │
│ NIC decodes to ethernet frame                               │
│                         │                                    │
│                         ▼                                    │
│ NIC raises HARDWARE INTERRUPT (IRQ)                         │
│                         │                                    │
│                         ▼                                    │
│ CPU pauses current work, runs interrupt handler             │
│                         │                                    │
│                         ▼                                    │
│ Interrupt handler copies frame to kernel buffer             │
│ (ring buffer / DMA transfer)                                │
└──────────────────────────────────────────────────────────────┘

2. KERNEL PROCESSES PACKET:
──────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ Network Stack Processing (softirq context):                  │
│                                                              │
│ Layer 2 (Data Link):                                        │
│   - Verify ethernet checksum                                │
│   - Extract destination MAC                                 │
│   - If not for us, drop (or forward if router)             │
│                         │                                    │
│                         ▼                                    │
│ Layer 3 (Network):                                          │
│   - Parse IP header                                         │
│   - Verify IP checksum                                      │
│   - Check if destination IP is ours                         │
│   - Firewall rules (iptables/nftables)                     │
│                         │                                    │
│                         ▼                                    │
│ Layer 4 (Transport):                                        │
│   - Parse TCP header                                        │
│   - Find matching socket (by src/dst IP:port)              │
│   - Verify TCP checksum                                     │
│   - Handle TCP state machine (SYN/ACK/FIN etc)             │
│                         │                                    │
│                         ▼                                    │
│ Socket Receive Queue:                                       │
│   - Data added to socket's receive buffer                  │
│   - Process waiting on recv() is woken up                  │
└──────────────────────────────────────────────────────────────┘

3. APPLICATION RECEIVES DATA:
────────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ Nginx Process:                                               │
│                                                              │
│ epoll_wait() returns → "Socket 42 has data"                 │
│                         │                                    │
│                         ▼                                    │
│ read(socket_fd, buffer, size)                               │
│   - Copies data from kernel buffer to user buffer          │
│   - Context switch: user mode → kernel mode → user mode    │
│                         │                                    │
│                         ▼                                    │
│ Parse HTTP request                                          │
│   - Method: GET                                             │
│   - Path: /api/users                                        │
│   - Headers: Host, Accept, Cookie...                        │
│                         │                                    │
│                         ▼                                    │
│ Determine action (based on nginx.conf)                      │
│   - Static file? → Read from disk, send                    │
│   - Proxy pass? → Forward to backend                       │
└──────────────────────────────────────────────────────────────┘

4. PROXY TO BACKEND (localhost:3000):
────────────────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ Nginx creates NEW connection to localhost:3000              │
│                                                              │
│ connect(backend_socket, "127.0.0.1:3000")                   │
│   - TCP handshake (all in kernel, super fast on localhost) │
│                         │                                    │
│                         ▼                                    │
│ write(backend_socket, http_request)                         │
│   - Send HTTP request to backend                            │
│                         │                                    │
│                         ▼                                    │
│ Kernel: localhost traffic never leaves machine             │
│   - No NIC involved                                         │
│   - Data goes through loopback interface (lo)              │
│   - Super fast                                              │
└──────────────────────────────────────────────────────────────┘

5. YOUR APPLICATION CODE RUNS:
─────────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ Node.js / Spring Boot:                                       │
│                                                              │
│ Event loop / Thread pool thread picks up request            │
│                         │                                    │
│                         ▼                                    │
│ Parse request, route to handler                             │
│                         │                                    │
│                         ▼                                    │
│ Handler executes:                                           │
│   - Validate input                                          │
│   - Query database (await/blocking)                         │
│   - Process business logic                                  │
│   - Format response                                         │
│                         │                                    │
│                         ▼                                    │
│ Write response to socket                                    │
└──────────────────────────────────────────────────────────────┘

6. RESPONSE TRAVELS BACK:
────────────────────────

Same path in reverse:
Your app → Nginx → Kernel → NIC → Internet → User's browser


TOTAL TIME BREAKDOWN (typical):
──────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│ DNS Resolution:           0-50ms (cached) / 50-200ms (not) │
│ TCP Handshake:           15-50ms                           │
│ TLS Handshake:           50-150ms                          │
│ Request to Server:       10-50ms (network latency)         │
│ Server Processing:       10-500ms (depends on work)        │
│ Response to Client:      10-50ms (network latency)         │
│ Browser Render:          50-500ms                          │
│ ────────────────────────────────────────────────────────── │
│ TOTAL:                   145ms - 1500ms                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX Deep Internals

### How Browser Renders a Page

```
BROWSER RENDERING PIPELINE:
═══════════════════════════

When browser receives HTML:

┌─────────────────────────────────────────────────────────────────┐
│                    CRITICAL RENDERING PATH                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. HTML PARSING → DOM Tree                                     │
│  ──────────────────────────                                     │
│                                                                  │
│  <html>                       ┌─────────┐                       │
│    <head>                     │  html   │                       │
│      <title>                  └────┬────┘                       │
│    </head>              ┌──────────┼──────────┐                 │
│    <body>               │                     │                 │
│      <div>          ┌───▼───┐            ┌───▼───┐              │
│        <p>          │  head │            │  body │              │
│      </div>         └───┬───┘            └───┬───┘              │
│    </body>              │                    │                   │
│  </html>            ┌───▼───┐            ┌───▼───┐              │
│                     │ title │            │  div  │              │
│                     └───────┘            └───┬───┘              │
│                                              │                   │
│                                          ┌───▼───┐              │
│                                          │   p   │              │
│                                          └───────┘              │
│                                                                  │
│  2. CSS PARSING → CSSOM Tree                                    │
│  ───────────────────────────                                    │
│                                                                  │
│  body { color: black; }       ┌─────────┐                       │
│  div { display: flex; }       │  body   │                       │
│  p { font-size: 16px; }       │ color:  │                       │
│                               │  black  │                       │
│                               └────┬────┘                       │
│                                    │                             │
│                               ┌────▼────┐                       │
│                               │   div   │                       │
│                               │display: │                       │
│                               │  flex   │                       │
│                               └────┬────┘                       │
│                                    │                             │
│                               ┌────▼────┐                       │
│                               │    p    │                       │
│                               │font-size│                       │
│                               │  16px   │                       │
│                               └─────────┘                       │
│                                                                  │
│  3. RENDER TREE (DOM + CSSOM)                                   │
│  ────────────────────────────                                   │
│                                                                  │
│  • Combines DOM and CSSOM                                       │
│  • Only visible elements (no <head>, display:none)             │
│  • Contains computed styles                                     │
│                                                                  │
│  4. LAYOUT (Reflow)                                             │
│  ──────────────────                                             │
│                                                                  │
│  • Calculate exact position and size                            │
│  • "Where does each element go?"                                │
│  • Triggered by: resize, content change, style change          │
│                                                                  │
│  5. PAINT                                                        │
│  ───────                                                        │
│                                                                  │
│  • Convert to actual pixels                                     │
│  • Draw text, colors, shadows, borders                         │
│  • Create paint records                                         │
│                                                                  │
│  6. COMPOSITE                                                    │
│  ────────────                                                   │
│                                                                  │
│  • Combine layers (for animations, overlaps)                   │
│  • Send to GPU                                                  │
│  • Display on screen                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


PERFORMANCE IMPACT:
──────────────────

┌────────────────────┬──────────────────────────────────────────┐
│ Action             │ Triggers                                 │
├────────────────────┼──────────────────────────────────────────┤
│ Change color       │ Paint only (fast)                        │
│ Change font-size   │ Layout + Paint + Composite (slow)       │
│ Change transform   │ Composite only (fastest)                 │
│ Add DOM element    │ Layout + Paint + Composite (slow)       │
│ Scroll             │ Composite (fast with layers)            │
└────────────────────┴──────────────────────────────────────────┘

OPTIMIZATION TIPS:
─────────────────
• Use transform for animations (GPU accelerated)
• Avoid layout thrashing (batch DOM reads/writes)
• Use will-change for elements that will animate
• Lazy load below-fold content
```

### JavaScript Event Loop (Browser)

```
BROWSER EVENT LOOP:
══════════════════

JavaScript is single-threaded, but handles async through Event Loop

┌─────────────────────────────────────────────────────────────────┐
│                    JAVASCRIPT RUNTIME                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      CALL STACK                              ││
│  │                                                              ││
│  │  • Executes code synchronously                              ││
│  │  • LIFO (Last In, First Out)                                ││
│  │  • One function at a time                                   ││
│  │                                                              ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ calculateSum()                                       │   ││
│  │  ├─────────────────────────────────────────────────────┤   ││
│  │  │ processData()                                        │   ││
│  │  ├─────────────────────────────────────────────────────┤   ││
│  │  │ main()                                               │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              │ When call stack empty,           │
│                              │ event loop checks queues         │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────── │
│  │                      EVENT LOOP                              │
│  │                                                              │
│  │  while (true) {                                             │
│  │    if (callStack.isEmpty()) {                               │
│  │      // 1. Run ALL microtasks first                         │
│  │      while (microtaskQueue.hasItems()) {                   │
│  │        task = microtaskQueue.dequeue()                     │
│  │        callStack.push(task)                                │
│  │        execute(task)                                       │
│  │      }                                                      │
│  │      // 2. Run ONE macrotask                               │
│  │      if (macrotaskQueue.hasItems()) {                      │
│  │        task = macrotaskQueue.dequeue()                     │
│  │        callStack.push(task)                                │
│  │        execute(task)                                       │
│  │      }                                                      │
│  │      // 3. Render (if needed, ~60fps = every 16.67ms)      │
│  │      if (shouldRender()) {                                  │
│  │        render()                                             │
│  │      }                                                      │
│  │    }                                                        │
│  │  }                                                          │
│  └──────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              MICROTASK QUEUE (High Priority)                 ││
│  │                                                              ││
│  │  • Promise.then/catch/finally                               ││
│  │  • queueMicrotask()                                         ││
│  │  • MutationObserver                                         ││
│  │                                                              ││
│  │  [Promise1] [Promise2] [Promise3]                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              MACROTASK QUEUE (Lower Priority)                ││
│  │                                                              ││
│  │  • setTimeout/setInterval                                    ││
│  │  • DOM events (click, scroll)                               ││
│  │  • Network responses (fetch/XHR)                            ││
│  │  • I/O operations                                            ││
│  │                                                              ││
│  │  [Timeout1] [Click] [FetchResponse]                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


EXAMPLE - ORDER OF EXECUTION:
────────────────────────────

console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

OUTPUT: 1, 4, 3, 2

WHY?
1. console.log('1') → sync, runs immediately
4. console.log('4') → sync, runs immediately
3. Promise.then → microtask, runs after sync
2. setTimeout → macrotask, runs after microtasks
```

### User Experience Metrics

```
CORE WEB VITALS (Google):
═════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                      CORE WEB VITALS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LCP (Largest Contentful Paint)                              │
│  ─────────────────────────────────                              │
│  "When did main content load?"                                  │
│                                                                  │
│  Good: ≤ 2.5s    Needs Work: 2.5-4s    Poor: > 4s              │
│                                                                  │
│  Measures: Largest image, video, or text block                 │
│                                                                  │
│  Improve:                                                        │
│  • Optimize images (WebP, proper sizing)                       │
│  • Preload critical resources                                  │
│  • Use CDN                                                      │
│  • Remove render-blocking CSS/JS                               │
│                                                                  │
│                                                                  │
│  2. FID (First Input Delay) → INP (Interaction to Next Paint)  │
│  ────────────────────────────────────────────────────────────   │
│  "How quickly does page respond to interaction?"                │
│                                                                  │
│  Good: ≤ 100ms   Needs Work: 100-300ms   Poor: > 300ms         │
│                                                                  │
│  Measures: Time from click to browser response                  │
│                                                                  │
│  Improve:                                                        │
│  • Break up long tasks (< 50ms each)                           │
│  • Use web workers for heavy computation                       │
│  • Reduce JavaScript execution time                            │
│  • Defer non-critical JavaScript                               │
│                                                                  │
│                                                                  │
│  3. CLS (Cumulative Layout Shift)                               │
│  ────────────────────────────────                               │
│  "Does content jump around while loading?"                      │
│                                                                  │
│  Good: ≤ 0.1     Needs Work: 0.1-0.25    Poor: > 0.25          │
│                                                                  │
│  Measures: Unexpected layout shifts                             │
│                                                                  │
│  Improve:                                                        │
│  • Set explicit dimensions on images/videos                    │
│  • Reserve space for ads/embeds                                │
│  • Avoid inserting content above existing content              │
│  • Use CSS contain property                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


PAGE LOAD TIMELINE:
──────────────────

Time →
0ms                                                           2000ms
│                                                               │
├─────┬─────┬─────────────┬───────────────────┬────────────────┤
│     │     │             │                   │                │
│ DNS │ TCP │ TLS         │ First Byte        │ DOM Complete   │
│     │ +   │             │ (TTFB)            │                │
│     │ TLS │             │                   │                │
│     │     │             │                   │                │
└─────┴─────┴─────────────┴───────────────────┴────────────────┘

TTFB (Time to First Byte): < 600ms
FCP (First Contentful Paint): < 1.8s
LCP (Largest Contentful Paint): < 2.5s
TTI (Time to Interactive): < 3.8s
```

---

## 🔬 Docker & Kubernetes Deep Internals

### How Docker Containers Work

```
CONTAINER vs VIRTUAL MACHINE - INTERNAL DIFFERENCE:
══════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│              VIRTUAL MACHINE                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    YOUR HOST OS                          │   │
│  │                    (Windows/Mac)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    HYPERVISOR                            │   │
│  │               (VirtualBox/VMware)                        │   │
│  │                                                          │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │   │     VM 1     │  │     VM 2     │  │     VM 3     │  │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤  │   │
│  │   │   Your App   │  │   Your App   │  │   Your App   │  │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤  │   │
│  │   │  Libraries   │  │  Libraries   │  │  Libraries   │  │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤  │   │
│  │   │   FULL OS    │  │   FULL OS    │  │   FULL OS    │  │   │
│  │   │ (Ubuntu 2GB) │  │ (CentOS 3GB) │  │ (Alpine 1GB) │  │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                          │   │
│  │   Each VM has FULL kernel = Heavy (GBs), slow startup   │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│              DOCKER CONTAINERS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    HOST OS KERNEL                        │   │
│  │                  (Linux/Windows)                         │   │
│  │                                                          │   │
│  │  Kernel provides isolation through:                     │   │
│  │  • NAMESPACES (what container can SEE)                  │   │
│  │  • CGROUPS (what container can USE)                     │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    DOCKER ENGINE                         │   │
│  │                                                          │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │   │ Container 1  │  │ Container 2  │  │ Container 3  │  │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤  │   │
│  │   │   Your App   │  │   Your App   │  │   Your App   │  │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤  │   │
│  │   │  Libraries   │  │  Libraries   │  │  Libraries   │  │   │
│  │   │   (50 MB)    │  │   (30 MB)    │  │   (20 MB)    │  │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │         │                 │                 │            │   │
│  │         └─────────────────┼─────────────────┘            │   │
│  │                           │                              │   │
│  │                    SHARED KERNEL                         │   │
│  │                    (No OS per container!)               │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Containers share host kernel = Light (MBs), instant start     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


LINUX NAMESPACES - HOW ISOLATION WORKS:
──────────────────────────────────────

Namespaces make container think it has its own:

┌──────────────────┬────────────────────────────────────────────────┐
│ Namespace        │ What it isolates                               │
├──────────────────┼────────────────────────────────────────────────┤
│ PID              │ Process IDs (Container sees PID 1 as init)    │
│                  │ Can't see host processes                       │
├──────────────────┼────────────────────────────────────────────────┤
│ NET              │ Network interfaces, ports, routing             │
│                  │ Container has own eth0, localhost              │
├──────────────────┼────────────────────────────────────────────────┤
│ MNT              │ Filesystem mounts                              │
│                  │ Container sees only its own files              │
├──────────────────┼────────────────────────────────────────────────┤
│ UTS              │ Hostname                                       │
│                  │ Container can have own hostname                │
├──────────────────┼────────────────────────────────────────────────┤
│ IPC              │ Inter-process communication                    │
│                  │ Shared memory, message queues                  │
├──────────────────┼────────────────────────────────────────────────┤
│ USER             │ User and group IDs                             │
│                  │ Root in container ≠ root on host              │
└──────────────────┴────────────────────────────────────────────────┘


CGROUPS - RESOURCE LIMITING:
───────────────────────────

docker run --memory=512m --cpus=0.5 myapp

┌──────────────────────────────────────────────────────────────────┐
│                     CGROUP LIMITS                                 │
│                                                                   │
│  Memory:                                                          │
│  /sys/fs/cgroup/memory/docker/<container_id>/memory.limit_in_bytes│
│  → 536870912 (512 MB)                                            │
│  If exceeded → Container killed (OOM)                            │
│                                                                   │
│  CPU:                                                             │
│  /sys/fs/cgroup/cpu/docker/<container_id>/cpu.cfs_quota_us       │
│  → 50000 (50% of one CPU core)                                   │
│                                                                   │
│  I/O:                                                             │
│  Can limit disk read/write speed                                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Docker Image Layers

```
HOW DOCKER IMAGES WORK:
══════════════════════

Dockerfile:
┌────────────────────────────────────────────────────────────────┐
│ FROM openjdk:17-slim                                           │
│ WORKDIR /app                                                   │
│ COPY target/*.jar app.jar                                      │
│ EXPOSE 8080                                                    │
│ CMD ["java", "-jar", "app.jar"]                               │
└────────────────────────────────────────────────────────────────┘

Creates layered image:
┌─────────────────────────────────────────────────────────────────┐
│                    IMAGE LAYERS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 5: CMD ["java", "-jar", "app.jar"]  (metadata)    │   │
│  │ SHA256: abc123... Size: 0 bytes                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 4: EXPOSE 8080                       (metadata)    │   │
│  │ SHA256: def456... Size: 0 bytes                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 3: COPY app.jar                      (your code)   │   │
│  │ SHA256: ghi789... Size: 50 MB                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 2: WORKDIR /app                                    │   │
│  │ SHA256: jkl012... Size: 0 bytes                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 1: openjdk:17-slim                 (base image)    │   │
│  │ SHA256: mno345... Size: 200 MB                          │   │
│  │ Contains: Debian + JDK 17                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TOTAL: ~250 MB                                                 │
│                                                                  │
│  KEY INSIGHT:                                                    │
│  • Layers are READ-ONLY                                         │
│  • Layers are CACHED and REUSED                                 │
│  • If Layer 1 unchanged, Docker uses cached version            │
│  • Only Layer 3 (your code) changes on rebuild                 │
│  • Second build: ~5 seconds instead of 5 minutes!              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


CONTAINER WRITABLE LAYER:
────────────────────────

When container runs:
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         CONTAINER LAYER (Read-Write)                     │   │
│  │                                                          │   │
│  │  • Log files written by app                             │   │
│  │  • Temp files                                           │   │
│  │  • Runtime data                                         │   │
│  │                                                          │   │
│  │  DELETED when container stops!                          │   │
│  │  (Unless using volumes)                                  │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          │ Union Mount (OverlayFS)               │
│                          │                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         IMAGE LAYERS (Read-Only)                         │   │
│  │                                                          │   │
│  │  Layer 5, Layer 4, Layer 3, Layer 2, Layer 1            │   │
│  │                                                          │   │
│  │  SHARED between all containers using same image!        │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  10 containers from same image = 1 copy of image layers        │
│  + 10 small writable layers                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Kubernetes Internals

```
KUBERNETES ARCHITECTURE - DEEP DIVE:
═══════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                   KUBERNETES CLUSTER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  CONTROL PLANE                           │   │
│  │               (Master Node)                              │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │              API SERVER                           │   │   │
│  │  │                                                   │   │   │
│  │  │  • All communication goes through here           │   │   │
│  │  │  • Validates requests                            │   │   │
│  │  │  • Updates etcd                                  │   │   │
│  │  │  • Exposes REST API                              │   │   │
│  │  │                                                   │   │   │
│  │  │  kubectl get pods → API Server → etcd → response│   │   │
│  │  │                                                   │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                          │                               │   │
│  │              ┌───────────┴───────────┐                  │   │
│  │              │                       │                  │   │
│  │  ┌───────────▼──────────┐  ┌────────▼─────────┐        │   │
│  │  │     ETCD            │  │  CONTROLLER      │        │   │
│  │  │                      │  │  MANAGER         │        │   │
│  │  │  • Distributed       │  │                  │        │   │
│  │  │    key-value store   │  │  • ReplicaSet    │        │   │
│  │  │  • Stores all        │  │    Controller    │        │   │
│  │  │    cluster state     │  │  • Deployment    │        │   │
│  │  │  • "Source of truth" │  │    Controller    │        │   │
