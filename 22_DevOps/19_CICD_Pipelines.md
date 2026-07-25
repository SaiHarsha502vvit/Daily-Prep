> **Navigation**: [← Kubernetes](18_Kubernetes_Complete.md) | [Index](00_INDEX.md) | [Next → Terraform](20_Terraform_IaC.md)

# 🔄 Chapter 19: CI/CD Pipelines — From Code to Production Automatically

> _"The difference between a hobby project and a production system: the hobby project you deploy by SSHing in and running git pull. The production system deploys itself, tests itself, and rolls itself back if something goes wrong — all without human intervention."_

---

# PART 1: CI vs CD vs CD — The Three Practices

---

```
CI (CONTINUOUS INTEGRATION):
  Every code push → automated build + test.
  Developers merge to main multiple times per day.
  Tests catch bugs IMMEDIATELY (not 2 weeks later during QA).

  THE GOAL: broken code never lives in main for more than minutes.

  WHAT RUNS:
  1. Code compilation / build
  2. Unit tests
  3. Integration tests
  4. Static analysis (linting, type checking)
  5. Security scanning (dependency vulnerabilities)
  6. Code coverage reporting

CD (CONTINUOUS DELIVERY):
  EVERY commit to main is AUTOMATICALLY deployed to staging.
  Deployment to production requires a MANUAL approval (button click).
  "Always deployable" — main branch is always in a releasable state.

CD (CONTINUOUS DEPLOYMENT):
  Everything in Delivery but ALSO automatically deploys to production.
  No human approval needed (if all tests pass → production!).
  Requires: very high test confidence, feature flags, observability.

  COMPANY EXAMPLES:
  Amazon: deploys to production every 11.7 seconds.
  Netflix: deploys hundreds of times per day.
  GitHub: continuous deployment with feature flags.
```

---

# PART 2: GitHub Actions — Complete Reference

---

```yaml
# ── .github/workflows/ci-cd.yml — Production Pipeline ──
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch: # manual trigger from GitHub UI

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

# Cancel in-progress runs for the same branch (save CI minutes!)
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ── STAGE 1: LINT & TYPE CHECK (fast feedback) ──
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip

      - name: Install dependencies
        run: pip install ruff mypy

      - name: Lint
        run: ruff check .

      - name: Type check
        run: mypy src/ --strict

  # ── STAGE 2: TEST (parallel matrix) ──
  test:
    runs-on: ubuntu-latest
    needs: lint # only run if lint passes
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]

    services: # spin up test dependencies as containers!
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports: ["6379:6379"]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: pip

      - name: Install dependencies
        run: pip install -r requirements.txt -r requirements-test.txt

      - name: Run tests with coverage
        run: pytest --cov=src --cov-report=xml -v
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: coverage.xml

  # ── STAGE 3: SECURITY SCAN ──
  security:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Dependency vulnerability scan
        run: pip-audit -r requirements.txt

      - name: SAST (Semgrep)
        uses: semgrep/semgrep-action@v1
        with:
          config: p/python p/owasp-top-ten

  # ── STAGE 4: BUILD & PUSH DOCKER IMAGE ──
  build:
    runs-on: ubuntu-latest
    needs: [test, security] # only after tests AND security pass
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          severity: CRITICAL,HIGH

  # ── STAGE 5: DEPLOY TO STAGING ──
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    environment: staging # GitHub environment (protection rules)
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          kubectl set image deployment/my-api \
            api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n staging
          kubectl rollout status deployment/my-api -n staging --timeout=300s

  # ── STAGE 6: DEPLOY TO PRODUCTION (manual approval) ──
  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production # requires approval from designated reviewers!
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          kubectl set image deployment/my-api \
            api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n production
          kubectl rollout status deployment/my-api -n production --timeout=300s

      - name: Verify deployment
        run: |
          sleep 30
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.myapp.com/health)
          if [ "$STATUS" != "200" ]; then
            echo "Health check failed! Rolling back..."
            kubectl rollout undo deployment/my-api -n production
            exit 1
          fi
```

