# Contamination Guards

This file lists known wrong-domain copy patterns. Use it during review and cleanup.

## Known Families

| Pattern                                                          | Canonical Home                                                                           | Wrong When Found In                                                                                                                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| React Context provider/useContext challenge                      | `15_React_Frontend`                                                                      | SQL, Java internals, CSS, ERP, DSA unless comparing frontend architecture.                                                                                         |
| LEFT JOIN unmatched rows challenge                               | `08_SQL/07_JOINs_Complete.md`, SQL interview/deep reasoning files                        | Java, React, CSS, DSA, ERP unless explicitly discussing persistence queries.                                                                                       |
| Custom Java payment exception hierarchy                          | `07_Modern_Java/Ch04_Generics_Exceptions.md`                                             | SQL analytics, annotations, serializers, security expressions, ERP UI/finance pages.                                                                               |
| Java `Error` vs `Exception` challenge                            | Java exception/deep reasoning files                                                      | SQL recursion, DB locks, DSA memory hierarchy, ERP workflows.                                                                                                      |
| Generic Java reflection performance challenge                    | `07_Modern_Java/Ch10_Reflection_Annotations.md` section on reflection call overhead      | Annotation retention, field access, constructor invocation, Spring proxy, validation, serialization, or dynamic proxy sections when a more local prompt is needed. |
| Generic stream reuse/laziness bug hunt                           | `07_Modern_Java/Ch23_Streams_Deep_Reasoning.md` laziness / Stream-vs-Collection sections | Parallel stream, pipeline fusion, collector, Optional, or production stream sections when a more local failure mode exists.                                        |
| Generic BFS shortest path challenge                              | Graph/BFS/DSA pattern files                                                              | Weighted graph sections unless it explains why BFS fails and switches to Dijkstra/0-1 BFS.                                                                         |
| Sliding window sum challenge                                     | Sliding-window/prefix-sum pattern files                                                  | Negative-number sections unless it explains prefix sum plus hashmap/tree/deque.                                                                                    |
| `new String("hello") == "hello"` challenge                       | Java string/JVM identity sections                                                        | Java collections, iterators, default methods, or non-string reasoning sections.                                                                                    |
| `BeanCurrentlyInCreationException` circular dependency challenge | Spring bean lifecycle/circular dependency sections                                       | Spring MVC, conditions, profiles, component scanning, or shutdown sections when a more local failure mode exists.                                                  |
| `Trace ID vs Span ID` challenge                                  | Distributed tracing fundamentals                                                         | Kafka propagation, sampling, Zipkin timing, or observability testing sections when the local trace mechanism differs.                                              |
| `interval scheduling sort by end time` challenge                 | Greedy interval scheduling                                                               | Other greedy topics such as coin change, jump game, gas station, scheduler formula, monotonic stack, or Huffman coding.                                            |
| `Stack<State>` replaces call stack challenge                     | Recursion-to-iteration sections                                                          | Specific recursion topics where factorial, merge sort, tree traversal, or linked-list reversal need local reasoning.                                               |
| String concat loop `+=` challenge                                | Java string concatenation performance sections                                           | `intern()`, compact strings, substring memory, or method cheat-sheet sections.                                                                                     |
| Record DTO superiority challenge                                 | Java record DTO sections                                                                 | Enum singleton, enum compiler output, sealed classes, pattern matching, or domain modeling sections.                                                               |
| `java.util.Date` replaced by `java.time` challenge               | Date/time migration sections                                                             | Regex, formatter, Duration/Period, matcher, replaceAll, or ReDoS sections.                                                                                         |
| NIO vs IO superiority challenge                                  | Java NIO overview sections                                                               | Socket shutdown, ByteBuffer state, Selector OP_WRITE, partial writes, TLS/PKIX sections.                                                                           |
| Binary search `[1,3,5,7,9]` target challenge                     | Binary search fundamentals                                                               | BFS, DFS, BST, hashing, or problem-origin sections unless comparing search strategies.                                                                             |
| `Flyway ddl-auto=update in production` challenge                 | DB migration section in `Ch51_SB_Industry_Projects.md`                                   | Spring Boot scale, enterprise patterns, notification engine, feature flags, workflow engine, booking system sections.                                              |
| `OAuth2 authorization code vs access token` challenge            | `Ch43_SB_Auth_Security.md` Ch1 (Understanding the Difference)                            | JWT chapter, method-level security, Postman testing, and social login sections — each needs its own local security challenge.                                      |
| `findByEmail SQL injection JPA PreparedStatement` challenge      | Spring Data JPA SQL injection section in `Ch32_SB_Data_Part2.md`                         | IoC philosophy, tight coupling, Spring Beans definition, and Qualifier/Primary resolution sections.                                                                |
| `Trie vs SQL LIKE prefix%` autocomplete challenge                | `Ch50_SB_DSA_Applications.md` Ch1 (DSA in Enterprise)                                    | Rate limiting, LRU cache, shortest-path routing, or leaderboard sections.                                                                                          |
| `window function WHERE clause` filter challenge                  | SQL window function fundamentals                                                         | Math functions, date functions, datatypes, ranking window functions, and value window functions when each needs a distinct local SQL challenge.                    |
| `list.stream().filter().map().collect()` laziness challenge      | `Ch06_Functional_Programming.md` stream fundamentals                                     | Creating Streams (source types), Intermediate Operations (flatMap), and Example sections needing terminal-operation comparisons.                                   |
| Sliding window O(N) add/remove count challenge                   | Fixed sliding window template                                                            | Variable sliding window sections where shrink condition (while vs if) is the local teaching point.                                                                 |
| JWT vs session cookies challenge                                 | Spring Security / auth architecture sections                                             | SQL injection, DSA math, server ports, or algorithm sections unless explicitly comparing auth storage/query behavior.                                              |
| Prefix sum `prefix[0] = 0` challenge                             | Prefix sum / range query / subarray-sum sections                                         | Two-pointers, sliding-window, hashmap, binary-search, or pattern sections unless the chapter is explicitly comparing prefix-sum to those patterns.                     |
| `ROW_NUMBER() vs RANK() vs DENSE_RANK()` challenge               | `08_SQL` window functions / SQL deep-reasoning sections                                  | ERP Finance Real-World, Java streams files, distributed patterns, or any non-SQL file unless explicitly teaching SQL analytics.                                       |
| Java Streams `list.stream().filter().map().collect()` laziness   | `07_Modern_Java/Ch23_Streams_Deep_Reasoning.md` and `Ch06_Functional_Programming.md`     | Production streaming-platform sections (Netflix/Hotstar), ERP finance, distributed patterns, or any file that uses the term "streaming" to mean video/event streaming. |
| Sliding-window O(N) add/remove count boilerplate (cross-file)    | Single file that introduces the sliding-window topic                                     | Copy-pasted verbatim across multiple Part files in the same folder; should appear at most once with locally-rooted variants per file.                                  |
| Minimum Window Substring bug-hunt boilerplate (cross-file)       | Single file that introduces the sliding-window shrink logic                              | Copy-pasted verbatim across multiple Part files in the same folder; should appear at most once with locally-rooted variants per file.                                  |

## Replacement Rule

When a copied challenge is wrong for the local section:

1. Keep the section header.
2. Replace the challenge with a local reasoning prompt.
3. Include a short answer under `<details>`.
4. Prefer "Trace, Reasoning & Debug" summaries for deep reasoning sections.
5. Do not remove surrounding content.
6. Apply `00_CONTEXT/PEDAGOGY_STANDARDS.md` before writing the replacement.

## Review Query Ideas

Use exact phrase searches for suspicious repeated prompts:

```powershell
Select-String -Path '**/*.md' -Pattern 'Design a custom exception hierarchy'
Select-String -Path '**/*.md' -Pattern 'What happens if two Spring Beans have a Circular Dependency'
Select-String -Path '**/*.md' -Pattern 'Why can''t you use a window function in a WHERE clause'
```
