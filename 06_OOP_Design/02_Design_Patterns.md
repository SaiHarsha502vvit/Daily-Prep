# 🎨 Design Patterns: Complete Guide from Scratch

## Building Reusable, Maintainable Software

---

# PART 0: COMPLETE UNDERSTANDING OF DESIGN PATTERNS

```
╔══════════════════════════════════════════════════════════════════════════════╗
║           DESIGN PATTERNS - COMPLETE UNDERSTANDING & GROWTH MINDSET          ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT ARE DESIGN PATTERNS?                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ Design patterns are REUSABLE SOLUTIONS to COMMON problems that occur in     │
│ software design. They are templates, not finished code.                      │
│                                                                              │
│ KEY INSIGHT: Patterns are like RECIPES in cooking!                          │
│ • Recipe tells you the approach, not exact ingredients                      │
│ • You adapt the recipe to your specific needs                               │
│ • Knowing recipes makes you a better cook/developer                         │
│                                                                              │
│ ANALOGY:                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ WITHOUT PATTERNS:                                                       │ │
│ │ "I need to make food" → Start from scratch every time                   │ │
│ │                                                                         │ │
│ │ WITH PATTERNS:                                                          │ │
│ │ "I need to make curry" → Use curry recipe (known solution)              │ │
│ │ "I need to bake" → Use baking techniques (known approach)               │ │
│ │                                                                         │ │
│ │ IN SOFTWARE:                                                            │ │
│ │ "I need one global config" → Use Singleton pattern                      │ │
│ │ "I need to create objects flexibly" → Use Factory pattern               │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ HISTORICAL EVOLUTION:                                                        │
│ • 1977: Christopher Alexander - patterns in architecture                    │
│ • 1987: Kent Beck & Ward Cunningham - patterns in software                  │
│ • 1994: Gang of Four (GoF) book - 23 classic patterns                       │
│ • 2000s: Enterprise patterns, Web patterns emerged                          │
│ • 2010s: Microservices patterns, Cloud patterns                             │
│ • Today: Patterns for AI, serverless, reactive systems                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DO DESIGN PATTERNS SOLVE?                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PROBLEM 1: REINVENTING THE WHEEL                                             │
│ • Developers solve same problems repeatedly                                  │
│ • Each solution is different, often suboptimal                              │
│ • Patterns provide PROVEN solutions                                         │
│                                                                              │
│ PROBLEM 2: COMMUNICATION                                                     │
│ • "I used a thing that creates objects..." (vague)                          │
│ • "I used the Factory pattern" (precise, everyone understands)              │
│ • Patterns give us a COMMON VOCABULARY                                      │
│                                                                              │
│ PROBLEM 3: MAINTAINABILITY                                                   │
│ • Spaghetti code is hard to change                                          │
│ • Patterns enforce STRUCTURE and SEPARATION                                 │
│                                                                              │
│ PROBLEM 4: FLEXIBILITY                                                       │
│ • Requirements change constantly                                             │
│ • Patterns make code ADAPTABLE to change                                    │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • Java Collections use Iterator pattern                                     │
│ • Spring Framework uses Factory, Singleton, Proxy patterns                  │
│ • React uses Observer pattern (state updates)                               │
│ • Android uses Builder pattern (AlertDialog.Builder)                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY LEARN DESIGN PATTERNS?                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. BETTER CODE QUALITY:                                                      │
│    • Patterns are battle-tested solutions                                   │
│    • Fewer bugs, easier maintenance                                         │
│                                                                              │
│ 2. FASTER DEVELOPMENT:                                                       │
│    • Don't waste time designing from scratch                                │
│    • Apply known solutions to new problems                                  │
│                                                                              │
│ 3. TEAM COMMUNICATION:                                                       │
│    • "Use Strategy pattern here" - everyone understands                     │
│    • Code reviews become easier                                             │
│                                                                              │
│ 4. INTERVIEW SUCCESS:                                                        │
│    • OOP/Design interviews test pattern knowledge                           │
│    • Shows architectural thinking ability                                   │
│                                                                              │
│ 5. FRAMEWORK UNDERSTANDING:                                                  │
│    • Spring, Hibernate, React all use patterns                              │
│    • Understanding patterns = understanding frameworks                      │
│                                                                              │
│ 6. CAREER GROWTH:                                                            │
│    • Senior developers MUST know patterns                                   │
│    • Required for system design and architecture roles                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE DESIGN PATTERNS?                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ USE PATTERNS WHEN:                                                           │
│ ✅ You recognize a recurring problem                                        │
│ ✅ You need flexibility for future changes                                  │
│ ✅ You're building frameworks or libraries                                  │
│ ✅ Multiple classes need to work together                                   │
│ ✅ You want to follow SOLID principles                                      │
│                                                                              │
│ DON'T USE PATTERNS WHEN:                                                     │
│ ❌ Simple code does the job                                                 │
│ ❌ You're forcing a pattern where it doesn't fit                            │
│ ❌ Pattern adds unnecessary complexity                                       │
│ ❌ One-time scripts or throwaway code                                       │
│                                                                              │
│ GOLDEN RULE:                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  "Use patterns to SOLVE problems, not to SHOW OFF knowledge"            │ │
│ │                                                                         │ │
│ │  Over-engineering with patterns is as bad as no patterns!              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ GROWTH MINDSET: FROM PATTERN USER TO PATTERN CREATOR ⭐                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ LEVEL 1 - LEARNER:                                                           │
│ "I know what Singleton is"                                                   │
│                                                                              │
│ LEVEL 2 - IMPLEMENTER:                                                       │
│ "I can implement Singleton correctly"                                        │
│                                                                              │
│ LEVEL 3 - RECOGNIZER:                                                        │
│ "I can identify when to use Singleton in my code"                           │
│                                                                              │
│ LEVEL 4 - COMBINER:                                                          │
│ "I can combine multiple patterns to solve complex problems"                 │
│                                                                              │
│ LEVEL 5 - CREATOR:                                                           │
│ "I can create new patterns for recurring problems in my domain"             │
│                                                                              │
│ THE TRUTH:                                                                   │
│ GoF patterns were CREATED by observing recurring solutions!                 │
│ YOU can observe patterns in your domain and document them too!              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ PATTERN CATEGORIES                                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. CREATIONAL PATTERNS (Object Creation)                                     │
│    "HOW do I create objects?"                                               │
│    • Singleton, Factory, Abstract Factory, Builder, Prototype               │
│                                                                              │
│ 2. STRUCTURAL PATTERNS (Object Composition)                                  │
│    "HOW do I structure classes and objects?"                                │
│    • Adapter, Bridge, Composite, Decorator, Facade, Proxy                   │
│                                                                              │
│ 3. BEHAVIORAL PATTERNS (Object Interaction)                                  │
│    "HOW do objects communicate and behave?"                                 │
│    • Observer, Strategy, Command, Iterator, State, Template Method          │
│                                                                              │
│ QUICK SELECTION GUIDE:                                                       │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ NEED                              │ PATTERN                              ││
│ │ ────────────────────────────────────────────────────────────────────────││
│ │ Only one instance                 │ Singleton                            ││
│ │ Create objects without specifying │ Factory                              ││
│ │ Complex object construction       │ Builder                              ││
│ │ Convert interface                 │ Adapter                              ││
│ │ Add behavior dynamically          │ Decorator                            ││
│ │ Simplify complex subsystem        │ Facade                               ││
│ │ Notify multiple objects           │ Observer                             ││
│ │ Swap algorithms at runtime        │ Strategy                             ││
│ │ Undo/Redo operations              │ Command                              ││
│ │ Different behavior based on state │ State                                ││
│ └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN LEARNING DESIGN PATTERNS                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. "TOO ABSTRACT":                                                           │
│    Solution: Study with REAL examples, not just UML diagrams                │
│                                                                              │
│ 2. "DON'T KNOW WHEN TO USE":                                                 │
│    Solution: Learn the PROBLEM each pattern solves first                    │
│                                                                              │
│ 3. "PATTERNS LOOK SIMILAR":                                                  │
│    Solution: Focus on INTENT, not just structure                            │
│    Factory vs Builder: Factory - which type, Builder - how to construct    │
│                                                                              │
│ 4. "OVER-ENGINEERING":                                                       │
│    Solution: Start simple, add patterns when complexity grows               │
│                                                                              │
│ 5. "TOO MANY PATTERNS":                                                      │
│    Solution: Master 10 essential patterns first                             │
│    Singleton, Factory, Builder, Adapter, Decorator, Facade,                │
│    Observer, Strategy, Command, Template Method                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS OF MASTERING DESIGN PATTERNS                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ PATTERN RECOGNITION: See problem → Know which pattern applies           │
│ ✅ CLEAN CODE: Write maintainable, flexible code                            │
│ ✅ FRAMEWORK MASTERY: Understand how Spring, React, etc. work              │
│ ✅ INTERVIEW SUCCESS: Ace OOP design interview rounds                      │
│ ✅ COMMUNICATION: Discuss design precisely with team                        │
│ ✅ ARCHITECTURE THINKING: Design systems, not just features                 │
│                                                                              │
│ THE TRANSFORMATION:                                                          │
│ FROM: "I'll figure out how to structure this code"                          │
│   TO: "This is a Strategy pattern problem, I know exactly how to design it"│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: CREATIONAL PATTERNS

## 1.1 Singleton Pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         SINGLETON PATTERN                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Ensures a class has ONLY ONE INSTANCE and provides a global point of access.│
│                                                                              │
│ ANALOGY: Government of a country                                             │
│ • There's only ONE government at a time                                      │
│ • Everyone accesses the SAME government                                     │
│ • Creating a second government causes chaos                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ • Database connections: Only one connection pool needed                     │
│ • Configuration: One config object shared across app                        │
│ • Logging: One logger instance for entire application                       │
│ • Cache: One cache instance to avoid inconsistency                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ When exactly one instance is needed                                      │
│ ✅ When global access is required                                           │
│ ✅ When instance is expensive to create                                     │
│ ❌ Don't use when you might need multiple instances later                   │
│ ❌ Don't use for everything (makes testing harder)                          │
└──────────────────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:

// 1. EAGER INITIALIZATION (Simple, Thread-safe)
public class Singleton {
    private static final Singleton INSTANCE = new Singleton();

    private Singleton() {} // Private constructor

    public static Singleton getInstance() {
        return INSTANCE;
    }
}

// 2. LAZY INITIALIZATION (Thread-safe with double-check locking)
public class Singleton {
    private static volatile Singleton instance;

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// 3. ENUM SINGLETON (Best approach - handles serialization)
public enum Singleton {
    INSTANCE;

    public void doSomething() {
        // business logic
    }
}

// Usage
Singleton.INSTANCE.doSomething();

REAL-WORLD EXAMPLE - Logger:

public class Logger {
    private static final Logger INSTANCE = new Logger();
    private PrintWriter writer;

    private Logger() {
        try {
            writer = new PrintWriter(new FileWriter("app.log", true));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static Logger getInstance() {
        return INSTANCE;
    }

    public synchronized void log(String message) {
        writer.println(LocalDateTime.now() + " - " + message);
        writer.flush();
    }
}

// Used anywhere in application
Logger.getInstance().log("User logged in");
Logger.getInstance().log("Order placed");
```

