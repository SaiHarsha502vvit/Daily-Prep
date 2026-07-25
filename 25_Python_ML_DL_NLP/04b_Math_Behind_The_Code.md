> **Navigation**: [← Math for ML](04_Math_For_ML.md) | [Back to Index](00_INDEX.md) | [Next → ML Fundamentals](05_ML_Fundamentals.md)

# 🔬 Math Behind the Code — Ripping the Abstraction Layer Off ML

> _"sklearn's `.fit()` looks like magic. It isn't. It's about 200 lines of calculus and linear algebra pretending to be one function. This guide strips away every abstraction and shows you exactly what the computer is doing, step by step."_

---

# PART 0: Why This Guide Exists

```
PROBLEM:
  You run: model.fit(X, y)
  You get: "Done." — model is trained.

  What actually happened? 99% of tutorials don't explain this.

  AFTER THIS GUIDE, for every ML operation you run, you'll be able to:
  • Describe what calculation is happening at each step
  • Understand WHY it makes sense mathematically
  • Debug failures because you understand what CAN go wrong
  • Know what "converged" actually means

  This is the difference between a user and an engineer.
```

---

# PART 1: Mean — What It Really Is

---

```
DEFINITION: The mean (μ, "mu") is the CENTER OF MASS of your data.

  ANALOGY: You have 5 friends at different heights along a seesaw.
  The mean is the EXACT POINT where you'd place the fulcrum
  so the seesaw is perfectly balanced — nobody's side is heavier.

  FORMULA:
  μ = (x₁ + x₂ + x₃ + ... + xₙ) / n = (1/n) Σᵢ xᵢ

  EXAMPLE: Heights [165, 170, 175, 180, 185] cm
  μ = (165 + 170 + 175 + 180 + 185) / 5
    = 875 / 5
    = 175 cm

  WHAT IT TELLS YOU:
  "If I had to describe ALL these values with ONE number, 175cm is the
   best single guess that MINIMIZES how wrong I am on average."

  MATHEMATICAL PROOF that mean minimizes sum of squared errors:
  We want to find c that minimizes: Loss(c) = Σᵢ (xᵢ - c)²
  Take derivative and set to zero:
    dL/dc = -2 Σᵢ (xᵢ - c) = 0
    Σᵢ xᵢ - n·c = 0
    c = (1/n) Σᵢ xᵢ = μ   ← The mean!

  The mean is NOT just a formula — it's the PROVABLY OPTIMAL summary.

WHEN MEAN FAILS:
  Salaries: [30k, 30k, 30k, 30k, 1000k]
  Mean = (30×4 + 1000) / 5 = 1120/5 = 224k

  This is misleading — no one earns 224k!
  Solution: Use MEDIAN (middle value, resistant to outliers).
  Or MODE (most common value).

  RULE: Use mean when data is roughly symmetric (normal distribution).
         Use median when data has outliers or is skewed.
```

```python
import numpy as np

data = [165, 170, 175, 180, 185]

# numpy's mean
print(np.mean(data))   # 175.0

# What numpy is literally doing internally (no abstraction):
n = len(data)
total = sum(data)      # 875
mean = total / n       # 175.0
print(mean)            # same result!

# For 2D arrays (most real ML data):
X = np.array([[165, 60],   # [height, weight]
              [170, 65],
              [175, 70]])
# Axis=0: mean across rows (per column/feature)
print(X.mean(axis=0))  # [170. 65.] ← mean height=170, mean weight=65

# THIS is what happens in StandardScaler:
# Step 1: Compute mean per feature (axis=0)
# Step 2: Subtract mean from each value
# Step 3: Divide by std dev
```

---

# PART 2: Standard Deviation — How Spread Out Is My Data?

---

```
ANALOGY: Exam scores and the "average wrong-ness."
  Class A scores: [70, 71, 69, 70, 70]  → mean = 70, everyone's similar
  Class B scores: [40, 90, 60, 85, 75]  → mean = 70, but very spread out

  Both classes have mean = 70. But they're COMPLETELY DIFFERENT scenarios.
  Standard deviation captures this: HOW FAR ARE INDIVIDUAL POINTS FROM THE MEAN?

CALCULATION WALKTHROUGH (step by step):
  Data: [2, 4, 4, 4, 5, 5, 7, 9]

  Step 1: Find the mean
  μ = (2+4+4+4+5+5+7+9) / 8 = 40/8 = 5

  Step 2: Find deviations from mean (xᵢ - μ):
  2-5=-3, 4-5=-1, 4-5=-1, 4-5=-1, 5-5=0, 5-5=0, 7-5=2, 9-5=4
  → [-3, -1, -1, -1, 0, 0, 2, 4]

  WHY can't we just average these deviations?
  Sum = -3-1-1-1+0+0+2+4 = 0  (always!)
  Positive and negative deviations CANCEL OUT. Useless.

  Step 3: SQUARE each deviation (all positive now):
  [9, 1, 1, 1, 0, 0, 4, 16]

  Step 4: Average the squared deviations → VARIANCE (σ²):
  σ² = (9+1+1+1+0+0+4+16) / 8 = 32/8 = 4.0

  Step 5: Square root → Standard Deviation (σ):
  σ = √4.0 = 2.0

  COMPLETE FORMULA:
  σ = √[ (1/n) Σᵢ (xᵢ - μ)² ]

  WHY SQUARE ROOT?
  Squaring changed units: if data is in cm, variance is in cm².
  Square root brings it back to cm — same units as original data!
  σ=2 means "on average, points are about 2 cm away from the mean."

POPULATION vs SAMPLE STD:
  Population σ: divide by n    (you have ALL the data)
  Sample s:     divide by n-1  (you have a SAMPLE of data)

  WHY n-1 for samples? (Bessel's correction)
  When we estimate μ from the sample (not true population mean),
  we've already "used up" one degree of freedom.
  If we use n, the sample std UNDERESTIMATES true population std.
  Dividing by n-1 corrects this bias.

  numpy: std(ddof=0) = population (default)
         std(ddof=1) = sample (use in statistics)
  pandas df.std()   = sample by default (ddof=1)
```

