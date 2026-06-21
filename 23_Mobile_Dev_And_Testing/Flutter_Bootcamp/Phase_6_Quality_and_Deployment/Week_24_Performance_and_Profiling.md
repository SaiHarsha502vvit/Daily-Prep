# Week 24 — Performance and Profiling
### DevTools, unnecessary rebuilds, const optimization — making your app feel instant

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — how the Flutter rendering pipeline works, what causes jank, what to fix
> - 🎨 **Designer** — 60fps is a design requirement; every dropped frame is a failed interaction
> - 🧪 **Tester** — performance benchmarking, automated frame time tests

---

## Why This Week Matters

> 📄 **Flutter Docs:**
> *"Flutter renders at 60 frames per second (or 120fps on ProMotion displays). Each frame has 16ms to build, layout, and paint. Anything longer drops a frame — the user perceives this as jank."*

```
1 second = 60 frames
1 frame = 16.67ms budget

Your app's frame time budget breakdown:
  Build (Dart)   ≤ 1ms
  Layout         ≤ 5ms
  Paint          ≤ 5ms
  GPU raster     ≤ 5ms
  ─────────────────────
  Total          ≤ 16ms

If any step exceeds its budget → dropped frame → jank
```

Performance is not an optimization you do at the end. Patterns you learn this week prevent problems before they happen.

---

## 1. Flutter DevTools — Your Profiling Toolkit

```bash
# Start DevTools (works in debug and profile mode)
flutter run --profile    # ALWAYS profile in profile mode, not debug
# Then open the URL printed in terminal, e.g., http://localhost:9100
```

**DevTools tabs you'll use most:**

**Widget Inspector:** Shows the live widget tree. The "Toggle Select Mode" button lets you tap any pixel on the device and jump to the widget responsible. Use this to debug unexpected padding, find which widget owns a tap area.

**Performance tab:** Frame timeline. Each bar = one frame. Blue = build, orange = raster. Bars crossing the red line (16ms) = dropped frames. Click any tall bar to see which widget caused it.

**CPU Profiler tab:** Shows what code ran during a recording session. Flame chart at the top, call tree at the bottom. Useful for finding which method is eating CPU.

**Memory tab:** Shows object allocation over time. If memory grows without leveling off = memory leak. Common in Flutter: `AnimationController` not disposed, `StreamSubscription` not cancelled, `TextEditingController` not disposed.

---

## 2. The Rebuild Problem

```dart
// BAD — every time _count changes, the ENTIRE widget rebuilds
// including the title bar which doesn't need to change

class BadCounter extends StatefulWidget {
  @override
  State<BadCounter> createState() => _BadCounterState();
}

class _BadCounterState extends State<BadCounter> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // This rebuilds on every _count change even though it never changes
      appBar: AppBar(title: const Text('Counter App')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // This also rebuilds even though it never changes
            const Text('Current count:'),
            // Only this actually changes
            Text('$_count', style: Theme.of(context).textTheme.displayMedium),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _count++),
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

```dart
// GOOD — extract the changing part to minimize rebuild scope

class GoodCounter extends StatefulWidget {
  @override
  State<GoodCounter> createState() => _GoodCounterState();
}

class _GoodCounterState extends State<GoodCounter> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Counter App')),  // never rebuilds
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Current count:'),               // never rebuilds
            _CountDisplay(count: _count),                // only this rebuilds
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _count++),
        child: const Icon(Icons.add),
      ),
    );
  }
}

// Extracted widget — only rebuilds when count changes
class _CountDisplay extends StatelessWidget {
  final int count;
  const _CountDisplay({required this.count});

  @override
  Widget build(BuildContext context) {
    return Text('$count', style: Theme.of(context).textTheme.displayMedium);
  }
}
```

**Rule:** `setState()` rebuilds the widget that called it AND every widget inside its `build()` method. Extract frequently-changing parts into separate StatelessWidgets.

---

## 3. `const` Constructors — Zero-Rebuild Widgets

```dart
// Without const — Flutter creates a NEW widget object every build
// Widget diffing still works, but object allocation is wasted

Widget build(BuildContext context) {
  return Column(
    children: [
      Text('Hello'),                    // new object every rebuild
      Icon(Icons.star),                 // new object every rebuild
      SizedBox(height: 16),             // new object every rebuild
    ],
  );
}

// WITH const — Flutter reuses the same object
// The widget tree diff algorithm short-circuits: "same object? skip rebuild"

Widget build(BuildContext context) {
  return const Column(
    children: [
      Text('Hello'),                    // const: built once, reused forever
      Icon(Icons.star),                 // const: built once, reused forever
      SizedBox(height: 16),             // const: built once, reused forever
    ],
  );
}
```

```dart
// Rule: mark anything that doesn't depend on runtime data as const
// Flutter's linter (prefer_const_constructors) will tell you when you can

