> **Navigation**: [← Computer Vision](11_Computer_Vision_CNNs.md) | [Back to Index](00_INDEX.md) | [Next → MLOps](13_MLOps_Production.md)

# 🎯 Recommender Systems — Progressive Mastery Guide

> _"The algorithm that decides what 3 billion people see next. Netflix, YouTube, Spotify, TikTok — built on the same core math: matrix factorization and learned embeddings."_

---

# PART 0: The 5W+H Framework

| Question  | Recommender Systems Context                                                                                                                                                    |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WHAT**  | Systems that predict what a user will be interested in, from a catalog of items (movies, songs, products, videos).                                                             |
| **WHY**   | Infinite content, limited time. Without recommendations, users face the "paradox of choice." Netflix: 80% of watched content comes from recommendations.                       |
| **WHEN**  | Any platform with users, items, and interaction data (clicks, watches, purchases, ratings).                                                                                    |
| **WHERE** | Netflix (movie rec), YouTube (video rec), Spotify (music rec), Amazon (product rec), TikTok (feed rec).                                                                        |
| **WHO**   | Netflix Prize (2009, 1M prize for best collaborative filter) → Word2Vec for items (2013) → Two-Tower neural models (Google/YouTube, 2016) → Today's transformer-based systems. |
| **HOW**   | Find patterns in who liked what, then use those patterns to predict what a new user will like.                                                                                 |

---

# PART 1: The Core Problem

---

```
SETUP:
  U users, I items, R ratings matrix
  R[u][i] = rating user u gave item i (often missing — most users rate very few items)

  User-Item Matrix (★ = rated, ? = unknown):
       Item1  Item2  Item3  Item4
  U1:    5      3      ?      1
  U2:    4      ?      ?      1
  U3:    1      1      ?      5
  U4:    ?      1      5      4
  U5:    ?      ?      4      ?

  GOAL: Fill in the '?' values (predict unseen ratings).
  Then recommend items with highest predicted rating for each user.

  ANALOGY: Like a FRIEND RECOMMENDATION:
  "You and Jake both loved Inception and Interstellar.
  Jake also loved Tenet, which you haven't seen yet.
  → Recommend Tenet to you."

SPARSITY PROBLEM:
  Netflix has 200M users × 15,000 movies = 3 BILLION potential ratings.
  But only ~1% are actually rated → 99% of the matrix is empty!
  Any algorithm must handle massive sparsity efficiently.
```

---

# PART 2: Content-Based Filtering

---

```
IDEA: Recommend items SIMILAR to what the user already liked.
Focus on item FEATURES (genre, director, actors, tags).

ANALOGY: A MUSIC TEACHER recommendation.
You love jazz with minor keys and saxophone.
Teacher looks for more songs with those same features.
No other users needed — just you and your taste profile.

HOW IT WORKS:
  1. Build item feature vectors:
     Movie: [Action=1, Sci-Fi=1, Drama=0, Christopher_Nolan=1, ...]

  2. Build user profile = weighted average of liked items' features:
     P(u) = Σ r(u,i) · features(i)  for all items i user u rated

  3. Score unseen items using COSINE SIMILARITY:
     score(u, i) = P(u) · features(i) / (‖P(u)‖ · ‖features(i)‖)

  4. Rank by score, recommend top-K

PROS:
  ✅ No "cold start" for items (works with new items immediately)
  ✅ Explainable: "Recommended because you liked Sci-Fi"
  ✅ Works with no other users (single-user system possible)

CONS:
  ❌ Cold start for users (needs user history to build profile)
  ❌ Feature engineering problem: how do you featurize items?
  ❌ "Filter bubble": only recommends more of the same, no serendipity
  ❌ Can't capture complex preferences (your mood changes!)
```

---

# PART 3: Collaborative Filtering — "Wisdom of the Crowd"

---

