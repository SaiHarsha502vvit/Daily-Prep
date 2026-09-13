# 65. Chaos Engineering for Playwright — Fault Injection, Not Fixed Scenarios

**Navigation**: [← Chapter 64: Dynamic Locators & Data Structures](./64_Dynamic_Locators_And_Data_Structures_In_POMs.md) | [Index](../00_INDEX.md) | [→ Chapter 66: Senior SDET Decision-Making](../06_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md)

**Cross-links:**

- [`08_Browser_Internals_for_SDETs.md`](../02_Core_Architecture/08_Browser_Internals_for_SDETs.md) — the CDP crash signature §5 simulates
- [`61_Emulation_Clock_Network_And_Devices.md`](./61_Emulation_Clock_Network_And_Devices.md) — the deterministic network APIs this chapter reuses non-deterministically
- [`26_Flakiness_Diagnosis_and_Fixing.md`](./26_Flakiness_Diagnosis_and_Fixing.md) — why chaos tests must never live in your regular suite
- [`62_Enterprise_Test_Operations.md`](../04_Enterprise_Architecture/62_Enterprise_Test_Operations.md) §3.1 — the flake SLA, and why chaos-experiment failures don't count against it

> **Verified.** Chaos Monkey originated at Netflix around 2010–2011, during its migration from a monolithic datacenter architecture to AWS and microservices — engineers needed a way to prove services could tolerate a random instance being killed, so they built a tool that killed one on purpose. Netflix open-sourced it in 2014. The formal **Principles of Chaos Engineering** (2017, principlesofchaos.org), written by Casey Rosenthal, Lorin Hochstein, Aaron Blohowiak, Nora Jones, and Ali Basiri, defines the discipline as *"experimenting on a system in order to build confidence in the system's capability to withstand turbulent conditions in production."*

---

## 5W1H

