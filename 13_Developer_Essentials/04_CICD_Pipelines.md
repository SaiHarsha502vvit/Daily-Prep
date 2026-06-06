# 🔄 CI/CD Pipelines — Complete Guide

**Navigation**: [< Docker](03_Docker_Containers.md) | [Index](00_INDEX.md) | [Next: Clean Code >](05_Clean_Code.md)

---

# WHY: Why CI/CD Exists

## The Problem: Manual Deployment

```
Old workflow (still happens in many companies):
1. Developer finishes code
2. Emails ZIP file to "deployment team"
3. Deployment team extracts to server
4. Manually runs build commands
5. Prays it works
6. If it breaks → rollback by replacing old ZIP

Problems:
  - 2-4 weeks between code written and deployed
  - Human errors at every step
  - "It worked when I tested locally"
  - Friday 5 PM deployments → weekend debugging
  
Companies like Google, Netflix, Amazon deploy 100+ TIMES PER DAY.
How? → CI/CD
```

## WHAT: CI vs CD vs CD

```
CI = Continuous Integration
     "Every code push → automatically build + test"
     
CD = Continuous Delivery
     "Build artifact is READY to deploy at any time"
     (human clicks button to deploy)
     
CD = Continuous Deployment
     "Every successful build → automatically deploys to production"
     (no human needed)

   Code Push → Build → Test → Package → Deploy
   ├── CI ────────────────────┤
   ├── Continuous Delivery ────────────────┤ (manual deploy)
   ├── Continuous Deployment ──────────────────────┤ (auto deploy)
```

---

# HOW: GitHub Actions (The Standard)

## Basic Pipeline: Build + Test

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      # 1. Get the code
      - name: Checkout code
        uses: actions/checkout@v4
      
      # 2. Setup Java
      - name: Setup JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      
      # 3. Cache Maven dependencies (faster builds)
      - name: Cache Maven packages
        uses: actions/cache@v4
        with:
          path: ~/.m2
          key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
      
      # 4. Build
      - name: Build with Maven
        run: mvn clean compile
      
      # 5. Run Tests
      - name: Run Tests
        run: mvn test
      
      # 6. Package
      - name: Package JAR
        run: mvn package -DskipTests
      
      # 7. Upload artifact
      - name: Upload JAR
        uses: actions/upload-artifact@v4
        with:
          name: app-jar
          path: target/*.jar
```

🔬 **Section Challenge - Basic Pipeline: Build + Test**

**Challenge 1 (Reasoning):** The workflow caches `~/.m2` with key `runner.os-maven-hashFiles('**/pom.xml')`. What does `hashFiles` compute and why is `pom.xml` the correct cache key input?

<details><summary>Answer</summary>

`hashFiles('**/pom.xml')` computes a SHA-256 of all `pom.xml` files. The cache is valid only while `pom.xml` is unchanged (no new/updated dependencies). When a dependency is added, the hash changes, GitHub Actions discards the old `~/.m2` cache and Maven re-downloads fresh jars. If `pom.xml` is unchanged, the cached `~/.m2` directory is restored, saving 1-3 minutes per build. This pattern is universal: `package-lock.json` for npm, `go.sum` for Go, `Gemfile.lock` for Ruby. The key principle: cache invalidation must be tied to the dependency manifest, not source code.

</details>

**Challenge 2 (Debug):** CI passes locally with `mvn test` but fails in GitHub Actions with `OutOfMemoryError: Java heap space`. Name two likely causes and fixes.

<details><summary>Answer</summary>

1. **JVM heap default**: GitHub runners have 7GB RAM but JVM defaults to 256MB-512MB heap. Fix: add `env: MAVEN_OPTS: "-Xmx2g"` to the test step, or set `<argLine>-Xmx2g</argLine>` in maven-surefire-plugin config. 2. **Parallel test forking**: Surefire may launch multiple JVM forks simultaneously. 4 forks x 512MB = 2GB. Fix: set `<forkCount>1</forkCount>` in surefire config, or `<parallel>none</parallel>` to disable parallel test execution.

</details>

## Full Pipeline: Build → Test → Docker → Deploy

🔬 **Section Challenge — Full Pipeline: Build → Test → Docker → Deploy**

**Challenge 1 (Reasoning):** Docker image layers — if you modify a file in layer 3, what happens to layers 4 and 5?
<details><summary>Answer</summary>

In the overlay filesystem, modifying a file in a lower layer creates a COPY in the write layer (copy-on-write). The original lower layer is unchanged. But in image BUILD: if Dockerfile instruction 3 changes, layers 4 and 5 are INVALIDATED — Docker can't reuse cached layers. Rule: put instructions that change most often LAST in Dockerfile. Dependencies (`npm install`, `mvn package`) before source code copies — this maximizes cache reuse.
</details>

**Challenge 2 (Design):** What's the difference between `COPY` and `ADD` in Dockerfile? When should you use each?
<details><summary>Answer</summary>

`COPY`: copies files/directories from build context to image. Simple and explicit. `ADD`: everything COPY does PLUS: auto-extracts tar archives (`.tar.gz`), fetches remote URLs (HTTP/HTTPS). Best practice: always use `COPY` unless you specifically need tar extraction. `ADD`'s URL feature is dangerous (no checksum validation, downloads at build time) and breaks reproducibility. Use `RUN curl | tar xz` instead for remote archives.
</details>

