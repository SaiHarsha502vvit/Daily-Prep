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

🔬 **Section Challenge — CI/CD Dependency Graph Failure Recovery**

Your CI pipeline has jobs: `lint` → `test` → `docker-build` → `deploy`. The `docker-build` job fails because the base image registry returns 503. The `test` job already passed and produced test artifacts. What happens to the deploy job? Can you retry just `docker-build` and resume the pipeline from there, or must you restart from `test`?

<details>
<summary>Answer</summary>

**Behavior depends on CI tool**:
- **GitHub Actions**: `needs: docker-build` creates a dependency edge; if `docker-build` fails, `deploy` is skipped. You can re-run just the failed `docker-build` job from the GitHub UI; dependent jobs resume automatically. Test artifacts persist across retries (30-day retention by default).
- **GitLab CI**: Similar — failed jobs can be retried individually; artifacts from upstream jobs are available to downstream jobs via `dependencies:` keyword.
- **Jenkins**: Pipeline jobs have more granular retry semantics; you can use `retry()` in declarative pipeline syntax. Artifacts are archived per-stage.

**The "restart from where" question**:
- Yes — modern CI tools support per-job retry. You do NOT need to re-run `lint` or `test`.
- Test artifacts (coverage reports, screenshots, JUnit XML) persist between retries and are still available to downstream jobs.

**Failure-mode trap**: if the registry 503 is transient, a single retry succeeds. If it's a network partition affecting all jobs, retrying just `docker-build` loops until the partition heals. Add a `retry: { max: 3, when: 'always' }` strategy with exponential backoff to avoid hammering an unavailable registry.

**Production note**: configure artifact retention for at least the typical incident response window (7 days). If a job fails on Friday and you return Monday, the test artifacts should still be there for debugging.
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

## WHO: Origin Story

**Patrick Debois** coined the term "DevOps" at the first DevOpsDays in Ghent, Belgium, **October 2009**. The conference emerged from frustrations with the wall between developers (who wanted fast iteration) and operations (who wanted stability). The Agile community's "Dev" focus left out operations; DebOps / DevOps was the explicit bridge.

**Jez Humble and David Farley** published *Continuous Delivery* in **2010** — the first book to codify the build-test-deploy pipeline as an automated, repeatable practice. Their "deployment pipeline" concept is the ancestor of every modern CI/CD tool.

**Kohsuke Kawaguchi** created **Hudson** at Sun Microsystems in **2005** as a CI server. After Oracle's acquisition of Sun, the community forked Hudson as **Jenkins** in **2011** due to governance disputes. Jenkins remains the most widely deployed CI server globally.

**Travis CI** (2011) and **CircleCI** (2011) pioneered CI-as-a-Service. **GitHub Actions** launched in **2018** (public beta) and 2019 (GA), bringing CI/CD directly into the version-control platform — the "GitHub-native" model now dominant in open source.

**Adam Wiggins and the Heroku team** published the **12-Factor App** methodology in **2011**, codifying deployment best practices (stateless processes, declarative config, dev/prod parity) that became the philosophical foundation for cloud-native CI/CD.

---

## WHEN: Decision Guide

| Situation | Trigger | Use It When |
|---|---|---|
| **Every push to feature branch** | `on: push` | Every commit should pass automated gates before review |
| **Pull request opened/updated** | `on: pull_request` | Verify PR doesn't break main before merge |
| **Scheduled (nightly)** | `on: schedule: cron: '0 2 * * *'` | Long-running tests (load, security scans, dependency audits) that don't fit per-PR |
| **Manual workflow_dispatch** | `on: workflow_dispatch` | Deployment jobs requiring human approval |
| **Tag push (release)** | `on: push: tags: ['v*']` | Release builds with version stamping and artifact publishing |
| **Path filter** | `on: push: paths: ['docs/**']` | Skip expensive CI for doc-only changes |

**Path filtering trade-off**: aggressive path filtering (only run CI on `src/**` changes) speeds feedback but misses cross-cutting changes. A config change in `package.json` doesn't touch `src/**` but might break builds.

**Concurrency limit**: use `concurrency: group: ${{ github.ref }}, cancel-in-progress: true` to cancel outdated runs on the same branch. Without this, multiple pushes to the same PR create a backlog of queued jobs.

**Manual approval gate**: production deployments should NEVER auto-deploy from `main`. Use `environment: production` with required reviewers in GitHub, or a manual `workflow_dispatch` step in GitLab. Auto-deploy to staging is fine; auto-deploy to prod is reckless.

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


---

## Reality Check

**"CI is running tests automatically on push"** ? Test execution is the visible half; CI's economic function is FEEDBACK LATENCY CONTROL: the pipeline is a product whose users are developers, whose SLA is time-to-signal, and whose failure modes are queues (runners saturated at 10 AM), serial stages that could parallelize, un-cached dependency installs (the same packages downloaded 400 times a day), and bloated test tiers ([21_SDET Ch62's] gate-tier discipline applies verbatim). A 40-minute pipeline changes developer BEHAVIOR � batched pushes, skipped local runs, merge anxiety � and those behavioral costs dwarf the compute bill everyone optimizes instead.

**"Pipeline as code means the YAML is the pipeline"** ? The YAML is orchestration; the pipeline's actual semantics live in what the YAML pins or fails to pin: runner images (the build that broke because the runner's default tool version rolled), action/plugin versions (third-party steps are supply-chain dependencies � pin by hash, not tag, for anything with secret access), environment assumptions (the works-in-CI-only bug from a preinstalled tool nobody declared), and caches (whose staleness is a silent variable � the cache-hit build that skipped the step that would have failed). Reproducibility discipline � could a clean runner execute this from the lockfiles alone � is what separates pipeline-as-code from pipeline-as-YAML-shaped-hope.

**"Secrets in CI are handled by the secrets store"** ? The store solves storage; EXPOSURE paths are the working threat model: secrets leak through echoed logs (masking is pattern-based and imperfect � the base64-wrapped token that sailed through), through artifacts (the debug bundle containing the env dump), through fork-triggered runs (the PR from a fork that runs your workflow WITH your secrets � the reason pull_request_target incidents recur), and through overly-scoped tokens (the deploy key that could also rewrite history). The maturity ladder: scoped short-lived credentials (OIDC federation to the cloud instead of long-lived keys), per-environment secret sets, and the standing question in review � what could this step exfiltrate if compromised?

**"A green pipeline means the change is safe"** ? Green certifies exactly what the pipeline MEASURES, and the unmeasured classes are where incidents originate: environment drift between staging and production (the config divergence no test tier sees), data-shape differences (staging's polite data versus production's pathological rows), load behavior (the N+1 that only matters at production volume), and migration irreversibility (the schema change that passed everywhere and cannot be rolled back). Deployment safety is therefore its own engineering layer � progressive delivery (canary percentages, feature-flag decoupling of deploy from release), automated rollback triggers on golden signals, and migration playbooks with tested down-paths � none of which green-checkmark culture provides.

**"Flaky CI is an infrastructure problem for the platform team"** ? Flake OWNERSHIP is a process decision with compounding consequences: retry-until-green culture (the default when nobody owns it) trains everyone to ignore red, which launders REAL failures through the retry (the genuine race condition that shipped because rerunning it made it pass twice). The functioning system mirrors [Ch62's] SLA: automatic flake detection and quarantine, named ownership with deadlines, and the critical cultural line � a retried-to-green build is a defect report, not a success. Teams that treat CI flake as weather rather than debt converge on pipelines nobody believes, which is operationally identical to having no pipeline.
