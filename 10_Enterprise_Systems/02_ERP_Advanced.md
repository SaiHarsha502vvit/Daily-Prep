**Navigation**: [< Previous Chapter](01_ERP_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md)

---


```java
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



🔬 **Section Challenge — 📧 Email Notifications in Hierarchy**

**Challenge 1 (Reasoning):** An ERP system must notify everyone under a manager. Should the notification traversal be DFS, BFS, queue-based async, or direct recursion?
<details><summary>Trace, Reasoning & Debug</summary>

Use traversal to select recipients, then queue work for delivery. DFS/BFS both find descendants, but a queue-based async pipeline gives retries, rate limits, dedupe, and observability. Direct recursion that sends emails inline couples hierarchy walking to slow external I/O.
</details>

**Challenge 2 (Bug Hunt):** A service sends emails inside the same database transaction that updates the organization hierarchy. What can go wrong?
<details><summary>Trace, Reasoning & Debug</summary>

The transaction stays open while email I/O runs, increasing lock time. If the transaction rolls back after emails are sent, users receive messages about changes that never committed. Prefer an outbox/event pattern: commit the hierarchy change and notification event together, then let a worker deliver emails idempotently.
</details>


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
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    ERP INTEGRATION - THE BIG PICTURE                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                           CUSTOMER PLACES ORDER
                                   │
                                   ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            ORDER MANAGEMENT                                   │
│  • Validate cart                                                              │
│  • Calculate prices, taxes                                                    │
│  • Apply promotions                                                           │
│  • Create order record                                                        │
└───────────────────────────────────────────────────────────────────────────────┘
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
┌───────────────────────────────────────────────────────────────────────────────┐
│                           GENERAL LEDGER                                      │
│                                                                               │
│  Sales Revenue       ← Credit (increase)                                      │
│  Cash/Bank           ← Debit (increase)                                       │
│  GST Payable         ← Credit (liability)                                     │
│  Inventory (COGS)    ← Credit (decrease asset)                                │
│  Cost of Goods Sold  ← Debit (expense)                                        │
└───────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            FULFILLMENT                                        │
│  • Pick items from warehouse                                                  │
│  • Pack shipment                                                              │
│  • Generate shipping label                                                    │
│  • Update tracking                                                            │
└───────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                             LOGISTICS                                         │
│  • Assign carrier                                                             │
│  • Generate tracking ID                                                       │
│  • Monitor delivery                                                           │
│  • Handle exceptions                                                          │
└───────────────────────────────────────────────────────────────────────────────┘
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
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    SKILLS YOU'VE LEARNED                                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝

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


---

> **Navigation**: [< Previous](01_ERP_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_ERP_Finance_Core.md)
