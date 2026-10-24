# ⚙️ Part 3: Data Flows in Systems

> **Navigation**: [← Understanding User Flows](02_understanding_user_flows.md) | [Chapter overview](../03_System_Design.md) | [OOP vs FUNCTIONAL DESIGN →](04_oop_vs_functional_design.md)
> Page 3 of 5 in **System Design & Feature Creation Guide**


```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DATA FLOWS - COMPLETE UNDERSTANDING                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A DATA FLOW?                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ A DATA FLOW shows how data moves through a system - from input to storage    │
│ to output, including all transformations along the way.                      │
│                                                                              │
│ KEY INSIGHT: Follow the DATA to understand any system!                       │
│                                                                              │
│ EXAMPLE - Order Processing Data Flow:                                        │
│                                                                              │
│ User Input     API Gateway     Order Service    Database      Notification   │
│ ──────────     ───────────     ─────────────    ────────      ────────────   │
│                                                                              │
│ {               {               {               INSERT         Email/SMS     │
│  items: [...],   validated      order_id: 123,  INTO orders    "Order        │
│  address: ...    sanitized      status: NEW,    VALUES (...)   confirmed!"   │
│  payment: ...    authenticated  total: $99                                   │
│ }             }              }                                               │
│                                                                              │
│ ────▶ Transforms at each step! ────▶                                         │
└──────────────────────────────────────────────────────────────────────────────┘

## Types of Data Flows

┌──────────────────────────────────────────────────────────────────────────────┐
│ 1. SYNCHRONOUS DATA FLOW                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ User ───▶ API ───▶ Service ───▶ Database                                     │
│   │                                   │                                      │
│   └───────────────◀───────────────────┘                                      │
│                Response                                                      │
│                                                                              │
│ CHARACTERISTICS:                                                             │
│ • Request waits for response                                                 │
│ • Simple to understand                                                       │
│ • Limited scalability                                                        │
│                                                                              │
│ USE WHEN:                                                                    │
│ • User needs immediate response                                              │
│ • Operation is fast (<100ms)                                                 │
│ • Data consistency is critical                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ 2. ASYNCHRONOUS DATA FLOW                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ User ───▶ API ───▶ Message Queue ───▶ Worker ───▶ Database                   │
│   │          │                                                               │
│   └◀─────────┘                                                               │
│   "Accepted"                                                                 │
│                                                                              │
│ CHARACTERISTICS:                                                             │
│ • Request returns immediately                                                │
│ • Processing happens in background                                           │
│ • Highly scalable                                                            │
│                                                                              │
│ USE WHEN:                                                                    │
│ • Operation is slow (sending email, generating report)                       │
│ • High throughput needed                                                     │
│ • Can tolerate eventual consistency                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ 3. EVENT-DRIVEN DATA FLOW                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                        Event Bus                                             │
│                           │                                                  │
│    ┌──────────────────────┼──────────────────────┐                           │
│    │                      │                      │                           │
│    ▼                      ▼                      ▼                           │
│ ┌──────┐             ┌──────┐              ┌──────┐                          │
│ │Notif.│             │Analyt│              │Invent│                          │
│ │Service│            │Service│             │Service│                         │
│ └──────┘             └──────┘              └──────┘                          │
│                                                                              │
│ CHARACTERISTICS:                                                             │
│ • Services react to events                                                   │
│ • Loose coupling                                                             │
│ • Multiple consumers per event                                               │
│                                                                              │
│ USE WHEN:                                                                    │
│ • Multiple services need same data                                           │
│ • Services should be independent                                             │
│ • Need to add new consumers easily                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — Types of Data Flows**

**Challenge 1 (Reasoning — Who/When/What):** A user places an order. The system must: (1) save the order to the database, (2) send a confirmation email, (3) update inventory, (4) log analytics. Which of these should be synchronous and which asynchronous? For each, answer Who executes it, When, and What must already exist.

<details><summary>Answer</summary>

**Synchronous (user waits):** Save order to DB — **Who?** Order Service. **When?** Immediately, before responding to the user. **What must exist?** An open DB connection. This is synchronous because: (1) the user needs an order confirmation ID, and (2) data consistency is critical — if the save fails, the user must know immediately.

**Asynchronous (background):**

- Email: **Who?** Email Worker. **When?** After the order event is enqueued. **What exists?** The order record in DB (already saved). Sending email is slow (~100ms-1s) and non-critical-path.
- Inventory update: **Who?** Inventory Worker. **When?** Async after order event. **What exists?** The committed order. Can tolerate eventual consistency (brief over-sell window is acceptable for most systems).
- Analytics log: **Who?** Analytics Worker. **When?** Async. Purely for reporting — zero user impact if delayed.

**Pattern:** Synchronous = critical path + user-visible + consistency-required. Asynchronous = slow operations + eventual consistency acceptable + multiple consumers.

</details>

**Challenge 2 (Design):** In Event-Driven architecture, the Order Service publishes `ORDER_PLACED` event. Both Inventory Service and Email Service subscribe. The Inventory Service crashes. What happens to the Email Service? What happens to the Inventory update? Answer using the Who/When/What framework.

<details><summary>Answer</summary>

**Email Service:** **Who?** A completely independent consumer. **When?** Immediately upon seeing the `ORDER_PLACED` event in the bus. **What already exists?** The event in the bus is independent of Inventory's state. **Result:** Email sends successfully. This is the KEY benefit of loose coupling — Inventory crash does NOT cascade.

**Inventory update:** **Who?** Inventory Service (crashed). **When?** It CANNOT process now. **What already exists?** The event remains in the Message Queue (Kafka retains it). When Inventory Service restarts, it replays from its last committed offset — the event is NOT lost. This is exactly why Kafka (persistent log) is used over simple pub/sub (which loses events if consumer is down). Eventual consistency guarantees the update WILL happen.

</details>

---

[← Understanding User Flows](02_understanding_user_flows.md) | [Chapter overview](../03_System_Design.md) | [OOP vs FUNCTIONAL DESIGN →](04_oop_vs_functional_design.md)
