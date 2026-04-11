> **Navigation**: [< Previous](01_Python_Core_Fundamentals.md) | [Back to Index](00_INDEX.md) | [Next >](03_NumPy_Pandas_Essentials.md)

# 🐍 Python Advanced — Concurrency, Memory, and Internals

> _"Understanding Python's internals is what separates a script-writer from a Pythonista."_

---

# PART 0: The 5W+H Framework

| Question | Python Advanced Context |
| :--- | :--- |
| **WHAT** | Deep internals of CPython: the GIL, concurrency models (threading, multiprocessing, asyncio), memory management, and advanced type system features. |
| **WHY** | Because production Python code must handle web requests concurrently, process large datasets efficiently, and avoid memory leaks. |
| **WHEN** | When building web servers, data pipelines, ML training loops, or any system that needs performance beyond single-threaded Python. |
| **WHERE** | Backend services (FastAPI, Django), data engineering (Apache Airflow), ML pipelines, and system administration tools. |
| **HOW** | By choosing the right concurrency model: asyncio for I/O-bound tasks, multiprocessing for CPU-bound tasks, and careful memory management for large-scale data. |

---

# PART 1: The GIL — Python's Biggest Controversy

---

```
WHAT IS THE GIL?
  Global Interpreter Lock: a mutex that allows ONLY ONE thread to
  execute Python bytecode at a time (in CPython).

WHY DOES IT EXIST?
  CPython's memory management uses REFERENCE COUNTING.
  Without the GIL, two threads could modify a reference count
  simultaneously → race condition → memory corruption.
  The GIL is the simplest solution: only one thread runs Python at a time.

WHAT THIS MEANS:
  ❌ Python threads CANNOT achieve true CPU parallelism
  ✅ Python threads CAN run concurrently for I/O operations
  
  Because: while one thread waits for network/disk I/O,
  the GIL is RELEASED and another thread can run.

  CPU-bound:  threading = NO speedup (GIL blocks parallelism)
  I/O-bound:  threading = YES speedup (GIL released during I/O)
```

```python
import threading, multiprocessing, time

def cpu_task(n):
    """CPU-bound: compute-heavy"""
    total = 0
    for i in range(n):
        total += i * i
    return total

def io_task(seconds):
    """I/O-bound: waiting"""
    time.sleep(seconds)

# ─── Threading for I/O-bound ───
start = time.time()
threads = [threading.Thread(target=io_task, args=(1,)) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
print(f"Threading I/O: {time.time()-start:.2f}s")  # ~1s (parallel!)

# ─── Multiprocessing for CPU-bound ───
start = time.time()
with multiprocessing.Pool(4) as pool:
    results = pool.map(cpu_task, [10_000_000]*4)
print(f"Multiprocessing CPU: {time.time()-start:.2f}s")  # 4x faster!
```

---

# PART 2: Asyncio — Modern Concurrency

---

```python
import asyncio
import aiohttp  # async HTTP client

async def fetch_url(session, url):
    """Non-blocking HTTP request"""
    async with session.get(url) as response:
        return await response.text()

async def main():
    urls = [
        "https://api.github.com",
        "https://httpbin.org/get",
        "https://jsonplaceholder.typicode.com/posts/1",
    ]
    
    async with aiohttp.ClientSession() as session:
        # Launch ALL requests concurrently
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        
        for url, result in zip(urls, results):
            print(f"{url}: {len(result)} chars")

# asyncio.run(main())  # Runs the event loop

# KEY CONCEPTS:
# async def  → defines a coroutine (pausable function)
# await      → pauses coroutine until result is ready
# asyncio.gather → run multiple coroutines concurrently
# Event Loop → manages coroutine scheduling (like Node.js)
```

---

# PART 3: Memory Management Deep Dive

---

```python
import sys

# Object sizes
print(sys.getsizeof(0))        # 28 bytes (int object overhead!)
print(sys.getsizeof(1))        # 28 bytes
print(sys.getsizeof(10**100))  # 72 bytes (arbitrary precision)
print(sys.getsizeof(""))       # 49 bytes (string object overhead)
print(sys.getsizeof("hello"))  # 54 bytes
print(sys.getsizeof([]))       # 56 bytes (empty list)
print(sys.getsizeof([1,2,3]))  # 88 bytes (list + 3 pointers)

# Memory-efficient alternatives
from array import array         # typed array (like Java)
import numpy as np

# Python list of 1M ints: each int = PyObject (28 bytes) + pointer (8 bytes) ≈ 36MB
# NumPy array of 1M ints: each int = 4 bytes raw → 4MB (9x smaller!)

py_list = list(range(1_000_000))
np_array = np.arange(1_000_000, dtype=np.int32)

print(f"Python list: {sys.getsizeof(py_list)/1e6:.1f} MB")  # ~8 MB (pointers only!)
print(f"NumPy array: {np_array.nbytes/1e6:.1f} MB")          # 4 MB

# Slots: reduce memory per instance
class PointNormal:
    def __init__(self, x, y):
        self.x = x
        self.y = y
# Each instance has a __dict__ (280+ bytes overhead)

class PointSlots:
    __slots__ = ['x', 'y']     # No __dict__!
    def __init__(self, x, y):
        self.x = x
        self.y = y
# Each instance: ~64 bytes (4x less memory!)
```

