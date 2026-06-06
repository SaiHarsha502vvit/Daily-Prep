# Phase 0 — Agent-Cost Diet: Implementation Spec

**Goal:** Cut mandatory agent reading from ~263 KB / ~67K tokens to ~25 KB / ~3.2K tokens per invocation. Eliminate triple-redundant navigation.

**Date:** 2026-06-06
**Status:** Pending build

---

## Chunk 1 — New Compact Agent Entry-Point + Start Sequence Rewrite

### 1.1 ADD `00_CONTEXT/AGENT_QUICK_INDEX.md`

- Target: ~80 lines
- Content:
  - One-line role + boundary rule per top-level folder (from REPO_MAP.md)
  - 5-bullet PEDAGOGY_STANDARDS condensed quick-rules
  - Pointer to `00_CURRICULUM/00_CURRICULUM_INDEX.md`
  - Pointer to per-folder `00_INDEX.md` for deep nav
  - Pointer to `00_CONTEXT/FILE_REGISTRY.csv` for machine lookup
  - Pointer to `00_CONTEXT/FILE_REGISTRY_SUMMARY.md` for human lookup
- Must be self-contained: an agent that reads ONLY this file + the target folder's CONTEXT.md has enough context to edit.

### 1.2 MODIFY `AGENTS.md`

Replace the 7-step mandatory start sequence with:

```markdown
## Required Start Sequence

1. Read this file.
2. Read `00_CONTEXT/AGENT_QUICK_INDEX.md`.
3. Read the nearest folder `CONTEXT.md` for the area you will edit.
4. (Conditional, only if cross-folder lookup needed) Grep `00_CONTEXT/FILE_REGISTRY.csv`.
```

- Remove the requirement to read REPO_MAP, PEDAGOGY_STANDARDS, FILE_REGISTRY, MASTER_INDEX up front.
- Link to them as on-demand references inside QUICK_INDEX.
- Keep all Editing Rules, Context Update Rule, and Final Response Rule unchanged.

### 1.3 MODIFY `00_MASTER_INDEX.md`

- Trim to ~80 lines (Quick Links + one-line folder table + curriculum entry).
- Move ALL existing detail-heavy sections (820+ lines of per-folder file listings) into `_archive/MASTER_INDEX_LEGACY.md`.
- New MASTER_INDEX must have:
  - Quick Links table (top 10–15 most-used files)
  - One-line per-folder table (name + role + 00_INDEX.md link)
  - Pointer to `00_CURRICULUM/` for curriculum-based navigation
  - Pointer to `_archive/MASTER_INDEX_LEGACY.md` for old detailed view

### Files touched:
- ADD: `00_CONTEXT/AGENT_QUICK_INDEX.md`
- MODIFY: `AGENTS.md`
- MODIFY: `00_MASTER_INDEX.md`
- ADD: `_archive/MASTER_INDEX_LEGACY.md` (copy of old content)

---

## Chunk 2 — File Registry Split + Manifest Move + Journal Trim

### 2.1 ADD `00_CONTEXT/FILE_REGISTRY_SUMMARY.md`

- ~30 lines max
- Contains exactly:
  - How to use (2 bullets)
  - Folder count + role table (from REPO_MAP.md)
  - Pointer to `FILE_REGISTRY.csv` for full lookup

### 2.2 ADD `00_CONTEXT/FILE_REGISTRY.csv`

- Machine-readable: `path,folder,role,bytes,short_sha,style_signals,challenge_count`
- Header row required
- Generated from the same inventory that `update_context.ps1` already walks
- Must be parseable with `grep` / `cut` / `awk`

### 2.3 MOVE `00_CONTEXT/CONTEXT_MANIFEST.json` → `00_CONTEXT/.manifest/manifest.json`

- Create `00_CONTEXT/.manifest/` directory
- Move the file
- Update `tools/update_context.ps1` `$ManifestPath` to point to new location

### 2.4 MODIFY `00_CONTEXT/CHANGE_JOURNAL.md`

