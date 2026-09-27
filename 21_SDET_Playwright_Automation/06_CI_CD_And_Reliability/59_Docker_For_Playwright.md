# Chapter 59 — Docker for Playwright

**← [Ch 58: File Uploads & Downloads](../03_Real_World_Scenarios/58_File_Uploads_Downloads.md) | [Index](../00_INDEX.md) | [Ch 60: Tool Comparison →](../08_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md)**

> **Time estimate:** 60 minutes  
> **Difficulty:** Intermediate  
> **Prerequisites:** Ch 09 (Parallel Workers), Ch 26 (Flakiness), Ch 27 (CI/CD with GitHub Actions)

---

## 5W1H

|          |                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What** | Running Playwright tests inside Docker containers using the official `mcr.microsoft.com/playwright` image — consistent, reproducible, CI-ready                                                   |
| **Why**  | "Works on my machine" is the most expensive bug in automation. Docker eliminates OS dependency drift, browser version mismatches, and locale differences between developer laptops and CI agents |
| **Who**  | SDETs wiring Playwright into a CI pipeline; platform engineers building shared test infrastructure; developers who need to run the full suite without installing Chromium locally                |
| **When** | From day one of the project if CI pipelines exist; retrofit when you see flaky tests that pass locally but fail on CI                                                                            |
| **How**  | Build a Docker image from the official Playwright base, mount artifact volumes, pass secrets as environment variables, and run the container in your CI pipeline                                 |

---

## 0. War Stories — Docker Lessons from the Hard Way

### The /dev/shm crash that nobody could reproduce locally

Our CI pipeline was failing with Chromium crashing mid-test: `SIGSEGV` inside the browser process. It happened every 3rd run, always on different tests, always in CI, never locally.

Root cause: Linux's `/dev/shm` (shared memory) defaults to 64 MB. Chromium uses shared memory heavily for IPC between the renderer and browser processes. When the shared memory fills, the renderer crashes. On macOS and Windows, there's no 64 MB cap. Developer machines never hit it. CI runners did.

Fix: `--shm-size=2g` on every `docker run` call. One flag. Crashed tests: zero.

This is Section 6 of this chapter. The reason it's a war story and not a footnote is that without knowing it exists, you'll spend days blaming your tests.

### The image that bloated to 4.2 GB and ate our CI budget

An engineer joined, saw a Dockerfile with `FROM mcr.microsoft.com/playwright:v1.49.0-jammy`, thought "should add more tools," and added:

```dockerfile
RUN apt-get install -y python3 python3-pip curl wget git vim htop
RUN pip install boto3 requests pandas
RUN npm install -g typescript eslint prettier allure-commandline
```

Each `RUN` layer is cached separately. When the base image updated, all layers rebuilt from scratch. The image went from 1.8 GB to 4.2 GB. Build time: 22 minutes. Our CI bill increased by 40%.

Fix: keep the Playwright image lean. Everything you add to the image is pulled on every CI runner. If you need Python for a data script, use a separate service container — don't pollute the test image.

### The node_modules copy that made every build take 8 minutes

```dockerfile
# What the engineer wrote
COPY . .
RUN npm ci
```

`COPY . .` copies `node_modules/` (280 MB) into the build context before `npm ci` runs. The build context upload alone took 3 minutes. Then `npm ci` ran and downloaded 280 MB again.

Fix: add `.dockerignore`, reorder layers. The `.dockerignore` file is the second thing you should add to any Docker-enabled project (the Dockerfile is first).

---

## 1. Why Containerise Playwright Tests?

### The "works on my machine" axis

| Source of drift  | Without Docker                                                                   | With Docker                                |
| ---------------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
| Browser version  | Developer: Chromium 125; CI: Chromium 120 → selector changes break tests         | Same version, pinned in the `FROM` line    |
| OS locale        | macOS en-US date formats vs Ubuntu en-GB → `toHaveText('Jan 1')` fails           | Controlled via `LANG=en_US.UTF-8` in image |
| Font rendering   | Different visual baselines per OS → visual regression test noise                 | Identical font stack in the image          |
| Node version     | Developer: 20.x; CI: 18.x → subtle API differences                               | Pinned in the `FROM` line                  |
| OS shared memory | macOS: /dev/shm is large; Linux: /dev/shm defaults to 64 MB → Chromium OOM crash | Controlled with `--shm-size`               |