```
IDEA: Find users with SIMILAR TASTE, recommend what they like.
Don't need item features — just the interaction matrix!

ANALOGY: CROWD SOURCING taste.
Instead of analyzing the movie's features, you ask:
"Who else has watched and liked what you like?
What else have THEY watched that you haven't?"

TWO FLAVORS:

USER-BASED CF:
  1. Find K users most similar to target user u
  2. Take items those K users liked but u hasn't seen
  3. Score items by weighted average of those K users' ratings

  SIMILARITY: Pearson correlation or cosine similarity on rating vectors

  Problem: Doesn't scale! Computing all user-user similarities:
  O(U² × I) → millions of users × millions of items → too slow.

ITEM-BASED CF (Amazon's patented approach, 1998):
  1. Precompute item-item similarities offline
  2. For user u, find items similar to what u already rated
  3. Score = weighted average of u's ratings weighted by item similarity

  ADVANTAGE: Item catalog is stable (items don't change preferences).
  Item-item similarities are reusable across all users!
  Scales much better: computed offline once.

  ANALOGICAL INSIGHT: "Customers who bought X also bought Y"
  → Amazon's original item-item CF! Still used today.
```

---

# PART 4: Matrix Factorization — The Mathematical Heart

---

```
THE INSIGHT:
  Most users haven't explicitly told us their tastes.
  But their rating behavior implies LATENT FACTORS (hidden preferences).

  For movies: latent factors ≈ "likes action", "prefers foreign films", etc.
  For users:  latent factors ≈ "action fan", "romantic comedy fan", etc.

  We don't know WHAT the factors mean — the model discovers them!

FORMULATION:
  Decompose the rating matrix R (U×I) into two smaller matrices:
  R ≈ P × Qᵀ

  P: User factor matrix (U × K)   — each user's latent preferences
  Q: Item factor matrix (I × K)   — each item's latent properties
  K = number of latent factors (typically 20-200)

  PREDICTED RATING:
  r̂(u,i) = pᵤ · qᵢᵀ = Σₖ pᵤₖ · qᵢₖ   (dot product of user and item vectors)

  The dot product measures "how aligned are this user's preferences
  with this item's properties across all K dimensions?"

TRAINING (Alternating Least Squares — ALS):
  Minimize: Σ (u,i) [r(u,i) - pᵤ·qᵢᵀ]² + λ(‖pᵤ‖² + ‖qᵢ‖²)

  ALTERNATING LEAST SQUARES (ALS):
  Fix Q, solve for P analytically (closed-form least squares)
  Fix P, solve for Q analytically
  Alternate until convergence

  WHY ALS: Each sub-problem is a convex quadratic → closed-form solution!
  Parallelizable: each user/item solved independently.

  OR use SGD:
  For each observed (u,i) pair:
    error = r(u,i) - pᵤ·qᵢᵀ
    pᵤ  ← pᵤ  + α(error·qᵢ - λ·pᵤ)
    qᵢ  ← qᵢ  + α(error·pᵤ - λ·qᵢ)

BIASES (important in practice!):
  Users have different overall rating tendencies (critics rate low)
  Items have different overall popularity (blockbusters rated more)

  r̂(u,i) = μ + bᵤ + bᵢ + pᵤ·qᵢᵀ

  μ: global average rating
  bᵤ: user bias (how much u rates above/below average)
  bᵢ: item bias (how popular/good item i is overall)
  pᵤ·qᵢᵀ: personalized interaction term
```

```python
import numpy as np

class MatrixFactorization:
    """SVD-style Matrix Factorization with SGD"""
    def __init__(self, n_factors=50, lr=0.01, reg=0.02, n_epochs=20):
        self.K = n_factors
        self.lr = lr
        self.reg = reg
        self.epochs = n_epochs

    def fit(self, ratings):
        """ratings: list of (user_id, item_id, rating)"""
        users = set(r[0] for r in ratings)
        items = set(r[1] for r in ratings)
        n_users, n_items = max(users)+1, max(items)+1

        # Initialize matrices with small random values
        self.P = np.random.normal(0, 0.1, (n_users, self.K))  # user factors
        self.Q = np.random.normal(0, 0.1, (n_items, self.K))  # item factors
        self.bu = np.zeros(n_users)   # user biases
        self.bi = np.zeros(n_items)   # item biases
        self.mu = np.mean([r[2] for r in ratings])  # global mean

        for epoch in range(self.epochs):
            np.random.shuffle(ratings)
            total_loss = 0
            for u, i, r in ratings:
                # Prediction
                pred = self.mu + self.bu[u] + self.bi[i] + self.P[u] @ self.Q[i]
                err = r - pred
                total_loss += err**2

                # SGD updates
                self.bu[u] += self.lr * (err - self.reg * self.bu[u])
                self.bi[i] += self.lr * (err - self.reg * self.bi[i])
                self.P[u]  += self.lr * (err * self.Q[i] - self.reg * self.P[u])
                self.Q[i]  += self.lr * (err * self.P[u] - self.reg * self.Q[i])

            rmse = np.sqrt(total_loss / len(ratings))
            if epoch % 5 == 0:
                print(f"Epoch {epoch}: RMSE = {rmse:.4f}")

    def predict(self, u, i):
        return self.mu + self.bu[u] + self.bi[i] + self.P[u] @ self.Q[i]

# Usage
ratings = [(0,0,5.0), (0,1,3.0), (1,0,4.0), (2,2,5.0), (2,3,4.0)]
mf = MatrixFactorization(n_factors=10, n_epochs=30)
mf.fit(ratings)
print(f"Predicted r(1,2): {mf.predict(1, 2):.2f}")
```

