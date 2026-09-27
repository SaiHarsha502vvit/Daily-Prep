/**
 * QUIZ 02 — Challenge 21 [HARD]: The hasText Substring Trap
 *
 * ORIGINAL BUGGY CODE:
 *   async selectAmountOption(amount: string): Promise<void> {
 *     await this.page
 *       .locator('#amount-list li')
 *       .filter({ hasText: amount })
 *       .click();
 *   }
 *   // Called as: await grid.selectAmountOption('5.066');
 *
 * QUESTION: Q19 taught filter({ hasText }) as THE fix for manual nth() loops.
 * This code uses it correctly by that lesson — and it still has a bug.
 * The list on screen is:
 *   <li>$5.066 (pass)</li>
 *   <li>$5.066 (fail)</li>
 *   <li>$15.066 (pass)</li>
 *   <li>$105.066 (fail)</li>
 * What does selectAmountOption('5.066') actually click, and why?
 */

import { type Page, expect, test } from "@playwright/test";

// ============================================================
// WHY Q19's fix is not the whole story
// ============================================================
// Q19 is correct that filter({ hasText }) beats a manual nth() loop —
// it's still faster, still auto-waits, still surfaces ambiguity via
// strict mode. But `hasText` given a plain STRING is a case-insensitive
// SUBSTRING match, not `===`. It is `String.prototype.includes()`, not
// exact equality — that part of the contract wasn't the previous
// challenge's point, but it matters the moment the visible text is a
// FORMATTED value (currency, in this case) rather than a literal label.
//
// "5.066" is a substring of "$5.066 (pass)" AND "$5.066 (fail)" AND
// "$15.066 (pass)" (contains "5.066" starting at its 2nd character) AND
// "$105.066 (fail)" (contains "5.066" starting at its 3rd character).
// filter({ hasText: '5.066' }) matches all 4 rows. In strict mode,
// .click() on a 4-element locator throws — not "wrong row," but a
// crash, because the code assumed exactly one match.

// ❌ BUGGY — hasText treated as if it were exact match
class AmountList_BAD {
  constructor(private page: Page) {}

  async selectAmountOption(amount: string): Promise<void> {
    // Looks exactly like Q19's fix. Still wrong for formatted values.
    await this.page
      .locator("#amount-list li")
      .filter({ hasText: amount })
      .click();
    // Throws: "strict mode violation: locator resolved to 4 elements"
  }
}

// ============================================================
// ✅ FIX — parse the display text into structured data, compare exactly
// ============================================================

type ParsedAmount = { raw: string; amount: number | null; status: string | null };

class AmountList_GOOD {
  constructor(private page: Page) {}

  private async parseOptions(): Promise<ParsedAmount[]> {
    const rawTexts = await this.page.locator("#amount-list li").allTextContents();
    return rawTexts.map((text) => {
      const trimmed = text.trim();
      const amountMatch = trimmed.match(/\$([\d.]+)/);
      const statusMatch = trimmed.match(/\(([a-z]+)\)/i);
      const amountDigits = amountMatch?.[1];
      const statusWord = statusMatch?.[1];
      return {
        raw: trimmed,
        amount: amountDigits !== undefined ? parseFloat(amountDigits) : null,
        status: statusWord !== undefined ? statusWord.toLowerCase() : null,
      };
    });
  }

  async selectAmountOption(
    amount: number,
    status: "pass" | "fail" = "pass",
  ): Promise<void> {
    const list = this.page.locator("#amount-list li");
    const parsed = await this.parseOptions();
    const index = parsed.findIndex((p) => p.amount === amount && p.status === status);

    if (index === -1) {
      throw new Error(
        `No option matched amount=${amount} status=${status}. Available: ${JSON.stringify(parsed)}`,
      );
    }
    await list.nth(index).click();
  }
}

// ============================================================
// Usage in tests
// ============================================================

test("naive hasText matches all 4 rows, not just the intended one", async ({
  page,
}) => {
  await page.setContent(`
    <ul id="amount-list">
      <li>$5.066 (pass)</li>
      <li>$5.066 (fail)</li>
      <li>$15.066 (pass)</li>
      <li>$105.066 (fail)</li>
    </ul>
  `);

  const naive = page.locator("#amount-list li").filter({ hasText: "5.066" });
  expect(await naive.count()).toBe(4); // the bug, made visible
});

test("select the exact amount+status option", async ({ page }) => {
  await page.setContent(`
    <ul id="amount-list">
      <li>$5.066 (pass)</li>
      <li>$5.066 (fail)</li>
      <li>$15.066 (pass)</li>
      <li>$105.066 (fail)</li>
    </ul>
  `);

  const grid = new AmountList_GOOD(page);
  await grid.selectAmountOption(5.066, "pass"); // does not throw
});

export { AmountList_BAD, AmountList_GOOD };

// WHY
// filter({ hasText: string }) is a substring match, not equality —
// Playwright's own docs describe it as matching if the element's
// normalized text CONTAINS the given string, case-insensitively. For
// literal labels ("Submit", a customer name) that distinction rarely
// bites, because label text is rarely a substring of a DIFFERENT valid
// label. Formatted numeric/currency text breaks that assumption: "15"
// contains "5", "105" contains "5.066" isn't obviously true until you
// actually write it out, but it is — "105.066" is "10" + "5.066".
//
// The fix is not a smarter locator string. It's recognizing that the
// element's TEXT is a rendering of the data, not the data itself —
// scrape it, parse it back into a structured value (a number, a
// status), and compare with `===`. Numbers don't have the substring
// problem: 15.066 === 5.066 is unambiguously false.
//
// Cross-reference: 21_SDET_Playwright_Automation/05_Advanced_Topics/
// 64_Dynamic_Locators_And_Data_Structures_In_POMs.md, Sections 1-2 —
// this challenge is that chapter's exact verified scenario, reduced to
// quiz format. That chapter also covers a second, independent trap in
// the same neighborhood: building a locator by string-interpolating a
// runtime value into XPath breaks on ordinary data (an apostrophe in a
// name), which `filter({ hasText })` sidesteps for a different reason
// (no query-language string is ever constructed at all).
