# Week 3 — Widget Lifecycle
### Every method, when it fires, what to put in it, and what breaks if you get it wrong

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — what Flutter does internally and what your code should do
> - 🎨 **Designer** — how lifecycle maps to user experience moments
> - 🧪 **Tester** — what to verify, what breaks, common pitfalls

---

## Why Lifecycle Matters

`StatelessWidget` has one method: `build()`. That's its entire lifecycle — called when the parent gives it new data, done.

`StatefulWidget` has **seven lifecycle methods**. Each one fires at a specific moment in the widget's life. If you put code in the wrong method, you get bugs that are extremely hard to debug — memory leaks, crashes on navigation, UI that doesn't update when it should, double-initialization.

This week you learn every method, exactly when it fires, and exactly what belongs in it.

---

## The Complete Lifecycle — Visual Flow

```
Widget inserted into tree for the first time
              │
              ▼
        createState()          ← Flutter creates your State object
              │
              ▼
         initState()           ← called ONCE. Set up controllers, subscriptions.
              │
              ▼
   didChangeDependencies()     ← called after initState. Also fires when an
              │                  InheritedWidget above this widget changes.
              ▼
┌──────────── build() ──────────────────┐
│         (pure function —              │
│          describe the UI,             │◄── setState() triggers rebuild
│          no side effects)             │
└───────────────────────────────────────┘
              │
   [parent rebuilds with new config]
              │
              ▼
      didUpdateWidget()        ← parent passed new widget configuration.
              │                  React to changed props here.
              ▼
    [widget removed from tree]
              │
              ▼
         deactivate()          ← temporarily removed. May come back.
              │
              ▼
          dispose()            ← permanently removed. Release EVERYTHING.
              │
              ▼
       State object destroyed
```

---

## 1. `createState()`

> 📄 **Flutter Docs (StatefulWidget):**
> *"Creates the mutable state for this widget at a given location in the tree. Subclasses should override this method to return a newly created instance of their associated State subclass."*

```dart
class VideoPlayer extends StatefulWidget {
  final String videoUrl;
  const VideoPlayer({super.key, required this.videoUrl});

  @override
  State<VideoPlayer> createState() => _VideoPlayerState();
  // One job: return a new State instance. Nothing else goes here.
}
```

**Rule:** `createState()` does exactly one thing — `return _YourState()`. Never put logic here. Never read `widget.someProperty` here. Never start async operations here.

🧑‍💻 **Developer:** Flutter calls `createState()` every time the widget is **inflated** (inserted) into the tree. If the same `StatefulWidget` appears in 3 places on screen, Flutter calls `createState()` 3 times and creates 3 independent `State` objects.

---

## 2. `initState()`

> 📄 **Flutter Docs (State.initState):**
> *"Called when this object is inserted into the tree. Override this method to perform initialization that depends on the location at which this object was inserted into the tree or on the widget used to configure this object."*
>
> *"If you override this, make sure your method starts with a call to super.initState()."*

`initState()` is called **once** — right after `createState()`, before the first `build()`. This is your setup phase.

```dart
class MusicPlayerState extends State<MusicPlayer>
    with SingleTickerProviderStateMixin {

  late AudioController _audioController;
  late AnimationController _spinController;
  StreamSubscription<Duration>? _positionSub;

  @override
  void initState() {
    super.initState();   // ALWAYS first — Flutter needs this for framework setup

    // ✓ Initialize controllers with widget config
    _audioController = AudioController(url: widget.audioUrl);

    // ✓ Initialize animation controllers (vsync requires SingleTickerProviderStateMixin)
    _spinController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    // ✓ Subscribe to streams
    _positionSub = _audioController.positionStream.listen((position) {
      setState(() => _currentPosition = position);
    });

    // ✓ Kick off an async load (but DON'T await here — initState is sync)
    _loadTrackMetadata();
  }

  Future<void> _loadTrackMetadata() async {
    final metadata = await _audioController.loadMetadata();
    if (!mounted) return;   // ← always check mounted after any await
    setState(() => _trackTitle = metadata.title);
  }
```

**What initState CANNOT do:**

```dart
@override
void initState() {
  super.initState();

  // ❌ Cannot use context here — widget not yet in the tree
  // Theme.of(context) — will throw
  // Navigator.of(context) — will throw
  // MediaQuery.of(context) — will throw

  // ❌ Cannot call setState() directly — redundant, Flutter warns
  // setState(() { _value = 42; });  ← just assign directly: _value = 42;
}
```

