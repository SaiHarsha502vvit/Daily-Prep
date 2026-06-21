**Navigation**: [< Previous](02_Design_Patterns.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_User_System_Flows.md)

# 🏗️ System Design & Feature Creation Guide

## From User Needs to Working Systems

---

# 🏗️ Part 0: Complete Understanding of System Design

## What Is System Design?

System Design is the process of defining the ARCHITECTURE, COMPONENTS,
MODULES, INTERFACES, and DATA for a system to satisfy specified
requirements.

💡 **KEY INSIGHT: It's about making DECISIONS that balance trade-offs!**

- Performance vs Cost
- Consistency vs Availability
- Simplicity vs Flexibility
- Speed of development vs Scalability

💡 **ANALOGY:**

- Architect designing a building:
- Understands user needs (families, offices, shops)
- Plans structure (foundation, floors, rooms)
- Chooses materials (concrete, steel, glass)
- Considers constraints (budget, land, regulations)
- Software System Designer:
- Understands user needs (features, performance)
- Plans structure (services, databases, APIs)
- Chooses technologies (languages, frameworks, cloud)
- Considers constraints (budget, team size, deadlines)

**Historical Evolution**:

- 1960s: Monolithic systems - everything in one place
- 1970s: Modular programming - break into modules
- 1980s: Client-Server - separate presentation from logic
- 1990s: 3-Tier Architecture - presentation, logic, data
- 2000s: SOA (Service-Oriented Architecture)
- 2010s: Microservices - small, independent services
- 2020s: Serverless, Edge Computing, AI-integrated systems

🔬 **Section Challenge — What Is System Design?**

**Challenge 1 (Reasoning — Who/When/What):** The evolution timeline shows 1990s → 3-Tier Architecture. **Who** splits the system into 3 tiers? **When** does the separation happen (compile-time or runtime)? **What** problem does it solve that 2-tier client-server doesn't?

<details><summary>Answer</summary>

**Who?** The architect, at design time. The tiers are: Presentation (UI), Business Logic (application server), Data (database). **When?** The separation is both compile-time (separate codebases/deployable units) and runtime (different servers). **What problem does it solve?** In 2-tier, business logic lives in the client (fat client) — every client update requires redeploying to all desktops. 3-tier centralizes logic on the server: update once, all clients get the new behavior. This also enables independent scaling — you can add more app servers without touching the DB tier.

</details>

## What Problem Does System Design Solve

PROBLEM 1: COMPLEXITY

- Modern apps have millions of lines of code
- Without structure, it becomes unmaintainable
- System design breaks complexity into manageable pieces
  PROBLEM 2: SCALE
- What works for 100 users fails for 1 million
- System design plans for growth
  PROBLEM 3: RELIABILITY
- Systems must work 24/7
- Single points of failure cause outages
- System design builds redundancy
  PROBLEM 4: TEAM COORDINATION
- Multiple teams work on same product
- Need clear boundaries and interfaces
- System design enables parallel development
  REAL-WORLD FAILURES WITHOUT GOOD DESIGN:
- 2017: Amazon S3 outage took down half the internet
- 2019: Facebook outage - 14 hours, $90 million lost
- 2021: Fastly CDN outage - major sites down globally

🔬 **Section Challenge — What Problem Does System Design Solve**

**Challenge 1 (Reasoning):** The Facebook 2019 outage lost $90M in 14 hours. Using the Who/When/What framework: **Who** was the single point of failure? **When** did the cascading failure begin? **What** system design principle was violated?

<details><summary>Answer</summary>

**Who?** A misconfigured BGP routing update (single configuration change). **When?** The cascade began the moment Facebook's DNS servers became unreachable — since their internal tools ALSO depended on the same DNS infrastructure, engineers couldn't even log in to fix it. **What principle was violated?** No redundancy in the management plane. The control system (used to diagnose and fix outages) depended on the same infrastructure it needed to fix. This violates the principle of **independent failure domains** — your recovery mechanism must never share failure modes with the system it recovers.

</details>

## Why Learn System Design

1. CAREER GROWTH:

- Junior: Write code given specifications
- Mid-level: Design features
- Senior: Design systems
- Architect: Design organizations of systems

2. INTERVIEW ESSENTIAL:

- Every senior interview has system design round
- Tests thinking ability, not memorization

3. BETTER CODE:

- Understanding the big picture improves your components
- Know how your code fits in the system

4. BUSINESS IMPACT:

- Good design saves millions in infrastructure
- Bad design costs companies everything (see failures above)

5. PROBLEM-SOLVING:

- System design is ultimate problem-solving
- Balancing constraints with creative solutions

🔬 **Section Challenge — Why Learn System Design**

**Challenge 1 (Reasoning — Who/When/What):** The section says system design is about "constraints" and "creative solutions." You're designing a notification service that must send 10M push notifications per hour. **Who** are the actors? **What** is the bottleneck? **When** does a naive approach fail?

<details><summary>Answer</summary>

**Who?** Producer: the event trigger (e.g., new message received). Consumer: the notification sender (calls Firebase/APNS). **Naive approach:** Synchronous loop — for each event, call Firebase API directly. **When does it fail?** At scale. Each Firebase call takes ~100ms. Sequential: 10M × 100ms = 277 hours. Even with 100 threads: 2.7 hours — too slow. **Fix:** Message queue (Kafka) + worker pool. Producer publishes events to a topic. N consumers pull batches and send in parallel. Firebase supports batch sends (up to 500/request). 10M ÷ 500 = 20K requests ÷ 100 workers = 200 requests/worker × 100ms = 20 seconds. **Bottleneck shifts** from CPU to network/rate limits — that's the real system design challenge.

