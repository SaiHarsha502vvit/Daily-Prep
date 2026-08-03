**Navigation**: [< Previous](04_TS_Deep_Reasoning.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06_TS_Module_System_Performance.md)

**TypeScript Chapter 5/6** | [← Deep Reasoning](04_TS_Deep_Reasoning.md) | [Index](../00_MASTER_INDEX.md) | [Next → Module System](06_TS_Module_System_Performance.md)

# TypeScript Decorators & Metaprogramming — Runtime Behavior in a Compile-Time World

## 5W1H — Why This Chapter?

WHAT: Decorators — a TypeScript (and ECMAScript) feature that lets you
attach reusable logic to classes, methods, fields, and accessors by
intercepting their definitions at definition time.

WHY: Decorators are the **only mainstream TypeScript feature that
produces runtime behavior from compile-time annotations**. Every other TS
construct (interfaces, types, generics) erases at compile time. Decorators
leave a persistent mark on class constructors and prototype chains. This
makes them extraordinarily powerful for framework authors — and easy to
misuse for application developers who don't understand what actually happens
at runtime.

WHO: Framework authors, library maintainers, and anyone integrating with
Decorator-powered frameworks like NestJS or Angular. Also useful for anyone
building validation layers, ORM-like abstractions, or middleware patterns.

WHEN: After understanding TypeScript classes and the type system. You should
comfortably read `PropertyDescriptor`, understand prototype inheritance, and
know that `this` binding in JavaScript is dynamic.

HOW: By understanding the decorator protocol — what each decorator type
receives as arguments, what it may return, and how metadata reflection
survives the compilation boundary.

---

## 1. The Two Worlds of Decorators: TC39 Stage 3 vs Legacy

WHY: The decorator story in JavaScript/TypeScript is unusually complex
because two fundamentally different designs co-exist in the ecosystem.

### Why Two Designs?

ECMAScript decorators were first popularized by TypeScript's own
`experimentalDecorators` flag — but those were always a TypeScript-specific
extension inspired by a **Stage 1 proposal** from 2015. When TC39 moved
decorators to **Stage 3** (finalized, shipping in browsers), the design
changed significantly. TypeScript 5.0+ supports Stage 3 by default, but
millions of lines of NestJS, Angular, and TypeORM code still run on legacy
decorators. You may encounter both — understanding WHY each exists tells
you when to use which.

**Legacy decorators (pre-TS 5.0, `experimentalDecorators: true`):**
- Based on the old Stage 1/2 proposal, using a different function signature
- Not standardized in ECMAScript — only available in TypeScript and Babel
- Used `Reflect.decorate` from the `reflect-metadata` polyfill
- Class decorators could not return a new class — only modify prototype

**Stage 3 decorators (TS 5.0+, ECMAScript standard):**
- Standardized JavaScript feature — shipping in V8, SpiderMonkey, JavaScriptCore
- Uses `Symbol.metadata` to store metadata (no `reflect-metadata` polyfill needed)
- Supports the `accessor` keyword for auto-accessors
- Different context object API: `ClassMethodDecoratorContext`, `ClassGetterDecoratorContext`, etc.
- Can return modified descriptors from method/accessor/field decorators

### Configuration Comparison

```jsonc
// tsconfig.json — Legacy mode (pre-TS 5.0, still used for NestJS 9.x)
{
  "compilerOptions": {
    "experimentalDecorators": true,      // Enables legacy Stage 1/2 syntax
    "emitDecoratorMetadata": true        // Emits design-time type metadata (now discouraged)
  }
}
```

```jsonc
// tsconfig.json — Stage 3 mode (TS 5.0+, default)
{
  "compilerOptions": {
    // No flag needed — Stage 3 decorators are the default in TS 5.0+
    // If you need legacy: "useDefineForClassFields": false
  }
}
```

### Syntax Comparison: Method Decorator

```typescript
// ============================================================
// LEGACY DECORATOR (experimentalDecorators: true)
// ============================================================

function logged(
  target: Object,                    // The prototype (for instance methods)
  propertyKey: string | symbol,      // Method name
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value!;

  descriptor.value = function (...args: unknown[]) {
    console.log(`[LOG] ${String(propertyKey)} called with`, args);
    return original.apply(this, args);
  };

  return descriptor; // Return modified descriptor
}

class LegacyService {
  @logged
  fetchData(id: string) {
    return { id, data: "result" };
  }
}

// ============================================================
// STAGE 3 DECORATOR (TS 5.0+)
// ============================================================

function logged(
  target: Function,                        // The constructor (class itself)
  context: ClassMethodDecoratorContext
) {
  // context object replaces individual parameters
  // context.name = method name as a symbol
  // context.kind = "method"
  // context.private = boolean

  return function (this: unknown, ...args: unknown[]) {
    console.log(`[LOG] ${String(context.name)} called with`, args);
    return (target as unknown as (this: unknown, ...a: unknown[]) => unknown).call(
      this,
      ...args,
    );
  };
}

class Stage3Service {
  @logged
  fetchData(id: string) {
    return { id, data: "result" };
  }
}
```

**Key difference:** Stage 3 separates "what to do with the decorator input" from
"how to implement the decoration" via the `context` object. Legacy uses positional
parameters; Stage 3 uses structured context.

### The `accessor` Keyword — New in Stage 3

