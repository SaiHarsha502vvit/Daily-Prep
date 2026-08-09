# Chapter 3 — Bottom-Up LR Parsing

> Chapter 2 kept rewriting the grammar until the parser could cope. This chapter asks the opposite question: what would a parser have to do to cope with the grammar you actually wanted to write?

---

## The Problem

Every fix in Chapter 2 was a change to the **grammar**, made to accommodate the parser:

- `E → E '+' T` was rewritten as `E → T ('+' T)*` because left recursion made recursive descent loop forever
- `stmt → ID '=' expr | ID '(' args ')'` was left-factored because overlapping FIRST sets defeated one-token lookahead

Both rewrites preserved the language. Neither was something you'd do if the parser weren't forcing you. And the left-recursive form was arguably *better* — it expressed left-associativity directly, where the iterative form only achieves it through a fold direction you have to get right by hand (§2.3, the failure mode that silently computes `1-2-3 = 2`).

So: is the grammar rewriting essential, or an artefact of one particular parsing strategy?

It's an artefact. Chapter 2's Q3 identified the root cause — recursive descent is **predictive**: it must choose a production *before* parsing its contents. This chapter builds the alternative that defers every decision, and the first thing to check is whether it really does swallow the grammar Chapter 2 couldn't:

```
E → E '+' T | T
T → T '*' F | F
F → '(' E ')' | id
```

Left-recursive in two places. Run it through this chapter's construction:

```
LR(0) states built: 12    conflicts: NONE
```

*(Verified.)* No rewriting. The grammar that broke recursive descent is handled without modification — and, as §3.6 shows, left recursion isn't merely tolerated here, it's the *preferred* form.

## 3.1 The Core Inversion — Recognise at the End, Not the Start

Top-down parsing starts at `E` and works down toward the tokens, guessing which production applies before seeing its contents. **Bottom-up parsing starts at the tokens and works up toward `E`**, only naming a production once it has already seen the whole right-hand side.

Why that dissolves the left-recursion problem: to reduce by `E → E '+' T`, the parser needs `E`, `+`, and `T` all present and already recognised. There's no moment where it commits to "this is an `E + T`" while holding nothing — by the time it decides, the evidence is complete. Recursive descent failed because it had to announce the production first and consume second; here the order is reversed, so the recursion has nothing to be infinite about.

The parser keeps a **stack of symbols recognised so far**, and at each step makes one of two moves:

- **Shift** — push the next input token onto the stack. *"I don't have a complete right-hand side yet; get more evidence."*
- **Reduce** — the top of the stack matches some production's right-hand side; pop those symbols and push the left-hand side. *"I've seen `T * F`; that's a `T`."*

The whole method is deciding, at each step, which of those two to do. Everything else is machinery for making that decision reliably.

