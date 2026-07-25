# Known broken markdown links — **status after repair sweep**

A scan of every `.md` file in `21_SDET_Playwright_Automation/` (excluding `node_modules/` and the stale `_Curriculum/` mirror).

| Scan date                | Broken links found | Notes                                                                                        |
| ------------------------ | -----------------: | -------------------------------------------------------------------------------------------- |
| 2026-06-11 (initial)     |             **71** | Documented in the categorized punch list (historical, below)                                 |
| 2026-06-11 (after sweep) |              **5** | All 5 are either false positives or aspirational sibling-module cross-references — see below |

**66 broken links repaired** in the sweep. Source files touched:

- [`08_Practice_And_Quizzes/quiz_01_solutions/README.md`](../08_Practice_And_Quizzes/quiz_01_solutions/README.md) — rewrote chapter mapping table + dropped the per-question file index (the 9 `Q01_*.md`–`Q09_*.md` files were never built; solutions live in [`solutions.md`](../08_Practice_And_Quizzes/quiz_01_solutions/solutions.md))
- [`08_Practice_And_Quizzes/quiz_01_solutions/solutions.md`](../08_Practice_And_Quizzes/quiz_01_solutions/solutions.md) — fixed nav links (both occurrences)
- [`08_Practice_And_Quizzes/quiz_02_solutions/README.md`](../08_Practice_And_Quizzes/quiz_02_solutions/README.md) — updated 10 chapter references
- [`reference/02_config.md`](../reference/02_config.md), [`03_locators.md`](../reference/03_locators.md), [`04_fixtures.md`](../reference/04_fixtures.md), [`05_auth.md`](../reference/05_auth.md), [`06_api_testing.md`](../reference/06_api_testing.md), [`07_parallelism.md`](../reference/07_parallelism.md), [`08_reliability.md`](../reference/08_reliability.md), [`12_data.md`](../reference/12_data.md), [`13_mocking.md`](../reference/13_mocking.md), [`14_tool_comparison.md`](../reference/14_tool_comparison.md) — repointed `../practice/quiz_02_solutions/` to `../08_Practice_And_Quizzes/quiz_02_solutions/`, and rerouted missing deep-dives + learn references to canonical chapters
- [`learn/06_enterprise_structure.md`](../learn/06_enterprise_structure.md), [`learn/README.md`](../learn/README.md) — rerouted `learn/07_interview_prep.md` (never written) to canonical `06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md`
- [`README.md`](../README.md) — 4 broken links rerouted (`practice/` × 2, `learn/07_interview_prep.md`, `deep_dives/login_taxonomy_advanced.md`, `06_OOP/`)
- [`00_Start_Here.md`](../00_Start_Here.md), [`01_Foundations/00_Testing_Fundamentals/01_All_Testing_Types_Complete_Guide.md`](../01_Foundations/00_Testing_Fundamentals/01_All_Testing_Types_Complete_Guide.md), [`01_Foundations/00_Testing_Fundamentals/02_Smoke_Sanity_Regression_Deep_Dive.md`](../01_Foundations/00_Testing_Fundamentals/02_Smoke_Sanity_Regression_Deep_Dive.md) — corrected `00_Testing_Fundamentals` folder paths
- [`06_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md`](../06_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md) — `32_Framework_Design_Interview_Prep.md` → `32_SDET_Interview_Prep.md` (single-char typo)
- [`challenges/solutions/CH01/README.md`](../challenges/solutions/CH01/README.md) — fixed `../CH01.md` → `../../CH01_Core_Infrastructure.md`

---

## What's still flagged (5 entries, all expected to remain)

### 2 false positives — chapter prose, not real links

These are matched by the grep because they look like markdown links but are placeholders inside code examples:

- [`05_Advanced_Topics/27_Advanced_TypeScript_for_SDETs.md`](../05_Advanced_Topics/27_Advanced_TypeScript_for_SDETs.md) → `../path` — the literal string `../path` appears in a code example.
- [`05_Advanced_Topics/43_Real_World_SDET_War_Stories.md`](../05_Advanced_Topics/43_Real_World_SDET_War_Stories.md) → `../../../../../.[a-zA-Z][a-zA-Z0-9_-]+` — a regex pattern shown in a chapter example.

**No action needed.** These are documentation artifacts, not real links.

### ~~3 aspirational sibling-module cross-references~~ — RESOLVED

**Original claim** (2026-06-11 audit): "These point to other top-level curriculum modules at the repo root (`15_React_Frontend`, `16_JavaScript`, `18_CSS_Complete`) that don't exist yet."

**Both halves of that claim were wrong:**

