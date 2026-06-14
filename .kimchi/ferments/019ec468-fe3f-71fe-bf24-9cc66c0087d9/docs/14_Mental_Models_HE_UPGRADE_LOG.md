# 14 Mental Models — Historical Evolution Upgrade Log

Documents all Historical Evolution (HE) subsections added during the Combined Lens pedagogy upgrade. Each entry records named predecessors with years and a brief evolution narrative.

---

## 14_Mental_Models/00_INDEX.md

### Predecessors added
- Polya, 1945 (How to Solve It — problem-solving heuristics)
- Lakoff, 1980 (Women, Fire, and Dangerous Things — conceptual metaphor theory)
- Hofstadter, 1979 (Gödel, Escher, Bach — mental models and self-reference)
- Gardner, 1983 (Frames of Mind — multiple intelligences)
- Marr, 1982 (Vision — computational theory of mind)

### Evolution narrative
The concept of "mental models" as deliberate learning tools emerged from a cross-disciplinary synthesis. Polya's problem-solving heuristics provided the pedagogical foundation; Lakoff and Hofstadter supplied the cognitive-linguistic mechanism of metaphorical structure; Gardner broadened the frame beyond purely logical intelligence; Marr gave it computational form.

---

## 14_Mental_Models/01_Recursion_Tree_Thinking.md

### Predecessors added
- McCarthy, 1958 (Lisp recursion — first recursive programming language)
- Ackermann, 1928 (Ackermann function — primitive recursion vs. full recursion)
- Polya, 1945 (How to Solve It — recursive problem decomposition)
- Dijkstra, 1960 (Recursive Programming — structural recursion proof rules)

### Evolution narrative
Recursion entered computer science through Lisp's functional foundation, building on Ackermann's theoretical boundary between computable and primitive-recursive functions. Dijkstra later formalized structural recursion as a provable design method, bridging the gap between mathematical induction and practical programming.

---

## 14_Mental_Models/02_DP_State_Thinking.md

### Predecessors added
- Bellman, 1954/1957 (Dynamic Programming — optimal substructure + overlapping subproblems)
- Dijkstra, 1959 (shortest-path as DP precursor)
- Floyd, 1962 (all-pairs shortest paths)
- Warshall, 1962 (transitive closure DP)
- Viterbi, 1967 (Viterbi algorithm for hidden Markov models)

### Evolution narrative
Bellman coined "dynamic programming" at RAND to sidestep Eisenhower's budget politics, but the technique unified earlier shortest-path work by Dijkstra. Floyd extended it to all-pairs, Warshall to boolean matrices, and Viterbi applied it to probabilistic sequence decoding — each broadening the state-space metaphor.

---

## 14_Mental_Models/03_Graph_Tree_Thinking.md

### Predecessors added
- Euler, 1736 (Seven Bridges of Königsberg — graph theory birth)
- Tarjan, 1972 (depth-first search and lowlink)
- Hopcroft-Karp, 1973 (bipartite matching in O(E√V))
- Dijkstra, 1959 (single-source shortest paths)
- Hopcroft-Tarjan, 1974 (planarity testing in linear time)

### Evolution narrative
Euler's abstract graph representation transformed a recreational puzzle into a mathematical discipline. Two centuries later, Tarjan's DFS with lowlink values provided the algorithmic backbone for connectivity, while Hopcroft-Karp and Hopcroft-Tarjan pushed graph algorithms toward near-linear time for planar graphs.

---

## 14_Mental_Models/04_Array_String_Thinking.md

### Predecessors added
- Boyer-Moore, 1977 (Boyer-Moore string search)
- KMP, 1977 (Knuth-Morris-Pratt pattern matching)
- Rabin-Karp, 1987 (rolling hash string search)
- Knuth, 1973 (Vol 3 of The Art of Computer Programming — sorting and search)

### Evolution narrative
String algorithms matured through the 1970s with Boyer-Moore's counterintuitive backwards scan, KMP's linear-time guarantee via prefix-function, and Knuth's systematic classification in TAOCP Vol 3. Rabin-Karp added a probabilistic dimension with rolling hashes, enabling multi-pattern search.

---

