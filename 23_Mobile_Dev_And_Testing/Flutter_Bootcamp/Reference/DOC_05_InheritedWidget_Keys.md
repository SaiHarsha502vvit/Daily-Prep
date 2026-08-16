# InheritedWidget & Keys — Complete Reference
### How Flutter shares data down the tree, and how it tracks widget identity

---

## Part 1: InheritedWidget

### What InheritedWidget Does

Normal widgets pass data DOWN through constructors — parent gives child a value, child gives grandchild a value. With 5 levels of nesting, you're threading the same parameter through 5 constructors.

`InheritedWidget` breaks this pattern. It puts data **into** the tree so any descendant can pull it out directly. No prop drilling.

```
WITHOUT InheritedWidget — prop drilling:

App
  └─ HomePage(user: user)
       └─ ProfileSection(user: user)
            └─ AvatarWidget(user: user)
                 └─ Avatar(imageUrl: user.imageUrl)  ← finally uses it

WITH InheritedWidget — any descendant just calls UserInherited.of(context):

App
  └─ UserInherited(data: user)     ← data placed here in tree
       └─ HomePage
            └─ ProfileSection
                 └─ AvatarWidget
                      └─ Avatar    ← calls UserInherited.of(context) directly
```

---

### Writing Your Own InheritedWidget

```dart
// 1. Define the InheritedWidget
class AuthInherited extends InheritedWidget {
  final User? currentUser;
  final bool isLoggedIn;

  const AuthInherited({
    super.key,
    required this.currentUser,
    required this.isLoggedIn,
    required super.child,
  });

  // The static accessor — any descendant calls this
  static AuthInherited of(BuildContext context) {
    final result = context.dependOnInheritedWidgetOfExactType<AuthInherited>();
    assert(result != null, 'AuthInherited not found in widget tree');
    return result!;
  }

  // Optionally a nullable version
  static AuthInherited? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<AuthInherited>();
  }

  // CRITICAL: determines which descendants rebuild when data changes
  // Return true  → all descendants that called .of(context) rebuild
  // Return false → no rebuilds (data is same, no need)
  @override
  bool updateShouldNotify(AuthInherited oldWidget) {
    return currentUser != oldWidget.currentUser ||
        isLoggedIn != oldWidget.isLoggedIn;
  }
}
```

```dart
// 2. Place it high in the tree (wraps the part that needs the data)
class App extends StatefulWidget {
  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  User? _currentUser;
  bool _isLoggedIn = false;

  void _login(User user) {
    setState(() {
      _currentUser = user;
      _isLoggedIn = true;
    });
  }

  void _logout() {
    setState(() {
      _currentUser = null;
      _isLoggedIn = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AuthInherited(
      currentUser: _currentUser,
      isLoggedIn: _isLoggedIn,
      child: MaterialApp(
        home: HomeScreen(onLogin: _login, onLogout: _logout),
      ),
    );
  }
}
```

```dart
// 3. Access from any descendant — no constructor threading
class ProfileAvatar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // This widget is now registered as a dependent of AuthInherited
    // When AuthInherited's data changes (updateShouldNotify returns true),
    // ProfileAvatar automatically rebuilds
    final auth = AuthInherited.of(context);

    if (!auth.isLoggedIn) return const Icon(Icons.person);
    return CircleAvatar(
      backgroundImage: NetworkImage(auth.currentUser!.avatarUrl),
    );
  }
}
```

---

### How `dependOnInheritedWidgetOfExactType` Works Internally

```
1. ProfileAvatar.build() calls AuthInherited.of(context)

2. AuthInherited.of calls:
   context.dependOnInheritedWidgetOfExactType<AuthInherited>()

3. Flutter:
   a. Walks UP the element tree from ProfileAvatar's element
   b. Finds the AuthInherited element
   c. Returns the AuthInherited widget's data
   d. Adds ProfileAvatar's element to AuthInherited's _dependents set

4. Later, when setState() is called in _AppState:
   a. New AuthInherited widget is built
   b. updateShouldNotify(oldWidget) is called
   c. If true → all elements in _dependents are marked dirty → rebuild
   d. If false → nobody rebuilds
```

---

### InheritedWidget vs Provider vs Riverpod

| | InheritedWidget | Provider | Riverpod |
|---|---|---|---|
| Built into Flutter | Yes | No | No |
| Needs BuildContext | Yes | Yes | No |
| Mutable state | Manual (StatefulWidget wrapper) | ChangeNotifier | Notifier |
| Scoping | Subtree only | Subtree | Global (ProviderScope) |
| Testing | Hard | Medium | Easy |
| Boilerplate | High | Medium | Low |
| When to use | Understanding internals; simple read-only data | Simple apps | All serious apps |

Provider and Riverpod are both built ON TOP of `InheritedWidget`. They wrap it in a more ergonomic API.

---

### InheritedModel — Granular Rebuilds

`InheritedWidget` is binary: either all dependents rebuild or none do. `InheritedModel` lets dependents declare WHICH aspect they care about:

