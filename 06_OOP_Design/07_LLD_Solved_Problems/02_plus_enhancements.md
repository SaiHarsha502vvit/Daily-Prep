# PLUS Enhancements

> **Navigation**: [← The Lld Interview Framework](01_the_lld_interview_framework.md) | [Chapter overview](../07_LLD_Solved_Problems.md)
> Page 2 of 2 in **LLD Solved Problems — Low-Level Design with SOLID & Patterns**


## Diagram 1: Parking Lot Class Diagram

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                         PARKING LOT SYSTEM DESIGN                        │
  └──────────────────────────────────────────────────────────────────────────┘

  CLASSES:
  ════════

  ┌────────────────────────┐          ┌──────────────────────────┐
  │      <<enums>>          │          │      <<interface>>        │
  │    VehicleType          │          │    PricingStrategy        │
  │───────────────────────  │          │─────────────────────────  │
  │ MOTORCYCLE              │          │ +calculate(Duration,Spot)│
  │ CAR                     │          └─────────────┬────────────┘
  │ BUS                     │                        │ implements
  │                         │                        │
  │    SpotSize             │              ┌─────────┴──────────┐
  │───────────────────────  │              ▼                  ▼
  │ SMALL                   │     ┌────────────────┐  ┌─────────────────┐
  │ MEDIUM                  │     │HourlyPricing   │  │ WeekendSurge    │
  │ LARGE                   │     └────────────────┘  │ (OCP: add new   │
  └────────────────────────┘                          │  strategy w/o   │
                                                       │  modifying code)│
                                                       └─────────────────┘

  RELATIONSHIPS (arrows show direction of dependency):
  ═══════════════════════════════════════════════════

  ┌──────────────┐  has-many    ┌──────────────┐  has-many  ┌────────────────┐
  │  ParkingLot  │──────────────▶│   Level      │───────────▶│  ParkingSpot   │
  │              │              │              │            │                │
  │ - pricing    │uses          │ - floorNum   │parked in  │ - id           │
  │   strategy   │─────────────▶│ - spots[]    │            │ - size         │
  │ - activeTkt  │              └──────────────┘            │ - isOccupied   │
  │ - spots      │                                         └───────┬────────┘
  └───────┬──────┘                                                 │
          │ HAS-A (uses)                          occupied by      │ IS-A (vehicle)
          │                                      parking          ▼
          │                                                     ┌──────────────┐
          ▼                                                     │   Vehicle    │
  ┌──────────────┐  has-many                        ┌───────────│ (abstract)   │
  │    Ticket    │                                  │           │              │
  │              │                                  │           │- plate       │
  │ - ticketId   │                                  │           │- type        │
  │ - entryTime  │                                  │           └──────┬───────┘
  │ - exitTime   │                                  │                  │
  │ - vehicle    │                                  │          ┌───────┴───────┐
  │ - spot       │                                  │          ▼       ▼       ▼
  └──────────────┘                                  │    ┌────────┐ ┌───────┐ ┌─────┐
                                                     │    │  Car   │ │Motor- │ │ Bus │
                                                     │    │        │ │cycle  │ │     │
                                                     │    └────────┘ │       │ └─────┘
  GATES (USES ParkingLot):                                   └───────┘ └───────┘
  ══════════════════════
  ┌──────────────┐    ┌──────────────┐       ┌──────────────┐
  │ EntranceGate │◀───│ ParkingLot   │──────▶│  ExitGate    │
  │              │    │  (core)      │       │              │
  │ - park()     │    │              │       │ - vacate()   │
  │ - issueTicket│    │              │       │ - calculateFee│
  └──────────────┘    └──────────────┘       └──────────────┘

  PATTERNS USED:
  Strategy   → PricingStrategy (hourly, flat, surge)
  Factory    → VehicleFactory from license plate scan
  Observer   → DisplayBoard updates on spot availability
  Singleton  → ParkingLot (one instance, but prefer DI)
