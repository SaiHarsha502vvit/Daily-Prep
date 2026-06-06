#!/usr/bin/env python3
"""
Cross-platform equivalent of update_context.ps1
Usage: python3 tools/update_context.py [update|check] [--strict-fences]

Generates 00_CONTEXT/FILE_REGISTRY.md and 00_CONTEXT/CONTEXT_MANIFEST.json
from all active Markdown files in the repo.
"""
import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

SKIP_PATTERNS = [
    "_archive/",
    "00_CONTEXT/",
    ".git/",
    ".venv/",
    ".vscode/",
    ".kimchi/",
    ".claude/",
]

FOLDER_ROLES = {
    ".github": "Repository agent instructions and GitHub metadata",
    "01_Getting_Started": "Onboarding, study planning, and repo usage guidance",
    "02_Data_Structures": "Data structure concepts, internals, variants, and production use",
    "03_Algorithms": "Algorithm thinking, patterns, complexity, and advanced algorithm design",
    "04_Patterns_Templates": "Reusable coding patterns, templates, triggers, and constraint selection",
    "05_Problem_Solving": "Practice problem families and applied coding drills",
    "06_OOP_Design": "OOP, SOLID, design patterns, LLD, and design reasoning",
    "07_Modern_Java": "Java, JVM, Spring Boot, JPA, security, testing, and distributed Java services",
    "08_SQL": "SQL, database querying, analytics, transactions, indexes, and internals",
    "09_Career_Reference": "Career, project, interview, and DSA reference synthesis",
    "10_Enterprise_Systems": "ERP, DDD, finance/order/inventory workflows, and enterprise systems",
    "12_Daily_Practice": "Daily drills, practice plans, and repetition workflows",
    "13_Developer_Essentials": "Developer tooling, Git, Docker, CI/CD, networking, servers, and concurrency",
    "14_Mental_Models": "Thinking frameworks, pattern triggers, and reasoning guides",
    "15_React_Frontend": "React components, hooks, state, architecture, and frontend reasoning",
    "16_JavaScript": "JavaScript language, runtime, async, DOM, browser APIs, and debugging",
    "17_TypeScript": "TypeScript type system, generics, narrowing, and practical typing",
    "18_CSS_Complete": "CSS layout, styling architecture, responsive UI, and visual systems",
    "19_Frontend_Integration": "Frontend tooling, debugging, performance, accessibility, and integration",
    "20_Interview_Mastery": "Interview synthesis, final prep, scenarios, and problem explanation",
    "21_Python_ML_DL_NLP": "Python, ML, deep learning, NLP, LLM/RAG, and MLOps",
    "22_DevOps": "DevOps, Linux, networking, containers, Kubernetes, CI/CD, SRE, and deployment",
}

STYLE_RULES = [
    ("challenges", re.compile(r"Section Challenge|Challenge\s+\d+")),
    ("details", re.compile(r"<details>")),
    ("constraints", re.compile(r"Constraint Lens|Constraint-Based|Given Constraints|constraints")),
    ("5W1H", re.compile(r"\bWHY\b|\bWHAT\b|\bWHERE\b|\bWHEN\b|\bWHO\b|\bHOW\b")),
    ("code-heavy", None),               # handled by fence count >= 10
    ("java/spring", re.compile(r"```java|public class|@Service|@Transactional|Spring")),
    ("sql", re.compile(r"```sql|\bSELECT\b|\bJOIN\b|\bCTE\b|\bWINDOW\b")),
    ("javascript", re.compile(r"```js|```javascript|Promise|async|await|DOM")),
    ("typescript", re.compile(r"```ts|TypeScript|interface |type ")),
    ("react", re.compile(r"React|useState|useEffect|useContext|JSX")),
    ("css", re.compile(r"CSS|flexbox|grid|selector|responsive")),
    ("dsa/algo", re.compile(r"BFS|DFS|DP|sliding window|two pointers|prefix sum|Dijkstra|greedy")),
    ("devops", re.compile(r"Docker|Kubernetes|CI/CD|deployment|Linux")),
    ("enterprise", re.compile(r"ERP|invoice|order|inventory|ledger|payment")),
]