```dart
// Only rebuild dependents that care about the 'theme' aspect or 'locale' aspect
class AppConfig extends InheritedModel<String> {
  final ThemeData theme;
  final Locale locale;

  const AppConfig({
    super.key,
    required this.theme,
    required this.locale,
    required super.child,
  });

  static AppConfig of(BuildContext context, String aspect) {
    return InheritedModel.inheritFrom<AppConfig>(context, aspect: aspect)!;
  }

  @override
  bool updateShouldNotify(AppConfig oldWidget) {
    return theme != oldWidget.theme || locale != oldWidget.locale;
  }

  @override
  bool updateShouldNotifyDependent(AppConfig oldWidget, Set<String> aspects) {
    if (aspects.contains('theme')) return theme != oldWidget.theme;
    if (aspects.contains('locale')) return locale != oldWidget.locale;
    return false;
  }
}

// Usage: only rebuild if 'theme' aspect changed (not 'locale')
final config = AppConfig.of(context, 'theme');
```

---

## Part 2: Keys

### What Keys Do

Without keys, Flutter identifies widgets **by their type and position in the tree**. This works for most cases. It breaks when you reorder widgets or need Flutter to preserve state for a specific widget.

```dart
// Without keys — Flutter identifies by position
Column(
  children: [
    const Text('A'),  // position 0
    const Text('B'),  // position 1
  ],
)

// If you swap them:
Column(
  children: [
    const Text('B'),  // position 0 — same position, same type → Flutter thinks it's still the old widget
    const Text('A'),  // position 1
  ],
)
// For Text this is fine because Text has no state.
// For StatefulWidget, Flutter would keep the OLD state in the old position.
```

**Keys tell Flutter: "This specific widget instance should keep its state, even if it moves."**

---

### The Key Problem in Practice

```dart
// StatefulWidget that keeps a color
class ColorBox extends StatefulWidget {
  final String label;
  const ColorBox({super.key, required this.label});
  @override
  State<ColorBox> createState() => _ColorBoxState();
}

class _ColorBoxState extends State<ColorBox> {
  Color _color = Colors.red;  // state lives here

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _color = Colors.green),
      child: Container(width: 80, height: 80, color: _color, child: Text(widget.label)),
    );
  }
}
```

```dart
// WITHOUT keys — swapping causes wrong state to stick
class _ParentState extends State<Parent> {
  bool _swapped = false;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _swapped
          ? [const ColorBox(label: 'B'), const ColorBox(label: 'A')]
          : [const ColorBox(label: 'A'), const ColorBox(label: 'B')],
    );
  }
}

// When _swapped flips:
// Position 0 was ColorBox('A') → becomes ColorBox('B')
// Flutter says: "Still a ColorBox at position 0 → reuse the element"
// Result: label changes to 'B' but STATE (color) stays from 'A's state
// WRONG: ColorBox('B') shows 'A's color!

// WITH keys — Flutter tracks widget by key, not position
[const ColorBox(key: ValueKey('a'), label: 'A'), ...]
// Now when you swap, Flutter recognizes these as DIFFERENT widgets
// and preserves state correctly
```

---

### `ValueKey` — Key Based on a Value

```dart
// Use when each item has a unique identifier
ListView.builder(
  itemCount: items.length,
  itemBuilder: (_, i) => ListTile(
    key: ValueKey(items[i].id),     // string, int, any value with == defined
    title: Text(items[i].title),
  ),
)

// In Dismissible — always required
Dismissible(
  key: ValueKey(item.id),
  child: ListTile(title: Text(item.title)),
)
```

---

### `ObjectKey` — Key Based on Object Identity

```dart
// ValueKey uses == (value equality)
// ObjectKey uses identical() (reference equality)

// If your objects don't override ==, use ObjectKey
ObjectKey(myObject)  // uses object's memory address for identity
```

---

### `UniqueKey` — Always Unique, No Stability

```dart
// Creates a new unique identity every time
// GOOD: force a widget to rebuild from scratch (lose all state)
// BAD: in a list (loses all state on every rebuild)

// Use case: force AnimatedSwitcher to animate between "same" widgets
AnimatedSwitcher(
  duration: const Duration(milliseconds: 300),
  child: Text(
    count.toString(),
    key: ValueKey(count),  // different key per value → triggers animation
  ),
)

// Use UniqueKey to force a stateful widget to reset completely
_key = UniqueKey();  // in setState()
MyWidget(key: _key)  // Flutter sees new key → creates new State
```

---

### `GlobalKey` — Access State Across the Tree

```dart
// FormState — most common GlobalKey use
final _formKey = GlobalKey<FormState>();

Form(key: _formKey, child: Column(children: [
  TextFormField(validator: (v) => v!.isEmpty ? 'Required' : null),
  ElevatedButton(
    onPressed: () {
      // Access FormState from outside the Form widget
      if (_formKey.currentState!.validate()) {
        _formKey.currentState!.save();
      }
    },
    child: const Text('Submit'),
  ),
]))
```

```dart
// Get render size of any widget
class SizeAwareWidget extends StatefulWidget {
  const SizeAwareWidget({super.key});
  @override
  State<SizeAwareWidget> createState() => _State();
}

class _State extends State<SizeAwareWidget> {
  final _key = GlobalKey();

  @override
  void initState() {
    super.initState();
    // Size is only available AFTER the first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final size = _key.currentContext?.size;
      print('Widget size: $size');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(key: _key, width: 100, height: 100);
  }
}
```

