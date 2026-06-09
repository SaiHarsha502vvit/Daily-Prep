# ============================================================
# Playwright Enterprise Framework — Docker Image
# ============================================================
# Base: official Playwright image from Microsoft (includes all browsers
# and their OS dependencies pre-installed).  Pin the exact version to
# match the @playwright/test version in package.json (^1.49.0).
#
# Usage:
#   Build:   docker build -t playwright-framework .
#   Run all: docker run --rm playwright-framework
#   Run project: docker run --rm playwright-framework npx playwright test --project=api
#
# See docker-compose.yml for the full multi-service setup.
# ============================================================

FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# ── Security: run as non-root user ──────────────────────────
# The MCR image ships with a 'pwuser' user (UID 1000). Re-use it.
# If pwuser does not exist, create one.
RUN id -u pwuser &>/dev/null || ( \
    groupadd -r pwuser -g 1000 && \
    useradd -r -g pwuser -u 1000 -m -s /bin/bash pwuser \
    )

# ── Working directory inside the container ──────────────────
WORKDIR /app
RUN chown -R pwuser:pwuser /app

# ── Switch to non-root user for subsequent operations ────────
USER pwuser

# ── Environment defaults ──────────────────────────────────────
# CI=true → forbidOnly, 4 workers, 2 retries (matches playwright.config.ts)
ENV CI=true
# The base image already has browsers at /ms-playwright; tell Playwright.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# ── Install Node dependencies ────────────────────────────────
# Copy manifest files FIRST so Docker's layer cache skips npm install
# when only source files change (common pattern for faster rebuilds).
COPY --chown=pwuser:pwuser package.json package-lock.json* ./

# Install only production + devDependencies needed to run tests.
# --ignore-scripts skips the postinstall browser download — the MCR image
# already has browsers; downloading again wastes ~500 MB and 90 s.
RUN npm ci --ignore-scripts

# ── Copy the rest of the framework source ───────────────────
# .dockerignore should exclude: node_modules, playwright-report,
# test-results, .env, *.json.lock, auth-states/
COPY --chown=pwuser:pwuser . .

# ── Entrypoint ───────────────────────────────────────────────
# Default: run all tests. Override with a command argument:
#   docker run --rm playwright-framework npx playwright test --project=api
ENTRYPOINT ["npx", "playwright", "test"]
CMD []
