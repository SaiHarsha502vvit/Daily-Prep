# 🏗️ Part 1: User Flow Design

> **Navigation**: [← Complete Understanding of Flows](01_complete_understanding_of_flows.md) | [Chapter overview](../04_User_System_Flows.md) | [Creating Flows for New Features →](03_creating_flows_for_new_features.md)
> Page 2 of 4 in **Understanding User Flows & System Flows**


## What is User Flow?

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         USER FLOW FUNDAMENTALS                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

DEFINITION:
User Flow = The path a user takes through your application to complete a goal

COMPONENTS:
1. ENTRY POINT: Where user starts (homepage, link, notification)
2. STEPS: Actions user takes (click, type, swipe)
3. DECISIONS: Points where user chooses (login vs register)
4. EXIT POINT: Where user ends (success page, logout)

SIMPLE USER FLOW EXAMPLE - LOGIN:

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌──────────┐     ┌───────────────┐     ┌────────────┐     ┌──────────┐    │
│   │  Visit   │────▶│  Login Page   │────▶│  Enter     │────▶│  Submit  │    │
│   │  Website │     │               │     │  Credentials│    │          │    │
│   └──────────┘     └───────────────┘     └────────────┘     └────┬─────┘    │
│                                                                   │         │
│                           ┌───────────────────────────────────────┤         │
│                           ▼                                       ▼         │
│                    ┌──────────────┐                        ┌──────────────┐ │
│                    │   Invalid    │                        │   Success!   │ │
│                    │  Credentials │                        │  Dashboard   │ │
│                    └──────┬───────┘                        └──────────────┘ │
│                           │                                                 │
│                           ▼                                                 │
│                    ┌──────────────┐                                         │
│                    │  Show Error  │──────▶ Back to Login                    │
│                    │  Try Again   │                                         │
│                    └──────────────┘                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Flow Notation Symbols

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         STANDARD FLOW SYMBOLS                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ SYMBOL                    │ MEANING                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌──────────────┐          RECTANGLE: Screen/Page/State                      │
│ │              │          A UI screen or application state                  │
│ └──────────────┘                                                            │
│                                                                             │
│ ◇                         DIAMOND: Decision Point                           │
│ / \                       User makes a choice or system checks condition    │
│                                                                             │
│ ────────────▶             ARROW: Flow Direction                             │
│                           Shows the path of movement                        │
│                                                                             │
│ (  )                      OVAL: Start/End Points                            │
│                           Entry or exit of the flow                         │
│                                                                             │
│ [ ]                       BRACKET: Action/Process                           │
│                           Something happens (API call, calculation)         │
│                                                                             │
│ ═══════════════           DOUBLE LINE: Parallel Process                     │
│                           Multiple things happen simultaneously             │
│                                                                             │
│ - - - - - - - ▶           DASHED ARROW: Optional/Conditional Path           │
│                           May or may not happen                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Complete User Flow Example: E-commerce Checkout

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    E-COMMERCE CHECKOUT USER FLOW                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

    (Start: User has items in cart)
                │
                ▼
    ┌───────────────────────┐
    │   Cart Summary Page   │
    │   - View items        │
    │   - Update quantities │
    │   - Apply coupon      │
    └───────────┬───────────┘
                │
                ▼
         ◇─────────────────◇
        /                   \
    [Logged In?]      [Guest Checkout?]
        │                   │
        │YES                │YES
        ▼                   ▼
    ┌─────────────┐   ┌─────────────────┐
    │ Use saved   │   │ Enter shipping  │
    │ address     │   │ address         │
    └──────┬──────┘   └────────┬────────┘
           │                   │
           └────────┬──────────┘
                    │
                    ▼
    ┌───────────────────────┐
    │  Shipping Method      │
    │  - Standard (5 days)  │
    │  - Express (2 days)   │
    │  - Overnight          │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │   Payment Method      │
    │   - Credit Card       │
    │   - PayPal            │
    │   - Apple Pay         │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │   Order Review        │
    │   - Items summary     │
    │   - Total with tax    │
    │   - Shipping cost     │
    └───────────┬───────────┘
                │
                ▼
         ◇─────────────────────◇
        / \                   / \
    [Payment Success?]   [Payment Failed?]
        │                     │
        │YES                  │
        ▼                     ▼
    ┌─────────────┐    ┌─────────────────┐
    │ Confirmation│    │ Error Message   │
    │ Page        │    │ Retry or change │
    │ - Order #   │    │ payment method  │
    │ - ETA       │    └────────┬────────┘
    │ - Email sent│             │
    └─────────────┘             │
                                │
    (End: Order Placed)    Back to Payment
