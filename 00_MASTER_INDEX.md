# MASTER INDEX — Complete DSA, SQL, Spring Boot & Career Preparation

**Last Updated: March 2026 | 216 files | 13 folders**

---

## Quick Links

| Action | Link |
|--------|------|
| **Start Today's Practice** | [12_Daily_Practice/00_DAILY_PRACTICE_INDEX.md](12_Daily_Practice/00_DAILY_PRACTICE_INDEX.md) |
| Textbook Reading Order | [00_TEXTBOOK_PREFACE.md](00_TEXTBOOK_PREFACE.md) |
| 76-Day Study Calendar | [01_Getting_Started/02_Study_Plan_Calendar.md](01_Getting_Started/02_Study_Plan_Calendar.md) |
| DSA Guide (Foundations) | [09_Career_Reference/02a_DSA_Guide_Foundations.md](09_Career_Reference/02a_DSA_Guide_Foundations.md) |
| Practice Problems (14 chapters) | [05_Problem_Solving/](#practice--problem-solving) |
| SQL from Zero (21 chapters) | [08_SQL/](#sql-21-chapters) |
| Spring Boot (35+ chapters + 50-Day Plan) | [07_Modern_Java/](#modern-java--spring-boot) |
| Developer Essentials (10 guides) | [13_Developer_Essentials/](#developer-essentials-new) |
| **Mental Models — HOW TO THINK (13 guides)** | [14_Mental_Models/](#mental-models--how-to-think-new) |
| Quick Reference Sheet | [09_Career_Reference/03_Quick_Reference.md](09_Career_Reference/03_Quick_Reference.md) |

---

## Folder Structure

```
Daily-Prep/
│
├── 00_MASTER_INDEX.md                   ← YOU ARE HERE
├── 00_TEXTBOOK_PREFACE.md              → Reading order & prerequisites graph
│
├── 01_Getting_Started/                  (1 file)
│   └── 02_Study_Plan_Calendar.md        → 76-Day Plan (Feb 19 – May 5, 2026)
│
├── 02_Data_Structures/                  (11 chapter files)
│   ├── 01a_Memory_Foundations.md        → Memory model, stack vs heap, pointers
│   ├── 01b_Arrays.md                   → Array internals, operations, time complexity
│   ├── 01c_LinkedList.md               → Singly/Doubly/Circular linked lists
│   ├── 01d_Stack_Queue.md              → Stack, Queue, Deque operations
│   ├── 01e_HashTable.md                → Hashing, collision handling, load factor
│   ├── 01f_Trees_Heaps.md              → Binary trees, BST, heaps intro
│   ├── 01g_DS_Internals.md             → Java internals: ArrayList, HashMap, TreeMap
│   ├── 02a_DS_Variants_Core.md         → Advanced LL, Stack, Queue variants
│   ├── 02b_DS_Variants_Advanced.md     → Priority queues, graph representations
│   ├── 03_Collections_Java.md          → Java Collections Framework
│   └── 04_2D_Arrays_Matrix.md          → Matrix traversal, rotation, spiral
│
├── 03_Algorithms/                       (26 chapter files)
│   ├── 01_Algorithm_Thinking.md         → Problem-solving mindset & Big O
│   ├── 02a_Sorting_Fundamentals.md      → Bubble, Selection, Insertion, Merge Sort
│   ├── 02b_Sorting_Advanced.md          → Quick, Heap, Counting, Radix, Binary Search
│   ├── 03a_Recursion_Internals.md       → Call stack, stack frames, memory model
│   ├── 03b_Recursion_Fundamentals.md    → Base cases, patterns, classic problems
│   ├── 03c_Recursion_Advanced.md        → Backtracking, memoization, tree recursion
│   ├── 04a_DP_Internals.md             → Overlapping subproblems, optimal substructure
│   ├── 04b_DP_Fundamentals.md          → 1D DP, Fibonacci, climbing stairs, house robber
│   ├── 04c_DP_Advanced.md              → 2D DP, knapsack, LCS, LIS, matrix chain
│   ├── 05_Trees.md                      → Binary Trees, BST, traversals (BFS/DFS)
│   ├── 05b_Graphs_Internals.md         → Graph representations, adjacency list/matrix
│   ├── 05c_Graphs_Fundamentals.md      → BFS, DFS, topological sort, connected components
│   ├── 05d_Graphs_Advanced_Algos.md    → Dijkstra, Bellman-Ford, Floyd-Warshall, Kruskal, Prim
│   ├── 05e_Graphs_Patterns.md          → Bipartite, cycle detection, Euler/Hamilton paths
│   ├── 06a_Greedy_BitManip.md          → Greedy algorithms + bit manipulation foundations
│   ├── 06c_Advanced_Algo_Deep.md       → Divide & conquer, advanced DP techniques
│   ├── 06d_String_Algorithms.md        → KMP, Rabin-Karp, Z-algorithm, suffix arrays
│   ├── 06e_Algorithm_Patterns.md       → Interview patterns, competitive programming tips
│   ├── 07a_Advanced_DS_Core.md         → Trie, Segment Tree, BIT (Fenwick)
│   ├── 07b_Advanced_DS_Patterns.md     → Advanced heap, LRU Cache, skip lists
│   ├── 08a_NumberTheory_Core.md        → GCD, LCM, primes, Sieve of Eratosthenes
│   ├── 08b_NumberTheory_Advanced.md    → Modular arithmetic, Euler's totient, CRT
│   ├── 09_Pattern_Programs_Complete.md  → 50+ star/number/character patterns
│   ├── 10_Bit_Manipulation_Complete.md  → XOR tricks, AND/OR masks, power of 2
│   ├── 11_Backtracking_Complete.md      → Permutations, subsets, N-Queens, Sudoku
│   ├── 12_Greedy_Algorithms_Complete.md → Activity selection, Huffman, jump game
│   ├── 13_String_Algorithms_Complete.md → Pattern matching, anagram, palindrome
│   ├── 14_Union_Find_DSU_Complete.md    → Disjoint Set Union, path compression, rank
│   └── 15_Monotonic_Stack_Queue_Complete.md → NGE, histogram, trapping rain water
│
├── 04_Patterns_Templates/              (23 files)
│   ├── 01_Sliding_Window.md             → Fixed & variable window techniques
│   ├── 02_Code_Templates.md            → Ready-to-use code templates
│   ├── 03_Visual_Diagrams.md           → Visual algorithm walkthroughs
│   ├── 04_Pattern_Recognition.md       → How to identify which pattern to use
│   ├── 05_LeetCode_RealWorld_Map.md    → Problems → real-world mapping
│   ├── 06_Binary_Search_Patterns.md    → All binary search variants
│   ├── 07_Two_Pointers_Complete.md     → Same/opposite direction pointers
│   ├── 08_Array_Plus_TwoPointers.md    → 🆕 Array + Two Pointer combined patterns
│   ├── 09_Array_Plus_SlidingWindow.md  → 🆕 Array + Sliding Window combined
│   ├── 10_HashMap_Plus_Counting.md     → 🆕 HashMap + Frequency/Grouping
│   ├── 11_Stack_Plus_MonotonicPattern.md → 🆕 Stack + Monotonic patterns
│   ├── 12_LinkedList_Plus_TwoPointers.md → 🆕 LinkedList + Fast/Slow pointers
│   ├── 13_Tree_Plus_DFS_BFS.md          → 🆕 Tree + DFS/BFS traversal (48 problems)
│   ├── 14_Graph_Plus_Traversal.md       → 🆕 Graph + BFS/DFS/Dijkstra (37 problems)
│   ├── 15_Heap_Plus_GreedySelection.md  → 🆕 Heap/PQ + Greedy/TopK selection
│   ├── 16_DP_Pattern_Recognition.md     → 🆕 DP 8 pattern families framework
│   ├── 17_Backtracking_Plus_Pruning.md  → 🆕 Backtracking + Pruning techniques
│   ├── 18_String_Plus_Advanced.md       → 🆕 String + HashMap/Window/DP/Trie
│   ├── 19_Matrix_Plus_Grid_Traversal.md → 🆕 2D Grid + BFS/DFS patterns
│   ├── 20_BitManipulation_Plus_Tricks.md → 🆕 Bit tricks, XOR, bitmask + Math/Search
│   ├── 21_Intervals_Pattern.md          → 🆕 Interval merge/insert/sweep line (7 solved)
│   ├── 22_Cyclic_Sort_Pattern.md        → 🆕 Cyclic sort for missing/duplicate (6 solved)
│   └── 23_Knapsack_Family.md            → 🆕 0/1, Unbounded, Bounded unification (6 solved)
│
├── 05_Problem_Solving/                  (23 files)
│   ├── 01_Problems_Intro_Checklist.md   → Problem-solving methodology
│   ├── 02_Problems_Math_Numbers.md      → Number theory problems
│   ├── 03_Problems_Strings.md           → String manipulation problems
│   ├── 04_Problems_Arrays.md            → Array problems
│   ├── 05_Problems_Sliding_Window.md    → Sliding window problems
│   ├── 06_Problems_Two_Pointers.md      → Two pointer problems
│   ├── 07_Problems_Binary_Search.md     → Binary search problems
│   ├── 08_Problems_Stack_Queue.md       → Stack & queue problems
│   ├── 09_Problems_Trees.md             → Tree problems
│   ├── 10_Problems_Graphs.md            → Graph problems
│   ├── 11_Problems_Dynamic_Programming.md → DP problems
│   ├── 12_Problems_Backtracking.md      → Backtracking problems
│   ├── 13_Problems_Greedy.md            → Greedy problems
│   ├── 14_Problems_Mixed_Competitive.md → Mixed competitive problems
│   ├── 02_Edge_Cases.md                 → Edge case handling guide
│   ├── 03_Common_Mistakes.md            → Common mistakes to avoid
│   └── 04_Problem_Origins.md            → Real-world problem origins
│
├── 06_OOP_Design/                       (4 files)
│   ├── 01_OOPS_Principles.md            → OOP concepts + SOLID
│   ├── 02_Design_Patterns.md            → GoF Design Patterns
│   ├── 03_System_Design.md              → System design basics
│   └── 04_User_System_Flows.md          → User flows & sequence diagrams
│
├── 07_Modern_Java/                      (36 chapter files)
│   ├── 00_SPRING_BOOT_ROADMAP.md        → Spring Boot learning path
│   ├── 01_Functional_Programming.md     → Streams, Lambdas, Optionals
│   ├── 02a_AlgoEng_Core.md             → Algorithm engineering fundamentals
│   ├── 02c_SB_HiddenFoundations_Part1.md → Servlet, IoC, DI pre-Spring
│   ├── 02d_SB_HiddenFoundations_Part2.md → AOP, proxy, BeanFactory deep dive
│   ├── 02e_AlgoEng_Advanced.md          → Advanced optimization techniques
│   ├── 03_Spring_Boot_Complete_Part1.md → Core Spring Boot
│   ├── 04_Spring_Boot_Complete_Part2.md → Data & Persistence
│   ├── 05_Spring_Boot_Complete_Part3.md → Web & REST APIs
│   ├── 06_Spring_Boot_Complete_Part4.md → Security & Auth
│   ├── 07_Spring_Boot_Part5_Lombok_DTOs.md → Lombok, DTOs, MapStruct
│   ├── 08_Spring_Boot_Part6_Service_Repository.md → Service & Repository layers
│   ├── 09_Spring_Boot_Part7_Controllers_REST.md → Controllers & REST design
│   ├── 10_Spring_Boot_Part8_JPA_Deep_Dive.md → JPA/Hibernate deep dive
│   ├── 11_Spring_Boot_Part9_Architecture_Quality.md → Architecture & code quality
│   ├── 12_Spring_Boot_Part10_HTTP_Deep_Dive.md → HTTP internals
│   ├── 13_Spring_Boot_Part11_Auth_Security.md → Auth & Spring Security
│   ├── 14_Spring_Boot_Part12_DSA_Applications.md → DSA in backend
│   ├── 15_Spring_Boot_Part13_Industry_Projects.md → Industry project patterns
│   ├── 16a_SB_Missing_Core.md           → Caching, scheduling, profiles
│   ├── 16b_SB_Missing_Advanced.md       → Actuator, metrics, health checks
│   ├── 17a_SB_WebFlux_Core.md           → Reactive programming basics
│   ├── 17b_SB_WebFlux_Advanced.md       → WebFlux patterns, R2DBC
│   ├── 18a_SB_SOLID_Core.md             → SOLID principles in Spring
│   ├── 18b_SB_SOLID_Advanced.md         → Advanced SOLID patterns
│   ├── 19a_SB_Database.md               → Database design in Spring
│   ├── 19b_SB_Security.md               → Security deep dive
│   ├── 20_Spring_Boot_Part18_Distributed_Tracing.md → Tracing & observability
│   ├── 21a_SB_Testing_Fundamentals.md   → Unit testing, Mockito
│   ├── 21b_SB_Testing_Advanced.md       → Integration testing, TestContainers
│   ├── 22a_SB_Microservices_Core.md     → Microservices architecture
│   ├── 22b_SB_Microservices_Patterns.md → Saga, CQRS, circuit breaker
│   ├── 23a_SB_Cloud_Core.md             → Cloud deployment basics
│   ├── 23b_SB_Cloud_Advanced.md         → Kubernetes, service mesh
│   ├── 24a_SB_Annotations_Core.md       → Essential Spring annotations
│   ├── 24b_SB_Annotations_Advanced.md   → Custom annotations, meta-annotations
│   ├── 25_Spring_Boot_Part23_Missing_Essential_Topics.md → WebSocket, GraphQL, gRPC, Batch
│   └── 26_Spring_Boot_Curriculum_50Day.md → 50-Day Spring Boot Study Plan
│
├── 08_SQL/                              (21 chapter files — zero to expert)
│   ├── 01_Foundations_Database_Basics.md → What is a database, RDBMS, SQL
│   ├── 02_DataTypes_Constraints.md      → INT, VARCHAR, DECIMAL, NOT NULL
│   ├── 03_DDL_Creating_Structure.md     → CREATE, ALTER, DROP, TRUNCATE
│   ├── 04_DML_Manipulating_Data.md      → INSERT, UPDATE, DELETE
│   ├── 05_Queries_SELECT_WHERE.md       → SELECT, WHERE, ORDER BY, LIMIT
│   ├── 06_Aggregations_GroupBy.md       → COUNT, SUM, AVG, GROUP BY, HAVING
│   ├── 07_JOINs_Complete.md             → INNER, LEFT, RIGHT, FULL, CROSS
│   ├── 08_Subqueries_CTEs.md            → Subqueries, WITH, recursive CTE
│   ├── 09_Window_Functions.md           → ROW_NUMBER, RANK, LAG, LEAD
│   ├── 10_Normalization.md              → 1NF–BCNF, denormalization
│   ├── 11_Indexes_Performance.md        → B-Tree, Hash, composite indexes
│   ├── 12_Views_StoredProcs_Triggers.md → Views, procedures, functions
│   ├── 13_Transactions_ACID.md          → ACID, isolation levels, deadlocks
│   ├── 14_Query_Optimization.md         → EXPLAIN, query plans, tuning
│   ├── 15_Analytics_Warehousing_ETL.md  → OLAP, star/snowflake, ETL
│   ├── 16_RealWorld_CaseStudies.md      → Production disasters & lessons
│   ├── 17_Practice_100_Problems.md      → 100 practice problems
│   ├── 18a_SQL_Projects_Beginner.md     → Beginner mini projects
│   ├── 18b_SQL_Projects_Advanced.md     → Advanced projects
│   ├── 19_Interview_Top50.md            → Top 50 interview questions
│   └── 20_CheatSheet_QuickRef.md        → Syntax quick reference
│
├── 09_Career_Reference/                 (14 chapter files)
│   ├── 01_Career_TechnoFunctional.md    → Framework, skills, domains
│   ├── 01b_Career_Guide_Part1A.md       → Career roadmap & skills matrix
│   ├── 01b2_Career_Guide_Part1B.md      → Interview prep & salary guide
│   ├── 01c_Career_Projects_Part1.md     → Project phases 1–4
│   ├── 01d_Career_Projects_Part2.md     → Project phases 5–7
│   ├── 01e_Career_Projects_Part3.md     → Project phases 8–10 + OS/Docker
│   ├── 02a_DSA_Guide_Foundations.md     → DSA learning path + data structures
│   ├── 02b_DSA_Guide_Advanced.md        → Advanced algorithms & patterns
│   ├── 02b_Ultimate_DSA_Advanced.md     → String/Randomized algos, patterns
│   ├── 02c_Ultimate_DSA_JVM.md          → JVM Architecture, GC, JIT, tuning
│   ├── 03_Quick_Reference.md            → Quick revision sheet
│   ├── 04_Brain_Psychology.md           → Learning psychology & memory
│   ├── 05_Daily_Habits_Tracking.md      → Habit tracking system
│   └── 06_Resources_Links.md            → External resources & links
│
├── 10_Enterprise_Systems/               (8 chapter files)
│   ├── 01a_ERP_Fundamentals.md          → ERP concepts, modules, architecture
│   ├── 01b_ERP_Advanced.md              → Integration, customization, cloud
│   ├── 02a_ERP_Finance_Core.md          → GL, AP, AR, fixed assets
│   ├── 02b_ERP_Finance_RealWorld.md     → Finance optimization, reconciliation
│   ├── 03_RealWorld_Problems_DSA.md     → Part 1: E-commerce, Banking
│   ├── 04_RealWorld_Problems_Part2.md   → Part 2: Streaming, Healthcare
│   ├── 05_RealWorld_Problems_Part3.md   → Part 3: Payments, Search
│   └── 06_RealWorld_Incidents_DSA.md    → Production disasters & DSA lessons
│
├── 12_Daily_Practice/                   (29 files — index + 28 days)
│   ├── 00_DAILY_PRACTICE_INDEX.md       → Master daily practice navigation
│   ├── Week_01/ (Days 001–007)          → Mar 3–9: Arrays, Sorting, Strings
│   ├── Week_02/ (Days 008–014)          → Mar 10–16: LinkedList, Stack, HashMap
│   ├── Week_03/ (Days 015–021)          → Mar 17–23: Trees, BST, Heap, DFS/BFS
│   └── Week_04/ (Days 022–028)          → Mar 24–30: Graphs, DP, Advanced SQL
│
├── 13_Developer_Essentials/             (11 files — NEW!)
│   ├── 00_INDEX.md                      → Reading order & career phase mapping
│   ├── 01_Git_Version_Control.md        → 3 areas, branching, merge conflicts, Git Flow
│   ├── 02_Linux_CLI_Shell.md            → Navigation, grep/awk/sed, scripting
│   ├── 03_Docker_Containers.md          → Dockerfiles, Compose, multi-stage builds
│   ├── 04_CICD_Pipelines.md             → GitHub Actions, build→test→deploy
│   ├── 05_Clean_Code.md                → Naming, SOLID, code smells, refactoring
│   ├── 06_Testing_Fundamentals.md       → Unit/Integration/E2E, TDD, Mockito
│   ├── 07_API_Design_REST.md            → REST principles, HTTP, pagination, errors
│   ├── 08_Security_Fundamentals.md      → OWASP, JWT, BCrypt, XSS, SQL injection
│   ├── 09_System_Design.md              → Load balancing, caching, queues, CAP
│   └── 10_Dev_Tools_Productivity.md     → IDE shortcuts, debugging, Postman, Maven
│
├── 14_Mental_Models/                    (14 files — HOW TO THINK guides!)
│   ├── 00_INDEX.md                      → Reading order & usage guide
│   ├── 01_Recursion_Tree_Thinking.md    → Draw recursion trees, leap of faith, memo→tab
│   ├── 02_DP_State_Thinking.md          → State identification, transitions, optimization
│   ├── 03_Graph_Tree_Thinking.md        → BFS vs DFS decision, grid-as-graph, patterns
│   ├── 04_Array_String_Thinking.md      → Decision tree for technique selection
│   ├── 05_Universal_Problem_Framework.md → 6-step method for ANY problem
│   ├── 06_Implementation_Checklist.md   → Big 10 bugs, Java gotchas, pre-submit checks
│   ├── 07_SQL_Mental_Pipeline.md        → Think in sets, query building pipeline
│   ├── 08_Debugging_DryRun.md           → Systematic debugging, dry run method
│   ├── 09_Complexity_Intuition.md       → See complexity at a glance, amortized
│   ├── 10_Interview_Thinking.md         → Think out loud, recovery strategies, pressure
│   ├── 11_Greedy_vs_DP_Decision.md      → 🆕 3-question checklist, proof techniques
│   ├── 12_Space_Time_Tradeoffs.md       → 🆕 When to trade memory for speed
│   └── 13_Pattern_Composition.md        → 🆕 Combining 2+ patterns for Hard problems
│
├── JavaSolutions/                       → Your Java code solutions
├── practice/                            → Practice scratch files
└── _archive/                            → Old/merged monolithic files (safe to ignore)
```

---

## Navigation by Topic

### Data Structures (11 chapters)
- **Foundations**: [Memory Model](02_Data_Structures/01a_Memory_Foundations.md) → [Arrays](02_Data_Structures/01b_Arrays.md) → [LinkedList](02_Data_Structures/01c_LinkedList.md) → [Stack & Queue](02_Data_Structures/01d_Stack_Queue.md) → [HashTable](02_Data_Structures/01e_HashTable.md) → [Trees & Heaps](02_Data_Structures/01f_Trees_Heaps.md)
- **Internals**: [Java DS Internals](02_Data_Structures/01g_DS_Internals.md) (ArrayList, HashMap, TreeMap under the hood)
- **Variants**: [Core Variants](02_Data_Structures/02a_DS_Variants_Core.md) | [Advanced Variants](02_Data_Structures/02b_DS_Variants_Advanced.md)
- **Reference**: [Java Collections](02_Data_Structures/03_Collections_Java.md) | [2D Arrays / Matrix](02_Data_Structures/04_2D_Arrays_Matrix.md)

### Algorithms (26 chapters)
- **Thinking**: [Algorithm Thinking & Big O](03_Algorithms/01_Algorithm_Thinking.md)
- **Sorting**: [Fundamentals](03_Algorithms/02a_Sorting_Fundamentals.md) → [Advanced](03_Algorithms/02b_Sorting_Advanced.md)
- **Recursion**: [Internals](03_Algorithms/03a_Recursion_Internals.md) → [Fundamentals](03_Algorithms/03b_Recursion_Fundamentals.md) → [Advanced](03_Algorithms/03c_Recursion_Advanced.md)
- **Dynamic Programming**: [Internals](03_Algorithms/04a_DP_Internals.md) → [Fundamentals](03_Algorithms/04b_DP_Fundamentals.md) → [Advanced](03_Algorithms/04c_DP_Advanced.md)
- **Trees**: [Trees Complete](03_Algorithms/05_Trees.md)
- **Graphs**: [Internals](03_Algorithms/05b_Graphs_Internals.md) → [Fundamentals](03_Algorithms/05c_Graphs_Fundamentals.md) → [Advanced Algos](03_Algorithms/05d_Graphs_Advanced_Algos.md) → [Patterns](03_Algorithms/05e_Graphs_Patterns.md)
- **Advanced Algos**: [Greedy & Bit Manipulation](03_Algorithms/06a_Greedy_BitManip.md) | [Deep Dive](03_Algorithms/06c_Advanced_Algo_Deep.md) | [String Algorithms](03_Algorithms/06d_String_Algorithms.md) | [Patterns](03_Algorithms/06e_Algorithm_Patterns.md)
- **Advanced DS**: [Core (Trie, Segment Tree)](03_Algorithms/07a_Advanced_DS_Core.md) | [Patterns](03_Algorithms/07b_Advanced_DS_Patterns.md)
- **Number Theory**: [Core (GCD, Primes)](03_Algorithms/08a_NumberTheory_Core.md) | [Advanced (Modular, CRT)](03_Algorithms/08b_NumberTheory_Advanced.md)
- **Specialized**: [Pattern Programs](03_Algorithms/09_Pattern_Programs_Complete.md) | [Bit Manipulation](03_Algorithms/10_Bit_Manipulation_Complete.md) | [Backtracking](03_Algorithms/11_Backtracking_Complete.md) | [Greedy](03_Algorithms/12_Greedy_Algorithms_Complete.md) | [String Algos](03_Algorithms/13_String_Algorithms_Complete.md) | [Union-Find](03_Algorithms/14_Union_Find_DSU_Complete.md) | [Monotonic Stack](03_Algorithms/15_Monotonic_Stack_Queue_Complete.md)

### Coding Patterns (20 files — 7 original + 13 combined DS+Algo)
- [Sliding Window](04_Patterns_Templates/01_Sliding_Window.md) | [Code Templates](04_Patterns_Templates/02_Code_Templates.md) | [Visual Diagrams](04_Patterns_Templates/03_Visual_Diagrams.md)
- [Pattern Recognition](04_Patterns_Templates/04_Pattern_Recognition.md) | [LeetCode → Real World](04_Patterns_Templates/05_LeetCode_RealWorld_Map.md)
- [Binary Search Patterns](04_Patterns_Templates/06_Binary_Search_Patterns.md) | [Two Pointers](04_Patterns_Templates/07_Two_Pointers_Complete.md)

**🆕 Combined DS+Algo Patterns** (Excel problems integrated with company tags):
- [Array+TwoPointers](04_Patterns_Templates/08_Array_Plus_TwoPointers.md) | [Array+SlidingWindow](04_Patterns_Templates/09_Array_Plus_SlidingWindow.md) | [HashMap+Counting](04_Patterns_Templates/10_HashMap_Plus_Counting.md)
- [Stack+Monotonic](04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md) | [LinkedList+Pointers](04_Patterns_Templates/12_LinkedList_Plus_TwoPointers.md) | [Tree+DFS/BFS](04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md)
- [Graph+Traversal](04_Patterns_Templates/14_Graph_Plus_Traversal.md) | [Heap+Greedy](04_Patterns_Templates/15_Heap_Plus_GreedySelection.md) | [DP Patterns](04_Patterns_Templates/16_DP_Pattern_Recognition.md)
- [Backtracking+Pruning](04_Patterns_Templates/17_Backtracking_Plus_Pruning.md) | [String+Advanced](04_Patterns_Templates/18_String_Plus_Advanced.md) | [Matrix+Grid](04_Patterns_Templates/19_Matrix_Plus_Grid_Traversal.md) | [BitManip+Tricks](04_Patterns_Templates/20_BitManipulation_Plus_Tricks.md)
- [Intervals](04_Patterns_Templates/21_Intervals_Pattern.md) | [Cyclic Sort](04_Patterns_Templates/22_Cyclic_Sort_Pattern.md) | [Knapsack Family](04_Patterns_Templates/23_Knapsack_Family.md)

### Practice & Problem Solving (23 files)
- [Intro & Checklist](05_Problem_Solving/01_Problems_Intro_Checklist.md)
- [Math & Numbers](05_Problem_Solving/02_Problems_Math_Numbers.md) | [Strings](05_Problem_Solving/03_Problems_Strings.md) | [Arrays](05_Problem_Solving/04_Problems_Arrays.md)
- [Sliding Window](05_Problem_Solving/05_Problems_Sliding_Window.md) | [Two Pointers](05_Problem_Solving/06_Problems_Two_Pointers.md) | [Binary Search](05_Problem_Solving/07_Problems_Binary_Search.md)
- [Stack & Queue](05_Problem_Solving/08_Problems_Stack_Queue.md) | [Trees](05_Problem_Solving/09_Problems_Trees.md) | [Graphs](05_Problem_Solving/10_Problems_Graphs.md)
- [Dynamic Programming](05_Problem_Solving/11_Problems_Dynamic_Programming.md) | [Backtracking](05_Problem_Solving/12_Problems_Backtracking.md) | [Greedy](05_Problem_Solving/13_Problems_Greedy.md)
- [Mixed Competitive](05_Problem_Solving/14_Problems_Mixed_Competitive.md) | [Linked Lists](05_Problem_Solving/15_Problems_LinkedList.md) | [Heap / Priority Queue](05_Problem_Solving/16_Problems_Heap.md)
- [Hashing](05_Problem_Solving/17_Problems_Hashing.md) | [Bit Manipulation](05_Problem_Solving/18_Problems_Bit_Manipulation.md) | [Matrix](05_Problem_Solving/19_Problems_Matrix.md)
- [Sorting](05_Problem_Solving/20_Problems_Sorting.md) | [Design](05_Problem_Solving/21_Problems_Design.md) | [Recursion & Subsets](05_Problem_Solving/22_Problems_Recursion_Subsets.md)
- [Edge Cases](05_Problem_Solving/02_Edge_Cases.md) | [Common Mistakes](05_Problem_Solving/03_Common_Mistakes.md) | [Problem Origins](05_Problem_Solving/04_Problem_Origins.md)

### OOP & Design (4 files)
- [OOP Principles + SOLID](06_OOP_Design/01_OOPS_Principles.md) | [Design Patterns](06_OOP_Design/02_Design_Patterns.md)
- [System Design](06_OOP_Design/03_System_Design.md) | [User/System Flows](06_OOP_Design/04_User_System_Flows.md)

### Modern Java & Spring Boot (36 chapters)
- **Roadmap**: [Spring Boot Roadmap](07_Modern_Java/00_SPRING_BOOT_ROADMAP.md) | [50-Day Curriculum](07_Modern_Java/26_Spring_Boot_Curriculum_50Day.md)
- **Java Core**: [Functional Programming](07_Modern_Java/01_Functional_Programming.md) | [Algo Engineering](07_Modern_Java/02a_AlgoEng_Core.md) | [Algo Eng Advanced](07_Modern_Java/02e_AlgoEng_Advanced.md)
- **Pre-Spring**: [Hidden Foundations Part 1](07_Modern_Java/02c_SB_HiddenFoundations_Part1.md) | [Part 2](07_Modern_Java/02d_SB_HiddenFoundations_Part2.md)
- **Spring Boot Core**: [Part 1](07_Modern_Java/03_Spring_Boot_Complete_Part1.md) → [Part 2](07_Modern_Java/04_Spring_Boot_Complete_Part2.md) → [Part 3](07_Modern_Java/05_Spring_Boot_Complete_Part3.md) → [Part 4](07_Modern_Java/06_Spring_Boot_Complete_Part4.md)
- **Components**: [Lombok & DTOs](07_Modern_Java/07_Spring_Boot_Part5_Lombok_DTOs.md) | [Service & Repository](07_Modern_Java/08_Spring_Boot_Part6_Service_Repository.md) | [Controllers & REST](07_Modern_Java/09_Spring_Boot_Part7_Controllers_REST.md)
- **Deep Dives**: [JPA](07_Modern_Java/10_Spring_Boot_Part8_JPA_Deep_Dive.md) | [Architecture](07_Modern_Java/11_Spring_Boot_Part9_Architecture_Quality.md) | [HTTP Internals](07_Modern_Java/12_Spring_Boot_Part10_HTTP_Deep_Dive.md)
- **Security**: [Auth & Security](07_Modern_Java/13_Spring_Boot_Part11_Auth_Security.md) | [Security Deep Dive](07_Modern_Java/19b_SB_Security.md)
- **Applied**: [DSA in Backend](07_Modern_Java/14_Spring_Boot_Part12_DSA_Applications.md) | [Industry Projects](07_Modern_Java/15_Spring_Boot_Part13_Industry_Projects.md)
- **Missing Topics**: [Core (Caching, Scheduling)](07_Modern_Java/16a_SB_Missing_Core.md) | [Advanced (Actuator)](07_Modern_Java/16b_SB_Missing_Advanced.md)
- **Reactive**: [WebFlux Core](07_Modern_Java/17a_SB_WebFlux_Core.md) | [WebFlux Advanced](07_Modern_Java/17b_SB_WebFlux_Advanced.md)
- **SOLID**: [Core](07_Modern_Java/18a_SB_SOLID_Core.md) | [Advanced](07_Modern_Java/18b_SB_SOLID_Advanced.md)
- **Database**: [Database Design](07_Modern_Java/19a_SB_Database.md)
- **Observability**: [Distributed Tracing](07_Modern_Java/20_Spring_Boot_Part18_Distributed_Tracing.md)
- **Testing**: [Fundamentals](07_Modern_Java/21a_SB_Testing_Fundamentals.md) | [Advanced](07_Modern_Java/21b_SB_Testing_Advanced.md)
- **Microservices**: [Core](07_Modern_Java/22a_SB_Microservices_Core.md) | [Patterns (Saga, CQRS)](07_Modern_Java/22b_SB_Microservices_Patterns.md)
- **Cloud**: [Core](07_Modern_Java/23a_SB_Cloud_Core.md) | [Advanced (K8s)](07_Modern_Java/23b_SB_Cloud_Advanced.md)
- **Annotations**: [Core](07_Modern_Java/24a_SB_Annotations_Core.md) | [Advanced](07_Modern_Java/24b_SB_Annotations_Advanced.md)
- **Extras**: [WebSocket, GraphQL, gRPC, Batch](07_Modern_Java/25_Spring_Boot_Part23_Missing_Essential_Topics.md)

### SQL (21 chapters)
- [01 Foundations](08_SQL/01_Foundations_Database_Basics.md) | [02 Data Types](08_SQL/02_DataTypes_Constraints.md) | [03 DDL](08_SQL/03_DDL_Creating_Structure.md) | [04 DML](08_SQL/04_DML_Manipulating_Data.md)
- [05 SELECT](08_SQL/05_Queries_SELECT_WHERE.md) | [06 Aggregations](08_SQL/06_Aggregations_GroupBy.md) | [07 JOINs](08_SQL/07_JOINs_Complete.md) | [08 Subqueries/CTEs](08_SQL/08_Subqueries_CTEs.md)
- [09 Window Functions](08_SQL/09_Window_Functions.md) | [10 Normalization](08_SQL/10_Normalization.md) | [11 Indexes](08_SQL/11_Indexes_Performance.md) | [12 Views/Procs](08_SQL/12_Views_StoredProcs_Triggers.md)
- [13 Transactions](08_SQL/13_Transactions_ACID.md) | [14 Optimization](08_SQL/14_Query_Optimization.md) | [15 Analytics/ETL](08_SQL/15_Analytics_Warehousing_ETL.md) | [16 Case Studies](08_SQL/16_RealWorld_CaseStudies.md)
- [17 100 Problems](08_SQL/17_Practice_100_Problems.md) | [18a Beginner Projects](08_SQL/18a_SQL_Projects_Beginner.md) | [18b Advanced Projects](08_SQL/18b_SQL_Projects_Advanced.md)
- [19 Interview Top 50](08_SQL/19_Interview_Top50.md) | [20 Cheat Sheet](08_SQL/20_CheatSheet_QuickRef.md)

### Career & Reference (14 files)
- [Career Framework](09_Career_Reference/01_Career_TechnoFunctional.md)
- Project Guide: [Part 1A](09_Career_Reference/01b_Career_Guide_Part1A.md) | [Part 1B](09_Career_Reference/01b2_Career_Guide_Part1B.md) | [Projects 1](09_Career_Reference/01c_Career_Projects_Part1.md) | [Projects 2](09_Career_Reference/01d_Career_Projects_Part2.md) | [Projects 3](09_Career_Reference/01e_Career_Projects_Part3.md)
- DSA Reference: [Foundations](09_Career_Reference/02a_DSA_Guide_Foundations.md) | [Advanced](09_Career_Reference/02b_DSA_Guide_Advanced.md) | [Advanced Patterns](09_Career_Reference/02b_Ultimate_DSA_Advanced.md) | [JVM Internals](09_Career_Reference/02c_Ultimate_DSA_JVM.md)
- [Quick Reference](09_Career_Reference/03_Quick_Reference.md) | [Brain & Psychology](09_Career_Reference/04_Brain_Psychology.md) | [Daily Habits](09_Career_Reference/05_Daily_Habits_Tracking.md) | [Resources](09_Career_Reference/06_Resources_Links.md)

### Enterprise & Real-World (8 files)
- ERP: [Fundamentals](10_Enterprise_Systems/01a_ERP_Fundamentals.md) | [Advanced](10_Enterprise_Systems/01b_ERP_Advanced.md || [Finance Core](10_Enterprise_Systems/02a_ERP_Finance_Core.md) | [Finance Real-World](10_Enterprise_Systems/02b_ERP_Finance_RealWorld.md)
- Real-World Problems: [Part 1](10_Enterprise_Systems/03_RealWorld_Problems_DSA.md) | [Part 2](10_Enterprise_Systems/04_RealWorld_Problems_Part2.md) | [Part 3](10_Enterprise_Systems/05_RealWorld_Problems_Part3.md)
- [Production Incidents & DSA](10_Enterprise_Systems/06_RealWorld_Incidents_DSA.md)

### Daily Practice (29 files)
- [Daily Practice Index](12_Daily_Practice/00_DAILY_PRACTICE_INDEX.md)
- [Week 01: Mar 3–9](12_Daily_Practice/Week_01/) — Arrays, Sorting, Strings, Kadane's, 2D Arrays, Merge Sort, Spring Boot intro
- [Week 02: Mar 10–16](12_Daily_Practice/Week_02/) — LinkedList, Stack, Queue, HashMap, Binary Search, Two Pointers, SQL basics
- [Week 03: Mar 17–23](12_Daily_Practice/Week_03/) — Trees, BST, Heap, DFS/BFS, Recursion, Backtracking, SQL Window Functions
- [Week 04: Mar 24–30](12_Daily_Practice/Week_04/) — Graphs (all algorithms), DP, Advanced SQL, Spring Boot JPA

### Developer Essentials (NEW!)
- [Index & Reading Order](13_Developer_Essentials/00_INDEX.md)
- [Git & Version Control](13_Developer_Essentials/01_Git_Version_Control.md) | [Linux & CLI](13_Developer_Essentials/02_Linux_CLI_Shell.md)
- [Docker & Containers](13_Developer_Essentials/03_Docker_Containers.md) | [CI/CD Pipelines](13_Developer_Essentials/04_CICD_Pipelines.md)
- [Clean Code & SOLID](13_Developer_Essentials/05_Clean_Code.md) | [Testing (TDD, Mockito)](13_Developer_Essentials/06_Testing_Fundamentals.md)
- [API Design & REST](13_Developer_Essentials/07_API_Design_REST.md) | [Security (OWASP, JWT)](13_Developer_Essentials/08_Security_Fundamentals.md)
- [System Design](13_Developer_Essentials/09_System_Design.md) | [Dev Tools & Productivity](13_Developer_Essentials/10_Dev_Tools_Productivity.md)

### Mental Models — HOW TO THINK (NEW!)
- [Index & Reading Order](14_Mental_Models/00_INDEX.md)
- [Recursion Tree Thinking](14_Mental_Models/01_Recursion_Tree_Thinking.md) | [DP State Thinking](14_Mental_Models/02_DP_State_Thinking.md)
- [Graph & Tree Thinking](14_Mental_Models/03_Graph_Tree_Thinking.md) | [Array & String Thinking](14_Mental_Models/04_Array_String_Thinking.md)
- [Universal Problem Framework](14_Mental_Models/05_Universal_Problem_Framework.md) | [Implementation Checklist](14_Mental_Models/06_Implementation_Checklist.md)
- [SQL Mental Pipeline](14_Mental_Models/07_SQL_Mental_Pipeline.md) | [Debugging & Dry Run](14_Mental_Models/08_Debugging_DryRun.md)
- [Complexity Intuition](14_Mental_Models/09_Complexity_Intuition.md) | [Interview Thinking](14_Mental_Models/10_Interview_Thinking.md)
- [Greedy vs DP Decision](14_Mental_Models/11_Greedy_vs_DP_Decision.md) | [Space-Time Tradeoffs](14_Mental_Models/12_Space_Time_Tradeoffs.md) | [Pattern Composition](14_Mental_Models/13_Pattern_Composition.md)

---

## Current Study Plans

### Daily Practice (started March 3, 2026)
3 hours/day with structured blocks:
- **Weekdays:** DS(30m) + Algo(30m) + Combo(20m) + Real-World(20m) + SQL(40m) + 2 Problems(40m)
- **Weekends:** Spring Boot(90m) + SQL Practice(45m) + Review(45m)

Each daily file contains cross-reference links to the relevant chapter files for deep dives.

Open [12_Daily_Practice/00_DAILY_PRACTICE_INDEX.md](12_Daily_Practice/00_DAILY_PRACTICE_INDEX.md) for today's assignment.

### 76-Day Calendar (Feb 19 – May 5, 2026)
| Phase | Weeks | Focus |
|-------|-------|-------|
| Foundations | 1–3 | Arrays, Strings, Sorting, LinkedList, Recursion |
| Core Patterns | 4–6 | Stack, Queue, HashMap, Sliding Window, Trees |
| Advanced | 7–10 | Heaps, Graphs, DP, Greedy, Backtracking |
| Integration | 11 | SQL, System Design, Mock Interviews |

Open [01_Getting_Started/02_Study_Plan_Calendar.md](01_Getting_Started/02_Study_Plan_Calendar.md) for the full day-by-day plan.

### 50-Day Spring Boot Curriculum (weekends)
Open [07_Modern_Java/26_Spring_Boot_Curriculum_50Day.md](07_Modern_Java/26_Spring_Boot_Curriculum_50Day.md) for the schedule.

---

## File Count

| Folder | Files | Description |
|--------|------:|-------------|
| Root (indexes) | 2 | Master index + Textbook preface |
| 01_Getting_Started | 1 | Study plan calendar |
| 02_Data_Structures | 11 | Memory → Arrays → LinkedList → Stack/Queue → Hash → Trees → Internals → Variants |
| 03_Algorithms | 29 | Sorting → Recursion → DP → Trees → Graphs → Advanced → Number Theory → Specialized |
| 04_Patterns_Templates | 20 | 7 original + 13 combined DS+Algo patterns with Excel problems |
| 05_Problem_Solving | 23 | 20 topic chapters + Edge/Mistakes/Origins |
| 06_OOP_Design | 4 | OOP, Design Patterns, System Design |
| 07_Modern_Java | 38 | Functional, Algo Eng, 30+ Spring Boot chapters |
| 08_SQL | 21 | Zero to expert in 21 chapters |
| 09_Career_Reference | 14 | Career path, DSA ref, JVM, Psychology, Habits |
| 10_Enterprise_Systems | 8 | ERP, Finance, Real-world problems |
| 12_Daily_Practice | 29 | Index + 28 days (4 weeks) with cross-reference links |
| 13_Developer_Essentials | 11 | Git, Linux, Docker, CI/CD, Clean Code, Testing, REST, Security, System Design, Tools |
| 14_Mental_Models | 11 | Index + 10 HOW-TO-THINK guides: Recursion Trees, DP States, Graph/Tree, Array/String, Universal Framework, Implementation, SQL Pipeline, Debugging, Complexity, Interview |
| **TOTAL** | **216** | |

---

_Last restructured: March 2026 — 14_Mental_Models added (10 theory/thinking guides), combined DS+Algo patterns, 216 total files_
