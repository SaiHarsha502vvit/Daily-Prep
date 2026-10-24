# 📝 Enterprise Systems — Kafka & Messaging Problem Sets

> **Problem Sets PS3 & PS4** — Semester 4 Unit  
> **Module:** `09_Distributed_Patterns.md` (especially the Outbox Pattern and Saga sections)  
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

🔬 **Section Challenge — Slow Consumer Rebalance:**
A partition with 80% of messages is assigned to a slow consumer (GC pause or downstream slowness). The consumer crashes and is replaced. What does the rebalance look like? How does cooperative rebalancing (KIP-429) change this compared to eager rebalancing?

<details>
<summary>Answer</summary>

**Eager rebalancing (default before KIP-429):**
1. All consumers in the group revoke ALL their partitions.
2. Group coordinator computes new partition assignment.
3. All consumers rejoin and get their new partitions.
4. Processing resumes.

This is a "stop-the-world" rebalance — even healthy consumers stop processing during the rebalance. For a 10-partition topic with 5 consumers, the entire group pauses for ~5–10 seconds during a single slow-consumer rebalance.

**Cooperative rebalancing (KIP-429, Kafka 2.4+):**
1. Only the affected partition is revoked (the partition assigned to the crashed consumer).
2. Healthy consumers keep processing their existing partitions during the rebalance.
3. New consumer joins and takes over the revoked partition.
4. Processing continues on all other partitions throughout.

The rebalance is "incremental" — only the affected partition moves. Healthy consumers don't pause. This dramatically reduces rebalance-induced latency spikes.

**Trade-off**: cooperative rebalancing requires the consumer to handle the case where it's processing a partition, briefly loses it, and then re-acquires it. This is more complex than eager rebalancing's "stop everything, restart cleanly" model. The complexity is usually worth it for low-latency services.

**Configuration**:
```properties
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```
</details>

---

**A3 (Hard).** Explain the difference between **at-least-once**, **at-most-once**, and **exactly-once** delivery in Kafka. What are the production trade-offs for each?

<details><summary>Answer</summary>

| Semantics         | Producer `acks`                  | Consumer commit                | Risk                                                          |
| ----------------- | -------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| **At-most-once**  | `acks=0` (fire-and-forget)       | Auto-commit before processing  | Message lost if broker fails after send but before storage    |
| **At-least-once** | `acks=all`                       | Manual commit after processing | Duplicate if consumer crashes after process but before commit |
| **Exactly-once**  | `acks=all` + idempotent producer | Transactional consumer         | ~30% throughput overhead; requires Kafka transactions         |

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

🔬 **Section Challenge — Idempotency Table Growth:**
Your idempotency table (`processed_events`) hits 50M rows and consumes 100GB of disk. The TTL cleanup job deletes entries older than 7 days. What is the trade-off between longer TTL (more safety) and shorter TTL (less disk)? What's the alternative for very high event volume?

<details>
<summary>Answer</summary>

**TTL trade-off**:
- **Long TTL (30 days)**: safe against delayed/replayed events up to 30 days old. Disk usage scales linearly: 50M × 30 days = 1.5B rows = ~3TB.
- **Short TTL (1 day)**: minimal disk (200M rows × 1 day ≈ 4GB), but a Kafka backlog that replays events older than 1 day will produce duplicates that the consumer cannot detect.

**Standard production TTL: 7 days** — covers the typical Kafka retention (also 7 days) and operational delays (e.g., a consumer outage over a long weekend).

**Alternatives for very high volume (>10K events/sec)**:

1. **Partition by date**: `PARTITION BY RANGE (processed_at)` with one partition per day. Drop old partitions instead of deleting rows. Cleanup is O(1) instead of O(rows).

2. **Bloom filter for recent events**: in-memory Bloom filter holds the last ~1 hour of event IDs (~36M IDs at 10K/sec, ~500MB RAM with 1% false positive rate). On lookup: check Bloom filter first, then DB only if Bloom says "maybe". Trades 1% false-positive rate (rare duplicate processing) for massive speedup.

3. **Use Kafka exactly-once semantics (EOS)**: with `isolation.level=read_committed` and transactional producers, Kafka guarantees no duplicates. Eliminate the idempotency table entirely. Trade-off: requires careful producer/consumer configuration and only works within one Kafka cluster (no cross-system exactly-once).

4. **Switch to a TTL database**: Redis with `EXPIRE` on each key (auto-cleanup), or DynamoDB with TTL attribute. Trade-off: operational cost, and Redis is not durable by default (need AOF + fsync for crash safety).