```typescript
// Stage 3 introduces the `accessor` keyword for auto-accessors:
// These are fields with auto-generated getter/setter pairs.

class Person {
  // Legacy: you'd need to manually write getAge() and setAge()
  accessor age: number = 0;        // Automatically creates getter/setter
  accessor #ssn: string = "";      // Also works as private (#) auto-accessor

  @bound
  accessor firstName: string = "";
}

// Stage 3 field decorator receives a different descriptor shape:
function fieldLog(
  value: unknown,
  context: ClassFieldDecoratorContext
) {
  console.log(`[FIELD] ${String(context.name)} initialized`);
  return value;
}

class Demo {
  @fieldLog
  accessor title: string = "";
}
```

---

🔬 **Section Challenge — 1. The Two Worlds of Decorators**

**Challenge 1 (Trace):** You enable `"experimentalDecorators": true` in a TS 5.2 project and write a legacy-style class decorator. The decorator tries to return a completely new class to replace the original. Your colleagues say this never worked in legacy decorators — only in Stage 3. Is that correct? Trace through what actually happens with legacy class decorators.

<details><summary>Answer</summary>

**Scenario:** Returning a new class from a legacy class decorator.
**Trace:** This is partially true. In **legacy decorators**, class decorators receive the constructor as `target: Function` and **can return a new constructor** — but only as a replacement for the class identity (which constructor is called when `new ClassName()` is used). The decorator CAN return a new class, but the replacement is subtle: you're replacing what `new ClassName()` instantiates, not what `ClassName` resolves to at the type level.

The limitation is more about **Stage 3**: in Stage 3, class decorators CAN return a new class (class replacement), but with different semantics around `super()` calls and how the returned class interacts with subclasses. In legacy mode, if you return a new constructor function (class), the original class's prototype chain can break in subtle ways.

**Why colleagues are right (partially):** Returning a class in legacy decorators is rarely used correctly. Most implementations just modify the constructor's prototype. The practical effect is that returning a new class often causes `instanceof` checks to break, because `instanceof` relies on the original `Constructor.prototype`.

**Design fix (Stage 3):** Stage 3 class decorators that return a new class must ensure the returned class has the same prototype chain. Frameworks that need class replacement (like DI containers) handle this by copying static properties and prototype methods.

</details>

## 2. Class Decorators — Intercepting the Constructor

WHY: Class decorators are the most powerful decorator type because they
receive the class constructor itself before any instance is created. This
makes them ideal for dependency injection containers, proxy creation, and
class-level metadata registration. The critical insight is that a class
decorator receives the constructor function — the runtime artifact — which
TypeScript erased the type of.

### What a Class Decorator Receives

```typescript
// CLASS DECORATOR SIGNATURE:
type ClassDecorator = (value: Function, context: ClassDecoratorContext) => Function | void;

// LEGACY SIGNATURE (experimentalDecorators):
type LegacyClassDecorator = (constructor: Function) => void | Function;
```

### Dependency Injection Pattern

```typescript
// ============================================================
// DEPENDENCY INJECTION CONTAINER
// ============================================================

// Service registry — holds singleton instances
const registry = new Map<string, unknown>();
const tokenToClass = new Map<string, new (...args: unknown[]) => unknown>();

function Injectable(token?: string) {
  return function (constructor: new (...args: unknown[]) => unknown) {
    const serviceToken = token ?? constructor.name;
    tokenToClass.set(serviceToken, constructor);
  };
}

function resolve<T>(token: string): T {
  if (!registry.has(token)) {
    const Constructor = tokenToClass.get(token);
    if (!Constructor) throw new Error(`No registration for ${token}`);
    // Recursively resolve constructor dependencies
    registry.set(token, new Constructor());
  }
  return registry.get(token) as T;
}

// ============================================================
// DOMAIN SERVICE using DI
// ============================================================

interface Logger {
  log(msg: string): void;
}

class ConsoleLogger implements Logger {
  log(msg: string) { console.log(`[LOG] ${msg}`); }
}

@Injectable("Logger")
class ConsoleLogger { log(msg: string) { console.log(`[LOG] ${msg}`); } }

interface Database {
  query(sql: string): Promise<unknown[]>;
}

@Injectable("Database")
class PostgresDatabase implements Database {
  async query(sql: string) {
    // Real DB call
    return [];
  }
}

@Injectable("UserService")
class UserService {
  // Properties are populated AFTER constructor call
  // (constructor injection pattern)
  private logger!: Logger;
  private db!: Database;

  // Manual injection after construction
  constructor() {
    this.logger = resolve<Logger>("Logger");
    this.db = resolve<Database>("Database");
  }

  async getUser(id: string) {
    this.logger.log(`Fetching user ${id}`);
    return this.db.query(`SELECT * FROM users WHERE id = '${id}'`);
  }
}
```

### Class Replacement Pattern

```typescript
// REPLACING A CLASS AT RUNTIME (Stage 3):

function withProxy<T extends Function>(Target: T, context: ClassDecoratorContext) {
  return function (this: unknown, ...args: unknown[]) {
    const instance = new Target(...args);
    return new Proxy(instance, {
      get(target, prop, receiver) {
        console.log(`[PROXY] Getting ${String(prop)}`);
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value) {
        console.log(`[PROXY] Setting ${String(prop)} = ${value}`);
        return Reflect.set(target, prop, value);
      },
    });
  } as unknown as T;
}

@withProxy
class Account {
  constructor(public balance: number) {}

  deposit(amount: number) {
    this.balance += amount;
  }
}

const acc = new Account(100);
acc.deposit(50); // Logs: PROXY Getting deposit, PROXY Setting balance = 150
```

---

🔬 **Section Challenge — 2. Class Decorators**

**Challenge 1 (Debug):** You write a class decorator that adds a static property `version` to the constructor. It works in Node.js (CommonJS output), but in ESM builds, the static property appears on the original class but NOT on the version that frameworks like Jest mock return. Trace why this happens and fix it.

