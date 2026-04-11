"""
Remove Factory Method / Singleton challenge blocks injected into wrong files.
The exact contamination block looks like:

> 🔬 **Section Challenge — ...**
>
> **Challenge 1 (Design):** Factory Method vs Abstract Factory — give a concrete example...
> <details><summary>Answer</summary>
>
> Factory Method: ...
> </details>
>
> **Challenge 2 (Reasoning):** Singleton is often called an anti-pattern. Why?
> <details><summary>Answer</summary>
>
> 1) Hidden global state ...
> </details>
>

EXCEPTION: The files where this content is CORRECT (OOP/Design files):
  06_OOP_Design/02_Design_Patterns.md
  06_OOP_Design/07_LLD_Solved_Problems.md
  06_OOP_Design/08_Design_Patterns_Java.md
  20_Interview_Mastery/07_Design_Patterns_Interview_Guide.md

Strategy: Remove any blockquote challenge block containing BOTH:
  - "Factory Method vs Abstract Factory"
  - "Singleton is often called an anti-pattern"
"""

import os
import re

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"

# Files where this content BELONGS — do NOT touch these
WHITELIST = {
    "06_OOP_Design\\02_Design_Patterns.md",
    "06_OOP_Design\\07_LLD_Solved_Problems.md",
    "06_OOP_Design\\08_Design_Patterns_Java.md",
    "06_OOP_Design\\01_OOPS_Principles.md",
    "06_OOP_Design\\03_System_Design.md",
    "06_OOP_Design\\04_User_System_Flows.md",
    "06_OOP_Design\\05_SD_Interview_Problems.md",
    "06_OOP_Design\\06_Distributed_Systems_Fundamentals.md",
    "20_Interview_Mastery\\07_Design_Patterns_Interview_Guide.md",
}

# Pattern: matches the entire injected Factory/Singleton challenge block
# It starts with a blockquote section challenge header and ends after the Singleton answer
PATTERN = re.compile(
    r'\n> 🔬 \*\*Section Challenge[^\n]*\*\*\n'   # section challenge header
    r'>\n'                                          # blank blockquote line
    r'> \*\*Challenge 1 \(Design\):\*\* Factory Method vs Abstract Factory.*?'  # C1 question
    r'> \*\*Challenge 2 \(Reasoning\):\*\* Singleton is often called an anti-pattern.*?'  # C2
    r'> </details>\n'                               # end of C2 answer
    r'>\n',                                         # trailing blank blockquote line
    re.DOTALL
)

total_files = 0
total_removals = 0

for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if not d.startswith('_') and d != '.git']
    for fname in files:
        if not fname.endswith('.md'):
            continue
        path = os.path.join(root, fname)
        rel = os.path.relpath(path, BASE)

        if rel in WHITELIST:
            continue

        original = open(path, encoding='utf-8', errors='ignore').read()

        if 'Factory Method vs Abstract Factory' not in original:
            continue

        fixed, count = PATTERN.subn('', original)

        if count > 0 and fixed != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f'[FIXED] {rel}  ({count} block(s) removed)')
            total_files += 1
            total_removals += count
        elif 'Factory Method vs Abstract Factory' in original:
            # Pattern didn't match exactly — flag for manual review
            print(f'[MANUAL] {rel}  — pattern mismatch, check manually')

print(f"\n{'='*55}")
print(f"  Files cleaned  : {total_files}")
print(f"  Blocks removed : {total_removals}")
print(f"{'='*55}")
