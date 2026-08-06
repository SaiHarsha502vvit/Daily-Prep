# Notes App — Project Challenges

### Companion to [Week 19: Project — Notes App](Week_19_Project_NotesApp.md)

---

## How This Works

Notes App is this bootcamp's hardest sync problem by design — its own core content says so. These challenges dig into two real gaps hiding in this project's own Provider Graph, then build the conflict-resolution scenario the project's architecture sets up but doesn't fully solve. Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — "Instant Load" That Isn't, Offline

This project's own `notesStreamProvider`, comments included:

```dart
final notesStreamProvider = StreamProvider.autoDispose<List<Note>>((ref) {
  // Watch local Hive first (instant load)
  // Firestore stream reconciles in background
  final remote = ref.watch(notesRemoteRepoProvider);
  final local = ref.watch(notesLocalRepoProvider);

  return remote.watchNotes().map((firestoreNotes) {
    for (final note in firestoreNotes) {
      final hiveNote = NoteHiveModel(/* map from Note */);
      hiveNote.pendingSync = false;
      local.save(hiveNote);
    }
    return firestoreNotes;
  });
});
```

Open the device with no network connection, cold start the app. The comment promises "instant load" from Hive. What does the user actually see, and for how long?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** trace what this `Stream` actually **emits**, not what the comments claim it does — it's built entirely from `remote.watchNotes().map(...)`. `local` is referenced (`ref.watch(notesLocalRepoProvider)`) but only ever **written to**, inside the `.map()` callback, as a side effect of Firestore data arriving — it is never itself the *source* of any emission this stream produces. With no network, `remote.watchNotes()` (a Firestore real-time listener) never successfully connects and never emits anything — meaning this entire provider stays stuck in its initial `AsyncLoading` state indefinitely, offline, regardless of however much data is already sitting safely in the local Hive box from previous sessions. The comment describes the *intended* architecture; the code implements only half of it. The fix actually needs to merge two sources — local as the instant baseline, remote as the eventual reconciliation:

```dart
final notesStreamProvider = StreamProvider.autoDispose<List<Note>>((ref) async* {
  final local = ref.watch(notesLocalRepoProvider);
  final remote = ref.watch(notesRemoteRepoProvider);

  yield local.watchAll(); // emit whatever's cached, IMMEDIATELY — this is the actual "instant load"

  await for (final firestoreNotes in remote.watchNotes()) {
    for (final note in firestoreNotes) {
      final hiveNote = NoteHiveModel(/* map from Note */)..pendingSync = false;
      await local.save(hiveNote);
    }
    yield firestoreNotes; // THEN emit the reconciled remote data as it arrives
  }
});
```

