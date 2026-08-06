# Widget Lifecycle Challenges

### Companion to [Week 03: Widget Lifecycle](Week_03_Widget_Lifecycle.md)

---

## How This Works

Same instrument as [Week 2's challenges](Week_02b_Widget_Rebuild_Challenges.md): `debugPrint` inside lifecycle methods, run in [DartPad](https://dartpad.dev), compare output to your prediction. The difference here is *order* — these problems are about predicting the exact sequence lifecycle methods fire in, then breaking things on purpose (crashes, leaks) so the failure mode stops being abstract.

---

### W3-1 (Easy) — Predict the exact print order

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: ParentScreen()));

class ParentScreen extends StatefulWidget {
  const ParentScreen({super.key});
  @override
  State<ParentScreen> createState() => _ParentScreenState();
}

class _ParentScreenState extends State<ParentScreen> {
  bool _showChild = true;
  String _label = 'first';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          if (_showChild) TrackedChild(label: _label),
          ElevatedButton(
            onPressed: () => setState(() => _label = 'second'),
            child: const Text('Change label (child stays mounted)'),
          ),
          ElevatedButton(
            onPressed: () => setState(() => _showChild = !_showChild),
            child: const Text('Toggle child mounted'),
          ),
        ],
      ),
    );
  }
}

class TrackedChild extends StatefulWidget {
  const TrackedChild({super.key, required this.label});
  final String label;
  @override
  State<TrackedChild> createState() => _TrackedChildState();
}

class _TrackedChildState extends State<TrackedChild> {
  @override
  void initState() {
    super.initState();
    debugPrint('initState (label=${widget.label})');
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    debugPrint('didChangeDependencies');
  }

  @override
  void didUpdateWidget(covariant TrackedChild oldWidget) {
    super.didUpdateWidget(oldWidget);
    debugPrint('didUpdateWidget (old=${oldWidget.label}, new=${widget.label})');
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('build (label=${widget.label})');
    return Text(widget.label);
  }

  @override
  void dispose() {
    debugPrint('dispose');
    super.dispose();
  }
}
```

**Task:** on paper, write out the exact print sequence for this click order:
1. App first loads
2. Tap "Change label" once
3. Tap "Toggle child mounted" once (child removed)
4. Tap "Toggle child mounted" again (child re-added)

Then run it and compare, line by line.

<details><summary>Answer</summary>

```
initState (label=first)
didChangeDependencies
build (label=first)
--- tap "Change label" ---
didUpdateWidget (old=first, new=second)
build (label=second)
--- tap "Toggle child mounted" (removing) ---
dispose
--- tap "Toggle child mounted" (re-adding) ---
initState (label=second)
didChangeDependencies
build (label=second)
```

🔴 **Erklärung:** the part people get wrong is step 4 — they expect `didUpdateWidget` because "it's the same widget as before." It isn't. Once the child is removed from the tree, its `Element` (and the `State` object attached to it) is destroyed via `dispose()`. Re-adding it creates a **brand new** `Element` and a **brand new** `State`, so the full mount sequence (`initState` → `didChangeDependencies` → `build`) runs again from scratch — the state doesn't "come back," it starts over. `didUpdateWidget` only fires when an *existing, still-mounted* element receives a new widget instance of the same type at the same position — that's exactly what "Change label" does (child never leaves the tree, just gets new constructor args).

</details>

---

### W3-2 (Medium) — Reproduce the `mounted` crash, then fix it

```dart
class FetchOnMount extends StatefulWidget {
  const FetchOnMount({super.key});
  @override
  State<FetchOnMount> createState() => _FetchOnMountState();
}

class _FetchOnMountState extends State<FetchOnMount> {
  String _data = 'loading...';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    await Future.delayed(const Duration(seconds: 3));
    setState(() => _data = 'loaded!'); // TODO: this can crash — fix it
  }

  @override
  Widget build(BuildContext context) => Text(_data);
}

// Host it in a parent with a toggle so you can remove FetchOnMount
// from the tree before the 3 seconds elapse:
class Host extends StatefulWidget {
  const Host({super.key});
  @override
  State<Host> createState() => _HostState();
}

