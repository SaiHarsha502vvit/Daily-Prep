# Navigation & State Challenges

### Companion to [Week 05: Navigation & State](Week_05_Navigation_and_State.md)

---

## How This Works

Two instruments this time: typed generics on `Navigator.push<T>()` (the compiler catches your mistakes before you run anything), and `NavigatorObserver` — a genuinely useful debugging tool that lets you print every push/pop as it happens, so "what's actually on the stack right now" stops being a guess.

---

### W5-1 (Easy) — Typed round trip: push, edit, pop with a result

**Problem:** a list screen shows a name. Tapping it opens an edit screen with a pre-filled `TextField`. Saving pops back to the list **with the edited name**, and the list updates in place.

```dart
class ListScreen extends StatefulWidget {
  const ListScreen({super.key});
  @override
  State<ListScreen> createState() => _ListScreenState();
}

class _ListScreenState extends State<ListScreen> {
  String _name = 'Harsha';

  Future<void> _openEditor() async {
    // TODO: push EditScreen, typed <String>, await the result,
    // and if it's non-null, update _name
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ElevatedButton(
          onPressed: _openEditor,
          child: Text('Name: $_name (tap to edit)'),
        ),
      ),
    );
  }
}

class EditScreen extends StatefulWidget {
  const EditScreen({super.key, required this.initialName});
  final String initialName;
  @override
  State<EditScreen> createState() => _EditScreenState();
}

class _EditScreenState extends State<EditScreen> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.initialName);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(actions: [
        IconButton(
          icon: const Icon(Icons.check),
          onPressed: () {
            // TODO: pop, returning _controller.text
          },
        ),
      ]),
      body: TextField(controller: _controller),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

**Task:** fill in both TODOs. Also handle the case where the user backs out with the OS/device back button instead of the checkmark — what does `Navigator.pop(context)` return in that case, and does your `_openEditor` code handle it without crashing?

<details><summary>Solution & Explanation</summary>

```dart
Future<void> _openEditor() async {
  final result = await Navigator.push<String>(
    context,
    MaterialPageRoute(builder: (_) => EditScreen(initialName: _name)),
  );
  if (result != null) {
    setState(() => _name = result);
  }
}

// In EditScreen's checkmark button:
onPressed: () => Navigator.pop(context, _controller.text),
```

🔴 **explanation:** `Navigator.push<String>` types the returned `Future` as `Future<String?>` — the `?` isn't optional decoration, it's the compiler telling you the truth: a back-button pop calls `Navigator.pop(context)` with **no** second argument, which completes the awaited future with `null`. If you wrote `final result = await Navigator.push<String>(...)` and then did `setState(() => _name = result)` **without** the null check, that's a compile error in a null-safe Dart project (`String` can't hold `null`) — the type system catches the bug before you ever run the app. This is the practical payoff of [Week 5's Completer mechanism](Week_05_Navigation_and_State.md): the generic type parameter on `push<T>` isn't decoration, it's what makes the null case something the compiler forces you to handle.

</details>

---

### W5-2 (Medium) — IndexedStack vs naive tab switching: lose state, then don't

**Problem:** build the same 2-tab UI two ways and compare.

```dart
// Version A — naive: rebuilds the whole body on tab switch
class NaiveTabs extends StatefulWidget {
  const NaiveTabs({super.key});
  @override
  State<NaiveTabs> createState() => _NaiveTabsState();
}

class _NaiveTabsState extends State<NaiveTabs> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _index == 0 ? const HomeTab() : const NotesTab(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.note), label: 'Notes'),
        ],
      ),
    );
  }
}