### Secondary benefits

- **Isolation**: tests can't read `/etc/passwd` or other host files.
- **Parallel sharding**: run 4 containers each handling 1/4 of the suite in the same CI job.
- **Reproducible debugging**: share the exact image that failed in CI with a developer for local repro.
- **Artifact collection**: mount `playwright-report/` and `test-results/` as volumes; CI picks them up automatically.

---

## 2. Choosing the Right Base Image

Playwright publishes official images at `mcr.microsoft.com/playwright`.

### Image naming convention

```
mcr.microsoft.com/playwright:v{version}-{ubuntu-codename}
```

| Tag             | Ubuntu version | Use when                                        |
| --------------- | -------------- | ----------------------------------------------- |
| `v1.49.0-jammy` | 22.04 LTS      | ✅ Recommended for production pipelines         |
| `v1.49.0-focal` | 20.04 LTS      | Legacy — use only if your CI agent is Ubuntu 20 |
| `v1.49.0-noble` | 24.04 LTS      | Cutting-edge, less tested                       |

> **Always pin the exact Playwright version in `FROM`** and keep it in sync with the `@playwright/test` version in `package.json`. Mismatching them causes subtle selector failures because the browser binaries shipped in the image were tested against a specific Playwright version.

### What's included in the image

- Ubuntu base with all Playwright browser OS dependencies (libglib, libnss, libatk, libpango, libcairo, etc.)
- Chromium, Firefox, and WebKit browser binaries at the pinned version
- Node.js (LTS version matching the image tag)
- `npm` / `npx`
- Standard locale packages (`en_US.UTF-8`)

### What's NOT included

- Your `node_modules` → you must run `npm ci` inside the build
- Your test source files → you must `COPY` them
- Your environment variables / secrets → never bake in, inject at runtime

---

## 3. Writing the Dockerfile

```dockerfile
# framework/Dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app

# Copy manifests first — Docker caches this layer until package.json changes
COPY package.json package-lock.json* ./

# --ignore-scripts skips the postinstall browser download (already in image)
# Saves ~500 MB and 90 s per build
RUN npm ci --ignore-scripts

COPY . .

ENV CI=true

ENTRYPOINT ["npx", "playwright", "test"]
CMD []
```

### Key Dockerfile decisions

| Decision                                        | Rationale                                                                                                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci --ignore-scripts`                       | Skip `playwright install` — browsers are already baked into the base image. Running it would download ~500 MB of browser binaries for nothing. |
| `COPY package.json ... / RUN npm ci / COPY . .` | Layer ordering. If only `.ts` files change, Docker reuses the cached `npm ci` layer — no re-install.                                           |
| `ENV CI=true`                                   | Activates `forbidOnly`, `retries: 2`, and `workers: 4` in `playwright.config.ts`.                                                              |
| `ENTRYPOINT` + `CMD` split                      | `ENTRYPOINT` is always `npx playwright test`. `CMD []` is the default argument. Override at `docker run` time with `--project=api`.            |

### The .dockerignore file

```
# framework/.dockerignore
node_modules/
playwright-report/
test-results/
auth-states/
.env
.env.local
*.lock
.git/
```

Without `.dockerignore`, `COPY . .` copies `node_modules/` (possibly 300 MB+) into the build context, making every build slow and the image bloated.

---

## 4. Running the Container

### Build and run

```bash
# Build the image (only needed once, or when Dockerfile/package.json changes)
docker build -t playwright-framework .

# Run all tests (CI mode: 4 workers, retries on failure)
docker run --rm playwright-framework

# Run a specific project
docker run --rm playwright-framework npx playwright test --project=api

# Run with a specific file
docker run --rm playwright-framework npx playwright test tests/orangehrm/login.spec.ts

# Headed mode (requires a display — add X11 forwarding or use VNC)
docker run --rm -e DISPLAY=:1 playwright-framework npx playwright test --headed
```

### The /dev/shm problem

Linux containers default to 64 MB of `/dev/shm` (shared memory). Chromium uses shared memory for IPC and will OOM-crash with the default.

```bash
# ✅ Always set shm-size when running Playwright containers
docker run --rm --shm-size=2g playwright-framework
```

Or in `docker-compose.yml`:

```yaml
services:
  playwright:
    shm_size: "2gb"
