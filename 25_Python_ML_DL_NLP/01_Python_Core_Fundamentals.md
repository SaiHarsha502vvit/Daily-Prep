**Navigation**: [Back to Index](00_INDEX.md) | [Next >](02_Python_Advanced.md)

# 🐍 Python Core Fundamentals — Complete Guide

_"Python is the lingua franca of data science, ML, and automation."_

---

# PART 0: The 5W+H Framework

**Mental Model:** If Java is a formal business suit (strict types, verbose, enforced structure), Python is smart-casual wear (dynamic types, concise, flexible). Both are professional, but Python lets you move faster when prototyping and data-wrangling.

| Question  | Python Context                                                                                                                                                                                                     |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WHAT**  | A high-level, interpreted, dynamically-typed programming language designed for readability and rapid development.                                                                                                  |
| **WHY**   | Because it prioritizes developer productivity over machine speed. Python's clean syntax lets you express complex ideas in fewer lines than Java/C++, making it ideal for data science, scripting, and prototyping. |
| **WHEN**  | Use for: ML/AI, data analysis, scripting/automation, web backends (Django/Flask), API development. Avoid for: real-time systems, mobile apps, performance-critical loops.                                          |
| **WHERE** | Runs on CPython interpreter (default), Anaconda distribution (data science), or PyPy (speed). Deployed on servers, Jupyter notebooks, cloud functions, and embedded systems.                                       |
| **WHO**   | Created by Guido van Rossum in 1991, inspired by ABC language. Named after Monty Python. Maintained by the Python Software Foundation.                                                                             |
| **HOW**   | Source code → CPython compiler → Bytecode (.pyc) → CPython VM executes bytecode. The GIL (Global Interpreter Lock) ensures only one thread executes Python bytecode at a time.                                     |

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


🔬 **Section Challenge — 1.2 Data Types Deep Dive**

**Challenge 1 (Reasoning):** `a = 256; b = 256; print(a is b)` → True. `a = 257; b = 257; print(a is b)` → False. But in a .py script file, `a = 257; b = 257; print(a is b)` → True! Why does the behavior differ between the REPL and a script?
<details><summary>Answer</summary>

CPython caches integers -5 to 256 in a pre-allocated array ("small integer cache"). Any variable assigned a value in this range points to the SAME object → `is` returns True. For 257+ in the REPL, each line is compiled separately, so `a = 257` and `b = 257` create two distinct int objects. In a .py script, the entire file is compiled as ONE code block — the compiler sees both `257` literals, deduplicates them into a single constant in the code object's `co_consts` tuple, and both variables point to it. **Key insight:** `is` checks **identity** (same object in memory), `==` checks **equality** (same value). NEVER use `is` for value comparison except with `None`, `True`, `False` (which are singletons). This is Python interview question #1.
</details>


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


🔬 **Section Challenge — 2.2 Generators — Lazy Evaluation**

**Challenge 1 (Reasoning):** A generator that yields 1,000,000 numbers — what's its memory footprint vs a list?
<details><summary>Answer</summary>

Generator: O(1) — stores only the current execution state (stack frame: local variables, instruction pointer). ~200-300 bytes total, regardless of N. List: O(N) — stores all 1M integer objects. 1M Python ints ≈ 28MB (small ints cached, but larger ints ~28 bytes each). Generators are essential for: large file processing (yield one line at a time), infinite sequences, streaming pipelines where you process and discard data.
</details>


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


🔬 **Section Challenge — 3.1 Functions are Objects**

**Challenge 1 (Reasoning):** In Python, `def greet(): ...` creates a function OBJECT. What is the type of `greet`? Can you add attributes to it like `greet.call_count = 0`? If so, where are these stored, and why can't you do this in Java?
<details><summary>Answer</summary>

`type(greet)` is `<class 'function'>`. Yes, you can add arbitrary attributes: `greet.call_count = 0` works because Python functions are objects with a `__dict__` attribute (just like any other object). These attributes are stored in the function's `__dict__`. Java methods are NOT objects — they're entries in the class's method table. You can't add attributes to a method at runtime because Java's type system is static and closed. Python's "everything is an object" philosophy means functions have: `__name__`, `__doc__`, `__defaults__`, `__code__`, `__closure__`, `__annotations__`, AND `__dict__` for custom attributes. This is what makes decorators, Flask's route registration, and pytest's marker system possible — they all attach metadata to function objects.
</details>


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


🔬 **Section Challenge — 3.2 Decorators — Functions that Modify Functions**

**Challenge 1 (Reasoning):** Why does a decorator without `@functools.wraps` break Flask/FastAPI route registration?
<details><summary>Answer</summary>

Flask uses function name (`func.__name__`) to register routes. Without `@functools.wraps`, the decorator replaces the original function with a `wrapper` function. All decorated routes have `__name__ = 'wrapper'` → duplicate view function name error. `@functools.wraps(fn)` copies `__name__`, `__doc__`, `__annotations__`  from the wrapped function. Same issue with pytest markers, Celery tasks, and any framework that inspects function attributes.
</details>


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


🔬 **Section Challenge — 3.3 Closures & Lambda**

