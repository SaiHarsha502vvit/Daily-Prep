> **Navigation**: [Back to Index](00_INDEX.md) | [Next >](02_Python_Advanced.md)

# 🐍 Python Core Fundamentals — Complete Guide

> _"Python is the lingua franca of data science, ML, and automation."_

---

# PART 0: The 5W+H Framework

> **Mental Model:** If Java is a formal business suit (strict types, verbose, enforced structure), Python is smart-casual wear (dynamic types, concise, flexible). Both are professional, but Python lets you move faster when prototyping and data-wrangling.

| Question | Python Context |
| :--- | :--- |
| **WHAT** | A high-level, interpreted, dynamically-typed programming language designed for readability and rapid development. |
| **WHY** | Because it prioritizes developer productivity over machine speed. Python's clean syntax lets you express complex ideas in fewer lines than Java/C++, making it ideal for data science, scripting, and prototyping. |
| **WHEN** | Use for: ML/AI, data analysis, scripting/automation, web backends (Django/Flask), API development. Avoid for: real-time systems, mobile apps, performance-critical loops. |
| **WHERE** | Runs on CPython interpreter (default), Anaconda distribution (data science), or PyPy (speed). Deployed on servers, Jupyter notebooks, cloud functions, and embedded systems. |
| **WHO** | Created by Guido van Rossum in 1991, inspired by ABC language. Named after Monty Python. Maintained by the Python Software Foundation. |
| **HOW** | Source code → CPython compiler → Bytecode (.pyc) → CPython VM executes bytecode. The GIL (Global Interpreter Lock) ensures only one thread executes Python bytecode at a time. |

### Where It's Used in Real World
- **Google**: Python is one of Google's three official languages. Used in YouTube, Google Search, and internal tools.
- **Instagram**: The entire backend is built on Django (Python web framework) serving 2B+ monthly active users.
- **NASA/SpaceX**: Used for flight software testing, data analysis, and simulation.
- **Data Science**: 90%+ of Kaggle competition winners use Python (pandas, scikit-learn, PyTorch).
- **DevOps/Automation**: Ansible, SaltStack, and most cloud SDKs are Python-based.

---

# PART 1: Python Internals — Everything is an Object

---

## 1.1 Memory Model — How Python Stores Data

```
CRITICAL DIFFERENCE FROM JAVA:
  Java: int x = 5;     → x is a BOX that holds the value 5
  Python: x = 5        → x is a LABEL pointing to an integer object 5

  In Python, EVERYTHING is an object — even integers!
  
  x = 5
  y = x    # y points to the SAME object as x
  y = 10   # y now points to a NEW object; x still points to 5

MUTABLE vs IMMUTABLE:
  Immutable (can't change in-place): int, float, str, tuple, frozenset, bool
  Mutable (can change in-place):     list, dict, set, custom objects
  
  WHY THIS MATTERS:
  a = [1, 2, 3]
  b = a           # b points to SAME list object
  b.append(4)     # modifies the shared object
  print(a)        # [1, 2, 3, 4] ← a is affected too!
  
  a = (1, 2, 3)
  b = a           # b points to SAME tuple
  # b.append(4)   # ERROR! Tuples are immutable
  b = b + (4,)    # Creates a NEW tuple; a is unaffected

REFERENCE COUNTING & GARBAGE COLLECTION:
  import sys
  x = [1, 2, 3]
  print(sys.getrefcount(x))  # 2 (x + the getrefcount argument)
  
  y = x                       # refcount = 3
  del y                        # refcount = 2
  x = None                    # refcount = 1 (only getrefcount arg)
  # When refcount reaches 0 → object is deallocated immediately
  
  CPython also has a cyclic garbage collector for reference cycles:
  a = []; b = []; a.append(b); b.append(a)  # circular reference!
  # Reference counting can't clean this → GC detects and cleans cycles
```

## 1.2 Data Types Deep Dive

