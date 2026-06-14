> **Navigation**: [< Previous](Day_005_Mar07_Fri.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_007_Mar09_Sun.md)

# Day 006 - Saturday, March 8, 2026

> **Week 01** | **WEEKEND** | **Theme:** Spring Boot Foundations + SQL Practice + Review
> [Prev Day](Day_005_Mar07_Fri.md) | [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Next Day](Day_007_Mar09_Sun.md)

---

## Completion Checklist

- [ ] SPRING BOOT: What, Why, Architecture, First App (90 min)
- [ ] SQL PRACTICE: Mixed exercises from Week 1 topics (45 min)
- [ ] REVIEW: Week 1 summary + self-assessment (45 min)

---

## BLOCK 1: SPRING BOOT (90 min)

### Part 1: WHY Spring Boot Exists (20 min)

#### The problem Spring Boot solves

```
BEFORE Spring Boot (traditional Java web dev):
  1. Write 200+ lines of XML configuration
  2. Set up a Tomcat server manually
  3. Add 30+ library dependencies with exact versions
  4. Configure database connection pools
  5. Write boilerplate code for every endpoint
  → 2-3 DAYS just to get "Hello World" running

AFTER Spring Boot:
  1. Go to start.spring.io
  2. Select "Web" dependency
  3. Write 10 lines of Java
  4. Run it
  → "Hello World" in 5 MINUTES
```

#### WHO uses Spring Boot?

```
COMPANIES: Netflix, Amazon, Google (internal tools), Uber, LinkedIn, Intuit
WHY:
  - Fastest way to build production-ready Java microservices
  - Massive ecosystem (security, data, cloud, messaging)
  - Convention over configuration — sensible defaults
  - Market: ~60% of Java backend jobs require Spring/Spring Boot
```

#### WHAT is the architecture?

```
Spring Boot Architecture:

  ┌─────────────────────────────────────────────┐
  │              YOUR APPLICATION                │
  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
  │  │Controller│ │ Service  │ │ Repository   │  │
  │  │(REST API)│→│(Business)│→│(Database)    │  │
  │  └─────────┘ └──────────┘ └──────────────┘  │
  ├─────────────────────────────────────────────┤
  │           SPRING BOOT AUTO-CONFIG            │
  │  (Tomcat, Jackson, DataSource, Security)     │
  ├─────────────────────────────────────────────┤
  │              SPRING FRAMEWORK                │
  │  (IoC Container, DI, AOP, MVC)               │
  ├─────────────────────────────────────────────┤
  │                   JVM                         │
  └─────────────────────────────────────────────┘

LAYERED ARCHITECTURE:
  Controller → handles HTTP requests
  Service    → contains business logic
  Repository → talks to database

WHY layers?
  - Separation of concerns (each layer has ONE job)
  - Testability (mock one layer, test another)
  - Maintainability (change database without touching controller)
```

### Part 2: Core Concepts (30 min)

#### IoC (Inversion of Control) and DI (Dependency Injection)

```
WITHOUT DI (tight coupling):
  class OrderService {
      private DatabaseConnection db = new MySQLConnection();
      // Problem: Can't switch to PostgreSQL without changing code!
  }

WITH DI (loose coupling):
  class OrderService {
      private DatabaseConnection db;

      OrderService(DatabaseConnection db) {   // Injected from outside!
          this.db = db;
      }
  }
  // Now Spring provides the right implementation
  // Switch MySQL → PostgreSQL by changing ONE config line

IoC CONTAINER:
  Spring creates and manages all objects (called "beans")
  YOU define what you need, SPRING figures out HOW to wire them

  Think of it like a restaurant:
    YOU (customer) = your application code
    SPRING (kitchen) = creates objects, manages lifecycle
    MENU (annotations) = @Component, @Service, @Repository
    ORDER (injection) = @Autowired, constructor injection
```

#### Annotations you must know

