# 📝 Developer Essentials — Problem Sets

## `13_Developer_Essentials` Module | Git · Linux · API Design · Clean Code · Monitoring

> **How to use:** All Git commands must be typed from memory. API design questions require you to write a complete spec before checking. Read 🔴 **Erklärung** when your mental model breaks.

---

## Problem Set DEV-PS1 — Git Version Control

**Prerequisites:** `13_Developer_Essentials/01_Git_Version_Control.md`

---

### Part A: Predict the State

**A1 (Easy).** A developer runs these commands. What is the state of `feature.txt` after each step?

```bash
echo "v1" > feature.txt
git add feature.txt
echo "v2" > feature.txt
git commit -m "save"
```

<details><summary>Answer</summary>

| After Command | Working Tree | Staging Area     | Last Commit |
| ------------- | ------------ | ---------------- | ----------- |
| `echo "v1"`   | `v1`         | —                | —           |
| `git add`     | `v1`         | `v1`             | —           |
| `echo "v2"`   | `v2`         | `v1`             | —           |
| `git commit`  | `v2`         | `v1` (committed) | `v1`        |

**The commit contains `v1`, NOT `v2`.** `git add` snapshots the file at that moment. Subsequent edits are NOT included in the commit unless you `git add` again.

<details>
<summary>Key Insight</summary>

This is the most common Git surprise for beginners. `git add` does NOT create a "live link" to the file — it copies the file's current content into the staging area. Always `git status` before committing.

</details>

</details>

---

**A2 (Medium).** Explain the difference between `git merge`, `git rebase`, and `git cherry-pick`. When is each appropriate?

<details><summary>Answer</summary>

| Command                  | What it does                                   | History                     | Use when                                        |
| ------------------------ | ---------------------------------------------- | --------------------------- | ----------------------------------------------- |
| `git merge feature`      | Creates a merge commit combining two branches  | Non-linear (shows branches) | Merging feature branches into main              |
| `git rebase main`        | Replays your commits on top of main's HEAD     | Linear (clean history)      | Updating your local feature branch              |
| `git cherry-pick abc123` | Copies ONE specific commit onto current branch | Copies (new hash)           | Hotfixing — need ONE commit from another branch |

```
Before merge:           After merge:
main:  A─B─C            A─B─C─────M  (merge commit)
feature:  └─D─E         feature: └─D─E

Before rebase:          After rebase:
main:  A─B─C            A─B─C─D'─E'  (feature commits replayed)
feature:  └─D─E         (D, E get new hashes D', E')
```

**Golden rule:** Never rebase commits that have been pushed to a shared branch. Rebase rewrites commit hashes — other developers' branches will diverge.

<details>
<summary>Key Insight</summary>

`git rebase` is NOT "better" than merge. It creates a clean LINEAR history, but REWRITES commits (new hashes). On a shared branch, this forces everyone else to `git pull --force` — destructive. Use rebase only on LOCAL unpushed branches.

</details>

</details>

---

**A3 (Hard).** You committed a secret (API key) 3 commits ago. How do you PERMANENTLY remove it from Git history? List the exact commands.

<details><summary>Answer</summary>

**Step 1:** Remove from current working tree:

```bash
echo "" > .env   # blank the file
echo ".env" >> .gitignore
git add .env .gitignore
git commit -m "Remove secret from .env"
```

**Step 2:** Rewrite history to remove the secret from ALL past commits:

```bash
# Option A: git filter-branch (deprecated but common)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty -- --all

# Option B: BFG Repo-Cleaner (faster, recommended)
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**Step 3:** Force-push:

```bash
git push origin --force --all
git push origin --force --tags
```

**Step 4:** Rotate the secret. The old key is compromised even after history rewrite — it exists in clones, forks, and CI caches. **Always rotate credentials after exposure.**

<details>
<summary>Key Insight</summary>

`git rm` only removes from the CURRENT commit. The secret is still in the reflog and in every previous commit's tree object. History rewriting tools (filter-branch or BFG) rebuild every commit's tree from the point of introduction. This changes ALL subsequent commit hashes — coordinate with your team before running.

</details>

</details>

---

### Part B: Implementation

**B1.** Write a `.gitignore` for a Java + Spring Boot + Node.js monorepo. Explain each section.

<details><summary>Answer</summary>

```gitignore
# ── Java / Maven ──────────────────────────
target/                     # Maven build output
*.class                     # Compiled bytecode
*.jar                       # Packaged JARs (build artifacts)
*.war

