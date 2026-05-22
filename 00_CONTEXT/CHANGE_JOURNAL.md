# Change Journal

Add short entries when context, structure, or domain boundaries change.

## 2026-05-23

Changed:

- Reviewed latest Antigravity conversation context and continued from its context-system audit.
- Cleaned stale Antigravity replacements in `07_Modern_Java/Ch10_Reflection_Annotations.md` and `07_Modern_Java/Ch23_Streams_Deep_Reasoning.md`.
- Removed duplicated old answer tails left after new challenge blocks.
- Replaced repeated stream bug-hunt prompts with section-specific challenges for stream state, parallel mutation, pipeline fusion, and production side effects.
- Updated context commands to use `powershell -NoProfile` so user profile execution-policy errors do not poison future agent runs.
- Added reflection and stream duplicate-prompt families to contamination guards.

Reason:

- The latest Antigravity run found the new context system but also exposed stale manifest state and PowerShell profile noise. Continuing that work required cleaning the affected Java files before refreshing the context manifest.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.

## 2026-05-22

Changed:

- Added repository-level agent context system.
- Added `AGENTS.md` as the mandatory operating manual.
- Added `00_CONTEXT` human context files: repo map, decisions, update protocol, contamination guards, schema, and generated registry/manifest workflow.
- Added folder-level `CONTEXT.md` files for active modules.
- Added `tools/update_context.ps1` to generate `FILE_REGISTRY.md` and `CONTEXT_MANIFEST.json`, and to check freshness.

Reason:

- Future agents need stable model-agnostic context about what each file is, where it belongs, how content is written, and when context must be updated.

Verification:

- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode update`.
- Run `powershell -NoProfile -ExecutionPolicy Bypass -File tools/update_context.ps1 -Mode check`.
