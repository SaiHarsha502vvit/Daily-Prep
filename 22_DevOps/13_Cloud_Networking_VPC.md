> **Navigation**: [← WiFi & APs](12_WiFi_AP_Enterprise.md) | [Index](00_INDEX.md) | [Next → SSH](14_SSH_Remote_Access.md)

# ☁️ Chapter 13: Cloud Networking (AWS VPC) — Virtual Networks in the Cloud

> _"In the cloud, you don't buy cables and switches — you define networks with code. But the CONCEPTS are identical. Subnets, routing tables, firewalls, NAT — it's all there, just software-defined."_

---

# PART 1: VPC Architecture — Your Private Cloud Network

---

```
AWS VPC (Virtual Private Cloud):
  Your own isolated section of the AWS cloud.
  You choose the CIDR block (e.g., 10.0.0.0/16 = 65,536 IPs).
  Inside the VPC: you create subnets, route tables, gateways, security rules.
  
  ANALOGY: A VPC is like buying a plot of land.
  You decide: where to put the public parking lot (public subnet),
  where the private offices go (private subnet), where the security gates are (SG/NACL),
  and how visitors get in (Internet Gateway).

VPC COMPONENTS:

  ┌────────────────────────── VPC: 10.0.0.0/16 ──────────────────────────┐
  │                                                                       │
  │  ┌─── PUBLIC SUBNET ──┐     ┌─── PRIVATE SUBNET ─┐                  │
  │  │ 10.0.1.0/24         │     │ 10.0.2.0/24         │                  │
  │  │                     │     │                     │                  │
  │  │ ┌───────────┐       │     │ ┌───────────┐       │                  │
  │  │ │ Web Server│       │     │ │ Database  │       │                  │
  │  │ │ (public IP)│      │     │ │ (no pub IP)│      │                  │
  │  │ └───────────┘       │     │ └───────────┘       │                  │
  │  │                     │     │                     │                  │
  │  │ ┌───────────┐       │     │ ┌───────────┐       │                  │
  │  │ │ NAT GW    │       │     │ │ App Server│       │                  │
  │  │ └───────────┘       │     │ └───────────┘       │                  │
  │  └─────────────────────┘     └─────────────────────┘                  │
  │          ↕                           ↕                                │
  │  ┌─────────────┐           ┌─────────────┐                           │
  │  │ Route Table │           │ Route Table │                           │
  │  │ 0.0.0.0→IGW│           │ 0.0.0.0→NAT│                           │
  │  └─────────────┘           └─────────────┘                           │
  │          ↕                                                            │
  │  ┌─────────────┐                                                     │
  │  │Internet GW  │ ←→ Internet                                        │
  │  └─────────────┘                                                     │
  └───────────────────────────────────────────────────────────────────────┘

PUBLIC SUBNET:
  Route table has: 0.0.0.0/0 → Internet Gateway.
  Instances can have public IPs → reachable from internet.
  For: Web servers, load balancers, bastion hosts.

PRIVATE SUBNET:
  Route table has: 0.0.0.0/0 → NAT Gateway (in public subnet).
  NO Internet Gateway route → instances are NOT reachable from internet.
  Can still reach internet (for updates, API calls) via NAT Gateway.
  For: Databases, app servers, internal services.

SUBNET DESIGN (best practices):
  2+ Availability Zones for redundancy:
  Public-AZ1:  10.0.1.0/24   | Public-AZ2:  10.0.3.0/24
  Private-AZ1: 10.0.2.0/24   | Private-AZ2: 10.0.4.0/24
  
  If AZ1 goes down → traffic shifts to AZ2 automatically.
```

---

# PART 2: Advanced VPC Features

---

