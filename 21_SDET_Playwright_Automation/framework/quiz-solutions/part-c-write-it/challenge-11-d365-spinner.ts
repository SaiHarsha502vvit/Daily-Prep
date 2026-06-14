// challenge-11-d365-spinner.ts

/**
 * Quiz 02 — Challenge 11: Dynamics 365 Spinner Wait Function
 * Curriculum: Ch06 — Waits & Synchronization
 * Difficulty: HIGH
 *
 * Problem: Dynamics 365 shows a loading overlay (spinner) during form saves,
 *          lookups, and async operations. Tests must wait for it to appear
 *          AND disappear before proceeding, otherwise they interact with a
 *          disabled or partially rendered UI.
 * Solution: Two-phase wait: detect spinner appearance, then wait for detachment.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   Helper: Waits for a D365-style loading spinner to complete
   ─────────────────────────────────────────────────────────────────────────── */

export interface SpinnerWaitOptions {
  /** Maximum total time to wait for the spinner lifecycle. Default: 30s */
  timeout?: number;
  /** Time to wait for spinner to FIRST appear. If it never appears, that's ok. Default: 5s */
  appearanceTimeout?: number;
  /** Polling interval while waiting. Default: 250ms */
  pollInterval?: number;
}

/**
 * Waits for a D365 loading spinner to appear and then disappear.
 *
 * Dynamics 365 (and similar SPA frameworks) follow this lifecycle:
 *   1. User triggers action (save, lookup, etc.)
 *   2. Spinner appears (may be nearly instantaneous)
 *   3. Async backend work completes
 *   4. Spinner disappears
 *   5. UI is fully interactive again
 *
 * Only interacting after step 4 prevents "element not interactable" errors.
 */
export async function waitForD365Spinner(
  page: Page,
  spinnerSelector: string | Locator,
  options: SpinnerWaitOptions = {},
): Promise<void> {
  const { timeout = 30_000, appearanceTimeout = 5_000, pollInterval = 250 } = options;

  const spinner: Locator =
    typeof spinnerSelector === 'string' ? page.locator(spinnerSelector) : spinnerSelector;

  // PHASE 1: Wait for the spinner to appear.
  // We use a short timeout because the spinner might already be gone
  // (e.g., very fast operation). If it never appears, we continue.
  try {
    await spinner.waitFor({ state: 'visible', timeout: appearanceTimeout });
  } catch {
    // Spinner never appeared — either the operation was instant or the
    // selector doesn't match. Safe to continue and check for detachment.
  }

  // PHASE 2: Wait for the spinner to disappear.
  // This is the critical wait: the UI is only ready when the spinner is gone.
  await spinner.waitFor({
    state: 'detached',
    timeout,
  });

  // EXTRA: Small stabilization pause for frameworks that remove the spinner
  // slightly before re-enabling inputs. Only use if empirically needed.
  const stabilizationBuffer = pollInterval;
  if (stabilizationBuffer > 0) {
    await page.waitForTimeout(stabilizationBuffer);
  }
}

/* ───────────────────────────────────────────────────────────────────────────
   Demo: Simulated spinner on a generic page
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch11: waits for D365 spinner lifecycle', async ({ page }) => {
  // Inject a fake spinner into the page to simulate D365 behavior.
  await page.goto('https://example.com');
  await page.setContent(`
    <div id="app">
      <button id="save">Save Record</button>
      <div id="spinner" style="display:none;">Loading...</div>
      <div id="result"></div>
    </div>
    <script>
      document.getElementById('save').addEventListener('click', async () => {
        const spinner = document.getElementById('spinner');
        spinner.style.display = 'block';
        await new Promise(r => setTimeout(r, 1500));
        spinner.style.display = 'none';
        document.getElementById('result').textContent = 'Saved!';
      });
    </script>
  `);

  const saveButton = page.locator('#save');

  // Trigger the save
  await saveButton.click();

  // Use the helper: it will detect the spinner appearing, then wait for it to vanish.
  await waitForD365Spinner(page, '#spinner', {
    timeout: 10_000,
    appearanceTimeout: 2_000,
  });

  // Now it's safe to interact with the result.
  await expect(page.locator('#result')).toHaveText('Saved!');
});

/* ───────────────────────────────────────────────────────────────────────────
   Variant: Wait for spinner via ARIA role (more robust selector)
   ─────────────────────────────────────────────────────────────────────────── */

export async function waitForD365SpinnerByRole(
  page: Page,
  options: SpinnerWaitOptions = {},
): Promise<void> {
  // D365 spinners often have role="status" or aria-label="Loading".
  const spinner = page.getByRole('status').filter({ hasText: /Loading|Please wait/ });
  return waitForD365Spinner(page, spinner, options);
}

test('quiz-02-ch11: role-based spinner wait', async ({ page }) => {
  await page.goto('https://example.com');
  await page.setContent(`
    <button id="load">Load Data</button>
    <div role="status" style="display:none;" aria-live="polite">Loading records...</div>
    <div id="data"></div>
    <script>
      document.getElementById('load').addEventListener('click', async () => {
        const el = document.querySelector('[role="status"]');
        el.style.display = 'block';
        await new Promise(r => setTimeout(r, 800));
        el.style.display = 'none';
        document.getElementById('data').textContent = '42 records';
      });
    </script>
  `);

  await page.locator('#load').click();
  await waitForD365SpinnerByRole(page, { timeout: 10_000 });
  await expect(page.locator('#data')).toHaveText('42 records');
});

/**
 * WHY TWO-PHASE WAIT?
 * - If we only wait for "detached" and the spinner is already gone, it passes
 *   instantly — which might mean the operation hasn't even started yet.
 * - By first waiting for "visible", we confirm the operation DID start.
 * - Then waiting for "detached" confirms it finished.
 * - This is the gold standard for SPA loading indicators.
 */
