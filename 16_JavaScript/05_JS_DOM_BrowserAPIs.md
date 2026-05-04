**JavaScript Chapter 5/7** | [â† Previous: Async & Promises](04_JS_Async_Promises.md) | [Index](../00_MASTER_INDEX.md) | [Next â†’ Modern ES6+](06_JS_Modern_ES6Plus.md)

# DOM Manipulation & Browser APIs

## 5W1H â€” Why This Chapter?


WHAT: The DOM (Document Object Model) is the browser's in-memory
representation of your HTML. Browser APIs are the tools
the browser gives JS to interact with the page and more.

WHY:  React abstracts the DOM â€” but you MUST understand what's
underneath. Debugging, performance, third-party libraries,
vanilla JS projects, and interview questions require it.

WHO:  Every frontend developer. Even React devs need DOM
knowledge for refs, portals, and performance tuning.

WHEN: After understanding JS fundamentals + async.

WHERE: Only in browsers (not Node.js). Node has no DOM.

HOW:  HTML â†’ Parser â†’ DOM Tree. JS accesses via `document` API.


---

## 1. What IS the DOM?

```
HTML FILE:                      DOM TREE (in memory):

<html>                          document
  <head>                            â”‚
    <title>Page</title>         â”Œâ”€â”€â”€â”´â”€â”€â”€â”
  </head>                      html     (doctype)
  <body>                       â”Œâ”´â”
    <h1>Hello</h1>           head body
    <p>World</p>              â”‚  â”Œâ”€â”´â”€â”
  </body>                   title h1  p
</html>                      â”‚    â”‚    â”‚
                            "Page" "Hello" "World"
                            (text) (text)  (text)

REASONING: The browser reads HTML text â†’ builds a TREE of NODE
objects. Each HTML tag becomes an Element node. Text becomes a
Text node. This tree IS the DOM. JS can read and modify it.

KEY INSIGHT: The DOM is NOT your HTML file. It's a LIVE object
tree in memory. When JS modifies it, the page updates visually.
```


### Node Types

```javascript
// Everything in the DOM is a NODE. Types:
// Element nodes: <div>, <p>, <h1>         â†’ nodeType = 1
// Text nodes: "Hello World"                â†’ nodeType = 3
// Comment nodes: <!-- comment -->          â†’ nodeType = 8
// Document node: document                  â†’ nodeType = 9

// REASONING: Text is separate from elements!
// <p>Hello</p> is TWO nodes: Element(p) â†’ Text("Hello")
```

---

## 2. Selecting Elements

```javascript
// BY ID (fastest â€” unique per page)
const header = document.getElementById("main-header");
// Returns: HTMLElement or null

// BY CSS SELECTOR (most versatile â€” use this!)
const el = document.querySelector(".card");          // FIRST match
const allCards = document.querySelectorAll(".card");  // ALL matches (NodeList)

// SELECTORS ARE CSS:
document.querySelector("div.container > p:first-child");
document.querySelector("[data-id='42']");
document.querySelector("input[type='email']");
document.querySelectorAll("nav a.active");

// OLD METHODS (still work, less common):
document.getElementsByClassName("card");    // HTMLCollection (live!)
document.getElementsByTagName("p");         // HTMLCollection (live!)
document.getElementsByName("email");        // NodeList

// LIVE vs STATIC:
// getElementsBy* returns LIVE collections â€” auto-update when DOM changes
// querySelectorAll returns STATIC NodeList â€” snapshot at call time
// REASONING: Static is safer (no surprise mutations). Use querySelectorAll.

// NodeList â†’ Array (to use array methods):
const cards = document.querySelectorAll(".card");
const cardsArray = [...cards];         // Spread
// or: Array.from(cards)
cardsArray.filter(card => card.classList.contains("active"));
```

---




## 3. Traversing the DOM

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  GIVEN THIS DOM:                                                     â•‘
â•‘                                                                      â•‘
â•‘  <ul id="list">                   ul#list                            â•‘
â•‘    <li>First</li>                â”Œâ”€â”€â”¼â”€â”€â”                             â•‘
â•‘    <li>Second</li>              li  li  li                           â•‘
â•‘    <li>Third</li>                                                    â•‘
â•‘  </ul>                                                               â•‘
â•‘                                                                      â•‘
â•‘  PARENT:     li.parentElement       â†’ ul                             â•‘
â•‘  CHILDREN:   ul.children            â†’ [li, li, li] (elements)        â•‘
â•‘  FIRST:      ul.firstElementChild   â†’ li (First)                     â•‘
â•‘  LAST:       ul.lastElementChild    â†’ li (Third)                     â•‘
â•‘  NEXT:       li.nextElementSibling  â†’ li (Second)                    â•‘
â•‘  PREV:       li.previousElementSibling â†’ li (First)                  â•‘
â•‘                                                                      â•‘
â•‘  âš  Use *Element* versions (not childNodes/firstChild) to skip        â•‘
â•‘  text nodes (whitespace between tags counts as text nodes!)          â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```


```javascript
const list = document.getElementById("list");

