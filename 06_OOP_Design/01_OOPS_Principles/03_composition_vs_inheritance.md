# 📌 Part 2: Composition vs Inheritance

> **Navigation**: [← OOP From First Principles](02_oop_from_first_principles.md) | [Chapter overview](../01_OOPS_Principles.md) | [SOLID Principles →](04_solid_principles.md)
> Page 3 of 5 in **OOPS & Design Principles: Complete Guide**


## The "Has-A" vs "Is-A" Debate

```
INHERITANCE (Is-A):
- Dog IS-A Animal
- ArrayList IS-A List
- Creates TIGHT coupling
- Hard to change later

COMPOSITION (Has-A):
- Car HAS-A Engine
- Person HAS-A Address
- Creates LOOSE coupling
- Easy to change later

RULE: "Favor composition over inheritance"
```

## The Superman Example (From Your Conversation!)

```java
// ❌ INHERITANCE APPROACH:
class Man {
    public void walk() { System.out.println("Walking"); }
    public void talk() { System.out.println("Talking"); }
}

class SuperMan extends Man {
    // Superman IS-A Man? Kind of...
    // But Superman isn't born as man, he's from Krypton!
    // What if we want FlashMan, SpiderMan?
    // They have different origins but similar powers.

    public void fly() { System.out.println("Flying"); }
    public void shootLasers() { System.out.println("Pew pew"); }
}

// PROBLEM: Can't mix and match powers easily!
// What if SpiderMan wants to fly but not shoot lasers?
// Multiple inheritance? Java doesn't allow it.
```

```java
// ✅ COMPOSITION APPROACH:

// Basic human capabilities
class Man {
    private String name;

    public Man(String name) {
        this.name = name;
    }

    public void walk() { System.out.println(name + " is walking"); }
    public void talk() { System.out.println(name + " is talking"); }
}

// Superpowers as separate components - PLUG AND PLAY!
interface SuperPower {
    void usePower();
}

class Flight implements SuperPower {
    public void usePower() { System.out.println("Flying through the sky!"); }
}

class LaserEyes implements SuperPower {
    public void usePower() { System.out.println("Shooting laser beams!"); }
}

class SuperStrength implements SuperPower {
    public void usePower() { System.out.println("Lifting heavy objects!"); }
}

class WebSlinging implements SuperPower {
    public void usePower() { System.out.println("Swinging on webs!"); }
}

// SuperMan HAS-A Man (delegate human behaviors)
// SuperMan HAS-A list of powers (composable!)
class SuperMan {
    private Man humanSide;  // Delegation
    private List<SuperPower> powers;

    public SuperMan(String name) {
        this.humanSide = new Man(name);  // HAS-A Man
        this.powers = new ArrayList<>();
    }

    // Delegation - forward human behaviors
    public void walk() { humanSide.walk(); }
    public void talk() { humanSide.talk(); }

    // Add powers dynamically!
    public void addPower(SuperPower power) {
        powers.add(power);
    }

    public void useAllPowers() {
        for (SuperPower power : powers) {
            power.usePower();
        }
    }
}

// USAGE:
public static void main(String[] args) {
    SuperMan clark = new SuperMan("Clark Kent");
    clark.addPower(new Flight());
    clark.addPower(new LaserEyes());
    clark.addPower(new SuperStrength());

    clark.walk();  // Human behavior
    clark.useAllPowers();  // Super powers!

    // SpiderMan? Easy!
    SuperMan peter = new SuperMan("Peter Parker");
    peter.addPower(new WebSlinging());
    peter.addPower(new SuperStrength());
    // No laser eyes, no flight - different power combo!
}
```

## The Interior Decorator Analogy

```
YOUR ANALOGY:
"Composition is like having an interior decorator do your work"

TRANSLATION TO CODE:
- The decorator (composed object) does the actual work
- Your class (the client) just DELEGATES to them
- You can swap decorators anytime!

class Room {
    private InteriorDecorator decorator;  // "Hire" a decorator

    public void decorateRoom() {
        decorator.decorate();  // Let them do the work
    }

    public void changeDecorator(InteriorDecorator newOne) {
        this.decorator = newOne;  // Change decorator anytime!
    }
}

THIS IS DEPENDENCY INJECTION!
- Room doesn't CREATE the decorator
- Room RECEIVES the decorator from outside
- Room can work with ANY decorator implementation
```

---

🔬 **Section Challenge — The Interior Decorator Analogy**

**Challenge 1 (Trace — Who/When/What):** In Java I/O, `new BufferedReader(new InputStreamReader(new FileInputStream("f.txt")))` stacks 3 decorators. **Who** does the actual file reading? **What** does each layer add? **When** you close only the outermost, do all layers close?

<details><summary>Answer</summary>

**Who reads?** `FileInputStream` — it's the concrete component. `InputStreamReader` decorates it to convert bytes → chars (adds encoding). `BufferedReader` decorates that to add buffering (reduces system calls). **Closing:** Yes — `BufferedReader.close()` calls `InputStreamReader.close()`, which calls `FileInputStream.close()`. Each decorator delegates `close()` to its wrapped stream. BUT: if the constructor of `BufferedReader` threw an exception, `InputStreamReader` would leak because no variable holds its reference. Fix: use try-with-resources on each resource, or Java 9+ allows `var isr = new InputStreamReader(...); var br = new BufferedReader(isr)` in the try header.

</details>

---

[← OOP From First Principles](02_oop_from_first_principles.md) | [Chapter overview](../01_OOPS_Principles.md) | [SOLID Principles →](04_solid_principles.md)