> **Naming, so the standard terminology lands:** **LR** = scan **L**eft-to-right, produce a **R**ightmost derivation (discovered in reverse — reductions happen in the opposite order to a rightmost derivation's expansions). Contrast Chapter 2's **LL** = Left-to-right, **L**eftmost derivation. The substring currently sitting on top of the stack that's ready to be reduced is called a **handle**, and "parsing" in this framework means repeatedly finding the handle.

## 3.2 Watching It Run

Before the machinery, watch the moves. Here's the actual trace of `id + id * id` through the generated parser — stack on the left, remaining input in the middle:

```
stack            input            action
-                id + id * id $   shift id
F                + id * id $      reduce F -> id
T                + id * id $      reduce T -> F
E                + id * id $      reduce E -> T
E                + id * id $      shift +
E +              id * id $        shift id
E + F            * id $           reduce F -> id
E + T            * id $           reduce T -> F
E + T            * id $           shift *
E + T *          id $             shift id
E + T * F        $                reduce F -> id
E + T            $                reduce T -> T * F
E                $                reduce E -> E + T
E                $                ACCEPT
```

*(Actual output.)* Two things worth reading carefully:

**Precedence falls out of reduction order.** Look at the last three reductions. `T -> T * F` fires *before* `E -> E + T`. The multiplication is collapsed into a single `T` while the addition is still waiting on the stack — so when the addition finally reduces, its right operand is already the completed product. Chapter 2 got precedence by *layering the grammar*; here the same layered grammar produces it through *when* each reduction becomes possible. Same grammar, same tree, entirely different mechanism.

**Left recursion is unremarkable.** The step `reduce E -> E + T` pops an `E`, a `+`, and a `T`, and pushes an `E`. The `E` being popped was recognised long before. Nothing recurses; a symbol is just replaced by another symbol. The construct that made recursive descent loop forever is, here, the most ordinary move in the trace.

## 3.3 LR(0) Items — Tracking Partial Progress

For the parser to know when the stack top is a handle, it needs to track *how far through* each production it currently is. The notation is an **item**: a production with a dot marking the position reached.

```
F → . ( E )        the dot at the start: "expecting an F, haven't started"
F → ( . E )        seen the '(', now expecting an E
F → ( E . )        seen '(' E, now expecting ')'
F → ( E ) .        complete — this is a handle, reduce it
```

A dot at the far right means the whole right-hand side is on the stack: **reduce**. A dot before a terminal means that terminal is expected next: **shift**. A dot before a *nonterminal* means something subtler — the parser is expecting an `E`, and an `E` can begin in several ways, so *all* the productions for `E` are now simultaneously live possibilities.

That last case is exactly what makes bottom-up parsing work without guessing. The parser doesn't pick one; it tracks **all of them at once**. A parser state is therefore a *set* of items — every position the parser could plausibly be in, given what it has seen. Ambiguity about which production is in play is not resolved prematurely; it's carried, and collapses on its own once enough input arrives to rule the alternatives out.

## 3.4 Closure and Goto — Building the State Machine

Two operations construct those sets.

**Closure** — if a state contains an item with the dot before a nonterminal, add every production for that nonterminal with the dot at the start. Repeat to fixpoint. Starting from `E' → . E`:

```
E' → . E                  the dot precedes E, so add all E productions:
E  → . E + T
E  → . T                  now the dot precedes T, so add all T productions:
T  → . T * F
T  → . F                  now the dot precedes F:
F  → . ( E )
F  → . id
```

Seven items, one state. It says: *"at the very start, I might be at the beginning of any of these seven things, and I don't yet need to know which."*

**Goto** — from a state, move the dot past a symbol `X` and take the closure of the result. That's the transition on `X`. Doing this exhaustively from the start state until no new sets appear gives the **canonical collection** — and it is literally a DFA whose states are item sets and whose alphabet is the grammar symbols.

For the expression grammar: **12 states**, verified. And notice what just happened — the same finite-automaton machinery from Chapter 1's lexer reappears, but recognising *grammar positions* instead of characters. The stack supplies the memory a DFA lacks; the DFA supplies the state tracking a bare stack lacks. Together they're a pushdown automaton, which is exactly what [CSE303 Ch06](../../S03/CSE303_Theory_Of_Computation/06_Pushdown_Automata.md) says you need for context-free languages.

## 3.5 From States to a Table

The DFA plus one rule per state becomes a two-part table:

- **ACTION[state, terminal]** → shift *n*, reduce by production *p*, accept, or error
- **GOTO[state, nonterminal]** → the state to enter after a reduction

The driver loop is then trivial and grammar-independent:

```
loop:
    look up ACTION[top-of-stack state, current token]
    shift  → push token and its new state, advance input
    reduce → pop |RHS| symbols, push LHS, then push GOTO[exposed state, LHS]
    accept → done
```

This is the payoff of the whole construction: **the parser is a fixed 20-line driver plus a generated table.** Chapter 2's parser was code you wrote per grammar; this one is data you generate per grammar. That's why `yacc`, `bison`, and their descendants exist — they emit the table, you write the grammar.

The trade is legibility. A recursive-descent parser can be read and stepped through in a debugger; state 7 of a generated table cannot meaningfully be read at all. When an LR parser rejects a valid-looking program, you debug the *grammar* through conflict reports, not the parser.

## 3.6 SLR — Deciding *When* to Reduce

One gap remains. A state can contain a completed item (`T → F .`, reduce) alongside shiftable items. Reducing unconditionally whenever a production is complete is wrong — sometimes more input should be consumed first.

**SLR's answer** (Simple LR): reduce by `A → α` only when the lookahead token is in **FOLLOW(A)** — the set of terminals that can legitimately appear immediately after `A` anywhere in the grammar. If the next token couldn't possibly follow an `A`, then the thing on the stack isn't an `A` yet, so don't reduce.

Computed for our grammar:

```
FOLLOW(E) = { $, ), + }
FOLLOW(T) = { $, ), *, + }
FOLLOW(F) = { $, ), *, + }
```

*(Verified.)* Read `FOLLOW(T)` against the trace in §3.2. At `E + T` with `*` next: `*` ∈ FOLLOW(T), and there's also a shiftable item — the parser shifts, eventually reducing `T → T * F`. Had it reduced `E → E + T` there instead, `*` would have been left with nowhere to attach and precedence would be wrong. **FOLLOW is what stops the parser reducing too early**, and it's why the trace collapses the multiplication first.

With SLR applied, the expression grammar yields **zero conflicts** across all 12 states — a complete, working parser for a grammar recursive descent rejected outright.

## 3.7 Conflicts — What the Table Reports

A conflict is a table cell wanting two values at once. There are exactly two kinds, and they mean different things.

**Shift/reduce** — the state could either shift the lookahead or reduce a completed production. Run Chapter 2's dangling-else grammar through the identical construction:

```
S → 'if' S | 'if' S 'else' S | 'x'

shift/reduce conflict found: YES
   state 4 on 'else': ['reduce S->if S', 'shift']
```

*(Verified — the conflict is detected mechanically, not asserted.)* This is the same ambiguity Chapter 2 met, and here's the difference worth internalising: **recursive descent resolved it silently by accident of call-stack shape; the LR construction reports it.** The generator prints a diagnostic and the grammar author must decide. Tools default to *shift* — which happens to give "else binds to the nearest unmatched if," matching C, Java, and JavaScript — but the point is that it's now a visible decision rather than an invisible one.

That visibility is the real argument for generated parsers. A conflict report is the tool telling you your language has an ambiguity you may not have known about.

**Reduce/reduce** — two different productions are both complete in the same state with the same lookahead. This is almost always a genuine grammar bug rather than a resolvable preference, and unlike shift/reduce there's no sensible default. Tools pick the earlier-declared production and warn loudly.

## 3.8 LALR — the Compromise Everyone Actually Ships

SLR is weak in a specific way: FOLLOW sets are computed **globally**, over the whole grammar. If `A` can be followed by `)` *somewhere*, then every state reduces `A` on `)` — even states where that's impossible in context. Some unambiguous grammars get spurious conflicts from this over-approximation.

**Canonical LR(1)** fixes it by carrying a precise lookahead set inside each item, computed per-state rather than globally. It's strictly more powerful — and it explodes the state count, often into the thousands for a real language, historically an unacceptable memory cost.

**LALR(1)** is the compromise: build the LR(1) states, then **merge any states whose items are identical apart from lookaheads**, unioning the lookahead sets. This recovers LR(0)'s small state count with most of LR(1)'s power, and it's what `yacc`, `bison`, and most generators have used for decades.

**When it breaks — the precise cost of that merge.** Unioning lookahead sets can make two reductions that were distinguishable in separate LR(1) states become indistinguishable once merged, so **LALR can introduce reduce/reduce conflicts that canonical LR(1) does not have.** The merge cannot create *shift/reduce* conflicts — shifts depend only on the item cores, which merging leaves untouched — but reduce/reduce is genuinely at risk.

This is a real failure mode with a confusing signature: your grammar is unambiguous, canonical LR(1) would accept it, and `bison` still reports a reduce/reduce conflict. The grammar isn't wrong; the *approximation* is too coarse. The usual fixes are restructuring to keep the offending contexts apart, or switching to a generator that does canonical LR(1) or GLR.

**The hierarchy, ordered by grammars accepted:**

```
LL(1)  ⊂  SLR(1)  ⊂  LALR(1)  ⊂  LR(1)  ⊂  unambiguous CFGs
```

Each step accepts strictly more grammars at higher construction cost — and every one of them stops short of all unambiguous grammars, which is why languages with genuinely awkward syntax (C++ being the standard example) end up with hand-written parsers regardless.

## Section Challenge

<details>
<summary><strong>Q1.</strong> In the §3.2 trace, the parser reduces <code>F → id</code>, then immediately <code>T → F</code>, then immediately <code>E → T</code> — three reductions in a row producing no new information, before it has even looked at the <code>+</code>. Why does it bother? What would break if it skipped straight from <code>id</code> to <code>E</code>?</summary>

Those single-symbol productions (`T → F`, `E → T`) are **unit productions**, and they look like pure overhead. They exist because the grammar's layering (§2.2) is what encodes precedence: `E`, `T`, and `F` are distinct *levels*, and a token must be lifted to the correct level before it can participate in an operation at that level.

Concretely: the parser cannot reduce `E → E + T` unless there is an `E` on the stack. After `F → id`, the stack holds `F` — not an `E` — so the addition production doesn't match anything. The climb `F → T → E` is what makes the first operand eligible to be an addition's left operand.

**What breaks if you skip to `E` directly.** Consider `id * id`. If the first `id` became an `E` immediately, the stack would hold `E`, and `T → T * F` requires a `T` on the left — no match. The parser would be stuck holding an `E` where the grammar needs a `T`, and a perfectly valid expression would be rejected. Compare with the real trace: `id + id * id` reduces the second `id` only as far as `T` before shifting `*`, precisely so that `T → T * F` can fire. The stopping point differs by context, which is exactly what the state machine tracks.

So the unit reductions are load-bearing: they're the runtime expression of the precedence hierarchy. (Real generators do optimise the *cost* away — merging unit reductions into the table — but the level distinctions they encode have to remain.)
</details>

<details>
<summary><strong>Q2.</strong> A colleague hits a shift/reduce conflict in <code>bison</code>, notices the default (shift) produces correct behaviour for their test cases, and decides to ignore the warning. Under what circumstances is that defensible, and what should they do to make it safe?</summary>

It's defensible when the conflict corresponds to a **known ambiguity with a deliberately chosen resolution**, and the default happens to implement that choice. The dangling else is the canonical case: the ambiguity is real and unavoidable (§3.7), essentially every C-family language resolves it as "nearest unmatched `if`," and shift is exactly that resolution. Suppressing that warning is standard practice.

It is *not* defensible as a general habit, for two reasons. First, "my tests pass" is weak evidence — the conflict fires only on inputs that reach that state with that lookahead, and a test suite that doesn't happen to contain one will pass while the grammar is still wrong for inputs users will eventually write. Second, an unexamined conflict may indicate an ambiguity the author didn't know their language had, in which case the default resolution is arbitrary rather than chosen.

Making it safe means converting an implicit accident into an explicit decision:
1. **Read the conflict report.** Bison will show the exact state, items, and lookahead. Determine which ambiguity it actually is.
2. **If the default is right, declare it** — use precedence declarations (`%left`, `%right`, `%nonassoc`) or `%expect N`, so the resolution is recorded in the grammar file and a *new, different* conflict appearing later still fails the build.
3. **If it isn't right, restructure the grammar** so the ambiguity can't arise.

The distinction: `%expect 1` says "I know about exactly one conflict and I've chosen its resolution." Ignoring warnings says "I don't know how many I have." The first is engineering; the second is luck.
</details>

<details>
<summary><strong>Q3.</strong> The §3.2 trace ends in <code>ACCEPT</code> — it proves <code>id + id * id</code> is grammatical. But a compiler needs to <em>evaluate</em> or <em>compile</em> it, and the trace leaves behind only an empty stack. What is the parser actually failing to produce, and what would you attach to the reduce step to fix it?</summary>

The trace produces a **recognition decision**, not a **structure**. Every reduction discovered a real piece of tree — `T → T * F` is the moment the parser knew a multiplication node existed, with known children — but that knowledge was used to update the stack and then discarded. What survives is one bit: accept or reject. No later stage can do anything with that.

What's missing is the **abstract syntax tree**. The fix is to attach a *semantic action* to each production — a fragment that builds a node from the children being popped:

```
E → E '+' T     { $$ = BinaryOp('+', $1, $3) }
T → T '*' F     { $$ = BinaryOp('*', $1, $3) }
F → id          { $$ = Literal($1) }
```

Run alongside the reductions, these mean the stack carries *values* (tree nodes) beside symbols. Each reduce pops the children's nodes and pushes the parent. The reduce order from §3.2 then assembles the tree bottom-up, and when `E → E + T` fires last, its `$3` is the already-built multiplication node — precedence preserved automatically, because the reduction order *is* the tree shape.

That single change turns a recogniser into a parser in the useful sense, and the tree it produces — deliberately simpler than the full parse tree, dropping unit productions and punctuation — is the AST that Chapter 4 designs and every later stage traverses.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| The inversion | Recognise a production at its **end**, once the whole right-hand side is on the stack, instead of predicting it at the start |
| Left recursion | Not a problem but the *natural* case — `E → E + T` is an ordinary reduction. Verified: 12 states, **zero conflicts**, no grammar rewriting |
| Shift / reduce | The only two moves. Shift = gather more evidence; reduce = the stack top is a handle, collapse it |
| Precedence, again | Chapter 2 got it from grammar layering; here the *same* layered grammar produces it through reduction **order** — `T → T * F` fires before `E → E + T` |
| LR(0) items | A production with a dot marking progress. A state is a **set** of items — all positions the parser could be in, held simultaneously rather than guessed between |
| Closure / goto | Build the canonical collection: a DFA over grammar symbols. Chapter 1's automaton machinery, recognising grammar positions instead of characters |
| Table-driven | A fixed ~20-line driver plus a generated table — parser as *data*, not code. The reason `yacc`/`bison` exist; the cost is that state 7 isn't human-readable |
| SLR and FOLLOW | Reduce `A → α` only when the lookahead ∈ FOLLOW(A). This is what stops early reduction and makes the precedence-correct trace happen |
| Conflicts | Shift/reduce = often a real ambiguity with a sensible default (dangling else, **verified detected**); reduce/reduce = usually a genuine grammar bug |
| LALR's cost | Merging LR(1) states by core can introduce **reduce/reduce** conflicts LR(1) wouldn't have — never shift/reduce. Unambiguous grammar + bison complaint = approximation too coarse |
| The hierarchy | LL(1) ⊂ SLR(1) ⊂ LALR(1) ⊂ LR(1) ⊂ unambiguous CFGs — each strictly stronger, none covering everything |

## Where We Go Next

Chapters 2 and 3 give two routes from tokens to structure — hand-written and predictive, or generated and deferred. Both answer the same question: *is this input grammatical, and how does it group?*

But Q3 exposed what neither has actually delivered. The recursive-descent parser returned nested tuples; the LR parser returned `ACCEPT` and an empty stack. Neither produced a data structure a type checker, optimiser, or code generator could traverse — and the parse tree, if you built it literally, would be cluttered with unit productions and punctuation that exist to guide parsing and mean nothing afterwards. Chapter 4 designs the **abstract syntax tree**: what to keep, what to discard, and the visitor pattern that lets every later stage walk it without each one re-implementing the traversal.

*Next: [04_AST_And_Visitor_Pattern.md](04_AST_And_Visitor_Pattern.md)*
