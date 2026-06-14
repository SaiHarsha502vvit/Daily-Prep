# Week 9 — Animations
### Implicit, Explicit, Hero, and Custom — with real use cases for each

---

Flutter animations fit into two categories: **implicit** (Flutter handles the animation) and **explicit** (you control it with an `AnimationController`). Start with implicit — they cover 80% of real use cases.

---

## 1. Implicit Animations — Flutter Does the Work

Implicit animation widgets animate between old and new values automatically when their properties change.

**`AnimatedContainer` — most versatile implicit animation:**
```dart
class _AnimatedCardState extends State<AnimatedCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _expanded = !_expanded),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        width: _expanded ? 300 : 150,
        height: _expanded ? 200 : 80,
        decoration: BoxDecoration(
          color: _expanded ? Colors.deepPurple : Colors.deepPurple.shade200,
          borderRadius: BorderRadius.circular(_expanded ? 24 : 8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(_expanded ? 0.3 : 0.1),
              blurRadius: _expanded ? 16 : 4,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: Text(
            _expanded ? 'Tap to collapse' : 'Tap to expand',
            style: const TextStyle(color: Colors.white),
          ),
        ),
      ),
    );
  }
}
```

Every time `setState()` triggers a rebuild, `AnimatedContainer` smoothly interpolates between old and new values for ALL its properties simultaneously.

**`AnimatedOpacity`:**
```dart
AnimatedOpacity(
  opacity: _isVisible ? 1.0 : 0.0,
  duration: const Duration(milliseconds: 500),
  child: const Text('I fade in and out'),
)
```

**`AnimatedSwitcher` — animates between two different widgets:**
```dart
AnimatedSwitcher(
  duration: const Duration(milliseconds: 300),
  transitionBuilder: (child, animation) =>
    FadeTransition(opacity: animation, child: child),
  child: _isLiked
    ? const Icon(Icons.favorite, key: ValueKey('liked'), color: Colors.red, size: 32)
    : const Icon(Icons.favorite_border, key: ValueKey('unliked'), size: 32),
)
```

**Note the `key`:** `AnimatedSwitcher` detects widget changes by type and key. If both states use `Icon`, you must give them different `key` values so Flutter knows they're different widgets and triggers the animation.

**`AnimatedPositioned` — inside a Stack:**
```dart
Stack(
  children: [
    AnimatedPositioned(
      duration: const Duration(milliseconds: 400),
      curve: Curves.elasticOut,
      bottom: _menuOpen ? 0 : -200,  // slides up from below
      left: 0,
      right: 0,
      child: Container(height: 200, color: Colors.white, /* menu content */),
    ),
  ],
)
```

**`TweenAnimationBuilder` — custom value animation without an AnimationController:**
```dart
TweenAnimationBuilder<double>(
  tween: Tween(begin: 0.0, end: _progress),
  duration: const Duration(milliseconds: 800),
  curve: Curves.easeOut,
  builder: (context, value, child) {
    return LinearProgressIndicator(value: value);
  },
)
```

**→ Try this:** Build a card that expands when tapped. Collapsed state: 80px tall, shows just a title. Expanded: 240px tall, shows title + description + an action button. Animate the height, border radius, and color. Use `AnimatedContainer`.

---

## 2. Curves — The Shape of an Animation

The `curve` parameter controls how fast/slow the animation moves over time.

```dart
// Linear — constant speed (usually boring, rarely natural)
Curves.linear

// Ease — starts slow, speeds up, slows down (most natural)
Curves.easeIn
Curves.easeOut
Curves.easeInOut

// Back — overshoots slightly, then settles (bouncy feel)
Curves.easeInBack
Curves.easeOutBack

// Elastic — spring-like overshoot
Curves.elasticIn
Curves.elasticOut

// Bounce — bounces at the end
Curves.bounceOut

// Fast/slow combinations
Curves.fastOutSlowIn   // recommended for most material animations
Curves.slowMiddle
```

**→ Try this:** Build a row of 6 identical containers. Each one uses a different curve (linear, easeIn, easeOut, easeInOut, elasticOut, bounceOut). Tapping a "Go" button animates all of them sliding from left to right simultaneously. Observe how differently they feel.

---

## 3. Explicit Animations — You Control the Controller

When you need to:
- Repeat indefinitely (loading spinner, pulsing, looping)
- Chain animations in sequence
- Drive animations from gestures (drag to reveal)
- Control play/pause/reverse manually

You need an `AnimationController`.

```dart
class _PulseButtonState extends State<PulseButton>
    with SingleTickerProviderStateMixin {

  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,                              // 'this' because of SingleTickerProviderStateMixin
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);                  // ping-pong: 0→1→0→1...

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.15,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    _colorAnimation = ColorTween(
      begin: Colors.deepPurple,
      end: Colors.purpleAccent,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();   // CRITICAL — always dispose
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // AnimatedBuilder rebuilds only its builder when animation changes
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _colorAnimation.value,
            ),
            onPressed: widget.onPressed,
            child: child,   // child is passed through — not rebuilt every frame
          ),
        );
      },
      child: const Text('Press Me'),  // this doesn't rebuild on each frame
    );
  }
}
```

**Controller methods:**
```dart
_controller.forward()          // play 0 → 1
_controller.reverse()          // play 1 → 0
_controller.repeat()           // 0 → 1 → 0 → 1... indefinitely
_controller.repeat(reverse: true) // 0 → 1 → 0 → 1... (ping-pong)
_controller.stop()             // pause at current position
_controller.reset()            // jump back to 0
_controller.animateTo(0.5)     // animate to a specific value
_controller.value              // current value (0.0 to 1.0)
_controller.status             // AnimationStatus.forward / reverse / completed / dismissed
```

