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
