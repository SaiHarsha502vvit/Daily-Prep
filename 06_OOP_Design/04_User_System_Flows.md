**Navigation**: [< Previous](03_System_Design.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](05_SD_Interview_Problems.md)

# 🔄 Understanding User Flows & System Flows

## Complete Guide: From Concept to Implementation

---

# 📚 Part 0: Complete Understanding of Flows

## What Are Flows?

Flows are the PATHS that something takes through a system.
They show HOW things move from start to finish.

**Types Of Flows**:

1. USER FLOW (UX Flow)
   Path a USER takes to complete a task in your application
   Example: Login → Dashboard → Profile → Edit → Save
2. DATA FLOW
   Path DATA takes through your system
   Example: Form → Validation → API → Database → Response
3. CONTROL FLOW
   Path of EXECUTION in your code
   Example: if-else, loops, function calls
4. SYSTEM FLOW
   Path a REQUEST takes through multiple services
   Example: Client → Load Balancer → API Gateway → Services → DB
5. BUSINESS FLOW (Process Flow)
   Path a BUSINESS PROCESS takes
   Example: Order → Payment → Inventory → Shipping → Delivery

💡 **ANALOGY: City Roads**
USER FLOW = The route a person takes (Home → Work → Gym → Home)
DATA FLOW = The route packages take (Warehouse → Truck → Store → You)
SYSTEM FLOW = The city's infrastructure (Roads, Traffic lights, Signs)
CONTROL FLOW = Traffic rules (Stop signs, One-ways, Speed limits)

## What Problem Do Flows Solve

**Without Understanding Flows**:

- "I don't know what happens when user clicks this button"
- "The data disappears somewhere in the system"
- "I fixed one thing, but broke five others"
- "The feature works in my head, but I can't explain it"

**With Understanding Flows**:

- "Click triggers X, which updates Y, which notifies Z"
- "Data goes: UI → Validation → Transform → Store → Confirm"
- "Change here affects these 3 specific places"
- "Here's the complete flow diagram of the feature"
  REAL-WORLD PROBLEMS FLOWS SOLVE:
- Bug Tracking: "Where did this break?"
- Onboarding: "How does this system work?"
- Feature Planning: "What do we need to build?"
- Performance: "Where is the bottleneck?"
- Security: "Where is data exposed?"

## Why Learn Flow Design

1. CLARITY OF THOUGHT:
   Before code: "I think I know what to build"
   After flow design: "I know EXACTLY what to build"
2. COMMUNICATION:

- Explain complex systems to non-technical stakeholders
- Align team on implementation approach
- Document for future developers

3. BETTER ARCHITECTURE:

- See the big picture before coding
- Identify potential problems early
- Design scalable solutions

4. DEBUGGING SUPERPOWER:

- Trace issues systematically
- Understand side effects of changes
- Find root causes faster

5. INTERVIEW SUCCESS:

- System design interviews require flow thinking
- Shows architectural mindset
- Demonstrates senior-level thinking

🔬 **Section Challenge — Why Learn Flow Design**

**Challenge 1 (Reasoning — Who/When/What):** A production bug occurs: users report seeing "Payment Failed" but money was deducted. Without a flow diagram, how would you debug this? With a data flow diagram showing User → Frontend → Payment Gateway → Order Service → DB, how does your debugging approach change? **Who** failed, **when** in the sequence, and **what** was the state at that point?

<details><summary>Answer</summary>

**Without flow:** Random guessing. Check logs everywhere. Hours of trial-and-error. "Maybe the payment gateway?" "Maybe the database?" No systematic approach. **With flow:** Trace the exact path: (1) User submitted → OK. (2) Frontend called Payment Gateway → **Who responded?** Gateway returned 200 (success). (3) Gateway called Order Service callback → **When did it happen?** After payment confirmed. (4) Order Service wrote to DB → **What state?** The callback failed or timed out → DB never updated to "PAID" → UI shows "Failed." The bug is at step 3→4: the callback handler. Flow diagrams turn "something is broken" into "step 3→4 failed" — this is the debugging superpower.

