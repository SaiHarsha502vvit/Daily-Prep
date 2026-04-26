> **Navigation**: [← ERP Advanced](02_ERP_Advanced.md) | [Back to Index](00_INDEX.md)

# 🌐 Distributed Systems & Microservices Patterns — Deep Guide

> _"In a monolith, a function call either succeeds or fails — atomically. In distributed systems, a network call can succeed, fail, or hang forever in the middle. This changes everything about how you design transactions."_

---

# PART 0: The 5W+H Framework

| Question | Distributed Systems Context |
| :--- | :--- |
| **WHAT** | Patterns that maintain data consistency, reliability, and correctness when your system is split across multiple services, databases, and servers. |
| **WHY** | Microservices split a monolith's single DB into many. A single business operation (place order) now spans Order Service, Inventory Service, Payment Service — each with its own DB. How do you keep them consistent? |
| **WHEN** | Any time you have 2+ services that must coordinate state changes. E-commerce checkout, bank transfers, ride-hailing assignment. |
| **WHERE** | Netflix (microservices at scale), Amazon (each team owns a service + DB), Uber (distributed transaction challenges). |
| **WHO** | Gregor Hohpe (Enterprise Integration Patterns), Chris Richardson (Microservices Patterns), Pat Helland (distributed transactions). |
| **HOW** | Sagas, Outbox Pattern, CQRS, Event Sourcing, 2-Phase Commit — each solves a different consistency challenge. |

---

# PART 1: The Problem — Why Distributed Transactions Are Hard

---

```
MONOLITH ERA (simple):
  Place Order:
    BEGIN TRANSACTION;
    INSERT INTO orders ...;
    UPDATE inventory SET stock = stock - 1 ...;
    INSERT INTO payments ...;
    COMMIT;
  
  One DB → ONE TRANSACTION → ACID guaranteed.
  Either ALL happen, or NONE happen.

MICROSERVICES ERA (hard):
  Place Order:
    1. Call Order Service    → writes to orders_db
    2. Call Inventory Service → writes to inventory_db
    3. Call Payment Service  → writes to payments_db
  
  THREE DIFFERENT DATABASES → No distributed ACID transaction possible!
  (Well, 2PC exists, but it's problematic — see below)
  
  WHAT CAN GO WRONG:
  Scenario: Order created ✓ → Inventory reserved ✓ → Payment fails ✗
  → Customer charged? No. Order confirmed? Yes. Item reserved? Yes.
  → Data is INCONSISTENT across services!

THE CAP THEOREM (Brewer, 2000):
  In a distributed system, during a network partition you can have AT MOST 2 of 3:
  
  C - CONSISTENCY: Every read returns the most recent write (or an error)
  A - AVAILABILITY: Every request gets a response (not necessarily latest data)
  P - PARTITION TOLERANCE: System continues despite network partitions
  
  You MUST choose P (network partitions are real — cables fail, routers crash).
  So you choose between: CP (consistent but may be unavailable) 
                     vs: AP (always available but may be stale)
  
  ANALOGY: Google Maps vs GPS in a tunnel.
  CP: Don't show map until network confirmed → correct but blocked.
  AP: Show last known map → available but potentially stale.
  
  Most microservices choose AP:
  "It's better to place an order (even if inventory might be 0)
   than to block the entire checkout because inventory service is slow."
  → Handle inconsistency AFTER the fact with compensating transactions.

BASE (opposite of ACID for distributed systems):
  Basically Available: always respond
  Soft State: state may change without input (eventual consistency propagating)
  Eventually Consistent: given no new writes, all replicas converge to same value
  
  This is the trade-off distributed systems accept.
```

---

# PART 2: 2-Phase Commit (2PC) — The Old Way (And Why It's Fragile)

---

