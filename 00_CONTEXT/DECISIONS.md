# Decisions

Permanent repo decisions live here. Add entries when a rule should guide future agents.

## D001 - Repo Context Is Source Controlled

Context must live in the repository, not only in chat memory.

Reason: future agents may be different models with no prior conversation.

## D002 - Human Context Plus Generated Context

Use human-written maps and decisions for meaning. Use generated registry and manifest for coverage and freshness.

Reason: hand-written summaries are useful, but they become stale without machine checks.

## D003 - Preserve Existing Learning Content

Do not remove existing sections unless the user explicitly asks or the section is proven wrong-domain contamination.

Reason: the owner prefers upgrading and deepening guides without losing prior work.

## D004 - DSA And Algorithms Are Constraint First

DSA/algo files should explain:

- Brute force baseline.
- Constraint signals.
- Data structure choice.
- Algorithm choice.
- When the pattern breaks.
- Optimized rewrite path.
- Edge cases and invariants.

Reason: the repo is meant to improve competitive coding reasoning, not only memorize templates.

## D005 - Challenge Blocks Must Match Local Domain

Section challenges must test the topic of that exact section.

Reason: copied challenge blocks caused cross-domain contamination and hallucination risk.

## D006 - Canonical Homes Matter

Keep concepts in their canonical files:

- React Context in React files.
- LEFT JOIN in SQL join files.
- Java exception hierarchy in Java exception files.
- WebSocket tradeoffs in HTTP/WebSocket/system design files.
- Prefix sum/sliding window constraints in DSA/pattern files.

Reason: future agents can reason better when each idea has a stable home.

## D007 - Stale Context Is A Signal

If `tools/update_context.ps1 -Mode check` fails, inspect the listed files. Do not assume the user made a mistake.

Reason: stale means the file changed after the last context snapshot.

## D008 - Generated Registry Is The File-Level Source Of Truth

For "what files exist and what are their titles/signals," use `00_CONTEXT/FILE_REGISTRY.md`.

Reason: it is generated from the current filesystem and avoids stale manual counts.
