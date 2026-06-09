// challenge-05-as-const.ts

/**
 * Quiz 02 — Challenge 5: Missing `as const` TypeScript Error
 * Curriculum: Ch04 — JS & TS for Automation
 * Difficulty: MEDIUM
 *
 * Problem: Without `as const`, TypeScript widens string literal types to `string`.
 *          This breaks discriminated unions, exact-match types, and exhaustiveness checking.
 * Solution: Append `as const` (or `readonly`) to preserve literal types.
 */

import { test, expect } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — type widening loses literal values
   ─────────────────────────────────────────────────────────────────────────── */

// TRAP: Without `as const`, TypeScript infers `string[]` for `roles` and `string` for each element.
const rolesBroken = ['admin', 'user', 'guest'];
//    ^? const rolesBroken: string[]

type UserRoleBroken = (typeof rolesBroken)[number];
//    ^? type UserRoleBroken = string  (useless!)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getPermissionsBroken(role: UserRoleBroken): string[] {
  // TRAP: Because role is just `string`, the switch cases are NOT exhaustive.
  // TypeScript won't catch a missing case, and fallthrough to default is a runtime bug risk.
  switch (role) {
    case 'admin':
      return ['read', 'write', 'delete'];
    case 'user':
      return ['read', 'write'];
    case 'guest':
      return ['read'];
    default:
      // 🐛 This branch is reachable for ANY string, not just typos.
      throw new Error(`Unknown role: ${role}`);
  }
}

// TypeScript does NOT complain here — `any` string is accepted:
// getPermissionsBroken('hacker');  // compiles fine, throws at runtime 🐛

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION — `as const` preserves literals and enables exhaustiveness
   ─────────────────────────────────────────────────────────────────────────── */

// FIXED: `as const` makes each element a literal type and the array readonly.
const rolesFixed = ['admin', 'user', 'guest'] as const;
//    ^? const rolesFixed: readonly ["admin", "user", "guest"]

type UserRoleFixed = (typeof rolesFixed)[number];
//    ^? type UserRoleFixed = "admin" | "user" | "guest"

function getPermissionsFixed(role: UserRoleFixed): string[] {
  switch (role) {
    case 'admin':
      return ['read', 'write', 'delete'];
    case 'user':
      return ['read', 'write'];
    case 'guest':
      return ['read'];
    default:
      // ✅ This branch is now UNREACHABLE at compile time.
      // TypeScript knows role can only be 'admin' | 'user' | 'guest'.
      // If you add a new role to the array without a case, you get a compile error.
      const _exhaustive: never = role;
      throw new Error(`Unhandled role: ${_exhaustive}`);
  }
}

/* ───────────────────────────────────────────────────────────────────────────
   ✅ PRACTICAL FIXTURE EXAMPLE — as const for route patterns
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch05: typed route interception with as const', async ({ page }) => {
  await page.goto('https://demoqa.com/books');

  // FIXED: Using `as const` ensures each pattern is a literal, not just `string`.
  const apiPatterns = ['/api/books', '/api/users', '/api/profile'] as const;
  type ApiPattern = (typeof apiPatterns)[number];

  // This function is now type-safe: only the three literal patterns are accepted.
  const interceptPattern = (pattern: ApiPattern) =>
    page.route(pattern, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ mocked: true }),
      });
    });

  await interceptPattern('/api/books');

  // ✅ TypeScript error if we typo the pattern:
  // await interceptPattern('/api/boooks'); // ❌ Argument of type '"/api/boooks"' is not assignable

  await expect(page.locator('.main-header')).toContainText('Book Store');
});

/**
 * WHEN TO USE `as const`:
 * - Configuration arrays/objects whose keys/values are fixed at author time.
 * - Route patterns, selectors, color codes, status enums.
 * - Any place where you want TS exhaustiveness checking or exact literal matching.
 *
 * WHEN NOT TO USE `as const`:
 * - Dynamic user input, API responses, or values computed at runtime.
 */
