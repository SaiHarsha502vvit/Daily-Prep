# Patterns & Anti-Patterns Challenges

### Companion to [DOC_08: Patterns & Anti-Patterns](DOC_08_Patterns_and_AntiPatterns.md)

---

## How This Works

This doc is a synthesis of the whole bootcamp, so its challenges work the same way — mostly recognition and diagnosis across *new* scenarios, not new mechanics. Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🕵️ Code Review — Name the Anti-Pattern (No Hints)

Three snippets. No commentary this time — for each, name which anti-pattern from DOC_08 is present, and which specific week's Bug Hunt it matches.

**Snippet 1:**
```dart
class NotificationBell extends StatelessWidget {
  const NotificationBell({super.key});
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<int>(
      stream: sl<NotificationRepository>().watchUnreadCount(),
      builder: (context, snapshot) => Badge(count: snapshot.data ?? 0),
    );
  }
}
```

**Snippet 2:**
```dart
Future<void> loadDashboard() async {
  final results = await Future.wait([
    fetchRecentOrders(),
    fetchRecommendations(),  // known to occasionally time out for new accounts
    fetchLoyaltyPoints(),
  ]);
  // ...
}
```

**Snippet 3:**
```dart
class PaymentUseCase {
  Future<void> charge(double amount) async {
    await Stripe.instance.confirmPayment(amount); // direct SDK call
  }
}
// PaymentUseCase lives in lib/domain/usecases/
```

<details><summary>Answers</summary>

**Snippet 1 — Resources Created Inside `build()`.** `.watchUnreadCount()` is called fresh every time this `StatelessWidget` rebuilds, producing a new `Stream` each time — the same shape as [Week 27's typing-indicator Bug Hunt](../Phase_6_Quality_and_Deployment/Week_27b_ChatApp_Challenges.md#-bug-hunt--the-typing-indicator-that-resubscribes-constantly). `StreamBuilder` will correctly resubscribe to the new stream each time (no leak), but every unrelated rebuild of this widget tears down and re-establishes the underlying subscription for no reason.

**Snippet 2 — Silent `Future.wait` Failure Coupling.** The comment gives it away deliberately: `fetchRecommendations()` is *known* to sometimes fail for a specific case, and it's still bundled into the same `Future.wait` as two calls that have no relationship to it. One optional, expected-to-sometimes-fail call blanks the entire dashboard — exactly [Week 23's dashboard Bug Hunt](../Phase_5_Advanced_Patterns/Week_23b_ExpenseTracker_Challenges.md#-bug-hunt--one-failed-call-blanks-the-entire-dashboard).

**Snippet 3 — Layer Violation in Clean Architecture.** `PaymentUseCase` sits in `lib/domain/usecases/` (domain layer) but calls the Stripe SDK directly, with no repository interface in between — the identical shape as [Week 21's layer-violation Bug Hunt](../Phase_5_Advanced_Patterns/Week_21b_Clean_Architecture_Challenges.md#-bug-hunt--spot-the-layer-violation-nothing-crashes-here), just with a payment SDK standing in for Firestore.

</details>

---

### 🎭 Two Truths and a Lie — Patterns vs. Premature Abstraction

**A.** Lifting state up means putting it in the nearest common ancestor of everything that needs it — not automatically hoisting every piece of state to the app's root widget "to be safe."

**B.** Reaching for `sealed class` + exhaustive `switch` is worth doing even for a state with only two possible values (e.g., `loading`/`loaded`), because the compiler-enforced exhaustiveness is valuable regardless of how many cases exist.

**C.** Dependency inversion (an interface between a UseCase and its data source) is worth adding to every single class in an app, including ones that will only ever have one implementation and no tests written against them.

<details><summary>Which one's the lie</summary>

**C is the lie.** Dependency inversion has a real cost — an extra interface, an extra concrete class, a DI registration — and that cost is worth paying specifically when it buys you something: testability (swapping in a fake), or genuine multiple-implementation flexibility. A class that will provably only ever have one implementation and isn't going to be unit-tested in isolation gains nothing from an interface it'll never actually swap — that's premature abstraction, the mirror-image mistake to the anti-patterns in DOC_08's Part 2. Recognizing *when a pattern doesn't pay for itself* is as much a real skill as recognizing when it does.

🔴 **Explanation:** A is true and is the actual definition, not "state lives as high as possible always" — over-hoisting state to the app root when only two sibling widgets need it just means everything downstream of the root rebuilds unnecessarily, the [Week 12 selective-rebuild lesson](../Phase_3_State_and_APIs/Week_12b_State_Management_Challenges.md) in reverse. B is also true — a two-case `sealed class` still gets you the exact same "the compiler catches a forgotten branch" guarantee as a ten-case one; the value doesn't scale with case count, it's binary (you either get compile-time exhaustiveness checking or you don't).

</details>

---

### 🏗️ Build It Blind — Diagnose an Anti-Pattern From a Symptom Report Alone

No code shown. For each user-facing symptom report, name the *most likely* anti-pattern from DOC_08 responsible, and what code smell you'd actually go looking for to confirm it.

1. "The app feels laggy specifically on the dashboard screen, and it gets worse the longer I leave the screen open without navigating away."
2. "I edited an item in a list, and a completely different item's checkbox got checked instead."
3. "Our unit test suite for the checkout flow needs a real Firebase emulator running — it can't run in plain `dart test`."
4. "Sometimes our 'Order Summary' card is completely blank, even though I can see in the network tab that most of the API calls succeeded."

<details><summary>Reasoning</summary>

1. **Resources created inside `build()`** — "gets worse the longer the screen is open" is the specific tell: something is accumulating (leaked `Timer`s, leaked `StreamSubscription`s, leaked `AnimationController`s) rather than being cleaned up per rebuild. Go looking for anything constructing a `Timer`/`Stream`/`AnimationController` directly inside the dashboard screen's `build()` method instead of `initState`.
2. **Missing keys in a dynamic list.** The described symptom — editing/interacting with one item visibly affects a *different* item — is close to a textbook description of the reordering/position-based-identity bug. Go looking for a `.map()` producing `StatefulWidget`s with no `key:`, especially near whatever action (edit, delete, reorder) triggered the mismatch.
3. **Layer violation.** A unit test needing a real backend running is the single clearest symptom of a domain/use-case class depending on a concrete SDK directly instead of an abstract repository interface — if there were a proper interface, the test would construct a fake implementation instead.
4. **Silent `Future.wait` failure coupling.** "Most calls succeeded, but the whole card is blank" is exactly the signature — one failing call inside a bundled `Future.wait` is discarding the results of the calls that actually worked.

🔴 **Explanation:** the actual transferable skill here isn't the four answers — it's the pattern-matching itself: real bug reports rarely name the anti-pattern directly, they describe a *symptom*, and recognizing which of a small number of known shapes produces that symptom is what separates fast triage from starting a debugging session from zero.

</details>

---

**Next → [DOC_09: Mobile Debugging & Troubleshooting Toolkit](DOC_09_Mobile_Debugging_Toolkit.md)**
