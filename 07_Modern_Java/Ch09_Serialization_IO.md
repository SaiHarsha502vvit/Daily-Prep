# 53. Java Serialization & I/O Streams — Complete Deep Dive

**Navigation**: [< ClassLoader/JDBC/Logging](Ch12_ClassLoader_JDBC_Logging.md) | [Back to Index](../00_MASTER_INDEX.md) | [JMM & GC Deep >](Ch18_JMM_GC_Deep.md)

---

## PART 1: SERIALIZATION — Object ↔ Bytes

---

## 🎯 The 5W1H

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT = Converting a Java object into a byte stream (and back)   ║
║                                                                  ║
║  WHY  = To SAVE objects (to disk, database, cache) or SEND       ║
║         them (over network, between JVMs, in messages)           ║
║                                                                  ║
║  WHEN = Caching (Redis), messaging (Kafka), RMI, HTTP sessions,  ║
║         deep cloning, file persistence                           ║
║                                                                  ║
║  WHO  = ObjectOutputStream (serialize), ObjectInputStream        ║
║         (deserialize), Jackson/Gson (JSON), Protobuf (binary)    ║
║                                                                  ║
║  HOW  = Implement Serializable marker interface                  ║
╚══════════════════════════════════════════════════════════════════╝

### Historical Evolution

**Inventor / Originator:** Sun Microsystems (1997) — Java serialization introduced with Java 1.1 to support Remote Method Invocation (RMI).

**Predecessor context:** Before Java 1.1, inter-JVM communication required custom byte-encoding. RMI needed a portable object representation that could cross JVM boundaries reliably.

**Evolution narrative:** Java serialization arrived in Java 1.1 (1997) as RMI's wire protocol. It was powerful but dangerous — any class implementing `Serializable` was remotely exploitable. The Equifax breach (2017) and multiple Jenkins vulnerabilities exploited this. The `readResolve()` protection pattern was formalized as the correct fix. XML was the dominant data format in the 2000s (Java 1.4 added regex and NIO, not serialization fixes). JSON won over XML for Java serialization around 2007-2008 — Jackson (2007) and Gson (2008) became the standard alternatives. Java 7 (2011) introduced NIO.2 (Files API) replacing the fragile `java.io.File` API. The decorator pattern (GoF, 1994) shaped Java I/O streams from the beginning.

**Modern practice:** Modern Spring Boot (post-2018) uses Jackson with `@JsonIgnore`, `@JsonView`, and JSON Schema validation. Protobuf (Google, 2008, open-sourced 2008) and Avro (2010) are common in microservices. Spring's `RestTemplate` and `WebClient` use JSON by default. Kryo (2011) is used for high-performance binary serialization in Kafka and Spark.

- **Java serialization — Java 1.1 (1997)**: Sun Microsystems. RMI wire protocol. Security hole by default.
- **JavaBeans spec — 1998**: `PropertyChangeSupport`, `Serializable` — JavaBeans event model.
- **NIO channels/buffers — Java 1.4 (2002)**: Non-blocking I/O. Replaced blocking socket APIs.
- **Jackson — 2007**: JSON serialization. Dominant in Spring Boot. `ObjectMapper`, tree model, data binding.
- **Java 7 NIO.2 Files API — 2011**: `Paths.get()`, `Files.readAllLines()`, `Path` replacing `java.io.File`.
- **Equifax breach — 2017**: Exploited Java deserialization gadgets in Apache Struts. Sparked serialization hardening.
```

---

## 1. Java Serializable — The Basics

```java
// Serializable is a MARKER interface — no methods to implement
import java.io.Serializable;

public class User implements Serializable {
    private static final long serialVersionUID = 1L;  // Version control

    private String name;
    private int age;
    private transient String password;  // ← NOT serialized!

    // Constructor, getters, setters...
}
```

```java
// SERIALIZE — Object → Bytes (Write)
User user = new User("Harsha", 25, "secret123");

