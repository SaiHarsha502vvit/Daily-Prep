# CSE102 — Programming Fundamentals

## Semester 1 · Foundations

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can write clean Java programs that compile cleanly, pass tests, and use the standard library idiomatically. You can transition between Java and TypeScript reading code in either without mentally translating.
> **Capstone:** Build a CLI-based command system (e.g., a personal expense tracker, mini SQL evaluator, or quiz engine) in Java with 80%+ test coverage. Re-implement core logic in TypeScript.

---

## Navigation

| Course                                                                              | Description |
| ----------------------------------------------------------------------------------- | ----------- |
| **[CSE101 — Discrete Mathematics](../CSE101_Discrete_Mathematics/README.md)**       | S01 sibling |
| **CSE102 — Programming Fundamentals**                                               | This course |
| **[CSE103 — Linear Algebra](../CSE103_Linear_Algebra/README.md)**                   | S01 sibling |
| **[CSE104 — Introduction to Computer Systems](../CSE104_Computer_Systems/README.md)** | S01 sibling |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `07_Modern_Java/`                          | Primary source — Chapters 1-14                                 |
| `17_TypeScript/`                           | TS counterpart — Foundations and Advanced Types               |
| `16_JavaScript/`                           | JS underlies TS — start here for runtime mental model         |
| `02_Data_Structures/`                      | Used in CSE201 next semester — touched at end of this course   |

---

## Prerequisites

- None — this is the foundation course
- Comfort using a text editor or IDE (VS Code or IntelliJ Community)
- A working dev environment: JDK 21+, Maven or Gradle, Node 20+

**Constraint:** This course covers SYNTAX and SEMANTICS. Algorithm design lives in CSE201/CSE202. If you find yourself reaching for "what's the right algorithm" here, you're skipping ahead. Master Java fluency first — derivation of algorithms comes after.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Java Syntax & Control Flow (Weeks 1–3)

**Learning Outcomes:**

- Read and write Java programs with primitive types, operators, control flow
- Understand pass-by-value semantics (and why Java references behave the way they do)
- Use the standard library: String, Math, Collections, Streams

#### Week 1 — Hello World to Variables

`07_Modern_Java/Ch01_Java_Foundations.md` §1-3 — primitive vs reference types, autoboxing, String immutability.

#### Week 2 — Control Flow + Methods

`07_Modern_Java/Ch01_Java_Foundations.md` §4-6 — if/else, switch (modern switch expression), loops, methods, varargs.

#### Week 3 — Arrays + Strings

`07_Modern_Java/Ch01_Java_Foundations.md` §7-8 + `Ch02_Strings_Deep_Dive.md` — array semantics, StringBuilder vs String concatenation.

---

### UNIT 2 — Object-Oriented Java (Weeks 4–6)

#### Week 4 — Classes & Objects

`07_Modern_Java/Ch03_Classes_Objects.md` — constructor chaining, this/super, static vs instance.

#### Week 5 — Inheritance + Polymorphism

`07_Modern_Java/Ch04_Inheritance_Polymorphism.md` — extends, override rules, virtual dispatch, sealed classes.

**Section Challenge (pass-by-value):**

> Java is said to be "pass by value." Yet when you pass a `List<String> list` to a method that calls `list.add("foo")`, the caller's list IS modified. Explain WHY this is consistent with pass-by-value (it is!), and what experiment proves it.

<details>
<summary>Answer</summary>