# ── IDE ───────────────────────────────────
.idea/                      # IntelliJ IDEA
*.iml
.vscode/settings.json       # personal settings (keep launch.json for shared)
.project                    # Eclipse
.classpath

# ── Node.js ───────────────────────────────
node_modules/               # npm packages (always reinstall from package.json)
dist/                       # build output
.next/                      # Next.js build cache

# ── Environment / Secrets ─────────────────
.env                        # NEVER commit secrets
.env.local
*.pem                       # SSL certificates
*.key                       # Private keys

# ── OS ────────────────────────────────────
.DS_Store                   # macOS
Thumbs.db                   # Windows
desktop.ini

# ── Logs & Runtime ────────────────────────
*.log
*.pid
*.seed
```

**Rule:** Commit a `.env.example` with dummy values so teammates know which vars to set.

</details>

---

## Problem Set DEV-PS2 — API Design & Clean Code

---

### Part A: Design Challenges

**A1 (Medium).** Design a RESTful API for a blog platform. Provide the full endpoint table with HTTP methods, paths, request bodies, and response codes.

<details><summary>Answer</summary>

| Method | Path                       | Description                | Request Body                      | Success                     | Error    |
| ------ | -------------------------- | -------------------------- | --------------------------------- | --------------------------- | -------- |
| GET    | `/api/posts`               | List all posts (paginated) | —                                 | 200 + `Page<PostDto>`       | —        |
| GET    | `/api/posts/{id}`          | Get single post            | —                                 | 200 + `PostDto`             | 404      |
| POST   | `/api/posts`               | Create post                | `{ title, body, tags }`           | **201** + `Location` header | 400, 401 |
| PUT    | `/api/posts/{id}`          | Full update                | `{ title, body, tags }`           | 200                         | 400, 404 |
| PATCH  | `/api/posts/{id}`          | Partial update             | `{ title }` (only changed fields) | 200                         | 400, 404 |
| DELETE | `/api/posts/{id}`          | Delete post                | —                                 | **204** (no body)           | 404      |
| POST   | `/api/posts/{id}/comments` | Add comment                | `{ body }`                        | 201                         | 400, 404 |
| GET    | `/api/posts/{id}/comments` | List comments              | —                                 | 200                         | 404      |

**Key REST rules applied:**

- POST returns **201 Created** with `Location: /api/posts/42` header — NOT 200
- DELETE returns **204 No Content** — NOT 200 with `{ "deleted": true }`
- PUT = full replacement (all fields required). PATCH = partial update (only changed fields)
- Collections use plural nouns (`/posts`, NOT `/post`)
- No verbs in paths (`/api/posts`, NOT `/api/createPost`)

<details>
<summary>Key Insight</summary>

The most common API design mistake is returning 200 for everything. HTTP status codes exist for a reason — use them. Clients (especially React Query) rely on status codes for error handling.

</details>

</details>

---

**A2 (Hard).** Refactor this "God class" into clean, SOLID-compliant code:

```java
// BEFORE — violates SRP, OCP, DIP
class UserService {
    public User register(String email, String password) {
        // validate email format
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) throw new InvalidEmailException();
        // hash password
        String hashed = BCrypt.hashpw(password, BCrypt.gensalt());
        // save to database
        User user = new User(email, hashed);
        jdbcTemplate.update("INSERT INTO users ...", user.email(), user.passwordHash());
        // send welcome email
        JavaMailSender sender = new JavaMailSenderImpl();
        sender.send(createWelcomeEmail(user));
        // fire analytics event
        HttpClient.newHttpClient().send(
            HttpRequest.newBuilder().uri(URI.create("https://analytics.com/event")).POST(...).build(),
            BodyHandlers.ofString());
        return user;
    }
}
```

<details><summary>Answer</summary>

```java
// AFTER — each class has ONE responsibility

// 1. Validation (pure function, no side effects)
@Component
class EmailValidator {
    public void validate(String email) {
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$"))
            throw new InvalidEmailException(email);
    }
}

// 2. Password hashing (infrastructure concern)
@Component
class PasswordHasher {
    public String hash(String raw) {
        return BCrypt.hashpw(raw, BCrypt.gensalt());
    }
}

// 3. Persistence (repository pattern)
@Repository
interface UserRepository extends JpaRepository<User, Long> {}

