> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01b_ERP_Advanced.md)

---

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
