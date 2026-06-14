# 50. Email Service Testing — Magic Links, OTPs, and Notifications Without `setTimeout(60000)`

**Navigation**: [← 49. Feature Flag Testing](./49_Feature_Flag_Testing.md) | [Index](../00_INDEX.md) | [→ 51. Secrets Management](../07_Specialised_Testing/51_Secrets_Management_For_SDETs.md)

---

## 5W1H

- **WHAT**: Testing flows that depend on email delivery — magic links, password reset OTPs, order confirmation notifications.
- **WHY**: Real Gmail accounts are forbidden (rate-limited, flaky, leak data). You need a real inbox the test can introspect via API.
- **WHO**: Any team testing signup, login-by-link, password reset, or transactional emails.
- **WHEN**: As soon as an email gates a flow. Don't try to "skip" by clicking a backdoor — that doesn't test the actual delivery path.
- **HOW**: Mailosaur (SaaS), MailHog (self-hosted), or your provider's sandbox inbox.

---

## 0. War Stories — Email Tests Gone Wrong

### Story 1: The attachment validation that passed for 6 months without testing attachments

A team tested the email delivery for invoice emails. The test checked: email arrived, subject correct, body contains order number. Tests passed.

Six months in, an accounting user noticed: "The invoices have no attachment — we've been getting blank emails." The API was sending the email correctly (Mailosaur confirmed delivery), but the PDF attachment generation service was silently failing after a dependency update. The attachment field in the email was present but 0 bytes.

The test never checked `email.attachments.length` or `attachment.content.length`. A test that checks email arrival but not attachment presence is not testing the invoice email flow — it's testing the email infrastructure.

**Fix:**
```typescript
const email = await mailosaur.messages.get(serverId, { sentTo: recipient });
expect(email.attachments).toHaveLength(1);
expect(email.attachments[0].fileName).toBe('invoice-2024-001.pdf');
expect(email.attachments[0].length).toBeGreaterThan(1_000); // sanity check: PDF can't be < 1KB
```

**Lesson:** Always assert on what you actually care about. "Email arrived" is table stakes. "Email arrived with a valid non-empty attachment" is the assertion that catches bugs.

### Story 2: Bounce handling that caused 11,000 emails to be sent to a dead inbox

A test account was created with `test-user-8847@internal.corp` — a valid internal email at the time. The email service had a bounce retry policy: if delivery failed, retry 3 times over 24 hours. No test validated the bounce behavior.

After a company restructuring, the `internal.corp` domain was retired. The email service's retry logic kept sending to the dead address. Over 3 months, the test suite triggered 11,232 emails that bounced. The bounce rate put the company's sending domain on a spam blocklist.

**What should have been tested:**
```typescript
// Test the bounce handling endpoint exists and responds correctly
const bouncePayload = { event: 'bounce', email: testEmail, reason: 'user_unknown' };
const resp = await apiClient.post('/webhooks/email-bounce', bouncePayload);
expect(resp.status).toBe(200);
// Verify no retry was queued
const retryQueue = await apiClient.get(`/email-retries?email=${testEmail}`);
expect(retryQueue.body.count).toBe(0);
```

**Lesson:** Email testing isn't just "did the email send" — it's also "does the system handle failure correctly." Bounce webhooks, suppression lists, and retry policies need dedicated tests.

---

## 1. The choice

|                     | Mailosaur                  | MailHog            | Provider sandbox (SendGrid etc.)  |
| ------------------- | -------------------------- | ------------------ | --------------------------------- |
| **Hosting**         | SaaS                       | Self-hosted, free  | SaaS (sometimes paid)             |
| **API**             | Polished REST + SDK        | OK                 | Varies                            |
| **Real-world feel** | Real SMTP delivery         | Local SMTP capture | Real delivery, sandboxed accounts |
| **Cost**            | Paid, free tier            | Free               | Often free                        |
| **Use when**        | Real delivery path matters | Dev/local only     | You already pay for the provider  |

Default: **Mailosaur for staging tests, MailHog for local dev.**

---

## 2. Generic email client (provider-agnostic shape)

```typescript
export interface InboxMessage {
  id: string;
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  receivedAt: Date;
  links: string[];
}

export interface EmailClient {
  waitForMessage(criteria: {
    to: string;
    subjectContains?: string;
    receivedAfter: Date;
    timeoutMs: number;
  }): Promise<InboxMessage>;
  deleteMessage(id: string): Promise<void>;
  uniqueAddress(prefix?: string): string;
}
```

Tests depend on the interface — swap implementations per env via fixture.

---

## 3. Mailosaur implementation sketch

