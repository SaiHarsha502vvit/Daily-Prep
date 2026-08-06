# Phase 6 — Production Engineering
### Month 6 | Weeks 24-27

---

## What This Phase Is About

Writing code is 60% of the job. The other 40% is making sure that code works, runs fast, ships reliably, and can be understood by others (including future you). Phase 6 covers everything between "it works on my machine" and "it's in 100,000 users' hands."

The capstone: a **full-stack Chat App** — the kind you'd put in a portfolio.

---

## Week Map

| File | Topic | Core Skills |
|------|-------|-------------|
| [Week_24_Testing.md](Week_24_Testing.md) | Testing | Unit, widget, integration tests, blocTest, mocks vs fakes |
| [Week_24b_Testing_Challenges.md](Week_24b_Testing_Challenges.md) | Testing Challenges | Mock vs Fake, fix a pumpAndSettle hang, structure a blocTest by hand |
| [Week_25_Performance_and_Profiling.md](Week_25_Performance_and_Profiling.md) | Performance & Profiling | DevTools, rebuild optimization, background processing |
| [Week_25b_Performance_Challenges.md](Week_25b_Performance_Challenges.md) | Performance Challenges | Reproduce jank, prove a leak, quantify const's effect, isolate judgment calls |
| [Week_26_CICD_and_Deployment.md](Week_26_CICD_and_Deployment.md) | CI/CD & Deployment | GitHub Actions, Fastlane, App Store / Play Store |
| [Week_26b_CICD_Challenges.md](Week_26b_CICD_Challenges.md) | CI/CD Challenges | Write a workflow from scratch, version arithmetic, diagnose a CI-only failure |
| [Week_27_Project_ChatApp.md](Week_27_Project_ChatApp.md) | Project: Chat App | Capstone — real-time messaging, FCM, media, presence |

**Start → [Week 24: Testing](Week_24_Testing.md)**

---

## Week 24 — Testing Flutter Apps

**Why test?**
- Catch regressions when you change something
- Document expected behavior (tests are living specs)
- Enable confident refactoring
- Required for senior roles and professional codebases

**The 3 levels of Flutter testing:**

**1. Unit Tests — test one function/class in isolation:**
```dart
// test/domain/usecases/add_expense_test.dart
void main() {
  group('AddExpense UseCase', () {
    late MockExpenseRepository mockRepo;
    late AddExpense useCase;

    setUp(() {
      mockRepo = MockExpenseRepository();
      useCase = AddExpense(mockRepo);
    });

    test('should return added expense on success', () async {
      final expense = Expense(id: '1', amount: 50.0, category: Category.food);
      when(mockRepo.addExpense(expense)).thenAnswer((_) async => Right(expense));

      final result = await useCase(AddExpenseParams(expense: expense));

      expect(result, Right(expense));
      verify(mockRepo.addExpense(expense));
    });

    test('should return Failure when repository fails', () async {
      when(mockRepo.addExpense(any)).thenAnswer((_) async => Left(ServerFailure()));
      final result = await useCase(AddExpenseParams(expense: mockExpense));
      expect(result, Left(ServerFailure()));
    });
  });
}
```

**2. Widget Tests — test a single widget in isolation:**
```dart
// test/presentation/widgets/expense_card_test.dart
void main() {
  testWidgets('ExpenseCard displays amount and category', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ExpenseCard(
          expense: Expense(amount: 150.0, category: Category.food, note: 'Lunch'),
        ),
      ),
    );

    expect(find.text('₹150.00'), findsOneWidget);
    expect(find.text('Food'), findsOneWidget);
    expect(find.byIcon(Icons.restaurant), findsOneWidget);
  });

  testWidgets('ExpenseCard calls onDelete when delete tapped', (tester) async {
    bool deleteCalled = false;
    await tester.pumpWidget(
      MaterialApp(
        home: ExpenseCard(
          expense: mockExpense,
          onDelete: () => deleteCalled = true,
        ),
      ),
    );

    await tester.tap(find.byIcon(Icons.delete));
    expect(deleteCalled, isTrue);
  });
}
```

