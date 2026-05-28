# 24. Test Script Architecture â€” POMs Before Steps, Data Never Exposed

**Navigation**: [â† Chapter 23: APIUtils â€” Your HTTP Library](23_APIUtils_HTTP_Library.md) | [Index](00_INDEX.md)

**Cross-links:**
- [`07_test_step_E2E_Architecture.md`](07_test_step_E2E_Architecture.md) â€” The Data Accumulator pattern
- [`05_POM_Architecture_Deep_Dive.md`](05_POM_Architecture_Deep_Dive.md) â€” POM internals
- [`21_Enterprise_Project_Structure.md`](21_Enterprise_Project_Structure.md) â€” Where each file lives

---

## The Question This Chapter Answers

Your test is set up like this. You see it in the codebase. It looks a specific way and you want to know **why each part is placed where it is**:

```typescript
test('Verify citation flow', async ({ page, account, citationsClient }) => {
  //                                    â†‘ fixture params

  // â”€â”€â”€ POMs are created HERE â€” at the TOP of the test function body â”€â”€â”€â”€â”€â”€â”€
  const masterSearchPage = new MasterSearchPage(page);
  const citationDetailPage = new CitationDetailPage(page);
  //                                                â†‘ ALL POMs declared BEFORE any step

  // â”€â”€â”€ Data accumulator declared HERE â€” typed, all null â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const data = {
    citationId: null as string | null,
    finalStatus: null as string | null,
  };

  // â”€â”€â”€ Steps come AFTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await test.step('Navigate to Master Search', async () => {
    await masterSearchPage.goto();
  });

  await test.step('Search for customer and open citation', async () => {
    await masterSearchPage.searchPanel.searchByTransitAccount(account.userId);
    await masterSearchPage.resultsGrid.waitForResults();
    data.citationId = await masterSearchPage.resultsGrid.getFirstRowId();
  });

  await test.step('API: Verify citation is PENDING', async () => {
    const citation = await citationsClient.getById(data.citationId!);
    expect(citation.status).toBe('PENDING');
  });
});
```

**Why is `masterSearchPage` declared BEFORE `await test.step(...)`? Why not inside the step?**

This chapter explains every structural decision in an enterprise test.

---

## 1. Why POMs Are Created at the TOP of the Test Body

### The Technical Reason â€” TypeScript Scope

```typescript
test('example', async ({ page }) => {

  // If you declare inside step 1:
  await test.step('Step 1: Navigate', async () => {
    const masterPage = new MasterSearchPage(page); // â† inside step 1's closure
    await masterPage.goto();
  });

  await test.step('Step 2: Search', async () => {
    await masterPage.searchPanel.searchById('CIT-001');
    //    â†‘ TypeScript ERROR: Cannot find name 'masterPage'
    //    It was declared in a different closure (step 1's inner function)
  });
});
```

`masterPage` is scoped to `step 1`'s async arrow function `async () => { ... }`. It doesn't exist in `step 2`'s scope. TypeScript correctly rejects this.

**Solution: Hoist to the test function's outer scope:**

```typescript
test('example', async ({ page }) => {
  // Declared in the TEST function's scope â€” accessible from ALL steps
  const masterPage = new MasterSearchPage(page);

  await test.step('Step 1: Navigate', async () => {
    await masterPage.goto();  // âœ… works â€” masterPage is in the enclosing scope
  });

  await test.step('Step 2: Search', async () => {
    await masterPage.searchPanel.searchById('CIT-001');  // âœ… works
  });
});
```

JavaScript closures: inner functions (steps) can READ variables from their outer function (the test). This is why POMs declared in the test body are accessible to all steps inside it.

### The Practical Reason â€” You Read Tests Like a Map

When another SDET opens your test, the first thing they want to know is:
**"What pages does this test interact with?"**

Placing all POMs at the top answers that in 3 lines:

```typescript
test('Citation dispute flow', async ({ page, account, citationsClient }) => {
  // â”€â”€ What pages this test touches: â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const masterSearchPage = new MasterSearchPage(page);
  const citationDetailPage = new CitationDetailPage(page);
  const disputeFormPage = new DisputeFormPage(page);
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // At a glance: this test touches 3 pages.
  // The reader knows the scope before reading a single step.
```

If POMs were created inside steps, you'd have to scan every step body to discover which pages are involved.

### The "Why Not Inside the Step?" Answer

