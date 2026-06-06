# Known Issues — Lean Context System

## Stale Context Watchlist

| Date | File | Issue | Status |
|------|------|-------|--------|
| 2026-06-06 | `00_CURRICULUM/` | Existing `00_CURRICULUM/` directory has own S1–S4 guides, overview, exam bank. Phase 0 live-work mirrors early thinking but uses `_Curriculum/` (underscore prefix) per ferment naming. Future integration needed to reconcile or migrate `00_CURRICULUM/` content into `_Curriculum/` semesters. | ⚠️ Open |

## Files Needing Cleanup

| File | Reason | Priority |
|------|--------|----------|
| — | — | — |

## Baseline / New Sizes

### Baseline (before Phase 0)

| File | Size (bytes) |
|------|-------------|
| `AGENTS.md` | 2,254 |
| `00_CONTEXT/FILE_REGISTRY.csv` | 153,279 |
| `00_MASTER_INDEX.md` | 5,729 |
| `00_CONTEXT/AGENT_QUICK_INDEX.md` | 4,514 |
| **Total** | **165,776** |

### New Start Sequence (Phase 0)

| File | Size (bytes) | Target |
|------|-------------|--------|
| `_Curriculum/00_AGENT_START.md` | 2,990 | < 3,000 ✅ |
| `_Curriculum/01_FILE_MAP.md` | 5,684 | < 7,000 ✅ |
| `_Curriculum/02_KNOWN_ISSUES.md` | 1,980 | < 2,000 ✅ |
| `AGENTS.md` (updated) | 1,087 | redirect ✅ |
| **New start total** | **10,654** | **~93% smaller** |

Baseline: 165,776 bytes (~165KB). New start: ~10.7KB. Reduction: ~155KB (93.6%).

## Verification Notes

PowerShell is not available in this Linux environment (no `powershell`, `pwsh`, or `wsl`). The context check script (`tools/update_context.ps1`) cannot be run here. File sizes confirmed via `wc -c`. Context check should be run on a Windows machine. Per-folder `CONTEXT.md` files remain untouched. Legacy `00_CONTEXT/` files are preserved as on-demand references.