try (ObjectOutputStream oos = new ObjectOutputStream(
        new FileOutputStream("user.ser"))) {
    oos.writeObject(user);
}

// DESERIALIZE — Bytes → Object (Read)
try (ObjectInputStream ois = new ObjectInputStream(
        new FileInputStream("user.ser"))) {
    User restored = (User) ois.readObject();

    System.out.println(restored.getName());     // "Harsha"
    System.out.println(restored.getAge());      // 25
    System.out.println(restored.getPassword()); // null ← transient field!
}
```

---

## 2. serialVersionUID — Why It Matters

```
╔══════════════════════════════════════════════════════════════════╗
║ serialVersionUID is a VERSION NUMBER for your class.             ║
║                                                                  ║
║ When you deserialize, Java checks:                               ║
║   "Does the serialVersionUID in the file match the class?"       ║
║                                                                  ║
║ If NO → InvalidClassException → deserialization FAILS            ║
║ If YES → proceeds with deserialization                           ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// Version 1 of your class
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    private int age;
}

// Version 2 — you ADD a field
public class User implements Serializable {
    private static final long serialVersionUID = 1L;  // SAME UID → compatible!
    private String name;
    private int age;
    private String email;  // New field → gets default null when deserializing old data
}

// Version 3 — you CHANGE the UID
public class User implements Serializable {
    private static final long serialVersionUID = 2L;  // CHANGED → old data can't be read!
    // InvalidClassException when reading files saved with UID=1
}
```

```
RULES:
┌───────────────────────────────────────────────────────────────┐
│ Always declare serialVersionUID explicitly                    │
│ If you DON'T, Java computes one from class structure          │
│ → Any change (even adding a method) changes the auto-UID      │
│ → Old serialized data becomes unreadable!                     │
│                                                               │
│ KEEP SAME UID: when adding optional fields                    │
│ CHANGE UID: when making incompatible changes (removing fields)│
└──────────────────────────────────────────────────────────────-
```

---

## 3. The `transient` Keyword

```java
public class Session implements Serializable {
    private static final long serialVersionUID = 1L;

    private String userId;
    private String sessionToken;

    // Fields you DON'T want serialized:
    private transient String password;       // Security — never persist passwords
    private transient Socket connection;     // Can't serialize network connections
    private transient Logger log;            // Not meaningful after deserialization
    private transient int cachedHashCode;    // Recompute after deserialization

    // static fields are ALSO not serialized (they belong to the class, not the object)
    private static int instanceCount = 0;
}
```

---

## 4. Custom Serialization Hooks

```java
// Override readObject/writeObject for CUSTOM serialization logic
public class Account implements Serializable {
    private static final long serialVersionUID = 1L;

    private String owner;
    private transient BigDecimal balance;  // Custom handling

    // Called during serialization
    private void writeObject(ObjectOutputStream oos) throws IOException {
        oos.defaultWriteObject();  // Serialize all non-transient fields
        // Custom: write balance as String (BigDecimal isn't always safe)
        oos.writeUTF(balance.toPlainString());
    }

    // Called during deserialization
    private void readObject(ObjectInputStream ois)
            throws IOException, ClassNotFoundException {
        ois.defaultReadObject();  // Deserialize all non-transient fields
        // Custom: read balance back
        balance = new BigDecimal(ois.readUTF());
    }

    // Called AFTER deserialization — can replace the deserialized object
    private Object readResolve() {
        // Used by Singleton pattern to prevent duplicate instances
        return this;
    }

    // Called BEFORE serialization — can substitute a different object
    private Object writeReplace() {
        return this;  // Or return a proxy object
    }
}
```

### Singleton Protection with readResolve

```java
public class AppConfig implements Serializable {
    private static final long serialVersionUID = 1L;
    private static final AppConfig INSTANCE = new AppConfig();

    private AppConfig() {}

    public static AppConfig getInstance() { return INSTANCE; }

