# Week 2 — Flutter Core Concepts
### The mental model you need before writing a single widget

---

> Three lenses run through every concept in this file:
> - 🧑‍💻 **Developer** — how it works in code and what Flutter does internally
> - 🎨 **Designer** — how to think about UI structure and visual decisions
> - 🧪 **Tester** — what to verify, what breaks, what to watch for

---

## Before You Write Any Code

Most beginners jump straight into writing widgets. They copy-paste, get something working, then hit a bug they can't explain — and spend hours confused. This week is about understanding *what Flutter actually is* before you write a line of UI code. Once you have this model, bugs explain themselves.

---

## 1. Flutter Is a Renderer, Not a Wrapper

> 📄 **Flutter Docs (Architectural Overview):**
> *"Flutter differs from other cross-platform frameworks in that Flutter neither uses WebView nor the OEM widgets that ship with each device. Instead, Flutter uses its own high-performance rendering engine to draw widgets."*

Every cross-platform framework before Flutter had the same approach: your code asks the OS to draw something, and the OS draws a native button, a native text field, a native scroll list.

```
React Native / Xamarin approach:
─────────────────────────────────────
Your code (JavaScript / C#)
        ↓ says "draw a button here"
    Bridge (slow — crosses a language boundary)
        ↓
    Native OS
        ↓
iOS UIButton  OR  Android MaterialButton  ← different on every platform
```

The result: subtle differences on each platform, performance bottlenecks at the bridge, and you're limited by what native components can do.

**Flutter works completely differently:**

```
Flutter approach:
─────────────────
Your Dart code
        ↓
Flutter Framework (also Dart — same language, no bridge)
        ↓
Flutter Engine (C++ — called Impeller on modern Flutter)
        ↓ talks directly to GPU
Draws EVERY pixel itself on a canvas
(identical on iOS, Android, Web, Desktop)
```

Flutter does NOT use `UIButton` or `MaterialButton`. When you write `ElevatedButton`, Flutter draws that button itself — every pixel, every shadow, every ripple animation — using its own rendering engine. The operating system just hands Flutter a blank canvas and says "draw here."

**Why this matters:**

🧑‍💻 **Developer:** There's no bridge to cross. Your Dart code calls Flutter framework code, which calls the C++ engine — all in the same process. This is why Flutter is fast. Also why you can build custom UI that no native toolkit would support — curved containers, any shape, any animation — Flutter just draws it.

🎨 **Designer:** Pixel-perfect control. What you design in Figma is achievable exactly — not "as close as the OS lets you get." Custom fonts, custom shapes, custom animations work the same on every platform because Flutter draws them itself.

🧪 **Tester:** A rendering bug on Android is a rendering bug on iOS too — same engine. No more "works on Android, broken on iPhone" due to different native components.

---

## 2. Widgets — The Building Block of All Flutter UI

> 📄 **Flutter Docs (Introduction to Widgets):**
> *"The central idea is that you build your UI out of widgets. Widgets describe what their view should look like given their current configuration and state. When a widget's state changes, the widget rebuilds its description, which the framework diffs against the previous description in order to determine the minimal changes needed in the underlying render tree to transition from one state to the next."*

A **widget** is an immutable description of a part of the UI. The keyword is **immutable** — you cannot change a widget after you create it. If something on screen needs to change, Flutter creates a *new* widget object with the new data.

```dart
// A Text widget is just a Dart object holding a string and styling data
// It doesn't draw anything itself — it's a description
Text('Hello Flutter')

// If the text changes, Flutter creates a completely new Text object
Text('Hello World')   // old one is discarded
```

> 📄 **Flutter Docs:**
> *"Widgets form a hierarchy based on composition. Each widget nests inside, and inherits properties from, its parent widget."*

```dart
// Every part of your UI — padding, color, tap detection — is a widget
Padding(                             // widget that adds space
  padding: EdgeInsets.all(16),
  child: GestureDetector(            // widget that detects taps
    onTap: () => print('tapped'),
    child: Container(                // widget that draws a box
      color: Colors.blue,
      child: Text('Press me'),       // widget that draws text
    ),
  ),
)
```

Even things you wouldn't think of as "visual" — padding, alignment, opacity, gesture detection — are all widgets. Everything is a widget.

🎨 **Designer thinking:** When you look at a design mockup, train yourself to see it as nested boxes. Each box is a widget. The outer box is the layout widget (Column, Row, Stack). The inner boxes are content widgets (Text, Image, Icon). Every piece of padding between elements is its own Padding widget.

```
┌─────────────────────────────┐   ← Card widget
│  ┌────┐  Product Name       │   ← Row widget
│  │img │  ₹999               │   ← Column widget  
│  └────┘  [Add to Cart]      │   ← ElevatedButton widget
└─────────────────────────────┘
```

🧪 **Tester thinking:** Flutter tests find widgets by type (`find.byType(Text)`) or by content (`find.text('Hello')`). Every element of your UI is a named widget you can target precisely in tests. This is a big advantage over web testing where you hunt for DOM elements by CSS class.