**3. Integration Tests — test the full app:**
```dart
// integration_test/add_expense_flow_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('User can add an expense and see it in the list', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // Tap the FAB
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();

    // Fill the form
    await tester.enterText(find.byKey(const Key('amount_field')), '150');
    await tester.tap(find.text('Food'));
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    // Verify the expense appears in the list
    expect(find.text('₹150.00'), findsOneWidget);
  });
}
```

**Testing BLoC:**
```dart
blocTest<ExpenseBloc, ExpenseState>(
  'emits [Loading, Loaded] when GetExpenses succeeds',
  build: () {
    when(mockGetExpenses(any)).thenAnswer((_) async => Right(mockExpenses));
    return ExpenseBloc(getExpenses: mockGetExpenses);
  },
  act: (bloc) => bloc.add(const LoadExpensesEvent()),
  expect: () => [const ExpenseLoading(), ExpenseLoaded(expenses: mockExpenses)],
);
```

**Targets to aim for:**
- 80%+ coverage on domain layer (pure Dart, easy to test)
- 60%+ coverage on BLoC/providers
- Key user flows covered by integration tests

---

## Week 25 — Performance & Profiling

**Flutter DevTools** is your debugging and profiling command center. Run `flutter pub global activate devtools` then launch from VS Code or terminal.

**Common performance issues and fixes:**

**Issue 1: Unnecessary rebuilds**
```dart
// BAD: entire widget rebuilds when any provider changes
class ExpensePage extends ConsumerWidget {
  @override
  Widget build(context, ref) {
    final state = ref.watch(expenseProvider); // rebuilds on any state change
    return Column(children: [
      ExpenseHeader(total: state.total),  // rebuilds even if total didn't change
      ExpenseList(items: state.items),
    ]);
  }
}

// GOOD: each widget watches only what it needs
class ExpenseHeader extends ConsumerWidget {
  @override
  Widget build(context, ref) {
    final total = ref.watch(expenseProvider.select((s) => s.total)); // only rebuilds when total changes
    return Text('Total: $total');
  }
}
```

**Issue 2: Heavy computation in build()**
```dart
// BAD: sorting 1000 items on every rebuild
Widget build(BuildContext context) {
  final sorted = expenses.sorted((a, b) => a.date.compareTo(b.date)); // runs every build
  return ListView.builder(/* ... */);
}

// GOOD: compute in provider, cache result
final sortedExpensesProvider = Provider((ref) {
  final expenses = ref.watch(expensesProvider);
  return [...expenses]..sort((a, b) => a.date.compareTo(b.date));
});
```

**Issue 3: Image performance**
```dart
// Use cached_network_image for network images
CachedNetworkImage(
  imageUrl: url,
  memCacheWidth: 200,   // cache at display size, not original size
  placeholder: (_, __) => const ShimmerPlaceholder(),
  errorWidget: (_, __, ___) => const Icon(Icons.broken_image),
)
```

**Issue 4: ListView.builder vs Column**
```dart
// BAD for long lists: builds ALL children at once
Column(children: expenses.map((e) => ExpenseCard(e)).toList())

// GOOD: only builds visible items
ListView.builder(
  itemCount: expenses.length,
  itemBuilder: (_, i) => ExpenseCard(expenses[i]),
)
```

**Flutter DevTools profiling flow:**
1. Run in **profile mode**: `flutter run --profile`
2. Open DevTools → Performance tab
3. Record a session while scrolling or interacting
4. Look for frames that took >16ms (the 60fps budget)
5. Identify which widget's `build()` is taking too long
6. Use `const` constructors where possible (avoids rebuilds)
7. Use `RepaintBoundary` to isolate frequently-changing widgets

---

## Week 26 — CI/CD & Deployment

**GitHub Actions for Flutter:**
```yaml
# .github/workflows/flutter_ci.yml
name: Flutter CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.27.0'
          channel: 'stable'
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test --coverage
      - uses: codecov/codecov-action@v3

  build_android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter build appbundle --release
      - uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: build/app/outputs/bundle/release/app-release.aab

  build_ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter build ios --release --no-codesign
```

**App Store & Play Store deployment:**

