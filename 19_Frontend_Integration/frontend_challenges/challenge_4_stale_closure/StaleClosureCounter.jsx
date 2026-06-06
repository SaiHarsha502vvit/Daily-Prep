// ═══════════════════════════════════════════════════════════════════════
// CHALLENGE 4: React — The Stale Closure Trap (setInterval)
// ═══════════════════════════════════════════════════════════════════════
//
// ┌──────────────────────────────────────────────────────────────────┐
// │ WHY THIS CHALLENGE EXISTS                                        │
// │                                                                  │
// │ This is the #1 interview question for mid-level React roles.     │
// │ It tests whether you understand three things simultaneously:     │
// │   1. JavaScript closures (lexical scope capture)                 │
// │   2. React's render model (state is a snapshot per render)       │
// │   3. Event loop timing (setInterval lives outside React)         │
// │                                                                  │
// │ If you can explain WHY count stays at 1, you can explain how     │
// │ closures, the heap, and React's fiber tree interact.             │
// └──────────────────────────────────────────────────────────────────┘
//
// ─── THE HIDDEN KNOWLEDGE ────────────────────────────────────────────
//
// 1. HOW CLOSURES ACTUALLY WORK IN MEMORY:
//
//    When a function is created, V8 creates a "closure scope" object
//    on the heap that stores ALL variables from the parent scope that
//    the inner function references. This object is NOT the state — 
//    it's a COPY of the variable's value at creation time.
//
//    ┌──────────────────────────────────────────────────────────────┐
//    │  RENDER 1 (count = 0):                                       │
//    │                                                              │
//    │  V8 creates the component function call frame:                │
//    │    const count = 0;  // ← this is a plain number on the stack│
//    │                                                              │
//    │  useEffect fires, creates setInterval callback:              │
//    │    The callback is an arrow function: () => setCount(count+1) │
//    │    V8 scans this function and sees it references `count`     │
//    │    V8 creates a closure scope object: { count: 0 }           │
//    │    This object lives on the HEAP — it survives the render    │
//    │                                                              │
//    │  setInterval registers this callback with the Event Loop     │
//    │  The Event Loop stores a pointer to the callback (+ closure) │
//    │                                                              │
//    │  RENDER 2 (count = 1):                                       │
//    │    React creates a NEW function call frame                   │
//    │    const count = 1;  // ← new value, but...                  │
//    │    useEffect has [] dependencies → does NOT re-run           │
//    │    The setInterval callback still has the OLD closure         │
//    │    It still sees count = 0 from the HEAP object              │
//    │    So: 0 + 1 = 1 → count stays at 1 forever                 │
//    └──────────────────────────────────────────────────────────────┘
//
// 2. WHY THE UPDATER FUNCTION BYPASSES THE CLOSURE:
//
//    setCount(count + 1)         → "use MY closure's count (stale)"
//    setCount(prev => prev + 1)  → "ask REACT for the latest count"
//
//    The updater function receives the value from React's internal
//    state queue — the Fiber node's memoizedState. This is the REAL
//    current value, not the closure's snapshot.
//
//    ┌──────────────────────────────────────────────────────────────┐
//    │  React's internal state update queue:                         │
//    │                                                              │
//    │  setCount(prev => prev + 1)                                  │
//    │    → React enqueues: { type: 'update', fn: prev => prev+1 } │
//    │    → React processes queue: fn(currentFiberState)             │
//    │    → Result: 0 → 1 → 2 → 3 ... (always current)            │
//    │                                                              │
//    │  This is why updater functions are ALWAYS safe:              │
//    │  they read from the Fiber tree, not from closure scope.      │
//    └──────────────────────────────────────────────────────────────┘
//
// 3. THE EVENT LOOP PERSPECTIVE:
//
//    setInterval(callback, 1000) registers the callback in the
//    browser's Timer Thread (separate from the JS main thread).
//    Every 1000ms, the Timer Thread pushes the callback into the
//    Task Queue. The Event Loop picks it up when the call stack
//    is empty and executes it.
//
//    The key insight: this callback OUTLIVES the React render cycle.
//    React re-renders happen synchronously on the main thread.
//    The interval callback is a SEPARATE timing system that doesn't
//    know React re-rendered. It's like a cron job in the browser.
//
// 4. DATA FLOW: WHERE STALE CLOSURES HIT IN REAL APPS:
//
//    ┌──────────────────────────────────────────────────────────────┐
//    │  REAL-WORLD SCENARIO: Live Dashboard Polling                 │
//    │                                                              │
//    │  useEffect(() => {                                           │
//    │    const timer = setInterval(async () => {                   │
//    │      // STALE: `filters` is captured from first render       │
//    │      const data = await fetch(`/api/metrics?filter=${filters}`)│
//    │        .then(r => r.json());                                  │
//    │      setMetrics(data);                                       │
//    │    }, 5000);                                                  │
//    │    return () => clearInterval(timer);                         │
//    │  }, []);  // ← [] means filters is STALE                     │
//    │                                                              │
//    │  The data flow is broken:                                    │
//    │    User changes filter dropdown → filters state updates      │
//    │    But the interval still fetches with the OLD filter value  │
//    │    Backend receives wrong query params                       │
//    │    Dashboard shows stale data for the OLD filter             │
//    │                                                              │
//    │  The fix: either use updater pattern (for state values)     │
//    │  or add [filters] to dependency array (for API params)       │
//    │  or use useRef to hold the current filter value              │
//    └──────────────────────────────────────────────────────────────┘
//
//    This is NOT just a counter exercise. Every polling mechanism,
//    every WebSocket handler, every event listener that reads state
//    inside a useEffect with stale dependencies has this exact bug.
//
// 5. useRef — THE THIRD FIX (ADVANCED):
//
//    const countRef = useRef(count);
//    countRef.current = count;  // always updated on every render
//
//    setInterval(() => {
//      setCount(countRef.current + 1);  // reads the LATEST value
//    }, 1000);
//
//    useRef gives you a MUTABLE object (like a Java instance field)
//    that persists across renders. Updating .current does NOT trigger
//    a re-render, but the interval can always read the latest value.
//
// ═══════════════════════════════════════════════════════════════════════
//
// THE BUG:
//   The counter should increment by 1 every second.
//   Instead, it gets stuck at 1 and never goes higher.
//
// YOUR MISSION:
//   Fix the counter. Try BOTH approaches:
//
//   APPROACH A: setCount(prev => prev + 1)
//     Replace count + 1 with prev => prev + 1.
//     Keep the empty dependency array [].
//
//   APPROACH B: Add [count] to the dependency array.
//     This recreates the interval on every state change.
//     You MUST return clearInterval(timer) in cleanup!
//     Otherwise intervals stack up exponentially.
//
// EDGE CASES:
//   - Forget clearInterval → intervals accumulate (exponential growth)
//   - Component unmounts → setState on unmounted component (memory leak)
//   - Multiple state values in one interval → each needs its own fix
//
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';

export default function StaleClosureCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(`[Effect] Created interval. count at creation time = ${count}`);

    const timer = setInterval(() => {
      // ─── THE BUG ───────────────────────────────────────────────
      // `count` here is LOCKED to the value it had when this
      // closure was created (which is 0 on the first render).
      //
      // V8 created a closure scope: { count: 0 }
      // This closure scope lives on the heap.
      // Every tick reads count from THIS heap object, not from React.
      // So this always computes: 0 + 1 = 1, forever.
      setCount(count + 1);
      // ──────────────────────────────────────────────────────────

      // TODO: Fix this line using Approach A or Approach B
    }, 1000);

    return () => {
      console.log('[Cleanup] Clearing interval');
      clearInterval(timer);
    };
  }, []); // Empty dependency array — effect only runs once

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', textAlign: 'center' }}>
      <h2>Stale Closure Counter</h2>
      <p style={{ fontSize: '4rem', color: count > 0 ? '#27ae60' : '#e74c3c' }}>{count}</p>
      <p style={{ color: '#888' }}>Should increment by 1 every second.</p>
      <p style={{ color: '#888' }}>If it's stuck at 1, the closure is stale.</p>
    </div>
  );
}
