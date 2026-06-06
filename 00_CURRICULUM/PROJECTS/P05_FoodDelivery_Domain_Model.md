# 🔨 Mini-Project P05 — Food Delivery Domain Model

> **Semester:** 2, Week 12  
> **Topics:** DDD · Entity Design (4-Step Framework) · Aggregate Roots · Value Objects  
> **Est. time:** 6–8 hours  
> **Reference:** `10_Enterprise_Systems/01c_Domain_Driven_Entity_Design.md`

---

## 🎯 Business Requirement (The PM Brief)

*You are the lead architect at a food delivery startup (think Swiggy / Zomato). The CTO has a hard rule: NO database tables are created until the domain model is finalized and reviewed. Your deliverable is a complete DDD entity design document plus Java class stubs.*

---

## 📋 Step 1 — Understanding the Flow

Map the complete end-to-end business process step-by-step:

```
1.  Customer opens app → browses restaurants by location, rating, cuisine
2.  Customer selects restaurant → views menu (items, prices, availability)
3.  Customer adds items to cart → applies coupon code (if any)
4.  Customer selects delivery address → views delivery estimate + final total
5.  Customer places order → payment initiated
6.  Payment succeeds → order confirmed, restaurant notified
7.  Restaurant accepts order → kitchen starts preparing
8.  Restaurant marks order as ready → delivery driver assigned
9.  Driver picks up order → real-time location tracking begins
10. Driver arrives at delivery address → customer OTP verification
11. Customer provides OTP → driver marks order as delivered
12. Payment finalized → driver earnings credited
13. Customer rates restaurant + driver → restaurant rates customer
```

---

## 📋 Step 2 — Domains (Bounded Contexts)

| Domain | Responsibility |
|---|---|
| **Customer Domain** | Customer profiles, addresses, cart management |
| **Restaurant Domain** | Restaurant profiles, menus, order acceptance |
| **Delivery Domain** | Driver management, assignment, tracking, OTP |
| **Payments Domain** | Payment processing, driver payouts, refunds |
| **Rating Domain** | Bidirectional ratings collection and aggregation |

---

## 📋 Step 3 — Responsibilities Per Domain

### Customer Domain
- Maintain customer profile (name, phone, email, preferences)
- Manage multiple delivery addresses per customer
- Manage the cart (add/remove items, apply coupons)
- Calculate cart total including taxes and discounts

### Restaurant Domain
- Maintain restaurant profile (name, location, cuisine, operating hours)
- Manage menu items (name, description, price, availability flag)
- Accept or reject incoming orders within a time window
- Update item availability (e.g., "sold out")

### Delivery Domain
- Manage driver profiles and real-time availability
- Match the best available driver to an order
- Track driver GPS location during active delivery
- Handle OTP verification for delivery confirmation

### Payments Domain
- Process customer payment at order placement
- Hold funds until delivery is confirmed
- Deduct platform commission and credit driver earnings
- Handle refunds for cancelled or failed orders

### Rating Domain
- Collect customer rating for restaurant (1–5 stars + comment)
- Collect customer rating for driver (1–5 stars)
- Collect restaurant rating for customer (used for fraud detection)
- Calculate and update aggregate ratings

---

## 📋 Step 4 — Entity Extraction

### Customer Domain

**`Customer` (Aggregate Root)**
```
id: UUID
name: String
phone: PhoneNumber (Value Object)
email: Email (Value Object)
status: ACTIVE | SUSPENDED | DELETED
addresses: List<DeliveryAddress>
defaultAddressId: UUID
createdAt: Instant
```
*Invariant: phone and email must be unique across all customers*

**`DeliveryAddress` (Entity — child of Customer)**
```
id: UUID
label: String (Home / Work / Other)
street: String
city: String
pincode: String
coordinates: GeoPoint (Value Object)
isDefault: boolean
```

**`Cart` (Aggregate Root — separate from Customer)**
```
id: UUID
customerId: UUID
restaurantId: UUID
items: List<CartItem>
couponCode: String (nullable)
subtotal: Money (Value Object)
discount: Money
total: Money
status: ACTIVE | CHECKED_OUT | ABANDONED
```
*Invariant: All CartItems must be from the SAME restaurant. Cart cannot be checked out if restaurantId's restaurant is closed.*

### Restaurant Domain

**`Restaurant` (Aggregate Root)**
```
id: UUID
name: String
ownerId: UUID
address: Address (Value Object)
cuisineTypes: Set<String>
rating: AggregateRating (Value Object)
operatingHours: List<OperatingSlot>
status: OPEN | CLOSED | SUSPENDED
```

**`MenuItem` (Entity — child of Restaurant)**
```
id: UUID
name: String
description: String
price: Money (Value Object)
category: String
isAvailable: boolean
preparationTimeMinutes: int
```
*Invariant: price must be > 0. isAvailable can be toggled only by the restaurant owner.*

### Delivery Domain

