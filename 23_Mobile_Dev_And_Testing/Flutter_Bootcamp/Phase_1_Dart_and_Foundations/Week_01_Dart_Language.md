# Week 1 — Dart for Java Developers
### You know Java. Here's exactly what's different.

---

You already know how to think like a programmer. Dart is close enough to Java that you'll feel at home within a few hours. This file only covers what's **different**, **missing**, or **new**. Skip everything you already know.

---

## 1. The Basics — Same but Cleaner

**No ceremony. Just `main()`:**

```dart
// Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}

// Dart
void main() {
  print('Hello');
}
```

**String interpolation (no `+` needed):**

```dart
String name = 'Harsha';
int age = 22;

// Java: "Name: " + name + ", Age: " + age
// Dart:
print('Name: $name, Age: $age');
print('In 5 years: ${age + 5}');  // expression inside ${}
```

**→ Try this:** Create a `main()` that prints your name, your age, and your age multiplied by 2, all in one line using string interpolation.

---

## 2. Variables — `var`, `final`, `const`

```dart
// var = type inferred, can reassign
var name = 'Harsha';   // Dart knows it's a String
name = 'Bob';          // fine

// final = set once at runtime (like Java's final)
final birthday = DateTime.now();
birthday = DateTime.now();  // COMPILE ERROR

// const = compile-time constant (stronger than Java's final)
const pi = 3.14159;
const pi = 3.0;  // COMPILE ERROR — can't reassign
```

**The rule:** use `const` when the value is truly fixed (colors, padding values, string keys). Use `final` when it's set once but not known at compile time. Use `var` for everything else.

**→ Try this:** Declare a `const` for your birth year, a `final` for today's date, and a `var` for a score. Try reassigning each one and see which ones give compile errors.

---

## 3. Null Safety — The Biggest Difference from Java

In Java, any object variable can be `null`. That's why NPEs (NullPointerExceptions) are everywhere. Dart eliminates this entirely at the compiler level.

```dart
// In Dart, by default, NOTHING can be null
String name = 'Harsha';
name = null;   // COMPILE ERROR. Dart won't allow it.

// If you WANT to allow null, you must say so explicitly with ?
String? nickname = null;   // OK — you declared it nullable
nickname = 'Hash';         // also OK

// Now when you use it, Dart forces you to handle the null case
print(nickname.length);    // COMPILE ERROR — nickname might be null
print(nickname?.length);   // OK — returns null if nickname is null
print(nickname ?? 'No nickname');  // provides a default if null
```

**The `!` operator — use with caution:**
```dart
String? value = getValue();
print(value!.length);  // You're telling Dart: "I know it's not null, trust me"
                       // If it IS null at runtime → crash. Only use when you're certain.
```

**`late` — for non-nullable variables assigned after declaration:**
```dart
late String userId;

void setup() {
  userId = 'user_123';  // assigned before first use
}
// Dart trusts you to assign it before using it
// If you forget → crash at runtime when you first access it
```

**→ Try this:** Declare a `String?` called `city`. Try printing `city.length` directly — see the error. Then fix it using `?.` and also using `?? 'Unknown city'`.

---

## 4. No `public` / `private` Keywords

Java uses `public`, `private`, `protected`. Dart doesn't have any of these.

```dart
// Dart visibility rule: underscore _ means private to the FILE (library)
class BankAccount {
  String owner;      // public — accessible from anywhere
  double _balance;   // private — only accessible inside this file

  BankAccount(this.owner, this._balance);
}

// From another file:
var account = BankAccount('Harsha', 1000);
print(account.owner);    // fine
print(account._balance); // COMPILE ERROR — _balance is private
```

There's no `protected` in Dart. Either it's public or it's library-private (`_`).

**→ Try this:** Create a `Person` class with a public `name` and private `_age`. Add a public getter `int get age => _age;`. Test that you can read age but can't set `_age` directly from outside the class.

---

## 5. Constructors — Much Cleaner Than Java

```dart
// Java constructor (lots of boilerplate)
class Person {
    String name;
    int age;
    Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

// Dart — this.name in the parameter list assigns directly
class Person {
  String name;
  int age;
  Person(this.name, this.age);  // one line!
}
```