<details><summary>Answer</summary>

**Scenario:** Static property added via class decorator not appearing on mocked classes.
**Trace:** When you use `jest.mock('./module')`, Jest replaces the entire module export with an auto-mocked version. The mocked class is a **new Function** (auto-generated) that has no connection to your original constructor. Your decorator ran on the original, not the mock.

The root cause: decorators execute at **definition time** (when the file loads). When Jest mocks the module, it doesn't re-execute the file — it creates a mock *before* the decorator runs, then the decorator runs on the real class. The static `version` property ends up on the real class, not the mock.

**Fix approach:**
1. Store decorator-generated properties on a **Side Channel** (e.g., a `WeakMap<Constructor, Metadata>`) so the mock can look them up by constructor identity.
2. In your DI/registry system, store metadata alongside the class token so test mocks can access it.
3. Better: don't use static properties from decorators for framework integration. Use a registry map instead — test mocks register in the same registry.

```typescript
// Side-channel approach:
const classMetadata = new WeakMap<Function, { version: string }>();

function withVersion(version: string) {
  return function (constructor: Function, context: ClassDecoratorContext) {
    classMetadata.set(constructor, { version }); // Not a static property
    return constructor;
  };
}

// Lookup:
function getVersion(constructor: Function): string {
  return classMetadata.get(constructor)?.version ?? "unknown";
}
```

</details>

## 3. Method Decorators — Intercepting Function Calls

WHY: Method decorators are the most commonly used decorator type because
they intercept the most unit-testable unit in OOP code: a method call. They
receive the PropertyDescriptor — the same object that `Object.getOwnPropertyDescriptor`
returns — which means you can wrap, modify, replace, or prevent method execution.

### The PropertyDescriptor Protocol

```typescript
// METHOD DECORATOR SIGNATURE (Stage 3):
type MethodDecorator = (
  value: Function,                    // The method function itself
  context: ClassMethodDecoratorContext
) => Function | void;                 // Return new function to replace it

// PROPERTYDESCRIPTOR ANATOMY (what you manipulate):
// {
//   value?: Function        — The method implementation
//   writable?: boolean      — Can be reassigned
//   enumerable?: boolean    — Appears in for...in loops
//   configurable?: boolean  — Can be deleted/redefined
//   get?: Function          — Getter (if accessor)
//   set?: Function          — Setter (if accessor)
// }
```

### Timing/Logging Decorator

```typescript
// TIMING DECORATOR — measure execution time:
function timed(
  target: Function,
  context: ClassMethodDecoratorContext
): Function {
  return function (this: unknown, ...args: unknown[]) {
    const start = performance.now();
    const result = (target as (...a: unknown[]) => unknown).call(this, ...args);

    // Handle both sync and async:
    if (result instanceof Promise) {
      return result
        .then((value) => {
          const elapsed = performance.now() - start;
          console.log(
            `[TIMED] ${this.constructor.name}.${String(context.name)} ` +
            `took ${elapsed.toFixed(2)}ms`,
          );
          return value;
        })
        .catch((error) => {
          const elapsed = performance.now() - start;
          console.error(
            `[TIMED] ${this.constructor.name}.${String(context.name)} ` +
            `failed after ${elapsed.toFixed(2)}ms`,
          );
          throw error;
        });
    }

    const elapsed = performance.now() - start;
    console.log(
      `[TIMED] ${this.constructor.name}.${String(context.name)} ` +
      `took ${elapsed.toFixed(2)}ms`,
    );
    return result;
  };
}

// RETRY DECORATOR — automatic retry with backoff:
function retry(options: { attempts: number; backoffMs: number }) {
  return function (
    target: Function,
    context: ClassMethodDecoratorContext,
  ): Function {
    return async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      let lastError: unknown;

      for (let attempt = 1; attempt <= options.attempts; attempt++) {
        try {
          const result = await (target as (...a: unknown[]) => Promise<unknown>).call(
            this,
            ...args,
          );
          return result;
        } catch (err) {
          lastError = err;
          if (attempt < options.attempts) {
            await new Promise((r) =>
              setTimeout(r, options.backoffMs * attempt),
            );
          }
        }
      }

      throw lastError;
    };
  };
}

// VALIDATION DECORATOR — checks preconditions:
function validated(
  target: Function,
  context: ClassMethodDecoratorContext,
): Function {
  return function (this: unknown, ...args: unknown[]) {
    // Extract parameter names using a regex on the function source
    const paramNames = extractParamNames(target);

    for (let i = 0; i < args.length; i++) {
      const value = args[i];
      const paramName = paramNames[i] ?? `arg${i}`;

      if (value === null || value === undefined) {
        throw new Error(
          `[VALIDATION] ${this.constructor.name}.${String(context.name)}: ` +
          `Parameter '${paramName}' (index ${i}) must not be null/undefined`,
        );
      }
    }

    return (target as (...a: unknown[]) => unknown).call(this, ...args);
  };
}

// DECORATOR CHAINING — multiple decorators on one method:
class PaymentService {
  @timed
  @retry({ attempts: 3, backoffMs: 200 })
  @validated
  async processPayment(orderId: string, amount: number) {
    // Real payment processing
    return { orderId, amount, status: "charged" };
  }
}

const svc = new PaymentService();
// Decorators execute BOTTOM to TOP: validated → retry → timed
// So: validate args first, then retry on failure, then time the operation
```

---

🔬 **Section Challenge — 3. Method Decorators**