```
Question: "Why not create the POM inside the step that first uses it?"

Answer:
  1. It won't compile â€” the POM won't be in scope for other steps
  2. It separates "what" (POM = the page/component) from "how" (steps = the actions)
  3. It mirrors how a real user thinks: "I'm on the Master Search page. I do these things."
     Not: "I go to step 3, create a master search object, use it, then never see it again."
```

---

## 2. Why the Data Accumulator Is Also at the Top

```typescript
test('create citation and verify', async ({ page, citationsClient, account }) => {
  // POMs:
  const masterSearchPage = new MasterSearchPage(page);

  // Data accumulator â€” all null initially
  const data = {
    citationId: null as string | null,
    citationStatus: null as string | null,
    notificationId: null as string | null,
  };
  // Why all null? Because nothing has happened yet.
  // The steps FILL IN this data as they progress.

  await test.step('Create citation via API', async () => {
    const citation = await citationsClient.create(
      PayloadsCitation.pending({ customerId: account.userId })
    );
    data.citationId = citation.citationId;  // â† step 1 fills it in
  });

  await test.step('Find citation in UI', async () => {
    await masterSearchPage.searchPanel.searchByCitationId(data.citationId!);
    //                                                     â†‘ used by step 2
    // The ! is a TypeScript non-null assertion â€” we know step 1 ran and set it.
    // Step 1's own assertion `expect(data.citationId).not.toBeNull()` guards this.
  });
```

**Why not use `let` variables instead of an object?**

```typescript
// âŒ let variables â€” TypeScript "possibly unassigned" problem
let citationId: string;

await test.step('Create', async () => {
  citationId = 'CIT-001';  // assigned in a closure
});

await test.step('Find', async () => {
  masterSearchPage.searchByCitationId(citationId);
  //                                   â†‘ TypeScript: Variable 'citationId' is used before being assigned
  //   The compiler can't prove step 1 runs before step 2 at compile time.
});

// âœ… Object property â€” no "possibly unassigned" error
const data = { citationId: null as string | null };
// TypeScript knows: data exists (it's const), data.citationId is string | null (explicit type).
// No ambiguity.
data.citationId = 'CIT-001';
masterSearchPage.searchByCitationId(data.citationId!); // ! is intentional: "I know this was set"
```

---

## 3. The Complete Anatomy of an Enterprise Test

