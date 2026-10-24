# 🎨 Part 2: Structural Patterns

> **Navigation**: [← Creational Patterns](02_creational_patterns.md) | [Chapter overview](../02_Design_Patterns.md) | [Behavioral Patterns →](04_behavioral_patterns.md)
> Page 3 of 4 in **Design Patterns: Complete Guide from Scratch**


## 2.1 Adapter Pattern

### 5W1H: Deep Understanding

```
WHAT: Converts one interface into another that a client expects.
      Makes incompatible interfaces work together by wrapping.

WHY:  In real projects, you integrate third-party libraries,
      legacy systems, or APIs with interfaces YOU can't change.
      The Adapter translates between your interface and theirs.

ANALOGY — POWER ADAPTER:
  US plug (110V, flat pins) can't fit European socket (220V, round pins).
  An adapter sits between them, translating the connection.
  The plug doesn't change. The socket doesn't change.
  The ADAPTER makes them compatible.

HOW IT WORKS INTERNALLY:
  1. You have a TARGET interface (what your code expects)
  2. You have an ADAPTEE class (incompatible third-party code)
  3. You create an ADAPTER that: implements TARGET, wraps ADAPTEE
  4. Adapter translates method calls from TARGET → ADAPTEE

REAL-WORLD EXAMPLES:
  • Arrays.asList() — adapts array to List interface
  • InputStreamReader — adapts InputStream (bytes) to Reader (chars)
  • Spring's HandlerAdapter — adapts different controller types
  • JDBC Driver — adapts database-specific protocol to JDBC API
```

💡 **ANALOGY: Travel Power Adapter**

- US plug (110V) → Adapter → European socket (220V)
- The adapter makes incompatible things work together

🔬 **Section Challenge — 2.1 Adapter Pattern**

**Challenge 1 (Design — Who/When/What):** The real-world examples list `Arrays.asList()` as an Adapter. **Who** is the adaptee? **What** interface does it adapt TO? **What** surprising limitation does this specific adapter have?

<details><summary>Answer</summary>

**Adaptee:** A raw Java array (`T[]`). **Adapts to:** `List<T>` interface. **Limitation:** The returned List is a FIXED-SIZE wrapper — it's backed by the original array. `list.add("new")` throws `UnsupportedOperationException`. `list.set(0, "updated")` works (modifies the original array). This is a classic adapter trade-off: it makes the array LOOK like a List, but doesn't give you ALL List behaviors. The adapter's contract is "interface compatibility", not "full functionality."

</details>

## 2.2 Decorator Pattern

### 5W1H: Deep Understanding

```
WHAT: Attaches additional responsibilities to an object DYNAMICALLY.
      Provides flexible alternative to subclassing.

WHY:  Subclassing creates a COMBINATORIAL EXPLOSION.
      If you have 3 features (milk, sugar, whip cream) for coffee:
      CoffeeWithMilk, CoffeeWithSugar, CoffeeWithMilkAndSugar,
      CoffeeWithMilkAndWhip, CoffeeWithSugarAndWhip,
      CoffeeWithMilkAndSugarAndWhip... = 7 subclasses!
      Each new feature DOUBLES the number of classes.

      Decorators compose features at RUNTIME:
      new WhipDecorator(new SugarDecorator(new MilkDecorator(coffee)))
      Add/remove features without creating new classes.

HOW IT WORKS INTERNALLY:
  1. Decorator implements the SAME interface as the wrapped object
  2. Decorator holds a REFERENCE to the wrapped object
  3. Decorator DELEGATES to the wrapped object for base behavior
  4. Decorator adds its OWN behavior before/after delegation
  5. Decorators can be STACKED (decorator wrapping decorator)

ANALOGY — COFFEE SHOP:
  Base: Plain Coffee ($2)
  + MilkDecorator: delegates to coffee.cost() + $0.50
  + SugarDecorator: delegates to milk.cost() + $0.25
  Total: Sugar calls Milk calls Coffee = $2 + $0.50 + $0.25 = $2.75

REAL-WORLD:
  • Java I/O: BufferedReader(InputStreamReader(FileInputStream(file)))
    Three decorators wrapping each other!
  • Spring: @Transactional = TransactionInterceptor DECORATING your service
  • Collections.unmodifiableList() = decorator that throws on modification
```

🔬 **Section Challenge — 2.2 Decorator Pattern**

**Challenge 1 (Design — Who/When/What):** The code shows `EncryptionDecorator` and `CompressionDecorator` wrapping `FileDataSource`. **Why** not just use inheritance: `EncryptedCompressedFileDataSource extends FileDataSource`? **When** does Decorator beat inheritance?

<details><summary>Answer</summary>

**Inheritance explosion:** With 3 features (encrypt, compress, cache), inheritance needs 2³ = 8 classes: `EncryptedFile`, `CompressedFile`, `CachedFile`, `EncryptedCompressedFile`, `EncryptedCachedFile`... Adding a 4th feature → 16 classes. **Decorator:** 4 decorator classes, composed in any combination at RUNTIME. `new CacheDecorator(new EncryptionDecorator(source))` — no new classes needed. **When Decorator wins:** When behaviors are optional, combinable, and need to be applied/removed dynamically. **When Inheritance wins:** When the relationship IS-A (a Dog IS an Animal) and the behavior is fixed at compile time.

</details>

## 2.3 Facade Pattern

### 5W1H: Deep Understanding

```
WHAT: Provides a SIMPLIFIED INTERFACE to a complex subsystem.
      Hides complexity behind a simple API.

WHY:  Complex systems have dozens of classes that interact.
      A client shouldn't need to understand ALL of them.
      Facade provides a SINGLE entry point.

ANALOGY — UNIVERSAL REMOTE:
  TV: power(), selectInput(), setVolume(), setBrightness()
  SoundSystem: power(), setEqualizer(), selectSource()
  BluRayPlayer: power(), insertDisc(), play()
  Lights: dim(), setColor()

  Facade (Remote "Watch Movie" button):
  watchMovie() { lights.dim(); tv.power(); soundSystem.power();
                 tv.selectInput(HDMI); bluray.play(); }

  One call replaces 6 calls. Client doesn't know the subsystem.

REAL-WORLD:
  • Spring Boot itself is a Facade over Spring Framework!
    One annotation @SpringBootApplication hides:
    @Configuration + @EnableAutoConfiguration + @ComponentScan
  • SLF4J is a Facade over various logging frameworks
  • JDBC is a Facade over database-specific protocols
```

---

🔬 **Section Challenge — 2.3 Facade Pattern**

**Challenge 1 (Reasoning — Who/When/What):** Spring Boot is called a "Facade over Spring Framework." **Who** is hidden behind the facade? **What** does `@SpringBootApplication` actually do under the hood?

<details><summary>Answer</summary>

**Who is hidden?** Three complex subsystems: (1) `@Configuration` — marks class as a bean definition source, (2) `@EnableAutoConfiguration` — triggers Spring Boot's auto-configuration based on classpath, (3) `@ComponentScan` — scans for `@Component`/`@Service`/`@Repository` in the package tree. **What does it do?** One annotation replaces 3 annotations + XML config + manual bean registration. The developer just writes `@SpringBootApplication` (one facade call) instead of understanding the 3 subsystems individually.

</details>

---

[← Creational Patterns](02_creational_patterns.md) | [Chapter overview](../02_Design_Patterns.md) | [Behavioral Patterns →](04_behavioral_patterns.md)
