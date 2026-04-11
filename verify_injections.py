import os
BASE = r"e:\Dev_World\04_Practice\Daily-Prep"
checks = [
    ("07_Modern_Java/Ch15_Concurrency_Core.md", "ARM vs x86"),
    ("07_Modern_Java/Ch08_Collections_Internals.md", "hash flooding"),
    ("07_Modern_Java/Ch01_Core_Foundations.md", "JVM startup"),
    ("08_SQL/01_Foundations_Database_Basics.md", "Query Execution Order"),
    ("02_Data_Structures/01e_HashTable.md", "Birthday Paradox"),
    ("02_Data_Structures/01d_Stack_Queue.md", "Stack=DFS"),
    ("15_React_Frontend/01_React_Fundamentals.md", "Prerequisite"),
]
for f, kw in checks:
    path = os.path.join(BASE, f.replace("/", os.sep))
    text = open(path, encoding="utf-8", errors="ignore").read()
    print(f'[{"OK" if kw in text else "MISS"}] {kw[:25]:25s} -> {f}')