```python


> 🔬 **Section Challenge — 1.2 Data Types Deep Dive**
>>

# ═══════════════════════════════════════════
# NUMBERS
# ═══════════════════════════════════════════
x = 42              # int (arbitrary precision!)
y = 3.14            # float (64-bit IEEE 754)
z = 2 + 3j          # complex
big = 10**100        # Python handles arbitrarily large ints!

# Integer caching: Python pre-creates integers -5 to 256
a = 256
b = 256
print(a is b)    # True — same object (cached)
c = 257
d = 257
print(c is d)    # False — different objects (not cached)

# ═══════════════════════════════════════════
# STRINGS (immutable sequences of Unicode)
# ═══════════════════════════════════════════
s = "Hello, World!"
s[0]              # 'H'
# s[0] = 'h'     # TypeError! Strings are immutable
s.lower()         # 'hello, world!' — returns NEW string
s.split(', ')     # ['Hello', 'World!']
s.replace('World', 'Python')  # 'Hello, Python!'

# f-strings (Python 3.6+) — THE modern way
name, age = "Alice", 30
print(f"{name} is {age} years old")
print(f"Next year: {age + 1}")
print(f"Pi: {3.14159:.2f}")            # "Pi: 3.14"
print(f"{'hello':>20}")                 # right-justify, 20 chars

# String interning
a = "hello"
b = "hello"
print(a is b)    # True — CPython interns short strings

# ═══════════════════════════════════════════
# LISTS (mutable, ordered, heterogeneous)
# ═══════════════════════════════════════════
nums = [1, 2, 3, 4, 5]
nums.append(6)        # [1,2,3,4,5,6]
nums.insert(0, 0)     # [0,1,2,3,4,5,6]
nums.pop()            # removes and returns 6
nums.extend([7, 8])   # [0,1,2,3,4,5,7,8]

# SLICING (start:stop:step)
nums[2:5]        # [2, 3, 4]
nums[::-1]       # reversed
nums[::2]        # every other element

# List comprehension
squares = [x**2 for x in range(10)]                  # [0,1,4,9,16,25,36,49,64,81]
evens = [x for x in range(20) if x % 2 == 0]         # [0,2,4,...,18]
matrix = [[row*3+col for col in range(3)] for row in range(3)]  # 3x3 matrix

# INTERNAL: CPython list = dynamic array of PyObject* pointers
# Similar to Java's ArrayList — O(1) append amortized, O(n) insert

# ═══════════════════════════════════════════
# DICTIONARIES (hash map, O(1) lookup)
# ═══════════════════════════════════════════
user = {'name': 'Alice', 'age': 30, 'city': 'NYC'}
user['email'] = 'alice@mail.com'    # add
del user['city']                     # remove
user.get('phone', 'N/A')            # get with default

# Dict comprehension
word_lengths = {word: len(word) for word in ['hello', 'world', 'python']}
# {'hello': 5, 'world': 5, 'python': 6}

# INTERNAL: CPython dict = open-addressing hash table
# Python 3.7+: dicts maintain insertion order (guaranteed)

# ═══════════════════════════════════════════
# SETS (unique elements, unordered, O(1) lookup)
# ═══════════════════════════════════════════
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}
a | b       # union:        {1,2,3,4,5,6}
a & b       # intersection: {3,4}
a - b       # difference:   {1,2}
a ^ b       # symmetric diff: {1,2,5,6}

# ═══════════════════════════════════════════
# TUPLES (immutable lists — use for fixed data)
# ═══════════════════════════════════════════
point = (3, 4)
x, y = point          # tuple unpacking
colors = ('red', 'green', 'blue')
# colors[0] = 'yellow'  # TypeError!

# Named tuples (better than plain tuples)
from collections import namedtuple
Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
print(p.x, p.y)       # 3, 4 — readable!
```

---

# PART 2: Control Flow & Pythonic Patterns

---

## 2.1 Loops & Comprehensions

```python
# The Pythonic way vs. the Java way
# ❌ Java-style (works but not Pythonic)
for i in range(len(nums)):
    print(nums[i])

# ✅ Pythonic
for num in nums:
    print(num)

# ✅ When you need index + value
for i, num in enumerate(nums):
    print(f"Index {i}: {num}")

# ✅ Iterate two lists together
names = ['Alice', 'Bob', 'Charlie']
scores = [95, 87, 92]
for name, score in zip(names, scores):
    print(f"{name}: {score}")

# ✅ Dictionary iteration
for key, value in user.items():
    print(f"{key}: {value}")
```

## 2.2 Generators — Lazy Evaluation