```typescript
import MailosaurClient from "mailosaur";

export class MailosaurInbox implements EmailClient {
  private readonly client: MailosaurClient;
  private readonly serverId: string;

  constructor(apiKey: string, serverId: string) {
    this.client = new MailosaurClient(apiKey);
    this.serverId = serverId;
  }

  uniqueAddress(prefix = "test"): string {
    return `${prefix}+${Date.now()}@${this.serverId}.mailosaur.net`;
  }

  async waitForMessage({
    to,
    subjectContains,
    receivedAfter,
    timeoutMs,
  }: {
    to: string;
    subjectContains?: string;
    receivedAfter: Date;
    timeoutMs: number;
  }): Promise<InboxMessage> {
    const msg = await this.client.messages.get(
      this.serverId,
      {
        sentTo: to,
        ...(subjectContains ? { subject: subjectContains } : {}),
      },
      { timeout: timeoutMs, receivedAfter },
    );

    return {
      id: msg.id!,
      to,
      subject: msg.subject ?? "",
      textBody: msg.text?.body ?? "",
      htmlBody: msg.html?.body ?? "",
      receivedAt: new Date(msg.received!),
      links: msg.html?.links?.map((l) => l.href ?? "").filter(Boolean) ?? [],
    };
  }

  async deleteMessage(id: string): Promise<void> {
    await this.client.messages.del(id);
  }
}
```

---

## 4. The magic-link test pattern

```typescript
test("@e2e magic link signs the user in", async ({ page, emailInbox }) => {
  const address = emailInbox.uniqueAddress("signup");
  const beforeTime = new Date();

  await page.goto("/signup");
  await page.fill("input[name=email]", address);
  await page.click("button[type=submit]");

  const message = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "Confirm your account",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });

  const link = message.links.find((l) => l.includes("/auth/verify"));
  expect(link, "magic link missing from email").toBeDefined();

  await page.goto(link!);
  await expect(page.getByText("Welcome")).toBeVisible();

  await emailInbox.deleteMessage(message.id);
});
```

Three principles to notice:

1. `uniqueAddress()` — every test gets a fresh inbox-side address.
2. `receivedAfter: beforeTime` — never collide with prior runs.
3. `deleteMessage` on success — cleanup keeps the inbox sane for parallel runs.

---

## 5. Common mistakes

1. **`waitForTimeout(60000)` then "check Gmail."** Slow, flaky, depends on a human Gmail account that gets rate-limited and locked.
2. **Reusing the same email address across tests.** Two parallel tests pull the same message → one of them grabs the wrong one.
3. **Asserting `textBody` only.** Many flows render via HTML only — the text part may be empty. Assert one or the other deliberately.
4. **Not deleting on success.** After 500 runs your inbox has 5,000 messages and `waitForMessage` slows to a crawl.
5. **Trusting the link in the email is in the right env.** Always assert the link contains your env's host.

---

## 6. Senior SDET perspective

Email testing is where new SDETs reach for `waitForTimeout`. Train yourself: any flow involving "wait for something external" → poll the source, never the clock.

---

## 7. DevSecOps seed

Password reset is **the** classic test target for security regressions: token reuse, token expiry, token guessability. Once you have an email fixture, write these three tests for any reset flow you ship:

- Token works once, fails the second time.
- Token expires after N minutes.
- New reset request invalidates the old token.

---

## 8. Exercise

Sign up for a free Mailosaur server (or `docker run mailhog/mailhog` for local). Add an `emailInbox` fixture to [`framework/fixtures/page.fixture.ts`](../framework/fixtures/page.fixture.ts). Write a test for any signup/reset flow you have access to (try a test account on [the-internet.herokuapp.com](https://the-internet.herokuapp.com/forgot_password) for practice). Confirm zero `waitForTimeout` calls in your test code.

---

## 9. MailHog Self-Hosted Setup

MailHog is a self-contained SMTP server and web UI that captures all mail sent to it, with no external dependencies or costs.

### Quick start with Docker

```bash
docker run -d \
  --name mailhog \
  -p 1025:1025   `# SMTP server — use this in your app config` \
  -p 8025:8025   `# Web UI — open http://localhost:8025 to view captured mail` \
  mailhog/mailhog
```

### Configuring your app

Point any SMTP-capable app at MailHog by setting the SMTP host in your environment:

```bash
# .env for local development
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=          # no auth for local MailHog
SMTP_PASS=
SMTP_FROM=noreply@myapp.local
```

For a Node.js app using Nodemailer:

```typescript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
  ignoreTLS: true, // MailHog does not use TLS
});

await transporter.sendMail({
  from: "noreply@myapp.local",
  to: "user@example.com",
  subject: "Test email",
  text: "Hello from MailHog",
});
```

### MailHog API

MailHog exposes a REST API on port 8025 for test code to retrieve messages:

```bash
# List all messages
curl http://localhost:8025/api/v2/messages

# Get a specific message by ID
curl http://localhost:8025/api/v1/messages/<id>

# Delete a message
curl -X DELETE http://localhost:8025/api/v1/messages/<id>

