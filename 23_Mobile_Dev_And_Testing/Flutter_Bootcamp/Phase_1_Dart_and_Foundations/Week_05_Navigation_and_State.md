# Week 5 — Navigation & State
### Moving between screens + sharing data between widgets

---

## 1. Navigator — It's Just a Stack

Flutter's navigation is a literal stack of screens. You push screens on top and pop them off.

```
Stack state after navigating:

    ┌──────────────────┐  ← TOP (visible to user)
    │   DetailScreen   │
    ├──────────────────┤
    │   ListScreen     │
    ├──────────────────┤
    │   HomeScreen     │  ← BOTTOM (first screen)
    └──────────────────┘
```

When the user presses the back button, Flutter pops the top screen and the one below becomes visible.

---

## 2. Push — Go to a New Screen

```dart
// Basic push
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => const DetailScreen()),
);

// Push and pass data via constructor
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => ProductDetailScreen(productId: '42', productName: 'Shoes'),
  ),
);

// The destination screen receives data in its constructor
class ProductDetailScreen extends StatelessWidget {
  final String productId;
  final String productName;

  const ProductDetailScreen({
    super.key,
    required this.productId,
    required this.productName,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(productName)),
      body: Center(child: Text('Product ID: $productId')),
    );
  }
}
```

**→ Try this:** Build 2 screens. Screen 1 has a list of 3 items. Tapping an item pushes Screen 2 which shows that item's name and description. Pass the data via the constructor.

---

## 3. Pop — Go Back

```dart
// Simple back
Navigator.pop(context);

// Pop AND return data to the previous screen
Navigator.pop(context, 'User clicked yes');
```

**Receiving the returned data on the previous screen:**
```dart
// You must await the push — it returns whatever was passed to pop()
void _openEditScreen() async {
  final result = await Navigator.push<String>(
    context,
    MaterialPageRoute(builder: (_) => const EditScreen()),
  );

  // result is null if user pressed back, or the string if pop() was called with a value
  if (result != null) {
    setState(() => _title = result);
  }
}
```

**→ Try this:** Build a screen with a title and an "Edit" button. Tapping Edit pushes a new screen with a `TextField` pre-filled with the title. A "Save" button pops and returns the new value. The first screen updates the title.

---

## 4. pushReplacement — No Back Button

Replaces the current screen. Used when you don't want the user to go back (e.g., after login).

```dart
// After login — remove login screen, go home
Navigator.pushReplacement(
  context,
  MaterialPageRoute(builder: (_) => const HomeScreen()),
);
```

**pushNamedAndRemoveUntil — clear the entire stack:**
```dart
// After logout — remove everything, show login
Navigator.pushNamedAndRemoveUntil(
  context,
  '/login',
  (route) => false,  // remove ALL routes below
);
```

---

## 5. Named Routes

For apps with many screens, define routes once in `MaterialApp`:

```dart
MaterialApp(
  initialRoute: '/',
  routes: {
    '/': (context) => const HomeScreen(),
    '/login': (context) => const LoginScreen(),
    '/profile': (context) => const ProfileScreen(),
    '/settings': (context) => const SettingsScreen(),
  },
)

// Navigate anywhere
Navigator.pushNamed(context, '/profile');
Navigator.pushReplacementNamed(context, '/login');
Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
```

**Passing data with named routes:**
```dart
// Pass arguments
Navigator.pushNamed(context, '/product', arguments: {'id': '42', 'name': 'Shoes'});

// Receive in destination
@override
Widget build(BuildContext context) {
  final args = ModalRoute.of(context)!.settings.arguments as Map<String, String>;
  final id = args['id']!;
}
```

