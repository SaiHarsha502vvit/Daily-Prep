# Design Patterns in Java — Gang of Four & Beyond

> **Navigation**: [← Design Patterns: Complete Guide…](02_Design_Patterns.md) | [Chapter index](00_INDEX.md) | [The Remaining GoF Patterns… →](12_Remaining_GoF_Patterns.md)

## Why Learn Design Patterns?

Design patterns are PROVEN SOLUTIONS to RECURRING PROBLEMS.

- Without patterns: "I'll figure out a way to do this..."
- With patterns: "This is a Strategy problem — I know exactly how to structure this."

Interview Reality: "Can you give me an example of [Pattern]?"
→ Expected for mid-level and above

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Design Patterns](02_Design_Patterns.md), [Modern Java](../07_Modern_Java/00_INDEX.md) (lambdas, records, sealed types) |
| **You will learn** | Java implementations of the GoF patterns, JDK and Spring examples, and where modern Java replaces a pattern |
| **Leads to** | [Design Heuristics](11_Design_Heuristics.md), [Domain-Driven Design](09_Domain_Driven_Design_Essentials.md) |
| **Abstraction level** | Pattern concepts → **idiomatic Java code** → **knowing which patterns the language has absorbed** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Design Patterns in Java

### 1. The bottom line

Use the lightest Java construct that expresses the force: a lambda, a record or a sealed interface before a class hierarchy.

### 2. The textbook core

- Strategy, Command and Template Method often reduce to functional interfaces.
- Builder is mainly for many optional parameters; records cover plain data.
- Sealed interfaces plus pattern-matching switch often replace Visitor.
- Enum Singleton is the safe hand-written form; in applications prefer container-managed scope.
- The JDK itself demonstrates patterns (Iterator, Decorator in `java.io`, Flyweight in `Integer.valueOf`).

### 3. The real-world analogy

Choosing between a **Swiss-army knife and a drawer of tools**: a lambda is the small blade, a class hierarchy is the toolbox.

### 4. Walkthrough

1. Need to swap sorting rules: pass a `Comparator`.
2. Need an object with many optional fields: Builder.
3. Need a closed set of cases: sealed interface plus `switch`.
4. Need exactly one instance in a framework-free library: enum Singleton.
5. Need to wrap behaviour (logging, caching): Decorator or Proxy.

> [!NOTE]
> **Quick check:** When does a lambda replace Strategy? *When the strategy has one operation and no state.*

### 5. Check yourself

**Q1.** Why is double-checked locking without `volatile` broken?

<details><summary>Answer</summary>

Another thread may see a non-null reference to a partially constructed object because of instruction reordering.

</details>

**Q2.** Which language feature often replaces the Visitor pattern in Java 21?

<details><summary>Answer</summary>

Sealed interfaces with pattern-matching `switch`, which gives exhaustive checking at compile time.

</details>

---


🔬 **Section Challenge — Why Learn Design Patterns?**

**Challenge 1 (Reasoning):** A junior developer says "I don't need patterns, I can just write code that works." Using Who/When/What: **Who** benefits from patterns? **When** does the benefit become apparent? **What** is the cost of NOT using patterns at scale?

<details><summary>Answer</summary>

**Who?** The entire team, not just the author. Patterns create a shared vocabulary — saying "this is a Strategy" instantly communicates architecture to any developer who knows patterns. **When?** Benefits compound over time: (1) during code review ("is this a Decorator or Proxy?"), (2) during onboarding (new devs recognize patterns), (3) during maintenance (6 months later, you recognize your own structure). **What's the cost without them?** Ad-hoc solutions become "tribal knowledge." Each developer invents their own approach to the same problems. The codebase becomes a museum of different styles. Bug fixes in one approach don't transfer to others. Patterns are the difference between a codebase that scales with team size and one that collapses under it.

</details>

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Pattern Categories Overview](08_Design_Patterns_Java/01_categories_overview.md) | Pattern Categories Overview · Creational Patterns | 246 |
| 2 | [Structural Patterns](08_Design_Patterns_Java/02_structural_patterns.md) | Structural Patterns | 252 |
| 3 | [Behavioral Patterns](08_Design_Patterns_Java/03_behavioral_patterns.md) | Behavioral Patterns · Patterns in Spring Boot — Where You Already… · Pattern Selection Guide · Interview Quick-Fire · Mental Model: Patterns as Communication · … | 738 |
| 4 | [Why-This-Not-That: Builder vs Constructor Telescoping](08_Design_Patterns_Java/04_why_this_not_that_builder_vs.md) | Why-This-Not-That: Builder vs Constructor… · Breadth Comparison 1: Creational Pattern… · Breadth Comparison 2: Structural Pattern… · Production Reality | 296 |

## 🏢 Enterprise Lens — Design Patterns in Java

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | JDK, Spring (templates, proxies, events), libraries and SDKs |
| **Failure modes** | Double-checked locking without `volatile`; Singleton as global state; unnecessary class hierarchies |
| **Testing and verification** | Unit-test each variation through its interface; thread-safety tests for shared instances |

---

## Reality Check

**"Java pattern implementations are the GoF book translated"** — Modern Java ABSORBED half the catalog into language and library: Strategy is a Function or Comparator parameter, Observer is listeners/reactive streams, Template Method competes with lambda-parameterized methods, Decorator lives in java.io and Collections wrappers, and Builder collapses into records for pure data (surviving only for many-optional-argument construction). Writing 1994-shaped class hierarchies where a lambda suffices is the number-one signal of book-learned rather than practiced Java.

**"The JDK uses patterns as textbook examples"** — The JDK is a pattern MUSEUM with honest exhibit labels: Integer.valueOf is Flyweight (the -128..127 cache — the same cache behind the boxed-equality trap), Collections.unmodifiableList is a protection Proxy whose view semantics (underlying changes show through) surprise people, Runtime.getRuntime is Singleton, Iterator is everywhere, and Stream pipelines are Builder-plus-lazy-Interpreter. Reading these as pattern instances with their JDK-specific quirks teaches more than any invented Shape hierarchy.

**"Enum singletons are a Java trivia answer"** — The enum form solves the two attacks the classic forms lose to — serialization creating a second instance (readResolve forgotten) and reflective constructor access — because the JVM guarantees enum constant uniqueness through both. But the modern context matters more: in DI-managed applications, container-scoped beans replace hand-rolled singletons entirely, and the enum trick remains relevant mainly for framework-free libraries. Knowing both the trick AND its shrinking habitat is the senior answer.

**"Spring uses patterns internally, which is implementation detail"** — Spring's programming MODEL is patterns you configure: proxies wrap your beans (which is why self-invocation skips transactions — the Proxy pattern's mechanics becoming a production bug), BeanFactory/FactoryBean are Factory at two levels, template classes (JdbcTemplate, RestTemplate) are Template Method inverted through callbacks, and the entire event system is Observer. Debugging Spring without pattern literacy means debugging effects without models; half of the famous Spring gotchas are pattern mechanics showing through.

**"Pattern knowledge in Java is tested by implementing them"** — Production and senior interviews test pattern JUDGMENT in Java's specific constraint field: when sealed interfaces plus pattern-matching switches beat Visitor (almost always now), when records kill Builder, when composition via default methods replaces skeletal-implementation inheritance, when a ConcurrentHashMap of lambdas replaces a Strategy registry. The Java-flavored question is never "implement Observer" — it is "this listener list is leaking memory; why?" (anonymous inner classes holding outer references — pattern mechanics meeting GC reality).
