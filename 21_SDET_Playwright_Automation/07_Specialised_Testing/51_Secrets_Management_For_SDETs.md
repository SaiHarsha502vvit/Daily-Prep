# 51. Secrets Management for SDETs — Stop Committing `.env` Files

**Navigation**: [← 50. Email Service Testing](../05_Advanced_Topics/50_Email_Service_Testing.md) | [Index](../00_INDEX.md) | [→ 52. Component Testing](../05_Advanced_Topics/52_Component_Testing_With_Playwright_CT.md)

---

## 5W1H

- **WHAT**: Where API tokens, credentials, and signing keys live so they (a) aren't in git, (b) are available in CI, and (c) can be rotated without a code change.
- **WHY**: One leaked `.env` lands you in the security incident channel. SDETs are now the gate for a non-trivial blast radius — your tests use real tokens with real permissions.
- **WHO**: Every SDET writing API tests or running CI. Even if the security team "owns" secrets, SDETs own the implementation of how they're consumed.
- **WHEN**: From day one. Retrofitting a secrets leak after it's been in git history requires `git filter-branch` and force-pushes — painful and incomplete if anyone forked.
- **HOW**: Local `.env` (gitignored) for dev, GitHub Actions / Azure DevOps secrets for CI, Vault / AWS Secrets Manager for shared org-wide rotation.

---

## War Stories — Before You Get Comfortable

### Story 1: The token in the trace artifact

We enabled `trace: 'on'` for debugging a flaky test. The trace file captured the full HTTP request — including the `Authorization: Bearer ghp_1234567890abcdef...` header. We uploaded traces as CI artifacts. GitHub Actions artifacts are accessible to any collaborator on the repo. The token was a GitHub personal access token with `repo` scope — essentially full read/write access to all our private repos.

We discovered it 11 days later when a security scanner flagged the public artifact. The token had been valid the whole time. It had made 3 API calls we didn't recognize (a GitHub API researcher scraping public artifacts for token patterns).

**Fix:** Strip auth headers from traces. `playwright.config.ts` accepts `use: { extraHTTPHeaders: { Authorization: '' } }` to override them globally, or filter at the reporter level. We now only upload traces that have been scrubbed.

### Story 2: The README with real values

A new SDET wrote a `README.md` with a setup section:

```bash
# Copy and fill in your values
cp .env.example .env

# Or just run this (it works for the staging environment):
export ORANGEHRM_PASSWORD=Admin1234!
```

That password worked in staging. The staging environment shared a database with an internal integration environment. The integration environment had production data from one customer who had opted into a beta. That customer's data was now accessible to anyone who read the README.

The commit had been in `main` for 6 weeks. `git filter-branch` took 2 hours to rewrite history. Everyone with forks had to re-clone.

**Fix:** `NEVER put values in docs, even staging values.` Use `your-value-here` as the placeholder. Values in docs will eventually be real.

### Story 3: The token shared between team members

A team of 5 shared one `STAGING_API_TOKEN` created by the tech lead. When the tech lead left, his account was deactivated. The token was revoked. All 5 teammates' CI pipelines broke at 11pm on a deployment Thursday. Production wasn't affected, but the team spent 4 hours rotating the token across 6 repos and 3 CI pipelines while debugging an unrelated deployment.

**Fix:** Secrets belong to service accounts or CI-managed identities, not personal accounts. If the secret dies when a person leaves, it's a personal token in the wrong place.

### Story 4: The Playwright log that captured a password

```typescript
// Dev added debug logging
console.log(`Logging in as: ${credentials.email} / ${credentials.password}`);
```

This line made it into CI logs. GitHub Actions logs are retained for 90 days by default. The password was a staging password. Staging and production used the same password for the admin account (because "staging is internal").

**Fix:** Never log credentials, ever. The `describeForLog` pattern in Section 4 is one mitigation. The better answer: never use the same password for staging and production, and never log request-level data without scrubbing it first.

---

## 1. Threat Model for SDET Work

