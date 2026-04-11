> **Navigation**: [< Previous](Ch65_OS_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch67_Kubernetes_Deep_Dive.md)

# 📜 Chapter 40 — Event Sourcing, CQRS, and the Saga Pattern

> **"Instead of storing current state (balance = $500), store every event that led to it (deposited $200, deposited $400, withdrew $100). Now you have complete audit trail, can rebuild state at ANY point in time, can replay events into different projections, and can debug production issues by replaying exactly what happened."**

---

## Table of Contents

1. [Traditional CRUD vs Event Sourcing — The Fundamental Shift](#1-traditional-crud-vs-event-sourcing--the-fundamental-shift)
2. [Event Store — The Single Source of Truth](#2-event-store--the-single-source-of-truth)
3. [Rebuilding State from Events](#3-rebuilding-state-from-events)
4. [Snapshots — Because Replaying 1 Million Events is Slow](#4-snapshots--because-replaying-1-million-events-is-slow)
5. [Event Versioning — What Happens When Events Change](#5-event-versioning--what-happens-when-events-change)
6. [CQRS — Separate Read and Write Models](#6-cqrs--separate-read-and-write-models)
7. [Projections — Building Read Models from Events](#7-projections--building-read-models-from-events)
8. [The Saga Pattern — Distributed Transactions Without 2PC](#8-the-saga-pattern--distributed-transactions-without-2pc)
9. [Orchestration vs Choreography — Two Saga Approaches](#9-orchestration-vs-choreography--two-saga-approaches)
10. [When to Use (and NOT Use) Event Sourcing](#10-when-to-use-and-not-use-event-sourcing)

---

## 1. Traditional CRUD vs Event Sourcing — The Fundamental Shift

```
  TRADITIONAL CRUD:
  ═════════════════

  User places order → UPDATE orders SET status='CONFIRMED' WHERE id=42
  
  What you have in DB:
  ┌─────────────────────────────────────────────────────────────────┐
  │ id │ status    │ total  │ updated_at          │ items          │
  ├─────────────────────────────────────────────────────────────────┤
  │ 42 │ CONFIRMED │ 150.00 │ 2024-01-15 10:30:00 │ [item1, item2] │
  └─────────────────────────────────────────────────────────────────┘
  
  Questions you CANNOT answer:
  ❌ When was this order created? (updated_at shows last change)
  ❌ Was the total originally different? (overwritten)
  ❌ Who changed the status and when? (no history)
  ❌ Did the customer add items and then remove them? (no trace)
  ❌ What was status at 10:15 AM? (only current state)


  EVENT SOURCING:
  ═══════════════

  User places order → append OrderCreated event
  
  What you have in Event Store:
  ┌───────────────────────────────────────────────────────────────────────────┐
  │ event_id │ aggregate_id │ event_type       │ data                 │ time │
  ├───────────────────────────────────────────────────────────────────────────┤
  │ 1        │ order-42     │ OrderCreated     │ {items:[A,B],total:100}│10:00│
  │ 2        │ order-42     │ ItemAdded        │ {item:C, price:50}    │10:10│
  │ 3        │ order-42     │ OrderConfirmed   │ {confirmedBy:"Harsha"}│10:30│
  │ 4        │ order-42     │ PaymentReceived  │ {amount:150,method:CC}│10:35│
  └───────────────────────────────────────────────────────────────────────────┘
  
  NOW you can answer:
  ✅ When was order created? → Event 1, 10:00 AM
  ✅ What was original total? → $100 (event 1), then item added (event 2) → $150
  ✅ Who confirmed? → "Harsha" at 10:30 AM
  ✅ State at 10:15 AM? → Replay events 1-2 only → status=CREATED, total=$150
  ✅ Complete audit trail → every change recorded, immutable
```

---



> 🔬 **Section Challenge — 1. Traditional CRUD vs Event Sourcing — The Fundamental Shift**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 2. Event Store — The Single Source of Truth

```
  CORE RULES:
  ═══════════
  
  1. Events are IMMUTABLE — never update, never delete
  2. Events are APPEND-ONLY — new events go at the end
  3. Events are ORDERED — sequence matters (cannot reorder)
  4. Events represent FACTS — things that HAPPENED (past tense)
  
  
  EVENT STRUCTURE:
  ════════════════
  
  {
    "eventId": "uuid-123",           // globally unique
    "aggregateId": "order-42",       // which entity this belongs to
    "aggregateType": "Order",        // type of aggregate
    "eventType": "OrderConfirmed",   // what happened
    "version": 3,                    // position in aggregate's stream
    "timestamp": "2024-01-15T10:30:00Z",
    "data": {                        // event-specific payload
      "confirmedBy": "Harsha",
      "confirmedAt": "2024-01-15T10:30:00Z"
    },
    "metadata": {                    // cross-cutting concerns
      "correlationId": "req-abc",
      "causationId": "evt-2",
      "userId": "user-5"
    }
  }

  
  STORAGE OPTIONS:
  ════════════════
  
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ Storage         │ Pros                        │ Cons                     │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ EventStoreDB    │ Purpose-built, subscriptions│ Another DB to manage     │
  │ (eventstore.com)│ Projections built-in         │ Smaller community        │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ PostgreSQL      │ Familiar, ACID, proven       │ Need to build append     │
  │ (as event store)│ JSON columns for event data │ mechanics yourself       │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Apache Kafka    │ Distributed, high throughput │ Not a database           │
  │ (as event log)  │ Natural event streaming      │ Compaction != snapshots  │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ DynamoDB        │ Serverless, scales           │ Vendor lock-in           │
  │ (single table)  │ Conditional writes for OCC   │ Query limitations        │
  └──────────────────────────────────────────────────────────────────────────┘
  
  
  POSTGRESQL EVENT STORE TABLE:
  ════════════════════════════
  
  CREATE TABLE events (
      event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      aggregate_id    VARCHAR(255) NOT NULL,
      aggregate_type  VARCHAR(100) NOT NULL,
      event_type      VARCHAR(100) NOT NULL,
      version         INT NOT NULL,
      data            JSONB NOT NULL,
      metadata        JSONB,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      
      -- Optimistic concurrency: only ONE event per aggregate per version
      UNIQUE (aggregate_id, version)
  );
  
  CREATE INDEX idx_events_aggregate ON events (aggregate_id, version);
```

---



> 🔬 **Section Challenge — 2. Event Store — The Single Source of Truth**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 3. Rebuilding State from Events

```
  To get current state of Order-42:
  
  1. Load ALL events for aggregate_id = "order-42" (ordered by version)
  2. Start with empty state
  3. Apply each event to build up state

  
  ┌─── Event Stream for Order-42 ──────────────────────────────────────────┐
  │                                                                         │
  │  Event 1: OrderCreated{items:[A,B], total:100}                         │
  │  Event 2: ItemAdded{item:C, price:50}                                  │
  │  Event 3: OrderConfirmed{confirmedBy:"Harsha"}                         │
  │  Event 4: PaymentReceived{amount:150, method:"CC"}                     │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  APPLYING EVENTS:
  
  State after Event 1 (OrderCreated):
  { status: "CREATED", items: [A,B], total: 100, version: 1 }
  
  State after Event 2 (ItemAdded):
  { status: "CREATED", items: [A,B,C], total: 150, version: 2 }
  
  State after Event 3 (OrderConfirmed):
  { status: "CONFIRMED", items: [A,B,C], total: 150, version: 3 }
  
  State after Event 4 (PaymentReceived):
  { status: "PAID", items: [A,B,C], total: 150, paid: 150, version: 4 }
  
  → Final state = state after last event
```

```java
// Java implementation:
public class Order {
    private String orderId;
    private OrderStatus status;
    private List<OrderItem> items = new ArrayList<>();
    private BigDecimal total = BigDecimal.ZERO;
    private int version;
    
    // REBUILD from events
    public static Order fromEvents(List<DomainEvent> events) {
        Order order = new Order();
        for (DomainEvent event : events) {
            order.apply(event);
        }
        return order;
    }
    
    // Apply each event type
    private void apply(DomainEvent event) {
        switch (event) {
            case OrderCreated e -> {
                this.orderId = e.orderId();
                this.items = new ArrayList<>(e.items());
                this.total = e.total();
                this.status = OrderStatus.CREATED;
            }
            case ItemAdded e -> {
                this.items.add(e.item());
                this.total = this.total.add(e.price());
            }
            case OrderConfirmed e -> {
                this.status = OrderStatus.CONFIRMED;
            }
            case PaymentReceived e -> {
                this.status = OrderStatus.PAID;
            }
            default -> throw new IllegalArgumentException("Unknown event: " + event);
        }
        this.version++;
    }
    
    // COMMAND: Confirm order → produces event
    public OrderConfirmed confirm(String userId) {
        if (this.status != OrderStatus.CREATED) {
            throw new IllegalStateException("Can only confirm CREATED orders");
        }
        OrderConfirmed event = new OrderConfirmed(this.orderId, userId, Instant.now());
        this.apply(event);  // Apply locally
        return event;        // Return to be persisted in event store
    }
}
```

---



> 🔬 **Section Challenge — 3. Rebuilding State from Events**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 4. Snapshots — Because Replaying 1 Million Events is Slow

```
  PROBLEM:
  ════════
  
  A bank account that's been open for 10 years might have 50,000 transactions.
  Loading current balance = loading 50,000 events and replaying them.
  For every single query!
  
  
  SOLUTION: Snapshots
  ═══════════════════
  
  Periodically save the COMPUTED STATE as a snapshot.
  Then only replay events AFTER the snapshot.
  
  ┌─── Event Stream ──────────────────────────────────────────────────────┐
  │                                                                        │
  │  Events 1-10,000          Snapshot at event 10,000     Events 10,001+  │
  │  ──────────────           ────────────────────────     ──────────────  │
  │  Deposited $100          ┌─────────────────────────┐   Deposited $50   │
  │  Withdrew $30            │ {                        │   Withdrew $20   │
  │  Deposited $200          │   accountId: "acc-1",   │   Deposited $75  │
  │  ...                     │   balance: $45,230.00,  │   ...            │
  │  ... 9,997 more ...      │   version: 10000,       │                  │
  │                          │   status: "ACTIVE"       │                  │
  │                          │ }                        │                  │
  │                          └─────────────────────────┘                   │
  │                                                                        │
  └────────────────────────────────────────────────────────────────────────┘
  
  To get current state:
  1. Load snapshot (version 10,000, state: {balance: $45,230})
  2. Load events AFTER version 10,000 (only 3 events!)
  3. Replay only those 3 events on top of snapshot
  
  Instead of replaying 10,003 events → replay 3 events
  
  
  WHEN TO SNAPSHOT:
  ═════════════════
  
  Strategy 1: Every N events (e.g., every 100 events)
  Strategy 2: Every N minutes (e.g., every hour)
  Strategy 3: When rebuild time exceeds threshold (e.g., > 100ms)
  
  Typical: snapshot every 100-500 events
```

---



> 🔬 **Section Challenge — 4. Snapshots — Because Replaying 1 Million Events is Slow**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 5. Event Versioning — What Happens When Events Change

```
  THE PROBLEM:
  ════════════
  
  Version 1 of your app stored events like:
  OrderCreated { customer: "Harsha", total: 100 }
  
  Version 2 needs split name:
  OrderCreated { firstName: "Harsha", lastName: "V", total: 100, currency: "USD" }
  
  Old events in the store have the V1 format.
  You can NEVER change them (immutable!).
  How do you handle this?
  
  
  SOLUTION: Upcasters
  ═══════════════════
  
  When loading events, transform old format → new format on the fly:
  
  class OrderCreatedV1toV2Upcaster {
      public OrderCreatedV2 upcast(OrderCreatedV1 oldEvent) {
          return new OrderCreatedV2(
              firstName: oldEvent.customer.split(" ")[0],  // "Harsha"
              lastName: oldEvent.customer.split(" ")[1],    // "V" (or "")
              total: oldEvent.total,
              currency: "USD"  // default, didn't exist in V1
          );
      }
  }
  
  Event loaded from store (V1) → upcaster → V2 format → apply to aggregate
  
  
  VERSIONING STRATEGIES:
  ══════════════════════
  
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ Strategy              │ How                        │ When to Use         │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Upcasting (runtime)   │ Transform on read           │ Additive changes    │
  │                       │ Old events stay in store    │ Rename/split fields │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Weak schema           │ Use JSONB, ignore unknown   │ Adding new optional │
  │                       │ fields, defaults for missing │ fields              │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ New event type        │ OrderCreatedV2 as new type  │ Breaking changes    │
  │                       │ Both V1 and V2 coexist      │ Semantic shifts      │
  ├──────────────────────────────────────────────────────────────────────────┤
  │ Copy-transform        │ Migrate entire stream        │ Last resort         │
  │                       │ Transform all events         │ Expensive but clean │
  └──────────────────────────────────────────────────────────────────────────┘
  
  GOLDEN RULE: Events are contracts. Be backward-compatible. 
  Add fields (with defaults), never remove or rename in the same type.
```

---



> 🔬 **Section Challenge — 5. Event Versioning — What Happens When Events Change**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 6. CQRS — Separate Read and Write Models

```
  COMMAND QUERY RESPONSIBILITY SEGREGATION
  
  
  TRADITIONAL (single model for read AND write):
  ══════════════════════════════════════════════
  
  ┌── One Database ─────────────────────────────────────────────┐
  │                                                              │
  │  Orders Table                                                │
  │  ┌────────────────────────────────────────────────────────┐ │
  │  │ id │ customer_id │ status │ total │ items_json │ ...   │ │
  │  └────────────────────────────────────────────────────────┘ │
  │                                                              │
  │  Used for:                                                   │
  │  WRITES: INSERT, UPDATE (normalized, constraints, ACID)     │
  │  READS: Complex JOINs, aggregations, search                  │
  │                                                              │
  │  Problem: Can't optimize for BOTH patterns                   │
  │  • Normalized for writes → slow for complex reads           │
  │  • Denormalized for reads → complex for writes              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
  
  
  CQRS (separate models):
  ═══════════════════════
  
  ┌─── COMMAND SIDE (Write) ────┐   ┌─── QUERY SIDE (Read) ────────────┐
  │                              │   │                                   │
  │  Handles:                    │   │  Handles:                         │
  │  CreateOrder, CancelOrder    │   │  GetOrderDetails, SearchOrders    │
  │  AddItem, ConfirmPayment     │   │  GetDashboardSummary              │
  │                              │   │                                   │
  │  Model: Domain objects       │   │  Model: DTOs / View models        │
  │  (rich behavior, invariants) │   │  (flat, denormalized, fast)       │
  │                              │   │                                   │
  │  Storage: Event Store        │   │  Storage: Read-optimized DB       │
  │  (or normalized RDBMS)       │   │  (materialized views, Elastic,    │
  │                              │   │   Redis, denormalized tables)     │
  │                              │   │                                   │
  └──────────────┬───────────────┘   └───────────────┬───────────────────┘
                 │                                     ▲
                 │    Events / Change stream            │
                 └─────────────────────────────────────┘
                       (async projection)
  
  
  THE KEY INSIGHT:
  ════════════════
  
  Read and write have DIFFERENT requirements:
  
  WRITE:                              READ:
  • Consistency (ACID)                • Speed (sub-millisecond)
  • Validation (business rules)       • Flexibility (many query patterns)
  • Normalized (no redundancy)        • Denormalized (no JOINs needed)
  • Low throughput (fewer writes)     • High throughput (many reads)
  
  Optimizing for both in one model = compromise on both.
  Separating them = optimize each independently.
```

---

## 7. Projections — Building Read Models from Events

```
  A PROJECTION is a function that processes events and builds a read-optimized view.
  
  
  EVENT STREAM:
  ═════════════
  OrderCreated{id:42, customer:"Harsha", items:[A,B], total:100}
  OrderConfirmed{id:42}
  PaymentReceived{id:42, amount:100}
  OrderCreated{id:43, customer:"John", items:[C], total:50}
  OrderShipped{id:42, tracking:"TRK-123"}
  
  
  PROJECTION 1: Order Details (for customer portal)
  ══════════════════════════════════════════════════
  
  ┌── order_details_view ─────────────────────────────────────────┐
  │ order_id │ customer │ status  │ total │ tracking │ items      │
  ├────────────────────────────────────────────────────────────────┤
  │ 42       │ Harsha   │ SHIPPED │ 100   │ TRK-123  │ [A,B]     │
  │ 43       │ John     │ CREATED │ 50    │ null     │ [C]       │
  └────────────────────────────────────────────────────────────────┘
  
  
  PROJECTION 2: Dashboard Summary (for admin)
  ════════════════════════════════════════════
  
  ┌── dashboard_stats ────────────────────────┐
  │ total_orders │ total_revenue │ avg_order   │
  ├────────────────────────────────────────────┤
  │ 2            │ 150           │ 75          │
  └────────────────────────────────────────────┘
  
  
  PROJECTION 3: Customer Order Count (for analytics)
  ═══════════════════════════════════════════════════
  
  ┌── customer_stats ─────────────────┐
  │ customer │ order_count │ total_spent│
  ├───────────────────────────────────┤
  │ Harsha   │ 1           │ 100       │
  │ John     │ 1           │ 50        │
  └───────────────────────────────────┘
  
  
  Same events → 3 completely different read models.
  Each optimized for its specific query pattern.
  No JOINs needed — data is pre-computed.
```

```java
// Projection implementation:
@Component
public class OrderDetailsProjection {
    
    private final OrderDetailsViewRepository viewRepo;
    
    @EventHandler  // Framework-specific annotation (Axon, custom, etc.)
    public void on(OrderCreated event) {
        OrderDetailsView view = new OrderDetailsView();
        view.setOrderId(event.orderId());
        view.setCustomer(event.customer());
        view.setStatus("CREATED");
        view.setTotal(event.total());
        view.setItems(event.items());
        viewRepo.save(view);
    }
    
    @EventHandler
    public void on(OrderConfirmed event) {
        OrderDetailsView view = viewRepo.findById(event.orderId()).orElseThrow();
        view.setStatus("CONFIRMED");
        viewRepo.save(view);
    }
    
    @EventHandler
    public void on(OrderShipped event) {
        OrderDetailsView view = viewRepo.findById(event.orderId()).orElseThrow();
        view.setStatus("SHIPPED");
        view.setTracking(event.trackingNumber());
        viewRepo.save(view);
    }
}
```

---



> 🔬 **Section Challenge — 7. Projections — Building Read Models from Events**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 8. The Saga Pattern — Distributed Transactions Without 2PC

```
  THE PROBLEM:
  ════════════
  
  E-commerce order involves 3 services:
  1. Order Service → create order
  2. Payment Service → charge credit card
  3. Inventory Service → reserve stock
  
  In monolith: BEGIN TRANSACTION; do all three; COMMIT;
  In microservices: Each service has its own database!
  Cannot use traditional distributed transactions (2PC is slow, fragile).
  
  
  THE SAGA SOLUTION:
  ═══════════════════
  
  A saga is a sequence of LOCAL transactions.
  Each step either succeeds (move to next) or fails (compensate previous).
  
  
  HAPPY PATH:
  ═══════════
  
  ┌─── Order Service ─────┐   ┌─── Payment Service ────┐   ┌── Inventory Service ──┐
  │                        │   │                         │   │                        │
  │ Step 1: Create order   │──→│ Step 2: Charge card     │──→│ Step 3: Reserve stock  │
  │ (status: PENDING)      │   │ ($150 from CC)          │   │ (2 units of product A) │
  │                        │   │                         │   │                        │
  │ ✅ Success             │   │ ✅ Success              │   │ ✅ Success             │
  │                        │   │                         │   │                        │
  │ Step 4: Confirm order  │←──│                         │←──│                        │
  │ (status: CONFIRMED)    │   │                         │   │                        │
  └────────────────────────┘   └─────────────────────────┘   └────────────────────────┘
  
  
  FAILURE PATH (Step 3 fails — out of stock):
  ════════════════════════════════════════════
  
  ┌─── Order Service ─────┐   ┌─── Payment Service ────┐   ┌── Inventory Service ──┐
  │                        │   │                         │   │                        │
  │ Step 1: Create order   │──→│ Step 2: Charge card     │──→│ Step 3: Reserve stock  │
  │ (status: PENDING)      │   │ ($150 from CC)          │   │ ❌ OUT OF STOCK!       │
  │                        │   │                         │   │                        │
  │ Compensate Step 1:     │←──│ Compensate Step 2:      │←──│ (nothing to undo)      │
  │ Cancel order           │   │ REFUND $150             │   │                        │
  │ (status: CANCELLED)    │   │                         │   │                        │
  └────────────────────────┘   └─────────────────────────┘   └────────────────────────┘
  
  
  EACH STEP HAS A COMPENSATING ACTION:
  ═════════════════════════════════════
  
  ┌──────────────────────────────────────────────────────────┐
  │ Step                  │ Compensating Action               │
  ├──────────────────────────────────────────────────────────┤
  │ Create Order          │ Cancel Order                      │
  │ Charge Credit Card    │ Refund Credit Card                │
  │ Reserve Inventory     │ Release Inventory                 │
  │ Send Email            │ Send Cancellation Email            │
  │ Ship Package          │ ?? (can't unsend! → manual handle)│
  └──────────────────────────────────────────────────────────┘
  
  IMPORTANT: Compensations are NOT rollbacks. They're new transactions
  that logically undo the previous effect. The charge→refund BOTH
  appear in the payment history (audit trail preserved).
```

---



> 🔬 **Section Challenge — 8. The Saga Pattern — Distributed Transactions Without 2PC**
>
> **Challenge 1 (Reasoning):** Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?
> <details><summary>Answer</summary>
>
> READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).
> </details>
>

## 9. Orchestration vs Choreography — Two Saga Approaches

```
  ORCHESTRATION (Central Coordinator):
  ════════════════════════════════════
  
  One service (Saga Orchestrator) tells other services what to do.
  Like a conductor leading an orchestra.
  
  ┌─── Saga Orchestrator ──────────────────────────────────────────────┐
  │                                                                     │
  │  State Machine:                                                     │
  │  PENDING → PAYMENT_STARTED → INVENTORY_RESERVED → CONFIRMED       │
  │                                                                     │
  │  1. Create order (local)                                           │
  │  2. Send command → Payment Service: "Charge $150"                  │
  │  3. Wait for reply: "Payment OK" or "Payment Failed"              │
  │  4. Send command → Inventory Service: "Reserve 2 units"           │
  │  5. Wait for reply: "Reserved OK" or "Out of Stock"               │
  │  6. If all OK → confirm order                                      │
  │  7. If any fails → send compensate commands to already-done steps  │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
  
  PROS:                              CONS:
  ✅ Easy to understand the flow     ❌ Single point of failure
  ✅ Easy to add new steps           ❌ Orchestrator can become complex
  ✅ Centralized error handling      ❌ Tight coupling to orchestrator
  ✅ Easy to test and debug          ❌ Orchestrator knows all services
  
  
  CHOREOGRAPHY (Event-driven, no coordinator):
  ═════════════════════════════════════════════
  
  Each service listens for events and reacts. Like dancers responding to music.
  
  Order Service                Payment Service              Inventory Service
  ─────────────                ───────────────              ─────────────────
  Create order ──→ publishes "OrderCreated" event
                               │
                   Listens for "OrderCreated"
                   Charges card
                   ──→ publishes "PaymentCompleted" event
                                                            │
                                              Listens for "PaymentCompleted"
                                              Reserves stock
                                              ──→ publishes "StockReserved"
  │
  Listens for "StockReserved"
  Confirms order
  
  PROS:                              CONS:
  ✅ Loose coupling                  ❌ Hard to understand full flow
  ✅ No single point of failure      ❌ Hard to debug (trace events)
  ✅ Each service is autonomous      ❌ Cyclic dependencies possible
  ✅ Easy to add consumers           ❌ Compensation logic is scattered
  
  
  WHEN TO USE WHICH:
  ══════════════════
  
  Orchestration: Complex flows (5+ steps), need clear visibility, critical paths
  Choreography: Simple flows (2-3 steps), high autonomy, scalability priority
```

---



> 🔬 **Section Challenge — 9. Orchestration vs Choreography — Two Saga Approaches**
>>>

## 10. When to Use (and NOT Use) Event Sourcing

```
  ✅ USE EVENT SOURCING WHEN:
  ═══════════════════════════
  
  • Audit trail is a REQUIREMENT (finance, healthcare, compliance)
  • You need temporal queries ("what was state at time T?")
  • Domain has distinct events (orders, payments, bookings)
  • Debugging requires replaying exact sequence of events
  • Multiple read models needed from same data
  • Event-driven architecture already in place
  
  REAL EXAMPLES:
  • Banking: Every transaction is an event (ledger is event-sourced by nature!)
  • E-commerce: Order lifecycle (created→confirmed→paid→shipped→delivered)
  • Git: Commits are events, working directory is current state (projection!)
  • Accounting: Double-entry bookkeeping IS event sourcing
  
  
  ❌ DO NOT USE EVENT SOURCING WHEN:
  ═══════════════════════════════════
  
  • Simple CRUD with no audit needs
  • Entities with many frequent updates (100+ events/second per entity)
  • Complex queries on current state (easier with traditional DB)
  • Small team unfamiliar with the pattern (steep learning curve)
  • No clear domain events (if you can't name the events, don't use it)
  
  
  COMPLEXITY TRADE-OFFS:
  ══════════════════════
  
  TRADITIONAL                          EVENT SOURCED
  ───────────                          ─────────────
  Simple reads (just query DB)         Complex reads (build projections)
  Complex writes (ensure consistency)  Simple writes (just append event)
  No built-in audit trail              Full audit trail for free
  Schema migrations                    Event versioning / upcasting
  One model                            Multiple models (CQRS)
  SQL knowledge sufficient             Event modeling expertise needed
  
  
  START SIMPLE:
  Use CQRS without event sourcing first.
  Separate read/write models with traditional DB.
  Add event sourcing later IF you need the audit trail.
```

---

> **Next Chapter**: [Kubernetes Deep Dive →](Ch67_Kubernetes_Deep_Dive.md)


> 🔬 **Section Challenge — 10. When to Use (and NOT Use) Event Sourcing**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

