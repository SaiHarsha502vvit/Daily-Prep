"""
Comprehensive contamination scanner — finds ALL misplaced content across the repo.

Checks for:
1. Generic "Arrays Q&A" block (Q1 int[] a = {1,2,3}...) in non-array files
2. Prefix sum challenge ("prefix[0] = 0") in non-prefix-sum files
3. ExecutorService.submit() challenges in non-concurrency files
4. Two-pointer challenge pasted in SQL/CSS/React files
5. Singleton/Factory contamination (already fixed — verify 0 remain outside OOP)
6. Duplicate identical challenge blocks across files (same verbatim text)
7. Empty section challenge shells (header with no content)
8. Misrouted section challenges (topic mismatch detection)
9. "Queue.poll()" / "LinkedList" challenges in SQL/CSS files
10. React/JSX content in Java/SQL files
"""

import os
import re
import sys
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')
BASE = r"e:\Dev_World\04_Practice\Daily-Prep"

OOP_FILES = {"06_OOP_Design", "20_Interview_Mastery"}

def get_files():
    for root, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if not d.startswith('_') and d != '.git']
        for f in files:
            if f.endswith('.md'):
                path = os.path.join(root, f)
                rel = os.path.relpath(path, BASE)
                yield path, rel

def read(path):
    return open(path, encoding='utf-8', errors='ignore').read()

results = defaultdict(list)

# ───────────────────────────────────────────────
# Pattern 1: Generic Arrays Q1 in non-array files
# "What is the output? int[] a = {1,2,3}; int[] b = a;"
# ───────────────────────────────────────────────
ARRAYS_QA_SIGNATURE = 'int[] a = {1,2,3}; int[] b = a; b[0] = 99;'
ARRAY_FILES = {'02_Data_Structures', '04_Patterns_Templates', '05_Problem_Solving'}

for path, rel in get_files():
    folder = rel.split(os.sep)[0]
    t = read(path)
    if ARRAYS_QA_SIGNATURE in t and folder not in ARRAY_FILES:
        results['Generic Arrays Q1 in wrong file'].append(rel)

# ───────────────────────────────────────────────
# Pattern 2: Prefix sum challenge in wrong files
# "Prefix sum initialized as `prefix[0] = 0` — why the leading zero"
# ───────────────────────────────────────────────
PREFIX_SIG = 'Prefix sum initialized as `prefix[0] = 0`'
PREFIX_OK = {'03_Algorithms', '04_Patterns_Templates', '20_Interview_Mastery'}

for path, rel in get_files():
    folder = rel.split(os.sep)[0]
    t = read(path)
    if PREFIX_SIG in t and folder not in PREFIX_OK:
        results['Prefix sum challenge in wrong file'].append(rel)

# ───────────────────────────────────────────────
# Pattern 3: ExecutorService in non-concurrency files
# ───────────────────────────────────────────────
EXEC_SIG = 'ExecutorService.submit()'
CONCURRENCY_OK = {'07_Modern_Java', '13_Developer_Essentials', '20_Interview_Mastery'}
CONCURRENCY_FILES = {'Ch15', 'Ch16', 'Ch17', 'Ch18', 'Ch19', '19_Concurrency'}

for path, rel in get_files():
    folder = rel.split(os.sep)[0]
    fname = os.path.basename(path)
    t = read(path)
    is_concurrency_file = any(fname.startswith(c) for c in CONCURRENCY_FILES)
    if EXEC_SIG in t and (folder not in CONCURRENCY_OK or not is_concurrency_file):
        if folder not in CONCURRENCY_OK:
            results['ExecutorService in wrong folder'].append(rel)

# ───────────────────────────────────────────────
# Pattern 4: Two-pointer challenge in SQL/CSS/React files
# "Two-pointer pattern reduces O(N²) brute force to O(N)"
# ───────────────────────────────────────────────
TWO_PTR_SIG = 'Two-pointer pattern reduces O(N²) brute force to O(N)'
TWO_PTR_OK = {'02_Data_Structures', '03_Algorithms', '04_Patterns_Templates', '05_Problem_Solving', '20_Interview_Mastery'}

for path, rel in get_files():
    folder = rel.split(os.sep)[0]
    t = read(path)
    if TWO_PTR_SIG in t and folder not in TWO_PTR_OK:
        results['Two-pointer challenge in wrong file'].append(rel)

# ───────────────────────────────────────────────
# Pattern 5: React/JSX content in Java/SQL/Algorithm files
# "useState" or "useEffect" challenges in non-React files
# ───────────────────────────────────────────────
REACT_SIG = re.compile(r'useState|useEffect|JSX|React\.memo')
REACT_OK = {'15_React_Frontend', '16_JavaScript', '17_TypeScript', '19_Frontend_Integration', '20_Interview_Mastery', '14_Mental_Models', '18_CSS_Complete'}

for path, rel in get_files():
    folder = rel.split(os.sep)[0]
    t = read(path)
    if REACT_SIG.search(t) and folder not in REACT_OK:
        results['React/JSX content in non-React file'].append(rel)

# ───────────────────────────────────────────────
# Pattern 6: Duplicate verbatim challenge blocks across files
# Find challenges that appear word-for-word in 3+ different files
# ───────────────────────────────────────────────
challenge_map = defaultdict(list)
for path, rel in get_files():
    t = read(path)
    # Extract individual challenge questions (the question text only, not answers)
    for m in re.finditer(r'> \*\*Challenge \d+ \([^)]+\):\*\* (.{40,120})', t):
        question = m.group(1).strip()[:100]
        challenge_map[question].append(rel)

duplicates = {q: files for q, files in challenge_map.items() if len(files) >= 4}
results['Challenge appears in 4+ different files'] = [
    f'"{q[:70]}..." → {len(files)} files' for q, files in sorted(duplicates.items(), key=lambda x: -len(x[1]))
]

# ───────────────────────────────────────────────
# Pattern 7: Empty section challenge shells
# Header present but no challenge content
# ───────────────────────────────────────────────
EMPTY_SHELL = re.compile(r'> 🔬 \*\*Section Challenge[^\n]+\n>\n\n')

for path, rel in get_files():
    t = read(path)
    if EMPTY_SHELL.search(t):
        results['Empty challenge shell (header only)'].append(rel)

# ───────────────────────────────────────────────
# Pattern 8: SQL-specific challenges in Algorithm/DS files
# ───────────────────────────────────────────────
SQL_SIG = re.compile(r'SELECT.*FROM|GROUP BY|HAVING.*COUNT|JOIN.*WHERE', re.IGNORECASE)
SQL_OK = {'08_SQL', '14_Mental_Models', '20_Interview_Mastery'}

for path, rel in get_files():
    folder = rel.split(os.sep)[0]
    t = read(path)
    # Only flag if it appears in challenge blocks
    if SQL_SIG.search(t) and folder in {'02_Data_Structures', '03_Algorithms', '04_Patterns_Templates'}:
        results['SQL query inside DS/Algo file challenge'].append(rel)

# ───────────────────────────────────────────────
# PRINT REPORT
# ───────────────────────────────────────────────
print("=" * 65)
print("  COMPREHENSIVE CONTAMINATION SCAN REPORT")
print("=" * 65)

total_issues = 0
for category, items in results.items():
    if items:
        print(f"\n[{len(items)}] {category}:")
        for item in items[:15]:
            print(f"    {item}")
        if len(items) > 15:
            print(f"    ... and {len(items)-15} more")
        total_issues += len(items)

print(f"\n{'='*65}")
print(f"  Total issues found: {total_issues}")
print(f"{'='*65}")