```python
import numpy as np

data = np.array([2., 4., 4., 4., 5., 5., 7., 9.])

# numpy computes this
print(np.std(data))     # 2.0 (population, ddof=0)
print(np.std(data, ddof=1))  # 2.138 (sample)

# WHAT numpy IS LITERALLY DOING — no magic:
n    = len(data)
mu   = np.sum(data) / n                    # Step 1: mean = 5.0
devs = data - mu                           # Step 2: deviations
sq_devs = devs ** 2                        # Step 3: squared deviations
variance = np.sum(sq_devs) / n            # Step 4: variance = 4.0
std_dev  = np.sqrt(variance)              # Step 5: std = 2.0

print(f"mu={mu}, variance={variance}, std={std_dev}")

# VISUALIZING what 1σ, 2σ, 3σ mean:
# For normally distributed data (the famous "bell curve"):
# 68.27% of data falls within μ ± 1σ  (within one std of mean)
# 95.45% of data falls within μ ± 2σ
# 99.73% of data falls within μ ± 3σ  ← the "3-sigma rule"
#
# ANALOGY: Town height distribution, mean=170cm, std=10cm
# 68% of people: 160cm to 180cm
# 95% of people: 150cm to 190cm
# 99.7% of people: 140cm to 200cm
# Finding someone 220cm tall (5σ away) = 1 in 3.5 million!
```

---

# PART 3: StandardScaler — What .fit() And .transform() Actually Do

---

```
PROBLEM: Your ML dataset has features at wildly different scales:
  age: [25, 30, 35, 45]         range: 20-80
  salary: [30000, 50000, 80000] range: 30k-200k

  When you train a model, the large-scale features (salary)
  DOMINATE the small-scale features (age) — not because salary
  is more important, just because the numbers are bigger.

  For distance-based models (KNN, SVM) this is catastrophic.
  For gradient-based models (Neural Nets, Logistic Regression)
  features with large values cause large gradients → unstable training.

STANDARDIZATION (Z-score normalization):
  Transform each feature so it has: mean=0, std=1

  Formula: z = (x - μ) / σ

  ANALOGY: Converting to a UNIVERSAL LANGUAGE.
  Temperature: 100°C vs 212°F — same heat, different scales.
  Z-score converts to "how many standard deviations from average?"
  This is universal: z=2 always means "2 std above average."

  BEFORE:  age=[25, 30, 35, 45], salary=[30k, 50k, 80k, 200k]
  AFTER (z-score):  age≈[-1.2, -0.4, 0.4, 1.3], salary≈[-0.8, -0.5, -0.1, 1.3]

  Both features now live in the same range!

THE TWO-STEP PROCESS (.fit + .transform):
  .fit(X_train):
    Compute μ and σ for EACH feature from TRAINING data.
    Store these values. Don't touch X_train.

  .transform(X):
    Apply z = (x - μ) / σ using the STORED μ and σ.

  WHY SEPARATE?
  Critical rule: Fit ONLY on training data, transform BOTH train and test.

  If you fit on test data too → DATA LEAKAGE!
  The scaler would "see" future data during training.
  Your model would look better than it really is in real deployment.
```

```python
import numpy as np

class ManualStandardScaler:
    """
    Exact re-implementation of sklearn's StandardScaler.
    This is what sklearn.preprocessing.StandardScaler does internally.
    """
    def __init__(self):
        self.mean_ = None     # μ per feature
        self.scale_ = None    # σ per feature

    def fit(self, X):
        """
        Compute and STORE mean and std for each feature column.
        X shape: (n_samples, n_features)
        """
        # Step 1: Mean per column (axis=0 = across rows, per column)
        self.mean_ = np.mean(X, axis=0)      # shape: (n_features,)
        # Step 2: Std per column
        self.scale_ = np.std(X, axis=0)      # shape: (n_features,)
        return self   # for method chaining

    def transform(self, X):
        """
        Apply z = (x - μ) / σ using stored statistics.
        Broadcasting: subtract a (n_features,) vector from (n_samples, n_features)
        → numpy broadcasts it across all rows automatically.
        """
        return (X - self.mean_) / self.scale_

    def fit_transform(self, X):
        """Fit then transform in one step (convenience)"""
        return self.fit(X).transform(X)

    def inverse_transform(self, Z):
        """Undo the scaling: x = z * σ + μ"""
        return Z * self.scale_ + self.mean_

# Demo
X_train = np.array([[25, 30000],
                    [30, 50000],
                    [35, 80000],
                    [45, 200000]], dtype=float)

X_test = np.array([[28, 45000]], dtype=float)

scaler = ManualStandardScaler()
scaler.fit(X_train)
print(f"mean_ per feature: {scaler.mean_}")    # [33.75, 90000]
print(f"scale_ per feature: {scaler.scale_}")  # std of each column

X_train_scaled = scaler.transform(X_train)
X_test_scaled  = scaler.transform(X_test)   # Uses SAME μ,σ from train!

print("\nScaled training data:")
print(X_train_scaled)
# Verify: mean ≈ 0, std ≈ 1 for each column
print(f"\nMean check: {X_train_scaled.mean(axis=0)}")  # ≈ [0, 0]
print(f"Std check: {X_train_scaled.std(axis=0)}")      # ≈ [1, 1]

# Verify against sklearn
from sklearn.preprocessing import StandardScaler
sk_scaler = StandardScaler()
sk_result = sk_scaler.fit_transform(X_train)
print(f"\nSklearn matches ours: {np.allclose(X_train_scaled, sk_result)}")  # True!
```

