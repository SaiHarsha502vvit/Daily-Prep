# Week 7 — Scrolling & Slivers
### How Flutter builds scrollable UIs that feel native — and why two APIs exist

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — how the scroll system works under the hood, when to use which API
> - 🎨 **Designer** — scroll behavior, collapsing headers, parallax, Material scroll conventions
> - 🧪 **Tester** — scrolling in tests, finding off-screen widgets, verifying scroll behavior

---

## Why Two Scroll APIs?

> 📄 **Flutter Docs:**
> *"Flutter has two categories of scrollable widgets: box protocol and sliver protocol. Box protocol widgets (like ListView and GridView) are easy to use and cover most use cases. Sliver protocol widgets are more efficient for variable-height content and required for complex scrollable layouts."*

The simple answer: `ListView` is easy. Slivers are powerful.

```
ListView  → "Here is a list of items. Flutter, figure it out."
Slivers   → "Here is exactly how I want each section of the scroll area to behave."
```

Every `ListView`, `GridView`, and `SingleChildScrollView` is secretly a `CustomScrollView` with slivers under the hood. When you need a collapsing AppBar, sticky section headers, or mixing a grid and a list in one scroll — you use slivers directly.

---

## 1. ListView — The Simple Case

> 📄 **Flutter Docs:**
> *"A scrollable list of widgets. ListView is the most commonly used scrolling widget. It displays its children one after another in the scroll direction. In the cross axis, the children are required to fill the ListView."*

### `ListView` — When you already have all items

```dart
// Use ListView when items are few and already loaded
// Flutter renders ALL children at once — don't use this for 1000+ items
ListView(
  padding: const EdgeInsets.all(16),
  children: [
    ProfileHeader(),
    const SizedBox(height: 16),
    StatisticsCard(),
    const SizedBox(height: 16),
    ...actionItems.map((item) => ActionListTile(item: item)),
  ],
)
```

### `ListView.builder` — When items are dynamic or many

```dart
// ListView.builder is LAZY — only builds items visible on screen
// Items scroll off screen? They are disposed. Scroll back? Rebuilt.
// Safe for 10,000 items. Not safe for plain ListView.
ListView.builder(
  itemCount: messages.length,
  itemExtent: 72,  // ← optimization: if all items are same height, set this
  itemBuilder: (context, index) {
    final message = messages[index];
    return MessageTile(
      key: ValueKey(message.id),  // key helps Flutter reuse elements correctly
      message: message,
    );
  },
)
```

### `ListView.separated` — When you need dividers

```dart
ListView.separated(
  itemCount: contacts.length,
  separatorBuilder: (context, index) => const Divider(height: 1),
  itemBuilder: (context, index) => ContactTile(contact: contacts[index]),
)
```

**Rule:** Always use `ListView.builder` unless your list is small (under ~20 items) and already fully loaded. Lazy building is never wrong — it's just slightly more code.

🎨 **Designer:** Flutter's `ListView` respects the scroll physics of the platform. On iOS it bounces at the edges (elastic scroll). On Android it shows an overscroll glow. You can control this with `physics`:

```dart
ListView.builder(
  physics: const ClampingScrollPhysics(),   // Android-style: no bounce on iOS
  physics: const BouncingScrollPhysics(),   // iOS-style bounce on all platforms
  physics: const NeverScrollableScrollPhysics(), // disable scrolling entirely
  // ...
)
```

🧪 **Tester:** Items not on screen don't exist in the widget tree — `find.text()` won't find them:

```dart
testWidgets('list renders items and scrolls', (tester) async {
  await tester.pumpWidget(MaterialApp(
    home: Scaffold(body: ContactsList(contacts: testContacts)),
  ));

  // Only the first few items are visible — find works for visible items
  expect(find.text('Alice'), findsOneWidget);

  // For off-screen items: scroll first, then find
  await tester.scrollUntilVisible(
    find.text('Zara'),          // what to look for
    500.0,                       // how far to scroll each step
    scrollable: find.byType(Scrollable),
  );
  expect(find.text('Zara'), findsOneWidget);
});
```

---

## 2. GridView

> 📄 **Flutter Docs:**
> *"A scrollable, 2D array of widgets. GridView's behavior is similar to ListView but it displays widgets in a grid format."*

