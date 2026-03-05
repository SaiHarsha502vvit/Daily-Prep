> **Navigation**: [< Previous](04_Pattern_Recognition.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06_Binary_Search_Patterns.md)

# 📊 LeetCode Problems → Real-World Applications Map

## Every Problem You Solve Has a Real-World Purpose

---

# ❓ Part 0: Why Understanding Real — World Applications Matters

```
╔══════════════════════════════════════════════════════════════════════════════╗
║        LEETCODE TO REAL-WORLD - COMPLETE UNDERSTANDING                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS THIS GUIDE?                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ A bridge between ABSTRACT coding problems and REAL problems they model.      │
│                                                                              │
│ KEY INSIGHT: LeetCode problems aren't arbitrary puzzles!                     │
│ They're distilled versions of real engineering challenges.                   │
│                                                                              │
│ EXAMPLE:                                                                     │
│ • "Two Sum" looks artificial, but...                                         │
│ • It's the core of finding complementary products on Amazon                  │
│ • It's how Netflix finds matching user preferences                           │
│ • It's how dating apps find compatible matches!                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES THIS SOLVE?                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PROBLEM 1: "I'm solving problems but don't know WHY they matter"             │
│ → Without purpose, motivation fades and learning is shallow                  │
│                                                                              │
│ PROBLEM 2: "Interviewer asks: Where is this used?"                           │
│ → Real-world context shows you understand beyond the algorithm               │
│                                                                              │
│ PROBLEM 3: "I can solve LeetCode but can't apply at work"                    │
│ → Knowing applications helps you RECOGNIZE when to use patterns              │
│                                                                              │
│ PROBLEM 4: "Feels like I'm just 'grinding' with no real learning"            │
│ → Purpose transforms grinding into meaningful learning                       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY LEARN REAL-WORLD CONNECTIONS?                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. BETTER MEMORY:                                                            │
│    Story: "Used in Google Maps" sticks better than "Dijkstra is O(V+E)"      │
│                                                                              │
│ 2. INTERVIEW ADVANTAGE:                                                      │
│    Connecting problems to applications shows MATURITY                        │
│    Senior engineers think this way naturally                                 │
│                                                                              │
│ 3. TRANSFERABLE SKILLS:                                                      │
│    At work, no one says "implement Two Sum"                                  │
│    They say "find products that complement this one"                         │
│    You need to RECOGNIZE the pattern                                         │
│                                                                              │
│ 4. SYSTEM DESIGN READY:                                                      │
│    Knowing where algorithms are used helps in system design                  │
│    "For this feature, we'd use the Two Sum approach..."                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW TO USE THIS GUIDE                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ BEFORE solving a problem:                                                    │
│ • Look up the real-world application                                         │
│ • Visualize the actual problem (users, data, system)                         │
│ • This gives you MOTIVATION and CONTEXT                                      │
│                                                                              │
│ AFTER solving a problem:                                                     │
│ • Review the applications again                                              │
│ • Ask: "Where else could this pattern help?"                                 │
│ • Try to think of 1-2 NEW applications yourself                              │
│                                                                              │
│ IN INTERVIEWS:                                                               │
│ • If asked "Where is this used?", you have ready answers                     │
│ • Even if not asked, mention: "This pattern is used in..."                   │
│ • Shows depth and maturity                                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ GROWTH MINDSET: FROM PROBLEM-SOLVER TO SYSTEM-BUILDER ⭐                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ LEVEL 1 (Beginner): "I solved Two Sum"                                       │
│                                                                              │
│ LEVEL 2 (Intermediate): "Two Sum uses HashMap for O(1) complement lookup"    │
│                                                                              │
│ LEVEL 3 (Advanced): "Two Sum pattern appears in e-commerce, matching         │
│                      systems, and financial analysis"                        │
│                                                                              │
│ LEVEL 4 (Expert): "When building our recommendation system, I recognized     │
│                    this is essentially a Two Sum variant and optimized       │
│                    using the same approach"                                  │
│                                                                              │
│ THIS GUIDE HELPS YOU REACH LEVEL 3-4!                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# 📘 How to Use This Guide

```
For each problem in your 60-day calendar:
1. Find it in this list
2. Read the real-world application
3. Understand WHY this problem matters
4. Solve with PURPOSE, not just for "grinding"
```

---

# 📊 Arrays & Strings

## Two Sum

```
LEETCODE: https://leetcode.com/problems/two-sum/