```
WHAT IS 2PC?
  An attempt to extend ACID across distributed systems.
  One "coordinator" orchestrates a commit across all "participants."
  
PHASE 1 — PREPARE:
  Coordinator → all participants: "Can you commit?"
  Each participant:
    - Writes changes to WAL, acquires locks
    - Replies YES (ready) or NO (can't commit)
  
PHASE 2 — COMMIT:
  If ALL replied YES → Coordinator sends COMMIT to all participants.
  If ANY replied NO → Coordinator sends ROLLBACK to all participants.

THE BLOCKING PROBLEM:
  What if the Coordinator CRASHES between Phase 1 and Phase 2?
  
  All participants have said YES and are locked!
  They're waiting for the coordinator's decision.
  Other transactions trying to access those rows are BLOCKED.
  Until coordinator recovers → potentially minutes of downtime!
  
  This is the "in-doubt transaction" problem.
  In high-traffic systems, blocking = unacceptable.

WHEN 2PC IS OK:
  ✓ Same datacenter, short transactions, rare partitions
  ✓ Tightly-coupled systems where both DBs are under your control
  ✓ Used in: MySQL X/A transactions, Java JTA, database replication
  
  NOT OK for: loosely-coupled microservices, cross-cloud, long transactions
```

---

# PART 3: SAGA Pattern — The Modern Solution

---

```
THE INSIGHT:
  Instead of one distributed ACID transaction, break it into a sequence
  of LOCAL transactions, each publishing an event/message when done.
  If any step fails, run COMPENSATING TRANSACTIONS to undo previous steps.
  
  ANALOGY: Hotel booking trip.
  You book: flights ✓ → hotel ✓ → car rental ✗ (no availability)
  
  Compensating: Cancel hotel ↩ → Cancel flights ↩
  
  Notice: You didn't HOLD the flight booking "in a pending state" for 5 minutes
  while you waited for the hotel and car. You booked it, COMMITTED it,
  then cancelled it when needed. The cancellation IS the rollback.

TWO SAGA STYLES:

CHOREOGRAPHY SAGA (event-driven):
  Each service listens for events, does its work, publishes next event.
  No central coordinator.
  
  Order Placed Event
         │
         ▼
  Inventory Service (listens)
  → Reserve stock
  → Publish: "Inventory Reserved Event"
  OR → Publish: "Inventory Failed Event" (triggers compensation)
         │
         ▼
  Payment Service (listens to "Inventory Reserved")
  → Charge payment
  → Publish: "Payment Completed Event"
  OR → Publish: "Payment Failed Event" (triggers compensation)
         │
         ▼
  Shipping Service (listens to "Payment Completed")
  → Schedule shipment
  → Publish: "Order Fulfilled Event"
  
  PROS: Simple, decoupled, easy to add new services
  CONS: Hard to track overall status, complex compensations, "lost events"

ORCHESTRATION SAGA (centralized):
  One "Saga Orchestrator" (a workflow engine) tells each service what to do.
  Tracks state, handles failures, triggers compensations.
  
  OrderSaga (orchestrator):
    1. → Call Inventory: reserve(orderId, items)
       ← OK → step 2
       ← FAIL → [done, order failed]
    2. → Call Payment: charge(orderId, amount)
       ← OK → step 3
       ← FAIL → Call Inventory: cancel-reserve(orderId) → [done, order failed]
    3. → Call Shipping: schedule(orderId)
       ← OK → [done, order fulfilled]
       ← FAIL → Call Payment: refund(orderId) → Call Inventory: cancel-reserve(orderId)
  
  PROS: Clear state machine, easy to monitor/debug, explicit compensations
  CONS: Orchestrator can become a bottleneck, more coupling

COMPENSATING TRANSACTIONS:
  NOT a rollback! The original transaction COMMITTED.
  A compensation is a NEW transaction that logically undoes the effect.
  
  Original:     INSERT INTO reservations (id, status) VALUES (1, 'reserved');
  Compensation: UPDATE reservations SET status = 'cancelled' WHERE id = 1;
  
  The original commit IS in the audit log — this is actually GOOD for compliance.
  "We tried, it failed, we compensated" is a valid business record.
```

