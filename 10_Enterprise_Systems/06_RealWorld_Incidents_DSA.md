> **Navigation**: [< Previous](05_RealWorld_Problems_Part3.md) | [Back to Index](../00_MASTER_INDEX.md)

# 🔥 Real-Life Tech Incidents & DSA Lessons

## Learn From The Failures of Giants

---

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  WHY THIS FILE EXISTS                                                            ║
║                                                                                  ║
║  Every production disaster teaches fundamental DSA/System lessons:               ║
║  • Wrong data structure choice → System crash                                    ║
║  • Wrong algorithm complexity → Millions of dollars lost                         ║
║  • Missing edge cases → Data corruption                                          ║
║  • Poor concurrency handling → Race conditions                                   ║
║                                                                                  ║
║  This file: Real incidents → Root cause → DSA lesson → Your takeaway             ║
║                                                                                  ║
║  START DATE: February 10, 2026                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

# ═══════════════════════════════════════════════════════════

# 📌 Part 1: Data Structure Disasters

# ═══════════════════════════════════════════════════════════

## 🔴 Incident 1: Twitter's Fail Whale (2008-2010)

### What Happened

Twitter became famous for its "Fail Whale" error page. The site crashed constantly during peak hours.

### The DSA Problem

```
WRONG APPROACH:
────────────────
- Every user's home timeline was computed ON EACH REQUEST
- Query: "Get tweets from all users I follow, sort by time"
- For users following 5000 people → DISASTER

PSEUDO-CODE OF THE PROBLEM:
def get_timeline(user_id):
    following = get_following_list(user_id)  # O(1)
    tweets = []
    for followed_user in following:          # O(n) where n = following count
        user_tweets = get_recent_tweets(followed_user)  # O(m) DB query
        tweets.extend(user_tweets)
    tweets.sort(key=lambda x: x.timestamp)   # O(k log k) where k = total tweets
    return tweets[:200]

TOTAL: O(n) DB queries + O(k log k) sorting PER REQUEST
For celebrity users following 10000 people = MELTDOWN
```

### The Fix (Fan-out on Write)

```
NEW APPROACH WITH CORRECT DATA STRUCTURE:
─────────────────────────────────────────
Instead of computing timeline on read, PRE-COMPUTE on write.

When user tweets:
1. Get their follower list
2. Push tweet to each follower's timeline cache (Redis List)

DATA STRUCTURE: Redis List for each user's timeline
                (capped at ~800 tweets)

def post_tweet(user_id, tweet):
    # Write to main storage
    save_tweet(tweet)

    # Fan out to followers' timelines
    followers = get_followers(user_id)
    for follower in followers:
        # Push to beginning of Redis list (O(1))
        redis.lpush(f"timeline:{follower}", tweet_id)
        # Trim to keep size manageable
        redis.ltrim(f"timeline:{follower}", 0, 799)

def get_timeline(user_id):
    # Just read from pre-computed cache - O(1)!
    tweet_ids = redis.lrange(f"timeline:{user_id}", 0, 199)
    return fetch_tweets(tweet_ids)
```

### DSA Lesson

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LESSON: TRADE-OFF - Read-Heavy vs Write-Heavy                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ READ-HEAVY APPROACH (Original Twitter):                                     │
│   Write: O(1)                                                               │
│   Read:  O(n × m + k log k) - DISASTER for high-follow users                │
│                                                                             │
│ WRITE-HEAVY APPROACH (Fixed Twitter):                                       │
│   Write: O(followers) - Push to each follower's list                        │
│   Read:  O(1) - Just read from cache                                        │
│                                                                             │
│ WHEN TO USE WHAT:                                                           │
│   • Reads >> Writes → Pre-compute on write (caching, denormalization)       │
│   • Writes >> Reads → Compute on read (logs, analytics)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Incident 2: Amazon's 2-Second Rule

### The Discovery

Amazon found that every 100ms of latency cost them 1% in sales.
Page load > 2 seconds = significant cart abandonment.

### The DSA Problem

