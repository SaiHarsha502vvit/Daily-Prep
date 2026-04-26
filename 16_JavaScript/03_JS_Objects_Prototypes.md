**JavaScript Chapter 3/7** | [â† Previous: Functions & Closures](02_JS_Functions_Closures.md) | [Index](../00_MASTER_INDEX.md) | [Next â†’ Async & Promises](04_JS_Async_Promises.md)

# Objects & Prototypes â€” How JS Really Does Inheritance

## 5W1H â€” Why This Chapter?


WHAT: Objects are JS's universal data structure. Prototypes are
JS's inheritance mechanism. Classes (ES6) are sugar on top.

WHY:  Everything in JS is (or behaves like) an object.
Understanding prototypes explains: why [].map works,
how inheritance works, what `class` really does.

WHO:  Anyone doing JS â€” React props are objects, APIs return
objects, DOM elements are objects.

WHEN: After understanding functions and closures (Ch 2).

HOW:  Every object has an internal [[Prototype]] link to another
object. When you access a property, JS walks this chain.


---

## 1. Object Creation â€” 5 Ways

```javascript
// WAY 1: Object literal (most common)
const user = {
    name: "Harsha",
    age: 24,
    greet() { return `Hi, I'm ${this.name}`; }
};

// WAY 2: Object.create() (prototype-based)
const personProto = {
    greet() { return `Hi, I'm ${this.name}`; }
};
const user2 = Object.create(personProto);
user2.name = "Harsha";
// user2 inherits greet from personProto

// WAY 3: Constructor function (pre-ES6)
function Person(name, age) {
    this.name = name;
    this.age = age;
}
Person.prototype.greet = function() {
    return `Hi, I'm ${this.name}`;
};
const user3 = new Person("Harsha", 24);

// WAY 4: ES6 Class (syntactic sugar over Way 3)
class PersonClass {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
    greet() { return `Hi, I'm ${this.name}`; }
}
const user4 = new PersonClass("Harsha", 24);

// WAY 5: Factory function (uses closures, no `this` needed)
function createPerson(name, age) {
    return {
        getName() { return name; },  // closure over name
        getAge() { return age; },    // closure over age
        greet() { return `Hi, I'm ${name}`; }
    };
}
const user5 = createPerson("Harsha", 24);
```

```
WHICH TO USE:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Approach          â”‚ When to Use                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Object literal    â”‚ One-off objects, configs, data     â”‚
â”‚ Class             â”‚ Multiple instances, inheritance    â”‚
â”‚ Factory function  â”‚ Privacy, no `this` confusion       â”‚
â”‚ Object.create     â”‚ When you need specific prototype   â”‚
â”‚ Constructor fn    â”‚ Legacy code only (use class)       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

