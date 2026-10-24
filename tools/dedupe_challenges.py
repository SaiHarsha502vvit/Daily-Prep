#!/usr/bin/env python3
"""Remove duplicated 'Challenge N (...)' blocks: the same question (+ its <details> answer) copied into several files.

A challenge block is a line starting `**Challenge N (Type):**` followed by the question and a <details> ... </details> answer.
Blocks whose normalised question text appears in two or more places form a GROUP. One copy is kept: the file that actually
covers the topic best (IDF-weighted term frequency of the challenge's distinctive words in the file, plus a file-name/title
match; generic hub pages are penalised). The others are removed, remaining challenges in each touched file are renumbered
1..n, and a '**Section Challenge ...**' header left with no challenge under it is dropped (and listed in
00_CURRICULUM/audit/sections_without_challenge.txt so topic-appropriate challenges can be written for it later).

  python tools/dedupe_challenges.py --plan     dry run: every group, the kept file, the files that lose a copy
  python tools/dedupe_challenges.py --apply    rewrite files (each file's line endings are preserved)
"""
import collections, math, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SKIP_DIRS = {"node_modules", ".git", ".kimchi", ".claude", "_archive", "dist", "audit", ".manifest"}
CR = chr(13)
START = re.compile(r"^\*\*Challenge\s+(\d+)\s*\(([^)]+)\)\s*:?\*\*\s*:?\s*(.*)$")
SECTION_HDR = re.compile(r"^\s*(\U0001F52C\s*)?\*\*Section Challenge")
BOUNDARY = re.compile(r"^\s*(#{1,6}\s|---\s*$|\U0001F52C)")
FOLDER_PREF = ["03_Algorithms", "04_Patterns_Templates", "05_Problem_Solving", "02_Data_Structures", "06_OOP_Design", "07_Modern_Java",
               "08_SQL", "13_Developer_Essentials", "14_Mental_Models", "15_React_Frontend", "16_JavaScript", "17_TypeScript",
               "10_Enterprise_Systems", "22_DevOps", "20_Interview_Mastery", "09_Career_Reference", "01_Getting_Started"]
GENERIC_HUBS = ("Study_Plan_Calendar", "Mock_Interview", "Quick_Reference", "PDF_Topic", "Coverage_Map", "Pattern_Recognition_Engine")
STOPW = set("which would should there their these those about with from that this what when where into than then over more most such only "
            "also have been being were does done each both same other some many much very just like make made need needs want used uses using "
            "show shows give gives case cases code data value values result results example examples answer question challenge reasoning "
            "design hunt explain define write find number time times first second third often every always never because while after before "
            "between without within through under again still really actually exactly simply thing things point points step steps part parts "
            "true false null".split())


def norm(s):
    s = re.sub(r"[`*_>#|\-–—:()\[\]\"']+", " ", s.lower())
    return re.sub(r"\s+", " ", s).strip()


def toks(text):
    return [w for w in re.findall(r"[a-z][a-z0-9]{3,}", text.lower()) if w not in STOPW]


def md_files():
    for d, dirs, fs in os.walk(ROOT):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS and not x.startswith(".")]
        for f in fs:
            if f.endswith(".md"):
                yield os.path.join(d, f)


def parse_blocks(lines):
    """(start, end_exclusive, number, type, question) for each Challenge block that is followed by a <details> answer."""
    blocks = []; i = 0; in_fence = False
    while i < len(lines):
        ln = lines[i]
        if re.match(r"^\s*(```|~~~)", ln):
            in_fence = not in_fence; i += 1; continue
        m = None if in_fence else START.match(ln.rstrip(CR))
        if not m:
            i += 1; continue
        j = i + 1; q = [m.group(3)]; ok = True
        while j < len(lines) and not lines[j].lstrip().startswith("<details"):
            if START.match(lines[j].rstrip(CR)) or re.match(r"^\s*#{1,6}\s", lines[j]) or j - i > 40:
                ok = False; break
            q.append(lines[j]); j += 1
        if not ok or j >= len(lines):
            i += 1; continue
        k = j; depth = 0
        while k < len(lines):
            depth += len(re.findall(r"<details", lines[k])) - len(re.findall(r"</details>", lines[k]))
            if depth <= 0 and "</details>" in lines[k]:
                break
            k += 1
        if k >= len(lines):
            i += 1; continue
        blocks.append((i, k + 1, int(m.group(1)), m.group(2).strip(), " ".join(x.strip() for x in q).strip()))
        i = k + 1
    return blocks


def title_tokens(path, lines):
    h1 = next((l for l in lines if l.startswith("# ")), "")
    t = os.path.basename(path).lower() + " " + h1.lower() + " " + os.path.basename(os.path.dirname(path)).lower()
    return set(w for w in re.findall(r"[a-z0-9]+", t) if len(w) > 2)


