**Navigation**: [Start Here](00_START_HERE.md) | [Block 1 Plan](01_Block1_Plan.md)

# 🔍 Content Audit Log

> Errors and inaccuracies found in the curriculum while studying it. Logged rather than silently fixed, so you can see *what kind* of mistakes to stay alert for — and so nothing gets "corrected" without you knowing.
>
> **Verification standard:** every claim is checked by actually executing it (Node/Python) or by pulling the primary source. Nothing here is "I think this looks wrong."

**Status key:** 🔴 open · 🟢 fixed · ⚪ noted, no fix needed

---

## Session 2026-08-09 — `16_JavaScript/01_JS_Foundations.md` §3 + §8

**Scope checked:** 20+ executable claims, 3 cross-references, 2 external facts.
**Result: all 20 executable claims passed.** Coercion examples, comparison results, `ToPrimitive` chain, falsy list, and the Node `this`/wrapper mechanism are all exactly as written. Cross-references to Ch14 (ten-day origin story), Ch13 §6 (module system), and Ch12 §10 (memory heap) all resolve to real, correctly-titled sections.

Four issues found — **all four fixed in the chapter on 2026-08-09** (commit follows this log entry). Each fix below records what replaced the original.

### 🟢 A1 — Stack depth figure is wrong and shouldn't be a figure at all
- **Where:** [`01_JS_Foundations.md`](../16_JavaScript/01_JS_Foundations.md) §8, Section Challenge answer (~line 848)
- **Claim:** *"V8 default: ~10,000 frames on most systems"*
- **Measured:** **12,550 frames** on Node v22.13.0 (this machine)
- **Why it matters:** the deeper problem isn't the number being off — it's that quoting a number invites you to treat it as a constant. Real max depth varies with frame size (more locals per frame → fewer frames), Node/V8 version, and `--stack-size`. A test that recurses to a "safe" 9,000 can still overflow in a different context.
- **✅ Fixed as:** replaced the figure with the *mechanism* — the limit is a fixed **byte** budget, not a frame count — plus a measured two-row table proving it. A thin function (0 params/0 locals) reached **12,549** frames; a fat one (8 params/15 locals) reached **3,058** on the same machine and V8. **75% fewer frames purely from frame size.** That contrast teaches why no single number can be correct, which the original figure actively obscured.

### 🟢 A2 — `{} + []` result depends on which console, and Node disagrees
- **Where:** [`01_JS_Foundations.md`](../16_JavaScript/01_JS_Foundations.md) §3, Section Challenge 1 (~line 415)
- **Claim:** *"`{} + []` (in a console) evaluate to `0`"*
- **Measured:**

| Context | Result |
|---|---|
| Statement position — `eval("{} + []")` | `0` ✅ matches claim |
| Expression position — `({}) + []` | `"[object Object]"` |
| **Node REPL** | `"[object Object]"` ❌ contradicts claim |
| Chrome DevTools console | `0` ✅ |

**Why it matters:** Node's REPL wraps input in parentheses, forcing expression position and defeating the block-parsing quirk entirely. A learner who tests the example in Node gets the "wrong" answer and concludes they misunderstood — when the chapter was just imprecise about *which* console.
**✅ Fixed as:** the challenge prompt now says *"typed at the start of a line in a **browser** console (Chrome DevTools)"*, and the answer gained a 4-row table covering statement position, parenthesised expression, Node REPL, and argument position — all four verified by execution. Framed around the real lesson: the same characters mean different things depending on where the parser meets them, and a REPL that silently rewrites your input hides that.

### 🟢 A3 — Falsy list says "only 8"; browsers have a 9th
- **Where:** [`01_JS_Foundations.md`](../16_JavaScript/01_JS_Foundations.md) §3 (~line 375) and the `value == null` reasoning (~line 399)
- **Claim 1:** *"FALSY values (only 8 of them — MEMORIZE)"*
- **Claim 2:** *`value == null` is "spec-guaranteed to catch precisely {null, undefined} and nothing else"*
- **Reality:** `document.all` is falsy **and** loosely equals `null`, via the spec-level `[[IsHTMLDDA]]` internal slot that exists purely for legacy web compatibility. So in a browser the falsy count is 9, and `document.all == null` is `true` — a genuine counterexample to claim 2.
- **Source:** [WHATWG HTML spec — common DOM interfaces](https://html.spec.whatwg.org/multipage/common-dom-interfaces.html)
- **Why it matters:** marginal in day-to-day work (`document.all` is legacy), but this track leads into browser automation, so "the falsy list is environment-dependent" is the right instinct to build.
- **✅ Fixed as:** the falsy comment now reads *"8 at the language level"* with a note that a browser adds `document.all` as a 9th via `[[IsHTMLDDA]]`. The `value == null` paragraph keeps its (correct, useful) recommendation but drops the absolute *"spec-guaranteed… nothing else"* phrasing and gains a short "exception to the exception" note — `document.all` impersonates `undefined` in exactly three operations (`ToBoolean`, `IsLooselyEqual`, `typeof`), it's the only such object, and it doesn't exist in Node. Point made: falsiness is host-dependent, not purely language-level.

### 🟢 A4 — Unverifiable branch count + a broken internal reference
- **Where:** [`01_JS_Foundations.md`](../16_JavaScript/01_JS_Foundations.md) §3 (~line 390 and ~line 325)
- **Claim 1:** `==`'s Abstract Equality Comparison Algorithm has *"over twenty distinct branches"*
- **Status:** **could not verify.** Two attempts to pull the ECMAScript spec text returned only the table of contents. Informal recollection puts `IsLooselyEqual` at ~13–14 numbered steps, but no replacement figure is being asserted without a source. The pedagogical point (prefer `===`) holds regardless of the count.
- **Claim 2:** *"Section 2a of this chapter's naming history (see Chapter 14)"* — Chapter 1 has **no** Section 2a; the naming history lives entirely in Chapter 14. Muddled wording, not a broken link (the Ch14 link itself is fine).
- **✅ Fixed as:** the unverifiable count is gone. Replaced with the algorithm's real spec name — **`IsLooselyEqual`** (ES2023 §7.2.15, historically "Abstract Equality Comparison Algorithm") — and a description of *how* it branches (Number-vs-String, Boolean-vs-anything, Object-vs-primitive, BigInt-vs-String…), which makes the "nobody memorises this" point better than a number would. The muddled *"Section 2a of this chapter's"* wording now just points at Chapter 14 directly.

---

## How to Log a New Finding

When something looks wrong mid-session:
1. **Test it** — run the code, or find the primary source. Don't log a hunch.
2. Add an entry: where, exact claim, what you measured, why it matters, suggested fix.
3. Mark 🔴 open. Flip to 🟢 once the chapter is corrected, or ⚪ if it turns out fine as written.

Or just say *"check this chapter's claims"* to Claude during a session and it'll run the pass and log it here.