REASONING: In React, you'll mostly use object literals (props,
state) and classes (old class components). Factory functions
avoid `this` problems entirely â€” good for utility modules.
```

**Flow:**
1. WHICH TO USE:
2. Approach When to Use
3. Object literal One-off objects, configs, data
4. Class Multiple instances, inheritance
5. Factory function Privacy, no `this` confusion
6. Object.create When you need specific prototype
7. Constructor fn Legacy code only (use class)

```mermaid
flowchart TD
    N1["WHICH TO USE:"]
    N2["Approach When to Use"]
    N3["Object literal One-off objects, configs, data"]
    N4["Class Multiple instances, inheritance"]
    N5["Factory function Privacy, no `this` confusion"]
    N6["Object.create When you need specific prototype"]
    N7["Constructor fn Legacy code only (use class)"]
    N8["avoid `this` problems entirely â€” good for utility modul"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

## 2. Property Descriptors â€” What Properties Really Are

```javascript
const obj = { name: "Harsha" };

// Every property has hidden descriptors:
console.log(Object.getOwnPropertyDescriptor(obj, "name"));
// {
//   value: "Harsha",
//   writable: true,      â† can change value?
//   enumerable: true,    â† shows in for...in/Object.keys()?
//   configurable: true   â† can delete or change descriptor?
// }

// Define read-only property:
Object.defineProperty(obj, "id", {
    value: 42,
    writable: false,       // Can't change
    enumerable: true,
    configurable: false    // Can't delete or reconfigure
});
obj.id = 100;   // Silently fails (strict mode: TypeError)
console.log(obj.id); // 42

// GETTER/SETTER (computed properties):
const person = {
    firstName: "Sai",
    lastName: "Harsha",

    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    },
    set fullName(value) {
        const [first, last] = value.split(" ");
        this.firstName = first;
        this.lastName = last;
    }
};

person.fullName;           // "Sai Harsha" (calls getter)
person.fullName = "New Name"; // calls setter
person.firstName;          // "New"
```

---

## 3. Object Immutability â€” 3 Levels

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  LEVEL 1: Object.preventExtensions(obj)                              â•‘
â•‘  â†’ Cannot ADD new properties. Can modify/delete existing.            â•‘
â•‘                                                                      â•‘
â•‘  LEVEL 2: Object.seal(obj)                                           â•‘
â•‘  â†’ Cannot ADD or DELETE properties. CAN modify values.               â•‘
â•‘  (Sets configurable: false on all properties)                        â•‘
â•‘                                                                      â•‘
â•‘  LEVEL 3: Object.freeze(obj)                                         â•‘
â•‘  â†’ Cannot ADD, DELETE, or MODIFY. Completely immutable.              â•‘
â•‘  (Sets writable: false AND configurable: false)                      â•‘
â•‘                                                                      â•‘
â•‘  âš  ALL THREE ARE SHALLOW! Nested objects are NOT frozen.             â•‘
â•‘                                                                      â•‘
â•‘  const obj = Object.freeze({ a: 1, b: { c: 2 } });                   â•‘
â•‘  obj.a = 10;     // Silently fails âœ…                                 â•‘
â•‘  obj.b.c = 10;   // WORKS! âŒ b is not frozen                         â•‘
â•‘                                                                      â•‘
â•‘  For deep freeze, use structuredClone or a recursive freeze.         â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

**Flow:**
1. LEVEL 1: Object.preventExtensions(obj)
2. Cannot ADD new properties. Can modify/delete existing
3. LEVEL 2: Object.seal(obj)
4. Cannot ADD or DELETE properties. CAN modify values.
5. (Sets configurable: false on all properties)
6. LEVEL 3: Object.freeze(obj)
7. Cannot ADD, DELETE, or MODIFY. Completely immutable.

```mermaid
flowchart TD
    N1["LEVEL 1: Object.preventExtensions(obj)"]
    N2["â†’ Cannot ADD new properties. Can modify/delete existing"]
    N3["LEVEL 2: Object.seal(obj)"]
    N4["â†’ Cannot ADD or DELETE properties. CAN modify values."]
    N5["(Sets configurable: false on all properties)"]
    N6["LEVEL 3: Object.freeze(obj)"]
    N7["â†’ Cannot ADD, DELETE, or MODIFY. Completely immutable."]
    N8["(Sets writable: false AND configurable: false)"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

## 4. Prototypes â€” JS's Inheritance Mechanism

### 5W1H: WHY Prototypes?

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  WHAT: Every object has a hidden [[Prototype]] link to another       â•‘
â•‘        object. This forms a CHAIN (until null).                      â•‘
â•‘                                                                      â•‘
â•‘  WHY:  Memory efficiency. Instead of copying methods to every        â•‘
â•‘        instance, all instances SHARE methods via the prototype.      â•‘
â•‘        1000 users, 1 copy of greet() â€” not 1000 copies.              â•‘
â•‘                                                                      â•‘
â•‘  ANALOGY: Prototype chain is like a family tree.                     â•‘
â•‘  If you don't know something, ask your parent.                       â•‘
â•‘  If parent doesn't know, ask grandparent. Up to the root (null).     â•‘
â•‘                                                                      â•‘
â•‘  HOW:  Access via Object.getPrototypeOf(obj) or obj.__proto__        â•‘
â•‘        (deprecated but widely known).                                â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

**Flow:**
1. object. This forms a CHAIN (until null).
2. WHY: Memory efficiency. Instead of copying methods to e
3. instance, all instances SHARE methods via the prototype
4. 1000 users, 1 copy of greet() â€” not 1000 copies.
5. ANALOGY: Prototype chain is like a family tree.
6. If you don't know something, ask your parent. HOW: Access via Object.getPrototypeOf(obj) or obj.__pro

```mermaid
flowchart TD
    N1["object. This forms a CHAIN (until null)."]
    N2["WHY: Memory efficiency. Instead of copying methods to e"]
    N3["instance, all instances SHARE methods via the prototype"]
    N4["1000 users, 1 copy of greet() â€” not 1000 copies."]
    N5["ANALOGY: Prototype chain is like a family tree."]
    N6["If you don't know something, ask your parent."]
    N7["HOW: Access via Object.getPrototypeOf(obj) or obj.__pro"]
    N8["(deprecated but widely known)."]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  PROTOTYPE CHAIN VISUALIZATION:                                      â•‘
â•‘                                                                      â•‘
â•‘  const arr = [1, 2, 3];                                              â•‘
â•‘                                                                      â•‘
â•‘  arr                                                                 â•‘
â•‘   â”‚ .__proto__                                                       â•‘
â•‘   â–¼                                                                  â•‘
â•‘  Array.prototype { map, filter, reduce, forEach, ... }               â•‘
â•‘   â”‚ .__proto__                                                       â•‘
â•‘   â–¼                                                                  â•‘
â•‘  Object.prototype { toString, hasOwnProperty, valueOf, ... }         â•‘
â•‘   â”‚ .__proto__                                                       â•‘
â•‘   â–¼                                                                  â•‘
â•‘  null  â† END OF CHAIN                                                â•‘
â•‘                                                                      â•‘
â•‘  When you call arr.map(), JS looks:                                  â•‘
â•‘  1. Does arr have own property "map"? â†’ No                           â•‘
â•‘  2. Does Array.prototype have "map"? â†’ YES! Use it.                  â•‘
â•‘                                                                      â•‘
â•‘  When you call arr.toString(), JS looks:                             â•‘
â•‘  1. arr â†’ No  2. Array.prototype â†’ has its own toString â†’ Use it     â•‘
â•‘  (If Array.prototype didn't have it, would go to Object.prototype)   â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

**Flow:**
1. PROTOTYPE CHAIN VISUALIZATION: / const arr = [1, 2, 3];
2. Array.prototype { map, filter, reduce, forEach, ... } /
3. Object.prototype { toString, hasOwnProperty, valueOf, . null â† END OF CHAIN / When you call arr.map(), JS looks

```mermaid
flowchart TD
    N1["PROTOTYPE CHAIN VISUALIZATION: / const arr = [1, 2, 3];"]
    N2["Array.prototype { map, filter, reduce, forEach, ... } /"]
    N3["Object.prototype { toString, hasOwnProperty, valueOf, ."]
    N4["null â† END OF CHAIN / When you call arr.map(), JS looks"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
```

```javascript
// HOW prototype works in practice:
function Animal(name) {
    this.name = name;
}
Animal.prototype.speak = function() {
    return `${this.name} makes a sound`;
};

function Dog(name, breed) {
    Animal.call(this, name);   // Call parent constructor
    this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype); // Set up chain
Dog.prototype.constructor = Dog;                  // Fix constructor ref
Dog.prototype.bark = function() {
    return `${this.name} barks!`;
};

const rex = new Dog("Rex", "German Shepherd");
rex.bark();   // "Rex barks!"      â† found on Dog.prototype
rex.speak();  // "Rex makes a sound" â† found on Animal.prototype
rex.toString(); // "[object Object]" â† found on Object.prototype

// rex own properties: { name: "Rex", breed: "German Shepherd" }
// Dog.prototype: { bark, constructor }
// Animal.prototype: { speak, constructor }
// Object.prototype: { toString, hasOwnProperty, ... }
```

---



ðŸ”¬ **Section Challenge â€” 4. Prototypes â€” JS's Inheritance Mechanism**

**Challenge 1 (Reasoning):** `Object.create(proto)` vs `new Constructor()` â€” what's the practical difference?
<details><summary>Answer</summary>

`new Constructor()`: runs the constructor function (initializes instance properties), sets `__proto__` to `Constructor.prototype`. `Object.create(proto)`: creates an object with `proto` as its prototype, NO constructor called. Use `Object.create(null)` to create a pure dictionary with no inherited properties (no `toString`, `hasOwnProperty`, etc.) â€” useful for safe maps. `Object.create(SomeClass.prototype)` creates an instance-like object without running the constructor (used in class inheritance setup).
</details>


## 5. ES6 Classes â€” Syntactic Sugar

```javascript
class Animal {
    // CONSTRUCTOR: Called when you do `new Animal(...)`
    constructor(name) {
        this.name = name;  // Instance property
    }

    // INSTANCE METHOD: Added to Animal.prototype
    speak() {
        return `${this.name} makes a sound`;
    }

    // STATIC METHOD: On the class itself, NOT on instances
    static kingdom() {
        return "Animalia";
    }

    // GETTER/SETTER
    get info() {
        return `Animal: ${this.name}`;
    }
}

class Dog extends Animal {
    #tricks = [];  // PRIVATE FIELD (ES2022) â€” truly private!

    constructor(name, breed) {
        super(name);        // MUST call super() before using `this`
        this.breed = breed;
    }

    bark() {
        return `${this.name} barks!`;
    }

    // OVERRIDE parent method
    speak() {
        return `${this.name} woofs!`;
    }

    // Access private field
    addTrick(trick) {
        this.#tricks.push(trick);
    }

    showTricks() {
        return this.#tricks.join(", ");
    }
}

const rex = new Dog("Rex", "GSD");
rex.bark();           // "Rex barks!"
rex.speak();          // "Rex woofs!" (overridden)
Animal.kingdom();     // "Animalia" (static)
rex.addTrick("sit");
rex.showTricks();     // "sit"
// rex.#tricks;       // âŒ SyntaxError â€” truly private!
```

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  CLASS â‰¡ PROTOTYPE (what class actually does):                       â•‘
â•‘                                                                      â•‘
â•‘  class Dog extends Animal { bark() {} }                              â•‘
â•‘                                                                      â•‘
â•‘  IS EXACTLY THE SAME AS:                                             â•‘
â•‘                                                                      â•‘
â•‘  function Dog(name, breed) { Animal.call(this, name); ... }          â•‘
â•‘  Dog.prototype = Object.create(Animal.prototype);                    â•‘
â•‘  Dog.prototype.constructor = Dog;                                    â•‘
â•‘  Dog.prototype.bark = function() {};                                 â•‘
â•‘                                                                      â•‘
â•‘  REASONING: `class` doesn't add new behavior to JS. It's just        â•‘
â•‘  cleaner syntax for the prototype pattern. Under the hood, it's      â•‘
â•‘  still prototypes. But class syntax prevents common mistakes         â•‘
â•‘  like forgetting to set constructor.                                 â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

**Flow:**
1. CLASS â‰¡ PROTOTYPE (what class actually does):
2. class Dog extends Animal { bark() {} }
3. IS EXACTLY THE SAME AS:
4. function Dog(name, breed) { Animal.call(this, name); .. Dog.prototype = Object.create(Animal.prototype); Dog.prototype.constructor = Dog; Dog.prototype.bark = function() {};

```mermaid
flowchart TD
    N1["CLASS â‰¡ PROTOTYPE (what class actually does):"]
    N2["class Dog extends Animal { bark() {} }"]
    N3["IS EXACTLY THE SAME AS:"]
    N4["function Dog(name, breed) { Animal.call(this, name); .."]
    N5["Dog.prototype = Object.create(Animal.prototype);"]
    N6["Dog.prototype.constructor = Dog;"]
    N7["Dog.prototype.bark = function() {};"]
    N8["still prototypes. But class syntax prevents common mist"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

## 6. Object Methods â€” Essential Toolkit

```javascript
const user = { name: "Harsha", age: 24, role: "developer" };

// KEYS, VALUES, ENTRIES
Object.keys(user);    // ["name", "age", "role"]
Object.values(user);  // ["Harsha", 24, "developer"]
Object.entries(user);  // [["name","Harsha"], ["age",24], ["role","developer"]]

// Destructuring from entries (convert to Map):
const map = new Map(Object.entries(user));

// ASSIGN (shallow merge â€” mutates target!)
const defaults = { theme: "dark", lang: "en" };
const prefs = { theme: "light" };
const result = Object.assign({}, defaults, prefs);
// { theme: "light", lang: "en" }

// SPREAD is preferred (creates new object):
const result2 = { ...defaults, ...prefs }; // Same result, cleaner

// fromEntries (opposite of entries)
const entries = [["a", 1], ["b", 2]];
const obj = Object.fromEntries(entries); // { a: 1, b: 2 }

// USE CASE: Transform object values
const prices = { apple: 1, banana: 2, cherry: 3 };
const doubled = Object.fromEntries(
    Object.entries(prices).map(([key, val]) => [key, val * 2])
);
// { apple: 2, banana: 4, cherry: 6 }
```

---

## 7. Destructuring â€” Extracting Object Properties

```javascript
// BASIC
const { name, age } = user;
// Creates: const name = user.name; const age = user.age;

// RENAME
const { name: userName, age: userAge } = user;
// userName = "Harsha", userAge = 24

// DEFAULT
const { name, phone = "N/A" } = user;
// phone = "N/A" (user has no phone property)

// NESTED
const company = {
    name: "Tech Corp",
    address: { city: "Hyderabad", zip: "500001" }
};
const { address: { city, zip } } = company;
// city = "Hyderabad", zip = "500001"

// REST
const { name: n, ...rest } = user;
// n = "Harsha", rest = { age: 24, role: "developer" }

// IN FUNCTION PARAMS (very common in React)
function UserCard({ name, age, role = "viewer" }) {
    return `<div>${name} (${age}) - ${role}</div>`;
}
UserCard(user); // <div>Harsha (24) - developer</div>

// ARRAY DESTRUCTURING
const [first, second, ...rest] = [1, 2, 3, 4, 5];
// first = 1, second = 2, rest = [3, 4, 5]

// SWAP
let a = 1, b = 2;
[a, b] = [b, a]; // a = 2, b = 1 â€” no temp variable needed!
```

---




## 8. Iterators & Symbols

```javascript
// SYMBOL: Unique, immutable identifier (no two symbols are equal)
const id = Symbol("id");
const id2 = Symbol("id");
id === id2; // false â€” always unique!

// Use: Hidden/non-colliding property keys
const user = {
    name: "Harsha",
    [id]: 12345    // Symbol as key â€” won't show in Object.keys()
};
Object.keys(user);           // ["name"] â€” symbol hidden!
Object.getOwnPropertySymbols(user); // [Symbol(id)]

// WELL-KNOWN SYMBOLS â€” customize built-in behavior:
class Range {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }

    // Make Range iterable with for...of
    [Symbol.iterator]() {
        let current = this.start;
        const end = this.end;
        return {
            next() {
                return current <= end
                    ? { value: current++, done: false }
                    : { done: true };
            }
        };
    }
}

const range = new Range(1, 5);
for (const n of range) console.log(n); // 1, 2, 3, 4, 5
[...range]; // [1, 2, 3, 4, 5] â€” spread works too!
```

---

## 9. Comparison: JS vs Java Objects

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Feature          â”‚ JavaScript       â”‚ Java             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Typing           â”‚ Dynamic          â”‚ Static           â”‚
â”‚ Inheritance      â”‚ Prototype-based  â”‚ Class-based      â”‚
â”‚ Class keyword    â”‚ Sugar over proto â”‚ Real class       â”‚
â”‚ Private fields   â”‚ # prefix (new)   â”‚ private keyword  â”‚
â”‚ Interfaces       â”‚ None (use TS)    â”‚ interface keywordâ”‚
â”‚ Multiple inherit â”‚ Mixins/compose   â”‚ Interfaces only  â”‚
â”‚ Object creation  â”‚ Literal {}, new  â”‚ new only         â”‚
â”‚ Property access  â”‚ Dynamic (obj[x]) â”‚ Fixed at compile â”‚
â”‚ this keyword     â”‚ Changes by call  â”‚ Always instance  â”‚
â”‚ Null safety      â”‚ ?. operator      â”‚ Optional (Java17)â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

KEY INSIGHT: In Java, the class defines the shape forever.
In JS, objects are "bags of properties" â€” you can add/remove
properties at any time. More flexible, but less safe.
```

**Flow:**
1. Feature JavaScript Java
2. Typing Dynamic Static
3. Inheritance Prototype-based Class-based
4. Class keyword Sugar over proto Real class
5. Private fields # prefix (new) private keyword
6. Interfaces None (use TS) interface keyword
7. Multiple inherit Mixins/compose Interfaces only

```mermaid
flowchart TD
    N1["Feature JavaScript Java"]
    N2["Typing Dynamic Static"]
    N3["Inheritance Prototype-based Class-based"]
    N4["Class keyword Sugar over proto Real class"]
    N5["Private fields # prefix (new) private keyword"]
    N6["Interfaces None (use TS) interface keyword"]
    N7["Multiple inherit Mixins/compose Interfaces only"]
    N8["Object creation Literal {}, new new only"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

## Interview Quick-Fire

```
Q: How does prototypal inheritance work?
â†’ Every object has a [[Prototype]] link. When a property isn't found
  on the object, JS walks up the prototype chain until null.

Q: What does `new` keyword do?
â†’ 1. Creates empty object {}
   2. Sets its [[Prototype]] to Constructor.prototype
   3. Calls constructor with `this` = new object
   4. Returns the object (unless constructor returns an object)

Q: Difference between hasOwnProperty and `in`?
â†’ hasOwnProperty: only checks the object itself.
  `in`: checks object AND its entire prototype chain.

Q: How to create truly private properties?
â†’ ES2022: # prefix (class #field). Before: closures in factory.
  WeakMap was used as a workaround.

Q: Object.create(null) â€” why?
â†’ Creates an object with NO prototype. No toString, no hasOwnProperty.
  Used for pure dictionaries (e.g., Map-like storage) with no
  prototype pollution risk.

Q: How to check if a property exists?
â†’ "prop" in obj (includes prototype chain)
  obj.hasOwnProperty("prop") (own only)
  Object.hasOwn(obj, "prop") (modern, own only â€” preferred)
```

**Flow:**
1. Q: How does prototypal inheritance work?
2. on the object, JS walks up the prototype chain until nu
3. Q: What does `new` keyword do?
4. Creates empty object {}
5. Sets its [[Prototype]] to Constructor.prototype
6. Calls constructor with `this` = new object
7. Q: Difference between hasOwnProperty and `in`?

```mermaid
flowchart TD
    N1["Q: How does prototypal inheritance work?"]
    N2["on the object, JS walks up the prototype chain until nu"]
    N3["Q: What does `new` keyword do?"]
    N4["â†’ 1. Creates empty object {}"]
    N5["2. Sets its [[Prototype]] to Constructor.prototype"]
    N6["3. Calls constructor with `this` = new object"]
    N7["Q: Difference between hasOwnProperty and `in`?"]
    N8["â†’ hasOwnProperty: only checks the object itself."]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---

[â† Previous: Functions & Closures](02_JS_Functions_Closures.md) | [Index](../00_MASTER_INDEX.md) | [Next â†’ Async & Promises](04_JS_Async_Promises.md)

---
