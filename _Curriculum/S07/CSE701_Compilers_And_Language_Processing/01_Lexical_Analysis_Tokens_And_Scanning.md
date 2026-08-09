# Chapter 1 — Lexical Analysis: Tokens & Scanning

> A source file is a flat run of characters. Nothing in it says where one word ends and the next begins — no more than a stream of ink says where a sentence starts. Every compiler's first job is to impose that structure, and every compiler gets it wrong in the same small handful of ways.

---

## The Problem

Here is what your compiler actually receives. Not a program — a string:

```
let count = 42;\nif (count >= 10) { print("hi there"); } // done
```

Fifty-seven characters in a row. The parser you'll build in Chapter 2 wants to work with *meaningful units* — "this is a keyword," "this is a number," "this is a greater-than-or-equal operator." It cannot begin until something has grouped those characters into units and labelled them.

That something is the **lexer** (equivalently: scanner, tokenizer). Its entire job: character stream in, token stream out. This chapter derives it from scratch — and, more usefully, derives the two rules that every lexer needs and that nothing about the problem statement makes obvious.

> **What this chapter assumes you already have.** Regular expressions, finite automata, and the regex→NFA→DFA construction are covered in depth by [CSE303 Theory of Computation](../../S03/CSE303_Theory_Of_Computation/), chapters [01 (DFA)](../../S03/CSE303_Theory_Of_Computation/01_DFA_Finite_Automata.md), [02 (NFA)](../../S03/CSE303_Theory_Of_Computation/02_NFA_Epsilon_Closure.md), and [03 (Regular Expressions)](../../S03/CSE303_Theory_Of_Computation/03_Regular_Expressions.md). This chapter does not re-derive them. What it does instead is show *why a compiler needs exactly that machinery* at exactly this stage — the connection those chapters set up but deliberately left for a compilers course to close.

## 1.1 The Naive Approach: Split on Whitespace

Words are separated by spaces. So split on spaces. Run it on the source above:

```
['let', 'count', '=', '42;', 'if', '(count', '>=', '10)', '{',
 'print("hi', 'there");', '}', '//', 'done']
```

*(Actual output, Python `str.split()`.)*

Four separate failures, each pointing at a different missing idea:

1. **`42;`** — a number and a semicolon fused into one unit. Whitespace isn't the only boundary; a token can end because the *next character can't continue it*.
2. **`(count`** and **`10)`** — punctuation glued to identifiers, same cause.
3. **`print("hi` / `there");`** — the string literal `"hi there"` was torn in half by the space *inside* it. So the rule isn't even "spaces separate tokens" — inside a string literal, a space is just a character. **Context changes what a space means.**
4. **`//` and `done`** survived as tokens at all — but a comment should vanish entirely before the parser ever sees it.

And the failure that kills the idea outright:

```
'x=1+2'.split()  →  ['x=1+2']
```

One token. Perfectly valid code, zero whitespace, and the naive lexer returns the whole line as a single blob. Whitespace is a *hint* that humans use for readability, not the structure the language is actually defined by.

## 1.2 What a Token Actually Is

The naive attempt fails because it produces *strings*. What the parser needs is strings **plus a classification**:

> A **token** is a pair: a **type** (what kind of thing this is) and a **lexeme** (the exact characters that formed it).

`('NUMBER', '42')`, `('GE', '>=')`, `('ID', 'count')`.

Why the type matters more than the lexeme: the parser deciding "is this a valid expression?" doesn't care whether the number is `42` or `9001` — both are a `NUMBER` and slot into the grammar identically. The type is what the grammar is written over; the lexeme is data carried along for later stages (Chapter 5's symbol table needs the actual name `count`; Chapter 7's code generator needs the actual value `42`).

That split — **classify for the parser, retain the text for later** — is the whole reason lexing is a separate stage rather than something the parser does inline. It collapses an alphabet of millions of possible identifiers down to a single grammar symbol.

