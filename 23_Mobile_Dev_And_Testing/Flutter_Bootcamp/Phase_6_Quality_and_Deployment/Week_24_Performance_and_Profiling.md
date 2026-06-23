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

### `compute` vs `Isolate.run` vs `Isolate.spawn` — Which Tool For Which Job

Three ways to escape the main thread. They are NOT interchangeable.

| API | Lifetime | Use For | Setup Cost |
|---|---|---|---|
| `compute(fn, arg)` | One-shot | Single computation, simple input → output | Low (legacy API, predates `Isolate.run`) |
| `Isolate.run(fn)` | One-shot | Single computation, closures over local data | Low (Dart 3+, preferred) |
| `Isolate.spawn(fn, sendPort)` | Long-lived | Worker isolate that handles multiple jobs | High (manual port management) |

**One-shot examples:**

```dart
// compute — older API, top-level function required
String _expensiveHash(String input) => sha256.convert(utf8.encode(input)).toString();
final hash = await compute(_expensiveHash, 'large string');

// Isolate.run — preferred, closures work
final input = 'large string';
final hash = await Isolate.run(() => sha256.convert(utf8.encode(input)).toString());
```

**Long-lived worker isolate — when you process a stream of jobs:**

```dart
class ImageProcessor {
  late SendPort _sendPort;
  late ReceivePort _receivePort;
  final _pending = <int, Completer<Uint8List>>{};
  int _nextId = 0;

  Future<void> initialize() async {
    _receivePort = ReceivePort();
    await Isolate.spawn(_worker, _receivePort.sendPort);

    // First message from worker is its own SendPort
    final completer = Completer<SendPort>();
    _receivePort.listen((msg) {
      if (msg is SendPort) {
        completer.complete(msg);
      } else if (msg is _ProcessedImage) {
        _pending.remove(msg.id)?.complete(msg.bytes);
      }
    });
    _sendPort = await completer.future;
  }

  Future<Uint8List> process(Uint8List bytes) {
    final id = _nextId++;
    final completer = Completer<Uint8List>();
    _pending[id] = completer;
    _sendPort.send(_ProcessRequest(id, bytes));
    return completer.future;
  }

  void dispose() {
    _receivePort.close();
    _sendPort.send('shutdown');
  }
}

void _worker(SendPort hostPort) {
  final port = ReceivePort();
  hostPort.send(port.sendPort); // hand back our port

  port.listen((msg) {
    if (msg == 'shutdown') {
      port.close();
      return;
    }
    if (msg is _ProcessRequest) {
      final processed = _heavyImageProcessing(msg.bytes);
      hostPort.send(_ProcessedImage(msg.id, processed));
    }
  });
}
```

**Rule:** Use `Isolate.run` for one-off work. Spin up a long-lived worker only when you'll send it many jobs and the spawn cost (~10ms) would otherwise be paid repeatedly.

---

### Android Foreground Services — When Your Work Must Be Visible

`workmanager` is for deferred, system-controlled work. Foreground services are for work the user is actively aware of and that must NOT be killed — music playback, fitness tracking, navigation, file uploads with progress.

**The trade-off:**
- The user sees a persistent notification (mandated by Android)
- In exchange, your service runs continuously with no time limit
- Battery-sensitive — if abused, users uninstall

**Setup with `flutter_foreground_task`:**

```dart
class FitnessTrackerTaskHandler extends TaskHandler {
  StreamSubscription? _stepSubscription;
  int _steps = 0;

  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    _stepSubscription = Pedometer.stepCountStream.listen((event) {
      _steps = event.steps;
      FlutterForegroundTask.updateService(
        notificationTitle: 'Tracking your run',
        notificationText: '$_steps steps',
      );
      // Send to main isolate
      FlutterForegroundTask.sendDataToMain({'steps': _steps});
    });
  }

  @override
  Future<void> onRepeatEvent(DateTime timestamp) async {}

  @override
  Future<void> onDestroy(DateTime timestamp) async {
    await _stepSubscription?.cancel();
  }
}

// Start the foreground service
await FlutterForegroundTask.startService(
  notificationTitle: 'Fitness Tracker',
  notificationText: 'Starting...',
  callback: () => FlutterForegroundTask.setTaskHandler(FitnessTrackerTaskHandler()),
);
```

