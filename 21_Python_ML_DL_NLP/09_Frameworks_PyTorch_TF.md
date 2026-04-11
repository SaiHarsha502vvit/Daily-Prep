**Navigation**: [< Previous](08_NLP_Complete.md) | [Back to Index](00_INDEX.md)

# 🔧 Frameworks: PyTorch & TensorFlow — Complete Guide

_"PyTorch for research, TensorFlow for production — but both can do everything."_

---

# PART 0: The 5W+H Framework

| Question | DL Frameworks Context |
| :--- | :--- |
| **WHAT** | Software libraries that provide: GPU-accelerated tensor operations, automatic differentiation (autograd), pre-built neural network layers, optimizers, and data loading utilities. |
| **WHY** | Writing neural networks from scratch (raw NumPy) is impractical for production models. Frameworks handle GPU parallelism, gradient computation, and model serialization automatically. |
| **WHEN** | Whenever you build, train, or deploy neural networks — from simple classifiers to billion-parameter language models. |
| **WHERE** | PyTorch: Meta AI, academia, research papers. TensorFlow: Google, production ML systems, mobile (TFLite). |
| **HOW** | Both follow the same pattern: define model → feed data → compute loss → backpropagate → update weights. The API differs but the math is identical. |

### PyTorch vs TensorFlow at a Glance

| Feature | PyTorch | TensorFlow/Keras |
|---|---|---|
| **Created by** | Meta AI (FAIR) | Google Brain |
| **Execution** | Eager (dynamic graph) | Eager (TF2) or Graph (TF1) |
| **API Style** | Pythonic, OOP-heavy | Keras = simple, TF = verbose |
| **Research** | ⭐ Dominant (80%+ papers) | Less common in new research |
| **Production** | TorchServe, ONNX | TF Serving, TFLite, TF.js |
| **Debugging** | Easy (standard Python) | Harder with graph mode |
| **Community** | Fastest growing | Larger existing ecosystem |

---

# PART 1: PyTorch — The Researcher's Choice

---

## 1.1 Tensors — GPU-Accelerated Arrays

```python
import torch

# ─── Creation ───
a = torch.tensor([1, 2, 3])                   # from list
b = torch.zeros(3, 4)                          # 3×4 zeros
c = torch.randn(2, 3)                          # random normal
d = torch.arange(0, 10, 2)                     # [0, 2, 4, 6, 8]
e = torch.eye(3)                               # identity matrix

# ─── GPU Support ───
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
x = torch.randn(1000, 1000, device=device)     # directly on GPU
y = x.cpu()                                     # move to CPU
z = y.to(device)                                # move to GPU

# ─── NumPy Interop ───
import numpy as np
np_array = np.array([1, 2, 3])
tensor = torch.from_numpy(np_array)             # shared memory!
back_to_np = tensor.numpy()                     # shared memory!

# ─── Key Operations ───
x = torch.randn(3, 4)
print(x.shape)      # torch.Size([3, 4])
print(x.dtype)      # torch.float32
print(x.device)     # cpu or cuda:0

# Matrix multiply (forward pass in neural networks)
W = torch.randn(4, 2)
out = x @ W                     # (3,4) @ (4,2) = (3,2)
```

## 1.2 Autograd — Automatic Differentiation

```python
# THE MAGIC: PyTorch tracks all operations on tensors and
# automatically computes gradients via backpropagation.

x = torch.tensor(3.0, requires_grad=True)   # "track gradients for this"
y = x**2 + 2*x + 1                           # y = x² + 2x + 1

y.backward()                                  # compute dy/dx
print(x.grad)                                 # 8.0 (dy/dx = 2x + 2 = 8)

# Multi-variable
w = torch.randn(3, requires_grad=True)
x = torch.randn(3)
y = torch.dot(w, x)                           # y = w·x
loss = (y - 1.0)**2                            # loss = (y-1)²
loss.backward()                                # compute ∂loss/∂w
print(w.grad)                                  # gradient vector

# torch.no_grad() — disable gradient tracking (for inference)
with torch.no_grad():
    predictions = model(test_data)             # no gradient computation → faster
```

## 1.3 Building a Neural Network

