# 14 Mental Models — Production Reality Upgrade Log

Documents all Production Reality (PR) subsections added during the Combined Lens pedagogy upgrade. Each entry records named failure modes and debug workflows derived from real-world incidents and production engineering experience.

---

## 14_Mental_Models/00_INDEX.md

### Failure modes named
- MTTR spike when wrong mental model is selected for a problem class
- Problem misclassification leading to dead-end exploration paths

### Debug workflows
- Cross-check problem features against mental model preconditions before committing to an approach
- When MTTR spikes, audit the mental model selection decision point explicitly
- Fallback: enumerate all 6 mental model classes and check which preconditions match

---

## 14_Mental_Models/01_Recursion_Tree_Thinking.md

### Failure modes named
- Stack overflow in production JSON parser (Python recursive descent, 1000+ frames)
- Call-stack OOM on deep tree walks at scale
- Leap-of-faith failure: recursive solution passes local tests but fails on deep inputs in production
- Tail-call optimization missing in JVM languages causing stack爆炸

### Debug workflows
- Add tail-call recursion limit checks before deployment
- Convert to iterative with explicit stack when recursion depth is unbounded
- Profile stack frame size in production under load
- Add max-depth guards to recursive functions with clear error messages
- Run stress tests with inputs 10x expected production depth

---

## 14_Mental_Models/02_DP_State_Thinking.md

### Failure modes named
- DP table explosion: state space grows beyond memory for high-dimensional transitions
- Cache eviction misses: large DP tables evict working set from L3, degrading throughput
- State-transition exponential: incorrectly defined state leads to exponential rather than polynomial growth
- Initialization off-by-one: base case misaligned with transition logic

### Debug workflows
- Verify state space fits in available memory before production deployment
- Profile cache behavior with large DP tables (perf stat -e cache-misses)
- Print state transitions for small N to visually verify recurrence relation
- Check that memoization hits > 95% of subproblems before trusting performance

---

## 14_Mental_Models/03_Graph_Tree_Thinking.md

### Failure modes named
- Graph scale: billions of edges exhaust memory; naive adjacency matrix is impossible
- BFS memory blowup: visited set + queue for billion-node graphs exceeds RAM
- DFS recursion limit: recursive DFS on deep graphs (e.g., linked lists as graphs) overflows stack
- Graph mutation during iteration invalidates traversal state

### Debug workflows
- Choose adjacency list representation explicitly before writing traversal
- For billion-edge graphs, use streaming/ MapReduce-style graph processing
- Use iterative BFS/DFS with explicit stack/queue to avoid recursion limits
- Snapshot visited set as a bitset for memory efficiency on dense graphs
- Verify graph is DAG before running topological sort; detect cycles explicitly

---

## 14_Mental_Models/04_Array_String_Thinking.md

### Failure modes named
- Heartbleed buffer over-read: bounds check missing on production string operations
- Unicode NFC/NFD normalization mismatch: same string fails string equality check
- Cache locality miss: row-major vs column-major traversal causes 10x slowdown
- Pattern matching on non-ASCII strings produces wrong results (byte-level vs character-level)
- Off-by-one in substring search causes index-out-of-bounds on production input

### Debug workflows
- Always use language built-ins for Unicode normalization (Python unicodedata.normalize)
- Profile cache hits/misses when switching array traversal order
- Add explicit boundary checks for all string indexing before production
- Verify character encoding (UTF-8) at system boundary; do not assume

---

## 14_Mental_Models/05_Universal_Problem_Framework.md

### Failure modes named
- Incident = problem misclassification: treating a symptom as a root cause
- Query planner misclassification: wrong complexity estimate leads to wrong pattern selection
- Overfitting to a single problem instance: framework applied rigidly without adaptation

### Debug workflows
- Apply "5 Whys" root-cause analysis before committing to a solution pattern
- Validate complexity estimate with empirical profiling on production-scale input
- Cross-check against Polya's stages to ensure no stage is skipped under time pressure

---

## 14_Mental_Models/06_Implementation_Checklist.md

### Failure modes named
- Ariane 5 1996: 64-bit float to 16-bit int overflow — data conversion without validation
- Knight Capital KCG 2013: $440M loss in 45 minutes — legacy flag not deactivated in deployment
- Off-by-one error: loop boundary wrong; first or last element skipped in production
- Null vs undefined semantics: JavaScript null check missing causes production crash
- Integer overflow: max int exceeded in payment calculations

### Debug workflows
- Run static analysis (ESLint, PVS-Studio) before every deployment
- Add runtime type checks at system boundaries
- Audit all data conversions with explicit range validation
- Implement canary deployments to catch regression before full rollout
- Verify null/undefined handling explicitly for all API responses

---

## 14_Mental_Models/07_SQL_Mental_Pipeline.md

### Failure modes named
- N+1 query storm: ORM generates N+1 queries; database connection pool exhausted
- Missing index: full table scan on production query with millions of rows
- Query plan regression: new row count causes optimizer to choose sequential scan
- Query optimizer misestimates: outdated statistics cause catastrophic performance regression
- Deadlock under concurrent write load

