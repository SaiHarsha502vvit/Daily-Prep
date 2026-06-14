// ═══════════════════════════════════════════════════════════════════════
// CHALLENGE 5: React — Deep Immutability (Nested State Updates)
// ═══════════════════════════════════════════════════════════════════════
//
// ┌──────────────────────────────────────────────────────────────────┐
// │ WHY THIS CHALLENGE EXISTS                                        │
// │                                                                  │
// │ React detects state changes using === (reference equality).      │
// │ If the reference hasn't changed, React skips the re-render.     │
// │ The spread operator (...) creates a SHALLOW copy — the outer    │
// │ object gets a new reference, but nested objects still point to   │
// │ the SAME memory address.                                         │
// │                                                                  │
// │ This bug silently corrupts state, breaks undo/redo, breaks time │
// │ travel debugging, and breaks React.memo optimization.            │
// │ It's the #1 state management bug in production React apps.       │
// └──────────────────────────────────────────────────────────────────┘
//
// ─── THE HIDDEN KNOWLEDGE ────────────────────────────────────────────
//
// 1. HOW JAVASCRIPT STORES OBJECTS IN MEMORY:
//
//    Primitives (number, string, boolean) are stored BY VALUE.
//    Objects and arrays are stored BY REFERENCE (pointer to heap).
//
//    ┌──────────────────────────────────────────────────────────────┐
//    │  const profile = {                                           │
//    │    name: "Harsha",          // string → stored by value      │
//    │    address: { city: "Hyd" } // object → stored as POINTER   │
//    │  };                                                          │
//    │                                                              │
//    │  MEMORY LAYOUT:                                              │
//    │                                                              │
//    │  Stack:                                                      │
//    │    profile → 0x100 (heap pointer)                            │
//    │                                                              │
//    │  Heap:                                                       │
//    │    0x100: { name: "Harsha", address: 0x200 }                 │
//    │    0x200: { city: "Hyd" }  ← address object                  │
//    │                                                              │
//    │  const next = { ...profile };                                │
//    │  Creates:                                                    │
//    │    0x300: { name: "Harsha", address: 0x200 }  ← NEW outer   │
//    │           BUT address still points to 0x200!                 │
//    │                                                              │
//    │  next.address.city = "Bangalore";                            │
//    │  This mutates 0x200 → BOTH profile AND next see the change! │
//    │  profile.address.city is ALSO "Bangalore" now. Corrupted.    │
//    └──────────────────────────────────────────────────────────────┘
//
// 2. WHY REACT MISSES THE UPDATE (THE === CHECK):
//
//    React's reconciler uses Object.is() (similar to ===) to decide
//    whether state "changed." For objects, this compares POINTERS.
//
//    ┌──────────────────────────────────────────────────────────────┐
//    │  setProfile(nextProfile);                                    │
//    │                                                              │
//    │  React checks: Object.is(oldProfile, nextProfile)            │
//    │  oldProfile → 0x100, nextProfile → 0x300                     │
//    │  0x100 !== 0x300 → "changed!" → re-render ✓                  │
//    │                                                              │
//    │  But for React.memo on a CHILD component:                    │
//    │    <AddressCard address={profile.address} />                  │
//    │    React.memo checks: Object.is(oldAddress, newAddress)       │
//    │    oldAddress → 0x200, newAddress → 0x200                     │
//    │    0x200 === 0x200 → "same!" → SKIP re-render ✗              │
//    │                                                              │
//    │  The data was mutated but React doesn't know.               │
//    │  This is SILENT CORRUPTION — the worst kind of bug.          │
//    └──────────────────────────────────────────────────────────────┘
//
// 3. THE CORRECT PATTERN — NESTED SPREADS:
//
//    You must create new references at EVERY LEVEL you touched:
//
//    setProfile({
//      ...profile,                    // new outer object (0x400)
//      address: {                     // new address object (0x500)
//        ...profile.address,          // copy existing address fields
//        city: "Bangalore"            // override city
//      }
//    });
//
//    Now: old address → 0x200, new address → 0x500
//    React.memo sees 0x200 !== 0x500 → re-renders correctly
//
// 4. DATA FLOW: HOW THIS CONNECTS TO BACKEND OPERATIONS:
//
//    ┌──────────────────────────────────────────────────────────────┐
//    │  REAL-WORLD SCENARIO: User Profile Editor                    │
//    │                                                              │
//    │  Step 1: Fetch profile from backend:                         │
//    │    GET /api/users/42                                          │
//    │    Response: { name: "Harsha", address: { city: "Hyd" },     │
//    │               skills: ["Java", "Spring Boot"] }              │
//    │    Data arrives as: JSON string → JSON.parse → JS Object     │
//    │    Store in state: setProfile(data)                          │
//    │                                                              │
//    │  Step 2: User edits city in a form input:                    │
//    │    onChange → creates NEW profile with nested spread          │
//    │    This is LOCAL state — no backend call yet                  │
//    │    The old state is preserved for "Cancel" functionality     │
//    │                                                              │
//    │  Step 3: User clicks "Save":                                 │
//    │    Transform for backend:                                    │
//    │      JS Object → JSON.stringify → HTTP PUT body              │
//    │    Backend receives:                                         │
//    │      JSON → @RequestBody UserDTO → JPA Entity → SQL UPDATE   │
//    │                                                              │
//    │  Step 4: Backend responds with updated profile:              │
//    │    JSON → setProfile(updatedData) → re-render                │
//    │                                                              │
//    │  IF YOU MUTATED STATE IN STEP 2:                             │
//    │    - "Cancel" button can't restore old state (it's corrupted)│
//    │    - Undo/redo breaks (previous snapshots are wrong)         │
//    │    - React DevTools time travel shows wrong history          │
//    │    - Optimistic updates can't rollback on server error       │
//    └──────────────────────────────────────────────────────────────┘
//
// 5. ARRAYS ARE OBJECTS — SAME RULES APPLY:
//
//    .push() mutates the original array (changes 0x200 in place)
//    .filter() returns a NEW array (creates 0x500)
//    .map() returns a NEW array (creates 0x600)
//    [...arr, newItem] creates a NEW array with the new item appended
//
//    MUTATING methods (NEVER use in React state):
//      push, pop, shift, unshift, splice, sort, reverse, fill
//
//    NON-MUTATING alternatives (ALWAYS use in React state):
//      concat, filter, map, slice, [...spread], toSorted, toReversed
//
// 6. structuredClone() — THE NUCLEAR OPTION:
//
//    structuredClone(profile) creates a DEEP copy of everything.
//    Every nested object gets a brand new heap pointer.
//
//    But it's EXPENSIVE: it serializes the entire object tree and
//    deserializes it (similar to JSON.parse(JSON.stringify(obj))).
//    For a profile with 5 fields, that's overkill.
//    For a state with 1000 items and deep nesting, it's dangerous.
//
//    In React, prefer nested spreads for surgical precision.
//    Only copy what you changed — leave the rest as shared references.
//    This is how React's memoization works: unchanged subtrees keep
//    the same reference, so React.memo can skip re-rendering them.
//
// ═══════════════════════════════════════════════════════════════════════
//
// THE BUG:
//   updateCity() uses shallow spread → corrupts nested address object.
//   addSkill() uses .push() → mutates the original skills array.
//   removeSkill() uses .splice() → mutates the original skills array.
//
// YOUR MISSION:
//   Fix all three functions using immutable patterns.
//
//   updateCity: nested spread at the address level
//   addSkill:   [...profile.skills, newSkill] instead of .push()
//   removeSkill: .filter((_, i) => i !== index) instead of .splice()
//
// BONUS:
//   Think about how you'd send the updated profile to the backend:
//     const response = await fetch('/api/users/42', {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(updatedProfile)  // JS Object → JSON string
//     });
//   The data transformation chain:
//     JS Object → JSON string → HTTP body → Backend DTO → JPA Entity → SQL
//
// ═══════════════════════════════════════════════════════════════════════

