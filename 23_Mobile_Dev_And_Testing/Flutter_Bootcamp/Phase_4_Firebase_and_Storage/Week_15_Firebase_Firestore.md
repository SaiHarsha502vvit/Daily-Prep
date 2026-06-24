# Week 15 — Firebase & Cloud Firestore
### Real-time database, offline support, security rules — the complete picture

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — Firestore data model, CRUD, real-time streams, security rules, Riverpod integration
> - 🎨 **Designer** — optimistic updates, real-time visual feedback, offline indicator
> - 🧪 **Tester** — Firestore emulator, testing rules, testing stream providers

---

## What Firebase and Firestore Are

### The Backstory — Why Firebase Exists and Why It Dominates Mobile

Building a mobile backend has always been hard. You need:
- User authentication (sign in, password reset, OAuth with Google/Apple)
- A database that syncs to mobile devices in real time
- File storage for images and documents
- Push notifications
- Analytics and crash reporting
- A server to host all of this

Hiring a backend developer and maintaining all of this infrastructure adds months and significant cost to every app. In 2011, James Tamplin and Andrew Lee built **Firebase** to solve this — a realtime database as a service, where mobile apps could write directly without a server in between.

**Firebase was acquired by Google in 2014** — one of Google's most strategic acquisitions for mobile developers. Google rapidly expanded it from just a database into a full app development platform.

**The Firestore rewrite (2017):** The original Firebase Realtime Database had a fundamental design problem — it stored everything as one giant JSON tree. Querying was limited; you couldn't filter on multiple fields. For large apps, performance degraded as the JSON tree grew. Google rebuilt the database from scratch as **Cloud Firestore** — a document/collection model with richer querying, better scaling, and multi-region support. The original Realtime Database still exists (and is still better for specific use cases like live presence/typing indicators), but Firestore is the default for new apps.

**The NoSQL design philosophy:** Firestore is a NoSQL database — no schemas, no joins, no SQL. This is intentional for mobile. SQL databases need a server-side query layer; Firestore's document model lets mobile clients query directly with security rules enforcing what each user can read. NoSQL also allows schema evolution without migrations — you can add a new field to documents without updating every existing document.

**The offline-first architecture:** Firestore's real innovation for mobile is its offline persistence layer. When you attach a listener to a Firestore query, it:
1. Returns cached data immediately (zero latency)
2. Fetches fresh data from the server in the background
3. Updates your UI when fresh data arrives
4. Queues your writes locally if offline and syncs them when connection returns

This is the correct architecture for mobile apps — users move between WiFi, LTE, and offline. An app that crashes when offline is a bad app.

---

> 📄 **Firebase Docs:**
> *"Cloud Firestore is a flexible, scalable NoSQL cloud database to store and sync data for client- and server-side development. It keeps your data in sync across client apps through realtime listeners and offers offline support so you can build responsive apps that work regardless of network latency or Internet connectivity."*

Firebase is Google's Backend-as-a-Service. For Flutter, the core products are:
- **Cloud Firestore** — NoSQL real-time database (this week)
- **Firebase Auth** — user authentication (Week 16)
- **Firebase Storage** — file storage for images/files (Week 17)
- **Cloud Functions** — serverless backend logic

The key benefit: **no server to write**. Your Flutter app talks directly to Firebase. Firebase handles the API, scaling, and infrastructure. You focus on your app.

---

## The Invisible Machinery — How Firestore's Real-Time Connection Actually Works

When you write `collection.snapshots().listen(...)` in Flutter, changes appear on your screen within milliseconds — even though your phone didn't poll the server. No repeated `dio.get()` calls. No timer checking every second. How?

---

### The Problem: HTTP Is Request-Response Only

Standard HTTP — the protocol you use for REST APIs — is **one-directional in initiation**. Your phone asks. The server answers. That's it. The server cannot spontaneously push data to your phone; it can only respond when asked.

For a chat app, this creates a problem. User A sends a message. User B's phone needs to know immediately. But User B's phone hasn't made a request.

Three solutions were invented to work around HTTP's limitations:

**Polling (1995–2005, the naïve approach):**
```
Phone: "Any new messages?"  → Server: "No"
[wait 5 seconds]
Phone: "Any new messages?"  → Server: "No"
[wait 5 seconds]
Phone: "Any new messages?"  → Server: "Yes! Here's 3 messages"
```
Works, but: 95% of requests return nothing. Wastes battery, bandwidth, and server capacity. A chat app with 100,000 users polling every 5 seconds = 20,000 requests/second to your server, mostly wasted.

**Long Polling (2005–2011, a smarter hack):**
```
Phone: "Any new messages? I'll wait."
Server: [holds connection open — doesn't respond yet]
[30 seconds later, a message arrives]
Server: "Here's the message!" → connection closes
Phone: "Any new messages? I'll wait." [immediately reconnects]
```
Better — the connection stays open until data arrives. But still half-duplex (only server → client), and the reconnect on every message adds overhead.