```
PRODUCT RECOMMENDATION SYSTEM - BEFORE:
───────────────────────────────────────
def get_recommendations(user_id):
    # Get user's purchase history
    history = db.query("SELECT * FROM purchases WHERE user_id = ?", user_id)

    # For EACH purchased product, find similar products
    similar = []
    for product in history:                    # O(n) products
        similar_products = db.query(           # O(m) DB query EACH TIME
            "SELECT * FROM products WHERE category = ?",
            product.category
        )
        similar.extend(similar_products)

    # Remove duplicates and sort by popularity
    similar = list(set(similar))               # O(k)
    similar.sort(key=lambda x: x.popularity)   # O(k log k)

    return similar[:10]

PROBLEM: N+1 query pattern + O(k log k) sort ON EVERY PAGE LOAD
```

### The Fix

```java
/**
 * SOLUTION: Pre-computed similarity matrix + Heap for Top-K
 *
 * 1. OFFLINE: Build similarity graph using collaborative filtering
 * 2. ONLINE: Use Min-Heap for efficient Top-K retrieval
 */

// Pre-computed similarity stored in HashMap<ProductId, PriorityQueue>
// Each product maps to a min-heap of its top 100 similar products

public class RecommendationEngine {

    // Similarity score stored as negative for min-heap to act as max-heap
    private Map<String, PriorityQueue<ProductScore>> similarityCache;

    // O(1) lookup + O(k log k) merge where k is small (user's history size)
    public List<Product> getRecommendations(String userId, int limit) {
        List<String> recentPurchases = getRecentPurchases(userId, 10);

        // Max-heap to merge recommendations
        PriorityQueue<ProductScore> mergedHeap = new PriorityQueue<>(
            (a, b) -> Double.compare(b.score, a.score)  // Max-heap
        );

        Set<String> seen = new HashSet<>();

        for (String productId : recentPurchases) {
            PriorityQueue<ProductScore> similar = similarityCache.get(productId);
            if (similar != null) {
                for (ProductScore ps : similar) {
                    if (!seen.contains(ps.productId)) {
                        mergedHeap.offer(ps);
                        seen.add(ps.productId);
                    }
                }
            }
        }

        // Extract top K
        List<Product> result = new ArrayList<>();
        while (!mergedHeap.isEmpty() && result.size() < limit) {
            result.add(getProduct(mergedHeap.poll().productId));
        }

        return result;
    }
}
```

### DSA Lesson

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LESSON: HEAP FOR TOP-K PROBLEMS                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ WRONG: Sort entire dataset, take first K → O(n log n)                       │
│ RIGHT: Use Heap → O(n log k) or even O(k log k) with preprocessing          │
│                                                                             │
│ TOP-K PATTERNS:                                                             │
│   • K largest  → Min-Heap of size K (reject if smaller than min)            │
│   • K smallest → Max-Heap of size K (reject if larger than max)             │
│                                                                             │
│ WHEN YOU SEE "Top 10", "K most frequent", "K nearest"                       │
│ → IMMEDIATELY think HEAP                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Incident 3: LinkedIn's Search Disaster

### What Happened

LinkedIn's people search became unusably slow as they grew to millions of users.

### The Problem

```
NAIVE SEARCH IMPLEMENTATION:
────────────────────────────
def search_people(query):
    results = []
    for user in all_users:                    # O(n) - millions of users!
        if query.lower() in user.name.lower():
            results.append(user)
    return results[:20]

At 500 million users: 500 MILLION string comparisons per search!
```

### The Fix: Inverted Index + Trie

