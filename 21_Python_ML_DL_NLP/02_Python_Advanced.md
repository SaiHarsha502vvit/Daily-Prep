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

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| Threading / Concurrency | [Java Concurrency](../07_Modern_Java/Ch31_SB_Core_Part1.md) |
| Memory / Heap / GC | [Memory Foundations](../02_Data_Structures/01a_Memory_Foundations.md) |
| Hash Tables (dict internals) | [HashTable](../02_Data_Structures/01e_HashTable.md) |

---

> **Navigation**: [< Previous](01_Python_Core_Fundamentals.md) | [Back to Index](00_INDEX.md) | [Next >](03_NumPy_Pandas_Essentials.md)
