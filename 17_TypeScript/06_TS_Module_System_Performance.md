**Navigation**: [< Previous](05_TS_Decorators_Metaprogramming.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Series →](../18_CSS_Complete/01_CSS_Foundations.md)

**TypeScript Chapter 6/6** | [← Decorators](05_TS_Decorators_Metaprogramming.md) | [Index](../00_MASTER_INDEX.md) | [Next Series → CSS Foundations](../18_CSS_Complete/01_CSS_Foundations.md)

# TypeScript Module System & Performance — How TS Resolves, Builds, and Scales

## 5W1H — Why This Chapter?

WHAT: The mechanics of TypeScript module resolution, package export
strategies, compiler performance tuning, and the modern TS features that
affect how code is compiled and bundled at scale.

WHY: Knowing TypeScript syntax is not enough. When your project grows to
50 packages in a monorepo, with mixed CJS/ESM consumers, incremental builds,
and CI pipelines under 60-second budgets, the module system and compiler
flags become the difference between a fast dev loop and a broken one. These
are the "infrastructure" skills that separate production TS developers from
hobbyists.

WHO: TypeScript developers working on multi-package projects, library
authors publishing to npm, and anyone experiencing slow `tsc` times or
mysterious resolution errors.

WHEN: After understanding TypeScript types, generics, and decorators.
This chapter assumes you have a working tsconfig.json and have encountered
"Cannot find module" or "Circular dependency" errors.

HOW: By tracing WHY each resolution strategy, compiler flag, and
performance technique exists — understanding the root causes before the
syntax. Root causes reveal when to use each option and what breaks if
you get it wrong.

---

## 1. Module Resolution Strategies — Why So Many?

WHY: The JavaScript ecosystem spent a decade in chaos trying to reconcile
two module systems — CommonJS (require/module.exports, Node.js's original
choice) and ES Modules (import/export, the ECMAScript standard). TypeScript
had to support all of them without forcing users into a single correct
answer, because the ecosystem was split. Each resolution strategy exists
because the ecosystem shifted over time, and TypeScript needed to meet
projects exactly where they were.

### The Historical Arc

```
2010: Node.js launches with CommonJS (require/module.exports)
2012: TypeScript 0.9 adds module support for AMD/CommonJS
2015: ES Modules (import/export) standardized in ES6
2017-2020: Node.js adds ESM support behind --experimental-modules
2020: Node.js 14 adds stable ESM support, .mjs/.cjs extensions
2022: Node.js 16/18 fully ESM-healthy, package.json "type": "module"
TODAY: Bundlers (Vite, esbuild, Rollup) use their own resolvers
```

### `moduleResolution: "node"` — The Classic Resolver

WHAT: The original TypeScript module resolver, modeled after Node.js's
pre-ESM CommonJS resolution algorithm.

WHY IT EXISTS: TypeScript 1.x needed to resolve `require()` calls the same
way Node did — looking for `.js`, `.json`, and directories with `index.js`
inside `node_modules`. This was the dominant module system for years, so
"node" was the natural name.

HOW IT WORKS: For an import like `import { foo } from './utils'`, TypeScript
searches in this order:
1. `./utils.ts`
2. `./utils.tsx`
3. `./utils.d.ts`
4. `./utils/index.ts`
5. Up to parent directories, repeating for `node_modules`

CRITICAL LIMITATION: It does NOT respect the `exports` field in package.json
and does NOT understand `.js` extension rewriting (required for ESM). If you
publish an ESM package with `"type": "module"`, `node` resolution will find
the wrong file or fail silently.

```jsonc
// tsconfig.json — Node 12 and older ESM (deprecated)
{
  "compilerOptions": {
    "module": "CommonJS",           // Output format
    "moduleResolution": "node",      // Resolver: legacy
    "target": "ES2017",
    "esModuleInterop": true
  }
}
```

### `moduleResolution: "node16"` — Node.js 16+ ESM-Aware

WHY: Node.js 16 introduced stable ESM support, which required explicit `.js`
extensions in import paths. Imports like `import { foo } from './utils'`
silently resolved to `.js` in CJS but MUST include the extension in ESM.
TypeScript needed a resolver that matched this behavior exactly — including
the `.js` extension requirement and the `exports` field in package.json.

WHAT: A resolver that mimics Node.js 16's ESM resolution algorithm,
including:
- Respecting the `exports` field in package.json
- Requiring `.js` extensions in import paths (strict ESM compliance)
- Supporting conditional exports (different files for import vs require)

```jsonc
// tsconfig.json — Node.js 16+ with ESM
{
  "compilerOptions": {
    "module": "Node16",             // Generates require/import with proper extensions
    "moduleResolution": "node16",   // Node.js 16+ ESM-aware resolver
    "target": "ES2022",
    "strict": true
  }
}

// Source file: src/app.ts
import { helper } from './utils.js';   // .js REQUIRED in source (matches output extension)
import { pkg } from 'my-package';     // Respects my-package's exports field

// Output (compiled): same import paths (TypeScript doesn't rewrite extensions in Node16 mode)
```

### `moduleResolution: "nodeNext"` — The Current Node.js Resolver

WHY: Node.js development continues. `nodeNext` is a forward-looking resolver
that follows the latest Node.js ESM and CJS resolution rules, including
the `type` field in package.json. It is the superset that will remain
correct as Node.js evolves.

WHAT: The most permissive of the Node.js-style resolvers, designed for
current and future Node.js versions. It picks the correct resolution based
on the package's `type` field (module vs commonjs).