---

# PART 4: `.fit()` in Linear Regression — Every Step Exposed

---

```
THE CLAIM: model = LinearRegression(); model.fit(X, y)
WHAT ACTUALLY HAPPENS: 300 years of mathematics executed in milliseconds.

SETUP:
  We want to find weights w = [w₀, w₁, ..., wₙ] (coefficients)
  such that: ŷᵢ = w₀ + w₁x₁ᵢ + w₂x₂ᵢ + ... = Xᵢ · w

  We want our predictions ŷ to be as close as possible to true y.

THE LOSS FUNCTION — Measuring "how wrong":
  MSE = (1/n) Σᵢ (yᵢ - ŷᵢ)²
       = (1/n) Σᵢ (yᵢ - Xᵢ·w)²
       = (1/n) ‖y - Xw‖²    (in matrix form)

  WHY SQUARED?
  1. Differentiable everywhere (|error| has a kink at 0, hard to differentiate)
  2. Penalizes large errors MORE (error of 10 → penalty of 100, not just 10)
  3. Has a beautiful closed-form solution!

METHOD 1 — NORMAL EQUATION (what sklearn LinearRegression uses):

  We want minimum of MSE. Take derivative with respect to w, set to zero:
  dMSE/dw = (-2/n) Xᵀ (y - Xw) = 0

  Solve for w:
  Xᵀ Xw = Xᵀ y
  w = (XᵀX)⁻¹ Xᵀ y   ← The Normal Equation!

  This is the EXACT CLOSED-FORM SOLUTION. One matrix multiply.
  It's like solving 2x = 4 → x = 4/2 = 2.
  There's no iteration needed — we algebraically solve for the optimal w.

  ANALOGY: Finding the lowest point of a bowl.
  Instead of rolling a ball downhill step by step (gradient descent),
  the normal equation solves: "where is the exact minimum?" directly.

  COST: O(n·d²) — computing (XᵀX) is d×d matrix. If d (features) is large,
  this becomes expensive. For d=1000: 1000×1000 matrix inversion.

  SKLEARN USES: scipy.linalg.lstsq which uses SVD (more numerically stable).

METHOD 2 — GRADIENT DESCENT (what neural networks use):
  We can't compute the exact solution directly (for large/complex models).
  Instead: start at random w, repeatedly walk downhill on the loss surface.
```

