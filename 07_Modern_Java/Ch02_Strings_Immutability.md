# 55. Java String Internals & Immutability Patterns — Deep Dive

**Navigation**: [< JMM & GC](Ch18_JMM_GC_Deep.md) | [Back to Index](../00_MASTER_INDEX.md) | [Core Foundations >](Ch01_Core_Foundations.md)

---

## PART 1: STRING INTERNALS

---



🔬 **Section Challenge — PART 1: STRING INTERNALS**

**Challenge 1 (Reasoning):** If you need to concatenate strings in a tight loop 10,000 times, why is using `+` (`str += "a"`) catastrophic compared to `StringBuilder.append("a")`?
<details><summary>Answer</summary>

Immutability Allocation Thrashing. Strings in Java are immutable. Every time you use `+`, the JVM creates a brand new `StringBuilder`, copies the old string into it, appends the new character, and creates a brand new `String` object. Looping this 10,000 times creates 10,000 discarded StringBuilder and String objects, choking the JVM's Garbage Collector. Using a single `StringBuilder` pre-allocates an internal character array that simply expands as needed, completely avoiding garbage creation.
</details>


## 🎯 The 5W1H

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT = String is an IMMUTABLE object backed by a char[]/byte[]  ║
║         Once created, its content NEVER changes                  ║
║                                                                  ║
║  WHY  = Immutability enables: String pool (memory saving),       ║
║         thread safety (no synchronization needed),               ║
║         hashCode caching, security (class names, URLs)           ║
║                                                                  ║
║  KEY  = Every "modification" creates a NEW String object         ║
║         "hello".toUpperCase() → NEW String "HELLO"               ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 1. String Pool — How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         JVM HEAP                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────┐                │
│  │              STRING POOL                      │                │
│  │         (inside the heap since Java 7)        │                │
│  │                                               │                │
│  │    "hello" ─── shared by all references       │                │
│  │    "world" ─── only one copy exists           │                │
│  │    "java"  ─── reused, not duplicated         │                │
│  │                                               │                │
│  └─────────────────────────────────────────────┘                │
│                                                                   │
│     new String("hello") ─── separate object, NOT in pool        │
│     new String("hello") ─── ANOTHER separate object             │
└─────────────────────────────────────────────────────────────────┘
```

```java
// String literals go to the pool — same content = same reference
String s1 = "hello";
String s2 = "hello";
System.out.println(s1 == s2);       // true — SAME object in pool!
System.out.println(s1.equals(s2));  // true — same content

// 'new' creates a NEW object on heap — NOT in pool
String s3 = new String("hello");
System.out.println(s1 == s3);       // false — different objects!
System.out.println(s1.equals(s3));  // true — same content

// intern() — put a String INTO the pool (or get existing)
String s4 = s3.intern();
System.out.println(s1 == s4);       // true — s4 is the pooled version

// Compile-time concatenation goes to pool
String s5 = "hel" + "lo";
System.out.println(s1 == s5);       // true — compiler optimizes to "hello"

// Runtime concatenation creates NEW object
String part = "lo";
String s6 = "hel" + part;
System.out.println(s1 == s6);       // false — runtime concat, new object
```

---



🔬 **Section Challenge — 1. String Pool — How It Works**

**Challenge 1 (Reasoning):** `String a = "hello"; String b = "hello"; a == b` — true or false? What about `new String("hello") == "hello"`?
<details><summary>Answer</summary>

First: `true` — string literals are interned in the string pool; same literal = same reference. Second: `false` — `new String(...)` always creates a new object on the heap, bypassing the pool. Always use `.equals()` for string comparison. `String.intern()` can explicitly add a string to the pool.
</details>

**Challenge 2 (Design):** Why is `String` immutable in Java and what problems would mutable strings cause?
<details><summary>Answer</summary>

Security: strings are used as HashMap keys, class names, file paths. If mutable, a key could change after insertion, corrupting the HashMap. Thread safety: immutable objects are inherently thread-safe (no synchronization needed). String pool: only possible because strings don't change — two vars safely share the same interned object. Caching hashCode: `String` caches its hashCode (first call computes, subsequent calls return cached) — only safe because the string never changes.
</details>


## 2. String Immutability — Why and How

```java
// String is declared as:
public final class String {           // final — can't be subclassed
    private final byte[] value;       // final — reference can't change
    private final byte coder;         // final — encoding flag
    private int hash;                 // cached hashCode (computed once)
}