**Rule:** `super.initState()` goes **first**. Initialize controllers, subscribe to streams, start async loads. Never use `context` here — the widget isn't in the tree yet.

🎨 **Designer:** `initState()` is the "screen appeared" moment. This is where you'd start an entrance animation, begin loading the data that fills the screen, or start a video autoplay. From the user's perspective: the screen just opened.

🧪 **Tester:** `initState()` runs automatically when you `pumpWidget()` a `StatefulWidget`. If `initState()` starts a timer or stream, remember to cancel it in `dispose()` — otherwise your test will throw because the timer fires after the widget is disposed.

**→ Try this:** Build a `CountdownBadge` StatefulWidget. It takes `int seconds`. In `initState()`, start a `Timer.periodic` that decrements a counter every second. When it hits 0, it shows "EXPIRED" in red. Observe in the console exactly when `initState` fires by printing there.

---

## 3. `didChangeDependencies()`

> 📄 **Flutter Docs (State.didChangeDependencies):**
> *"Called when a dependency of this State object changes. For example, if the previous call to build referenced an InheritedWidget that later changed, the framework would call this method to notify this object about the change."*
>
> *"This method is also called immediately after initState. It is safe to call BuildContext.dependOnInheritedWidgetOfExactType from this method."*

This method fires in two situations:
1. **Immediately after `initState()`** — always, on first creation
2. **Whenever an InheritedWidget this widget depends on changes** — for example, if the user switches from light mode to dark mode, every widget that called `Theme.of(context)` in its last `build()` gets `didChangeDependencies()` called

```dart
@override
void didChangeDependencies() {
  super.didChangeDependencies();

  // SAFE to use context here (unlike initState)
  final locale = Localizations.localeOf(context);

  // Only redo expensive work if the dependency actually changed
  if (_currentLocale != locale) {
    _currentLocale = locale;
    _reloadLocalizedContent();   // expensive — only do when locale actually changed
  }
}
```

**When do you actually override this?** Rarely. Most of the time `build()` handles inherited data just fine. Override `didChangeDependencies()` when you need to do **expensive work** (a network call, database read, heavy computation) that depends on an InheritedWidget value — and you only want to redo that work when that specific value changes, not on every `setState()`.

**Rule:** If you find yourself doing expensive setup based on `Theme.of(context)` or `MediaQuery.of(context)` — put it in `didChangeDependencies()`, not `initState()`. It's the first place context is safely available.

---

## 4. `build()`

> 📄 **Flutter Docs (State.build):**
> *"Describes the part of the user interface represented by this widget. The framework calls this method in a number of different situations: After calling initState. After calling didUpdateWidget. After receiving a call to setState. After a dependency of this State object changes. After calling deactivate and then reinserting the State object into the tree at another location."*

`build()` is the most-called method in all of Flutter. It can be called **many times per second** — every `setState()`, every parent rebuild, every InheritedWidget change.

```dart
@override
Widget build(BuildContext context) {
  // ✓ Read state and return widgets
  // ✓ Use Theme.of(context), MediaQuery.of(context)
  // ✓ Conditional rendering based on state
  // ✓ Call helper methods that return widgets

  return Column(
    children: [
      if (_isLoading) const CircularProgressIndicator(),
      if (!_isLoading && _error != null) ErrorView(message: _error!),
      if (!_isLoading && _error == null) ContentView(data: _data!),
    ],
  );
}
```

**What NEVER belongs in `build()`:**

```dart
@override
Widget build(BuildContext context) {
  // ❌ Network calls — fires 60x per second during animations
  final data = await http.get(Uri.parse('...'));

  // ❌ Starting timers
  Timer.periodic(Duration(seconds: 1), (_) { ... });

  // ❌ Initializing controllers
  _controller = AnimationController(vsync: this, ...);

  // ❌ Calling setState() directly — infinite loop
  setState(() { _count++; });
}
```

> 📄 **Flutter Docs:**
> *"This method can potentially be called in every frame and should not have any side effects beyond building a widget."*

**Rule:** `build()` is a **pure function**. It reads state, reads config, returns a widget tree. Nothing else. If you're doing anything that isn't "return a widget based on current state," it doesn't belong in `build()`.