**Challenge 1 (Reasoning):** `funcs = [lambda: i for i in range(5)]` — calling `funcs[0]()`, `funcs[1]()`, `funcs[2]()` all return `4`. Why? How do you fix it?
<details><summary>Answer</summary>

Python closures capture **variables by reference, not by value**. All 5 lambdas share the SAME variable `i`. By the time you call any of them, the loop has finished and `i = 4`. This is Python's **late-binding closure** behavior — the value of `i` is looked up at CALL time, not at DEFINITION time. **Fix 1 (default argument trick):** `funcs = [lambda i=i: i for i in range(5)]` — default arguments are evaluated at function DEFINITION time, so each lambda captures the current value. **Fix 2 (functools.partial):** `funcs = [functools.partial(lambda x: x, i) for i in range(5)]`. This is fundamentally different from Java, where lambdas DO capture values (effectively final). Python's late-binding is a design choice that enables more dynamic patterns but creates this specific gotcha. This is the #1 Python closure interview trap.
</details>


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

| Topic                               | Related Content                                                       |
| ----------------------------------- | --------------------------------------------------------------------- |
| Python Lists (dynamic arrays)       | [Arrays](../02_Data_Structures/01b_Arrays.md)                         |
| Python Dicts (hash maps)            | [HashTable](../02_Data_Structures/01e_HashTable.md)                   |
| Generators / Iterators              | [Stack & Queue](../02_Data_Structures/01d_Stack_Queue.md)             |
| Sorting (`sorted()`, `list.sort()`) | [Sorting Fundamentals](../03_Algorithms/02a_Sorting_Fundamentals.md)  |
| Decorators (design pattern)         | [Design Patterns — Decorator](../06_OOP_Design/02_Design_Patterns.md) |


---

## Reality Check

**"Python variables hold values"** — Python variables are NAMES BOUND to objects, and everything follows from that: assignment binds a name (never copies), so two names can reference one list (the mutate-through-one-see-it-in-the-other surprise), function arguments are name bindings (the "is Python pass-by-value or reference" confusion dissolves — it passes the reference by value: you can mutate the object but reassigning the parameter rebinds only the local name), and the is-versus-== distinction (identity versus equality — the small-int and string interning that makes `is` accidentally work then fail, [16_JS]'s boxed-equality cousin). The name-binding model, not the value model, predicts every aliasing and mutation behavior.

**"Mutable default arguments are a minor gotcha"** — The mutable default (def f(x, lst=[])) is a genuine trap with a precise cause: the default is evaluated ONCE at function-definition time and SHARED across all calls (the list that accumulates across invocations — the function that "remembers" previous calls). It follows directly from the name-binding model (the default is an object bound once), and the fix (default to None, create inside) is idiomatic. This is not minor — it produces state-leaking-across-calls bugs that are baffling until you know the cause, and it appears in real code constantly (the cache, the accumulator, the config dict that mysteriously grows).

**"Python is slow, so it's not for real work"** — CPython is slow at INTERPRETED loops and fast where it matters for its use cases: the numerical work runs in C (NumPy, the vectorized operations that are C loops under a Python interface — the reason ML/data Python is fast, [03 NumPy]), the I/O-bound work is fine (the interpreter waits on the network either way, [13_DE concurrency]'s I/O-bound-needs-concurrency-not-cores), and the productivity often outweighs the runtime for the majority of code that is not the hot path ([14_MM optimization]'s profile-first). The nuanced truth: Python is slow for CPU-bound pure-Python loops (where you drop to NumPy, Cython, or another language for the hot 3 percent) and entirely adequate for the glue, I/O, and vectorized-numerical work that is most of what it is used for. "Too slow for real work" is refuted by the entire data/ML/backend ecosystem built on it.

**"The GIL means Python can't do concurrency"** — The GIL prevents CPU-bound PARALLELISM in threads (only one thread executes Python bytecode at a time — the multi-threaded CPU-bound program that does not speed up), but it does NOT prevent concurrency ([13_DE concurrency]'s parallelism-versus-concurrency distinction): I/O-bound threads work fine (the GIL releases during I/O waits — the web scraper, the many-API-calls program parallelize well), async handles massive I/O concurrency single-threaded (asyncio), and CPU parallelism uses PROCESSES (multiprocessing — separate interpreters, separate GILs) or drops to C extensions that release the GIL (NumPy operations run in parallel). Plus the GIL is being made optional (free-threaded Python). "Can't do concurrency" conflates the specific CPU-bound-threading limit with concurrency in general — Python does I/O concurrency easily and CPU parallelism through processes and C.

**"List comprehensions are just shorter loops"** — Comprehensions are shorter, often FASTER (the optimized bytecode path versus append-in-loop), and MORE READABLE for the map/filter case they express — but the misconception cuts both ways: the comprehension abused for side effects (the list comp run for its side effects, discarding the result — use a loop), the nested comprehension that is unreadable (three-level comprehensions that should be loops or generator functions), and the memory cost (a list comp materializes the whole list — the generator expression (parens not brackets) is lazy, the difference between loading a million-item list into memory and streaming it, [16_JS iterators]' laziness lesson). The idiom is right for transformation-of-a-sequence-into-a-sequence; using it as a universal loop replacement produces either unreadable nesting or memory blowups where a generator was wanted.