// Parent
list.parentElement;                    // <body> (or whatever wraps it)
list.closest(".container");            // Walk UP to find matching ancestor

// Children
list.children;                         // HTMLCollection of direct children
list.children.length;                  // 3
list.firstElementChild;                // <li>First</li>
list.lastElementChild;                 // <li>Third</li>

// Siblings
const second = list.children[1];
second.nextElementSibling;             // <li>Third</li>
second.previousElementSibling;        // <li>First</li>

// closest() â€” walk UP the tree (very useful!)
// In event handlers:
button.addEventListener("click", (e) => {
    const card = e.target.closest(".card"); // Find parent card
    card.classList.toggle("selected");
});
```

---




## 4. Creating & Modifying Elements

```javascript
// CREATE
const div = document.createElement("div");
div.className = "card";
div.id = "card-1";
div.textContent = "Hello World";             // Text only (safe from XSS)
div.innerHTML = "<strong>Hello</strong>";     // Parses HTML (XSS risk!)

// SET ATTRIBUTES
div.setAttribute("data-id", "42");
div.dataset.id;                              // "42" (dataset maps data-* attrs)
div.style.backgroundColor = "blue";          // Inline style
div.classList.add("active", "visible");
div.classList.remove("hidden");
div.classList.toggle("dark-mode");
div.classList.contains("active");            // true

// APPEND TO DOM
document.body.appendChild(div);             // Add as last child
document.body.prepend(div);                 // Add as first child
document.body.insertBefore(div, reference); // Before specific element

// MODERN (cleaner):
parent.append(div, "text", anotherDiv);    // Multiple items, text ok
parent.prepend(div);
sibling.before(div);                        // Insert before sibling
sibling.after(div);                         // Insert after sibling

// REMOVE
div.remove();                               // Modern
parent.removeChild(div);                    // Old way

// CLONE
const clone = div.cloneNode(true);          // true = deep clone (with children)
const shallow = div.cloneNode(false);       // Just the element, no children

// REPLACE
oldElement.replaceWith(newElement);          // Modern
parent.replaceChild(newElement, oldElement); // Old way
```

### Performance: DocumentFragment

```javascript
// âŒ BAD: Each appendChild triggers a reflow/repaint
for (let i = 0; i < 1000; i++) {
    const li = document.createElement("li");
    li.textContent = `Item ${i}`;
    list.appendChild(li); // 1000 DOM updates!
}

// âœ… GOOD: Build in a fragment, then append ONCE
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
    const li = document.createElement("li");
    li.textContent = `Item ${i}`;
    fragment.appendChild(li); // No DOM update yet
}
list.appendChild(fragment); // ONE DOM update!

// REASONING: DOM operations are expensive because each change may
// trigger the browser to recalculate layout (reflow) and repaint.
// Batching changes into a fragment minimizes these operations.
// This is EXACTLY what React's Virtual DOM does automatically.
```

---




## 5. Events â€” How User Interaction Works

### 5W1H: The Event System

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  WHAT: Events are signals that something happened â€” click, type,     â•‘
â•‘        scroll, load, resize, etc. Event listeners react to them.     â•‘
â•‘                                                                      â•‘
â•‘  WHY:  This is the bridge between user actions and your code.        â•‘
â•‘        Every interactive web page uses events.                       â•‘
â•‘                                                                      â•‘
â•‘  HOW:  Events PROPAGATE through the DOM in 3 phases:                 â•‘
â•‘                                                                      â•‘
â•‘  Phase 1: CAPTURING (top â†’ target)                                   â•‘
â•‘           document â†’ html â†’ body â†’ div â†’ button                      â•‘
â•‘                                                                      â•‘
â•‘  Phase 2: TARGET (the element that was clicked)                      â•‘
â•‘           button â† event fires here                                  â•‘
â•‘                                                                      â•‘
â•‘  Phase 3: BUBBLING (target â†’ top) â† DEFAULT!                         â•‘
â•‘           button â†’ div â†’ body â†’ html â†’ document                      â•‘
â•‘                                                                      â•‘
â•‘  ANALOGY: Drop a stone in a pond.                                    â•‘
â•‘  Capturing = stone going down. Bubbling = ripples coming up.         â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```