🎨 **Designer:** Every visual state of your screen is a return value of `build()`. Think of `build()` as "given the current data, what should the screen look like right now?" — loading state, error state, empty state, data state — each is a different return from `build()`.

```dart
// Clean state-driven UI — designer can map each visual to a state
Widget build(BuildContext context) {
  return switch (_state) {
    LoadingState() => const LoadingShimmer(),
    ErrorState(:final message) => ErrorCard(message: message, onRetry: _load),
    EmptyState() => const EmptyIllustration(),
    DataState(:final items) => ItemGrid(items: items),
  };
}
```

🧪 **Tester:** Test every visual state by setting up the state before pumping:

```dart
// Test loading state
testWidgets('shows shimmer while loading', (tester) async {
  // Arrange: set up a mock that never completes
  await tester.pumpWidget(MaterialApp(home: MyScreen()));
  // Assert: while future is pending, shimmer shows
  expect(find.byType(LoadingShimmer), findsOneWidget);
});

// Test error state
testWidgets('shows retry button on error', (tester) async {
  await tester.pumpWidget(MaterialApp(home: MyScreen()));
  await tester.pump();  // let the failed future complete
  expect(find.byType(ErrorCard), findsOneWidget);
  expect(find.text('Retry'), findsOneWidget);
});
```

---

## 5. `didUpdateWidget()`

> 📄 **Flutter Docs (State.didUpdateWidget):**
> *"Called whenever the widget configuration changes. If the parent widget rebuilds and requests that this location in the tree update to display a new widget with the same runtimeType and Widget.key, the framework will update the widget property of this State object to refer to the new widget and then call this method with the previous widget as an argument."*

When the parent rebuilds and passes a new version of the widget configuration to your existing State, Flutter calls `didUpdateWidget()`. Your State is NOT recreated — it gets a notification that its widget changed.

```dart
class AudioPlayer extends StatefulWidget {
  final String trackUrl;    // parent might change this
  final bool autoPlay;
  const AudioPlayer({super.key, required this.trackUrl, this.autoPlay = false});

  @override
  State<AudioPlayer> createState() => _AudioPlayerState();
}

class _AudioPlayerState extends State<AudioPlayer> {
  late AudioEngine _engine;
  bool _isPlaying = false;

  @override
  void initState() {
    super.initState();
    _engine = AudioEngine(widget.trackUrl);
    if (widget.autoPlay) _engine.play();
  }

  @override
  void didUpdateWidget(AudioPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);   // ALWAYS call super first

    // oldWidget = the previous configuration
    // widget    = the NEW configuration (already updated)

    if (oldWidget.trackUrl != widget.trackUrl) {
      // Track changed — stop current, load new one
      _engine.stop();
      _engine.dispose();
      _engine = AudioEngine(widget.trackUrl);
      setState(() => _isPlaying = false);
    }

    if (oldWidget.autoPlay != widget.autoPlay && widget.autoPlay) {
      _engine.play();
      setState(() => _isPlaying = true);
    }
  }

  @override
  void dispose() {
    _engine.dispose();
    super.dispose();
  }
}
```

**The critical pattern here:** Compare `oldWidget.property` with `widget.property`. Only act when something actually changed. If you react to every `didUpdateWidget()` call without comparing, you'll reset unnecessarily.

**Rule:** `super.didUpdateWidget(oldWidget)` goes **first**. Always compare `oldWidget.X != widget.X` before doing anything. Use it when a property change requires you to *do something* (stop a process, reload data, update a controller) — not just redisplay.

🎨 **Designer:** This is the "content swap" moment. Think of a news app where the user picks a different article — the same `ArticleScreen` widget stays on screen but gets a new `article` passed in. `didUpdateWidget()` is where you'd reset the scroll position to the top and start loading the new article's images.

🧪 **Tester:** Test `didUpdateWidget` by rebuilding the parent with different props:

```dart
testWidgets('AudioPlayer reloads when track changes', (tester) async {
  final key = GlobalKey<_AudioPlayerState>();

  await tester.pumpWidget(
    MaterialApp(home: AudioPlayer(key: key, trackUrl: 'song1.mp3')),
  );

  // Change the track by rebuilding with a new URL
  await tester.pumpWidget(
    MaterialApp(home: AudioPlayer(key: key, trackUrl: 'song2.mp3')),
  );

  // Verify the engine reloaded
  // (in a real test, you'd use a mock engine and verify its load() was called)
});
```

