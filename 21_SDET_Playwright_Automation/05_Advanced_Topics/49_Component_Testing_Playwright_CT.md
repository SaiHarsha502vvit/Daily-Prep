# 49. Component Testing with Playwright CT

**Navigation**: [← Previous: Trace Viewer & Video Recording](./48_Trace_Viewer_Video_Mastery.md) | [Index](../../00_MASTER_INDEX.md) | [Next: Real-World SPA Tabs →](./50_Real_World_SPA_Tabs_Menuitems_No_IDs.md)

**Cross-links:**
- [`Ch05: POM Deep Dive`](../02_Core_Architecture/05_POM_Architecture_Deep_Dive.md) — Component POM pattern, lazy eval
- [`Ch39: Accessibility`](./39_Accessibility_Testing_axe_core.md) — axe-core in component isolation
- [`Ch21: Enterprise Project Structure`](../04_Enterprise_Architecture/21_Enterprise_Project_Structure.md) — Where CT tests live

---

## 5W1H — Why This Chapter?

- **WHAT**: How to test React, Vue, and Svelte components in isolation using Playwright Component Testing (`@playwright/experimental-ct-react`) — mounting a single component, mocking its props, and asserting on its rendered output.
- **WHY**: E2E tests are expensive (browser boot, full page load, navigation). Component tests are cheap (instant mount, no routing, no backend). A component test that takes 200ms replaces an E2E test that takes 8s. The testing pyramid (Ch00) says 60–70% unit, 20–30% integration — component tests are that integration layer.
- **WHO**: SDETs working in React/Vue/Svelte codebases who want faster feedback than full E2E.
- **WHEN**: After you understand POM (Ch05) and have a component library (design system, shared UI kit).
- **HOW**: By setting up a CT project, writing tests for real components, and showing the exact boundary between "component test" and "E2E test."

---

## 1. What Playwright CT Is (and Is Not)

**Playwright CT is:**
- A test runner that mounts a SINGLE component in a real browser
- Uses the SAME assertion API as E2E (`expect(locator).toBeVisible()`)
- Uses the SAME browser engines (Chromium, Firefox, WebKit)
- Supports the SAME fixtures and reporters

**Playwright CT is NOT:**
- A unit test runner (no Jest/Vitest mocking of internals)
- A replacement for visual regression (though it can do screenshots)
- A Storybook replacement (though it can test Storybook stories)

**When to use CT vs E2E:**

| Test Type | CT | E2E |
|---|---|---|
| Button click handler | ✅ | Overkill |
| Form validation rules | ✅ | Overkill |
| Modal open/close | ✅ | ✅ (if modal triggers API) |
| Page navigation | ❌ | ✅ |
| Auth flow | ❌ | ✅ |
| Cross-component integration | ❌ | ✅ |
| Cross-browser testing | ✅ | ✅ |

---

## 2. Setup — `playwright-ct.config.ts`

Component testing needs its own config. It does NOT use your `playwright.config.ts`.

```typescript
// playwright-ct.config.ts
import { defineConfig, devices } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './src/components',    // Where *.spec.tsx CT tests live
  snapshotDir: './__snapshots__',

  use: {
    // Component tests are fast — lower timeout
    actionTimeout: 5_000,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

**File naming convention:** Use `*.ct.spec.tsx` to distinguish component tests from E2E tests (`*.spec.ts`).

---

## 3. Writing Your First Component Test

### The Component Under Test

```tsx
// src/components/InvoiceStatusBadge.tsx
import React from 'react';

export interface InvoiceStatusBadgeProps {
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'DISPUTED';
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status }) => {
  const colorMap = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    DISPUTED: 'bg-orange-100 text-orange-800',
  };

  return (
    <span
      data-testid="status-badge"
      className={`px-2 py-1 rounded ${colorMap[status]}`}
      role="status"
    >
      {status}
    </span>
  );
};
```

### The Component Test

```tsx
// src/components/InvoiceStatusBadge.ct.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

test.describe('InvoiceStatusBadge', () => {
  test('renders PENDING status', async ({ mount }) => {
    const component = await mount(<InvoiceStatusBadge status="PENDING" />);

    await expect(component).toContainText('PENDING');
    await expect(component).toHaveAttribute('role', 'status');

    // Snapshot the rendered HTML for visual regression
    await expect(component).toHaveScreenshot('status-pending.png');
  });

  test('renders all statuses', async ({ mount }) => {
    const statuses = ['PENDING', 'PAID', 'OVERDUE', 'DISPUTED'] as const;

    for (const status of statuses) {
      const component = await mount(<InvoiceStatusBadge status={status} />);
      await expect(component).toContainText(status);
    }
  });

  test('has correct color class for OVERDUE', async ({ mount }) => {
    const component = await mount(<InvoiceStatusBadge status="OVERDUE" />);

    // Assert on CSS class — useful for design system regression
    await expect(component).toHaveClass(/bg-red-100/);
    await expect(component).toHaveClass(/text-red-800/);
  });
});
```

### Running Component Tests

```bash
npx playwright test -c playwright-ct.config.ts
```

---

## 4. Testing Interactive Components

### Component with State

```tsx
// src/components/InvoicePaymentForm.tsx
import React, { useState } from 'react';

