---
description: "Use when creating or editing Markdown diagrams (ASCII or Mermaid), flow blocks, or diagram-heavy study notes. Enforces non-overlapping, non-truncated, render-safe diagrams."
name: "Diagram Authoring Standards"
applyTo: "**/*.md"
---
# Diagram Authoring Standards

## Purpose
Write diagrams that are stable in source view, readable in rendered view, and free of overlap, clipping, or truncation.

## ASCII Diagram Rules
- Keep all border lines the same width in a diagram block.
- Keep interior lines aligned: each content row should begin and end with a vertical border when box format is used.
- Avoid line overflow that visually breaks borders in narrow editors.
- Do not cut words or symbols mid-token (example of bad pattern: `apartmen`).
- Keep nested boxes padded with spaces so borders do not collide.

## Mermaid Rules
- Use fenced blocks exactly as:
  - opening: ` ```mermaid `
  - closing: ` ``` `
- Keep node labels complete and meaningful; do not include clipped or garbled fragments.
- Avoid duplicated consecutive steps unless repetition is intentional and explained.
- Prefer one concept per node; split dense text into multiple nodes.
- Keep arrows and labels explicit so flow can be validated from plain text.

## Flow Section Rules
- If a `Flow:` list is present, it must match the nearby diagram semantics.
- Remove duplicate lines unless repetition is instructional and explicit.
- Do not include fragments that look like extraction artifacts.

## Quality Gate Before Save
- Check diagram blocks for alignment in raw Markdown.
- Check Mermaid fence pairing and obvious syntax integrity.
- Check that nearby explanatory bullets match the diagram.
