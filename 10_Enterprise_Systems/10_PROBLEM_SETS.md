# 📝 Enterprise Systems — Problem Sets

## `10_Enterprise_Systems` Module | Distributed Systems & DDD Style

> **How to use:** Attempt all parts before reading answers. Part B code goes in `JavaSolutions/ps/enterprise/`. All answers use `<details>` blocks. Read 🔴 **Erklärung** when stuck.

---

## Problem Set ENTERPRISE-PS1 — Domain-Driven Design

**Prerequisites:** `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md`, `10_Enterprise_Systems/01c_Domain_Driven_Entity_Design.md`

---

### Part A: Theoretical

**A1 (Easy).** A developer models a hospital system with a single `Patient` class that has fields for medical records, billing info, appointment schedule, insurance details, and doctor assignments. What DDD principle does this violate, and what are the correct Bounded Contexts?

<details><summary>Answer</summary>

**Violation:** Missing Bounded Context separation. A single `Patient` class cannot serve all these domains because each team uses the word "Patient" differently:

- **Medical Records Context:** Patient = medical history, diagnoses, allergies
- **Billing Context:** Patient = payer, insurance policy, outstanding balance
- **Scheduling Context:** Patient = appointment holder, availability, time zone
- **Clinical Context:** Patient = care recipient, assigned doctor, ward location

**DDD Solution:** Create a separate `Patient` (or differently-named entity) in each Bounded Context. Cross-context communication happens via Domain Events, not shared object references.

🔴 **Erklärung:** The hardest part of DDD is accepting that the same real-world concept ("patient") maps to **multiple classes** with different data and behaviors in different contexts. Junior engineers resist this because it "feels like duplication." It is not — it is boundary enforcement.

</details>

---

🔬 **Section Challenge — Bounded Contexts:** A developer says "there should be one Patient class since there's only one patient in the real world." Explain why this reasoning leads to the wrong design.

<details>
<summary>Answer</summary>

A patient in the real world is ONE entity, but a patient in a healthcare system interacts with **multiple bounded contexts**, each with its own model:

- **Patient Registration context**: stores demographics, insurance, contact info. The `Patient` entity here has `name`, `dob`, `address`.
- **Clinical context**: stores medical history, allergies, medications. The `Patient` here has `conditions`, `medications`, `lastVisit`.
- **Billing context**: stores financial info, payment plans, insurance claims. The `Patient` here has `accountBalance`, `paymentMethod`.
- **Scheduling context**: stores appointments, providers, availability. The `Patient` here has `upcomingVisits`, `preferredProvider`.

Forcing these into ONE `Patient` class couples all four contexts — a change to billing fields requires recompiling clinical code, and a security bug in scheduling could leak medical history. The right design: each context has its own `Patient` aggregate with its own identity (e.g., `patient_id` for clinical, `account_id` for billing), and they communicate via **domain events** (`PatientAdmitted`, `InsuranceVerified`) or **anti-corruption layer** translation.

This is Bounded Context (Evans 2003): the same real-world concept becomes multiple domain models, each owned by one context, with explicit translation at the boundaries.
</details>

---

**A2 (Medium).** Explain the difference between an **Entity** and a **Value Object** using `Address` as an example. When should `Address` be an Entity and when should it be a Value Object?

<details><summary>Answer</summary>

**Value Object** (usually correct): Address has no meaningful identity — two addresses with the same street/city/zip are **identical**. An address doesn't "evolve over time" — when you change your address, you don't mutate the old one; you **replace** it with a new one. → Implement as immutable Java record.

```java
record Address(String street, String city, String state, String pin) {}
```

**Entity** (correct when): If your business tracks the **history** of a physical location (e.g., a government registry mapping property IDs to owners over time), then Address has identity. `Address.id = "PROP-00123"` exists independently of who occupies it.

**Invariant for Value Object:** Must be immutable. Override `equals()` and `hashCode()` based on all fields. No setters.

🔴 **Erklärung:** Students make `Address` an Entity because "it's stored in the DB with an `id`." Database rows always have a PK — that doesn't determine whether it's an Entity in the DDD sense. The domain behavior determines it, not the schema.

