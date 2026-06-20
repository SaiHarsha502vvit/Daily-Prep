# Week 17 — Local Storage
### SharedPreferences, Hive, SQLite — when to use each and how to use them right

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — APIs, when each storage layer is appropriate, offline sync pattern
> - 🎨 **Designer** — designing for offline-first: what the user sees when there's no connection
> - 🧪 **Tester** — testing local storage, resetting state between tests

---

## Why Local Storage Matters

> 📄 **Flutter Docs:**
> *"Most apps need to persist data across app restarts. Most apps need to work offline, at least partially. Local storage provides a way to persist data on the device itself, without a network connection."*

Three reasons to store data locally:
1. **Offline support** — app works without internet (read cached data, write locally, sync later)
2. **Performance** — read from disk is faster than a network call
3. **User preferences** — theme, language, settings — no server needed

Three tools, three jobs:

```
SharedPreferences  → key/value pairs (strings, ints, bools, lists of strings)
                     Use for: settings, flags, last-used values
                     Max data: hundreds of small values
                     Query: by key only

Hive               → typed objects, no server, no SQL
                     Use for: offline-first lists, cached API data, user-created content
                     Max data: tens of thousands of records
                     Query: by key or via boxes

SQLite (sqflite)   → relational tables, SQL queries
                     Use for: complex data with relationships, large datasets
                     Max data: millions of records
                     Query: full SQL
```

---

## 1. SharedPreferences — Key/Value Storage

> 📄 **Flutter Docs:**
> *"Wraps platform-specific persistent storage for simple data (NSUserDefaults on iOS and macOS, SharedPreferences on Android). Data may be persisted to disk asynchronously."*

```yaml
dependencies:
  shared_preferences: ^2.2.0
```

```dart
// lib/core/services/prefs_service.dart

class PrefsService {
  static const _themeKey = 'app_theme';
  static const _onboardingKey = 'onboarding_done';
  static const _lastCityKey = 'last_searched_city';
  static const _fontSizeKey = 'font_size';

  final SharedPreferences _prefs;

  const PrefsService(this._prefs);

  // Theme preference
  bool get isDarkMode => _prefs.getBool(_themeKey) ?? false;
  Future<void> setDarkMode(bool value) => _prefs.setBool(_themeKey, value);

  // Onboarding
  bool get isOnboardingDone => _prefs.getBool(_onboardingKey) ?? false;
  Future<void> markOnboardingDone() => _prefs.setBool(_onboardingKey, true);

  // Last searched city (Weather app)
  String? get lastCity => _prefs.getString(_lastCityKey);
  Future<void> setLastCity(String city) => _prefs.setString(_lastCityKey, city);

  // Font size (1.0 = normal, 1.2 = large, 1.4 = very large)
  double get fontSize => _prefs.getDouble(_fontSizeKey) ?? 1.0;
  Future<void> setFontSize(double size) => _prefs.setDouble(_fontSizeKey, size);

  // Recent searches (list of strings)
  List<String> get recentSearches => _prefs.getStringList('recent_searches') ?? [];
  Future<void> addRecentSearch(String query) {
    final current = recentSearches;
    final updated = [query, ...current.where((q) => q != query)].take(10).toList();
    return _prefs.setStringList('recent_searches', updated);
  }
}

// Initialize once at app startup (async — must await)
final prefsServiceProvider = FutureProvider<PrefsService>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  return PrefsService(prefs);
});

// Synchronous access once initialized (safe to use in build())
final prefsProvider = Provider<PrefsService>((ref) {
  return ref.watch(prefsServiceProvider).requireValue;
});
```

```dart
// Riverpod provider for theme mode — reacts to preference changes
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  final prefs = ref.watch(prefsProvider);
  return ThemeModeNotifier(prefs);
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final PrefsService _prefs;

  ThemeModeNotifier(this._prefs)
      : super(_prefs.isDarkMode ? ThemeMode.dark : ThemeMode.light);

  Future<void> toggle() async {
    final isDark = state == ThemeMode.dark;
    await _prefs.setDarkMode(!isDark);
    state = isDark ? ThemeMode.light : ThemeMode.dark;
  }
}
```

