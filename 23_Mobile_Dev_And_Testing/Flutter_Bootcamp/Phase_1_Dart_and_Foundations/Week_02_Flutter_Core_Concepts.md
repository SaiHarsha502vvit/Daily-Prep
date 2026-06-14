# Week 2 — Flutter Core Concepts
### The mental model you need before writing a single widget

---

Before you write any code, you need to understand what Flutter actually *is* internally. Without this model, bugs will confuse you and you won't know why things work. With it, everything makes sense.

---

## 1. Flutter Is a Renderer, Not a Wrapper

Most cross-platform tools (React Native, Xamarin) work like this:

```
Your code → tells the OS → "draw a button here"
               ↓
           OS draws a native button
```

Flutter works differently:

```
Your code → Flutter engine → draws EVERY pixel itself on a canvas
```

Flutter does not use Android's `TextView` or iOS's `UIButton`. It draws everything using its own engine (called Impeller). This is why Flutter looks identical on every platform and why animations are smooth — it's all Flutter drawing, not the OS.

---

## 2. Three Trees Flutter Maintains Internally

When you write a Flutter app, Flutter maintains **three separate trees** internally. Understanding these explains why rebuilds are fast even when you change things constantly.

```
Widget Tree         Element Tree        RenderObject Tree
────────────        ────────────        ─────────────────
Column              ColumnElement       RenderFlex
├── Text            ├── TextElement     ├── RenderParagraph
└── Button          └── ButtonElement  └── RenderBox
```

**Widget Tree** — what YOU write. Widgets are immutable descriptions. Think of them as blueprints. Every time `build()` is called, Flutter creates a fresh widget tree.

**Element Tree** — Flutter's internal working copy. Elements are long-lived and remember which widget they're currently showing. When you call `setState()`, Flutter compares the new widget tree to the element tree and only updates what changed.

**RenderObject Tree** — the actual painting instructions. This is what hits the GPU. Only updated when layout or painting genuinely needs to change.

**Why this matters:** When you call `setState()`, Flutter doesn't repaint the whole screen. It rebuilds widgets (cheap — they're just Dart objects), compares them to the element tree (diffing), and only updates the RenderObjects that actually changed. This is why Flutter is fast even with complex UIs.

---

## 3. Everything Is a Widget

In Flutter, the entire UI is composed of widgets nested inside widgets. This is not a figure of speech:

```dart
MaterialApp          // widget
  └─ Scaffold        // widget
      ├─ AppBar      // widget
      │   └─ Text    // widget
      └─ Center      // widget
          └─ Column  // widget
              ├─ Text         // widget
              └─ ElevatedButton  // widget
                  └─ Text    // widget
```

Even padding is a widget. Even opacity is a widget. Even the gesture detector is a widget.

```dart
Padding(                            // a widget just for padding
  padding: EdgeInsets.all(16),
  child: Opacity(                   // a widget just for opacity
    opacity: 0.5,
    child: GestureDetector(         // a widget just for tap detection
      onTap: () => print('tapped'),
      child: Text('Hello'),
    ),
  ),
)
```

This feels verbose at first. You'll get used to it, and then you'll appreciate how composable it is.

---

## 4. StatelessWidget — The Simple One

A `StatelessWidget` is a widget whose appearance **never changes** after it's built. It only depends on the data passed to it (its properties).

```dart
class ProfileBadge extends StatelessWidget {
  final String name;
  final String role;
  final Color color;

  // const constructor — tells Flutter this widget can be cached
  const ProfileBadge({
    super.key,
    required this.name,
    required this.role,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(radius: 16, backgroundColor: color, child: Text(name[0])),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
              Text(role, style: const TextStyle(fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }
}

// Usage — notice how you use it like any other widget
ProfileBadge(name: 'Harsha', role: 'Flutter Dev', color: Colors.deepPurple)
```

**Rule:** If a widget only displays data passed into it and has no internal changing state — make it `StatelessWidget`. It's lighter and simpler.

**→ Try this:** Build a `StatelessWidget` called `ScoreCard` that takes `String subject`, `int score`, `int maxScore`. Display the subject, the score as `"87 / 100"`, and a colored bar showing the percentage (green if >75, yellow if >50, red otherwise). Use it 3 times on a screen with different subjects.

---

## 5. StatefulWidget — When Things Change

A `StatefulWidget` has two parts — this confuses beginners at first, so read this carefully.

```dart
// Part 1: The widget itself — immutable, just like StatelessWidget
class LikeButton extends StatefulWidget {
  final int initialLikes;

  const LikeButton({super.key, required this.initialLikes});

  // This is the only job of a StatefulWidget: create its State object
  @override
  State<LikeButton> createState() => _LikeButtonState();
}

// Part 2: The State — mutable, lives as long as the widget is on screen
class _LikeButtonState extends State<LikeButton> {
  late int _likes;           // mutable state
  bool _isLiked = false;

  @override
  void initState() {
    super.initState();
    _likes = widget.initialLikes;  // access widget's properties via `widget.`
  }

  void _toggleLike() {
    setState(() {              // setState triggers a rebuild
      _isLiked = !_isLiked;
      _likes += _isLiked ? 1 : -1;
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _toggleLike,
      child: Row(
        children: [
          Icon(
            _isLiked ? Icons.favorite : Icons.favorite_border,
            color: _isLiked ? Colors.red : Colors.grey,
          ),
          const SizedBox(width: 4),
          Text('$_likes'),
        ],
      ),
    );
  }
}
```

