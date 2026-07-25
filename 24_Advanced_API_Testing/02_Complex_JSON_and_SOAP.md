# 02. Handling Complex JSON and SOAP in TypeScript

**Navigation**: [â† Previous: API Testing Foundations](01_API_Testing_Foundations.md) | [Index](../00_MASTER_INDEX.md) | [Next: Enterprise Headers & Auth →](03_Enterprise_Headers_Auth.md)

---

## 5W1H — Why This Chapter?

- **WHAT**: Parsing, traversing, and validating massive, deeply nested JSON responses and SOAP XML envelopes using TypeScript.
- **WHY**: Enterprise APIs (like Dynamics 365) rarely return flat objects. They return arrays inside objects inside arrays. If you don't know how to navigate them, your tests will crash with `Cannot read properties of undefined`.
- **WHO**: SDETs dealing with legacy (SOAP) or heavy enterprise (REST) backend systems.
- **WHEN**: When writing validation logic for API tests.
- **HOW**: By mastering array methods (`find`, `filter`, `map`), Optional Chaining, and XML-to-JSON parsers.

---

## 1. Taming the Enterprise JSON Beast

Imagine you make a GET request to a Dynamics 365 endpoint to retrieve a customer's account. It returns this massive payload:

```json
{
  "status": "success",
  "data": {
    "accountId": "AC-9921",
    "contacts": [
      {
        "type": "primary",
        "details": { "firstName": "Alice", "email": "alice@corp.com" }
      },
      {
        "type": "billing",
        "details": { "firstName": "Bob", "email": "bob@corp.com" }
      }
    ]
  }
}
```

### The Naive (And Dangerous) Approach

```typescript
const responseBody = await response.json();
// What if 'data' is null? What if 'contacts' is empty?
// This will throw a fatal error and crash the entire test suite!
expect(responseBody.data.contacts[1].details.email).toBe("bob@corp.com");
```

Using hardcoded indexes like `[1]` is a massive anti-pattern. If the API returns the "billing" contact first tomorrow, your test will fail.

### The Professional Approach: Array Methods & Optional Chaining

**1. Optional Chaining (`?.`)**
If any property in the chain is null/undefined, it safely returns `undefined` instead of throwing an error.

```typescript
const accountId = responseBody?.data?.accountId;
expect(accountId).toBeDefined();
```

**2. Finding specific array elements (`.find`)**
Never rely on array order. Always search for the specific item you want.

```typescript
const contacts = responseBody?.data?.contacts || []; // Fallback to empty array

// Find the billing contact dynamically
const billingContact = contacts.find((contact) => contact.type === "billing");

// Now assert safely!
expect(billingContact).toBeDefined();
expect(billingContact?.details?.email).toBe("bob@corp.com");
```

---

## 2. Advanced JSON: Extracting Arrays of Data (`.map`)

Sometimes you don't want just one item; you want to verify a list of items.

Suppose an API returns a list of 50 invoices, and you need to ensure ALL of them have a status of "PAID".

```typescript
const invoices = responseBody?.data?.invoices || [];

// Extract just the statuses into an array of strings: ['PAID', 'PAID', 'PENDING']
const statuses = invoices.map((invoice) => invoice.status);

// Verify EVERY invoice is paid
const allPaid = statuses.every((status) => status === "PAID");
expect(allPaid).toBeTruthy();

// Alternatively, verify that 'PENDING' does NOT exist in the array
expect(statuses).not.toContain("PENDING");
```

---

## 3. Dealing with SOAP and XML in Playwright

Playwright's `.json()` method is fantastic for REST APIs, but SOAP APIs return raw XML.

A typical SOAP Response:

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <m:GetPriceResponse xmlns:m="http://www.dynamics.com/prices">
      <m:Price>19.99</m:Price>
    </m:GetPriceResponse>
  </soap:Body>
</soap:Envelope>
```

If you try to call `await response.json()`, it will crash.

### Step 1: Read the Raw Text

```typescript
const rawXml = await response.text();
```

### Step 2: Parse the XML

JavaScript/TypeScript does not have a great built-in XML parser in Node.js. You MUST install a library. The industry standard is `fast-xml-parser`.

In your terminal: `npm install fast-xml-parser`

### Step 3: Convert XML to JSON and Assert

```typescript
import { XMLParser } from "fast-xml-parser";

