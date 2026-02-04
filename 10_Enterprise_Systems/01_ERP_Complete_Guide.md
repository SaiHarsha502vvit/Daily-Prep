# 🏢 Enterprise Resource Planning (ERP) - Complete Developer Guide

## From Domain Knowledge to Working Code - Oracle ERP as Example

---

# PART 0: WHY THIS MATTERS FOR YOUR CAREER

```
╔══════════════════════════════════════════════════════════════════════════════╗
║     WHY EVERY DEVELOPER SHOULD UNDERSTAND ERP SYSTEMS                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE REALITY OF SOFTWARE INDUSTRY                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 70% of enterprise software is about:                                         │
│ • Managing MONEY (Finance, Accounting, Billing)                             │
│ • Managing PEOPLE (HR, Payroll, Hierarchy)                                  │
│ • Managing THINGS (Inventory, Logistics, Supply Chain)                      │
│ • Managing PROCESSES (Workflows, Approvals, Notifications)                  │
│                                                                              │
│ Companies like TCS, Infosys, Wipro, Accenture primarily work on ERP!        │
│                                                                              │
│ Understanding ERP = Understanding how businesses run = Job security!         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT YOU'LL LEARN                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. How to convert BUSINESS RULES into CODE                                  │
│ 2. How to design DATABASES for real-world problems                          │
│ 3. How to create UNIQUE IDs (Order numbers, Tracking IDs)                   │
│ 4. How to build HIERARCHY systems (Employee trees)                          │
│ 5. How to automate FINANCE (Invoices, Taxes, Payments)                      │
│ 6. How to build WORKFLOW engines (Approvals, Notifications)                 │
│ 7. How to handle EDGE CASES (What if tracking IDs run out?)                 │
│                                                                              │
│ This is what separates JUNIOR developers from SENIOR developers!            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: WHAT IS ERP? (The Big Picture)

## 🎯 Simple Definition

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  ERP = ONE SYSTEM that connects ALL departments of a company                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

BEFORE ERP (Chaos):
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Finance   │    │     HR      │    │  Inventory  │
│  (Excel)    │    │  (Papers)   │    │  (Another   │
│             │    │             │    │   Software) │
└─────────────┘    └─────────────┘    └─────────────┘
      ↓                  ↓                  ↓
   Different         Different          Different
   Data Format       Data Format        Data Format
      ↓                  ↓                  ↓
   ════════════════════════════════════════════
            NO CONNECTION! DATA SILOS!
   ════════════════════════════════════════════

AFTER ERP (Connected):
┌──────────────────────────────────────────────────────────────┐
│                     SINGLE ERP SYSTEM                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Finance  │  │    HR    │  │ Inventory│  │  Sales   │     │
│  │  Module  │──│  Module  │──│  Module  │──│  Module  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│         │            │             │             │           │
│         └────────────┴─────────────┴─────────────┘           │
│                          ↓                                    │
│              ┌───────────────────────┐                       │
│              │   SINGLE DATABASE     │                       │
│              │   (One Source of      │                       │
│              │    Truth!)            │                       │
│              └───────────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

## 🏗️ Oracle ERP Cloud Modules Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ORACLE ERP CLOUD - ALL MODULES                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        FINANCIAL MODULES                             │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ • General Ledger (GL)     - All financial transactions              │    │
│  │ • Accounts Payable (AP)   - Money you OWE to vendors                │    │
│  │ • Accounts Receivable (AR)- Money OWED to you by customers          │    │
│  │ • Fixed Assets (FA)       - Company property (computers, furniture) │    │
│  │ • Cash Management         - Bank accounts, reconciliation           │    │
│  │ • Tax Management          - GST, VAT, Income Tax automation         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          HCM MODULES                                 │    │
│  │                    (Human Capital Management)                        │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ • Core HR                 - Employee records, departments           │    │
│  │ • Payroll                 - Salary calculation, deductions          │    │
│  │ • Recruitment             - Job postings, applications, hiring      │    │
│  │ • Performance Management  - Goals, reviews, ratings                 │    │
│  │ • Learning Management     - Training courses, certifications        │    │
│  │ • Workforce Management    - Attendance, leaves, shifts              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          SCM MODULES                                 │    │
│  │                    (Supply Chain Management)                         │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ • Procurement             - Purchase orders, vendor management      │    │
│  │ • Inventory Management    - Stock levels, warehouses                │    │
│  │ • Order Management        - Customer orders, fulfillment            │    │
│  │ • Logistics               - Shipping, tracking, delivery            │    │
│  │ • Manufacturing           - Production planning, BOM                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CRM MODULES                                  │    │
│  │                  (Customer Relationship Management)                  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ • Sales Automation        - Leads, opportunities, quotes            │    │
│  │ • Marketing               - Campaigns, analytics                    │    │
│  │ • Service                 - Tickets, support, SLAs                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      PROJECT MANAGEMENT                              │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ • Project Costing         - Budget vs actual tracking               │    │
│  │ • Resource Management     - Who works on what                       │    │
│  │ • Time & Expense          - Timesheets, expense reports             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 2: HOW TO CONVERT DOMAIN KNOWLEDGE TO CODE

## 🧠 The Developer's Mindset

```
╔══════════════════════════════════════════════════════════════════════════════╗
║            THE 5-STEP DOMAIN TO CODE TRANSLATION                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Step 1: UNDERSTAND THE BUSINESS PROCESS
        ↓
        "What happens in real life?"
        ↓
Step 2: IDENTIFY THE ENTITIES (NOUNS)
        ↓
        "What are the THINGS involved?"
        → These become CLASSES and DATABASE TABLES
        ↓
Step 3: IDENTIFY THE ACTIONS (VERBS)
        ↓
        "What OPERATIONS happen?"
        → These become METHODS and API ENDPOINTS
        ↓
Step 4: IDENTIFY THE RULES (CONSTRAINTS)
        ↓
        "What rules MUST be followed?"
        → These become VALIDATIONS and BUSINESS LOGIC
        ↓
Step 5: IDENTIFY THE RELATIONSHIPS
        ↓
        "How do things CONNECT?"
        → These become FOREIGN KEYS and ASSOCIATIONS
```

## 📝 Example: Converting "Employee Hierarchy" to Code

### Step 1: Understand the Business Process

```
REAL WORLD SCENARIO:
┌────────────────────────────────────────────────────────────────┐
│ Reliance Industries has:                                       │
│                                                                │
│ • 1 Chairman (Mukesh Ambani)                                  │
│   └── 5 Executive Directors                                   │
│       └── 20 Vice Presidents                                  │
│           └── 100 General Managers                            │
│               └── 500 Managers                                │
│                   └── 2000 Team Leads                         │
│                       └── 10000 Employees                     │
│                                                                │
│ BUSINESS RULES:                                               │
│ 1. Every employee has ONE manager (except CEO)                │
│ 2. A manager can have MANY subordinates                       │
│ 3. Emails go UP the chain for approvals                       │
│ 4. Reports go DOWN the chain for information                  │
│ 5. Salary changes need manager + HR approval                  │
└────────────────────────────────────────────────────────────────┘
```

### Step 2: Identify Entities (→ Classes)

```
NOUNS in the scenario → CLASSES

┌─────────────────┐
│    Employee     │  ← Main entity
├─────────────────┤
│ - id            │
│ - name          │
│ - email         │
│ - designation   │
│ - department    │
│ - manager_id    │  ← Self-reference (hierarchy!)
│ - salary        │
│ - joining_date  │
└─────────────────┘

┌─────────────────┐
│   Department    │
├─────────────────┤
│ - id            │
│ - name          │
│ - head_id       │  ← FK to Employee
│ - budget        │
└─────────────────┘

┌─────────────────┐
│   Designation   │
├─────────────────┤
│ - id            │
│ - title         │
│ - level         │  ← 1=CEO, 2=VP, 3=Manager...
│ - min_salary    │
│ - max_salary    │
└─────────────────┘
```

### Step 3: Convert to Java Code

```java
// ═══════════════════════════════════════════════════════════════════
// ENTITY: Employee.java
// ═══════════════════════════════════════════════════════════════════
package com.company.erp.hr.entity;

import javax.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String employeeCode;  // EMP001, EMP002...

    // ══════════════════════════════════════════════════════════════
    // SELF-REFERENCING RELATIONSHIP (The Magic of Hierarchy!)
    // ══════════════════════════════════════════════════════════════

    // This employee's manager (Many employees → One manager)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;  // NULL for CEO!

    // Employees who report to this person (One manager → Many subordinates)
    @OneToMany(mappedBy = "manager", fetch = FetchType.LAZY)
    private List<Employee> subordinates;

    // ══════════════════════════════════════════════════════════════

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne
    @JoinColumn(name = "designation_id")
    private Designation designation;

    private Double salary;

    private LocalDate joiningDate;

    @Enumerated(EnumType.STRING)
    private EmployeeStatus status;  // ACTIVE, RESIGNED, TERMINATED

    // Getters, Setters, Constructors...

    // ══════════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ══════════════════════════════════════════════════════════════

    /**
     * Get full reporting chain up to CEO
     * Used for: Approval workflows, Email escalations
     */
    public List<Employee> getReportingChain() {
        List<Employee> chain = new ArrayList<>();
        Employee current = this.manager;

        while (current != null) {
            chain.add(current);
            current = current.getManager();
        }

        return chain;  // [Manager, Director, VP, CEO]
    }

    /**
     * Get all subordinates recursively (entire tree below)
     * Used for: Org charts, Mass communications
     */
    public List<Employee> getAllSubordinates() {
        List<Employee> allSubs = new ArrayList<>();
        collectSubordinates(this, allSubs);
        return allSubs;
    }

    private void collectSubordinates(Employee emp, List<Employee> result) {
        for (Employee sub : emp.getSubordinates()) {
            result.add(sub);
            collectSubordinates(sub, result);  // Recursion!
        }
    }

    /**
     * Check if this employee is a manager of given employee
     */
    public boolean isManagerOf(Employee other) {
        Employee current = other.getManager();
        while (current != null) {
            if (current.getId().equals(this.id)) {
                return true;
            }
            current = current.getManager();
        }
        return false;
    }

    /**
     * Get hierarchy level (CEO = 1, VP = 2, etc.)
     */
    public int getHierarchyLevel() {
        int level = 1;
        Employee current = this.manager;
        while (current != null) {
            level++;
            current = current.getManager();
        }
        return level;
    }
}
```

### Step 4: Database Schema

```sql
-- ═══════════════════════════════════════════════════════════════════
-- DATABASE: Employee Hierarchy Tables
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE designations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,          -- 'Software Engineer', 'Manager'
    level INT NOT NULL,                    -- 1=CEO, 2=VP, 3=Director...
    min_salary DECIMAL(15,2),
    max_salary DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,            -- 'Engineering', 'Finance'
    code VARCHAR(10) UNIQUE,               -- 'ENG', 'FIN'
    head_id BIGINT,                        -- FK to employees (circular)
    budget DECIMAL(18,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_code VARCHAR(20) UNIQUE,      -- 'EMP00001'
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),

    -- ════════════════════════════════════════════════════════════
    -- THE HIERARCHY MAGIC: Self-referencing Foreign Key!
    -- ════════════════════════════════════════════════════════════
    manager_id BIGINT,                     -- Points to another employee!
    FOREIGN KEY (manager_id) REFERENCES employees(id),
    -- ════════════════════════════════════════════════════════════

    department_id BIGINT,
    FOREIGN KEY (department_id) REFERENCES departments(id),

    designation_id BIGINT,
    FOREIGN KEY (designation_id) REFERENCES designations(id),

    salary DECIMAL(15,2),
    joining_date DATE,
    status ENUM('ACTIVE', 'RESIGNED', 'TERMINATED') DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add department head foreign key after employees table exists