## 14_Mental_Models/05_Universal_Problem_Framework.md

### Predecessors added
- Polya, 1945 (How to Solve It — problem decomposition stages)
- Newell-Shaw-Simon, 1955-59 (GPS — first AI problem solver)
- Simon, 1969 (Sciences of the Artificial — bounded rationality)

### Evolution narrative
Polya's four-stage method was the first systematic pedagogy for problem-solving. Newell, Shaw, and Simon implemented it mechanically in GPS, demonstrating that heuristic search could mimic human reasoning. Simon's bounded rationality theory later explained why this framework generalizes: human (and machine) problem-solving is fundamentally constrained optimization.

---

## 14_Mental_Models/06_Implementation_Checklist.md

### Predecessors added
- Hoare, 1969 (Hoare logic — program verification)
- Dijkstra-Dahl-Hoare, 1972 (Structured Programming — program correctness)
- Kernighan-Plauger, 1974 (The Elements of Programming Style)
- Knuth, 1968 (Vol 1 of TAOCP — algorithm analysis)
- McConnell, 1993 (Code Complete — empirical software construction)

### Evolution narrative
Hoare logic introduced formal pre/post-condition reasoning about program correctness, which Dijkstra extended to structured programming's discipline of single-entry/single-exit blocks. Kernighan and Plauger injected an empirical, readability-focused counterpoint, while McConnell synthesized both into the modern implementation checklist as practiced in industry.

---

## 14_Mental_Models/07_SQL_Mental_Pipeline.md

### Predecessors added
- Codd, 1970 (relational model — set-theory foundation of SQL)
- Chamberlin-Boyce, 1974 (SEQUEL — SQL language design)
- System R, 1974-79 (first SQL implementation and optimization research)
- Stonebraker, 1974 (INGRES — competing relational system)
- Codd, 1985 (OLTP vs OLAP distinction)

### Evolution narrative
Codd's relational model gave SQL its mathematical foundation in set theory. Chamberlin and Boyce's SEQUEL was the first practical query language, implemented concurrently in System R and INGRES — whose competition drove rapid optimizer innovation. Codd's later OLTP/OLAP distinction refined the mental pipeline into distinct execution stages.

---

## 14_Mental_Models/08_Debugging_DryRun.md

### Predecessors added
- Dijkstra, 1975/1988 (structured debugging, "program testing can only reveal the presence of bugs, not their absence")
- Penrose, 1989 (debugging as mathematical reasoning about computation)
- Zeller, 2009 (causal debugging — delta debugging)
- Kernighan-Plauger, 1974 (debugging as communication failure)

### Evolution narrative
Dijkstra's provable-correctness paradigm shifted debugging from reactive to proactive. Penrose framed it as mathematical reasoning, while Zeller automated the isolation of failure-inducing changes via delta debugging. Kernighan and Plauger added the pragmatic insight that debugging is fundamentally about understanding the programmer's intent vs. the machine's behavior.

---

## 14_Mental_Models/09_Complexity_Intuition.md

### Predecessors added
- Hartmanis-Stearns, 1965 (time hierarchy theorem — formal complexity)
- Cook, 1971 (NP-completeness — SAT as canonical hard problem)
- Karp, 1972 (21 NP-complete problems — complexity theory explosion)
- Blum-Shub-Smale, 1989 (real-number complexity model)

### Evolution narrative
Hartmanis and Stearns gave complexity theory its formal hierarchy. Cook's NP-completeness theorem and Karp's 21 reductions then showed that hundreds of practical problems were all equally hard, transforming the field from theoretical curiosity to practical necessity. Blum-Shub-Smale extended the model to continuous computation.

---

## 14_Mental_Models/10_Interview_Thinking.md

### Predecessors added
- Brooks, 1975 (The Mythical Man-Month — staffing and estimation)
- McDowell, 2008 (Cracking the Coding Interview — systematic interview prep)

### Evolution narrative
Brooks established the fundamental tension between staffing and schedule in software projects — an insight that directly maps to interview time management and candidate preparation. McDowell's systematic approach to interview preparation democratized access to technical hiring at scale, codifying the 45-minute structure now standard across the industry.

---