```
JAVA IS PURELY PASS-BY-VALUE — for all parameter types.

THE CONFUSION: when you pass a `List<String> list` parameter, what
gets copied is the REFERENCE (the address), not the list itself.
The method gets its OWN copy of the reference, but the reference
POINTS TO THE SAME OBJECT in the heap.

list.add("foo") follows the reference to the heap object and mutates
it. Both the caller's reference and the method's reference point
to the now-mutated object. The caller sees the change because the
OBJECT is shared, not because the reference was shared.

THE EXPERIMENT — REASSIGNMENT INSIDE METHOD:

  void mutate(List<String> list) {
    list.add("foo");           // mutates the shared object
    list = new ArrayList<>();   // REASSIGNS the local reference
    list.add("bar");            // mutates a NEW object
  }

  List<String> outer = new ArrayList<>();
  mutate(outer);
  System.out.println(outer); // → ["foo"], NOT ["foo", "bar"]

PROOF:
  If Java were pass-by-REFERENCE, then `list = new ArrayList<>()`
  inside the method would replace the caller's `outer` reference,
  and outer would print ["bar"]. It doesn't.
  The method's `list` and the caller's `outer` are independent
  COPIES of the reference. The first add() mutated their shared
  target; the reassignment broke the link.

OTHER LANGUAGES FOR CONTRAST:
  - C++ has true pass-by-reference (T&). Reassignment inside the
    function reassigns the caller's variable.
  - JavaScript: same as Java (pass-by-value of references).
  - Python: same as Java (pass-by-value of object references).

PRINCIPLE TO REMEMBER:
  "Pass by value of the reference" is the precise phrase.
  This is why immutable objects (String, Integer, Optional) feel
  "safer" — even if a method tries to mutate them, the value itself
  can't change. Mutation needs Set/List/Map or your own mutable type.
```

</details>

#### Week 6 — Interfaces, Abstract Classes, Records

`07_Modern_Java/Ch05_Interfaces_AbstractClasses.md` — when to use each, default methods, records (immutable data carriers).

---

### UNIT 3 — Collections & Generics (Weeks 7–9)

#### Week 7 — Generics

`07_Modern_Java/Ch06_Generics.md` — type parameters, bounded wildcards, PECS rule, type erasure.

#### Week 8 — Collections Framework

`07_Modern_Java/Ch07_Collections_Framework.md` — List, Set, Map, Deque, when to use each, Collection vs Stream.

#### Week 9 — Streams + Functional Programming

`07_Modern_Java/Ch12_Streams_Lambdas.md` (partial — basics only) — map/filter/reduce, terminal operations, collectors.

---

### UNIT 4 — Exceptions & I/O (Weeks 10–11)

#### Week 10 — Exceptions

`07_Modern_Java/Ch14_Exceptions.md` — checked vs unchecked, try-with-resources, custom exception design.

#### Week 11 — File I/O

`07_Modern_Java/Ch11_Files_IO.md` — Path, Files API, Readers/Writers, JSON parsing with Jackson.

---

### UNIT 5 — TypeScript Crossover (Weeks 12–13)

#### Week 12 — TS Foundations

`17_TypeScript/01_TS_Foundations.md` — type annotations, interfaces, type aliases.

#### Week 13 — TS vs Java Mapping

Comparison: classes in TS vs Java, generics, optional chaining (Java's Optional vs TS's `?.`).

---

### UNIT 6 — Testing (Weeks 14–15)

#### Week 14 — JUnit 5

`07_Modern_Java/Ch13_Testing_JUnit.md` — Arrange-Act-Assert, parameterized tests, lifecycle annotations.

#### Week 15 — TDD Practice

Write a class test-first: red → green → refactor cycle on 5 small tasks.

---

### Week 16 — Capstone

Build a CLI command system: expense tracker / mini SQL evaluator / quiz engine. Java implementation with JUnit tests at 80%+ coverage. Then re-implement core domain logic in TypeScript with Vitest.

---

## Problem Sets

[`07_Modern_Java/07_PROBLEM_SETS.md`](../../../07_Modern_Java/07_PROBLEM_SETS.md) — Foundations sections.

## Exam Prep

[`07_Modern_Java/Ch22_Java_Deep_Reasoning.md`](../../../07_Modern_Java/Ch22_Java_Deep_Reasoning.md) — pre-read for next semester.