```python
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset




# ─── Define Model ───
class MNISTClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.layers = nn.Sequential(
            nn.Linear(784, 256),       # 28×28 → 256
            nn.ReLU(),
            nn.Dropout(0.2),           # regularization
            nn.Linear(256, 128),       # 256 → 128
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 10),        # 128 → 10 classes
        )
    
    def forward(self, x):
        x = self.flatten(x)           # (batch, 28, 28) → (batch, 784)
        return self.layers(x)         # (batch, 784) → (batch, 10)

# ─── Setup ───
model = MNISTClassifier().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# ─── Training Loop (THE key pattern) ───
def train(model, loader, criterion, optimizer, epochs=5):
    model.train()                              # set training mode (enables dropout)
    for epoch in range(epochs):
        total_loss = 0
        for batch_X, batch_y in loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            
            # 1. Forward pass
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            
            # 2. Backward pass
            optimizer.zero_grad()              # clear previous gradients
            loss.backward()                    # compute gradients
            
            # 3. Update weights
            optimizer.step()                   # w = w - lr * grad
            
            total_loss += loss.item()
        
        print(f"Epoch {epoch+1}: Loss = {total_loss/len(loader):.4f}")

# ─── Evaluation ───
def evaluate(model, loader):
    model.eval()                               # set eval mode (disables dropout)
    correct, total = 0, 0
    with torch.no_grad():                      # no gradient computation
        for X, y in loader:
            X, y = X.to(device), y.to(device)
            outputs = model(X)
            _, predicted = torch.max(outputs, 1)
            total += y.size(0)
            correct += (predicted == y).sum().item()
    return correct / total

# ─── Save / Load ───
torch.save(model.state_dict(), 'model.pth')
model.load_state_dict(torch.load('model.pth'))
```

---

# PART 2: TensorFlow / Keras — The Production Standard

---

## 2.1 The Same Model in Keras

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers




# ─── Sequential API (simple) ───
model = keras.Sequential([
    layers.Flatten(input_shape=(28, 28)),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.2),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.2),
    layers.Dense(10, activation='softmax'),
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()    # prints parameter counts per layer

# ─── Training (one line!) ───
history = model.fit(
    X_train, y_train,
    epochs=5,
    batch_size=32,
    validation_split=0.2,
    callbacks=[
        keras.callbacks.EarlyStopping(patience=3),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2),
    ]
)

# ─── Evaluation ───
loss, accuracy = model.evaluate(X_test, y_test)
print(f"Test accuracy: {accuracy:.4f}")

# ─── Save / Load ───
model.save('model.keras')
loaded = keras.models.load_model('model.keras')
```

## 2.2 Functional API (complex architectures)

```python


🔬 **Section Challenge — 2.2 Functional API (complex architectures)**
>
**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.
<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.
</details>


# For models with multiple inputs/outputs, skip connections, etc.

inputs = keras.Input(shape=(784,))
x = layers.Dense(256, activation='relu')(inputs)
x = layers.Dropout(0.3)(x)
x = layers.Dense(128, activation='relu')(x)

# Skip connection (like ResNet)
skip = layers.Dense(128)(inputs)  # project input to match dimensions
x = layers.Add()([x, skip])       # residual connection
x = layers.ReLU()(x)

outputs = layers.Dense(10, activation='softmax')(x)

model = keras.Model(inputs=inputs, outputs=outputs)
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')
```

---

# PART 3: Common Patterns Comparison

| Task | PyTorch | TensorFlow/Keras |
|---|---|---|
| **Define model** | `class Model(nn.Module)` | `keras.Sequential()` or Functional API |
| **Forward pass** | `output = model(x)` | `output = model(x)` |
| **Loss** | `loss = criterion(output, y)` | Built into `model.compile(loss=...)` |
| **Backprop** | `loss.backward()` | Handled by `model.fit()` |
| **Update** | `optimizer.step()` | Handled by `model.fit()` |
| **Gradient** | Manual loop | `model.fit()` does everything |
| **GPU** | `model.to('cuda')` | Auto-detects GPU |
| **Save** | `torch.save(state_dict)` | `model.save('file.keras')` |
| **Deploy** | TorchServe, ONNX | TF Serving, TFLite, TF.js |

```
WHEN TO USE WHICH:

PyTorch:
  ✅ Research / experimentation (custom training loops, novel architectures)
  ✅ Reading/reproducing papers (80%+ papers use PyTorch)
  ✅ When you want full control over every step
  ✅ Debugging (standard Python, breakpoints work)