**When you need a foreground service (Android only):**
- Music or video playback
- Active turn-by-turn navigation
- Fitness/health tracking during workouts
- Large file uploads with user-visible progress
- Real-time communication (voice/video calls)

**When you DON'T need one:**
- Background sync (use WorkManager)
- Periodic data refresh (use WorkManager)
- One-off uploads that can defer (use WorkManager)

iOS doesn't have a direct equivalent — instead, you declare specific `UIBackgroundModes` in `Info.plist` (audio, location, voip, fetch, processing). iOS grants execution time based on which mode you declared.

---

### iOS Background Modes — Apple's Allowlist

iOS doesn't have generic "foreground services." Instead, Apple defines specific modes. You declare which you need in `Info.plist`, and iOS gives your app execution time for that purpose only — abuse it for something else and your app is rejected at review.

```xml
<!-- ios/Runner/Info.plist -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>           <!-- Music/podcast playback -->
    <string>location</string>        <!-- GPS tracking -->
    <string>voip</string>            <!-- Voice/video calls (WhatsApp, Zoom) -->
    <string>fetch</string>           <!-- Periodic background fetch -->
    <string>processing</string>      <!-- BGProcessingTask -->
    <string>remote-notification</string> <!-- Silent push wakes the app -->
    <string>bluetooth-central</string>   <!-- Bluetooth peripheral comms -->
</array>
```

**The unlock pattern — silent push:**

```dart
// Server sends an APNs payload with content-available: 1
// iOS wakes your app for ~30 seconds to handle it
FirebaseMessaging.onBackgroundMessage((message) async {
  if (message.data['type'] == 'sync_required') {
    await _performBackgroundSync();
  }
});
```

