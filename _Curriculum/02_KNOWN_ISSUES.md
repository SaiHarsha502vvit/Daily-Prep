# Known Issues

> Pruned 2026-10-04. Resolved items live in git history, not here. Re-add a row only for something still open.

## Open

| Date | Where | Issue |
| ---- | ----- | ----- |
| — | — | None known. |

## Standing cautions

- **Status columns lie, the filesystem doesn't.** Course READMEs and planning docs were repeatedly found out of date with reality. Before trusting a "stub"/"done" claim, count chapter files: `ls _Curriculum/S0N/CSEnnn_*/*.md | grep -v README | wc -l`.
- **Two curriculum systems, two jobs.** `_Curriculum/` = authored course content; `00_CURRICULUM/` = week-by-week scheduler over repo modules. Don't merge them.
- **Link rot after restructures.** `21_SDET_Playwright_Automation/` was restructured on 2026-09-27 into stage folders (chapter numbers unchanged). Re-run `python tools/check_links.py` after any folder move.

## Context tooling

```bash
python tools/update_context.py check            # manifest fresh?
python tools/update_context.py update           # regenerate registry + manifest
python tools/update_context.py check --strict-fences
```

Windows alternative: `tools/update_context.ps1 -Mode check|update`.