## 1.2 Factory Pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         FACTORY PATTERN                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Creates objects WITHOUT exposing the creation logic to the client.          │
│ Refers to the newly created object through a common interface.              │
│                                                                              │
│ ANALOGY: Pizza Restaurant                                                    │
│ • You order "Margherita" → Kitchen creates it (you don't know how)         │
│ • You order "Pepperoni" → Kitchen creates it (different recipe)            │
│ • You just ask for a type, factory handles the creation                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ WITHOUT FACTORY:                                                             │
│ if (type.equals("dog")) animal = new Dog();                                 │
│ else if (type.equals("cat")) animal = new Cat();                            │
│ // This code is scattered everywhere!                                       │
│                                                                              │
│ WITH FACTORY:                                                                │
│ Animal animal = AnimalFactory.create(type);                                 │
│ // Creation logic in ONE place!                                             │
└──────────────────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:

// Product interface
public interface Notification {
    void send(String message);
}

// Concrete products
public class EmailNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("Email: " + message);
    }
}

public class SMSNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("SMS: " + message);
    }
}

public class PushNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("Push: " + message);
    }
}

// Factory
public class NotificationFactory {
    public static Notification createNotification(String type) {
        switch (type.toLowerCase()) {
            case "email": return new EmailNotification();
            case "sms": return new SMSNotification();
            case "push": return new PushNotification();
            default: throw new IllegalArgumentException("Unknown type: " + type);
        }
    }
}

