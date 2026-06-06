// ═══════════════════════════════════════════════════════════════════════
// CHALLENGE 1: Vanilla JS — The Data-to-DOM Sync Problem
// ═══════════════════════════════════════════════════════════════════════
//
// ┌──────────────────────────────────────────────────────────────────┐
// │ WHY THIS CHALLENGE EXISTS                                        │
// │                                                                  │
// │ React, Vue, and Svelte all solve the SAME fundamental problem:   │
// │ "How do I keep a JavaScript array and the visible DOM in sync?"  │
// │                                                                  │
// │ Before frameworks existed, developers had to do this manually.   │
// │ If you understand THIS challenge, you understand what React's    │
// │ virtual DOM does for you automatically.                          │
// │                                                                  │
// │ Every time you call setState() in React, React internally runs   │
// │ a "diff" on the virtual DOM and then performs the EXACT same     │
// │ createElement/appendChild/removeChild calls you'll write here.   │
// └──────────────────────────────────────────────────────────────────┘
//
// ─── THE HIDDEN KNOWLEDGE ────────────────────────────────────────────
//
// 1. innerHTML vs createElement — THE REAL DIFFERENCE:
//
//    innerHTML = "..."
//    ┌──────────────────────────────────────────────────────────────┐
//    │ Step 1: Browser SERIALIZES existing children to a string     │
//    │ Step 2: Browser CONCATENATES your new string                 │
//    │ Step 3: Browser PARSES the entire combined HTML string       │
//    │ Step 4: Browser DESTROYS all old DOM nodes (triggers GC)     │
//    │ Step 5: Browser CREATES brand new DOM nodes from parse tree  │
//    │ Step 6: All previous addEventListener() calls are GONE       │
//    │         because those listeners were attached to the OLD      │
//    │         nodes that were just garbage collected                │
//    │ Step 7: Browser runs layout + paint for the entire subtree   │
//    └──────────────────────────────────────────────────────────────┘
//
//    createElement + appendChild
//    ┌──────────────────────────────────────────────────────────────┐
//    │ Step 1: Creates a single DOM node in memory (no parsing)     │
//    │ Step 2: You attach text content (safe — no XSS possible)     │
//    │ Step 3: You attach event listeners directly to the node      │
//    │ Step 4: appendChild adds it to the live DOM tree             │
//    │ Step 5: Browser runs layout + paint for only the new node    │
//    │ No string parsing. No event listener loss. No XSS risk.      │
//    └──────────────────────────────────────────────────────────────┘
//
// 2. replaceChildren() vs innerHTML = '':
//
//    innerHTML = '' triggers the HTML parser even for an empty string.
//    replaceChildren() directly removes child nodes without parsing.
//    replaceChildren() also accepts new nodes as arguments:
//      parent.replaceChildren(node1, node2, node3)  // clears + adds in one step!
//
// 3. WHY CLOSURES MATTER HERE:
//
//    When you write: deleteBtn.onclick = () => { employees.splice(index, 1); }
//    The arrow function CAPTURES the `index` variable from the forEach
//    loop. Each button gets its own closure with its own `index` value.
//    This is the SAME mechanism that causes the stale closure bug in
//    React's useEffect (Challenge 4). Here it works in your favor.
//
// 4. THE XSS ATTACK VECTOR:
//
//    If you use innerHTML and a user types:
//      <img src=x onerror="alert(document.cookie)">
//    as their name, your innerHTML will EXECUTE that script.
//    textContent is safe because it escapes HTML entities automatically.
//
// ─── DATA FLOW: THE REAL-WORLD STORY ────────────────────────────────
//
//  In a real frontend application, this "array-of-strings" pattern
//  scales into the architecture of every CRUD application:
//
//  ┌─────────────────────────────────────────────────────────────────┐
//  │  DATA FLOW IN A REAL FRONTEND APP                               │
//  │                                                                 │
//  │  1. Backend API returns JSON: [ { id: 1, name: "Alice" }, ... ] │
//  │  2. You store it in state:    useState([])  or  let array = []  │
//  │  3. User interacts (add/delete) → mutate the array              │
//  │  4. Re-render the DOM from the mutated array (this challenge)   │
//  │  5. Optionally: POST/PUT/DELETE the change back to the backend  │
//  │                                                                 │
//  │  THE KEY INSIGHT: the array IS the source of truth.             │
//  │  The DOM is a READ-ONLY PROJECTION of that array.               │
//  │  You never read data FROM the DOM — only write TO it.           │
//  │                                                                 │
//  │  WHY? Because the DOM is a tree of C++ objects exposed to JS    │
//  │  via a bridge (the "Web IDL binding"). Accessing DOM properties │
//  │  crosses the JS→C++ boundary on every call — that's SLOW.       │
//  │  Keeping data in JS arrays avoids those boundary crossings.     │
//  └─────────────────────────────────────────────────────────────────┘
//
//  In a real app, your "employees" array would look like:
//    [{ id: "uuid-1", name: "Alice", role: "Engineer", createdAt: "..." }]
//
//  And the data lifecycle would be:
//    fetch("/api/employees")           → GET    → populate array
//    addBtn click → push to array      → POST   → send new employee to backend
//    deleteBtn click → splice array    → DELETE  → send employee ID to backend
//    sortBtn click → sort array        → no API  → purely client-side operation
//
//  Notice: sort is LOCAL, but add/delete are SYNCED to backend.
//  This is why frontend engineers must know which operations are
//  "optimistic" (update UI first, then sync) vs "pessimistic"
//  (wait for server confirmation, then update UI).
//
// ─── YOUR MISSION ────────────────────────────────────────────────────
//
//   Write a renderList() function that:
//     1. Clears the current list using replaceChildren() (NOT innerHTML)
//     2. Loops through the employees array
//     3. Creates an <li> element for each employee (createElement)
//     4. Sets the text using textContent (NOT innerHTML — XSS safe)
//     5. Creates a "Delete" button inside each <li>
//     6. Attaches a click handler to the delete button that:
//        a. Removes the employee from the array (hint: splice)
//        b. Calls renderList() to re-sync the DOM
//     7. Appends the <li> to the list
//     8. Updates the employee count display
//
//   Then hook up the "Add Employee" and "Sort A-Z" buttons.
//
// ─── EDGE CASES TO HANDLE ────────────────────────────────────────────
//
//   - Empty input submission (block it — trim + check length)
//   - Duplicate names (allowed — but notice how splice(index) deletes
//     the correct one because closure captures the specific index)
//   - What if you forget to call renderList() after modifying the array?
//     (Answer: the DOM and state become out of sync — the #1 bug in
//     pre-framework development, and the exact reason React exists)
//
// ─── HINTS ───────────────────────────────────────────────────────────
//
//   - document.createElement('li') creates a new <li> node
//   - element.textContent = 'text' sets text safely (no XSS)
//   - element.appendChild(child) attaches a child node
//   - array.splice(index, 1) removes one item at position `index`
//   - array.sort() sorts alphabetically in-place (mutates the array)
//   - listElement.replaceChildren() clears all children efficiently
//   - inputElement.value.trim() removes whitespace from both ends
//
// ═══════════════════════════════════════════════════════════════════════