REAL-WORLD APPLICATIONS:

1. E-COMMERCE: Shopping Cart Optimization
   - User has budget of $100
   - Find two items that exactly fit budget
   - Used in: Amazon, Flipkart deal suggestions

2. FINANCE: Portfolio Balancing
   - Find two stocks whose prices sum to target allocation
   - Used in: Zerodha, Robinhood

3. GAMING: Match-Making
   - Find two players whose skill ratings sum to target
   - Used in: PUBG, Valorant matchmaking

4. CHEMISTRY: Compound Discovery
   - Find two elements whose atomic numbers sum to needed value
   - Used in: Drug discovery software

YOUR INTERVIEW ANSWER:
"Two Sum pattern is used everywhere - from e-commerce cart optimization
to financial portfolio balancing. The key insight is using a HashMap
to achieve O(1) lookup for the complement."
```

## Contains Duplicate

```
LEETCODE: https://leetcode.com/problems/contains-duplicate/

REAL-WORLD APPLICATIONS:

1. DATABASE: Data Integrity
   - Ensure no duplicate entries
   - Used in: Every database system

2. USER REGISTRATION: Email Validation
   - Check if email already registered
   - Used in: Every signup system

3. INVENTORY: Stock Keeping
   - Detect duplicate product codes
   - Used in: Warehouse management

4. VOTING SYSTEMS: Fraud Detection
   - Ensure no duplicate votes
   - Used in: Election systems

YOUR INTERVIEW ANSWER:
"Contains Duplicate is fundamental for data integrity.
Every database uses this pattern to enforce unique constraints.
HashSet gives us O(n) time with O(n) space."
```

## Maximum Subarray (Kadane's Algorithm)

```
LEETCODE: https://leetcode.com/problems/maximum-subarray/

REAL-WORLD APPLICATIONS:

1. FINANCE: Best Trading Period
   - Find the most profitable consecutive days
   - Used in: Stock analysis tools

2. BIOLOGY: DNA Sequence Analysis
   - Find region with highest expression
   - Used in: Genomic research

3. GAMING: Best Score Streak
   - Find player's best consecutive performance
   - Used in: Leaderboard systems

4. WEATHER: Temperature Patterns
   - Find warmest consecutive period
   - Used in: Climate analysis

YOUR INTERVIEW ANSWER:
"Kadane's algorithm is crucial for financial analysis -
finding the best period to buy and hold stocks.
The insight is maintaining a running sum and resetting when negative."
```

## Merge Sorted Array

```
LEETCODE: https://leetcode.com/problems/merge-sorted-array/

REAL-WORLD APPLICATIONS:

1. DATABASE: Merge Sort in External Sorting
   - Merge sorted chunks from disk
   - Used in: SQL ORDER BY

2. VERSION CONTROL: Git Merge
   - Merge two branches' changes
   - Used in: Git, SVN

3. SEARCH ENGINES: Index Merging
   - Merge sorted posting lists
   - Used in: Google, Elasticsearch

4. MUSIC APPS: Playlist Merge
   - Merge two sorted playlists
   - Used in: Spotify collaborative playlists

YOUR INTERVIEW ANSWER:
"Merge Sorted Array is the foundation of external sorting in databases.
When data is too large for memory, we sort chunks and merge them.
Two pointers from the end avoids extra space."
```

## Best Time to Buy and Sell Stock

```
LEETCODE: https://leetcode.com/problems/best-time-to-buy-and-sell-stock/

REAL-WORLD APPLICATIONS:

1. TRADING: Algorithmic Trading
   - Find optimal buy/sell points
   - Used in: Every trading platform

2. RESOURCE PRICING: Cloud Computing
   - Find best time to provision resources
   - Used in: AWS, Azure spot pricing

3. TRAVEL: Flight Pricing
   - Find best day to book
   - Used in: Kayak, Google Flights

4. REAL ESTATE: Property Investment
   - Analyze historical price for best entry
   - Used in: Real estate platforms

