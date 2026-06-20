# Week 11 — Gestures & Custom Widgets
### Detect any touch interaction and build truly reusable components

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — gesture system internals, custom painting, widget composition patterns
> - 🎨 **Designer** — touch targets, gesture conventions, when to use which gesture
> - 🧪 **Tester** — simulating gestures in tests, verifying gesture callbacks

---

## Flutter's Gesture System

> 📄 **Flutter Docs:**
> *"Flutter's gesture system distinguishes between two layers: pointers (which describe the location and movement of touches, mice, and styluses on the screen) and gestures (which describe semantic actions, such as tap, drag, and scale)."*

Touch goes through Flutter's gesture arena:
1. Raw pointer events hit the tree from top to bottom
2. Multiple widgets may want the same gesture (e.g., scroll AND tap)
3. The gesture arena resolves which widget "wins"
4. The winning widget gets its callback called

This is why you can scroll a `ListView` by dragging even when each `ListTile` has an `onTap` — the scroll gesture wins over the tap gesture during drag.

---

## 1. `GestureDetector` — Every Touch Interaction

> 📄 **Flutter Docs:**
> *"A widget that detects gestures. Attempts to recognize gestures that correspond to its non-null callbacks. If this widget has a child, it defers to that child for its sizing behavior. If it does not have a child, it grows to fit the parent instead."*

```dart
GestureDetector(
  // TAPS
  onTap: () => print('tapped'),
  onDoubleTap: () => print('double tapped'),
  onLongPress: () => print('long pressed'),

  // TAP WITH POSITION (for context menus, drag handles)
  onTapDown: (TapDownDetails details) {
    // details.globalPosition — position on screen
    // details.localPosition — position within the widget
    print('tap started at ${details.localPosition}');
  },
  onTapUp: (TapUpDetails details) => print('tap released'),
  onTapCancel: () => print('tap cancelled (turned into drag)'),

  // DRAGS
  onPanStart: (DragStartDetails details) => print('drag started'),
  onPanUpdate: (DragUpdateDetails details) {
    // details.delta — how much the pointer moved since last update
    print('moved by ${details.delta}');
  },
  onPanEnd: (DragEndDetails details) {
    // details.velocity — how fast the finger was moving when lifted
    print('drag velocity: ${details.velocity}');
  },

  // SCALE (pinch to zoom) — also handles single-finger drag
  onScaleUpdate: (ScaleUpdateDetails details) {
    // details.scale — 1.0 = no change, < 1.0 = pinch in, > 1.0 = pinch out
    // details.rotation — rotation in radians
    print('scale: ${details.scale}, rotation: ${details.rotation}');
  },

  child: Container(
    width: 100, height: 100,
    color: Colors.blue,
    child: const Icon(Icons.touch_app, color: Colors.white),
  ),
)
```

🎨 **Designer:** Touch target minimum size is 48×48dp (Material guideline). For small icons that are less than 48dp, use `IconButton` — it automatically applies a 48dp hit area. Never put a tappable element smaller than 44×44dp (Apple HIG) or 48×48dp (Material). Tiny touch targets cause user frustration.

```dart
// ❌ Hit area is exactly the size of the icon — too small for most fingers
GestureDetector(
  onTap: () {},
  child: const Icon(Icons.close, size: 18),
)

// ✓ IconButton gives 48×48 minimum hit area even though icon is 18dp
IconButton(
  icon: const Icon(Icons.close, size: 18),
  onPressed: () {},
)

// ✓ Or set minimum size explicitly
SizedBox(
  width: 48, height: 48,
  child: GestureDetector(
    onTap: () {},
    child: const Icon(Icons.close, size: 18),
  ),
)
```

🧪 **Tester:** Simulate gestures with specific positions:

```dart
testWidgets('drag updates position', (tester) async {
  await tester.pumpWidget(MaterialApp(home: DraggableCard()));

  // Find the draggable widget
  final card = find.byType(DraggableCard);

  // Simulate a drag — start at center, drag 100px down
  await tester.drag(card, const Offset(0, 100));
  await tester.pump();

  // Verify position changed
  expect(find.text('moved'), findsOneWidget);
});

// For more control: use gesture() directly
await tester.gesture().then((gesture) {
  gesture.down(tester.getCenter(card));  // finger down
  gesture.moveBy(const Offset(0, 50));   // move
  gesture.up();                           // lift
});
```

---

## 2. `InkWell` vs `GestureDetector`

```dart
// GestureDetector — no visual feedback
// Use when you're building a completely custom widget
GestureDetector(
  onTap: _handleTap,
  child: CustomWidget(),
)

// InkWell — shows ripple on tap (Material Design)
// Use on Material surfaces (Cards, ListTiles, etc.)
InkWell(
  onTap: _handleTap,
  borderRadius: BorderRadius.circular(12),    // ripple follows card rounding
  splashColor: Theme.of(context).colorScheme.primary.withOpacity(0.12),
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: Text('Tap me'),
  ),
)

// InkResponse — customizes the ripple shape
// Use for icons and circular elements
InkResponse(
  onTap: _handleTap,
  containedInkWell: false,   // ripple spreads beyond the widget
  highlightShape: BoxShape.circle,
  child: const Icon(Icons.favorite),
)
```

**Rule:** On a `Material`-themed surface (inside a `Card`, `Scaffold`, `Dialog`), use `InkWell` — the ripple effect confirms the tap visually. On custom painted surfaces or images, use `GestureDetector` — the ripple doesn't look right over custom backgrounds.

---

## 3. Drag Interactions — Practical Patterns

### Draggable + DragTarget — Drag and Drop

```dart
// The thing being dragged
Draggable<String>(
  data: 'task-id-42',       // data passed to the drop target
  feedback: Material(        // what shows while dragging (follows finger)
    elevation: 8,
    child: TaskCard(task: myTask, width: 200),
  ),
  childWhenDragging: Opacity( // what shows in original position while dragging
    opacity: 0.3,
    child: TaskCard(task: myTask),
  ),
  child: TaskCard(task: myTask),
)

// The drop zone
DragTarget<String>(
  onWillAcceptWithDetails: (details) {
    // Return true if this target accepts this drag
    return details.data.startsWith('task-id');
  },
  onAcceptWithDetails: (details) {
    // Called when drag is dropped here
    final taskId = details.data;
    _moveTask(taskId, newColumn: 'done');
  },
  builder: (context, candidateData, rejectedData) {
    final isDragOver = candidateData.isNotEmpty;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        border: Border.all(
          color: isDragOver
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).colorScheme.outline.withOpacity(0.3),
          width: isDragOver ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(12),
        color: isDragOver
            ? Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3)
            : null,
      ),
      child: Column(children: [...]),
    );
  },
)
```

### Freeform Drag (Pan) — Draggable Widget on Canvas

```dart
class DraggableNote extends StatefulWidget {
  final String text;
  const DraggableNote({super.key, required this.text});

  @override
  State<DraggableNote> createState() => _DraggableNoteState();
}

class _DraggableNoteState extends State<DraggableNote> {
  Offset _position = const Offset(100, 100);

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: _position.dx,
      top: _position.dy,
      child: GestureDetector(
        onPanUpdate: (details) {
          setState(() => _position += details.delta);
        },
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.yellow[200],
            borderRadius: BorderRadius.circular(8),
            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
          ),
          child: Text(widget.text),
        ),
      ),
    );
  }
}

// Parent must be Stack for Positioned to work
Stack(
  children: [
    DraggableNote(text: 'Move me!'),
    DraggableNote(text: 'Me too!'),
  ],
)
```

---

## 4. Custom Widgets — Composition Patterns

> 📄 **Flutter Docs:**
> *"Widgets form the basis of the Flutter framework. A custom widget is simply a class that extends StatelessWidget or StatefulWidget and overrides the build method. The build method returns a widget tree that describes how this widget should render."*

The first design question when building a custom widget:

```
Does it need its own state?
├── NO → StatelessWidget
│     (receives all data via constructor, never changes internally)
│
└── YES → StatefulWidget
      Does the state depend on external data from parent?
      ├── YES — use didUpdateWidget to sync when parent props change
      └── NO — state is purely internal (expanded/collapsed, hover)
```

### Pattern 1: Pure Composition — Extracting Widget Parts

```dart
// ❌ Everything in one massive build method — impossible to read and maintain
@override
Widget build(BuildContext context) {
  return Scaffold(
    body: Column(
      children: [
        Row(
          children: [
            CircleAvatar(radius: 30, backgroundImage: NetworkImage(user.avatar)),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user.name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                Text('@${user.username}', style: TextStyle(color: Colors.grey)),
              ],
            ),
          ],
        ),
        // ... 200 more lines
      ],
    ),
  );
}

// ✓ Extracted into small, named, reusable widgets
class UserProfileHeader extends StatelessWidget {
  final User user;
  const UserProfileHeader({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _Avatar(url: user.avatar),
        const SizedBox(width: 12),
        _UserNameBlock(name: user.name, username: user.username),
      ],
    );
  }
}

class _Avatar extends StatelessWidget {
  final String url;
  const _Avatar({required this.url});

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(radius: 30, backgroundImage: NetworkImage(url));
  }
}

class _UserNameBlock extends StatelessWidget {
  final String name, username;
  const _UserNameBlock({required this.name, required this.username});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        Text('@$username', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
      ],
    );
  }
}
```

### Pattern 2: Widget with Callback — Event Propagation

```dart
// Good pattern: widget fires events up via callbacks
// Parent decides what to do with the event
class QuantitySelector extends StatelessWidget {
  final int quantity;
  final int min;
  final int max;
  final void Function(int) onChanged;   // callback — parent handles it

  const QuantitySelector({
    super.key,
    required this.quantity,
    required this.onChanged,
    this.min = 1,
    this.max = 99,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: const Icon(Icons.remove),
          onPressed: quantity > min ? () => onChanged(quantity - 1) : null,
        ),
        Text('$quantity', style: Theme.of(context).textTheme.titleMedium),
        IconButton(
          icon: const Icon(Icons.add),
          onPressed: quantity < max ? () => onChanged(quantity + 1) : null,
        ),
      ],
    );
  }
}

// Usage — parent controls the state
class CartItem extends StatefulWidget { ... }

class _CartItemState extends State<CartItem> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ProductInfo(product: widget.product),
        QuantitySelector(
          quantity: _quantity,
          onChanged: (newQty) {
            setState(() => _quantity = newQty);
            widget.onQuantityChanged(newQty);
          },
        ),
      ],
    );
  }
}
```

### Pattern 3: Slot Pattern — Builder Callbacks for Flexible Composition

```dart
// ExpandableCard accepts its header and content as widget "slots"
// Caller decides what goes in each slot
class ExpandableCard extends StatefulWidget {
  final Widget header;             // always visible
  final Widget content;            // shown/hidden when expanded
  final bool initiallyExpanded;

  const ExpandableCard({
    super.key,
    required this.header,
    required this.content,
    this.initiallyExpanded = false,
  });

  @override
  State<ExpandableCard> createState() => _ExpandableCardState();
}

class _ExpandableCardState extends State<ExpandableCard> {
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(child: widget.header),  // caller's header widget
                  AnimatedRotation(
                    duration: const Duration(milliseconds: 200),
                    turns: _isExpanded ? 0.5 : 0,
                    child: const Icon(Icons.keyboard_arrow_down),
                  ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 250),
            crossFadeState: _isExpanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: widget.content,   // caller's content widget
            ),
          ),
        ],
      ),
    );
  }
}

// Usage — the slot pattern makes ExpandableCard reusable for anything:
ExpandableCard(
  header: Text('Order #12345', style: Theme.of(context).textTheme.titleMedium),
  content: OrderDetailsList(order: order),
)

ExpandableCard(
  header: Row(children: [Icon(Icons.payment), Text('Payment Methods')]),
  content: PaymentMethodGrid(methods: userMethods),
  initiallyExpanded: true,
)
```