test("Test SOAP Price Endpoint", async ({ request }) => {
  // 1. Send SOAP payload (Requires specific XML structure and Content-Type)
  const soapPayload = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <GetPrice xmlns="http://www.dynamics.com/prices">
          <ItemCode>A-100</ItemCode>
        </GetPrice>
      </soap:Body>
    </soap:Envelope>`;

  const response = await request.post("https://api.dynamics.com/soap", {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: '"http://www.dynamics.com/prices/GetPrice"', // Required by many SOAP servers
    },
    data: soapPayload,
  });

  // 2. Get Raw XML
  const rawXml = await response.text();

  // 3. Parse to JSON
  const parser = new XMLParser();
  const parsedJson = parser.parse(rawXml);

  // 4. Navigate the massive converted object
  const price =
    parsedJson["soap:Envelope"]["soap:Body"]["m:GetPriceResponse"]["m:Price"];
  expect(price).toBe(19.99);
});
```

---

## 4. Validating Massive Payloads: JSON Schema (Advanced)

If a Dynamics 365 endpoint returns 500 fields, you cannot write 500 `expect()` statements. It is unmaintainable.

Instead, SDETs use **JSON Schema Validation** (via the `ajv` library).

1. You define a "Schema" (a blueprint of what the JSON _should_ look like: e.g., "id must be a string", "age must be a number").
2. You pass the API response through the validator.
3. If any field is the wrong type or missing, the test fails instantly with a clear error.

_Note: Implementing `ajv` is beyond the scope of a beginner chapter, but as you grow as an SDET, you should look into it for testing massive enterprise payloads!_

---

## ðŸ‹ï¸ Practice & Interview Questions

**Q1.** Why is using hardcoded indexes (like `response.data[0]`) a bad practice in API testing?

<details><summary>Answer</summary>

APIs rarely guarantee the exact order of elements in an array. If the order changes, the test will fail even if the data is correct. You should use `.find()` or `.filter()` to dynamically locate the object you want based on its properties.

</details>

**Q2.** What happens if you try to evaluate `const email = data.user.profile.email;` but the `user` object is `null` in the API response? How do you fix it?

<details><summary>Answer</summary>

The code will throw a `TypeError: Cannot read properties of null (reading 'profile')` and crash the test execution. You fix it using Optional Chaining: `const email = data?.user?.profile?.email;`, which safely evaluates to `undefined` without crashing.

</details>

**Q3.** How do you assert the values inside a SOAP response using Playwright?

<details><summary>Answer</summary>

Playwright cannot parse XML natively. You must use `response.text()` to get the raw XML string, pass it through an external library like `fast-xml-parser` to convert it into a JSON object, and then perform your standard `expect()` assertions on the resulting JSON.

</details>

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Optional Chaining Evaluation

```typescript
const result = response?.data?.contacts?.[0]?.details?.email;
```

`response` is a valid object, `data` is `null`. What is the value of `result`?

A) `TypeError: Cannot read properties of null`  
B) `undefined`  
C) `null`  
D) `""`

<details><summary>Answer</summary>

**B — `undefined`**.

Optional chaining (`?.`) short-circuits at the first `null` or `undefined` value in the chain and returns `undefined` — it does NOT propagate the `null` from `data`. So `null?.contacts` evaluates to `undefined`, and the rest of the chain is never evaluated.

This is distinct from standard property access:

```typescript
response.data.contacts; // TypeError if data is null
response?.data?.contacts; // undefined if data is null
```

In tests: always check for `undefined` explicitly when guarding on optional paths:

```typescript
expect(result).toBeDefined(); // fails clearly if chain short-circuited
```

</details>

---

### Challenge 2 [Spot the Bug — Array Order Dependency]

```typescript
const response = await citationsClient.search({ customerId: "USR-001" });
const body = await response.json();

// Assert the most recent citation is the first item
expect(body.data[0].status).toBe("PENDING");
expect(body.data[0].amount).toBe(150);
```

The test passes for 3 months then randomly fails. What is the root cause?

<details><summary>Answer</summary>

**Root cause**: The test relies on array ordering from the API but never requests a sort order. When a second citation for USR-001 is created in another test (or by the fixture), the API may return the new citation first — breaking the hardcoded `[0]` assumption.

**Fix**: Search for the specific item by a stable property:

```typescript
const citations = body.data as CitationApiResponse[];
const pendingCitation = citations.find(
  (c) => c.status === "PENDING" && c.amount === 150,
);

expect(
  pendingCitation,
  "Expected a PENDING citation with amount 150",
).toBeDefined();
expect(pendingCitation!.customerId).toBe("USR-001");
```

