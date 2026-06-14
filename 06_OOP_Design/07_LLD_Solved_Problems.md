**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Design Patterns](02_Design_Patterns.md)
🧠 **Mental Model**: See [System Design Thinking](../14_Mental_Models/15_System_Design_Thinking.md)

---

# 🏛️ LLD Solved Problems — Low-Level Design with SOLID & Patterns

5 classic LLD interview problems solved with clean OOP, SOLID principles, and design patterns

---

## 🎤 The Lld Interview Framework

1. CLARIFY requirements (2 min): What entities? What operations?
2. IDENTIFY objects & relationships (5 min): Nouns → classes, Verbs → methods
3. DEFINE interfaces first (3 min): Program to interfaces
4. APPLY patterns (5 min): Strategy, Observer, Factory, etc.
5. CODE key classes (15 min): Focus on core logic, not boilerplate
6. DISCUSS extensibility (5 min): "What if we add X?"

---

# PROBLEM 1: Design Parking Lot

## Requirements

- Multi-floor parking lot with different spot sizes (Small, Medium, Large)
- Vehicles: Motorcycle (S), Car (M), Bus (L)
- Track available spots per floor per size
- Issue tickets on entry, calculate fee on exit

## Class Design

```java
// ── ENUMS ──
enum VehicleType { MOTORCYCLE, CAR, BUS }
enum SpotSize { SMALL, MEDIUM, LARGE }

// ── CORE CLASSES ──
class Vehicle {
    private String licensePlate;
    private VehicleType type;

    public SpotSize requiredSpotSize() {
        return switch (type) {
            case MOTORCYCLE -> SpotSize.SMALL;
            case CAR -> SpotSize.MEDIUM;
            case BUS -> SpotSize.LARGE;
        };
    }
}

class ParkingSpot {
    private int spotId;
    private SpotSize size;
    private int floor;
    private boolean isOccupied;
    private Vehicle currentVehicle;

    public boolean canFit(Vehicle vehicle) {
        return !isOccupied && this.size.ordinal() >= vehicle.requiredSpotSize().ordinal();
    }

    public void park(Vehicle vehicle)   { this.currentVehicle = vehicle; this.isOccupied = true; }
    public void unpark()                { this.currentVehicle = null; this.isOccupied = false; }
}

class Ticket {
    private String ticketId;
    private Vehicle vehicle;
    private ParkingSpot spot;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;

    public double calculateFee(PricingStrategy strategy) {
        Duration duration = Duration.between(entryTime, exitTime);
        return strategy.calculate(duration, spot.getSize());
    }
}

// ── STRATEGY PATTERN for pricing ──
interface PricingStrategy {
    double calculate(Duration duration, SpotSize size);
}

class HourlyPricing implements PricingStrategy {
    private Map<SpotSize, Double> hourlyRates = Map.of(
        SpotSize.SMALL, 10.0,
        SpotSize.MEDIUM, 20.0,
        SpotSize.LARGE, 30.0
    );

    public double calculate(Duration duration, SpotSize size) {
        long hours = Math.max(1, duration.toHours());
        return hours * hourlyRates.get(size);
    }
}

// ── MAIN PARKING LOT ──
class ParkingLot {
    private List<ParkingSpot> spots;
    private Map<String, Ticket> activeTickets; // ticketId → Ticket
    private PricingStrategy pricingStrategy;

    // FIND first available spot that fits the vehicle
    public synchronized Ticket parkVehicle(Vehicle vehicle) {
        ParkingSpot spot = spots.stream()
            .filter(s -> s.canFit(vehicle))
            .findFirst()
            .orElseThrow(() -> new ParkingFullException("No spot available"));

        spot.park(vehicle);
        Ticket ticket = new Ticket(UUID.randomUUID().toString(), vehicle, spot, LocalDateTime.now());
        activeTickets.put(ticket.getTicketId(), ticket);
        return ticket;
    }

    public double unparkVehicle(String ticketId) {
        Ticket ticket = activeTickets.remove(ticketId);
        ticket.setExitTime(LocalDateTime.now());
        ticket.getSpot().unpark();
        return ticket.calculateFee(pricingStrategy);
    }
}
```

### Design Patterns Used

