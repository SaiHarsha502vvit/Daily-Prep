# 🏦 ERP Deep Dive: Finance, Real-World DSA & Junior Developer's Path

## Complete Guide for BTech CSE Freshers - From Theory to Industry

---

# PREFACE: A MESSAGE FOR YOU

```
╔══════════════════════════════════════════════════════════════════════════════╗
║           TO THE FRESHER READING THIS - THIS IS FOR YOU                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

You said: "I have good knowledge in theory but applying logic in functions
          is critical to me"

THIS IS COMPLETELY NORMAL. Every engineer goes through this.

The gap between:
  📚 "I understand binary search"
  💻 "I can write findFirstOccurrence() for a real billing system"

...is what this document addresses.

You also said: "Learn functionalities first, then architecture"

I 100% AGREE. Here's why:

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE BUILDER ANALOGY                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Can you build a house if you can't:                                         │
│   • Lay a single brick correctly?                                           │
│   • Mix cement properly?                                                     │
│   • Read a simple measurement?                                              │
│                                                                              │
│ NO! You MUST master small tasks before designing mansions.                  │
│                                                                              │
│ Similarly:                                                                   │
│                                                                              │
│   Junior: Write calculateTax(), validateEmail(), findDuplicates()           │
│   Mid:    Design TaxCalculationService, build REST APIs                     │
│   Senior: Design entire Order Management System architecture                │
│   Lead:   Design microservices for million-user e-commerce                  │
│                                                                              │
│ YOU ARE AT THE RIGHT STARTING POINT.                                        │
│ Master functions first. Architecture will come naturally.                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: THE "FRONTEND IS TOY PLAY" DEBATE

## 🎭 Understanding the Statement

```
╔══════════════════════════════════════════════════════════════════════════════╗
║    "FRONTEND IS JUST A TOY PLAY, BACKEND ERP DOES EVERYTHING"                 ║
║                                                                               ║
║    DO I AGREE? - NUANCED ANSWER                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### What Your Anna Meant (The Truth in It):

