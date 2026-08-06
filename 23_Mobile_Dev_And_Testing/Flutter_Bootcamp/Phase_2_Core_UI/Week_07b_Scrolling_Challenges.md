# Scrolling & Slivers Challenges

### Companion to [Week 07: Scrolling & Slivers](Week_07_Scrolling_and_Slivers.md)

---

## How This Works

Same tools as the Phase 1 challenge files: `debugPrint` to prove build behavior, predict-then-verify for anything involving numbers or timing. Paste starters into [DartPad](https://dartpad.dev).

---

### W7-1 (Easy) — Prove ListView.builder is actually lazy

**Setup:**

```dart
class LazyProof extends StatelessWidget {
  const LazyProof({super.key});
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: 5000,
      itemBuilder: (context, index) {
        debugPrint('Building item $index');
        return ListTile(title: Text('Item $index'));
      },
    );
  }
}
```

**Task 1:** predict — on first load, roughly how many `Building item N` lines print? All 5000? A dozen? Something else?

**Task 2:** scroll down slowly and watch the console. Does the count of *currently built* items stay roughly constant, or does it keep growing the further you scroll?

**Task 3:** replace `ListView.builder` with a plain `ListView(children: [for (int i = 0; i < 5000; i++) ListTile(title: Text('Item $i'))])` and rerun. Predict the print count now, before running.

<details><summary>Explanation</summary>

`ListView.builder` prints roughly 15-20 lines on first load — only the items currently visible on screen, plus a small "cache extent" buffer just past each edge. Scroll down and the count of *simultaneously* built items stays roughly flat — old items scrolled off the top get their elements destroyed as new ones at the bottom get built.

The plain `ListView(children: [...])` version prints all 5000 lines immediately, before a single pixel is painted — every `ListTile` is built up front regardless of whether it will ever be visible.

🔴 **Explanation:** this is the Sliver Protocol from [Week 7's Invisible Machinery](Week_07_Scrolling_and_Slivers.md) made directly observable — `ListView.builder`'s `itemBuilder` is a lazy factory the viewport calls only for positions it's actually about to paint, which is why memory usage for a 5000-item list is roughly the same as a 20-item list. The plain-`children:` constructor has no such protocol; it's just a `Column`-like widget holding a pre-built list, and building all 5000 `ListTile`s up front is exactly the mistake [Week 4's layout content](../Phase_1_Dart_and_Foundations/Week_04_Layout_and_Constraints.md) warns against for long lists.

</details>

---

### W7-2 (Medium) — Infinite scroll, and the double-fetch bug

**Setup:** an incomplete pagination implementation.

```dart
class InfiniteList extends StatefulWidget {
  const InfiniteList({super.key});
  @override
  State<InfiniteList> createState() => _InfiniteListState();
}

class _InfiniteListState extends State<InfiniteList> {
  final List<int> _items = List.generate(20, (i) => i);
  final ScrollController _controller = ScrollController();

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onScroll);
  }

  void _onScroll() {
    if (_controller.position.pixels > _controller.position.maxScrollExtent - 200) {
      _loadMore(); // BUG: nothing stops this firing 5+ times in a row
    }
  }

  Future<void> _loadMore() async {
    debugPrint('Fetching page starting at ${_items.length}...');
    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      _items.addAll(List.generate(20, (i) => _items.length + i));
    });
    debugPrint('Loaded. Total items: ${_items.length}');
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: _controller,
      itemCount: _items.length,
      itemBuilder: (_, i) => ListTile(title: Text('Item ${_items[i]}')),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

**Task 1:** run it, scroll to near the bottom, and hold your scroll there for a couple seconds. Watch the console — how many "Fetching page..." lines print for what should be one pagination event?

**Task 2:** fix it with a loading-flag guard, so a fetch in flight blocks new fetches from starting.

<details><summary>Solution & Explanation</summary>

```dart
bool _isLoading = false;

void _onScroll() {
  if (_isLoading) return;
  if (_controller.position.pixels > _controller.position.maxScrollExtent - 200) {
    _loadMore();
  }
}

Future<void> _loadMore() async {
  _isLoading = true;
  debugPrint('Fetching page starting at ${_items.length}...');
  await Future.delayed(const Duration(seconds: 1));
  setState(() {
    _items.addAll(List.generate(20, (i) => _items.length + i));
    _isLoading = false;
  });
  debugPrint('Loaded. Total items: ${_items.length}');
}
```

🔴 **Explanation:** `ScrollController`'s listener fires on *every* scroll position update — potentially dozens of times per second while the user's finger is moving, and it keeps firing near the bottom edge even while a `_loadMore()` call from a moment ago is still awaiting its `Future.delayed`. Without a guard, you fire 5-10 near-simultaneous fetches for what the user experienced as one continuous scroll gesture. The `_isLoading` flag is the same "in-flight request" guard pattern that [Week 20's BLoC `droppable()` transformer](../Phase_5_Advanced_Patterns/Week_20_BLoC_Pattern.md) solves for double-tapped buttons — same bug shape, different trigger.

</details>

---

### W7-3 (Medium) — Sticky header opacity math

**Problem:** build a `SliverPersistentHeader` whose title text fades in as the header shrinks from `maxExtent` toward `minExtent`. You compute the opacity yourself from `shrinkOffset`.

```dart
class _StickyHeaderDelegate extends SliverPersistentHeaderDelegate {
  _StickyHeaderDelegate({required this.minExtent, required this.maxExtent});
  @override
  final double minExtent;
  @override
  final double maxExtent;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    // TODO: compute `opacity` in [0.0, 1.0] — 0 when fully expanded
    // (shrinkOffset == 0), 1 when fully collapsed (shrinkOffset == maxExtent - minExtent)
    final double opacity = 0; // fix this

    return Container(
      color: Colors.deepPurple,
      alignment: Alignment.center,
      child: Opacity(
        opacity: opacity,
        child: const Text('Title', style: TextStyle(color: Colors.white, fontSize: 20)),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _StickyHeaderDelegate oldDelegate) =>
      minExtent != oldDelegate.minExtent || maxExtent != oldDelegate.maxExtent;
}
```

**Task:** with `minExtent: 60, maxExtent: 200`, by hand compute what `opacity` should be when `shrinkOffset` is 0, 70, and 140 — then write the general formula.

<details><summary>Solution & Explanation</summary>

```dart
final double range = maxExtent - minExtent; // 200 - 60 = 140
final double opacity = (shrinkOffset / range).clamp(0.0, 1.0);
```

By-hand values: `shrinkOffset=0` → `0/140 = 0.0`. `shrinkOffset=70` → `70/140 = 0.5`. `shrinkOffset=140` → `140/140 = 1.0` (fully collapsed, title fully visible).

🔴 **Explanation:** `shrinkOffset` isn't a percentage — it's the raw pixel distance the header has collapsed from `maxExtent`, ranging from `0` (fully expanded) to `maxExtent - minExtent` (fully collapsed, sitting at `minExtent`). The `.clamp(0.0, 1.0)` isn't defensive paranoia — `SliverPersistentHeader` can call `build` with a `shrinkOffset` that momentarily exceeds `maxExtent - minExtent` during overscroll/bounce, and an `Opacity` widget throws an assertion error outside `[0.0, 1.0]`. This is the same "derive the formula from the two known endpoints" reasoning as Kadane's algorithm in [Week 1b](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md) — you have two known points (0→0, range→1) and linear interpolation between them.

</details>

---

### W7-4 (Hard) — Predict the pinned/floating/snap matrix

**Problem:** `SliverAppBar` has three independent booleans that combine to produce different scroll behaviors: `pinned`, `floating`, `snap`. Before running anything, fill in this table with your prediction of what happens when the user scrolls down, then scrolls back up a little:

| pinned | floating | snap | Scrolling down | Scrolling up a little |
|--------|----------|------|-----------------|------------------------|
| false | false | false | ? | ? |
| true | false | false | ? | ? |
| false | true | false | ? | ? |
| false | true | true | ? | ? |

Then build a `CustomScrollView` with a `SliverAppBar` and a long `SliverList`, and test all four combinations for real.

<details><summary>Answer</summary>

| pinned | floating | snap | Scrolling down | Scrolling up a little |
|--------|----------|------|-----------------|------------------------|
| false | false | false | App bar scrolls away entirely with the content | Stays gone until you scroll all the way back to the top |
| true | false | false | App bar shrinks to a thin bar and **stays pinned** at the top | Already visible (it never left) |
| false | true | false | App bar scrolls away entirely | Reappears **immediately**, following your upward scroll distance pixel-for-pixel |
| false | true | true | App bar scrolls away entirely | Reappears immediately, and **snaps** fully into view even if you only scrolled up a tiny bit |

🔴 **Explanation:** `pinned` and `floating` answer two independent questions — `pinned` is "does a sliver of the app bar always stay visible no matter how far down you scroll," `floating` is "does the app bar reappear on the very first upward scroll, without needing to scroll all the way back to the top." `snap` only matters combined with `floating: true` — it decides whether a partial reveal (user scrolled up just 10px) completes itself into a full reveal automatically, versus tracking the scroll distance exactly and stopping wherever the user stops. Getting `pinned`/`floating` reversed is one of the most common real Flutter bugs — reproducing all four combinations yourself is the fastest way to stop mixing them up.

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Scroll-to-Top Button That Never Appears

```dart
class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});
  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final ScrollController _controller = ScrollController();
  bool _showScrollTop = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final showNow = _controller.offset > 300;
      _showScrollTop = showNow; // <-- bug is on this line
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView.builder(
        controller: _controller,
        itemCount: 100,
        itemBuilder: (_, i) => ListTile(title: Text('Item $i')),
      ),
      floatingActionButton: _showScrollTop
          ? FloatingActionButton(
              onPressed: () => _controller.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut),
              child: const Icon(Icons.arrow_upward),
            )
          : null,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

Scroll down past 300px. The button should appear. It doesn't. There's no crash, no error — just nothing visibly happening. Find it.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `_showScrollTop = showNow;` genuinely does update the field's value — but it does so **outside of `setState`**, inside a plain listener callback. Flutter has no idea the value changed, because nothing told it to rebuild — this is the exact same mechanism as [Week 12's ChangeNotifier bug](../Phase_3_State_and_APIs/Week_12b_State_Management_Challenges.md#w12-1-medium--changenotifier--listenablebuilder-no-package): mutating a field is invisible to the widget tree unless something explicitly triggers a rebuild. The fix:

```dart
_controller.addListener(() {
  final showNow = _controller.offset > 300;
  if (showNow != _showScrollTop) {
    setState(() => _showScrollTop = showNow);
  }
});
```

The `if (showNow != _showScrollTop)` guard is worth noticing too — without it, you'd call `setState` on *every single scroll pixel* while scrolled past 300, not just at the crossing point, which works but wastes a rebuild per frame for no benefit once you're already past the threshold.

</details>

---

### 🎭 Two Truths and a Lie — Slivers

**A.** `SliverList` and `SliverGrid` both only build the children currently within the viewport plus a small cache extent — neither one builds its entire item count upfront.

**B.** A `CustomScrollView` can contain both sliver widgets (`SliverAppBar`, `SliverList`) and non-sliver widgets (`Container`, `Text`) directly as children, mixed freely.

**C.** `shrinkWrap: true` on a `ListView` makes it measure and lay out all of its children to determine its own size, defeating the lazy-building behavior that makes `ListView.builder` efficient in the first place.

<details><summary>Which one's the lie</summary>

**B is the lie.** `CustomScrollView.slivers` requires every direct child to actually **be** a sliver (`SliverList`, `SliverAppBar`, `SliverToBoxAdapter`, etc.) — you cannot drop a plain `Container` or `Text` directly into that list; it'll fail to compile (wrong type) or, if you do it via a widget expecting `Widget` generically, misbehave badly at layout time, because slivers and box widgets speak fundamentally different layout protocols (`SliverConstraints`/`SliverGeometry` vs. `BoxConstraints`/`Size`). To put ordinary box widgets inside a `CustomScrollView`, you wrap them: `SliverToBoxAdapter(child: Text('...'))` — that adapter is precisely the bridge between the two protocols.

🔴 **Explanation:** A and C are both true and both important. A is [W7-1's](#w7-1-easy--prove-listviewbuilder-is-actually-lazy) core proof extended to grids. C is the reason `shrinkWrap: true` isn't a free "make it fit" fix — it's a genuine trade-off (from [W4-2](../Phase_1_Dart_and_Foundations/Week_04b_Layout_Challenges.md#w4-2-medium--reproduce-and-fix-unbounded-height-two-ways)) that only makes sense for short, bounded lists.

</details>

---

### ⚔️ Refactor Duel — From `Column` to `ListView.builder`, Prove the Win

This works. It's also a scalability trap.

```dart
class MessageList extends StatelessWidget {
  const MessageList({required this.messages});
  final List<String> messages;
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: messages.map((m) => ListTile(title: Text(m))).toList(),
      ),
    );
  }
}
```

**Task:** refactor to `ListView.builder`. Then, without running anything, argue in one or two sentences why the refactored version scales to 50,000 messages and the original doesn't — refer back to [W7-1](#w7-1-easy--prove-listviewbuilder-is-actually-lazy) if you need to.

<details><summary>Solution & Explanation</summary>

```dart
class MessageList extends StatelessWidget {
  const MessageList({required this.messages});
  final List<String> messages;
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: messages.length,
      itemBuilder: (_, i) => ListTile(title: Text(messages[i])),
    );
  }
}
```

🔴 **Explanation:** the original calls `.map(...).toList()` **eagerly** — every single `ListTile` for every message is constructed the moment `build()` runs, whether or not it's ever scrolled into view, exactly the "plain `children:`" failure mode proven in [W7-1](#w7-1-easy--prove-listviewbuilder-is-actually-lazy). `ListView.builder`'s `itemBuilder` is a factory the viewport calls on demand — at 50,000 messages, the original builds 50,000 `ListTile`s (and everything nested inside each) up front, most of which paint zero pixels; the refactored version builds roughly a screen's worth, regardless of whether the list holds 50 or 50,000 items.

</details>

---

**Next → [Week 8: Forms & Input](Week_08_Forms_and_Input.md) · [Forms Challenges](Week_08b_Forms_Challenges.md)**