def should_skip(relative: str) -> bool:
    for pat in SKIP_PATTERNS:
        if relative.startswith(pat):
            return True
    return False


def top_level(relative: str) -> str:
    parts = relative.split("/", 1)
    return parts[0] if len(parts) > 1 else "(root)"


def escape_cell(value: str) -> str:
    if not value or not value.strip():
        return "-"
    return value.replace("|", "\\|").replace("\r\n", " ").replace("\n", " ").strip()


def get_title(lines: list[str], relative_path: str) -> str:
    for line in lines[:120]:
        m = re.match(r"^\s{0,3}#{1,3}\s+(.+?)\s*$", line)
        if m:
            return re.sub(r"[ \t]+", " ", m.group(1)).strip()
    name = Path(relative_path).stem
    return name.replace("_", " ").replace("-", " ").strip()


def get_folder_role(relative: str) -> str:
    first = top_level(relative)
    basename = Path(relative).name

    if relative == "AGENTS.md":
        return "Agent operating manual and required workflow"
    if relative == "AGENT_HANDOFF.md":
        return "Historical handoff snapshot; useful but not authoritative"
    if relative == "00_MASTER_INDEX.md":
        return "Root navigation and master learning index"
    if relative == "00_TEXTBOOK_PREFACE.md":
        return "Textbook preface, reading order, and prerequisites"
    if relative.endswith(".prompt.md"):
        return "Prompt or knowledge extraction instruction file"
    if basename == "CONTEXT.md":
        return "Folder-level agent context and writing boundaries"
    if basename == "00_INDEX.md":
        return "Module index and local navigation"
    return FOLDER_ROLES.get(first, "Active repository Markdown content")


def style_signals(text: str, fence_count: int) -> list[str]:
    signals = []
    for label, pattern in STYLE_RULES:
        if label == "code-heavy":
            if fence_count >= 10:
                signals.append("code-heavy")
            continue
        if pattern.search(text):
            signals.append(label)
    return list(dict.fromkeys(signals)) if signals else ["general"]


def read_text_robust(path: Path) -> str:
    # UTF-8 with fallback to latin-1; strip BOM for JSON compatibility.
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        raw = raw[3:]
    try:
        return raw.decode("utf-8", errors="replace")
    except Exception:
        return raw.decode("latin-1", errors="replace")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest().lower()


def gather():
    repo_root = Path(__file__).resolve().parent.parent
    files = []
    for path in sorted(repo_root.glob("**/*.md")):
        relative = path.relative_to(repo_root).as_posix()
        if should_skip(relative):
            continue
        text = read_text_robust(path)
        lines = text.splitlines()
        code_fences = len(re.findall(r"(?m)^```", text))
        challenges = len(re.findall(r"Section Challenge|Challenge\s+\d+", text))
        headings = len(re.findall(r"(?m)^\s{0,3}#{1,6}\s+", text))
        sha = sha256_file(path)
        files.append({
            "path": relative,
            "folder": top_level(relative),
            "title": get_title(lines, relative),
            "role": get_folder_role(relative),
            "sha256": sha,
            "shortHash": sha[:12],
            "bytes": path.stat().st_size,
            "headings": headings,
            "codeFences": code_fences,
            "codeFencesBalanced": (code_fences % 2) == 0,
            "challengeCount": challenges,
            "styleSignals": style_signals(text, code_fences),
        })
    return files