---

## 3. The Three Trees Flutter Maintains Internally

> 📄 **Flutter Docs (Architectural Overview):**
> *"Flutter's rendering model involves three separate trees — the widget tree, the element tree, and the render tree — each serving a different purpose in the rendering pipeline."*

This is the most important concept in Flutter. Almost every confusing bug becomes instantly clear once you understand why Flutter has THREE trees.

### The Problem That Needed Solving

Imagine a chat screen. Every time a new message arrives, you want to update the list. But your screen has 50+ widgets: AppBar, tabs, message list, input bar, avatars...

If Flutter destroyed and recreated all 50 widgets from scratch every time — that's 50 objects × 60 frames per second = 3,000 object operations per second just to move one counter from 5 to 6. That's wasteful.

Flutter's solution: separate what you *describe* from what *lives* from what *draws*.

---

### Tree 1 — Widget Tree: Your Blueprints

> 📄 **Flutter Docs:**
> *"A widget is an immutable description of part of a user interface."*

Widgets are immutable Dart objects — just data. No drawing, no layout, no memory of what they looked like before.

```dart
// This is ALL a Text widget is internally — just fields with data
class Text extends Widget {
  final String data;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  // ... more config fields

  const Text(this.data, {this.style, this.textAlign, this.maxLines, ...});
  // No painting code here. No layout code here. Just data.
}
```

Every time your `build()` method runs, it produces a fresh set of widget objects. The old ones are thrown away. This is intentional — widgets are designed to be **cheap to create and cheap to discard**.

🧑‍💻 **Java comparison:** Think of Widget like a DTO (Data Transfer Object) in Java. A `UserResponseDTO` is just a plain object holding data — no logic, no database connections, created freely and GC'd quickly. Widgets work the same way.

```java
// Java DTO — just data, created and discarded freely
class ProductDTO {
    String name;
    double price;
    String imageUrl;
    // No business logic here. Just data.
}
```

```dart
// Flutter Widget — just data, created and discarded freely
ProductCard(
  name: 'MacBook Pro',
  price: 129999,
  imageUrl: 'https://...',
)
```

---

### Tree 2 — Element Tree: The Persistent Working Copy

> 📄 **Flutter Docs:**
> *"The element tree is the 'live' tree that persists across frames. Elements are the link between the widget tree and the render tree."*

When Flutter first builds your app, it creates an **Element** for each widget and stores them in the element tree. Elements are **long-lived** — they survive across rebuilds.

Here's what happens on every `setState()` call:

```
Your build() produces new Widget objects:
─────────────────────────────────────────
 Column        Text('Counter: 6')    ElevatedButton

Flutter compares to existing Elements:
───────────────────────────────────────────────────────────
Old Element holds Text('Counter: 5')   ← still there, alive
                        ↓
Is the new Widget the same TYPE as before?
      YES (Text → Text) → REUSE the Element, just update its reference
      NO  (Text → Icon) → DESTROY old Element, CREATE new one
```

This diffing happens in **O(n)** — one pass through the tree. Elements don't get destroyed unless something genuinely changes type.

> **Why two classes in StatefulWidget?**
> The `StatefulWidget` (the blueprint) gets recreated and thrown away on every parent rebuild. But the `State` object lives inside the Element and **survives rebuilds** — Flutter keeps it alive. The separation exists so the data (`State`) can outlive the blueprint (`Widget`).

```
StatefulWidget lifecycle:
─────────────────────────────────────────────────────────────
Parent rebuilds → creates NEW LikeButton widget  ← thrown away
                          ↓
                 Flutter compares to existing Element
                          ↓
            Element still alive → holds the existing _LikeButtonState
                          ↓
            State survives → _isLiked = true, _count = 43 preserved
```

**What IS `BuildContext`?** The Element IS the BuildContext. When Flutter calls `build(BuildContext context)`, it passes the Element itself as the `context`. The Element knows its position in the tree — who its parent is, what's above it. That's why `Theme.of(context)` can walk up the tree to find the nearest Theme.

---

### Tree 3 — RenderObject Tree: What Actually Gets Drawn

> 📄 **Flutter Docs:**
> *"The render tree is a tree of low-level rendering objects, each of which knows how to lay out and paint itself. The render tree is updated to match changes in the element tree."*

Not every Element paints something. `StatelessWidget` and `StatefulWidget` are *component* elements — they just produce more widgets. Only `RenderObjectWidget` subclasses (like `Text`, `Container`, `Row`, `Column`) create RenderObjects.

```
Element Tree:                         RenderObject Tree:
──────────────────────────────        ────────────────────────────────
MyApp (ComponentElement)              (no RenderObject)
  └─ Column (ComponentElement)    →   RenderFlex (handles layout)
       ├─ Padding (ComponentElement)→   RenderPadding
       │    └─ Text (LeafElement)   →     RenderParagraph (draws glyphs)
       └─ Image (LeafElement)       →   RenderImage (draws pixels)
```