// Usage
Notification notification = NotificationFactory.createNotification("email");
notification.send("Hello!");

// Adding new types is easy - just modify factory!

REAL-WORLD EXAMPLE - Document Parser:

public interface DocumentParser {
    Document parse(String content);
}

public class PDFParser implements DocumentParser { ... }
public class WordParser implements DocumentParser { ... }
public class ExcelParser implements DocumentParser { ... }

public class DocumentParserFactory {
    public static DocumentParser getParser(String fileExtension) {
        switch (fileExtension.toLowerCase()) {
            case "pdf": return new PDFParser();
            case "docx": return new WordParser();
            case "xlsx": return new ExcelParser();
            default: throw new UnsupportedOperationException();
        }
    }
}

// Usage
DocumentParser parser = DocumentParserFactory.getParser("pdf");
Document doc = parser.parse(content);
```

## 1.3 Builder Pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         BUILDER PATTERN                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Separates the construction of a complex object from its representation.     │
│ Allows step-by-step construction with fluent interface.                     │
│                                                                              │
│ ANALOGY: Building a Custom Burger                                            │
│ • Start with bun                                                             │
│ • Add patty (or multiple)                                                   │
│ • Add cheese (optional)                                                      │
│ • Add vegetables (optional)                                                  │
│ • Add sauces (optional)                                                      │
│ • Build final burger                                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ WITHOUT BUILDER (Telescoping constructor anti-pattern):                      │
│ new User(name, email, phone, address, age, null, null, null, null, true);   │
│ // What are all these nulls? Confusing and error-prone!                     │
│                                                                              │
│ WITH BUILDER:                                                                │
│ User.builder()                                                               │
│     .name("John")                                                            │
│     .email("john@email.com")                                                │
│     .age(25)                                                                 │
│     .build();                                                                │
│ // Clear, readable, flexible!                                               │
└──────────────────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:

public class User {
    // Required fields
    private final String name;
    private final String email;

    // Optional fields
    private final String phone;
    private final String address;
    private final int age;
    private final boolean verified;

    private User(UserBuilder builder) {
        this.name = builder.name;
        this.email = builder.email;
        this.phone = builder.phone;
        this.address = builder.address;
        this.age = builder.age;
        this.verified = builder.verified;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        // Required
        private String name;
        private String email;

        // Optional with defaults
        private String phone = "";
        private String address = "";
        private int age = 0;
        private boolean verified = false;

        public UserBuilder name(String name) {
            this.name = name;
            return this;
        }

        public UserBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public UserBuilder address(String address) {
            this.address = address;
            return this;
        }

        public UserBuilder age(int age) {
            this.age = age;
            return this;
        }

        public UserBuilder verified(boolean verified) {
            this.verified = verified;
            return this;
        }

        public User build() {
            // Validation
            if (name == null || email == null) {
                throw new IllegalStateException("Name and email are required");
            }
            return new User(this);
        }
    }
}

// Usage - Beautiful and clear!
User user = User.builder()
    .name("John Doe")
    .email("john@example.com")
    .phone("+1234567890")
    .age(30)
    .verified(true)
    .build();

REAL-WORLD: StringBuilder, HttpRequest.Builder, AlertDialog.Builder
```