</details>

## When To Create Flow Diagrams

- ✅ ALWAYS CREATE WHEN:
- Starting a new feature
- Onboarding to new codebase
- Debugging complex issues
- Planning system changes
- Writing technical documentation
- Conducting system design interviews
  ⚠️ OPTIONAL WHEN:
- Very simple CRUD operations
- Quick bug fixes (though still helpful!)
- Prototype/throwaway code

**Pro Tip**: When in doubt, draw the flow!
5 minutes drawing saves hours of confusion.

## Historical Evolution Of Flow Design

1920s: PROCESS FLOW CHARTS

- Industrial engineering for manufacturing
- Frank and Lillian Gilbreth introduced flow process charts
  1960s: SOFTWARE FLOWCHARTS
- Adapted for programming
- Became standard in software documentation
  1990s: UML DIAGRAMS
- Sequence diagrams, activity diagrams
- Standardized notation for software
  2000s: USER EXPERIENCE FLOWS
- Rise of UX design profession
- Focus on user journey mapping
  2010s: MICROSERVICES & DISTRIBUTED FLOWS
- System flows became more complex
- Tools like Mermaid, PlantUML emerged

**Today**: AI-ASSISTED FLOW GENERATION

- Tools that auto-generate flows from code
- Visual IDEs for flow-based programming

🔬 **Section Challenge — Historical Evolution Of Flow Design**

**Challenge 1 (Reasoning):** The evolution shows 1990s UML → 2010s Microservices → Distributed Flows. Why did microservices make flow design MORE critical, not less? What specifically changed about the "flow" when a monolith was split into services?

<details><summary>Answer</summary>

In a monolith, the flow is IN-PROCESS: method calls within the same JVM. A stack trace shows the entire flow. When split into microservices: (1) **Who** changed — each step is now an independent service, potentially on different machines. (2) **When** changed — calls are now network calls with latency, timeouts, retries. A single user action may trigger 5+ service-to-service hops. (3) **What can fail** exploded — network partitions, service outages, message queue delays, partial failures. Without flow diagrams, nobody can trace a request across 5 services. With them, you can pinpoint exactly where a request stalled. This is why tools like Jaeger (distributed tracing) exist — they auto-generate flow diagrams from runtime data.

</details>

## ⭐ Growth Mindset: From Flow Reader To Flow Creator ⭐

LEVEL 1 - READER:
"I can understand flow diagrams when someone shows me"
LEVEL 2 - TRACER:
"I can trace through existing code and create flow diagrams"
LEVEL 3 - PLANNER:
"I design flows BEFORE writing code"
LEVEL 4 - OPTIMIZER:
"I can look at flows and identify improvements"
LEVEL 5 - ARCHITECT:
"I design flows for entire systems with multiple services"
THE CREATOR'S QUESTION:
"How would I design a flow for a feature that doesn't exist yet?"
Example: "Design the flow for a new 'Split Bill' feature in a payment app"

- What inputs are needed?
- What validations are required?
- What happens at each step?
- What errors can occur?
- How does it integrate with existing features?

---

# 🏗️ Part 1: User Flow Design

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

# 🏗️ Part 2: Data Flow Design

## Understanding Data Flow

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

## Data Flow Example: User Registration

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

# PART 3: SYSTEM FLOW (Request Flow)

## How a Request Flows Through a Modern System

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

# 📌 Part 4: Creating Flows for New Features

## Step-by-Step Feature Flow Creation

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    HOW TO CREATE A FLOW FOR ANY FEATURE                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