Named routes are good for small apps. For larger apps, use GoRouter (you'll see this in Phase 3+).

---

## 6. Bottom Navigation — The IndexedStack Pattern

Most apps have 3-5 top-level tabs. Here's the correct way to implement them:

```dart
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  // All screens live here — they're always in memory
  static const List<Widget> _screens = [
    HomeTab(),
    SearchTab(),
    ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // IndexedStack keeps all screens alive — only shows the active one
      // This preserves scroll position and state when switching tabs
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) => setState(() => _selectedIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.search),
            label: 'Search',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
```

**Why `IndexedStack` and not just `_screens[_selectedIndex]`?**

With `_screens[_selectedIndex]`, every tab switch destroys and recreates the screen. Scroll position resets. State is lost. With `IndexedStack`, all screens are mounted once and just hidden/shown. Switching tabs is instant and state is preserved.

**→ Try this:** Build a 3-tab app. Tab 1 has a counter. Tab 2 has a text field. Tab 3 shows static content. Switch between tabs and verify: the counter stays at its value and the text field keeps its text.

---

## 7. Dialogs, Snackbars, BottomSheets

These are "overlay" UI patterns — they appear on top of the current screen without a navigation push.

**AlertDialog:**
```dart
Future<bool?> showDeleteConfirmation(BuildContext context) {
  return showDialog<bool>(
    context: context,
    barrierDismissible: false,  // user must tap a button, can't tap outside to close
    builder: (context) => AlertDialog(
      title: const Text('Delete item?'),
      content: const Text('This cannot be undone.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),  // returns false
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          onPressed: () => Navigator.pop(context, true),   // returns true
          child: const Text('Delete'),
        ),
      ],
    ),
  );
}

// Usage
final confirmed = await showDeleteConfirmation(context);
if (confirmed == true) { /* delete */ }
```

**SnackBar — quick non-blocking notification:**
```dart
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(
    content: const Text('Item deleted'),
    behavior: SnackBarBehavior.floating,
    action: SnackBarAction(
      label: 'Undo',
      onPressed: () { /* undo */ },
    ),
    duration: const Duration(seconds: 3),
  ),
);
```

**ModalBottomSheet — slides up from bottom:**
```dart
showModalBottomSheet(
  context: context,
  isScrollControlled: true,  // allows the sheet to be taller than half screen
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
  ),
  builder: (context) => DraggableScrollableSheet(
    initialChildSize: 0.5,    // starts at 50% of screen height
    minChildSize: 0.25,
    maxChildSize: 0.9,
    expand: false,
    builder: (_, scrollController) => ListView(
      controller: scrollController,
      children: [
        // Sheet content
        ListTile(leading: const Icon(Icons.edit), title: const Text('Edit')),
        ListTile(leading: const Icon(Icons.share), title: const Text('Share')),
        ListTile(
          leading: const Icon(Icons.delete, color: Colors.red),
          title: const Text('Delete', style: TextStyle(color: Colors.red)),
          onTap: () {
            Navigator.pop(context);  // close the sheet
            // then do the delete
          },
        ),
      ],
    ),
  ),
);
```

**→ Try this:** Build a list of 5 items. Each item has a trailing `IconButton` with a "more" icon. Tapping it opens a BottomSheet with "Edit" and "Delete" options. Tapping "Delete" closes the sheet and shows a SnackBar with "Item deleted" and an Undo action.

---

## 8. State — Lifting It Up

Here's a common problem: two sibling widgets both need the same piece of state.

```
         Parent
        /      \
  SiblingA   SiblingB
```

`SiblingA` has a counter. `SiblingB` needs to display that counter value. They're siblings — neither can directly access the other's state.

**Solution: lift the state to the Parent:**

```dart
class Parent extends StatefulWidget {
  const Parent({super.key});

  @override
  State<Parent> createState() => _ParentState();
}

class _ParentState extends State<Parent> {
  int _count = 0;           // state lives here now

  void _increment() => setState(() => _count++);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CounterButton(onPressed: _increment),  // passes the function down
        CounterDisplay(count: _count),         // passes the value down
      ],
    );
  }
}

class CounterButton extends StatelessWidget {
  final VoidCallback onPressed;
  const CounterButton({super.key, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(onPressed: onPressed, child: const Text('+'));
  }
}

class CounterDisplay extends StatelessWidget {
  final int count;
  const CounterDisplay({super.key, required this.count});

  @override
  Widget build(BuildContext context) {
    return Text('Count: $count', style: const TextStyle(fontSize: 32));
  }
}
```

**The pattern:** state lives in the lowest common ancestor. Data flows down via constructors. Events flow up via callbacks.

**The problem this creates at scale:**

```
App (owns the state)
 └── Screen
      └── Section
           └── Row
                └── Card
                     └── Button  ← user taps here
```

To update App-level state from Button, you'd pass a callback through 5 levels. This is called **prop drilling** and it gets painful fast. This is exactly why Phase 3 introduces Riverpod — it breaks this chain.

For now, lifting state is the correct approach for small widget trees.

---

## 9. The `mounted` Guard in Async Callbacks

When a widget is removed from the tree (user navigates away), its State is disposed. If you have an `async` operation (network call, timer) that calls `setState()` after disposal — it throws an error.

```dart
class _MyState extends State<MyWidget> {
  Future<void> _loadData() async {
    final data = await fetchFromServer(); // takes 2 seconds

    // By the time this runs, the user might have left the screen
    if (!mounted) return;  // check before setState

    setState(() => _data = data);
  }
}
```

Always add `if (!mounted) return;` before `setState()` inside any async callback.

---

## Lab — Multi-Screen Shopping Flow

Build a 3-screen shopping flow with real data passing:

**Screen 1: Product List**
- 5 hardcoded products (name, price, image URL, stock count)
- Each product in a Card with an "Add to Cart" button
- Cart icon in AppBar showing item count (badge)
- "View Cart" button in AppBar pushes Screen 3

**Screen 2: Product Detail**
- Reached by tapping the product card (not the Add button)
- Shows larger image, full description, price, stock
- Quantity selector (+ / - buttons, can't go above stock or below 1)
- "Add to Cart" button — returns quantity to Screen 1 via `Navigator.pop(context, quantity)`
- Screen 1 receives it and updates cart count

**Screen 3: Cart**
- Pushed from Screen 1 AppBar button
- Shows list of added products with quantities
- Shows total price
- "Checkout" button shows an AlertDialog: "Order placed!" with OK button
- OK dismisses dialog and pops back to Screen 1
- Back button returns to Screen 1

State: lift the cart state to a common ancestor (or use the MainScreen as the state holder).

---

## Challenge

Add a **search screen** to the bottom nav (4 tabs now: Home, Products, Search, Cart).

The Search tab has a `TextField`. As the user types, filter the product list in real time and show matching products. The filter runs on every keystroke — use `onChanged` on the TextField.

Tapping a result pushes the Product Detail screen.

**Tricky part:** The cart state needs to be shared across all 4 tabs. How will you lift that state to the right level?

---

## Before Week 6 — Verify

1. What is the difference between `Navigator.push` and `Navigator.pushReplacement`?
2. How do you return data from a screen back to the previous screen?
3. Why does `IndexedStack` preserve state but `_screens[index]` doesn't?
4. What is "prop drilling" and why is it a problem at scale?
5. When and why do you check `if (!mounted) return` before `setState()`?

---

**Next → [Week 6: Project — Profile App](Week_06_Project_ProfileApp.md)**
