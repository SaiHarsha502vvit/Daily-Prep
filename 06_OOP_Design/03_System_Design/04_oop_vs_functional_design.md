# PART 4: OOP vs FUNCTIONAL DESIGN

> **Navigation**: [← Data Flows in Systems](03_data_flows_in_systems.md) | [Chapter overview](../03_System_Design.md) | [Practice Exercises →](05_practice_exercises.md)
> Page 4 of 5 in **System Design & Feature Creation Guide**


## When To Use Oop Design

**Best For**:

- Systems with many ENTITIES (User, Order, Product)
- Complex BEHAVIOR associated with data
- Need for INHERITANCE and polymorphism
- Long-lived STATEFUL objects
  EXAMPLE - E-commerce Order System (OOP):
  Order
  ───────────────────────────────────────────────────────────────────────
- orderId: Long
- items: List<OrderItem>
- status: OrderStatus
- customer: Customer
  ───────────────────────────────────────────────────────────────────────

* addItem(item): void
* removeItem(itemId): void
* calculateTotal(): Money
* submit(): void
* cancel(): void
  // OOP - Behavior lives with data
  public class Order {
  private List<OrderItem> items;
  private OrderStatus status;
  public Money calculateTotal() {
  return items.stream()
  .map(OrderItem::getSubtotal)
  .reduce(Money.ZERO, Money::add);
  }
  public void submit() {
  validateItems();
  validatePayment();
  this.status = OrderStatus.SUBMITTED;
  }
  }

🔬 **Section Challenge — When To Use Oop Design**

**Challenge 1 (Reasoning — Who/When/What):** In the Order class, `submit()` calls `validateItems()` and `validatePayment()` before setting status to `SUBMITTED`. Why do these live inside the `Order` class instead of in an external `OrderValidator` service? What OOP principle justifies this?

<details><summary>Answer</summary>

**Who validates?** The `Order` object itself. **When?** At the moment of state transition (`submit()`). **What already exists?** The Order has direct access to `items` and payment info — it's the ONLY object that knows its own invariants. This is **encapsulation**: behavior lives with the data it operates on. An external `OrderValidator` would need to extract private fields (breaking encapsulation) and could be bypassed (someone calls `setStatus(SUBMITTED)` directly). By keeping validation inside `submit()`, the Order **enforces its own invariants** — it's impossible to submit an invalid order. This is the Tell Don't Ask principle: don't ask Order for its data and validate externally; tell Order to submit and let it validate itself.

</details>

## When To Use Functional Design

**Best For**:

- Data TRANSFORMATIONS (ETL, pipelines)
- STATELESS operations
- CONCURRENT processing
- Mathematical/logical computations
  EXAMPLE - Data Processing Pipeline (Functional):
  // Functional - Data flows through transformations
  public class OrderProcessor {
  // Pure function - no side effects
  public static Money calculateTotal(List<OrderItem> items) {
  return items.stream()
  .map(item -> item.price().multiply(item.quantity()))
  .reduce(Money.ZERO, Money::add);
  }
  // Pipeline of transformations
  public static OrderSummary processOrder(OrderRequest request) {
  return validateRequest(request)
  .map(OrderProcessor::enrichWithInventory)
  .map(OrderProcessor::calculatePricing)
  .map(OrderProcessor::applyDiscounts)
  .map(OrderProcessor::createSummary)
  .orElseThrow(InvalidOrderException::new);
  }
  }

**Benefits**:

- Easy to test (pure functions)
- Easy to parallelize
- Easy to reason about (no hidden state)

🔬 **Section Challenge — When To Use Functional Design**

**Challenge 1 (Reasoning — Who/When/What):** In the `processOrder` pipeline, each `.map()` transforms the data. **Who** owns the state at each stage? **What** happens if `applyDiscounts` throws an exception — does `calculatePricing` need to roll back? Why or why not?

<details><summary>Answer</summary>

