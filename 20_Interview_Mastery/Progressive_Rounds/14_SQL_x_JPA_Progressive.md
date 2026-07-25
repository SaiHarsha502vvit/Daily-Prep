# 14. SQL × Spring Data JPA — From Queries to Annotations

**Navigation**: [← DSA Problems](../Problem_Sets_DSA/13_DSA_Problems_DP_Greedy_Backtracking.md) | [📚 Index](../00_INDEX.md) | [Deep Dives →](14_Challenge_Deep_Dives.md)

**Cross-links:**
- [`08_SQL/`](../../08_SQL/) — SQL foundations (read Ch01–13 before this file)
- [`07_Modern_Java/Ch32_SB_Data_Part2.md`](../../07_Modern_Java/Ch32_SB_Data_Part2.md) — JPA deep dive
- [`07_Modern_Java/Ch40_SB_JPA_Deep_Dive.md`](../../07_Modern_Java/Ch40_SB_JPA_Deep_Dive.md) — N+1 and lazy loading
- [`08_SQL/13_Transactions_ACID.md`](../../08_SQL/13_Transactions_ACID.md) — SQL transactions
- [`PATH_JAVA_BACKEND.md`](../../PATH_JAVA_BACKEND.md) — full Java backend learning path

---

> **Reading contract**: You already know SQL. This file shows exactly what JPA does with the SQL you already know — annotation by annotation, clause by clause. By the end, every JPA annotation will map to a SQL concept you recognize. No Java assumed beyond syntax basics.

---

## Table of Contents

