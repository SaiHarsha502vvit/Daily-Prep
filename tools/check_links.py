"""Check every relative .md link in the SDET module — print broken ones."""
import re
import sys
from pathlib import Path

ROOT = Path("21_SDET_Playwright_Automation")
LINK_RE = re.compile(r"\]\((\.{1,2}/[^)#]+\.md)(?:#[^)]+)?\)")

broken: list[tuple[Path, str, Path]] = []
total = 0

for md in ROOT.rglob("*.md"):
    text = md.read_text(encoding="utf-8")
    for m in LINK_RE.finditer(text):
        total += 1
        target_str = m.group(1)
        target = (md.parent / target_str).resolve()
        if not target.exists():
            broken.append((md, target_str, target))

print(f"Checked {total} internal .md links across {sum(1 for _ in ROOT.rglob('*.md'))} files.")
print(f"Broken: {len(broken)}\n")
for source, target_str, target in broken[:60]:
    rel_source = source.relative_to(ROOT.parent)
    print(f"  {rel_source}: {target_str}")
if len(broken) > 60:
    print(f"  ... and {len(broken) - 60} more")