ALTER TABLE departments
ADD FOREIGN KEY (head_id) REFERENCES employees(id);

-- ═══════════════════════════════════════════════════════════════════
-- USEFUL QUERIES FOR HIERARCHY
-- ═══════════════════════════════════════════════════════════════════

-- 1. Get all direct reports of a manager
SELECT * FROM employees WHERE manager_id = 5;

-- 2. Get reporting chain (using recursive CTE - MySQL 8+)
WITH RECURSIVE reporting_chain AS (
    -- Base case: Start with the employee
    SELECT id, first_name, last_name, manager_id, 1 as level
    FROM employees
    WHERE id = 100  -- Starting employee

    UNION ALL

    -- Recursive case: Get manager's manager
    SELECT e.id, e.first_name, e.last_name, e.manager_id, rc.level + 1
    FROM employees e
    INNER JOIN reporting_chain rc ON e.id = rc.manager_id
)
SELECT * FROM reporting_chain ORDER BY level;

-- 3. Get entire org tree below a manager
WITH RECURSIVE org_tree AS (
    -- Base case: The manager
    SELECT id, first_name, last_name, manager_id, 1 as depth
    FROM employees
    WHERE id = 5  -- Manager ID

    UNION ALL

    -- Recursive case: All subordinates
    SELECT e.id, e.first_name, e.last_name, e.manager_id, ot.depth + 1
    FROM employees e
    INNER JOIN org_tree ot ON e.manager_id = ot.id
)
SELECT * FROM org_tree ORDER BY depth, first_name;

-- 4. Count employees at each level
SELECT
    d.title as designation,
    d.level,
    COUNT(*) as employee_count
FROM employees e
JOIN designations d ON e.designation_id = d.id
GROUP BY d.level, d.title
ORDER BY d.level;
```

### Step 5: Tree View API for Frontend

```java
// ═══════════════════════════════════════════════════════════════════
// SERVICE: Build Tree View for Org Chart
// ═══════════════════════════════════════════════════════════════════

@Service
public class OrgChartService {

    @Autowired
    private EmployeeRepository employeeRepository;

    /**
     * Build tree structure for org chart visualization
     * This is what you see in HR systems!
     */
    public OrgNode buildOrgTree(Long rootEmployeeId) {
        Employee root = employeeRepository.findById(rootEmployeeId)
            .orElseThrow(() -> new NotFoundException("Employee not found"));

        return buildNodeRecursively(root);
    }

    private OrgNode buildNodeRecursively(Employee emp) {
        OrgNode node = new OrgNode();
        node.setId(emp.getId());
        node.setName(emp.getFirstName() + " " + emp.getLastName());
        node.setTitle(emp.getDesignation().getTitle());
        node.setDepartment(emp.getDepartment().getName());
        node.setEmail(emp.getEmail());
        node.setPhotoUrl(emp.getPhotoUrl());

        // Recursively build children
        List<OrgNode> children = new ArrayList<>();
        for (Employee sub : emp.getSubordinates()) {
            children.add(buildNodeRecursively(sub));
        }
        node.setChildren(children);

        return node;
    }

    /**
     * Get full company tree starting from CEO
     */
    public OrgNode getFullOrgChart() {
        // CEO has no manager (manager_id = null)
        Employee ceo = employeeRepository.findByManagerIsNull()
            .orElseThrow(() -> new NotFoundException("CEO not found"));

        return buildOrgTree(ceo.getId());
    }
}

// ═══════════════════════════════════════════════════════════════════
// DTO: Tree Node for Frontend
// ═══════════════════════════════════════════════════════════════════

public class OrgNode {
    private Long id;
    private String name;
    private String title;
    private String department;
    private String email;
    private String photoUrl;
    private List<OrgNode> children;  // Subordinates

    // Getters, setters...
}

// ═══════════════════════════════════════════════════════════════════
// REST API: Org Chart Endpoints
// ═══════════════════════════════════════════════════════════════════

@RestController
@RequestMapping("/api/org-chart")
public class OrgChartController {

    @Autowired
    private OrgChartService orgChartService;

    // GET /api/org-chart
    // Returns full organization tree
    @GetMapping
    public ResponseEntity<OrgNode> getFullOrgChart() {
        return ResponseEntity.ok(orgChartService.getFullOrgChart());
    }

