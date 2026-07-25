**Navigation**: [< Previous](17_Servers_Ports_Networking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](19_Concurrency_Models_Coroutines.md)

**Developer Essentials Chapter 18** | [← Servers & Networking](17_Servers_Ports_Networking.md) | [Index](../00_MASTER_INDEX.md) | [Next Series → Spring Boot Deps Map](../07_Modern_Java/Ch30_Dependencies_Annotations_Map.md)

# Backend + Cloud Integration — From Local to Production

## 📌 WHY / WHAT / WHERE / WHEN / WHO / HOW

**WHY**: Spring Boot apps running on cloud platforms have unique deployment, observability, and resilience requirements that differ from on-premise. Wrong integration patterns cause ECS connection pool exhaustion (Tomcat default 200 threads × 30s timeout = 200 stuck requests), CloudFront cache stampedes when Authorization headers leak into cache keys, and Lambda cold start cascades (10s init time on 512MB functions). Each of these failure modes has a specific, named fix.

**WHAT**: Deployment evolution (Physical → VM → Container → Serverless); Spring Boot → AWS service mapping; ECS rolling deployment patterns (especially SIGTERM handling); CloudFront caching with Spring Boot (the Authorization-header trap); Lambda + Spring Cloud Function; observability integration (Spring Boot Actuator + CloudWatch); JPA N+1 query patterns in cloud DBs; resilience patterns (circuit breaker, retry, bulkhead) for cloud inter-service calls.

**WHERE**: Every production Spring Boot deployment on AWS, Azure, or GCP; microservices architectures; event-driven systems; serverless backends. The Spring Boot ecosystem (50M+ downloads/month in 2024) means this chapter applies to a majority of Java backend teams.

**WHEN**: When migrating from monolith to containers (ECS/EKS); when scaling beyond single instance (multi-AZ, multi-region); when targeting serverless (Lambda with Spring Cloud Function); when adopting microservices (inter-service resilience); when integrating with managed databases (RDS, DynamoDB); when wiring observability for production operations.

**WHO**: Docker released March 2013 (Solomon Hykes at dotCloud). Kubernetes released June 2014 (Google, derived from Borg). Spring Boot 1.0 released April 2014 (Pivotal, now VMware Tanzu). ECS launched November 2014 (AWS); EKS June 2018; Fargate November 2017; Lambda November 2014. The CNCF (Cloud Native Computing Foundation, founded July 2015) maintains Kubernetes and the broader cloud-native ecosystem.

**HOW**: Deployment evolution first (the control-vs-maintenance spectrum anchors all subsequent decisions), then Spring Boot → AWS service mapping table, then ECS rolling deployment specifics (SIGTERM is load-bearing, not optional), then CloudFront caching pitfalls (Authorization header kills cache hit rate), then observability integration (Actuator endpoints + CloudWatch metrics), then production failure modes with named fixes.

## 5W1H — Why This Chapter?

WHAT: How backend applications are deployed, scaled, and
operated in cloud environments (AWS, Azure, GCP).

WHY: Writing code is 30% of the job. The other 70% is:
deploying, monitoring, scaling, securing, and
troubleshooting it in production.

ANALOGY: Building a car (coding) vs driving it on highways
(cloud deployment). You need both skills.

WHO: Backend and full-stack developers in 2024+.

HOW: Local → Container → Cloud Service → Production

---

## 1. The Deployment Evolution