```
McDonald's Kiosk Example:

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT CUSTOMER SEES (Frontend):                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────┐                                       │
│   │  🍔 McChicken Burger    ₹189    │                                       │
│   │  🍟 Medium Fries        ₹99     │                                       │
│   │  🥤 Coke                ₹79     │                                       │
│   │                                 │                                       │
│   │  [ Add to Cart ]                │                                       │
│   │                                 │                                       │
│   │  Total: ₹367                    │                                       │
│   │  [ Pay Now ]                    │                                       │
│   └─────────────────────────────────┘                                       │
│                                                                             │
│   Simple UI: Images, buttons, cart. Maybe 500 lines of code.               │
│   A fresher can build this in a week.                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT HAPPENS WHEN YOU CLICK "PAY NOW" (Backend ERP):                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. ORDER CREATION                                                           │
│    • Generate unique order ID (ORD-BLR-K12-20260204-0847)                  │
│    • Validate items are available at THIS store                            │
│    • Lock inventory (so no one else orders last burger)                    │
│    • Calculate prices (base + taxes + offers)                              │
│    • Apply loyalty points if applicable                                    │
│    • Store order with 50+ fields                                           │
│                                                                             │
│ 2. PAYMENT PROCESSING                                                       │
│    • Route to payment gateway (Razorpay/PayTM/etc.)                        │
│    • Handle UPI/Card/Wallet differently                                    │
│    • Timeout handling (what if payment hangs?)                             │
│    • Retry logic for failed payments                                       │
│    • Store transaction for audit                                           │
│    • PCI-DSS compliance (credit card security)                             │
│                                                                             │
│ 3. TAX CALCULATION                                                          │
│    • GST on food: 5% (restaurant)                                          │
│    • GST on packaging: 18%                                                  │
│    • Service charge (if dine-in)                                           │
│    • Generate tax invoice with proper format                               │
│    • Store for GST returns (GSTR-1)                                        │
│                                                                             │
│ 4. INVENTORY UPDATE                                                         │
│    • Reduce stock: Buns -1, Patty -1, Lettuce -20g                        │
│    • Check if stock below threshold                                        │
│    • Trigger reorder if needed                                             │
│    • Update kitchen display system                                         │
│                                                                             │
│ 5. KITCHEN MANAGEMENT                                                       │
│    • Route order to correct station (grill, fry, drinks)                   │
│    • Calculate preparation time                                            │
│    • Manage queue priority                                                 │
│    • Track preparation status                                              │
│                                                                             │
│ 6. LOYALTY & CRM                                                            │
│    • Add points to customer account                                        │
│    • Update customer purchase history                                      │
│    • Check for birthday offers                                             │
│    • Segment customer (frequent/occasional)                                │
│                                                                             │
│ 7. ANALYTICS & REPORTING                                                    │
│    • Update real-time sales dashboard                                      │
│    • Feed data to demand forecasting                                       │
│    • Track popular items by time of day                                    │
│    • Store for end-of-day reconciliation                                   │
│                                                                             │
│ 8. ACCOUNTING (Automatic Journal Entry!)                                    │
│    • Debit: Cash/Bank (money received)                                     │
│    • Credit: Sales Revenue                                                 │
│    • Credit: GST Payable                                                   │
│    • Update daily sales register                                           │
│                                                                             │
│ ALL THIS HAPPENS IN < 3 SECONDS!                                           │
│                                                                             │
│ Backend code: Millions of lines, built over decades.                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### My Verdict: PARTIALLY AGREE, BUT...

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         THE BALANCED VIEW                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

WHY "FRONTEND = TOY" HAS TRUTH:
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. COMPLEXITY RATIO                                                        │
│    Frontend: Display data, collect input, validate, show errors            │
│    Backend:  Business rules, transactions, security, integration           │
│              scaling, caching, database, auditing...                       │
│                                                                            │
│    Ratio is roughly 1:10 in terms of logic complexity                     │
│                                                                            │
│ 2. BUSINESS VALUE                                                          │
│    Frontend bug: "Button color is wrong" → Minor                          │
│    Backend bug: "Tax calculated wrong" → LEGAL TROUBLE                    │
│                 "Payment double charged" → REFUNDS + REPUTATION           │
│                 "Inventory not updated" → OVERSELLING                     │
│                                                                            │
│ 3. DOMAIN KNOWLEDGE                                                        │
│    Frontend: Needs UI/UX sense, design skills                             │
│    Backend:  Needs BUSINESS UNDERSTANDING (finance, supply chain, HR)     │
│              This is what you're learning now!                            │
└────────────────────────────────────────────────────────────────────────────┘

WHY "FRONTEND = TOY" IS OVERSIMPLIFIED:
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. GOOD FRONTEND IS HARD                                                   │
│    • Performance optimization (React re-renders, bundle size)             │
│    • Accessibility (screen readers, keyboard navigation)                   │
│    • Cross-browser compatibility                                           │
│    • Responsive design for 100+ device sizes                              │
│    • State management in complex apps                                      │
│    • Real-time updates (WebSockets)                                        │
│                                                                            │
│ 2. USER EXPERIENCE = BUSINESS                                              │
│    • Amazon: 100ms delay = 1% revenue loss                                │
│    • Confusing UI = Lost customers                                        │
│    • Frontend IS the product for users                                    │
│                                                                            │
│ 3. MODERN FRONTEND HAS BACKEND-LIKE CONCERNS                               │
│    • Next.js server components                                            │
│    • Edge computing                                                        │
│    • Client-side caching strategies                                       │
└────────────────────────────────────────────────────────────────────────────┘

MY CONCLUSION:
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│ "Frontend is toy" is what BACKEND developers say.                         │
│ "Backend is just CRUD" is what FRONTEND developers say.                   │
│                                                                            │
│ TRUTH: Both are essential. But...                                         │
│                                                                            │
│ FOR YOUR CAREER AS A FRESHER:                                             │
│ ════════════════════════════                                              │
│ Learning BACKEND/ERP gives you:                                           │
│ • Understanding of how businesses work                                    │
│ • Domain knowledge that's transferable                                    │
│ • More job opportunities (TCS, Infosys, etc.)                            │
│ • Higher long-term career ceiling                                         │
│                                                                            │
│ Your anna is RIGHT in pushing you toward backend/ERP knowledge.           │
│ It's where 70% of the industry jobs are.                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 2: FINANCE KNOWLEDGE FOR DEVELOPERS

## 💰 Essential Finance Terms (With Code Context)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║        FINANCE TERMS EVERY DEVELOPER MUST KNOW                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

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

# PART 3: ERP OPTIMIZATION STRATEGIES

## ⚡ How Enterprise Systems Achieve Performance

```
╔══════════════════════════════════════════════════════════════════════════════╗
║      OPTIMIZATION STRATEGIES USED IN REAL ERP SYSTEMS                         ║
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
public void bulkInsertOrders(List<Order> orders) {
    int batchSize = 500;

    for (int i = 0; i < orders.size(); i += batchSize) {
        List<Order> batch = orders.subList(i,
            Math.min(i + batchSize, orders.size()));

        // Use JDBC batch insert
        jdbcTemplate.batchUpdate(
            "INSERT INTO orders (order_number, customer_id, total) VALUES (?, ?, ?)",
            batch,
            batchSize,
            (ps, order) -> {
                ps.setString(1, order.getOrderNumber());
                ps.setLong(2, order.getCustomerId());
                ps.setBigDecimal(3, order.getTotal());
            }
        );

        // Clear persistence context to free memory
        entityManager.clear();
    }
}
```

### Strategy 5: Read Replicas

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATEGY: SEPARATE READ AND WRITE DATABASES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Problem: Reports slow down the system for everyone
 * Solution: Read from replica, write to primary
 *
 *   ┌─────────────────┐
 *   │  Primary (Write)│ ──replication──→ ┌─────────────────┐
 *   └─────────────────┘                   │  Replica (Read) │
 *          ↑                              └─────────────────┘
 *          │                                      ↑
 *      INSERTS                                REPORTS
 *      UPDATES                                SEARCHES
 *      DELETES                                ANALYTICS
 */

@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource writeDataSource() {
        return createDataSource("jdbc:mysql://primary-db:3306/erp");
    }

    @Bean
    public DataSource readDataSource() {
        return createDataSource("jdbc:mysql://replica-db:3306/erp");
    }
}

@Service
public class OrderReportService {

    @Autowired
    @Qualifier("readDataSource")
    private DataSource readDataSource;

    // Reports use read replica - doesn't affect main system!
    public List<SalesReport> generateMonthlySalesReport() {
        // This query can take 10 minutes, but it won't slow down orders!
        try (Connection conn = readDataSource.getConnection()) {
            // Complex report query...
        }
    }
}
```

---

# PART 4: REAL-WORLD DSA WITH FUNCTIONS

## 🎯 From Problem to Function

