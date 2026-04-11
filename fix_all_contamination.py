"""Remove misplaced challenge contamination blocks from Markdown files."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

DEFAULT_BASE = Path(__file__).resolve().parent

CONTAMINATIONS = [
    (
        "Prefix sum initialized as `prefix[0] = 0`",
        frozenset(["03_Algorithms", "04_Patterns_Templates",
                  "20_Interview_Mastery"]),
    ),
    (
        "ExecutorService.submit(task)",
        frozenset(["07_Modern_Java", "13_Developer_Essentials",
                  "20_Interview_Mastery"]),
    ),
    (
        "Two-pointer pattern reduces O(N",
        frozenset([
            "02_Data_Structures",
            "03_Algorithms",
            "04_Patterns_Templates",
            "05_Problem_Solving",
            "20_Interview_Mastery",
        ]),
    ),
    (
        "BFS finds shortest path in unweighted graphs",
        frozenset(["03_Algorithms", "04_Patterns_Templates",
                  "05_Problem_Solving", "20_Interview_Mastery"]),
    ),
    (
        "Detect if a directed graph has a cycle",
        frozenset(["03_Algorithms", "04_Patterns_Templates",
                  "05_Problem_Solving", "20_Interview_Mastery"]),
    ),
    (
        "Every recursive algorithm can be converted to iterative",
        frozenset([
            "03_Algorithms",
            "04_Patterns_Templates",
            "05_Problem_Solving",
            "02_Data_Structures",
            "20_Interview_Mastery",
        ]),
    ),
    (
        "List<String> list = new ArrayList<>",
        frozenset(["07_Modern_Java", "20_Interview_Mastery", "03_Algorithms"]),
    ),
    (
        "A method returns `(T) jsonDeserialize(json)`",
        frozenset(["07_Modern_Java", "20_Interview_Mastery"]),
    ),
    (
        "Binary search on `[1,3,5,7,9]`",
        frozenset([
            "02_Data_Structures",
            "03_Algorithms",
            "04_Patterns_Templates",
            "05_Problem_Solving",
            "20_Interview_Mastery",
        ]),
    ),
    (
        "Binary search on a rotated array `[4,5,6,7,0,1,2]`",
        frozenset([
            "02_Data_Structures",
            "03_Algorithms",
            "04_Patterns_Templates",
            "05_Problem_Solving",
            "20_Interview_Mastery",
        ]),
    ),
    (
        "Monotonic DECREASING stack",
        frozenset([
            "02_Data_Structures",
            "03_Algorithms",
            "04_Patterns_Templates",
            "05_Problem_Solving",
            "20_Interview_Mastery",
        ]),
    ),
    (
        "Why can't you use a window function in a WHERE clause",
        frozenset(["08_SQL", "20_Interview_Mastery", "14_Mental_Models"]),
    ),
    (
        "ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()",
        frozenset(["08_SQL", "20_Interview_Mastery"]),
    ),
    (
        "int[] a = {1,2,3}; int[] b = a; b[0] = 99;",
        frozenset([
            "02_Data_Structures",
            "03_Algorithms",
            "04_Patterns_Templates",
            "05_Problem_Solving",
            "20_Interview_Mastery",
            "14_Mental_Models",
        ]),
    ),
]

CHALLENGE_BLOCK_RE = re.compile(
    r"(^> \*\*Challenge\s+\d+.*\n(?:^>.*\n)*?^> </details>\n(?:^>\s*\n)?)",
    re.MULTILINE,
)


def iter_markdown_files(base: Path):
    for path in base.rglob("*.md"):
        rel_parts = path.relative_to(base).parts
        if ".git" in rel_parts:
            continue
        # Keep historical archive untouched.
        if rel_parts and rel_parts[0].startswith("_"):
            continue
        yield path


def remove_blocks_with_signature(text: str, signature: str) -> tuple[str, int]:
    removed = 0
    chunks = []
    last = 0
    for match in CHALLENGE_BLOCK_RE.finditer(text):
        block = match.group(1)
        if signature not in block:
            continue
        chunks.append(text[last: match.start()])
        last = match.end()
        removed += 1

    if removed == 0:
        return text, 0

    chunks.append(text[last:])
    return "".join(chunks), removed


def _find_challenge_start(lines: list[str], index: int) -> int | None:
    cursor = index
    while cursor >= 0 and not lines[cursor].startswith("> **Challenge"):
        cursor -= 1
    return cursor if cursor >= 0 else None


def _find_challenge_end(lines: list[str], index: int) -> int | None:
    cursor = index
    while cursor < len(lines) and "</details>" not in lines[cursor]:
        cursor += 1
    if cursor >= len(lines):
        return None

    cursor += 1
    while cursor < len(lines) and lines[cursor].strip() == ">":
        cursor += 1
    return cursor


def _merge_ranges(ranges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    if not ranges:
        return []
    ranges.sort()
    merged = [ranges[0]]
    for start, end in ranges[1:]:
        prev_start, prev_end = merged[-1]
        if start <= prev_end:
            merged[-1] = (prev_start, max(prev_end, end))
        else:
            merged.append((start, end))
    return merged


def _remove_ranges(lines: list[str], ranges: list[tuple[int, int]]) -> str:
    out = []
    cursor = 0
    for start, end in ranges:
        out.extend(lines[cursor:start])
        cursor = end
    out.extend(lines[cursor:])
    return "".join(out)


def remove_block_by_line_scan(text: str, signature: str) -> tuple[str, int]:
    lines = text.splitlines(keepends=True)
    hit_indices = [
        i for i, line in enumerate(lines) if signature in line and line.lstrip().startswith(">")
    ]
    if not hit_indices:
        return text, 0

    ranges = []
    for idx in hit_indices:
        start = _find_challenge_start(lines, idx)
        if start is None:
            continue

        end = _find_challenge_end(lines, idx)
        if end is None:
            continue
        ranges.append((start, end))

    merged = _merge_ranges(ranges)
    if not merged:
        return text, 0
    return _remove_ranges(lines, merged), len(merged)


def process_file(path: Path, base: Path) -> tuple[int, list[str]]:
    rel = path.relative_to(base)
    folder = rel.parts[0] if rel.parts else ""
    original = path.read_text(encoding="utf-8", errors="ignore")
    modified = original
    removed_count = 0
    unresolved = []

    for signature, allowed_folders in CONTAMINATIONS:
        if signature not in modified or folder in allowed_folders:
            continue

        modified, removed = remove_blocks_with_signature(modified, signature)
        removed_count += removed

        if removed == 0 and signature in modified:
            modified, line_removed = remove_block_by_line_scan(
                modified, signature)
            removed_count += line_removed
            if line_removed == 0 and signature in modified:
                unresolved.append(f'{rel.as_posix()}: sig="{signature[:50]}"')

    if removed_count > 0 and modified != original:
        path.write_text(modified, encoding="utf-8")

    return removed_count, unresolved


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", type=Path,
                        default=DEFAULT_BASE, help="Workspace root to scan")
    args = parser.parse_args()

    base = args.base.resolve()
    total_files = 0
    total_removals = 0
    manual_review: list[str] = []

    for md_file in iter_markdown_files(base):
        file_removals, unresolved = process_file(md_file, base)
        if file_removals > 0:
            rel = md_file.relative_to(base).as_posix()
            print(f"[FIXED] {rel}  ({file_removals} item(s) removed)")
            total_files += 1
            total_removals += file_removals
        manual_review.extend(unresolved)

    print(f"\n{'=' * 60}")
    print(f"  Files fixed    : {total_files}")
    print(f"  Items removed  : {total_removals}")
    if manual_review:
        print(f"\n  Manual review needed ({len(manual_review)}):")
        for item in manual_review[:10]:
            print(f"    {item}")
    print(f"{'=' * 60}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