```jsonc
// tsconfig.json — For modern Node.js projects
{
  "compilerOptions": {
    "module": "NodeNext",           // Generates NodeNext-compatible output
    "moduleResolution": "nodeNext",  // Current + future Node.js resolver
    "target": "ES2022",
    "outDir": "./dist"
  }
}
```

### `moduleResolution: "bundler"` — Modern Bundler-Friendly

WHY: Vite, esbuild, Rollup, and Webpack all use their own resolution
algorithms optimized for speed and flexibility — they support:
- Extensionless imports (`import './utils'` instead of `./utils.ts`)
- Custom aliases (`@/components` → `./src/components`)
- Virtual modules
- File extensions in any order

TypeScript's node/bundler modes were too rigid for bundler workflows.
The `bundler` resolver was added to let TypeScript accept import paths
that bundlers accept, reducing the need for path aliases and extension
hacks.

WHAT: A resolver that allows extensionless imports, arbitrary file
extensions, and aligns with how Vite/esbuild resolve modules.

```jsonc
// tsconfig.json — Vite + React + TypeScript
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",  // Matches Vite/esbuild behavior
    "target": "ES2020",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]  // Still useful for IDE auto-complete, but bundler handles it too
    },
    "strict": true
  }
}
```

### Resolution Strategy Comparison

**The four `moduleResolution` strategies — what each supports and
which one you actually want:**

| Feature                          | `node` (legacy CJS) | `node16` / `nodenext` | `bundler`      |
|----------------------------------|---------------------|-----------------------|----------------|
| CommonJS `require`               | Yes                 | Yes                   | Yes            |
| ESM `import`                     | Yes                 | Yes                   | Yes            |
| Package `"exports"` field        | Ignored             | **Yes** (respected)   | Yes            |
| `.js` extension on relative imports | Optional         | **Required** for ESM  | Optional       |
| Extension-less imports (`./util`)| Yes                 | ESM: no; CJS: yes     | Yes            |
| `paths` / path aliases           | Yes                 | Yes                   | Yes            |
| Intended for                     | Old code paths      | Node 16+, dual publish| Vite, esbuild, Webpack, any real bundler |

**How to pick, one line each:**

- **`bundler`** — you have a bundler (Vite / esbuild / Webpack / Turbopack).
  This is what the vast majority of projects want. It matches how the
  bundler actually resolves, so `tsc` won't reject imports the bundler
  is fine with, and vice versa.
- **`node16`** or **`nodenext`** — you are shipping a Node package
  (library, CLI, server). These strictly follow Node's own ESM/CJS
  rules — including requiring the `.js` extension on relative ESM
  imports — so what compiles is what Node will actually load.
- **`node`** — legacy only. Doesn't respect the `"exports"` field,
  which means it silently accepts imports that will fail on modern
  Node. If you inherited it, plan the move to `bundler` or `node16`.

**Rule.** `moduleResolution` must match the tool that actually
resolves your imports at runtime (Node) or build time (your
bundler). Mismatch is the direct cause of "works on my machine, fails
in CI/prod" import errors.

---

🔬 **Section Challenge — 1. Module Resolution Strategies**

**Challenge 1 (Debug):** You migrate a large project from Webpack to Vite. The `tsconfig.json` uses `"moduleResolution": "node"` and `"module": "CommonJS"`. Vite builds fail with "Missing export 'x' in './utils'" and imports that worked before now break. Why, and what is the minimal change?

<details><summary>Answer</summary>

