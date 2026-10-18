# Level 13 — Capstone: CI/CD Pipeline

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 12](Level_12_Debugging_Flaky_Tests.md)

---

## What This Level Actually Is

No new API. Every piece below is something a previous level already taught — this level's only job is wiring twelve levels' worth of separate skills into one real, working GitHub Actions pipeline, and being honest about the one thing CI genuinely can't do that a real device farm is needed for.

---

## The Honest Boundary First — What Runs in Standard CI, What Doesn't

Before the YAML: [Level 9's Android API](Level_09_Android_API_Real_Devices.md) needs a **real device or emulator reachable over ADB**. A standard GitHub Actions runner has neither by default — running Level 9/10-style tests in CI genuinely requires either a self-hosted runner with an Android emulator pre-configured, or a third-party device-cloud service (BrowserStack, Firebase Test Lab, Sauce Labs) integrated as a separate job. This capstone's pipeline covers what runs on **standard, unmodified CI infrastructure**: Levels 1-8 and 11-12's browser-emulation-based tests. That's not a limitation to apologize for — it's the honest majority of a real mobile web/hybrid test suite, and it's precisely why Levels 1-8 emphasized browser emulation as the default, fast, CI-friendly approach, saving real-device testing for what specifically needs it.

---

## The Complete Workflow

```yaml
# .github/workflows/mobile-tests.yml
name: Mobile Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        # Level 7's projects, now as a CI matrix dimension
        project: [mobile-chrome-pixel7, mobile-safari-iphone14, tablet-ipad]
        # Level 7's sharding, combined WITH the project matrix —
        # each device project's tests are further split across 2 machines
        shard: [1/2, 2/2]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run tests
        run: npx playwright test --project=${{ matrix.project }} --shard=${{ matrix.shard }}
        env:
          CI: true

      # Level 12's trace-on-failure — but note the config controls WHEN a
      # trace is captured; this step only controls what happens to it AFTER
      - name: Upload trace on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: trace-${{ matrix.project }}-${{ strategy.job-index }}
          path: test-results/**/trace.zip
          retention-days: 7

      # Level 11's visual regression — a failed screenshot comparison produces
      # actual/expected/diff images worth keeping, separate from the trace
      - name: Upload visual diff on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diffs-${{ matrix.project }}-${{ strategy.job-index }}
          path: test-results/**/*-actual.png
          retention-days: 7

  report:
    needs: test
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Publish combined HTML report
        run: echo "Merge sharded reports here — see note below"
```

---

## Walking Through the Non-Obvious Parts

**The `matrix` combining `project` AND `shard`:** this produces **6 parallel jobs** (3 device projects × 2 shards each), not 3 or 2 — each device project's own test suite is independently split across 2 machines. This is [Level 7's project/shard content](Level_07_Multi_Device_Config.md#solution--sharding-for-ci-speed) taken to its logical real-world conclusion: a suite that would take 20 minutes sequentially on one device finishes in roughly 10 minutes per device, all 3 devices running simultaneously.

**`fail-fast: false`:** without this, GitHub Actions cancels every other matrix job the instant *any one* fails — meaning a single flaky test on the iPad project would kill useful, passing results on the other two devices before they even finish. For a test matrix specifically meant to surface device-specific bugs, losing the other devices' results the moment one fails defeats the entire purpose of running the matrix at all.

**Trace and visual-diff uploads are conditional on `if: failure()`:** uploading these unconditionally on every run (including passes) would silently balloon CI storage costs and artifact-download time for zero benefit — [Level 12's `trace: 'on-first-retry'` config](Level_12_Debugging_Flaky_Tests.md#basics--recap-and-extend-trace-viewer-as-an-investigation-tool-not-just-a-log) already controls *whether a trace is captured at all* at the test-runner level; this workflow step only decides whether to *keep* whatever was captured, and only when something actually needs investigating.

**The `report` job's placeholder:** sharded runs produce **separate partial reports per shard** by default — merging them into one combined HTML report requires either Playwright's own `merge-reports` CLI command against downloaded per-shard artifacts, or a reporting service integration. This is deliberately left as a note rather than fake-complete code, because the exact merge command depends on how your specific reporter is configured — copying a plausible-looking but untested merge step would be worse than an honest placeholder.

---

## The One Thing Worth Adding Before Calling This "Done"

```yaml
      - name: Comment PR with failure summary
        if: failure() && github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `⚠️ Mobile tests failed on **${{ matrix.project }}** (shard ${{ matrix.shard }}). [View run](${context.payload.pull_request.html_url}/checks)`
            })
```

A CI pipeline that only reports failures inside GitHub's own Checks tab means someone has to go looking for them. A pipeline that comments directly on the PR means the failure finds the reviewer, not the other way around — a small addition, but the difference between a pipeline people actually check and one they learn to ignore.

---

## Challenges

### 🐛 Bug Hunt — The Matrix That Silently Runs Half as Many Tests as Intended

```yaml
strategy:
  matrix:
    project: [mobile-chrome-pixel7, mobile-safari-iphone14]
    shard: [1/2, 2/2]
  max-parallel: 2
```

Someone added `max-parallel: 2` to "avoid overwhelming the runner." The suite now takes noticeably *longer* than before, and it's not obviously a shard-count problem. What did `max-parallel: 2` actually do to a 4-job matrix (2 projects × 2 shards)?

<details><summary>Diagnosis</summary>

🔴 **Explanation:** `max-parallel: 2` doesn't reduce the number of matrix jobs — it still produces all 4 (2 projects × 2 shards, exactly as [this level's own matrix explanation](#walking-through-the-non-obvious-parts) describes) — it caps how many of those 4 jobs GitHub Actions runs **simultaneously**. With only 2 runners active at a time out of 4 total jobs, the second pair waits for the first pair to finish before starting, turning what should be one round of parallel execution into two sequential rounds — roughly doubling total wall-clock time compared to running all 4 simultaneously. This directly undoes [Level 7's sharding value proposition](Level_07_Multi_Device_Config.md#solution--sharding-for-ci-speed): sharding only saves time if the shards genuinely run *at the same time*. The fix is simply removing `max-parallel` (or raising it to at least the total matrix job count) unless there's a real, specific resource constraint (a shared, rate-limited external service the tests hit) that actually requires capping concurrency — which is a real, occasionally legitimate reason, just not "avoid overwhelming the runner" in the abstract.

</details>

---

### 👹 Boss Battle — Design the Missing Piece: Real-Device Coverage as a Separate Job

**The spec:** this capstone's pipeline explicitly excludes Level 9/10's real-device/ADB-based tests, since standard CI runners can't run them. Design (as YAML, not necessarily runnable without an actual device-cloud account) a **separate** job that would run those specific tests via a third-party device-cloud service, and explain in your own words why this needs to be a genuinely separate job from the main matrix above, not just another entry added to the same `project` matrix array.

<details><summary>One reasonable design</summary>

```yaml
  real-device-tests:
    timeout-minutes: 20
    runs-on: ubuntu-latest
    # Only run on main, not every PR — real-device-cloud minutes are
    # typically metered/billed, unlike standard GitHub-hosted runners
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - name: Run Android API tests against device cloud
        env:
          DEVICE_CLOUD_API_KEY: ${{ secrets.DEVICE_CLOUD_API_KEY }}
        run: npx playwright test tests/real-device/ --project=android-real-device
```

🔴 **Explanation:** this genuinely needs to be a **separate job**, not another `project` array entry in the main matrix, for reasons that go beyond just "it's a different kind of test." First, credentials — a device-cloud service needs an API key (`secrets.DEVICE_CLOUD_API_KEY`), and scoping that secret's usage to one dedicated job is a real security-surface reduction versus having it available to every job in a shared matrix. Second, cost and gating — device-cloud minutes are frequently billed per-minute, unlike standard GitHub-hosted runners, which is exactly why this design only runs on `main` pushes, not every PR, whereas the main browser-emulation matrix (essentially free, fast) reasonably runs on every PR. Third, and most fundamentally: `fail-fast: false` and shared matrix semantics assume all matrix entries are testing the same *kind* of thing under the same *kind* of infrastructure — mixing a real-device job into that matrix would mean one flaky device-cloud connection could visually clutter the same status check as legitimate emulation-based failures, making the CI status harder to read at a glance, not easier.

</details>

---

## Track Complete

Thirteen levels, from an empty folder to a real CI pipeline. If you've actually typed out and run the code in each level — not just read it — you have a genuinely different relationship with mobile Playwright testing than someone who only read documentation cover to cover. That was always the actual goal: not information, fluency.

**Going further — the senior track:** this pipeline stops at the boundary of real-device testing; [Cross-Platform Mobile Testing Infrastructure at Scale](../09_Cross_Platform_Mobile_Testing_Infra_At_Scale.md) picks up exactly there (device matrix from data, sharding mechanics, cost model, tiered pipeline), the [release & rollout playbook](../career/RELEASE_AND_ROLLOUT_PLAYBOOK.md) covers what happens after the tests pass, and the [mobile SDET readiness rubric](../career/READINESS_RUBRIC_SDET.md) maps where you stand.

**→ Related:** [00_ROADMAP.md](00_ROADMAP.md) · [Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md) · [06_Mobilewright_Native_Testing.md](../06_Mobilewright_Native_Testing.md)