**Who owns state?** Nobody — that's the point. Each function receives an immutable input and produces a new output. There is no shared mutable state. **What happens on exception?** `calculatePricing` does NOT need to roll back because it never mutated anything. The original `OrderRequest` is untouched. The `Optional` chain short-circuits via `.orElseThrow()`. This is the key advantage of functional pipelines: no side effects means no rollback complexity. In OOP with mutable state, a failure in step 4 of 5 might leave the object in a half-modified state requiring compensating transactions. In functional: fail anywhere, original data is intact. This is why functional is preferred for data transformation pipelines.

</details>

## Hybrid Approach (Most Real Systems)

REAL SYSTEMS USE BOTH!

- OOP for DOMAIN ENTITIES:
  User, Order, Product, Payment
- Functional for DATA PROCESSING:
  Validation, Transformation, Calculation

**Example**:
// Domain entity (OOP)
public class Order {
private List<OrderItem> items;
// Uses functional internally!
public Money getTotal() {
return items.stream()
.map(OrderItem::getSubtotal)
.reduce(Money.ZERO, Money::add);
}
}
// Service (Functional processing with OOP entities)
public class OrderService {
public List<Order> getHighValueOrders(List<Order> orders) {
return orders.stream()
.filter(o -> o.getTotal().isGreaterThan(Money.of(1000)))
.sorted(comparing(Order::getTotal).reversed())
.collect(toList());
}
}

---

## 🎨 Part 5: System Design Patterns

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                COMMON SYSTEM ARCHITECTURE PATTERNS                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ 1. MONOLITHIC ARCHITECTURE                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │                         SINGLE APPLICATION                              │  │
│ │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                │   │
│ │ │   UI      │ │  Users    │ │  Orders   │ │ Payments  │                │   │
│ │ │  Layer    │ │  Module   │ │  Module   │ │  Module   │                │   │
│ │ └───────────┘ └───────────┘ └───────────┘ └───────────┘                │   │
│ │                         │                                               │  │
│ │                   ┌─────┴─────┐                                         │  │
│ │                   │  Database │                                         │  │
│ │                   └───────────┘                                         │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ PROS: Simple, easy to develop, easy to deploy                                │
│ CONS: Hard to scale, hard to maintain as it grows                            │
│ USE WHEN: Small team, MVP, simple domain                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ 2. MICROSERVICES ARCHITECTURE                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│ │  User    │    │  Order   │    │ Payment  │    │ Notific. │                 │
│ │ Service  │    │ Service  │    │ Service  │    │ Service  │                 │
│ └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘                 │
│      │               │               │               │                       │
│   ┌──┴──┐         ┌──┴──┐         ┌──┴──┐         ┌──┴──┐                    │
│   │ DB1 │         │ DB2 │         │ DB3 │         │ DB4 │                    │
│   └─────┘         └─────┘         └─────┘         └─────┘                    │
│                                                                              │
│ PROS: Scalable, independent deployment, tech diversity                       │
│ CONS: Complex, distributed system challenges, operational overhead           │
│ USE WHEN: Large team, complex domain, need to scale independently            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ 3. EVENT-DRIVEN ARCHITECTURE                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌─────────────────────────┐                               │
│                    │      Event Bus          │                               │
│                    │  (Kafka/RabbitMQ/SQS)   │                               │
│                    └───────────┬─────────────┘                               │
│              ┌─────────────────┼─────────────────┐                           │
│              │                 │                 │                           │
│         ┌────┴────┐       ┌────┴────┐       ┌────┴────┐                      │
│         │Producer │       │Consumer │       │Consumer │                      │
│         │(Orders) │       │(Inventory)│     │(Analytics)│                    │
│         └─────────┘       └─────────┘       └─────────┘                      │
│                                                                              │
│ PROS: Loose coupling, real-time, scalable                                    │
│ CONS: Eventual consistency, debugging harder                                 │
│ USE WHEN: Real-time processing, many consumers, async workflows              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ 4. CQRS (Command Query Responsibility Segregation)                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│     WRITES                              READS                                │
│   ┌─────────┐                        ┌─────────┐                             │
│   │ Command │                        │  Query  │                             │
│   │ Service │                        │ Service │                             │
│   └────┬────┘                        └────┬────┘                             │
│        │                                  │                                  │
│        ▼                                  ▼                                  │
│   ┌─────────┐      sync/async       ┌─────────┐                              │
│   │  Write  │ ─────────────────────▶│  Read   │                              │
│   │   DB    │                       │   DB    │                              │
│   └─────────┘                       └─────────┘                              │
│   (normalized)                      (denormalized)                           │
│                                                                              │
│ PROS: Optimized reads AND writes, scalable                                   │
│ CONS: Complexity, eventual consistency                                       │
│ USE WHEN: Read-heavy systems, complex queries, different read/write needs    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Part 6: Real — World System Design Examples

