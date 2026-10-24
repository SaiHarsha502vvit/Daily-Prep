# 📌 Part 1: Understanding User Flows

> **Navigation**: [← Complete Understanding of System Design](01_complete_understanding_of_system_design.md) | [Chapter overview](../03_System_Design.md) | [Data Flows in Systems →](03_data_flows_in_systems.md)
> Page 2 of 5 in **System Design & Feature Creation Guide**


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
│ • Funnel evidence: fewer steps usually raise completion; measure your own    │
│   conversion rate before and after each flow change (A/B test)               │
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

## 📌 Part 2: Feature Creation Framework

### What Is Feature Creation?

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

### The Feature Creation Checklist

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

### Example: Creating a "Like" Feature

### Like_Id │ User_Id │ Post_Id │ Created_At

| PK | FK→users | FK→posts | timestamp |

---

[← Complete Understanding of System Design](01_complete_understanding_of_system_design.md) | [Chapter overview](../03_System_Design.md) | [Data Flows in Systems →](03_data_flows_in_systems.md)