</details>

---

🔬 **Section Challenge — Aggregate Design:** Two orders have the same shipping address. Is it the same entity? Can you modify the street on one order and see it change on the other? What invariant does this violate?

<details>
<summary>Answer</summary>

**Same real-world address, different entities.** The shipping address on Order #1234 is a snapshot at order time; the address on Order #5678 is a different snapshot. They are two distinct Value Objects (in DDD terminology), even if their field values happen to match.

**Can you modify one and see the change on the other?** Only if you implemented Address as a shared, mutable reference (an anti-pattern). The correct design: Address is a Value Object — immutable, structural equality, owned by exactly one Aggregate at a time. Modifying Order #1234's address means creating a NEW Address Value Object and assigning it to Order #1234; Order #5678's address is unaffected.

**Invariant violated by mutable shared Address**: **Aggregate consistency**. In DDD, an Aggregate is a consistency boundary — all invariants are checked within one transaction on one Aggregate. If two Orders reference the same mutable Address, modifying the Address affects both Orders, and the transaction boundary is broken.

**Production fix**: implement Address as `record` (JVM-enforced immutability) or `final class` with all-`final` fields, no setters. Two Orders with the same shipping address have two structurally-equal but reference-distinct Address Value Objects.
</details>

---

**A3 (Hard).** A team designs an e-commerce system. The `Order` aggregate has a `List<Product>` field containing direct `Product` object references. When an order is placed, `Product.stock` is decremented inside the same transaction as the `Order` save. Explain three separate problems this design causes and provide the correct DDD solution for each.

<details><summary>Answer</summary>

**Problem 1 — Transaction Lock Contention:**
Saving `Order` and modifying `Product.stock` in one transaction acquires write locks on both rows simultaneously. Under high load, hundreds of orders competing for the same Product row cause database deadlocks.

**Problem 2 — Aggregate Boundary Violation:**
The rule "a transaction must modify exactly one Aggregate Root" is broken. `Order` and `Product` are separate Aggregates. Modifying both in one transaction creates a distributed lock — you cannot scale independently.

**Problem 3 — Object Reference Anti-Pattern:**
`Order` holding a direct `Product` reference means loading an Order always loads the full Product object. If Product is updated in the Product Catalog context, the Order's embedded copy is stale.

**DDD Solutions:**

1. Store `productId: UUID` in the Order (reference by identity, not object)
2. Use Domain Events: `OrderPlaced` event → separate `InventoryService` transaction decrements stock
3. Accept eventual consistency: Order is immediately confirmed, stock deducted asynchronously

🔴 **Erklärung:** This is the single most common DDD mistake at mid-level. The instinct is "if I load the Order, I need the Product data" — solve this with a READ model (CQRS projection) or a DTO query, not by embedding the entity.

</details>

---

### Part B: Implementation

**B1.** Implement a `Money` Value Object in Java:

```java
// Skeleton — JavaSolutions/ps/enterprise/Money.java
import java.math.*;
import java.util.*;

/**
 * Immutable Value Object representing an amount in a specific currency.
 * Invariant: amount >= 0; currency is a valid ISO 4217 code.
 */
public record Money(BigDecimal amount, Currency currency) {

    public Money {
        // TODO: validate amount != null && amount >= 0
        // TODO: validate currency != null
    }

    public static Money of(double amount, String currencyCode) {
        // TODO: return new Money(BigDecimal.valueOf(amount), Currency.getInstance(currencyCode))
        return null;
    }

    public Money add(Money other) {
        // TODO: validate same currency, return new Money(this.amount.add(other.amount), currency)
        return null;
    }

    public Money subtract(Money other) {
        // TODO: validate same currency, amount doesn't go negative
        return null;
    }

    public Money multiply(int factor) {
        // TODO
        return null;
    }

    public boolean isGreaterThan(Money other) { /* TODO */ return false; }
    public boolean isZero() { return amount.compareTo(BigDecimal.ZERO) == 0; }

    @Override
    public String toString() {
        return currency.getSymbol() + " " + amount.setScale(2, RoundingMode.HALF_UP);
    }
}
```