// Immutability means:
String s = "hello";
s.toUpperCase();     // Returns "HELLO" — s is still "hello"!
s = s.toUpperCase(); // NOW s points to the NEW "HELLO" string

// WHY immutability matters:
// 1. THREAD SAFETY — no synchronization needed, any thread can read
// 2. HASHCODE CACHING — computed once, reused in HashMaps (fast!)
// 3. STRING POOL — only works because strings can't be modified
// 4. SECURITY — class names, URLs, SQL queries can't be tampered with
```

---



🔬 **Section Challenge — 2. String Immutability — Why and How**

**Challenge 1 (Reasoning):** If you need to concatenate strings in a tight loop 10,000 times, why is using `+` (`str += "a"`) catastrophic compared to `StringBuilder.append("a")`?
<details><summary>Answer</summary>

Immutability Allocation Thrashing. Strings in Java are immutable. Every time you use `+`, the JVM creates a brand new `StringBuilder`, copies the old string into it, appends the new character, and creates a brand new `String` object. Looping this 10,000 times creates 10,000 discarded StringBuilder and String objects, choking the JVM's Garbage Collector. Using a single `StringBuilder` pre-allocates an internal character array that simply expands as needed, completely avoiding garbage creation.
</details>


## 3. String Concatenation — The Performance Trap

```java
// ❌ THE CLASSIC MISTAKE — O(n²) in a loop!
String result = "";
for (int i = 0; i < 10000; i++) {
    result += i + ",";  // Creates a NEW String object every iteration!
    // Iteration 1: "" + "0," → new String("0,")
    // Iteration 2: "0," + "1," → new String("0,1,")
    // Each creates a new String and COPIES all previous characters!
}
// 10,000 iterations = ~50 million characters copied total → SLOW

// ✅ USE StringBuilder — O(n)
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append(i).append(",");  // Appends to internal buffer, no copying
}
String result = sb.toString();  // One final String creation

// ✅ Modern alternative — String.join() or Collectors
String result = IntStream.range(0, 10000)
    .mapToObj(Integer::toString)
    .collect(Collectors.joining(","));
```

### What the Compiler Does (Java 9+)

```java
// Java 9+ uses invokedynamic for concatenation:
String s = "Name: " + name + " Age: " + age;

// Compiler generates: StringConcatFactory.makeConcatWithConstants(...)
// This is FASTER than StringBuilder for simple cases
// It pre-calculates the total size and copies everything in one pass

// RULE:
// Simple concat (few variables): Just use + (compiler optimizes)
// Loop concat (many iterations): Use StringBuilder explicitly
// Joining collection: Use String.join() or Collectors.joining()
```

---



🔬 **Section Challenge — 3. String Concatenation — The Performance Trap**

**Challenge 1 (Reasoning):** If you need to concatenate strings in a tight loop 10,000 times, why is using `+` (`str += "a"`) catastrophic compared to `StringBuilder.append("a")`?
<details><summary>Answer</summary>

Immutability Allocation Thrashing. Strings in Java are immutable. Every time you use `+`, the JVM creates a brand new `StringBuilder`, copies the old string into it, appends the new character, and creates a brand new `String` object. Looping this 10,000 times creates 10,000 discarded StringBuilder and String objects, choking the JVM's Garbage Collector. Using a single `StringBuilder` pre-allocates an internal character array that simply expands as needed, completely avoiding garbage creation.
</details>


## 4. StringBuilder vs StringBuffer

```
┌──────────────────┬──────────────────────┬──────────────────────┐
│                  │ StringBuilder          │ StringBuffer           │
├──────────────────┼──────────────────────┼──────────────────────┤
│ Thread-safe?     │ ❌ NO                 │ ✅ YES (synchronized) │
│ Speed            │ Faster (no locking)   │ Slower (locking)      │
│ When to use      │ 99% of the time       │ Multi-threaded append │
│ Java version     │ Java 5+               │ Java 1.0+             │
├──────────────────┼──────────────────────┼──────────────────────┤
│ RULE             │ Always use            │ Almost never needed   │
│                  │ StringBuilder         │                       │
└──────────────────┴──────────────────────┴──────────────────────┘
```

```java
// StringBuilder internals
StringBuilder sb = new StringBuilder();   // Default capacity: 16
sb.append("hello");  // Fits in buffer

// When buffer overflows:
// newCapacity = (oldCapacity * 2) + 2
// Initial: 16 → 34 → 70 → 142 → ...
// Arrays.copyOf() to resize (copies all data)

