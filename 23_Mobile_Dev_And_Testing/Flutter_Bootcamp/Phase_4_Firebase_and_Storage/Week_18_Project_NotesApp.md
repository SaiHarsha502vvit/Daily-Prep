# Week 18 — Project: Notes App
### Phase 4 Capstone | Authentication + Firestore + Offline + Full Feature Set

---

> This is the most complete project in the bootcamp so far. Every system from Phase 4 is integrated:
> - Firebase Authentication (email + Google)
> - Cloud Firestore (real-time sync, security rules)
> - Hive (offline storage)
> - SharedPreferences (user settings)
> - Riverpod (the full provider graph)

---

## What You're Building

A production-quality notes app. Users sign in, create notes that sync in real-time, work offline, and customize the experience.

```
ONBOARDING (first launch only)
  3-page PageView → "Save anything", "Works offline", "Syncs everywhere"

AUTH FLOW
  Login → Register → Forgot Password

MAIN APP
  ┌─────────────────────────────────────────────────┐
  │  BottomNav: Notes | Search | Settings            │
  └─────────────────────────────────────────────────┘

NOTES TAB
  SliverAppBar (collapses)
    Title: "Notes"  |  icons: grid/list toggle, filter by tag
  Offline banner (appears when no internet)
  Pinned section (if any pinned notes)
  Notes grid or list
  FAB: new note

NOTE EDITOR (full-screen)
  Title field
  Content field (multi-line, no limit)
  Bottom bar: tag picker | color picker | pin toggle | delete

SEARCH TAB
  SearchBar (auto-focus)
  Filter chips: All / by tag
  Results list (client-side filter from cached Hive data)

SETTINGS TAB
  User profile (avatar + name + email)
  Theme: Light / System / Dark (SegmentedButton)
  Text size: Small / Medium / Large
  Sign Out (with confirmation dialog)
  Account: Delete account (with double confirmation)
```

---

## Full App Architecture

```
lib/
├── core/
│   ├── theme/
│   │   └── app_theme.dart
│   ├── services/
│   │   ├── prefs_service.dart
│   │   └── connectivity_service.dart
│   └── providers/
│       └── core_providers.dart
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   └── auth_repository.dart
│   │   ├── domain/
│   │   │   └── auth_exception.dart
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── onboarding_screen.dart
│   │       │   ├── login_screen.dart
│   │       │   ├── signup_screen.dart
│   │       │   └── forgot_password_screen.dart
│   │       └── providers/
│   │           └── auth_providers.dart
│   │
│   └── notes/
│       ├── data/
│       │   ├── remote/
│       │   │   └── notes_repository.dart     ← Firestore
│       │   ├── local/
│       │   │   ├── note_hive_model.dart
│       │   │   ├── note_hive_model.g.dart    ← generated
│       │   │   └── notes_local_repository.dart
│       │   └── sync/
│       │       └── notes_sync_service.dart
│       ├── domain/
│       │   └── note.dart
│       └── presentation/
│           ├── screens/
│           │   ├── main_screen.dart
│           │   ├── notes_tab.dart
│           │   ├── note_editor_screen.dart
│           │   ├── search_tab.dart
│           │   └── settings_tab.dart
│           ├── widgets/
│           │   ├── note_card.dart
│           │   ├── offline_banner.dart
│           │   └── tag_picker.dart
│           └── providers/
│               └── notes_providers.dart
│
└── main.dart
```

---

## Provider Graph — How It All Connects

