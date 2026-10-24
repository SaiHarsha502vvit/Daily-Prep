#!/usr/bin/env python3
"""Find redundancy in the learning material, three ways:

  1. EXACT duplicate files (same normalised content).
  2. Repeated PARAGRAPHS: the same prose block (>= MIN_WORDS words) or the same code block (>= MIN_CODE_LINES lines)
     appearing in two or more files (or twice in one file). Files are then paired and scored by CONTAINMENT =
     shared words / words of the smaller file, so a small file that lives inside a big one is caught.
  3. SAME TOPIC, different homes: files in different folders whose names share the same topic tokens (e.g. "Docker",
     "Kafka", "Git"), listed for a human to decide which one is canonical.

Usage:  python tools/find_redundancy.py [folder ...]          (default: whole repo)
        python tools/find_redundancy.py --md out.md           (also write a Markdown report)
It is a FINDER: it reports where to look. Deciding the canonical home and replacing the copy with a link is a human step.
"""
import hashlib, os, re, sys
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SKIP_DIRS = {"node_modules", ".git", ".kimchi", ".claude", "_archive", "dist", "__pycache__", "test-results", "playwright-report",
             "audit", ".manifest", "allure-results", "allure-report"}
SKIP_FILES = {"FILE_REGISTRY.md", "FILE_REGISTRY_SUMMARY.md", "CHANGE_JOURNAL.md", "AUDIT_REPORT.md", "REDUNDANCY_REPORT.md"}
MIN_WORDS = 25
MIN_CODE_LINES = 6
STOP = {"the", "a", "an", "and", "of", "for", "to", "in", "on", "with", "how", "what", "why", "complete", "deep", "dive", "guide", "essentials",
        "fundamentals", "advanced", "core", "part", "basics", "introduction", "intro", "md", "problem", "sets", "problems", "reference", "mastery"}


def files(paths):
    for p in paths:
        p = os.path.abspath(p)
        if os.path.isfile(p):
            yield p; continue
        for d, dirs, fs in os.walk(p):
            dirs[:] = [x for x in dirs if x not in SKIP_DIRS and not x.startswith(".")]
            for f in fs:
                if f.endswith(".md") and f not in SKIP_FILES:
                    yield os.path.join(d, f)


def norm(s):
    s = re.sub(r"[`*_>#|\-–—:]+", " ", s.lower())
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)
    return re.sub(r"\s+", " ", s).strip()


def parse(path):
    text = open(path, encoding="utf-8", errors="ignore").read().replace("\r\n", "\n")
    paras, codes = [], []
    in_fence = False; buf = []; cbuf = []

    def flush_p():
        if buf:
            t = " ".join(buf); buf.clear()
            if not re.match(r"^\s*#", t) and not re.match(r"^\s*\|?[\s:|-]+\|?\s*$", t):
                paras.append(t)

    for line in text.split("\n"):
        if re.match(r"^\s*(```|~~~)", line):
            if in_fence:
                if len(cbuf) >= MIN_CODE_LINES: codes.append("\n".join(cbuf))
                cbuf = []
            else:
                flush_p()
            in_fence = not in_fence; continue
        if in_fence:
            if line.strip(): cbuf.append(line.strip())
            continue
        if not line.strip() or re.match(r"^\s*#{1,6}\s", line):
            flush_p(); continue
        buf.append(line.strip())
    flush_p()
    return text, paras, codes


def main():
    args = sys.argv[1:]
    md_out = None
    if "--md" in args:
        k = args.index("--md"); md_out = args[k + 1]; del args[k:k + 2]
    paths = args or [ROOT]
    fl = sorted(set(files(paths)))
    rel = lambda p: os.path.relpath(p, ROOT).replace("\\", "/")

    exact = defaultdict(list); words_of = {}; index = defaultdict(set); within = defaultdict(int)
    for f in fl:
        text, paras, codes = parse(f)
        words_of[f] = max(1, len(re.findall(r"\w+", text)))
        exact[hashlib.sha1(norm(text).encode()).hexdigest()].append(f)
        seen = set()
        for kind, items in (("p", paras), ("c", codes)):
            for it in items:
                n = norm(it); w = len(n.split())
                if kind == "p" and w < MIN_WORDS: continue
                h = (kind, hashlib.sha1(n.encode()).hexdigest()); wt = w if kind == "p" else len(it.split())
                if h in seen: within[f] += wt
                seen.add(h); index[h].add((f, wt))

    out = []
    dups = [v for v in exact.values() if len(v) > 1 and words_of[v[0]] > 30]
    out.append(f"## 1. Exact duplicate files ({len(dups)} groups)\n")
    for g in dups: out.append("- " + "  =  ".join(f"`{rel(x)}`" for x in g))

    # pair scoring
    pair = defaultdict(int)
    for h, members in index.items():
        fs = sorted({m[0] for m in members})
        if len(fs) < 2: continue
        wt = max(m[1] for m in members)
        for i in range(len(fs)):
            for j in range(i + 1, len(fs)):
                pair[(fs[i], fs[j])] += wt
    rows = []
    for (a, b), shared in pair.items():
        cont = shared / min(words_of[a], words_of[b])
        if shared >= 150 and cont >= 0.12: rows.append((cont, shared, a, b))
    rows.sort(reverse=True)
    out.append(f"\n## 2. File pairs sharing the same paragraphs / code ({len(rows)} pairs; containment = shared words / smaller file)\n")
    out.append("| Containment | Shared words | File A | File B |\n| ---: | ---: | --- | --- |")
    for cont, shared, a, b in rows[:120]:
        out.append(f"| {cont:.0%} | {shared} | `{rel(a)}` | `{rel(b)}` |")
    if len(rows) > 120: out.append(f"| … | | {len(rows)-120} more pairs | |")

    wf = sorted(((w, f) for f, w in within.items() if w >= 60), reverse=True)
    out.append(f"\n## 3. Paragraphs repeated INSIDE one file ({len(wf)} files with >=60 repeated words)\n")
    for w, f in wf[:40]: out.append(f"- {w} repeated words — `{rel(f)}`")

    # topic homes
    topic = defaultdict(set)
    for f in fl:
        toks = [t for t in re.findall(r"[a-z0-9]+", os.path.basename(f).lower().replace(".md", "")) if t not in STOP and not t.isdigit() and len(t) > 2]
        for t in set(toks): topic[t].add(os.path.dirname(rel(f)).split("/")[0] + "|" + rel(f))
    out.append("\n## 4. Same topic name in different top-level folders (decide the canonical home)\n")
    out.append("| Topic token | Folders | Files |\n| --- | --- | --- |")
    for t, v in sorted(topic.items()):
        folders = sorted({x.split("|")[0] for x in v})
        if len(folders) >= 2 and len(v) <= 12:
            out.append(f"| `{t}` | {', '.join(folders)} | " + "; ".join(f"`{x.split('|')[1].split('/')[-1]}`" for x in sorted(v)) + " |")
    report = "\n".join(out)
    print(f"{len(fl)} files | exact-duplicate groups: {len(dups)} | overlapping pairs: {len(rows)} | files with internal repeats: {len(wf)}")
    for cont, shared, a, b in rows[:25]: print(f"{cont:5.0%} {shared:6d}  {rel(a)}  <>  {rel(b)}")
    if md_out:
        open(md_out, "w", encoding="utf-8").write("# Redundancy Report\n\n> Generated by `tools/find_redundancy.py`. A finder, not a verdict: each pair needs a human/agent decision on the canonical home.\n\n" + report + "\n")
        print("wrote", md_out)


if __name__ == "__main__":
    main()