## 14_Mental_Models/11_Greedy_vs_DP_Decision.md

### Predecessors added
- Huffman, 1952 (optimal prefix code — greedy proof)
- Kruskal, 1956 (MST via greedy edge selection)
- Prim, 1957 (MST via growing connected component)
- Dijkstra, 1959 (shortest paths — greedy with no backtracking)
- Bellman, 1954 (DP — optimal substructure with backtracking)

### Evolution narrative
Greedy algorithms were discovered independently in coding theory (Huffman), graph theory (Kruskal, Prim), and shortest paths (Dijkstra) before Bellman's DP framework provided the contrasting "exhaustive search with memoization" paradigm. The greedy/DP boundary became a central decision point in algorithm design once these foundational works were synthesized.

---

## 14_Mental_Models/12_Space_Time_Tradeoffs.md

### Predecessors added
- Bloom, 1970 (Bloom filter — probabilistic space tradeoff)
- KMP, 1977 (Knuth-Morris-Pratt — preprocessing for speed)
- Rabin-Karp, 1987 (rolling hash — space for deterministic speed)
- Yao, 1981 (Xb Y — lower bound for comparison-based sorting)

### Evolution narrative
The space-time tradeoff was formalized as an algorithmic design principle through string search: KMP trades preprocessing space for fast matching; Bloom filters trade probabilistic accuracy for massive space reduction; Yao's lower bounds established the theoretical floor below which no algorithm can go.

---

## 14_Mental_Models/13_Pattern_Composition.md

### Predecessors added
- Alexander, 1977 (A Pattern Language — architectural patterns)
- Gamma, 1994 (Design Patterns — Gang of Four catalog)
- Fowler, 1999 (enterprise integration patterns)
- Bellman, 1957 (optimal substructure in DP)
- Knuth, 1968-73 (Vol 1-3 of TAOCP — pattern taxonomy)

### Evolution narrative
Alexander's pattern language introduced the idea that reusable structural solutions have characteristic problem contexts. Gamma et al. cataloged software-specific patterns; Fowler extended them to distributed systems. Bellman and Knuth provided the algorithmic substrate — optimal substructure and stable pattern decompositions — that makes composition principled rather than ad hoc.

---

## 14_Mental_Models/14_Optimization_Pipeline.md

### Predecessors added
- Aho-Hopcroft-Ullman, 1974 (The Design and Analysis of Computer Algorithms — optimization principles)
- Bentley, 1982 (Writing Efficient Programs — empirical optimization)
- Bentley, 2000 (Programming Pearls — optimization case studies)
- Knuth, 1973 (Vol 3 — sorting lower bounds and optimization)
- Press, 1988 (Numerical Recipes — numerical optimization techniques)

### Evolution narrative
Aho, Hopcroft, and Ullman established the theoretical foundations of algorithm optimization — what cannot be improved. Bentley brought empirical measurement-driven optimization to programming practice, showing that intuition about performance is often wrong. Knuth's sorting lower bounds and Press's numerical techniques gave concrete upper bounds on achievable gains.

---

## 14_Mental_Models/15_System_Design_Thinking.md

