# 🏆 Capstone 2 — Production Microservice from Scratch

> **Semester:** 2 | **Weeks:** 15–16  
> **Estimated time:** 25 hours  
> **Difficulty:** Expert  
> **Languages:** Java 17 + SQL (MySQL 8.0 primary, Oracle 19c SQL compatibility notes)

---

## 🎯 Business Requirement (The PM Brief)

_You are the founding engineer at a B2B SaaS company building an "Invoice Management Service" for small businesses. The CTO insists on production-grade quality from day one: proper DDD entity design, distributed consistency, full test coverage, Docker-ready deployment, and API documentation. This is your solo milestone deliverable before the team scales._

---

## 📋 Technical Specification

### Domain: Invoice Management

**Bounded Context:** Invoice Domain

**Domain Events:**

- `InvoiceCreated`
- `InvoiceApproved`
- `InvoicePaid`
- `InvoiceCancelled`

### Entities

**`Invoice` (Aggregate Root)**

```
id: UUID
invoiceNumber: String (auto-generated, unique, e.g., INV-2024-00001)
clientId: UUID (reference — NOT a direct object join)
status: DRAFT → SENT → APPROVED → PAID | CANCELLED
lineItems: List<LineItem> (child entities — not a separate Aggregate)
subtotal: Money (Value Object — BigDecimal + Currency)
tax: Money
total: Money
dueDate: LocalDate
createdAt: Instant
updatedAt: Instant
```

**`LineItem` (Child Entity of Invoice)**

```
id: UUID
description: String
quantity: int
unitPrice: Money
lineTotal: Money (quantity × unitPrice — calculated, never set directly)
```

**`OutboxEvent` (Infrastructure Entity)**

```
id: UUID
aggregateId: UUID
eventType: String
payload: JSON
createdAt: Instant
processed: boolean
```

### Business Invariants (enforced by the Aggregate Root)

- An `Invoice` in `PAID` or `CANCELLED` status cannot be modified
- `total = subtotal + tax` — always auto-calculated
- `lineTotal = quantity × unitPrice` — always auto-calculated
- An Invoice must have at least 1 LineItem before it can be `SENT`
- `invoiceNumber` is immutable once set

### API Contract

| Method | Path                                     | Auth | Body                      | Response                |
| ------ | ---------------------------------------- | ---- | ------------------------- | ----------------------- |
| POST   | `/api/invoices`                          | JWT  | `CreateInvoiceRequest`    | 201 + `InvoiceResponse` |
| GET    | `/api/invoices/{id}`                     | JWT  | —                         | 200 + `InvoiceResponse` |
| GET    | `/api/invoices`                          | JWT  | ?clientId, ?status, ?page | 200 + Page              |
| PUT    | `/api/invoices/{id}/send`                | JWT  | —                         | 200 + updated           |
| PUT    | `/api/invoices/{id}/approve`             | JWT  | —                         | 200 + updated           |
| PUT    | `/api/invoices/{id}/pay`                 | JWT  | —                         | 200 + updated           |
| DELETE | `/api/invoices/{id}`                     | JWT  | —                         | 204 (only DRAFT)        |
| POST   | `/api/invoices/{id}/line-items`          | JWT  | `LineItemRequest`         | 201                     |
| DELETE | `/api/invoices/{id}/line-items/{itemId}` | JWT  | —                         | 204                     |

---

## 🏗️ Required Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Invoice Service                           │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐  │
│  │ REST API │──▶│  Domain  │──▶│ JPA Repo │──▶│Postgres │  │
│  │(Spring)  │   │(Service) │   │(Spring   │   │(Docker) │  │
│  └──────────┘   └──────────┘   │ Data JPA)│   └─────────┘  │
│                                └──────────┘                 │
│  ┌─────────────────────────────────────────┐                │
│  │      Outbox Pattern (CDC-Ready)          │                │
│  │  Invoice saved + OutboxEvent saved       │                │
│  │  in SAME @Transactional block            │                │
│  └─────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📝 Skeleton Code

### Invoice.java (Aggregate Root)

