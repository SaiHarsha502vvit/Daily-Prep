# Week 1 — Dart Language
### The programming language Flutter is built on — complete from the ground up

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — syntax, type system, null safety, async patterns
> - 🎨 **Designer** — Dart has language features that make UI code read like design intent
> - 🧪 **Tester** — Dart's type system prevents entire categories of bugs; tests catch the rest

---

## Why Dart?

> 📄 **Flutter Docs:**
> *"Dart is an approachable, portable, and productive language for high-quality apps on any platform. Dart is the programming language Flutter is written in and that you use when writing Flutter apps."*

Dart was designed specifically with two goals Flutter needs:
1. **Fast compilation** — both to native code (mobile/desktop) and JavaScript (web)
2. **Sound null safety** — the compiler enforces that null errors are impossible at runtime

If you know Java, Dart will feel familiar. The major differences are: cleaner syntax, sound null safety built in, first-class functions, and async built on `Future`/`Stream` instead of threads.

---

## 1. Variables and Types

> 📄 **Dart Docs:**
> *"Dart supports type inference. You can explicitly annotate the type of a variable, or let Dart infer the type from the initializer. If you can't or don't want to infer a type, use dynamic."*

```dart
// Explicit typing — you name the type
String name = 'Harsha';
int age = 24;
double height = 5.9;
bool isFlutterDev = true;

// Type inference with var — Dart infers the type, cannot change type later
var city = 'Hyderabad';   // inferred as String
var score = 100;          // inferred as int
// city = 42;  ← compile error: can't assign int to String

// final — set once, cannot reassign
final String platform = 'Flutter';
final startTime = DateTime.now();   // type inferred
// platform = 'Android';  ← compile error

// const — compile-time constant (value known before runtime)
const double pi = 3.14159;
const maxRetries = 3;

// dynamic — opts out of type checking (avoid unless necessary)
dynamic anything = 'a string';
anything = 42;     // OK — dynamic accepts any type
anything = null;   // OK
```

**Rule:** Use `var` for local variables. Use `final` for values set once. Use `const` for compile-time constants. Use explicit types in function signatures and class fields. Avoid `dynamic`.

🧑‍💻 **Developer tip:** `final` vs `const`:
- `final` runs at runtime: `final now = DateTime.now()` — computed when this line runs
- `const` is compile-time: `const pi = 3.14159` — baked into the binary, never computed at runtime

In Flutter, `const` widgets are never rebuilt — the rendering engine skips them. This is a big performance win.

---

## 2. Null Safety — Dart's Superpower

> 📄 **Dart Docs:**
> *"Sound null safety changes the type system so that any reference to an object is guaranteed to be non-null unless that reference is explicitly declared as possibly null. By default, variables cannot be null."*

```dart
// NON-NULLABLE by default — the compiler guarantees this is never null
String name = 'Harsha';    // safe to use .length, .toUpperCase() etc.

// NULLABLE — you explicitly opt in with ?
String? nickname;           // null by default
String? email = null;       // explicitly null

// Null-aware operators
print(nickname?.length);    // null if nickname is null, otherwise the length
print(nickname ?? 'No nickname');   // right side if left is null

// Null assertion — YOU promise it's not null (throws if wrong)
// Only use when you KNOW it cannot be null
String definitelyNotNull = nickname!;   // ← dangerous if wrong, use carefully

// Late — non-nullable but initialized after declaration
// Use in initState() or when you initialize in the constructor body
late String userId;
@override
void initState() {
  super.initState();
  userId = FirebaseAuth.instance.currentUser!.uid;  // assigned before first use
}
```

🧪 **Tester:** Sound null safety means `NullPointerException` is a compile error, not a runtime crash. If your code compiles without `!`, it is guaranteed null-safe. This is why:

```dart
// This is a compile error — not a runtime error
String name;
print(name.length);   // ← ERROR: non-nullable 'name' must be assigned

// This crashes at runtime (avoid !)
String? maybeNull = null;
print(maybeNull!.length);   // ← throws: Null check operator used on a null value
```