**→ Try this:** Build a `ColorSwatch` widget that takes a `Color`. It shows a large colored box that animates to the new color when the parent passes a different one. Use `didUpdateWidget()` to detect the color change and start an `AnimationController` transition. The parent has 3 buttons that each pass a different color.

---

## 6. `deactivate()`

> 📄 **Flutter Docs (State.deactivate):**
> *"Called when this object is removed from the tree. The framework calls this method whenever it removes this State object from the tree. In some cases, the framework will reinsert the State object into another part of the tree (e.g., if the subtree containing this State object is grafted from one location in the tree to another due to the use of a GlobalKey)."*

`deactivate()` fires when the widget is removed from the tree — but the removal might be **temporary**. The widget could be re-inserted elsewhere (this happens with `GlobalKey` moves).

```dart
@override
void deactivate() {
  // Pause any ongoing work if the widget is temporarily removed
  // Do NOT release heavy resources here — that belongs in dispose()
  super.deactivate();  // always call super
}
```

**Rule:** You will almost never override `deactivate()`. Use `dispose()` for cleanup. The only reason to override `deactivate()` is if you need to unhook from something in the current tree location before potentially moving to a new location.

---

## 7. `dispose()`

> 📄 **Flutter Docs (State.dispose):**
> *"Called when this object is removed from the tree permanently. The framework calls this method when this State object will never build again. After the framework calls dispose, the State object is considered unmounted and the mounted property is false. It is an error to call setState at this point."*
>
> *"Subclasses should override this method to release any resources retained by this object."*

`dispose()` is the **cleanup method**. It fires once, when the widget is permanently removed from the tree — user navigated away, widget was hidden, screen was popped. After this, the State object is destroyed.

**Everything you create in `initState()`, you must destroy in `dispose()`.**

```dart
@override
void dispose() {
  // ─── Dispose in REVERSE order of initialization ─────────────────

  // Cancel timers (otherwise they keep firing in memory — memory leak)
  _countdownTimer?.cancel();

  // Dispose controllers (they hold vsync/listener registrations)
  _animationController.dispose();
  _textEditingController.dispose();
  _scrollController.dispose();
  _focusNode.dispose();
  _pageController.dispose();

  // Cancel stream subscriptions (otherwise stream keeps sending to a dead widget)
  _positionSubscription?.cancel();
  _authSubscription?.cancel();

  // Close/release other resources
  _videoController?.dispose();
  _audioPlayer?.dispose();
  _databaseConnection?.close();

  super.dispose();   // ALWAYS last — opposite of initState's super first
}
```

**The memory leak pattern to recognize:**

```dart
// initState creates a controller
@override
void initState() {
  super.initState();
  _controller = AnimationController(vsync: this, duration: ...);
}

// dispose FORGETS to clean it up ← MEMORY LEAK
@override
void dispose() {
  // _controller.dispose(); ← missing!
  super.dispose();
}
```

Flutter's debug mode prints a warning for AnimationControllers:
```
The following assertion was thrown while dispatching notifications for AnimationController:
This AnimationController was not disposed. Make sure to implement dispose()!
```

**Rule:** `super.dispose()` goes **last**. Every `Controller`, every `Timer`, every `StreamSubscription` created in `initState()` must be disposed/cancelled here. Think of `initState()` and `dispose()` as matching pairs.

🎨 **Designer:** `dispose()` is the "screen closed" moment. From the user's perspective: they pressed back or navigated away. Resources the screen was using (video playback, location tracking, network polling) should stop. A designer cares because runaway timers after navigation cause unexpected behavior — audio playing on the wrong screen, GPS draining battery.

🧪 **Tester:** Flutter tests check for undisposed resources automatically. Run your tests with `flutter test --reporter=expanded` and watch for warnings. Also: after testing navigation (pressing back), verify that streams and timers are no longer active by checking your mock objects.

**→ Try this:** Build a `LiveClock` widget that shows the current time (HH:MM:SS), updating every second. In `initState()`, start a `Timer.periodic`. In `dispose()`, cancel it. Then navigate away and back several times — verify in the console that old timers are cancelled and new ones start fresh each time.

