# Chapter 4 — The AST & the Visitor Pattern

> The parse tree records how the parser did its job. The abstract syntax tree records what the program means. Confusing the two is how compilers end up with type checkers that know about semicolons.

---

## The Problem

Two chapters of parsing, and neither produced anything a compiler could use.

Chapter 2's recursive-descent parser returned nested tuples — workable, but ad hoc, with no named node types and no obvious place to hang a source location or a resolved type. Chapter 3's LR parser returned `ACCEPT` and an empty stack: it *discovered* the structure through its reduction order and then threw it away.

Meanwhile the stages still to come — type checking (Ch06), IR generation (Ch07), optimisation (Ch09) — all need to walk the program's structure repeatedly, each doing something different. So two questions:

1. **What structure should the parser build?** Not "the parse tree," as §4.1 shows.
2. **How do many different stages traverse one tree** without each re-implementing the walk, and without the tree's node classes acquiring a dependency on every stage in the compiler?

## 4.1 The Parse Tree, Literally

The parse tree (or *concrete syntax tree*) is the direct record of the derivation: every grammar symbol used becomes a node. Build it faithfully for `1 + 2 * 3` under Chapter 3's grammar:

```
E
  E
    T
      F
        NUM(1)
  +
  T
    T
      F
        NUM(2)
    *
    F
      NUM(3)

nodes: 13
```

*(Actual node count.)* Thirteen nodes to represent an expression with two operators and three numbers.

Look at what's in there. The chain `E → T → F → NUM(1)` is three nodes of pure descent — Chapter 3's Q1 established these unit productions are *load-bearing during parsing*, because they lift a token to the precedence level where it can participate in an operation. But that job is finished the moment parsing ends. Downstream, "this 1 is an E" tells a type checker nothing that "this is the literal 1" doesn't.

Same for the `+` and `*` nodes sitting as siblings of their operands: the parser needed them as tokens, but in the finished structure the operator is the *relationship between* the operands, not a third thing alongside them.

## 4.2 Deriving What to Discard

Three categories come out, and the test for each is the same: **does any stage after the parser need this?**

**1. Unit productions.** `E → T`, `T → F`. Their entire purpose was encoding precedence during parsing (Ch02 §2.2, Ch03 §3.6). Once the tree exists, precedence is recorded in its *shape* — the multiplication is deeper, so it happens first — and the chain that produced that shape is redundant. Collapse them.

**2. Punctuation that exists only to guide parsing.** Parentheses, semicolons, commas, braces. `(1 + 2) * 3` and `1 + 2 * 3` must produce *different trees*, but the parentheses aren't nodes in the result — their effect is entirely captured by which node ended up nested inside which. Once the shape is right, the parens have no remaining job. Same for a statement-terminating `;`: it told the parser where a statement ended, and that boundary is now the node boundary.

**3. Operator tokens as separate nodes.** `+` becomes the *kind* of a node rather than a child of one. `BinOp('+', left, right)` instead of a three-child node containing `left`, `+`, `right`.

What survives is exactly what carries meaning: operations, operands, and the nesting relationships between them.

```
BinOp(+)
  Num(1)
  BinOp(*)
    Num(2)
    Num(3)

nodes: 5
```

**13 → 5 nodes, 62% removed** *(verified)* — for a five-token expression. The ratio holds or improves on real code, where deep precedence hierarchies (a C expression grammar has a dozen-plus levels) mean the unit-production chains are far longer than the three seen here.

That's the **abstract syntax tree**: abstract precisely because it has abstracted away the syntax used to write the program, keeping only the structure the program *denotes*. Two different concrete syntaxes that mean the same thing — `1 + 2` and `(1 + 2)` — collapse to the identical AST, which is exactly what you want when the next stage asks "what does this compute?"

> **When the discarded parts are needed after all.** Tools that must *reproduce* source rather than compile it — formatters, linters, refactoring engines, IDEs — genuinely need comments, whitespace, and parenthesis positions. They use a **lossless syntax tree** that keeps everything (Roslyn's "full fidelity" trees and rust-analyzer's approach are the well-known examples). Note that this isn't the AST being wrong; it's a different tool with a different requirement. A compiler that preserved every comment would be carrying weight through every optimisation pass for no benefit.

## 4.3 The Traversal Problem

The AST exists. Now every subsequent stage needs to walk it:

| Stage | What it does per node |
|---|---|
| Type checker (Ch06) | compute and check the node's type |
| IR generator (Ch07) | emit three-address code |
| Optimiser (Ch09) | fold constants, eliminate dead branches |
| Pretty-printer | reproduce readable source |
| Interpreter | evaluate directly |

