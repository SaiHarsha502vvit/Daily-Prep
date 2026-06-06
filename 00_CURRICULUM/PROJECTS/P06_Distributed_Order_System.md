# 🔨 Mini-Project P06 — Distributed Order System (Saga Pattern)

> **Semester:** 2 / Semester 3 Bridge  
> **Topics:** Saga Pattern · Outbox Pattern · Spring Boot · Kafka (simulated)  
> **Est. time:** 8 hours  
> **Language:** Java 17

---

## 🎯 Business Requirement (The PM Brief)

*An e-commerce startup places orders that span three services: Inventory (reserve stock), Payment (charge card), and Shipping (schedule delivery). If any step fails, all preceding steps must be rolled back. Build the Saga orchestrator.*

---

## 📋 Technical Specification

### The 4-Step Order Saga

```
START
  Step 1: InventoryService.reserveStock(orderId, items)
     ✓ → Step 2
     ✗ → Cancel order (no compensation needed — nothing happened)

  Step 2: PaymentService.chargeCard(orderId, amount, cardToken)
     ✓ → Step 3
     ✗ → COMPENSATE Step 1: InventoryService.releaseStock(orderId)

  Step 3: ShippingService.scheduleDelivery(orderId, address)
     ✓ → Order CONFIRMED
     ✗ → COMPENSATE Step 2: PaymentService.refund(orderId)
          COMPENSATE Step 1: InventoryService.releaseStock(orderId)
END
```

### Components

| Component | Responsibility |
|---|---|
| `OrderSagaOrchestrator` | State machine that drives the saga forward and backward |
| `SagaStep<T>` | Interface: `execute()` and `compensate()` |
| `InventoryStep` | Calls InventoryService (simulated HTTP client) |
| `PaymentStep` | Calls PaymentService (simulated) |
| `ShippingStep` | Calls ShippingService (simulated) |
| `SagaLog` | Append-only log of saga state — enables crash recovery |

---

## 📝 Skeleton Code

```java
// ── SagaStep.java ──────────────────────────────────────────
package saga;

public interface SagaStep<T> {
    String name();
    T execute(SagaContext context) throws StepFailedException;
    void compensate(SagaContext context); // must never throw
}

// ── SagaContext.java ───────────────────────────────────────
package saga;

import java.util.*;

public class SagaContext {
    private final String orderId;
    private final Map<String, Object> data = new HashMap<>();
    
    public SagaContext(String orderId) { this.orderId = orderId; }
    public String getOrderId() { return orderId; }
    public void set(String key, Object value) { data.put(key, value); }
    public <T> T get(String key, Class<T> type) { return type.cast(data.get(key)); }
}

// ── OrderSagaOrchestrator.java ─────────────────────────────
package saga;

import java.util.*;

public class OrderSagaOrchestrator {
    private final List<SagaStep<?>> steps;
    private final SagaLog log;
    
    public OrderSagaOrchestrator(List<SagaStep<?>> steps, SagaLog log) {
        this.steps = steps;
        this.log = log;
    }
    
    /**
     * Executes the saga. On failure at step N, compensates steps N-1..0 in reverse.
     */
    public SagaResult execute(SagaContext context) {
        int lastCompletedStep = -1;
        
        for (int i = 0; i < steps.size(); i++) {
            var step = steps.get(i);
            log.record(context.getOrderId(), step.name(), SagaStepStatus.STARTED);
            
            try {
                step.execute(context);
                log.record(context.getOrderId(), step.name(), SagaStepStatus.COMPLETED);
                lastCompletedStep = i;
            } catch (StepFailedException e) {
                log.record(context.getOrderId(), step.name(), SagaStepStatus.FAILED);
                
                // Compensate in reverse order
                for (int j = lastCompletedStep; j >= 0; j--) {
                    var compensateStep = steps.get(j);
                    try {
                        log.record(context.getOrderId(), compensateStep.name(), SagaStepStatus.COMPENSATING);
                        compensateStep.compensate(context);
                        log.record(context.getOrderId(), compensateStep.name(), SagaStepStatus.COMPENSATED);
                    } catch (Exception compensationEx) {
                        // Compensation must never throw — log and continue
                        System.err.println("CRITICAL: compensation failed for " + compensateStep.name() + ": " + compensationEx.getMessage());
                        log.record(context.getOrderId(), compensateStep.name(), SagaStepStatus.COMPENSATION_FAILED);
                    }
                }
                return SagaResult.failed(e.getMessage(), lastCompletedStep);
            }
        }
        return SagaResult.success();
    }
}

// ── InventoryStep.java ─────────────────────────────────────
package saga.steps;

import saga.*;

public class InventoryStep implements SagaStep<String> {
    private final InventoryServiceClient client;
    public InventoryStep(InventoryServiceClient client) { this.client = client; }
    
    @Override public String name() { return "RESERVE_INVENTORY"; }
    
    @Override
    public String execute(SagaContext ctx) throws StepFailedException {
        try {
            var reservationId = client.reserveStock(ctx.getOrderId());
            ctx.set("reservationId", reservationId); // store for compensation
            return reservationId;
        } catch (Exception e) {
            throw new StepFailedException("Inventory reservation failed: " + e.getMessage(), e);
        }
    }
    
    @Override
    public void compensate(SagaContext ctx) {
        var reservationId = ctx.get("reservationId", String.class);
        if (reservationId != null) {
            try { client.releaseStock(reservationId); }
            catch (Exception e) { /* log only — must not rethrow */ }
        }
    }
}
```