    // GET /api/org-chart/employee/5
    // Returns tree starting from specific employee
    @GetMapping("/employee/{id}")
    public ResponseEntity<OrgNode> getOrgChartFromEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(orgChartService.buildOrgTree(id));
    }

    // GET /api/org-chart/employee/5/reporting-chain
    // Returns chain from employee to CEO
    @GetMapping("/employee/{id}/reporting-chain")
    public ResponseEntity<List<EmployeeDTO>> getReportingChain(@PathVariable Long id) {
        // Returns: [Direct Manager, Director, VP, CEO]
        return ResponseEntity.ok(orgChartService.getReportingChain(id));
    }
}
```

### Step 6: The JSON Response (What Frontend Receives)

```json
// GET /api/org-chart Response
{
  "id": 1,
  "name": "Mukesh Ambani",
  "title": "Chairman & MD",
  "department": "Executive Office",
  "email": "mukesh.ambani@ril.com",
  "photoUrl": "/images/emp/1.jpg",
  "children": [
    {
      "id": 10,
      "name": "Anant Ambani",
      "title": "Director",
      "department": "New Energy",
      "children": [
        {
          "id": 100,
          "name": "Rajesh Kumar",
          "title": "VP - Solar",
          "children": [
            {
              "id": 500,
              "name": "Priya Sharma",
              "title": "Manager",
              "children": [
                {
                  "id": 1001,
                  "name": "Amit Singh",
                  "title": "Senior Engineer",
                  "children": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": 11,
      "name": "Isha Ambani",
      "title": "Director",
      "department": "Retail",
      "children": [...]
    }
  ]
}
```

---

# PART 3: UNIQUE ID GENERATION SYSTEMS

## 🔢 The Problem Your Anna Mentioned

```
╔══════════════════════════════════════════════════════════════════════════════╗
║           THE TRACKING ID / ORDER NUMBER PROBLEM                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

SCENARIO (Amazon):
┌────────────────────────────────────────────────────────────────┐
│ You order a phone on Amazon                                    │
│                                                                │
│ Order ID:      402-1234567-8901234                            │
│ Tracking ID:   AMZN1234567890                                  │
│                                                                │
│ QUESTIONS:                                                     │
│ 1. How do they generate UNIQUE IDs?                           │
│ 2. What if millions of orders come at same millisecond?       │
│ 3. What if IDs "run out"?                                     │
│ 4. How to make IDs meaningful (not just random)?              │
│ 5. How to prevent guessing other people's orders?             │
└────────────────────────────────────────────────────────────────┘
```

## 📊 Different ID Generation Strategies

### Strategy 1: Auto-Increment (Simple but Problematic)

```java
// ═══════════════════════════════════════════════════════════════════
// STRATEGY 1: Database Auto-Increment
// ═══════════════════════════════════════════════════════════════════

// Database handles it automatically
// ID: 1, 2, 3, 4, 5...

// PROS:
// ✓ Simple
// ✓ Fast
// ✓ Built-in to database

// CONS:
// ✗ Predictable (security risk - user can guess order 1001)
// ✗ Reveals business info (competitor knows you have 1M orders)
// ✗ Doesn't work well with distributed systems
// ✗ Can run out (INT max = 2.1 billion)

@Entity
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // 1, 2, 3, 4...
}
```

### Strategy 2: UUID (Universally Unique Identifier)

```java
// ═══════════════════════════════════════════════════════════════════
// STRATEGY 2: UUID Generation
// ═══════════════════════════════════════════════════════════════════

import java.util.UUID;

public class OrderService {

    public Order createOrder(OrderRequest request) {
        Order order = new Order();

        // Generate UUID
        // Example: 550e8400-e29b-41d4-a716-446655440000
        order.setOrderId(UUID.randomUUID().toString());

        return orderRepository.save(order);
    }
}

// PROS:
// ✓ Globally unique (even across systems)
// ✓ Unpredictable (secure)
// ✓ No coordination needed between servers

// CONS:
// ✗ Long (36 characters)
// ✗ Not human-readable
// ✗ Poor database performance (random, not sequential)
// ✗ Customer can't easily tell you their order number
```

### Strategy 3: Composite Business ID (What Companies Actually Use!)

```java
// ═══════════════════════════════════════════════════════════════════
// STRATEGY 3: COMPOSITE BUSINESS IDs - THE REAL SOLUTION!
// ═══════════════════════════════════════════════════════════════════

/**
 * Format: PREFIX + DATE + SEQUENCE + CHECKSUM
 *
 * Examples:
 * Amazon:   402-1234567-8901234
 * Flipkart: OD123456789012345678
 * Zomato:   ZMT1234567890
 *
 * Oracle ERP: PO-2024-02-00001 (Purchase Order)
 *             INV-2024-02-00001 (Invoice)
 *             SO-2024-02-00001 (Sales Order)
 */

@Service
public class OrderIdGenerator {

    @Autowired
    private SequenceRepository sequenceRepository;

    /**
     * Generate order ID like: ORD-2024-02-00001
     *
     * Components:
     * - ORD: Order type prefix
     * - 2024: Year
     * - 02: Month
     * - 00001: Sequential number for this month
     */
    public synchronized String generateOrderId() {
        LocalDate today = LocalDate.now();

        String prefix = "ORD";
        String year = String.valueOf(today.getYear());
        String month = String.format("%02d", today.getMonthValue());

        // Get next sequence for this month
        long sequence = getNextSequence("ORDER", year + month);
        String seqStr = String.format("%05d", sequence);  // 00001, 00002...

        return prefix + "-" + year + "-" + month + "-" + seqStr;
        // Result: ORD-2024-02-00001
    }

    /**
     * Generate tracking ID like: TRK1234567890
     *
     * Components:
     * - TRK: Tracking prefix
     * - Timestamp component (hidden)
     * - Sequence
     * - Checksum digit
     */
    public String generateTrackingId() {
        String prefix = "TRK";

        // Use epoch seconds (gives us uniqueness)
        long epochSecond = Instant.now().getEpochSecond();

        // Get micro-sequence for same second
        long microSeq = getNextSequence("TRACKING", String.valueOf(epochSecond));

        // Combine: epoch + sequence
        String base = String.valueOf(epochSecond) + String.format("%03d", microSeq % 1000);

        // Add checksum for validation
        int checksum = calculateLuhnChecksum(base);

        return prefix + base + checksum;
        // Result: TRK16883404561234
    }

    /**
     * Luhn Algorithm - Used in credit cards, IDs
     * Detects accidental errors (typos)
     */
    private int calculateLuhnChecksum(String number) {
        int sum = 0;
        boolean alternate = false;

        for (int i = number.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(number.charAt(i));

            if (alternate) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            alternate = !alternate;
        }

        return (10 - (sum % 10)) % 10;
    }

    // ═══════════════════════════════════════════════════════════════
    // SEQUENCE TABLE - Database-backed sequences
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    private synchronized long getNextSequence(String type, String period) {
        // Lock and increment atomically
        Sequence seq = sequenceRepository.findByTypeAndPeriod(type, period)
            .orElse(new Sequence(type, period, 0L));

        seq.setCurrentValue(seq.getCurrentValue() + 1);
        sequenceRepository.save(seq);

        return seq.getCurrentValue();
    }
}

// ═══════════════════════════════════════════════════════════════════
// SEQUENCE TABLE ENTITY
// ═══════════════════════════════════════════════════════════════════

@Entity
@Table(name = "id_sequences")
public class Sequence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seq_type")
    private String type;       // ORDER, TRACKING, INVOICE...

    @Column(name = "seq_period")
    private String period;     // 202402, 1688340456...

    @Column(name = "current_value")
    private Long currentValue;

    // Unique constraint on (type, period)
}
```

### Strategy 4: Snowflake ID (Twitter's Solution for Massive Scale)

```java
// ═══════════════════════════════════════════════════════════════════
// STRATEGY 4: SNOWFLAKE ID (Used by Twitter, Discord, Instagram)
// ═══════════════════════════════════════════════════════════════════

/**
 * 64-bit ID broken into components:
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Unused  │    Timestamp (41 bits)   │ Node │    Sequence        │
 * │  1 bit   │   (69 years of millis)   │ 10b  │    (12 bits)       │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * - 41 bits timestamp: Milliseconds since custom epoch
 * - 10 bits machine ID: 1024 different servers
 * - 12 bits sequence: 4096 IDs per millisecond per server
 *
 * = 4096 * 1024 = 4 million IDs per millisecond globally!
 */

public class SnowflakeIdGenerator {

    // Custom epoch (Jan 1, 2020)
    private static final long CUSTOM_EPOCH = 1577836800000L;

    // Bit allocations
    private static final long NODE_ID_BITS = 10L;
    private static final long SEQUENCE_BITS = 12L;

    // Max values
    private static final long MAX_NODE_ID = (1L << NODE_ID_BITS) - 1;  // 1023
    private static final long MAX_SEQUENCE = (1L << SEQUENCE_BITS) - 1; // 4095

    private final long nodeId;
    private long lastTimestamp = -1L;
    private long sequence = 0L;

    public SnowflakeIdGenerator(long nodeId) {
        if (nodeId < 0 || nodeId > MAX_NODE_ID) {
            throw new IllegalArgumentException("Node ID must be between 0 and " + MAX_NODE_ID);
        }
        this.nodeId = nodeId;
    }

    public synchronized long nextId() {
        long currentTimestamp = System.currentTimeMillis();

        // Same millisecond - increment sequence
        if (currentTimestamp == lastTimestamp) {
            sequence = (sequence + 1) & MAX_SEQUENCE;

            // Sequence exhausted for this millisecond - wait for next
            if (sequence == 0) {
                currentTimestamp = waitNextMillis(currentTimestamp);
            }
        } else {
            // New millisecond - reset sequence
            sequence = 0;
        }

        lastTimestamp = currentTimestamp;

        // Construct the ID
        return ((currentTimestamp - CUSTOM_EPOCH) << (NODE_ID_BITS + SEQUENCE_BITS))
             | (nodeId << SEQUENCE_BITS)
             | sequence;
    }

    private long waitNextMillis(long currentTimestamp) {
        while (currentTimestamp <= lastTimestamp) {
            currentTimestamp = System.currentTimeMillis();
        }
        return currentTimestamp;
    }

    /**
     * Extract timestamp from snowflake ID
     * Useful for debugging, analytics
     */
    public static long extractTimestamp(long id) {
        return (id >> (NODE_ID_BITS + SEQUENCE_BITS)) + CUSTOM_EPOCH;
    }
}

// Usage:
SnowflakeIdGenerator generator = new SnowflakeIdGenerator(1);  // Server 1
long orderId = generator.nextId();  // 1234567890123456789

// Benefits:
// ✓ Time-sortable (IDs created later are always larger)
// ✓ No coordination between servers
// ✓ Extremely fast (no database call)
// ✓ 64-bit fits in a long (efficient storage)
```

## 🚨 What Happens When IDs "Run Out"?

```java
// ═══════════════════════════════════════════════════════════════════
// HANDLING ID EXHAUSTION - The Problem Your Anna Mentioned
// ═══════════════════════════════════════════════════════════════════

/**
 * SCENARIO: Tracking IDs exhausted
 *
 * Question: "If tracking IDs got over, then how null the tracking id?"
 *
 * ANSWER: Multiple strategies used in real systems
 */

@Service
public class TrackingIdService {

    /**
     * Strategy 1: Recycle old IDs
     *
     * Tracking IDs are TEMPORARY - once delivered, they can be reused
     * after a "cooling period" (typically 6 months to 1 year)
     */
    public String getRecycledTrackingId() {
        // Find old delivered orders (> 6 months)
        Optional<TrackingId> recyclable = trackingIdRepository
            .findOldDeliveredTracking(
                LocalDateTime.now().minusMonths(6)
            );

        if (recyclable.isPresent()) {
            // Recycle this tracking ID
            TrackingId trackingId = recyclable.get();
            trackingId.setStatus(TrackingStatus.RECYCLED);
            trackingId.setRecycledAt(LocalDateTime.now());
            return trackingId.getId();
        }

        // No recyclable IDs - generate new
        return generateNewTrackingId();
    }

    /**
     * Strategy 2: Expand the ID space
     *
     * TRK1234567890 (10 digits = 10 billion combinations)
     *       ↓
     * TRK12345678901234 (14 digits = 100 trillion combinations)
     */
    public String generateExpandedTrackingId() {
        // Check current utilization
        long usedIds = trackingIdRepository.countUsedIds();
        long maxIds = 10_000_000_000L;  // 10 billion

        if (usedIds > maxIds * 0.9) {  // 90% threshold
            // Expand to 14 digits
            return generateNewFormatTrackingId();
        }

        return generateOldFormatTrackingId();
    }

    /**
     * Strategy 3: Time-based expiry (Most common!)
     *
     * Tracking ID is only valid for 30 days
     * After that, it "expires" and returns NULL or "Expired"
     */
    public TrackingInfo getTrackingInfo(String trackingId) {
        Tracking tracking = trackingRepository.findById(trackingId)
            .orElse(null);

        if (tracking == null) {
            return TrackingInfo.notFound();
        }

        // Check if expired
        if (tracking.getCreatedAt().isBefore(LocalDateTime.now().minusDays(30))) {
            return TrackingInfo.expired();
        }

        return TrackingInfo.from(tracking);
    }

    /**
     * Strategy 4: Partitioned ID spaces
     *
     * Different regions/warehouses have different prefixes
     * BLR001234567 - Bangalore warehouse
     * MUM001234567 - Mumbai warehouse
     * DEL001234567 - Delhi warehouse
     *
     * This multiplies your ID space by number of partitions!
     */
    public String generatePartitionedTrackingId(String warehouseCode) {
        long sequence = getNextSequence(warehouseCode);
        return warehouseCode + String.format("%09d", sequence);
    }

    /**
     * Strategy 5: NULL tracking for non-trackable items
     *
     * Not everything needs tracking!
     * - Digital products: No tracking
     * - Small items clubbed together: Single tracking
     * - Local delivery: Different system
     */
    public Order createOrder(OrderRequest request) {
        Order order = new Order();
        order.setOrderId(generateOrderId());

        if (request.isDigitalProduct()) {
            order.setTrackingId(null);  // No tracking needed
            order.setTrackingStatus(TrackingStatus.NOT_APPLICABLE);
        } else if (request.isLocalDelivery()) {
            order.setTrackingId(null);
            order.setTrackingStatus(TrackingStatus.LOCAL_DELIVERY);
        } else {
            order.setTrackingId(generateTrackingId());
            order.setTrackingStatus(TrackingStatus.PENDING);
        }

        return orderRepository.save(order);
    }
}

// ═══════════════════════════════════════════════════════════════════
// DATABASE: Tracking ID Management
// ═══════════════════════════════════════════════════════════════════

CREATE TABLE tracking_ids (
    id VARCHAR(20) PRIMARY KEY,
    order_id BIGINT,
    status ENUM('ACTIVE', 'DELIVERED', 'EXPIRED', 'RECYCLED'),
    created_at TIMESTAMP,
    delivered_at TIMESTAMP,
    recycled_at TIMESTAMP,
    expiry_date TIMESTAMP,

    INDEX idx_status_date (status, delivered_at)
);

-- Recycle query
SELECT id FROM tracking_ids
WHERE status = 'DELIVERED'
AND delivered_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)
LIMIT 1
FOR UPDATE;  -- Lock the row

-- Utilization check
SELECT
    COUNT(*) as used,
    10000000000 as max_capacity,
    COUNT(*) * 100.0 / 10000000000 as utilization_percent
FROM tracking_ids
WHERE status IN ('ACTIVE', 'DELIVERED');
```

---

# PART 4: FINANCE MODULE - AUTOMATED ACCOUNTING

## 💰 Understanding Double-Entry Bookkeeping

```
╔══════════════════════════════════════════════════════════════════════════════╗
║           THE FOUNDATION OF ALL FINANCIAL SYSTEMS                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

GOLDEN RULE OF ACCOUNTING:
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│     For every DEBIT, there must be an equal CREDIT            │
│                                                                │
│     Assets = Liabilities + Equity                             │
│                                                                │
│     DEBIT increases:  Assets, Expenses                        │
│     CREDIT increases: Liabilities, Equity, Revenue            │
│                                                                │
└────────────────────────────────────────────────────────────────┘

EXAMPLE: Company buys a laptop for ₹60,000 cash

┌─────────────────────────────────────────────────────────────────┐
│ JOURNAL ENTRY:                                                  │
├───────────────┬──────────────┬──────────────┬──────────────────┤
│ Account       │ Type         │ Debit (₹)    │ Credit (₹)       │
├───────────────┼──────────────┼──────────────┼──────────────────┤
│ Equipment     │ Asset        │ 60,000       │                  │
│ Cash          │ Asset        │              │ 60,000           │
├───────────────┼──────────────┼──────────────┼──────────────────┤
│ TOTAL         │              │ 60,000       │ 60,000  ✓        │
└───────────────┴──────────────┴──────────────┴──────────────────┘

Explanation:
- Equipment (laptop) INCREASED → Debit Equipment
- Cash DECREASED → Credit Cash
- Both sides equal → Books are balanced!
```

## 📊 General Ledger System (The Heart of Finance)

```java
// ═══════════════════════════════════════════════════════════════════
// ENTITY: Chart of Accounts (All possible accounts)
// ═══════════════════════════════════════════════════════════════════

@Entity
@Table(name = "chart_of_accounts")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String accountCode;  // "1000", "1001", "2000"...

    private String accountName;  // "Cash", "Accounts Receivable"

    @Enumerated(EnumType.STRING)
    private AccountType type;    // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE

    @Enumerated(EnumType.STRING)
    private NormalBalance normalBalance;  // DEBIT or CREDIT

    @ManyToOne
    @JoinColumn(name = "parent_account_id")
    private Account parentAccount;  // For account hierarchy

    private Boolean isActive;

    private Boolean isControlAccount;  // Summary account
}

// ═══════════════════════════════════════════════════════════════════
// ENTITY: Journal Entry (Every financial transaction)
// ═══════════════════════════════════════════════════════════════════

@Entity
@Table(name = "journal_entries")
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String entryNumber;  // JE-2024-02-00001

    private LocalDate entryDate;

    private LocalDate postingDate;

    private String description;

    @Enumerated(EnumType.STRING)
    private JournalEntryStatus status;  // DRAFT, POSTED, REVERSED

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL)
    private List<JournalEntryLine> lines;  // Debit and Credit lines

    @ManyToOne
    @JoinColumn(name = "created_by")
    private Employee createdBy;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private Employee approvedBy;

    private String sourceModule;  // AP, AR, PAYROLL, MANUAL

    private Long sourceDocumentId;  // Invoice ID, Payment ID, etc.

    // ══════════════════════════════════════════════════════════════
    // VALIDATION: Debits must equal Credits!
    // ══════════════════════════════════════════════════════════════

    @PrePersist
    @PreUpdate
    public void validateBalance() {
        BigDecimal totalDebit = lines.stream()
            .map(JournalEntryLine::getDebitAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = lines.stream()
            .map(JournalEntryLine::getCreditAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new UnbalancedJournalEntryException(
                "Debits (" + totalDebit + ") must equal Credits (" + totalCredit + ")"
            );
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ENTITY: Journal Entry Line (Individual debit/credit)
// ═══════════════════════════════════════════════════════════════════

@Entity
@Table(name = "journal_entry_lines")
public class JournalEntryLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    private BigDecimal debitAmount = BigDecimal.ZERO;

    private BigDecimal creditAmount = BigDecimal.ZERO;

    private String description;

    // Dimensions for reporting
    @ManyToOne
    private Department department;

    @ManyToOne
    private Project project;

    @ManyToOne
    private CostCenter costCenter;
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE: Create Journal Entries
// ═══════════════════════════════════════════════════════════════════

@Service
public class GeneralLedgerService {

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private IdGeneratorService idGenerator;

    /**
     * Create journal entry for equipment purchase
     */
    @Transactional
    public JournalEntry recordEquipmentPurchase(
            BigDecimal amount,
            String description,
            Long equipmentAccountId,
            Long cashAccountId) {

        JournalEntry je = new JournalEntry();
        je.setEntryNumber(idGenerator.generateJournalEntryNumber());
        je.setEntryDate(LocalDate.now());
        je.setDescription(description);
        je.setStatus(JournalEntryStatus.DRAFT);
        je.setSourceModule("FIXED_ASSETS");

        // Line 1: Debit Equipment (Asset increases)
        JournalEntryLine debitLine = new JournalEntryLine();
        debitLine.setAccount(accountRepository.findById(equipmentAccountId).get());
        debitLine.setDebitAmount(amount);
        debitLine.setCreditAmount(BigDecimal.ZERO);
        debitLine.setDescription("Equipment purchase - " + description);

        // Line 2: Credit Cash (Asset decreases)
        JournalEntryLine creditLine = new JournalEntryLine();
        creditLine.setAccount(accountRepository.findById(cashAccountId).get());
        creditLine.setDebitAmount(BigDecimal.ZERO);
        creditLine.setCreditAmount(amount);
        creditLine.setDescription("Payment for equipment");

        je.setLines(Arrays.asList(debitLine, creditLine));

        return journalEntryRepository.save(je);  // Validation runs here!
    }

    /**
     * Record a sale (Revenue recognition)
     *
     * When customer buys product worth ₹10,000 on credit:
     * - Debit: Accounts Receivable (customer owes us)
     * - Credit: Sales Revenue (we earned money)
     */
    @Transactional
    public JournalEntry recordSale(SalesOrder order) {
        JournalEntry je = new JournalEntry();
        je.setEntryNumber(idGenerator.generateJournalEntryNumber());
        je.setEntryDate(LocalDate.now());
        je.setDescription("Sale to " + order.getCustomer().getName());
        je.setSourceModule("AR");  // Accounts Receivable
        je.setSourceDocumentId(order.getId());

        List<JournalEntryLine> lines = new ArrayList<>();

        // Debit: Accounts Receivable
        lines.add(createLine(
            ACCOUNTS_RECEIVABLE_CODE,
            order.getTotalAmount(),
            BigDecimal.ZERO
        ));

        // Credit: Sales Revenue
        lines.add(createLine(
            SALES_REVENUE_CODE,
            BigDecimal.ZERO,
            order.getSubtotal()
        ));

        // Credit: GST Payable (if applicable)
        if (order.getGstAmount().compareTo(BigDecimal.ZERO) > 0) {
            lines.add(createLine(
                GST_PAYABLE_CODE,
                BigDecimal.ZERO,
                order.getGstAmount()
            ));
        }

        je.setLines(lines);
        return journalEntryRepository.save(je);
    }

    /**
     * Record payment received from customer
     *
     * When customer pays ₹10,000:
     * - Debit: Bank/Cash (money received)
     * - Credit: Accounts Receivable (customer no longer owes)
     */
    @Transactional
    public JournalEntry recordPaymentReceived(Payment payment) {
        JournalEntry je = new JournalEntry();
        je.setEntryNumber(idGenerator.generateJournalEntryNumber());
        je.setEntryDate(payment.getPaymentDate());
        je.setDescription("Payment from " + payment.getCustomer().getName());
        je.setSourceModule("AR");
        je.setSourceDocumentId(payment.getId());

        List<JournalEntryLine> lines = new ArrayList<>();

        // Debit: Bank Account
        lines.add(createLine(
            payment.getBankAccount().getAccountCode(),
            payment.getAmount(),
            BigDecimal.ZERO
        ));

        // Credit: Accounts Receivable
        lines.add(createLine(
            ACCOUNTS_RECEIVABLE_CODE,
            BigDecimal.ZERO,
            payment.getAmount()
        ));

        je.setLines(lines);
        return journalEntryRepository.save(je);
    }
}
```

## 💵 Accounts Payable (AP) - Money You Owe

```java
// ═══════════════════════════════════════════════════════════════════
// ENTITY: Vendor Invoice (Bills you need to pay)
// ═══════════════════════════════════════════════════════════════════

@Entity
@Table(name = "vendor_invoices")
public class VendorInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String invoiceNumber;  // Vendor's invoice number

    @Column(unique = true)
    private String internalNumber;  // Our AP number: AP-2024-02-00001

    @ManyToOne
    private Vendor vendor;

    private LocalDate invoiceDate;

    private LocalDate dueDate;  // Payment due date

    private BigDecimal subtotal;

    private BigDecimal taxAmount;

    private BigDecimal totalAmount;

    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status;  // DRAFT, APPROVED, PARTIALLY_PAID, PAID, CANCELLED

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    private List<VendorInvoiceLine> lines;

    @OneToMany(mappedBy = "invoice")
    private List<Payment> payments;

    // ══════════════════════════════════════════════════════════════
    // BUSINESS LOGIC
    // ══════════════════════════════════════════════════════════════

    public BigDecimal getBalanceDue() {
        return totalAmount.subtract(paidAmount);
    }

    public boolean isOverdue() {
        return dueDate.isBefore(LocalDate.now()) &&
               status != InvoiceStatus.PAID;
    }

    public int getDaysOverdue() {
        if (!isOverdue()) return 0;
        return (int) ChronoUnit.DAYS.between(dueDate, LocalDate.now());
    }
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE: Accounts Payable Automation
// ═══════════════════════════════════════════════════════════════════

@Service
public class AccountsPayableService {

    @Autowired
    private VendorInvoiceRepository invoiceRepository;

    @Autowired
    private GeneralLedgerService glService;

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private NotificationService notificationService;

    /**
     * Process vendor invoice
     *
     * Steps:
     * 1. Validate invoice
     * 2. Match with Purchase Order (3-way matching)
     * 3. Create journal entry
     * 4. Send for approval if needed
     */
    @Transactional
    public VendorInvoice processInvoice(InvoiceRequest request) {

        // Step 1: Create invoice record
        VendorInvoice invoice = createInvoice(request);

        // Step 2: Three-way matching (Invoice vs PO vs Goods Receipt)
        MatchingResult match = performThreeWayMatching(invoice);

        if (!match.isMatched()) {
            // Send for manual review
            invoice.setStatus(InvoiceStatus.PENDING_REVIEW);
            invoice.setMatchingException(match.getExceptionReason());
            notificationService.notifyAPTeam(invoice, match);
            return invoiceRepository.save(invoice);
        }

        // Step 3: Create journal entry
        // Debit: Expense/Asset Account
        // Credit: Accounts Payable
        glService.recordVendorInvoice(invoice);

        // Step 4: Check if approval needed
        if (invoice.getTotalAmount().compareTo(APPROVAL_THRESHOLD) > 0) {
            workflowService.initiateApproval(invoice);
            invoice.setStatus(InvoiceStatus.PENDING_APPROVAL);
        } else {
            invoice.setStatus(InvoiceStatus.APPROVED);
        }

        return invoiceRepository.save(invoice);
    }

    /**
     * Three-Way Matching - Critical Control!
     *
     * Compares:
     * 1. Purchase Order (what we ordered)
     * 2. Goods Receipt (what we received)
     * 3. Vendor Invoice (what vendor is billing)
     *
     * Prevents: Paying for goods not ordered or not received
     */
    private MatchingResult performThreeWayMatching(VendorInvoice invoice) {

        PurchaseOrder po = invoice.getPurchaseOrder();
        GoodsReceipt gr = goodsReceiptRepository.findByPurchaseOrder(po);

        MatchingResult result = new MatchingResult();

        // Match quantities
        for (VendorInvoiceLine invoiceLine : invoice.getLines()) {
            POLine poLine = findMatchingPOLine(po, invoiceLine);
            GRLine grLine = findMatchingGRLine(gr, invoiceLine);

            // Check: Invoice qty <= Received qty
            if (invoiceLine.getQuantity().compareTo(grLine.getReceivedQuantity()) > 0) {
                result.addException("Invoiced qty exceeds received qty for item: " +
                    invoiceLine.getItem().getName());
            }

            // Check: Invoice price = PO price (with tolerance)
            BigDecimal priceDiff = invoiceLine.getUnitPrice()
                .subtract(poLine.getUnitPrice()).abs();
            BigDecimal tolerance = poLine.getUnitPrice()
                .multiply(new BigDecimal("0.01"));  // 1% tolerance

            if (priceDiff.compareTo(tolerance) > 0) {
                result.addException("Price mismatch for item: " +
                    invoiceLine.getItem().getName());
            }
        }

        return result;
    }

    /**
     * Automated Payment Run
     *
     * Scheduled job that pays all approved invoices due within X days
     */
    @Scheduled(cron = "0 0 9 * * MON,WED,FRI")  // 9 AM on Mon, Wed, Fri
    @Transactional
    public PaymentBatch runPaymentBatch() {

        LocalDate paymentDate = LocalDate.now();
        LocalDate dueCutoff = paymentDate.plusDays(3);  // Pay invoices due in 3 days

        // Find all approved, unpaid invoices due soon
        List<VendorInvoice> invoicesToPay = invoiceRepository
            .findByStatusAndDueDateLessThanEqual(
                InvoiceStatus.APPROVED,
                dueCutoff
            );

        // Group by vendor (one payment per vendor)
        Map<Vendor, List<VendorInvoice>> byVendor = invoicesToPay.stream()
            .collect(Collectors.groupingBy(VendorInvoice::getVendor));

        PaymentBatch batch = new PaymentBatch();
        batch.setPaymentDate(paymentDate);

        for (Map.Entry<Vendor, List<VendorInvoice>> entry : byVendor.entrySet()) {
            Payment payment = createPayment(entry.getKey(), entry.getValue());
            batch.addPayment(payment);
        }

        // Generate payment file for bank
        String paymentFile = generateBankPaymentFile(batch);

        // Upload to bank via API
        bankService.submitPayments(paymentFile);

        return batch;
    }
}
```

## 📈 Accounts Receivable (AR) - Money Owed to You

```java
// ═══════════════════════════════════════════════════════════════════
// SERVICE: Accounts Receivable Automation
// ═══════════════════════════════════════════════════════════════════

@Service
public class AccountsReceivableService {

    /**
     * Generate customer invoice
     */
    @Transactional
    public CustomerInvoice createInvoice(SalesOrder order) {

        CustomerInvoice invoice = new CustomerInvoice();
        invoice.setInvoiceNumber(idGenerator.generateInvoiceNumber());
        invoice.setCustomer(order.getCustomer());
        invoice.setInvoiceDate(LocalDate.now());

        // Payment terms: Net 30 days
        invoice.setDueDate(LocalDate.now().plusDays(
            order.getCustomer().getPaymentTerms().getDays()
        ));

        // Calculate amounts
        BigDecimal subtotal = BigDecimal.ZERO;
        for (SalesOrderLine line : order.getLines()) {
            InvoiceLine invoiceLine = new InvoiceLine();
            invoiceLine.setProduct(line.getProduct());
            invoiceLine.setQuantity(line.getQuantity());
            invoiceLine.setUnitPrice(line.getUnitPrice());
            invoiceLine.setAmount(line.getQuantity()
                .multiply(line.getUnitPrice()));

            subtotal = subtotal.add(invoiceLine.getAmount());
            invoice.addLine(invoiceLine);
        }

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(calculateTax(order));
        invoice.setTotalAmount(subtotal.add(invoice.getTaxAmount()));

        // Create journal entry
        glService.recordSale(invoice);

        // Send invoice to customer
        emailService.sendInvoice(invoice);

        return invoiceRepository.save(invoice);
    }

    /**
     * Automated Dunning (Payment Reminders)
     *
     * Scheduled job that sends reminders for overdue invoices
     */
    @Scheduled(cron = "0 0 10 * * *")  // 10 AM daily
    public void runDunningProcess() {

        LocalDate today = LocalDate.now();

        // Level 1: Reminder email (3 days overdue)
        List<CustomerInvoice> level1 = invoiceRepository
            .findByStatusAndDueDateBetween(
                InvoiceStatus.UNPAID,
                today.minusDays(7),
                today.minusDays(3)
            );

        for (CustomerInvoice invoice : level1) {
            if (invoice.getDunningLevel() < 1) {
                emailService.sendPaymentReminder(invoice);
                invoice.setDunningLevel(1);
                invoice.setLastDunningDate(today);
            }
        }

        // Level 2: Formal letter (14 days overdue)
        List<CustomerInvoice> level2 = invoiceRepository
            .findByStatusAndDueDateBefore(
                InvoiceStatus.UNPAID,
                today.minusDays(14)
            );

        for (CustomerInvoice invoice : level2) {
            if (invoice.getDunningLevel() < 2) {
                emailService.sendFormalPaymentRequest(invoice);
                notificationService.notifyAccountManager(invoice);
                invoice.setDunningLevel(2);
            }
        }

        // Level 3: Collections (30 days overdue)
        List<CustomerInvoice> level3 = invoiceRepository
            .findByStatusAndDueDateBefore(
                InvoiceStatus.UNPAID,
                today.minusDays(30)
            );

        for (CustomerInvoice invoice : level3) {
            if (invoice.getDunningLevel() < 3) {
                // Block further orders
                invoice.getCustomer().setCreditHold(true);
                // Escalate to collections
                collectionsService.escalate(invoice);
                invoice.setDunningLevel(3);
            }
        }
    }

    /**
     * Apply payment to invoices
     *
     * When customer pays, allocate to oldest invoices first (FIFO)
     */
    @Transactional
    public PaymentAllocation applyPayment(Payment payment) {

        Customer customer = payment.getCustomer();
        BigDecimal remainingAmount = payment.getAmount();

        // Get unpaid invoices, oldest first
        List<CustomerInvoice> unpaidInvoices = invoiceRepository
            .findByCustomerAndStatusOrderByDueDateAsc(
                customer,
                InvoiceStatus.UNPAID
            );

        PaymentAllocation allocation = new PaymentAllocation();
        allocation.setPayment(payment);

        for (CustomerInvoice invoice : unpaidInvoices) {
            if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal amountToApply = remainingAmount.min(invoice.getBalanceDue());

            // Record allocation
            AllocationLine line = new AllocationLine();
            line.setInvoice(invoice);
            line.setAmount(amountToApply);
            allocation.addLine(line);

            // Update invoice
            invoice.setPaidAmount(invoice.getPaidAmount().add(amountToApply));
            if (invoice.getBalanceDue().compareTo(BigDecimal.ZERO) == 0) {
                invoice.setStatus(InvoiceStatus.PAID);
            }

            remainingAmount = remainingAmount.subtract(amountToApply);
        }

        // If excess payment, create credit memo
        if (remainingAmount.compareTo(BigDecimal.ZERO) > 0) {
            createCustomerCredit(customer, remainingAmount);
        }

        // Create journal entry for payment
        glService.recordPaymentReceived(payment);

        return allocation;
    }
}
```

---

# PART 5: TAX AUTOMATION (GST Example)

## 🧾 How Tax Calculation Works

```java
// ═══════════════════════════════════════════════════════════════════
// GST CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════════

/**
 * GST in India:
 * - CGST: Central GST (goes to central government)
 * - SGST: State GST (goes to state government)
 * - IGST: Integrated GST (inter-state transactions)
 *
 * Rates: 0%, 5%, 12%, 18%, 28%
 */

@Service
public class GSTCalculationService {

    @Autowired
    private TaxRateRepository taxRateRepository;

    /**
     * Calculate GST for an invoice line
     */
    public TaxCalculation calculateGST(
            InvoiceLine line,
            Address sellerAddress,
            Address buyerAddress) {

        TaxCalculation calc = new TaxCalculation();

        // Get HSN code and tax rate
        String hsnCode = line.getProduct().getHsnCode();
        TaxRate taxRate = taxRateRepository.findByHsnCode(hsnCode);

        BigDecimal taxableValue = line.getAmount();
        BigDecimal rate = taxRate.getRate();  // e.g., 18%

        // Determine if IGST or CGST+SGST
        boolean isInterState = !sellerAddress.getState()
            .equals(buyerAddress.getState());

        if (isInterState) {
            // Inter-state: IGST only
            calc.setIgst(taxableValue.multiply(rate).divide(new BigDecimal("100")));
            calc.setCgst(BigDecimal.ZERO);
            calc.setSgst(BigDecimal.ZERO);
        } else {
            // Intra-state: CGST + SGST (split equally)
            BigDecimal halfRate = rate.divide(new BigDecimal("2"));
            calc.setIgst(BigDecimal.ZERO);
            calc.setCgst(taxableValue.multiply(halfRate).divide(new BigDecimal("100")));
            calc.setSgst(taxableValue.multiply(halfRate).divide(new BigDecimal("100")));
        }

        calc.setTotalTax(calc.getIgst().add(calc.getCgst()).add(calc.getSgst()));
        calc.setHsnCode(hsnCode);
        calc.setTaxRate(rate);

        return calc;
    }

    /**
     * Generate GST Returns data (GSTR-1, GSTR-3B)
     */
    public GSTR1Report generateGSTR1(LocalDate fromDate, LocalDate toDate) {

        GSTR1Report report = new GSTR1Report();
        report.setPeriod(fromDate + " to " + toDate);

        // B2B: Business to Business sales
        List<CustomerInvoice> b2bInvoices = invoiceRepository
            .findByDateBetweenAndCustomerTypeAndStatus(
                fromDate, toDate,
                CustomerType.BUSINESS,
                InvoiceStatus.POSTED
            );

        for (CustomerInvoice invoice : b2bInvoices) {
            B2BRecord record = new B2BRecord();
            record.setGstin(invoice.getCustomer().getGstin());
            record.setInvoiceNumber(invoice.getInvoiceNumber());
            record.setInvoiceDate(invoice.getInvoiceDate());
            record.setTaxableValue(invoice.getSubtotal());
            record.setIgst(invoice.getIgstAmount());
            record.setCgst(invoice.getCgstAmount());
            record.setSgst(invoice.getSgstAmount());

            report.addB2BRecord(record);
        }

        // B2C: Business to Consumer sales
        // Grouped by state and rate
        List<Object[]> b2cSummary = invoiceRepository
            .getB2CSummary(fromDate, toDate);

        for (Object[] row : b2cSummary) {
            B2CRecord record = new B2CRecord();
            record.setState((String) row[0]);
            record.setTaxRate((BigDecimal) row[1]);
            record.setTaxableValue((BigDecimal) row[2]);
            record.setTaxAmount((BigDecimal) row[3]);

            report.addB2CRecord(record);
        }

        return report;
    }
}

// ═══════════════════════════════════════════════════════════════════
// DATABASE: Tax Configuration
// ═══════════════════════════════════════════════════════════════════

CREATE TABLE tax_rates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hsn_code VARCHAR(8) NOT NULL,          -- Harmonized System of Nomenclature
    description VARCHAR(255),
    tax_rate DECIMAL(5,2) NOT NULL,        -- 0, 5, 12, 18, 28
    effective_from DATE NOT NULL,
    effective_to DATE,

    INDEX idx_hsn (hsn_code, effective_from)
);

-- Sample data
INSERT INTO tax_rates (hsn_code, description, tax_rate, effective_from) VALUES
('8471', 'Computers and laptops', 18.00, '2017-07-01'),
('6109', 'T-shirts', 5.00, '2017-07-01'),
('8517', 'Mobile phones', 18.00, '2017-07-01'),
('2106', 'Food preparations', 12.00, '2017-07-01');

-- Tax transactions for reporting
CREATE TABLE tax_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_type ENUM('OUTPUT', 'INPUT'),  -- Sales tax vs Purchase tax
    invoice_id BIGINT,
    invoice_type VARCHAR(20),                   -- CUSTOMER_INVOICE, VENDOR_INVOICE
    tax_date DATE,
    hsn_code VARCHAR(8),
    taxable_value DECIMAL(15,2),
    igst_amount DECIMAL(15,2) DEFAULT 0,
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    state_code VARCHAR(2),
    gstin VARCHAR(15),                          -- GST number of counterparty

    INDEX idx_date_type (tax_date, transaction_type)
);
```

---

# PART 6: WORKFLOW ENGINE - APPROVAL AUTOMATION

## 🔄 How Approval Workflows Work

```java
// ═══════════════════════════════════════════════════════════════════
// ENTITY: Workflow Definition (The Rules)
// ═══════════════════════════════════════════════════════════════════

/**
 * Example workflow: Purchase Order Approval
 *
 * IF amount < 50,000 → Auto-approve
 * IF amount 50,000 - 2,00,000 → Manager approval
 * IF amount 2,00,000 - 10,00,000 → Director approval
 * IF amount > 10,00,000 → VP + CFO approval (parallel)
 */

@Entity
@Table(name = "workflow_definitions")
public class WorkflowDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;  // "Purchase Order Approval"

    private String entityType;  // "PurchaseOrder", "Invoice", "LeaveRequest"

    private Boolean isActive;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL)
    @OrderBy("stepOrder")
    private List<WorkflowStep> steps;
}