TensorFlow/Keras:
  ✅ Production deployment (TF Serving, TFLite for mobile)
  ✅ Rapid prototyping with Keras (fewer lines of code)
  ✅ Google Cloud ecosystem (TPU support)
  ✅ When team already uses TF infrastructure
```

---

# PART 4: Advanced PyTorch

---

## 4.1 Custom Autograd Functions

```python


🔬 **Section Challenge — 4.1 Custom Autograd Functions**

**Challenge 1 (Design):** Design a custom exception hierarchy for a payment system. What should the base class extend and what fields must it have?
<details><summary>Answer</summary>

```java
public class PaymentException extends RuntimeException { // unchecked!
    private final String errorCode;
    private final String transactionId;
    public PaymentException(String code, String txId, String msg, Throwable cause) {
        super(msg, cause); this.errorCode=code; this.transactionId=txId;
    }
}
public class InsufficientFundsException extends PaymentException { ... }
public class PaymentGatewayException extends PaymentException { ... }
```
Always chain the original cause. Include domain-relevant context (errorCode, transactionId) for logging/debugging.
</details>


# Sometimes standard automatic differentiation isn't enough.
# You can define custom forward/backward passes.

import torch

class ClippedReLU(torch.autograd.Function):
    @staticmethod
    def forward(ctx, i):
        # Save context for backward pass
        ctx.save_for_backward(i)
        return i.clamp(min=0, max=10)  # ReLU bounded at 10

    @staticmethod
    def backward(ctx, grad_output):
        i, = ctx.saved_tensors
        # Gradient is 1 where 0 < input < 10, else 0
        grad_input = grad_output.clone()
        grad_input[i <= 0] = 0
        grad_input[i >= 10] = 0
        return grad_input

# Use it by calling .apply
clipped_relu = ClippedReLU.apply
x = torch.tensor([-5.0, 5.0, 15.0], requires_grad=True)
y = clipped_relu(x)
y.sum().backward()
print(x.grad)  # tensor([0., 1., 0.])
```

## 4.2 DataLoaders & Datasets Deep Dive

```python


🔬 **Section Challenge — 4.2 DataLoaders & Datasets Deep Dive**

**Challenge 1 (Reasoning):** Round-robin load balancing sends requests to servers 1,2,3,1,2,3. Why does this fail for stateful sessions?
<details><summary>Answer</summary>

Session data (shopping cart, auth state) is stored on ONE server. Round-robin sends the NEXT request to a different server which has NO session data → user is logged out, cart is empty. Solutions: (1) Sticky sessions (session affinity) — LB routes user to the same server based on cookie. Single point of failure risk. (2) Externalize session to Redis — all servers share one session store. (3) Stateless auth (JWT) — no server-side session needed. Modern preference: stateless design + JWT.
</details>


# Handling massive datasets (images, text) that don't fit in RAM
from torch.utils.data import Dataset, DataLoader
import os
from PIL import Image

class ImageDataset(Dataset):
    def __init__(self, img_dir, transform=None):
        self.img_dir = img_dir
        self.img_names = os.listdir(img_dir)
        self.transform = transform
        
    def __len__(self):
        return len(self.img_names)
        
    def __getitem__(self, idx):
        # LAZY LOADING: Read from disk only when requested
        img_path = os.path.join(self.img_dir, self.img_names[idx])
        image = Image.open(img_path).convert("RGB")
        label = 1 if "cat" in self.img_names[idx] else 0
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

# DataLoader handles batching, shuffling, and MULTIPROCESSING
dataset = ImageDataset("data/train")
loader = DataLoader(
    dataset, 
    batch_size=32, 
    shuffle=True, 
    num_workers=4,    # Uses 4 CPU cores to load data in background!
    pin_memory=True   # Speeds up CPU → GPU transfer
)
```

## 4.3 Distributed Data Parallel (DDP)

```python
# Training on multiple GPUs (Data Parallelism)
# DDP is the standard, replicating the model on N GPUs and splitting the batch.

import torch.distributed as dist
import torch.multiprocessing as mp
from torch.nn.parallel import DistributedDataParallel as DDP

def setup(rank, world_size):
    dist.init_process_group("nccl", rank=rank, world_size=world_size)

