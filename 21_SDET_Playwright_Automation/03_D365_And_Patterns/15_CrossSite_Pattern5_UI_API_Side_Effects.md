# 15. Cross-Website Pattern 5 — UI Action Triggers API Side Effects

**Navigation**: [← Chapter 14: Token & Magic Link](./14_CrossSite_Pattern4_Token_Magic_Link.md) | [Index](../00_INDEX.md) | [→ Chapter 16: StorageState Chaining](./16_CrossSite_Pattern6_StorageState_Chaining.md)

**Cross-links:**

- [`24_Advanced_API_Testing/05_Data_From_API_To_Test.md`](../../24_Advanced_API_Testing/05_Data_From_API_To_Test.md) — API client patterns
- [`07_test_step_E2E_Architecture.md`](../02_Core_Architecture/07_test_step_E2E_Architecture.md) — Data Accumulator for orderId

---

## 5W1H

- **WHAT**: Verifying that a UI action (button click, form submit) on the frontend actually triggered downstream services — notifications, events, audit logs, database writes — that have NO UI of their own.
- **WHY**: The UI can show ✓ "Order placed!" while the backend silently failed to notify the warehouse. The customer thinks their order was placed. The warehouse never gets it. You've shipped a bug to production. UI-only testing misses this class of failure entirely.
- **WHO**: SDETs testing any workflow where one user action triggers downstream services.
- **WHEN**: Any test where the business requirement says "...and the system sends a notification" or "...and the event is logged."
- **HOW**: After the UI action, call the side-effect service's API directly to verify the downstream effect actually occurred.

---

## 1. The "Success Theatre" Anti-Pattern

```
What the UI shows:
  ┌────────────────────────────────┐
  │  ✓ Order placed successfully!  │  ← UI shows this
  │  Order ID: ORD-12345           │
  └────────────────────────────────┘

What actually happened (possible scenarios):
  Scenario A — Everything worked:
    Backend → Order DB → Notification Service → SMS + Email → Warehouse API ✓

  Scenario B — Silent failure:
    Backend → Order DB ✓
              ↓
              Notification Service → FAILED (timeout, wrong endpoint)
              Warehouse API → FAILED (auth error)

  Your UI-only test passes in BOTH scenarios.
  The customer's order confirmation never arrives.
  The warehouse never gets the order.
```

**The fix:** After the UI shows success, verify the DOWNSTREAM EFFECTS via API.

---

## 2. The 4 Side-Effect Verification Strategies

### Strategy 1 — Direct API Call to the Side-Effect Service

```typescript
// After placing an order via UI:
const orderId = await customerPortal.getConfirmedOrderId();

// Call the notification service's API directly
const notifications = await notificationsClient.getByOrderId(orderId);
expect(notifications).toContainEqual(
  expect.objectContaining({
    type: "ORDER_CONFIRMED",
    channel: "email",
    status: "delivered",
  }),
);
```

**Best for:** Services that expose a query API (notification service, audit log service, event log).

### Strategy 2 — Network Interception (Verify the Request Was Sent)

```typescript
// Register the interceptor BEFORE the UI action
const requestPromise = page.waitForRequest(
  (req) => req.url().includes("/api/notifications") && req.method() === "POST",
);

await customerPortal.placeOrder(testProduct, testPaymentMethod);

// Verify the outgoing request was actually made
const notificationRequest = await requestPromise;
const requestBody = JSON.parse(notificationRequest.postData()!);
expect(requestBody.type).toBe("ORDER_CONFIRMED");
expect(requestBody.userId).toBe(testAccount.userId);
```

**Best for:** When the service is called directly from the browser (BFF pattern). Not useful when the backend calls the service server-to-server.

### Strategy 3 — Database Check

```typescript
// After UI action:
const orderId = await customerPortal.getConfirmedOrderId();

// Query DB directly (using your mssql fixture)
const result = await db
  .request()
  .input("orderId", sql.NVarChar, orderId)
  .query("SELECT status, notified_at FROM Orders WHERE order_id = @orderId");

expect(result.recordset[0].status).toBe("CONFIRMED");
expect(
  result.recordset[0].notified_at,
  "notification timestamp must be set",
).not.toBeNull();
```