```java
// 1. @SpringBootApplication — marks the entry point
@SpringBootApplication  // = @Configuration + @ComponentScan + @EnableAutoConfiguration
public class MyApp {
    public static void main(String[] args) {
        SpringApplication.run(MyApp.class, args);
    }
}

// 2. @RestController — this class handles HTTP requests
@RestController
@RequestMapping("/api/products")
public class ProductController {

    // 3. @Autowired — inject dependency (constructor injection preferred)
    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;  // Spring injects this
    }

    // 4. @GetMapping — handle GET /api/products
    @GetMapping
    public List<Product> getAllProducts() {
        return productService.findAll();
    }

    // 5. @PostMapping — handle POST /api/products
    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        return productService.save(product);
    }

    // 6. @PathVariable — extract from URL
    @GetMapping("/{id}")
    public Product getById(@PathVariable Long id) {
        return productService.findById(id);
    }
}
```

### Part 3: Build Your First App (40 min)

#### Project setup (conceptual — you'll code this for real in Week 3)

```
STEP 1: Go to https://start.spring.io
  - Project: Maven
  - Language: Java
  - Spring Boot: 3.x
  - Dependencies: Spring Web, Spring Data JPA, H2 Database

STEP 2: Project structure generated:
  src/
    main/
      java/com/example/demo/
        DemoApplication.java        ← Entry point
        controller/                 ← REST endpoints
        service/                    ← Business logic
        repository/                 ← Database access
        model/                      ← Entity classes
      resources/
        application.properties      ← Configuration
        static/                     ← Frontend files
        templates/                  ← HTML templates
```

#### Complete Hello World API

```java
// 1. Application entry point (already generated)
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}

// 2. Model (what data looks like)
@Entity  // Tells JPA this maps to a database table
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private double price;

    // Getters, setters, constructors (or use @Data from Lombok)
}

// 3. Repository (database operations — Spring writes the SQL!)
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Spring auto-generates: findAll(), findById(), save(), deleteById()
    // You can add custom queries:
    List<Product> findByPriceLessThan(double price);
}

// 4. Service (business logic)
@Service
public class ProductService {
    private final ProductRepository repo;

    public ProductService(ProductRepository repo) {
        this.repo = repo;
    }

    public List<Product> findAll() {
        return repo.findAll();
    }

    public Product save(Product product) {
        if (product.getPrice() <= 0) {
            throw new RuntimeException("Price must be positive");
        }
        return repo.save(product);
    }
}

// 5. Controller (HTTP endpoints)
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public List<Product> getAll() { return service.findAll(); }

    @PostMapping
    public Product create(@RequestBody Product p) { return service.save(p); }

    @GetMapping("/{id}")
    public Product getById(@PathVariable Long id) {
        return service.findById(id).orElseThrow();
    }
}

// 6. application.properties
// spring.datasource.url=jdbc:h2:mem:testdb
// spring.h2-console.enabled=true
```

#### Test it mentally (Week 3 you'll run it for real)

```
START: mvn spring-boot:run
  → Tomcat starts on port 8080

GET http://localhost:8080/api/products
  → Returns: []

POST http://localhost:8080/api/products
  Body: {"name": "Laptop", "price": 999.99}
  → Returns: {"id": 1, "name": "Laptop", "price": 999.99}

GET http://localhost:8080/api/products
  → Returns: [{"id": 1, "name": "Laptop", "price": 999.99}]

GET http://localhost:8080/api/products/1
  → Returns: {"id": 1, "name": "Laptop", "price": 999.99}
```

---

## BLOCK 2: SQL PRACTICE (45 min)

### Mixed Exercises from Week 1

**Use the products and students tables from this week.**

#### Exercise 1: DDL + DML Combined

Write SQL to:

1. Create a `categories` table with `id`, `name`, and `description`
2. Insert 3 categories
3. Add a `category_id` foreign key to the `products` table

<details>
<summary>Solution</summary>

```sql
-- 1. Create categories
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200)
);

-- 2. Insert categories
INSERT INTO categories (name, description) VALUES
    ('Electronics', 'Electronic devices and accessories'),
    ('Stationery', 'Office and school supplies'),
    ('Books', 'Physical and digital books');

-- 3. Add foreign key to products (replaces the category VARCHAR)
ALTER TABLE products ADD COLUMN category_id INT;
ALTER TABLE products ADD CONSTRAINT fk_product_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id);
```

</details>

#### Exercise 2: SELECT Challenge

