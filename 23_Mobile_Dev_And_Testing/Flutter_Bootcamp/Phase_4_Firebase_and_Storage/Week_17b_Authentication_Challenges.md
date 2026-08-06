# Authentication Challenges

### Companion to [Week 17: Authentication](Week_17_Authentication.md)

---

## How This Works

Auth bugs are almost always timing bugs — a stream that keeps delivering after it should have stopped, a router that flickers during a loading gap, a token check that's off by a boundary condition. All four problems here are fully runnable in [DartPad](https://dartpad.dev) using fake auth streams standing in for `FirebaseAuth.instance.authStateChanges()` — the timing mechanics are identical either way.

---

### W17-1 (Medium) — Auth-state-driven routing without flicker

**Problem:** a router that shows Splash while auth state is unknown, Login if signed out, Home if signed in — driven by a stream, exactly like `authStateChanges()`.

```dart
class FakeAuth {
  final _controller = StreamController<String?>.broadcast(); // null = signed out
  Stream<String?> get authStateChanges => _controller.stream;
  void signIn(String uid) => _controller.add(uid);
  void signOut() => _controller.add(null);
}

class AuthRouter extends StatefulWidget {
  const AuthRouter({super.key, required this.auth});
  final FakeAuth auth;
  @override
  State<AuthRouter> createState() => _AuthRouterState();
}

class _AuthRouterState extends State<AuthRouter> {
  String? _uid;
  bool _hasReceivedFirstEvent = false; // TODO: why is this flag necessary?
  late final StreamSubscription<String?> _sub;

  @override
  void initState() {
    super.initState();
    _sub = widget.auth.authStateChanges.listen((uid) {
      setState(() {
        _uid = uid;
        _hasReceivedFirstEvent = true;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasReceivedFirstEvent) return const Text('Splash — waiting for first auth event');
    if (_uid == null) return const Text('Login screen');
    return Text('Home screen (uid=$_uid)');
  }

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}
```

**Task:** the `_hasReceivedFirstEvent` flag looks redundant at first — `_uid == null` already distinguishes signed-out from signed-in. Explain in your own words why it's actually necessary: what would this router incorrectly show, briefly, on a real app's cold start if that flag didn't exist?

<details><summary>Explanation</summary>

🔴 **Explanation:** without the flag, the router's initial state is `_uid == null` (Dart's default for an uninitialized nullable field) — which is **indistinguishable** from "the user checked, and they're genuinely signed out." On a real app's cold start, `authStateChanges()` takes a moment (checking a locally cached, possibly-expired token, or waiting on Firebase's SDK to initialize) before it emits its *first* event — during that gap, a router without the flag would show the **Login screen**, even for a user who is actually signed in, then flash to the Home screen a moment later once the real auth state arrives. That flash is a genuinely bad, jarring user experience real apps get wrong — the fix is exactly this pattern: track "have I received *any* event yet" separately from "what was the most recent event," and show a neutral splash/loading state until the first real answer arrives.

</details>

---

### W17-2 (Easy) — Token expiry math, as pure functions

