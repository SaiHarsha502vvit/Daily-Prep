# 50. Java Date/Time API & Regex Mastery — The Complete Deep Dive

**Navigation**: [< Enums, Records & Sealed](Ch03_Enums_Records_Sealed.md) | [Back to Index](../00_MASTER_INDEX.md) | [Generics & Exceptions >](Ch04_Generics_Exceptions.md)

---

## PART 1: DATE/TIME API (java.time)

---

## 🎯 The 5W1H: Why java.time?

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT = java.time package (Java 8+) — immutable, thread-safe     ║
║         date/time classes that replace broken java.util.Date     ║
║                                                                  ║
║  WHY  = java.util.Date was MUTABLE (thread-unsafe),              ║
║         months were 0-indexed (Jan=0), and design was terrible   ║
║                                                                  ║
║  WHEN = ALWAYS use java.time for new code. Never java.util.Date  ║
║                                                                  ║
║  HOW  = LocalDate, LocalTime, LocalDateTime, ZonedDateTime,      ║
║         Instant, Duration, Period, DateTimeFormatter             ║
╚══════════════════════════════════════════════════════════════════╝
```

### The Old Way Was Broken

```java
// ❌ java.util.Date problems:
Date date = new Date(2026, 3, 8);  // Actually April 3926! (year+1900, month 0-indexed)
date.setTime(0);  // MUTABLE! Thread-unsafe!

// ✅ java.time way:
LocalDate date = LocalDate.of(2026, 3, 8);  // March 8, 2026. Obvious.
// date is IMMUTABLE — no set methods exist
```

---

## 1. The Core Classes — Choose the Right One

```
┌──────────────────────────────────────────────────────────────===┐
│ CLASS              │ STORES                │ USE WHEN           │
│────────────────────│────────────────────── │───────────────────=│
│ LocalDate          │ 2026-03-08            │ Birthdays, dates   │
│ LocalTime          │ 14:30:00              │ Alarm, schedule    │
│ LocalDateTime      │ 2026-03-08T14:30:00   │ Booking timestamp  │
│ ZonedDateTime      │ + timezone            │ Global scheduling  │
│ Instant            │ Epoch seconds         │ Machine timestamps │
│ OffsetDateTime     │ + UTC offset          │ API communication  │
│ Duration           │ Hours/minutes/seconds │ Time between       │
│ Period             │ Years/months/days     │ Date between       │
└──────────────────────────────────────────────────────────────===┘

Decision:
  Need zone? → ZonedDateTime
  Just date? → LocalDate
  Just time? → LocalTime
  Date + time, no zone? → LocalDateTime
  Machine timestamp? → Instant
  Measure elapsed time? → Duration
  Measure calendar gap? → Period
```

---

## 2. LocalDate — Dates Without Time

```java
// Creating
LocalDate today = LocalDate.now();                    // 2026-03-08
LocalDate birthday = LocalDate.of(2000, 5, 15);      // 2000-05-15
LocalDate parsed = LocalDate.parse("2026-03-08");     // ISO format

// Querying
today.getYear();         // 2026
today.getMonth();        // MARCH (enum, not number!)
today.getMonthValue();   // 3
today.getDayOfMonth();   // 8
today.getDayOfWeek();    // SATURDAY (enum)
today.getDayOfYear();    // 67
today.isLeapYear();      // false

// Manipulating (returns NEW object — immutable!)
LocalDate tomorrow = today.plusDays(1);
LocalDate nextMonth = today.plusMonths(1);
LocalDate lastYear = today.minusYears(1);
LocalDate firstOfMonth = today.withDayOfMonth(1);

// Comparing
today.isBefore(tomorrow);  // true
today.isAfter(lastYear);   // true
today.isEqual(today);      // true
```

---

## 3. LocalTime, LocalDateTime, Instant

```java
// LocalTime — time without date
LocalTime now = LocalTime.now();             // 14:30:45.123456789
LocalTime noon = LocalTime.of(12, 0);       // 12:00
LocalTime parsed = LocalTime.parse("09:30"); // 09:30

now.getHour();     // 14
now.getMinute();   // 30
now.plusHours(2);   // 16:30:45

// LocalDateTime — date + time, NO timezone
LocalDateTime dateTime = LocalDateTime.now();
LocalDateTime specific = LocalDateTime.of(2026, 3, 8, 14, 30);
LocalDateTime combined = LocalDate.now().atTime(LocalTime.NOON);