Each visits the same nodes and does something completely different at each. Two obvious designs, both bad.

**Design A — type tests at every stage.**

```python
def evaluate(node):
    if isinstance(node, Num):     return node.v
    elif isinstance(node, BinOp): ...
    elif isinstance(node, Neg):   ...
```

Then the same `isinstance` ladder, in the same order, in `typecheck()`, in `codegen()`, in `print_source()`. Adding a node type means hunting down every ladder in the compiler and hoping you found them all — and a missed one fails at *runtime*, on whatever input happens to reach it, with no compile-time warning.

**Design B — a method per operation on each node class.**

```python
class Num:
    def evaluate(self): ...
    def typecheck(self, env): ...
    def codegen(self, out): ...
    def pretty(self): ...
```

The dispatch problem vanishes — Python picks the right method by the object's class. But now the `Num` class *imports the type environment, the code emitter, and the formatter*. Every node type depends on every stage in the compiler. Adding a stage means editing every node class, and the tree — which should be an inert data structure — becomes the place all the compiler's logic lives, tangled together.

Both fail the same way: **the per-node-type logic for one operation gets scattered**, either across duplicated type ladders or across every node class.

## 4.4 Deriving the Visitor Pattern

State the requirement precisely: *all logic for one operation collected in one place, with per-node-type dispatch, and without node classes knowing what the operations are.*

The tension is that dispatch normally requires someone to know the node's type — and the only party that inherently knows is the node itself. So let the node supply that one fact, and nothing else:

```python
class Num(Node):
    def __init__(self, v): self.v = v
    def accept(self, vis): return vis.num(self)      # "I am a Num"

class BinOp(Node):
    def __init__(self, op, l, r): self.op, self.l, self.r = op, l, r
    def accept(self, vis): return vis.binop(self)    # "I am a BinOp"
```

That is the node's *entire* participation. `Num.accept` doesn't know what a visitor does — it only knows to call the `num` method on whatever it's handed. No import of the type checker, no knowledge of code generation.

An operation is then one class with one method per node type:

```python
class Eval:
    def num(self, n):   return n.v
    def binop(self, n):
        a, b = n.l.accept(self), n.r.accept(self)
        return {'+': a+b, '*': a*b, '-': a-b}[n.op]
```

**This is double dispatch**, and it's worth naming why it takes two steps. A single method call dispatches on *one* thing — the receiver's type. Here the behaviour depends on **two**: which node type, and which operation. So it's split: `node.accept(visitor)` dispatches on the node type (choosing `accept`), and `vis.num(node)` dispatches on the operation (choosing which visitor class). Two dispatches, one per axis.

Four operations over the same tree, with the node classes completely untouched:

```
Print     -> (1 + (2 * 3))
Eval      -> 7
Depth     -> 3
CountOps  -> 2
```

*(All four verified running against the same AST object.)* `Print` reconstructs source, `Eval` computes, `Depth` measures nesting, `CountOps` counts operators. Adding a fifth requires writing one new class and changing nothing that exists.

## 4.5 When It Breaks: The Expression Problem

The visitor pattern makes one direction of change free and the other expensive, and the asymmetry is structural rather than a flaw in the implementation.

Add a single new node type — unary negation:

```python
class Neg(Node):
    def __init__(self, e): self.e = e
    def accept(self, vis): return vis.neg(self)
```

Then run the four existing visitors over a tree containing one:

```
Print     -> BROKEN: 'Print' object has no attribute 'neg'
Eval      -> BROKEN: 'Eval' object has no attribute 'neg'
Depth     -> BROKEN: 'Depth' object has no attribute 'neg'
CountOps  -> BROKEN: 'CountOps' object has no attribute 'neg'
```

*(Verified — real `AttributeError`s.)* **One new node type broke all four visitors. One new visitor broke zero node types.**

That asymmetry is the **expression problem**: with data types on one axis and operations on the other, conventional object-oriented and procedural designs each make one axis cheap to extend and the other expensive.

- **Visitor / procedural**: adding *operations* is easy, adding *node types* touches everything.
- **Methods-on-nodes (Design B)**: adding *node types* is easy, adding *operations* touches every class.

**Why visitor is nonetheless the right trade for a compiler:** an AST's node types are fixed by the language grammar and change roughly never — you add a node type when the language gains a syntactic construct, which for a stable language is a multi-year event. Operations, by contrast, get added constantly: another optimisation pass, another lint, another backend. Visitor makes the frequent change cheap and the rare change expensive, which is the correct way round.

