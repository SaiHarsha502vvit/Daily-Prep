# 📝 Python & Machine Learning — Problem Sets

## `25_Python_ML_DL_NLP` Module | Python Core · NumPy/Pandas · ML · NLP

> **How to use:** All code goes in `JavaSolutions/ps/python/`. Run with Python 3.10+. No `import *` — explicit imports only.

---

## Problem Set PY-PS1 — Python Core

**Prerequisites:** `25_Python_ML_DL_NLP/01_Python_Core.md`

---

### Part A: Predict / Debug

**A1 (Easy).** What does this print?

```python
x = [1, 2, 3]
y = x           # reference copy, NOT value copy
y.append(4)
print(x)
```

<details><summary>Answer</summary>

**Output:** `[1, 2, 3, 4]`

`y = x` makes `y` point to the SAME list object. `y.append(4)` mutates that shared list. Both `x` and `y` see the change.

**Fix — shallow copy:** `y = x.copy()` or `y = x[:]`  
**Fix — deep copy:** `import copy; y = copy.deepcopy(x)` (needed for nested structures)

🔴 **Erklärung:** Python variables are references, not values. Assignment copies the reference, not the object. This is Python's #1 beginner mistake. Always copy explicitly when you need independent state.

</details>

---

**A2 (Medium).** Rewrite this function as a list comprehension and a generator expression. When should each be used?

```python
def get_even_squares(n):
    result = []
    for i in range(n):
        if i % 2 == 0:
            result.append(i ** 2)
    return result
```

<details><summary>Answer</summary>

```python
# List comprehension — creates the full list in memory immediately
def get_even_squares_list(n):
    return [i**2 for i in range(n) if i % 2 == 0]

# Generator expression — lazy, yields one value at a time
def get_even_squares_gen(n):
    return (i**2 for i in range(n) if i % 2 == 0)

# Usage:
print(list(get_even_squares_gen(10)))  # [0, 4, 16, 36, 64]
```

**When to use:**

- **List comprehension `[...]`**: You need random access, `.len()`, iterate multiple times, or pass to something expecting a list
- **Generator `(...)`**: Large/infinite sequences — only ONE value in memory at a time; cannot rewind

🔴 **Erklärung:** `sum(i**2 for i in range(10**8))` runs in constant memory. `sum([i**2 for i in range(10**8)])` creates a list of 100M items in RAM — probably crashes. Generators are Python's most powerful memory optimization.

</details>

---

**A3 (Hard).** Implement `memoize` as a decorator that works on functions with keyword arguments:

```python
import functools

def memoize(fn):
    cache = {}
    @functools.wraps(fn)          # preserves __name__, __doc__
    def wrapper(*args, **kwargs):
        # kwargs dict is unhashable — convert to sorted tuple
        key = (args, tuple(sorted(kwargs.items())))
        if key not in cache:
            cache[key] = fn(*args, **kwargs)
        return cache[key]
    return wrapper

@memoize
def expensive(n: int, multiplier: int = 2) -> int:
    print(f"Computing {n} × {multiplier}...")
    return n * multiplier

expensive(5, multiplier=3)  # prints "Computing..."
expensive(5, multiplier=3)  # returns cached — no print
expensive(5, multiplier=4)  # different kwargs — prints again
```

---

## Problem Set PY-PS2 — NumPy & Pandas

---

**A1 (Medium).** What's the difference between these two operations?

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])

# Operation 1:
result1 = []
for x in a:
    result1.append(x ** 2)

# Operation 2:
result2 = a ** 2
```

<details><summary>Answer</summary>

**Operation 1:** Python loop — slow. Each element crosses Python-C boundary separately. O(n) Python overhead.

**Operation 2:** NumPy vectorized operation — runs optimized C/BLAS code on the entire array. ~100× faster for large arrays.

**Benchmark:**

```python
import time
n = 10_000_000
a = np.ones(n)

t0 = time.time(); [x**2 for x in a]; print(f"Loop: {time.time()-t0:.2f}s")   # ~5s
t0 = time.time(); a**2; print(f"Vectorized: {time.time()-t0:.3f}s")           # ~0.01s
```

🔴 **Erklärung:** NEVER loop over NumPy arrays in Python. Any operation that iterates element-by-element defeats the purpose of NumPy. If you find yourself writing a for loop over an ndarray, there's almost always a vectorized equivalent: `np.where`, `np.apply_along_axis`, fancy indexing, boolean masking.

</details>

---

**A2 (Hard).** Given this Pandas DataFrame, answer all 4 questions WITHOUT using any for loop:

```python
import pandas as pd

df = pd.DataFrame({
    'product': ['A', 'B', 'A', 'C', 'B', 'A'],
    'month':   [1, 1, 2, 2, 3, 3],
    'sales':   [100, 200, 150, 80, 220, 130],
    'cost':    [60, 120, 90, 50, 130, 75]
})

# Q1: Total sales per product
# Q2: Month where product A had its highest sales
# Q3: Products with above-average total sales (average across all products)
# Q4: Add a "profit_margin" column = (sales - cost) / sales * 100
```

<details><summary>Answer</summary>

```python
# Q1: Total sales per product
q1 = df.groupby('product')['sales'].sum()
# product
# A    380
# B    420
# C     80