// Instant — machine timestamp (epoch seconds)
Instant now = Instant.now();                    // 2026-03-08T09:00:00Z
Instant epoch = Instant.EPOCH;                  // 1970-01-01T00:00:00Z
long epochSeconds = now.getEpochSecond();       // seconds since epoch
long epochMillis = now.toEpochMilli();          // milliseconds since epoch

// Converting Instant ↔ LocalDateTime
LocalDateTime ldt = LocalDateTime.ofInstant(now, ZoneId.systemDefault());
Instant back = ldt.atZone(ZoneId.systemDefault()).toInstant();
```

---

🔬 **Section Challenge — 3. LocalTime, LocalDateTime, Instant**

**Challenge 1 (Reasoning):** Why did Java 8 completely replace the old `java.util.Date` class with `java.time.LocalDateTime` and `ZonedDateTime`?

<details><summary>Answer</summary>

Immutability and Thread Safety. `java.util.Date` is completely mutable. If you passed a `Date` object to another thread, that thread could alter the time using `.setTime()`, instantly corrupting the data across the entire application (Race Condition). The new `java.time` classes (like `String`) are strictly immutable. Any modification (like `.plusDays(1)`) returns a brand new object, guaranteeing perfect thread safety in concurrent environments.

</details>

## 4. ZonedDateTime — The Real-World Necessity

```java
// Timezones matter for global applications!
ZonedDateTime indiaTime = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));
ZonedDateTime nyTime = ZonedDateTime.now(ZoneId.of("America/New_York"));
ZonedDateTime utcTime = ZonedDateTime.now(ZoneOffset.UTC);

// Same instant, different display:
// indiaTime: 2026-03-08T19:30+05:30[Asia/Kolkata]
// nyTime:    2026-03-08T09:00-05:00[America/New_York]
// utcTime:   2026-03-08T14:00Z

// Converting between zones
ZonedDateTime meetingInIndia = ZonedDateTime.of(
    LocalDateTime.of(2026, 3, 10, 10, 0),
    ZoneId.of("Asia/Kolkata")
);

ZonedDateTime meetingInNY = meetingInIndia.withZoneSameInstant(
    ZoneId.of("America/New_York")
);
// 10:00 IST = 23:30 EST (previous day!)

