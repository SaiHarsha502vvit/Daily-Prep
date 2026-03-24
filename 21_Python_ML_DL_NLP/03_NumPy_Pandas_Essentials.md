> **Navigation**: [< Previous](02_Python_Advanced.md) | [Back to Index](00_INDEX.md) | [Next >](04_Math_For_ML.md)

# 📊 NumPy & Pandas Essentials — The Data Science Toolkit

> _"NumPy is the engine. Pandas is the dashboard. Together, they are 90% of data work."_

---

# PART 0: The 5W+H Framework

| Question | NumPy & Pandas Context |
| :--- | :--- |
| **WHAT** | NumPy: a library for fast numerical computing with N-dimensional arrays. Pandas: a library for data manipulation and analysis with labeled DataFrames. |
| **WHY** | Python lists are 10-100x slower than NumPy for numerical operations. Pandas provides SQL-like data wrangling in Python. Together they eliminate the need for Excel/SQL for most data tasks. |
| **WHEN** | Whenever you work with numerical data (NumPy) or structured/tabular data (Pandas). This is the first step in every ML pipeline. |
| **WHERE** | Used in: data preprocessing, feature engineering, exploratory data analysis (EDA), scientific computing, financial analysis, and as the foundation layer under scikit-learn and PyTorch. |
| **HOW** | NumPy stores data in contiguous C-level arrays (not Python objects) and uses vectorized operations (BLAS/LAPACK). Pandas builds on NumPy, adding labels (index/columns) and rich I/O (CSV, SQL, Excel). |

---

# PART 1: NumPy — The Numerical Backbone

---

## 1.1 ndarray — The Core Data Structure

```python
import numpy as np

# ─── Creation ───
a = np.array([1, 2, 3])                    # from list
b = np.zeros((3, 4))                         # 3×4 of zeros
c = np.ones((2, 3))                          # 2×3 of ones
d = np.arange(0, 10, 2)                      # [0, 2, 4, 6, 8]
e = np.linspace(0, 1, 5)                     # [0, 0.25, 0.5, 0.75, 1.0]
f = np.random.randn(3, 3)                    # 3×3 standard normal
g = np.eye(4)                                # 4×4 identity matrix

# ─── Key Attributes ───
X = np.random.rand(100, 5)
print(X.shape)     # (100, 5)   — dimensions
print(X.dtype)     # float64     — data type
print(X.ndim)      # 2           — number of dimensions
print(X.size)      # 500         — total elements
print(X.nbytes)    # 4000        — memory in bytes (500 * 8)

# WHY ndarray IS FAST:
# Python list: [PyObject*, PyObject*, PyObject*, ...]
#   Each element is a pointer to a Python object (28+ bytes each)
# NumPy array: [float64, float64, float64, ...]
#   Raw C-level values, contiguous in memory (8 bytes each)
#   → 10-100x faster due to cache locality + SIMD instructions
```

## 1.2 Vectorization — The Secret to Speed

```python
import time

n = 1_000_000

# ❌ Python loop (slow)
py_list = list(range(n))
start = time.time()
result = [x**2 + 2*x + 1 for x in py_list]
print(f"Python loop: {time.time()-start:.4f}s")

# ✅ NumPy vectorized (fast)
np_arr = np.arange(n)
start = time.time()
result = np_arr**2 + 2*np_arr + 1
print(f"NumPy vector: {time.time()-start:.4f}s")

# NumPy is ~50x faster because:
# 1. Operations run in compiled C/Fortran (not Python interpreter)
# 2. No type checking per element
# 3. SIMD: CPU processes 4-8 floats simultaneously
# 4. Cache-friendly memory layout
```

## 1.3 Broadcasting — NumPy's Magic

```python
# Broadcasting: NumPy automatically expands smaller arrays
# to match larger arrays for element-wise operations

# Add scalar to array
a = np.array([1, 2, 3])
print(a + 10)              # [11, 12, 13]

# Add column vector to matrix (broadcasts across columns)
M = np.array([[1, 2, 3],
              [4, 5, 6]])  # (2, 3)
v = np.array([[10],
              [20]])        # (2, 1)
print(M + v)                # [[11, 12, 13],
                             #  [24, 25, 26]]

# BROADCASTING RULES:
# 1. Align shapes from the RIGHT
# 2. Dimensions must match OR one of them must be 1
# (2, 3) + (1, 3) → (2, 3)    ✅ broadcasts row
# (2, 3) + (2, 1) → (2, 3)    ✅ broadcasts column
# (2, 3) + (2,)   → ERROR     ❌ trailing dims don't match
# (2, 3) + (3,)   → (2, 3)    ✅ (3,) treated as (1, 3)
```

