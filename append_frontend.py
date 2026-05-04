import re

file_path = "E:/Dev_World/04_Practice/Daily-Prep/15_React_Frontend/12_Hands_On_React_Projects.md"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

insertion_point = "---"
footer = "[← Previous: 11_Complex_UI_Pages_Patterns]"

# Split by the footer area so we insert right before it
if footer in text:
    parts = text.split("---")
    
    # We want to insert before the last "---" 
    
    new_content = """
## 🔵 LEVEL 4: Vanilla JS Data-to-DOM Sync (The Root of UI State)

**The Engineering Concept:** 
Before React, there was the DOM. Many developers rely on `element.innerHTML = ...` to render lists. This is a massive trap: it forces the browser to parse HTML strings, destroys existing child elements, and wipes out attaching event listeners (causing memory leaks if not handled). Top engineers use `replaceChildren()` and `createElement()`.

### The Broken Concept (Why Juniors Fail):
```javascript
function renderList() {
  // TERRIBLE: Re-parsing HTML, destroying events, sluggish performance.
  listElement.innerHTML = '';
  employees.forEach(emp => {
    listElement.innerHTML += `<li>${emp} <button onclick="delete()">Delete</button></li>`;
  });
}
```

### The Hardened Solution (What React does under the hood):
```javascript
function renderList() {
  // 1. Efficiently clear the DOM without destroying the parent node
  listElement.replaceChildren();

  // 2. Rebuild the list from the Source of Truth (employees array)
  employees.forEach((name, index) => {
    const li = document.createElement('li');
    li.textContent = name + ' ';

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    
    // Closure captures the specific index/name for this button safely
    deleteBtn.onclick = () => {
      employees.splice(index, 1); // Mutate state
      renderList();               // Re-sync DOM
    };

    li.appendChild(deleteBtn);
    listElement.appendChild(li);
  });
}
```

---

## 🟣 LEVEL 5: CSS Stacking Context Trap (The Z-Index Nightmare)

**The Engineering Concept:** 
Everyone thinks `z-index` is just a number from 1 to 9999. It operates within **Stacking Contexts**. A modal with `z-index: 9999` trapped inside a wrapper with `z-index: 1` will **always** be covered by a sibling header with `z-index: 10`. You cannot break out of a stacking context.

### The Broken Concept (Why Juniors Fail):
```css
.header { z-index: 10; }
.content { position: relative; z-index: 1; } /* Creates a Stacking Context trap! */
.modal { z-index: 9999; } /* Pointless because it's inside .content */
```

### The Hardened Solution:
Fix the stacking context hierarchy, NEVER just escalate `z-index` to 999999.

```css
/* Option 1: Remove the stacking context trap entirely */
.content {
  position: relative; /* Changing this to static or removing z-index breaks the trap */
  padding: 2rem;
  /* z-index: 1; -> REMOVED */
}

/* Option 2: Elevate the Fixed Wrapper natively */
.modal-wrapper {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  /* Z-index of a fixed container creates a new root-level context. 
     Making this 20 puts the entire modal context above the header's 10. */
  z-index: 20; 
}
```

---
"""
    
    text = text.replace("---\n[← Previous:", new_content + "\n[← Previous:")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Appended Vanilla JS and CSS challenges successfully!")
else:
    print("Insertion point not found.")