</details>

## When To Apply System Design Thinking

ALWAYS! Even for small projects, think about:

- What components do I need?
- How do they communicate?
- What happens when something fails?
- How will this scale?

**Specific Scenarios**:

1. STARTING A NEW PROJECT:
   → Define architecture before coding
2. ADDING A MAJOR FEATURE:
   → Plan how it fits in existing system
3. PERFORMANCE PROBLEMS:
   → Analyze system bottlenecks
4. SCALING NEEDS:
   → Redesign for higher load
5. INTEGRATION:
   → Connect with external systems

## How To Approach System Design (Step-By-Step)

STEP 1: UNDERSTAND REQUIREMENTS (5-10 min)
Functional Requirements:

- What should the system DO?
- What are the core features?
- Who are the users?
  Non-Functional Requirements:
- How many users? (Scale)
- How fast? (Latency)
- How reliable? (Availability)
- How consistent? (Data integrity)
  STEP 2: ESTIMATE SCALE (5 min)
- Daily Active Users (DAU)
- Requests per second (RPS)
- Data storage needs
- Read vs Write ratio
  STEP 3: HIGH-LEVEL DESIGN (10-15 min)
- Draw main components
- Show data flow
- Identify databases needed
- Plan API structure
  STEP 4: DEEP DIVE (15-20 min)
- Design specific components
- Database schema
- API endpoints
- Caching strategy
- Handle edge cases
  STEP 5: IDENTIFY BOTTLENECKS (5 min)
- What could fail?
- What could be slow?
- How to add redundancy?
- How to scale each component?

🔬 **Section Challenge — How To Approach System Design (Step-By-Step)**

**Challenge 1 (Design):** You're asked to design "Instagram". Walk through Steps 1-3 in under 5 minutes. What are 3 functional requirements, 2 non-functional requirements, and what does the high-level component diagram look like?

<details><summary>Answer</summary>

**Step 1 — Functional:** (1) Upload photos with captions, (2) Follow users and see their posts in a feed, (3) Like/comment on photos. **Non-functional:** (1) High availability (99.9%+), (2) Read-heavy — feed reads >> photo uploads, so optimize reads. **Step 2 — Scale:** ~500M DAU, ~100M photos/day, average photo 2MB → ~200TB/day storage, read:write ratio ~100:1. **Step 3 — High-level:** `Client → CDN (static images) → Load Balancer → API Gateway → {User Service, Feed Service, Upload Service, Notification Service} → {PostgreSQL (user/metadata), Object Store/S3 (photos), Redis (feed cache), Kafka (async events)}`.

</details>

## Difficulties & Common Mistakes

1. "WHERE DO I START?":
   Solution: Always start with REQUIREMENTS
   Ask clarifying questions before designing
2. "TOO MANY OPTIONS":
   Solution: There's no perfect answer! Explain trade-offs
   Pick one approach and justify it
3. "DON'T KNOW ALL TECHNOLOGIES":
   Solution: Focus on CONCEPTS, not specific tools
   "We need a cache" is better than "We need Redis"
4. "CAN'T ESTIMATE SCALE":
   Solution: Use approximations with reasoning
   "If 1 million users, and each makes 10 requests/day..."
5. "GOING TOO DEEP TOO EARLY":
   Solution: Start broad, then drill down
   Don't design database schema before knowing components

## Expected Outcomes

- ✅ STRUCTURED THINKING: Break any problem into components
- ✅ TRADE-OFF ANALYSIS: Understand costs of decisions
- ✅ SCALABILITY MINDSET: Design for growth from the start
- ✅ INTERVIEW SUCCESS: Ace system design rounds
- ✅ CAREER ADVANCEMENT: Move to senior/architect roles
- ✅ BETTER COMMUNICATION: Explain technical decisions clearly

**The Transformation**:

**From**: "I can write code for features"

**To**: "I can design systems that teams build"

---

# 📌 Part 1: Understanding User Flows

## What is a User Flow?

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         USER FLOWS - COMPLETE GUIDE                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A USER FLOW?                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ A USER FLOW is the PATH a user takes through your application to complete    │
│ a specific task or goal.                                                     │
│                                                                              │
│ EXAMPLE - E-commerce Purchase Flow:                                          │
│                                                                              │
│ ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐          │
│ │ Browse  │──▶│ View    │──▶│ Add to  │──▶│Checkout │──▶│ Payment │          │
│ │Products │   │ Product │   │  Cart   │   │  Page   │   │ Success │          │
│ └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘          │
│      │              │             │             │                            │
│      ▼              ▼             ▼             ▼                            │
│   [Search]    [Reviews]    [Update Qty]   [Apply Coupon]                     │
│   [Filter]    [Similar]    [Remove]       [Change Address]                   │
│                                                                              │
│ KEY INSIGHT:                                                                 │
│ Every screen, button, and action is part of a FLOW!                          │
│ Good design makes flows INTUITIVE and EFFICIENT.                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DO USER FLOWS SOLVE?                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PROBLEM 1: CONFUSION                                                         │
│ • "Where do I click next?"                                                   │
│ • Solution: Map every step clearly                                           │
│                                                                              │
│ PROBLEM 2: DROP-OFF                                                          │
│ • Users abandon halfway through a process                                    │
│ • Solution: Minimize steps, reduce friction                                  │
│                                                                              │
│ PROBLEM 3: ERRORS                                                            │
│ • Users get stuck in error states                                            │
│ • Solution: Plan error paths and recovery                                    │
│                                                                              │
│ PROBLEM 4: DEVELOPMENT CHAOS                                                 │
│ • Developers don't know what to build                                        │
│ • Solution: User flows serve as specifications                               │
│                                                                              │
│ REAL IMPACT:                                                                 │
│ • Amazon: Removing one click increased revenue by $300M/year                 │
│ • Airbnb: Simplifying booking flow increased conversions 30%                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW TO CREATE USER FLOWS                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ STEP 1: IDENTIFY THE GOAL                                                    │
│ • What does the user want to accomplish?                                     │
│ • Example: "User wants to purchase a product"                                │
│                                                                              │
│ STEP 2: IDENTIFY ENTRY POINTS                                                │
│ • How does the user start this flow?                                         │
│ • Example: Homepage, search results, email link, ad click                    │
│                                                                              │
│ STEP 3: MAP THE HAPPY PATH                                                   │
│ • The ideal path with no errors                                              │
│ • Minimum steps to achieve goal                                              │
│                                                                              │
│ STEP 4: MAP ALTERNATIVE PATHS                                                │
│ • What if user wants to change something?                                    │
│ • What if user wants to go back?                                             │
│                                                                              │
│ STEP 5: MAP ERROR PATHS                                                      │
│ • What if payment fails?                                                     │
│ • What if item is out of stock?                                              │
│ • How does user recover?                                                     │
│                                                                              │
│ STEP 6: IDENTIFY DATA NEEDED                                                 │
│ • What data do we need at each step?                                         │
│ • What data do we collect from user?                                         │
│ • What data do we show to user?                                              │
└──────────────────────────────────────────────────────────────────────────────┘