    // WITHOUT readResolve: deserialization creates a NEW instance!
    // WITH readResolve: deserialization returns the EXISTING singleton
    private Object readResolve() {
        return INSTANCE;  // Always return the singleton
    }
}
```

---

🔬 **Section Challenge — 4. Custom Serialization Hooks**

**Challenge 1 (Serialization Reasoning):** A class has a cached field, a password field, and an invariant that `startDate <= endDate`. How should custom serialization hooks protect correctness and security?

<details><summary>Trace, Reasoning & Debug</summary>

Mark secrets and recomputable caches as `transient`. During `writeObject`, write only durable state. During `readObject`, restore derived fields and validate invariants before the object escapes.

The danger is that deserialization can create objects without normal constructors. If `readObject` does not re-check invariants, an invalid object graph can enter the application.

Use `private void writeObject(ObjectOutputStream out)` and `private void readObject(ObjectInputStream in)` carefully, prefer modern formats like JSON/Protobuf for external boundaries, and never deserialize untrusted bytes without strict filtering.

</details>

## 5. Externalizable — Full Control

```java
// Externalizable gives YOU complete control (no default behavior)
public class Product implements Externalizable {
    private String name;
    private double price;
    private String internalCode;

    public Product() {}  // ⚠️ MUST have public no-arg constructor!

    @Override
    public void writeExternal(ObjectOutput out) throws IOException {
        out.writeUTF(name);
        out.writeDouble(price);
        // DON'T write internalCode — we choose what to serialize
    }

    @Override
    public void readExternal(ObjectInput in) throws IOException, ClassNotFoundException {
        name = in.readUTF();
        price = in.readDouble();
        // internalCode stays null
    }
}
```

```
Serializable vs Externalizable:
┌────────────────────────┬────────────────────────────────┐
│ Serializable            │ Externalizable                 │
├────────────────────────┼────────────────────────────────┤
│ Marker interface        │ Has writeExternal/readExternal │
│ Auto-serializes fields  │ YOU write everything           │
│ No-arg constructor      │ MUST have public no-arg        │
│   not required          │   constructor                  │
│ Slower (uses reflection)│ Faster (direct control)        │
│ Uses transient to skip  │ You just don't write the field │
│ 99% of the time use this│ Use for performance-critical   │
└────────────────────────┴────────────────────────────────┘
```

---

## 6. Serialization Security Risks

```
╔══════════════════════════════════════════════════════════════════╗
║ ⚠️  SECURITY WARNING — Java deserialization is DANGEROUS!       ║
║                                                                  ║
║ Deserializing untrusted data = Remote Code Execution risk        ║
║ This is HOW major breaches happened (Equifax, Jenkins, etc.)     ║
║                                                                  ║
║ The attack: Attacker crafts a byte stream that, when              ║
║ deserialized, executes arbitrary code via "gadget chains"        ║
║ (chains of objects whose constructors/methods do harmful things) ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// ❌ NEVER deserialize untrusted data with ObjectInputStream
ObjectInputStream ois = new ObjectInputStream(untrustedStream);
Object obj = ois.readObject();  // 💥 Potential remote code execution!

// ✅ Use JSON instead (Jackson/Gson) — much safer
ObjectMapper mapper = new ObjectMapper();
User user = mapper.readValue(jsonString, User.class);

// ✅ If you MUST use Java serialization, use ObjectInputFilter (Java 9+)
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
    "com.myapp.*;!*"  // Only allow classes from your package
);
ois.setObjectInputFilter(filter);
```

---

🔬 **Section Challenge — 6. Serialization Security Risks**

**Challenge 1 (Security Reasoning):** Why is Java native deserialization dangerous when the byte stream comes from a user or network boundary?

<details><summary>Trace, Reasoning & Debug</summary>

Native deserialization rebuilds an object graph from class metadata and field values. Attackers can craft payloads that trigger gadget chains in classes already on the classpath.

The core problem is not only data parsing; it is behavior during object reconstruction. Methods such as `readObject`, validation hooks, and library gadgets can execute while the object graph is being restored.

Avoid native Java serialization for untrusted input. Use JSON/Protobuf with explicit schemas, apply `ObjectInputFilter` when legacy deserialization is unavoidable, allowlist classes, and keep dangerous gadget libraries off exposed boundaries.

</details>

## 7. Modern Alternatives — Jackson & Gson

```java
// Jackson — JSON serialization (Spring Boot default)
ObjectMapper mapper = new ObjectMapper();