# Delete all messages
curl -X DELETE http://localhost:8025/api/v1/delete/all
```

A message object from MailHog API looks like:

```json
{
  "ID": "abc123",
  "From": { "Email": "noreply@myapp.local" },
  "To": [{ "Email": "user@example.com" }],
  "Subject": "Confirm your account",
  "Content": {
    "Headers": { "Content-Type": ["text/plain; charset=utf-8"] },
    "Body": "Click here to verify: https://app.local/auth/verify?token=xyz",
    "MIME": { "Parts": [] }
  }
}
```

### Why use MailHog over Mailosaur in local dev?

|                         | MailHog                                 | Mailosaur                  |
| ----------------------- | --------------------------------------- | -------------------------- |
| Cost                    | Free (self-hosted)                      | Paid SaaS                  |
| Setup time              | 60 seconds                              | Account required           |
| Real SMTP delivery      | Yes                                     | Yes                        |
| Works offline           | Yes                                     | No                         |
| Persistence             | In-memory (resets on container restart) | Persistent across sessions |
| Suitable for staging CI | No                                      | Yes                        |

**Rule**: Use MailHog for local development and developer workstations. Use Mailosaur for CI and staging environments where you need persistent inboxes across test runs.

---

## 10. Email Fixture Factory

A well-designed email fixture abstracts the provider away so tests never hardcode MailHog vs Mailosaur vs provider sandbox. This makes it possible to run the same test suite locally against MailHog and in CI against Mailosaur.

### The `EmailInbox` interface

```typescript
// framework/emails/email-client.ts
export interface InboxMessage {
  id: string;
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  receivedAt: Date;
  links: string[];
}

export interface EmailClient {
  /**
   * Wait for a message matching the given criteria.
   * Polls the provider until a message is found or timeoutMs is exceeded.
   */
  waitForMessage(params: {
    to: string;
    subjectContains?: string;
    receivedAfter: Date;
    timeoutMs: number;
  }): Promise<InboxMessage>;

  /** Delete a message to keep the inbox clean */
  deleteMessage(id: string): Promise<void>;

  /** Generate a unique email address for this test run */
  uniqueAddress(prefix?: string): string;

  /** Delete all messages (for test-level cleanup) */
  purgeInbox(): Promise<void>;
}
```

### MailHog implementation

```typescript
// framework/emails/providers/mailhog-client.ts
import type { EmailClient, InboxMessage } from "../email-client";

export class MailHogClient implements EmailClient {
  private readonly baseUrl: string;

  constructor(baseUrl = "http://localhost:8025") {
    this.baseUrl = baseUrl;
  }

  uniqueAddress(prefix = "test"): string {
    return `${prefix}+${Date.now()}@mailhog.local`;
  }

  async waitForMessage({
    to,
    subjectContains,
    receivedAfter,
    timeoutMs,
  }: {
    to: string;
    subjectContains?: string;
    receivedAfter: Date;
    timeoutMs: number;
  }): Promise<InboxMessage> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const res = await fetch(`${this.baseUrl}/api/v2/messages`);
      const data = (await res.json()) as { items: any[] };
      const match = data.items.find((msg) => {
        const addr = msg.To?.[0]?.Email ?? "";
        const sub = msg.Content?.Headers?.Subject?.[0] ?? "";
        const recv = new Date(msg.Created);
        return (
          addr.includes(to) &&
          recv >= receivedAfter &&
          (!subjectContains || sub.includes(subjectContains))
        );
      });
      if (match) {
        return this.normalize(match);
      }
      await new Promise((r) => setTimeout(r, 500)); // poll every 500ms
    }
    throw new Error(
      `Email not found in ${timeoutMs}ms for ${to} with subject "${subjectContains}"`,
    );
  }

  async deleteMessage(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/messages/${id}`, { method: "DELETE" });
  }

  async purgeInbox(): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/delete/all`, { method: "DELETE" });
  }

  private normalize(raw: any): InboxMessage {
    const headers = raw.Content?.Headers ?? {};
    const body = raw.Content?.Body ?? "";
    const htmlBody =
      raw.Content?.MIME?.Parts?.find((p: any) =>
        p.Headers?.["Content-Type"]?.[0]?.includes("text/html"),
      )?.Body ?? "";
    const linkRegex = /https?:[^\s"'<>]+/g;
    return {
      id: raw.ID,
      to: raw.To?.[0]?.Email ?? "",
      subject: headers.Subject?.[0] ?? "",
      textBody: body,
      htmlBody,
      receivedAt: new Date(raw.Created),
      links: (body.match(linkRegex) ?? []).concat(
        htmlBody.match(linkRegex) ?? [],
      ),
    };
  }
}
```

### Mailosaur implementation

```typescript
// framework/emails/providers/mailosaur-client.ts
import MailosaurClient from "mailosaur";
import type { EmailClient, InboxMessage } from "../email-client";

export class MailosaurClientImpl implements EmailClient {
  private readonly client: MailosaurClient;
  private readonly serverId: string;

  constructor(apiKey: string, serverId: string) {
    this.client = new MailosaurClient(apiKey);
    this.serverId = serverId;
  }

  uniqueAddress(prefix = "test"): string {
    return `${prefix}+${Date.now()}@${this.serverId}.mailosaur.net`;
  }

  async waitForMessage({
    to,
    subjectContains,
    receivedAfter,
    timeoutMs,
  }: {
    to: string;
    subjectContains?: string;
    receivedAfter: Date;
    timeoutMs: number;
  }): Promise<InboxMessage> {
    const msg = await this.client.messages.get(
      this.serverId,
      {
        sentTo: to,
        ...(subjectContains ? { subject: subjectContains } : {}),
      },
      { timeout: timeoutMs, receivedAfter },
    );
    return {
      id: msg.id!,
      to,
      subject: msg.subject ?? "",
      textBody: msg.text?.body ?? "",
      htmlBody: msg.html?.body ?? "",
      receivedAt: new Date(msg.received!),
      links: msg.html?.links?.map((l) => l.href ?? "").filter(Boolean) ?? [],
    };
  }

