# 🎯 Functional Programming in Java

## Thinking in Functions

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why Learn Functional Programming in Java?                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Spring Boot uses lambdas everywhere - WebFlux, callbacks, configs          │
│  • Stream API: 10 lines of loops → 1 elegant line                             │
│  • Parallelism: .parallelStream() for instant multi-core processing           │
│  • Interview favorite: "Write this with streams" - a common interview task   │
│  • Modern Java: Java 8+ features are expected knowledge                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How Does Functional Programming Work?                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Lambdas: Anonymous functions - (x) -> x * 2                                 │
│  • Functional Interfaces: One abstract method - Predicate, Function, Consumer │
│  • Stream Pipeline: source → intermediate ops → terminal op                  │
│  • Method References: Class::method shorthand for lambdas                     │
│  • Optional: No more NullPointerException - explicit null handling            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Functional vs Imperative?                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  USE FUNCTIONAL:                                                                │
│  • Collection processing (filter, map, reduce)                                │
│  • Parallel processing needed                                                 │
│  • Callbacks, event handlers                                                  │
│                                                                                  │
│  USE IMPERATIVE:                                                                │
│  • Complex control flow with break/continue                                   │
│  • Performance-critical with primitive arrays                                 │
│  • Stateful operations needing external mutation                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Functional Concepts to Master?                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     Lambda syntax, Stream API (filter/map/collect), Optional       │
│  IMPORTANT:     Method references, Collectors, flatMap, reduce                 │
│  ADVANCED:      Custom collectors, parallel streams, CompletableFuture         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 0: COMPLETE UNDERSTANDING OF FUNCTIONAL PROGRAMMING