**Rule:** SharedPreferences reads are synchronous after initialization — `_prefs.getBool(key)` returns immediately. Only the initial `SharedPreferences.getInstance()` is async. Initialize once in `main()` and inject everywhere.

🧪 **Tester:** Use the mock from the package:

```dart
setUp(() {
  // Mocks SharedPreferences for tests without writing to disk
  SharedPreferences.setMockInitialValues({'app_theme': true});
});

test('PrefsService returns dark mode from prefs', () async {
  final prefs = await SharedPreferences.getInstance();
  final service = PrefsService(prefs);
  expect(service.isDarkMode, isTrue);
});
```

---

## 2. Hive — Fast Local NoSQL Database

> 📄 **Hive Docs:**
> *"Hive is a lightweight and blazing fast key-value database written in pure Dart. It works natively on Dart VM, Flutter, and the web without any native dependencies."*

```yaml
dependencies:
  hive_flutter: ^1.1.0
dev_dependencies:
  hive_generator: ^2.0.0
  build_runner: ^2.4.0
```

### Defining a Hive TypeAdapter

```dart
// lib/features/notes/data/local/note_hive_model.dart

import 'package:hive/hive.dart';

part 'note_hive_model.g.dart';   // generated by build_runner

@HiveType(typeId: 0)    // typeId must be unique across all your adapters
class NoteHiveModel extends HiveObject {
  @HiveField(0) late String id;
  @HiveField(1) late String title;
  @HiveField(2) late String content;
  @HiveField(3) late List<String> tags;
  @HiveField(4) late bool isPinned;
  @HiveField(5) late DateTime createdAt;
  @HiveField(6) late DateTime updatedAt;
  @HiveField(7) late bool pendingSync;   // true = needs sync to Firebase

  NoteHiveModel({
    required this.id,
    required this.title,
    required this.content,
    required this.tags,
    required this.isPinned,
    required this.createdAt,
    required this.updatedAt,
    this.pendingSync = false,
  });
}
```

```bash
# Generate the adapter
dart run build_runner build --delete-conflicting-outputs
```

### Initialization and Usage

```dart
// lib/main.dart — initialize Hive before runApp
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();                       // sets the storage path
  Hive.registerAdapter(NoteHiveModelAdapter());   // register all adapters
  await Hive.openBox<NoteHiveModel>('notes');     // open the box (like a table)
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const ProviderScope(child: App()));
}
```

```dart
// lib/features/notes/data/local/notes_local_repository.dart

class NotesLocalRepository {
  Box<NoteHiveModel> get _box => Hive.box<NoteHiveModel>('notes');

  // Read all notes (returns an iterable of HiveObjects)
  List<NoteHiveModel> getAll() => _box.values.toList()
    ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

  // Get pending sync items
  List<NoteHiveModel> getPendingSync() =>
      _box.values.where((n) => n.pendingSync).toList();

  // Save or update (Hive uses the .id as key)
  Future<void> save(NoteHiveModel note) async {
    await _box.put(note.id, note);
  }

  // Delete
  Future<void> delete(String id) async {
    await _box.delete(id);
  }

  // Watch for changes — returns a Stream that emits on every change
  Stream<List<NoteHiveModel>> watchAll() {
    return _box.watch().map((_) => getAll())..startWith(getAll());
    // Alternative: use StreamController + box.listenable()
  }

  // Mark as pending sync
  Future<void> markPendingSync(String id) async {
    final note = _box.get(id);
    if (note != null) {
      note.pendingSync = true;
      await note.save();    // HiveObject.save() updates in place
    }
  }

  // Clear pending flag after successful Firestore sync
  Future<void> markSynced(String id) async {
    final note = _box.get(id);
    if (note != null) {
      note.pendingSync = false;
      await note.save();
    }
  }
}
```

