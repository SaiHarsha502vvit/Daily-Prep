# CSE602 — API Design & Testing

## Semester 6 · Full-Stack Specialization (Backend Track)

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can design REST APIs that consumers don't curse, write OpenAPI specs that generate working clients, build test pyramids that catch real bugs (not just exercise code), and set up contract testing that prevents producer/consumer drift.
> **Capstone:** Take an existing service, design + document its API with OpenAPI 3.1, build a full test pyramid (unit + integration + contract + smoke + load), and prove API stability across 5 releases via contract verification.

---

## Navigation

| Course                                                                                                                              | Description |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **[CSE601 — Spring Boot & Microservices](../CSE601_Spring_Boot_And_Microservices/README.md)** | Prerequisite — Spring fluency |
| **CSE602 — API Design & Testing**                                                                                                   | This course |
| **[CSE603 — DevOps & CI/CD](../CSE603_DevOps_And_CICD/README.md)**                                                                  | S06 sibling — runs these tests in CI |
| **[CSE604 — Java Concurrency & JVM Internals](../CSE604_Java_Concurrency_And_JVM_Internals/README.md)** | S06 sibling |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `24_Advanced_API_Testing/`                 | Primary source for API testing patterns                        |
| `21_SDET_Playwright_Automation/`           | E2E and contract testing in JS/TS                              |
| `07_Modern_Java/Ch28_Spring_MVC_REST.md`   | REST controller implementation                                 |
| `08_SQL/`                                  | DB-backed tests with Testcontainers                            |

---

## Prerequisites

- `CSE601 Spring Boot & Microservices` — Units 1-2 (REST controllers, validation)
- `CSE301 OOP & Design Patterns` — for understanding mock vs stub vs spy distinction
- Working dev environment with Docker (for Testcontainers)

**Constraint:** Test code is production code. A test suite that's flaky, slow, or hard to maintain is technical debt that compounds. Apply the same SOLID/clean code standards to tests as to production.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — REST API Design (Weeks 1–4)

**Learning Outcomes:**

- Model resources from a domain, not from a database schema
- Use HTTP verbs and status codes correctly
- Design pagination that scales (cursor vs offset)
- Version APIs without breaking consumers

#### Week 1 — Resource Modeling

| Day | Topic                              | Read                                              | Do                                                       |
| --- | ---------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Resources, not actions             | `24_Advanced_API_Testing/01_API_Design.md` §1    | Refactor `/getUsers` → `/users`; defend the choice       |
| 2   | HTTP verbs and idempotency         | `24_Advanced_API_Testing/01_API_Design.md` §2    | When is PUT vs POST correct? Trace 3 cases               |
| 3   | Status codes — semantically right  | `24_Advanced_API_Testing/01_API_Design.md` §3    | Map: validation error → 422 vs 400, missing → 404 vs 410 |
| 4   | Resource representations + content negotiation | `24_Advanced_API_Testing/01_API_Design.md` §4 | Use Accept header for JSON vs XML; trace negotiation     |
| 5–7 | Lab + Problem Set API-PS1          | —                                                 | Design a REST API for a domain you know well             |

**Section Challenge (REST design):**

> Your team's API has endpoints like `POST /createUser`, `POST /sendUserEmail`, `POST /activateUserAccount`. A new junior dev added `POST /deleteUserAndAllTheirData`. The senior says "this isn't REST." Explain WHY each endpoint name is wrong (or right), and propose RESTful alternatives.

<details>
<summary>Answer</summary>