YOUR INTERVIEW ANSWER:
"This is literally the core problem in algorithmic trading.
Track minimum price so far and maximum profit achievable.
One pass, O(n) time - critical for real-time trading."
```

---

# 📌 Sliding Window

## Maximum Average Subarray

```
LEETCODE: https://leetcode.com/problems/maximum-average-subarray-i/

REAL-WORLD APPLICATIONS:

1. FINANCE: Moving Average
   - 7-day, 30-day moving averages in stock analysis
   - Used in: Trading indicators (SMA, EMA)

2. NETWORK: Bandwidth Monitoring
   - Average bandwidth over last N seconds
   - Used in: Network monitoring tools

3. GAMING: Performance Analysis
   - Average FPS over time window
   - Used in: Game performance tools

4. IOT: Sensor Data Smoothing
   - Average temperature readings
   - Used in: Smart home systems

YOUR INTERVIEW ANSWER:
"Moving averages are fundamental in finance and signal processing.
Sliding window gives O(n) instead of O(n*k) by updating incrementally."
```

## Longest Substring Without Repeating Characters

```
LEETCODE: https://leetcode.com/problems/longest-substring-without-repeating-characters/

REAL-WORLD APPLICATIONS:

1. SECURITY: Password Validation
   - Ensure no repeating characters
   - Used in: Password strength checkers

2. TEXT PROCESSING: Unique Character Windows
   - Find interesting text patterns
   - Used in: Text editors, IDEs

3. BIOLOGY: DNA Sequence Analysis
   - Find unique nucleotide sequences
   - Used in: Genetic research

4. COMPRESSION: LZ77 Algorithm Foundation
   - Find repeating patterns
   - Used in: ZIP, GZIP compression

YOUR INTERVIEW ANSWER:
"This pattern is used in text compression algorithms like LZ77.
Variable sliding window with HashSet for O(n) solution."
```

## Minimum Window Substring

```
LEETCODE: https://leetcode.com/problems/minimum-window-substring/

REAL-WORLD APPLICATIONS:

1. SEARCH ENGINES: Snippet Generation
   - Find shortest text containing all keywords
   - Used in: Google search result snippets

2. BIOINFORMATICS: Sequence Matching
   - Find shortest DNA sequence with all markers
   - Used in: Gene research

3. DOCUMENT PROCESSING: Keyword Extraction
   - Find relevant text sections
   - Used in: Document summarization

YOUR INTERVIEW ANSWER:
"Search engines use this to generate result snippets.
Two pointers with frequency map, expand until valid, shrink for minimum."
```

---

# #️⃣ Hash Map

## Group Anagrams

```
LEETCODE: https://leetcode.com/problems/group-anagrams/

REAL-WORLD APPLICATIONS:

1. SEARCH ENGINES: Spell Check
   - Group words by their letters
   - Used in: Google "Did you mean?"

2. WORD GAMES: Scrabble/Wordle
   - Find all words from given letters
   - Used in: Word game assistants

3. PLAGIARISM DETECTION
   - Group similar passages
   - Used in: Turnitin, academic tools

4. CRYPTOGRAPHY: Cipher Analysis
   - Group encrypted text patterns
   - Used in: Code breaking

YOUR INTERVIEW ANSWER:
"Anagram grouping is used in search engines for spell suggestions.
Key insight: sorted characters as HashMap key gives O(n*k log k)."
```

## Top K Frequent Elements

```
LEETCODE: https://leetcode.com/problems/top-k-frequent-elements/

REAL-WORLD APPLICATIONS:

1. ANALYTICS: Trending Topics
   - Find most frequent hashtags
   - Used in: Twitter trending

2. E-COMMERCE: Product Recommendations
   - Most viewed/purchased items
   - Used in: Amazon recommendations

3. MUSIC STREAMING: Top Charts
   - Most played songs
   - Used in: Spotify charts

4. SEARCH: Autocomplete
   - Most frequent searches
   - Used in: Google autocomplete

YOUR INTERVIEW ANSWER:
"Twitter's trending algorithm uses this pattern.
HashMap for frequency, then min-heap of size K for O(n log k)."
```

## LRU Cache

```
LEETCODE: https://leetcode.com/problems/lru-cache/

