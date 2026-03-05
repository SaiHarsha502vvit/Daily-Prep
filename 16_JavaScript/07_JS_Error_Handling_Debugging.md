> **JavaScript Chapter 7/7** | [← Previous: Modern ES6+](06_JS_Modern_ES6Plus.md) | [Index](../00_MASTER_INDEX.md)

# Error Handling & Debugging — Writing Bulletproof Code

## 5W1H — Why This Chapter?

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: How to catch, handle, and debug errors in JavaScript.         ║
║        Covers try/catch, custom errors, debugging tools, and         ║
║        patterns for production-ready error handling.                 ║
║                                                                      ║
║  WHY:  Every app has errors. The difference between a junior and     ║
║        senior developer is how they HANDLE errors. Unhandled         ║
║        errors crash apps, lose data, and frustrate users.            ║
║                                                                      ║
║  WHO:  Everyone — frontend (API failures, user input), backend       ║
║        (DB errors, network issues), React (error boundaries).        ║
║                                                                      ║
║  WHEN: From day one. Error handling isn't an afterthought.           ║
║                                                                      ║
║  HOW:  try/catch for sync, .catch for promises, Error Boundaries     ║
║        for React, global handlers as safety nets.                    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 1. Error Types in JavaScript

```
╔══════════════════════════════════════════════════════════════════════╗
║  BUILT-IN ERROR TYPES:                                               ║
║  ┌───────────────────┬─────────────────────────────────────────┐     ║
║  │ Type              │ When It Occurs                          │     ║
║  ├───────────────────┼─────────────────────────────────────────┤     ║
║  │ SyntaxError       │ Invalid code: if ( { → parsing fails   │      ║
║  │ ReferenceError    │ Accessing undefined variable            │     ║
║  │ TypeError         │ Wrong type operation: null.map()       │      ║
║  │ RangeError        │ Number out of range: new Array(-1)     │      ║
║  │ URIError          │ Bad URI: decodeURI("%")                │      ║
║  │ EvalError         │ Old eval() error (rarely seen)         │      ║
║  │ AggregateError    │ Promise.any() all reject               │      ║
║  │ InternalError     │ Engine error: too much recursion (FF)  │      ║
║  └───────────────────┴─────────────────────────────────────────┘     ║
║                                                                      ║
║  ALL inherit from Error → has: message, name, stack (trace)          ║
║                                                                      ║
║  MOST COMMON in practice:                                            ║
║  TypeError (cannot read property of undefined) — #1 JS error         ║
║  ReferenceError (variable is not defined)                            ║
╚══════════════════════════════════════════════════════════════════════╝
```

```javascript
// ANATOMY of an Error:
const err = new Error("Something went wrong");
err.message; // "Something went wrong"
err.name;    // "Error"
err.stack;   // Stack trace (varies by engine)
// Error: Something went wrong
//     at Object.<anonymous> (file.js:1:13)
//     at Module._compile (node:internal/modules/cjs/loader:1376:14)

// Error with cause (ES2022):
try {
    await fetch("/api");
} catch (networkErr) {
    throw new Error("Failed to load user data", { cause: networkErr });
    // Now the original error is chained for debugging
}
```

---

## 2. try/catch/finally

```javascript
// BASIC:
try {
    const data = JSON.parse(badJson);
} catch (error) {
    console.error("Parse failed:", error.message);
} finally {
    console.log("This ALWAYS runs — success or failure");
}

// IMPORTANT RULES:
// 1. catch sees errors thrown in the try block ONLY
// 2. finally runs EVEN if catch throws or try returns
// 3. try/catch is SYNCHRONOUS — it can't catch async errors!

// ❌ WRONG — catch won't work for async:
try {
    setTimeout(() => { throw new Error("Async!"); }, 100);
} catch (e) {
    // This NEVER catches the error!
}

// ✅ RIGHT — catch async errors with async/await:
try {
    const response = await fetch("/api/data");
    const data = await response.json();
} catch (error) {
    // This DOES catch fetch/json errors
}

// OR with promises:
fetch("/api/data")
    .then(r => r.json())
    .catch(error => console.error(error));

// PATTERN: Selective catching
try {
    riskyOperation();
} catch (error) {
    if (error instanceof TypeError) {
        console.log("Type issue:", error.message);
    } else if (error instanceof RangeError) {
        console.log("Range issue:", error.message);
    } else {
        throw error; // Re-throw unknown errors — don't swallow them!
    }
}
```

