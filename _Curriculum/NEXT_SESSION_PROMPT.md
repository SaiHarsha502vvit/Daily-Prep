# Next Session Prompt

Paste the block below into a new session.

```text
Work in the Daily-Prep repo on branch claude/modest-meitner-ixn1fd. First reset it to main: git fetch origin main && git checkout -B claude/modest-meitner-ixn1fd origin/main.

Start by reading AGENTS.md, then _Curriculum/00_AGENT_START.md, the latest entry in 00_CONTEXT/CHANGE_JOURNAL.md, and decision D014 in 00_CONTEXT/DECISIONS.md. They list the conventions and the open follow-ups.

Do these tasks one by one, finishing each before the next:

1. Run-on plain-text lines in 03_Algorithms. Older pages (for example 03_Algorithms/07a_Advanced_DS_Core/01_deep_internals_how_advanced_data_structures.md and the 06a_Greedy_BitManip pages) have consecutive plain lines that render as ONE paragraph. Find them with a script (runs of 3 or more non-blank lines outside code fences, details blocks and tables that are not already list items or headings). Turn line-per-item content into bullet or numbered lists, or a Markdown table when it is columnar. Do not change wording or lose content. Then check the other folders (02, 04, 05, 06, 08 onward) for the same pattern and fix it.

2. Missing diagram explanations. About 140 Mermaid blocks outside 02-06 (23 of them in 07_Modern_Java) have no "**How to read this diagram.**" note within 12 lines. Find them with the tools/mermaid-check script, and add a 1-3 sentence note after each diagram that explains the nodes and the flow. Do not invent facts.

3. Leave file-system trees and tiny diagrams inside code comments as text.

Rules: preserve existing content; never replace a code block unless it holds only ASCII art; never pack several rows into one table cell with <br>; quote Mermaid labels that contain parentheses; do not use Loop or loop as a node id; keep every code fence and <details> balanced.

Verify before finishing:
- Mermaid render check: cd tools/mermaid-check && node check.mjs <folder>. In the cloud sandbox, copy check.mjs to chk_tmp.mjs, change chromium.launch() to chromium.launch({executablePath:"/opt/pw-browsers/chromium"}), run it, then delete the copy.
- python3 tools/update_context.py update, then python3 tools/update_context.py check --strict-fences.
- Compare Java/XML/YAML/SQL code block counts with git HEAD so none are lost.

Finish by adding a CHANGE_JOURNAL.md entry, committing, pushing with git push -u origin claude/modest-meitner-ixn1fd, opening a PR against main, and squash-merging it. In the final reply list the files or areas changed, whether the context check passed, and anything stale or unverified.
```