```typescript
// tests/specs/citations/dispute-flow.spec.ts
//
// ANATOMY GUIDE:
// Section 1: Imports          â€” only fixtures, POMs, payloads, enums
// Section 2: Test description  â€” describes, tags, and human-readable test name
// Section 3: Static test data  â€” data that never changes across test runs
// Section 4: Test body         â€” POMs, accumulator, then steps
// Section 5: Steps             â€” each step is one business action

// â”€â”€â”€ SECTION 1: IMPORTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Rule: never import from @playwright/test directly â€” always from your fixtures file
import { test, expect } from '../../fixtures';

// Page objects â€” UI layer
import { MasterSearchPage } from '../../pages/MasterSearchPage';
import { CitationDetailPage } from '../../pages/CitationDetailPage';

// Business data â€” not raw strings
import { PayloadsCitation } from '../../data/payloads/PayloadsCitation';
import { CitationStatus } from '../../data/enums/citation.enums';

// Types â€” for TypeScript to understand the accumulator
import type { CitationApiResponse } from '../../types/api-responses.types';

// â”€â”€â”€ SECTION 2: DESCRIBE + TAGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tags like @smoke, @citations, @regression allow filtering:
//   npx playwright test --grep "@smoke"        â†’ only smoke tests
//   npx playwright test --grep-invert "@slow"  â†’ skip slow tests in CI
test.describe('Citation Dispute Flow @citations @regression', () => {

  // â”€â”€â”€ SECTION 3: STATIC TEST DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Why here (inside describe, outside test)?
  // â†’ Shared by all tests in this describe block
  // â†’ Does NOT change between test runs (unlike data generated at test time)
  // â†’ Visible to all tests without being a module-level variable
  const disputeReason = 'Vehicle not present at location';
  const expectedResolutionDays = 30;

  // â”€â”€â”€ SECTION 4: THE TEST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test(
    'Customer disputes citation â†’ Admin reviews â†’ Status updates â†’ Customer notified',
    async ({ page, account, citationsClient, notificationsClient }) => {

    // â”€â”€ POMs: declared at TOP of test body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Why? Scope + readability (see Section 1 of this chapter)
    const masterSearch = new MasterSearchPage(page);
    const citationDetail = new CitationDetailPage(page);

    // â”€â”€ Data accumulator: one object, typed, all null initially â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Why an object and not `let` vars? TypeScript scope (see Section 2)
    const data = {
      createdCitation: null as CitationApiResponse | null,
      disputeReference: null as string | null,
      resolvedStatus: null as string | null,
    };

    // â”€â”€ STEPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // â”€â”€ Step 1: Setup via API (faster than UI setup) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Why API for setup? UI setup is slow and tested elsewhere.
    // This test is about the DISPUTE flow, not the CREATION flow.
    await test.step('Setup: Create a PENDING citation via API', async () => {
      data.createdCitation = await citationsClient.create(
        PayloadsCitation.pending({ customerId: account.userId })
      );
      expect(data.createdCitation.citationId).toMatch(/^CIT-/);
      expect(data.createdCitation.status).toBe(CitationStatus.PENDING);
    });

    // â”€â”€ Step 2: UI action â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Now we use the UI â€” the customer disputes through the portal
    await test.step('Navigate to Master Search in CRM', async () => {
      await masterSearch.goto();
      // D365-specific wait (see Chapter 17):
      await expect(masterSearch.searchPanel.tabCustomerSearch).toBeVisible({ timeout: 30_000 });
    });

    await test.step(`Find citation ${data.createdCitation!.citationId} in CRM`, async () => {
      await masterSearch.searchPanel.searchByCitationId(data.createdCitation!.citationId);
      await masterSearch.resultsGrid.waitForResults();
      await masterSearch.resultsGrid.clickRowByIndex(0);
    });

    await test.step('Open citation and submit dispute', async () => {
      await citationDetail.waitForLoad();
      await citationDetail.disputeButton.click();
      await citationDetail.disputeReasonInput.fill(disputeReason);
      await citationDetail.submitDisputeButton.click();
      await expect(citationDetail.disputeConfirmationBanner).toBeVisible({ timeout: 10_000 });
      data.disputeReference = await citationDetail.getDisputeReference();
    });

    // â”€â”€ Step 3: API cross-validation (verify backend agrees with UI) â”€â”€â”€â”€â”€â”€
    await test.step('API: Confirm citation status is now DISPUTED', async () => {
      // The status change may be async â€” use polling
      const updated = await citationsClient.waitForStatus(
        data.createdCitation!.citationId,
        CitationStatus.DISPUTED
      );
      data.resolvedStatus = updated.status;
      expect(updated.status).toBe(CitationStatus.DISPUTED);
    });

    await test.step('Notifications: DISPUTE_CREATED notification was sent', async () => {
      await notificationsClient.pollForNotification(
        account.userId,
        'DISPUTE_CREATED'
      );
      // pollForNotification throws if the notification doesn't arrive within timeout
    });

    // â”€â”€ Step 4: Final cross-validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await test.step('Verify: dispute reference is in the API response', async () => {
      const citation = await citationsClient.getById(data.createdCitation!.citationId);
      expect(citation.disputeReference).toBe(data.disputeReference);
    });

  }); // end test

}); // end describe
```

---

## 4. Why Data NEVER Goes in the Script File

### The Rule

```typescript
// âŒ NEVER in a spec file:
const adminEmail = 'admin@company.com';    // hardcoded credential
const adminPassword = 'Admin@123!';        // hardcoded credential
const apiKey = 'sk-live-abc123xyz789';     // hardcoded secret
const crmUrl = 'https://crm.company.com'; // hardcoded URL
```

```typescript
// âœ… ALWAYS in environment variables + fixtures:
// .env.local (never committed to Git):
//   ADMIN_EMAIL=admin@company.com
//   ADMIN_PASSWORD=Admin@123!
//   CRM_API_KEY=sk-live-abc123xyz789
//   CRM_URL=https://crm.company.com

// In fixtures/index.ts:
account: async ({}, use) => {
  await use({
    email: process.env.ADMIN_EMAIL!,
    accessToken: process.env.ADMIN_ACCESS_TOKEN!,
    // ...
  });
},

// In test:
async ({ account }) => {
  // test receives account.email â€” never sees the actual value in the code
}
```

**Why?**

