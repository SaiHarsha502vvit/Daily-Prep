**Navigation**: [< Previous](14_Code_Review_Practices.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](16_IaC_Terraform.md)

# Cloud Services — AWS, Azure & GCP Guide

## Why Cloud Knowledge is Essential


95% of companies use at least one cloud provider.
Even if you're not DevOps, understanding cloud services
makes you a 10x more effective developer.

You don't need to be a cloud architect —
but you MUST know what's available and when to use it.


---

## The Big Three — Service Mapping

```
CATEGORY          │  AWS             │  AZURE            │  GCP
──────────────────────────────────────────────────
COMPUTE           │                  │                   │
Virtual Machines  │  EC2             │  Virtual Machines │  GCE
Containers        │  ECS / EKS       │  AKS              │  GKE
Serverless        │  Lambda          │  Azure Functions  │  Cloud
                  │                  │                   │  Func
App Platform      │  Elastic Beanstk │  App Service      │  App
                  │                  │                   │  Eng
────────────────────┼──────────────────┼───────────────────┼───────
STORAGE           │                  │                   │
Object Storage    │  S3              │  Blob Storage     │  GCS
Block Storage     │  EBS             │  Managed Disks    │  PD
File Storage      │  EFS             │  Azure Files      │  FS
────────────────────┼──────────────────┼───────────────────┼───────
DATABASE          │                  │                   │
Relational        │  RDS / Aurora    │  Azure SQL        │  Cloud
                  │                  │                   │  SQL
NoSQL Document    │  DynamoDB        │  Cosmos DB        │  Fire-
                  │                  │                   │  store
In-Memory Cache   │  ElastiCache     │  Azure Cache      │  Mem-
                  │                  │  for Redis        │  store
────────────────────┼──────────────────┼───────────────────┼───────
MESSAGING         │                  │                   │
Message Queue     │  SQS             │  Service Bus      │  Pub/
                  │                  │                   │  Sub
Event Streaming   │  Kinesis / MSK   │  Event Hubs       │  Data-
                  │                  │                   │  flow
Notifications     │  SNS             │  Notification Hub │  FCM
────────────────────┼──────────────────┼───────────────────┼───────
NETWORKING        │                  │                   │
CDN               │  CloudFront      │  Azure CDN / FD   │  Cloud
                  │                  │                   │  CDN
DNS               │  Route 53        │  Azure DNS        │  Cloud
                  │                  │                   │  DNS
Load Balancer     │  ELB / ALB       │  Azure LB / AG    │  Cloud
                  │                  │                   │  LB
API Gateway       │  API Gateway     │  APIM             │  API
                  │                  │                   │  GW
────────────────────┼──────────────────┼───────────────────┼───────
IDENTITY          │                  │                   │
Auth/Identity     │  IAM / Cognito   │  Azure AD / B2C   │  IAM
Secrets           │  Secrets Manager │  Key Vault        │  Sec-
                  │                  │                   │  ret
────────────────────┼──────────────────┼───────────────────┼───────
MONITORING        │                  │                   │
Monitoring        │  CloudWatch      │  Azure Monitor    │  Cloud
                  │                  │                   │  Mon
Logging           │  CloudWatch Logs │  Log Analytics    │  Cloud
                  │                  │                   │  Log
────────────────────┼──────────────────┼───────────────────┼───────
CI/CD             │                  │                   │
Build/Deploy      │  CodePipeline    │  Azure DevOps     │  Cloud
                  │  CodeBuild       │  Pipelines        │  Build
Container Reg.    │  ECR             │  ACR              │  GCR
```

**Flow:**
1. CATEGORY AWS AZURE GCP
2. COMPUTE
3. Virtual Machines EC2 Virtual Machines GCE
4. Containers ECS / EKS AKS GKE
5. Serverless Lambda Azure Functions Cloud
6. Func
7. App Platform Elastic Beanstk App Service App