```sql
-- Write ONE query that returns:
-- Product name, price, a column showing "Expensive" if price > 100
-- or "Affordable" otherwise, sorted by price descending.
```

<details>
<summary>Solution</summary>

```sql
SELECT product_name,
       price,
       CASE
           WHEN price > 100 THEN 'Expensive'
           ELSE 'Affordable'
       END AS price_category
FROM products
ORDER BY price DESC;

-- CASE is SQL's if-else — extremely powerful for data classification
```

</details>

#### Exercise 3: Data Integrity

```sql
-- What happens with each of these? Predict BEFORE running:
-- 1. INSERT INTO products (product_name, price, stock) VALUES ('Test', -5, 10);
-- 2. INSERT INTO students (first_name, last_name, email, age) VALUES ('A', 'B', 'harsha@example.com', 20);
-- 3. UPDATE products SET stock = stock - 500 WHERE product_id = 2;
```

<details>
<summary>Answers</summary>

```sql
-- 1. FAILS: CHECK constraint (price > 0) violated
-- 2. FAILS: UNIQUE constraint on email — harsha@example.com already exists
-- 3. SUCCEEDS but stock = 200 - 500 = -300 (negative!)
--    FIX: Add CHECK (stock >= 0) or use: WHERE stock >= 500
```

</details>

---

## BLOCK 3: WEEK 1 REVIEW (45 min)

### Self-Assessment Checklist

Rate yourself 1-5 for each topic (5 = can solve without looking):

| Topic                                | Rating | Notes |
| ------------------------------------ | ------ | ----- |
| Array creation & traversal           | /5     |       |
| Array rotation (reverse trick)       | /5     |       |
| Prefix sum + range query             | /5     |       |
| Selection Sort trace                 | /5     |       |
| Insertion Sort trace                 | /5     |       |
| Bubble Sort trace + optimization     | /5     |       |
| Merge Sort trace + code              | /5     |       |
| String immutability                  | /5     |       |
| Frequency array technique            | /5     |       |
| Kadane's Algorithm                   | /5     |       |
| 2D array traversal                   | /5     |       |
| Spiral order traversal               | /5     |       |
| SQL: CREATE TABLE with constraints   | /5     |       |
| SQL: INSERT / UPDATE / DELETE safely | /5     |       |
| SQL: SELECT with LIKE, BETWEEN, IN   | /5     |       |

### Key patterns from this week:

```
1. TWO POINTERS         — reverse array, palindrome check
2. FREQUENCY ARRAY      — anagram, first unique character
3. PREFIX SUM           — range queries, equilibrium index
4. SLIDING WINDOW       — fixed-size max sum (Day 2 Q2)
5. DIVIDE & CONQUER     — merge sort
6. KADANE'S             — max subarray sum
7. REVERSE TRICK        — array rotation
```

### Problems solved this week:

| Day | Q1                      | Q2                       |
| --- | ----------------------- | ------------------------ |
| 1   | LC 268 Missing Number   | XOR Find Single Element  |
| 2   | LC 189 Rotate Array     | Max Sum Subarray Size K  |
| 3   | LC 125 Valid Palindrome | First Non-Repeating Char |
| 4   | LC 53 Maximum Subarray  | Equilibrium Index        |
| 5   | LC 48 Rotate Image      | Saddle Point in Matrix   |

### Weak spots to revisit:

> Write down any topic where you rated yourself < 3. Plan to revisit during tomorrow's review session.

---

### Week 2 Preview:

```
WEEK 2 (Mar 10-16): HashMap + LinkedList + Quick Sort

Monday:    HashMap internals + how hashing works
Tuesday:   HashMap problems (Two Sum, Group Anagrams)
Wednesday: Singly Linked List + operations
Thursday:  Doubly Linked List + LRU Cache preview
Friday:    Quick Sort + comparison with Merge Sort
Saturday:  Spring Boot — REST API + HTTP methods deep dive
Sunday:    Review + weak spot practice
```

---

> **Mentor Note:** Rate yourself honestly. If any topic is below 3, spend
> tomorrow's review time re-reading that section and solving the problem AGAIN
> without looking at the solution. Struggle leads to learning.

---

> **Navigation**: [< Previous](Day_005_Mar07_Fri.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_007_Mar09_Sun.md)
