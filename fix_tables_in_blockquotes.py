"""
Fix tables that are incorrectly placed inside blockquotes (> | ... |).
Tables MUST be outside blockquotes to render properly in Markdown.

Strategy:
  - For each file, find consecutive runs of lines starting with '> |'
  - If those lines form a table (has a separator row like '>|---|'), extract the table out
  - Keep any surrounding blockquote text as-is
"""

import os
import re

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"

def fix_blockquote_tables(text):
    lines = text.splitlines(keepends=True)
    result = []
    i = 0
    changes = 0

    while i < len(lines):
        line = lines[i]

        # Detect start of a table inside a blockquote: "> |" pattern
        if re.match(r'^> \|', line):
            # Gather all consecutive blockquote-table lines
            table_block = []
            j = i
            while j < len(lines) and re.match(r'^> \|', lines[j]):
                table_block.append(lines[j])
                j += 1

            # Only fix if it looks like a real table (has a separator row: |---|)
            raw = "".join(table_block)
            if re.search(r'^\> \|[-:| ]+\|', raw, re.MULTILINE):
                # Strip the leading "> " from each table line
                fixed_lines = []
                for tl in table_block:
                    # Remove exactly "> " at the start
                    fixed_lines.append(re.sub(r'^> ', '', tl))

                # Insert blank line before table if previous line isn't blank
                if result and result[-1].strip() != '':
                    result.append('\n')

                result.extend(fixed_lines)

                # Insert blank line after table if next non-consumed line isn't blank
                if j < len(lines) and lines[j].strip() != '':
                    result.append('\n')

                changes += len(table_block)
                i = j
                continue

        result.append(line)
        i += 1

    return "".join(result), changes


total_files = 0
total_changes = 0
for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if not d.startswith('_') and d != '.git']
    for fname in files:
        if not fname.endswith('.md'):
            continue
        path = os.path.join(root, fname)
        original = open(path, encoding='utf-8', errors='ignore').read()

        # Quick check — skip files without the pattern
        if not re.search(r'^> \|', original, re.MULTILINE):
            continue

        fixed, changes = fix_blockquote_tables(original)
        if changes > 0 and fixed != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(fixed)
            rel = os.path.relpath(path, BASE)
            print(f'[FIXED] {rel} ({changes} table lines extracted)')
            total_files += 1
            total_changes += changes

print(f"\n{'='*50}")
print(f"  Total files fixed : {total_files}")
print(f"  Total lines fixed : {total_changes}")
print(f"{'='*50}")
