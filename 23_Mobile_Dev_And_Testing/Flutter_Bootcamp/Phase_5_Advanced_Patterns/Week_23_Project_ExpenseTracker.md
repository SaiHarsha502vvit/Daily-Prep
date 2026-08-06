# Week 23 — Phase 5 Capstone: Expense Tracker App
### Clean Architecture + BLoC + Custom Charts — everything from Phases 4 & 5 in one production-quality app

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — full dependency graph, BLoC events for every screen, architecture decisions
> - 🎨 **Designer** — information hierarchy, chart readability, data entry UX patterns
> - 🧪 **Tester** — BLoC tests, use case unit tests, golden tests for charts

---

## App Scope

A personal expense tracker with:
- Firebase Auth (email + Google Sign-In from Week 17)
- Firestore for remote storage (Week 16)
- Hive for offline-first local storage (Week 18)
- Clean Architecture (Week 21)
- BLoC for all state management (Week 20)
- Custom donut + bar + line charts (Week 22)
- flutter_animate staggered transitions

**What the user can do:**
1. Add expenses with title, amount, category, date
2. View a dashboard with spending summaries (donut chart, monthly bar chart, 30-day line chart)
3. Filter/search expenses by category or date range
4. See per-category spending totals
5. Works offline — syncs when back online

---

## Why Expense Tracking Is the Phase 5 Capstone Domain

### Envelope Budgeting (1950s) → YNAB (2004) → Your App

In the 1950s, before credit cards were common, many families used **envelope budgeting**: physically divide the paycheck into envelopes labeled "Rent," "Food," "Transport," "Entertainment." When the Food envelope is empty, you stop buying food until next payday. The physical constraint made the abstract concept of "spending within budget" viscerally real.

**YNAB** (You Need A Budget, Jesse Mecham, 2004) digitized this: virtual "envelopes," real-time balance tracking, mobile apps. YNAB charges $99/year and in 2024 has hundreds of thousands of paying subscribers who consistently report changing their relationship with money. People pay $99/year for a category picker and a bar chart. The product is the behavior change, not the software.

The apps that fail (most of them): **data entry friction kills habit formation**. If logging an expense takes 10 taps, users stop doing it by week 2. YNAB survived by making entry as fast as possible and then adding the analysis layer. This is the UX constraint that shapes this project: the expense input form must be under 3 taps from home screen to saved.

### Why This Project Requires the Full Phase 5 Architecture

Every Phase 5 topic was chosen because expense tracking genuinely needs it — not because it's a good teaching exercise:

```
Clean Architecture (Week 21)
  → Firestore layer must be swappable (you might move from Firebase to a REST API)
  → The domain UseCase for "add expense" must not know about Firestore
  
BLoC (Week 20)
  → Every user action is auditable: AddExpenseEvent, FilterByDateEvent, SyncEvent
  → Enterprise apps need an explicit event log for debugging and analytics
  
CustomPainter Charts (Week 22)
  → The donut chart showing category breakdown requires raw drawing — no widget does this
  → The monthly bar chart for trend analysis is the #1 feature users actually look at
  
Platform-level background sync (Week 25, optional)
  → If the user adds an expense while offline and then closes the app, it must sync
  → WorkManager / BGTaskScheduler are how that sync survives app closure
```

The architecture is not over-engineering. Every layer earns its place.

---

## Architecture at a Glance

```
lib/
  core/
    di/injection_container.dart
    error/failures.dart
    router/app_router.dart
  features/
    auth/
      presentation/screens/ (LoginScreen, RegisterScreen from Week 17)
      domain/               (entities, repo interface, use cases)
      data/                 (firebase impl, model)
    expenses/
      presentation/
        screens/
          dashboard_screen.dart
          expense_list_screen.dart
          add_expense_screen.dart
          category_detail_screen.dart
        bloc/
          expense_bloc.dart + events + states
          dashboard_bloc.dart + events + states
        widgets/
          expense_tile.dart
          summary_card.dart
          donut_chart.dart
          bar_chart.dart
          line_chart.dart
          category_legend.dart
          add_expense_fab.dart
      domain/
        entities/expense.dart
        repositories/expense_repository.dart
        usecases/
          get_expenses.dart
          watch_expenses.dart
          add_expense.dart
          update_expense.dart
          delete_expense.dart
          get_monthly_summary.dart
          get_spending_trend.dart
      data/
        models/expense_model.dart
        datasources/
          expense_remote_datasource.dart    (Firebase)
          expense_local_datasource.dart     (Hive)
        repositories/expense_repository_impl.dart
  main.dart
```

