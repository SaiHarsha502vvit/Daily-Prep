#!/usr/bin/env python3
"""Find 'run-on' plain-text blocks in Markdown: runs of >= MIN consecutive non-blank lines that GitHub renders as ONE paragraph
(soft line breaks collapse), outside code fences, <details>/<summary> markup lines, tables, headings, blockquotes, list items,
HTML blocks and link-reference lines. These are usually line-per-item content that was meant to be a list or a table.

Usage:  python tools/find_runon_lines.py [folder ...]        (default: whole repo)
        python tools/find_runon_lines.py --csv out.csv 03_Algorithms
Prints per-folder / per-file counts and, with -v, the first lines of each block. Exit 0 always (it is a finder, not a gate).
"""
import csv, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SKIP_DIRS = {"node_modules", ".git", ".kimchi", ".claude", "_archive", "dist", "__pycache__", "test-results", "playwright-report", "audit"}
MIN = 3
LIST_RE = re.compile(r"^\s*([-*+]|\d+[.)])\s+")
TABLE_RE = re.compile(r"^\s*\|")
HEAD_RE = re.compile(r"^\s{0,3}#{1,6}\s")
QUOTE_RE = re.compile(r"^\s*>")
HTML_RE = re.compile(r"^\s*</?[a-zA-Z][^>]*>\s*$|^\s*<(details|summary|br|hr|div|p|img|a)\b", re.I)
FENCE_RE = re.compile(r"^\s*(```|~~~)")
HR_RE = re.compile(r"^\s*([-*_]\s*){3,}$")
REF_RE = re.compile(r"^\s*\[[^\]]+\]:\s")
INDENT_CODE_RE = re.compile(r"^(    |\t)")
# lines that already force a hard break (two trailing spaces or a backslash) are fine
HARD_BREAK_RE = re.compile(r"(  |\\)$")


def md_files(paths):
    for p in paths:
        p = os.path.abspath(p)
        if os.path.isfile(p):
            yield p; continue
        for d, dirs, files in os.walk(p):
            dirs[:] = [x for x in dirs if x not in SKIP_DIRS and not x.startswith(".")]
            for f in files:
                if f.endswith(".md"):
                    yield os.path.join(d, f)


def blocks(path):
    lines = open(path, encoding="utf-8", errors="ignore").read().splitlines()
    in_fence = False
    run = []  # (lineno, text)
    out = []

    def flush():
        # a block counts only if >= MIN lines and NOT all of them end with a hard break
        if len(run) >= MIN and not all(HARD_BREAK_RE.search(t) for _, t in run[:-1]):
            out.append(list(run))
        run.clear()

    for i, raw in enumerate(lines, 1):
        line = raw.rstrip("\r")
        if FENCE_RE.match(line):
            flush(); in_fence = not in_fence; continue
        if in_fence:
            continue
        if (not line.strip() or LIST_RE.match(line) or TABLE_RE.match(line) or HEAD_RE.match(line) or QUOTE_RE.match(line)
                or HTML_RE.match(line) or HR_RE.match(line) or REF_RE.match(line) or INDENT_CODE_RE.match(line)):
            flush(); continue
        run.append((i, line))
    flush()
    return out


def main():
    args = sys.argv[1:]
    verbose = "-v" in args; args = [a for a in args if a != "-v"]
    csv_out = None
    if "--csv" in args:
        k = args.index("--csv"); csv_out = args[k + 1]; del args[k:k + 2]
    paths = args or [ROOT]
    rows = []
    for f in sorted(md_files(paths)):
        bs = blocks(f)
        if bs:
            rel = os.path.relpath(f, ROOT).replace("\\", "/")
            rows.append((rel, len(bs), sum(len(b) for b in bs), bs))
    by = {}
    for rel, n, lines, _ in rows:
        top = rel.split("/")[0]
        a = by.setdefault(top, [0, 0, 0]); a[0] += 1; a[1] += n; a[2] += lines
    print(f"{'folder':34s} {'files':>5s} {'blocks':>7s} {'lines':>7s}")
    for k in sorted(by):
        print(f"{k:34s} {by[k][0]:5d} {by[k][1]:7d} {by[k][2]:7d}")
    print(f"{'TOTAL':34s} {sum(v[0] for v in by.values()):5d} {sum(v[1] for v in by.values()):7d} {sum(v[2] for v in by.values()):7d}")
    if verbose:
        for rel, n, lines, bs in sorted(rows, key=lambda r: -r[2])[:40]:
            print(f"\n{rel}: {n} blocks / {lines} lines")
            for b in bs[:2]:
                print(f"   L{b[0][0]}-{b[-1][0]}: " + " | ".join(t.strip()[:50] for _, t in b[:3]))
    if csv_out:
        with open(csv_out, "w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh); w.writerow(["file", "blocks", "lines", "first_line_numbers"])
            for rel, n, lines, bs in rows:
                w.writerow([rel, n, lines, ";".join(str(b[0][0]) for b in bs[:20])])


if __name__ == "__main__":
    main()