---

## 3. Custom Error Classes

```javascript
// WHY: Built-in errors are generic. Custom errors carry context.

class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.timestamp = new Date().toISOString();
    }
}

class ValidationError extends AppError {
    constructor(field, message) {
        super(message, 400, "VALIDATION_ERROR");
        this.name = "ValidationError";
        this.field = field;
    }
}

class NotFoundError extends AppError {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`, 404, "NOT_FOUND");
        this.name = "NotFoundError";
        this.resource = resource;
        this.id = id;
    }
}

class AuthenticationError extends AppError {
    constructor(message = "Authentication required") {
        super(message, 401, "AUTH_REQUIRED");
        this.name = "AuthenticationError";
    }
}

// USAGE:
function getUser(id) {
    const user = db.find(id);
    if (!user) throw new NotFoundError("User", id);
    return user;
}

try {
    const user = getUser(999);
} catch (error) {
    if (error instanceof NotFoundError) {
        res.status(error.statusCode).json({
            error: error.errorCode,
            message: error.message,
            resource: error.resource
        });
    } else if (error instanceof AuthenticationError) {
        res.redirect("/login");
    } else {
        // Unexpected error — log and return generic message
        logger.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}
```

---

## 4. Error Handling Patterns

```javascript
// PATTERN 1: Error-First Callbacks (Node.js convention)
fs.readFile("file.txt", (err, data) => {
    if (err) {
        console.error("Read failed:", err.message);
        return;
    }
    console.log(data);
});

// PATTERN 2: Result/Tuple Pattern (inspired by Go)
async function safeAsync(promise) {
    try {
        const result = await promise;
        return [null, result];
    } catch (error) {
        return [error, null];
    }
}
const [err, user] = await safeAsync(fetchUser(1));
if (err) { /* handle */ }

// PATTERN 3: Optional/Maybe (functional approach)
class Result {
    constructor(value, error) {
        this.value = value;
        this.error = error;
    }
    static ok(value)    { return new Result(value, null); }
    static fail(error)  { return new Result(null, error); }
    isOk()   { return this.error === null; }
    isFail() { return this.error !== null; }
    
    map(fn) {
        if (this.isOk()) return Result.ok(fn(this.value));
        return this;
    }
}

function parseAge(input) {
    const age = parseInt(input);
    if (isNaN(age)) return Result.fail("Not a number");
    if (age < 0)    return Result.fail("Age cannot be negative");
    return Result.ok(age);
}

parseAge("25").map(age => age * 2);  // Result.ok(50)
parseAge("abc").map(age => age * 2); // Result.fail("Not a number")

// PATTERN 4: Global Error Handlers (safety nets)
// Browser:
window.addEventListener("error", (event) => {
    logToService({ message: event.message, stack: event.error?.stack });
});
window.addEventListener("unhandledrejection", (event) => {
    logToService({ message: event.reason?.message || event.reason });
    event.preventDefault(); // Prevent default console error
});

// Node.js:
process.on("uncaughtException", (err) => {
    logger.fatal(err);
    process.exit(1); // MUST exit — state is corrupted
});
process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection:", reason);
});
```

---

## 5. Input Validation — Preventing Errors

```javascript
// DEFENSIVE PROGRAMMING: Validate inputs at boundaries.

function createUser(data) {
    // GUARD CLAUSES — fail fast with clear messages
    if (!data) throw new ValidationError("data", "User data is required");
    if (!data.name?.trim()) throw new ValidationError("name", "Name is required");
    if (!data.email?.includes("@")) throw new ValidationError("email", "Invalid email");
    if (typeof data.age !== "number" || data.age < 0 || data.age > 150) {
        throw new ValidationError("age", "Age must be 0-150");
    }
    
    // If we get here, data is valid
    return {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        age: Math.floor(data.age)
    };
}

// SCHEMA VALIDATION (for complex objects):
// In production, use: Zod, Joi, Yup
// Example with Zod:
import { z } from "zod";

const UserSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    age: z.number().int().min(0).max(150),
    role: z.enum(["admin", "user", "viewer"]).default("user")
});