---

# PART 5: The Modern Approach — Two-Tower Neural Models

---

```
BACKGROUND: YouTube used in ~2016. Now the industry standard.

PROBLEM WITH MF: Linear interactions only!
  r̂(u,i) = pᵤ · qᵢᵀ (dot product = linear)
  Can't capture: "User who likes history AND action → likes Braveheart"
  Need non-linear interactions!

THE TWO-TOWER ARCHITECTURE:

  ┌──────────────────────────────────────────────────────────┐
  │  QUERY TOWER            │   CANDIDATE TOWER              │
  │  (User Side)            │   (Item Side)                  │
  │                         │                                │
  │  [User ID]              │   [Item ID]                    │
  │  [Age, country]    →    │   [Category, tags]    →        │
  │  [Watch history]        │   [Popularity]                 │
  │  [Search history]       │   [Freshness]                  │
  │       ↓                 │        ↓                       │
  │  [Embedding + MLP]      │   [Embedding + MLP]            │
  │       ↓                 │        ↓                       │
  │  [User Vector (d)]      │   [Item Vector (d)]            │
  └──────────────────────────────────────────────────────────┘
                     ↘         ↙
                    DOT PRODUCT
                    (or Inner Product)
                         ↓
                     Score / Rank

HOW IT WORKS:
  1. Query tower: encode user + context → user embedding (128d vector)
  2. Candidate tower: encode item → item embedding (128d vector)
  3. Score = dot product of user and item embeddings
  4. All item embeddings precomputed → approximate nearest neighbor search

TRAINING OBJECTIVE:
  Softmax over all items:  P(item | user) = exp(u·vᵢ) / Σⱼ exp(u·vⱼ)

  But Σⱼ over all items is HUGE (millions of videos)!
  Solution: NEGATIVE SAMPLING — sample a few random "negative" items
  and train to score positives higher than negatives.

  In-batch negatives: other items in the same training batch = free negatives!

WHY TWO SEPARATE TOWERS:
  ✅ Precompute all ITEM embeddings offline (doesn't change often)
  ✅ Compute USER embedding at real-time (fresh context!)
  ✅ ANN (approx nearest neighbor) search: find top-K similar items in ms
  ✅ Scales to billions of items (vectors in FAISS/ScaNN/Pinecone)

THE RECOMMENDATION PIPELINE (Production):
  STAGE 1 — RETRIEVAL (narrow down millions → thousands):
    Two-Tower model → ANN search → top 500 candidates
    Must be FAST (ANN search ≈ few milliseconds)

  STAGE 2 — RANKING (thousands → final top 10):
    Cross-encoder: concatenate user+item features → deep MLP → score
    More accurate but too slow to run on millions of items

  STAGE 3 — POST-FILTERING (business rules):
    Remove already-watched, too-old content, explicit user blocks
```

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class TowerNetwork(nn.Module):
    """One tower in the Two-Tower architecture"""
    def __init__(self, input_dim, hidden_dims, output_dim):
        super().__init__()
        layers = []
        prev_dim = input_dim
        for h_dim in hidden_dims:
            layers.extend([nn.Linear(prev_dim, h_dim), nn.ReLU(), nn.LayerNorm(h_dim)])
            prev_dim = h_dim
        layers.append(nn.Linear(prev_dim, output_dim))
        self.network = nn.Sequential(*layers)

    def forward(self, x):
        out = self.network(x)
        return F.normalize(out, dim=-1)   # L2-normalize for cosine similarity