// Object → JSON String
String json = mapper.writeValueAsString(user);
// {"name":"Harsha","age":25}

// JSON String → Object
User user = mapper.readValue(json, User.class);

// Customizing with annotations
public class User {
    @JsonProperty("user_name")         // Rename in JSON
    private String name;

    @JsonIgnore                        // Exclude from JSON
    private String password;

    @JsonFormat(pattern = "yyyy-MM-dd") // Date format
    private LocalDate birthDate;

    @JsonInclude(JsonInclude.Include.NON_NULL)  // Skip nulls
    private String email;
}

// Gson — Google's alternative
Gson gson = new Gson();
String json = gson.toJson(user);
User user = gson.fromJson(json, User.class);
```

---

## PART 2: JAVA I/O STREAMS — The Complete Picture

---

🔬 **Section Challenge — PART 2: JAVA I/O STREAMS — The Complete Picture**

**Challenge 1 (I/O Reasoning):** You read a 4GB file using `Files.readAllBytes()` and the JVM crashes. Which I/O mental model did you violate?

<details><summary>Trace, Reasoning & Debug</summary>

`readAllBytes()` materializes the whole file in heap memory. A stream-based design processes bytes in chunks, so memory stays bounded regardless of file size.

Java I/O streams are about data flow, buffering, and resource lifetime. The right abstraction depends on data type: bytes for binary data, readers/writers for text, and buffered wrappers to reduce system calls.

Fix by using `InputStream`, `BufferedInputStream`, `Files.newBufferedReader`, or NIO channels, then process incrementally with try-with-resources.

</details>

**Challenge 2 (Bug Hunt):** You call `stream.filter(...).collect(...)` twice on the same stream. What happens?

<details><summary>Answer</summary>

`IllegalStateException: stream has already been operated upon or closed`. Streams are single-use. Once a terminal operation is called, the stream is consumed. Fix: create a new stream from the source each time, or collect to a `List` first and stream the list repeatedly.

</details>

## 8. The I/O Stream Hierarchy

```
BYTE STREAMS (raw bytes — images, zip, binary):
┌─────────────────────────────────────────────────────────────┐
│                  InputStream (abstract)                       │
│                 /          |           \                      │
│   FileInputStream  ByteArrayInputStream  ObjectInputStream   │
│                          |                                    │
│              BufferedInputStream (decorator)                  │
│              DataInputStream (reads int, double, etc.)        │
│                                                               │
│                  OutputStream (abstract)                      │
│                 /          |           \                      │
│  FileOutputStream ByteArrayOutputStream ObjectOutputStream   │
│                          |                                    │
│             BufferedOutputStream (decorator)                  │
│             DataOutputStream                                 │
└─────────────────────────────────────────────────────────────┘

CHARACTER STREAMS (text — .txt, .csv, .json, .xml):
┌─────────────────────────────────────────────────────────────┐
│                    Reader (abstract)                        │
│             /             |        \                        │
│     FileReader   InputStreamReader   StringReader           │
│                        |                                    │
│              BufferedReader (decorator)                     │
│                                                             │
│                    Writer (abstract)                        │
│                  /         |        \                       │
│    FileWriter   OutputStreamWriter   StringWriter           │
│                        |                                    │
│              BufferedWriter (decorator)                     │
│              PrintWriter (println, printf)                  │
└─────────────────────────────────────────────────────────────┘