```python
import numpy as np
import matplotlib.pyplot as plt

# ── COMPLETE LINEAR REGRESSION FROM SCRATCH ──
# No sklearn. Every line of math made explicit.

class LinearRegressionFromScratch:
    """
    Implements Linear Regression using both:
    1. Normal Equation (exact closed-form solution)
    2. Gradient Descent (iterative, shows the math step by step)
    """
    def __init__(self, method='normal', lr=0.01, n_iters=1000):
        self.method = method
        self.lr = lr
        self.n_iters = n_iters
        self.w = None  # weights (coefficients)
        self.b = None  # bias (intercept)
        self.loss_history = []

    def fit_normal_equation(self, X, y):
        """
        Solve: w = (XᵀX)⁻¹ Xᵀy

        Add bias column of ones to X (for intercept w₀):
        X_b = [[1, x₁], [1, x₂], ...] shape: (n, d+1)
        """
        n, d = X.shape
        # Add bias column: [1, x₁₁, x₁₂, ...]
        X_b = np.column_stack([np.ones(n), X])    # (n, d+1)

        # Normal equation: w = (XᵀX)⁻¹ Xᵀy
        XtX = X_b.T @ X_b                          # (d+1, d+1)
        Xty = X_b.T @ y                            # (d+1,)
        w_all = np.linalg.solve(XtX, Xty)         # numerically stable solve
        # (using solve is better than np.linalg.inv(XtX) @ Xty — avoids inversion)

        self.b = w_all[0]       # intercept (bias)
        self.w = w_all[1:]      # coefficients
        print(f"Normal Eq → w={self.w}, b={self.b:.4f}")

    def fit_gradient_descent(self, X, y):
        """
        GRADIENT DESCENT — iterative optimization.

        HOW IT WORKS:
        1. Start with w=0, b=0 (random is also fine)
        2. Compute predictions: ŷ = Xw + b
        3. Compute loss: MSE = (1/n)Σ(y-ŷ)²
        4. Compute gradients: dL/dw, dL/db
        5. Update: w = w - lr * dL/dw
        6. Repeat until convergence
        """
        n, d = X.shape
        self.w = np.zeros(d)    # initialize to zero
        self.b = 0.0

        for iteration in range(self.n_iters):
            # ── FORWARD PASS: make predictions ──
            y_pred = X @ self.w + self.b    # (n,) — matrix multiply + bias

            # ── COMPUTE LOSS (MSE) ──
            errors = y_pred - y             # (n,) — residuals
            loss = np.mean(errors ** 2)    # scalar
            self.loss_history.append(loss)

            # ── BACKWARD PASS: compute gradients ──
            # dL/dw: how does loss change as we change each weight?
            # L = (1/n)Σ(Xᵢ·w + b - yᵢ)²
            # dL/dwⱼ = (2/n) Σᵢ (ŷᵢ - yᵢ) · xᵢⱼ
            # In matrix form: dL/dw = (2/n) Xᵀ · errors
            dL_dw = (2/n) * X.T @ errors   # (d,)

            # dL/db: bias gradient
            # dL/db = (2/n) Σᵢ (ŷᵢ - yᵢ) = (2/n) mean of errors
            dL_db = (2/n) * np.sum(errors) # scalar

            # ── PARAMETER UPDATE: walk downhill by lr * gradient ──
            self.w -= self.lr * dL_dw      # weights update
            self.b -= self.lr * dL_db      # bias update

            # Log progress
            if iteration % 200 == 0:
                print(f"Iter {iteration:4d}: Loss={loss:.4f}, "
                      f"w={self.w}, b={self.b:.4f}")

    def fit(self, X, y):
        if self.method == 'normal':
            self.fit_normal_equation(X, y)
        else:
            self.fit_gradient_descent(X, y)

    def predict(self, X):
        return X @ self.w + self.b

# ── Test with synthetic data ──
np.random.seed(42)
X = np.random.rand(100, 1) * 10    # 100 points, x in [0,10]
y = 2.5 * X.ravel() + 7 + np.random.randn(100) * 0.5  # y = 2.5x + 7 + noise

# Method 1: Normal Equation (exact)
model1 = LinearRegressionFromScratch(method='normal')
model1.fit(X, y)
# Expect: w≈[2.5], b≈7.0

# Method 2: Gradient Descent (iterative)
model2 = LinearRegressionFromScratch(method='gd', lr=0.05, n_iters=1000)
model2.fit(X, y)
# Should converge to same answer!

# Compare with sklearn
from sklearn.linear_model import LinearRegression
sk = LinearRegression().fit(X, y)
print(f"\nsklearn: w={sk.coef_}, b={sk.intercept_:.4f}")
```

---

# PART 5: Gradient Descent — The Engine of All ML

---

```
THE CORE IDEA:
  Imagine you're blindfolded on a hilly landscape and want to find the valley.

  Strategy: Feel the slope under your feet.
             Take one step in the direction that goes DOWNHILL.
             Repeat until the ground is flat (no more descent).

  That's gradient descent!

  • The landscape = the loss function (MSE, cross-entropy, etc.)
  • Your position = the current weights w
  • The slope = the gradient ∇L(w)
  • Your step = learning rate × gradient
  • The valley = the minimum loss (optimal weights)

MATHEMATICS:
  gradient ∇L(w) = [∂L/∂w₁, ∂L/∂w₂, ..., ∂L/∂wₙ]
  = "vector of partial derivatives"
  = "the direction of STEEPEST ASCENT"

  We move OPPOSITE to gradient (downhill):
  w ← w - η · ∇L(w)

  η (eta) = learning rate: how big is each step?

THREE VARIANTS:

  BATCH GRADIENT DESCENT:
  Use ALL n training samples to compute gradient.
  ∇L = (2/n) Xᵀ(Xw - y)  ← sum over all examples

  Pro: Stable, smooth convergence
  Con: Slow for large datasets (n=100M → expensive gradient)

  STOCHASTIC GRADIENT DESCENT (SGD):
  Use ONE random sample at a time.
  ∇L ≈ 2 · xᵢ(xᵢ·w - yᵢ)  ← based on single example

  Pro: Fast update, can escape local minima (noisy!)
  Con: Very noisy, oscillates around minimum

  MINI-BATCH SGD (WHAT EVERYONE ACTUALLY USES):
  Use B samples (batch of 32, 64, 128, 256...).
  ∇L ≈ (2/B) X_batch.T @ errors_batch

  Pro: Best of both worlds. Vectorized (GPU-efficient). Stable enough.
  Con: Batch size is a hyperparameter to tune.

  WHY BATCH SIZE 32/64?
  Must fit in GPU memory. Must be power of 2 for efficiency.
  Larger batches → smoother gradients → faster convergence.
  Smaller batches → noisier → better generalization (regularization effect).

THE LEARNING RATE PROBLEM:
  η too large:  OVERSHOOT the minimum. Diverge. Loss goes UP.
                Like taking steps so large you hop over the valley.
  η too small:  VERY slow. 1M iterations to converge.
                Like shuffling 1mm per step.
  η just right: Goldilocks zone. Converges in reasonable iterations.

  SOLUTION: Learning rate schedulers!
  • Step decay: halve η every 30 epochs
  • Cosine annealing: η = η_min + (η_max - η_min)(1 + cos(πt/T))/2
  • OneCycleLR: warm up then aggressively anneal (state of the art)
```