Two mitigations worth knowing. A **base visitor** with a default implementation for every node type means subclasses override only what they care about, and new node types get a (possibly wrong, but non-crashing) default. And in Python, `Neg` failing with `AttributeError` at *runtime* is the worst case — a statically-typed language with exhaustive `switch` or pattern matching turns exactly this into a **compile-time** error listing every site to update.

> **The modern caveat, stated honestly.** The visitor pattern is a workaround for languages lacking sum types and pattern matching. In Rust, OCaml, Scala, Swift, or Python 3.10+ with `match`, you write the operation as a single function that pattern-matches on node shape — same "all logic for one operation in one place" benefit, far less ceremony, and in the statically-typed cases the compiler enforces exhaustiveness. You should still learn visitor, because the compilers you'll read (and most existing Java/C++/C# codebases) are full of it — but if you're designing a new compiler in a language with pattern matching, reaching for visitor out of habit is cargo-culting a workaround for a limitation you don't have.

## Section Challenge

<details>
<summary><strong>Q1.</strong> §4.2 says parentheses are discarded because their effect is captured by tree shape. But a pretty-printer walking the AST for <code>(1 + 2) * 3</code> must put the parentheses back, or it will emit <code>1 + 2 * 3</code> — a different program. How does it know where they go, given they aren't in the tree?</summary>

It reconstructs them from **precedence**, by comparing each node against its parent.

The AST for `(1 + 2) * 3` is `BinOp('*', BinOp('+', Num(1), Num(2)), Num(3))`. When the printer descends from the `*` node into its `+` child, it compares precedences: `+` binds *looser* than `*`, yet here it appears *deeper*. That inversion is only possible in valid source if parentheses forced it — so the printer emits them. Descending from `*` into `Num(3)`, a leaf has no precedence conflict, so no parens.

Contrast `1 + 2 * 3` — tree `BinOp('+', Num(1), BinOp('*', ...))`. Descending from `+` into its `*` child, the child binds *tighter* and is deeper, which is the natural arrangement. No parentheses needed.

The rule: **parenthesise a child when its operator binds more loosely than its parent's** (plus a same-precedence case on the non-associative side — `1 - (2 - 3)` needs parens even though both are `-`, because the tree shape contradicts left-associativity).

Implemented and verified — every case reproduces source that re-evaluates to the tree's own value:

```
tree for      printed as      value
(1+2)*3       (1 + 2) * 3      9     ← parens restored: child looser than parent
1+2*3         1 + 2 * 3        7     ← none needed: child tighter, natural nesting
1-(2-3)       1 - (2 - 3)      2     ← same precedence, but on the RIGHT of '-'
1-2-3         1 - 2 - 3       -4     ← same precedence on the LEFT: natural, no parens
2*(3+4)       2 * (3 + 4)     14
```

The third and fourth rows are the pair that proves the associativity clause matters: identical operators and identical precedence, parenthesised in one case and not the other, decided purely by which side the nesting is on.

Note what this confirms: the parentheses genuinely were redundant *information*. They can be regenerated from precedence rules plus tree shape, which is exactly why discarding them loses nothing. Compare with a comment — no rule regenerates that, which is precisely why lossless trees exist for tools that need them (§4.2).

The verified `Print` visitor sidesteps all of this by always parenthesising (`(1 + (2 * 3))`) — correct but noisy. Precedence-aware printing is the version a real formatter implements.
</details>

<details>
<summary><strong>Q2.</strong> Every visitor in §4.4 recurses explicitly — <code>Eval.binop</code> calls <code>n.l.accept(self)</code> itself. A colleague proposes moving traversal into the nodes: <code>accept</code> visits the children automatically, so visitors just handle each node. What does this buy, and what does it make impossible?</summary>

**What it buys:** every visitor stops repeating the walk. Right now `Eval`, `Print`, `Depth`, and `CountOps` each independently recurse into `n.l` and `n.r`; get one wrong (recurse into `n.l` twice, forget `n.r`) and you have a bug that the other three don't have. Centralising traversal removes that duplication, and it means a new node type's children get visited correctly without every visitor being taught how.

**What it makes impossible:** control over *whether, when, and in what order* children are visited — and several essential passes need exactly that control.

