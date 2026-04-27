# 🏰 Domain-Driven Design (DDD) - Tactical & Strategic Patterns

> **🔥 3+ YOE God-Level Architectural Insight**
> DDD is not about software; it is about *language* and *boundaries*. If your code does not read like the business people speak, your design has failed.

## 1. Strategic Patterns (The High Level)
Strategic DDD is about organizing teams and mapping the business landscape.

### Ubiquitous Language
*   **Concept**: Developers and Domain Experts (business people) must strictly use the exact same vocabulary.
*   **The Rule**: If the business calls it a "Guest", you do NOT name your class `User` or `Account`. You name it `Guest`. If the business says "Check In", you do not write `updateStatusToActive()`. You write `checkIn()`.
*   **Why**: Translation between business logic and technical logic introduces fatal bugs. The code must be a living, breathing model of the business.

### Bounded Context (Deep Dive)
*   **Concept**: A specific boundary within which a particular Ubiquitous Language applies. It defines the limits of applicability of a model.
*   **The Trap**: Junior architects try to build one massive `User` or `Product` table for the whole company, leading to massive merge conflicts, schema bloat, and conceptual confusion.
*   **The DDD Way**: A "Product" means something completely different to the Inventory team (weight, dimensions, warehouse location) than to the E-Commerce team (description, marketing images, user reviews) than to the Billing team (tax rate, base price).
*   **Implementation**: Create separate Microservices (or separate modules in a monolith) for Inventory, E-Commerce, and Billing. Each has its own distinct `Product` class.
*   **The "Context Map" Rule**: Cross-context communication should happen via explicit translations (e.g., Domain Events). An E-Commerce `ProductCreated` event is consumed by Inventory, which maps it to an Inventory `Item` entity.

#### Code Stub: Bounded Context Segregation
```java
// E-Commerce Context
package com.company.ecommerce.domain;
public class Product {
    private ProductId id;
    private String seoDescription;
    private List<Image> gallery;
    // ... behavior specific to display and sales
}

// Inventory Context
package com.company.inventory.domain;
public class StockItem {
    private StockItemId id; // May map to ProductId externally
    private String warehouseLocation;
    private int quantityOnHand;
    // ... behavior specific to physical storage
}
```

### Context Mapping
How Bounded Contexts communicate with each other.
*   **Partnership**: Two teams coordinate development tightly.
*   **Customer/Supplier**: Upstream context (Supplier) dictates the API that the Downstream context (Customer) must consume.
*   **Anti-Corruption Layer (ACL)**: When communicating with a legacy system, you build a translation layer. The ACL intercepts the legacy data and translates it completely into your clean Ubiquitous Language before letting it enter your system.

---

## 2. Tactical Patterns (The Code Level)
Tactical DDD is about exactly how you structure your Java classes to protect the domain invariants.

### Entity
*   An object with a unique identity that persists over time, even if its properties change.
*   *Example*: An `Order`. You can add items to it or change its shipping address, but it remains the exact same order (same Order ID).

### Value Object (VO)
*   An immutable object defined entirely by its attributes. It has no unique ID.
*   *Example*: `Money`. A 100-dollar bill is identical to any other 100-dollar bill. If you change the amount from 100 to 50, you haven't "mutated" the 100-dollar bill; you have completely replaced it with a mathematically different concept.
*   *Rule*: Always use VOs for concepts like `Address`, `Currency`, `EmailAddress`. Do not use primitive strings for these (`String email`); wrap them in a Value Object that guarantees self-validation.

### Aggregate & Aggregate Root (Deep Dive)
*   **Concept**: A cluster of domain objects (Entities and VOs) treated as a single unit for data changes. They guarantee consistency of changes being made within a transaction boundary.
*   **The Root**: Every Aggregate has one specific Entity acting as the Root. The outside world is ONLY allowed to hold references to the Root, and all database saves/loads must happen exclusively through the Root.
*   **Invariant Enforcement**: The Root is responsible for enforcing business rules (invariants) across all its children. If a rule spans multiple entities, they belong in the same Aggregate.
*   **Transaction Boundary Rule**: A single database transaction should modify exactly ONE Aggregate. If you need to modify multiple aggregates, use Domain Events (eventual consistency).

#### Code Stub: Aggregate Root Invariants
```java
public class Order { // Aggregate Root
    private OrderId id;
    private OrderStatus status;
    private List<OrderLine> lines; // Child entities
    private Money totalLimit;

    // The ONLY way to add a line. Enforces business invariants!
    public void addLineItem(Product product, int quantity) {
        if (this.status != OrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot add items to a non-draft order.");
        }
        
        OrderLine newLine = new OrderLine(product.getId(), quantity, product.getPrice());
        Money newTotal = calculateTotal().add(newLine.getSubtotal());
        
        if (newTotal.isGreaterThan(totalLimit)) {
            throw new DomainException("Order total exceeds allowed credit limit.");
        }
        
        this.lines.add(newLine);
    }
}
// ❌ WRONG: orderLineRepository.save(new OrderLine(...));
// ✅ RIGHT: order.addLineItem(...); orderRepository.save(order);
```

### Repository (DDD Definition)
*   An abstraction that makes the database look like an in-memory collection of Aggregates.
*   *Strict Rule*: There must be exactly one Repository per Aggregate Root. Never create a Repository for a child entity.

### Domain Service
*   When a piece of business logic does not naturally fit inside a single Entity, it goes into a Domain Service.
*   *Example*: `FundsTransferService`. Transferring money involves debiting Account A and crediting Account B. It doesn't belong purely in Account A or B, so a Domain Service orchestrates the interaction between both aggregates.

## 🧠 Deep Conceptual Questions
**C1. Why is an Anemic Domain Model considered an anti-pattern in DDD?**
<details><summary>Deep Answer</summary>
An anemic domain model has Entities that are just data bags (getters/setters only) and Services that contain all the rules. This violates encapsulation completely. An Entity is no longer in charge of its own validity; any Service can set any field to an invalid state. In true DDD (Rich Domain Model), Entities refuse to let external code mutate them improperly. They expose business intent methods (`order.confirm()`, not `order.setStatus("CONFIRMED")`) ensuring state is always legal 100% of the time without relying on a loosely coupled Service to "remember" to validate it first.
</details>