```
╔══════════════════════════════════════════════════════════════════════════════╗
║        FUNCTIONAL PROGRAMMING - COMPLETE UNDERSTANDING                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS FUNCTIONAL PROGRAMMING?                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ A programming PARADIGM where you build software by composing PURE FUNCTIONS │
│ that avoid changing state and mutating data.                                 │
│                                                                              │
│ KEY INSIGHT: Instead of telling the computer HOW to do something            │
│ step-by-step, you describe WHAT result you want.                            │
│                                                                              │
│ ANALOGY:                                                                     │
│ • IMPERATIVE (OOP): Recipe with step-by-step instructions                   │
│   "Heat pan, add oil, wait 2 min, add onions, stir for 5 min..."           │
│                                                                              │
│ • FUNCTIONAL: Describing the transformation                                  │
│   "Take raw ingredients → Apply cooking transformation → Get dish"          │
│                                                                              │
│ HISTORICAL EVOLUTION:                                                        │
│ • 1930s: Lambda calculus (Alonzo Church) - mathematical foundation          │
│ • 1958: LISP - first functional programming language                        │
│ • 1973: ML language - type inference                                        │
│ • 1990: Haskell - pure functional programming                               │
│ • 2014: Java 8 - lambdas and streams brought FP to Java                    │
│ • Today: FP concepts in all major languages (even JavaScript!)              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES FUNCTIONAL PROGRAMMING SOLVE?                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PROBLEM 1: BUGS FROM SHARED MUTABLE STATE                                    │
│                                                                              │
│ Imperative code:                                                             │
│   int total = 0;                                                             │
│   for (Order o : orders) {                                                   │
│       total += o.getAmount();  // What if another thread modifies total?   │
│   }                                                                          │
│                                                                              │
│ Functional code:                                                             │
│   int total = orders.stream()                                                │
│                      .mapToInt(Order::getAmount)                             │
│                      .sum();  // No mutable state!                          │
│                                                                              │
│ PROBLEM 2: HARD TO PARALLELIZE                                               │
│ • Imperative: Careful synchronization needed                                │
│ • Functional: Pure functions can run in parallel safely!                    │
│                                                                              │
│ PROBLEM 3: CODE HARD TO TEST                                                 │
│ • Imperative: Need to set up state, mock dependencies                       │
│ • Functional: Pure function - just test input → output                      │
│                                                                              │
│ PROBLEM 4: CODE HARD TO REASON ABOUT                                         │
│ • Imperative: "What's the value of x HERE vs THERE?"                        │
│ • Functional: Same input ALWAYS gives same output                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY LEARN FUNCTIONAL PROGRAMMING?                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. CLEANER CODE:                                                             │
│    10 lines of loop → 1 line of stream                                      │
│    More readable, less error-prone                                           │
│                                                                              │
│ 2. PARALLEL PROCESSING:                                                      │
│    list.parallelStream() instantly parallelizes!                            │
│    Critical for big data, multi-core CPUs                                   │
│                                                                              │
│ 3. INDUSTRY DEMAND:                                                          │
│    React (JavaScript) is functional                                          │
│    Spark (Big Data) is functional                                           │
│    Modern Java uses streams extensively                                      │
│                                                                              │
│ 4. BETTER ABSTRACTIONS:                                                      │
│    map, filter, reduce work on ANY collection                               │
│    Write once, use everywhere                                                │
│                                                                              │
│ 5. INTERVIEW ADVANTAGE:                                                      │
│    "Can you solve this with streams?"                                       │
│    Concise solutions impress interviewers                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE FUNCTIONAL vs IMPERATIVE                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ USE FUNCTIONAL WHEN:                                                         │
│ • Processing collections (filter, transform, aggregate)                     │
│ • Need parallel processing                                                   │
│ • Data transformations (pipelines)                                          │
│ • Avoiding side effects is important                                        │
│                                                                              │
│ USE IMPERATIVE WHEN:                                                         │
│ • Need early termination with complex conditions                            │
│ • Modifying multiple variables in complex ways                              │
│ • Performance-critical loops (sometimes)                                    │
│ • Index-based operations are clearer                                        │
│                                                                              │
│ BEST PRACTICE: Use BOTH! Java supports multi-paradigm                       │
│ • Use streams for data processing                                           │
│ • Use loops when they're clearer                                            │
│ • Don't force functional style where it doesn't fit                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN LEARNING FUNCTIONAL PROGRAMMING                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. "I THINK IN LOOPS":                                                       │
│    Solution: Start by converting existing loops to streams                  │
│    for → forEach, filter → if inside loop, map → transformation            │
│                                                                              │
│ 2. "LAMBDAS ARE CONFUSING":                                                  │
│    Solution: Think of them as "mini-functions without a name"               │
│    (x) -> x * 2 is just a function that doubles                            │
│                                                                              │
│ 3. "DEBUGGING IS HARD":                                                      │
│    Solution: Break long streams into smaller pieces                         │
│    Add peek() to see intermediate values                                    │
│                                                                              │
│ 4. "DON'T KNOW WHICH METHOD TO USE":                                         │
│    Solution: Master the 6 core operations first:                            │
│    filter, map, flatMap, reduce, collect, forEach                          │
│                                                                              │
│ 5. "WHEN IS IT OVERKILL?":                                                   │
│    Solution: If a simple loop is clearer, use the loop!                    │
│    FP is a tool, not a religion                                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS OF MASTERING FUNCTIONAL PROGRAMMING                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ CONCISE CODE: Replace 10-line loops with 1-line streams                  │
│ ✅ SAFER CODE: No shared mutable state bugs                                  │
│ ✅ PARALLEL READY: Easy parallelization when needed                         │
│ ✅ MODERN JAVA: Use Java 8+ features professionally                         │
│ ✅ INTERVIEW READY: Solve problems elegantly with streams                   │
│ ✅ CROSS-LANGUAGE: Same concepts in JavaScript, Python, Scala              │
│                                                                              │
│ THE TRANSFORMATION:                                                          │
│ FROM: "How do I iterate through this collection?"                           │
│   TO: "What transformation do I need to apply?"                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: WHAT IS FUNCTIONAL PROGRAMMING?

## The Mental Shift

```
IMPERATIVE (How to do it):
"Go to the store. Pick up milk. Go to checkout. Pay. Come back."