// In lists — const for static items
children: [
  const Padding(padding: EdgeInsets.all(8), child: Text('Label')),
  Text(dynamicValue),    // can't be const — depends on runtime value
  const SizedBox(height: 8),
]

// Always const for your own static widgets
class MyStaticBanner extends StatelessWidget {
  const MyStaticBanner({super.key});  // const constructor
  // ...
}

// Use it with const
const MyStaticBanner()   // Flutter reuses the instance
```

Enable linting in `analysis_options.yaml`:
```yaml
linter:
  rules:
    prefer_const_constructors: true
    prefer_const_literals_to_create_immutables: true
    prefer_const_declarations: true
```

---

## 4. `BlocSelector` and `context.select` — Fine-Grained Rebuild Control

```dart
// With context.watch — rebuilds on ANY state change
class CartIconBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final state = context.watch<CartBloc>().state;  // rebuilds when anything in CartState changes
    final count = state is CartLoaded ? state.items.length : 0;
    return Badge(label: Text('$count'), child: const Icon(Icons.shopping_cart));
  }
}

// With BlocSelector — rebuilds ONLY when cart item count changes
class CartIconBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocSelector<CartBloc, CartState, int>(
      selector: (state) => state is CartLoaded ? state.items.length : 0,
      builder: (context, count) {
        // This widget ONLY rebuilds when the count integer changes
        // Not when cart items' details change, not when loading state changes
        return Badge(label: Text('$count'), child: const Icon(Icons.shopping_cart));
      },
    );
  }
}

// With Riverpod context.select — same concept
class CartIconBadge extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Only rebuilds when cart.length changes
    final count = ref.watch(cartProvider.select((items) => items.length));
    return Badge(label: Text('$count'), child: const Icon(Icons.shopping_cart));
  }
}
```

🎨 **Designer:** Every unnecessary rebuild shows up as a stuttering animation. A cart icon that rebuilds every time a product image loads (because they share the same provider) will make the icon flash or jitter. `BlocSelector` / `context.select` is how you prevent this.

---

## 5. `RepaintBoundary` — Isolate Expensive Painters

```dart
// Without RepaintBoundary:
// When the expense list scrolls, Flutter checks if EVERY widget needs repainting
// Your CustomPainter donut chart gets re-rasterized on every scroll frame

// With RepaintBoundary:
// The donut chart is on its own layer
// Scrolling doesn't touch it — the GPU composites the layers without re-rasterizing

RepaintBoundary(
  child: ExpenseDonutChart(breakdown: breakdown),
)

// Also useful for animated widgets that update independently
RepaintBoundary(
  child: AnimatedBuilder(
    animation: _pulseController,
    builder: (context, _) => PulsingDot(animValue: _pulseController.value),
  ),
)
```

**Rule:** Add `RepaintBoundary` when:
- A widget contains a `CustomPainter` and other widgets scroll around it
- An independently-animating widget is inside a scrolling list
- A complex widget is rendered many times (use it in `ListView.builder` items)

---

## 6. `ListView.builder` — Never Build Off-Screen Items

```dart
// BAD — builds ALL 10,000 items at once, even off-screen
ListView(
  children: expenses.map((e) => ExpenseTile(expense: e)).toList(),
)

// GOOD — only builds the items visible + a small buffer
ListView.builder(
  itemCount: expenses.length,
  itemBuilder: (context, index) => ExpenseTile(expense: expenses[index]),
)

// With addRepaintBoundaries: true (default) — each item is already in a RepaintBoundary
// You rarely need to add RepaintBoundary manually inside ListView.builder
ListView.builder(
  itemCount: expenses.length,
  addRepaintBoundaries: true,     // true by default
  itemBuilder: (context, index) => ExpenseTile(expense: expenses[index]),
)

// itemExtent optimization — when items have a known fixed height
// Flutter can calculate scroll position without building items
ListView.builder(
  itemCount: expenses.length,
  itemExtent: 72,     // each ExpenseTile is exactly 72px tall
  itemBuilder: (context, index) => ExpenseTile(expense: expenses[index]),
)
```

---

## 7. Image Caching and Optimization

```dart
// Always use cached_network_image for remote images
// Never Image.network() in production

import 'package:cached_network_image/cached_network_image.dart';

CachedNetworkImage(
  imageUrl: product.imageUrl,
  placeholder: (context, url) => const ShimmerBox(width: double.infinity, height: 200),
  errorWidget: (context, url, error) => const Icon(Icons.broken_image),
  // Cache for 7 days
  cacheManager: CacheManager(
    Config('customImages', stalePeriod: const Duration(days: 7)),
  ),
  // Resize on the GPU — don't decode a 4K image to display it at 200x200
  memCacheWidth: 400,   // 2x for high DPI displays
  memCacheHeight: 400,
)