RenderObjects have two jobs:
1. **Layout** — "Given these constraints from my parent, what size am I?"
2. **Paint** — "Draw my pixels onto the canvas."

**Why three trees instead of one?**

| | Widget | Element | RenderObject |
|--|--------|---------|-------------|
| Lives how long? | One frame | Forever (until removed) | Forever (until removed) |
| Holds State? | ❌ (immutable) | ✅ | ❌ |
| Does Layout? | ❌ | ❌ | ✅ |
| Does Painting? | ❌ | ❌ | ✅ |
| Cost to create | Cheap | Medium | Expensive |

If Flutter used one tree, every rebuild would recreate expensive GPU resources. Three trees let Flutter rebuild widgets (cheap) without recreating RenderObjects (expensive) unless layout or painting truly changed.

🎨 **Designer:** This explains why Flutter animations can be buttery smooth even with complex UIs. An animation that just changes opacity doesn't touch the layout tree — only the paint layer updates. The frame budget isn't wasted on things that didn't change.

🧪 **Tester:** Flutter's `find.byType()`, `find.text()`, `find.byKey()` — these all search the **Widget tree**. You never test RenderObjects directly. If you want to verify pixel positions or sizes, use `tester.getRect()` and `tester.getSize()`, which query the RenderObject tree under the hood.

**→ Try this:** Add `print('build() called')` at the top of any `StatefulWidget`'s `build()`. Add a button that calls `setState(() {})` with no actual changes. Press the button 5 times. See how many times `build()` fires and how the app stays smooth despite all those widget creations. The RenderObjects didn't repaint because nothing actually changed.

---

## 4. StatelessWidget — When the UI Is Fixed

> 📄 **Flutter Docs (StatelessWidget API):**
> *"A widget that does not require mutable state. Stateless widgets are useful when the part of the user interface you are describing does not depend on anything other than the configuration information in the object itself and the BuildContext in which the widget is inflated."*

A `StatelessWidget`'s appearance is determined entirely by what you pass into it. It has no memory — it cannot remember anything between builds.

```dart
// This is a pure function disguised as a class
// Same inputs → always same output
class ScoreBar extends StatelessWidget {
  final String subject;
  final int score;
  final int maxScore;

  const ScoreBar({
    super.key,                // always include super.key
    required this.subject,
    required this.score,
    required this.maxScore,
  });

  @override
  Widget build(BuildContext context) {
    final double percentage = score / maxScore;

    // Determine color purely from the data — no state involved
    final Color barColor = percentage > 0.75
        ? Colors.green
        : percentage > 0.50
            ? Colors.orange
            : Colors.red;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(subject, style: Theme.of(context).textTheme.titleSmall),
            Text(
              '$score / $maxScore',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage,
            backgroundColor: barColor.withOpacity(0.15),
            valueColor: AlwaysStoppedAnimation<Color>(barColor),
            minHeight: 8,
          ),
        ),
      ],
    );
  }
}
```

**Rule:** If a widget only displays data passed into it and has no internal changing state — make it `StatelessWidget`. It is lighter, simpler, easier to test, and can use `const` constructors.

> 📄 **Flutter Docs:**
> *"The build method of a stateless widget is typically only called in three situations: the first time the widget is inserted in the tree, when the widget's parent changes its configuration, and when an InheritedWidget it depends on changes."*

This is important — a StatelessWidget CAN rebuild. It rebuilds when its **parent** passes it new data. But it cannot trigger a rebuild by itself.

🎨 **Designer:** A StatelessWidget is the most "designer-friendly" widget. You hand it data and it renders. It's the equivalent of a Figma component with overrides — the component itself doesn't change; you just change the values you pass in.

🧪 **Tester:** StatelessWidgets are the easiest to test — no state to set up, no interactions to simulate. Just pass data and assert the output.

```dart
testWidgets('ScoreBar shows green for score above 75%', (tester) async {
  await tester.pumpWidget(
    const MaterialApp(
      home: Scaffold(
        body: ScoreBar(subject: 'Math', score: 90, maxScore: 100),
      ),
    ),
  );
  // Verify the LinearProgressIndicator value
  final indicator = tester.widget<LinearProgressIndicator>(
    find.byType(LinearProgressIndicator),
  );
  expect(indicator.value, closeTo(0.9, 0.001));
});
```

**→ Try this:** Build the `ScoreBar` widget above. Use it three times on a screen — `ScoreBar(subject: 'Math', score: 90, maxScore: 100)`, `ScoreBar(subject: 'Science', score: 55, maxScore: 100)`, `ScoreBar(subject: 'English', score: 30, maxScore: 100)`. Each bar should be a different color based on the percentage. Notice you wrote one widget, reused it three times, zero duplication.

---

## 5. StatefulWidget — When Things Change

