# Week 4 — Layout & Constraints
### How Flutter decides where everything goes and how big everything is

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — how the constraint system works and what the code does
> - 🎨 **Designer** — how to think about space, sizing, and layout decisions
> - 🧪 **Tester** — how to verify layouts, catch overflow bugs, test responsiveness

---

## Before You Write a Single Layout Widget

New Flutter developers constantly hit these errors:
- `RenderFlex overflowed by 32 pixels` — the yellow-black stripe of doom
- A `Container(width: 100)` that ignores the width and fills the whole screen
- `Column` inside `ListView` crashing with "Vertical viewport was given unbounded height"

All of these have the same root cause: not understanding Flutter's constraint system. This week removes that confusion permanently.

> **TypeScript/CSS comparison:** If you're coming from web/React, Flutter's layout is fundamentally different from CSS:
> | CSS/Web | Flutter |
> |---|---|
> | `display: flex` | `Row` / `Column` |
> | `flex: 1` | `Expanded` (fills remaining space) |
> | `flex-grow: 0` | `Flexible(fit: FlexFit.loose)` |
> | `justify-content` | `MainAxisAlignment` |
> | `align-items` | `CrossAxisAlignment` |
> | `position: absolute` | `Stack` + `Positioned` |
> | `overflow: scroll` | `ListView` / `SingleChildScrollView` |
> | `max-width: 360px` | `ConstrainedBox(constraints: BoxConstraints(maxWidth: 360))` |
> | `padding: 16px` | `Padding(padding: EdgeInsets.all(16))` |
> | `gap: 8px` | `SizedBox(height: 8)` between children, or `Column(spacing: 8)` in Flutter 3.27+ |
>
> The biggest mental shift: CSS is **additive** (you stack properties onto one element), Flutter is **compositional** (each behavior is a separate widget wrapping another). There's no `style` prop — padding, alignment, decoration, and constraints are each their own widget.

---

## The Golden Rule of Flutter Layout

> 📄 **Flutter Docs (Understanding Constraints):**
> *"Constraints go down. Sizes go up. Parent sets position."*

This three-sentence rule explains everything about Flutter layout. Let's break it down completely.

```
STEP 1 — Constraints go DOWN (parent → child)
  Parent says: "You must be between 0 and 360px wide, between 0 and 640px tall."

STEP 2 — Sizes go UP (child → parent)
  Child decides: "Given those limits, I want to be 200×50."

STEP 3 — Parent sets POSITION
  Parent decides: "I'll place you at x=80, y=200."
```

This is a single-pass top-down then bottom-up traversal. Every widget goes through this. Once you internalize it, every layout mystery solves itself.

---

## BoxConstraints — What Flutter Passes Down

> 📄 **Flutter Docs:**
> *"BoxConstraints impose restrictions on how wide and tall a widget may be, with minimum and maximum values for width and height."*

```dart
BoxConstraints(
  minWidth: 0,    // child must be AT LEAST this wide
  maxWidth: 360,  // child must be AT MOST this wide
  minHeight: 0,   // child must be AT LEAST this tall
  maxHeight: 640, // child must be AT MOST this tall
)
```

The child picks any size within those bounds. Most widgets choose the smallest size that fits their content.

### Tight vs Loose vs Unbounded

> 📄 **Flutter Docs:**
> *"A tight constraint offers a single possibility — an exact size. A loose constraint has a maximum but no minimum. An unbounded constraint has an infinite maximum."*

```dart
// TIGHT — child HAS NO CHOICE, must be exactly this size
BoxConstraints.tight(const Size(200, 100))
// minWidth == maxWidth == 200, minHeight == maxHeight == 100

// LOOSE — child can be anywhere from 0 to the maximum
const BoxConstraints(maxWidth: 360, maxHeight: 640)
// child can be 0×0 or 360×640 or anything in between

// UNBOUNDED — infinite maximum (dangerous in certain nesting situations)
const BoxConstraints(maxHeight: double.infinity)
// child can grow as tall as it wants — no limit
```

🎨 **Designer:** Map these to Figma's auto layout terms:
- **Tight** = "Fixed" size — widget has no say in its dimensions
- **Loose** = "Hug contents" — widget picks its own size within limits
- **Unbounded** = Infinite canvas — widget grows as large as it needs

---

## The Constraint Paradox — Why `Container(width: 100)` Fills the Screen