This is the same category of bug as [the Weather App's `keepAlive()` comment](../Phase_3_State_and_APIs/Week_15b_WeatherApp_Challenges.md#-bug-hunt--the-comment-that-lies-about-what-the-code-does) — a comment describing an architecture the code doesn't fully deliver — but here the gap is a genuinely more consequential one: it's the exact "instant load, real-time reconcile" promise that makes an offline-first notes app usable at all, silently unimplemented.

</details>

---

### 🕵️ Code Review — Why Does Only `createNote` Go Through the Sync Service?

This project's own `NotesActionsNotifier`:

```dart
class NotesActionsNotifier extends Notifier<void> {
  @override
  void build() {}

  NotesSyncService get _sync => ref.read(notesSyncServiceProvider);

  Future<void> createNote({required String title, required String content, List<String> tags = const [], Color color = Colors.transparent}) {
    return _sync.createNote(title: title, content: content, tags: tags);
    // 💬 Reviewer: "this one goes through _sync — good, offline-safe I assume?"
  }

  Future<void> updateNote(String id, {String? title, String? content, List<String>? tags}) {
    return ref.read(notesRemoteRepoProvider).updateNote(id, title: title, content: content, tags: tags);
    // 💬 Reviewer: "...but this one calls the remote repo directly. Is that
    //    intentional, or did we just forget to route it through _sync too?"
  }

  Future<void> deleteNote(String id) {
    return ref.read(notesRemoteRepoProvider).deleteNote(id);
  }

  Future<void> togglePin(String id, bool current) {
    return ref.read(notesRemoteRepoProvider).togglePin(id, current);
  }
}
```

The reviewer's question is genuine, not rhetorical — figure out the actual answer before opening the explanation.

<details><summary>What the reviewer is pointing at, and the fix</summary>

🔴 **Explanation:** `notesRemoteRepoProvider` — visible back in the Provider Graph — is defined as `if (user == null) throw const AuthException('Not signed in')` and wraps `FirebaseFirestore.instance` directly, with no offline queueing logic anywhere near it. Calling `.updateNote()`, `.deleteNote()`, or `.togglePin()` on it **directly**, bypassing `NotesSyncService` entirely, means: creating a note offline works (via `_sync`, which per this week's core content is built specifically to write-local-first and queue remote sync), but **editing, deleting, or pinning an existing note while offline does not** — it goes straight at Firestore and fails (or throws, depending on how Firestore's SDK surfaces a failed write attempt in that exact method). This is a genuine, easy-to-miss inconsistency: three of four mutation methods silently skip the offline-safety the fourth one has. The fix routes all four through the same sync service:

```dart
Future<void> updateNote(String id, {String? title, String? content, List<String>? tags}) {
  return _sync.updateNote(id, title: title, content: content, tags: tags);
}
Future<void> deleteNote(String id) => _sync.deleteNote(id);
Future<void> togglePin(String id, bool current) => _sync.togglePin(id, current);
```

(Assuming `NotesSyncService` is extended to expose these three methods with the same local-write-then-queue-remote-sync pattern `createNote` already uses.) The lesson worth taking from this Code Review format specifically: **a reviewer asking "is that intentional?" is often the single most valuable comment in a real PR** — it doesn't accuse, it makes you actually trace through and justify the inconsistency, which is exactly how this one gets caught before it ships.

</details>

---

### 🎭 Two Truths and a Lie — This Project's Derived and Guarded Providers

**A.** `allTagsProvider` recomputes its tag list automatically every time `notesStreamProvider` emits new data — you never need to manually call anything to refresh it after adding a tag to a note.

**B.** `notesRemoteRepoProvider` throwing `AuthException('Not signed in')` when `user == null` means any widget watching it crashes with an unhandled exception if the user is signed out.

**C.** `connectivityProvider` being a `StreamProvider<bool>` means any widget can `ref.watch(connectivityProvider)` to reactively show an "Offline" banner the instant the device loses network — no polling required.

<details><summary>Which one's the lie</summary>

**B is the lie.** A provider's body throwing doesn't produce an "unhandled exception" for a widget using Riverpod's standard `AsyncValue`-returning provider types — `Provider<T>` here specifically does surface the throw as an error the *first time* something tries to read it, but any consumer using `ref.watch(notesRemoteRepoProvider)` inside something that ultimately flows through an `AsyncValue` (or is itself guarded by checking `currentUserProvider` first, as [Week 17's three-state router](../Phase_4_Firebase_and_Storage/Week_17b_Authentication_Challenges.md#-boss-battle--a-three-state-router-guest--incomplete--ready) does) would see that as a catchable error state, not a raw crash — assuming the surrounding code actually checks auth state *before* reaching for this provider, which is precisely why that three-state router pattern exists: to prevent code from ever reaching a signed-out-throws-on-access provider in the first place.

🔴 **Explanation:** A and C are both true, and both are the direct payoff of Riverpod's dependency-graph model from [Week 13's core content](../Phase_3_State_and_APIs/Week_13_Riverpod.md) — `allTagsProvider`'s `ref.watch(notesStreamProvider)` means it automatically re-runs whenever that stream emits, with zero manual "refresh the tags" call anywhere in the app. `connectivityProvider` wrapping `Connectivity().onConnectivityChanged` as a genuine `Stream` means Riverpod's normal reactive rebuild machinery handles the "show an offline banner" UI reactively, the same mechanism as any other `StreamProvider` in this app.

</details>

---

### 🏗️ Build It Blind — Pinned Notes Always Float to the Top

No starter code. Spec only:

> Regardless of whatever sort order or tag filter is active (via `selectedTagProvider`), pinned notes must always appear before unpinned notes in the list — sorted among themselves by whatever the active sort is, and unpinned notes sorted the same way below them. Design this as a derived provider, integrating with `notesStreamProvider` and `selectedTagProvider` without modifying either of them.

<details><summary>One reasonable solution</summary>

```dart
final displayedNotesProvider = Provider<List<Note>>((ref) {
  final notes = ref.watch(notesStreamProvider).valueOrNull ?? [];
  final tag = ref.watch(selectedTagProvider);

  final filtered = tag == null ? notes : notes.where((n) => n.tags.contains(tag)).toList();

  final pinned = filtered.where((n) => n.isPinned).toList()
    ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
  final unpinned = filtered.where((n) => !n.isPinned).toList()
    ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

  return [...pinned, ...unpinned];
});
```

🔴 **Explanation:** this is another `Provider` **deriving** from another provider — same shape as `allTagsProvider` from the Two Truths and a Lie above, and the same "single pass, derive, don't mutate the source" discipline from [Week 12's selective-rebuild challenges](../Phase_3_State_and_APIs/Week_12b_State_Management_Challenges.md). The design decision worth having made deliberately: this provider reads `notesStreamProvider` and `selectedTagProvider` and combines them **without modifying either** — `notesStreamProvider` stays the single source of raw synced data, `selectedTagProvider` stays a simple filter flag, and `displayedNotesProvider` is purely a view computed from both, which is exactly the kind of layering that keeps a provider graph like this project's from turning into a tangle where every provider both reads and writes several others.

</details>

---

### 👹 Boss Battle — The Actual Conflict This Project Warns You About

**The spec:** this week's own core content is titled "Why Notes Is the Hardest Sync Problem" — build the scenario it's talking about. The same note gets edited on two devices while both are offline; both eventually reconnect and both try to sync. Implement a resolution strategy in `NotesSyncService` and justify your choice: last-write-wins (simplest, silently discards one edit), or a merge strategy (harder, preserves both edits somehow) — and explain concretely what a user experiences under your chosen strategy when this actually happens to them.

<details><summary>One reasonable solution — last-write-wins, with the honest trade-off stated</summary>

```dart
class NotesSyncService {
  NotesSyncService({required this.local, required this.remote});
  final NotesLocalRepository local;
  final NotesRepository remote;

  Future<void> syncPendingNotes() async {
    final pending = await local.getPendingSync();

    for (final localNote in pending) {
      final remoteNote = await remote.getNote(localNote.id);

      if (remoteNote != null && remoteNote.updatedAt.isAfter(localNote.updatedAt)) {
        // The remote copy is NEWER than what this device edited offline —
        // last-write-wins means the remote edit survives, this device's
        // offline edit is DISCARDED. This is the trade-off, made explicit.
        await local.save(remoteNote.toHiveModel()..pendingSync = false);
      } else {
        // This device's edit is newer (or the note doesn't exist remotely yet) — push it.
        await remote.updateNote(localNote.id, title: localNote.title, content: localNote.content);
        await local.markSynced(localNote.id);
      }
    }
  }
}
```

🔴 **Explanation:** last-write-wins is genuinely the simplest correct-enough strategy for a personal notes app (versus, say, a real-time collaborative document, where [this week's own core content on CRDTs and operational transforms](Week_19_Project_NotesApp.md) becomes necessary) — and the honest cost is real and worth stating plainly rather than glossing over: if you edit a note offline on your phone, and separately edit the *same* note offline on your tablet, whichever device happens to sync **second** silently overwrites the first device's edit with no merge, no warning, and no way to recover the lost version short of Firestore's own document history (if enabled) or a manual "keep both as separate notes" conflict-detection you'd have to build on top of this. A merge strategy (diffing text content, presenting both versions to the user for manual resolution) is strictly better UX but meaningfully more implementation work — recognizing that trade-off, and being able to articulate it, is the actual point of this Boss Battle, not just producing working sync code.

</details>

---

**Next → [Week 20: BLoC Pattern](../Phase_5_Advanced_Patterns/Week_20_BLoC_Pattern.md)**
