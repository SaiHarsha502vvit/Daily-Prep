**Navigation**: [Back to Index](../00_MASTER_INDEX.md)

# Chapter 05 - System Design Fundamentals

Purpose: Core methodologies and test-driven architecture concepts, focusing on establishing solid foundations before scaling complexity.

---

## 1. The "Walking Skeleton" (GOOS Methodology)

In the book *Growing Object-Oriented Software, Guided by Tests* (GOOS), the authors introduce a critical architectural concept known as the **"Walking Skeleton."**

### What is a Walking Skeleton?
A Walking Skeleton is a tiny implementation of the system that performs a small, thin slice of end-to-end functionality. It links together all the main architectural components (UI, API, database, message queues) but contains almost no business logic.

### Why build it first?
In traditional system design, engineers often build horizontal layers (e.g., spending weeks perfecting the database schema, then weeks on the API, then the UI). This delays integration testing until the very end, causing massive integration headaches (the "Big Bang" integration failure).

The Walking Skeleton solves this by forcing you to:
1. **Prove the Architecture:** It proves that your chosen technologies (e.g., React + Spring Boot + PostgreSQL) can actually communicate with each other in production.
2. **Establish the Pipeline:** It forces you to set up the CI/CD pipeline, automated deployment, and production environments *before* writing business logic.
3. **Enable End-to-End Testing:** It allows you to write your first automated acceptance test, establishing a safety net for all future development.

### How it differs from an MVP:
- An **MVP (Minimum Viable Product)** is about proving *business value* to users.
- A **Walking Skeleton** is about proving *technical viability* and establishing the delivery infrastructure. Users might never see the Walking Skeleton.

### Example Scenario
**Goal:** Build an e-commerce checkout system.
- **Bad Approach:** Design 50 database tables. Write 20 API endpoints. Build a massive UI.
- **Walking Skeleton Approach:** 
  1. A plain HTML button that says "Checkout".
  2. Clicking it hits an API endpoint.
  3. The API writes a hardcoded string ("Order 123") to the database.
  4. The UI displays "Success".
  *Result:* You now have a working UI → API → DB connection deployed to production, with an automated test verifying the flow. Now you can safely iterate.

### Interview Phrasing
*"Before committing to a massive microservice rollout, I would implement a Walking Skeleton. This thin end-to-end slice proves our CI/CD pipeline, network configurations, and component communication are correct before we invest heavily in business logic. It mitigates integration risk on Day 1 rather than Day 100."*

---

## 2. Test-First Design & Mocking Roles (GOOS Methodology)

Another core philosophy from *Growing Object-Oriented Software* is how we use Test-Driven Development (TDD) not just for verification, but as a primary **design tool**. 

### Test-First Design
In GOOS, you do not design the classes and then write tests for them. You write the test *first* to discover what the API *should* look like from the perspective of the client using it.
*   **Outside-In:** You start with an acceptance test (end-to-end). When that fails, you write a unit test for the outermost component (e.g., the Controller). To make that unit test pass, you discover that you need a collaborating object (e.g., a Service). 
*   **Discovery:** You don't guess what the Service should look like; you let the Controller's test dictate the Service's interface.

### "Mock Roles, Not Objects"
This is the most misunderstood concept in mocking. 

*   **The Anti-Pattern:** Developers often create a concrete class `OrderProcessor`, realize it's hard to test, and then create a mock of `OrderProcessor` using a mocking library. This couples the test to the implementation details of the object.
*   **The GOOS Way:** You mock **Roles**, not Objects. A Role is an Interface that defines a specific behavior required by the caller.

#### Example:
Suppose an `OrderController` needs to send a notification when an order completes. 
1.  **Don't** mock a concrete `SendGridEmailClient` class.
2.  **Instead**, define an interface that describes the *Role* the collaborator plays from the Controller's perspective: `public interface OrderNotifier`. 
3.  In your test, you mock the `OrderNotifier` role.
4.  Later, you implement a concrete `SendGridOrderNotifier` which implements that interface.

**Why this matters for System/Software Design:**
By mocking roles (interfaces) instead of concrete objects, you are naturally driven toward **Dependency Inversion** (the 'D' in SOLID) and **Ports and Adapters Architecture** (Hexagonal). The "Role" becomes the Port, and the concrete class becomes the Adapter. The tests literally force your architecture to be modular and decoupled.