---

# PART 4: Type Hints & Protocols

---

```python
from typing import List, Dict, Optional, Union, Callable, TypeVar, Protocol

# Basic type hints (Python 3.5+)
def greet(name: str) -> str:
    return f"Hello, {name}"

def process_scores(scores: List[float]) -> Dict[str, float]:
    return {"mean": sum(scores)/len(scores), "max": max(scores)}

# Optional = Union[X, None]
def find_user(user_id: int) -> Optional[dict]:
    return None  # or user dict

# Callable (function types)
def apply_func(func: Callable[[int], int], value: int) -> int:
    return func(value)

# Generics
T = TypeVar('T')
def first(items: List[T]) -> T:
    return items[0]

# Protocol (structural subtyping — like Go interfaces)
class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("Drawing circle")

def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())  # ✅ Works! Circle "implements" Drawable structurally
```

---

# PART 5: Decorators — Functions That Modify Functions

---

```python
import functools, time

# ── BASIC DECORATOR: adds behavior before/after a function ──
def timer(func):
    @functools.wraps(func)  # preserves __name__, __doc__ of original
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
    return "done"

# @timer is syntactic sugar for: slow_function = timer(slow_function)

# ── DECORATOR WITH ARGUMENTS ──
def retry(max_attempts=3, delay=1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        raise
                    print(f"Attempt {attempt} failed: {e}. Retrying in {delay}s...")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_attempts=3, delay=2)
def fetch_data(url):
    # might fail, retry up to 3 times
    pass

# ── CHAINING DECORATORS (applied bottom-up) ──
@timer               # second: time the cached function
@functools.lru_cache  # first: add caching
def fibonacci(n):
    if n < 2: return n
    return fibonacci(n-1) + fibonacci(n-2)
```

---

# PART 6: Context Managers — Resource Safety

---

```python
from contextlib import contextmanager, asynccontextmanager

# ── THE PROBLEM: resource leaks ──
# BAD: if process() raises, file stays open!
f = open("data.txt")
process(f.read())
f.close()

# GOOD: `with` guarantees cleanup
with open("data.txt") as f:
    process(f.read())
# f.close() is ALWAYS called, even on exception.

# ── CUSTOM CONTEXT MANAGER (class-based) ──
class DatabaseConnection:
    def __enter__(self):
        self.conn = create_connection()
        return self.conn
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.conn.close()  # ALWAYS closes, even on exception
        return False  # don't suppress exceptions

with DatabaseConnection() as conn:
    conn.execute("SELECT * FROM users")

# ── contextmanager DECORATOR (simpler!) ──
@contextmanager
def timer_context(label):
    start = time.perf_counter()
    yield  # code in `with` block runs here
    elapsed = time.perf_counter() - start
    print(f"{label}: {elapsed:.4f}s")

with timer_context("database query"):
    results = db.execute("SELECT * FROM large_table")

# ── ASYNC CONTEXT MANAGER ──
@asynccontextmanager
async def async_db():
    conn = await aiopg.connect(dsn)
    try:
        yield conn
    finally:
        await conn.close()

async with async_db() as conn:
    await conn.execute("SELECT 1")
```

---

# PART 7: Dataclasses — Structured Data Without Boilerplate

---

```python
from dataclasses import dataclass, field
from typing import List

# ── BASIC DATACLASS ──
@dataclass
class User:
    name: str
    email: str
    age: int = 0
    
    # Auto-generates: __init__, __repr__, __eq__
    # No need to write self.name = name boilerplate!

user = User("Alice", "alice@test.com", 30)
print(user)  # User(name='Alice', email='alice@test.com', age=30)

# ── FROZEN (immutable) ──
@dataclass(frozen=True)
class Point:
    x: float
    y: float
    # point.x = 5 → FrozenInstanceError!

# ── WITH SLOTS (memory-efficient) ──
@dataclass(slots=True)  # Python 3.10+
class Coordinate:
    x: float
    y: float
    z: float
    # Uses __slots__ → 40% less memory per instance

# ── POST_INIT VALIDATION ──
@dataclass
class Order:
    item: str
    quantity: int
    price: float
    total: float = field(init=False)
    
    def __post_init__(self):
        if self.quantity <= 0:
            raise ValueError("Quantity must be positive")
        self.total = self.quantity * self.price

# ── MUTABLE DEFAULT (use field!) ──
@dataclass
class Team:
    name: str
    members: List[str] = field(default_factory=list)  # NOT = []!
```