// For local assets — specify explicit dimensions to avoid layout recalc
Image.asset(
  'assets/images/header.jpg',
  width: MediaQuery.of(context).size.width,  // explicit width
  height: 200,
  fit: BoxFit.cover,
  // cacheWidth forces the decoder to downscale on load
  cacheWidth: (MediaQuery.of(context).size.width * MediaQuery.of(context).devicePixelRatio).round(),
)
```

---

## 8. Identifying Rebuilds — The `debugPrint` Method

```dart
// Add this to any widget's build method during debugging
@override
Widget build(BuildContext context) {
  debugPrint('${widget.runtimeType} rebuilt');  // remove before PR
  return /* ... */;
}

// Or use Flutter's built-in rebuild counter
// In DevTools → Performance → "Show Repaint Rainbow"
// Widgets that are repainting will flash in different colors
// Solid color = stable; rapidly changing color = frequent repainting
```

---

## 9. Async Operations — Don't Block the UI Thread

```dart
// BAD — parsing a large JSON list on the UI thread
// This blocks the main isolate → dropped frames → jank
List<Expense> parseExpenses(List<Map<String, dynamic>> jsonList) {
  return jsonList.map(ExpenseModel.fromJson).toList();  // can take 200ms for 10,000 items
}

// GOOD — move heavy work to a separate isolate using compute()
Future<List<ExpenseModel>> parseExpensesInBackground(List<Map<String, dynamic>> jsonList) {
  return compute(_parseExpenses, jsonList);  // runs on a background isolate
}

// Top-level or static function (required by compute)
List<ExpenseModel> _parseExpenses(List<Map<String, dynamic>> jsonList) {
  return jsonList.map(ExpenseModel.fromJson).toList();
}

// Use in your datasource
@override
Future<List<ExpenseModel>> getExpenses() async {
  final response = await dio.get('/expenses');
  final jsonList = (response.data as List).cast<Map<String, dynamic>>();
  return compute(_parseExpenses, jsonList);   // non-blocking
}
```

---

## 10. Memory Leak Prevention Checklist

```dart
class LeakyWidget extends State<MyWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late StreamSubscription _subscription;
  late TextEditingController _textCtrl;
  late ScrollController _scrollCtrl;
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: 300.ms);
    _subscription = someStream.listen(_onData);
    _textCtrl = TextEditingController();
    _scrollCtrl = ScrollController();
    _focusNode = FocusNode();
  }

  @override
  void dispose() {
    // EVERY controller/subscription/node must be disposed
    _controller.dispose();
    _subscription.cancel();
    _textCtrl.dispose();
    _scrollCtrl.dispose();
    _focusNode.dispose();
    super.dispose();
  }
}
```

**Rule:** For every `addListener` there must be a `removeListener`. For every `subscribe` there must be a `cancel`. For every `Controller` there must be a `dispose`. The Memory tab in DevTools will show growing object counts if you miss these.

### How to Read the DevTools Memory Tab

```
Memory Tab Workflow — finding a real leak in 5 steps:

1. Open DevTools → Memory tab
2. Click "GC" (garbage collect) to baseline — removes temporary allocations
3. Reproduce the suspected leak: navigate to screen → navigate back → repeat 5×
4. Click "GC" again
5. Click "Snapshot" — this captures all live objects in the Dart heap

Reading the snapshot:
┌────────────────────────────────────────────────────────┐
│ Class              │ Instances │ Shallow Size │ % Total │
├────────────────────┼───────────┼──────────────┼─────────┤
│ AnimationController│     47    │    12 KB     │   0.3%  │ ← 47 instances AFTER 5 nav cycles
│ StreamSubscription │     12    │     3 KB     │   0.1%  │ ← 12 when there should be 1
│ TextEditingController│   23   │     6 KB     │   0.2%  │ ← growing count = leak
└────────────────────────────────────────────────────────┘

Expected: 1 controller per screen visit, destroyed on pop → count stays ~1-2
Actual:   count grows with each navigation cycle = not being disposed
```

```dart
// The "Track Allocations" workflow — for pinpointing WHERE a leak originates

// Step 1: In DevTools Memory tab, click "Track" next to the suspicious class
// Step 2: Reproduce the navigation
// Step 3: DevTools shows the stack trace for each allocation of that class
//         → it will point to the exact initState() line creating the controller
//         → if dispose() was called, that instance wouldn't be in the live set

