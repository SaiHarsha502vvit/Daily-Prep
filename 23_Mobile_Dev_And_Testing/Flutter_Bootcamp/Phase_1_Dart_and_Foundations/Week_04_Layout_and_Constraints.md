# Week 4 — Layout & the Constraints Model
### The one rule that explains every layout mystery in Flutter

---

Flutter layout confuses beginners more than anything else. Buttons that fill the whole screen. `width: 100` that does nothing. Containers that ignore their size. All of this has one explanation.

---

## The Golden Rule

**Official Flutter docs state it in three lines:**

```
Constraints go DOWN.
Sizes go UP.
Parent sets position.
```

This is not a simplification. This is literally how Flutter's layout engine works. Memorise it before reading further.

---

## What Is a Constraint?

A constraint is four numbers:
- minimum width
- maximum width
- minimum height
- maximum height

Every widget receives a `BoxConstraints` object from its parent that says: "you can be anywhere between these min and max values."

```dart
BoxConstraints(
  minWidth: 0,
  maxWidth: 360,  // screen width
  minHeight: 0,
  maxHeight: 640, // screen height
)
```

The widget looks at these constraints and decides its own size. Then it tells its parent. The parent positions it.

---

## Why `Container(width: 100)` Fills the Whole Screen

This trips up every beginner:

```dart
// You expect a 100x100 red box
Container(width: 100, height: 100, color: Colors.red)
```

But when this is the direct child of `Scaffold`'s body, it fills the entire screen.

**Why?** Scaffold gives its body **tight constraints** — the constraint's min and max are both equal to the screen size. The widget has no choice but to be that size. The `width: 100` you set is smaller than the minimum — Flutter ignores it.

**Fix:**
```dart
// Center gives LOOSE constraints (min = 0, max = screen size)
// Now your Container can choose 100x100
Center(
  child: Container(width: 100, height: 100, color: Colors.red),
)
```

---

## Tight vs Loose Constraints

**Tight:** min == max. The widget is forced to be exactly one size. No choice.
```dart
// SizedBox.expand gives tight constraints equal to available space
SizedBox.expand(child: Container(color: Colors.blue)) // fills parent exactly
```

**Loose:** min == 0. The widget can be anywhere from 0 to max.
```dart
// Center passes loose constraints to its child
Center(child: Text('I choose my own size'))
```

**Unbounded:** max == `double.infinity`. The widget can be any size.
```dart
// ListView gives its children unbounded height (they scroll)
ListView(children: [Container(height: 200), Container(height: 300)])
```

**This is why `Column` inside `Column` can crash:** the outer Column gives unbounded height to the inner Column. The inner Column doesn't know what height to be, and asks for infinity. Flutter throws a `RenderFlex overflow` error.

---

## Column, Row — The Flex Widgets

`Column` arranges children vertically. `Row` arranges them horizontally. Both are `Flex` widgets.

**How Column handles constraints:**
1. Column receives a max height from its parent (e.g., 640)
2. It gives each non-flexible child unbounded height in the main axis (vertical) so they can be their natural size
3. It measures each child's size
4. Whatever space is left goes to `Expanded` / `Flexible` children

```dart
Column(
  children: [
    Container(height: 100, color: Colors.red),    // takes 100px
    Container(height: 80, color: Colors.blue),    // takes 80px
    Expanded(
      child: Container(color: Colors.green),       // takes remaining 460px
    ),
  ],
)
```

**`mainAxisAlignment` — along the main direction:**
```dart
Column(
  mainAxisAlignment: MainAxisAlignment.center,       // center vertically
  // MainAxisAlignment.start                          // top
  // MainAxisAlignment.end                            // bottom
  // MainAxisAlignment.spaceBetween                   // gaps between
  // MainAxisAlignment.spaceAround                    // gaps around each
  // MainAxisAlignment.spaceEvenly                    // all gaps equal
)
```

**`crossAxisAlignment` — perpendicular to main direction:**
```dart
Column(
  crossAxisAlignment: CrossAxisAlignment.start,      // align left
  // CrossAxisAlignment.end                           // align right
  // CrossAxisAlignment.center                        // center
  // CrossAxisAlignment.stretch                       // fill full width
)
```

**→ Try this:** Build a Column with 3 containers of heights 80, 120, 60. First, make it `spaceBetween` with `center` cross-axis. Then change to `spaceEvenly` with `stretch`. See how the layout changes.

---

## Expanded vs Flexible

Both give children a portion of the remaining space. The difference is subtle.

```dart
Row(
  children: [
    Expanded(
      flex: 2,              // takes 2/3 of remaining space
      child: Container(color: Colors.red),    // forced to fill its allocation
    ),
    Flexible(
      flex: 1,              // offered 1/3 of remaining space
      child: Container(     // can be SMALLER than its allocation
        width: 30,          // takes only 30px even if 120px was available
        color: Colors.blue,
      ),
    ),
  ],
)
```

**Rule:** `Expanded` = must fill allocated space. `Flexible` = can be smaller than allocated space.

---

## Stack — Layering

`Stack` puts children on top of each other. The first child is at the bottom, last is on top.

```dart
Stack(
  children: [
    // Bottom layer — fills the Stack's space
    Container(color: Colors.blue),

    // Middle layer — positioned
    Positioned(
      top: 16,
      left: 16,
      child: const Text('Top left', style: TextStyle(color: Colors.white)),
    ),

    // Top layer — centered
    const Center(
      child: Icon(Icons.play_arrow, size: 64, color: Colors.white),
    ),
  ],
)
```

