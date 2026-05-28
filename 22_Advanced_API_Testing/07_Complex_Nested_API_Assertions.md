# 07. Complex Nested API Data — Assertion Strategies for Enterprise Responses

**Navigation**: [← Chapter 06: DB Testing](06_DB_SQL_API_Bridge.md) | [Index](../00_INDEX.md)

**Cross-links:**
- [`21_SDET/05_Data_From_API_To_Test.md`](../21_SDET_Playwright_Automation/05_Data_From_API_To_Test.md) — Typed interfaces, basic extraction
- [`08_SQL/07_JOINs_Complete.md`](../08_SQL/07_JOINs_Complete.md) — Joining data from multiple sources
- [`17_TypeScript/02_TS_Advanced_Types.md`](../17_TypeScript_Deep_Dive/02_TS_Advanced_Types.md) — Mapped/utility types for API shapes

---

## 5W1H

- **WHAT**: How to write assertions for the complex, nested, and inconsistently structured JSON responses that enterprise APIs return — beyond simple `expect(body.id).toBe('123')`.
- **WHY**: Real APIs return arrays of arrays, nested objects, optional fields, mixed types, and OData envelopes. Naive assertions (checking index 0) break when order changes, and shallow assertions miss bugs in deeply nested data.
- **WHO**: Every SDET testing REST APIs, OData/D365 APIs, or SOAP/XML legacy services.
- **WHEN**: Every time an API response is more than 3 levels deep or contains arrays.
- **HOW**: Using Playwright's assertion toolkit: `toContainEqual`, `arrayContaining`, `objectContaining`, `expect.extend`, and safe optional chaining.

---

## 1. The 5 Real Enterprise Response Shapes

### Shape 1 — Flat Object (Easy)

```json
{ "citationId": "CIT-001", "status": "PAID", "amount": 150.00 }
```

```typescript
interface Citation {
  citationId: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'DISPUTED';
  amount: number;
}

const body = await response.json() as Citation;
expect(body.citationId).toBe('CIT-001');
expect(body.status).toBe('PAID');
expect(body.amount).toBe(150.00);
```

### Shape 2 — Array of Objects (Most Common)

```json
{
  "citations": [
    { "id": "CIT-001", "status": "PAID", "amount": 150 },
    { "id": "CIT-002", "status": "PENDING", "amount": 75 }
  ],
  "totalCount": 2
}
```

```typescript
interface CitationsListResponse {
  citations: Array<{ id: string; status: string; amount: number }>;
  totalCount: number;
}

const body = await response.json() as CitationsListResponse;

// ✅ Exact count
expect(body.citations).toHaveLength(2);

// ✅ Check one specific item by ID (not by index — order may change)
const citation001 = body.citations.find(c => c.id === 'CIT-001');
expect(citation001).toBeDefined();
expect(citation001!.status).toBe('PAID');

// ✅ Partial object match — check that at least this object exists somewhere in the array
expect(body.citations).toContainEqual(
  expect.objectContaining({ id: 'CIT-001', status: 'PAID' })
);

// ✅ Array contains ALL required items (order-independent)
expect(body.citations.map(c => c.id)).toEqual(
  expect.arrayContaining(['CIT-001', 'CIT-002'])
);

// ✅ All items match a condition
expect(body.citations.every(c => c.amount > 0)).toBe(true);
```

### Shape 3 — Array of Arrays (OData / D365)

```json
{
  "value": [
    ["CIT-001", "PAID", 150.00, "2026-01-15"],
    ["CIT-002", "PENDING", 75.00, "2026-02-01"]
  ]
}
```

```typescript
interface ODataArrayResponse {
  value: [string, string, number, string][];  // typed tuple array
}

const body = await response.json() as ODataArrayResponse;

// Transform to objects for readable assertions
const citations = body.value.map(([id, status, amount, date]) => ({ id, status, amount, date }));

expect(citations).toContainEqual(
  expect.objectContaining({ id: 'CIT-001', status: 'PAID' })
);
```