```mermaid
flowchart TD
    N1["CATEGORY AWS AZURE GCP"]
    N2["COMPUTE"]
    N3["Virtual Machines EC2 Virtual Machines GCE"]
    N4["Containers ECS / EKS AKS GKE"]
    N5["Serverless Lambda Azure Functions Cloud"]
    N6["Func"]
    N7["App Platform Elastic Beanstk App Service App"]
    N8["STORAGE"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---



🔬 **Section Challenge — The Big Three — Service Mapping**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## Core Concepts Every Developer Should Know

### 1. Regions & Availability Zones

```
REGION = Geographic location (e.g., us-east-1, ap-south-1)

                  ┌─── Region: us-east-1 ───┐
                  │                          │
                  │  ┌─── AZ: us-east-1a ─┐ │
                  │  │  Data Center 1      │ │
                  │  │  Data Center 2      │ │
                  │  └────────────────────┘ │
                  │                          │
                  │  ┌─── AZ: us-east-1b ─┐ │
                  │  │  Data Center 3      │ │
                  │  │  Data Center 4      │ │
                  │  └────────────────────┘ │
                  │                          │
                  │  ┌─── AZ: us-east-1c ─┐ │
                  │  │  Data Center 5      │ │
                  │  └────────────────────┘ │
                  └──────────────────────────┘

Rule: Deploy across 2+ AZs for high availability.
AZs in the same region have low-latency links between them.
```

**Flow:**
1. Data Center 1 / Data Center 2
2. Data Center 3 / Data Center 4
3. Data Center 5

```mermaid
flowchart TD
    N1["Data Center 1 / Data Center 2"]
    N2["Data Center 3 / Data Center 4"]
    N3["Data Center 5"]
    N1 --> N2
    N2 --> N3
```

### 2. The Shared Responsibility Model

```
WHO IS RESPONSIBLE FOR WHAT?

                   IaaS        PaaS        SaaS
                  (EC2)    (App Service)  (Gmail)
┌──────────────┐
│ Your Data     │  YOU         YOU         YOU
│ Your Code     │  YOU         YOU         N/A
│ Runtime       │  YOU        CLOUD        N/A
│ OS            │  YOU        CLOUD       CLOUD
│ Virtualization│ CLOUD       CLOUD       CLOUD
│ Hardware      │ CLOUD       CLOUD       CLOUD
│ Network       │ CLOUD       CLOUD       CLOUD
│ Physical      │ CLOUD       CLOUD       CLOUD
└──────────────┘