Or, if ordering is required, assert the API returns results in a known order by explicitly requesting `?sortBy=createdAt&sortOrder=desc` and verifying the header guarantee.

</details>

---

### Challenge 3 [Write It Yourself — Deep Nested Extraction]

Given this citation API response structure:

```typescript
const body = {
  status: "success",
  data: {
    account: {
      userId: "USR-001",
      citations: [
        {
          id: "CIT-001",
          type: "PARKING",
          payments: [{ amount: 75, status: "PARTIAL" }],
        },
        {
          id: "CIT-002",
          type: "SPEEDING",
          payments: [{ amount: 150, status: "PAID" }],
        },
        { id: "CIT-003", type: "PARKING", payments: [] },
      ],
    },
  },
};
```

Write TypeScript that extracts the total payment amount across all PARKING citations only, handling the empty `payments` case.

<details><summary>Answer</summary>

```typescript
const citations = body?.data?.account?.citations ?? [];

const parkingTotal = citations
  .filter((c) => c.type === "PARKING")
  .flatMap((c) => c.payments) // flatten [[75], []] → [75]
  .reduce((sum, p) => sum + p.amount, 0);

expect(parkingTotal).toBe(75);
// PARKING: CIT-001 (75) + CIT-003 (0 payments) = 75
```

**Key methods**:

- `.filter` — selects PARKING citations only
- `.flatMap` — maps to payments arrays AND flattens one level (empty arrays contribute nothing)
- `.reduce` — sums amounts, starting at 0 (handles the empty-after-filter case)

The `?? []` guard prevents `.filter` from crashing if the chain returns `undefined`.

</details>

---

### Challenge 4 [MCQ] — XML Namespace Navigation

After parsing this SOAP response with `fast-xml-parser`:

```xml
<soap:Envelope xmlns:soap="...">
  <soap:Body>
    <m:GetPriceResponse xmlns:m="http://dynamics.com/prices">
      <m:Price>19.99</m:Price>
    </m:GetPriceResponse>
  </soap:Body>
</soap:Envelope>
```

How do you access the `Price` value in the parsed JavaScript object?

A) `parsed.Envelope.Body.GetPriceResponse.Price`  
B) `parsed['soap:Envelope']['soap:Body']['m:GetPriceResponse']['m:Price']`  
C) `parsed.price`  
D) `parsed.Envelope['m:Price']`

<details><summary>Answer</summary>

**B** — `fast-xml-parser` preserves namespace prefixes (`soap:`, `m:`) as part of the key names. The resulting JavaScript object keys are literally `'soap:Envelope'`, `'soap:Body'`, etc.

This is why SOAP response navigation requires bracket notation — the colons in namespace prefixes make dot notation invalid JavaScript.

**Practical tip**: for deeply nested SOAP responses, print `JSON.stringify(parsed, null, 2)` in the test to map the full key hierarchy before writing assertions.

</details>

---

### Challenge 5 [Spot the Bug — AJV Schema Mismatch]

```typescript
// JSON Schema for citation
const schema = {
  type: "object",
  properties: {
    citationId: { type: "string" },
    amount: { type: "number" },
    status: { type: "string" },
  },
  required: ["citationId", "amount", "status"],
};

// API returns:
const body = { citationId: "CIT-001", amount: "150.00", status: "PENDING" };
// amount is a string "150.00" — not a number!

const validate = ajv.compile(schema);
const valid = validate(body);
expect(valid).toBe(true); // ← What happens?
```

Does the test pass or fail? Why does this matter for SDET work?

<details><summary>Answer</summary>

**The test FAILS** — `valid` is `false`.

AJV's `{ type: 'number' }` strictly rejects the string `"150.00"`. The validate errors array will contain: `"amount must be number"`.

**Why this matters**: APIs sometimes change a field's data type between versions (e.g., `amount` changes from `number` to `string` to support arbitrary precision). Without schema validation, a test like `expect(body.amount).toBeGreaterThan(100)` would fail with `TypeError: Cannot compare string with number` — a confusing error far removed from the root cause.

Schema validation catches **contract breaking at the field-type level** and produces a clear error: `"amount must be number"`.

**The fix**: either enable AJV's `coerceTypes: true` option (not recommended for strict testing), or alert the team that the API broke the type contract.

</details>

---

**Navigation**: [← Previous: API Testing Foundations](01_API_Testing_Foundations.md) | [Index](../00_MASTER_INDEX.md) | [Next: Enterprise Headers & Auth →](03_Enterprise_Headers_Auth.md)
