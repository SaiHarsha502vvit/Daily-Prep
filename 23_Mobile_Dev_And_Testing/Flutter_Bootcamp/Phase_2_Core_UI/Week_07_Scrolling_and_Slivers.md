# Week 7 — Scrolling & Slivers
### How Flutter builds scrollable UIs that feel native

---

## 1. The Scrolling Problem

Your app has more content than fits on screen. You have two tools:

- `SingleChildScrollView` — scrolls ONE child (usually a Column). Good for forms and short content.
- `ListView` / `GridView` — scrolls a LIST of items. Lazy — only builds what's visible.

**Never put a `ListView` inside a `SingleChildScrollView`.** Both try to be scrollable in the same direction — they fight each other and you get an unbounded constraint error.

---

## 2. ListView — Four Ways to Use It

```dart
// 1. ListView — all children built at once. Fine for < ~20 items.
ListView(
  padding: const EdgeInsets.all(16),
  children: [
    const Text('Item 1'),
    const Divider(),
    const Text('Item 2'),
  ],
)

// 2. ListView.builder — lazy, only builds visible items. Use for any dynamic list.
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return ListTile(
      leading: CircleAvatar(child: Text('${index + 1}')),
      title: Text(items[index].name),
      subtitle: Text(items[index].subtitle),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14),
      onTap: () => Navigator.push(context,
        MaterialPageRoute(builder: (_) => DetailScreen(item: items[index]))),
    );
  },
)

// 3. ListView.separated — builder + a separator between items
ListView.separated(
  itemCount: items.length,
  separatorBuilder: (context, index) => const Divider(height: 1),
  itemBuilder: (context, index) => ItemCard(item: items[index]),
)

// 4. ListView.custom — maximum control, rarely needed
ListView.custom(
  childrenDelegate: SliverChildBuilderDelegate(
    (context, index) => ItemCard(item: items[index]),
    childCount: items.length,
  ),
)
```

**→ Try this:** Build a contact list with 20 fake contacts (use a loop to generate them). Use `ListView.separated` with a `Divider`. Each contact has a `CircleAvatar` with their initial, name, and phone number.

---

## 3. GridView

```dart
// Fixed columns
GridView.count(
  crossAxisCount: 3,
  crossAxisSpacing: 8,
  mainAxisSpacing: 8,
  padding: const EdgeInsets.all(16),
  children: products.map((p) => ProductCard(product: p)).toList(),
)

// Adaptive columns (fills space based on item width)
GridView.builder(
  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
    maxCrossAxisExtent: 200,   // each item max 200px wide
    crossAxisSpacing: 12,
    mainAxisSpacing: 12,
    childAspectRatio: 0.75,    // height = width / 0.75
  ),
  itemCount: products.length,
  itemBuilder: (context, index) => ProductCard(product: products[index]),
)

// Fixed 2 columns (most common pattern)
GridView.builder(
  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    crossAxisSpacing: 12,
    mainAxisSpacing: 12,
    childAspectRatio: 0.8,
  ),
  itemCount: items.length,
  itemBuilder: (context, index) => ItemCard(item: items[index]),
)
```

**→ Try this:** Build a photo gallery: 2-column grid of 12 colored containers (use `Colors.primaries` list). Each has a random height between 100-200 (hint: use `Random().nextInt(100) + 100`). Tapping a tile opens a full-screen view of that color.

---

## 4. Pull to Refresh

```dart
RefreshIndicator(
  onRefresh: () async {
    // This future controls how long the spinner shows
    await _loadData();  // make your actual data call here
  },
  child: ListView.builder(
    itemCount: items.length,
    itemBuilder: (context, index) => ItemTile(item: items[index]),
  ),
)
```

**Note:** `RefreshIndicator` only works with a scrollable that can be dragged. The list must be long enough to scroll — if all items fit on screen, the user can't pull down to trigger refresh.

---

## 5. Infinite Scroll (Load More on Scroll)

```dart
class _InfiniteListState extends State<InfiniteList> {
  final List<String> _items = [];
  bool _isLoading = false;
  bool _hasMore = true;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadMore();  // load first batch

    _scrollController.addListener(() {
      // When user is 200px from the bottom, load more
      final position = _scrollController.position;
      if (position.pixels >= position.maxScrollExtent - 200) {
        _loadMore();
      }
    });
  }

  Future<void> _loadMore() async {
    if (_isLoading || !_hasMore) return;
    setState(() => _isLoading = true);

    // Simulate a paginated API call
    await Future.delayed(const Duration(seconds: 1));
    final newItems = List.generate(20, (i) => 'Item ${_items.length + i + 1}');

    setState(() {
      _items.addAll(newItems);
      _isLoading = false;
      _hasMore = _items.length < 100;  // stop after 100 total items
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();  // always dispose controllers
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: _scrollController,
      itemCount: _items.length + (_hasMore ? 1 : 0),  // +1 for loader at bottom
      itemBuilder: (context, index) {
        if (index == _items.length) {
          // Last item — show loading spinner
          return const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        return ListTile(title: Text(_items[index]));
      },
    );
  }
}
```

**→ Try this:** Build an infinite news feed. Each "article" is a Card with a title, source, and 2-line preview. Load 10 articles at a time. Show a spinner at the bottom while loading. Stop at 60 articles total.

---

## 6. Slivers — When You Need Full Control

A **Sliver** is a portion of a scrollable area. They're what `ListView` and `GridView` are built on internally. You use them directly when you need effects that normal widgets can't do — like a collapsing header.

All Slivers live inside a `CustomScrollView`:

