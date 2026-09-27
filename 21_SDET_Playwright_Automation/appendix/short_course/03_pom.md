# 03. POM Thinking

> **Canonical lesson:** [05 POM Architecture Deep Dive](../../02_Test_Architecture/05_POM_Architecture_Deep_Dive.md) · [18 Mega POM Architecture](../../05_Enterprise_Framework/18_Mega_POM_Architecture.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> When the Page Object Model pattern earns its complexity, when it doesn't, the progression to component POMs, the Mega POM antipattern, and how to know you've over-architected.

---

## The pattern, in 30 seconds

A Page Object is a class that:

- Holds locators for one page (or component).
- Exposes methods that perform user-level actions.
- Hides selector strings from tests.

```typescript
class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: "Log in" });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

Test:

```typescript
const login = new LoginPage(page);
await login.login("admin@example.com", "admin");
```

---

## When POM earns its complexity

POMs add overhead. They're worth it when:

| Signal                                                | Why POM helps                             |
| ----------------------------------------------------- | ----------------------------------------- |
| 5+ tests use the same page                            | One change in selectors propagates to all |
| Multi-step actions are shared                         | `login()` is one line in 50 tests, not 5  |
| Page is owned by a different team                     | POM is the contract                       |
| Selectors are brittle                                 | One file to fix                           |
| Tests are read by people who don't know the selectors | POM exposes intent                        |

When they don't:

- Single-test pages.
- Pages with one button and one assertion.
- Throwaway exploration tests.

A 200-line POM for a page used in 2 tests is overhead. Don't do it.

---

## The progression

### Stage 1 — Naive POM

```typescript
class HomePage {
  constructor(private readonly page: Page) {}

  async clickSignIn() {
    await this.page.click(".sign-in-button");
  }
}
```

Wraps an action. Marginally better than inline.

### Stage 2 — Lazy locators

```typescript
class HomePage {
  readonly signInButton: Locator;

  constructor(private readonly page: Page) {
    this.signInButton = page.getByRole("button", { name: "Sign in" });
  }
}
```

Locators stored at construction (zero DOM access — see [`reference/03_locators.md §12`](../quick_reference/03_locators.md#12-lazy-evaluation)). Tests can assert directly:

```typescript
await expect(home.signInButton).toBeVisible();
await home.signInButton.click();
```

### Stage 3 — Action methods + assertions

```typescript
class HomePage {
  readonly signInButton: Locator;
  readonly userMenu: Locator;

  constructor(private readonly page: Page) {
    this.signInButton = page.getByRole("button", { name: "Sign in" });
    this.userMenu = page.getByLabel("User menu");
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async signIn(): Promise<void> {
    await this.signInButton.click();
  }

  async assertLoggedIn(): Promise<void> {
    await expect(this.userMenu).toBeVisible();
  }
}
```

The class has BOTH locators (for fine-grained assertions) AND high-level methods (for common flows). Tests pick which level to use.

### Stage 4 — Component POMs

Bigger pages decompose:

```typescript
class DashboardPage {
  readonly header: HeaderComponent;
  readonly sidebar: SidebarComponent;
  readonly mainContent: MainContentComponent;

  constructor(page: Page) {
    this.header = new HeaderComponent(page);
    this.sidebar = new SidebarComponent(page);
    this.mainContent = new MainContentComponent(page);
  }
}

class HeaderComponent {
  readonly userMenu: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    const container = page.getByRole("banner");
    this.userMenu = container.getByLabel("User menu");
    this.searchInput = container.getByRole("searchbox");
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
  }
}
```

Each component owns its scope. Reusable across pages.

### Stage 5 — Frame-aware components

For apps with iframes (D365, embedded SaaS):

```typescript
class EmbeddedFormPage {
  readonly formFrame: FrameLocator;

  constructor(private readonly page: Page) {
    this.formFrame = page.frameLocator('iframe[name^="form-frame"]');
  }

  // Methods operate within the frame
  async fillField(label: string, value: string): Promise<void> {
    await this.formFrame.getByLabel(label).fill(value);
  }
}
```

---

## The Mega POM

When a page object hits 1000 lines:

```typescript
class CustomerDetailsPage {
  // 150 locators
  // 60 methods
  // 20 assertions
}
```

It's a god-object. The split is overdue.

The fix: break by section or behavior:

```typescript
class CustomerDetailsPage {
  readonly identity: IdentitySection; // name, email, phone
  readonly address: AddressSection; // billing/shipping
  readonly orders: OrdersSubgrid; // orders list
  readonly notes: NotesSection; // notes timeline
}
```

Each subclass is 100-200 lines, focused. Tests compose:

```typescript
test("customer can update address", async ({ page }) => {
  const customer = new CustomerDetailsPage(page);
  await customer.address.update({ city: "Austin", zip: "78701" });
  await customer.address.assertSaved();
});
```

---

## The orchestrator pattern

For workflows that span multiple POMs:

```typescript
class CheckoutFlow {
  readonly cart: CartPage;
  readonly shipping: ShippingPage;
  readonly payment: PaymentPage;
  readonly confirmation: ConfirmationPage;

  constructor(page: Page) {
    this.cart = new CartPage(page);
    this.shipping = new ShippingPage(page);
    this.payment = new PaymentPage(page);
    this.confirmation = new ConfirmationPage(page);
  }

  async completeCheckout(card: CardDetails): Promise<string> {
    await this.cart.proceedToCheckout();
    await this.shipping.useDefaultAddress();
    await this.payment.payWithCard(card);
    return await this.confirmation.getOrderId();
  }
}
```

The orchestrator is the API the test calls. Tests don't navigate between POMs — they call orchestrator methods.

---

## When POMs become anti-patterns

| Smell                                            | Diagnosis                                    |
| ------------------------------------------------ | -------------------------------------------- |
| POM exposes raw locators that tests use directly | Underbaked — wrap them                       |
| POM exposes 30 methods                           | Overbaked — split                            |
| Test calls 10 POM methods in sequence            | Add an orchestrator method                   |
| POM has business logic                           | Wrong layer — move to a service / client     |
| POM throws on construction                       | Constructor should be sync, side-effect-free |
| POM hardcodes test data                          | Test data belongs in fixtures / factories    |
| POM has 5 levels of inheritance                  | Composition > inheritance                    |
| POMs depend on each other                        | Decouple via the orchestrator                |

---

## Construction without DOM access

```typescript
class CustomerDetailsPage {
  readonly name: Locator;

  constructor(page: Page) {
    this.name = page.getByLabel("Name");
    // ZERO browser round-trips here
  }
}
```

`page.getByLabel(...)` returns a Locator object (a description). No DOM query happens.

Why this matters: POMs construct synchronously. No `await` in the constructor. The locator is evaluated lazily on first action.

See [`reference/03_locators.md §12`](../quick_reference/03_locators.md#12-lazy-evaluation).

---

## POMs as fixtures

Repeated boilerplate:

```typescript
test("whatever", async ({ page }) => {
  const home = new HomePage(page);
  const search = new SearchPage(page);
  const results = new ResultsPage(page);
  // ...
});
```

Promote to fixtures:

```typescript
const test = base.extend<{ home: HomePage; search: SearchPage }>({
  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  search: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
});

test("whatever", async ({ home, search }) => {
  // Already constructed
});
```

See [`reference/04_fixtures.md §14`](../quick_reference/04_fixtures.md#14-page-fixture-pattern).

---

## What's next

- [04. Architecture walkthrough](./04_architecture_walkthrough.md) — the 15-step E2E using POMs.
- [`reference/03_locators.md`](../quick_reference/03_locators.md) — locator strategy depth.
- [`reference/04_fixtures.md`](../quick_reference/04_fixtures.md) — POM fixtures.
- [`deep_dives/d365.md`](../topic_summaries/d365.md) — frame-aware POM patterns for Dynamics 365.