| Threat | Likelihood | Mitigation |
|--------|-----------|-----------|
| `.env` committed to git | High (developer accident) | `.gitignore` + pre-commit gitleaks hook |
| Token in CI log | Medium (console.log in test) | Reporter scrubbing + `describeForLog` |
| Token in trace artifact | Medium (trace: 'on' in CI) | Strip auth headers before trace upload |
| Token in screenshot | Low (password visible briefly) | Never screenshot login form, or mask fields |
| Long-lived token exposure | Medium (12-month tokens common) | Rotate quarterly; prefer short-lived OIDC |
| Token shared across envs | High (convenience) | One secret per env, naming convention enforced |
| Token in personal GitHub forks | Medium (artifact exposure) | Restrict artifact visibility to repo collaborators |
| Stale token after team member leaves | High (most teams don't notice) | Service accounts only; human tokens = never |

---

## 2. The Three Tiers

```
Local dev              CI                      Org-wide / shared
──────────────         ──────────────────      ──────────────────────
.env (gitignored)      GH Actions secrets      Vault / Doppler / AWS SM
   │                   │                       │
   └─ Your personal    └─ Per repo, per env    └─ Rotated, audited,
      token               managed by repo admin    centrally controlled
```

### Tier 1 — Local `.env`

```bash
# framework/.env.example  (commit this)
BASE_URL=http://localhost:4200
ADMIN_USER=Admin
ADMIN_PASS=your-value-here
REQRES_API_KEY=your-value-here

# framework/.env  (never commit this — in .gitignore)
BASE_URL=http://localhost:4200
ADMIN_USER=Admin
ADMIN_PASS=Admin1234!
REQRES_API_KEY=abc123...
```

Rules:
- `.env` stays local, `.env.example` is committed
- Every team member uses their own credentials, not the team's shared account
- Onboarding step: `cp .env.example .env`, then fill in your values

### Tier 2 — GitHub Actions Secrets

```yaml
# .github/workflows/ci.yml
env:
  ADMIN_PASS: ${{ secrets.STAGING_ADMIN_PASS }}
  REQRES_API_KEY: ${{ secrets.REQRES_API_KEY }}

steps:
  - name: Run tests
    run: npm test
    working-directory: framework
```

GitHub Actions automatically masks secret values in logs — they appear as `***`. Rules:
- PRs from forks do NOT get secrets by default (keep this default — forked PR malicious code cannot exfiltrate your tokens)
- Never `echo $ADMIN_PASS` — bypasses masking
- Use environment-specific secret names: `STAGING_ADMIN_PASS`, `PROD_ADMIN_PASS` — never share across environments

### Tier 3 — Vault / Doppler / AWS Secrets Manager

For multi-repo organizations, having `STAGING_ADMIN_PASS` in 12 different repos creates a rotation nightmare. Central secrets management solves this.

**Doppler** (simplest integration):

```yaml
# .github/workflows/ci.yml with Doppler
steps:
  - uses: dopplerhq/cli-action@v3
  - name: Run tests with Doppler-injected secrets
    run: doppler run -- npm test
    working-directory: framework
    env:
      DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

Doppler fetches all secrets for the `ci` config at runtime, injects them as environment variables. You rotate in Doppler, every repo picks it up automatically.

**HashiCorp Vault** (enterprise standard):

```typescript
// config/vault-loader.ts
import * as vault from 'node-vault';

export async function loadSecretsFromVault(): Promise<Record<string, string>> {
  const client = vault.default({
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR!,
    token: process.env.VAULT_TOKEN!, // short-lived token from OIDC auth
  });

  const secret = await client.read('secret/data/sdet/staging');
  return secret.data.data as Record<string, string>;
}

// Usage in globalSetup
export default async function globalSetup() {
  const secrets = await loadSecretsFromVault();
  process.env.ADMIN_PASS = secrets.ADMIN_PASS;
  process.env.REQRES_API_KEY = secrets.REQRES_API_KEY;
}
```

**AWS Secrets Manager** (AWS-native):

```typescript
// config/aws-secrets-loader.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export async function loadAWSSecret(secretName: string): Promise<Record<string, string>> {
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretName }));

  if (!response.SecretString) throw new Error(`Secret ${secretName} is empty`);
  return JSON.parse(response.SecretString) as Record<string, string>;
}