---

## Domain Layer

```dart
// lib/features/expenses/domain/entities/expense.dart
class Expense {
  final String id;
  final String userId;
  final String title;
  final double amount;
  final DateTime date;
  final ExpenseCategory category;
  final String? note;

  const Expense({
    required this.id,
    required this.userId,
    required this.title,
    required this.amount,
    required this.date,
    required this.category,
    this.note,
  });

  bool get isRecent => DateTime.now().difference(date).inDays < 7;
  String get formattedAmount => '₹${amount.toStringAsFixed(2)}';
  String get monthKey => '${date.year}-${date.month.toString().padLeft(2, '0')}';

  Expense copyWith({
    String? title,
    double? amount,
    DateTime? date,
    ExpenseCategory? category,
    String? note,
  }) => Expense(
    id: id,
    userId: userId,
    title: title ?? this.title,
    amount: amount ?? this.amount,
    date: date ?? this.date,
    category: category ?? this.category,
    note: note ?? this.note,
  );

  @override
  bool operator ==(Object other) => other is Expense && other.id == id;
  @override
  int get hashCode => id.hashCode;
}

enum ExpenseCategory {
  food, transport, entertainment, utilities, health, shopping, other;

  String get label => switch (this) {
    food => 'Food',
    transport => 'Transport',
    entertainment => 'Entertainment',
    utilities => 'Utilities',
    health => 'Health',
    shopping => 'Shopping',
    other => 'Other',
  };

  Color get color => switch (this) {
    food => const Color(0xFF4CAF50),
    transport => const Color(0xFF2196F3),
    entertainment => const Color(0xFFFF9800),
    utilities => const Color(0xFF9C27B0),
    health => const Color(0xFFE91E63),
    shopping => const Color(0xFFFF5722),
    other => const Color(0xFF607D8B),
  };

  IconData get icon => switch (this) {
    food => Icons.restaurant,
    transport => Icons.directions_car,
    entertainment => Icons.movie,
    utilities => Icons.bolt,
    health => Icons.favorite,
    shopping => Icons.shopping_bag,
    other => Icons.receipt,
  };
}
```

```dart
// lib/features/expenses/domain/usecases/get_spending_trend.dart
// Returns daily totals for the last N days — powers the line chart

class GetSpendingTrend implements UseCase<SpendingTrend, TrendParams> {
  final ExpenseRepository _repo;
  const GetSpendingTrend(this._repo);

  @override
  Future<SpendingTrend> call(TrendParams params) async {
    final end = DateTime.now();
    final start = end.subtract(Duration(days: params.days - 1));
    final expenses = await _repo.getExpensesBetween(start, end);

    // Build a map of date → total
    final dailyTotals = <DateTime, double>{};
    for (int i = 0; i < params.days; i++) {
      final day = DateTime(start.year, start.month, start.day + i);
      dailyTotals[day] = 0;
    }

    for (final expense in expenses) {
      final day = DateTime(expense.date.year, expense.date.month, expense.date.day);
      dailyTotals[day] = (dailyTotals[day] ?? 0) + expense.amount;
    }

    final sortedDays = dailyTotals.keys.toList()..sort();
    return SpendingTrend(
      days: sortedDays,
      totals: sortedDays.map((d) => dailyTotals[d]!).toList(),
      average: dailyTotals.values.isEmpty ? 0 : dailyTotals.values.reduce((a, b) => a + b) / params.days,
    );
  }
}

class TrendParams { final int days; const TrendParams({this.days = 30}); }

class SpendingTrend {
  final List<DateTime> days;
  final List<double> totals;
  final double average;
  const SpendingTrend({required this.days, required this.totals, required this.average});
}
```