---

# PART 2: STRUCTURAL PATTERNS

## 2.1 Adapter Pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         ADAPTER PATTERN                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Allows incompatible interfaces to work together by wrapping an object      │
│ with an adapter that translates calls.                                      │
│                                                                              │
│ ANALOGY: Power Adapter                                                       │
│ • US plug (110V) → Adapter → European socket (220V)                        │
│ • The adapter makes incompatible things work together                       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ • Legacy code integration                                                    │
│ • Third-party library integration                                            │
│ • Working with different data formats                                       │
└──────────────────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:

// Your application expects this interface
public interface MediaPlayer {
    void play(String filename);
}

// Legacy library has different interface
public class LegacyMusicPlayer {
    public void playMusic(String file, String format) {
        System.out.println("Playing " + format + ": " + file);
    }
}

// Adapter makes legacy work with your interface
public class MusicPlayerAdapter implements MediaPlayer {
    private LegacyMusicPlayer legacyPlayer;

    public MusicPlayerAdapter(LegacyMusicPlayer legacyPlayer) {
        this.legacyPlayer = legacyPlayer;
    }

    @Override
    public void play(String filename) {
        String format = getFormat(filename);
        legacyPlayer.playMusic(filename, format);
    }

    private String getFormat(String filename) {
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}

// Usage
MediaPlayer player = new MusicPlayerAdapter(new LegacyMusicPlayer());
player.play("song.mp3"); // Works!

REAL-WORLD: Arrays.asList(), InputStreamReader
```

## 2.2 Decorator Pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         DECORATOR PATTERN                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Attaches additional responsibilities to an object DYNAMICALLY.              │
│ Provides flexible alternative to subclassing for extending functionality.   │
│                                                                              │
│ ANALOGY: Coffee Shop                                                         │
│ • Base: Plain Coffee ($2)                                                   │
│ • Add Milk decorator: +$0.50                                                │
│ • Add Sugar decorator: +$0.25                                               │
│ • Add Whip decorator: +$0.75                                                │
│ • Total: $3.50 (same coffee, enhanced!)                                    │
└──────────────────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:

// Component interface
public interface Coffee {
    double getCost();
    String getDescription();
}

// Concrete component
public class SimpleCoffee implements Coffee {
    @Override
    public double getCost() { return 2.0; }

    @Override
    public String getDescription() { return "Simple Coffee"; }
}

// Base decorator
public abstract class CoffeeDecorator implements Coffee {
    protected Coffee coffee;

    public CoffeeDecorator(Coffee coffee) {
        this.coffee = coffee;
    }
}

// Concrete decorators
public class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) {
        super(coffee);
    }

    @Override
    public double getCost() {
        return coffee.getCost() + 0.50;
    }

    @Override
    public String getDescription() {
        return coffee.getDescription() + ", Milk";
    }
}

public class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) {
        super(coffee);
    }

    @Override
    public double getCost() {
        return coffee.getCost() + 0.25;
    }

    @Override
    public String getDescription() {
        return coffee.getDescription() + ", Sugar";
    }
}

// Usage - Stack decorators!
Coffee coffee = new SimpleCoffee();
coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);
coffee = new SugarDecorator(coffee); // Double sugar!

System.out.println(coffee.getDescription()); // Simple Coffee, Milk, Sugar, Sugar
System.out.println(coffee.getCost());        // 3.0

REAL-WORLD: BufferedInputStream, Collections.synchronizedList()
```

## 2.3 Facade Pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         FACADE PATTERN                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Provides a SIMPLIFIED INTERFACE to a complex subsystem.                     │
│ Hides complexity behind a simple API.                                       │
│                                                                              │
│ ANALOGY: Universal Remote                                                    │
│ • TV, Sound System, DVD Player, Lights - all complex                        │
│ • Remote has one button: "Watch Movie"                                      │
│ • Behind scenes: dims lights, turns on TV, selects HDMI, starts player     │
└──────────────────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:

// Complex subsystem classes
public class DVDPlayer {
    public void on() { System.out.println("DVD Player ON"); }
    public void play(String movie) { System.out.println("Playing: " + movie); }
    public void off() { System.out.println("DVD Player OFF"); }
}

public class Projector {
    public void on() { System.out.println("Projector ON"); }
    public void setInput(String input) { System.out.println("Input: " + input); }
    public void off() { System.out.println("Projector OFF"); }
}

public class SoundSystem {
    public void on() { System.out.println("Sound ON"); }
    public void setVolume(int level) { System.out.println("Volume: " + level); }
    public void off() { System.out.println("Sound OFF"); }
}

public class Lights {
    public void dim(int level) { System.out.println("Lights at " + level + "%"); }
}

// FACADE - Simple interface
public class HomeTheaterFacade {
    private DVDPlayer dvd;
    private Projector projector;
    private SoundSystem sound;
    private Lights lights;