```
THE PROBLEM: ENDPOINTS NAMED AS VERBS, NOT RESOURCES.

WHY THIS IS WRONG (from REST principles):
  REST is RESOURCE-oriented. The verb is implicit in the HTTP method.
  POST /createUser duplicates the verb — POST already means "create."
  Worse: as the API grows, you get /updateUser, /deleteUser, /listUsers,
  /findUsersByEmail, /resetUserPassword — endpoint explosion.

THE RESTFUL ALTERNATIVE:
  POST /createUser            → POST /users
  POST /sendUserEmail         → POST /users/{id}/emails (creates an email)
  POST /activateUserAccount   → PATCH /users/{id} body={status:"active"}
                              OR POST /users/{id}/activations
                              (depends: is activation a one-off event or
                              a state mutation?)
  POST /deleteUserAndAllTheirData → DELETE /users/{id}
                              The "all their data" part is a server-side
                              cascade — the API doesn't expose it as a
                              special endpoint.

THE EXCEPTION: ACTION-RESOURCES
  Sometimes a use case ISN'T cleanly resource-shaped:
  POST /payments/{id}/refunds      ← good: refund is a real resource
  POST /matches/{id}/finalizations ← awkward: finalization isn't a resource
                                     better: PATCH /matches/{id} body={status:"final"}

  Heuristic: if the action has a permanent record (refund, invoice,
  email-sent), model it as a resource. If the action is just a state
  transition, use PATCH on the parent resource.

WHY THIS MATTERS BEYOND AESTHETICS:
  Verb-named APIs require consumers to know N endpoint names.
  Resource-named APIs require consumers to know 1 resource + verbs they
  already know. Documentation, SDK generation, client predictability all
  improve. Mature APIs (GitHub, Stripe, AWS) follow this for a reason.
```

</details>

---

#### Week 2 — Pagination, Filtering, Sorting

`24_Advanced_API_Testing/01_API_Design.md` §5 — cursor vs offset (when each fits), filter query languages (RSQL, GraphQL-ish), N+1 in expand patterns.

#### Week 3 — Versioning & Evolution

`24_Advanced_API_Testing/02_Versioning_Evolution.md` — URL path, header, content-type versioning; non-breaking changes; deprecation policy.

#### Week 4 — OpenAPI 3.1

`24_Advanced_API_Testing/03_OpenAPI_Spec.md` — schema authoring, $ref reuse, security schemes, examples, mock server generation, client SDK gen.

---

### UNIT 2 — Test Pyramid Foundations (Weeks 5–7)

**Learning Outcomes:**

- Build a test pyramid: many fast unit tests, fewer integration tests, fewer still E2E
- Pick between mock vs real dependency at each layer
- Make tests deterministic (no flake)

#### Week 5 — Unit Tests

`24_Advanced_API_Testing/04_Unit_Testing.md` — JUnit 5, AssertJ, Mockito, when to mock vs use real instance.

#### Week 6 — Spring Test (Integration)

`24_Advanced_API_Testing/05_Spring_Test.md` — @SpringBootTest, slice tests (@WebMvcTest, @DataJpaTest), MockMvc.

#### Week 7 — Testcontainers

`24_Advanced_API_Testing/06_Testcontainers.md` — PostgreSQL, Redis, Kafka, Localstack, container reuse for fast suites.

---

### UNIT 3 — Contract Testing (Weeks 8–10)

**Learning Outcomes:**

- Detect producer-consumer drift before deployment
- Run consumer-driven contract tests with Pact
- Integrate Pact Broker into CI/CD

#### Week 8 — Why Contract Testing

`24_Advanced_API_Testing/07_Contract_Testing.md` §1-2 — what unit + integration miss, the publisher/subscriber drift problem.

#### Week 9 — Pact (Consumer side)

`24_Advanced_API_Testing/07_Contract_Testing.md` §3 — defining consumer expectations, generating pact file.

#### Week 10 — Pact (Provider side + Broker)

`24_Advanced_API_Testing/07_Contract_Testing.md` §4-5 — provider verification, Pact Broker, "can-i-deploy" gating.

---

### UNIT 4 — Performance Testing (Weeks 11–13)

#### Week 11 — k6 Fundamentals

`24_Advanced_API_Testing/08_Performance_Testing.md` §1 — scripting in JS, thresholds, stages.

#### Week 12 — Smoke / Spike / Stress / Soak

`24_Advanced_API_Testing/08_Performance_Testing.md` §2 — choosing test type from goal; interpreting results.

#### Week 13 — CI Integration

Lighthouse CI + k6 in CI, gating PRs on perf regression.

---

### UNIT 5 — E2E + Specialized (Weeks 14–15)

E2E flows via Playwright (`21_SDET_Playwright_Automation/`); BDD with Cucumber, accessibility, visual regression.

---

### Week 16 — Capstone

Pick an existing service. Design + document API with OpenAPI 3.1. Build full test pyramid. Prove API stability across 5 simulated releases via Pact.

---

## Problem Sets

`24_Advanced_API_Testing/` — practice modules.

## Exam Prep

- `00_CURRICULUM/EXAM_BANK.md` — S06 API section