---

# PART 8: Generators & Iterators — Lazy Evaluation

---

```python
# ── GENERATOR: produces values one-at-a-time (lazy, memory-efficient) ──
def fibonacci_gen():
    a, b = 0, 1
    while True:
        yield a  # pause here, return value, resume on next()
        a, b = b, a + b

fib = fibonacci_gen()
print(next(fib))  # 0
print(next(fib))  # 1
print(next(fib))  # 1
# Memory: O(1) — only stores a, b. Not the entire sequence!

# ── GENERATOR EXPRESSION (like list comprehension but lazy) ──
squares_list = [x**2 for x in range(1_000_000)]  # 8MB in memory
squares_gen  = (x**2 for x in range(1_000_000))  # ~120 bytes!

# ── GENERATOR PIPELINE (Unix-pipe style) ──
def read_lines(filename):
    with open(filename) as f:
        for line in f:
            yield line.strip()

def filter_errors(lines):
    for line in lines:
        if "ERROR" in line:
            yield line

def extract_timestamps(lines):
    for line in lines:
        yield line.split()[0]

# Process 10GB log file with O(1) memory!
pipeline = extract_timestamps(filter_errors(read_lines("server.log")))
for timestamp in pipeline:
    print(timestamp)

# ── YIELD FROM (delegate to sub-generator) ──
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)  # recursively yield
        else:
            yield item

list(flatten([1, [2, [3, 4]], 5]))  # [1, 2, 3, 4, 5]
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| Threading / Concurrency | [Java Concurrency](../07_Modern_Java/Ch31_SB_Core_Part1.md) |
| Memory / Heap / GC | [Memory Foundations](../02_Data_Structures/01a_Memory_Foundations.md) |
| Hash Tables (dict internals) | [HashTable](../02_Data_Structures/01e_HashTable.md) |
| **Asyncio Deep Dive** | [Asyncio Internals](02b_Python_Asyncio_Internals.md) |
| **ML with Python** | [ML Fundamentals](05_ML_Fundamentals.md) — generators for data loading |
| **NumPy (memory-efficient)** | [NumPy/Pandas](03_NumPy_Pandas_Essentials.md) — array vs list comparison |
| **DevOps (Python in CI)** | [CI/CD](../22_DevOps/19_CICD_Pipelines.md) — Python testing in pipelines |

---


---

## 🏋️ Practice & Interview Questions — Python

### Predict / Trace
**Q1.** What prints?
```python
x = [1,2,3]
y = x
y.append(4)
print(x)
```
<details><summary>Answer</summary>

`[1, 2, 3, 4]` — `y = x` copies the **reference**, not the list. Both point to the same object. Python lists are mutable. **Fix**: `y = x.copy()` or `y = x[:]` for shallow copy.
</details>

**Q2.** What is the GIL and how does it affect threading in Python?
<details><summary>Answer</summary>

**Global Interpreter Lock**: allows only ONE thread to execute Python bytecode at a time per process. CPU-bound threads don't run truly in parallel — only I/O-bound threads benefit (GIL released during I/O). For CPU parallelism: use `multiprocessing` (separate processes, separate GILs) or Go/Java. CPython 3.13 has experimental free-threaded mode (GIL disabled).
</details>

### Coding Problems
**Q3.** ⭐ FizzBuzz in Python — most Pythonic way.
<details><summary>Solution</summary>

```python
for i in range(1, 101):
    print("FizzBuzz" if i%15==0 else "Fizz" if i%3==0 else "Buzz" if i%5==0 else i)
```
</details>

**Q4.** ⭐ Flatten a nested list recursively.
<details><summary>Solution</summary>

```python
def flatten(lst):
    result = []
    for item in lst:
        if isinstance(item, list): result.extend(flatten(item))
        else: result.append(item)
    return result
# or with generator:
# def flatten(lst): yield from (flatten(x) if isinstance(x,list) else [x] for x in lst)
```
</details>

**Q5.** ⭐⭐ Implement LRU Cache using `functools.lru_cache` vs manual implementation.
<details><summary>Solution</summary>

```python
# Built-in:
from functools import lru_cache
@lru_cache(maxsize=128)
def fib(n): return n if n<2 else fib(n-1)+fib(n-2)

