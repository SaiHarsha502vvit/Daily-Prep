# Week 9 — Animations
### Implicit, Explicit, Hero, and Custom — understanding Flutter's full animation toolkit

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — AnimationController, Tween, Curve — how the pieces fit together
> - 🎨 **Designer** — duration, easing, purpose — when animation adds value vs when it distracts
> - 🧪 **Tester** — pumping frames in tests, `pumpAndSettle`, testing animation endpoints

---

## Flutter's Animation Philosophy

> 📄 **Flutter Docs:**
> *"In Flutter's animation library, an Animation object knows nothing about what is onscreen. An Animation is an abstract class that understands its current value and its state (whether it's completed or dismissed). A Tween describes the mapping from an input range to an output range."*

This is important. In Flutter, an animation is **not** "move this box." It is:
1. A **value that changes over time** (from 0.0 to 1.0 over 300ms)
2. A **mapping** from that value to something visual (0.0 = invisible, 1.0 = fully visible)
3. A **rebuild** triggered by the value change (the widget reads the value and redraws)

```
AnimationController (0.0 → 1.0 over 300ms)
         ↓
      Tween (maps 0.0–1.0 to 0.0px–200.0px or Color(red) → Color(blue))
         ↓
   Animation<double> / Animation<Color>
         ↓
   Widget reads value in build() → redraws
```

Flutter animations fit into two tiers: **implicit** (Flutter handles the controller) and **explicit** (you control the `AnimationController` yourself).

---

## 1. Implicit Animations — Flutter Does the Work

> 📄 **Flutter Docs:**
> *"Implicit animations make it easy to create animations without requiring you to explicitly create an AnimationController. You provide a new value and Flutter animates from the old value to the new one over a given duration."*

Implicit animations are the `Animated*` widgets. You change a property value — Flutter smoothly animates the transition. No controller. No listener. No `AnimatedBuilder`.

```dart
class LikeButton extends StatefulWidget { ... }

class _LikeButtonState extends State<LikeButton> {
  bool _isLiked = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _isLiked = !_isLiked),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        width: _isLiked ? 60 : 48,
        height: _isLiked ? 60 : 48,
        decoration: BoxDecoration(
          color: _isLiked ? Colors.red : Colors.grey[200],
          shape: BoxShape.circle,
          boxShadow: _isLiked
              ? [BoxShadow(color: Colors.red.withOpacity(0.4), blurRadius: 12, spreadRadius: 2)]
              : [],
        ),
        child: Icon(
          _isLiked ? Icons.favorite : Icons.favorite_border,
          color: _isLiked ? Colors.white : Colors.grey,
          size: _isLiked ? 28 : 22,
        ),
      ),
    );
  }
}
```

Every time `_isLiked` changes, `AnimatedContainer` smoothly transitions ALL changed properties simultaneously: color, size, and shadow all animate together over 300ms.

### The Full `Animated*` Widget Toolkit

```dart
// AnimatedOpacity — fade in/out
AnimatedOpacity(
  opacity: _isVisible ? 1.0 : 0.0,
  duration: const Duration(milliseconds: 200),
  child: Text('I fade!'),
)

// AnimatedPadding — padding transitions
AnimatedPadding(
  padding: _isExpanded
      ? const EdgeInsets.all(24)
      : const EdgeInsets.all(8),
  duration: const Duration(milliseconds: 300),
  curve: Curves.easeOut,
  child: child,
)

// AnimatedAlign — alignment transitions
AnimatedAlign(
  alignment: _isAtTop ? Alignment.topCenter : Alignment.bottomCenter,
  duration: const Duration(milliseconds: 400),
  curve: Curves.bounceOut,
  child: FloatingButton(),
)

// AnimatedDefaultTextStyle — text style transitions
AnimatedDefaultTextStyle(
  style: _isSelected
      ? const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blue)
      : const TextStyle(fontSize: 16, fontWeight: FontWeight.normal, color: Colors.grey),
  duration: const Duration(milliseconds: 200),
  child: Text('Tab Label'),
)

// AnimatedSwitcher — cross-fade between different widgets
AnimatedSwitcher(
  duration: const Duration(milliseconds: 300),
  transitionBuilder: (child, animation) => FadeTransition(opacity: animation, child: child),
  child: _isLoading
      ? const CircularProgressIndicator(key: ValueKey('loading'))
      : const Icon(Icons.check, key: ValueKey('done')),
  // ← Keys are REQUIRED: AnimatedSwitcher uses them to detect that the widget changed
)

// TweenAnimationBuilder — implicit animation for ANY value
TweenAnimationBuilder<double>(
  tween: Tween(begin: 0, end: _targetProgress),
  duration: const Duration(milliseconds: 500),
  curve: Curves.easeOut,
  builder: (context, value, _) {
    return CircularProgressIndicator(value: value);
  },
)
```

