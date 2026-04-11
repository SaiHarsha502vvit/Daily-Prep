> **Navigation**: [← CI/CD](19_CICD_Pipelines.md) | [Index](00_INDEX.md) | [Next → Monitoring](21_Monitoring_Observability.md)

# 🏗️ Chapter 20: Terraform & Infrastructure as Code — Define Your Cloud in Code

> _"Without IaC, your infrastructure is a snowflake — unique, fragile, unreproducible. With Terraform, your entire cloud setup is version-controlled, peer-reviewed, and re-creatable with one command."_

---

# PART 1: Why IaC? — The Problem with Click-Ops

---

```
CLICK-OPS (manual console):
  Day 1: Admin creates VPC, subnets, security groups via AWS console. Works.
  Day 30: "What settings did I use?" → nobody remembers.
  Day 60: New team member needs similar setup → spends 3 days clicking.
  Day 90: Security audit → "show me all your firewall rules" → 6 hours of screenshots.
  Day 120: DR test → "recreate everything in another region" → impossible.
  
IaC:
  Day 1: Write Terraform → terraform apply → infrastructure created. Code in Git.
  Day 30: Read the code → know exactly what's deployed.
  Day 60: New setup → terraform apply → identical environment in 10 minutes.
  Day 90: Audit → read the code. Every change has a PR, review, and approval.
  Day 120: DR → terraform apply in us-west-2 → full replica.

TOOLS:
  Terraform (HashiCorp):   Multi-cloud (AWS + GCP + Azure + 3000+ providers). Most popular.
  Pulumi:                  IaC in real languages (Python, TypeScript, Go). Loops, conditionals!
  AWS CloudFormation:      AWS-only. JSON/YAML. Deep AWS integration.
  CDK (AWS):               Write CloudFormation in Python/TypeScript.
  OpenTofu:                Open-source Terraform fork (after HashiCorp license change).
```

---

# PART 2: Terraform Fundamentals

---

```hcl
# ── TERRAFORM BASICS ──

# Provider: which cloud API to talk to
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # State storage (NEVER store state locally in team environments!)
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"      # state locking (prevents concurrent applies!)
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "github.com/myorg/infra"
    }
  }
}

# Variables (inputs)
variable "region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for all resources"
}

variable "environment" {
  type    = string
  default = "production"
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

# ── CREATE RESOURCES ──

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.environment == "production" ? "t3.large" : "t3.micro"
  subnet_id     = aws_subnet.public[0].id
  
  vpc_security_group_ids = [aws_security_group.web.id]
  
  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io
    docker run -d -p 80:8000 myapp:latest
  EOF

  tags = {
    Name = "${var.environment}-web-server"
  }
}

# Outputs (show after apply)
output "web_server_ip" {
  value       = aws_instance.web.public_ip
  description = "Public IP of the web server"
}
```

```
TERRAFORM WORKFLOW:

  terraform init          # download providers, initialize backend
  terraform plan          # show what WILL change (preview!)
  terraform apply         # execute the changes
  terraform destroy       # remove ALL resources
  
  LIFECYCLE:
  1. Write .tf files (desired state)
  2. terraform plan (diff: current state vs desired)
  3. Review the plan (PR review!)
  4. terraform apply (make changes)
  5. State file updated (records what exists)

STATE FILE:
  terraform.tfstate = record of ALL resources Terraform manages.
  Maps resource IDs in your code → real resource IDs in the cloud.
  
  CRITICAL: If state is lost → Terraform doesn't know what it created!
  → ALWAYS store state in a remote backend (S3, GCS, Terraform Cloud).
  → ALWAYS enable state locking (DynamoDB) to prevent concurrent writes.
  → NEVER commit terraform.tfstate to Git (contains secrets!).
```

---

# PART 3: Modules — Reusable Infrastructure

---

```hcl
# ── MODULES: group resources into reusable packages ──

# Using a community module (Terraform Registry)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  
  name = "${var.environment}-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]
  
  enable_nat_gateway = true
}

# Using YOUR OWN module
module "api_service" {
  source = "./modules/ecs-service"    # local module
  
  name            = "my-api"
  image           = "ghcr.io/myorg/api:${var.image_tag}"
  cpu             = 1024
  memory          = 2048
  desired_count   = 3
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  listener_arn    = aws_lb_listener.https.arn
}

# ── YOUR MODULE (modules/ecs-service/main.tf) ──
# Encapsulates: ECS task definition, service, target group, security group.
# Teams use: module "service" { source = "./modules/ecs-service" }
# Standardized, tested, peer-reviewed infrastructure.
```

