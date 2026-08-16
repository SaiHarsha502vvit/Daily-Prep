# 04. Flutter — Development Concepts + Complete Testing Stack

**Navigation**: [← iOS Native](03_iOS_Native_Dev_And_Testing.md) | [📚 Folder Context](CONTEXT.md) | [Mobile Web & Hybrid →](05_Mobile_Web_And_Hybrid_Playwright.md)

> **Reading contract**: Flutter is fundamentally different from Android and iOS. It does not use native UI components at all — it draws every pixel itself. This chapter teaches you the Dart language basics you need, the Widget model, state management from simple to enterprise, and the complete testing stack. No prior Flutter or Dart experience assumed.

---

## Table of Contents

- [04. Flutter — Development Concepts + Complete Testing Stack](#04-flutter--development-concepts--complete-testing-stack)
  - [Table of Contents](#table-of-contents)
  - [1. What Is Flutter? The Mental Model](#1-what-is-flutter-the-mental-model)
    - [The Core Difference — Flutter Renders Its Own Pixels](#the-core-difference--flutter-renders-its-own-pixels)
    - [Why This Matters for Testing](#why-this-matters-for-testing)
    - [What Flutter Gives You](#what-flutter-gives-you)
    - [🎯 Practice — Level 1](#-practice--level-1)
  - [2. Dart Essentials — Only What You Need](#2-dart-essentials--only-what-you-need)
    - [Variables and Types](#variables-and-types)
    - [Functions](#functions)
    - [Classes and Inheritance](#classes-and-inheritance)
    - [Futures and async/await](#futures-and-asyncawait)
    - [Streams — Dart's Flow/Observable](#streams--darts-flowobservable)
    - [🎯 Practice — Level 1](#-practice--level-1-1)
  - [3. Widgets — Everything Is a Widget](#3-widgets--everything-is-a-widget)
    - [The Fundamental Rule](#the-fundamental-rule)
    - [The Widget Tree, Element Tree, and Render Tree](#the-widget-tree-element-tree-and-render-tree)
  - [4. StatelessWidget vs StatefulWidget](#4-statelesswidget-vs-statefulwidget)
    - [StatelessWidget — Pure, No Internal State](#statelesswidget--pure-no-internal-state)
    - [StatefulWidget — Has Mutable Internal State](#statefulwidget--has-mutable-internal-state)
    - [The Rule: When to Use Which](#the-rule-when-to-use-which)
    - [🎯 Practice — Level 1](#-practice--level-1-2)
  - [5. The Widget Lifecycle](#5-the-widget-lifecycle)
    - [The `mounted` Check — Critical Async Pattern](#the-mounted-check--critical-async-pattern)
  - [6. Navigation — Routing Between Screens](#6-navigation--routing-between-screens)
    - [Navigator 1.0 (Imperative — Simple Apps)](#navigator-10-imperative--simple-apps)
    - [go_router (Recommended for Most Apps)](#go_router-recommended-for-most-apps)
  - [7. State Management — From Simple to Enterprise](#7-state-management--from-simple-to-enterprise)
    - [Level 1 (Simple): setState](#level-1-simple-setstate)
    - [Level 2 (Intermediate): Provider](#level-2-intermediate-provider)
    - [Level 3 (Intermediate-Advanced): Riverpod](#level-3-intermediate-advanced-riverpod)
    - [Level 4 (Enterprise): BLoC Pattern](#level-4-enterprise-bloc-pattern)
    - [🎯 Practice — Level 2 (Intermediate)](#-practice--level-2-intermediate)
  - [8. Networking — http and Dio](#8-networking--http-and-dio)
    - [The http Package (Simple, Official)](#the-http-package-simple-official)
    - [Dio (Full-Featured, Production Choice)](#dio-full-featured-production-choice)
  - [9. Local Storage — Preferences, SQLite, Hive](#9-local-storage--preferences-sqlite-hive)
  - [10. Flutter Testing Pyramid — Four Levels](#10-flutter-testing-pyramid--four-levels)
  - [11. Level 1: Unit Tests](#11-level-1-unit-tests)
  - [12. Level 2: Widget Tests](#12-level-2-widget-tests)
    - [🎯 Practice — Level 3 (Advanced)](#-practice--level-3-advanced)
  - [13. Level 3: Integration Tests](#13-level-3-integration-tests)
  - [14. Level 4: Appium Flutter Driver (E2E)](#14-level-4-appium-flutter-driver-e2e)
    - [Setup](#setup)
    - [🎯 Practice — Level 3 (Advanced)](#-practice--level-3-advanced-1)
  - [15. Flutter vs Android vs iOS — Comparison](#15-flutter-vs-android-vs-ios--comparison)
  - [16. Interview Questions on Flutter](#16-interview-questions-on-flutter)

---

## 1. What Is Flutter? The Mental Model

### The Core Difference — Flutter Renders Its Own Pixels

Android and iOS apps use **platform-native UI components** — Android's `View`, iOS's `UIView`. When you write a `Button` in Android Kotlin, Android draws a native Android button. When you write a `Button` in iOS Swift, iOS draws a native iOS button.

Flutter is completely different. It uses its own **rendering engine (Skia / Impeller)** to draw every pixel on a blank canvas:

```
ANDROID NATIVE:                     FLUTTER ON ANDROID:
┌────────────────────┐              ┌────────────────────┐
│  Android OS        │              │  Android OS        │
│  ┌──────────────┐  │              │  ┌──────────────┐  │
│  │ Android View │  │              │  │ Flutter View │  │ ← One fullscreen
│  │ System       │  │              │  │ (a Surface)  │  │   OpenGL canvas
│  │  (draws your │  │              │  │              │  │
│  │   buttons,   │  │              │  │ 🎨 Flutter   │  │
│  │   text, etc) │  │              │  │ engine draws │  │
│  └──────────────┘  │              │  │ EVERYTHING   │  │
└────────────────────┘              │  └──────────────┘  │
                                    └────────────────────┘

Result: Buttons look like Android          Result: Buttons look the same on
on Android, iOS on iOS.                    EVERY platform (Android, iOS, Web,
                                           Desktop) because Flutter drew them.
```

### Why This Matters for Testing

Because Flutter doesn't use native UI components, Appium's UIAutomator2 (Android) and XCUITest (iOS) cannot find Flutter widgets — those native accessibility trees don't contain Flutter's widgets. Flutter has its own semantic tree.

This is why Appium has a **special Flutter driver** that talks to Flutter's semantic layer directly.

### What Flutter Gives You

```
One Dart codebase → Compiles to:
├── Android APK (ARM machine code via Dart AOT compiler)
├── iOS IPA (ARM machine code)
├── Web (JavaScript or WASM)
├── Windows .exe
├── macOS .app
└── Linux binary
```

Performance is near-native because Dart compiles to native ARM code (not interpreted). Flutter apps are typically 60fps or 120fps.

---

### 🎯 Practice — Level 1

**Question**: A QA engineer sets up Appium with the UIAutomator2 driver to test a Flutter app on Android. After launching the app, no elements are found. Why? What is the correct approach?

<details><summary>Answer</summary>

UIAutomator2 queries Android's **accessibility tree** — the system-level UI hierarchy built from native Android Views. Flutter does NOT create native Android Views for its widgets. Flutter uses a single `SurfaceView` (a raw drawing canvas) and draws everything inside it using its own rendering engine.

From UIAutomator2's perspective, the entire Flutter app is ONE opaque surface. It sees the window, but inside it sees nothing — no buttons, no text fields, no lists.

**The correct approaches** in order of preference:

1. **Flutter's `integration_test` package**: Runs tests inside the Flutter engine itself — has full access to the widget tree. Best for most test scenarios.

2. **Appium Flutter Driver**: An Appium plugin that connects to Flutter's testing server (Dart VM service) instead of UIAutomator2. It queries Flutter's semantic tree, not Android's accessibility tree.

3. **Appium with UIAutomator2 + Flutter semantics enabled**: Flutter can export an accessibility tree that UIAutomator2 CAN read, but only if `SemanticsDebugger` is enabled or the app uses `Semantics` widgets properly. This is unreliable for production apps.

For daily test automation: use `integration_test`. For cross-platform E2E (same test on Android + iOS): use Appium Flutter Driver.

</details>

---

## 2. Dart Essentials — Only What You Need

Dart is Flutter's language. If you know Java or Kotlin, Dart feels very familiar.

### Variables and Types

```dart
// Dart is strongly typed but has type inference
var name = 'Harsha';         // inferred as String
String city = 'Austin';      // explicit type
int citationCount = 5;
double amount = 150.75;
bool isPaid = false;

// final — set once, cannot be reassigned (like Kotlin val)
final userId = 'USR-001';
userId = 'USR-002';          // ❌ compile error

// const — compile-time constant (even more strict than final)
const maxAmount = 10000.0;   // must be known at compile time

// Dart also has null safety — same concept as Swift
String? nullableName = null; // ✅ allowed — declared with ?
String requiredName = null;  // ❌ compile error — cannot be null
```

### Functions

```dart
// Regular function
double calculateTax(double amount, double rate) {
  return amount * rate;
}

// Arrow function (single expression)
double calculateTax(double amount, double rate) => amount * rate;

// Named parameters (optional by default, or required with required keyword)
void createCitation({
  required String id,
  required double amount,
  String status = 'PENDING',  // optional with default
}) {
  print('$id: $amount ($status)');
}

// Call with named parameters
createCitation(id: 'CIT-001', amount: 150.0);
createCitation(id: 'CIT-002', amount: 200.0, status: 'PAID');
```

### Classes and Inheritance

```dart
// Class definition
class Citation {
  final String id;
  final double amount;
  String status;

  // Constructor
  Citation({
    required this.id,
    required this.amount,
    this.status = 'PENDING',
  });

  // Named constructor (like a factory method)
  Citation.paid({required String id, required double amount})
      : this(id: id, amount: amount, status: 'PAID');

  // copyWith pattern (immutable updates — like Kotlin data class copy())
  Citation copyWith({String? status}) {
    return Citation(
      id: id,
      amount: amount,
      status: status ?? this.status,
    );
  }

  // toString for debugging
  @override
  String toString() => 'Citation($id, \$$amount, $status)';
}

// Usage
final citation = Citation(id: 'CIT-001', amount: 150.0);
final paidCitation = citation.copyWith(status: 'PAID');
```

### Futures and async/await

```dart
// Future<T> — Dart's equivalent of Java's CompletableFuture or Kotlin's Deferred
// An async operation that will complete later

Future<List<Citation>> fetchCitations() async {
  final response = await http.get(Uri.parse('https://api.myapp.com/citations'));

  if (response.statusCode != 200) {
    throw Exception('Failed to load: ${response.statusCode}');
  }

  final List<dynamic> data = jsonDecode(response.body);
  return data.map((json) => Citation.fromJson(json)).toList();
}

// Call it with await in another async function
Future<void> loadScreen() async {
  try {
    final citations = await fetchCitations();
    print('Loaded ${citations.length} citations');
  } catch (e) {
    print('Error: $e');
  }
}
```

### Streams — Dart's Flow/Observable

```dart
// Stream<T> = ongoing sequence of values over time
// Same concept as Kotlin's Flow or RxJava's Observable

Stream<List<Citation>> watchCitations() async* {
  // yield* emits a value to the stream
  while (true) {
    final citations = await fetchCitations();
    yield citations;                          // emit
    await Future.delayed(Duration(seconds: 5)); // wait 5 seconds
    // loop: fetch again and emit again
  }
}

// StreamBuilder in Flutter UI: rebuilds widget on each stream event
StreamBuilder<List<Citation>>(
  stream: repository.watchCitations(),
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return CircularProgressIndicator();
    }
    if (snapshot.hasError) {
      return Text('Error: ${snapshot.error}');
    }
    final citations = snapshot.data ?? [];
    return ListView.builder(
      itemCount: citations.length,
      itemBuilder: (context, index) => CitationTile(citations[index]),
    );
  },
)
```

---

### 🎯 Practice — Level 1

**Question**: What is the output of this Dart code? Why?

```dart
void main() {
  print('A');
  Future.delayed(Duration.zero, () => print('B'));
  print('C');
}
```

<details><summary>Answer</summary>

**Output:**

```
A
C
B
```

**Why**: Dart is **single-threaded** with an **event loop**, exactly like JavaScript. `Future.delayed(Duration.zero, ...)` schedules the callback to run AFTER the current synchronous code completes — even though the delay is zero milliseconds.

The execution order:

1. `print('A')` — synchronous, runs immediately
2. `Future.delayed(Duration.zero, callback)` — schedules `callback` to be called in the future (puts it in the event queue), but does NOT run it now
3. `print('C')` — synchronous, runs immediately
4. Main finishes → event loop picks up the scheduled callback → `print('B')` runs

**Why this matters for Flutter testing**: In widget tests, you often need to pump the event loop to let futures complete:

```dart
await tester.pump();           // pump one frame
await tester.pumpAndSettle();  // pump until all animations and futures settle
```

If you don't pump, your `Future` callbacks never fire and assertions fail.

</details>

---

## 3. Widgets — Everything Is a Widget

### The Fundamental Rule

In Flutter, **everything is a Widget**. Not just buttons and text — padding, alignment, background color, animations, and even the entire app itself are all widgets.

```dart
// This entire thing is a tree of widgets
MaterialApp(                   // Widget: sets up material design theme
  home: Scaffold(              // Widget: provides app bar + body structure
    appBar: AppBar(            // Widget: the top bar
      title: Text('Citations'),// Widget: text in the bar
    ),
    body: Center(              // Widget: centers its child
      child: Column(           // Widget: stacks children vertically
        children: [
          Padding(             // Widget: adds space
            padding: EdgeInsets.all(16),
            child: Text(       // Widget: displays text
              'Hello, Harsha',
              style: TextStyle(fontSize: 24),
            ),
          ),
          ElevatedButton(      // Widget: a button
            onPressed: () {},
            child: Text('Pay'),
          ),
        ],
      ),
    ),
  ),
)
```

### The Widget Tree, Element Tree, and Render Tree

This is how Flutter actually works — three separate trees:

```
WIDGET TREE                    ELEMENT TREE                RENDER TREE
(your code — blueprint)        (Flutter's manager)         (what gets painted)

Column                         ColumnElement               RenderFlex
  ├── Text('Hello')    ───►      ├── TextElement   ───►      ├── RenderParagraph
  └── ElevatedButton             └── ButtonElement           └── RenderProxyBox

You rebuild Widget tree         Element tree persists       RenderObject calculates
freely — it's cheap             across rebuilds             layout and paints
(widgets are immutable)         Element diffing is          to the screen
                                what makes Flutter fast
```

**Key insight**: Widgets are **immutable** (like React's JSX). Every time state changes, Flutter builds a NEW widget tree. The Element tree diffs the old and new widget trees and only updates what changed in the RenderTree. This is why Flutter is fast even with many rebuilds.

---

## 4. StatelessWidget vs StatefulWidget

### StatelessWidget — Pure, No Internal State

A `StatelessWidget` is like a pure function: given the same inputs, it always renders the same output. It cannot change itself.

```dart
// StatelessWidget — takes data in, renders it
// Does NOT have state that changes over time
class CitationTile extends StatelessWidget {
  final Citation citation;    // data passed in from parent

  // const constructor — Flutter can cache and reuse these
  const CitationTile({super.key, required this.citation});

  @override
  Widget build(BuildContext context) {
    // build() is called whenever the parent rebuilds
    // It returns the widget tree for this component
    return ListTile(
      leading: Icon(
        citation.status == 'PAID' ? Icons.check_circle : Icons.pending,
        color: citation.status == 'PAID' ? Colors.green : Colors.orange,
      ),
      title: Text(citation.id),
      subtitle: Text('\$${citation.amount.toStringAsFixed(2)}'),
      trailing: Text(
        citation.status,
        style: TextStyle(
          color: citation.status == 'PAID' ? Colors.green : Colors.orange,
        ),
      ),
    );
  }
}
```

### StatefulWidget — Has Mutable Internal State

A `StatefulWidget` can change its own appearance over time. It has two classes: the Widget (immutable configuration) and the State (mutable data).

```dart
// StatefulWidget requires TWO classes:
// 1. The Widget class (configuration — immutable)
// 2. The State class (actual state — mutable, persists across rebuilds)

class CounterWidget extends StatefulWidget {
  final String label;   // configuration passed in

  const CounterWidget({super.key, required this.label});

  // createState() connects the Widget to its State
  @override
  State<CounterWidget> createState() => _CounterWidgetState();
}

// The State class — this is where mutable data lives
// _CounterWidgetState is private by convention (underscore prefix)
class _CounterWidgetState extends State<CounterWidget> {
  int _count = 0;    // mutable state — persists across widget rebuilds

  void _increment() {
    // setState() tells Flutter: "I changed something, please rebuild"
    // Without setState(), _count changes but the UI does NOT update
    setState(() {
      _count++;
    });
  }

  @override
  Widget build(BuildContext context) {
    // build() is called every time setState() is called
    return Column(
      children: [
        Text('${widget.label}: $_count'),  // widget. accesses the StatefulWidget's config
        ElevatedButton(
          onPressed: _increment,
          child: const Text('+'),
        ),
      ],
    );
  }
}
```

### The Rule: When to Use Which

```
StatelessWidget when:
  - You only display data passed in from outside
  - The widget never changes itself
  - Examples: CitationTile, UserAvatar, StatusBadge

StatefulWidget when:
  - The widget has LOCAL UI state that changes
  - Examples: dropdown open/closed, text field content,
              animation progress, tab selection
  - But: if the state needs to be shared with other widgets,
         it does NOT belong here — use a state management solution
```

---

### 🎯 Practice — Level 1

**Question**: A developer writes a `PaymentButton` as a `StatelessWidget`. When the user taps it, nothing happens. They move all tap logic to `setState()` but get a compile error — "Method 'setState' not defined for class 'PaymentButton'". What is wrong, and how do you fix it?

<details><summary>Answer</summary>

`setState()` only exists in the `State` class of a `StatefulWidget`. `StatelessWidget` has no `State` class and cannot call `setState()`.

If the `PaymentButton` needs to react to taps by changing its own appearance (e.g., showing a loading spinner after tap), it needs to become a `StatefulWidget`:

```dart
// Before (wrong — can't call setState in StatelessWidget)
class PaymentButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        setState(() { isLoading = true; }); // ❌ compile error
      },
      child: Text('Pay'),
    );
  }
}

// After (correct — StatefulWidget with loading state)
class PaymentButton extends StatefulWidget {
  final VoidCallback onPay;
  const PaymentButton({super.key, required this.onPay});

  @override
  State<PaymentButton> createState() => _PaymentButtonState();
}

class _PaymentButtonState extends State<PaymentButton> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: _isLoading ? null : () async {
        setState(() => _isLoading = true);
        await widget.onPay();  // call the callback passed in
        if (mounted) setState(() => _isLoading = false);
        // mounted check: don't call setState if widget was removed from tree
      },
      child: _isLoading
          ? const SizedBox(
              width: 20, height: 20,
              child: CircularProgressIndicator(strokeWidth: 2))
          : const Text('Pay'),
    );
  }
}
```

</details>

---

## 5. The Widget Lifecycle

For `StatefulWidget`, the `State` object has a lifecycle:

```
StatefulWidget first inserted into tree
               │
               ▼
         createState()     ← Flutter creates the State object once
               │
               ▼
         initState()       ← First call. One-time setup:
               │            subscribe to streams, init controllers,
               │            fetch initial data. Call super.initState() first.
               │
               ▼
         build()           ← Returns widget tree. Called after initState()
               │            and every time setState() is called.
               │
          Widget in tree — interactive
               │
    ┌──────────┴──────────┐
    │    setState called  │  ← data changes
    │         │           │
    │         ▼           │
    │      build()        │  ← rebuilt with new state
    └─────────────────────┘
               │
    Parent changes the widget configuration
               │
               ▼
         didUpdateWidget()  ← Called when parent passes new config.
               │              Cancel old subscriptions, start new ones if needed.
               │
    Widget removed from tree (user navigates away)
               │
               ▼
         deactivate()       ← Widget temporarily removed (may come back)
               │
               ▼
         dispose()          ← Final call. Clean up:
                              cancel stream subscriptions,
                              dispose controllers (TextEditingController,
                              AnimationController), close DB connections.
```

### The `mounted` Check — Critical Async Pattern

```dart
class _PaymentScreenState extends State<PaymentScreen> {

  Future<void> processPayment() async {
    final result = await paymentService.pay(amount: 150.0);  // async — takes 2 seconds

    // User might have navigated away during those 2 seconds!
    // If they did, this widget is disposed — calling setState would crash
    if (!mounted) return;  // ← always check mounted after any await

    setState(() {
      paymentResult = result;
    });
  }
}
```

---

## 6. Navigation — Routing Between Screens

### Navigator 1.0 (Imperative — Simple Apps)

```dart
// Push (navigate forward)
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => CitationDetailScreen(citationId: 'CIT-001'),
  ),
);

// Pop (go back)
Navigator.pop(context);

// Pop with a result (the previous screen receives it)
Navigator.pop(context, 'payment_complete');

// Push and remove all previous routes (e.g., after login)
Navigator.pushAndRemoveUntil(
  context,
  MaterialPageRoute(builder: (context) => HomeScreen()),
  (route) => false,  // remove ALL previous routes
);

// Named routes (define in MaterialApp, use by name)
Navigator.pushNamed(context, '/payment', arguments: {'citationId': 'CIT-001'});
```

### go_router (Recommended for Most Apps)

`go_router` is Flutter's recommended routing package. It supports deep links, URL-based routing, and nested navigation cleanly:

```dart
// Route configuration (typically in a separate file)
final router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomeScreen(),
      routes: [
        // Nested route — /home/citations
        GoRoute(
          path: 'citations',
          builder: (context, state) => const CitationListScreen(),
        ),
        // Route with parameter — /home/citations/CIT-001
        GoRoute(
          path: 'citations/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return CitationDetailScreen(citationId: id);
          },
        ),
      ],
    ),
    GoRoute(
      path: '/payment/:citationId',
      builder: (context, state) {
        final citationId = state.pathParameters['citationId']!;
        return PaymentScreen(citationId: citationId);
      },
    ),
  ],
  // Redirect — like middleware for routing
  redirect: (context, state) {
    final isLoggedIn = authService.isLoggedIn;
    if (!isLoggedIn && state.matchedLocation != '/login') {
      return '/login';  // force to login if not authenticated
    }
    return null;  // null = no redirect, proceed normally
  },
);

// Navigate using go_router
context.go('/home');                         // replace current location
context.push('/payment/CIT-001');            // push onto stack
context.pop();                               // go back
context.goNamed('citationDetail', pathParameters: {'id': 'CIT-001'});
```

---

## 7. State Management — From Simple to Enterprise

This is the most important section in this chapter. Flutter has more state management options than any other mobile framework. Here is how they all fit together.

### Level 1 (Simple): setState

Use `setState` only for **local widget state** — state that belongs to ONE widget and is not needed anywhere else.

```dart
// Good use of setState — only this widget cares about it
class _ToggleState extends State<ToggleWidget> {
  bool _isExpanded = false;  // nobody else needs to know about this

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: () => setState(() => _isExpanded = !_isExpanded),
          child: Row(
            children: [
              const Text('Details'),
              Icon(_isExpanded ? Icons.expand_less : Icons.expand_more),
            ],
          ),
        ),
        if (_isExpanded) const Text('Extra detail content here'),
      ],
    );
  }
}
```

**When `setState` breaks**: The moment two different widgets need the same piece of state, `setState` becomes a problem. You have to "lift state up" to their common ancestor — which may be far up the tree — and pass data down through many widget layers ("prop drilling").

### Level 2 (Intermediate): Provider

Provider is the official Flutter team recommended package for small-to-medium apps. It uses `InheritedWidget` under the hood to efficiently propagate state through the widget tree.

```dart
// 1. Define the ChangeNotifier (the state holder)
class CitationListNotifier extends ChangeNotifier {
  List<Citation> _citations = [];
  bool _isLoading = false;
  String? _error;

  List<Citation> get citations => List.unmodifiable(_citations);
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchCitations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();  // notify UI to rebuild (like setState — but for all listeners)

    try {
      _citations = await apiClient.fetchCitations();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();  // notify again after data arrives
    }
  }

  void markAsPaid(String id) {
    final index = _citations.indexWhere((c) => c.id == id);
    if (index != -1) {
      _citations[index] = _citations[index].copyWith(status: 'PAID');
      notifyListeners();
    }
  }
}

// 2. Provide it at the right level in the widget tree
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => CitationListNotifier(),
      child: const MyApp(),
    ),
  );
}

// 3. Consume it in any widget below the provider
class CitationListScreen extends StatelessWidget {
  const CitationListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // context.watch — rebuilds this widget when notifier changes
    final notifier = context.watch<CitationListNotifier>();

    if (notifier.isLoading) return const CircularProgressIndicator();
    if (notifier.error != null) return Text('Error: ${notifier.error}');

    return ListView.builder(
      itemCount: notifier.citations.length,
      itemBuilder: (context, index) {
        return CitationTile(
          citation: notifier.citations[index],
          // context.read — does NOT rebuild widget, just reads once
          onTap: () => context.read<CitationListNotifier>()
              .markAsPaid(notifier.citations[index].id),
        );
      },
    );
  }
}

// context.select — rebuild only when a specific field changes (optimization)
final isLoading = context.select<CitationListNotifier, bool>(
  (notifier) => notifier.isLoading,
);
// Only rebuilds when isLoading changes, not when citations list changes
```

### Level 3 (Intermediate-Advanced): Riverpod

Riverpod is the evolution of Provider by the same author. It fixes Provider's biggest problems: providers can be defined anywhere (no need to wrap in the tree), they are compile-time safe, and they support async out of the box.

```dart
// Riverpod — providers defined at top level (global but scoped)
// No BuildContext needed to define them

// Simple value provider
final userIdProvider = Provider<String>((ref) => 'USR-001');

// Async provider — fetches data and handles loading/error states
final citationsProvider = FutureProvider<List<Citation>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  return apiClient.fetchCitations();
});

// StateNotifier provider — full state machine with actions
final citationListProvider =
    StateNotifierProvider<CitationListNotifier, CitationListState>((ref) {
  return CitationListNotifier(ref.read(apiClientProvider));
});

class CitationListNotifier extends StateNotifier<CitationListState> {
  final APIClient _api;

  CitationListNotifier(this._api) : super(const CitationListState.loading()) {
    fetchCitations();
  }

  Future<void> fetchCitations() async {
    state = const CitationListState.loading();
    try {
      final citations = await _api.fetchCitations();
      state = CitationListState.loaded(citations);
    } catch (e) {
      state = CitationListState.error(e.toString());
    }
  }
}

// State is a sealed class (exhaustive pattern matching)
sealed class CitationListState {
  const CitationListState();
  const factory CitationListState.loading() = _Loading;
  const factory CitationListState.loaded(List<Citation> citations) = _Loaded;
  const factory CitationListState.error(String message) = _Error;
}

// In UI — ConsumerWidget replaces StatelessWidget
class CitationListScreen extends ConsumerWidget {
  const CitationListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // ref.watch — Riverpod's equivalent of context.watch
    final state = ref.watch(citationListProvider);

    return switch (state) {
      _Loading()  => const CircularProgressIndicator(),
      _Error(:final message) => Text('Error: $message'),
      _Loaded(:final citations) => ListView.builder(
          itemCount: citations.length,
          itemBuilder: (context, i) => CitationTile(citation: citations[i]),
        ),
    };
  }
}
```

### Level 4 (Enterprise): BLoC Pattern

BLoC (Business Logic Component) is the most structured, most testable, and most opinionated pattern. It enforces a strict separation between Events (what the user does), States (what the UI shows), and the BLoC (the logic that maps events to states).

```
USER INTERACTION             BLoC                     UI
─────────────────     ──────────────────────    ──────────────────
Tap "Load" button ──► CitationLoadRequested ──► CitationLoading state ──► show spinner
                       │                         │
                       │ (fetch from API)        │
                       ▼                         ▼
                  CitationLoaded event ──► CitationLoaded state ──► show list
                       │                         │
                  CitationError event  ──► CitationError state  ──► show error
```

```dart
// 1. Events — things the user or system triggers
abstract class CitationEvent {}

class CitationLoadRequested extends CitationEvent {}

class CitationRefreshRequested extends CitationEvent {}

class CitationPaid extends CitationEvent {
  final String citationId;
  CitationPaid(this.citationId);
}

// 2. States — what the UI can show
abstract class CitationState {}

class CitationInitial extends CitationState {}
class CitationLoading extends CitationState {}

class CitationLoaded extends CitationState {
  final List<Citation> citations;
  CitationLoaded(this.citations);
}

class CitationError extends CitationState {
  final String message;
  CitationError(this.message);
}

// 3. BLoC — maps events to states
class CitationBloc extends Bloc<CitationEvent, CitationState> {
  final CitationRepository _repository;

  CitationBloc({required CitationRepository repository})
      : _repository = repository,
        super(CitationInitial()) {
    // Register event handlers
    on<CitationLoadRequested>(_onLoadRequested);
    on<CitationRefreshRequested>(_onRefreshRequested);
    on<CitationPaid>(_onPaid);
  }

  Future<void> _onLoadRequested(
    CitationLoadRequested event,
    Emitter<CitationState> emit,
  ) async {
    emit(CitationLoading());  // tell UI: show spinner
    try {
      final citations = await _repository.fetchCitations();
      emit(CitationLoaded(citations));  // tell UI: show list
    } catch (e) {
      emit(CitationError(e.toString()));  // tell UI: show error
    }
  }

  Future<void> _onRefreshRequested(
    CitationRefreshRequested event,
    Emitter<CitationState> emit,
  ) async {
    // Refresh without showing the full-screen spinner
    final currentState = state;
    if (currentState is CitationLoaded) {
      try {
        final citations = await _repository.fetchCitations();
        emit(CitationLoaded(citations));
      } catch (_) {
        // On refresh failure, keep showing the old data
        // Don't show error — just fail silently (better UX)
      }
    }
  }

  Future<void> _onPaid(
    CitationPaid event,
    Emitter<CitationState> emit,
  ) async {
    final currentState = state;
    if (currentState is CitationLoaded) {
      final updated = currentState.citations.map((c) {
        return c.id == event.citationId ? c.copyWith(status: 'PAID') : c;
      }).toList();
      emit(CitationLoaded(updated));  // optimistic update — instant UI response
    }
  }
}

// 4. In the UI — BlocBuilder rebuilds on state change
class CitationListScreen extends StatelessWidget {
  const CitationListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => CitationBloc(repository: CitationRepository())
        ..add(CitationLoadRequested()),  // trigger load on creation
      child: BlocBuilder<CitationBloc, CitationState>(
        builder: (context, state) {
          return switch (state) {
            CitationInitial() => const SizedBox.shrink(),
            CitationLoading() => const CircularProgressIndicator(),
            CitationError(:final message) => Column(children: [
                Text('Error: $message'),
                ElevatedButton(
                  onPressed: () => context.read<CitationBloc>()
                      .add(CitationLoadRequested()),
                  child: const Text('Retry'),
                ),
              ]),
            CitationLoaded(:final citations) => RefreshIndicator(
                onRefresh: () async => context.read<CitationBloc>()
                    .add(CitationRefreshRequested()),
                child: ListView.builder(
                  itemCount: citations.length,
                  itemBuilder: (context, i) => CitationTile(
                    citation: citations[i],
                    onPay: () => context.read<CitationBloc>()
                        .add(CitationPaid(citations[i].id)),
                  ),
                ),
              ),
            _ => const SizedBox.shrink(),
          };
        },
      ),
    );
  }
}
```

---

### 🎯 Practice — Level 2 (Intermediate)

**Question**: Compare `setState`, `Provider`, and `BLoC` for this scenario: a shopping cart where items can be added from any screen and the cart badge count must update everywhere. Which tool fits best and why?

<details><summary>Answer</summary>

**`setState`: Cannot work** — it's local to one widget. When you add an item from `ProductDetailScreen`, `CartBadgeWidget` in the app bar (a completely different widget subtree) would not know about it. You'd have to find a common ancestor for all screens — which is the root `MaterialApp`. This is prop drilling that becomes unmanageable.

**`Provider`: Good fit** — this is exactly the cross-widget state sharing use case Provider solves.

```dart
class CartNotifier extends ChangeNotifier {
  final List<CartItem> _items = [];
  int get itemCount => _items.length;

  void addItem(CartItem item) {
    _items.add(item);
    notifyListeners();  // ALL widgets watching this update instantly
  }
}

// ProvideD at MaterialApp level → available everywhere
ChangeNotifierProvider(create: (_) => CartNotifier(), child: MaterialApp(...))

// ProductDetailScreen — adds item
context.read<CartNotifier>().addItem(item);

// AppBarBadge — shows count
final count = context.watch<CartNotifier>().itemCount;
```

**`BLoC`: Also works, but is overkill** for a simple counter. BLoC adds a lot of boilerplate (CartEvent, CartState, CartBloc) where ChangeNotifier+Provider is 10x simpler.

**When BLoC IS the right choice here**: If adding to cart involves:

- An async API call (inventory check)
- Multiple possible outcomes (success, out of stock, network error)
- Undo functionality
- Analytics events triggered on state transitions

Then BLoC's explicit Event → State mapping makes the complexity manageable and testable.

**The rule**:

- Local UI state → `setState`
- Shared state, mostly sync → `Provider` (ChangeNotifier)
- Complex async flows, multiple outcomes, enterprise teams → `BLoC`
- Modern apps, team preference for less boilerplate than BLoC → `Riverpod`

</details>

---

## 8. Networking — http and Dio

### The http Package (Simple, Official)

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class CitationAPIClient {
  static const baseUrl = 'https://api.myapp.com';
  final http.Client _client;

  CitationAPIClient({http.Client? client})
      : _client = client ?? http.Client();  // injected for testing

  Future<List<Citation>> fetchCitations() async {
    final uri = Uri.parse('$baseUrl/citations');
    final response = await _client.get(uri, headers: {
      'Authorization': 'Bearer ${AuthToken.current}',
      'Content-Type': 'application/json',
    });

    switch (response.statusCode) {
      case 200:
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Citation.fromJson(json)).toList();
      case 401:
        throw UnauthorizedException();
      case 404:
        return [];
      default:
        throw APIException(statusCode: response.statusCode, body: response.body);
    }
  }

  Future<PaymentResult> payCitation(String id, double amount) async {
    final uri = Uri.parse('$baseUrl/citations/$id/pay');
    final response = await _client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'amount': amount}),
    );
    if (response.statusCode != 200) {
      throw APIException(statusCode: response.statusCode, body: response.body);
    }
    return PaymentResult.fromJson(jsonDecode(response.body));
  }
}
```

### Dio (Full-Featured, Production Choice)

Dio is the most popular Flutter HTTP client. It adds interceptors, automatic JSON serialization, download progress, and cancelable requests:

```dart
import 'package:dio/dio.dart';

class DioClient {
  late final Dio _dio;

  DioClient() {
    _dio = Dio(BaseOptions(
      baseUrl: 'https://api.myapp.com',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    // Interceptors — run before/after every request
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        // Add auth token to every request
        options.headers['Authorization'] = 'Bearer ${AuthToken.current}';
        handler.next(options);  // continue
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // Token expired — trigger refresh flow
          authService.refreshToken().then((_) => handler.retry(error.requestOptions));
        } else {
          handler.next(error);
        }
      },
    ));

    // Logging interceptor (only in debug mode)
    _dio.interceptors.add(LogInterceptor(responseBody: true));
  }

  Future<List<Citation>> fetchCitations() async {
    final response = await _dio.get<List<dynamic>>('/citations');
    return response.data!.map((json) => Citation.fromJson(json)).toList();
  }
}
```

---

## 9. Local Storage — Preferences, SQLite, Hive

| Package | Use Case |
|---|---|
| `shared_preferences` | Simple key-value: theme, userId, last-sync time |
| `sqflite` | Structured relational data (like Room/Core Data) |
| `drift` | Type-safe SQLite ORM (recommended over sqflite) |
| `hive` | Fast NoSQL key-value store — good for offline cache |
| `isar` | Modern NoSQL DB — faster than Hive, typed |

```dart
// shared_preferences — for simple key-value
import 'package:shared_preferences/shared_preferences.dart';

class UserPreferences {
  static const _keyUserId = 'user_id';
  static const _keyTheme = 'theme';

  Future<void> saveUserId(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUserId, userId);
  }

  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyUserId);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}

// Hive — for structured offline cache
import 'package:hive_flutter/hive_flutter.dart';

// HiveObject — data model
@HiveType(typeId: 0)
class CachedCitation extends HiveObject {
  @HiveField(0) late String id;
  @HiveField(1) late double amount;
  @HiveField(2) late String status;
}

// Usage
final box = await Hive.openBox<CachedCitation>('citations');
await box.put('CIT-001', CachedCitation()
  ..id = 'CIT-001'
  ..amount = 150.0
  ..status = 'PENDING');

final citation = box.get('CIT-001');  // fast O(1) lookup
```

---

## 10. Flutter Testing Pyramid — Four Levels

Flutter has an extra testing layer compared to Android/iOS:

```
                        ▲
                       / \
                      /   \
                     / E2E \       ← Appium Flutter Driver (few, cross-platform)
                    /       \
                   /─────────\
                  /Integration\   ← integration_test package (device tests)
                 /    Tests    \
                /───────────────\
               /  Widget Tests   \  ← flutter_test widget pump (no real device)
              /                   \
             /──────────────────── \
            /    Unit Tests         \ ← Pure Dart logic tests (fastest)
           / _______________________ \
```

| Layer       | Tool                               | Runs On                 | Speed    | Cost      |
| ----------- | ---------------------------------- | ----------------------- | -------- | --------- |
| Unit        | `flutter_test`                     | JVM/Dart VM, no device  | ~10ms    | Cheapest  |
| Widget      | `flutter_test` with `WidgetTester` | Dart VM, no device      | ~100ms   | Cheap     |
| Integration | `integration_test` package         | Real device or emulator | ~5-30s   | Medium    |
| E2E         | Appium Flutter Driver              | Real device or emulator | ~30-120s | Expensive |

---

## 11. Level 1: Unit Tests

Flutter unit tests are pure Dart — no Flutter framework, no device:

```dart
// test/citation_repository_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:http/testing.dart';

void main() {
  group('CitationListNotifier', () {
    late MockCitationAPIClient mockApi;
    late CitationListNotifier notifier;

    setUp(() {
      mockApi = MockCitationAPIClient();
      notifier = CitationListNotifier(apiClient: mockApi);
    });

    tearDown(() {
      notifier.dispose();
    });

    test('initial state is empty and not loading', () {
      expect(notifier.citations, isEmpty);
      expect(notifier.isLoading, isFalse);
      expect(notifier.error, isNull);
    });

    test('fetchCitations sets loading then populates citations', () async {
      // Given
      mockApi.citationsToReturn = [
        Citation(id: 'CIT-001', amount: 150.0, status: 'PENDING'),
        Citation(id: 'CIT-002', amount: 200.0, status: 'PAID'),
      ];

      // Track state changes
      final states = <bool>[];
      notifier.addListener(() => states.add(notifier.isLoading));

      // When
      await notifier.fetchCitations();

      // Then — states went: true (loading) then false (done)
      expect(states, [true, false]);
      expect(notifier.citations.length, equals(2));
      expect(notifier.citations[0].id, equals('CIT-001'));
      expect(notifier.error, isNull);
    });

    test('fetchCitations on API error sets error message', () async {
      mockApi.errorToThrow = Exception('Network error');

      await notifier.fetchCitations();

      expect(notifier.citations, isEmpty);
      expect(notifier.isLoading, isFalse);
      expect(notifier.error, contains('Network error'));
    });

    test('markAsPaid updates citation status', () async {
      mockApi.citationsToReturn = [
        Citation(id: 'CIT-001', amount: 150.0, status: 'PENDING'),
      ];
      await notifier.fetchCitations();

      notifier.markAsPaid('CIT-001');

      expect(notifier.citations[0].status, equals('PAID'));
    });
  });

  // BLoC unit test
  group('CitationBloc', () {
    late CitationBloc bloc;
    late MockCitationRepository mockRepo;

    setUp(() {
      mockRepo = MockCitationRepository();
      bloc = CitationBloc(repository: mockRepo);
    });

    tearDown(() => bloc.close());

    test('emits Loading then Loaded on CitationLoadRequested', () async {
      mockRepo.citationsToReturn = [
        Citation(id: 'CIT-001', amount: 150.0, status: 'PENDING'),
      ];

      // bloc_test package provides expectLater for stream testing
      await expectLater(
        bloc.stream,
        emitsInOrder([
          isA<CitationLoading>(),
          isA<CitationLoaded>(),
        ]),
      );

      bloc.add(CitationLoadRequested());
    });

    test('emits Loading then Error on repository failure', () async {
      mockRepo.errorToThrow = Exception('DB offline');

      bloc.add(CitationLoadRequested());

      await expectLater(
        bloc.stream,
        emitsInOrder([
          isA<CitationLoading>(),
          isA<CitationError>(),
        ]),
      );
    });
  });
}
```

---

## 12. Level 2: Widget Tests

Widget tests render Flutter widgets in a test environment without a real device. They are Flutter-specific — there is no equivalent in Android or iOS without running on a device.

```dart
// test/citation_list_screen_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('CitationListScreen', () {

    // Helper to create the widget wrapped in the required providers
    Widget buildTestWidget({required CitationListNotifier notifier}) {
      return ChangeNotifierProvider<CitationListNotifier>.value(
        value: notifier,
        child: const MaterialApp(
          home: CitationListScreen(),
        ),
      );
    }

    testWidgets('shows loading indicator while loading', (tester) async {
      final notifier = MockCitationListNotifier(isLoading: true);

      // pumpWidget: renders the widget tree in the test environment
      await tester.pumpWidget(buildTestWidget(notifier: notifier));

      // Verify loading indicator is visible
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.byType(ListView), findsNothing);
    });

    testWidgets('shows citations when loaded', (tester) async {
      final notifier = MockCitationListNotifier(
        citations: [
          Citation(id: 'CIT-001', amount: 150.0, status: 'PENDING'),
          Citation(id: 'CIT-002', amount: 200.0, status: 'PAID'),
        ],
      );

      await tester.pumpWidget(buildTestWidget(notifier: notifier));
      // pumpAndSettle: runs the event loop until all animations complete
      await tester.pumpAndSettle();

      expect(find.text('CIT-001'), findsOneWidget);
      expect(find.text('\$150.00'), findsOneWidget);
      expect(find.text('CIT-002'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('shows error message with retry button on error', (tester) async {
      final notifier = MockCitationListNotifier(error: 'Network failed');

      await tester.pumpWidget(buildTestWidget(notifier: notifier));
      await tester.pumpAndSettle();

      expect(find.text('Error: Network failed'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });

    testWidgets('tapping retry calls fetchCitations', (tester) async {
      final notifier = MockCitationListNotifier(error: 'Network failed');
      int fetchCallCount = 0;
      notifier.onFetch = () => fetchCallCount++;

      await tester.pumpWidget(buildTestWidget(notifier: notifier));
      await tester.pumpAndSettle();

      // Tap the retry button
      await tester.tap(find.text('Retry'));
      await tester.pump();  // process the tap event

      expect(fetchCallCount, equals(1));
    });

    testWidgets('scrolling reveals more items', (tester) async {
      final manyItems = List.generate(
        20,
        (i) => Citation(id: 'CIT-${i.toString().padLeft(3, '0')}',
                        amount: (i + 1) * 10.0,
                        status: 'PENDING'),
      );
      final notifier = MockCitationListNotifier(citations: manyItems);

      await tester.pumpWidget(buildTestWidget(notifier: notifier));
      await tester.pumpAndSettle();

      // First item visible
      expect(find.text('CIT-000'), findsOneWidget);

      // Last item NOT visible yet (off-screen)
      expect(find.text('CIT-019'), findsNothing);

      // Scroll down
      await tester.scrollUntilVisible(
        find.text('CIT-019'),
        500.0,  // scroll by 500 logical pixels at a time
      );

      expect(find.text('CIT-019'), findsOneWidget);
    });
  });
}
```

---

### 🎯 Practice — Level 3 (Advanced)

**Challenge**: Write a widget test for a payment form with these requirements:

1. Submit button disabled when amount field is empty
2. Submit button enabled when amount > 0 is entered
3. Tapping Submit shows a confirmation dialog
4. Confirming in the dialog calls `onPaymentConfirmed` callback

<details><summary>Answer</summary>

```dart
testWidgets('PaymentForm — full interaction flow', (tester) async {
  bool paymentConfirmed = false;

  await tester.pumpWidget(
    MaterialApp(
      home: PaymentForm(
        onPaymentConfirmed: (amount) {
          paymentConfirmed = true;
        },
      ),
    ),
  );

  // 1. Submit button disabled with empty amount
  final submitButton = find.widgetWithText(ElevatedButton, 'Submit');
  expect(tester.widget<ElevatedButton>(submitButton).onPressed, isNull,
      reason: 'Button should be disabled (onPressed is null) when amount is empty');

  // 2. Enter amount — button should enable
  await tester.enterText(find.byKey(const Key('amountField')), '150.00');
  await tester.pump();  // process the text change

  expect(tester.widget<ElevatedButton>(submitButton).onPressed, isNotNull,
      reason: 'Button should be enabled when amount is entered');

  // 3. Tap submit — dialog should appear
  await tester.tap(submitButton);
  await tester.pumpAndSettle();  // wait for dialog animation

  expect(find.text('Confirm Payment'), findsOneWidget);
  expect(find.text('You are about to pay \$150.00'), findsOneWidget);

  // 4. Tap Confirm in dialog
  await tester.tap(find.text('Confirm'));
  await tester.pumpAndSettle();

  // Dialog should be gone, callback should have been called
  expect(find.text('Confirm Payment'), findsNothing);
  expect(paymentConfirmed, isTrue);
});

testWidgets('PaymentForm — cancelling dialog keeps form open', (tester) async {
  await tester.pumpWidget(MaterialApp(
    home: PaymentForm(onPaymentConfirmed: (_) {}),
  ));

  await tester.enterText(find.byKey(const Key('amountField')), '75.00');
  await tester.pump();
  await tester.tap(find.widgetWithText(ElevatedButton, 'Submit'));
  await tester.pumpAndSettle();

  // Dialog visible
  expect(find.text('Confirm Payment'), findsOneWidget);

  // Cancel
  await tester.tap(find.text('Cancel'));
  await tester.pumpAndSettle();

  // Dialog gone — form still there with amount intact
  expect(find.text('Confirm Payment'), findsNothing);
  expect(find.text('75.00'), findsOneWidget);
});
```

</details>

---

## 13. Level 3: Integration Tests

Integration tests run on a real device or emulator. They drive the actual Flutter app — not a test environment.

```dart
// integration_test/payment_flow_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:my_app/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Payment E2E Flow', () {

    testWidgets('login and pay a citation', (tester) async {
      // Launch the actual app
      app.main();
      await tester.pumpAndSettle();

      // Login screen
      await tester.enterText(find.byKey(const Key('usernameField')), 'test@user.com');
      await tester.enterText(find.byKey(const Key('passwordField')), 'TestPass123!');
      await tester.tap(find.byKey(const Key('loginButton')));
      await tester.pumpAndSettle(const Duration(seconds: 5));  // wait for nav

      // Home screen — citation list visible
      expect(find.byKey(const Key('citationList')), findsOneWidget);

      // Tap first citation
      await tester.tap(find.byType(CitationTile).first);
      await tester.pumpAndSettle();

      // Detail screen — verify amount
      expect(find.textContaining('\$'), findsOneWidget);

      // Tap Pay
      await tester.tap(find.byKey(const Key('payButton')));
      await tester.pumpAndSettle();

      // Confirmation dialog
      expect(find.text('Confirm Payment'), findsOneWidget);
      await tester.tap(find.text('Confirm'));
      await tester.pumpAndSettle(const Duration(seconds: 5));  // wait for API

      // Success state
      expect(find.text('Payment Successful'), findsOneWidget);
    });
  });
}
```

Run on a connected device or emulator:

```bash
# Run integration tests on Android
flutter test integration_test/ --device-id emulator-5554

# Run on iOS Simulator
flutter test integration_test/ --device-id 'iPhone 15 Pro Simulator'

# Run on Firebase Test Lab (cloud devices)
gcloud firebase test android run \
  --type instrumentation \
  --app build/app/outputs/apk/debug/app-debug.apk \
  --test build/app/outputs/apk/androidTest/debug/app-debug-androidTest.apk
```

---

## 14. Level 4: Appium Flutter Driver (E2E)

Appium Flutter Driver lets you write ONE test that runs on both Android and iOS Flutter apps using the same code.

```
YOUR TEST (Java/Python/JS)
       │
       │ HTTP (WebDriver)
       ▼
APPIUM SERVER (4723)
       │
       │ Appium Flutter Driver
       │ (plugin: appium-flutter-driver)
       ▼
FLUTTER APP (running on device)
       │
       │ Dart VM Service (port 8888)
       │ Flutter's own testing protocol
       ▼
FLUTTER WIDGET TREE
(bypasses UIAutomator2/XCUITest entirely)
```

### Setup

```bash
# Install Appium Flutter Driver
appium driver install --source npm appium-flutter-driver
```

```java
// Java — Appium Flutter Driver setup
FlutterIntegrationTestDriver options = new FlutterIntegrationTestDriver()
    .setPlatformName("Android")
    .setAutomationName("FlutterIntegration")  // ← the Flutter driver
    .setApp("/path/to/my_flutter_app.apk")
    .setDeviceName("emulator-5554");

AndroidDriver driver = new AndroidDriver(
    new URL("http://localhost:4723"),
    options
);
```

```java
// Finding Flutter widgets
// Flutter driver uses Dart's Flutter test selectors — not accessibility IDs

// By key (most stable — set Key('payButton') in Flutter code)
WebElement payButton = driver.findElement(FlutterBy.key("payButton"));

// By text
WebElement title = driver.findElement(FlutterBy.text("Citations"));

// By semanticsLabel (set via Semantics widget in Flutter)
WebElement icon = driver.findElement(FlutterBy.semanticsLabel("Pay now"));

// By type (find first widget of type)
WebElement listView = driver.findElement(FlutterBy.type("ListView"));

// Full integration test
@Test
public void flutterPaymentFlow_AndroidAndIOS() throws Exception {
    WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));

    // Login
    driver.findElement(FlutterBy.key("usernameField")).sendKeys("test@user.com");
    driver.findElement(FlutterBy.key("passwordField")).sendKeys("TestPass123!");
    driver.findElement(FlutterBy.key("loginButton")).click();

    // Wait for home
    WebElement list = wait.until(
        ExpectedConditions.presenceOfElementLocated(FlutterBy.key("citationList"))
    );
    assertTrue(list.isDisplayed());

    // Tap first item (Flutter driver can scroll to find items in lists)
    driver.findElement(FlutterBy.key("citationTile_CIT-001")).click();

    // Pay
    driver.findElement(FlutterBy.key("payButton")).click();
    driver.findElement(FlutterBy.text("Confirm")).click();

    // Verify success
    WebElement successMessage = wait.until(
        ExpectedConditions.presenceOfElementLocated(FlutterBy.text("Payment Successful"))
    );
    assertTrue(successMessage.isDisplayed());
}
```

---

### 🎯 Practice — Level 3 (Advanced)

**Challenge**: You have a Flutter app. Your Appium Flutter Driver test finds a `ListView` with citations, but it cannot find `citationTile_CIT-050` — it only sees the first ~10 visible items. How do you scroll to find it? Write the code.

<details><summary>Answer</summary>

Flutter's `ListView` uses virtual rendering — just like Android's RecyclerView. Off-screen items don't exist in the Flutter widget tree until they scroll into view.

The Appium Flutter Driver's `scrollUntilVisible` command handles this:

```java
// Java — Appium Flutter Driver

// Method 1: scrollUntilVisible — scroll the ListView until the target is found
WebElement citationList = driver.findElement(FlutterBy.key("citationList"));
WebElement targetItem = driver.findElement(FlutterBy.key("citationTile_CIT-050"));

// scrollUntilVisible(scrollableElement, targetElement, dx, dy, timeout)
// dx, dy = pixels to scroll each step (positive = down/right)
driver.scrollUntilVisible(citationList, targetItem, 0, 300, 5000);
targetItem.click();

// Method 2: execute_script with flutter:scrollTo
// (Appium Flutter Driver custom command)
HashMap<String, Object> args = new HashMap<>();
args.put("locator", FlutterBy.key("citationTile_CIT-050"));
driver.executeScript("flutter:scrollTo", args);

driver.findElement(FlutterBy.key("citationTile_CIT-050")).click();
```

**In the Flutter app**: For this to work, each `CitationTile` must have a `Key`:

```dart
CitationTile(
  key: Key('citationTile_${citation.id}'),
  citation: citation,
)
```

**The broader lesson**: Always assign `Key` values to widgets that are:

- Items in a scrollable list
- Buttons the tests need to tap
- Text fields

This is the Flutter equivalent of Android's `contentDescription` / iOS's `accessibilityIdentifier`. Ask developers to add Keys to all interactive widgets from day one — retrofitting them later is painful.

</details>

---

## 15. Flutter vs Android vs iOS — Comparison

| Concept | Flutter | Android | iOS |
|---|---|---|---|
| Language | Dart | Kotlin/Java | Swift/Obj-C |
| UI rendering | Own engine (Skia) | Native Views | Native UIKit |
| Platforms | 6 platforms | Android only | iOS/macOS only |
| Screen unit | Widget | Activity | UIViewController |
| Local state | setState | ViewModel | `@State` |
| Shared state (simple) | Provider | ViewModel | `@EnvironmentObject` |
| Shared state (enterprise) | BLoC / Riverpod | Hilt + MVI | TCA / Redux |
| Navigation | go_router | Jetpack Nav | NavigationStack |
| Unit tests | flutter_test | JUnit 5 | XCTest |
| Widget/UI tests | WidgetTester | Espresso | XCUITest |
| Integration tests | integration_test | Appium | Appium |
| E2E (cross-platform) | Appium Flutter | Appium UIAutomator2 | Appium XCUITest |
| Test selector type | Key / Semantics | Resource ID | accessibilityID |
| Hot reload | YES (sub-second) | No | No |
| Native-feel UI | Approximated | Native | Native |
| Accessibility tree | Flutter's own | Android a11y | iOS a11y tree |
| CI macOS required | No (Android CI) | No | YES |

---

## 16. Interview Questions on Flutter

**Q: "What is the difference between StatelessWidget and StatefulWidget?"**

> "A `StatelessWidget` is immutable — it takes configuration from its parent and renders it. It never changes itself. A `StatefulWidget` has a `State` object that persists across rebuilds and can call `setState()` to trigger re-renders. The rule: use StatelessWidget by default. Use StatefulWidget only when the widget needs local state that changes over time — like an expanded/collapsed toggle, or form field tracking. If the state needs to be shared with other widgets, it belongs in a ViewModel or state management solution, not inside a StatefulWidget."

**Q: "Why can't Appium UIAutomator2 find widgets in a Flutter app?"**

> "UIAutomator2 queries Android's accessibility tree — the system-level UI hierarchy built from native Views. Flutter doesn't create native Android Views; it uses a single SurfaceView as a canvas and draws everything itself with its own rendering engine. From UIAutomator2's perspective, the entire app is one opaque canvas with no accessible children. The correct tool is either the `integration_test` package (which runs inside the Flutter engine) or the Appium Flutter Driver (which connects to Flutter's Dart VM service to query the Flutter widget tree directly)."

**Q: "Compare Provider, Riverpod, and BLoC — when would you use each?"**

> "Provider is Flutter's recommended package for small-to-medium apps — simple ChangeNotifier-based state, low boilerplate, good for shared widget state. Riverpod is Provider's evolution — it's compile-time safe, providers are global and testable without BuildContext, and it handles async natively. I'd choose Riverpod for most new apps. BLoC is the most structured option: explicit Events, States, and a BLoC that maps one to the other. It generates a lot of boilerplate but is extremely testable and predictable for complex async flows with multiple outcomes — like multi-step checkout, real-time order tracking, or large team projects where consistency matters more than brevity."

---

**Navigation**: [← iOS Native](03_iOS_Native_Dev_And_Testing.md) | [📚 Folder Context](CONTEXT.md) | [Mobile Web & Hybrid →](05_Mobile_Web_And_Hybrid_Playwright.md)


---

## Reality Check

**"Flutter is write-once-run-everywhere, solving cross-platform"** ? Flutter's single-codebase-multiple-platforms is real and carries the cross-platform trade-offs every such framework has: the platform-specific behavior that still needs branching (the iOS-versus-Android conventions, the platform channels to reach native APIs Flutter does not wrap — the escape hatch that is real native code per platform), the "looks native" that is actually Flutter's own rendering (the app that renders its own widgets rather than using platform UI — a strength for consistency and a divergence from true platform look-and-feel), and the plugin ecosystem gaps (the native capability with no good Flutter plugin, requiring native code). "Solving cross-platform" is the pitch; the reality is a strong single-codebase story with real seams at platform-specific behavior, native-API access, and the rendering-its-own-UI trade-off — the [01] cross-platform-costs lesson, Flutter flavor.

**"Flutter's widget tree is just its UI syntax"** ? The widget tree is a DECLARATIVE, reactive model ([15_React, Compose, SwiftUI]'s shared paradigm — Flutter is another instance of UI-as-function-of-state): the StatefulWidget-versus-StatelessWidget distinction (the [15_React] state ownership), the setState triggering rebuild (the [15_React] re-render — and the same performance concern of rebuilding too much, the const constructors and keys that are Flutter's optimization levers), the state management debate (the [15_React] state-management question — Provider, Riverpod, Bloc, the same "where does state live" [15_React/04]), and the build-method-as-pure-function-of-state discipline. "UI syntax" misses that Flutter's widget tree is the same declarative-reactive paradigm as React/Compose/SwiftUI — and the developer who treats it as markup, mutating things imperatively, fights the rebuild model exactly as the [15_React] imperative-thinker does.

**"Dart is just Flutter's language, incidental to learning it"** ? Dart's features shape Flutter development meaningfully: the sound null safety (the [17_TS] strictNullChecks equivalent — the null handling that prevents a class of crashes, the ? and ! and late that the Flutter code is full of), the async model (Future and Stream, async/await [13_DE concurrency, 16_JS] — the same async reasoning), the const and immutability (the widget const-constructor optimization tied to Dart's const), and the JIT-for-dev-hot-reload versus AOT-for-release-performance compilation (the [uncommitted deep-dive work] that explains why Flutter's hot reload is fast and release builds are performant). "Incidental" undersells that Dart's null safety, async model, and compilation strategy are load-bearing for Flutter — and understanding them (not just Flutter's widgets) is what separates fluent Flutter development from copy-paste widget assembly.

**"Testing Flutter is testing widgets"** ? Flutter testing is a LAYERED pyramid with Flutter-specific tooling: unit tests (pure Dart logic — fast, no Flutter), WIDGET tests (the widget rendered in a test harness, pumped and interacted with — the [21_SDET] behavior testing, Flutter's fast in-process UI test that is the sweet spot — faster than [15_React]'s browser tests because Flutter controls its own rendering), and integration tests (the full app on a device/emulator — the slow end-to-end). The layering follows [13_DE testing]'s pyramid, and Flutter's advantage is the widget test (the fast, headless, full-UI-logic test that needs no device) — plus the Flutter-specific challenges (the pump-and-settle for animations [21_SDET Ch26], the async widget testing). "Testing widgets" is the middle layer; the discipline is the pyramid (unit, widget, integration) with Flutter's efficient widget-test tier as the workhorse.

**"Flutter performance is automatic since it's compiled"** ? AOT compilation gives Flutter good baseline performance and does NOT prevent the performance bugs that come from the widget model and rendering: the excessive rebuilds (the setState too high in the tree rebuilding too much — the [15_React] blast-radius, the const-constructors and granular state that fix it), the expensive build methods (work in build that runs every rebuild — the [15_React] derive-at-render cost), the jank from heavy work on the main isolate (the [13_DE concurrency] main-thread-blocking, Flutter's isolates for offloading — the [16_JS] Web Worker equivalent), the large widget rebuilds during animation (the 60fps budget [21_SDET Ch61, JS rendering]), and the image and list performance (the ListView.builder lazy loading versus building everything). "Automatic because compiled" is true of the baseline and false where the widget-rebuild model, the main-isolate blocking, and the rendering budget produce jank — the same performance discipline (minimize rebuilds, offload heavy work, lazy-load lists, profile with the tools) as every declarative-UI framework, because AOT compilation does not fix an architecture that rebuilds too much or blocks the render.