RULE: Byte streams for binary data, Character streams for text
      ALWAYS wrap in Buffered* for performance
      ALWAYS use try-with-resources
```

---

🔬 **Section Challenge — 8. The I/O Stream Hierarchy**

**Challenge 1 (Hierarchy Reasoning):** Why does Java split I/O into `InputStream`/`OutputStream` and `Reader`/`Writer`, instead of using one universal API?

<details><summary>Trace, Reasoning & Debug</summary>

`InputStream` and `OutputStream` move raw bytes. `Reader` and `Writer` move decoded characters using a charset. Text is not bytes until an encoding is chosen.

Using byte streams for text without charset awareness causes silent corruption when the platform default charset differs from the file encoding.

Use byte streams for images, zip files, PDFs, and network protocols. Use readers/writers for text and always specify `StandardCharsets.UTF_8` unless the format demands something else.

</details>

**Challenge 2 (Bug Hunt):** You call `stream.filter(...).collect(...)` twice on the same stream. What happens?

<details><summary>Answer</summary>

`IllegalStateException: stream has already been operated upon or closed`. Streams are single-use. Once a terminal operation is called, the stream is consumed. Fix: create a new stream from the source each time, or collect to a `List` first and stream the list repeatedly.

</details>

## 9. Byte Streams vs Character Streams

```java
// BYTE STREAM — reading raw bytes
try (FileInputStream fis = new FileInputStream("image.png")) {
    byte[] buffer = new byte[8192];
    int bytesRead;
    while ((bytesRead = fis.read(buffer)) != -1) {
        // Process bytes...
    }
}

// CHARACTER STREAM — reading text (handles encoding!)
try (BufferedReader br = new BufferedReader(
        new FileReader("data.txt", StandardCharsets.UTF_8))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
}

// WHY character streams matter:
// 'é' (e-acute) is 2 BYTES in UTF-8 but 1 CHARACTER
// Byte stream: reads 2 bytes → you get garbage if you treat as chars
// Char stream: reads 2 bytes → correctly gives you 1 char 'é'
```

---

🔬 **Section Challenge — 9. Byte Streams vs Character Streams**

**Challenge 1 (Bug Hunt):** A CSV with names from multiple languages works on your laptop but shows broken characters in production. What likely happened?

<details><summary>Trace, Reasoning & Debug</summary>

The code probably used the platform default charset, such as `new FileReader(file)`, instead of specifying the file encoding. Different machines can have different defaults.

Bytes do not become characters until decoded. If UTF-8 bytes are decoded as another charset, characters become corrupted.

Fix by using `Files.newBufferedReader(path, StandardCharsets.UTF_8)` or `InputStreamReader(input, StandardCharsets.UTF_8)`. For binary files, never use character streams.

</details>

**Challenge 2 (Bug Hunt):** You call `stream.filter(...).collect(...)` twice on the same stream. What happens?

<details><summary>Answer</summary>

`IllegalStateException: stream has already been operated upon or closed`. Streams are single-use. Once a terminal operation is called, the stream is consumed. Fix: create a new stream from the source each time, or collect to a `List` first and stream the list repeatedly.

</details>

## 10. The Decorator Pattern in I/O

```java
// Java I/O is the TEXTBOOK example of the Decorator pattern
// Each wrapper ADDS behavior without changing the interface

// Layer 1: Raw file access
FileInputStream fis = new FileInputStream("data.bin");

// Layer 2: Add buffering (8KB buffer by default)
BufferedInputStream bis = new BufferedInputStream(fis);

// Layer 3: Add ability to read Java primitives
DataInputStream dis = new DataInputStream(bis);

// Now you can:
int value = dis.readInt();       // Read 4 bytes as int
double price = dis.readDouble(); // Read 8 bytes as double
String name = dis.readUTF();     // Read length-prefixed UTF-8 string