// List all available zones
Set<String> zones = ZoneId.getAvailableZoneIds();  // 600+ zones
```

```
⚠️ Daylight Saving Time (DST) Trap:
┌─────────────────────────────────────────────────────────┐
│ In the US, clocks "spring forward" in March:             │
│ 1:59 AM → 3:00 AM (2:00 AM doesn't exist!)              │
│                                                          │
│ ZonedDateTime handles this automatically:                │
│ ZonedDateTime.of(2026, 3, 8, 2, 30,                     │
│     ZoneId.of("America/New_York"))                       │
│ → Automatically adjusts to 3:30 AM                       │
│                                                          │
│ LocalDateTime does NOT handle this (no timezone info)    │
│                                                          │
│ RULE: Store as Instant (UTC). Display as ZonedDateTime.  │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Duration and Period — Measuring Time Gaps

```java
// Duration — time-based (hours, minutes, seconds, nanos)
Duration fiveMinutes = Duration.ofMinutes(5);
Duration threeHours = Duration.ofHours(3);
Duration between = Duration.between(startTime, endTime);

long totalSeconds = between.getSeconds();
long totalMinutes = between.toMinutes();

// Period — date-based (years, months, days)
Period tenDays = Period.ofDays(10);
Period threeMonths = Period.ofMonths(3);
Period gap = Period.between(birthday, today);

System.out.printf("Age: %d years, %d months, %d days%n",
    gap.getYears(), gap.getMonths(), gap.getDays());

// ChronoUnit — flexible measuring
long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);
long hoursBetween = ChronoUnit.HOURS.between(startDateTime, endDateTime);
```

---

🔬 **Section Challenge — 5. Duration and Period — Measuring Time Gaps**

**Challenge 1 (Duration vs Period DST Pitfall):** `Duration.between(march10_2am, march10_3am)` in a DST-observing timezone. Clocks jump from 2am to 3am. **Who** calculates 1 hour? **When** does `Period.between()` NOT account for DST? **What** is the `ChronoUnit` alternative?

<details><summary>Answer</summary>

**Who calculates:** `Duration.between()` works on `Instant` (wall clock time in UTC nanoseconds). If you use `ZonedDateTime` with a DST-observing zone, `Duration.between(zdt1, zdt2)` returns the ACTUAL elapsed time (which may be 0 seconds for a DST skip, or 7200 seconds for a DST fall-back hour). **When Period.between() ignores DST:** `Period` works at DATE level (years/months/days), not time level. `Period.between(localDate1, localDate2)` counts calendar days. A day with DST transition is still "1 day" in Period terms, regardless of having 23 or 25 clock hours. **`ChronoUnit` alternative:** `ChronoUnit.HOURS.between(zdt1, zdt2)` computes hour difference from actual `Instant` values. For the 2am→3am DST skip: returns 0 hours (they're the same instant). For the 2am→1am DST fall-back: returns -1 hour (time went backwards). **Production trap:** Scheduling "run every 24 hours" with `Duration.ofHours(24)` on DST days may fire 23h or 25h later in wall-clock time. Use `LocalTime` + a cron scheduler for wall-clock-accurate daily scheduling.

</details>
<details><summary>Answer</summary>

Immutability and Thread Safety. `java.util.Date` is completely mutable. If you passed a `Date` object to another thread, that thread could alter the time using `.setTime()`, instantly corrupting the data across the entire application (Race Condition). The new `java.time` classes (like `String`) are strictly immutable. Any modification (like `.plusDays(1)`) returns a brand new object, guaranteeing perfect thread safety in concurrent environments.

</details>

## 6. DateTimeFormatter — Parsing and Formatting

```java
// Built-in formatters
DateTimeFormatter iso = DateTimeFormatter.ISO_LOCAL_DATE;      // 2026-03-08
DateTimeFormatter isoFull = DateTimeFormatter.ISO_DATE_TIME;   // 2026-03-08T14:30:00

// Custom formatters
DateTimeFormatter custom = DateTimeFormatter.ofPattern("dd/MM/yyyy");
DateTimeFormatter full = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a");

// Formatting (Date → String)
String formatted = LocalDate.now().format(custom);  // "08/03/2026"
String pretty = LocalDateTime.now().format(full);   // "Sunday, March 8, 2026 at 2:30 PM"

// Parsing (String → Date)
LocalDate parsed = LocalDate.parse("08/03/2026", custom);
LocalDateTime parsedDT = LocalDateTime.parse("2026-03-08T14:30:00");

// With locale
DateTimeFormatter indian = DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH);
String indianFormat = LocalDate.now().format(indian);  // "08-Mar-2026"
```

```
Common Format Patterns:
┌────────┬──────────────────────┬──────────────────┐
│ Symbol │ Meaning              │ Example           │
│────────│──────────────────────│──────────────────│
│ yyyy   │ Year (4 digit)       │ 2026              │
│ yy     │ Year (2 digit)       │ 26                │
│ MM     │ Month (2 digit)      │ 03                │
│ MMM    │ Month (abbrev)       │ Mar               │
│ MMMM   │ Month (full)         │ March             │
│ dd     │ Day of month         │ 08                │
│ EEEE   │ Day of week (full)   │ Sunday            │
│ EEE    │ Day of week (abbrev) │ Sun               │
│ HH     │ Hour (24h)           │ 14                │
│ hh     │ Hour (12h)           │ 02                │
│ mm     │ Minutes              │ 30                │
│ ss     │ Seconds              │ 45                │
│ a      │ AM/PM                │ PM                │
│ z      │ Zone name            │ IST               │
│ Z      │ Zone offset          │ +0530             │
└────────┴──────────────────────┴──────────────────┘
```

---

🔬 **Section Challenge — 6. DateTimeFormatter — Parsing and Formatting**

**Challenge 1 (DateTimeFormatter Thread Safety):** `SimpleDateFormat` is NOT thread-safe. `DateTimeFormatter` IS thread-safe. **Who** makes `DateTimeFormatter` safe? **When** would you use `DateTimeFormatter.ofPattern()` vs `DateTimeFormatter.ISO_DATE_TIME`? **What** is the pre-defined formatter for RFC-1123 (HTTP dates)?

<details><summary>Answer</summary>

**Who makes it safe:** `DateTimeFormatter` is IMMUTABLE. It holds no mutable state (no internal calendar or fields that change per format call). `SimpleDateFormat` stored the parsed result in instance fields, making it mutable and thread-unsafe. **Why `SimpleDateFormat` failed:** Two threads calling `format()` concurrently would clobber each other's intermediate state. Thread-local `SimpleDateFormat` was the workaround (ugly). `DateTimeFormatter` needs no workaround — share it freely as a `static final` constant. **`ofPattern()` vs pre-defined:** `DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")` creates a custom formatter for a specific format string. `ISO_DATE_TIME` is the ISO 8601 standard: `"2025-01-15T10:30:00"`. Use ISO constants when interoperating with APIs/JSON. Use `ofPattern()` for display/user-facing formats. **RFC-1123 (HTTP dates):** `DateTimeFormatter.RFC_1123_DATE_TIME`. Formats to `"Tue, 3 Jun 2008 11:05:30 GMT"`. Used in HTTP `Date` header, `Last-Modified`, `Expires`. Locale-independent — always English month/day names. **Parsing gotcha:** `DateTimeFormatter.ISO_DATE_TIME` requires time component. For date-only parsing, use `ISO_DATE`. Mixing up causes `DateTimeParseException: Unable to obtain LocalTime from TemporalAccessor`.

</details>
<details><summary>Answer</summary>

Immutability and Thread Safety. `java.util.Date` is completely mutable. If you passed a `Date` object to another thread, that thread could alter the time using `.setTime()`, instantly corrupting the data across the entire application (Race Condition). The new `java.time` classes (like `String`) are strictly immutable. Any modification (like `.plusDays(1)`) returns a brand new object, guaranteeing perfect thread safety in concurrent environments.

</details>

## 7. Practical Patterns — Real-World Code

```java
// Calculate age
public int calculateAge(LocalDate birthday) {
    return Period.between(birthday, LocalDate.now()).getYears();
}

// Check if weekend
public boolean isWeekend(LocalDate date) {
    DayOfWeek day = date.getDayOfWeek();
    return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
}

// Get next business day
public LocalDate nextBusinessDay(LocalDate date) {
    LocalDate next = date.plusDays(1);
    while (isWeekend(next)) {
        next = next.plusDays(1);
    }
    return next;
}

// Get all Mondays in a month
public List<LocalDate> getMondaysInMonth(YearMonth month) {
    return month.atDay(1)
        .datesUntil(month.atEndOfMonth().plusDays(1))
        .filter(d -> d.getDayOfWeek() == DayOfWeek.MONDAY)
        .toList();
}

// Measure execution time
public <T> T timed(String label, Supplier<T> task) {
    Instant start = Instant.now();
    T result = task.get();
    Duration elapsed = Duration.between(start, Instant.now());
    System.out.printf("[%s] took %dms%n", label, elapsed.toMillis());
    return result;
}

// Store in database: use Instant (UTC), display: convert to zone
Instant storedUtc = Instant.now();  // Store this in DB
ZonedDateTime userLocal = storedUtc.atZone(ZoneId.of("Asia/Kolkata"));  // Display this
```

---

## PART 2: REGEX MASTERY (java.util.regex)

---

## 🎯 The 5W1H: Why Regex?

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT = Regular Expressions — a mini-language for text patterns  ║
║                                                                  ║
║  WHY  = Validate input (email, phone), extract data from text,  ║
║         search/replace, parse log files, clean data              ║
║                                                                  ║
║  WHEN = Input validation, log parsing, data extraction,         ║
║         URL routing, template engines, text processing           ║
║                                                                  ║
║  HOW  = java.util.regex.Pattern + Matcher                       ║
║         String.matches(), replaceAll(), split()                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 8. Regex Fundamentals — The Building Blocks

```
CHARACTER CLASSES:
┌────────┬───────────────────────────────┐
│ .      │ Any character except newline  │
│ \d     │ Digit [0-9]                   │
│ \D     │ Non-digit [^0-9]             │
│ \w     │ Word char [a-zA-Z0-9_]       │
│ \W     │ Non-word char                 │
│ \s     │ Whitespace [\t\n\r\f ]       │
│ \S     │ Non-whitespace               │
│ [abc]  │ Any of a, b, or c            │
│ [a-z]  │ Any lowercase letter         │
│ [^abc] │ NOT a, b, or c              │
└────────┴───────────────────────────────┘

QUANTIFIERS:
┌────────┬───────────────────────────────┐
│ *      │ 0 or more (greedy)           │
│ +      │ 1 or more (greedy)           │
│ ?      │ 0 or 1 (optional)            │
│ {n}    │ Exactly n times              │
│ {n,}   │ n or more times              │
│ {n,m}  │ Between n and m times        │
│ *?     │ 0 or more (lazy/reluctant)   │
│ +?     │ 1 or more (lazy/reluctant)   │
└────────┴───────────────────────────────┘

ANCHORS & GROUPS:
┌────────┬───────────────────────────────┐
│ ^      │ Start of string/line         │
│ $      │ End of string/line           │
│ \b     │ Word boundary                │
│ (abc)  │ Capturing group              │
│ (?:abc)│ Non-capturing group          │
│ a|b    │ a OR b (alternation)         │
└────────┴───────────────────────────────┘
```

---

🔬 **Section Challenge — 8. Regex Fundamentals — The Building Blocks**

**Challenge 1 (Regex ReDoS — Catastrophic Backtracking):** Pattern `(a+)+b` on input `"aaaaaaaaaaaaaac"` takes exponentially long. **Who** causes the blowup? **When** does normal backtracking become exponential? **What** is the fix?

<details><summary>Answer</summary>

**Who causes the blowup:** Java's NFA-based regex engine. `(a+)+` creates nested quantifiers: outer `+` tries different counts of `a+` groups, inner `a+` tries different lengths per group. On `"aaaaaac"` (no match), the engine tries ALL possible ways to partition `aaaa` into groups of `a+`: `(aaaa)`, `(aaa)(a)`, `(aa)(aa)`, `(aa)(a)(a)`, `(a)(aaa)`, etc. This is 2^n combinations for n `a`s. **When it becomes exponential:** Nested quantifiers on overlapping patterns. `(a+)+`, `(a|a)+`, `(x+y+)+` are classic ReDoS patterns. With n=30: 2^30 = 1 billion combinations — hangs for seconds/minutes. ReDoS (Regular expression Denial of Service) is a real CVE category. **Fixes:** (1) Atomic groups (if supported): `(?>a+)+` — once the inner group matches, it cannot backtrack. Java has NO atomic groups natively (use `(?>...)` via possessive quantifiers in Java 8+). (2) Possessive quantifiers: `(a++)b` — `a++` matches greedily and never gives back characters. (3) Rewrite pattern to `a+b` (equivalent, linear). (4) Use `java.util.regex.Pattern.CASE_INSENSITIVE` + input validation to reject untrusted input. **Production rule:** Never apply user-supplied regex to user-supplied input without timeout/length limits.

</details>
<details><summary>Answer</summary>

Immutability and Thread Safety. `java.util.Date` is completely mutable. If you passed a `Date` object to another thread, that thread could alter the time using `.setTime()`, instantly corrupting the data across the entire application (Race Condition). The new `java.time` classes (like `String`) are strictly immutable. Any modification (like `.plusDays(1)`) returns a brand new object, guaranteeing perfect thread safety in concurrent environments.

</details>

## 9. Pattern and Matcher — Java's Regex Engine

```java
// Step 1: Compile pattern (EXPENSIVE — do once, reuse)
Pattern pattern = Pattern.compile("\\d{3}-\\d{3}-\\d{4}");

// Step 2: Create matcher for input
Matcher matcher = pattern.matcher("Call me at 123-456-7890 or 987-654-3210");

// Step 3: Use matcher
while (matcher.find()) {
    System.out.println("Found: " + matcher.group());
    System.out.println("  At position: " + matcher.start() + "-" + matcher.end());
}
// Found: 123-456-7890
//   At position: 14-26
// Found: 987-654-3210
//   At position: 30-42
```

### Key Matcher Methods

```
┌──────────────────────────────────────────────────────────┐
│ matcher.matches()   → Does ENTIRE string match pattern?  │
│ matcher.find()      → Find NEXT occurrence in string     │
│ matcher.group()     → Return the matched text            │
│ matcher.group(1)    → Return capturing group 1           │
│ matcher.start()     → Start index of match               │
│ matcher.end()       → End index of match                 │
│ matcher.replaceAll()→ Replace all matches                │
│ matcher.reset()     → Reset to search from beginning     │
└──────────────────────────────────────────────────────────┘

matches() vs find():
"hello123world".matches("\\d+")  → false (entire string isn't digits)
Pattern.compile("\\d+").matcher("hello123world").find() → true (found 123)
```

---

🔬 **Section Challenge — 9. Pattern and Matcher — Java's Regex Engine**

**Challenge 1 (Matcher.find() vs Matcher.matches()):** You use `Pattern.compile("\\d+").matcher("abc123").matches()`. It returns `false`. You switch to `find()`. It returns `true`. **Who** finds the match? **When** does `matches()` work correctly? **What** is the behavioral difference in terms of the full string?

<details><summary>Answer</summary>

**Who finds the match:** `find()` scans from the current position until it finds ANY match anywhere in the string (like `grep`). `"abc123"` contains `\d+` at position 3. `find()` returns `true`. **`matches()` behavior:** Matches the pattern against the ENTIRE string (like `^pattern$` anchors). `"abc123"` is NOT entirely digits — `matches()` returns `false`. Equivalent to `Pattern.compile("^\\d+$")`. **When `matches()` works correctly:** When you want to validate the full string format: email validation, UUID check, ISO date format. `Pattern.compile("\\d{4}-\\d{2}-\\d{2}").matcher(str).matches()` — checks if the ENTIRE string is a date format. **Practical rule:** `matches()` = form validation (entire string must conform). `find()` = extraction (find all occurrences). **Compile once:** Always store compiled `Pattern` as a `static final` field. `Pattern.compile()` is expensive (regex compilation). Calling it inline in a loop is a common performance bug.

</details>
<details><summary>Answer</summary>

Immutability and Thread Safety. `java.util.Date` is completely mutable. If you passed a `Date` object to another thread, that thread could alter the time using `.setTime()`, instantly corrupting the data across the entire application (Race Condition). The new `java.time` classes (like `String`) are strictly immutable. Any modification (like `.plusDays(1)`) returns a brand new object, guaranteeing perfect thread safety in concurrent environments.

</details>

## 10. Capturing Groups — Extracting Data

```java
// Parentheses create CAPTURING GROUPS
// Group 0 = entire match, Group 1 = first (), Group 2 = second ()

String logLine = "2026-03-08 14:30:45 ERROR UserService - User not found: 42";

Pattern pattern = Pattern.compile(
    "(\\d{4}-\\d{2}-\\d{2}) (\\d{2}:\\d{2}:\\d{2}) (\\w+) (\\w+) - (.+)"
);
//  Group 1: date       Group 2: time     Group 3: level  Group 4: class  Group 5: message

Matcher m = pattern.matcher(logLine);
if (m.matches()) {
    String date = m.group(1);     // "2026-03-08"
    String time = m.group(2);     // "14:30:45"
    String level = m.group(3);    // "ERROR"
    String source = m.group(4);   // "UserService"
    String message = m.group(5);  // "User not found: 42"
}
```

### Named Groups (Java 7+) — More Readable

```java
Pattern pattern = Pattern.compile(
    "(?<date>\\d{4}-\\d{2}-\\d{2}) (?<time>\\d{2}:\\d{2}:\\d{2}) (?<level>\\w+)"
);

Matcher m = pattern.matcher(logLine);
if (m.find()) {
    String date = m.group("date");   // "2026-03-08"
    String level = m.group("level"); // "ERROR"
}
```

---

🔬 **Section Challenge — 10. Capturing Groups — Extracting Data**

**Challenge 1 (Capturing Group Back-References):** Regex `(\\w+) \\1` matches repeated words like `"hello hello"`. **Who** creates the back-reference? **When** does `\\1` fail in a Java `String.replaceAll()` replacement? **What** is the replacement string syntax for a group?

<details><summary>Answer</summary>

**Who creates the back-reference:** The regex engine. `(\\w+)` captures a group (group 1). `\\1` is a back-reference that matches THE SAME TEXT captured by group 1. Not "any word", but exactly the same characters. `"cat cat"` matches. `"cat dog"` doesn't. **When `\\1` fails in `replaceAll()`:** Back-references in REPLACEMENT strings use `$1`, not `\\1`. `"hello hello".replaceAll("(\\w+) \\1", "\\1")` — the replacement `"\\1"` is WRONG. Use `"$1"`. `\\1` in the REPLACEMENT string is interpreted as the literal character `\x01` (SOH control character). **Replacement string syntax:** `$1` references group 1. `$2` references group 2. `${name}` references named group `(?<name>...)`. **Named groups in Java:** `"(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})"`. Access via `matcher.group("year")`. Replace with `"${year}/${month}/${day}"`. **Java 11+ note:** `"hello hello".replaceFirst("(\\w+) \\1", "$1")` — replaces first occurrence only. Use `replaceAll` for all occurrences.

</details>
<details><summary>Answer</summary>

Immutability and Thread Safety. `java.util.Date` is completely mutable. If you passed a `Date` object to another thread, that thread could alter the time using `.setTime()`, instantly corrupting the data across the entire application (Race Condition). The new `java.time` classes (like `String`) are strictly immutable. Any modification (like `.plusDays(1)`) returns a brand new object, guaranteeing perfect thread safety in concurrent environments.

</details>

## 11. Practical Regex Patterns

```java
// Email validation (simplified but practical)
Pattern EMAIL = Pattern.compile(
    "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
);

// Phone number (flexible format)
Pattern PHONE = Pattern.compile(
    "^\\+?\\d{1,3}[- ]?\\d{3,4}[- ]?\\d{4,}$"
);

// URL extraction
Pattern URL = Pattern.compile(
    "https?://[\\w.-]+(?:/[\\w./?%&=+-]*)?"
);

// IP address
Pattern IP = Pattern.compile(
    "^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$"
);

// Password strength (min 8 chars, 1 upper, 1 lower, 1 digit, 1 special)
Pattern STRONG_PASSWORD = Pattern.compile(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
);

// Credit card (basic — Visa starts with 4, 16 digits)
Pattern VISA = Pattern.compile("^4\\d{15}$");
```

### Lookahead and Lookbehind

```java
// Lookahead: match X only if followed by Y
// (?=Y) → positive lookahead
// (?!Y) → negative lookahead

// Find numbers followed by "px"
Pattern px = Pattern.compile("\\d+(?=px)");
// "font-size: 16px, margin: 8px, color: red"
// Matches: 16, 8 (not the "px" itself)

// Lookbehind: match X only if preceded by Y
// (?<=Y) → positive lookbehind
// (?<!Y) → negative lookbehind

// Find numbers preceded by "$"
Pattern price = Pattern.compile("(?<=\\$)\\d+\\.?\\d*");
// "Price: $29.99, Discount: $5"
// Matches: 29.99, 5

// Password must contain at least one digit (using lookahead)
Pattern hasDigit = Pattern.compile("(?=.*\\d).{8,}");
```

---

## 12. String Methods with Regex

```java
// matches — entire string must match
"hello123".matches("[a-z]+\\d+");     // true
"hello 123".matches("[a-z]+\\d+");    // false (space)

// split — split by pattern
String csv = "apple, banana,  cherry ,  date";
String[] fruits = csv.split("\\s*,\\s*");
// ["apple", "banana", "cherry", "date"]

// replaceAll — replace all matches
String cleaned = "Hello   World   Java".replaceAll("\\s+", " ");
// "Hello World Java"

// Camel case to snake case
String snake = "getUserName".replaceAll("([A-Z])", "_$1").toLowerCase();
// "get_user_name"

// Remove HTML tags
String text = "<p>Hello <b>World</b></p>".replaceAll("<[^>]+>", "");
// "Hello World"
```

---

🔬 **Section Challenge — 12. String Methods with Regex**

**Challenge 1 (String.replaceAll() Security Risk):** `userInput` comes from an HTTP request. You call `str.replaceAll(userInput, "REDACTED")`. **Who** is at risk? **When** does this become a ReDoS attack? **What** is the safe alternative?

<details><summary>Answer</summary>

**Who is at risk:** Your server. `String.replaceAll(regex, replacement)` treats the FIRST argument as a regex pattern. If `userInput = "(a+)+"`, the call triggers catastrophic backtracking. If `userInput = "["`, it throws `PatternSyntaxException`. Both are denial-of-service vectors. **When it becomes a ReDoS attack:** Attacker sends crafted regex that causes exponential backtracking. Your thread hangs for seconds/minutes. With thread pool exhaustion, all requests block. Server appears down. Real CVEs have been filed for this pattern in logging libraries, web frameworks, and API validators. **Safe alternatives:** (1) **Literal replacement:** `str.replace(userInput, "REDACTED")` — `replace()` (not `replaceAll`) treats the first argument as a LITERAL string, not regex. No pattern compilation. (2) **Quote the pattern:** `str.replaceAll(Pattern.quote(userInput), "REDACTED")` — `Pattern.quote()` wraps input in `\\Q...\\E`, making it a literal pattern. (3) **Input validation:** Reject inputs matching known ReDoS patterns. **Rule:** Never pass user input directly to regex methods. Always use `replace()` for literal substitution or `Pattern.quote()` for safe regex escaping.

</details>
<details><summary>Answer</summary>

Immutability and Thread Safety. `java.util.Date` is completely mutable. If you passed a `Date` object to another thread, that thread could alter the time using `.setTime()`, instantly corrupting the data across the entire application (Race Condition). The new `java.time` classes (like `String`) are strictly immutable. Any modification (like `.plusDays(1)`) returns a brand new object, guaranteeing perfect thread safety in concurrent environments.

</details>

## 13. Performance — Pattern Compilation Matters

```java
// ❌ BAD: Recompiles pattern every call
public boolean isValidEmail(String email) {
    return email.matches("^[a-zA-Z0-9._%+-]+@...");  // Compiles EVERY TIME
}

// ✅ GOOD: Compile once, reuse
private static final Pattern EMAIL_PATTERN = Pattern.compile(
    "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
);

public boolean isValidEmail(String email) {
    return EMAIL_PATTERN.matcher(email).matches();  // Reuses compiled pattern
}
```

```
Performance Rules:
┌────────────────────────────────────────────────────────────┐
│ 1. ALWAYS compile patterns as static final constants       │
│ 2. str.matches() compiles every call — avoid in loops      │
│ 3. Use possessive quantifiers (++) to prevent backtracking │
│ 4. Be specific: [a-z] is faster than .                     │
│ 5. Watch for catastrophic backtracking: (a+)+ on "aaa...b" │
│                                                            │
│ ReDoS (Regex Denial of Service):                           │
│ Evil patterns like (a+)+ can take EXPONENTIAL time         │
│ on inputs like "aaaaaaaaaaaaaaaaaab"                       │
│ Always test with long adversarial inputs!                  │
└────────────────────────────────────────────────────────────┘
```

---

## 14. Java 9+ Regex Features

```java
// Matcher.results() — Stream of MatchResult (Java 9)
Pattern words = Pattern.compile("\\w+");
List<String> allWords = words.matcher("Hello World 2026")
    .results()
    .map(MatchResult::group)
    .toList();
// ["Hello", "World", "2026"]

// Pattern.asMatchPredicate() — for Stream.filter (Java 11)
Pattern numberPattern = Pattern.compile("\\d+");
Predicate<String> isNumber = numberPattern.asMatchPredicate();

List<String> numbers = List.of("hello", "123", "world", "456")
    .stream()
    .filter(isNumber)
    .toList();
// ["123", "456"]

// String.strip(), isBlank() complement regex (Java 11)
" hello ".strip();      // "hello" (Unicode-aware, unlike trim())
"   ".isBlank();        // true
```

---

## 15. Regex Cheat Sheet — Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│ TASK                  │ PATTERN                              │
│───────────────────────│──────────────────────────────────────│
│ Digits only           │ ^\d+$                                │
│ Letters only          │ ^[a-zA-Z]+$                          │
│ Alphanumeric          │ ^[a-zA-Z0-9]+$                       │
│ Email (simple)        │ ^[\w.+-]+@[\w.-]+\.\w{2,}$          │
│ URL                   │ https?://[\w.-]+(?:/[\w./?%&=]*)?    │
│ IP address            │ (\d{1,3}\.){3}\d{1,3}               │
│ Date (YYYY-MM-DD)     │ \d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]  │
│                       │ |[12]\d|3[01])                       │
│ HTML tag              │ <([a-z]+)[^>]*>.*?</\1>             │
│ Java identifier       │ [a-zA-Z_$][\w$]*                    │
│ Whitespace cleanup    │ \s+  → replace with single space     │
│ Camel → snake         │ ([A-Z]) → _$1 then lowercase        │
│ Extract quoted text   │ "([^"]*)" or '([^']*)'              │
│ Comment removal       │ //.*$ or /\*[\s\S]*?\*/              │
│ Palindrome check      │ (can't — regex can't do this well)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 16. Interview Questions & Answers