🎨 **Designer:** Choosing the right `Curve` is as important as choosing the right duration:
| Curve | Feel | Use For |
|-------|------|---------|
| `easeInOut` | Natural, symmetrical | Most UI transitions |
| `easeOut` | Fast start, slow finish | Things entering the screen |
| `easeIn` | Slow start, fast finish | Things leaving the screen |
| `bounceOut` | Bounces at end | Playful, notifications, badges |
| `elasticOut` | Overshoots, springs back | Icons, FABs, playful interactions |
| `linear` | Constant speed | Progress indicators, spinners |

Duration rules of thumb:
- Micro-interactions (button state change): 100–200ms
- Screen transitions: 200–400ms
- Large content changes: 300–500ms
- Never above 600ms for UI elements — starts to feel slow

**Rule:** Always give `AnimatedSwitcher` children unique keys. Without keys, Flutter can't tell if the widget changed — the animation won't play.

🧪 **Tester:** Animations don't run until you pump frames:

```dart
testWidgets('AnimatedContainer changes color on like', (tester) async {
  await tester.pumpWidget(MaterialApp(home: LikeButton()));

  // Find the container — initially grey
  expect(
    tester.widget<AnimatedContainer>(find.byType(AnimatedContainer)).decoration,
    // Check decoration has grey color
  );

  // Tap to like
  await tester.tap(find.byType(GestureDetector));
  await tester.pump();  // start animation

  // Halfway through the animation
  await tester.pump(const Duration(milliseconds: 150));

  // End of animation — color should be red now
  await tester.pumpAndSettle();  // wait for animation to complete
  // Now verify final state
});
```

---

## 2. Explicit Animations — You Control the Controller

> 📄 **Flutter Docs:**
> *"An AnimationController is a special Animation object that generates a new value whenever the hardware is ready for a new frame. By default, an AnimationController linearly produces numbers from 0.0 to 1.0 during a given duration."*

Use explicit animations when you need:
- Repeat/loop animations (spinners, pulse effects, idle animations)
- Animations triggered by physics or gesture (drag)
- Multiple properties controlled by one timeline
- Precise control (pause, reverse, seek to a position)

```dart
class PulsingHeart extends StatefulWidget { ... }

class _PulsingHeartState extends State<PulsingHeart>
    with SingleTickerProviderStateMixin {      // ← mixin provides the "ticker" that drives the animation
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,    // ← 'this' works because of SingleTickerProviderStateMixin
    );

    // Scale pulses from 1.0 to 1.3 and back
    _scaleAnimation = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.3).chain(CurveTween(curve: Curves.easeOut)), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 1.3, end: 1.0).chain(CurveTween(curve: Curves.easeIn)), weight: 60),
    ]).animate(_controller);

    // Opacity fades: 1.0 → 0.4 → 1.0 in sync
    _opacityAnimation = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.4), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 0.4, end: 1.0), weight: 50),
    ]).animate(_controller);

    // Loop forever
    _controller.repeat();
  }

  @override
  void dispose() {
    _controller.dispose();   // CRITICAL — leaks if not disposed
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Opacity(
            opacity: _opacityAnimation.value,
            child: child,   // ← child is NOT rebuilt on every frame
          ),
        );
      },
      child: const Icon(Icons.favorite, color: Colors.red, size: 40),  // built ONCE
    );
  }
}
```

