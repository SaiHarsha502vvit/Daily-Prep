# 📝 DevOps — Problem Sets

## `22_DevOps` Module | Docker · GitHub Actions · Kubernetes Concepts

> **How to use:** Write every command from memory before checking. Part B deliverables are YAML files you actually write and test.

---

## Problem Set DEVOPS-PS1 — Docker & Containerization

**Prerequisites:** `22_DevOps/01_Docker_Fundamentals.md`, `22_DevOps/02_Docker_Compose.md`

---

### Part A: Theoretical

**A1 (Easy).** What is a Docker image layer? Why does layer order matter in a Dockerfile?

<details><summary>Answer</summary>

**Image layer:** Each `RUN`, `COPY`, `ADD` instruction creates a read-only layer. Layers are cached by their content hash. Docker only rebuilds layers that changed AND all layers after them.

**Why order matters:** Frequently changing layers should go LAST.

```dockerfile
# ❌ Bad: source code change busts ALL layers below (including Maven download)
COPY src ./src
RUN mvn dependency:go-offline

# ✅ Good: Maven dependencies cached separately — only rebuilt if pom.xml changes
COPY pom.xml .
RUN mvn dependency:go-offline    # cached until pom.xml changes
COPY src ./src
RUN mvn package -DskipTests      # only runs when src changes
```

🔴 **Erklärung:** A `COPY . .` before `mvn dependency:go-offline` means every source code change (even a comment) invalidates the dependency download layer — `mvn` re-downloads hundreds of MB on every build. This is the #1 Docker performance mistake.

</details>

---

**A2 (Medium).** Explain the difference between Docker `CMD` and `ENTRYPOINT`. When should each be used?

<details><summary>Answer</summary>

|            | `ENTRYPOINT`                 | `CMD`                                 |
| ---------- | ---------------------------- | ------------------------------------- |
| Purpose    | The command that ALWAYS runs | Default arguments (can be overridden) |
| Override   | `docker run --entrypoint`    | `docker run image <new-cmd>`          |
| Common use | The application executable   | Application arguments / flags         |

**Common pattern (ENTRYPOINT + CMD together):**

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
CMD ["--server.port=8080"]   # default port, overridable

# Override port: docker run image --server.port=9090
```

**CMD alone:**

```dockerfile
CMD ["java", "-jar", "app.jar"]   # entire command can be overridden
# docker run image bash  → runs bash instead of the app
```

🔴 **Erklärung:** Use ENTRYPOINT for the fixed executable. Use CMD for default flags/arguments. `CMD` alone is fine for development images where you want full flexibility. Production images should use ENTRYPOINT to prevent accidentally running a shell instead of the application.

</details>

---

**A3 (Hard).** Two containers in the same Docker Compose stack need to communicate. Container `api` needs to call container `db` on port 5432. How does DNS resolution work inside Docker networks?

<details><summary>Answer</summary>

**Docker's embedded DNS:** When you `docker-compose up`, Docker creates a bridge network and registers each container's service name as a DNS hostname within that network.

So `api` can reach `db` at hostname `db`:

```yaml
services:
  api:
    environment:
      DB_URL: jdbc:postgresql://db:5432/mydb # "db" resolves to the db container's IP
  db:
    image: postgres:16-alpine
```

**How it works:**

1. Docker starts its own DNS server at `127.0.0.11` inside each container
2. When `api` calls `db:5432`, the DNS server resolves `db` to the container's IP on the bridge network
3. Containers on different networks cannot reach each other (network isolation)

**Localhost is NOT the same:** `localhost` inside `api` refers to `api` itself — NOT the host machine, NOT `db`. Use service names for inter-container communication.

🔴 **Erklärung:** The most common mistake is `SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/db`. This works outside Docker (direct host connection) but fails inside a container where `localhost` = the container itself.

</details>

---

### Part B: Write the Files

**B1.** Write a multi-stage Dockerfile for a Java 17 Spring Boot application that:

- Final image is based on JRE (not JDK)
- Runs as a non-root user
- Caches Maven dependencies as a separate layer
- Final image is under 200MB

<details><summary>Answer</summary>

```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN ./mvnw dependency:go-offline -q

COPY src ./src
RUN ./mvnw package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
USER app:app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

**Why < 200MB:** `eclipse-temurin:17-jre-alpine` base = ~90MB. Plus app JAR ~50MB. Total ≈ 140MB. Using JDK would be ~340MB.

</details>

---

**B2.** Write a `docker-compose.yml` for: Spring Boot API + PostgreSQL + Redis. Include health checks and environment variable management.

<details><summary>Answer</summary>

```yaml
version: "3.9"
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/${DB_NAME}
      SPRING_DATASOURCE_USERNAME: ${DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASS}
      SPRING_REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }

volumes:
  pgdata:
```

Variables come from `.env` file (gitignored): `DB_NAME=myapp\nDB_USER=user\nDB_PASS=pass\nJWT_SECRET=xxx`

</details>

---

## Problem Set DEVOPS-PS2 — GitHub Actions & CI/CD

---

### Part A: Theoretical

**A1 (Medium).** What is the difference between a GitHub Actions `job` and a `step`? How do you pass data between steps?

<details><summary>Answer</summary>

**Job:** An independent unit of work running on its own runner (VM). Jobs run in PARALLEL by default; use `needs: [job1]` for sequential.

**Step:** A sequential task within a job — runs `uses: action/checkout@v4` or `run: npm test`. Steps within a job share the same filesystem and environment.