**Best for:** When the notification/event writes back to the database on success.

### Strategy 4 — `expect.poll` for Eventual Consistency

Some side effects are asynchronous — they happen on a message queue and arrive within seconds:

```typescript
await expect
  .poll(
    async () => {
      const notifications = await notificationsClient.getByOrderId(orderId);
      return notifications.some(
        (n) => n.type === "ORDER_CONFIRMED" && n.status === "delivered",
      );
    },
    {
      message: "ORDER_CONFIRMED notification should arrive within 30 seconds",
      timeout: 30_000,
      intervals: [1000, 2000, 3000, 5000, 5000, 5000, 5000],
    },
  )
  .toBe(true);
```

---

## 3. Full Implementation — Order Placement + Notification Verification

```typescript
// clients/NotificationsClient.ts

export interface Notification {
  id: string;
  type:
    | "ORDER_CONFIRMED"
    | "ORDER_SHIPPED"
    | "PAYMENT_RECEIVED"
    | "ACCOUNT_SUSPENDED";
  userId: string;
  referenceId: string; // orderId, citationId, etc.
  channel: "email" | "sms" | "push";
  status: "queued" | "sent" | "delivered" | "failed";
  createdAt: string;
  deliveredAt: string | null;
}

export class NotificationsClient {
  constructor(
    private readonly request: import("@playwright/test").APIRequestContext,
    private readonly authToken: string,
  ) {}

  async getByUserId(
    userId: string,
    filters: { after?: string; type?: string } = {},
  ): Promise<Notification[]> {
    const response = await this.request.get(
      `${process.env.NOTIFICATIONS_SERVICE_URL}/api/notifications`,
      {
        params: { userId, ...filters },
        headers: { Authorization: `Bearer ${this.authToken}` },
      },
    );
    if (!response.ok())
      throw new Error(`Notifications API: ${response.status()}`);
    return response.json();
  }

  async getByReferenceId(referenceId: string): Promise<Notification[]> {
    const response = await this.request.get(
      `${process.env.NOTIFICATIONS_SERVICE_URL}/api/notifications`,
      {
        params: { referenceId },
        headers: { Authorization: `Bearer ${this.authToken}` },
      },
    );
    return response.json();
  }
}
```