🧑‍💻 **Developer:** The `child` parameter of `AnimatedBuilder` is critical for performance. The `builder` function runs **every frame** (60 times per second). If you put the `Icon` inside `builder`, it's rebuilt 60x/second. If you pass it as `child`, it's built once and the reference is passed to `builder` — no rebuild.

### `SingleTickerProviderStateMixin` vs `TickerProviderStateMixin`

```dart
// One AnimationController in this widget:
with SingleTickerProviderStateMixin

// Two or more AnimationControllers in this widget:
with TickerProviderStateMixin

// Using TabController (which has its own controller):
with SingleTickerProviderStateMixin  // TabController takes vsync: this
```

### Controller Methods

```dart
_controller.forward();          // play 0.0 → 1.0
_controller.reverse();          // play 1.0 → 0.0
_controller.repeat();           // loop 0.0 → 1.0 → 0.0 → ...
_controller.repeat(reverse: true);  // loop 0.0 → 1.0 → 0.0 (smooth bounce)
_controller.stop();             // pause at current position
_controller.reset();            // jump to 0.0 without animation
_controller.animateTo(0.5);    // animate to a specific position
print(_controller.value);       // current value (0.0 to 1.0)
print(_controller.status);      // AnimationStatus: forward, reverse, completed, dismissed
```

---

## 3. `AnimatedBuilder` vs `AnimatedWidget`

Two patterns for the same thing — choose based on context:

```dart
// Pattern 1: AnimatedBuilder — common, works for anything
// Use this 90% of the time
class SpinningIcon extends StatefulWidget { ... }
class _SpinningIconState extends State<SpinningIcon> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat();
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      child: const Icon(Icons.refresh, size: 32),
      builder: (context, child) => Transform.rotate(
        angle: _controller.value * 2 * 3.14159,
        child: child,
      ),
    );
  }
}

// Pattern 2: AnimatedWidget subclass — when you want a reusable animated primitive
// Better for low-level animation widgets that ship in a library
class RotationWidget extends AnimatedWidget {
  const RotationWidget({super.key, required Animation<double> rotation})
      : super(listenable: rotation);

  Animation<double> get rotation => listenable as Animation<double>;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: rotation.value,
      child: const Icon(Icons.refresh, size: 32),
    );
  }
}
```

---

## 4. Hero Animations — Shared Element Transitions

> 📄 **Flutter Docs:**
> *"The Hero widget in Flutter implements a style of animation commonly known as shared element transitions or shared element animations. The animation flows naturally from one screen to the next."*

```dart
// Screen A — the source
GridView.builder(
  itemBuilder: (context, index) {
    final photo = photos[index];
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => PhotoDetailScreen(photo: photo)),
      ),
      child: Hero(
        tag: 'photo-${photo.id}',   // ← MUST be unique, MUST match between screens
        child: Image.network(photo.thumbnailUrl, fit: BoxFit.cover),
      ),
    );
  },
)

// Screen B — the destination
class PhotoDetailScreen extends StatelessWidget {
  final Photo photo;
  const PhotoDetailScreen({super.key, required this.photo});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GestureDetector(
        onTap: () => Navigator.pop(context),
        child: Center(
          child: Hero(
            tag: 'photo-${photo.id}',   // ← Same tag as Screen A
            child: Image.network(photo.url, fit: BoxFit.contain),
          ),
        ),
      ),
    );
  }
}
```

Flutter automatically:
1. Captures the position/size of the `Hero` in Screen A
2. Captures the position/size of the `Hero` in Screen B
3. Flies the image between them during the page transition

🎨 **Designer:** Hero animations are the most impactful thing you can add to an image-heavy app. The image "flies" from the thumbnail to full size — this creates a strong sense of continuity and feels premium. Guidelines:
- Only use Hero for images or card-to-detail transitions
- The tag MUST be unique per visible item — use the item's ID
- The child widget should look good at both the small and large size