```yaml
# .github/workflows/deploy.yml
name: Build, Test & Deploy

on:
  push:
    branches: [ main ]

jobs:
  # === JOB 1: Build & Test ===
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - run: mvn verify   # compile + test + integration tests

  # === JOB 2: Build Docker Image ===
  docker:
    needs: test            # Only runs if tests pass
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and Push Docker image
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: mycompany/myapp:${{ github.sha }}

  # === JOB 3: Deploy to Production ===
  deploy:
    needs: docker          # Only runs if Docker build succeeds
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            docker pull mycompany/myapp:${{ github.sha }}
            docker stop myapp || true
            docker rm myapp || true
            docker run -d --name myapp -p 8080:8080 \
              mycompany/myapp:${{ github.sha }}
```

### Pipeline Visualization

```
Code Push to main
       │
       ▼
┌──────────────┐    ❌ FAIL → Stop, Notify developer
│  Build & Test │────┐
└──────┬───────┘    │
       │ ✅ PASS    │
       ▼            │
┌──────────────┐    │
│ Docker Build  │────┤ ❌ FAIL → Stop, Notify
│ & Push        │    │
└──────┬───────┘    │
       │ ✅ PASS    │
       ▼            │
┌──────────────┐    │
│  Deploy to    │────┘ ❌ FAIL → Auto-rollback
│  Production   │
└──────────────┘
       │ ✅ SUCCESS
       ▼
  🎉 Live in Production
```

---

# WHAT: Key CI/CD Concepts

## Pipeline Triggers

```yaml
# When to run the pipeline:
on:
  push:                    # On every push
    branches: [main]       # Only main branch
  pull_request:            # On PRs
  schedule:                # Cron job
    - cron: '0 6 * * 1'   # Every Monday 6 AM
  workflow_dispatch:       # Manual trigger button
```

🔬 **Section Challenge — Pipeline Triggers**

**Challenge 1 (Reasoning):** Why should `workflow_dispatch` always be included in a production pipeline even when `push` and `schedule` triggers exist?

<details><summary>Answer</summary>

`workflow_dispatch` enables on-demand execution without a code commit. Key use cases: (1) **Emergency rollback** — retrigger the deploy pipeline to redeploy the last known-good Docker image without committing anything; (2) **Incident debugging** — run tests on a specific branch during an investigation; (3) **Scheduled job override** — run Monday's data sync on a Tuesday without waiting for the cron; (4) **Parameterized deployments** — `workflow_dispatch` with `inputs:` lets you select `environment: staging|production`, enabling one workflow file to deploy anywhere. Without it, every trigger requires a code change, polluting Git history.

</details>

**Challenge 2 (Design):** 20 developers push 5 times each per day = 100 runs/day at 8 min each. GitHub free tier = 2,000 min/month. Exhausted on day 2. Name two architectural fixes.

<details><summary>Answer</summary>

1. **Path filtering**: `on: push: paths: ['src/**', 'pom.xml']` skips CI for documentation-only changes (README edits need no build). Saves 20-40% of runs for typical teams. 2. **Concurrency cancellation**: `concurrency: group: ${{ github.ref }} cancel-in-progress: true` — when a developer pushes 3 commits in 60 seconds (typo fixes), only the last run executes, cancelling the previous two. This alone reduces wasted CI minutes by 50-70% on active branches.

</details>

## Environment Variables & Secrets

```yaml
# NEVER hardcode passwords/keys in code!
# Store in GitHub Settings → Secrets

env:
  JAVA_VERSION: '17'

jobs:
  deploy:
    steps:
      - name: Connect to DB
        env:
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        run: echo "Connecting with secure password..."
```

## Matrix Strategy (Test Multiple Versions)

```yaml
jobs:
  test:
    strategy:
      matrix:
        java: [11, 17, 21]
        os: [ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-java@v4
        with:
          java-version: ${{ matrix.java }}
      - run: mvn test
# This creates 6 parallel jobs: 3 Java versions × 2 OS
```

## Branch Protection Rules

```
Settings → Branches → main:
  ✅ Require pull request reviews (1+ approval)
  ✅ Require status checks to pass (CI must be green)
  ✅ Require branches to be up to date
  ✅ No direct pushes to main
  
Result: NOBODY can push broken code to main
```

---

# WHERE: CI/CD Tools Comparison

```
GitHub Actions  → Best for GitHub repos (free tier: 2000 min/month)
GitLab CI/CD    → Best for GitLab repos (built-in)
Jenkins         → Enterprise standard (self-hosted, complex)
CircleCI        → Cloud-based, fast
AWS CodePipeline→ Best for AWS deployments
Azure DevOps    → Best for Microsoft ecosystem
```

---

# 🏋️ Practice Exercises

## Exercise 1: Basic CI

```
1. Create a Spring Boot project on GitHub
2. Add a GitHub Actions CI workflow
3. Push code → verify build runs
4. Intentionally break a test → verify build fails
```

## Exercise 2: Docker + Deploy

```
1. Add Dockerfile to your project
2. Create workflow that builds Docker image
3. Push to Docker Hub
4. Add deployment step
```

---

**Next Chapter**: [Clean Code Principles →](05_Clean_Code.md)

