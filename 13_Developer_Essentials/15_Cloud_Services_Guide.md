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

**Challenge 1 (Bug Hunt):** A Spring Boot app deployed on ECS Fargate starts throwing `com.amazonaws.SdkClientException: Unable to load AWS credentials from any provider`. The app reads from S3. The developer hardcoded credentials in `application.properties` which works locally. What's the production fix?

<details><summary>Answer</summary>

Root cause: hardcoded credentials in `application.properties` is an anti-pattern and a security violation — the file is committed to Git, exposing keys to anyone with repo access. Production fix: (1) **IAM Task Role**: Attach an IAM Role to the ECS task definition (not the EC2 instance) with the `s3:GetObject` permission scoped to the specific bucket ARN. The AWS SDK automatically discovers credentials via the EC2 Instance Metadata Service (IMDS) endpoint available inside the Fargate container — no credentials needed in code at all. ECS → Task Definition → Task Role → IAM Role with S3 policy. (2) **Verify with AWS SDK credential chain**: SDK checks in order: env vars → system properties → `~/.aws/credentials` → ECS task role → EC2 instance role. In Fargate, the task role is step 4 and is automatic. (3) **Revoke the old keys immediately**: rotate the exposed credentials in IAM, check CloudTrail for unauthorized usage. The single property `spring.cloud.aws.credentials.instance-profile=true` explicitly enables instance profile loading, but with a proper task role it works without any property at all.

</details>

**Challenge 2 (Design):** Your Spring Boot app needs to send email asynchronously (welcome emails, order confirmations). Locally you use `@Async` with a thread pool. Design the cloud-native equivalent architecture on AWS.

<details><summary>Answer</summary>

Local `@Async` is an in-process queue — it fails silently if the JVM crashes mid-email, and it can't be scaled independently. Cloud-native architecture: (1) **Spring Boot** publishes an SNS notification or an SQS message when the triggering event occurs (user registered, order placed): `sqsTemplate.send("email-queue", EmailEvent{...})`. This is fire-and-forget — the API response is immediate. (2) **SQS queue** buffers the messages durably. Messages survive server restarts and auto-retry on failure (visibility timeout). (3) **Lambda or a separate Spring Boot worker** polls the SQS queue (`@SqsListener("email-queue")` in Spring Cloud AWS) and calls SES (Simple Email Service) to actually send. (4) **Dead Letter Queue (DLQ)**: after N failed attempts, the message moves to a DLQ for manual inspection instead of being lost. Benefits over `@Async`: durability (messages survive crashes), independent scaling (email worker scales separately), observability (SQS CloudWatch metrics show queue depth), and retry semantics (exponential backoff built in).

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

**Challenge 1 (Reasoning):** A team uses RDS PostgreSQL for their main database. Traffic spikes 10x every Friday at 5pm (salary day, financial app). The DB CPU hits 90% and queries slow to 8 seconds. Without migrating databases, name two cloud-native architectural interventions that reduce the Friday spike impact.

<details><summary>Answer</summary>

1. **Read Replica + Query routing**: Add 1-2 RDS Read Replicas. Route all `SELECT` queries (reports, dashboards, account balance reads) to replicas via Spring's `AbstractRoutingDataSource` or PgBouncer. Writes still go to primary. Reads are 80% of the Friday traffic. Replicas absorb the read load, primary CPU drops to 25%. Cost: ~same as primary instance. Implementation: `spring.datasource.read-url=replica-endpoint`. 2. **ElastiCache Redis for hot data**: Account balances queried 1000x/minute are hot data. Cache them with a 30-second TTL: `@Cacheable("balance")`. Friday spike: 90% of balance reads are served from Redis (~0.3ms) instead of PostgreSQL (~50ms). DB sees 10% of actual query volume. Combined: replicas handle reporting queries, Redis handles hot key-value reads. Primary serves only writes and cold reads — well within capacity. Bonus: RDS also supports **Auto Scaling for read replicas** — configure a scaling policy to add replicas when CPU > 60%. They provision in ~3 minutes.

</details>

**Challenge 2 (Design):** An engineer proposes using S3 to store user profile images, but the CTO says "S3 is just storage, images will be slow." What architectural pattern makes S3-hosted images load as fast as if they were on a CDN?

<details><summary>Answer</summary>

The CTO's concern is valid for direct S3 access (`s3.amazonaws.com/bucket/key`) — latency varies by region and there's no edge caching. The pattern: **CloudFront CDN in front of S3** (this is the AWS standard pattern, used by Netflix, Airbnb, etc.). How it works: (1) Create a CloudFront distribution with your S3 bucket as the **origin**. (2) CloudFront has 400+ edge locations globally. First request to `cdn.myapp.com/avatars/user123.jpg` → CloudFront forwards to S3, fetches the image, **caches it at the edge node**. (3) All subsequent requests from that region are served from the edge cache (~5ms) instead of S3 (~150ms cross-region). (4) Set `Cache-Control: max-age=86400` on S3 objects — images don't change often. Configure **signed URLs** or **CloudFront signed cookies** if images are private (access requires a valid signature). Result: first load = S3 speed (~50-150ms), repeat loads = edge cache (~5-20ms), globally. Cost: CloudFront data transfer is cheaper than direct S3 egress for high-volume use cases. The CTO's concern is solved — S3 becomes the origin, CloudFront becomes the delivery mechanism.

</details>
