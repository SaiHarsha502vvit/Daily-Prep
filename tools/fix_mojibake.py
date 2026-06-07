"""
Fix UTF-8 mojibake in SDET markdown chapters.

The corrupted files were UTF-8 re-encoded once through Windows-1252,
producing 3-char sequences where the source was a single emoji/arrow.

Mapping (corrupted -> intended):
    â  Œ  -> ❌   U+274C
    â † ’  -> →    U+2192
    â †   -> ←    U+2190
    â € ™  -> ’    U+2019
    â € ¦  -> …    U+2026
    â € “  -> –    U+2013
    â € ”  -> —    U+2014
    â œ         -> ✗    (rare two-char case)
    â œ (next ✓) -> ✓
"""

import sys
from pathlib import Path

REPLACEMENTS = [
    ("âŒ", "❌"),
    ("â†’", "→"),
    ("â†", "←"),
    ("â€™", "’"),
    ("â€¦", "…"),
    ("â€“", "–"),
    ("â€”", "—"),
    ("â€œ", "“"),
    ("â€", "”"),
    ("âœ…", "…"),
    ("âœ”", "✗"),
    ("âœ…", "✓"),
]

def fix_file(path: Path) -> int:
    raw = path.read_text(encoding="utf-8")
    original = raw
    for bad, good in REPLACEMENTS:
        raw = raw.replace(bad, good)
    if raw == original:
        return 0
    path.write_text(raw, encoding="utf-8")
    return 1

def main() -> int:
    root = Path("21_SDET_Playwright_Automation")
    changed = 0
    scanned = 0
    for md in root.rglob("*.md"):
        scanned += 1
        if fix_file(md):
            changed += 1
            print(f"fixed: {md}")
    print(f"\nScanned {scanned} files, modified {changed}.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