  async deleteMessage(id: string): Promise<void> {
    await this.client.messages.del(id);
  }

  async purgeInbox(): Promise<void> {
    const messages = await this.client.messages.list(this.serverId);
    await Promise.all(
      messages.items.map((m) => this.client.messages.del(m.id!)),
    );
  }
}
```

### Factory function — choose provider by environment variable

```typescript
// framework/emails/email-client-factory.ts
import { MailHogClient } from "./providers/mailhog-client";
import { MailosaurClientImpl } from "./providers/mailosaur-client";
import type { EmailClient } from "./email-client";

export function createEmailClient(): EmailClient {
  const provider = process.env.EMAIL_PROVIDER ?? "mailhog";
  if (provider === "mailosaur") {
    if (!process.env.MAILOSAUR_API_KEY || !process.env.MAILOSAUR_SERVER_ID) {
      throw new Error("MAILOSAUR_API_KEY and MAILOSAUR_SERVER_ID must be set");
    }
    return new MailosaurClientImpl(
      process.env.MAILOSAUR_API_KEY,
      process.env.MAILOSAUR_SERVER_ID,
    );
  }
  return new MailHogClient();
}
```

### Playwright fixture wiring

```typescript
// framework/fixtures/email.fixture.ts
import { test as base } from "@playwright/test";
import { createEmailClient } from "../emails/email-client-factory";
import type { EmailClient } from "../emails/email-client";

