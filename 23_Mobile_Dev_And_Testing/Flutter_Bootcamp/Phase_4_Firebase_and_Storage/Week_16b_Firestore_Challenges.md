# Firebase & Firestore Challenges

### Companion to [Week 16: Firebase & Firestore](Week_16_Firebase_Firestore.md)

---

## How This Works

Most of these simulate Firestore's actual mechanisms in **pure Dart** — no Firebase project, no network, fully runnable in [DartPad](https://dartpad.dev) — because the point is understanding the *mechanism* (multiplexed real-time listeners, security rule logic, conflict resolution), which is identical whether the data lives in a real Firestore instance or a `Map` standing in for one. W16-4 is flagged separately as needing a real Firebase project.

---

### W16-1 (Easy) — Simulate Firestore's real-time listener mechanism

**Problem:** Firestore's `.snapshots()` is a broadcast stream — multiple screens listening to the same query all get every update. Simulate this with a plain `StreamController.broadcast()` standing in for a Firestore collection.

```dart
class FakeFirestoreCollection {
  final List<Map<String, dynamic>> _docs = [];
  final _controller = StreamController<List<Map<String, dynamic>>>.broadcast();

  Stream<List<Map<String, dynamic>>> snapshots() => _controller.stream;

  void add(Map<String, dynamic> doc) {
    _docs.add(doc);
    _controller.add(List.unmodifiable(_docs)); // "push" the new full snapshot
  }
}

void main() {
  final notes = FakeFirestoreCollection();

  // Two "screens" listening to the same collection:
  notes.snapshots().listen((docs) => print('Screen A sees: $docs'));
  notes.snapshots().listen((docs) => print('Screen B sees: $docs'));

  notes.add({'title': 'Groceries'});
  notes.add({'title': 'Call mom'});
}
```

**Task:** run it. Both "screens" should print both updates. Now change `.broadcast()` to a plain (non-broadcast) `StreamController()` and try adding a second `.listen()` call — what happens, and why does that failure mode make sense given what you already know about single-subscription vs broadcast streams?

<details><summary>Explanation</summary>

Removing `.broadcast()` and calling `.listen()` twice throws a `StateError: Stream has already been listened to`.