**`Order` (Aggregate Root — central entity)**
```
id: UUID
customerId: UUID
restaurantId: UUID
cartSnapshot: List<OrderLine> (immutable snapshot at checkout)
deliveryAddress: Address (Value Object)
status: PLACED → ACCEPTED → PREPARING → READY → PICKED_UP → DELIVERED | CANCELLED
otp: String (generated at READY status, 4-digit)
placedAt: Instant
estimatedDeliveryAt: Instant
actualDeliveredAt: Instant (nullable)
driverId: UUID (nullable until assigned)
fareBreakdown: FareBreakdown (Value Object)
```
*Invariant: status can only advance forward or move to CANCELLED. OTP is generated only when status transitions to READY. Order cannot be modified after PLACED.*

**`OrderLine` (Value Object — immutable snapshot)**
```
menuItemId: UUID
name: String (snapshot — original menu item may change price later)
quantity: int
unitPrice: Money
lineTotal: Money
```

**`DriverRequest` (Entity — for driver matching)**
```
id: UUID
orderId: UUID
driverId: UUID
sentAt: Instant
respondedAt: Instant (nullable)
response: PENDING | ACCEPTED | REJECTED | TIMED_OUT
```

**`Driver` (Aggregate Root — in Delivery Domain)**
```
id: UUID
name: String
phone: PhoneNumber (Value Object)
vehicleType: BIKE | CAR | CYCLE
licenseNumber: String
status: OFFLINE | AVAILABLE | ON_TRIP
currentLocation: GeoPoint (Value Object — updated in real-time)
rating: AggregateRating (Value Object)
```

### Payments Domain

**`Payment` (Aggregate Root)**
```
id: UUID
orderId: UUID
customerId: UUID
amount: Money (Value Object)
method: UPI | CARD | WALLET | CASH
status: INITIATED → CAPTURED | FAILED | REFUNDED
transactionId: String (external gateway ref)
initiatedAt: Instant
completedAt: Instant (nullable)
```

**`DriverEarnings` (Entity)**
```
id: UUID
driverId: UUID
orderId: UUID
grossAmount: Money
platformCommission: Money
netAmount: Money
creditedAt: Instant
status: PENDING | CREDITED
```

### Rating Domain

**`OrderRating` (Aggregate Root)**
```
id: UUID
orderId: UUID
restaurantRating: Rating (Value Object: 1-5 + optional comment)
driverRating: Rating (Value Object: 1-5 + optional comment)
submittedAt: Instant
isAnonymous: boolean
```

---

## ☕ Java Class Stubs

```java
// ── Value Objects ──────────────────────────────────────────

record Money(BigDecimal amount, String currencyCode) {
    public Money {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("Amount must be >= 0");
    }
    public Money add(Money other) {
        if (!this.currencyCode.equals(other.currencyCode))
            throw new IllegalArgumentException("Currency mismatch");
        return new Money(this.amount.add(other.amount), currencyCode);
    }
    public Money multiply(int qty) { return new Money(amount.multiply(BigDecimal.valueOf(qty)), currencyCode); }
}

record GeoPoint(double latitude, double longitude) {
    public GeoPoint {
        if (latitude < -90 || latitude > 90) throw new IllegalArgumentException("Invalid lat");
        if (longitude < -180 || longitude > 180) throw new IllegalArgumentException("Invalid lon");
    }
    public double distanceKm(GeoPoint other) { /* Haversine formula */ return 0; }
}

record PhoneNumber(String countryCode, String number) {
    public PhoneNumber {
        if (number == null || !number.matches("\\d{10}"))
            throw new IllegalArgumentException("Invalid phone number");
    }
}

// ── Order Aggregate Root ───────────────────────────────────

public class Order {
    private final UUID id;
    private final UUID customerId;
    private final UUID restaurantId;
    private final List<OrderLine> lines; // immutable snapshot
    private final Address deliveryAddress;
    private OrderStatus status;
    private String otp;
    private UUID driverId;
    private final Instant placedAt;
    private final List<DomainEvent> events = new ArrayList<>();

    public static Order place(UUID customerId, UUID restaurantId,
                               List<OrderLine> lines, Address deliveryAddress) {
        // TODO: validate lines not empty, all from same restaurant
        // TODO: set status = PLACED
        // TODO: add OrderPlacedEvent
        throw new UnsupportedOperationException("TODO");
    }

    /** Restaurant accepts the order — moves PLACED → ACCEPTED */
    public void accept() {
        requireStatus(OrderStatus.PLACED);
        this.status = OrderStatus.ACCEPTED;
        events.add(new OrderAcceptedEvent(id));
    }

    /** Restaurant marks order ready — generates OTP, moves ACCEPTED/PREPARING → READY */
    public void markReady() {
        if (status != OrderStatus.ACCEPTED && status != OrderStatus.PREPARING)
            throw new IllegalStateException("Cannot mark ready from status: " + status);
        this.otp = String.format("%04d", new java.util.Random().nextInt(10000));
        this.status = OrderStatus.READY;
        events.add(new OrderReadyEvent(id, otp));
    }

    /** Driver picks up — moves READY → PICKED_UP */
    public void pickup(UUID driverId) {
        requireStatus(OrderStatus.READY);
        this.driverId = driverId;
        this.status = OrderStatus.PICKED_UP;
        events.add(new OrderPickedUpEvent(id, driverId));
    }

    /** Customer OTP verified — moves PICKED_UP → DELIVERED */
    public void deliver(String submittedOtp) {
        requireStatus(OrderStatus.PICKED_UP);
        if (!this.otp.equals(submittedOtp))
            throw new IllegalArgumentException("Invalid OTP");
        this.status = OrderStatus.DELIVERED;
        events.add(new OrderDeliveredEvent(id));
    }

    /** Cancels order — only allowed before PICKED_UP */
    public void cancel(String reason) {
        if (status == OrderStatus.PICKED_UP || status == OrderStatus.DELIVERED)
            throw new IllegalStateException("Cannot cancel after pickup");
        this.status = OrderStatus.CANCELLED;
        events.add(new OrderCancelledEvent(id, reason));
    }

    private void requireStatus(OrderStatus expected) {
        if (this.status != expected)
            throw new IllegalStateException("Expected " + expected + " but was " + status);
    }

    public List<DomainEvent> pullEvents() {
        var copy = List.copyOf(events);
        events.clear();
        return copy;
    }
}

// ── Driver Aggregate Root ──────────────────────────────────

public class Driver {
    private final UUID id;
    private final String name;
    private DriverStatus status;
    private GeoPoint currentLocation;

    public void goOnline() {
        if (status == DriverStatus.ON_TRIP) throw new IllegalStateException("Cannot go online while on trip");
        this.status = DriverStatus.AVAILABLE;
    }

    public void goOffline() {
        if (status == DriverStatus.ON_TRIP) throw new IllegalStateException("Cannot go offline while on trip");
        this.status = DriverStatus.OFFLINE;
    }

    public void startTrip() {
        if (status != DriverStatus.AVAILABLE) throw new IllegalStateException("Driver not available");
        this.status = DriverStatus.ON_TRIP;
    }

    public void endTrip() {
        if (status != DriverStatus.ON_TRIP) throw new IllegalStateException("Not on a trip");
        this.status = DriverStatus.AVAILABLE;
    }

    public void updateLocation(GeoPoint location) {
        this.currentLocation = location; // real-time update
    }
}
```