**Scenario:** Migrating a webpack project to Vite with incompatible module settings.
**Trace:** Vite uses a `bundler`-style resolver and native ESM. When Vite sees `import { x } from './utils'` in a CommonJS output file, it cannot resolve the re-export shape (CJS doesn't have named ESM exports). The `node` resolver does not respect the `exports` field in package.json, so if your dependencies use conditional exports (common in modern packages), TypeScript might resolve the wrong file — or an older CJS version when an ESM version exists.

**Debug sequence:**
1. `node` resolution silently finds the wrong file in `node_modules` if the package has an `exports` field that restricts access
2. Vite then encounters CJS-shaped exports that don't map to ESM named exports
3. The "Missing export" error is Vite's ESM resolver failing to find named exports in a CJS file

**Minimal fix:**
```jsonc
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

This tells TypeScript to emit ESM (Vite-native) and resolve paths the same way Vite does. If you need Node.js compatibility as well, consider `module: "NodeNext"` with `moduleResolution: "nodeNext"`.

</details>

---

## 2. The `exports` Field in package.json — Conditional Exports

WHY: Before the `exports` field existed (added in Node.js 12.16), packages
controlled which files were accessible via their directory structure. Any
file in the package was potentially importable — including internal files
that were never meant for public use. This caused widespread breakage when
package authors renamed or moved internal files. Conditional exports let
package authors define a **public API surface** and serve different files
to different consumers (CJS vs ESM, browser vs server, etc.).

### The Deep Import Problem

Without `exports`, a consumer could do:
```typescript
import { InternalHelper } from 'my-lib/src/utils/internal';  // ❌ Reaches private file
```

This breaks when you refactor `src/utils/internal.ts`. With `exports`:
```json
{
  "name": "my-lib",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",   // ESM consumers get ESM build
      "require": "./dist/cjs/index.js"   // CJS consumers get CJS build
    }
  }
}
```
Now `my-lib/src/utils/internal` is unreachable from outside the package.

### Conditional Exports — Dual CJS/ESM

WHAT: The `exports` field maps import paths to file locations, with
sub-conditions for different module systems.

```jsonc
// package.json — Dual CJS/ESM library
{
  "name": "my-ts-lib",
  "version": "1.0.0",
  "type": "module",              // Package defaults to ESM
  "main": "./dist/cjs/index.js", // Fallback for CJS consumers
  "exports": {
    ".": {
      // Node.js picks "import" or "require" based on package's own "type" field
      // AND the consuming project's settings
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"  // Always include types condition
    },
    "./utils": {
      "import": "./dist/esm/utils.js",
      "require": "./dist/cjs/utils.js",
      "types": "./dist/types/utils.d.ts"
    }
  },
  "types": "./dist/types/index.d.ts"  // Fallback for TS consumers without exports
}
```

### Why Ordering Matters in `exports`

WHY: Node.js resolves conditions **in order** — the first matching condition
wins. If you put `"default"` before specific conditions, the specific
conditions are unreachable.

```jsonc
// ❌ WRONG — default catches everything, node/import/require never used
{
  "exports": {
    ".": {
      "default": "./dist/default.js",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  }
}

// ✅ CORRECT — specific conditions first, default last (catch-all)
{
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts",
      "default": "./dist/default.js"   // Fallback for unknown conditions
    }
  }
}
```

### The `"types"` Condition — TypeScript's Escape Hatch

WHY: TypeScript reads the `exports` field in package.json (since TS 4.7)
to locate `.d.ts` files. Adding `"types": "./dist/types/index.d.ts"` as
the first condition ensures TS always finds the right types, even before
Node.js has picked a module condition.

```jsonc
// ✅ Recommended: types condition first
{
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",  // TypeScript checks this first
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  }
}
```

---

🔬 **Section Challenge — 2. The `exports` Field**

**Challenge 1 (Debug):** You publish a TypeScript library with conditional exports. TypeScript users report: "Module '"my-lib"' has no exported member 'createClient'". But the JS ESM and CJS builds work fine. You check your `.d.ts` file and it does export `createClient`. What is the likely cause?

<details><summary>Answer</summary>

**Scenario:** TypeScript can't find exported members despite correct JS exports.
**Trace:** The root cause is almost certainly that the `"types"` condition is
missing or incorrectly placed in the `exports` field. When TypeScript resolves
`import { createClient } from 'my-lib'`, it:

1. Reads the `exports` field in package.json
2. If `"types"` condition exists, uses that path for `.d.ts` lookup
3. If NO `"types"` condition, TypeScript falls back to `types` (main) field or
   root `.d.ts` files — which may point to an outdated or different location

If your `exports` field only specifies `import`/`require` conditions without
`types`, TypeScript might resolve the wrong `.d.ts` file — an older version,
an incorrect path, or a file that doesn't export the new `createClient`.

**Fix:**
```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",  // Add this FIRST
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  }
}
```

**Why types first?** Because TypeScript checks the `"types"` condition
regardless of whether the runtime resolves `"import"` or `"require"`. It
must come first so TypeScript uses it as the authoritative type location.

</details>

---

## 3. `isolatedModules` — Why Bundlers Require It

WHY: TypeScript's type checker (`tsc`) is a single-threaded, whole-program
analysis. It reads ALL files, builds a complete type graph, and resolves
every type reference across file boundaries before reporting any errors.
This is slow and memory-intensive. Bundlers (Vite, esbuild, Rollup) don't
use `tsc` for type-checking — they use their own transpilers that process
each file independently and in parallel. This is only possible if every
file is **completely self-describing** — no cross-file type information
required.

WHAT: `isolatedModules: true` enforces that each file can be transpiled
independently (without type information from other files). It is the flag
that makes your TypeScript code compatible with fast, parallel bundler
pipelines.

### What "Isolated" Means in Practice

```typescript
// ❌ BREAKS with isolatedModules: true
import type { User } from './models';

// This file has NO idea what User looks like at transpile time.
// The bundler can't figure out how to emit this import.
export { User };  // Re-export without type-only = emits runtime import
```

When the bundler processes this file, it sees `export { User }` and emits
`import { User } from './models'` in the output. But without cross-file
type info, it doesn't know that `User` is a type and should be erased.
`isolatedModules: true` catches this at compile time.

```typescript
// ✅ CORRECT
import type { User } from './models';
export type { User };  // type-only export = erased completely
```

### The `const enum` Problem

WHY: `const enum` values are inlined at compile time. For example,
`Direction.Up` becomes `0` directly in the output. This requires the
TypeScript compiler to resolve the enum value during transpilation — which
means reading the enum's definition file and substituting the literal.
With `isolatedModules`, the transpiler can't do this because it only sees
one file at a time.

```typescript
// ❌ BREAKS with isolatedModules: true
const enum Direction { Up = 0, Down = 1 }
function move(dir: Direction) { /* ... */ }
move(Direction.Up);  // Inlined as move(0) — requires enum resolution

// ✅ CORRECT (or use regular enum)
const enum Direction { Up = 0, Down = 1 }
// Only breaks if the enum VALUE is used at runtime
// Type-only usage is fine:
function check(dir: Direction): Direction { return dir; }
```

### Other `isolatedModules` Triggers

```typescript
// ❌ Re-exporting a value type (not a type alias):
import { SomeType } from './types';
export { SomeType }; // TS doesn't know SomeType is a type
// ✅
export type { SomeType };

// ❌ Namespace merges across files:
declare global {
  interface String { myExtension(): string; }
}
// This modifies the global scope — not isolated!

// ❌ Using module augmentation without the import side:
import './global-augment';  // Needed even if not using anything from it
```

### Why This Matters for Vite

WHY VITE USES IT: Vite's dev server uses esbuild to transpile TypeScript
to JavaScript in parallel across all files. esbuild runs each file through
the transpiler independently — it has no knowledge of other files. If your
code requires cross-file type information, esbuild either:
- Fails to transpile (correct behavior — `isolatedModules` catches this)
- Produces incorrect output (silent corruption — happens without the flag)

```jsonc
// vite.config.ts — Vite enables esbuild transpilation by default
// esbuild requires isolatedModules-compatible TypeScript

