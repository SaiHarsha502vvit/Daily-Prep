# ADB & Dev Tooling

### The device-communication layer underneath `flutter run` — what actually happens when you hot reload

---

## Why This Doc Exists

Every other Reference doc in this library is about Flutter's own internals — widgets, rendering, context. This one is about the layer *underneath* Flutter: how your development machine actually talks to a physical phone or emulator at all. You've been running `flutter run` and watching hot reload work for weeks now. This doc is what's actually happening when you do that — and the toolkit for when it *stops* working.

---

## What ADB Actually Is

**ADB (Android Debug Bridge)** is not one program — it's three cooperating pieces, and understanding the split explains almost every "adb isn't working" problem you'll ever hit.

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   Your development       │         │   Android device /        │
│   machine                │         │   emulator                │
│                           │         │                            │
│  ┌─────────────────┐     │         │   ┌──────────────────┐    │
│  │  adb (client)    │     │         │   │  adbd (daemon)    │    │
│  │  the CLI you type│     │         │   │  runs ON the       │    │
│  │  commands into    │     │         │   │  device itself     │    │
│  └────────┬─────────┘     │         │   └─────────▲──────────┘    │
│           │               │         │             │               │
│  ┌────────▼─────────┐     │  USB or │             │               │
│  │  adb server        │◄──┼─────────┼─────────────┘               │
│  │  background process│    │  TCP/IP│                              │
│  │  on port 5037      │     │  (port │                              │
│  └────────────────────┘     │  5555) │                              │
└──────────────────────────┘         └──────────────────────────┘
```

**The three pieces:**

1. **`adb` (the client)** — the command you type. Every `adb` command you run is a short-lived process that connects to the server, sends a request, prints the result, and exits.
2. **`adb server`** — a long-running background process on *your* development machine, listening on `localhost:5037`. It stays alive between commands specifically so it doesn't have to re-scan for connected devices on every single `adb` invocation.
3. **`adbd` (the daemon)** — a background process running **on the device or emulator itself**. This is the part that actually has permission to install packages, read logs, and open a shell — the server on your machine is just relaying to this daemon.

**Why this three-piece split matters practically:** `adb kill-server` followed by `adb start-server` is the actual fix for a huge fraction of "my device stopped showing up" problems — it doesn't touch the device at all, it just restarts the middle piece (the server on your machine) and forces it to re-discover every connected device and daemon from scratch. If you've ever wondered why that fixes so many unrelated-seeming problems, this is why: the server's cached view of "what's connected" got stale, and the daemon on the device was fine the whole time.

---

## Core Commands You'll Actually Use

```bash
# List every connected device/emulator, with its connection state
adb devices
# Output: List of devices attached
#         emulator-5554    device
#         R58N40XXXX       device      ← a physical device, identified by serial

# Install an APK directly (bypassing the Play Store entirely — how `flutter run` deploys your app)
adb install build/app/outputs/flutter-apk/app-debug.apk

# Uninstall by package name (find the package name in android/app/build.gradle)
adb uninstall com.example.myapp

# Live-stream the device's system log — the single most-used ADB command in daily debugging
adb logcat

# Filter logcat to just your app's own tag (drastically cuts the noise)
adb logcat -s flutter

# Open an interactive shell ON the device
adb shell

# Run ONE shell command on the device without staying in an interactive shell
adb shell pm list packages | grep myapp

# Push/pull files between your machine and the device's filesystem
adb push local_file.txt /sdcard/Download/
adb pull /sdcard/Download/exported_data.db ./

# Take a screenshot, save it locally
adb exec-out screencap -p > screenshot.png

# Record the screen for a bug report (Ctrl+C to stop)
adb shell screenrecord /sdcard/demo.mp4
adb pull /sdcard/demo.mp4 ./

# Forward a port: make a port on the DEVICE reachable via a port on your MACHINE
adb forward tcp:8080 tcp:8080

# Reverse-forward: make a port on your MACHINE reachable via a port on the DEVICE
# This is the one that matters for local backend development —
# it lets an emulator hit "localhost:3000" and actually reach YOUR machine's localhost:3000
adb reverse tcp:3000 tcp:3000
```

**`adb reverse` deserves its own callout** — it's the answer to a question every Flutter developer building against a local backend eventually hits: *why does `http://localhost:3000` in my Flutter app fail on the emulator, when it works fine when I curl it from my terminal?* Inside the emulator, `localhost` refers to the emulator's *own* loopback interface — not your development machine's. `adb reverse tcp:3000 tcp:3000` explicitly tells the device "any connection you make to your own port 3000 should actually be tunneled back to port 3000 on the host machine." Android emulators also expose `10.0.2.2` as a special alias for the host machine's `localhost` without needing `adb reverse` at all — two different solutions to the identical problem, worth knowing both exist.

---

## How `flutter run` Actually Uses ADB Underneath

You've never typed a single `adb` command to make hot reload work — `flutter run` is doing it for you, silently, every time.