---

# PART 4: Terraform Anti-Patterns & Best Practices

---

```
ANTI-PATTERNS:

1. MONOLITH STATE:
   All resources in ONE state file. Any change → locks EVERYTHING.
   Production + staging in same state → scary!
   
   FIX: Separate state per environment, per component.
   production/vpc/    → state for VPC
   production/app/    → state for application (depends on VPC)
   staging/vpc/       → separate state for staging

2. HARDCODED VALUES:
   region = "us-east-1"    # hardcoded everywhere!
   FIX: Use variables + tfvars files per environment.

3. NO STATE LOCKING:
   Two people run terraform apply simultaneously → state corruption!
   FIX: DynamoDB lock table (AWS), GCS bucket locking (GCP).

4. SECRETS IN CODE:
   db_password = "supersecret"   # IN YOUR CODE!
   FIX: Use aws_secretsmanager_secret data source or environment variables.

BEST PRACTICES:

1. Use workspaces OR directory-per-environment:
   environments/
   ├── production/
   │   ├── main.tf
   │   └── terraform.tfvars
   ├── staging/
   │   ├── main.tf
   │   └── terraform.tfvars
   └── modules/           # shared modules
       ├── vpc/
       ├── ecs-service/
       └── rds/

2. Pin provider versions: aws = "~> 5.30" (not "~> 5.0" for safety).

3. Use terraform plan in CI, terraform apply only after approval.

4. Import existing infrastructure: terraform import aws_instance.web i-1234567890.

5. Use tflint and checkov for static analysis of Terraform code.
```

---

# PART 5: Advanced HCL — Loops, Conditionals, Dynamic Blocks

---

```hcl
# ── FOR_EACH: create multiple resources from a map ──
variable "services" {
  type = map(object({
    cpu    = number
    memory = number
    port   = number
  }))
  default = {
    api     = { cpu = 1024, memory = 2048, port = 8000 }
    worker  = { cpu = 512,  memory = 1024, port = 9000 }
    admin   = { cpu = 256,  memory = 512,  port = 8080 }
  }
}

resource "aws_ecs_service" "services" {
  for_each = var.services

  name            = each.key                    # "api", "worker", "admin"
  task_definition = aws_ecs_task_definition.tasks[each.key].arn
  desired_count   = var.environment == "production" ? 3 : 1

  # Conditional: only attach LB for services with port < 9000
  dynamic "load_balancer" {
    for_each = each.value.port < 9000 ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.tg[each.key].arn
      container_name   = each.key
      container_port   = each.value.port
    }
  }
}

# ── LOCALS: computed values (avoid repetition) ──
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Team        = "platform"
  }
  
  is_production = var.environment == "production"
  
  # Flatten nested data
  subnet_ids = flatten([
    module.vpc.public_subnets,
    module.vpc.private_subnets
  ])
}

# ── DATA SOURCES: read existing resources (not managed by Terraform) ──
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical (Ubuntu publisher)
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# Use: ami = data.aws_ami.ubuntu.id  → always gets latest Ubuntu 22.04 AMI!

data "aws_caller_identity" "current" {}
# Use: data.aws_caller_identity.current.account_id → "123456789012"

# ── LIFECYCLE RULES ──
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.large"

  lifecycle {
    create_before_destroy = true    # create new BEFORE destroying old (zero downtime)
    prevent_destroy       = true    # terraform destroy will ERROR (safety!)
    ignore_changes        = [ami]   # don't replace when AMI changes (manual updates)
  }
}
```

---

# PART 6: Terragrunt — DRY Multi-Environment Management

---