**JUnit Test Stub:**

```java
class MoneyTest {
    @Test void add_sameCurrency_works() {
        var m1 = Money.of(100, "INR");
        var m2 = Money.of(50, "INR");
        assertEquals(Money.of(150, "INR"), m1.add(m2));
    }
    @Test void add_differentCurrency_throws() {
        assertThrows(IllegalArgumentException.class,
            () -> Money.of(100, "INR").add(Money.of(50, "USD")));
    }
    @Test void negativeAmount_throws() {
        assertThrows(IllegalArgumentException.class, () -> Money.of(-1, "INR"));
    }
    @Test void immutability_add_doesNotMutate() {
        var original = Money.of(100, "INR");
        original.add(Money.of(50, "INR"));
        assertEquals(Money.of(100, "INR"), original); // original unchanged
    }
}
```

<details>
<summary>Answer — Money Value Object Implementation</summary>

```java
public record Money(BigDecimal amount, Currency currency) {

    public Money {
        if (amount == null) {
            throw new IllegalArgumentException("amount must not be null");
        }
        if (currency == null) {
            throw new IllegalArgumentException("currency must not be null");
        }
        // Reject weird precision artifacts (e.g., 1.003 stored as 1.0029999...)
        if (amount.scale() > currency.getDefaultFractionDigits()) {
            amount = amount.setScale(currency.getDefaultFractionDigits(), RoundingMode.HALF_EVEN);
        }
    }

    public Money add(Money other) {
        requireSameCurrency(other);
        return new Money(this.amount.add(other.amount), this.currency);
    }

    public Money subtract(Money other) {
        requireSameCurrency(other);
        return new Money(this.amount.subtract(other.amount), this.currency);
    }

    public Money multiply(BigDecimal multiplier) {
        return new Money(this.amount.multiply(multiplier), this.currency);
    }

    private void requireSameCurrency(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new CurrencyMismatchException(
                "Cannot operate on " + this.currency + " and " + other.currency);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money other)) return false;
        return amount.compareTo(other.amount) == 0 && currency.equals(other.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount.stripTrailingZeros(), currency);
    }
}
```

**Why `record` is the right type for a Value Object:**
1. **Immutability enforced by the JVM** — every field is `final`, no setter can exist. Value Objects must be immutable to be safely shared across threads and transactions.
2. **Structural equality + hashCode auto-generated** — two `Money(100, USD)` instances are equal regardless of object identity. This is critical for hash-based collections and DB lookups.
3. **Compact constructor for validation** — the validation block runs at construction time, so an invalid Money can never exist (fail-fast).
4. **No boilerplate** — equals, hashCode, toString are auto-generated, eliminating the most common source of Value Object bugs (incorrect equals that compares `BigDecimal` with `==` instead of `.compareTo()`).

**Production notes:**
- `BigDecimal` (not `double`) for `amount` — `double` causes IEEE 754 rounding errors on fractional cents (e.g., 0.1 + 0.2 = 0.30000000000000004).
- `Currency` from `java.util.Currency` (not a string) — provides ISO 4217 validation and `getDefaultFractionDigits()` (USD = 2, JPY = 0, BHD = 3).
- `stripTrailingZeros()` in hashCode — `new BigDecimal("1.0")` and `new BigDecimal("1.00")` should be equal as Money but differ as BigDecimal. Stripping avoids hash collisions in collections.
- Validation in compact constructor — runs before fields are assigned, so `this.amount` is still null inside the validation block (use the parameter name `amount`, not `this.amount`).

**Test:**
```java
@Test
void moneyAddSameCurrency() {
    Money a = new Money(new BigDecimal("100.50"), Currency.getInstance("USD"));
    Money b = new Money(new BigDecimal("50.25"), Currency.getInstance("USD"));
    assertEquals(new BigDecimal("150.75"), a.add(b).amount());
}

@Test
void moneyAddDifferentCurrencyThrows() {
    Money usd = new Money(BigDecimal.TEN, Currency.getInstance("USD"));
    Money eur = new Money(BigDecimal.TEN, Currency.getInstance("EUR"));
    assertThrows(CurrencyMismatchException.class, () -> usd.add(eur));
}
```
</details>