```dart
// lib/features/notes/presentation/providers/notes_providers.dart

// ── Connectivity ──────────────────────────────────────────
final connectivityProvider = StreamProvider<bool>((ref) {
  return Connectivity().onConnectivityChanged
      .map((r) => r != ConnectivityResult.none);
});

// ── Auth ──────────────────────────────────────────────────
final authStateProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});

final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authStateProvider).valueOrNull;
});

// ── Local Storage ─────────────────────────────────────────
final notesLocalRepoProvider = Provider<NotesLocalRepository>((ref) {
  return NotesLocalRepository();  // wraps Hive.box('notes')
});

// ── Remote (Firestore) ────────────────────────────────────
final notesRemoteRepoProvider = Provider<NotesRepository>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) throw const AuthException('Not signed in');
  return NotesRepository(db: FirebaseFirestore.instance, userId: user.uid);
});

// ── Sync Service ──────────────────────────────────────────
final notesSyncServiceProvider = Provider<NotesSyncService>((ref) {
  final service = NotesSyncService(
    local: ref.watch(notesLocalRepoProvider),
    remote: ref.watch(notesRemoteRepoProvider),
  );
  ref.onDispose(service.dispose);
  return service;
});

// ── Notes Stream (local = instant, Firestore = real-time update) ──
final notesStreamProvider = StreamProvider.autoDispose<List<Note>>((ref) {
  // Watch local Hive first (instant load)
  // Firestore stream reconciles in background
  final remote = ref.watch(notesRemoteRepoProvider);
  final local = ref.watch(notesLocalRepoProvider);

  // Write Firestore updates to local cache as they come in
  return remote.watchNotes().map((firestoreNotes) {
    // Sync Firestore → Hive (background)
    for (final note in firestoreNotes) {
      final hiveNote = NoteHiveModel(/* map from Note */);
      hiveNote.pendingSync = false;
      local.save(hiveNote);
    }
    return firestoreNotes;
  });
});

// ── Selected Tag Filter ────────────────────────────────────
final selectedTagProvider = StateProvider<String?>((ref) => null);

// ── All Tags (derived) ─────────────────────────────────────
final allTagsProvider = Provider<List<String>>((ref) {
  final notes = ref.watch(notesStreamProvider).valueOrNull ?? [];
  return notes.expand((n) => n.tags).toSet().toList()..sort();
});

// ── Settings ───────────────────────────────────────────────
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  final prefs = ref.watch(prefsProvider);
  return ThemeModeNotifier(prefs);
});

final isGridViewProvider = StateProvider<bool>((ref) => true);

// ── Notes Actions ─────────────────────────────────────────
class NotesActionsNotifier extends Notifier<void> {
  @override
  void build() {}

  NotesSyncService get _sync => ref.read(notesSyncServiceProvider);

  Future<void> createNote({required String title, required String content, List<String> tags = const [], Color color = Colors.transparent}) {
    return _sync.createNote(title: title, content: content, tags: tags);
  }

  Future<void> updateNote(String id, {String? title, String? content, List<String>? tags}) {
    return ref.read(notesRemoteRepoProvider).updateNote(id, title: title, content: content, tags: tags);
  }

  Future<void> deleteNote(String id) {
    return ref.read(notesRemoteRepoProvider).deleteNote(id);
  }

  Future<void> togglePin(String id, bool current) {
    return ref.read(notesRemoteRepoProvider).togglePin(id, current);
  }
}

final notesActionsProvider = NotifierProvider<NotesActionsNotifier, void>(NotesActionsNotifier.new);
```

---

## Key Screens — Implementation Guide

### `main.dart` — App Entry Point

```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize all local storage before app starts
  await Hive.initFlutter();
  Hive.registerAdapter(NoteHiveModelAdapter());
  await Hive.openBox<NoteHiveModel>('notes');

  final prefs = await SharedPreferences.getInstance();

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  runApp(
    ProviderScope(
      overrides: [
        // Inject the pre-initialized SharedPreferences instance
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const App(),
    ),
  );
}

class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authStateProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp(
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      home: authAsync.when(
        loading: () => const SplashScreen(),
        error: (_, __) => const ErrorScreen(),
        data: (user) {
          if (user == null) return const LoginScreen();
          final isOnboarded = ref.read(prefsProvider).isOnboardingDone;
          if (!isOnboarded) return const OnboardingScreen();
          return const MainScreen();
        },
      ),
    );
  }
}
```

### `notes_tab.dart` — The Main Screen