## 1.4 Linear Algebra in NumPy

```python
# Matrix operations for ML
A = np.random.rand(3, 4)
B = np.random.rand(4, 2)

# Matrix multiply (forward pass in neural networks!)
C = A @ B                        # (3, 4) @ (4, 2) = (3, 2)
C = np.dot(A, B)                 # equivalent

# Transpose
print(A.T.shape)                  # (4, 3)

# Inverse (for Normal Equation: w = (XᵀX)⁻¹Xᵀy)
X = np.random.rand(4, 4)
X_inv = np.linalg.inv(X)

# Eigenvalues (for PCA)
cov = np.cov(np.random.rand(5, 100))
eigenvalues, eigenvectors = np.linalg.eig(cov)

# SVD (for dimensionality reduction, recommendation systems)
U, S, Vt = np.linalg.svd(A)

# Norms (for regularization)
v = np.array([3, 4])
print(np.linalg.norm(v))         # 5.0 (L2 norm: √(9+16))
print(np.linalg.norm(v, ord=1))  # 7.0 (L1 norm: |3|+|4|)
```

---

# PART 2: Pandas — The Data Manipulation Powerhouse

---

## 2.1 Series & DataFrame

```python
import pandas as pd

# ─── Series: 1D labeled array ───
s = pd.Series([10, 20, 30], index=['a', 'b', 'c'])
print(s['b'])     # 20

# ─── DataFrame: 2D labeled table ───
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'age': [25, 30, 35, 28],
    'salary': [50000, 60000, 70000, 55000],
    'dept': ['Eng', 'Sales', 'Eng', 'Sales']
})

# ─── Basic Inspection ───
print(df.shape)          # (4, 4)
print(df.dtypes)         # column types
print(df.describe())     # statistical summary
print(df.info())         # memory usage, null counts
print(df.head(2))        # first 2 rows

# ─── Selection ───
df['name']                          # single column (Series)
df[['name', 'age']]                 # multiple columns (DataFrame)
df.loc[0]                           # row by label
df.iloc[0:2]                        # rows by position
df.loc[df['age'] > 28]              # boolean filtering
df.query('age > 28 and dept == "Eng"')  # SQL-like query
```

## 2.2 Data Wrangling Operations

```python
# ─── Missing Values ───
df['bonus'] = [5000, None, 7000, None]
df.isnull().sum()                    # count nulls per column
df.fillna(0)                         # fill with 0
df.dropna()                          # drop rows with any null
df['bonus'].fillna(df['bonus'].median(), inplace=True)  # fill with median

# ─── Apply & Transform ───
df['salary_k'] = df['salary'].apply(lambda x: x / 1000)
df['name_upper'] = df['name'].str.upper()

# ─── GroupBy (SQL-like aggregation) ───
dept_stats = df.groupby('dept').agg({
    'salary': ['mean', 'max', 'count'],
    'age': 'mean'
})
print(dept_stats)

# ─── Merge (SQL JOIN) ───
dept_info = pd.DataFrame({
    'dept': ['Eng', 'Sales'],
    'location': ['NYC', 'SF']
})
merged = pd.merge(df, dept_info, on='dept', how='left')

# ─── Pivot Table ───
pivot = df.pivot_table(
    values='salary', index='dept', aggfunc=['mean', 'count']
)

# ─── Window Functions (rolling/expanding) ───
df['salary_rolling_avg'] = df['salary'].rolling(window=2).mean()
df['salary_cumsum'] = df['salary'].cumsum()

# ─── I/O ───
df.to_csv('output.csv', index=False)
df.to_parquet('output.parquet')
# df = pd.read_csv('data.csv')
# df = pd.read_sql('SELECT * FROM users', connection)
# df = pd.read_excel('data.xlsx')
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| Arrays (ndarray internals) | [Arrays](../02_Data_Structures/01b_Arrays.md) |
| Hash Maps (Pandas index) | [HashTable](../02_Data_Structures/01e_HashTable.md) |
| Sorting (df.sort_values) | [Sorting Fundamentals](../03_Algorithms/02a_Sorting_Fundamentals.md) |
| Matrix operations → ML | [Math for ML](04_Math_For_ML.md) |

---

> **Navigation**: [< Previous](02_Python_Advanced.md) | [Back to Index](00_INDEX.md) | [Next >](04_Math_For_ML.md)