STEP 1: IDENTIFY THE GOAL
┌─────────────────────────────────────────────────────────────────────────────┐
│ Ask: "What is the user trying to achieve?"                                  │
│                                                                             │
│ Example: "User wants to share a post to multiple social media platforms"    │
│                                                                             │
│ • Primary Goal: Share content                                               │
│ • Success Criteria: Post appears on selected platforms                      │
│ • Failure Criteria: User is informed of what failed and why                 │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 2: IDENTIFY ALL ACTORS
┌─────────────────────────────────────────────────────────────────────────────┐
│ Ask: "Who/What is involved in this flow?"                                   │
│                                                                             │
│ Example:                                                                    │
│ • User (starts the action)                                                  │
│ • Frontend (UI)                                                             │
│ • Backend API                                                               │
│ • External APIs (Twitter, Facebook, LinkedIn)                               │
│ • Database (logging, history)                                               │
│ • Message Queue (async processing)                                          │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 3: MAP THE HAPPY PATH
┌─────────────────────────────────────────────────────────────────────────────┐
│ Ask: "What happens when everything works perfectly?"                        │
│                                                                             │
│ Example Happy Path:                                                         │
│ 1. User clicks "Share" button                                               │
│ 2. Modal opens with platform options                                        │
│ 3. User selects Twitter, LinkedIn                                           │
│ 4. User clicks "Share Now"                                                  │
│ 5. Request goes to backend                                                  │
│ 6. Backend posts to both platforms                                          │
│ 7. Both succeed                                                             │
│ 8. User sees "Shared successfully!"                                         │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 4: IDENTIFY ERROR CASES
┌─────────────────────────────────────────────────────────────────────────────┐
│ Ask: "What could go wrong?"                                                 │
│                                                                             │
│ Example Error Cases:                                                        │
│ • User not connected to platform                                            │
│ • Platform API is down                                                      │
│ • Content exceeds character limit                                           │
│ • Network timeout                                                           │
│ • Rate limit exceeded                                                       │
│ • Partial failure (Twitter works, LinkedIn fails)                           │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 5: DRAW THE COMPLETE FLOW
```

## Complete Feature Flow Example: Social Share

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SOCIAL SHARE FEATURE - COMPLETE FLOW                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    (Start: User on content page)                                            │
│                │                                                            │
│                ▼                                                            │
│    ┌───────────────────────┐                                                │
│    │   Click Share Button  │                                                │
│    └───────────┬───────────┘                                                │
│                │                                                            │
│                ▼                                                            │
│    ┌───────────────────────┐                                                │
│    │   Load Connected      │                                                │
│    │   Accounts            │──────────▶ [API: GET /user/connections]        │
│    └───────────┬───────────┘                                                │
│                │                                                            │
│         ┌──────┴──────┐                                                     │
│         ▼             ▼                                                     │
│    ◇ Has accounts?                                                          │
│    │NO              │YES                                                    │
│    ▼                ▼                                                       │
│ ┌─────────────┐ ┌─────────────────────┐                                     │
│ │ Show        │ │ Show Platform       │                                     │
│ │ "Connect    │ │ Selection Modal     │                                     │
│ │  Account"   │ │ □ Twitter (✓conn)   │                                     │
│ │  Prompt     │ │ □ LinkedIn (✓conn)  │                                     │
│ └──────┬──────┘ │ □ Facebook (✗)      │                                     │
│        │        └───────────┬─────────┘                                     │
│        │                    │                                               │
│        │                    ▼                                               │
│        │        ┌───────────────────────┐                                   │
│        │        │ User Selects          │                                   │
│        │        │ Twitter + LinkedIn    │                                   │
│        │        └───────────┬───────────┘                                   │
│        │                    │                                               │
│        │                    ▼                                               │
│        │        ┌───────────────────────┐                                   │
│        │        │ Validate Content      │                                   │
│        │        │ - Check length        │                                   │
│        │        │ - Check attachments   │                                   │
│        │        └───────────┬───────────┘                                   │
│        │                    │                                               │
│        │             ◇──────┴──────◇                                        │
│        │         Valid?         Invalid?                                    │
│        │            │               │                                       │
│        │            ▼               ▼                                       │
│        │    ┌─────────────┐  ┌─────────────┐                                │
│        │    │ Click Share │  │ Show Error  │                                │
│        │    │ Confirm     │  │ "Too long   │                                │
│        │    └──────┬──────┘  │  for Twitter│                                │
│        │           │         └──────┬──────┘                                │
│        │           │                │                                       │
│        │           │                ▼                                       │
│        │           │         ┌─────────────┐                                │
│        │           │         │ Allow Edit  │                                │
│        │           │         └──────┬──────┘                                │
│        │           │                │                                       │
│        │           ◀────────────────┘                                       │
│        │           │                                                        │
│        │           ▼                                                        │
│        │    [API: POST /share]                                              │
│        │           │                                                        │
│        │           ▼                                                        │
│        │    ┌───────────────────────┐                                       │
│        │    │   BACKEND PROCESSING  │                                       │
│        │    │                       │                                       │
│        │    │  ┌─────────────────┐  │                                       │
│        │    │  │ Queue jobs for  │  │                                       │
│        │    │  │ each platform   │  │                                       │
│        │    │  └────────┬────────┘  │                                       │
│        │    │           │           │                                       │
│        │    │     ┌─────┴─────┐     │                                       │
│        │    │     ▼           ▼     │                                       │
│        │    │  ┌───────┐  ┌───────┐ │                                       │
│        │    │  │Twitter│  │LinkedIn│ │                                      │
│        │    │  │ API   │  │  API  │ │                                       │
│        │    │  └───┬───┘  └───┬───┘ │                                       │
│        │    │      │          │     │                                       │
│        │    └──────┼──────────┼─────┘                                       │
│        │           │          │                                             │
│        │      ◇────┴────◇  ◇──┴───◇                                         │
│        │    Success  Fail  Success Fail                                     │
│        │       │       │      │      │                                      │
│        │       └───┬───┘      └──┬───┘                                      │
│        │           │             │                                          │
│        │           └──────┬──────┘                                          │
│        │                  │                                                 │
│        │                  ▼                                                 │
│        │    ┌───────────────────────┐                                       │
│        │    │   Aggregate Results   │                                       │
│        │    │   - Twitter: ✓        │                                       │
│        │    │   - LinkedIn: ✗       │                                       │
│        │    └───────────┬───────────┘                                       │
│        │                │                                                   │
│        │         ┌──────┴──────┐                                            │
│        │         ▼             ▼                                            │
│        │    ALL SUCCESS   PARTIAL/FAIL                                      │
│        │         │             │                                            │
│        │         ▼             ▼                                            │
│        │    ┌─────────┐  ┌─────────────┐                                    │
│        │    │ "Shared │  │ "Shared to  │                                    │
│        │    │  to all │  │  Twitter.   │                                    │
│        │    │  !"     │  │  LinkedIn   │                                    │
│        │    └─────────┘  │  failed:    │                                    │
│        │                 │  [Reason]"  │                                    │
│        │                 │  [Retry]    │                                    │
│        │                 └─────────────┘                                    │
│        │                                                                    │
│    (End: User informed of result)                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 🏗️ Part 5: Flow Design in Code

## Translating Flow to Code Structure

```java
// FEATURE: Social Share
// Following the flow diagram above