🔬 **Section Challenge — DevOps Architecture & CI/CD**

**Challenge 1 (Python vs Bash Infrastructure):** A legacy CI/CD pipeline uses a 500-line bash script to deploy to Kubernetes, parse JSON responses using `jq`, and handle retries. You are tasked with migrating this to Python using `kubernetes-client` or `boto3`. Explain why Python-driven CI/CD is architecturally superior to Bash when dealing with Distributed Systems deployments.

<details><summary>Answer</summary>

**The Bash Fragility:** Bash lacks native data structures (dicts, complex arrays), robust exception handling, and idempotent state checks. Parsing a complex Kubernetes JSON status often requires fragile text manipulation (`grep`, `awk`, `jq`). If a deploy fails halfway, bash scripts often fail to rollback cleanly because `set -e` just aborts the process without teardown.
**The Python Supremacy:** Python treats infrastructure as _objects_. When you query K8s via Python, you get a typed Object back, not a string. You can use standard `try/except/finally` blocks to guarantee a clean rollback if a deployment times out. Python allows you to write actual Unit Tests for your deployment logic (mocking the `boto3` or `k8s` client) before ever running it in production, guaranteeing idempotent and safe deployments.

</details>

**Challenge 2 (Playwright CI Artifacts):** Your E2E Playwright tests run perfectly locally but occasionally flake in GitHub Actions. How do you configure the Playwright config and the GitHub Actions YAML to guarantee you can debug exactly what went wrong without storing 50GB of successful videos every day?

<details><summary>Answer</summary>

**The CI Configuration:**

1. **Playwright Config:** Set `trace: 'retain-on-failure'` and `video: 'retain-on-failure'`. This ensures Playwright only saves the massive DOM snapshots, network HAR files, and video recordings if an `expect()` assertion fails.
2. **GitHub Actions YAML:** You must configure the artifact upload step to run `if: failure()` so it captures the `playwright-report/` directory containing the traces.

```yaml
- name: Run Playwright tests
  run: npx playwright test
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 7
```

By combining these, you achieve 100% debuggability (you can replay the exact failing DOM state via `playwright show-trace`) while keeping CI storage costs near zero.

</details>

## PART 3: Deconstructing Pipeline Abstractions

---

### 1. The Abstraction: "Bash Scripts" vs The Reality of Distributed State

**The Abstraction Taught:** "CI/CD is just a sequence of shell commands running on a server. You just write a `.sh` file that runs `kubectl apply -f`, parses the output with `grep` and `jq`, and maybe loops a `sleep` until the pods are ready."

**The Naked Truth:** Bash is a text-processing stream. It has no concept of objects, state machines, or deterministic error recovery. When deploying to a distributed system like Kubernetes or AWS, the infrastructure operates purely on asynchronous state convergence (eventual consistency).

**Why it was abstracted & The Catastrophe:** Early CI platforms (like Jenkins) were essentially just glorified Cron jobs that executed Bash. This created the **Fragile Pipeline Anti-Pattern**.
If a bash deployment script fails halfway through, `set -e` instantly kills the script. There is no `finally` block to automatically trigger a rollback. Furthermore, parsing a massive, nested Kubernetes JSON response using `jq` is incredibly brittle; if the schema changes slightly, the pipeline succeeds silently but fails to deploy.

**The Python/Go Reality (Infrastructure as Objects):**
Modern DevOps requires interacting with Infrastructure as typed, verifiable Objects, not as text streams.

- **The Implementation:** You use the `kubernetes-client` or `boto3` in Python (or Go).
- **The Mechanical Fix:** When you query K8s via Python, you receive a typed Object (e.g., `V1Deployment`). You do not parse text.
- **Idempotency & Rollbacks:** Because it's a real programming language, you use `try/except/finally` blocks. If the deployment times out waiting for readiness probes, the `except` block catches the `TimeoutError` and programmatically executes a deterministic `kubectl rollout undo` via the API.
- **Testability:** You can write actual `pytest` Unit Tests for your deployment logic (by mocking the K8s API) _before_ the pipeline ever touches production. You cannot unit test a Bash script manipulating production state.