FUNCTIONAL (What to do):
"Get milk from store."

IMPERATIVE CODE:
List<Integer> result = new ArrayList<>();
for (int num : numbers) {
    if (num % 2 == 0) {
        result.add(num * 2);
    }
}

FUNCTIONAL CODE:
List<Integer> result = numbers.stream()
    .filter(n -> n % 2 == 0)
    .map(n -> n * 2)
    .collect(Collectors.toList());
```

## Core Principles

```
1. PURE FUNCTIONS
   - Same input → Same output (always!)
   - No side effects (doesn't modify external state)

   // IMPURE (modifies external state)
   int counter = 0;
   void incrementCounter() { counter++; }

   // PURE (no side effects)
   int increment(int x) { return x + 1; }

2. IMMUTABILITY
   - Don't modify data, create new data

   // MUTABLE (bad)
   list.add(item);  // Modifies original

   // IMMUTABLE (good)
   List<Item> newList = new ArrayList<>(list);
   newList.add(item);

3. FIRST-CLASS FUNCTIONS
   - Functions can be passed as arguments
   - Functions can be returned from functions
   - Functions can be stored in variables

4. DECLARATIVE STYLE
   - Describe WHAT you want, not HOW to get it
```

---

# PART 2: LAMBDA EXPRESSIONS

## Basic Syntax

```java
// ANONYMOUS FUNCTION SYNTAX:
// (parameters) -> expression
// (parameters) -> { statements; }

// EXAMPLES:

// No parameters
() -> System.out.println("Hello")

// One parameter (parentheses optional)
x -> x * 2
(x) -> x * 2

// Two parameters
(x, y) -> x + y

// Multiple statements (need braces and return)
(x, y) -> {
    int sum = x + y;
    return sum * 2;
}

// Type inference - Java figures out types
(String s) -> s.length()  // Explicit
s -> s.length()           // Inferred (cleaner)
```

## Common Usage Patterns

```java
// 1. SORTING
List<String> names = Arrays.asList("Bob", "Alice", "Charlie");

// Old way
Collections.sort(names, new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return a.compareTo(b);
    }
});

// Lambda way
Collections.sort(names, (a, b) -> a.compareTo(b));

// Even simpler with method reference
names.sort(String::compareTo);


// 2. THREADING
// Old way
new Thread(new Runnable() {
    @Override
    public void run() {
        System.out.println("Running!");
    }
}).start();

// Lambda way
new Thread(() -> System.out.println("Running!")).start();


// 3. EVENT HANDLING
button.addActionListener(e -> handleClick(e));
```

---

# PART 3: FUNCTIONAL INTERFACES

## What Are They?

```java
// An interface with EXACTLY ONE abstract method
// Can be used with lambda expressions

@FunctionalInterface  // Optional annotation for compile-time check
interface Greeting {
    void greet(String name);
}

// Usage
Greeting hello = name -> System.out.println("Hello, " + name);
hello.greet("Harsha");  // "Hello, Harsha"
```

## Built-in Functional Interfaces

```java
// Java provides these in java.util.function package:

// 1. Predicate<T> - Takes T, returns boolean
Predicate<Integer> isEven = n -> n % 2 == 0;
isEven.test(4);  // true
isEven.test(3);  // false

// 2. Function<T, R> - Takes T, returns R
Function<String, Integer> length = s -> s.length();
length.apply("Hello");  // 5

// 3. Consumer<T> - Takes T, returns nothing
Consumer<String> print = s -> System.out.println(s);
print.accept("Hello");  // prints "Hello"

// 4. Supplier<T> - Takes nothing, returns T
Supplier<Double> random = () -> Math.random();
random.get();  // random number