// Type-safe + runtime validation:
const user = UserSchema.parse(rawInput); // Throws ZodError if invalid
const result = UserSchema.safeParse(rawInput); // { success, data/error }
```

---

## 6. Debugging with Chrome DevTools

```
╔══════════════════════════════════════════════════════════════════════╗
║  OPENING DEVTOOLS: F12 or Ctrl+Shift+I (Cmd+Opt+I on Mac)            ║
║                                                                      ║
║  ┌─────────────────────────────────────────────────────────┐         ║
║  │  CONSOLE | SOURCES | NETWORK | PERFORMANCE | MEMORY     │         ║
║  └─────────────────────────────────────────────────────────┘         ║
║                                                                      ║
║  CONSOLE TAB:                                                        ║
║  • console.log()    — general output                                 ║
║  • console.error()  — red, with stack trace                          ║
║  • console.warn()   — yellow warning                                 ║
║  • console.table()  — display arrays/objects as TABLE                ║
║  • console.group()  — group related logs                             ║
║  • console.time()   — start timer                                    ║
║  • console.timeEnd()— end timer, show elapsed                        ║
║  • console.trace()  — print stack trace from this point              ║
║  • console.assert() — log only if condition is FALSE                 ║
║  • console.count()  — count how many times this line runs            ║
║  • console.dir()    — show object as expandable tree                 ║
╚══════════════════════════════════════════════════════════════════════╝
```

```javascript
// ADVANCED CONSOLE TECHNIQUES:

// Table (great for arrays of objects):
console.table([
    { name: "Harsha", age: 24 },
    { name: "Alice", age: 28 }
]);
//  ┌─────────┬──────────┬─────┐
//  │ (index) │ name     │ age │
//  ├─────────┼──────────┼─────┤
//  │ 0       │ "Harsha" │ 24  │
//  │ 1       │ "Alice"  │ 28  │
//  └─────────┴──────────┴─────┘

// Grouping:
console.group("User Loading");
console.log("Fetching...");
console.log("Parsing...");
console.groupEnd();

// Timing:
console.time("fetch");
await fetch("/api/data");
console.timeEnd("fetch"); // fetch: 432ms

// Conditional logging:
console.assert(user.age > 0, "Age should be positive!", user);
// Only logs if the condition is FALSE

// Styled console:
console.log(
    "%c Big Error! ",
    "background: red; color: white; font-size: 20px; padding: 5px;"
);
```

### Breakpoint Debugging

```
╔══════════════════════════════════════════════════════════════════════╗
║  SOURCES TAB — Step through code line by line:                       ║
║                                                                      ║
║  BREAKPOINT TYPES:                                                   ║
║  1. Click line number in Sources tab → line breakpoint               ║
║  2. debugger; statement in code → programmatic breakpoint            ║
║  3. Conditional breakpoint (right-click line → add condition)        ║
║  4. DOM breakpoint (right-click element → break on modification)     ║
║  5. XHR/fetch breakpoint (break when URL matches)                    ║
║  6. Event listener breakpoint (break on specific events)             ║
║                                                                      ║
║  STEPPING CONTROLS:                                                  ║
║  ┌──────────────────────────────────────────────┐                    ║
║  │  ▶ Resume      — continue until next breakpoint                   ║
║  │  ⤵ Step Over   — execute line, don't enter functions              ║
║  │  ⤓ Step Into   — enter the function on this line                  ║
║  │  ⤴ Step Out    — finish current function, return to caller        ║
║  └──────────────────────────────────────────────┘                    ║
║                                                                      ║
║  SCOPE PANEL: See all variables in current scope.                    ║
║  WATCH PANEL: Add expressions to monitor.                            ║
║  CALL STACK: See the chain of function calls.                        ║
╚══════════════════════════════════════════════════════════════════════╝
```

```javascript
// debugger statement — breakpoint in code
function processData(data) {
    const filtered = data.filter(d => d.active);
    debugger; // Execution pauses here in DevTools
    const mapped = filtered.map(d => d.name);
    return mapped;
}