**Production recommendation**: start with DB + daily TTL cleanup. Move to partition-by-date when row count exceeds 100M. Move to EOS when the idempotency table itself becomes a bottleneck (>1M lookups/sec).
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

| Rank | Root Cause                                                                         | Diagnostic                                                         |
| ---- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1    | **Slow processing** — each message takes too long (DB call, external API)          | Add `@Timed` on handler; check p99 processing time                 |
| 2    | **GC pause** — JVM stop-the-world pauses pausing consumer loop                     | `jstat -gcutil <PID> 1000`; look for long GC pauses                |
| 3    | **Not enough consumer instances** — 4 partitions, 1 consumer = 4× bottleneck       | `kafka-consumer-groups.sh --describe` → check partition assignment |
| 4    | **Message processing error loop** — exception causes endless retry on same message | Check consumer logs for repeated error on same offset              |
| 5    | **Producer spike** — upstream sent 10× normal volume in a burst                    | Check producer metrics; compare message rate to baseline           |

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

<details>
<summary>Answer — Idempotent Consumer Implementation</summary>

```java
@Service
public class OrderEventConsumer {

    private final ProcessedEventRepository processedRepo;
    private final OrderService orderService;

    @KafkaListener(topics = "orders", groupId = "order-processor")
    @Transactional
    public void consume(ConsumerRecord<String, OrderPlacedEvent> record) {
        OrderPlacedEvent event = record.value();
        String eventId = event.eventId();

        // 1. Check if already processed (idempotency guard)
        if (processedRepo.existsById(eventId)) {
            log.info("Skipping duplicate event {}", eventId);
            return;
        }

        // 2. Record this event as processed BEFORE doing the work
        //    (this ensures the @Transactional commits the processed_events row
        //     atomically with the business logic; if either fails, both roll back)
        processedRepo.save(new ProcessedEvent(eventId, Instant.now()));

        // 3. Do the business work
        orderService.handleOrderPlaced(event);
    }
}
```

**Why `@Transactional` is critical:**

The `processed_events` table insert and the business logic (e.g., order creation, inventory reservation) MUST commit atomically. Without `@Transactional`:
- If `processedRepo.save()` succeeds but `orderService.handleOrderPlaced()` throws, the next consumer poll re-reads the same offset and reprocesses the event (duplicate order).
- If we reversed the order (process business logic first, then save processed_events), a crash between the two would also cause reprocessing on retry.

With `@Transactional`, the entire method runs in one DB transaction. Either both the processed_events row and the business work commit, or both roll back. Combined with Kafka's at-least-once delivery (the consumer commits the offset after the DB transaction), this gives **exactly-once processing** semantics.

**Trade-off: at-least-once vs exactly-once delivery:**

- **At-least-once + idempotent consumer** (this pattern): Kafka guarantees the event is delivered at least once (may duplicate on retry). The consumer handles duplicates via the idempotency table. This is the standard production pattern.
- **Exactly-once** (Kafka 0.11+ with transactional producer + read_committed consumer): Kafka itself guarantees no duplicates within one Kafka cluster. Requires using `KafkaTemplate.send()` with transactions and `isolation.level=read_committed`. More complex but eliminates the idempotency table.
- **At-most-once**: consumer commits the offset BEFORE processing. If processing fails, the event is lost. Used only for non-critical metrics/log streams.

**Production recommendation**: start with at-least-once + idempotent consumer. Move to Kafka exactly-once only if the idempotency table becomes a bottleneck (very high event volume).

**Operational concern — processed_events table growth:**

At 10,000 events/sec, the table grows by ~860M rows/day. Solutions:
1. TTL cleanup: delete entries older than 7 days (`DELETE FROM processed_events WHERE processed_at < now() - interval '7 days'`). Run as a daily scheduled job.
2. Partition by date: `PARTITION BY RANGE (processed_at)` and drop old partitions.
3. Use a Bloom filter for the recent window (last hour) and fall back to the table for older events. Trades accuracy for performance.
</details>

---

**B2.**
```

---

**B2.** Design the Kafka topic configuration for a Food Delivery system. Fill in the reasoning for each setting:

```yaml
# application.yml
spring:
  kafka:
    producer:
      acks: all # why?
      retries: 3 # why?
      enable-idempotence: true # why?
      compression-type: snappy # why?
    consumer:
      auto-offset-reset: earliest # why?
      enable-auto-commit: false # why?
      max-poll-records: 50 # why?