**→ Try this:** Create a `String?` variable, assign it `null`, and try to call `.toUpperCase()` directly — watch the compiler error. Then use `?.` and `??` to fix it.

---

## 3. Functions — First-Class in Dart

> 📄 **Dart Docs:**
> *"Dart is a true object-oriented language, so even functions are objects and have a type, Function. This means that functions can be assigned to variables or passed as arguments to other functions."*

```dart
// Named function
int add(int a, int b) {
  return a + b;
}

// Arrow function (expression body — single expression only)
int multiply(int a, int b) => a * b;

// Optional positional parameters (use [] — can omit)
String greet(String name, [String? title]) {
  if (title != null) return 'Hello, $title $name';
  return 'Hello, $name';
}
greet('Harsha');            // 'Hello, Harsha'
greet('Harsha', 'Mr.');     // 'Hello, Mr. Harsha'

// Named parameters (use {} — named when calling)
void createUser({
  required String name,
  required String email,
  int age = 0,          // default value
}) {
  print('$name, $email, $age');
}
createUser(name: 'Harsha', email: 'h@g.com');  // age defaults to 0
createUser(email: 'h@g.com', name: 'Harsha');  // order doesn't matter for named

// Functions as values (typedef / Function type)
typedef Validator = String? Function(String?);

String? emailValidator(String? value) {
  if (value == null || value.isEmpty) return 'Required';
  if (!value.contains('@')) return 'Invalid email';
  return null;
}

Validator myValidator = emailValidator;  // function stored in variable

// Anonymous functions / lambdas
var numbers = [1, 2, 3, 4, 5];
var doubled = numbers.map((n) => n * 2).toList();   // [2, 4, 6, 8, 10]
var evens = numbers.where((n) => n % 2 == 0).toList();  // [2, 4]
```

🎨 **Designer:** Named parameters in Dart make widget constructors read like design specifications:

```dart
// This reads almost like a design spec
Text(
  'Hello World',
  style: TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.blue,
    letterSpacing: 1.2,
  ),
  textAlign: TextAlign.center,
  maxLines: 2,
  overflow: TextOverflow.ellipsis,
)
```

Every Flutter widget constructor uses named parameters — this is why Flutter code is readable without documentation.

---

## 4. Classes — Dart vs Java

> 📄 **Dart Docs:**
> *"Dart is an object-oriented language with classes and mixin-based inheritance. Every object is an instance of a class, and all classes except Null descend from Object."*

```dart
// A Dart class — much cleaner than Java
class Person {
  // Fields — final means set in constructor, never reassigned
  final String name;
  final int age;
  String? bio;   // nullable — can be null

  // Constructor — shorthand syntax with this.
  const Person({required this.name, required this.age, this.bio});

  // Named constructor (multiple constructors in one class)
  Person.anonymous() : name = 'Anonymous', age = 0;

  // Computed property (getter) — no field, computed on access
  bool get isAdult => age >= 18;

  // Method
  String introduce() => 'Hi, I\'m $name, ${isAdult ? "an adult" : "a minor"}';

  // copyWith — immutable pattern (widely used in Flutter)
  Person copyWith({String? name, int? age, String? bio}) {
    return Person(
      name: name ?? this.name,
      age: age ?? this.age,
      bio: bio ?? this.bio,
    );
  }

  // toString, ==, hashCode — override all three for value equality
  @override
  String toString() => 'Person(name: $name, age: $age)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Person && other.name == name && other.age == age;

  @override
  int get hashCode => Object.hash(name, age);
}

// Usage
const harsha = Person(name: 'Harsha', age: 24);
print(harsha.isAdult);    // true
print(harsha.introduce()); // Hi, I'm Harsha, an adult

// copyWith — create a modified copy without mutating the original
final olderHarsha = harsha.copyWith(age: 25, bio: 'Flutter dev');
print(harsha.age);      // 24 — unchanged
print(olderHarsha.age); // 25
```

**Rule:** In Flutter, domain models (Note, User, Product) should be immutable (all fields `final`). Use `copyWith` to create modified copies. This makes state management predictable — state changes create new objects, they don't mutate existing ones.