```dart
// Fixed count grid — 2 columns, always
GridView.count(
  crossAxisCount: 2,
  mainAxisSpacing: 12,
  crossAxisSpacing: 12,
  childAspectRatio: 0.75,   // taller than wide (like a product card)
  padding: const EdgeInsets.all(16),
  children: products.map((p) => ProductCard(product: p)).toList(),
)

// Builder grid — lazy, for many items
GridView.builder(
  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    mainAxisSpacing: 12,
    crossAxisSpacing: 12,
    childAspectRatio: 0.75,
  ),
  itemCount: products.length,
  itemBuilder: (context, index) => ProductCard(product: products[index]),
)

// Responsive grid — fills available space with fixed-size cells
GridView.builder(
  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
    maxCrossAxisExtent: 200,   // each cell at most 200px wide
    mainAxisSpacing: 12,
    crossAxisSpacing: 12,
    childAspectRatio: 1.0,
  ),
  itemCount: photos.length,
  itemBuilder: (context, index) => PhotoTile(photo: photos[index]),
)
```

🎨 **Designer:** `SliverGridDelegateWithMaxCrossAxisExtent` is the responsive grid — it automatically adds columns as screen width increases. On a phone (360px), `maxCrossAxisExtent: 180` gives 2 columns. On a tablet (760px), it gives 4. This is how you make a grid that works on all screen sizes without `LayoutBuilder`.

**→ Try this:** Replace a fixed `crossAxisCount: 2` grid with `maxCrossAxisExtent: 180` and run it on both a phone and a tablet emulator. Watch the columns auto-adjust.

---

## 3. CustomScrollView and Slivers — The Power API

> 📄 **Flutter Docs:**
> *"A ScrollView that creates custom scroll effects using slivers. A CustomScrollView lets you supply slivers directly to create various scrolling effects, such as lists, grids, and expanding headers."*

`CustomScrollView` is a container that takes a list of **slivers** — each sliver describes how a section of the scroll area behaves. Think of slivers as scroll-aware boxes that can change their height, stick, collapse, and overlap.

```
CustomScrollView
├── SliverAppBar          ← the collapsing hero header
├── SliverToBoxAdapter    ← wraps a normal (non-sliver) widget
│     └── StatsRow
├── SliverPadding
│     └── SliverList
│           └── item 0
│           └── item 1
│           └── item 2
└── SliverGrid
      └── photo 0
      └── photo 1
```

All of this scrolls as ONE continuous scroll. No nested scrollviews. One physics system.

### `SliverAppBar` — Collapsing Header

```dart
CustomScrollView(
  slivers: [
    SliverAppBar(
      // how tall the app bar gets when fully expanded
      expandedHeight: 300,

      // stays at the top even when you scroll past the expanded portion
      pinned: true,

      // the expanded portion shrinks as you scroll down
      floating: false,

      // the content inside the expanded area
      flexibleSpace: FlexibleSpaceBar(
        title: const Text('Discover'),
        // titlePadding controls where the title starts
        titlePadding: const EdgeInsets.only(left: 16, bottom: 16),
        // collapseMode: how the background behaves during collapse
        collapseMode: CollapseMode.parallax,  // ← parallax scroll effect
        background: Image.asset('assets/images/hero.jpg', fit: BoxFit.cover),
      ),

      // actions always visible in the AppBar
      actions: [
        IconButton(icon: const Icon(Icons.search), onPressed: () {}),
      ],
    ),

    // ... rest of slivers
  ],
)
```

🎨 **Designer:** The three modes:
- `pinned: true, floating: false` — AppBar shrinks when scrolling down, stays at top (Instagram, YouTube)
- `pinned: false, floating: true` — AppBar hides on scroll down, reappears on any scroll up (Google Maps, Twitter)
- `pinned: true, floating: true, snap: true` — AppBar snaps into view on scroll up (common in news apps)

`CollapseMode.parallax` — background image scrolls at half speed, creating depth. Best for photography apps.
`CollapseMode.pin` — background stays still while title slides. Cleaner for data-heavy apps.

### `SliverList` and `SliverGrid`