class _HostState extends State<Host> {
  bool _show = true;
  @override
  Widget build(BuildContext context) => Scaffold(
    body: Column(
      children: [
        if (_show) const FetchOnMount(),
        ElevatedButton(
          onPressed: () => setState(() => _show = false),
          child: const Text('Remove before load finishes'),
        ),
      ],
    ),
  );
}
```

**Task 1:** run it, tap "Remove before load finishes" within 3 seconds, watch the console for the crash.

**Task 2:** fix `_loadData()` with the correct guard. Where exactly do you place it, and why there and not, say, at the very top of `_loadData` before the `await`?

<details><summary>Solution & Explanation</summary>

```dart
Future<void> _loadData() async {
  await Future.delayed(const Duration(seconds: 3));
  if (!mounted) return;
  setState(() => _data = 'loaded!');
}
```

🔴 **Erklärung:** the crash is `setState() called after dispose()`. Removing `FetchOnMount` from the tree calls `dispose()` on its `State`, which sets its internal `_element` reference to `null` — but the `Future.delayed` timer you started in `initState` doesn't know or care that the widget is gone; it keeps running on the event loop and eventually calls `setState` on a `State` object that no longer has a live element to rebuild. The guard must go **after the `await`**, not before — placing it before the `await` would only catch the (extremely unlikely) case where the widget was already disposed at the instant `_loadData` was first called. The actual race is that disposal happens *during* the 3-second wait, so the check that matters is the one right before you touch `setState`, checked freshly at that point in time.

</details>

---

### W3-3 (Medium) — Prove a timer leak with a counter, not a guess

```dart
class TimerCounter {
  static int active = 0;
}

class LeakyWidget extends StatefulWidget {
  const LeakyWidget({super.key});
  @override
  State<LeakyWidget> createState() => _LeakyWidgetState();
}

class _LeakyWidgetState extends State<LeakyWidget> {
  late final Timer _periodicTimer;
  late final Timer _oneShotTimer;

  @override
  void initState() {
    super.initState();
    _periodicTimer = Timer.periodic(const Duration(seconds: 1), (_) {});
    _oneShotTimer = Timer(const Duration(seconds: 10), () {});
    TimerCounter.active += 2;
  }

  @override
  void dispose() {
    _periodicTimer.cancel();
    TimerCounter.active -= 1;
    // BUG: _oneShotTimer never cancelled, counter never decremented for it
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Text('Active timers: ${TimerCounter.active}');
}
```

**Task:** wrap `LeakyWidget` in a toggle (like W3-2's `Host`) and mount/unmount it 5 times in a row. Print `TimerCounter.active` after each unmount. Predict the sequence of numbers, then fix the bug so it always returns to 0.

<details><summary>Solution & Explanation</summary>

```dart
@override
void dispose() {
  _periodicTimer.cancel();
  _oneShotTimer.cancel();
  TimerCounter.active -= 2;
  super.dispose();
}
```

🔴 **Erklärung:** the predicted sequence for the buggy version is `1, 2, 3, 4, 5` — climbing by exactly 1 per mount/unmount cycle, never returning to 0, because only the periodic timer's count is decremented. In a real app this is invisible until you've navigated to and from a screen fifty times and start wondering why memory keeps climbing — `TimerCounter.active` here is standing in for what a memory profiler's allocation tracker would show you in DevTools. The lesson generalizes past timers: **every `initState` resource acquisition (`Timer`, `StreamSubscription`, `AnimationController`, a registered listener) needs an exact, matching release in `dispose()` — "close enough" leaks exactly one thing, every time.**

</details>

---

### W3-4 (Easy) — `didUpdateWidget` guard: react only to real changes

**Problem:** a parent lets the user pick between 3 "video IDs." The child must reset its `_isPlaying` flag to `false` **only when the video ID actually changes** — not on every parent rebuild (the parent also has an unrelated counter that triggers rebuilds for no reason related to the video).

```dart
class VideoPlayer extends StatefulWidget {
  const VideoPlayer({super.key, required this.videoId});
  final String videoId;
  @override
  State<VideoPlayer> createState() => _VideoPlayerState();
}

class _VideoPlayerState extends State<VideoPlayer> {
  bool _isPlaying = true;