class TwoTowerModel(nn.Module):
    def __init__(self, user_feature_dim, item_feature_dim, embed_dim=128):
        super().__init__()
        self.user_tower = TowerNetwork(user_feature_dim, [256, 128], embed_dim)
        self.item_tower = TowerNetwork(item_feature_dim, [256, 128], embed_dim)
        self.temperature = nn.Parameter(torch.ones(1))   # learned temperature

    def forward(self, user_features, item_features):
        user_emb = self.user_tower(user_features)    # (B, embed_dim)
        item_emb = self.item_tower(item_features)    # (B, embed_dim)

        # In-batch softmax (contrastive loss)
        logits = (user_emb @ item_emb.T) / self.temperature  # (B, B)
        labels = torch.arange(len(user_emb))                  # diagonal = positives

        # Both directions: user → item and item → user
        loss = (F.cross_entropy(logits, labels) +
                F.cross_entropy(logits.T, labels)) / 2
        return loss, user_emb, item_emb

# At inference:
# 1. Precompute item_embeddings for all items
# 2. For new user: compute user_emb in real-time
# 3. ANN search: find K closest item_embs (FAISS)
```

---

# PART 6: Beyond Ratings — Implicit Feedback

---

```
PROBLEM: Most real systems have NO explicit ratings.
  Users don't rate things! They just click/watch/buy.

  Explicit feedback: Stars, thumbs up/down (rare, biased)
  Implicit feedback: Clicks, watch time, purchases, scrolls (abundant)

ALS FOR IMPLICIT FEEDBACK (Hu et al., 2008):
  Treat ALL implicit data as signal, not just the positives.

  For every user-item pair:
  pᵤᵢ = 1 if user u interacted with item i (else 0)
  cᵤᵢ = 1 + α × rᵤᵢ  (confidence: more interactions = more confident)

  Minimize:
  Σ(u,i) cᵤᵢ(pᵤᵢ - pᵤ·qᵢᵀ)² + λ(‖pᵤ‖² + ‖qᵢ‖²)

  KEY: Even items the user NEVER interacted with get confidence=1
  → "User implicitly rejected these items by not clicking."
  → This turns the sparse positive-only data into a dense problem!

EVALUATION METRICS FOR RECOMMENDERS:

  Precision@K = (relevant items in top-K) / K
  Recall@K    = (relevant items in top-K) / (total relevant items)

  NDCG@K (Normalized Discounted Cumulative Gain):
  → Rewards relevant items appearing earlier in the list
  DCG@K = Σᵢ₌₁ᴷ relevance(i) / log₂(i+1)   (positions get discounted)
  NDCG@K = DCG@K / IDCG@K  (normalized to 0-1)
  NDCG is the STANDARD metric in industry (position-aware, handles graded relevance)

  MRR (Mean Reciprocal Rank):
  = mean of 1/rank_of_first_relevant_item across users
  Good for "find the one right answer" scenarios (search).

  Coverage: variety of items recommended (avoids bubble)
  Novelty:  how surprising/non-obvious are recommendations?

---

## 🔬 Section Challenge — Cold-Start Strategies

> A new user signs up for your movie recommendation service. You have no watch
> history, no ratings, no demographic data yet. How do you recommend something?

<details>
<summary>Answer</summary>

```
THE PROBLEM:
  Your best algorithms (collaborative filtering, matrix factorization)
  REQUIRE historical interaction data. Without it, you have NOTHING to factor.
  Cold start is the gap between "user arrived" and "system is useful."

STRATEGY (a) — POPULARITY-BASED:
  "Show everyone the same top-20 most-watched movies."

  WHY IT WORKS:
  Popular items are a safe default — they're popular FOR A REASON.
  A new user has a high prior probability of liking a hit movie.
  No personalization needed — just aggregate statistics.

  WHY IT BREAKS:
  Assumes new users are "average." But a cinephile who just joined
  gets Marvel movies suggested and feels the service is for casuals.
  Long-tail items (niche films) are never surfaced — worsens filter bubble.
  Provides ZERO differentiation — same recs for everyone.

STRATEGY (b) — DEMOGRAPHIC-BASED:
  "Ask age/region/genre preference at signup. Use that as a proxy for taste."

  WHY IT WORKS:
  People in the same age cohort often share cultural references and tastes.
  Region correlates with language, local content preferences.
  A 17-year-old anime fan and a 65-year-old retiree have VERY different priors.

  WHY IT BREAKS:
  Demographics correlate weakly with taste (correlation ≠ causation).
  A 25-year-old who watches arthouse cinema gets the same recs as their
    action-movie-loving twin → false precision.
  Privacy concerns: users resist sharing demographic data.
  Fragments the problem: you now need demographic-segment models.

STRATEGY (c) — ONBOARDING QUESTIONNAIRE:
  "Pick 5 movies you love from this poster grid." → seed user profile immediately.

  WHY IT WORKS:
  Directly constructs a content-based profile from the first session.
  Even 3-5 explicit likes give matrix factorization enough seed data to work.
  Can be combined with popularity to hybridize immediately.
  Industry standard: Spotify, Netflix, and Goodreads all use this.

  WHY IT BREAKS:
  User is lazy/tired at onboarding → sparse initial signal.
  First impressions matter: bad onboarding = churn before personalization kicks in.
  Questionnaire fatigue: users want to USE the product, not fill out forms.

DEEP TRADE-OFF:
  All three are compromises. The real question is: HOW LONG until you have
  enough interaction data for CF to take over?

  Short-time users (casual):  Prefer (a) or (b) — zero friction.
  Long-time users (engaged):  Prefer (c) — better quality signal.

  Best practice: use (a)+(b) for session 1, then transition to (c)-seeded
  CF as watch history accumulates over the first week.
```
</details>

