"""
Fix remaining manual cases — ExecutorService and type-erasure challenges
in DS/Algo files where the pattern regex didn't match cleanly.

These files have the full Section Challenge block wrapping the bad challenge.
We remove the entire block when:
  - It's in a DS/Algo/non-Java file
  - The block contains ExecutorService.submit OR List<String> type erasure
"""

import os
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"

# Signatures that don't belong outside Java/Concurrency files
BAD_SIGS = [
    'ExecutorService.submit(task)',
    'List<String> list = new ArrayList<>',
    'A method returns `(T) jsonDeserialize(json)',
]

# Folders where these are OK
JAVA_OK = frozenset([
    '07_Modern_Java', '13_Developer_Essentials', '20_Interview_Mastery'
])

# Full section challenge block pattern - matches a complete challenge block
# from the opening header down to the closing >\n or \n\n after </details>
FULL_BLOCK_PATTERN = re.compile(
    r'(?:\n> 🔬 \*\*Section Challenge[^\n]*\n'
    r'(?:>\n|> [^\n]*\n)+'
    r')',
    re.DOTALL
)

# Simpler: just find and remove individual challenge items within blockquotes
def remove_challenge_item(text, sig):
    """Remove a single > **Challenge N ...** ... > </details> block."""
    # Match from > **Challenge X (Type):** sig... to > </details>
    pattern = re.compile(
        r'(>\n)?> \*\*Challenge \d+ \([^)]*\):\*\*[^\n]*' + re.escape(sig[:35]) + r'.*?> </details>\n(>\n)?',
        re.DOTALL
    )
    new, count = pattern.subn('', text)
    return new, count

total_files = 0
total_removals = 0
still_remaining = []

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

        for sig in BAD_SIGS:
            if sig not in modified:
                continue
            if folder in JAVA_OK:
                continue

            new_text, count = remove_challenge_item(modified, sig)
            if count > 0:
                modified = new_text
                file_removals += count
            else:
                # Last resort: remove the line + surrounding blockquote context
                # Find the blockquote line containing the sig and remove whole block
                lines = modified.split('\n')
                new_lines = []
                skip = False
                i = 0
                removals_this = 0
                while i < len(lines):
                    line = lines[i]
                    if sig[:30] in line and line.startswith('>'):
                        # Found sig — find the start of this challenge block
                        # Walk back to find '> **Challenge'
                        j = len(new_lines) - 1
                        while j >= 0 and not new_lines[j].startswith('> **Challenge'):
                            j -= 1
                        if j >= 0:
                            new_lines = new_lines[:j]  # Remove from Challenge start
                        # Now skip forward until </details>
                        while i < len(lines) and '</details>' not in lines[i]:
                            i += 1
                        i += 1  # skip </details> line
                        if i < len(lines) and lines[i].startswith('>'):
                            i += 1  # skip trailing >
                        removals_this += 1
                        continue
                    new_lines.append(line)
                    i += 1

                if removals_this > 0:
                    modified = '\n'.join(new_lines)
                    file_removals += removals_this
                else:
                    still_remaining.append(f'{rel}: {sig[:40]}')

        if file_removals > 0 and modified != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(modified)
            print(f'[FIXED] {rel}  ({file_removals} item(s))')
            total_files += 1
            total_removals += file_removals

print(f"\n{'='*55}")
print(f"  Files fixed    : {total_files}")
print(f"  Items removed  : {total_removals}")
if still_remaining:
    print(f"\n  Still remaining ({len(still_remaining)}):")
    for r in still_remaining:
        print(f"    {r}")
print(f"{'='*55}")