```java
/**
 * SOLUTION: Inverted Index + Trie for autocomplete
 *
 * Inverted Index: word → list of document IDs containing that word
 * Trie: For prefix-based autocomplete
 */

public class SearchEngine {

    // Inverted Index: Maps each word to set of user IDs
    private Map<String, Set<Long>> invertedIndex = new HashMap<>();

    // Trie for autocomplete
    private Trie autocompleteTrie = new Trie();

    // Called when user profile is created/updated - O(words in profile)
    public void indexUser(User user) {
        String[] words = tokenize(user.name + " " + user.headline);

        for (String word : words) {
            // Add to inverted index
            invertedIndex.computeIfAbsent(word.toLowerCase(),
                k -> new HashSet<>()).add(user.id);

            // Add to trie for autocomplete
            autocompleteTrie.insert(word.toLowerCase());
        }
    }

    // Search - O(query words × result set operations)
    public List<User> search(String query) {
        String[] queryWords = tokenize(query);

        Set<Long> results = null;

        for (String word : queryWords) {
            Set<Long> wordResults = invertedIndex.get(word.toLowerCase());

            if (wordResults == null) {
                return Collections.emptyList();  // Word not found
            }

            if (results == null) {
                results = new HashSet<>(wordResults);
            } else {
                results.retainAll(wordResults);  // Intersection
            }
        }

        return results.stream()
            .limit(20)
            .map(this::getUser)
            .collect(Collectors.toList());
    }

    // Autocomplete - O(prefix length + k results)
    public List<String> autocomplete(String prefix, int limit) {
        return autocompleteTrie.getWordsWithPrefix(prefix, limit);
    }
}
```

### DSA Lesson

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LESSON: INVERTED INDEX + TRIE FOR SEARCH                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ BRUTE FORCE SEARCH: O(documents × avg_document_length) per query            │
│ INVERTED INDEX:     O(query_words × result_set_size)                        │
│                                                                             │
│ TRIE FOR AUTOCOMPLETE:                                                      │
│   • Insert: O(word length)                                                  │
│   • Search prefix: O(prefix length + results)                               │
│                                                                             │
│ WHEN YOU SEE:                                                               │
│   • "Search" → Think Inverted Index                                         │
│   • "Autocomplete/Prefix" → Think Trie                                      │
│   • "Dictionary/Spell check" → Think Trie                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Incident 4: Cloudflare's Leap Second Bug (2017)

### What Happened

On January 1, 2017, a leap second caused Cloudflare's DNS to fail.

### The Problem

```go
// The buggy code (simplified Go)
func measureLatency(start, end time.Time) float64 {
    // PROBLEM: Leap second made end < start!
    duration := end.Sub(start)

    // CRASH: Can't take sqrt of negative number
    return math.Sqrt(float64(duration))
}

// During leap second: end = 23:59:60, then time "went back"
// making (end - start) negative
```

### The Fix

```go
// Fixed version with edge case handling
func measureLatency(start, end time.Time) float64 {
    duration := end.Sub(start)

    // Handle edge case: time going backward
    if duration < 0 {
        duration = 0  // Or use absolute value depending on use case
    }

    return math.Sqrt(float64(duration))
}

// Better: Use monotonic clock that never goes backward
func measureLatencyMonotonic(start, end time.Time) float64 {
    // In Go, time.Since() uses monotonic clock automatically
    duration := time.Since(start)
    return math.Sqrt(float64(duration))
}
```

### DSA Lesson

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LESSON: ALWAYS HANDLE EDGE CASES                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ COMMON EDGE CASES TO CHECK:                                                 │
│                                                                             │
│ ARRAYS/STRINGS:                                                             │
│   • Empty array/string                                                      │
│   • Single element                                                          │
│   • All same elements                                                       │
│   • Negative numbers                                                        │
│   • Overflow (Integer.MAX_VALUE + 1)                                        │
│                                                                             │
│ TIME/DATES:                                                                 │
│   • Leap years (Feb 29)                                                     │
│   • Leap seconds                                                            │
│   • Timezone changes (DST)                                                  │
│   • End of year (Dec 31 → Jan 1)                                            │
│   • Time going backward (NTP sync, leap seconds)                            │
│                                                                             │
│ LINKED LISTS:                                                               │
│   • Null head                                                               │
│   • Single node                                                             │
│   • Cycle exists                                                            │
│                                                                             │
│ TREES:                                                                      │
│   • Null root                                                               │
│   • Single node                                                             │
│   • Completely left/right skewed                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# ═══════════════════════════════════════════════════════════

