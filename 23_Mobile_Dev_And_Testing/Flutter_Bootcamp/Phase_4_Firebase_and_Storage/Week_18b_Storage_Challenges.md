# Local Storage Challenges

### Companion to [Week 18: Local Storage](Week_18_Local_Storage.md)

---

## How This Works

W18-1 and W18-2 are fully runnable in [DartPad](https://dartpad.dev) — the sync-queue pattern and the decision matrix are both about reasoning and mechanism, not a specific package. W18-3 and W18-4 need `hive` and `sqflite` respectively, which require a real Flutter project on a device or emulator — flagged clearly.

---

### W18-1 (Medium) — Build the offline-first sync queue pattern

**Problem:** the core mechanism behind every offline-first app — write locally *instantly*, queue the change for sync, replay the queue once "online." Simulate it in pure Dart (a real app would swap the in-memory `List` for Hive, and the fake `syncToServer` for a real API call — the pattern is identical either way).

```dart
class PendingChange {
  PendingChange(this.noteId, this.content);
  final String noteId;
  final String content;
}

class OfflineFirstNotes {
  final Map<String, String> _local = {};
  final List<PendingChange> _pendingQueue = [];
  bool isOnline = false;

  void write(String noteId, String content) {
    _local[noteId] = content; // instant — never blocks on network
    _pendingQueue.add(PendingChange(noteId, content));
    if (isOnline) _flushQueue();
  }

  Future<void> _flushQueue() async {
    // TODO: send each pending change to the "server", in order,
    // and remove it from the queue only after it succeeds
  }

  Future<void> _fakeServerSync(PendingChange change) async {
    await Future.delayed(const Duration(milliseconds: 100));
    debugPrint('Synced "${change.content}" for ${change.noteId}');
  }

  void goOnline() {
    isOnline = true;
    _flushQueue();
  }
}

void main() async {
  final notes = OfflineFirstNotes();
  notes.write('note1', 'Buy milk');        // instant, queued (offline)
  notes.write('note1', 'Buy milk and eggs'); // instant, queued (offline)
  print('Local read: ${notes._local['note1']}'); // always instant, always current

  notes.goOnline(); // now the queue should flush, in order
  await Future.delayed(const Duration(seconds: 1));
}
```

**Task:** implement `_flushQueue()`. Then answer: the queue has two entries for the same `note1` (an edit, then another edit). Should `_flushQueue` sync both, or is there a smarter approach that collapses them into one sync? What's the trade-off?

<details><summary>Solution & Explanation</summary>

```dart
Future<void> _flushQueue() async {
  while (_pendingQueue.isNotEmpty) {
    final change = _pendingQueue.first;
    await _fakeServerSync(change);
    _pendingQueue.removeAt(0);
  }
}
```

🔴 **Explanation:** the local read (`notes._local['note1']`) is instant and always reflects the latest write, regardless of network state — that's the entire point of offline-first: **the UI never waits on the network**, it reads from the local cache which is always kept current, and the network sync happens as a background concern the UI doesn't block on. On the two-edits question: syncing both is simpler and correct, but wasteful — a smarter queue could deduplicate by `noteId`, keeping only the *latest* pending change per note and discarding superseded ones before they're ever sent. The trade-off: deduplication reduces network calls but adds complexity (you now need to reason about "is this queued change still the latest, or has it been superseded") — for a note-taking app with occasional edits, the naive full-replay is usually fine; for a chat app queuing hundreds of rapid state changes, deduplication matters a lot more.

</details>

---

### W18-2 (Easy) — Storage engine decision matrix

**Problem:** for each scenario, pick `SharedPreferences`, `Hive`, or `sqflite (SQLite)` and justify in one sentence, **before** checking the answer:

1. Remembering whether the user has completed onboarding (one boolean, checked once at app launch)
2. A read-later app caching 50,000 saved articles, needing to search by title substring
3. Storing a list of typed `Expense` Dart objects (amount, category, date) with zero manual JSON serialization code
4. An orders app where each order has multiple line items, and you need "all orders over $50 that include a specific product" style queries

<details><summary>Answers</summary>

1. **SharedPreferences.** A single boolean, read once, no queries, no relationships — the simplest possible storage need, and reaching for anything heavier is unjustified overhead.
2. **sqflite.** "Search by title substring" across 50,000 rows is a `WHERE title LIKE '%...%'` query — exactly what a relational engine with indexing is for. Hive has no query language; you'd be manually scanning 50,000 in-memory objects on every keystroke of a search box.
3. **Hive.** Typed Dart objects with a generated `TypeAdapter` (via `hive_generator`) serialize with zero manual `toJson`/`fromJson` boilerplate — this is Hive's actual sweet spot, from [Week 18's content](Week_18_Local_Storage.md).
4. **sqflite.** "Orders with line items" is inherently relational (a one-to-many relationship), and "orders over $50 that include product X" is a join-and-filter query — precisely what SQL is built for. Modeling this in Hive means manually maintaining and querying nested structures yourself.

