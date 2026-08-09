# Chapter 2 — Recursive Descent & LL Parsing

> The parser is the first stage that has an opinion. The lexer only reported what it saw; the parser decides that `2 * 3` in `1 + 2 * 3` is a single thing, and that decision — made in the shape of a tree — is what every later stage will treat as the meaning of the program.

---

## The Problem

Chapter 1 delivered a flat list:

```
NUM(1)  PLUS(+)  NUM(2)  STAR(*)  NUM(3)
```

Five tokens in a row. Nothing in that list says whether the program means `(1 + 2) * 3` or `1 + (2 * 3)` — and those evaluate to **9** and **7**. The token stream is genuinely, structurally ambiguous about the one thing that determines the answer.

Chapter 1's Q3 established *why* the lexer couldn't fix this: recognising nesting needs a stack, and a finite automaton doesn't have one. So this chapter builds the stage that does. Two things are needed: a **notation** for describing nested structure, and a **machine** that can recognise it.

> **Prerequisite, not re-derived here.** Context-free grammars, derivations, parse trees, and pushdown automata are covered by [CSE303](../../S03/CSE303_Theory_Of_Computation/): [Ch05 Context-Free Grammars](../../S03/CSE303_Theory_Of_Computation/05_Context_Free_Grammars.md) and [Ch06 Pushdown Automata](../../S03/CSE303_Theory_Of_Computation/06_Pushdown_Automata.md). This chapter assumes you know what a CFG *is* and shows what a compiler writer has to do to make one actually usable — which turns out to be most of the work.

## 2.1 The Obvious Grammar, and Why It Fails

Write down arithmetic the way you'd describe it out loud:

```
expr → NUM
     | expr '+' expr
     | expr '*' expr
     | '(' expr ')'
```

This is a perfectly legal context-free grammar. It generates exactly the right *set* of strings — every valid arithmetic expression, and nothing else. By the standards of CSE303, it's correct.

It is also unusable, for a reason that has nothing to do with which strings it accepts.

Derive `1 + 2 * 3` from it. There are two ways:

```
Derivation A                    Derivation B
expr                            expr
→ expr '+' expr                 → expr '*' expr
→ 1 '+' expr                    → expr '+' expr '*' expr
→ 1 '+' (expr '*' expr)         → (1 '+' 2) '*' 3
→ 1 + (2 * 3)  = 7              → (1 + 2) * 3  = 9
```

Same grammar, same input, **two different parse trees, two different answers.** A grammar that permits this is **ambiguous**, and ambiguity is fatal for a compiler in a way it isn't for a language theorist: the theorist asks "is this string in the language?" (yes, either way), while the compiler must ask "what does this string *mean*?" — and the grammar declines to say.

**So the requirement is stronger than membership.** A compiler's grammar must generate the right set of strings *and* assign each string exactly one tree. Getting from the first to the second is what §2.2 and §2.3 are about.

## 2.2 Deriving Precedence — Layering, Not Annotation

You know the intended rule: `*` binds tighter than `+`. The question is how to encode that in a grammar that has no notion of "tighter."

Think about what "binds tighter" means in **tree** terms. In `1 + (2 * 3)`, the multiplication is *deeper* in the tree — closer to the leaves. Evaluation happens bottom-up, so deeper means **evaluated sooner**. So:

> Binding tightness = depth in the tree. To make an operator bind tighter, force it to appear lower.

And you force it lower by giving each precedence level **its own nonterminal**, arranged so the looser operator can only be built out of tighter ones:

```
expr   → term (('+' | '-') term)*        ← loosest: sits at the TOP of the tree
term   → factor (('*' | '/') factor)*    ← tighter: can only appear INSIDE an expr
factor → NUM | '(' expr ')'              ← tightest: atoms, and the recursion escape hatch
```

Read the layering as a constraint: an `expr` is *made of* `term`s. A `term` cannot contain a bare `+` — the only way a `+` gets into the tree is at the `expr` level, which is above every `term`. The precedence isn't declared anywhere; it's a **consequence of which nonterminal can appear inside which**.

Verified, parsing with this grammar and printing the tree:

```
1 + 2 * 3      ->  (1 + (2 * 3))          = 7      ← * grouped deeper, as intended
2 * 3 + 1      ->  ((2 * 3) + 1)          = 7      ← works from either side
(1 + 2) * 3    ->  ((1 + 2) * 3)          = 9      ← parens override, via factor
```

Note the third line: `factor → '(' expr ')'` is what lets parentheses reach all the way back up to the loosest level. It's the escape hatch that makes the hierarchy overridable, and it's also the rule that makes the grammar recursive at all.

## 2.3 Deriving Associativity — the Shape of the Repetition

Precedence is settled; ambiguity isn't. What about `1 - 2 - 3`?

Both groupings use only the `-` operator, so precedence has nothing to say:

```
(1 - 2) - 3  = -4      ← left-associative
1 - (2 - 3)  =  2      ← right-associative
```

Arithmetic requires the first. Where does that come from? **From how you write the repetition** — and this is the part that's easy to get wrong without noticing, because both versions look reasonable.

Written as a loop that folds the accumulated tree into the *left* slot each time:

```
node ← term()
while next token is '+' or '-':
    op ← consume()
    node ← (op, node, term())      ← previous tree becomes the LEFT child
```

Trace `1 - 2 - 3`: parse `1`, see `-`, build `(1 - 2)`, see `-` again, build `((1 - 2) - 3)`. Each iteration buries the earlier result deeper on the left. **Left-associative.**

Written instead as a right recursion — `node ← (op, node, expr())`, calling the whole rule again for the tail — the last operator would end up deepest, giving `(1 - (2 - 3))`. Right-associative. Both are one character apart in the code and neither will look wrong on inspection.

Verified:

```
1 - 2 - 3   ->  ((1 - 2) - 3)      = -4     ✓  (right-assoc would give 2)
8 / 4 / 2   ->  ((8 / 4) / 2)      =  1     ✓  (right-assoc would give 4)
```

> **The generalisable idea:** precedence is decided by *grammar layering* (which nonterminal nests inside which), associativity by *the direction the repetition folds*. Two different mechanisms, both invisible if you only check whether the parser accepts the input. This is why "my parser runs without errors" is not evidence that your grammar is right — a wrong-associativity parser accepts every valid program and silently computes wrong answers. Test the *tree*, not just for absence of exceptions.

## 2.4 Recursive Descent — Your Call Stack Is the Automaton's Stack

The grammar is now unambiguous. Turning it into a parser is startlingly direct:

> **One function per nonterminal. The body of the function mirrors the right-hand side of the rule.**

```python
def expr(self):                          # expr → term (('+'|'-') term)*
    node = self.term()
    while self.peek() in ('+', '-'):
        op = self.eat(self.peek())
        node = (op, node, self.term())
    return node

def term(self):                          # term → factor (('*'|'/') factor)*
    node = self.factor()
    while self.peek() in ('*', '/'):
        op = self.eat(self.peek())
        node = (op, node, self.factor())
    return node

def factor(self):                        # factor → NUM | '(' expr ')'
    if self.peek() == 'NUM':
        return ('num', int(self.eat('NUM')))
    self.eat('(');  n = self.expr();  self.eat(')')
    return n
```

That's a complete, working expression parser. Three functions, and the grammar is legible in the code.

**Here is the part worth stopping on.** Chapter 1 established that recognising nesting requires a stack, and that the lexer's lack of one is why it must hand off. So where is the stack here? There is no `stack = []` anywhere in the code.

It's the **call stack**. When `factor` hits `(` and calls `expr`, that nested call pushes a frame — and that frame *is* the record of "I am currently inside one level of parentheses." Return from it and the level pops. Nesting depth in the input becomes call depth in the parser, one for one.

So the pushdown automaton from [CSE303 Ch06](../../S03/CSE303_Theory_Of_Computation/06_Pushdown_Automata.md) isn't being simulated with a data structure — it's being **borrowed from the host language's runtime**. The technique is called *recursive descent* precisely because the recursion is doing the work the theory says a stack must do.

That also tells you its limit, concretely: deeply nested input consumes real call frames, and a pathological input like 50,000 nested parentheses will overflow the stack. [Chapter 1 of the JavaScript module](../../../16_JavaScript/01_JS_Foundations.md) measures exactly how few frames that can be — and that the limit depends on frame size, not a fixed count. Production parsers for untrusted input either impose a depth limit or switch to an explicit stack.