---

## 💥 Pitfall Section — When Naive Design Breaks

### Pitfall 1: Group Orders (Multiple Customers, One Delivery)

**Naive design:** `Order` has `customerId: UUID` (single customer).  
**New requirement:** "Foodpanda-style shared orders — 3 colleagues from the same office can order from the same restaurant in one delivery."  
**Breaking point:** Schema can only hold one customer per order.

**DDD Prevention:** Replace `customerId` with `List<OrderParticipant>` from the start — where `OrderParticipant(customerId, items, share)` allows infinite customers per order.

---

### Pitfall 2: Multi-Leg Deliveries

**Naive design:** `Order` has `driverId: UUID` (single driver).  
**New requirement:** "Long-distance orders where a relay driver hands off to another at a hub."  
**Breaking point:** Single `driverId` cannot track a handoff chain.

**DDD Prevention:** Extract `DeliveryLeg(legId, orderId, driverId, startPoint, endPoint, status)` from the start — an order can have multiple legs.

---

### Pitfall 3: Pay-After-Delivery

**Naive design:** `Payment` is created at order placement.  
**New requirement:** "Cash on Delivery — payment is collected after delivery, not before."  
**Breaking point:** `Payment.status = INITIATED` at placement breaks because for COD, no payment is initiated until delivery.

**DDD Prevention:** `Payment` should be linked to `Order` but created lazily — only when payment actually initiates. The payment method determines when the `Payment` aggregate is created.

---

## 🔴 Erklärung: Common Entity Design Mistakes

| Mistake | Why It's Wrong | The Fix |
|---|---|---|
| `Order` stores `List<MenuItem>` directly | Cross-aggregate reference; menu prices can change after order | Store `List<OrderLine>` (immutable snapshot with name + price at time of order) |
| Single `User` entity for Customer and Driver | Different domains, different lifecycle, different invariants | Separate `Customer` and `Driver` aggregates in separate bounded contexts |
| `Order` directly references `Restaurant` object | Cross-aggregate direct reference — breaks independent deployability | Store `restaurantId: UUID` only; load restaurant via its own service |
| Status stored as plain String `"PLACED"` | No compile-time safety; typos cause bugs | Use `enum OrderStatus { PLACED, ACCEPTED, PREPARING, READY, PICKED_UP, DELIVERED, CANCELLED }` |
| Mutable `OrderLine` inside Order | Total can be tampered after placement | `OrderLine` as an immutable record — set at creation, never changed |

---

[← Back to Semester 2 Guide](../../00_CURRICULUM/SEMESTER_2_GUIDE.md) | [DDD Reference →](../../10_Enterprise_Systems/01c_Domain_Driven_Entity_Design.md)