---

## 8. The `mounted` Property — Your Async Safety Net

> 📄 **Flutter Docs (State.mounted):**
> *"Whether this State object is currently in a tree. After creating a State object and before calling initState, the framework 'mounts' the State object by associating it with a BuildContext. The State object remains mounted until the framework calls dispose, after which time it will never ask to build again."*

The problem: you start an async operation in `initState()`. The user navigates away (widget is disposed). The async operation finishes and tries to call `setState()` on a disposed widget.

```dart
// ❌ CRASH — setState() called on disposed widget
Future<void> _loadData() async {
  final data = await _repository.fetchData();  // takes 2 seconds
  // user navigated away at 1 second — widget is now disposed
  setState(() => _data = data);  // CRASH: setState called after dispose()
}

// ✓ SAFE — check mounted before using setState
Future<void> _loadData() async {
  final data = await _repository.fetchData();

  if (!mounted) return;  // widget was disposed while we were waiting — bail out

  setState(() => _data = data);
}
```

**Rule:** After **every** `await` that takes real time, add `if (!mounted) return;` before any `setState()` or `context` usage. This prevents the most common Flutter crash.

```dart
// Pattern to memorize:
Future<void> _anyAsyncMethod() async {
  try {
    final result = await someAsyncOperation();
    if (!mounted) return;           // ← always here, after every await
    setState(() => _result = result);
  } catch (e) {
    if (!mounted) return;           // ← and in catch blocks too
    setState(() => _error = e.toString());
  }
}
```

🧪 **Tester:** Simulate this race condition in tests using `tester.binding.delayed`:

```dart
testWidgets('does not crash when navigated away during load', (tester) async {
  await tester.pumpWidget(MaterialApp(home: DataScreen()));

  // Pop the screen immediately while data is loading
  await tester.tap(find.byType(BackButton));
  await tester.pumpAndSettle();

  // The async operation completing should not throw
  // If mounted check is missing, this test crashes
});
```

---

## 9. Complete Example — Every Method in One Widget

Here is a `StopwatchWidget` that uses every lifecycle method:

```dart
class StopwatchWidget extends StatefulWidget {
  final String label;
  final Color color;

  const StopwatchWidget({
    super.key,
    required this.label,
    required this.color,
  });

  @override
  State<StopwatchWidget> createState() => _StopwatchState();
}

class _StopwatchState extends State<StopwatchWidget>
    with SingleTickerProviderStateMixin {

  // ── State variables ────────────────────────────────────────────────
  int _milliseconds = 0;
  bool _isRunning = false;
  Timer? _timer;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  // ── initState: called ONCE ─────────────────────────────────────────
  @override
  void initState() {
    super.initState();   // ← always first

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  // ── didChangeDependencies: context is now safe ─────────────────────
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Could read MediaQuery.of(context) or Theme.of(context) here
    // if we needed them for initialization logic
  }

  // ── didUpdateWidget: parent gave us new config ─────────────────────
  @override
  void didUpdateWidget(StopwatchWidget oldWidget) {
    super.didUpdateWidget(oldWidget);   // ← always first

    if (oldWidget.color != widget.color) {
      // Color changed — we could update something color-dependent
      // In this case build() handles it automatically
    }
  }

  // ── build: pure, reads state only ─────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final seconds = _milliseconds ~/ 1000;
    final ms = (_milliseconds % 1000) ~/ 10;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          widget.label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        const SizedBox(height: 8),
        ScaleTransition(
          scale: _pulseAnimation,
          child: Text(
            '${seconds.toString().padLeft(2, '0')}:${ms.toString().padLeft(2, '0')}',
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  color: widget.color,
                  fontWeight: FontWeight.bold,
                  fontFeatures: [const FontFeature.tabularFigures()],
                ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton.icon(
              onPressed: _isRunning ? _pause : _start,
              icon: Icon(_isRunning ? Icons.pause : Icons.play_arrow),
              label: Text(_isRunning ? 'Pause' : 'Start'),
              style: ElevatedButton.styleFrom(backgroundColor: widget.color),
            ),
            const SizedBox(width: 12),
            OutlinedButton.icon(
              onPressed: _reset,
              icon: const Icon(Icons.restart_alt),
              label: const Text('Reset'),
            ),
          ],
        ),
      ],
    );
  }

  // ── deactivate: temporarily removed ───────────────────────────────
  @override
  void deactivate() {
    // Pause if temporarily removed (e.g. moved via GlobalKey)
    if (_isRunning) _pause();
    super.deactivate();
  }

  // ── dispose: permanently removed — release EVERYTHING ─────────────
  @override
  void dispose() {
    _timer?.cancel();             // ← cancel timer
    _pulseController.dispose();   // ← dispose animation controller
    super.dispose();              // ← always last
  }

  // ── Private methods (not lifecycle) ────────────────────────────────
  void _start() {
    _timer = Timer.periodic(const Duration(milliseconds: 10), (_) {
      if (!mounted) return;
      setState(() => _milliseconds += 10);
    });
    _pulseController.repeat(reverse: true);
    setState(() => _isRunning = true);
  }

  void _pause() {
    _timer?.cancel();
    _pulseController.stop();
    setState(() => _isRunning = false);
  }

  void _reset() {
    _timer?.cancel();
    _pulseController.stop();
    _pulseController.reset();
    setState(() {
      _milliseconds = 0;
      _isRunning = false;
    });
  }
}
```