## 2.5 Left Recursion — the Rule That Silently Doesn't Work

The stratified grammar in §2.2 used a loop (`(...)*`). The more traditional way to write "one or more terms separated by `+`" in a CFG is left recursion:

```
expr → expr '+' term
     | term
```

Mathematically this is fine and it's naturally left-associative — which is exactly what §2.3 wants. Translate it to recursive descent by the same mechanical rule as before:

```python
def expr(self):
    node = self.expr()          # first symbol of the RHS is expr itself
    op = self.eat(self.peek())
    return (op, node, self.term())
```

Run it:

```
RecursionError: infinite recursion, zero tokens consumed
```

*(Verified — recursion limit lowered to 200 to make the failure quick.)*

**Why, precisely:** `expr()` calls `expr()` as its very first action, *before consuming any input*. The second call is in an identical state to the first — same position, same token — so it does the same thing. Nothing ever advances, so no base case is ever reachable. It's not a deep recursion that runs out of room; it's a recursion that makes **zero progress**.

This is the fundamental constraint on recursive descent, and it's worth stating as a rule: **a recursive-descent parser cannot handle a left-recursive grammar**, because "consume input, then recurse" is the only pattern that terminates, and left recursion inverts it.

The fix is the transformation already used in §2.2 — replace left recursion with iteration:

```
expr → expr '+' term          becomes          expr → term ('+' term)*
     | term
```

These generate the identical language. The loop version terminates because each iteration consumes at least the operator token. And, as §2.3 showed, folding the accumulator leftward preserves the left-associativity the recursive form had for free. **The grammar you write for a theory course and the grammar you write for a recursive-descent parser are different artefacts, even when they describe the same language.**

## 2.6 LL(1) — What One Token of Lookahead Buys

Look at `factor`:

```python
if self.peek() == 'NUM':  ...       # take the NUM alternative
else:                     ...       # take the '(' expr ')' alternative
```

It chooses between two productions by examining **one** token. That works only because the two alternatives can't start with the same token — `NUM` begins one, `(` begins the other, and they're disjoint.

Formalised, the set of tokens that can begin a given nonterminal is its **FIRST set**:

```
FIRST(factor) = { NUM, '(' }
FIRST(term)   = FIRST(factor) = { NUM, '(' }
FIRST(expr)   = FIRST(term)   = { NUM, '(' }
```

`term` and `expr` inherit theirs because each begins with the layer below it. And the decision rule is: **when choosing among alternatives, one token of lookahead is enough if and only if their FIRST sets are pairwise disjoint.** For `factor`, `{NUM}` and `{'('}` don't overlap, so one token decides it.

A grammar where *every* choice can be made this way is called **LL(1)**:

- **L** — scan input Left to right
- **L** — produce a Leftmost derivation
- **(1)** — using 1 token of lookahead

Recursive descent is the natural implementation of LL(1), which is why the two are usually taught together. (Nonterminals that can derive the empty string need a companion **FOLLOW** set — the tokens that can legally come *after* — to decide whether to take the empty alternative. The grammar here has no empty productions, so FIRST alone suffices.)

**Why this matters practically:** LL(1) is a real restriction, not a formality. Plenty of natural grammars aren't LL(1) — including anything left-recursive (§2.5), and anything where two alternatives begin with the same token, like `stmt → ID '=' expr | ID '(' args ')'` (both start with `ID`, so one token can't distinguish an assignment from a call). Some of these are fixable by *left factoring* — hoisting the shared prefix out — and some genuinely need more lookahead or a different parsing strategy entirely, which is Chapter 3's subject.

## 2.7 When It Breaks: The Dangling Else

Everything so far suggests ambiguity is a fixable defect — restructure the grammar and it goes away. Here's the case where it doesn't go away, and where every real language just picks a winner.

```
stmt → 'if' expr stmt
     | 'if' expr stmt 'else' stmt
     | other
```

Now parse:

```
if a if b s1 else s2
```

Two readings, both fully consistent with the grammar:

```
A:  if a { if b s1 else s2 }        ← else belongs to the INNER if
B:  if a { if b s1 } else s2        ← else belongs to the OUTER if
```

These mean genuinely different things. If `a` is true and `b` is false, reading A runs `s2` and reading B runs nothing.

