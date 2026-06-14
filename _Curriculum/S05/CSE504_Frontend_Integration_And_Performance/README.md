# CSE504 — Frontend Integration & Performance

**Estimated time:** ~15h  
**Prerequisite:** [CSE502](./CSE502_React_And_Frontend_Architecture/README.md)

## Description

Covers the build pipeline from source to production: bundlers (Vite, Webpack 5), module systems (ESM, CJS, IIFE), code splitting strategies, tree shaking, asset optimization, and Core Web Vitals. Includes browser rendering pipeline, memory profiling, and real-world performance auditing.

## Learning Outcomes

1. Configure Vite and Webpack 5: mode, plugins, optimization splits, asset handling
2. Implement code splitting: route-based, component-based, lazy imports, prefetch/preload
3. Optimize Core Web Vitals: LCP, CLS, INP — measurement, diagnosis, and remediation
4. Use browser DevTools Performance and Memory profilers to identify and fix bottlenecks
5. Set up CI/CD-integrated Lighthouse audits with performance budgets and regression alerts

## Syllabus Outline

| Week | Topic                                                                    |
| ---- | ------------------------------------------------------------------------ |
| 1    | Module systems: ESM, CJS, IIFE, bundle format trade-offs                 |
| 2    | Vite deep dive: dev server, HMR, build pipeline, plugins                 |
| 3    | Webpack 5: module federation, shared modules, runtime chunk              |
| 4    | Tree shaking, scope hoisting, minification (Terser, esbuild, SWC)        |
| 5    | Code splitting strategies: route-based, component-based, entry point     |
| 6    | Asset optimization: images (WebP, AVIF), fonts, critical CSS extraction  |
| 7    | Core Web Vitals: LCP, CLS, INP — metrics, thresholds, tooling            |
| 8    | Browser rendering pipeline: parsing, layout, paint, composite, layers    |
| 9    | Memory profiling: leaks, heap snapshots, retained size, WeakRef patterns |
| 10   | Lighthouse CI: budgets, thresholds, Puppeteer/Playwright integration     |

## Linked Existing Content

- [Frontend Integration & Performance](../../19_Frontend_Integration/)

## Assessment

- Weekly integration challenges (bundle analysis, Lighthouse audits)
- Performance optimization project: achieve Lighthouse score >= 95 on a given app
- 90-minute exam: bundle analysis, performance diagnosis, DevTools interpretation