---

# PART 6: `.fit()` in Decision Trees — The Math of Splitting

---

```
DECISION TREE .fit() DOES:
  Finds the best way to SPLIT data at each node.
  "Best" = split that creates the purest child nodes.

  WHAT IS PURITY?
  A node is PURE if all samples in it belong to the same class.
  A pure node → perfect prediction for everything in it!

  GINI IMPURITY (default in sklearn):
  Gini(node) = 1 - Σᵢ pᵢ²

  Where pᵢ = fraction of samples in class i.

  DERIVATION (intuitive):
  Probability of picking two samples of DIFFERENT classes =
  Σᵢ pᵢ(1 - pᵢ) = 1 - Σᵢ pᵢ²     ← Gini!

  So Gini measures: "how likely am I to mislabel a random sample?"

  EXAMPLE:
  Node A: [10 cats, 0 dogs]   → pₐₜ=1.0, p_dog=0.0
  Gini(A) = 1 - (1.0² + 0.0²) = 1 - 1 = 0   ← PERFECT PURITY

  Node B: [5 cats, 5 dogs]    → pₐₜ=0.5, p_dog=0.5
  Gini(B) = 1 - (0.5² + 0.5²) = 1 - 0.5 = 0.5  ← MAXIMUM IMPURITY

  Node C: [8 cats, 2 dogs]    → pₐₜ=0.8, p_dog=0.2
  Gini(C) = 1 - (0.64 + 0.04) = 1 - 0.68 = 0.32

INFORMATION GAIN — HOW A SPLIT IS CHOSEN:
  For every possible feature and every possible threshold, compute:

  IG = Gini(parent) - [n_left/n · Gini(left) + n_right/n · Gini(right)]

  PICK the split with MAXIMUM Information Gain!

  WORKED EXAMPLE:
  Parent: [5 cats, 5 dogs]   Gini(parent) = 0.5

  Split on weight ≤ 8kg?
  Left child (≤8kg):  [4 cats, 1 dog]  n=5   Gini = 1-(16/25+1/25) = 0.32
  Right child (>8kg): [1 cat, 4 dogs]  n=5   Gini = 1-(1/25+16/25) = 0.32

  IG = 0.5 - (5/10 × 0.32 + 5/10 × 0.32) = 0.5 - 0.32 = 0.18

  Split on color = brown?
  Left child (brown): [5 cats, 5 dogs]  Gini = 0.5
  Right child (not):  [0 cats, 0 dogs]  Gini = 0
  IG = 0.5 - (10/10 × 0.5 + 0/10 × 0) = 0.5 - 0.5 = 0.0

  Weight split wins! (IG=0.18 > IG=0)

THE ALGORITHM (Recursive Partitioning):
  1. For each feature j:
       For each unique value t in feature j:
         Compute IG for split (feature j ≤ t)
  2. Pick the (j, t) with highest IG
  3. Split node into Left (j ≤ t) and Right (j > t)
  4. Recurse on each child until stopping criterion

STOPPING CRITERIA (in sklearn):
  max_depth: stop when tree depth reaches limit
  min_samples_split: don't split if node has fewer than this many samples
  min_impurity_decrease: only split if IG > threshold
  max_features: only consider a random subset of features (for Random Forest)
```

```python
import numpy as np

def gini_impurity(y):
    """Compute Gini impurity for a set of labels y"""
    n = len(y)
    if n == 0:
        return 0
    classes = np.unique(y)
    probs = [(y == c).sum() / n for c in classes]
    return 1 - sum(p**2 for p in probs)

def information_gain(y, y_left, y_right):
    """Compute information gain for a proposed split"""
    n, n_l, n_r = len(y), len(y_left), len(y_right)
    return (gini_impurity(y)
            - (n_l/n) * gini_impurity(y_left)
            - (n_r/n) * gini_impurity(y_right))

def find_best_split(X, y):
    """
    The CORE of DecisionTree.fit() — find the best feature and threshold.
    This runs for every node during training.
    """
    best_gain = -1
    best_feature, best_threshold = None, None

    for feature_idx in range(X.shape[1]):
        thresholds = np.unique(X[:, feature_idx])

        for threshold in thresholds:
            left_mask = X[:, feature_idx] <= threshold
            right_mask = ~left_mask

            if left_mask.sum() == 0 or right_mask.sum() == 0:
                continue  # Skip trivial splits

            gain = information_gain(y, y[left_mask], y[right_mask])

            if gain > best_gain:
                best_gain = gain
                best_feature = feature_idx
                best_threshold = threshold

    return best_feature, best_threshold, best_gain

# Test it!
np.random.seed(42)
X = np.array([[2.0, 1.0], [3.0, 2.0], [8.0, 3.0],
              [9.0, 4.0], [7.0, 5.0], [1.0, 2.0]])
y = np.array([0, 0, 1, 1, 1, 0])  # 0=cat, 1=dog

feat, thresh, gain = find_best_split(X, y)
print(f"Best split: feature {feat}, threshold {thresh:.1f}, IG={gain:.4f}")
```