**GlobalKey caveats:**
- Expensive — Flutter has to search the entire tree for GlobalKey changes
- Moving a GlobalKey widget between different parts of the tree preserves its State (useful for keeping a video playing while navigating)
- One GlobalKey can only be used in ONE location at a time

---

### `PageStorageKey` — Preserve Scroll Position

```dart
// Without key: scroll position resets when you switch tabs
// With PageStorageKey: Flutter remembers the scroll position

ListView.builder(
  key: const PageStorageKey('home_feed'),   // must be unique in the page
  itemCount: posts.length,
  itemBuilder: (_, i) => PostCard(post: posts[i]),
)

// Works with IndexedStack to preserve scroll across tabs
IndexedStack(
  index: _currentTab,
  children: [
    ListView.builder(key: const PageStorageKey('tab0'), ...),
    ListView.builder(key: const PageStorageKey('tab1'), ...),
    ListView.builder(key: const PageStorageKey('tab2'), ...),
  ],
)
```

`PageStorageKey` stores its state in the nearest `PageStorage` ancestor. `Scaffold` provides one automatically.

---

### Key Decision Chart

```
Do you need keys?
│
├─ Reordering or removing items from a list?
│     └─ Yes → use ValueKey(item.id) on each item
│
├─ Dismissible widget?
│     └─ Always → ValueKey(item.id) required
│
├─ AnimatedSwitcher between "same-looking" widgets?
│     └─ Yes → ValueKey(uniqueValue) on the child
│
├─ Need to call a method on a StatefulWidget from outside?
│     └─ Yes → GlobalKey<YourState>
│
├─ Need to validate a Form from outside?
│     └─ Yes → GlobalKey<FormState>
│
├─ Want to preserve scroll position across tab switches?
│     └─ Yes → PageStorageKey('unique_name') + IndexedStack
│
└─ Want to force a widget to completely reset?
      └─ Yes → UniqueKey() when you want the reset
```

---

### Key Scope

Keys only need to be unique within their **siblings** (same parent):

```dart
Column(
  children: [
    Row(
      children: [
        // Keys in this Row only need to be unique among Row's children
        ColorBox(key: const ValueKey('a')),
        ColorBox(key: const ValueKey('b')),
      ],
    ),
    Row(
      children: [
        // These can reuse the same key values — different parent
        ColorBox(key: const ValueKey('a')),
        ColorBox(key: const ValueKey('b')),
      ],
    ),
  ],
)
```

Exception: `GlobalKey` must be globally unique in the entire app.

---

### Keys and the Reconciliation Algorithm

Flutter's reconciliation (comparing old widget tree to new widget tree) works like this:

**Without keys — position-based matching:**
```
Old:  [A, B, C]     →  positions 0, 1, 2
New:  [B, A, C]     →  positions 0, 1, 2

Matches: old[0]A → new[0]B (same position, same type = reuse element)
         old[1]B → new[1]A (reuse)
         old[2]C → new[2]C (reuse)

Result: A's state ends up in position 0 with B's label. WRONG for stateful widgets.
```

**With keys — key-based matching:**
```
Old:  [A(key:'a'), B(key:'b'), C(key:'c')]
New:  [B(key:'b'), A(key:'a'), C(key:'c')]

Matches: old A(key:'a') → new A(key:'a') (same key = reuse element, MOVE it)
         old B(key:'b') → new B(key:'b') (reuse, MOVE)
         old C(key:'c') → new C(key:'c') (stays in place)

Result: A keeps its state, B keeps its state. CORRECT.
```

---

## Summary

| Concept | Purpose | When to use |
|---------|---------|-------------|
| `InheritedWidget` | Share data down the tree without prop drilling | Implementing custom state sharing |
| `updateShouldNotify` | Control which descendants rebuild | Always implement — return true only when relevant data changed |
| `dependOnInheritedWidgetOfExactType` | Register as dependent + get data | Inside `.of(context)` patterns |
| `ValueKey(value)` | Stable identity based on a value | List items with IDs, Dismissible, AnimatedSwitcher |
| `ObjectKey(obj)` | Stable identity based on object reference | Objects that don't override `==` |
| `UniqueKey()` | Always new identity | Force widget reset |
| `GlobalKey<S>()` | Access a widget's State from outside the tree | Form validation, Scaffold.of(), getting widget size |
| `PageStorageKey` | Preserve scroll position across navigations | ListView inside tabs, IndexedStack |

---

**→ Related files:**
- [DOC_05b_InheritedWidget_Keys_Challenges.md](DOC_05b_InheritedWidget_Keys_Challenges.md) — want to actually get fluent, not just informed? Challenges for this doc
- [DOC_01_Rendering_Pipeline.md](DOC_01_Rendering_Pipeline.md) — Element tree reconciliation (where keys matter)
- [DOC_04_BuildContext_Deep_Dive.md](DOC_04_BuildContext_Deep_Dive.md) — how `.of(context)` walks the tree