### Shape 4 — Deeply Nested Object (Enterprise Reality)

```json
{
  "customer": {
    "id": "C-001",
    "contact": {
      "addresses": [
        {
          "type": "HOME",
          "phones": [
            { "number": "555-1234", "primary": true }
          ]
        }
      ]
    },
    "citations": [
      {
        "id": "CIT-001",
        "payments": [
          { "id": "PAY-001", "amount": 150 }
        ]
      }
    ]
  }
}
```

```typescript
interface PhoneEntry {
  number: string;
  primary: boolean;
}

interface AddressEntry {
  type: 'HOME' | 'WORK' | 'MAILING';
  phones: PhoneEntry[];
}

interface PaymentEntry {
  id: string;
  amount: number;
}

interface CitationEntry {
  id: string;
  payments: PaymentEntry[];
}

interface CustomerContactInfo {
  addresses: AddressEntry[];
}

interface Customer {
  id: string;
  contact: CustomerContactInfo;
  citations: CitationEntry[];
}

interface CustomerResponse {
  customer: Customer;
}

// Assertions on deeply nested data:
const body = await response.json() as CustomerResponse;

// ✅ Safe extraction with optional chaining (never throws on missing data)
const primaryPhone = body.customer?.contact?.addresses?.[0]?.phones?.find(p => p.primary);
expect(primaryPhone, 'Primary phone must exist').toBeDefined();
expect(primaryPhone!.number).toMatch(/^\d{3}-\d{4}$/);

// ✅ Verify nested array contains specific payment
const citation001 = body.customer.citations.find(c => c.id === 'CIT-001');
expect(citation001).toBeDefined();
expect(citation001!.payments).toContainEqual(
  expect.objectContaining({ id: 'PAY-001', amount: 150 })
);

// ✅ Verify counts at each level
expect(body.customer.citations).toHaveLength(1);
expect(body.customer.citations[0].payments).toHaveLength(1);
expect(body.customer.contact.addresses[0].phones).toHaveLength(1);
```

### Shape 5 — Mixed: Array of Objects With Sub-Arrays

```json
{
  "orders": [
    {
      "orderId": "ORD-1",
      "items": [
        { "sku": "A", "qty": 2, "discounts": [{ "code": "SAVE10", "pct": 10 }] }
      ]
    },
    {
      "orderId": "ORD-2",
      "items": []
    }
  ]
}
```

```typescript
interface Discount { code: string; pct: number; }
interface OrderItem { sku: string; qty: number; discounts: Discount[]; }
interface Order { orderId: string; items: OrderItem[]; }
interface OrdersResponse { orders: Order[]; }

const body = await response.json() as OrdersResponse;

// ✅ Find specific order, check its items
const order1 = body.orders.find(o => o.orderId === 'ORD-1');
expect(order1).toBeDefined();
expect(order1!.items).toHaveLength(1);
expect(order1!.items[0].sku).toBe('A');

// ✅ Verify discount in nested sub-array
expect(order1!.items[0].discounts).toContainEqual(
  expect.objectContaining({ code: 'SAVE10' })
);

// ✅ Verify empty case
const order2 = body.orders.find(o => o.orderId === 'ORD-2');
expect(order2!.items).toHaveLength(0);

// ✅ Verify ALL items in ALL orders have valid SKUs
const allSkus = body.orders.flatMap(o => o.items.map(i => i.sku));
expect(allSkus.every(sku => /^[A-Z]/.test(sku))).toBe(true);
```

---

## 2. The Complete Assertion Toolkit