```java
// Orchestration Saga implementation with Spring
@Service
@Slf4j
public class OrderSagaOrchestrator {
    
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final ShippingClient shippingClient;
    private final OrderRepository orderRepo;
    
    @Transactional
    public OrderResult processOrder(CreateOrderRequest request) {
        Order order = orderRepo.save(new Order(request, OrderStatus.PENDING));
        
        // Step 1: Reserve inventory
        ReservationResult reservation = inventoryClient.reserve(
            order.getId(), request.getItems());
        
        if (!reservation.isSuccess()) {
            order.fail("Inventory unavailable");
            orderRepo.save(order);
            return OrderResult.failed("OUT_OF_STOCK");
        }
        
        // Step 2: Process payment
        PaymentResult payment = paymentClient.charge(
            order.getId(), request.getAmount(), request.getPaymentMethod());
        
        if (!payment.isSuccess()) {
            // COMPENSATION: cancel that reservation
            inventoryClient.cancelReservation(reservation.getReservationId());
            order.fail("Payment declined");
            orderRepo.save(order);
            return OrderResult.failed("PAYMENT_DECLINED");
        }
        
        // Step 3: Schedule shipping
        ShippingResult shipping = shippingClient.schedule(
            order.getId(), request.getDeliveryAddress());
        
        if (!shipping.isSuccess()) {
            // COMPENSATION: refund payment, cancel reservation
            paymentClient.refund(payment.getPaymentId());
            inventoryClient.cancelReservation(reservation.getReservationId());
            order.fail("Shipping unavailable");
            orderRepo.save(order);
            return OrderResult.failed("SHIPPING_UNAVAILABLE");
        }
        
        order.complete(payment.getPaymentId(), shipping.getTrackingId());
        orderRepo.save(order);
        return OrderResult.success(order);
    }
}
```

---

# PART 4: Outbox Pattern — Guaranteed Event Publishing

---

```
THE PROBLEM:
  After your service commits a DB transaction, you need to publish an event
  to Kafka/RabbitMQ to notify other services.
  
  // UNSAFE PATTERN:
  db.beginTransaction();
  order = db.insertOrder(orderData);      // ← Transaction committed
  kafka.publish("order-created", order);  // ← WHAT IF THIS FAILS?
  db.commit();
  
  OR:
  db.beginTransaction();
  order = db.insertOrder(orderData);
  db.commit();         // ← Committed!
  kafka.publish("order-created", order);  // ← App crashes here!
  // Order is saved but event never published.
  // Inventory Service never knows → INCONSISTENCY.

THE OUTBOX SOLUTION:
  Write the event to an OUTBOX TABLE in the SAME DB transaction as your data.
  A separate "Message Relay" process reads the outbox and publishes to Kafka.
  At-least-once delivery guaranteed!
  
  ATOMIC: DB commit includes both the order row AND the outbox row.
          Either both persist, or neither.
  
  RELAY: Separate process reads outbox → publishes to Kafka → marks as sent.
         If relay crashes before marking as sent → just replays! (idempotent events)
```

```sql
-- The outbox table
CREATE TABLE outbox_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type  VARCHAR(100) NOT NULL,
    payload     JSONB NOT NULL,
    status      VARCHAR(20) DEFAULT 'PENDING',  -- PENDING / SENT / FAILED
    created_at  TIMESTAMP DEFAULT NOW(),
    sent_at     TIMESTAMP
);

-- Index for the relay to efficiently poll pending events
CREATE INDEX idx_outbox_pending ON outbox_events (created_at)
WHERE status = 'PENDING';
```