### Inheritance and Mixins

```dart
// Abstract class — can't be instantiated, defines contract
abstract class Shape {
  double get area;           // subclasses must implement this
  double get perimeter;
  void describe() => print('Area: $area, Perimeter: $perimeter');
}

class Circle extends Shape {
  final double radius;
  const Circle(this.radius);

  @override double get area => 3.14159 * radius * radius;
  @override double get perimeter => 2 * 3.14159 * radius;
}

// Mixin — reusable behavior that multiple classes can use
mixin Serializable {
  Map<String, dynamic> toJson();      // classes using this mixin must implement

  String toJsonString() => jsonEncode(toJson());
}

class Product with Serializable {
  final String name;
  final double price;

  const Product({required this.name, required this.price});

  @override
  Map<String, dynamic> toJson() => {'name': name, 'price': price};
}
```

### Enums — Rich Enums in Dart 3

```dart
// Simple enum
enum Direction { north, south, east, west }

// Rich enum — enums with properties and methods
enum OrderStatus {
  pending('Pending', Colors.orange),
  confirmed('Confirmed', Colors.blue),
  shipped('Shipped', Colors.purple),
  delivered('Delivered', Colors.green),
  cancelled('Cancelled', Colors.red);

  const OrderStatus(this.label, this.color);

  final String label;
  final Color color;

  bool get isFinal => this == delivered || this == cancelled;
}

// Usage in switch
void handleStatus(OrderStatus status) {
  switch (status) {
    case OrderStatus.pending:
      print('Waiting for confirmation');
    case OrderStatus.shipped:
      print('On the way!');
    default:
      print(status.label);
  }
}

// Dart exhaustive switch — no default needed if all cases covered
String statusMessage(OrderStatus status) => switch (status) {
  OrderStatus.pending => 'Your order is pending',
  OrderStatus.confirmed => 'Order confirmed!',
  OrderStatus.shipped => 'On its way!',
  OrderStatus.delivered => 'Delivered!',
  OrderStatus.cancelled => 'Order cancelled',
};
```

---

## 5. Collections — Lists, Sets, Maps

```dart
// List — ordered, allows duplicates
final fruits = ['apple', 'banana', 'cherry'];
fruits.add('date');
fruits.remove('banana');
print(fruits[0]);         // 'apple'
print(fruits.length);     // 3

// List methods — functional style
final numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
final evens = numbers.where((n) => n.isEven).toList();         // [2, 4, 6, 8, 10]
final doubled = numbers.map((n) => n * 2).toList();            // [2, 4, 6, ...]
final sum = numbers.fold(0, (acc, n) => acc + n);             // 55
final first = numbers.firstWhere((n) => n > 5, orElse: () => -1);  // 6
final hasEven = numbers.any((n) => n.isEven);                  // true
final allPositive = numbers.every((n) => n > 0);               // true

// Spread operator — combine lists
final combined = [...evens, ...doubled];

// Collection if / collection for
final showPremium = true;
final menuItems = [
  'Home',
  'Settings',
  if (showPremium) 'Premium',   // only add if condition is true
  for (final n in [1, 2, 3]) 'Item $n',  // add multiple with for
];

// Set — unordered, no duplicates
final tags = {'flutter', 'dart', 'mobile'};
tags.add('flutter');    // no duplicate added
print(tags.length);     // 3

// Map — key/value pairs
final scores = {'Alice': 95, 'Bob': 87, 'Charlie': 92};
print(scores['Alice']);         // 95
print(scores['Unknown']);       // null — key not found
print(scores['Unknown'] ?? 0);  // 0 — safe access

// Iterate a Map
scores.forEach((name, score) => print('$name: $score'));
scores.entries.map((e) => '${e.key} scored ${e.value}').toList();

// Map operations
final keys = scores.keys.toList();
final values = scores.values.toList();
final hasAlice = scores.containsKey('Alice');
```

🎨 **Designer:** Collection-if and collection-for make widget lists read like UI logic:

```dart
Column(
  children: [
    HomeCard(),
    if (user.isPremium) PremiumBanner(),       // conditional widget
    if (hasNotifications) NotificationBell(),
    for (final tab in tabs) TabItem(tab: tab), // list of widgets
    const Divider(),
    SettingsButton(),
  ],
)
```

---

## 6. Async Dart — Future and Stream

> 📄 **Dart Docs:**
> *"Asynchronous programming in Dart uses the Future and Stream classes. A Future represents the result of an asynchronous operation. A Stream provides a sequence of asynchronous events."*

```dart
// Future — a value that will be available at some point
// Like a "promise" in JavaScript

// Return type: Future<String> means "will eventually return a String"
Future<String> fetchUserName(String userId) async {
  // await suspends this function until the future completes
  // But Dart's event loop continues running — other code can execute
  final response = await http.get(Uri.parse('/api/user/$userId'));
  final data = jsonDecode(response.body);
  return data['name'] as String;
}

// Using a Future
Future<void> loadProfile() async {
  try {
    final name = await fetchUserName('123');
    print('User: $name');
  } catch (e) {
    print('Error: $e');
  }
}

// Future.wait — run multiple futures in parallel
Future<void> loadDashboard() async {
  // These run AT THE SAME TIME, not one after the other
  final results = await Future.wait([
    fetchUserName('123'),
    fetchUserProfile('123'),
    fetchUserPosts('123'),
  ]);
  // Only continues after ALL THREE complete
}

// Stream — multiple values over time
// Like an async Iterator — emits events as they happen

// A stream that emits a new value every second
Stream<int> countdown(int from) async* {
  for (int i = from; i >= 0; i--) {
    await Future.delayed(const Duration(seconds: 1));
    yield i;    // yield emits a value to the stream
  }
}

// Listening to a stream
final subscription = countdown(5).listen((value) {
  print(value);   // prints 5, 4, 3, 2, 1, 0
});

// Cancel when done (important for avoiding memory leaks)
subscription.cancel();

// StreamController — create a stream manually and push values
final controller = StreamController<String>();
controller.stream.listen((message) => print(message));
controller.add('Hello');   // push a value
controller.add('World');
await controller.close();  // close the stream when done
```

🧪 **Tester:** Testing async code in Flutter:

```dart
test('fetchUserName returns the correct name', () async {
  // await inside a test — completely fine
  final name = await fetchUserName('123');
  expect(name, equals('Harsha'));
});

testWidgets('shows loading then data', (tester) async {
  await tester.pumpWidget(MaterialApp(home: ProfileScreen()));
  expect(find.byType(CircularProgressIndicator), findsOneWidget);

  await tester.pumpAndSettle();   // wait for all futures to complete
  expect(find.text('Harsha'), findsOneWidget);
});
```

---

## 7. String Interpolation and String Manipulation

```dart
final name = 'Harsha';
final age = 24;

// String interpolation — $ for variables, ${} for expressions
print('Hello, $name!');                     // Hello, Harsha!
print('Age: ${age + 1}');                   // Age: 25
print('Uppercase: ${name.toUpperCase()}');  // Uppercase: HARSHA

// Multi-line strings
final bio = '''
Flutter developer
from Hyderabad, India.
Building beautiful apps.
''';

// Raw strings — backslashes are literal
final path = r'C:\Users\harsha\documents';  // r prefix = raw string

// Common String methods
print('hello world'.split(' '));     // ['hello', 'world']
print('  hello  '.trim());           // 'hello'
print('hello'.contains('ell'));      // true
print('hello world'.replaceAll('o', '0'));  // 'hell0 w0rld'
print('hello'.startsWith('he'));     // true
print('abc'.padLeft(5, '0'));        // '00abc'

// String building
final buffer = StringBuffer();
for (final word in ['Flutter', 'is', 'awesome']) {
  buffer.write(word);
  buffer.write(' ');
}
print(buffer.toString().trim());   // 'Flutter is awesome'
```

---

## 8. Sealed Classes and Pattern Matching (Dart 3)