```
╔══════════════════════════════════════════════════════════════════════════════╗
║        DSA IN REAL WORLD: INPUT → FUNCTION → OUTPUT                           ║
║                                                                               ║
║  This section shows you how DSA concepts become actual work tasks             ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Example 1: Binary Search in Billing System

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REAL WORLD SCENARIO:
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Business Need: "Find the price tier for a given usage amount"
 *
 * Context: Electricity billing has SLAB pricing
 *
 * Units    | Rate per unit
 * ---------|---------------
 * 0-100    | ₹3.00
 * 101-200  | ₹4.50
 * 201-500  | ₹6.00
 * 501+     | ₹8.00
 *
 * INPUT:  Customer used 350 units
 * OUTPUT: Which slab? What rate?
 *
 * WHY BINARY SEARCH: Slabs can be 50+ (commercial billing),
 *                    linear search too slow for millions of calculations
 */

public class ElectricityBillingService {

    // The slabs are SORTED by upper limit - perfect for binary search!
    private static final int[] SLAB_LIMITS = {100, 200, 500, Integer.MAX_VALUE};
    private static final double[] SLAB_RATES = {3.00, 4.50, 6.00, 8.00};

    /**
     * Find the applicable slab for given units
     *
     * @param units - electricity units consumed
     * @return index of applicable slab
     *
     * This is YOUR FUNCTION - small, focused, testable!
     */
    public int findSlabIndex(int units) {
        int left = 0;
        int right = SLAB_LIMITS.length - 1;

        while (left < right) {
            int mid = left + (right - left) / 2;

            if (SLAB_LIMITS[mid] >= units) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }

        return left;
    }

    /**
     * Calculate total bill using slabs
     *
     * INPUT:  350 units
     * OUTPUT: (100 * 3) + (100 * 4.5) + (150 * 6) = 300 + 450 + 900 = ₹1650
     */
    public double calculateBill(int totalUnits) {
        double totalBill = 0;
        int remainingUnits = totalUnits;
        int previousLimit = 0;

        for (int i = 0; i < SLAB_LIMITS.length && remainingUnits > 0; i++) {
            int unitsInThisSlab = Math.min(
                remainingUnits,
                SLAB_LIMITS[i] - previousLimit
            );

            totalBill += unitsInThisSlab * SLAB_RATES[i];
            remainingUnits -= unitsInThisSlab;
            previousLimit = SLAB_LIMITS[i];
        }

        return totalBill;
    }

    // TEST YOUR FUNCTION
    public static void main(String[] args) {
        ElectricityBillingService service = new ElectricityBillingService();

        // Test findSlabIndex
        System.out.println(service.findSlabIndex(50));   // Expected: 0
        System.out.println(service.findSlabIndex(150));  // Expected: 1
        System.out.println(service.findSlabIndex(350));  // Expected: 2
        System.out.println(service.findSlabIndex(600));  // Expected: 3

        // Test calculateBill
        System.out.println(service.calculateBill(350));  // Expected: 1650.0
    }
}
```

### Example 2: HashMap in Inventory Management

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REAL WORLD SCENARIO:
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Business Need: "Check if customer's cart items are available in warehouse"
 *
 * Context: Customer adds 5 items to cart, need instant availability check
 *
 * INPUT:  Cart items: [{SKU: "PHONE-001", qty: 2}, {SKU: "CASE-045", qty: 1}]
 *         Warehouse stock: {"PHONE-001": 50, "CASE-045": 0, "CABLE-023": 100}
 *
 * OUTPUT: [{SKU: "PHONE-001", available: true}, {SKU: "CASE-045", available: false}]
 *
 * WHY HASHMAP: O(1) lookup vs O(n) for array search
 *              Cart can have 50 items, warehouse has 100,000 SKUs
 */

public class InventoryAvailabilityService {

    // Simulating warehouse stock (in reality, this comes from database/cache)
    private Map<String, Integer> warehouseStock;

    public InventoryAvailabilityService() {
        // This would typically be loaded from Redis cache
        this.warehouseStock = new HashMap<>();
        warehouseStock.put("PHONE-001", 50);
        warehouseStock.put("CASE-045", 0);
        warehouseStock.put("CABLE-023", 100);
    }

    /**
     * Check availability for a single item
     *
     * THIS IS YOUR SMALL FUNCTION!
     *
     * @param sku - product identifier
     * @param requestedQty - how many customer wants
     * @return true if available, false otherwise
     */
    public boolean isAvailable(String sku, int requestedQty) {
        Integer stockQty = warehouseStock.get(sku);  // O(1) lookup!

        if (stockQty == null) {
            return false;  // Product doesn't exist
        }

        return stockQty >= requestedQty;
    }

    /**
     * Check availability for entire cart
     *
     * INPUT:  List of cart items
     * OUTPUT: Availability result for each item
     */
    public List<AvailabilityResult> checkCartAvailability(List<CartItem> cartItems) {
        List<AvailabilityResult> results = new ArrayList<>();

        for (CartItem item : cartItems) {
            AvailabilityResult result = new AvailabilityResult();
            result.setSku(item.getSku());
            result.setRequestedQty(item.getQuantity());
            result.setAvailable(isAvailable(item.getSku(), item.getQuantity()));
            result.setStockQty(warehouseStock.getOrDefault(item.getSku(), 0));

            results.add(result);
        }

        return results;
    }