// 5. BiFunction<T, U, R> - Takes T and U, returns R
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
add.apply(3, 4);  // 7

// 6. BinaryOperator<T> - Takes two T, returns T
BinaryOperator<Integer> multiply = (a, b) -> a * b;
multiply.apply(3, 4);  // 12

// 7. UnaryOperator<T> - Takes T, returns T
UnaryOperator<Integer> square = n -> n * n;
square.apply(5);  // 25
```

## Chaining Predicates

```java
Predicate<Integer> isPositive = n -> n > 0;
Predicate<Integer> isEven = n -> n % 2 == 0;

// AND
Predicate<Integer> isPositiveAndEven = isPositive.and(isEven);
isPositiveAndEven.test(4);   // true
isPositiveAndEven.test(-4);  // false (not positive)

// OR
Predicate<Integer> isPositiveOrEven = isPositive.or(isEven);
isPositiveOrEven.test(-4);  // true (is even)

// NEGATE
Predicate<Integer> isNotPositive = isPositive.negate();
isNotPositive.test(-5);  // true
```

---

# PART 4: STREAM API

## What is a Stream?

```
A Stream is a sequence of elements that supports
declarative, functional-style operations.

          Source → Stream → Intermediate Ops → Terminal Op → Result

          List   →  stream()  →  filter, map  →  collect   →  List

IMPORTANT:
- Streams are NOT data structures (they don't store data)
- Streams are LAZY (operations only run when terminal op is called)
- Streams can only be consumed ONCE
```

## Creating Streams

```java
// From Collection
List<String> list = Arrays.asList("a", "b", "c");
Stream<String> stream1 = list.stream();

// From Array
int[] arr = {1, 2, 3};
IntStream stream2 = Arrays.stream(arr);

// From values
Stream<String> stream3 = Stream.of("a", "b", "c");

// Generate infinite streams
Stream<Double> randoms = Stream.generate(Math::random);
Stream<Integer> counting = Stream.iterate(0, n -> n + 1);

// Range
IntStream range = IntStream.range(1, 10);      // 1 to 9
IntStream rangeClosed = IntStream.rangeClosed(1, 10);  // 1 to 10
```

## Intermediate Operations (Transform Stream)

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// FILTER - Keep elements matching condition
numbers.stream()
    .filter(n -> n % 2 == 0)  // [2, 4, 6, 8, 10]

// MAP - Transform each element
numbers.stream()
    .map(n -> n * 2)  // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

// FLATMAP - Flatten nested structures
List<List<Integer>> nested = Arrays.asList(
    Arrays.asList(1, 2),
    Arrays.asList(3, 4)
);
nested.stream()
    .flatMap(list -> list.stream())  // [1, 2, 3, 4]

// SORTED - Sort elements
numbers.stream()
    .sorted()  // Natural order
    .sorted(Comparator.reverseOrder())  // Reverse order

// DISTINCT - Remove duplicates
Arrays.asList(1, 1, 2, 2, 3).stream()
    .distinct()  // [1, 2, 3]

// LIMIT - Take first n elements
numbers.stream()
    .limit(3)  // [1, 2, 3]

// SKIP - Skip first n elements
numbers.stream()
    .skip(3)  // [4, 5, 6, 7, 8, 9, 10]

// PEEK - Debug/inspect (side effect, use carefully)
numbers.stream()
    .peek(n -> System.out.println("Processing: " + n))
    .filter(n -> n > 5)
```

## Terminal Operations (Produce Result)

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// COLLECT - Gather into collection
List<Integer> evenList = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());

Set<Integer> evenSet = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toSet());

// FOREACH - Perform action on each
numbers.stream()
    .forEach(n -> System.out.println(n));

// COUNT - Count elements
long count = numbers.stream()
    .filter(n -> n > 3)
    .count();  // 2

// REDUCE - Combine all elements into one
int sum = numbers.stream()
    .reduce(0, (a, b) -> a + b);  // 15