- Current file: 425 lines, spans 2026-05-22 to 2026-06-06 (~15 days)
- Since ALL entries are within last 60 days, NO archiving needed.
- Just add a note at top that older entries live in `_archive/CHANGE_JOURNAL_2024_2025.md` (even if it doesn't exist yet; leave as placeholder).

### Files touched:
- ADD: `00_CONTEXT/FILE_REGISTRY_SUMMARY.md`
- ADD: `00_CONTEXT/FILE_REGISTRY.csv`
- ADD: `00_CONTEXT/.manifest/manifest.json` (move)
- MODIFY: `00_CONTEXT/CHANGE_JOURNAL.md`

---

## Chunk 3 — Update PowerShell Context Script

### 3.1 MODIFY `tools/update_context.ps1`

Current behavior:
- `Write-Registry` → `00_CONTEXT/FILE_REGISTRY.md`
- `Write-Manifest` → `00_CONTEXT/CONTEXT_MANIFEST.json`

New behavior:
- `Write-Registry` → **remove** (old FILE_REGISTRY.md retired)
- `Write-RegistrySummary` → `00_CONTEXT/FILE_REGISTRY_SUMMARY.md`
- `Write-RegistryCsv` → `00_CONTEXT/FILE_REGISTRY.csv`
- `Write-Manifest` → `00_CONTEXT/.manifest/manifest.json`
- Keep `-Mode check` runtime unchanged (reads from `.manifest/manifest.json`)

Specific script changes:
1. Change `$RegistryPath` to `$SummaryPath` → `Join-Path $ContextDir "FILE_REGISTRY_SUMMARY.md"`
2. Add `$CsvPath` → `Join-Path $ContextDir "FILE_REGISTRY.csv"`
3. Change `$ManifestPath` → `Join-Path $ContextDir ".manifest/manifest.json"`
4. Add `$ManifestDir` creation (ensure `.manifest/` exists before writing)
5. Replace `Write-Registry` with two new functions:
   - `Write-RegistrySummary` — emits ~30 line markdown with folder counts + roles
   - `Write-RegistryCsv` — emits CSV with header + all rows
6. Remove `Write-Registry` or comment it out
7. Update `main` block to call the new functions
8. Ensure `Test-ContextFreshness` reads manifest from new path

### Files touched:
- MODIFY: `tools/update_context.ps1`

---

## Acceptance Criteria

- [ ] `AGENTS.md` has 4-step start sequence, not 7
- [ ] `00_CONTEXT/AGENT_QUICK_INDEX.md` exists and is ≤100 lines
- [ ] `00_MASTER_INDEX.md` is ≤100 lines
- [ ] `_archive/MASTER_INDEX_LEGACY.md` contains old content
- [ ] `00_CONTEXT/FILE_REGISTRY_SUMMARY.md` exists and is ≤40 lines
- [ ] `00_CONTEXT/FILE_REGISTRY.csv` exists with header `path,folder,role,bytes,short_sha,style_signals,challenge_count`
- [ ] `00_CONTEXT/.manifest/manifest.json` exists (moved from old location)
- [ ] `tools/update_context.ps1 -Mode update` runs without errors
- [ ] `tools/update_context.ps1 -Mode check` passes after update
- [ ] Old `00_CONTEXT/CONTEXT_MANIFEST.json` no longer exists at old path
- [ ] Old `00_CONTEXT/FILE_REGISTRY.md` is... decision: keep as-is for backward compatibility? The spec says SPLIT. Decision: retire it (rename to `FILE_REGISTRY_LEGACY.md` in 00_CONTEXT/ or remove). **→ Remove it after confirming new files are correct.**

---

## Notes

- The folder roles for QUICK_INDEX and FILE_REGISTRY_SUMMARY come from `REPO_MAP.md`.
- The CSV format must match: `path,folder,role,bytes,short_sha,style_signals,challenge_count`
- No content in `_archive/` should be registered as active by the script.
- The `ManifestDir` must be ensured before `Write-Manifest` is called.