---

### 2. The Abstraction: "Testing in CI" vs The Reality of Ephemeral Debugging

**The Abstraction Taught:** "If an End-to-End test passes locally but fails in GitHub Actions, you just SSH into the runner or stare at the console logs until you figure out what happened."

**The Naked Truth:** A CI/CD runner is an ephemeral, headless Linux container. There is no graphical browser. If a Playwright E2E test flakes (e.g., a button didn't render in time), the console log will just say `Timeout: Element not found`. That is useless for debugging.

**The Catastrophe:** To fix this, junior engineers enable video recording and full DOM tracing for _every single test run_. A suite of 500 tests generates 10GB of artifacts per commit. This blows up the GitHub Actions storage budget instantly, costing the company thousands of dollars, while making the artifact ZIP file too massive to download.

**The Playwright CI Reality (Conditional Artifact Architecture):**
You must architect the pipeline to capture the exact physical state of the failure, but _only_ on failure.

- **The Implementation:**
  1. In `playwright.config.ts`, you strip the "always record" abstraction:
     ```typescript
     use: {
       trace: 'retain-on-failure',
       video: 'retain-on-failure',
     }
     ```
  2. In the GitHub Actions YAML, you enforce the conditional upload:
     ```yaml
     - name: Run Playwright tests
       run: npx playwright test
     - uses: actions/upload-artifact@v4
       if: failure() # THE CRITICAL BOUNDARY
       with:
         name: playwright-report
         path: playwright-report/
         retention-days: 7
     ```
- **The Mechanical Fix:** By combining these two conditions, Playwright tracks the DOM, Network (HAR), and Video in memory during the test. If the test passes, it drops the memory. If an `expect()` assertion fails, it dumps the memory to disk. The GitHub Action catches the failure exit code and uploads _only_ the failing trace.
- You achieve 100% "Time-Travel Debuggability" (via `playwright show-trace`) while mathematically guaranteeing near-zero storage costs.

---

# PART 3: Deployment Strategies

---

```
1. ROLLING UPDATE (K8s default):
   Replace pods one by one. Old and new versions run SIMULTANEOUSLY.
   Zero downtime. maxSurge=1, maxUnavailable=0.
   Risk: both v1 and v2 handle traffic → must be compatible.

2. BLUE/GREEN:
   Two identical environments. Blue = current, Green = new.
   Deploy to Green → test → switch traffic from Blue to Green.
   Instant rollback: switch back to Blue.
   Cost: need 2x resources during deployment.

   Implementation: two K8s Deployments, switch Service selector.

3. CANARY:
   Route 5% of traffic to new version. Monitor error rate.
   If OK → increase to 25% → 50% → 100%.
   If errors → roll back immediately (only 5% of users affected!).

   Implementation: two Deployments with different weights in Ingress/Istio.
   OR: use ArgoCD Rollouts with automatic analysis.

4. FEATURE FLAGS (safest):
   Deploy new code to 100% of servers — but HIDDEN behind a flag.
   Enable flag for 1% of users → monitor → increase gradually.

   Benefits:
   - Decouple deployment from release.
   - Kill switch: disable feature instantly without redeploy.
   - A/B testing: show feature to test group, measure impact.

   Tools: LaunchDarkly, Unleash (open source), Flagsmith.

5. A/B TESTING (requires traffic splitting):
   50% of users see version A, 50% see version B.
   Measure: conversion rate, performance, user satisfaction.
   Choose the winner. Only for UI/UX experiments, not backend changes.
```

---

# PART 4: CI Platform Comparison

---

```
┌─────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│ Feature             │ GitHub Actions       │ GitLab CI            │ Jenkins              │
├─────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ Config file         │ .github/workflows/*  │ .gitlab-ci.yml       │ Jenkinsfile (Groovy) │
│ Runner hosting      │ GitHub-hosted or     │ GitLab-hosted or     │ Self-hosted (always) │
│                     │ self-hosted          │ self-hosted          │                      │
│ Docker support      │ Service containers   │ Services + DinD      │ Docker plugin        │
│ Built-in registry   │ GHCR (free)          │ Built-in registry    │ None (use external)  │
│ Secrets management  │ Repository/Org secrets│ CI/CD Variables     │ Credentials plugin   │
│ Approval gates      │ Environments         │ Manual jobs          │ Input step           │
│ Caching             │ actions/cache        │ Built-in cache       │ Plugins              │
│ Matrix builds       │ ✅ Native            │ ✅ parallel/matrix  │ Plugin (matrix-project)│
│ Pricing             │ Free (2000 min/month)│ Free (400 min/month) │ Free (self-hosted)   │
│ Learning curve      │ Low                  │ Low                  │ High (Groovy, plugins)│
└─────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘

WHEN TO USE:
  GitHub Actions: if your code is on GitHub. Best ecosystem of reusable actions.
  GitLab CI: if you self-host GitLab. Tightest integration with GitLab features.
  Jenkins: if you need extreme customization, complex pipelines, or legacy.

  TREND: Jenkins is declining. GitHub Actions and GitLab CI rising rapidly.
```

---

# PART 5: Database Migrations in CI/CD

---

```
THE HARDEST PART: database migrations.
Code deploys are reversible (rollback to old image).
Database migrations are NOT (you can't un-delete a column!).

EXPAND-CONTRACT PATTERN (zero-downtime schema changes):
  Want to: rename column "name" to "full_name".

  WRONG (breaks old code):
    ALTER TABLE users RENAME COLUMN name TO full_name;  -- old code explodes!

  RIGHT (3-step):
  Step 1 (expand): ADD column full_name, write to BOTH columns.
    ALTER TABLE users ADD COLUMN full_name TEXT;
    -- Deploy code that writes to BOTH name AND full_name.

  Step 2 (migrate): switch reads to new column.
    -- Deploy code that reads from full_name. Still writes both.

  Step 3 (contract): drop old column.
    ALTER TABLE users DROP COLUMN name;
    -- Deploy code that only uses full_name.

  Each step is a SEPARATE deployment. Each is independently safe.

MIGRATION RUN ORDER:
  ALWAYS run migrations BEFORE deploying new code.
  Pipeline: migrate → deploy → verify → cleanup (later, separate PR).
```

---

# PART 6: Pipeline Optimization

---

```
SLOW PIPELINE = slow feedback = developer frustration = bugs merge to main.
GOAL: < 10 minutes for CI. < 20 minutes for full CI/CD.

TECHNIQUES:
  1. CACHE: pip/npm packages, Docker layers → saves 60-120 seconds.
  2. PARALLELIZE: lint + test + security run simultaneously.
  3. FAIL FAST: lint first (10s). Skip tests if lint fails.
  4. MATRIX: Python 3.10, 3.11, 3.12 on 3 runners simultaneously.
  5. INCREMENTAL: monorepo tools (Nx, Turborepo) — only build what changed.
  6. DOCKER LAYER CACHE: cache-from: type=gha → saves 3-5 min per build.
  7. SELF-HOSTED RUNNERS: your hardware, no queue → 2-5x faster.
  8. TEST SPLITTING: split tests across runners (pytest-split, RSpec).
```

---

## 🔗 Cross-References

| Topic                        | Related Content                                                              |
| ---------------------------- | ---------------------------------------------------------------------------- |
| **Docker builds images**     | [Ch 17: Docker](17_Docker_Complete.md) — Dockerfile, multi-stage             |
| **K8s receives deployments** | [Ch 18: K8s](18_Kubernetes_Complete.md) — rollout, HPA                       |
| **Terraform in pipeline**    | [Ch 20: Terraform](20_Terraform_IaC.md) — plan in PR, apply on merge         |
| **GitOps (ArgoCD)**          | [Ch 23: GitOps](23_GitOps_Deployments.md) — Git-driven deployment            |
| **Monitoring (verify)**      | [Ch 21: Observability](21_Monitoring_Observability.md) — post-deploy metrics |
| **Security scanning**        | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — OWASP, SAST/DAST        |
| **SQL migrations**           | [SQL Internals](../08_SQL/49_SQL_Internals_Deep.md) — expand-contract        |
| **SRE (deploy velocity)**    | [Ch 22: SRE](22_SRE_Practices.md) — error budgets gate deploys               |


---

## Reality Check

**"CI/CD is the pipeline YAML"** ? The YAML orchestrates; the pipeline's real properties are feedback latency, reproducibility, and safety ([13_DE CI/CD] covers this fully): the pipeline is a product whose users are developers and whose SLA is time-to-signal (the 40-minute pipeline that changes behavior � batched pushes, skipped local runs), reproducibility means a clean runner can rebuild from pinned inputs (lockfiles, pinned actions, declared tool versions � the works-in-CI-only bug from undeclared state), and safety is progressive delivery plus rollback, not a green checkmark. The DevOps-module lens adds the platform view: a paved-road pipeline template teams inherit ([Ch62]'s platform model) beats every team hand-rolling YAML with its own inconsistent security and quality gates.