# Manual with OrderedDict:
from collections import OrderedDict
class LRUCache:
    def __init__(self, cap): self.cap=cap; self.cache=OrderedDict()
    def get(self, key):
        if key not in self.cache: return -1
        self.cache.move_to_end(key); return self.cache[key]
    def put(self, key, val):
        self.cache[key]=val; self.cache.move_to_end(key)
        if len(self.cache)>self.cap: self.cache.popitem(last=False)
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | List vs Tuple | List: mutable; Tuple: immutable, hashable |
| 2 | `is` vs `==` | `is`: identity (same object); `==`: equality (same value) |
| 3 | Python `dict` ordering (3.7+) | Insertion order (guaranteed) |
| 4 | Generator vs list comprehension | Generator: lazy, O(1) memory; list: eager, O(N) memory |
| 5 | `*args` vs `**kwargs` | *args: positional varargs tuple; **kwargs: keyword varargs dict |
| 6 | `__slots__` purpose | Prevents instance `__dict__`, reduces memory per object |
| 7 | `asyncio` is true parallelism? | ❌ Cooperative concurrency (single thread, yields on await) |



---

## 🧠 Deep Conceptual Questions — Python Internals

**C1. How does Python's GIL work internally, and why hasn't it been removed?**
<details><summary>Deep Answer</summary>

GIL = a mutex in CPython's interpreter. Every Python thread must hold the GIL to execute bytecode. Released during: I/O (blocking syscalls), C extensions (NumPy, pandas release it during computation). Acquired every 100 bytecode instructions or yielded to other threads. WHY NOT REMOVED: CPython's memory management (reference counting) is not thread-safe. Without GIL: `ob_refcnt` (object reference count) must be protected by locks everywhere → massive overhead in single-threaded code. Every `del`, every function call return would need a lock. Previous removal attempts degraded single-threaded code by 30-50%. PyPy, Jython don't have GIL. CPython 3.13 enables experimental "no-GIL" mode (`python -X=nogil`) with per-object locks.
</details>

**C2. What is Python's memory model for integers and why does `is` fail for large ints?**
<details><summary>Deep Answer</summary>

CPython caches small integers (-5 to 256) as singletons. `a = 5; b = 5; a is b` → True (same object). `a = 1000; b = 1000; a is b` → False (new objects). This is CPython-specific optimization — not guaranteed by the language spec. String interning: short strings/identifiers often interned. NEVER use `is` for value comparison (use `==`). `is` tests identity (same object in memory). The integer cache exists because small ints are used everywhere; caching them saves millions of allocations in a typical program.
</details>

**C3. Generators: why are they memory-efficient and how does `yield` work internally?**
<details><summary>Deep Answer</summary>

A generator function returns a generator object. The function body doesn't execute at call time. Each `next()` call: resumes execution from the last `yield` point. Generator saves its stack frame between calls — it's a "suspended stack frame." Memory: generates values one at a time (O(1)) vs list comprehension generating all at once (O(N)). `yield from` (PEP 380): delegates to a sub-generator, chains yields through. Generators ARE the basis of `asyncio`: `async def` functions compile to coroutines which are generators under the hood. `await` ≈ `yield` to the event loop, "I'm waiting for something, run other tasks."
</details>

**C4. Decorators: what pattern underlies them and how do you preserve the wrapped function's metadata?**
<details><summary>Deep Answer</summary>

```python
@decorator
def func(): pass
# Same as: func = decorator(func)
```
Decorator = higher-order function. Problem: `@decorator` replaces `func` with wrapper — `func.__name__` becomes `"wrapper"`, `func.__doc__` is lost. Fix: `@functools.wraps(original_func)` on the wrapper copies `__name__`, `__doc__`, `__annotations__`, `__module__`. Without wraps: debugging is hell, introspection libraries break, Flask/FastAPI route registration may fail. Parameterized decorator: an outer function returning the actual decorator:
```python
def retry(n): return lambda fn: lambda *args: ... # 3 levels!
```
</details>

**C5. `asyncio`: why does `async/await` NOT use threads and how is it still concurrent?**
<details><summary>Deep Answer</summary>

`asyncio` is **cooperative multitasking** on a SINGLE thread. Event loop runs coroutines. A coroutine runs until it hits `await` — this is a VOLUNTARY yield to the event loop. Event loop picks the next ready coroutine. No preemption: if a coroutine runs CPU-bound code without awaiting, it blocks the ENTIRE event loop (other coroutines starve). Concurrency: while coroutine A awaits an HTTP response, coroutine B runs. Both "in flight" simultaneously on one thread. Why no threads: reduce context-switching overhead, simpler shared state (no locks — only one coroutine runs at a time per event loop), better for I/O-bound workloads (10,000 concurrent HTTP requests = 10,000 coroutines, not 10,000 threads).
</details>


> **Navigation**: [< Previous](01_Python_Core_Fundamentals.md) | [Back to Index](00_INDEX.md) | [Next >](03_NumPy_Pandas_Essentials.md)
