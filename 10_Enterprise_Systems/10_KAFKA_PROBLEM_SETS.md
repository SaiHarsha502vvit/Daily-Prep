# 📝 Enterprise Systems — Kafka & Messaging Problem Sets

> **Problem Sets PS3 & PS4** — Semester 4 Unit  
> **Module:** `10_Enterprise_Systems/05_Messaging_Kafka.md`  
> **Prerequisites:** Kafka architecture fundamentals · Spring Kafka · Enterprise Integration Patterns

---

## Problem Set ENTERPRISE-PS3 — Kafka & Event Streaming

---

### Part A: Theoretical

**A1 (Easy).** What is the difference between a Kafka **topic**, **partition**, and **consumer group**? Draw the relationship when 1 topic has 4 partitions and 2 consumer group instances.

<details><summary>Answer</summary>

**Topic:** A named feed of messages (like a database table, but append-only).

**Partition:** A topic is split into N ordered, immutable logs. Each partition is an independent, ordered sequence. Producers write to partitions; consumers read from partitions.

**Consumer group:** A set of consumers that together consume a topic. Each partition is assigned to exactly ONE consumer in the group at a time — parallelism without duplicate processing.

```
Topic: "order-placed" (4 partitions)
Partition 0 ──┐
Partition 1 ──┤──► Consumer Group "inventory-service"
Partition 2 ──┤      Consumer A handles P0, P1
Partition 3 ──┘      Consumer B handles P2, P3

Same topic, second group:
Partition 0 ──┐
Partition 1 ──┤──► Consumer Group "notification-service"
Partition 2 ──┤      Consumer C handles P0, P1
Partition 3 ──┘      Consumer D handles P2, P3
```

Each consumer group gets ALL messages independently. Adding a second group does not affect the first.

🔴 **Erklärung:** If you have MORE consumers in a group than partitions, the extra consumers sit idle — no partition to assign. Scale partitions first, then scale consumers to match.
</details>

---

**A2 (Medium).** A developer wants order events for the same `customerId` to always be processed in order. What Kafka concept guarantees this, and what is the partitioning strategy?

<details><summary>Answer</summary>

**Kafka guarantee:** Within a single partition, messages are totally ordered. Across partitions, there is NO ordering guarantee.

**Partitioning strategy:** Use `customerId` as the **partition key**:

```java
// Producer: always sends messages with same key to same partition
kafkaTemplate.send("order-events", 
    order.getCustomerId().toString(),  // key → determines partition
    orderEvent);                        // value
```

`hash(customerId) % numPartitions` → same customerId always maps to same partition → all events for that customer arrive in order.

**Warning:** If one customer generates 99% of traffic (celebrity problem), that partition becomes a hot spot. Solution: add a suffix to the key: `customerId + "-" + (random % numSubPartitions)` — accept some ordering trade-off for distribution.

🔴 **Erklärung:** Beginners forget to set a partition key and use round-robin (default). All messages for the same customer land on different partitions → processed out of order → inventory deducted before order placed → catastrophe.
</details>

---

**A3 (Hard).** Explain the difference between **at-least-once**, **at-most-once**, and **exactly-once** delivery in Kafka. What are the production trade-offs for each?

<details><summary>Answer</summary>

| Semantics | Producer `acks` | Consumer commit | Risk |
|---|---|---|---|
| **At-most-once** | `acks=0` (fire-and-forget) | Auto-commit before processing | Message lost if broker fails after send but before storage |
| **At-least-once** | `acks=all` | Manual commit after processing | Duplicate if consumer crashes after process but before commit |
| **Exactly-once** | `acks=all` + idempotent producer | Transactional consumer | ~30% throughput overhead; requires Kafka transactions |

**Production reality:**
- **At-least-once + idempotent consumer** is the industry standard: `acks=all`, commit after processing, make every consumer operation idempotent (check if already processed via DB unique key or Redis SETNX).
- **Exactly-once** is used for financial transactions where even a "just deduplicate" retry is unacceptable.

**Idempotent consumer pattern (Java):**
```java
@KafkaListener(topics = "order-events")
public void handle(OrderEvent event) {
    if (processedEventRepo.existsById(event.getEventId())) {
        log.info("Skipping duplicate event: {}", event.getEventId());
        return;  // idempotent: already processed
    }
    processOrder(event);
    processedEventRepo.save(new ProcessedEvent(event.getEventId()));
}
```

🔴 **Erklärung:** Exactly-once sounds desirable but adds enormous complexity. Start with at-least-once + idempotent consumers. Only add Kafka transactions when you have a concrete business requirement (financial audit) and measure the throughput cost first.
</details>

---

**A4 (Hard).** A consumer is processing 10,000 messages/second. Suddenly it falls behind — the lag grows to 1M messages. List 5 possible root causes in order of likelihood, and the diagnostic command for each.

<details><summary>Answer</summary>

**Consumer lag = messages in Kafka minus messages processed by consumer group.**

```bash
# Check lag:
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group my-group
```

