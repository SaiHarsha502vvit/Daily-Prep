**Navigation**: [< Previous](14_Code_Review_Practices.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](16_IaC_Terraform.md)

# Cloud Services — AWS, Azure & GCP Guide

## 📌 WHY / WHAT / WHERE / WHEN / WHO / HOW

**WHY**: Cloud shifts infrastructure from capital expense to operational practice. Without understanding service boundaries, teams either over-provision (waste: 60% of cloud spend is wasted per Gartner 2023) or under-provision (outages under load). Choosing the wrong service tier — e.g., EC2 when Lambda fits, or RDS when DynamoDB is right — compounds: harder to operate, more expensive to scale, harder to recover.

**WHAT**: Compute (EC2 / ECS / Lambda), Containers (EKS / Fargate), Serverless, Storage (S3 / EBS / Glacier), Database (RDS / DynamoDB / Aurora), Networking (VPC / CloudFront / Route53), IAM, monitoring, and cost. Service mapping across AWS, Azure, and GCP with selection rules and breakeven analysis.

**WHERE**: Every production system post-2015; startups to FAANG. AWS holds 32% market share, Azure 23%, GCP 11% (Synergy Research 2024). The 80% of breaches exploiting over-permissioned IAM roles (Cloud Security Alliance 2023) make this chapter security-critical, not just cost-critical.

**WHEN**: When scaling beyond a single server; when availability requirements exceed 99% (need managed services); when team lacks ops expertise (managed services reduce ops burden); when time-to-market matters (managed services ship faster). Specifically: pick Lambda when traffic is bursty and request duration <15 minutes; pick ECS/Fargate when you need long-running processes or specific runtimes; pick EC2 when you need full control or specialized hardware.

**WHO**: AWS launched 2006 (S3, EC2); Azure 2010 (Microsoft); GCP 2008 (App Engine, then 2011 for full IaaS). Lambda 2014 (serverless revolution). EKS 2017, Fargate 2017. The CNCF (Cloud Native Computing Foundation, founded 2015) maintains Kubernetes and the cloud-native ecosystem standards.

**HOW**: Service mapping first (10 categories × 3 providers), then selection rule (managed > self-managed when ops burden > control benefit), then cost breakeven analysis (Lambda vs EC2 with concrete numbers), then production failure modes (IAM privilege creep, region outages, data egress costs). Each service category gets a comparison table and a "when to use" decision guide.

**The cloud service invariant**: "Every cloud service sits on a control-versus-maintenance spectrum — more managed service means less control but less operational burden."

Choosing a service is choosing a point on this spectrum. IaaS (EC2) gives full control but requires patching, capacity planning, and failure recovery. FaaS (Lambda) abstracts everything but constrains runtime (15-min max, limited memory). The "best" choice is the leftmost option on the spectrum that meets your requirements.

This invariant predicts failure: when teams reach for IaaS for a workload that doesn't need that control, they waste effort on ops. When they reach for FaaS for a workload that needs control, they hit the abstraction's limits. The decision is always about which trade-off is acceptable.

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
──────────────────┼──────────────────┼───────────────────┼───────
COMPUTE           │                  │                   │
Virtual Machines  │  EC2             │  Virtual Machines │  GCE
Containers        │  ECS / EKS       │  AKS              │  GKE
Serverless        │  Lambda          │  Azure Functions  │  Cloud
                  │                  │                   │  Func
App Platform      │  Elastic Beanstk │  App Service      │  App
                  │                  │                   │  Eng
──────────────────┼──────────────────┼───────────────────┼───────
STORAGE           │                  │                   │
Object Storage    │  S3              │  Blob Storage     │  GCS
Block Storage     │  EBS             │  Managed Disks    │  PD
File Storage      │  EFS             │  Azure Files      │  FS
──────────────────┼──────────────────┼───────────────────┼───────
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
──────────────────┼──────────────────┼───────────────────┼───────
NETWORKING        │                  │                   │
CDN               │  CloudFront      │  Azure CDN / FD   │  Cloud
                  │                  │                   │  CDN
DNS               │  Route 53        │  Azure DNS        │  Cloud
                  │                  │                   │  DNS