```dart
class NotesTab extends ConsumerWidget {
  const NotesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notesAsync = ref.watch(notesStreamProvider);
    final isGridView = ref.watch(isGridViewProvider);
    final selectedTag = ref.watch(selectedTagProvider);
    final allTags = ref.watch(allTagsProvider);
    final isOnline = ref.watch(connectivityProvider).valueOrNull ?? true;

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          floating: true, snap: true,
          title: const Text('Notes'),
          actions: [
            // Grid/list toggle
            IconButton(
              icon: Icon(isGridView ? Icons.list : Icons.grid_view),
              onPressed: () => ref.read(isGridViewProvider.notifier).state = !isGridView,
            ),
          ],
          // Tag filter chips
          bottom: allTags.isEmpty ? null : PreferredSize(
            preferredSize: const Size.fromHeight(52),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  FilterChip(
                    label: const Text('All'),
                    selected: selectedTag == null,
                    onSelected: (_) => ref.read(selectedTagProvider.notifier).state = null,
                    showCheckmark: false,
                  ),
                  const SizedBox(width: 8),
                  ...allTags.map((tag) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(tag),
                      selected: selectedTag == tag,
                      onSelected: (_) => ref.read(selectedTagProvider.notifier).state =
                          selectedTag == tag ? null : tag,
                      showCheckmark: false,
                    ),
                  )),
                ],
              ),
            ),
          ),
        ),

        // Offline banner
        if (!isOnline)
          SliverToBoxAdapter(
            child: Container(
              color: Colors.orange,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              child: const Row(
                children: [
                  Icon(Icons.wifi_off, size: 16, color: Colors.white),
                  SizedBox(width: 8),
                  Text('Offline — changes will sync when connected',
                      style: TextStyle(color: Colors.white, fontSize: 13)),
                ],
              ),
            ),
          ),

        // Notes content
        notesAsync.when(
          loading: () => const SliverFillRemaining(
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (e, _) => SliverFillRemaining(
            child: Center(child: Text('Error: $e')),
          ),
          data: (allNotes) {
            // Apply tag filter
            final notes = selectedTag == null
                ? allNotes
                : allNotes.where((n) => n.tags.contains(selectedTag)).toList();

            if (notes.isEmpty) {
              return SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('📝', style: TextStyle(fontSize: 64)),
                      const SizedBox(height: 16),
                      Text(selectedTag != null
                          ? 'No notes tagged "$selectedTag"'
                          : 'No notes yet\nTap + to create one',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyLarge),
                    ],
                  ),
                ),
              );
            }

            final pinned = notes.where((n) => n.isPinned).toList();
            final regular = notes.where((n) => !n.isPinned).toList();

            if (isGridView) {
              return SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12,
                    childAspectRatio: 0.85,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, i) => NoteCard(note: notes[i]),
                    childCount: notes.length,
                  ),
                ),
              );
            } else {
              // List view with pinned section
              return SliverList(
                delegate: SliverChildListDelegate([
                  if (pinned.isNotEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
                      child: Text('PINNED', style: TextStyle(fontSize: 11, letterSpacing: 1.2, fontWeight: FontWeight.w700)),
                    ),
                    ...pinned.map((n) => NoteCard(note: n)),
                    if (regular.isNotEmpty)
                      const Padding(
                        padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
                        child: Text('OTHERS', style: TextStyle(fontSize: 11, letterSpacing: 1.2, fontWeight: FontWeight.w700)),
                      ),
                  ],
                  ...regular.map((n) => NoteCard(note: n)),
                ]),
              );
            }
          },
        ),
      ],
    );
  }
}
```

### `note_editor_screen.dart` — Create/Edit