---

## 🔬 Section Challenge — Implicit vs Explicit Feedback

> Your service tracks "watched" as implicit signal and "5-star rating" as explicit
> signal. Implicit data is abundant (every play counts); explicit data is sparse.
> WHY is explicit feedback usually a better training signal per item? What does
> implicit feedback capture that explicit doesn't?

<details>
<summary>Answer</summary>

```
PART A: WHY EXPLICIT IS USUALLY A BETTER SIGNAL (per item)

  A 5-star rating is an ACTIVE DELIBERATE ACT:
  User spent cognitive effort deciding: "is this worth 4 stars or 3?"
  The rating reflects a conscious preference judgment, not just behavior.

  WHY THIS MATTERS FOR TRAINING:

  1. LESS AMBIGUITY:
  Explicit:  "4 out of 5" → user DISLIKES the movie. Clear negative signal.
  Implicit:  "watched 95% of it" → did they like it or was it background noise?
             "watched 5 minutes then stopped" → too boring OR too scary?
  Explicit separates preference from engagement. Implicit conflates them.

  2. GRADED SIGNAL (ORDINAL, NOT BINARY):
  A 5-star system has 5 levels of preference. A "3" is genuinely lukewarm.
  For matrix factorization: r̂(u,i) = pᵤ·qᵢᵀ + bᵤ + bᵢ + μ.
  The TARGET value (rating) has 5 meaningful levels.
  For implicit: pᵤᵢ ∈ {0, 1} — positive or negative, nothing in between.
  You're fitting to a much coarser signal.

  3. LESS SELECTION BIAS:
  Who rates movies? Usually extremes — people who LOVED or HATED it.
  The silent middle (people who thought it was "fine") don't rate.
  But explicit data still has more INTENT per data point than a passive view.

PART B: WHAT IMPLICIT CAPTURES THAT EXPLICIT DOESN'T

  1. PASSIVE PREFERENCE (no cognitive cost):
  Users watch 100x more than they rate. The VAST majority of preference
  signals are implicit. Explicit misses the long tail.
  If you only train on ratings, you miss the entire catalog.

  2. "DECISION TO CONSUME" vs "EVALUATION OF CONSUMPTION":
  Implicit: "this person CHOSE to watch this for 2 hours."
  That's a STRONG positive signal — they invested time, the most scarce resource.
  Explicit 5-star: "I thought it was 4 stars." — no time commitment encoded.
  A user who watched a 3-hour film and rated it 3 stars left less signal
  than someone who watched 100 hours and never rated.

  3. CONTEXT AND REPEATED ENGAGEMENT:
  Implicit captures: rewatching, pausing, how far they got, session timing.
  Rewatching the same song 50x is the strongest preference signal possible.
  No explicit system captures this naturally.

  4. NEGATIVE SIGNAL (implicitly):
  Hu et al. (2008): "didn't click" = soft negative signal.
  cᵤᵢ = 1 + α × rᵤᵢ → unobserved pairs still get confidence=1.
  Explicit only gives negatives for users who went out of their way to say so.
  Implicit gives you the FULL interaction matrix, not just the sparse positive slice.

THE REAL ANSWER:
  Use both. Explicit ratings → train the model. Implicit signals →
  post-rank and diversify. The answer is never either/or.
```
</details>

