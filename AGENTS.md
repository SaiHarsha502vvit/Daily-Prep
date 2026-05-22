# Agent Operating Manual

This repository is a long-form technical preparation system. Treat the repo itself as the source of truth, not prior chat memory.

## Required Start Sequence

Before editing any content file:

1. Read this file.
2. Read `00_CONTEXT/README.md`.
3. Read `00_CONTEXT/REPO_MAP.md`.
4. Read the nearest folder `CONTEXT.md` for the area you will edit.
5. Look up target files in `00_CONTEXT/FILE_REGISTRY.md`.
6. Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check
```

If the check reports stale files, inspect those files carefully. The stale report means the repo changed after the last context snapshot; it does not mean the user's changes are wrong.

## Editing Rules

- Preserve existing learning content unless the user explicitly asks to remove it.
- Prefer appending, refining, or replacing only wrong-domain contamination.
- Keep section challenges local to the topic being taught.
- Do not copy a challenge from one domain into another domain unless the section explicitly compares those domains.
- Keep DSA and algorithm files constraint-first: when a pattern works, when it breaks, brute force path, optimized rewrite, and edge cases.
- Keep SQL files SQL-first: joins, windows, CTEs, indexes, transactions, plans, analytics, and production data behavior.
- Keep Java/Spring files Java/Spring-first: JVM, language semantics, Spring lifecycle, HTTP, JPA, security, testing, and production service design.
- Keep frontend files frontend-first: browser, DOM, React, TypeScript, CSS, build tools, accessibility, performance, debugging.

## Context Update Rule

After meaningful edits:

1. Update the relevant folder `CONTEXT.md` if folder-level purpose/style/boundaries changed.
2. Update `00_CONTEXT/DECISIONS.md` if you introduced a permanent repo rule.
3. Add a short entry to `00_CONTEXT/CHANGE_JOURNAL.md`.
4. Regenerate the registry and manifest:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update
```

5. Run the check again:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check
```

## Final Response Rule

When you finish, mention:

- Files or context areas changed.
- Whether the context check passed.
- Any stale context or verification you could not resolve.