REAL-WORLD APPLICATIONS:

1. CPU ARCHITECTURE: Cache Memory
   - Every CPU has L1, L2, L3 caches
   - Uses LRU eviction policy

2. WEB BROWSERS: Page Cache
   - Store recently visited pages
   - Used in: Chrome, Firefox

3. DATABASES: Buffer Pool
   - Cache frequently accessed pages
   - Used in: MySQL, PostgreSQL

4. CDN: Content Caching
   - Cache popular content at edge
   - Used in: Cloudflare, Akamai

YOUR INTERVIEW ANSWER:
"LRU Cache is in every CPU, browser, and database.
HashMap + Doubly Linked List for O(1) get and put."
```

---

# 🌳 Trees

## Maximum Depth of Binary Tree

```
LEETCODE: https://leetcode.com/problems/maximum-depth-of-binary-tree/

REAL-WORLD APPLICATIONS:

1. FILE SYSTEMS: Directory Depth
   - Find deepest nested folder
   - Used in: File explorers

2. ORG CHARTS: Hierarchy Analysis
   - Find longest reporting chain
   - Used in: HR systems

3. COMPILERS: AST Analysis
   - Depth of nested expressions
   - Used in: Code analyzers

4. XML/JSON: Document Depth
   - Find nesting level
   - Used in: Parsers

YOUR INTERVIEW ANSWER:
"Directory depth calculation in file systems uses this.
Simple recursion: 1 + max(left depth, right depth)."
```

## Validate Binary Search Tree

```
LEETCODE: https://leetcode.com/problems/validate-binary-search-tree/

REAL-WORLD APPLICATIONS:

1. DATABASES: Index Integrity
   - Verify B-tree index is valid
   - Used in: Database maintenance

2. FILE SYSTEMS: Directory Validation
   - Verify sorted directory structure
   - Used in: File system repair tools

3. MEMORY ALLOCATORS: Heap Validation
   - Verify heap property maintained
   - Used in: Memory managers

YOUR INTERVIEW ANSWER:
"Database B-tree indexes need validation after crashes.
Inorder traversal should give sorted sequence, or use range checking."
```

## Lowest Common Ancestor

```
LEETCODE: https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/

REAL-WORLD APPLICATIONS:

1. VERSION CONTROL: Merge Base
   - Find common ancestor commit for merge
   - Used in: Git (git merge-base)

2. BIOLOGY: Evolutionary Trees
   - Find common ancestor species
   - Used in: Phylogenetic analysis

3. ORG CHARTS: Common Manager
   - Find lowest common manager
   - Used in: HR systems

4. FILE SYSTEMS: Common Directory
   - Find common parent directory
   - Used in: Path operations

YOUR INTERVIEW ANSWER:
"Git uses LCA to find the merge base when merging branches.
Recursive approach: if found in both subtrees, current is LCA."
```

---

# 🕸️ Graphs

## Number of Islands

```
LEETCODE: https://leetcode.com/problems/number-of-islands/

REAL-WORLD APPLICATIONS:

1. MAPS: Land Mass Detection
   - Identify distinct landmasses
   - Used in: Google Maps, satellite analysis

2. IMAGE PROCESSING: Object Detection
   - Count distinct objects in image
   - Used in: Medical imaging

3. NETWORK: Subnet Detection
   - Find disconnected networks
   - Used in: Network topology

4. GAMING: Region Detection
   - Identify connected territories
   - Used in: Strategy games

YOUR INTERVIEW ANSWER:
"Satellite imaging uses this to count landmasses.
DFS/BFS from each unvisited '1', mark all connected cells."
```

## Course Schedule (Topological Sort)

```
LEETCODE: https://leetcode.com/problems/course-schedule/

REAL-WORLD APPLICATIONS:

1. BUILD SYSTEMS: Dependency Resolution
   - Determine build order
   - Used in: Make, Gradle, Maven

2. PACKAGE MANAGERS: Install Order
   - Resolve package dependencies
   - Used in: npm, pip, apt

3. TASK SCHEDULING: Project Management
   - Find task execution order
   - Used in: Microsoft Project