**Challenge 1 (Reasoning):** You apply three decorators to a single async method: `@cached` (stores result), `@timed` (logs execution time), and `@retry` (retries on failure). The cache decorator returns the cached value *immediately* without calling the original method. But your timing decorator reports the call was instant every time there's a cache hit. Why, and what's the correct fix?

<details><summary>Answer</summary>

**Scenario:** Decorator ordering affecting cross-decorator communication.
**Trace:** Decorators execute from **bottom to top** in the source order:
```
@cached   ← executes LAST (closest to method = highest priority)
@timed    ← executes second
@retry    ← executes FIRST (farthest from method = lowest priority)
```

So execution order is: retry → timed → cached → method.

The problem: when `@cached` hits (returns early), neither `@timed` nor `@retry` execute for that invocation. The caller gets a cached value without any timing or retry logic running — which is actually correct for a cache hit! But the timing decorator registers a call in the log even for hits (because it already ran before the method was called).

**Design issue:** The timing decorator starts the timer BEFORE checking if the method will actually run. For cache hits, this creates misleading metrics.

**Fix options:**
1. **Make `@cached` the top decorator** (farthest from method): `retry → timed → method → cached`. Then the cache check happens BEFORE timing starts. But now retry won't retry on cache failures (there are none — cache doesn't call the method).

2. **Use a context object / shared state** between decorators: Pass a `context` bag through the chain so decorators can coordinate. Stage 3 context objects are per-decorator-instance, not shared.

3. **Refactor the cache decorator** to NOT return early — instead store the result in a shared context that `@timed` can read. But this requires tight coupling.

4. **Best design:** Accept that cached values bypass decorators entirely and emit separate `cache_hit` / `cache_miss` metrics. Separate the concerns completely. The cache should be a separate layer (e.g., in the service client, not as a method decorator).

</details>

## 4. Accessor Decorators — The Getter/Setter Protocol

WHY: Accessor decorators are to getters and setters what method decorators
are to methods. In Stage 3, the `accessor` keyword creates auto-accessors —
fields with auto-generated getter/setter pairs. Accessor decorators receive
both the getter and setter separately, making it possible to intercept
property reads and writes at a finer grain than method decorators.

### Auto-Accessors with Decorators

```typescript
// STAGE 3 ACCESSOR DECORATOR:
function observed(
  value: unknown,
  context: ClassAccessorDecoratorContext
) {
  let stored = value;

  return {
    get() {
      console.log(`[GET] ${String(context.name)}`);
      return stored;
    },
    set(newValue: unknown) {
      console.log(`[SET] ${String(context.name)} = ${newValue}`);
      stored = newValue;
    },
  };
}

// Auto-accessor fields:
class Product {
  @observed
  accessor price: number = 0;

  @observed
  accessor name: string = "";
}

// Stage 3 also supports accessor as a modifier on existing properties:
class Config {
  accessor dbHost: string = "localhost";
  // Equivalent to:
  // private _dbHost: string = "localhost";
  // get dbHost() { return this._dbHost; }
  // set dbHost(v) { this._dbHost = v; }
}
```

### Bounded Method Pattern (Accessors + Methods)

```typescript
// PROBLEM: Class methods lose `this` when passed as callbacks:
// const handler = instance.method;  // `this` is lost!

// SOLUTION: Use an accessor decorator that binds methods:

function bound(
  value: Function,
  context: ClassMethodDecoratorContext
): Function {
  if (context.kind !== "method") {
    throw new Error("@bound can only decorate methods");
  }

  const methodName = context.name;
  return function (this: unknown, ...args: unknown[]) {
    return (value as (...a: unknown[]) => unknown).call(this, ...args);
  } as unknown as Function;
}

// Register a new getter on the class that returns a bound version:
function bound<T extends Function>(
  target: T,
  context: ClassMethodDecoratorContext,
): T {
  const methodName = String(context.name);

  // Add a getter on the prototype that returns a bound method
  Object.defineProperty(target.prototype, methodName, {
    get() {
      // Create and cache the bound function on the instance
      const boundFn = (value as (...a: unknown[]) => unknown).bind(this);
      // Replace the getter so subsequent accesses are instant
      Object.defineProperty(this, methodName, {
        value: boundFn,
        configurable: true,
        writable: true,
      });
      return boundFn;
    },
  });

  return target;
}

class EventEmitter {
  @bound
  onMessage(message: string) {
    console.log("Message:", message);
  }
}

const emitter = new EventEmitter();
const handler = emitter.onMessage; // `this` is preserved!
handler("Hello"); // Works correctly
```

---

🔬 **Section Challenge — 4. Accessor Decorators**

**Challenge 1 (Design):** You want to create a `@readonly` decorator that prevents a property from being modified after initialization (common in "sealed" or "frozen" class patterns). In Stage 3, should this be a method decorator, field decorator, or accessor decorator? What are the trade-offs of each approach?

<details><summary>Answer</summary>

**Scenario:** Implementing a `@readonly` property decorator.
**Trace:** Each approach has different granularity and behavior:

**Field decorator (ClassFieldDecoratorContext):**
- Runs BEFORE the field is initialized
- You get the *initial* value but cannot intercept getter/setter
- Cannot prevent writes because there's no setter to intercept
- Not appropriate for `@readonly`

**Method decorator:**
- Intercepts methods, not properties — wrong level entirely
- Could make a "getter-only method" but that changes the API surface
- Not appropriate

**Accessor decorator (ClassAccessorDecoratorContext):**
- Intercepts getter/setter pairs — you CAN control write access
- With `accessor price` syntax, you receive both getter and setter
- Return `{ get(), set() }` — in the setter, throw on writes after init
- **Correct approach** for `@readonly` on auto-accessor fields