```
EVENT PROPAGATION VISUAL:

â”Œâ”€â”€â”€ document â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  â‘  Capture â†“                          â‘¢ Bubble â†‘      â”‚
â”‚  â”Œâ”€â”€â”€ body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚  â‘  â†“                                  â‘¢ â†‘    â”‚     â”‚
â”‚  â”‚  â”Œâ”€â”€â”€ div.container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚    â”‚
â”‚  â”‚  â”‚  â‘  â†“                          â‘¢ â†‘     â”‚   â”‚     â”‚
â”‚  â”‚  â”‚  â”Œâ”€â”€â”€ button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚   â”‚    â”‚
â”‚  â”‚  â”‚  â”‚                                â”‚    â”‚   â”‚    â”‚
â”‚  â”‚  â”‚  â”‚  â‘¡ TARGET â€” event fires here  â”‚    â”‚   â”‚     â”‚
â”‚  â”‚  â”‚  â”‚                                â”‚    â”‚   â”‚    â”‚
â”‚  â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚   â”‚    â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```


```javascript
// ADDING EVENT LISTENERS:
const button = document.querySelector("#myButton");

button.addEventListener("click", function(event) {
    console.log(event.target);       // The element that was clicked
    console.log(event.currentTarget); // The element with the listener
    console.log(event.type);         // "click"

    // Stop bubbling:
    event.stopPropagation();

    // Prevent default browser behavior:
    event.preventDefault(); // e.g., stop form submission, link navigation
});

// REMOVE listener (need same function reference):
const handler = (e) => console.log("clicked");
button.addEventListener("click", handler);
button.removeEventListener("click", handler);

// CAPTURE phase listener (rarely needed):
parent.addEventListener("click", handler, true);  // true = capture
parent.addEventListener("click", handler, { capture: true }); // Same

// ONCE (auto-removes after first fire):
button.addEventListener("click", handler, { once: true });
```

### Event Delegation â€” The Most Important Pattern

```javascript
// âŒ BAD: One listener per button (100 buttons = 100 listeners)
document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", handleDelete);
});

// âœ… GOOD: One listener on parent, delegate via event.target
document.querySelector("#todo-list").addEventListener("click", (e) => {
    if (e.target.matches(".delete-btn")) {
        const todoItem = e.target.closest(".todo-item");
        todoItem.remove();
    }
    if (e.target.matches(".edit-btn")) {
        // Handle edit
    }
});

// WHY delegation?
// 1. Memory efficient â€” 1 listener instead of 100
// 2. Works for DYNAMICALLY ADDED elements (future items too!)
// 3. This is exactly what React does under the hood â€” it attaches
//    ONE listener to the root and delegates all events.
```

### Common Events Reference

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  MOUSE:     click, dblclick, mouseenter, mouseleave, mousemove       â•‘
â•‘  KEYBOARD:  keydown, keyup, keypress (deprecated)                    â•‘
â•‘  FORM:      submit, change, input, focus, blur, reset                â•‘
â•‘  WINDOW:    load, DOMContentLoaded, resize, scroll, beforeunload     â•‘
â•‘  TOUCH:     touchstart, touchmove, touchend                          â•‘
â•‘  DRAG:      dragstart, drag, dragover, drop, dragend                 â•‘
â•‘  CLIPBOARD: copy, cut, paste                                         â•‘
â•‘                                                                      â•‘
â•‘  input vs change:                                                    â•‘
â•‘  â€¢ input: fires on EVERY keystroke/change (real-time)                â•‘
â•‘  â€¢ change: fires when element LOSES FOCUS (on blur)                  â•‘
â•‘  For real-time search: use "input". For form fields: "change".       â•‘
â•‘                                                                      â•‘
â•‘  DOMContentLoaded vs load:                                           â•‘
â•‘  â€¢ DOMContentLoaded: DOM is ready (HTML parsed). Scripts can run.    â•‘
â•‘  â€¢ load: EVERYTHING loaded (images, CSS, iframes).                   â•‘
â•‘  RULE: Use DOMContentLoaded for JS initialization.                   â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```


---




## 6. Forms & Validation

```javascript
const form = document.querySelector("#signup-form");

form.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent page reload!

    // Get form data (modern way):
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    // { email: "user@test.com", password: "123", name: "Harsha" }

    // Validate:
    if (!data.email.includes("@")) {
        showError("Invalid email");
        return;
    }

    // Send to API:
    fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
});