// Common leak signatures in the snapshot:
//
// AnimationController count grows → not disposed in dispose()
// _StreamSubscription count grows → .cancel() never called  
// Image cache growing → using Image.network without cache bounds
// OverlayEntry count grows → OverlayEntry.remove() not called

// Quick check — add this to any suspect screen:
@override
void dispose() {
  debugPrint('${widget.runtimeType} disposed — if you see this, lifecycle is correct');
  _controller.dispose();
  super.dispose();
}
// If "disposed" never prints on navigation back → dispose() isn't firing
// (usually means the widget is referenced somewhere keeping it alive)
```

```dart
// The Memory timeline view — detecting leaks over time
//
// X-axis: time  Y-axis: heap size in MB
//
// Healthy:    ╭──╮    ╭──╮    ╭──╮     (sawtooth — GC cleans up each time)
//            ╯    ╰──╯    ╰──╯    ╰──
//
// Leaking:   ╭──╮╭───╮╭────╮╭─────╮   (staircase — heap never fully returns to baseline)
//            ╯   ╯     ╯     ╯
//
// If your app shows the staircase pattern → something is not being released.
// Run GC manually, then Snapshot, then look for growing class instance counts.
```

🧪 **Tester:** Write a leak-detection test using `flutter_test`'s `LeakTesting` (Flutter 3.18+):
```dart
testWidgets('ExpenseScreen disposes all controllers', (tester) async {
  await tester.pumpWidget(const MaterialApp(home: ExpenseScreen()));
  await tester.pumpAndSettle();

  // Navigate away — dispose() should fire
  await tester.tap(find.byType(BackButton));
  await tester.pumpAndSettle();

  // LeakTesting will throw if any tracked objects weren't GC'd
  // Add to flutter_test_config.dart: LeakTesting.settings = ...
});
```

---

## 11. Build Modes — Debug vs Profile vs Release

```bash
# Three build modes — each has a different purpose

flutter run                  # debug mode (default)
flutter run --profile        # profile mode
flutter run --release        # release mode
flutter build appbundle      # always builds in release mode
```

**Debug mode:**
- Includes debugging tools (DevTools connection, hot reload/restart)
- JIT (Just-In-Time) compilation — code compiled on-device at runtime
- Slower than release by ~2-10x — NEVER benchmark in debug
- `assert()` statements are active
- Observatory and DevTools connectivity enabled
- Shows flutter debug banner

**Profile mode:**
- AOT (Ahead-Of-Time) compiled — same as release
- DevTools connectivity enabled for profiling
- `assert()` statements disabled
- Nearly identical performance to release
- **This is the mode to profile in** — debug is artificially slow

**Release mode:**
- AOT compiled, fully optimized
- No debugging tools, no DevTools connection
- `assert()` disabled
- Tree-shaking: removes unused code
- Obfuscation available (`--obfuscate --split-debug-info`)
- Smallest, fastest binary

```dart
// assert() only runs in debug mode — free to use for invariant checking
assert(amount > 0, 'Amount must be positive');
// In release: line above is removed by the compiler — zero cost

// kDebugMode / kReleaseMode / kProfileMode — Dart constants
if (kDebugMode) {
  debugPrint('Cart state: $state');  // logging only in debug
}

// Conditional DI registration
sl.registerLazySingleton<Logger>(() =>
  kDebugMode ? ConsoleLogger() : AnalyticsLogger()
);
```

---

## 12. Impeller — Flutter's New Rendering Engine

> 📄 **Flutter Docs:**
> *"Impeller is Flutter's new rendering engine, which enables better rendering performance by precompiling shaders at build time rather than at runtime."*

**The shader jank problem:** OpenGL compiles GPU shader programs at runtime — the first time Flutter draws something (a shadow, a blur, a gradient), it compiles the shader. This causes a 1-3 frame hitch. On a 60fps screen, that's visible.

**Impeller's solution:** Precompiles ALL shaders during the Flutter build. No runtime compilation = no jank.

```bash
# Impeller is enabled by default on iOS (Flutter 3.10+)
# Enable on Android (Flutter 3.16+ — still in preview):
# In AndroidManifest.xml:
<meta-data
    android:name="io.flutter.embedding.android.EnableImpeller"
    android:value="true" />

# Disable on iOS (if a specific plugin has issues):
# In Info.plist:
<key>FLTEnableImpeller</key>
<false/>
```

**Impact for developers:**
- Animations that used to stutter on first render are now smooth
- `BackdropFilter` (blur) performance improved dramatically
- `CustomPainter` operations are faster
- Some older third-party rendering (e.g., PDF viewers using platform views) need testing

**Rule:** Keep Impeller enabled on iOS (it's the default). Test on Android if you enable it there — it's still being stabilized.

---

## Performance Checklist Before Shipping

```
Build phase:
  [ ] All static widgets use const constructors
  [ ] No business logic inside build() methods
  [ ] ListView.builder for any list with >20 items
  [ ] itemExtent set when item height is fixed

