# Chapter 31 — Java Deep Reasoning: The Questions That Freeze People

> **"Anyone can say 'Java is object-oriented.' The senior engineer explains WHY String is immutable, HOW HashMap actually works under the hood, and WHAT happens when you write `Integer a = 127; Integer b = 127; a == b`."**

---

## Table of Contents

1. [Pass By Value: Java NEVER Passes By Reference](#1-pass-by-value-java-never-passes-by-reference)
2. [String Pool & Immutability: Why Strings Behave Strangely](#2-string-pool--immutability-why-strings-behave-strangely)
3. [`==` vs `.equals()`: The Identity vs Equality Trap](#3--vs-equals-the-identity-vs-equality-trap)
4. [Integer Cache: Why 127 == 127 But 128 != 128](#4-integer-cache-why-127--127-but-128--128)
5. [Generics Type Erasure: Why You Can't Do `new T()`](#5-generics-type-erasure-why-you-cant-do-new-t)
6. [HashMap Internals: Not Just "Key-Value Store"](#6-hashmap-internals-not-just-key-value-store)
7. [`final` Keyword: Three Different Meanings](#7-final-keyword-three-different-meanings)
8. [Checked vs Unchecked Exceptions: The Design Philosophy](#8-checked-vs-unchecked-exceptions-the-design-philosophy)
9. [Autoboxing Traps: Where Performance Silently Degrades](#9-autoboxing-traps-where-performance-silently-degrades)
10. [ConcurrentModificationException: Why Iterating + Modifying Fails](#10-concurrentmodificationexception-why-iterating--modifying-fails)
11. [`synchronized`, `volatile`, `Atomic`: Three Levels of Thread Safety](#11-synchronized-volatile-atomic-three-levels-of-thread-safety)
12. [Abstract Class vs Interface: The Post-Java-8 Reality](#12-abstract-class-vs-interface-the-post-java-8-reality)
13. [Garbage Collection: What Actually Happens](#13-garbage-collection-what-actually-happens)

---

## 1. Pass By Value: Java NEVER Passes By Reference

### The Freeze Question
> "Is Java pass by value or pass by reference?"

### Deep Reasoning

```
╔══════════════════════════════════════════════════════════════════╗
║  THE HOUSE ADDRESS ANALOGY                                       ║
║                                                                  ║
║  You have a house at 123 Main St.                                ║
║  You give me a COPY of the address (not the keys).               ║
║                                                                  ║
║  I can VISIT the house and rearrange furniture inside:           ║
║    → modifyObject(dog) → dog.name = "Max" → ORIGINAL changes     ║
║                                                                  ║
║  But I CANNOT demolish your house and build a new one:           ║
║    → dog = new Dog("Rex") → only MY copy of the address changes  ║
║    → YOUR original variable still points to the old house        ║
║                                                                  ║
║  Java ALWAYS passes a COPY of the value.                         ║
║  For primitives: copy of the value (5, true, 'a')                ║
║  For objects: copy of the REFERENCE (the address), not the       ║
║              object itself. The reference is passed BY VALUE.    ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
public class PassByValueDemo {
    public static void main(String[] args) {
        // PRIMITIVES: Copy of value — original unchanged
        int x = 10;
        changeValue(x);
        System.out.println(x); // 10 — NOT 20

        // OBJECTS: Copy of reference — can modify internals
        Dog dog = new Dog("Buddy");
        changeName(dog);
        System.out.println(dog.name); // "Max" — internals changed!

        // OBJECTS: Copy of reference — can't reassign original
        Dog dog2 = new Dog("Buddy");
        replaceObject(dog2);
        System.out.println(dog2.name); // "Buddy" — NOT replaced!
    }

    static void changeValue(int x) { x = 20; }              // changes copy
    static void changeName(Dog d) { d.name = "Max"; }        // modifies via copy
    static void replaceObject(Dog d) { d = new Dog("Rex"); } // replaces copy only
}
```

**Follow-Up Trap:** "So if I pass an array and modify it inside the method, does the caller see the change?" YES — because the method has a copy of the reference to the SAME array in memory. Modifying array[0] affects the original. But `array = new int[5]` only changes the local copy.

---

## 2. String Pool & Immutability: Why Strings Behave Strangely

### The Freeze Question
> "Why is String immutable? What's the String pool?"

```
╔══════════════════════════════════════════════════════════════════╗
║  THE PUBLIC LIBRARY ANALOGY                                      ║
║                                                                  ║
║  String pool = A public library with ONE copy of each book       ║
║                                                                  ║
║  String a = "hello"; → Library: "We have 'hello'. Here's the     ║
║                         reference to the SAME copy."             ║
║  String b = "hello"; → Library: "We already have 'hello'.        ║
║                         Here's the SAME reference."              ║
║  a == b → true! Same physical book (same object in pool)         ║
║                                                                  ║
║  String c = new String("hello"); → "I don't want the library     ║
║                         copy. Make me a PRIVATE copy."           ║
║  a == c → false! Different physical books (different objects)    ║
║  a.equals(c) → true! Same content                                ║
║                                                                  ║
║  WHY IMMUTABLE?                                                  ║
║  If anyone could change the library book, EVERYONE reading it    ║
║  would see the change. Immutability ensures sharing is safe.     ║
║  Also: security (class names, URLs), hashCode caching,           ║
║  thread safety.                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
String s1 = "hello";                    // Pool lookup → creates "hello" in pool
String s2 = "hello";                    // Pool lookup → reuses same object
String s3 = new String("hello");        // Forces new object on heap (bypasses pool)
String s4 = new String("hello").intern(); // Puts back into pool → same as s1

System.out.println(s1 == s2);     // true  — same pool object
System.out.println(s1 == s3);     // false — different objects
System.out.println(s1 == s4);     // true  — intern() returns pool reference
System.out.println(s1.equals(s3)); // true — same content

// Immutability proof:
String original = "hello";
String upper = original.toUpperCase(); // Creates NEW string "HELLO"
System.out.println(original); // "hello" — unchanged!
// Every String "modification" creates a new String object.
// This is why StringBuilder exists — for many concatenations.
```

---

## 3. `==` vs `.equals()`: The Identity vs Equality Trap

### The Freeze Question
> "When do I use == and when do I use .equals()?"

```
╔══════════════════════════════════════════════════════════════════╗
║  ==       → "Are these the SAME object in memory?"               ║
║              (Compares references / addresses)                   ║
║                                                                  ║
║  .equals()→ "Do these have the SAME content?"                    ║
║              (Compares values — but MUST be overridden!)         ║
║                                                                  ║
║  For PRIMITIVES (int, char, boolean):                            ║
║  → Use == (there's no .equals() for primitives)                  ║
║  → 5 == 5 is true. Simple.                                       ║
║                                                                  ║
║  For OBJECTS (String, Integer, custom classes):                  ║
║  → Use .equals() for content comparison                          ║
║  → == checks if they're literally the same object                ║
║                                                                  ║
║  CRITICAL: Default .equals() (from Object) uses ==               ║
║  You MUST override .equals() in your classes!                    ║
║  And when you override equals, ALWAYS override hashCode too.     ║
║  (HashMap depends on this contract)                              ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// Classic gotcha:
String a = new String("hello");
String b = new String("hello");
System.out.println(a == b);      // false (different objects)
System.out.println(a.equals(b)); // true  (same content)

// Custom class WITHOUT overriding equals:
class Point { int x, y; Point(int x, int y) { this.x=x; this.y=y; } }
Point p1 = new Point(1, 2);
Point p2 = new Point(1, 2);
System.out.println(p1.equals(p2)); // false! Default equals uses ==

// CORRECT implementation:
class Point {
    int x, y;
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Point p = (Point) obj;
        return x == p.x && y == p.y;
    }
    @Override
    public int hashCode() {
        return Objects.hash(x, y); // MUST override with equals!
    }
}
```

---

## 4. Integer Cache: Why 127 == 127 But 128 != 128

### The Freeze Question
> "Why does `Integer a = 127; Integer b = 127; a == b` return true, but with 128 it returns false?"

```
╔══════════════════════════════════════════════════════════════════╗
║  THE VIP LOUNGE ANALOGY                                          ║
║                                                                  ║
║  Java has a VIP lounge for "popular" integers: -128 to 127.      ║
║  These 256 Integer objects are pre-created and CACHED.           ║
║                                                                  ║
║  Integer a = 127 → "127 is a VIP. Here's the cached object."     ║
║  Integer b = 127 → "127 is a VIP. Here's the SAME cached one."   ║
║  a == b → true (same object from cache!)                         ║
║                                                                  ║
║  Integer c = 128 → "128 is NOT a VIP. Create a NEW object."      ║
║  Integer d = 128 → "128 is NOT a VIP. Create ANOTHER object."    ║
║  c == d → false (different objects!)                             ║
║                                                                  ║
║  LESSON: NEVER use == with wrapper types.                        ║
║  Always use .equals() or unbox first.                            ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
Integer a = 127, b = 127;
System.out.println(a == b);      // true  — cached range [-128, 127]
System.out.println(a.equals(b)); // true

Integer c = 128, d = 128;
System.out.println(c == d);      // false — outside cache!
System.out.println(c.equals(d)); // true  — always use this

// Same applies to: Byte, Short, Long (-128 to 127)
// Character (0 to 127)
// Boolean (TRUE, FALSE always cached)
```

---

## 5. Generics Type Erasure: Why You Can't Do `new T()`

### The Freeze Question
> "Why can't I write `new T()` or `instanceof T` in generics?"

```
╔══════════════════════════════════════════════════════════════════╗
║  TYPE ERASURE = The Costume Party                                ║
║                                                                  ║
║  At compile time, everyone wears name tags (types).              ║
║  At runtime, all name tags are removed — everyone looks the      ║
║  same (raw types).                                               ║
║                                                                  ║
║  List<String> at compile time → List at runtime                  ║
║  List<Integer> at compile time → List at runtime                 ║
║  They're THE SAME class at runtime!                              ║
║                                                                  ║
║  WHY? Java added generics in Java 5. Old code used raw List.     ║
║  To maintain backward compatibility, the JVM doesn't know        ║
║  about generic types — the compiler erases them.                 ║
║                                                                  ║
║  CONSEQUENCES:                                                   ║
║  ❌ new T()            — T is erased, JVM doesn't know the type   ║
║  ❌ instanceof T       — no type info at runtime                  ║
║  ❌ T.class            — erased                                   ║
║  ❌ new T[10]          — can't create generic arrays              ║
║  ❌ catch T            — can't catch generic exceptions           ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// What you write:
public class Box<T> {
    private T item;
    public void set(T item) { this.item = item; }
    public T get() { return item; }
}

// What the compiler produces (after erasure):
public class Box {
    private Object item;           // T → Object
    public void set(Object item) { this.item = item; }
    public Object get() { return item; }
}
// Casts are inserted at call sites:
Box<String> box = new Box<>();
String s = box.get(); // Compiler inserts: String s = (String) box.get();

// WORKAROUND for new T(): Pass Class<T>
public static <T> T create(Class<T> clazz) throws Exception {
    return clazz.getDeclaredConstructor().newInstance();
}
Dog dog = create(Dog.class); // Works!
```

---

## 6. HashMap Internals: Not Just "Key-Value Store"

### The Freeze Question
> "How does HashMap work internally? What happens on collision?"

```
╔══════════════════════════════════════════════════════════════════╗
║  THE FILING CABINET ANALOGY                                      ║
║                                                                  ║
║  HashMap = A filing cabinet with 16 drawers (default capacity)   ║
║                                                                  ║
║  1. PUT("Alice", 25):                                            ║
║     hashCode("Alice") = 92668751                                 ║
║     Drawer index = 92668751 % 16 = 7                             ║
║     Put entry in Drawer 7.                                       ║
║                                                                  ║
║  2. PUT("Bob", 30):                                              ║
║     hashCode("Bob") = 66965 → Drawer 5. No collision.            ║
║                                                                  ║
║  3. COLLISION: PUT("Celia", 28) → also maps to Drawer 7!         ║
║     Java 7: Linked list in that drawer. O(n) worst case.         ║
║     Java 8+: If list > 8 entries, convert to RED-BLACK TREE.     ║
║              Now O(log n) instead of O(n).                       ║
║                                                                  ║
║  4. RESIZE: When 75% full (load factor 0.75), capacity           ║
║     DOUBLES (16→32) and ALL entries are REHASHED.                ║
║     This is expensive! Set initial capacity if you know size.    ║
║                                                                  ║
║  WHY hashCode + equals CONTRACT MATTERS:                         ║
║  1. hashCode → picks the drawer                                  ║
║  2. equals → finds the right file IN that drawer                 ║
║  If equals says "same" but hashCodes differ → different drawer   ║
║  → HashMap can't find the entry. Lost data!                      ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// The contract: If a.equals(b), then a.hashCode() == b.hashCode()
// Reverse is NOT required: same hashCode doesn't mean equals

// Internal structure (simplified):
// table = [null, null, Entry(Bob,30), null, null, null, null, 
//          Entry(Alice,25) → Entry(Celia,28), null, ...]
//                            ↑ linked list (or tree if > 8)

// Performance:
// Average case: O(1) for get/put
// Worst case (all same bucket): O(n) or O(log n) with Java 8 tree
// Resizing: O(n) — rehashes everything. Avoid by setting initial capacity.
Map<String, Integer> map = new HashMap<>(100); // avoids resizing
```

---

## 7. `final` Keyword: Three Different Meanings

### The Freeze Question
> "What does `final` do?"

```
╔══════════════════════════════════════════════════════════════════╗
║  final VARIABLE → constant reference (but object can change!)    ║
║    final List<String> list = new ArrayList<>();                  ║
║    list.add("hello");        // ✅ Modifying contents is fine     ║
║    list = new ArrayList<>(); // ❌ Can't reassign the variable    ║
║    ↑ Like a permanent parking spot — the car in it can change    ║
║      its color, but you can't move to a different spot.          ║
║                                                                  ║
║  final METHOD → can't be overridden by subclasses                ║
║    public final void doWork() { ... }                            ║
║    ↑ "This recipe is final. No one can modify it."               ║
║                                                                  ║
║  final CLASS → can't be extended                                 ║
║    public final class String { ... }                             ║
║    ↑ "No one can build on top of this." (String, Integer, etc.)  ║
║    WHY: Immutability guarantee. If you could extend String,      ║
║    you could create a MutableString that breaks contracts.       ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 8. Checked vs Unchecked Exceptions: The Design Philosophy

### The Freeze Question
> "What's the difference? Why does Java have both?"

```
╔══════════════════════════════════════════════════════════════════╗
║  CHECKED (compile-time) = "Expected problems you SHOULD handle"  ║
║    IOException, SQLException, FileNotFoundException              ║
║    → Compiler FORCES try-catch or throws declaration             ║
║    → "The file might not exist. What's your Plan B?"             ║
║    → Like weather: you KNOW it might rain. Bring an umbrella.    ║
║                                                                  ║
║  UNCHECKED (runtime) = "Programming bugs that shouldn't happen"  ║
║    NullPointerException, ArrayIndexOutOfBoundsException          ║
║    → Compiler does NOT force handling                            ║
║    → "Your code has a bug. Fix it, don't catch it."              ║
║    → Like tripping: fix the hazard, don't just put a cushion.    ║
║                                                                  ║
║  THE HIERARCHY:                                                  ║
║     Throwable                                                    ║
║     ├── Error (unchecked — JVM problems: OutOfMemoryError)       ║
║     └── Exception                                                ║
║         ├── RuntimeException (unchecked — bugs)                  ║
║         └── Everything else (checked — expected failures)        ║
║                                                                  ║
║  CONTROVERSY: Many modern developers (and languages like Kotlin) ║
║  argue checked exceptions are too verbose. Spring uses unchecked ║
║  exceptions extensively. The debate continues.                   ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 9. Autoboxing Traps: Where Performance Silently Degrades

### The Freeze Question
> "What's autoboxing and when is it a problem?"

```java
// Autoboxing: primitive → wrapper automatically
int x = 5;
Integer y = x; // auto-boxes x into new Integer(5)

// Unboxing: wrapper → primitive automatically
Integer a = 10;
int b = a; // auto-unboxes a into primitive 10

// THE TRAP: Performance in loops
Long sum = 0L; // 😱 wrapper type, not primitive!
for (long i = 0; i < Integer.MAX_VALUE; i++) {
    sum += i; // Creates a NEW Long object EVERY iteration
}
// ~2 BILLION unnecessary Long objects created!
// Fix: use `long sum = 0L;` (primitive)
// Performance difference: 6x slower with autoboxing

// THE TRAP: NullPointerException
Integer value = null;
int result = value; // 💥 NullPointerException on unboxing!
// "How can an int be null?" — It can't. The unboxing crashes.

// THE TRAP: Unexpected identity comparisons
Integer a = 200, b = 200;
System.out.println(a == b); // false! (see Section 4 — cache only -128 to 127)
```

---

## 10. ConcurrentModificationException: Why Iterating + Modifying Fails

### The Freeze Question
> "Why does this throw ConcurrentModificationException?"

```java
List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C"));
for (String s : list) {
    if (s.equals("B")) {
        list.remove(s); // 💥 ConcurrentModificationException!
    }
}
```

```
╔══════════════════════════════════════════════════════════════════╗
║  THE COUNTING CARDS ANALOGY                                      ║
║                                                                  ║
║  Iterator says: "I'm counting cards in a deck. Card 1... 2..."   ║
║  You: *removes a card from the middle*                           ║
║  Iterator: "Wait — the deck changed! My count is wrong now!"     ║
║  → Throws ConcurrentModificationException                        ║
║                                                                  ║
║  FAIL-FAST: Java collections track a modCount. The iterator      ║
║  checks modCount each step. If it changed (someone modified      ║
║  the collection), it immediately fails rather than give          ║
║  corrupt results.                                                ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// SOLUTIONS:
// 1. Use Iterator.remove() — the iterator knows about this removal
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("B")) {
        it.remove(); // ✅ Safe — iterator updates its internal state
    }
}

// 2. Use removeIf (Java 8+) — cleanest
list.removeIf(s -> s.equals("B")); // ✅ 

// 3. Use CopyOnWriteArrayList — for concurrent access
CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>(...);
// Iterates over a SNAPSHOT. Writes create a new internal array.
// Good for read-heavy, write-rare scenarios.

// 4. Collect and remove separately
List<String> toRemove = new ArrayList<>();
for (String s : list) {
    if (s.equals("B")) toRemove.add(s);
}
list.removeAll(toRemove);
```

---

## 11. `synchronized`, `volatile`, `Atomic`: Three Levels of Thread Safety

### The Freeze Question
> "What's the difference between synchronized, volatile, and Atomic?"

```
╔══════════════════════════════════════════════════════════════════╗
║  volatile = A shared whiteboard (visibility only)                ║
║  → Ensures ALL threads see the LATEST value                      ║
║  → Does NOT prevent race conditions with compound actions        ║
║  → Use for: flags (boolean isRunning), simple reads/writes       ║
║                                                                  ║
║  synchronized = A room with ONE key (mutual exclusion)           ║
║  → Only ONE thread can enter at a time                           ║
║  → Provides both visibility AND atomicity                        ║
║  → Use for: compound operations (check-then-act, read-modify-    ║
║    write). Heavier — threads must wait.                          ║
║                                                                  ║
║  Atomic (AtomicInteger, etc.) = Lock-free operations via CAS     ║
║  → Uses CPU-level Compare-And-Swap instruction                   ║
║  → Atomic read-modify-write without locking                      ║
║  → Use for: counters, accumulators. Better performance than      ║
║    synchronized for simple operations.                           ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// volatile: visibility but NOT atomic
volatile boolean running = true;         // ✅ Thread sees update
volatile int counter = 0;
counter++;  // ❌ NOT atomic! (read → increment → write = 3 steps)

// synchronized: mutual exclusion
synchronized void increment() {
    counter++;  // ✅ Only one thread at a time
}

// Atomic: lock-free atomic operations
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet(); // ✅ Atomic, no lock needed
```

---

## 12. Abstract Class vs Interface: The Post-Java-8 Reality

### The Freeze Question
> "When do you use abstract class vs interface?"

```
╔══════════════════════════════════════════════════════════════════╗
║  PRE-JAVA 8: Clear distinction                                   ║
║  Abstract class = partial implementation + state                 ║
║  Interface = pure contract (all abstract)                        ║
║                                                                  ║
║  POST-JAVA 8: Lines blurred (interfaces got default methods)     ║
║                                                                  ║
║  REMAINING DIFFERENCES:                                          ║
║  Abstract class:                                                 ║
║  → CAN have instance fields (state)                              ║
║  → CAN have constructors                                         ║
║  → Single inheritance only (extends ONE)                         ║
║  → CAN have non-public methods                                   ║
║  → IS-A relationship ("Dog IS-A Animal")                         ║
║                                                                  ║
║  Interface:                                                      ║
║  → NO instance state (only static final constants)               ║
║  → NO constructors                                               ║
║  → Multiple inheritance (implements MANY)                        ║
║  → All methods are public                                        ║
║  → CAN-DO relationship ("Dog CAN-DO Serializable")               ║
║                                                                  ║
║  RULE: Use interface FIRST. Only use abstract class when you     ║
║  need shared STATE or constructors.                              ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 13. Garbage Collection: What Actually Happens

### The Freeze Question
> "How does garbage collection work?"

```
╔══════════════════════════════════════════════════════════════════╗
║  THE OFFICE CLEANING SERVICE ANALOGY                             ║
║                                                                  ║
║  HEAP = An office building                                       ║
║  Objects = Desks                                                 ║
║  References = Name plates on desks                               ║
║  GC = Cleaning service                                           ║
║                                                                  ║
║  GC asks: "Which desks still have name plates? Keep those.       ║
║  Any desk with NO name plate? Clean it up."                      ║
║                                                                  ║
║  GENERATIONAL HYPOTHESIS:                                        ║
║  "Most objects die young."                                       ║
║  → Young Generation (Eden + Survivor spaces)                     ║
║    New objects go here. Minor GC collects frequently.            ║
║  → Old Generation (Tenured)                                      ║
║    Objects that survived many Minor GCs. Major GC less frequent. ║
║                                                                  ║
║  ALGORITHMS:                                                     ║
║  G1: Default since Java 9. Divides heap into regions.            ║
║  ZGC: Ultra-low pause (< 10ms). Java 15+.                        ║
║  Shenandoah: Concurrent compaction. OpenJDK.                     ║
║                                                                  ║
║  KEY: GC is NOT deterministic. System.gc() is a suggestion,      ║
║  not a command. finalize() is deprecated — use try-with-         ║
║  resources (AutoCloseable) instead.                              ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Interview Quick-Fire: Java Freeze Busters

| Freeze Question | Senior-Level Answer |
|----------------|-------------------|
| "Is Java pass by reference?" | NO. Java is ALWAYS pass by value. For objects, it passes a COPY of the reference. You can modify the object through the copy, but can't reassign the caller's variable. |
| "Why override hashCode with equals?" | HashMap uses hashCode to find the bucket, then equals to find the entry. If equal objects have different hashCodes, HashMap puts them in different buckets — you'll never find the entry. |
| "What's the diamond problem?" | Multiple inheritance conflict: class inherits same method from two parents. Java avoids it with single class inheritance. For interfaces with default methods, you must override and explicitly choose. |
| "Why is String final?" | Prevents subclasses from breaking immutability. If you could extend String, you could create a MutableString — breaking the String pool, security, and hashCode caching contracts. |
| "Stack vs Heap?" | Stack: method calls, local variables, primitives — fast, automatic, thread-local. Heap: objects — slower, GC-managed, shared across threads. Reference on stack, object on heap. |
| "What's a memory leak in Java?" | Objects that are still technically reachable (have references) but will never be used again. Common: static collections growing forever, unclosed resources, inner class references. GC can't collect them because references exist. |

---

← Previous: [Chapter 30 — Spring Boot Dependencies Map](30_Spring_Boot_Dependencies_Annotations.md)
| [📚 Index](../00_MASTER_INDEX.md)
| Next: [Spring Boot Deep Reasoning →](32_Spring_Boot_Deep_Reasoning.md)