---

### Part C: Challenge

**C1.** Design the entity model for a multi-tenant SaaS subscription billing system. Identify:

- All bounded contexts
- All entities and value objects per context
- Which invariants each Aggregate Root must enforce
- How cross-context communication happens (events or ACL)

<details><summary>Answer Outline</summary>

**Bounded Contexts:**

- **Tenant Context:** Tenant (Aggregate Root), TenantPlan (Value Object)
- **Subscription Context:** Subscription (Aggregate Root — tracks active plan, billing cycle, renewal date)
- **Billing Context:** Invoice (Aggregate Root), Payment (Entity), RefundRequest (Entity)
- **Usage Context:** UsageRecord (append-only Entity), UsageSummary (Value Object — computed)

**Cross-Context Communication:**

- `SubscriptionRenewed` event → Billing Context creates Invoice
- `InvoicePaid` event → Subscription Context extends renewal date
- `SubscriptionCancelled` event → Billing Context generates final invoice + Usage Context stops tracking

**Key Invariants:**

- A Subscription cannot be `ACTIVE` without a corresponding `Invoice.PAID` for the current period
- `UsageRecord` is append-only — never updated or deleted
- An Invoice becomes `OVERDUE` if unpaid 7 days after `dueDate` — triggers `SubscriptionSuspended` event
</details>

---

## Problem Set ENTERPRISE-PS2 — Distributed Systems

**Prerequisites:** `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §4 (Distributed Consistency)

---

### Part A: Theoretical

**A1 (Medium).** Explain the Dual-Write Problem. Give a concrete production scenario where it causes data corruption and exactly which failure window allows it.

<details><summary>Answer</summary>

**The Problem:** You need to (a) write to the database AND (b) publish a message to Kafka in the same logical operation — but there is no single transaction spanning both.

**Failure Window:**

```java
orderRepo.save(order);          // 1. DB write succeeds
kafkaTemplate.send("orders", order); // 2. Kafka send succeeds
// APPLICATION CRASHES HERE
// @Transactional rolls back the DB write → order doesn't exist in DB
// BUT the Kafka message was already delivered → InventoryService deducted stock
// Result: phantom stock deduction for an order that doesn't exist
```

**Solution:** Outbox Pattern — write the Kafka message payload into an `outbox_events` table in the SAME database transaction. A separate relay process (Debezium/CDC) reads the outbox table and publishes to Kafka after the DB commit is confirmed.

🔴 **Erklärung:** Students try to fix this with `try/catch` around the Kafka send. This doesn't work — if the process crashes mid-execution, there's no recovery. The Outbox Pattern solves it at the persistence layer.

</details>

---

🔬 **Section Challenge — Dual-Write Problem:** Your outbox relay processes events in FIFO order. Event 3 (PaymentCharged) arrives at the saga consumer before Event 2 (InventoryReserved). What goes wrong in the saga? How does the Saga Orchestrator handle this?

<details>
<summary>Answer</summary>

The saga expects this order: `OrderPlaced → InventoryReserved → PaymentCharged → OrderConfirmed`. If the consumer receives `PaymentCharged` first (out of order), the saga's state machine is in an inconsistent state — it has not yet processed `InventoryReserved` (which should be the precondition for charging payment).

**Symptoms**:
- Inventory is not actually reserved when the payment is charged → risk of overselling.
- Saga compensation logic gets confused: if a later `InventoryReservationFailed` arrives, the saga tries to compensate `PaymentCharged` (refund) but the original charge was already problematic.

**How the Saga Orchestrator handles out-of-order events**:

**Option 1 — Per-saga instance buffer**: the orchestrator buffers events in a per-saga queue, reordering them by event sequence number before processing. Simple but requires sequence numbers on events and bounded buffers (what if event 2 is delayed by 30 minutes?).

**Option 2 — State machine guards**: each saga step checks preconditions before executing. `PaymentCharged` step checks `if (state == INVENTORY_RESERVED)` — if not, the event is parked in a "waiting" state until `InventoryReserved` arrives. The orchestrator has a timeout per waiting step; if the precondition never arrives, the saga compensates (refund the payment if it was charged, or send a "payment failed" notification).

**Option 3 — Idempotent step execution with version checks**: each step records the saga version it expects. Out-of-order events with the wrong version are rejected, and the consumer re-fetches the current saga state from the orchestrator before deciding what to do.

**Production choice**: Option 2 (state machine guards) is most common. Kafka guarantees within-partition ordering, so if all events for one saga are routed to the same partition (via `saga_id` as the partition key), out-of-order delivery only happens on rebalance or retry. Use Option 2 as the default, Option 1 only for saga instances with strict ordering requirements (rare).
</details>

---

**A2 (Hard).** Compare Choreography Saga and Orchestration Saga. Design a 4-step `PlaceOrder` saga using BOTH approaches. Explain which you would choose for a team of 8 microservices and why.

<details><summary>Answer</summary>

**Choreography (Decentralized):**

```
OrderService: save Order(PENDING) → emit OrderCreated
InventoryService: on OrderCreated → reserve stock → emit StockReserved
PaymentService: on StockReserved → charge card → emit PaymentCharged
ShippingService: on PaymentCharged → schedule delivery → Order(CONFIRMED)