### Debug workflows
- Enable slow query log (> 1 second threshold) in production
- Run EXPLAIN ANALYZE on all queries touching > 10K rows
- Verify index existence for all foreign keys and filter columns
- Profile connection pool utilization; detect pool exhaustion
- Monitor query plan changes on schema updates

---

## 14_Mental_Models/08_Debugging_DryRun.md

### Failure modes named
- Heisenbug: bug disappears or changes behavior when observed (debug print changes timing)
- Profiling-only failure: bug only reproduces under production load, not in dev
- Race condition: intermittent failure under concurrent requests; non-reproducible locally
- Async ordering bug: callbacks fire in unexpected order in production under load
- Memory corruption: stale pointer causes non-deterministic crash

### Debug workflows
- Use structured logging (not print statements) to avoid Heisenbug
- Replay production traffic in staging with real load profile
- Add deterministic ordering guarantees to async code; avoid reliance on event loop fairness
- Use memory sanitizers (ASAN, MSAN) to detect stale pointers before production
- Instrument timing deltas to capture race condition window

---

## 14_Mental_Models/09_Complexity_Intuition.md

### Failure modes named
- Big-O constant factor betrayal: O(n) with high constant is slower than O(n log n) for all realistic n
- Hash collision DOS: worst-case O(n) for hash table exploited by adversarial input
- Amortized worst-case abused: worst-case latency spike causes SLA breach
- Cached I/O invalidation: cached result returned for stale data

### Debug workflows
- Measure actual wall-clock time, not just algorithmic complexity
- Profile with adversarial inputs that trigger hash collisions
- Monitor p99 latency, not just average case
- Add cache invalidation timestamps to all cached computational results

---

## 14_Mental_Models/10_Interview_Thinking.md

### Failure modes named
- Candidate goes blank: freezes under pressure; no attempted solution
- Time mismanagement: spends 30 minutes on first problem, leaving no time for second
- Miscommunication: solves wrong problem due to unstated assumptions
- Under-articulation: correct solution not explained clearly enough to evaluator

### Debug workflows
- Pre-commit to time allocation per problem before entering the room
- Mirror back the problem statement to confirm understanding
- Narrate thought process continuously to avoid evaluation gaps
- Keep a "parking lot" list of unexplored approaches to revisit if stuck

---

## 14_Mental_Models/11_Greedy_vs_DP_Decision.md

### Failure modes named
- Greedy fail on {1,3,4} coin system: intuitive greedy (use largest first) produces suboptimal coin count
- Huffman distribution shift: optimal code tree becomes suboptimal when symbol frequencies change
- MST with negative-weight edges: some MST algorithms produce wrong results; edge case not handled
- Greedy boundary misjudgment: problem looks greedy but has hidden optimal substructure

### Debug workflows
- Always verify greedy correctness with a small counterexample before implementing
- Test Huffman tree with uniform, skewed, and adversarial frequency distributions
- Verify all edge weights are non-negative before using Prim's algorithm
- Run brute-force for N<=10 to establish ground truth before committing to greedy

---

## 14_Mental_Models/12_Space_Time_Tradeoffs.md

### Failure modes named
- Cache-line false sharing: two unrelated variables on same cache line cause ping-pong invalidation
- JVM warm-up: JIT compilation makes benchmarks before warm-up unrepresentative
- Hash collision DOS: adversarial key sequence triggers O(n) worst-case
- Bloom filter false positive: system logic assumes Bloom filter is exact, causing incorrect behavior
- Memory pressure: caching strategy improves hit rate but exhausts RAM under production load

### Debug workflows
- Add padding between cache-line-shared variables (cache_line_pad struct member)
- Warm up JVM for minimum 30 seconds before measuring throughput
- Use SipHash or cryptographic hash for untrusted input to prevent collision DOS
- Verify Bloom filter false positive rate with production input distribution
- Monitor memory usage and implement LRU eviction for cache entries

---

## 14_Mental_Models/13_Pattern_Composition.md

### Failure modes named
- Outer pattern wrong: entire composition invalidated because root pattern was misidentified
- Sliding-window + hashmap interaction bug: window shrinks while hashmap still holds stale keys
- Recursive + memoization off-by-one: base case boundary wrong across composition boundary
- Two-pointer + binary search interaction: pointer advancement invalidates search invariant

### Debug workflows
- Verify outer pattern independently before composing inner patterns
- Log window boundaries and hashmap state together to catch stale data
- Test composition on edge cases (empty input, single element, already-optimal)
- Add invariant assertions that fire in dev/test but compiled out in production

---

## 14_Mental_Models/14_Optimization_Pipeline.md

### Failure modes named
- Facebook News Feed fan-out O(n²): naive fan-out to all followers causes quadratic behavior at scale
- Brute O(n²) at scale: algorithm correct on test data but too slow at production scale (n=10⁸)
- Premature optimization: engineering time spent optimizing code that is not in the hot path
- Optimization introduces bug: micro-optimization breaks correctness

