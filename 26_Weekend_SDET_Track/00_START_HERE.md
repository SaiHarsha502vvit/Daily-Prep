**Navigation**: [Master Index](../00_MASTER_INDEX.md)

# 🎯 Weekend SDET Track — Start Here

> **Everything for the weekend upskilling track lives in this folder.** Open this file first — it always says where you are and what's next.

---

## 📍 Where I Am Right Now

| | |
|---|---|
| **Current block** | Block 1 — JavaScript Core |
| **Status** | 🟡 Pre-start (warm-up session done Sun 09 Aug) |
| **Next session** | **Weekend 1, Saturday — 15 Aug 2026** → [`01_JS_Foundations`](../16_JavaScript/01_JS_Foundations.md) |
| **Block ends** | Sun 30 Aug 2026 (checkpoint → plan Block 2) |
| **Track** | JavaScript → TypeScript → Playwright |

---

## 📂 Files in This Folder

| File | What it's for | When to open it |
|---|---|---|
| [`00_START_HERE.md`](00_START_HERE.md) | This hub — status + links | Every time |
| [`01_Block1_Plan.md`](01_Block1_Plan.md) | The 3-weekend schedule, day by day, with SDET check questions | Start of each study day |
| [`02_Pace_Log.md`](02_Pace_Log.md) | Your running log — planned vs actual time, what you can't explain | End of each study day |
| [`03_Content_Audit_Log.md`](03_Content_Audit_Log.md) | Errors found in the curriculum content while studying | When something looks wrong |
| [`sessions/`](sessions/) | Written notes from each session — re-readable | Reviewing / before a checkpoint |

### Session Notes

| Date | Covered | Notes |
|---|---|---|
| Sun 09 Aug 2026 | JS Ch01 §3 Coercion, §8 Execution Context | [`2026-08-09_JS_Ch01_S3_S8.md`](sessions/2026-08-09_JS_Ch01_S3_S8.md) |

---

## 📚 Source Material (what you're studying from)

| Phase | Folder | Size |
|---|---|---|
| **1. JavaScript** | [`16_JavaScript/`](../16_JavaScript/00_INDEX.md) | 14 chapters + [problem sets](../16_JavaScript/16_PROBLEM_SETS.md) |
| **2. TypeScript** | [`17_TypeScript/`](../17_TypeScript/00_INDEX.md) | 6 chapters + [problem sets](../17_TypeScript/17_PROBLEM_SETS.md) |
| **3. Playwright** | [`21_SDET_Playwright_Automation/`](../21_SDET_Playwright_Automation/00_Start_Here.md) | Full module + [challenges](../21_SDET_Playwright_Automation/challenges/README.md) |

**Block 1 chapters specifically:**
1. [`01_JS_Foundations.md`](../16_JavaScript/01_JS_Foundations.md) — 1,187 lines
2. [`02_JS_Functions_Closures.md`](../16_JavaScript/02_JS_Functions_Closures.md) — 853 lines
3. [`04_JS_Async_Promises.md`](../16_JavaScript/04_JS_Async_Promises.md) — 779 lines ⭐ *gets a whole weekend*
4. [`05_JS_DOM_BrowserAPIs.md`](../16_JavaScript/05_JS_DOM_BrowserAPIs.md) — 767 lines

---

## 🔗 Related (not part of this track)

- [`01_Getting_Started/03_SDET_1Hour_Daily_Path.md`](../01_Getting_Started/03_SDET_1Hour_Daily_Path.md) — an existing **weekday** 1-hour/day SDET rotation that explicitly says "weekends are OFF." It's the exact complement of this track. If you ever want weekday reps *and* weekend depth, the two combine cleanly — but this track works standalone, so don't feel obliged.
- [`01_Getting_Started/02_Study_Plan_Calendar.md`](../01_Getting_Started/02_Study_Plan_Calendar.md) — expired Feb–May 2026 DS/Algo interview prep. Different purpose, kept for reference.

---

## 🤖 Using This With Claude

Just say where you are — *"Weekend 1 Saturday, foundations"* — and Claude pulls the local date, confirms your position, and runs the session.

Session prompts that work well:
- *"Quiz me on last weekend before I start today"*
- *"Here's my answer to the SDET check — is it right?"*
- *"This test is flaky, here's the code — explain it via the event loop"*
- *"I couldn't explain [X] from my pace log — teach me that properly"*
- *"Check this chapter's claims are actually correct"* ← the audit habit; it has already caught 4 real issues

**Standing behaviours Claude follows here:** fetches local date/time at the start of every session, works inline (no background agents), and verifies claims by actually executing code rather than trusting the page.