export const test = base.extend<{ emailInbox: EmailClient }>({
  emailInbox: [
    async ({}, use) => {
      const client = createEmailClient();
      await client.purgeInbox(); // clean slate for this test
      await use(client);
      // No manual cleanup needed — next test starts with purgeInbox()
    },
    { scope: "test" }, // each test gets a clean inbox
  ],
});
```

**Fixture scoping note**: Use `{ scope: 'test' }` for the email inbox so each test gets a fresh, purged inbox. Sharing the inbox across tests (worker scope) introduces race conditions when tests run in parallel.

---

## 11. Testing Complex Email Flows

Beyond magic links, real applications send multi-step, transactional, and scheduled email flows. This section covers the patterns for testing them robustly.

### Order confirmation with attachments

```typescript
test("@e2e order confirmation email with PDF attachment", async ({
  page,
  emailInbox,
}) => {
  const address = emailInbox.uniqueAddress("order");
  const beforeTime = new Date();

  await page.goto("/shop");
  await page.click("button[data-testid=buy-now]");
  await page.fill("input[name=email]", address);
  await page.click("button[type=submit]");
  // Complete payment (mock or test card)
  await page.fill("input[name=card]", "4242424242424242");
  await page.fill("input[name=expiry]", "12/26");
  await page.click("button[data-testid=pay]");
  await expect(page.getByText("Order confirmed")).toBeVisible();

  const message = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "Order Confirmation",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });

  // Verify the email contains the order number
  expect(message.subject).toContain("12345");
  expect(message.textBody).toContain("Thank you for your order");

  // Verify attachment is present (attachment count in headers or MIME structure)
  const hasAttachment =
    message.htmlBody.includes("attachment") ||
    message.textBody.includes(".pdf");
  expect(hasAttachment, "Order confirmation should have a PDF receipt").toBe(
    true,
  );

  await emailInbox.deleteMessage(message.id);
});
```

### Multi-step approval chain (request -> approve -> notify)

```typescript
test("@e2e approval workflow sends notify email after approval", async ({
  page,
  emailInbox,
}) => {
  const requester = emailInbox.uniqueAddress("req");
  const approver = emailInbox.uniqueAddress("approver");
  const beforeTime = new Date();

  // Step 1: Requester submits a request
  await page.goto("/requests/new");
  await page.fill("input[name=email]", requester);
  await page.fill("textarea[name=reason]", "Q4 budget approval");
  await page.fill("input[name=approver_email]", approver);
  await page.click("button[type=submit]");
  await expect(page.getByText("Request submitted")).toBeVisible();

  // Step 2: Approval email arrives for approver
  const approvalEmail = await emailInbox.waitForMessage({
    to: approver,
    subjectContains: "approval required",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });
  const approvalLink = approvalEmail.links.find((l) => l.includes("/approve"));
  expect(approvalLink).toBeDefined();
  await emailInbox.deleteMessage(approvalEmail.id);

  // Step 3: Approver approves the request
  const notifyTime = new Date();
  await page.goto(approvalLink!);
  await page.click("button[data-testid=approve-request]");
  await expect(page.getByText("Approved")).toBeVisible();

  // Step 4: Requester gets notify email
  const notifyEmail = await emailInbox.waitForMessage({
    to: requester,
    subjectContains: "approved",
    receivedAfter: notifyTime,
    timeoutMs: 30_000,
  });
  expect(notifyEmail.textBody).toContain("Q4 budget approval");
  expect(notifyEmail.textBody).toContain("Approved by");
  await emailInbox.deleteMessage(notifyEmail.id);
});
```

### Scheduled digest emails

Digest emails are tricky because they fire based on a cron schedule. Use a test clock to control time:

```typescript
test("@e2e weekly digest email reflects correct period", async ({
  page,
  emailInbox,
}) => {
  const address = emailInbox.uniqueAddress("digest");
  const beforeTime = new Date();

  // Set the user to receive weekly digests and perform some activity
  await page.goto("/settings/emails");
  await page.selectOption("select[name=digest-frequency]", "weekly");
  await page.click("button[type=submit]");
  await page.goto("/dashboard");
  // Create some activity that should appear in the digest
  await page.click("button[data-testid=log-activity]");
  // ... more activity ...

  // Manually trigger digest send (if your app exposes a /api/digest/send endpoint)
  // OR advance the test clock (if your app uses a time-mockable scheduler)
  await page.evaluate(() =>
    fetch("/api/test/trigger-digest", { method: "POST" }),
  );

  const digest = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "Weekly Digest",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });
  expect(digest.textBody).toContain("Your weekly activity summary");
  await emailInbox.deleteMessage(digest.id);
});
```

### Email localisation (i18n)

```typescript
test("@e2e password reset email respects user locale (French)", async ({
  page,
  emailInbox,
}) => {
  const address = emailInbox.uniqueAddress("i18n");
  const beforeTime = new Date();

  await page.goto("/settings");
  await page.selectOption("select[name=locale]", "fr");
  await page.fill("input[name=email]", address);
  await page.click("button[type=submit]");
  await page.goto("/forgot-password");
  await page.fill("input[name=email]", address);
  await page.click("button[type=submit]");

  const message = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "mot de passe",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });
  expect(message.textBody).toContain("Cliquez ici pour");
  expect(message.htmlBody).toContain("Réinitialiser");
  await emailInbox.deleteMessage(message.id);
});
```

---

## 12. Testing Email Rendering

Email clients (Gmail, Outlook, Apple Mail, mobile) each render HTML email differently. Cross-client rendering tests catch layout breakage before users do.

### Screenshot emails in the inbox with Playwright

```typescript
test("@render gmail: password reset email", async ({ page, emailInbox }) => {
  const address = emailInbox.uniqueAddress("render");
  const beforeTime = new Date();

  await page.goto("/forgot-password");
  await page.fill("input[name=email]", address);
  await page.click("button[type=submit]");

  const message = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "Reset your password",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });

  // Render the email HTML in a headless browser
  const emailPage = await page.context().newPage();
  await emailPage.setViewportSize({ width: 600, height: 800 }); // Gmail desktop width
  await emailPage.setContent(message.htmlBody || message.textBody);
  const gmailScreenshot = await emailPage.screenshot();

  // Save screenshot to test artifacts for manual review
  await page.evaluate(
    (buf, name) => {
      require("fs").writeFileSync(
        `./test-results/emails/${name}.png`,
        Buffer.from(buf),
      );
    },
    gmailScreenshot,
    `reset-email-gmail-${Date.now()}`,
  );

  await emailPage.close();
  await emailInbox.deleteMessage(message.id);
});
```

### Testing across multiple viewport sizes (responsive emails)

```typescript
const viewports = [
  { name: "gmail-desktop", width: 600, height: 800 },
  { name: "outlook-desktop", width: 700, height: 900 },
  { name: "iphone-se", width: 375, height: 667 },
  { name: "pixel-6", width: 412, height: 915 },
];

for (const vp of viewports) {
  test(`@render ${vp.name}: order confirmation email`, async ({
    page,
    emailInbox,
  }) => {
    const address = emailInbox.uniqueAddress(`render-${vp.name}`);
    const beforeTime = new Date();

    await page.goto("/shop");
    await page.click("button[data-testid=buy-now]");
    await page.fill("input[name=email]", address);
    await page.click("button[type=submit]");
    // ... complete order ...

    const message = await emailInbox.waitForMessage({
      to: address,
      subjectContains: "Order Confirmation",
      receivedAfter: beforeTime,
      timeoutMs: 30_000,
    });

    const emailPage = await page.context().newPage();
    await emailPage.setViewportSize({ width: vp.width, height: vp.height });
    await emailPage.setContent(message.htmlBody || message.textBody);
    await emailPage.screenshot({
      path: `./test-results/emails/order-conf-${vp.name}-${Date.now()}.png`,
    });
    await emailPage.close();
    await emailInbox.deleteMessage(message.id);
  });
}
```

### Asserting email structure (not just rendering)

Screenshots are visual — they require a human to review. Automated assertions should complement them:

```typescript
test("@structure order confirmation has required elements", async ({
  page,
  emailInbox,
}) => {
  const address = emailInbox.uniqueAddress("struct");
  const beforeTime = new Date();
  // ... trigger email ...
  const message = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "Order Confirmation",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });

  // Check that key elements are present in the HTML
  const html = message.htmlBody;
  expect(html, "Email should include a logo image").toContain("logo");
  expect(html, "Email should include the order number").toMatch(
    /order.*\d{5,}/i,
  );
  expect(html, "Email should include a call-to-action button").toMatch(
    /<a.*href.*track/i,
  );
  expect(html, "Email should include a footer with unsubscribe").toContain(
    "unsubscribe",
  );
  expect(
    html,
    "Email should use table-based layout for Outlook compatibility",
  ).toContain("<table");

  await emailInbox.deleteMessage(message.id);
});
```

---

## 13. Anti-patterns

1. **`waitForTimeout(60000)` before checking the inbox.** The worst offender. This is the manual, human equivalent of refreshing Gmail. Instead, poll the inbox API with a timeout (see section 4 pattern).

2. **Reusing the same email address across tests.** When Test A and Test B both use `test@example.com`, and the app sends an email to that address, whichever test calls `waitForMessage` first gets the message — possibly the wrong one. Always use `uniqueAddress()` to generate a fresh per-test address.

3. **Asserting `textBody` only when HTML is what the user actually sees.** Many transactional email templates send HTML-only emails where the plain text part is empty or minimal. If your assertions live exclusively on the text body, you have no coverage of the rendered email a real user opens. Assert at least one element in `htmlBody`.

4. **Not deleting messages on success.** After 500 test runs, the inbox has 5,000 messages. `waitForMessage` has to filter through all of them on every poll call, slowing your suite from 5 seconds to 90 seconds. Delete messages as soon as the test is done with them.

5. **Trusting email links without asserting the host.** A magic link in an email that reads `https://evil.com/auth/verify?token=xyz` will pass a test that asserts `links.includes('/auth/verify')` but is actually a phishing link. Always assert `new URL(link).host === expectedHost` for security-critical links.