Load Balancer     │  ELB / ALB       │  Azure LB / AG    │  Cloud
                  │                  │                   │  LB
API Gateway       │  API Gateway     │  APIM             │  API
                  │                  │                   │  GW
──────────────────┼──────────────────┼───────────────────┼───────
IDENTITY          │                  │                   │
Auth/Identity     │  IAM / Cognito   │  Azure AD / B2C   │  IAM
Secrets           │  Secrets Manager │  Key Vault        │  Sec-
                  │                  │                   │  ret
──────────────────┼──────────────────┼───────────────────┼───────
MONITORING        │                  │                   │
Monitoring        │  CloudWatch      │  Azure Monitor    │  Cloud
                  │                  │                   │  Mon
Logging           │  CloudWatch Logs │  Log Analytics    │  Cloud
                  │                  │                   │  Log
──────────────────┼──────────────────┼───────────────────┼───────
CI/CD             │                  │                   │
Build/Deploy      │  CodePipeline    │  Azure DevOps     │  Cloud
                  │  CodeBuild       │  Pipelines        │  Build
Container Reg.    │  ECR             │  ACR              │  GCR
```

---

🔬 **Section Challenge — The Big Three — Service Mapping**

**Challenge 1 (Reasoning):** A startup's single service uses AWS Lambda for its API. At 10M requests/month it's cheap. At 500M requests/month, the CTO wants to switch to EC2. Walk through the cost reasoning and identify what breakeven analysis is needed.

<details><summary>Answer</summary>

Lambda cost: ~$0.20 per 1M requests + $0.0000166667 per GB-second. At 500M requests with avg 200ms, 128MB: ~$100 (requests) + ~$166 (compute) ≈ $266/month. EC2 (t3.medium, 2 vCPU, 4GB): ~$30/month on-demand, handles ~2000 req/s sustained. The Lambda cost scales linearly; EC2 is flat. **Breakeven analysis**: (1) What's the sustained concurrency? Lambdas have cold start cost at scale. (2) Is the load even or spiky? Lambda is ideal for spiky — you don't pay for idle time. EC2 at 500M req/month with even distribution = ~193 req/s — one t3.medium handles that easily. (3) What's the operational overhead cost? Lambda = zero. EC2 = patching, monitoring, AMI updates, on-call burden. The technical answer: EC2 is cheaper at this volume. The architectural answer: only switch if savings exceed operational overhead cost. If the team has no DevOps, stay with Lambda until the cost gap is $500+/month.

### Production Reality

**Cloud service choices fail in production in these named ways:**

- **AWS bill shock from forgotten resources** — a developer spins up an EC2 instance for testing, forgets about it, and leaves it running for 3 months. The bill is $300. More severe: an ML training job with GPU instances that accidentally runs on 100 instances instead of 1. CloudWatch cost anomaly detection must be configured as standard practice, not reactive billing alerts.
- **S3 public bucket exposure** — `aws s3api put-bucket-acl --acl public-read` or Terraform misconfiguration creates a public S3 bucket. The Capital One breach (2019, $300M FTC settlement) used SSRF to access the EC2 metadata service, obtain AWS credentials, and exfiltrate data from a publicly accessible S3 bucket. `s3:ListBucket` and `s3:GetObject` must always be private; use presigned URLs for time-limited access.
- **IAM privilege creep** — a developer is granted `*` permissions "just for testing" and the permissions are never revoked. When the developer's credentials are compromised (phishing, laptop theft), the attacker has admin-level access to all AWS services. Real incident pattern: 80% of cloud breaches exploit overpermissioned IAM roles, not zero-permission accounts.
- **EBS volume not encrypted at rest** — a healthcare company's EC2 instance with unencrypted EBS volume is involved in a data breach notification scenario. HIPAA requires encryption at rest; non-compliance costs $1.5M per violation. AWS managed encryption (KMS) is a single parameter in the instance definition and satisfies compliance requirements.

**Debug workflow:** For bill shock: set up AWS Budgets with alerts at 50%, 80%, 100% of projected spend. For S3 exposure: run `aws s3api list-buckets` and verify each bucket's ACL; enable S3 Block Public Access as an account-level setting (blocks all buckets). For IAM creep: use AWS Access Analyzer to find external access; audit unused roles with IAM Access Advisor.
**Mitigation discipline:** Tag every AWS resource with owner, environment, cost-center; enforce cost alerts via AWS Budgets. Use SCPs (Service Control Policies) in AWS Organizations to prevent public bucket creation organization-wide. Enforce least-privilege IAM with permission boundaries; rotate access keys automatically via GitHub Secrets rotation.

</details>

**Challenge 2 (Design):** A team is choosing between DynamoDB and RDS PostgreSQL for a user profile service. Profiles are read 50x more than written. List the decision criteria and your recommendation.

<details><summary>Answer</summary>

Decision criteria: (1) **Query patterns**: If reads are always by userId (key-value), DynamoDB's O(1) key lookup wins. If you need `SELECT * WHERE age > 25 AND country = 'IN'`, DynamoDB requires a GSI (Global Secondary Index) with additional cost and complexity, or a full scan ($$$). PostgreSQL handles ad-hoc queries natively. (2) **Scale ceiling**: DynamoDB scales to any load with no ops work. PostgreSQL requires read replicas for horizontal read scaling. (3) **Consistency needs**: DynamoDB default is eventually consistent (faster/cheaper). Strongly consistent reads cost 2x. PostgreSQL is always consistent. (4) **50x read ratio**: Both can be cached with ElastiCache/Redis to absorb this. (5) **Schema evolution**: DynamoDB is schemaless (easy to add fields). PostgreSQL requires migrations (more disciplined, more safe). **Recommendation**: If the only access pattern is `getUserById(userId)` and you expect >100K requests/day, DynamoDB. If you need any reporting, admin queries, or complex JOINs on profile data, PostgreSQL with a read replica and Redis cache for the hot path.

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

GOOD FOR: BAD FOR:

- API endpoints • Long-running tasks (>15 min)
- Event processing • WebSockets
- Scheduled jobs (cron) • Stateful applications
- File processing triggers • High-throughput streaming
- Low/variable traffic • Cold-start-sensitive apps

COLD START: First invocation is slow (JVM = 3-10s)
SOLUTION: SnapStart (AWS), Provisioned Concurrency,
or use Node.js/Python for latency-sensitive functions

### Storage: S3 / Blob Storage

## Class │ Use Case │ Cost

| Standard | Frequent access | $$$ |
| Intelligent | Unknown access | $$ + fee |
| Standard-IA | Infrequent access | $$ |
| Glacier Instant | Archive, instant | $ |
| Glacier | Archive, 3-5 hrs | ¢ |
| Deep Archive | Archive, 12 hrs | ¢¢ |

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

LOCAL │ CLOUD EQUIVALENT
──────────────────────────┼──────────────────────────────
application.properties │ AWS Parameter Store / K8s ConfigMap
Secrets in .env │ AWS Secrets Manager / Key Vault
Local file uploads │ S3 / Blob Storage
In-memory H2 database │ RDS PostgreSQL / Azure SQL
@Cacheable (in-memory) │ ElastiCache Redis
@Async with ThreadPool │ SQS + Lambda workers
@Scheduled cron jobs │ EventBridge / CloudWatch Events
Logback console output │ CloudWatch Logs / ELK
Actuator /health │ ALB health checks
localhost:8080 │ Route 53 → ALB → ECS/EC2

SPRING CLOUD AWS:
<dependency>
<groupId>io.awspring.cloud</groupId>
<artifactId>spring-cloud-aws-starter</artifactId>
</dependency>
→ Auto-configures S3, SQS, SNS, Parameter Store, etc.

---

🔬 **Section Challenge — Cloud for Spring Boot Developers**

**Challenge 1 (Bug Hunt):** A Spring Boot app deployed on ECS Fargate starts throwing `com.amazonaws.SdkClientException: Unable to load AWS credentials from any provider`. The app reads from S3. The developer hardcoded credentials in `application.properties` which works locally. What's the production fix?

<details><summary>Answer</summary>

Root cause: hardcoded credentials in `application.properties` is an anti-pattern and a security violation — the file is committed to Git, exposing keys to anyone with repo access. Production fix: (1) **IAM Task Role**: Attach an IAM Role to the ECS task definition (not the EC2 instance) with the `s3:GetObject` permission scoped to the specific bucket ARN. The AWS SDK automatically discovers credentials via the EC2 Instance Metadata Service (IMDS) endpoint available inside the Fargate container — no credentials needed in code at all. ECS → Task Definition → Task Role → IAM Role with S3 policy. (2) **Verify with AWS SDK credential chain**: SDK checks in order: env vars → system properties → `~/.aws/credentials` → ECS task role → EC2 instance role. In Fargate, the task role is step 4 and is automatic. (3) **Revoke the old keys immediately**: rotate the exposed credentials in IAM, check CloudTrail for unauthorized usage. The single property `spring.cloud.aws.credentials.instance-profile=true` explicitly enables instance profile loading, but with a proper task role it works without any property at all.

</details>

**Challenge 2 (Design):** Your Spring Boot app needs to send email asynchronously (welcome emails, order confirmations). Locally you use `@Async` with a thread pool. Design the cloud-native equivalent architecture on AWS.

<details><summary>Answer</summary>

Local `@Async` is an in-process queue — it fails silently if the JVM crashes mid-email, and it can't be scaled independently. Cloud-native architecture: (1) **Spring Boot** publishes an SNS notification or an SQS message when the triggering event occurs (user registered, order placed): `sqsTemplate.send("email-queue", EmailEvent{...})`. This is fire-and-forget — the API response is immediate. (2) **SQS queue** buffers the messages durably. Messages survive server restarts and auto-retry on failure (visibility timeout). (3) **Lambda or a separate Spring Boot worker** polls the SQS queue (`@SqsListener("email-queue")` in Spring Cloud AWS) and calls SES (Simple Email Service) to actually send. (4) **Dead Letter Queue (DLQ)**: after N failed attempts, the message moves to a DLQ for manual inspection instead of being lost. Benefits over `@Async`: durability (messages survive crashes), independent scaling (email worker scales separately), observability (SQS CloudWatch metrics show queue depth), and retry semantics (exponential backoff built in).

</details>

### Historical Evolution

**Cloud computing has evolved from shared hosting to serverless and managed platform services:**

- **2006** — Amazon Web Services launched with AWS S3 (March) and AWS EC2 (beta August 25, GA October). Jeff Bezos and AWS pioneered the on-demand, pay-per-use cloud compute model, eliminating the capital expenditure barrier to server deployment.
- **2008** — Google App Engine launched (public beta), pioneering the Platform-as-a-Service model with auto-scaling and zero-administration hosting.
- **2010** — Microsoft Azure general availability. Azure brought enterprise-grade cloud infrastructure to the Microsoft ecosystem, integrating with Active Directory, SQL Server, and .NET tooling.
- **2013** — Docker open-sourced, changing what cloud applications looked like. Containers became the atomic deployment unit, enabling the microservices architecture pattern.
- **2014** — AWS Lambda announced at re:Invent (November, GA 2015). Lambda pioneered serverless/FaaS: pay per 100ms of execution, zero server management, auto-scaling to zero.
- **2016** — CNCF (Cloud Native Computing Foundation) formed under Linux Foundation, hosting Kubernetes, Prometheus, and dozens of cloud-native projects.
- **2020s** — Cloud services evolved toward managed platforms (Fargate, Cloud Run) and AI/ML integration as first-class cloud services.

**Key references:**
- Amazon Web Services — AWS (2006, S3 March, EC2 August 25) — Pioneered on-demand cloud compute with pay-per-use pricing and REST-based service APIs.
- Google — App Engine (2008) — Pioneered the PaaS/autoscaling model demonstrating that managed infrastructure could auto-scale without server administration.
- Microsoft — Azure (2010 GA) — Brought enterprise cloud to the Microsoft ecosystem with Azure Active Directory and .NET integration.
- Amazon Web Services — AWS Lambda (2014 re:Invent, GA 2015) — Pioneered serverless/FaaS, establishing that applications could scale to zero and be priced per millisecond.

**Why this matters for cloud services:** The modern cloud service landscape (IaaS, PaaS, SaaS, serverless, containers) did not appear fully formed — each layer emerged from specific technical and business needs. AWS (2006) created on-demand compute; App Engine (2008) proved that platforms could auto-scale; Lambda (2014) demonstrated that even the concept of a server could be abstracted away.

---

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

_Start with ONE cloud provider (the one your target company uses). Master 10 core services deeply. The rest transfers._

---

---

🔬 **Section Challenge — Mental Model: Cloud as Building Blocks**

**Challenge 1 (Reasoning):** A team uses RDS PostgreSQL for their main database. Traffic spikes 10x every Friday at 5pm (salary day, financial app). The DB CPU hits 90% and queries slow to 8 seconds. Without migrating databases, name two cloud-native architectural interventions that reduce the Friday spike impact.

<details><summary>Answer</summary>

1. **Read Replica + Query routing**: Add 1-2 RDS Read Replicas. Route all `SELECT` queries (reports, dashboards, account balance reads) to replicas via Spring's `AbstractRoutingDataSource` or PgBouncer. Writes still go to primary. Reads are 80% of the Friday traffic. Replicas absorb the read load, primary CPU drops to 25%. Cost: ~same as primary instance. Implementation: `spring.datasource.read-url=replica-endpoint`. 2. **ElastiCache Redis for hot data**: Account balances queried 1000x/minute are hot data. Cache them with a 30-second TTL: `@Cacheable("balance")`. Friday spike: 90% of balance reads are served from Redis (~0.3ms) instead of PostgreSQL (~50ms). DB sees 10% of actual query volume. Combined: replicas handle reporting queries, Redis handles hot key-value reads. Primary serves only writes and cold reads — well within capacity. Bonus: RDS also supports **Auto Scaling for read replicas** — configure a scaling policy to add replicas when CPU > 60%. They provision in ~3 minutes.

</details>

**Challenge 2 (Design):** An engineer proposes using S3 to store user profile images, but the CTO says "S3 is just storage, images will be slow." What architectural pattern makes S3-hosted images load as fast as if they were on a CDN?

<details><summary>Answer</summary>

The CTO's concern is valid for direct S3 access (`s3.amazonaws.com/bucket/key`) — latency varies by region and there's no edge caching. The pattern: **CloudFront CDN in front of S3** (this is the AWS standard pattern, used by Netflix, Airbnb, etc.). How it works: (1) Create a CloudFront distribution with your S3 bucket as the **origin**. (2) CloudFront has 400+ edge locations globally. First request to `cdn.myapp.com/avatars/user123.jpg` → CloudFront forwards to S3, fetches the image, **caches it at the edge node**. (3) All subsequent requests from that region are served from the edge cache (~5ms) instead of S3 (~150ms cross-region). (4) Set `Cache-Control: max-age=86400` on S3 objects — images don't change often. Configure **signed URLs** or **CloudFront signed cookies** if images are private (access requires a valid signature). Result: first load = S3 speed (~50-150ms), repeat loads = edge cache (~5-20ms), globally. Cost: CloudFront data transfer is cheaper than direct S3 egress for high-volume use cases. The CTO's concern is solved — S3 becomes the origin, CloudFront becomes the delivery mechanism.

</details>

---

### Trade-off: Cloud Provider Variants

| Aspect              | AWS               | GCP               | Azure             |
|---------------------|-------------------|-------------------|-------------------|
| Market share (2024) | ~32%              | ~22%              | ~23%              |
| Compute leader      | EC2 (2006)        | GCE (2008)        | Azure VM (2010)   |
| Serverless leader   | Lambda (2014)     | Cloud Functions   | Azure Functions   |
| Kubernetes engine   | EKS               | GKE (pioneer)     | AKS               |
| AI/ML leader        | Bedrock, SageMaker| Vertex AI (lead)  | Azure OpenAI      |
| Big data leader     | Redshift, EMR     | BigQuery (lead)   | Synapse           |
| Strengths           | broadest services | data analytics    | enterprise hybrid |
| Pricing model       | complex per-service| simpler tiers    | hybrid benefits   |
| Year founded        | 2006              | 2008              | 2010              |

**Selection rule:** AWS for service breadth and ecosystem; GCP for data/ML workloads; Azure for Microsoft-stack enterprises and hybrid cloud.
