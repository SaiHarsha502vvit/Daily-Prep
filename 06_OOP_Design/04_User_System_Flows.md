# 🔄 Understanding User Flows & System Flows

> **Navigation**: [← System Design & Feature Creation…](03_System_Design.md) | [Chapter index](00_INDEX.md) | [Chapter 05 - System Design… →](05b_System_Design_Fundamentals.md)

## Complete Guide: From Concept to Implementation

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [System Design Basics](03_System_Design.md) |
| **You will learn** | User flows, data flows, request (system) flows, flows for new features, and how flows map to code |
| **Leads to** | [SD Interview Problems](05_SD_Interview_Problems.md), [Stories to Design](10_Stories_To_Design.md) |
| **Abstraction level** | Screens and clicks → **steps with decisions and failures** → **flows implemented as states and handlers** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — User and System Flows

### 1. The bottom line

Draw the happy path, then every branch and failure, before writing code; the flow becomes the specification.

### 2. The textbook core

- A **user flow** shows what a person does; a **data flow** shows how information moves; a **system flow** shows how services handle one request.
- Every step needs an error path and a recovery path.
- Flows map naturally onto state machines and sequence diagrams.
- Distributed flows add timeouts, retries and idempotency.

### 3. The real-world analogy

A **subway map**: it shows stations (steps) and connections (transitions), including where you can change lines when something is closed.

### 4. Walkthrough

1. Draw login: enter credentials → verify → session.
2. Add branches: wrong password, locked account, expired session.
3. Decide the response and state for each branch.
4. Translate the diagram into a state enum or handler chain.
5. Write one test per branch.

> [!NOTE]
> **Quick check:** Which flows are most often forgotten? *The failure and retry paths.*

### 5. Check yourself

**Q1.** Why must a payment retry be idempotent?

<details><summary>Answer</summary>

A timeout does not tell the client whether the first attempt succeeded. Without an idempotency key a retry can charge twice.

</details>

**Q2.** What is the difference between a data flow and a user flow?

<details><summary>Answer</summary>

A user flow follows a person's steps; a data flow follows information through components, usually crossing several user steps.

</details>

---


## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Complete Understanding of Flows](04_User_System_Flows/01_complete_understanding_of_flows.md) | Complete Understanding of Flows | 155 |
| 2 | [User Flow Design](04_User_System_Flows/02_user_flow_design.md) | User Flow Design · Data Flow Design · SYSTEM FLOW (Request Flow) | 346 |
| 3 | [Creating Flows for New Features](04_User_System_Flows/03_creating_flows_for_new_features.md) | Creating Flows for New Features · Flow Design in Code · Flow Practice Exercises | 308 |
| 4 | [Quick Reference: Flow Design Checklist](04_User_System_Flows/04_quick_reference_flow_design_checklist.md) | Quick Reference: Flow Design Checklist | 178 |

## 🏢 Enterprise Lens — User and System Flows

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | API design, UX reviews, sequence diagrams in design docs, tracing in production |
| **Failure modes** | Happy-path-only flows; retries that duplicate side effects |
| **Testing and verification** | One test per branch; replay of a failed request must be safe (idempotency) |

---

## Reality Check

**"Flows are diagrams; the design is the components"** — The flow IS where designs break: components look fine in a box diagram until you trace one user action through auth, cache, service, queue, and DB — and discover the race between cache-write and DB-commit, the retry that double-charges, the notification that fires before the transaction lands. Tracing flows end-to-end is the design REVIEW built into the design; skipping it ships whiteboard fiction.

**"The happy path defines the flow"** — Every arrow in a flow has three shadow arrows: timeout, error response, and duplicate delivery. Professional flow design annotates each hop with its failure behavior — retry (how many, what backoff), fallback (stale cache? default?), or propagate (which error surfaces to the user?). The interview upgrade is doing this UNPROMPTED for the two or three hops that matter: "if the payment provider times out here, we must not retry blindly because the charge may have succeeded — we need an idempotency key and a status query."

**"Login flow is a solved commodity"** — The login flow is a chain of deliberate security decisions people wreck by simplification: password check must be constant-time against timing attacks, user-not-found and wrong-password must return IDENTICAL responses (username enumeration), sessions must rotate identifiers on privilege change (session fixation), and refresh-token theft needs rotation-with-reuse-detection. Walking this flow with its WHYs is a security interview in miniature — and the flows chapter is where those whys attach to arrows people can see.

**"Checkout flows are payment-provider plumbing"** — Checkout is THE distributed-transaction teaching flow: inventory reservation with TTL (holding without buying), payment authorization versus capture (two-phase in the wild), order-state machines with compensation (cancel releases reservation, refund reverses capture), and exactly-once user experience atop at-least-once infrastructure (idempotency keys on every mutating call). Every saga-pattern lecture is this flow generalized; owning the concrete version makes the abstract one obvious.

**"Notification flows are fire-and-forget"** — Notifications carry the quietest correctness traps in product engineering: firing before the triggering transaction commits (user gets email for an order that rolled back — the transactional-outbox pattern exists solely for this), duplicate sends on consumer retry (dedup keys per notification-event), preference checks racing preference changes, and fan-out amplification (one post, a million timeline writes — the push-versus-pull decision). "Just send an event" is the answer that marks the boundary between feature thinking and systems thinking.