```

### Mounting artifact volumes

```bash
docker run --rm \
  --shm-size=2g \
  -v "$(pwd)/playwright-report:/app/playwright-report" \
  -v "$(pwd)/test-results:/app/test-results" \
  playwright-framework
```

After the run, `playwright-report/` and `test-results/` appear on the host — CI pipeline picks them up as build artifacts.

---

## 5. Docker Compose for Multi-Service Testing

When your tests target a local application (not a remote URL), Docker Compose coordinates both the app and the test runner.

```yaml
# framework/docker-compose.yml
version: "3.9"

services:
  app:
    image: node:20-alpine
    command: sh -c "npx --yes serve -s . -l 3000"
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000"]
      interval: 5s
      retries: 6
      start_period: 10s

  playwright:
    build:
      context: .
      dockerfile: Dockerfile
    shm_size: "2gb"
    depends_on:
      app:
        condition: service_healthy # ← waits until app passes healthcheck
    environment:
      CI: "true"
      API_BASE_URL: ${API_BASE_URL:-https://reqres.in}
    volumes:
      - ./playwright-report:/app/playwright-report
      - ./test-results:/app/test-results
```

```bash
# Run with compose (builds playwright image, starts app, runs tests, stops all)
docker compose run --rm playwright

# Equivalent npm script (package.json):
npm run test:docker
```

### Healthcheck matters

Without `depends_on: condition: service_healthy`, the `playwright` service starts immediately and tests hit a server that hasn't finished booting. Always add a healthcheck to the app service and the `condition: service_healthy` dependency.

---

## 6. Parallel Sharding in Docker

The most powerful Docker pattern: run N identical containers each handling 1/N of the test suite.

### What sharding does

```
Full suite: 120 tests
Shard 1/4:  tests 1–30   (parallel across 4 workers inside the container)
Shard 2/4:  tests 31–60
Shard 3/4:  tests 61–90
Shard 4/4:  tests 91–120
```

Each shard is an independent container — they can run simultaneously on different CI agents, reducing total wall-clock time by up to 4×.

### GitHub Actions matrix sharding

```yaml
# .github/workflows/playwright.yml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4] # ← 4 parallel jobs
    steps:
      - uses: actions/checkout@v4
      - name: Run shard ${{ matrix.shard }}/4
        run: |
          docker run --rm \
            --shm-size=2g \
            -v ${{ github.workspace }}/playwright-report:/app/playwright-report \
            -v ${{ github.workspace }}/test-results:/app/test-results \
            playwright-framework \
            npx playwright test --shard=${{ matrix.shard }}/4
```

### Merge sharded reports

After all shards finish, merge their JSON reports into one HTML report:

```yaml
- name: Merge reports
  run: npx playwright merge-reports ./all-blob-reports --reporter=html
  if: always()
- uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
  if: always()
```

---

## 7. Passing Secrets Safely

❌ **Never bake secrets into the image** — they become part of the image layers and are readable by anyone with `docker history`.

```dockerfile
# ❌ WRONG — secret is baked into the image
ENV ORANGEHRM_PASSWORD=supersecret
```

✅ **Inject at runtime** via environment variables:

```bash
# CLI — from host environment
docker run --rm \
  -e ORANGEHRM_USERNAME="$ORANGEHRM_USERNAME" \
  -e ORANGEHRM_PASSWORD="$ORANGEHRM_PASSWORD" \
  playwright-framework

# From a .env file (never commit .env to git)
docker run --rm --env-file .env playwright-framework
```

✅ **In CI/CD** — use the CI platform's secrets manager:

```yaml
# GitHub Actions
env:
  ORANGEHRM_USERNAME: ${{ secrets.ORANGEHRM_USERNAME }}
  ORANGEHRM_PASSWORD: ${{ secrets.ORANGEHRM_PASSWORD }}
```

```yaml
# Azure DevOps
- task: Docker@2
  env:
    ORANGEHRM_USERNAME: $(orangehrm-username) # ← from Azure Key Vault
    ORANGEHRM_PASSWORD: $(orangehrm-password)
```

---

## 8. Single-Stage vs Multi-Stage Builds

For most test frameworks a single-stage build is fine. Multi-stage is worth it when you need to transpile the test source before running.

### Single-stage (framework default)

```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-jammy
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY . .
ENTRYPOINT ["npx", "playwright", "test"]
```

### Multi-stage (if you compile TypeScript separately)

```dockerfile
# Stage 1 — compile TypeScript to JavaScript
FROM node:20-slim AS builder
WORKDIR /build
COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci
COPY . .
RUN npx tsc --outDir dist

# Stage 2 — runtime image (has browsers, not the full TS compiler)
FROM mcr.microsoft.com/playwright:v1.49.0-jammy AS runner
WORKDIR /app
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
COPY package.json ./
ENTRYPOINT ["npx", "playwright", "test", "--config=dist/playwright.config.js"]
```

Multi-stage advantage: the final image doesn't contain TypeScript compiler or source maps — slightly smaller and no source exposure in the image.

---

## 9. CI/CD Integration Patterns

### GitHub Actions (full pipeline)

```yaml
name: Playwright Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build test image
        run: docker build -t playwright-framework ./framework

      - name: Run all tests
        run: |
          docker run --rm \
            --shm-size=2g \
            -v ${{ github.workspace }}/framework/playwright-report:/app/playwright-report \
            -v ${{ github.workspace }}/framework/test-results:/app/test-results \
            -e CI=true \
            -e ORANGEHRM_USERNAME=${{ secrets.ORANGEHRM_USERNAME }} \
            -e ORANGEHRM_PASSWORD=${{ secrets.ORANGEHRM_PASSWORD }} \
            playwright-framework

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: framework/playwright-report/
          retention-days: 14
```

### Azure DevOps Pipeline

```yaml
trigger:
  - main

pool:
  vmImage: ubuntu-latest

steps:
  - task: Docker@2
    displayName: Build test image
    inputs:
      command: build
      dockerfile: framework/Dockerfile
      buildContext: framework
      tags: playwright-framework

  - script: |
      docker run --rm \
        --shm-size=2g \
        -v $(Build.ArtifactStagingDirectory)/report:/app/playwright-report \
        -v $(Build.ArtifactStagingDirectory)/results:/app/test-results \
        -e CI=true \
        -e ORANGEHRM_USERNAME=$(orangehrmUsername) \
        -e ORANGEHRM_PASSWORD=$(orangehrmPassword) \
        playwright-framework
    displayName: Run Playwright tests

  - task: PublishPipelineArtifact@1
    condition: always()
    inputs:
      targetPath: $(Build.ArtifactStagingDirectory)/report
      artifact: PlaywrightReport
```

---

## 10. Common Mistakes

### ❌ Forgetting `--ignore-scripts` in npm ci

```dockerfile
# ❌ Downloads all browsers again — 500 MB wasted, 90 s slower build
RUN npm ci

# ✅ Browsers already in the image — skip postinstall
RUN npm ci --ignore-scripts
```

### ❌ Not setting --shm-size

```bash
# ❌ Chromium crashes with "Target closed" or "OOM" after ~30 tests
docker run playwright-framework

# ✅
docker run --shm-size=2g playwright-framework
```

### ❌ Running as root in production

```dockerfile
# ✅ Add non-root user (security best practice in production images)
RUN useradd -m playwright
USER playwright
```

Note: The official Playwright image already uses a non-root user (`pwuser`). Check with `docker inspect mcr.microsoft.com/playwright:v1.49.0-jammy | grep User`.

### ❌ Hardcoding baseURL in the image

```dockerfile
# ❌ Tight coupling — must rebuild image to change environment
ENV APP_URL=https://staging.example.com
```

```bash
# ✅ Override at runtime — same image for staging AND production
docker run --rm -e APP_URL=https://staging.example.com playwright-framework
docker run --rm -e APP_URL=https://production.example.com playwright-framework
```

### ❌ No healthcheck on the app service

```yaml
# ❌ playwright starts immediately — app may not be ready
services:
  app:
    image: myapp
  playwright:
    depends_on:
      - app  # only waits for container START, not readiness

# ✅ playwright waits until app passes its healthcheck
services:
  app:
    image: myapp
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 5s
      retries: 10
  playwright:
    depends_on:
      app:
        condition: service_healthy
```

### ❌ Committing auth-states to the image

```
# ❌ auth-states/ not in .dockerignore
COPY . .   # copies admin.json with live credentials into the image
```

```
# ✅ .dockerignore
auth-states/
*.storageState.json
```

---

## 11. Debugging Failing Container Runs

### Shell into the container

```bash
# Override entrypoint to get a shell instead of running tests
docker run --rm -it --entrypoint /bin/bash playwright-framework

# Inside: run tests manually, inspect files, check env
npx playwright test --project=api --debug
env | grep -i playwright
```

### Save a trace from a container run

```bash
docker run --rm \
  --shm-size=2g \
  -v "$(pwd)/traces:/app/traces" \
  -e PLAYWRIGHT_TRACE=on \
  playwright-framework
# After: npx playwright show-trace traces/*.zip
```

### View logs during a compose run

```bash
docker compose run --rm playwright 2>&1 | tee test-run.log
```

---

## 12. Quick Reference

```bash
# ── Build ──────────────────────────────────────────────────
docker build -t playwright-framework ./framework
npm run test:docker:build              # via npm script

# ── Run ────────────────────────────────────────────────────
docker run --rm --shm-size=2g playwright-framework
npm run test:docker                    # via npm script (uses compose)

# ── Shard ──────────────────────────────────────────────────
docker run --rm --shm-size=2g playwright-framework \
  npx playwright test --shard=1/4

# ── Specific project ───────────────────────────────────────
docker run --rm --shm-size=2g playwright-framework \
  npx playwright test --project=api

# ── Debug shell ────────────────────────────────────────────
docker run --rm -it --entrypoint /bin/bash \
  --shm-size=2g playwright-framework

# ── With compose ───────────────────────────────────────────
docker compose build
docker compose run --rm playwright
docker compose down --volumes
```

---

## Practice Problems

<details>
<summary>Problem 1 [EASY] — Why does this Dockerfile download browsers when it shouldn't?</summary>

```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-jammy
WORKDIR /app
COPY package.json ./
RUN npm install          # ← browser download triggered
COPY . .
```

**Answer:**  
`npm install` (without `--ignore-scripts`) runs the `@playwright/test` `postinstall` script, which calls `playwright install`. This downloads all browser binaries that are ALREADY in the base image — wasting ~500 MB and ~90 s per build.

**Fix:** `RUN npm ci --ignore-scripts`

Also: use `npm ci` (not `npm install`) for reproducible installs from `package-lock.json`.

</details>

<details>
<summary>Problem 2 [MEDIUM] — Your CI pipeline runs 200 tests and takes 15 minutes. How would you use Docker + sharding to get under 5 minutes?</summary>

**Answer:**  
Use a matrix strategy with 4 shards:

- 4 containers each run 50 tests in parallel (4 workers each → 16 total browser instances)
- Wall-clock time: ~15 min ÷ 4 = ~4 min per shard

GitHub Actions matrix:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: docker run --rm --shm-size=2g playwright-framework \
      npx playwright test --shard=${{ matrix.shard }}/4
```

After all shards: merge blob reports with `npx playwright merge-reports`.

</details>

<details>
<summary>Problem 3 [MEDIUM] — Your compose healthcheck passes but tests still fail with "Connection refused". What are three possible causes?</summary>

**Answer:**

1. **App listens on 127.0.0.1, not 0.0.0.0** — the healthcheck runs inside the container's network namespace so it can reach 127.0.0.1, but the `playwright` service reaches the `app` service via the Docker network bridge (its container IP, not loopback). Fix: bind the app to `0.0.0.0`.

2. **Wrong baseURL in playwright.config.ts** — the URL must use the Docker Compose service name, not `localhost`. E.g., `http://app:3000`, not `http://localhost:3000`. Docker Compose DNS resolves service names between containers.

3. **Healthcheck too aggressive / start_period too short** — the app process starts but needs time to initialise a DB connection. The healthcheck passes the port check before the app is fully ready. Fix: increase `start_period` or add a `/health` endpoint that checks DB readiness.
</details>

<details>
<summary>Problem 4 [HARD] — Write a GitHub Actions workflow that runs 3 Docker shards in parallel and uploads a merged HTML report as an artifact.</summary>

```yaml
name: Playwright Sharded
on: [push]
jobs:
  build-image:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t playwright-framework ./framework
      - run: docker save playwright-framework | gzip > /tmp/pw-image.tar.gz
      - uses: actions/upload-artifact@v4
        with: { name: docker-image, path: /tmp/pw-image.tar.gz }

  test:
    needs: build-image
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with: { name: docker-image, path: /tmp }
      - run: docker load < /tmp/pw-image.tar.gz
      - run: |
          docker run --rm --shm-size=2g \
            -v ${{ github.workspace }}/blob-report:/app/blob-report \
            -e CI=true \
            playwright-framework \
            npx playwright test --shard=${{ matrix.shard }}/3 \
              --reporter=blob
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report/

  merge-reports:
    needs: test
    runs-on: ubuntu-latest
    if: always()
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
        working-directory: framework
      - uses: actions/download-artifact@v4
        with: { path: all-blob-reports, pattern: blob-report-* }
      - run: npx playwright merge-reports ./all-blob-reports --reporter=html
        working-directory: framework
      - uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: framework/playwright-report/
          retention-days: 30
```

</details>

---

**← [Ch 58: File Uploads & Downloads](../03_Real_World_Scenarios/58_File_Uploads_Downloads.md) | [Index](../00_INDEX.md) | [Ch 60: Tool Comparison →](../08_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md)**


---

## Reality Check

**"Playwright's Docker image is just Ubuntu with Node"** → Microsoft provides official Playwright Docker images (`mcr.microsoft.com/playwright`) with: specific browser versions pinned to the Playwright version, system dependencies for each browser (libatk, libgbm, etc.), fonts needed for consistent rendering, and configuration optimized for headless operation. These are NOT just Ubuntu + Node + `npm install playwright`. The browser binaries need 50+ system libraries to run — the official image installs them all. Building your own image requires replicating the full dependency list from Playwright's own Dockerfile.

**"Containers solve all 'works on my machine' problems"** → Docker ensures consistent: OS, Node version, browser version, system libraries, and installed packages. It does NOT ensure consistent: timezone (container timezone may differ from expected), locale (affects date formatting in tests), available fonts (missing fonts cause text rendering differences in visual tests), hardware performance (CI container may be CPU/memory-constrained vs local machine), and network conditions (DNS, proxies, firewalls in CI environment). 'Works in Docker' is a necessary improvement but not a guarantee of identical behavior everywhere.

**"Running Playwright in Docker requires --privileged mode"** → Playwright requires: `--shm-size=2g` (shared memory for Chrome's renderer processes — default 64MB is too small and crashes Chrome), or `--ipc=host`. NOT `--privileged` (full host capabilities — a security risk). Additional flags for headless Chrome: `--no-sandbox` (when running as root in a container — Chrome's sandbox requires user namespaces which some Docker configurations don't allow). Principle of least privilege: `--shm-size=2g` + `--no-sandbox` are the minimum flags; never add `--privileged` unless you've verified it's actually needed.

**"Each test run should use a fresh Docker container"** → Using fresh containers per run: guarantees isolation, prevents state contamination, but has overhead (pull image, start container, install deps). For CI: cache Docker layers (node_modules layer, browser binaries layer) aggressively. The browser binary layer is the heaviest (Chromium + Firefox + WebKit = ~1.5GB). Strategy: pre-build and push a tagged Docker image to your container registry in a weekly job; CI pulls the pre-built image (fast) instead of installing browsers every run. `mcr.microsoft.com/playwright:v1.x.x-focal` is a stable, pre-built base.

**"Docker networking is transparent to Playwright tests"** → In Docker: `localhost` inside the container is the container, not the host machine. If your application runs on the host: use `host.docker.internal` (Docker Desktop) or the host's gateway IP (Linux Docker). In Docker Compose: services communicate by service name: `http://app:3000` (not `http://localhost:3000`). Playwright tests running in a container and testing an app in another container must use the service name, not localhost. This is a common "connection refused" failure when moving from local to Docker: the test is connecting to itself rather than the app service.
