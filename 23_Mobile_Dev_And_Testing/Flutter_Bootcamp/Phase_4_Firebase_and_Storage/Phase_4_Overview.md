# Phase 4 — Firebase & Persistence
### Month 4 | Weeks 16-19

---

## What This Phase Is About

Your apps now work with real data from APIs. This phase adds the other half: **storing data** — in the cloud (Firebase), on the device (SQLite/Hive), and the auth layer that connects a user to their data.

By the end, you'll build a full Notes App where users can sign in, create notes that sync across devices, and also work offline.

---

## Week Map

| File | Topic | Core Skills |
|------|-------|-------------|
| [Week_16_Firebase_Firestore.md](Week_16_Firebase_Firestore.md) | Firebase & Firestore | Firestore CRUD, real-time listeners, offline cache, StreamProvider |
| [Week_17_Authentication.md](Week_17_Authentication.md) | Authentication | Firebase Auth, Google Sign-In, auth state streams, security rules |
| [Week_18_Local_Storage.md](Week_18_Local_Storage.md) | Local Storage | SharedPreferences, Hive, SQLite, offline-first pattern |
| [Week_19_Project_NotesApp.md](Week_19_Project_NotesApp.md) | Project: Notes App | Cloud sync + offline cache + auth, feature-based architecture |

---

## Week 16 — Firebase & Cloud Firestore

**Setup:**
1. Create a Firebase project at console.firebase.google.com
2. Register your Android + iOS apps
3. Run `flutterfire configure` (FlutterFire CLI handles everything)
4. Add `firebase_core` and `cloud_firestore` to pubspec.yaml

**Firestore data model:**
```
Firestore (the database)
└── users (collection)
    └── userId_abc123 (document)
        ├── name: "Harsha"
        ├── email: "harsha@email.com"
        └── notes (sub-collection)
            └── noteId_xyz (document)
                ├── title: "Meeting notes"
                ├── content: "..."
                ├── createdAt: Timestamp
                └── tags: ["work", "important"]
```

**CRUD with Firestore:**
```dart
final db = FirebaseFirestore.instance;

// Create
await db.collection('notes').add({
  'title': title,
  'content': content,
  'createdAt': FieldValue.serverTimestamp(),
  'userId': FirebaseAuth.instance.currentUser!.uid,
});

// Read (one-time)
final snapshot = await db.collection('notes')
  .where('userId', isEqualTo: currentUserId)
  .orderBy('createdAt', descending: true)
  .get();
final notes = snapshot.docs.map((doc) => Note.fromFirestore(doc)).toList();

// Real-time listener (Stream)
db.collection('notes')
  .where('userId', isEqualTo: currentUserId)
  .snapshots()
  .listen((snapshot) {
    // Called every time data changes in Firestore
    final notes = snapshot.docs.map((doc) => Note.fromFirestore(doc)).toList();
    // update UI
  });

// Update
await db.collection('notes').doc(noteId).update({'title': newTitle});

// Delete
await db.collection('notes').doc(noteId).delete();
```

**Firestore + Riverpod (StreamProvider):**
```dart
final notesProvider = StreamProvider<List<Note>>((ref) {
  final userId = ref.watch(currentUserProvider)!.uid;
  return FirebaseFirestore.instance
    .collection('notes')
    .where('userId', isEqualTo: userId)
    .snapshots()
    .map((snapshot) =>
      snapshot.docs.map((doc) => Note.fromFirestore(doc)).toList()
    );
});
```

**Tasks:**
1. Create a notes collection and add/list/delete notes from Firestore
2. Add real-time listener — open two browser windows and watch live sync
3. Implement search — filter notes by title using Firestore `.where()`
4. Add tags to notes and filter by tag
5. Implement offline support: Firestore's built-in offline cache (`persistenceEnabled`)

---

## Week 17 — Authentication

**Firebase Auth flows:**
- Email/password (the baseline)
- Google Sign-In (most common social login)
- Apple Sign-In (required if you have Google on iOS)
- Phone OTP (popular in India)
- Anonymous auth (let users start without account, upgrade later)

```dart
// Email/password
final credential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
  email: email,
  password: password,
);

// Sign in
final credential = await FirebaseAuth.instance.signInWithEmailAndPassword(
  email: email,
  password: password,
);

// Sign out
await FirebaseAuth.instance.signOut();

// Auth state stream — the correct way to handle auth in UI
final authStateProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});

// In your app's router:
final authState = ref.watch(authStateProvider);
return authState.when(
  data: (user) => user != null ? const HomeScreen() : const LoginScreen(),
  loading: () => const SplashScreen(),
  error: (_, __) => const ErrorScreen(),
);

// Google Sign-In
final googleUser = await GoogleSignIn().signIn();
final googleAuth = await googleUser!.authentication;
final credential = GoogleAuthProvider.credential(
  accessToken: googleAuth.accessToken,
  idToken: googleAuth.idToken,
);
await FirebaseAuth.instance.signInWithCredential(credential);
```