    public HomeTheaterFacade(DVDPlayer dvd, Projector projector,
                             SoundSystem sound, Lights lights) {
        this.dvd = dvd;
        this.projector = projector;
        this.sound = sound;
        this.lights = lights;
    }

    // ONE simple method for complex operation
    public void watchMovie(String movie) {
        System.out.println("=== Starting Movie Night ===");
        lights.dim(10);
        projector.on();
        projector.setInput("DVD");
        sound.on();
        sound.setVolume(50);
        dvd.on();
        dvd.play(movie);
    }

    public void endMovie() {
        System.out.println("=== Ending Movie Night ===");
        dvd.off();
        sound.off();
        projector.off();
        lights.dim(100);
    }
}

// Usage - So simple!
HomeTheaterFacade theater = new HomeTheaterFacade(dvd, projector, sound, lights);
theater.watchMovie("Inception"); // One call does everything!
theater.endMovie();

REAL-WORLD: JDBC (hides database complexity), SLF4J (hides logging frameworks)
```

---

# PART 3: BEHAVIORAL PATTERNS

## 3.1 Observer Pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         OBSERVER PATTERN                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Defines a one-to-many dependency between objects so that when one object   │
│ changes state, all dependents are notified and updated automatically.       │
│                                                                              │
│ ANALOGY: Newsletter Subscription                                             │
│ • You subscribe to a newsletter                                              │
│ • When new content is published, all subscribers get notified               │
│ • Subscribers can unsubscribe anytime                                       │
└──────────────────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:

// Observer interface
public interface Observer {
    void update(String message);
}

// Subject interface
public interface Subject {
    void subscribe(Observer observer);
    void unsubscribe(Observer observer);
    void notifyObservers();
}

// Concrete Subject
public class NewsPublisher implements Subject {
    private List<Observer> observers = new ArrayList<>();
    private String latestNews;

    @Override
    public void subscribe(Observer observer) {
        observers.add(observer);
    }

    @Override
    public void unsubscribe(Observer observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyObservers() {
        for (Observer observer : observers) {
            observer.update(latestNews);
        }
    }

    public void publishNews(String news) {
        this.latestNews = news;
        notifyObservers(); // Automatically notify all!
    }
}

// Concrete Observers
public class EmailSubscriber implements Observer {
    private String email;

    public EmailSubscriber(String email) {
        this.email = email;
    }

    @Override
    public void update(String message) {
        System.out.println("Email to " + email + ": " + message);
    }
}

public class AppSubscriber implements Observer {
    private String userId;

    public AppSubscriber(String userId) {
        this.userId = userId;
    }

    @Override
    public void update(String message) {
        System.out.println("Push notification to " + userId + ": " + message);
    }
}

// Usage
NewsPublisher publisher = new NewsPublisher();

Observer email1 = new EmailSubscriber("john@email.com");
Observer email2 = new EmailSubscriber("jane@email.com");
Observer app1 = new AppSubscriber("user123");

publisher.subscribe(email1);
publisher.subscribe(email2);
publisher.subscribe(app1);

publisher.publishNews("Breaking: New Java version released!");
// All three get notified automatically!

REAL-WORLD: Event listeners, React state updates, RxJava
```

## 3.2 Strategy Pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         STRATEGY PATTERN                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Defines a family of algorithms, encapsulates each one, and makes them      │
│ interchangeable. Lets the algorithm vary independently from clients.        │
│                                                                              │
│ ANALOGY: Navigation App                                                      │
│ • Same destination, different strategies: Car, Walk, Bike, Transit          │
│ • You choose the strategy, app calculates route using that strategy        │
│ • Strategies are interchangeable                                            │
└──────────────────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:

// Strategy interface
public interface PaymentStrategy {
    void pay(double amount);
}

// Concrete strategies
public class CreditCardPayment implements PaymentStrategy {
    private String cardNumber;