```dart
CustomScrollView(
  slivers: [
    // Collapsing App Bar
    SliverAppBar(
      expandedHeight: 250,            // height when fully expanded
      pinned: true,                   // stays visible when collapsed
      floating: false,
      flexibleSpace: FlexibleSpaceBar(
        title: const Text('Profile'),
        background: Image.network(
          'https://picsum.photos/400/250',
          fit: BoxFit.cover,
        ),
      ),
    ),

    // A section header (non-scrolling within the sliver)
    SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text('Recent Posts',
          style: Theme.of(context).textTheme.titleLarge),
      ),
    ),

    // A sliver list — like ListView.builder but inside CustomScrollView
    SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) => PostCard(index: index),
        childCount: 20,
      ),
    ),

    // A sliver grid
    SliverGrid(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      delegate: SliverChildBuilderDelegate(
        (context, index) => Container(color: Colors.primaries[index % 18]),
        childCount: 30,
      ),
    ),
  ],
)
```

**When to use Slivers vs regular ListView:**
- Regular `ListView`: 90% of cases. Simple list of items.
- `CustomScrollView` + Slivers: when you need a collapsing header, mix of list and grid in one scroll, or sticky section headers.

---

## 7. Sticky Section Headers

```dart
// Use SliverPersistentHeader for a header that sticks
class _StickyHeaderDelegate extends SliverPersistentHeaderDelegate {
  final String title;
  _StickyHeaderDelegate(this.title);

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Theme.of(context).colorScheme.surface,
      alignment: Alignment.centerLeft,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(title, style: Theme.of(context).textTheme.titleMedium),
    );
  }

  @override double get maxExtent => 48;
  @override double get minExtent => 48;
  @override bool shouldRebuild(_StickyHeaderDelegate old) => old.title != title;
}

// In CustomScrollView:
SliverPersistentHeader(
  pinned: true,
  delegate: _StickyHeaderDelegate('Section A'),
),
SliverList(delegate: SliverChildBuilderDelegate(/* items in section A */)),
SliverPersistentHeader(
  pinned: true,
  delegate: _StickyHeaderDelegate('Section B'),
),
SliverList(delegate: SliverChildBuilderDelegate(/* items in section B */)),
```

**→ Try this:** Build a contacts app with alphabetical section headers (A, B, C...). Each section header sticks as you scroll. Contacts are sorted alphabetically. Use `SliverPersistentHeader` for the sticky letters and `SliverList` for the contacts under each letter.

---

## 8. PageView — Horizontal Swipeable Pages

```dart
class _OnboardingState extends State<OnboardingScreen> {
  final _pageController = PageController();
  int _currentPage = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: PageView(
              controller: _pageController,
              onPageChanged: (index) => setState(() => _currentPage = index),
              children: const [
                OnboardingPage(title: 'Welcome', icon: Icons.waving_hand),
                OnboardingPage(title: 'Discover', icon: Icons.explore),
                OnboardingPage(title: 'Get Started', icon: Icons.rocket_launch),
              ],
            ),
          ),
          // Dot indicators
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(3, (index) =>
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.all(4),
                width: _currentPage == index ? 24 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: _currentPage == index
                    ? Theme.of(context).colorScheme.primary
                    : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: _currentPage < 2
              ? () => _pageController.nextPage(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut)
              : () => Navigator.pushReplacement(context,
                  MaterialPageRoute(builder: (_) => const HomeScreen())),
            child: Text(_currentPage < 2 ? 'Next' : 'Get Started'),
          ),
          const SizedBox(height: 48),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}
```

---

## Lab — Build a Social Feed App

One screen. Everything in one scrollable `CustomScrollView`.

**Structure from top to bottom:**
1. `SliverAppBar` — shows "Feed" when collapsed, shows a large header image + "Good Morning, Harsha" when expanded. Pinned.
2. `SliverToBoxAdapter` — a horizontal `PageView` of 3 "story" circles (like Instagram stories). Fixed height of 100px.
3. `SliverToBoxAdapter` — section title "For You"
4. `SliverList` — 10 post cards. Each card: author avatar + name, post image, like/comment/share row, like count.
5. `SliverToBoxAdapter` — section title "Trending"
6. `SliverGrid` (2 columns) — 6 trending image cards.

**Interactions:**
- Pull to refresh reloads the feed (new random order)
- Like button on each post toggles liked state (red heart vs outline)
- Bottom of the list loads 5 more posts (infinite scroll)

---

## Challenge

Add **swipe to dismiss** on the feed posts. Swiping left reveals a "Save" action (bookmark icon). Swiping right reveals a "Hide" action. Hiding removes the post from the list with an animated removal (`AnimatedList`).

Use `Dismissible` widget:
```dart
Dismissible(
  key: ValueKey(post.id),
  background: Container(color: Colors.blue, /* Save icon left */),
  secondaryBackground: Container(color: Colors.red, /* Hide icon right */),
  onDismissed: (direction) {
    if (direction == DismissDirection.startToEnd) { /* save */ }
    else { /* hide */ }
  },
  child: PostCard(post: post),
)
```

---

## Before Week 8 — Verify

1. Why use `ListView.builder` over `ListView` for long lists?
2. What happens if you put a `ListView` inside a `Column` without `Expanded`?
3. What is a Sliver? When do you need `CustomScrollView` instead of `ListView`?
4. How does `RefreshIndicator` know when to show the spinner?
5. In infinite scroll, why do you check `if (_isLoading) return` at the start of `_loadMore()`?

---

**Next → [Week 8: Forms & Input](Week_08_Forms_and_Input.md)**