## 1.3 Regular Expressions as the Specification Language

Each token type needs a rule describing which character sequences belong to it. Those rules turn out to be exactly what regular expressions describe:

| Token type | Pattern | Matches |
|---|---|---|
| `NUMBER` | `\d+\.\d+ \| \d+` | `42`, `3.14` |
| `ID` | `[A-Za-z_][A-Za-z_0-9]*` | `count`, `_tmp`, `x9` |
| `STRING` | `"[^"]*"` | `"hi there"` |
| `GE` | `>=` | `>=` |
| `COMMENT` | `//[^\n]*` | `// done` |

**Why regular expressions specifically — and not something more powerful?** This is the question worth sitting with, because "regex is the obvious tool" is hindsight, not reasoning.

Token structure is *flat*. An identifier is a letter followed by letters and digits — nothing inside it nests. A number is digits, possibly with a dot. None of these require counting or matching pairs. That's precisely the boundary of what regular languages can express (CSE303 Ch04's pumping lemma is the proof of where that boundary sits).

And the payoff for staying inside that boundary is enormous: a regular expression compiles to a **DFA**, and a DFA recognises input in **one pass, one character at a time, with a fixed amount of memory** — no backtracking, no stack. For a compiler that may scan millions of characters, "linear time, constant space" isn't a nice property, it's the reason this stage is essentially free.

The moment a construct *does* need nesting — matched parentheses, nested blocks — regular expressions provably cannot express it, and it becomes the parser's job in Chapter 2. **That split in the compiler pipeline is not a design convention; it's the Chomsky hierarchy showing up in your build directory.**

## 1.4 The Scanning Loop

With rules in hand, the algorithm:

```
position ← 0
while position < length(source):
    find a rule whose pattern matches source starting at position
    if none matches: error
    emit a token (type, matched text)     ← unless it's whitespace/comment
    position ← position + length(matched text)
```

Run against the original source, this produces:

```
('KW_LET', 'let')      ('ID', 'count')     ('ASSIGN', '=')
('NUMBER', '42')       ('SEMI', ';')       ('KW_IF', 'if')
('LPAREN', '(')        ('ID', 'count')     ('GE', '>=')
('NUMBER', '10')       ('RPAREN', ')')     ('LBRACE', '{')
('KW_PRINT', 'print')  ('LPAREN', '(')     ('STRING', '"hi there"')
('RPAREN', ')')        ('SEMI', ';')       ('RBRACE', '}')
```

*(Actual output from a working lexer.)* All four naive failures are gone: `42` and `;` separated, punctuation split from identifiers, the string literal intact **with its internal space preserved**, the comment discarded entirely. And it handles the killer case:

```
'x=1+2;'  →  ID(x) ASSIGN(=) NUMBER(1) PLUS(+) NUMBER(2) SEMI(;)
```

Six tokens from zero whitespace.

But the loop above contains an unspecified step — *"find a rule whose pattern matches"*. When more than one matches, which wins? That question has two plausible answers and only one correct one.

## 1.5 Maximal Munch — the First Rule You Wouldn't Guess

At position 2 of `a >= b`, both of these rules match:

- `GT` matches `>` (one character)
- `GE` matches `>=` (two characters)

**Strategy A — first match wins.** Take whichever rule appears first in the rule list.
**Strategy B — longest match wins.** Try all rules, take the longest match. This is called **maximal munch**.