// INDIVIDUAL INPUT ACCESS:
const email = form.elements.email;         // By name attribute
const email2 = form.querySelector("[name='email']");
email.value;                                // Current value
email.validity.valid;                       // Built-in validation
email.validity.typeMismatch;               // Email format check
email.setCustomValidity("Custom error");   // Custom validation message

// HTML5 VALIDATION ATTRIBUTES:
// <input required>                 â€” must fill
// <input type="email">            â€” email format
// <input minlength="8">           â€” minimum length
// <input pattern="[A-Za-z]+">     â€” regex pattern
// <input min="0" max="100">       â€” number range
```

---

## 7. Browser Storage APIs

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Feature       â”‚ localStorageâ”‚ session  â”‚ Cookies  â”‚ IndexedDB â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Capacity      â”‚ ~5-10 MB   â”‚ ~5 MB    â”‚ ~4 KB    â”‚ Large      â”‚
â”‚ Persistence   â”‚ Forever    â”‚ Tab closeâ”‚ Expires  â”‚ Forever    â”‚
â”‚ Sent to serverâ”‚ No         â”‚ No       â”‚ Yes (!)  â”‚ No         â”‚
â”‚ Scope         â”‚ Origin     â”‚ Tab+originâ”‚ Domain  â”‚ Origin     â”‚
â”‚ API           â”‚ Simple     â”‚ Simple   â”‚ Complex  â”‚ Complex    â”‚
â”‚ Data type     â”‚ String onlyâ”‚ String   â”‚ String   â”‚ Any        â”‚
â”‚ Sync/Async    â”‚ Sync       â”‚ Sync     â”‚ Sync     â”‚ Async      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

USE CASES:
â€¢ localStorage: dark mode pref, cart items, form drafts
â€¢ sessionStorage: one-time banners, wizard progress
â€¢ Cookies: authentication (httpOnly cookies), tracking
â€¢ IndexedDB: offline apps, large data, file caching
```


```javascript
// localStorage (persists forever until cleared):
localStorage.setItem("theme", "dark");
localStorage.getItem("theme");           // "dark"
localStorage.removeItem("theme");
localStorage.clear();                    // Remove ALL

// Store objects (must serialize):
const user = { name: "Harsha", prefs: { theme: "dark" } };
localStorage.setItem("user", JSON.stringify(user));
const stored = JSON.parse(localStorage.getItem("user"));

// sessionStorage (same API, clears when tab closes):
sessionStorage.setItem("wizard-step", "3");

// Listen for storage changes (cross-tab communication!):
window.addEventListener("storage", (e) => {
    console.log(`Key ${e.key} changed from ${e.oldValue} to ${e.newValue}`);
});
// Fires when ANOTHER tab changes localStorage. Not the current tab.
```

---

## 8. Fetch API â€” Making HTTP Requests

```javascript
// BASIC GET:
const response = await fetch("https://api.example.com/users");
const data = await response.json();

// IMPORTANT: fetch only rejects on NETWORK errors.
// 404 and 500 are NOT rejections â€” check response.ok!
if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
}

// POST with JSON body:
const newUser = await fetch("https://api.example.com/users", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ name: "Harsha", email: "h@test.com" })
});

// PUT, DELETE:
await fetch(`/api/users/${id}`, { method: "DELETE" });
await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData)
});

// UPLOAD FILE:
const formData = new FormData();
formData.append("file", fileInput.files[0]);
await fetch("/api/upload", { method: "POST", body: formData });
// Don't set Content-Type â€” browser sets it with boundary automatically!

// Response methods:
response.json();   // Parse as JSON
response.text();   // Plain text
response.blob();   // Binary (images, files)
response.headers;  // Headers object
response.status;   // 200, 404, etc.
response.ok;       // true if status 200-299
```

---



ðŸ”¬ **Section Challenge â€” 8. Fetch API â€” Making HTTP Requests**

**Challenge 1 (Reasoning):** `Connection: keep-alive` vs HTTP/2 â€” what does each one do differently for multiplexing?
<details><summary>Answer</summary>

HTTP/1.1 keep-alive: reuse ONE TCP connection for sequential requests. Still head-of-line blocking â€” request 2 waits for response 1. HTTP/2: one TCP connection, but requests are multiplexed as frames with stream IDs. Multiple requests in-flight simultaneously. Response frames for different streams are interleaved. HTTP/2 also has header compression (HPACK) and server push. Still has TCP HOL blocking (one lost packet blocks all streams). HTTP/3 (QUIC): uses UDP, per-stream reliability, eliminates TCP HOL blocking entirely.
</details>