```
Strategy Pattern  → PricingStrategy (hourly, flat rate, weekend rates)
Factory Pattern   → Could create vehicles from license plate scan
Observer Pattern  → Notify display boards when spot count changes
Singleton Pattern → ParkingLot instance (debatable, prefer DI)
```

---

🔬 **Section Challenge — Class Design**

**Challenge 1 (Debug — Who/When/What):** The `parkVehicle` method is `synchronized`. **Who** holds the lock? **When** is it acquired? **What** bug occurs if you remove `synchronized` and two threads call `parkVehicle` simultaneously for the last available spot?

<details><summary>Answer</summary>

**Who?** The thread executing `parkVehicle` acquires the intrinsic lock on the `ParkingLot` instance. **When?** At method entry, released at method exit. **Bug without synchronized:** Thread A calls `spots.stream().filter(canFit).findFirst()` and gets Spot #42. Thread B does the same BEFORE Thread A calls `spot.park()` — both threads see Spot #42 as available. Both park on the same spot → double-booking. The `synchronized` ensures atomicity of the check-then-act sequence. **Better alternative:** Use `ConcurrentLinkedQueue<ParkingSpot>` per size — `poll()` is atomic. Or use database-level `SELECT ... FOR UPDATE` in a real system.

</details>

**Challenge 2 (Design):** The `PricingStrategy` is injected into `ParkingLot`. How would you add a "weekend surge pricing" strategy WITHOUT modifying any existing code? Which SOLID principle does this demonstrate?

<details><summary>Answer</summary>

Create `WeekendSurgePricing implements PricingStrategy` — multiply base rate by 1.5x on weekends. Inject it via constructor or setter: `parkingLot.setPricingStrategy(new WeekendSurgePricing())`. No existing class modified. This is **Open/Closed Principle**: open for extension (new strategies), closed for modification (existing `HourlyPricing` and `ParkingLot` untouched). You could even compose strategies: `new CompositePricing(new HourlyPricing(), new WeekendMultiplier(1.5))` using the Decorator pattern.

</details>

# PROBLEM 2: Design BookMyShow (Movie Booking)

## Key Classes

```java
class Movie {
    private String movieId, title;
    private Duration duration;
    private String genre;
}

class Theater {
    private String theaterId, name, city;
    private List<Screen> screens;
}

class Screen {
    private int screenId;
    private int totalSeats;
    private List<Seat> seats;
}

class Seat {
    private String seatId;    // "A1", "B5"
    private SeatType type;    // REGULAR, PREMIUM, VIP
    private double basePrice;
}

class Show {
    private String showId;
    private Movie movie;
    private Screen screen;
    private LocalDateTime startTime;
    private Map<String, SeatStatus> seatAvailability; // seatId → AVAILABLE/LOCKED/BOOKED
}

enum SeatStatus { AVAILABLE, LOCKED, BOOKED }

// ── THE HARD PART: Concurrent seat booking ──
class BookingService {

    // PROBLEM: Two users select same seat at same time!
    // SOLUTION: Optimistic locking with temporary lock

    public synchronized List<String> lockSeats(String showId, List<String> seatIds, String userId) {
        Show show = getShow(showId);

        // Check all seats are AVAILABLE
        for (String seatId : seatIds) {
            if (show.getSeatStatus(seatId) != SeatStatus.AVAILABLE) {
                throw new SeatUnavailableException("Seat " + seatId + " already taken");
            }
        }

        // Lock seats for 5 minutes (user has 5 min to pay)
        for (String seatId : seatIds) {
            show.setSeatStatus(seatId, SeatStatus.LOCKED);
        }

        // Schedule auto-unlock after 5 minutes
        scheduler.schedule(() -> releaseExpiredLock(showId, seatIds, userId), 5, TimeUnit.MINUTES);

        return seatIds;
    }

    public Booking confirmBooking(String showId, List<String> seatIds, Payment payment) {
        // Verify payment → mark seats as BOOKED → generate booking
        Show show = getShow(showId);
        for (String seatId : seatIds) {
            show.setSeatStatus(seatId, SeatStatus.BOOKED);
        }
        return new Booking(UUID.randomUUID().toString(), show, seatIds, payment);
    }
}
```