🎨 **Designer:** With Hive as the local source of truth, the app feels instant:
- Open app → Hive has all notes → render immediately (no loading state)
- While rendering from Hive → Firestore stream starts in background
- When Firestore emits → reconcile any differences (usually nothing changed)

Users don't wait. The app is "always loaded."

---

## 3. Offline-First Pattern — Hive + Firestore

```
User creates a note (offline or online):
  1. Save to Hive immediately (synchronous, instant)
  2. Update UI (from Hive stream)
  3. Try to save to Firestore (async)
     → Success: mark note.pendingSync = false
     → Failure (offline): mark note.pendingSync = true
  4. When connectivity restored: sync all pendingSync notes
```

```dart
// lib/features/notes/data/notes_sync_service.dart

class NotesSyncService {
  final NotesLocalRepository _local;
  final NotesRepository _remote;    // Firestore repository
  final Connectivity _connectivity;
  StreamSubscription? _connectivitySub;

  NotesSyncService({
    required NotesLocalRepository local,
    required NotesRepository remote,
    required Connectivity connectivity,
  }) : _local = local, _remote = remote, _connectivity = connectivity;

  void startListening() {
    _connectivitySub = _connectivity.onConnectivityChanged.listen((result) {
      if (result != ConnectivityResult.none) {
        _syncPending();
      }
    });
  }

  Future<void> createNote(String title, String content, List<String> tags) async {
    // Always save locally first
    final note = NoteHiveModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),  // temp ID
      title: title, content: content, tags: tags,
      isPinned: false, createdAt: DateTime.now(), updatedAt: DateTime.now(),
      pendingSync: true,
    );
    await _local.save(note);

    // Try to sync to Firestore
    try {
      final firestoreId = await _remote.createNote(title: title, content: content, tags: tags);
      // Update the local note with the real Firestore ID
      await _local.delete(note.id);
      note.id = firestoreId;
      note.pendingSync = false;
      await _local.save(note);
    } catch (_) {
      // Offline — pendingSync stays true, will sync when connection restored
    }
  }

  Future<void> _syncPending() async {
    final pending = _local.getPendingSync();
    for (final note in pending) {
      try {
        await _remote.createNote(title: note.title, content: note.content, tags: note.tags);
        await _local.markSynced(note.id);
      } catch (_) {
        // Still offline or error — leave as pending
      }
    }
  }

  void dispose() => _connectivitySub?.cancel();
}
```

---

## 4. SQLite — When You Need Relational Queries

> 📄 **sqflite Docs:**
> *"SQLite plugin for Flutter. Supports transactions and batches, automatic version management, and helpers for insert/query/update/delete."*

```yaml
dependencies:
  sqflite: ^2.3.0
  path: ^1.9.0
```