---

# PART 7: `.fit()` in Neural Networks — What Backpropagation Does

---

```
CHAIN RULE — The only math behind backpropagation:

  If y = f(g(x)), then:  dy/dx = f'(g(x)) · g'(x)

  That's it. Backpropagation is just applying the chain rule
  to a composition of many functions (the layers).

FORWARD PASS (making prediction):
  Input x → Layer 1 → Layer 2 → ... → Output ŷ → Loss L

  Each layer: hˡ = σ(Wˡ · hˡ⁻¹ + bˡ)
  Where σ is an activation function (ReLU, sigmoid, etc.)

BACKWARD PASS (computing gradients):
  Going BACKWARDS through the network using chain rule:

  ∂L/∂Wˡ = ∂L/∂hˡ · ∂hˡ/∂zˡ · ∂zˡ/∂Wˡ
           = δˡ · (hˡ⁻¹)ᵀ

  Where δˡ is the "error signal" flowing backwards.

COMPLETE WORKED EXAMPLE (2-layer network):

  Layer 1: z¹ = W¹x + b¹;  h¹ = ReLU(z¹) = max(0, z¹)
  Layer 2: z² = W²h¹ + b²; ŷ = sigmoid(z²) = 1/(1+e^(-z²))
  Loss:    L = -[y log(ŷ) + (1-y)log(1-ŷ)]  (binary cross-entropy)

  BACKWARD (chain rule):
  ∂L/∂ŷ = -y/ŷ + (1-y)/(1-ŷ)          (cross-entropy derivative)
  ∂L/∂z² = ŷ - y                        (sigmoid + cross-entropy = clean!)
  ∂L/∂W² = ∂L/∂z² · (h¹)ᵀ             (outer product)
  ∂L/∂b² = ∂L/∂z²
  ∂L/∂h¹ = (W²)ᵀ · ∂L/∂z²             (propagate to layer 1)
  ∂L/∂z¹ = ∂L/∂h¹ · [z¹ > 0]           (ReLU derivative: 1 if >0, else 0)
  ∂L/∂W¹ = ∂L/∂z¹ · xᵀ
  ∂L/∂b¹ = ∂L/∂z¹

  Then update: W ← W - η · ∂L/∂W   for every weight!
```

```python
import numpy as np

# Complete 2-layer neural network from scratch
# No PyTorch/TensorFlow — raw numpy
class TwoLayerNet:
    def __init__(self, input_dim, hidden_dim, output_dim, lr=0.01):
        # Xavier initialization (prevents vanishing/exploding gradients)
        scale1 = np.sqrt(2.0 / input_dim)
        scale2 = np.sqrt(2.0 / hidden_dim)

        self.params = {
            'W1': np.random.randn(hidden_dim, input_dim) * scale1,
            'b1': np.zeros((hidden_dim, 1)),
            'W2': np.random.randn(output_dim, hidden_dim) * scale2,
            'b2': np.zeros((output_dim, 1))
        }
        self.lr = lr
        self.cache = {}   # store intermediate values for backprop

    def relu(self, z):
        return np.maximum(0, z)   # element-wise max(0, z)

    def sigmoid(self, z):
        return 1 / (1 + np.exp(-np.clip(z, -500, 500)))  # clip prevents overflow

    def forward(self, X):
        """
        Forward pass: X → h1 → ŷ
        X shape: (input_dim, n_samples)
        """
        W1, b1, W2, b2 = (self.params[k] for k in ['W1','b1','W2','b2'])

        # Layer 1
        z1 = W1 @ X + b1       # (hidden, n)
        h1 = self.relu(z1)      # (hidden, n) — ReLU activation

        # Layer 2
        z2 = W2 @ h1 + b2      # (output, n)
        y_hat = self.sigmoid(z2) # (output, n) — sigmoid for binary classification

        # Store for backprop (we'll need these!)
        self.cache = {'X': X, 'z1': z1, 'h1': h1, 'z2': z2, 'y_hat': y_hat}
        return y_hat

    def compute_loss(self, y_hat, y):
        """Binary cross-entropy: L = -(y log(ŷ) + (1-y)log(1-ŷ))"""
        n = y.shape[1]
        eps = 1e-15  # prevent log(0)
        L = -np.mean(y * np.log(y_hat + eps) + (1-y) * np.log(1-y_hat + eps))
        return L

    def backward(self, y):
        """
        Backward pass: compute gradients using chain rule.
        Returns gradients for all parameters.
        """
        X, z1, h1, z2, y_hat = (self.cache[k] for k in ['X','z1','h1','z2','y_hat'])
        n = y.shape[1]

        # Gradient of loss w.r.t. sigmoid output:
        # d(cross-entropy)/d(sigmoid) = ŷ - y  (elegant result!)
        dz2 = y_hat - y                          # (output, n)

        # Gradients for Layer 2 parameters
        dW2 = (1/n) * dz2 @ h1.T                # (output, hidden)
        db2 = (1/n) * np.sum(dz2, axis=1, keepdims=True)  # (output, 1)

        # Propagate gradient to Layer 1
        dh1 = self.params['W2'].T @ dz2          # (hidden, n)

        # ReLU backward: gradient is 1 where z1>0, else 0
        dz1 = dh1 * (z1 > 0)                    # element-wise mask

        # Gradients for Layer 1 parameters
        dW1 = (1/n) * dz1 @ X.T                 # (hidden, input)
        db1 = (1/n) * np.sum(dz1, axis=1, keepdims=True)  # (hidden, 1)

        return {'dW1': dW1, 'db1': db1, 'dW2': dW2, 'db2': db2}

    def update_params(self, grads):
        """SGD update: w = w - lr * gradient"""
        for key in ['W1', 'b1', 'W2', 'b2']:
            self.params[key] -= self.lr * grads[f'd{key}']

    def fit(self, X, y, epochs=1000, print_every=100):
        """
        Training loop — what PyTorch's model.fit() does internally:
        1. Forward pass
        2. Compute loss
        3. Backward pass (backprop)
        4. Update weights
        Repeat!
        """
        for epoch in range(epochs):
            y_hat   = self.forward(X)          # FORWARD
            loss    = self.compute_loss(y_hat, y)  # LOSS
            grads   = self.backward(y)          # BACKWARD
            self.update_params(grads)           # UPDATE

            if epoch % print_every == 0:
                preds = (y_hat > 0.5).astype(int)
                acc   = (preds == y).mean()
                print(f"Epoch {epoch:4d}: Loss={loss:.4f}, Acc={acc:.3f}")

# Train on XOR problem (can't be solved by single layer!)
X = np.array([[0,0,1,1], [0,1,0,1]], dtype=float)  # (2 features, 4 samples)
y = np.array([[0,1,1,0]], dtype=float)               # XOR labels

net = TwoLayerNet(input_dim=2, hidden_dim=4, output_dim=1, lr=0.5)
net.fit(X, y, epochs=2000, print_every=500)
# Should reach near 100% accuracy — XOR is solvable with one hidden layer!
```

