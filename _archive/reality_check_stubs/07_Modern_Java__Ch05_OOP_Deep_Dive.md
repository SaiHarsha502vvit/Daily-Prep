

---

## Reality Check

**"Inheritance models 'is-a' relationships, always use it when that's true"** → Even when the is-a relationship holds, inheritance creates tight coupling — subclass is bound to superclass implementation details. Josh Bloch (Effective Java Item 18): "Favor composition over inheritance." The tell: if you override a method, and the superclass later changes its implementation in a way that calls that overridden method differently, your subclass silently breaks. Composition avoids this — you delegate, not inherit.

**"Abstract classes and interfaces are interchangeable"** → Before Java 8, interfaces could only have abstract methods — making abstract classes necessary for default implementations. Since Java 8, interfaces can have `default` methods, `static` methods, and (since Java 9) `private` methods. The remaining difference: a class can implement MULTIPLE interfaces but extend only ONE class. Abstract classes can have instance state (fields); interfaces cannot (only constants). Use interface when you want to define a type (ability); use abstract class when you want to share implementation and state across a family.

**"Polymorphism is just method overriding"** → Polymorphism has two forms: runtime (dynamic dispatch — overriding) and compile-time (static — overloading). Runtime polymorphism: the actual method called depends on the object's runtime type, not the reference type. `Animal a = new Dog(); a.speak();` calls `Dog.speak()`. Compile-time: method is resolved at compile time based on parameter types. Java uses virtual dispatch for all non-private, non-static methods — every overridable method call goes through the vtable.

**"final class is just for security"** → `final` on a class prevents subclassing. Uses beyond security: immutability guarantee (String is final — you can't subclass and override to make it mutable), performance (JIT can devirtualize calls — no vtable lookup needed), API contract (signals "do not extend"). `Integer`, `Double`, `String` are all final. Record classes are implicitly final. The JVM can apply more aggressive inlining to calls on final classes.

**"Method overloading is resolved at runtime like overriding"** → Overloading is resolved at **compile time** based on the declared types of arguments. If you have `print(Object o)` and `print(String s)`, calling `print(someVar)` where someVar is declared as `Object` calls `print(Object)` even if the runtime type is String. This surprises people who expect the "most specific" method to be chosen at runtime. Overriding: runtime type determines the method. Overloading: compile-time type determines the method.