- **Short-circuit evaluation.** `a && b` must not evaluate `b` when `a` is false. Automatic traversal has already visited both by the time the operator's logic runs.
- **Conditionals in an interpreter.** `if c then x else y` must evaluate `c`, then exactly one branch. Automatic traversal evaluates all three.
- **Order-dependent passes.** A code generator emitting stack machine code needs operands emitted before the operator; a scope-building pass needs to enter a scope, visit the body, then exit — the enter/exit bracket only exists if the visitor controls the descent.
- **Pruning.** An optimiser that folds `if (false) {...}` wants to skip the dead branch entirely, not visit and discard it.

**The resolution real compilers use** is to offer both: a base "walker" class whose default methods recurse over children automatically, which visitors inherit and override *only* for the nodes needing custom control. Passes that just want to touch every node get the traversal free; passes that need short-circuiting or ordering override those specific nodes and drive the recursion themselves. Default convenience, escape hatch preserved.
</details>

<details>
<summary><strong>Q3.</strong> The <code>Eval</code> visitor handles <code>Num</code> and <code>BinOp</code> with no extra state. Now extend the language with variables: <code>let x = 5; print(x + 2)</code>. What must the AST gain, and what must a visitor gain, that neither has needed so far?</summary>

**The AST gains** two node types: a binding (`Let(name, value_expr, body)` or a declaration statement) and a reference (`Var(name)`). Structurally these are unremarkable — more node types, per §4.5's expensive axis.

**The visitor gains something genuinely new: state that persists across nodes and is scoped.** Every visitor so far was *pure structural recursion* — a node's result depended only on its own children. `Var('x')` breaks that completely. Its value depends on a `Let` node **elsewhere in the tree** — an ancestor, possibly many levels up, and not one of its children. There is no amount of looking at `Var('x')` and its subtree that tells you what `x` is.

So the visitor must carry an **environment**: a mapping from names to values (or, at compile time, to types and storage locations). `Let` inserts a binding before visiting its body; `Var` looks one up.

And that immediately raises questions none of the current visitors face:

- **Scoping** — if an inner block rebinds `x`, the inner binding must win *inside* and the outer must be restored *after*. That's a stack of scopes, not a flat dictionary.
- **Undefined variables** — `Var('y')` with no binding is a *compile error*, so the visitor needs error reporting, which needs source positions on nodes (the first real motivation for storing them).
- **Shadowing and lifetime** — when does a binding become visible, and when does it stop?

That structure — a scoped, stack-like mapping from names to information about them — is the **symbol table**, and building it correctly is the first job of semantic analysis. It's also the point where the compiler stops being able to answer questions from tree shape alone and starts needing accumulated knowledge *about* the tree. Chapter 5.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Parse tree (CST) | Every grammar symbol becomes a node — a record of *how the parser worked*. 13 nodes for `1 + 2 * 3` |
| What to discard | Unit productions (their job ended with parsing), guide punctuation (parens/semicolons — effect captured by shape), operator tokens (become the node's kind) |
| AST | What survives: operations, operands, nesting. **5 nodes — 62% smaller**, and different concrete syntaxes meaning the same thing collapse to identical trees |
| Lossless trees | Formatters, linters, IDEs *do* need comments and paren positions — a different tool with a different requirement, not the AST being wrong |
| The traversal problem | Many stages, one tree. Type-test ladders duplicate the dispatch everywhere; methods-on-nodes make every node depend on every stage |
| Visitor pattern | Node exposes one fact — its own type — via `accept`; all logic for one operation lives in one visitor class |
| Double dispatch | Behaviour depends on two axes (node type × operation), so dispatch happens twice: `accept` picks the node type, the visitor class picks the operation |
| Expression problem | **Verified:** one new node type broke all 4 visitors; one new visitor broke 0 node types. Right trade for compilers — grammars are stable, passes multiply |
| Modern caveat | Visitor is a workaround for missing sum types + pattern matching. With `match` (Rust/OCaml/Scala/Python 3.10+) you get the same benefit plus compiler-enforced exhaustiveness |

## Where We Go Next

The AST is now a clean, traversable structure, and the visitor pattern lets any number of passes walk it independently. But every visitor written so far answers its question from **tree shape alone** — a node's result depends only on its children.

Q3 showed where that stops working. The moment a program says `let x = 5` and later `x + 2`, the meaning of `x` lives in a *different part of the tree entirely*, and no amount of examining the `Var` node reveals it. The compiler needs accumulated, scoped knowledge about names: what's declared, where it's visible, and what it refers to. Chapter 5 builds the symbol table and the scope chain that answer those questions — the first stage that reasons about the program rather than its shape.

*Next: [05_Semantic_Analysis_Symbol_Tables.md](05_Semantic_Analysis_Symbol_Tables.md)*