# 📈 Part 2: Algorithm Complexity Disasters

# ═══════════════════════════════════════════════════════════

## 🔴 Incident 5: Knight Capital - $440 Million in 45 Minutes

### What Happened (2012)

A deployment bug caused an infinite loop in their trading algorithm. They lost $440 million before anyone could stop it.

### The Algorithm Problem

```
THE BUG - INFINITE LOOP:
─────────────────────────
// Old code (should have been removed):
while (hasMoreOrders()) {
    processOrder();  // No exit condition!
}

// The deployment reactivated this code path
// No circuit breaker, no rate limiting

WHAT SHOULD HAVE EXISTED:
// Rate limiting with Token Bucket algorithm
class RateLimiter {
    private int tokens = 100;        // Max burst
    private long lastRefill = now();
    private int refillRate = 10;     // tokens per second

    boolean allowRequest() {
        refillTokens();
        if (tokens > 0) {
            tokens--;
            return true;
        }
        return false;  // REJECT - too many requests
    }

    void refillTokens() {
        long elapsed = now() - lastRefill;
        tokens = min(100, tokens + elapsed * refillRate);
        lastRefill = now();
    }
}
```

### DSA Lesson: Rate Limiting Algorithms

```java
/**
 * TOKEN BUCKET ALGORITHM
 * WHY: Control rate of operations (API calls, trades, etc.)
 * HOW: Tokens refill at constant rate, each operation consumes a token
 */
public class TokenBucket {
    private final int maxTokens;
    private final int refillRate;  // tokens per second
    private double tokens;
    private long lastRefillTime;

    public TokenBucket(int maxTokens, int refillRate) {
        this.maxTokens = maxTokens;
        this.refillRate = refillRate;
        this.tokens = maxTokens;
        this.lastRefillTime = System.currentTimeMillis();
    }

    public synchronized boolean tryConsume() {
        refill();
        if (tokens >= 1) {
            tokens -= 1;
            return true;
        }
        return false;
    }

    private void refill() {
        long now = System.currentTimeMillis();
        double secondsElapsed = (now - lastRefillTime) / 1000.0;
        tokens = Math.min(maxTokens, tokens + secondsElapsed * refillRate);
        lastRefillTime = now;
    }
}

/**
 * SLIDING WINDOW COUNTER
 * WHY: More accurate rate limiting for APIs
 * HOW: Track requests in current and previous window, interpolate
 */
public class SlidingWindowRateLimiter {
    private final int limit;
    private final long windowSizeMs;
    private int previousCount;
    private int currentCount;
    private long windowStart;

    public synchronized boolean allowRequest() {
        long now = System.currentTimeMillis();
        long currentWindow = now / windowSizeMs;
        long previousWindow = windowStart / windowSizeMs;

        if (currentWindow != previousWindow) {
            previousCount = currentCount;
            currentCount = 0;
            windowStart = now;
        }

        // Calculate weighted count
        double elapsedRatio = (now % windowSizeMs) / (double) windowSizeMs;
        double weight = (1 - elapsedRatio) * previousCount + currentCount;

        if (weight < limit) {
            currentCount++;
            return true;
        }
        return false;
    }
}
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LESSON: CIRCUIT BREAKERS & RATE LIMITERS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ CIRCUIT BREAKER PATTERN:                                                    │
│   CLOSED → OPEN (after N failures) → HALF-OPEN (test) → CLOSED              │
│                                                                             │
│ RATE LIMITING ALGORITHMS:                                                   │
│   • Token Bucket (allows bursts)                                            │
│   • Leaky Bucket (constant rate)                                            │
│   • Fixed Window (simple but spike at boundaries)                           │
│   • Sliding Window (most accurate)                                          │
│                                                                             │
│ ALWAYS HAVE:                                                                │
│   • Maximum iteration limits in loops                                       │
│   • Timeout for any blocking operation                                      │
│   • Rate limits for any repeated operation                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Incident 6: Reddit's "Hug of Death"

### What Happened

Small websites linked from Reddit's front page would crash due to traffic spike.

### The Problem

```
NAIVE CACHING (Cache-aside pattern):
───────────────────────────────────
def get_article(article_id):
    # Check cache first
    cached = cache.get(article_id)
    if cached:
        return cached

    # Cache miss - hit database
    article = db.query("SELECT * FROM articles WHERE id = ?", article_id)

    # Store in cache
    cache.set(article_id, article, ttl=300)

    return article