**WebSockets (2011, the real solution):**

A WebSocket is a **persistent, bidirectional TCP connection** that stays open indefinitely. Both sides can send data at any time without the overhead of establishing a new connection.

```
TCP handshake → TLS handshake → HTTP/1.1 "Upgrade: websocket" request
                                 Server: "101 Switching Protocols"
                                 [connection upgrades to WebSocket protocol]

Now both sides can send freely:

Phone → Server: "Subscribe to notes/user_123/..."
Server → Phone: [whenever notes change] "Here's the new note data"
Server → Phone: [whenever notes change] "Here's the updated note data"
Phone → Server: "Add new note {title: 'hello'}"
Server → Phone: "Confirmed, here's the stored document"
```

The connection stays open the entire time the app is in the foreground. No reconnection overhead. Data arrives within milliseconds of the server having it.

**How Firestore uses WebSockets:**

When your Dart code calls `.snapshots().listen(...)`, the FlutterFire SDK:
1. Opens a WebSocket connection to `firestore.googleapis.com`
2. Sends a "listen" message specifying the collection/query you're watching
3. The WebSocket stays open
4. When any document matching your query changes, Firestore's servers immediately push a message down the open WebSocket
5. The SDK receives it, converts it to a `QuerySnapshot`, and calls your `listen` callback
6. Your Flutter UI rebuilds

This is why Firestore feels "real-time" — there's a persistent pipe between your app and Google's servers, and data flows down that pipe the instant it changes.

---

### What Happens When the Phone Goes Offline

The offline behavior is even more interesting. Firestore maintains a **local SQLite database** (called the Persistence layer) on your device. Every document you've ever read is stored there.

```
ONLINE FLOW:
Read  → Check SQLite cache (instant) → Return cached data → Fetch from server → Update cache → Notify listener
Write → Write to SQLite immediately → Return success to your app → Sync to server in background

OFFLINE FLOW:
Read  → Check SQLite cache (instant) → Return cached data (no server call)
Write → Write to SQLite immediately → Return success to your app → Queue write for when online
       When online again → Flush queue → Send all queued writes to server → Resolve conflicts
```

From your Flutter code's perspective, reads and writes always "succeed" immediately. The network is an implementation detail. This is the **offline-first architecture** — design for offline, let online be a bonus that syncs.

This is why your `await notesCollection.add(note)` returns instantly even with poor mobile signal. The document is written to the local cache. Firestore handles server sync when connectivity returns.

---

### The Cloud Infrastructure Behind Firestore

When your phone writes to Firestore, where does the data actually go?

```
Your phone's Flutter app
    │
    │ WebSocket (TLS encrypted, over TCP)
    ▼
Google's nearest data center (Mumbai for India, Singapore for SEA)
  │
  │ "Edge server" — receives your connection, routes to the right region
  ▼
Firestore's server cluster
  │
  │ Distributed database across multiple machines
  │ Data is replicated to 3+ data centers simultaneously
  │ Even if one Google data center burns down, your data is safe
  ▼
Persistent storage (Google's Spanner — a globally distributed relational database)
  │
  │ Spanner writes are synchronously replicated across regions
  │ This is why Firestore write latency is slightly higher than local SQLite
  ▼
Firestore's change notification system
  │
  │ When a document changes, Firestore fans out notifications to all
  │ WebSocket connections that are "listening" to that document
  ▼
All subscribed clients receive the update within ~100-300ms globally
```

Google operates its own private fiber network connecting all these data centers. The "internet" between them is not the public internet — it's Google's internal, high-speed, low-latency fiber. This is why Google Cloud services are fast even for global apps.

---

### Firestore vs Traditional SQL Database — Why This Architecture

If you've worked with MySQL or PostgreSQL, Firestore looks strange. No tables, no JOINs, no SQL. Why?

**The traditional SQL server model (1970s–2000s):**
```
App → SQL query → Database server → returns rows
```
The database has one machine (or a small cluster). It can handle ~10,000 queries/second. For apps with millions of users this falls over. Scaling SQL horizontally (adding more machines) is hard because SQL databases need a "single source of truth" for each row — you can't easily split a table across 1000 machines.

**The NoSQL movement (2009–2015):**

Google (BigTable, 2006), Amazon (DynamoDB, 2007), and Facebook (Cassandra, 2008) all hit the SQL scaling wall and independently invented **NoSQL** — data models that could be horizontally sharded across thousands of machines.

Key trade-off: NoSQL gave up SQL's flexibility (no arbitrary joins, no complex queries) in exchange for horizontal scalability. You design your data around how you'll query it (denormalize), instead of querying any way you like (normalize).

