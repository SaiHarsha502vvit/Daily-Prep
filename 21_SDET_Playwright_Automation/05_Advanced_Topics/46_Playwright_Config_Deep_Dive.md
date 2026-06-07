# 46. Playwright Configuration — Formal Semantics & Merge Algebra

**Navigation**: [← Previous: AI Agents & MCP](./45_AI_Agents_MCP_And_Playwright.md) | [Index](../../00_MASTER_INDEX.md) | [Next: File Uploads & Downloads →](./47_File_Uploads_Downloads_Media.md)

**Cross-links:**
- [`Ch09: Parallel Execution & Workers`](../02_Core_Architecture/09_Parallel_Execution_Workers.md) — Worker model, `workers`, `fullyParallel` (conceptual foundations)
- [`Ch25: CI/CD Integration`](./25_CICD_Integration_GitHub_Azure.md) — GitHub Actions YAML, sharding, secrets
- [`Ch26: Flakiness Diagnosis`](./26_Flakiness_Diagnosis_and_Fixing.md) — `retries`, `trace` as flakiness-debugging tools
- [`Ch16: StorageState Chaining`](../03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md) — Auth state persistence in config

---

## 5W1H — Why This Chapter?

- **WHAT**: The formal semantics of Playwright's configuration layer — the merge precedence rules, the type-level invariants, and the decision algebra for choosing values at each level.
- **WHY**: Playwright's config is not a flat key-value file. It is a **layered configuration algebra** where values from defaults, config file, and CLI flags interact via well-defined merge rules. Misunderstanding these rules causes silent misconfiguration (e.g., a project `use:` overriding a top-level `timeout` unexpectedly).
- **WHO**: SDETs who can copy a starter config but need to DESIGN one — choosing field values based on first principles rather than Stack Overflow snippets.
- **WHEN**: After writing 10+ tests and before deploying to CI. You need battle scars to appreciate why the defaults are wrong.
- **HOW**: By defining the configuration as a typed lattice, showing the merge operator `⊔` (join) at each layer, and proving why certain anti-patterns are unsound.

---

## 1. The Configuration Lattice

Playwright's effective configuration `C_eff` is computed as a join over three layers:

```
C_eff = C_defaults ⊔ C_user ⊔ C_CLI
```

Where `⊔` (join) is the **right-biased merge**: if a key exists in layer `i+1`, it **overwrites** the value from layer `i`.

| Layer | Source | Mutability | Priority |
|---|---|---|---|
| `C_defaults` | Playwright source code | Immutable | Lowest |
| `C_user` | `playwright.config.ts` | Mutable by user | Middle |
| `C_CLI` | CLI flags (`--workers=6`) | Per-invocation | Highest |

**Corollary 46.1 (CLI Supremacy).** *Any CLI flag overrides the config file. The config file overrides defaults. This is total and transitive.*

This is standard in test frameworks (pytest, Jest) but Playwright adds a **fourth implicit layer**: the `use` object inside each `project`.

---

## 2. The `projects[]` Matrix — A Formal Definition

Playwright's `projects` array defines a **Cartesian product** of test execution environments:

$$
\text{Project}_i = \langle \text{name}_i, \text{use}_i, \text{deps}_i \rangle
$$

Where:
- `name_i` is the identifier for reporting and filtering
- `use_i` is a `Partial<UseOptions>` override of the top-level `use`
- `deps_i` is a directed acyclic graph (DAG) of project dependencies

### 2.1 `use_i` As a Right-Biased Shallow Merge

```typescript
// Definition 46.1 — Effective UseOptions for Project i
effective_use_i = { ...top_level_use, ...project_i.use }
```

**Important:** This is a **shallow** merge. Nested objects (e.g., `viewport: { width, height }`) are replaced **wholesale**, not deep-merged.

```typescript
// Example of shallow-merge semantics
top_level_use = {
  viewport: { width: 1280, height: 720 },
  trace: 'on',
}

project_i.use = {
  viewport: { width: 1920 },  // ❌ height is LOST, not inherited
  headless: false,
}

// Result:
effective_use_i = {
  viewport: { width: 1920 },   // height is UNDEFINED
  trace: 'on',
  headless: false,
}
```