```dart
// lib/features/tasks/data/task_database.dart

class TaskDatabase {
  static Database? _db;

  static Future<Database> get database async {
    _db ??= await _initDatabase();
    return _db!;
  }

  static Future<Database> _initDatabase() {
    return openDatabase(
      join(await getDatabasesPath(), 'tasks.db'),
      version: 1,
      onCreate: (db, version) async {
        // Create tables
        await db.execute('''
          CREATE TABLE projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color INTEGER NOT NULL,
            createdAt TEXT NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projectId INTEGER NOT NULL,
            title TEXT NOT NULL,
            isCompleted INTEGER NOT NULL DEFAULT 0,
            dueDate TEXT,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
          )
        ''');
        // Index for common query
        await db.execute('CREATE INDEX idx_tasks_project ON tasks(projectId)');
      },
    );
  }

  // PROJECT CRUD
  Future<int> insertProject(Map<String, dynamic> project) async {
    final db = await database;
    return db.insert('projects', project);
  }

  Future<List<Map<String, dynamic>>> getProjects() async {
    final db = await database;
    return db.query('projects', orderBy: 'name ASC');
  }

  Future<void> deleteProject(int id) async {
    final db = await database;
    await db.delete('projects', where: 'id = ?', whereArgs: [id]);
    // Tasks are cascade-deleted by the FK constraint
  }

  // TASK CRUD
  Future<int> insertTask(Map<String, dynamic> task) async {
    final db = await database;
    return db.insert('tasks', task);
  }

  Future<List<Map<String, dynamic>>> getTasksForProject(int projectId) async {
    final db = await database;
    return db.query(
      'tasks',
      where: 'projectId = ?',
      whereArgs: [projectId],
      orderBy: 'dueDate ASC, isCompleted ASC',
    );
  }

  Future<void> toggleTaskComplete(int taskId, bool isCompleted) async {
    final db = await database;
    await db.update(
      'tasks',
      {'isCompleted': isCompleted ? 1 : 0},
      where: 'id = ?',
      whereArgs: [taskId],
    );
  }

  // Join query — get project name with each task
  Future<List<Map<String, dynamic>>> getOverdueTasks() async {
    final db = await database;
    final now = DateTime.now().toIso8601String();
    return db.rawQuery('''
      SELECT tasks.*, projects.name as projectName
      FROM tasks
      JOIN projects ON tasks.projectId = projects.id
      WHERE tasks.dueDate < ? AND tasks.isCompleted = 0
      ORDER BY tasks.dueDate ASC
    ''', [now]);
  }

  // Transaction — multiple operations that must all succeed or all fail
  Future<void> moveAllTasksToProject(int fromProjectId, int toProjectId) async {
    final db = await database;
    await db.transaction((txn) async {
      await txn.update(
        'tasks',
        {'projectId': toProjectId},
        where: 'projectId = ?',
        whereArgs: [fromProjectId],
      );
      await txn.delete('projects', where: 'id = ?', whereArgs: [fromProjectId]);
    });
  }
}
```

🧑‍💻 **Developer:** SQLite in Flutter requires converting types:
- `bool` → store as `INTEGER` (0 or 1)
- `DateTime` → store as `TEXT` (ISO 8601 string) or `INTEGER` (milliseconds)
- `List<String>` → store as `TEXT` (JSON-encoded) and decode on read
- `null` → native SQL NULL

---

## Storage Decision Guide

```
What are you storing?
│
├── User settings, flags, simple values
│     (theme, language, onboarding done, last tab, font size)
│     → SharedPreferences
│
├── Typed objects, offline-first data
│     (cached articles, user-created content, todo items)
│     → Hive (fast, type-safe, no SQL needed)
│
├── Data with relationships or complex queries
│     (projects with tasks, contacts with multiple phone numbers)
│     → SQLite (sqflite)
│
├── Data that must sync across devices
│     → Firestore (primary) + Hive (cache/offline)
│
└── Files (images, PDFs, videos)
      → Firebase Storage (cloud) + file_picker/path_provider (local)
```

---

## 5. `flutter_secure_storage` — Storing Sensitive Data

> 📄 **flutter_secure_storage Docs:**
> *"A Flutter plugin to store data in secure storage. On iOS, it uses the Keychain. On Android, it uses the EncryptedSharedPreferences backed by the Android Keystore."*

**Never store** auth tokens, API keys, or passwords in `SharedPreferences` — it's stored as plain text in XML on Android. Use `flutter_secure_storage` instead.

```yaml
dependencies:
  flutter_secure_storage: ^9.2.0
```