---

## ✅ JUnit Test Stub

```java
class OrderSagaOrchestratorTest {
    InMemorySagaLog log = new InMemorySagaLog();
    
    FakeInventoryClient inventory = new FakeInventoryClient();
    FakePaymentClient payment = new FakePaymentClient();
    FakeShippingClient shipping = new FakeShippingClient();
    
    List<SagaStep<?>> steps;
    OrderSagaOrchestrator orchestrator;
    
    @BeforeEach void setup() {
        steps = List.of(
            new InventoryStep(inventory),
            new PaymentStep(payment),
            new ShippingStep(shipping)
        );
        orchestrator = new OrderSagaOrchestrator(steps, log);
    }
    
    @Test void happyPath_allStepsSucceed_orderConfirmed() {
        var result = orchestrator.execute(new SagaContext("order-1"));
        assertTrue(result.isSuccess());
        assertTrue(inventory.reserved);
        assertTrue(payment.charged);
        assertTrue(shipping.scheduled);
    }
    
    @Test void paymentFails_inventoryIsReleased() {
        payment.shouldFail = true;
        var result = orchestrator.execute(new SagaContext("order-2"));
        assertFalse(result.isSuccess());
        assertTrue(inventory.released);      // compensation ran
        assertFalse(shipping.scheduled);     // never reached
    }
    
    @Test void shippingFails_paymentRefunded_inventoryReleased() {
        shipping.shouldFail = true;
        var result = orchestrator.execute(new SagaContext("order-3"));
        assertFalse(result.isSuccess());
        assertTrue(inventory.released);      // compensation ran
        assertTrue(payment.refunded);        // compensation ran
    }
    
    @Test void sagaLog_recordsAllSteps() {
        orchestrator.execute(new SagaContext("order-4"));
        var entries = log.getEntries("order-4");
        assertTrue(entries.stream().anyMatch(e -> e.status() == SagaStepStatus.COMPLETED));
    }
}
```

---

## 🔴 Failure Scenarios & Erklärungen

| Mistake | Why | Fix |
|---|---|---|
| Compensation throws `Exception` | If compensation itself fails, all remaining compensations are skipped | Wrap in try-catch; log; continue — compensation must NEVER rethrow |
| Compensating in forward order | Step 1 compensation depends on Step 2 state not yet cleaned up | Always compensate in REVERSE order |
| No SagaLog persistence | Process crash mid-saga = orphaned reservations, charges without orders | Persist saga state to DB; on restart, resume from last recorded step |
| Using database transaction across services | Distributed 2PC — extremely brittle, blocks resources | Use async saga + eventual consistency |
| Payment compensation deletes the charge record | Audit trail lost | Mark as REFUNDED — never delete financial records |

---

## 🚀 Extension Challenges

1. **Persistent SagaLog:** Replace `InMemorySagaLog` with a JPA entity in PostgreSQL
2. **Idempotent steps:** Steps called twice (on retry) must not double-charge
3. **Timeout handling:** If ShippingService doesn't respond in 5s, treat as failure and compensate
4. **Kafka choreography alternative:** Rewrite as choreography — each service listens for events and reacts

---

[← Back to Semester 2 Guide](../../00_CURRICULUM/SEMESTER_2_GUIDE.md)