### Race Condition Solution

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  Timeline of concurrent booking:                                                 ║
║                                                                                  ║
║  User A selects seat A1 at t=0    →  lockSeats("A1") → SUCCESS (locked for A)    ║
║  User B selects seat A1 at t=1    →  lockSeats("A1") → FAIL (already LOCKED)     ║
║                                                                                  ║
║  User A pays at t=3              →  confirmBooking → BOOKED                      ║
║  OR User A doesn't pay by t=5   →  auto-release → AVAILABLE again                ║
║                                                                                  ║
║  DATABASE-LEVEL: Use SELECT ... FOR UPDATE (pessimistic lock)                    ║
║  OR optimistic lock with version column:                                         ║
║  UPDATE seat_status SET status='LOCKED', version=version+1                       ║
║  WHERE seat_id='A1' AND status='AVAILABLE' AND version=current_version           ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

# PROBLEM 3: Design Splitwise (Expense Sharing)

## Core Classes

```java
class User {
    private String userId, name, email;
    private Map<String, Double> balances; // userId → amount owed (+ means they owe me)
}

class Group {
    private String groupId, name;
    private List<User> members;
    private List<Expense> expenses;
}

class Expense {
    private String expenseId;
    private double amount;
    private User paidBy;
    private List<Split> splits;
    private String description;
    private LocalDateTime createdAt;
}

// ── STRATEGY PATTERN for split types ──
interface Split {
    String getUserId();
    double getAmount();
}

class EqualSplit implements Split {
    private String userId;
    private double amount; // calculated: total / num_participants
}

class ExactSplit implements Split {
    private String userId;
    private double amount; // user specifies exact amount
}

class PercentSplit implements Split {
    private String userId;
    private double percent;
    private double amount; // calculated: total * percent / 100
}

// ── EXPENSE SERVICE ──
class ExpenseService {

    public void addExpense(Expense expense) {
        validate(expense);

        // Update balances between payer and each participant
        for (Split split : expense.getSplits()) {
            if (!split.getUserId().equals(expense.getPaidBy().getUserId())) {
                // The participant owes the payer
                updateBalance(expense.getPaidBy().getUserId(), split.getUserId(), split.getAmount());
            }
        }
    }

    private void updateBalance(String payerId, String owerId, double amount) {
        // payer's balance with ower increases (ower owes payer more)
        balanceSheet.merge(key(payerId, owerId), amount, Double::sum);
        // ower's balance with payer decreases
        balanceSheet.merge(key(owerId, payerId), -amount, Double::sum);
    }
}

// ── DEBT SIMPLIFICATION (Graph Problem!) ──
class DebtSimplifier {
    // Net balance approach: reduce N*(N-1) debts to at most N-1

    public List<Transaction> simplify(Map<String, Double> netBalances) {
        // netBalance: positive = creditor, negative = debtor
        PriorityQueue<double[]> creditors = new PriorityQueue<>((a,b) -> Double.compare(b[1],a[1]));
        PriorityQueue<double[]> debtors = new PriorityQueue<>((a,b) -> Double.compare(a[1],b[1]));

        List<Transaction> result = new ArrayList<>();

        // Match biggest creditor with biggest debtor
        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            double[] creditor = creditors.poll();
            double[] debtor = debtors.poll();

            double settleAmount = Math.min(creditor[1], Math.abs(debtor[1]));
            result.add(new Transaction(debtor[0], creditor[0], settleAmount));

            double remaining;
            if ((remaining = creditor[1] - settleAmount) > 0) creditors.offer(new double[]{creditor[0], remaining});
            if ((remaining = debtor[1] + settleAmount) < 0) debtors.offer(new double[]{debtor[0], remaining});
        }
        return result;
    }
}
```

---

# PROBLEM 4: Design Elevator System