```typescript
import { expect } from '@playwright/test';

// a. Exact array length
expect(arr).toHaveLength(5);

// b. Array contains a specific partial object (somewhere in the array)
expect(arr).toContainEqual(expect.objectContaining({ id: 'X', status: 'PAID' }));

// c. Array contains ALL of these items (but may have more)
expect(arr.map(i => i.id)).toEqual(expect.arrayContaining(['X', 'Y']));

// d. Object contains these properties (but may have more)
expect(obj).toEqual(expect.objectContaining({ status: 'PAID', amount: 150 }));

// e. String contains substring
expect(str).toEqual(expect.stringContaining('CIT-'));

// f. String matches regex
expect(str).toEqual(expect.stringMatching(/^CIT-\d{6}$/));

// g. Type check without value check
expect(obj.id).toEqual(expect.any(String));
expect(obj.amount).toEqual(expect.any(Number));
expect(obj.active).toEqual(expect.any(Boolean));

// h. Combining matchers — powerful!
expect(arr).toContainEqual(
  expect.objectContaining({
    id: expect.stringMatching(/^CIT-/),
    status: expect.stringMatching(/PAID|PENDING/),
    amount: expect.any(Number),
  })
);

// i. Negating matchers
expect(arr).not.toContainEqual(expect.objectContaining({ status: 'DELETED' }));

// j. Verify array is non-empty
expect(arr.length).toBeGreaterThan(0);
```

---

## 3. Custom Matchers with `expect.extend`

Define domain-specific assertions that make tests read like business requirements:

```typescript
// setup/custom-matchers.ts

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toBeValidCitation(): R;
      toBeValidPayment(minAmount?: number): R;
    }
  }
}

expect.extend({
  toBeValidCitation(received: unknown) {
    const c = received as Record<string, unknown>;
    const errors: string[] = [];

    if (typeof c.citationId !== 'string' || !c.citationId.startsWith('CIT-')) {
      errors.push(`citationId must start with 'CIT-', got: ${c.citationId}`);
    }
    if (!['PAID', 'PENDING', 'OVERDUE', 'DISPUTED'].includes(c.status as string)) {
      errors.push(`status must be one of PAID|PENDING|OVERDUE|DISPUTED, got: ${c.status}`);
    }
    if (typeof c.amount !== 'number' || (c.amount as number) <= 0) {
      errors.push(`amount must be a positive number, got: ${c.amount}`);
    }
    if (typeof c.issuedAt !== 'string' || !(c.issuedAt as string).match(/^\d{4}-\d{2}-\d{2}/)) {
      errors.push(`issuedAt must be an ISO date string, got: ${c.issuedAt}`);
    }

    const pass = errors.length === 0;
    return {
      pass,
      message: () => pass
        ? 'Expected this to NOT be a valid citation'
        : `Invalid citation:\n  ${errors.join('\n  ')}\nReceived: ${JSON.stringify(c, null, 2)}`,
    };
  },

  toBeValidPayment(received: unknown, minAmount = 0) {
    const p = received as Record<string, unknown>;
    const pass = (
      typeof p.id === 'string' && p.id.startsWith('PAY-') &&
      typeof p.amount === 'number' && (p.amount as number) >= minAmount &&
      ['SUCCESS', 'PENDING', 'REFUNDED'].includes(p.status as string)
    );
    return {
      pass,
      message: () => pass
        ? 'Expected this NOT to be a valid payment'
        : `Invalid payment: ${JSON.stringify(p)}`,
    };
  },
});

// Usage in tests — reads like business requirements:
const body = await response.json();
for (const citation of body.citations) {
  expect(citation).toBeValidCitation();
}
expect(body.citations[0].payments[0]).toBeValidPayment(50); // minimum $50
```

---

## 4. Asserting Arrays in Unknown Order

```typescript
// ❌ Wrong — assumes index 0 is always the oldest citation
expect(body.citations[0].id).toBe('CIT-001');

// ✅ Correct — find by business key, then assert
const targetCitation = body.citations.find(c => c.id === 'CIT-001');
expect(targetCitation, 'CIT-001 must exist in the response').toBeDefined();
expect(targetCitation!.status).toBe('PAID');

// ✅ Also correct — use toContainEqual which is order-independent
expect(body.citations).toContainEqual(
  expect.objectContaining({ id: 'CIT-001', status: 'PAID' })
);
```

---

## 5. Before/After Diffing — Testing Mutations