int product = numbers.stream()
    .reduce(1, (a, b) -> a * b);  // 120

// FINDFIRST / FINDANY - Get one element
Optional<Integer> first = numbers.stream()
    .filter(n -> n > 3)
    .findFirst();  // Optional[4]

// MIN / MAX
Optional<Integer> max = numbers.stream()
    .max(Integer::compareTo);  // Optional[5]

// ANYMATCH / ALLMATCH / NONEMATCH
boolean anyEven = numbers.stream().anyMatch(n -> n % 2 == 0);  // true
boolean allPositive = numbers.stream().allMatch(n -> n > 0);   // true
boolean noneNegative = numbers.stream().noneMatch(n -> n < 0); // true

// TOARRAY
Integer[] arr = numbers.stream().toArray(Integer[]::new);
```

---

# PART 5: COMMON STREAM PATTERNS

## Pattern 1: Filter-Map-Collect

```java
// Most common pattern!
// Filter some elements, transform them, collect results

List<Person> people = ...;

List<String> adultNames = people.stream()
    .filter(p -> p.getAge() >= 18)    // Keep adults
    .map(Person::getName)              // Get names
    .collect(Collectors.toList());     // Collect to list
```

## Pattern 2: Grouping

```java
// Group elements by some property

List<Person> people = ...;

Map<String, List<Person>> byCity = people.stream()
    .collect(Collectors.groupingBy(Person::getCity));

// {"New York": [person1, person2], "LA": [person3]}

// Group and count
Map<String, Long> countByCity = people.stream()
    .collect(Collectors.groupingBy(Person::getCity, Collectors.counting()));

// {"New York": 2, "LA": 1}
```

## Pattern 3: Partitioning

```java
// Split into two groups based on predicate

Map<Boolean, List<Person>> adultOrNot = people.stream()
    .collect(Collectors.partitioningBy(p -> p.getAge() >= 18));

// {true: [adults], false: [minors]}
```

## Pattern 4: Joining Strings

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

String joined = names.stream()
    .collect(Collectors.joining(", "));

// "Alice, Bob, Charlie"

String withPrefixSuffix = names.stream()
    .collect(Collectors.joining(", ", "[", "]"));

// "[Alice, Bob, Charlie]"
```

## Pattern 5: Statistics

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

IntSummaryStatistics stats = numbers.stream()
    .mapToInt(Integer::intValue)
    .summaryStatistics();

stats.getSum();     // 15
stats.getAverage(); // 3.0
stats.getMin();     // 1
stats.getMax();     // 5
stats.getCount();   // 5
```

---

# PART 6: METHOD REFERENCES

## The Four Types

```java
// Method references are shorthand for lambdas that just call a method

// 1. STATIC METHOD REFERENCE
// Class::staticMethod
Function<String, Integer> parse = Integer::parseInt;
// Same as: s -> Integer.parseInt(s)

// 2. INSTANCE METHOD OF PARTICULAR OBJECT
// object::instanceMethod
String prefix = "Mr. ";
Function<String, String> addPrefix = prefix::concat;
// Same as: s -> prefix.concat(s)

// 3. INSTANCE METHOD OF ARBITRARY OBJECT
// Class::instanceMethod
Function<String, Integer> length = String::length;
// Same as: s -> s.length()

BiPredicate<String, String> eq = String::equals;
// Same as: (s1, s2) -> s1.equals(s2)

// 4. CONSTRUCTOR REFERENCE
// Class::new
Supplier<List<String>> listMaker = ArrayList::new;
// Same as: () -> new ArrayList<>()

Function<Integer, int[]> arrayMaker = int[]::new;
// Same as: size -> new int[size]
```

## When to Use Method References

```java
// USE when lambda just calls an existing method
list.forEach(System.out::println);  // ✓ Clean
list.forEach(x -> System.out.println(x));  // Unnecessary lambda