## User Flow Notation

USER FLOW SYMBOLS:
┌─────────┐
│  PAGE   │  Rectangle = Screen/Page
└─────────┘

◇ Decision ◇  Diamond = Decision Point

○ Start/End ○  Circle = Start or End

───────▶  Arrow = Flow Direction

┌─────────┐
│ Action  │  Rounded = User Action
└─────────┘
```

## Example: Login Flow

```
                    ○ Start
                        │
                        ▼
                ┌───────────────┐
                │  Login Page   │
                └───────┬───────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
    ┌───────────────┐      ┌───────────────┐
    │Email + Password│     │  Social Login │
    └───────┬───────┘      └───────┬───────┘
            │                       │
            ▼                       ▼
        ◇ Valid? ◇            ◇ Authorized? ◇
       /        \             /            \
     Yes         No         Yes             No
      │           │          │               │
      ▼           ▼          ▼               ▼
 ┌─────────┐ ┌─────────┐ ┌─────────┐  ┌─────────┐
 │Dashboard│ │  Error  │ │Dashboard│  │  Error  │
 └─────────┘ │ Message │ └─────────┘  │ Message │
             └────┬────┘              └────┬────┘
                  │                        │
                  ▼                        ▼
            ◇ Retry? ◇              ◇ Retry? ◇
           /        \              /        \
         Yes        No           Yes        No
          │          │            │          │
          ▼          ▼            ▼          ▼
     [Back to   ┌─────────┐  [Back to   ○ End
      Login]    │ Forgot  │   Login]
                │Password │
                └─────────┘