PROBLEM: Cache expires → 10,000 concurrent requests → 10,000 DB queries!
This is called "CACHE STAMPEDE" or "THUNDERING HERD"
```

### The Fix

```java
/**
 * SOLUTION 1: Locking (Mutex)
 * Only one thread fetches from DB, others wait
 */
public Article getArticleWithLock(String articleId) {
    Article article = cache.get(articleId);
    if (article != null) return article;

    // Acquire lock
    String lockKey = "lock:" + articleId;
    if (redisLock.acquire(lockKey, 5000)) {  // 5 second timeout
        try {
            // Double check after acquiring lock
            article = cache.get(articleId);
            if (article != null) return article;

            // Fetch from DB
            article = db.getArticle(articleId);
            cache.set(articleId, article, 300);
            return article;
        } finally {
            redisLock.release(lockKey);
        }
    } else {
        // Someone else is fetching, wait and retry
        Thread.sleep(100);
        return getArticleWithLock(articleId);
    }
}

/**
 * SOLUTION 2: Probabilistic Early Expiration
 * Refresh cache before it actually expires
 */
public Article getArticleEarlyRefresh(String articleId) {
    CacheEntry entry = cache.getWithMetadata(articleId);

    if (entry == null) {
        // Cold start - fetch and cache
        return fetchAndCache(articleId);
    }

    // Probabilistically refresh before expiry
    double ttlRemaining = entry.getTTLRemainingRatio();
    double refreshProbability = Math.exp(-10 * ttlRemaining);

    if (Math.random() < refreshProbability) {
        // Refresh in background
        CompletableFuture.runAsync(() -> fetchAndCache(articleId));
    }

    return entry.getValue();
}
```

### DSA Lesson

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LESSON: CACHING STRATEGIES & PROBLEMS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ CACHE PROBLEMS:                                                             │
│   • Cache Stampede: Many requests hit DB when cache expires                 │
│   • Cache Penetration: Queries for non-existent data bypass cache           │
│   • Cache Breakdown: Hot key expires, all requests hit DB                   │
│                                                                             │
│ SOLUTIONS:                                                                  │
│   • Stampede → Locking or probabilistic early refresh                       │
│   • Penetration → Cache negative results (null) with short TTL              │
│   • Breakdown → Never expire hot keys, refresh in background                │
│                                                                             │
│ LRU CACHE IMPLEMENTATION (Interview favorite):                              │
│   • HashMap for O(1) lookup                                                 │
│   • Doubly Linked List for O(1) update recency                              │
│   • Combined: O(1) for all operations                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Incident 7: Spotify's Shuffle Wasn't Random

### What Happened

Users complained Spotify's shuffle wasn't random—they'd hear songs from the same artist back-to-back.

### The Problem

```python
# True random CAN have clusters
import random
playlist = ['A1', 'A2', 'A3', 'B1', 'B2', 'C1', 'D1', 'D2', 'D3', 'D4']
random.shuffle(playlist)
# Possible result: ['D1', 'D2', 'D3', 'A1', 'A2', 'A3', 'D4', 'B1', 'B2', 'C1']
# Three D songs in a row! Three A songs in a row!
# Mathematically random, but FEELS non-random to humans
```

### The Fix: Fisher-Yates with Spacing Constraint

```java
/**
 * SOLUTION: Modified shuffle with artist spacing
 *
 * Algorithm: Place songs ensuring minimum gap between same-artist songs
 * Data Structure: Priority Queue (Max-Heap by remaining songs per artist)
 */
public class SmartShuffle {

