"""
Fix all contamination types found by scan_contamination.py:

1. Prefix sum challenge in wrong files  → remove
2. ExecutorService challenge in JS file → remove
3. Two-pointer challenge in wrong files → remove
4. BFS/cycle-detection challenge in wrong files → remove
5. "List<String> list = new ArrayList" (type erasure) in wrong files → remove
6. "Binary search on [1,3,5]" challenge in non-binary-search files → remove
7. Monotonic stack challenge in non-stack files → remove
8. SQL window function challenge in non-SQL files → remove
9. ROW_NUMBER/RANK challenge in non-SQL files → remove
10. SQL query blocks in DS/Algo challenge sections → remove

Each is identified by its unique opening line and removed as a full blockquote block.
"""

import os
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"

# ──────────────────────────────────────────────
# Define each contamination signature + which folders it BELONGS in
# Format: (unique_fragment, frozenset_of_OK_folder_prefixes)
# ──────────────────────────────────────────────
CONTAMINATIONS = [
    # (signature_in_challenge_question, folders_where_it_belongs)
    (
        'Prefix sum initialized as `prefix[0] = 0`',
        frozenset(['03_Algorithms', '04_Patterns_Templates', '20_Interview_Mastery'])
    ),
    (
        'ExecutorService.submit(task)',
        frozenset(['07_Modern_Java', '13_Developer_Essentials', '20_Interview_Mastery'])
    ),
    (
        'Two-pointer pattern reduces O(N',
        frozenset(['02_Data_Structures', '03_Algorithms', '04_Patterns_Templates', '05_Problem_Solving', '20_Interview_Mastery'])
    ),
    (
        'BFS finds shortest path in unweighted graphs',
        frozenset(['03_Algorithms', '04_Patterns_Templates', '05_Problem_Solving', '20_Interview_Mastery'])
    ),
    (
        'Detect if a directed graph has a cycle',
        frozenset(['03_Algorithms', '04_Patterns_Templates', '05_Problem_Solving', '20_Interview_Mastery'])
    ),
    (
        'Every recursive algorithm can be converted to iterative',
        frozenset(['03_Algorithms', '04_Patterns_Templates', '05_Problem_Solving', '02_Data_Structures', '20_Interview_Mastery'])
    ),
    (
        'List<String> list = new ArrayList<>',
        frozenset(['07_Modern_Java', '20_Interview_Mastery', '03_Algorithms'])
    ),
    (
        'A method returns `(T) jsonDeserialize(json)`',
        frozenset(['07_Modern_Java', '20_Interview_Mastery'])
    ),
    (
        'Binary search on `[1,3,5,7,9]`',
        frozenset(['02_Data_Structures', '03_Algorithms', '04_Patterns_Templates', '05_Problem_Solving', '20_Interview_Mastery'])
    ),
    (
        'Binary search on a rotated array `[4,5,6,7,0,1,2]`',
        frozenset(['02_Data_Structures', '03_Algorithms', '04_Patterns_Templates', '05_Problem_Solving', '20_Interview_Mastery'])
    ),
    (
        'Monotonic DECREASING stack',
        frozenset(['02_Data_Structures', '03_Algorithms', '04_Patterns_Templates', '05_Problem_Solving', '20_Interview_Mastery'])
    ),
    (
        "Why can't you use a window function in a WHERE clause",
        frozenset(['08_SQL', '20_Interview_Mastery', '14_Mental_Models'])
    ),
    (
        'ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()',
        frozenset(['08_SQL', '20_Interview_Mastery'])
    ),
    (
        'int[] a = {1,2,3}; int[] b = a; b[0] = 99;',
        frozenset(['02_Data_Structures', '03_Algorithms', '04_Patterns_Templates', '05_Problem_Solving', '20_Interview_Mastery', '14_Mental_Models'])
    ),
]

# Pattern to match a full blockquote challenge block containing a given signature
def make_block_pattern(sig):
    """Match a full > challenge block containing the signature."""
    escaped = re.escape(sig[:40])  # Use first 40 chars for matching
    return re.compile(
        r'\n> 🔬 \*\*Section Challenge[^\n]*\n'
        r'(?:>\n)*'                    # optional blank lines
        r'(?:> [^\n]*\n)*'            # blockquote lines before
        r'(?:>\n)*'
        r'> \*\*Challenge \d+[^\n]*' + escaped + r'.*?'
        r'(?:> </details>\n>\n|> </details>\n\n)',
        re.DOTALL
    )

total_files = 0
total_removals = 0
manual_review = []

for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if not d.startswith('_') and d != '.git']
    for fname in files:
        if not fname.endswith('.md'):
            continue
        path = os.path.join(root, fname)
        rel = os.path.relpath(path, BASE)
        folder = rel.split(os.sep)[0]

        original = open(path, encoding='utf-8', errors='ignore').read()
        modified = original
        file_removals = 0

        for sig, ok_folders in CONTAMINATIONS:
            if sig not in modified:
                continue
            if folder in ok_folders:
                continue  # This content belongs here

            # Try to find and remove the challenge block containing this sig
            # Match a single challenge item (C1 or C2) containing the sig
            # Allow the block to be part of a larger section challenge
            pattern = re.compile(
                r'\n> \*\*Challenge \d+ \([^)]+\):\*\* ' + re.escape(sig[:50]) + r'.*?'
                r'> </details>\n',
                re.DOTALL
            )
            new_text, count = pattern.subn('', modified)

            if count > 0:
                modified = new_text
                file_removals += count
            else:
                # Broader pattern: remove entire section challenge block
                broad = re.compile(
                    r'\n> 🔬 \*\*Section Challenge[^\n]*\n'
                    r'(?:>[ \t]?[^\n]*\n|\n)+'
                    , re.DOTALL
                )
                # Try simpler: just remove lines containing the sig within blockquote
                line_pattern = re.compile(
                    r'\n> [^\n]*' + re.escape(sig[:30]) + r'[^\n]*(?:\n> [^\n]*)*\n> </details>\n',
                    re.DOTALL
                )
                new_text, count = line_pattern.subn('', modified)
                if count > 0:
                    modified = new_text
                    file_removals += count
                else:
                    manual_review.append(f'{rel}: sig="{sig[:50]}"')

        if file_removals > 0 and modified != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(modified)
            print(f'[FIXED] {rel}  ({file_removals} item(s) removed)')
            total_files += 1
            total_removals += file_removals

print(f"\n{'='*60}")
print(f"  Files fixed    : {total_files}")
print(f"  Items removed  : {total_removals}")
if manual_review:
    print(f"\n  Manual review needed ({len(manual_review)}):")
    for m in manual_review[:10]:
        print(f"    {m}")
print(f"{'='*60}")