- **WHAT**: Deliberately injecting unpredictable failures — network partitions, degraded APIs, simulated browser crashes — into a running test, then checking whether the application's behavior stays within bounds. Not "does this one scenario I picked work," but "does the system survive failures I didn't specifically write a test for."
- **WHY**: [Ch61](./61_Emulation_Clock_Network_And_Devices.md) answers *"does the app handle this exact slow-network case I already thought of?"* Chaos engineering answers *"does the app survive failures I never thought to enumerate?"* Both are needed. Skipping the second is why production incidents are so often *not* one of the scenarios anyone tested — nobody wrote the test because nobody imagined that exact failure, and exhaustively imagining every failure doesn't scale. You inject randomness instead of enumerating it.
- **WHO**: SDETs and SREs jointly, on systems mature enough that "does it work at all" is already answered by Ch01–Ch64 and the open question is "does it survive its own dependencies failing." Running experiments against a shared environment safely is staff-level judgment — see [Ch66](../06_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md) for the risk-based reasoning behind *when* this is worth doing.
- **WHEN**: Never in the PR gate — chaos tests are deliberately non-deterministic, which is the exact property [Ch26](./26_Flakiness_Diagnosis_and_Fixing.md) teaches you to eliminate from a regression suite. Scheduled, on a cadence, against a dedicated environment (same environment-tier reasoning as [Ch62](../04_Enterprise_Architecture/62_Enterprise_Test_Operations.md)'s nightly runs).
- **WHERE**: A separate, explicitly tagged suite (`@chaos`), reported as an experiment log, never mixed into the deterministic suite or counted against the flake SLA.
- **HOW**: The exact APIs [Ch61](./61_Emulation_Clock_Network_And_Devices.md) already taught (`context.setOffline`, CDP `Network.emulateNetworkConditions`, `route.abort()`) plus a crash technique grounded in [Ch08](../02_Core_Architecture/08_Browser_Internals_for_SDETs.md)'s CDP model — triggered probabilistically and concurrently instead of at one hand-picked point, and checked against a defined *steady state* across many runs instead of one fixed expected outcome.

---

## 1. The distinction, made explicit

[Ch61's own Reality Check](./61_Emulation_Clock_Network_And_Devices.md) already drew half of this line without naming it:

> **"setOffline(true) simulates bad networks"** → `setOffline` is a binary kill switch — requests fail instantly. Real bad networks are worse than dead ones: requests *hang*, succeed after 20 seconds, or drop mid-response.

That's a statement about *fidelity* — the emulation isn't realistic enough. Chaos engineering is a different axis entirely: it's a statement about *what you knew in advance*.

| | Ch61 — Emulation | This chapter — Chaos engineering |
|---|---|---|
| **You start from** | A known risk ("checkout on slow networks is scary") | An unknown gap ("what are we not imagining?") |
| **Fault timing** | Fixed — you choose the exact line in the test | Random — injected while an action is in flight, at a point you don't control |
| **Fault target** | One endpoint or condition you name | A broad pattern; which specific request breaks varies per run |
| **Assertion** | One expected outcome ("button disables") | A steady-state property held across N runs ("no silent hang, ever") |
| **Result if it fails** | A specific bug, in a specific line | A resilience gap — you now know *a* fault breaks it, not which one you expected |
| **Runs** | Once, deterministically, every CI run | Many times, against a control group, on a schedule |

Neither replaces the other. Emulation tests convert a known risk into a permanent regression test. Chaos experiments go looking for risks nobody wrote down yet. A mature suite has both — and keeps them in physically separate files, because the moment a chaos test's random failure starts blocking a PR, someone will "fix" it by making it deterministic, which quietly turns it back into an emulation test and defeats the entire point.

---

## 2. The real method: steady state, hypothesis, control vs. experimental

The Principles of Chaos Engineering describe four steps. Translated into Playwright terms:

1. **Define steady state** as a measurable assertion — not "the page looks fine," but something a test can check mechanically: *the cart total always equals the sum of line items*, *zero uncaught console errors reach the page*, *every submit ends in a success or error toast within 10s, never neither*.
2. **Hypothesize** that steady state holds even when a specific class of fault occurs.
3. **Run a control group** (baseline, zero faults) and an **experimental group** (faults injected), same user journey, N iterations each.
4. **Compare.** If the experimental group's steady-state hold-rate is indistinguishable from control, the hypothesis survives — you've bought confidence. If it diverges, you've found a real gap, and you found it before a user did.

This is a runnable harness, not a metaphor:

```ts
// fixtures/chaos.fixture.ts
import { test as base, type Page, type BrowserContext } from '@playwright/test';

type ChaosFixtures = {
  chaosContext: BrowserContext;
};

export const test = base.extend<ChaosFixtures>({
  chaosContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
});

export { expect } from '@playwright/test';

/** Runs `journey` N times against `page`, returns the steady-state hold-rate. */
export async function runExperiment(
  pages: Page[],
  journey: (page: Page) => Promise<boolean>, // returns true if steady state held
): Promise<{ holdRate: number; failures: number[] }> {
  const results = await Promise.all(
    pages.map(async (page) => {
      try {
        return await journey(page);
      } catch {
        return false; // an uncaught rejection is itself a steady-state violation
      }
    }),
  );
  const failures = results
    .map((held, i) => (held ? -1 : i))
    .filter((i) => i !== -1);
  return { holdRate: results.filter(Boolean).length / results.length, failures };
}
```

```ts
// chaos/checkout-resilience.chaos.spec.ts   (note the .chaos.spec.ts — see §6 for why)
import { test, expect } from '../fixtures/chaos.fixture';
import { runExperiment } from '../fixtures/chaos.fixture';

test('checkout survives a mid-flight network partition @chaos', async ({ browser }) => {
  const N = 20;
  const contexts = await Promise.all(Array.from({ length: N }, () => browser.newContext()));
  const pages = await Promise.all(contexts.map((c) => c.newPage()));

  const { holdRate, failures } = await runExperiment(pages, async (page) => {
    await page.goto('/checkout');
    await page.getByLabel('Card number').fill('4242424242424242');

    const submit = page.getByRole('button', { name: 'Place order' });
    const clickPromise = submit.click();

    // Fault injected AFTER the click starts, not before — see §3.
    setTimeout(() => page.context().setOffline(true), Math.random() * 300);

    await clickPromise.catch(() => {}); // the click's own request may reject; that's expected
    await page.context().setOffline(false);

    // Steady state: the user always sees ONE clear outcome, never silence.
    const toast = page.getByRole('alert');
    await toast.waitFor({ timeout: 10_000 });
    return (await toast.textContent())?.length ? true : false;
  });

  await Promise.all(contexts.map((c) => c.close()));

  console.log(`Steady state held in ${(holdRate * 100).toFixed(0)}% of ${N} runs. Failures at runs: ${failures}`);
  expect(holdRate).toBeGreaterThanOrEqual(0.95); // the threshold IS the finding — tune per system
});
```

The assertion at the bottom is deliberately a threshold, not `toBe(true)`. A single run failing is expected — chaos experiments accept partial failure and measure the rate, exactly like the control-vs-experimental comparison in the source material. If you find yourself wanting every run to pass, you've slipped back into writing an emulation test.

---

## 3. Technique 1 — Network partition, mid-flight instead of pre-arranged

Ch61 calls `setOffline` *before* the action, which means the request is never sent — a clean, known code path (the app's "you're offline" branch). A real partition usually happens *after* a request is already in flight: the request was sent, the server may even have processed it, and the response never arrives. That is a different code path — and in an app that isn't idempotent-safe, potentially a different, worse bug (a double-charge if the user retries, believing nothing happened).

The code above does this with `setTimeout(..., Math.random() * 300)` racing against the click — the fault lands at an unpredictable point inside the request lifecycle instead of before it starts. Run it enough times and you'll hit: before the request is sent, after it's sent but before the server responds, and after the server responds but before the browser reads it. Ch61's `setOffline` only ever tests the first case.

---

## 4. Technique 2 — API degradation via a chaos proxy

Ch61's `route.abort()` and CDP throttling target one endpoint you name in advance. Generalize the same primitive into a proxy that decides randomly, per request, whether and how to misbehave:

```ts
// fixtures/chaos-proxy.ts
import type { BrowserContext } from '@playwright/test';

type ChaosOptions = {
  pattern: string;      // e.g. '**/api/**'
  probability: number;  // 0..1 — fraction of matching requests that get a fault
  faults: Array<'delay' | 'abort' | 'serverError'>;
};

export async function installChaosProxy(context: BrowserContext, opts: ChaosOptions) {
  await context.route(opts.pattern, async (route) => {
    if (Math.random() > opts.probability) return route.continue();

    const fault = opts.faults[Math.floor(Math.random() * opts.faults.length)];
    switch (fault) {
      case 'delay':
        await new Promise((r) => setTimeout(r, 3000 + Math.random() * 5000));
        return route.continue();
      case 'abort':
        return route.abort('connectionrefused'); // same primitive Ch61 §4.3 teaches
      case 'serverError':
        return route.fulfill({ status: 503, body: 'chaos: simulated outage' });
    }
  });
}
```

One line turns any existing test into a chaos experiment: `await installChaosProxy(context, { pattern: '**/api/**', probability: 0.3, faults: ['delay', 'serverError'] })`. Because the pattern is broad and the target is chosen per-request, different runs break different endpoints — which is the point. A hand-picked `route.abort()` on `**/orders` (Ch61's style) only ever proves the order endpoint is handled; this proves the *pattern* of handling degraded APIs holds generally, which is what a real outage actually tests.

---

## 5. Technique 3 — Simulated browser crash

[Ch08](../02_Core_Architecture/08_Browser_Internals_for_SDETs.md) already named the exact signature: *"Target page, context or browser has been closed" → browser crashed.* Playwright has no supported "kill the renderer process mid-click" API — but you don't need one. You can produce the same signature by closing the context or browser from a *concurrent* operation while another action's promise is still pending:

```ts
test('form recovers from a mid-fill crash @chaos', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/apply');
  await page.getByLabel('Full name').fill('Ada Lovelace');

  const fillPromise = page.getByLabel('Address').fill('10 Downing Street');
  setTimeout(() => context.close(), 50); // races the in-flight action — see Ch08 §CDP model

  await expect(fillPromise).rejects.toThrow(/Target.*closed/);

  // The real assertion: did the APPLICATION recover, not Playwright?
  // e.g. reopen a fresh context and confirm a draft was autosaved server-side.
  const recovery = await browser.newContext();
  const recoveryPage = await recovery.newPage();
  await recoveryPage.goto('/apply');
  await expect(recoveryPage.getByLabel('Full name')).toHaveValue('Ada Lovelace'); // or document that it doesn't
  await recovery.close();
});
```

Be honest about what this does and doesn't prove. It simulates the *client's* view of a crash — the exact rejection Ch08 documents — by tearing down the CDP connection mid-action. It does **not** simulate an actual renderer OOM-kill or a real network-partition-induced browser hang, because those happen inside the browser process, below anything Playwright's protocol can reach into. For infrastructure-level chaos (killing pods, partitioning real networks, injecting disk failures), the honest answer is dedicated tools — Gremlin, Toxiproxy, Chaos Mesh — which is exactly why [the INDEX's roadmap](../00_INDEX.md) originally deferred this topic: that toolchain is still in flux for browser-specific testing. What this chapter gives you is the browser/application-layer slice you can start with today, using only what Ch08 and Ch61 already taught.

---

## 6. Where chaos tests live — tagging, cadence, and the flake-SLA boundary

Chaos tests are *deliberately* non-deterministic. That is the exact property [Ch26](./26_Flakiness_Diagnosis_and_Fixing.md) teaches you to hunt down and eliminate from a normal suite. Mixing the two is the single most common way chaos engineering gets abandoned six weeks after someone's excited first attempt: the tests land in the regular suite, they fail unpredictably, the on-call rotation starts treating them as noise, and eventually someone deletes them in a "fix the flaky tests" sprint — deleting real signal because it was filed in the wrong drawer.

The fix is organizational, not technical, and it's cheap:

- **Separate project**, tagged `@chaos`, in `playwright.config.ts` (same per-project pattern [Ch56](../02_Core_Architecture/56_Playwright_Config_Deep_Dive.md) and Ch61 §5 already use for `mobile-smoke` / nightly projects) — never in the `pr-gate` project.
- **Scheduled run**, not per-PR — a nightly or weekly cron in the CI pipeline ([Ch25](./25_CICD_Integration_GitHub_Azure.md)), same cadence tier as Ch61's device-matrix nightly.
- **Reported as an experiment log**, not a pass/fail gate: "checkout survived a mid-flight partition in 97/100 runs, threshold 95%" is a finding to trend over time, not a red X that blocks a merge.
- **Explicitly excluded from the flake SLA** ([Ch62 §3.1](../04_Enterprise_Architecture/62_Enterprise_Test_Operations.md#31-the-written-flake-sla)). A chaos test's occasional "failure" is the system working exactly as designed — it found a real gap. Counting that against the same SLA that governs accidental flakiness conflates "a test is broken" with "a test just did its job," and teams that make this mistake end up quarantining their most valuable tests.

---

## 🏋️ Practice Challenges

**Challenge 1 — Leave-request steady state.** Against the OrangeHRM demo target ([Ch20](../00_Pathways/PATHWAY_01_LEARNING.md)), define steady state as: *submitting a leave request always ends in a success toast or a specific error toast — never a silent hang.* Inject a mid-flight network partition (§3) on the submit request, run N=20, and report the hold rate.

**Challenge 2 — The instant-mock blind spot.** Against JSONPlaceholder, install the chaos proxy (§4) with `probability: 0.3` and `faults: ['delay']` on GET requests. Assert that your app's loading spinner actually appears during the delayed runs. Most teams mock APIs instantly in tests and never discover their "loading" state is unreachable code until a real user hits a slow network.

**Challenge 3 — Does anything survive a crash?** Run the §5 crash-recovery test against a real multi-step form. Before running it, write down your prediction: does the form autosave, or does it lose everything?

<details>
<summary>Challenge 3 — what you should observe</summary>

Most forms without an explicit autosave feature lose everything — the recovery assertion fails, and that's a legitimate, useful finding, not a broken test. If it fails, the deliverable isn't "fix the test," it's a filed ticket: "multi-step forms have no draft recovery; a crash or accidental tab close loses all progress" — with this test attached as reproducible evidence. That's the chapter's real point: a chaos test that "fails" by finding a genuine gap succeeded at its actual job.

</details>

---

**Navigation**: [← Chapter 64: Dynamic Locators & Data Structures](./64_Dynamic_Locators_And_Data_Structures_In_POMs.md) | [Index](../00_INDEX.md) | [→ Chapter 66: Senior SDET Decision-Making](../06_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md)

---

## Reality Check

**"Chaos engineering is just more edge-case tests"** → An edge-case test asserts one known scenario deterministically, forever. A chaos experiment asserts a steady-state property holds across many runs of a *randomly* chosen fault, and its value comes precisely from testing faults nobody enumerated. If every "chaos test" in your suite has one fixed fault and one fixed assertion, it's an emulation test wearing a costume — which is fine, but call it what it is and put it back in the regular suite.

**"Non-deterministic tests have no place in automated testing"** → True for a regression suite, false for an experiment. The rigor in chaos engineering doesn't come from a single fixed assertion — it comes from the control-vs-experimental comparison (§2), the same structure real science uses for anything inherently variable. A 95%-hold-rate threshold across 20 runs is not "flaky"; it's a measured property with a defined tolerance, reported and trended like any other metric in [Ch62](../04_Enterprise_Architecture/62_Enterprise_Test_Operations.md).

**"You need Gremlin or Chaos Mesh to do chaos engineering"** → You need infrastructure-level tools to kill real pods, partition real networks, or fail real disks. For application- and browser-level chaos — the layer this chapter targets — Playwright's own `context.route()`, CDP session, and `context.close()` (all already taught in [Ch08](../02_Core_Architecture/08_Browser_Internals_for_SDETs.md) and [Ch61](./61_Emulation_Clock_Network_And_Devices.md)) are enough to start finding real gaps today. Reach for the heavier tools when you outgrow what the browser layer alone can prove.