As a developer, you manage MORE in IaaS, LESS in PaaS.
Most modern apps → PaaS or Containers (good balance).
```

**Flow:**
1. WHO IS RESPONSIBLE FOR WHAT?
2. IaaS PaaS SaaS
3. (EC2) (App Service) (Gmail)
4. Your Data YOU YOU YOU
5. Your Code YOU YOU N/A
6. Runtime YOU CLOUD N/A
7. OS YOU CLOUD CLOUD

```mermaid
flowchart TD
    N1["WHO IS RESPONSIBLE FOR WHAT?"]
    N2["IaaS PaaS SaaS"]
    N3["(EC2) (App Service) (Gmail)"]
    N4["Your Data YOU YOU YOU"]
    N5["Your Code YOU YOU N/A"]
    N6["Runtime YOU CLOUD N/A"]
    N7["OS YOU CLOUD CLOUD"]
    N8["Virtualization CLOUD CLOUD CLOUD"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### 3. IAM — Identity & Access Management

```
IAM — The Security Gatekeeper

PRINCIPLE OF LEAST PRIVILEGE:
Give the minimum permissions needed, nothing more.

KEY CONCEPTS:
┌───────────┐  ┌──────────┐  ┌──────────────┐
│  User     │  │  Role    │  │  Policy      │
│  (Person) │  │  (Assume)│  │  (Permission)│
└─────┬─────┘  └────┬─────┘  └──────┬───────┘
      │              │               │
      └──────────────┴───────────────┘
                     │
             Attached to each other

EXAMPLE AWS IAM POLICY (JSON):
{
  "Effect": "Allow",
  "Action": "s3:GetObject",        // Only read
  "Resource": "arn:aws:s3:::my-bucket/*"  // Only this bucket
}

COMMON MISTAKE: Using root account for daily work
FIX: Create individual IAM users with specific roles
```

**Flow:**
1. User / (Person)
2. Role / (Assume)
3. Policy / (Permission)

```mermaid
flowchart TD
    N1["User / (Person)"]
    N2["Role / (Assume)"]
    N3["Policy / (Permission)"]
    N1 --> N2
    N2 --> N3
```

---

## Deep Dive: The Services You'll Use Most

### Compute: EC2 / VMs

```
EC2 (Elastic Compute Cloud) — Virtual Servers

INSTANCE TYPES:
┌──────────┬────────────────────────────┬────────────────┐
│ Category │ Use Case                   │ Example        │
├──────────┼────────────────────────────┼────────────────┤
│ t3/t4g   │ General purpose (burstable)│ Web servers    │
│ m6i      │ General purpose (steady)   │ App servers    │
│ c6i      │ Compute-intensive          │ Batch jobs     │
│ r6i      │ Memory-intensive           │ In-memory DB   │
│ g5       │ GPU                        │ ML Training    │
└──────────┴────────────────────────────┴────────────────┘

PRICING MODELS:
On-Demand: Pay per hour/second (most expensive, most flexible)
Reserved:  1-3 year commit → up to 72% savings
Spot:      Bid for unused capacity → up to 90% savings
           (can be interrupted with 2-min warning)
Savings:   Commit to $/hour → flexible across instance types
```

**Flow:**
1. EC2 (Elastic Compute Cloud) — Virtual Servers
2. INSTANCE TYPES:
3. Category Use Case Example
4. t3/t4g General purpose (burstable) Web servers
5. m6i General purpose (steady) App servers
6. c6i Compute-intensive Batch jobs
7. r6i Memory-intensive In-memory DB

```mermaid
flowchart TD
    N1["EC2 (Elastic Compute Cloud) — Virtual Servers"]
    N2["INSTANCE TYPES:"]
    N3["Category Use Case Example"]
    N4["t3/t4g General purpose (burstable) Web servers"]
    N5["m6i General purpose (steady) App servers"]
    N6["c6i Compute-intensive Batch jobs"]
    N7["r6i Memory-intensive In-memory DB"]
    N8["g5 GPU ML Training"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### Containers: ECS / EKS / AKS / GKE

```
CONTAINER DEPLOYMENT OPTIONS

┌──────────────────────────────────────────────────┐
│ Managed Kubernetes (EKS / AKS / GKE)             │
│ • Full Kubernetes API                            │
│ • Max flexibility, steeper learning curve        │
│ • Good for: large teams, complex microservices   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ Managed Container Service (ECS / Azure Container)│
│ • Simpler than K8s                               │
│ • Provider-specific (not portable)               │
│ • Good for: small teams, simpler architectures   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ Serverless Containers (Fargate / Container Apps) │
│ • No server management at all                    │
│ • Pay per vCPU-second                            │
│ • Good for: event-driven, variable load          │
└──────────────────────────────────────────────────┘
```

**Flow:**
1. Managed Kubernetes (EKS / AKS / GKE) / • Full Kubernete
2. Managed Container Service (ECS / Azure Container) / • S
3. Serverless Containers (Fargate / Container Apps) / • No

```mermaid
flowchart TD
    N1["Managed Kubernetes (EKS / AKS / GKE) / • Full Kubernete"]
    N2["Managed Container Service (ECS / Azure Container) / • S"]
    N3["Serverless Containers (Fargate / Container Apps) / • No"]
    N1 --> N2
    N2 --> N3
```

### Serverless: Lambda / Azure Functions


SERVERLESS — No Server to Manage

HOW IT WORKS:
Event → Function Executes → Returns → Scales to Zero

// AWS Lambda Example (Java)
public class Handler implements RequestHandler<APIGatewayProxy,
APIGatewayProxy> {
public APIGatewayProxyResponseEvent handleRequest(
APIGatewayProxyRequestEvent input, Context context) {
String body = input.getBody();
// process...
return new APIGatewayProxyResponseEvent()
.withStatusCode(200)
.withBody("{\"message\": \"success\"}");
}
}

GOOD FOR:                          BAD FOR:
- API endpoints                   • Long-running tasks (>15 min)
- Event processing                • WebSockets
- Scheduled jobs (cron)           • Stateful applications
- File processing triggers        • High-throughput streaming
- Low/variable traffic            • Cold-start-sensitive apps

COLD START: First invocation is slow (JVM = 3-10s)
SOLUTION: SnapStart (AWS), Provisioned Concurrency,
or use Node.js/Python for latency-sensitive functions


### Storage: S3 / Blob Storage

## Class           │ Use Case             │ Cost

| Standard        | Frequent access      | $$$ |
| Intelligent     | Unknown access       | $$ + fee |
| Standard-IA     | Infrequent access    | $$ |
| Glacier Instant | Archive, instant     | $ |
| Glacier         | Archive, 3-5 hrs     | ¢ |
| Deep Archive    | Archive, 12 hrs      | ¢¢ |

### Database Services

```
DATABASE DECISION TREE

Need ACID + complex queries?
├── YES → RDS (PostgreSQL/MySQL) or Aurora
│         (Aurora = 3-5x faster than RDS, costs more)
│
└── NO → What's the access pattern?
         │
         ├── Key-value lookups → DynamoDB / Cosmos DB
         │   (Single-digit ms at any scale)
         │
         ├── Document store → MongoDB Atlas / DocumentDB
         │
         ├── In-memory cache → ElastiCache (Redis/Memcached)
         │
         ├── Search → Elasticsearch / OpenSearch
         │
         ├── Graph → Neptune / Cosmos (Gremlin)
         │
         └── Time-series → Timestream / InfluxDB

RDS READ SCALING: Read Replicas (up to 15 in Aurora)
RDS WRITE SCALING: Vertical (bigger instance) or sharding
```

**Flow:**
1. YES
2. RDS (PostgreSQL/MySQL) or Aurora
3. Key-value lookups
4. DynamoDB / Cosmos DB
5. Document store
6. MongoDB Atlas / DocumentDB
7. In-memory cache
8. ElastiCache (Redis/Memcached)
9. Search
10. Elasticsearch / OpenSearch
11. Graph
12. Neptune / Cosmos (Gremlin)

```mermaid
flowchart TD
    N1["YES"]
    N2["RDS (PostgreSQL/MySQL) or Aurora"]
    N3["Key-value lookups"]
    N4["DynamoDB / Cosmos DB"]
    N5["Document store"]
    N6["MongoDB Atlas / DocumentDB"]
    N7["In-memory cache"]
    N8["ElastiCache (Redis/Memcached)"]
    N9["Search"]
    N10["Elasticsearch / OpenSearch"]
    N11["Graph"]
    N12["Neptune / Cosmos (Gremlin)"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
    N7 --> N8
    N9 --> N10
    N11 --> N12
```

---

## Typical Cloud Architecture

```
THREE-TIER WEB APPLICATION ON AWS

Users
  │
  ▼
[Route 53 — DNS]
  │
  ▼
[CloudFront — CDN]  ←── [S3 — Static Assets]
  │
  ▼
[ALB — Load Balancer]
  │
  ├──────────────────────────┐
  ▼                          ▼
[EC2 / ECS]            [EC2 / ECS]    ← Auto Scaling Group
(App Server 1)         (App Server 2)
  │                          │
  └──────────┬───────────────┘
             │
  ┌──────────┼──────────────────────┐
  ▼          ▼                      ▼
[RDS     [ElastiCache       [SQS — Message
 Primary] (Redis)]           Queue]
  │                                 │
  ▼                                 ▼
[RDS                        [Lambda — Worker]
 Read Replica]                      │
                                    ▼
                            [S3 — Processed Files]

+ CloudWatch monitoring everywhere
+ IAM roles for service-to-service auth
+ VPC with public/private subnets
```

**Flow:**
1. THREE-TIER WEB APPLICATION ON AWS / Users
2. [Route 53 — DNS]
3. [CloudFront — CDN] ← [S3 — Static Assets]
4. [ALB — Load Balancer]
5. [EC2 / ECS] [EC2 / ECS] ← Auto Scaling Group / (App Ser [RDS [ElastiCache [SQS — Message / Primary] (Redis)] Qu [RDS [Lambda — Worker] / Read Replica]

```mermaid
flowchart TD
    N1["THREE-TIER WEB APPLICATION ON AWS / Users"]
    N2["[Route 53 — DNS]"]
    N3["[CloudFront — CDN] ← [S3 — Static Assets]"]
    N4["[ALB — Load Balancer]"]
    N5["[EC2 / ECS] [EC2 / ECS] ← Auto Scaling Group / (App Ser"]
    N6["[RDS [ElastiCache [SQS — Message / Primary] (Redis)] Qu"]
    N7["[RDS [Lambda — Worker] / Read Replica]"]
    N8["[S3 — Processed Files] / + CloudWatch monitoring everyw"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

## Cost Optimization Tips


COST MISTAKES DEVELOPERS MAKE

1. Leaving resources running
→ Use auto-shutdown for dev/test environments
→ Tag everything: Environment=dev, Owner=your-name

2. Over-provisioning
→ Start small (t3.small), scale up when needed
→ Use auto-scaling (scale OUT not UP)

3. Not using the right storage tier
→ Old logs in S3 Standard? Move to Glacier
→ Use lifecycle policies for automatic transitions

4. Data transfer costs
→ Data INTO cloud = free, data OUT = expensive
→ Keep processing close to data (same region)
→ Use VPC endpoints for AWS service calls

5. Not using Reserved/Savings Plans
→ If you know you'll run 24/7 for a year → Reserve it


---

## Cloud for Spring Boot Developers


SPRING BOOT → CLOUD MAPPING

LOCAL                      │  CLOUD EQUIVALENT
──────────────────────────┼──────────────────────────────
application.properties     │  AWS Parameter Store / K8s ConfigMap
Secrets in .env            │  AWS Secrets Manager / Key Vault
Local file uploads         │  S3 / Blob Storage
In-memory H2 database      │  RDS PostgreSQL / Azure SQL
@Cacheable (in-memory)     │  ElastiCache Redis
@Async with ThreadPool     │  SQS + Lambda workers
@Scheduled cron jobs       │  EventBridge / CloudWatch Events
Logback console output     │  CloudWatch Logs / ELK
Actuator /health           │  ALB health checks
localhost:8080             │  Route 53 → ALB → ECS/EC2

SPRING CLOUD AWS:
<dependency>
<groupId>io.awspring.cloud</groupId>
<artifactId>spring-cloud-aws-starter</artifactId>
</dependency>
→ Auto-configures S3, SQS, SNS, Parameter Store, etc.


---



🔬 **Section Challenge — Cloud for Spring Boot Developers**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


## Interview Questions

```
Q: What's the difference between IaaS, PaaS, and SaaS?
A: IaaS = infrastructure (VMs, storage) — you manage OS + app
   PaaS = platform (App Service, Heroku) — you manage app only
   SaaS = software (Gmail, Slack) — you manage nothing

Q: How would you deploy a Spring Boot app to the cloud?
A: Multiple options depending on requirements:
   1. Containerize with Docker → ECS Fargate (simplest)
   2. Kubernetes → EKS/AKS (if team already uses K8s)
   3. Elastic Beanstalk / App Service (PaaS, quickest start)
   4. EC2 with Auto Scaling (if need full control)

Q: How do you handle secrets in cloud environments?
A: Never hardcode or commit secrets.
   Use: AWS Secrets Manager, Azure Key Vault, or GCP Secret Manager
   Access: Via IAM roles (not API keys in code)
   Rotate: Automatically with managed rotation

Q: Explain horizontal vs vertical scaling.
A: Vertical = bigger machine (limited, downtime to change)
   Horizontal = more machines behind load balancer (preferred)
   Auto-scaling = automatically add/remove based on metrics
   (CPU > 70% → add instance, CPU < 30% → remove instance)
```

**Flow:**
1. Containerize with Docker
2. ECS Fargate (simplest)
3. Kubernetes
4. EKS/AKS (if team already uses K8s)
5. (CPU > 70% add instance, CPU < 30% remove instance)

```mermaid
flowchart LR
    N1["1. Containerize with Docker"]
    N2["ECS Fargate (simplest)"]
    N3["2. Kubernetes"]
    N4["EKS/AKS (if team already uses K8s)"]
    N5["(CPU &gt; 70%"]
    N6["add instance, CPU &lt; 30%"]
    N7["remove instance)"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
    N6 --> N7
```

---

## Mental Model: Cloud as Building Blocks


Think of cloud services like LEGO blocks:

You don't build a database from scratch.
You pick the RIGHT block (RDS, DynamoDB, Redis)
and snap it into your architecture.

Your job as a developer:
1. Know what blocks exist
2. Know when to use each one
3. Know how to connect them
4. Know the trade-offs (cost, latency, complexity)

You DON'T need to:
- Memorize every service (there are 200+ on AWS alone)
- Know the exact CLI commands
- Be a networking expert

You DO need to:
- Design solutions using the right services
- Understand pricing implications of your choices
- Write code that works with cloud services (SDKs)


---

*Start with ONE cloud provider (the one your target company uses). Master 10 core services deeply. The rest transfers.*


---


---



🔬 **Section Challenge — Mental Model: Cloud as Building Blocks**

**Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
<details><summary>Answer</summary>

It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
</details>


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


> **Navigation**: [< Previous](14_Code_Review_Practices.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](16_IaC_Terraform.md)