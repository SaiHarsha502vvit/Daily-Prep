# 🏗️ Entity Design Based on Domain: The Hardest Skill

## 📌 5W1H

**WHAT** — The 4-step domain-to-entity framework (Flow → Domains → Responsibilities → Entities), with worked examples (Uber case study, TripEvent append-only log, DriverOnboardingRequest separation).
**WHY** — Entity redesign after deployment is 10× more expensive than design-time generalization; this framework prevents the most common breakage patterns (anemic models, mutated VOs, request/final entity confusion).
**WHO** — Backend engineers and tech leads designing or migrating domain models in Java/Spring or .NET enterprises.
**WHEN** — 2026 — Domain-Driven Design is now mainstream in enterprise Java (Spring Modulith, Axon Framework, jMolecules); Eric Evans's 2003 book is the canonical reference, with Vaughn Vernon's 2013 "Implementing DDD" as the Java implementation guide.
**WHERE** — Spring Boot, Jakarta EE, Axon, EventStore; applicable to any bounded context (orders, inventory, payments, identity).
**HOW** — 4-step framework applied via Uber case study, then generalization patterns (TripPassenger for Uber Pool), then failure-mode enumeration (mutated Money, lost identity, reference vs. DTO confusion).

> **🔥 4+ YOE God-Level Architectural Insight**
> Unlike static technologies (e.g., MySQL, Redis) whose internal workings remain constant, **entities must continuously evolve alongside business requirements**.
>
> A common, fatal misconception among junior to mid-level engineers is that an "entity" is just a database table. **In reality, entities are representations of fundamental business concepts that sit strictly above the database layer.** When designing entities, you must completely ignore the database structure initially.

---

## 1. The 4-Step Framework for Entity Design

To build scalable entities that survive massive business shifts, follow a strict, business-first methodology. Never start by writing `CREATE TABLE` scripts.

### Step 1: Understanding the Flow

Spend the vast majority of your design time (e.g., 3-5 days on a major feature) entirely on this step. Map out the entire end-to-end business process step-by-step as if you were running the operations manually.

### Step 2: Figuring out Domains

Group the steps of the flow into distinct operational "domains." Think of domains as isolated teams, each with highly specific responsibilities and skill sets.

### Step 3: Writing Responsibilities & Business Concepts

Define exactly what each domain team is responsible for and outline the business concepts required to achieve those goals.

### Step 4: Extracting Entities

Derive the specific data entities required to fulfill those underlying business concepts.

---

## 2. Case Study: Uber-like System Breakdown

Applying the 4-step framework to a ride-hailing system reveals distinct domains, responsibilities, and their respective entities.

### Domain 1: Onboarding

- **Responsibility**: Collecting and verifying documents to onboard drivers and users.
- **Extracted Entities**:
  - `DriverOnboardingRequest`: Contains raw, unverified submitted data (Name, Phone, Aadhaar, PAN, Vehicle Details) and a lifecycle status (`Initiated -> Document_Approved -> Rejected`).
  - `Driver`: Created **only** after a successful onboarding request. Contains strictly verified data.
  - `User`: Simpler entity for riders holding basic details (Name, Phone, Email).

### Domain 2: Pricing

- **Responsibility**: Calculating the cost of a trip based on external parameters (start/end locations, fuel prices, popularity, vehicle type).
- **Extracted Entities**:
  - `PricingRequest`: The user's query containing the start and end locations.
  - `RateCard`: The calculated cost options presented to the user for different vehicle types (e.g., Bus, Van, Bike).

### Domain 3: Driver Matching

- **Responsibility**: Finding and assigning the most suitable driver for a user's trip request based on proximity, cost, and ratings.
- **Extracted Entities**:
  - `TripRequest`: Generated when a user selects a vehicle from the Rate Card. Holds locations, cost, user details, and status (`Initiated -> Completed/Rejected`).
  - `DriverRequest`: The internal requests broadcasted to multiple nearby drivers. Tracks which driver was pinged, the timestamp, and their acceptance/rejection response.

### Domain 4: Trip

- **Responsibility**: Managing the active lifecycle of the ride (driver arrival, OTP verification, active travel, issue handling, trip completion).
- **Extracted Entities**:
  - `Trip`: The core stateful entity holding start/end locations, fare details, the assigned driver, the user, OTP, and the real-time status.
  - `TripEvent`: An **append-only** entity that logs specific occurrences during the trip (e.g., `driver_reached_location`, `rider_reached_location`, `otp_verified`, `trip_completed`) to maintain a chronological, auditable record.