{
  "compilerOptions": {
    "isolatedModules": true,   // Always true for Vite projects
    // Type-checking runs separately via tsc --noEmit
    // Vite's hot-reload pipeline relies on this
  }
}
```

### The Two-Stage TypeScript Pipeline

```
Stage 1 (Fast, Per-File): esbuild / swc transpiler
├── Strips types from each file independently
├── Converts TS → JS (no type checking)
├── Runs in parallel across all files
└── Output: Plain JavaScript bundles

Stage 2 (Slow, Whole-Program): tsc --noEmit
├── Full type graph analysis
├── Cross-file type resolution
├── Reports type errors to the developer
└── Runs in CI and before shipping

isolatedModules: true ensures Stage 1 can run without Stage 2's context.
```

---

🔬 **Section Challenge — 3. `isolatedModules`**

**Challenge 1 (Debug):** You enable `isolatedModules: true` in a NestJS project and immediately get 47 errors: "Re-exporting a type alias or interface is not allowed by the IsolatedModules compiler option." All the errors come from a barrel file `index.ts` that does `export * from './types'`. Your colleague says "just disable `isolatedModules` — it works fine in production." Is this sound advice? Trace what actually happens.

<details><summary>Answer</summary>

**Scenario:** `isolatedModules` violations in a barrel export file.
**Trace:** When you write `export * from './types'`, TypeScript must resolve
what `*` refers to at the type level — it needs to know the exported names
from `./types`. With `isolatedModules: true`, the transpiler processing this
file in isolation can't look at `./types` to determine which exports are types
vs values. It defaults to assuming everything is a value — which would emit
a runtime import even for purely type exports.

**Is "just disable it" sound?** No — here's why:

1. **Vite/esbuild can't parallelize**: Without `isolatedModules`, the bundler
   can't safely transpile files independently. Your dev server gets slower.

2. **`export *` is the real problem**: `export *` is problematic even without
   `isolatedModules` because it re-exports EVERYTHING, including types that
   should be invisible. The right fix is to use explicit type re-exports.

3. **The production runtime is unaffected**: The CJS output still works in
   production regardless of `isolatedModules`. But your **build tooling is
   constrained** — you can't use the fastest transpilers, and incremental
   builds in monorepos break.

**Correct fix:**
```typescript
// ❌
export * from './types';  // Re-exports everything — types included

// ✅
export type { User, Order, Product } from './types';  // Only types
export { createClient, validateInput } from './utils';  // Values
```

This tells the transpiler explicitly what to export. `isolatedModules: true`
is not a punishment — it's a contract that makes your codebase compatible
with modern tooling.

</details>

---

## 4. Project References & Composite Builds — Monorepo at Scale

WHY: In a monorepo with 20 TypeScript packages, running `tsc` means
TypeScript builds a type graph spanning all 20 packages every time — even
if only one package changed. For large monorepos, this is catastrophic:
`tsc` takes 5 minutes when a single one-line change was made. Project
references solve this by making TypeScript aware of inter-package
boundaries, so it can skip packages that haven't changed.

### The Problem Without References

```
monorepo/
├── packages/
│   ├── shared/        (Package A: shared types)
│   ├── api/           (Package B: uses shared)
│   └── web/           (Package C: uses api + shared)
```

Without project references:
- `tsc` in `api/` must resolve types from `shared/` → builds both
- `tsc` in `web/` must resolve types from `api/` AND `shared/` → builds all three
- `tsc` at root builds all packages sequentially

With project references:
- `tsc --build` (or `tsc -b`) builds only changed packages
- Unchanged packages reuse their previous output (`.tsbuildinfo`)
- Type checking is parallelized across package boundaries

### `composite: true` — The Foundation

WHAT: In a TypeScript project reference setup, every project must declare
`"composite": true` in its tsconfig. This enables three things:
1. Generates a `.tsbuildinfo` file (incremental build cache)
2. Emits a `.d.ts` output file (required for downstream consumers)
3. Makes the project a valid reference target

```jsonc
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,         // Must be true for project references
    "declaration": true,       // Generate .d.ts files (required)
    "declarationMap": true,    // Source maps for .d.ts (great for debugging)
    "outDir": "../../dist/shared",
    "rootDir": "./src"
  }
}

// packages/api/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "outDir": "../../dist/api",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../shared" }   // API depends on shared
  ]
}

// packages/web/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": false,      // Web app — no need for .d.ts output
    "outDir": "../../dist/web",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../api" },
    { "path": "../shared" }
  ]
}
```

### Build Mode: `tsc --build` (tsc -b)

WHY: `tsc -b` is TypeScript's incremental build manager. It:
1. Reads `.tsbuildinfo` files to detect which files changed
2. Builds only affected projects in dependency order
3. Respects `--dry` (show what would be built) and `--force` (rebuild all)

```bash
# Root-level build — builds all packages, only changed ones
tsc -b

# Build specific package and its dependencies
tsc -b packages/api

# Force rebuild (ignore cache)
tsc -b --force

# Show what would be built without building
tsc -b --dry

# Verbose output showing why each project was (or wasn't) built
tsc -b --verbose
```

### Monorepo Patterns — Path Aliases vs References

```jsonc
// packages/api/tsconfig.json — two ways to reference shared

// APPROACH 1: Project reference (preferred for builds)
{
  "references": [{ "path": "../shared" }]
  // Source: import { types } from '@monorepo/shared'
  // Requires: shared's package.json has "name": "@monorepo/shared"
}