---

## BLoC Layer

```dart
// DASHBOARD BLoC — powers the summary screen
// Events
sealed class DashboardEvent {}
class LoadDashboardEvent extends DashboardEvent { final int year, month; const LoadDashboardEvent(this.year, this.month); }
class RefreshDashboardEvent extends DashboardEvent {}

// States
sealed class DashboardState {}
class DashboardInitial extends DashboardState {}
class DashboardLoading extends DashboardState {}
class DashboardLoaded extends DashboardState {
  final MonthlySummary summary;
  final SpendingTrend trend;
  final List<Expense> recentExpenses;
  final int year, month;
  const DashboardLoaded({required this.summary, required this.trend, required this.recentExpenses, required this.year, required this.month});
}
class DashboardError extends DashboardState { final String message; const DashboardError(this.message); }

// BLoC
class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  final GetMonthlySummary _getMonthlySummary;
  final GetSpendingTrend _getTrend;
  final GetExpenses _getExpenses;

  DashboardBloc({
    required GetMonthlySummary getMonthlySummary,
    required GetSpendingTrend getTrend,
    required GetExpenses getExpenses,
  })  : _getMonthlySummary = getMonthlySummary,
        _getTrend = getTrend,
        _getExpenses = getExpenses,
        super(DashboardInitial()) {
    on<LoadDashboardEvent>(_onLoad);
    on<RefreshDashboardEvent>((_, emit) => add(LoadDashboardEvent(DateTime.now().year, DateTime.now().month)));
  }

  Future<void> _onLoad(LoadDashboardEvent event, Emitter<DashboardState> emit) async {
    emit(DashboardLoading());
    try {
      // Load all three in parallel — each is independent
      final results = await Future.wait([
        _getMonthlySummary(MonthParams(year: event.year, month: event.month)),
        _getTrend(const TrendParams(days: 30)),
        _getExpenses(const GetExpensesParams(limit: 10)),  // most recent 10
      ]);

      emit(DashboardLoaded(
        summary: results[0] as MonthlySummary,
        trend: results[1] as SpendingTrend,
        recentExpenses: results[2] as List<Expense>,
        year: event.year,
        month: event.month,
      ));
    } catch (e) {
      emit(DashboardError(e.toString()));
    }
  }
}
```