// Pre-size for known length to avoid resizing:
StringBuilder sb = new StringBuilder(1000);  // Start with capacity 1000
```

---



🔬 **Section Challenge — 4. StringBuilder vs StringBuffer**

**Challenge 1 (Reasoning):** Why is `String str = ""; for(int i=0;i<1000;i++) str += i;` O(N²) and how does StringBuilder fix it?
<details><summary>Answer</summary>

Each `+=` creates a NEW String object: copies all existing chars + appends new char. Iteration 1: copy 1 char. Iteration 2: copy 2 chars. ... Iteration N: copy N chars. Total: 1+2+...+N = N(N+1)/2 = O(N²) character copies. StringBuilder uses a resizable internal array. `append()` adds to the end: O(1) amortized. Final `toString()`: O(N) once. Total: O(N).
</details>


## 5. Compact Strings (Java 9+)

```java
// Before Java 9: String always used char[] (2 bytes per character)
// "hello" = 5 chars × 2 bytes = 10 bytes

// Java 9+: String uses byte[] with a coder flag
// Latin-1 (ASCII) characters → 1 byte each (LATIN1 encoding)
// Non-Latin characters → 2 bytes each (UTF16 encoding)

// "hello" (all ASCII) → 5 bytes (saved 50%!)
// "héllo" (has é) → 10 bytes (UTF-16, same as before)

// This is AUTOMATIC — no code changes needed
// Most English/code strings use ~50% less memory
```

---



🔬 **Section Challenge — 5. Compact Strings (Java 9+)**

**Challenge 1 (Reasoning):** If you need to concatenate strings in a tight loop 10,000 times, why is using `+` (`str += "a"`) catastrophic compared to `StringBuilder.append("a")`?
<details><summary>Answer</summary>

Immutability Allocation Thrashing. Strings in Java are immutable. Every time you use `+`, the JVM creates a brand new `StringBuilder`, copies the old string into it, appends the new character, and creates a brand new `String` object. Looping this 10,000 times creates 10,000 discarded StringBuilder and String objects, choking the JVM's Garbage Collector. Using a single `StringBuilder` pre-allocates an internal character array that simply expands as needed, completely avoiding garbage creation.
</details>


## 6. Text Blocks (Java 15+)

```java
// Old way — escape hell:
String json = "{\n" +
    "  \"name\": \"Harsha\",\n" +
    "  \"age\": 25\n" +
    "}";

// Text block — clean and readable:
String json = """
        {
          "name": "Harsha",
          "age": 25
        }
        """;

// Indentation is automatically stripped based on the closing """
// Common content indent is removed

// Useful escapes in text blocks:
String s = """
        Line 1 \
        continues here""";  // \ at end → no newline (one line)

String s = """
        Value: \s
        """;  // \s → trailing space preserved
```

---

## 7. Common String Methods — Cheat Sheet

```java
// Creation
String.valueOf(42);              // "42" — from any type
String.format("Name: %s", name); // Formatted string
"hello".repeat(3);               // "hellohellohello" (Java 11)

// Checking
"hello".isEmpty();               // false
"".isEmpty();                    // true
"  ".isBlank();                  // true (Java 11 — whitespace-only)
"hello".contains("ell");         // true
"hello".startsWith("hel");       // true
"hello".endsWith("lo");          // true
"hello".matches("[a-z]+");       // true (regex)

// Transforming
"Hello".toLowerCase();           // "hello"
"hello".toUpperCase();           // "HELLO"
"  hello  ".trim();              // "hello" (removes <= space)
"  hello  ".strip();             // "hello" (Java 11 — Unicode-aware)
"  hello  ".stripLeading();      // "hello  "
"  hello  ".stripTrailing();     // "  hello"

// Searching
"hello".indexOf('l');            // 2 (first occurrence)
"hello".lastIndexOf('l');        // 3 (last occurrence)
"hello".charAt(0);               // 'h'

// Extracting
"hello".substring(1, 3);         // "el" (begin inclusive, end exclusive)
"a,b,c".split(",");              // ["a", "b", "c"]
"hello".toCharArray();           // ['h','e','l','l','o']

