# CSE602 — API Design & Testing

**Estimated time:** ~20h  
**Prerequisite:** [CSE601](./CSE601_Spring_Boot_And_Microservices/README.md) (Spring Boot fundamentals)

## Description

Systematic treatment of REST/HTTP API design from resource modeling through production-grade testing. Covers API versioning, HATEOAS, OpenAPI documentation, contract testing (Pact), integration testing with Testcontainers, and performance/load testing with k6.

## Learning Outcomes

1. Design RESTful APIs: resource modeling, HTTP semantics, status codes, versioning strategies
2. Document APIs with OpenAPI 3.1: schemas, security schemes, examples, mock servers
3. Write integration tests with Spring Test, MockMvc, and Testcontainers (real databases in containers)
4. Implement contract testing with Pact: consumer-driven contracts, broker, verification
5. Conduct performance and load testing with k6: thresholds, smoke/spike/stress/soak tests

## Syllabus Outline

| Week | Topic |
|------|-------|
| 1 | REST fundamentals: resources, verbs, status codes, idempotency |
| 2 | API design: query params vs path params, pagination (cursor vs offset), filtering |
| 3 | Versioning strategies: URL path, header, content negotiation; HATEOAS |
| 4 | OpenAPI 3.1: spec authoring, $ref, compose APIs, generating clients |
| 5 | Error handling: problem details (RFC 9457), validation error aggregation |
| 6 | Authentication: Bearer tokens, API keys, OAuth2 client credentials |
| 7 | Integration testing: @SpringBootTest, MockMvc, slice tests |
| 8 | Testcontainers: PostgreSQL, Redis, Kafka; test lifecycle management |
| 9 | Contract testing: Pact broker, consumer contracts, provider verification |
| 10 | Load testing: k6 scripts, thresholds, spike/stress tests, results analysis |

## Linked Existing Content

- [Advanced API Testing](../../22_Advanced_API_Testing/)
- [SDET Playwright Automation](../../21_SDET_Playwright_Automation/)

## Assessment

- API design exercise: model a domain as REST resources, write OpenAPI spec
- Integration test suite with Testcontainers
- Contract test setup between two services
- k6 load test with pass/fail thresholds