**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](04_ERP_Finance_RealWorld.md)

---

# 🏦 ERP Deep Dive: Finance, Real-World DSA & Junior Developer's Path

## Complete Guide for BTech CSE Freshers - From Theory to Industry

---




# 📌 Preface: a Message for You

## The Builder Analogy

Can you build a house if you can't:
- Lay a single brick correctly?
- Mix cement properly?
- Read a simple measurement?
NO! You MUST master small tasks before designing mansions.
Similarly:
Junior: Write calculateTax(), validateEmail(), findDuplicates()
Mid:    Design TaxCalculationService, build REST APIs
Senior: Design entire Order Management System architecture
Lead:   Design microservices for million-user e-commerce
YOU ARE AT THE RIGHT STARTING POINT.
Master functions first. Architecture will come naturally.

---

# 🖥️ Part 1: the "frontend is Toy Play" Debate

## 🎭 Understanding the Statement




## What Customer Sees (Frontend)

🍔 McChicken Burger    ₹189
🍟 Medium Fries        ₹99
🥤 Coke                ₹79
[ Add to Cart ]
Total: ₹367
[ Pay Now ]
Simple UI: Images, buttons, cart. Maybe 500 lines of code.
A fresher can build this in a week.


🔬 **Section Challenge — What Customer Sees (Frontend)**

**Challenge 1 (Design):** Design a custom exception hierarchy for a payment system. What should the base class extend and what fields must it have?
<details><summary>Answer</summary>

```java
public class PaymentException extends RuntimeException { // unchecked!
    private final String errorCode;
    private final String transactionId;
    public PaymentException(String code, String txId, String msg, Throwable cause) {
        super(msg, cause); this.errorCode=code; this.transactionId=txId;
    }
}
public class InsufficientFundsException extends PaymentException { ... }
public class PaymentGatewayException extends PaymentException { ... }
```
Always chain the original cause. Include domain-relevant context (errorCode, transactionId) for logging/debugging.
</details>


## What Happens When You Click "Pay Now" (Backend Erp)

1. ORDER CREATION
- Generate unique order ID (ORD-BLR-K12-20260204-0847)
- Validate items are available at THIS store
- Lock inventory (so no one else orders last burger)
- Calculate prices (base + taxes + offers)
- Apply loyalty points if applicable
- Store order with 50+ fields
2. PAYMENT PROCESSING
- Route to payment gateway (Razorpay/PayTM/etc.)
- Handle UPI/Card/Wallet differently
- Timeout handling (what if payment hangs?)
- Retry logic for failed payments
- Store transaction for audit
- PCI-DSS compliance (credit card security)
3. TAX CALCULATION
- GST on food: 5% (restaurant)
- GST on packaging: 18%
- Service charge (if dine-in)
- Generate tax invoice with proper format
- Store for GST returns (GSTR-1)
4. INVENTORY UPDATE
- Reduce stock: Buns -1, Patty -1, Lettuce -20g
- Check if stock below threshold
- Trigger reorder if needed
- Update kitchen display system
5. KITCHEN MANAGEMENT
- Route order to correct station (grill, fry, drinks)
- Calculate preparation time
- Manage queue priority
- Track preparation status
6. LOYALTY & CRM
- Add points to customer account
- Update customer purchase history
- Check for birthday offers
- Segment customer (frequent/occasional)
7. ANALYTICS & REPORTING
- Update real-time sales dashboard
- Feed data to demand forecasting
- Track popular items by time of day
- Store for end-of-day reconciliation
8. ACCOUNTING (Automatic Journal Entry!)
- Debit: Cash/Bank (money received)
- Credit: Sales Revenue
- Credit: GST Payable
- Update daily sales register
ALL THIS HAPPENS IN < 3 SECONDS!
Backend code: Millions of lines, built over decades.

---

# 📌 Part 2: Finance Knowledge for Developers

## 💰 Essential Finance Terms (With Code Context)