---

## Lifecycle Method Comparison Table

| Method | When called | Called how many times | `super` call | Common use |
|--------|-------------|----------------------|-------------|------------|
| `createState()` | Widget first inserted | Once per insertion | N/A | Return `_YourState()` only |
| `initState()` | State created | Once | **First** | Init controllers, subscribe to streams |
| `didChangeDependencies()` | After initState + InheritedWidget changes | Multiple | First | Setup needing context, locale-dependent init |
| `build()` | After setState, parent rebuild, dependency change | Many | Never | Return widget tree — pure function only |
| `didUpdateWidget()` | Parent passes new widget config | On parent rebuild | **First** | React to changed props, reload data |
| `deactivate()` | Widget removed (possibly temporarily) | On removal | After | Pause work that may resume |
| `dispose()` | Widget permanently removed | Once | **Last** | Cancel timers, dispose controllers, cancel subs |

---

## 10. Keys — Widget Identity in the Element Tree

> 📄 **Flutter Docs:**
> *"Keys preserve the state of widgets when widgets move around in the widget tree. By default, Flutter matches old and new widgets in the element tree by their type and order. Keys let you control which old element a new widget is matched with."*

Keys are one of the most misunderstood concepts in Flutter. The bug they fix is subtle but common.

### The Problem Without Keys

```dart
// TodoList — user can reorder todos
class _TodoListState extends State<TodoList> {
  List<Todo> _todos = [
    Todo(id: 'a', text: 'Buy groceries'),
    Todo(id: 'b', text: 'Walk the dog'),
  ];

  void _removeFirst() => setState(() => _todos.removeAt(0));
}

// StatefulWidget for each todo — holds a checkbox state
class TodoTile extends StatefulWidget {
  final String text;
  const TodoTile({super.key, required this.text});

  @override
  State<TodoTile> createState() => _TodoTileState();
}

class _TodoTileState extends State<TodoTile> {
  bool _isChecked = false;  // Local state — this is the problem

  @override
  Widget build(BuildContext context) {
    return CheckboxListTile(
      title: Text(widget.text),
      value: _isChecked,
      onChanged: (v) => setState(() => _isChecked = v!),
    );
  }
}
```

User checks "Walk the dog" ✓ (2nd item). Then removes the first item. What happens?

```
Before:
  Element[0] → _TodoTileState { _isChecked: false }  → "Buy groceries"
  Element[1] → _TodoTileState { _isChecked: true  }  → "Walk the dog" ✓

After removeAt(0) — WITHOUT keys:
Flutter sees two widgets at positions [0] and [1].
Only position [0] remains.
Flutter REUSES Element[0] (same type TodoTile at position 0) for "Walk the dog".
Element[0] state: _isChecked = false ← BUG: checkbox lost!

Expected:
  Element for "Walk the dog" (which was checked) should show checked
Actual:
  "Walk the dog" shows unchecked — its state was stolen from the old position [0]
```

**The fix — use `ValueKey`:**

```dart
// With key, Flutter matches widgets by key, not by position
class _TodoListState extends State<TodoList> {
  Widget build(BuildContext context) {
    return ListView(
      children: _todos.map((todo) => TodoTile(
        key: ValueKey(todo.id),   // ← key: tells Flutter which Element belongs to which widget
        text: todo.text,
      )).toList(),
    );
  }
}
```