### Debug workflows
- Profile with production data size, not test data size
- Identify hot path with flamegraphs before optimizing anything
- Verify correctness on test data before and after every optimization
- Apply Amdahl's law to determine maximum achievable speedup

---

## 14_Mental_Models/15_System_Design_Thinking.md

### Failure modes named
- Netflix Cassandra multi-region split-brain: inconsistent reads after network partition
- Spotify CAP trade-off misapplication: chose consistency when availability was required; SLA violated
- Uber dispatch CAP: split-brain during partition causes duplicate driver assignment
- Cache-database incoherence: stale cache served after database update

### Debug workflows
- Document CAP choice explicitly for every data store; verify it matches SLA
- Implement idempotency keys for all distributed operations
- Add cache invalidation on every write path; never rely on TTL alone
- Run chaos engineering experiments to verify behavior under partition

---

## 14_Mental_Models/16_Distributed_Systems_Thinking.md

### Failure modes named
- S3 2017 typo: single-character typo in command caused massive data loss
- AWS US-East-1 2017: cascade failure across dependent services; recovery took hours
- DynamoDB Paxos implementation bug: leader election failed under specific partition pattern
- Idempotency collision: retry with same idempotency key produced duplicate side effects
- Clock skew causing event ordering violations across regions

### Debug workflows
- Use dry-run mode for all destructive distributed operations
- Implement idempotency with unique keys at the operation level
- Use logical clocks (Lamport timestamps) instead of wall-clock for ordering
- Test recovery procedures under simulated partition before deployment

---

## 14_Mental_Models/17_Frontend_Architecture_Thinking.md

### Failure modes named
- Next.js hydration mismatch: server-rendered HTML differs from client hydration; silent failure
- State location wrong: global state used where component-local was correct; performance killed
- Re-render storm: parent re-render triggers child cascade; O(n²) renders for n elements
- Memory leak from stale closures: event listener not cleaned up on component unmount

### Debug workflows
- Run React DevTools Profiler to identify unnecessary re-renders
- Verify server/client state matches before hydration; add hydration smoke tests
- Add cleanup functions for all event listeners and subscriptions
- Profile memory with DevTools Memory tab; detect closure-retained objects

---

## 14_Mental_Models/18_Production_Debugging_Thinking.md

### Failure modes named
- Knight Capital 2012: $440M loss in 45 minutes — legacy system reactivated without proper guards
- AWS US-East-1 2017: cascade failure; S3 metadata service disrupted
- GitLab 2017: production database deleted; 6 hours of data loss
- Cloudflare 2017: memory leak in parser caused data leakage across customer boundaries
- Facebook 2021: BGP misconfiguration took down global connectivity

### Debug workflows
- Audit all deployment activation/deactivation procedures; require sign-off
- Implement point-in-time recovery for all production databases; test monthly
- Run static analysis on network configuration before applying BGP changes
- Monitor memory usage with alerting; catch leaks before customer impact
- Implement circuit breakers to contain cascade failures

---

## 14_Mental_Models/20_Pattern_Trigger_Guide.md

### Failure modes named
- Rate-limit sliding-window misapplied: fixed window used where sliding window required; rate limit bypassed
- Hashmap cache stampede: many threads detect miss simultaneously and recompute; thundering herd
- Heap wrong K: max-heap used where min-heap was needed, or Kth element wrong due to 1-indexing
- Pattern misidentified: input signals suggest pattern X but correct pattern is Y

### Debug workflows
- Verify rate-limit algorithm matches the enforcement SLA precisely
- Add jitter to cache TTL and use lockGroups to prevent cache stampede
- Test heap with K=1, K=n, and K=n/2 to catch boundary errors
- Build a pre-check list per pattern to rule out false-positive triggers

---

## 14_Mental_Models/21_Competitive_Coding_Deep_Thinking.md

### Failure modes named
- TLE O(n²) at n=10⁵: algorithm passes local tests at small N but times out on judges
- Codeforces penalty: incorrect submission followed by time penalty; strategic error
- Missing fast I/O: C++ cin/cout without sync_with_stdio(false) causes TLE
- Contest SLA breach: problem solution correct but exceeds time limit on judge

### Debug workflows
- Test with n=10⁵ and worst-case distribution before submitting
- Enable fast I/O in C++ (ios::sync_with_stdio(false)) and Java (BufferedInputStream)
- Profile submission on worst-case input; set internal limit at 70% of TLE threshold
- Implement time budget tracking; abort and switch approach if > 50% time used

---

## 14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md

### Failure modes named
- Cloudflare 2019 ReDoS: catastrophic backtracking in regex caused outage
- Data structure migration edge case: new DS handles 99.9% of cases but fails on specific input
- Nested loop rewrite missed: optimization removed a guard condition inside nested loop
- Hashmap collision DOS: O(n²) re-emerges when adversarial input triggers worst-case hashing

### Debug workflows
- Analyze all regex for catastrophic backtracking before deployment (static analysis tools)
- Stress test new data structures with adversarial and boundary-case inputs
- Keep the original algorithm as a reference test; verify new algorithm matches for all test cases
- Use std::unordered_map with reserved bucket count to prevent rehash-related DOS