```

## Diagram 2: Elevator LOOK Algorithm State Diagram

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                       ELEVATOR STATE MACHINE                            │
  └─────────────────────────────────────────────────────────────────────────┘

                     ┌──────────────────────────────────────────────────┐
                     │                                                  │
  ┌─────────────┐  floor   ┌─────────────────┐  queue empty   ┌────────┴───┐
  │   IDLE      │request  │  MOVING_UP       │───────────────▶│   IDLE    │
  │             │────────▶│                 │               │           │
  │ Waiting for │         │ Serving requests │               └───────────┘
  │ requests.   │         │ in UP direction  │                     ▲
  │ No direction│         │                  │                     │
  └──────┬──────┘         └────────┬─────────┘                     │
         │                          │                               │
         │ floor                    │ last request                   │
         │ request                  │ in direction                   │
         │ up                       │ served                         │
         ▼                          ▼                               │
  ┌─────────────┐            ┌─────────────────┐                    │
  │MOVING_DOWN  │            │  DIRECTION      │                    │
  │             │            │  REVERSAL       │                    │
  │ Serving     │◀──────────│  (internal)     │────────────────────┘
  │ requests    │            │                  │
  │ in DOWN     │            │ Checks: all requests in current direction
  │ direction   │            │ served? → reverse direction
  └─────────────┘            │ no requests at all? → IDLE
                             └───────────────────────────────────────

  LOOK ALGORITHM VISUALIZATION:
  ════════════════════════════

  Building: Floor 1 ─────── Floor 2 ─────── Floor 3 ─────── Floor 4 ─────── Floor 5 ─────── Floor 6

  Scenario: User presses 4, then 2, then 5

  State: MOVING_UP
  Request Queue: [4]

  Elevator at 1: 1 → 2 → 3 → 4 (stops, opens doors, removes 4 from queue)
  At floor 4:    Queue now empty in UP direction, but 2 < 4 (request in DOWN direction)
  State: REVERSAL → MOVING_DOWN
  Request Queue: [2]

  Elevator at 4: 4 → 3 → 2 (stops at 2, removes 2 from queue)
  At floor 2:    Queue: [5] (5 > 2, request is in UP direction)
  State: REVERSAL → MOVING_UP
  Request Queue: [5]

  Elevator at 2: 2 → 3 → 4 → 5 (stops at 5, done)

  WHY LOOK (not SCAN):
  ────────────────────
  SCAN:  sweeps all the way to floor 6 before reversing (even with no requests)
  LOOK:  reverses as soon as no more requests in current direction
  Result: LOOK saves floor-travelling time = better performance

  MODERN VARIANTS: SCAN-LOOK hybrid with AI traffic prediction
  (Burj Khalifa, modern high-rises use LOOK + zone allocation)
```

## Diagram 3: BookMyShow Seat-Locking Sequence

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                  CONCURRENT SEAT BOOKING TIMELINE                        │
  └──────────────────────────────────────────────────────────────────────────┘

  User A (t=0)                        User B (t=50ms)                        System
  ──────────────                      ──────────────                         ──────
       │                                  │                                    │
       ▼                                  │                                    │
  ┌──────────────────┐                    │                                    │
  │lockSeats(A1, userA)│                  │                                    │
  └──────────┬─────────┘                  │                                    │
             │                            │                                    │
             ▼ DB lock                    │                                    │
  SELECT * FROM seats                                                │
  WHERE seat_id='A1' AND status='AVAILABLE'
             │                            │                                    │
             ▼                            ▼                                    │
         ┌────────────────────────────────────────────────────┐                │
         │ UPDATE seats SET status='LOCKED', user_id='A',     │                │
         │ locked_until=NOW+5min WHERE seat_id='A1' AND       │                │
         │ status='AVAILABLE'                                 │                │
         │ ── ROW LOCK acquired ──                            │                │
         └──────────────┬─────────────────────────────────────┘                │
                        │                                                    │
                        ▼ RETURN: success                                    │
  ┌─────────────────────────────────┐                                        │
  │ lockSeats() → ["A1"] SUCCESS   │                                        │
  │ User A sees: "Seat A1 locked"  │                                        │
  └─────────────────────────────────┘                                        │
                                                  ▼                            │
                                        ┌──────────────────┐                  │
                                        │lockSeats(A1, userB)│                 │
                                        └──────────┬─────────┘                 │
                                                   │                           │
                                                   ▼ DB lock                   │
                                        SELECT * FROM seats                     │
                                        WHERE seat_id='A1'
                                        (A1 is now LOCKED)                     │
                                                   │                           │
                                                   ▼                            │
                                        ┌──────────────────────────┐            │
                                        │ UPDATE seats ... FAIL    │            │
                                        │ WHERE status='AVAILABLE' │            │
                                        │ → 0 rows updated         │            │
                                        └──────────────┬───────────┘            │
                                                       │                        │
                                                       ▼ RETURN: FAIL           │
                                        ┌──────────────────────────────┐        │
                                        │ SeatUnavailableException     │        │
                                        │ User B sees: "Seat A1 taken" │        │
                                        └──────────────────────────────┘        │
                                                                          ▼
  At t=5min:                                    ┌──────────────────────────────┐
  ┌──────────────────────────┐                   │ Timer fires:                 │
  │ Scheduler releases lock  │                   │ if !paid → status='AVAILABLE'│
  │ for user A (payment not  │                   │ Seat A1 back to pool         │
  │ completed)               │                   └──────────────────────────────┘
  └──────────────────────────┘

  THREE LOCKING STRATEGIES COMPARED:
  ══════════════════════════════

  Pessimistic (SELECT ... FOR UPDATE):
  ──────────────────────────────────────
  SELECT * FROM seats WHERE seat_id='A1' FOR UPDATE;
  -- Acquires row-level lock. Other transactions WAIT.
  -- Strong guarantee, blocks concurrent reads
  -- Used in: PostgreSQL, MySQL InnoDB row locks

  Optimistic (version column):
  ──────────────────────────────
  UPDATE seats SET status='LOCKED', version=version+1
  WHERE seat_id='A1' AND version=5 AND status='AVAILABLE';
  -- Returns 0 if version changed → retry or fail
  -- No lock held, allows concurrency
  -- Used in: Cassandra, Redis with WATCH/MULTI/EXEC

  Distributed lock (Redis SETNX):
  ────────────────────────────────
  SETNX seat:A1:lock userA
  -- Atomic set-if-not-exists. TTL=300s auto-release.
  -- No DB round-trip for check. Extremely fast.
  -- Used in: Redisson, SeatGeek, Ticketmaster (in-memory locks)