```dart
// EXPENSE BLoC — powers the full expense list + add/edit/delete
sealed class ExpenseEvent {}
class LoadExpensesEvent extends ExpenseEvent { final ExpenseFilter? filter; const LoadExpensesEvent({this.filter}); }
class AddExpenseEvent extends ExpenseEvent {
  final String title; final double amount; final DateTime date; final ExpenseCategory category; final String? note;
}
class UpdateExpenseEvent extends ExpenseEvent { final Expense expense; }
class DeleteExpenseEvent extends ExpenseEvent { final String id; }
class FilterChangedEvent extends ExpenseEvent { final ExpenseFilter filter; }
class SearchChangedEvent extends ExpenseEvent { final String query; }

class ExpenseFilter {
  final ExpenseCategory? category;
  final DateTimeRange? dateRange;
  final String query;
  const ExpenseFilter({this.category, this.dateRange, this.query = ''});
}

sealed class ExpenseState {}
class ExpenseInitial extends ExpenseState {}
class ExpenseLoading extends ExpenseState {}
class ExpenseLoaded extends ExpenseState {
  final List<Expense> all;
  final List<Expense> filtered;
  final ExpenseFilter filter;
  final bool isDeleting;
  ExpenseLoaded({required this.all, required this.filtered, required this.filter, this.isDeleting = false});

  ExpenseLoaded copyWith({List<Expense>? all, List<Expense>? filtered, ExpenseFilter? filter, bool? isDeleting}) =>
      ExpenseLoaded(
        all: all ?? this.all,
        filtered: filtered ?? this.filtered,
        filter: filter ?? this.filter,
        isDeleting: isDeleting ?? this.isDeleting,
      );
}
class ExpenseError extends ExpenseState { final String message; const ExpenseError(this.message); }
class ExpenseAdded extends ExpenseState { final Expense expense; const ExpenseAdded(this.expense); }

class ExpenseBloc extends Bloc<ExpenseEvent, ExpenseState> {
  final GetExpenses _getExpenses;
  final AddExpense _addExpense;
  final UpdateExpense _updateExpense;
  final DeleteExpense _deleteExpense;

  ExpenseBloc({
    required GetExpenses getExpenses,
    required AddExpense addExpense,
    required UpdateExpense updateExpense,
    required DeleteExpense deleteExpense,
  })  : _getExpenses = getExpenses,
        _addExpense = addExpense,
        _updateExpense = updateExpense,
        _deleteExpense = deleteExpense,
        super(ExpenseInitial()) {
    on<LoadExpensesEvent>(_onLoad);
    on<AddExpenseEvent>(_onAdd);
    on<UpdateExpenseEvent>(_onUpdate);
    on<DeleteExpenseEvent>(_onDelete);
    on<FilterChangedEvent>(_onFilterChanged);
    on<SearchChangedEvent>(_onSearch);
  }

  Future<void> _onLoad(LoadExpensesEvent event, Emitter<ExpenseState> emit) async {
    emit(ExpenseLoading());
    try {
      final expenses = await _getExpenses(const GetExpensesParams());
      final filter = event.filter ?? const ExpenseFilter();
      emit(ExpenseLoaded(all: expenses, filtered: _applyFilter(expenses, filter), filter: filter));
    } catch (e) {
      emit(ExpenseError(e.toString()));
    }
  }

  Future<void> _onAdd(AddExpenseEvent event, Emitter<ExpenseState> emit) async {
    try {
      await _addExpense(AddExpenseParams(
        title: event.title, amount: event.amount, date: event.date,
        category: event.category, note: event.note,
      ));

      // Reload and emit the newly added state for navigation
      final expenses = await _getExpenses(const GetExpensesParams());
      final current = state is ExpenseLoaded ? (state as ExpenseLoaded).filter : const ExpenseFilter();
      emit(ExpenseLoaded(all: expenses, filtered: _applyFilter(expenses, current), filter: current));
    } on InvalidExpenseException catch (e) {
      emit(ExpenseError(e.message));
    }
  }

  Future<void> _onDelete(DeleteExpenseEvent event, Emitter<ExpenseState> emit) async {
    if (state is! ExpenseLoaded) return;
    final current = state as ExpenseLoaded;

    // Optimistic: remove immediately
    final newAll = current.all.where((e) => e.id != event.id).toList();
    emit(current.copyWith(all: newAll, filtered: _applyFilter(newAll, current.filter), isDeleting: true));

    try {
      await _deleteExpense(DeleteExpenseParams(id: event.id));
      emit((state as ExpenseLoaded).copyWith(isDeleting: false));
    } catch (_) {
      emit(current);  // restore
    }
  }

  void _onFilterChanged(FilterChangedEvent event, Emitter<ExpenseState> emit) {
    if (state is! ExpenseLoaded) return;
    final current = state as ExpenseLoaded;
    emit(current.copyWith(filter: event.filter, filtered: _applyFilter(current.all, event.filter)));
  }

  void _onSearch(SearchChangedEvent event, Emitter<ExpenseState> emit) {
    if (state is! ExpenseLoaded) return;
    final current = state as ExpenseLoaded;
    final newFilter = ExpenseFilter(category: current.filter.category, dateRange: current.filter.dateRange, query: event.query);
    emit(current.copyWith(filter: newFilter, filtered: _applyFilter(current.all, newFilter)));
  }

  List<Expense> _applyFilter(List<Expense> all, ExpenseFilter filter) {
    return all.where((e) {
      if (filter.category != null && e.category != filter.category) return false;
      if (filter.query.isNotEmpty && !e.title.toLowerCase().contains(filter.query.toLowerCase())) return false;
      if (filter.dateRange != null) {
        if (e.date.isBefore(filter.dateRange!.start) || e.date.isAfter(filter.dateRange!.end)) return false;
      }
      return true;
    }).toList();
  }
}
```