```
ERA 1: PHYSICAL SERVER (2000s)
├── Buy a server rack. Put it in a data center.
├── Install OS, Java, database manually.
├── Deploy WAR file to Tomcat.
└── Problem: Takes weeks. Expensive. Can't scale easily.

ERA 2: VIRTUAL MACHINES (2010s)
├── Cloud provider gives you a "virtual server" in minutes.
├── AWS EC2, Azure VM, GCP Compute Engine.
├── You manage: OS updates, security patches, scaling.
└── Better, but still lots of maintenance.

ERA 3: CONTAINERS (2015+)
├── Docker: package your app + all dependencies.
├── "Works on my machine" → "Works everywhere."
├── Kubernetes: orchestrate 100s of containers.
└── You manage: container orchestration, networking.

ERA 4: SERVERLESS / PLATFORM (2020+)
├── Just deploy your code. Cloud handles everything else.
├── AWS Lambda, Azure Functions, AWS App Runner.
├── Auto-scaling, zero maintenance, pay-per-use.
└── You manage: just the code.

 More Control ◄──────────────────────────► Less Maintenance
 VM > Container > Platform > Serverless
```

---

## 2. Cloud Service Models

**The deployment spectrum — cooking at home vs meal kit vs restaurant delivery**:

- **IaaS (cook at home)**: you rent a kitchen (EC2 instance), buy ingredients (configure the OS, install Java), and cook from scratch. Maximum control over ingredients and process, but you handle shopping, prep, and cleanup. **Spring Boot example**: deploy a JAR to EC2 with custom bash scripts; you manage systemd, log rotation, health checks.

- **PaaS (meal kit)**: the provider ships pre-measured ingredients and a recipe. You still cook, but shopping and prep are done. **Spring Boot example**: deploy to AWS Elastic Beanstalk or Google App Engine; you provide the JAR, the platform handles capacity provisioning, load balancing, OS patching.

- **FaaS / Serverless (restaurant delivery)**: you place an order, food arrives ready-to-eat. No kitchen, no cooking, no cleanup. **Spring Boot example**: AWS Lambda with Spring Cloud Function; you provide the function handler, the platform handles everything else. Pay only when the function runs.

- **Container (food truck)**: a self-contained unit you can park anywhere. The truck has the kitchen, ingredients, and chef; you just pick the location. **Spring Boot example**: deploy a Docker image to ECS or EKS; the container has everything needed, the platform schedules and scales.

**The control-versus-maintenance spectrum**: as you move right (IaaS → FaaS), you give up control but gain operational simplicity. IaaS lets you tune JVM flags, kernel parameters, and network stack — but you're responsible for OS patching, capacity planning, and failure recovery. FaaS abstracts all of this but constrains runtime (15-minute max execution time, 512MB typical memory limit).

**Decision rule**: pick the leftmost option that meets your requirements. Don't reach for FaaS unless your workload is event-driven and short-lived; don't pick IaaS unless you need specific hardware or kernel tuning.

---

## 3. AWS Services Map (What Developers Need)

```
AWS SERVICES — Developer's Guide (The Important Ones)

COMPUTE (Run your code):
┌───────────────────┬────────────────────────────────────────┐
│ EC2               │ Virtual server. Full control.          │
│                    │ Like renting an empty apartment.      │
│ ECS / Fargate      │ Run Docker containers. Fargate =      │
│                    │ serverless containers (no server mgmt)│
│ Lambda            │ Run functions. Pay per execution.      │
│                    │ No server at all. Event-driven.       │
│ Elastic Beanstalk │ PaaS. Upload code, AWS does rest.      │
│                    │ Good for Spring Boot quick deploy.    │
└───────────────────┴────────────────────────────────────────┘

DATABASE:
┌───────────────────┬───────────────────────────────────────┐
│ RDS               │ Managed SQL (MySQL, PostgreSQL).      │
│                    │ Backups, replicas handled by AWS.    │
│ DynamoDB           │ NoSQL key-value. Infinitely scalable.│
│ ElastiCache       │ Managed Redis/Memcached. Caching.     │
└───────────────────┴───────────────────────────────────────┘

STORAGE:
┌───────────────────┬────────────────────────────────────────┐
│ S3                │ Object storage. Files, images, backups.│
│                    │ Like Google Drive for your app.       │
└───────────────────┴────────────────────────────────────────┘

NETWORKING:
┌───────────────────┬───────────────────────────────────────┐
│ VPC               │ Virtual private network. Your servers │
│                    │ live in an isolated network bubble.  │
│ ALB (Load Balancer)│ Distributes traffic across servers.  │
│ Route 53          │ DNS service. Maps domain → servers.   │
│ CloudFront        │ CDN. Cache static content worldwide.  │
└───────────────────┴───────────────────────────────────────┘

MESSAGING:
┌───────────────────┬───────────────────────────────────────┐
│ SQS               │ Message queue. Decouple services.     │
│ SNS               │ Pub/sub notifications.                │
│ MSK               │ Managed Kafka. Event streaming.       │
└───────────────────┴───────────────────────────────────────┘

MONITORING:
┌───────────────────┬────────────────────────────────────────┐
│ CloudWatch        │ Metrics, logs, alarms. "Is it healthy?"│
└───────────────────┴────────────────────────────────────────┘
```