---

## 5. `CustomPainter` — Drawing Custom Shapes

> 📄 **Flutter Docs:**
> *"A painter that provides a canvas to paint on. The paint method is called whenever the canvas needs painting. Override shouldRepaint to return false when the painter is already in the correct state."*

When widgets can't achieve what you need — badges, charts, wave shapes, progress arcs — you drop down to `CustomPainter`.

```dart
// A circular progress arc for a skill meter
class SkillArcPainter extends CustomPainter {
  final double progress;     // 0.0 to 1.0
  final Color color;
  final Color trackColor;

  const SkillArcPainter({
    required this.progress,
    required this.color,
    required this.trackColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 10;

    // Track (background arc)
    final trackPaint = Paint()
      ..color = trackColor
      ..strokeWidth = 10
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -3.14159 / 2,       // start at top (12 o'clock)
      2 * 3.14159,        // full circle
      false,
      trackPaint,
    );

    // Progress arc
    final progressPaint = Paint()
      ..color = color
      ..strokeWidth = 10
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -3.14159 / 2,               // start at top
      2 * 3.14159 * progress,     // sweep = full circle × progress fraction
      false,
      progressPaint,
    );

    // Center text
    final textPainter = TextPainter(
      text: TextSpan(
        text: '${(progress * 100).round()}%',
        style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    textPainter.paint(
      canvas,
      Offset(center.dx - textPainter.width / 2, center.dy - textPainter.height / 2),
    );
  }

  @override
  bool shouldRepaint(SkillArcPainter old) {
    // Only repaint when something changed — Flutter calls this to decide
    return old.progress != progress || old.color != color;
  }
}

// Usage
CustomPaint(
  size: const Size(120, 120),
  painter: SkillArcPainter(
    progress: 0.78,
    color: Theme.of(context).colorScheme.primary,
    trackColor: Theme.of(context).colorScheme.surfaceVariant,
  ),
)

// Animated version — listen to an Animation and repaint as it changes
CustomPaint(
  painter: SkillArcPainter(
    progress: _progressAnimation.value,   // changes every frame
    color: Theme.of(context).colorScheme.primary,
    trackColor: Theme.of(context).colorScheme.surfaceVariant,
  ),
  child: const SizedBox(width: 120, height: 120),
)
```

**Rule:** Override `shouldRepaint` correctly. Return `true` only when the painter's data actually changed. Returning `true` always works but kills performance. Returning `false` always skips repaints even when needed.

---

## 6. Building a Complete Custom Widget — `RatingBar`

Let's build a full custom rating widget from scratch: tappable stars that accept and display a rating.