def train_ddp(rank, world_size):
    setup(rank, world_size)
    
    # 1. Move model to specific GPU
    model = MyModel().to(rank)
    
    # 2. Wrap model in DDP
    ddp_model = DDP(model, device_ids=[rank])
    
    # 3. Use DistributedSampler to ensure GPUs don't process the same data
    sampler = torch.utils.data.distributed.DistributedSampler(dataset)
    loader = DataLoader(dataset, sampler=sampler, batch_size=32)
    
    # ... standard training loop ...
    
    dist.destroy_process_group()

# Launch with: torchrun --nproc_per_node=4 train_script.py
```

---

# PART 5: Advanced TensorFlow / Keras

---

## 5.1 tf.data.Dataset Pipeline

```python



# TensorFlow's standard for highly optimized data loading pipelines
import tensorflow as tf

def parse_image(filename, label):
    image = tf.io.read_file(filename)
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.resize(image, [224, 224])
    image = image / 255.0  # Normalize
    return image, label

# Create pipeline
filenames = ["cat.jpg", "dog.jpg"]
labels = [0, 1]

dataset = tf.data.Dataset.from_tensor_slices((filenames, labels))

dataset = (dataset
    .shuffle(buffer_size=1000)
    .map(parse_image, num_parallel_calls=tf.data.AUTOTUNE) # Multi-threading!
    .batch(32)
    .prefetch(tf.data.AUTOTUNE)  # Fetch next batch while GPU processes current
)

# Pass directly to model.fit
# model.fit(dataset, epochs=10)
```

## 5.2 tf.function (Graph Execution)

```python


🔬 **Section Challenge — 5.2 tf.function (Graph Execution)**
>>

# TF2 executes eagerly (like PyTorch) by default for debugging.
# But for production speed, you compile Python to a static C++ Graph.

@tf.function
def compute_step(x, y):
    # This entire function is traced and compiled into a static graph!
    # No Python interpreter overhead during execution.
    prediction = model(x)
    loss = loss_fn(y, prediction)
    return loss

# When should you use @tf.function?
# 1. Custom training loops (wrapping the training step)
# 2. Complex mathematical computations
# 3. Code you intend to export via SavedModel for TF Serving
```

---

# PART 6: The Modern ML Ecosystem

---

## 6.1 HuggingFace Transformers (The NLP Standard)

```python



# Neither PyTorch nor TF are used "raw" for modern NLP.
# You use HuggingFace, which wraps PyTorch/TF.

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# 1. Load pre-trained model and tokenizer (Downloads automatically!)
model_name = "distilbert-base-uncased-finetuned-sst-2-english"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

# 2. Prepare text
text = "This framework guide is incredibly helpful!"
inputs = tokenizer(text, return_tensors="pt")  # "pt" = return PyTorch tensors

# 3. Inference
with torch.no_grad():
    logits = model(**inputs).logits
    predicted_class = logits.argmax().item()
    
print("Positive" if predicted_class == 1 else "Negative")
```

## 6.2 ONNX (Open Neural Network Exchange)

```python


🔬 **Section Challenge — 6.2 ONNX (Open Neural Network Exchange)**
>

# How do you train in PyTorch but deploy without a heavy Python runtime? ONNX.
# ONNX is a universal format for ML models (supported by MS, Meta, AWS, etc.)

import torch
import torchvision.models as models

# 1. Load a PyTorch model
model = models.resnet18(pretrained=True)
model.eval()

# 2. Create dummy input (matching input dimensions)
dummy_input = torch.randn(1, 3, 224, 224)

# 3. Export to ONNX
torch.onnx.export(
    model, 
    dummy_input, 
    "resnet18.onnx",
    export_params=True,
    input_names=['input_image'],
    output_names=['classification']
)

# The resulting .onnx file can be run in C++, Rust, Node.js, C#, or Java
# at bare-metal speeds using ONNX Runtime.
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| Tensor operations (matrix math) | [Math for ML](04_Math_For_ML.md) |
| Neural network architectures | [Deep Learning](07_Deep_Learning_Fundamentals.md) |
| NLP model fine-tuning | [NLP Complete](08_NLP_Complete.md) |
| Python OOP (nn.Module) | [Python Core](01_Python_Core_Fundamentals.md) |

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


**Navigation**: [< Previous](08_NLP_Complete.md) | [Back to Index](00_INDEX.md)
