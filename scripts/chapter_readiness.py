#!/usr/bin/env python3
"""
chapter_readiness.py — per-chapter MIT/KTH/RWTH readiness score.

Scans every .md chapter file in 02_Data_Structures/ and 03_Algorithms/
and checks for the presence of the 6 Tier 1–4 upgrade markers:

  ✓ Proof Corner     — MIT-style correctness proof or loop invariant
  ✓ When It Breaks   — failure mode / war story section
  ✓ Exam Problems    — MIT/RWTH exam-style challenge questions
  ✓ Reference Anchor — open-source codebase cross-reference (📎 or "Reference Anchor")
  ✓ Brute Force      — brute force → optimal section
  ✓ Java Example     — runnable Java code snippet (code block or reference)

Usage:
    python scripts/chapter_readiness.py              # print table + summary
    python scripts/chapter_readiness.py --missing    # only chapters with gaps
    python scripts/chapter_readiness.py --json       # machine-readable JSON
    python scripts/chapter_readiness.py --csv        # CSV for spreadsheet

Exit code: 0 if every chapter scores 6/6, else 1 (useful for CI gates).
"""

import os
import re
import sys
import json
import csv
import io
import argparse
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).parent.parent
SCAN_DIRS = [
    REPO_ROOT / "02_Data_Structures",
    REPO_ROOT / "03_Algorithms",
]

# Each marker: (label, list-of-regex-patterns-ANY-of-which-counts-as-present)
# Patterns are searched case-insensitively against the full file text.
MARKERS = [
    ("Proof Corner", [
        r"proof corner",
        r"loop invariant",
        r"correctness proof",
        r"## proof",
        r"### proof",
    ]),
    ("When It Breaks", [
        r"when.*breaks",
        r"failure mode",
        r"when it fails",
        r"war stor",
        r"## break",
    ]),
    ("Exam Problems", [
        r"section challenge",
        r"exam problem",
        r"## exam",
        r"### exam",
        r"university.*exam",
        r"mit.*problem",
        r"rwth.*problem",
    ]),
    ("Ref Anchor", [
        r"reference anchor",
        r"📎",
        r"openjdk",
        r"guava.*graph",
        r"jdk.*source",
        r"stable permalink",
    ]),
    ("Brute Force", [
        r"brute force",
        r"brute-force",
        r"naive.*o\(n",
        r"o\(n[²2]\).*naive",
        r"→ optimal",
        r"-> optimal",
    ]),
    ("Java Example", [
        r"```java",
        r"javasolutions",
        r"\.java",
        r"public (static|class)",
        r"arraydeque",
        r"priorityqueue",
    ]),
]

# Files to skip (non-chapter index/meta files)
SKIP_PATTERNS = [
    r"00_INDEX",
    r"00_CHEAT_SHEET",
    r"00_CROSS_DOMAIN",
    r"00_MASTER_ALGORITHM",
    r"00_ALGORITHM_TIMELINE",
    r"AUDIT",
    r"COVERAGE_MAP",
    r"_PROBLEM_BRIDGES",
    r"^CONTEXT$",   # meta-description files, not teaching chapters
]

SCORE_COLORS = {6: "######", 5: "#####.", 4: "####..", 3: "###...", 2: "##....", 1: "#.....", 0: "......"}

# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------
def should_skip(path: Path) -> bool:
    name = path.stem.upper()
    for pat in SKIP_PATTERNS:
        if re.search(pat, name, re.IGNORECASE):
            return True
    return False


def score_file(path: Path) -> dict:
    try:
        text = path.read_text(encoding="utf-8", errors="replace").lower()
    except Exception as e:
        return {"path": path, "error": str(e), "markers": {}, "score": 0}

    markers_found = {}
    for label, patterns in MARKERS:
        found = any(re.search(p, text, re.IGNORECASE) for p in patterns)
        markers_found[label] = found

    score = sum(1 for v in markers_found.values() if v)
    rel = path.relative_to(REPO_ROOT)
    return {
        "path": path,
        "rel": str(rel),
        "name": path.stem,
        "markers": markers_found,
        "score": score,
        "lines": text.count("\n"),
    }