### Predecessors added
- Lampson, 1983 (Hints for Computer System Design — practical design principles)
- Brewer, 2000 (CAP conjecture — consistency/availability tradeoff)
- Gilbert-Lynch, 2002 (CAP proof — formalization)
- Vogels, 2008 (Amazon's Dynamo — eventual consistency at scale)

### Evolution narrative
Lampson's hints captured practical distributed system design wisdom before CAP was formalized. Brewer's conjecture and Gilbert-Lynch's proof gave it theoretical standing, while Vogels's Dynamo paper demonstrated that eventual consistency was a viable production choice — not just a compromise.

---

## 14_Mental_Models/16_Distributed_Systems_Thinking.md

### Predecessors added
- Lamport, 1978 (time, clocks, and ordering of events in distributed systems)
- Paxos, 1998/2001 (Lamport — consensus algorithm)
- FLP, 1985 (impossibility of asynchronous consensus with one fault)
- Vogels, 2008 (eventual consistency semantics)
- Deutsch, 1994 (8 fallacies of distributed computing)

### Evolution narrative
Lamport's logical clocks and Paxos algorithm established the theoretical and practical bedrock of distributed consensus. The FLP impossibility result defined the boundary of what is achievable, while Vogels's Dynamo and Deutsch's fallacies provided the production failures that shaped modern practice.

---

## 14_Mental_Models/17_Frontend_Architecture_Thinking.md

### Predecessors added
- MVC, 1979 (Trygve Reenskaug — Model-View-Controller)
- RAII, 1985 (Bjarne Stroustrup — resource management in C++)
- React, 2013 (component-based UI with virtual DOM)
- Flux, 2014 (unidirectional data flow)
- Redux, 2015 (predictable state container)
- Hooks, 2019 (function-component state composition)

### Evolution narrative
MVC established the separation of concerns paradigm in UI programming. React's virtual DOM and Flux's unidirectional flow resolved the cascade-update problem that plagued MVC in frontend contexts. Redux's centralized store brought predictability, and Hooks unified state and lifecycle into composable function units.

---

## 14_Mental_Models/18_Production_Debugging_Thinking.md

### Predecessors added
- Brooks, 1975 (The Mythical Man-Month — software crisis and debugging)
- Kernighan-Pike, 1999 (UNIX programming — empirical debugging)
- Zeller, 2009 (causal debugging — delta debugging)
- SRE, 2016 (Site Reliability Engineering — production operations)
- Sridharan, 2017 (tracing infrastructure at scale)
- Dapper, 2010 (distributed tracing — Google)

### Evolution narrative
Brooks identified debugging as the dominant cost in software projects. The SRE discipline transformed debugging from an art into an engineering discipline with explicit SLOs and error budgets. Dapper's distributed tracing and Sridharan's inference techniques automated what was previously manual root-cause analysis.

---

## 14_Mental_Models/20_Pattern_Trigger_Guide.md

### Predecessors added
- Alexander, 1977 (A Pattern Language — pattern as problem-solution pair)
- Polya, 1945 (How to Solve It — problem recognition)
- Gamma, 1994 (Design Patterns — trigger conditions)
- Lakoff, 1980 (conceptual metaphor — signal → pattern mapping)
- McConnell, 2004 (Code Complete — pattern applicability)

### Evolution narrative
Alexander's pattern language established the problem-solution pairing that makes triggers meaningful. Polya's problem-recognition framework maps directly onto signal identification. Gamma cataloged specific trigger conditions for each pattern, while Lakoff's cognitive metaphor theory explains why certain input signals reliably invoke certain pattern responses.

---

## 14_Mental_Models/21_Competitive_Coding_Deep_Thinking.md

### Predecessors added
- ACM-ICPC, 1970/1977 (programming contest origins)
- Knuth, 1968-73 (TAOCP — algorithmic foundations for contests)
- Bentley, 1986 (Programming Pearls — contest-style problem solving)
- Halim, 2010/2013 (Competitive Programming 3/4 — modern contest tactics)
- Sedgewick, 1983/2011 (Algorithms — algorithm implementation)
- McCloskey, 1955 (cognitive chunking in problem-solving)

### Evolution narrative
ACM-ICPC formalized competitive programming as a discipline. Knuth's TAOCP provided the algorithmic toolkit; Bentley's columns applied it to contest contexts. Halim's handbook synthesized modern contest-specific tactics — faster I/O, faster hash maps, custom data structures — that are not found in academic algorithm courses.

---

## 14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md

### Predecessors added
- Horowitz-Sahni, 1978 (Fundamentals of Computer Algorithms — brute-force taxonomy)
- Aho-Hopcroft-Uullman, 1974 (algorithm design primitives)
- Bentley, 1986 (Programming Pearls — optimization case studies)
- Skiena, 1998 (The Algorithm Design Manual — bottleneck analysis)
- Manber, 1989 (Introduction to Algorithms — approximation via brute force)

### Evolution narrative
Horowitz and Sahni formalized brute-force as a legitimate first step in algorithm design, establishing it as a baseline to improve rather than avoid. Bentley's empirical approach showed that bottleneck identification — not algorithm sophistication — drives real optimization. Skiena and Manber extended this to approximation and heuristic methods.