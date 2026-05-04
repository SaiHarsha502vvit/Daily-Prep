# Frontend Engineering Challenges — Systems-Level Approach

> _"In top-tier programs, they don't teach syntax. They give you a broken system and ask you why it's failing."_

---

## How To Use These Challenges

1. **Open each challenge folder** in VS Code or your editor.
2. **Read the comments** in the JS/JSX/CSS file carefully — they explain the bug, the concept, AND the real-world data flow.
3. **Write your fix** where indicated by `TODO` comments.
4. **Test it** by opening the HTML files in a browser (Challenges 1 & 3) or running the React components in a Vite/CRA project (Challenges 2, 4, 5).
5. **When you're done**, compare your solution against `15_React_Frontend/12_Hands_On_React_Projects.md` in the repo.

---

## Challenge Map

| # | Topic | Language | What's Broken | Data Flow Lesson | Difficulty |
|---|-------|----------|---------------|------------------|------------|
| **1** | [Vanilla DOM Sync](./challenge_1_vanilla_dom/) | JS + HTML | `innerHTML` destroys event listeners | Array → DOM projection, optimistic vs pessimistic updates | Beginner |
| **2** | [React Race Condition](./challenge_2_react_race/) | React JSX | Stale API responses overwrite newer ones | JS string → URL → HTTP → Server SQL → JSON → state → render | Intermediate |
| **3** | [CSS Stacking Context](./challenge_3_css_stacking/) | CSS + HTML | z-index trapped inside parent context | Modal blocks data submission = broken interaction pipeline | Intermediate |
| **4** | [React Stale Closure](./challenge_4_stale_closure/) | React JSX | `setInterval` captures old state snapshot | Closure scope on heap, polling with stale backend query params | Advanced |
| **5** | [Deep Immutability](./challenge_5_deep_immutability/) | React JSX | Shallow spread corrupts nested objects | State → JSON → DTO → Entity → SQL, undo/rollback depends on immutability | Advanced |

---

## What Each Challenge Teaches

### Challenge 1: Vanilla DOM Sync
**The engineering concept:** How React's virtual DOM works under the hood. The array is the source of truth; the DOM is a read-only projection. You never read FROM the DOM — only write TO it.

**The data flow:** In a real app, `employees[]` comes from `GET /api/employees`. Add/delete operations sync back via `POST`/`DELETE`. Sort is client-only (no backend call). Understanding which operations hit the network vs. stay local is core frontend architecture.

**The trap:** `innerHTML` destroys existing DOM nodes and their event listeners. Top engineers use `document.createElement()` and `replaceChildren()`.

### Challenge 2: React Race Condition
**The engineering concept:** Network requests return in non-deterministic order because server processing time varies per query (50K-row scan vs. 12-row index hit).

**The data flow:** One keystroke triggers: JS string → URL parameter → HTTP GET → server SQL query → ResultSet → JSON → HTTP response → JS array → setState → re-render. That's 10 data structure transformations. Race conditions corrupt the final setState step.

**The trap:** No cleanup → stale data. Fix: `AbortController` (production) or boolean cancellation flag.

### Challenge 3: CSS Stacking Context
**The engineering concept:** z-index operates within stacking contexts, not globally. A child can NEVER escape its parent's stacking context. The browser's compositor creates GPU layers based on these contexts.

**The data flow:** Modals are the #1 UI component for data submission (forms, confirmations). If a modal is trapped behind a header due to stacking contexts, the user literally CANNOT click "Save" — data never reaches the backend. A CSS bug becomes a data flow block.

**The trap:** `position: relative` + `z-index: 1` on `.content` creates a stacking context. Fix: remove z-index or set it to `auto`.

### Challenge 4: React Stale Closure
**The engineering concept:** V8 creates closure scope objects on the heap. When setInterval captures `count`, it captures a POINTER to a heap object that contains the value at creation time. React re-renders create new stack frames with new `count` values, but the interval's closure still points to the old heap object.

**The data flow:** In production, this manifests as polling dashboards that fetch with STALE filter parameters. The user changes the dropdown filter, but the interval's closure still sends the OLD filter to the backend. The backend returns wrong data. Silent corruption.

**The trap:** `setCount(count + 1)` reads from closure. Fix: `setCount(prev => prev + 1)` reads from React's Fiber state queue.

### Challenge 5: Deep Immutability
**The engineering concept:** The spread operator creates a shallow copy — new outer reference, but nested objects share the same heap pointer. Mutating nested objects corrupts BOTH old and new state, breaking React.memo, undo/redo, optimistic updates, and time-travel debugging.

**The data flow:** A profile editor's state mirrors a backend DTO (which maps to 3 database tables joined together). When you save, the state is serialized: `JS Object → JSON.stringify → HTTP PUT body → Backend DTO → JPA Entity → SQL UPDATE`. If the state was mutated instead of immutably updated, "Cancel" can't restore old state, and server error rollback is impossible.

**The trap:** `nextProfile.address.city = 'X'` mutates both old AND new state. Fix: nested spreads at every level touched.

---

## The Training Progression

After completing these challenges, move on to building full applications:

| Level | Project | Skills Mastered |
|-------|---------|-----------------
| **Level 1** | Job Application Tracker | Forms, arrays, immutable state, CRUD, JSON serialization |
| **Level 2** | Entertainment Finder | `useEffect`, API calls, debounce, error handling, abort |
| **Level 3** | Mini Cart App | Context API, prop drilling escape, global state, backend sync |

See: [`15_React_Frontend/12_Hands_On_React_Projects.md`](../../15_React_Frontend/12_Hands_On_React_Projects.md)

---

> **Rule:** Never look at the solution until you've spent at least 20 minutes struggling. The struggle IS the learning.