---

## 🔬 Section Challenge — Evaluation Metrics Trade-Offs

> You deploy a collaborative filtering model. RMSE on held-out ratings = 0.85
> (improved from 0.92). But your A/B test shows click-through rate dropped 3%.
> WHY might RMSE improve while business metrics regress? What metric would you
> actually optimize for?

<details>
<summary>Answer</summary>

```
PART A: WHY RMSE IMPROVES WHILE CTR REGRESSES

  RMSE = √[mean((r - r̂)²)] = average squared error per rating prediction.
  Lower RMSE = more accurate rating predictions on the rating prediction task.
  This is a MATHEMATICAL improvement on a NARROW task.

  THE DISCONNECT — 5 ways RMSE misleads:

  1. RMSE OPTIMIZES FOR AVERAGE ACCURACY, NOT TOP-K QUALITY:
  RMSE penalizes errors uniformly: being off by 1 on a 1-star vs 5-star item
  is treated equally. But in recommendation, the only thing that matters is:
  "Did we get the top-K right?" Being slightly wrong on item 51 matters zero.
  RMSE optimizes the WRONG objective (global accuracy vs ranked quality).

  2. RMSE REFITS TO THE "NORMAL ZONE" — REGRESSING TOWARD THE MEAN:
  To minimize MSE, the model learns to predict closer to the mean rating
  (usually 3-4 stars for most movies). "Safe" predictions minimize variance,
  which reduces extreme errors, which reduces RMSE.

  But "close to the mean for everything" = recommending the same popular
  mediocre movies to everyone. Boring. CTR drops.

  3. RMSE IS CALCULATED ON EXPLICIT RATINGS — A BIASED SAMPLE:
  Held-out ratings come from users who BOTHERED to rate. These users are
  self-selected: enthusiastic fans, extreme reactors, not representative
  of your entire user base.

  RMSE improvements on this slice ≠ improvements for the silent majority
  whose behavior drives clicks.

  4. CTR MEASURES DISCOVERY; RMSE MEASURES ACCURACY:
  Users click recommendations they HAVEN'T SEEN BEFORE. Great RMSE means
  you predicted their rating well. But great CTR means you surfaced
  NOVEL, SURPRISING, VALUABLE items — which CF models often DON'T do.

  Model predicts user will rate "forgotten sequel #4" as 4.0 stars.
  User clicks "new sci-fi drama by a director they loved." CTR goes up.
  RMSE doesn't reward novelty; CTR does.

  5. OVERFITTING TO HISTORICAL RATINGS vs GENERALIZING TO FEED:
  RMSE is evaluated on held-out past ratings. The recommendation feed is
  evaluated on future clicks. These are different distributions.
  A model that memorized "users who rated X also rated Y" might nail
  the historical rating (low RMSE) while failing at novelty discovery (low CTR).

PART B: WHAT METRIC WOULD YOU ACTUALLY OPTIMIZE FOR?

  In production, you optimize for the BUSINESS goal, not the proxy.

  PRIMARY METRICS (rank-aware, not pointwise):

  - NDCG@K: Normalized Discounted Cumulative Gain
    Rewards relevant items in top-K, with exponential position discount.
    This is what YouTube, Netflix, Spotify actually optimize.
    WHY: it captures both relevance AND ranking quality simultaneously.

  - MAP@K (Mean Average Precision):
    Average precision across users. Good when you have multiple
    "relevant" items per user (not just one "correct" answer).

  - MRR (Mean Reciprocal Rank):
    For search-style rec: what is the rank of the FIRST relevant item?
    Fast to compute, easy to interpret.

  SECONDARY METRICS (health of the system):

  - Coverage: % of catalog ever recommended. Fights filter bubble.
  - Diversity (intra-list): how varied are top-K items? Similarity score.
  - Novelty: are we surfacing long-tail items or just blockbusters?
  - Churn rate: users returning? The ultimate signal.

  THE HIERARCHY:
  Step 1: Optimize NDCG@20 (retrieval quality)
  Step 2: Monitor coverage and diversity (system health)
  Step 3: Track long-term retention (is the model building habits?)
  Step 4: RMSE — keep it non-terrible, but don't chase it.
```
</details>

---

## 🔗 Cross-References

