"""
Final cleanup:
1. Check if SQL challenges are in DS/Algo files and remove them
2. Run a final summary scan of what's clean
"""
import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"

SQL_TARGET_FILES = [
    r"02_Data_Structures\01e_HashTable.md",
    r"02_Data_Structures\03_Collections_Java.md",
    r"04_Patterns_Templates\04_Pattern_Recognition.md",
    r"04_Patterns_Templates\10_HashMap_Plus_Counting.md",
    r"04_Patterns_Templates\12_LinkedList_Plus_TwoPointers.md",
    r"04_Patterns_Templates\18_String_Plus_Advanced.md",
]

# SQL content inside challenge blocks = contamination
SQL_IN_CHALLENGE = re.compile(
    r'\n> \*\*Challenge \d+ \([^)]+\):\*\*[^\n]*(SELECT|GROUP BY|HAVING|ROW_NUMBER|LEFT JOIN|INNER JOIN)[^\n]*.*?'
    r'> </details>\n(>\n)?',
    re.IGNORECASE | re.DOTALL
)

total_fixed = 0
for rel in SQL_TARGET_FILES:
    path = os.path.join(BASE, rel)
    original = open(path, encoding='utf-8', errors='ignore').read()
    fixed, count = SQL_IN_CHALLENGE.subn('', original)
    if count > 0:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"[FIXED] {rel.split(chr(92))[-1]} ({count} SQL challenge(s) removed)")
        total_fixed += count
    else:
        # Check if SQL is there but not in challenge blocks (likely legitimate content like hash table load factor)
        has_sql = bool(re.search(r'SELECT|GROUP BY|LEFT JOIN', original, re.IGNORECASE))
        if has_sql:
            print(f"[OK]    {rel.split(chr(92))[-1]} — SQL found but NOT in challenge blocks (legitimate content)")

print(f"\nTotal contamination blocks removed: {total_fixed}")

# ─── FINAL CLEAN SUMMARY ──────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  FINAL CONTAMINATION STATUS")
print("=" * 60)

CHECKS = [
    ("Factory/Singleton outside OOP files", "Factory Method vs Abstract Factory", {"06_OOP_Design", "20_Interview_Mastery"}),
    ("Prefix sum challenge in wrong files",  "Prefix sum initialized as `prefix[0] = 0`", {"03_Algorithms", "04_Patterns_Templates", "20_Interview_Mastery"}),
    ("ExecutorService in wrong files",       "ExecutorService.submit(task)", {"07_Modern_Java", "13_Developer_Essentials", "20_Interview_Mastery"}),
    ("Two-pointer in non-DSA files",         "Two-pointer pattern reduces O(N", {"02_Data_Structures", "03_Algorithms", "04_Patterns_Templates", "05_Problem_Solving", "20_Interview_Mastery"}),
]

all_clean = True
for label, sig, ok_folders in CHECKS:
    bad_files = []
    for root, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if not d.startswith('_') and d != '.git']
        for f in files:
            if not f.endswith('.md'): continue
            path = os.path.join(root, f)
            rel = os.path.relpath(path, BASE)
            folder = rel.split(os.sep)[0]
            if folder in ok_folders: continue
            t = open(path, encoding='utf-8', errors='ignore').read()
            if sig in t:
                bad_files.append(rel)
    status = "✓ CLEAN" if not bad_files else f"✗ {len(bad_files)} files"
    print(f"  {status:<12} {label}")
    if bad_files:
        all_clean = False
        for bf in bad_files[:5]:
            print(f"              {bf}")

print("=" * 60)
print(f"  Overall: {'ALL CLEAN' if all_clean else 'Issues remain'}")
print("=" * 60)