class HomeTab extends StatelessWidget {
  const HomeTab({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Text('Home'));
}

class NotesTab extends StatefulWidget {
  const NotesTab({super.key});
  @override
  State<NotesTab> createState() => _NotesTabState();
}

class _NotesTabState extends State<NotesTab> {
  final _controller = TextEditingController();
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(16),
    child: TextField(controller: _controller, decoration: const InputDecoration(labelText: 'Draft a note')),
  );
}
```

**Task 1:** type something into the Notes tab's TextField, switch to Home, switch back to Notes. Predict — is your text still there?

**Task 2:** fix it using `IndexedStack` (swap out the `_index == 0 ? ... : ...` body for an `IndexedStack` holding both tabs, controlled by `index:`).

<details><summary>Solution & Explanation</summary>

```dart
body: IndexedStack(
  index: _index,
  children: const [HomeTab(), NotesTab()],
),
```

🔴 **explanation:** in Version A, `_index == 0 ? const HomeTab() : const NotesTab()` means only ONE of the two widgets is ever in the tree at a time — switching tabs removes `NotesTab` from the tree entirely (`dispose()` runs on `_NotesTabState`, `_controller` and everything with it is destroyed) and switching back creates a **brand new** `_NotesTabState` from scratch, empty `TextEditingController`. `IndexedStack` keeps **both** children mounted permanently — it lays out all of them but only paints the one at `index`. The `TextEditingController` in `NotesTab` never gets disposed by a tab switch, so your typed text survives. This is [Week 5's](Week_05_Navigation_and_State.md) exact state-preservation mechanism, and the trade-off is real: both tabs' widgets stay alive and consume memory simultaneously, which is why real apps (Instagram, YouTube) accept that cost specifically because re-fetching a feed on every tab switch is worse.

</details>

---

### W5-3 (Medium) — Predict the back stack, then watch it with a NavigatorObserver

**Problem:** given this exact sequence of calls, predict what happens when the user presses the device back button 3 times in a row, in order:

```
push(ScreenA)
push(ScreenB)
pushReplacement(ScreenC)   // replaces B, A is still underneath
push(ScreenD)
```

**Task 1:** write down your prediction: after each of 3 back-presses, which screen becomes visible?

**Task 2:** verify it empirically — build a `NavigatorObserver` that prints the route name on every push/pop, and confirm your prediction against the real output.

```dart
class LoggingObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    debugPrint('PUSH: ${route.settings.name} (was: ${previousRoute?.settings.name})');
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    debugPrint('POP: ${route.settings.name} (back to: ${previousRoute?.settings.name})');
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    debugPrint('REPLACE: ${oldRoute?.settings.name} -> ${newRoute?.settings.name}');
  }
}

// Register it: MaterialApp(navigatorObservers: [LoggingObserver()], ...)
// Give every route a name: MaterialPageRoute(settings: RouteSettings(name: 'ScreenA'), builder: ...)
```

<details><summary>Answer & Explanation</summary>

**Stack contents after the 4 calls, bottom to top:** `[ScreenA, ScreenC, ScreenD]` — note `ScreenB` is gone entirely; `pushReplacement` doesn't just hide it, it removes it from the stack and destroys it.

**Back-press sequence:**
1. Back press 1: `ScreenD` pops → `ScreenC` visible
2. Back press 2: `ScreenC` pops → `ScreenA` visible
3. Back press 3: `ScreenA` pops → app exits (or previous app if this is the root route)

🔴 **explanation:** the mistake almost everyone makes on paper is assuming `ScreenB` is still in there somewhere, "underneath" `ScreenC`. It isn't — `pushReplacement` is not "push, then hide the previous one," it's "pop the current top of stack, then push this new route in its place," done as one atomic step. `ScreenB`'s `State.dispose()` runs immediately, same as any other pop. The `NavigatorObserver` isn't a toy for this exercise, either — registering one in `MaterialApp.navigatorObservers` is a genuinely useful technique any time you're debugging "why did my app land on the wrong screen after this sequence of navigations," because it turns the invisible internal `_history` list from [Week 5's Invisible Machinery](Week_05_Navigation_and_State.md) into live console output.

</details>

---

### W5-4 (Hard, bonus) — Write a route pattern matcher from scratch

**Problem:** without using `go_router` or any routing package, implement the core of what it does: given a route *pattern* like `/shop/item/:id` and an actual incoming path like `/shop/item/42`, extract the named parameters.

```dart
/// Returns the captured params if [path] matches [pattern], else null.
/// Pattern segments starting with ':' are named captures.
Map<String, String>? matchRoute(String pattern, String path) {
  // TODO
}

