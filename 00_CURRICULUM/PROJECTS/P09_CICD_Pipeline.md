# 🔨 Mini-Project P09 — CI/CD Pipeline for the Library API

> **Semester:** 3, Week 12  
> **Topics:** Docker · Docker Compose · GitHub Actions · PostgreSQL  
> **Est. time:** 5 hours  
> **Language:** YAML (pipeline) + Dockerfile + Shell

---

## 🎯 Business Requirement (The PM Brief)

*The Library API (P04) is ready for production. Before any team of engineers can collaborate, you need: a reproducible containerized environment, automated tests on every push, and a published Docker image. Set up the full CI/CD pipeline.*

---

## 📋 Technical Specification

### Deliverables

| File | Description |
|---|---|
| `Dockerfile` | Multi-stage build for Spring Boot |
| `docker-compose.yml` | API + PostgreSQL + (optional) Adminer |
| `.github/workflows/ci.yml` | GitHub Actions: test → build → push |
| `docker-compose.test.yml` | Compose file for integration tests (Testcontainers) |

### Pipeline Stages

```
Push to any branch:
  ┌──────────────┐
  │  1. Test     │  mvn test -P unit
  │     (JUnit)  │  (unit tests only, no DB)
  └──────┬───────┘
         │ pass
  ┌──────▼───────┐
  │  2. Lint     │  mvn checkstyle:check
  └──────┬───────┘
         │ pass
         │ (only on main branch)
  ┌──────▼───────────┐
  │  3. Build Image  │  docker build -t library-api:$SHA
  └──────┬───────────┘
         │
  ┌──────▼───────────┐
  │  4. Push to Hub  │  docker push saiharsha/library-api:latest
  └──────────────────┘
```

---

## 📝 File Specs

### Dockerfile (Multi-Stage Build)
```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Cache Maven dependencies layer separately
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN ./mvnw dependency:go-offline -q

# Build the application
COPY src ./src
RUN ./mvnw package -DskipTests -q

# ── Stage 2: Run ───────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy only the fat JAR from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# JVM flags: small heap footprint for a container
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]
```

### docker-compose.yml
```yaml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: library_db
      POSTGRES_USER: library_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}  # override via .env
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U library_user -d library_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"

  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/library_db
      SPRING_DATASOURCE_USERNAME: library_user
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:-changeme}
      JWT_SECRET: ${JWT_SECRET:-dev-secret-please-change}
    depends_on:
      db:
        condition: service_healthy

  adminer:
    image: adminer:4
    ports:
      - "8081:8080"
    depends_on:
      - db

volumes:
  postgres_data:
```

### `.github/workflows/ci.yml`
```yaml
name: Library API CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  IMAGE_NAME: saiharsha/library-api

jobs:
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Java 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'maven'          # caches ~/.m2 between runs

      - name: Run Unit Tests
        run: ./mvnw test -P unit --no-transfer-progress

      - name: Publish Test Report
        uses: dorny/test-reporter@v1
        if: always()               # run even if tests fail
        with:
          name: JUnit Test Results
          path: target/surefire-reports/*.xml
          reporter: java-junit

  build-and-push:
    name: Build & Push Docker Image
    needs: test                    # only runs if test job passes
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'   # only on main branch
    steps:
      - uses: actions/checkout@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.IMAGE_NAME }}:latest
            ${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha    # GitHub Actions cache for Docker layers
          cache-to: type=gha,mode=max

      - name: Image digest
        run: echo "Pushed ${{ env.IMAGE_NAME }}:${{ github.sha }}"
```

---

## ✅ Acceptance Criteria

- [ ] `docker-compose up` starts API + DB — API responds at `http://localhost:8080/api/books`
- [ ] `docker-compose down -v` cleanly removes containers and volumes
- [ ] GitHub Actions pipeline runs on every push — test stage passes before build
- [ ] Multi-stage Dockerfile: final image is `<200MB` (JRE only, no JDK)
- [ ] API container runs as non-root user (`spring`)
- [ ] Secrets (JWT_SECRET, DB_PASSWORD) are NEVER hardcoded — passed via env vars or GitHub Secrets
- [ ] DB healthcheck prevents API from starting before DB is ready
- [ ] Docker image tagged with both `latest` and `$GITHUB_SHA`

---

## 🔴 Failure Scenarios & Erklärungen

| Mistake | Why | Fix |
|---|---|---|
| Single-stage Dockerfile with JDK | Final image ~600MB (includes compiler, JDK tools) | Multi-stage: build with JDK, run with JRE (~180MB) |
| No `depends_on` health check | API starts before DB is ready → crash loop | `depends_on: db: condition: service_healthy` |
| Hardcoded `POSTGRES_PASSWORD: mypassword` | Password visible in git history forever | Use `${DB_PASSWORD:-changeme}` + `.env` file (gitignored) |
| Running container as root | Security vulnerability — exploited process has root access | `adduser spring && USER spring:spring` |
| `COPY . .` before dependency download | Every source code change busts the Maven dependency cache layer | `COPY pom.xml .` + `dependency:go-offline` BEFORE `COPY src .` |
| No `--no-transfer-progress` in CI | Maven logs 1000s of download progress lines | Add flag for clean, readable CI output |
| Pushing on every PR | Pollutes Docker Hub with untested images | Add `if: github.ref == 'refs/heads/main'` guard |

---

## 🚀 Extension Challenges

1. **Matrix build:** Test against Java 17 AND Java 21 simultaneously using GitHub Actions matrix
2. **Security scan:** Add `trivy` Docker image vulnerability scanner as a CI step
3. **Deploy to cloud:** Add a step to `kubectl apply` the image to a minikube cluster
4. **Integration test job:** Add a separate CI job that runs `docker-compose up` and runs Testcontainers tests against the live stack

---

[← Back to Semester 3 Guide](../../00_CURRICULUM/SEMESTER_3_GUIDE.md)