    /**
     * Find items that need reordering (stock below threshold)
     *
     * This uses HashMap iteration - O(n) where n = products in warehouse
     */
    public List<String> findLowStockItems(int threshold) {
        List<String> lowStockItems = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : warehouseStock.entrySet()) {
            if (entry.getValue() < threshold) {
                lowStockItems.add(entry.getKey());
            }
        }

        return lowStockItems;
    }

    // Data classes
    public static class CartItem {
        private String sku;
        private int quantity;
        // getters, setters
    }

    public static class AvailabilityResult {
        private String sku;
        private int requestedQty;
        private boolean available;
        private int stockQty;
        // getters, setters
    }
}
```

### Example 3: Two Pointers in Payment Reconciliation

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REAL WORLD SCENARIO:
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Business Need: "Match bank transactions with our records"
 *
 * Context: Bank sent statement with 1000 transactions
 *          Our system has 1000 recorded payments
 *          Find which ones match, which are missing
 *
 * INPUT:
 *   Bank statement (sorted by amount): [100, 250, 300, 500, 750, 1000]
 *   Our records (sorted by amount):    [100, 300, 400, 500, 900, 1000]
 *
 * OUTPUT:
 *   Matched: [100, 300, 500, 1000]
 *   In bank, not in our records: [250, 750]
 *   In our records, not in bank: [400, 900]
 *
 * WHY TWO POINTERS: Both lists sorted, can find matches in O(n+m)
 *                   Instead of O(n*m) with nested loops
 */

public class PaymentReconciliationService {

    /**
     * Reconcile bank transactions with internal records
     *
     * CORE ALGORITHM: Two pointers on sorted arrays
     */
    public ReconciliationResult reconcile(
            List<BigDecimal> bankTransactions,    // Sorted
            List<BigDecimal> internalRecords) {   // Sorted

        ReconciliationResult result = new ReconciliationResult();

        int bankPtr = 0;
        int internalPtr = 0;

        while (bankPtr < bankTransactions.size() &&
               internalPtr < internalRecords.size()) {

            BigDecimal bankAmt = bankTransactions.get(bankPtr);
            BigDecimal internalAmt = internalRecords.get(internalPtr);

            int comparison = bankAmt.compareTo(internalAmt);

            if (comparison == 0) {
                // MATCHED!
                result.addMatched(bankAmt);
                bankPtr++;
                internalPtr++;
            } else if (comparison < 0) {
                // Bank amount is smaller - not in our records
                result.addBankOnly(bankAmt);
                bankPtr++;
            } else {
                // Our amount is smaller - not in bank
                result.addInternalOnly(internalAmt);
                internalPtr++;
            }
        }

        // Remaining bank transactions (not matched)
        while (bankPtr < bankTransactions.size()) {
            result.addBankOnly(bankTransactions.get(bankPtr++));
        }

        // Remaining internal records (not matched)
        while (internalPtr < internalRecords.size()) {
            result.addInternalOnly(internalRecords.get(internalPtr++));
        }

        return result;
    }

    public static class ReconciliationResult {
        private List<BigDecimal> matched = new ArrayList<>();
        private List<BigDecimal> bankOnly = new ArrayList<>();      // In bank, not ours
        private List<BigDecimal> internalOnly = new ArrayList<>();  // In ours, not bank

        public void addMatched(BigDecimal amount) { matched.add(amount); }
        public void addBankOnly(BigDecimal amount) { bankOnly.add(amount); }
        public void addInternalOnly(BigDecimal amount) { internalOnly.add(amount); }

        public boolean isFullyReconciled() {
            return bankOnly.isEmpty() && internalOnly.isEmpty();
        }

        public BigDecimal getTotalUnreconciled() {
            BigDecimal bankSum = bankOnly.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal internalSum = internalOnly.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            return bankSum.add(internalSum);
        }
    }

    // TEST
    public static void main(String[] args) {
        PaymentReconciliationService service = new PaymentReconciliationService();

        List<BigDecimal> bank = Arrays.asList(
            new BigDecimal("100"), new BigDecimal("250"),
            new BigDecimal("300"), new BigDecimal("500")
        );

        List<BigDecimal> internal = Arrays.asList(
            new BigDecimal("100"), new BigDecimal("300"),
            new BigDecimal("400"), new BigDecimal("500")
        );

        ReconciliationResult result = service.reconcile(bank, internal);

        System.out.println("Matched: " + result.matched);
        System.out.println("Bank only: " + result.bankOnly);
        System.out.println("Internal only: " + result.internalOnly);
    }
}
```

### Example 4: Sliding Window in Sales Analytics

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REAL WORLD SCENARIO:
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Business Need: "Show 7-day moving average of sales on dashboard"
 *
 * Context: Manager wants to see trend, not daily fluctuations
 *          Raw data: [100, 150, 80, 200, 175, 90, 120, 180, 160, 140]
 *          7-day MA smooths out noise
 *
 * INPUT:  Daily sales for 30 days, window size = 7
 * OUTPUT: Moving average for each day (starting from day 7)
 *
 * WHY SLIDING WINDOW: Calculate each average in O(1) instead of O(k)
 *                     For 365 days * 7 day window = 2555 vs 365 operations
 */

public class SalesAnalyticsService {