---

# PART 8: `.fit()` Across All Major Models — What Happens Under the Hood

---

```
QUICK REFERENCE: The algorithm behind every model's .fit()

MODEL               │ WHAT .fit() COMPUTES
────────────────────┼────────────────────────────────────────────────────────
LinearRegression    │ Normal Equation: w = (XᵀX)⁻¹Xᵀy (one step, exact)
                    │ OR scipy.linalg.lstsq via SVD decomposition
────────────────────┼────────────────────────────────────────────────────────
LogisticRegression  │ Iterative: Newton-CG, LBFGS, or SGD
                    │ Minimizes: -Σ[y log(σ(Xw)) + (1-y)log(1-σ(Xw))]
                    │ Gradient: Xᵀ(σ(Xw) - y)  (same clean formula as NN!)
────────────────────┼────────────────────────────────────────────────────────
DecisionTree        │ RECURSIVE GREEDY SEARCH
                    │ At each node: try all (feature, threshold) pairs
                    │ Pick max Information Gain (Gini or Entropy)
                    │ Split. Recurse. Until stopping criterion.
────────────────────┼────────────────────────────────────────────────────────
RandomForest        │ Bagging + Feature Subsampling
                    │ For each of n_estimators trees:
                    │   1. Bootstrap sample (sample n rows WITH replacement)
                    │   2. Train a DecisionTree, but at each split:
                    │      only consider √d random features
                    │ Prediction = majority vote (class) or mean (regression)
────────────────────┼────────────────────────────────────────────────────────
SVM                 │ Quadratic Programming (QP) solver
                    │ Minimize: ½‖w‖² subject to yᵢ(w·xᵢ + b) ≥ 1
                    │ sklearn uses libsvm (C library) — SMO algorithm
                    │ Sequential Minimal Optimization: solve 2 alphas at a time
────────────────────┼────────────────────────────────────────────────────────
KMeans              │ Expectation-Maximization (EM) style:
                    │ E-step: Assign each point to nearest centroid
                    │         argmin_k ‖xᵢ - μₖ‖²
                    │ M-step: Update centroids as mean of assigned points
                    │         μₖ = mean of all xᵢ in cluster k
                    │ Repeat until assignments stop changing.
────────────────────┼────────────────────────────────────────────────────────
GaussianNB          │ No iteration! Direct computation:
                    │ P(class) = count(class) / total    (prior)
                    │ P(x|class) = Gaussian(μₖⱼ, σ²ₖⱼ)  (per feature per class)
                    │ μₖⱼ = mean of feature j in class k
                    │ σ²ₖⱼ = variance of feature j in class k
────────────────────┼────────────────────────────────────────────────────────
PCA                 │ Eigendecomposition of covariance matrix:
                    │ C = (1/n) Xᵀ X    (d×d matrix)
                    │ eigendecomposition: C v = λ v
                    │ Sort eigenvectors by eigenvalue (descending)
                    │ Top-k eigenvectors = principal components
                    │ Transform: X_reduced = X @ components.T
                    │ (sklearn uses SVD on X directly, numerically stable)
────────────────────┼────────────────────────────────────────────────────────
Neural Network      │ Mini-batch SGD (or Adam) for many epochs:
                    │ For each batch:
                    │   Forward pass → compute predictions
                    │   Compute loss (cross-entropy, MSE, etc.)
                    │   Backward pass (chain rule) → compute all ∂L/∂w
                    │   Update: w ← w - η · ∂L/∂w  (or Adam's update)
────────────────────┼────────────────────────────────────────────────────────

ADAM OPTIMIZER (Adam = what most NNs actually use, not plain SGD):
  Adaptive Moment Estimation — uses per-parameter learning rates.

  mₜ = β₁mₜ₋₁ + (1-β₁)gₜ         (exponential moving average of gradients)
  vₜ = β₂vₜ₋₁ + (1-β₂)gₜ²        (exponential moving average of grad²)
  m̂ₜ = mₜ/(1-β₁ᵗ)                (bias correction for initialization)
  v̂ₜ = vₜ/(1-β₂ᵗ)

  w ← w - η · m̂ₜ / (√v̂ₜ + ε)

  INTUITION:
  mₜ: momentum (smooth gradient, reduces noise)
  vₙ: adapt learning rate (larger grad → smaller step, prevents big jumps)

  Typical defaults: η=0.001, β₁=0.9, β₂=0.999, ε=1e-8
```