---

## Presentation Layer

```dart
// lib/features/expenses/presentation/screens/dashboard_screen.dart

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<DashboardBloc>()
        ..add(LoadDashboardEvent(DateTime.now().year, DateTime.now().month)),
      child: const _DashboardView(),
    );
  }
}

class _DashboardView extends StatelessWidget {
  const _DashboardView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<DashboardBloc, DashboardState>(
        builder: (context, state) {
          return switch (state) {
            DashboardInitial() || DashboardLoading() => const _DashboardSkeleton(),
            DashboardError(:final message) => _ErrorView(message: message,
                onRetry: () => context.read<DashboardBloc>().add(RefreshDashboardEvent())),
            DashboardLoaded() => _DashboardContent(state: state),
          };
        },
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  final DashboardLoaded state;
  const _DashboardContent({required this.state});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => context.read<DashboardBloc>().add(RefreshDashboardEvent()),
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                _monthLabel(state.year, state.month),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.calendar_month),
                onPressed: () => _pickMonth(context),
              ),
              IconButton(
                icon: const Icon(Icons.person),
                onPressed: () => Navigator.pushNamed(context, '/profile'),
              ),
            ],
          ),

          // Total spending hero
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Total Spent', style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 4),
                  Text(
                    state.summary.total == 0
                        ? '₹0.00'
                        : '₹${state.summary.total.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.3),
                  const SizedBox(height: 4),
                  Text(
                    'Daily avg: ₹${state.trend.average.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ),

          // Donut chart + legend
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('By Category', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 16),
                      if (state.summary.breakdown.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text('No expenses this month'),
                          ),
                        )
                      else
                        Row(
                          children: [
                            ExpenseDonutChart(breakdown: state.summary.breakdown),
                            const SizedBox(width: 16),
                            Expanded(
                              child: CategoryLegend(
                                breakdown: state.summary.breakdown,
                                total: state.summary.total,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // 30-day spending trend line chart
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('30-Day Trend', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 12),
                      SpendingLineChart(trend: state.trend),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Recent expenses header
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
            sliver: SliverToBoxAdapter(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Recent', style: Theme.of(context).textTheme.titleMedium),
                  TextButton(
                    onPressed: () => Navigator.pushNamed(context, '/expenses'),
                    child: const Text('View all'),
                  ),
                ],
              ),
            ),
          ),

          // Recent expense tiles
          SliverList.builder(
            itemCount: state.recentExpenses.length,
            itemBuilder: (context, index) {
              final expense = state.recentExpenses[index];
              return ExpenseTile(expense: expense)
                  .animate(delay: (index * 50).ms)
                  .fadeIn(duration: 300.ms)
                  .slideX(begin: 0.05, end: 0);
            },
          ),

          const SliverPadding(padding: EdgeInsets.only(bottom: 100)),  // FAB clearance
        ],
      ),
    );
  }

  String _monthLabel(int year, int month) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${months[month - 1]} $year';
  }

  void _pickMonth(BuildContext context) async {
    // Show a month picker dialog and dispatch LoadDashboardEvent
  }
}
```

