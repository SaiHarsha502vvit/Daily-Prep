# 🏗️ Part 1: User Flow Design

> **Navigation**: [← Complete Understanding of Flows](01_complete_understanding_of_flows.md) | [Chapter overview](../04_User_System_Flows.md) | [Creating Flows for New Features →](03_creating_flows_for_new_features.md)
> Page 2 of 4 in **Understanding User Flows & System Flows**


## What is User Flow?

### User flow fundamentals

**Definition.** A user flow is the path a user takes through your application to complete a goal.

**Components**

1. **Entry point:** where the user starts (homepage, link, notification).
2. **Steps:** actions the user takes (click, type, swipe).
3. **Decisions:** points where the user chooses (log in or register).
4. **Exit point:** where the user ends (success page, logout).

**Simple example: login**

```mermaid
flowchart LR
  A["Visit website"] --> B["Login page"] --> C["Enter credentials"] --> D["Submit"]
  D -->|valid| E["Success! Dashboard"]
  D -->|invalid| F["Invalid credentials"] --> G["Show error, try again"]
  G --> B
```

**How to read this diagram.** The happy path runs left to right; a failed submit shows an error and returns to the login page.

## Flow Notation Symbols

### Standard flow symbols

| Symbol | Meaning | Notes |
| --- | --- | --- |
| Rectangle | Screen, page or state | A UI screen or application state |
| Diamond | Decision point | The user makes a choice or the system checks a condition |
| Arrow | Flow direction | Shows the path of movement |
| Oval | Start or end | Entry or exit of the flow |
| Bracket or process box | Action or process | Something happens (API call, calculation) |
| Double line | Parallel process | Several things happen simultaneously |
| Dashed arrow | Optional or conditional path | May or may not happen |

## Complete User Flow Example: E-commerce Checkout

### E-commerce checkout user flow

```mermaid
flowchart TD
  S(["Start: user has items in cart"]) --> CS["Cart summary page<br/>view items, update quantities, apply coupon"]
  CS --> Q{"Logged in?"}
  Q -->|Yes| SA["Use saved address"]
  Q -->|"No: guest checkout"| EA["Enter shipping address"]
  SA --> SM["Shipping method<br/>standard (5 days), express (2 days), overnight"]
  EA --> SM
  SM --> PM["Payment method<br/>credit card, PayPal, Apple Pay"]
  PM --> OR["Order review<br/>items summary, total with tax, shipping cost"]
  OR --> PS{"Payment successful?"}
  PS -->|Yes| CF["Confirmation page<br/>order number, ETA, email sent"]
  PS -->|No| ER["Error message<br/>retry or change payment method"]
  ER --> PM
  CF --> E(["End: order placed"])
```

**How to read this diagram.** Two branches rejoin: logged-in users reuse a saved address while guests enter one. A failed payment loops back to the payment step instead of losing the cart.

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

### User registration data flow

```mermaid
sequenceDiagram
  participant U as User (input)
  participant F as Frontend (validation)
  participant B as Backend (process)
  participant D as Database (store)
  U->>F: form data {name: "John", email: "j@e.c", password: "123"}
  F->>F: validate: email format OK, password 8+ characters FAILS
  F-->>U: error: password too short
  U->>F: fixed password "SecurePass123"
  F->>F: all valid
  F->>B: submit
  B->>B: check email exists, hash password, generate ID
  B->>D: INSERT user {id: uuid, name, email, pwd_hash}
  D-->>B: success
  B-->>F: user created, response {id, name}
  F-->>U: success
```

**How to read this diagram.** Validation fails fast in the frontend. Only a valid request reaches the backend, which hashes the password and stores the record. The response contains only safe fields (`id`, `name`).

**Data transformations**

| Stage | Data format | Transformation |
| --- | --- | --- |
| User input | Form fields (strings) | None |
| Frontend validation | JSON object | Trim, type check |
| API request | JSON over HTTPS | Serialise to JSON |
| Backend validation | Request DTO | Deserialise, validate |
| Processing | Domain object | Hash password, generate ID |
| Database | SQL or document | ORM mapping |
| Response | Response DTO | Strip sensitive fields |
| Frontend | JSON | Display formatting |

---

## PART 3: SYSTEM FLOW (Request Flow)

### How a Request Flows Through a Modern System

### Complete request flow in a modern system

Request: `GET /api/products/123`

```mermaid
flowchart TD
  U["User (browser)"] -->|"1. HTTP request"| DNS["DNS<br/>2. resolve domain to IP"]
  DNS --> CDN["CDN<br/>3. check cache (static assets)"]
  CDN -->|cache miss| LB["Load balancer<br/>4. route to an available server"]
  LB --> S1["Server 1"]
  LB --> S2["Server 2"]
  LB --> S3["Server 3"]
  S1 -->|"5. hit API gateway"| GW["API gateway<br/>auth check, rate limit, logging"]
  GW -->|"6. route to service"| PS["Product service<br/>business logic"]
  PS -->|"7. check cache first"| RC[("Cache (Redis)")]
  PS -->|"on a miss"| DB[("Database (Postgres)")]
  RC -->|hit| RESP["Response {id: 123, name: ...}<br/>8. format and return"]
  DB --> RESP
  RESP -->|"reverse path back to user"| U2["User<br/>9. receives JSON response"]
```

**How to read this diagram.** The numbers follow the request. The CDN answers static assets without touching the origin; dynamic requests go through the load balancer and gateway to the service, which reads from Redis first and falls back to the database.

---

[← Complete Understanding of Flows](01_complete_understanding_of_flows.md) | [Chapter overview](../04_User_System_Flows.md) | [Creating Flows for New Features →](03_creating_flows_for_new_features.md)