void main() {
  print(matchRoute('/shop/item/:id', '/shop/item/42'));
  // {id: 42}
  print(matchRoute('/shop/item/:id', '/shop/reviews'));
  // null (segment count / literal mismatch)
  print(matchRoute('/user/:userId/post/:postId', '/user/7/post/99'));
  // {userId: 7, postId: 99}
}
```

<details><summary>Solution</summary>

```dart
Map<String, String>? matchRoute(String pattern, String path) {
  final patternParts = pattern.split('/').where((s) => s.isNotEmpty).toList();
  final pathParts = path.split('/').where((s) => s.isNotEmpty).toList();

  if (patternParts.length != pathParts.length) return null;

  final params = <String, String>{};
  for (int i = 0; i < patternParts.length; i++) {
    final patternSegment = patternParts[i];
    final pathSegment = pathParts[i];

    if (patternSegment.startsWith(':')) {
      params[patternSegment.substring(1)] = pathSegment;
    } else if (patternSegment != pathSegment) {
      return null; // literal segment mismatch
    }
  }
  return params;
}
```

🔴 **explanation:** this is genuinely most of what GoRouter's matcher does under the hood — split both the pattern and the incoming path on `/`, reject immediately on segment-count mismatch, then walk segment-by-segment: a `:name` segment always matches and captures, a literal segment must match exactly or the whole route fails. What this simplified version is missing that a real router adds: optional segments, wildcard catch-alls, query parameters, and matching against a *list* of registered patterns in priority order to pick the best match. But the core mechanism — the one from [Week 5's Invisible Machinery](Week_05_Navigation_and_State.md) — is exactly the ~15 lines above.

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Back Button That Skips a Screen

```dart
Future<void> _completeCheckout(BuildContext context) async {
  await Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentProcessingScreen()));
  Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const OrderConfirmedScreen()));
}
```

Called from a "Place Order" button on a `CheckoutScreen`. The intent: show a brief processing screen, then land on order confirmation, with the back button from confirmation returning to the cart/checkout flow (not back through processing). Run through it mentally — what does the back button actually do from `OrderConfirmedScreen`, and is that actually the bug, or is something else wrong first?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** trace the stack carefully. Start: `[..., CheckoutScreen]`. `await Navigator.push(... PaymentProcessingScreen)` → `[..., CheckoutScreen, PaymentProcessingScreen]`. Then `Navigator.pushReplacement(... OrderConfirmedScreen)` replaces the **current top of stack**, which by this point is `PaymentProcessingScreen` — giving `[..., CheckoutScreen, OrderConfirmedScreen]`. So the back button from confirmation actually lands back on `CheckoutScreen` — which sounds right at first glance, except: **that's exactly the checkout screen the user just paid from**, letting them press back after a completed order and see a "Place Order" button still sitting there, inviting a duplicate charge if tapped again. This isn't a crash-bug, it's a UX/business-logic bug hiding inside correct-looking navigation code — the actual fix usually needs `pushAndRemoveUntil` to clear the entire checkout flow off the stack, not just replace one screen:

```dart
Navigator.pushAndRemoveUntil(
  context,
  MaterialPageRoute(builder: (_) => const OrderConfirmedScreen()),
  (route) => route.isFirst, // clear everything back to the app's root
);
```

The lesson: predicting *what's on the stack* (this week's core skill) isn't just an academic exercise — getting it wrong silently ships a "can accidentally double-order" bug that a functional test clicking through the happy path would never catch.

</details>

---

### 🧩 Code Jumble — Reassemble the Typed Round-Trip

These lines implement a working "pick a color, return it to the caller" flow — correct but shuffled. Reorder them (some lines belong in the caller, some in the picker screen; keep that grouping straight).

```
  Navigator.pop(context, Colors.blue);