    public List<Song> shuffleWithConstraint(List<Song> songs, int minGap) {
        // Group by artist
        Map<String, Queue<Song>> byArtist = new HashMap<>();
        for (Song song : songs) {
            byArtist.computeIfAbsent(song.artist, k -> new LinkedList<>())
                    .offer(song);
        }

        // Max-heap: artist with most songs gets priority
        PriorityQueue<Map.Entry<String, Queue<Song>>> heap = new PriorityQueue<>(
            (a, b) -> b.getValue().size() - a.getValue().size()
        );
        heap.addAll(byArtist.entrySet().stream()
            .filter(e -> !e.getValue().isEmpty())
            .collect(Collectors.toList()));

        List<Song> result = new ArrayList<>();
        Queue<Map.Entry<String, Queue<Song>>> cooldown = new LinkedList<>();

        while (!heap.isEmpty() || !cooldown.isEmpty()) {
            // Re-add from cooldown if gap satisfied
            while (!cooldown.isEmpty() &&
                   result.size() - cooldown.peek().getValue().size() >= minGap) {
                Map.Entry<String, Queue<Song>> entry = cooldown.poll();
                if (!entry.getValue().isEmpty()) {
                    heap.offer(entry);
                }
            }

            if (heap.isEmpty()) {
                // Can't satisfy constraint - just add remaining
                while (!cooldown.isEmpty()) {
                    result.add(cooldown.poll().getValue().poll());
                }
                break;
            }

            // Take song from artist with most remaining
            Map.Entry<String, Queue<Song>> entry = heap.poll();
            result.add(entry.getValue().poll());

            // Put artist in cooldown
            cooldown.offer(entry);
        }

        return result;
    }
}
```

### DSA Lesson

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LESSON: CONSTRAINED RANDOM PLACEMENT                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PROBLEM TYPE: "Arrange items with minimum gap between same category"        │
│                                                                             │
│ SIMILAR PROBLEMS:                                                           │
│   • Task Scheduler (LC 621) - CPU cooling time between same tasks           │
│   • Reorganize String (LC 767) - No adjacent same characters                │
│   • Distant Barcodes (LC 1054) - No adjacent same barcodes                  │
│                                                                             │
│ PATTERN:                                                                    │
│   1. Count frequency of each category                                       │
│   2. Use Max-Heap (most frequent first)                                     │
│   3. Cooldown queue for gap enforcement                                     │
│   4. If heap empty but cooldown not → impossible                            │
│                                                                             │
│ TIME: O(n log k) where k = number of categories                             │
│ SPACE: O(k)                                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# ═══════════════════════════════════════════════════════════

# 🔀 Part 3: Concurrency Disasters

# ═══════════════════════════════════════════════════════════

## 🔴 Incident 8: Therac-25 Radiation Machine (1985-1987)

### What Happened

A race condition in medical radiation equipment killed 3 patients and injured 3 more.

### The Problem

```
RACE CONDITION IN CRITICAL SYSTEM:
──────────────────────────────────
Two concurrent processes:
1. UI Process: Read operator settings
2. Control Process: Set radiation parameters

The code:
if (operator_changed_setting) {
    load_new_parameters();  // Takes time
}
apply_radiation();

BUG: If operator changed setting WHILE parameters were loading,
     old parameters were applied with new dose setting
     → Lethal radiation dose
```

### The Fix Pattern

```java
/**
 * THREAD-SAFE STATE MANAGEMENT
 *
 * Patterns:
 * 1. Immutable objects
 * 2. Atomic operations
 * 3. Lock-based synchronization
 * 4. State validation before action
 */

// PATTERN 1: Immutable Configuration
public final class RadiationConfig {
    private final int dose;
    private final String mode;
    private final long timestamp;

    public RadiationConfig(int dose, String mode) {
        this.dose = dose;
        this.mode = mode;
        this.timestamp = System.currentTimeMillis();
    }

    // Only getters, no setters
    // To change, create new object
}

// PATTERN 2: Atomic Reference
public class SafeRadiationController {
    private final AtomicReference<RadiationConfig> config =
        new AtomicReference<>();

    public void updateConfig(RadiationConfig newConfig) {
        // Atomic swap
        config.set(newConfig);
    }