**`Positioned` only works inside a `Stack`.** It places a child at an absolute position within the Stack.

**→ Try this:** Build a card using Stack: a background image (or colored Container), a gradient overlay at the bottom (use `Container` with a `LinearGradient` decoration), and text over the gradient at the bottom-left. This is the standard "image card with text" pattern.

---

## Common Constraint Widgets

| Widget | What it does to constraints |
|--------|----------------------------|
| `SizedBox(width, height)` | Imposes exact size (tight) |
| `ConstrainedBox(constraints)` | Adds constraints on top of parent's |
| `Expanded` | Forces child to fill remaining flex space |
| `Flexible` | Offers remaining flex space, child can be smaller |
| `Center` | Loosens constraints (min = 0), centers child |
| `Align` | Loosens constraints, aligns child within available space |
| `FractionallySizedBox` | Sizes child as fraction of parent |
| `UnconstrainedBox` | Removes constraints entirely — use with care (may overflow) |
| `OverflowBox` | Like UnconstrainedBox but suppresses overflow warnings |
| `FittedBox` | Scales child to fit within constraints |

---

## The Most Common Layout Mistakes

**1. Column inside Column — unbounded height:**
```dart
// CRASHES — inner Column has no max height
Column(
  children: [
    Column(children: [ /* items */ ]),
  ],
)

// FIX — wrap inner column with Expanded or give it a fixed height
Column(
  children: [
    Expanded(child: Column(children: [ /* items */ ])),
  ],
)
```

**2. ListView inside Column — also unbounded:**
```dart
// CRASHES
Column(
  children: [
    ListView(children: [ /* items */ ]),  // ListView needs a max height
  ],
)

// FIX — give ListView a bounded height
Column(
  children: [
    Expanded(
      child: ListView(children: [ /* items */ ]),
    ),
  ],
)
```

**3. Row overflow:**
```dart
// OVERFLOWS if children are too wide
Row(
  children: [
    Text('A very very very long text that overflows'),
    Text('Another long text'),
  ],
)

// FIX — wrap with Expanded to allow truncation
Row(
  children: [
    Expanded(child: Text('A very very very long text', overflow: TextOverflow.ellipsis)),
    const Text('Short'),
  ],
)
```

---

## How Scaffold Distributes Space

When you write a `Scaffold`, here's what happens with its space:

```
Scaffold (full screen size)
  ├── AppBar: takes its natural height (usually 56dp)
  ├── body: gets remaining height — tight constraints fill the whole body
  ├── bottomNavigationBar: takes its natural height
  └── floatingActionButton: positioned over the body
```

The body always gets tight constraints (min == max == remaining space). That's why a bare `Container` in the body fills the whole screen.

---

## Lab — Build These Layouts

No navigation needed. Just build each layout as a separate screen (or tab).

**Layout 1: Card with Overlay**
```
┌─────────────────────────────────┐
│     [full-width image]          │
│                                 │
│  ▓▓▓▓▓▓▓▓▓ gradient ▓▓▓▓▓▓▓▓   │ ← bottom 40% dark gradient
│  Movie Title                    │ ← white text bottom-left
│  ★★★★☆  Action • 2h 15m        │ ← rating and metadata
└─────────────────────────────────┘
```
Use: `Stack`, `Positioned`, `Container` with `BoxDecoration(gradient: LinearGradient)`

**Layout 2: Dashboard Stats Row**
```
┌──────────┬──────────┬──────────┐
│ Projects │Followers │Following │
│    12    │  1.4K    │   230    │
└──────────┴──────────┴──────────┘
```
Each cell is equal width. Use: `Row`, `Expanded(flex: 1)`, `Column`, `Text`

**Layout 3: Chat Bubble**
```
[avatar]  ┌───────────────────┐
          │ This is a message │
          │ that wraps nicely │
          └───────────────────┘
                                    ┌────────────────────┐
                                    │ This is your reply │
                              [you] └────────────────────┘
```
Left-aligned and right-aligned bubbles. Use: `Row`, `CrossAxisAlignment.end`, conditional `mainAxisAlignment`

**Layout 4: Pricing Card**
```
┌──────────────────────────────┐
│ PRO                          │
│                              │
│ ₹999 / month                 │
│                              │
│ ✓ Unlimited projects         │
│ ✓ Priority support           │
│ ✓ Custom domain              │
│                              │
│ [  Get Started  ]            │
└──────────────────────────────┘
```
The card should take 80% of the screen width. The button fills the full card width. Use: `FractionallySizedBox` or `width: MediaQuery.of(context).size.width * 0.8`

---

## Challenge

Build a **responsive layout** that changes based on screen width:

- **Narrow (< 600px):** Single column — image on top, text below
- **Wide (≥ 600px):** Two columns — image on left (40% width), text on right (60%)

Use `LayoutBuilder` to detect width:
```dart
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth < 600) {
      return Column(/* narrow layout */);
    }
    return Row(/* wide layout */);
  },
)
```

Test by resizing the Flutter window (web/desktop) or rotating the device.

---

## Before Week 5 — Verify

1. What does "constraints go down, sizes go up" mean in practice?
2. Why does `Container(width: 100)` fill the screen when it's Scaffold's direct body child?
3. What is the difference between `Expanded` and `Flexible`?
4. Why does `ListView` inside `Column` crash without wrapping in `Expanded`?
5. What constraint does `Center` pass to its child — tight or loose?

---

**Next → [Week 5: Navigation & State](Week_05_Navigation_and_State.md)**