```typescript
test('PATCH citation status: only status and updatedAt change', async ({ request }) => {
  // Capture BEFORE state
  const beforeResponse = await request.get(`/api/citations/CIT-001`);
  const before = await beforeResponse.json() as Citation;

  // Perform the mutation
  const patchResponse = await request.patch(`/api/citations/CIT-001`, {
    data: { status: 'PAID' },
  });
  expect(patchResponse.status()).toBe(200);

  // Capture AFTER state
  const afterResponse = await request.get(`/api/citations/CIT-001`);
  const after = await afterResponse.json() as Citation;

  // Assert ONLY what should change
  expect(after.status).toBe('PAID');
  expect(after.updatedAt).not.toBe(before.updatedAt);  // timestamp changed

  // Assert NOTHING ELSE changed (immutable fields)
  expect(after.citationId).toBe(before.citationId);
  expect(after.amount).toBe(before.amount);
  expect(after.issuedAt).toBe(before.issuedAt);
  expect(after.customerId).toBe(before.customerId);
});
```

---

## 6. OData / D365 Response Format

D365 Web API returns OData format:

```json
{
  "@odata.context": "https://yourorg.crm.dynamics.com/api/data/v9.2/$metadata#contacts",
  "@odata.count": 42,
  "value": [
    {
      "contactid": "123e4567-e89b-12d3-a456-426614174000",
      "fullname": "John Smith",
      "emailaddress1": "john@example.com",
      "@odata.etag": "W/\"1234567\""
    }
  ],
  "@odata.nextLink": "https://yourorg.crm.dynamics.com/api/data/v9.2/contacts?$skiptoken=..."
}
```

```typescript
interface ODataResponse<T> {
  '@odata.context': string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
}

interface D365Contact {
  contactid: string;
  fullname: string;
  emailaddress1: string;
  '@odata.etag'?: string;
}

// Parse and assert:
const body = await response.json() as ODataResponse<D365Contact>;

// Total record count (from @odata.count — requires $count=true in request)
if (body['@odata.count'] !== undefined) {
  expect(body['@odata.count']).toBeGreaterThan(0);
}

// Current page has records
expect(body.value).not.toHaveLength(0);

// Specific record exists
expect(body.value).toContainEqual(
  expect.objectContaining({ emailaddress1: 'john@example.com' })
);

// Pagination exists when there are more records
if (body['@odata.count'] && body['@odata.count'] > body.value.length) {
  expect(body['@odata.nextLink']).toBeDefined();
}
```

---

## 7. SOAP XML Response Parsing

```typescript
import { XMLParser } from 'fast-xml-parser'; // npm install fast-xml-parser

test('SOAP: SearchCitation returns correct citation data', async ({ request }) => {
  const soapBody = `<?xml version="1.0"?>
  <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <SearchCitationRequest xmlns="http://yourcompany.com/citations">
        <CitationId>CIT-001</CitationId>
      </SearchCitationRequest>
    </soap:Body>
  </soap:Envelope>`;

  const response = await request.post(`${process.env.SOAP_SERVICE_URL}/CitationService`, {
    data: soapBody,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': '"SearchCitation"',
    },
  });

  expect(response.status()).toBe(200);

  const responseText = await response.text();

  // Parse XML to JS object
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(responseText);

  // Navigate the parsed structure
  const soapEnvelope = parsed['soap:Envelope'] ?? parsed['Envelope'];
  const soapBodyContent = soapEnvelope?.['soap:Body'] ?? soapEnvelope?.['Body'];
  const citationResponse = soapBodyContent?.['SearchCitationResponse'];

  expect(citationResponse, 'SearchCitationResponse missing in SOAP response').toBeDefined();
  expect(citationResponse.CitationId).toBe('CIT-001');
  expect(citationResponse.Status).toBe('PAID');
  expect(parseFloat(citationResponse.Amount)).toBe(150.00);
});
```

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Correct Assertion for Order-Independent Array