---

## 🔗 Cross-References

| Topic                       | Related Content                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------ |
| **Applied to algorithms**   | [ML Algorithms](06_ML_Algorithms.md) — now you know the math behind each algorithm   |
| **Backprop in neural nets** | [Deep Learning](07_Deep_Learning_Fundamentals.md) — training loops, optimizers       |
| **Gradient descent in DL**  | [Frameworks](09_Frameworks_PyTorch_TF.md) — PyTorch autograd does this automatically |
| **Math foundations**        | [Math for ML](04_Math_For_ML.md) — linear algebra, calculus                          |


---

## Reality Check

**"Seeing the math implemented in code makes it rigorous"** ? Code makes the math CONCRETE and debuggable, which is different from rigorous � and the value is exactly the concreteness: the gradient descent you can watch converge (or diverge � the learning rate too high, visible), the matrix operation whose shapes you can print (the dimension-mismatch that abstract notation hides � the (n,m) times (m,k) that must align, the number-one implementation bug), the loss you can plot. Implementing the math from scratch once (the linear regression by hand, the backprop by hand) builds the intuition that using the library never does � you learn what the framework is doing, so when it misbehaves you know where to look. The rigor is in the mathematical reasoning; the code adds the concreteness that makes the reasoning stick and debuggable.

**"Numerical code that runs is numerically correct"** ? Numerical STABILITY is a whole class of bugs that run without erroring and produce wrong answers: the naive softmax that overflows (exp of a large number is inf � the log-sum-exp trick exists for this, the standard fix every framework uses internally), the catastrophic cancellation (subtracting two nearly-equal floats loses precision � [03 NumPy, 16_JS] float), the log(0) that is -inf and propagates NaN, the accumulation error over many operations. The code runs, the loss becomes NaN three epochs in, and the cause is a numerical-stability issue the mathematically-correct-but-naive implementation had. "Runs therefore correct" ignores that floating-point numerics has failure modes (overflow, underflow, cancellation, accumulation) that produce silently-wrong or NaN results from mathematically-valid formulas � the reason libraries implement the stable versions.

**"The formula and the efficient implementation are the same thing"** ? The mathematical formula and the computationally-efficient version often differ substantially, and knowing both matters: the formula that says "invert this matrix" (O(n cubed), numerically unstable) versus solving the linear system directly (the reason you never actually compute a matrix inverse in practice � solve, do not invert), the naive O(n squared) pairwise-distance versus the vectorized broadcast, the recomputed-value versus the cached ([14_MM]'s optimization). The formula expresses WHAT to compute; the implementation expresses HOW efficiently and stably � and the gap (do not invert, use log-space, vectorize, cache) is real engineering. "Same thing" is why naive-from-the-formula implementations are slow and unstable � the efficient version is a different expression of the same math.

**"If I understand the code, I understand the algorithm"** ? Reading an implementation shows the mechanics; understanding the algorithm is knowing WHY each step is there and what would break without it ([14_MM]'s why-it-works over what-it-does): why the gradient is computed this way (the chain rule), why this initialization (the symmetry-breaking, the variance-preservation), why this normalization (the geometry), why this regularization term (the overfitting it prevents). The code shows the what; the algorithm is the why � and the why is what transfers to the next problem, lets you modify the algorithm correctly, and diagnoses failures. The engineer who can read the ML code but not explain why each piece exists can run it and cannot fix it when it breaks or adapt it when the problem shifts.

**"Math-heavy ML topics are only for researchers"** ? The math-behind-the-code is what separates practitioners who can DEBUG and ADAPT from those who can only run recipes: the model not converging (the math diagnoses learning rate, initialization, or architecture), the numerical instability (the log-space fix), the feature engineering that helps (the geometry [04]), the metric that is misleading (the probability calibration). Applied ML is full of situations where the recipe fails and the math is the debugger � and the practitioner without it is stuck at "I tried the tutorial and it does not work." Researchers need the math to CREATE algorithms; practitioners need it to DEBUG and APPLY them � different depth, same necessity, and "only for researchers" is the framing that produces the recipe-follower who is helpless the moment the recipe breaks.