BLoC / State:
  [ ] BlocSelector used for widgets that only need a subset of state
  [ ] No context.watch in deep widget trees that should be stable

Paint phase:
  [ ] RepaintBoundary around all CustomPainters
  [ ] RepaintBoundary inside ListView items that animate independently

Images:
  [ ] CachedNetworkImage everywhere (never Image.network)
  [ ] memCacheWidth/Height set appropriately

Memory:
  [ ] Every AnimationController disposed in dispose()
  [ ] Every StreamSubscription cancelled in dispose()
  [ ] No closures capturing BuildContext across async gaps without mounted check

Async:
  [ ] JSON parsing >1000 items moved to compute()
  [ ] No heavy computation inside build() or setState()
```

---

## 13. Application Performance Monitoring (APM) — Production Observability

> 🏢 **Enterprise Reality:**
> *"DevTools only works when you're connected to a running app. In production, you need remote performance monitoring — dashboards showing p50/p95 frame times, API latency, crash rates, and slow screens across all users."*

### Firebase Performance Monitoring

```dart
// Automatic traces — zero-code network monitoring
// Add the plugin and every HTTP request is auto-traced
// pubspec.yaml: firebase_performance: ^0.10.0

// Custom traces — measure specific business operations
Future<void> loadDashboard() async {
  final trace = FirebasePerformance.instance.newTrace('dashboard_load');
  trace.putAttribute('user_tier', isPremium ? 'premium' : 'free');
  await trace.start();

  try {
    await Future.wait([
      _getExpenses(),
      _getMonthlySummary(),
      _getSpendingTrend(),
    ]);
    trace.putMetric('expense_count', expenses.length);
    trace.putAttribute('status', 'success');
  } catch (e) {
    trace.putAttribute('status', 'error');
    trace.putAttribute('error_type', e.runtimeType.toString());
  } finally {
    await trace.stop();
  }
}
```

### Sentry — Error Tracking + Performance

```dart
// lib/main.dart — Sentry initialization
Future<void> main() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = const String.fromEnvironment('SENTRY_DSN');
      options.tracesSampleRate = 0.2;   // sample 20% of transactions
      options.profilesSampleRate = 0.1;  // profile 10% of sampled transactions
      options.environment = const String.fromEnvironment('ENV', defaultValue: 'dev');
      options.release = '2.1.0+142';

      // Automatic breadcrumbs — trail of events before a crash
      options.enableAutoNativeBreadcrumbs = true;
      options.enableUserInteractionBreadcrumbs = true;
    },
    appRunner: () => runApp(
      SentryNavigatorObserver(),  // auto-track screen transitions
      const ProviderScope(child: App()),
    ),
  );
}

// Custom breadcrumbs — leave a trail for crash investigation
Sentry.addBreadcrumb(Breadcrumb(
  message: 'User applied filter',
  category: 'ui.action',
  data: {'filter': 'food', 'date_range': '30d'},
));

// Capture handled exceptions with context
try {
  await paymentService.charge(amount);
} catch (e, stack) {
  Sentry.captureException(
    e,
    stackTrace: stack,
    withScope: (scope) {
      scope.setTag('payment_provider', 'stripe');
      scope.setExtra('amount', amount);
      scope.setExtra('currency', 'INR');
      scope.setUser(SentryUser(id: userId));
    },
  );
}
```

### Performance Budgets — Automated Alerts

```dart
// Custom performance monitoring mixin
mixin PerformanceTracking<T extends StatefulWidget> on State<T> {
  Stopwatch? _buildStopwatch;

  @override
  Widget build(BuildContext context) {
    _buildStopwatch = Stopwatch()..start();
    final widget = buildTracked(context);
    _buildStopwatch!.stop();

    final buildTime = _buildStopwatch!.elapsedMilliseconds;
    if (buildTime > 16) {  // exceeded one frame budget
      logger.w('Slow build: ${T.runtimeType} took ${buildTime}ms');
      Sentry.addBreadcrumb(Breadcrumb(
        message: 'Slow build: ${buildTime}ms',
        category: 'performance',
        data: {'widget': T.toString()},
        level: SentryLevel.warning,
      ));
    }

    return widget;
  }

  Widget buildTracked(BuildContext context);
}
```

**Enterprise performance targets:**
```
Metric                          Target        Alert if exceeded
─────────────────────────────────────────────────────────────
App startup (cold)              < 2s          > 4s
App startup (warm)              < 500ms       > 1s
Screen transition               < 300ms       > 600ms
API response (p95)              < 1s          > 3s
Frame build time (p99)          < 16ms        > 32ms
Crash-free rate                 > 99.5%       < 99%
ANR (App Not Responding)        < 0.1%        > 0.5%
```

---

## 14. Background Processing — Work That Outlives the UI

> 📄 **Flutter Docs:**
> *"When the user switches away from your app, or when the device screen turns off, the operating system may suspend your app at any time. Work that needs to continue — syncing data, processing uploads, handling notifications — requires explicit background execution."*

Your app doesn't own the CPU. The operating system does. When the user presses Home, your app enters the background, and the OS can freeze, throttle, or kill it at any moment. If your expense tracker is mid-sync, that upload dies silently. Background processing is how you tell the OS: "This work matters — keep it alive."

---

### App Lifecycle States

Before you run work in the background, you need to detect when your app enters and leaves the foreground:

```dart
class AppLifecycleWatcher extends StatefulWidget {
  final Widget child;
  const AppLifecycleWatcher({super.key, required this.child});

