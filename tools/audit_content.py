#!/usr/bin/env python3
"""Per-file content audit for every Markdown lesson in the repo.

Measures TEACHING signals (not just length): does the file explain why the thing exists, its history,
alternatives and trade-offs, when (not) to use it, how it fails, give runnable examples with output,
use diagrams that are explained, and test the learner. Writes:
  00_CURRICULUM/audit/file_audit.csv     one row per file (all metrics + score + class)
  00_CURRICULUM/AUDIT_REPORT.md          per-folder summary + remediation queue

Heuristic by design: it finds where to LOOK, a human/agent still reads the file. Re-run after each batch.
Usage:  python tools/audit_content.py            (from repo root)
"""
import csv, os, re, sys
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SKIP_DIRS = {"node_modules", ".git", ".kimchi", ".claude", "_archive", "__pycache__", "dist", "playwright-report",
             "test-results", "allure-results", "allure-report", ".grade", "_meta", "worktrees"}
# Content folders are the numbered ones plus the curriculum areas.
SKIP_FILES = {"CONTEXT.md", "FILE_REGISTRY.md", "FILE_REGISTRY_SUMMARY.md", "CHANGE_JOURNAL.md"}

SIGNALS = {
    "why":      r"\b(why (it|this|we|does|do|is|are)|the problem|problem (was|is|with)|before (this|[a-z]+ existed)|motivat|pain point|what (went|was) wrong|world before)\b",
    "history":  r"\b(19[5-9]\d|20[0-2]\d)\b.{0,80}\b(invent|releas|introduc|creat|publish|announc|first|born|launch|standard)|\bhistory\b|\bhistorical\b|\bevolution\b|\bevolved\b",
    "internals":r"\b(under the hood|internals?|how it (really |actually )?works|kernel|syscall|inside the|mechanism|step[- ]by[- ]step|what happens when)\b",
    "alternatives": r"\b(alternative|trade-?offs?|compared (to|with)|versus|\bvs\.?\b|instead of|pros and cons)\b",
    "when":     r"\b(when (to use|not to use|should you|to avoid)|use (it )?when|don'?t use|avoid (it )?when|decision (criteria|rule)|choosing)\b",
    "failure":  r"\b(failure mode|fails? (when|if)|troubleshoot|debugging|common (mistakes?|errors?|pitfalls?)|gotcha|symptom|root cause|anti-?pattern|war story)\b",
    "exercise": r"\b(exercise|practice|challenge|quiz|knowledge check|try it|hands-on|lab\b|homework|section challenge)\b",
    "output":   r"\b(expected output|output:|you should see|example output|sample output|\$ [a-z])",
}
EXPLAIN = re.compile(r"how to read|reading (the|this) (diagram|figure)|walk-?through|what the diagram|step[- ]by[- ]step|what (this|the) (diagram|picture) shows|^\s*1\.\s|\*\*1\.\*\*", re.I | re.M)


def walk():
    for d, dirs, files in os.walk(ROOT):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS and not x.startswith(".")]
        for f in files:
            if f.endswith(".md") and f not in SKIP_FILES:
                yield os.path.join(d, f)


def analyse(path):
    t = open(path, encoding="utf-8", errors="ignore").read()
    lines = t.count("\n") + 1
    words = len(re.findall(r"\w+", re.sub(r"```.*?```", " ", t, flags=re.S)))
    fences = len(re.findall(r"^\s*```", t, flags=re.M)) // 2
    code_lines = sum(len(b.splitlines()) for b in re.findall(r"```[a-z]*\n(.*?)```", t, flags=re.S))
    heads = re.findall(r"^#{1,6}\s", t, flags=re.M)
    tables = len(re.findall(r"^\s*\|.+\|\s*$\n^\s*\|[\s:|-]+\|\s*$", t, flags=re.M))
    # mermaid blocks and whether an explanation follows
    mm = 0; mm_un = 0
    ls = t.splitlines()
    i = 0
    while i < len(ls):
        if re.match(r"^\s*```mermaid\s*$", ls[i]):
            mm += 1; j = i + 1
            while j < len(ls) and not re.match(r"^\s*```\s*$", ls[j]): j += 1
            if not EXPLAIN.search("\n".join(ls[j + 1:j + 15])): mm_un += 1
            i = j
        i += 1
    ascii_art = len(re.findall(r"[┌└├│─┐┘┤┬┴┼]", t)) // 20  # rough count of box-drawing "diagrams"
    low = re.sub(r"```.*?```", " ", t, flags=re.S)
    sig = {k: int(bool(re.search(p, low, re.I))) for k, p in SIGNALS.items()}
    det = len(re.findall(r"<details", t, flags=re.I))
    broken_fence = len(re.findall(r"^\s*```", t, flags=re.M)) % 2
    return dict(lines=lines, words=words, headings=len(heads), fences=fences, code_lines=code_lines, tables=tables,
                mermaid=mm, mermaid_unexplained=mm_un, ascii_art=ascii_art, details=det, odd_fences=broken_fence, **sig)


def score(m):
    s = 0
    # depth (max 30)
    s += min(30, m["words"] / 120)                    # 3600 words -> 30
    # teaching dimensions (8 signals, 7 pts each = 56)
    s += 7 * sum(m[k] for k in SIGNALS)
    # diagrams (max 8): explained diagrams count, unexplained don't
    s += min(8, 3 * (m["mermaid"] - m["mermaid_unexplained"]) + min(2, m["ascii_art"]))
    # practice (max 6)
    s += 3 * min(1, m["details"]) + 3 * min(1, m["code_lines"] / 40)
    return round(min(100, s))


