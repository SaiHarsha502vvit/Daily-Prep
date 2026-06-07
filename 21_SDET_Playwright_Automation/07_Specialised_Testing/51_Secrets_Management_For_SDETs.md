# 51. Secrets Management for SDETs — Stop Committing `.env` Files

**Navigation**: [← 50. Email Service Testing](../05_Advanced_Topics/50_Email_Service_Testing.md) | [Index](../00_INDEX.md) | [→ 52. Component Testing](../05_Advanced_Topics/52_Component_Testing_With_Playwright_CT.md)

---

## 5W1H

- **WHAT**: Where API tokens, credentials, and signing keys live so they (a) aren't in git, (b) are available in CI, and (c) can be rotated without a code change.
- **WHY**: One leaked `.env` lands you in the security incident channel. SDETs are now the gate for a non-trivial blast radius — your tests use real tokens.
- **WHO**: Every SDET writing API tests or running CI.
- **WHEN**: From day one of a project. Retrofitting is painful but mandatory.
- **HOW**: Local `.env` (gitignored) for dev, GitHub Actions/Azure DevOps secrets for CI, Doppler / Vault / AWS Secrets Manager for shared/rotated secrets.

---

## 1. Threat model

| Threat | Mitigation |
|---|---|
| `.env` committed | `.gitignore` + pre-commit hook scanning for `*_TOKEN=` patterns |
| Token in test log | Reporter scrubbing + `mask()` in CI |
| Token in trace artifact | `use: { trace: 'on' }` captures network — sanitise headers |
| Token in screenshot | The login form briefly shows the password — never `value` attribute screenshot |
| Long-lived token | Rotate quarterly; use short-lived OIDC tokens in CI when possible |
| Token shared across envs | One secret per env; never reuse prod tokens in staging |

---

## 2. The three tiers

```
Local dev         CI                  Org-wide / shared
──────────        ──────────────      ──────────────────
.env (gitignored) GH Actions secrets  Doppler / Vault / AWS SM
   │              │                   │
   └─ Personal    └─ Per repo,        └─ Rotated, audited,
      tokens          per env             centrally controlled
```

### Local
- `.env` file, **always** gitignored, **never** copy-pasted into Slack.
- `cp .env.example .env` is the onboarding step.
- Use your own personal API token in dev, not the team's.

### CI — GitHub Actions example
```yaml
env:
  API_TOKEN: ${{ secrets.STAGING_API_TOKEN }}
  ORANGEHRM_PASSWORD: ${{ secrets.ORANGEHRM_PASSWORD }}
steps:
  - run: npm test
```
GitHub masks secrets in logs automatically. Don't `echo $SECRET` — that bypasses masking.

### Org-wide — Doppler / Vault
For multi-repo orgs, having `STAGING_API_TOKEN` in 12 different GH repos is unmaintainable. A central secrets manager (Doppler, HashiCorp Vault, AWS Secrets Manager) syncs secrets into CI on demand and lets you rotate once.

---

## 3. The `env.loader` discipline (revisited)

```typescript
// config/env.loader.ts
const SECRET_KEYS = ['API_TOKEN', 'DB_PASSWORD'];

export function describeForLog(config: EnvironmentConfig): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) {
    if (SECRET_KEYS.includes(k)) {
      safe[k] = v ? '***' : '<missing>';
    } else {
      safe[k] = String(v);
    }
  }
  return safe;
}
```

Now `console.log(describeForLog(envConfig))` is safe to put in failure paths. Without this, well-intentioned logging leaks tokens.

---

## 4. Pre-commit scanning

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

Or in `package.json`:

```json
"husky": {
  "hooks": { "pre-commit": "npx gitleaks protect --staged" }
}
```

Catches `AKIA...`, `ghp_...`, `xoxb-...` and other recognisable token patterns before they hit a remote.

---

## 5. CI hardening checklist

- [ ] Secrets are env-vars at job time, not echoed.
- [ ] PRs from forks **don't** get secrets (default in GitHub Actions — keep it that way).
- [ ] Trace artifacts uploaded? Strip Authorization headers first (`playwright.config.ts` `httpCredentials`/`extraHTTPHeaders` filter).
- [ ] Reports embedded in PR comments don't leak request bodies.
- [ ] Rotation: who rotates `STAGING_API_TOKEN`, on what schedule? Calendar-ise it.

---

## 6. Common mistakes

1. **`.env` in the README example with real values.** Replace with `xxxxxxxx`.
2. **Storing prod tokens in staging GH secrets** — instant cross-env contamination.
3. **Hardcoding tokens in `playwright.config.ts` as "just for now."** No such thing.
4. **Using one personal token for everyone**'s local dev — when that person leaves, everything breaks at once.
5. **Logging the full `request.post` payload** in your APIUtils — if payload contains a token, it's now in CI logs.

---

## 7. Senior SDET perspective

You don't need to be a security engineer to do this well. You need to make secret-handling **boring and consistent**. The hardest secrets bugs are the ones a tired engineer creates at 6 pm by pasting a token into Slack to debug something.

---

## 8. DevSecOps progression

| You're here | Next step |
|---|---|
| `.env` gitignored, GH secrets in CI | Adopt Doppler / Vault for shared envs |
| Doppler / Vault wired | Migrate CI to short-lived OIDC tokens (GitHub Actions ↔ AWS, no static credentials) |
| OIDC | Add per-env IAM scoping — staging tokens can't read prod |

That progression is the SDET → DevSecOps career path for the security layer.

---

## 9. Exercise

1. Run `gitleaks detect --source=.` on the whole repo. Note any findings.
2. Add a `.gitleaksignore` for any false positives (not real ones).
3. Add the `gitleaks` pre-commit hook to [`framework/`](../framework/).
4. Try to commit a fake `AKIA1234567890ABCDEF`. It should be blocked.
5. Add `describeForLog` to your `env.loader.ts` and use it in any failure-path logging.