    /**
     * Calculate moving average of sales
     *
     * @param dailySales - sales amount for each day
     * @param windowSize - number of days for average (e.g., 7)
     * @return moving average for each day starting from windowSize
     */
    public List<Double> calculateMovingAverage(List<Double> dailySales, int windowSize) {
        List<Double> movingAverages = new ArrayList<>();

        if (dailySales.size() < windowSize) {
            return movingAverages;  // Not enough data
        }

        // Calculate first window sum
        double windowSum = 0;
        for (int i = 0; i < windowSize; i++) {
            windowSum += dailySales.get(i);
        }

        // First moving average
        movingAverages.add(windowSum / windowSize);

        // Slide window: remove left element, add right element
        for (int i = windowSize; i < dailySales.size(); i++) {
            windowSum = windowSum
                - dailySales.get(i - windowSize)  // Remove oldest
                + dailySales.get(i);               // Add newest

            movingAverages.add(windowSum / windowSize);
        }

        return movingAverages;
    }

    /**
     * Find the best 7-day period (highest total sales)
     *
     * Business use: "When should we run our next promotion?"
     *               Answer: Same time as our best sales week last year
     */
    public BestPeriod findBestPeriod(List<DailySales> salesData, int periodDays) {
        if (salesData.size() < periodDays) {
            throw new IllegalArgumentException("Not enough data");
        }

        // Calculate first window
        double windowSum = 0;
        for (int i = 0; i < periodDays; i++) {
            windowSum += salesData.get(i).getAmount();
        }

        double maxSum = windowSum;
        int maxStartIndex = 0;

        // Slide and track maximum
        for (int i = periodDays; i < salesData.size(); i++) {
            windowSum = windowSum
                - salesData.get(i - periodDays).getAmount()
                + salesData.get(i).getAmount();

            if (windowSum > maxSum) {
                maxSum = windowSum;
                maxStartIndex = i - periodDays + 1;
            }
        }

        return new BestPeriod(
            salesData.get(maxStartIndex).getDate(),
            salesData.get(maxStartIndex + periodDays - 1).getDate(),
            maxSum
        );
    }

    public static class DailySales {
        private LocalDate date;
        private double amount;
        // constructor, getters
    }

    public static class BestPeriod {
        private LocalDate startDate;
        private LocalDate endDate;
        private double totalSales;
        // constructor, getters
    }
}
```

### Example 5: Tree Traversal in Organization Chart

```java
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REAL WORLD SCENARIO:
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Business Need: "Calculate total salary budget for a manager's team"
 *
 * Context: Manager wants to know: "How much am I spending on my entire team?"
 *          This includes direct reports AND their reports (recursive)
 *
 * INPUT:  Manager ID = 5
 * OUTPUT: Total salary of manager + all subordinates at all levels
 *
 * WHY TREE TRAVERSAL: Organization is a tree structure
 *                     Need to visit all nodes (employees) under a subtree
 */

public class OrganizationService {

    /**
     * Calculate total salary budget for a manager's team
     *
     * THIS IS DFS (Depth First Search) on a tree!
     */
    public BigDecimal calculateTeamBudget(Employee manager) {
        // Base case: just this employee's salary
        BigDecimal total = manager.getSalary();

        // Recursive case: add all subordinates' budgets
        for (Employee subordinate : manager.getDirectReports()) {
            total = total.add(calculateTeamBudget(subordinate));
        }

        return total;
    }

    /**
     * Same thing, iterative version using stack (explicit DFS)
     */
    public BigDecimal calculateTeamBudgetIterative(Employee manager) {
        BigDecimal total = BigDecimal.ZERO;

        Stack<Employee> stack = new Stack<>();
        stack.push(manager);

        while (!stack.isEmpty()) {
            Employee current = stack.pop();
            total = total.add(current.getSalary());

            // Add all direct reports to stack
            for (Employee subordinate : current.getDirectReports()) {
                stack.push(subordinate);
            }
        }

        return total;
    }

    /**
     * Find all employees at a certain level
     *
     * Business use: "Show me all Senior Managers" (level 3)
     *
     * THIS IS BFS (Breadth First Search)!
     */
    public List<Employee> getEmployeesAtLevel(Employee root, int targetLevel) {
        List<Employee> result = new ArrayList<>();

        if (targetLevel == 0) {
            result.add(root);
            return result;
        }

        Queue<Employee> queue = new LinkedList<>();
        queue.offer(root);
        int currentLevel = 0;

        while (!queue.isEmpty() && currentLevel < targetLevel) {
            int levelSize = queue.size();
            currentLevel++;

            for (int i = 0; i < levelSize; i++) {
                Employee emp = queue.poll();

                if (currentLevel == targetLevel) {
                    result.addAll(emp.getDirectReports());
                } else {
                    for (Employee sub : emp.getDirectReports()) {
                        queue.offer(sub);
                    }
                }
            }
        }

        return result;
    }

