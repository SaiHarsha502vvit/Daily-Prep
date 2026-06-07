# 50. Email Service Testing — Magic Links, OTPs, and Notifications Without `setTimeout(60000)`

**Navigation**: [← 49. Feature Flag Testing](./49_Feature_Flag_Testing.md) | [Index](../00_INDEX.md) | [→ 51. Secrets Management](./51_Secrets_Management_For_SDETs.md)

---

## 5W1H

- **WHAT**: Testing flows that depend on email delivery — magic links, password reset OTPs, order confirmation notifications.
- **WHY**: Real Gmail accounts are forbidden (rate-limited, flaky, leak data). You need a real inbox the test can introspect via API.
- **WHO**: Any team testing signup, login-by-link, password reset, or transactional emails.
- **WHEN**: As soon as an email gates a flow. Don't try to "skip" by clicking a backdoor — that doesn't test the actual delivery path.
- **HOW**: Mailosaur (SaaS), MailHog (self-hosted), or your provider's sandbox inbox.

---

## 1. The choice

| | Mailosaur | MailHog | Provider sandbox (SendGrid etc.) |
|---|---|---|---|
| **Hosting** | SaaS | Self-hosted, free | SaaS (sometimes paid) |
| **API** | Polished REST + SDK | OK | Varies |
| **Real-world feel** | Real SMTP delivery | Local SMTP capture | Real delivery, sandboxed accounts |
| **Cost** | Paid, free tier | Free | Often free |
| **Use when** | Real delivery path matters | Dev/local only | You already pay for the provider |

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
  waitForMessage(criteria: { to: string; subjectContains?: string; receivedAfter: Date; timeoutMs: number }): Promise<InboxMessage>;
  deleteMessage(id: string): Promise<void>;
  uniqueAddress(prefix?: string): string;
}
```

Tests depend on the interface — swap implementations per env via fixture.

---

## 3. Mailosaur implementation sketch

```typescript
import MailosaurClient from 'mailosaur';

export class MailosaurInbox implements EmailClient {
  private readonly client: MailosaurClient;
  private readonly serverId: string;

  constructor(apiKey: string, serverId: string) {
    this.client = new MailosaurClient(apiKey);
    this.serverId = serverId;
  }

  uniqueAddress(prefix = 'test'): string {
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
    const msg = await this.client.messages.get(this.serverId, {
      sentTo: to,
      ...(subjectContains ? { subject: subjectContains } : {}),
    }, { timeout: timeoutMs, receivedAfter });

    return {
      id: msg.id!,
      to,
      subject: msg.subject ?? '',
      textBody: msg.text?.body ?? '',
      htmlBody: msg.html?.body ?? '',
      receivedAt: new Date(msg.received!),
      links: msg.html?.links?.map((l) => l.href ?? '').filter(Boolean) ?? [],
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
test('@e2e magic link signs the user in', async ({ page, emailInbox }) => {
  const address = emailInbox.uniqueAddress('signup');
  const beforeTime = new Date();

  await page.goto('/signup');
  await page.fill('input[name=email]', address);
  await page.click('button[type=submit]');

  const message = await emailInbox.waitForMessage({
    to: address,
    subjectContains: 'Confirm your account',
    receivedAfter: beforeTime,
    timeoutMs: 30_000,
  });

  const link = message.links.find((l) => l.includes('/auth/verify'));
  expect(link, 'magic link missing from email').toBeDefined();

  await page.goto(link!);
  await expect(page.getByText('Welcome')).toBeVisible();

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