def write_registry(inventory, registry_path: Path):
    registry_path.parent.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    groups = {}
    for item in inventory:
        groups.setdefault(item["folder"], []).append(item)

    lines = [
        "# File Registry",
        "",
        f"> Generated by ``tools/update_context.py update`` on {generated_at}.",
        "> Do not hand-edit the generated inventory table during normal work.",
        "",
        "## How To Use",
        "",
        "1. Find the file path before editing.",
        "2. Read the title, role, and style signals.",
        "3. Read the nearest folder ``CONTEXT.md`` for local rules.",
        "4. After edits, regenerate this registry and run the freshness check.",
        "",
        "## Folder Counts",
        "",
        "| Folder | Files |",
        "|---|---:|",
    ]
    for folder in sorted(groups):
        lines.append(f"| {escape_cell(folder)} | {len(groups[folder])} |")

    lines += [
        "",
        "## Active File Inventory",
        "",
        "| Path | Title | Role | Signals | Hash |",
        "|---|---|---|---|---|",
    ]
    for item in inventory:
        signals = ", ".join(item["styleSignals"])
        lines.append(
            f"| {escape_cell(item['path'])} | {escape_cell(item['title'])} | "
            f"{escape_cell(item['role'])} | {escape_cell(signals)} | ``{item['shortHash']}`` |"
        )

    registry_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_manifest(inventory, manifest_path: Path):
    manifest = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "repoRoot": str(Path(__file__).resolve().parent.parent),
        "activeFileCount": len(inventory),
        "files": inventory,
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def check_freshness(inventory, manifest_path: Path, strict_fences: bool) -> int:
    if not manifest_path.exists():
        print(f"Context manifest missing: {manifest_path}")
        print("Run: python3 tools/update_context.py update")
        return 2

    manifest = json.loads(read_text_robust(manifest_path))
    prev_by_path = {f["path"]: f for f in manifest.get("files", [])}
    curr_by_path = {f["path"]: f for f in inventory}

    new_files = [f for f in inventory if f["path"] not in prev_by_path]
    deleted_files = [f for f in manifest.get("files", []) if f["path"] not in curr_by_path]
    changed_files = [
        f for f in inventory
        if f["path"] in prev_by_path and prev_by_path[f["path"]]["sha256"] != f["sha256"]
    ]
    unbalanced = [f for f in inventory if not f["codeFencesBalanced"]]

    has_stale = bool(new_files or deleted_files or changed_files)
    has_fence_warn = bool(unbalanced)

    if not has_stale:
        print(f"Context fresh: {len(inventory)} active Markdown files match the manifest.")
        if not has_fence_warn:
            return 0
        print(f"Structural warning: {len(unbalanced)} files have unbalanced Markdown code-fence counts.")
        print("Use --strict-fences to make these warnings fail the check.")
        print("")
        for f in unbalanced[:50]:
            print(f"  ! {f['path']} ({f['codeFences']} fences)")
        return 1 if strict_fences else 0

    print("Context stale.")
    print("")
    if new_files:
        print("New files:")
        for f in new_files[:30]:
            print(f"  + {f['path']}")
    if deleted_files:
        print("Deleted files:")
        for f in deleted_files[:30]:
            print(f"  - {f['path']}")
    if changed_files:
        print("Changed files:")
        for f in changed_files[:50]:
            print(f"  * {f['path']}")
    if unbalanced:
        print("Structural warnings: files with unbalanced Markdown code-fence counts:")
        for f in unbalanced[:50]:
            print(f"  ! {f['path']} ({f['codeFences']} fences)")
    print("")
    print("After reviewing and updating human context, run:")
    print("  python3 tools/update_context.py update")
    return 1


def main():
    parser = argparse.ArgumentParser(description="Update or check the repo context system.")
    parser.add_argument(
        "mode", choices=["update", "check"], default="check",
        help="update: regenerate registry+manifest; check: compare inventory to manifest"
    )
    parser.add_argument("--strict-fences", action="store_true", help="Treat unbalanced code fences as errors")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    context_dir = repo_root / "00_CONTEXT"
    registry_path = context_dir / "FILE_REGISTRY.md"
    # Manifest moved from CONTEXT_MANIFEST.json -> .manifest/manifest.json in commit 3f68270.
    # Support both for backward compatibility during transition.
    manifest_candidates = [
        context_dir / ".manifest" / "manifest.json",
        context_dir / "manifest.json",
        context_dir / "CONTEXT_MANIFEST.json",
    ]
    manifest_file = next((c for c in manifest_candidates if c.exists()), manifest_candidates[0])

    inventory = gather()

    if args.mode == "update":
        write_registry(inventory, registry_path)
        write_manifest(inventory, manifest_file)
        print(f"Updated context registry and manifest for {len(inventory)} active Markdown files.")
        print(f"Registry: {registry_path}")
        print(f"Manifest: {manifest_file}")
        sys.exit(0)

    result = check_freshness(inventory, manifest_file, args.strict_fences)
    sys.exit(result)


if __name__ == "__main__":
    main()