```dart
// lib/widgets/rating_bar.dart

class RatingBar extends StatelessWidget {
  final double rating;          // 0.0 to maxRating
  final int maxRating;
  final double starSize;
  final Color activeColor;
  final Color inactiveColor;
  final void Function(double)? onRatingChanged;  // null = read-only

  const RatingBar({
    super.key,
    required this.rating,
    this.maxRating = 5,
    this.starSize = 24,
    this.activeColor = Colors.amber,
    this.inactiveColor = const Color(0xFFE0E0E0),
    this.onRatingChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(maxRating, (index) {
        final starValue = index + 1.0;
        final fill = (rating - index).clamp(0.0, 1.0);

        return GestureDetector(
          onTap: onRatingChanged != null ? () => onRatingChanged!(starValue) : null,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: _Star(
              fill: fill,
              size: starSize,
              activeColor: activeColor,
              inactiveColor: inactiveColor,
            ),
          ),
        );
      }),
    );
  }
}

class _Star extends StatelessWidget {
  final double fill;    // 0.0 = empty, 0.5 = half, 1.0 = full
  final double size;
  final Color activeColor;
  final Color inactiveColor;

  const _Star({required this.fill, required this.size, required this.activeColor, required this.inactiveColor});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _StarPainter(
          fill: fill,
          activeColor: activeColor,
          inactiveColor: inactiveColor,
        ),
      ),
    );
  }
}

class _StarPainter extends CustomPainter {
  final double fill;
  final Color activeColor;
  final Color inactiveColor;

  const _StarPainter({required this.fill, required this.activeColor, required this.inactiveColor});

  @override
  void paint(Canvas canvas, Size size) {
    final path = _buildStarPath(size);

    // Draw filled portion (clip to left side based on fill)
    if (fill > 0) {
      canvas.save();
      canvas.clipRect(Rect.fromLTWH(0, 0, size.width * fill, size.height));
      canvas.drawPath(path, Paint()..color = activeColor);
      canvas.restore();
    }

    // Draw empty portion (clip to right side)
    if (fill < 1) {
      canvas.save();
      canvas.clipRect(Rect.fromLTWH(size.width * fill, 0, size.width, size.height));
      canvas.drawPath(path, Paint()..color = inactiveColor);
      canvas.restore();
    }
  }

  Path _buildStarPath(Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final outerRadius = size.width / 2;
    final innerRadius = outerRadius * 0.38;
    const numPoints = 5;
    final path = Path();

    for (int i = 0; i < numPoints * 2; i++) {
      final radius = i.isEven ? outerRadius : innerRadius;
      final angle = (i * 3.14159 / numPoints) - 3.14159 / 2;
      final x = cx + radius * _cos(angle);
      final y = cy + radius * _sin(angle);
      i == 0 ? path.moveTo(x, y) : path.lineTo(x, y);
    }

    return path..close();
  }

  double _cos(double rad) => math.cos(rad);
  double _sin(double rad) => math.sin(rad);

  @override
  bool shouldRepaint(_StarPainter old) => old.fill != fill;
}
```

```dart
// Usage examples

// Read-only display
RatingBar(rating: 4.3, starSize: 16)

// Interactive — user can tap to rate
RatingBar(
  rating: _userRating,
  onRatingChanged: (r) => setState(() => _userRating = r),
  activeColor: Theme.of(context).colorScheme.tertiary,
)
```

---

## 7. Context Menus — Long Press & Right-Click

> 🍎 **Academy Golden Rule — Platform Consistency:**
> *"iOS users expect a long press to reveal actions. Android users expect the same, plus a right-click equivalent on desktop. Your app should feel native on every platform."*

### PopupMenuButton — The Standard Pattern

```dart
PopupMenuButton<String>(
  onSelected: (value) {
    switch (value) {
      case 'edit': _editNote(note);
      case 'pin': _togglePin(note);
      case 'share': _shareNote(note);
      case 'delete': _confirmDelete(note);
    }
  },
  itemBuilder: (context) => [
    const PopupMenuItem(value: 'edit', child: ListTile(
      leading: Icon(Icons.edit), title: Text('Edit'),
      contentPadding: EdgeInsets.zero,
    )),
    const PopupMenuItem(value: 'pin', child: ListTile(
      leading: Icon(Icons.push_pin), title: Text('Pin to Top'),
      contentPadding: EdgeInsets.zero,
    )),
    const PopupMenuItem(value: 'share', child: ListTile(
      leading: Icon(Icons.share), title: Text('Share'),
      contentPadding: EdgeInsets.zero,
    )),
    const PopupMenuDivider(),
    const PopupMenuItem(value: 'delete', child: ListTile(
      leading: Icon(Icons.delete, color: Colors.red),
      title: Text('Delete', style: TextStyle(color: Colors.red)),
      contentPadding: EdgeInsets.zero,
    )),
  ],
)
```

### Long Press Context Menu — Custom Position

```dart
// Show a menu at the exact position of the long press
class NoteCard extends StatelessWidget {
  final Note note;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const NoteCard({super.key, required this.note, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPressStart: (details) {
        _showContextMenu(context, details.globalPosition);
      },
      child: Card(/* ... note content ... */),
    );
  }

  void _showContextMenu(BuildContext context, Offset position) {
    showMenu<String>(
      context: context,
      position: RelativeRect.fromLTRB(
        position.dx, position.dy,
        position.dx, position.dy,
      ),
      items: [
        const PopupMenuItem(value: 'edit', child: Text('Edit')),
        const PopupMenuItem(value: 'duplicate', child: Text('Duplicate')),
        const PopupMenuDivider(),
        const PopupMenuItem(value: 'delete', child: Text('Delete',
          style: TextStyle(color: Colors.red),
        )),
      ],
    ).then((value) {
      switch (value) {
        case 'edit': onEdit();
        case 'delete': onDelete();
      }
    });
  }
}
```