```typescript
// tests/specs/cross-website/order-notification.spec.ts

import { test, expect } from "../../fixtures";
import { CustomerPortalPage } from "../../websites/customer-portal/pages/CustomerPortalPage";
import { NotificationsClient } from "../../clients/NotificationsClient";

test("Customer places order → notification service receives ORDER_CONFIRMED", async ({
  page,
  request,
  account,
}) => {
  const data = {
    beforeOrderTime: "",
    orderId: null as string | null,
    uiConfirmed: false,
    notificationSent: false,
    emailDelivered: false,
    smsDelivered: false,
  };

  const customerPortal = new CustomerPortalPage(page);
  const notificationsClient = new NotificationsClient(
    request,
    account.accessToken,
  );

  await test.step("Navigate to customer portal and login", async () => {
    await customerPortal.goto();
    await customerPortal.loginWith(account.email, account.password);
    await expect(customerPortal.dashboardWelcome).toBeVisible({
      timeout: 20000,
    });
  });

  // Capture timestamp BEFORE the action (for filtering notifications)
  await test.step("Capture pre-action timestamp", async () => {
    data.beforeOrderTime = new Date().toISOString();
  });

  await test.step("Add product to cart and place order", async () => {
    await customerPortal.navigateToProducts();
    await customerPortal.addToCart("PROD-TEST-001");
    await customerPortal.proceedToCheckout();
    await customerPortal.selectPaymentMethod("CARD_ON_FILE");
    await customerPortal.confirmOrder();
  });

  await test.step("UI confirms order placed", async () => {
    await expect(customerPortal.orderSuccessMessage).toBeVisible({
      timeout: 15000,
    });
    data.orderId = await customerPortal.getConfirmedOrderId();
    data.uiConfirmed = true;
    expect(
      data.orderId,
      "Order ID must be present on confirmation screen",
    ).not.toBeNull();
  });

  // ─── SIDE EFFECT VERIFICATION ─────────────────────────────────────────────

  await test.step("Notification service received ORDER_CONFIRMED event", async () => {
    let matchedNotification:
      | import("../../clients/NotificationsClient").Notification
      | undefined;

    await expect
      .poll(
        async () => {
          const notifications = await notificationsClient.getByUserId(
            account.userId,
            { after: data.beforeOrderTime },
          );
          matchedNotification = notifications.find(
            (n) =>
              n.type === "ORDER_CONFIRMED" && n.referenceId === data.orderId,
          );
          return matchedNotification !== undefined;
        },
        {
          message: `ORDER_CONFIRMED notification for order ${data.orderId} should appear within 30s`,
          timeout: 30_000,
          intervals: [1000, 2000, 3000, 5000],
        },
      )
      .toBe(true);

    data.notificationSent = true;

    expect(matchedNotification!.referenceId).toBe(data.orderId);
    expect(["queued", "sent", "delivered"]).toContain(
      matchedNotification!.status,
    );
  });

  await test.step("Email notification was delivered", async () => {
    const notifications = await notificationsClient.getByReferenceId(
      data.orderId!,
    );
    const emailNotification = notifications.find(
      (n) => n.type === "ORDER_CONFIRMED" && n.channel === "email",
    );
    expect(emailNotification, "Email notification must exist").toBeDefined();
    expect(emailNotification!.status).toBe("delivered");
    data.emailDelivered = true;
  });
});
```

---

## 4. Network Interception — Verify Browser-to-Service Calls

```typescript
test("UI sends correct payload to notification service on order", async ({
  page,
}) => {
  let capturedPayload: Record<string, unknown> | null = null;

  // Register interceptor BEFORE the UI action
  await page.route("**/api/notifications**", async (route) => {
    const requestBody = route.request().postDataJSON();
    capturedPayload = requestBody;
    // Let the request proceed normally (don't mock the response)
    await route.continue();
  });

  await customerPortal.placeOrder(testProduct);

  // Verify the payload that was sent
  expect(capturedPayload).not.toBeNull();
  expect(capturedPayload!["type"]).toBe("ORDER_CONFIRMED");
  expect(capturedPayload!["userId"]).toBe(testAccount.userId);
  expect(capturedPayload!["channel"]).toContain("email");
});
```

---

## 5. Mocking the Side-Effect Service (When Not Available)

When the notification service isn't running in your test environment:

```typescript
test("Order flow works when notification service is unavailable", async ({
  page,
}) => {
  // Mock the notification service endpoint — return 503
  await page.route("**/api/notifications**", (route) =>
    route.fulfill({ status: 503, body: "Service Unavailable" }),
  );

  await customerPortal.placeOrder(testProduct);

  // UI should still show order confirmation (graceful degradation)
  await expect(customerPortal.orderSuccessMessage).toBeVisible();

  // UI should NOT show an error to the user
  await expect(customerPortal.errorBanner).toHaveCount(0);
});
```

---

## 6. Your Specific Scenario — D365 Citation → IVR API → SMS