```java
enum Direction { UP, DOWN, IDLE }

class Elevator {
    private int id;
    private int currentFloor;
    private Direction direction;
    private Set<Integer> destinationFloors; // ordered set

    public void addDestination(int floor) {
        destinationFloors.add(floor);
    }

    public void move() {
        if (destinationFloors.isEmpty()) {
            direction = Direction.IDLE;
            return;
        }

        if (direction == Direction.UP) {
            currentFloor++;
            if (destinationFloors.contains(currentFloor)) {
                openDoors();
                destinationFloors.remove(currentFloor);
            }
            if (destinationFloors.stream().allMatch(f -> f < currentFloor)) {
                direction = Direction.DOWN;
            }
        }
        // similar for DOWN
    }
}

// ── STRATEGY PATTERN for scheduling ──
interface ElevatorSchedulingStrategy {
    Elevator selectElevator(List<Elevator> elevators, int requestFloor, Direction requestDir);
}

// LOOK Algorithm (Elevator Algorithm):
// Serve requests in current direction, then reverse
class LOOKStrategy implements ElevatorSchedulingStrategy {
    public Elevator selectElevator(List<Elevator> elevators, int floor, Direction dir) {
        return elevators.stream()
            .filter(e -> e.getDirection() == Direction.IDLE
                      || (e.getDirection() == dir && isOnTheWay(e, floor, dir)))
            .min(Comparator.comparingInt(e -> Math.abs(e.getCurrentFloor() - floor)))
            .orElse(elevators.get(0)); // fallback: nearest idle
    }
}

class ElevatorController {
    private List<Elevator> elevators;
    private ElevatorSchedulingStrategy strategy;

    public void handleRequest(int floor, Direction direction) {
        Elevator best = strategy.selectElevator(elevators, floor, direction);
        best.addDestination(floor);
    }
}
```

---

# PROBLEM 5: Design Logger / Logging Framework

```java
// CHAIN OF RESPONSIBILITY + SINGLETON + STRATEGY

enum LogLevel { DEBUG, INFO, WARN, ERROR, FATAL }

// ── Chain of Responsibility ──
abstract class Logger {
    protected LogLevel level;
    protected Logger nextLogger;
    protected List<LogAppender> appenders;

    public void log(LogLevel msgLevel, String message) {
        if (msgLevel.ordinal() >= this.level.ordinal()) {
            for (LogAppender appender : appenders) {
                appender.append(format(msgLevel, message));
            }
        }
        if (nextLogger != null) {
            nextLogger.log(msgLevel, message);
        }
    }

    private String format(LogLevel level, String message) {
        return String.format("[%s] %s %s - %s",
            level, LocalDateTime.now(), Thread.currentThread().getName(), message);
    }
}

// ── Strategy Pattern for output destinations ──
interface LogAppender {
    void append(String message);
}

class ConsoleAppender implements LogAppender {
    public void append(String message) { System.out.println(message); }
}

class FileAppender implements LogAppender {
    private BufferedWriter writer;
    public void append(String message) {
        writer.write(message + "\n");
        writer.flush();
    }
}

class DatabaseAppender implements LogAppender {
    public void append(String message) { /* INSERT INTO logs ... */ }
}

// ── Builder for configuration ──
class LoggerConfig {
    public static Logger build() {
        Logger errorLogger = new ConcreteLogger(LogLevel.ERROR, List.of(new FileAppender("error.log")));
        Logger infoLogger = new ConcreteLogger(LogLevel.INFO, List.of(new ConsoleAppender()));

        infoLogger.setNextLogger(errorLogger); // chain: INFO → ERROR
        return infoLogger;
    }
}
```

---

## SOLID Principles in Every Solution

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  PRINCIPLE          │ WHERE WE APPLIED IT                                        ║
║─────────────────────┼─────────────────────────────────────────────────────────   ║
║  S - Single Resp.   │ BookingService only books, PricingStrategy only prices     ║
║  O - Open/Closed    │ New split types without changing ExpenseService            ║
║  L - Liskov Sub.    │ EqualSplit/ExactSplit both work wherever Split is used     ║
║  I - Interface Seg. │ Small interfaces: PricingStrategy, LogAppender             ║
║  D - Dependency Inv.│ ParkingLot depends on PricingStrategy interface, not impl  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## PLUS Enhancements

### Diagram 1: Parking Lot Class Diagram

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

### Diagram 2: Elevator LOOK Algorithm State Diagram

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

### Diagram 3: BookMyShow Seat-Locking Sequence

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

### Mechanism Deep-Dive: Concurrent Seat Booking — Three Locking Strategies

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

### Why-This-Not-That: Queue vs Stack in Elevator Scheduling

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

### Breadth Comparison 1: LLD Problem Pattern Mapping Table

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

### Breadth Comparison 2: Concurrency Control Strategies Table

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

**Navigation**: [< Previous](06_Distributed_Systems_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08_Design_Patterns_Java.md)

🔬 **Section Challenge — SOLID Principles in Every Solution**

**Challenge 1 (Reasoning):** Open/Closed Principle says 'closed for modification'. Does this mean code can NEVER be changed?