This confuses almost every Flutter beginner:

```dart
// You'd expect a 100px-wide blue box
// You get a full-screen-wide blue box instead
Scaffold(
  body: Container(
    width: 100,
    color: Colors.blue,
    child: const Text('Hello'),
  ),
)
```

**Here's exactly what happens:**

```
Scaffold passes TIGHT constraints to its body:
  → minWidth = maxWidth = 360 (full screen — body MUST fill it)
          ↓
Container receives tight: must be exactly 360px wide
          ↓
Container says "I want 100px"
          ↓
But minimum is 360 — Container can't be smaller
          ↓
Container becomes 360px wide despite asking for 100px
```

Your `width: 100` is a preference. Constraints always win over preferences.

**Fix — wrap in Center to give loose constraints:**

```dart
Scaffold(
  body: Center(           // Center gives its child LOOSE constraints
    child: Container(
      width: 100,         // Now Container has freedom — it picks 100px ✓
      color: Colors.blue,
      child: const Text('Hello'),
    ),
  ),
)
```

`Center` receives tight constraints from Scaffold (fill screen). But it passes **loose constraints** to its child — "be as small as you want, up to screen width." Now Container picks 100px freely.

**→ Try this:** Place `Container(width: 100, height: 100, color: Colors.red)` directly in `Scaffold.body`. What size is it? Now wrap it in `Center`. Now wrap it in `Align(alignment: Alignment.topLeft)`. Observe every change.

---

## Column and Row — Flutter's Core Layout Widgets

> 📄 **Flutter Docs:**
> *"Column lays out a list of child widgets in the vertical direction. Row lays out a list of child widgets in the horizontal direction. Both use the same flexbox-inspired layout algorithm."*

```dart
Column(
  mainAxisAlignment: MainAxisAlignment.center,   // vertical distribution
  crossAxisAlignment: CrossAxisAlignment.start,  // horizontal alignment
  mainAxisSize: MainAxisSize.min,                // shrink-wrap vs fill
  children: [...],
)
```

### How Column Passes Constraints to Children

Column passes its children **unbounded height** (so each child can declare its natural height), but passes its **own width** constraint unchanged.

```
Column receives: maxWidth=360, maxHeight=640
        ↓
Gives Text('Hello') constraints: maxWidth=360, maxHeight=INFINITY
  → Text says: "I need 20px tall"
Gives Container(height:100) constraints: maxWidth=360, maxHeight=INFINITY
  → Container says: "I need 100px tall"
        ↓
Column sums child heights: 20 + 100 = 120px
mainAxisAlignment distributes remaining 640-120=520px as spacing
        ↓
Column reports its own height: 640 (fills parent by default)
```

### `mainAxisAlignment` — Distributing Children

```dart
Column(mainAxisAlignment: MainAxisAlignment.start)        // pack to top (default)
Column(mainAxisAlignment: MainAxisAlignment.center)       // center as a group
Column(mainAxisAlignment: MainAxisAlignment.end)          // pack to bottom
Column(mainAxisAlignment: MainAxisAlignment.spaceBetween) // equal gaps between
Column(mainAxisAlignment: MainAxisAlignment.spaceAround)  // half-gap at edges
Column(mainAxisAlignment: MainAxisAlignment.spaceEvenly)  // equal gaps everywhere
```

🎨 **Designer — Figma → Flutter mapping:**
| Figma Auto Layout | Flutter |
|-------------------|---------|
| Pack → Top/Left | `MainAxisAlignment.start` |
| Pack → Center | `MainAxisAlignment.center` |
| Pack → Bottom/Right | `MainAxisAlignment.end` |
| Space between | `MainAxisAlignment.spaceBetween` |

### `crossAxisAlignment` — Alignment on the Opposite Axis

```dart
Column(crossAxisAlignment: CrossAxisAlignment.start)    // left-align all children
Column(crossAxisAlignment: CrossAxisAlignment.center)   // center-align (default)
Column(crossAxisAlignment: CrossAxisAlignment.end)      // right-align
Column(crossAxisAlignment: CrossAxisAlignment.stretch)  // force all children to full width
```

`CrossAxisAlignment.stretch` forces every child to fill the Column's full width. Useful for making buttons, cards, and dividers fill the available width automatically.

### `mainAxisSize` — Shrink vs Fill