### `CupertinoContextMenu` — iOS Native Feel

```dart
// iOS-style context menu with 3D touch / long press preview
CupertinoContextMenu(
  actions: [
    CupertinoContextMenuAction(
      child: const Text('Share'),
      trailingIcon: CupertinoIcons.share,
      onPressed: () { Navigator.pop(context); _share(); },
    ),
    CupertinoContextMenuAction(
      child: const Text('Copy'),
      trailingIcon: CupertinoIcons.doc_on_doc,
      onPressed: () { Navigator.pop(context); _copy(); },
    ),
    CupertinoContextMenuAction(
      isDestructiveAction: true,
      child: const Text('Delete'),
      trailingIcon: CupertinoIcons.delete,
      onPressed: () { Navigator.pop(context); _delete(); },
    ),
  ],
  child: NotePreviewCard(note: note),   // this widget animates up on long press
)
```

---

## 8. `ReorderableListView` — Drag to Reorder

```dart
ReorderableListView.builder(
  itemCount: tasks.length,
  onReorder: (oldIndex, newIndex) {
    setState(() {
      if (newIndex > oldIndex) newIndex--;
      final item = tasks.removeAt(oldIndex);
      tasks.insert(newIndex, item);
    });
  },
  itemBuilder: (context, index) {
    return ListTile(
      key: ValueKey(tasks[index].id),  // ← REQUIRED: key for each item
      leading: const Icon(Icons.drag_handle),
      title: Text(tasks[index].title),
      trailing: Checkbox(
        value: tasks[index].isDone,
        onChanged: (v) => _toggle(index),
      ),
    );
  },
  proxyDecorator: (child, index, animation) {
    // Customize the dragged item's appearance
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) => Material(
        elevation: lerpDouble(0, 8, animation.value)!,
        borderRadius: BorderRadius.circular(8),
        child: child,
      ),
      child: child,
    );
  },
)
```

**Rule:** Every child of `ReorderableListView` must have a `Key`. Without keys, Flutter can't track which item is being moved. Use `ValueKey(item.id)`, not `ValueKey(index)` — the index changes during the reorder.

---

## 9. Accessibility for Custom Gestures

> 🍎 **Academy Golden Rule — Accessibility Is Not Optional:**
> *"If a user can't discover your gesture, it doesn't exist. Every custom gesture must have a semantic label and an alternative input method. VoiceOver users can't long press — provide a visible button fallback."*

```dart
// ❌ Custom gesture with NO accessibility — invisible to screen readers
GestureDetector(
  onDoubleTap: () => _addToFavorites(item),
  child: ProductCard(product: item),
)

// ✓ Wrap in Semantics with a custom action
Semantics(
  label: '${item.name}, ${item.formattedPrice}',
  customSemanticsActions: {
    CustomSemanticsAction(label: 'Add to favorites'): () => _addToFavorites(item),
    CustomSemanticsAction(label: 'Quick add to cart'): () => _addToCart(item),
  },
  child: GestureDetector(
    onDoubleTap: () => _addToFavorites(item),
    child: ProductCard(product: item),
  ),
)

// For Dismissible — always show a visible delete button too
Dismissible(
  key: ValueKey(item.id),
  onDismissed: (_) => _delete(item),
  background: Container(color: Colors.red, child: const Icon(Icons.delete)),
  child: ListTile(
    title: Text(item.name),
    trailing: IconButton(         // ← accessible alternative to swipe
      icon: const Icon(Icons.delete_outline),
      tooltip: 'Delete ${item.name}',  // ← announced by screen reader
      onPressed: () => _confirmDelete(item),
    ),
  ),
)
```

