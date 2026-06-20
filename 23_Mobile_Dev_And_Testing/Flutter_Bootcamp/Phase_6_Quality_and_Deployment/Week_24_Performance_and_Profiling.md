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

---

**Next → [Week 25: CI/CD and Deployment](Week_25_CICD_and_Deployment.md)**