```dart
Column(mainAxisSize: MainAxisSize.max)  // fill all available vertical space (default)
Column(mainAxisSize: MainAxisSize.min)  // only as tall as the sum of children
```

```dart
// Common use: bottom sheet Column only as tall as its content
showModalBottomSheet(
  context: context,
  builder: (_) => Column(
    mainAxisSize: MainAxisSize.min,   // ← critical — sheet doesn't fill screen
    children: [
      ListTile(leading: const Icon(Icons.share), title: const Text('Share')),
      ListTile(leading: const Icon(Icons.edit), title: const Text('Edit')),
      ListTile(leading: const Icon(Icons.delete), title: const Text('Delete'), iconColor: Colors.red),
    ],
  ),
)
```

**→ Try this:** Build a Column with 3 colored Containers (80×80 each). Try every `mainAxisAlignment` value. Then try every `crossAxisAlignment` value. Screenshot or sketch what changes. This visual exercise is faster than any description.

---

## `Expanded` vs `Flexible` — Distributing Remaining Space

> 📄 **Flutter Docs:**
> *"Expanded: expands a child of a Row, Column, or Flex so that the child fills the available space. Flexible: controls how a child flexes. Unlike Expanded, Flexible does not require the child to fill the available space."*

```dart
Row(
  children: [
    Expanded(          // MUST fill its allocated space — stretches the child
      flex: 2,         // takes 2/3 of remaining space
      child: Container(color: Colors.blue),  // fills every pixel given
    ),
    Flexible(          // CAN be smaller — child keeps its preferred size
      flex: 1,         // allocated 1/3 of remaining space
      child: Container(color: Colors.green, width: 40),  // stays at 40px
    ),
  ],
)
```

`Expanded` = `Flexible` with `fit: FlexFit.tight` → child MUST fill space.
`Flexible` = `Flexible` with `fit: FlexFit.loose` → child CAN fill space but may be smaller.

```dart
// Classic chat input bar — TextField grows, button stays fixed
Row(
  children: [
    Expanded(
      child: TextField(
        decoration: const InputDecoration(hintText: 'Message...'),
      ),
    ),
    const SizedBox(width: 8),
    IconButton(
      icon: const Icon(Icons.send),
      onPressed: _send,
    ),
  ],
)
```

**Rule:** Use `Expanded` when the child must fill its share of space. Use `Flexible` when the child has a natural size that should be respected if space allows.

---

## Stack — Overlapping Widgets

> 📄 **Flutter Docs:**
> *"A widget that positions its children relative to the edges of its box. This is useful if you want to overlap several children in a simple way."*

```dart
Stack(
  alignment: Alignment.center,  // alignment for non-Positioned children
  children: [
    // Layer 1 (bottom): background image
    Image.network(coverUrl, fit: BoxFit.cover, width: double.infinity, height: 240),

    // Layer 2: dark gradient overlay (using Positioned.fill)
    Positioned.fill(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
          ),
        ),
      ),
    ),

    // Layer 3 (top): title text at bottom-left
    Positioned(
      bottom: 16,
      left: 16,
      right: 60,
      child: Text(
        albumTitle,
        style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.white),
      ),
    ),

    // Layer 4: play button at bottom-right
    const Positioned(
      bottom: 8,
      right: 8,
      child: CircleAvatar(
        radius: 24,
        backgroundColor: Colors.green,
        child: Icon(Icons.play_arrow, color: Colors.white),
      ),
    ),
  ],
)
```

**How Stack sizes itself:**
- As big as its largest **non-Positioned** child
- `Positioned` children don't affect Stack's size
- If ALL children are `Positioned`, Stack expands to fill its parent

🎨 **Designer:** Stack is absolute positioning — equivalent to Figma's "absolute position" toggle or CSS `position: absolute`. Use it for image overlays, badge indicators, floating labels, and any element that sits visually on top of another.

🧪 **Tester:** In Stack, the last child in the list is the topmost layer. If an interactive widget is beneath another widget in the Z-order, `tester.tap()` won't reach it. Verify tappable elements are on top.

---

## The Overflow Error — Fixed for Good

```
════ Exception caught by rendering library ════════════════
RenderFlex overflowed by 32.0 pixels on the bottom.
```

**Cause:** A Column or Row's children are collectively taller/wider than the space available.