```python


> 🔬 **Section Challenge — 2.2 Generators — Lazy Evaluation**
>
> **Challenge 1 (Reasoning):** A generator that yields 1,000,000 numbers — what's its memory footprint vs a list?
> <details><summary>Answer</summary>
>
> Generator: O(1) — stores only the current execution state (stack frame: local variables, instruction pointer). ~200-300 bytes total, regardless of N. List: O(N) — stores all 1M integer objects. 1M Python ints ≈ 28MB (small ints cached, but larger ints ~28 bytes each). Generators are essential for: large file processing (yield one line at a time), infinite sequences, streaming pipelines where you process and discard data.
> </details>
>

# PROBLEM: Processing 1 billion numbers
# ❌ List stores ALL in memory: 8GB for 1B integers
all_squares = [x**2 for x in range(1_000_000_000)]  # MemoryError!

# ✅ Generator: computes ONE at a time, O(1) memory
def square_gen(n):
    for i in range(n):
        yield i ** 2           # 'yield' pauses and returns one value

gen = square_gen(1_000_000_000)
print(next(gen))   # 0
print(next(gen))   # 1  — computed on demand!

# Generator expression (like list comprehension but lazy)
gen = (x**2 for x in range(1_000_000_000))  # Note: () not []
print(sum(gen))    # Works! Processes one at a time.

# WHY THIS MATTERS FOR ML:
# DataLoaders in PyTorch use generators to load batches lazily
# You can't fit 1TB of images in RAM — you yield one batch at a time
```

---

# PART 3: Functions — First-Class Citizens

---

## 3.1 Functions are Objects

```python


> 🔬 **Section Challenge — 3.1 Functions are Objects**
>>
> **Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
> <details><summary>Answer</summary>
>
> Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
> </details>
>

# In Python, functions ARE objects. You can:
# 1. Assign them to variables
# 2. Pass them as arguments
# 3. Return them from functions

def greet(name):
    return f"Hello, {name}!"

# Assign to variable
say_hello = greet
print(say_hello("Alice"))  # "Hello, Alice!"

# Pass as argument (higher-order function)
def apply(func, value):
    return func(value)
print(apply(greet, "Bob"))  # "Hello, Bob!"

# *args and **kwargs
def flex(*args, **kwargs):
    print(f"Positional: {args}")    # tuple
    print(f"Keyword: {kwargs}")      # dict

flex(1, 2, 3, name="Alice", age=30)
# Positional: (1, 2, 3)
# Keyword: {'name': 'Alice', 'age': 30}
```

## 3.2 Decorators — Functions that Modify Functions

```python


> 🔬 **Section Challenge — 3.2 Decorators — Functions that Modify Functions**
>
> **Challenge 1 (Reasoning):** Why does a decorator without `@functools.wraps` break Flask/FastAPI route registration?
> <details><summary>Answer</summary>
>
> Flask uses function name (`func.__name__`) to register routes. Without `@functools.wraps`, the decorator replaces the original function with a `wrapper` function. All decorated routes have `__name__ = 'wrapper'` → duplicate view function name error. `@functools.wraps(fn)` copies `__name__`, `__doc__`, `__annotations__`  from the wrapped function. Same issue with pytest markers, Celery tasks, and any framework that inspects function attributes.
> </details>
>

# A decorator WRAPS a function to add behavior

import time

def timer(func):
    """Decorator that measures execution time"""
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end-start:.4f}s")
        return result
    return wrapper

@timer  # This is syntactic sugar for: train_model = timer(train_model)
def train_model(epochs):
    total = 0
    for i in range(epochs * 1000000):
        total += i
    return total

train_model(10)  # "train_model took 0.5234s"

# REAL-WORLD DECORATORS:
# @app.route('/api/users')        → Flask routing
# @login_required                  → Django auth
# @torch.no_grad()                 → PyTorch inference mode
# @staticmethod / @classmethod     → Python built-in
# @property                        → Getter/setter
```

## 3.3 Closures & Lambda

```python


> 🔬 **Section Challenge — 3.3 Closures & Lambda**
>
> **Challenge 1 (Reasoning):** A lambda captures a local variable. Why must the variable be effectively final?
> <details><summary>Answer</summary>
>
> Lambdas are closures — they capture the variable's VALUE at creation time (not a reference to the stack slot, which would be dangerous as the stack frame may be gone). If the variable could change after capture, the lambda would see a stale value. Java enforces 'effectively final' (never reassigned) to make the semantics predictable. Workaround: use an array `int[] counter = {0};` (the array reference is final, its contents can change — though this is not thread-safe).
> </details>
>

# CLOSURE: A function that remembers its enclosing scope
def make_multiplier(factor):
    def multiply(x):
        return x * factor   # 'factor' is captured from outer scope
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5))   # 10
print(triple(5))   # 15

# LAMBDA: Anonymous one-line functions
square = lambda x: x ** 2
print(square(4))   # 16

# Common with sorted/map/filter
students = [('Alice', 95), ('Bob', 87), ('Charlie', 92)]
sorted_by_score = sorted(students, key=lambda s: s[1], reverse=True)
# [('Alice', 95), ('Charlie', 92), ('Bob', 87)]
```