    /**
     * Find common manager of two employees
     *
     * Business use: "Who should approve a transfer between these two teams?"
     *
     * THIS IS LCA (Lowest Common Ancestor)!
     */
    public Employee findCommonManager(Employee emp1, Employee emp2) {
        // Get path from emp1 to CEO
        Set<Long> ancestors1 = new HashSet<>();
        Employee current = emp1;
        while (current != null) {
            ancestors1.add(current.getId());
            current = current.getManager();
        }

        // Walk up from emp2, first match is LCA
        current = emp2;
        while (current != null) {
            if (ancestors1.contains(current.getId())) {
                return current;
            }
            current = current.getManager();
        }

        return null;  // No common ancestor (shouldn't happen)
    }
}
```

---

# PART 5: JUNIOR DEVELOPER'S LEARNING PATH

## 🎓 From Theory to Production: The Right Way

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              THE JUNIOR → SENIOR PATH (WHAT I RECOMMEND)                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

You asked: "Learn functionalities first, then architecture?"

ABSOLUTELY YES. Here's the detailed path:

┌──────────────────────────────────────────────────────────────────────────────┐
│                           LEVEL 0: FRESHER                                    │
│                        (Where you are now)                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FOCUS: Write SMALL, CORRECT functions                                        │
│                                                                              │
│ What to learn:                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ 1. Write a function that validates an email address                    │  │
│ │ 2. Write a function that calculates GST                                │  │
│ │ 3. Write a function that checks if array has duplicates                │  │
│ │ 4. Write a function that finds the maximum in a list                   │  │
│ │ 5. Write a function that sorts a list of orders by date                │  │
│ │ 6. Write a function that groups items by category                      │  │
│ │ 7. Write a function that calculates moving average                     │  │
│ │ 8. Write a function that validates a PAN number format                 │  │
│ │ 9. Write a function that calculates age from date of birth             │  │
│ │ 10. Write a function that checks if two time ranges overlap            │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ DON'T WORRY ABOUT: Architecture, microservices, deployment                  │
│                                                                              │
│ TIME: 3-6 months                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                       LEVEL 1: JUNIOR DEVELOPER                               │
│                    (After getting first job)                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FOCUS: Combine functions into FEATURES                                       │
│                                                                              │
│ What to learn:                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ 1. Build a login feature (validate, hash password, create session)     │  │
│ │ 2. Build a CRUD for "Products" (create, read, update, delete)         │  │
│ │ 3. Build an invoice generation feature                                 │  │
│ │ 4. Build a simple approval workflow (submit → approve → complete)     │  │
│ │ 5. Build a search with filters and pagination                         │  │
│ │ 6. Write unit tests for your functions                                 │  │
│ │ 7. Handle errors gracefully (what if database is down?)               │  │
│ │ 8. Read and understand existing code in the project                    │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ DON'T WORRY ABOUT: System design, scaling, infrastructure                   │
│                                                                              │
│ TIME: 1-2 years                                                             │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                       LEVEL 2: MID-LEVEL DEVELOPER                            │
│                         (2-4 years experience)                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FOCUS: Design SERVICES and MODULES                                           │
│                                                                              │
│ What to learn:                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ 1. Design database schema for a module (e.g., Orders module)          │  │
│ │ 2. Design REST APIs with proper naming and versioning                 │  │
│ │ 3. Implement caching strategies                                        │  │
│ │ 4. Handle concurrent requests (race conditions)                        │  │
│ │ 5. Write integration tests                                             │  │
│ │ 6. Performance optimization (queries, algorithms)                      │  │
│ │ 7. Mentor junior developers                                            │  │
│ │ 8. Participate in code reviews                                         │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ NOW START THINKING ABOUT: Service boundaries, API design                    │
│                                                                              │
│ TIME: 2-3 years                                                             │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                        LEVEL 3: SENIOR DEVELOPER                              │
│                         (4-7 years experience)                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FOCUS: Design SYSTEMS and ARCHITECTURES                                      │
│                                                                              │
│ What to learn:                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ 1. Design entire ERP module (Finance, HR, etc.)                        │  │
│ │ 2. Choose tech stack for new projects                                  │  │
│ │ 3. Design for scalability (10x, 100x growth)                          │  │
│ │ 4. Security architecture                                               │  │
│ │ 5. Integration with external systems                                   │  │
│ │ 6. Disaster recovery, high availability                                │  │
│ │ 7. Lead a team of developers                                           │  │
│ │ 8. Make build vs buy decisions                                         │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ NOW YOU DESIGN: Microservices, event-driven systems, data pipelines         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Why This Order Works (Psychology)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║         WHY "SMALL TO BIG" IS PSYCHOLOGICALLY CORRECT                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

1. CONFIDENCE BUILDS INCREMENTALLY
   ┌──────────────────────────────────────────────────────────────────────────┐
   │                                                                          │
   │   Write calculateTax() → Works! → Confidence +10                        │
   │   Write validateEmail() → Works! → Confidence +10                       │
   │   Write entire TaxService → Works! → Confidence +50                     │
   │   Design Tax Module → Works! → Confidence +100                          │
   │                                                                          │
   │   vs                                                                     │
   │                                                                          │
   │   Try to design Tax Module directly → Overwhelmed → Confidence -100     │
   │                                                                          │
   └──────────────────────────────────────────────────────────────────────────┘

2. ERRORS ARE SMALLER AND FIXABLE
   ┌──────────────────────────────────────────────────────────────────────────┐
   │                                                                          │
   │   Bug in calculateTax()? Fix takes 10 minutes.                          │
   │   Bug in tax module architecture? Fix takes 2 weeks.                    │
   │                                                                          │
   │   Learning from small mistakes is safe.                                 │
   │   Learning from architecture mistakes is expensive.                     │
   │                                                                          │
   └──────────────────────────────────────────────────────────────────────────┘

3. PATTERNS BECOME OBVIOUS WITH EXPERIENCE
   ┌──────────────────────────────────────────────────────────────────────────┐
   │                                                                          │
   │   After writing 100 functions, you notice:                              │
   │   "Hmm, I keep writing validation → process → save"                     │
   │                                                                          │
   │   This naturally leads to:                                              │
   │   "Maybe there's a pattern here... Service Layer pattern!"             │
   │                                                                          │
   │   Patterns EMERGE from experience, not from reading books.              │
   │                                                                          │
   └──────────────────────────────────────────────────────────────────────────┘

4. DOMAIN KNOWLEDGE ACCUMULATES
   ┌──────────────────────────────────────────────────────────────────────────┐
   │                                                                          │
   │   Implementing tax functions → "Oh, there's TDS, GST, different slabs"  │
   │   Implementing payment → "Oh, there's reconciliation, reversals"        │
   │   Implementing inventory → "Oh, there's reservation, allocation"        │
   │                                                                          │
   │   After 2 years of this, you UNDERSTAND the business!                   │
   │   Now you CAN design architecture because you know what's needed.       │
   │                                                                          │
   └──────────────────────────────────────────────────────────────────────────┘
```