    public CreditCardPayment(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    @Override
    public void pay(double amount) {
        System.out.println("Paid $" + amount + " with Credit Card: " + cardNumber);
    }
}

public class PayPalPayment implements PaymentStrategy {
    private String email;

    public PayPalPayment(String email) {
        this.email = email;
    }

    @Override
    public void pay(double amount) {
        System.out.println("Paid $" + amount + " via PayPal: " + email);
    }
}

public class CryptoPayment implements PaymentStrategy {
    private String walletAddress;

    public CryptoPayment(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    @Override
    public void pay(double amount) {
        System.out.println("Paid $" + amount + " in Crypto to: " + walletAddress);
    }
}

// Context
public class ShoppingCart {
    private List<Item> items = new ArrayList<>();
    private PaymentStrategy paymentStrategy;

    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.paymentStrategy = strategy;
    }

    public void checkout() {
        double total = calculateTotal();
        paymentStrategy.pay(total); // Uses whatever strategy is set
    }

    private double calculateTotal() {
        return items.stream().mapToDouble(Item::getPrice).sum();
    }
}

// Usage - Strategy can be changed at runtime!
ShoppingCart cart = new ShoppingCart();
cart.addItem(new Item("Laptop", 999.99));

// User chooses Credit Card
cart.setPaymentStrategy(new CreditCardPayment("4111111111111111"));
cart.checkout();

// User changes mind, wants PayPal
cart.setPaymentStrategy(new PayPalPayment("user@email.com"));
cart.checkout();

REAL-WORLD: Sorting algorithms (Collections.sort with Comparator), Compression
```

## 3.3 Command Pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         COMMAND PATTERN                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Encapsulates a request as an object, allowing you to parameterize clients, │
│ queue requests, log operations, and support undo/redo.                      │
│                                                                              │
│ ANALOGY: Restaurant Order                                                    │
│ • Waiter writes order on paper (Command object)                             │
│ • Takes it to kitchen (passes to invoker)                                   │
│ • Chef executes the order (receiver)                                        │
│ • Order can be queued, logged, undone                                       │
└──────────────────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:

// Command interface
public interface Command {
    void execute();
    void undo();
}

// Receiver
public class TextEditor {
    private StringBuilder content = new StringBuilder();

    public void write(String text) {
        content.append(text);
    }

    public void delete(int length) {
        content.delete(content.length() - length, content.length());
    }

    public String getContent() {
        return content.toString();
    }
}

// Concrete Commands
public class WriteCommand implements Command {
    private TextEditor editor;
    private String text;

    public WriteCommand(TextEditor editor, String text) {
        this.editor = editor;
        this.text = text;
    }

    @Override
    public void execute() {
        editor.write(text);
    }

    @Override
    public void undo() {
        editor.delete(text.length());
    }
}

// Invoker with history (for undo/redo)
public class CommandHistory {
    private Stack<Command> history = new Stack<>();
    private Stack<Command> redoStack = new Stack<>();

    public void executeCommand(Command command) {
        command.execute();
        history.push(command);
        redoStack.clear(); // Clear redo when new command is executed
    }

    public void undo() {
        if (!history.isEmpty()) {
            Command command = history.pop();
            command.undo();
            redoStack.push(command);
        }
    }

    public void redo() {
        if (!redoStack.isEmpty()) {
            Command command = redoStack.pop();
            command.execute();
            history.push(command);
        }
    }
}

// Usage
TextEditor editor = new TextEditor();
CommandHistory history = new CommandHistory();

history.executeCommand(new WriteCommand(editor, "Hello "));
history.executeCommand(new WriteCommand(editor, "World!"));
System.out.println(editor.getContent()); // "Hello World!"

history.undo();
System.out.println(editor.getContent()); // "Hello "

history.redo();
System.out.println(editor.getContent()); // "Hello World!"

REAL-WORLD: Text editors (undo/redo), Task schedulers, Transaction systems
```

---

# PART 4: PATTERN COMBINATIONS

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              COMBINING PATTERNS FOR COMPLEX SOLUTIONS                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

EXAMPLE: E-commerce Order System using Multiple Patterns

┌─────────────────────────────────────────────────────────────────────────────┐
│ PATTERNS USED:                                                              │
│ • Singleton: Configuration, Database connection                             │
│ • Factory: Creating different order types                                   │
│ • Builder: Building complex Order objects                                   │
│ • Observer: Notifying systems when order status changes                     │
│ • Strategy: Different payment methods                                       │
│ • Decorator: Adding features to orders (gift wrap, insurance)               │
└─────────────────────────────────────────────────────────────────────────────┘

// 1. SINGLETON - Configuration
public enum AppConfig {
    INSTANCE;
    public String getDatabaseUrl() { return "jdbc:mysql://..."; }
}

// 2. BUILDER - Complex Order Creation
public class Order {
    public static class Builder {
        private List<OrderItem> items = new ArrayList<>();
        private Address shippingAddress;
        private PaymentStrategy paymentStrategy;
        // ... builder methods
    }
}

// 3. FACTORY - Order Types
public class OrderFactory {
    public static Order createOrder(String type, Order.Builder builder) {
        switch (type) {
            case "regular": return builder.build();
            case "express": return new ExpressOrder(builder);
            case "subscription": return new SubscriptionOrder(builder);
        }
    }
}

// 4. OBSERVER - Order Status Updates
public class Order implements Subject {
    private List<OrderObserver> observers = new ArrayList<>();