def kind_of(rel):
    r = rel.replace("\\", "/").lower(); b = os.path.basename(r)
    if b in ("readme.md", "00_index.md", "00_master_index.md", "agents.md", "agent_handoff.md") or b.startswith(("00_agent", "01_file_map", "02_known", "03_buildout"))        or b.endswith("_index.md") or "index" in b.split(".")[0].split("_")[-1:]:
        return "index"
    if "12_daily_practice" in r or "/daily_log" in r or "_log" in b: return "practice-log"
    if any(x in r for x in ("quick_reference", "topic_summaries", "problem_sets", "_problem_sets", "exam_bank", "glossary", "cheat", "/solutions", "_solutions",
                            "/templates", "interview_bank", "mock_interviews", "/projects/", "/challenges/")):
        return "reference"
    return "lesson"


def classify(m, sc, rel):
    k = kind_of(rel)
    if m["odd_fences"]: return "Broken (unbalanced code fences)"
    if k != "lesson": return "Not a lesson (" + k + ")"
    if m["lines"] < 80 or m["words"] < 500: return "Superficial"
    if sc >= 70: return "Strong"
    if sc >= 50: return "Needs expansion"
    return "Superficial"


def folder_of(rel):
    return rel.split(os.sep)[0] if os.sep in rel else "(root)"


def main():
    rows = []
    for p in sorted(walk()):
        rel = os.path.relpath(p, ROOT)
        m = analyse(p); sc = score(m)
        rows.append(dict(path=rel.replace("\\", "/"), folder=folder_of(rel), score=sc, klass=classify(m, sc, rel), **m))
    out_dir = os.path.join(ROOT, "00_CURRICULUM", "audit"); os.makedirs(out_dir, exist_ok=True)
    cols = list(rows[0].keys())
    with open(os.path.join(out_dir, "file_audit.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)

    by = defaultdict(list)
    for r in rows: by[r["folder"]].append(r)
    classes = ["Strong", "Needs expansion", "Superficial", "Broken (unbalanced code fences)"]
    NL = lambda r: r["klass"].startswith("Not a lesson")
    L = ["# Content Audit Report", "",
         "> Generated by `tools/audit_content.py` from per-file measurements (`audit/file_audit.csv`). The scores are a **heuristic that tells you where to look**, "
         "not a verdict — a human or agent still reads each flagged file. Re-run the tool after every batch.", "",
         f"**{len(rows)} Markdown files** audited. Teaching signals measured per file: why-it-exists, history, internals, alternatives/trade-offs, "
         "when-to-use, failure/debugging, exercises, runnable output, plus diagram count and whether each diagram is explained.", "",
         "## Summary by folder", "", "| Folder | Files | Strong | Needs expansion | Superficial | Broken | Avg score | Unexplained diagrams |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"]
    for fo in sorted(by):
        rs = by[fo]; c = {k: sum(1 for r in rs if r["klass"] == k) for k in classes}
        L.append(f"| `{fo}` | {len(rs)} ({sum(1 for r in rs if NL(r))} non-lesson) | {c[classes[0]]} | {c[classes[1]]} | {c[classes[2]]} | {c[classes[3]]} | {round(sum(r['score'] for r in rs)/len(rs))} | {sum(r['mermaid_unexplained'] for r in rs)} |")
    tot = {k: sum(1 for r in rows if r["klass"] == k) for k in classes}
    L += ["", f"**{sum(1 for r in rows if NL(r))} files are indexes / reference sheets / logs and are not graded as lessons.** **Totals:** {tot[classes[0]]} strong · {tot[classes[1]]} need expansion · {tot[classes[2]]} superficial · {tot[classes[3]]} broken.", ""]
    L += ["## Remediation queue (worst first, per folder)", "",
          "Work folder by folder, file by file. For each file: read it fully, fix what is wrong, expand what is shallow, add missing teaching dimensions, "
          "validate diagrams (`tools/mermaid-check`), re-run this audit. `missing` lists the teaching signals the heuristic did not find.", ""]
    for fo in sorted(by):
        bad = sorted([r for r in by[fo] if r["klass"] != "Strong" and not NL(r)], key=lambda r: r["score"])
        if not bad: continue
        L += [f"### `{fo}` — {len(bad)} of {len(by[fo])} lessons need work", "", "| File | Score | Class | Words | Diagrams (unexplained) | Missing |", "| --- | ---: | --- | ---: | ---: | --- |"]
        for r in bad[:60]:
            miss = ", ".join(k for k in SIGNALS if not r[k]) or "—"
            L.append(f"| `{os.path.basename(r['path'])}` | {r['score']} | {r['klass']} | {r['words']} | {r['mermaid']} ({r['mermaid_unexplained']}) | {miss} |")
        if len(bad) > 60: L.append(f"| … {len(bad)-60} more in `audit/file_audit.csv` | | | | | |")
        L.append("")
    open(os.path.join(ROOT, "00_CURRICULUM", "AUDIT_REPORT.md"), "w", encoding="utf-8").write("\n".join(L))
    print(f"{len(rows)} files | " + " | ".join(f"{k}: {v}" for k, v in tot.items()))
    for fo in sorted(by):
        rs = by[fo]; print(f"{fo:38s} files={len(rs):3d} avg={round(sum(r['score'] for r in rs)/len(rs)):3d} " + " ".join(f"{k[:5]}={sum(1 for r in rs if r['klass']==k)}" for k in classes))

if __name__ == "__main__":
    main()