---

# PART 6: YOUR ACTION PLAN

## 📋 What to Do Starting Today

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                 YOUR 30-DAY STARTER PLAN                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

WEEK 1: MASTER BASIC FUNCTIONS
┌────────────────────────────────────────────────────────────────────────────┐
│ Day 1: Write calculateGST(amount, rate, sellerState, buyerState)          │
│ Day 2: Write validatePAN(panNumber) and validateAadhaar(aadhaar)          │
│ Day 3: Write findDuplicates(list) and removeDuplicates(list)              │
│ Day 4: Write calculateAge(dateOfBirth) and isAdult(dateOfBirth)           │
│ Day 5: Write generateOrderNumber(prefix, date, sequence)                  │
│ Day 6: Write isDateRangeOverlapping(start1, end1, start2, end2)           │
│ Day 7: Review and refactor all functions                                   │
└────────────────────────────────────────────────────────────────────────────┘

WEEK 2: CONNECT FUNCTIONS TO BUSINESS
┌────────────────────────────────────────────────────────────────────────────┐
│ Day 8: Write calculateInvoiceTotal(items) with tax                        │
│ Day 9: Write applyDiscount(amount, discountType, discountValue)           │
│ Day 10: Write calculateEMI(principal, rate, months)                       │
│ Day 11: Write calculateSimpleInterest, calculateCompoundInterest          │
│ Day 12: Write calculatePayroll(baseSalary, allowances, deductions)        │
│ Day 13: Write calculateLeaveBalance(entitlement, taken, carryForward)     │
│ Day 14: Review and add unit tests                                          │
└────────────────────────────────────────────────────────────────────────────┘

WEEK 3: DATA STRUCTURES IN BUSINESS CONTEXT
┌────────────────────────────────────────────────────────────────────────────┐
│ Day 15: Use HashMap for inventory lookup                                   │
│ Day 16: Use ArrayList for order line items                                 │
│ Day 17: Use sorting for order by date, amount                             │
│ Day 18: Use binary search for price slabs                                  │
│ Day 19: Use two pointers for reconciliation                                │
│ Day 20: Use sliding window for moving averages                             │
│ Day 21: Combine multiple concepts into a mini-project                      │
└────────────────────────────────────────────────────────────────────────────┘

WEEK 4: BUILD MINI-MODULE
┌────────────────────────────────────────────────────────────────────────────┐
│ Day 22-28: Build a simple Invoice Management System                        │
│                                                                            │
│ Features:                                                                  │
│ - Create invoice with line items                                          │
│ - Calculate subtotal, tax, total                                          │
│ - Apply discounts                                                         │
│ - Generate invoice number                                                 │
│ - Mark as paid/unpaid                                                     │
│ - List overdue invoices                                                   │
│ - Calculate total outstanding                                             │
│                                                                            │
│ This is a COMPLETE small project using everything you learned!            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 7: 6 POWER LEARNING TECHNIQUES