```

## Mechanism Deep-Dive: Concurrent Seat Booking — Three Locking Strategies

**Pessimistic Locking (SELECT ... FOR UPDATE):**

```sql
-- In a transaction:
BEGIN;
SELECT * FROM seats
  WHERE seat_id = 'A1' AND show_id = 'SHOW_123'
  FOR UPDATE;  -- ← acquires row-level exclusive lock

-- If another transaction tries:
-- SELECT * FROM seats WHERE seat_id = 'A1' FOR UPDATE;
-- → WAITS here until first transaction commits or rolls back

UPDATE seats SET status = 'LOCKED' WHERE seat_id = 'A1';
COMMIT;
```

**The Pessimistic trade-off:**

- Guarantees no race: one transaction holds the lock until commit/rollback
- Other transactions BLOCK waiting — if lock is held too long, users experience delays
- Risk: long-held locks can cause deadlocks if two users try to lock seats A1 and A2 simultaneously
- Solution: always lock in deterministic order (lock lower seat ID first)

**Optimistic Locking (version column):**

```sql
-- No lock at read time:
SELECT * FROM seats WHERE seat_id = 'A1';
-- Returns: {seat_id:'A1', status:'AVAILABLE', version:5}

-- At write time (with version check):
UPDATE seats
  SET status = 'LOCKED', version = version + 1
  WHERE seat_id = 'A1'
    AND version = 5          -- ← must match
    AND status = 'AVAILABLE'; -- ← must still be available

-- Result: 0 rows affected if:
--   (a) version changed (another transaction updated it) OR
--   (b) status is no longer AVAILABLE

-- Application code:
if (rowsAffected == 0) {
    throw new OptimisticLockException("Seat was modified, retry");
}
```

**The Optimistic trade-off:**

- No blocking — reads are never blocked
- Good for low-contention scenarios (most bookings don't overlap)
- Bad for high-contention (concert tickets going on sale — everyone hits the same seats)
- Requires retry logic: optimistic lock failure → user sees "someone grabbed it, try again"

**Distributed Lock (Redis SETNX + TTL):**

```java
// Using Redisson:
RLock lock = redissonClient.getLock("seat:A1:SHOW_123");
boolean acquired = lock.tryLock(0, 300, TimeUnit.SECONDS);

if (acquired) {
    try {
        // Check DB seat status
        // Update DB
        // Release lock explicitly (or rely on TTL)
    } finally {
        lock.unlock();
    }
} else {
    throw new SeatUnavailableException("Lock not acquired");
}