> 📄 **Flutter Docs (StatefulWidget API):**
> *"A widget that has mutable state. State is information that (1) can be read synchronously when the widget is built and (2) might change during the lifetime of the widget. It is the responsibility of the widget implementer to ensure that the State is promptly notified when such state changes, using State.setState."*

A `StatefulWidget` is made of **two classes**. This is intentional — and once you understand why, it makes complete sense.

```dart
// ─── Class 1: The Widget ───────────────────────────────────────────────
// Immutable. Gets recreated every time the parent rebuilds.
// Only holds configuration passed from the parent.
// Its ONLY job: create the State object.
class QuantitySelector extends StatefulWidget {
  final int initialQuantity;
  final int maxQuantity;
  final ValueChanged<int> onChanged;  // callback to notify parent

  const QuantitySelector({
    super.key,
    this.initialQuantity = 1,
    this.maxQuantity = 10,
    required this.onChanged,
  });

  @override
  State<QuantitySelector> createState() => _QuantitySelectorState();
  // ↑ That's the only method a StatefulWidget needs. One job. Done.
}

// ─── Class 2: The State ────────────────────────────────────────────────
// Mutable. Created once. Survives across rebuilds.
// Holds all variables that can change.
// Has access to the widget's config via `widget.`
class _QuantitySelectorState extends State<QuantitySelector> {
  late int _quantity;   // 'late' because we initialize in initState

  @override
  void initState() {
    super.initState();  // ALWAYS call super first
    _quantity = widget.initialQuantity;  // read config from the Widget
  }

  void _increment() {
    if (_quantity >= widget.maxQuantity) return;
    setState(() {
      _quantity++;
    });
    widget.onChanged(_quantity);  // notify parent of new value
  }

  void _decrement() {
    if (_quantity <= 1) return;
    setState(() {
      _quantity--;
    });
    widget.onChanged(_quantity);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: const Icon(Icons.remove),
          onPressed: _quantity > 1 ? _decrement : null,  // null = disabled
          style: IconButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            '$_quantity',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.add),
          onPressed: _quantity < widget.maxQuantity ? _increment : null,
          style: IconButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.primary,
            foregroundColor: Theme.of(context).colorScheme.onPrimary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
        ),
      ],
    );
  }
}
```

**Why two classes?** The `StatefulWidget` gets recreated (thrown away and rebuilt) every time the parent rebuilds. But the `State` object survives rebuilds — Flutter keeps it alive. The separation exists so the data (`State`) can outlive the blueprint (`Widget`).

> 📄 **Flutter Docs:**
> *"The framework calls createState whenever it inflates a StatefulWidget, which means that multiple State objects might be associated with the same StatefulWidget if that widget has been inserted into the tree in multiple places."*

This is a key insight — if you use the same `StatefulWidget` in 3 places, Flutter creates 3 separate `State` objects. Each one is independent. Each one tracks its own `_quantity`.

**What `setState()` actually does:**

> 📄 **Flutter Docs:**
> *"Calling setState notifies the framework that the internal state of this object has changed in a way that might impact the user interface in this subtree, which causes the framework to schedule a build for this State object."*

`setState()` does TWO things:
1. Runs the function you pass it (where you mutate your state variables)
2. Marks this widget as dirty — Flutter schedules a rebuild at the next frame

```dart
// setState schedules a rebuild — it does NOT rebuild immediately
setState(() {
  _quantity++;   // 1. mutation happens NOW
});
// 2. Rebuild is SCHEDULED — happens on the next frame (within 16ms)
// Code after setState() runs BEFORE the rebuild
```