**Firestore is NoSQL for mobile developers:**
- Documents (like JSON objects) instead of rows
- No schema — add fields whenever you want
- No migrations — old documents with missing fields just return `null`
- Designed for simple queries that scale to billions of documents
- Offline-first for mobile (SQL databases have no concept of offline sync)

**When Firestore is wrong and SQL is right:**
- Complex relational queries (expenses joined with users joined with categories)
- Reporting / analytics (SUM, GROUP BY, window functions)
- Transactions with complex invariants
- Data that doesn't map to a document shape

For your Notes app and Chat app: Firestore is right. For a financial reporting dashboard: use PostgreSQL.

---

## Firestore Data Model

> 📄 **Firebase Docs:**
> *"Cloud Firestore stores data as documents, which are stored in collections. Documents can contain subcollections, creating a hierarchical data structure. Collections and documents are created implicitly in Cloud Firestore — simply assign data to a document within a collection."*

```
Firestore
│
├── users/                          ← collection
│   ├── uid_abc123/                 ← document (a user)
│   │   ├── name: "Harsha"
│   │   ├── email: "h@g.com"
│   │   └── notes/                 ← sub-collection (only this user's notes)
│   │       ├── note_xyz/           ← document (a note)
│   │       │   ├── title: "Sprint goals"
│   │       │   ├── content: "..."
│   │       │   ├── tags: ["work", "flutter"]
│   │       │   ├── createdAt: Timestamp
│   │       │   └── isPinned: false
│   │       └── note_abc/
│   │           └── ...
│   └── uid_def456/
│       └── notes/ ...
│
└── public_templates/              ← another top-level collection
    └── template_xyz/ ...
```

Firestore is **NOT a relational database**. There are no JOINs, no foreign keys. If you think in tables, you'll struggle. Think instead in terms of: "What data does this screen need in one read?"

**Key concepts:**
- **Document** — like a JSON object with a maximum size of 1 MB
- **Collection** — a group of documents (like a folder)
- **Sub-collection** — a collection inside a document (can be infinitely nested)
- **`DocumentReference`** — a pointer to a specific document
- **`CollectionReference`** — a pointer to a collection
- **`Query`** — filters + ordering on a collection
- **`Timestamp`** — Firestore's native date type (use for `createdAt`, `updatedAt`)

---

## 1. Setup

```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Configure Firebase for your Flutter app
# This creates google-services.json (Android) and GoogleService-Info.plist (iOS)
flutterfire configure
```

```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^3.0.0
  cloud_firestore: ^5.0.0
  firebase_auth: ^5.0.0
```

```dart
// lib/main.dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';   // generated by flutterfire configure

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const ProviderScope(child: App()));
}
```

---

## 2. The `FirebaseFirestore` Instance

```dart
// Get the instance — singleton, same instance everywhere
final db = FirebaseFirestore.instance;

// Reference a collection
final notesRef = db.collection('users').doc(userId).collection('notes');

// Reference a specific document
final noteRef = db.collection('users').doc(userId).collection('notes').doc(noteId);

// DocumentReference has a built-in .id field — use it as your document ID
final newNoteRef = db.collection('users').doc(userId).collection('notes').doc();
print(newNoteRef.id);  // a new auto-generated Firestore ID (e.g., "Kx8yM3qR...")
```

---

## 3. The Note Model — `fromFirestore`/`toFirestore`

```dart
// lib/features/notes/domain/note.dart

class Note {
  final String id;
  final String title;
  final String content;
  final List<String> tags;
  final bool isPinned;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Note({
    required this.id,
    required this.title,
    required this.content,
    required this.tags,
    required this.isPinned,
    required this.createdAt,
    required this.updatedAt,
  });

  // Convert FROM Firestore document to Dart object
  factory Note.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data()!;
    return Note(
      id: doc.id,                    // ← the document ID, not in the data map
      title: data['title'] as String? ?? '',
      content: data['content'] as String? ?? '',
      tags: List<String>.from(data['tags'] as List? ?? []),
      isPinned: data['isPinned'] as bool? ?? false,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      updatedAt: (data['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  // Convert TO Firestore document (never includes the ID — it's the document key)
  Map<String, dynamic> toFirestore() => {
    'title': title,
    'content': content,
    'tags': tags,
    'isPinned': isPinned,
    'createdAt': Timestamp.fromDate(createdAt),
    'updatedAt': Timestamp.fromDate(updatedAt),
  };

  Note copyWith({
    String? title,
    String? content,
    List<String>? tags,
    bool? isPinned,
  }) {
    return Note(
      id: id,
      title: title ?? this.title,
      content: content ?? this.content,
      tags: tags ?? this.tags,
      isPinned: isPinned ?? this.isPinned,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
```

**Rule:** Always use `Timestamp.fromDate()` when writing dates to Firestore and `.toDate()` when reading. Never store dates as ISO strings — Firestore's `Timestamp` type enables range queries (`createdAt >= someDate`).