def main():
    apply = "--apply" in sys.argv
    only = None
    if "--only" in sys.argv:                       # e.g. --only 02_Data_Structures,03_Algorithms  (canonical choice stays global)
        only = tuple(x.strip("/") + "/" for x in sys.argv[sys.argv.index("--only") + 1].split(","))
    rel = lambda p: os.path.relpath(p, ROOT).replace("\\", "/")
    files = {}; groups = collections.defaultdict(list); spans = {}
    for p in md_files():
        raw = open(p, "rb").read().decode("utf-8", errors="surrogateescape")
        eol = "\r\n" if "\r\n" in raw else "\n"
        lines = raw.replace("\r\n", "\n").split("\n")
        files[p] = (lines, eol)
        spans[p] = [(b[0], b[1]) for b in parse_blocks(lines)]
        for b in parse_blocks(lines):
            key = norm(b[4])[:160]
            if len(key.split()) >= 6:
                groups[key].append((p, b))
    dup = {k: v for k, v in groups.items() if len(v) >= 2}
    tf = {}; df = collections.Counter()
    for p, (lines, _) in files.items():
        skip = set()
        for s, e in spans[p]:
            skip.update(range(s, e))      # topic coverage is measured WITHOUT the challenge blocks themselves
        c = collections.Counter(toks(" ".join(l for i, l in enumerate(lines) if i not in skip))); tf[p] = c
        for w in c:
            df[w] += 1
    N = max(1, len(files))

    def score(it):
        p, b = it
        lines0 = files[p][0]
        keyw = set(toks(" ".join(lines0[b[0]:b[1]])))
        topic = sum(math.log(N / (1 + df[w])) * math.log(1 + tf[p][w]) for w in keyw if df[w] < N * 0.2)
        tt = title_tokens(p, lines0)
        title_hit = sum(1 for w in keyw if any(w[:5] == x[:5] for x in tt))
        hub = any(h in p for h in GENERIC_HUBS)
        fp = next((i for i, f in enumerate(FOLDER_PREF) if rel(p).startswith(f)), 99)
        return (-(topic + 6 * title_hit) + (40 if hub else 0), fp, rel(p))

    remove = collections.defaultdict(list); plan = []
    for key, items in dup.items():
        ordered = sorted(items, key=score)
        keep = ordered[0]; losers = ordered[1:]
        losers = [(p, b) for p, b in losers if only is None or rel(p).startswith(only)]
        for p, b in losers:
            remove[p].append((b[0], b[1]))
        if losers:
            plan.append((key, keep, losers))
    print(f"{len(dup)} duplicated challenge questions | {sum(len(v) for v in remove.values())} blocks to remove from {len(remove)} files")
    for key, keep, losers in sorted(plan, key=lambda x: -len(x[2])):
        print(f"\n[{len(losers) + 1} copies] {key[:90]}\n   KEEP   {rel(keep[0])}")
        for p, b in losers:
            print(f"   remove {rel(p)} (Challenge {b[2]})")
    if not apply:
        print("\n(dry run - re-run with --apply)"); return

    changed = 0; empty_sections = []
    for p, spans in remove.items():
        lines, eol = files[p]; drop = set()
        for s, e in spans:
            drop.update(range(s, e))
            if e < len(lines) and not lines[e].strip():
                drop.add(e)
        new = [l for i, l in enumerate(lines) if i not in drop]
        n = 0
        for i, l in enumerate(new):
            m = START.match(l.rstrip(CR))
            if m:
                n += 1
                if int(m.group(1)) != n:
                    new[i] = re.sub(r"^\*\*Challenge\s+\d+", "**Challenge %d" % n, l, count=1)
        out = []; k = 0
        while k < len(new):
            if SECTION_HDR.match(new[k]):
                j = k + 1; has = False
                while j < len(new) and not BOUNDARY.match(new[j]):
                    if START.match(new[j].rstrip(CR)):
                        has = True; break
                    j += 1
                if not has:
                    empty_sections.append(rel(p) + " :: " + new[k].strip()[:90]); k += 1
                    while k < len(new) and not new[k].strip():
                        k += 1
                    continue
            out.append(new[k]); k += 1
        open(p, "wb").write(eol.join(out).encode("utf-8", errors="surrogateescape")); changed += 1
    d = os.path.join(ROOT, "00_CURRICULUM", "audit"); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "sections_without_challenge.txt"), "w", encoding="utf-8").write("\n".join(empty_sections))
    print(f"\napplied: {changed} files rewritten; {len(empty_sections)} 'Section Challenge' headers dropped (listed in 00_CURRICULUM/audit/sections_without_challenge.txt)")


if __name__ == "__main__":
    main()