// DON'T USE when you need to do more
list.forEach(x -> System.out.println("Value: " + x));  // Need lambda
```

---

# PART 7: OPTIONAL

## The Null Problem

```java
// The billion-dollar mistake
String name = person.getAddress().getCity().getName();
// Any of these could be null → NullPointerException!

// Old solution: Defensive null checks
String name = null;
if (person != null) {
    Address address = person.getAddress();
    if (address != null) {
        City city = address.getCity();
        if (city != null) {
            name = city.getName();
        }
    }
}
// UGLY!
```

## Optional to the Rescue

```java
// Optional<T> is a container that may or may not contain a value

// Creating Optional
Optional<String> full = Optional.of("Hello");      // Contains value
Optional<String> empty = Optional.empty();          // Empty
Optional<String> nullable = Optional.ofNullable(x); // null becomes empty

// Getting value safely
String value = optional.orElse("default");
String value = optional.orElseGet(() -> computeDefault());
String value = optional.orElseThrow(() -> new RuntimeException());

// Check if present
if (optional.isPresent()) {
    System.out.println(optional.get());
}

// Better: ifPresent
optional.ifPresent(v -> System.out.println(v));

// Chaining operations
Optional<String> name = Optional.ofNullable(person)
    .map(Person::getAddress)
    .map(Address::getCity)
    .map(City::getName);

// Filtering
Optional<String> longName = Optional.ofNullable(name)
    .filter(n -> n.length() > 5);

// FlatMap for Optional-returning functions
Optional<String> result = optional
    .flatMap(v -> Optional.ofNullable(transform(v)));
```

---

# PART 8: FUNCTIONAL DSA EXAMPLES

## Example 1: Find Max Element

```java
// Imperative
int max = Integer.MIN_VALUE;
for (int num : numbers) {
    if (num > max) {
        max = num;
    }
}

// Functional
int max = numbers.stream()
    .max(Integer::compareTo)
    .orElse(Integer.MIN_VALUE);
```

## Example 2: Sum of Squares of Even Numbers

```java
// Imperative
int sum = 0;
for (int num : numbers) {
    if (num % 2 == 0) {
        sum += num * num;
    }
}

// Functional
int sum = numbers.stream()
    .filter(n -> n % 2 == 0)
    .map(n -> n * n)
    .reduce(0, Integer::sum);
```

## Example 3: First Duplicate

```java
// Functional approach to find first duplicate
public Optional<Integer> findFirstDuplicate(List<Integer> numbers) {
    Set<Integer> seen = new HashSet<>();
    return numbers.stream()
        .filter(n -> !seen.add(n))  // add returns false for duplicates
        .findFirst();
}
```

## Example 4: Frequency Map

```java
// Count frequency of each element
Map<Integer, Long> frequency = numbers.stream()
    .collect(Collectors.groupingBy(
        Function.identity(),
        Collectors.counting()
    ));

// {1: 2, 2: 3, 3: 1}
```

## Example 5: Flatten 2D Array

```java
int[][] matrix = {{1, 2}, {3, 4}, {5, 6}};

List<Integer> flat = Arrays.stream(matrix)
    .flatMapToInt(Arrays::stream)
    .boxed()
    .collect(Collectors.toList());

// [1, 2, 3, 4, 5, 6]
```

---

# PART 9: WHEN TO USE FUNCTIONAL STYLE

```
USE FUNCTIONAL WHEN:
✓ Processing collections (filter, map, transform)
✓ Parallel processing needed (parallelStream)
✓ Code is about WHAT, not HOW
✓ Chaining multiple operations
✓ Working with Optional values

USE IMPERATIVE WHEN:
✓ Performance is critical (streams have overhead)
✓ Need to break/continue in loops
✓ Modifying elements in place
✓ Complex state management
✓ Index-based operations needed