---

## 4. Typical Spring Boot Cloud Architecture

```
PRODUCTION ARCHITECTURE for a Spring Boot Application:

Internet
   │
   ▼
┌──────────────┐     DNS: myapp.com → ALB IP
│   Route 53   │
└──────┬───────┘
       ▼
┌──────────────┐     CDN: Cache static assets (React build)
│  CloudFront  │──→  S3 Bucket (React SPA / static files)
└──────┬───────┘
       ▼
┌──────────────┐     SSL termination, routes /api/* to backend
│     ALB      │
└──┬───┬───┬───┘
   │   │   │
   ▼   ▼   ▼
┌───┐┌───┐┌───┐   ECS Fargate (or EC2 instances)
│SB1││SB2││SB3│   Spring Boot containers (auto-scaled)
└─┬─┘└─┬─┘└─┬─┘
  │     │     │
  ▼     ▼     ▼
┌──────────────┐   RDS (PostgreSQL) with read replicas
│   Database   │
│  (Primary)   │──→  [Read Replica 1]  [Read Replica 2]
└──────┬───────┘
       │
       ▼
┌──────────────┐   ElastiCache (Redis) for sessions + cache
│    Redis     │
└──────────────┘

Also connected:
├── SQS: async job processing (email sending, reports)
├── S3: file uploads (user avatars, documents)
└── CloudWatch: logs, metrics, alerts
```

---

🔬 **Section Challenge — 4. Typical Spring Boot Cloud Architecture**

**Challenge 1 (Reasoning):** A typical Spring Boot deployment uses Route 53 → CloudFront → ALB → ECS Fargate (Spring Boot) → RDS + Redis. If CloudFront is configured to forward _all_ headers to the ALB, what happens to caching performance and why?

<details><summary>Answer</summary>