// APPROACH 2: Path alias (only for IDE + type checking, not build)
{
  "compilerOptions": {
    "paths": {
      "@monorepo/shared": ["../shared/src/index.ts"]
    }
  }
}
```

**Rule:** Use project references for build correctness. Use path aliases as
a supplementary IDE feature. Never use path aliases as a substitute for
project references — the bundler won't resolve them correctly.

### Watch Mode with References

```bash
# Watch mode with project references — only rebuilds changed packages
tsc -b --watch

# Watch specific packages
tsc -b --watch --force packages/shared
```

---

🔬 **Section Challenge — 4. Project References**

**Challenge 1 (Debug):** You add project references to a 12-package monorepo.
`tsc -b` works from the root. But when a developer runs `tsc` inside
`packages/api/`, it fails with "Cannot find declaration file for '../shared'".
The package compiles fine from the root. Why does this happen and how do you fix it?

<details><summary>Answer</summary>

**Scenario:** `tsc` works from root but fails in sub-package directory.
**Trace:** When you run `tsc` in a sub-package directory, TypeScript only
reads that package's tsconfig.json. It does NOT automatically include the
root tsconfig.json's project references. The sub-package's tsconfig.json
must have its own `references` array pointing to its dependencies.

**Root cause:** Many developers assume "project references are global" or
"the root tsconfig.json handles everything." But project references are
per-tsconfig-file — each package must declare its own dependencies.

**Fix — ensure every sub-package declares its references:**
```jsonc
// packages/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",  // Base config with compiler options
  "compilerOptions": {
    "outDir": "../../dist/api",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../shared" }  // Add this — must be here, not just in root
  ],
  "include": ["src/**/*"]
}
```

**Second issue:** The `Cannot find declaration file` error specifically
means TypeScript found the `.ts` source files but couldn't find the `.d.ts`
output. This happens when:
1. `declaration: true` is not set in the dependency's tsconfig
2. The dependency hasn't been built yet (run `tsc -b` from root first)
3. The `outDir` in the dependency's tsconfig doesn't match where the
   consuming package expects the `.d.ts` files

Always run `tsc -b` from the monorepo root before working in sub-packages.

</details>

---

## 5. Modern TypeScript Features — 5.0 to 5.4

WHY: TypeScript's feature set expands with each release, but the most
impactful additions are those that let you express constraints the type
system previously couldn't. Three features from TS 5.0–5.4 solve real
problems that previously required workarounds.

### `const` Type Parameters (TS 5.0+) — Preserving Literal Types

WHY: In TypeScript, generic type parameters normally widen literals:
```typescript
function f<T>(x: T) { return x; }
const result = f("hello");  // T = string, not "hello"
```

This is usually correct — you don't want `T = "hello"` for most uses. But
sometimes you DO want literal preservation: for template literal types,
const-assertion patterns, and functions that pass literals through.

WHAT: A `const` modifier on type parameters tells TypeScript to infer the
narrowest possible type (literal) instead of widening:

```typescript
// WITHOUT const type parameter (TS 4.7+):
function toRoute<T extends string>(path: T) { return path; }
const route = toRoute("/users/:id");
// route: string — TS widened to the constraint

// WITH const type parameter (TS 5.0+):
function toRoute<const T extends string>(path: T) { return path; }
const route = toRoute("/users/:id");
// route: "/users/:id" — literal preserved!

// Practical use: type-safe route definitions
type Route = { path: string; params: Record<string, string> };

function defineRoute<const T extends string>(
  path: T
): Route & { path: T } {
  return { path, params: {} };
}

const r1 = defineRoute("/users/:id");
// r1.path: "/users/:id" — used for route matching!

const r2 = defineRoute("/posts/:slug");
// r2.path: "/posts/:slug"
```

### `using` & `Disposable` — Explicit Resource Management (TS 5.2+)

WHY: In languages like C# and Rust, when a resource is allocated (file
handle, database connection, lock), the language guarantees it is released
when the scope exits — even if an exception is thrown. JavaScript had no
equivalent: you had to manually call `.close()` or `.release()` in `finally`
blocks, which is verbose and easy to forget. `Symbol.dispose` and the
`using` declaration bring deterministic cleanup to JavaScript/TypeScript.

WHAT: `Symbol.dispose` is a new well-known symbol. Objects that implement
it (have a `[Symbol.dispose]()` method) are `Disposable`. The `using`
declaration automatically calls `[Symbol.dispose]()` when the scope exits.

```typescript
// Defining a Disposable resource
class DatabaseConnection {
  private connected = false;

  connect() {
    this.connected = true;
    console.log("Connected to DB");
  }

  query(sql: string) { /* ... */ return []; }

  // Implement Symbol.dispose — called automatically when `using` exits
  [Symbol.dispose]() {
    console.log("Connection closed");
    this.connected = false;
  }
}

// Using the resource — guaranteed cleanup:
function getUser(id: string) {
  using db = new DatabaseConnection();  // Connect on entry
  db.connect();
  // ... do work ...
  // db[Symbol.dispose]() called automatically here
  // Even if an exception is thrown above!
}

// COMPARISON with manual cleanup:
function getUserOld(id: string) {
  const db = new DatabaseConnection();
  try {
    db.connect();
    // ... do work ...
  } finally {
    db.close();  // Easy to forget, easy to omit in error paths
  }
}
```

### `await using` — Async Resources

```typescript
// For async cleanup (e.g., releasing network connections):
class AsyncLock {
  private released = false;

  async [Symbol.asyncDispose]() {
    if (!this.released) {
      this.released = true;
      await this.releaseResources();
    }
  }