1. Those modules **do exist** in the repo (confirmed by the wider-repo inventory audit in `00_MASTER_INDEX.md` — modules 15, 16, 17, 18, etc. are all populated).
2. The references themselves have been **rewritten** to point at internal canonical chapters instead. The previous entries in `Ch39_Accessibility_Testing_axe_core.md` and `Ch41_GraphQL_WebSocket_Testing.md` now read:
   - Ch39 → `Ch52 Component Testing` and `Ch02 Enterprise Locators (XPath, getByRole)`
   - Ch41 → `Ch04 JS/TS for Automation`

The pre-existing scan that listed these as broken predated the wider-repo verification and was kept here as a known issue. Resolved in 2026-06-13.

---

## Sweep verification

Final scan command (run from `21_SDET_Playwright_Automation/`):

```bash
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/_Curriculum/*" -not -name "KNOWN_BROKEN_LINKS.md" | while read mdfile; do
  dir=$(dirname "$mdfile")
  grep -oE '\]\(\./[^)]+|\]\(\.\./[^)]+' "$mdfile" 2>/dev/null | sed 's/^\](//' | sed 's/#.*$//' | sort -u | while read link; do
    [ -z "$link" ] && continue
    full="$dir/$link"
    [ ! -e "$full" ] && echo "$mdfile -> $link"
  done
done
```

Result: **5 entries**, all of which are documented above as intentional (false-positive prose or aspirational cross-module placeholders).

---

## Historical record — the 71 broken links found in the initial scan

(Kept for traceability. None of these need action — they've all been fixed or categorized into the 5 remaining entries above.)

### Originally broken — Quiz solution READMEs (40 links)

Quiz 01 README referenced 30 chapter-file paths from an older naming scheme. Quiz 02 README referenced 10. All fixed by rewriting the chapter mapping tables to point at the canonical post-rename paths. Quiz 01's per-question Q01–Q09 file index was removed in favour of pointing at the consolidated `solutions.md`.

### Originally broken — `reference/` cards (9 links)

All references to `../practice/quiz_02_solutions/` and `../deep_dives/enterprise_api_client.md` / `../deep_dives/database_verification.md`. Fixed by repointing to `08_Practice_And_Quizzes/quiz_02_solutions/` and to canonical `05_Advanced_Topics/` chapters.

### Originally broken — top-level `README.md` (4 links)

`./practice/` × 2, `./learn/07_interview_prep.md`, `./deep_dives/login_taxonomy_advanced.md`, `../06_OOP/`. All rerouted to internal canonical chapters.

### Originally broken — `learn/` interview-prep references (3 links)

`./07_interview_prep.md` was planned but never written. Rerouted to `06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md`.

### Originally broken — `00_Testing_Fundamentals` folder paths (3 links)

Folder lives at `01_Foundations/00_Testing_Fundamentals/`, but `00_Start_Here.md` and the chapters inside referenced it as if at module root. Fixed.

### Originally broken — misc (1 link)

`challenges/solutions/CH01/README.md` → `../CH01.md` (file was actually at `../../CH01_Core_Infrastructure.md`).

### Originally broken — `06_SDET_to_SDE_Bridge/60_Tool_Comparison...` (1 link)

`32_Framework_Design_Interview_Prep.md` was a single-character typo (the file is `32_SDET_Interview_Prep.md`).

### False positives + aspirational refs (10 links → reduced to 5 after dedup)

See "What's still flagged" above.

---

## 2026-07-25 � restructure sweep

Module root was re-organized (navigation files -> `00_Navigation/`, pathways -> `00_Pathways/`, governance docs -> `_meta/`, READINESS_RUBRIC -> `career/`, SDET_PROBLEM_SETS -> `08_Practice_And_Quizzes/`). All inbound/outbound links updated in the same commit.

The sweep also repaired 21 pre-existing dangling links left behind by the Phase 6 cuts (links still pointing at the removed `Ch57_Config_Theory_Catalog`, `Ch20_Practice_Resources`, `QUIZ_01`, `QUIZ_02`). Rerouting used the canonical successors decided in the audit:

| Dead target | Rerouted to |
| --- | --- |
| `57_Playwright_Config_Theory_Catalog.md` | `56_Playwright_Config_Deep_Dive.md` (merge target � appendix) |
| `20_Practice_Resources_Learning_Path.md` | `00_Pathways/PATHWAY_01_LEARNING.md` |
| `QUIZ_01_Playwright_MCQ.md` | `quiz_01_solutions/README.md` |
| `QUIZ_02_Playwright_CodeChallenge.md` | `quiz_02_solutions/README.md` |

Post-sweep scan result: **0 broken links** (2 known false positives remain: the `../path` code sample in Ch27 and the regex literal in Ch43).
