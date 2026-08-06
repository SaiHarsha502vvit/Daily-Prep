# Layout & Constraints Challenges

### Companion to [Week 04: Layout & Constraints](Week_04_Layout_and_Constraints.md)

---

## How This Works

The instrument this time is `LayoutBuilder` — it hands you the actual `BoxConstraints` a widget received, live, so instead of guessing why a layout looks wrong you can print exactly what constraints flowed into it. Every problem: predict the numbers on paper first (constraints go down, sizes go up — you have the rule from Week 4), then verify by printing.

---

### W4-1 (Easy) — Predict constraints at three nested levels

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: ConstraintProbe()));

class ConstraintProbe extends StatelessWidget {
  const ConstraintProbe({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (context, scaffoldBodyConstraints) {
          debugPrint('1. Scaffold body: $scaffoldBodyConstraints');
          return Padding(
            padding: const EdgeInsets.all(20),
            child: LayoutBuilder(
              builder: (context, paddingConstraints) {
                debugPrint('2. Inside Padding: $paddingConstraints');
                return SizedBox(
                  width: 150,
                  child: LayoutBuilder(
                    builder: (context, sizedBoxConstraints) {
                      debugPrint('3. Inside SizedBox(width:150): $sizedBoxConstraints');
                      return Container(color: Colors.blue, height: 40);
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
```

**Task:** assuming a 390-wide, 844-tall phone screen (minus status/nav bars, assume the Scaffold body gets tight 390×~800), predict all three printed `BoxConstraints` **before** running:

1. What are the min/max width and height at print 1 (Scaffold body)?
2. `Padding(all: 20)` subtracts 20 from each side. What changes at print 2?
3. `SizedBox(width: 150)` forces a specific width. What does print 3 look like — is width tight now? Is height still whatever it was before?

<details><summary>Answer & Explanation</summary>

```
1. Scaffold body:              BoxConstraints(0.0<=w<=390.0, 0.0<=h<=800.0)  -- actually TIGHT: w=390.0, h=800.0
2. Inside Padding:             BoxConstraints(w=350.0, h=760.0)  -- 20px removed from each of 4 sides: 390-40=350, 800-40=760
3. Inside SizedBox(width:150): BoxConstraints(w=150.0, h=760.0)  -- width forced tight to 150, height passed through unchanged
```

🔴 **Erklärung:** the Scaffold body constraints are **tight** (min==max) — the screen size isn't a suggestion, it's a mandate, which is exactly why [Week 4](Week_04_Layout_and_Constraints.md) opens with "a `Container(width: 100)` as a direct Scaffold child fills the screen." `Padding` is the one widget that actually *shrinks* the constraint range it passes down — 20px per side, 4 sides total (2 horizontal, 2 vertical) removed from the tight width/height. `SizedBox(width: 150)` overrides only the width dimension of the constraints it passes to its child — it doesn't touch height at all, so whatever height constraint arrived (760, still tight from Padding) passes straight through unchanged. This is "constraints go down" made completely literal — you're watching the actual numbers propagate.

</details>

---

### W4-2 (Medium) — Reproduce and fix "unbounded height" two ways

```dart
class BrokenScroll extends StatelessWidget {
  const BrokenScroll({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            const Text('Header'),
            Expanded( // <-- this line crashes
              child: ListView.builder(
                itemCount: 20,
                itemBuilder: (_, i) => ListTile(title: Text('Item $i')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

**Task 1:** run it, read the exact error message in the console (it names the offending widget). Which widget throws it — `SingleChildScrollView`, `Column`, `Expanded`, or `ListView`?

**Task 2:** produce **two** different working fixes:
- **Fix A:** remove `Expanded`, and instead make the inner `ListView` behave (shrinkWrap + a scroll-physics change) so the whole page scrolls as one unit.
- **Fix B:** remove the outer `SingleChildScrollView` entirely and restructure so `Expanded` genuinely has a bounded space to expand into.

Which fix would you actually ship, and why — think about what happens to scroll performance in each with 10,000 list items instead of 20.

<details><summary>Solution & Explanation</summary>

```dart
// Fix A — one scrollable, ListView cooperates with it
Column(
  children: [
    const Text('Header'),
    ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 20,
      itemBuilder: (_, i) => ListTile(title: Text('Item $i')),
    ),
  ],
)
// (no SingleChildScrollView needed here if the Column itself
//  is wrapped in one, OR wrap this whole Column in SingleChildScrollView)

// Fix B — remove the outer scroll view, let Expanded do its job
Column(
  children: [
    const Text('Header'),
    Expanded(
      child: ListView.builder(
        itemCount: 20,
        itemBuilder: (_, i) => ListTile(title: Text('Item $i')),
      ),
    ),
  ],
)
```

🔴 **Erklärung:** the error is thrown by the `ListView` ("Vertical viewport was given unbounded height"), but the *cause* is upstream — `SingleChildScrollView` deliberately gives its child `maxHeight: infinity` (that's the whole point of a scroll view: infinite content, finite viewport), and `Expanded` then tries to compute "remaining space" as `infinity - other children's height`, which is still infinity, and a `ListView` refuses to lay out with infinite height.

**Fix A** (`shrinkWrap: true`) makes the inner ListView size itself to its content instead of trying to fill available space — but it does so by laying out and measuring **all 20 items upfront**, defeating `ListView.builder`'s whole lazy-building advantage. With 10,000 items this fix becomes a real performance problem.

**Fix B** removes the conflict at the source — no infinite-height ancestor, so `Expanded` gets a real bounded number to divide, and the inner `ListView` gets to be properly lazy (only builds visible items, from [Week 7's Sliver Protocol](../Phase_2_Core_UI/Week_07_Scrolling_and_Slivers.md)). **Fix B is what you'd ship** at any real scale — Fix A only looks equivalent at 20 items.

</details>

---

### W4-3 (Medium) — Responsive breakpoint, no MediaQuery hacks

**Problem:** build a product list that's a single-column `ListView` under 600px width, and a 2-column `GridView` at 600px and above — using **only** `LayoutBuilder`, not `MediaQuery.of(context).size`.

**Constraint:** think about *why* `LayoutBuilder` is the more correct tool here versus `MediaQuery` — what's different about the space `LayoutBuilder` reports vs. the whole-screen size `MediaQuery` reports, especially if this widget is ever placed inside something narrower than the full screen (a side panel, a dialog, a split view)?

<details><summary>Solution & Explanation</summary>

```dart
class ResponsiveProductList extends StatelessWidget {
  const ResponsiveProductList({super.key, required this.products});
  final List<String> products;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 600) {
          return ListView.builder(
            itemCount: products.length,
            itemBuilder: (_, i) => ListTile(title: Text(products[i])),
          );
        }
        return GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
          ),
          itemCount: products.length,
          itemBuilder: (_, i) => Card(child: Center(child: Text(products[i]))),
        );
      },
    );
  }
}
```

🔴 **Erklärung:** `MediaQuery.of(context).size` reports the size of the **entire device screen**, full stop — it has no idea how much space *this specific widget* actually has to work with. `LayoutBuilder`'s `constraints.maxWidth` reports exactly what its parent handed down at this position in the tree. Drop `ResponsiveProductList` into a 350px-wide side panel on a tablet: `MediaQuery` still reports the tablet's full ~1000px width (wrong answer — you'd get the grid, which won't fit), while `LayoutBuilder` correctly reports ~350px (right answer — you get the list). The rule: **use `MediaQuery` for device-level concerns (safe area insets, keyboard height, platform brightness); use `LayoutBuilder` for "how much space do I, specifically, have."**

</details>

---

### W4-4 (Hard) — Flex math: fix the overflow, then hit an exact ratio

```dart
class BrokenRow extends StatelessWidget {
  const BrokenRow({super.key});
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Card(child: Container(width: 200, height: 100, color: Colors.red)),
        Card(child: Container(width: 200, height: 100, color: Colors.blue)),
        Card(child: Container(width: 200, height: 100, color: Colors.green)),
      ],
    ); // on a 390-wide phone: 3 × 200 = 600 > 390 → overflow (yellow/black stripes)
  }
}
```

**Task 1:** fix the overflow using `Expanded` on all three, equal share.

**Task 2 (the actual exercise):** now make the red card take up exactly **50%** of the row, and blue/green each take **25%**. Show your `flex` values and the arithmetic that proves they're correct for a 390px-wide row (what width, in pixels, does each card actually get?).

<details><summary>Solution & Explanation</summary>

```dart
Row(
  children: [
    Expanded(flex: 2, child: Card(child: Container(height: 100, color: Colors.red))),
    Expanded(flex: 1, child: Card(child: Container(height: 100, color: Colors.blue))),
    Expanded(flex: 1, child: Card(child: Container(height: 100, color: Colors.green))),
  ],
)
```

**The arithmetic:** total flex = 2 + 1 + 1 = 4. Row width = 390.
- Red: `390 × (2/4)` = 195px (50%)
- Blue: `390 × (1/4)` = 97.5px (25%)
- Green: `390 × (1/4)` = 97.5px (25%)

🔴 **Erklärung:** the original overflow happens because each `Container(width: 200)` has an **explicit width preference**, and a `Row` gives its children **loose** constraints (they're free to pick any width up to the available space) — so each `Container` happily picks its preferred 200px, and three of them add up to more space than the `Row` has. `Expanded` changes the deal entirely: it gives its child **tight** constraints computed from the flex ratio, overriding whatever width the child "wanted." `flex: 2` vs `flex: 1, flex: 1` isn't a percentage you type in directly — it's a ratio the layout algorithm divides available space by, which is exactly the Column flex-math walkthrough from [Week 4's Invisible Machinery](Week_04_Layout_and_Constraints.md), just on the horizontal axis instead of vertical.

</details>

---

**Next → [Week 5: Navigation & State](Week_05_Navigation_and_State.md) · [Navigation Challenges](Week_05b_Navigation_Challenges.md)**