| Reason | Consequence of NOT following it |
|---|---|
| **Security** | Credentials in Git â†’ breach, credential rotation headaches |
| **Environment flexibility** | Hardcoded staging URL breaks when running locally |
| **Token rotation** | Hardcoded tokens expire â†’ tests fail mysteriously at 2 AM |
| **Auditability** | Can't tell which tests used which credentials |
| **Multi-role testing** | Can't swap from ADMIN to CUSTOMER token without code changes |

---

## 5. The `test.step()` Naming Convention

Step names are what appear in the Playwright HTML report. They should be:

```typescript
// âŒ Vague steps â€” useless in failure reports
await test.step('step 1', async () => { ... });
await test.step('do thing', async () => { ... });
await test.step('check', async () => { ... });

// âœ… Descriptive steps â€” tells you exactly what failed
await test.step('Navigate to Master Search â†’ CRM portal', async () => { ... });
await test.step('Search for customer by transit account: TA-12345', async () => { ... });
await test.step('API: Verify citation CIT-001 has status PENDING', async () => { ... });
await test.step('Notifications: DISPUTE_CREATED email sent within 30s', async () => { ... });
```

**Why include data in step names?**

```typescript
// Bad: when this fails, you see "Search for customer" â€” but WHICH customer?
await test.step('Search for customer', async () => {
  await masterSearch.searchPanel.searchByEmail(data.email!);
});

// Better: the step name includes the runtime value
await test.step(`Search for customer by email: ${data.email ?? 'not set yet'}`, async () => {
  await masterSearch.searchPanel.searchByEmail(data.email!);
});
// In the failure report: "Search for customer by email: john.smith@company.com"
// You can immediately reproduce the failure without digging into the data accumulator.
```

---

## 6. The Correct Import Order (Convention)

```typescript
// Enterprise convention: imports in this order, separated by blank lines

// 1. Framework imports (always first)
import { test, expect } from '../../fixtures'; // YOUR fixtures wrapper

// 2. Page Object Models (UI layer)
import { MasterSearchPage } from '../../pages/MasterSearchPage';
import { CitationDetailPage } from '../../pages/CitationDetailPage';

// 3. API clients (if used directly in test â€” not via fixtures)
// Usually not needed here since clients come through fixtures

// 4. Data layer (payloads, enums)
import { PayloadsCitation } from '../../data/payloads/PayloadsCitation';
import { CitationStatus, NotificationType } from '../../data/enums/citation.enums';

// 5. TypeScript types (interfaces/types only, not runtime values)
import type { CitationApiResponse } from '../../types/api-responses.types';

// 6. Utilities (date utils, string utils, etc.)
import { DateUtils } from '../../utils/date.utils';
```

**Why this order?** It matches the "layer" model â€” framework â†’ UI â†’ API â†’ data â†’ types â†’ utils. When scanning imports, you immediately understand the test's dependencies.

---

## 7. The Full Enterprise Test â€” Annotated Reference