```typescript
function readonly(
  _value: unknown,
  context: ClassAccessorDecoratorContext
) {
  let initialized = false;
  return {
    get() { return _value; },
    set(v: unknown) {
      if (initialized) {
        throw new Error(
          `Cannot reassign readonly property '${String(context.name)}'`,
        );
      }
      _value = v;
      initialized = true;
    },
  };
}

class Config {
  @readonly
  accessor apiKey: string = "";
}

const cfg = new Config();
cfg.apiKey = "new-key"; // ❌ Cannot reassign readonly property 'apiKey'
```

**Trade-off note:** This creates a per-instance setter check, not a class-level freeze. For class-level freezing, use `Object.freeze(this)` in the constructor or `Object.seal` on the prototype. Accessor decorators give instance-level control.

</details>

## 5. Field Decorators & Parameter Decorators — The Granular Hooks

WHY: Field decorators (new in Stage 3) and parameter decorators (legacy)
give you the most granular interception — access to individual constructor
parameters and class fields. While less commonly used in isolation, they are
the backbone of DI frameworks and validation libraries that need to inspect
the shape of a class at the property level.

### Field Decorators (Stage 3)

```typescript
// FIELD DECORATOR SIGNATURE (Stage 3):
type FieldDecorator = (
  value: unknown,                          // Initial value of the field
  context: ClassFieldDecoratorContext
) => unknown;                              // Return new initial value (or transformed)

// Example: Auto-serializable field tracking
function serialized(
  _value: unknown,
  context: ClassFieldDecoratorContext,
): unknown {
  // Register field name in a static set on the constructor
  const serializedFields =
    (context.metadata.serializedFields as Set<string>) ??
    new Set<string>();

  if (!context.metadata.serializedFields) {
    context.metadata.serializedFields = serializedFields;
  }
  (serializedFields as Set<string>).add(String(context.name));

  return _value;
}

class User {
  @serialized
  id: number = 0;

  @serialized
  name: string = "";

  // Not serialized — internal field
  passwordHash: string = "";

  toJSON(): Record<string, unknown> {
    const fields = (this.constructor as typeof User)
      .metadata?.serializedFields as Set<string> | undefined;

    return Object.fromEntries(
      [...(fields ?? [])].map((k) => [k, (this as unknown as Record<string, unknown>)[k]]),
    );
  }
}
```

### Parameter Decorators (Legacy)

```typescript
// PARAMETER DECORATOR (Legacy, Stage 1 proposal):
function inject(
  target: Object,           // The prototype of the class
  propertyKey: string | symbol | undefined, // Method name (undefined for constructor)
  parameterIndex: number,   // Which parameter this decorates
) {
  // Legacy parameter decorators cannot modify behavior directly
  // They can only annotate and store metadata
  // The actual injection logic goes in a class or method decorator
}

// Combined parameter + class decorator DI:
const PARAM_TYPES = Symbol.for("design:paramtypes");

function injectable(target: Function) {
  // Read parameter type hints via emitDecoratorMetadata
  const paramTypes: unknown[] = Reflect.getMetadata(PARAM_TYPES, target) ?? [];
  // Store injection metadata
  (target as unknown as Record<string, unknown>)[PARAM_TYPES] = paramTypes;
}

function resolveAll(target: Function): unknown[] {
  const paramTypes: unknown[] =
    Reflect.getMetadata(PARAM_TYPES, target) ?? [];

  return paramTypes.map((type) => {
    // Find registered implementation for this type
    const impl = typeRegistry.get(type as unknown as string);
    if (!impl) throw new Error(`No provider for ${String(type)}`);
    return typeof impl === "function" ? new impl() : impl;
  });
}

// Usage:
class UserController {
  constructor(
    @inject public userService: UserService,   // Will be injected
    @inject public logger: Logger,              // Will be injected
  ) {}
}

// Note: Parameter decorators require emitDecoratorMetadata: true
// This emits type information at compile time (design:paramtypes)
```

---

## 6. Symbol.metadata — The Hidden Reflection Layer

WHY: Every other TypeScript construct erases at compile time. The type
system exists only for the compiler — it leaves no runtime trace. But
`Symbol.metadata` changes this. It is a per-class symbol that Stage 3
decorators can write to and read from, creating a persistent, inspectable
record of class metadata that survives compilation. This is how frameworks
like Angular and NestJS store type information and configuration without
using the legacy `reflect-metadata` polyfill.

### How Symbol.metadata Works

```typescript
// Symbol.metadata is defined in the ECMAScript spec.
// Every class automatically gets a Symbol.metadata key on its constructor.

class Point {
  x: number = 0;
  y: number = 0;
}

const meta = Point[Symbol.metadata];
console.log(meta); // Metadata object describing the class structure

// In Stage 3, decorators can set this via context.metadata:
function schema(schema: object) {
  return function (
    value: unknown,
    context: ClassDecoratorContext | ClassFieldDecoratorContext,
  ) {
    // context.metadata is a WeakMap-like storage keyed by class identity
    // You can set arbitrary JSON-compatible values
    (context.metadata as Record<string, unknown>)[
      "jsonSchema"
    ] = schema;

    return value;
  };
}

@schema({ type: "object", properties: { x: { type: "number" } } })
class Point {
  @schema({ type: "number" })
  accessor x: number = 0;

  @schema({ type: "number" })
  accessor y: number = 0;
}

// Read at runtime:
const schemaData = Point[Symbol.metadata]?.jsonSchema;
console.log(schemaData); // { type: "object", properties: {...} }
```

