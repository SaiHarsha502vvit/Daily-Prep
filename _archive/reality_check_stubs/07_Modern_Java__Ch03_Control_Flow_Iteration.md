

---

## Reality Check

**"Enhanced for-each loop is always safer than a regular for loop"** → For-each prevents index mistakes but cannot: modify the list while iterating (throws `ConcurrentModificationException`), iterate backwards, skip elements, iterate two lists simultaneously with one loop. For-each on an `Iterator` removes elements with `iterator.remove()`. Using `list.remove(element)` inside for-each throws `ConcurrentModificationException`. The enhanced for-each is syntactic sugar for the Iterator pattern — you get an Iterator, call `hasNext()`, `next()` — the exception comes from the list detecting structural modification.

**"switch statements and if-else chains are interchangeable in performance"** → Compilers optimise `switch` on integers and strings differently: for dense integer ranges, the compiler generates a `tableswitch` JVM opcode (O(1) jump table), or `lookupswitch` for sparse values (O(log n) binary search). An if-else chain is always O(n) in the number of conditions. For 100+ cases in a switch, this matters. Java 14+ switch expressions (`switch (x) { case A -> ...; }`) add no performance difference but eliminate fall-through bugs.

**"break and continue are harmful and should be avoided"** → Early return, break, and continue reduce nesting depth and make control flow explicit. The alternative (boolean flags like `found = true`, then `if (!found)` around the rest of the loop) is harder to read and maintain. "Avoid break/continue" is cargo-culted from structured programming debates of the 1970s. Use them when they make intent clearer. Labeled break (`break outer;`) is the one case where extra care is warranted — it jumps multiple levels and can surprise readers.

**"Integer overflow wraps silently in Java"** → Yes: `Integer.MAX_VALUE + 1 == Integer.MIN_VALUE`. Java has no unsigned integer types (unlike C/C++). Overflow is defined (wraps), not undefined behavior. Common bugs: `int mid = (lo + hi) / 2` overflows when lo + hi > Integer.MAX_VALUE — use `int mid = lo + (hi - lo) / 2`. `Math.addExact()`, `Math.multiplyExact()` throw `ArithmeticException` on overflow. Use `long` for large range computations or `BigInteger` for arbitrary precision.

**"do-while is just a while loop that runs once"** → `do-while` guarantees the body executes AT LEAST once before checking the condition. Useful when: validating user input (display prompt, read, then check), retry-once patterns, iteration where you must process before you can check a condition. Rare in modern code because `while(true) { ... if (condition) break; }` is more readable and explicit. But understanding `do-while` matters for reading low-level code (hash table probing, some parser loops).