// In practice — always chain in try-with-resources:
try (var dis = new DataInputStream(
        new BufferedInputStream(
            new FileInputStream("data.bin")))) {
    int value = dis.readInt();
}
// Closing outermost closes ALL inner streams
```

```
Decorator chain visualized:
┌─────────────────────────────────────────────┐
│ DataInputStream                             │
│   reads Java types (int, double, String)    │
│   ┌─────────────────────────────────────┐   │
│   │ BufferedInputStream                 │   │
│   │   reads in 8KB chunks (fast!)       │   │
│   │   ┌─────────────────────────────┐   │   │
│   │   │ FileInputStream             │   │   │
│   │   │   reads raw bytes from disk │   │   │
│   │   └─────────────────────────────┘   │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — 10. The Decorator Pattern in I/O**

**Challenge 1 (Design Pattern Reasoning):** Why is `new BufferedInputStream(new FileInputStream(path))` a Decorator pattern instead of inheritance?

<details><summary>Trace, Reasoning & Debug</summary>

`FileInputStream` knows how to read bytes from a file. `BufferedInputStream` adds buffering behavior around any `InputStream`, not only file streams.

The decorator keeps the same interface while layering behavior at runtime. You can stack buffering, compression, encryption, or data conversion without creating a subclass for every combination.

The mental model is wrapper composition: each layer delegates to the wrapped stream and adds one responsibility.

</details>

## 11. NIO.2 Files API — The Modern Way (Java 7+)

```java
import java.nio.file.*;

// Path — the modern replacement for java.io.File
Path path = Path.of("data", "users.txt");     // data/users.txt
Path home = Path.of(System.getProperty("user.home"));
Path resolved = home.resolve("documents/file.txt");

// Read entire file (small files)
String content = Files.readString(Path.of("config.json"));
List<String> lines = Files.readAllLines(Path.of("data.csv"));
byte[] bytes = Files.readAllBytes(Path.of("image.png"));

// Write entire file
Files.writeString(Path.of("output.txt"), "Hello World");
Files.write(Path.of("data.csv"), lines);

// Stream lines (for LARGE files — lazy, memory-efficient)
try (Stream<String> stream = Files.lines(Path.of("huge.log"))) {
    long errorCount = stream
        .filter(line -> line.contains("ERROR"))
        .count();
}

// Copy, move, delete
Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
Files.move(source, target, StandardCopyOption.ATOMIC_MOVE);
Files.delete(path);
Files.deleteIfExists(path);

// Create directories
Files.createDirectories(Path.of("a/b/c"));  // Creates all parents

// Check file properties
Files.exists(path);
Files.isRegularFile(path);
Files.isDirectory(path);
Files.size(path);             // File size in bytes
Files.getLastModifiedTime(path);
```

### Walking Directory Trees

```java
// List files in a directory
try (Stream<Path> entries = Files.list(Path.of("src"))) {
    entries.filter(Files::isRegularFile)
           .forEach(System.out::println);
}

// Recursively walk a directory tree
try (Stream<Path> walk = Files.walk(Path.of("project"))) {
    List<Path> javaFiles = walk
        .filter(p -> p.toString().endsWith(".java"))
        .toList();
}

// Find files matching a pattern
try (Stream<Path> found = Files.find(Path.of("project"), 10,
        (path, attrs) -> path.toString().endsWith(".java")
                          && attrs.size() > 1000)) {
    found.forEach(System.out::println);
}
```

---

## 12. Character Encoding — The Silent Bug Source

```java
// ❌ DON'T use default encoding (platform-dependent!)
new FileReader("data.txt");           // Uses system default encoding!
new FileWriter("data.txt");           // BAD — different on Windows vs Linux

// ✅ ALWAYS specify encoding
new FileReader("data.txt", StandardCharsets.UTF_8);
new FileWriter("data.txt", StandardCharsets.UTF_8);

// Or use NIO.2 (UTF-8 by default in Java 18+)
Files.readString(Path.of("data.txt"), StandardCharsets.UTF_8);
Files.writeString(Path.of("data.txt"), content, StandardCharsets.UTF_8);

// Converting between byte[] and String
byte[] bytes = "Hello".getBytes(StandardCharsets.UTF_8);
String text = new String(bytes, StandardCharsets.UTF_8);
```