public class SocialShareService {

    // Step 1: Get connected accounts (from flow)
    public List<ConnectedAccount> getConnectedAccounts(String userId) {
        return accountRepository.findByUserId(userId);
    }

    // Step 2: Validate content for each platform
    public ValidationResult validateContent(ShareRequest request) {
        List<ValidationError> errors = new ArrayList<>();

        for (Platform platform : request.getPlatforms()) {
            if (platform == Platform.TWITTER && request.getContent().length() > 280) {
                errors.add(new ValidationError(platform, "Content too long for Twitter"));
            }
            // More validations...
        }

        return new ValidationResult(errors.isEmpty(), errors);
    }

    // Step 3: Execute share (following the flow)
    public ShareResult share(ShareRequest request) {
        // Validate first (as per flow)
        ValidationResult validation = validateContent(request);
        if (!validation.isValid()) {
            return ShareResult.validationFailed(validation.getErrors());
        }

        // Queue jobs for each platform (parallel processing from flow)
        Map<Platform, CompletableFuture<PlatformResult>> futures = new HashMap<>();

        for (Platform platform : request.getPlatforms()) {
            futures.put(platform,
                CompletableFuture.supplyAsync(() ->
                    shareToplatform(platform, request.getContent())
                )
            );
        }

        // Aggregate results (as per flow)
        Map<Platform, PlatformResult> results = new HashMap<>();
        for (Map.Entry<Platform, CompletableFuture<PlatformResult>> entry : futures.entrySet()) {
            try {
                results.put(entry.getKey(), entry.getValue().get());
            } catch (Exception e) {
                results.put(entry.getKey(), PlatformResult.failed(e.getMessage()));
            }
        }

        return ShareResult.completed(results);
    }