> 📄 **Dart Docs:**
> *"Sealed classes are used to create exhaustive type hierarchies. You can only extend or implement a sealed class in the same library, allowing the compiler to be aware of all possible subtypes."*

```dart
// Sealed class — all subclasses defined in this file
// Compiler enforces you handle all cases in a switch

sealed class NetworkResult<T> {}

class Success<T> extends NetworkResult<T> {
  final T data;
  const Success(this.data);
}

class Failure<T> extends NetworkResult<T> {
  final String message;
  const Failure(this.message);
}

class Loading<T> extends NetworkResult<T> {}

// Pattern matching — exhaustive switch (no default needed)
Widget buildUI(NetworkResult<User> result) {
  return switch (result) {
    Loading() => const CircularProgressIndicator(),
    Failure(:final message) => Text('Error: $message'),    // destructuring
    Success(:final data) => UserProfile(user: data),       // destructuring
  };
  // Compiler ERROR if you forget any case
}
```

**Rule:** Use sealed classes for state that has a fixed set of variants. `AsyncValue` in Riverpod is a sealed class — it's `Loading`, `Error`, or `Data`. The `when()` method is essentially a pattern match.

---

## 9. Extension Methods — Add Methods to Existing Types

> 📄 **Dart Docs:**
> *"Extension methods, introduced in Dart 2.7, are a way to add functionality to existing libraries. You can use extension methods to add methods and other members to a type using a new syntax that's invisible to users."*

Extension methods let you add methods to ANY existing type — even types you don't own (String, int, DateTime, BuildContext).

```dart
// Extend String to add common validation methods
extension StringValidation on String {
  bool get isValidEmail => contains('@') && contains('.');
  bool get isValidPhone => length == 10 && int.tryParse(this) != null;
  String get capitalized => isEmpty ? '' : '${this[0].toUpperCase()}${substring(1).toLowerCase()}';
  String get initials => split(' ').map((w) => w.isEmpty ? '' : w[0].toUpperCase()).join();
}

// Now you can call these on any String
print('harsha@gmail.com'.isValidEmail);  // true
print('harsha alasai'.initials);         // HA
print('flutter dev'.capitalized);        // Flutter dev

// Extend int/Duration for readable time expressions
// (This is exactly how flutter_animate's .ms works)
extension DurationExtensions on int {
  Duration get ms => Duration(milliseconds: this);
  Duration get seconds => Duration(seconds: this);
  Duration get minutes => Duration(minutes: this);
}

// Now this works:
300.ms          // Duration(milliseconds: 300)
2.seconds       // Duration(seconds: 2)
const Duration(milliseconds: 300)  // old way — verbose
300.ms                              // new way — readable

// Extend BuildContext for theme shortcuts
extension ContextExtensions on BuildContext {
  ThemeData get theme => Theme.of(this);
  ColorScheme get colorScheme => Theme.of(this).colorScheme;
  TextTheme get textTheme => Theme.of(this).textTheme;
  MediaQueryData get mediaQuery => MediaQuery.of(this);
  double get screenWidth => MediaQuery.of(this).size.width;
  double get screenHeight => MediaQuery.of(this).size.height;
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
}

// Usage — dramatically cleaner widget code
@override
Widget build(BuildContext context) {
  // Without extension:
  final color = Theme.of(context).colorScheme.primary;
  final style = Theme.of(context).textTheme.titleLarge;
  final width = MediaQuery.of(context).size.width;

  // With extension:
  final color2 = context.colorScheme.primary;
  final style2 = context.textTheme.titleLarge;
  final width2 = context.screenWidth;
}
```

**Rule:** Extensions are syntactic sugar — they don't add data, only behavior. Don't put network calls or side effects in extensions. Use them for pure transformations and convenience getters.

🧑‍💻 **Developer:** Every time you see `.ms`, `.sp`, `.w`, `.h` in Flutter packages (flutter_animate, flutter_screenutil, gap), those are extension methods. Writing your own is just as simple.