```typescript
test("Citation created in D365 → IVR API receives notification → SMS sent to customer", async ({
  page,
  request,
  account,
}) => {
  const data = {
    citationId: null as string | null,
    ivrNotified: false,
    smsSent: false,
  };

  const adminPortal = new AdminPortalPage(page);
  const ivrClient = new APIUtils(request, {} as TestInfo); // your existing APIUtils

  // Create citation in D365
  await test.step("Create new citation in D365 CRM", async () => {
    await adminPortal.goto();
    await adminPortal.citations.createNewCitation({
      customerId: account.userId,
      amount: 150.0,
      type: "PARKING",
    });
    data.citationId = await adminPortal.citations.getCreatedCitationId();
    expect(data.citationId).toMatch(/^CIT-\d+/);
  });

  // Verify IVR API was notified
  await test.step("IVR API received citation notification", async () => {
    const response = await ivrClient.getCallWithResponseCodeValidation(
      `${process.env.IVR_API_URL}/citations/${data.citationId}`,
      HeadersCrm.getCrmHeader(),
      200,
    );
    const body = await response.json();
    expect(body.citationId).toBe(data.citationId);
    expect(body.status).toBe("ACTIVE");
    data.ivrNotified = true;
  });

  // Verify SMS was triggered
  await test.step("SMS notification sent to customer", async () => {
    const notificationsClient = new NotificationsClient(
      request,
      account.accessToken,
    );
    await expect
      .poll(
        async () => {
          const notifications = await notificationsClient.getByReferenceId(
            data.citationId!,
          );
          return notifications.some(
            (n) => n.channel === "sms" && n.status === "delivered",
          );
        },
        { timeout: 30_000 },
      )
      .toBe(true);
    data.smsSent = true;
  });
});
```

---

## 7. Event Bus / Message Queue Verification

Some enterprise side effects go through a message queue (RabbitMQ, Azure Service Bus, Kafka). The queue consumer may provide an API endpoint to query processed messages:

```typescript
// clients/EventBusClient.ts
// Wraps the team's internal event inspection API (common in enterprise test environments)

export class EventBusClient {
  constructor(
    private readonly request: import("@playwright/test").APIRequestContext,
    private readonly serviceToken: string,
  ) {}

  /** Poll for an event of a given type for a given correlation ID */
  async waitForEvent(
    correlationId: string,
    eventType: string,
    timeoutMs = 30_000,
  ): Promise<Record<string, unknown>> {
    const { expect } = await import("@playwright/test");
    let matchedEvent: Record<string, unknown> | null = null;

    await expect
      .poll(
        async () => {
          const response = await this.request.get(
            `${process.env.EVENT_BUS_INSPECTOR_URL}/events`,
            {
              params: { correlationId, type: eventType },
              headers: { Authorization: `Bearer ${this.serviceToken}` },
            },
          );
          if (!response.ok()) return false;
          const events = (await response.json()) as Record<string, unknown>[];
          matchedEvent = events.find((e) => e["type"] === eventType) ?? null;
          return matchedEvent !== null;
        },
        {
          message: `Event '${eventType}' for correlationId '${correlationId}' not found`,
          timeout: timeoutMs,
          intervals: [1000, 2000, 3000, 5000],
        },
      )
      .toBe(true);

    return matchedEvent!;
  }
}

// Usage:
const eventBus = new EventBusClient(request, account.accessToken);
await test.step("Event bus received CITATION_CREATED event", async () => {
  const event = await eventBus.waitForEvent(
    data.citationId!,
    "CITATION_CREATED",
  );
  expect(event["payload"]).toMatchObject({
    citationId: data.citationId,
    customerId: account.userId,
    status: "PENDING",
  });
});
```

---

## 8. Webhook Listener Pattern — Verify Outbound Webhooks

When your system fires outbound webhooks (to partners, CRMs, payment providers), you can verify them using a test webhook listener:

```typescript
// utils/WebhookListener.util.ts
// Simple express server that captures webhook calls during the test

import { createServer, type Server } from "http";

export interface CapturedWebhook {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  receivedAt: Date;
}

export class WebhookListener {
  private server: Server;
  private capturedWebhooks: CapturedWebhook[] = [];
  private readonly port: number;

  constructor(port = 9999) {
    this.port = port;
    this.server = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        this.capturedWebhooks.push({
          url: req.url ?? "/",
          method: req.method ?? "POST",
          headers: req.headers as Record<string, string>,
          body: JSON.parse(body || "{}"),
          receivedAt: new Date(),
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ received: true }));
      });
    });
  }

  async start(): Promise<string> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        const url = `http://localhost:${this.port}`;
        console.log(`[WebhookListener] Listening at ${url}`);
        resolve(url);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => this.server.close(() => resolve()));
  }

  getCaptured(eventType?: string): CapturedWebhook[] {
    if (!eventType) return this.capturedWebhooks;
    return this.capturedWebhooks.filter(
      (w) => (w.body as Record<string, unknown>)["type"] === eventType,
    );
  }

  clear(): void {
    this.capturedWebhooks = [];
  }
}

