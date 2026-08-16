# Level 12 — Docker, Cloud Devices & Troubleshooting

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 11](Level_11_The_WebView_Bridge_Full_Depth.md)

---

## Basics — `ghcr.io/mobile-next/mobilewright`: What Docker Actually Buys You Here

```bash
docker run --rm \
  -v $(pwd):/app \
  -w /app \
  ghcr.io/mobile-next/mobilewright \
  npx mobilewright test --shard=1/4
```

This packages the Node/npm toolchain and Mobilewright's own dependencies into a reproducible image — the same "works identically everywhere" motivation as any Docker-based CI setup. What it does **not** package: an actual Android emulator or iOS simulator, which are heavier virtualization/OS-level resources, not npm dependencies.

---

## Concept — Two Genuinely Different Device Sourcing Strategies

```typescript
// Option A — connect the container to a LOCAL emulator running on the host,
// reached over ADB from inside the container
// (requires exposing ADB's port/socket into the container — real setup work)

// Option B — skip local device provisioning entirely, use a CLOUD device farm
export default defineConfig({
  use: {
    connectOptions: {
      driver: 'MobileNextDriver',
      apiKey: process.env.MOBILE_NEXT_API_KEY,
    },
  },
});
```

**The documented, hard limitation worth internalizing precisely:** a Linux Docker container cannot run or reach an iOS Simulator at all — iOS Simulator is a macOS-only technology with no Linux equivalent, the same underlying constraint [Level 1's config table](Level_01_Setup_and_First_Native_Test.md#setup) already implied with `deviceType: 'simulator'` being iOS-specific. This means **Option A (local ADB-connected emulator) only ever works for Android inside a Linux container** — iOS testing inside Docker on Linux CI requires Option B, a cloud device provider, with no local alternative.

---

## Real-World Problem — Choosing Between the Two for a Real CI Pipeline

| Need | Local emulator (Option A) | Cloud devices (Option B) |
|---|---|---|
| Android testing in Linux CI | Works, with ADB setup | Works, no local setup |
| iOS testing in Linux CI | **Not possible at all** | Only viable option |
| iOS testing in macOS CI runners | Works (real Simulator, no Docker needed) | Also viable |
| Cost | Free (just CI compute) | Per-minute/per-device cost |
| Real hardware quirks (camera, sensors, push) | Emulator/simulator limitations apply | Depends on provider — real devices possible |

The honest takeaway: a project targeting both platforms from Linux-based CI needs **both** strategies — Android on local emulators (cheaper), iOS necessarily on a cloud provider (there's no local option on Linux at all) — not a single uniform choice across the whole suite.

---

## Solution — Diagnosing a Broken Environment Fast

```bash
npx mobilewright doctor
```

Already introduced in [Level 1](Level_01_Setup_and_First_Native_Test.md#real-world-problem--running-your-first-test-against-a-real-emulator) as worth running before your first test — this level is where it earns its keep as a genuine troubleshooting tool, not just a pre-flight check. Combined with verbose logging:

```bash
DEBUG=mw:* npx mobilewright test
```

`DEBUG=mw:*` enables Mobilewright's own internal debug namespace, surfacing driver-level communication (ADB commands issued, WebDriverAgent calls, connection retries) that's invisible in normal test output — the equivalent role [DOC_09's debugging toolkit](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md) already established for triaging failures by looking one layer below the test framework's own output.

**A troubleshooting order worth following, most likely cause first:**
1. `npx mobilewright doctor` — catches missing SDKs, unauthorized devices, path issues before anything else
2. Confirm the actual device/emulator is reachable independently (`adb devices` for Android — the same command from [02_Android_Native_Dev_And_Testing.md](../02_Android_Native_Dev_And_Testing.md)) — is this a Mobilewright problem, or is ADB itself not seeing the device at all?
3. `DEBUG=mw:*` — once the device is confirmed reachable, this narrows whether the failure is in driver communication, app installation, or the test logic itself

---

## Challenges

### 🐛 Bug Hunt — Assuming Docker Solves an iOS Problem It Structurally Can't

```yaml
# CI config, Linux runners
jobs:
  ios-tests:
    runs-on: ubuntu-latest
    container: ghcr.io/mobile-next/mobilewright
    steps:
      - run: npx mobilewright test --project=ios
```

This fails every time, immediately, regardless of how the Docker image or Mobilewright config is tuned. Using [this level's own Concept section](#concept--two-genuinely-different-device-sourcing-strategies), explain why no amount of container configuration fixes this.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** this isn't a configuration problem at all — it's attempting something with no valid solution as written: `runs-on: ubuntu-latest` means this job runs on Linux, and iOS Simulator has no Linux implementation, Dockerized or otherwise. No Docker image, however configured, can make a Linux kernel run macOS's Simulator framework. There are exactly two real fixes, both requiring a structural change rather than a config tweak: switch to a cloud device provider (Option B from [this level's own comparison table](#real-world-problem--choosing-between-the-two-for-a-real-ci-pipeline)) while staying on Linux runners, or switch this specific job to `runs-on: macos-latest` and run the iOS Simulator natively, no Docker needed at all for that path.

```yaml
jobs:
  ios-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npx mobilewright test --project=ios
        env:
          MOBILE_NEXT_API_KEY: ${{ secrets.MOBILE_NEXT_API_KEY }} # cloud devices, no local Simulator needed
```

The general lesson: **containerization solves toolchain-reproducibility problems, not OS-capability problems** — Docker can't grant a Linux host a capability that OS itself structurally lacks.

</details>

---

### 🎭 Two Truths and a Lie — Devices, Docker, and Diagnostics

**A.** `npx mobilewright doctor` checks toolchain readiness but can't tell you whether a specific already-connected device is currently reachable over ADB.

**B.** `DEBUG=mw:*` output includes driver-level communication (like ADB commands issued) that isn't visible in normal, non-debug test output.

**C.** An Android emulator can run locally inside a Linux Docker container, connected over ADB, with no cloud device provider required.

<details><summary>Which one's the lie</summary>

**A is the lie.** Per [this level's own troubleshooting order](#solution--diagnosing-a-broken-environment-fast), `doctor` explicitly checks device authorization state as part of its environment verification (the same "unauthorized device" example given back in [Level 1](Level_01_Setup_and_First_Native_Test.md#real-world-problem--running-your-first-test-against-a-real-emulator)) — it's not limited to static toolchain presence checks (Node/Java/SDK paths); it does examine live device reachability as part of its pass.

🔴 **Explanation:** B is true and is exactly why `DEBUG=mw:*` is the right escalation once `doctor` and a manual device check both pass but tests still fail mysteriously — it surfaces the layer between "the test framework" and "the actual driver commands" that's normally hidden. C is true and is [this level's own Basics/Concept split](#concept--two-genuinely-different-device-sourcing-strategies) — Android specifically works fine locally in a Linux container over ADB; it's only iOS that has no Linux-local path at all.

</details>

---

**Tier 3 complete.** You know Mobilewright's real limits — no built-in visual-regression comparison, iOS's hard Linux-container wall — as precisely as you know its capabilities, and you have the Inspector and `doctor`/`DEBUG` workflow to work efficiently rather than by trial and error. One level remains: wiring everything from all three tiers into one real, running CI pipeline.

**Next → [Level 13: Capstone — Cross-Platform CI Pipeline](Level_13_Capstone_Cross_Platform_CI_Pipeline.md)**