```java
@Service
@Transactional
public class OrderService {
    
    @Autowired private OrderRepository orderRepo;
    @Autowired private OutboxRepository outboxRepo;
    
    public Order createOrder(CreateOrderRequest req) {
        // Step 1: Save the order
        Order order = orderRepo.save(Order.from(req));
        
        // Step 2: Write event to OUTBOX — SAME TRANSACTION!
        OutboxEvent event = new OutboxEvent(
            "ORDER_CREATED",
            Map.of(
                "orderId",    order.getId(),
                "customerId", order.getCustomerId(),
                "total",      order.getTotal(),
                "items",      order.getItems()
            )
        );
        outboxRepo.save(event);
        
        // When this method returns, BOTH order AND outbox event
        // are committed atomically. No split-brain possible!
        return order;
    }
}

// Relay — runs as a scheduled job or Kafka Streams processor
@Component
public class OutboxRelayService {
    
    @Scheduled(fixedDelay = 1000)  // every second
    @Transactional
    public void relay() {
        List<OutboxEvent> pending = outboxRepo.findPendingEvents(100);
        
        for (OutboxEvent event : pending) {
            try {
                kafkaTemplate.send("domain-events", event.getPayload());
                event.markSent();
                outboxRepo.save(event);
            } catch (Exception e) {
                log.error("Failed to publish event {}", event.getId(), e);
                // Leave as PENDING → will retry next run
            }
        }
    }
}
// TOOLS: Debezium (CDC-based outbox), Transactional Outbox with Polling
```

---

# PART 5: CQRS — Command Query Responsibility Segregation

---

```
THE PROBLEM:
  Your Orders table serves two very different purposes:
  
  WRITES (Commands): INSERT/UPDATE individual orders. Need ACID, locking.
  READS (Queries): Join 8 tables to build a dashboard showing order analytics.
                   Heavy, slow, blocks writes.
  
  Using the SAME database schema for both:
  → Complex queries slow down your write path
  → Indexes optimized for reading slow down writes
  → Can't scale reads and writes independently

CQRS SOLUTION:
  Separate your model into:
  COMMAND SIDE (writes): Normalized, ACID-safe, simple schema
  QUERY SIDE (reads):  Denormalized, optimized for specific read patterns
  
  ANALOGY: A restaurant's kitchen vs the menu board.
  Kitchen (write side): Raw ingredients, complex prep, one at a time.
  Menu board (read side): Pre-computed "today's specials" for fast reading.
  The kitchen UPDATES the board when dishes are ready.
  
  Synchronization: Events from the write side → update the read models.
  The read model is a DERIVED VIEW of the write data.

READ MODELS (materialized views):
  Can be: A separate database table, Redis, Elasticsearch, a DB view,
           a computed column, or even a separate service.
```

```java
// COMMAND SIDE: Simple normalized domain model
@Entity @Table(name = "orders")
public class Order {
    @Id private UUID id;
    private UUID customerId;
    private BigDecimal total;
    private OrderStatus status;
    
    @OneToMany(cascade = ALL)
    private List<OrderItem> items;
    // ... domain logic
}

// QUERY SIDE: Denormalized for dashboard rendering
// Could be in same DB or a separate read-optimized store (Redis, Elasticsearch)
@Entity @Table(name = "order_dashboard_view")
public class OrderDashboardProjection {
    @Id private UUID orderId;
    private String customerName;   // denormalized from customers table
    private String customerEmail;
    private Integer itemCount;     // pre-computed
    private BigDecimal total;
    private String status;
    private String[] productNames; // denormalized array
    private LocalDateTime createdAt;
    // This can be queried in ONE round trip — no joins needed!
}

// EVENT HANDLER: Keeps read model in sync
@Component
public class OrderProjectionHandler {
    
    @Autowired private OrderDashboardProjectionRepository projectionRepo;
    @Autowired private CustomerRepository customerRepo;
    
    @EventHandler
    public void on(OrderCreatedEvent event) {
        Customer c = customerRepo.findById(event.getCustomerId()).orElseThrow();
        
        // Build the denormalized projection
        OrderDashboardProjection view = new OrderDashboardProjection(
            event.getOrderId(),
            c.getName(),
            c.getEmail(),
            event.getItems().size(),
            event.getTotal(),
            "PENDING",
            event.getItems().stream().map(i -> i.getProductName()).toArray(String[]::new),
            event.getCreatedAt()
        );
        projectionRepo.save(view);
    }
    
    @EventHandler
    public void on(OrderStatusChangedEvent event) {
        projectionRepo.findById(event.getOrderId()).ifPresent(view -> {
            view.setStatus(event.getNewStatus().toString());
            projectionRepo.save(view);
        });
    }
}
```