### The WeakMap Design Under the Hood

WHY: `Symbol.metadata` is implemented as a **WeakMap keyed by class constructors**.
This means:

1. Metadata is automatically garbage collected when the class has no other references
2. Metadata is scoped to the class identity — no global pollution
3. No `reflect-metadata` polyfill is needed — it's built into the JavaScript runtime

```typescript
// UNDER THE HOOD — what the spec guarantees:
// WeakMap<Constructor, MetadataObject>

// When you write: context.metadata.key = value
// The runtime does: metadataMap.set(constructor, { ...metadata, key: value })

// When you read: Class[Symbol.metadata]
// The runtime does: metadataMap.get(Class)

// This is why decorators CANNOT be tree-shaken out:
// They write to a runtime WeakMap, producing observable side effects.

// Comparison with compile-time-only features:
// interface Person { name: string; }
// → TypeScript ERASES this completely at compile time. Zero runtime footprint.
// class Person { name: string; }
// → Class exists at runtime, but name property is just a property — no metadata.
// @schema(...) class Person { ... }
// → Schema written to Symbol.metadata WeakMap — survives compilation.
```

---

🔬 **Section Challenge — 6. Symbol.metadata**

**Challenge 1 (Reasoning):** TypeScript interfaces are erased at compile time — they have zero runtime footprint. Yet `Symbol.metadata` survives compilation. Explain why this is a deliberate trade-off in TypeScript's design philosophy, and why it makes decorators a fundamentally different kind of type system feature.

<details><summary>Answer</summary>

**Scenario:** Type system's compile-time vs runtime nature.
**Trace:** TypeScript's core philosophy is **gradual typing with erasure** — types exist only for the compiler and are stripped in the output. `interface Person { name: string }` becomes nothing. `class Person { name: string }` becomes a JS class constructor with a name property. Types are annotations that help developers catch errors before runtime.

**Decorators break this philosophy deliberately:** `Symbol.metadata` persists class-level information into runtime. This is intentional because decorators need to communicate across boundaries the type system can't bridge — between TypeScript source code and JavaScript runtime environments, between compile time and framework initialization, between your code and third-party libraries.

**Why this is a fundamental difference:**
- `interface`, `type`, `generics` → Pure compile-time, zero cost
- `decorators` with metadata → Compile-time annotation with runtime persistence
- This is why TS allows mixing typed and untyped code — types are optional
- But decorators create a **contract** — they require the runtime to understand the metadata structure

**Design tension:** Frameworks that use `Symbol.metadata` (Angular's `@Component`, NestJS's `@Controller`) are making a bet that the runtime environment supports Stage 3 decorators (or the legacy reflect-metadata polyfill). If you compile with `isolatedModules: true`, decorators still work because they produce runtime code. The type system's guarantees are separate from the decorator's runtime effects.

**Practical implication:** You CAN use decorators to encode type relationships at runtime, but you lose the type system's automatic erasure guarantee. If your metadata goes stale or is read incorrectly, you'll get runtime errors that TypeScript cannot catch.

</details>

## 7. Real-World Patterns — Where Decorators Actually Ship

WHY: NestJS, Angular, and validation libraries like `class-validator`
have shipped production decorator patterns to millions of developers.
Understanding these patterns reveals what decorator abstractions look like
when they survive contact with real-world complexity.

### NestJS-Style Controller Decorator (Minimal Reproduction)

```typescript
// NESTJS-LIKE HTTP CONTROLLER PATTERN:

// Route registry
const routes: Array<{
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  handler: Function;
  controller: Function;
}> = [];

function Controller(prefix: string) {
  return function (target: Function, context: ClassDecoratorContext) {
    (context.metadata as Record<string, unknown>).routePrefix = prefix;
  };
}

function Get(path: string) {
  return function (
    target: Function,
    context: ClassMethodDecoratorContext,
  ) {
    (context.metadata as Record<string, unknown>).routeMethod = "GET";
    (context.metadata as Record<string, unknown>).routePath = path;
    // Registration deferred until class is fully defined
    setTimeout(() => {
      const prefix = (target as unknown as Record<string, unknown>)
        .constructor?.[Symbol.metadata]?.routePrefix ?? "";
      routes.push({
        method: "GET",
        path: `${prefix}${path}`,
        handler: (target as (...a: unknown[]) => unknown).bind(target),
        controller: target,
      });
    }, 0);
  };
}

// Domain:
interface User { id: number; name: string; email: string; }

@Controller("/users")
class UserController {
  @Get("/") listUsers() {
    return [{ id: 1, name: "Alice", email: "alice@example.com" }];
  }

  @Get("/:id") getUser(id: number): User {
    return { id, name: "Bob", email: "bob@example.com" };
  }
}

// Router function:
function handleRequest(method: string, path: string) {
  const route = routes.find((r) => r.method === method && r.path === path);
  if (!route) return { status: 404, body: "Not Found" };

  try {
    const result = route.handler();
    return { status: 200, body: JSON.stringify(result) };
  } catch (err) {
    return { status: 500, body: String(err) };
  }
}

// Test:
console.log(handleRequest("GET", "/users/"));     // 200
console.log(handleRequest("GET", "/users/42"));   // 200
console.log(handleRequest("POST", "/users/"));    // 404
```

### Validation Decorator Pattern