## 9. Other Essential Browser APIs

```javascript
// INTERSECTION OBSERVER (lazy loading, infinite scroll)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.src = entry.target.dataset.src; // Load image
            observer.unobserve(entry.target);            // Stop watching
        }
    });
}, { threshold: 0.1 }); // Trigger when 10% visible

document.querySelectorAll("img[data-src]").forEach(img => observer.observe(img));

// MUTATION OBSERVER (watch DOM changes)
const observer2 = new MutationObserver((mutations) => {
    mutations.forEach(m => console.log("DOM changed:", m));
});
observer2.observe(document.body, { childList: true, subtree: true });

// RESIZE OBSERVER (responsive without media queries)
const resizeObs = new ResizeObserver(entries => {
    entries.forEach(e => {
        console.log("New size:", e.contentRect.width, e.contentRect.height);
    });
});
resizeObs.observe(document.querySelector("#myElement"));

// HISTORY API (SPA routing)
history.pushState({ page: 2 }, "Page 2", "/page/2");
history.replaceState(state, title, url);
history.back();
history.forward();
window.addEventListener("popstate", (e) => {
    console.log("Navigation:", e.state);
});

// CLIPBOARD API
await navigator.clipboard.writeText("Copied text!");
const text = await navigator.clipboard.readText();

// GEOLOCATION
navigator.geolocation.getCurrentPosition(
    pos => console.log(pos.coords.latitude, pos.coords.longitude),
    err => console.error(err)
);
```

---

## 10. Why React Exists â€” The DOM Problem

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  THE PROBLEM WITH MANUAL DOM MANIPULATION:                           â•‘
â•‘                                                                      â•‘
â•‘  1. Imperative: You tell the DOM WHAT to do, step by step.           â•‘
â•‘     "Find this element, change its text, add this class..."          â•‘
â•‘     â†’ Complex apps become spaghetti code.                            â•‘
â•‘                                                                      â•‘
â•‘  2. State Sync: Your data (state) and the DOM can get out of         â•‘
â•‘     sync. Update one, forget the other â†’ bugs.                       â•‘
â•‘                                                                      â•‘
â•‘  3. Performance: Each DOM change = reflow + repaint.                 â•‘
â•‘     100 small changes = 100 reflows (expensive!).                    â•‘
â•‘                                                                      â•‘
â•‘  REACT'S SOLUTION:                                                   â•‘
â•‘                                                                      â•‘
â•‘  1. Declarative: Describe WHAT the UI should look like.              â•‘
â•‘     React figures out HOW to update the DOM.                         â•‘
â•‘                                                                      â•‘
â•‘  2. Virtual DOM: React diffs a virtual tree, then applies            â•‘
â•‘     MINIMAL real DOM changes (batched for performance).              â•‘
â•‘                                                                      â•‘
â•‘  3. One-way data flow: State â†’ UI. Change state, UI updates          â•‘
â•‘     automatically. No manual sync.                                   â•‘
â•‘                                                                      â•‘
â•‘  BUT: Understanding the real DOM helps you debug React, use refs,    â•‘
â•‘  optimize performance, and write vanilla JS when needed.             â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```


---

## Interview Quick-Fire

```
Q: What is event delegation?
â†’ Attach one listener to a parent instead of many to children.
  Use event.target to determine which child was clicked.
  Benefits: memory efficient, works for dynamic elements.

Q: Difference between event.target and event.currentTarget?
â†’ target: the element that TRIGGERED the event (was clicked).
  currentTarget: the element the LISTENER is attached to.

Q: What is event bubbling?
â†’ After an event fires on target, it "bubbles up" through ancestors.
  button â†’ div â†’ body â†’ html â†’ document.
  Use stopPropagation() to stop it.

Q: DOMContentLoaded vs load event?
â†’ DOMContentLoaded: HTML parsed, DOM ready (images may still load).
  load: EVERYTHING loaded (images, CSS, iframes, fonts).

Q: How to store user preferences client-side?
â†’ localStorage for persistent prefs (theme, language).
  sessionStorage for temporary data (wizard step).
  Cookies for auth tokens (httpOnly, secure).

Q: How does React's Virtual DOM relate to the real DOM?
â†’ React creates a JS object tree (virtual DOM). On state change,
  it diffs old vs new virtual trees, calculates minimum changes,
  then applies only those to the real DOM (reconciliation).
```


---

[â† Previous: Async & Promises](04_JS_Async_Promises.md) | [Index](../00_MASTER_INDEX.md) | [Next â†’ Modern ES6+](06_JS_Modern_ES6Plus.md)

---