---

## 4. The Notes Repository — Full CRUD + Real-Time Stream

```dart
// lib/features/notes/data/notes_repository.dart

class NotesRepository {
  final FirebaseFirestore _db;
  final String _userId;

  NotesRepository({required FirebaseFirestore db, required String userId})
      : _db = db,
        _userId = userId;

  CollectionReference<Map<String, dynamic>> get _notesRef =>
      _db.collection('users').doc(_userId).collection('notes');

  // ──────────────────────────────────────────────
  // REAL-TIME STREAM — widgets watch this
  // ──────────────────────────────────────────────

  // Returns a Stream — emits a new List<Note> every time ANY note changes
  Stream<List<Note>> watchNotes({String? tag}) {
    Query<Map<String, dynamic>> query = _notesRef.orderBy('updatedAt', descending: true);

    if (tag != null) {
      // array-contains: finds documents where 'tags' array contains this value
      query = query.where('tags', arrayContains: tag);
    }

    return query.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        // Each doc is a DocumentSnapshot<Map<String, dynamic>>
        return Note.fromFirestore(doc);
      }).toList();
    });
  }

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────

  Future<String> createNote({
    required String title,
    required String content,
    List<String> tags = const [],
  }) async {
    final now = DateTime.now();
    final docRef = _notesRef.doc();    // auto-generated ID

    await docRef.set({
      'title': title,
      'content': content,
      'tags': tags,
      'isPinned': false,
      'createdAt': Timestamp.fromDate(now),
      'updatedAt': Timestamp.fromDate(now),
    });

    return docRef.id;   // return the new note's ID
  }

  // ──────────────────────────────────────────────
  // READ (single)
  // ──────────────────────────────────────────────

  Future<Note?> getNote(String noteId) async {
    final doc = await _notesRef.doc(noteId).get();
    if (!doc.exists) return null;
    return Note.fromFirestore(doc);
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────

  Future<void> updateNote(String noteId, {
    String? title,
    String? content,
    List<String>? tags,
  }) async {
    // FieldValue.serverTimestamp() — Firestore sets this on the server, not the client
    // Avoids clock skew issues between client and server
    final updates = <String, dynamic>{
      'updatedAt': FieldValue.serverTimestamp(),
      if (title != null) 'title': title,
      if (content != null) 'content': content,
      if (tags != null) 'tags': tags,
    };
    await _notesRef.doc(noteId).update(updates);
  }

  Future<void> togglePin(String noteId, bool currentPinStatus) async {
    await _notesRef.doc(noteId).update({
      'isPinned': !currentPinStatus,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  // ──────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────

  Future<void> deleteNote(String noteId) async {
    await _notesRef.doc(noteId).delete();
  }

  // ──────────────────────────────────────────────
  // BATCH — multiple writes atomically
  // ──────────────────────────────────────────────

  Future<void> deleteMultipleNotes(List<String> noteIds) async {
    // WriteBatch: up to 500 operations, all succeed or all fail
    final batch = _db.batch();
    for (final id in noteIds) {
      batch.delete(_notesRef.doc(id));
    }
    await batch.commit();
  }

  Future<void> archiveMultipleNotes(List<String> noteIds) async {
    final batch = _db.batch();
    final now = FieldValue.serverTimestamp();
    for (final id in noteIds) {
      batch.update(_notesRef.doc(id), {'isArchived': true, 'updatedAt': now});
    }
    await batch.commit();
  }
}
```

🧑‍💻 **Developer:** `update()` vs `set()`:
- `.update({...})` — only updates the fields you specify. Other fields are unchanged. Fails if the document doesn't exist.
- `.set({...})` — replaces the ENTIRE document. Pass `SetOptions(merge: true)` to merge instead.
- `.set({...}, SetOptions(merge: true))` — merges: updates existing fields, creates new ones, leaves unspecified fields unchanged. Doesn't fail if doc doesn't exist (creates it).

---

## 5. Riverpod Integration — Real-Time Notes