```typescript
// tests/specs/citations/create-and-notify.spec.ts

// â”€â”€ Imports: framework â†’ UI â†’ data â†’ types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { test, expect } from '../../fixtures';
import { MasterSearchPage } from '../../pages/MasterSearchPage';
import { PayloadsCitation } from '../../data/payloads/PayloadsCitation';
import { CitationStatus } from '../../data/enums/citation.enums';
import type { CitationApiResponse } from '../../types/api-responses.types';

// â”€â”€ Describe: name + tags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
test.describe('Create citation and verify notification @citations @smoke', () => {

  // â”€â”€ Test: business description as the name â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test(
    'Agent creates PARKING citation â†’ customer receives email notification within 30s',
    async ({ page, account, citationsClient, notificationsClient }) => {
    //        â†‘ page   â†‘ auth    â†‘ HTTP client   â†‘ notifications client
    //        Playwright built-in  â†â”€â”€ your custom fixtures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º

    // â”€â”€ POMs: ALL declared here, BEFORE any step â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const masterSearch = new MasterSearchPage(page);
    // â†‘ Why here? See Section 1 of this chapter.
    // â†‘ masterSearch is in scope for ALL test.step() callbacks below.
    // â†‘ If it were inside a step, other steps couldn't use it.

    // â”€â”€ Accumulator: typed, all null, declared here â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const data = {
      citation: null as CitationApiResponse | null,
    };
    // â†‘ Why an object and not `let`? See Section 2 of this chapter.

    // â”€â”€ Steps: sequential business actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    await test.step('Create PENDING citation via API (fast setup)', async () => {
      // Using API for setup â€” not UI â€” because UI creation is tested separately.
      // This test is about NOTIFICATION DELIVERY, not about the creation UI.
      data.citation = await citationsClient.create(
        PayloadsCitation.pending({ customerId: account.userId })
        // â†‘ Why PayloadsCitation.pending()? See Chapter 22.
        // â†‘ No JSON here â€” business intent only.
      );
      // Assert the setup worked before proceeding
      expect(data.citation.status).toBe(CitationStatus.PENDING);
    });

    await test.step('Confirm citation visible in CRM Master Search', async () => {
      await masterSearch.goto();
      await masterSearch.searchPanel.searchByCitationId(data.citation!.citationId);
      // â†‘ data.citation! â€” non-null assertion, safe because step 1 asserted it
      await masterSearch.resultsGrid.waitForResults();
      await expect(
        masterSearch.resultsGrid.rows.first()
      ).toContainText(data.citation!.citationId);
    });

    await test.step('Notification: CITATION_CREATED email delivered within 30s', async () => {
      // Polling â€” the notification service is async (it may take a few seconds)
      const notification = await notificationsClient.pollForNotification(
        account.userId,
        'CITATION_CREATED',
        30_000 // 30 second timeout
      );
      // Business assertions â€” not HTTP assertions
      expect(notification.channel).toBe('email');
      expect(notification.status).toBe('delivered');
      expect(notification.referenceId).toBe(data.citation!.citationId);
    });

  }); // end test

}); // end describe
```

---

## ðŸ‹ï¸ Practice Challenges

### Challenge 1 [MCQ] â€” Scope Question

```typescript
test('example', async ({ page }) => {
  await test.step('Step 1', async () => {
    const form = new CitationFormPage(page);
    await form.goto();
  });

  await test.step('Step 2', async () => {
    await form.fillCitationId('CIT-001');  // â† what happens?
  });
});
```

What happens on the `await form.fillCitationId(...)` line?

A) It works â€” `form` is in the test function's scope  
B) TypeScript compile error â€” `form` is not defined in this scope  
C) Runtime error â€” `form` is undefined  
D) It works â€” `test.step` shares scope with the test function  

<details><summary>Answer</summary>

**B** â€” TypeScript compile error. `form` is declared inside the `async () => { ... }` callback of Step 1. That callback is a separate function scope (a closure). Step 2's callback is a DIFFERENT function scope. TypeScript correctly identifies that `form` is not in scope for Step 2.

Fix: move `const form = new CitationFormPage(page)` to the test function body (before any steps).
</details>

---

### Challenge 2 [Spot the Bug]

```typescript
test('lookup customer', async ({ page, account }) => {
  const data = { customerId: null as string | null };
  const masterSearch = new MasterSearchPage(page);

  await test.step('Search customer', async () => {
    await masterSearch.searchPanel.searchByEmail(account.email);
    await masterSearch.resultsGrid.waitForResults();
    data.customerId = await masterSearch.resultsGrid.getFirstRowId();
    // â† No assertion that data.customerId is not null
  });

  await test.step('Open customer record', async () => {
    await masterSearch.resultsGrid.clickRowByIndex(0);
    const detail = new CustomerDetailPage(page);
    await detail.waitForLoad();
    await expect(detail.customerId).toHaveText(data.customerId!, { timeout: 20000 });
    // â†‘ If data.customerId is null (no results found), this gives a confusing error
  });
});
```

<details><summary>Answer</summary>

The bug is **missing validation after `getFirstRowId()`**. If the search returns no results, `data.customerId` stays `null`. Step 2 then tries `toHaveText(null!, ...)` â€” the `!` bypasses TypeScript's null check, and the assertion message will be something like `Expected "CUSTOMER-123" to equal null` â€” confusing.

Fix: Add an assertion in step 1:
```typescript
await test.step('Search customer', async () => {
  await masterSearch.searchPanel.searchByEmail(account.email);
  await masterSearch.resultsGrid.waitForResults(1); // at least 1 row
  data.customerId = await masterSearch.resultsGrid.getFirstRowId();
  expect(data.customerId, 'Customer must appear in search results').not.toBeNull();
  // â†‘ Clear failure message if search returns no results
});
```
</details>

