# 17b. TypeScript × Java — Two Type Systems, One Mental Model

**Navigation**: [← SQL Analytics](../Problem_Sets_SQL/17_SQL_Problems_Analytics_RealWorld_Design.md) | [📚 Index](../00_INDEX.md) | [SQL Foundations →](../Problem_Sets_SQL/18_SQL_Foundations_Commands_Operators_Functions.md)

**Cross-links:**
- [`17_TypeScript/`](../../17_TypeScript/) — TypeScript chapters
- [`07_Modern_Java/Ch01_Core_Foundations.md`](../../07_Modern_Java/Ch01_Core_Foundations.md) — Java type foundations
- [`07_Modern_Java/Ch04_Generics_Exceptions.md`](../../07_Modern_Java/Ch04_Generics_Exceptions.md) — Java generics deep dive
- [`PATH_FRONTEND.md`](../../PATH_FRONTEND.md) — frontend path (TypeScript track)
- [`PATH_JAVA_BACKEND.md`](../../PATH_JAVA_BACKEND.md) — Java backend path

---

> **Reading contract**: You know one of these languages well. This file maps every major type-system concept from TypeScript to its Java equivalent (or explains why no equivalent exists). By the end, switching between the two type systems will feel like translating — familiar ideas, different syntax.

---

## Table of Contents