🎨 **Designer:** Identify StatefulWidgets by asking: "Can this element change without the user navigating away?" 
- Quantity +/− → StatefulWidget (number changes on tap)  
- Product image → StatelessWidget (just shows what's passed)
- "Add to cart" button that shows a spinner after tap → StatefulWidget (has loading state)
- Cart badge with count → could be either, but count usually comes from a parent/provider

🧪 **Tester:** Test both the initial state AND the state after interactions:

```dart
testWidgets('QuantitySelector increments and disables at max', (tester) async {
  await tester.pumpWidget(MaterialApp(
    home: Scaffold(
      body: QuantitySelector(
        initialQuantity: 1,
        maxQuantity: 3,
        onChanged: (_) {},
      ),
    ),
  ));

  // Initial state: minus button disabled, shows 1
  expect(find.text('1'), findsOneWidget);

  // Tap + twice
  await tester.tap(find.byIcon(Icons.add));
  await tester.pump();
  expect(find.text('2'), findsOneWidget);

  await tester.tap(find.byIcon(Icons.add));
  await tester.pump();
  expect(find.text('3'), findsOneWidget);

  // At max: + button should be disabled
  final addButton = tester.widget<IconButton>(find.byIcon(Icons.add).first);
  // Wait — actually testing disabled state requires checking onPressed is null
  // This is why knowing StatefulWidget internals helps you write better tests
});
```

**→ Try this:** Build a `LikeButton` StatefulWidget. It takes `int initialLikes`. It shows a heart icon and a count. Tapping toggles between liked (filled red heart, +1) and not liked (outline heart, −1). The count updates accordingly. Use `AnimatedSwitcher` to animate the icon change. Pass a `onLikeChanged(bool isLiked)` callback so the parent can know the state.

---

## 6. BuildContext — Your Widget's Address in the Tree

> 📄 **Flutter Docs (BuildContext API):**
> *"A handle to the location of a widget in the widget tree. This class presents a set of methods that can be used from StatelessWidget.build methods and from methods on State objects."*

`BuildContext` is not a bag of random data. It is a **reference to where your widget sits in the element tree** — its address. Because it's an address, it knows what's *above* it.

```dart
@override
Widget build(BuildContext context) {
  // 'context' = the Element node for THIS widget
  // It knows:
  //   - Its position in the tree
  //   - What InheritedWidgets are above it
  //   - Who its parent Element is
}
```

**The walk-up pattern:** Every `Foo.of(context)` call starts at `context`'s position and walks UP the element tree looking for an ancestor of type `Foo`:

```
Element Tree:
────────────────────────────
MaterialApp
  └─ Theme              ← Theme.of(context) walks up and finds THIS
       └─ MediaQuery    ← MediaQuery.of(context) finds THIS
            └─ Navigator ← Navigator.of(context) finds THIS
                 └─ Scaffold ← Scaffold.of(context) finds THIS
                      └─ YourWidget  ← context is HERE, walking up ↑
```

**The famous error — "No Scaffold found above this context":**

```dart
class MyPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // context is positioned at MyPage in the tree
    // MyPage has NOT returned its children yet
    // So the tree looks like:
    //   Navigator → MyPage   ← context is HERE

    return Scaffold(
      body: ElevatedButton(
        onPressed: () {
          // ERROR: Flutter walks UP from MyPage's context
          // Finds Navigator above it
          // Does NOT find Scaffold — Scaffold is BELOW MyPage (it's its child)
          ScaffoldMessenger.of(context).showSnackBar(...);  // WRONG
        },
        child: const Text('Show Snackbar'),
      ),
    );
  }
}
```

The tree after `build()` returns:
```
Navigator
  └─ MyPage      ← context walks up from here, never finds Scaffold below
       └─ Scaffold       ← this is a CHILD of MyPage, not an ancestor
            └─ ElevatedButton
```

**Fix — use `Builder` to get a context positioned inside Scaffold:**

```dart
Scaffold(
  body: Builder(   // Builder creates a new Element INSIDE Scaffold
    builder: (innerContext) {
      // Tree now:
      // Navigator → MyPage → Scaffold → Builder ← innerContext is HERE
      //
      // Walking up from Builder: Builder → Scaffold ← FOUND ✓
      return ElevatedButton(
        onPressed: () {
          ScaffoldMessenger.of(innerContext).showSnackBar(
            const SnackBar(content: Text('Hello!')),
          );
        },
        child: const Text('Show Snackbar'),
      );
    },
  ),
)
```

**Rule:** If you get "No X found above this context," your `context` is from a widget that is at the same level as X or above it — not below it. Use `Builder` or move the code to a child widget to get a context positioned inside the tree.

> 📄 **Flutter Docs:**
> *"Because a build context is associated with a widget, and can be used (for example) to obtain a theme, the same build context should not be stored and reused across frames — doing so could lead to unexpected behavior."*

Never store a `BuildContext` in a variable outside of `build()`. It can become stale.

🎨 **Designer:** Context enables theming. `Theme.of(context).colorScheme.primary` reads the current theme from above in the tree. This is how your button automatically becomes the right brand color, adapts to dark mode, and changes when the designer updates the seed color. Never hardcode `Colors.blue` — always use `Theme.of(context).colorScheme.*`.

🧪 **Tester:** The most common test failure caused by context: forgetting to wrap in `MaterialApp`. Without `MaterialApp`, there's no `Navigator`, no `Theme`, no `MediaQuery` in the tree — so any widget that calls `.of(context)` throws.

```dart
// ❌ Fails — no MaterialApp, no Theme, no Navigator
await tester.pumpWidget(MyWidget());

// ✓ Works — MaterialApp provides all the InheritedWidgets
await tester.pumpWidget(MaterialApp(home: MyWidget()));
```

**→ Try this:** Create a `Scaffold` with a `FloatingActionButton`. In the FAB's `onPressed`, show a `SnackBar` using `ScaffoldMessenger.of(context)`. First try it with the *outer* build context (the one from the class that returns Scaffold) — observe the exact error. Then fix it with `Builder`. Understand precisely why one fails and the other works.

---

## 7. `const` — Free Performance, Zero Effort

> 📄 **Flutter Docs:**
> *"If the entire widget subtree below a certain point is const, Flutter can cache that entire subtree and reuse it across rebuilds without recreating any objects."*

```dart
// Without const — Flutter creates a NEW object every single rebuild
Text('Settings')         // new Dart object created each time build() runs
SizedBox(height: 16)     // new Dart object created each time build() runs

// With const — Flutter reuses the SAME object in memory
const Text('Settings')   // created once, pointer reused — zero allocation cost
const SizedBox(height: 16)
```

When Flutter reconciles the element tree and sees that the new widget is `const` and is literally the same object in memory (`identical(oldWidget, newWidget) == true`), it **short-circuits completely**. No field comparison. No RenderObject check. Skipped entirely.

**Rule:** Add `const` wherever the Dart analyzer underlines it in VS Code. It costs nothing to write and can meaningfully reduce CPU work in lists and frequently-updating widgets.

```dart
@override
Widget build(BuildContext context) {
  return Column(
    children: [
      const Text('Your Orders'),           // ✓ const — static label
      const SizedBox(height: 12),          // ✓ const — fixed spacing
      const Divider(),                      // ✓ const — never changes
      Text('Total: ₹$_total'),             // ✗ cannot be const — uses variable
      ElevatedButton(                       // ✗ cannot be const — has a callback
        onPressed: _checkout,
        child: const Text('Checkout'),     // ✓ const — the child text is static
      ),
    ],
  );
}
```

---

## 8. MaterialApp + ThemeData — The Real Setup (Material 3)

> 📄 **Flutter Docs:**
> *"MaterialApp is a convenience widget that wraps a number of widgets that are commonly required for Material Design applications. It builds upon WidgetsApp by adding Material specific functionality."*

```dart
// main.dart — the full production-grade setup
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // ↑ REQUIRED before any plugin initialization (Firebase, SharedPreferences, etc.)
  // Without this, Flutter's binding isn't ready and plugins crash.
  // If you have no plugins, it's still good practice to include it.

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await setupDI();

  runApp(const App());
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Expense Tracker',
      debugShowCheckedModeBanner: false,  // remove the DEBUG banner

      // ─── Material 3 Theme ──────────────────────────────────────────
      theme: ThemeData(
        useMaterial3: true,  // ← enables Material Design 3 (required for M3)

        // colorScheme.fromSeed generates a FULL 30-color palette from one seed color
        // No more manually specifying primaryColor, accentColor, etc.
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6750A4),  // your brand color
          brightness: Brightness.light,
        ),

        // Typography — you can override the default text theme
        textTheme: GoogleFonts.poppinsTextTheme(),

        // Input decoration theme — applies to ALL TextFormFields app-wide
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
          filled: true,
        ),

        // Card theme — rounded corners, specific elevation
        cardTheme: const CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
            side: BorderSide(color: Color(0xFFE0E0E0)),
          ),
        ),
      ),

      // Dark theme — auto-switches based on system setting
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6750A4),
          brightness: Brightness.dark,
        ),
        textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme),
      ),

      themeMode: ThemeMode.system,   // system / light / dark

      home: const SplashScreen(),
    );
  }
}
```

### ColorScheme — The 30 Colors You Get for Free

```dart
// Material 3 gives you a complete color system from ONE seed color
// Use these instead of hardcoding Colors.X anywhere

Theme.of(context).colorScheme.primary        // main brand color
Theme.of(context).colorScheme.onPrimary      // text ON primary background
Theme.of(context).colorScheme.primaryContainer    // muted version
Theme.of(context).colorScheme.onPrimaryContainer  // text ON primaryContainer

Theme.of(context).colorScheme.secondary      // secondary accent
Theme.of(context).colorScheme.surface        // card/sheet backgrounds
Theme.of(context).colorScheme.onSurface      // text on surface
Theme.of(context).colorScheme.surfaceContainerHighest  // elevated surface
Theme.of(context).colorScheme.outline        // dividers, borders
Theme.of(context).colorScheme.error          // error states
Theme.of(context).colorScheme.onError        // text on error
```

🎨 **Designer:** ColorScheme.fromSeed is Flutter's version of Figma Material Theme Builder. You define ONE brand color and get a complete accessible palette — light and dark modes included. Never hardcode `Colors.blue` again.

### TextTheme — The Typography Scale

```dart
// Material 3 typography tokens — use these for ALL text
Theme.of(context).textTheme.displayLarge    // 57sp — hero numbers, splash screens
Theme.of(context).textTheme.displayMedium   // 45sp
Theme.of(context).textTheme.displaySmall    // 36sp
Theme.of(context).textTheme.headlineLarge   // 32sp — section titles
Theme.of(context).textTheme.headlineMedium  // 28sp
Theme.of(context).textTheme.headlineSmall   // 24sp
Theme.of(context).textTheme.titleLarge      // 22sp — AppBar, dialog titles
Theme.of(context).textTheme.titleMedium     // 16sp — list item titles
Theme.of(context).textTheme.titleSmall      // 14sp — card headers
Theme.of(context).textTheme.bodyLarge       // 16sp — primary body text
Theme.of(context).textTheme.bodyMedium      // 14sp — secondary body
Theme.of(context).textTheme.bodySmall       // 12sp — captions, labels
Theme.of(context).textTheme.labelLarge      // 14sp — buttons
Theme.of(context).textTheme.labelMedium     // 12sp — chips, tabs
Theme.of(context).textTheme.labelSmall      // 11sp — badges
```

---

## 9. `pubspec.yaml` — Project Configuration

```yaml
name: expense_tracker          # app package name (used for imports)
description: A sample expense tracker app.

publish_to: 'none'             # 'none' = not a pub.dev package, just an app

version: 1.0.0+1               # 1.0.0 = user-visible version, +1 = build number

environment:
  sdk: '>=3.0.0 <4.0.0'        # Dart SDK version constraint

dependencies:
  flutter:
    sdk: flutter               # the Flutter framework itself

  # State management
  flutter_bloc: ^8.1.0
  get_it: ^7.6.0

  # Networking
  dio: ^5.4.0
  json_annotation: ^4.8.0

  # Firebase
  firebase_core: ^2.24.0
  cloud_firestore: ^4.14.0
  firebase_auth: ^4.16.0

  # Storage
  hive_flutter: ^1.1.0
  shared_preferences: ^2.2.0

  # UI utilities
  flutter_animate: ^4.5.0
  cached_network_image: ^3.3.0
  lottie: ^3.1.0
  intl: ^0.19.0                # date formatting

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.0         # code generation runner
  json_serializable: ^6.7.0    # generates fromJson/toJson
  hive_generator: ^2.0.0       # generates Hive TypeAdapters
  flutter_lints: ^3.0.0        # official lint rules

flutter:
  # ── Assets ──────────────────────────────────────────────────────
  assets:
    - assets/images/           # folder — includes ALL files in folder
    - assets/images/logo.png   # specific file
    - assets/animations/       # Lottie JSON files
    - assets/data/             # JSON data files

  # ── Custom Fonts ─────────────────────────────────────────────────
  fonts:
    - family: Poppins
      fonts:
        - asset: assets/fonts/Poppins-Regular.ttf
        - asset: assets/fonts/Poppins-Medium.ttf
          weight: 500
        - asset: assets/fonts/Poppins-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Poppins-Bold.ttf
          weight: 700
```

```dart
// Accessing assets in code
Image.asset('assets/images/logo.png')
Lottie.asset('assets/animations/success.json')
```

**Rule:** Run `flutter pub get` after every change to `pubspec.yaml`. Run `dart run build_runner build --delete-conflicting-outputs` after adding `json_serializable`, `hive_generator`, or similar.

---

## 10. `SafeArea` and `MediaQuery` — Handling Notches and Screen Edges

> 📄 **Flutter Docs:**
> *"A widget that insets its child by sufficient padding to avoid intrusions by the operating system. For example, this will indent the child by enough to avoid the status bar at the top of the screen."*

```dart
// SafeArea automatically adds padding for:
// - Status bar (top notch / dynamic island)
// - Home indicator (bottom swipe area)
// - Side notches (landscape mode)

// WRONG — content goes behind the notch
Scaffold(
  body: Column(
    children: [
      Text('This text is behind the status bar!'),
    ],
  ),
)

// CORRECT — SafeArea pushes content below the notch
Scaffold(
  body: SafeArea(
    child: Column(
      children: [
        Text('This text is safely below the status bar'),
      ],
    ),
  ),
)

// Note: Scaffold ALREADY handles SafeArea for its AppBar and BottomNavigationBar
// You only need SafeArea manually when:
// - Building a full-screen custom widget (no Scaffold)
// - The body content itself needs to avoid the notch
```

```dart
// MediaQuery — query screen dimensions and device features
@override
Widget build(BuildContext context) {
  final mediaQuery = MediaQuery.of(context);

  final screenWidth = mediaQuery.size.width;      // logical pixels
  final screenHeight = mediaQuery.size.height;    // logical pixels
  final pixelRatio = mediaQuery.devicePixelRatio; // physical / logical
  final topPadding = mediaQuery.padding.top;      // status bar height
  final bottomPadding = mediaQuery.padding.bottom; // home indicator height
  final textScale = mediaQuery.textScaler;        // user's text size preference
  final isLandscape = mediaQuery.orientation == Orientation.landscape;
  final isDark = mediaQuery.platformBrightness == Brightness.dark;

  // Example: responsive padding based on screen width
  final horizontalPadding = screenWidth > 600 ? 48.0 : 16.0;

  return Padding(
    padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
    child: /* ... */,
  );
}
```

🎨 **Designer:** SafeArea is mandatory for all production apps. The "safe area" concept came from iPhone X's notch in 2017 and every phone since has had these — Dynamic Island, punch-hole cameras, rounded corners. Content that ignores safe area looks unprofessional.

🧪 **Tester:** Test with different screen sizes using `tester.binding.setSurfaceSize()`. Test notch handling with `MediaQuery.removePadding()` to simulate a phone with/without safe area insets.

---

## Design Breakdown Exercise — Think Like a Developer AND Designer

Look at this product card from a typical e-commerce app:

```
┌──────────────────────────────────────┐
│  ┌──────────────────────────────┐    │
│  │        [Product Image]       │    │   AspectRatio (4:3) → Image.network
│  │                    [SALE]    │    │   Stack → Positioned badge
│  └──────────────────────────────┘    │
│                                      │
│  Nike Air Max 270                    │   Text (titleSmall)
│  Men's Running Shoes                 │   Text (bodySmall, grey)
│                                      │
│  ₹8,999   ~~₹12,999~~               │   Row → Text (price) + Text (strikethrough)
│  ★★★★☆  (2.4k reviews)            │   Row → Icon + Text
│                                      │
│  [        Add to Cart        ]       │   ElevatedButton (full width)
└──────────────────────────────────────┘
```

**Your widget decomposition:**

```dart
// Outer card — StatelessWidget, all data passed in
class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onAddToCart;
  const ProductCard({super.key, required this.product, required this.onAddToCart});
  // ...
}

// The image with sale badge overlay — StatelessWidget
class ProductImage extends StatelessWidget { ... }

// Price section with strikethrough — StatelessWidget
class PriceDisplay extends StatelessWidget { ... }

// Star rating display — StatelessWidget
class RatingRow extends StatelessWidget { ... }

// Add to cart button — could be StatefulWidget (loading state after tap)
class AddToCartButton extends StatefulWidget { ... }
// Why StatefulWidget? After tapping, it might show a spinner for 1 second
// then show a checkmark. That internal loading/success state is local to the button.
```

🧪 **Tester breakdown:** Because each piece is a separate widget, you can test each independently:
- `ProductImage` — does it show the SALE badge only when `isOnSale: true`?
- `PriceDisplay` — does it show the strikethrough only when `originalPrice != null`?
- `AddToCartButton` — does it show a spinner after tap? Does it call `onAddToCart` after success?
- `ProductCard` — integration test: does the full card render correctly given a `Product` object?

---

## Lab — Build a Full Profile Screen

Compose these components into a scrollable profile screen:

**Components to build:**

1. `AvatarWithBadge` *(StatelessWidget)* — circular avatar showing initials in a colored circle, with a small online/offline indicator dot in the bottom-right corner. Takes `name: String`, `isOnline: bool`, `color: Color`.

2. `StatCard` *(StatelessWidget)* — a vertical card showing a large number and a label below it (e.g., "48" above "Posts"). Takes `value: String`, `label: String`. Use `Theme.of(context)` for all text styles.

3. `FollowButton` *(StatefulWidget)* — starts as an `ElevatedButton` saying "Follow". When tapped, changes to an `OutlinedButton` saying "Following". When tapped again, reverts. Fires an `onFollowChanged(bool)` callback.

4. `SkillChipsRow` *(StatelessWidget)* — takes `List<String> skills` and renders them as a `Wrap` of `Chip` widgets.

5. `ProfileScreen` *(StatefulWidget)* — assembles all of the above. Holds `_isFollowing` state that updates when `FollowButton` fires its callback. The follower count in `StatCard` should reflect the current follow state.

**Rules:**
- ALL text styles come from `Theme.of(context).textTheme`
- ALL colors come from `Theme.of(context).colorScheme`
- No hardcoded `Colors.X` or font sizes anywhere in the code
- Every StatelessWidget must have a `const` constructor

---

## Challenge

Make `ProfileScreen` respond to screen width:

- On screens **> 600px wide** (tablet): show avatar + stats side by side in a `Row`
- On screens **≤ 600px wide** (phone): show avatar + stats stacked in a `Column`

Use `LayoutBuilder` to detect the available width:

```dart
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth > 600) {
      return _TabletLayout(/* ... */);
    }
    return _PhoneLayout(/* ... */);
  },
)
```

This is the foundation of responsive Flutter UI.

---

## Week 2 Verify — Answer Without Looking

1. Flutter uses native OS buttons and text fields — true or false? Explain what it actually uses.
2. What is a widget? Give the exact characteristic that makes it different from other UI frameworks.
3. You call `setState()`. List the exact sequence of things Flutter does, in order.
4. Why does `StatefulWidget` have two classes? What would break if State was in the same class as the Widget?
5. You get "No Navigator found above this widget." What does that error mean about where your context is in the element tree?
6. `const Text('Hello')` vs `Text('Hello')` — what is the difference during reconciliation?
7. You have a heart icon that toggles liked/unliked. Should it be `StatelessWidget` or `StatefulWidget`? What if the liked state is also needed by the AppBar's icon count?

---

**Next → [Week 3: Widget Lifecycle — Every Method, Every Edge Case](Week_03_Widget_Lifecycle.md)**