```dart
// lib/core/storage/secure_storage_service.dart

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,   // uses EncryptedSharedPreferences (API 23+)
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
      // first_unlock_this_device: accessible when device has been unlocked at least once
      // Use for: tokens that should work in background
    ),
  );

  // Keys — use constants to prevent typos
  static const _keyAccessToken = 'access_token';
  static const _keyRefreshToken = 'refresh_token';
  static const _keyUserId = 'user_id';
  static const _keyBiometricEnabled = 'biometric_enabled';

  // Token management
  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    await Future.wait([
      _storage.write(key: _keyAccessToken, value: accessToken),
      _storage.write(key: _keyRefreshToken, value: refreshToken),
    ]);
  }

  Future<String?> getAccessToken() => _storage.read(key: _keyAccessToken);
  Future<String?> getRefreshToken() => _storage.read(key: _keyRefreshToken);

  Future<void> saveUserId(String uid) => _storage.write(key: _keyUserId, value: uid);
  Future<String?> getUserId() => _storage.read(key: _keyUserId);

  Future<bool> get isBiometricEnabled async {
    final val = await _storage.read(key: _keyBiometricEnabled);
    return val == 'true';
  }
  Future<void> setBiometricEnabled(bool enabled) =>
      _storage.write(key: _keyBiometricEnabled, value: enabled.toString());

  // On logout — wipe all secure storage
  Future<void> clearAll() => _storage.deleteAll();

  // On token refresh — just update the access token
  Future<void> updateAccessToken(String newToken) =>
      _storage.write(key: _keyAccessToken, value: newToken);
}
```

```dart
// Integration with Auth interceptor in Dio
class _AuthInterceptor extends Interceptor {
  final SecureStorageService _secureStorage;

  _AuthInterceptor(this._secureStorage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Read token from secure storage and attach to every request
    final token = await _secureStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired — try refresh
      final refreshToken = await _secureStorage.getRefreshToken();
      if (refreshToken != null) {
        try {
          final response = await _refreshTokens(refreshToken);
          await _secureStorage.saveTokens(
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          );
          // Retry the original request with new token
          err.requestOptions.headers['Authorization'] = 'Bearer ${response.accessToken}';
          final retryResponse = await Dio().fetch(err.requestOptions);
          return handler.resolve(retryResponse);
        } catch (_) {
          // Refresh failed — force logout
          await _secureStorage.clearAll();
          // Emit logout event to AuthBloc
        }
      }
    }
    handler.next(err);
  }
}
```

**Storage selection guide (final):**

| Data | Storage | Why |
|--|--|--|
| Auth tokens, passwords | `flutter_secure_storage` | Encrypted at rest |
| User preferences (theme, lang) | `shared_preferences` | Simple key-value, fast |
| Offline data (notes, expenses) | `Hive` or `sqflite` | Structured, queryable |
| Binary files (images, PDFs) | App documents directory | File system |
| Session data (last city) | `shared_preferences` | Ephemeral, small |

---

## Lab — Notes App Offline Layer

Add offline support to the Notes App from Week 15:

**Goal:** The app must work completely without internet. Notes created offline sync to Firestore when connection is restored.

**Steps:**
1. Add Hive as local storage with `NoteHiveModel` adapter
2. Create `NotesLocalRepository` wrapping the Hive box
3. Create `NotesSyncService` that:
   - Creates notes locally first, then attempts Firestore sync
   - Watches `connectivity_plus` stream for reconnect events
   - On reconnect: sync all `pendingSync == true` notes
4. Show a "●" badge next to notes that haven't synced yet
5. Show a banner at the top: "You're offline. Changes will sync when you reconnect."

**Settings screen additions (SharedPreferences):**
- Dark/light mode toggle → `ThemeModeNotifier`
- Text size: Small/Medium/Large → saved to prefs, applied to `textScaleFactor`
- Clear search history button → clears `recentSearches` from prefs

---

## Week 17 Verify

1. List the three local storage solutions and their appropriate use case.
2. `SharedPreferences.getInstance()` is async. After the first call, are reads synchronous or async?
3. In Hive, what is a `Box`? What does `@HiveType(typeId: 0)` do? Why must typeId be unique?
4. Describe the offline-first pattern: what happens when the user creates a note with no internet?
5. In SQLite, you store a `bool` field. What type do you use in the SQL schema and how do you convert when reading?
6. `HiveObject.save()` vs `box.put(key, value)` — what is the difference? When can you use `.save()`?
7. What is `connectivity_plus` used for? Write the code to listen for when the device reconnects to the internet.

---

**Next → [Week 18: Project — Notes App](Week_18_Project_NotesApp.md)**