```dart
// lib/features/expenses/presentation/screens/add_expense_screen.dart

class AddExpenseScreen extends StatefulWidget {
  final Expense? expenseToEdit;  // null = new, not null = edit mode
  const AddExpenseScreen({super.key, this.expenseToEdit});

  @override
  State<AddExpenseScreen> createState() => _AddExpenseScreenState();
}

class _AddExpenseScreenState extends State<AddExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleCtrl;
  late final TextEditingController _amountCtrl;
  late final TextEditingController _noteCtrl;
  late ExpenseCategory _category;
  late DateTime _date;
  final _amountFocus = FocusNode();
  final _noteFocus = FocusNode();

  bool get _isEditing => widget.expenseToEdit != null;

  @override
  void initState() {
    super.initState();
    final e = widget.expenseToEdit;
    _titleCtrl = TextEditingController(text: e?.title ?? '');
    _amountCtrl = TextEditingController(text: e != null ? e.amount.toStringAsFixed(2) : '');
    _noteCtrl = TextEditingController(text: e?.note ?? '');
    _category = e?.category ?? ExpenseCategory.food;
    _date = e?.date ?? DateTime.now();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _amountCtrl.dispose();
    _noteCtrl.dispose();
    _amountFocus.dispose();
    _noteFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<ExpenseBloc, ExpenseState>(
      listener: (context, state) {
        if (state is ExpenseLoaded) {
          Navigator.pop(context);  // close after save
        }
        if (state is ExpenseError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message), backgroundColor: Colors.red),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(title: Text(_isEditing ? 'Edit Expense' : 'Add Expense')),
        body: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(labelText: 'What did you spend on?', border: OutlineInputBorder()),
                textInputAction: TextInputAction.next,
                onFieldSubmitted: (_) => _amountFocus.requestFocus(),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountCtrl,
                focusNode: _amountFocus,
                decoration: const InputDecoration(
                  labelText: 'Amount (₹)',
                  border: OutlineInputBorder(),
                  prefixText: '₹ ',
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textInputAction: TextInputAction.next,
                onFieldSubmitted: (_) => _noteFocus.requestFocus(),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  final amt = double.tryParse(v);
                  if (amt == null || amt <= 0) return 'Enter a valid amount';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Category selector — horizontal scrollable chips
              Text('Category', style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ExpenseCategory.values.map((cat) {
                    final selected = cat == _category;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        avatar: Icon(cat.icon, size: 16, color: selected ? Colors.white : cat.color),
                        label: Text(cat.label),
                        selected: selected,
                        selectedColor: cat.color,
                        labelStyle: TextStyle(color: selected ? Colors.white : null),
                        onSelected: (_) => setState(() => _category = cat),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 16),

              // Date picker
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.calendar_today),
                title: Text(DateFormat('d MMM yyyy').format(_date)),
                subtitle: const Text('Date'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _date,
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now(),
                  );
                  if (picked != null) setState(() => _date = picked);
                },
              ),
              const Divider(),

              TextFormField(
                controller: _noteCtrl,
                focusNode: _noteFocus,
                decoration: const InputDecoration(labelText: 'Note (optional)', border: OutlineInputBorder()),
                maxLines: 2,
                textInputAction: TextInputAction.done,
              ),
              const SizedBox(height: 32),

              FilledButton.icon(
                onPressed: _submit,
                icon: const Icon(Icons.check),
                label: Text(_isEditing ? 'Update Expense' : 'Save Expense'),
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    final amount = double.parse(_amountCtrl.text);

    if (_isEditing) {
      context.read<ExpenseBloc>().add(UpdateExpenseEvent(
        widget.expenseToEdit!.copyWith(
          title: _titleCtrl.text.trim(),
          amount: amount,
          date: _date,
          category: _category,
          note: _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim(),
        ),
      ));
    } else {
      context.read<ExpenseBloc>().add(AddExpenseEvent(
        title: _titleCtrl.text.trim(),
        amount: amount,
        date: _date,
        category: _category,
        note: _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim(),
      ));
    }
  }
}
```

---

## ExpenseTile Widget

```dart
class ExpenseTile extends StatelessWidget {
  final Expense expense;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;

  const ExpenseTile({super.key, required this.expense, this.onTap, this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(expense.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        color: Theme.of(context).colorScheme.error,
        padding: const EdgeInsets.only(right: 24),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      confirmDismiss: (_) async {
        return await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Delete expense?'),
            content: Text('Delete "${expense.title}"?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
                child: const Text('Delete'),
              ),
            ],
          ),
        );
      },
      onDismissed: (_) => onDelete?.call(),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: expense.category.color.withValues(alpha: 0.15),
          child: Icon(expense.category.icon, color: expense.category.color, size: 20),
        ),
        title: Text(expense.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(DateFormat('d MMM').format(expense.date)),
        trailing: Text(
          expense.formattedAmount,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
```

---

## Testing