    // Platform-specific sharing
    private PlatformResult shareToPlatform(Platform platform, String content) {
        try {
            switch (platform) {
                case TWITTER:
                    return twitterClient.post(content);
                case LINKEDIN:
                    return linkedInClient.post(content);
                default:
                    return PlatformResult.failed("Unsupported platform");
            }
        } catch (ApiException e) {
            return PlatformResult.failed(e.getMessage());
        }
    }
}
```

---

# 💪 Part 6: Flow Practice Exercises

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         FLOW DESIGN EXERCISES                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

EXERCISE 1: Password Reset Flow
Design the complete user flow for "Forgot Password" feature.
Include: Email input, verification, new password creation, error cases

EXERCISE 2: File Upload Flow
Design the data flow for uploading a large file with progress tracking.
Include: Chunking, progress updates, retry on failure, virus scan

EXERCISE 3: Real-time Chat Flow
Design the system flow for sending a message in a chat application.
Include: WebSocket, message delivery, read receipts, offline handling

EXERCISE 4: Shopping Cart Sync Flow
Design the data flow for syncing shopping cart across devices.
Include: Local storage, server sync, conflict resolution

EXERCISE 5: Two-Factor Authentication Flow
Design the complete flow for enabling and using 2FA.
Include: Setup, QR code, backup codes, login with 2FA

EXERCISE 6: Payment Processing Flow
Design the complete system flow for processing a payment.
Include: Validation, fraud check, payment gateway, retry, refund path

For each exercise:
1. Identify the goal
2. List all actors
3. Draw the happy path
4. Add error cases
5. Add data transformations
6. Consider edge cases
```

---

# 🏗️ Quick Reference: Flow Design Checklist

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    FLOW DESIGN CHECKLIST                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

□ Clear START and END points
□ All decision points marked (diamonds)
□ Happy path clearly visible
□ Error paths included
□ All actors/systems identified
□ Data formats at each stage
□ Async operations marked
□ Retry/rollback paths shown
□ Edge cases considered
□ Timing/timeout handling
□ Security checkpoints
□ Logging/monitoring points
```

---

## PLUS Enhancements

### Crystal-Clear Diagrams

#### 1. End-to-End Payment Flow Sequence

```
   ┌──────┐         ┌──────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ User │         │ Frontend │      │  Order  │      │ Payment │      │   Bank  │
   │      │         │ (React)  │      │ Service │      │ Gateway │      │   API   │
   └──┬───┘         └────┬─────┘      └────┬────┘      └────┬────┘      └────┬────┘
      │ 1. Click "Pay"    │                 │                │                │
      │───────────────────▶                 │                │                │
      │                  │ 2. POST /orders  │                │                │
      │                  │──────────────────▶                │                │
      │                  │                 │ 3. POST /charge                │
      │                  │                 │───────────────▶                │
      │                  │                 │                │ 4. Verify funds │
      │                  │                 │                │───────────────▶│
      │                  │                 │                │ 5. Auth result │
      │                  │                 │                │◀───────────────│
      │                  │                 │ 6. Charge OK   │                │
      │                  │                 │◀───────────────│                │
      │                  │ 7. Order created│                │                │
      │                  │◀──────────────────                │                │
      │ 8. Show "Success" │                │                │                │
      │◀──────────────────│                │                │                │
      │                  │                 │ 9. Async email │                │
      │                  │                 │──┐             │                │
      │                  │                 │  │ to Email Service            │
      │                  │                 │◀─┘             │                │