**Security Rules (Firestore):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own notes
    match /notes/{noteId} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

**Tasks:**
1. Build a login + signup flow (email/password)
2. Add Google Sign-In button
3. Show user's profile photo from Google in the AppBar
4. Implement forgot password (Firebase sends reset email)
5. Implement "stay logged in" (Firebase handles this by default, but understand how)

---

## Week 18 — Local Storage: Hive, SQLite, SharedPreferences

Not everything needs the cloud. Store small, quick data locally.

**SharedPreferences — key/value, tiny data:**
```dart
final prefs = await SharedPreferences.getInstance();
// Write
await prefs.setString('theme', 'dark');
await prefs.setBool('onboarding_done', true);
await prefs.setInt('last_tab', 2);
// Read
final theme = prefs.getString('theme') ?? 'light';
```
Use for: theme preference, onboarding state, last searched city, simple settings.

**Hive — fast NoSQL local database:**
```dart
// Register adapter
Hive.registerAdapter(NoteAdapter());

// Open a box (like a collection)
final box = await Hive.openBox<Note>('notes');

// Write
await box.put('note_1', Note(title: 'Hello', content: 'World'));
await box.add(Note(title: 'Another note')); // auto-key

// Read
final note = box.get('note_1');
final allNotes = box.values.toList();

// Delete
await box.delete('note_1');

// Watch for changes (reactive)
box.watch(key: 'note_1').listen((event) {
  print('Note changed: ${event.value}');
});
```
Use for: complex local data, large lists, offline-first apps.

**SQLite (via `sqflite` package) — relational:**
```dart
final db = await openDatabase(
  join(await getDatabasesPath(), 'notes.db'),
  onCreate: (db, version) => db.execute(
    'CREATE TABLE notes(id INTEGER PRIMARY KEY, title TEXT, content TEXT)',
  ),
  version: 1,
);

await db.insert('notes', {'title': 'Hello', 'content': 'World'});
final notes = await db.query('notes');
await db.update('notes', {'title': 'Updated'}, where: 'id = ?', whereArgs: [1]);
await db.delete('notes', where: 'id = ?', whereArgs: [1]);
```
Use for: complex queries, relationships between data, existing database migrations.

**Offline-first pattern:**
```
User creates a note
    → Save to Hive immediately (instant, no network needed)
    → Attempt to sync to Firestore in background
    → If offline: mark as "pending sync"
    → When connection restored: sync pending changes
```

**Tasks:**
1. Save user settings (theme, font size) with SharedPreferences
2. Build an offline-first todo list with Hive
3. Implement a read-later list that saves articles offline (title, URL, content)
4. Build a simple SQLite contact book with CRUD
5. Implement the offline sync pattern: write to Hive first, sync to Firebase when online

---

## Week 19 — Project: Notes App

**Full-featured, cloud-synced, offline-capable notes application.**

**Screens:**

**Auth Screens:**
- Welcome / Onboarding (3-page swiper for first-time users)
- Login (email + Google)
- Register
- Forgot Password

**Main App (after login):**
- Notes Home: Grid/List toggle, search bar, FAB to add note
- Note Editor: Full-screen editor, rich text basics (bold, italic, bullets), tag selector
- Note Detail (view only): Title, content, tags, created/modified date
- Trash: Deleted notes with restore / permanent delete
- Settings: Theme toggle, font size, account info, sign out

**Features:**
- Real-time sync with Firestore
- Offline support (Hive as local cache)
- Tags (create, filter by tag)
- Search (by title or content)
- Sort by: newest, oldest, last modified, alphabetical
- Swipe to delete (with undo)
- Note color picker (6 colors, stored in Firestore)
- Character count in editor

**Architecture:**
```
lib/
  features/
    auth/
      data/         ← repositories (Firebase Auth calls)
      domain/       ← models (User)
      presentation/ ← screens, widgets, providers
    notes/
      data/
      domain/       ← models (Note, Tag)
      presentation/
  core/
    theme/
    utils/
    constants/
  main.dart
```

---

## Phase 4 Self-Assessment

After this phase:
- You can wire up Firebase to any Flutter app in under 30 minutes
- You understand the difference between Firestore real-time listeners and one-time reads
- You know when to use SharedPreferences vs Hive vs SQLite
- You can implement complete auth flows (login, register, password reset, Google)
- You can build offline-first apps that sync when online

**→ Start with [Week_16_Firebase_Firestore.md](Week_16_Firebase_Firestore.md)**
*(detailed file — ask to build when you reach here)*
