#!/usr/bin/env python3
"""Warn when Markdown files contain malformed Mermaid fences.

This hook is intentionally lightweight:
- It tries to discover Markdown paths from hook stdin payload.
- If none are discoverable, it exits quietly.
- It never blocks the workflow; it only emits warnings.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


def _iter_values(root: Any):
    stack = [root]
    while stack:
        value = stack.pop()
        if isinstance(value, dict):
            stack.extend(value.values())
            continue
        if isinstance(value, list):
            stack.extend(value)
            continue
        yield value


def _normalize_md_path(value: Any) -> Path | None:
    if not isinstance(value, str) or not value.lower().endswith(".md"):
        return None

    path = Path(value)
    if not path.is_absolute():
        path = Path.cwd() / path

    path = path.resolve()
    if path.exists() and path.is_file():
        return path
    return None


def _collect_markdown_paths(obj: Any) -> list[Path]:
    found: set[Path] = set()
    for value in _iter_values(obj):
        normalized = _normalize_md_path(value)
        if normalized is not None:
            found.add(normalized)
    return sorted(found)


def _validate_mermaid_fences(path: Path) -> list[str]:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    issues: list[str] = []

    in_mermaid = False
    start_line = -1

    for i, raw in enumerate(lines, start=1):
        line = raw.strip()

        if not in_mermaid:
            if line.startswith("```mermaid"):
                in_mermaid = True
                start_line = i
            continue

        if line.startswith("```mermaid"):
            issues.append(
                f"{path}: nested mermaid fence at line {i} before closing fence for block started at line {start_line}."
            )
            continue

        if line == "```":
            in_mermaid = False
            start_line = -1

    if in_mermaid:
        issues.append(
            f"{path}: unclosed mermaid fence starting at line {start_line}."
        )

    return issues


def _emit(message: str | None = None) -> None:
    payload: dict[str, Any] = {"continue": True}
    if message:
        payload["systemMessage"] = message
    print(json.dumps(payload))


def main() -> None:
    raw = sys.stdin.read().strip()
    if not raw:
        _emit()
        return

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        _emit()
        return

    md_paths = _collect_markdown_paths(data)
    if not md_paths:
        _emit()
        return

    all_issues: list[str] = []
    for path in md_paths:
        try:
            all_issues.extend(_validate_mermaid_fences(path))
        except OSError:
            continue

    if not all_issues:
        _emit()
        return

    preview = " | ".join(all_issues[:4])
    if len(all_issues) > 4:
        preview += f" | ... and {len(all_issues) - 4} more"

    _emit(f"Diagram hook warning: malformed Mermaid fences detected. {preview}")


if __name__ == "__main__":
    main()