```

**Failure mode at step 6**: Bank auth succeeds but Order Service crashes before updating DB → user charged, order never created. **Mitigation**: idempotency key on /charge (Stripe-style) + outbox pattern for the Order DB write.

#### 2. Order State Machine

```
                    ┌──────────────────┐
                    │      Created     │ (Order placed by user)
                    └────────┬─────────┘
                             │ PaymentInitiated
                             ▼
                    ┌──────────────────┐
              ┌────▶│ PendingPayment   │──── (10 min timeout)
              │     └────────┬─────────┘     │
              │              │ PaymentSuccess │
              │              ▼               │
              │     ┌──────────────────┐    │
              │     │       Paid       │    │
              │     └────────┬─────────┘    │
              │              │ ShipmentDispatched
              │              ▼               ▼
              │     ┌──────────────────┐ ┌──────────────────┐
              │     │     Shipped      │ │   Cancelled      │
              │     └────────┬─────────┘ └──────────────────┘
              │              │ DeliveryConfirmed
              │              ▼
              │     ┌──────────────────┐
              │     │    Delivered     │
              │     └────────┬─────────┘
              │              │ RefundRequested (within 30 days)
              └──────────────┘
```

**Invariant**: every transition has exactly ONE trigger event. State changes are append-only in an event log (event sourcing pattern) for auditability.

#### 3. Microservices Flow vs Monolith Flow

```
MONOLITH (in-process stack trace):
┌─────────────────────────────────────┐
│ User → OrderSvc → Payment → DB      │  Total: 1 network call, 1 stack
└─────────────────────────────────────┘

MICROSERVICES (distributed trace):
┌──────┐  ┌─────┐  ┌─────────┐  ┌─────────┐  ┌──────┐  ┌─────────┐
│ User │─▶│ CDN │─▶│  API GW │─▶│  Order  │─▶│ Pay  │─▶│   DB    │
└──────┘  └─────┘  └─────────┘  │ Service │  └──────┘  └─────────┘
                               │         │
                               │ event:  │  Kafka
                               │ order_created
                               ▼
                          ┌─────────┐
                          │  Email  │
                          │ Service │
                          └─────────┘

Total: 5+ network hops, distributed tracing REQUIRED (Jaeger/Zipkin)
```

**Trade-off**: monoliths give free observability (one stack trace shows everything); microservices require explicit observability infrastructure. Microservices pay this cost for team-scale and failure-isolation benefits.

### In-Depth Explanations

#### Mechanism Deep-Dive: Idempotency Keys

**The duplicate-charge problem**: User clicks "Pay", network blips, browser retries. Without idempotency, the user is charged twice.

**The solution**: An `Idempotency-Key` HTTP header (UUID generated client-side) sent with the POST request. The server:

```
1. Receive POST /charge with Idempotency-Key: "abc-123"
2. Check Redis: SETNX "idempotency:abc-123" "in_progress" EX 86400
   ├─ If key exists: return cached response from that key
   └─ If key didn't exist: continue to step 3
