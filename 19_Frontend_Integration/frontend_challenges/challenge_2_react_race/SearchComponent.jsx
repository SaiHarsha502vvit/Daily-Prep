// ═══════════════════════════════════════════════════════════════════════
// CHALLENGE 2: React — The Asynchronous Race Condition
// ═══════════════════════════════════════════════════════════════════════
//
// ┌──────────────────────────────────────────────────────────────────┐
// │ WHY THIS CHALLENGE EXISTS                                        │
// │                                                                  │
// │ Every frontend application that talks to a backend hits this     │
// │ exact bug. It's the single most common source of "ghost data"    │
// │ in production: stale API responses overwriting fresh ones.       │
// │                                                                  │
// │ Google, Amazon, and Netflix interviewers ask this because it     │
// │ separates engineers who understand asynchronous systems from     │
// │ those who just know syntax.                                      │
// └──────────────────────────────────────────────────────────────────┘
//
// ─── THE HIDDEN KNOWLEDGE ────────────────────────────────────────────
//
// 1. WHY RESPONSES ARRIVE OUT OF ORDER:
//
//    When you type "A" → "AB" → "ABC", the browser fires 3 HTTP requests.
//    Each request travels through:
//
//    ┌──────────────────────────────────────────────────────────────┐
//    │  JS Event Loop                                               │
//    │    └→ fetch() creates a Promise (microtask registered)       │
//    │        └→ Browser's Network Thread (separate OS thread!)     │
//    │            └→ DNS resolution (0–100ms, cached after first)   │
//    │                └→ TCP handshake (1 RTT)                      │
//    │                    └→ TLS handshake (1-2 RTT for HTTPS)      │
//    │                        └→ HTTP request sent                  │
//    │                            └→ Server processing time         │
//    │                                └→ HTTP response received     │
//    │                                    └→ Task Queue callback    │
//    │                                        └→ .then() executes   │
//    └──────────────────────────────────────────────────────────────┘
//
//    Server processing time VARIES per query:
//    - "A" might match 50,000 rows → 2000ms (database full scan)
//    - "ABC" might match 12 rows → 50ms (index hit)
//    - "AB" might match 500 rows → 300ms
//
//    So "ABC" arrives FIRST, then "AB", then "A".
//    Without protection, "A" (the SLOWEST, OLDEST request) wins,
//    overwriting the results you actually wanted.
//
// 2. THE DATA FLOW IN A REAL SEARCH FEATURE:
//
//    ┌──────────────────────────────────────────────────────────────┐
//    │  USER TYPES "ABC"                                            │
//    │                                                              │
//    │  Step 1: onChange fires → setQuery("ABC")                    │
//    │  Step 2: React re-renders → useEffect sees query changed     │
//    │  Step 3: useEffect fires fetch("/api/search?q=ABC")          │
//    │                                                              │
//    │  ON THE WIRE (data transformation chain):                    │
//    │    JS string "ABC"                                           │
//    │      → URL encoding: ?q=ABC (query parameter)                │
//    │        → HTTP GET request (headers + URL, no body)           │
//    │          → Server: Spring Boot @GetMapping("/search")        │
//    │            → @RequestParam("q") String query                 │
//    │              → SQL: SELECT * FROM items WHERE name LIKE 'ABC%' │
//    │                → ResultSet → List<Item> → Jackson → JSON     │
//    │                  → HTTP response body: [{"id":1,"name":...}] │
//    │                    → Browser parses JSON → JS array          │
//    │                      → setResults(data) → React re-render    │
//    │                                                              │
//    │  THAT'S 10 DATA STRUCTURE TRANSFORMATIONS FOR ONE KEYSTROKE. │
//    └──────────────────────────────────────────────────────────────┘
//
// 3. useEffect CLEANUP — THE MECHANISM:
//
//    React's useEffect lifecycle:
//      Mount:  effect runs → returns cleanup function
//      Update: cleanup runs FIRST → then effect runs again
//      Unmount: cleanup runs one last time
//
//    The cleanup function runs BEFORE the next effect fires.
//    This is your chance to "cancel" the previous request.
//
//    ┌──────────────────────────────────────────────────────────────┐
//    │  User types "A":                                             │
//    │    → effect #1 fires, fetches "A", cleanup_1 = () => {...}   │
//    │                                                              │
//    │  User types "AB":                                            │
//    │    → cleanup_1 runs FIRST (marks "A" as cancelled)           │
//    │    → effect #2 fires, fetches "AB", cleanup_2 = () => {...}  │
//    │                                                              │
//    │  User types "ABC":                                           │
//    │    → cleanup_2 runs FIRST (marks "AB" as cancelled)          │
//    │    → effect #3 fires, fetches "ABC"                          │
//    │                                                              │
//    │  When "A" response arrives:                                  │
//    │    → cancelled_1 === true → response IGNORED                 │
//    │  When "AB" response arrives:                                 │
//    │    → cancelled_2 === true → response IGNORED                 │
//    │  When "ABC" response arrives:                                │
//    │    → cancelled_3 === false → setResults(data) ✓              │
//    └──────────────────────────────────────────────────────────────┘
//
// 4. AbortController — THE PRODUCTION APPROACH:
//
//    The boolean flag works, but the request still COMPLETES on the
//    server and the browser still DOWNLOADS the response. You're just
//    ignoring it in JS. The server did unnecessary work.
//
//    AbortController actually CANCELS the HTTP request at the TCP level.
//    The browser closes the socket. The server (if it supports it)
//    can detect the closed connection and stop processing.
//
//    In production, this matters: if 1000 users are typing,
//    that's 1000 wasted server queries per keystroke without abort.
//
// 5. DEBOUNCING — THE MISSING OPTIMIZATION:
//
//    In real apps, you wouldn't even FIRE the request on every keystroke.
//    You'd wait 300ms after the user STOPS typing (debounce).
//    This reduces the number of requests from N (one per keystroke)
//    to 1 (after the user finishes their thought).
//
//    Libraries like SWR and React Query handle all of this:
//    debouncing + caching + race condition protection + retry.
//    But you MUST understand the manual version first.
//
// ═══════════════════════════════════════════════════════════════════════
//
// YOUR MISSION:
//   Fix the race condition so ONLY the most recent query's results
//   are saved to state. Try BOTH approaches.
//
// REQUIREMENTS:
//   1. DO NOT change the fetchResults function.
//   2. Modify the useEffect so stale responses are ignored.
//   3. APPROACH A: Boolean flag in useEffect cleanup.
//   4. APPROACH B: AbortController (conceptual — mock doesn't support
//      signals, but write the pattern anyway for learning).
//
// EDGE CASES:
//   - User clears the search bar (results should reset to [])
//   - User types very fast (many effects fire in rapid succession)
//   - Component unmounts while fetch is pending (memory leak without cleanup)
//   - What if the server returns an error? (you should handle .catch too)
//
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';