// The Source of Truth (State)
// In React terms, this is your useState([...]) value.
// The RULE: this array is the single source of truth.
// The DOM is a PROJECTION of this array. Never read FROM the DOM.
//
// In a real app, this array would come from:
//   const response = await fetch('/api/employees');
//   let employees = await response.json();  // Array<{id, name, role}>
let employees = ["Zara", "Alice", "Bob"];

// DOM References (cached once — never re-queried)
// React does this internally via refs and the virtual DOM tree.
//
// WHY CACHE? Because document.getElementById traverses the DOM tree
// from the root on every call. Caching it in a JS variable means
// all future accesses are O(1) pointer lookups in JS heap memory,
// instead of O(n) DOM tree traversals crossing the JS→C++ bridge.
const listElement = document.getElementById('employeeList');
const inputElement = document.getElementById('nameInput');
const addBtn = document.getElementById('addBtn');
const sortBtn = document.getElementById('sortBtn');
const countDisplay = document.getElementById('countDisplay');

// ─── YOUR CODE STARTS HERE ───────────────────────────────────────────

function renderList() {
  // TODO: Implement this function.
  //
  // Step 1: Clear the current list (use replaceChildren, not innerHTML)
  // Step 2: Loop through the employees array
  // Step 3: For each employee, create an <li> element
  // Step 4: Set the text content to the employee name
  // Step 5: Create a "Delete" button inside each <li>
  // Step 6: Attach a click handler to the delete button that:
  //         a. Removes the employee from the array (hint: splice)
  //         b. Calls renderList() again to re-sync the DOM
  // Step 7: Append the <li> to the list
  // Step 8: Update the count display
  //
  // THINK ABOUT: In a real app, after splice, you would ALSO call:
  //   fetch(`/api/employees/${id}`, { method: 'DELETE' })
  //   .then(() => renderList())   // pessimistic: update DOM after server confirms
  //
  // OR for optimistic updates:
  //   employees.splice(index, 1);
  //   renderList();               // update DOM immediately
  //   fetch(`/api/employees/${id}`, { method: 'DELETE' })
  //   .catch(() => { /* rollback: re-add to array, re-render */ });
}

// TODO: Hook up the "Add Employee" button
// addBtn.addEventListener('click', () => {
//   const name = inputElement.value.trim();
//   // Guard: reject empty inputs
//   // Push to array, re-render, clear input
//   //
//   // REAL APP: you would also POST to the backend:
//   //   fetch('/api/employees', {
//   //     method: 'POST',
//   //     headers: { 'Content-Type': 'application/json' },
//   //     body: JSON.stringify({ name })   // JS Object → JSON string
//   //   })
//   //   .then(res => res.json())  // JSON string → JS Object
//   //
//   // Notice the data transformations:
//   //   JS string → JS Object → JSON string (network) → Java DTO → Database row
//   //   That's FIVE data structure hops for one "Add" button click.
// });

// TODO: Hook up the "Sort A-Z" button
// sortBtn.addEventListener('click', () => {
//   // Sort the array in place, then re-render
//   // NOTE: .sort() with no argument uses lexicographic order
//   // which works for strings. For objects, you'd use:
//   //   employees.sort((a, b) => a.name.localeCompare(b.name))
//   //
//   // This is a CLIENT-ONLY operation. No backend call needed.
//   // Backend only cares about what the data IS, not how it's displayed.
// });

// ─── YOUR CODE ENDS HERE ─────────────────────────────────────────────

// Initial render — call your function here
// (In React, this is the first commit phase after the initial render)
renderList();