```

---

## 🏗️ Part 2: Data Flow Design

### Understanding Data Flow

DATA FLOW FUNDAMENTALS

DEFINITION:
Data Flow = How data moves through and transforms in your system

KEY QUESTIONS:
• Where does data come from? (Source)
• What happens to it? (Transform)
• Where does it go? (Destination)
• What form does it take? (Format)

DATA FLOW TYPES:

1. INPUT FLOW (Data entering system)
   User Input → Validation → Sanitization → Processing

2. PROCESSING FLOW (Data being transformed)
   Raw Data → Transform → Aggregate → Calculate → Result

3. OUTPUT FLOW (Data leaving system)
   Result → Format → Response → Delivery

4. STORAGE FLOW (Data being persisted)
   Data → Validate → Transform → Store → Index

### Data Flow Example: User Registration

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    USER REGISTRATION DATA FLOW                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌───────────┐    ┌────────────────┐    ┌──────────────┐    ┌───────────┐   │
│  │   USER    │    │    FRONTEND    │    │    BACKEND   │    │  DATABASE │   │
│  │  (Input)  │    │  (Validation)  │    │  (Process)   │    │  (Store)  │   │
│  └─────┬─────┘    └────────┬───────┘    └──────┬───────┘    └─────┬─────┘   │
│        │                   │                   │                  │         │
│        │  Form Data        │                   │                  │         │
│        │  {                │                   │                  │         │
│        │   name: "John",   │                   │                  │         │
│        │   email: "j@e.c", │                   │                  │         │
│        │   password: "123" │                   │                  │         │
│        │  }                │                   │                  │         │
│        │──────────────────▶│                   │                  │         │
│        │                   │                   │                  │         │
│        │                   │  VALIDATE:        │                  │         │
│        │                   │  - Email format ✓ │                  │         │
│        │                   │  - Password 8+ ✗  │                  │         │
│        │                   │                   │                  │         │
│        │  Error: Password  │                   │                  │         │
│        │◀──too short──────│                   │                  │          │
│        │                   │                   │                  │         │
│        │  Fixed password:  │                   │                  │         │
│        │  "SecurePass123"  │                   │                  │         │
│        │──────────────────▶│                   │                  │         │
│        │                   │                   │                  │         │
│        │                   │  All valid ✓      │                  │         │
│        │                   │──────────────────▶│                  │         │
│        │                   │                   │                  │         │
│        │                   │                   │  PROCESS:        │         │
│        │                   │                   │  1. Check if     │         │
│        │                   │                   │     email exists │         │
│        │                   │                   │  2. Hash password│         │
│        │                   │                   │  3. Generate ID  │         │
│        │                   │                   │──────────────────▶         │
│        │                   │                   │                  │         │
│        │                   │                   │  INSERT user     │         │
│        │                   │                   │  {               │         │
│        │                   │                   │   id: "uuid",    │         │
│        │                   │                   │   name: "John",  │         │
│        │                   │                   │   email: "j@e.c",│         │
│        │                   │                   │   pwd_hash: "..."│         │
│        │                   │                   │  }               │         │
│        │                   │                   │◀─────────────────│         │
│        │                   │                   │  Success         │         │
│        │                   │◀──────────────────│                  │         │
│        │                   │  User created     │                  │         │
│        │◀──────────────────│  Response:        │                  │         │
│        │  Success!         │  { id, name }     │                  │         │
│        │                   │                   │                  │         │
└─────────────────────────────────────────────────────────────────────────────┘

DATA TRANSFORMATIONS:
┌────────────────────────────────────────────────────────────────────────────┐
│ STAGE           │ DATA FORMAT                  │ TRANSFORMATION            │
├────────────────────────────────────────────────────────────────────────────┤
│ User Input      │ Form fields (strings)        │ None                      │
│ Frontend Valid. │ JSON object                  │ Trim, type check          │
│ API Request     │ JSON over HTTPS              │ Serialize to JSON         │
│ Backend Valid.  │ Request DTO                  │ Deserialize, validate     │
│ Processing      │ Domain object                │ Hash password, generate ID│
│ Database        │ SQL/Document                 │ ORM mapping               │
│ Response        │ Response DTO                 │ Strip sensitive fields    │
│ Frontend        │ JSON                         │ Display formatting        │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 3: SYSTEM FLOW (Request Flow)

### How a Request Flows Through a Modern System

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    COMPLETE REQUEST FLOW IN MODERN SYSTEM                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

USER REQUEST: GET /api/products/123

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                               ┌─────────┐                                   │
│                               │  USER   │                                   │
│                               │ Browser │                                   │
│                               └────┬────┘                                   │
│                                    │ 1. HTTP Request                        │
│                                    ▼                                        │
│                              ┌───────────┐                                  │
│                              │    DNS    │ 2. Resolve domain to IP          │
│                              └─────┬─────┘                                  │
│                                    │                                        │
│                                    ▼                                        │
│                              ┌───────────┐                                  │
│                              │    CDN    │ 3. Check cache (static assets)   │
│                              └─────┬─────┘                                  │
│                                    │ Cache Miss                             │
│                                    ▼                                        │
│                           ┌───────────────┐                                 │
│                           │ LOAD BALANCER │ 4. Route to available server    │
│                           └───────┬───────┘                                 │
│                                   │                                         │
│                    ┌──────────────┼──────────────┐                          │
│                    ▼              ▼              ▼                          │
│              ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│              │ Server 1 │  │ Server 2 │  │ Server 3 │                       │
│              └────┬─────┘  └──────────┘  └──────────┘                       │
│                   │                                                         │
│                   ▼ 5. Hit API Gateway                                      │
│            ┌──────────────┐                                                 │
│            │  API GATEWAY │                                                 │
│            │ - Auth check │                                                 │
│            │ - Rate limit │                                                 │
│            │ - Logging    │                                                 │
│            └──────┬───────┘                                                 │
│                   │                                                         │
│                   ▼ 6. Route to service                                     │
│            ┌───────────────┐                                                │
│            │ PRODUCT       │                                                │
│            │ SERVICE       │                                                │
│            │               │                                                │
│            │ - Business    │                                                │
│            │   logic       │                                                │
│            └───────┬───────┘                                                │
│                    │                                                        │
│          ┌────────┴────────┐                                                │
│          │                 │                                                │
│          ▼                 ▼                                                │
│    ┌──────────┐      ┌──────────┐                                           │
│    │  CACHE   │      │ DATABASE │ 7. Check cache first, then DB             │
│    │ (Redis)  │      │(Postgres)│                                           │
│    └────┬─────┘      └────┬─────┘                                           │
│         │ Cache Hit       │ Cache Miss                                      │
│         │                 │                                                 │
│         └────────┬────────┘                                                 │
│                  │                                                          │
│                  ▼                                                          │
│            ┌───────────────┐                                                │
│            │   RESPONSE    │ 8. Format and return                           │
│            │   {           │                                                │
│            │     id: 123,  │                                                │
│            │     name: ... │                                                │
│            │   }           │                                                │
│            └───────────────┘                                                │
│                  │                                                          │
│                  │ Reverse path back to user                                │
│                  ▼                                                          │
│             ┌─────────┐                                                     │
│             │  USER   │ 9. Receives JSON response                           │
│             └─────────┘                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

[← Complete Understanding of Flows](01_complete_understanding_of_flows.md) | [Chapter overview](../04_User_System_Flows.md) | [Creating Flows for New Features →](03_creating_flows_for_new_features.md)