    public void applyRadiation() {
        // Get snapshot - immutable, so safe to use
        RadiationConfig snapshot = config.get();

        // Validate before applying
        if (isConfigValid(snapshot)) {
            apply(snapshot);
        }
    }
}

// PATTERN 3: Two-Phase Commit
public class TwoPhaseController {
    private RadiationConfig pendingConfig;
    private RadiationConfig activeConfig;
    private final ReentrantLock lock = new ReentrantLock();

    public void prepareConfig(RadiationConfig config) {
        lock.lock();
        try {
            // Validate
            if (isValid(config)) {
                pendingConfig = config;
            }
        } finally {
            lock.unlock();
        }
    }

    public void commitConfig() {
        lock.lock();
        try {
            if (pendingConfig != null) {
                activeConfig = pendingConfig;
                pendingConfig = null;
            }
        } finally {
            lock.unlock();
        }
    }

    public void apply() {
        lock.lock();
        try {
            if (activeConfig != null) {
                doApply(activeConfig);
            }
        } finally {
            lock.unlock();
        }
    }
}
```

### DSA Lesson

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LESSON: THREAD SAFETY PATTERNS                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ RACE CONDITION: Two threads access shared data, at least one writes         │
│                                                                             │
│ SOLUTIONS:                                                                  │
│                                                                             │
│ 1. IMMUTABILITY                                                             │
│    → Object can't change after creation                                     │
│    → Thread-safe by design                                                  │
│    → String, Integer in Java                                                │
│                                                                             │
│ 2. ATOMIC OPERATIONS                                                        │
│    → AtomicInteger, AtomicReference                                         │
│    → Compare-and-swap (CAS) operations                                      │
│    → Lock-free, high performance                                            │
│                                                                             │
│ 3. SYNCHRONIZATION                                                          │
│    → synchronized keyword                                                   │
│    → ReentrantLock                                                          │
│    → ReadWriteLock (multiple readers OR single writer)                      │
│                                                                             │
│ 4. THREAD-LOCAL STORAGE                                                     │
│    → Each thread has its own copy                                           │
│    → No sharing = no race condition                                         │
│                                                                             │
│ INTERVIEW TIP: Always mention trade-offs:                                   │
│    Immutability → Memory overhead (new objects)                             │
│    Locks → Potential deadlock, performance impact                           │
│    Atomic → Only works for simple operations                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Incident 9: Uber's Surge Pricing Bug

### What Happened

During New Year's Eve, Uber's surge pricing showed different prices to users who requested at the same time.

### The Problem

```
INCONSISTENT READ DUE TO REPLICATION LAG:
────────────────────────────────────────
Write → Primary DB → Replicas (async, slight delay)

User A requests price:
  → Hits Replica 1 (has new surge = 3.5x)
  → Shows $35

User B requests price (same moment):
  → Hits Replica 2 (still has old surge = 2.0x)
  → Shows $20

Same ride, same time, different prices!
```

### The Fix

```java
/**
 * SOLUTIONS FOR EVENTUAL CONSISTENCY PROBLEMS
 */

// SOLUTION 1: Read-Your-Writes Consistency
public class SurgeService {

    // After write, read from primary for that user
    public void updateSurgePrice(String region, double multiplier) {
        // Write to primary
        primaryDb.write("surge:" + region, multiplier);

        // Record version in user session
        sessionStore.set(userId, "lastSurgeVersion", getVersion());
    }

    public double getSurgePrice(String region, String userId) {
        long userVersion = sessionStore.get(userId, "lastSurgeVersion");
        long replicaVersion = getReplicaVersion();

        if (userVersion > replicaVersion) {
            // User's write not yet replicated, read from primary
            return primaryDb.read("surge:" + region);
        } else {
            // Safe to read from replica
            return replicaDb.read("surge:" + region);
        }
    }
}

// SOLUTION 2: Bounded Staleness
public double getSurgePriceBounded(String region) {
    CachedValue value = cache.get("surge:" + region);

    // Accept if less than 5 seconds old
    if (value != null && value.age() < 5000) {
        return value.getValue();
    }

    // Otherwise, read from primary
    return primaryDb.read("surge:" + region);
}