**Named parameters** — Java has no equivalent:
```dart
class Person {
  String name;
  int age;
  String? city;

  // Curly braces = named parameters
  Person({required this.name, required this.age, this.city});
}

// Caller MUST name them
var p = Person(name: 'Harsha', age: 22);
var p2 = Person(name: 'Bob', age: 25, city: 'Mumbai');

// Order doesn't matter with named params
var p3 = Person(age: 22, name: 'Harsha');
```

**Named constructors** (Java doesn't have these — you'd use static factory methods):
```dart
class Color {
  int r, g, b;
  Color(this.r, this.g, this.b);

  // Named constructor
  Color.red() : r = 255, g = 0, b = 0;
  Color.fromHex(String hex) : r = int.parse(hex.substring(1, 3), radix: 16),
                               g = int.parse(hex.substring(3, 5), radix: 16),
                               b = int.parse(hex.substring(5, 7), radix: 16);
}

var red = Color.red();
var custom = Color.fromHex('#FF5733');
```

**→ Try this:** Create a `Product` class with `name`, `price`, `category`. Use named parameters with `required` for `name` and `price`, and optional `category` defaulting to `'General'`. Create 3 products to test it.

---

## 6. Functions — Dart Goes Further Than Java

**Arrow functions** (you've seen Java lambdas — this is cleaner):
```dart
// Regular function
int add(int a, int b) {
  return a + b;
}

// Arrow function (single expression only)
int add(int a, int b) => a + b;

// Works with named params too
double bmi({required double weight, required double height}) =>
    weight / (height * height);
```

**Optional positional parameters** with `[]`:
```dart
void log(String message, [String level = 'INFO']) {
  print('[$level] $message');
}

log('Started');          // [INFO] Started
log('Crashed', 'ERROR'); // [ERROR] Crashed
```

**Functions as values** (Java has `Function<T,R>` — Dart is simpler):
```dart
// Store a function in a variable
int Function(int, int) operation = (a, b) => a + b;
print(operation(3, 4)); // 7

// Pass a function as a parameter
List<int> numbers = [3, 1, 4, 1, 5, 9];
numbers.sort((a, b) => a.compareTo(b));         // ascending
numbers.sort((a, b) => b.compareTo(a));         // descending
```

**→ Try this:** Write an `applyTwice` function that takes a function `int Function(int)` and an `int`, and applies the function to the value twice. Test with a doubling function: `applyTwice((x) => x * 2, 3)` should return `12`.

---

## 7. Collections — Functional Operations Built In

```dart
List<int> scores = [45, 88, 92, 33, 77, 91];

// Filter (Java: stream().filter())
var passing = scores.where((s) => s >= 50).toList();  // [88, 92, 77, 91]

// Transform (Java: stream().map())
var grades = scores.map((s) => s >= 90 ? 'A' : s >= 75 ? 'B' : 'C').toList();

// Reduce to single value
var total = scores.reduce((a, b) => a + b);  // 426
var avg = scores.fold(0.0, (sum, s) => sum + s) / scores.length;

// Check conditions
bool anyFailing = scores.any((s) => s < 50);   // true
bool allPassing = scores.every((s) => s >= 50); // false

// Sort (doesn't return — modifies in place)
scores.sort();  // ascending
```

**Collection if and for** (Dart-only, Java has no equivalent):
```dart
bool isAdmin = true;
List<String> menuItems = [
  'Home',
  'Profile',
  if (isAdmin) 'Admin Panel',     // only included if isAdmin is true
  for (var i = 1; i <= 3; i++) 'Page $i',  // adds Page 1, Page 2, Page 3
];
// Result: ['Home', 'Profile', 'Admin Panel', 'Page 1', 'Page 2', 'Page 3']
```

**Spread operator:**
```dart
var base = [1, 2, 3];
var extended = [0, ...base, 4, 5];  // [0, 1, 2, 3, 4, 5]
```

**→ Try this:** Given `List<int> prices = [120, 45, 890, 230, 67, 445, 12, 550]`, write one chain of operations that: filters prices above 100, multiplies each by 1.18 (adds GST), and returns a sorted list. Do it in one expression.

---

## 8. Async/Await — Better Than Java's CompletableFuture

```dart
// Java CompletableFuture (messy)
CompletableFuture<String> future = fetchData().thenApply(data -> process(data));

// Dart (reads like synchronous code)
Future<String> fetchData() async {
  await Future.delayed(Duration(seconds: 2)); // simulates network delay
  return 'Data loaded';
}

void main() async {
  print('Loading...');
  String data = await fetchData();  // waits here, doesn't block the thread
  print(data);  // 'Data loaded'
}
```

**Error handling:**
```dart
Future<String> riskyFetch() async {
  try {
    await Future.delayed(Duration(seconds: 1));
    throw Exception('Server error');
  } catch (e) {
    print('Caught: $e');
    rethrow;  // re-throw so caller can also handle
  }
}
```

**Stream — for sequences of values over time (like Java's RxJava Observable):**
```dart
// Produces values over time
Stream<int> countdown(int from) async* {
  for (int i = from; i >= 0; i--) {
    await Future.delayed(Duration(seconds: 1));
    yield i;  // emits one value, then continues the loop
  }
}

// Consuming a stream
void main() async {
  await for (int tick in countdown(5)) {
    print(tick);  // prints 5, 4, 3, 2, 1, 0 — one per second
  }
}
```

**→ Try this:** Write an async function `fetchUser(String id)` that waits 1 second and returns a hardcoded `Map<String, String>` with `name`, `email`, `role`. Call it from `main()` using `await` and print each field.

---

## 9. What's Completely New in Dart (No Java Equivalent)

**Extensions — add methods to existing types:**
```dart
extension on String {
  bool get isValidEmail => contains('@') && contains('.');
  String capitalize() => isEmpty ? '' : '${this[0].toUpperCase()}${substring(1)}';
}

'harsha@email.com'.isValidEmail  // true
'flutter'.capitalize()           // 'Flutter'
```

**Mixins — shared behavior without inheritance:**
```dart
// Java: you'd use a default interface method or abstract class
// Dart: mixin

mixin Flyable {
  void fly() => print('$runtimeType is flying');
  int get maxAltitude;
}

mixin Swimmable {
  void swim() => print('$runtimeType is swimming');
}

class Duck extends Animal with Flyable, Swimmable {
  @override
  int get maxAltitude => 100;
}

Duck().fly();   // Duck is flying
Duck().swim();  // Duck is swimming
```

**→ Try this:** Write a mixin `Printable` with a method `void printDetails()` that prints the object's `runtimeType` and a `String get summary` getter. Apply it to a `Student` class and a `Course` class.

---

## Lab — Put It Together

**Build a Library Management System in pure Dart (no Flutter).**

You need:
- A `Book` class: `id`, `title`, `author`, `year`, `isAvailable`
- A `Member` class: `id`, `name`, `email`, borrowed books list
- A `Library` class with:
  - `addBook(Book)` 
  - `borrowBook(String bookId, Member member)` — returns `bool`, makes book unavailable
  - `returnBook(String bookId, Member member)` — makes book available again
  - `searchByAuthor(String author)` — returns list of matching books
  - `get availableBooks` — only books where `isAvailable == true`
  - `generateReport()` — prints how many books total, available, borrowed

Run it in `main()`. Add 5 books, 2 members. Borrow 2 books, return 1, print the report.

---

## Challenge — Harder

Extend the library above:
- Add a `waitingList` to `Book` — if a book is borrowed, members can join the waiting list
- When a book is returned, automatically lend it to the first person in the waiting list
- Add late fees: if a book is kept more than 14 days, `lateFee` returns `double` (₹5 per extra day)
- Add a mixin `Exportable` to Library that has a method `toCsv()` returning all books as CSV text

---

## Before You Move to Week 2 — Verify

Answer these without looking at the file:

1. What is the difference between `final` and `const`?
2. What does `String?` mean vs `String`? When would you use `!`?
3. Why does Dart use `_` instead of `private`?
4. What is a named parameter? How is it called differently from a positional parameter?
5. What does `yield` do inside an `async*` function?

If you're unsure about any — re-read that section. Then move on.

---

**Next → [Week 2: Flutter Core Concepts](Week_02_Flutter_Core_Concepts.md)**
