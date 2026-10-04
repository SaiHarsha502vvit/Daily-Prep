# CSE701 — Compilers & Language Processing

**Estimated time:** ~25h  
**Prerequisite:** S03 (OOP & Design Patterns), S06 (JVM Internals for backend integration)

## Description

A hands-on compiler construction course covering the full pipeline from source text to executable code. Topics include lexical analysis, parsing (recursive descent and LR), semantic analysis, type checking, intermediate representations, and code generation. Students build a fully functional compiler for a small imperative language in the tradition of compiler praktikum courses at TU Munich and KTH.

## Learning Outcomes

1. Implement a lexer and parser for a context-free grammar using lexer/parser generators and hand-written recursive descent
2. Build and traverse Abstract Syntax Trees (ASTs) with visitor and interpreter patterns
3. Perform semantic analysis: symbol table construction, type checking, and scope resolution
4. Generate intermediate representation (3-address code) and emit target code (JVM bytecode or x86-64)
5. Understand optimization passes: constant folding, dead code elimination, register allocation

## Syllabus Outline

| Week | Topic                                                                                 |
| ---- | ------------------------------------------------------------------------------------- |
| 1    | Language theory review: regular languages, context-free grammars, Chomsky hierarchy   |
| 2    | Lexical analysis: token streams, regex-based lexers, handling ambiguity and errors    |
| 3    | Parsing: recursive descent, LL(k), predictive parsing tables                          |
| 4    | Bottom-up parsing: LR(0), SLR, LALR parsers and conflict resolution                   |
| 5    | AST construction and visitor pattern for tree traversal                               |
| 6    | Semantic analysis: symbol tables, scope chains, type systems                          |
| 7    | Type checking: static typing, subtype rules, type inference (Hindley-Milner intro)    |
| 8    | Intermediate representation: 3-address code, control flow graphs                      |
| 9    | Code generation: register allocation (graph coloring), JVM bytecode emission          |
| 10   | Optimization: constant propagation, dead code elimination, loop invariant code motion |
| 11   | Advanced topics: SSA form, dataflow analysis, Just-In-Time compilation basics         |
| 12   | Capstone: complete compiler with code generation targeting a real virtual machine     |

## Chapters

| # | Chapter |
|---|---------|
| [01](01_Lexical_Analysis_Tokens_And_Scanning.md) | Lexical Analysis: Tokens & Scanning |
| [02](02_Recursive_Descent_LL_Parsing.md) | Recursive Descent & LL Parsing |
| [03](03_Bottom_Up_LR_Parsing.md) | Bottom-Up LR Parsing |
| [04](04_AST_And_Visitor_Pattern.md) | The AST & the Visitor Pattern |
| [05](05_Semantic_Analysis_Symbol_Tables.md) | Semantic Analysis & Symbol Tables |
| [06](06_Type_Checking_And_Inference.md) | Type Checking & Inference |
| [07](07_Intermediate_Representation_CFG.md) | Intermediate Representation: Three-Address Code & the CFG |
| [08](08_Code_Generation_Register_Allocation.md) | Code Generation & Register Allocation |
| [09](09_Optimization_Dataflow_Passes.md) | Optimization & Dataflow Passes |
| [10](10_SSA_Form_And_JIT_Compilation.md) | SSA Form & JIT Compilation |

## Assessment

- Weekly compiler pass implementations (lexer → parser → type checker → codegen)
- End-to-end compiler project with working code generation
- 3-hour practical exam (trace a compilation pipeline, fix semantic errors)
