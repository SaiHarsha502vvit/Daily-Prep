# 14 Mental Models — Diagram Enhancement Upgrade Log

Documents all box-drawing diagrams added or significantly improved during the Combined Lens pedagogy upgrade. Each entry lists the new or enhanced diagrams with their key visual elements.

---

## 14_Mental_Models/00_INDEX.md

### Diagrams added
- **Mental Model Selection Decision Tree**: Top-level decision tree for selecting among 6 mental model classes based on problem input characteristics (graph? yes→Graph_Tree; array with search? yes→Array_String; recursive substructure? yes→Recursion_Tree; overlapping subproblems? yes→DP_State; optimization over choices? yes→Greedy_vs_DP; system at scale? yes→System_Design). Shows the root question and branching paths.

---

## 14_Mental_Models/01_Recursion_Tree_Thinking.md

### Diagrams added
- **Fibonacci(5) Call Stack Tree with Frame Numbering**: Full call-stack expansion tree for Fibonacci(5) showing frame labels (fib(5), fib(4), fib(3), fib(2), fib(1), fib(0)), return values propagating upward, duplicate subproblems highlighted (fib(2) appears twice, fib(3) appears twice). Includes step-by-step expansion annotated with frame creation/destruction.

---

## 14_Mental_Models/02_DP_State_Thinking.md

### Diagrams added
- **Coin Change 1D DP Table with Transition Arrows**: 1D table (index 0..amount) showing DP[i] = minimum coins for amount i. Arrows show state transitions: DP[i] depends on DP[i-coin] for each coin denomination. Base case DP[0]=0 highlighted. Transition arrows labeled with coin used.

---

## 14_Mental_Models/03_Graph_Tree_Thinking.md

### Diagrams added
- **BFS vs DFS Decision Tree with Mental Models**: Side-by-side decision trees showing how to choose BFS vs DFS based on problem type. BFS branch: shortest path? yes→BFS; level-order? yes→BFS. DFS branch: connected components? yes→DFS; topological sort? yes→DFS. Each leaf maps to the corresponding mental model (Graph_Tree_Thinking with BFS-first or DFS-first emphasis).

---

## 14_Mental_Models/04_Array_String_Thinking.md

### Diagrams added
- **Two-Pointer Annotated Diagram**: Linear scan array with left pointer and right pointer positions annotated at each step. Shows initialization (L=0, R=n-1), mid-state (L advances, R retreats), and termination condition.
- **Sliding Window Annotated Diagram**: Array with window [i, j] highlighted, showing window expansion, contraction, and key update (sum/product/hash) at each step. Annotates when to shrink vs expand.

---

## 14_Mental_Models/05_Universal_Problem_Framework.md

### Diagrams added
- **Constraint → Complexity → Pattern Decision Tree**: Three-stage decision tree. Stage 1: identify constraints (n ≤ 15? → brute force; n ≤ 10⁵? → O(n log n); n up to 10⁷? → O(n)). Stage 2: determine complexity class. Stage 3: map to implied patterns. Shows branching with example thresholds.

---

## 14_Mental_Models/06_Implementation_Checklist.md

### Diagrams added
- **Debug Decision Tree**: Binary tree with root "Does it pass all tests?" → No → "Reproducible?" → No → Heisenbug path; Yes → "Same input always fails?" → No → Race condition path. Each leaf maps to a specific debug strategy from the checklist.

---

## 14_Mental_Models/07_SQL_Mental_Pipeline.md

### Diagrams added
- **SQL Query Pipeline (FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT)**: Horizontal flow diagram showing all 7 stages of SQL query execution in order. Each stage box annotated with what it does and how it transforms the row stream. Arrows show data flow; note that WHERE runs before SELECT, and HAVING runs after GROUP BY.

---

## 14_Mental_Models/08_Debugging_DryRun.md

### Diagrams added
- **Debugging Decision Tree**: Root: "Is it reproducible?" → Yes → "Is it on the hot path?" → Yes → Profiling path. No → "Is it in dev only?" → Dry-run path. Each leaf provides the recommended debugging strategy with tools listed.

---

## 14_Mental_Models/09_Complexity_Intuition.md

### Diagrams added
- **Complexity Ruler (Big-O Growth Curves)**: Vertical ruler graphic showing relative positions of O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), O(n!) with relative execution time at n=10⁶. Illustrative curve sketches for each class.

---

## 14_Mental_Models/10_Interview_Thinking.md

