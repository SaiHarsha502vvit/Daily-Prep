> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Production Practices](../13_Developer_Essentials/11_Production_Code_Practices.md)
> 🧠 **Mental Model**: See [Production Debugging Thinking](../14_Mental_Models/18_Production_Debugging_Thinking.md)

---

# 📨 Message Queues & Kafka — Event-Driven Architecture

> How production systems communicate asynchronously — from simple queues to streaming platforms

---

## Part 1: Why Message Queues?

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  WITHOUT QUEUE (Synchronous):                                                    ║
║  Order Service ──HTTP──→ Payment Service ──HTTP──→ Email Service                ║
║  Problem: If email is slow/down, entire order fails!                            ║
║                                                                                  ║
║  WITH QUEUE (Asynchronous):                                                      ║
║  Order Service ──→ [Queue] ──→ Payment Worker                                   ║
║                    [Queue] ──→ Email Worker                                      ║
║                    [Queue] ──→ Analytics Worker                                  ║
║                                                                                  ║
║  BENEFITS:                                                                       ║
║  ✅ Decoupling: Producer doesn't know about consumers                           ║
║  ✅ Buffering: Queue absorbs traffic spikes                                     ║
║  ✅ Resilience: Consumer down? Messages wait in queue                           ║
║  ✅ Scalability: Add more consumers to process faster                           ║
║  ✅ Ordering: Messages processed in sequence (within partition)                 ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Part 2: Queue Types — Point-to-Point vs Pub/Sub

```
POINT-TO-POINT (Work Queue):
  Producer ──→ [Queue] ──→ Consumer A   (only ONE consumer gets each message)
                       ──→ Consumer B
  Use case: Task distribution (each email sent once)
  Examples: RabbitMQ default, SQS

PUB/SUB (Publish-Subscribe):
  Publisher ──→ [Topic] ──→ Subscriber A  (ALL subscribers get each message)
                        ──→ Subscriber B
                        ──→ Subscriber C
  Use case: Event broadcasting (order placed → notify warehouse, email, analytics)
  Examples: Kafka topics, SNS, Redis Pub/Sub
```

---

## Part 3: Apache Kafka — Deep Dive

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  KAFKA ARCHITECTURE                                                              ║
║                                                                                  ║
║  ┌──────────┐     ┌──────────────────────────────────────────────┐              ║
║  │ Producer  │────→│               Kafka Cluster                  │              ║
║  │ (app)     │     │                                              │              ║
║  └──────────┘     │  Topic: "orders"                             │              ║
║                    │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │              ║
║                    │  │Partition│ │Partition│ │Partition│       │              ║
║  ┌──────────┐     │  │   0     │ │   1     │ │   2     │       │              ║
║  │ Producer  │────→│  │[0,1,2] │ │[0,1,2,3]│ │[0,1]   │       │              ║
║  └──────────┘     │  └─────────┘ └─────────┘ └─────────┘       │              ║
║                    │        ↓           ↓           ↓              │              ║
║                    └────────┼───────────┼───────────┼──────────────┘              ║
║                             ↓           ↓           ↓                             ║
║                    ┌──────────────────────────────────────────────┐              ║
║                    │          Consumer Group "payment"             │              ║
║                    │  Consumer A     Consumer B     Consumer C    │              ║
║                    │  (reads P0)     (reads P1)     (reads P2)   │              ║
║                    └──────────────────────────────────────────────┘              ║
║                                                                                  ║
║  KEY CONCEPTS:                                                                   ║
║  Topic: Named feed of messages (like a database table)                          ║
║  Partition: Ordered, immutable log. Messages appended to end.                   ║
║  Offset: Position of message in partition (like array index)                    ║
║  Consumer Group: Consumers that share work. Each partition → one consumer.      ║
║  Broker: A Kafka server. Cluster has multiple brokers for reliability.          ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

### Kafka Guarantees & Config

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ORDERING: Guaranteed WITHIN a partition, NOT across partitions                  │
│  → To order all messages for user123: use userId as partition key               │
│  → hash("user123") % num_partitions → always same partition                    │
│                                                                                  │
│  DELIVERY SEMANTICS:                                                             │
│  ┌──────────────────┬────────────────────────────────────────────────────────┐  │
│  │ At-most-once     │ Fire and forget. May lose messages. (auto-commit fast) │  │
│  │ At-least-once    │ Retry on failure. May get duplicates. (DEFAULT)        │  │
│  │ Exactly-once     │ Idempotent producer + transactional consumer.          │  │
│  │                  │ Kafka supports this since 0.11 (enable.idempotence)    │  │
│  └──────────────────┴────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  REPLICATION:                                                                    │
│  → Each partition has 1 leader + N-1 followers (ISR = in-sync replicas)        │
│  → Writes go to leader, replicated to followers                                │
│  → acks=0: Don't wait (fast, may lose)                                         │
│  → acks=1: Leader acknowledges (balanced)                                      │
│  → acks=all: All ISR acknowledge (safest, slowest)                             │
│                                                                                  │
│  RETENTION:                                                                      │
│  → Time-based: retain messages for 7 days (default)                             │
│  → Size-based: retain up to 1GB per partition                                   │
│  → Compacted: Keep only latest value per key (like a changelog)                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Spring Boot + Kafka (Production Code)

