# 66. Data Anonymization & PII Masking

 [← 65. ADRs & Test Strategy](./65_Architecture_Decision_Records.md) | [Index](../00_INDEX.md) | [→ 67. Test Impact Analysis](./67_Test_Impact_Analysis.md)

---

## 5W1H

| Question | Answer |
|----------|--------|
| **What** | Data anonymization and PII masking are practices that remove or obfuscate personally identifiable information from test datasets so that QA environments do not expose real customer data to engineers, contractors, or automated systems. |
| **Why** | GDPR, CCPA, HIPAA, and SOC 2 impose strict liability for data breaches, even in non-production environments. Using real PII in tests is a compliance violation and a trust-destroying incident waiting to happen. |
| **Who** | SDETs, test data engineers, data platform teams, security engineers, DevOps, and compliance officers all have a stake in how test data is managed. |
| **Where** | In staging databases, seed scripts, synthetic data factories, API mocks, log aggregators, screenshot archives, and CI artifact stores. |
| **When** | Before any test data is created or copied from production; whenever a new regulation takes effect; after every data breach drill; and during every production data refresh cycle. |
| **How** | By applying masking, substitution, suppression, pseudonymization, and generalization techniques; by generating synthetic data at scale with factories; and by enforcing tenant isolation, retention policies, and automated scanning. |

---

## Table of Contents

