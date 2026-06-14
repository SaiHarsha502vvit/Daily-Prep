# Email Testing

> Specialised reference for testing email-mediated flows (signup, password reset, magic link, MFA). Mailosaur, MailHog, Ethereal. Polling patterns, OTP extraction, attachment verification.

---

## Table of contents

1. [The three test-email strategies](#1-strategies)
2. [Mailosaur](#2-mailosaur)
3. [MailHog (self-hosted)](#3-mailhog)
4. [Ethereal (Nodemailer test inbox)](#4-ethereal)
5. [Polling for an email](#5-polling)
6. [Parsing link / OTP](#6-parsing)
7. [HTML vs text bodies](#7-html-text)
8. [Attachment verification](#8-attachments)
9. [Inbox isolation](#9-isolation)
10. [Common failures](#10-common-failures)

---

## 1. Strategies

| Strategy                                     | When                               |
| -------------------------------------------- | ---------------------------------- |
| Mailosaur SaaS                               | Production-grade, real SMTP, paid  |
| MailHog (self-hosted Docker)                 | Free, CI-friendly                  |
| Ethereal (Nodemailer's test SMTP)            | Free, shared inbox                 |
| Production email service with test addresses | If your service supports test mode |

For CI: MailHog (free) or Mailosaur (paid) are the workhorses.

---

## 2. Mailosaur

Configure your app's SMTP / email service to send to `*@<server-id>.mailosaur.net`. Each address gets a virtual inbox.

```typescript
import { MailosaurClient } from "mailosaur";

const mailosaur = new MailosaurClient(process.env.MAILOSAUR_API_KEY!);
const serverId = process.env.MAILOSAUR_SERVER_ID!;

test("signup welcome email", async ({ page }) => {
  const testEmail = `user-${Date.now()}@${serverId}.mailosaur.net`;

  await page.goto("/signup");
  await page.getByLabel("Email").fill(testEmail);
  await page.getByRole("button", { name: "Sign up" }).click();

  // Poll Mailosaur — built-in poll, no manual loop
  const message = await mailosaur.messages.get(serverId, {
    sentTo: testEmail,
    subject: "Welcome",
  });

  expect(message.subject).toBe("Welcome to Example.com");
  expect(message.html?.body).toContain("Verify your email");

  const link = message.html?.links?.[0]?.href;
  expect(link).toBeDefined();
  await page.goto(link!);
  await expect(page.getByText("Email verified")).toBeVisible();
});
```

Mailosaur's `messages.get` polls automatically. Default timeout 10s; configurable.

### 2.1 Sub-addressing for parallel safety

```typescript
const testEmail = `user-${testInfo.testId}@${serverId}.mailosaur.net`;
```

Each test gets a unique address. No cross-test inbox contamination.

---

## 3. MailHog

Self-hosted SMTP catcher.

```yaml
# docker-compose.yml
services:
  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - 1025:1025 # SMTP
      - 8025:8025 # Web UI
```

Configure your app to send via `smtp://mailhog:1025`. All emails captured.

```typescript
async function getEmailsFromMailHog(to: string): Promise<MailHogMessage[]> {
  const response = await fetch("http://mailhog:8025/api/v2/messages");
  const data = await response.json();
  return data.items.filter((m: any) =>
    m.To.some((t: any) => t.Mailbox + "@" + t.Domain === to),
  );
}

test("password reset email arrives", async ({ page }) => {
  const testEmail = `reset-${Date.now()}@test.com`;

  await page.goto("/reset");
  await page.getByLabel("Email").fill(testEmail);
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect
    .poll(async () => (await getEmailsFromMailHog(testEmail)).length, {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);

  const [email] = await getEmailsFromMailHog(testEmail);
  const link = extractLink(email.Content.Body);
  await page.goto(link);
});
```

### 3.1 Clear inbox between tests

```typescript
test.beforeEach(async () => {
  await fetch("http://mailhog:8025/api/v1/messages", { method: "DELETE" });
});
```

Prevents stale emails from previous tests.

---

## 4. Ethereal

```typescript
import nodemailer from "nodemailer";

const account = await nodemailer.createTestAccount();
// account.user / account.pass / account.smtp.host

// Then in tests, the email is accessible at https://ethereal.email/messages
```

Shared accounts; not ideal for CI. Use for ad-hoc local testing.

---

## 5. Polling

```typescript
async function waitForEmail(opts: {
  to: string;
  subject: RegExp;
  timeoutMs: number;
}): Promise<Message> {
  return (await expect
    .poll(
      async () => {
        const emails = await emailService.list({ to: opts.to });
        const match = emails.find((e) => opts.subject.test(e.subject));
        return match;
      },
      { timeout: opts.timeoutMs, intervals: [500, 1000, 2000, 5000] },
    )
    .not.toBeUndefined()) as unknown as Message;
}
```

Backoff intervals matter: short initial polls catch fast emails; longer later avoids hammering the service.

---

## 6. Parsing

### 6.1 Link extraction

```typescript
function extractLink(
  html: string,
  pattern: RegExp = /href="(https?:\/\/[^"]+)"/,
): string {
  const match = html.match(pattern);
  if (!match) throw new Error(`No link matching ${pattern} in:\n${html}`);
  return match[1];
}

const resetLink = extractLink(
  email.html,
  /href="(https:\/\/app\.example\.com\/reset[^"]+)"/,
);
await page.goto(resetLink);
```

### 6.2 OTP extraction

```typescript
function extractOtp(text: string): string {
  const match = text.match(/\b(\d{6})\b/);
  if (!match) throw new Error(`No 6-digit OTP in: ${text}`);
  return match[1];
}

const otp = extractOtp(email.text);
await page.getByLabel("Verification code").fill(otp);
```

---

## 7. HTML vs text

Most transactional emails have both. Prefer text for parsing (no tags); HTML for visual assertions.

```typescript
expect(email.text).toContain("Your verification code is: ");
expect(email.html).toContain('<a href="');
```

---

## 8. Attachments

```typescript
const email = await emailService.get(messageId);
const attachments = email.attachments ?? [];

const pdf = attachments.find((a) => a.contentType === "application/pdf");
expect(pdf).toBeDefined();
expect(pdf!.length).toBeGreaterThan(1000); // size check

// For full PDF inspection, download and parse
const buffer = await emailService.downloadAttachment(messageId, pdf!.id);
// ... use pdf-parse, etc.
```

---

## 9. Isolation

Two parallel tests both wait for "the welcome email" — they may pick up each other's. Mitigations:

- Unique recipient address per test (timestamp / UUID).
- Filter by subject + recipient.
- Use sub-addressing (`user+<unique>@example.com`).

---

## 10. Common failures

### Failure 1 — Email never arrives

**Cause:** App not configured to use test SMTP.
**Fix:** Check env vars; verify SMTP endpoint is reachable.

### Failure 2 — Test picks up wrong email

**Cause:** Multiple tests using same address.
**Fix:** Per-test address.

### Failure 3 — Link in email is dev URL but test runs against staging

**Cause:** App's base URL doesn't match test env.
**Fix:** Configure app's base URL via env. Test env sends links pointing to test env.

### Failure 4 — Token in link expired by the time test uses it

**Cause:** Test took too long to consume email; token expired.
**Fix:** Increase token TTL in test env; or speed up the test.

---

## Cross-references

- Magic link pattern: [`./cross_site_patterns.md §6`](./cross_site_patterns.md#6-pattern-4--token--magic-link)
- TOTP / OTP: [`../reference/05_auth.md §14`](../reference/05_auth.md#14-mfa-totp)
- File I/O for attachments: [`../reference/09_file_io.md`](../reference/09_file_io.md)
