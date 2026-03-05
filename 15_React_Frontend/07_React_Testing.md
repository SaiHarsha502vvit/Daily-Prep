> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [← Router](06_React_Router.md) | [Next: Performance →](08_React_Performance.md)

---

# 🧪 React Testing — Unit, Integration, E2E

---

## Testing Pyramid for React

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    /\                                                            ║
║                   /  \       E2E (Cypress/Playwright)                            ║
║                  / E2E\      → Test full user flows (login → checkout)           ║
║                 /──────\     → Slow, expensive, few tests                        ║
║                /        \                                                        ║
║               / Integr.  \   Integration (React Testing Library)                 ║
║              /────────────\  → Test components with user interactions            ║
║             /              \ → Most value per test                               ║
║            /     Unit       \  Unit (Vitest/Jest)                                ║
║           /──────────────────\ → Test pure functions, hooks, utils               ║
║          /                    \ → Fast, many tests                               ║
║         /______________________\                                                 ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## React Testing Library (RTL) — Test User Behavior

```tsx
// PHILOSOPHY: Test what users see and do, not implementation details
// ❌ Don't test: state values, component instances, class names
// ✅ Do test: rendered output, user interactions, accessibility

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Test: Component renders correctly ──
test('renders user name', () => {
  render(<UserCard name="Alice" role="admin" />);
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('admin')).toBeInTheDocument();
});

// ── Test: User interaction ──
test('increments counter on click', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
  
  await user.click(screen.getByRole('button', { name: /increment/i }));
  
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});

// ── Test: Form submission ──
test('submits form with valid data', async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<UserForm onSubmit={onSubmit} />);
  
  await user.type(screen.getByLabelText(/name/i), 'Alice');
  await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(onSubmit).toHaveBeenCalledWith({
    name: 'Alice',
    email: 'alice@test.com',
  });
});

// ── Test: Async data fetching ──
test('loads and displays users', async () => {
  // Mock the API
  vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
  } as Response);
  
  render(<UserList />);
  
  // Initially shows loading
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  // Wait for data
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

// ── Query Priority (RTL guidance) ──
// 1. getByRole       ← BEST (accessible, like screen readers)
// 2. getByLabelText  ← Forms
// 3. getByPlaceholderText
// 4. getByText       ← Non-interactive elements
// 5. getByTestId     ← LAST RESORT (data-testid="...")
```

---

## Testing Custom Hooks

```tsx
import { renderHook, act } from '@testing-library/react';

test('useCounter increments and decrements', () => {
  const { result } = renderHook(() => useCounter(0));
  
  expect(result.current.count).toBe(0);
  
  act(() => { result.current.increment(); });
  expect(result.current.count).toBe(1);
  
  act(() => { result.current.decrement(); });
  expect(result.current.count).toBe(0);
});

// Test hook with provider wrapper
test('useAuth returns user from context', () => {
  const wrapper = ({ children }) => (
    <AuthProvider><>{children}</></AuthProvider>
  );
  
  const { result } = renderHook(() => useAuth(), { wrapper });
  expect(result.current.user).toBeNull();
});
```

---

## MSW (Mock Service Worker) — API Mocking

```tsx
// Instead of mocking fetch directly, intercept at network level
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
  }),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Now tests use real fetch — MSW intercepts!
test('creates user via API', async () => {
  render(<CreateUserForm />);
  // ... fill form and submit
  // MSW returns mock response automatically
});

// Override for specific test:
test('handles server error', async () => {
  server.use(
    http.get('/api/users', () => HttpResponse.json(null, { status: 500 }))
  );
  render(<UserList />);
  await waitFor(() => expect(screen.getByText(/error/i)).toBeInTheDocument());
});
```

---

## E2E Testing with Playwright

```ts
import { test, expect } from '@playwright/test';

test('user can login and see dashboard', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[name="email"]', 'alice@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Welcome, Alice')).toBeVisible();
});

test('user can add item to cart', async ({ page }) => {
  await page.goto('/products');
  await page.click('text=Add to Cart');
  
  const cartBadge = page.getByTestId('cart-count');
  await expect(cartBadge).toHaveText('1');
});
```

---