**Why this one is harder than §2.1's:** the arithmetic ambiguity was an artefact of a lazily-written grammar, and stratification eliminated it because precedence gave a principled reason to prefer one tree. Here there is no such principle — nothing about the language says an `else` *ought* to attach inward or outward. The ambiguity is in the syntax as designed, not in how it was written down.

So languages resolve it by **fiat**: C, C++, Java, JavaScript, and C# all specify that `else` binds to the **nearest unmatched `if`** (reading A). A recursive-descent parser gets this behaviour essentially by accident — on seeing `else`, the innermost active `stmt` call is the one that consumes it, and the innermost call is the inner `if`. The rule that a language committee had to write into a standard falls out of the call stack's shape.

Grammar-driven tools (Chapter 3's LR generators) *report* this as a shift/reduce conflict and require you to resolve it explicitly. That's a genuine advantage of the generated approach: it tells you the ambiguity exists rather than silently picking. Recursive descent's silence here cuts both ways — convenient when its default matches your intent, dangerous when you never learned there was a choice.

## Section Challenge

<details>
<summary><strong>Q1.</strong> Extend the grammar with exponentiation <code>^</code>, which binds tighter than <code>*</code> and is <strong>right</strong>-associative (<code>2^3^2</code> is <code>2^(3^2)</code> = 512, not <code>(2^3)^2</code> = 64). Write the new rule, and say exactly which mechanism from this chapter gives you each of the two properties.</summary>

Two independent decisions, from §2.2 and §2.3 respectively.

**Tighter than `*` → a new layer below `term`.** Insert `power` between `term` and `factor`:

```
term  → power (('*' | '/') power)*
power → factor ('^' power)?          ← note the right-hand side
factor → NUM | '(' expr ')'
```

Because `term` is now built from `power`s, and `power` sits above `factor`, `^` can only appear deeper in the tree than `*` — which is precedence, by the layering argument.

**Right-associative → recurse instead of loop.** This is the key contrast with every other level. The `+`/`*` levels use `(... )*` — a loop that folds the accumulator leftward, giving left-associativity. Here the rule recurses into `power` on the right-hand side, so the tail is parsed as a complete `power` before being attached:

```python
def power(self):
    base = self.factor()
    if self.peek() == '^':
        self.eat('^')
        return ('^', base, self.power())    # recursive call — NOT a loop
    return base
```

Trace `2^3^2`: parse base `2`, see `^`, recurse — that inner call parses base `3`, sees `^`, recurses again, gets `2`. Innermost completes as `(3^2)`, then the outer builds `(2 ^ (3^2))` = 512. The last operator ends up deepest, which is right-associativity.

Verified by adding the layer to the parser and running it:

```
2^3^2   ->  (2 ^ (3 ^ 2))     = 512     ← right-assoc (left-assoc would give 64)
2*3^2   ->  (2 * (3 ^ 2))     = 18      ← ^ deeper than *, so it binds tighter
2^3*2   ->  ((2 ^ 3) * 2)     = 16      ← works from the other side too
```

Note this is *safe* recursion, unlike §2.5's: `self.power()` is called only **after** `self.eat('^')` has consumed a token, so every recursive call makes progress. Left recursion fails because it recurses before consuming; right recursion is fine because it consumes first.
</details>

<details>
<summary><strong>Q2.</strong> A colleague writes <code>stmt → ID '=' expr | ID '(' args ')'</code> for assignments and calls, and their recursive-descent parser mis-parses every function call. Diagnose it in terms of FIRST sets, and give a fix that keeps one token of lookahead.</summary>

**Diagnosis.** `FIRST` of both alternatives is `{ID}` — they're identical, not disjoint. So the LL(1) condition from §2.6 fails: on seeing `ID`, one token of lookahead cannot tell which production applies, because the distinguishing token (`=` vs `(`) is the *second* one. A naive parser takes whichever alternative is written first, so every call gets parsed as an assignment and then errors (or worse, misparses) when it meets `(` instead of `=`.

**Fix — left factoring.** Hoist the shared prefix into its own production, so the choice happens *after* the common part is consumed and the deciding token is the current one:

```
stmt      → ID stmt_tail
stmt_tail → '=' expr
          | '(' args ')'
```

Now `stmt` has only one alternative (no choice to make), and by the time `stmt_tail` runs, `ID` is already consumed, so the lookahead token is exactly `=` or `(`. `FIRST(stmt_tail)` alternatives are `{'='}` and `{'('}` — disjoint. LL(1) restored, still one token.

The general shape: when two alternatives share a prefix, don't add lookahead — **restructure so the decision point moves to where the difference actually is.** Same move as §2.5's left-recursion elimination: rewrite the grammar to fit the parser, preserving the language.
</details>

<details>
<summary><strong>Q3.</strong> §2.5 showed recursive descent cannot handle left recursion, and §2.6 showed it needs disjoint FIRST sets. Both were fixed by rewriting the grammar. What would a parsing method have to do differently to accept the <em>original</em> grammars — and what does it need that recursive descent structurally lacks?</summary>

Both limitations trace to one root cause: recursive descent is **predictive**. It must commit to a production *before* parsing its contents — the choice of which function to call is made from the current token, up front. Left recursion breaks because committing to `expr → expr ...` means recursing before consuming; overlapping FIRST sets break because the information needed to choose hasn't arrived yet.

A method that accepts both would have to **postpone the decision instead of predicting it**: consume tokens, accumulate them, and only decide which production they matched once enough of the right-hand side is visible. Recognise the production at its *end* rather than its *start*.

That's exactly the bottom-up strategy. Instead of expanding from the start symbol downward (top-down, leftmost derivation — the second **L** in LL), it builds upward from the tokens, combining them into nonterminals as complete right-hand sides appear — a *rightmost* derivation discovered in reverse, which is the **R** in LR.

What it needs that recursive descent lacks is an **explicit stack of partially-recognised material** plus a table saying, for each state and lookahead, whether to consume another token (*shift*) or collapse the top of the stack into a nonterminal (*reduce*). Recursive descent's stack holds *function calls* — decisions already made — so it can't hold "tokens I've seen but haven't classified yet." Left recursion is then not a problem at all but the *natural* case, since reducing `expr '+' term` back into `expr` is just an ordinary reduction. That's Chapter 3.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Ambiguity | A grammar can generate exactly the right strings and still assign two trees to one input — fatal for a compiler, which needs meaning, not just membership |
| Precedence via layering | Tighter binding = deeper in the tree; achieve it by giving each level its own nonterminal, nested inside the looser one. Never annotated, always structural |
| Associativity via fold direction | Loop folding the accumulator leftward → left-assoc; recursing on the right → right-assoc. One character apart in code, and both parse "successfully" |
| Test the tree, not the exit code | A wrong-associativity parser accepts every valid program and silently computes wrong answers (`1-2-3` = 2 instead of −4) |
| Recursive descent | One function per nonterminal, body mirrors the production. The **call stack is the pushdown automaton's stack** — borrowed from the runtime, not built |
| Left recursion | Cannot work: `expr()` calls `expr()` before consuming, so zero progress — verified `RecursionError`. Rewrite as iteration; same language, terminating parser |
| Right recursion is fine | Safe when it consumes a token *first* (as in `power → factor ('^' power)?`) — the distinction is progress, not direction per se |
| FIRST sets / LL(1) | One token of lookahead suffices iff alternatives' FIRST sets are pairwise disjoint. Overlapping prefixes are fixed by left factoring, not more lookahead |
| Dangling else | Genuine syntactic ambiguity with no principled resolution — languages legislate "nearest unmatched `if`". Recursive descent happens to do this by default; LR tools report it as a conflict instead |

## Where We Go Next

Recursive descent is direct, debuggable, and produces excellent error messages — which is why GCC, Clang, and the TypeScript compiler all use hand-written recursive-descent parsers. But it bought that by imposing constraints on the *grammar*: no left recursion, disjoint FIRST sets, decisions committed up front. Every fix in this chapter was a grammar rewrite performed to satisfy the parser.

Chapter 3 inverts the relationship. Bottom-up (LR) parsing defers each decision until a complete production has been seen, which makes left recursion natural rather than fatal and accepts a strictly larger class of grammars — at the cost of a parse table you generate rather than code you read.

*Next: [03_Bottom_Up_LR_Parsing.md](03_Bottom_Up_LR_Parsing.md)*
