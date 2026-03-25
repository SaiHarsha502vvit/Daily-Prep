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
# df = pd.read_excel('data.xlsx')
```

---

# PART 3: Advanced NumPy Internals

---

## 3.1 Views vs Copies (Preventing Memory Leaks)

```python
# A common source of bugs and memory issues!

# ─── SlICES CREATE VIEWS ───
a = np.arange(10)          # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
b = a[2:6]                 # [2, 3, 4, 5] — THIS IS A VIEW, NOT A COPY
b[0] = 99                  # Modify the view...
print(a)                   # ...and the original changes! [0, 1, 99, 3, ...]

# To force a copy:
c = a[2:6].copy()
c[0] = 55
print(a)                   # Original remains unchanged

# ─── FANCY INDEXING CREATES COPIES ───
# If you extract data using a list of indices or a boolean mask, it COPIES.
indices = [2, 3, 4]
d = a[indices]             # THIS IS A COPY
d[0] = 88
print(a)                   # Unchanged!
```

## 3.2 Strides — The Secret Behind Reshape

```python
# How does NumPy reshape a 1M element array in O(1) time? STRIDES.
# A NumPy array is just a contiguous block of memory + metadata.
# Strides dictate how many BYTES to step to get to the next element.

x = np.arange(12, dtype=np.int32)  # [0, 1, 2, ..., 11] (48 bytes total)
print(x.shape)                     # (12,)
print(x.strides)                   # (4,) → step 4 bytes for next element

y = x.reshape(3, 4)
print(y.shape)                     # (3, 4)
print(y.strides)                   # (16, 4) 
# To go to the next column: step 4 bytes
# To go to the next row: step 16 bytes (4 elements * 4 bytes)

# Reshape didn't move any data! It just changed the strides metadata.
# This makes transpose() and reshape() completely free O(1) operations.
z = y.T
print(z.shape)                     # (4, 3)
print(z.strides)                   # (4, 16) — just swapped the strides!
```

## 3.3 Advanced Indexing

```python
# ─── Boolean Masking ───
arr = np.random.randint(1, 100, size=20)
mask = (arr > 50) & (arr % 2 == 0)  # >50 AND Even
filtered = arr[mask]

# Update specific elements without looping
arr[arr < 10] = 0                  # Set all values < 10 to 0

# ─── Fancy Indexing ───
matrix = np.arange(36).reshape(6, 6)
# Get rows 0, 2, 5
print(matrix[[0, 2, 5]])

# Get specific points: (0,1), (2,3), (5,5)
rows = [0, 2, 5]
cols = [1, 3, 5]
print(matrix[rows, cols])          # [1, 15, 35]
```

---

# PART 4: Advanced Pandas Techniques

---

## 4.1 MultiIndex (Hierarchical Indexing)

```python
import pandas as pd
import numpy as np

# MultiIndex allows working with higher-dimensional data in 2D DataFrames.
arrays = [
    ['Sales', 'Sales', 'Engineering', 'Engineering'],
    ['2023', '2024', '2023', '2024']
]
index = pd.MultiIndex.from_arrays(arrays, names=['Department', 'Year'])
df_multi = pd.DataFrame({'Budget_M': [10, 12, 50, 55], 'Headcount': [20, 22, 100, 110]}, index=index)

print(df_multi)
#                     Budget_M  Headcount
# Department  Year                       
# Sales       2023        10         20
#             2024        12         22
# Engineering 2023        50        100
#             2024        55        110

# Selecting data
print(df_multi.loc['Engineering'])               # Gets both years for Engineering
print(df_multi.loc[('Sales', '2024')])           # Specific intersection

# Cross-section (get 2024 data for ALL departments)
print(df_multi.xs('2024', level='Year'))
```

## 4.2 Time Series Data

```python
# Pandas was originally built for financial time series!

# Parse dates on load
df = pd.read_csv('stocks.csv', parse_dates=['Date'], index_col='Date')

# Date generation
dates = pd.date_range(start='2024-01-01', periods=100, freq='D')
ts = pd.Series(np.random.randn(100), index=dates)

# Resampling (Aggregate by time)
# E.g., tick data → daily data, or daily → monthly
monthly_mean = ts.resample('M').mean()
weekly_sum = ts.resample('W').sum()

# Shifting (for percentage change / YoY calculations)
ts_shifted = ts.shift(1)  # moves data down 1 row
pct_change = (ts - ts_shifted) / ts_shifted
# Or simply:
pct_change = ts.pct_change()
```

## 4.3 Memory Optimization (Crucial for 1GB+ Datasets)

```python
# Naive pandas loading wastes a LOT of memory.
# By default, Pandas reads integers as int64 and floats as float64.

df = pd.read_csv('huge_data.csv')
print(df.info(memory_usage='deep'))  # Check exact memory usage

# 1. DOWNCASTING NUMERICS
# If an age column is int64 (8 bytes), but only goes from 0-120...
# We can use int8 (1 byte)! 8x memory savings.
df['age'] = pd.to_numeric(df['age'], downcast='integer')
df['price'] = pd.to_numeric(df['price'], downcast='float')

# 2. CATEGORICAL DATA
# If a string column has few unique values (e.g., 'Status': 'Pending', 'Paid', 'Failed')
# String = object dtype (very heavy, pointers to strings).
# Category = mapped to integers under the hood!
df['status'] = df['status'].astype('category')
# Memory goes from e.g., 50MB → 1MB.

# 3. CHUNKING (When data > RAM)
# Don't load a 50GB file into 16GB RAM. Process in chunks!
chunk_size = 100_000
total_sales = 0

for chunk in pd.read_csv('50GB_sales.csv', chunksize=chunk_size):
    # Process only 100k rows at a time
    chunk['status'] = chunk['status'].astype('category')
    total_sales += chunk.loc[chunk['status'] == 'Paid', 'amount'].sum()
    
print(f"Total Paid Sales: {total_sales}")
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