| Rank | Root Cause | Diagnostic |
|---|---|---|
| 1 | **Slow processing** — each message takes too long (DB call, external API) | Add `@Timed` on handler; check p99 processing time |
| 2 | **GC pause** — JVM stop-the-world pauses pausing consumer loop | `jstat -gcutil <PID> 1000`; look for long GC pauses |
| 3 | **Not enough consumer instances** — 4 partitions, 1 consumer = 4× bottleneck | `kafka-consumer-groups.sh --describe` → check partition assignment |
| 4 | **Message processing error loop** — exception causes endless retry on same message | Check consumer logs for repeated error on same offset |
| 5 | **Producer spike** — upstream sent 10× normal volume in a burst | Check producer metrics; compare message rate to baseline |

**Remediation steps:**
1. Scale consumer instances to match partition count
2. Move slow operations to async (CompletableFuture + async thread pool)
3. Batch-process: `@KafkaListener(batch = true)` processes List<Message> per poll
4. Increase partitions (note: cannot decrease after creation)
</details>

---

### Part B: Implementation

**B1.** Implement an idempotent Kafka consumer for the Food Delivery system:

```java
// JavaSolutions/ps/enterprise/OrderEventConsumer.java
package kafka;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class OrderEventConsumer {
    
    private final OrderService orderService;
    private final ProcessedEventRepository processedRepo;
    
    public OrderEventConsumer(OrderService orderService, ProcessedEventRepository processedRepo) {
        this.orderService = orderService;
        this.processedRepo = processedRepo;
    }
    
    @KafkaListener(
        topics = "${kafka.topics.order-placed}",
        groupId = "${spring.kafka.consumer.group-id}",
        containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional  // DB idempotency check + business logic in ONE transaction
    public void handleOrderPlaced(OrderPlacedEvent event) {
        // TODO: 1. Check if event already processed (by eventId)
        //       2. If yes: log and return (idempotent)
        //       3. If no: process the order, mark as processed in same transaction
        
        if (processedRepo.existsById(event.eventId())) {
            log.info("Duplicate event ignored: {}", event.eventId());
            return;
        }
        
        try {
            orderService.processNewOrder(event);
            processedRepo.save(new ProcessedEvent(event.eventId(), Instant.now()));
            log.info("Processed order event: {}", event.eventId());
        } catch (Exception e) {
            log.error("Failed to process event {}: {}", event.eventId(), e.getMessage());
            throw e; // Re-throw → consumer will retry (at-least-once)
        }
    }
}

record OrderPlacedEvent(
    String eventId,       // UUID — used for idempotency key
    String orderId,
    String customerId,
    List<OrderLineDto> items,
    String deliveryAddress,
    Instant occurredAt
) {}
```

---

**B2.** Design the Kafka topic configuration for a Food Delivery system. Fill in the reasoning for each setting:

```yaml
# application.yml
spring:
  kafka:
    producer:
      acks: all              # why?
      retries: 3             # why?
      enable-idempotence: true  # why?
      compression-type: snappy  # why?
    consumer:
      auto-offset-reset: earliest  # why?
      enable-auto-commit: false    # why?
      max-poll-records: 50         # why?

kafka:
  topics:
    order-placed:
      partitions: 12         # why 12 specifically?
      replication-factor: 3  # why 3?
    driver-location:
      partitions: 24         # why more than order-placed?
      replication-factor: 3
```

<details><summary>Answer</summary>

| Setting | Reason |
|---|---|
| `acks: all` | Wait for leader + all in-sync replicas to acknowledge — no data loss even if leader fails |
| `retries: 3` | Transient network errors are retried automatically |
| `enable-idempotence: true` | Producer assigns sequence numbers — broker detects and drops duplicates from retries |
| `compression-type: snappy` | ~50% size reduction; Snappy is fast with low CPU cost vs Gzip |
| `auto-offset-reset: earliest` | New consumer groups start from beginning — don't miss historical messages |
| `enable-auto-commit: false` | Manual commit after processing — prevents "committed but not processed" message loss |
| `max-poll-records: 50` | Limits messages per poll; prevents consumer timeout if batch processing is slow |
| `order-placed: 12 partitions` | 12 = LCM of typical team sizes (1,2,3,4,6,12 consumers all divide evenly) |
| `replication-factor: 3` | Survive 2 broker failures; standard for production |
| `driver-location: 24 partitions` | Location updates arrive 10× more frequently than orders; needs more parallelism |
</details>

---

## Problem Set ENTERPRISE-PS4 — Enterprise Integration Patterns & Resilience

---

### Part A: Theoretical

**A1 (Medium).** What is the **Circuit Breaker** pattern? Draw the state machine (CLOSED → OPEN → HALF-OPEN). When should each transition fire?

<details><summary>Answer</summary>

```
              failure threshold exceeded
    CLOSED ──────────────────────────────► OPEN
      ▲                                      │
      │                          wait        │
      │                        timeout       │
      │                          ▼           │
      │   probe succeeds    HALF-OPEN ◄───────┘
      └────────────────────────────
              probe fails → back to OPEN
```

