# Week 3 — Widget Lifecycle
### Every lifecycle method, when it runs, and what to do in it

---

`StatelessWidget` has one method: `build()`. That's its entire lifecycle.

`StatefulWidget` has a full lifecycle with 7 methods. This is what this file is about.

---

## The Complete Lifecycle — Visual Flow

```
                    Widget inserted into tree
                            │
                            ▼
                      createState()
                   (creates the State object)
                            │
                            ▼
                       initState()
              (called ONCE — set up your resources)
                            │
                            ▼
                 didChangeDependencies()
             (called after initState, and again if
              an InheritedWidget dependency changes)
                            │
                            ▼
                  ┌─────  build()  ─────┐
                  │   (called every time │
                  │    setState() fires) │
                  │                     │
                  │  ← setState() ←     │
                  └─────────────────────┘
                            │
                  [parent rebuilds with
                   new widget config]
                            │
                            ▼
                    didUpdateWidget()
              (called when parent passes new
               config, build() follows automatically)
                            │
                            ▼
                 [widget removed from tree]
                            │
                            ▼
                       deactivate()
                  (widget removed but might
                   be re-inserted elsewhere)
                            │
                            ▼
                        dispose()
               (permanent removal — clean up here)
                            │
                            ▼
                    State object destroyed
```

---

## 1. `createState()`

Called by Flutter when the `StatefulWidget` is inserted into the tree. It creates the `State` object. You almost never override or put logic in this — just return the state.

```dart
class MyWidget extends StatefulWidget {
  const MyWidget({super.key});

  @override
  State<MyWidget> createState() => _MyWidgetState();
  // That's all you do here.
}
```

---

## 2. `initState()`

Called **once** — right after the State is created and before `build()` runs for the first time.

**Use it for:**
- Initialising controllers (`TextEditingController`, `AnimationController`, `ScrollController`)
- Subscribing to streams or listeners
- Setting up data based on `widget.someProperty`
- Starting one-time async operations

```dart
class TimerWidget extends StatefulWidget {
  final int startSeconds;
  const TimerWidget({super.key, required this.startSeconds});

  @override
  State<TimerWidget> createState() => _TimerWidgetState();
}

class _TimerWidgetState extends State<TimerWidget> {
  late int _seconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();         // ALWAYS call super.initState() first
    _seconds = widget.startSeconds;  // widget. gives you the StatefulWidget's properties

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() {
        if (_seconds > 0) _seconds--;
      });
    });
  }
  // ...
}
```

**Critical rules:**
- Always call `super.initState()` first
- You can access `widget.something` here
- You can't call `Navigator.of(context)` here — the widget isn't fully mounted yet
- Don't call `setState()` directly in `initState()` — it's redundant and Flutter warns about it

---

## 3. `didChangeDependencies()`

Called right after `initState()` AND again whenever an `InheritedWidget` that this widget depends on changes.

**Example of InheritedWidget dependency:** If your widget uses `Theme.of(context)` or `MediaQuery.of(context)`, those are `InheritedWidgets`. If the theme changes (e.g., user switches to dark mode), `didChangeDependencies()` is called before the next `build()`.

```dart
@override
void didChangeDependencies() {
  super.didChangeDependencies();
  // Safe to use BuildContext-dependent things here (Theme, MediaQuery, etc.)
  // that weren't safe to use in initState
  final screenWidth = MediaQuery.of(context).size.width;
  _isTablet = screenWidth > 600;
}
```

**When do you actually use it?** Rarely. Most of the time `build()` handles context-dependent data. Use `didChangeDependencies()` when you need to do expensive work (like network calls) based on an inherited value that can change — and you only want to redo that work when that specific value changes, not on every `build()`.

---

## 4. `build()`

The most important method. Called every time:
- `setState()` is called
- The parent widget rebuilds and passes a new configuration
- `didChangeDependencies()` fires