6. **Not testing email in CI (skipping the step).** When a test is flaky, the first thing engineers disable is the email step. This leaves CI green while email delivery is actually broken. Make email tests a hard requirement — do not allow skips in CI.

7. **Testing with a real personal Gmail account.** Using a personal Gmail for automated tests violates Google's Terms of Service, gets the account rate-limited within hours, and leaks test data into a personal inbox. Use MailHog locally and Mailosaur in CI.

8. **Ignoring email accessibility (alt text, colour contrast).** Automated email rendering tests should include accessibility assertions: every `<img>` tag needs an `alt` attribute, and link text should be descriptive (not "click here"). Screen reader users rely on these.

---

## 14. Decision Matrix — Email Provider Choice

| Scenario                                         | Recommended provider              | Why                                                  |
| ------------------------------------------------ | --------------------------------- | ---------------------------------------------------- |
| Local development, no budget                     | MailHog                           | Free, instant, no account needed                     |
| CI / staging with real SMTP delivery             | Mailosaur                         | Persistent inbox, polished API, CI-friendly          |
| Already paying for SendGrid/AWS SES              | Provider sandbox                  | No extra cost, real delivery path                    |
| Team without Docker access                       | Mailosaur SaaS                    | Works without any infra                              |
| Testing email rendering across clients           | Mailosaur + Playwright screenshot | Mailosaur holds real emails, Playwright renders HTML |
| Complex approval chains with multiple recipients | Mailosaur                         | Supports multiple inboxes with search across all     |
| Short-lived CI runners (no persistence)          | MailHog + in-memory               | No external dependency, fast teardown                |
| Enterprise with compliance needs                 | Mailosaur Enterprise              | Audit logs, retention policies, SSO                  |

### Cost comparison (approximate, as of 2024)

| Provider         | Free tier                             | Paid tier                    |
| ---------------- | ------------------------------------- | ---------------------------- |
| MailHog          | Unlimited (self-hosted)               | N/A                          |
| Mailosaur        | 10 emails/mo free                     | ~$15/mo for 500 emails       |
| SendGrid sandbox | 100 emails/day                        | Pay-per-email beyond sandbox |
| AWS SES          | 62,000 emails/mo (free tier eligible) | $0.0001/email beyond free    |

---

## 15. Senior SDET Perspective

Email testing is where the discipline of "poll the source, never the clock" is most visibly violated by engineers who have not yet internalised it.

### The foundational rule

Any flow that depends on an external system (email delivery, webhook arrival, database replication, message queue processing) should be tested by **polling the source until the expected state appears**, with a timeout. Never use `waitForTimeout`. The difference:

- `waitForTimeout(60_000)` waits 60 seconds regardless of whether the email arrived at 2 seconds or 59 seconds.
- `waitForMessage({ timeoutMs: 60_000 })` checks every 500ms and returns as soon as the email is found.

In a suite of 200 tests, eliminating one 60-second `waitForTimeout` per test saves 3.3 hours of CI time.

### Email fixtures as reusable infrastructure

The `emailInbox` fixture is infrastructure, not test code. It belongs in `framework/emails/` and is owned by the SDET team, not by individual test authors. The fixture should:

- Handle all provider differences transparently.
- Guarantee a clean inbox per test (via `purgeInbox()` on fixture setup).
- Provide clear error messages when the email never arrives (include the address, expected subject, and timeout in the error).
- Support both polling (default) and webhook-based wake-up for lower latency.

### The SDET's role in email quality