def collect_results() -> list[dict]:
    results = []
    for d in SCAN_DIRS:
        if not d.exists():
            print(f"  [WARN] directory not found: {d}", file=sys.stderr)
            continue
        for md in sorted(d.glob("**/*.md")):
            if should_skip(md):
                continue
            results.append(score_file(md))
    return results


# ---------------------------------------------------------------------------
# Output formatters
# ---------------------------------------------------------------------------
def print_table(results: list[dict], missing_only: bool = False):
    marker_labels = [m[0] for m in MARKERS]
    short = ["Proof", "Breaks", "Exam", "Ref", "BF", "Java"]

    # Header
    col_w = 42
    print()
    print(f"{'Chapter':<{col_w}}  {'Proof':>5}  {'Breaks':>6}  {'Exam':>4}  {'Ref':>3}  {'BF':>2}  {'Java':>4}  Score  Stars")
    print("-" * (col_w + 52))

    total_perfect = 0
    total_files = 0

    for r in results:
        s = r["score"]
        if missing_only and s == 6:
            continue
        total_files += 1
        if s == 6:
            total_perfect += 1

        m = r["markers"]
        def tick(label):
            return " Y" if m.get(label) else " -"

        name = r["name"]
        if len(name) > col_w - 2:
            name = name[: col_w - 5] + "..."

        stars = SCORE_COLORS.get(s, "?")
        print(
            f"{name:<{col_w}}  {tick('Proof Corner'):>5}  {tick('When It Breaks'):>6}  "
            f"{tick('Exam Problems'):>4}  {tick('Ref Anchor'):>3}  {tick('Brute Force'):>2}  "
            f"{tick('Java Example'):>4}  {s}/6    {stars}"
        )

    print("-" * (col_w + 52))
    all_r = [r for r in results if not (missing_only and r["score"] == 6)]
    shown = len(all_r)
    total = len(results)

    if missing_only:
        print(f"\nShowing {shown} chapters with gaps (out of {total} total).")
    else:
        perfect = sum(1 for r in results if r["score"] == 6)
        avg = sum(r["score"] for r in results) / max(len(results), 1)
        print(f"\nTotal chapters: {total}")
        print(f"Perfect 6/6:    {perfect} ({100*perfect//max(total,1)}%)")
        print(f"Average score:  {avg:.2f}/6")

        # Per-marker summary
        print()
        print("Marker coverage:")
        for label, _ in MARKERS:
            count = sum(1 for r in results if r["markers"].get(label))
            pct = 100 * count // max(total, 1)
            bar = "#" * (pct // 5) + "." * (20 - pct // 5)
            print(f"  {label:<16} {bar} {count:>3}/{total} ({pct:>3}%)")


def print_json(results: list[dict]):
    out = []
    for r in results:
        out.append({
            "file": r["rel"],
            "score": r["score"],
            "lines": r.get("lines", 0),
            "markers": r["markers"],
        })
    print(json.dumps(out, indent=2))


def print_csv(results: list[dict]):
    marker_labels = [m[0] for m in MARKERS]
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["File", "Score", "Lines"] + marker_labels)
    for r in results:
        row = [r["rel"], r["score"], r.get("lines", 0)]
        for label in marker_labels:
            row.append("Y" if r["markers"].get(label) else "N")
        writer.writerow(row)
    print(buf.getvalue())


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Chapter readiness scorer for DS/Algo curriculum.")
    parser.add_argument("--missing", action="store_true", help="Show only chapters with score < 6")
    parser.add_argument("--json",    action="store_true", help="Output JSON")
    parser.add_argument("--csv",     action="store_true", help="Output CSV")
    args = parser.parse_args()

    print(f"Scanning chapters in: {', '.join(str(d) for d in SCAN_DIRS)}", file=sys.stderr)
    results = collect_results()

    if not results:
        print("No chapter files found.", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print_json(results)
    elif args.csv:
        print_csv(results)
    else:
        print_table(results, missing_only=args.missing)

    # Exit 1 if any chapter is below 6/6 (useful for CI)
    all_perfect = all(r["score"] == 6 for r in results)
    sys.exit(0 if all_perfect else 1)


if __name__ == "__main__":
    main()