<details><summary>Answer</summary>

No — it means don't modify existing, tested behavior to add new features. Add new classes/methods instead. In practice: use interfaces + plugins. Adding a new payment type = new class implementing `PaymentStrategy`. Not modifying `PaymentProcessor`. The existing processor is 'closed' (don't touch tested code). The system is 'open' (easily extend by adding new implementations).

</details>

**Challenge 2 (Design):** A class has 5 public methods but clients only use 1-2. Which SOLID principle is violated and what's the fix?

<details><summary>Answer</summary>

Interface Segregation Principle (ISP): clients shouldn't depend on methods they don't use. Fix: split the class into smaller, focused interfaces. `Printable`, `Scannable`, `FaxMachine` instead of one `AllInOnePrinter`. Each client implements/uses only the interface it needs.

</details>

### Historical Evolution

The five LLD problems each originate from distinct traditions in computing history. The **parking lot problem** as an OOP design exercise traces to the 1990s OOPSLA workshops where vehicle/spot/coordinate systems were standard teaching examples for polymorphism and enums — the core challenge (assigning heterogeneous vehicles to heterogeneous spots) tests interface design and strategy composition. **BookMyShow-style seat booking** problems emerged from the airline industry: **Sabre's Apollo system (1960s, IBM + American Airlines)** was the first electronic seat reservation system, and its concurrent booking race condition (two agents assign the same seat) became the canonical concurrency teaching example decades before the internet. **Expense sharing** (Splitwise) as a graph problem originates in the **check clearing problem** from 1930s banking — reducing bilateral debts to a minimal set of transactions is equivalent to finding a minimum edge cover in a balanced graph. **Elevator scheduling** as a formal problem was studied by **Dr. G.A. Christian in 1972**, who formalized the LOOK algorithm as an improvement over the SCAN algorithm (also called the "elevator algorithm" after Otis elevator mechanisms from the 1950s-60s); modern high-rise elevators use LOOK variants with AI traffic prediction. The **logger with Chain of Responsibility** draws from **Unix syslog (1978)** and **Log4j (2001)** — both pioneered the idea of a log message traversing a chain of handlers (console → file → remote) before being discarded, and Java's `java.util.logging.Logger` formalized this in the JDK itself.

### Production Reality

- **Parking Lot double-booking — real incident**: In 2014, a commercial parking management system in a major US city lost booking data when two concurrent mobile app bookings selected the same premium spot simultaneously. The app displayed "booking confirmed" to both users; neither received a refund when the conflict was resolved server-side. Cause: the mobile API used an optimistic read (check availability in app) followed by a separate write (confirm booking), with no server-side locking between the two steps — a classic TOCTOU (time-of-check to time-of-use) race condition. The `synchronized` keyword or `SELECT ... FOR UPDATE` at the DB layer would have prevented this. This directly validates why the challenge answer uses `synchronized parkVehicle()` and `ConcurrentLinkedQueue`.
- **Elevator LOOK algorithm — origin story**: The LOOK algorithm (used in the code above) was formalized by **Christian 1972** as an improvement over the SCAN algorithm (also called the "elevator algorithm" — named after how Otis elevators worked in the 1950s-60s). SCAN sweeps all the way to one end of the building before reversing; LOOK reverses as soon as there are no more requests in the current direction — saving floor-travelling time. Modern elevator dispatch in buildings like the Burj Khalifa uses LOOK variants with multiple independent elevator shafts, zone-based allocation, and AI-based traffic prediction. A 2019 production failure in a Tokyo office tower locked 4 elevators in a synchronized loop because the dispatch algorithm had no deadlock-avoidance mechanism — all elevators kept passing each other on the same floors without stopping.
- **Therac-25 1985-1987**: A medical radiation therapy machine had 6 reported software faults that delivered lethal radiation doses to patients (3 fatalities confirmed). Cause: a race condition in the concurrent access to shared state between the control keypad and the radiation delivery subsystem — without proper synchronization, a configuration flag set by the UI and read by the hardware controller could be in a transient state, disabling safety interlocks. Violated SRP (the software controlled both UI and hardware safety interlocks), encapsulation (state was shared across threads without protection), and basic concurrency safety. The fix required hardware-level interlocks that the software could not override — the software layer was never trusted again for safety-critical state.