### Example 1: URL Shortener (Like bit.ly)

```
REQUIREMENTS:
• Shorten long URLs
• Redirect short URLs to original
• Track click analytics
• 100 million URLs/month

HIGH-LEVEL DESIGN:

    User                API Gateway              Services
    ─────              ───────────              ────────
      │                     │
      │ POST /shorten       │
      │ {url: "long..."}    │
      ├────────────────────▶│
      │                     │
      │                     │        ┌─────────────────┐
      │                     ├───────▶│  URL Service    │
      │                     │        │  - Generate ID  │
      │                     │        │  - Store mapping│
      │                     │        └────────┬────────┘
      │                     │                 │
      │                     │                 ▼
      │                     │           ┌──────────┐
      │                     │           │ Database │
      │                     │           │(Cassandra)│
      │                     │           └──────────┘
      │                     │
      │ {"short": "abc123"} │
      │◀────────────────────┤
      │                     │
      │ GET /abc123         │
      ├────────────────────▶│
      │                     │
      │                     │        ┌─────────────────┐
      │                     ├───────▶│  Redirect Svc   │
      │                     │        │  - Lookup URL   │
      │                     │        │  - Log analytics│
      │                     │        └────────┬────────┘
      │                     │                 │
      │ 302 Redirect        │                 ▼
      │◀────────────────────┤           ┌──────────┐
      │                     │           │  Cache   │
                                        │ (Redis)  │
                                        └──────────┘

KEY DECISIONS:
1. Base62 encoding for short IDs (a-z, A-Z, 0-9)
2. Cassandra for distributed storage
3. Redis cache for hot URLs
4. Async analytics logging
```

### Example 2: Chat System (Like WhatsApp)

```
REQUIREMENTS:
• 1-to-1 and group messaging
• Delivered/Read receipts
• Offline message delivery
• 1 billion messages/day

HIGH-LEVEL DESIGN:

                    ┌─────────────────────────────────────┐
                    │           Load Balancer              │
                    └─────────────────┬───────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
    ┌────┴────┐                  ┌────┴────┐                  ┌────┴────┐
    │WebSocket│                  │WebSocket│                  │WebSocket│
    │ Server 1│                  │ Server 2│                  │ Server N│
    └────┬────┘                  └────┬────┘                  └────┬────┘
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                      │
                              ┌───────┴───────┐
                              │ Message Broker │
                              │   (Kafka)      │
                              └───────┬───────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
         ┌────┴────┐            ┌────┴────┐            ┌────┴────┐
         │ Message │            │Presence │            │  Push   │
         │ Service │            │ Service │            │ Service │
         └────┬────┘            └────┬────┘            └────┬────┘
              │                      │                      │
              ▼                      ▼                      ▼
         ┌─────────┐            ┌─────────┐            ┌─────────┐
         │Cassandra│            │  Redis  │            │   FCM   │
         │(Messages)│           │(Online) │            │  /APNs  │
         └─────────┘            └─────────┘            └─────────┘

MESSAGE FLOW:
1. User A connects to WebSocket server
2. Server registers user in Presence Service (Redis)
3. User A sends message to User B
4. Message goes to Kafka
5. Message Service stores in Cassandra
6. If B online: Route to B's WebSocket server
7. If B offline: Push notification via FCM/APNs
8. B receives and sends ACK
9. Delivery receipt sent back to A
```

---

[← Data Flows in Systems](03_data_flows_in_systems.md) | [Chapter overview](../03_System_Design.md) | [Practice Exercises →](05_practice_exercises.md)