@Entity
@Table(name = "workflow_steps")
public class WorkflowStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private WorkflowDefinition workflow;

    private Integer stepOrder;

    private String stepName;  // "Manager Approval", "Director Approval"

    // Condition: When does this step apply?
    private String conditionExpression;  // "amount >= 50000 AND amount < 200000"

    // Approver determination
    @Enumerated(EnumType.STRING)
    private ApproverType approverType;  // ROLE, HIERARCHY, SPECIFIC_USER

    private String approverValue;  // Role name, hierarchy level, user ID

    // Parallel or sequential?
    @Enumerated(EnumType.STRING)
    private ApprovalMode approvalMode;  // SEQUENTIAL, PARALLEL, ANY_ONE

    // Time limits
    private Integer slaHours;  // Auto-escalate after X hours

    private Long escalationUserId;  // Who to escalate to
}

// ═══════════════════════════════════════════════════════════════════
// ENTITY: Workflow Instance (Running approval)
// ═══════════════════════════════════════════════════════════════════

@Entity
@Table(name = "workflow_instances")
public class WorkflowInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private WorkflowDefinition workflowDefinition;

    private String entityType;  // "PurchaseOrder"

    private Long entityId;  // The PO being approved

    @Enumerated(EnumType.STRING)
    private WorkflowStatus status;  // IN_PROGRESS, APPROVED, REJECTED, CANCELLED

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @ManyToOne
    private Employee initiator;

    @OneToMany(mappedBy = "workflowInstance", cascade = CascadeType.ALL)
    private List<ApprovalTask> tasks;
}