**Q: Why should we use java.time instead of java.util.Date?**
java.time classes are immutable (thread-safe), have clear naming, correct month indexing (1=Jan), handle timezones properly, and avoid the design flaws of Date/Calendar.

**Q: Difference between LocalDateTime and ZonedDateTime?**
LocalDateTime has no timezone info — it's "March 8, 2:30 PM" without saying WHERE. ZonedDateTime includes timezone, so "March 8, 2:30 PM IST" is unambiguous globally. Use ZonedDateTime for anything cross-timezone.

**Q: How do you store dates in a database?**
Store as `Instant` (UTC timestamp) or `TIMESTAMP WITH TIME ZONE`. Convert to user's timezone only when displaying. Never store as String.

**Q: What's the difference between `matches()` and `find()`?**
`matches()` checks if the ENTIRE string matches the pattern. `find()` searches for ANY occurrence within the string.

**Q: How do you avoid ReDoS?**
Avoid nested quantifiers like `(a+)+`. Use possessive quantifiers `(a++)` or atomic groups. Set timeouts. Test with long adversarial inputs. Use `Pattern.compile()` with static constants.

**Q: Write regex to validate a password with 8+ chars, 1 uppercase, 1 lowercase, 1 digit.**
`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$` — uses three lookaheads to assert each requirement without consuming characters.

---

**Key Takeaway**: `java.time` is non-negotiable for modern Java — always use it.
Regex is a powerful tool but compile patterns once and watch for ReDoS.
Both are daily-use skills in any Java role.

**Navigation**: [< Enums, Records & Sealed](Ch03_Enums_Records_Sealed.md) | [Back to Index](../00_MASTER_INDEX.md) | [Generics & Exceptions >](Ch04_Generics_Exceptions.md)
