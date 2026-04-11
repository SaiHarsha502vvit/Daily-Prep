"""Replace heavy box-drawing characters with plain box-drawing alternatives."""

from __future__ import annotations

import argparse
from pathlib import Path

DEFAULT_BASE = Path(__file__).resolve().parent

DEFAULT_RELATIVE_FILES = [
    "15_React_Frontend/10_Custom_Hooks_Library.md",
    "15_React_Frontend/09_React_Deep_Reasoning.md",
    "15_React_Frontend/08_React_Performance.md",
    "15_React_Frontend/06_React_Router.md",
    "15_React_Frontend/05_React_TypeScript.md",
    "15_React_Frontend/03_Hooks_Deep_Dive.md",
    "15_React_Frontend/01_React_Fundamentals.md",
    "19_Frontend_Integration/07_Web_Accessibility_A11y.md",
    "19_Frontend_Integration/06_Web_Performance_CoreWebVitals.md",
    "19_Frontend_Integration/04_Frontend_Mental_Models_UI.md",
    "19_Frontend_Integration/03_Build_Tools_Ecosystem.md",
    "19_Frontend_Integration/02_Frontend_Debugging.md",
]

REPLACEMENTS = {
    "╔": "┌",
    "╗": "┐",
    "╚": "└",
    "╝": "┘",
    "═": "─",
    "║": "│",
    "╠": "├",
    "╣": "┤",
    "╦": "┬",
    "╩": "┴",
    "╬": "┼",
}


def iter_targets(base: Path, raw_targets: list[str]):
    if not raw_targets:
        for rel in DEFAULT_RELATIVE_FILES:
            yield base / rel
        return

    for raw in raw_targets:
        candidate = Path(raw)
        if not candidate.is_absolute():
            candidate = base / candidate

        if candidate.is_dir():
            for md_file in candidate.rglob("*.md"):
                yield md_file
        else:
            yield candidate


def normalize_box_chars(content: str) -> tuple[str, bool]:
    updated = content
    changed = False
    for old, new in REPLACEMENTS.items():
        if old in updated:
            updated = updated.replace(old, new)
            changed = True
    return updated, changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("targets", nargs="*",
                        help="Files or directories to process")
    parser.add_argument("--base", type=Path,
                        default=DEFAULT_BASE, help="Workspace root")
    args = parser.parse_args()

    base = args.base.resolve()
    seen = set()
    updated_files = 0
    missing_files = 0

    for target in iter_targets(base, args.targets):
        target = target.resolve()
        if target in seen:
            continue
        seen.add(target)

        if not target.exists():
            print(f"File not found: {target}")
            missing_files += 1
            continue
        if not target.is_file() or target.suffix.lower() != ".md":
            continue

        original = target.read_text(encoding="utf-8", errors="ignore")
        updated, changed = normalize_box_chars(original)
        if changed:
            target.write_text(updated, encoding="utf-8")
            try:
                rel = target.relative_to(base).as_posix()
            except ValueError:
                rel = target.as_posix()
            print(f"Updated {rel}")
            updated_files += 1

    print(f"\nUpdated files: {updated_files}")
    print(f"Missing files: {missing_files}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