4. SPREADSHEETS: Formula Evaluation Order
   - Cells depend on other cells
   - Used in: Excel, Google Sheets

YOUR INTERVIEW ANSWER:
"Package managers like npm use topological sort for dependencies.
Detect cycle using DFS with visiting state, or Kahn's algorithm."
```

## Clone Graph

```
LEETCODE: https://leetcode.com/problems/clone-graph/

REAL-WORLD APPLICATIONS:

1. VERSION CONTROL: Branching
   - Clone entire repository state
   - Used in: Git clone

2. MEMORY MANAGEMENT: Deep Copy
   - Copy complex object graphs
   - Used in: Serialization libraries

3. SIMULATION: State Duplication
   - Clone game/simulation state
   - Used in: Undo/redo systems

4. DATABASES: Snapshot Isolation
   - Create point-in-time copy
   - Used in: Transaction systems

YOUR INTERVIEW ANSWER:
"Git clone and database snapshots use deep copy algorithms.
HashMap to track cloned nodes, BFS/DFS to traverse."
```

---

# 💎 Dynamic Programming

## Climbing Stairs

```
LEETCODE: https://leetcode.com/problems/climbing-stairs/

REAL-WORLD APPLICATIONS:

1. PATHFINDING: Route Counting
   - Number of ways through a grid
   - Used in: Robot path planning

2. PROBABILITY: Random Walks
   - Count possible outcomes
   - Used in: Financial modeling

3. GAMING: Move Sequences
   - Count valid move combinations
   - Used in: Game AI

YOUR INTERVIEW ANSWER:
"This Fibonacci-like pattern appears in combinatorics.
dp[i] = dp[i-1] + dp[i-2], O(n) time, O(1) space possible."
```

## Coin Change

```
LEETCODE: https://leetcode.com/problems/coin-change/

REAL-WORLD APPLICATIONS:

1. BANKING: ATM Dispensing
   - Minimum notes to dispense amount
   - Used in: Every ATM machine

2. LOGISTICS: Container Packing
   - Minimum containers for shipment
   - Used in: Shipping optimization

3. RESOURCE ALLOCATION: Cloud Computing
   - Minimum VMs to meet demand
   - Used in: Cloud provisioning

YOUR INTERVIEW ANSWER:
"ATMs use this to minimize dispensed notes.
Classic unbounded knapsack: dp[amount] = min coins needed."
```

## Longest Common Subsequence

```
LEETCODE: https://leetcode.com/problems/longest-common-subsequence/

REAL-WORLD APPLICATIONS:

1. VERSION CONTROL: Diff Algorithm
   - Find common lines between versions
   - Used in: Git diff

2. BIOINFORMATICS: DNA Comparison
   - Compare genetic sequences
   - Used in: Gene research

3. SPELL CHECK: Edit Distance Basis
   - Find similarity between words
   - Used in: Autocorrect

4. PLAGIARISM DETECTION: Text Similarity
   - Find common passages
   - Used in: Academic tools

YOUR INTERVIEW ANSWER:
"Git diff uses LCS to show changes between file versions.
2D DP: dp[i][j] = LCS of first i chars and first j chars."
```

---

# 📦 Heaps / Priority Queues

## Kth Largest Element

```
LEETCODE: https://leetcode.com/problems/kth-largest-element-in-an-array/

REAL-WORLD APPLICATIONS:

1. ANALYTICS: Percentile Calculation
   - Find 90th percentile response time
   - Used in: Performance monitoring

2. RANKINGS: Leaderboards
   - Find Kth highest scorer
   - Used in: Gaming platforms

3. STREAMING: Top-K
   - Find K most frequent in stream
   - Used in: Real-time analytics

4. SEARCH: Relevance Ranking
   - Find top K results
   - Used in: Search engines

YOUR INTERVIEW ANSWER:
"Performance monitoring uses this for percentile calculations.
Min-heap of size K: O(n log k), or QuickSelect for O(n) average."
```

## Merge K Sorted Lists

```
LEETCODE: https://leetcode.com/problems/merge-k-sorted-lists/

REAL-WORLD APPLICATIONS:

1. DATABASES: External Sort
   - Merge sorted runs from disk
   - Used in: Database sorting

