"""Remove remaining Java-specific contamination blocks from non-Java folders."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

DEFAULT_BASE = Path(__file__).resolve().parent

BAD_SIGS = [
    "ExecutorService.submit(task)",
    "List<String> list = new ArrayList<>",
    "A method returns `(T) jsonDeserialize(json)",
]

JAVA_OK = frozenset(
    ["07_Modern_Java", "13_Developer_Essentials", "20_Interview_Mastery"])

CHALLENGE_BLOCK_RE = re.compile(
    r"(^> \*\*Challenge\s+\d+.*\n(?:^>.*\n)*?^> </details>\n(?:^>\s*\n)?)",
    re.MULTILINE,
)


def iter_markdown_files(base: Path):
    for path in base.rglob("*.md"):
        rel_parts = path.relative_to(base).parts
        if ".git" in rel_parts:
            continue
        if rel_parts and rel_parts[0].startswith("_"):
            continue
        yield path


def remove_challenge_block(text: str, signature: str) -> tuple[str, int]:
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


def fallback_remove_line_scan(text: str, signature: str) -> tuple[str, int]:
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
    if folder in JAVA_OK:
        return 0, []

    original = path.read_text(encoding="utf-8", errors="ignore")
    modified = original
    file_removals = 0
    unresolved = []

    for signature in BAD_SIGS:
        if signature not in modified:
            continue

        modified, removed = remove_challenge_block(modified, signature)
        file_removals += removed

        if removed == 0 and signature in modified:
            modified, fallback_removed = fallback_remove_line_scan(
                modified, signature)
            file_removals += fallback_removed
            if fallback_removed == 0 and signature in modified:
                unresolved.append(f"{rel.as_posix()}: {signature[:40]}")

    if file_removals > 0 and modified != original:
        path.write_text(modified, encoding="utf-8")

    return file_removals, unresolved


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", type=Path,
                        default=DEFAULT_BASE, help="Workspace root to scan")
    args = parser.parse_args()

    base = args.base.resolve()
    total_files = 0
    total_removals = 0
    still_remaining = []

    for path in iter_markdown_files(base):
        rel = path.relative_to(base).as_posix()
        file_removals, unresolved = process_file(path, base)
        still_remaining.extend(unresolved)
        if file_removals > 0:
            print(f"[FIXED] {rel}  ({file_removals} item(s))")
            total_files += 1
            total_removals += file_removals

    print(f"\n{'=' * 55}")
    print(f"  Files fixed    : {total_files}")
    print(f"  Items removed  : {total_removals}")
    if still_remaining:
        print(f"\n  Still remaining ({len(still_remaining)}):")
        for item in still_remaining[:10]:
            print(f"    {item}")
    print(f"{'=' * 55}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