kafka:
  topics:
    order-placed:
      partitions: 12 # why 12 specifically?
      replication-factor: 3 # why 3?
    driver-location:
      partitions: 24 # why more than order-placed?
      replication-factor: 3
```

<details><summary>Answer</summary>

| Setting                          | Reason                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `acks: all`                      | Wait for leader + all in-sync replicas to acknowledge — no data loss even if leader fails |
| `retries: 3`                     | Transient network errors are retried automatically                                        |
| `enable-idempotence: true`       | Producer assigns sequence numbers — broker detects and drops duplicates from retries      |
| `compression-type: snappy`       | ~50% size reduction; Snappy is fast with low CPU cost vs Gzip                             |
| `auto-offset-reset: earliest`    | New consumer groups start from beginning — don't miss historical messages                 |
| `enable-auto-commit: false`      | Manual commit after processing — prevents "committed but not processed" message loss      |
| `max-poll-records: 50`           | Limits messages per poll; prevents consumer timeout if batch processing is slow           |
| `order-placed: 12 partitions`    | 12 = LCM of typical team sizes (1,2,3,4,6,12 consumers all divide evenly)                 |
| `replication-factor: 3`          | Survive 2 broker failures; standard for production                                        |
| `driver-location: 24 partitions` | Location updates arrive 10× more frequently than orders; needs more parallelism           |

</details>

<details>
<summary>Answer — Kafka Broker Configuration Rationale</summary>

```yaml
# Broker configuration for a production 3-broker cluster
listeners: PLAINTEXT://0.0.0.0:9092
advertised.listeners: PLAINTEXT://broker1.kafka.prod:9092

# Replication
default.replication.factor: 3
min.insync.replicas: 2
unclean.leader.election.enable: false

# Log retention (1 week for most topics)
log.retention.hours: 168
log.segment.bytes: 1073741824  # 1GB segments