// 4. Email notification (infrastructure, injected via interface)
interface WelcomeNotifier {
    void sendWelcome(User user);
}

@Component
class EmailWelcomeNotifier implements WelcomeNotifier {
    private final JavaMailSender sender;
    public void sendWelcome(User user) { sender.send(createWelcomeEmail(user)); }
}

// 5. Analytics (fire-and-forget, async)
@Component
class AnalyticsPublisher {
    @Async
    public void publishEvent(String eventType, Map<String, Object> data) { /* ... */ }
}

// 6. Orchestrator — thin, delegates everything
@Service
@Transactional
class UserRegistrationService {
    private final EmailValidator validator;
    private final PasswordHasher hasher;
    private final UserRepository repo;
    private final WelcomeNotifier notifier;
    private final AnalyticsPublisher analytics;

    public User register(String email, String password) {
        validator.validate(email);
        var user = new User(email, hasher.hash(password));
        repo.save(user);
        notifier.sendWelcome(user);    // could be async event instead
        analytics.publishEvent("USER_REGISTERED", Map.of("userId", user.getId()));
        return user;
    }
}
```

**SOLID principles applied:**

- **SRP:** Each class does exactly one thing
- **OCP:** Add `SmsWelcomeNotifier` without changing `UserRegistrationService` (inject via interface)
- **DIP:** `UserRegistrationService` depends on `WelcomeNotifier` interface, not `JavaMailSender` concrete class
</details>

---

## Problem Set DEV-PS3 — Monitoring & Observability

---

**A1 (Medium).** What are the "Three Pillars of Observability"? For each, give the tool, the question it answers, and a concrete example from a Spring Boot app.

<details><summary>Answer</summary>

| Pillar      | Tool                                            | Question Answered      | Example                                                                                                |
| ----------- | ----------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| **Logs**    | ELK (Elasticsearch + Logstash + Kibana) or Loki | "What happened?"       | `2024-01-15 14:23:01 ERROR OrderService: Payment failed for order-123: CardDeclinedException`          |
| **Metrics** | Prometheus + Grafana                            | "How much / how fast?" | `http_server_requests_seconds_count{uri="/api/orders", status="500"} 47` → 47 errors in the last hour  |
| **Traces**  | Jaeger or Zipkin (via Micrometer Tracing)       | "Where did time go?"   | Order request: API Gateway (2ms) → OrderService (15ms) → PaymentService (450ms ←bottleneck) → DB (3ms) |

**Spring Boot Actuator exposes all three:**

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, prometheus, info
  metrics:
    export:
      prometheus:
        enabled: true
  tracing:
    sampling:
      probability: 1.0 # sample 100% in dev, 10% in production
```

<details>
<summary>Key Insight</summary>

Logs tell you WHAT happened. Metrics tell you HOW MUCH is happening. Traces tell you WHERE the bottleneck is. You need ALL three — logs without metrics = blind to trends; metrics without traces = can't pinpoint the slow service.

</details>

</details>

---

**A2 (Hard).** Your Spring Boot API's p99 latency jumped from 50ms to 2 seconds. Walk through the exact diagnostic steps using the three pillars.

<details><summary>Answer</summary>

**Step 1 — Metrics (identify WHEN and WHAT):**

```promql
# Grafana: find the exact time the spike started
histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))

# Which endpoints are affected?
http_server_requests_seconds_count{status="200"}  # group by uri
```

Findings: Only `GET /api/orders` is slow. Started at 14:00.

**Step 2 — Traces (identify WHERE the time is spent):**
Open Jaeger → search traces for `/api/orders` with duration > 1s.

Findings: The trace shows:

- OrderController: 2ms
- OrderService: 3ms
- OrderRepository.findAll(): **1800ms** ← bottleneck
- Network to DB: 5ms

**Step 3 — Logs (identify WHY):**

```bash
# Search ELK for the slow query
grep "slow query" logs | grep "orders"
```

Findings: PostgreSQL slow query log shows `SELECT * FROM orders` doing a **full table scan** — missing index on `customer_id` after yesterday's migration dropped it.

**Step 4 — Fix:**

```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
```

**Step 5 — Verify:** Grafana shows p99 back to 50ms within 2 minutes of index creation.

</details>

---

### Historical Evolution

**Observability tooling has evolved through several distinct eras:**