```dart
// SliverList with builder — same lazy behavior as ListView.builder
SliverList(
  delegate: SliverChildBuilderDelegate(
    (context, index) => ListTile(title: Text('Item ${index + 1}')),
    childCount: items.length,  // ← REQUIRED for SliverList to know when to stop
  ),
),

// SliverGrid
SliverGrid(
  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 3,
    mainAxisSpacing: 4,
    crossAxisSpacing: 4,
  ),
  delegate: SliverChildBuilderDelegate(
    (context, index) => PhotoTile(photo: photos[index]),
    childCount: photos.length,
  ),
),
```

### `SliverToBoxAdapter` — Mix Normal Widgets Into a Sliver Layout

```dart
CustomScrollView(
  slivers: [
    SliverAppBar(expandedHeight: 200, pinned: true, ...),

    // This is a normal widget (not a sliver) — wrap it
    SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SectionTitle('Popular This Week'),
            const SizedBox(height: 12),
            CategoryFilter(onChanged: _setFilter),
          ],
        ),
      ),
    ),

    // Now a sliver
    SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (_, i) => ArticleCard(article: articles[i]),
          childCount: articles.length,
        ),
      ),
    ),
  ],
)
```

**Rule:** Use `SliverToBoxAdapter` to insert any regular widget (a banner, stats row, section header) between sliver sections. Never use a `Column` inside a `CustomScrollView` — the whole point of slivers is to avoid that.

---

## 4. Sticky Headers with `SliverPersistentHeader`

> 📄 **Flutter Docs:**
> *"A sliver whose size varies when the sliver is scrolled to the leading edge of the viewport. This is the mechanism by which SliverAppBar is implemented."*

```dart
// First, define a delegate for the header
class _SectionHeaderDelegate extends SliverPersistentHeaderDelegate {
  final String title;
  _SectionHeaderDelegate(this.title);

  @override
  double get minExtent => 40;  // height when collapsed (pinned)
  @override
  double get maxExtent => 40;  // height when expanded (same for non-collapsing)

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Theme.of(context).colorScheme.surface,
      alignment: Alignment.centerLeft,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
          color: Theme.of(context).colorScheme.primary,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(_SectionHeaderDelegate old) => old.title != title;
}

// Use it in CustomScrollView
CustomScrollView(
  slivers: [
    SliverPersistentHeader(
      pinned: true,
      delegate: _SectionHeaderDelegate('RECENT'),
    ),
    SliverList(delegate: SliverChildBuilderDelegate(
      (_, i) => MessageTile(messages[i]),
      childCount: recentMessages.length,
    )),
    SliverPersistentHeader(
      pinned: true,
      delegate: _SectionHeaderDelegate('OLDER'),
    ),
    SliverList(delegate: SliverChildBuilderDelegate(
      (_, i) => MessageTile(olderMessages[i]),
      childCount: olderMessages.length,
    )),
  ],
)
```

🎨 **Designer:** Sticky section headers are a hallmark of polished apps — contacts list (A, B, C...), message inbox (Today, Yesterday, Last Week). The `pinned: true` makes the header stick to the top as its section scrolls. When the next section header reaches the top, it pushes the previous one up.

---

## 5. Scroll Controllers — Programmatic Scroll

```dart
class InboxScreen extends StatefulWidget { ... }

class _InboxScreenState extends State<InboxScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Listen for scroll position changes
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    // Show "scroll to top" FAB when scrolled past 300px
    final shouldShowFab = _scrollController.offset > 300;
    if (shouldShowFab != _showFab) {
      setState(() => _showFab = shouldShowFab);
    }
  }

  bool _showFab = false;

  void _scrollToTop() {
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();  // ALWAYS dispose scroll controllers
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView.builder(
        controller: _scrollController,
        itemCount: messages.length,
        itemBuilder: (_, i) => MessageTile(message: messages[i]),
      ),
      floatingActionButton: _showFab
          ? FloatingActionButton.small(
              onPressed: _scrollToTop,
              child: const Icon(Icons.keyboard_arrow_up),
            )
          : null,
    );
  }
}
```

**→ Try this:** Add a `ScrollController` to any `ListView.builder` and print `_scrollController.offset` in the listener. Scroll the list and watch the offset change in real time.

---

## 6. Infinite Scroll — Load More on Scroll