🧪 **Tester:** Hero animations can't easily be verified in unit tests. Use integration tests:

```dart
testWidgets('hero animation navigates to detail', (tester) async {
  await tester.pumpWidget(app);
  await tester.tap(find.byType(GestureDetector).first);
  await tester.pumpAndSettle();   // wait for navigation + hero animation to complete
  expect(find.byType(PhotoDetailScreen), findsOneWidget);
});
```

---

## 5. `AnimatedList` — Animating List Item Addition/Removal

> 📄 **Flutter Docs:**
> *"A scrolling container that animates items when they are inserted or removed. The AnimatedList widget is similar to ListView, but has extra mechanisms for inserting and removing items with animations."*

```dart
class AnimatedTodoList extends StatefulWidget { ... }

class _AnimatedTodoListState extends State<AnimatedTodoList> {
  final GlobalKey<AnimatedListState> _listKey = GlobalKey<AnimatedListState>();
  final List<String> _todos = ['Buy milk', 'Call dentist'];

  void _addTodo(String todo) {
    _todos.insert(0, todo);
    // Tell AnimatedList to animate insertion at index 0
    _listKey.currentState!.insertItem(0, duration: const Duration(milliseconds: 300));
  }

  void _removeTodo(int index) {
    final removed = _todos.removeAt(index);
    // Tell AnimatedList to animate removal — must provide the widget that will animate out
    _listKey.currentState!.removeItem(
      index,
      (context, animation) => _buildItem(removed, animation),
      duration: const Duration(milliseconds: 300),
    );
  }

  Widget _buildItem(String todo, Animation<double> animation) {
    return SizeTransition(
      sizeFactor: animation,
      child: ListTile(
        title: Text(todo),
        trailing: IconButton(
          icon: const Icon(Icons.delete),
          onPressed: () => _removeTodo(_todos.indexOf(todo)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedList(
      key: _listKey,
      initialItemCount: _todos.length,
      itemBuilder: (context, index, animation) => _buildItem(_todos[index], animation),
    );
  }
}
```

---

## 6. Staggered Animations — Multiple Elements, Sequenced

```dart
// Screen entrance animation: cards fly in one by one from the bottom
class StaggeredCardList extends StatefulWidget { ... }

class _StaggeredCardListState extends State<StaggeredCardList>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  final List<String> _items = ['Card 1', 'Card 2', 'Card 3', 'Card 4'];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..forward();
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  // Each card animates in sequence, offset by 150ms per card
  Animation<Offset> _slideAnimation(int index) {
    final start = index * 0.15;   // 0.0, 0.15, 0.30, 0.45
    final end = start + 0.4;      // 0.4, 0.55, 0.70, 0.85

    return Tween<Offset>(
      begin: const Offset(0, 0.5),  // starts 50% below final position
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Interval(start, end.clamp(0.0, 1.0), curve: Curves.easeOut),
      // Interval limits this animation to a portion of the total duration
    ));
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: _items.length,
      itemBuilder: (context, index) {
        return SlideTransition(
          position: _slideAnimation(index),
          child: FadeTransition(
            opacity: _slideAnimation(index).drive(Tween(begin: 0.0, end: 1.0)),
            child: Card(
              margin: const EdgeInsets.all(12),
              child: ListTile(title: Text(_items[index])),
            ),
          ),
        );
      },
    );
  }
}
```

🎨 **Designer:** Staggered animations feel delightful for:
- Dashboard loading — metrics cards fly in sequentially
- Onboarding screens — features revealed one by one
- Search results appearing

Don't use staggered animations for:
- Repeated actions (user would see it every time they search — annoying)
- Long lists (animating 50 items creates chaos)

**Rule for stagger timing:** Each element delays by 80–150ms. Total duration = (n-1 * delay) + single-element duration. More than 600ms total feels slow.

---

## 7. `PageRouteBuilder` — Custom Page Transitions