🎨 **Designer:** `context.colorScheme.primary` instead of `Theme.of(context).colorScheme.primary` makes widget code read like design specs.

---

## 10. Cascade Operator — Chain Multiple Operations

> 📄 **Dart Docs:**
> *"Cascades (.., ?..) allow you to make a sequence of operations on the same object. In addition to accessing instance members, you can also call instance methods on that same object."*

```dart
// WITHOUT cascade — verbose, repeats the object name
final paint = Paint();
paint.color = Colors.blue;
paint.strokeWidth = 2.5;
paint.style = PaintingStyle.stroke;
paint.strokeCap = StrokeCap.round;

// WITH cascade — cleaner, all operations in one expression
final paint = Paint()
  ..color = Colors.blue
  ..strokeWidth = 2.5
  ..style = PaintingStyle.stroke
  ..strokeCap = StrokeCap.round;

// Null-aware cascade (?.) — only runs if object is not null
_timer?..cancel();   // cancel timer ONLY if it's not null
_controller?..dispose();  // dispose controller ONLY if not null

// Combine with builder pattern
final path = Path()
  ..moveTo(0, 0)
  ..lineTo(100, 0)
  ..lineTo(100, 100)
  ..lineTo(0, 100)
  ..close();

// AnimationController in initState — the common Flutter pattern
_controller = AnimationController(vsync: this, duration: 300.ms)
  ..addListener(() => setState(() {}))   // rebuild on each tick
  ..forward();                           // start immediately

// TextEditingController with listener
_searchCtrl = TextEditingController()
  ..addListener(_onSearch);
```

**Rule:** Cascade returns the original object (not the method return value). The last `..` call returns the object. It reads like a list of imperative steps applied to one thing.

---

## 11. Records — Multiple Return Values (Dart 3)

> 📄 **Dart Docs:**
> *"Records are an anonymous, immutable, aggregate type. Like other collection types, they let you bundle multiple objects into a single object. Unlike other collection types, records are fixed-sized, heterogeneous, and typed."*

```dart
// Before records — returning multiple values was awkward
Map<String, dynamic> getMinMax(List<int> values) {
  return {'min': values.reduce(math.min), 'max': values.reduce(math.max)};
}
final result = getMinMax([3, 1, 4, 1, 5]);
print(result['min']);  // untyped Map — no autocompletion, no safety

// WITH records — typed, destructurable, no class needed
(int min, int max) getMinMax(List<int> values) {
  return (values.reduce(math.min), values.reduce(math.max));
}

// Destructure on use
final (min, max) = getMinMax([3, 1, 4, 1, 5]);
print(min);  // 1 — typed int, full autocompletion

// Named fields in records
({String name, int age, String email}) fetchUser() {
  return (name: 'Harsha', age: 24, email: 'h@g.com');
}

final user = fetchUser();
print(user.name);   // Harsha — named access, type-safe
print(user.age);    // 24

// Pattern matching on records in switch
String describePoint((int x, int y) point) {
  return switch (point) {
    (0, 0) => 'Origin',
    (_, 0) => 'On X axis',
    (0, _) => 'On Y axis',
    (final x, final y) when x == y => 'On diagonal',
    _ => 'Other point',
  };
}

// Real Flutter use — return multiple values from repository
(List<Expense>, bool hasMore) fetchExpensesPage(int page) {
  // ...
  return (expenses, expenses.length == pageSize);
}

final (expenses, hasMore) = await fetchExpensesPage(1);
```

**Rule:** Use records when a function naturally returns 2-3 related values but creating a named class is overkill. For 4+ values or reusable structures, define a proper class.

---

## 12. Switch Expressions + Pattern Matching (Dart 3)

> 📄 **Dart Docs:**
> *"Switch expressions are similar to switch statements, but they are expressions that produce a value. They can be exhaustive or have a default case."*