// Usage
const secrets = await loadAWSSecret('sdet/staging/credentials');
```

---

## 3. Token Rotation Patterns

Rotation is where most teams fail. "We should rotate secrets quarterly" is said; a calendar event is rarely set.

### Rotation runbook (the part that's usually missing)

Every secret in your test suite needs a runbook entry with:

```markdown
## STAGING_ADMIN_PASS rotation

**Who owns it:** Platform SDET
**Rotate every:** 90 days
**Next rotation:** 2026-09-14 (add to calendar)

**Steps:**
1. Generate new password in LastPass (12+ chars, mixed case + symbols)
2. Update the staging OrangeHRM admin password via admin UI
3. Update GitHub Actions secret: Settings → Secrets → STAGING_ADMIN_PASS
4. Run a manual CI trigger to confirm tests still pass
5. Update this doc with next rotation date

**Emergency (token leaked):**
1. IMMEDIATELY change the staging password (don't wait for a meeting)
2. Rotate the GH Actions secret within 1 hour
3. Check CI logs from the last 90 days for unexpected usage
4. File a security incident if any unauthorized API calls found
```

Without the runbook, rotation doesn't happen. With the runbook, any team member can rotate without tribal knowledge.

### OIDC short-lived tokens (the future)

GitHub Actions supports OpenID Connect (OIDC) to authenticate with AWS, Azure, GCP without storing any static credentials:

```yaml
# No static AWS credentials needed
permissions:
  id-token: write  # Required for OIDC
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789:role/GitHubActionsSDETRole
      aws-region: us-east-1

  - name: Load secrets from AWS SM and run tests
    run: |
      export ADMIN_PASS=$(aws secretsmanager get-secret-value \
        --secret-id sdet/staging/credentials \
        --query 'SecretString' --output text | jq -r '.ADMIN_PASS')
      npm test
    working-directory: framework
```

The GitHub OIDC token expires after the job completes. There are no static `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` values to steal from logs.

---

## 4. The `describeForLog` Discipline

Never log raw config objects. Scrub before logging:

```typescript
// config/env.loader.ts
const SENSITIVE_KEYS = new Set(['ADMIN_PASS', 'API_TOKEN', 'REQRES_API_KEY', 'DB_PASSWORD']);

export function describeForLog(config: Record<string, unknown>): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) {
    if (SENSITIVE_KEYS.has(k)) {
      safe[k] = v ? '***' : '<missing>';
    } else {
      safe[k] = String(v);
    }
  }
  return safe;
}

// Safe to log anywhere:
console.log('Config loaded:', JSON.stringify(describeForLog(envConfig)));
// Output: { "ADMIN_PASS": "***", "BASE_URL": "http://localhost:4200" }
```

### Playwright trace scrubbing

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // Strip Authorization headers from all traced requests
    extraHTTPHeaders: {
      Authorization: undefined, // removes the header from traces
    },
  },
});
```

For finer control — scrub only in the trace, keep headers for actual test requests:

```typescript
// framework/fixtures/auth.fixture.ts
test.use({
  contextOptions: {
    // Headers for actual requests (not in trace)
  },
});

// Override trace behavior per project
// playwright.config.ts
projects: [{
  name: 'api',
  use: {
    // API project: no trace (tokens too sensitive)
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
}],
```

---

## 5. Pre-Commit Scanning

Catch secrets before they reach git:

```bash
# Install gitleaks as a dev dependency
npm install -D gitleaks-binary

# Or add as a pre-commit hook via Husky
# framework/.husky/pre-commit (add this line)
npx gitleaks protect --staged --verbose
```

The `.gitleaks.toml` in the framework root allows known-safe patterns:

```toml
# .gitleaks.toml
[allowlist]
description = "Known safe patterns in test fixtures"
regexes = [
  # OrangeHRM demo credentials (public, rotating, not real production)
  "Admin1234!",
  # reqres.in public API key (public test API)
  "reqres_live_",
]
```

**Never allowlist real tokens.** The allowlist is for known-safe patterns that look like secrets (short strings, base64) but aren't.

---

## 6. CI Hardening Checklist