SDETs who own the email fixture become the go-to person when email delivery breaks. This is a form of **infrastructure ownership** that compounds over time: the better the fixture, the fewer email-related bugs escape to production, and the faster the team moves on email-gated flows.

---

## 16. DevSecOps Seed — Password Reset Security Testing (Expanded)

Password reset is the highest-value target for an attacker because a successful reset grants full account access. This section covers the full security test suite for any reset flow.

### Token reuse — a used token must be invalidated

```typescript
test("@security: reset token cannot be used twice", async ({
  page,
  emailInbox,
}) => {
  const address = emailInbox.uniqueAddress("reset-sec");
  const beforeTime = new Date();

  await page.goto("/forgot-password");
  await page.fill("input[name=email]", address);
  await page.click("button[type=submit]");

  const email = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "password",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });
  const resetLink = email.links.find((l) => l.includes("/reset-password"));
  expect(resetLink).toBeDefined();
  await emailInbox.deleteMessage(email.id);

  // First use — should succeed
  await page.goto(resetLink!);
  await page.fill("input[name=newPassword]", "ValidPassword123!");
  await page.click("button[type=submit]");
  await expect(page.getByText("Password changed")).toBeVisible();

  // Second use — must be rejected
  const response = await page.evaluate(async (url) => {
    const r = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ password: "AnotherPwd456!" }),
    });
    return { status: r.status, ok: r.ok };
  }, resetLink);
  expect(
    response.status,
    "Token reuse should return 400 or 401",
  ).toBeGreaterThanOrEqual(400);
});
```

### Token expiry — expired tokens must be rejected

```typescript
test("@security: expired reset token is rejected", async ({
  page,
  emailInbox,
}) => {
  // This requires your app to expose a test endpoint that advances the clock
  const address = emailInbox.uniqueAddress("reset-exp");
  const beforeTime = new Date();
  await page.goto("/forgot-password");
  await page.fill("input[name=email]", address);
  await page.click("button[type=submit]");
  const email = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "password",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });
  const resetLink = email.links.find((l) => l.includes("/reset-password"));
  await emailInbox.deleteMessage(email.id);

  // Advance server clock past token expiry (requires test API support)
  await page.evaluate(async () => {
    await fetch("/api/test/advance-clock", {
      method: "POST",
      body: JSON.stringify({ seconds: 3601 }),
    });
  });

  const response = await page.evaluate(async (url) => {
    const r = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ password: "AnyPwd!" }),
    });
    return { status: r.status };
  }, resetLink!);
  expect(
    response.status,
    "Expired token should return 400",
  ).toBeGreaterThanOrEqual(400);
});
```

### Token guessability — tokens must be unguessable

```typescript
test("@security: reset tokens are cryptographically random", async ({
  page,
  emailInbox,
}) => {
  const address = emailInbox.uniqueAddress("reset-rng");
  const beforeTime = new Date();
  await page.goto("/forgot-password");
  await page.fill("input[name=email]", address);
  await page.click("button[type=submit]");
  const email1 = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "password",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });
  await emailInbox.deleteMessage(email1.id);

  // Request a second reset token for the same user
  await page.goto("/forgot-password");
  await page.fill("input[name=email]", address);
  await page.click("button[type=submit]");
  const email2 = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "password",
    receivedAfter: new Date(),
    timeoutMs: 30_000,
  });
  const link1 = email1.links.find((l) => l.includes("/reset-password"));
  const link2 = email2.links.find((l) => l.includes("/reset-password"));
  await emailInbox.deleteMessage(email2.id);

  // Tokens must be different on each request (not a counter or timestamp)
  expect(link1).not.toEqual(link2);
  const token1 = new URL(link1!).searchParams.get("token");
  const token2 = new URL(link2!).searchParams.get("token");
  // Tokens should be long enough and random enough (entropy check)
  expect(token1?.length ?? 0).toBeGreaterThanOrEqual(32);
  expect(token1).not.toMatch(/^[0-9]+$/); // not a sequential number
  expect(token1).not.toMatch(/^[a-z]+$/); // not a simple string
});
```

### Rate limiting on reset requests

```typescript
test("@security: reset request rate limiting is enforced", async ({
  page,
  emailInbox,
}) => {
  const address = emailInbox.uniqueAddress("reset-rate");
  const beforeTime = new Date();

  // Rapid-fire 10 reset requests
  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      page.evaluate(
        (email) =>
          fetch("/api/password/reset-request", {
            method: "POST",
            body: JSON.stringify({ email }),
          }).then((r) => r.json()),
        address,
      ),
    ),
  );
  // At least one request should be rate-limited after rapid-fire
  const rateLimited = results.some(
    (r) => r.status === 429 || r.error?.includes("rate"),
  );
  expect(
    rateLimited,
    "Rate limiting should trigger after rapid reset requests",
  ).toBe(true);
});
```

### Brute-force protection on reset token submission