1. [SELECT → repository.findAll() and method name derivation](#1-select--repositoryfindall-and-method-name-derivation)
2. [WHERE → @Query and Derived Query Methods](#2-where--query-and-derived-query-methods)
3. [JOIN → @ManyToOne, @OneToMany, @ManyToMany](#3-join--manytoone-onetomany-manytomany)
4. [GROUP BY + HAVING → @Query aggregation](#4-group-by--having--query-aggregation)
5. [Transactions (ACID) → @Transactional](#5-transactions-acid--transactional)
6. [Indexes → @Index on Entities](#6-indexes--index-on-entities)
7. [Subqueries and CTEs → JPQL and Native Queries](#7-subqueries-and-ctes--jpql-and-native-queries)
8. [The N+1 Problem — When JPA Hides an O(n) Query Loop](#8-the-n1-problem--when-jpa-hides-an-on-query-loop)

---

## 1. SELECT → repository.findAll() and Method Name Derivation

### 🧠 Foundation — What SELECT does

SQL's `SELECT` loads rows from a table, optionally filtering columns:

```sql
-- Load all employees
SELECT * FROM employees;

-- Load specific columns
SELECT id, name, salary FROM employees;

-- Load one employee
SELECT * FROM employees WHERE id = 42;
```

The mental model: you're sending a command to the database engine — "execute this plan, return rows."

---

### 🔍 The JPA Equivalent

JPA repositories generate SELECT statements from method names. Spring reads the method name, parses it into SQL, and sends it to the database at runtime:

```java
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // Generated SQL: SELECT * FROM employees
    List<Employee> findAll();

    // Generated SQL: SELECT * FROM employees WHERE id = ?
    Optional<Employee> findById(Long id);

    // Generated SQL: SELECT * FROM employees WHERE name = ?
    List<Employee> findByName(String name);

    // Generated SQL: SELECT * FROM employees WHERE salary > ?
    List<Employee> findBySalaryGreaterThan(BigDecimal amount);

    // Generated SQL: SELECT * FROM employees ORDER BY name ASC
    List<Employee> findAllByOrderByNameAsc();
}
```

The naming convention:
```
findBy[FieldName][Condition]([type] param)
     ──────────  ──────────
     maps to      maps to SQL operator:
     column name  GreaterThan → >
                  LessThan    → <
                  Between     → BETWEEN
                  Like        → LIKE
                  IsNull      → IS NULL
                  In          → IN (...)
```

---

### 🔬 The Critical Mental Model Shift

In SQL you control **what the database does**.  
In JPA, you control **what objects you get back** — JPA decides what SQL to send.

```java
// JPA hides the column list — it selects all entity fields mapped to DB columns
Employee emp = repository.findById(42L).orElseThrow();
// This becomes: SELECT id, name, salary, department_id FROM employees WHERE id = 42
// The selected columns = your @Column annotations (see below)
```

**Entity class = the SQL table definition in Java:**

```java
@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;          // → id BIGINT PRIMARY KEY AUTO_INCREMENT

    @Column(nullable = false)
    private String name;      // → name VARCHAR(255) NOT NULL

    @Column(precision = 10, scale = 2)
    private BigDecimal salary; // → salary DECIMAL(10,2)
}
```

---

### 💥 War Story — Accidentally Loading 50,000 Objects into Memory

A team used `findAll()` on an `employees` table with 50,000 rows. Works fine for `SELECT *` in SQL — the database streams results. In JPA, `findAll()` loaded all 50,000 `Employee` objects into a Java `List<Employee>` in heap memory simultaneously.

The app crashed with `OutOfMemoryError` at 3AM during a nightly report job.

Fix: use pagination when the result set could be large.

```java
// ✅ Paginated — like SQL LIMIT + OFFSET
Page<Employee> page = repository.findAll(PageRequest.of(0, 100));

// Or: use a Slice when you don't need the total count
Slice<Employee> slice = repository.findAll(PageRequest.of(0, 100));
```

SQL equivalent:
```sql
SELECT * FROM employees LIMIT 100 OFFSET 0;
```

---

### 📝 Practice Challenges

1. Write a JPA repository method that finds all employees with salary between $50,000 and $100,000.
2. Write a method that finds employees whose name contains "Smith" (case-insensitive).
3. Why does `findAll()` on a 1M-row table have different behavior than `SELECT * FROM table` in psql?

---

## 2. WHERE → @Query and Derived Query Methods

### 🧠 Foundation — What WHERE does

`WHERE` filters rows after the FROM clause loads them:

```sql
-- Simple equality
SELECT * FROM employees WHERE department = 'Engineering';

-- Multi-condition
SELECT * FROM employees WHERE salary > 80000 AND active = true;

-- IN list
SELECT * FROM employees WHERE department IN ('Engineering', 'Product');

-- IS NULL
SELECT * FROM employees WHERE manager_id IS NULL;
```

---

### 🔍 The JPA Equivalent

**Option A — Derived method names** (Spring parses the name):

```java
// WHERE department = ?
List<Employee> findByDepartment(String department);

// WHERE salary > ? AND active = ?
List<Employee> findBySalaryGreaterThanAndActive(BigDecimal salary, boolean active);

// WHERE department IN (?)
List<Employee> findByDepartmentIn(List<String> departments);

// WHERE manager_id IS NULL
List<Employee> findByManagerIsNull();
```

**Option B — @Query with JPQL** (when method name gets unwieldy):

```java
// JPQL uses class name + field names, not table/column names
@Query("SELECT e FROM Employee e WHERE e.salary > :minSalary AND e.department = :dept")
List<Employee> findHighEarners(@Param("minSalary") BigDecimal min,
                               @Param("dept") String dept);
```

**Option C — @Query with native SQL** (when you need SQL-specific features):

```java
@Query(value = "SELECT * FROM employees WHERE salary > :min AND department = :dept",
       nativeQuery = true)
List<Employee> findHighEarnersNative(@Param("min") BigDecimal min,
                                     @Param("dept") String dept);
```

---

### The Mapping Table

| SQL | JPQL (`@Query`) | Derived method suffix |
|-----|-----------------|-----------------------|
| `= ?` | `e.field = :param` | `By[Field]` |
| `!= ?` | `e.field != :param` | `By[Field]Not` |
| `> ?` | `e.field > :param` | `By[Field]GreaterThan` |
| `>= ?` | `e.field >= :param` | `By[Field]GreaterThanEqual` |
| `< ?` | `e.field < :param` | `By[Field]LessThan` |
| `LIKE '%?%'` | `e.field LIKE :param` | `By[Field]Containing` |
| `LIKE '?%'` | `e.field LIKE :param` | `By[Field]StartingWith` |
| `IN (...)` | `e.field IN :list` | `By[Field]In` |
| `IS NULL` | `e.field IS NULL` | `By[Field]IsNull` |
| `IS NOT NULL` | `e.field IS NOT NULL` | `By[Field]IsNotNull` |
| `BETWEEN ? AND ?` | `e.field BETWEEN :a AND :b` | `By[Field]Between` |

---

### 💥 War Story — The Missing `IS NULL` Equivalent

A developer needed to find all employees without a manager (`manager_id IS NULL`). They wrote:

```java
findByManagerId(null); // ← Their guess at the JPA equivalent
```

This actually generates `WHERE manager_id = NULL` — which in SQL always returns 0 rows (the same NULL trap from SQL Ch01). Spring Data JPA does handle this correctly when passing `null` to an equality method — it generates `IS NULL`. But the developer didn't know this and added `@Query` using JPQL incorrectly:

```java
// ❌ Wrong
@Query("SELECT e FROM Employee e WHERE e.managerId = null")
// This literally sends "WHERE manager_id = NULL" to the DB — 0 rows always

// ✅ Correct JPQL
@Query("SELECT e FROM Employee e WHERE e.manager IS NULL")
// Note: reference the @ManyToOne relationship object, not the FK column
```

---

### 📝 Practice Challenges

1. Write both a derived method and a `@Query` JPQL version for: "Find all employees hired after January 1 2023 in the Engineering or Product department."
2. What does `findByNameContainingIgnoreCase("smith")` generate in SQL?
3. When would you choose `nativeQuery = true` over JPQL?

---

## 3. JOIN → @ManyToOne, @OneToMany, @ManyToMany

### 🧠 Foundation — What JOIN does

JOIN combines rows from two tables based on a matching column:

```sql
-- INNER JOIN: employees + their departments
SELECT e.name, d.name AS dept_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- The relationship: each employee has ONE department (employee.department_id = departments.id)
-- This is a many-to-one relationship: many employees → one department
```

SQL requires you to write the JOIN explicitly every time.

---

### 🔍 The JPA Equivalent

JPA encodes the JOIN condition as an **annotation on the field**, so you never write JOIN again — the ORM does it automatically when you access the related object.

**Many employees → One department (`@ManyToOne`):**

```java
@Entity
public class Employee {

    @ManyToOne(fetch = FetchType.LAZY)  // ← tells JPA: "JOIN departments ON department_id"
    @JoinColumn(name = "department_id") // ← the FK column name in the employees table
    private Department department;
}

@Entity
public class Department {
    @Id private Long id;
    private String name;
}
```

When you access `employee.getDepartment()`, JPA runs:
```sql
SELECT * FROM departments WHERE id = ?
```

**One department → Many employees (`@OneToMany`):**

```java
@Entity
public class Department {

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    private List<Employee> employees; // ← triggers SELECT * FROM employees WHERE department_id = ?
}
```

**Many employees ↔ Many projects (`@ManyToMany`):**

```java
@Entity
public class Employee {

    @ManyToMany
    @JoinTable(
        name = "employee_projects",          // join table name
        joinColumns = @JoinColumn(name = "employee_id"),
        inverseJoinColumns = @JoinColumn(name = "project_id")
    )
    private List<Project> projects;
}
```

SQL equivalent:
```sql
CREATE TABLE employee_projects (
    employee_id BIGINT REFERENCES employees(id),
    project_id  BIGINT REFERENCES projects(id),
    PRIMARY KEY (employee_id, project_id)
);
```

---

### The Mapping Table

| SQL concept | JPA annotation | What it generates |
|-------------|---------------|------------------|
| FK column in child table | `@ManyToOne` + `@JoinColumn` | `JOIN departments ON employees.dept_id = departments.id` |
| Reverse (parent sees children) | `@OneToMany(mappedBy)` | `SELECT * FROM employees WHERE dept_id = ?` |
| Join table (M×N) | `@ManyToMany` + `@JoinTable` | `JOIN employee_projects ON ...` |
| Unique FK (one-to-one) | `@OneToOne` + `@JoinColumn` | `JOIN profiles ON profiles.employee_id = employees.id` |

---

### 💥 War Story — The `@ManyToMany` That Wiped a Join Table

A developer mapped a `@ManyToMany` relationship and then called:

```java
employee.setProjects(newProjectList); // Replace the list
employeeRepository.save(employee);
```

JPA's default `@ManyToMany` cascade behavior deleted **all existing rows** from the `employee_projects` join table for that employee, then inserted the new list. If `newProjectList` was accidentally empty (a NPE caught upstream and swallowed), all project associations for that employee were silently erased.

Fix: use `CascadeType.PERSIST` and `CascadeType.MERGE` explicitly. Never use `CascadeType.ALL` on `@ManyToMany` — it cascades deletes to the join table.

```java
@ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
```

---

### 📝 Practice Challenges

1. Write the JPA entities for a `customers` and `orders` schema where one customer has many orders.
2. What is `mappedBy` for, and what happens if you omit it on `@OneToMany`?
3. A team uses `@ManyToMany` between `Student` and `Course`. They need to store the enrollment date. Why can't `@ManyToMany` store that, and what do they use instead?

---

## 4. GROUP BY + HAVING → @Query Aggregation

### 🧠 Foundation — What GROUP BY does

GROUP BY collapses rows into groups, then runs aggregate functions (COUNT, SUM, AVG, MAX, MIN) per group:

```sql
-- Average salary per department, only show departments above 70k average
SELECT department, AVG(salary) AS avg_salary, COUNT(*) AS headcount
FROM employees
GROUP BY department
HAVING AVG(salary) > 70000
ORDER BY avg_salary DESC;
```

---

### 🔍 The JPA Equivalent

Derived method names **cannot** express GROUP BY. You must use `@Query`:

```java
// Return a custom projection, not an entity
@Query("SELECT e.department AS department, AVG(e.salary) AS avgSalary, COUNT(e) AS headcount " +
       "FROM Employee e GROUP BY e.department HAVING AVG(e.salary) > :minAvg " +
       "ORDER BY AVG(e.salary) DESC")
List<DepartmentSummary> findDepartmentSummaries(@Param("minAvg") BigDecimal minAvg);
```

The return type needs a **projection interface**:

```java
public interface DepartmentSummary {
    String getDepartment();
    BigDecimal getAvgSalary();
    Long getHeadcount();
}
```

Spring Data JPA generates a dynamic proxy that maps result columns to getter names. `avgSalary` in JPQL maps to `getAvgSalary()`.

Or use a **DTO class** with a constructor expression:

```java
public class DepartmentStatsDto {
    private final String department;
    private final BigDecimal avgSalary;
    private final Long headcount;

    public DepartmentStatsDto(String department, BigDecimal avgSalary, Long headcount) {
        this.department = department;
        this.avgSalary = avgSalary;
        this.headcount = headcount;
    }
}

@Query("SELECT new com.example.DepartmentStatsDto(e.department, AVG(e.salary), COUNT(e)) " +
       "FROM Employee e GROUP BY e.department HAVING AVG(e.salary) > :minAvg")
List<DepartmentStatsDto> findDepartmentStats(@Param("minAvg") BigDecimal minAvg);
```

---

### 💥 War Story — `count(*)` That Killed Performance

A team needed to count orders per customer. They wrote:

```java
// ❌ JPA developer's first instinct
List<Customer> customers = customerRepository.findAll();
for (Customer c : customers) {
    int count = c.getOrders().size(); // loads ALL orders for each customer
    // This is COUNT(*) the JPA way — except it loads all Order objects, not just counts
}
```

This loaded 50,000 `Order` objects into memory to count 200 customers' orders. The `@Query` version is 200× faster:

```java
@Query("SELECT c.id AS customerId, COUNT(o) AS orderCount " +
       "FROM Customer c LEFT JOIN c.orders o GROUP BY c.id")
List<CustomerOrderCount> countOrdersPerCustomer();
```

---

### 📝 Practice Challenges

1. Write a JPQL `@Query` that finds the top 5 products by total revenue (SUM of order amounts).
2. What's the difference between a projection interface and a DTO constructor expression in terms of SQL generated?
3. Can you use `@Query` with `GROUP BY` without an aggregate function? What would that do?

---

## 5. Transactions (ACID) → @Transactional

### 🧠 Foundation — What transactions do in SQL

A transaction is a group of SQL statements that succeed or fail together:

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;  -- Deduct from sender
  UPDATE accounts SET balance = balance + 500 WHERE id = 2;  -- Add to recipient
COMMIT;  -- Both succeed together

-- If anything fails:
ROLLBACK;  -- Both changes are reversed
```

ACID properties:
- **Atomicity**: all-or-nothing (COMMIT / ROLLBACK)
- **Consistency**: data stays valid (constraints enforced)
- **Isolation**: concurrent transactions don't see each other's partial changes
- **Durability**: committed data survives crashes

---

### 🔍 The JPA Equivalent

`@Transactional` is Spring's `BEGIN … COMMIT/ROLLBACK` wrapper:

```java
@Service
public class PaymentService {

    @Transactional  // ← wraps the method body in BEGIN/COMMIT
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Account from = accountRepository.findById(fromId).orElseThrow();
        Account to   = accountRepository.findById(toId).orElseThrow();

        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));

        // No explicit save() needed — JPA's dirty checking automatically
        // generates UPDATE statements before the COMMIT
    }
    // Method exit → COMMIT (or ROLLBACK if a RuntimeException escapes)
}
```

**Isolation levels** — the same ones from SQL Ch13:

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
// → equivalent to: SET TRANSACTION ISOLATION LEVEL READ COMMITTED

@Transactional(isolation = Isolation.SERIALIZABLE)
// → most strict: no phantom reads, like LOCK TABLE in SQL
```

---

### The SQL → @Transactional Mapping

| SQL | `@Transactional` equivalent |
|-----|-----------------------------|
| `BEGIN` | method entry |
| `COMMIT` | method exits normally |
| `ROLLBACK` | unchecked exception escapes method |
| `SAVEPOINT` | `@Transactional(propagation = REQUIRES_NEW)` nested service |
| `READ COMMITTED` | `isolation = Isolation.READ_COMMITTED` |
| `REPEATABLE READ` | `isolation = Isolation.REPEATABLE_READ` |
| `SERIALIZABLE` | `isolation = Isolation.SERIALIZABLE` |

---

### 💥 War Story — The Transaction That Didn't Roll Back

A developer wrote:

```java
@Transactional
public void processOrder(Long orderId) throws OrderException {
    // ... updates order, charges card, sends email ...
    throw new OrderException("Card declined"); // checked exception
}
```

When `OrderException` (a checked exception) was thrown, the transaction **committed** instead of rolling back. The order was marked as "processed" even though the card failed.

**Why:** `@Transactional` by default only rolls back on `RuntimeException` (unchecked). Checked exceptions are assumed to be "expected business errors" where you've already handled state correctly.

Fix:
```java
@Transactional(rollbackFor = OrderException.class)
// Or: extend RuntimeException instead of Exception
public class OrderException extends RuntimeException { ... }
```

Another trap — `@Transactional` on a **private method** does nothing:

```java
@Service
public class OrderService {
    @Transactional  // ← silently ignored — Spring can't proxy private methods
    private void updateOrderInternal() { ... }
}
```

Spring generates a proxy class that wraps `@Transactional` public methods. Private methods bypass the proxy entirely.

---

### 📝 Practice Challenges

1. A `@Transactional` service method calls another `@Transactional` service method. Which transaction wins? What is `Propagation.REQUIRES_NEW` for?
2. You call a `@Transactional` method from within the same Spring bean. Does `@Transactional` apply? Why?
3. What SQL isolation level would you choose to prevent phantom reads in a seat-reservation system where two users might book the last seat simultaneously?

---

## 6. Indexes → @Index on Entities

### 🧠 Foundation — What indexes do in SQL

An index is a sorted data structure (B-tree by default) built alongside a table to speed up lookups:

```sql
-- Without index: full table scan → O(n)
SELECT * FROM employees WHERE email = 'jane@example.com';

-- Create an index on the email column
CREATE INDEX idx_employees_email ON employees(email);

-- Now the lookup uses the B-tree → O(log n)
EXPLAIN SELECT * FROM employees WHERE email = 'jane@example.com';
-- → Index Scan using idx_employees_email
```

Indexes have a cost: every INSERT/UPDATE/DELETE must also update the index. Don't index everything.

---

### 🔍 The JPA Equivalent

Indexes are declared on the `@Table` annotation:

```java
@Entity
@Table(
    name = "employees",
    indexes = {
        @Index(name = "idx_employees_email", columnList = "email", unique = true),
        @Index(name = "idx_employees_dept_salary", columnList = "department_id, salary")
    }
)
public class Employee {
    @Column(unique = true)  // ← also creates a unique index (shorthand for single column)
    private String email;
}
```

This generates at schema creation time:
```sql
CREATE UNIQUE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_dept_salary ON employees(department_id, salary);
```

**Unique constraint shorthand** (single column only):

```java
@Column(unique = true)
private String email;
// → CREATE UNIQUE INDEX ... ON employees(email)
```

---

### When JPA Automatically Creates Indexes

JPA creates an index automatically for:
- `@Id` fields → primary key (always indexed by the database)
- `@Column(unique = true)` → unique index
- `@ManyToOne @JoinColumn` → foreign key column (most databases auto-index FK columns)

---

### 💥 War Story — The Missing Composite Index

A team had:

```java
@Entity
@Table(name = "orders")
public class Order {
    private Long customerId;  // has an index
    private String status;    // no index
    private LocalDate createdAt; // has an index
}
```

Their most common query:
```java
@Query("SELECT o FROM Order o WHERE o.customerId = :cid AND o.status = 'PENDING' ORDER BY o.createdAt")
```

The database used the `customerId` index to find ~10,000 rows for that customer, then did a full scan of those 10,000 rows to filter by `status = 'PENDING'`.

Fix: composite index in the query's exact column order:

```java
@Table(indexes = {
    @Index(name = "idx_orders_customer_status_date",
           columnList = "customer_id, status, created_at")
})
```

Now the query uses the composite index and returns only PENDING orders directly. Query went from 800ms to 12ms.

---

### 📝 Practice Challenges

1. You have a table with 5M rows. A query runs `WHERE country = 'US' AND created_at > '2024-01-01'`. Design the optimal composite index and explain the column order.
2. Why does `@Column(unique = true)` on a `nullable` column fail if you insert two rows with `NULL` in that column? (Hint: how does SQL treat NULL = NULL?)
3. What's the downside of adding 10 indexes to a write-heavy table?

---

## 7. Subqueries and CTEs → JPQL and Native Queries

### 🧠 Foundation — What subqueries and CTEs do

A subquery is a query inside another query:

```sql
-- Subquery in WHERE: employees earning above company average
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- CTE: cleaner version of the same
WITH avg_salary AS (
    SELECT AVG(salary) AS avg FROM employees
)
SELECT e.*
FROM employees e, avg_salary a
WHERE e.salary > a.avg;
```

---

### 🔍 The JPA Equivalent

**JPQL subqueries** (JPQL supports subqueries in WHERE and HAVING, but NOT in FROM):

```java
// ✅ Subquery in WHERE clause
@Query("SELECT e FROM Employee e WHERE e.salary > " +
       "(SELECT AVG(e2.salary) FROM Employee e2)")
List<Employee> findAboveAverageSalary();

// ✅ Exists subquery
@Query("SELECT d FROM Department d WHERE EXISTS " +
       "(SELECT e FROM Employee e WHERE e.department = d AND e.salary > :threshold)")
List<Department> findDepartmentsWithHighEarners(@Param("threshold") BigDecimal threshold);
```

**JPQL does NOT support CTEs or subqueries in FROM.** If you need that:

```java
// ✅ Native SQL with CTE
@Query(value = """
    WITH dept_avg AS (
        SELECT department_id, AVG(salary) AS avg_salary
        FROM employees
        GROUP BY department_id
    )
    SELECT e.*
    FROM employees e
    JOIN dept_avg da ON e.department_id = da.department_id
    WHERE e.salary > da.avg_salary
    """, nativeQuery = true)
List<Employee> findAboveDeptAverage();
```

---

### The JPQL Limitation Map

| SQL feature | JPQL support | Workaround |
|-------------|-------------|------------|
| Subquery in WHERE | ✅ Yes | — |
| Subquery in HAVING | ✅ Yes | — |
| Subquery in FROM | ❌ No | `nativeQuery = true` |
| CTEs (WITH clause) | ❌ No | `nativeQuery = true` |
| Window functions | ❌ No | `nativeQuery = true` |
| UNION / INTERSECT | ❌ No | `nativeQuery = true` |
| Full-text search | ❌ No | `nativeQuery = true` |
| JSON operators | ❌ No | `nativeQuery = true` |

---

### 💥 War Story — The JPQL FROM Subquery That Blocked a Migration

A team had 200 `@Query` JPQL queries, including several that used FROM subqueries (they'd been testing on Hibernate 5 where some dialects tolerated this). When they upgraded to Hibernate 6 (stricter JPQL spec compliance), 23 queries failed with `HqlSemanticException: FROM subquery is not supported in JPQL`.

The migration took 4 days. Lesson: use `nativeQuery = true` from the start for any query that SQL Ch08 (Subqueries/CTEs) would express with a FROM subquery or CTE. JPQL is a subset of SQL, not a superset.

---

### 📝 Practice Challenges

1. Write a JPQL query that finds all products that have never been ordered (use `NOT EXISTS`).
2. You need to use a window function `RANK() OVER (PARTITION BY department ORDER BY salary DESC)`. Can you do this in JPQL? What do you do instead?
3. What are the risks of `nativeQuery = true` when you change your database from PostgreSQL to MySQL?

---

## 8. The N+1 Problem — When JPA Hides an O(n) Query Loop

### 🧠 Foundation — What N+1 is

This is the single most common JPA performance bug. It turns one SQL query into 1+N queries, where N is the number of rows in the first result.

```java
// Loading 100 departments:
List<Department> departments = departmentRepository.findAll();
// → SQL: SELECT * FROM departments   (1 query, returns 100 rows)

for (Department dept : departments) {
    System.out.println(dept.getEmployees().size()); // ← accessing the lazy collection
    // → SQL: SELECT * FROM employees WHERE department_id = ?  (1 query PER department)
}
// Total queries: 1 + 100 = 101 queries
// If each took 5ms: 1 × 5ms + 100 × 5ms = 505ms
// vs the correct JOIN: SELECT d.*, e.* FROM departments d JOIN employees e... → ~15ms
```

---

### 🔍 The Fix — JOIN FETCH

The `JOIN FETCH` keyword in JPQL tells Hibernate to generate a SQL JOIN instead of lazy loading:

```java
// ✅ JOIN FETCH — 1 query instead of N+1
@Query("SELECT DISTINCT d FROM Department d JOIN FETCH d.employees")
List<Department> findAllWithEmployees();
```

Generated SQL:
```sql
SELECT DISTINCT d.*, e.*
FROM departments d
INNER JOIN employees e ON e.department_id = d.id
```

**`@EntityGraph`** — alternative without JPQL:

```java
@EntityGraph(attributePaths = {"employees"})
List<Department> findAll(); // Spring Data JPA adds JOIN FETCH automatically
```

---

### The Query Count Debugging Checklist

To detect N+1 in development:

```properties
# application.properties — show all SQL
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Better: use p6spy or datasource-proxy to count queries per request
# Watch for: "SELECT * FROM X WHERE Y = ?" appearing N times in one request
```

---

### 💥 War Story — The Dashboard That Ran 847 Queries Per Page Load

A team's admin dashboard loaded 100 orders. Each order had a `customer`, `product`, and `shipping_address` lazy-loaded. Loading the dashboard triggered:

```
1 query: SELECT * FROM orders LIMIT 100
+ 100 queries for customers
+ 100 queries for products  
+ 100 queries for shipping_addresses
= 301 queries per page load
```

At 20 concurrent users: **6,020 queries/second** against the database. Database CPU hit 100%. The page load time was 8–12 seconds.

Fix — one `@Query` with three `JOIN FETCH`:

```java
@Query("SELECT DISTINCT o FROM Order o " +
       "JOIN FETCH o.customer " +
       "JOIN FETCH o.product " +
       "JOIN FETCH o.shippingAddress " +
       "ORDER BY o.createdAt DESC")
List<Order> findRecentOrdersWithDetails(Pageable pageable);
```

Page load dropped to 180ms. 301 queries → 1 query.

---

### 📝 Practice Challenges

1. You have `Post` → `Comment` (one-to-many). Loading 50 posts and then calling `post.getComments()` for each triggers how many queries?
2. What's the difference between `FetchType.LAZY` and `FetchType.EAGER`? When would you ever want `EAGER`?
3. You use `JOIN FETCH` on a `@OneToMany` and get duplicate `Post` objects in the result. Why? How do you fix it?

---

## Quick Reference: SQL → JPA Cheat Sheet

```
SQL Concept          │ JPA Equivalent
─────────────────────┼────────────────────────────────────────────────────
SELECT *             │ repository.findAll()
SELECT col WHERE     │ repository.findBy[Field]...()
ORDER BY             │ method suffix ...OrderBy[Field]Asc/Desc
LIMIT + OFFSET       │ Pageable / PageRequest.of(page, size)
WHERE (complex)      │ @Query JPQL or nativeQuery=true
GROUP BY + agg.      │ @Query with projection interface or DTO constructor
HAVING               │ @Query HAVING clause
INNER JOIN           │ @ManyToOne / navigation in @Query
LEFT JOIN            │ LEFT JOIN ... in @Query or @EntityGraph
WHERE IN (list)      │ findBy[Field]In(List<T> list)
WHERE IS NULL        │ findBy[Field]IsNull()
COUNT(*) per group   │ @Query with COUNT(e) GROUP BY
CREATE INDEX         │ @Table(indexes = {@Index(...)})
BEGIN/COMMIT         │ @Transactional on service method
ROLLBACK             │ unchecked exception escaping @Transactional method
FROM subquery / CTE  │ nativeQuery = true (JPQL doesn't support this)
N+1 lazy loads       │ JOIN FETCH in @Query or @EntityGraph
```

---

*[Back to Index](../00_INDEX.md) | [SQL Foundations](../../08_SQL/01_Foundations_Database_Basics.md) | [Java Path](../../PATH_JAVA_BACKEND.md)*


---

## Reality Check

**"JPA means you don't write SQL anymore"** ? JPA GENERATES SQL, and not understanding the generated SQL is where performance disasters live ([08_SQL, 07_Modern_Java, Enterprise 01c]): the N+1 query (the lazy-loaded collection that fires a query per parent � the single most common JPA performance bug), the fetch strategy (eager-versus-lazy, the join-fetch), the query that JPA generates inefficiently. "No more SQL" is the abstraction illusion � JPA is SQL generation, and the developer who does not understand the SQL it produces (via the query log, the EXPLAIN) ships the N+1 and the inefficient-fetch disasters, which is why SQL fluency is MORE necessary with JPA, not less.

**"The ORM handles the impedance mismatch transparently"** ? The object-relational impedance mismatch LEAKS through JPA in ways you must manage ([Enterprise 01c, 08_SQL]): the entity graph that lazy-loads unexpectedly (the LazyInitializationException outside the transaction), the bidirectional relationship that must be managed on both sides, the inheritance mapping, the identity-and-equals for entities. The fusion rounds drill the mismatch management (the fetch strategy, the transaction scope for lazy loading, the relationship ownership), and "transparent" is the illusion that produces the lazy-loading exceptions and the unexpected-query surprises.

**"JPA queries and SQL queries are interchangeable"** ? JPQL and native SQL differ, and knowing when to drop to native SQL is the skill ([08_SQL, 07_Modern_Java]): the complex analytical query with windows that JPQL cannot express (drop to native � [08_SQL] windows), the bulk operation that should be one SQL statement not entity-by-entity ([Enterprise 06] set-based), the JPQL that generates surprising SQL. The rounds drill choosing JPQL versus native versus a projection, and "interchangeable" misses that JPQL is object-oriented and limited while native SQL is full-power, and the analytical or bulk operations often need native.

**"Transaction management is automatic with @Transactional"** ? @Transactional has behavior you must understand ([07_Modern_Java Ch55, Enterprise 03]): the proxy self-invocation that skips the transaction ([Ch55]), the propagation and isolation levels, the rollback-only on unchecked exceptions (the checked exception that does NOT roll back by default � the surprise), the transaction scope for lazy loading. The fusion rounds drill the transaction semantics (the propagation, the rollback rules, the lazy-loading boundary), and "automatic" is exactly the assumption that produces the self-invocation bug, the wrong rollback behavior, and the outside-transaction lazy-loading exception.

**"Performance tuning JPA is adding caching"** ? JPA performance is understanding the generated queries FIRST, then the fetch strategies, then caching ([08_SQL, 13_DE, 14_MM optimization]): the N+1 fixed by join-fetch or entity-graph (not by caching the N+1), the query log that reveals what JPA actually runs ([13_DE profile-first]), the projection that fetches only needed columns, the batch-size for the collections. "Adding caching" is the reflexive non-answer that caches the inefficient queries � the [14_MM optimization] profile-first applies: understand the generated SQL, fix the N+1 and the fetch strategy, and cache last, because caching a query pattern that should not exist masks the problem the query-understanding would have fixed.
