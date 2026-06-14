# CH02 — Single Website POM Solution

## Overview

This solution demonstrates the Page Object Model (POM) pattern for OrangeHRM, an open-source HR management system. The tests validate login functionality and PIM (Personal Information Management) employee search.

## File Structure

```
CH02/
├── websites/
│   └── orangehrm/
│       └── pages/
│           ├── LoginPage.ts        # Login page object with form actions
│           ├── DashboardPage.ts    # Dashboard page object with nav/logout
│           └── PIMListPage.ts      # Employee list/search page object
├── test-data/
│   └── orangehrm/
│       └── credentials.json        # Test credentials (valid + negative cases)
├── tests/
│   └── orangehrm/
│       ├── login.spec.ts           # Login feature tests
│       └── pim-search.spec.ts      # PIM search feature tests
└── README.md
```

## Key Design Decisions

### 1. Page Object Model Pattern

Each page is encapsulated in its own class with:

- **Locators** defined as a readonly `locators` object for easy maintenance
- **Locators as properties** for commonly used elements (usernameInput, passwordInput, etc.)
- **High-level methods** that compose atomic actions (goto, loginWith, expectInvalidCredentials)

### 2. Typed Locators

Using Playwright's `Locator` type ensures compile-time safety and IDE autocompletion:

```typescript
readonly usernameInput: Locator;
readonly loginButton: Locator;
```

### 3. Configurable Timeouts

Timeouts are imported from a centralized constants file rather than magic numbers:

```typescript
import { Timeouts } from "../../../framework/constants/timeouts";
await this.usernameInput.waitFor({
  state: "visible",
  timeout: Timeouts.THIRTY_SECONDS,
});
```

### 4. Atomic Helper Reuse

The solution leverages existing framework helpers (`clickElement`, `fillInput`) instead of duplicating logic:

```typescript
import {
  clickElement,
  fillInput,
} from "../../../framework/utilities/helpers/action.helpers";
```

### 5. Test Data Separation

Credentials are stored in JSON and imported, keeping tests readable:

```typescript
import credentials from "../../test-data/orangehrm/credentials.json";
await loginPage.loginWith(credentials.valid);
```

### 6. Test Tags

Tests are tagged for selective execution:

- `@smoke` — core functionality tests
- `@regression` — full regression suite

## Test Cases

### Login (`login.spec.ts`)

| Test                                       | Description                                        |
| ------------------------------------------ | -------------------------------------------------- |
| `valid credentials land on dashboard`      | Verify successful login redirects to dashboard     |
| `wrong password shows invalid credentials` | Verify error message for wrong password            |
| `wrong username shows invalid credentials` | Verify error message for wrong username            |
| `empty fields show required errors`        | Verify validation errors for empty form submission |

### PIM Search (`pim-search.spec.ts`)

| Test                                        | Description                                   |
| ------------------------------------------- | --------------------------------------------- |
| `search for nonsense returns zero results`  | Edge case: search with non-existent name      |
| `search for known employee returns results` | Happy path: search returns matching employees |

## Running the Tests

```bash
# Run all tests
npx playwright test

# Run only smoke tests
npx playwright test --grep "@smoke"

# Run only login tests
npx playwright test tests/orangehrm/login.spec.ts

# Run with UI
npx playwright test --ui
```

## Dependencies

The solution imports from the framework located at `21_SDET_Playwright_Automation/framework/`:

- `utilities/helpers/action.helpers` — `clickElement`, `fillInput`
- `constants/timeouts` — `Timeouts` enum

## Notes

- All page classes implement a `goto()` method for navigation
- The `PIMListPage` waits for the API response before checking results to avoid race conditions
- The solution does NOT modify any framework files — all additions are within `challenges/solutions/CH02/`
