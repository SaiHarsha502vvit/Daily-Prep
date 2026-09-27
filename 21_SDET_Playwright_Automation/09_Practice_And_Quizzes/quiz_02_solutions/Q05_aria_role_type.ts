/**
 * QUIZ 02 — Challenge 5 [MEDIUM]: Missing AriaRole Type
 *
 * ORIGINAL BUGGY CODE:
 *   async function clickByRole(page: Page, role: string, name: string) {
 *     await page.getByRole(role, { name }).click();
 *     //                  ↑ TypeScript error: string not assignable to AriaRole
 *   }
 *
 * QUESTION: What is the TypeScript error? How do you fix it?
 */

import { type Page } from "@playwright/test";

// ============================================================
// BUG — role: string is too broad
// ============================================================
// page.getByRole() expects its first argument to be `AriaRole` — a strict
// string union of valid ARIA role names (e.g. 'button' | 'menuitem' | ...).
// TypeScript refuses to pass a plain `string` where an `AriaRole` is required.
//
// Error: Argument of type 'string' is not assignable to parameter of type 'AriaRole'

// ❌ BUGGY
async function clickByRole_BAD(
  page: Page,
  role: string,
  name: string,
): Promise<void> {
  // TypeScript error on the next line — 'string' is not assignable to 'AriaRole'
  // @ts-expect-error — intentionally showing the bug
  await page.getByRole(role as never, { name }).click();
}

// ============================================================
// FIX 1 — Extract AriaRole from Playwright's own types (preferred)
// ============================================================
// Parameters<Page['getByRole']>[0] extracts the first parameter type of
// getByRole directly from the Playwright type declaration.  This is future-
// proof: if Playwright adds new roles, your type automatically picks them up.

type AriaRole = Parameters<Page["getByRole"]>[0];

async function clickByRole(
  page: Page,
  role: AriaRole,
  name: string,
): Promise<void> {
  await page.getByRole(role, { name }).click();
}

// Usage — callers get compile-time checking:
// clickByRole(page, 'menuitem', 'Save');    ✅
// clickByRole(page, 'button', 'Submit');   ✅
// clickByRole(page, 'banana', 'Go');       ❌ TypeScript error at call site

// ============================================================
// FIX 2 — Import AriaRole directly from @playwright/test (alternative)
// ============================================================
// Some Playwright versions export AriaRole directly from the package.
// Check your version: `import { type AriaRole } from '@playwright/test'`
// If it exists, prefer the direct import for readability.
//
// import { type Page, type AriaRole } from '@playwright/test';  // if exported
//
// async function clickByRoleV2(page: Page, role: AriaRole, name: string): Promise<void> {
//   await page.getByRole(role, { name }).click();
// }

// ============================================================
// FIX 3 — Explicit union (least preferred — must be kept in sync manually)
// ============================================================
type AriaRoleManual =
  | "button"
  | "checkbox"
  | "combobox"
  | "dialog"
  | "figure"
  | "heading"
  | "img"
  | "link"
  | "list"
  | "listitem"
  | "main"
  | "menuitem"
  | "menuitemcheckbox"
  | "menuitemradio"
  | "navigation"
  | "option"
  | "progressbar"
  | "radio"
  | "radiogroup"
  | "row"
  | "rowgroup"
  | "rowheader"
  | "scrollbar"
  | "search"
  | "searchbox"
  | "separator"
  | "slider"
  | "spinbutton"
  | "status"
  | "switch"
  | "tab"
  | "tablist"
  | "tabpanel"
  | "textbox"
  | "timer"
  | "tooltip"
  | "tree"
  | "treegrid"
  | "treeitem";

async function clickByRoleV3(
  page: Page,
  role: AriaRoleManual,
  name: string,
): Promise<void> {
  await page.getByRole(role as AriaRole, { name }).click();
}

// Ensure exports suppress "unused variable" errors in strict TS:
export { clickByRole, clickByRoleV3, clickByRole_BAD };

// WHY
// TypeScript's structural type system distinguishes between "any string"
// (type string) and "a string that must be one of these specific values"
// (a string literal union / AriaRole).
//
// getByRole() accepts only valid ARIA roles.  Accepting a plain `string`
// would let callers pass 'banana', which Playwright would silently
// mis-handle.  Using the type-safe overload means TS catches invalid roles
// at compile time, not at runtime when the element isn't found.
//
// The `Parameters<Fn>[N]` utility type is the cleanest way to mirror
// an argument type from a dependency — it stays in sync automatically
// when you update @playwright/test.