Compensation (failure):
PaymentService: on StockReservationFailed → no-op
InventoryService: on PaymentFailed → release stock → emit StockReleased
OrderService: on StockReleased → Order(FAILED)
```

**Orchestration (Centralized State Machine):**

```
OrderOrchestrator:
  → CMD ReserveStock → InventoryService
  ← REPLY: StockReserved
  → CMD ChargeCard → PaymentService
  ← REPLY: PaymentFailed
  → CMD ReleaseStock (compensate) → InventoryService
  ← REPLY: StockReleased
  → Update Order: FAILED
```

**Decision for 8 microservices:** Use **Orchestration** because:

- With 8 services and Choreography, the "pinball machine" of events becomes impossible to debug
- Orchestrator provides a single queryable state machine → observable status
- Compensation logic is explicit and centralized
- Choreography's strength (decoupling) becomes a weakness at scale (no observability)
</details>

---

[← Back to Semester 2 Guide](../00_CURRICULUM/SEMESTER_2_GUIDE.md)

---

## Historical Evolution

The problem-set format is one lineage, but the **domain content** in this file (Bounded Context, Aggregate, Domain Event, Saga) has its own historical root:

**Eric Evans — "Domain-Driven Design: Tackling Complexity in the Heart of Software" (2003)**: This book coined the terms **Bounded Context**, **Aggregate**, **Aggregate Root**, **Entity**, **Value Object**, **Repository**, **Domain Service**, **Ubiquitous Language**, and **Context Map**. The DDD tactical patterns (PS1 in this file) are direct applications of Evans's vocabulary. The Saga pattern (PS2) was formalized later but the underlying idea of distributed transactions with compensation predates DDD.

**Vaughn Vernon — "Implementing Domain-Driven Design" (2013)**: Translated Evans's conceptual patterns into concrete Java/C# implementations. The Aggregate consistency boundary ("one transaction, one aggregate"), Repository pattern with Spring Data, and Domain Event publishing are all from Vernon. This is the practical companion to Evans's conceptual book.

**Chris Richardson — "Microservices Patterns" (2018)**: Formalized the Saga pattern (PS2) as a microservices-specific solution to distributed transactions. Also codified the "smart endpoints, dumb pipes" principle that drives event-driven architecture.

**Modern practice anchors**:
- **Spring Modulith** (2023): Spring's reference implementation of DDD tactical patterns for Spring Boot applications. Bounded Context becomes a Java package; Aggregate Root enforcement via ArchUnit.
- **Axon Framework** (2010, ongoing): Java framework specifically for DDD + CQRS + Event Sourcing. Production-grade at scale.
- **jMolecules** (2020): Annotations like `@AggregateRoot`, `@Entity`, `@ValueObject` that integrate with Spring, Jakarta EE, and ArchUnit for architectural verification.

When you read `Bounded Context` in PS1, that's Evans 2003. When you read `Saga` in PS2, that's Richardson 2018 (with roots in Garcia-Molina 1987 and Bernstein/Hadzilacos 1987). When you see code using `@AggregateRoot` annotations, that's jMolecules 2020 or Axon.

---

The problem-set format used here (theoretical + implementation + design challenge per topic) descends from MIT's 6.006 course. Two threads:

**1. The MIT OCW Lineage (2006-2010)**

- **MIT OpenCourseWare — launched 2002, 6.006 (Introduction to Algorithms) Fall 2006 release**: The first freely-available MIT problem-set archive. The format of "theoretical problem + implementation problem + design problem per topic" comes directly from MIT 6.006 / 6.046 / 6.851.
- **LeetCode — founded 2015 (Winston Tang)**: The dominant interview-prep platform. Today has 3000+ problems; the company was acquired by Workday (2022) for undisclosed amount.
- **HackerRank — founded 2009**: The first platform to add enterprise-recruiter dashboards. Now standard for Fortune 500 technical screening.
- **Codeforces — founded 2010 (Mike Mirzayanov)**: The dominant competitive-programming platform.

**2. The DSA + Distributed Systems Era (2014-today)**

- **System Design Interview books — Alex Xu Vol 1 (2020) + Vol 2 (2022)**: The "System Design Interview" books standardized the "design Twitter / design Uber" interview format. Used by every FAANG-style interview prep.
- **Designing Data-Intensive Applications (DDIA) — Martin Kleppmann, 2017**: The canonical reference for distributed-systems interview prep. Often called "the bible" by senior engineers.
- **Modern Practice Anchored**: When a problem-set looks like "Theoretical: prove X; Implementation: code Y; Design: architect Z", that's MIT 6.006 (2006). When an interview asks "design Twitter" + "implement rate limiter", that's Alex Xu 2020 + MIT 2006. The format hasn't changed in 20 years; the volume of problems has exploded (10x).

### Production Reality

**Debug workflows for DDD and Saga failures:**

**Aggregate boundary violation**:
- **Symptom**: deadlock, optimistic-lock retry storm, slow writes.
- **Detection**: `grep -r "@Transactional" src/main/java/ | xargs grep -l "AggregateRoot"` — find any `@Transactional` method that touches more than one Aggregate Root. Each such method is a boundary violation.
- **Fix**: split the transaction into separate operations, one per Aggregate. Use a Saga (PS2) to coordinate multi-Aggregate workflows.

**Domain event ordering issue**:
- **Symptom**: saga compensation fails because event N arrived before event N-1.
- **Detection**: in the saga orchestrator log, look for `STEP_EXECUTION_ORDER` mismatches. Each saga step records the sequence number it expected.
- **Fix**: ensure all events for one saga instance route to the same Kafka partition (use `saga_id` as the partition key). Add per-saga instance buffer in the orchestrator for out-of-order tolerance.

**Bounded Context leakage**:
- **Symptom**: a change in one context breaks another context's tests.
- **Detection**: `archunit: no_classes_that_reside_in_a_package("..billing..").should_access_classes_in_package("..orders..")` (ArchUnit rule).
- **Fix**: introduce an anti-corruption layer (ACL) at the context boundary. The ACL translates foreign concepts to local ones, isolating changes.

**Anemic domain model**:
- **Symptom**: business logic lives in Service classes; entities are just data bags with getters/setters.
- **Detection**: `grep -r "Service" src/main/java/ | grep -v "Repository\|Config\|Controller\|Application"` — too many `Service` classes with business logic. Also check: if entities have NO behavior methods (only getters/setters), they're anemic.
- **Fix**: move business logic INTO the entity. `Order.applyDiscount(code)` instead of `OrderService.applyDiscount(order, code)`.

**Saga compensation loop**:
- **Symptom**: a saga step keeps compensating and retrying indefinitely.
- **Detection**: monitor `saga_compensation_attempts_total` Prometheus counter; if it exceeds 5 for the same saga ID, alert.
- **Fix**: add a dead-letter queue for stuck sagas. Manual investigation required.

**Aggregate size explosion**:
- **Symptom**: an Aggregate grows to 50+ fields; modifications require loading the entire aggregate.
- **Detection**: `find src/main/java -name "*Aggregate.java" -exec wc -l {} +` — sort by line count; anything >500 lines is suspicious.
- **Fix**: split the Aggregate by responsibility. E.g., split `CustomerAggregate` into `CustomerProfile`, `CustomerBilling`, `CustomerPreferences` — three smaller aggregates with their own consistency boundaries.

These debug patterns come from real production incidents — see `08_RealWorld_Incidents_DSA.md` for full case studies.

---



---

## Reality Check

**"Enterprise problem sets are about learning the domain"** ? The transferable skill is seeing the ALGORITHMIC and architectural core inside domain problems ([05, 06]'s repeated lesson): the reconciliation that is tolerant bipartite matching, the pricing that is rules-evaluation, the allocation that is constrained assignment, the approval flow that is a conditional graph traversal, the reporting that is the OLTP/OLAP separation. Learning "the domain" (accounting, inventory, order management) is necessary context; the durable capability is recognizing which computational and design patterns the domain rules are decorating � because the domain changes between jobs, and the pattern-recognition transfers.

**"Solve it once and the enterprise pattern is learned"** ? Enterprise problems reward re-solving under CHANGED CONSTRAINTS because the constraints are exactly what varies in the field ([06]'s requirement-churn): the same allocation problem with a new business rule, the same reconciliation with a new tolerance policy, the same integration with a new source system's model. The variation axis (what happens when this rule changes, this system is added, this volume grows) is the enterprise skill � and a problem set that stops at one solution teaches the solution, while re-solving under the perturbations teaches the design-for-change ([config-versus-customization, 07]) that enterprise systems actually need. The three-perturbations discipline ([15_React, 05_Problem_Solving]'s variation practice) applies: solve it, then change a rule, add a system, grow the data.

**"Correct output means the enterprise solution is right"** ? Enterprise-correct includes auditability, maintainability, and exception-completeness beyond the happy-path output ([05, 04]'s repeated point): can you explain how the result was reached (the audit), does it handle the full exception space (the unmatched payment, the null customer, the closed period � the majority of real inputs), is it reproducible and deterministic (the re-runnable batch), and can the next engineer maintain it. A problem-set solution that produces the right number on clean input has done the easy 20 percent; the enterprise bar is the auditable, exception-complete, maintainable, reproducible version � and practicing toward that bar (asking "how would this be audited, what are the real edge cases, how does this change") is what distinguishes enterprise-ready from prototype.

**"Enterprise problems need enterprise frameworks to practice"** ? The core problems are practicable with plain code and honest edge cases � the frameworks (the ERP, the message bus, the workflow engine) are the production packaging, not the learning substrate: the reconciliation matching, the double-entry invariant ([04]), the Saga compensation logic ([09]), the idempotent consumer ([Kafka]) are all expressible and testable in a few hundred lines, and understanding them at that level is what lets you use the frameworks well (or debug them when they leak). Practicing the mechanics directly ([13_DE Docker]'s ephemeral-environment, the local reproduction) builds the model; treating the framework as a prerequisite defers the learning that makes the framework comprehensible � the framework is the industrial version of a pattern you can grasp in the small.

**"Enterprise engineering is less algorithmically interesting than product or systems work"** ? Enterprise systems are where algorithms meet the hardest CONSTRAINTS � correctness that is audited and legally binding ([04]), scale that makes complexity matter ([05]), integration across incompatible systems ([06]), consistency across distributed coordination ([09]), and change over decades � and the interest is in the composition and the constraints, not the isolated technique. The reconciliation engine, the pricing rules system, the financial close, the multi-system order flow are genuinely hard problems whose difficulty is exactly the enterprise flavor (messy data, real exceptions, audit requirements, changing rules, distributed coordination). Dismissing it as unglamorous CRUD misses that the same algorithmic and design depth ([14_MM]'s whole toolkit) applies under the additional weight of auditability, longevity, and organizational reality � which is more constraint, not less substance.