2. SEARCH: Index Merge
   - Merge posting lists
   - Used in: Search engines

3. LOGGING: Log Aggregation
   - Merge logs from multiple servers
   - Used in: Splunk, ELK

4. DISTRIBUTED SYSTEMS: MapReduce
   - Merge phase combines sorted outputs
   - Used in: Hadoop, Spark

YOUR INTERVIEW ANSWER:
"Hadoop MapReduce uses this in the reduce phase.
Min-heap with K elements: O(n log k) where n is total elements."
```

---

# 📚 Stack

## Valid Parentheses

```
LEETCODE: https://leetcode.com/problems/valid-parentheses/

REAL-WORLD APPLICATIONS:

1. COMPILERS: Syntax Validation
   - Validate code structure
   - Used in: Every compiler

2. TEXT EDITORS: Bracket Matching
   - Highlight matching brackets
   - Used in: VS Code, IntelliJ

3. HTML: Tag Validation
   - Ensure tags properly nested
   - Used in: HTML validators

4. MATH: Expression Validation
   - Validate mathematical expressions
   - Used in: Calculator apps

YOUR INTERVIEW ANSWER:
"Every IDE uses this for bracket matching and syntax highlighting.
Push expected closing bracket, pop and compare."
```

## Daily Temperatures (Monotonic Stack)

```
LEETCODE: https://leetcode.com/problems/daily-temperatures/

REAL-WORLD APPLICATIONS:

1. FINANCE: Price Breakout Detection
   - Find next day price exceeds current
   - Used in: Trading algorithms

2. WEATHER: Heat Wave Prediction
   - Days until temperature drops
   - Used in: Weather apps

3. INVENTORY: Demand Forecasting
   - Days until demand exceeds current
   - Used in: Supply chain

YOUR INTERVIEW ANSWER:
"Stock trading algorithms use this pattern for breakout detection.
Monotonic decreasing stack, pop when current > stack top."
```

---

# 🔍 Binary Search

## Search in Rotated Sorted Array

```
LEETCODE: https://leetcode.com/problems/search-in-rotated-sorted-array/

REAL-WORLD APPLICATIONS:

1. LOGS: Circular Buffer Search
   - Search in rotating log files
   - Used in: Log management

2. TIME SERIES: Wrap-around Search
   - Search in circular time data
   - Used in: Clock/calendar systems

3. SCHEDULING: Shift Scheduling
   - Find available slot in rotating schedule
   - Used in: Workforce management

YOUR INTERVIEW ANSWER:
"Log rotation systems use this pattern for searching.
Modified binary search: determine which half is sorted, then search."
```

## Find First and Last Position

```
LEETCODE: https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/

REAL-WORLD APPLICATIONS:

1. DATABASE: Range Queries
   - Find all rows with value X
   - Used in: B-tree indexes

2. TEXT SEARCH: Word Positions
   - Find all occurrences of word
   - Used in: Document search

3. ANALYTICS: Time Range
   - Find events in time window
   - Used in: Log analysis

YOUR INTERVIEW ANSWER:
"Database range queries use lower/upper bound searches.
Two binary searches: one for first, one for last occurrence."
```

---

# 📖 Quick Reference

## Problem Category → Job Relevance

| Category       | High-Demand Roles       |
| -------------- | ----------------------- |
| Arrays/Strings | All SWE roles           |
| HashMap        | Backend, Full-stack     |
| Sliding Window | Infrastructure, Network |
| Binary Search  | Database, Search        |
| Trees          | File systems, Compilers |
| Graphs         | Social networks, Maps   |
| DP             | ML, Optimization        |
| Heaps          | Real-time systems       |

## Problems by Company

| Company   | Must-Know Problems                |
| --------- | --------------------------------- |
| Google    | Graph problems, DP                |
| Amazon    | Tree problems, System design      |
| Facebook  | Graph traversal (social networks) |
| Microsoft | String manipulation, DP           |
| Netflix   | Streaming/Window problems         |
| Uber      | Shortest path, Optimization       |

---

_Remember: Every problem you solve is used somewhere in production!_ 🌍


---

> **Navigation**: [< Previous](04_Pattern_Recognition.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06_Binary_Search_Patterns.md)