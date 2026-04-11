"""Extract markdown tables incorrectly wrapped inside blockquotes."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

DEFAULT_BASE = Path(__file__).resolve().parent
QUOTE_TABLE_LINE_RE = re.compile(r"^>\s*\|")
TABLE_SEPARATOR_RE = re.compile(
    r"^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$")


def iter_markdown_files(base: Path):
    for path in base.rglob("*.md"):
        rel_parts = path.relative_to(base).parts
        if ".git" in rel_parts:
            continue
        if rel_parts and rel_parts[0].startswith("_"):
            continue
        yield path


def dequote_table_line(line: str) -> str:
    return re.sub(r"^>\s*", "", line, count=1)


def looks_like_table(quoted_lines: list[str]) -> bool:
    if len(quoted_lines) < 2:
        return False

    plain = [dequote_table_line(line).rstrip("\n") for line in quoted_lines]
    for idx in range(len(plain) - 1):
        if plain[idx].strip() and TABLE_SEPARATOR_RE.match(plain[idx + 1].strip()):
            return True
    return False


def collect_quoted_block(lines: list[str], start: int) -> tuple[list[str], int]:
    block = []
    cursor = start
    while cursor < len(lines) and QUOTE_TABLE_LINE_RE.match(lines[cursor]):
        block.append(lines[cursor])
        cursor += 1
    return block, cursor


def append_table_with_padding(out: list[str], table_lines: list[str], next_line: str | None) -> None:
    if out and out[-1].strip():
        out.append("\n")
    out.extend(dequote_table_line(line) for line in table_lines)
    if next_line is not None and next_line.strip():
        out.append("\n")


def fix_blockquote_tables(text: str) -> tuple[str, int]:
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    i = 0
    moved_lines = 0

    while i < len(lines):
        if not QUOTE_TABLE_LINE_RE.match(lines[i]):
            out.append(lines[i])
            i += 1
            continue

        block, next_index = collect_quoted_block(lines, i)
        if not looks_like_table(block):
            out.extend(block)
            i = next_index
            continue

        next_line = lines[next_index] if next_index < len(lines) else None
        append_table_with_padding(out, block, next_line)
        moved_lines += len(block)
        i = next_index

    return "".join(out), moved_lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", type=Path,
                        default=DEFAULT_BASE, help="Workspace root to scan")
    args = parser.parse_args()

    base = args.base.resolve()
    total_files = 0
    total_lines = 0

    for path in iter_markdown_files(base):
        original = path.read_text(encoding="utf-8", errors="ignore")
        if "> |" not in original and ">|" not in original:
            continue

        fixed, moved = fix_blockquote_tables(original)
        if moved > 0 and fixed != original:
            path.write_text(fixed, encoding="utf-8")
            print(
                f"[FIXED] {path.relative_to(base).as_posix()} ({moved} table lines extracted)")
            total_files += 1
            total_lines += moved

    print(f"\n{'=' * 50}")
    print(f"  Total files fixed : {total_files}")
    print(f"  Total lines fixed : {total_lines}")
    print(f"{'=' * 50}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