**Why two classes?** The `StatefulWidget` gets recreated (thrown away and rebuilt) every time the parent rebuilds. But the `State` object survives rebuilds — Flutter keeps it alive. This is how state is preserved. The separation exists so the data (`State`) can outlive the blueprint (`Widget`).

---

## 6. `BuildContext` — What It Actually Is

`BuildContext` is one of the most confusing things for Flutter beginners. Here's the honest explanation.

```dart
@override
Widget build(BuildContext context) { ... }
```

`BuildContext` is a reference to **where this widget sits in the element tree**. It's essentially a pointer to the widget's element node. That's it.

Why does it matter? Because many Flutter features (theming, navigation, snackbars, inherited data) work by **walking UP the tree** from a given widget. They need to know where in the tree to start walking from.

```dart
// These all walk UP the tree from the current context
Theme.of(context)         // finds the nearest Theme ancestor
Navigator.of(context)     // finds the nearest Navigator ancestor
MediaQuery.of(context)    // finds the nearest MediaQuery ancestor
Scaffold.of(context)      // finds the nearest Scaffold ancestor
```

**The gotcha — context is about location in the tree:**

```dart
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // This context is ABOVE the Scaffold
    // So Scaffold.of(context) would FAIL — there's no Scaffold above us

    return Scaffold(
      body: Builder(
        builder: (innerContext) {
          // innerContext is INSIDE the Scaffold
          // So Scaffold.of(innerContext) works
          return ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(innerContext).showSnackBar(...); // works
            },
            child: const Text('Show Snackbar'),
          );
        },
      ),
    );
  }
}
```

**Rule of thumb:** if you get an error like "No Scaffold found" or "No Navigator found", your context is probably from a widget that's above that ancestor. Use a `Builder` widget or a child widget's context instead.

**→ Try this:** Create a `Scaffold` with a button in its body. The button should show a `SnackBar` when tapped. Use `ScaffoldMessenger.of(context)`. Then deliberately break it by trying to show the snackbar using the build context of the class that contains the Scaffold — observe the error.

---

## 7. The `key` Parameter — When Widgets Need Identity

You see `super.key` in every widget constructor. What is it?

By default, Flutter identifies widgets by their **type and position** in the tree. Two `Text` widgets in the same position are considered the same widget. This is usually fine.

But sometimes you need Flutter to track a specific widget's identity even when it moves position. That's what `Key` is for.

```dart
// Imagine a reorderable list. Without keys:
// Flutter sees: "Text at position 0", "Text at position 1"
// When you reorder, Flutter can't tell which Text is which

// With keys:
const Text('Item A', key: ValueKey('item-a'))
const Text('Item B', key: ValueKey('item-b'))
// Now Flutter tracks them by key, not position
```

For now: always include `{super.key}` in your widget constructors (it's the Flutter convention and lint will warn you if you don't). You'll understand when keys matter once you build lists with reordering or animations.

---

## 8. `const` Widgets — Performance Shortcut

```dart
// Without const: Flutter creates a NEW Text object every rebuild
Text('Hello')

// With const: Flutter REUSES the same object — zero cost
const Text('Hello')
```

When a widget is `const`, Flutter knows it can never change and skips rebuilding it. Add `const` wherever you can — it's free performance. VS Code will underline where you can add it.

```dart
// Good practice
Column(
  children: [
    const Text('Static title'),     // const — never changes
    const SizedBox(height: 16),    // const — never changes
    Text('Dynamic: $value'),        // can't be const — uses a variable
  ],
)
```

---

## Lab — Build This

**A multi-section profile page with a counter.**

Requirements:
- A `StatelessWidget` called `ProfileHeader` showing a name, title, and avatar initials in a colored circle (no external image — just text in a CircleAvatar)
- A `StatelessWidget` called `StatCard` showing a label and a number (reused 3 times for "Projects", "Followers", "Following")
- A `StatefulWidget` called `FollowButton` that starts as "Follow" (outlined, blue), and when tapped changes to "Following" (filled, blue) — and back when tapped again
- A `StatelessWidget` called `Bio` showing 2-3 sentences of bio text

Assemble all of these into a single scrollable screen. No hard-coded colors inside each component — pass colors as parameters.

---

## Challenge — Harder

Add a `PostGrid` widget (StatelessWidget) below the profile that shows 9 placeholder colored boxes in a 3×3 grid. Each box has a different color (use a list of 9 colors). When tapped, a box should expand to full-screen (a new screen — push a new route with the color as background and a back button).

The trick: the grid itself is `StatelessWidget`, but the tap action requires navigation. You'll need to pass a callback or use `Navigator.push` directly from the `onTap`. Try both approaches.

---

## Before Week 3 — Verify

1. What are the three trees Flutter maintains? Why not just one?
2. What is `BuildContext`? Why does `Theme.of(context)` need it?
3. Why does `StatefulWidget` have two separate classes?
4. What does `setState()` actually do — what happens after you call it?
5. When should a widget be `StatelessWidget` vs `StatefulWidget`?

---

**Next → [Week 3: Widget Lifecycle — Every Method Explained](Week_03_Widget_Lifecycle.md)**