  @override
  State<AppLifecycleWatcher> createState() => _AppLifecycleWatcherState();
}

class _AppLifecycleWatcherState extends State<AppLifecycleWatcher>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        // App is in the foreground, fully visible
        // → Reconnect WebSocket, refresh data
        break;
      case AppLifecycleState.inactive:
        // App is still visible but not receiving input
        // (e.g., incoming phone call overlay, split-screen transition)
        // → Pause animations, pause video
        break;
      case AppLifecycleState.paused:
        // App is in the background, not visible
        // → Save draft, flush analytics, cancel expensive timers
        break;
      case AppLifecycleState.detached:
        // App is still running but has no view
        // (rare — mainly during engine restart or before first frame)
        break;
      case AppLifecycleState.hidden:
        // App is hidden (iOS: entered background; Android: in recent apps tray)
        // → Release camera, pause audio
        break;
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
```

**The critical distinction:** `paused` means the OS *may* kill your app at any time. Any work that must survive should already be persisted or handed off to a background mechanism.

---

### Background Isolates — CPU-Heavy Work Off the UI Thread

Flutter's UI runs on a single thread. If you parse a 2MB JSON response, sort 50,000 records, or encrypt a file on the main thread, the UI freezes — dropped frames, ANR dialogs, angry users.

```dart
// Dart 3 — simple, clean
Future<List<Expense>> parseExpenses(String jsonString) async {
  return await Isolate.run(() {
    final List<dynamic> decoded = jsonDecode(jsonString);
    return decoded.map((e) => Expense.fromJson(e)).toList();
  });
}
```

**When to use `Isolate.run`:**
- JSON parsing of payloads > 100KB
- Image resizing or compression
- Encryption/decryption
- CSV/Excel file generation
- Any computation > 16ms (one frame budget)

**Critical limitation:** Isolates can't access Flutter plugins. No `SharedPreferences`, no `Dio`, no `FirebaseFirestore` inside an isolate. They only have access to pure Dart code. If you need to read from Hive and process the data, read it on the main thread, send the data to the isolate for processing, and get the result back.

```dart
// This WILL crash inside Isolate.run:
// final prefs = await SharedPreferences.getInstance();  ← PluginNotRegistered

// Do this instead:
final prefs = await SharedPreferences.getInstance();
final rawData = prefs.getString('cached_expenses') ?? '[]';
final processed = await Isolate.run(() => heavyProcessing(rawData));
```

---

### `workmanager` Package — Deferred and Periodic Background Tasks

For work that must happen even if the app is killed — syncing pending changes, cleaning old cache, uploading queued analytics — use `workmanager`. It wraps Android's `WorkManager` and iOS's `BGTaskScheduler`.

**Setup:**

```yaml
# pubspec.yaml
dependencies:
  workmanager: ^0.5.2
```

```dart
// main.dart — register the callback dispatcher OUTSIDE any class
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    switch (taskName) {
      case 'syncPendingExpenses':
        await _syncExpenses(inputData);
        return true; // success
      case 'cleanOldCache':
        await _deleteOldCacheFiles();
        return true;
      default:
        return false; // task not recognized
    }
  });
}

// The callback MUST be a top-level or static function.
// It runs in its own isolate — no access to your app's state, providers, or BLoCs.

