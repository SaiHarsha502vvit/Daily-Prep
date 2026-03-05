> **Navigation**: [< Previous](Day_019_Mar21_Fri.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Day_021_Mar23_Sun.md)

# Day 020 — Saturday, March 22, 2026

> **Week 03** | **Day 6 (Weekend)** | **Theme:** Spring Boot REST Controllers + Error Handling + SQL Practice
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Prev Day](Day_019_Mar21_Fri.md) | [Next Day](Day_021_Mar23_Sun.md)

---

## Completion Checklist

- [ ] Spring Boot: REST Controllers Deep Dive (45 min)
- [ ] Spring Boot: Error Handling + Validation (45 min)
- [ ] SQL Practice: Mixed Drills (45 min)
- [ ] Week Review: Concept Map (15 min)

---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **Spring Boot: REST Controllers + Validation** | [Spring Boot: Controllers & REST](../../07_Modern_Java/09_Spring_Boot_Part7_Controllers_REST.md) |
> | **SQL: Mixed Drills** | [SQL: JOINs Complete](../../08_SQL/07_JOINs_Complete.md) |
>
> *Open the linked file for full theory, diagrams, and practice problems.*

---



## 1. SPRING BOOT: REST Controllers Deep Dive (45 min)

### WHY?
REST APIs are how 95% of modern applications communicate. Spring Boot makes building REST APIs fast, but understanding the layers (Controller → Service → Repository) is essential.

### The Layered Architecture

```
CLIENT (Browser/Mobile/Postman)
    ↓  HTTP Request
┌───────────────────────────────────────┐
│  @RestController                      │ ← Handles HTTP, validates input
│  ProductController                    │    Returns JSON responses
├───────────────────────────────────────┤
│  @Service                             │ ← Business logic
│  ProductService                       │    Validation rules, calculations
├───────────────────────────────────────┤
│  @Repository                          │ ← Data access
│  ProductRepository (JPA)              │    SQL queries, CRUD operations
├───────────────────────────────────────┤
│  DATABASE                             │ ← Persistence
│  PostgreSQL / MySQL                   │
└───────────────────────────────────────┘
```

### Complete CRUD REST Controller

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    
    private final ProductService productService;
    
    // Constructor injection (recommended)
    public ProductController(ProductService productService) {
        this.productService = productService;
    }
    
    // GET /api/products — List all
    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAll() {
        return ResponseEntity.ok(productService.findAll());
    }
    
    // GET /api/products/{id} — Get by ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getById(@PathVariable Long id) {
        return productService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    // POST /api/products — Create
    @PostMapping
    public ResponseEntity<ProductDTO> create(
            @Valid @RequestBody CreateProductRequest request) {
        ProductDTO created = productService.create(request);
        URI location = URI.create("/api/products/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }
    
    // PUT /api/products/{id} — Full update
    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }
    
    // DELETE /api/products/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    // GET /api/products/search?name=phone&minPrice=100
    @GetMapping("/search")
    public ResponseEntity<List<ProductDTO>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
            productService.search(name, minPrice, PageRequest.of(page, size)));
    }
}
```

### HTTP Methods → CRUD Mapping

```
┌─────────┬────────────┬──────────────┬──────────────────┐
│ HTTP    │ CRUD       │ URL          │ Response Code    │
├─────────┼────────────┼──────────────┼──────────────────┤
│ GET     │ Read       │ /products    │ 200 OK           │
│ GET     │ Read one   │ /products/1  │ 200 or 404       │
│ POST    │ Create     │ /products    │ 201 Created      │
│ PUT     │ Full update│ /products/1  │ 200 OK           │
│ PATCH   │ Partial    │ /products/1  │ 200 OK           │
│ DELETE  │ Delete     │ /products/1  │ 204 No Content   │
└─────────┴────────────┴──────────────┴──────────────────┘
```

### DTO Pattern (Don't Expose Entities!)

```java
// Request DTO — what client sends
public record CreateProductRequest(
    @NotBlank(message = "Name is required")
    String name,
    
    @NotNull @Positive(message = "Price must be positive")
    BigDecimal price,
    
    @Size(max = 500)
    String description
) {}

// Response DTO — what client receives
public record ProductDTO(
    Long id,
    String name,
    BigDecimal price,
    String description,
    LocalDateTime createdAt
) {
    // Factory method from entity
    public static ProductDTO from(Product entity) {
        return new ProductDTO(
            entity.getId(), entity.getName(),
            entity.getPrice(), entity.getDescription(),
            entity.getCreatedAt()
        );
    }
}
```

---

## 2. SPRING BOOT: Error Handling + Validation (45 min)

### WHY?
Good APIs return meaningful error messages, not stack traces. Global error handling keeps controllers clean and gives clients consistent error format.

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handle "not found" cases
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    // Handle validation errors (@Valid failures)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex) {
        
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
            fieldErrors.put(err.getField(), err.getDefaultMessage())
        );
        
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            LocalDateTime.now(),
            fieldErrors
        );
        return ResponseEntity.badRequest().body(error);
    }
    
    // Catch-all for unexpected errors
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred",
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

### Error Response Format

```java
public record ErrorResponse(
    int status,
    String message,
    LocalDateTime timestamp,
    Map<String, String> fieldErrors  // null if not validation error
) {
    public ErrorResponse(int status, String message, LocalDateTime timestamp) {
        this(status, message, timestamp, null);
    }
}
```

```json
// What client sees for validation error:
{
    "status": 400,
    "message": "Validation failed",
    "timestamp": "2026-03-22T10:30:00",
    "fieldErrors": {
        "name": "Name is required",
        "price": "Price must be positive"
    }
}