```dart
// test/features/expenses/bloc/expense_bloc_test.dart
import 'package:bloc_test/bloc_test.dart';

void main() {
  late MockGetExpenses mockGet;
  late MockAddExpense mockAdd;
  late MockDeleteExpense mockDelete;

  setUp(() {
    mockGet = MockGetExpenses();
    mockAdd = MockAddExpense();
    mockDelete = MockDeleteExpense();
  });

  group('LoadExpensesEvent', () {
    blocTest<ExpenseBloc, ExpenseState>(
      'emits [Loading, Loaded] with expenses when successful',
      build: () {
        when(mockGet(any)).thenAnswer((_) async => [
          const Expense(id: '1', userId: 'u1', title: 'Coffee', amount: 80, date: DateTime.now(), category: ExpenseCategory.food),
        ]);
        return ExpenseBloc(getExpenses: mockGet, addExpense: mockAdd, updateExpense: MockUpdateExpense(), deleteExpense: mockDelete);
      },
      act: (bloc) => bloc.add(LoadExpensesEvent()),
      expect: () => [
        isA<ExpenseLoading>(),
        isA<ExpenseLoaded>().having((s) => s.all.length, 'expense count', 1),
      ],
    );
  });

  group('DeleteExpenseEvent — optimistic update', () {
    final expenses = [
      const Expense(id: '1', userId: 'u1', title: 'Coffee', amount: 80, date: DateTime(2026, 6, 1), category: ExpenseCategory.food),
      const Expense(id: '2', userId: 'u1', title: 'Bus', amount: 40, date: DateTime(2026, 6, 1), category: ExpenseCategory.transport),
    ];

    blocTest<ExpenseBloc, ExpenseState>(
      'removes expense optimistically then confirms',
      seed: () => ExpenseLoaded(all: expenses, filtered: expenses, filter: const ExpenseFilter()),
      build: () {
        when(mockDelete(any)).thenAnswer((_) async {});
        return ExpenseBloc(getExpenses: mockGet, addExpense: mockAdd, updateExpense: MockUpdateExpense(), deleteExpense: mockDelete);
      },
      act: (bloc) => bloc.add(DeleteExpenseEvent(id: '1')),
      expect: () => [
        isA<ExpenseLoaded>().having((s) => s.all.length, 'count after delete', 1),
      ],
    );
  });
}
```

---

## Dependency Injection — Full Registration

```dart
Future<void> setupDI() async {
  // Firebase
  sl.registerLazySingleton(() => FirebaseFirestore.instance);
  sl.registerLazySingleton(() => FirebaseAuth.instance);

  // Data sources
  sl.registerLazySingleton<ExpenseRemoteDatasource>(() => ExpenseFirebaseDatasource(sl(), sl()));
  sl.registerLazySingleton<ExpenseLocalDatasource>(() => ExpenseHiveDatasource());

  // Repositories
  sl.registerLazySingleton<ExpenseRepository>(() => ExpenseRepositoryImpl(remote: sl(), local: sl()));

  // Use cases
  sl.registerLazySingleton(() => GetExpenses(sl()));
  sl.registerLazySingleton(() => AddExpense(sl()));
  sl.registerLazySingleton(() => UpdateExpense(sl()));
  sl.registerLazySingleton(() => DeleteExpense(sl()));
  sl.registerLazySingleton(() => GetMonthlySummary(sl()));
  sl.registerLazySingleton(() => GetSpendingTrend(sl()));

  // BLoCs
  sl.registerFactory(() => ExpenseBloc(
    getExpenses: sl(), addExpense: sl(), updateExpense: sl(), deleteExpense: sl(),
  ));
  sl.registerFactory(() => DashboardBloc(
    getMonthlySummary: sl(), getTrend: sl(), getExpenses: sl(),
  ));
  sl.registerFactory(() => AuthBloc(sl()));

  // Shared preferences
  final prefs = await SharedPreferences.getInstance();
  sl.registerLazySingleton(() => prefs);
}
```

---

## What You Built in Phase 5

