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

## D009 - Open-Source References Are Learning Anchors

Open-source repositories may be linked from guides when they improve reasoning, implementation quality, or production understanding. Use them as anchors:

- Link the source.
- Explain the invariant or design choice.
- Translate the idea into the repo's Java/DSA/interview style.
- Avoid copying large implementations into the notes.
- Mention when the source code's language, API, or production concerns do not match the problem constraints.

Reason: the owner wants future agents to enrich guides with strong real implementations while preserving explanation quality and avoiding blind copy-paste.

## D010 - Technical Pedagogy Standards Are Mandatory

Future agents must use `00_CONTEXT/PEDAGOGY_STANDARDS.md` when adding, repairing, or reviewing learning content.

Reason: the repo should teach reasoning consistently across models and agents, especially during parallel cleanup work.

## D011 - Parallel Agent File Locking Via Stale Check

Before editing any file while another agent is active, run `tools/update_context.ps1 -Mode check`. If a file appears in the stale report, inspect it before editing. Do not blindly overwrite concurrent changes. Report the conflict instead.

The repo is the shared communication channel between agents. Do not use chat transcripts to coordinate file ownership.

Reason: multiple agents (Antigravity, Codex, or others) may run simultaneously on the same repository. The stale check reveals recently changed files without requiring explicit file locks.

## D012 - Open-Source References Use Stable Permalink Commits

When linking open-source implementations, always use a stable permalink (commit SHA or tagged release URL), not a `main`/`master` HEAD URL.

Examples:

- ✅ `https://github.com/openjdk/jdk/blob/jdk-21-ga/src/java.base/share/classes/java/util/HashMap.java#L274`
- ❌ `https://github.com/openjdk/jdk/blob/main/src/java.base/share/classes/java/util/HashMap.java#L274`

Reason: HEAD links rot within weeks. Stable permalink commits preserve the exact code the guide explains, even after upstream rewrites.

## D014 - 5W1H Methodology Is Protected Backbone

The 5W1H (WHAT/WHY/WHO/WHEN/WHERE/HOW) framing block at the top of every chapter is the **canonical pedagogical backbone** of this curriculum. It MUST NOT be removed, replaced, shrunk, or relocated by any upgrade, audit, cleanup, or rewrite.

Reason: 5W1H is the primary scaffold readers use to orient before diving into depth. The 2026-06-01 pedagogy refinement pass extended it with challenge blocks, depth/theory framing, and 5W1H was preserved on every file. Removing it would break the curriculum's pedagogical identity and violate D003 (preserve existing content) by stealth.

Scope:

- Applies to all folders where 5W1H currently exists (notably `02_Data_Structures/`, `03_Algorithms/`, `07_Modern_Java/`, `08_SQL/`, `13_Developer_Essentials/`, `14_Mental_Models/`, `15_React_Frontend/`).
- The Combined Lens rubric in `PEDAGOGY_STANDARDS.md` is explicitly additive to 5W1H; new dimensions may be added alongside but never instead of 5W1H.
- Any future agent that removes a 5W1H block during a cleanup or "modernization" pass MUST revert the change immediately and record the incident in `CHANGE_JOURNAL.md`.

Verification:

- `grep -lE '5W1H' 02_Data_Structures/*.md | wc -l` should match the number of `.md` files in `02_Data_Structures/` after any change.
- Pre-upgrade audits that touch 5W1H-bearing folders MUST include a "5W1H preserved" line in their summary.

## D013 - Lean Agent Start Sequence

Agents must start from `_Curriculum/00_AGENT_START.md` for all curriculum work. Legacy `AGENTS.md` remains available for on-demand reference but is no longer the mandatory first-read. Folder-level `CONTEXT.md` and `00_CONTEXT/` files remain valid for non-curriculum deep work.

Reason: the old start sequence cost ~165 KB (~67K tokens) per invocation; the lean sequence costs ~10.7 KB (~93% reduction). This makes multi-phase curriculum work financially viable.