HYBRID IS FINE:
Mixing styles is normal and often best!
```

---

# PART 10: MODERN JAVA FEATURES (Java 10+)

## A. LOCAL VARIABLE TYPE INFERENCE (var) - Java 10

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LOCAL VARIABLE TYPE INFERENCE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WHAT IS var?                                                                    │
│  The compiler INFERS the type from the right-hand side                          │
│                                                                                  │
│  BEFORE (verbose):                                                               │
│    Map<String, List<Employee>> departments = new HashMap<>();                   │
│    HttpServletRequest request = (HttpServletRequest) servletRequest;            │
│                                                                                  │
│  AFTER (concise):                                                                │
│    var departments = new HashMap<String, List<Employee>>();                     │
│    var request = (HttpServletRequest) servletRequest;                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
// WHERE TO USE var

// ✅ GOOD: Long generic types
var userService = new UserServiceImpl();
var userMap = new HashMap<String, List<User>>();
var iterator = collection.iterator();
var stream = list.stream().filter(x -> x > 0);

// ✅ GOOD: Try-with-resources
try (var reader = new BufferedReader(new FileReader("file.txt"))) {
    var line = reader.readLine();  // Clear from context
}

// ✅ GOOD: For-each loops
for (var user : users) {
    System.out.println(user.getName());
}

// ❌ BAD: Type not clear from right side
var result = getResult();     // What type is result?
var data = process(input);    // Unclear!

// ❌ BAD: Primitives where int/double conveys meaning
var count = 0;        // Use int count = 0;
var rate = 3.14;      // Use double rate = 3.14;

// ❌ INVALID: Cannot use var
var name;                     // No initializer
var arr = {1, 2, 3};         // Array initializer
var lambda = (x) -> x * 2;   // Lambda needs explicit type

// ✅ These work:
String[] arr = {1, 2, 3};                    // Explicit type
Function<Integer, Integer> lambda = x -> x * 2;  // Explicit type
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  var RULES                                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ✓ Only for LOCAL variables (not fields, parameters, or return types)          │
│  ✓ Must have initializer on same line                                           │
│  ✓ Type is determined at COMPILE time (not runtime)                            │
│  ✓ var is NOT a keyword - can still use as variable name (not recommended)     │
│                                                                                  │
│  INTERVIEW TIP: "var improves readability when type is obvious from context,   │
│  but explicit types are better when they document intent"                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## B. JAVA RECORDS (Java 16+)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         JAVA RECORDS - IMMUTABLE DATA CARRIERS                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WHAT IS A RECORD?                                                               │
│  A concise way to declare classes that are "data carriers" - classes whose main │
│  purpose is to hold data, not behavior.                                          │
│                                                                                  │
│  PROBLEM: Traditional "POJO" classes require lots of boilerplate:               │
│                                                                                  │
│  // 50+ lines for a simple data class!                                          │
│  public class User {                                                             │
│      private final String name;                                                 │
│      private final int age;                                                     │
│      // Constructor                                                             │
│      // Getters                                                                 │
│      // equals()                                                                │
│      // hashCode()                                                              │
│      // toString()                                                              │
│  }                                                                               │
│                                                                                  │
│  SOLUTION WITH RECORDS:                                                          │
│                                                                                  │
│  public record User(String name, int age) { }  // 1 line! That's it!           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
// BASIC RECORD SYNTAX
public record User(String name, String email, int age) { }

// WHAT THE COMPILER GENERATES:
// - Private final fields for each component
// - Public constructor taking all components
// - Public accessor methods: name(), email(), age()  (NOT getName()!)
// - equals() based on all components
// - hashCode() based on all components
// - toString() like: User[name=John, email=john@email.com, age=25]

// USAGE
var user = new User("John", "john@email.com", 25);
System.out.println(user.name());      // John (not getName!)
System.out.println(user);             // User[name=John, email=john@email.com, age=25]

// COMPARING
var user1 = new User("John", "john@email.com", 25);
var user2 = new User("John", "john@email.com", 25);
System.out.println(user1.equals(user2));  // true - compares all fields!
```