  private async releaseResources() {
    await new Promise((r) => setTimeout(r, 100));
    console.log("Async resources released");
  }
}

async function criticalSection() {
  await using lock = new AsyncLock();
  // ... async work ...
  // [Symbol.asyncDispose]() called automatically on scope exit
}
```

### `NoInfer<T>` — Blocking Inference From a Position (TS 5.4+)

WHY: TypeScript's inference algorithm is bidirectional — it infers from
both arguments and return types, sometimes creating circular inference
loops. Previously, you had to use elaborate workarounds (extra parameters,
conditional types) to prevent TypeScript from inferring a type from a
specific position. `NoInfer<T>` gives you explicit control.

WHAT: A utility type that blocks TypeScript from using the annotated
position as an inference site. The type is resolved to `T` but TypeScript
won't try to infer `T` from this position.

```typescript
// WITHOUT NoInfer — TypeScript infers T from both arguments:
function createPair<T>(a: T, b: T): [T, T] { return [a, b]; }

const p = createPair("hello", 123);
// T = string | number (widened union from both positions)
// Result: [string | number, string | number]

// WITH NoInfer — TypeScript infers T ONLY from `a`:
function createPairFixed<T>(a: T, b: NoInfer<T>): [T, T] { return [a, b]; }

const p2 = createPairFixed("hello", 123);
// Error: Argument of type 'number' is not assignable to parameter of type 'string'
// Because T = string (from "hello"), and 123 !== string
// Without NoInfer: no error (T = string | number)

// PRACTICAL USE: Factory functions that shouldn't re-infer from options:
interface Config {
  timeout?: number;
  retries?: number;
}

function createClient<T extends Config>(
  baseUrl: string,
  options: NoInfer<Partial<T>> = {}  // Don't let options affect T inference
): T {
  // T is inferred from the return type annotation, not from options
  return { baseUrl, ...options } as T;
}

// This ensures the caller specifies the exact Config type explicitly:
type ApiConfig = Config & { apiKey: string };
const client = createClient<ApiConfig>("https://api.example.com", {
  timeout: 5000,
  // If options didn't use NoInfer, TS might infer ApiConfig from options
  // which could be incomplete — causing subtle type errors elsewhere
});
```

---

🔬 **Section Challenge — 5. Modern TypeScript Features**

**Challenge 1 (Design):** You are implementing a file parser that takes a
path and returns a parsed result. You want TypeScript to infer the result
type from the file extension — `parseConfig("config.json")` returns a
`Config` type, `parseConfig("data.csv")` returns a `DataRow[]` type. You
use `const` type parameters but find that TypeScript still widens the
literal to `string`. What is the most likely cause, and how do you fix it?

<details><summary>Answer</summary>

**Scenario:** `const` type parameter not preserving literal types.
**Trace:** A `const` type parameter does preserve the literal — but only
when TypeScript infers it from an actual literal value. If the inference
source is not a literal, `const` has no effect:

```typescript
// ❌ NOT a literal — parameter gets string type from variable
const path = someConfigFile;  // type: string
const result = parseFile<const string>(path);  // T = string

// ✅ IS a literal — const preserves it
const result = parseFile<const string>("config.json");  // T = "/config.json" literal
```

The second issue: `const` on type parameters works with **direct inference
from literals**. But if the function has a return type annotation, TypeScript
may infer the type parameter from the return type instead — creating a loop.

**Fix:**
```typescript
function parseFile<const T extends string>(
  path: T
): ParseResult<T> {  // Return type depends on T — inference flows through
  // ...
}

// Direct call with literal — T inferred as literal, return type narrowed
const config = parseFile("config.json");    // Config
const data = parseFile("data.csv");         // DataRow[]
```

If you need to accept a variable but want literal inference from it, use
`as const` at the call site:
```typescript
const path = "config.json" as const;
const config = parseFile(path);  // T = "config.json" literal
```

**Rule:** `const` type parameter only works when TypeScript can infer from
a literal expression. Variables are not literals (even with `as const` at
declaration) unless the inference point sees the literal directly.

</details>

---

## 6. Compiler Performance — Speed Up `tsc`

WHY: TypeScript's type checker is powerful but not free. In large projects,
type-checking can take minutes — eating into developer productivity and CI
budget. TypeScript provides several compiler flags specifically designed to
reduce build time by telling the compiler what to skip.

### `skipLibCheck: true` — The Biggest Win

WHY: Every npm package you install brings `.d.ts` files (type declarations).
Running type-checking across all of these is expensive and mostly useless —
the types are written by library authors, not your team. `skipLibCheck: true`
tells TypeScript to skip type-checking of `.d.ts` files entirely, only
checking your own source code.

**WHAT IT DOES:**
```jsonc
{
  "compilerOptions": {
    "skipLibCheck": true  // Skips .d.ts files in node_modules AND in your src
  }
}
```

**WHY IT EXISTS:** TypeScript 1.5 added `skipLibCheck` because a single
large `@types` package (like `@types/react`) could double TypeScript's
type-checking time. Library types are already tested by their maintainers —
you don't need to re-check them in your project.

**GOTCHA:** It only skips `.d.ts` files, not `.ts` files. If you have
generated `.ts` files in your source, they will still be checked.

**Typical speedup:** 30–70% faster type-checking on large projects with
many dependencies.

### `incremental: true` — Build Cache

WHY: TypeScript 3.4 added incremental builds. On the first build, TypeScript
writes a `.tsbuildinfo` file that records which files were compiled and what
their signatures are. On subsequent builds, TypeScript only recompiles files
that have changed — dramatically reducing build time.

**WHAT IT DOES:**
```jsonc
{
  "compilerOptions": {
    "incremental": true,          // Generate .tsbuildinfo cache
    "tsBuildInfoFile": ".tsbuildinfo"  // Custom cache location
  }
}
```

```
First build: tsc
├── Reads: all .ts files
├── Compiles: all .ts files
├── Writes: .tsbuildinfo
└── Output: all .js files