// Comparing
"hello".equals("Hello");         // false (case-sensitive)
"hello".equalsIgnoreCase("Hello"); // true
"a".compareTo("b");              // negative (a < b)
```

---



🔬 **Section Challenge — 7. Common String Methods — Cheat Sheet**

**Challenge 1 (Reasoning):** If you need to concatenate strings in a tight loop 10,000 times, why is using `+` (`str += "a"`) catastrophic compared to `StringBuilder.append("a")`?
<details><summary>Answer</summary>

Immutability Allocation Thrashing. Strings in Java are immutable. Every time you use `+`, the JVM creates a brand new `StringBuilder`, copies the old string into it, appends the new character, and creates a brand new `String` object. Looping this 10,000 times creates 10,000 discarded StringBuilder and String objects, choking the JVM's Garbage Collector. Using a single `StringBuilder` pre-allocates an internal character array that simply expands as needed, completely avoiding garbage creation.
</details>


## PART 2: IMMUTABILITY PATTERNS

---



## 8. What Makes a Class Immutable?

```
╔══════════════════════════════════════════════════════════════════╗
║ RULES FOR IMMUTABILITY:                                          ║
║                                                                  ║
║ 1. Declare the class as final (prevent subclassing)              ║
║ 2. Make all fields private and final                             ║
║ 3. Don't provide setters                                         ║
║ 4. Defensive copy mutable objects in constructor AND getters     ║
║ 5. Don't expose internal mutable state                           ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// ✅ CORRECT immutable class
public final class Money {
    private final BigDecimal amount;
    private final Currency currency;
    
    public Money(BigDecimal amount, Currency currency) {
        this.amount = amount;    // BigDecimal is already immutable ✅
        this.currency = currency; // Currency is already immutable ✅
    }
    
    public BigDecimal getAmount() { return amount; }
    public Currency getCurrency() { return currency; }
    
    // "Modification" returns a NEW object
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Different currencies");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
}
```

---

## 9. Defensive Copies — The Critical Detail

```java
// ❌ BROKEN immutability — mutable field exposed
public final class Event {
    private final String name;
    private final Date startDate;  // Date is MUTABLE!
    
    public Event(String name, Date startDate) {
        this.name = name;
        this.startDate = startDate;  // ❌ Stores the SAME reference!
    }
    
    public Date getStartDate() {
        return startDate;  // ❌ Caller can modify the Date!
    }
}

// The attack:
Date date = new Date();
Event event = new Event("Meeting", date);
date.setYear(2099);  // Modifies the DATE INSIDE the "immutable" object!
event.getStartDate().setYear(1970);  // Also modifies internal state!

// ✅ FIXED with defensive copies
public final class Event {
    private final String name;
    private final Date startDate;
    
    public Event(String name, Date startDate) {
        this.name = name;
        this.startDate = new Date(startDate.getTime());  // ✅ Copy in constructor
    }
    
    public Date getStartDate() {
        return new Date(startDate.getTime());  // ✅ Copy in getter
    }
}

// ✅ BETTER: Use immutable types (java.time) instead of Date
public final class Event {
    private final String name;
    private final LocalDateTime startTime;  // Already immutable!
    
    public Event(String name, LocalDateTime startTime) {
        this.name = name;
        this.startTime = startTime;  // No copy needed — immutable
    }
    
    public LocalDateTime getStartTime() {
        return startTime;  // Safe to return directly — immutable
    }
}
```

---

## 10. Defensive Copies for Collections

```java
// ❌ BROKEN — caller can modify the internal list
public final class Team {
    private final String name;
    private final List<String> members;
    
    public Team(String name, List<String> members) {
        this.name = name;
        this.members = members;  // ❌ Same reference!
    }
    
    public List<String> getMembers() {
        return members;  // ❌ Caller can add/remove!
    }
}

// ✅ FIXED
public final class Team {
    private final String name;
    private final List<String> members;
    
    public Team(String name, List<String> members) {
        this.name = name;
        this.members = List.copyOf(members);  // ✅ Immutable copy
    }
    
    public List<String> getMembers() {
        return members;  // ✅ Already immutable — safe to return
    }
}

// Unmodifiable wrappers vs copies:
List.of("a", "b");              // Truly immutable — no backing list
List.copyOf(original);          // Truly immutable copy
Collections.unmodifiableList(original);  // ⚠️ VIEW — changes to original reflect!

// Proof:
List<String> original = new ArrayList<>(List.of("a", "b"));
List<String> view = Collections.unmodifiableList(original);
original.add("c");
System.out.println(view);  // [a, b, c] — the view CHANGED!

List<String> copy = List.copyOf(original);
original.add("d");
System.out.println(copy);  // [a, b, c] — the copy is INDEPENDENT
```

---

## 11. Records as Immutable Value Objects

```java
// Records (Java 16+) give you immutability with minimal boilerplate
public record Money(BigDecimal amount, Currency currency) {
    // Constructor, getters, equals, hashCode, toString — all generated!
    
