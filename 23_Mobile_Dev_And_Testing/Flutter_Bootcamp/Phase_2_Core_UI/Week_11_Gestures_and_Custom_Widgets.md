# Week 11 — Gestures & Custom Widgets
### Detect any touch interaction + build reusable, composable components

---

## 1. GestureDetector — Every Touch Interaction

`GestureDetector` is a widget that wraps any child and detects touch gestures. It's invisible — no visual change, just event detection.

```dart
GestureDetector(
  onTap: () => print('single tap'),
  onDoubleTap: () => print('double tap'),
  onLongPress: () => print('long press (500ms hold)'),
  onLongPressStart: (details) => print('long press started at ${details.localPosition}'),
  onLongPressEnd: (_) => print('long press ended'),

  // Drag / pan
  onPanStart: (details) => print('drag started'),
  onPanUpdate: (details) {
    // details.delta = how much finger moved since last update
    print('dragging: dx=${details.delta.dx}, dy=${details.delta.dy}');
  },
  onPanEnd: (_) => print('drag ended'),

  // Scale (pinch to zoom)
  onScaleStart: (_) => print('pinch started'),
  onScaleUpdate: (details) {
    print('scale: ${details.scale}');  // 1.0 = no zoom, 2.0 = 2x zoom
  },

  child: Container(width: 100, height: 100, color: Colors.blue),
)
```

**Note:** `onPanUpdate` and `onScaleUpdate` cannot be used together on the same `GestureDetector`. Use `onScaleUpdate` if you need both drag and pinch — `details.scale` will be 1.0 when not pinching, and `details.focalPointDelta` gives the drag amount.

---

## 2. Draggable Item — Move Things Around

```dart
class _DragBoardState extends State<DragBoard> {
  Offset _position = const Offset(100, 100);

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          left: _position.dx,
          top: _position.dy,
          child: GestureDetector(
            onPanUpdate: (details) {
              setState(() {
                _position = Offset(
                  _position.dx + details.delta.dx,
                  _position.dy + details.delta.dy,
                );
              });
            },
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.deepPurple,
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
              ),
              child: const Icon(Icons.drag_indicator, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}
```

**→ Try this:** Build a canvas where you can drag a colored circle anywhere on screen. Add a "snap to center" button that animates the circle back to the center using `AnimatedPositioned`.

---

## 3. Draggable + DragTarget — Drag and Drop

Flutter has a dedicated drag-and-drop system:

```dart
// The thing you drag
Draggable<String>(
  data: 'item-123',         // data passed to DragTarget on drop
  feedback: Material(       // widget shown while dragging (follows finger)
    elevation: 8,
    borderRadius: BorderRadius.circular(8),
    child: Container(
      width: 80, height: 80,
      color: Colors.deepPurple.withOpacity(0.8),
      child: const Icon(Icons.star, color: Colors.white),
    ),
  ),
  childWhenDragging: Opacity(  // what the original spot looks like while dragging
    opacity: 0.3,
    child: Container(width: 80, height: 80, color: Colors.grey),
  ),
  child: Container(           // the original widget
    width: 80, height: 80,
    color: Colors.deepPurple,
    child: const Icon(Icons.star, color: Colors.white),
  ),
)

// The place you drop onto
DragTarget<String>(
  onWillAcceptWithDetails: (details) {
    return details.data.startsWith('item'); // decide if you accept this drop
  },
  onAcceptWithDetails: (details) {
    print('Dropped: ${details.data}');
    setState(() => _droppedItem = details.data);
  },
  builder: (context, candidateData, rejectedData) {
    final isHovering = candidateData.isNotEmpty;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        color: isHovering ? Colors.green.shade100 : Colors.grey.shade200,
        border: Border.all(
          color: isHovering ? Colors.green : Colors.grey,
          width: 2,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Text(isHovering ? 'Drop here!' : 'Drop zone'),
      ),
    );
  },
)
```

**→ Try this:** Build a Kanban board with 3 columns: "Todo", "In Progress", "Done". Each task is a `Draggable` card. Dropping a card onto a column moves it there. Each column is a `DragTarget`. Show a visual highlight on the target column while dragging over it.

---

## 4. Swipe-to-Dismiss

Already touched in Week 07, but here's the full pattern including preventing accidental dismissals:

```dart
Dismissible(
  key: ValueKey(item.id),
  direction: DismissDirection.horizontal,  // or endToStart / startToEnd

  // Background shown when swiping right-to-left (delete)
  background: Container(
    color: Colors.red,
    alignment: Alignment.centerRight,
    padding: const EdgeInsets.only(right: 20),
    child: const Icon(Icons.delete, color: Colors.white),
  ),

  // Confirm before dismissing
  confirmDismiss: (direction) async {
    return await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );
  },

  onDismissed: (direction) {
    setState(() => _items.removeWhere((i) => i.id == item.id));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${item.name} deleted'),
        action: SnackBarAction(label: 'Undo', onPressed: () {
          setState(() => _items.insert(0, item));
        }),
      ),
    );
  },

  child: ItemCard(item: item),
)
```

---

## 5. InkWell vs GestureDetector

Both detect taps, but they're different:

```dart
// GestureDetector — no visual feedback, no ripple
GestureDetector(
  onTap: () {},
  child: Container(/* ... */),
)

// InkWell — shows Material ripple animation on tap
InkWell(
  onTap: () {},
  borderRadius: BorderRadius.circular(12),  // ripple clips to this shape
  splashColor: Colors.deepPurple.withOpacity(0.2),
  highlightColor: Colors.deepPurple.withOpacity(0.1),
  child: Container(/* ... */),
)

// For InkWell ripple to show, it needs a Material ancestor
// (Scaffold, Card, Material widget all count)
```