**States:**
- **CLOSED** (normal): Requests pass through. Count failures. If failures exceed threshold (e.g., 50% error rate in last 10 calls), trip to OPEN.
- **OPEN** (broken): All requests immediately fail without calling downstream. Protects the upstream from cascading failures.
- **HALF-OPEN** (probing): After a wait timeout, allow ONE test request. If it succeeds → CLOSED. If it fails → back to OPEN.

**Resilience4j implementation:**
```java
@Bean
public CircuitBreaker paymentCircuitBreaker(CircuitBreakerRegistry registry) {
    return registry.circuitBreaker("payment", CircuitBreakerConfig.custom()
        .failureRateThreshold(50)          // open if 50% fail
        .waitDurationInOpenState(Duration.ofSeconds(30))
        .permittedNumberOfCallsInHalfOpenState(3)
        .slidingWindowSize(10)
        .build());
}

// Usage:
public PaymentResult charge(PaymentRequest req) {
    return circuitBreaker.executeSupplier(() -> paymentClient.charge(req));
}
```

🔴 **Erklärung:** Without Circuit Breaker: if Payment Service is down, every Order request waits for the HTTP timeout (default 30s), holding threads. 1000 concurrent users × 30s wait = thread pool exhausted → entire service crashes. Circuit Breaker fails fast in < 1ms when OPEN, keeping the upstream alive.
</details>

---

**A2 (Hard).** Design an API Gateway for a 5-microservice system. What are the 6 responsibilities an API Gateway should handle, and which should NOT be in individual microservices?

<details><summary>Answer</summary>

**Gateway responsibilities:**

| Responsibility | Gateway? | Individual Service? |
|---|---|---|
| **Authentication** (JWT validation) | ✅ Once at gateway | ❌ Redundant in each service |
| **Rate limiting** (100 req/s per user) | ✅ Central enforcement | ❌ Distributed rate limiting is complex |
| **Request routing** (path → service) | ✅ Core gateway function | N/A |
| **SSL termination** (HTTPS → HTTP internally) | ✅ Once at boundary | N/A |
| **Load balancing** | ✅ Gateway level | ✅ Service mesh (alternative) |
| **Request logging / tracing** | ✅ Inject trace-id at entry | ✅ Propagate trace-id downstream |
| **Authorization** (can user X access resource Y?) | ❌ Business logic | ✅ In the owning service |
| **Business logic** | ❌ Never | ✅ Always |

**Spring Cloud Gateway config:**
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: lb://order-service   # load-balanced via Eureka
          predicates:
            - Path=/api/orders/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 100
                redis-rate-limiter.burstCapacity: 200
            - AuthenticationFilter    # custom JWT validation filter
```

🔴 **Erklärung:** Authorization (can THIS user access THIS resource?) must stay in the owning service — it's business logic. Only the Order service knows whether user Alice can view order #12345. The gateway only verifies the JWT is valid, not what it's allowed to access.
</details>

---

### Part C: Design Challenge

**C1.** You are designing an order processing pipeline for an e-commerce platform expecting 100,000 orders/day with spikes to 10,000 orders/minute during sales. Design the complete Kafka topology:

- Topic names and partition counts (justify each)
- Consumer groups and their responsibilities
- Exactly which service listens to which topic
- Error/dead-letter topic strategy
- How you handle a downstream service (Inventory) that goes down for 2 hours

<details><summary>Answer Outline</summary>

**Topic Topology:**
```
order-placed          (12 partitions) ← OrderService publishes
  ↓
  ├── inventory-group (InventoryService) → reserves stock
  ├── notification-group (NotificationService) → sends confirmation email
  └── analytics-group (AnalyticsService) → updates dashboards

stock-reserved        (12 partitions) ← InventoryService publishes
  ↓
  └── payment-group (PaymentService) → charges card

payment-completed     (12 partitions) ← PaymentService publishes
  ↓
  ├── fulfillment-group (FulfillmentService) → creates shipment
  └── notification-group → sends payment receipt

order-dlq             (3 partitions)  ← Dead Letter Queue for all failed events
```

**Inventory down for 2 hours:**
- Kafka retains `order-placed` messages per `retention.ms` (default 7 days)
- `inventory-group` consumer lag grows but messages are safe
- When InventoryService recovers: starts from last committed offset, processes all 2h of backlog
- Add lag alert: alert if `order-placed` lag > 50,000 messages

**Dead Letter Queue strategy:**
```java
@KafkaListener(topics = "order-placed")
public void handle(OrderPlacedEvent e) {
    try { processOrder(e); }
    catch (NonRetryableException ex) {
        // Send to DLQ after max retries
        kafkaTemplate.send("order-dlq", e.orderId(), e);
        // Alert on-call engineer
    }
}
```
</details>

---

[← Back to Semester 4 Guide](../00_CURRICULUM/SEMESTER_4_GUIDE.md)