    // Compact constructor for validation
    public Money {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative");
        }
    }
    
    // Behavior methods
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
}

// ⚠️ Records do NOT make defensive copies automatically!
public record Event(String name, List<String> attendees) {}

// The list is still MUTABLE inside the record:
List<String> people = new ArrayList<>(List.of("Alice"));
Event event = new Event("Meeting", people);
people.add("Bob");
System.out.println(event.attendees());  // [Alice, Bob] — MUTATED!

// Fix: defensive copy in compact constructor
public record Event(String name, List<String> attendees) {
    public Event {
        attendees = List.copyOf(attendees);  // ✅ Immutable copy
    }
}
```

---

## 12. Builder Pattern for Complex Immutable Objects

```java
// When an immutable class has many fields → use Builder
public final class HttpRequest {
    private final String method;
    private final String url;
    private final Map<String, String> headers;
    private final String body;
    private final int timeout;
    
    private HttpRequest(Builder builder) {
        this.method = builder.method;
        this.url = builder.url;
        this.headers = Map.copyOf(builder.headers);
        this.body = builder.body;
        this.timeout = builder.timeout;
    }
    
    // Only getters — no setters
    public String getMethod() { return method; }
    public String getUrl() { return url; }
    public Map<String, String> getHeaders() { return headers; }
    public String getBody() { return body; }
    public int getTimeout() { return timeout; }
    
    public static class Builder {
        private String method = "GET";
        private String url;
        private Map<String, String> headers = new HashMap<>();
        private String body;
        private int timeout = 30_000;
        
        public Builder url(String url) { this.url = url; return this; }
        public Builder method(String method) { this.method = method; return this; }
        public Builder header(String key, String value) {
            this.headers.put(key, value); return this;
        }
        public Builder body(String body) { this.body = body; return this; }
        public Builder timeout(int ms) { this.timeout = ms; return this; }
        
        public HttpRequest build() {
            Objects.requireNonNull(url, "URL is required");
            return new HttpRequest(this);
        }
    }
}

// Usage:
HttpRequest request = new HttpRequest.Builder()
    .url("https://api.example.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .body("{\"name\": \"Harsha\"}")
    .timeout(5000)
    .build();
```

---



## 13. Interview Questions & Answers

**Q: Why is String immutable in Java?**
Thread safety (shared without synchronization), String pool (multiple references share one object), hashCode caching (computed once for HashMap performance), and security (class names, URLs, connection strings can't be tampered). String is `final` to prevent subclass-based mutability attacks.

**Q: What's the difference between String pool, `new String()`, and `intern()`?**
Literals (`"hello"`) go to the pool — same content = same reference. `new String("hello")` creates a separate heap object. `intern()` adds a string to the pool (or returns existing), so `new String("hello").intern() == "hello"` is true.

**Q: Why is `+=` in a loop slow for Strings?**
Each `+=` creates a new String and copies all previous characters. In a loop of N iterations with growing string, total characters copied is ~N²/2. Use StringBuilder (O(N) amortized, internal resizable buffer, no copying on each append).

**Q: How do you make a class truly immutable?**
(1) `final` class, (2) `private final` fields, (3) no setters, (4) defensive copy mutable objects in constructor AND getters, (5) don't return mutable internal state. For collections, use `List.copyOf()` not `Collections.unmodifiableList()` (which is still a view of the original).

**Q: Records vs manual immutable class?**
Records auto-generate constructor, accessors, equals, hashCode, toString — great for simple value objects. But records DON'T do defensive copies, can't extend other classes, and fields are always public (via accessors). Use manual immutable class when you need private/protected fields, inheritance, or lazy computation.

**Q: `Collections.unmodifiableList()` vs `List.copyOf()` — what's the difference?**
`unmodifiableList()` is a READ-ONLY VIEW backed by the original — changes to original appear in the view. `List.copyOf()` creates an independent immutable copy — changes to original don't affect it. For true immutability, always use `List.copyOf()`.

---

**Key Takeaway**: String immutability enables the pool, thread safety, and 
hashCode caching. Use StringBuilder in loops, not `+=`. For your own immutable 
classes: `final` class, `final` fields, defensive copies, no setters. 
Records are shorthand but need defensive copies for mutable fields.

**Navigation**: [< JMM & GC](Ch18_JMM_GC_Deep.md) | [Back to Index](../00_MASTER_INDEX.md) | [Core Foundations >](Ch01_Core_Foundations.md)
