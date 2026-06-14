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
    branches: [main, develop]
  pull_request:
    branches: [main]

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
          java-version: "17"
          distribution: "temurin"

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
    branches: [main]

jobs:
  # === JOB 1: Build & Test ===
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"
      - run: mvn verify # compile + test + integration tests

  # === JOB 2: Build Docker Image ===
  docker:
    needs: test # Only runs if tests pass
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
    needs: docker # Only runs if Docker build succeeds
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

### Diagram: GitHub Actions Workflow Sequence

```
TRIGGER (push to main)
       │
       ▼
┌─────────────────┐
│ 1. CHECKOUT     │ → git checkout (5s)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. SETUP-JAVA   │ → actions/setup-java@v4 (15s, cached)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. CACHE MAVEN  │ → ~/.m2 cached (10s hit / 60s miss)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. BUILD        │ → mvn -B -V verify (120s)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. TEST         │ → mvn test (90s, parallel)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. DEPLOY       │ → aws s3 sync (30s)
└────────┬────────┘
         ▼
       DONE ✓
```

### Diagram: CI vs CD Decision Tree

```
COMMIT (git push)
       │
       ▼
┌─────────────────┐
│     CI GATE     │
│  Build + Test   │
│  Fail → Stop    │
└────────┬────────┘
         │ Pass
         ▼
┌─────────────────┐
│  STAGING        │
│  Deploy         │
│  Smoke Tests    │
└────────┬────────┘
         │ Pass
         ▼
┌─────────────────┐
│    CD GATE      │
│ (Delivery vs    │
│  Deployment)    │
└────────┬────────┘
    ┌────┴────┐
    │         │
Manual     Auto
Deploy     Deploy
    │         │
    ▼         ▼
  READY    PRODUCTION ✓
  FOR
  PROD
```

---

# WHAT: Key CI/CD Concepts

## Pipeline Triggers

```yaml
# When to run the pipeline:
on:
  push: # On every push
    branches: [main] # Only main branch
  pull_request: # On PRs
  schedule: # Cron job
    - cron: "0 6 * * 1" # Every Monday 6 AM
  workflow_dispatch: # Manual trigger button
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
  JAVA_VERSION: "17"

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

### Historical Evolution

**CI/CD has evolved through several distinct eras:**

- **2009** — DevOps movement coined at the first DevOpsDays conference in Ghent, Belgium (organized by Patrick Debois, Ben Rockwood, and Andrew Shafer). This established the cultural bridge between development and operations that CI/CD pipelines would later automate.
- **2010** — Jez Humble and David Farley's "Continuous Delivery" book (Addison-Wesley) formalized the principles of automated build, test, and deployment pipelines as a discipline separate from continuous deployment.
- **2011** — Jenkins forked from Hudson (Kohsuke Kawaguchi, originally at Sun Microsystems). Travis CI launched as the first hosted CI service integrated with GitHub, popularizing CI-as-a-service for open-source projects. CircleCI also launched in 2011, pioneering container-based CI.
- **2014** — GitLab introduced integrated CI/CD, merging the pipeline into the source control platform and enabling DevOps without toolchain fragmentation.
- **2015** — Fielding's REST dissertation (2000) provided the architectural foundation that modern APIs are built on; container orchestration begins, enabling reliable CD across distributed systems.
- **2018** — GitHub Actions announced at GitHub Universe. 2019 — GitHub Actions reached general availability, rapidly becoming the dominant CI platform for GitHub-hosted projects.

**Key references:**
- Jez Humble & David Farley — *Continuous Delivery* (2010) — Formalized automated deployment pipelines and the concept of a continuous delivery pipeline as a first-class engineering artifact.
- Adam Wiggins (Heroku, 2011) — **The Twelve-Factor App** — Factor V (Build, Release, Run) and Factor VI (Processes) formalized the CI/CD separation: build = compile, release = bundle with config, run = execute the release. This strict separation is the conceptual foundation of every modern CI/CD pipeline, making it impossible to change code at runtime without a new release.
- Patrick Debois et al. — DevOpsDays Ghent (2009) — Invented the DevOps term and catalyzed the culture of treating infrastructure as code and deployments as routine.
- Roy Fielding — "Architectural Styles and the Design of Network-based Software Architectures" dissertation (2000) — REST constraints underpin modern API design, enabling the standardized integration that CD pipelines depend on.
- Kohsuke Kawaguchi — Jenkins/Hudson fork (2011) — The fork made Jenkins the dominant open-source CI engine; the plugin ecosystem established the extensibility model still used today.

**Why this matters for CI/CD:** Understanding the 2009-2019 arc explains why modern pipelines emphasize GitOps, declarative configuration, and container-native execution — these emerged from the convergence of REST architecture, DevOps culture, and cloud container platforms. The 12-Factor App (Adam Wiggins, Heroku, 2011) added the build/release/run separation that is now the universal CI/CD stage structure.

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

### Production Reality

**CI/CD pipeline practices fail in production in these named ways:**

- **Pipeline race conditions on artifact promotion** — two developers push commits within 30 seconds of each other. The first build creates `myapp:abc1234`, passes, and is promoted to staging. The second build creates `myapp:def5678`, passes, and overwrites the staging artifact before the first developer can run smoke tests. Staging now has the second developer's code, not the approved first build. Fix: use immutable artifact tags (git SHA) not `latest` or sequential numbers.
- **Flaky tests blocking 30% of merges** — a test that fails 20% of the time due to timing/race conditions is retried until green, masking the flake. The test eventually passes but the underlying race condition is never fixed. Teams learn to re-run CI until it passes and merges anyway. The flaky test is now a permanent blocker. Fix: track flaky test rate as a CI metric; a test that flakes >5% goes into quarantine and must be fixed before re-activation.
- **Secret leakage via build logs** — `AWS_SECRET_ACCESS_KEY=AKIA...` is printed in a GitHub Actions step. GitHub Actions logs are stored for 90 days and accessible to anyone with repository read access. Automated scanners scrape GitHub for exposed AWS keys. The key must be rotated immediately. Fix: use GitHub Secrets for all sensitive environment variables; mask values explicitly with `::add-mask::`.
- **Missing deployment smoke test** — the pipeline deploys to production and marks success if the deploy command returns 0. But the application is down (503s) post-deploy. The pipeline shows green. Users discover the outage first. Fix: add a post-deploy smoke test: `curl -f https://api.myapp.com/health` must return 200 before the pipeline reports success.