- [ ] Secrets are env-vars at job time, not hardcoded in YAML
- [ ] PRs from forks do NOT get secrets (GitHub default — verify this hasn't been changed)
- [ ] `echo $SECRET` never appears in any workflow file
- [ ] Trace artifacts are scrubbed of auth headers before upload
- [ ] Report artifacts don't embed request bodies with tokens
- [ ] Secrets have rotation runbooks with calendar entries
- [ ] Service accounts own all secrets — no personal tokens in CI
- [ ] Secret names are environment-scoped: `STAGING_X`, `PROD_X` — never just `X`
- [ ] gitleaks pre-commit hook is active and tested

---

## 7. Common Mistakes

1. **`.env` in the README example with real values.** Someone will copy-paste it into production.
2. **Storing prod tokens in staging GH secrets** — instant cross-env contamination if staging is compromised.
3. **`console.log(request.headers())` in debug mode** — auth headers are there, they go to CI logs.
4. **One token for all team members** — when that person leaves, CI breaks across 6 repos simultaneously.
5. **Long TTL tokens (12-month GitHub PATs)** — one leak gives an attacker a year of access.
6. **Trace artifacts without scrubbing** — `Authorization: Bearer` headers are in every network call trace.
7. **No rotation runbook** — quarterly rotation stays aspirational and never happens.

---

## 8. Progressive Maturity Path

| Stage | What you have | What to add next |
|-------|--------------|-----------------|
| Basic | `.env` gitignored, personal tokens locally | Add gitleaks pre-commit hook |
| Team | GitHub Actions secrets, per-env naming | Add `describeForLog`, scrub traces |
| Mature | Rotation runbook + calendar, service accounts | Migrate to Doppler/Vault for centralized rotation |
| Advanced | OIDC short-lived tokens, no static creds in CI | Per-env IAM scoping (staging role ≠ prod role) |

---

## 9. Exercise

1. Run `npx gitleaks detect --source=.` on the whole repo. Note any real findings vs false positives.
2. Add `.gitleaks.toml` with an allowlist for the OrangeHRM demo credentials.
3. Add the gitleaks pre-commit hook to `framework/`.
4. Try committing `export SECRET=AKIAIOSFODNN7EXAMPLE`. Confirm gitleaks blocks it.
5. Add `describeForLog` to `framework/config/env.loader.ts` and use it in the `globalSetup` log line.
6. Write a one-paragraph rotation runbook for `STAGING_ADMIN_PASS` in your project's `docs/` folder. Include: who rotates it, how often, how to do it, what to do in an emergency.

The runbook is the artifact that separates "we have secrets management" from "we have secrets management that survives a midnight incident."


---

## Reality Check

**"Environment variables are secure for storing secrets"**→ Environment variables are visible in: process listings (ps aux), CI/CD build logs (if echoed accidentally), container inspection (docker inspect), crash dumps, and child process inheritance. They are better than hardcoding secrets in code but worse than dedicated secret managers. Use environment variables as the delivery mechanism from a secret manager, not as the storage mechanism.

**"dotenv files are fine for local development secrets"**→ .env files containing real API keys or database passwords become security incidents when: accidentally committed to git (even if later deleted, they exist in git history), shared via Slack or email, or left on a developer machine that is stolen. Use .env.example with placeholder values committed to git, and .env with real values in .gitignore. Better yet, use a local secret manager (1Password CLI, AWS SSM parameter store).

**"Test environments do not need secret management"**→ Test environment secrets (database credentials, API keys, service account tokens) have the same sensitivity as production secrets. A compromised test environment credential can be used to: access production databases (if the same credentials are reused), impersonate the test service against third-party APIs, or pivot into the internal network through the test infrastructure.

**"CI/CD secret injection is secure by default"**→ CI/CD platforms store secrets encrypted at rest, but secrets are decrypted and available in: the build environment as environment variables, build logs if a step echoes them, and build artifacts if a step writes them to a file. Mask secrets in logs (most CI platforms support this), never write secrets to build artifacts, and restrict secret access to specific branches and workflows.

**"Rotating test secrets is unnecessary"**→ Test API keys and service account tokens with no expiry are security risks: former team members retain access, compromised CI runners expose persistent credentials, and stolen keys provide indefinite access. Rotate test secrets quarterly, use short-lived tokens where possible (OIDC tokens in GitHub Actions, temporary STS credentials in AWS), and audit who has access to test secret stores.