---

# PART 6: Event Sourcing — State as a Stream of Events

---

```
TRADITIONAL DATA STORAGE:
  Store CURRENT STATE: orders.status = 'DELIVERED'
  If you want history: you've lost it (unless you added an audit table).
  
EVENT SOURCING:
  Store ALL EVENTS that led to current state:
  OrderCreated { id=1, items=[...], total=99.99 }
  OrderPaid    { id=1, paymentId=xyz }
  OrderShipped { id=1, trackingId=abc }
  OrderDelivered { id=1, deliveredAt=2024-01-15 }
  
  Current state = REPLAY all events from the beginning.
  HISTORY is first-class, not an afterthought.
  
ANALOGY: Bank statement vs account balance.
  Traditional: "Your balance is $1,234."  → no history.
  Event sourced: "Here's every transaction since account opened."
  → Current balance = sum of all credit/debit events.
  → Can reconstruct balance at ANY point in time.
  → Full audit trail built in.

BENEFITS:
  ✓ Complete audit trail (regulatory compliance, debugging)
  ✓ Replay events to rebuild read models (add new projection? replay from start)
  ✓ Time travel: "What was the order status on Jan 1st?"
  ✓ Event-driven: natural integration with messaging systems
  
COSTS:
  ✗ Querying current state requires replaying events (mitigate with snapshots)
  ✗ Event schema evolution is tricky (old events must still work with new code)
  ✗ Eventual consistency between write (events) and read (projections)
  ✗ Complexity — only use when audit/history is genuinely needed

WHEN TO USE EVENT SOURCING:
  ✓ Financial systems (every cent movement must be auditable)
  ✓ Order management (full lifecycle tracking required)
  ✓ Healthcare records (immutable patient history)
  ✗ User profile (no meaningful history needed)
  ✗ Session data (ephemeral, no audit value)
```

---

# Quick Reference — Distributed Patterns Decision Tree

```
NEED TO COORDINATE ACROSS MULTIPLE SERVICES?
  │
  ├─ Few services, same datacenter, short transactions?
  │    → Consider 2-Phase Commit (via XA or JTA)
  │
  ├─ Long-running business process across many services?
  │    ├─ Services loosely coupled, add new ones often?
  │    │    → CHOREOGRAPHY SAGA (event-driven)
  │    └─ Complex compensations, need full visibility?
  │         → ORCHESTRATION SAGA (state machine)
  │
  ├─ Need guaranteed event publishing after DB commit?
  │    → OUTBOX PATTERN
  │
  ├─ Read and write workloads have different needs?
  │    → CQRS (separate read/write models)
  │
  └─ Need full audit trail / time-travel / regulatory compliance?
       → EVENT SOURCING (+ CQRS for read projections)
```

| Pattern | Consistency | Complexity | Use Case |
|---|---|---|---|
| **2PC** | Strong | Medium | Same DC, short txns, tightly coupled |
| **Saga (Choreography)** | Eventual | Low-Medium | Loosely coupled, autonomous services |
| **Saga (Orchestration)** | Eventual | Medium-High | Complex workflows, compensation-heavy |
| **Outbox** | Strong (publish) | Low | Guaranteed event publishing |
| **CQRS** | Eventual (read) | Medium | Different read/write needs |
| **Event Sourcing** | Eventual | High | Audit, history, compliance |

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Kafka (event backbone)** | [MLOps Guide](../21_Python_ML_DL_NLP/13_MLOps_Production.md) — data pipelines |
| **Database ACID** | [Transactions ACID](../08_SQL/13_Transactions_ACID.md) |
| **MVCC in isolation** | [SQL Internals Deep](../08_SQL/49_SQL_Internals_Deep.md) |
| **API Gateway patterns** | [ERP Advanced](02_ERP_Advanced.md) — microservices architecture |
| **Kubernetes (infra)** | [DevOps Guide](../22_DevOps/00_DevOps_Fundamentals.md) |