**Debug workflow:** For artifact promotion race: audit the pipeline artifact tagging strategy; use `IMAGE_TAG=${{ github.sha }}` (immutable git SHA). For flaky tests: use `git bisect` to identify the commit that introduced the timing dependency.
**Mitigation discipline:** Use GitHub's cache action with `save-always: false` to prevent stale cache on failure; require at least one approval + passing CI before merge; add post-deploy smoke tests as pipeline gates; run `secrets scan` (Trufflehog) on every push.

---

### Conceptual Depth: The Pipeline Invariant

**Core invariant:** Every commit should pass through the same automated gate from code to production. No manual steps. No snowflake deploys.

**Why this matters:** The "it works on my machine" problem is fundamentally a reproducibility problem. A pipeline that runs the same tests, builds the same artifact, and deploys via the same mechanism every time eliminates whole categories of bugs.

**The deep pattern:** The pipeline encodes institutional knowledge — every failure mode that's been debugged once becomes a check that runs forever. Each new check is a tax on future regressions:
- Lint check → catches syntax style drift
- Unit test → catches logic regression
- Integration test → catches API contract regression
- Security scan → catches dependency vulnerabilities
- Smoke test → catches deploy failures
- Canary deploy → catches runtime regressions in production

**Constraint that breaks the invariant:** Manual approval gates ("deploy requires DevOps team to click a button") reintroduce snowflake-deploy risk. The fix: replace human gates with automated policy gates (e.g., Open Policy Agent).

**Practical signal:** If your "automated" pipeline has 3+ manual steps that vary by environment, you have a CI theater, not a CI pipeline.

---

### Trade-off: CI/CD Tool Variants

| Aspect              | GitHub Actions    | Jenkins           | GitLab CI         | CircleCI          |
|---------------------|-------------------|-------------------|-------------------|-------------------|
| Hosting             | SaaS (or self)    | Self-hosted       | SaaS or self      | SaaS              |
| Config format       | YAML in repo      | Groovy/Pipeline   | YAML in repo      | YAML in repo      |
| Marketplace         | 20K+ actions      | 1,800+ plugins    | Built-in          | Orbs (~3K)        |
| Free tier           | 2,000 min/mo      | none (OSS only)   | 400 min/mo        | 6,000 min/mo      |
| Runner model        | ephemeral VM      | persistent agent  | ephemeral         | ephemeral Docker  |
| Year introduced     | 2018/2019         | 2011 (Hudson fork)| 2014              | 2011              |
| Best for            | GitHub repos      | complex pipelines | GitLab repos      | Docker-heavy CI   |

**Selection rule:** GitHub Actions for GitHub-centric teams; GitLab CI for self-hosted GitLab shops; Jenkins for legacy enterprise with complex Groovy pipelines; CircleCI for performance-sensitive Docker builds.

---

**Next Chapter**: [Clean Code Principles →](05_Clean_Code.md)