This is the most reliable way to wake an iOS app for background work. The OS allocates time because YOU told it new data arrived. Apple still throttles if you abuse it (sending too many silent pushes that don't justify the wake).

---

### Geofencing — Background Location, Done Right

Geofencing is the "send a notification when user enters/leaves an area" feature. It's a great example because it requires background processing AND respects battery.

```dart
// Using geofence_service package
final geofenceService = GeofenceService.instance.setup(
  interval: 5000,
  accuracy: 100,
  loiteringDelayMs: 60000,
  statusChangeDelayMs: 10000,
);

await geofenceService.addGeofence(
  Geofence(
    id: 'office',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: [GeofenceRadius(id: 'radius_100m', length: 100)],
  ),
);

geofenceService.addGeofenceStatusChangedListener(
  (geofence, radius, status, location) async {
    if (status == GeofenceStatus.ENTER) {
      await flutterLocalNotificationsPlugin.show(
        0, 'Welcome to the office', 'Clocked in automatically', notifDetails);
    }
  },
);

geofenceService.start();
```

**Why geofencing is the right approach (vs polling location):**
- The OS uses cellular tower triangulation and Wi-Fi BSSIDs to detect rough location changes — almost zero battery
- Your app is only woken when the user actually crosses a geofence boundary
- Apple/Google allow up to 20 geofences per app — beyond that, you must rotate them

**Anti-pattern — polling location in the background:**
```dart
// DON'T do this in production
Timer.periodic(Duration(seconds: 30), (_) async {
  final position = await Geolocator.getCurrentPosition();
  // ... check if user is near a geofence
});
```
This drains battery in hours, gets killed by iOS aggressively, and shows up as a battery hog in iOS Settings — users will uninstall.

---

### Wake Locks — How To Avoid Them

A wake lock keeps the CPU running even when the screen is off. On Android, you can hold one indefinitely — but if you do, the user's battery dies in hours and Google Play will flag your app.

**The rule: never hold a wake lock for more than a few seconds without explicit user consent.**

Acceptable wake lock scenarios:
- Brief network call to complete a critical sync (release immediately after)
- Workout tracking with a visible foreground service notification
- Active phone/video call

Unacceptable:
- Polling for new messages every minute "to feel responsive"
- Keeping a websocket alive when the user isn't actively chatting
- Pre-fetching content the user might never scroll to

**The right alternative — push notifications wake the app when there's actually something new:**

```
BAD:  App polls every 60s, holding wake lock → drains battery
GOOD: Server sends FCM push when there's new data → app wakes only when needed
```

---

### Complete Walkthrough — Offline-First Sync With WorkManager

Putting it all together. Goal: user adds expenses offline, they sync when network returns.

**Architecture:**

```
1. User adds expense (UI)
   ↓
2. ExpenseRepository.add() → save to Hive (instant)
   ↓
3. Mark as 'unsynced' in local DB
   ↓
4. Enqueue WorkManager task with NetworkType.connected constraint
   ↓
5. WorkManager waits for network
   ↓
6. When online → fires callback → uploads expense → marks 'synced'
```

**Implementation:**

```dart
// domain/usecases/add_expense.dart
class AddExpense {
  final ExpenseRepository _repo;
  AddExpense(this._repo);

  Future<void> call(Expense expense) async {
    // 1. Save locally — never blocks on network
    await _repo.saveLocal(expense.copyWith(syncStatus: SyncStatus.pending));

    // 2. Enqueue sync — runs when network is available
    await Workmanager().registerOneOffTask(
      'sync-expense-${expense.id}',  // unique name = idempotent
      'syncExpense',
      inputData: {'expenseId': expense.id},
      constraints: Constraints(networkType: NetworkType.connected),
      backoffPolicy: BackoffPolicy.exponential,
      backoffPolicyDelay: const Duration(seconds: 30),
      existingWorkPolicy: ExistingWorkPolicy.replace,
    );
  }
}

// Callback dispatcher
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    if (taskName != 'syncExpense') return false;

    // Re-initialize dependencies from scratch
    await Hive.initFlutter();
    final box = await Hive.openBox<Expense>('expenses');
    final dio = Dio(BaseOptions(baseUrl: 'https://api.myapp.com'));

    final expenseId = inputData!['expenseId'] as String;
    final expense = box.get(expenseId);
    if (expense == null) return true; // deleted while pending, nothing to do

    try {
      await dio.post('/expenses', data: expense.toJson());
      await box.put(expenseId, expense.copyWith(syncStatus: SyncStatus.synced));
      return true;
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        // Conflict — server already has this expense (idempotency key matched)
        await box.put(expenseId, expense.copyWith(syncStatus: SyncStatus.synced));
        return true;
      }
      return false; // WorkManager will retry with exponential backoff
    }
  });
}
```

**Critical patterns in this code:**

1. **Idempotency:** Using `expense.id` as the task name + `ExistingWorkPolicy.replace` means tapping "save" 5 times schedules ONE sync, not five.
2. **Server-side idempotency:** The server uses the expense ID as an idempotency key. If WorkManager retries after a successful upload (because we didn't get the 200 OK), the server returns 409 Conflict and we mark it synced.
3. **Local-first:** The user's UI never waits for network. The expense appears instantly.
4. **Backoff:** Exponential backoff means 30s → 60s → 120s → 240s... until success or 5 retries.
5. **Crash safety:** If the app crashes mid-sync, WorkManager persists the task. It runs again on next boot.

---

### Battery Profiling — Measure Your Impact

You can't fix what you don't measure. Both platforms give you tools:

**Android — Battery Historian:**
```bash
# Capture a battery snapshot
adb bugreport > bugreport.zip

# Open in Battery Historian (https://github.com/google/battery-historian)
# Shows: wake locks, GPS usage, network activity, app wakeups per hour
```

**iOS — Xcode Energy Log:**
- Connect device → Xcode → Window → Devices and Simulators
- Open Console → Energy Log
- Shows: CPU usage, energy impact rating, location/network activity

**Google Play Console — Bad Behavior dashboard:**
- Automatic detection of: excessive wakeups, partial wake locks, stuck wake locks, excessive background WiFi scans
- If your app appears here, fix it before Google penalizes your store ranking

**Apple App Store — no equivalent dashboard, but:**
- Users see your app in Settings → Battery → Last 24 Hours / Last 10 Days
- If you appear high in that list, users will uninstall
- Apple Insights (in App Store Connect) sometimes flags "consumes excessive energy"

**Performance budget for background work:**
```
Total background CPU per hour    < 30 seconds
Wakeups per hour                 < 10
Network requests per hour        < 20 (when idle)
Wake locks held                  0 (or < 5s if briefly needed)
```

---

### Android 14+ Foreground Service Types (Mandatory)

Since Android 14 (API 34), every foreground service MUST declare a `foregroundServiceType` in `AndroidManifest.xml`. Apps targeting API 34+ that start an FGS without a declared type will crash with `SecurityException`. Google enforces this strictly — it's a Play Store policy issue, not a developer convenience.

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
    <!-- Declare the permission for each FGS type you use -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application>
        <service
            android:name=".SyncService"
            android:foregroundServiceType="dataSync"
            android:exported="false" />

        <service
            android:name=".FitnessTrackerService"
            android:foregroundServiceType="location|health"
            android:exported="false" />
    </application>
</manifest>
```

**The 11 foreground service types (Android 14+):**

| Type | Use For | Approval Required? |
|---|---|---|
| `camera` | Continuous camera access (video calls) | No |
| `connectedDevice` | Bluetooth, USB, network device interaction | No |
| `dataSync` | Cloud upload/download, file transfer | No |
| `health` | Fitness tracking, medical monitoring | No |
| `location` | GPS tracking, navigation | No |
| `mediaPlayback` | Audio/video playback, podcast apps | No |
| `mediaProjection` | Screen recording, casting | No |
| `microphone` | Recording audio, voice notes | No |
| `phoneCall` | VoIP, telephony apps | No |
| `remoteMessaging` | Real-time chat (Signal-style) | No |
| `specialUse` | Anything else | **YES — Play Console declaration required** |

**Critical:** If you use `specialUse`, you must declare WHY in Play Console under "App content → Foreground services" with a written justification. Google reviews this manually — get it wrong and your app is suspended.

**The runtime check Google's lint enforces:**
```kotlin
val notification = NotificationCompat.Builder(this, CHANNEL_ID)
    .setContentTitle("Syncing...")
    .setSmallIcon(R.drawable.ic_sync)
    .build()

// startForeground with type — required since Android 14
ServiceCompat.startForeground(
    this,
    NOTIFICATION_ID,
    notification,
    ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC,
)
```

**Migration tip:** If your `flutter_foreground_task` setup worked on Android 13 but crashes on Android 14, you're missing the type declaration. Update both the manifest and the call to `startForeground`.

---

### iOS Background URLSession — Resumable Downloads That Survive App Death

`URLSession` with a background configuration is iOS's mechanism for downloads/uploads that continue even when your app is killed by the OS. The system handles the transfer; your app is woken up only when it completes (or fails).

**The use case:** Your user starts a 500MB video download in your media app. They switch to another app. iOS kills your app to free memory. Without background URLSession, the download dies. With it, iOS continues the download in `nsurlsessiond`, and wakes your app to handle completion.

**Implementation pattern (via platform channel):**

```swift
// AppDelegate.swift
class AppDelegate: FlutterAppDelegate {
    var backgroundCompletionHandler: (() -> Void)?

    override func application(
        _ application: UIApplication,
        handleEventsForBackgroundURLSession identifier: String,
        completionHandler: @escaping () -> Void
    ) {
        // iOS calls this when a background download finishes while app was suspended
        backgroundCompletionHandler = completionHandler

        // Wake Flutter, let Dart code react
        let channel = FlutterMethodChannel(
            name: "com.myapp/downloads",
            binaryMessenger: (window?.rootViewController as! FlutterViewController).binaryMessenger
        )
        channel.invokeMethod("onDownloadCompleted", arguments: ["sessionId": identifier])
    }
}

// DownloadManager.swift
class DownloadManager: NSObject, URLSessionDownloadDelegate {
    static let shared = DownloadManager()

    lazy var session: URLSession = {
        let config = URLSessionConfiguration.background(withIdentifier: "com.myapp.downloads")
        config.isDiscretionary = false  // false = run ASAP, true = run when system decides optimal
        config.sessionSendsLaunchEvents = true  // wake app on completion
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    func startDownload(url: URL, taskId: String) {
        var request = URLRequest(url: url)
        request.setValue(taskId, forHTTPHeaderField: "X-Task-Id")
        let task = session.downloadTask(with: request)
        task.resume()
    }

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask,
                    didFinishDownloadingTo location: URL) {
        // Move file to permanent storage immediately — `location` is deleted when this returns
        let destination = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(downloadTask.taskDescription ?? UUID().uuidString)
        try? FileManager.default.moveItem(at: location, to: destination)
    }
}
```

**Capabilities required:**
- Add `Background Modes → Background fetch` and `Background processing` to `Info.plist`
- For uploads: `Background Modes → Audio, AirPlay, and Picture in Picture` is NOT needed unless you actually do those things — Apple rejects apps that declare unused background modes

**Rule:** For any download > 50MB or upload > 10MB in a user-experience-critical flow (avatar upload, photo backup, video download), use background URLSession. The Flutter HTTP / Dio libraries won't survive app death.

**Android equivalent:** WorkManager with `OneTimeWorkRequest` + `Constraints` does the same thing automatically. Android is more lenient — even regular `HttpURLConnection` calls inside a `Worker` will survive the app being killed.

---

### Notification Permissions — The UX That Breaks Wrong

**Android 13+ (API 33+):** Notifications are no longer auto-granted. You must request `POST_NOTIFICATIONS` permission at runtime, like camera or location.

```dart
import 'package:permission_handler/permission_handler.dart';

Future<bool> requestNotificationPermission() async {
  // Returns granted/denied/permanentlyDenied
  final status = await Permission.notification.request();

  if (status.isPermanentlyDenied) {
    // User checked "Don't ask again" — must direct them to settings
    await openAppSettings();
    return false;
  }
  return status.isGranted;
}
```

**The wrong UX (what most apps do):**
- Show the system prompt on first app launch
- User has no idea why your app needs notifications yet
- User taps "Don't allow"
- You never get a second chance — the system won't show the prompt again

**The right UX — "soft ask before hard ask":**
1. Let the user use your app for 1-3 sessions
2. When they hit a moment notifications are obviously useful (e.g., they just sent a message and you want to notify them of replies), show a friendly in-app screen explaining the value
3. Only if they tap "Enable Notifications" on YOUR screen do you trigger the system prompt
4. Acceptance rate goes from ~30% (cold prompt) to ~70%+ (warmed up)

**iOS Provisional Authorization** — the silent acceptance trick:

```dart
// Request provisional auth — no prompt shown, notifications arrive silently
// in Notification Center (not as banners). User can later "promote" them to full.
await FirebaseMessaging.instance.requestPermission(
  alert: true,
  badge: true,
  sound: true,
  provisional: true,  // ← magic flag
);
```

With provisional auth:
- No system prompt = no rejection risk
- Notifications appear silently in Notification Center (not as banners or sounds)
- User can swipe down on one and tap "Keep" to promote to full delivery
- Use for low-stakes notifications (digest emails, weekly summaries)

**Rule:** Never ask for notification permission on first launch. Earn the permission by demonstrating value first.

---

### Migration Strategy — Replacing AsyncTask / JobIntentService / IntentService

If you're consulting on a legacy Flutter project that wraps an old Android codebase, you'll see deprecated background APIs. Here's the migration table:

| Deprecated API | Replacement | Why deprecated |
|---|---|---|
| `AsyncTask` | Kotlin coroutines / `Executor` | Memory leaks (holds Activity ref), serial executor surprises |
| `IntentService` | `JobIntentService` then `WorkManager` | No background restrictions in Oreo+ |
| `JobIntentService` | `WorkManager` | Deprecated in Android 12 |
| `JobScheduler` directly | `WorkManager` | WorkManager handles boot persistence, retry, constraints uniformly |
| `AlarmManager.setExact` | `WorkManager` for non-time-critical; `AlarmManager.setExactAndAllowWhileIdle` only for alarms users explicitly set (clocks, calendars) |
| `SyncAdapter` | `WorkManager` | Tied to deprecated `AccountManager` UX |

**Rule for new code:** WorkManager is the default. Reach for `AlarmManager` only when you genuinely need exact wall-clock timing for a user-visible event (alarm clock, reminder).

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