```
flutter run
    ↓
1. Flutter tooling calls `adb devices` internally to discover connected devices
    ↓
2. Flutter builds a debug APK, then calls `adb install` to deploy it
    ↓
3. Flutter uses `adb forward` to open a port between your machine and the
   running app's Dart VM Service (the same VM Service from Week 24's
   DevTools content — Observatory/DevTools connects through this exact tunnel)
    ↓
4. You save a file → hot reload triggers:
   - Flutter tooling recompiles ONLY the changed code (JIT, per Week 1's
     compilation content)
   - Sends the new code over the already-open VM Service connection
     (tunneled through the adb-forwarded port)
   - The Dart VM on the device patches the running isolate in place
    ↓
5. `adb logcat -s flutter` (or the equivalent DevTools log view) is what's
   actually showing you the print() output and any Dart-side stack traces
```

This is why a phone connected over USB with debugging disabled, or a broken `adb` state, breaks `flutter run` entirely — it's not a separate Flutter-specific transport, it's ADB doing the actual device communication the whole time, with Flutter's tooling as a client sitting on top of it.

---

## `flutter doctor` — Diagnosing Your Whole Toolchain, Not Just ADB

```bash
flutter doctor -v
```

`flutter doctor` checks far more than ADB — Android SDK installation, licenses accepted, Xcode command-line tools (on macOS), connected devices, IDE plugins — but a huge fraction of the failures it surfaces trace back to ADB/device-connection issues specifically. Reading its output line by line, rather than skimming for the green checkmarks, is the single highest-leverage debugging habit for "my Flutter environment is broken and I don't know why."

---

## iOS: The Analogous (But Different) Toolchain

ADB is **Android-only** — iOS has no direct equivalent, because Apple's device communication model is fundamentally different (no client/server/daemon split exposed to developers the way ADB is).

| Need | Android (ADB) | iOS |
|------|---------------|-----|
| List connected devices | `adb devices` | `xcrun xctrace list devices` or `flutter devices` (cross-platform) |
| Install an app | `adb install app.apk` | Xcode's device deployment, or `ios-deploy` |
| Live device logs | `adb logcat` | Xcode's Console app, or `idevicesyslog` (libimobiledevice) |
| Screenshot | `adb exec-out screencap` | Xcode's device window, or `xcrun simctl io booted screenshot` (simulator only) |
| Port forwarding | `adb reverse`/`adb forward` | iOS Simulator shares the host's `localhost` directly — no forwarding needed at all for simulator; physical devices need Xcode's own USB multiplexing (`usbmuxd`) |

**The one genuinely different, worth-knowing fact:** the iOS **Simulator** runs as a process on your Mac itself (not a separate virtualized OS the way an Android emulator is) — which is exactly why it can access `localhost` directly with zero port-forwarding setup, while a **physical** iPhone needs Xcode's own device-communication daemon (`usbmuxd`) the same way Android's `adbd` handles it, just via an entirely different protocol you don't interact with directly.

`flutter devices` and `flutter logs` are Flutter's own cross-platform commands that internally dispatch to whichever platform-native tool (`adb` or Xcode's tooling) is appropriate — one command, two completely different mechanisms underneath, chosen automatically based on what's connected.

---

## Quick Reference — When Something's Broken

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `flutter devices` shows nothing | `adb server` is stale, or USB debugging isn't authorized on the device | `adb kill-server && adb start-server`; check the device for an "Allow USB debugging?" prompt |
| App emulator can't reach my local backend at `localhost:3000` | `localhost` inside the emulator refers to the emulator, not your machine | `adb reverse tcp:3000 tcp:3000`, or use `10.0.2.2:3000` instead |
| Hot reload silently stops working mid-session | The VM Service port `flutter run` forwarded via `adb forward` got closed or reassigned | Restart `flutter run` (a full restart re-establishes the forward) |
| `adb install` fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | The device has an existing install signed with a different key | `adb uninstall <package>` first, then reinstall |
| Device shows as `unauthorized` in `adb devices` | The device hasn't approved this machine's debugging RSA key yet | Check the device screen for the authorization prompt; tap Allow |
| `flutter doctor` shows Android toolchain issues | SDK licenses not accepted, or SDK path misconfigured | `flutter doctor --android-licenses`, or check `ANDROID_HOME`/`ANDROID_SDK_ROOT` |

---

**→ Related files:**
- [DOC_07b_ADB_and_Dev_Tooling_Challenges.md](DOC_07b_ADB_and_Dev_Tooling_Challenges.md) — want to actually get fluent, not just informed? Challenges for this doc
- [DOC_06_Async_Patterns_Complete.md](DOC_06_Async_Patterns_Complete.md) — the Dart VM Service that `adb forward` tunnels hot reload through
- [Phase_1_Dart_and_Foundations/Week_01_Dart_Language.md](../Phase_1_Dart_and_Foundations/Week_01_Dart_Language.md) — AOT vs JIT compilation, what hot reload is actually patching
- [Phase_6_Quality_and_Deployment/Week_26_CICD_and_Deployment.md](../Phase_6_Quality_and_Deployment/Week_26_CICD_and_Deployment.md) — where `adb install`-style deployment fits into a CI pipeline