**Theorem 46.1 (Shallow Merge Invariant).** *Let `U_t` be the top-level `use` and `U_p` be a project `use`. For any nested key `k` at depth `d ≥ 2`, `U_p[k]` replaces `U_t[k]` entirely. No recursive merge occurs.*

*Proof.* Playwright's internal implementation uses `Object.assign({}, topLevelUse, projectUse)`. `Object.assign` performs property-by-property enumeration with last-write-wins. It does not recurse. ∎

### 2.2 The Device Emulation `...devices[]` Spread

```typescript
projects: [
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] },
  },
]
```

The `devices['Pixel 5']` object is a pre-computed `UseOptions` fragment:

```typescript
// devices['Pixel 5'] (abridged)
{
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)...',
  viewport: { width: 393, height: 851 },
  deviceScaleFactor: 2.75,
  isMobile: true,
  hasTouch: true,
}
```

**What `isMobile` does NOT do** (a common misconception):
- It does NOT emulate CPU throttling
- It does NOT emulate network conditions (use CDP for that, Ch37/46)
- It does NOT run a real mobile browser (that's device farm via BrowserStack)

---

## 3. The Dependency DAG — `projects[].dependencies`

Since Playwright 1.31, `globalSetup` is no longer the only way to run setup code. The `dependencies` array defines a **directed acyclic graph (DAG)** whose topological sort determines execution order.

```
   setup
     │
     ▼
   auth-setup
   │        │
   ▼        ▼
chrome      firefox
   │        │
   ▼        ▼
  e2e ──── e2e
```

### Formal Properties of the Dependency DAG

1. **Acyclicity:** Playwright throws if a cycle is detected (e.g., `a` depends on `b`, `b` depends on `a`)
2. **Transitive closure:** If `e2e` depends on `auth-setup`, and `auth-setup` depends on `setup`, then `e2e` implicitly waits for BOTH
3. **Sharding compatibility:** Dependencies are resolved PER SHARD. If shard 2 runs `e2e`, it still waits for `setup` and `auth-setup` on shard 2

### Why `dependencies` Is Preferred Over `globalSetup`

| Property | `globalSetup` | `dependencies` |
|---|---|---|
| Visibility in report | No | Yes (appears as a project) |
| Per-project setup | No | Yes |
| Failure isolation | Global failure | Per-dependency failure |
| Retries | None | Yes (if flaky setup) |
| Sharding | Complex | Native |

**Decision Rule:** Use `globalSetup` ONLY for operations that are strictly global and idempotent (e.g., one-time DB migration). Use `dependencies` for anything test-suite-shaped.

---

## 4. The Reporter Algebra

Playwright's `reporter` field accepts an array of tuples, each producing an independent output stream:

```typescript
reporter: [
  ['html', { outputFolder: 'playwright-report' }],
  ['json', { outputFile: 'test-results/report.json' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
]
```

### Reporter Selection as a Decision Tree

```
Is this CI?
├── YES → Need machine-readable output
│   ├── GitHub Actions → 'github' (annotations) + 'json' (artifacts)
│   ├── Azure DevOps   → 'junit' (Test Results tab) + 'html' (artifacts)
│   ├── Jenkins        → 'junit' + custom dashboard reporter
│   └── Generic        → 'json' + 'list' (human-readable logs)
└── NO  → Developer debugging
    ├── Interactive    → 'html' (open in browser)
    └── TTY            → 'list' (default, colourful)
```

### The `'list'` Reporter Quirk

The `'list'` reporter is the **default** when no reporter is specified. It prints one line per test to stdout. In CI with 500+ tests, this creates log noise. The `'dot'` reporter is the compact alternative:

```typescript
reporter: [
  'dot',     // One character per test: . = pass, F = fail, s = skip
]
```

---

## 5. Anti-Patterns as Type-Safety Violations

The `defineConfig()` function uses TypeScript's excess property checking. Several anti-patterns are caught at compile time, but others are silent runtime errors.

### Anti-Pattern A: `workers: 0`

```typescript
// ❌ Compile-time error in Playwright 1.40+
workers: 0
```

**Explanation:** `workers` must be a positive integer or `undefined` (auto-detect). `0` is rejected because it creates a division-by-zero in the test scheduler.

### Anti-Pattern B: `timeout` in `use` (Wrong Level)

```typescript
// ❌ Silent mistake — timeout is NOT a per-test use option
use: { timeout: 60_000 }

// ✅ Correct — timeout is a TOP-LEVEL config field
export default defineConfig({
  timeout: 60_000,  // ← here
  use: { ... },
});
```

**The TypeScript error (if detected):** `Object literal may only specify known properties, and 'timeout' does not exist in type 'UseOptions'`.

### Anti-Pattern C: `trace: 'on'` in CI

```typescript
// ❌ 500 tests × 2MB trace ≈ 1GB per CI run
trace: 'on'

// ✅ Correct — only trace retries and failures
trace: process.env.CI ? 'on-first-retry' : 'on'
```

### Anti-Pattern D: `storageState` Path Without Preceding `globalSetup`

```typescript
// ❌ Every test fails with "storageState file does not exist"
use: { storageState: 'playwright/.auth/state.json' }
// But no globalSetup or setup project wrote that file.
```

---

## 6. The Pareto Frontier — Config Optimisation

Not every config field is equally important. The following table shows which fields affect which quality attributes:

| Field | Speed | Reliability | Debuggability | Cost |
|---|---|---|---|---|
| `workers` | ★★★ | ★☆☆ | ☆☆☆ | ★☆☆ |
| `fullyParallel` | ★★★ | ★☆☆ | ☆☆☆ | ☆☆☆ |
| `timeout` | ★☆☆ | ★★★ | ☆☆☆ | ☆☆☆ |
| `retries` | ☆☆☆ | ★★★ | ☆☆☆ | ★★☆ |
| `maxFailures` | ☆☆☆ | ★★☆ | ☆☆☆ | ☆☆☆ |
| `trace` | ☆☆☆ | ☆☆☆ | ★★★ | ★★★ |
| `video` | ☆☆☆ | ☆☆☆ | ★★★ | ★★★ |
| `screenshot` | ☆☆☆ | ☆☆☆ | ★★☆ | ★☆☆ |
| `reporter` | ☆☆☆ | ☆☆☆ | ★★☆ | ☆☆☆ |

**Interpretation:** If your CI budget is constrained, disable `video` and use `trace: 'on-first-retry'` only. If your suite is unreliable, invest in `retries` and `timeout` before adding more `workers`.

---

## 7. Axioms of Good Configuration

1. **The Environment-Axiom:** Every top-level scalar field should be conditioned on `process.env.CI`. CI and local execution have different optimal values for `trace`, `video`, `workers`, and `headless`.

2. **The Single-Source Axiom:** `storageState` paths, `baseURL`, and API endpoints should each appear exactly once in the config. Use variables, not string literals.

3. **The Idempotency Axiom:** `globalSetup` and `projects[].dependencies` should be safe to run multiple times. The second run should be a no-op (or fast-path).

4. **The Observability Axiom:** Every CI run should produce at least one machine-readable artifact (`json` or `junit`) and one human-readable artifact (`html`).

---

## Quick Reference — Production Config Checklist

```typescript
export default defineConfig({
  // Parallelism
  workers: process.env.CI ? 4 : undefined,
  fullyParallel: true,

  // Time budgets
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: { timeout: 10_000 },

  // Reliability
  retries: process.env.CI ? 2 : 0,
  maxFailures: process.env.CI ? 10 : undefined,

  // Debuggability
  trace: process.env.CI ? 'on-first-retry' : 'on',
  video: process.env.CI ? 'retain-on-failure' : 'off',
  screenshot: 'only-on-failure',

  // Output
  reporter: [
    ['list'],                                    // CI logs
    ['html', { open: 'never' }],                 // Human report
    ['json', { outputFile: 'test-results/report.json' }],  // Machine report
  ],
});
```

---

## Navigation

**Previous:** [← AI Agents & MCP](./45_AI_Agents_MCP_And_Playwright.md)
**Next:** [File Uploads & Downloads →](./47_File_Uploads_Downloads_Media.md)
