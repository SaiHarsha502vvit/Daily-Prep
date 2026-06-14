# CSE501 — JavaScript & TypeScript Deep Dive

**Estimated time:** ~20h  
**Prerequisite:** S03 (OOP & Design Patterns recommended)

## Description

A rigorous exploration of modern JavaScript (ES2024+) and TypeScript 5.x. Covers the type system in depth, advanced patterns (decorators, mixins, metaprogramming), runtime internals, and practical tooling. Builds directly on S03 OOP foundations.

## Learning Outcomes

1. Master ES2024+ features: destructuring, async/await, iterators, generators, proxies, WeakMap/WeakSet, Array/Object helpers
2. Design and enforce type systems using TypeScript 5: union/intersection types, generics, conditional types, template literal types, infer
3. Implement advanced patterns: decorator-based AOP, mixins, factory functions, symbolic polymorphism
4. Understand JavaScript runtime: event loop, call stack, micro/macro tasks, Memory Model, Garbage Collection heuristics
5. Configure TypeScript compiler, tsconfig targets, path aliases, project references, and strict mode

## Syllabus Outline

| Week | Topic                                                                                        |
| ---- | -------------------------------------------------------------------------------------------- |
| 1    | ES2024+ syntax deep dive: destructuring, spread, rest, optional chaining, nullish coalescing |
| 2    | Iterators, Generators, Symbol.iterator, async generators                                     |
| 3    | Proxy, Reflect, WeakMap, WeakSet, and memory-sensitive caching                               |
| 4    | TypeScript fundamentals: types, interfaces, enums, generics                                  |
| 5    | Advanced TypeScript: conditional types, infer, template literal types, mapped types          |
| 6    | Decorators (TC39 Stage 3): class, method, field, accessor decorators                         |
| 7    | Mixins, composition, and the functional patterns from S03 applied in TS                      |
| 8    | Module systems: ESM, CJS, dynamic imports, top-level await                                   |
| 9    | TypeScript project configuration: strict mode, path aliases, composite projects              |
| 10   | Capstone: build a typed event emitter / reactive utility library                             |

## Linked Existing Content

- [JavaScript Fundamentals](../../16_JavaScript/)
- [TypeScript Complete Guide](../../17_TypeScript/)

## Assessment

- Weekly coding exercises (automated tests)
- Type-safe utility library project
- 90-minute practical exam (TypeScript + JS internals)