**"A green pipeline means safe to deploy"** ? Green certifies what the pipeline MEASURES, and the gaps are where incidents originate ([13_DE CI/CD]): environment drift between staging and production, data-shape differences (staging's polite data versus production's pathological rows), load behavior invisible to functional tests, and migration irreversibility. This is why DEPLOYMENT is its own engineering layer beyond CI: progressive rollout (canary with automated golden-signal analysis � promote or roll back on metrics, not a human watching), feature-flag decoupling of deploy from release ([Ch61 emulation, production-code flags]), and automated rollback triggers. Green means "the checks passed"; safe means "the deployment strategy contains the blast radius of the checks being insufficient" � two different guarantees.

**"Faster pipelines just need better hardware"** ? Pipeline speed is mostly ARCHITECTURE, not horsepower: the un-cached dependency install repeated every run (the [build-tools] cache discipline � the same packages downloaded 400 times a day), the serial stages that could parallelize, the monolithic test suite that should be tiered (fast smoke on every push, full regression less often � [Ch62]'s gate tiers), and the test-selection that reruns everything when only one module changed ([Ch48 sharding]). Throwing bigger runners at a pipeline whose slowness is un-cached installs and un-parallelized serial stages wastes money on a structural problem � the profile-first discipline ([14_MM optimization]) applies to pipelines: find which stage dominates before optimizing.

**"Secrets in CI are handled by the secrets store"** ? The store solves storage; EXPOSURE paths are the threat model ([13_DE CI/CD]): secrets leaked through echoed logs (imperfect masking), through artifacts (the debug bundle with the env dump), through fork-triggered runs with access to your secrets (the pull_request_target class of incident), and through over-scoped tokens (the deploy key that could also rewrite history). The maturity ladder is OIDC federation to short-lived cloud credentials (no long-lived keys stored at all � [cloud IAM]), per-environment secret scoping, and the standing review question: what could a malicious dependency's postinstall script, running in this pipeline, exfiltrate ([security]'s supply chain meeting CI's privileges)?

**"Flaky pipelines are an infrastructure annoyance"** ? Flake OWNERSHIP is a process decision with compounding cultural cost ([13_DE CI/CD] and [Ch26 flakiness, Ch62 SLA]): retry-until-green � the default when nobody owns flake � trains the whole team to ignore red, which launders REAL failures through the retry (the genuine race condition that shipped because rerunning made it pass). The functioning system is the flake SLA: automatic detection and quarantine, named ownership with deadlines, and the cultural line that a retried-to-green build is a defect report, not a success. Teams treating pipeline flake as weather converge on a pipeline nobody believes � operationally identical to having no pipeline, but with the compute bill.