**Rule:** Use `InkWell` when the tappable area is a visible surface (cards, list tiles, buttons). Use `GestureDetector` when there's no visual element that should show a ripple (invisible touch areas, complex gesture detection).

---

## 6. Custom Widgets — Composition Patterns

This is one of the most important professional skills: breaking UI into well-designed, reusable components.

**Bad pattern — monolithic widget:**
```dart
// One 300-line build() method. Impossible to reuse or test.
class ProfileScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(children: [
        // 50 lines of header code
        // 80 lines of stats code
        // 100 lines of post grid code
        // 70 lines of footer code
      ]),
    );
  }
}
```

**Good pattern — composed from focused widgets:**
```dart
class ProfileScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          ProfileHeader(user: user),        // focused, reusable
          StatsRow(user: user),             // focused, reusable
          const SliverToBoxAdapter(child: SectionDivider()),
          PostGrid(userId: user.id),        // focused, reusable
        ],
      ),
    );
  }
}
```

**Rules for good custom widgets:**
1. Each widget does ONE thing
2. Data comes in through the constructor — no hardcoding inside
3. If it needs to call back to parent, accept a `VoidCallback` or `Function(T)` parameter
4. Use `const` constructors when the widget has no mutable state

---

## 7. The Widget Composition Pattern

```dart
// A reusable stat card — takes data, looks the same everywhere
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(label,
              style: TextStyle(color: color.withOpacity(0.7), fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

// Usage — identical data, identical look, zero code duplication
Row(
  children: [
    Expanded(child: StatCard(label: 'Projects', value: '12', icon: Icons.folder, color: Colors.blue)),
    const SizedBox(width: 12),
    Expanded(child: StatCard(label: 'Stars', value: '48', icon: Icons.star, color: Colors.amber)),
    const SizedBox(width: 12),
    Expanded(child: StatCard(label: 'Followers', value: '1.2K', icon: Icons.people, color: Colors.green)),
  ],
)
```

---

## 8. Builder Widgets — When You Need a New Context

Sometimes you need to pass a function that builds a widget only when needed:

```dart
// Your own builder pattern
class AnimatedReveal extends StatefulWidget {
  final Widget Function(BuildContext context, bool isVisible) builder;
  final Duration delay;

  const AnimatedReveal({
    super.key,
    required this.builder,
    this.delay = Duration.zero,
  });

  @override
  State<AnimatedReveal> createState() => _AnimatedRevealState();
}

class _AnimatedRevealState extends State<AnimatedReveal> {
  bool _isVisible = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () {
      if (mounted) setState(() => _isVisible = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: _isVisible ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 400),
      child: widget.builder(context, _isVisible),
    );
  }
}

// Usage
AnimatedReveal(
  delay: const Duration(milliseconds: 300),
  builder: (context, isVisible) => StatCard(/* ... */),
)
```

---

## Lab — Build a Reusable Component Library

Create a file `lib/widgets/app_widgets.dart` with these reusable components. Then use them across 3 different screens.

**Components to build:**

**1. `AppTextField`** — wraps `TextFormField` with your app's consistent style. Parameters: `label`, `hint`, `controller`, `validator`, `prefix icon`, `keyboard type`, `is password` (toggles obscure text).

**2. `AppButton`** — wraps `ElevatedButton` with 3 variants: `AppButton.primary`, `AppButton.secondary`, `AppButton.danger`. Parameters: `label`, `onPressed`, `isLoading` (shows spinner instead of label).

**3. `AppCard`** — a styled card with consistent radius, shadow, padding. Parameters: `child`, `onTap`, `color`, `padding`.

**4. `EmptyState`** — shows when a list is empty. Parameters: `icon`, `title`, `message`, `actionLabel`, `onAction`.

**5. `AvatarWidget`** — circular avatar that: shows the image if `imageUrl` is provided, falls back to initials if no image. Parameters: `imageUrl`, `name`, `size`, `color`.

**6. `TagChip`** — a colored chip/badge. Parameters: `label`, `color`, `onTap` (optional — shows as tappable if provided).

Test each component with multiple parameter combinations on a "Component Library" screen — like a design system reference page.

---

## Challenge

**Build a swipeable card stack** — like Tinder cards.

- Show a stack of 5 cards (use `Stack` with `Positioned`)
- User can swipe the top card left (reject) or right (accept)
- During the swipe, the card rotates slightly (use `Transform.rotate`)
- The card under it scales up slightly as the top card is dragged away
- After a swipe, the next card becomes the top
- Show a "like" (green) or "dislike" (red) overlay on the card based on swipe direction
- When all cards are swiped, show "You've seen everyone!" with a reset button

Use `GestureDetector` with `onPanUpdate` for dragging and `onPanEnd` to decide if the swipe was strong enough to dismiss.

---

## Before Week 12 (Phase 3) — Verify

1. What is the difference between `GestureDetector` and `InkWell`?
2. Why can't you use `onPanUpdate` and `onScaleUpdate` on the same `GestureDetector`?
3. In drag-and-drop, what does `onWillAcceptWithDetails` return, and what does returning `false` do?
4. When you split a 300-line widget into smaller widgets — what are the benefits?
5. What is a "builder widget" — when is passing a `Widget Function(BuildContext)` better than passing a `Widget`?

---

**Phase 2 Complete. Next → [Phase 3, Week 12: State Management Deep Dive](../Phase_3_State_and_APIs/Week_11_State_Management_Deep_Dive.md)**
