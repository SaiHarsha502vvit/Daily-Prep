> **Navigation**: [< Previous](08_NLP_Complete.md) | [Back to Index](00_INDEX.md)

# 🔧 Frameworks: PyTorch & TensorFlow — Complete Guide

> _"PyTorch for research, TensorFlow for production — but both can do everything."_

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

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| Tensor operations (matrix math) | [Math for ML](04_Math_For_ML.md) |
| Neural network architectures | [Deep Learning](07_Deep_Learning_Fundamentals.md) |
| NLP model fine-tuning | [NLP Complete](08_NLP_Complete.md) |
| Python OOP (nn.Module) | [Python Core](01_Python_Core_Fundamentals.md) |

---

> **Navigation**: [< Previous](08_NLP_Complete.md) | [Back to Index](00_INDEX.md)