```java
// ── application.yml ──
// spring:
//   kafka:
//     bootstrap-servers: localhost:9092
//     producer:
//       key-serializer: org.apache.kafka.common.serialization.StringSerializer
//       value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
//     consumer:
//       group-id: payment-service
//       auto-offset-reset: earliest

// ── Producer ──
@Service
public class OrderEventProducer {
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;
    
    public CompletableFuture<SendResult<String, OrderEvent>> publishOrderCreated(OrderEvent event) {
        return kafkaTemplate.send("orders", event.getOrderId(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to send event: {}", event.getOrderId(), ex);
                } else {
                    log.info("Sent to partition={}, offset={}", 
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
                }
            });
    }
}

// ── Consumer ──
@Service
public class PaymentEventConsumer {
    
    @KafkaListener(topics = "orders", groupId = "payment-service")
    public void handleOrderCreated(OrderEvent event) {
        log.info("Processing order: {}", event.getOrderId());
        
        // IDEMPOTENCY: Check if already processed
        if (paymentRepository.existsByOrderId(event.getOrderId())) {
            log.warn("Duplicate event, skipping: {}", event.getOrderId());
            return;
        }
        
        paymentService.processPayment(event);
    }
}
```

---

## Part 5: RabbitMQ vs Kafka vs SQS

```
┌──────────────┬──────────────────┬─────────────────┬──────────────────┐
│              │ Kafka            │ RabbitMQ         │ AWS SQS          │
├──────────────┼──────────────────┼─────────────────┼──────────────────┤
│ Model        │ Distributed log  │ Message broker   │ Managed queue    │
│ Ordering     │ Per partition    │ Per queue         │ Best-effort/FIFO │
│ Throughput   │ Millions msg/sec │ Thousands msg/sec│ Depends on config│
│ Retention    │ Configurable     │ Until consumed    │ 14 days max      │
│ Replay       │ Yes (re-read)   │ No (consumed=gone)│ No               │
│ Best for     │ Event streaming, │ Task queues,     │ Simple async,    │
│              │ log aggregation  │ RPC, routing     │ serverless       │
│ Complexity   │ High (ZK/KRaft) │ Medium           │ Low (managed)    │
│ When to use  │ High throughput, │ Complex routing, │ AWS ecosystem,   │
│              │ event sourcing   │ low latency      │ simple queuing   │
└──────────────┴──────────────────┴─────────────────┴──────────────────┘
```

---

## Part 6: Event-Driven Architecture Patterns

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  PATTERN 1: Event Notification                                                   ║
║  Order Service publishes: { type: "ORDER_CREATED", orderId: "123" }             ║
║  Consumers react: send email, update analytics, reserve inventory               ║
║  → Lightweight events, consumers fetch details if needed                        ║
║                                                                                  ║
║  PATTERN 2: Event-Carried State Transfer                                        ║
║  Order Service publishes: { type: "ORDER_CREATED", orderId: "123",              ║
║    customer: "John", items: [...], total: 99.99 }                               ║
║  → Fat events, consumers don't need to call back                               ║
║  → Trade-off: larger messages, but fully decoupled                             ║
║                                                                                  ║
║  PATTERN 3: Event Sourcing                                                      ║
║  Don't store current state — store all events                                   ║
║  AccountCreated → Deposited($100) → Withdrawn($30) → Deposited($50)           ║
║  Current balance = replay events = $100 - $30 + $50 = $120                     ║
║  → Complete audit trail, can rebuild state at any point in time                 ║
║  → Complex: need snapshots for performance, eventual consistency               ║
║                                                                                  ║
║  PATTERN 4: Outbox Pattern (Transactional Messaging)                            ║
║  Problem: How to atomically update DB AND publish event?                        ║
║  Solution:                                                                       ║
║  1. In SAME transaction: update orders table + insert into outbox table         ║
║  2. Separate process polls outbox table → publishes to Kafka                   ║
║  3. Mark outbox row as published                                                ║
║  → Guarantees: if DB updated, event WILL be published (eventually)             ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---