# Q2: Month where product A had highest sales
a_rows = df[df['product'] == 'A']
q2 = a_rows.loc[a_rows['sales'].idxmax(), 'month']
# 2 (sales=150)

# Q3: Products with above-average total sales
totals = df.groupby('product')['sales'].sum()
avg = totals.mean()   # (380 + 420 + 80) / 3 = 293.3
q3 = totals[totals > avg].index.tolist()
# ['A', 'B']

# Q4: Add profit_margin column
df['profit_margin'] = (df['sales'] - df['cost']) / df['sales'] * 100
# Vectorized — no loop needed
```

</details>

---

## Problem Set PY-PS3 — Machine Learning

---

**A1 (Easy).** What is the bias-variance tradeoff? Plot it conceptually and classify these models:

<details><summary>Answer</summary>

```
Error
  │
  │   Total Error = Bias² + Variance + Noise
  │
  │    ╲         /
  │     ╲  Total/
  │      ╲  Error
  │     Var╲ /
  │         X
  │        / ╲
  │       /   ╲ Bias²
  │──────────────────────── Model Complexity →
```

| Model                        | Bias     | Variance  | Problem                       |
| ---------------------------- | -------- | --------- | ----------------------------- |
| Linear Regression (underfit) | High     | Low       | Doesn't capture patterns      |
| Deep Decision Tree (overfit) | Low      | High      | Memorizes training data       |
| Random Forest (well-tuned)   | Medium   | Medium    | Balanced                      |
| 1-NN                         | Very Low | Very High | Overfits to every noise point |

**Rule:** Increase model complexity → bias ↓, variance ↑. Regularization (L1/L2, dropout, early stopping) reduces variance.

</details>

---

**A2 (Hard).** Build a complete ML pipeline from scratch:

```python
# JavaSolutions/ps/python/churn_pipeline.py
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

# Simulated dataset
df = pd.DataFrame({
    'age':          [25, 45, 35, 55, 28, 62, 31, 48],
    'subscription_months': [2, 24, 12, 36, 1, 48, 6, 18],
    'plan':         ['basic','premium','basic','enterprise','basic','enterprise','premium','basic'],
    'support_tickets': [5, 1, 2, 0, 8, 0, 3, 4],
    'churned':      [1, 0, 0, 0, 1, 0, 1, 0]   # target
})

X = df.drop('churned', axis=1)
y = df['churned']

# Step 1: Feature preprocessing
numeric_features = ['age', 'subscription_months', 'support_tickets']
categorical_features = ['plan']

preprocessor = ColumnTransformer([
    ('num', StandardScaler(), numeric_features),
    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
])

# Step 2: Full pipeline (preprocessing + model)
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Step 3: Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# Step 4: Train
pipeline.fit(X_train, y_train)

# Step 5: Evaluate
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

print(classification_report(y_test, y_pred))
print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.3f}")