```dart
// ❌ Overflows — 3 × 300px = 900px but screen is 640px
Column(
  children: [
    Container(height: 300, color: Colors.red),
    Container(height: 300, color: Colors.blue),
    Container(height: 300, color: Colors.green),
  ],
)

// ✓ Fix 1 — make it scrollable
SingleChildScrollView(
  child: Column(
    children: [
      Container(height: 300, color: Colors.red),
      Container(height: 300, color: Colors.blue),
      Container(height: 300, color: Colors.green),
    ],
  ),
)

// ✓ Fix 2 — divide the space with Expanded
Column(
  children: [
    Expanded(child: Container(color: Colors.red)),    // 640/3 ≈ 213px
    Expanded(child: Container(color: Colors.blue)),
    Expanded(child: Container(color: Colors.green)),
  ],
)
```

**The most common crash — Column inside ListView:**

```dart
// ❌ CRASH: "Vertical viewport was given unbounded height"
// ListView gives Column UNBOUNDED height — Column asks "how tall should I be?"
// Column sees infinite space — panics
ListView(
  children: [
    Column(children: [...]),
  ],
)

// ✓ Fix — shrink-wrap the Column
ListView(
  children: [
    Column(
      mainAxisSize: MainAxisSize.min,  // "only as tall as my children"
      children: [...],
    ),
  ],
)

// ✓ Better fix — don't nest Column in ListView, put items directly
ListView(
  children: [
    ChildWidget1(),
    ChildWidget2(),
  ],
)
```

🧪 **Tester:** Overflow errors are visible as yellow-black stripes in debug mode and throw in tests. Catch them with surface size tests:

```dart
testWidgets('no overflow on small screen', (tester) async {
  await tester.binding.setSurfaceSize(const Size(320, 568));  // small device
  await tester.pumpWidget(MaterialApp(home: MyScreen()));
  expect(tester.takeException(), isNull);  // no overflow exception
});
```

---

## Key Constraint Widgets — What Each One Does

| Widget | Effect on child constraints |
|--------|---------------------------|
| `SizedBox(width, height)` | Tight — child must be exactly this size |
| `SizedBox.expand()` | Tight — child fills parent completely |
| `Center` | Loose — child can be 0 to parent's full size |
| `Align` | Loose — positions child at alignment within parent |
| `Expanded` | Tight main axis — child must fill its flex share |
| `Flexible` | Loose main axis — child gets up to its flex share |
| `ConstrainedBox` | Adds additional min/max constraints |
| `AspectRatio(ratio)` | Child maintains specific width:height ratio |
| `FractionallySizedBox(factor)` | Child is a fraction of parent size |
| `FittedBox` | Scales child to fit without overflow |

```dart
// Force a button to always span full width
SizedBox(
  width: double.infinity,
  child: ElevatedButton(onPressed: _submit, child: const Text('Confirm')),
)

// Maintain 16:9 aspect ratio for video thumbnail
AspectRatio(
  aspectRatio: 16 / 9,
  child: Image.network(thumbnailUrl, fit: BoxFit.cover),
)

// Scale oversized text to fit without overflow
FittedBox(
  fit: BoxFit.scaleDown,
  child: Text(veryLongProductTitle, style: const TextStyle(fontSize: 22)),
)
```

---

## `LayoutBuilder` — Responsive Layouts

> 📄 **Flutter Docs:**
> *"Builds a widget tree that can depend on the parent widget's size. The builder function is called at layout time and receives the parent widget's constraints."*

```dart
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth > 768) {
      return const _DesktopLayout();   // 3-column grid
    } else if (constraints.maxWidth > 480) {
      return const _TabletLayout();    // 2-column grid
    } else {
      return const _PhoneLayout();     // single-column list
    }
  },
)
```

🎨 **Designer:** `LayoutBuilder` is your responsive breakpoint system. Design for three widths — phone (< 480), phablet (480–768), desktop (768+) — and switch layouts between them. The same data, different arrangements.

---

## `Spacer` and `Wrap`

```dart
// Spacer: fills remaining space between children in Row/Column
Row(
  children: [
    Image.asset('logo.png', height: 32),
    const Spacer(),          // pushes all remaining children to the right
    IconButton(icon: const Icon(Icons.search), onPressed: () {}),
    IconButton(icon: const Icon(Icons.notifications), onPressed: () {}),
  ],
)

// Wrap: Row that wraps to next line when children don't fit
Wrap(
  spacing: 8,       // horizontal gap between items
  runSpacing: 6,    // vertical gap between rows
  children: skills.map((s) => Chip(label: Text(s))).toList(),
)
```