---

# PART 4: OOP in Python

---

```python
# Python OOP is DIFFERENT from Java OOP:
# 1. No access modifiers (no private/protected keywords)
# 2. Convention: _single_underscore = "private" (hint, not enforced)
# 3. __double_underscore = name mangling (harder to access accidentally)
# 4. Multiple inheritance is allowed
# 5. Everything is an object (even classes themselves)

class Animal:
    species_count = 0  # class variable (shared by all instances)
    
    def __init__(self, name, sound):   # constructor
        self.name = name               # instance variable
        self.sound = sound
        Animal.species_count += 1
    
    def speak(self):                    # instance method
        return f"{self.name} says {self.sound}!"
    
    def __str__(self):                  # toString equivalent
        return f"Animal({self.name})"
    
    def __repr__(self):                 # developer representation
        return f"Animal(name='{self.name}', sound='{self.sound}')"
    
    def __len__(self):                  # len(animal) works
        return len(self.name)

class Dog(Animal):                      # inheritance
    def __init__(self, name, breed):
        super().__init__(name, "Woof")  # call parent constructor
        self.breed = breed
    
    def fetch(self, item):
        return f"{self.name} fetches the {item}!"

# Usage
dog = Dog("Rex", "German Shepherd")
print(dog.speak())    # "Rex says Woof!"
print(dog.fetch("ball"))  # "Rex fetches the ball!"
print(len(dog))        # 3 (length of "Rex")

# DATACLASSES (Python 3.7+) — Modern way to create data-holding classes
from dataclasses import dataclass, field

@dataclass
class Student:
    name: str
    age: int
    grades: list = field(default_factory=list)
    
    @property
    def average_grade(self):
        return sum(self.grades) / len(self.grades) if self.grades else 0

s = Student("Alice", 20, [95, 87, 92])
print(s)                    # Student(name='Alice', age=20, grades=[95, 87, 92])
print(s.average_grade)      # 91.33

# MRO (Method Resolution Order) — How Python resolves multiple inheritance
class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass

print(D.__mro__)  # D → B → C → A → object  (C3 linearization algorithm)
```

---

# PART 5: Error Handling & Context Managers

---

```python
# TRY / EXCEPT / ELSE / FINALLY
try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(f"Error: {e}")           # "Error: division by zero"
except (TypeError, ValueError):
    print("Type or Value error")
else:
    print("Success!")              # Only runs if NO exception
finally:
    print("Always runs")          # Cleanup (like Java's finally)

# CUSTOM EXCEPTIONS
class InsufficientFundsError(Exception):
    def __init__(self, balance, amount):
        self.balance = balance
        self.amount = amount
        super().__init__(f"Cannot withdraw ${amount}, balance is ${balance}")

# CONTEXT MANAGERS (like Java's try-with-resources)
# Automatically handles cleanup (closing files, releasing locks)
with open('data.csv', 'r') as f:
    data = f.read()
# File is automatically closed here, even if an exception occurs!

# Custom context manager
from contextlib import contextmanager

@contextmanager
def timer(label):
    start = time.time()
    yield                              # code inside 'with' block runs here
    print(f"{label}: {time.time()-start:.4f}s")

with timer("Training"):
    # training code here
    pass
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| Python Lists (dynamic arrays) | [Arrays](../02_Data_Structures/01b_Arrays.md) |
| Python Dicts (hash maps) | [HashTable](../02_Data_Structures/01e_HashTable.md) |
| Generators / Iterators | [Stack & Queue](../02_Data_Structures/01d_Stack_Queue.md) |
| Sorting (`sorted()`, `list.sort()`) | [Sorting Fundamentals](../03_Algorithms/02a_Sorting_Fundamentals.md) |
| Decorators (design pattern) | [Design Patterns — Decorator](../06_OOP_Design/02_Design_Patterns.md) |

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


> **Navigation**: [Back to Index](00_INDEX.md) | [Next >](02_Python_Advanced.md)