---

### Challenge 3 [Write It Yourself]

Write a complete test for this business scenario using the architecture from this chapter:

**Scenario:** "Admin creates a new SUPERVISOR user via API â†’ the new supervisor logs into the portal â†’ the supervisor's dashboard shows 0 assigned citations"

Use:
- `account` fixture (admin)
- A `UsersApiClient` with a `create(payload)` method
- `PayloadsUser.newSupervisor(email, teamId)` from Chapter 21
- `SupervisorDashboardPage` POM (assume it exists with `goto()`, `waitForLoad()`, `assignedCitationsCount` locator)
- Typed data accumulator

<details><summary>Answer</summary>

```typescript
import { test, expect } from '../../fixtures';
import { SupervisorDashboardPage } from '../../pages/SupervisorDashboardPage';
import { PayloadsUser } from '../../data/payloads/PayloadsUser';
import { StringUtils } from '../../utils/string.utils';
import type { CreateUserResponse } from '../../types/api-responses.types';

test.describe('New supervisor onboarding @users @smoke', () => {

  test(
    'Admin creates supervisor â†’ supervisor dashboard shows 0 assigned citations',
    async ({ page, account, usersClient }) => {

    // â”€â”€ POMs: declared at top of test body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const supervisorDashboard = new SupervisorDashboardPage(page);

    // â”€â”€ Accumulator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const data = {
      newSupervisor: null as CreateUserResponse | null,
    };

    // â”€â”€ Steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    await test.step('Create new supervisor user via API', async () => {
      const payload = PayloadsUser.newSupervisor(
        StringUtils.randomEmail('supervisor'),
        'TEAM-001' // team ID â€” from env or config, not hardcoded in real tests
      );
      data.newSupervisor = await usersClient.create(payload);
      expect(data.newSupervisor.userId).toMatch(/^USR-/);
      expect(data.newSupervisor.role).toBe('SUPERVISOR');
    });

    await test.step(`Login as new supervisor: ${data.newSupervisor?.email}`, async () => {
      // In a real test, supervisor would use their own storageState or login flow
      // Here: navigate to dashboard (assume supervisor is already authenticated)
      await supervisorDashboard.goto();
      await supervisorDashboard.waitForLoad();
    });

    await test.step('Dashboard shows 0 assigned citations for new supervisor', async () => {
      await expect(supervisorDashboard.assignedCitationsCount).toHaveText('0', { timeout: 15_000 });
    });

  });

});
```
</details>

---

## Summary â€” The Enterprise Test Architecture Rules

| Rule | Reason |
|---|---|
| Import from `../../fixtures`, not `@playwright/test` | Your custom test object has fixtures baked in |
| Declare ALL POMs at top of test body | TypeScript scope: steps (closures) need outer-scope variables |
| Use a typed data accumulator object | `let` creates "possibly unassigned" errors across step closures |
| Name steps as business actions, not technical operations | Failure reports should be readable by QA leads, not just coders |
| Never put URLs, credentials, or tokens in spec files | Security, environment flexibility, token rotation |
| Use enums, not magic strings | Compile-time typo detection, autocomplete |
| Use payload factories with overrides | Readable defaults, composable with real test data |
| Assertions inside steps, not after them | Step-level failure isolation: you know WHICH step failed |

---
**Navigation**: [â† Chapter 23: APIUtils â€” Your HTTP Library](23_APIUtils_HTTP_Library.md) | [Index](00_INDEX.md)

---

### Challenge 4 [MCQ] — The Non-Null Assertion Operator `!`

```typescript
await test.step('Create citation via API', async () => {
  data.citation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId })
  );
  // ← NO assertion that data.citation is valid
});

await test.step('Verify citation in UI', async () => {
  await masterSearch.searchPanel.searchByCitationId(data.citation!.citationId);
  //                                                             ↑
  //                           Non-null assertion: "Trust me TypeScript, this is not null"
});
```

When is the `!` (non-null assertion) safe, and when is it masking a bug?

A) `!` is always safe — TypeScript checks it at compile time so it can never be null at runtime
B) `!` is safe when a prior step's assertion guarantees the value is set; it masks a bug when the prior step has no assertion
C) `!` should never be used — always use `??` to provide a default instead
D) `!` is safe after `await` calls because async functions always return defined values

<details><summary>Answer</summary>