FINANCE TERMS EVERY DEVELOPER MUST KNOW


### A. Basic Accounting Terms

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: DEBIT and CREDIT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * NOT "positive" and "negative"!
 *
 * DEBIT  = Left side of an account
 * CREDIT = Right side of an account
 *
 * Rules:
 * - Assets INCREASE with Debit
 * - Liabilities INCREASE with Credit
 * - Revenue INCREASES with Credit
 * - Expenses INCREASE with Debit
 *
 * Example: Company receives ₹10,000 payment from customer
 *
 * Bank Account (Asset):        Debit  ₹10,000 (increases)
 * Accounts Receivable (Asset): Credit ₹10,000 (decreases)
 */

public class JournalEntryLine {
    private Account account;
    private BigDecimal debitAmount;   // Can be zero
    private BigDecimal creditAmount;  // Can be zero
    // One MUST be zero, one MUST have value
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: LEDGER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A ledger is the COMPLETE HISTORY of one account.
 *
 * Example: Bank Account Ledger
 *
 * Date       | Description          | Debit    | Credit   | Balance
 * -----------|---------------------|----------|----------|----------
 * 01-Feb     | Opening Balance     |          |          | 50,000
 * 02-Feb     | Customer Payment    | 10,000   |          | 60,000
 * 03-Feb     | Rent Payment        |          | 15,000   | 45,000
 * 04-Feb     | Sales Collection    | 25,000   |          | 70,000
 */

public class LedgerEntry {
    private LocalDate date;
    private String description;
    private BigDecimal debit;
    private BigDecimal credit;
    private BigDecimal runningBalance;  // Calculated field
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: ACCOUNTS RECEIVABLE (AR)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Money that CUSTOMERS OWE YOU (you gave product/service, waiting for payment)
 *
 * In code: Track who owes how much, for how long
 */

public class AccountsReceivable {
    private Customer customer;
    private Invoice invoice;
    private BigDecimal originalAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceDue;      // What's still owed
    private LocalDate dueDate;
    private int daysOverdue;            // For collection priority