**The accessibility checklist for custom interactions:**
```
1. Can the gesture be discovered without seeing a tutorial?
   └── Add a tooltip or hint text
2. Can VoiceOver / TalkBack trigger this action?
   └── Add Semantics with customSemanticsActions
3. Does it meet minimum touch target (48×48dp Material, 44×44pt Apple)?
   └── Wrap in SizedBox or use IconButton
4. Is there a visible fallback for gestures that aren't obvious?
   └── Long press: also show a ⋯ button
   └── Swipe: also show a delete icon
```

---

## Gesture Decision Chart

```
User interacts with a widget and something should happen?
│
├── Standard Material interaction (ripple expected)
│     → InkWell or InkResponse
│
├── Custom visual feedback or non-Material surface
│     → GestureDetector
│
├── Drag and drop between zones
│     → Draggable + DragTarget
│
├── Freeform pan/drag on canvas
│     → GestureDetector with onPanUpdate
│
├── Pinch to zoom / rotation
│     → GestureDetector with onScaleUpdate
│
├── Swipe to dismiss/delete
│     → Dismissible widget
│
└── Reorder list items
      → ReorderableListView
```

---

## Lab — Kanban Board

Build a Kanban board with three columns (Todo, In Progress, Done) and draggable task cards:

**Columns:**
- Each column: `Column` header (name + task count badge) + scrollable list of `TaskCard`s
- `TaskCard`: task name, priority chip (Low/Medium/High with color), assignee avatar

**Interactions:**
- `Draggable<Task>`: drag a task card to a different column
- `DragTarget<Task>`: each column is a drop target that highlights on hover
- On drop: move task from source column to target column
- Long-press a task: shows `showModalBottomSheet` with task details and "Edit" / "Delete" actions

**Custom widget to build:** `PriorityBadge` — a pill-shaped chip with colors:
- Low → green background, green text
- Medium → orange background, orange text
- High → red background, red text

---

## Challenge — Custom Slider Widget

Build a `ColorSlider` widget that lets the user scrub through a color hue (0–360°):

```
[   gradient bar (red → orange → yellow → ... → red)   ]
                        ↑
                  [thumb circle]
              (follows finger on drag)
```

Requirements:
- `CustomPaint` for the gradient bar (use `LinearGradient` with multiple color stops)
- `GestureDetector` with `onPanUpdate` to move the thumb
- Thumb is a `Container` circle (20×20) that shows the currently selected color
- Exposes: `final Color value` and `final void Function(Color) onChanged`
- Clamps the thumb position to stay within the bar bounds

---

## Week 11 Verify

1. What is Flutter's "gesture arena"? Give a concrete example of two gestures competing and how Flutter resolves it.
2. When would you use `GestureDetector` instead of `InkWell`? Give a real example.
3. You build `ExpandableCard` using the slot pattern — it takes `Widget header` and `Widget content`. What is the advantage of this over passing `String title` and building the header inside `ExpandableCard`?
4. In `CustomPainter.shouldRepaint(old)`, what does returning `false` always do? What does returning `true` always do? Which is wrong and why?
5. `QuantitySelector` fires `onChanged` instead of managing `_quantity` internally. Why? What would break if it managed its own state?
6. The `RatingBar` has `void Function(double)? onRatingChanged` as nullable. What does `onRatingChanged != null ?` check do in the `GestureDetector.onTap`?
7. `Draggable` has three children: `child`, `feedback`, `childWhenDragging`. What does each show and when?
8. `showMenu` takes a `RelativeRect` position. How do you get the position of a long press? Walk through `onLongPressStart → details.globalPosition → RelativeRect.fromLTRB`.
9. `ReorderableListView` requires a `Key` on every child. What happens if you use `ValueKey(index)` instead of `ValueKey(item.id)`? Why does this break?
10. You add a double-tap gesture to favorite an item. A VoiceOver user can't double-tap — what do you add to make this accessible? Name the specific Flutter widget/property.

---

**Next → [Phase 3: State Management & APIs](../Phase_3_State_and_APIs/Phase_3_Overview.md)**
