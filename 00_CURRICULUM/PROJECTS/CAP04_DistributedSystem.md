# 🏆 Capstone 4 — Distributed System Design

> **Semester:** 4 | **Week:** 16  
> **Estimated time:** 30 hours  
> **Format:** System Design Document + Partial Implementation  
> **Languages:** Java (Feed Service) · Python (ML Ranking) · SQL (MySQL + Oracle notes)

---

## 🎯 Business Requirement (The PM Brief)

*Design "PulseNews" — a social news feed platform where 10 million users can post articles, follow other users, and receive a personalized ranked feed. Target: P99 feed load < 200ms, 99.99% availability, support 50k writes/second at peak.*

---

## 📋 Part 1: System Design Document

### 1.1 Capacity Estimation

**Users:** 10M total, 1M Daily Active Users (DAU)  
**Writes:** Each user posts 1 article/day avg = 1M writes/day = ~12 writes/second avg, peak ~50k writes/second  
**Reads:** Each DAU refreshes feed 20 times/day = 20M reads/day = ~230 reads/second avg, peak ~100k reads/second  
**Storage:** Article avg 2KB × 1M/day × 365 days × 5 years = ~3.6TB/year

---

### 1.2 High-Level Architecture

```
┌───────────┐    ┌───────────┐    ┌────────────────────────────────────┐
│  Mobile   │    │   Web     │    │           API Gateway              │
│  App      │───►│  Browser  │───►│  (Rate Limiting, Auth, Routing)    │
└───────────┘    └───────────┘    └────────────┬───────────────────────┘
                                               │
              ┌────────────────────────────────┼─────────────────────────┐
              │                                │                          │
              ▼                                ▼                          ▼
    ┌─────────────────┐            ┌───────────────────┐     ┌──────────────────┐
    │  User Service   │            │  Article Service  │     │  Feed Service    │
    │  (Auth, Follow) │            │  (Post, Search)   │     │  (Read Feed)     │
    │  PostgreSQL     │            │  PostgreSQL +      │     │  Redis Cache     │
    └─────────────────┘            │  Elasticsearch    │     │  Kafka Consumer  │
                                   └────────┬──────────┘     └──────────────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │     Kafka        │
                                   │  (ArticlePosted) │
                                   └────────┬─────────┘
                                            │
                          ┌─────────────────┼──────────────────┐
                          ▼                 ▼                   ▼
              ┌──────────────────┐  ┌──────────────┐  ┌─────────────────┐
              │ Feed Fanout      │  │ Notification │  │  Analytics      │
              │ Service          │  │ Service      │  │  Service        │
              │ (Write fan-out   │  │ (Push/Email) │  │  (Clickstream)  │
              │  to followers)   │  └──────────────┘  └─────────────────┘
              └──────────────────┘
```

---

### 1.3 Data Models

```sql
-- User Service DB (PostgreSQL)
CREATE TABLE users (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(50)  UNIQUE NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    created_at  TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id),
    followee_id UUID NOT NULL REFERENCES users(id),
    followed_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id)
);

-- Article Service DB (PostgreSQL + Elasticsearch for search)
CREATE TABLE articles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id   UUID         NOT NULL REFERENCES users(id),
    title       TEXT         NOT NULL,
    body        TEXT         NOT NULL,
    tags        TEXT[]       DEFAULT '{}',
    likes_count INT          DEFAULT 0,
    views_count BIGINT       DEFAULT 0,
    published_at TIMESTAMPTZ DEFAULT now()
);

-- Feed Service — Redis Data Model (NOT SQL)
-- Key: "feed:{userId}"  Type: Sorted Set
-- Score: article published_at (Unix timestamp, newer = higher score)
-- Member: "{articleId}:{authorId}"
-- TTL: 24 hours — stale feeds are refreshed on next read
```

---

### 1.4 Feed Delivery Strategy: Hybrid Fan-Out

**Problem:** Two extremes fail at scale:
- **Pure Push (Fan-Out-on-Write):** On every article post, write to all N followers' feed lists. If a celebrity has 10M followers, 1 post = 10M Redis writes — catastrophic.
- **Pure Pull (Fan-Out-on-Read):** On every feed read, query all followees for recent articles. If a user follows 1000 people, 1 feed load = 1000 DB queries — catastrophic.

**Solution: Hybrid Fan-Out**
1. Regular users (<10k followers): Fan-out-on-write. When they post, FanoutService writes to all followers' Redis sorted sets.
2. Celebrities (>10k followers): Fan-out-on-read. Their articles are fetched directly and merged with the pre-computed feed at read time.

---

### 1.5 Ranking Algorithm (ML)

Instead of pure chronological feed, apply a ML ranking score:

```python
# Python — ArticleRanker
# score = f(recency, author_affinity, content_quality, engagement_rate)
import math

def rank_score(article, viewer, current_time):
    recency_hours = (current_time - article.published_at).total_seconds() / 3600
    recency_decay = math.exp(-recency_hours / 24)   # half-life of 24 hours
    
    affinity = viewer.author_affinity.get(article.author_id, 0.5)  # 0-1
    
    engagement = (article.likes + 3 * article.comments + 0.5 * article.views) \
                 / max(1, (current_time - article.published_at).total_seconds() / 3600)
    
    return (0.4 * recency_decay) + (0.4 * affinity) + (0.2 * min(engagement / 100, 1))
```

---

### 1.6 Caching Strategy

| Layer | Cache | TTL | What is cached |
|---|---|---|---|
| API Gateway | CDN (CloudFront) | 5 min | Public article content |
| Feed Service | Redis Sorted Set | 24h | Per-user feed list (article IDs) |
| Article Service | Redis Hash | 1h | Article metadata (title, author, likes) |
| User Service | Redis String | 15 min | User profile (follower count, etc.) |