  @override
  void didUpdateWidget(covariant VideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    // TODO: reset _isPlaying to false, but ONLY if widget.videoId changed
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('build: videoId=${widget.videoId}, isPlaying=$_isPlaying');
    return Text('${widget.videoId} — ${_isPlaying ? "playing" : "paused"}');
  }
}
```

**Task:** implement the guard. Then explain: if you *forgot* the guard and just always set `_isPlaying = false` inside `didUpdateWidget`, what user-visible bug would that cause given the parent's unrelated counter also triggers rebuilds?

<details><summary>Solution & Explanation</summary>

```dart
@override
void didUpdateWidget(covariant VideoPlayer oldWidget) {
  super.didUpdateWidget(oldWidget);
  if (oldWidget.videoId != widget.videoId) {
    setState(() => _isPlaying = false);
  }
}
```

🔴 **Erklärung:** `didUpdateWidget` fires on **every** rebuild where the child is reused with a new widget instance — regardless of whether any prop the child cares about actually changed. If the parent rebuilds because of an unrelated counter, `VideoPlayer` still receives a new (but `videoId`-identical) widget instance, and `didUpdateWidget` still fires. Without the `oldWidget.videoId != widget.videoId` guard, the video would pause itself every time *anything* in the parent changed — a real bug users would describe as "the video randomly stops for no reason." The guard is what turns "a prop changed" into "the *specific* prop I care about changed."

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Video Player That Plays the Wrong Video

```dart
class VideoPlayer extends StatefulWidget {
  const VideoPlayer({required this.videoId});
  final String videoId;
  @override
  State<VideoPlayer> createState() => _VideoPlayerState();
}

class _VideoPlayerState extends State<VideoPlayer> {
  late String _loadedVideoId;

  @override
  void initState() {
    super.initState();
    _loadedVideoId = widget.videoId;
    _startPlayback(_loadedVideoId);
  }

  void _startPlayback(String id) => debugPrint('Now playing: $id');