🔴 **Explanation:** this is [Week 16's Invisible Machinery](Week_16_Firebase_Firestore.md) reduced to its actual mechanism — real Firestore multiplexes one underlying network listener across every local `.snapshots()` subscription on the same query, and delivers each update to all of them, which is exactly what a broadcast `StreamController` does. It's also the identical mechanism as [Week 1b's pub/sub EventBus (T4-3)](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md) and [Week 20's BLoC state stream](../Phase_5_Advanced_Patterns/Week_20_BLoC_Pattern.md) — the same broadcast-stream primitive shows up at every layer of this bootcamp because it's the one Dart-native way to have "many listeners, one source of truth, live updates."

</details>

---

### W16-2 (Medium) — Security rules as a pure, testable function

**Problem:** before deploying a real Firestore security rule, you can test its *logic* as a plain Dart function — this is exactly the boolean expression a rule like `allow write: if request.auth != null && resource.data.userId == request.auth.uid` evaluates.

```dart
bool canWrite({
  required String? requestingUid, // null = not authenticated
  required String docOwnerUid,
}) {
  // TODO: implement the equivalent of:
  // allow write: if request.auth != null && resource.data.userId == request.auth.uid;
}

void main() {
  print(canWrite(requestingUid: 'user123', docOwnerUid: 'user123')); // true — owner writing their own doc
  print(canWrite(requestingUid: 'user123', docOwnerUid: 'user456')); // false — different user's doc
  print(canWrite(requestingUid: null, docOwnerUid: 'user123'));      // false — not signed in
}
```

**Task:** implement it. Then write a **fourth** test case that a naive implementation might get wrong: what if `requestingUid` is an empty string `''` rather than `null` — should that be treated as authenticated or not? Defend your answer.

<details><summary>Solution & Explanation</summary>

```dart
bool canWrite({required String? requestingUid, required String docOwnerUid}) {
  return requestingUid != null && requestingUid == docOwnerUid;
}
```

🔴 **Explanation:** the empty-string case is the actual point of this exercise — `requestingUid == ''` is **not null**, so a careless implementation checking only `requestingUid != null` would treat an empty string as a valid, authenticated identity. In practice, Firebase Auth never hands you an empty-string UID for a real signed-in user, so this scenario shouldn't occur through the normal SDK — but writing security rule logic defensively (verifying `requestingUid.isNotEmpty` too, not just non-null) costs nothing and closes a hole against any malformed or spoofed request. This is the general discipline behind security rules: **write them assuming a hostile, not just a well-behaved, client** — the rule runs server-side specifically because client-side checks can be bypassed entirely by anyone calling the Firestore REST API directly.

</details>

---

### W16-3 (Hard) — Offline write conflict: reproduce the clock-skew bug

**Problem:** two "devices" edit the same note while offline, then both sync. A common (and naive) offline-sync conflict resolution strategy is last-write-wins by timestamp. Simulate it — and find the case where it silently produces the *wrong* result.

```dart
class NoteDoc {
  NoteDoc({required this.content, required this.updatedAt});
  final String content;
  final DateTime updatedAt;
}

NoteDoc resolveConflict(NoteDoc local, NoteDoc remote) {
  // last-write-wins: whichever has the later timestamp wins
  return local.updatedAt.isAfter(remote.updatedAt) ? local : remote;
}

void main() {
  // Device A's clock is 2 minutes fast (a real, common scenario — device
  // clocks drift, especially on flaky NTP sync or manual clock changes)
  final deviceA_edit = NoteDoc(
    content: 'Buy milk',                    // edited FIRST, chronologically
    updatedAt: DateTime(2026, 1, 1, 10, 2),  // but its clock says 10:02 (2 min fast)
  );
  final deviceB_edit = NoteDoc(
    content: 'Buy milk and eggs',            // edited SECOND, chronologically — should win
    updatedAt: DateTime(2026, 1, 1, 10, 1),  // its clock is accurate: 10:01
  );

  final winner = resolveConflict(deviceA_edit, deviceB_edit);
  print('Winner: "${winner.content}"');
}
```

**Task:** run it. Which edit wins? Is that actually the edit that happened later in real time? What does this prove about last-write-wins as a conflict strategy?

<details><summary>Explanation</summary>

Device A's edit ("Buy milk") wins, because `10:02 > 10:01` — but Device B's edit happened *later in real time* and was silently discarded, purely because Device A's clock was running fast.

🔴 **Explanation:** this is exactly the trade-off named in [Week 19's sync-conflict content](Week_19_Project_NotesApp.md) — last-write-wins is simple to implement and works correctly *as long as every device's clock is accurate and synchronized*, an assumption that quietly breaks in the real world (manual clock changes, timezone bugs, delayed NTP sync on a phone that's been offline for days). The user experiences this as "I edited my note and it randomly reverted" — with **no error message**, because nothing failed; the algorithm did exactly what it was told, using bad timestamp data. This is precisely why more sophisticated apps (Notion, Google Docs) use vector clocks, operational transforms, or CRDTs instead of raw wall-clock timestamps — those approaches don't trust any single device's notion of "what time is it" as the source of truth for ordering.

</details>

---

### W16-4 (Bonus — needs a real Firebase project, not DartPad)

**Problem:** wire a `StreamProvider<List<Note>>` to a live Firestore `.snapshots()` query (as shown in [Week 16](Week_16_Firebase_Firestore.md)), then open your app in **two browser windows or two devices** signed in as the same test user, and edit a note in one — watch it update live in the other, with no manual refresh.

**Task:** while both windows are open, turn off your network in one of them, edit a note there, then turn the network back on. Watch what happens to that offline edit once connectivity returns — does it get lost, or does it eventually sync?

This one can't run in DartPad — it needs Firestore's actual offline persistence layer and real network transitions, not a simulation. Do it in a real Flutter project against a real (or emulated) Firebase project.

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means. (These need a real Firebase project or the Firestore emulator to actually run — reason through them even if you can't execute right now.)

---

### 🐛 Bug Hunt — The Listener That Multiplies

```dart
class NotesScreen extends StatefulWidget {
  const NotesScreen({super.key});
  @override
  State<NotesScreen> createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  List<String> _notes = [];

  @override
  Widget build(BuildContext context) {
    FirebaseFirestore.instance.collection('notes').snapshots().listen((snapshot) {
      setState(() => _notes = snapshot.docs.map((d) => d['title'] as String).toList());
    });

    return ListView(children: _notes.map(Text.new).toList());
  }
}
```

Runs fine at first glance — notes appear, real-time updates seem to work. Something's quietly wrong that gets worse the more this screen rebuilds for unrelated reasons (rotating the device, a parent widget's `setState`, anything). What, and why?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `.snapshots().listen(...)` is called **inside `build()`** — this is the exact same category of bug as [Week 9's `AnimationController`-in-`build()` leak](../Phase_2_Core_UI/Week_09b_Animation_Challenges.md#-bug-hunt--the-animation-that-runs-once-and-never-again): every rebuild creates a **brand new** stream subscription to the same Firestore query, and the old subscription is never cancelled. After 5 unrelated rebuilds, you have 5 separate listeners all firing `setState` on every single Firestore change — each one redundantly reassigning the exact same `_notes` list, wasting 5x the work per update, and none of them ever get cleaned up. The fix: set up the subscription exactly once, in `initState`, and cancel it in `dispose`:

```dart
class _NotesScreenState extends State<NotesScreen> {
  List<String> _notes = [];
  late final StreamSubscription _subscription;

  @override
  void initState() {
    super.initState();
    _subscription = FirebaseFirestore.instance.collection('notes').snapshots().listen((snapshot) {
      setState(() => _notes = snapshot.docs.map((d) => d['title'] as String).toList());
    });
  }

  @override
  Widget build(BuildContext context) => ListView(children: _notes.map(Text.new).toList());

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
```

**Rule to internalize, now proven twice in this bootcamp: nothing that creates an ongoing subscription — `AnimationController`, `Timer`, `StreamSubscription` — belongs inside `build()`. Ever.**

</details>

---

### 🎭 Two Truths and a Lie — Firestore Offline Behavior

**A.** `.snapshots()` keeps firing new events for as long as the listener is active, until you explicitly cancel it.

**B.** With offline persistence enabled (the default on mobile), calling `.get()` while the device has no network connection immediately throws, because there's no way to fetch fresh data.

**C.** A `.where()` query combining range filters (`>`, `<`) on two *different* fields typically requires a composite index that Firestore will not create automatically — you get a clear error with a console link to create it.

<details><summary>Which one's the lie</summary>

**B is the lie.** With offline persistence enabled, Firestore's SDK maintains a local cache — `.get()` while offline serves data **from that cache** (if any exists for the query) rather than throwing. It only fails if there's genuinely no cached data at all matching the query and no network to fetch it fresh. This offline-cache behavior is precisely what [Week 18's local storage content](Week_18_Local_Storage.md) refers to when discussing Firestore's built-in offline support as an alternative to hand-rolling your own Hive-based cache.

🔴 **Explanation:** C is true and is a genuinely useful thing to know before it surprises you mid-project — Firestore's automatic single-field indexes don't cover compound range queries across multiple fields; you'll hit a `FAILED_PRECONDITION` error with a direct link to auto-generate the needed composite index in the Firebase console, the first time you write such a query.

</details>

---

### 👹 Boss Battle — Optimistic Update With Rollback

**The spec:** build a "toggle favorite" feature where tapping a heart icon updates the UI **instantly** (before Firestore confirms the write) — the classic "optimistic update" pattern for responsiveness — but if the Firestore write actually fails (simulate with a deliberately-broken document path), the UI must roll back to its previous state and show an error, not silently stay in the wrong (optimistic-but-unconfirmed) state forever.

<details><summary>One reasonable solution</summary>

```dart
class FavoriteButton extends StatefulWidget {
  const FavoriteButton({super.key, required this.docId, required this.initialValue});
  final String docId;
  final bool initialValue;
  @override
  State<FavoriteButton> createState() => _FavoriteButtonState();
}

class _FavoriteButtonState extends State<FavoriteButton> {
  late bool _isFavorite = widget.initialValue;

  Future<void> _toggle() async {
    final previousValue = _isFavorite;
    setState(() => _isFavorite = !_isFavorite); // optimistic — update UI FIRST

    try {
      await FirebaseFirestore.instance
          .collection('items')
          .doc(widget.docId)
          .update({'isFavorite': _isFavorite});
    } catch (e) {
      if (!mounted) return;
      setState(() => _isFavorite = previousValue); // roll back on failure
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update — please try again')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(_isFavorite ? Icons.favorite : Icons.favorite_border),
      onPressed: _toggle,
    );
  }
}
```

🔴 **Explanation:** the design decision this exercise is really testing is capturing `previousValue` **before** the optimistic `setState` — without it, there'd be no way to know what to roll back *to* once the failure arrives, since `_isFavorite` has already moved on to the new (wrong, as it turns out) value by the time the `catch` block runs. The `mounted` check before the rollback `setState` is [Week 3's lesson](../Phase_1_Dart_and_Foundations/Week_03b_Lifecycle_Challenges.md#w3-2-medium--reproduce-the-mounted-crash-then-fix-it) applying directly here — the user could easily navigate away from this screen during the `await`, and the failure response would still arrive afterward. This pattern (update local state immediately, reconcile with the source of truth once the network confirms or denies) is genuinely how production apps like Instagram's like-button or Twitter's retweet button feel instant despite going over the network — you're building the real mechanism, not a simplified stand-in for it.

</details>

---

**Next → [Week 17: Authentication](Week_17_Authentication.md) · [Authentication Challenges](Week_17b_Authentication_Challenges.md)**