```typescript
// MINIMAL VALIDATION FRAMEWORK using decorators + Symbol.metadata:

interface ValidationRule {
  validate(value: unknown): boolean;
  message: string;
}

const validators: Map<string | symbol, ValidationRule[]> = new Map();

function MinLength(min: number) {
  return function (
    _value: unknown,
    context: ClassFieldDecoratorContext,
  ) {
    const rules = validators.get(context.name) ?? [];
    rules.push({
      validate: (v) => typeof v === "string" && v.length >= min,
      message: `${String(context.name)} must be at least ${min} chars`,
    });
    validators.set(context.name, rules);
  };
}

function Required() {
  return function (
    _value: unknown,
    context: ClassFieldDecoratorContext,
  ) {
    const rules = validators.get(context.name) ?? [];
    rules.push({
      validate: (v) => v !== null && v !== undefined && v !== "",
      message: `${String(context.name)} is required`,
    });
    validators.set(context.name, rules);
  };
}

// Validator utility:
function validate<T extends object>(instance: T): string[] {
  const errors: string[] = [];
  const entries = Object.entries(instance) as [keyof T, unknown][];

  for (const [key, value] of entries) {
    const rules = validators.get(key);
    if (rules) {
      for (const rule of rules) {
        if (!rule.validate(value)) {
          errors.push(rule.message);
        }
      }
    }
  }
  return errors;
}

// Usage:
class CreateUserRequest {
  @Required()
  @MinLength(3)
  username!: string;

  @Required()
  @MinLength(8)
  password!: string;

  @Required()
  email!: string;
}

const request = new CreateUserRequest();
const errors = validate(request);
console.log(errors);
// [ "username is required", "password is required", "email is required" ]

request.username = "al";
request.password = "short";
request.email = "alice";
console.log(validate(request));
// [ "username must be at least 3 chars", "password must be at least 8 chars" ]
```

### Property-Level Change Detection (Angular-Style)

```typescript
// OnPush-style change detection using accessor decorators:

function observable(
  initialValue: unknown,
  context: ClassAccessorDecoratorContext,
) {
  let current = initialValue;
  const listeners: Set<(v: unknown) => void> = new Set();

  return {
    get() { return current; },
    set(newValue: unknown) {
      if (current !== newValue) {
        const oldValue = current;
        current = newValue;
        // Notify all subscribers
        listeners.forEach((fn) => fn(newValue));
        // Trigger change detection (simulated)
        scheduleReRender(oldValue, newValue);
      }
    },
  };
}

const pendingRenders = new Set<Function>();

function scheduleReRender(oldValue: unknown, newValue: unknown) {
  pendingRenders.add(() => ({ oldValue, newValue }));
}

class CounterComponent {
  @observable
  accessor count: number = 0;

  @observable
  accessor label: string = "Count";
}

const comp = new CounterComponent();

comp.count = 1; // Triggers re-render scheduling
comp.count = 2; // Triggers again (value changed)
comp.label = "Count"; // No re-render (value unchanged)

console.log(pendingRenders.size); // 2 renders scheduled
```

---

## 8. Why Decorators Are a Rare Case Where Runtime Behavior Matters

WHY: TypeScript's type system is famously erased — interfaces, type aliases,
generics, and utility types all disappear in the compiled JavaScript. This
is a deliberate design: TypeScript's types annotate JavaScript without
changing it. Decorators break this contract. They are the one place where
TypeScript annotations produce **persistent, observable runtime changes**.

### The Design Tension

**Compile-time features (pure annotation):**
```typescript
interface User { id: number; name: string; }
type Status = "pending" | "active" | "closed";
function process<T extends object>(item: T): keyof T { /* ... */ }
```
All of the above compile to nothing — pure compile-time checks.

**Decorator features (runtime footprint):**
```typescript
@Injectable()
@Singleton()
class UserService {
  @cached
  @timed
  async findUser(@Required id: string) { /* ... */ }
}
```
The decorator functions run at class definition time. They write to
`Symbol.metadata`, modify PropertyDescriptors, and register metadata
in framework registries. This code produces observable side effects.

### Why This Tension Is Unavoidable

1. **Metadata must survive the type erasure boundary.** When NestJS reads
   `@Controller('/users')`, it needs runtime information to register the
   route. Type information about class fields is gone after compilation.
   The only way to preserve it is through runtime structures like
   `Symbol.metadata`.

2. **Decorator composition requires runtime execution.** Multiple decorators
   on the same declaration must be chained together — this happens at
   runtime when the class is defined. You cannot defer this to static
   analysis because the composition order matters.

3. **Framework integration requires a bridge.** Angular's change detection,
   NestJS's DI container, and MobX's observable system all need to observe
   class structure at runtime. Decorators provide the only standard JavaScript
   mechanism for attaching metadata that survives compilation.

### Consequences for TypeScript Developers

**Compile-time TypeScript features vs decorator-driven metadata —
why the two behave so differently at runtime:**

| Aspect                       | Compile-time feature (interface, type, generic) | Decorator with metadata                                |
|------------------------------|--------------------------------------------------|--------------------------------------------------------|
| Runtime presence             | Fully erased — not in the emitted JS            | Persists as calls to the decorator + reflect-metadata  |
| Bundle-size cost             | Zero                                             | Adds function calls per decorated declaration + a `WeakMap` / `Symbol.metadata` bag |
| Tree-shakeability            | Bundlers strip unused type-level code            | Decorator calls run at class-definition time — not tree-shakable |
| Where errors surface         | `tsc` blocks the build                           | Metadata mismatches only surface when the code runs    |
| Effects                      | Pure annotation (compiler only)                  | Observable side effect (registers, mutates prototype, stores metadata) |
| Runtime validation of payloads | Not provided — use Zod at boundaries           | Not provided by the decorator itself — use Zod / class-validator |