```dart
// lib/features/notes/presentation/providers/notes_providers.dart

// The repository — depends on auth (covered in Week 16)
final notesRepositoryProvider = Provider<NotesRepository>((ref) {
  return NotesRepository(
    db: FirebaseFirestore.instance,
    userId: ref.watch(currentUserProvider)!.uid,
  );
});

// Selected tag filter
final selectedTagProvider = StateProvider<String?>((ref) => null);

// Real-time notes stream — updates whenever data changes in Firestore
final notesStreamProvider = StreamProvider.autoDispose<List<Note>>((ref) {
  final repo = ref.watch(notesRepositoryProvider);
  final tag = ref.watch(selectedTagProvider);
  return repo.watchNotes(tag: tag);
});

// All unique tags across all notes (derived from the stream)
final allTagsProvider = Provider<AsyncValue<List<String>>>((ref) {
  return ref.watch(notesStreamProvider).whenData((notes) {
    final tags = notes.expand((n) => n.tags).toSet().toList()..sort();
    return tags;
  });
});

// Notifier for write operations (create, update, delete)
class NotesActionsNotifier extends Notifier<void> {
  @override
  void build() {}   // no state to initialize

  Future<String> createNote({required String title, required String content, List<String> tags = const []}) {
    return ref.read(notesRepositoryProvider).createNote(title: title, content: content, tags: tags);
  }

  Future<void> updateNote(String id, {String? title, String? content, List<String>? tags}) {
    return ref.read(notesRepositoryProvider).updateNote(id, title: title, content: content, tags: tags);
  }

  Future<void> deleteNote(String id) {
    return ref.read(notesRepositoryProvider).deleteNote(id);
  }

  Future<void> togglePin(String id, bool current) {
    return ref.read(notesRepositoryProvider).togglePin(id, current);
  }
}

final notesActionsProvider = NotifierProvider<NotesActionsNotifier, void>(NotesActionsNotifier.new);
```

```dart
// Notes list screen
class NotesScreen extends ConsumerWidget {
  const NotesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notesAsync = ref.watch(notesStreamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const NoteEditorScreen()),
            ),
          ),
        ],
      ),
      body: notesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(message: e.toString()),
        data: (notes) {
          if (notes.isEmpty) return const _EmptyNotes();

          // Separate pinned from regular
          final pinned = notes.where((n) => n.isPinned).toList();
          final regular = notes.where((n) => !n.isPinned).toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (pinned.isNotEmpty) ...[
                const _SectionHeader(title: 'PINNED'),
                ...pinned.map((note) => _NoteCard(note: note)),
                const _SectionHeader(title: 'OTHERS'),
              ],
              ...regular.map((note) => _NoteCard(note: note)),
            ],
          );
        },
      ),
    );
  }
}
```

🎨 **Designer:** Real-time updates from Firestore mean the list changes automatically when data changes — no pull-to-refresh needed. Design considerations:
- A deleted note disappears instantly. Add a brief fade-out animation so the user isn't confused
- A new note added from another device pops into the list. Consider adding a subtle "new" indicator
- Show a small "•" or "Online" indicator when the real-time connection is active

---

## 6. Firestore Security Rules

> 📄 **Firebase Docs:**
> *"Firebase Security Rules allow you to control access to your database. All reads and writes to your database are evaluated against your rules before they complete. If the rules deny access, the client receives an error."*

Without rules, anyone with your Firebase config can read/write all your data. Never ship without rules.

```javascript
// firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions — reusable across rules
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidNote() {
      let data = request.resource.data;
      return data.title is string
          && data.title.size() <= 500
          && data.content is string
          && data.content.size() <= 50000
          && data.tags is list
          && data.tags.size() <= 20;
    }

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if isSignedIn() && isOwner(userId);

      // Users can only access their own notes
      match /notes/{noteId} {
        allow read: if isSignedIn() && isOwner(userId);
        allow create: if isSignedIn() && isOwner(userId) && isValidNote();
        allow update: if isSignedIn() && isOwner(userId) && isValidNote();
        allow delete: if isSignedIn() && isOwner(userId);
      }
    }

    // Public templates — anyone can read, only admins can write
    match /public_templates/{templateId} {
      allow read: if true;
      allow write: if isSignedIn() && request.auth.token.admin == true;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Rule:** Start with `allow read, write: if false;` at the bottom — deny everything not explicitly allowed. Then add specific allow rules. Never use `allow read, write: if true;` in production.

🧪 **Tester:** Use the Firestore Emulator for tests — free, fast, no real Firebase needed:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulator
firebase emulators:start --only firestore
```

```dart
// In test setup — connect to emulator instead of real Firestore
setUpAll(() async {
  await Firebase.initializeApp();
  FirebaseFirestore.instance.useFirestoreEmulator('localhost', 8080);
});
```

```dart
// Test real Firestore operations against the emulator
test('createNote adds document to Firestore', () async {
  final repo = NotesRepository(db: FirebaseFirestore.instance, userId: 'test-user');

  final noteId = await repo.createNote(title: 'Test', content: 'Content', tags: ['work']);

  final doc = await FirebaseFirestore.instance
      .collection('users').doc('test-user').collection('notes').doc(noteId).get();

  expect(doc.exists, isTrue);
  expect(doc.data()!['title'], equals('Test'));
  expect(doc.data()!['tags'], contains('work'));
});

test('watchNotes stream emits new note on create', () async {
  final repo = NotesRepository(db: FirebaseFirestore.instance, userId: 'test-user');

  // Start listening to the stream
  final notes = expectAsync1<List<Note>>((notes) {
    expect(notes.length, equals(1));
    expect(notes.first.title, equals('Realtime Note'));
  });

  repo.watchNotes().listen(notes);

  // Trigger a write
  await repo.createNote(title: 'Realtime Note', content: '');
});
```