Second build: tsc (only changed files)
├── Reads: .tsbuildinfo + changed .ts files
├── Compiles: only changed files
└── Output: only changed .js files

Third build: tsc (no changes)
├── Reads: .tsbuildinfo
├── Compiles: nothing
└── Output: nothing — cache is up to date
```

**Monorepo tip:** Each package should have its own `.tsbuildinfo` file to
avoid cross-package cache pollution.

### Build-Time Diagnostics

```bash
# Show compilation time breakdown (TS 3.4+)
tsc --diagnostics

# Output example:
# Files:               487
# Lines of library:   1204
# Lines of code:      3847
# Lines of type info:  293
# Identifiers:       28473
# Symbols:           98432
# Types:              1204
# Memory used:        482K
# Build time:         3.42s

# Show which files are being compiled and why (TS 4.3+)
tsc --explainFiles

# Output shows:
# File 'src/index.ts' compilation reason
# File 'node_modules/@types/node/index.d.ts' — skipped (skipLibCheck)
# File 'packages/shared/src/index.ts' — referenced by 'packages/api/src/main.ts'
```

```bash
# Extended diagnostics (verbose timing per phase):
tsc --extendedDiagnostics

# Output:
# Files:                         487  (0.023ms - 2.413ms per file)
# Symbol and Type workers:       12  (parallel)
# IO Tasks:                       8
# Language service tasks:         0
# Bind time:                     412ms  (parsing, scope analysis)
# Check time:                   2804ms  (type checking)
# Emit time:                     203ms  (code generation)
# Total time:                   3419ms
```

### Performance Flags Summary

```jsonc
{
  "compilerOptions": {
    // PERFORMANCE — The big four
    "skipLibCheck": true,              // Skip .d.ts files (30-70% faster)
    "incremental": true,               // Build cache (.tsbuildinfo)
    "composite": true,                 // Enable references + .tsbuildinfo
    "assumeChangesOnlyDirectlyTo": [   // Watch mode optimization
      "./src/**"
    ],

    // PARALLELIZATION
    "build": true,                     // Use build mode (tsc -b)
    "maxNodeModuleJsDepth": 1,         // Limit node_modules traversal depth

    // CODE GENERATION (faster transpilation)
    "target": "ES2022",
    "module": "ESNext",                // ESM is faster to transpile than CJS
    "sourceMap": false,                // Disable if not needed (saves time)
    "declarationMap": false,           // Disable if consumers don't debug types
    "noEmitOnError": false             // Emit even with errors (faster, less safe)
  }
}
```

---

🔬 **Section Challenge — 6. Compiler Performance**

**Challenge 1 (Debug):** Your CI pipeline runs `tsc` and takes 4 minutes.
You enable `skipLibCheck: true` and the build drops to 90 seconds. Your
senior engineer says "that's a red flag — skipLibCheck is hiding type
incompatibilities." Is this accurate, and what should you actually be
concerned about?

<details><summary>Answer</summary>

**Scenario:** Performance win from `skipLibCheck` and its implications.
**Trace:** The senior engineer is partially right but misidentifies the risk.
`skipLibCheck: true` skips **type-checking of declaration files** (`.d.ts`),
not your source code. Your own `.ts` files are still fully type-checked.

**What skipLibCheck actually skips:**
- All `.d.ts` files in `node_modules` (type packages like `@types/react`)
- All `.d.ts` files in your own project (generated or manual)
- Does NOT skip `.ts` source files

**What the engineer got wrong:**
It does NOT hide incompatibilities in your own code. Your types, interfaces,
and source files are still checked. The "red flag" the engineer is thinking
of is `noImplicitAny: false` or `strict: false` — those DO hide real type
errors in your source code.

**Real concerns with skipLibCheck (limited but real):**
1. Your own `.d.ts` files won't be type-checked — if you ship a library,
   type errors in your `.d.ts` files won't be caught locally
2. Type incompatibilities between your code and library types won't be
   caught (but you should use `strict` to catch your own side)

**Best practice:**
- `skipLibCheck: true` for applications (apps consuming libraries)
- `skipLibCheck: false` for libraries (packages that ship types)

If you're building an application, `skipLibCheck: true` is standard practice,
not a red flag. A 3-minute CI time reduction is significant and legitimate.

</details>

---

## 7. Putting It All Together — Real-World Configuration

WHY: Each of these tools — module resolution, exports, isolatedModules,
project references, and performance flags — solves a specific problem.
Understanding them in isolation is one thing; seeing how they compose in
a real project is how you develop the judgment to configure them correctly.

### Example: Library tsconfig (npm package with ESM + CJS)

```jsonc
// packages/my-lib/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "incremental": true,
    "outDir": "../../dist/my-lib",
    "rootDir": "./src",
    "strict": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": false  // IMPORTANT: libraries should check their own types
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Example: Vite React App tsconfig

```jsonc
// packages/web/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,  // Vite handles resolution + HMR
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,           // Vite handles JS output, tsc only checks types
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "incremental": true
  },
  "include": ["src"],
  "references": [
    { "path": "../my-lib" }
  ]
}
```

### Example: package.json for dual CJS/ESM library

