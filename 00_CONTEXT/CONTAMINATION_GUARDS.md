# Contamination Guards

This file lists known wrong-domain copy patterns. Use it during review and cleanup.

## Known Families

| Pattern | Canonical Home | Wrong When Found In |
|---|---|---|
| React Context provider/useContext challenge | `15_React_Frontend` | SQL, Java internals, CSS, ERP, DSA unless comparing frontend architecture. |
| LEFT JOIN unmatched rows challenge | `08_SQL/07_JOINs_Complete.md`, SQL interview/deep reasoning files | Java, React, CSS, DSA, ERP unless explicitly discussing persistence queries. |
| Custom Java payment exception hierarchy | `07_Modern_Java/Ch04_Generics_Exceptions.md` | SQL analytics, annotations, serializers, security expressions, ERP UI/finance pages. |
| Java `Error` vs `Exception` challenge | Java exception/deep reasoning files | SQL recursion, DB locks, DSA memory hierarchy, ERP workflows. |
| Generic Java reflection performance challenge | `07_Modern_Java/Ch10_Reflection_Annotations.md` section on reflection call overhead | Annotation retention, field access, constructor invocation, Spring proxy, validation, serialization, or dynamic proxy sections when a more local prompt is needed. |
| Generic stream reuse/laziness bug hunt | `07_Modern_Java/Ch23_Streams_Deep_Reasoning.md` laziness / Stream-vs-Collection sections | Parallel stream, pipeline fusion, collector, Optional, or production stream sections when a more local failure mode exists. |
| Generic BFS shortest path challenge | Graph/BFS/DSA pattern files | Weighted graph sections unless it explains why BFS fails and switches to Dijkstra/0-1 BFS. |
| Sliding window sum challenge | Sliding-window/prefix-sum pattern files | Negative-number sections unless it explains prefix sum plus hashmap/tree/deque. |

## Replacement Rule

When a copied challenge is wrong for the local section:

1. Keep the section header.
2. Replace the challenge with a local reasoning prompt.
3. Include a short answer under `<details>`.
4. Prefer "Trace, Reasoning & Debug" summaries for deep reasoning sections.
5. Do not remove surrounding content.

## Review Query Ideas

Use exact phrase searches for suspicious repeated prompts:

```powershell
Select-String -Path '**/*.md' -Pattern 'Design a custom exception hierarchy'
Select-String -Path '**/*.md' -Pattern 'What happens if two Spring Beans have a Circular Dependency'
Select-String -Path '**/*.md' -Pattern 'Why can''t you use a window function in a WHERE clause'
```