**B** — The non-null assertion `!` is a compile-time override. It tells TypeScript "I know this isn't null" but TypeScript does NOT check this at runtime. If the value IS null, you get a runtime `TypeError: Cannot read properties of null`.

The `!` is **safe** when a prior step's assertion explicitly validated the value:
```typescript
await test.step('Create citation', async () => {
  data.citation = await citationsClient.create(...);
  expect(data.citation.citationId, 'Citation must be created').toMatch(/^CIT-/);
  //                                ↑ If citationId is null/undefined, THIS step fails with a clear message
  // Because this assertion runs, data.citation is proven non-null before step ends.
});

// Now safe to use !:
await test.step('Verify in UI', async () => {
  await masterSearch.searchPanel.searchByCitationId(data.citation!.citationId);
  // ^ Safe: step 1's assertion proved citationId is a CIT-* string
});
```

The `!` is **masking a bug** when:
```typescript
await test.step('Create citation', async () => {
  data.citation = await citationsClient.create(...);
  // ← No assertion. If API returns null/error body, data.citation is wrong.
  // Error is swallowed by the missing assertion.
});

await test.step('Verify in UI', async () => {
  await masterSearch.searchPanel.searchByCitationId(data.citation!.citationId);
  // ^ Throws: TypeError: Cannot read properties of null (reading 'citationId')
  // The error appears in STEP 2, but the REAL bug is in STEP 1.
  // Misleading failure attribution.
});
```

**Rule**: Every time you use `!` on a data accumulator property, there must be an `expect(...)` assertion in the step that set that property.

</details>

---

### Challenge 5 [Spot the Bug — Step Naming and Data Exposure]

```typescript
const adminEmail = 'admin@acme-company.com';
const adminPassword = 'SecurePass@2024!';

test.describe('Admin authentication', () => {
  test('Admin can log in and see dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    await test.step('Login with admin credentials', async () => {
      await loginPage.goto();
      await loginPage.emailInput.fill(adminEmail);
      await loginPage.passwordInput.fill(adminPassword);
      await loginPage.submitButton.click();
    });

    await test.step('check dashboard', async () => {
      await expect(dashboard.header).toBeVisible();
    });
  });
});
```

Three violations of enterprise test architecture. Find them all.

<details><summary>Answer</summary>

**Violation 1 — Credentials hardcoded in the spec file**
`adminEmail` and `adminPassword` are string constants in the test file. This means they are committed to Git, visible in code reviews, and invalidated every time credentials rotate. Enterprise fix:
```typescript
// .env.local (never committed):
// ADMIN_EMAIL=admin@acme-company.com
// ADMIN_PASSWORD=SecurePass@2024!

// In fixtures:
account: async ({}, use) => {
  await use({ email: process.env.ADMIN_EMAIL!, password: process.env.ADMIN_PASSWORD! });
}

// In test: async ({ account }) => { ... account.email ... }
```

**Violation 2 — Vague step name: `'check dashboard'`**
In the Playwright HTML report, a failed step shows only its name. `'check dashboard'` tells you nothing about what was checked, which element, or what the expected state was. Enterprise fix:
```typescript
await test.step('Dashboard: header element is visible after admin login', async () => {
  await expect(dashboard.header).toBeVisible({ timeout: 15_000 });
});
```
The step name should read like a test case description: readable by a QA lead who doesn't know the codebase.

**Violation 3 — `DashboardPage` POM created outside the test function**
Wait — actually `dashboard` IS declared inside the test function. But `loginPage` and `dashboard` are both declared before any steps, which is correct. The real third violation is **no assertion after the login step** — if the login fails silently (submit button clicks but auth fails), the test proceeds to "check dashboard" with a failing auth state. Add:
```typescript
await test.step('Login with admin credentials', async () => {
  await loginPage.goto();
  await loginPage.emailInput.fill(account.email);
  await loginPage.passwordInput.fill(account.password);
  await loginPage.submitButton.click();
  // Assert the login succeeded before continuing:
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  // Without this, a login failure surfaces in step 2 as "header not visible" — wrong attribution.
});
```

Summary of fixes: move credentials to environment variables + fixtures, rename steps to be business-descriptive, add end-of-step assertions to validate state before the next step depends on it.

</details>

---
**Navigation**: [← Chapter 23: APIUtils — Your HTTP Library](23_APIUtils_HTTP_Library.md) | [Index](00_INDEX.md)