---

## 7. Offline Support

> 📄 **Firebase Docs:**
> *"Cloud Firestore supports offline data persistence. This feature caches a copy of the Cloud Firestore data that your app is actively using, so your app can access the data when the device is offline."*

```dart
// Enable offline persistence (on by default for mobile, opt-in for web)
// Mobile: enabled by default, cache size 100 MB
// To customize:
FirebaseFirestore.instance.settings = const Settings(
  persistenceEnabled: true,
  cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
);

// Detect if you're getting data from cache or server
ref.watchNotes().snapshots().listen((snapshot) {
  for (final docChange in snapshot.docChanges) {
    if (snapshot.metadata.isFromCache) {
      // Data came from local cache — user might be offline
    }
    if (snapshot.metadata.hasPendingWrites) {
      // User wrote data but it hasn't synced to server yet
    }
  }
});
```

🎨 **Designer:** Design for offline-first. When `metadata.isFromCache` is true:
- Show a subtle "Offline" banner at the top (not a blocking overlay)
- Writes still work — Firestore queues them locally and syncs when back online
- Show a "syncing..." indicator for `hasPendingWrites`

---

## 8. Pagination — `startAfterDocument`

> 🍎 **Academy Golden Rule — Respect the User's Device:**
> *"Never load 10,000 documents into memory. Paginate. Your app should feel fast on a 5-year-old phone with 2 GB RAM."*

Firestore charges per document read. Loading all documents is wasteful and slow. Pagination loads one page at a time.

```dart
class PaginatedNotesRepository {
  final FirebaseFirestore _db;
  final String _userId;
  static const _pageSize = 20;

  PaginatedNotesRepository({required FirebaseFirestore db, required String userId})
      : _db = db, _userId = userId;

  CollectionReference<Map<String, dynamic>> get _notesRef =>
      _db.collection('users').doc(_userId).collection('notes');

  // First page — no cursor needed
  Future<PaginatedResult<Note>> getFirstPage() async {
    final snapshot = await _notesRef
        .orderBy('updatedAt', descending: true)
        .limit(_pageSize)
        .get();

    return PaginatedResult(
      items: snapshot.docs.map(Note.fromFirestore).toList(),
      lastDocument: snapshot.docs.isNotEmpty ? snapshot.docs.last : null,
      hasMore: snapshot.docs.length == _pageSize,
    );
  }

  // Next page — start AFTER the last document from previous page
  Future<PaginatedResult<Note>> getNextPage(DocumentSnapshot lastDocument) async {
    final snapshot = await _notesRef
        .orderBy('updatedAt', descending: true)
        .startAfterDocument(lastDocument)   // ← cursor-based pagination
        .limit(_pageSize)
        .get();

    return PaginatedResult(
      items: snapshot.docs.map(Note.fromFirestore).toList(),
      lastDocument: snapshot.docs.isNotEmpty ? snapshot.docs.last : null,
      hasMore: snapshot.docs.length == _pageSize,
    );
  }
}

class PaginatedResult<T> {
  final List<T> items;
  final DocumentSnapshot? lastDocument;
  final bool hasMore;

  const PaginatedResult({
    required this.items,
    required this.lastDocument,
    required this.hasMore,
  });
}
```

```dart
// Riverpod notifier for paginated loading
class PaginatedNotesNotifier extends AsyncNotifier<PaginatedNotesState> {
  @override
  Future<PaginatedNotesState> build() async {
    final repo = ref.watch(paginatedNotesRepoProvider);
    final result = await repo.getFirstPage();
    return PaginatedNotesState(
      notes: result.items,
      lastDocument: result.lastDocument,
      hasMore: result.hasMore,
      isLoadingMore: false,
    );
  }

  Future<void> loadMore() async {
    final current = state.requireValue;
    if (!current.hasMore || current.isLoadingMore) return;

    state = AsyncData(current.copyWith(isLoadingMore: true));

    final repo = ref.read(paginatedNotesRepoProvider);
    final result = await repo.getNextPage(current.lastDocument!);

    state = AsyncData(PaginatedNotesState(
      notes: [...current.notes, ...result.items],
      lastDocument: result.lastDocument,
      hasMore: result.hasMore,
      isLoadingMore: false,
    ));
  }
}
```

```dart
// Infinite scroll in the UI
NotificationListener<ScrollNotification>(
  onNotification: (scroll) {
    if (scroll.metrics.pixels >= scroll.metrics.maxScrollExtent - 200) {
      ref.read(paginatedNotesProvider.notifier).loadMore();
    }
    return false;
  },
  child: ListView.builder(
    itemCount: notes.length + (hasMore ? 1 : 0),
    itemBuilder: (_, index) {
      if (index == notes.length) {
        return const Center(child: CircularProgressIndicator());
      }
      return NoteCard(note: notes[index]);
    },
  ),
)
```