**Rule of thumb.** A wrong decorator annotation is a *compile-time*
bug. Wrong metadata *stored by* a decorator is a *runtime* bug and
only shows up when the decorated code executes. That's why every
serious decorator-based stack (NestJS, TypeORM, Angular) pairs
decorators with runtime validation (Zod, class-validator) — the
decorators wire things together, the validators enforce shape at
the boundary.

**Rule of thumb:** If a decorator is wrong in TypeScript, you get a compile
error. If the **metadata** stored by a decorator is wrong at runtime, you
only find out when the code executes. This is why decorator-heavy frameworks
combine TypeScript type-checking with runtime validation (Zod, class-validator).

---

## 9. Interview Quick-Fire

```
Q: What is the difference between TC39 Stage 3 decorators and
   experimentalDecorators in TypeScript?
→ Stage 3 (TS 5.0+) uses context objects (ClassMethodDecoratorContext,
  etc.), supports the `accessor` keyword, and uses Symbol.metadata.
  Legacy experimentalDecorators (pre-TS 5.0) used positional parameters
  and reflect-metadata polyfill. They are NOT compatible.

Q: Can you return a new class from a class decorator?
→ Yes (Stage 3), but you must preserve the prototype chain to avoid
  breaking instanceof checks. Legacy decorators can return a constructor
  but it often breaks instanceof.

Q: What does Symbol.metadata do, and why does it matter?
→ It stores per-class metadata in a WeakMap keyed by the class constructor.
  Decorators write to it to persist information across the type erasure
  boundary. This is how frameworks store routing, DI, and validation rules.

Q: How do decorator chains execute — top-down or bottom-up?
→ Decorators execute from BOTTOM to TOP (closest to the decorated
  declaration first). The return value of each passes to the next.

Q: Why are decorators considered a runtime feature in a compile-time
   type system?
→ Because decorators modify PropertyDescriptors, write to Symbol.metadata,
  and register framework metadata at class definition time. These are
  observable side effects in JavaScript — not erased type annotations.

Q: How does the `accessor` keyword work in Stage 3?
→ It creates an auto-accessor: a field with auto-generated getter/setter
  pair. It enables accessor decorators to intercept property reads/writes
  and supports private auto-accessors with #name syntax.

Q: What is the limitation of field decorators compared to
   accessor decorators?
→ Field decorators receive only the initial value and cannot intercept
   getter/setter calls. Accessor decorators can control both reads and
   writes. Use accessor for @readonly, @observable patterns.
```

---

[← Deep Reasoning](04_TS_Deep_Reasoning.md) | [Index](../00_MASTER_INDEX.md) | [Next Series → CSS Foundations](../18_CSS_Complete/01_CSS_Foundations.md)

---

## Reality Check

**"Decorators are TypeScript's feature"** → Decorators are a JAVASCRIPT standard (stage 3, shipping) that TypeScript implemented EARLY under a different, incompatible design — and the two-era split is the practical knowledge: experimentalDecorators is the legacy dialect (Angular, NestJS, TypeORM built empires on it, with emitDecoratorMetadata powering their DI via reflect-metadata), while TS 5.0+ implements the standard dialect (different signatures, context objects instead of parameter positions, NO parameter decorators, no metadata emission). Frameworks pin the legacy flag; new standard-mode code cannot use framework decorators expecting the old shape. Which dialect a codebase runs is question one.

**"Decorators are declarative annotations"** → Decorators are FUNCTIONS THAT RUN — at class-definition time, not instantiation: each is called once when the class evaluates, wrapping or replacing what it decorates, in a defined order (bottom-up per member, member-then-class). Consequences people discover in production: decorator side effects fire at import time (module load order matters), a method decorator that returns a wrapper pays its cost on every call forever, and state stashed in decorator closures is CLASS-level shared unless keyed per-instance. "Annotation" thinking treats them as inert labels; they are executed metaprogramming with a lifecycle.

**"DI frameworks read your parameter types at runtime"** → Runtime type reading is a LEGACY-MODE ILLUSION with sharp limits: emitDecoratorMetadata writes design:paramtypes as CONSTRUCTOR REFERENCES — which means interfaces vanish (erased — an interface-typed parameter emits Object, hence injection tokens and @Inject annotations), unions and generics degrade, and circular imports emit undefined (the NestJS forwardRef ceremony exists solely for this). The standard decorator proposal deliberately dropped metadata emission; modern DI is moving to explicit tokens and factory registration. Understanding that the magic was always a compiler-emitted lookup table — and a lossy one — dissolves both the awe and the debugging confusion.

**"Metaprogramming in TS means decorators"** → The TYPE SYSTEM is the metaprogramming surface with better ergonomics for most jobs: mapped types generate derived shapes at compile time (zero runtime), template literal types generate string unions, satisfies validates configuration — while decorators only touch classes, and classes are a shrinking share of TS codebases. The runtime metaprogramming toolkit beyond decorators — Proxy for interception, Reflect for operations, Symbol.hasInstance and friends for protocol hooks — covers the dynamic cases without decorator syntax. Decorators are one aisle in the store; class-centric frameworks made them look like the store.

**"Adopting decorators is a syntax decision"** → It is a TOOLCHAIN COMMITMENT: bundlers and transpilers must agree on the dialect (esbuild/swc/Babel each support the two eras differently — and useDefineForClassFields interacts, changing field-initialization semantics that some legacy decorator patterns silently depended on), test runners must transform identically, and published libraries expose the choice to consumers. The failure mode is version-skew heisenbugs: code that works under ts-node breaks under the bundler because one implements standard and the other legacy. Decorator adoption belongs in an ADR with the pinned dialect and the tool matrix — not in a style guide.