```

---

# 📌 Part 2: Feature Creation Framework

## What Is Feature Creation?

The complete process of taking a user need or business requirement and
turning it into working software.

**Stages**:

1. IDEATION: "Users need X"
2. SPECIFICATION: "X means exactly this behavior"
3. DESIGN: "X will be built using these components"
4. IMPLEMENTATION: "Here's the code for X"
5. TESTING: "X works as expected"
6. DEPLOYMENT: "X is live for users"
7. MONITORING: "X is performing well"

## The Feature Creation Checklist

□ UNDERSTANDING PHASE:
□ What problem does this feature solve?
□ Who are the users?
□ What's the success metric?
□ What are the constraints (time, tech, resources)?
□ DESIGN PHASE:
□ User flow mapped?
□ UI/UX designs ready?
□ API contracts defined?
□ Database schema designed?
□ Edge cases identified?
□ IMPLEMENTATION PHASE:
□ Code follows design patterns?
□ Unit tests written?
□ Integration tests written?
□ Error handling complete?
□ Logging added?
□ DEPLOYMENT PHASE:
□ Feature flag ready?
□ Rollback plan exists?
□ Monitoring dashboards set up?
□ Alerts configured?

## Example: Creating a "Like" Feature

## Like_Id │ User_Id │ Post_Id │ Created_At

| PK | FK→users | FK→posts | timestamp |

---

# ⚙️ Part 3: Data Flows in Systems

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

# PART 4: OOP vs FUNCTIONAL DESIGN

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

# 🎨 Part 5: System Design Patterns

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

# 🏗️ Part 6: Real — World System Design Examples

## Example 1: URL Shortener (Like bit.ly)

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

## Example 2: Chat System (Like WhatsApp)

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

# 💪 Part 7: Practice Exercises

SYSTEM DESIGN PRACTICE PROBLEMS

BEGINNER LEVEL:

1. Design a Parking Lot System
2. Design a Library Management System
3. Design a URL Shortener
4. Design a Rate Limiter
5. Design a Task Scheduler

INTERMEDIATE LEVEL: 6. Design Twitter Feed 7. Design Instagram 8. Design Uber/Ola 9. Design Netflix 10. Design WhatsApp

ADVANCED LEVEL: 11. Design Google Search 12. Design YouTube 13. Design Distributed Cache 14. Design Payment System 15. Design Stock Trading Platform

FOR EACH PROBLEM:

1. Clarify requirements (5 min)
2. Estimate scale (5 min)
3. Draw high-level design (10 min)
4. Deep dive into components (15 min)
5. Discuss trade-offs (5 min)

---

## PLUS Enhancements

### ASCII Diagram 1: C4 Model Hierarchy

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         C4 MODEL HIERARCHY                                   ║
║              (Context → Container → Component → Code)                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│  LEVEL 1: SYSTEM CONTEXT                                                      │
│  "What is the system and who uses it?"                                       │
│                                                                              │
│    ┌───────────────┐                    ┌──────────────┐                     │
│    │    Customer   │──uses──────────────▶│  Banking     │                     │
│    │   (Person)    │◀───────────────────│   System     │                     │
│    └───────────────┘     views/transacts└──────────────┘                     │
│                                        ┌──────────────┐                     │
│                                        │  External    │                     │
│                                        │  Bank APIs   │                     │
│                                        └──────▲───────┘                     │
└──────────────────────────────────────────────│──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LEVEL 2: CONTAINER (Process/Deployment Unit)                                │
│  "What applications/deployable units does the system consist of?"            │
│                                                                              │
│    ┌──────────────────────────────────────────────────────────────────────┐  │
│    │                         BANKING SYSTEM                                 │  │
│    │                                                                       │  │
│    │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │  │
│    │   │  Web App    │    │   Mobile    │    │   Admin     │               │  │
│    │   │  (React)    │    │   App       │    │   Portal    │               │  │
│    │   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘               │  │
│    │          │                  │                  │                       │  │
│    │          └──────────────────┼──────────────────┘                       │  │
│    │                             │                                          │  │
│    │                             ▼                                          │  │
│    │                    ┌─────────────────┐                                 │  │
│    │                    │   API Gateway   │                                 │  │
│    │                    │   (Kong/AWS)    │                                 │  │
│    │                    └────────┬────────┘                                 │  │
│    │                             │                                          │  │
│    │          ┌──────────────────┼──────────────────┐                       │  │
│    │          ▼                  ▼                  ▼                       │  │
│    │   ┌────────────┐    ┌────────────┐    ┌────────────┐                   │  │
│    │   │  User Svc  │    │  Account   │    │  Payment   │                   │  │
│    │   │  Service   │    │  Service   │    │  Service   │                   │  │
│    │   └─────┬──────┘    └─────┬──────┘    └─────┬──────┘                   │  │
│    │         │                 │                 │                          │  │
│    │         └─────────────────┼─────────────────┘                          │  │
│    │                           ▼                                             │  │
│    │                   ┌───────────────┐                                    │  │
│    │                   │  PostgreSQL   │                                    │  │
│    │                   │  Database     │                                    │  │
│    │                   └───────────────┘                                    │  │
│    └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LEVEL 3: COMPONENT (Major Code Grouping)                                    │
│  "What are the major components within a container?"                         │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                      AUTHENTICATION SERVICE                          │    │
│   │   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐    │    │
│   │   │  SessionMgr    │    │  TokenValidator│    │  OAuth2Client  │    │    │
│   │   │  Component     │    │  Component     │    │  Component     │    │    │
│   │   └────────────────┘    └────────────────┘    └────────────────┘    │    │
│   │           │                    │                    │               │    │
│   │           └────────────────────┼────────────────────┘               │    │
│   │                                ▼                                      │    │
│   │                    ┌────────────────────┐                            │    │
│   │                    │  AuthController    │                            │    │
│   │                    │  (login/logout)    │                            │    │
│   │                    └────────────────────┘                            │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LEVEL 4: CODE (Classes/Functions)                                           │
│  "What is the code structure for a specific component?"                      │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                     SessionManager.java                              │    │
│   │                                                                       │    │
│   │   - createSession(userId): Session                                   │    │
│   │   - validateToken(token): Boolean                                    │    │
│   │   - refreshSession(token): Session                                   │    │
│   │   - invalidateSession(token): Void                                   │    │
│   │                                                                       │    │
│   │   Uses: Redis (tokens), JWT (claims), BCrypt (password hashing)      │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ASCII Diagram 2: End-to-End Request Flow

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    END-TO-END REQUEST FLOW                                    ║
║            Client → DNS → CDN → LB → Gateway → Auth → Business → DB           ║
╚══════════════════════════════════════════════════════════════════════════════╝

     USER
       │
       │ 1. Browser types "https://api.example.com/products/123"
       │    DNS Resolution: api.example.com → 203.0.113.50
       ▼
  ┌─────────┐
  │   DNS   │─────────────────────────────────────────────────────────────────
  │ Service │                                                                  │
  └────┬────┘                                                                  │
       │ 2. Return IP: 203.0.113.50                                            │
       ▼                                                                       │
  ┌─────────┐      3. Check edge cache (static assets: CSS, JS, images)        │
  │   CDN   │───────HIT──▶ Return from cache (~10ms)                           │
  │(Cloudflare)│     │                                                         │
  └────┬────┘      │ MISS                                                      │
       │           ▼ (dynamic content continues)                               │
       │ 4. Dynamic request to origin                                          │
       ▼                                                                       │
  ┌────────────────┐     5. Route to least-loaded server                       │
  │  LOAD BALANCER │─────────────────────────────────────────────────────────
  │   (Nginx/ALB)  │     Uses: Round Robin / Least Connections / IP Hash       │
  └───────┬────────┘                                                           │
          │ 6. TCP connection to upstream                                       │
          ▼                                                                     │
  ┌────────────────┐     7. Authenticate: JWT, API Key, OAuth2 token           │
  │   API GATEWAY  │─────────────────────────────────────────────────────────
  │  (Kong/AWS)    │     Checks: Rate limit, IP allow/deny, Request size       │
  └───────┬────────┘                                                           │
          │ 8. Validated request to internal service                            │
          ▼                                                                     │
  ┌────────────────┐     9. Verify: token valid? user exists? has permission?  │
  │ AUTH SERVICE   │─────────────────────────────────────────────────────────
  │(Keycloak/OIDC) │     Returns: User claims or 401 Unauthorized              │
  └───────┬────────┘                                                           │
          │ 10. Authenticated request with user context                         │
          ▼                                                                     │
  ┌────────────────┐     11. Business logic execution                           │
  │   BUSINESS     │─────────────────────────────────────────────────────────
  │   SERVICE      │     Operations: validate, enrich, transform, authorize    │
  │(Product Svc)   │     May call: other services, external APIs               │
  └───────┬────────┘                                                           │
          │ 12. Data fetch request                                              │
          ▼                                                                     │
  ┌────────────────┐     13. Check Redis cache first                            │
  │  REDIS CACHE   │─────────────────────────────────────────────────────────
  │ (Read-through) │     HIT: Return cached value (~1ms)                       │
  └───────┬────────┘     MISS: Continue to DB                                  │
          │ 14. Cache miss → query database                                     │
          ▼                                                                     │
  ┌────────────────┐     15. SELECT * FROM products WHERE id=123               │
  │  PRIMARY DB    │─────────────────────────────────────────────────────────
  │ (PostgreSQL)   │     Returns: {id: 123, name: "Widget", price: 29.99}     │
  └───────┬────────┘     Write to cache: SETEX product:123 3600 {json}        │
          │ 16. Product data                                                    │
          ▼                                                                     │
  ┌────────────────┐     17. Transform to API response DTO                     │
  │  RESPONSE      │─────────────────────────────────────────────────────────
  │  TRANSFORMER   │     Strip internal fields, format dates, enrich metadata  │
  └───────┬────────┘                                                           │
          │ 18. JSON response                                                   │
          ▼                                                                     │
  ┌────────────────┐     19. 200 OK with response body                         │
  │   HTTP/2       │─────────────────────────────────────────────────────────
  │   RESPONSE     │     Cache-Control: max-age=3600                           │
  └───────┬────────┘     ETag: "abc123"                                        │
          │ Reverse path through Gateway → LB → CDN → User                     │
          ▼                                                                     │
       USER
       Receives response in ~50-200ms total
```