  @override
  Widget build(BuildContext context) => Text('Playing: $_loadedVideoId');
}
```

Host this inside a parent with a dropdown that swaps `videoId` between three options, re-passing a new `VideoPlayer(videoId: selected)` on every selection. Predict: after switching the dropdown from `'video-1'` to `'video-2'`, what does the screen show?

<details><summary>Diagnosis & Fix</summary>

The screen keeps showing `Playing: video-1` no matter how many times you switch the dropdown — it never updates.

🔴 **Explanation:** this is a variant of [W3-4](#w3-4-easy--didupdatewidget-guard-react-only-to-real-changes), but with the bug in the opposite place — there's no `didUpdateWidget` override **at all**. `_loadedVideoId` is only ever set once, inside `initState`, and `initState` only runs on first mount. When the parent passes a new `widget.videoId`, the *element* is reused (same `VideoPlayer` type at the same position), so `initState` never runs again — the widget's constructor argument changed, but nothing reacted to it. The fix:

```dart
@override
void didUpdateWidget(covariant VideoPlayer oldWidget) {
  super.didUpdateWidget(oldWidget);
  if (oldWidget.videoId != widget.videoId) {
    setState(() {
      _loadedVideoId = widget.videoId;
      _startPlayback(_loadedVideoId);
    });
  }
}
```

The general lesson: **anything read from `widget.` and cached into a `State` field during `initState` needs a matching `didUpdateWidget` check**, or it goes stale the instant the parent passes new data to an already-mounted widget.

</details>

---

### 🔬 Diff Detective — Two Dispose Orders

Both snippets compile. Both "work" in the sense of not crashing during normal use. One has a subtle problem the other doesn't.

```dart
// Version A
@override
void dispose() {
  super.dispose();
  _controller.dispose();
}
```

```dart
// Version B
@override
void dispose() {
  _controller.dispose();
  super.dispose();
}
```

<details><summary>The actual difference</summary>

🔴 **Explanation:** `super.dispose()` marks the `State` object as fully defunct — after it runs, the framework considers this `State` gone, and calling most framework-facing methods on it afterward is unsafe/incorrect (in debug mode, some operations after `super.dispose()` trigger assertion failures). **Version A** calls `super.dispose()` *first*, then disposes `_controller` — technically the controller disposal itself doesn't usually touch the framework directly, so this often doesn't visibly break anything for a simple `AnimationController`. But it's the wrong order per the framework's documented contract, and it becomes a real bug the moment `_controller.dispose()` needs to do anything that touches `this` (e.g., a custom controller whose `dispose()` calls `setState` internally, or removes a listener that references `context`). **Version B** — dispose your own resources first, then call `super.dispose()` last — is the pattern used throughout every widget in the Flutter framework itself, and it's the one to build as muscle memory: **`dispose()` should always end with `super.dispose()`, never start with it.**

</details>

---

### ⚡ Speed Round — 5 Questions, 2 Minutes

1. Does `initState()` get called again if the widget's parent rebuilds but the child widget stays the same type at the same position?
2. If a `StatefulWidget` is never actually removed from the tree for the entire life of the app, does `dispose()` ever run?
3. Can `didChangeDependencies()` be called more than once for the same `State` object over its lifetime?
4. Is it safe to call `Navigator.of(context)` inside `initState()`?
5. Does `mounted` ever return `true` inside `dispose()` itself, while `dispose()` is actively running?

<details><summary>Answers</summary>

1. **No.** `initState` runs exactly once per `State` object's life — a parent rebuild that reuses the same element (same type, same position/key) triggers `didUpdateWidget`, not `initState`.
2. **No** — if the app is simply closed/killed with the widget still mounted, `dispose()` never gets a chance to run at all; it only fires when Flutter explicitly removes the element from the tree during normal operation.
3. **Yes.** It fires once right after `initState`, and again any time an `InheritedWidget` this widget depends on changes (e.g., the app's `Locale` or `Theme` changes) — it's not a one-shot method the way `initState` is.
4. **Yes**, actually — unlike `Theme.of(context)`, `Navigator.of(context)` doesn't require the InheritedWidget-dependency machinery to be fully "warmed up" the same way; it's commonly used safely in `initState` for things like triggering a post-frame navigation. (Still, scheduling it via `WidgetsBinding.instance.addPostFrameCallback` is the more common safe pattern for actually calling `.push()` from `initState`.)
5. **Yes**, technically, for the portion of `dispose()` before `super.dispose()` runs — `mounted` only flips to `false` as part of what `super.dispose()` (via the element's `unmount()`) does internally. This is precisely why the dispose-order lesson above matters.

</details>

---

### 👹 Boss Battle — A Self-Cleaning Polling Widget

**The spec:** build a `PollingStatus` widget that, while mounted, calls a provided `Future<String> Function()` every 3 seconds and displays the latest result. It must: (1) never crash with a `setState`-after-dispose error even if a slow poll response arrives after the widget is removed, (2) never leave a `Timer` running after disposal, (3) immediately re-poll (not wait for the next 3-second tick) if the polling function itself is swapped out via `didUpdateWidget`.

```dart
class PollingStatus extends StatefulWidget {
  const PollingStatus({super.key, required this.poll});
  final Future<String> Function() poll;
  @override
  State<PollingStatus> createState() => _PollingStatusState();
}

class _PollingStatusState extends State<PollingStatus> {
  // TODO — build the whole thing: Timer, mounted-guard, didUpdateWidget, dispose
}
```

<details><summary>Solution</summary>

```dart
class _PollingStatusState extends State<PollingStatus> {
  String _status = 'loading...';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _pollOnce();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) => _pollOnce());
  }

  Future<void> _pollOnce() async {
    final result = await widget.poll();
    if (!mounted) return;
    setState(() => _status = result);
  }

  @override
  void didUpdateWidget(covariant PollingStatus oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.poll != widget.poll) {
      _pollOnce(); // re-poll immediately with the NEW function, don't wait for the next tick
    }
  }

  @override
  Widget build(BuildContext context) => Text(_status);

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
```

🔴 **Explanation:** this is every lesson from this file's core problems and Bonus Round combined into one build — the `mounted` guard from W3-2, the timer-cleanup discipline from W3-3, the `didUpdateWidget` reaction-to-real-change from W3-4 and the Bug Hunt above, and the correct dispose ordering from the Diff Detective. The trickiest interaction to get right: `_pollOnce()` can be *in flight* (awaiting `widget.poll()`) at the exact moment `dispose()` runs — the `mounted` check inside `_pollOnce()` is what prevents that in-flight call from calling `setState` on a dead `State` object once it finally resolves.

</details>

---

**Next → [Week 4: Layout & Constraints](Week_04_Layout_and_Constraints.md) · [Layout Challenges](Week_04b_Layout_Challenges.md)**
