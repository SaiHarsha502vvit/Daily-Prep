

---

## Reality Check

**"Stream.collect(Collectors.toList()) is the only way to get a List from a stream"** → Java 16+ has `stream.toList()` which returns an unmodifiable List — shorter syntax, and immutability is often what you want. `Collectors.toList()` returns a mutable List (usually ArrayList). `Collectors.toUnmodifiableList()` returns an unmodifiable view. If you need a specific List type (LinkedList), use `Collectors.toCollection(LinkedList::new)`. The choice matters: `stream.toList()` cannot be mutated later (ConcurrentModificationException if you try); `toList()` vs `toUnmodifiableList()` are semantically equivalent since Java 16.

**"stream().filter().map() chains are lazy, so they're always efficient"** → Stream laziness means intermediate operations (filter, map, peek) don't execute until a terminal operation consumes elements. But "lazy" doesn't mean "efficient." `stream().sorted().findFirst()` must sort ALL elements before finding the first — even though `findFirst()` only needs one element. Similarly, `stream().filter(p).count()` counts all matching elements (no early termination). Understanding which operations are short-circuiting (findFirst, anyMatch, limit) vs full-consuming (sorted, distinct, count) determines actual efficiency.

**"flatMap is just map for nested structures"** → `map` transforms each element 1-to-1 (one in, one out). `flatMap` transforms each element to a Stream and concatenates them (one in, zero or more out). This is the monad "bind" operation — it's how you "flatten" a `Stream<List<T>>` to `Stream<T>` or a `Stream<Optional<T>>` to `Stream<T>`. The pattern: `flatMap(Optional::stream)` (Java 9+) is the idiomatic way to filter-and-unwrap Optionals in a stream: `stream.map(this::findOptional).flatMap(Optional::stream)`.

**"Parallel streams scale linearly with CPU cores"** → Parallel streams use the common ForkJoinPool (shared by all parallel streams in the JVM). If two parts of the application both use parallel streams simultaneously, they compete for the same pool. Performance gains require: the task being CPU-bound (not I/O bound), the task being large enough to amortise the fork/join overhead (overhead ≈ 10,000 operations threshold), no contention on shared state (synchronisation kills parallelism). Parallel streams on small collections (< 1,000 elements) are typically slower than sequential.

**"Collectors.groupingBy() returns a HashMap"** → `Collectors.groupingBy(key)` returns whatever map the downstream creates — by default a HashMap (unordered). For a sorted map: `groupingBy(key, TreeMap::new, downstream)`. The three-argument form of `groupingBy` takes a `Supplier<M extends Map>`. `partitioningBy` is a specialised form for boolean predicates that returns a `Map<Boolean, List>`. Understanding the map type matters when iteration order is significant.