Android:
1. `flutter build appbundle --release`
2. Upload `.aab` to Google Play Console
3. Set up signing: `keytool -genkey -v -keystore release.jks`
4. Add signing config to `build.gradle`

iOS (requires macOS + Apple Developer account):
1. `flutter build ipa --release`
2. Open in Xcode, archive, upload to App Store Connect
3. TestFlight for beta testing before App Store review

**Fastlane** (automates the manual steps):
```ruby
# Fastfile
lane :deploy_android do
  gradle(task: 'bundle', build_type: 'Release')
  upload_to_play_store(track: 'internal')
end

lane :deploy_ios do
  build_app(scheme: 'Runner')
  upload_to_testflight
end
```

**App versioning:**
```yaml
# pubspec.yaml
version: 1.2.0+15
# format: major.minor.patch+buildNumber
# 1.2.0 = user-facing version shown in stores
# 15 = build number, must increment every upload
```

---

## Week 27 — Capstone: Chat App

**Your portfolio centerpiece. Build this end-to-end.**

**Features:**
- Real-time messaging (Firebase Firestore + Realtime Database)
- User auth (email + Google)
- 1-on-1 DMs and group chats
- Media sharing (images from camera + gallery)
- Message status (sent ✓, delivered ✓✓, read ✓✓ in blue)
- Push notifications (Firebase Cloud Messaging)
- Online/offline presence indicator
- Message reactions (emoji long-press)
- Reply to a specific message (quoted reply)

**Technical architecture:**
```
Clean Architecture + BLoC
Firebase: Auth + Firestore (messages) + Storage (media) + FCM (notifications)
Riverpod: for auth state + theme + settings
Hive: message cache for offline viewing
```

**Screens:**
1. Splash → Auth check → Home or Login
2. Login / Register / Google Sign-In
3. Chats List (all conversations, sorted by latest message)
4. Chat Screen (message list + input bar + attachment button)
5. User Profile (view another user's profile)
6. Group Create (select members, set name and photo)
7. Settings (notification preferences, theme, account)

**Chat message data model:**
```dart
class Message {
  final String id;
  final String senderId;
  final String content;
  final MessageType type; // text, image, audio
  final MessageStatus status; // sent, delivered, read
  final String? replyToId;
  final Map<String, List<String>> reactions; // emoji → [userId]
  final DateTime sentAt;
  final bool isDeleted;
}
```

**Shipping criteria:**
- [ ] Runs without crash on Android and iOS
- [ ] All screens complete
- [ ] Push notifications work
- [ ] Media upload works
- [ ] Test coverage > 60% for domain layer
- [ ] GitHub Actions CI passes
- [ ] App is in TestFlight or Google Play internal testing
- [ ] Video walkthrough recorded (for portfolio)

---

## Final Portfolio Checklist

After Week 27, you have:

| Project | Status | Skills Demonstrated |
|---------|--------|---------------------|
| Profile App | Done | Dart, Flutter basics, navigation, theming |
| Shopping UI | Done | Advanced layouts, forms, animations |
| Weather App | Done | State management, REST APIs, Riverpod |
| Notes App | Done | Firebase, auth, offline storage |
| Expense Tracker | Done | BLoC, Clean Architecture, charts |
| Chat App | Done | Full-stack, real-time, FCM, CI/CD |

You are now a Flutter developer who can build production apps. Not a tutorial completionist. Not a copy-paster. Someone who understands what they're building and why.

---

## What Comes After This Bootcamp

**Deepen your Dart:**
- Dart macros (code generation, coming to mainstream Dart)
- Dart FFI (call native C/C++ code from Dart)

**Platform-specific (building on Week 21's platform channels and Week 25's background processing):**
- Federated plugins (write Flutter plugins that work on all platforms)
- Flutter Web: differences from mobile Flutter, WASM

**Career paths from here:**
- Senior Flutter Developer (deepen architecture, performance expertise)
- Flutter + Backend (add Node.js, Django, or Spring Boot to your stack)
- Mobile Tech Lead (architecture decisions, team enablement)
- Flutter Plugin Developer (contribute to the ecosystem)
- Flutter + ML (TensorFlow Lite, on-device AI models in Flutter)