```
Common encodings:
┌────────────────────┬──────────────────────────────────────┐
│ UTF-8              │ Universal standard. Use this.         │
│                    │ Variable: 1-4 bytes per character     │
│                    │ ASCII-compatible                      │
├────────────────────┼──────────────────────────────────────┤
│ UTF-16             │ Java's internal String encoding       │
│                    │ 2 or 4 bytes per character            │
├────────────────────┼──────────────────────────────────────┤
│ ISO-8859-1         │ Western European. 1 byte per char.   │
│ (Latin-1)          │ Can't handle Chinese, Arabic, etc.   │
├────────────────────┼──────────────────────────────────────┤
│ US-ASCII           │ 7-bit. English only. Very limited.   │
└────────────────────┴──────────────────────────────────────┘
```

---

🔬 **Section Challenge — 12. Character Encoding — The Silent Bug Source**

**Challenge 1 (Encoding Reasoning):** Why can `string.getBytes()` and `new String(bytes)` be a production bug even when tests pass locally?

<details><summary>Trace, Reasoning & Debug</summary>

Those overloads use the platform default charset. If local and production defaults differ, the same text can produce different bytes or decode incorrectly.

Encoding bugs are dangerous because they are data-dependent. ASCII-only tests pass, while names, currency symbols, emojis, or multilingual text fail later.

Always specify the charset at boundaries: `text.getBytes(StandardCharsets.UTF_8)` and `new String(bytes, StandardCharsets.UTF_8)`. Treat bytes/text conversion as an explicit design decision.

</details>

## 13. Interview Questions & Answers

**Q: What is serialVersionUID and why should you always declare it?**
It's a version number for serialized classes. If you don't declare it, Java auto-generates one from the class structure — any change (even adding a comment-adjacent method) changes the UID and makes old serialized data unreadable. Always declare it explicitly and increment when making breaking changes.

**Q: What does `transient` do?**
Marks a field to be EXCLUDED from serialization. Used for: passwords (security), computed values (recomputable), non-serializable objects (Logger, Socket), and caches. The field gets its default value (null, 0, false) after deserialization.

**Q: Why are Java deserialization vulnerabilities dangerous?**
Deserializing crafts a full object graph including running constructors and methods. Attackers craft malicious byte streams that chain together existing library classes ("gadget chains") to execute arbitrary commands. Use JSON serialization or ObjectInputFilter instead.

**Q: Explain the Decorator pattern in Java I/O.**
Each stream wrapper adds one capability: FileInputStream(raw bytes) → BufferedInputStream(buffering) → DataInputStream(Java types). They all implement InputStream, so you can stack any combination. This avoids the explosion of classes that would happen with inheritance.

**Q: When do you use byte streams vs character streams?**
Byte streams (InputStream/OutputStream) for binary data: images, compressed files, serialized objects. Character streams (Reader/Writer) for text: they handle character encoding (turning bytes into chars). Always use character streams for text to avoid encoding bugs.

**Q: Files.readAllLines() vs Files.lines() — when to use which?**
`readAllLines()` loads ALL lines into memory — fine for small files. `lines()` returns a lazy Stream — use for large files (gigabytes) because it processes line-by-line without loading everything into memory.

---

**Key Takeaway**: Always use `serialVersionUID`, never deserialize untrusted data,
prefer JSON (Jackson) over Java serialization. For I/O, use NIO.2 Files API
with explicit UTF-8 encoding. Buffering and the Decorator pattern are the
design foundations of Java I/O.

**Navigation**: [< ClassLoader/JDBC/Logging](Ch12_ClassLoader_JDBC_Logging.md) | [Back to Index](../00_MASTER_INDEX.md) | [JMM & GC Deep >](Ch18_JMM_GC_Deep.md)