// SOLUTION 3: Version Vectors for Conflict Resolution
public class VersionedSurge {
    private double multiplier;
    private Map<String, Long> versionVector;  // node → version

    public VersionedSurge merge(VersionedSurge other) {
        // Compare version vectors to determine which is newer
        // or if they're concurrent (conflict)
        if (this.versionVector.happensBefore(other.versionVector)) {
            return other;
        } else if (other.versionVector.happensBefore(this.versionVector)) {
            return this;
        } else {
            // Concurrent - need conflict resolution
            // e.g., take maximum (conservative for surge pricing)
            return new VersionedSurge(
                Math.max(this.multiplier, other.multiplier),
                mergeVectors(this.versionVector, other.versionVector)
            );
        }
    }
}
```

### DSA Lesson

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LESSON: CAP THEOREM & CONSISTENCY LEVELS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ CAP THEOREM: Can only have 2 of 3:                                          │
│   C - Consistency (all nodes see same data)                                 │
│   A - Availability (every request gets response)                            │
│   P - Partition tolerance (system works despite network issues)             │
│                                                                             │
│ CONSISTENCY LEVELS:                                                         │
│   • Strong: All reads see latest write (like single server)                 │
│   • Eventual: Reads eventually see latest write (replicated DBs)            │
│   • Causal: If A causes B, everyone sees A before B                         │
│   • Read-your-writes: You see your own writes immediately                   │
│                                                                             │
│ INTERVIEW: When discussing distributed systems, ALWAYS mention:             │
│   1. What consistency level is needed?                                      │
│   2. What's the latency vs consistency trade-off?                           │
│   3. How do you handle conflicts?                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# ═══════════════════════════════════════════════════════════

# 📖 Part 4: Quick Reference — Incident to DSA Mapping

# ═══════════════════════════════════════════════════════════

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                            INCIDENT TO DSA LESSON MAPPING                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ INCIDENT                          │ DSA LESSON                         │ KEY PATTERN         │
│ ──────────────────────────────────────────────────────────────────────────────────────────   │
│ Twitter Fail Whale                │ Read vs Write optimization         │ Fan-out on write    │
│ Amazon 2-Second Rule              │ Heap for Top-K                     │ Priority Queue      │
│ LinkedIn Search                   │ Inverted Index + Trie              │ Search optimization │
│ Cloudflare Leap Second           │ Edge case handling                  │ Defensive coding    │
│ Knight Capital                    │ Rate limiting                      │ Token Bucket        │
│ Reddit Hug of Death               │ Caching strategies                 │ LRU Cache           │
│ Spotify Shuffle                   │ Constrained placement              │ Heap + Cooldown     │
│ Therac-25 Radiation               │ Thread safety                      │ Atomic operations   │
│ Uber Surge Pricing                │ Distributed consistency            │ Version vectors     │
│ GitLab Deletion                   │ Backup verification                │ Failsafe design     │
│ Marriott Breach                   │ Security + Auditing                │ Principle of least  │
│                                   │                                    │ privilege           │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Interview Discussion Framework

When discussing an incident in an interview:

```
1. DESCRIBE the incident briefly (30 seconds)
   "In 2012, Knight Capital lost $440 million in 45 minutes due to..."

2. IDENTIFY the technical root cause (1 minute)
   "The issue was an infinite loop without..."

3. EXPLAIN the DSA/System concept (1-2 minutes)
   "This highlights the importance of rate limiting. The Token Bucket
    algorithm works by..."

4. DESCRIBE the fix (1 minute)
   "The solution involves..."

5. RELATE to your own experience (30 seconds)
   "In my projects, I always implement..."
```

---

_"Those who cannot remember the past are condemned to repeat it."_
_— Learn from others' mistakes. They've already paid the price._


---

> **Navigation**: [< Previous](05_RealWorld_Problems_Part3.md) | [Back to Index](../00_MASTER_INDEX.md)