🔴 **Explanation:** the actual skill here isn't memorizing "Hive is for X, SQLite is for Y" — it's recognizing the *shape* of the data access pattern. **Key-value, read-once-or-rarely** → SharedPreferences. **Typed objects, simple lookups by key, no complex queries** → Hive. **Relationships between entities, or queries filtering/joining across many records** → SQLite. Getting #2 wrong (choosing Hive for the search-heavy article cache) is the single most common real mistake — Hive feels easier to set up, but "easier to set up" and "correct engine for this access pattern" are different questions.

</details>

---

### W18-3 (Hard — needs a real Flutter project with `hive`, not DartPad)

**Problem:** `Box.watch()` gives you a reactive stream of changes to a Hive box — build a notes screen where the `ListView` updates automatically whenever the box changes, from **any** source (including a background isolate writing to the same box), without you manually calling `setState()` after every write.

```dart
final box = await Hive.openBox<String>('notes');

StreamBuilder<BoxEvent>(
  stream: box.watch(),
  builder: (context, snapshot) {
    // TODO: rebuild from box.values on every event
    return ListView(children: [for (final note in box.values) Text(note)]);
  },
);
```

**Task:** run this in a real Flutter project. Deliberately try to `box.put()` a value **before** calling `await Hive.openBox()` and read the exact exception. Then explain why Hive requires the box to be explicitly opened (an async operation) before any read/write — what is `openBox()` actually doing under the hood that a plain in-memory `Map` wouldn't need to do?

<details><summary>Explanation</summary>

🔴 **Explanation:** `openBox()` reads the box's `.hive` file from disk (or creates it if it doesn't exist) and deserializes its contents into memory — that's genuinely disk I/O, which is why it's `async` and must complete before the box is usable. Writing to a box that hasn't been opened throws `HiveError: Box not found. Did you forget to call Hive.openBox()?` — a clear, deliberate guard rather than a silent no-op, because writing to a not-yet-loaded box would either lose data or corrupt whatever's on disk once the real open completes. This is the exact same "resource must be acquired before use" discipline as `late final` fields and controller initialization from [Week 3's lifecycle content](../Phase_1_Dart_and_Foundations/Week_03_Widget_Lifecycle.md) — the difference is Hive's resource lives on disk, not just in the widget's memory, so the acquisition step genuinely takes real time and can genuinely fail (corrupted file, no disk space).

</details>

---

### W18-4 (Bonus — needs `sqflite`, but the migration logic itself is pure and testable)

**Problem:** write a pure function generating the SQL for a schema migration — this part **is** DartPad-testable, since it's just string generation, even though actually running it needs a real SQLite database.

```dart
/// Generates the SQL statements needed to migrate from [oldVersion] to [newVersion].
List<String> migrationSql(int oldVersion, int newVersion) {
  final statements = <String>[];
  if (oldVersion < 2) {
    statements.add('ALTER TABLE notes ADD COLUMN tag TEXT');
  }
  if (oldVersion < 3) {
    statements.add('ALTER TABLE notes ADD COLUMN isPinned INTEGER DEFAULT 0');
  }
  return statements;
}

void main() {
  print(migrationSql(1, 3)); // should include BOTH migrations, in order
  print(migrationSql(2, 3)); // should include ONLY the v3 migration
  print(migrationSql(3, 3)); // should be empty — already current
}
```

**Task:** run it, verify the three cases behave as commented. Then explain: why does each `if` check against `oldVersion`, cumulatively, rather than a single `switch (oldVersion)` picking one migration path? What real-world scenario does the cumulative approach handle correctly that a single-jump approach wouldn't?

<details><summary>Explanation</summary>

🔴 **Explanation:** a user who hasn't opened the app in months might be sitting on version 1 while the app has since shipped versions 2 and 3 — the cumulative `if (oldVersion < N)` checks ensure that user's device runs **every** migration between their old version and the current one, in order, when they finally reopen the app. A `switch` picking a single migration path for "version 1" would only know how to jump 1→2, missing the 2→3 step entirely unless someone remembered to write a separate 1→3 case — and that combinatorial explosion (every possible old-version-to-new-version pair) is exactly what the cumulative `if` chain avoids. This is the real mechanism behind `sqflite`'s `onUpgrade: (db, oldVersion, newVersion) => ...` callback, and it's worth internalizing before you're the one debugging why a subset of your users' databases are missing a column.

</details>

---

**Next → [Week 19: Project — Notes App](Week_19_Project_NotesApp.md)**
