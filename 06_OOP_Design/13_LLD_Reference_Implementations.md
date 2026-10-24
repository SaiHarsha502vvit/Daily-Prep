# 🧪 LLD Reference Implementations — Parking Lot, Seat Booking, Expense Split, Elevator, Logger

> **Navigation**: [← LLD Solved Problems — Low-Level…](07_LLD_Solved_Problems.md) | [Chapter index](00_INDEX.md) | [OOP & Design — Problem Sets →](06b_PROBLEM_SETS.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [LLD Solved Problems](07_LLD_Solved_Problems.md) (the class outlines and interview framework), [Domain-Driven Design](09_Domain_Driven_Design_Essentials.md) (invariants and ownership) |
| **You will learn** | What a complete, runnable, tested version of each LLD outline looks like, including the concurrency tests that prove the double-booking fixes |
| **Leads to** | [Problem Sets](06b_PROBLEM_SETS.md) (practise variations), [Design problems](../05_Problem_Solving/21_Design.md) |
| **Abstraction level** | Class outline on a whiteboard → **compiling code with tests** → **property and concurrency tests that catch design errors** |

> [!NOTE]
> The class listings in [LLD Solved Problems](07_LLD_Solved_Problems.md) are interview outlines: they omit constructors, getters and helper types, so they do not compile on their own. This page is the compiled counterpart. It also uses `long` cents instead of `double` for money.

---

## 💬 Explain It Like a Study Partner — Reference Implementations

### 1. The bottom line

A design is only credible once it runs: give each invariant one owner, make the contended step atomic, and write the test that tries to break it.

### 2. The textbook core

- **Parking lot** — the contended step is picking a free spot; keep free spots in per-size queues and make `park` and `exit` atomic.
- **Seat booking** — separate _hold_ (temporary, expires) from _confirm_ (final); one owner per seat is the invariant.
- **Expense split** — keep money in integer cents; every expense leaves the balances summing to zero; settling the largest creditor against the largest debtor uses at most `n-1` transfers.
- **Elevator** — LOOK keeps moving in one direction while requests remain ahead and reverses only when none do.
- **Logger** — a chain of handlers each decides whether to write and then passes the message on; appenders are injected.

### 3. The real-world analogy

A **cinema box office**: a clerk (the lock) hands out one ticket at a time for each seat; a seat held at the counter but not paid for goes back on sale after a few minutes.

### 4. Walkthrough

One file, five designs, one `main` that is the test suite. Run it with `javac Lld.java && java Lld`.

```java
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.function.*;

public class Lld {
    // =====================================================================
    // 1. PARKING LOT: allocation is the contended step, so it is atomic.
    // =====================================================================
    enum VehicleType { MOTORCYCLE, CAR, BUS }
    enum SpotSize { SMALL, MEDIUM, LARGE }
    record Vehicle(String plate, VehicleType type) {
        SpotSize required() { return switch (type) { case MOTORCYCLE -> SpotSize.SMALL; case CAR -> SpotSize.MEDIUM; case BUS -> SpotSize.LARGE; }; }
    }
    record Spot(int id, SpotSize size) {}
    record Ticket(String id, Vehicle vehicle, Spot spot, long entryMinute) {}
    interface Pricing { long cents(Duration parked, SpotSize size); }
    static final class HourlyPricing implements Pricing {
        private static final Map<SpotSize, Long> RATE = Map.of(SpotSize.SMALL, 100L, SpotSize.MEDIUM, 200L, SpotSize.LARGE, 300L);
        public long cents(Duration d, SpotSize s) { long hours = Math.max(1, (d.toMinutes() + 59) / 60); return hours * RATE.get(s); }
    }
    static class ParkingFullException extends RuntimeException { ParkingFullException(String m) { super(m); } }
    static final class ParkingLot {
        private final Map<SpotSize, Deque<Spot>> free = new EnumMap<>(SpotSize.class);
        private final Map<String, Ticket> active = new HashMap<>();
        private final Pricing pricing; private int seq;
        ParkingLot(List<Spot> spots, Pricing pricing) {
            for (SpotSize s : SpotSize.values()) free.put(s, new ArrayDeque<>());
            spots.forEach(s -> free.get(s.size()).add(s));
            this.pricing = pricing;
        }
        synchronized Ticket park(Vehicle v, long nowMinute) {
            for (SpotSize s : SpotSize.values()) {                    // smallest spot that fits
                if (s.ordinal() < v.required().ordinal()) continue;
                Spot spot = free.get(s).pollFirst();
                if (spot != null) { Ticket t = new Ticket("T" + (++seq), v, spot, nowMinute); active.put(t.id(), t); return t; }
            }
            throw new ParkingFullException("no spot for " + v.plate());
        }
        synchronized long exit(String ticketId, long nowMinute) {
            Ticket t = active.remove(ticketId);
            if (t == null) throw new IllegalArgumentException("unknown ticket");
            free.get(t.spot().size()).addFirst(t.spot());
            return pricing.cents(Duration.ofMinutes(nowMinute - t.entryMinute()), t.spot().size());
        }
    }

    // =====================================================================
    // 2. SEAT BOOKING: hold with expiry, then confirm; one owner per seat.
    // =====================================================================
    static final class SeatMap {
        private record Hold(String user, long expiresAt) {}
        private final Map<String, Hold> holds = new HashMap<>(); private final Set<String> sold = new HashSet<>();
        synchronized boolean hold(String seat, String user, long now, long ttl) {
            if (sold.contains(seat)) return false;
            Hold h = holds.get(seat);
            if (h != null && h.expiresAt() > now && !h.user().equals(user)) return false;
            holds.put(seat, new Hold(user, now + ttl)); return true;
        }
        synchronized boolean confirm(String seat, String user, long now) {
            Hold h = holds.get(seat);
            if (h == null || h.expiresAt() <= now || !h.user().equals(user)) return false;
            holds.remove(seat); sold.add(seat); return true;
        }
        synchronized int soldCount() { return sold.size(); }
    }

    // =====================================================================
    // 3. EXPENSE SPLIT: money in cents, balances sum to zero, settle greedily.
    // =====================================================================
    record Transfer(String from, String to, long cents) {}
    static final class Ledger {
        private final Map<String, Long> balance = new TreeMap<>();   // positive = is owed
        void addEqualExpense(String payer, long cents, List<String> participants) {
            long share = cents / participants.size(), rem = cents % participants.size();
            balance.merge(payer, cents, Long::sum);
            for (int i = 0; i < participants.size(); i++) balance.merge(participants.get(i), -(share + (i < rem ? 1 : 0)), Long::sum);
        }
        long total() { return balance.values().stream().mapToLong(Long::longValue).sum(); }
        List<Transfer> settle() {
            PriorityQueue<Map.Entry<String, Long>> cred = new PriorityQueue<>((a, b) -> Long.compare(b.getValue(), a.getValue()));
            PriorityQueue<Map.Entry<String, Long>> debt = new PriorityQueue<>((a, b) -> Long.compare(a.getValue(), b.getValue()));
            balance.forEach((k, v) -> { if (v > 0) cred.add(new AbstractMap.SimpleEntry<>(k, v)); else if (v < 0) debt.add(new AbstractMap.SimpleEntry<>(k, v)); });
            List<Transfer> out = new ArrayList<>();
            while (!cred.isEmpty() && !debt.isEmpty()) {
                var c = cred.poll(); var d = debt.poll(); long amt = Math.min(c.getValue(), -d.getValue());
                out.add(new Transfer(d.getKey(), c.getKey(), amt));
                if (c.getValue() > amt) cred.add(new AbstractMap.SimpleEntry<>(c.getKey(), c.getValue() - amt));
                if (-d.getValue() > amt) debt.add(new AbstractMap.SimpleEntry<>(d.getKey(), d.getValue() + amt));
            }
            return out;
        }
    }

    // =====================================================================
    // 4. ELEVATOR: LOOK scheduling over pending floor requests.
    // =====================================================================
    static final class Elevator {
        private int floor; private boolean up = true; private final TreeSet<Integer> stops = new TreeSet<>(); long travelled;
        Elevator(int start) { floor = start; }
        void request(int f) { if (f != floor) stops.add(f); }
        List<Integer> run() {                                    // returns visit order
            List<Integer> order = new ArrayList<>();
            while (!stops.isEmpty()) {
                Integer next = up ? stops.ceiling(floor) : stops.floor(floor);
                if (next == null) { up = !up; continue; }       // LOOK: reverse only when nothing remains ahead
                travelled += Math.abs(next - floor); floor = next; stops.remove(next); order.add(next);
            }
            return order;
        }
    }

    // =====================================================================
    // 5. LOGGER: chain of responsibility over levels, appenders injected.
    // =====================================================================
    enum Level { DEBUG, INFO, ERROR }
    interface Appender { void write(String line); }
    static abstract class Handler {
        private Handler next; private final Level level; private final Appender out;
        Handler(Level level, Appender out) { this.level = level; this.out = out; }
        Handler then(Handler n) { next = n; return n; }
        final void log(Level l, String msg) { if (l == level) out.write(l + ": " + msg); if (next != null) next.log(l, msg); }
    }
    static final class Simple extends Handler { Simple(Level l, Appender a) { super(l, a); } }

    // ---------------------------------------------------------------------
    static void check(boolean c, String m) { if (!c) throw new AssertionError(m); }
    public static void main(String[] args) throws Exception {
        // parking: fit rules, pricing, exhaustion, release
        var lot = new ParkingLot(List.of(new Spot(1, SpotSize.SMALL), new Spot(2, SpotSize.MEDIUM), new Spot(3, SpotSize.LARGE)), new HourlyPricing());
        Ticket moto = lot.park(new Vehicle("M1", VehicleType.MOTORCYCLE), 0);
        check(moto.spot().size() == SpotSize.SMALL, "smallest fit");
        Ticket car = lot.park(new Vehicle("C1", VehicleType.CAR), 0);
        Ticket bus = lot.park(new Vehicle("B1", VehicleType.BUS), 0);
        try { lot.park(new Vehicle("C2", VehicleType.CAR), 0); check(false, "should be full"); } catch (ParkingFullException expected) { }
        check(lot.exit(car.id(), 61) == 400, "2 started hours at 200");
        check(lot.park(new Vehicle("C2", VehicleType.CAR), 70).spot().id() == 2, "freed spot reused");
        // parking: concurrency -- 50 threads race for 10 spots; exactly 10 succeed, no spot used twice
        var spots = new ArrayList<Spot>(); for (int i = 0; i < 10; i++) spots.add(new Spot(i, SpotSize.MEDIUM));
        var big = new ParkingLot(spots, new HourlyPricing()); var ok = new ConcurrentLinkedQueue<Integer>();
        var pool = Executors.newFixedThreadPool(8); var fs = new ArrayList<Future<?>>();
        for (int i = 0; i < 50; i++) { final int n = i; fs.add(pool.submit(() -> { try { ok.add(big.park(new Vehicle("V" + n, VehicleType.CAR), 0).spot().id()); } catch (ParkingFullException e) { } })); }
        for (var f : fs) f.get(); pool.shutdown();
        check(ok.size() == 10 && new HashSet<>(ok).size() == 10, "10 distinct spots, got " + ok.size());

        // seats: hold, expiry, confirm, double-book prevention
        var seats = new SeatMap();
        check(seats.hold("A1", "ann", 0, 10), "ann holds");
        check(!seats.hold("A1", "bob", 5, 10), "bob blocked while held");
        check(seats.hold("A1", "bob", 10, 10), "hold expired, bob can take it");
        check(!seats.confirm("A1", "ann", 11), "ann lost it");
        check(seats.confirm("A1", "bob", 11) && !seats.hold("A1", "cy", 12, 10), "sold seat is final");
        var seats2 = new SeatMap(); var winners = new AtomicInteger(); var pool2 = Executors.newFixedThreadPool(8); var fs2 = new ArrayList<Future<?>>();
        for (int i = 0; i < 100; i++) { final String u = "u" + i; fs2.add(pool2.submit(() -> { if (seats2.hold("Z9", u, 0, 100) && seats2.confirm("Z9", u, 1)) winners.incrementAndGet(); })); }
        for (var f : fs2) f.get(); pool2.shutdown();
        check(winners.get() == 1 && seats2.soldCount() == 1, "exactly one buyer, got " + winners.get());

        // ledger: conservation + settlement property test against random expenses
        var rnd = new Random(7);
        for (int trial = 0; trial < 300; trial++) {
            var led = new Ledger(); String[] people = {"a", "b", "c", "d", "e"};
            for (int e = 0; e < 1 + rnd.nextInt(8); e++) {
                var part = new ArrayList<>(Arrays.asList(people)); Collections.shuffle(part, rnd); part = new ArrayList<>(part.subList(0, 1 + rnd.nextInt(5)));
                led.addEqualExpense(people[rnd.nextInt(5)], 1 + rnd.nextInt(10_000), part);
            }
            check(led.total() == 0, "balances sum to zero");
            Map<String, Long> after = new TreeMap<>(led.balance);
            var transfers = led.settle();
            for (Transfer t : transfers) { after.merge(t.from(), t.cents(), Long::sum); after.merge(t.to(), -t.cents(), Long::sum); check(t.cents() > 0, "positive transfer"); }
            check(after.values().stream().allMatch(v -> v == 0), "everyone settled");
            long nonZero = led.balance.values().stream().filter(v -> v != 0).count();
            check(transfers.size() <= Math.max(0, nonZero - 1), "at most n-1 transfers: " + transfers.size() + " vs " + nonZero);
        }

        // elevator: LOOK visit order and distance
        var el = new Elevator(5); for (int f : new int[]{8, 2, 6, 1, 9}) el.request(f);
        check(el.run().equals(List.of(6, 8, 9, 2, 1)), "LOOK order");
        check(el.travelled == 1 + 2 + 1 + 7 + 1, "distance " + el.travelled);

        // logger chain
        var sink = new ArrayList<String>();
        Handler h = new Simple(Level.DEBUG, a -> sink.add("console " + a));
        h.then(new Simple(Level.INFO, a -> sink.add("file " + a))).then(new Simple(Level.ERROR, a -> sink.add("alert " + a)));
        h.log(Level.ERROR, "disk full"); h.log(Level.INFO, "started");
        check(sink.equals(List.of("alert ERROR: disk full", "file INFO: started")), "logger " + sink);
        System.out.println("LLD OK");
    }
}
```

Verified output: `LLD OK` (compiled with Java 21 and run).

**What the tests prove**

| Test | What it rules out |
| --- | --- |
| 50 threads race for 10 parking spots | Two cars on one spot; more tickets than spots |
| 100 threads hold and confirm one seat | Two buyers for one seat |
| 300 random ledgers | Balances that do not sum to zero; unsettled debts; more than `n-1` transfers |
| LOOK order and distance | Reversing too early or sweeping to the end |
| Logger chain | Messages written at the wrong level |

```mermaid
flowchart LR
  subgraph PK["Parking lot"]
    P1["park(vehicle)"] --> P2["poll smallest fitting free spot"] --> P3["Ticket"]
    P3 --> P4["exit(ticket)"] --> P5["return spot, price by hours"]
  end
  subgraph ST["Seat booking"]
    S1["hold(seat, user, ttl)"] --> S2expired or same user?
    S2 -->|yes| S3["confirm -> sold"]
    S2 -->|no| S4["rejected"]
  end
  classDef a fill:#dbeafe,stroke:#2563eb,color:#0c1a4a;
  classDef b fill:#dcfce7,stroke:#16a34a,color:#052e16;
  class P1,P2,P3,P4,P5 a;
  class S1,S2,S3,S4 b;
```

**How to read this diagram.** Each box is a state change guarded by the lock in the code: the parking lot hands out a spot at most once, and a seat moves from held to sold only for the user who still owns the unexpired hold.

### 5. Check yourself

**Q1.** Why does `ParkingLot` use `synchronized` on `park` and `exit` rather than a lock per spot?

<details><summary>Answer</summary>

With a few thousand spots and sub-millisecond critical sections, one lock is simple and correct. Finer locks (per size queue) reduce contention only when profiling shows it matters; the invariant "a spot is in exactly one place: the free queue or a ticket" is easiest to keep with a single owner.

</details>

**Q2.** Why are balances stored in `long` cents?

<details><summary>Answer</summary>

Binary floating point cannot represent most decimal amounts exactly, so sums drift and the "balances sum to zero" invariant fails. Integer cents make the invariant exact; split remainders are distributed one cent at a time.

</details>

**Q3.** The expense settlement is greedy. Is the number of transfers always the minimum possible?

<details><summary>Answer</summary>

No. It guarantees at most `n-1` transfers where `n` is the number of people with a non-zero balance, but the true minimum (finding the most zero-sum subgroups) is NP-hard in general. Interviews accept the greedy answer if you state this.

</details>

---

## ⚡ At a Glance

| Problem | Invariant | Owner | Concurrency note |
| --- | --- | --- | --- |
| Parking lot | A spot is free **or** on a ticket | `ParkingLot` | Atomic allocation |
| Seat booking | One owner per seat; holds expire | `SeatMap` | Hold and confirm are atomic |
| Expense split | Balances sum to zero | `Ledger` | Single-threaded; guard if shared |
| Elevator | Direction changes only when nothing remains ahead | `Elevator` | One controller thread |
| Logger | Each level handled once per chain | `Handler` | Appenders must be thread-safe |

## Common mistakes

| Mistake | Why it hurts | Fix |
| --- | --- | --- |
| Check-then-act on a spot or seat without a lock | Double booking | Make the claim a single atomic operation |
| `double` for money | Rounding drift | Use integer cents or `BigDecimal` |
| Hold without expiry | Abandoned carts block seats forever | Store `expiresAt` and compare with an injected clock |
| Wall-clock calls inside the domain | Untestable | Pass time in, as `nowMinute` does here |
| One class doing allocation, pricing and printing | Many reasons to change | Separate `Pricing`, `Appender`, `Handler` |

## 🏢 Enterprise Lens — Reference Implementations

- **In a database-backed system** the in-memory lock becomes a conditional update (`UPDATE ... WHERE status = 'FREE'`), a unique constraint on `(show, seat)` or a `SELECT ... FOR UPDATE`; the tests become integration tests against a real database.
- **Holds with expiry** map to a TTL key in a cache or an `expires_at` column with a sweeper; both need an injected clock to test.
- **Idempotency**: payment confirmation must carry an idempotency key so a retry cannot confirm twice (see [User & System Flows](04_User_System_Flows.md)).
- **Observability**: log allocation failures and hold expiries as metrics; they reveal capacity and abandonment trends.

## 🧪 Practice

1. Add EV charging spots to the parking lot. How many classes change?
2. Add a `ReleaseHold` operation to `SeatMap` and test that a released seat can be taken immediately.
3. Add percentage-based splits to `Ledger` using cents, and keep the property test passing.
4. Add a second elevator and a dispatcher that picks the nearest idle one; write a test that no floor is served twice.

## Reality Check

> [!CAUTION]
> **"If the unit tests pass, the design is thread-safe."** A single-threaded test cannot show a race. The concurrent tests above fail quickly if you remove `synchronized`; always include one when a design claims to prevent double booking.

> [!WARNING]
> **"Greedy settlement minimises transfers."** It bounds them (at most `n-1`); it does not minimise them.