interface Props {
  invoiceId: string;
  balance: number;
  onSubmit: (amount: number) => void;
}

export const InvoicePaymentForm: React.FC<Props> = ({ invoiceId, balance, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (num > balance) {
      setError(`Amount cannot exceed $${balance.toFixed(2)}`);
      return;
    }
    onSubmit(num);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3>Pay Invoice {invoiceId}</h3>
      <p>Balance: ${balance.toFixed(2)}</p>
      <input
        type="number"
        value={amount}
        onChange={(e) => { setAmount(e.target.value); setError(''); }}
        placeholder="Enter amount"
        aria-label="Payment amount"
      />
      {error && <div role="alert">{error}</div>}
      <button type="submit">Submit Payment</button>
    </form>
  );
};
```

### The Test

```tsx
// src/components/InvoicePaymentForm.ct.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { InvoicePaymentForm } from './InvoicePaymentForm';

test.describe('InvoicePaymentForm', () => {
  test('valid payment calls onSubmit', async ({ mount }) => {
    let submittedAmount = 0;

    const component = await mount(
      <InvoicePaymentForm
        invoiceId="INV-001"
        balance={150.00}
        onSubmit={(amount) => { submittedAmount = amount; }}
      />
    );

    await component.getByLabel('Payment amount').fill('100');
    await component.getByRole('button', { name: 'Submit Payment' }).click();

    expect(submittedAmount).toBe(100);
  });

  test('rejects amount exceeding balance', async ({ mount }) => {
    const component = await mount(
      <InvoicePaymentForm
        invoiceId="INV-001"
        balance={150.00}
        onSubmit={() => { throw new Error('should not be called'); }}
      />
    );

    await component.getByLabel('Payment amount').fill('200');
    await component.getByRole('button', { name: 'Submit Payment' }).click();

    await expect(component.getByRole('alert'))
      .toHaveText('Amount cannot exceed $150.00');
  });

  test('rejects zero amount', async ({ mount }) => {
    const component = await mount(
      <InvoicePaymentForm invoiceId="INV-001" balance={150.00} onSubmit={() => {}} />
    );

    await component.getByLabel('Payment amount').fill('0');
    await component.getByRole('button', { name: 'Submit Payment' }).click();

    await expect(component.getByRole('alert'))
      .toHaveText('Amount must be greater than 0');
  });
});
```

---

## 5. Mocking Context and Providers

Real components often need React Context, Redux, or a router. Playwright CT supports wrapping:

```tsx
// src/components/test-utils/ct-wrapper.tsx
import React from 'react';
import { TestAuthProvider } from '../../context/AuthContext';
import { TestQueryClientProvider } from '../../context/QueryClient';

export const CTWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TestQueryClientProvider>
    <TestAuthProvider user={{ role: 'admin', name: 'Test User' }}>
      {children}
    </TestAuthProvider>
  </TestQueryClientProvider>
);
```

```tsx
// In your test
import { CTWrapper } from './test-utils/ct-wrapper';

test('renders with auth context', async ({ mount }) => {
  const component = await mount(
    <CTWrapper>
      <UserProfileCard />
    </CTWrapper>
  );

  await expect(component.getByText('Test User')).toBeVisible();
});
```

---

## 6. Component Test vs E2E — The Boundary

**Use component tests when:**
- The logic is PURELY UI state (validation, conditional rendering, error states)
- The component is shared (design system, reusable form elements)
- You need cross-browser coverage on a component (CT runs on Chromium, Firefox, WebKit)

**Use E2E when:**
- The test involves navigation between pages
- The component interacts with real APIs
- The test involves auth, permissions, or role-based access
- You are testing a USER JOURNEY, not a component in isolation

**The "component test that should be E2E" anti-pattern:**

```tsx
// ❌ BAD: Component test trying to test integration
test('checkout flow', async ({ mount }) => {
  const component = await mount(<CheckoutPage />);  // Don't do this
  await component.getByLabel('Card').fill('4111111111111111');
  // ... 20 more steps ...
});
// This is an E2E test pretending to be a component test.
// Mounting an entire page defeats the purpose.
```

---

## 7. CI Integration

```yaml
# GitHub Actions — separate job for component tests
jobs:
  component-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test -c playwright-ct.config.ts
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: ct-report
          path: test-results/
```

---

## Quick Reference

```bash
# Run all component tests
npx playwright test -c playwright-ct.config.ts

# Run with UI mode
npx playwright test -c playwright-ct.config.ts --ui

# Run specific file
npx playwright test -c playwright-ct.config.ts src/components/Button.ct.spec.tsx
```

| Concept | E2E | CT |
|---|---|---|
| Config file | `playwright.config.ts` | `playwright-ct.config.ts` |
| Import | `@playwright/test` | `@playwright/experimental-ct-react` |
| Mount | `page.goto()` | `mount(<Component />)` |
| Scope | Full page + backend | Component only |
| Speed | 2–10s per test | 200ms–2s per test |

---

## Navigation

**Previous:** [← Trace Viewer & Video Recording](./48_Trace_Viewer_Video_Mastery.md)
**Next:** [Real-World SPA Tabs →](./50_Real_World_SPA_Tabs_Menuitems_No_IDs.md)