```typescript
test("@security: many wrong tokens triggers account lockout", async ({
  page,
  emailInbox,
}) => {
  const address = emailInbox.uniqueAddress("reset-brute");
  // Get a valid reset link first
  const beforeTime = new Date();
  await page.goto("/forgot-password");
  await page.fill("input[name=email]", address);
  await page.click("button[type=submit]");
  const email = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "password",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });
  const validToken = new URL(email.links[0]).searchParams.get("token");
  await emailInbox.deleteMessage(email.id);

  // Submit many wrong tokens quickly
  const attempts = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      page.evaluate(
        async ({ token, i }) => {
          const r = await fetch(`/api/password/reset?token=WRONG${i}${token}`, {
            method: "POST",
            body: JSON.stringify({ password: "TestPw123!" }),
          });
          return { i, status: r.status };
        },
        { token: validToken, i },
      ),
    ),
  );
  const hasLockout = attempts.some((a) => a.status === 423 || a.status === 429);
  expect(hasLockout, "Brute-force on reset token should trigger lockout").toBe(
    true,
  );
});
```

---

## 17. Exercise — Complete Deliverable

### Objective

Add an `emailInbox` fixture with full MailHog support. Write a test for a signup flow with email verification. Zero `waitForTimeout` calls.

### Prerequisites

```bash
docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

### Step 1 — Add the MailHog client

Create `framework/emails/providers/mailhog-client.ts` with the implementation from section 10. Implement all methods: `uniqueAddress`, `waitForMessage`, `deleteMessage`, `purgeInbox`.

### Step 2 — Wire the Playwright fixture

```typescript
// framework/fixtures/email.fixture.ts
import { test as base } from "@playwright/test";
import { MailHogClient } from "../emails/providers/mailhog-client";
import type { EmailClient } from "../emails/email-client";

export const test = base.extend<{ emailInbox: EmailClient }>({
  emailInbox: [
    async ({}, use) => {
      const client = new MailHogClient("http://localhost:8025");
      await client.purgeInbox();
      await use(client);
    },
    { scope: "test" },
  ],
});
```

### Step 3 — Write the signup + email verification test

```typescript
// tests/e2e/signup-email-verification.spec.ts
import { test } from "../framework/fixtures/email.fixture";

test("@e2e signup with email verification", async ({ page, emailInbox }) => {
  const address = emailInbox.uniqueAddress("signup");
  const beforeTime = new Date();

  await page.goto("/signup");
  await page.fill("input[name=email]", address);
  await page.fill("input[name=password]", "TestPassword123!");
  await page.click("button[type=submit]");

  // Should show "check your email" state, not error
  await expect(
    page.getByText("check your email", { exact: false }),
  ).toBeVisible();

  const message = await emailInbox.waitForMessage({
    to: address,
    subjectContains: "confirm",
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });

  // Verify subject indicates confirmation
  expect(message.subject.toLowerCase()).toContain("confirm");

  // Extract and validate the verification link
  const verifyLink = message.links.find((l) => l.includes("/auth/verify"));
  expect(verifyLink, "Verification link must be present").toBeDefined();

  // Security: confirm the link points to the expected host, not a phishing domain
  const linkHost = new URL(verifyLink!).host;
  expect(linkHost).toMatch(/localhost|myapp\.local|app\.example\.com/);

  // Click the verification link
  await page.goto(verifyLink!);
  await expect(page.getByText("Welcome")).toBeVisible();
  await expect(page.getByText("Email verified")).toBeVisible();

  await emailInbox.deleteMessage(message.id);
});
```

### Step 4 — Verify zero `waitForTimeout`

```bash
grep -rn 'waitForTimeout' tests/
# Must return zero results before the test is considered complete
```

### Self-grading rubric

| Criterion                                                                | 0 (missing)           | 1 (partial)            | 2 (complete)                                  |
| ------------------------------------------------------------------------ | --------------------- | ---------------------- | --------------------------------------------- |
| MailHog client implements all 4 interface methods                        | Not implemented       | 1-2 methods            | All 4 methods implemented                     |
| `waitForMessage` polls without `waitForTimeout`                          | Uses `waitForTimeout` | Partial polling        | Pure polling loop with `setTimeout`           |
| `uniqueAddress` generates per-test unique addresses                      | Hardcoded address     | Simple timestamp only  | Timestamp + random suffix for true uniqueness |
| Signup test completes full flow (signup -> email -> verify -> logged in) | Incomplete            | Partial flow           | Full end-to-end flow, user logged in          |
| Link host is asserted for security                                       | No host check         | Partial check          | Full `new URL(link).host` assertion           |
| Messages deleted after use                                               | Not deleted           | Only on success        | Deleted in both success and no-throw paths    |
| `purgeInbox()` called before test                                        | No cleanup            | Called in `beforeEach` | Called in fixture setup `{ scope: 'test' }`   |
| Zero `waitForTimeout` in test suite                                      | Used 1+ times         | Used only in helper    | Zero occurrences                              |
| **Total**                                                                | **0-7**               | **1-14**               | **8-16**                                      |

**Passing threshold**: 12/16. Below 12, revisit and retest.

### Bonus challenges

- Swap the `MailHogClient` for `MailosaurClientImpl` using only an environment variable change. Verify the test still passes.
- Write a multi-step approval chain test (request -> approve -> notify) with no `waitForTimeout`.
- Write a password reset security test for token reuse (see section 16). Integrate it into the test suite as a separate spec file `tests/security/password-reset.spec.ts`.
