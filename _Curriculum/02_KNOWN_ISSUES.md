# Known Issues — Lean Context System

## Stale Context Watchlist

| Date       | File             | Issue                                                                                                                                                                                                                                                                                             | Status  |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2026-06-06 | `00_CURRICULUM/` | Existing `00_CURRICULUM/` directory has own S1–S4 guides, overview, exam bank. Phase 0 live-work mirrors early thinking but uses `_Curriculum/` (underscore prefix) per ferment naming. Future integration needed to reconcile or migrate `00_CURRICULUM/` content into `_Curriculum/` semesters. | ✅ Resolved 2026-07-25 — no migration needed: the two systems have different jobs. `00_CURRICULUM/` = week-by-week *scheduler over repo modules*; `_Curriculum/` = authored *course content* (CSE catalog). Relationship banners added to both entry files (`CURRICULUM_OVERVIEW.md`, `00_AGENT_START.md`). Also resolved same day: duplicate `S01/CSE104_Introduction_To_Computer_Systems/` README-only shell archived to `_archive/CSE104_Introduction_shell/`; all S01 links repointed to the canonical 12-chapter `CSE104_Computer_Systems/`. |

## Files Needing Cleanup

| File | Reason | Priority |
| ---- | ------ | -------- |
| —    | —      | —        |

## Baseline / New Sizes

### Baseline (before Phase 0)

| File                              | Size (bytes) |
| --------------------------------- | ------------ |
| `AGENTS.md`                       | 2,254        |
| `00_CONTEXT/FILE_REGISTRY.csv`    | 153,279      |
| `00_MASTER_INDEX.md`              | 5,729        |
| `00_CONTEXT/AGENT_QUICK_INDEX.md` | 4,514        |
| **Total**                         | **165,776**  |

### New Start Sequence (Phase 0)

| File                             | Size (bytes) | Target           |
| -------------------------------- | ------------ | ---------------- |
| `_Curriculum/00_AGENT_START.md`  | 2,990        | < 3,000 ✅       |
| `_Curriculum/01_FILE_MAP.md`     | 5,684        | < 7,000 ✅       |
| `_Curriculum/02_KNOWN_ISSUES.md` | 1,980        | < 2,000 ✅       |
| `AGENTS.md` (updated)            | 1,087        | redirect ✅      |
| **New start total**              | **10,654**   | **~93% smaller** |

Baseline: 165,776 bytes (~165KB). New start: ~10.7KB. Reduction: ~155KB (93.6%).

## Verification Notes

Cross-platform: `tools/update_context.py` provides identical `update`/`check` semantics on Linux, macOS, and Windows (via `python3`). It regenerates `00_CONTEXT/FILE_REGISTRY.md` and updates `00_CONTEXT/.manifest/manifest.json`.

```bash
python3 tools/update_context.py check
python3 tools/update_context.py update
python3 tools/update_context.py check --strict-fences
```

PowerShell remains available for Windows users:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check
powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update
```

Context was regenerated on this Linux host: **678 active Markdown files** registered, manifest fresh. Per-folder `CONTEXT.md` files remain untouched. Legacy `00_CONTEXT/` files are preserved as on-demand references.

## State Snapshot — 2026-06-06

Generated after adding `tools/update_context.py` and refreshing the manifest.

### Context System

| Check                     | Result                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Manifest status           | **Fresh** (678 files match)                                                                                |
| Unbalanced fence warnings | 2 pre-existing (`03_Algorithms/05e_Graphs_Patterns.md` 27 fences, `_Curriculum/00_AGENT_START.md` 1 fence) |
| Cross-platform tool       | `tools/update_context.py` ✅ executable                                                                    |
| Windows tool              | `tools/update_context.ps1` ✅ exists                                                                       |

### Repository Scale

| Metric                                     | Count   |
| ------------------------------------------ | ------- |
| Problem Sets                               | 19      |
| Project specs (`00_CURRICULUM/PROJECTS/`)  | 13      |
| Curriculum shells (`_Curriculum/`)         | 48      |
| Java solutions (`JavaSolutions/`)          | 10      |
| Numbered content folders (`[0-9][0-9]_*/`) | 26      |
| Active Markdown files in manifest          | **678** |

### Open Items

| #   | Item                                                  | Location                                                                                           |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | Reconcile `00_CURRICULUM/` and `_Curriculum/` overlap | `_Curriculum/02_KNOWN_ISSUES.md`                                                                   |
| 2   | Fix unbalanced fences in 2 files                      | tracked above                                                                                      |
| 3   | 12 TBD curriculum shells need content                 | `_Curriculum/S01–S08/`                                                                             |
| 4   | P09 CI/CD Pipeline has 0 code stubs                   | `00_CURRICULUM/PROJECTS/P09_CICD_Pipeline.md`                                                      |
| 5   | Thin problem sets (< 5 challenges)                    | `21_Python_ML_DL_NLP/`, `07_Modern_Java/07_CONCURRENCY_`, `20_Interview_Mastery/20_SYSTEM_DESIGN_` |

### Light Content Folders (< 10 `.md` files)

- `01_Getting_Started/` (4)
- `17_TypeScript/` (7)
- `18_CSS_Complete/` (9)
- `22_Advanced_API_Testing/` (8)