# Performance
num.network.threads: 8
num.io.threads: 16
log.flush.interval.messages: 10000
```

**Rationale per setting:**

- **`default.replication.factor: 3`** — every new topic gets 3 replicas (one leader + 2 followers). This survives the loss of 1 broker without data loss. For critical topics (orders, payments), use 5 replicas.

- **`min.insync.replicas: 2`** — the producer with `acks=all` requires at least 2 in-sync replicas before considering a write successful. Combined with replication factor 3, this means: 1 leader + 1 follower must acknowledge before the producer gets a success response. If only 1 replica is in-sync, the producer fails fast (rather than writing to a single point of failure).

- **`unclean.leader.election.enable: false`** — if all in-sync replicas are lost, Kafka does NOT elect an out-of-sync follower as leader (which would cause data loss). The topic becomes unavailable for writes until an in-sync replica recovers. This is the safer choice for financial data.

- **`log.retention.hours: 168`** — keep messages for 1 week. After that, log segments are deleted. This bounds disk usage: at 10,000 events/sec × 1KB/event = 10MB/sec = ~860GB/day. With 3 replicas, that's ~2.5TB/day; 1 week retention = ~17TB. Plan disk accordingly.

- **`log.segment.bytes: 1073741824`** — 1GB per log segment. Kafka rotates to a new segment when the current one fills. Smaller segments mean more files (more file-handle pressure); larger segments mean slower log compaction. 1GB is the typical production sweet spot.

- **`num.network.threads: 8`, `num.io.threads: 16`** — Kafka uses thread pools for network (handling client connections) and disk I/O (writing log segments). The defaults (3 and 8) are too low for production; tune based on `kafka.server:type=BrokerTopicMetrics` JMX metrics showing thread pool saturation.

- **`log.flush.interval.messages: 10000`** — Kafka flushes in-memory batches to disk every 10,000 messages (or every `log.flush.interval.ms`, whichever comes first). This is a durability/latency trade-off — more frequent flushes = lower data loss on crash but higher I/O latency. Production: pair with `log.flush.interval.ms=1000` (1 second) for a 1-second worst-case data loss window.
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

| Responsibility                                    | Gateway?                    | Individual Service?                     |
| ------------------------------------------------- | --------------------------- | --------------------------------------- |
| **Authentication** (JWT validation)               | ✅ Once at gateway          | ❌ Redundant in each service            |
| **Rate limiting** (100 req/s per user)            | ✅ Central enforcement      | ❌ Distributed rate limiting is complex |
| **Request routing** (path → service)              | ✅ Core gateway function    | N/A                                     |
| **SSL termination** (HTTPS → HTTP internally)     | ✅ Once at boundary         | N/A                                     |
| **Load balancing**                                | ✅ Gateway level            | ✅ Service mesh (alternative)           |
| **Request logging / tracing**                     | ✅ Inject trace-id at entry | ✅ Propagate trace-id downstream        |
| **Authorization** (can user X access resource Y?) | ❌ Business logic           | ✅ In the owning service                |
| **Business logic**                                | ❌ Never                    | ✅ Always                               |

**Spring Cloud Gateway config:**

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: lb://order-service # load-balanced via Eureka
          predicates:
            - Path=/api/orders/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 100
                redis-rate-limiter.burstCapacity: 200
            - AuthenticationFilter # custom JWT validation filter
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

---

## Historical Evolution

Apache Kafka is the de facto event-streaming backbone for enterprise integration — but its lineage is shorter than most developers assume. Three threads:

**1. The LinkedIn Origin (2010-2011)**

- **LinkedIn Engineering — Kafka initial commit, January 2011 (Jay Kreps, Neha Narkhede, Jun Rao)**: Kafka was built at LinkedIn to solve the problem of moving activity-tracking data + log data + operational metrics through a unified pipeline. The original Kafka paper was published at NetDB 2011.
- **Apache Incubator — October 2011**: Kafka entered the Apache Software Foundation incubator.
- **Apache Top-Level Project — October 2012**: Kafka graduated from incubator to Apache top-level.
- **Confluent founded — 2014 by Kreps, Narkhede, Rao**: The three Kafka creators left LinkedIn to commercialize Kafka. Confluent's first product was Confluent Platform (the "enterprise Kafka" distribution).

**2. The Exactly-Once + Streams Era (2017-2020)**

- **Kafka 0.11 (June 2017) — exactly-once semantics (EOS)**: The watershed release. Idempotent producers + transactional APIs made "exactly-once delivery" possible across producer + consumer + stream processing. Before this, at-least-once was the practical guarantee, requiring idempotency-key logic at the consumer.
- **Kafka Streams — 2016 (0.10) → GA 2017 (0.11)**: The embedded stream-processing library. Avoided the need to deploy a separate Flink/Spark cluster for many use cases.
- **KSQL — 2017 → ksqlDB 2019**: The SQL-on-Kafka engine. Made Kafka accessible to data analysts without Java/Scala skills.
- **Schema Registry — 2015 (Confluent)**: The Avro/JSON-Schema/Protobuf schema management service. Became the canonical way to evolve Kafka topic schemas.

**3. The KRaft Era (2022-today)**

- **Kafka ZooKeeper removal — KIP-500, proposed 2018; KRaft production-ready in Kafka 3.3 (Oct 2022); default in Kafka 4.0 (2024)**: ZooKeeper was the original metadata store but became an operational bottleneck. KRaft (Kafka Raft) replaced it with an internal Raft consensus protocol — no external coordination service required.
- **Tiered Storage (KIP-405) — Kafka 3.6 (Oct 2023)**: Allowed Kafka brokers to offload old log segments to S3-compatible storage. Made infinite retention economically viable.
- **Modern Practice Anchored**: When you see "exactly-once delivery", that's Kafka 0.11 (2017). When you see "KRaft / no ZooKeeper", that's Kafka 3.3 (Oct 2022). When you see "tiered storage on S3", that's Kafka 3.6 (Oct 2023). A 2026 Kafka shop running Kafka 2.x is running a 7-year-old version — and a Kafka 4.0 (2024) shop is missing nothing. The evolution has been steep.

### Production Reality

**Failure Mode 1 — Consumer Rebalance Storm**: A Kafka consumer group has 100 consumers. One consumer is slow (long GC pause, network blip). The group coordinator rebalances: all 100 consumers reassign partitions; processing stops for 30-60 seconds; meanwhile, producer back-pressure builds up. Symptom: latency spike every few minutes. Fix: `max.poll.interval.ms` set higher; static membership (KIP-345); cooperative rebalancing (KIP-429).

**Failure Mode 2 — Out-of-Order Event Delivery**: Kafka guarantees order within a partition, but not across partitions. A "user-created" event lands in partition 0; an "email-verified" event for the same user lands in partition 1; if partition 1 is processed first, the system sees "email-verified before user-created". Symptom: orphaned records. Fix: partition by entity-id (user-id); route all events for one entity to the same partition.

**Failure Mode 3 — Idempotent-Producer Retry Duplicate**: Kafka 0.11+ has idempotent producer (PID + sequence number). If the producer retries after a network timeout, the broker dedupes by PID+seq. But if the producer's local log is corrupted (PID lost), the producer gets a new PID and may re-send the same logical message. Fix: producer-side transactional ID + transactional.id reset only on explicit operator action.

**Debug Workflow**:
1. **`kafka-consumer-groups.sh --describe --group <name>`** — lag per partition; consumer assignment
2. **`__consumer_offsets` topic inspection** — committed offsets per (group, topic, partition)
3. **`kafka-log-dirs.sh --describe`** — disk usage per partition
4. **JMX metrics** — `records-lag-max`, `rebalance-rate`, `request-latency-avg`
5. **Burrow / Cruise Control** — automated lag monitoring + self-healing

---



---

## Reality Check

**"Kafka is a message queue"** — Kafka is a distributed, partitioned, replicated LOG — and the difference from a traditional queue drives everything: messages are not deleted on consumption (they persist for a retention period — multiple consumer groups read the same log independently, replay is possible, the "queue" that remembers), ordering is per-PARTITION only (not global — the partition key decides which messages are ordered relative to each other, the [distributed-systems] ordering reality), and consumers track their own OFFSET (the position in the log, the mechanism behind replay and the source of the "did I already process this" idempotency need). Treating Kafka as a drop-in queue (expecting global order, expecting delete-on-read, ignoring partitions) is the source of most Kafka misuse — it is a log with queue-like uses, and the log semantics are the point.

**"The partition key is just for distribution"** — The partition key is a CORRECTNESS decision, not just load-balancing: all messages with the same key go to the same partition and are therefore ORDERED relative to each other (the per-customer events that must be processed in order use customer-ID as the key — the wrong key scatters them across partitions and destroys the ordering the business needs), and the key determines the parallelism ceiling (the hot key that sends everything to one partition — the [DevOps load-balancing] uneven-load problem, one consumer overwhelmed while others idle). Choosing the partition key is choosing both the ordering guarantee and the parallelism distribution — "just for distribution" misses that it silently decides whether your ordered-processing requirement is met.

**"At-least-once delivery means messages might duplicate — handle it later"** — At-least-once is Kafka's practical default, and duplicate handling is a DAY-ONE consumer requirement, not later ([distributed-systems, 09]'s idempotency lesson, Kafka-specific): the consumer that processed a message and crashed before committing its offset reprocesses it on restart (the double-processing that is normal operation, not an edge case), the rebalance that reassigns a partition mid-processing. Exactly-once is achievable (Kafka transactions, idempotent producers) but with constraints and complexity — most systems build idempotent CONSUMERS instead (dedup by message key, absolute-target operations). "Handle it later" ships the double-processing incident; at-least-once means duplicates are guaranteed to happen, so idempotent consumption is part of the minimum viable consumer.

**"Consumer lag is a performance metric to watch"** — Consumer lag (how far behind the log's head a consumer is) is a critical HEALTH and correctness signal with business consequences ([monitoring]): growing lag means the consumer cannot keep up (the events processed minutes or hours late — the fraud check that runs after the fraud, the inventory update that lags reality), and it is often the first sign of a downstream problem (the consumer slowed by a failing dependency, the poison message stalling a partition [13_DE CI/CD]). Lag is not just "watch it" — it is an SLO-worthy signal (max acceptable lag as a reliability target [SRE]) whose breach means the system's real-time-ness is broken, and whose cause (slow consumer, poison message, downstream failure, insufficient partitions/consumers) needs the same diagnostic discipline as any saturation signal.

**"More partitions mean more throughput, so use many"** — Partitions have costs and a tuning trade-off, not a free-throughput dial: more partitions mean more parallelism (up to the consumer count — partitions beyond consumers just sit idle) BUT more overhead (each partition is files, memory, and replication work on the brokers — the cluster with too many partitions that struggles), longer rebalances, and the ordering scope shrinks (more partitions, less is globally ordered). And partition count is HARD to change later (increasing partitions changes key-to-partition mapping, disrupting ordering for existing keys — the [DevOps subnets/shard-key] hard-to-change-later decision). The right count is a capacity plan (projected throughput, consumer parallelism, ordering needs) with headroom — "use many" produces either idle over-provisioning or a strained cluster, and the reconfiguration pain means the initial choice matters.