// Usage in test:
test("System fires ORDER_CONFIRMED webhook to partner", async ({
  page,
  request,
  account,
}) => {
  const listener = new WebhookListener(9999);
  const listenerUrl = await listener.start();

  // Configure your test environment to send webhooks to the listener:
  // (usually via a per-test env config or test-specific partner endpoint)
  process.env.WEBHOOK_ENDPOINT_OVERRIDE = listenerUrl;

  try {
    // ... UI action that should trigger the webhook ...
    await customerPortal.placeOrder(testProduct);

    // Poll until webhook arrives
    let webhooks: CapturedWebhook[] = [];
    await expect
      .poll(
        () => {
          webhooks = listener.getCaptured("ORDER_CONFIRMED");
          return webhooks.length > 0;
        },
        {
          timeout: 15_000,
          message: "Expected ORDER_CONFIRMED webhook within 15s",
        },
      )
      .toBeTruthy();

    expect(webhooks[0].body).toMatchObject({
      type: "ORDER_CONFIRMED",
      orderId: expect.stringMatching(/^ORD-/),
      userId: account.userId,
    });
    // Verify webhook auth header
    expect(webhooks[0].headers["x-webhook-signature"]).toBeTruthy();
  } finally {
    await listener.stop();
  }
});
```

---

### Challenge 1 [MCQ] — Which strategy to use?

Your backend calls the notification service server-to-server (not from the browser). Which strategy verifies the notification was sent?

A) `page.waitForRequest` — intercepts the outgoing HTTP call  
B) `page.route` — mocks the notification API  
C) Call the notification service API directly after the UI action  
D) Check `page.evaluate(() => window.notificationSent)`

<details><summary>Answer</summary>

**C** — When the browser doesn't make the notification call (it's server-to-server), `waitForRequest` (A) sees nothing because Playwright only intercepts BROWSER requests. The fix is to call the notification service API directly in your test after the UI action completes. D is wrong — `window.notificationSent` doesn't exist in a real app.

</details>

---

### Challenge 2 [Spot the Bug]

```typescript
await customerPortal.placeOrder(product);
const notifications = await notificationsClient.getByOrderId(orderId);
const confirmed = notifications.find((n) => n.type === "ORDER_CONFIRMED");
expect(confirmed).toBeDefined();
```

<details><summary>Answer</summary>

Two bugs:

1. **No polling** — The notification may not have arrived yet. The `getByOrderId` call happens immediately after the UI action. Async message queues can take 1-10 seconds. This test will fail intermittently.

2. **`orderId` is undefined** — Where did `orderId` come from? It's never assigned before this code. You need to get it from the confirmation UI first.

Fix:

```typescript
await customerPortal.placeOrder(product);
const orderId = await customerPortal.getConfirmedOrderId(); // ← get it from UI

await expect
  .poll(
    async () => {
      const notifications = await notificationsClient.getByOrderId(orderId);
      return notifications.some((n) => n.type === "ORDER_CONFIRMED");
    },
    { timeout: 30_000 },
  )
  .toBe(true);
