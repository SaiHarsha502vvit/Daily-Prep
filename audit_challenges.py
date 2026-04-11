"""
Audit every markdown file for:
1. Section challenges per file (topic-specific ones)
2. Practice & Interview Questions section presence
3. Deep Conceptual Questions (C1, C2... blocks) presence
4. Files with ZERO challenges left after cleanup
"""
import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"

# Folders that should have all three elements
STUDY_FOLDERS = {
    '02_Data_Structures', '03_Algorithms', '04_Patterns_Templates',
    '05_Problem_Solving', '06_OOP_Design', '07_Modern_Java',
    '08_SQL', '13_Developer_Essentials', '14_Mental_Models',
    '15_React_Frontend', '16_JavaScript', '17_TypeScript',
    '18_CSS_Complete', '20_Interview_Mastery'
}

# Skip index/nav files
SKIP_NAMES = {'00_MASTER_INDEX.md', '00_INDEX.md', '00_PATTERN_MASTER_GUIDE.md',
              '00_DS_PROBLEM_BRIDGES.md', '00_DAILY_PRACTICE_INDEX.md'}

zero_challenges = []
no_practice_section = []
no_deep_questions = []
low_challenge_count = []

for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if not d.startswith('_') and d != '.git']
    for fname in files:
        if not fname.endswith('.md') or fname in SKIP_NAMES:
            continue
        path = os.path.join(root, fname)
        rel = os.path.relpath(path, BASE)
        folder = rel.split(os.sep)[0]

        if folder not in STUDY_FOLDERS:
            continue

        t = open(path, encoding='utf-8', errors='ignore').read()

        challenge_count = t.count('> **Challenge')
        has_practice = ('## 🏋️ Practice' in t or
                        '## Practice & Interview' in t or
                        '### LeetCode' in t or
                        '**Q1.**' in t or
                        '**Q4.**' in t)
        has_deep = ('**C1.' in t or '**C1 ' in t or
                    'Deep Conceptual' in t or
                    'Deep Answer' in t)

        if challenge_count == 0:
            zero_challenges.append(f"{rel}")
        elif challenge_count < 3:
            low_challenge_count.append(f"{rel} ({challenge_count} challenges)")

        if not has_practice:
            no_practice_section.append(rel)

        if not has_deep:
            no_deep_questions.append(rel)

print("=" * 62)
print("  PRACTICE & CHALLENGES AUDIT")
print("=" * 62)

print(f"\n[{len(zero_challenges)}] FILES WITH ZERO CHALLENGES (needs work):")
for f in zero_challenges:
    print(f"   {f}")

print(f"\n[{len(low_challenge_count)}] FILES WITH FEWER THAN 3 CHALLENGES:")
for f in low_challenge_count[:20]:
    print(f"   {f}")
if len(low_challenge_count) > 20:
    print(f"   ... and {len(low_challenge_count)-20} more")

print(f"\n[{len(no_practice_section)}] FILES MISSING PRACTICE/INTERVIEW QUESTIONS SECTION:")
for f in no_practice_section[:20]:
    print(f"   {f}")
if len(no_practice_section) > 20:
    print(f"   ... and {len(no_practice_section)-20} more")

print(f"\n[{len(no_deep_questions)}] FILES MISSING DEEP CONCEPTUAL QUESTIONS (C1-C10):")
for f in no_deep_questions[:20]:
    print(f"   {f}")
if len(no_deep_questions) > 20:
    print(f"   ... and {len(no_deep_questions)-20} more")

print("\n" + "=" * 62)
print(f"  Summary:")
print(f"  - Zero challenges  : {len(zero_challenges)} files need challenges added")
print(f"  - No practice Qs   : {len(no_practice_section)} files")
print(f"  - No deep reasoning: {len(no_deep_questions)} files")
print("=" * 62)
