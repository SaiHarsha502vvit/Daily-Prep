# Phase 0 Spec — Lean Context System

## Goal

Reduce mandatory agent reading from ~67K to ~17K tokens by creating a lean `_Curriculum/` root context.

## Files to Create / Modify

### Create: `_Curriculum/00_AGENT_START.md`

- Path: `/mnt/e/Dev_World/04_Practice/Daily-Prep/_Curriculum/00_AGENT_START.md`
- Size target: < 3KB
- Content: Lean start sequence with:
  - Semester map (S1–S8 brief names)
  - Key folder links (the 22 existing folders, each on one line with its role)
  - Editing rules (preserve content, append only, no moves)
  - Context update command reminder

### Create: `_Curriculum/01_FILE_MAP.md`

- Path: `/mnt/e/Dev_World/04_Practice/Daily-Prep/_Curriculum/01_FILE_MAP.md`
- Size target: < 7KB
- Content: Condensed file map — each of the 22 folders listed with:
  - Folder name
  - 1-line role description
  - Key index file path (e.g., `07_Modern_Java/00_INDEX.md`)
  - 3–5 most important files inside (no full listing)

### Create: `_Curriculum/02_KNOWN_ISSUES.md`

- Path: `/mnt/e/Dev_World/04_Practice/Daily-Prep/_Curriculum/02_KNOWN_ISSUES.md`
- Size target: < 2KB
- Content: Tracked issues template with sections:
  - Stale context watchlist
  - Files needing cleanup
  - Verification notes

### Modify: `AGENTS.md`

- Path: `/mnt/e/Dev_World/04_Practice/Daily-Prep/AGENTS.md`
- Change: Replace or prefix the heavy start sequence with a redirect to `_Curriculum/00_AGENT_START.md`. Keep a short "For legacy context, see ..." note. Do NOT delete legacy files like FILE_REGISTRY.csv — just make AGENTS.md point to the lean start first.

## Steps + Verification

1. **Measure baseline** — run `wc -c` on all current start-sequence files:
   - `AGENTS.md`
   - `00_CONTEXT/FILE_REGISTRY.csv`
   - `00_CONTEXT/CONTEXT_MANIFEST.json`
   - `00_MASTER_INDEX.md`
   - The nearest `CONTEXT.md` in the folder being edited (if any)
   - Report total bytes.

2. **Create `_Curriculum/` directory and the 3 files above.**

3. **Update `AGENTS.md`** to redirect.

4. **Measure new start sequence** — run `wc -c` on `_Curriculum/00_AGENT_START.md` + `_Curriculum/01_FILE_MAP.md` + `_Curriculum/02_KNOWN_ISSUES.md`. Report total bytes.

5. **Run context check** — execute:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check
   ```
   If it fails, inspect the stale files and determine if they are related to your changes. If unrelated, document in `_Curriculum/02_KNOWN_ISSUES.md`.

## Constraints

- Do NOT move or delete existing files in 22 content folders.
- Preserve existing pedagogical patterns.
- Windows PowerShell tooling must still work.

## Acceptance Criteria

- `[ ]` `_Curriculum/00_AGENT_START.md` exists and `wc -c` < 3000
- `[ ]` `_Curriculum/01_FILE_MAP.md` exists and `wc -c` < 7000
- `[ ]` `_Curriculum/02_KNOWN_ISSUES.md` exists
- `[ ]` `AGENTS.md` contains a redirect to `_Curriculum/00_AGENT_START.md`
- `[ ]` Baseline and new sizes are documented (preferably in `_Curriculum/02_KNOWN_ISSUES.md` or as comments)
- `[ ]` Context check script passes OR stale files are documented as unrelated