// TIP: Remove or guard debugger statements before production!
// In development:
if (process.env.NODE_ENV === "development") {
    debugger;
}
```

---

## 7. Common Debugging Strategies

```
╔══════════════════════════════════════════════════════════════════════╗
║  STRATEGY 1: "BINARY SEARCH" DEBUGGING                               ║
║  • Put a console.log halfway through the suspect code.               ║
║  • Is the data correct at that point?                                ║
║  • If yes → problem is in the second half. If no → first half.       ║
║  • Repeat, narrowing down. Usually 3-4 iterations to find it.        ║
║                                                                      ║
║  STRATEGY 2: "RUBBER DUCK" DEBUGGING                                 ║
║  • Explain the code out loud, line by line, to a rubber duck.        ║
║  • The act of explaining often reveals the assumption you missed.    ║
║                                                                      ║
║  STRATEGY 3: "WHAT CHANGED?" DEBUGGING                               ║
║  • It was working before. What changed?                              ║
║  • git diff to see recent changes.                                   ║
║  • Revert changes one by one until it works again.                   ║
║                                                                      ║
║  STRATEGY 4: "MINIMAL REPRODUCTION"                                  ║
║  • Strip away everything until you have the smallest code            ║
║  • that still reproduces the bug. The bug becomes obvious.           ║
║                                                                      ║
║  STRATEGY 5: "READ THE ERROR MESSAGE"                                ║
║  • Seriously. Read the WHOLE error message. Read the stack trace.    ║
║  • The file and line number are there. Most errors tell you          ║
║  • exactly what's wrong. Don't just look at the first line.          ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 8. Production Error Monitoring

```javascript
// STRUCTURED ERROR LOGGING:
class ErrorReporter {
    static report(error, context = {}) {
        const errorData = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...context
        };
        
        // Send to error tracking service:
        // Sentry, Datadog, LogRocket, Bugsnag
        fetch("/api/errors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(errorData)
        }).catch(() => {
            // If error reporting fails, log locally
            console.error("Failed to report error:", errorData);
        });
    }
}

// Global handlers:
window.onerror = (msg, src, line, col, error) => {
    ErrorReporter.report(error || new Error(msg), { src, line, col });
};

window.onunhandledrejection = (event) => {
    ErrorReporter.report(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: "unhandledRejection" }
    );
};

// REACT ERROR BOUNDARY (class component — the only way):
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        ErrorReporter.report(error, { componentStack: errorInfo.componentStack });
    }
    
    render() {
        if (this.state.hasError) {
            return <div>Something went wrong. <button onClick={() => 
                this.setState({ hasError: false })}>Try Again</button></div>;
        }
        return this.props.children;
    }
}

// Usage: <ErrorBoundary><App /></ErrorBoundary>
```

---

## 9. Error Handling Checklist

```
╔══════════════════════════════════════════════════════════════════════╗
║  ✅ ALWAYS handle promise rejections (.catch or try/catch)            ║
║  ✅ NEVER swallow errors silently (catch(e) { /* empty */ })          ║
║  ✅ Use specific error types (ValidationError, NotFoundError)         ║
║  ✅ Validate inputs at module boundaries (API, user input)            ║
║  ✅ Add global error handlers as safety nets                          ║
║  ✅ Include context in errors (user ID, operation, input data)        ║
║  ✅ Use Error.cause to chain errors (preserve original)               ║
║  ✅ Log errors with structure (JSON, not string concatenation)        ║
║  ✅ Have an error monitoring service in production                    ║
║  ✅ Test error paths (not just happy paths)                           ║
║  ✅ Use TypeScript for compile-time error prevention                  ║
║  ✅ React: Use Error Boundaries for component tree failures           ║
║  ✅ Remove debugger statements before committing                      ║
║  ✅ Return meaningful error messages to users (not stack traces!)     ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Interview Quick-Fire

```
Q: How do you handle errors in async/await?
→ Wrap in try/catch. For unhandled cases, use global handlers
  (window.onunhandledrejection, process.on("unhandledRejection")).

Q: What is the difference between throw and return?
→ throw stops execution and unwinds the stack looking for a catch.
  return just exits the current function with a value.

Q: What is an Error Boundary in React?
→ A class component with getDerivedStateFromError and/or
  componentDidCatch. Catches errors in child component tree
  during rendering. Can't catch: events, async, server-side.

Q: How to debug a production issue with no reproduction steps?
→ Check error monitoring tools (Sentry/Datadog), look at logs,
  check recent deployments (git log), check metrics for anomalies,
  try to reproduce with same user data/settings.

Q: Custom Error classes — when and why?
→ When built-in Error types are too generic. Custom errors carry
  context (HTTP status, error codes, affected fields) and can be
  caught selectively with instanceof.
```

---

> **End of JavaScript Series** | [← Previous: Modern ES6+](06_JS_Modern_ES6Plus.md) | [Index](../00_MASTER_INDEX.md)
>
> **Next Series:** [TypeScript Foundations →](../17_TypeScript/01_TS_Foundations.md)
