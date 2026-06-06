# Context Schema

This file defines how repo context is structured.

## Folder `CONTEXT.md`

Each active module folder should have a `CONTEXT.md` with:

```md
# Folder Context: <folder>

## Purpose
What this folder owns.

## Writing Style
How files in this folder are usually written.

## Boundaries
What belongs elsewhere.

## Update Triggers
When future agents must update this context.
```

## Generated File Registry

`00_CONTEXT/FILE_REGISTRY.md` is generated from active Markdown files outside `_archive` and `00_CONTEXT`.

Each row includes:

- Path.
- Extracted title.
- Inferred role.
- Style signals.
- Short hash.

## Manifest

`00_CONTEXT/CONTEXT_MANIFEST.json` stores:

- Schema version.
- Generation timestamp.
- Active file count.
- Per-file path, title, role, hash, size, headings, code fences, challenge count, and style signals.

## Freshness Meaning

Fresh context means every tracked active Markdown file still matches the hash in the manifest.

Stale context means at least one tracked file changed, was added, or was deleted after the last context update.

## Source Priority

When sources disagree:

1. Actual file content wins.
2. Folder `CONTEXT.md` explains local intent.
3. `REPO_MAP.md` explains module boundaries.
4. `DECISIONS.md` explains permanent rules.
5. Generated registry explains current inventory.
6. Old chat summaries and `AGENT_HANDOFF.md` are historical only.