```

</details>

---

### Challenge 3 [Write It Yourself]

Write a test that:

1. Places an order on the customer portal
2. Uses `page.route` to simulate the notification service being DOWN (503)
3. Verifies the UI still shows "Order placed" (graceful degradation)
4. Verifies the UI does NOT show any error to the customer

<details><summary>Answer</summary>

```typescript
test("Order UI works gracefully when notification service is down", async ({
  page,
  account,
}) => {
  const customerPortal = new CustomerPortalPage(page);

  // Mock the notification service to be unavailable
  await page.route("**/api/notifications**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Service Unavailable" }),
    }),
  );

  await customerPortal.goto();
  await customerPortal.loginWith(account.email, account.password);
  await customerPortal.navigateToProducts();
  await customerPortal.addToCart("PROD-001");
  await customerPortal.proceedToCheckout();
  await customerPortal.confirmOrder();

  // UI should still show success — graceful degradation
  await expect(customerPortal.orderSuccessMessage).toBeVisible({
    timeout: 15000,
  });

  // No error banner should be visible to the customer
  await expect(customerPortal.errorBanner).toHaveCount(0);
  await expect(customerPortal.technicalErrorMessage).toHaveCount(0);
});
```

</details>

---

### Challenge 4 [Timing — Before-Timestamp]

You write:

```typescript
const notifications = await notificationsClient.getByUserId(account.userId);
const citationNotif = notifications.find((n) => n.type === "CITATION_CREATED");
expect(citationNotif).toBeDefined();
```

The test passes. But a week later it starts failing intermittently with "Found 0 notifications." What's wrong and how do you fix it?

<details><summary>Answer</summary>

**Problem:** The test makes no attempt to filter by time. If this user had a CITATION_CREATED notification from a previous test run (data pollution), the test accidentally relied on stale data. When that old data was cleaned up, the test started failing because it now needs the notification to be created WITHIN this test run.

**Also:** No polling. If the notification service is slow, `getByUserId` is called immediately after the UI action and returns an empty list.

**Fix:**

```typescript
// Capture timestamp BEFORE the action:
const beforeTest = new Date();

// ... UI action ...

// Poll for the notification, filtered to AFTER beforeTest:
await expect
  .poll(
    async () => {
      const notifs = await notificationsClient.getByUserId(
        account.userId,
        { after: beforeTest.toISOString() }, // only notifications from this test
      );
      return notifs.some((n) => n.type === "CITATION_CREATED");
    },
    {
      timeout: 30_000,
      message: "CITATION_CREATED notification not found within 30s",
    },
  )
  .toBe(true);
```

The `beforeTest` timestamp is your isolation fence — it ensures only THIS test's notifications are considered.

</details>

---

### Challenge 5 [Architecture Decision]

Your team debates: should webhook tests use a **real webhook listener server** (like `WebhookListener` above) or a **mocked `page.route()` intercept**? What are the decisive factors?

<details><summary>Answer</summary>

| Factor                    | Real Webhook Listener                                   | `page.route()` Mock                                         |
| ------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| What it tests             | The **backend** fires a real outbound HTTP call         | The **browser** receives a mock response                    |
| Catches backend bugs      | ✅ Yes — if backend doesn't fire, listener gets nothing | ❌ No — route mock is browser-only                          |
| Server-to-server webhooks | ✅ Works (listener is a real HTTP server)               | ❌ Won't work (Playwright only intercepts browser requests) |
| Setup complexity          | High (needs ngrok/tunneling in CI, port conflicts)      | Low (just `await page.route(...)`)                          |
| Test speed                | Slower (real HTTP round-trip)                           | Fast (no network)                                           |

**Decision rule:** If the webhook is fired by the **backend** (server-to-server), use a real listener. If the webhook is fired by the **browser** (BFF pattern), use `page.route()`.

In CI, expose the listener via a local port only (no ngrok needed if backend and test runner are on the same network). For cloud CI, use an internal test webhook relay service.

</details>

---

## 9. Audit Log Verification — Regulated Industry Pattern

In finance, healthcare, and government systems, every material action must produce an immutable audit log entry. The UI may show "success" while the audit log silently failed to write. Test both.

```typescript
// clients/AuditLogClient.ts

export interface AuditLogEntry {
  id: string;
  entityType: string; // 'CITATION', 'CUSTOMER', 'PAYMENT'
  entityId: string; // the ID of the thing that changed
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'SUSPEND', 'PAYMENT_RECEIVED'
  performedBy: string; // user ID of the actor
  performedAt: string; // ISO timestamp
  before: Record<string, unknown> | null; // state before the change
  after: Record<string, unknown> | null; // state after the change
  sourceIp: string;
  sessionId: string;
}