**Passing data between steps (via output):**

```yaml
steps:
  - id: version
    run: echo "tag=$(git describe --tags)" >> $GITHUB_OUTPUT

  - run: echo "Deploying version ${{ steps.version.outputs.tag }}"
```

**Passing data between jobs (via artifacts):**

```yaml
jobs:
  build:
    steps:
      - run: ./mvnw package
      - uses: actions/upload-artifact@v4
        with: { name: jar, path: target/*.jar }
  deploy:
    needs: build
    steps:
      - uses: actions/download-artifact@v4
        with: { name: jar }
```

🔴 **Erklärung:** Steps share filesystem. Jobs do NOT — each job starts from a fresh VM. To pass build artifacts between jobs, use `upload-artifact` + `download-artifact`.

</details>

---

**A2 (Hard).** Design a GitHub Actions pipeline that:

1. Runs tests on Java 17 AND 21 in parallel
2. Only builds the Docker image if tests pass on BOTH
3. Only pushes to Docker Hub if the branch is `main`

<details><summary>Answer</summary>

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        java: [17, 21]
      fail-fast: true    # if one fails, cancel others
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: ${{ matrix.java }}, distribution: temurin, cache: maven }
      - run: ./mvnw test --no-transfer-progress

  build-push:
    needs: test          # runs only if ALL matrix test jobs pass
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        if: github.ref == 'refs/heads/main'  # login only on main
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: ${{ github.ref == 'refs/heads/main' }}  # push only on main
          tags: myuser/myapp:${{ github.sha }}
```

**Key:** `needs: test` waits for ALL matrix instances of the `test` job. `fail-fast: true` cancels parallel test jobs if one fails. Push is gated by `github.ref` check.

</details>

---

🔴 **DEVOPS Erklärung Summary:**

| Mistake                              | Why                                        | Fix                                                     |
| ------------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| Secrets in `docker-compose.yml`      | Committed to git — exposed forever         | Use env vars from `.env` (gitignored) or Docker secrets |
| No health checks                     | API starts before DB ready → crash         | `depends_on: condition: service_healthy`                |
| Build Docker image before tests pass | Broken image pushed to registry            | `needs: test` in CI pipeline                            |
| `COPY . .` as first instruction      | Busts all cached layers on any file change | Copy `pom.xml` first, then source                       |
| Running containers as root           | Security risk                              | `adduser` + `USER` instruction                          |

---

[← Back to Semester 3 Guide](../00_CURRICULUM/SEMESTER_3_GUIDE.md)


---

## Reality Check

**"DevOps problem sets are command-recall quizzes"** — The genre that predicts real capability is INCIDENT-SHAPED scenarios: the pod stuck in CrashLoopBackOff (read the events, the logs, the resource limits — reconciliation debugging), the deploy that "succeeded" per the pipeline but serves zero healthy traffic (readiness probe, image pull, the [Kubernetes] apply-versus-healthy gap), the Terraform plan that wants to destroy the database (read before apply), the certificate expiring this weekend, the disk filling from an unbounded log. DevOps knowledge is diagnostic under pressure, not definitional — a set you pass by recalling flag syntax measures the wrong thing.

**"Each tool should be drilled in isolation"** — Real incidents CROSS the stack, so the highest-value exercises are chains with one root cause hidden somewhere: the deploy fails — is it the git tag, the CI cache, the image build, the k8s resource limit, the network policy, or the DNS? — training the layer-bisection routing instinct ([15_Network_Debugging]'s discipline generalized to the whole toolchain) that single-tool drills never build. Isolated drills are warm-ups; the cross-stack chains are the actual sport, because production never presents a problem pre-labeled with which tool owns it.

**"Practicing commands builds command of the tools"** — Commands decay; MODELS persist ([13_DE problem-sets]' lesson): the exercises worth repeating are prediction drills against the model — what does this reconciliation do given this desired state and this actual state, what does this Terraform plan change and why does it say replace, which layer is this network failure at. Predict-then-verify builds the model that transfers to the tool version you have not seen; command-following builds familiarity with the syntax you happened to practice, which the next release changes.

**"Infrastructure problems can't be practiced without production"** — Ephemeral environments make most of it practicable safely: a local Kubernetes (kind/minikube) to break and diagnose, a throwaway cloud account for the Terraform-plan-reading and IAM-scoping drills, [Ch61]-style fault injection and chaos experiments in a sandbox, container-based reproductions of the networking and Linux scenarios. The genuinely production-only lessons (real scale, real traffic patterns, real multi-region failure) are the minority — most DevOps skill is practicable in disposable environments, and "needs production" is often "I have not set up the sandbox," which is itself the [13_DE Docker] ephemeral-environment skill being practiced.

**"The DevOps stack is learned once and stable"** — Every layer churns faster than most (orchestrators evolve, cloud services launch and deprecate, pipeline platforms rotate syntax and security models, IaC tools gain and change features) while the PRINCIPLES stay fixed (reconciliation, immutability, observability, least-privilege, blast-radius containment, the DORA and SRE fundamentals): the maintenance strategy is anchoring on principles and treating specific tools as their current implementations — plus the real-incident harvest (every production surprise becomes a personal problem-set entry, the highest-fidelity training data you own, [13_DE problem-sets]). Treating the stack as a solved chapter is how engineers end up debugging 2026 infrastructure with 2018 mental models — the tools moved, and the un-refreshed knowledge quietly expired.