`Wrap` is Row that doesn't overflow — it wraps. Use it for chips, tags, filter buttons, and any variable-count collection.

---

## Responsive & Adaptive Layout

> 🍎 **Academy Golden Rule — Design for Every Device:**
> *"Your app runs on a 4-inch SE, a 6.7-inch Pro Max, a 12.9-inch iPad Pro, and a 27-inch iMac with desktop Chrome. A single hardcoded layout won't survive."*

```dart
// LayoutBuilder — the widget that tells you how much space you have
class ProductGrid extends StatelessWidget {
  final List<Product> products;
  const ProductGrid({super.key, required this.products});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // constraints.maxWidth tells you how wide THIS widget can be
        final crossAxisCount = switch (constraints.maxWidth) {
          < 600 => 2,      // phone portrait
          < 900 => 3,      // phone landscape / small tablet
          < 1200 => 4,     // tablet
          _ => 6,          // desktop
        };

        return GridView.builder(
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            childAspectRatio: 0.75,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: products.length,
          itemBuilder: (_, i) => ProductCard(product: products[i]),
        );
      },
    );
  }
}
```

```dart
// Breakpoint helper — reuse across the app
enum ScreenSize { compact, medium, expanded }

ScreenSize getScreenSize(BuildContext context) {
  final width = MediaQuery.sizeOf(context).width;
  if (width < 600) return ScreenSize.compact;
  if (width < 840) return ScreenSize.medium;
  return ScreenSize.expanded;
}

// Adaptive navigation — bottom bar on phone, rail on tablet, drawer on desktop
@override
Widget build(BuildContext context) {
  return switch (getScreenSize(context)) {
    ScreenSize.compact => Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) => setState(() => _selectedIndex = i),
        destinations: _destinations,
      ),
    ),
    ScreenSize.medium => Scaffold(
      body: Row(children: [
        NavigationRail(
          selectedIndex: _selectedIndex,
          onDestinationSelected: (i) => setState(() => _selectedIndex = i),
          destinations: _railDestinations,
        ),
        Expanded(child: _pages[_selectedIndex]),
      ]),
    ),
    ScreenSize.expanded => Scaffold(
      body: Row(children: [
        NavigationDrawer(
          selectedIndex: _selectedIndex,
          onDestinationSelected: (i) => setState(() => _selectedIndex = i),
          children: _drawerDestinations,
        ),
        Expanded(child: _pages[_selectedIndex]),
      ]),
    ),
  };
}
```

**`MediaQuery.sizeOf(context)` vs `MediaQuery.of(context).size`:**
```dart
// ✓ Only rebuilds when SIZE changes (not when keyboard appears, or orientation locks, etc.)
final width = MediaQuery.sizeOf(context).width;

// ❌ Rebuilds when ANY MediaQuery property changes — wasteful
final width = MediaQuery.of(context).size.width;
```

**Rule:** Use `LayoutBuilder` when you need the space available to *this specific widget*. Use `MediaQuery.sizeOf` when you need the *entire screen* dimensions (for choosing navigation patterns).

---

## Design System Spacing Tokens — Enterprise Pattern

> 🏢 **Enterprise Reality:**
> *"In a 50-screen app, hardcoded padding values like `EdgeInsets.all(16)` scattered across 200 files make design consistency impossible. Enterprise teams define spacing as tokens — named constants that the design system owns."*

```dart
// lib/core/design_system/spacing.dart
abstract class AppSpacing {
  static const double xxs = 2;
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
  static const double xxxl = 64;

  // Named semantic tokens — used in code
  static const double cardPadding = md;
  static const double screenPadding = md;
  static const double sectionGap = lg;
  static const double listItemGap = sm;
  static const double iconTextGap = xs;
}

// lib/core/design_system/radii.dart
abstract class AppRadii {
  static const double sm = 4;
  static const double md = 8;
  static const double lg = 12;
  static const double xl = 16;
  static const double full = 999;

  static const card = BorderRadius.all(Radius.circular(lg));
  static const chip = BorderRadius.all(Radius.circular(full));
  static const button = BorderRadius.all(Radius.circular(md));
  static const bottomSheet = BorderRadius.vertical(top: Radius.circular(xl));
}

// Usage — every layout references the design system, never raw numbers
Padding(
  padding: const EdgeInsets.all(AppSpacing.screenPadding),
  child: Column(
    spacing: AppSpacing.sectionGap,   // Flutter 3.27+ Column.spacing
    children: [
      _Header(),
      _Content(),
    ],
  ),
)

Card(
  shape: RoundedRectangleBorder(borderRadius: AppRadii.card),
  child: Padding(
    padding: const EdgeInsets.all(AppSpacing.cardPadding),
    child: content,
  ),
)
```

