# Mock Interview Transcript: Design Round (45 min)

**Role:** Senior SDET (L6/L7)  
**Interviewer:** Senior Engineering Manager  
**Prompt:** "Design a test framework for a microservices e-commerce platform."

---

## Candidate Thinking Out Loud

- Okay, let me start by clarifying the scope. E-commerce platform with microservices... so we're talking about services like catalog, inventory, pricing, cart, checkout, payments, notifications.
- The test framework needs to handle multiple layers: unit, integration, contract, E2E. I'll focus on the integration and E2E layers since those are the most interesting for a microservices architecture.
- Key concerns: service isolation for integration tests, test data management across services, handling async events, flaky tests, and CI integration.
- For microservices, contract testing is critical. I'll need to include Pact or something similar.
- E2E tests should cover critical user journeys: browse -> product page -> add to cart -> checkout -> payment -> confirmation.
- I need to think about how services are spun up. Docker Compose for local, maybe Testcontainers for integration tests, and ephemeral environments for E2E.
- Observability: tests need good logging and tracing so failures can be debugged across service boundaries.

---

## Interviewer Follow-Up Questions

**Q1:** How do you handle test data when multiple services own their own databases?

**Q2:** What do you do when a downstream service is down during integration test execution?

**Q3:** How do you balance the speed of integration tests versus the confidence of full E2E tests?

**Q4:** A flaky test fails 1 in 50 runs. How does your framework handle that?

---

## Good Answer Skeleton: 5 Key Architectural Decisions

### Decision 1: Layered Test Pyramid
- **Unit tests:** Each service independently (fast, no deps)
- **Contract tests:** Pact between service pairs (consumer-driven contracts)
- **Integration tests:** Testcontainers spin up real DB + messaging per test class
- **E2E tests:** 3 critical journeys on ephemeral staging environment, capped at 30 minutes

### Decision 2: Test Data as Code
- Each test defines its own data via factory methods
- Integration tests use Flyway/Liquibase migrations to reset schema per test
- Shared reference data (products, users) seeded once per test run via JSON fixtures
- No shared mutable test databases; each test gets isolated throwaway data

### Decision 3: Service Virtualization for Unavailable Dependencies
- WireMock containers stand in for downstream services not under test
- Contract tests verify the mocks match reality via Pact Broker
- Fallback: skip integration tests for unavailable services rather than fail the suite

### Decision 4: Async Event Testing via In-Memory Brokers
- Integration tests use embedded Kafka (or Testcontainers Kafka) for event-driven flows
- Tests assert on published events using a custom event spy
- Timeouts configured per test; events are the source of truth for state changes

### Decision 5: Flakiness Detection & Quarantine
- Every test gets a flakiness score (pass rate over last 100 runs)
- Tests below 95% pass rate auto-quarantine (run but don't block merge)
- Quarantined tests have a 48-hour SLA for investigation/fix
- Retry logic at the framework level (max 2 retries), not in test code

---

## Evaluation Rubric

| Dimension | Exceeds Expectations | Meets Expectations | Below Expectations |
|-----------|----------------------|--------------------|--------------------|
| **Scope Clarification** | Asks about scale, traffic, team structure, existing tooling before diving into design | Asks 1-2 clarifying questions | Jumps straight into solution without understanding constraints |
| **Architecture Depth** | Discusses test pyramid, data isolation, service virtualization, and CI integration with trade-offs | Covers pyramid layers and CI but misses data or virtualization concerns | Only talks about E2E tests or one layer |
| **Trade-off Analysis** | Explicitly compares approaches (e.g., mocks vs real services, speed vs coverage) and justifies choices | Mentions trade-offs but does not deeply compare alternatives | No trade-off discussion; treats one approach as obviously correct |
| **Microservices Awareness** | Addresses distributed data, async events, contract testing, and service dependencies natively | Mentions some distributed concerns but misses contract testing or event testing | Treats microservices as a monolith for testing |
| **Operational Thinking** | Includes monitoring, flakiness handling, debugging tools, and team adoption in the design | Mentions CI integration and maybe retries | Ignores how the framework is maintained, debugged, or adopted by teams |