# Step 6: Cross-validation (more reliable than single split)
cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='roc_auc')
print(f"CV ROC-AUC: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
```

---

## Problem Set PY-PS4 — NLP Basics

---

**A1 (Medium).** What is TF-IDF? Why is it better than raw word count for text classification?

<details><summary>Answer</summary>

**TF-IDF (Term Frequency – Inverse Document Frequency):**

```
TF(word, doc)   = count(word in doc) / total_words_in_doc
IDF(word, docs) = log(total_docs / docs_containing_word)
TF-IDF = TF × IDF
```

**Why better than raw count:**

- "the", "is", "a" appear in ALL documents → high TF but very low IDF → near-zero TF-IDF
- Technical terms like "neural", "dropout" appear in few documents → high IDF → high TF-IDF
- TF-IDF naturally suppresses common words WITHOUT needing a manual stopword list

```python
from sklearn.feature_extraction.text import TfidfVectorizer

docs = [
    "the cat sat on the mat",
    "the dog chased the cat",
    "neural networks learn features automatically"
]
vec = TfidfVectorizer()
X = vec.fit_transform(docs)
print(vec.get_feature_names_out())  # vocabulary
print(X.toarray())                  # each row: TF-IDF vector for a doc
```

🔴 **Erklärung:** Raw word count + cosine similarity is called "Bag of Words." TF-IDF is an improved bag of words. Both IGNORE word order. For order-sensitive tasks, use sequential models (LSTM) or attention-based models (Transformers/BERT).

</details>

---

**A2 (Hard).** Build a simple semantic search using sentence embeddings + cosine similarity:

```python
# JavaSolutions/ps/python/semantic_search.py
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')  # 80MB, fast, good quality

knowledge_base = [
    "Python is a high-level programming language known for its simplicity.",
    "Java is a statically typed object-oriented programming language.",
    "Docker containers package applications with their dependencies.",
    "Kubernetes orchestrates containerized applications at scale.",
    "React is a JavaScript library for building user interfaces.",
    "PostgreSQL is an open-source relational database management system.",
]

def semantic_search(query: str, top_k: int = 3) -> list[tuple[str, float]]:
    # Encode all docs and the query
    doc_embeddings = model.encode(knowledge_base)
    query_embedding = model.encode([query])[0]

    # Cosine similarity (embeddings are L2-normalized by default in sentence-transformers)
    scores = np.dot(doc_embeddings, query_embedding)  # dot product = cosine sim when normalized

    # Top-k results
    top_indices = np.argsort(scores)[::-1][:top_k]
    return [(knowledge_base[i], float(scores[i])) for i in top_indices]

# Test:
results = semantic_search("container orchestration")
for text, score in results:
    print(f"{score:.3f}: {text}")
# 0.721: Kubernetes orchestrates containerized applications at scale.
# 0.618: Docker containers package applications with their dependencies.
# 0.234: Python is a high-level programming language...
```

---

[← Back to Semester 4 Guide](../00_CURRICULUM/SEMESTER_4_GUIDE.md)


---

## Reality Check

**"ML problem sets are about getting the model to work"** ? The transferable skill is the DIAGNOSTIC loop when the model does NOT work � which is the normal state ([ML-fundamentals, 04b]): the model not learning (learning rate, initialization, data pipeline, the overfit-a-single-batch sanity check [09]), the model overfitting (the train-validation gap, regularization), the misleading metric (accuracy on imbalanced data [ML-fundamentals]), the leakage (the too-good result [ML-fundamentals]), the training-serving skew [13]. A problem set where the tutorial model works on clean data teaches fit(); the valuable exercises inject the real failures (the messy data, the leakage, the imbalance, the drift) and drill the diagnosis � because applied ML is debugging models that do not work, not calling fit() on data that cooperates.

**"Reproducing a result from a paper or tutorial validates understanding"** ? Reproduction is a real skill and an incomplete one � the deeper exercises are ADAPTATION and diagnosis: take the working model and change the data distribution (does it break, why), introduce a leak (do you catch it), imbalance the classes (does your metric reveal it), corrupt some labels (does performance degrade as expected). Understanding is knowing WHY each piece is there ([04b] why-over-what) such that you can predict what breaks when you change it � the reproduction that runs the cells in order builds familiarity, and the adapt-and-predict exercises build the model that transfers to the messy problems reproduction never resembles. The [09] reproducibility difficulty itself is a lesson: if you cannot reproduce it, you have found the versioning/seed/data gap that production ML lives with.

**"More Kaggle-style competitions build ML skill"** ? Competitions build a SPECIFIC slice (squeezing accuracy on a clean, fixed, well-defined dataset with a given metric) and MISS most of applied ML ([ML-fundamentals, 13]): the problem framing (competitions hand you the problem, the metric, and clean data � the real work of deciding what to predict, what metric, and cleaning the data is done for you), the deployment and monitoring ([13] MLOps � competitions end at the prediction), the drift and maintenance (the model is never deployed to decay), and the leakage discipline (competitions have leakage but of a different flavor). Competitions are excellent for the modeling-and-feature-engineering slice and can INSTILL bad habits (the leaderboard-overfitting, the ensemble-of-50-models nobody could deploy, the accuracy-obsession over the [ML-fundamentals] right-metric). Balance them with end-to-end projects (frame, clean, model, deploy, monitor) that exercise the slices competitions skip.

**"Implementing algorithms from scratch is a waste when libraries exist"** ? From-scratch implementation of the CORE algorithms once (linear/logistic regression, a simple neural net with backprop, k-means, a decision tree) builds the [04b] math-behind-the-code intuition that using the library never does � you learn what fit() is doing, so when it misbehaves (the [04b] numerical instability, the [09] loss-not-decreasing) you know where to look, and you can adapt the algorithm when your problem needs a twist. The point is not to USE your from-scratch version in production (use the optimized, tested library) but to have BUILT one so the library is not a black box. "Waste when libraries exist" is the recipe-follower's framing ([ML-fundamentals] know-the-algorithm-versus-run-it) � the from-scratch build is the learning investment that turns library-user into someone who can debug and adapt, and it is a one-time cost per core algorithm with a career-long payoff.

**"ML problem sets are learned once and stay current"** ? ML moves faster than most fields (the architectures, the tools, the best practices, the frontier models turn over in months) while the FUNDAMENTALS stay fixed (the bias-variance tradeoff, the validation discipline, the data-quality primacy, the metric-matching, the drift-and-monitoring � the [ML-fundamentals] core that does not age): the maintenance strategy is anchoring on fundamentals and treating specific tools/models/architectures as their current implementations, plus tracking the frontier deliberately (the new capability that changes what is possible) without chasing every paper. And the real-project harvest ([22_DevOps problem-sets]) � every model that failed in a surprising way becomes a personal problem-set entry, the highest-fidelity training data. "Learned once and current" is especially false in ML � the practitioner running 2020 practices on 2026 problems is using superseded tools AND, more dangerously, may have missed the fundamentals (the validation discipline, the leakage-hunting) that DID not change and that the tool-churn distracts from.