**Why `startAfterDocument` instead of `offset`?**
Firestore has no `offset(100)`. Even if it did, offset-based pagination is slow on large datasets — the database must count and skip N documents. Cursor-based pagination (`startAfter`) jumps directly to the right position using the index.

---

## 9. Compound Indexes

> 📄 **Firebase Docs:**
> *"Cloud Firestore automatically creates indexes for single-field queries. Queries that combine equality filters with a range filter or order on a different field require a composite (compound) index."*

```dart
// This query works WITHOUT a custom index — single-field equality
_notesRef.where('isPinned', isEqualTo: true).get();

// This query works WITHOUT a custom index — single-field ordering
_notesRef.orderBy('createdAt', descending: true).get();

// ❌ This query FAILS without a compound index
// Combining equality filter on one field + orderBy on another field
_notesRef
    .where('isPinned', isEqualTo: true)
    .orderBy('updatedAt', descending: true)
    .get();
// Error: "The query requires an index. You can create it here: <link>"
```

Firestore gives you the exact link to create the index when the query fails. Click it.

```json
// firestore.indexes.json — define indexes as code (deploy with firebase deploy)
{
  "indexes": [
    {
      "collectionGroup": "notes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isPinned", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

**Rule:** When a Firestore query fails with "requires an index", the error message contains a direct link to the Firebase console that pre-fills the index. Click it, create it, wait 2-3 minutes for it to build. Store the index definition in `firestore.indexes.json` so it deploys with your project.

---

## 10. Transactions — Atomic Read-Modify-Write

```dart
// A batch write (Section 4) writes multiple documents atomically
// but cannot READ data during the write.
// A transaction can READ first, then WRITE based on what it read.

// Use case: transfer credits between users
Future<void> transferCredits({
  required String fromUserId,
  required String toUserId,
  required int amount,
}) async {
  await FirebaseFirestore.instance.runTransaction((transaction) async {
    // Step 1: READ both accounts inside the transaction
    final fromDoc = await transaction.get(
      _db.collection('users').doc(fromUserId),
    );
    final toDoc = await transaction.get(
      _db.collection('users').doc(toUserId),
    );

    final fromBalance = fromDoc.data()!['credits'] as int;
    final toBalance = toDoc.data()!['credits'] as int;

    if (fromBalance < amount) {
      throw Exception('Insufficient credits');
    }

    // Step 2: WRITE both updates — they succeed or fail together
    transaction.update(fromDoc.reference, {'credits': fromBalance - amount});
    transaction.update(toDoc.reference, {'credits': toBalance + amount});
  });
  // If another client modifies either document between READ and WRITE,
  // Firestore automatically RETRIES the entire transaction.
}
```

**Transaction vs Batch:**
```
Need to write multiple documents atomically?
├── Don't need to read first → WriteBatch (simpler, up to 500 ops)
└── Need to read-then-write → Transaction (auto-retries on conflict)
```

---

## 11. Offline-First Sync Engine — Enterprise Pattern

> 🏢 **Enterprise Reality:**
> *"Your users are on the subway, in elevators, in rural areas. An enterprise app must work fully offline — create, edit, delete — and sync automatically when connectivity returns. This is not a nice-to-have; it's table stakes."*

```dart
// Sync status for every document
enum SyncStatus { synced, pendingCreate, pendingUpdate, pendingDelete }

class SyncableNote {
  final Note note;
  final SyncStatus syncStatus;
  final DateTime lastModified;

  const SyncableNote({
    required this.note,
    required this.syncStatus,
    required this.lastModified,
  });
}

// Offline-first repository — local database is the source of truth
class OfflineFirstNotesRepository {
  final NotesLocalDatasource _local;    // Hive or SQLite
  final NotesRemoteDatasource _remote;  // Firestore
  final ConnectivityService _connectivity;

  // WRITE: always write locally first, then attempt sync
  Future<void> createNote(Note note) async {
    // 1. Save to local DB immediately — user sees it instantly
    await _local.save(SyncableNote(
      note: note,
      syncStatus: SyncStatus.pendingCreate,
      lastModified: DateTime.now(),
    ));

    // 2. Attempt remote sync in background
    if (await _connectivity.isOnline) {
      try {
        await _remote.create(note);
        await _local.updateSyncStatus(note.id, SyncStatus.synced);
      } catch (e) {
        // Failed — stays as pendingCreate, will sync later
        logger.w('Sync failed for note ${note.id}, will retry');
      }
    }
  }

  // READ: always read from local — it's the single source of truth
  Stream<List<SyncableNote>> watchNotes() => _local.watchAll();

