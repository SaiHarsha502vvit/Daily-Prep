import re

file_path = "E:/Dev_World/04_Practice/Daily-Prep/15_React_Frontend/12_Hands_On_React_Projects.md"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

new_content = """
## 🟤 LEVEL 6: React Stale Closures (The `setInterval` Trap)

**The Engineering Concept:** 
React state variables are constants *for a given render*. When you create a closure (like a `setInterval` or `setTimeout`) inside a `useEffect`, it "captures" the state variables from the exact render in which it was created. If you don't update the closure, it stays trapped in the past viewing old data.

### The Broken Concept (Why Juniors Fail):
```jsx
const [count, setCount] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    // BUG: "count" is locked at 0 from the first render. 
    // This will set the state to 1, over and over again, every second.
    setCount(count + 1); 
  }, 1000);
  return () => clearInterval(timer);
}, []); // Empty dependency array means this closure only knows about count = 0
```

### The Hardened Solution:
Use the **Updater Function** pattern `prev => prev + 1`. This bypasses the closure and asks React directly for the most current state value in memory.

```jsx
const [count, setCount] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    // EDGE CASE FIX: We don't rely on the closure's snapshot of `count`.
    // We send an updater function to React's queue.
    setCount(prevCount => prevCount + 1);
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

---

## 🏗️ LEVEL 7: Event Delegation (Performance & Memory)

**The Engineering Concept:** 
If you have a table with 10,000 rows or a list of 1,000 items, attaching a click event listener to *every single child* consumes massive amounts of RAM and slows down the browser. True frontend engineers utilize **Event Bubbling**.

### The Broken Concept (Why Juniors Fail):
```javascript
const buttons = document.querySelectorAll('.delete-btn');
// TERRIBLE: Attaches 10,000 separate listener objects in memory.
buttons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    deleteItem(e.target.dataset.id);
  });
});
```

### The Hardened Solution (Event Delegation):
Attach **ONE** listener to the parent container and catch the event as it bubbles up.

```javascript
const listContainer = document.getElementById('item-list');

// ONE single listener handling clicks for infinite children
listContainer.addEventListener('click', (e) => {
  // Use .closest() to ensure we click the button or an icon inside the button
  const copyBtn = e.target.closest('.delete-btn');
  
  if (copyBtn) {
    const itemId = copyBtn.dataset.id;
    deleteItem(itemId);
  }
});
```

---

## 🔴 LEVEL 8: The Component Remount Trap (React Identity & Keys)

**The Engineering Concept:** 
React relies on the `key` prop to identify which items have changed, been added, or been removed. Beginners often use `Math.random()`, `Date.now()`, or the `index` of an array. 
If a `key` changes, React **destroys** the entire component instance (along with its state and DOM focus) and rebuilds it from scratch.

### The Broken Concept (Why Juniors Fail):
```jsx
// TERRIBLE: React sees a new key on every single render.
// It will destroy and recreate the input physically in the DOM.
// You will literally lose keyboard focus every time you type a letter!
items.map((item) => (
  <input key={Math.random()} value={item.name} />
))
```

### The Hardened Solution:
Use stable, unique identifiers from your database or generated at the exact moment of item creation (not during render).

```jsx
// Fix 1: When adding the item to state, give it a stable ID
const newItem = { id: crypto.randomUUID(), name: 'Apple' };

// Fix 2: Use that stable ID. React now knows this input is the exact same 
// node across renders and will just update its props smoothly without destroying it.
items.map((item) => (
  <input key={item.id} value={item.name} />
))
```

---
"""

# Insert before the navigation footer
if "\n[← Previous:" in text:
    text = text.replace("\n[← Previous:", new_content + "\n[← Previous:")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Added Levels 6, 7, and 8 successfully!")
else:
    print("Footer not found for injection.")