| Concept | Where used |
|--|--|
| BLoC + Events/States | `ExpenseBloc`, `DashboardBloc`, `AuthBloc` |
| Cubit | `ThemeCubit` (from Week 20 lab) |
| Clean Architecture | All 3 layers: domain entities, use cases, data impl |
| get_it DI | `injection_container.dart` — full app wiring |
| SOLID principles | Dependency inversion on every repository + datasource |
| CustomPainter | `ExpenseDonutPainter`, `MonthlyBarChartPainter`, `SpendingLinePainter` |
| flutter_animate | Staggered list, hero amounts, chart fade-ins |
| Offline-first | Hive local + Firestore remote + sync service |

---

## Enterprise Challenges

> 🏢 **Enterprise Reality:**
> *"The Expense Tracker is your first full-stack production app. These challenges take it from 'works on my machine' to 'ready for 10,000 users.'"*

**1. Structured Error Handling**
Replace all raw `try/catch` with the `sealed class AppFailure` pattern from Week 1. Every Dio call in `ExpenseRemoteDatasource` should return `Result<T>` — never throw. The BLoC maps `Failure` to user-friendly messages.

**2. BLoC Observer + Crashlytics Breadcrumbs**
Add `AppBlocObserver` from Week 20. Every `onTransition` writes a Sentry breadcrumb. When a crash happens, the Sentry dashboard shows the last 10 BLoC transitions that led to it.

**3. Feature Flag: New Dashboard**
Gate the `SpendingLinePainter` chart behind a Firebase Remote Config flag `enable_trend_chart`. 50% of users see the old view (donut + bar only), 50% see the trend chart. Measure engagement via analytics events.

**4. Database Migration**
The `ExpenseHiveModel` needs a new `receiptUrl` field. Write the migration so users upgrading from version 1 don't lose data. Test by pre-populating Hive with v1 data and verifying v2 reads succeed.

**5. Offline-First Sync with Conflict Resolution**
Currently, offline writes use a `pendingSync` boolean. Upgrade to `SyncStatus` enum (synced/pendingCreate/pendingUpdate/pendingDelete) from Week 16. Add a `ConflictResolver` that handles the case where an expense was edited on two devices.

**6. Contract Test**
Write a contract test that hits your staging Firestore (or a mock API) and validates the JSON schema matches `Expense.fromJson`. Tag it `@Tags(['contract'])` and run it separately from unit tests.

---

## Week 23 Verify — Project Self-Review

1. Trace the full flow when a user adds an expense while offline: tap "Save" → what fires in the BLoC → what writes to Hive → what happens when connectivity returns?
2. `ExpenseBloc` receives `DeleteExpenseEvent`. The BLoC optimistically removes the item from the UI state. The server returns an error. How do you restore the item? Write the state sequence.
3. `GetMonthlySummary` is a use case, not a repository method. Why? What computation does it do that doesn't belong in the data layer?
4. The `injection_container.dart` registers BLoCs with `registerFactory` but repositories with `registerLazySingleton`. Why the different registration types?
5. The donut chart renders category percentages. A user has expenses in 12 categories. The chart becomes unreadable. What design pattern solves this? (Hint: group small categories.)
6. Your `ExpenseFirebaseDatasource` catches `FirebaseException` and maps it to `AppFailure`. A new developer adds a raw `throw Exception('something broke')` in the repository. What breaks downstream? How does the sealed error hierarchy prevent this?
7. The `DashboardBloc` depends on `GetMonthlySummary`, `GetSpendingTrend`, and `GetExpenses` — three use cases. How do you write a `blocTest` that mocks all three? Show the test setup.

---

## Phase 5 Complete — Up Next: Phase 6 (Quality)

Phase 6 is about making this app production-ready:
- Week 24: Unit tests, widget tests, integration tests, BLoC testing
- Week 25: Performance — DevTools, rebuild analysis, const optimization
- Week 26: CI/CD — GitHub Actions, automated builds, deployment
- Week 27: Chat App capstone with FCM and real-time messaging

**Want to actually get fluent, not just informed?** → [Expense Tracker Challenges](Week_23b_ExpenseTracker_Challenges.md) — extend, break, and stress-test the actual app you just built.

---

**Next → [Week 24: Testing](../Phase_6_Quality_and_Deployment/Week_24_Testing.md)**