**Cache invalidation:** On article update, delete Redis key. On like/view count update, use `HINCRBY` (atomic increment — no delete needed).

---

### 1.7 Database Sharding Strategy

**Problem:** `articles` table grows by 1M rows/day = 365M rows/year. Single PostgreSQL cannot handle this.

**Sharding key:** `author_id` — route all articles from the same author to the same shard (ensures efficient author-profile queries, keeps author's articles co-located).

**Shard count:** Start with 16 shards. Shard = `hash(author_id) % 16`.

**Oracle equivalent note:** Oracle RAC (Real Application Cluster) provides horizontal scalability without application-level sharding. For Oracle 19c, consider partitioning: `PARTITION BY HASH(author_id) PARTITIONS 16`.

---

## 📋 Part 2: Partial Implementation

### Feed Service — Java Spring Boot

```java
package com.pulsenews.feed;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class FeedService {
    
    private static final String FEED_KEY_PREFIX = "feed:";
    private static final int FEED_SIZE = 50; // articles per feed
    
    private final RedisTemplate<String, String> redis;
    private final ArticleServiceClient articleClient;
    private final UserServiceClient userClient;
    
    public FeedService(RedisTemplate<String, String> redis,
                       ArticleServiceClient articleClient,
                       UserServiceClient userClient) {
        this.redis = redis;
        this.articleClient = articleClient;
        this.userClient = userClient;
    }
    
    /**
     * Returns the ranked feed for a user.
     * Strategy: read pre-computed Redis feed; merge in celebrity posts; rank.
     * Time: O(F log F) where F = feed size (50)
     */
    public List<ArticleDto> getFeed(UUID userId, int page, int pageSize) {
        String feedKey = FEED_KEY_PREFIX + userId;
        
        // TODO: 1. Read top 100 article IDs from Redis sorted set (ZREVRANGE)
        // TODO: 2. Fetch metadata for each article from ArticleService (batch call)
        // TODO: 3. Merge in celebrity articles (users with >10k followers) via fan-out-on-read
        // TODO: 4. Apply ML ranking score (call Python ranking service via HTTP or compute inline)
        // TODO: 5. Return paginated slice [page*pageSize, (page+1)*pageSize]
        
        return List.of(); // placeholder
    }
    
    /**
     * Fan-out: when an article is published by a regular user, push to all followers' feeds.
     * Called by Kafka consumer on ArticlePosted event.
     */
    public void fanoutToFollowers(UUID authorId, String articleId, long publishedAtUnix) {
        // TODO: 1. Get all follower IDs for authorId from UserService
        // TODO: 2. For each follower, add articleId to their Redis sorted set
        //          key = "feed:{followerId}", score = publishedAtUnix, member = articleId
        // TODO: 3. Trim each feed to FEED_SIZE entries (keep newest)
        //          ZREMRANGEBYRANK feedKey, 0, -(FEED_SIZE + 1)
        // TODO: 4. If follower count > 10k: skip (celebrity fan-out-on-read handles this)
    }
}
```

### Kafka Consumer — `ArticlePostedConsumer.java`

```java
package com.pulsenews.feed.kafka;

import com.pulsenews.feed.FeedService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class ArticlePostedConsumer {
    
    private final FeedService feedService;
    public ArticlePostedConsumer(FeedService feedService) { this.feedService = feedService; }
    
    @KafkaListener(topics = "article-posted", groupId = "feed-fanout-service")
    public void consume(ConsumerRecord<String, ArticlePostedEvent> record) {
        var event = record.value();
        
        // Idempotency check: have we already processed this event?
        // TODO: check Redis "processed:{event.eventId}" — if exists, skip
        
        feedService.fanoutToFollowers(event.authorId(), event.articleId(), event.publishedAt());
        
        // Mark as processed
        // TODO: redis.opsForValue().set("processed:" + event.eventId(), "1", Duration.ofDays(7));
    }
}

record ArticlePostedEvent(String eventId, UUID authorId, String articleId, long publishedAt) {}
```

---

## 🔴 Key Design Decisions & Trade-offs

| Decision | Option A | Option B Chosen | Why |
|---|---|---|---|
| Feed delivery | Pure pull (fan-out-on-read) | **Hybrid** | Pure pull = N queries per load; pure push = celebrity storm |
| Feed storage | SQL table | **Redis Sorted Set** | O(log n) insert, O(1) range read; feeds are ephemeral |
| Article ranking | Chronological | **ML score** | Engagement-weighted ranking = 3x higher time-on-platform |
| DB sharding key | Timestamp (natural) | **author_id hash** | Timestamp creates hot partition (all new articles in one shard) |
| Celebrity threshold | 1k followers | **10k followers** | Balance: too low = unnecessary pull queries; too high = fan-out storms |

---

## 📊 Self-Assessment Rubric

| Criterion | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Capacity estimation | Not done | Numbers present but wrong | Reasonable estimates | Accurate with justification |
| Fan-out strategy | Not addressed | Naive push or pull only | Hybrid with threshold | Hybrid + celebrity identified |
| Caching layers | No cache | Redis mentioned | Per-layer strategy | TTL + invalidation strategy |
| Kafka idempotency | Not addressed | Mentioned | At-least-once handling | Exactly-once with dedup key |
| Partial implementation | Nothing | Stubs | FeedService + Kafka consumer | + Integration test |

---

[← Back to Semester 4 Guide](../../00_CURRICULUM/SEMESTER_4_GUIDE.md)