```dart
class NoteEditorScreen extends ConsumerStatefulWidget {
  final Note? existingNote;   // null = new note
  const NoteEditorScreen({super.key, this.existingNote});

  @override
  ConsumerState<NoteEditorScreen> createState() => _NoteEditorScreenState();
}

class _NoteEditorScreenState extends ConsumerState<NoteEditorScreen> {
  late final TextEditingController _titleController;
  late final TextEditingController _contentController;
  late List<String> _tags;
  bool _isSaving = false;
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.existingNote?.title ?? '');
    _contentController = TextEditingController(text: widget.existingNote?.content ?? '');
    _tags = List.from(widget.existingNote?.tags ?? []);

    _titleController.addListener(() => setState(() => _hasChanges = true));
    _contentController.addListener(() => setState(() => _hasChanges = true));
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_titleController.text.isEmpty && _contentController.text.isEmpty) {
      Navigator.pop(context);
      return;
    }

    setState(() => _isSaving = true);
    try {
      if (widget.existingNote == null) {
        await ref.read(notesActionsProvider.notifier).createNote(
          title: _titleController.text,
          content: _contentController.text,
          tags: _tags,
        );
      } else {
        await ref.read(notesActionsProvider.notifier).updateNote(
          widget.existingNote!.id,
          title: _titleController.text,
          content: _contentController.text,
          tags: _tags,
        );
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save: ${e.toString()}')),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<bool> _onWillPop() async {
    if (!_hasChanges) return true;
    final discard = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Discard changes?'),
        content: const Text('Your changes will not be saved.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep editing')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Discard'),
          ),
        ],
      ),
    );
    return discard ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_hasChanges,
      onPopInvoked: (didPop) async {
        if (!didPop) {
          final shouldPop = await _onWillPop();
          if (shouldPop && mounted) Navigator.pop(context);
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.existingNote == null ? 'New Note' : 'Edit Note'),
          actions: [
            if (_isSaving)
              const Padding(
                padding: EdgeInsets.all(16),
                child: SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)),
              )
            else
              TextButton(onPressed: _save, child: const Text('Save')),
          ],
        ),
        body: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Column(
            children: [
              TextField(
                controller: _titleController,
                decoration: const InputDecoration(
                  hintText: 'Title',
                  border: InputBorder.none,
                  hintStyle: TextStyle(fontSize: 22),
                ),
                style: Theme.of(context).textTheme.headlineSmall,
                textInputAction: TextInputAction.next,
                maxLines: 1,
              ),
              Expanded(
                child: TextField(
                  controller: _contentController,
                  decoration: const InputDecoration(
                    hintText: 'Start writing...',
                    border: InputBorder.none,
                  ),
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.6),
                  maxLines: null,   // unlimited lines
                  expands: true,
                  textAlignVertical: TextAlignVertical.top,
                ),
              ),
              // Tag display
              if (_tags.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Wrap(
                    spacing: 6,
                    children: _tags.map((tag) => Chip(
                      label: Text(tag),
                      onDeleted: () => setState(() => _tags.remove(tag)),
                      visualDensity: VisualDensity.compact,
                    )).toList(),
                  ),
                ),
            ],
          ),
        ),
        // Bottom action bar
        bottomNavigationBar: SafeArea(
          child: Container(
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.label_outline),
                  tooltip: 'Add tag',
                  onPressed: _showTagPicker,
                ),
                IconButton(
                  icon: Icon(widget.existingNote?.isPinned ?? false
                      ? Icons.push_pin : Icons.push_pin_outlined),
                  tooltip: 'Pin note',
                  onPressed: widget.existingNote != null
                      ? () => ref.read(notesActionsProvider.notifier)
                          .togglePin(widget.existingNote!.id, widget.existingNote!.isPinned)
                      : null,
                ),
                const Spacer(),
                if (widget.existingNote != null)
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    tooltip: 'Delete note',
                    onPressed: _confirmDelete,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showTagPicker() async {
    final allTags = ref.read(allTagsProvider);
    final selected = await showModalBottomSheet<List<String>>(
      context: context,
      builder: (_) => TagPickerSheet(existing: _tags, available: allTags),
    );
    if (selected != null && mounted) {
      setState(() { _tags = selected; _hasChanges = true; });
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete note?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await ref.read(notesActionsProvider.notifier).deleteNote(widget.existingNote!.id);
      if (mounted) Navigator.pop(context);
    }
  }
}
```

---

## Phase 4 Concepts Exercised

| Concept | Where |
|---------|-------|
| Firebase Auth (email + Google) | Login, SignUp, ForgotPassword screens |
| `authStateChanges()` → routing | `App.build()` — home widget derived from auth stream |
| Auth error mapping | `AuthRepository._mapError()` |
| Firestore real-time stream | `notesStreamProvider` (StreamProvider) |
| Firestore CRUD + batch | `NotesRepository` |
| Firestore security rules | Each user can only access their own notes |
| Hive TypeAdapter | `NoteHiveModel` with generated adapter |
| Offline-first write | `NotesSyncService.createNote()` — local first, remote after |
| Pending sync flag | `NoteHiveModel.pendingSync` field |
| SharedPreferences | Theme, text size, onboarding flag |
| `ConnectivityPlus` | `connectivityProvider` + offline banner |
| `PopScope` (unsaved changes) | `NoteEditorScreen._onWillPop()` |
| `AnimatedSwitcher` | Grid/list view toggle |
| `SliverPersistentHeader` | Pinned notes section header sticks |
| Full Riverpod provider graph | 12+ providers composing auth + data + settings |

---

## Week 18 Verify — Project Self-Review

1. The `notesStreamProvider` is a `StreamProvider.autoDispose`. What does `autoDispose` do here? Would removing it cause any bugs?
2. Trace what happens step by step when a user creates a note while offline. Include both the local and remote paths.
3. `PopScope.canPop: !_hasChanges` — what does this do? When does `onPopInvoked` fire?
4. The `allTagsProvider` is a `Provider<List<String>>` that depends on `notesStreamProvider`. When does it recompute?
5. After the user signs out, `currentUserProvider` returns null. Which providers are invalidated? Trace the effect through the provider graph.
6. You store notes in both Hive and Firestore. When a note is edited on another device and the Firestore stream emits the update — how does the local Hive get updated? Show the code path.
7. The editor has `expands: true` on the content TextField. What does this require the parent to be, and why?

---

**Phase 4 Complete.**

**Next → [Phase 5: Advanced Patterns](../Phase_5_Advanced_Patterns/Phase_5_Overview.md)**