1. [Why Data Privacy Matters in Testing](#1-why-data-privacy-matters-in-testing)
2. [PII Categories in Typical Test Data](#2-pii-categories-in-typical-test-data)
3. [Anonymization Techniques](#3-anonymization-techniques)
4. [Synthetic Data Generation at Scale](#4-synthetic-data-generation-at-scale)
5. [Multi-Tenant Test Data Isolation Patterns](#5-multi-tenant-test-data-isolation-patterns)
6. [Data Versioning and Branching](#6-data-versioning-and-branching)
7. [The Framework's File-Locked Account Pool](#7-the-frameworks-file-locked-account-pool)
8. [Compliance Checklists for Test Data](#8-compliance-checklists-for-test-data)
9. [Anti-Patterns](#9-anti-patterns)
10. [Decision Matrix](#10-decision-matrix-anonymize-vs-synthesize-vs-subset)
11. [Senior/Principal Perspective](#11-seniorprincipal-perspective)
12. [DevSecOps Seed](#12-devsecops-seed)
13. [Exercise](#13-exercise)

---

## 1. Why Data Privacy Matters in Testing

### 1.1 Regulatory Landscape

Testing environments are not exempt from data privacy laws. In fact, regulators increasingly scrutinize non-production systems because they are historically undersecured.

**GDPR (EU)**: Article 32 mandates "appropriate technical and organisational measures" including pseudonymization and encryption. Article 5(1)(b) limits data processing to what is necessary — running a full regression suite against a production clone arguably exceeds necessity unless anonymized.

**CCPA/CPRA (California)**: Section 1798.140(v) defines personal information broadly, including inferences drawn from data. Test environments that retain browsing patterns, purchase histories, or behavioral profiles from production dumps fall under this scope.

**HIPAA (US Healthcare)**: The Safe Harbor method specifies 18 identifiers that must be removed for de-identification. Any healthcare test data must strip or mask these identifiers before use in QA.

**SOC 2 Type II**: Trust Service Criteria for Confidentiality and Privacy require documented controls over data access. Auditors routinely ask for evidence that test data does not contain unmasked production PII.

### 1.2 Breach Liability

The average cost of a data breach in 2024 exceeded $4.8M globally, with regulated industries facing fines up to 4% of annual revenue under GDPR. The reputational damage is harder to quantify but often exceeds direct fines. Test environments are frequent attack vectors because they:

- Run on less hardened infrastructure than production.
- Are accessible to a broader set of employees and contractors.
- Often lack monitoring, alerting, and incident response playbooks.
- Receive less security patching attention.

A leak of 10,000 unmasked customer records from a staging database is legally indistinguishable from a production breach in many jurisdictions.

### 1.3 Customer Trust

Enterprise customers increasingly require proof of data handling practices during procurement. If your SOC 2 audit reveals that engineers have direct access to real customer PII in test environments, deals can stall or fail. The trust equation is simple: testing with real data is a liability. Testing with properly anonymized or synthetic data is an asset.

---

## 2. PII Categories in Typical Test Data

Before you can protect data, you must classify it. The following table maps common PII categories to their risk levels, typical test data sources, and recommended handling strategies.

| Category | Examples | Risk Level | Typical Source | Recommended Strategy |
|----------|----------|------------|---------------|---------------------|
| **Direct Identifiers** | Full name, email, SSN, passport number, national ID | Critical | Production dumps, CRM exports | Substitute with synthetic or mask |
| **Contact Info** | Phone number, physical address, postal code | High | User profile tables | Mask or generalize |
| **Financial Data** | Credit card numbers, bank account, IBAN | Critical | Payment tables | Substitute with test PANs, suppress actuals |
| **Biometric / Health** | DOB, medical record number, fingerprints | Critical | EHR systems | Generalize DOB to age range, substitute MRNs |
| **Online Identifiers** | IP address, cookie IDs, device fingerprint | Medium-High | Analytics tables | Hash or pseudonymize |
| **Behavioral Data** | Purchase history, clickstream, chat logs | Medium | Event stores | Aggregate or suppress |
| **Employment Data** | Employee ID, salary, manager name | High | HR systems | Substitute with fake values |
| **Geolocation** | GPS coordinates, precise address | Medium | Mobile app data | Generalize to city or region |

### 2.1 The Composite Risk

Individual fields may seem low-risk in isolation. A masked email may feel safe. But combining a birth date, ZIP code, and gender uniquely identifies 87% of the US population. This is the re-identification attack vector: adversaries cross-reference anonymized test data against public records to reconstruct identities. Effective anonymization must consider the dataset as a whole, not field-by-field.

---

## 3. Anonymization Techniques

### 3.1 Masking (Partial Obfuscation)

Masking replaces a portion of sensitive data with a fixed character, typically `*` or `X`. The goal is to preserve structure and readability while hiding the sensitive payload.

- Email: `john.smith@example.com` → `j****@e*****.com`
- Credit card: `4532-1234-5678-9012` → `4532-****-****-9012`
- SSN: `123-45-6789` → `***-**-6789`

Masking is fast, reversible in the sense that the original length is preserved, and useful for display-layer validation. It is not suitable when the masked portion is small enough to brute-force (e.g., a 3-digit CVV masked as `**2`).

### 3.2 Substitution (Fake but Realistic)

Substitution replaces real values with fabricated ones drawn from a lookup table or a generator. The substituted values maintain realistic statistical properties: a fake email belongs to a realistic domain, a fake address has a valid postal code, a fake SSN passes the checksum algorithm.

This is the gold standard for test data because it preserves referential integrity, allows realistic filtering and sorting, and eliminates re-identification risk entirely.

### 3.3 Suppression (Redaction)

Suppression removes the field entirely or replaces it with a null/placeholder value. Use suppression when the field is not needed for the test scenario.

- Chat message content: `[REDACTED]`
- Salary: `null`
- Phone number: `[WITHHELD]`

Suppression is safe but degrades test realism. A test that asserts on chat message rendering will fail if every message is `[REDACTED]`. Use selectively.

### 3.4 Pseudonymization (Reversible Mapping)

Pseudonymization replaces identifiers with artificial identifiers (pseudonyms) while maintaining a mapping table. The mapping is stored securely, separate from the test data, under access control.

- Patient ID `PT-48291` → `PS-7A3F2E9D` (key stored in KMS)
- Email `alice@corp.com` → hash `a3f7...` with salt in HSM

Pseudonymization enables longitudinal testing: a test that spans multiple sessions can track the same pseudonymous user. The risk is that the mapping table becomes a single point of failure. If compromised, re-identification is trivial.

### 3.5 Generalization (Reducing Precision)

Generalization trades precision for privacy by replacing specific values with broader categories.

- DOB `1985-03-14` → age bracket `35-39`
- Salary `$87,500` → salary band `$80K-$90K`
- GPS `40.7128, -74.0060` → city `New York, NY`

Generalization is especially useful for analytics and reporting tests where exact values are less important than distributions. K-anonymity models use generalization to ensure each record is indistinguishable from at least `k-1` other records.

### 3.6 Technique Selection Flowchart

```
Does the test need realistic values for this field?
    No  → Suppress / Redact
    Yes → Is referential integrity required across records?
              No  → Mask (if display only) or Generalize
              Yes → Is longitudinal tracking needed?
                        No  → Substitute with synthetic
                        Yes → Pseudonymize with secure mapping
```

---

## 4. Synthetic Data Generation at Scale

### 4.1 The Factory Pattern

Modern test frameworks use factory functions to generate entities on demand. A factory is not a fixture file with 50 hardcoded rows. It is a programmatic generator that produces unique, realistic, and relationship-aware records every time it is called.

### 4.2 TypeScript Factory Example

```typescript
// factories/employee.factory.ts
import { faker } from '@faker-js/faker';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  ssn: string;
  dateOfBirth: Date;
  departmentId: string;
  role: 'ENGINEER' | 'MANAGER' | 'DIRECTOR' | 'ANALYST';
  salaryBand: 1 | 2 | 3 | 4 | 5;
  startDate: Date;
  isActive: boolean;
}

const DEPARTMENTS = ['ENG', 'PROD', 'DESIGN', 'SALES', 'HR', 'LEGAL'];
const ROLES: Employee['role'][] = ['ENGINEER', 'MANAGER', 'DIRECTOR', 'ANALYST'];

// Luhn-algorithm test SSN generator — structurally valid but not real
function generateFakeSSN(): string {
  const area = faker.number.int({ min: 1, max: 899 });
  const group = faker.number.int({ min: 1, max: 99 });
  const serial = faker.number.int({ min: 1, max: 9999 });
  return `${String(area).padStart(3, '0')}-${String(group).padStart(2, '0')}-${String(serial).padStart(4, '0')}`;
}

export function createEmployee(overrides: Partial<Employee> = {}): Employee {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const departmentId = faker.helpers.arrayElement(DEPARTMENTS);

  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    email: overrides.email ?? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${faker.internet.domainWord()}.com`,
    ssn: generateFakeSSN(),
    dateOfBirth: faker.date.birthdate({ min: 22, max: 65, mode: 'age' }),
    departmentId,
    role: faker.helpers.arrayElement(ROLES),
    salaryBand: faker.helpers.arrayElement([1, 2, 3, 4, 5]) as Employee['salaryBand'],
    startDate: faker.date.past({ years: 10 }),
    isActive: faker.datatype.boolean({ probability: 0.85 }),
    ...overrides,
  };
}

export function createEmployees(count: number, overrides: Partial<Employee> = {}): Employee[] {
  return Array.from({ length: count }, () => createEmployee(overrides));
}
```

### 4.3 Factory Design Principles

1. **Deterministic seeding**: Accept a seed parameter so failures are reproducible.
2. **Override support**: Allow `overrides` for every field so tests can inject edge cases.
3. **Relationship awareness**: Generate related entities in a single call (e.g., employee + department + manager).
4. **Uniqueness guarantees**: Use UUIDs or seeded counters so bulk generation never collides.
5. **Structural validity**: Fake SSNs should pass format validation, fake emails should be RFC-compliant.
6. **No real data leakage**: Factories must never reference production dumps, real names, or actual customer records.

### 4.4 Seeding the Test Database in CI

Factories are only useful if the CI pipeline can execute them. A common pattern is a `db:seed` script that runs before the test suite:

```typescript
// scripts/seed-test-db.ts
import { createEmployees } from '../factories/employee.factory';
import { db } from '../lib/database';

async function seed() {
  const employees = createEmployees(100);
  await db.insert(employees).into('employees');
  console.log(`Seeded ${employees.length} employees`);
}

seed().catch(console.error);
```

Run this in CI before Playwright starts, or use Playwright's `globalSetup`:

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: require.resolve('./scripts/seed-test-db.ts'),
});
```

---

## 5. Multi-Tenant Test Data Isolation Patterns

When testing SaaS platforms, test data must be scoped to a tenant so that tests for Tenant A never see or mutate data belonging to Tenant B.

### 5.1 Database-Per-Tenant

Each tenant receives its own database instance or schema. Test runs spin up a tenant-scoped database, run migrations, seed data, execute tests, and tear down.

```sql
-- database-per-tenant: a dedicated DB per test tenant
CREATE DATABASE tenant_test_a7f3;
\c tenant_test_a7f3;
CREATE TABLE employees (...);
INSERT INTO employees (...) VALUES (...);
-- tests run here
DROP DATABASE tenant_test_a7f3;
```

**Pros**: Strongest isolation, easiest compliance (drop the DB and the data is gone), simple backups.
**Cons**: Connection pooling is harder, schema migrations run N times, CI resource costs scale with tenant count.

### 5.2 Schema-Per-Tenant

A single database contains multiple schemas, one per tenant. Shared application tables and tenant-specific tables coexist without cross-tenant leakage.

```sql
-- schema-per-tenant
CREATE SCHEMA tenant_a7f3;
CREATE TABLE tenant_a7f3.employees (...);
CREATE INDEX idx_tenant_a7f3_employees_dept ON tenant_a7f3.employees(department_id);

CREATE SCHEMA tenant_b2e9;
CREATE TABLE tenant_b2e9.employees (...);

-- application queries prepend the schema automatically
SELECT * FROM tenant_a7f3.employees WHERE is_active = true;
```

**Pros**: Better resource utilization than DB-per-tenant, still strong isolation at the SQL layer.
**Cons**: Schema proliferation complicates backups, some ORMs struggle with dynamic schema resolution, migration scripts must be tenant-aware.

### 5.3 Shared Schema with `tenant_id`

All tenants share tables, and every row carries a `tenant_id` column. Row-level security (RLS) or query predicates enforce isolation.

```sql
-- shared schema with tenant_id
CREATE TABLE employees (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(32) NOT NULL,
    first_name VARCHAR(255),
    -- ...
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- crucial: always filter by tenant_id
CREATE INDEX idx_employees_tenant ON employees(tenant_id);

-- row-level security policy
CREATE POLICY tenant_isolation ON employees
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id')::VARCHAR);

-- test queries
SET app.current_tenant_id = 'a7f3';
SELECT * FROM employees;  -- only sees a7f3 rows
```

**Pros**: Easiest for small tenant counts, simplest migration story, lowest infrastructure cost.
**Cons**: Risk of cross-tenant data leakage if a query omits the `tenant_id`, harder to delete a single tenant's data, audit complexity.

### 5.4 Choosing a Pattern

| Factor | DB-Per-Tenant | Schema-Per-Tenant | Shared Schema |
|--------|---------------|-------------------|---------------|
| Isolation strength | Maximum | High | Medium |
| Operational cost | High | Medium | Low |
| Tenant onboarding speed | Slow (DB creation) | Medium (schema creation) | Fast (row insertion) |
| Migration complexity | N databases | N schemas | Single migration |
| Compliance (tenant deletion) | Drop DB | Drop schema | Delete rows |
| CI parallelism | Less (connection limits) | Moderate | Best |

For test environments, schema-per-tenant often hits the sweet spot: strong enough isolation for most test scenarios without the DB connection overhead.

---

## 6. Data Versioning and Branching

### 6.1 The Problem

Code and data schemas evolve at different speeds. A feature branch adds a `middle_name` column, but the test data seeder on `main` still omits it. Developers running tests on the feature branch encounter schema mismatch errors that waste debugging time.

### 6.2 Schema-Aware Seed Branches

Treat seed scripts as code. Store them in the same repository, in the same branch model, with the same review process.

```
main/
  src/
  seeds/
    v1/
      001_create_employees.sql
      002_seed_baseline_data.sql
    v2/
      003_add_middle_name.sql
      004_migrate_existing_names.sql

feature/add-managers/
  seeds/
    v2.1/
      005_add_manager_id.sql
      006_seed_manager_relationships.sql
```

The test runner determines the target schema version from the branch and applies migrations accordingly.

### 6.3 Data Snapshots for CI

Instead of re-running seed scripts from scratch (which may take minutes), create a golden snapshot per schema version. The CI pipeline:

1. Restores the snapshot into a temporary database.
2. Runs the test suite.
3. Drops the temporary database.

Snapshots are built nightly from `main` and cached. Feature branches that diverge from the snapshot schema version fall back to incremental migrations.

```bash
# CI pipeline snapshot restore
pg_restore --clean --if-exists \
  --dbname=postgres://testuser@localhost/${CI_JOB_ID} \
  snapshots/v2.3-baseline.dump
```

### 6.4 Detecting Schema Drift in CI

When a feature branch adds a migration that `main` lacks, the snapshot restore will fail with a schema mismatch. Detect this early with a schema-hash check:

```bash
# generate a hash of all .sql migration files
SCHEMA_HASH=$(find seeds/ -name "*.sql" | sort | xargs cat | sha256sum | cut -d' ' -f1)
# compare against the snapshot manifest
if [ "$SCHEMA_HASH" != "$(cat snapshots/v2.3-baseline.hash)" ]; then
  echo "Schema drift detected; running migrations from scratch"
  npx ts-node scripts/run-migrations.ts
fi
```

---

## 7. The Framework's File-Locked Account Pool

Many test frameworks use a shared pool of pre-provisioned test accounts rather than creating accounts on the fly. The danger is that two parallel test workers claim the same account, leading to race conditions and flaky failures.

### 7.1 File-Lock Semantics

A file-locked account pool stores account credentials in JSON files, one per account. When a worker needs an account, it acquires an exclusive lock on an available file. When the test completes — or if it fails and fails to release — a timeout or a post-job cleanup script unlocks the file.

```typescript
// account-pool/acquirer.ts
import { lock } from 'proper-lockfile';
import { readFile, writeFile } from 'fs/promises';
import glob from 'fast-glob';

interface Account {
  username: string;
  password: string;
  tenantId: string;
  lockedBy: string | null;
  lockedAt: string | null;
}

export async function acquireAccount(workerId: string, maxWaitMs = 30000): Promise<Account> {
  const files = await glob('account-pool/accounts/*.json');
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    for (const file of files) {
      try {
        const release = await lock(file, { retries: 0 });
        const raw = await readFile(file, 'utf8');
        const account: Account = JSON.parse(raw);

        if (account.lockedBy === null) {
          account.lockedBy = workerId;
          account.lockedAt = new Date().toISOString();
          await writeFile(file, JSON.stringify(account, null, 2));
          await release();
          return account; // success
        }

        await release(); // file was locked but account in use
      } catch {
        // couldn't lock this file, another worker holds it
        continue;
      }
    }
    await new Promise(r => setTimeout(r, 500));
  }

  throw new Error(`No available account within ${maxWaitMs}ms`);
}

export async function releaseAccount(workerId: string, username: string): Promise<void> {
  const file = `account-pool/accounts/${username}.json`;
  const release = await lock(file);
  const raw = await readFile(file, 'utf8');
  const account: Account = JSON.parse(raw);

  if (account.lockedBy === workerId) {
    account.lockedBy = null;
    account.lockedAt = null;
    await writeFile(file, JSON.stringify(account, null, 2));
  }

  await release();
}
```

### 7.2 Why This Is Canonical Isolation

The file-locked account pool enforces multi-tenant isolation at the framework layer:

- Each account is bound to a specific `tenantId`.
- Concurrent workers never share an account.
- Account files are version-controlled as infrastructure-as-code.
- A nightly cron job resets passwords and cleans stale locks.
- Compliance is trivial: the pool contains only synthetic data, and the files live inside the test repo where access is logged.

---

## 8. Compliance Checklists for Test Data

### 8.1 GDPR Article 32

| Requirement | Test Data Control |
|-------------|------------------|
| Pseudonymization | Apply before loading into non-prod |
| Encryption at rest | Encrypt test DB volumes and backups |
| Ongoing confidentiality | RBAC on test environments; no admin sharing |
| Ability to restore | Retain schema snapshots; do not retain PII snapshots |
| Testing and evaluating | Annual penetration test includes staging |

### 8.2 CCPA Section 1798.140

| Requirement | Test Data Control |
|-------------|------------------|
| Personal information definition | Inventory all test data sources |
| Service provider obligations | Ensure cloud CI provider is under DPA |
| Deletion rights | Automate test DB teardown post-run |
| Opt-out | Not applicable to test data, but document that no sale occurs |

### 8.3 SOC 2 Type II (Privacy & Confidentiality)

| Control | Evidence |
|---------|----------|
| CC6.1 — Logical access security | Terraform or IAM policies restricting test DB access |
| CC6.2 — Access removal | Offboarding runbook revokes test environment access |
| CC6.7 — Data transmission | TLS for all test DB connections |
| P1.1 — Privacy notice | Document in employee handbook that test data is synthetic |
| P2.1 — Choice and consent | Do not use production opt-in data for testing |

---

## 9. Anti-Patterns

### 9.1 Using Production Dumps Directly

Production dumps are convenient. They contain real edge cases, real volume, and real distributions. They also contain real PII, real secrets, and real relationships that you are legally obligated to protect. There is no safe way to use a production dump without a full anonymization pipeline. Convenience is not an excuse.

### 9.2 Hardcoding Real PII in Tests

A developer copies their own email into a registration test to verify that the confirmation message arrives. Six months later, that email is in a public gist, a screenshot archive, and a CI log. Every test fixture must be synthetic or masked.

### 9.3 Not Rotating Test Credentials

Test account passwords that never change become a persistent attack vector. If one credential leaks — via a screenshot, a log, or a compromised developer machine — the attacker has indefinite access. Implement a 30-day rotation policy for all shared test accounts.

### 9.4 Sharing Test Accounts Across Teams

When three squads share a single `qa-admin@company.com` account, attribution is impossible. You cannot tell which test failed, which person triggered a destructive action, or which team leaked the credential. Isolate accounts per team, per environment, and per pipeline.

### 9.5 No Data Retention Policy

Test data accumulates. Staging databases grow. Screenshot archives bloat. Log aggregators fill up. Without a documented retention policy and automated enforcement, you are stockpiling liability. Set a default TTL: test data lives for 7 days, logs for 30 days, screenshots for 14 days.

### 9.6 Ignoring Cross-Border Data Rules

A test database in `us-east-1` stores synthetic data. But the CI runner that seeds it reads a seed file from an EU developer's laptop. If that seed was derived from a production dump, you may have violated GDPR's data transfer rules. Know where your test data originates, transits, and rests.

### 9.7 Not Masking in Traces and Screenshots

Playwright screenshots capture the full DOM. An email address visible in a `<span>` on the confirmation page is forever archived in `test-results/`. Configure your test framework to mask known PII fields before capture, or redact screenshots in post-processing.

```typescript
// playwright.config.ts — mask PVI in traces
use: {
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  // Custom fixture: before screenshot, replace email spans with [MASKED]
},
```

### 9.8 Logging Test Data

`console.log(user.email)` inside a test helper seems harmless until that log is shipped to Datadog, stored for 90 days, and included in a support ticket. Never log PII at any log level. Use structured logging with a deny-list of PII keys.

---

## 10. Decision Matrix: Anonymize vs Synthesize vs Subset

| Decision Driver | Anonymize (Production Clone) | Synthesize (Factory) | Subset (Production Sample) |
|-----------------|------------------------------|----------------------|---------------------------|
| **Data realism** | Maximum (real distributions) | High (statistically similar) | Medium (sample may miss edge cases) |
| **Compliance risk** | Medium-High (residual re-identification risk) | Low (no real PII) | High (subset still contains real PII) |
| **Setup speed** | Slow (anonymization pipeline) | Fast (factories run in CI) | Medium (subset + mask pipeline) |
| **Volume flexibility** | Limited by production size | Unlimited (scale to millions) | Limited by production size |
| **Referential integrity** | Preserved natively | Must be modeled in factories | Preserved within sample |
| **Best for** | Acceptance testing on realistic data | Unit, integration, and most E2E tests | Load testing where real distributions matter |
| **Cost** | High (storage, pipeline maintenance) | Low (compute only) | Medium (storage + subset job) |

**Principal Verdict**: For most modern test suites, synthetic data via factories is the default. Reserve anonymized production clones for quarterly acceptance validation and regulated regression baselines. Never use un-masked subsets.

---

## 11. Senior/Principal Perspective: Data Governance as a Quality Practice

### 11.1 Quality Is Not Just Correctness

Junior engineers define quality as "the software works." Senior engineers define quality as "the software works, and we can prove it, and we can reproduce it, and we can do it without hurting anyone." Data governance is the fourth leg of that stool.

### 11.2 The SDET's Role in Data Governance

SDETs are uniquely positioned to enforce data hygiene because they control:

- **Seed scripts**: What goes into the database before tests run.
- **API mocks**: What fake backends return during test execution.
- **Test output**: Screenshots, traces, logs, and reports that may leak data.
- **CI configuration**: How long artifacts persist and who can access them.

A principal SDET should champion a test-data policy that is auditable, automated, and enforced in CI. If a PR adds a seed script referencing a production CSV, the build should fail.

### 11.3 Measuring Data Quality in Tests

- **Coverage**: What percentage of entity types have synthetic factories?
- **Freshness**: How recently were factories regenerated to reflect schema changes?
- **Isolation score**: What percentage of test runs use tenant-scoped data?
- **Leak detection**: How many PII hashes were found in last month's CI artifacts?

Track these metrics in a dashboard. Review them in sprint retrospectives. Treat data governance metrics with the same seriousness as test pass rates.

---

## 12. DevSecOps Seed: PII Scanning in Test Repos

 Secrets and PII leak into repositories through seed files, test fixtures, configuration dumps, and developer shortcuts. Automated scanning is the first line of defense.

### 12.1 gitleaks

`gitleaks` detects secrets in git history. Integrate it into pre-commit hooks and CI.

```yaml
# .github/workflows/scan.yml
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 12.2 truffleHog

`truffleHog` goes deeper, scanning commits and verifying leaked secrets against live APIs.

```bash
# scan the full history
trufflehog git file:///path/to/repo --since-commit=HEAD~100

# scan a specific branch in CI
trufflehog git \
  --branch=${{ github.ref_name }} \
  https://github.com/org/repo.git
```

### 12.3 GitHub Secret Scanning

Enable GitHub's native secret scanning for the repository. It catches API keys, tokens, and connection strings. Pair it with push protection to block commits that contain patterns matching known secret types.

### 12.4 Custom PII Patterns

Extend scanning with custom rules for domain-specific PII. A healthcare test repo should flag `MRN-` prefixes. A financial test repo should flag `IBAN:` patterns.

```toml
# .gitleaks.toml
[[rules]]
id = "test-ssn"
description = "Potential SSN in test data"
regex = '''\b\d{3}-\d{2}-\d{4}\b'''
[rules.allowlist]
paths = ['factories/employee.factory.ts']  # this file is allowed because SSNs are synthetic
```

### 12.5 The Pipeline Gate

No PR should merge if scanning fails. This is non-negotiable. The cost of a false positive (developer rewrites a fixture) is negligible compared to the cost of a true positive (real patient data shipped to a public repo).

---

## 13. Exercise

### Build a `data-factory` Module

Create a TypeScript module that generates 100 anonymized employee records with realistic but fake PII. The module must satisfy the following requirements:

1. **Entity Model**: Each employee has:
   - `id`: UUID
   - `firstName`, `lastName`: realistic names
   - `email`: RFC-compliant, derived from first/last name
   - `ssn`: structurally valid fake SSN (passes format regex)
   - `dateOfBirth`: Date, age 22-65
   - `departmentId`: one of 6 department codes
   - `role`: one of 4 roles
   - `salaryBand`: 1-5
   - `isActive`: boolean, 85% probability
   - `addresses`: array of 1-3 address objects (street, city, state, zip, country)

2. **Relationships**:
   - Each `departmentId` must reference a generated department.
   - Each employee may reference a `managerId` pointing to another employee.

3. **Export Formats**:
   - `toJSON()`: pretty-printed JSON array.
   - `toSQL()`: INSERT statements for `employees` and `addresses` tables.
   - `toCSV()`: flat CSV with one row per employee (addresses serialized as JSON string).

4. **Determinism**:
   - Accept a numeric seed. Two runs with the same seed produce identical output.

### Self-Grading Rubric

| Criterion | Acceptable | Good | Excellent |
|-----------|-----------|------|-----------|
| **Completeness** | Generates all 100 employees with all fields | Plus departments and manager relationships | Plus validations (email regex, SSN format, ZIP lookup) |
| **Realism** | Fake data looks plausible at a glance | Fake data passes real-world validators (ZIP exists, email domain resolves) | Statistical distributions match US demographics (age, state frequency) |
| **Code Quality** | Single file, readable | Factory pattern with separate modules for each entity | Full type safety, unit tests for each factory, 100% branch coverage on generators |
| **Determinism** | Same seed = same UUIDs | Same seed = same entire graph (including relationships) | Property-based tests verify determinism across 100 seeds |
| **Export Quality** | JSON and CSV export work | SQL export with foreign key ordering, CSV escapes commas/quotes | All exports streamed (not loaded into memory), handles 1M+ records |
| **Documentation** | README with usage example | README plus JSDoc on all public methods | Architecture Decision Record in `docs/adr/` explaining why faker vs. static fixtures |

**Scoring**:
- **25–30**: Excellent. This module could be published as an internal package.
- **19–24**: Good. Minor gaps in testing or realism.
- **13–18**: Acceptable. Functional but needs refactoring.
- **0–12**: Needs significant revision. Review Sections 3 and 4, then re-implement.

---

**Navigation**: [← 65. ADRs & Test Strategy](./65_Architecture_Decision_Records.md) | [Index](../00_INDEX.md) | [→ 67. Test Impact Analysis](./67_Test_Impact_Analysis.md)