An API returns `{ "items": [{ "id": "A" }, { "id": "B" }] }` but the order is not guaranteed. Which assertion correctly verifies both items are present?

A) `expect(body.items[0].id).toBe('A'); expect(body.items[1].id).toBe('B');`  
B) `expect(body.items.map(i => i.id)).toEqual(expect.arrayContaining(['A', 'B']));`  
C) `expect(body.items.find(i => i.id === 'A')).toBeTruthy();`  
D) `expect(body.items).toContainEqual({ id: 'A' });`  

<details><summary>Answer</summary>

**B** — `toEqual(expect.arrayContaining([...]))` verifies BOTH items are present, in ANY order. 

A = breaks if order changes. C = only checks for 'A', not 'B'. D = only checks for one item, and `toContainEqual` requires an exact match (not partial) — `{ id: 'A' }` matches `{ id: 'A' }` only if there are no other properties; if items have more fields like `{ id: 'A', name: 'Alpha' }` then you'd need `objectContaining`.
</details>

---

### Challenge 2 [Spot the Bug]

```typescript
test('All citations are valid', async ({ request }) => {
  const response = await request.get('/api/citations?customerId=C-001');
  const body = await response.json();

  for (const citation of body.citations) {
    expect(citation.citationId).toBeDefined();
    expect(citation.status).toBeDefined();
    expect(citation.amount).toBeDefined();
  }
});
```

<details><summary>Answer</summary>

Three bugs:

1. **`.toBeDefined()` is too weak** — if `citation.amount` is `0`, `undefined`, or `null`, the test still passes for `.toBeDefined()` because `toBeDefined()` only checks that the field EXISTS on the object (not that it's null or has a real value). Use `expect(citation.amount).toBeGreaterThan(0)`.

2. **No response status check** — if the API returns a 500 with `{ "error": "..." }`, `body.citations` is `undefined` and the `for` loop body never runs, so the test silently passes.

3. **No count assertion** — if `body.citations` is an empty array `[]`, the loop never runs and all assertions are skipped.

Fix:
```typescript
expect(response.ok()).toBe(true);
const body = await response.json();
expect(body.citations.length).toBeGreaterThan(0);
for (const citation of body.citations) {
  expect(citation).toBeValidCitation(); // custom matcher from Section 3
}
```
</details>

---

### Challenge 3 [Write It Yourself]

Given this response shape, write the TypeScript interface AND two assertions: one using `toContainEqual` and one using `find()` + property assertion:

```json
{
  "notifications": [
    { "id": "N-001", "type": "ORDER_CONFIRMED", "channel": "email", "status": "delivered", "referenceId": "ORD-123" },
    { "id": "N-002", "type": "ORDER_SHIPPED", "channel": "sms", "status": "sent", "referenceId": "ORD-123" }
  ]
}
```

<details><summary>Answer</summary>

```typescript
type NotificationType = 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'PAYMENT_RECEIVED';
type NotificationChannel = 'email' | 'sms' | 'push';
type NotificationStatus = 'queued' | 'sent' | 'delivered' | 'failed';

interface Notification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  referenceId: string;
}

interface NotificationsResponse {
  notifications: Notification[];
}

// Assertion 1: toContainEqual (order-independent, partial match)
expect(body.notifications).toContainEqual(
  expect.objectContaining({
    type: 'ORDER_CONFIRMED',
    channel: 'email',
    status: 'delivered',
    referenceId: 'ORD-123',
  })
);

// Assertion 2: find() + property assertion (more specific, readable error on failure)
const emailNotification = body.notifications.find(
  n => n.type === 'ORDER_CONFIRMED' && n.channel === 'email'
);
expect(emailNotification, 'ORDER_CONFIRMED email notification must exist').toBeDefined();
expect(emailNotification!.status).toBe('delivered');
expect(emailNotification!.referenceId).toBe('ORD-123');
```
</details>

---
**Navigation**: [← Chapter 06: DB Testing](06_DB_SQL_API_Bridge.md) | [Index](../00_INDEX.md)