Future<void> _syncExpenses(Map<String, dynamic>? inputData) async {
  // Initialize what you need from scratch
  final dio = Dio(BaseOptions(baseUrl: 'https://api.myapp.com'));
  final localDb = await Hive.openBox('pending_expenses');

  final pending = localDb.values.toList();
  for (final expense in pending) {
    await dio.post('/expenses', data: expense);
    await localDb.delete(expense['id']);
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Workmanager().initialize(callbackDispatcher, isInDebugMode: kDebugMode);

  runApp(const MyApp());
}
```

**Scheduling tasks:**

```dart
// One-off task — runs once, as soon as constraints are met
await Workmanager().registerOneOffTask(
  'sync-expenses-1',         // unique task name
  'syncPendingExpenses',     // matches switch case in callbackDispatcher
  constraints: Constraints(
    networkType: NetworkType.connected,     // only when online
    requiresBatteryNotLow: true,           // don't drain a dying battery
  ),
  inputData: {'userId': currentUser.id},   // passed to the callback
  backoffPolicy: BackoffPolicy.exponential,
  initialDelay: const Duration(seconds: 10),
);

// Periodic task — runs repeatedly
await Workmanager().registerPeriodicTask(
  'cache-cleanup',
  'cleanOldCache',
  frequency: const Duration(hours: 12),    // minimum ~15 min on Android
  constraints: Constraints(
    requiresBatteryNotLow: true,
    requiresCharging: false,
  ),
);
```

**Rule:** The callback dispatcher runs in a completely fresh isolate with no connection to your running app. You must re-initialize everything — database connections, HTTP clients, service locators. Think of it as a separate mini-app that wakes up, does one job, and dies.

---

### FCM `onBackgroundMessage` — Notifications When the App Is Dead

Week 26's Chat App uses FCM. When a message arrives and your app is killed, `onBackgroundMessage` handles it:

```dart
// MUST be a top-level function — same constraint as workmanager
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();

  // You can update local storage (e.g., increment unread badge count)
  final prefs = await SharedPreferences.getInstance();
  final current = prefs.getInt('unread_count') ?? 0;
  await prefs.setInt('unread_count', current + 1);

  // DON'T try to update UI, navigate, or access providers here.
  // The app may not even have a Flutter engine running.
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  runApp(const MyApp());
}
```

**Limitations of background message handlers:**
- No access to `BuildContext`, `Navigator`, providers, or BLoCs
- Must complete quickly (Android kills it after ~30 seconds)
- Cannot show custom UI — only platform notifications via `flutter_local_notifications`
- On iOS, if the handler takes too long, the OS will deprioritize your app's future notifications

---

### iOS vs Android — The Platform Gap

Background processing is where Android and iOS diverge the most. You must understand both:

| Capability | Android (WorkManager) | iOS (BGTaskScheduler) |
|---|---|---|
| Minimum periodic interval | ~15 minutes | ~15 minutes (but OS decides when) |
| Max background execution time | 10 minutes | 30 seconds (`BGAppRefreshTask`) or ~minutes (`BGProcessingTask`) |
| Network constraint | ✓ `NetworkType.connected` | ✗ No direct equivalent |
| Battery constraint | ✓ `requiresBatteryNotLow` | ✗ OS decides implicitly |
| Guaranteed execution | Nearly — WorkManager persists across reboots | No guarantee — OS can skip entirely |
| Exact timing | No — system batches for efficiency | No — system chooses optimal time |
| User can disable | Battery optimization settings | Background App Refresh toggle |

**Key iOS restrictions:**
- iOS is far more aggressive about killing background work. Apple prioritizes battery life over developer convenience.
- `BGAppRefreshTask` gets ~30 seconds — enough for a quick API call, not for processing 1000 photos.
- `BGProcessingTask` gets more time but only runs when the device is charging and on Wi-Fi.
- If your background task crashes or takes too long repeatedly, iOS will stop scheduling it entirely — a silent, permanent punishment.
- You must register task identifiers in `Info.plist` under `BGTaskSchedulerPermittedIdentifiers`.

**Android Doze mode:**
- When the device is stationary and screen-off for a while, Android enters Doze mode.
- Doze defers all jobs, alarms, and network access to "maintenance windows" (every ~15 min initially, then less frequent).
- WorkManager handles Doze correctly — your tasks run in the next maintenance window.
- Don't tell users to disable battery optimization. Google Play policy penalizes apps that do this without a strong reason (e.g., medical monitoring).

**Testing background behavior:**

```bash
# Android — force Doze mode
adb shell dumpsys deviceidle force-idle

# Android — check if your WorkManager task is scheduled
adb shell dumpsys jobscheduler | grep com.myapp

# Android — trigger immediate execution for testing
adb shell cmd jobscheduler run -f com.myapp <job-id>

# iOS — trigger background fetch in Xcode
# Debug menu → Simulate Background Fetch
```

---

### Testing Background Tasks in Development

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Workmanager().initialize(
    callbackDispatcher,
    isInDebugMode: true,  // prints task execution logs to console
  );

  runApp(const MyApp());
}
```

For unit testing the logic inside your callback, extract it into a pure function:

```dart
// Testable — no workmanager dependency
Future<SyncResult> syncPendingExpenses(ExpenseApi api, LocalStore store) async {
  final pending = await store.getPending();
  int synced = 0;
  for (final expense in pending) {
    try {
      await api.upload(expense);
      await store.markSynced(expense.id);
      synced++;
    } catch (_) {
      break; // will retry next time
    }
  }
  return SyncResult(total: pending.length, synced: synced);
}

// In tests:
test('syncs pending expenses and marks them done', () async {
  final api = FakeExpenseApi();
  final store = FakeLocalStore(pending: [mockExpense1, mockExpense2]);

  final result = await syncPendingExpenses(api, store);

  expect(result.synced, 2);
  expect(store.getPending(), isEmpty);
});
```

**Rule:** Never test the WorkManager scheduling itself — that's the plugin's responsibility. Test your business logic by extracting it into pure functions that take dependencies as parameters.

---

> **🔀 Coming from TypeScript?**
>
> Background processing in Flutter maps to several web concepts:
> - **`Isolate.run`** ≈ **Web Workers** — run CPU-heavy code off the main thread. Same constraint: no DOM access (no Flutter plugins).
> - **`workmanager`** ≈ **Service Workers + Background Sync API** — the OS wakes your code to do work even when the app/tab is closed.
> - **FCM `onBackgroundMessage`** ≈ **Push API + Service Worker push event** — handle push notifications without the page being open.
>
> The biggest difference: in web, Service Workers can run for as long as the browser allows (often minutes). On mobile, the OS is much more aggressive — iOS gives you 30 seconds, and even Android's 10-minute limit is enforced. Mobile background processing is a constant negotiation with the OS for execution time.

---

## Lab — Profile the Expense Tracker

1. Run the Expense Tracker in `--profile` mode
2. Open DevTools Performance tab
3. Scroll the expense list rapidly — identify any frames over 16ms
4. Use Widget Inspector to find the widget causing the slow frame
5. Apply the relevant fix from this file
6. Re-profile and confirm frames are now under 16ms

---

## Challenge — Benchmark Before and After

Write a performance benchmark using `flutter_test`:

```dart
// test/performance/expense_list_benchmark.dart

import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('expense list build time', (tester) async {
    final stopwatch = Stopwatch()..start();

    // Build a list of 1000 items
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView.builder(
            itemCount: 1000,
            itemBuilder: (context, index) => ExpenseTile(expense: generateFakeExpense(index)),
          ),
        ),
      ),
    );

    stopwatch.stop();
    debugPrint('Build time: ${stopwatch.elapsedMilliseconds}ms');

    // Now apply itemExtent and re-benchmark
    // Goal: < 100ms for 1000 items
    expect(stopwatch.elapsedMilliseconds, lessThan(200));
  });
}
```

Run with vs without `itemExtent: 72` and compare.

---

## Week 24 Verify

1. Why must you profile in `--profile` mode, not `--debug` mode?
2. `const Text('Hello')` vs `Text('Hello')` — what's the actual difference Flutter sees at runtime?
3. `BlocSelector` vs `context.watch` — when would you choose each?
4. When should you add a `RepaintBoundary`? Give two concrete examples from your Expense Tracker.
5. `ListView` vs `ListView.builder` — if you have 5 items, does the choice matter? What about 500 items?
6. Why can't you pass a method on an instance to `compute()`? Why must it be a top-level or static function?
7. You see memory growing steadily in DevTools. What are the three most likely causes in a Flutter app?
8. Firebase Performance's `HttpMetric` tracks an API call's duration. Sentry's `tracesSampleRate: 0.2` samples 20% of transactions. Why don't you sample at 100%? What's the tradeoff?
9. Your team's performance budget says cold start must be under 2 seconds and screen transitions under 300ms. A new feature adds 500ms to cold start. What do you do — ship it or optimize? How do you measure cold start time?
10. `SentryNavigatorObserver` is added to your `GoRouter`. What does it automatically create for every route navigation? How does this help when investigating a crash that happened on a specific screen?
11. Your Expense Tracker syncs pending expenses to the server using `workmanager`. The callback dispatcher runs in a fresh isolate. Can it access your Riverpod providers or `get_it` service locator? What must it do instead to get a Dio client and database connection?
12. On iOS, `BGAppRefreshTask` gives your app ~30 seconds of background execution. On Android, WorkManager gives ~10 minutes. Your sync task takes 2 minutes for users with 500+ pending expenses. How do you handle this platform gap? What happens on iOS if your task repeatedly exceeds its time limit?

---

**Next → [Week 25: CI/CD and Deployment](Week_25_CICD_and_Deployment.md)**