```dart
class FeedScreen extends StatefulWidget { ... }

class _FeedScreenState extends State<FeedScreen> {
  final ScrollController _scrollController = ScrollController();
  final List<Post> _posts = [];
  bool _isLoading = false;
  int _page = 1;

  @override
  void initState() {
    super.initState();
    _loadMore();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    // When within 200px of the bottom and not already loading
    final nearBottom = _scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200;
    if (nearBottom && !_isLoading) {
      _loadMore();
    }
  }

  Future<void> _loadMore() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);

    final newPosts = await PostService.fetchPage(_page);

    if (mounted) {
      setState(() {
        _posts.addAll(newPosts);
        _page++;
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: _scrollController,
      itemCount: _posts.length + (_isLoading ? 1 : 0),  // +1 for loading indicator
      itemBuilder: (context, index) {
        if (index == _posts.length) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        return PostCard(post: _posts[index]);
      },
    );
  }
}
```

🧪 **Tester:** Testing infinite scroll requires simulating a scroll all the way to the bottom:

```dart
testWidgets('loads more posts when reaching bottom', (tester) async {
  // Setup mock that returns page 1 initially
  when(mockPostService.fetchPage(1)).thenAnswer((_) async => page1Posts);
  when(mockPostService.fetchPage(2)).thenAnswer((_) async => page2Posts);

  await tester.pumpWidget(MaterialApp(home: FeedScreen()));
  await tester.pumpAndSettle();

  // Verify page 1 loaded
  expect(find.byType(PostCard), findsNWidgets(page1Posts.length));

  // Scroll to bottom
  await tester.drag(find.byType(ListView), const Offset(0, -5000));
  await tester.pumpAndSettle();

  // Verify page 2 loaded automatically
  expect(find.byType(PostCard), findsNWidgets(page1Posts.length + page2Posts.length));
});
```

---

## Scroll Widget Decision Chart

```
Content to scroll?
├── Simple list, items known, < 20 items
│     → ListView (children: [...])
│
├── Long list, items dynamic
│     → ListView.builder
│
├── List with dividers
│     → ListView.separated
│
├── Grid of cards
│     → GridView.builder with SliverGridDelegate
│
├── Need collapsing AppBar / parallax header
│     → CustomScrollView + SliverAppBar
│
├── Mix of header + list + grid in one scroll
│     → CustomScrollView + SliverToBoxAdapter + SliverList + SliverGrid
│
├── Sticky section headers
│     → CustomScrollView + SliverPersistentHeader (pinned: true)
│
└── Horizontal scroll (chips, tabs, category scroll)
      → SingleChildScrollView(scrollDirection: Axis.horizontal)
        or ListView(scrollDirection: Axis.horizontal)
```

---

## 11. Scroll Accessibility & Performance

> 🍎 **Academy Golden Rule — Infinite Content, Finite Patience:**
> *"A feed that takes 3 seconds to render the next page loses users. A list that VoiceOver can't navigate is inaccessible. Build scrolling that is fast AND inclusive."*

```dart
// Announce dynamic content to screen readers
ListView.builder(
  itemCount: items.length + (isLoadingMore ? 1 : 0),
  itemBuilder: (context, index) {
    if (index == items.length) {
      return Semantics(
        liveRegion: true,   // VoiceOver announces "Loading more items"
        child: const Center(child: CircularProgressIndicator()),
      );
    }
    return Semantics(
      label: 'Item ${index + 1} of ${items.length}. ${items[index].title}',
      child: ListTile(title: Text(items[index].title)),
    );
  },
)

// Scroll-to-top button for long lists (accessibility + UX)
FloatingActionButton.small(
  onPressed: () => _scrollController.animateTo(
    0,
    duration: const Duration(milliseconds: 500),
    curve: Curves.easeOut,
  ),
  tooltip: 'Scroll to top',   // announced by screen reader
  child: const Icon(Icons.arrow_upward),
)

// findChildIndexCallback for stable reorders
SliverList(
  delegate: SliverChildBuilderDelegate(
    (context, index) => NoteCard(key: ValueKey(notes[index].id), note: notes[index]),
    childCount: notes.length,
    findChildIndexCallback: (key) {
      final id = (key as ValueKey<String>).value;
      return notes.indexWhere((n) => n.id == id);
    },
  ),
)
```

---

## Lab — News Feed App

Build a news feed with the full sliver layout:

**Structure (all in one CustomScrollView):**
```
SliverAppBar (expandedHeight: 240, pinned, floating, parallax)
  └── background: hero image of "breaking news" or gradient
  └── title: "The Daily Feed"

SliverToBoxAdapter
  └── Horizontal category scroll: [All] [Tech] [Sports] [Business] [Entertainment]

SliverPersistentHeader (pinned: true)
  └── "FEATURED"

SliverGrid (2 columns, aspect 4:3)
  └── 4 featured article cards with thumbnail + title

SliverPersistentHeader (pinned: true)
  └── "LATEST"

SliverList
  └── ArticleTile: thumbnail (80x80) + title + source + time
      Infinite scroll: load next page when 200px from bottom
```

**Models:**
```dart
class Article {
  final String id, title, source, category;
  final DateTime publishedAt;
  final String thumbnailUrl;
  final bool isFeatured;
}
```

**State:** Filter by category (tap a chip → filters both Featured and Latest sections). Page state (current page, isLoading, articles list).

---

## Challenge — Instagram Profile Grid

Replicate the Instagram profile layout exactly using slivers:

```
SliverAppBar (pinned, expandedHeight: 160)
  └── FlexibleSpaceBar → profile info (avatar, name, bio, follow button)

SliverPersistentHeader (pinned)
  └── Tab row: [Grid icon] [Reels icon] [Tagged icon]
      → selected tab underlined

SliverGrid (3 columns, aspect 1:1, crossAxisSpacing: 2, mainAxisSpacing: 2)
  └── Photo tiles (square thumbnails)
      → tap opens photo in a new screen (push navigation)
```

Requirements:
- The tab row sticks to the top after scrolling past the profile header
- Photos load lazily
- Tapping a photo navigates to a `PhotoDetailScreen` that shows the full image, caption, like/comment counts
- Back from `PhotoDetailScreen` returns to the exact scroll position (IndexedStack is not needed here — the scroll position is preserved by the Navigator naturally)

---

## 8. `NestedScrollView` — Collapsing Header + TabBarView

> 📄 **Flutter Docs:**
> *"A scrolling view inside of which can be nested other scrolling views, with their scroll positions being intrinsically linked."*