1. [Static vs Structural Typing — The Fundamental Difference](#1-static-vs-structural-typing--the-fundamental-difference)
2. [Interfaces — Shape-based vs Contract-based](#2-interfaces--shape-based-vs-contract-based)
3. [Generics — The Concept is the Same, the Syntax Differs](#3-generics--the-concept-is-the-same-the-syntax-differs)
4. [Null Safety — Optional vs strictNullChecks](#4-null-safety--optional-vs-strictnullchecks)
5. [Union Types (TS) → Sealed Classes (Java 17+)](#5-union-types-ts--sealed-classes-java-17)
6. [Type Guards (TS) → instanceof + Pattern Matching (Java)](#6-type-guards-ts--instanceof--pattern-matching-java)
7. [Enums — Similar Name, Different Behavior](#7-enums--similar-name-different-behavior)
8. [Type Inference — Where Both Languages Read Your Mind](#8-type-inference--where-both-languages-read-your-mind)

---

## 1. Static vs Structural Typing — The Fundamental Difference

### 🧠 Foundation — Nominal vs Structural

This is the single biggest conceptual difference between the two type systems:

**Java uses NOMINAL typing**: compatibility is determined by explicit type declarations (class name / interface name).

```java
interface Printable {
  void print();
}

class Document implements Printable {  // ← must explicitly declare
  public void print() { System.out.println("doc"); }
}

class Report {  // ← does NOT implement Printable
  public void print() { System.out.println("report"); }
}

// Java type check:
Printable p = new Document(); // ✅ — Document declares Printable
Printable r = new Report();   // ❌ compile error — Report doesn't declare it
// Even though Report has the exact same method!
```

**TypeScript uses STRUCTURAL typing** (also called "duck typing"): compatibility is determined by the shape (what methods/properties exist), not by explicit declarations.

```typescript
interface Printable {
  print(): void;
}

class Document {
  print() { console.log("doc"); } // ← no "implements Printable" needed
}

class Report {
  print() { console.log("report"); }
}

// TypeScript type check:
const p: Printable = new Document(); // ✅ — Document has the right shape
const r: Printable = new Report();   // ✅ — Report also has the right shape
// TypeScript only cares about what's there, not what's declared
```

---

### The Practical Implication

TypeScript structural typing means **any object with the right shape satisfies an interface** — even objects you didn't write:

```typescript
interface HasLength {
  length: number;
}

function logLength(x: HasLength) {
  console.log(x.length);
}

logLength("hello");         // ✅ — string has .length
logLength([1, 2, 3]);       // ✅ — array has .length
logLength({ length: 42 });  // ✅ — plain object with length property
```

In Java, you'd need to write an adapter or have each class explicitly implement `HasLength`.

---

### 💥 War Story — The TypeScript Structural Trap That Passed Wrong Objects

A developer had a `User` and `AdminUser` interface:

```typescript
interface User {
  id: number;
  name: string;
}

interface AdminUser {
  id: number;
  name: string;
  adminLevel: number;
}

function sendEmail(user: User) {
  emailService.send(user.id, user.name);
}

const admin: AdminUser = { id: 1, name: "Alice", adminLevel: 3 };
sendEmail(admin); // ✅ TypeScript allows this — AdminUser is a structural subtype of User
// AdminUser has everything User has (and more) → compatible
```

This works correctly in most cases (it's a feature). But if `sendEmail` internally tries to serialize `user` to JSON and send it to an analytics endpoint, the `adminLevel` field travels with it — potentially leaking admin-level info to a non-admin analytics dashboard. TypeScript silently permitted it because `AdminUser` has all User's properties.

In Java, you'd define `interface AdminUser extends User` explicitly — and could easily check if something "is admin" at compile time. TypeScript requires explicit narrowing or discriminated unions to prevent excess property leakage.

---

### 📝 Practice Challenges

1. In TypeScript, does `{ id: 1, name: "Alice", extra: "field" }` satisfy `interface User { id: number; name: string; }`? What about in a direct assignment vs function argument context?
2. Write a Java interface and TypeScript interface for `Comparable<T>`. Compare the implementations in each language — what's required to make a class satisfy each?
3. Why does TypeScript allow `const x: User = adminUser` but not always `const x: User = { id: 1, name: "A", extra: "field" }` (object literal)? What is "excess property checking"?

---

## 2. Interfaces — Shape-based vs Contract-based

### TypeScript Interfaces

TypeScript interfaces describe **object shapes**. They can describe functions, classes, and plain objects. They're erased at runtime — no runtime cost:

```typescript
// Describes an object
interface User {
  id: number;
  name: string;
  email?: string; // optional field
}

// Describes a function
interface Validator {
  (input: string): boolean; // call signature
}

// Describes a class (a class shape)
interface Repository<T> {
  findById(id: number): T | null;
  save(entity: T): void;
}

// Declaration merging — TypeScript allows this (Java does NOT):
interface User {
  role: string; // this MERGES with the earlier User interface
}
// Now User = { id, name, email?, role }
```

### Java Interfaces

Java interfaces are **behavioral contracts** that classes must explicitly implement. They exist at runtime (you can use `instanceof`):

```java
public interface Repository<T> {
    Optional<T> findById(Long id);
    T save(T entity);

    // Java 8+: default methods (TypeScript doesn't have this)
    default boolean exists(Long id) {
        return findById(id).isPresent();
    }
}

public class UserRepository implements Repository<User> {
    public Optional<User> findById(Long id) { /* ... */ }
    public User save(User user) { /* ... */ }
    // exists() is inherited from default method
}

// Runtime check — impossible in TypeScript (interfaces are erased)
if (repo instanceof Repository) { // valid Java
    System.out.println("is a repository");
}
```

---

### The Comparison Table

| Feature | TypeScript `interface` | Java `interface` |
|---------|----------------------|-----------------|
| Runtime existence | No (erased) | Yes (`instanceof` works) |
| `implements` required | No (structural) | Yes (nominal) |
| Optional fields | `field?: Type` | No equivalent |
| Declaration merging | Yes | No |
| Default methods | No | Yes (Java 8+) |
| Static methods | No | Yes (Java 8+) |
| Function type | Yes (call signature) | Functional interface |
| Type intersection | `A & B` | Multiple `implements` |

---

### 📝 Practice Challenges

1. TypeScript: write an interface for a `Cache<K, V>` with `get`, `set`, and `has` methods. Then write a `LocalStorageCache` that satisfies it without using `implements`.
2. Java: write the same interface. Can you make `LocalStorageCache` satisfy it without `implements Cache`? Why not?
3. TypeScript has `type` aliases in addition to `interface`. When would you use `type` vs `interface`? (Hint: unions, primitives, mapped types)

---

## 3. Generics — The Concept is the Same, the Syntax Differs

### 🧠 Foundation — What generics solve

Generics let you write code that works over many types while keeping type safety:

```
Without generics:
  getFirst(list: any[]): any  ← type information lost
  
With generics:
  getFirst<T>(list: T[]): T  ← TypeScript
  T getFirst(List<T> list)    ← Java
```

---

### Side-by-Side Comparison

**Basic generic function:**

```typescript
// TypeScript
function identity<T>(arg: T): T {
  return arg;
}
identity<string>("hello"); // T = string
identity(42);              // T inferred as number
```

```java
// Java
public static <T> T identity(T arg) {  // type param before return type
    return arg;
}
identity("hello"); // T inferred as String
identity(42);      // T inferred as Integer
```

**Generic interface:**

```typescript
// TypeScript
interface Pair<A, B> {
  first: A;
  second: B;
}
const p: Pair<string, number> = { first: "score", second: 100 };
```

```java
// Java
public interface Pair<A, B> {
    A getFirst();
    B getSecond();
}
```

**Generic constraints:**

```typescript
// TypeScript — extends keyword for constraints
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length; // safe — T is guaranteed to have .length
}
getLength("hello");    // ✅ string has .length
getLength([1, 2, 3]);  // ✅ array has .length
getLength(42);         // ❌ number has no .length
```

```java
// Java — bounded type parameters
public static <T extends Measurable> int getSize(T arg) {
    return arg.size(); // safe — T must implement Measurable
}

// Upper-bounded wildcard (for reading):
void printAll(List<? extends Shape> shapes) {
    for (Shape s : shapes) s.draw(); // read-safe, can't add
}

// Lower-bounded wildcard (for writing):
void addNumbers(List<? super Integer> list) {
    list.add(42); // write-safe, can't read as specific type
}
```

---

### The Key Differences

| Concept | TypeScript | Java |
|---------|-----------|------|
| Type parameters | `<T>` after function name | `<T>` before return type |
| Constraint keyword | `extends` | `extends` (class) / `implements` (interface) |
| Multiple constraints | `T extends A & B` | `T extends A & B` (same!) |
| Wildcards | No (use `T extends X`) | `? extends X`, `? super X` |
| Reification | Erased (no `T` at runtime) | Erased (JVM doesn't have `T` at runtime) |
| Default type param | `<T = string>` | Not supported |
| Conditional types | `T extends U ? X : Y` | Not supported |
| Mapped types | `{ [K in keyof T]: ... }` | Not supported |

---

### 💥 War Story — Java Type Erasure Surprise

A Java developer tried to check the generic type at runtime:

```java
public <T> void process(List<T> list) {
    if (list instanceof List<String>) { // ❌ Cannot check generic type at runtime
        // Compile error: cannot use a generic type parameter in instanceof
    }
}
```

Java erases generic types at compile time — the JVM only sees `List`, not `List<String>`. At runtime, `List<String>` and `List<Integer>` are indistinguishable.

The TypeScript equivalent is different but similar:

```typescript
function process<T>(list: T[]): void {
  if (list[0] instanceof String) { // ✅ works — checking the VALUE not the type param
    // But checking T itself at runtime is impossible (also erased)
  }
}
```

Both languages erase generics — TypeScript because it compiles to JavaScript (no types), Java because of backwards compatibility with pre-generics bytecode.

---

### 📝 Practice Challenges

1. Write a generic `Result<T, E>` type in TypeScript (discriminated union) and the closest Java equivalent. What's the most idiomatic Java approach (Optional? Either monad? Sealed class?)?
2. TypeScript: write a function `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`. What Java construct (if any) comes closest?
3. In Java, why does `new T()` inside a generic method fail? What's the workaround?

---

## 4. Null Safety — Optional vs strictNullChecks

### TypeScript: `strictNullChecks: true`

Without strict null checks, every type in TypeScript implicitly includes `null` and `undefined`:

```typescript
// strictNullChecks: false (default in old TS)
let name: string = null; // ✅ allowed — null is a subtype of everything
name.toUpperCase();       // ❌ runtime TypeError (not caught by compiler)

// strictNullChecks: true (recommended)
let name: string = null; // ❌ compile error — null not assignable to string
let name: string | null = null; // ✅ — explicit null union

// Force you to handle null before using:
function getUser(id: number): User | null { ... }

const user = getUser(1);
user.name; // ❌ compile error — user might be null
user?.name; // ✅ optional chaining — returns undefined if null
user!.name; // ✅ non-null assertion — you guarantee it's not null (risky)
if (user) {
  user.name; // ✅ — TypeScript narrows type to User inside the if
}
```

### Java: `Optional<T>`

Java has no language-level null safety (unlike Kotlin). `Optional<T>` is a wrapper type that forces callers to handle the absent case explicitly:

```java
// Without Optional (old style):
public User findById(Long id) {
    return null; // caller doesn't know this can be null
}
User user = findById(99L);
user.getName(); // ← NullPointerException if user is null — no compiler warning

// With Optional (idiomatic modern Java):
public Optional<User> findById(Long id) {
    return Optional.ofNullable(repository.findOrNull(id));
}

Optional<User> user = findById(99L);
user.getName(); // ❌ compile error — Optional has no .getName()
user.get().getName(); // ❌ throws NoSuchElementException if empty — bad pattern

// ✅ Correct Optional usage:
user.map(User::getName).orElse("Guest");        // transform if present
user.ifPresent(u -> System.out.println(u));     // run if present
user.orElseThrow(() -> new NotFoundException()); // throw if absent
String name = user.orElse(null);               // back to null if needed
```

---

### The Comparison

| Concept | TypeScript | Java |
|---------|-----------|------|
| Null safety mechanism | `strictNullChecks` + `T \| null` | `Optional<T>` (convention) |
| Enforced by compiler | Yes (fully) | Partially (Optional not mandatory) |
| Optional chaining | `user?.name` | `user.map(User::getName)` |
| Nullish coalescing | `user ?? "default"` | `.orElse("default")` |
| Non-null assertion | `user!.name` | `user.get()` (throws if absent) |
| Null checks | `if (user !== null)` → narrows type | `if (user.isPresent())` |
| `undefined` distinction | Yes (`null` vs `undefined` are different) | No equivalent |

---

### 💥 War Story — Optional.get() NullPointerException in Disguise

A Java developer migrated legacy code to use `Optional` but kept the same access pattern:

```java
// ❌ This is just a renamed NPE waiting to happen
Optional<User> user = userRepo.findById(id);
String name = user.get().getName(); // NoSuchElementException if empty
// Team said "we switched to Optional and still get NPEs!"
// Actually: NoSuchElementException, not NPE — same problem, different error
```

`Optional.get()` without `isPresent()` is as unsafe as `null` dereference. The whole point of `Optional` is to force you to declare the empty case:

```java
// ✅ Force the caller to handle both cases
String name = userRepo.findById(id)
    .map(User::getName)
    .orElseThrow(() -> new UserNotFoundException(id));
```

---

### 📝 Practice Challenges

1. TypeScript: write a function `safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined`. Explain how `strictNullChecks` makes the implementation safe.
2. Java: a service returns `Optional<Order>`. Chain: if present, get the customer, if customer has an email, send a notification. Write it without any `.get()` call.
3. TypeScript has `undefined` AND `null`. What's the practical difference? When would a function return `null` vs `undefined` vs `null | undefined`?

---

## 5. Union Types (TS) → Sealed Classes (Java 17+)

### TypeScript Union Types

A union type allows a value to be one of several types:

```typescript
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":   return Math.PI * shape.radius ** 2;
    case "square":   return shape.side ** 2;
    case "triangle": return 0.5 * shape.base * shape.height;
  }
  // TypeScript knows this switch is exhaustive — no default needed
  // If you add a new Shape variant, TypeScript shows an error here
}
```

The `kind` field is a **discriminant** — the tag that tells TypeScript which variant it is. This pattern is called a **discriminated union** (or tagged union).

### Java 17+ Sealed Classes

Sealed classes (Java 17) provide the same exhaustiveness guarantee as TypeScript discriminated unions:

```java
// Sealed class hierarchy — only these subclasses are permitted
public sealed interface Shape
    permits Circle, Square, Triangle {}

public record Circle(double radius) implements Shape {}
public record Square(double side) implements Shape {}
public record Triangle(double base, double height) implements Shape {}

// Pattern matching switch (Java 21) — exhaustiveness enforced by compiler
double area(Shape shape) {
    return switch (shape) {
        case Circle c    -> Math.PI * c.radius() * c.radius();
        case Square s    -> s.side() * s.side();
        case Triangle t  -> 0.5 * t.base() * t.height();
        // No default needed — compiler proves all cases covered
        // Add a new subclass to the sealed hierarchy → compile error here
    };
}
```

---

### The Equivalence Table

| TypeScript | Java 17+ |
|-----------|----------|
| `type Shape = Circle \| Square` | `sealed interface Shape permits Circle, Square` |
| Each variant as literal type | `record` (immutable data class) |
| Discriminant field (`kind`) | Not needed — `instanceof` is the discriminant |
| `switch (shape.kind)` | `switch (shape) { case Circle c -> }` |
| Exhaustiveness checked | Yes (TypeScript) | Yes (Java 17 sealed + switch) |
| Forgot a variant? | Compile error | Compile error |

---

### Before Sealed Classes (Java < 17) — The Visitor Pattern

Before sealed classes, Java devs used the **Visitor pattern** to achieve exhaustiveness:

```java
interface ShapeVisitor<R> {
    R visitCircle(Circle circle);
    R visitSquare(Square square);
}

interface Shape {
    <R> R accept(ShapeVisitor<R> visitor);
}

class Circle implements Shape {
    final double radius;
    public <R> R accept(ShapeVisitor<R> v) { return v.visitCircle(this); }
}

// Adding new Shape = must add to ShapeVisitor interface = all implementations break
// → exhaustiveness enforced by breaking code, not compile errors
```

Sealed classes made this pattern obsolete. TypeScript never needed the Visitor pattern for this use case because discriminated unions handled it from the start.

---

### 📝 Practice Challenges

1. TypeScript: write a `Result<T, E>` discriminated union type with `Success` and `Failure` variants. Write a `map` function that transforms the success value.
2. Java 17+: write the sealed class equivalent of the same `Result<T, E>` type using records.
3. A codebase uses a discriminated union with 10 variants. A new variant is added. In TypeScript with `strictNullChecks` and in Java with sealed classes, where exactly does the compiler surface the error?

---

## 6. Type Guards (TS) → instanceof + Pattern Matching (Java)

### TypeScript Type Guards

A type guard narrows a union type to a specific member:

```typescript
type Pet = Dog | Cat;

// Built-in type guards
if (pet instanceof Dog) {
  pet.bark(); // TypeScript knows pet is Dog here
}

// typeof guard (for primitives)
if (typeof value === "string") {
  value.toUpperCase(); // TypeScript narrows to string
}

// Custom type guard — user-defined
function isDog(pet: Pet): pet is Dog {
  return (pet as Dog).bark !== undefined;
}

if (isDog(pet)) {
  pet.bark(); // narrowed to Dog
}

// Discriminated union narrowing (most common)
if (shape.kind === "circle") {
  shape.radius; // narrowed — TypeScript knows it's the circle variant
}
```

### Java Type Guards

Java uses `instanceof` with pattern matching (Java 16+):

```java
// Old style (pre-16):
if (animal instanceof Dog) {
    Dog dog = (Dog) animal; // explicit cast
    dog.bark();
}

// Pattern matching instanceof (Java 16+) — one line, no explicit cast:
if (animal instanceof Dog dog) {
    dog.bark(); // 'dog' is the narrowed variable, scoped to this if-block
}

// In a switch (Java 21 pattern matching):
String describe(Object obj) {
    return switch (obj) {
        case Integer i -> "int: " + i;
        case String s  -> "string: " + s;
        case null      -> "null";
        default        -> "other";
    };
}
```

---

### 📝 Practice Challenges

1. TypeScript: write a function that accepts `string | number | boolean` and returns the input doubled (`"hi" → "hihi"`, `3 → 6`, `true → 2`). Use type guards.
2. Java: write the same function using pattern matching switch. What's the equivalent of TypeScript's `never` (unreachable case)?
3. TypeScript `as` is a type assertion (tells compiler "trust me"). Java's equivalent is `(Type)` cast. What's the difference in safety? Which one can cause a runtime error?

---

## 7. Enums — Similar Name, Different Behavior

### TypeScript Enums (Avoid) vs Const Enums vs Literal Unions

TypeScript has `enum` but the community often prefers union literals:

```typescript
// ❌ enum (has runtime overhead, generates JS object)
enum Direction { Up, Down, Left, Right }
Direction.Up // = 0 (numeric by default) — value can be unexpected

// ✅ const enum (erased at compile time — just inline values)
const enum Status { Active = "ACTIVE", Inactive = "INACTIVE" }
// Compiled away: const enum code is replaced with the literal string

// ✅ Most idiomatic — union of literal types (no enum keyword at all)
type Status = "ACTIVE" | "INACTIVE";
const status: Status = "ACTIVE";
// status = "TYPO"; // ❌ compile error — not a valid Status
```

### Java Enums (Very Different)

Java enums are **full class instances** with behavior — much more powerful than TypeScript's enums:

```java
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS(4.869e+24, 6.0518e6),
    EARTH(5.976e+24, 6.37814e6);

    private final double mass;   // fields on each instance
    private final double radius;

    Planet(double mass, double radius) {  // constructor
        this.mass = mass;
        this.radius = radius;
    }

    double surfaceGravity() {    // method on each instance
        final double G = 6.67300E-11;
        return G * mass / (radius * radius);
    }
}

// Usage:
Planet.EARTH.surfaceGravity(); // enum values have behavior
Planet.valueOf("EARTH");       // string → enum
Planet.EARTH.name();           // "EARTH" (string value)
Planet.EARTH.ordinal();        // 2 (position in declaration)
EnumSet.of(Planet.EARTH, Planet.VENUS); // efficient bit-set for enums
EnumMap<Planet, String> map = new EnumMap<>(Planet.class); // efficient enum-keyed map
```

---

### The Comparison

| Feature | TypeScript `enum` | TypeScript union literal | Java `enum` |
|---------|------------------|------------------------|------------|
| Runtime object | Yes (JS object) | No (erased) | Yes (class instances) |
| Behavior/methods | No | No | Yes (full class) |
| `switch` exhaustiveness | Partial | Yes (with TS narrowing) | Yes (with pattern matching) |
| Values | Numbers or strings | String literals | Any type (fields) |
| String conversion | `.toString()` | The string itself | `.name()` |
| Iteration | `Object.values(Enum)` | No built-in | `Enum.values()` |
| Community preference | Avoid | Use this instead | Always use |

---

### 📝 Practice Challenges

1. TypeScript: replace this `enum UserRole { Admin = "ADMIN", Editor = "EDITOR", Viewer = "VIEWER" }` with a union literal type and a type guard. What do you gain?
2. Java: write an `Operation` enum with `PLUS`, `MINUS`, `TIMES`, `DIVIDE` where each value has an `apply(double x, double y): double` method.
3. TypeScript's `const enum` is erased at compile time. What does this mean for cross-module usage? When does it break?

---

## 8. Type Inference — Where Both Languages Read Your Mind

### TypeScript Inference

TypeScript infers types from values:

```typescript
const x = 42;           // inferred: number
const name = "Alice";   // inferred: string
const arr = [1, 2, 3];  // inferred: number[]

// Function return type inferred:
function double(n: number) { // ← parameter needs annotation
  return n * 2;              // return type inferred as number
}

// Complex inference:
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];
// users inferred as: { id: number; name: string }[]

// Generic inference:
function first<T>(arr: T[]): T {
  return arr[0];
}
const result = first([1, 2, 3]); // T inferred as number, result: number
```

### Java Inference

Java infers types in fewer places but has been improving since Java 10:

```java
// Java 10+: var — infers local variable type
var x = 42;              // inferred: int
var name = "Alice";      // inferred: String
var users = new ArrayList<String>(); // inferred: ArrayList<String>

// Generic type inference (Java 7+ diamond operator):
List<String> names = new ArrayList<>(); // ← diamond <> infers String
Map<String, List<Integer>> map = new HashMap<>(); // inferred

// Method return type: NOT inferred — must declare explicitly
public int double(int n) { // ← return type always required
    return n * 2;
}

// Lambda inference — argument types inferred from context:
List<String> names = Arrays.asList("Bob", "Alice", "Charlie");
names.sort((a, b) -> a.compareTo(b)); // a and b inferred as String
names.stream()
     .filter(n -> n.startsWith("A")) // n inferred as String from stream context
     .collect(Collectors.toList());
```

---

### Where They Differ Most

| Context | TypeScript | Java |
|---------|-----------|------|
| Variable type | Inferred from value | `var` (Java 10+) or explicit |
| Function parameters | Must annotate | Inferred in lambdas from context |
| Function return type | Inferred | Must declare explicitly |
| Generic type params | Inferred at call site | Inferred at call site |
| Class field types | Inferred from initializer | Must declare type |
| `as` / cast | Type assertion (no runtime check) | Cast (runtime check, can throw) |

---

### 💥 War Story — Java `var` That Made Code Unreadable

A team adopted `var` enthusiastically:

```java
var result = service.process(data);
var transformed = mapper.map(result);
var response = builder.build(transformed);
return response;
```

The IDE showed the types on hover — but code reviewers in GitHub's web UI couldn't see them. `result`, `transformed`, `response` could be anything. After a production bug involving a type mismatch between `result` (which was `Optional<ProcessedData>`) and `mapper.map()` (which expected `ProcessedData`), the team adopted a rule: use `var` only when the type is obvious from the right-hand side.

```java
// ✅ var is fine — type is clear from new/literal
var users = new ArrayList<User>();
var count = 0;

// ❌ var is unclear — type comes from opaque method return
var result = service.process(data); // use: ProcessedData result = ...
```

TypeScript has the same readability risk with implicit `any` (before strict mode).

---

### 📝 Practice Challenges

1. TypeScript: without running the code, what is the inferred type of `const pairs = [[1, "a"], [2, "b"]]`? Is it `(number | string)[][]` or `[number, string][]`? How do you get the tuple type?
2. Java: write a generic method `<T> Optional<T> findFirst(List<T> list, Predicate<T> pred)`. Call it without explicit type parameters — which types does the compiler infer?
3. TypeScript `satisfies` operator (TS 4.9+): `const config = { port: 3000 } satisfies ServerConfig`. How is this different from `const config: ServerConfig = { port: 3000 }`? What does it preserve?

---

## Quick Reference: TypeScript vs Java Type System

```
Concept                    │ TypeScript                    │ Java
───────────────────────────┼───────────────────────────────┼────────────────────────────────
Type system style          │ Structural                    │ Nominal
Interface implements       │ Implicit (shape matching)     │ Explicit (must declare)
Interface at runtime       │ Erased (no instanceof)        │ Exists (instanceof works)
Union types                │ string | number               │ No equivalent pre-17
Sealed unions              │ Discriminated union           │ sealed classes (Java 17+)
Null safety                │ strictNullChecks + T|null     │ Optional<T> (convention)
Optional chaining          │ user?.name                    │ optional.map(User::getName)
Type narrowing             │ if (x instanceof X) narrows   │ if (x instanceof X y) pattern
Enums                      │ Use union literals (not enum) │ Full class instances with methods
Generics syntax            │ <T> after name                │ <T> before return type
Generic constraints        │ T extends X                   │ T extends X
Wildcards                  │ Use T extends/super instead   │ ? extends X / ? super X
Type erasure               │ Yes (compiled to JS)          │ Yes (JVM bytecode)
Type inference             │ Everywhere (even return types)│ Local only (var), lambda params
Type aliases               │ type Alias = ...              │ No equivalent
Mapped types               │ { [K in keyof T]: ... }       │ Not supported
Conditional types          │ T extends U ? X : Y           │ Not supported
```

---

*[Back to Index](../00_INDEX.md) | [TypeScript Chapters](../../17_TypeScript/) | [Java Path](../../PATH_JAVA_BACKEND.md) | [Frontend Path](../../PATH_FRONTEND.md)*


---

## Reality Check

**"TypeScript and Java type systems are basically the same"** — They differ fundamentally in STRUCTURAL versus NOMINAL typing ([17_TypeScript, 07_Modern_Java]): TS is structural (any object with the right shape matches — [17_TS/01]), Java is nominal (the type name matters, the explicit implements). This drives different behaviors (the TS excess-property-check quirk, the Java explicit-interface-implementation), and the fusion rounds drill the two models' consequences — "basically the same" misses the structural-versus-nominal split that determines what compiles and why.

**"Type erasure works the same in both"** — Both erase generics at runtime with different specifics ([17_TypeScript, 03_Algorithms/17]): TS erases ENTIRELY (types gone at runtime, no runtime type info — [17_TS/01] the validation-at-boundaries need), Java erases generics but keeps class types (the new T[] forbidden, the instanceof limits — [03_Algorithms/17]). The fusion rounds drill the erasure consequences in each (the TS runtime-validation, the Java generic-array workarounds), and "the same" misses that TS's total erasure and Java's partial erasure produce different constraints and different runtime-type strategies.

**"Advanced types transfer directly between the languages"** — The advanced features are language-specific ([17_TypeScript/02, 07_Modern_Java]): TS's conditional types, mapped types, template-literal types, and discriminated unions ([17_TS/02]) have no direct Java equivalent (Java has sealed classes, records, pattern-matching switches — [07_Modern_Java] different tools for related goals). The fusion rounds drill the analogous problems solved differently (the TS discriminated-union versus the Java sealed-hierarchy for the make-illegal-states-unrepresentable goal), and "transfer directly" misses that each language has its own type-level toolkit for the shared goals.

**"Strong typing means the same discipline in both"** — The disciplines differ where the type systems differ ([17_TypeScript/01, 07_Modern_Java]): TS's strictNullChecks and the null-handling ([17_TS/01] the billion-dollar-mistake tracked), Java's Optional and the nullable-by-default, the TS any-contagion versus Java's Object. The fusion rounds drill the language-appropriate discipline (the TS strict-mode and unknown-over-any, the Java Optional and null-safety), and "the same discipline" misses that the null-handling, the escape-hatches, and the strictness mechanisms are language-specific even where the goal (avoid null errors) is shared.

**"Knowing one type system means you know the other"** — The transferable part is the TYPE-THINKING (model the domain, make illegal states unrepresentable, validate at boundaries); the specifics are per-language ([17_TypeScript, 07_Modern_Java, the-whole-curriculum]): the shared principles (types as contracts, the boundary validation, the model-the-domain) transfer, and the mechanisms (structural-vs-nominal, the specific advanced features, the erasure specifics, the null handling) do not. The fusion rounds drill the transferable thinking applied through each language's specific tools, and "know one means know the other" is half-right — the type-thinking transfers, the language-specific type-system mechanics must be learned per language, the [the-whole-curriculum] principles-transfer-tools-differ applied to type systems.