### ASCII Diagram 3: CAP Theorem Triangle

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         CAP THEOREM TRIANGLE                                  ║
║                                                                               ║
║       During a network partition (which IS inevitable in distributed systems) ║
║       you MUST choose between Consistency and Availability                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

                                    ┌─ C ─┐
                                   /       \
                                  / CONSIS-  \
                                 /  TENCY    /
                                /            \
                               /      CP       \
                              ▼─────────────── ▼
                    ┌─────────┐             ┌─────────┐
                    │         │  PARTITION   │         │
                    │  CP     │◀────────────▶│   AP    │
                    │ SYSTEMS │   TOLERANCE  │ SYSTEMS │
                    │         │              │         │
                    └─────────┘              └─────────┘
                         │                        │
                         │                        │
                         ▼                        ▼
                   ┌──────────┐            ┌──────────┐
                   │ MongoDB  │            │Cassandra │
                   │ (default)│            │ DynamoDB │
                   │  HBase   │            │ CouchDB  │
                   │ZooKeeper │            │  DNS     │
                   │ Redis    │            │  Riak    │
                   │ Cluster  │            │         │
                   └──────────┘            └──────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │  WHAT HAPPENS DURING PARTITION:                                         │
    │                                                                          │
    │  ┌─────────────────────────────────┬─────────────────────────────────┐  │
    │  │        CP (Consistency+Partition)│       AP (Availability+Partition)│  │
    │  ├─────────────────────────────────┼─────────────────────────────────┤  │
    │  │ REFUSE OPERATIONS               │ ACCEPT OPERATIONS EVERYWHERE    │  │
    │  │ until partition heals           │ reconcile differences later      │  │
    │  ├─────────────────────────────────┼─────────────────────────────────┤  │
    │  │ Example: ZooKeeper              │ Example: Cassandra              │  │
    │  │ - Leader election required      │ - Quorum reads/writes            │  │
    │  │ - Writes rejected if no quorum  │ - Last-writer-wins conflict     │  │
    │  │                                 │   resolution                     │  │
    │  ├─────────────────────────────────┼─────────────────────────────────┤  │
    │  │ USE WHEN:                       │ USE WHEN:                       │  │
    │  │ - Money/ledger systems          │ - Social feeds, likes           │  │
    │  │ - Inventory/atomic transactions │ - Shopping carts                │  │
    │  │ - Any system where stale data   │ - User-generated content        │  │
    │  │   is catastrophic               │ - "Always on" requirement       │  │
    │  └─────────────────────────────────┴─────────────────────────────────┘  │
    │                                                                          │
    │  NOTE: CA (Consistency+Availability without Partition) does NOT EXIST    │
    │  in distributed systems. A single-node PostgreSQL is CA, but the moment  │
    │  you add a second node for replication, you have a partition and must    │
    │  choose CP or AP.                                                         │
    └─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────┐
    │  REAL-WORLD DECISIONS:                                                   │
    │                                                                          │
    │  Netflix (AP): A stale recommendation is annoying but not catastrophic.  │
    │               AP gives "always available" which is a better UX.          │
    │                                                                          │
    │  Banks (CP): A double-spend of $1M during partition reconciliation       │
    │              is bankruptcy-class failure. Refuse writes during partition. │
    │                                                                          │
    │  Amazon Dynamo Paper (2007): Explicitly chose AP for shopping cart       │
    │  because duplicate items during reconciliation are recoverable, but       │
    │  refusing to add-to-cart is catastrophic for conversion rate.            │
    └─────────────────────────────────────────────────────────────────────────┘