```dart
// Switch EXPRESSION (Dart 3) — returns a value, no break needed
String labelForCategory(ExpenseCategory cat) => switch (cat) {
  ExpenseCategory.food => 'Food & Dining',
  ExpenseCategory.transport => 'Transport',
  ExpenseCategory.entertainment => 'Entertainment',
  ExpenseCategory.utilities => 'Utilities & Bills',
  ExpenseCategory.health => 'Health & Fitness',
  _ => 'Other',
};

// With when guard — conditional case
String gradeLabel(int score) => switch (score) {
  >= 90 => 'A',
  >= 80 => 'B',
  >= 70 => 'C',
  >= 60 => 'D',
  _ => 'F',
};

// Pattern matching in if statements
void processEvent(AppEvent event) {
  if (event case LoginEvent(:final email)) {
    print('Login: $email');
  } else if (event case LogoutEvent()) {
    print('Logout');
  }
}

// Exhaustive switch on sealed classes (no default needed)
Widget buildForState(ExpenseState state) => switch (state) {
  ExpenseInitial() => const WelcomeWidget(),
  ExpenseLoading() => const ShimmerList(),
  ExpenseLoaded(:final expenses) => ExpenseList(expenses: expenses),
  ExpenseError(:final message) => ErrorView(message: message),
  // Compiler error if any case is missing — exhaustiveness checking
};

// List and map patterns
void parseConfig(Map<String, dynamic> config) {
  switch (config) {
    case {'theme': final String theme, 'version': int version}:
      print('Theme: $theme, v$version');
    case {'theme': final String theme}:
      print('Theme only: $theme');
    default:
      print('Unknown config');
  }
}
```

🧑‍💻 **Developer:** Dart 3 patterns are used constantly in Flutter code — `when()` on Riverpod `AsyncValue`, switch on BLoC states, and sealed class hierarchies all use this. Understanding it means reading any modern Flutter codebase fluently.

---

## Lab — Build a Todo Manager in Pure Dart

Build a complete todo manager in pure Dart (no Flutter, just a `.dart` file run with `dart run`):

```dart
// Requirements:
// 1. Todo model: id, title, isCompleted, createdAt, List<String> tags
// 2. TodoManager class with methods:
//    - addTodo(title, {List<String> tags})
//    - completeTodo(String id)
//    - deleteTodo(String id)
//    - List<Todo> get pending
//    - List<Todo> get completed
//    - List<Todo> getByTag(String tag)
// 3. All todos stored in a List<Todo>
// 4. Use Future.delayed to simulate async operations (save, delete)
// 5. A main() function that demonstrates all operations
```

Requirements:
- Use `final` fields with `const` constructor for `Todo`
- Use `copyWith` for `completeTodo`
- Use collection methods (`where`, `map`, `any`)
- Use async/await for all operations
- Handle null safely (no `!` operator needed if you design it right)

---

## Challenge — Custom Option Type

Implement a generic `Option<T>` sealed class that replaces nullable values:

```dart
sealed class Option<T> {}
class Some<T> extends Option<T> { final T value; const Some(this.value); }
class None<T> extends Option<T> { const None(); }

// Helper methods to implement:
extension OptionExtensions<T> on Option<T> {
  T? toNullable();                         // Some(value) → value, None → null
  Option<R> map<R>(R Function(T) f);      // Some(value) → Some(f(value)), None → None
  T getOrElse(T defaultValue);            // Some(value) → value, None → defaultValue
  bool get isSome;
  bool get isNone;
}
```

---

## Week 1 Verify

1. What is the difference between `var`, `final`, and `const`? Give an example where each is correct.
2. Dart has sound null safety. What does "sound" mean? How is `String?` different from `String`?
3. What does `?.` do? What does `??` do? Give an example of each.
4. Write a function `Future<int> countItems()` that waits 500ms and then returns 42.
5. What is the difference between a `List` and a `Set`? When would you use a Set?
6. What does `sealed class` do? Why does a switch on a sealed class not need a `default` case?
7. Dart's `map`, `where`, and `fold` are higher-order functions. Explain each in one sentence and write the example that: takes `[1,2,3,4,5]`, keeps only even numbers, multiplies each by 10, and sums all values.

---

**Next → [Week 2: Flutter Core Concepts](Week_02_Flutter_Core_Concepts.md)**