Caching performance collapses to near zero. **Why**: CloudFront uses the forwarded headers as part of the cache key. If it forwards headers that change per request (like `User-Agent`, `Authorization`, or custom client IDs), CloudFront treats every request as unique and never serves a cache hit. **Fix**: Configure CloudFront to only forward specific headers needed for content negotiation or authorization, or use a separate cache behavior for static assets (which shouldn't forward headers) vs API calls (which bypass cache anyway).

</details>

**Challenge 2 (Design):** In the architecture above, the ECS Fargate instances auto-scale based on CPU. During a massive traffic spike, instances scale up from 3 to 15, but the system crashes entirely. What two downstream bottlenecks were likely ignored in the auto-scaling design?

<details><summary>Answer</summary>

(1) **Database Connection Exhaustion**: Each Spring Boot instance maintains a HikariCP connection pool (default 10 connections). Scaling from 3 to 15 instances increases total DB connections from 30 to 150. If the RDS instance max connections limit is 100, the new instances fail to start or crash trying to connect. **Fix**: Use RDS Proxy or PgBouncer to multiplex connections. (2) **Redis/ElastiCache Saturation**: A sudden 5x increase in instances means a 5x increase in session lookups or cache hits, potentially overwhelming the Redis primary node's network or CPU. **Fix**: Ensure Redis is scaled to handle the peak concurrent load of the _maximum_ possible auto-scaled instances, not just the baseline.

</details>

## 5. Environment Configuration

```
ENVIRONMENTS — Same Code, Different Config:

LOCAL (developer laptop):
├── Database: localhost:3306 / H2 in-memory
├── Redis: localhost:6379
├── API URL: http://localhost:8080
└── Logs: DEBUG level

DEV (shared development server):
├── Database: dev-db.internal:3306
├── Redis: dev-redis.internal:6379
├── API URL: https://dev-api.myapp.com
└── Logs: DEBUG level

STAGING (pre-production, mirrors prod):
├── Database: staging-db.internal:3306
├── Redis: staging-redis.internal:6379
├── API URL: https://staging-api.myapp.com
└── Logs: INFO level

PRODUCTION:
├── Database: prod-db.internal:3306 (RDS, encrypted)
├── Redis: prod-cache.internal:6379 (ElastiCache)
├── API URL: https://api.myapp.com
└── Logs: WARN level

Spring Boot: application-{profile}.properties
├── application-local.properties
├── application-dev.properties
├── application-staging.properties
└── application-prod.properties

SECRETS (passwords, API keys):
NEVER in code or properties files!
├── AWS Secrets Manager
├── Azure Key Vault
├── Environment variables (passed at deploy time)
└── Spring Cloud Config Server
```

---

## 6. CI/CD Pipeline for Spring Boot

```
FULL PIPELINE: Code → Production

Developer pushes code to GitHub
     │
     ▼
┌─── GitHub Actions / Jenkins ───────────────────────────────┐
│                                                            │
│  STAGE 1: BUILD                                            │
│  ├── mvn clean package (compile + test)                    │
│  ├── Run unit tests                                        │
│  ├── Run integration tests                                 │
│  └── Static analysis (SonarQube)                           │
│                                                            │
│  STAGE 2: CONTAINERIZE                                     │
│  ├── docker build -t myapp:v1.2.3 .                        │
│  └── docker push to ECR (container registry)               │
│                                                            │
│  STAGE 3: DEPLOY TO STAGING                                │
│  ├── Update ECS task definition with new image             │
│  ├── Run smoke tests against staging                       │
│  └── Run end-to-end tests                                  │
│                                                            │
│  STAGE 4: DEPLOY TO PRODUCTION (manual approval)           │
│  ├── Rolling update (one container at a time)              │
│  ├── Health check passes → continue                        │
│  ├── Health check fails → automatic rollback               │
│  └── Monitor metrics for 15 minutes                        │
│                                                            │
└────────────────────────────────────────────────────────────┘

Dockerfile for Spring Boot:
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/myapp.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Diagram: ECS Rolling Deployment Sequence

```
DEPLOYMENT TIME T=0
       │
       ▼
┌─────────────────┐
│ ECS Service      │ (desired=4, running=4)
│ Current state    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Rolling update   │ Start task v2 (running=4, desired=5)
│ Phase 1          │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Drain v1         │ Connection draining 30s, deregister from ALB
│                  │ (running=4 v1 draining + 1 v2)
└────────┬────────┘
         ▼
┌─────────────────┐
│ Stop v1          │ SIGTERM → 30s grace → SIGKILL
│                  │ (running=4 v2)
└────────┬────────┘
         ▼
┌─────────────────┐
│ Continue         │ Repeat for v1 #2, #3, #4
└─────────────────┘

BUG: If v1 doesn't handle SIGTERM (no graceful shutdown),
ALB returns 502 for in-flight requests during phase 2.
```

---

🔬 **Section Challenge — 6. CI/CD Pipeline for Spring Boot**

**Challenge 1 (Docker Image Size):** A Spring Boot pipeline builds a Docker image using `FROM maven:3.9-eclipse-temurin-21` and copies the source code to run `mvn clean package` inside the Dockerfile. The final image is 1.2GB. Why is this an anti-pattern and how do you fix it?

<details><summary>Answer</summary>

This is a single-stage build. It includes the entire JDK, Maven, all downloaded dependencies in `.m2`, and the source code in the final production image. This increases the attack surface, pull time, and storage cost. **Fix**: Use a **Multi-stage Docker build**. Stage 1 (`build`): Use the heavy Maven image to compile the jar. Stage 2 (final): Use a lightweight JRE image (e.g., `eclipse-temurin:21-jre-alpine`), and `COPY --from=build` only the compiled `app.jar`. The final image drops to ~150MB, containing only the JRE and the artifact.

</details>

**Challenge 2 (Graceful Shutdown):** The CI/CD pipeline deploys a new container image to ECS. During the rolling update, 5% of user requests randomly fail with HTTP 502/504 errors, then everything stabilizes. What is missing in the Spring Boot configuration?

<details><summary>Answer</summary>

**Graceful Shutdown** is missing. When ECS stops the old container, it sends a `SIGTERM` signal. By default, Tomcat immediately stops accepting new connections AND abruptly drops in-flight requests, causing the 50x errors. **Fix**: Enable graceful shutdown in `application.properties` via `server.shutdown=graceful` and `spring.lifecycle.timeout-per-shutdown-phase=20s`. This tells Tomcat to stop accepting _new_ requests but wait up to 20s for active requests to finish before shutting down. The load balancer (ALB) also needs connection draining configured to match.

</details>

## 7. Monitoring in Production

```
THE 3 PILLARS OF OBSERVABILITY:

1. METRICS — Numbers over time:
   ├── CPU usage, memory usage, request count
   ├── Response time (p50, p95, p99)
   ├── Error rate (% of 5xx responses)
   ├── Database connection pool usage
   └── Tools: Prometheus + Grafana, CloudWatch

2. LOGS — Text records of events:
   ├── Application logs (what happened, when, why)
   ├── Structured JSON logs (machine-parseable)
   ├── Correlation ID (trace a request across services)
   └── Tools: ELK Stack (Elasticsearch, Logstash, Kibana)

3. TRACES — Follow a request across services:
   ├── User → API Gateway → Service A → Service B → DB
   ├── See WHERE the time was spent
   ├── Find the bottleneck in a chain of 10 microservices
   └── Tools: Jaeger, Zipkin, AWS X-Ray

Spring Boot Actuator endpoints for monitoring:
/actuator/health  → is the app healthy?
/actuator/metrics → JVM memory, thread count, HTTP stats
/actuator/info    → app version, build time
/actuator/prometheus → metrics in Prometheus format
```

---

🔬 **Section Challenge — 7. Monitoring in Production**

**Challenge 1 (Reasoning):** A user complains they got a "500 Internal Server Error" at exactly 2:15 PM. You have 10 Spring Boot microservices and 5 instances of each (50 total logs to check). Without checking all 50 manually, what observability pattern solves this instantly?

<details><summary>Answer</summary>

**Distributed Tracing and Correlation IDs**. When a request hits the API Gateway (or first service), it generates a unique `X-Correlation-ID` (or `traceparent` in W3C standards). This ID is passed in HTTP headers to every downstream service and injected into MDC (Mapped Diagnostic Context) in Spring Boot, so it prints on every log line. **Fix**: Search the centralized log aggregator (Kibana/CloudWatch) for `level:ERROR` around 2:15 PM, grab the correlation ID of the 500 error, and then search the entire log system for _that specific ID_. You immediately see the exact path the request took through all 10 microservices and exactly where it failed.

</details>

**Challenge 2 (Design):** You configure an alert to page you if CPU usage on your EC2 instances exceeds 90% for 5 minutes. Is this a good or bad alert? Why?

<details><summary>Answer</summary>

**Bad alert (Anti-pattern)**. This is a _cause-based_ alert, not a _symptom-based_ alert. High CPU is not inherently a problem if the application is still serving requests quickly and successfully. Paging someone at 3 AM because CPU hit 90% when users aren't experiencing any issues causes alert fatigue. **Fix**: Alert on **User-Facing Symptoms** (The Golden Signals). Page if the 95th percentile latency exceeds 500ms, or if the 5xx error rate exceeds 1%. CPU can be recorded on a dashboard for investigation _after_ a symptom alert fires.

</details>

### Historical Evolution

**The cloud-native era has evolved from 2006 EC2 to 2015 Kubernetes:**

- **2006** — Amazon Web Services launched AWS S3 (March) and AWS EC2 (beta August 25, general availability October). AWS pioneered the on-demand compute model, charging per hour instead of per rack, and eliminated the capital expenditure barrier to server deployment.
- **2007** — Heroku founded by Adam Wiggins, Orion Henry, and others, pioneering Platform-as-a-Service. Heroku's "git push to deploy" workflow established the developer experience standard that all subsequent PaaS and serverless platforms would adopt.
- **2010** — Salesforce acquired Heroku, validating the PaaS model as a mainstream enterprise capability and expanding Heroku's reach into enterprise customers requiring compliance and managed infrastructure.
- **2011** — Adam Wiggins and the Heroku team published "The Twelve-Factor App" methodology at 12factor.net (see Chapter 11). The 12 factors (config, build/release/run, stateless processes, port binding, concurrency, disposability) became the de facto standard for cloud-native application architecture.
- **2013** — Solomon Hykes at dotCloud open-sourced Docker at PyCon US (March). Docker's layered image model and simple CLI made containerization accessible to every developer, creating the foundation for the modern container ecosystem.
- **2014** — AWS Lambda announced at re:Invent (November), general availability in 2015. Lambda pioneered the serverless compute model — paying per 100ms of execution, scaling to zero, and eliminating server management entirely for event-driven workloads.
- **2015** — Kubernetes 1.0 released (July). Originally designed at Google based on Borg (internal container orchestration, pre-2015), donated to CNCF. Kubernetes unified container orchestration across cloud providers and became the standard for container orchestration.
- **2019** — Spring Cloud AWS (io.awspring.cloud) became an officially supported project, providing Spring Boot auto-configuration for S3, SQS, SNS, Parameter Store, and Secrets Manager integration. This brought AWS's managed service ecosystem to the most widely-used Java framework.

**Key references:**
- Amazon Web Services — AWS EC2 (2006, GA October) — Pioneered on-demand cloud compute; established the pay-per-use pricing model and REST-based service APIs that all subsequent cloud providers adopted.
- Solomon Hykes (dotCloud) — Docker open-source (2013, PyCon US) — Docker's layered image format and container runtime became the universal deployment unit; the OCI (Open Container Initiative) standard ensures portability across all container runtimes.
- Google — Kubernetes (2015, CNCF) — Originally Borg/Omega internal systems; Kubernetes abstracted these into a portable, vendor-neutral orchestration API that runs on AWS, Azure, GCP, and on-premises.
- Adam Wiggins et al. (Heroku) — The Twelve-Factor App (2011) — The methodological foundation for cloud-native applications; the principles of config via environment variables, statelessness, and declarative setup are the direct ancestors of modern cloud-native application design (see Chapter 11).
- Amazon Web Services — AWS Lambda (2014, re:Invent; GA 2015) — Pioneered serverless/FaaS; Lambda's event-driven model, pay-per-invocation pricing, and automatic scaling established serverless as a first-class compute model.
- Spring Community — Spring Cloud AWS (2019) — Integrated AWS managed services (S3, SQS, SNS, RDS, Secrets Manager) into Spring Boot's auto-configuration model, making AWS-native development idiomatic for Java developers.

### Production Reality

**Backend and cloud integration patterns fail in production in these named ways:**

- **ECS connection pool exhaustion** — auto-scaling adds 5 ECS Fargate tasks (from 3 to 8) during peak traffic. HikariCP connection pool stays at 10 connections per task = 80 total DB connections. The RDS instance has max_connections=100. Two new tasks connect (20 more = 100), every subsequent connection is refused. Users see "Connection refused" at peak checkout time. Mitigation: use **RDS Proxy** — it multiplexes hundreds of application connections down to a handful of DB connections using async I/O.
- **CloudFront header forwarding kills cache hit rate** — adding `Authorization` header to the cache key (to support per-user caching) reduces CloudFront cache hit rate from 85% to 12%. Origin load increases 7x. AWS bill for EC2 origin scales up proportionally. Fix: only forward headers required for content negotiation (e.g., `Accept-Language`); use separate cache behaviors for static assets vs. dynamic API calls.
- **Rolling update without graceful shutdown** — ECS rolling deployment replaces tasks before in-flight requests finish. ALB receives traffic for a task that is already terminating, returns 502. With 8 replacement tasks during a deployment, ~10% of requests fail. Fix: configure `connectionDraining` on the ALB (drain timeout 60s) + `server.shutdown=graceful` in Spring Boot + `spring.lifecycle.timeout-per-shutdown-phase=30s`.
- **Lambda cold start latency spike** — first Lambda invocation after idle (5+ minutes) takes 800ms-2000ms due to runtime initialization (JVM for Java lambdas). Subsequent invocations reuse the warm container in ~5-50ms. A user-facing API with cold starts has p99 latency 20x worse than average. Mitigation: provisioned concurrency (always-warm instances at ~$0.015/hour each) or keep lambdas warm with scheduled CloudWatch Events.
- **Spring Data JPA N+1 query** — lazy loading `order.getCustomer().getAddress().getCity()` in a loop over 100 orders fires 1 (orders) + 100 (customer per order) + 100 (address per customer) + 100 (city per address) = 401 queries per request. Under high concurrency, 401 queries/req x 500 req/s = 200,500 DB queries/s. RDS CPU maxes out; connections queue; 503s. Fix: use `@EntityGraph`, `JOIN FETCH` in JPQL, or batch fetching at the JPA/Hibernate level.

**Debug workflow:** For ECS connection exhaustion: monitor `HikariPool.getTotalConnections()` in Prometheus; for CloudFront cache hit rate: CloudFront cache statistics in AWS Console; for Lambda cold starts: `AWS Lambda Insights` extension reports initialization duration per invocation.
**Mitigation discipline:** Use RDS Proxy for all ECS Fargate database connections; separate static asset caching from dynamic API paths in CloudFront; always configure graceful shutdown + ALB connection draining before any production deployment; use `@Query(join fetch)` to prevent N+1 in JPA; monitor provisioned concurrency spend for Lambda vs. cold start budget.

**Why this matters for cloud integration:** The cloud-native era did not begin with Kubernetes (2015) — it began with EC2 (2006), was shaped by Heroku's PaaS practices (2007-2011), and was made universal by Docker (2013). Understanding the 2006-2015 arc explains why modern cloud architecture uses containers as the atomic deployment unit, why 12-Factor principles are non-negotiable, and why serverless and containers are complementary tools in the same cloud-native toolkit.

---

## Interview Quick-Fire

```
Q: How would you deploy a Spring Boot app to AWS?
→ Containerize with Docker → Push to ECR → Deploy on ECS Fargate
  (or Elastic Beanstalk for simpler setup). Database on RDS.
  Load balancer (ALB) in front. CloudWatch for monitoring.

Q: What's the difference between EC2, ECS, and Lambda?
→ EC2: full virtual server (you manage everything).
  ECS: run Docker containers (you manage containers).
  Lambda: run individual functions (you manage nothing).
  More abstraction = less control but less maintenance.

Q: How do you handle secrets in production?
→ NEVER in code or config files. Use AWS Secrets Manager or
  environment variables injected at deployment time.
  Spring Boot: @Value("${DB_PASSWORD}") reads from env.

Q: What is a VPC?
→ Virtual Private Cloud. An isolated network in the cloud.
  Your servers live inside it. You control who can enter (security
  groups) and how traffic flows (subnets, route tables).

Q: How do you handle database migrations in production?
→ Flyway or Liquibase. Version-controlled SQL scripts that run
  automatically on app startup. Forward-only. Never edit
  a migration that's been deployed.
```

---

[← Servers & Networking](17_Servers_Ports_Networking.md) | [Index](../00_MASTER_INDEX.md) | [Next Series → Spring Boot Deps Map](../07_Modern_Java/Ch30_Dependencies_Annotations_Map.md)


---

## Reality Check

**"Integrating with a cloud service means calling its SDK"** ? The SDK call is the easy 10 percent; the integration is everything around the network hop you do not control: TIMEOUTS on every call (the default SDK timeout is often minutes � one slow dependency and your thread pool is gone, [networking]'s budget-alignment applied), retries with backoff and idempotency (the cloud API WILL return transient 503s � [distributed-systems]' ambiguous-failure lesson), and credential lifecycle (rotating keys, expiring tokens, the OIDC federation that beats long-lived secrets � [CI/CD] and [IAM] converging). Code that treats a cloud API like a local function call ships an outage waiting for the provider's next hiccup.

**"The cloud service is highly available, so my integration is reliable"** ? Their SLA covers THEIR uptime, not your integration's resilience: a 99.99 percent service still fails 4 minutes a month, and during those minutes your code either degrades gracefully (circuit breaker opens, cached/fallback response, queued-for-later) or amplifies the outage (the retry storm that turns their blip into your cascade, the synchronous call chain where their 4 minutes becomes your 4 minutes plus timeout stacking). Your reliability is min-bounded by theirs and further reduced by every un-guarded coupling � the integration's availability is something you ENGINEER below their ceiling, not inherit from it.

**"Async integration via a queue decouples my service"** ? The queue relocates the coupling into semantics you now own ([distributed-systems] and [message-queue] lessons landing together): at-least-once delivery makes consumers need idempotency (the payment processed twice because the ack was lost), ordering holds only per-partition (the events that arrived out of sequence), poison messages halt or loop without dead-letter handling (the one malformed event that stops the world), and the producer's success no longer means the work happened (the transactional-outbox pattern exists because publish-then-crash loses events, and publish-inside-transaction is impossible across two systems). Decoupled in time, coupled in correctness � the queue is a contract, not a firewall.

**"Data consistency between my DB and the cloud service is automatic"** ? Dual writes across two systems have NO shared transaction, so the crash between them is the default failure, not the edge case: charge the payment provider, crash before recording it locally (money moved, your DB disagrees � the reconciliation nightmare), or record locally, fail to publish the event (your DB says done, downstream never heard). The patterns that survive are the ones that accept this: transactional outbox (write intent locally in the same transaction, publish asynchronously with retry), saga with compensation (every forward step has a documented undo), and reconciliation jobs as the safety net (the periodic sweep that finds and heals divergence � because at scale, some fraction WILL diverge and hope is not a recovery strategy).

**"Local development mirrors the cloud integration"** ? The local mock diverges from the real service in exactly the dimensions that cause production incidents: the emulator's latency is zero (your timeout and retry logic never exercised until prod), its consistency is immediate (the eventual-consistency read-your-writes bug invisible locally � [system-design]'s replica lag), its auth is permissive (the IAM permission you never needed locally, denied in prod), and its error surface is a fraction of the real one (the throttle, the region failover, the malformed response you never simulated). The disciplines that close the gap: contract tests against the real service in CI ([21_SDET Ch38]), staging that hits real (non-prod) cloud resources, and deliberate fault injection (kill the dependency in a test, [Ch61]'s emulation applied to integrations) � local-mirrors-prod is the assumption every integration incident retrospective quietly refutes.