```
TERRAGRUNT = thin wrapper over Terraform that eliminates duplication.
  
  PROBLEM: with standard Terraform, each environment repeats the backend config,
  provider config, and module calls. 3 environments × 5 components = 15 copies!
  
  TERRAGRUNT: write the common config ONCE. Inherit everywhere.

DIRECTORY STRUCTURE:
  infrastructure/
  ├── terragrunt.hcl               # ROOT: defines backend + provider
  ├── _envcommon/                   # shared module configs
  │   ├── vpc.hcl
  │   ├── ecs.hcl
  │   └── rds.hcl
  ├── production/
  │   ├── env.hcl                   # environment-specific vars
  │   ├── vpc/
  │   │   └── terragrunt.hcl       # includes _envcommon/vpc.hcl
  │   ├── app/
  │   │   └── terragrunt.hcl
  │   └── database/
  │       └── terragrunt.hcl
  └── staging/
      ├── env.hcl
      ├── vpc/
      │   └── terragrunt.hcl
      └── app/
          └── terragrunt.hcl
```

```hcl
# ── ROOT terragrunt.hcl ──
# Auto-generates backend config for EVERY module!

generate "backend" {
  path      = "backend.tf"
  if_exists = "overwrite_terragrunt"
  contents = <<EOF
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
EOF
}

# ── production/vpc/terragrunt.hcl ──
include "root" {
  path = find_in_parent_folders()     # inherits root config
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders())}/_envcommon/vpc.hcl"
}

inputs = {
  environment = "production"
  cidr        = "10.0.0.0/16"
}

# RESULT: NO duplicate backend config. NO duplicate provider config.
# Each environment's terragrunt.hcl is just a few lines of inputs!

# COMMANDS:
# terragrunt run-all plan    → plans ALL modules in the directory tree
# terragrunt run-all apply   → applies ALL, respecting dependencies
```

---

# PART 7: State Operations & Importing Existing Resources

---

```bash
# ── TERRAFORM STATE MANAGEMENT ──

# Import existing cloud resource INTO Terraform management
terraform import aws_instance.web i-0abc123def456
# Now Terraform "knows about" this EC2 instance.
# IMPORTANT: you must write the resource block in .tf FIRST!

# Import block (Terraform 1.5+ — declarative import!)
import {
  to = aws_instance.web
  id = "i-0abc123def456"
}
# Run: terraform plan → Terraform generates the config for you!

# Move a resource (rename without destroying)
# Old: resource "aws_instance" "web" → New: resource "aws_instance" "api"
moved {
  from = aws_instance.web
  to   = aws_instance.api
}
# terraform apply → renames in state, NO infrastructure change!

# Move resource to a module
moved {
  from = aws_instance.api
  to   = module.api.aws_instance.main
}

# State commands (emergency use only!)
terraform state list                          # list all managed resources
terraform state show aws_instance.web         # show resource details
terraform state mv aws_instance.web aws_instance.api  # rename
terraform state rm aws_instance.legacy        # remove from state (doesn't destroy!)
terraform state pull                          # download state as JSON

# ── TERRAFORM IN CI/CD PIPELINE ──

# .github/workflows/terraform.yml:
# on:
#   pull_request:    → terraform plan (comment on PR with changes)
#   push (main):     → terraform apply (after approval)
#
# Key: terraform plan runs on EVERY PR → reviewer sees exact changes.
#      terraform apply only on merge to main → controlled deployment.
#
# Tools: atlantis (automated Terraform PRs), terraform cloud, spacelift.
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **VPC resources** | [Ch 13: Cloud VPC](13_Cloud_Networking_VPC.md) — what Terraform provisions |
| **CI/CD (terraform in pipeline)** | [Ch 19: CI/CD](19_CICD_Pipelines.md) — plan in PR, apply on merge |
| **K8s cluster provisioning** | [Ch 18: K8s](18_Kubernetes_Complete.md) — EKS/GKE via Terraform |
| **Security groups** | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — SG resources |
| **DNS records** | [Ch 07: DNS](07_DNS_Complete.md) — Route53 records via Terraform |
| **GitOps** | [Ch 23: GitOps](23_GitOps_Deployments.md) — infra changes via Git |
| **Linux instances** | [Ch 16: Linux](16_Linux_Administration.md) — user_data scripts |
| **Docker (ECS tasks)** | [Ch 17: Docker](17_Docker_Complete.md) — container definitions |

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


> **Navigation**: [← CI/CD](19_CICD_Pipelines.md) | [Index](00_INDEX.md) | [Next → Monitoring](21_Monitoring_Observability.md)