### Diagrams added
- **45-Minute Interview Timeline**: Horizontal timeline showing 5 phases: 0-5min (自我介绍), 5-15min (简历深挖), 15-30min (算法题), 30-38min (验证), 38-45min (问问题). Each phase annotated with goal, key actions, and interviewer signals to watch for.

---

## 14_Mental_Models/11_Greedy_vs_DP_Decision.md

### Diagrams added
- **Greedy vs DP 3-Question Flowchart**: Three-question decision flowchart. Q1: "Does local optimal imply global optimal?" → Yes → Greedy. No → Q2: "Are subproblems overlapping?" → Yes → DP. No → Q3: "Can you enumerate all choices?" → Yes → DP with choice; No → Other approaches. Each outcome maps to a specific technique.

---

## 14_Mental_Models/12_Space_Time_Tradeoffs.md

### Diagrams added
- **Memory Hierarchy Pyramid**: Vertical pyramid diagram showing L1 cache (fastest, smallest) at top, L2, L3, RAM, SSD, HDD at bottom (slowest, largest). Each level annotated with typical latency and size. Shows the tradeoff principle: moving up the pyramid saves time at the cost of space.

---

## 14_Mental_Models/13_Pattern_Composition.md

### Diagrams added
- **Pattern Composition Map (Outer/Inner Pairs)**: 2D grid with outer patterns on one axis and inner patterns on the other. Each cell shows a valid composition and its typical use case. Key compositions highlighted: sliding-window + hashmap, two-pointer + binary-search, DFS + memoization.

---

## 14_Mental_Models/14_Optimization_Pipeline.md

### Diagrams added
- **5-Stage Optimization Pipeline**: Horizontal pipeline diagram with 5 stages: (1) Measure with Profiling → (2) Identify Hot Path → (3) Algorithm Improvement → (4) Locality Enhancement → (5) Continuous Benchmarking. Each stage box shows input, output, and key tools.

---

## 14_Mental_Models/15_System_Design_Thinking.md

### Diagrams added
- **System Design Decision Flow**: Flowchart starting with "What is the read/write ratio?" → High read → Cache-first. High write → Event sourcing. Balanced → Direct DB. Then branching on consistency requirements (Strong → Synchronous; Eventual → Async). Each branch maps to specific architectural patterns.

---

## 14_Mental_Models/16_Distributed_Systems_Thinking.md

### Diagrams added
- **CAP/PACELC Consistency Choice Tree**: Decision tree for choosing consistency model. Partition tolerance? → Always needed. Then: CA (not partition-tolerant) → avoid; CP (consistency preferred) → use Paxos/Raft; AP (availability preferred) → use eventual consistency. PACELC extension shows latency vs consistency tradeoff even without partition.

---

## 14_Mental_Models/17_Frontend_Architecture_Thinking.md

### Diagrams added
- **State Location Decision Tree**: Binary tree for choosing where to place state. "Is it local to one component?" → Yes → Component state. No → "Is it shared across siblings?" → Yes → Lifted state. No → "Is it global?" → Yes → Redux/Context. Each leaf shows pros/cons and performance implications.

---

## 14_Mental_Models/18_Production_Debugging_Thinking.md

### Diagrams added
- **Incident Timeline**: Horizontal timeline for a production incident showing 5 phases: Detection (alert fires), Triage (初步定位), Communication (stakeholder notification), Mitigation (临时修复), Resolution (根因修复). Each phase annotated with typical duration and key actions.

---

## 14_Mental_Models/20_Pattern_Trigger_Guide.md

### Diagrams added
- **Signal → Pattern Trigger Map (12 Categories)**: Two-column map. Left column: 12 input signal categories (sorted array, binary tree, graph with edges, string, etc.). Right column: recommended pattern with trigger condition. Lines connect signals to patterns with annotation explaining why each signal triggers the corresponding pattern.

---

## 14_Mental_Models/21_Competitive_Coding_Deep_Thinking.md

### Diagrams added
- **Contest Timeline (5min read → 10min think → 25min code → 10min test)**: Horizontal timeline for a typical competitive programming contest session. Each segment annotated with specific actions: Read (extract constraints, identify pattern), Think (choose algorithm, verify complexity), Code (implement with fast I/O), Test (edge cases, stress test).

---

## 14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md

### Diagrams added
- **Brute-to-Optimal Transformation Flowchart**: Step-by-step transformation diagram showing O(n²) → identify bottleneck → HashMap-based O(n) path. Each step annotated with what changes: remove nested loop → add hashmap lookup → verify with test cases. Shows the generic transformation pattern with concrete example (finding duplicate in O(n) vs O(n²)).