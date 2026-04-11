#!/usr/bin/env python3
"""
Fix Pass: Remove misplaced inline challenges that injected an
ExecutorService/concurrency question into non-concurrency files.
"""
import sys, io, os, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"

# Directories where concurrency challenges ARE valid
CONCURRENCY_DIRS = {'07_Modern_Java', '13_Developer_Essentials'}
CONCURRENCY_FILES = {'Ch15', 'Ch16', 'Ch17', 'Ch18', 'Ch13', 'Ch19',
                     '19_Concurrency'}

# Pattern to find and remove misplaced blocks
# A misplaced block contains ExecutorService in a non-concurrency file
BLOCK_START = r'\n> 🔬 \*\*Section Challenge'
BLOCK_MARKER = 'ExecutorService.submit(task)'

def is_concurrency_file(filepath):
    parts = filepath.replace('\\', '/').split('/')
    for part in parts:
        if any(d in part for d in CONCURRENCY_DIRS):
            return True
    name = os.path.basename(filepath)
    return any(k in name for k in CONCURRENCY_FILES)

def remove_misplaced_blocks(content):
    """Remove any 🔬 Section Challenge block that contains ExecutorService text."""
    # Split by the challenge block pattern
    # Each block starts with \n> 🔬 **Section Challenge and ends before the next \n\n## or \n\n#
    removed = 0

    # Find all challenge blocks and remove those containing the wrong content
    pattern = re.compile(
        r'\n> 🔬 \*\*Section Challenge[^\n]*\n(?:>[^\n]*\n)*',
        re.MULTILINE
    )

    def should_remove(match):
        return BLOCK_MARKER in match.group(0)

    new_content = content
    matches = list(pattern.finditer(content))

    # Process in reverse so positions stay valid
    for match in reversed(matches):
        if BLOCK_MARKER in match.group(0):
            new_content = new_content[:match.start()] + '\n' + new_content[match.end():]
            removed += 1

    return new_content, removed

def main():
    fixed_files = 0
    total_removed = 0

    for root, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '_archive']
        for file in sorted(files):
            if not file.endswith('.md'):
                continue
            filepath = os.path.join(root, file)

            # Skip if it's a legitimate concurrency file
            if is_concurrency_file(filepath):
                continue

            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                if BLOCK_MARKER not in content:
                    continue  # No misplaced block in this file

                new_content, removed = remove_misplaced_blocks(content)

                if removed > 0:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    fixed_files += 1
                    total_removed += removed
                    print(f"[FIX] {removed:3d} removed → {os.path.relpath(filepath, BASE)}")

            except Exception as e:
                print(f"[ERR] {filepath}: {e}")

    print(f"\n{'='*60}")
    print(f"  Files fixed          : {fixed_files}")
    print(f"  Blocks removed       : {total_removed}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
