# Expense Tracker — Project Challenges

### Companion to [Week 23: Project — Expense Tracker](Week_23_Project_ExpenseTracker.md)

---

## How This Works

These dig into the actual `DashboardBloc` and `ExpenseBloc` you built — a real `Future.wait` failure mode hiding in the dashboard loader, the search/filter event distinction, and an animated chart Boss Battle to close out Phase 5. Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — One Failed Call Blanks the Entire Dashboard

This project's own `DashboardBloc._onLoad`:

```dart
Future<void> _onLoad(LoadDashboardEvent event, Emitter<DashboardState> emit) async {
  emit(DashboardLoading());
  try {
    final results = await Future.wait([
      _getMonthlySummary(MonthParams(year: event.year, month: event.month)),
      _getTrend(const TrendParams(days: 30)),
      _getExpenses(const GetExpensesParams(limit: 10)),
    ]);

    emit(DashboardLoaded(
      summary: results[0] as MonthlySummary,
      trend: results[1] as SpendingTrend,
      recentExpenses: results[2] as List<Expense>,
      year: event.year, month: event.month,
    ));
  } catch (e) {
    emit(DashboardError(e.toString()));
  }
}
```

A brand-new user has exactly one expense logged, ever. `_getTrend`'s 30-day trend calculation throws (say, it requires at least 2 data points to compute a trend line and this user only has 1). `_getMonthlySummary` and `_getExpenses` would have succeeded fine — the user's single expense, correctly totaled, was sitting right there. What does the user actually see on screen?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** the user sees a **completely blank error screen** — `DashboardError`, no summary, no recent expenses list, nothing — even though two of the three independent calls succeeded perfectly. This is [Week 14's `Future.wait` lesson](../Phase_3_State_and_APIs/Week_14b_HTTP_Challenges.md) arriving with real consequences: `Future.wait` completes with the **first error** any of its futures throws, and by default does not wait for or report on the others at all — from the caller's perspective, it's all-or-nothing, regardless of how many of the individual futures would have succeeded. For genuinely independent pieces of data (a summary card, a trend chart, a recent-activity list — none of which actually depend on the others succeeding), that's the wrong failure mode. The fix handles each independently, so one broken piece doesn't take down the working two:

```dart
Future<void> _onLoad(LoadDashboardEvent event, Emitter<DashboardState> emit) async {
  emit(DashboardLoading());

  final summaryResult = await _getMonthlySummary(MonthParams(year: event.year, month: event.month))
      .then<MonthlySummary?>((v) => v).catchError((_) => null);
  final trendResult = await _getTrend(const TrendParams(days: 30))
      .then<SpendingTrend?>((v) => v).catchError((_) => null);
  final expensesResult = await _getExpenses(const GetExpensesParams(limit: 10))
      .then<List<Expense>?>((v) => v).catchError((_) => null);

  if (summaryResult == null && trendResult == null && expensesResult == null) {
    emit(const DashboardError('Failed to load dashboard'));
    return;
  }

  emit(DashboardLoaded(
    summary: summaryResult ?? MonthlySummary.empty(),
    trend: trendResult ?? SpendingTrend.empty(), // e.g., "not enough data yet"
    recentExpenses: expensesResult ?? const [],
    year: event.year, month: event.month,
  ));
}
```

(This runs the three calls sequentially instead of in parallel to keep the `catchError` handling simple to read — a real version would likely use `Future.wait(..., eagerError: false)` combined with individually-wrapped futures to keep the parallelism. The point of this fix isn't the exact syntax, it's the principle: **independent operations shouldn't share a single failure path.**) A brand-new user now sees their real summary and their one real expense, with the trend chart showing an honest "not enough data yet" instead of the whole dashboard going dark over one unrelated calculation.

</details>

---

### 🎭 Two Truths and a Lie — This Project's Event Transformers

**A.** `SearchChangedEvent` fires on every keystroke in a search box — using the default sequential `EventTransformer` for it means a fast typist can queue up several search-and-filter operations that each fully complete before the next one starts, wasting work on intermediate results the user never actually wanted.

**B.** `FilterChangedEvent` (toggling a category filter chip, a single deliberate tap) and `SearchChangedEvent` (continuous typing) should both reasonably use the *same* `EventTransformer` choice, since they both change what's currently displayed.

**C.** Registering `on<SearchChangedEvent>(_onSearchChanged, transformer: restartable())` means a new keystroke's search cancels whatever the *previous* keystroke's search was still in the middle of computing.

<details><summary>Which one's the lie</summary>

**B is the lie.** `FilterChangedEvent` — a single, deliberate tap on a category chip — has no "rapid-fire" problem to solve; the default sequential transformer is completely appropriate for it, because a user isn't going to tap five different category filters within milliseconds of each other the way they type five characters in a search box. `SearchChangedEvent` has the actual [Week 8](../Phase_2_Core_UI/Week_08b_Forms_Challenges.md#w8-3-hard--debounced-async-validation-and-the-race-condition-it-can-hide)/[Week 13](../Phase_3_State_and_APIs/Week_13b_Riverpod_Challenges.md#-bug-hunt--the-search-that-fetches-for-every-keystroke) rapid-input problem this file's siblings already covered — applying the *same* transformer choice to both events, "because they both filter the list," ignores that they have completely different triggering rhythms and therefore different needs.

🔴 **Explanation:** A is true, and describes exactly the waste `restartable()` (mentioned in C, also true) exists to eliminate — `restartable()` cancels the in-flight handler for the previous event the instant a new one of the same type arrives, so only the *most recent* keystroke's search ever actually completes and reaches `emit()`, matching the request-generation-counter pattern taught across this bootcamp's search-debouncing examples.

</details>

---

### 🕵️ Code Review — Does `isDeleting` Actually Do Anything?

This project's `ExpenseLoaded` state already carries an `isDeleting` flag. A teammate's delete handler:

```dart
Future<void> _onDelete(DeleteExpenseEvent event, Emitter<ExpenseState> emit) async {
  final current = state as ExpenseLoaded;
  await _deleteExpense(event.id);
  emit(current.copyWith(all: current.all.where((e) => e.id != event.id).toList()));
  // 💬 Reviewer: "I see `isDeleting` on ExpenseLoaded, but this handler never
  //    sets it. What's it actually for, and should this handler be using it?"
}
```

The reviewer's question again isn't rhetorical. What's the actual gap, and what breaks because of it?

<details><summary>What the reviewer is pointing at, and the fix</summary>

🔴 **Explanation:** `isDeleting` was clearly designed to let the UI show a per-item loading indicator (a spinner replacing the delete icon, the button disabled) *while* `_deleteExpense(event.id)` is awaiting — but this handler never sets it to `true` before the `await`, so the field sits permanently `false`, dead weight in the state class. The concrete user-facing gap: nothing visually indicates a delete is in progress, and — the more serious version of the same gap — nothing stops the user from tapping delete on the *same* item again while the first delete is still in flight, potentially firing `_deleteExpense(event.id)` twice for one item (harmless if the repository's delete is idempotent, a real bug if it isn't). The fix actually uses the field the state class already has:

```dart
Future<void> _onDelete(DeleteExpenseEvent event, Emitter<ExpenseState> emit) async {
  final current = state as ExpenseLoaded;
  emit(current.copyWith(isDeleting: true));
  await _deleteExpense(event.id);
  emit(current.copyWith(
    all: current.all.where((e) => e.id != event.id).toList(),
    isDeleting: false,
  ));
}
```

(A fuller version would track *which specific* item is being deleted, not just a single app-wide flag, since `isDeleting: true` here would disable every delete button simultaneously rather than just the tapped one — worth noticing as a follow-up gap even in this fix.) The lesson: **a field existing on a state class is not the same as that field being wired up to anything** — this is exactly the kind of half-finished plumbing a Code Review is meant to catch before it ships.

</details>

---

### 🏗️ Build It Blind — Duplicate This Expense

No starter code. Spec only:

> Add a "duplicate" quick action to each expense row — tapping it creates a new expense with the same title, amount, and category, but today's date, and immediately opens it in edit mode so the user can adjust before saving. Design this using the *existing* `ExpenseBloc`/`AddExpenseEvent` — don't create a parallel code path.

<details><summary>One reasonable solution</summary>

```dart
void _duplicateExpense(BuildContext context, Expense original) {
  context.read<ExpenseBloc>().add(AddExpenseEvent(
    title: original.title,
    amount: original.amount,
    date: DateTime.now(),
    category: original.category,
    note: original.note,
  ));
  // Listen for the resulting ExpenseAdded state to know the new expense's
  // generated ID, then navigate to its edit screen:
}

// In the widget, a BlocListener alongside the existing BlocBuilder:
BlocListener<ExpenseBloc, ExpenseState>(
  listener: (context, state) {
    if (state is ExpenseAdded) {
      Navigator.push(context, MaterialPageRoute(
        builder: (_) => EditExpenseScreen(expense: state.expense),
      ));
    }
  },
  child: /* existing expense list BlocBuilder */,
)
```

🔴 **Explanation:** the design choice worth having made explicitly — reusing `AddExpenseEvent` rather than inventing a `DuplicateExpenseEvent` — keeps every "how does a new expense get created" question answerable by looking at exactly one event handler, `_onAdd`, instead of two nearly-identical ones that could drift apart over time (validation added to one and forgotten in the other, for instance). The `BlocListener` alongside the existing `BlocBuilder` matters too — this project's core content already distinguishes the two ([Week 20's core content](../Phase_5_Advanced_Patterns/Week_20_BLoC_Pattern.md) on `BlocBuilder` vs `BlocListener`), and navigating on a **new** `ExpenseAdded` state is exactly the one-time-side-effect case `BlocListener` exists for — a `BlocBuilder` would incorrectly attempt to navigate on every rebuild it processes, not just the moment the state actually arrives.