**Problem:** write two pure functions modeling the JWT expiry mechanics from [Week 17's Invisible Machinery](Week_17_Authentication.md) — no Firebase needed, this is pure `DateTime` arithmetic.

```dart
bool isTokenExpired({required DateTime issuedAt, required Duration ttl, required DateTime now}) {
  // TODO
}

/// Returns how long until the app should proactively refresh —
/// refresh at 90% of the token's lifetime, not at the exact expiry moment.
Duration timeUntilRefresh({required DateTime issuedAt, required Duration ttl, required DateTime now}) {
  // TODO
}

void main() {
  final issued = DateTime(2026, 1, 1, 10, 0);
  const ttl = Duration(hours: 1);

  print(isTokenExpired(issuedAt: issued, ttl: ttl, now: DateTime(2026, 1, 1, 10, 30))); // false
  print(isTokenExpired(issuedAt: issued, ttl: ttl, now: DateTime(2026, 1, 1, 11, 1)));  // true

  print(timeUntilRefresh(issuedAt: issued, ttl: ttl, now: DateTime(2026, 1, 1, 10, 0)));
  // should be 54 minutes (90% of 60 minutes)
}
```

**Task:** implement both. Then explain: why refresh at 90% of lifetime instead of waiting until the token actually expires?

<details><summary>Solution & Explanation</summary>

```dart
bool isTokenExpired({required DateTime issuedAt, required Duration ttl, required DateTime now}) {
  return now.isAfter(issuedAt.add(ttl));
}

Duration timeUntilRefresh({required DateTime issuedAt, required Duration ttl, required DateTime now}) {
  final refreshAt = issuedAt.add(ttl * 0.9);
  return refreshAt.difference(now);
}
```

🔴 **Explanation:** refreshing proactively at 90% of lifetime (54 minutes into a 60-minute token, in this example) rather than waiting for the exact expiry moment exists to eliminate a real race: an in-flight API request that starts with a still-valid token can take a few seconds to complete, and if the token expires *during* that request, the server rejects it mid-flight — a confusing failure the user experiences as "my request randomly failed." Refreshing early, with margin, means the app is virtually always holding a comfortably-valid token, not one that might expire in the next few hundred milliseconds. This is the same class of defensive-timing reasoning as backoff jitter in [Week 14's retry challenge](../Phase_3_State_and_APIs/Week_14b_HTTP_Challenges.md) — build in margin rather than operating exactly at a hard boundary.

</details>

---

### W17-3 (Medium) — Reproduce the `userId` mismatch security-rule bug

**Problem:** the single most common Firestore + Auth bug in real apps: creating a document without setting `userId` to the current user's UID, which then fails the security rule silently (from the client's perspective, as a permission-denied error with no obvious cause).

```dart
bool passesCreateRule({
  required String? requestingUid,
  required Map<String, dynamic> newDocData,
}) {
  // Mimics: allow create: if request.auth != null
  //                    && request.resource.data.userId == request.auth.uid;
  if (requestingUid == null) return false;
  return newDocData['userId'] == requestingUid;
}

void main() {
  // BUG: developer forgot to include userId when building the doc
  final buggyDoc = {'title': 'My note', 'content': 'Hello'};
  print(passesCreateRule(requestingUid: 'user123', newDocData: buggyDoc)); // false — and confusing why

  // Fixed:
  final fixedDoc = {'title': 'My note', 'content': 'Hello', 'userId': 'user123'};
  print(passesCreateRule(requestingUid: 'user123', newDocData: fixedDoc)); // true
}
```

**Task:** this one's mostly conceptual — run it, confirm the buggy case fails, then answer: from the perspective of someone debugging this for the first time in a real app (seeing a `PERMISSION_DENIED` error from Firestore with no further detail), what two completely different root causes could produce that exact same error message? How would you tell them apart?

<details><summary>Explanation</summary>

🔴 **Explanation:** `PERMISSION_DENIED` from Firestore is deliberately vague — the security rules engine doesn't tell you *which* clause of the rule failed, only that the overall boolean expression evaluated to `false`. Two very different root causes produce the identical error: **(1)** the user genuinely isn't authorized (this exercise's bug — missing `userId` field), or **(2)** the user isn't authenticated at all (an expired token, a `signOut()` that hasn't finished propagating, or the write attempted before `FirebaseAuth.instance.currentUser` was populated). Telling them apart in a real debugging session means checking `FirebaseAuth.instance.currentUser` immediately before the write — if it's `null` or unexpectedly stale, that's cause (2); if a valid user exists but the write still fails, print the exact document payload being sent and check every field the rule references, which is exactly what this exercise's `newDocData` print would have caught immediately.

</details>

---

### W17-4 (Medium) — The sign-out race: a leftover subscription

**Problem:** a screen subscribes to a live query scoped to the current user. The user signs out. Does the subscription know to stop?

```dart
class FakeUserDataStream {
  final _controller = StreamController<String>.broadcast();
  Stream<String> get data => _controller.stream;
  void push(String value) => _controller.add(value);
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, required this.userDataStream, required this.authStream});
  final FakeUserDataStream userDataStream;
  final Stream<String?> authStream; // emits null on sign-out

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _display = 'loading...';
  late final StreamSubscription<String> _dataSub;
  late final StreamSubscription<String?> _authSub;

  @override
  void initState() {
    super.initState();
    _dataSub = widget.userDataStream.data.listen((value) {
      setState(() => _display = value); // BUG: keeps updating even after sign-out
    });
    _authSub = widget.authStream.listen((uid) {
      // TODO: what should happen here?
    });
  }

  @override
  Widget build(BuildContext context) => Text(_display);

  @override
  void dispose() {
    _dataSub.cancel();
    _authSub.cancel();
    super.dispose();
  }
}
```

**Task:** without the fix, what does `_display` show if the underlying data stream delivers one more value *right after* sign-out, but *before* the widget is actually removed from the tree (a real gap — sign-out and navigation-away are not the same instant)? Implement the `_authSub.listen` callback to close that gap.

<details><summary>Solution & Explanation</summary>

```dart
_authSub = widget.authStream.listen((uid) {
  if (uid == null) {
    _dataSub.cancel(); // stop listening to the now-stale user's data immediately
    setState(() => _display = 'Signed out');
  }
});
```

🔴 **Explanation:** without this, `_display` briefly shows the *previous user's* data even after sign-out — because nothing told `_dataSub` to stop, and Dart streams don't know or care about your app's auth state on their own. This is a real, security-relevant bug shape (not just a cosmetic glitch): on a shared device, User A signs out and User B signs in quickly, and if User A's data subscription wasn't explicitly cancelled on sign-out, there's a window where stale data from User A's session could render on screen during User B's session. The general rule this exercise proves: **any subscription scoped to "the current user" must be explicitly torn down the moment auth state changes — `dispose()` alone only handles the widget-removal case, not the still-mounted-but-signed-out case.**

</details>

---

**Next → [Week 18: Local Storage](Week_18_Local_Storage.md) · [Storage Challenges](Week_18b_Storage_Challenges.md)**