With `ValueKey('b')` on "Walk the dog":
```
After removeAt(0) — WITH keys:
Flutter sees ValueKey('b') in the new list.
Finds existing Element with key 'b' — _isChecked: true ✓
Reuses it. Checkmark preserved. Bug fixed.
```

**Rule:** Any time you have a list of `StatefulWidget` items that can be reordered, filtered, or removed — every item needs a `Key` with a unique ID.

---

### Key Types

```dart
// ValueKey<T> — most common. Uses any value that can be compared with ==
ListView(children: items.map((i) => ItemWidget(key: ValueKey(i.id), item: i)).toList())
ListView(children: items.map((i) => ItemWidget(key: ValueKey(i), item: i)).toList())

// ObjectKey — uses object identity (===), not value equality
// Use when the object doesn't have a stable ID field
ItemWidget(key: ObjectKey(item))

// UniqueKey — generates a new unique key every build
// CAREFUL: using UniqueKey on a StatefulWidget in a list defeats the purpose
// Use it intentionally to FORCE a widget to recreate when you rebuild the parent:
AnimatedSwitcher(
  duration: 300.ms,
  child: _isLoading
      ? const CircularProgressIndicator(key: ValueKey('loading'))
      : Image.network(url, key: ValueKey(url)),
      // When url changes, new key → new widget → AnimatedSwitcher fires
)

// GlobalKey — gives direct access to a widget's State from ANYWHERE in the tree
// Use for: Form validation, scaffold state, custom scroll control
final _formKey = GlobalKey<FormState>();
_formKey.currentState?.validate();
_formKey.currentState?.save();

// Accessing Scaffold methods via GlobalKey (rare but valid)
final _scaffoldKey = GlobalKey<ScaffoldState>();
Scaffold(key: _scaffoldKey, body: /* ... */);
_scaffoldKey.currentState?.openDrawer();
```

### `ValueKey` in `AnimatedSwitcher`

```dart
// AnimatedSwitcher REQUIRES keys — without them it can't tell if the child changed
AnimatedSwitcher(
  duration: const Duration(milliseconds: 300),
  // WRONG — no keys, AnimatedSwitcher sees same type (Icon), doesn't animate
  child: _isFavorite ? const Icon(Icons.favorite) : const Icon(Icons.favorite_border),
)

// CORRECT — keys tell AnimatedSwitcher "these are different widgets"
AnimatedSwitcher(
  duration: const Duration(milliseconds: 300),
  child: _isFavorite
      ? const Icon(Icons.favorite, key: ValueKey('filled'), color: Colors.red)
      : const Icon(Icons.favorite_border, key: ValueKey('outline')),
)
```

---

## 11. `AutomaticKeepAliveClientMixin` — Preserve Tab State

> 📄 **Flutter Docs:**
> *"A mixin with convenience methods for clients of AutomaticKeepAlive. Used in conjunction with AutomaticKeepAlive for widgets inside a PageView or similar to keep their subtree alive."*

By default, `TabBarView` and `PageView` destroy tabs you're not looking at to save memory. When you return to a tab, it rebuilds from scratch — losing scroll position and loaded data.

```dart
class ExpensesTab extends StatefulWidget {
  const ExpensesTab({super.key});

  @override
  State<ExpensesTab> createState() => _ExpensesTabState();
}

// Mixin: adds wantKeepAlive getter and must call super.build(context)
class _ExpensesTabState extends State<ExpensesTab>
    with AutomaticKeepAliveClientMixin {

  List<Expense> _expenses = [];
  bool _isLoaded = false;

  @override
  bool get wantKeepAlive => true;   // ← tell Flutter: keep this tab alive

  @override
  void initState() {
    super.initState();
    _loadExpenses();
  }

  Future<void> _loadExpenses() async {
    final expenses = await expenseRepository.getAll();
    if (!mounted) return;
    setState(() {
      _expenses = expenses;
      _isLoaded = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);  // ← REQUIRED when using AutomaticKeepAliveClientMixin
    if (!_isLoaded) return const LoadingView();
    return ListView.builder(
      itemCount: _expenses.length,
      itemBuilder: (_, i) => ExpenseTile(expense: _expenses[i]),
    );
  }
}
```