```
VPC PEERING:
  Connect two VPCs → instances can communicate using PRIVATE IPs.
  No internet transit. Traffic stays on AWS backbone.
  Cross-account and cross-region supported!
  
  Limitation: NOT transitive! VPC-A peers with VPC-B, VPC-B peers with VPC-C.
  VPC-A CANNOT reach VPC-C through VPC-B. Must create separate peering.

TRANSIT GATEWAY:
  Solves the peering problem. Hub-and-spoke model.
  One Transit Gateway → all VPCs connect to it → full mesh connectivity.
  
  10 VPCs with peering: 10 × 9 / 2 = 45 peering connections!
  10 VPCs with Transit Gateway: 10 connections (one per VPC to the hub).

VPC ENDPOINTS (PrivateLink):
  Access AWS services (S3, DynamoDB, SQS) WITHOUT going through the internet!
  Traffic stays on AWS private network.
  
  Gateway Endpoint: S3, DynamoDB (free!). Adds route to VPC route table.
  Interface Endpoint: everything else (SQS, Secrets Manager, etc.). Creates ENI in your subnet.
  
  WHY: security (no internet exposure), latency (AWS backbone), cost (no NAT GW charges).

ELASTIC IP (EIP):
  Static public IPv4 address. Doesn't change when instance stops/starts.
  Cost: free when ATTACHED to a running instance. $3.65/month when idle.
  Use: NAT Gateway, bastion hosts, services that need stable IPs.

ELASTIC NETWORK INTERFACE (ENI):
  Virtual network card. Has: private IP, MAC, security groups.
  Can be detached from one instance and attached to another.
  Use: failover (move ENI with its IP to a healthy instance), multi-homed instances.
```

```hcl
# ── TERRAFORM: Production-Ready VPC (multi-AZ) ──

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false    # one NAT GW per AZ (HA!)
  one_nat_gateway_per_az = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs (network traffic logging)
  enable_flow_log                      = true
  create_flow_log_cloudwatch_log_group = true
  flow_log_max_aggregation_interval    = 60

  # Tags for cost tracking
  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Database subnet group (for RDS)
resource "aws_db_subnet_group" "database" {
  name       = "production-db"
  subnet_ids = module.vpc.database_subnets
}

# VPC Endpoint for S3 (free, keeps traffic off internet)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = module.vpc.vpc_id
  service_name = "com.amazonaws.us-east-1.s3"
  route_table_ids = module.vpc.private_route_table_ids
}
```

---

# PART 3: AWS vs GCP vs Azure Comparison

---

```
NETWORKING CONCEPT     │ AWS                │ GCP                 │ AZURE
───────────────────────┼────────────────────┼─────────────────────┼──────────────
Virtual Network        │ VPC                │ VPC Network         │ VNet
Subnet                 │ Subnet (per AZ)    │ Subnet (per region!)│ Subnet (per VNet)
Internet Gateway       │ IGW                │ Default (auto)      │ N/A (auto)
NAT                    │ NAT Gateway        │ Cloud NAT           │ NAT Gateway
Instance Firewall      │ Security Group     │ Firewall Rules      │ NSG
Subnet Firewall        │ NACL               │ Firewall Rules      │ NSG (subnet-level)
Peering                │ VPC Peering        │ VPC Peering         │ VNet Peering
Hub-and-Spoke          │ Transit Gateway    │ Network Connectivity│ Virtual WAN
Private Link           │ PrivateLink        │ Private Service     │ Private Link
Load Balancer (L4)     │ NLB                │ TCP/UDP LB          │ Azure LB
Load Balancer (L7)     │ ALB                │ HTTP(S) LB          │ App Gateway
CDN                    │ CloudFront         │ Cloud CDN           │ Azure CDN
DNS                    │ Route 53           │ Cloud DNS           │ Azure DNS

KEY DIFFERENCE:
  AWS subnets: one per Availability Zone (regional).
  GCP subnets: one per REGION (spans all zones in region automatically).
  GCP is simpler: fewer subnets to manage. But less fine-grained control.
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **IP subnetting/CIDR** | [Ch 05: IP Addressing](05_IP_Addressing_Subnets.md) — binary math |
| **Terraform IaC** | [DevOps Advanced](01_DevOps_Advanced.md) — Terraform basics |
| **Firewalls (SG vs NACL)** | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) |
| **NAT mechanics** | [Ch 05: IP Addressing](05_IP_Addressing_Subnets.md) — NAT deep dive |
| **Load balancers** | [Ch 11: Load Balancing](11_Load_Balancing_Proxies.md) — ALB vs NLB |
| **K8s in VPC** | [DevOps Fundamentals](00_DevOps_Fundamentals.md) — EKS networking |
| **Serverless (Lambda VPC)** | [Cloud Native](03_ServiceMesh_CloudNative.md) |

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


> **Navigation**: [← WiFi & APs](12_WiFi_AP_Enterprise.md) | [Index](00_INDEX.md) | [Next → SSH](14_SSH_Remote_Access.md)