@Entity
@Table(name = "approval_tasks")
public class ApprovalTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private WorkflowInstance workflowInstance;

    @ManyToOne
    private WorkflowStep step;

    @ManyToOne
    private Employee assignee;  // Who needs to approve

    @Enumerated(EnumType.STRING)
    private TaskStatus status;  // PENDING, APPROVED, REJECTED, DELEGATED

    private LocalDateTime assignedAt;

    private LocalDateTime dueAt;  // SLA deadline

    private LocalDateTime completedAt;

    private String comments;
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE: Workflow Engine
// ═══════════════════════════════════════════════════════════════════

@Service
public class WorkflowEngine {

    @Autowired
    private WorkflowDefinitionRepository workflowRepo;

    @Autowired
    private WorkflowInstanceRepository instanceRepo;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ExpressionEvaluator expressionEvaluator;

    /**
     * Start approval workflow for an entity
     */
    @Transactional
    public WorkflowInstance startWorkflow(String entityType, Long entityId,
            Map<String, Object> context) {

        // Find applicable workflow
        WorkflowDefinition workflow = workflowRepo
            .findByEntityTypeAndIsActive(entityType, true)
            .orElseThrow(() -> new NoWorkflowException("No workflow for " + entityType));

        // Create instance
        WorkflowInstance instance = new WorkflowInstance();
        instance.setWorkflowDefinition(workflow);
        instance.setEntityType(entityType);
        instance.setEntityId(entityId);
        instance.setStatus(WorkflowStatus.IN_PROGRESS);
        instance.setStartedAt(LocalDateTime.now());
        instance.setInitiator(SecurityContext.getCurrentEmployee());

        instanceRepo.save(instance);

        // Find first applicable step
        WorkflowStep firstStep = findApplicableStep(workflow.getSteps(), context);

        if (firstStep == null) {
            // No approval needed - auto-approve
            instance.setStatus(WorkflowStatus.APPROVED);
            instance.setCompletedAt(LocalDateTime.now());
            return instanceRepo.save(instance);
        }

        // Create approval tasks
        createTasksForStep(instance, firstStep, context);

        return instance;
    }