```jsonc
{
  "name": "my-ts-lib",
  "version": "1.0.0",
  "type": "module",         // Package defaults to ESM
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "default": "./dist/esm/index.js"
    },
    "./utils": {
      "types": "./dist/types/utils.d.ts",
      "import": "./dist/esm/utils.js",
      "require": "./dist/cjs/utils.js"
    }
  },
  "types": "./dist/types/index.d.ts",
  "files": [
    "dist"
  ]
}
```

---

## 8. Interview Quick-Fire

```
Q: What is the difference between moduleResolution "node" and "bundler"?
→ "node" uses Node.js's classic CJS resolver without the exports field
  support. "bundler" allows extensionless imports and follows arbitrary
  file extensions, matching Vite/esbuild behavior.

Q: Why does isolatedModules exist?
→ Bundlers and fast transpilers (esbuild, swc) process each file in
  isolation and in parallel. isolatedModules enforces that each file
  is self-describing (no cross-file type info required). It enables
  the two-stage TS pipeline: fast per-file transpilation (esbuild) +
  slow whole-program type checking (tsc).

Q: What does skipLibCheck do, and when should you NOT use it?
→ skipLibCheck skips type-checking of .d.ts files. You should NOT use
  it when building a library (your .d.ts files need to be type-checked
  before publishing). For applications, it's a 30-70% perf win.

Q: What are project references and why are they needed in monorepos?
→ They let TypeScript build only changed packages. Without them, tsc
  must type-check the entire monorepo on every build. With composite:
  true and references, tsc -b uses .tsbuildinfo to skip unchanged packages.

Q: What does the "exports" field in package.json solve?
→ It defines a public API surface for a package, preventing consumers
  from importing internal files. It also enables conditional exports
  (different files for ESM vs CJS consumers) and the "types" condition
  for TypeScript's resolver.

Q: What does Symbol.dispose do and how does "using" work?
→ Symbol.dispose is implemented by objects that need deterministic
  cleanup. The "using" declaration (TS 5.2+) calls [Symbol.dispose]()
  automatically when the scope exits, even if an exception is thrown.
  It replaces try/finally cleanup blocks for resource management.

Q: What is NoInfer<T> and when would you use it?
→ NoInfer<T> blocks TypeScript from using the annotated position as a
  type inference site. Use it when you want TypeScript to infer a type
  from one argument only (e.g., factory functions where options shouldn't
  influence the inferred result type).

Q: What is a const type parameter?
→ Introduced in TS 5.0, a const type parameter (fn<const T>(x: T))
  forces TypeScript to infer the narrowest literal type instead of
  widening. This preserves literal string types for path parameters,
  template literals, and route definitions.
```

---

[← Decorators](05_TS_Decorators_Metaprogramming.md) | [Index](../00_MASTER_INDEX.md) | [Next Series → CSS Foundations](../18_CSS_Complete/01_CSS_Foundations.md)

---

## Reality Check

**"import type is an optimization nicety"** ? Type-only imports are CORRECTNESS machinery under modern build architecture: single-file transpilers (esbuild, swc, Babel — how most code builds now) cannot see across files (isolatedModules), so they cannot know whether an imported name is a type (erase it) or a value (keep it) — verbatimModuleSyntax makes YOU declare it, and getting it wrong ships either a phantom runtime import (bundle bloat, circular-import triggers, side-effect timing changes) or a missing one (runtime crash). The import type discipline is how TS stays compatible with the transpile-per-file world; treating it as style produces bugs that only appear under the bundler.

**"Circular imports either work or crash — you'd notice"** ? Circulars mostly HALF-work, which is worse: ESM live bindings mean a module mid-cycle sees its dependency in a partially-initialized state — imported VALUES read as undefined at module-evaluation time but work later (the class extends Undefined crash at load, the constant that is undefined only when imported via one specific path), while type-only cycles are completely harmless (erased). The debugging pattern: initialization-order crashes that move when imports reorder are cycles; the tooling (madge, eslint-plugin-import/no-cycle) finds them; the fix is extracting the shared piece downward, and import type breaks the false cycles for free.

**"tsc is slow because TypeScript is slow"** ? Type-CHECKING is the slow half, and the industry's answer was to SPLIT the pipeline: transpilation by native tools in milliseconds (esbuild/swc — types simply stripped), checking run separately (tsc --noEmit in CI, the editor's language server locally) — so "TS build performance" is really checker performance, and its levers are structural: skipLibCheck (stop re-verifying node_modules declarations), incremental with .tsbuildinfo, project references splitting the graph, and interface-over-intersection preferences that check faster. Blaming the language while running the pre-split pipeline is paying 2019 costs in the tool era that fixed them.

**"Slow types are a build problem, not a code problem"** ? Pathological TYPES have identifiable shapes you can refactor like slow code: huge union PRODUCTS (template-literal combinatorics multiplying members — a five-way cross of unions instantiates into thousands), deep conditional recursion (depth ceilings and exponential re-instantiation), and repeated expansion of unnamed intermediate types (naming forces caching — the same reason CTEs beat repeated subqueries). Diagnosis is tooling, not vibes: tsc --extendedDiagnostics for check time, --generateTrace with the analyzer for WHICH type burns it. "The editor got laggy in this file" is a performance bug report against a type — treat it like one.

**"Declaration files are for library publishers"** ? Every serious TS codebase OPERATES declaration machinery daily: ambient declarations typing untyped dependencies and globals (the env.d.ts everyone copies without understanding — declare global requires the file to be a module, the classic silent-failure), module AUGMENTATION extending Express Request or theme objects (interface merging across module boundaries — powerful, and a spooky-action source when an augmentation in one corner changes types everywhere), and triple-slash-free lib/types configuration deciding which globals even exist. The d.ts layer is where "TypeScript sees a different world than runtime" bugs originate — publisher or not, someone on the team must own the world-model.