    public boolean isOverdue() {
        return LocalDate.now().isAfter(dueDate) && balanceDue.compareTo(BigDecimal.ZERO) > 0;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: ACCOUNTS PAYABLE (AP)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Money YOU OWE TO VENDORS (you received product/service, need to pay)
 *
 * In code: Track what you owe to whom
 */

public class AccountsPayable {
    private Vendor vendor;
    private VendorInvoice invoice;
    private BigDecimal amountOwed;
    private LocalDate dueDate;
    private PaymentTerms terms;         // Net30, Net60, etc.

    // Business rule: Pay close to due date to optimize cash flow
    // But not late (damages relationship + late fees)
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: ACCRUAL vs CASH ACCOUNTING
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CASH BASIS: Record when money moves
 *   - You deliver product on Jan 15
 *   - Customer pays on Feb 10
 *   - Revenue recorded: Feb 10 (when cash received)
 *
 * ACCRUAL BASIS: Record when transaction happens
 *   - You deliver product on Jan 15
 *   - Revenue recorded: Jan 15 (when earned, regardless of payment)
 *   - Creates "Accounts Receivable" until paid
 *
 * Most businesses use ACCRUAL (required by law for companies above certain size)
 */

public class RevenueRecognition {

    // Cash basis
    public void recordRevenueCashBasis(Payment payment) {
        createJournalEntry(payment.getDate(), payment.getAmount());
    }

    // Accrual basis
    public void recordRevenueAccrualBasis(SalesOrder order) {
        // Record revenue when delivered, not when paid
        createJournalEntry(order.getDeliveryDate(), order.getAmount());
        createAccountsReceivable(order);  // Track that payment is pending
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: DEPRECIATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Assets lose value over time.
 * Instead of showing full loss when sold, spread it over useful life.
 *
 * Example: Buy laptop for ₹60,000, useful life 3 years
 *
 * Straight Line Depreciation:
 *   Year 1: ₹60,000 / 3 = ₹20,000 expense
 *   Year 2: ₹20,000 expense
 *   Year 3: ₹20,000 expense
 *
 * After 3 years: Book value = ₹0 (fully depreciated)
 */

public class Asset {
    private String name;
    private BigDecimal purchasePrice;
    private LocalDate purchaseDate;
    private int usefulLifeYears;
    private DepreciationMethod method;  // STRAIGHT_LINE, DECLINING_BALANCE, etc.

    public BigDecimal getMonthlyDepreciation() {
        if (method == DepreciationMethod.STRAIGHT_LINE) {
            return purchasePrice.divide(
                BigDecimal.valueOf(usefulLifeYears * 12),
                2,
                RoundingMode.HALF_UP
            );
        }
        // Other methods...
    }

    public BigDecimal getCurrentBookValue() {
        long monthsOwned = ChronoUnit.MONTHS.between(purchaseDate, LocalDate.now());
        BigDecimal totalDepreciation = getMonthlyDepreciation()
            .multiply(BigDecimal.valueOf(monthsOwned));
        return purchasePrice.subtract(totalDepreciation).max(BigDecimal.ZERO);
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: FISCAL YEAR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Company's accounting year (not necessarily Jan-Dec)
 *
 * India: April 1 to March 31
 * USA: Often calendar year (Jan-Dec)
 * Some companies: July-June
 *
 * Important for: Closing books, tax filing, budgeting
 */

public class FiscalYear {
    private int year;              // 2025-26
    private LocalDate startDate;   // April 1, 2025
    private LocalDate endDate;     // March 31, 2026
    private FYStatus status;       // OPEN, CLOSED, LOCKED

    public int getFiscalMonth(LocalDate date) {
        // April = Month 1, March = Month 12
        int month = date.getMonthValue();
        return month >= 4 ? month - 3 : month + 9;
    }

    public int getFiscalQuarter(LocalDate date) {
        int fiscalMonth = getFiscalMonth(date);
        return (fiscalMonth - 1) / 3 + 1;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: RECONCILIATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Matching records between two systems to ensure they agree.
 *
 * Common reconciliations:
 * - Bank reconciliation: Our records vs Bank statement
 * - Inventory reconciliation: System count vs Physical count
 * - Inter-company reconciliation: Company A's payable = Company B's receivable
 */

public class BankReconciliation {
    private BankAccount account;
    private LocalDate reconciliationDate;
    private BigDecimal bookBalance;        // Our records
    private BigDecimal bankBalance;        // Bank statement
    private List<ReconciliationItem> items;

    public BigDecimal calculateDifference() {
        return bankBalance.subtract(bookBalance);
    }

    public boolean isReconciled() {
        BigDecimal adjustedBookBalance = bookBalance
            .add(getUnrecordedBankCharges())
            .add(getUnrecordedInterest())
            .subtract(getBouncedChecks());

        BigDecimal adjustedBankBalance = bankBalance
            .subtract(getOutstandingChecks())
            .add(getDepositsInTransit());

        return adjustedBookBalance.compareTo(adjustedBankBalance) == 0;
    }
}
```

### B. Tax-Related Terms

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: GST (Goods and Services Tax) - India
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CGST: Central GST (goes to central government)
 * SGST: State GST (goes to state government)
 * IGST: Integrated GST (inter-state, goes to center then distributed)
 *
 * Rate slabs: 0%, 5%, 12%, 18%, 28%
 *
 * Rule:
 * - Same state sale: CGST + SGST (split 50-50)
 * - Different state sale: IGST (full rate)
 */

public class GSTCalculator {

    public TaxBreakdown calculateGST(BigDecimal amount, BigDecimal rate,
            String sellerState, String buyerState) {

        TaxBreakdown tax = new TaxBreakdown();
        BigDecimal taxAmount = amount.multiply(rate).divide(BigDecimal.valueOf(100));

        if (sellerState.equals(buyerState)) {
            // Intra-state: Split into CGST and SGST
            BigDecimal half = taxAmount.divide(BigDecimal.valueOf(2));
            tax.setCgst(half);
            tax.setSgst(half);
            tax.setIgst(BigDecimal.ZERO);
        } else {
            // Inter-state: Full IGST
            tax.setCgst(BigDecimal.ZERO);
            tax.setSgst(BigDecimal.ZERO);
            tax.setIgst(taxAmount);
        }

        tax.setTotalTax(taxAmount);
        return tax;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: INPUT TAX CREDIT (ITC)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The GST you paid on purchases can be deducted from GST you collect on sales.
 *
 * Example:
 * - You buy raw material for ₹10,000 + 18% GST = ₹11,800
 * - You sell finished product for ₹20,000 + 18% GST = ₹23,600
 *
 * GST collected from customer: ₹3,600
 * GST paid to supplier (ITC): ₹1,800
 * GST you pay to government: ₹3,600 - ₹1,800 = ₹1,800
 *
 * This is called "setting off" input credit.
 */

public class GSTReturn {
    private YearMonth period;  // e.g., February 2026

    private BigDecimal outputCGST;    // Collected from customers
    private BigDecimal outputSGST;
    private BigDecimal outputIGST;

    private BigDecimal inputCGST;     // Paid to vendors (ITC)
    private BigDecimal inputSGST;
    private BigDecimal inputIGST;

    public BigDecimal getCGSTPayable() {
        return outputCGST.subtract(inputCGST).max(BigDecimal.ZERO);
    }

    public BigDecimal getCGSTRefundable() {
        return inputCGST.subtract(outputCGST).max(BigDecimal.ZERO);
    }

    // Similar for SGST and IGST...
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: TDS (Tax Deducted at Source)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * When you pay someone, you DEDUCT tax and pay it directly to government.
 *
 * Example: You hire a contractor for ₹1,00,000 work
 * TDS rate: 10%
 *
 * You pay contractor: ₹90,000
 * You pay government: ₹10,000 (TDS)
 *
 * Contractor gets credit for ₹10,000 when filing their taxes.
 */

public class TDSCalculation {

    public PaymentBreakdown calculatePaymentWithTDS(
            BigDecimal amount,
            TDSCategory category,
            Vendor vendor) {

        PaymentBreakdown breakdown = new PaymentBreakdown();

        // Check if vendor has lower TDS certificate
        BigDecimal tdsRate = vendor.hasLowerTDSCertificate()
            ? vendor.getCertificateRate()
            : category.getDefaultRate();

        // Check if vendor is below threshold (no TDS for small payments)
        if (amount.compareTo(category.getThreshold()) < 0) {
            tdsRate = BigDecimal.ZERO;
        }

        BigDecimal tdsAmount = amount.multiply(tdsRate)
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        breakdown.setGrossAmount(amount);
        breakdown.setTdsAmount(tdsAmount);
        breakdown.setNetPayable(amount.subtract(tdsAmount));
        breakdown.setTdsRate(tdsRate);

        return breakdown;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: HSN CODE (Harmonized System of Nomenclature)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Universal product classification code that determines tax rate.
 *
 * Examples:
 * 8471: Computers and laptops (18% GST)
 * 6109: T-shirts (5% GST)
 * 8517: Mobile phones (18% GST)
 * 2106: Food preparations (12% GST)
 */

public class Product {
    private String name;
    private String hsnCode;           // "8471"
    private String hsnDescription;    // "Automatic data processing machines"

    public BigDecimal getApplicableTaxRate(LocalDate asOfDate) {
        // Tax rates can change over time!
        return taxRateRepository
            .findByHsnCodeAndEffectiveDate(hsnCode, asOfDate)
            .getRate();
    }
}
```

### C. Business Terms

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: PURCHASE ORDER (PO)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Legal document from buyer to seller saying "We want to buy this"
 *
 * Flow: Requisition → PO → Goods Receipt → Invoice → Payment
 */

public class PurchaseOrder {
    private String poNumber;          // PO-2026-02-00123
    private Vendor vendor;
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private List<POLine> lines;
    private POStatus status;          // DRAFT, APPROVED, SENT, PARTIALLY_RECEIVED, CLOSED

    // Legal binding once sent to vendor
    private LocalDateTime sentToVendorAt;
    private String sentBy;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: INVOICE vs BILL vs RECEIPT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * INVOICE: Request for payment (you send to customer)
 *          "Here's what you owe us"
 *
 * BILL: Invoice you RECEIVE (from vendor)
 *       "Here's what you owe them"
 *
 * RECEIPT: Proof of payment
 *          "This confirms you paid"
 */

public class Document {
    public enum DocumentType {
        INVOICE,    // You → Customer (you're seller)
        BILL,       // Vendor → You (you're buyer)
        RECEIPT,    // Confirmation of payment
        CREDIT_NOTE,// Reversal/refund document
        DEBIT_NOTE  // Additional charge document
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: PAYMENT TERMS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Agreement on when payment is due.
 *
 * Net 30: Pay within 30 days
 * Net 60: Pay within 60 days
 * 2/10 Net 30: 2% discount if paid in 10 days, else full amount in 30 days
 * COD: Cash on Delivery
 * Advance: Pay before delivery
 */

public enum PaymentTerms {
    IMMEDIATE(0, 0, 0),
    NET_15(15, 0, 0),
    NET_30(30, 0, 0),
    NET_45(45, 0, 0),
    NET_60(60, 0, 0),
    NET_90(90, 0, 0),
    DISCOUNT_2_10_NET_30(30, 10, 2);  // 2% if paid in 10 days

    private int dueDays;
    private int discountDays;
    private int discountPercent;

    public LocalDate calculateDueDate(LocalDate invoiceDate) {
        return invoiceDate.plusDays(dueDays);
    }

    public BigDecimal calculateAmountDue(BigDecimal original, LocalDate paymentDate,
            LocalDate invoiceDate) {
        long daysSinceInvoice = ChronoUnit.DAYS.between(invoiceDate, paymentDate);

        if (discountDays > 0 && daysSinceInvoice <= discountDays) {
            // Eligible for early payment discount
            BigDecimal discount = original.multiply(BigDecimal.valueOf(discountPercent))
                .divide(BigDecimal.valueOf(100));
            return original.subtract(discount);
        }

        return original;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TERM: COST CENTER vs PROFIT CENTER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * COST CENTER: Spends money, doesn't generate revenue directly
 *              HR, IT, Admin, Legal
 *
 * PROFIT CENTER: Generates revenue
 *                Sales, Product lines, Business units
 *
 * Used for: Tracking where money goes, budgeting, performance evaluation
 */

public class Transaction {
    private BigDecimal amount;
    private Account account;

    // Dimensions for reporting
    private CostCenter costCenter;      // Which department
    private ProfitCenter profitCenter;  // Which business unit
    private Project project;            // Which project
    private Employee employee;          // Who
}
```

---



🔬 **Section Challenge — 💰 Essential Finance Terms (With Code Context)**

**Challenge 1 (Reasoning):** When does React Context cause performance problems and how do you avoid them?
<details><summary>Answer</summary>

Every context consumer re-renders when ANY context value changes. If you have `{theme, user, cart}` in one context, updating cart re-renders all theme and user consumers. Fixes: (1) Split into separate contexts: `ThemeContext`, `UserContext`, `CartContext`. (2) Memoize components with `React.memo`. (3) For complex state, use a state library (Zustand, Jotai) with selector-based subscriptions — only re-render when the specific piece of state changes.
</details>


# ⚡ Part 3: Erp Optimization Strategies

## ⚡ How Enterprise Systems Achieve Performance

```
╔══════════════════════════════════════════════════════════════════════════════╗
║      OPTIMIZATION STRATEGIES USED IN REAL ERP SYSTEMS                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Strategy 1: Database Optimization

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATEGY: PROPER INDEXING
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Problem: Invoice search is slow
 * Query: SELECT * FROM invoices WHERE customer_id = 123 AND status = 'UNPAID'
 *
 * Without index: Full table scan (checks ALL rows)
 * With index: Direct lookup (checks only matching rows)
 */

-- Create composite index for common queries
CREATE INDEX idx_invoice_customer_status
ON invoices(customer_id, status);

-- Partial index for active records only (PostgreSQL)
CREATE INDEX idx_active_orders
ON orders(customer_id, order_date)
WHERE status != 'CANCELLED';

-- Covering index (includes all columns needed)
CREATE INDEX idx_order_lookup
ON orders(order_number)
INCLUDE (customer_id, total_amount, status);

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATEGY: PARTITIONING
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Problem: Orders table has 500 million rows, queries slow
 * Solution: Split table by date/region
 */

-- Partition by date (each month is separate table internally)
CREATE TABLE orders (
    id BIGINT,
    order_date DATE,
    customer_id BIGINT,
    total DECIMAL(15,2)
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_2025_q1 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE orders_2025_q2 PARTITION OF orders
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

-- Query on Jan 2025 only scans orders_2025_q1!

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATEGY: MATERIALIZED VIEWS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Problem: Daily sales report query takes 5 minutes
 * Solution: Pre-compute and store result, refresh periodically
 */

CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT
    DATE(order_date) as sale_date,
    store_id,
    COUNT(*) as order_count,
    SUM(total_amount) as total_sales,
    SUM(tax_amount) as total_tax
FROM orders
WHERE status = 'DELIVERED'
GROUP BY DATE(order_date), store_id;

-- Refresh every hour
REFRESH MATERIALIZED VIEW daily_sales_summary;

-- Query now takes < 1 second!
SELECT * FROM daily_sales_summary WHERE sale_date = '2026-02-04';
```

### Strategy 2: Caching Patterns

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATEGY: MULTI-LEVEL CACHING
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Layer 1: Application memory (HashMap) - fastest
 * Layer 2: Distributed cache (Redis) - shared across servers
 * Layer 3: Database - source of truth
 */

@Service
public class ProductCatalogService {

    // Level 1: In-memory cache (per server)
    private final Cache<String, Product> localCache =
        Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .build();

    // Level 2: Redis (shared)
    @Autowired
    private RedisTemplate<String, Product> redisTemplate;

    // Level 3: Database
    @Autowired
    private ProductRepository productRepository;

    public Product getProduct(String productId) {
        // Level 1: Check local cache
        Product product = localCache.getIfPresent(productId);
        if (product != null) {
            return product;  // Fastest! < 1ms
        }

        // Level 2: Check Redis
        String redisKey = "product:" + productId;
        product = redisTemplate.opsForValue().get(redisKey);
        if (product != null) {
            localCache.put(productId, product);  // Populate L1
            return product;  // Fast! ~2-5ms
        }

        // Level 3: Database
        product = productRepository.findById(productId)
            .orElseThrow(() -> new NotFoundException("Product not found"));

        // Populate both caches
        redisTemplate.opsForValue().set(redisKey, product, 1, TimeUnit.HOURS);
        localCache.put(productId, product);

        return product;  // Slow ~50-200ms (but only on cache miss)
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATEGY: CACHE INVALIDATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "There are only two hard things in Computer Science:
 *  cache invalidation and naming things." - Phil Karlton
 *
 * When product price changes, all caches must be updated!
 */

@Service
public class ProductUpdateService {

    @Transactional
    public void updateProductPrice(String productId, BigDecimal newPrice) {
        // Update database
        Product product = productRepository.findById(productId).orElseThrow();
        product.setPrice(newPrice);
        productRepository.save(product);

        // Invalidate caches
        localCache.invalidate(productId);  // This server

        // Notify other servers to invalidate (using Redis pub/sub)
        redisTemplate.convertAndSend("cache-invalidation",
            new CacheInvalidationMessage("product", productId));

        // Delete from Redis cache
        redisTemplate.delete("product:" + productId);
    }
}
```

### Strategy 3: Async Processing

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATEGY: ASYNC FOR NON-CRITICAL OPERATIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Problem: Order creation takes 5 seconds (payment, inventory, email, analytics)
 * Solution: Do only critical stuff synchronously, rest asynchronously
 */

@Service
public class OrderService {

    @Autowired
    private MessageQueue messageQueue;  // RabbitMQ, Kafka, etc.

    @Transactional
    public Order createOrder(OrderRequest request) {
        // SYNCHRONOUS (must complete before response)
        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());

        // 1. Validate and reserve inventory (CRITICAL)
        inventoryService.reserve(order);

        // 2. Process payment (CRITICAL)
        PaymentResult payment = paymentService.charge(request.getPayment());
        if (!payment.isSuccess()) {
            throw new PaymentFailedException();
        }
        order.setPaymentStatus(PaymentStatus.CAPTURED);

        // 3. Save order (CRITICAL)
        order = orderRepository.save(order);

        // ASYNCHRONOUS (can happen after response)
        // Publish events - processed by background workers

        // Email confirmation (can be delayed)
        messageQueue.publish("order-confirmation", order.getId());

        // Update analytics (not customer-facing)
        messageQueue.publish("analytics-order", order);

        // Update CRM (not urgent)
        messageQueue.publish("crm-order", order);

        // Generate invoice PDF (can take time)
        messageQueue.publish("generate-invoice", order.getId());

        // Return immediately - user doesn't wait for email!
        return order;
    }
}

// Background worker processes queue
@Component
public class EmailWorker {

    @RabbitListener(queues = "order-confirmation")
    public void processOrderConfirmation(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        emailService.sendOrderConfirmation(order);
        // If this fails, it can be retried without affecting the order!
    }
}
```

### Strategy 4: Batch Processing

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATEGY: BATCH OPERATIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Problem: Sending 100,000 invoice reminders takes forever
 * Solution: Process in batches, with controlled concurrency
 */

@Service
public class InvoiceReminderBatchJob {

    @Scheduled(cron = "0 0 9 * * *")  // 9 AM daily
    public void sendInvoiceReminders() {
        int batchSize = 1000;
        int processed = 0;
        Long lastId = 0L;

        while (true) {
            // Fetch batch (keyset pagination - efficient!)
            List<Invoice> batch = invoiceRepository
                .findOverdueInvoices(lastId, batchSize);

            if (batch.isEmpty()) break;

            // Process batch in parallel
            batch.parallelStream().forEach(invoice -> {
                try {
                    emailService.sendReminder(invoice);
                    invoice.setLastReminderSent(LocalDateTime.now());
                } catch (Exception e) {
                    // Log error, don't stop entire batch
                    log.error("Failed to send reminder for invoice {}",
                        invoice.getId(), e);
                }
            });

            // Save batch
            invoiceRepository.saveAll(batch);

            lastId = batch.get(batch.size() - 1).getId();
            processed += batch.size();

            log.info("Processed {} reminders so far", processed);
        }

        log.info("Completed. Total reminders sent: {}", processed);
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATEGY: BULK INSERTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Problem: Inserting 1 million rows takes hours
 * Solution: Bulk insert in batches
 */

// SLOW: One insert per row
for (Order order : orders) {
    orderRepository.save(order);  // Each is separate transaction!
}

// FAST: Bulk insert
@Transactional
```


---

> **Navigation**: [< Previous](02_ERP_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_ERP_Finance_RealWorld.md)