```

### CAP Refinement: PACELC and the "Choose 2" Misnomer

The simple "choose 2" framing is a pedagogical shorthand. Gilbert and Lynch's 2002 proof (MIT / Brewer's conjecture formalized) showed that during a partition you must sacrifice either consistency OR availability — but the trade-off is not binary in normal operation. **PACELC** (Daniel Abadi, 2010) extends CAP: if Partition (P), choose Availability or Consistency (A or C); **E**lse (no partition), choose **L**atency or **C**onsistency. A real-world CP system like ZooKeeper trades latency for consistency even when partitions are rare. The point: "during a partition" is the only time the C/A trade-off forces your hand.

---

### Deep-Dive: Database Read Replicas

**How Async Replication Works:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  READ REPLICA REPLICATION FLOW (Async, Primary → Replica)                   │
│                                                                              │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐            │
│  │   Primary     │      │  WAL/Binlog   │      │   Replica     │            │
│  │   Database    │      │   (Write-     │      │   Database    │            │
│  │               │      │   ahead log)  │      │               │            │
│  │  ┌─────────┐  │      │               │      │  ┌─────────┐  │            │
│  │  │ INSERT  │  │      │  ┌─────────┐  │      │  │ REPLAY  │  │            │
│  │  │ "order" │──┼──────▶│  │ row x   │──┼─────▶│  │ "order" │  │            │
│  │  └─────────┘  │      │  │ changes │  │      │  └─────────┘  │            │
│  │               │      │  └─────────┘  │      │               │            │
│  │               │      │               │      │  [5-500ms     │            │
│  │               │      │               │      │   lag behind] │            │
│  └───────────────┘      └───────────────┘      └───────────────┘            │
│                                                                              │
│  MECHANISM DETAILS:                                                          │
│                                                                              │
│  1. PRIMARY writes transaction to WAL (Write-Ahead Log)                      │
│     - WAL is append-only, ordered by LSN (Log Sequence Number)               │
│     - Write committed to WAL BEFORE returning to client (durability)         │
│                                                                              │
│  2. REPLICA's IO thread reads from primary's WAL                             │
│     - Polls every N milliseconds (configurable: 1ms, 10ms, 100ms)            │
│     - Reads only the bytes it hasn't seen (tracking LSN position)            │
│                                                                              │
│  3. REPLICA's SQL thread APPLIES the changes                                 │
│     - Replays INSERT/UPDATE/DELETE on local copy                             │
│     - Runs in order (preserves transactional consistency on replica)         │
│                                                                              │
│  4. REPLICATION LAG = time between primary commit and replica apply          │
│     - Typical: 5ms-500ms (depends on load, network, distance)                │
│     - Can grow to seconds/minutes during heavy write bursts                  │
│     - Can grow indefinitely if replica is down or unreachable                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**The Replication Lag Problem and Stale Read Handling:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REPLICATION LAG WINDOWS                                                      │
│                                                                              │
│  PRIMARY                                                              REPLICA│
│     │                                                                     │   │
│  T=0ms ─── INSERT order_123 ───────────────────────▶ (write)               │   │
│     │                                                                     │   │
│  T=10ms ───────────────────────────────────────────▶ (poll WAL)            │   │
│     │                                                                     │   │
│  T=50ms ───────────────────────────────────────────▶ (apply INSERT)        │   │
│     │                                                                     │   │
│     │  ──── LAG WINDOW: 50ms ────                                         │   │
│     │                                                                     │   │
│  During this window, reads from REPLICA see stale data (order_123 missing) │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  STRATEGIES FOR HANDLING STALE READS                                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. READ-YOUR-WRITES CONSISTENCY (Monotonic)                            │ │
│  │                                                                        │ │
│  │  User writes data → immediately read it → GUARANTEED to see their write│ │
│  │                                                                        │ │
│  │  Implementation: After write, read from PRIMARY (not replica)          │ │
│  │  for a configurable duration (e.g., 30 seconds post-write)             │ │
│  │                                                                        │ │
│  │  Code:                                                                  │ │
│  │    async def write_order(order):                                       │ │
│  │        db.primary.execute("INSERT INTO orders...", order)               │ │
│  │        # Force sync to at least one replica before returning           │ │
│  │        db.primary.execute("SELECT pg_current_wal_flush_lsn()")          │ │
│  │        return order_id                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 2. MONOTONIC READS                                                      │ │
│  │                                                                        │ │
│  │  If user reads value V1 at time T1, they will NEVER see older V0       │ │
│  │  at time T2 > T1. Prevents "going back in time."                       │ │
│  │                                                                        │ │
│  │  Implementation: Bind user session to specific replica for duration    │ │
│  │  of session. Don't randomly route to different replicas.               │ │
│  │                                                                        │ │
│  │  Session → sticky replica mapping in load balancer                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 3. CAUSAL CONSISTENCY                                                   │ │
│  │                                                                        │ │
│  │  If operation A causes/caused operation B, then B sees A's effects     │ │
│  │                                                                        │ │
│  │  Example: User posts comment → sees their own comment                  │ │
│  │  Implementation: Track causal dependencies in version vectors           │ │
│  │  Used by: Google Spanner, CockroachDB                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 4. EVENTUAL CONSISTENCY (Accept and log)                                │ │
│  │                                                                        │ │
│  │  For non-critical reads, accept staleness within SLA bounds             │ │
│  │  Monitor replication lag: alert if >5 seconds for 5+ minutes            │ │
│  │  Expose "data freshness" metric to callers                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Why-This-Not-That: Synchronous vs Async Replication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           SYNCHRONOUS vs ASYNCHRONOUS REPLICATION                           │
│           When to use which, and what you trade away                        │
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYNCHRONOUS REPLICATION                              │
│  PRIMARY ─── COMMIT + WAIT ───▶ REPLICA confirms write ───▶ Response         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ PROS:                                                                   │ │
│  │ ✓ Strong consistency: Replica has data before client gets response     │ │
│  │ ✓ Zero data loss: If primary dies, replica has all committed writes    │ │
│  │ ✓ Easy failover: Replica is guaranteed to be up-to-date                │ │
│  │                                                                          │ │
│  │ CONS:                                                                   │ │
│  │ ✗ Latency: Write latency = round-trip to replica (often 5-50ms extra)  │ │
│  │ ✗ Throughput: Limited by slowest/reachable replica                     │ │
│  │ ✗ Availability: If ANY replica is down, writes fail (semi-sync helps)  │ │
│  │ ✗ Geographic: cross-region sync replication is very expensive           │ │
│  │                                                                          │ │
│  │ USE WHEN:                                                               │ │
│  │ • Financial transactions, ledger entries, inventory deductions         │ │
│  │ • Data loss is catastrophic (orders, payments, balances)               │ │
│  │ • Regulatory requirements for durability                               │ │
│  │ • Within single datacenter (low latency)                               │ │
│  │                                                                          │ │
│  │ NAMED EXAMPLES:                                                         │ │
│  │ • Stripe: Synchronous replication for payment processing               │ │
│  │   "A payment must be recorded in at least 2 AZs before we return 200"  │ │
│  │ • Banks: Synchronous CDC to disaster recovery site                      │ │
│  │ • Zookeeper: Fsync to disk + quorum write before responding            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        ASYNCHRONOUS REPLICATION                              │
│  PRIMARY ─── COMMIT ───▶ Response + WAL entry ─── (later) ───▶ REPLICA      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ PROS:                                                                   │ │
│  │ ✓ Low latency: No wait for replica (write to primary, return immediately)│ │
│  │ ✓ High throughput: Primary not blocked by replica                       │ │
│  │ ✓ Geo-distribution: Can replicate across regions cheaply               │ │
│  │ ✓ Availability: Primary continues even if replicas are down             │ │
│  │                                                                          │ │
│  │ CONS:                                                                   │ │
│  │ ✗ Data loss window: If primary dies before replica receives WAL,       │ │
│  │   that data is lost (window of vulnerability = replication lag)        │ │
│  │ ✗ Stale reads: Replica may be behind by ms to minutes                  │ │
│  │ ✗ Complex failover: Replica might have partial data; need to reconcile │ │
│  │                                                                          │ │
│  │ USE WHEN:                                                               │ │
│  │ • High-throughput write workloads (logs, analytics, social feeds)      │ │
│  │ • Stale reads are acceptable (most reads can be from cache/replica)    │ │
│  │ • Cross-region replication where sync latency is prohibitive           │ │
│  │ • Analytics/reporting that doesn't need real-time data                 │ │
│  │                                                                          │ │
│  │ NAMED EXAMPLES:                                                         │ │
│  │ • Twitter: Async replication for timeline writes                        │ │
│  │   "Tweet written to primary → fanout to followers' timelines async"    │ │
│  │ • Facebook: Async MySQL replication to read replicas for news feed     │ │
│  │ • Kafka: Async replication with configurable ack levels (acks=1, all)  │ │
│  │ • MongoDB replica sets: Default async (sync to majority is opt-in)     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    HYBRID: SEMI-SYNCHRONOUS (Oracle, MySQL Group Rep)        │
│                                                                              │
│  Primary waits for AT LEAST ONE replica to acknowledge (not all)            │
│  Guarantees: If primary dies, at least one replica has all committed data   │
│  Trade-off: Much lower latency than full sync, but still guaranteed recoverability│
│                                                                              │
│  This is the recommended production configuration for most PostgreSQL/MySQL │
│  deployments: balance consistency with performance.                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Breadth Comparison: Load Balancer Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              LOAD BALANCER STRATEGIES COMPARISON                             │
│                                                                              │
│  ┌──────────────────┬─────────────────────┬──────────────────────────────┐  │
│  │     Strategy     │      How It Works   │     When To Use              │  │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤  │
│  │  ROUND ROBIN     │ Cycles through      │ Homogeneous servers,         │  │
│  │                  │ servers in order    │ stateless services           │  │
│  │                  │ S1→S2→S3→S1→...     │                              │  │
│  │                  │                     │ Low latency, simple          │  │
│  │  Pros            │ Simple to implement │ No session affinity needed   │  │
│  │  Cons            │ Ignores server load │ Doesn't account for          │  │
│  │                  │                     │ heterogeneous servers        │  │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤  │
│  │ LEAST CONNECTIONS│ Routes to server    │ Variable request duration    │  │
│  │                  │ with fewest active  │ (long-polling, WebSocket,    │  │
│  │                  │ connections         │ file uploads)                │  │
│  │  Pros            │ Adapts to load      │ Better utilization when      │  │
│  │                  │ differences         │ request times vary widely    │  │
│  │  Cons            │ More complex        │ Session state can cause      │  │
│  │                  │ (must track conns)  │ uneven distribution          │  │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤  │
│  │ IP HASH          │ Hash(client_IP)     │ Must route same client to    │  │
│  │                  │ mod N → server      │ same server (sessions)       │  │
│  │  Pros            │ Session stickiness  │ Works well when session      │  │
│  │                  │ Deterministic       │ affinity required            │  │
│  │  Cons            │ Hotspots if large   │ Single IP = single server    │  │
│  │                  │ clients share IP    │ (load imbalance possible)    │  │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤  │
│  │ CONSISTENT       │ Hash(key) → ring →  │ Cache-heavy workloads where  │  │
│  │ HASHING          │ nearest server      │ caching depends on           │  │
│  │                  │ (virtual nodes)     │ server assignment            │  │
│  │  Pros            │ Only K/n keys       │ Adding/removing servers      │  │
│  │                  │ remapped on change  │ minimizes cache invalidation │  │
│  │                  │ Enables caching     │ Used by: Dynamo, Cassandra,  │  │
│  │                  │ without sticky sess │ Memcached, Redis Cluster     │  │
│  │  Cons            │ More complex        │ Initial hashing overhead     │  │
│  │                  │ (ring management)   │ Uneven if virtual nodes not  │  │
│  │                  │                     │ properly configured          │  │
│  └──────────────────┴─────────────────────┴──────────────────────────────┘  │
│                                                                              │
│  PRODUCTION RECOMMENDATION:                                                  │
│  • Stateless services: Round Robin (simple, effective)                       │
│  • Stateful long-connections: IP Hash or Least Connections                   │
│  • Caching/microservices: Consistent Hashing (minimizes cache invalidation) │
│  • Kubernetes: kube-proxy uses iptables (hash-based), cilium uses eBPF      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Breadth Comparison: CDN Strategies (Push vs Pull)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CDN DEPLOYMENT STRATEGIES                               │
│                                                                              │
│  ┌─────────────────────────────┬─────────────────────────────────────────┐  │
│  │         PUSH CDN            │              PULL CDN                   │  │
│  ├─────────────────────────────┼─────────────────────────────────────────┤  │
│  │                             │                                         │  │
│  │  CONTENT SERVER             │  USER REQUEST                           │  │
│  │       │                     │       │                                 │  │
│  │       ▼ (push on publish)   │       ▼ (cache miss triggers fetch)    │  │
│  │  ┌─────────┐                │  ┌─────────┐                            │  │
│  │  │   CDN   │                │  │   CDN   │──▶ MISS ──▶ Origin ──▶     │  │
│  │  │  PoP    │                │  │  PoP    │      Cache & serve         │  │
│  │  └─────────┘                │  └─────────┘                            │  │
│  │                             │                                         │  │
│  │  YOU control what is        │  CDN pulls on first request             │  │
│  │  on CDN (proactive)         │  (lazy, on-demand)                      │  │
│  ├─────────────────────────────┼─────────────────────────────────────────┤  │
│  │                             │                                         │  │
│  │  USE WHEN:                  │  USE WHEN:                              │  │
│  │  • Static assets with known │  • Large catalog, unpredictable access  │  │
│  │    set (CSS/JS/images)      │  • User-generated content               │  │
│  │  • Predictable traffic      │  • Most content rarely accessed         │  │
│  │  • Need exact cache control │  • Can't predict what's popular         │  │
│  │  • High-security content    │  • Large number of unique assets        │  │
│  │    (signed URLs)            │  • Most traffic to small % of content   │  │
│  │                             │                                         │  │
│  │  PROS:                      │  PROS:                                  │  │
│  │  ✓ Instant cache invalidation│  ✓ No upload step needed               │  │
│  │  ✓ No thundering herd       │  ✓ Scales to billions of assets         │  │
│  │  ✓ Predictable origin load  │  ✓ Zero maintenance (set TTL, forget)  │  │
│  │  ✓ Exact control of TTL     │  ✓ Popular content auto-caches          │  │
│  │                             │                                         │  │
│  │  CONS:                      │  CONS:                                  │  │
│  │  ✗ Must push on every deploy│  ✗ First request is slow (cache miss)  │  │
│  │  ✗ Can miss unused content  │  ✗ Thundering herd on new content       │  │
│  │  ✗ Complexity with CMS      │  ✗ Hard to invalidate precisely        │  │
│  │                             │  ✗ Origin sees more traffic than        │  │
│  │                             │    eventual cache hit rate suggests     │  │
│  ├─────────────────────────────┼─────────────────────────────────────────┤  │
│  │                             │                                         │  │
│  │  NAMED PROVIDERS:           │  NAMED PROVIDERS:                       │  │
│  │  • Akamai (Cloud)           │  • Cloudflare (default)                 │  │
│  │  • Fastly (real-time purge) │  • AWS CloudFront                       │  │
│  │  • Cloudfront (can do both) │  • Google Cloud CDN                     │  │
│  │                             │  • Azure CDN                            │  │
│  └─────────────────────────────┴─────────────────────────────────────────┘  │
│                                                                              │
│  HYBRID PATTERN (Production Most Common):                                    │
│  • Static assets: Push on CI/CD deploy (CSS/JS/images)                      │
│  • User content: Pull on first access (avatars, uploads)                    │
│  • Set different TTLs: JS/CSS = 1 year, images = 30 days                   │
│                                                                              │
│  THUNDERING HERD MITIGATION:                                                 │
│  When CDN cache expires simultaneously (e.g., 10K users hit expired cache):  │
│  • Origin gets 10K requests instead of 1 → CRASH                            │
│  • Solution: Staggered TTLs, cache warming, "cache aside" with locking      │
└─────────────────────────────────────────────────────────────────────────────┘
```