| Topic                     | Related Content                                                      |
| ------------------------- | -------------------------------------------------------------------- |
| **Embeddings math**       | [LLM & RAG](10_LLM_RAG_Applications.md) — Sentence embeddings, FAISS |
| **Neural networks**       | [Deep Learning](07_Deep_Learning_Fundamentals.md) — MLPs, training   |
| **Production deployment** | [MLOps](13_MLOps_Production.md) — Serving, monitoring                |
| **SVD linear algebra**    | [Math for ML](04_Math_For_ML.md) — Matrix decomposition              |


---

## Reality Check

**"Recommenders predict what users will like"** — Recommenders optimize a MEASURABLE PROXY (clicks, watch time, purchases) that is not the same as "what users will like" or what is good for them — and the gap has consequences: the engagement-optimized system that recommends outrage or addictive content (the proxy of watch-time diverging from user well-being — the [13_DE monitoring] wrong-metric with societal stakes), the clickbait the click-metric rewards, and the filter bubble the similarity-optimization creates. Plus the feedback LOOP (the recommender shapes behavior which becomes training data which reinforces the recommender — the [ML-fundamentals] drift that is self-inflicted). "Predict what users will like" is the benign framing; the reality is optimizing a proxy metric whose divergence from genuine user interest and well-being is the central, consequential design problem.

**"Collaborative filtering just needs a ratings matrix"** — The ratings matrix is extremely SPARSE and biased, and those properties dominate the engineering: most users rate almost nothing (the sparsity that makes naive similarity unreliable — the two users who overlap on two items), the COLD START (the new user or item with no ratings — the [system-design]-worthy problem that pure collaborative filtering cannot solve, needing content features or defaults), the bias (users rate what they already chose — the missing-not-at-random data, the ratings that reflect exposure not preference), and the popularity skew (the few popular items dominating). "Just needs a ratings matrix" misses that the matrix is sparse, biased, and cold-start-plagued — and real recommenders are hybrid (collaborative plus content plus context) specifically to handle the cases the ratings matrix alone cannot, which is most of them.

**"Better accuracy on held-out ratings means a better recommender"** — Rating-prediction accuracy (RMSE on held-out ratings) correlates weakly with recommendation QUALITY, and optimizing it can hurt: the accuracy that improves by predicting popular items everyone likes (the [system-design] recommending the obvious — accurate and useless, no discovery), the missing dimensions accuracy ignores (diversity, novelty, serendipity — the recommender that is accurate and boring, all similar items), and the offline-online gap (the metric that improves offline and does not move the online engagement — the [ML-fundamentals] test-set that does not predict deployment, acutely true for recommenders where the deployment CHANGES user behavior). Recommender evaluation needs online A/B testing (the real metric on real users), diversity and coverage metrics, and business KPIs — "better held-out accuracy" is the offline proxy that famously fails to predict online recommender success, which is why the field relies on online experimentation.

**"Recommendation is a pure ML problem"** — Production recommenders are SYSTEMS problems as much as ML: the LATENCY constraint (the recommendation computed in milliseconds for the page load — the [system-design] serving problem, the candidate-generation-then-ranking two-stage architecture that exists because scoring every item is too slow), the scale (millions of items and users — the approximate-nearest-neighbor and the [system-design] that makes retrieval tractable), the freshness (the new content recommended quickly — the real-time versus batch tension), the business rules (the promoted items, the diversity requirements, the content policy filtering), and the feedback-loop and A/B infrastructure. "Pure ML" misses that the recommender is a low-latency, large-scale serving system with a two-stage architecture, business-rule integration, and experimentation infrastructure — the ML model is one component, and the systems engineering (candidate generation, ranking, serving, experimentation) is most of what makes a recommender work at scale.

**"Recommenders are neutral — they just reflect preferences"** — Recommenders SHAPE preferences and behavior, and treating them as neutral mirrors ignores their power and responsibility: the feedback loop that narrows exposure (the filter bubble, the [above] self-reinforcing loop — the user shown more of what they engaged with, converging their options), the popularity bias that entrenches winners (the rich-get-richer, the long-tail starved of exposure), the manipulation surface (the recommendations optimized for the platform's revenue over the user's interest), and the fairness questions (the recommender that under-serves or stereotypes groups — the [ML-fundamentals] bias with distributional impact). "Neutral mirror" is the abdication of responsibility — recommenders are active shapers of what people see, buy, watch, and believe, and the design choices (what to optimize, what diversity to enforce, what to filter) are consequential value decisions, which is why recommender ethics and the optimize-for-what question are central, not peripheral, to the field.