**Rule:** If a designer says "increase card padding everywhere," you change ONE constant. Without tokens, you'd find-and-replace across 200 files. Design tokens are the bridge between Figma and code.

---

## Lab — Four Real Layout Challenges

Build each as a separate screen/widget:

**1. App Bar Row**
```
[☰ Menu]    MyApp Logo    [🔔] [👤]
```
`Row` with menu IconButton, centered Text (use `Expanded` + `Center`), two trailing buttons. The logo must be truly centered regardless of button sizes.

**2. Dashboard Stats**
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  ₹24,000 │  │   128    │  │   98%    │
│  Revenue │  │  Orders  │  │   Sat.   │
└──────────┘  └──────────┘  └──────────┘
```
Three `Expanded` cards in a `Row`. Each card is a `Column(mainAxisAlignment: center)` with a large number and a label.

**3. Chat Bubbles**
```
        ┌─────────────────────┐
        │  Can we meet at 3?  │    ← received: Align.topLeft, grey bg
        └─────────────────────┘
┌─────────────────────────┐
│  Sure! See you then ✓✓  │        ← sent: Align.topRight, primary color
└─────────────────────────┘
```
Use `Align` widget to position each bubble. `Container` with `BorderRadius` for the bubble shape. `mainAxisSize: MainAxisSize.min` on the inner Column so the bubble wraps its text.

**4. Pricing Card**
```
┌──────────────────────────┐
│  PRO                     │
│  ₹999 / month            │
│  ─────────────────────   │
│  ✓ Unlimited projects    │  ← Column, crossAxisAlignment.start
│  ✓ Priority support      │
│  ✓ Custom domain         │
│                          │
│  [   Get Started   ]     │  ← always at the BOTTOM of the card
└──────────────────────────┘
```
`Column` with `Expanded(child: features list)` so the button is always pushed to the bottom regardless of how many features there are.

---

## Challenge — Responsive Product Grid

Build a product grid that changes layout based on screen width:
- **< 480px:** 2 columns, square cells, only image + name
- **480–768px:** 3 columns, 4:3 ratio cells, image + name + price
- **> 768px:** 4 columns, full card with image + name + price + rating + button

Use `LayoutBuilder` for breakpoints. Use `GridView.builder` with `SliverGridDelegateWithFixedCrossAxisCount` for the grid. Same `Product` data, three different card layouts.

---

## Week 4 Verify — Answer Without Looking

1. `Container(width: 100)` as a direct `Scaffold.body` child fills the full screen. Explain using the words "tight", "constraints", and "preference".
2. What is the difference between `Expanded` and `Flexible` in a Row?
3. A `Column` inside a `ListView` crashes. What is the crash message? Why does it happen? What is the fix?
4. A Row has children with `flex: 1`, `flex: 2`, `flex: 1`. Available width is 400px. How wide is each child?
5. When would you use `Stack` instead of `Column`?
6. `CrossAxisAlignment.stretch` vs `CrossAxisAlignment.center` — what does stretch do differently?
7. What is `LayoutBuilder` and why is it better than `MediaQuery.of(context).size.width` for responsive layouts inside nested widgets?
8. Your app runs on phone, tablet, and desktop. How do you show `NavigationBar` on phone, `NavigationRail` on tablet, and `NavigationDrawer` on desktop — without three separate scaffolds?
9. `MediaQuery.sizeOf(context).width` vs `MediaQuery.of(context).size.width` — what rebuilds differently? Which should you prefer and why?
10. A designer says "increase card padding globally." With `AppSpacing` tokens, how many files do you change? Without tokens, what do you face? Why are semantic tokens like `AppSpacing.cardPadding` better than raw `AppSpacing.md`?

---

**Next → [Week 5: Navigation & State — Moving Between Screens](Week_05_Navigation_and_State.md)**