Order the rules the way a person naturally would (single-character operators first, since they're simpler) and run both strategies:

```
input: 'a >= b'
   first-match  :  ID(a)  GT(>)  ASSIGN(=)  ID(b)      ← THREE tokens, wrong
   maximal munch:  ID(a)  GE(>=)            ID(b)      ← correct

input: 'x == y'
   first-match  :  ID(x)  ASSIGN(=)  ASSIGN(=)  ID(y)  ← "x = = y", nonsense
   maximal munch:  ID(x)  EQ(==)               ID(y)   ← correct
```

*(Both verified by execution.)*

First-match shatters every multi-character operator into its pieces. You could patch it by carefully ordering every long rule before its shorter prefixes — but that makes correctness depend on rule *ordering*, a fragile invariant that breaks silently the day someone appends a new operator to the end of the list. Maximal munch gets the right answer **regardless of ordering**, which is why essentially every real lexer uses it.

> **The generalisation worth keeping:** when a local choice is ambiguous, prefer a rule that depends on the *input* (which match is longest) over one that depends on the *specification's accidental arrangement* (which rule was written first). The first is a property of the language; the second is a property of your file.

## 1.6 Keywords vs Identifiers — the Second Rule You Wouldn't Guess

`let` is a keyword. But look at the `ID` pattern: `[A-Za-z_][A-Za-z_0-9]*` matches `let` perfectly well. So does `if`, `while`, and every other keyword. Keywords are a *subset* of identifiers, lexically indistinguishable.

The naive fix — add a `KW_LET` rule matching `let` before the `ID` rule — breaks immediately:

```
'letter x'   →  KW_LET(let) + ID(ter) + ID(x)      ← wrong: 'letter' torn apart
```

Maximal munch actually prevents *that* particular disaster (`ID` matching `letter`, 6 characters, beats `KW_LET` matching `let`, 3). But relying on it means the keyword rule only ever fires by accident of length.

The clean solution inverts the order of operations: **match the identifier first, then look up whether that identifier happens to be reserved.**

```
match ID → get lexeme "let"    → in keyword set? yes → retype as KW_LET
match ID → get lexeme "letter" → in keyword set? no  → stays ID
```

Verified:

```
'let x'     →  KW_LET(let)  ID(x)
'letter x'  →  ID(letter)   ID(x)      ← correctly NOT a keyword
```

This is a small but genuinely important structural idea: **the lexer's pattern-matching layer and its classification layer are separate.** Patterns find boundaries; a table assigns meaning. Keeping them separate means adding a keyword is a one-line change to a set, not a new regex competing with `ID` for precedence.

## 1.7 Errors — the Stage Where They're Cheapest to Report

When no rule matches, the lexer has found a character that cannot begin any token in the language:

```
'a @ b'  →  SyntaxError: unexpected char '@' at offset 2
```

The lexer is the **first** stage that sees the source, which makes it the first place a problem can be caught — and the place with the most precise position information, since it's tracking an exact character offset. That offset is what becomes `line 4, column 17` in the error message a user actually reads.

A production lexer usually doesn't stop at the first bad character. It reports the error, skips the offending character, and keeps scanning — **error recovery** — so that a single stray `@` yields one message rather than aborting a compile that might have twenty other real problems worth reporting in the same run.

## 1.8 When It Breaks: Maximal Munch vs. Nested Templates

§1.5 argued for maximal munch and the argument was sound. Here is the famous case where the rule it recommends produces a bug — and the language committee had to legislate around it.

In C++, `>>` is the right-shift operator. Now write a nested template:

```cpp
std::vector<std::vector<int>>  v;
```

The lexer reaches `>>` at the end. Maximal munch does exactly what §1.5 told it to: takes the **longest** match, producing a single right-shift token. But the parser needed **two separate `>` tokens** to close two template argument lists. Result, in C++03: a parse error on code that reads perfectly naturally, with the required workaround being a space —

```cpp
std::vector<std::vector<int> >  v;   // C++03: the space was mandatory
```

The root problem is a genuine layering violation. Whether `>>` means "shift" or "two closers" depends on **whether the parser is currently inside a template argument list** — that's grammatical context, and the lexer, by design, has none. It sees characters, not nesting. The clean separation from §1.3 that made the lexer fast is exactly what makes it blind here.

C++11 resolved it by special-casing the grammar ([N1757, *Right Angle Brackets*](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2005/n1757.html)): a `>>` appearing where a template argument list is being closed is treated as two distinct `>` tokens. Maximal munch survives; the standard carves out an exception for it.

**The lesson generalises well beyond C++.** The lexer/parser split buys linear-time scanning at the cost of the lexer knowing nothing about context. Most of the time that trade is free. Occasionally a language's syntax genuinely needs context to tokenize correctly — C's `A * B;` (a declaration if `A` is a typedef'd type, a multiplication otherwise, and the lexer cannot know which) is the other classic case, historically solved by the infamous "lexer hack" of feeding symbol-table information *backwards* from the parser into the lexer. When you meet an oddly-specific rule in a language standard, it's often a scar from exactly this collision.

## Section Challenge

<details>
<summary><strong>Q1.</strong> Your lexer has rules for <code>NUMBER</code> (<code>\d+</code>), <code>DOT</code> (<code>\.</code>), and <code>FLOAT</code> (<code>\d+\.\d+</code>). Trace what maximal munch produces for <code>3.14</code> and for <code>x.y</code>. Then explain what happens to the range expression <code>1..5</code> (as in Rust or Kotlin), and what rule you'd need to add.</summary>

**`3.14`** — at position 0, `NUMBER` matches `3` (1 char) and `FLOAT` matches `3.14` (4 chars). Maximal munch takes the longest: a single `FLOAT('3.14')`. Correct.

**`x.y`** — at position 0 only `ID` matches (`x`). Then at position 1, `FLOAT` doesn't match (no leading digit), `NUMBER` doesn't match, `DOT` matches `.`. Then `ID` matches `y`. Result: `ID(x) DOT(.) ID(y)` — correct, this is member access.

**`1..5`** — here it goes wrong. At position 0: `NUMBER` matches `1`; `FLOAT` tries `\d+\.\d+` and fails, because after `1.` the next character is another `.`, not a digit. So maximal munch takes `NUMBER('1')`. Then at position 1, `DOT` matches, and again at position 2 — giving `NUMBER(1) DOT(.) DOT(.) NUMBER(5)`.

That's *survivable* but wrong in spirit: the parser now has to recognise two adjacent `DOT` tokens as a range operator, which means grammatical meaning is being reassembled from fragments the lexer should have delivered whole. The fix is a `DOTDOT` rule matching `\.\.`, and maximal munch then prefers it over two single `DOT`s automatically — the same mechanism that gets `>=` right in §1.5, with no ordering care required.

Note what almost bit here: had `FLOAT` been written more loosely as `\d+\.\d*` (allowing `1.` with no trailing digits), maximal munch would have greedily taken `FLOAT('1.')` and left `.5`, producing `FLOAT(1.) DOT(.) NUMBER(5)` — a much more confusing failure. Maximal munch amplifies whatever your patterns actually say, including the parts you didn't mean.
</details>

<details>
<summary><strong>Q2.</strong> §1.6 said keywords should be matched as identifiers and then re-classified by table lookup, rather than given their own patterns. A colleague objects: "Just put the keyword rules before the <code>ID</code> rule — maximal munch will sort it out." Are they right? What exactly are they relying on, and why is it a bad thing to rely on?</summary>

They're *accidentally* right about the outcome and wrong about the reasoning, which is the dangerous combination.

Maximal munch does save the `letter` case: `ID` matches 6 characters, `KW_LET` matches 3, longest wins, `letter` stays an identifier. So the immediate bug doesn't appear.

What they're relying on is the coincidence that **every identifier which has a keyword as a prefix is longer than that keyword**. That's true here — but it means correctness rests on a length comparison rather than on any actual rule about what a keyword *is*. The design has no component that says "a keyword is an identifier that happens to be reserved"; it just happens to fall out.

Concrete costs: every keyword becomes another regex the scanner attempts at every position (in a real language, 30-50 more patterns per character — the classification is now doing pattern-matching work a hash lookup does in O(1)). And an exact-length collision now becomes a silent correctness bug rather than an impossibility, since the tie-break between two equal-length matches falls back to rule order — the fragile property §1.5 was specifically trying to eliminate.

The table-lookup design has none of this: one `ID` pattern, one set membership test, and adding a keyword is a one-line change that cannot affect how any other token is scanned.
</details>

<details>
<summary><strong>Q3.</strong> The lexer turns <code>if (count >= 10) { print("hi"); }</code> into a flat list of 13 tokens. But the braces and parentheses obviously nest. Why can't the lexer produce that nested structure itself — and what does that tell you about what the next stage must be able to do that this one can't?</summary>

Because nesting requires **counting**, and a lexer provably cannot count.

The lexer is a finite automaton: fixed memory, one pass, no stack (§1.3). To know that a given `}` closes the block opened by a particular `{`, you must track how many `{` are currently unclosed — and that count is unbounded, since a program can nest arbitrarily deep. A machine with finitely many states cannot distinguish "3 unclosed braces" from "4 unclosed braces" indefinitely. This is exactly the classic non-regular language `{aⁿbⁿ}`, and [CSE303 Ch04's pumping lemma](../../S03/CSE303_Theory_Of_Computation/04_Pumping_Lemma.md) is the formal proof.

So the flatness of the token stream isn't a limitation of a lazy implementation — it's the precise boundary of what regular languages can express, which is why staying inside that boundary bought linear-time scanning in the first place.

The next stage therefore needs strictly more power: a **context-free grammar** and a machine with a **stack** to match nested constructs (a pushdown automaton, [CSE303 Ch06](../../S03/CSE303_Theory_Of_Computation/06_Pushdown_Automata.md)). That's the parser — and the structure it builds is a *tree*, not a list, because trees are how nesting is represented. Chapter 2 builds one.
</details>

## Chapter Summary

| Concept | One-line takeaway |
|---|---|
| Whitespace splitting | Fails four ways at once, and returns `x=1+2` as a single token — whitespace is a readability hint, not the language's structure |
| Token | A (type, lexeme) pair — the type is what the grammar is written over, the lexeme is data later stages need |
| Why regular expressions | Token structure is flat, never nested, so it fits inside regular languages — which buys a DFA: one pass, constant memory, linear time |
| The lexer/parser split | Not a convention — it's the Chomsky hierarchy appearing in the compiler pipeline; nesting needs a stack, so it belongs to the parser |
| Scanning loop | Match a rule at the current position, emit a token, advance by the match length, repeat |
| Maximal munch | Longest match wins. First-match shatters `>=` into `GT ASSIGN` and `==` into two `ASSIGN`s (verified). Longest-match is order-independent; first-match makes correctness depend on rule arrangement |
| Keywords | Lexically identical to identifiers — match as `ID`, then re-classify by set lookup. Separates boundary-finding from meaning-assignment |
| Errors | The lexer sees the source first and knows exact offsets, so it gives the most precise positions; recovery means skip and continue, not abort |
| When it breaks | Maximal munch is what made C++03 reject `vector<vector<int>>` — `>>` lexed as right-shift. Fixed by special-casing the grammar (N1757). The lexer's context-blindness is the price of its speed |

## Where We Go Next

This chapter turned a character stream into a flat, labelled token stream — and Q3 established exactly why it has to stay flat: recognising nested structure requires a stack the lexer doesn't have. But `if (count >= 10) { ... }` is unmistakably nested, and a list of 13 tokens says nothing about which brace closes which block or that the condition belongs to the `if`. Chapter 2 adds the missing power: a context-free grammar to describe the nesting, and recursive descent — a parsing technique where the call stack of your own parser functions *is* the stack the automaton needs.

*Next: [02_Recursive_Descent_LL_Parsing.md](02_Recursive_Descent_LL_Parsing.md)*
