# Context Update Protocol

Use this when you edit the repo.

## Before Editing

1. Run `tools/update_context.ps1 -Mode check`.
2. Read stale files if any are relevant.
3. Read the local folder `CONTEXT.md`.
4. Read the file entry in `00_CONTEXT/FILE_REGISTRY.md`.

## During Editing

Classify the change:

| Change Type | Required Context Update |
|---|---|
| Typo, formatting, small wording | Usually only regenerate registry/manifest. |
| New section in existing style | Regenerate registry/manifest; journal if meaningful. |
| New file | Add content, regenerate registry/manifest, journal. |
| New folder | Add folder `CONTEXT.md`, update `REPO_MAP.md`, regenerate registry/manifest, journal. |
| New permanent rule | Update `DECISIONS.md`, regenerate registry/manifest, journal. |
| Cross-domain cleanup | Update `CONTAMINATION_GUARDS.md` if a new contamination family is found. |
| Major restructuring | Update `REPO_MAP.md`, folder `CONTEXT.md`, journal, regenerate registry/manifest. |

## After Editing

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update
powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check
```

If the check still fails, do not hide it. Explain the stale files in the final answer.

For stricter Markdown validation, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check -StrictFences
```

## What Not To Do

- Do not edit `FILE_REGISTRY.md` manually for normal changes.
- Do not treat old chat context as more authoritative than repo files.
- Do not remove user content to make context cleaner.
- Do not silently move content across domains.

## When Another Agent Is Active

If a Codex agent, another Antigravity session, or any other agent is editing the repo concurrently:

1. Run `tools/update_context.ps1 -Mode check` before starting any edit batch.
2. Stale files = recently changed by the other agent. Inspect before touching.
3. Edit your file batch, then run `tools/update_context.ps1 -Mode update` before the next batch.
4. This ensures the other agent's next check reflects your changes too.
5. If two agents edit the same file concurrently, the second writer wins. Avoid this by claiming distinct file batches.

The manifest timestamp is the ownership signal. The stale report is the coordination protocol.
