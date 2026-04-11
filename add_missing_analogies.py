#!/usr/bin/env python3
"""
Add missing critical reasoning analogies to specific files.
Each injection is targeted precisely.
"""
import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"

# Each entry: (relative_file, search_anchor, content_to_insert_after)
INJECTIONS = [

    # 1 — Big-O ignores constants (Arrays.md)
    (
        r"02_Data_Structures\01b_Arrays.md",
        "## ",
        None,  # inject at very start of file after nav banner
        """
## Why Big-O Ignores Constants — The Most Misunderstood Rule

> **Common confusion:** "If O(2n) and O(n) are the same, why do constants matter at all?"

**The Answer — Two Different Questions:**
```
Big-O answers: "How does growth SCALE as input doubles?"
Constants answer: "How fast is the actual operation on TODAY'S hardware?"

Big-O ignores constants because:
  O(n)   could be 1ns * n  (array access)
  O(n)   could be 10ms * n (disk seek)
  Both are "O(n)" but one is 10 MILLION times faster in practice.

ANALOGY — Theater Seating:
  Seating 100 people takes ~2x time of seating 50.
  Whether you have 1 usher (constant=1) or 100 ushers (constant=100),
  the GROWTH PATTERN is still linear.
  Big-O only cares about the growth SHAPE, not the starting speed.

WHEN CONSTANTS MATTER ANYWAY (production reality):
  A carefully optimized O(n log n) with constant=1
  beats a lazy O(n log n) with constant=1000
  at n < 10 million.
  → This is why Java's Arrays.sort() uses TimSort instead of pure merge sort.
  → TimSort has a better constant for real-world (partially sorted) data.
```

> 🔬 **Section Challenge — Big-O Constants**
>
> **Challenge:** An algorithm does 3n + 100 comparisons. Your friend says O(n). You say "but the 100 matters when n is small!". Who's right about WHAT?
> <details><summary>Answer</summary>
>
> Both are right about different things. Your friend is right that the Big-O CLASS is O(n) — the constant 3 and the additive 100 are irrelevant as n→∞. You are right that for n=5 (3*5+100=115 vs say n=1000 → 3100), the 100 creates a noticeable overhead. Big-O is about ASYMPTOTIC behavior (what happens as n grows). For small n, empirical benchmarking beats Big-O. Algorithm selection should consider: (1) Big-O class for large n, (2) constants for small n, (3) cache behavior for real hardware.
> </details>

"""
    ),

    # 2 — Immutability enables thread safety (Ch15)
    (
        r"07_Modern_Java\Ch02_Strings_Immutability.md",
        "## ",
        None,
        """
## Why Immutability Enables Thread Safety — Derived from First Principles

> This is one of the most important reasoning chains in Java concurrency.

```
THE PROOF (not just a rule to memorize):

Thread safety problem = Multiple threads modify shared state simultaneously.
Immutable object = shared state that CANNOT be modified.

Conclusion: If state cannot change, there's NOTHING to synchronize.

                    MUTABLE (Clay sculpture)                 IMMUTABLE (Stone statue)
                    ═══════════════════════                 ═══════════════════════
Thread A reads:     reads "Hello"                           reads "Hello"
Thread B writes:    changes to "World"                      can't change anything
Thread A reads:     reads "World" 🐛 STALE READ              reads "Hello" ✅ ALWAYS CORRECT

String s = "Hello";   // String is immutable
// s is shared across 100 threads — zero synchronization needed!
// No lock → no deadlock risk, no performance penalty, just works.
```

**This is why `String` being immutable matters:**
- String Pool: Every `"Hello"` literal in your entire JVM is the SAME object safely shared by all threads
- HashMap keys: If keys were mutable, another thread changing a key would corrupt the HashMap bucket (hashCode would change, key unreachable)
- Method parameters: Passing a String to another method — that method can NEVER corrupt your original String

**What immutability doesn't give you:**
- A mutable field holding an immutable object: `private String name;` — the reference `name` can be changed by another thread even though the String itself can't be modified.
- Solution: the reference AND the object must both be immutable → use `final` for the reference.

> 🔬 **Challenge:** `final String s = "Hello"` vs `String s = "Hello"` — which is truly immutable and why?
> <details><summary>Answer</summary>
>
> Neither makes the String MORE immutable — String is ALWAYS immutable regardless of `final`. The difference: `final` makes the REFERENCE immutable (you can't reassign `s` to point to another String object). Without `final`, another thread could change which object `s` points to (reference race). Both together = the reference is stable AND the object it points to is immutable = maximally thread-safe for reads.
> </details>

"""
    ),

    # 3 — Why recursion needs a base case  (DS 01c LinkedList or a relevant file)
    (
        r"02_Data_Structures\01c_LinkedList.md",
        "## ",
        None,
        """
## Why Recursion Needs a Base Case — Derived (Not Just Stated)

> **Most textbooks say "recursion needs a base case". But WHY?**

```
PROOF by what happens WITHOUT a base case:

int bad(int n) {
    return bad(n - 1);  // No base case
}

Java's call stack (per thread): 512KB default
Each stack frame: ~50-100 bytes (local vars, return address)
Max frames before StackOverflowError: ~5,000-10,000

Without base case → infinite recursion → JVM exhausts the stack
This is NOT infinite computation — the JVM terminates with StackOverflowError.

ANALOGY — Mirrors reflecting mirrors:
  A mirror facing another mirror creates infinite reflections.
  In reality, each reflection is slightly dimmer (energy lost).
  Eventually the reflection disappears — that's the "base case" of physics.
  Without energy loss, the reflection would truly be infinite
  and would consume infinite resources to display — just like recursion
  without a base case consumes all stack space.

BASE CASE = The stopping condition that makes the recursive problem FINITE.

TWO REQUIREMENTS for correct recursion:
  1. BASE CASE: Returns without recursing (stops the chain)
  2. PROGRESS: Each recursive call moves CLOSER to the base case
               (otherwise we still get infinite recursion even with a base case!)

PROOF of requirement 2:
  int broken(int n) {
      if (n == 0) return 0;     // Has a base case
      return broken(n + 1);     // But moves AWAY from base case!
  }
  broken(5) → broken(6) → broken(7) → ... → StackOverflow ❌
```

"""
    ),
]

def inject_at_start(filepath, content):
    """Inject content after the navigation banner (first --- separator)."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()

        # Find the first --- separator (after nav banner)
        sep = '\n---\n'
        idx = text.find(sep)
        if idx == -1:
            # No separator, find first ## heading
            idx = text.find('\n## ')
            if idx == -1:
                print(f"[SKIP] No anchor in {os.path.basename(filepath)}")
                return False

        # Don't inject if already injected (check for unique anchor text)
        check_word = content.strip().split('\n')[1][:30]
        if check_word in text:
            print(f"[SKIP] Already injected in {os.path.basename(filepath)}")
            return False

        insert_pos = idx + len(sep)
        new_text = text[:insert_pos] + content + text[insert_pos:]

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print(f"[OK]   Injected → {os.path.relpath(filepath, BASE)}")
        return True
    except Exception as e:
        print(f"[ERR]  {filepath}: {e}")
        return False

def main():
    injected = 0
    for rel_path, anchor, _, content in INJECTIONS:
        filepath = os.path.join(BASE, rel_path)
        if not os.path.exists(filepath):
            print(f"[MISS] {rel_path}")
            continue
        if inject_at_start(filepath, content):
            injected += 1

    print(f"\n{'='*50}")
    print(f"  Total sections injected: {injected}")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()
