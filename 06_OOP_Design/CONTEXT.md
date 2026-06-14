# Folder Context: 06_OOP_Design

## Purpose

Teach OOP, SOLID, design patterns, LLD, system design fundamentals, and object modeling.

## Writing Style

- Start from responsibilities and boundaries.
- Use small object models and tradeoffs.
- Explain why a pattern exists before showing code.
- Connect design choices to maintainability and testability.

## Boundaries

Spring-specific framework mechanics belong in `07_Modern_Java`. Distributed system operations belong in `13_Developer_Essentials`, `20_Interview_Mastery`, or `22_DevOps` depending on focus.

## PLUS Enhancements

### Folder Position Map (Curriculum Boundaries)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│               Daily-Prep Curriculum — Folder Boundary Map                    │
└──────────────────────────────────────────────────────────────────────────────┘

  00_MASTER_INDEX ────────────────────────────────────────────── (root hub)
         │
         ├── 01_Foundations ────────────────────────────────── (syntax, shell)
         ├── 02_Problem_Solving ────────────────────────────── (DSA fundamentals)
         ├── 03_Advanced_DSA ────────────────────────────────── (trees, graphs)
         ├── 04_Java_Basics ─────────────────────────────────── (language core)
         ├── 05_Java_Collections ─────────────────────────────── (data structures)
         ├── 06_OOP_Design ◀── YOU ARE HERE ──────────────────── (THIS FOLDER)
         │         │
         │         ├── 07_Modern_Java ───────────────────────── (Streams, Lambdas,
         │         │                                              Spring, Annotations)
         │         │                                              BOUNDARY: Spring-specific
         │         │                                              mechanics stay in 07, not 06
         │         │
         │         ├── 08_Design_Patterns_Java ───────────────── (Java implementations
         │         │                                              of GoF patterns)
         │         │
         │         └── ...
         │
         ├── 10_Web_Technologies ────────────────────────────── (HTTP, APIs)
         ├── 12_Databases ────────────────────────────────────── (SQL, noSQL)
         ├── 13_Developer_Essentials ────────────────────────── (git, docker, ops)
         │                                              BOUNDARY: Distributed ops
         │                                              (k8s, CI/CD) belong in 13,
         │                                              not 06_Distributed_Systems
         │
         ├── 20_Interview_Mastery ────────────────────────────── (mock interviews)
         │         │
         │         └── 21_OOPS_Interview_Deepdive ─────────────── (OOP-only deep dive)
         │                   (overlaps with 06, but interview-focused)
         │
         └── 22_DevOps ────────────────────────────────────────── (CI/CD, infra)
                   BOUNDARY: DevOps tooling belongs in 22, not 06
```

### Depth vs Breadth Positioning Note

`06_OOP_Design` occupies a **pivotal position** in the curriculum map:

| Property         | Position in Curriculum                                  | Implication                                                                |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Depth**        | Highest in 06 (OOP Principles)                          | Teaches WHY patterns exist before HOW to implement them                    |
| **Breadth**      | Spans from fundamentals to LLD                          | Must stay focused on OOP/SOLID — not drift into Spring (07) or Docker (22) |
| **Dependencies** | Entry point for 07, 08, 20                              | Nothing above it in the OOP chain; other folders depend on it              |
| **Bridge role**  | Connects Java language (04/05) to system design (03/05) | First folder where design thinking > syntax                                |

**Critical boundary rule**: When a design pattern topic intersects with framework-specific mechanics, the **framework interpretation** goes in 07_Modern_Java. For example:

- "How the Strategy pattern works" → 06_OOP_Design
- "How Spring uses Strategy in `@Qualifier` resolution" → 07_Modern_Java

## Update Triggers

Update this file when new design-pattern conventions, LLD templates, or system-design boundaries are added.