---

## 4. Staggered Animations — Sequential Timing

Animate multiple things in sequence or with overlapping delays:

```dart
class _StaggeredListState extends State<StaggeredList>
    with SingleTickerProviderStateMixin {

  late AnimationController _controller;
  late List<Animation<Offset>> _slideAnimations;
  late List<Animation<double>> _fadeAnimations;

  final int _itemCount = 5;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _slideAnimations = List.generate(_itemCount, (index) {
      final start = index * 0.15;  // each item starts 150ms after previous
      final end = start + 0.5;
      return Tween<Offset>(
        begin: const Offset(-1, 0),  // starts off-screen to the left
        end: Offset.zero,
      ).animate(CurvedAnimation(
        parent: _controller,
        curve: Interval(start, end, curve: Curves.easeOut),
      ));
    });

    _fadeAnimations = List.generate(_itemCount, (index) {
      final start = index * 0.15;
      return Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: _controller,
          curve: Interval(start, start + 0.4),
        ),
      );
    });

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: _itemCount,
      itemBuilder: (context, index) {
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return FadeTransition(
              opacity: _fadeAnimations[index],
              child: SlideTransition(
                position: _slideAnimations[index],
                child: child,
              ),
            );
          },
          child: ListTile(title: Text('Item ${index + 1}')),
        );
      },
    );
  }
}
```

**→ Try this:** Build a dashboard screen where 4 stat cards animate in one after another — slide up from below + fade in, each 150ms after the previous.

---

## 5. Hero Animation — Shared Element Transitions

Hero animations connect a widget on Screen A to a widget on Screen B. Flutter automatically animates between them.

```dart
// Screen A — thumbnail
GestureDetector(
  onTap: () => Navigator.push(context,
    MaterialPageRoute(builder: (_) => PhotoDetailScreen(imageUrl: url))),
  child: Hero(
    tag: 'photo-$id',  // tag must match in both screens
    child: ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Image.network(url, width: 120, height: 120, fit: BoxFit.cover),
    ),
  ),
)

// Screen B — full screen
Hero(
  tag: 'photo-$id',  // same tag
  child: Image.network(url, width: double.infinity, fit: BoxFit.contain),
)
```

Flutter automatically animates the image from its size and position in Screen A to its size and position in Screen B. The transition feels like the image "flies" to its new location.

**Rules:**
- `tag` must be unique per Hero pair on screen (use the item ID)
- Both screens must be in the same navigator
- The tag must be identical on both screens

---

## 6. Page Transitions — Custom Screen Animations

```dart
// Custom transition when pushing a route
Navigator.push(
  context,
  PageRouteBuilder(
    pageBuilder: (context, animation, secondaryAnimation) => const DetailScreen(),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      // Slide from right
      const begin = Offset(1.0, 0.0);
      const end = Offset.zero;
      final tween = Tween(begin: begin, end: end)
        .chain(CurveTween(curve: Curves.easeInOut));

      return SlideTransition(
        position: animation.drive(tween),
        child: child,
      );
    },
    transitionDuration: const Duration(milliseconds: 400),
  ),
);
```

**Common transition effects:**
```dart
// Fade
FadeTransition(opacity: animation, child: child)

// Scale
ScaleTransition(scale: animation, child: child)

// Slide from bottom
SlideTransition(position: Tween(begin: Offset(0, 1), end: Offset.zero).animate(animation), child: child)

// Combined fade + scale
FadeTransition(
  opacity: animation,
  child: ScaleTransition(
    scale: Tween(begin: 0.9, end: 1.0).animate(animation),
    child: child,
  ),
)
```

---

## Lab — Build an Animated Onboarding Flow

3-page onboarding. Each page has a distinct animation style.

**Page 1 — Slide in from right (staggered):**
- Large icon slides in from right, then title fades up, then subtitle fades up (staggered, 200ms apart)
- Use `AnimationController` with 3 `Interval`-based animations

**Page 2 — Bouncing elements:**
- 3 feature cards (icon + text) each with a `bounceOut` scale animation triggered when the page becomes visible
- Cards animate in sequence (staggered by 300ms each)

**Page 3 — Pulsing CTA:**
- A large checkmark/success icon with a repeating scale pulse animation
- "Get Started" button slides up from below when page is shown
- Tapping it plays a completion animation (scale up + fade out) then navigates

**Bottom dots indicator:**
- Animated dots showing current page (active dot is wider — `AnimatedContainer`)
- Dots smoothly expand/contract on page change

---

## Challenge

Build an **animated "Add to Cart" button** — the kind you see in high-quality e-commerce apps:

**Flow when tapped:**
1. Button shrinks to a circle (300ms, `AnimatedContainer`)
2. Circle shows a spinning loader for 800ms (explicit `AnimationController`, repeat)
3. Loader fades out, a checkmark fades in (400ms, `AnimatedSwitcher`)
4. After 600ms, button expands back to full size showing "Added ✓" (green)
5. After 1.5s, resets to original "Add to Cart" state

This requires: `AnimationController`, `setState` timed with futures, `AnimatedSwitcher`, `AnimatedContainer` all working together.

---

## Before Week 10 — Verify

1. What is the difference between implicit and explicit animations?
2. When would you use `TweenAnimationBuilder` vs a full `AnimationController`?
3. Why does `AnimatedSwitcher` need different `key` values for its children?
4. Why do you pass `child` through `AnimatedBuilder` instead of rebuilding it inside `builder`?
5. What does `Interval(0.2, 0.6, curve: Curves.easeOut)` mean in a staggered animation?

---

**Next → [Week 10: Project — Shopping App UI Clone](Week_10_Project_ShoppingApp.md)**