- **2010** — Elasticsearch (Shay Banon, Compass/university projects) open-sourced; combined with Logstash and Kibana (the ELK Stack) to form the first widely-adopted centralized logging platform for production systems.
- **2011** — Etsy open-sourced StatsD (original: 2008 internal), providing the metric aggregation pattern that would later be ingested by Prometheus and Graphite.
- **2012** — Prometheus originally developed at SoundCloud (Matthias Rampke, Julius Volz, and others) to address the limitations of StatsD and Graphite for high-cardinality, service-level monitoring. Open-sourced at DockerCon 2016, it became the CNCF's second graduated project.
- **2014** — Grafana (Torkel Oeldegard and others, originally forked from Kibana) introduced the visualization layer that paired with Prometheus, InfluxDB, and Elasticsearch to produce the modern operations dashboard standard.
- **2015** — OpenTracing standard created (originally by LightStep, later CNCF) to provide vendor-neutral distributed tracing instrumentation. In 2019, OpenTracing merged with OpenCensus to form **OpenTelemetry** (OTel), the current CNCF standard for observability instrumentation.
- **2016** — Google published the SRE Book (*Site Reliability Engineering*, edited by Betsy Beyer et al., O'Reilly), making the internal practices of Borgmon, error budgets, SLOs, and toil management available to the industry for the first time.
- **2017** — Peter Bourgon's "Metrics, Logs, and Traces: The Three Pillars of Observability" talk at Systems Matters / GOTO Conferences formalized the "Three Pillars" taxonomy — logs (what happened), metrics (how much/how fast), and traces (where did it happen) — as the canonical mental model for production observability.

**Key references:**
- Prometheus Authors (SoundCloud) — Prometheus (2012, open-source 2016) — CNCF graduated project. Pull-based metrics model, multi-dimensional data, powerful PromQL. Directly inspired by Borgmon (Google internal, pre-2012).
- Grafana Labs — Grafana (2014) — Open-source visualization platform; the dominant dashboard tool for Prometheus, InfluxDB, Elasticsearch, and all major observability backends.
- Elasticsearch (Elastic B.V.) — Elasticsearch (2010) — Distributed, RESTful search and analytics engine; the core of the ELK Stack for log indexing and full-text search.
- CNCF OpenTelemetry — OpenTelemetry (OTel, 2019, formed from OpenTracing 2015 + OpenCensus) — The current industry standard for distributed tracing and metrics instrumentation, replacing proprietary agents.
- Google SRE Team — *Site Reliability Engineering* (2016) — First comprehensive publication of Google's internal SRE practices including the Four Golden Signals, SLOs, and error budgets.
- Peter Bourgon — "The Three Pillars of Observability" (~2017) — Formalized the logs/metrics/traces taxonomy as the canonical mental model for distributed systems observability.

**Why this matters for this chapter:** The observability tools and patterns in these problem sets are not arbitrary — each emerged from a specific production failure or scale challenge at a major engineering organization. Prometheus (SoundCloud, 2012) solved pull-based metric collection at scale. OpenTelemetry (2019) solved vendor lock-in in tracing instrumentation. The Three Pillars model (Bourgon, ~2017) gave teams a shared vocabulary for debugging distributed systems.

---

## DEV-PS4: Docker — File and Compose (Medium)

You are containerizing a Spring Boot 3.x application that depends on Postgres 15 and Redis 7.

### Task 1: Multi-stage Dockerfile

Write a `Dockerfile` that:
1. Uses `eclipse-temurin:21-jdk-alpine` as the build stage
2. Uses `eclipse-temurin:21-jre-alpine` as the runtime stage (smaller attack surface — no JDK tools)
3. Copies the Gradle wrapper, builds with `./gradlew bootJar`, then extracts layers
4. Runs as non-root user (`spring:spring`)
5. Has a HEALTHCHECK that hits `/actuator/health`

### Task 2: docker-compose.yml

Write a `docker-compose.yml` that:
1. Defines 3 services: `app`, `postgres`, `redis`
2. Uses named volumes for Postgres data persistence
3. Wires the app's `DATABASE_URL` and `REDIS_URL` env vars from compose env
4. Sets `depends_on` with health conditions (not just `service_started`)
5. Exposes only the app port (5432 and 6379 stay internal)

### Task 3: Identify the bug

```yaml
# Buggy compose snippet
services:
  app:
    image: myapp:latest
    ports:
      - "8080:8080"
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: mypassword
    ports:
      - "5432:5432"
```

What's wrong with this configuration for a production deployment?

<details>
<summary>Answer</summary>

**Multi-stage Dockerfile answer**:

```dockerfile
# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN ./gradlew dependencies --no-daemon
COPY src ./src
RUN ./gradlew bootJar --no-daemon

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S spring && adduser -S spring -G spring
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
USER spring:spring
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Layer caching: copy Gradle wrapper and `build.gradle` BEFORE `COPY src` — this way, source code changes don't invalidate the dependency download layer (saves ~30s on rebuild).

**docker-compose.yml answer**:

```yaml
services:
  app:
    image: myapp:latest
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/myapp
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 3s
      retries: 5
    # NO ports exposed — stays internal

  redis:
    image: redis:7
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    # NO ports exposed — stays internal

volumes:
  postgres-data:
```

**Task 3 — the bugs**:
1. **POSTGRES_PASSWORD hardcoded in YAML** — should use `${POSTGRES_PASSWORD}` env var (or Docker secrets). Hardcoded secrets in version-controlled YAML leak to anyone with repo access.
2. **Postgres port 5432 exposed externally** — anyone on the network can attempt connection. For local dev, fine; for production, never expose DB ports.
3. **No `depends_on` health conditions** — app may start before Postgres is ready, causing connection-refused errors on first request.
4. **No named volume for Postgres data** — when the container is removed, all data is lost.

Production-grade compose: secrets via env or Docker secrets, internal-only DB ports, health checks with conditions, persistent volumes.
</details>

---

## DEV-PS5: CI/CD — GitHub Actions Pipeline (Medium)

You are designing a CI/CD pipeline for a Spring Boot 3.x microservice deployed to AWS ECS. The service has unit tests, integration tests, and a Docker image build.

### Task 1: Pipeline stages

Design a GitHub Actions workflow with these stages, with appropriate dependencies:
1. **Lint** — runs ESLint (JavaScript), Checkstyle (Java), shellcheck (shell scripts)
2. **Unit Test** — runs `./gradlew test`, generates coverage report
3. **Integration Test** — runs `./gradlew integrationTest`, requires Postgres + Redis services
4. **Build** — builds the JAR, produces coverage artifact
5. **Docker Build** — multi-stage build, pushes to ECR
6. **Deploy Staging** — updates ECS service
7. **Deploy Production** — requires manual approval

### Task 2: Write the workflow file

Write `.github/workflows/ci.yml` that implements the pipeline. Use:
- `ubuntu-latest` runners
- Postgres 15 + Redis 7 service containers for integration tests
- Matrix strategy for Java 17 and Java 21
- Artifact upload for the JAR and coverage report
- Concurrency limit to cancel outdated runs on the same PR
- Environment protection for production (manual approval required)

### Task 3: Identify the bug

```yaml
# Buggy workflow snippet
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: mypassword
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - run: ./gradlew integrationTest

  deploy:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - run: aws ecs update-service --cluster prod --service myapp
```

What's wrong with this configuration?

<details>
<summary>Answer</summary>

**Task 1 — Pipeline design**:

```
lint → unit-test → build ─┐
              │             │
              └─→ integration-test ─→ docker-build ─→ deploy-staging ─→ [manual approval] ─→ deploy-production
```

Concurrency: only one run per branch. Use `concurrency: group: ${{ github.ref }}, cancel-in-progress: true`.

**Task 2 — Workflow file**:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - run: ./gradlew checkstyleMain checkstyleTest

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        java: [17, 21]
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpassword
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: ${{ matrix.java }}
      - run: ./gradlew test integrationTest
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.java }}
          path: build/reports/jacoco/test/jacocoTestReport.xml

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - run: ./gradlew bootJar
      - uses: actions/upload-artifact@v4
        with:
          name: jar
          path: build/libs/*.jar

  docker-build:
    runs-on: ubuntu-latest
    needs: build
    permissions:
      contents: read
      id-token: write   # for OIDC
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE }}
          aws-region: us-east-1
      - uses: aws-actions/amazon-ecr-login@v2
      - run: docker build -t $ECR_REGISTRY/myapp:$GITHUB_SHA .
      - run: docker push $ECR_REGISTRY/myapp:$GITHUB_SHA

  deploy-staging:
    runs-on: ubuntu-latest
    needs: docker-build
    environment: staging
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE }}
          aws-region: us-east-1
      - run: |
          aws ecs update-service \
            --cluster staging \
            --service myapp \
            --force-new-deployment

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://myapp.example.com
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE }}
          aws-region: us-east-1
      - run: |
          aws ecs update-service \
            --cluster production \
            --service myapp \
            --force-new-deployment
```

**Task 3 — the bugs**:

1. **Hardcoded POSTGRES_PASSWORD** in workflow YAML — secret in version control. Use GitHub Secrets: `POSTGRES_PASSWORD: ${{ secrets.TEST_DB_PASSWORD }}`.
2. **No health checks on service containers** — integration tests may run before Postgres is ready, causing flaky failures. Add `options: --health-cmd ...` as shown above.
3. **Deploy job has no `environment` block** — production deploys without manual approval, which is reckless. Add `environment: production` with required reviewers in GitHub repo settings.
4. **No OIDC for AWS auth** — long-lived AWS access keys in `secrets.AWS_ACCESS_KEY_ID` are a security risk. Use OIDC (`role-to-assume` + `id-token: write`) for short-lived credentials.
5. **No concurrency limit** — multiple pushes to the same PR create queued jobs that consume runner minutes. Add `concurrency: cancel-in-progress: true`.
6. **No matrix strategy** — only tests against one Java version. Production may run Java 21 while tests only ran Java 17.

**Production hardening**:
- Pin action versions to SHA, not tag (`@actions/checkout@b4ffde...` instead of `@v4`) — tags can be moved
- Add SBOM generation for supply chain security
- Cache Gradle dependencies: `cache: 'gradle'` in setup-java
- Add OPA/Conftest to enforce policy (e.g., "no direct main commits")
</details>

[← Back to Curriculum Overview](../00_CURRICULUM/CURRICULUM_OVERVIEW.md)


---

## Reality Check

**"Essentials problem sets are trivia checks"** ? The essentials genre only transfers when problems are SCENARIO-shaped � the git rescue (detached HEAD with lost commits: reflog your way home), the mystery-permission failure (writable file, undeletable � the directory-bit diagnosis), the Dockerfile that rebuilds everything per edit (reorder for cache), the CI pipeline that leaks a secret through logs (find the exposure path), the flaky deploy script (find the missing quote-discipline) � because the job-form of this knowledge is diagnostic, not definitional. A set you can pass by definition-recall is measuring the wrong memory system.

**"Tool exercises should isolate one tool at a time"** ? Real incidents CROSS tools by nature (the deploy that fails: is it the git tag, the CI cache, the Docker build context, or the shell expansion in the release script?), so the highest-value exercises are short cross-tool chains with a single root cause hidden somewhere in the pipeline � training the routing instinct (which layer do I interrogate first, [production-debugging]'s change-hunt applied to your own toolchain) that isolated drills never build. The one-tool drills are warm-ups; the chains are the sport.

**"Practicing commands builds command of the tools"** ? Commands decay; MODELS persist: the exercises worth repeating are prediction drills against the model � what does this rebase do to these three branches (draw the graph first, then run it), what does this pipeline print given this quoting (predict, then execute), which layers rebuild given this Dockerfile edit (reason from cache rules, then verify) � the [trace-and-diff] protocol from language learning applied to infrastructure. Ten predicted-then-verified scenarios build more durable capability than a hundred followed-along commands, because the diff between prediction and reality is where the model corrects.

**"Soft-skill topics (reviews, retros, docs) can't be problem sets"** ? They drill as ARTIFACT EXERCISES with real fidelity: review this genuinely-flawed PR (find the missing timeout among the style noise � the signal-versus-nitpick discipline), rewrite this useless commit history into an atomic reviewable stack, turn this incident transcript into the three retro actions with owners, write the runbook entry for this alert. The artifacts are checkable against known defects, the reps are fast, and the skills are precisely the ones interviews probe with "tell me about a time" � except practiced rather than remembered.

**"The essentials are learned once, early"** ? Every layer here MOVES (git gains switch/restore and sparse-checkout idioms, CI platforms rotate syntax and security models, container tooling churns build systems, shells stay frozen but your usage patterns drift toward whatever you did last quarter): the essentials are a maintenance domain with a small periodic dose � one scenario-drill session monthly, plus the real-incident harvest (every production surprise in these tools becomes a problem-set entry � the personal incident bank being the highest-fidelity training data you will ever own). Treating essentials as a solved chapter is how ten-year veterans end up debugging 2026 pipelines with 2016 mental models.