```java
// ADDING CUSTOM LOGIC TO RECORDS

// 1. Custom Constructor (Validation)
public record User(String name, String email, int age) {
    // Compact constructor - no parameter list needed
    public User {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be blank");
        }
        if (age < 0 || age > 150) {
            throw new IllegalArgumentException("Invalid age");
        }
        // name, email, age are auto-assigned after this block
    }
}

// 2. Custom Methods
public record Point(int x, int y) {
    // Additional methods
    public double distanceFromOrigin() {
        return Math.sqrt(x * x + y * y);
    }
    
    // Static factory methods
    public static Point origin() {
        return new Point(0, 0);
    }
}

// 3. Custom Accessor (rarely needed)
public record SensitiveData(String password) {
    @Override
    public String password() {
        return "********";  // Hide actual value
    }
}
```

```java
// RECORDS IN SPRING BOOT - PERFECT FOR DTOs!

// Request DTO
public record CreateUserRequest(
    @NotBlank String name,
    @Email String email,
    @Min(0) @Max(150) int age
) { }

// Response DTO
public record UserResponse(Long id, String name, String email) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}

// Controller using records
@RestController
public class UserController {
    
    @PostMapping("/users")
    public ResponseEntity<UserResponse> create(
            @Valid @RequestBody CreateUserRequest request) {
        User user = userService.create(request);
        return ResponseEntity.ok(UserResponse.from(user));
    }
}
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  RECORDS vs CLASS vs LOMBOK                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────┬──────────────────────────────────────────────────────────┐  │
│  │ Feature        │ class           │ record          │ @Data (Lombok)       │  │
│  ├────────────────┼──────────────────────────────────────────────────────────┤  │
│  │ Immutable      │ Manual          │ Always          │ @Value for immutable │  │
│  │ Inheritance    │ Yes             │ No (final)      │ Yes                  │  │
│  │ Mutable fields │ Yes             │ No              │ Yes                  │  │
│  │ Boilerplate    │ High            │ None            │ None                 │  │
│  │ External dep   │ None            │ None            │ Lombok               │  │
│  │ Serialization  │ Works           │ Works           │ Works                │  │
│  │ JPA Entities   │ Yes             │ No (immutable)  │ Yes                  │  │
│  └────────────────┴──────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  WHEN TO USE RECORDS:                                                            │
│  ✓ DTOs (Request/Response objects)                                              │
│  ✓ Value objects (Money, Address, Coordinates)                                  │
│  ✓ Compound map keys                                                            │
│  ✓ Return multiple values from a method                                         │
│                                                                                  │
│  WHEN NOT TO USE RECORDS:                                                        │
│  ✗ JPA Entities (need mutable setters, default constructor)                    │
│  ✗ Classes with behavior more important than data                              │
│  ✗ Classes that need inheritance                                                │
│                                                                                  │
│  INTERVIEW TIP: "Records are perfect for DTOs because they're immutable,       │
│  concise, and automatically implement equals/hashCode correctly"                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 11: PRACTICE EXERCISES

1. Write a stream pipeline to:
    - Filter strings longer than 3 characters
    - Convert to uppercase
    - Sort alphabetically
    - Collect to list

2. Given a list of transactions, find:
    - Total value of all transactions
    - Transactions grouped by type
    - The highest value transaction

3. Implement these with streams:
    - Find all prime numbers up to n
    - Find anagrams in a list of words
    - Merge two sorted lists

4. Convert imperative to functional:
    ```java
    List<String> result = new ArrayList<>();
    for (Person p : people) {
        if (p.getAge() > 20 && p.getAge() < 30) {
            String name = p.getName().toUpperCase();
            if (!result.contains(name)) {
                result.add(name);
            }
        }
    }
    ```

---

_Functional programming is about clarity and composability!_ 🎯