// ─── MOCK API — DO NOT CHANGE THIS ──────────────────────────────────
// It deliberately returns responses with random delays to simulate
// real-world network latency and out-of-order responses.
//
// In a real app, this would be:
//   const fetchResults = (query) =>
//     fetch(`/api/search?q=${encodeURIComponent(query)}`)
//       .then(res => res.json());   // JSON string → JS Array
//
// The data transformation here:
//   JS string (query) → URL parameter → mock delay → JS array (results)
// In production:
//   JS string → URL → HTTP → Server SQL → ResultSet → JSON → JS array
const fetchResults = (query) => {
  return new Promise((resolve) => {
    const randomDelay = Math.random() * 2000;
    console.log(`[API] Request for "${query}" will take ${Math.round(randomDelay)}ms`);
    setTimeout(() => {
      console.log(`[API] Response for "${query}" arrived`);
      resolve([`${query} result 1`, `${query} result 2`, `${query} result 3`]);
    }, randomDelay);
  });
};
// ─────────────────────────────────────────────────────────────────────

export default function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // DATA FLOW:
  //   query (string state) → useEffect dependency → fetch(query)
  //   → Promise resolves → setResults(data) → re-render → <ul> shows results
  //
  // The problem: multiple Promises can be "in flight" simultaneously.
  // The last one to RESOLVE wins, not the last one FIRED.

  useEffect(() => {
    if (query === '') {
      setResults([]);
      return;
    }

    // ─── YOUR FIX GOES HERE ────────────────────────────────────────
    //
    // APPROACH A (Boolean Flag):
    //   1. Create a variable: let cancelled = false;
    //   2. Inside the .then(), check: if (!cancelled) setResults(data);
    //   3. Return a cleanup function that sets cancelled = true;
    //
    //   WHY THIS WORKS: when the user types "AB" after "A",
    //   React runs cleanup_A (sets cancelled_A = true) BEFORE
    //   firing effect_AB. So even when "A" response arrives later,
    //   cancelled_A is already true and setResults is skipped.
    //
    // APPROACH B (AbortController — Production Pattern):
    //   1. Create: const controller = new AbortController();
    //   2. Pass { signal: controller.signal } to fetch options
    //   3. In cleanup: controller.abort();
    //   4. In .catch(): check if error.name === 'AbortError' (ignore it)
    //
    //   Pattern:
    //     const controller = new AbortController();
    //     fetch(`/api/search?q=${query}`, { signal: controller.signal })
    //       .then(res => res.json())
    //       .then(data => setResults(data))
    //       .catch(err => {
    //         if (err.name !== 'AbortError') console.error(err);
    //       });
    //     return () => controller.abort();
    //
    // Currently BROKEN — old responses overwrite newer ones:
    fetchResults(query).then((data) => {
      setResults(data);
    });

    // TODO: Return a cleanup function here
    // ───────────────────────────────────────────────────────────────

  }, [query]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h3>Search (Type slowly and watch the console)</h3>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search..."
        style={{ padding: '0.5rem', fontSize: '1rem', width: '300px' }}
      />
      <p style={{ color: '#888' }}>Current query: "{query}"</p>
      <ul>
        {results.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </div>
  );
}