    public void setStatus(OrderStatus status) {
        this.status = status;
        notifyObservers(); // Notify inventory, shipping, customer
    }
}

// 5. STRATEGY - Payment
public class Order {
    private PaymentStrategy paymentStrategy;

    public void processPayment() {
        paymentStrategy.pay(getTotal());
    }
}

// 6. DECORATOR - Add Features
public interface Order {
    double getTotal();
}

public class GiftWrapDecorator extends OrderDecorator {
    @Override
    public double getTotal() {
        return order.getTotal() + 5.99; // Gift wrap cost
    }
}

// USAGE - All patterns working together!
Order order = OrderFactory.createOrder("express",
    Order.builder()
        .addItem(new OrderItem("Laptop", 999))
        .shippingAddress(address)
        .paymentStrategy(new CreditCardPayment(card))
        .build());

order.subscribe(new InventoryService());
order.subscribe(new NotificationService());

order = new GiftWrapDecorator(order); // Add gift wrap
order = new InsuranceDecorator(order); // Add insurance

order.processPayment(); // Uses strategy
order.setStatus(OrderStatus.PAID); // Notifies observers
```

---

# PART 5: QUICK REFERENCE TABLE

```
╔════════════════╦═══════════════════════════════════════════════════════════════╗
║   PATTERN      ║   USE WHEN                                                    ║
╠════════════════╬═══════════════════════════════════════════════════════════════╣
║ Singleton      ║ Need exactly one instance (config, logger, connection pool)  ║
║ Factory        ║ Create objects without specifying exact class                ║
║ Builder        ║ Complex object with many optional parameters                 ║
║ Adapter        ║ Make incompatible interfaces work together                   ║
║ Decorator      ║ Add behavior dynamically without changing original           ║
║ Facade         ║ Simplify complex subsystem with single interface             ║
║ Observer       ║ One-to-many notification when state changes                  ║
║ Strategy       ║ Swap algorithms at runtime                                   ║
║ Command        ║ Need undo/redo, queue operations, log operations             ║
║ State          ║ Object behavior depends on its state                         ║
║ Template       ║ Define algorithm skeleton, let subclasses fill steps         ║
║ Composite      ║ Tree structure of objects (file system, UI components)       ║
║ Proxy          ║ Control access, lazy loading, caching                        ║
╚════════════════╩═══════════════════════════════════════════════════════════════╝
```

---

# CURATED PRACTICE PROBLEMS — OOP & DESIGN PATTERNS

> **HOW TO USE**: These are system design / OOP implementation problems.
> Section 1 = implement data structures using OOP. Section 2 = apply design patterns.
> Section 3 = LeetCode design class problems.

---

## Section 1: OOP Implementation — Build From Scratch

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Design HashMap (LC 706) | LeetCode | Easy | Array of buckets + chaining |
| 2 | Design HashSet (LC 705) | LeetCode | Easy | Boolean bucket or linked list |
| 3 | Min Stack (LC 155) | LeetCode | Medium | Two stacks or store (val, min) pairs |
| 4 | Implement Queue using Stacks (LC 232) | LeetCode | Easy | Two stacks: push/pop inversion |
| 5 | Implement Stack using Queues (LC 225) | LeetCode | Easy | Push costly or pop costly |
| 6 | Design Linked List (LC 707) | LeetCode | Medium | Sentinel nodes, doubly linked |
| 7 | Design Circular Queue (LC 622) | LeetCode | Medium | Array with front/rear pointers |
| 8 | Design Circular Deque (LC 641) | LeetCode | Medium | Extend circular queue both ends |

---

## Section 2: Design Class Problems (Strategy/Observer/Iterator)

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | LRU Cache (LC 146) | LeetCode | Medium | HashMap + Doubly Linked List |
| 2 | LFU Cache (LC 460) | LeetCode | Hard | HashMap + frequency buckets |
| 3 | Iterator for Combination (LC 1286) | LeetCode | Medium | Iterator pattern, precompute or lazy |
| 4 | Flatten Nested List Iterator (LC 341) | LeetCode | Medium | Stack + recursive flatten |
| 5 | Peeking Iterator (LC 284) | LeetCode | Medium | Decorator pattern on iterator |
| 6 | Design Twitter (LC 355) | LeetCode | Medium | OOP: User, Tweet, Feed (merge k) |
| 7 | Design Browser History (LC 1472) | LeetCode | Medium | Command pattern / doubly linked |
| 8 | Design Underground System (LC 1396) | LeetCode | Medium | HashMap tracking check-in/out |

---

## Section 3: Advanced Design

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Serialize and Deserialize Binary Tree (LC 297) | LeetCode | Hard | Preorder + null markers |
| 2 | Design Add and Search Words (LC 211) | LeetCode | Medium | Trie + DFS for wildcard |
| 3 | Implement Trie (LC 208) | LeetCode | Medium | Array[26] children nodes |
| 4 | Design File System (LC 1166) | LeetCode | Medium | Trie or HashMap of paths |
| 5 | Design Hit Counter (LC 362) | LeetCode | Medium | Queue or circular buffer |
| 6 | Insert Delete GetRandom O(1) (LC 380) | LeetCode | Medium | ArrayList + HashMap swap trick |
| 7 | Find Median from Data Stream (LC 295) | LeetCode | Hard | Two heaps (maxHeap + minHeap) |

---

## HIDDEN GEMS — Design Problems

| # | Problem | Platform | Why It's Valuable |
|---|---------|----------|-------------------|
| 1 | Design Parking System (LC 1603) | LeetCode | Simplest OOP design — good warm-up |
| 2 | Design an Ordered Stream (LC 1656) | LeetCode | Pointer advancement pattern |
| 3 | Snapshot Array (LC 1146) | LeetCode | Binary search on version history |
| 4 | Time Based Key-Value Store (LC 981) | LeetCode | TreeMap or binary search on timestamps |
| 5 | Online Stock Span (LC 901) | LeetCode | Monotonic stack as internal state |

---