final Color? picked = await Navigator.push<Color>(
    MaterialPageRoute(builder: (_) => const ColorPickerScreen()),
if (picked != null) setState(() => _selectedColor = picked);
  );
    context,
```

<details><summary>Reassembled</summary>

```dart
final Color? picked = await Navigator.push<Color>(
    context,
    MaterialPageRoute(builder: (_) => const ColorPickerScreen()),
  );
if (picked != null) setState(() => _selectedColor = picked);

// ...inside ColorPickerScreen, on the user's tap:
  Navigator.pop(context, Colors.blue);
```

🔴 **Explanation:** the structural constraint forcing this order: `Navigator.push`'s **arguments** (`context`, then the `MaterialPageRoute`) must appear together and in that order — swap them and it doesn't compile. The `await` must come before anything that uses `picked`, obviously, but the more interesting ordering fact is that the `Navigator.pop(context, Colors.blue)` line lives in a **completely different widget** (the picker screen) from the three lines around the `await` (the caller) — reassembling this jumble correctly requires recognizing that "one flow" in your head spans two separate `build()` methods executing at very different times, connected only by the `Future` that `push<Color>` returns.

</details>

---

### 👹 Boss Battle — A Guarded Multi-Step Wizard

**The spec:** build a 3-step signup wizard (`StepOne` → `StepTwo` → `StepThree`) where: (1) each step passes its collected data forward to the next via constructor, (2) the back button from any step returns to the previous step with that step's previously-entered data still shown (not blank), (3) `StepThree`'s "Finish" button clears the **entire wizard** off the stack and lands on a `HomeScreen` — pressing back from `HomeScreen` must NOT be able to re-enter the wizard at all, (4) if the user backs all the way out of `StepOne`, nothing crashes.

Design your own data-passing shape (a class? a record threaded through each `push`?) before opening the solution.

<details><summary>One reasonable solution</summary>

```dart
typedef SignupData = ({String? name, String? email, String? password});

class StepOne extends StatelessWidget {
  const StepOne({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ElevatedButton(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const StepTwo(data: (name: 'Ana', email: null, password: null))),
        ),
        child: const Text('Next'),
      ),
    );
  }
}

class StepTwo extends StatelessWidget {
  const StepTwo({super.key, required this.data});
  final SignupData data;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ElevatedButton(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => StepThree(data: (name: data.name, email: 'ana@x.com', password: null)),
          ),
        ),
        child: const Text('Next'),
      ),
    );
  }
}

class StepThree extends StatelessWidget {
  const StepThree({super.key, required this.data});
  final SignupData data;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ElevatedButton(
        onPressed: () => Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (route) => false, // clear EVERYTHING, including the app's original root
        ),
        child: const Text('Finish'),
      ),
    );
  }
}
```

🔴 **Explanation:** requirement (2) — back returning to a step with its data intact — is satisfied "for free" by the fact that each step is a genuinely separate route holding its own already-built widget with its own constructor data; popping back to it doesn't rebuild it from scratch, it reveals the exact instance that was already sitting underneath, same mechanism as [Week 5's core content](Week_05_Navigation_and_State.md) on why popping back is instant. Requirement (3) is `pushAndRemoveUntil` with `(route) => false` — a predicate that's never true, meaning "remove every single existing route, no exceptions," which is different from `(route) => route.isFirst` (used in the Bug Hunt above) — that variant keeps the app's original root; this one doesn't. Choosing between those two predicates *is* the actual design decision this Boss Battle is testing.

</details>

---

**Next → [Week 6: Project — Profile App](Week_06_Project_ProfileApp.md)**