## 🧠 HOW TO ACTUALLY LEARN (Not Just Read)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║     USE THESE 6 TECHNIQUES TO ACTUALLY RETAIN WHAT YOU LEARN                  ║
║                                                                               ║
║     Full details: 09_Career_Reference/04_Brain_Psychology.md                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ TECHNIQUE 1: ACTIVE RECALL                                                   │
│ ────────────────────────────                                                 │
│                                                                              │
│ DON'T: Read about calculateGST() 5 times                                    │
│                                                                              │
│ DO:   Read once → Close notes → Try to write from memory →                  │
│       Check what you missed → Fill gaps                                     │
│                                                                              │
│ "Reading FEELS productive. Recalling BUILDS mastery."                       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TECHNIQUE 2: 45-15 FOCUS BLOCKS                                              │
│ ────────────────────────────────                                             │
│                                                                              │
│ Your brain needs rhythm:                                                    │
│ • 45 minutes: DEEP FOCUS (phone in another room!)                          │
│ • 15 minutes: REAL BREAK (walk, water, stretch - NO SCROLLING!)            │
│ • Repeat 3-4 times                                                          │
│                                                                              │
│ "Your brain LOVES clear start-stop cycles."                                 │
│                                                                              │
│ WHY NO PHONE DURING BREAK?                                                  │
│ Phone uses SAME brain areas as coding → No real rest                        │
│ Walking uses DIFFERENT brain areas → Actual recovery                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TECHNIQUE 3: BLURTING                                                        │
│ ──────────────────────                                                       │
│                                                                              │
│ After learning "GST Calculation":                                           │
│                                                                              │
│ 1. Close all notes and documentation                                        │
│ 2. Take blank paper                                                          │
│ 3. Write EVERYTHING you remember about GST calculation                      │
│    (CGST, SGST, IGST, rates, inter-state rules, code...)                   │
│ 4. Open notes - fill what you missed in RED ink                             │
│                                                                              │
│ The RED parts = what you need to study more!                                │
│ You can't hide from what you don't know.                                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TECHNIQUE 4: 2-3-7 REVISION RULE                                             │
│ ────────────────────────────────                                             │
│                                                                              │
│ Day 1: Learn "Invoice Generation"                                           │
│ Day 2: Quick review (10 min) - test yourself                               │
│ Day 3: Quick review (10 min) - test yourself                               │
│ Day 7: Weekly review - test yourself                                        │
│                                                                              │
│ After Day 7: It's in long-term memory!                                      │
│                                                                              │
│ "Spaced repetition BEATS last-minute cramming."                             │
│                                                                              │
│ For your 30-day plan:                                                       │
│ ┌──────────────┬───────┬───────┬───────┬───────┐                           │
│ │ Topic        │ Day 1 │ Day 2 │ Day 3 │ Day 7 │                           │
│ ├──────────────┼───────┼───────┼───────┼───────┤                           │
│ │ GST Calc     │ Mon   │ Tue   │ Wed   │ Sun   │                           │
│ │ Invoice      │ Tue   │ Wed   │ Thu   │ Mon   │                           │
│ │ EMI Calc     │ Wed   │ Thu   │ Fri   │ Tue   │                           │
│ └──────────────┴───────┴───────┴───────┴───────┘                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TECHNIQUE 5: FEYNMAN TECHNIQUE                                               │
│ ────────────────────────────────                                             │
│                                                                              │
│ Can you explain "Accounts Receivable" to your 10-year-old cousin?          │
│                                                                              │
│ BAD: "AR is an accounting term for money owed to a company by             │
│       customers for goods/services delivered on credit terms."             │
│                                                                              │
│ GOOD: "Imagine you gave your friend 10 chocolates today.                   │
│        He promised to pay you ₹50 tomorrow.                                │
│        That ₹50 he owes you = Accounts Receivable.                         │
│        It's YOUR money, but you don't have it yet!"                        │
│                                                                              │
│ "If you can't SIMPLIFY it, you don't UNDERSTAND it yet."                   │
│                                                                              │
│ TEST: Record yourself explaining for 2 minutes.                             │
│       If you stumble = you need to study that part more.                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ TECHNIQUE 6: QUESTION FIRST APPROACH                                         │
│ ──────────────────────────────────────                                       │
│                                                                              │
│ DON'T: Read all about "Order Management" → Then try problems               │
│        (You don't know WHAT matters, so you learn vaguely)                  │
│                                                                              │
│ DO:   Look at Order Management code/problems FIRST →                        │
│       Notice: "I don't understand how inventory locking works" →            │
│       NOW read about inventory locking with PURPOSE →                       │
│       Return to code with understanding                                     │
│                                                                              │
│ "It trains your brain to study with PURPOSE."                               │
│                                                                              │
│ For this guide:                                                             │
│ 1. Look at the code examples FIRST                                          │
│ 2. Try to understand what they do                                           │
│ 3. Note what confuses you                                                   │
│ 4. THEN read the explanations                                               │
└──────────────────────────────────────────────────────────────────────────────┘

APPLY TO YOUR 30-DAY PLAN:
═══════════════════════════

DAILY SCHEDULE:
───────────────
[Morning 09:00-09:45] Look at today's code example FIRST (Question First)
                      Try to understand, note gaps

[09:45-10:00] Break - walk, no phone!

[10:00-10:45] Read explanation with PURPOSE (filling gaps you noticed)

[10:45-11:00] Break

[11:00-11:45] Write the function from memory (Active Recall)
              Don't look at notes until you TRY

[Lunch] Blurt session - write everything you learned on paper
        Fill gaps in red

[Evening] 2-3-7 revision
          • Today's topic (Day 1)
          • Yesterday's topic (Day 2)
          • 2 days ago (Day 3)

[Night] Feynman test - can you explain today's topic simply?
```

---

## 🎯 Final Message

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      TO YOU, THE ASPIRING DEVELOPER                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

You said: "I have good knowledge in theory, applying logic is critical to me"

THIS IS SOLVABLE. Here's the truth:

┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│ Theory is READING. Application is DOING.                                    │
│                                                                              │
│ You can't learn to ride a bicycle by reading about it.                      │
│ You can't learn to cook by watching YouTube.                                │
│ You can't learn to code by only understanding concepts.                     │
│                                                                              │
│ The ONLY way to bridge the gap:                                             │
│                                                                              │
│   WRITE → FAIL → UNDERSTAND WHY → FIX → REPEAT                              │
│                                                                              │
│ Every function you write, even if wrong, teaches you something.             │
│ Every bug you fix adds to your mental library.                              │
│ Every "aha!" moment builds your intuition.                                  │
│                                                                              │
│ START WITH:                                                                  │
│ "I will write ONE function today that does ONE small thing correctly."      │
│                                                                              │
│ After 100 functions, you'll be a different person.                          │
│ After 1000 functions, you'll be a good developer.                           │
│ After 10000 functions, you'll be a senior developer.                        │
│                                                                              │
│ Your anna gave you VISION (ERP, enterprise systems).                        │
│ Now you need PRACTICE (write, fail, learn, repeat).                         │
│                                                                              │
│ YOU WILL GET THERE. The path is clear. Just start walking.                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

"The expert in anything was once a beginner." - Helen Hayes
```

---

_This document is part of your journey. Come back to it when you need direction._