The most common real-world pattern: a collapsing AppBar above a `TabBarView`. The two scroll views (the outer and each tab's list) must coordinate — the header collapses before the tab's list scrolls.

```dart
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with TickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          // innerBoxIsScrolled = true when the tab's inner list is scrolling
          // Use it to control pinned AppBar state
          return [
            SliverAppBar(
              expandedHeight: 200,
              pinned: true,
              floating: false,
              // forceElevated makes the AppBar look elevated when inner scrolling
              forceElevated: innerBoxIsScrolled,
              flexibleSpace: FlexibleSpaceBar(
                title: const Text('Harsha Alasai'),
                background: Image.asset('assets/profile_bg.jpg', fit: BoxFit.cover),
                collapseMode: CollapseMode.parallax,
              ),
            ),
            // Sticky TabBar — pinned below the collapsed AppBar
            SliverPersistentHeader(
              pinned: true,
              delegate: _StickyTabBarDelegate(
                tabBar: TabBar(
                  controller: _tabController,
                  tabs: const [
                    Tab(text: 'Posts'),
                    Tab(text: 'About'),
                    Tab(text: 'Media'),
                  ],
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: const [
            _PostsTab(),
            _AboutTab(),
            _MediaTab(),
          ],
        ),
      ),
    );
  }
}

// Each tab's scroll list must use PrimaryScrollController
// NestedScrollView hooks into the inner scroll automatically
class _PostsTab extends StatelessWidget {
  const _PostsTab();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      // CRITICAL: do NOT pass a custom ScrollController here
      // NestedScrollView provides the right one via PrimaryScrollController
      itemCount: 30,
      itemBuilder: (context, index) => ListTile(title: Text('Post $index')),
    );
  }
}

// SliverPersistentHeader delegate for sticky TabBar
class _StickyTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  const _StickyTabBarDelegate({required this.tabBar});

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Theme.of(context).colorScheme.surface,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_StickyTabBarDelegate old) => old.tabBar != tabBar;
}
```

🧑‍💻 **Developer:** The most common NestedScrollView mistake is passing a custom `ScrollController` to the inner lists. NestedScrollView injects its own controller via `PrimaryScrollController`. Any inner `ListView` or `GridView` with no explicit controller automatically uses it.

---

## 9. `ScrollNotification` — React to Scroll Without a Controller

```dart
// When you don't own the scroll widget (it's inside a library widget)
// but you still need to react to scroll — use NotificationListener

NotificationListener<ScrollNotification>(
  onNotification: (notification) {
    if (notification is ScrollStartNotification) {
      _onScrollStart();
    } else if (notification is ScrollUpdateNotification) {
      final pixels = notification.metrics.pixels;
      final maxScroll = notification.metrics.maxScrollExtent;
      if (pixels >= maxScroll - 200) {
        _loadMoreIfNeeded();
      }
    } else if (notification is ScrollEndNotification) {
      _onScrollEnd();
    }
    return false;  // return false to allow the notification to bubble up
  },
  child: ListView.builder(
    itemCount: items.length,
    itemBuilder: (context, index) => ItemTile(item: items[index]),
  ),
)

// ScrollNotification types:
// ScrollStartNotification  — user started scrolling
// ScrollUpdateNotification — user is actively scrolling (fires many times)
// ScrollEndNotification    — user stopped scrolling
// OverscrollNotification   — scrolled past the end (bounce effect)
// UserScrollNotification   — direction change detected
```

**Rule:** Use `ScrollController` when you own the scroll widget and need programmatic control (jump to position, infinite scroll). Use `NotificationListener<ScrollNotification>` when you only need to observe scroll events from the outside.

---

## 10. `Scrollbar` — Platform-Appropriate Scroll Indicator

```dart
// Flutter doesn't show a scrollbar by default on mobile
// Add Scrollbar for desktop/web — it auto-hides on mobile

Scrollbar(
  thumbVisibility: true,      // always visible (default: only on hover/drag)
  trackVisibility: true,      // show the full track
  thickness: 6,               // width of the scrollbar thumb
  radius: const Radius.circular(4),
  child: ListView.builder(
    itemCount: items.length,
    itemBuilder: (context, index) => ItemTile(item: items[index]),
  ),
)

// For web/desktop: CupertinoScrollbar (iOS-style)
// Use Theme to choose:
// MaterialApp → Scrollbar
// CupertinoApp → CupertinoScrollbar
```

---

## The Invisible Machinery — How Scrolling Works at the Protocol Level

When you scroll a `ListView`, the motion feels instant. Under the surface, two separate systems run on every pixel of movement — one translating your finger into a scroll delta, one translating that delta into a rendered list.

### Part 1: Finger to Scroll Delta (The Hardware Journey)

Your finger doesn't "touch" anything in a software sense. It changes the **electrical capacitance** of a 2D grid of transparent electrodes embedded in the touchscreen glass (Indium Tin Oxide — ITO).

```
Finger touches glass
    ↓ changes capacitance at specific electrode intersections
Touch controller chip (separate IC on the phone PCB, not the main CPU)
    ↓ scans all electrode cells ~120-240 times per second
    ↓ computes which cells changed → calculates (x, y) coordinate
    ↓ sends interrupt to main CPU via I2C or SPI bus
OS kernel touchscreen driver
    ↓ converts raw data to MotionEvent (Android) or UITouch (iOS)
    ↓ computes velocity (pixels per second) from recent events
Flutter engine receives PointerMoveEvent
    ↓ ScrollGestureRecognizer claims the gesture (not a tap, not a pinch)
    ↓ emits scroll delta: "moved 12px downward this frame"
ScrollPosition.applyUserOffset(-12.0) — scroll offset increases by 12
```

This chain runs for every millimeter your finger moves — potentially hundreds of events per second. The touch controller chip processes this at the hardware level, independently of your Flutter app.

### Part 2: Scroll Delta to Rendered Frame (The Sliver Protocol)

Once Flutter has the new `scrollOffset`, the **Sliver Protocol** runs. This is a two-message conversation between the `Viewport` and each sliver on every frame:

```
Viewport has: scrollOffset = 412px

Step 1 — Viewport sends SliverConstraints to SliverList:
  {
    scrollOffset: 412,           // how far we've scrolled
    remainingPaintExtent: 800,   // screen height remaining
    viewportMainAxisExtent: 800, // total screen height
    crossAxisExtent: 375,        // screen width
  }

Step 2 — SliverList computes which items are in the range [412, 1212]:
  → itemBuilder(context, 5)   // item at offset 360-432px — partially visible
  → itemBuilder(context, 6)   // item at offset 432-504px
  → ...
  → itemBuilder(context, 16)  // item at offset 1152-1224px — partially visible
  (items 0-4 and 17+ are NOT built — the protocol never asks for them)

Step 3 — SliverList returns SliverGeometry to Viewport:
  {
    scrollExtent: 50000,    // total height of all items (even unbuilt ones)
    paintExtent: 800,       // how much was actually painted this frame
    hasVisualOverflow: false,
  }

Viewport clips, offsets each item, produces a Layer Tree → GPU → display
```

**The key insight:** `ListView.builder` doesn't build 10,000 items and discard the invisible ones. The Sliver Protocol **never asks for off-screen items at all**. Items 0-4 don't exist as Dart objects. They have never been built. This is why `ListView.builder` uses the same ~12 widgets in memory whether your list has 20 items or 20,000,000.

### Why `itemExtent` Is a Superpower

Without `itemExtent`, the sliver must build each item just to measure its height before it knows where the next item starts. This means items near the top of a scrolled-far list get built purely for measurement, then discarded.

With `itemExtent: 72.0`, the sliver calculates any item's offset with pure arithmetic: `index × 72.0`. No items are built for measurement purposes. Jumping to item 500,000 = computing offset `500000 × 72.0 = 36,000,000px` instantly.

```dart
ListView.builder(
  itemCount: 1000000,
  itemExtent: 72.0,          // tells sliver: every item is exactly 72px tall
  itemBuilder: (ctx, i) => ItemTile(items[i]),
)
// Scroll to the very end: arithmetic, no builds, O(1)
// Without itemExtent: the sliver must have built every preceding item at least once
```

### What Momentum (Fling) Scrolling Is

When you lift your finger, Flutter measures finger velocity (pixels/second) and hands it to a `ScrollPhysics` simulator. These are mathematical models of physical systems implemented entirely in Dart:

```
BouncingScrollPhysics (iOS-style):
  drag coefficient: 0.135
  elastic boundary: allows ~60px overshoot, spring force pulls back
  
ClampingScrollPhysics (Android-style):
  deceleration: ~0.025 pixels/millisecond²
  hard stop at boundaries (no overshoot)
```

`SchedulerBinding` calls `simulateScrollDecay()` every VSYNC frame with a decreasing velocity. Each result becomes the new `scrollOffset`. The Sliver Protocol runs again with the new offset. The display shows each frame. The physics math runs entirely in Dart — the display hardware never touches it.

**What this means for your code:**

```dart
// O(n) memory — all widgets created before first frame — AVOID for dynamic lists
ListView(children: items.map((i) => ItemTile(i)).toList())

// O(1) memory — sliver protocol never asks for off-screen items
ListView.builder(itemCount: items.length, itemBuilder: (ctx, i) => ItemTile(items[i]))

// O(1) memory + O(1) scroll-position computation — fastest possible
ListView.builder(
  itemCount: items.length,
  itemExtent: 72.0,   // ← arithmetic replaces measurement builds
  itemBuilder: (ctx, i) => ItemTile(items[i]),
)
```

---

## Week 7 Verify

1. What is the key difference between `ListView` and `ListView.builder`? When should you never use `ListView(children: [])`?
2. `SliverAppBar` has three boolean flags: `pinned`, `floating`, `snap`. What does each do? What combination gives you the "hide on scroll down, reappear on scroll up" behavior?
3. You have a `CustomScrollView` and want to put a `Text` widget, a `Divider`, and a `Row` in it. Which sliver wraps them?
4. What is `SliverPersistentHeader` used for? How is it different from a regular sticky header in a `ListView`?
5. In infinite scroll, why do you check `_scrollController.position.pixels >= maxScrollExtent - 200` instead of `== maxScrollExtent`?
6. You add a `GridView` inside a `Column` inside a `ListView`. What error do you get? How do you fix it using slivers?
7. A tester runs `find.text('Item 99')` on a `ListView.builder` with 200 items. It finds nothing. Why? How do you fix the test?
8. A loading spinner appears at the bottom of your list during pagination. How do you make VoiceOver announce "Loading more items" when it appears?
9. `findChildIndexCallback` in `SliverChildBuilderDelegate` — what problem does it solve? What happens without it when items are reordered?

---

**Next → [Week 8: Forms & Input](Week_08_Forms_and_Input.md)**