**Rule:** `wantKeepAlive: true` + `super.build(context)` — both required, both easy to forget. Without `super.build(context)` the mixin silently doesn't work.

---

## 12. `TickerProviderStateMixin` vs `SingleTickerProviderStateMixin`

```dart
// SingleTickerProviderStateMixin — when you have ONE AnimationController
class _MyWidgetState extends State<MyWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  // One vsync, one controller. Compiler error if you try to create two.
}

// TickerProviderStateMixin — when you need MULTIPLE AnimationControllers
class _MyWidgetState extends State<MyWidget>
    with TickerProviderStateMixin {
  late final AnimationController _fadeCtrl;
  late final AnimationController _slideCtrl;
  late final AnimationController _scaleCtrl;
  // All three use the same vsync (this) — perfectly valid.
}

// TabController also needs a vsync (TickerProvider)
// Use TickerProviderStateMixin when your widget has BOTH a TabController
// AND animation controllers
class _ProfileState extends State<ProfileScreen>
    with TickerProviderStateMixin {
  late final TabController _tabCtrl;
  late final AnimationController _animCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _animCtrl = AnimationController(vsync: this, duration: 300.ms);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _animCtrl.dispose();
    super.dispose();
  }
}
```

**Rule:** Start with `SingleTickerProviderStateMixin`. Switch to `TickerProviderStateMixin` only when you have 2+ controllers. Using `TickerProviderStateMixin` with one controller is wasteful — it allocates a ticker pool.

---

## Lab — Music Player Screen

Build a music player screen that uses every lifecycle method meaningfully:

**Widget:** `MusicPlayerScreen(Song song)` — a `StatefulWidget`

**Visual layout:**
```
┌─────────────────────────────────────┐
│                                     │
│         [Album Art — 280px]         │   AspectRatio 1:1, rounded corners
│                                     │
│  Song Title                         │   titleLarge
│  Artist Name                        │   bodyMedium, grey
│                                     │
│  ────────────────────────────       │   LinearProgressIndicator
│  0:42                      3:21     │   current time / total time
│                                     │
│   ⏮    ⏪    ▶/⏸    ⏩    ⏭       │   Row of IconButtons
│                                     │
│  ♡ Like      ↗ Share    ⋯ More    │   Row of TextButtons
└─────────────────────────────────────┘
```

**Lifecycle requirements:**
- `initState()` → start a `Timer.periodic` that increments `_currentSeconds` every second while `_isPlaying` is true
- `didUpdateWidget()` → if `widget.song` changes (parent selects a different song), reset `_currentSeconds` to 0
- `build()` → render progress as `_currentSeconds / widget.song.durationSeconds` — pure, no side effects
- `dispose()` → cancel the timer
- `mounted` guard → in the timer callback, check `if (!mounted) return`

**States to handle:**
- Playing vs paused (timer running vs stopped)
- Progress reaches 100% → auto-stop, reset to beginning
- Like toggle (local state, `_isLiked`)

---

## Challenge

Add a **sleep timer** to the music player:

- A button "Sleep in 15 min" starts a second timer
- A countdown shows in the corner: "Stopping in 14:32"
- When it reaches 0, music auto-pauses
- User can cancel the sleep timer

This requires managing two independent timers in the same State — the playback timer and the sleep timer. Both must be properly cancelled in `dispose()`. This is a common real-world pattern.

---

## Week 3 Verify — Answer Without Looking

1. `initState()` wants to call `Theme.of(context)`. Is this safe? What should you use instead and why?
2. You fetch data in `initState()` using an async function. The user navigates away before it completes. What crash will you get if you don't check `mounted`, and why?
3. The parent widget rebuilds and passes a different `videoUrl` to your `VideoPlayer`. Your `State` object is NOT recreated. Which lifecycle method tells you about the URL change?
4. You have an `AnimationController` created in `initState()`. Where must you dispose it and why?
5. `build()` is called many times per second. Why is starting a network call inside `build()` catastrophic?
6. What is the difference between `deactivate()` and `dispose()`?
7. `super.initState()` goes first, `super.dispose()` goes last — why are these rules the opposite of each other?

---

**Next → [Week 4: Layout & Constraints — How Flutter Decides Where Everything Goes](Week_04_Layout_and_Constraints.md)**