  // SYNC: called when connectivity is restored
  Future<SyncResult> syncPendingChanges() async {
    final pending = await _local.getPending();
    int synced = 0, failed = 0;

    for (final item in pending) {
      try {
        switch (item.syncStatus) {
          case SyncStatus.pendingCreate:
            await _remote.create(item.note);
          case SyncStatus.pendingUpdate:
            await _remote.update(item.note);
          case SyncStatus.pendingDelete:
            await _remote.delete(item.note.id);
          case SyncStatus.synced:
            break;
        }
        await _local.updateSyncStatus(item.note.id, SyncStatus.synced);
        synced++;
      } catch (e) {
        failed++;
        logger.e('Sync failed for ${item.note.id}', error: e);
      }
    }

    return SyncResult(synced: synced, failed: failed);
  }
}
```

```dart
// Conflict resolution — when the same note is edited offline on two devices
class ConflictResolver {
  SyncableNote resolve(SyncableNote local, SyncableNote remote) {
    // Strategy 1: Last-write-wins (simplest, used by most apps)
    if (local.lastModified.isAfter(remote.lastModified)) {
      return local;
    }
    return remote;

    // Strategy 2: Merge fields (complex, used by collaborative editors)
    // Strategy 3: Present both to user (used by Git-like systems)
  }
}

// Connectivity listener — auto-sync when back online
class SyncService {
  StreamSubscription? _connectivitySub;

  void startWatching() {
    _connectivitySub = Connectivity().onConnectivityChanged.listen((status) {
      if (status != ConnectivityResult.none) {
        _repository.syncPendingChanges().then((result) {
          logger.i('Sync complete: ${result.synced} synced, ${result.failed} failed');
        });
      }
    });
  }

  void dispose() => _connectivitySub?.cancel();
}
```

---

## Lab — Notes App With Full Firestore

Build a complete notes app with these features:

**Screens:**
1. `NotesScreen` — list of all notes, pinned at top, real-time updates
2. `NoteEditorScreen` — create new or edit existing note
3. `NoteDetailScreen` — full view with all note fields

**Features:**
- Create a note → appears immediately in the list (real-time stream)
- Delete a note → `Dismissible` swipe + "Deleted. Undo" SnackBar that calls `createNote` again to restore
- Pin/unpin → pinned notes appear at top section
- Filter by tag → horizontal chip scroll in `AppBar`
- Search → filter notes client-side (no Firestore query — search the already-loaded stream)
- Batch delete → long-press enters selection mode, "Delete X notes" button appears

**Technical requirements:**
- `notesStreamProvider` is a `StreamProvider` — never poll
- Write operations go through `NotesActionsNotifier`
- Security rules: users can only access their own notes
- Test with Firestore Emulator

---

## Challenge — Multi-Device Real-Time Collaboration

Extend the notes app to a shared workspace:
- A note can be shared with another user (by their email)
- The `sharedWith: [userId1, userId2]` field is added to the note
- Update security rules: `allow read: if resource.data.sharedWith.hasAny([request.auth.uid])`
- Shared notes appear in a "Shared With Me" section
- Real-time: if the owner edits a shared note, the collaborator sees it update instantly

---

## Week 15 Verify

1. What is a Firestore collection vs a document vs a sub-collection? Draw the path for "Harsha's second note" in the data model shown in this file.
2. Your `Note.fromFirestore()` reads `createdAt` as `Timestamp`. Why use `Timestamp` instead of storing dates as ISO strings?
3. `.update({...})` vs `.set({...}, SetOptions(merge: true))` — what happens to fields not mentioned in each call?
4. `watchNotes()` returns a `Stream<List<Note>>`. What is this stream and when does it emit a new value?
5. What is `FieldValue.serverTimestamp()`? Why is it better than `Timestamp.fromDate(DateTime.now())`?
6. Write the Firestore security rule that allows a user to read their own notes but deny everyone else.
7. Explain Firestore's offline support. What is `metadata.hasPendingWrites`? What does Firestore do with writes when the device is offline?
8. You query `where('isPinned', isEqualTo: true).orderBy('updatedAt')` and Firestore throws an error. Why? What do you need to create, and where do you define it in code?
9. `startAfterDocument(lastDoc)` vs a hypothetical `offset(100)` — why is cursor-based pagination faster? What happens if a document is inserted before the cursor position?
10. A transaction reads user A's balance, then writes a deduction. Another client modifies user A's balance between the read and write. What does Firestore do?
11. In an offline-first sync engine, a `SyncableNote` has `syncStatus: pendingUpdate`. The device reconnects. Describe the sync flow — what does the `SyncService` do? What happens if the server version was also modified (conflict)?
12. `ConflictResolver` uses last-write-wins by default. Name one scenario where last-write-wins loses data. What alternative strategy could you use for a collaborative notes app?

---

**Next → [Week 16: Firebase Authentication](Week_16_Authentication.md)**