    /**
     * Find which step applies based on conditions
     */
    private WorkflowStep findApplicableStep(List<WorkflowStep> steps,
            Map<String, Object> context) {

        for (WorkflowStep step : steps) {
            if (step.getConditionExpression() == null ||
                expressionEvaluator.evaluate(step.getConditionExpression(), context)) {
                return step;
            }
        }
        return null;
    }

    /**
     * Create approval tasks for a step
     */
    private void createTasksForStep(WorkflowInstance instance, WorkflowStep step,
            Map<String, Object> context) {

        List<Employee> approvers = determineApprovers(step, context);

        for (Employee approver : approvers) {
            ApprovalTask task = new ApprovalTask();
            task.setWorkflowInstance(instance);
            task.setStep(step);
            task.setAssignee(approver);
            task.setStatus(TaskStatus.PENDING);
            task.setAssignedAt(LocalDateTime.now());

            if (step.getSlaHours() != null) {
                task.setDueAt(LocalDateTime.now().plusHours(step.getSlaHours()));
            }

            instance.getTasks().add(task);

            // Send notification
            notificationService.sendApprovalRequest(task);
        }
    }

    /**
     * Determine who should approve
     */
    private List<Employee> determineApprovers(WorkflowStep step,
            Map<String, Object> context) {

        switch (step.getApproverType()) {

            case HIERARCHY:
                // Get manager of requester
                Employee requester = (Employee) context.get("requester");
                return Collections.singletonList(requester.getManager());

            case ROLE:
                // Get all users with this role
                return employeeRepository.findByRole(step.getApproverValue());

            case SPECIFIC_USER:
                return Collections.singletonList(
                    employeeRepository.findById(Long.parseLong(step.getApproverValue()))
                        .orElseThrow()
                );

            case DEPARTMENT_HEAD:
                Employee req = (Employee) context.get("requester");
                return Collections.singletonList(req.getDepartment().getHead());

            default:
                throw new IllegalStateException("Unknown approver type");
        }
    }

    /**
     * Process approval/rejection
     */
    @Transactional
    public void processApproval(Long taskId, boolean approved, String comments) {

        ApprovalTask task = taskRepository.findById(taskId).orElseThrow();
        WorkflowInstance instance = task.getWorkflowInstance();

        // Verify current user is the assignee
        if (!task.getAssignee().equals(SecurityContext.getCurrentEmployee())) {
            throw new UnauthorizedException("Not your task to approve");
        }

        task.setStatus(approved ? TaskStatus.APPROVED : TaskStatus.REJECTED);
        task.setCompletedAt(LocalDateTime.now());
        task.setComments(comments);

        if (!approved) {
            // Rejection ends the workflow
            instance.setStatus(WorkflowStatus.REJECTED);
            instance.setCompletedAt(LocalDateTime.now());

            // Notify initiator
            notificationService.sendRejectionNotification(instance, task);
            return;
        }

        // Check if step is complete (all/any approved)
        WorkflowStep step = task.getStep();
        List<ApprovalTask> stepTasks = instance.getTasks().stream()
            .filter(t -> t.getStep().equals(step))
            .collect(Collectors.toList());

        boolean stepComplete = false;

        switch (step.getApprovalMode()) {
            case ANY_ONE:
                stepComplete = true;  // One approval is enough
                // Cancel other pending tasks
                stepTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.PENDING)
                    .forEach(t -> t.setStatus(TaskStatus.CANCELLED));
                break;

            case PARALLEL:
            case SEQUENTIAL:
                stepComplete = stepTasks.stream()
                    .allMatch(t -> t.getStatus() == TaskStatus.APPROVED);
                break;
        }

        if (stepComplete) {
            // Move to next step or complete
            WorkflowStep nextStep = findNextStep(instance, step);

            if (nextStep == null) {
                // Workflow complete!
                instance.setStatus(WorkflowStatus.APPROVED);
                instance.setCompletedAt(LocalDateTime.now());

                // Execute post-approval action
                executePostApprovalAction(instance);

            } else {
                // Create tasks for next step
                Map<String, Object> context = buildContext(instance);
                createTasksForStep(instance, nextStep, context);
            }
        }
    }

    /**
     * SLA monitoring - Auto-escalate overdue tasks
     */
    @Scheduled(cron = "0 */15 * * * *")  // Every 15 minutes
    public void checkSLABreaches() {

        List<ApprovalTask> overdueTasks = taskRepository
            .findByStatusAndDueAtBefore(TaskStatus.PENDING, LocalDateTime.now());

        for (ApprovalTask task : overdueTasks) {
            WorkflowStep step = task.getStep();

            if (step.getEscalationUserId() != null) {
                // Escalate to configured user
                Employee escalationTarget = employeeRepository
                    .findById(step.getEscalationUserId()).orElse(null);

                if (escalationTarget != null) {
                    notificationService.sendEscalationNotification(task, escalationTarget);

                    // Optionally reassign
                    task.setAssignee(escalationTarget);
                    task.setDueAt(LocalDateTime.now().plusHours(step.getSlaHours()));
                }
            } else {
                // Escalate to assignee's manager
                Employee manager = task.getAssignee().getManager();
                if (manager != null) {
                    notificationService.sendEscalationNotification(task, manager);
                }
            }
        }
    }
}
```

## 📧 Email Notifications in Hierarchy

```java
// ═══════════════════════════════════════════════════════════════════
// SERVICE: Hierarchical Email Notifications
// ═══════════════════════════════════════════════════════════════════