```dart
@override
Widget build(BuildContext context) {
  // THIS MUST BE PURE — no side effects here
  // Don't make network calls here
  // Don't start timers here
  // Just describe the UI based on current state

  return Column(
    children: [
      Text('Seconds left: $_seconds'),
      ElevatedButton(
        onPressed: _seconds > 0 ? _resetTimer : null,
        child: const Text('Reset'),
      ),
    ],
  );
}
```

**Critical rule: `build()` must be a pure function.** It should only read state and return widgets. Side effects (network calls, timers, file reads) should never be in `build()` because it can be called many times per second.

---

## 5. `didUpdateWidget()`

Called when the **parent widget rebuilds** and passes a new version of the `StatefulWidget` to this State. The State object itself is reused, but the `widget` property now points to the new configuration.

```dart
class PlayerWidget extends StatefulWidget {
  final String audioUrl;   // parent might change this
  const PlayerWidget({super.key, required this.audioUrl});

  @override
  State<PlayerWidget> createState() => _PlayerWidgetState();
}

class _PlayerWidgetState extends State<PlayerWidget> {
  AudioPlayer? _player;

  @override
  void initState() {
    super.initState();
    _startPlaying(widget.audioUrl);
  }

  @override
  void didUpdateWidget(PlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);  // always call super first
    
    // oldWidget = the previous widget config
    // widget = the new widget config (already updated)
    if (oldWidget.audioUrl != widget.audioUrl) {
      // URL changed — stop old audio, start new one
      _player?.stop();
      _startPlaying(widget.audioUrl);
    }
  }

  void _startPlaying(String url) { /* ... */ }
}
```

**When you need this:** When a property changes from the parent and you need to react to that change (not just redraw, but actually *do something* — stop and restart a process, update an animation, reconnect a socket).

---

## 6. `deactivate()`

Called when the State object is removed from the widget tree. This can be **temporary** — the widget might be re-inserted elsewhere (for example, if it moves in the tree via a `GlobalKey`).

```dart
@override
void deactivate() {
  // Clean up any links to OTHER elements in the tree
  // Don't release heavy resources here — that's dispose()'s job
  super.deactivate();
}
```

You'll rarely override `deactivate()`. Most cleanup should go in `dispose()`.

---

## 7. `dispose()`

Called when the State is removed from the tree **permanently**. The widget will never come back. This is where you **release all resources**.

```dart
@override
void dispose() {
  // Cancel timers
  _timer?.cancel();

  // Dispose controllers
  _textController.dispose();
  _animationController.dispose();
  _scrollController.dispose();
  _focusNode.dispose();

  // Cancel stream subscriptions
  _subscription?.cancel();

  // Close audio/video players
  _player?.dispose();

  super.dispose();  // always call super last in dispose
}
```

**Forgetting `dispose()` is a memory leak.** If you create an `AnimationController` in `initState()` and don't dispose it, it keeps ticking in memory even after the screen is gone. Flutter's debug mode will warn you.

**The rule:** whatever you create in `initState()`, you must destroy in `dispose()`.

---

## 8. Lifecycle in Practice — A Real Example

Here's a complete countdown timer widget that demonstrates every lifecycle method:

```dart
class CountdownTimer extends StatefulWidget {
  final int seconds;
  final VoidCallback? onComplete;

  const CountdownTimer({
    super.key,
    required this.seconds,
    this.onComplete,
  });

  @override
  State<CountdownTimer> createState() => _CountdownTimerState();
}

class _CountdownTimerState extends State<CountdownTimer>
    with SingleTickerProviderStateMixin {
  late int _remaining;
  late AnimationController _progressController;
  Timer? _timer;

  // ── initState: called once ──────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _remaining = widget.seconds;

    _progressController = AnimationController(
      vsync: this,
      duration: Duration(seconds: widget.seconds),
    )..forward();

    _startTimer();
  }

  // ── didUpdateWidget: parent changed the seconds prop ─────────────
  @override
  void didUpdateWidget(CountdownTimer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.seconds != widget.seconds) {
      _timer?.cancel();
      setState(() => _remaining = widget.seconds);
      _progressController
        ..reset()
        ..duration = Duration(seconds: widget.seconds)
        ..forward();
      _startTimer();
    }
  }

  // ── build: pure, just reads state ───────────────────────────────
  @override
  Widget build(BuildContext context) {
    final pct = _remaining / widget.seconds;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '$_remaining',
          style: Theme.of(context).textTheme.displayLarge,
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: pct,
          color: pct > 0.5 ? Colors.green : pct > 0.2 ? Colors.orange : Colors.red,
        ),
      ],
    );
  }

  // ── dispose: release everything ─────────────────────────────────
  @override
  void dispose() {
    _timer?.cancel();
    _progressController.dispose();
    super.dispose();
  }

  // ── private helper (not a lifecycle method) ──────────────────────
  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;  // check mounted before setState
      setState(() {
        if (_remaining > 0) {
          _remaining--;
        } else {
          _timer?.cancel();
          widget.onComplete?.call();
        }
      });
    });
  }
}
```

**Note `mounted`:** Before calling `setState()` inside an async callback or timer, check `if (!mounted) return`. If the widget was disposed while the timer was running, calling `setState()` on a disposed widget throws an error. `mounted` returns `false` after `dispose()`.

---

## 9. One More Thing: `StatelessWidget` Also Has a Lifecycle

It's simpler:

```dart
class MyStateless extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Only method. Called every time the parent rebuilds or 
    // when the widget's own properties change.
    return const Text('hello');
  }
}
```

That's it. No init, no dispose, no update. If you need any of those, you need `StatefulWidget`.

---

## Lifecycle Comparison Table

| Method | When called | Called how many times | Common use |
|--------|-------------|----------------------|------------|
| `createState()` | Widget first inserted | Once | Return State instance |
| `initState()` | State created | Once | Init controllers, subscribe to streams |
| `didChangeDependencies()` | After initState + when InheritedWidget changes | Once + on change | Heavy work dependent on context |
| `build()` | After any of the above + setState | Many times | Describe the UI |
| `didUpdateWidget()` | Parent rebuilds with new config | On parent rebuild | React to changed props |
| `deactivate()` | Widget removed (possibly temporarily) | On removal | Rare — delink from tree elements |
| `dispose()` | Widget permanently removed | Once | Dispose controllers, cancel timers |

---

## Tasks

**Task 1: Log the lifecycle**
Create a `StatefulWidget` that overrides EVERY lifecycle method and prints a message in each one. Navigate to it and back. Observe in the console exactly when each method fires.

**Task 2: The mounted check**
Create a widget with a button that starts a 3-second async operation. Navigate away while it's running. Without `mounted`, you'll see an error. Fix it with `if (!mounted) return`.

**Task 3: didUpdateWidget in action**
Create a parent widget with a button that changes a color. Pass that color to a `StatefulWidget` child. In `didUpdateWidget`, detect when the color changed and print "Color changed from X to Y". Verify it fires on every press.

**Task 4: Dispose or leak**
Create a `TextEditingController` in `initState()` but intentionally forget `dispose()`. Run in debug mode and look for the leak warning in the console. Then fix it.

**Task 5: Countdown timer**
Copy the `CountdownTimer` above, run it, then change the parent's `seconds` value via a button. Verify `didUpdateWidget` resets the timer correctly.

---

## Lab — Full Screen With All Lifecycle Methods

Build an **Audio Player screen** (fake — no actual audio, just the UI and state simulation):

- `initState`: set up a timer that ticks every second to advance the "current position"
- `build`: show a progress bar, current time, total time, play/pause button, track title
- `didUpdateWidget`: if the track title changes (parent changes the song), reset position to 0 and restart the ticker
- `dispose`: cancel the timer

Parent should have 3 buttons to "change the song" — each passes a different title to the player widget.

---

**Next → [Week 4: Layout & the Constraints Model](Week_04_Layout_and_Constraints.md)**