export class AuditLogClient {
  constructor(
    private readonly request: import("@playwright/test").APIRequestContext,
    private readonly authToken: string,
  ) {}

  async getForEntity(
    entityType: string,
    entityId: string,
    opts: { after?: string; action?: string } = {},
  ): Promise<AuditLogEntry[]> {
    const response = await this.request.get(
      `${process.env.AUDIT_SERVICE_URL}/audit-logs`,
      {
        params: { entityType, entityId, ...opts },
        headers: { Authorization: `Bearer ${this.authToken}` },
      },
    );
    if (!response.ok()) throw new Error(`Audit API: ${response.status()}`);
    return response.json();
  }
}
```

```typescript
// tests/specs/compliance/citation-audit.spec.ts

test("Creating a citation produces a compliant audit log entry", async ({
  page,
  request,
  account,
}) => {
  const data = {
    beforeTime: new Date().toISOString(),
    citationId: null as string | null,
  };

  const adminPortal = new AdminPortalPage(page);
  const auditClient = new AuditLogClient(request, account.accessToken);

  await test.step("[Admin] Create a new citation", async () => {
    await adminPortal.goto();
    await adminPortal.citations.createNewCitation({
      customerId: process.env.TEST_CUSTOMER_ID!,
      amount: 200.0,
      type: "PARKING_VIOLATION",
    });
    data.citationId = await adminPortal.citations.getCreatedCitationId();
    expect(data.citationId).toMatch(/^CIT-/);
  });

  await test.step("[Audit] CITATION CREATE event logged within 10s", async () => {
    let auditEntry: AuditLogEntry | undefined;

    await expect
      .poll(
        async () => {
          const logs = await auditClient.getForEntity(
            "CITATION",
            data.citationId!,
            { after: data.beforeTime, action: "CREATE" },
          );
          auditEntry = logs[0];
          return logs.length > 0;
        },
        {
          timeout: 10_000,
          message: "Audit log entry for CREATE must appear within 10s",
        },
      )
      .toBe(true);

    // Structural compliance assertions:
    expect(auditEntry!.action).toBe("CREATE");
    expect(auditEntry!.entityType).toBe("CITATION");
    expect(auditEntry!.entityId).toBe(data.citationId);
    expect(auditEntry!.performedBy).toBe(account.userId);
    expect(auditEntry!.before).toBeNull(); // no state before CREATE
    expect(auditEntry!.after).toMatchObject({
      citationId: data.citationId,
      amount: 200.0,
      status: "PENDING",
    });
    expect(auditEntry!.sourceIp).toMatch(
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    ); // valid IP
    expect(auditEntry!.sessionId).toBeTruthy(); // session must be tracked
  });
});
```

```typescript
// ── Immutability test — audit entries must not be modifiable ─────────────────
test("Audit log entries cannot be deleted or modified", async ({
  request,
  account,
}) => {
  const auditClient = new AuditLogClient(request, account.accessToken);
  const logs = await auditClient.getForEntity("CITATION", data.citationId!);
  const entryId = logs[0].id;

  // Attempt DELETE (must be rejected)
  const deleteResponse = await request.delete(
    `${process.env.AUDIT_SERVICE_URL}/audit-logs/${entryId}`,
    { headers: { Authorization: `Bearer ${account.accessToken}` } },
  );
  expect(deleteResponse.status(), "Audit log DELETE must be forbidden").toBe(
    403,
  );

  // Attempt PUT (must be rejected)
  const updateResponse = await request.put(
    `${process.env.AUDIT_SERVICE_URL}/audit-logs/${entryId}`,
    {
      data: { action: "TAMPERED" },
      headers: { Authorization: `Bearer ${account.accessToken}` },
    },
  );
  expect(updateResponse.status(), "Audit log PUT must be forbidden").toBe(403);
});
```

---

## 10. Event Sourcing Assertion Strategy

In an Event Sourced architecture, the state of an entity (like an Order or Citation) is derived by replaying a sequence of immutable events, rather than updating a single database row. Testing event-sourced systems requires asserting on the _entire event stream_ to guarantee the sequence and payload of events are correct.

```typescript
// tests/specs/architecture/event-sourcing.spec.ts