@Service
public class NotificationService {

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmployeeRepository employeeRepository;

    /**
     * Send approval request to approver
     */
    public void sendApprovalRequest(ApprovalTask task) {

        WorkflowInstance instance = task.getWorkflowInstance();
        Employee approver = task.getAssignee();
        Employee requester = instance.getInitiator();

        // Build email
        Email email = Email.builder()
            .to(approver.getEmail())
            .subject("[Action Required] " + instance.getEntityType() +
                     " Approval - " + instance.getEntityId())
            .template("approval-request")
            .variable("approverName", approver.getFirstName())
            .variable("requesterName", requester.getFullName())
            .variable("entityType", instance.getEntityType())
            .variable("entityDetails", getEntityDetails(instance))
            .variable("approvalLink", buildApprovalLink(task))
            .variable("dueDate", task.getDueAt())
            .build();

        emailService.sendAsync(email);

        // Also send push notification if mobile app
        pushNotificationService.send(approver,
            "New approval request from " + requester.getFullName());
    }

    /**
     * Notify reporting chain (up the hierarchy)
     *
     * Used for: Major decisions, urgent escalations
     */
    public void notifyReportingChain(Employee startFrom, String subject, String message) {

        Employee current = startFrom.getManager();

        while (current != null) {
            Email email = Email.builder()
                .to(current.getEmail())
                .subject("[FYI] " + subject)
                .template("chain-notification")
                .variable("name", current.getFirstName())
                .variable("message", message)
                .variable("originatedFrom", startFrom.getFullName())
                .build();

            emailService.sendAsync(email);

            current = current.getManager();  // Move up the chain
        }
    }

    /**
     * Notify all subordinates (down the hierarchy)
     *
     * Used for: Announcements, policy changes
     */
    public void notifyAllSubordinates(Employee manager, String subject, String message) {

        List<Employee> allSubordinates = manager.getAllSubordinates();

        for (Employee subordinate : allSubordinates) {
            Email email = Email.builder()
                .to(subordinate.getEmail())
                .subject("[Announcement] " + subject)
                .template("announcement")
                .variable("name", subordinate.getFirstName())
                .variable("message", message)
                .variable("from", manager.getFullName())
                .build();

            emailService.sendAsync(email);
        }
    }

    /**
     * Send email based on workflow step configuration
     */
    public void sendWorkflowNotification(ApprovalTask task,
            NotificationType type, Map<String, Object> context) {

        WorkflowStep step = task.getStep();
        WorkflowInstance instance = task.getWorkflowInstance();

        // Get notification template for this step
        NotificationTemplate template = templateRepository
            .findByWorkflowStepAndType(step, type);

        if (template == null) {
            // Use default template
            template = templateRepository.findDefaultTemplate(type);
        }

        // Determine recipients based on configuration
        List<Employee> recipients = new ArrayList<>();

        switch (template.getRecipientType()) {
            case INITIATOR:
                recipients.add(instance.getInitiator());
                break;
            case APPROVER:
                recipients.add(task.getAssignee());
                break;
            case INITIATOR_CHAIN:
                recipients.add(instance.getInitiator());
                recipients.addAll(instance.getInitiator().getReportingChain());
                break;
            case DEPARTMENT_ALL:
                recipients.addAll(instance.getInitiator()
                    .getDepartment().getAllEmployees());
                break;
        }

        // Send to each recipient
        for (Employee recipient : recipients) {
            String processedBody = processTemplate(template.getBody(), context);
            String processedSubject = processTemplate(template.getSubject(), context);

            emailService.send(Email.builder()
                .to(recipient.getEmail())
                .subject(processedSubject)
                .body(processedBody)
                .build());
        }
    }
}
```

---

# PART 7: ORDER MANAGEMENT SYSTEM (E-Commerce)

## 🛒 Complete Order Flow

```java
// ═══════════════════════════════════════════════════════════════════
// ENTITY: Order (The heart of e-commerce)
// ═══════════════════════════════════════════════════════════════════

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String orderNumber;  // ORD-2024-02-00001

    @ManyToOne
    private Customer customer;

    @Embedded
    private Address shippingAddress;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "line1", column = @Column(name = "billing_line1")),
        // ... other overrides
    })
    private Address billingAddress;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderLine> lines;

    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal shippingAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    /*
        CREATED → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                     ↓
                  CANCELLED
    */

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;
    // PENDING, AUTHORIZED, CAPTURED, REFUNDED

    private String paymentMethod;  // CARD, UPI, COD, WALLET

    private String transactionId;

    // Shipping
    private String trackingNumber;
    private String carrierCode;  // DELHIVERY, BLUEDART, DTDC
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime expectedDeliveryDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Audit trail
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderStatusHistory> statusHistory;
}

@Entity
@Table(name = "order_lines")
public class OrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Order order;

    @ManyToOne
    private Product product;

    private String productSnapshot;  // JSON of product at time of order

    private Integer quantity;

    private BigDecimal unitPrice;

    private BigDecimal discount;

    private BigDecimal tax;

    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    private FulfillmentStatus fulfillmentStatus;
    // PENDING, ALLOCATED, PICKED, PACKED, SHIPPED, DELIVERED, RETURNED
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE: Order Management
// ═══════════════════════════════════════════════════════════════════

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private ShippingService shippingService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private IdGeneratorService idGenerator;

    /**
     * Complete order creation flow
     */
    @Transactional
    public Order createOrder(OrderRequest request) {

        // Step 1: Validate cart items
        validateCart(request.getItems());

        // Step 2: Reserve inventory (soft lock)
        List<InventoryReservation> reservations =
            inventoryService.reserveItems(request.getItems());

        try {
            // Step 3: Create order
            Order order = new Order();
            order.setOrderNumber(idGenerator.generateOrderNumber());
            order.setCustomer(request.getCustomer());
            order.setShippingAddress(request.getShippingAddress());
            order.setBillingAddress(request.getBillingAddress());
            order.setStatus(OrderStatus.CREATED);
            order.setPaymentStatus(PaymentStatus.PENDING);
            order.setCreatedAt(LocalDateTime.now());

            // Step 4: Create order lines
            BigDecimal subtotal = BigDecimal.ZERO;
            for (CartItem item : request.getItems()) {
                OrderLine line = createOrderLine(order, item);
                order.getLines().add(line);
                subtotal = subtotal.add(line.getTotal());
            }

            // Step 5: Calculate totals
            order.setSubtotal(subtotal);
            order.setTaxAmount(calculateTax(order));
            order.setShippingAmount(calculateShipping(order));
            order.setDiscountAmount(applyPromotions(order, request.getPromoCode()));
            order.setTotalAmount(
                subtotal
                    .add(order.getTaxAmount())
                    .add(order.getShippingAmount())
                    .subtract(order.getDiscountAmount())
            );

            // Step 6: Process payment
            PaymentResult paymentResult = paymentService.processPayment(
                request.getPaymentDetails(),
                order.getTotalAmount()
            );

            if (!paymentResult.isSuccess()) {
                // Payment failed - release inventory
                inventoryService.releaseReservations(reservations);
                throw new PaymentFailedException(paymentResult.getError());
            }

            order.setPaymentStatus(PaymentStatus.CAPTURED);
            order.setTransactionId(paymentResult.getTransactionId());
            order.setPaymentMethod(request.getPaymentDetails().getMethod());

            // Step 7: Confirm inventory allocation
            inventoryService.confirmReservations(reservations);

            // Step 8: Update order status
            order.setStatus(OrderStatus.CONFIRMED);
            addStatusHistory(order, OrderStatus.CONFIRMED, "Order confirmed");

            Order savedOrder = orderRepository.save(order);

            // Step 9: Send confirmation
            notificationService.sendOrderConfirmation(savedOrder);

            // Step 10: Trigger fulfillment workflow
            fulfillmentService.initiateFulfillment(savedOrder);

            return savedOrder;

        } catch (Exception e) {
            // Rollback inventory reservation
            inventoryService.releaseReservations(reservations);
            throw e;
        }
    }

    /**
     * Process order shipment
     */
    @Transactional
    public Order shipOrder(Long orderId, ShipmentDetails shipment) {

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new NotFoundException("Order not found"));

        // Validate order can be shipped
        if (order.getStatus() != OrderStatus.PROCESSING) {
            throw new InvalidStateException("Order cannot be shipped in current state");
        }

        // Generate tracking ID
        String trackingNumber = shippingService.createShipment(order, shipment);

        order.setTrackingNumber(trackingNumber);
        order.setCarrierCode(shipment.getCarrier());
        order.setShippedAt(LocalDateTime.now());
        order.setExpectedDeliveryDate(
            shippingService.calculateETA(order.getShippingAddress(), shipment.getCarrier())
        );

        order.setStatus(OrderStatus.SHIPPED);
        addStatusHistory(order, OrderStatus.SHIPPED,
            "Shipped via " + shipment.getCarrier() + " - " + trackingNumber);

        // Update inventory (move from reserved to shipped)
        inventoryService.markAsShipped(order);

        // Send shipping notification
        notificationService.sendShippingNotification(order);

        return orderRepository.save(order);
    }

    /**
     * Track order status
     */
    public OrderTrackingInfo trackOrder(String orderNumber) {

        Order order = orderRepository.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new NotFoundException("Order not found"));

        OrderTrackingInfo info = new OrderTrackingInfo();
        info.setOrderNumber(order.getOrderNumber());
        info.setStatus(order.getStatus());
        info.setStatusHistory(order.getStatusHistory());

        // Get live tracking from carrier if shipped
        if (order.getTrackingNumber() != null) {
            CarrierTrackingInfo carrierInfo = shippingService.getTrackingInfo(
                order.getCarrierCode(),
                order.getTrackingNumber()
            );
            info.setCarrierStatus(carrierInfo.getStatus());
            info.setCarrierUpdates(carrierInfo.getUpdates());
            info.setCurrentLocation(carrierInfo.getCurrentLocation());
            info.setEstimatedDelivery(carrierInfo.getEstimatedDelivery());
        }

        return info;
    }
}

// ═══════════════════════════════════════════════════════════════════
// ORDER STATE MACHINE
// ═══════════════════════════════════════════════════════════════════

@Configuration
public class OrderStateMachineConfig {

    /**
     * Define valid state transitions
     */
    public enum OrderStatus {
        CREATED,     // Initial state
        CONFIRMED,   // Payment successful
        PROCESSING,  // Being prepared
        SHIPPED,     // Handed to carrier
        DELIVERED,   // Customer received
        CANCELLED,   // Order cancelled
        RETURNED     // Customer returned
    }