```java
package com.invoiceservice.domain.invoice;

import jakarta.persistence.*;
import java.math.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    private UUID id;

    @Column(unique = true, nullable = false, updatable = false)
    private String invoiceNumber;

    @Column(nullable = false)
    private UUID clientId; // Reference only — no @ManyToOne join!

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<LineItem> lineItems = new ArrayList<>();

    @Column(precision = 15, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 15, scale = 2)
    private BigDecimal tax;

    @Column(precision = 15, scale = 2)
    private BigDecimal total;

    private LocalDate dueDate;

    @Column(updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @Transient // Not persisted — domain events published BEFORE commit
    private List<DomainEvent> domainEvents = new ArrayList<>();

    protected Invoice() {} // JPA requires no-arg constructor

    public static Invoice create(UUID clientId, LocalDate dueDate) {
        // TODO: validate clientId != null, dueDate > today
        // TODO: set id = UUID.randomUUID()
        // TODO: set invoiceNumber via InvoiceNumberGenerator
        // TODO: set status = DRAFT
        // TODO: add InvoiceCreated domain event to domainEvents
        return new Invoice();
    }

    /**
     * Adds a line item and recalculates totals.
     * @throws InvoiceNotEditableException if status != DRAFT
     */
    public void addLineItem(String description, int quantity, BigDecimal unitPrice) {
        // TODO: enforce status == DRAFT
        // TODO: create LineItem, add to list
        // TODO: call recalculateTotals()
    }

    /**
     * Transitions status to SENT. Enforces: must have at least 1 line item.
     */
    public void send() {
        // TODO: enforce status == DRAFT
        // TODO: enforce lineItems.size() >= 1
        // TODO: set status = SENT
        // TODO: add InvoiceSent domain event
    }

    public void approve() { /* TODO: SENT → APPROVED, add event */ }
    public void pay() { /* TODO: APPROVED → PAID, add event */ }
    public void cancel() { /* TODO: not PAID → CANCELLED, add event */ }

    private void recalculateTotals() {
        // TODO: subtotal = sum of all lineItem.lineTotal
        // TODO: tax = subtotal * 0.18 (GST — externalize this rate)
        // TODO: total = subtotal + tax
    }

    public List<DomainEvent> pullDomainEvents() {
        var events = List.copyOf(domainEvents);
        domainEvents.clear();
        return events;
    }

    // Read-only getters — no public setters for status/total/subtotal
}
```

### InvoiceService.java

```java
package com.invoiceservice.domain.invoice;

import com.invoiceservice.infrastructure.outbox.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepo;
    private final OutboxEventRepository outboxRepo;
    private final DomainEventSerializer eventSerializer;

    /**
     * Creates a new draft invoice AND saves an OutboxEvent — atomically.
     * Uses the Outbox Pattern to guarantee domain event delivery.
     */
    @Transactional
    public Invoice createInvoice(UUID clientId, java.time.LocalDate dueDate) {
        Invoice invoice = Invoice.create(clientId, dueDate);
        invoice = invoiceRepo.save(invoice);

        // Outbox Pattern: save events in SAME transaction as the entity
        for (DomainEvent event : invoice.pullDomainEvents()) {
            outboxRepo.save(OutboxEvent.from(invoice.getId(), event, eventSerializer));
        }

        return invoice;
    }

    @Transactional
    public Invoice addLineItem(UUID invoiceId, String description, int quantity, java.math.BigDecimal unitPrice) {
        // TODO: load invoice, call addLineItem(), save, save outbox events
        return null;
    }

    @Transactional
    public Invoice sendInvoice(UUID invoiceId) {
        // TODO: load, call send(), save, save outbox events
        return null;
    }

    // TODO: approveInvoice, payInvoice, cancelInvoice — same pattern
}
```

---

## ✅ JUnit Test Stubs

### InvoiceAggregateTest.java (Pure Domain Test — no Spring context)