</details>

---

### 👹 Boss Battle — An Animated Category Breakdown

**The spec:** the dashboard shows a pie/donut chart of spending by category (from `DashboardLoaded.summary`). When the user adds a new expense and `DashboardBloc` re-loads, the chart must **animate** from the old category proportions to the new ones — not jump-cut — combining this week's BLoC content with [Week 22's interpolating-chart Boss Battle](../Phase_5_Advanced_Patterns/Week_22b_Advanced_Animation_Challenges.md#-boss-battle--an-interpolating-bar-chart).

<details><summary>One reasonable solution</summary>

```dart
class CategoryPieChart extends StatefulWidget {
  const CategoryPieChart({super.key, required this.breakdown});
  final Map<ExpenseCategory, double> breakdown; // category -> amount
  @override
  State<CategoryPieChart> createState() => _CategoryPieChartState();
}

class _CategoryPieChartState extends State<CategoryPieChart> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
  late Animation<Map<ExpenseCategory, double>> _animation = _makeStaticAnimation(widget.breakdown);

  Animation<Map<ExpenseCategory, double>> _makeStaticAnimation(Map<ExpenseCategory, double> value) =>
      AlwaysStoppedAnimation(value);

  @override
  void didUpdateWidget(covariant CategoryPieChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!mapEquals(oldWidget.breakdown, widget.breakdown)) {
      _animation = _CategoryBreakdownTween(begin: oldWidget.breakdown, end: widget.breakdown)
          .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
      _controller.forward(from: 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) => CustomPaint(
        size: const Size(200, 200),
        painter: PieChartPainter(_animation.value),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

class _CategoryBreakdownTween extends Tween<Map<ExpenseCategory, double>> {
  _CategoryBreakdownTween({required super.begin, required super.end});
  @override
  Map<ExpenseCategory, double> lerp(double t) {
    return {
      for (final category in end!.keys)
        category: (begin![category] ?? 0) + ((end![category] ?? 0) - (begin![category] ?? 0)) * t,
    };
  }
}
```

🔴 **Explanation:** `_CategoryBreakdownTween.lerp` handles a real edge case the simpler `List<double>` version from [Week 22's Boss Battle](../Phase_5_Advanced_Patterns/Week_22b_Advanced_Animation_Challenges.md#-boss-battle--an-interpolating-bar-chart) didn't need to — categories can genuinely **appear or disappear** between two breakdowns (a user's first-ever "Entertainment" expense means that category didn't exist in the *old* map at all), so `begin![category] ?? 0` treats a missing category as animating in from zero rather than throwing a key-not-found error. `didUpdateWidget`'s `mapEquals` check (not the default `Map` `==`, which is identity-based — [T3-4's lesson](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md#t3-4-medium-the-classic-gotcha--correct-equality-for-value-objects) reappearing again) is what correctly triggers a re-animation only when the underlying breakdown data genuinely changed, not on every unrelated rebuild this widget might receive.

</details>

---

**Next → [Week 24: Testing](../Phase_6_Quality_and_Deployment/Week_24_Testing.md)**