    /**
     * Valid transitions:
     *
     * CREATED → CONFIRMED (payment success)
     * CREATED → CANCELLED (payment failed / user cancelled)
     * CONFIRMED → PROCESSING (fulfillment started)
     * CONFIRMED → CANCELLED (user cancelled)
     * PROCESSING → SHIPPED (handed to carrier)
     * PROCESSING → CANCELLED (out of stock)
     * SHIPPED → DELIVERED (carrier delivered)
     * DELIVERED → RETURNED (customer returned)
     */
    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = Map.of(
        OrderStatus.CREATED, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
        OrderStatus.CONFIRMED, Set.of(OrderStatus.PROCESSING, OrderStatus.CANCELLED),
        OrderStatus.PROCESSING, Set.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
        OrderStatus.SHIPPED, Set.of(OrderStatus.DELIVERED),
        OrderStatus.DELIVERED, Set.of(OrderStatus.RETURNED)
    );

    public static boolean canTransition(OrderStatus from, OrderStatus to) {
        Set<OrderStatus> allowed = TRANSITIONS.get(from);
        return allowed != null && allowed.contains(to);
    }
}
```

---

# PART 8: INVENTORY MANAGEMENT

## 📦 Stock Tracking and Reservation

```java
// ═══════════════════════════════════════════════════════════════════
// ENTITY: Inventory
// ═══════════════════════════════════════════════════════════════════

@Entity
@Table(name = "inventory")
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Product product;

    @ManyToOne
    private Warehouse warehouse;

    private Integer quantityOnHand;    // Physical stock in warehouse

    private Integer quantityReserved;  // Soft-locked for orders

    private Integer quantityAvailable; // Can be sold = OnHand - Reserved

    private Integer reorderPoint;      // When to reorder

    private Integer reorderQuantity;   // How much to reorder

    @Version
    private Long version;  // Optimistic locking for concurrency

    // ══════════════════════════════════════════════════════════════
    // BUSINESS LOGIC
    // ══════════════════════════════════════════════════════════════

    public boolean canReserve(int quantity) {
        return quantityAvailable >= quantity;
    }

    public void reserve(int quantity) {
        if (!canReserve(quantity)) {
            throw new InsufficientStockException("Not enough stock");
        }
        this.quantityReserved += quantity;
        this.quantityAvailable -= quantity;
    }

    public void releaseReservation(int quantity) {
        this.quantityReserved -= quantity;
        this.quantityAvailable += quantity;
    }

    public void confirmShipment(int quantity) {
        // Move from reserved to shipped (reduces on-hand)
        this.quantityReserved -= quantity;
        this.quantityOnHand -= quantity;
    }

    public void receiveStock(int quantity) {
        this.quantityOnHand += quantity;
        this.quantityAvailable += quantity;
    }

    public boolean needsReorder() {
        return quantityAvailable <= reorderPoint;
    }
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE: Inventory Management with Concurrency Handling
// ═══════════════════════════════════════════════════════════════════

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    /**
     * Reserve inventory for order
     *
     * Uses optimistic locking to handle concurrent orders
     */
    @Transactional
    @Retryable(value = OptimisticLockingFailureException.class, maxAttempts = 3)
    public List<InventoryReservation> reserveItems(List<CartItem> items) {

        List<InventoryReservation> reservations = new ArrayList<>();

        for (CartItem item : items) {
            // Find best warehouse (closest to customer, has stock)
            Inventory inventory = inventoryRepository
                .findBestWarehouseWithStock(item.getProductId(), item.getQuantity())
                .orElseThrow(() -> new OutOfStockException(
                    "Product " + item.getProductId() + " out of stock"
                ));

            // Reserve stock (this updates version number)
            inventory.reserve(item.getQuantity());
            inventoryRepository.save(inventory);  // May throw OptimisticLockingFailureException

            // Record reservation
            InventoryReservation reservation = new InventoryReservation();
            reservation.setInventory(inventory);
            reservation.setProduct(item.getProduct());
            reservation.setQuantity(item.getQuantity());
            reservation.setReservedAt(LocalDateTime.now());
            reservation.setExpiresAt(LocalDateTime.now().plusMinutes(15));  // 15 min hold
            reservations.add(reservation);

            // Log transaction
            logTransaction(inventory,
                TransactionType.RESERVE,
                -item.getQuantity(),
                "Reserved for cart");
        }

        return reservations;
    }

    /**
     * Release expired reservations
     *
     * Runs every 5 minutes to cleanup abandoned carts
     */
    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void releaseExpiredReservations() {

        List<InventoryReservation> expired = reservationRepository
            .findByExpiresAtBeforeAndStatus(LocalDateTime.now(), ReservationStatus.PENDING);

        for (InventoryReservation reservation : expired) {
            Inventory inventory = reservation.getInventory();
            inventory.releaseReservation(reservation.getQuantity());

            reservation.setStatus(ReservationStatus.EXPIRED);

            logTransaction(inventory,
                TransactionType.RELEASE,
                reservation.getQuantity(),
                "Reservation expired");
        }

        log.info("Released {} expired reservations", expired.size());
    }

    /**
     * Automatic reorder when stock low
     */
    @Scheduled(cron = "0 0 6 * * *")  // 6 AM daily
    public void checkAndReorder() {

        List<Inventory> lowStock = inventoryRepository.findByNeedsReorder();

        for (Inventory inv : lowStock) {
            // Create purchase requisition
            PurchaseRequisition pr = new PurchaseRequisition();
            pr.setProduct(inv.getProduct());
            pr.setQuantity(inv.getReorderQuantity());
            pr.setWarehouse(inv.getWarehouse());
            pr.setReason("Auto-reorder: Stock below reorder point");

            // Send for approval
            workflowService.startWorkflow("PurchaseRequisition", pr.getId());

            log.info("Auto-reorder created for product {} at warehouse {}",
                inv.getProduct().getSku(),
                inv.getWarehouse().getName());
        }
    }
}
```

---

# PART 9: PUTTING IT ALL TOGETHER

## 🔗 How Modules Connect

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ERP INTEGRATION - THE BIG PICTURE                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

                           CUSTOMER PLACES ORDER
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            ORDER MANAGEMENT                                   │
│  • Validate cart                                                             │
│  • Calculate prices, taxes                                                   │
│  • Apply promotions                                                          │
│  • Create order record                                                       │
└──────────────────────────────────────────────────────────────────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐
│    INVENTORY    │    │     PAYMENT     │    │    ACCOUNTS RECEIVABLE  │
│                 │    │                 │    │                         │
│ • Reserve stock │    │ • Process card  │    │ • Create customer inv.  │
│ • Allocate from │    │ • Capture funds │    │ • Record revenue        │
│   warehouse     │    │ • Handle refund │    │ • Track payment         │
└─────────────────┘    └─────────────────┘    └─────────────────────────┘
         │                         │                         │
         │                         │                         │
         ▼                         ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           GENERAL LEDGER                                      │
│                                                                              │
│  Sales Revenue       ← Credit (increase)                                     │
│  Cash/Bank           ← Debit (increase)                                      │
│  GST Payable         ← Credit (liability)                                    │
│  Inventory (COGS)    ← Credit (decrease asset)                              │
│  Cost of Goods Sold  ← Debit (expense)                                      │
└──────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            FULFILLMENT                                        │
│  • Pick items from warehouse                                                 │
│  • Pack shipment                                                             │
│  • Generate shipping label                                                   │
│  • Update tracking                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             LOGISTICS                                         │
│  • Assign carrier                                                            │
│  • Generate tracking ID                                                      │
│  • Monitor delivery                                                          │
│  • Handle exceptions                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
                           CUSTOMER RECEIVES ORDER
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌─────────────────┐                               ┌─────────────────┐
│    DELIVERED    │                               │    RETURNED     │
│                 │                               │                 │
│ • Update status │                               │ • Process return│
│ • Close order   │                               │ • Refund payment│
│ • Request review│                               │ • Restock item  │
└─────────────────┘                               └─────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                           CROSS-MODULE TRIGGERS
═══════════════════════════════════════════════════════════════════════════════

When inventory gets low:
  INVENTORY → triggers → PROCUREMENT (create Purchase Order)
  PROCUREMENT → triggers → ACCOUNTS PAYABLE (vendor invoice)
  ACCOUNTS PAYABLE → triggers → GENERAL LEDGER (expense entry)
  GENERAL LEDGER → triggers → CASH MANAGEMENT (payment)

When employee is hired:
  HR → triggers → FINANCE (add to payroll)
  HR → triggers → IT (create email, access)
  HR → triggers → FACILITIES (allocate desk, assets)
  FINANCE → triggers → GL (salary expense budget)

When month closes:
  GL → triggers → REPORTS (P&L, Balance Sheet)
  GL → triggers → TAX (GST returns)
  GL → triggers → MANAGEMENT (dashboard update)
```

---

# PART 10: KEY LEARNINGS FOR YOUR CAREER

## 🎯 What This Teaches You

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SKILLS YOU'VE LEARNED                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

1. DOMAIN TO CODE TRANSLATION
   • Business process → Database schema
   • Business rules → Validation logic
   • Business entities → Java classes
   • Relationships → Foreign keys

2. DATABASE DESIGN PATTERNS
   • Self-referencing tables (hierarchy)
   • Audit trails (status history)
   • Soft locks (reservations)
   • Optimistic locking (version)

3. ID GENERATION STRATEGIES
   • Sequential with prefix
   • Snowflake IDs
   • UUID vs composite IDs
   • Handling ID exhaustion

4. WORKFLOW AUTOMATION
   • State machines
   • Approval chains
   • SLA monitoring
   • Escalation logic

5. INTEGRATION PATTERNS
   • Module-to-module communication
   • Event-driven architecture
   • Transaction management
   • Rollback handling

6. FINANCIAL SYSTEMS
   • Double-entry bookkeeping
   • Tax calculation
   • Payment processing
   • Reconciliation

7. ENTERPRISE PATTERNS
   • Service layer
   • Repository pattern
   • DTO mapping
   • Scheduled jobs
```

## 📚 How to Practice

```
START SMALL:

1. BUILD: Simple employee directory with hierarchy
   - Self-referencing relationship
   - Tree view API
   - Manager email notification

2. BUILD: Basic order system
   - Order creation
   - Status tracking
   - Simple inventory

3. BUILD: Expense approval workflow
   - Amount-based rules
   - Manager chain approval
   - Email notifications

4. BUILD: Invoice system
   - PDF generation
   - Tax calculation
   - Payment tracking

Each project teaches you 2-3 ERP concepts!
```

---

## 🙏 Credits to Your Anna

```
This knowledge comes from real-world Oracle ERP experience!

Your anna showed you the path - now WALK IT:
• Ask more questions when you meet
• Get him to code-review your practice projects
• Ask about specific scenarios he's solved
• Learn the "why" behind every design decision

ENTERPRISE SOFTWARE = 70% OF JOB MARKET
Understanding this = CAREER ADVANTAGE!
```

---

**Next Steps:**

1. Read through each section slowly
2. Try implementing the Employee Hierarchy system
3. Add one feature at a time
4. Connect to your DSA learning (trees, graphs, HashMap)
5. Build a mini-ERP as your portfolio project!

---

_"The best developers understand BOTH the code AND the business."_