3. Process the charge
4. Store response in Redis under "idempotency:abc-123" with TTL 24 hours
5. Return response to client
```

**What happens on retry**: The client retries with the same `Idempotency-Key`. Step 2 sees the key exists, returns the cached response from step 4. **No duplicate charge.**

**Production failure mode**: If you DON'T use idempotency keys, you can lose money. Stripe, AWS, every payment API requires them. Production incident: a major e-commerce site in 2014 double-charged $1.2M during a network blip because they didn't use idempotency keys.

#### Why-This-Not-That: Choreography vs Orchestration

| Aspect | Choreography | Orchestration |
|--------|--------------|---------------|
| **Coordinator** | None (each service listens for events) | Central orchestrator (e.g., Camunda, Netflix Conductor) |
| **Failure handling** | Each service handles its own retries | Orchestrator handles compensation centrally |
| **Visibility** | Distributed (need tracing tools) | Central (one dashboard) |
| **Coupling** | Loose (services don't know about each other) | Tighter (services know they're orchestrated) |
| **Scale** | Better (no single point of failure) | Worse (orchestrator can bottleneck) |
| **When to use** | Simple flows, many independent teams | Complex flows, strict visibility required |

**Rule of thumb**: < 5 services with simple handoffs → choreography. > 5 services or complex compensation → orchestration.

### Breadth Comparisons

#### Saga Compensation Strategies

| Strategy | How It Works | Trade-off | Use Case |
|----------|--------------|-----------|----------|
| **Backward recovery (compensating transactions)** | Each step has a compensating action (e.g., `compensate_payment = refund()`); on failure, run compensations in reverse order | Requires idempotent compensation; some actions cannot be compensated (sending email) | E-commerce, banking (most common) |
| **Forward recovery (pivot transaction)** | When failure detected, execute a different forward path that compensates for the failure | Requires domain knowledge of all failure modes | Limited to predictable failure modes |
| **Hybrid** | Some failures use compensation, others pivot | Most flexible, most complex | Complex business processes |

#### Flow Debugging Tools Comparison

| Tool | Strength | Weakness | Best For |
|------|----------|----------|----------|
| **Jaeger** (Uber) | Strong distributed context propagation, Thrift compact protocol | Steeper learning curve | Microservices, OpenTracing-compatible |
| **Zipkin** (Twitter) | Mature, simple deployment, OpenZipkin ecosystem | Less active development | Quick setup, OSS shops |
| **OpenTelemetry** (CNCF) | Vendor-neutral, future-proof, unified API/SDK | Newer, less ecosystem support | New projects, vendor-portability needed |
| **Datadog APM** | All-in-one with logs/metrics, commercial support | Expensive at scale | Enterprises with budget |
| **Tempo + Grafana** | Cheap, integrates with Prometheus metrics | Requires Grafana stack | Grafana-based observability |

---

**Navigation**: [< Previous](03_System_Design.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](05_SD_Interview_Problems.md)


---

## Reality Check

**"Flows are diagrams; the design is the components"** ? The flow IS where designs break: components look fine in a box diagram until you trace one user action through auth, cache, service, queue, and DB � and discover the race between cache-write and DB-commit, the retry that double-charges, the notification that fires before the transaction lands. Tracing flows end-to-end is the design REVIEW built into the design; skipping it ships whiteboard fiction.

**"The happy path defines the flow"** ? Every arrow in a flow has three shadow arrows: timeout, error response, and duplicate delivery. Professional flow design annotates each hop with its failure behavior � retry (how many, what backoff), fallback (stale cache? default?), or propagate (which error surfaces to the user?). The interview upgrade is doing this UNPROMPTED for the two or three hops that matter: "if the payment provider times out here, we must not retry blindly because the charge may have succeeded � we need an idempotency key and a status query."

**"Login flow is a solved commodity"** ? The login flow is a chain of deliberate security decisions people wreck by simplification: password check must be constant-time against timing attacks, user-not-found and wrong-password must return IDENTICAL responses (username enumeration), sessions must rotate identifiers on privilege change (session fixation), and refresh-token theft needs rotation-with-reuse-detection. Walking this flow with its WHYs is a security interview in miniature � and the flows chapter is where those whys attach to arrows people can see.

**"Checkout flows are payment-provider plumbing"** ? Checkout is THE distributed-transaction teaching flow: inventory reservation with TTL (holding without buying), payment authorization versus capture (two-phase in the wild), order-state machines with compensation (cancel releases reservation, refund reverses capture), and exactly-once user experience atop at-least-once infrastructure (idempotency keys on every mutating call). Every saga-pattern lecture is this flow generalized; owning the concrete version makes the abstract one obvious.

**"Notification flows are fire-and-forget"** ? Notifications carry the quietest correctness traps in product engineering: firing before the triggering transaction commits (user gets email for an order that rolled back � the transactional-outbox pattern exists solely for this), duplicate sends on consumer retry (dedup keys per notification-event), preference checks racing preference changes, and fan-out amplification (one post, a million timeline writes � the push-versus-pull decision). "Just send an event" is the answer that marks the boundary between feature thinking and systems thinking.