import React, { useState } from "react";

export default function ProfileEditor() {
  // This state shape mirrors a real backend DTO:
  // In Java: public record UserDTO(String name, int age, AddressDTO address, List<String> skills)
  // In SQL: users table (name, age) + addresses table (street, city, country) + user_skills table (user_id, skill)
  // Notice: ONE JS object = data from THREE database tables joined together.
  const [profile, setProfile] = useState({
    name: "Harsha",
    age: 24,
    address: {
      street: "123 Main St",
      city: "Hyderabad",
      country: "India",
    },
    skills: ["Java", "Spring Boot", "SQL"],
  });

  // ─── BUG 1: Shallow spread corrupts nested objects ──────────────
  const updateCity = () => {
    const nextProfile = { ...profile };
    // BUG: nextProfile.address === profile.address (same pointer!)
    // Both point to the SAME heap address (0x200).
    // Mutating .city here changes it for BOTH old and new state.
    nextProfile.address.city = "Bangalore";
    setProfile(nextProfile);
  };
  // TODO: Fix using nested spread:
  //   setProfile({
  //     ...profile,
  //     address: { ...profile.address, city: 'Bangalore' }
  //   });

  // ─── BUG 2: Array mutation inside object ────────────────────────
  const addSkill = (newSkill) => {
    const nextProfile = { ...profile };
    // BUG: nextProfile.skills === profile.skills (same array pointer!)
    // .push() mutates the original array in place.
    // The old state's skills array is now also modified.
    nextProfile.skills.push(newSkill);
    setProfile(nextProfile);
  };
  // TODO: Fix using spread array:
  //   setProfile({
  //     ...profile,
  //     skills: [...profile.skills, newSkill]
  //   });

  // ─── BUG 3: Removing a skill ───────────────────────────────────
  const removeSkill = (index) => {
    const nextProfile = { ...profile };
    // BUG: splice() mutates in place — same reference problem as push()
    nextProfile.skills.splice(index, 1);
    setProfile(nextProfile);
  };
  // TODO: Fix using .filter() (returns a NEW array):
  //   setProfile({
  //     ...profile,
  //     skills: profile.skills.filter((_, i) => i !== index)
  //   });

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h2>Profile Editor</h2>
      <pre>{JSON.stringify(profile, null, 2)}</pre>

      <button onClick={updateCity}>Change City to Bangalore</button>
      <button onClick={() => addSkill("React")}>Add React Skill</button>

      <h3>Skills:</h3>
      <ul>
        {profile.skills.map((skill, i) => (
          <li key={i}>
            {skill}
            <button
              onClick={() => removeSkill(i)}
              style={{ marginLeft: "1rem" }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