```dart
// Replace the default slide-right transition with a custom fade+scale
Navigator.push(
  context,
  PageRouteBuilder(
    pageBuilder: (context, animation, secondaryAnimation) =>
        const ProductDetailScreen(),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(parent: animation, curve: Curves.easeOut);
      return FadeTransition(
        opacity: curved,
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.92, end: 1.0).animate(curved),
          child: child,
        ),
      );
    },
    transitionDuration: const Duration(milliseconds: 300),
    reverseTransitionDuration: const Duration(milliseconds: 250),
  ),
);
```

🎨 **Designer:** Custom transitions are a powerful branding tool. Some conventions:
- E-commerce: cards that "expand" into detail screens (scale + fade)
- Social apps: horizontal swipe between profiles
- News apps: vertical slide between articles
- Modal sheets: slide up (built-in for `showModalBottomSheet`)

Match the transition to the navigation metaphor. "Deeper" navigation → slide in from the right. Modal/overlay → slide up from the bottom.

---

## Animation Decision Chart

```
Need to animate a property change?
├── Yes, just when a value changes (color, size, opacity, padding)
│     → AnimatedContainer / AnimatedOpacity / AnimatedPadding (implicit)
│
├── Need to animate between two different widgets (loading → done)
│     → AnimatedSwitcher
│
├── Need to animate ANY value (not just Widget properties)
│     → TweenAnimationBuilder<T>
│
├── Need looping / reversing / precise control
│     → AnimationController + AnimatedBuilder (explicit)
│
├── Need shared element transition between screens
│     → Hero widgets with matching tags
│
├── Need items to animate in/out of a list
│     → AnimatedList
│
├── Need multiple elements to animate in sequence
│     → AnimationController + Interval (staggered)
│
└── Need a custom page transition
      → PageRouteBuilder
```

---

## Lab — Profile Card With Micro-Interactions

Build a profile card with these animations:

1. **Follow button** — `AnimatedContainer` that:
   - Idle: outlined button, white background
   - Following: filled button, blue background, "Following ✓" text
   - Transition: 300ms easeInOut on all properties

2. **Avatar hover state** — When `onTap` is active (long press): scale to 1.05, shadow increases. On release: return to normal.

3. **Stats reveal** — When the card first appears: numbers count up from 0 to their real values using `TweenAnimationBuilder<int>`. Duration: 800ms, curve: easeOut.

4. **Skill bars** — Each `LinearProgressIndicator` animates from 0.0 to its `skill.level` on appear. Staggered: each bar delays 100ms after the previous.

5. **Tab switch** — Use `AnimatedSwitcher` to fade between "Posts", "Projects", and "Likes" tab content. Duration: 200ms.

---

## Challenge — Loading Screen with Lottie-Style Animation

Build a custom loading animation without any external packages:

```
Three dots that pulse sequentially:
  ● ● ●
  Each dot: 20x20, primary color
  Dot 1 pulses (scale 1.0 → 1.5 → 1.0), then
  Dot 2 pulses, then
  Dot 3 pulses, then repeat

Duration per dot: 300ms
Gap between dots: 100ms
Total loop: ~1200ms
```

Implement this using `AnimationController` + `TweenSequence` with `Interval`. No packages — pure Flutter animation.

---

## Week 9 Verify

1. What does an `AnimationController` produce? What do `Tween` and `Curve` add to it?
2. You use `AnimatedSwitcher` to switch between a loading spinner and a checkmark. The animation doesn't play. What is the most likely cause?
3. Why must `AnimationController` be disposed? What happens if you don't dispose it?
4. `AnimatedBuilder` has a `child` parameter. Explain why passing the widget as `child` (not inside `builder`) is more performant.
5. You have two `AnimationController`s in one `State`. Which mixin do you use? Why can't you use `SingleTickerProviderStateMixin`?
6. `Hero` tags must be unique. You have a `GridView` with 20 product photos. What should the `Hero` tag for each one be?
7. You want "Card 3" to start its slide-in animation 300ms after the screen opens. How do you use `Interval` to achieve this?

---

**Next → [Week 10: Project — Shopping App](Week_10_Project_ShoppingApp.md)**