test("UI action produces the exact expected event sequence in the event store", async ({
  page,
  request,
  account,
}) => {
  const eventStoreClient = new EventStoreClient(request, account.accessToken);

  // 1. Perform complex UI sequence
  await customerPortal.placeOrder(testProduct);
  const orderId = await customerPortal.getConfirmedOrderId();
  await customerPortal.cancelOrder(orderId);

  // 2. Poll the Event Store for the complete sequence
  let eventStream: Record<string, any>[] = [];
  await expect
    .poll(
      async () => {
        eventStream = await eventStoreClient.getStream(`Order-${orderId}`);
        return eventStream.length;
      },
      { timeout: 30_000 },
    )
    .toBeGreaterThanOrEqual(3); // We expect Created, PaymentReserved, Cancelled

  // 3. Assert on the exact sequence and types of events
  expect(eventStream.map((e) => e.eventType)).toEqual([
    "OrderCreated",
    "PaymentReserved",
    "OrderCancelled",
  ]);

  // 4. Assert on critical payloads within the stream
  const cancelEvent = eventStream.find((e) => e.eventType === "OrderCancelled");
  expect(cancelEvent!.payload.reason).toBe("CUSTOMER_INITIATED");
});
```

This strategy ensures you aren't just checking the final state ("Order is Cancelled"), but verifying the exact business rules that led to that state.

---

## 📚 References & Further Reading

### Official Documentation

- [Playwright `expect.poll`](https://playwright.dev/docs/test-assertions#expectpoll) — Essential for dealing with eventual consistency and message queues
- [Playwright `page.waitForRequest`](https://playwright.dev/docs/api/class-page#page-wait-for-request) — For intercepting browser-initiated side effects

### Architecture Patterns

- [Martin Fowler: Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) — Understanding the architecture behind event-sourced systems
- [Martin Fowler: Testing Asynchronous Systems](https://martinfowler.com/articles/async-testing.html) — Strategies for handling propagation delay without flaky tests

---

**Navigation**: [← Chapter 14: Token & Magic Link](./14_CrossSite_Pattern4_Token_Magic_Link.md) | [Index](../00_INDEX.md) | [→ Chapter 16: StorageState Chaining](./16_CrossSite_Pattern6_StorageState_Chaining.md)


---

## Reality Check

**"UI actions and API side effects are always synchronous"**→ A UI button click may trigger an API call that spawns an asynchronous background job (email sending, PDF generation, webhook notification). The UI shows success immediately, but the side effect completes seconds later. Testing the side effect requires polling or waiting for a completion signal, not asserting immediately after the UI action.

**"API assertions after UI actions are redundant"**→ UI assertions verify what the USER sees. API assertions verify what the SYSTEM recorded. These can diverge: a caching layer showing stale data on the UI while the API returns fresh data, or an optimistic UI update that shows success before the server confirms. Testing both layers catches bugs that single-layer testing misses.

**"Verifying side effects in order they were triggered is safe"**→ Asynchronous side effects may complete in any order. An order placement that triggers: inventory update, email notification, and analytics event may complete email before inventory update. Test each side effect independently with its own wait condition rather than assuming sequential completion.

**"API responses are deterministic in test environments"**→ Test environment APIs may return: different data than production (sanitized, subset, or synthetic data), different response times (smaller dataset means faster queries), and different error behavior (test environments often have relaxed rate limits). Ensure your test assertions account for test environment data characteristics.

**"Side effect testing belongs in integration tests, not E2E"**→ E2E tests that verify side effects catch the most realistic bugs: the UI triggers the correct API call, the API processes it correctly, and the side effect actually occurs. Integration tests verify API-to-side-effect in isolation, missing the UI trigger that might send wrong parameters. Include critical side effect verification (payment processed, email sent, data persisted) in E2E tests.