// TTL auto-releases if process crashes
// SETNX is atomic — no check-then-act race
```

**The Distributed Lock trade-off:**

- Fastest (in-memory, no disk I/O on hot path)
- External dependency (Redis must be available)
- Redis is eventually consistent — lock state may lag slightly
- TTL too short: lock expires before payment completes → double-booking
- TTL too long: legitimate lock waits unnecessarily

## Why-This-Not-That: Queue vs Stack in Elevator Scheduling

```
  QUEUE (FIFO — LOOK Algorithm):
  ════════════════════════════════

  Request queue for floor requests [4, 2, 5, 3]:
  ┌────┬────┬────┬────┐
  │ 4  │ 2  │ 5  │ 3  │  head → tail (dequeue from head)
  └────┴────┴────┴────┘

  Elevator moving UP: serves 4 first (dequeue 4)
  Queue becomes: [2, 5, 3]

  WHY QUEUE:
  ✓ Preserves arrival order (fairness) — user who pressed first is served first
  ✓ LOOK algorithm uses a sorted-by-floor queue, sorted by direction
  ✓ Predictable: you can reason about elevator behavior
  ✓ Easy to implement: just an ordered set per direction

  STACK (LIFO — reverse LOOK):
  ════════════════════════════════

  Request stack: push 4, push 2, push 5, push 3
  ┌────┐
  │ 3  │  ← top (pop first)
  │ 5  │
  │ 2  │
  │ 4  │
  └────┘

  Elevator moving UP: serves 3 first (last pressed = top)
  PROBLEM: User at floor 4 pressed first but gets served LAST!
  → Unfair — counter-intuitive passenger experience
  → The elevator would go UP past floor 4 to serve floor 3 first

  WHY STACK IS WRONG FOR ELEVATORS:
  ──────────────────────────────────────
  1. VIOLATES FIFO fairness — first request = last service
  2. MOVEMENT WASTE — elevator travels past requests to serve LIFO top
  3. UNPREDICTABLE — users can't reason about when they'll be served
  4. PSYCHOLOGICAL CONFUSION — "I pressed first, why did the person at 5 get served first?"

  ANALOGY: Think of elevator like a BUS, not a STACK
  Buses: first passenger at stop = first to board (queue)
  Not: last passenger at stop = first to board (stack)

  REAL-WORLD ELEVATOR VARIANTS:
  ──────────────────────────────
  SCAN:    Elevator goes to extreme (floor 10) then reverses — like a STACK push-all-then-pop-all
           Problem: wasted travel to floors with no requests
  LOOK:    Queue of sorted requests — serves nearest in current direction, then reverses
           Best: minimizes travel distance + maintains fairness
  FIFO:    Pure queue (rarely used — doesn't consider floor proximity)
  PRIORITY: VIP floors served first (military/government buildings)

  QUEUE + DIRECTION SORT = LOOK:
  ──────────────────────────────
  When direction is UP: queue contains only floors above current floor, sorted ascending
  When direction is DOWN: queue contains only floors below current floor, sorted descending
  When queue empty: reverse direction
  This is WHY LOOK uses a queue (sorted by floor number), not a stack.
```

## Breadth Comparison 1: LLD Problem Pattern Mapping Table

```
┌───────────────────┬────────────────────────────────────────────┬──────────────────────────────┐
│  PROBLEM          │  DESIGN PATTERNS USED                      │  KEY OOP PRINCIPLE           │
├───────────────────┼────────────────────────────────────────────┼──────────────────────────────┤
│  Parking Lot      │  Strategy (pricing: hourly/flat/surge)     │  OCP: new strategy = new     │
│                   │  Factory (VehicleFactory from scan)        │  class, no existing code mod  │
│                   │  Observer (display board updates)          │                              │
│                   │  Singleton (debatable, prefer DI)          │  SRP: parking logic ≠        │
│                   │                                            │  pricing logic ≠ display logic│
├───────────────────┼────────────────────────────────────────────┼──────────────────────────────┤
│  BookMyShow       │  Observer (seat availability → UI update)  │  OCP: new payment gateway =  │
│                   │  State (SeatStatus: AVAIL→LOCKED→BOOKED)   │  new class, existing code    │
│                   │  Locking (pessimistic/optimistic/distrib)  │  unchanged                   │
│                   │  Strategy (payment processing)             │                              │
│                   │                                            │  SRP: BookingService only    │
│                   │                                            │  books, PaymentService only  │
│                   │                                            │  processes                   │
├───────────────────┼────────────────────────────────────────────┼──────────────────────────────┤
│  Splitwise        │  Strategy (Split: Equal/Exact/Percent)     │  LSP: any Split implementation│
│                   │  Composite (Expense contains many Splits)   │  works in ExpenseService     │
│                   │  Graph algorithm (debt simplification)      │                              │
│                   │                                            │  OCP: new split type = new   │
│                   │                                            │  class, no Expense changes   │
├───────────────────┼────────────────────────────────────────────┼──────────────────────────────┤
│  Elevator         │  Strategy (SchedulingStrategy: LOOK/SCAN)  │  OCP: new algorithm = new    │
│                   │  State (ElevatorState: IDLE/MOVING_*)      │  class, controller unchanged │
│                   │  Template Method (move sequence)            │                              │
│                   │                                            │  DIP: ElevatorController     │
│                   │                                            │  depends on abstract         │
│                   │                                            │  SchedulingStrategy, not     │
│                   │                                            │  concrete LOOKStrategy       │
├───────────────────┼────────────────────────────────────────────┼──────────────────────────────┤
│  Logger/          │  Chain of Responsibility (DEBUG→INFO→ERR) │  SRP: Logger chains don't     │
│  Logging          │  Strategy (LogAppender: console/file/DB)   │  know about each other's     │
│                   │  Singleton (Logger, but DI preferred)      │  details                     │
│                   │  Builder (LoggerConfig for fluent build)   │                              │
│                   │                                            │  ISP: LogAppender has one    │
│                   │                                            │  method: append(String)      │
└───────────────────┴────────────────────────────────────────────┴──────────────────────────────┘

  RECURRING PATTERN ACROSS ALL 5 PROBLEMS:
  ══════════════════════════════════════
  1. Every problem uses AT LEAST 2 GoF patterns (Strategy appears in 4/5)
  2. Every problem satisfies SRP (one class = one responsibility)
  3. Every problem is OCP (new behavior = new class, never modify existing)
  4. Every problem is DIP-compliant (high-level modules depend on abstractions)
```

## Breadth Comparison 2: Concurrency Control Strategies Table

```
┌────────────────┬──────────────────┬──────────────────┬──────────────────────┐
│  STRATEGY      │  MECHANISM       │  BEST FOR        │  RISKS               │
├────────────────┼──────────────────┼──────────────────┼──────────────────────┤
│  synchronized  │  Intrinsic lock  │  Simple shared   │  Over-synchronization│
│  (method)      │  on 'this'       │  state, low      │  (all threads wait)  │
│                │                  │  concurrency     │  Deadlock if A locks │
│                │                  │  needs           │  X and waits for Y   │
├────────────────┼──────────────────┼──────────────────┼──────────────────────┤
│  synchronized  │  Intrinsic lock  │  Multiple shared │  Must release all    │
│  (block)       │  on specific obj │  resources that  │  locks in same order │
│  (more control)│  (e.g., spots[i])│  need atomicity  │  to avoid deadlock   │
├────────────────┼──────────────────┼──────────────────┼──────────────────────┤
│  ReentrantLock │  Explicit lock   │  Try-lock        │  MUST unlock in      │
│  (java.util    │  tryLock() with  │  (non-blocking   │  finally block or    │
│  .concurrent)  │  timeout,        │  failure),       │  lock persists       │
│                │  fairness param  │  read-write      │  (unlike synch)      │
├────────────────┼──────────────────┼──────────────────┼──────────────────────┤
│  ReadWriteLock │  Shared read,    │  Read-heavy      │  Writers may starve │
│                │  exclusive write │  workloads       │  if readers keep     │
│                │                  │  (parking spots) │  coming              │
├────────────────┼──────────────────┼──────────────────┼──────────────────────┤
│  AtomicInteger │  CAS (Compare-   │  Simple counter  │  Only works for      │
│  AtomicLong    │  And-Swap, no    │  increments,     │  single variables    │
│                │  locking)        │  flags           │  (not compound ops) │
├────────────────┼──────────────────┼──────────────────┼──────────────────────┤
│  Concurrent    │  Lock-free queue │  Producer-       │  Iteration requires  │
│  LinkedQueue   │  (CAS-based)     │  consumer (event │  snapshot or iterator│
│  Concurrent    │                  │  processing,     │  from queue          │
│  HashMap       │                  │  request queues) │                      │
├────────────────┼──────────────────┼──────────────────┼──────────────────────┤
│  volatile      │  Read/write      │  Flags, caches   │  NOT atomic for      │
│  (fields)      │  visibility      │  (no compound    │  compound operations │
│                │  (no lock)       │  operations)     │  (volatile++ is NOT  │
│                │                  │                  │  thread-safe!)       │
├────────────────┼──────────────────┼──────────────────┼──────────────────────┤
│  StampedLock   │  Optimistic read │  Read-heavy      │  Must validate stamp │
│  (Java 8+)     │  with validate   │  with rare writes│  after read or       │
│                │                  │  (cache)         │  retry               │
└────────────────┴──────────────────┴──────────────────┴──────────────────────┘

  DECISION GUIDE FOR LLD PROBLEMS:
  ════════════════════════════════════

  Need to protect simple counter (active tickets count)?
  → AtomicInteger / AtomicLong (no lock needed)

  Need to protect a data structure (available spots)?
  → synchronized block OR ConcurrentHashMap + computeIfAbsent

  Need try-lock with timeout (deadlock recovery)?
  → ReentrantLock with tryLock(timeout, unit)

  Need many readers, rare writers (parking lot availability)?
  → ReadWriteLock (multiple readers, exclusive writer)

  Need distributed lock across machines?
  → Redis SETNX + TTL (Redisson RLock)

  Need DB-level lock?
  → SELECT ... FOR UPDATE (pessimistic) or version column (optimistic)
```

**Navigation**: [< Previous](../06_Distributed_Systems_Fundamentals.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next >](../08_Design_Patterns_Java.md)

🔬 **Section Challenge — SOLID Principles in Every Solution**

**Challenge 1 (Reasoning):** Open/Closed Principle says 'closed for modification'. Does this mean code can NEVER be changed?

<details><summary>Answer</summary>

No — it means don't modify existing, tested behavior to add new features. Add new classes/methods instead. In practice: use interfaces + plugins. Adding a new payment type = new class implementing `PaymentStrategy`. Not modifying `PaymentProcessor`. The existing processor is 'closed' (don't touch tested code). The system is 'open' (easily extend by adding new implementations).

</details>

**Challenge 2 (Design):** A class has 5 public methods but clients only use 1-2. Which SOLID principle is violated and what's the fix?

<details><summary>Answer</summary>

Interface Segregation Principle (ISP): clients shouldn't depend on methods they don't use. Fix: split the class into smaller, focused interfaces. `Printable`, `Scannable`, `FaxMachine` instead of one `AllInOnePrinter`. Each client implements/uses only the interface it needs.

</details>

## Historical Evolution

These problems are classic interview staples; the verifiable milestones behind them are below.

- **Parking lot** — a standard teaching example for inheritance versus composition, enums and strategy-based pricing; it has no single historical origin.
- **Seat booking** — airline reservation is the original high-concurrency booking problem: IBM and American Airlines' SABRE went live around 1960. Two agents selling the same seat is the textbook lost-update race.
- **Expense sharing** — settling debts with the fewest transfers is a combinatorial problem (minimising transactions is NP-hard in general); the common greedy approach of matching the largest creditor with the largest debtor needs at most n-1 transfers but is not always minimal.
- **Elevator** — scheduling follows disk-arm scheduling: the SCAN or "elevator" algorithm was analysed by Denning (1967), with SCAN and LOOK variants compared by Teorey and Pinkerton (1972). LOOK reverses when no requests remain ahead rather than travelling to the end.
- **Logger / Chain of Responsibility** — the GoF pattern (1994) is visible in Unix syslog (BSD, 1980s), Log4j (first released 1999-2001) and `java.util.logging` (JDK 1.4, 2002), where a record travels through handlers and levels.


## Production Reality

- **Parking-lot double booking (illustrative)**: A check-then-act sequence - read "spot is free" in one request, write "booked" in another with no lock or constraint between them - is a time-of-check to time-of-use race, so two users can both be told the spot is theirs. The fix is to make the claim atomic: a `synchronized` or per-spot lock for in-memory designs, or a conditional update or `SELECT ... FOR UPDATE` plus a unique constraint in a database. This is why the solution's `parkVehicle()` is synchronized.
- **Elevator LOOK versus SCAN**: SCAN sweeps to the physical end before reversing; LOOK reverses at the last pending request, saving travel. Real dispatchers add zoning and destination-dispatch rules on top, but the interview answer is the direction-aware sweep.
- **Therac-25, 1985-1987**: A radiation-therapy machine delivered massive overdoses in six known accidents, with deaths among the patients (Leveson and Turner, 1993). The investigation found race conditions in the operator-input and setup code, reused software from earlier models, and no independent hardware interlock. Lesson for LLD: shared mutable state needs a single owner and a guarded protocol, and safety-critical invariants need a check that the main code cannot bypass.

---

[← The Lld Interview Framework](01_the_lld_interview_framework.md) | [Chapter overview](../07_LLD_Solved_Problems.md)