```java
class InvoiceAggregateTest {

    @Test
    void create_invoice_starts_as_DRAFT() {
        var invoice = Invoice.create(UUID.randomUUID(), LocalDate.now().plusDays(30));
        assertEquals(InvoiceStatus.DRAFT, invoice.getStatus());
        assertEquals(1, invoice.pullDomainEvents().size()); // InvoiceCreated event
    }

    @Test
    void send_without_lineItems_throws() {
        var invoice = Invoice.create(UUID.randomUUID(), LocalDate.now().plusDays(30));
        assertThrows(InvoiceNotSendableException.class, invoice::send);
    }

    @Test
    void addLineItem_recalculatesTotals() {
        var invoice = Invoice.create(UUID.randomUUID(), LocalDate.now().plusDays(30));
        invoice.addLineItem("Consulting", 10, new BigDecimal("1000.00"));

        assertEquals(new BigDecimal("10000.00"), invoice.getSubtotal());
        assertEquals(new BigDecimal("1800.00"), invoice.getTax());   // 18% GST
        assertEquals(new BigDecimal("11800.00"), invoice.getTotal());
    }

    @Test
    void pay_paidInvoice_throws() {
        var invoice = Invoice.create(UUID.randomUUID(), LocalDate.now().plusDays(30));
        invoice.addLineItem("Design", 5, new BigDecimal("500.00"));
        invoice.send();
        invoice.approve();
        invoice.pay();

        assertThrows(InvoiceNotEditableException.class, invoice::pay);
    }

    @Test
    void outbox_events_are_cleared_after_pull() {
        var invoice = Invoice.create(UUID.randomUUID(), LocalDate.now().plusDays(30));
        invoice.pullDomainEvents(); // pull once
        assertEquals(0, invoice.pullDomainEvents().size()); // second pull = empty
    }
}
```

### InvoiceControllerTest.java (MockMvc)

```java
@WebMvcTest(InvoiceController.class)
class InvoiceControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean InvoiceService invoiceService;

    @Test
    @WithMockUser
    void createInvoice_validRequest_returns201() throws Exception {
        // TODO: mock invoiceService.createInvoice → sample invoice
        //       POST /api/invoices → expect 201 + invoiceNumber in response
    }

    @Test
    void createInvoice_unauthenticated_returns401() throws Exception {
        // TODO: no JWT → expect 401
    }
}
```

---

## 🔴 Failure Scenarios & Erklärungen

| Mistake                                                         | Why                                                         | Fix                                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Storing `clientId` as `@ManyToOne Client client`                | Cross-aggregate direct reference — violates DDD             | Store `UUID clientId` only; load Client via its own repository when needed       |
| Setting `total` via setter from outside Invoice                 | Breaks invariant — total could become incorrect             | `total` is private; only `recalculateTotals()` sets it, called internally        |
| Sending Kafka message inside `@Transactional` before commit     | Dual-write problem — message may be sent but DB rollbacks   | Use Outbox Pattern: save event to DB in SAME transaction, let CDC relay to Kafka |
| `invoice.pullDomainEvents()` called before `invoiceRepo.save()` | Events cleared but invoice not yet saved — events lost      | Always save entity first, then pull + save outbox events                         |
| `@OneToMany(fetch = EAGER)` on lineItems                        | Loads all line items every time an Invoice is queried — N+1 | Always `LAZY`; use `JOIN FETCH` in queries that need line items                  |
| `invoiceNumber` as auto-increment DB sequence                   | Does not survive microservice migration                     | Generate via application-level strategy (Year-Month-Sequence) in domain          |

---

## 🚀 Extension Challenges

1. **Implement a `@Scheduled` outbox relay** — every 5 seconds, scan unprocessed OutboxEvents and publish to Kafka (simulated as a log for now)
2. **Add Swagger/OpenAPI** — `springdoc-openapi` with full schema documentation
3. **Add Testcontainers** — replace H2 with a real PostgreSQL Docker container in integration tests
4. **PDF generation** — when invoice is `SENT`, generate a PDF receipt using Apache PDFBox
5. **Multi-currency** — support invoices in USD, EUR, INR; store as amount + currency code; prevent arithmetic across currencies

---

## 📊 Self-Assessment Rubric

| Criterion                              | 0                            | 1                                 | 2                      | 3                            |
| -------------------------------------- | ---------------------------- | --------------------------------- | ---------------------- | ---------------------------- |
| DDD Aggregate Root enforces invariants | No domain logic              | Some checks in service            | All in entity          | + domain events              |
| Outbox Pattern implemented             | No events                    | Events sent directly (dual-write) | Outbox table used      | + relay worker               |
| REST API semantics                     | Wrong status codes           | 200 for everything correct        | Proper 201/204/404/409 | + RFC 7807 errors            |
| Test coverage                          | No tests                     | Unit only                         | Unit + MockMvc         | Unit + MockMvc + Integration |
| Domain purity                          | Spring annotations in domain | Minimal coupling                  | Pure domain classes    | + no ORM in domain           |

---

[← Back to Semester 2 Guide](../../00_CURRICULUM/SEMESTER_2_GUIDE.md)