// What client sees for not found:
{
    "status": 404,
    "message": "Product not found with id: 42",
    "timestamp": "2026-03-22T10:30:00",
    "fieldErrors": null
}
```

### Custom Exception

```java
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " not found with id: " + id);
    }
}

// Usage in service:
@Service
public class ProductService {
    public ProductDTO findById(Long id) {
        return productRepository.findById(id)
            .map(ProductDTO::from)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }
}
```

### Error Handling Flow

```
Client sends: POST /api/products  { "name": "", "price": -5 }

  1. Spring validates @RequestBody with @Valid
  2. @NotBlank fails on name, @Positive fails on price
  3. Throws MethodArgumentNotValidException
  4. @RestControllerAdvice catches it
  5. Returns 400 + structured error JSON
  
  NO TRY-CATCH IN CONTROLLER! Clean separation.
```

---

## 3. SQL PRACTICE: Mixed Drills (45 min)

### Drill 1: CTE + Window Function

```sql
-- Find the top 2 highest-paid employees per department
-- Show their rank and salary compared to department average
WITH ranked AS (
    SELECT name, department, salary,
        DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk,
        AVG(salary) OVER (PARTITION BY department) AS dept_avg
    FROM employees
)
SELECT name, department, salary, rnk,
    ROUND(salary - dept_avg, 2) AS above_avg
FROM ranked
WHERE rnk <= 2
ORDER BY department, rnk;
```

### Drill 2: Self-JOIN + Aggregate

```sql
-- Find managers who manage more than 3 employees
-- and show their team's average salary
SELECT m.name AS manager, 
    COUNT(e.id) AS team_size,
    ROUND(AVG(e.salary), 2) AS team_avg_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
GROUP BY m.id, m.name
HAVING COUNT(e.id) > 3
ORDER BY team_size DESC;
```

### Drill 3: CASE + GROUP BY

```sql
-- Categorize orders by month and size, count each combination
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') AS month,
    CASE
        WHEN total < 50 THEN 'Small'
        WHEN total < 200 THEN 'Medium'
        ELSE 'Large'
    END AS order_size,
    COUNT(*) AS order_count,
    SUM(total) AS revenue
FROM orders
WHERE YEAR(order_date) = 2025
GROUP BY DATE_FORMAT(order_date, '%Y-%m'),
    CASE 
        WHEN total < 50 THEN 'Small'
        WHEN total < 200 THEN 'Medium'
        ELSE 'Large'
    END
ORDER BY month, order_size;
```

### Drill 4: UNION + CTE

```sql
-- Create a unified contact list from customers and suppliers
WITH all_contacts AS (
    SELECT name, email, phone, 'Customer' AS type FROM customers
    UNION ALL
    SELECT contact_name, email, phone, 'Supplier' AS type FROM suppliers
)
SELECT type, COUNT(*) AS total,
    COUNT(DISTINCT email) AS unique_emails
FROM all_contacts
GROUP BY type;
```

### Drill 5: Running Total + LAG

```sql
-- Monthly revenue with running total and month-over-month change
WITH monthly AS (
    SELECT 
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        SUM(total) AS revenue
    FROM orders
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT month, revenue,
    SUM(revenue) OVER (ORDER BY month) AS running_total,
    revenue - LAG(revenue) OVER (ORDER BY month) AS mom_change,
    ROUND(
        (revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0 
        / LAG(revenue) OVER (ORDER BY month), 1
    ) AS growth_pct
FROM monthly
ORDER BY month;
```

---

## 4. WEEK REVIEW: Concept Map

```
WEEK 3 KNOWLEDGE GRAPH:
═══════════════════════════════════════════════

Binary Tree ─── BST ─── TreeMap/TreeSet
    │              │
    ├── DFS ──── Preorder, Inorder, Postorder
    │              │
    ├── BFS ──── Level-Order (Queue-based)
    │
    └── Problems: maxDepth, invertTree, levelOrder

Heap ─── PriorityQueue ─── Kth Largest, Top K
    │
    └── Heap Sort (O(n log n) in-place)

Recursion ─── Backtracking ─── Subsets, Permutations
    │                            │
    └── Base case + reduce ───── Choose/Explore/Unchoose

Sliding Window ─── Fixed Size (sum of k)
    │                Variable Size (min length ≥ target)
    └──────────────── HashMap variant (distinct chars)

SQL Advanced:
  UNION/CASE → Window Functions → LAG/LEAD → CTEs
  
Spring Boot:
  Controller → Service → Repository layers
  @Valid + @RestControllerAdvice = clean error handling
```

---

## Self-Assessment: Week 3 Scorecard

```
                          Know it  Can code it  Can teach it
Binary Tree basics        [ ]      [ ]          [ ]
BST operations            [ ]      [ ]          [ ]
DFS (3 traversals)        [ ]      [ ]          [ ]
BFS (level-order)         [ ]      [ ]          [ ]
Heap / PriorityQueue      [ ]      [ ]          [ ]
Heap Sort                 [ ]      [ ]          [ ]
Recursion patterns        [ ]      [ ]          [ ]
Backtracking template     [ ]      [ ]          [ ]
Sliding Window            [ ]      [ ]          [ ]
SQL Window Functions      [ ]      [ ]          [ ]
SQL CTEs                  [ ]      [ ]          [ ]
REST Controllers          [ ]      [ ]          [ ]
Error Handling            [ ]      [ ]          [ ]

SCORE: ___ / 39 (13 × 3)
TARGET: 26+ before moving to Week 4
```


---

> **Navigation**: [< Previous](Day_019_Mar21_Fri.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Day_021_Mar23_Sun.md)