### Domain 5: Payments

- **Responsibility**: Processing the transaction upon trip completion, deducting the platform's commission, and routing the remaining funds to the driver's wallet.
- **Extracted Entities**:
  - `DriverEarnings`: Tracks the specific amount credited to a driver for a specific trip ID on a specific date.

---

🔬 **Section Challenge — Applying the 4-Step Framework to Rental Cars**

A new "Rental Car" feature is added to the Uber-style platform. Users can rent a car for self-driven trips (different from Uber's driver-rides). Apply the 4-step framework:

**Step 1 — Understand the Flow**: Pickup → Car selection → Identity verification → Unlock → Drive → Return → Inspection → Charge.
**Step 2 — Identify Domains**: Pricing (per-km + per-hour), Identity (driver's license verification), Fleet (car availability and location), Trip (rental trip lifecycle), Billing (rental charges + deposits).
**Step 3 — Write Responsibilities**: Each domain has clear responsibilities — Fleet owns car state; Trip owns rental lifecycle; Identity verifies the renter.
**Step 4 — Extract Entities**: `RentalCar`, `RentalTrip`, `Renter`, `Reservation`, `InspectionRecord`, `Deposit`.

Draw the domain boundary decision: does `RentalCar` share a domain with the existing `Trip` entity? Does `Reservation` belong in Trip or Fleet? What cross-domain events fire when a `RentalTrip` is completed (e.g., `RentalCompleted` → Fleet marks car available, Billing releases deposit)?

<details>
<summary>Answer</summary>

**Domain boundary decision**:
- `RentalCar` belongs in a **Fleet** bounded context (separate from the existing Trip context). The Fleet context owns car availability, location, and maintenance state. The Trip context owns lifecycle events.
- `RentalTrip` is a NEW context, NOT shared with the existing `Trip` context. A rental trip has different lifecycle events (CAR_UNLOCKED, CAR_RETURNED, INSPECTION_PASSED) than a driver-ride trip (DRIVER_ASSIGNED, RIDE_STARTED).
- `Reservation` belongs in **Fleet** (it's a reservation against a specific car, not against a driver). Reservations are about car availability; Trip is about ride progress.

**Cross-domain events when a RentalTrip is completed**:
1. `RentalCompleted` event fires from Trip context.
2. Fleet context listens, marks the car AVAILABLE, releases the parking spot assignment.
3. Billing context listens, releases the deposit hold, charges the final amount.
4. Analytics context listens, updates fleet utilization metrics.

**Shared Kernel consideration**: Identity (renter's driver's license, KYC status) is shared between Reservation (to verify renter) and Billing (to charge the right person). This is a Shared Kernel — both contexts read from the same Identity schema. Document the coupling explicitly and add a contract test that ensures Identity schema changes don't break consumers.

**Anti-pattern to avoid**: collapsing RentalCar into the existing Trip context "because trips involve cars." A Trip's lifecycle is the rider's journey; a RentalCar's lifecycle is the asset's utilization. Conflating these leads to a bloated aggregate that locks the entire car record on every ride state change — the same mistake as the Order-Product anti-pattern in PS1 A3 of `10_PROBLEM_SETS.md`.

**Lesson**: the 4-step framework exists precisely to surface these domain boundary decisions BEFORE writing code. After deployment, refactoring bounded context boundaries is 10× more expensive.
</details>

## 3. Crucial System Architecture Pitfalls (Why Entities Break)

Entities will inevitably break if they are designed strictly for the current **happy path**. You must mathematically generalize the flow before locking in entities.

### The Breakdown Scenario

**Naive Approach (Database-First)**:
A developer assumes a `Trip` maps perfectly to a single `User` and a single `Payment`. They design the `Trip` entity with a hardcoded `userId` and `paymentId`.

**Future Business Requirements (The Reality Check)**:

1.  **"Uber Pool" is introduced**: A single trip no longer maps to a single 1-to-1 User. The `userId` column on the `Trip` table breaks the entire system.
2.  **"Batched Payments" are introduced**: The business decides to pay for 5 trips at once at the end of the day to save on transaction fees. The 1-to-1 relationship between a `Trip` and a `Payment` breaks completely.

### The DDD Solution (Domain Generalization)

Anticipating "Uber Pool" means swapping the direct `User` reference in a `Trip` to a generalized `TripPassenger` entity (or an array of riders) to support infinite riders per trip.

This is why **Step 1 (Understanding the Flow)** is the most critical. By thinking about how the physical business might evolve (e.g., sharing a cab), you decouple your entity design from rigid, naive database schemas.

---

## 🧠 Deep Conceptual Questions

🔬 **Section Challenge — Decoupling Requests from Final Entities**
**Challenge 1 (Onboarding Data Integrity):** A Junior developer designs the ride-hailing app. They create a single `Driver` entity. When a driver signs up, the record is created with `status = PENDING`. Only when the admin approves the documents does the status change to `ACTIVE`. Why is this a major entity design flaw compared to having separate `DriverOnboardingRequest` and `Driver` entities?

<details><summary>Answer</summary>

**The Flaw (The Anemic DB-First Model):**
By combining unverified requests and verified drivers into a single `Driver` table/entity, every single method in the system that expects a `Driver` must now check `if (driver.getStatus() == ACTIVE)`. The system is constantly polluted with unverified, potentially malicious data masking as a legitimate business concept.

**The DDD Solution (Domain-Driven Entities):**
The business concept of an "Application to become a driver" is physically different from "An approved, working driver." By extracting `DriverOnboardingRequest`, you guarantee that any object of type `Driver` in your system is 100% verified. You remove the need for `if(active)` checks everywhere, enforcing system invariants at the compile/type level.

</details>

🔬 **Section Challenge — Auditable Event Modeling**
**Challenge 2 (The Overwritten Trip):** In the Trip Domain, the developer gives the `Trip` entity a `status` field. As the trip progresses, they simply overwrite this field (`WAITING -> IN_PROGRESS -> COMPLETED`). What critical business capability is lost by not extracting a `TripEvent` entity?

<details><summary>Answer</summary>

**The Flaw:** Overwriting a status destroys historical state (Architectural Amnesia). If a customer complains that the driver took 30 minutes to arrive, the system has no record of _when_ the status changed from `WAITING` to `IN_PROGRESS`, only the current state.

**The DDD Solution:** By extracting `TripEvent` as an append-only entity, you create an auditable chronological ledger. You can reconstruct the exact timeline of the trip for customer support, calculate precise driver wait times, and debug anomalies. The `Trip` entity can still hold the "current status" for fast queries, but the `TripEvent` acts as the source of truth.

**The complete solution — Event Sourcing + Projection pattern:**

The standard pattern is to have BOTH:

1. **`TripEvent` (append-only event log)** — source of truth. Records every state change: `TripRequested`, `DriverAssigned`, `TripStarted`, `TripCompleted`, `TripCancelled`. Never updated; only appended.

2. **`Trip` (materialized projection)** — fast-query view. Has `status`, `driverId`, `currentLocation`, etc. Maintained by a **background projector** that listens to the TripEvent stream and updates the `Trip` table on each new event.

**Read path**: queries use the `Trip` projection (O(1) SELECT).
**Write path**: appends a new `TripEvent` (O(1) INSERT), and the projector eventually updates the `Trip` projection (eventual consistency, typically <1s lag).
**Recovery path**: replay all events to rebuild the projection if it gets corrupted.

**Storage growth calculation**:
- ~10 events per trip × 100M trips/year = 1B events/year.
- Average event size ~500 bytes → 500GB/year for the event log.
- Mitigation: partition the `trip_events` table by date (`PARTITION BY RANGE (created_at)`), archive completed trips older than 12 months to cold storage (S3 Glacier: ~$0.004/GB/month).
- The `Trip` projection stays small (100M rows × ~1KB = 100GB, fits in memory on a single DB node).

**Why not just use TripEvent directly?**
- Reading "current status of trip 12345" would require `SELECT * FROM trip_events WHERE trip_id = 12345 ORDER BY created_at DESC LIMIT 1` — fast for one trip but slow for "all trips in DRIVER_ASSIGNED state" (full table scan with aggregation).
- The projection pre-computes the aggregation: `SELECT * FROM trips WHERE status = 'DRIVER_ASSIGNED'` is O(matching rows).
- Trade-off: storage cost (events + projection) for query speed. Worth it for production systems where both are needed.

**Anti-pattern**: using only TripEvent and computing aggregates on every read (e.g., "how many trips are currently active?" requires `SELECT COUNT(*) FROM trip_events WHERE type='STARTED' AND ... AND not exists ENDED event`). This is O(n) per query and doesn't scale. Always project to a materialized view for aggregate queries.

</details>

---

_Reference Anchor: This guide is aligned with the tactical design principles in Domain-Driven Design (Eric Evans) and advanced distributed systems modeling._

---

## Historical Evolution

The distinction between Entity, Value Object, and Aggregate is the heart of DDD tactical design — and these distinctions are younger than most developers assume. Three threads:

**1. Object Identity vs Object Value (1980s-1990s)**

- **Booch Rumbaugh Jacobson — "Object-Oriented Analysis and Design with Applications", 1991**: The "Gang of Four precursor" that introduced object identity as a first-class concept (every object has an intrinsic identity independent of its attributes). This is the philosophical root of "Entity vs Value Object" — entities have identity that survives attribute changes; value objects are interchangeable based on attributes alone.
- **Grady Booch — "Object-Oriented Design with Applications", 1991 (2nd ed.)**: Distinguished between "reference objects" (entities) and "value objects" using the same criteria DDD later formalized. Many DDD books credit Evans 2003 but the underlying distinction was already in Booch 1991.

**2. DDD Formalization (2003)**

- **Eric Evans — "Domain-Driven Design", 2003**: Chapter 5 ("A Model Expressed in Software") introduced the Entity/Value Object split with the canonical rules still used today: an Entity has identity that persists across state changes; a Value Object is defined entirely by its attributes and is immutable. Evans also formalized the Aggregate pattern (Chapter 6) — a cluster of entities and value objects with a defined boundary and a single root.
- **Fowler — PoEAA, 2002**: Fowler's "Aggregate" pattern in PoEAA (pre-Evans 2003) was slightly different — it was about transactional consistency. Evans 2003 sharpened it to be about consistency + invariant protection + transactional boundary. The modern DDD Aggregate is Evans' version, not Fowler's.

**3. Aggregate Design in Practice (2013-2020)**

- **Vaughn Vernon — "Implementing Domain-Driven Design", 2013**: Chapters 10-12 gave the first concrete Java implementations of Aggregate, Repository, and Domain Service. Vernon also formalized the "Aggregate consistency boundary" rule — modify only ONE aggregate per transaction.
- **Microsoft — "Domain-Driven Design Reference", 2015**: The canonical glossary from Evans + Vernon. This is where "Aggregate Root" became the standardized term (Evans 2003 used "Aggregate" + "Root Entity" separately).
- **Modern Practice Anchored**: When designing entities for an enterprise system, ask: (1) Does this object have a stable identity across its lifecycle? → Entity. (2) Is it defined purely by its attribute values? → Value Object. (3) What is the consistency boundary? → Aggregate. The fact that these questions have answers traceable to Booch 1991 → Evans 2003 → Vernon 2013 means an experienced DDD practitioner can reason about a domain in 10 minutes that would take a junior team weeks.

### Production Reality

**Failure Mode 1 — Entity vs Value Object Confusion (the "mutated Money" bug)**: A common mistake is treating a Value Object as an Entity. Example: a `Money` value object with `amount` + `currency` fields should be IMMUTABLE. If a junior developer writes `money.amount = money.amount + 10`, they're mutating a value — a semantic violation that breaks equational reasoning. In Java, fix: make the class `final` and fields `final`. In C#, use `readonly struct`. In Python, use `@dataclass(frozen=True)`.

**Failure Mode 2 — Lost Identity After Serialization**: A Customer entity gets serialized to JSON, persisted to a cache, and deserialized later. If the deserialized object has a new object identity (different reference) but the same database ID, the identity is preserved at the DB level but lost at the JVM level. Symptom: `customer1.equals(customer2)` returns false because `==` checks object reference, not database ID. Fix: implement `equals()` + `hashCode()` based on the ID field, not on object reference.

**Failure Mode 3 — Reference vs ID vs DTO Confusion**: In a 3-tier architecture, the same "customer" can exist as a JPA entity (reference), an ID (long), and a DTO (CustomerResponse with display fields). Mixing these in method signatures creates coupling nightmares. Example: passing a JPA entity to a REST controller creates lazy-loading exceptions. Fix: explicit layering — Domain Layer uses Entities, Application Layer uses IDs, Presentation Layer uses DTOs.

**Debug Workflow**:
1. **Identity test**: For each entity, write a test that serializes → deserializes → checks identity. If two `equals` entities after round-trip fail the `==` check, lost identity is the bug.
2. **Immutability check**: For each Value Object, attempt to mutate a field. If mutation succeeds, the class is not a proper Value Object.
3. **Layer-purity grep**: `grep -rn "@Entity"` in the controller package; if any match, layer is leaking.

---

