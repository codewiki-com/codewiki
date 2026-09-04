---
title: "ML Tools Ecosystem: Deep Learning Frameworks"
description: "Master deep learning frameworks: PyTorch, TensorFlow, and JAX comparison"
track: datascience
section: deployment
difficulty: intermediate
tags:
  - PyTorch
  - TensorFlow
  - JAX
  - deep learning
status: imported
origin: old/src/content/docs/datascience/ml-frameworks.en.md
divergence: 0.209
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DataScience
  subcategory: Tools
  order: 45
  lastUpdated: 2026-01-07
---

Deep learning frameworks are the foundational tools that enable researchers and engineers to build, train, and deploy neural networks. Choosing the right framework can significantly impact development speed, model performance, and deployment flexibility. This comprehensive guide explores the major deep learning frameworks, their strengths, and how to choose the right one for your projects.

---

## Framework Evolution History

### The Early Days (2010-2015)

The modern deep learning era began with frameworks that laid the groundwork for today's tools:

**Theano (2010-2017)**
- Developed by the Montreal Institute for Learning Algorithms (MILA)
- First framework to use symbolic computation graphs
- Pioneered automatic differentiation in deep learning
- Discontinued in 2017 but influenced all subsequent frameworks

**Caffe (2013)**
- Developed by Berkeley AI Research (BAIR)
- Focused on computer vision and convolutional neural networks
- Introduced the concept of layer-based architecture
- Still used in some production environments

### The Framework Wars (2015-2019)

**TensorFlow 1.x (2015)**
- Released by Google Brain
- Static computation graphs with `tf.Session`
- Powerful but verbose and difficult to debug
- Dominated industry adoption initially

**PyTorch (2016)**
- Released by Facebook AI Research (FAIR)
- Dynamic computation graphs (define-by-run)
- Pythonic and intuitive interface
- Rapidly gained popularity in research

### Modern Era (2019-Present)

**TensorFlow 2.x (2019)**
- Major redesign embracing eager execution
- Keras as the official high-level API
- Improved developer experience

**JAX (2018-2020)**
- Google's functional approach to deep learning
- XLA compilation for performance
- Growing adoption in cutting-edge research

```python
# Timeline visualization of framework releases
frameworks_timeline = {
    2010: "Theano",
    2013: "Caffe",
    2015: "TensorFlow 1.x",
    2016: "PyTorch",
    2017: "MXNet",
    2018: "JAX (research)",
    2019: "TensorFlow 2.x",
    2020: "JAX (public release)",
    2022: "PyTorch 2.0",
    2023: "TensorFlow/Keras 3.0"
}
```

### Current Market Share and Adoption

| Framework | Research Papers | Industry Jobs | GitHub Stars |
|-----------|----------------|---------------|--------------|
| PyTorch | ~70% | ~45% | 80k+ |
| TensorFlow | ~25% | ~50% | 180k+ |
| JAX | ~5% | ~5% | 30k+ |

---

## PyTorch Core Concepts

PyTorch has become the dominant framework in research due to its intuitive design and Pythonic nature. Understanding its core concepts is essential for modern deep learning.

### Tensors: The Foundation

Tensors are multi-dimensional arrays that form the backbone of all computations in PyTorch.

```python
import torch
import numpy as np

# Creating tensors
# From Python lists
tensor_from_list = torch.tensor([1, 2, 3, 4, 5])

# From NumPy arrays
np_array = np.array([1.0, 2.0, 3.0])
tensor_from_numpy = torch.from_numpy(np_array)

# Special tensors
zeros = torch.zeros(3, 4)           # 3x4 matrix of zeros
ones = torch.ones(2, 3, 4)          # 2x3x4 tensor of ones
random = torch.randn(3, 3)          # Random normal distribution
identity = torch.eye(4)             # 4x4 identity matrix
range_tensor = torch.arange(0, 10, 2)  # [0, 2, 4, 6, 8]

# Tensor attributes
print(f"Shape: {random.shape}")
print(f"Data type: {random.dtype}")
print(f"Device: {random.device}")

# Device management
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
tensor_gpu = torch.randn(3, 3, device=device)
tensor_moved = tensor_from_list.to(device)

# Tensor operations
a = torch.randn(3, 4)
b = torch.randn(3, 4)

# Element-wise operations
c = a + b                    # Addition
c = a * b                    # Element-wise multiplication
c = torch.exp(a)             # Exponential
c = torch.log(a.abs() + 1e-8)  # Logarithm (with numerical stability)

# Matrix operations
d = torch.randn(4, 5)
matmul_result = torch.matmul(a, d)  # Matrix multiplication
matmul_result = a @ d               # Equivalent shorthand

# Broadcasting
e = torch.randn(3, 1)
broadcast_result = a + e    # e is broadcast to (3, 4)

# Reshaping
reshaped = a.view(2, 6)     # Reshape to 2x6
reshaped = a.reshape(2, 6)  # More flexible reshape
flattened = a.flatten()     # Flatten to 1D
squeezed = torch.randn(1, 3, 1, 4).squeeze()  # Remove dimensions of size 1
unsqueezed = a.unsqueeze(0)  # Add dimension at position 0
```

### Autograd: Automatic Differentiation

PyTorch's autograd system automatically computes gradients, enabling backpropagation.

```python
import torch

# Basic gradient computation
x = torch.tensor([2.0, 3.0], requires_grad=True)
y = x ** 2 + 3 * x + 1
z = y.sum()

# Compute gradients
z.backward()
print(f"Gradients: {x.grad}")  # dy/dx = 2x + 3 -> [7.0, 9.0]

# Gradient accumulation (important!)
x = torch.tensor([1.0], requires_grad=True)
for i in range(3):
    y = x ** 2
    y.backward()
    print(f"Iteration {i}: grad = {x.grad}")
    x.grad.zero_()  # Clear gradients to prevent accumulation

# Disabling gradient computation
with torch.no_grad():
    # Operations here won't track gradients
    y = x ** 2

# Detaching tensors
detached = x.detach()  # Creates a new tensor without gradient tracking

# Custom gradient function
class MyReLU(torch.autograd.Function):
    @staticmethod
    def forward(ctx, input):
        ctx.save_for_backward(input)
        return input.clamp(min=0)

    @staticmethod
    def backward(ctx, grad_output):
        input, = ctx.saved_tensors
        grad_input = grad_output.clone()
        grad_input[input < 0] = 0
        return grad_input

# Using custom function
my_relu = MyReLU.apply
x = torch.randn(5, requires_grad=True)
y = my_relu(x)
y.sum().backward()
```

### Building Neural Networks with nn.Module

The `nn.Module` class is the base for all neural network components.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ConvBlock(nn.Module):
    """A convolutional block with batch normalization and activation."""

    def __init__(self, in_channels, out_channels, kernel_size=3, stride=1, padding=1):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding, bias=False)
        self.bn = nn.BatchNorm2d(out_channels)
        self.activation = nn.ReLU(inplace=True)

    def forward(self, x):
        return self.activation(self.bn(self.conv(x)))

class ResidualBlock(nn.Module):
    """A residual block with skip connection."""

    def __init__(self, channels):
        super().__init__()
        self.conv1 = ConvBlock(channels, channels)
        self.conv2 = nn.Conv2d(channels, channels, 3, 1, 1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x):
        identity = x
        out = self.conv1(x)
        out = self.bn2(self.conv2(out))
        out += identity  # Skip connection
        return F.relu(out)

class ImageClassifier(nn.Module):
    """A simple image classification network."""

    def __init__(self, num_classes=10):
        super().__init__()

        # Feature extraction
        self.features = nn.Sequential(
            ConvBlock(3, 64),
            ConvBlock(64, 64),
            nn.MaxPool2d(2, 2),

            ResidualBlock(64),
            ConvBlock(64, 128),
            nn.MaxPool2d(2, 2),

            ResidualBlock(128),
            ConvBlock(128, 256),
            nn.AdaptiveAvgPool2d((1, 1))
        )

        # Classification head
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

# Model instantiation and inspection
model = ImageClassifier(num_classes=10)
print(model)

# Count parameters
total_params = sum(p.numel() for p in model.parameters())
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Total parameters: {total_params:,}")
print(f"Trainable parameters: {trainable_params:,}")

# Forward pass
x = torch.randn(8, 3, 32, 32)
output = model(x)
print(f"Output shape: {output.shape}")  # torch.Size([8, 10])
```

### Training Loop Best Practices

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm

class Trainer:
    """A comprehensive trainer class for PyTorch models."""

    def __init__(
        self,
        model,
        train_loader,
        val_loader,
        criterion,
        optimizer,
        scheduler=None,
        device='cuda',
        mixed_precision=True
    ):
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device
        self.mixed_precision = mixed_precision

        # Mixed precision training setup
        self.scaler = torch.cuda.amp.GradScaler() if mixed_precision else None

        # Metrics tracking
        self.train_losses = []
        self.val_losses = []
        self.best_val_loss = float('inf')

    def train_epoch(self):
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0

        pbar = tqdm(self.train_loader, desc='Training')
        for batch_idx, (data, target) in enumerate(pbar):
            data, target = data.to(self.device), target.to(self.device)

            self.optimizer.zero_grad()

            # Mixed precision forward pass
            if self.mixed_precision:
                with torch.cuda.amp.autocast():
                    output = self.model(data)
                    loss = self.criterion(output, target)

                self.scaler.scale(loss).backward()
                self.scaler.unscale_(self.optimizer)
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                output = self.model(data)
                loss = self.criterion(output, target)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                self.optimizer.step()

            # Metrics
            total_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

            pbar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'acc': f'{100. * correct / total:.2f}%'
            })

        return total_loss / len(self.train_loader), correct / total

    @torch.no_grad()
    def validate(self):
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0

        for data, target in self.val_loader:
            data, target = data.to(self.device), target.to(self.device)

            if self.mixed_precision:
                with torch.cuda.amp.autocast():
                    output = self.model(data)
                    loss = self.criterion(output, target)
            else:
                output = self.model(data)
                loss = self.criterion(output, target)

            total_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

        return total_loss / len(self.val_loader), correct / total

    def train(self, epochs, save_path='best_model.pt', early_stopping_patience=10):
        patience_counter = 0

        for epoch in range(epochs):
            print(f'\nEpoch {epoch + 1}/{epochs}')

            train_loss, train_acc = self.train_epoch()
            val_loss, val_acc = self.validate()

            self.train_losses.append(train_loss)
            self.val_losses.append(val_loss)

            print(f'Train Loss: {train_loss:.4f}, Train Acc: {train_acc*100:.2f}%')
            print(f'Val Loss: {val_loss:.4f}, Val Acc: {val_acc*100:.2f}%')

            # Learning rate scheduling
            if self.scheduler:
                if isinstance(self.scheduler, optim.lr_scheduler.ReduceLROnPlateau):
                    self.scheduler.step(val_loss)
                else:
                    self.scheduler.step()

            # Save best model
            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': self.model.state_dict(),
                    'optimizer_state_dict': self.optimizer.state_dict(),
                    'val_loss': val_loss,
                }, save_path)
                patience_counter = 0
            else:
                patience_counter += 1

            if patience_counter >= early_stopping_patience:
                print(f'Early stopping at epoch {epoch + 1}')
                break

        return self.train_losses, self.val_losses
```

### PyTorch 2.0 Features

PyTorch 2.0 introduced significant improvements:

```python
import torch

# torch.compile - JIT compilation for faster execution
model = ImageClassifier(num_classes=10)
compiled_model = torch.compile(model)

# Different compilation modes
# 'default' - Good balance of performance and compile time
# 'reduce-overhead' - Best for small models with high overhead
# 'max-autotune' - Best performance but longer compile time
compiled_model = torch.compile(model, mode='max-autotune')

# Using compiled model (same as regular model)
x = torch.randn(32, 3, 32, 32)
output = compiled_model(x)

# Checking if model was compiled
print(f"Is compiled: {hasattr(compiled_model, '_orig_mod')}")

# Dynamic shapes support
@torch.compile(dynamic=True)
def dynamic_forward(x):
    return x.sum(dim=-1)

# Works with different input sizes
result1 = dynamic_forward(torch.randn(10, 20))
result2 = dynamic_forward(torch.randn(5, 30))
```

---

## TensorFlow 2.x

TensorFlow 2.x represents a major shift from the original TensorFlow, embracing eager execution and Keras as its primary API.

### Core Concepts

```python
import tensorflow as tf
import numpy as np

# Tensors in TensorFlow
# Creating tensors
tensor = tf.constant([1, 2, 3, 4, 5])
zeros = tf.zeros([3, 4])
ones = tf.ones([2, 3, 4])
random = tf.random.normal([3, 3])

# Tensor properties
print(f"Shape: {random.shape}")
print(f"Data type: {random.dtype}")
print(f"Device: {random.device}")

# Variables (mutable tensors)
var = tf.Variable([1.0, 2.0, 3.0])
var.assign([4.0, 5.0, 6.0])
var.assign_add([1.0, 1.0, 1.0])

# Eager execution (default in TF 2.x)
a = tf.constant([[1, 2], [3, 4]])
b = tf.constant([[5, 6], [7, 8]])
c = tf.matmul(a, b)  # Executed immediately
print(c.numpy())  # Easy conversion to NumPy

# GPU management
print(f"GPUs available: {len(tf.config.list_physical_devices('GPU'))}")

# Memory growth (prevent TF from allocating all GPU memory)
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)
```

### Building Models with tf.keras

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# Sequential API (simplest approach)
sequential_model = keras.Sequential([
    layers.Conv2D(32, 3, activation='relu', input_shape=(32, 32, 3)),
    layers.MaxPooling2D(),
    layers.Conv2D(64, 3, activation='relu'),
    layers.MaxPooling2D(),
    layers.Flatten(),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(10)
])

# Functional API (more flexible)
inputs = keras.Input(shape=(32, 32, 3))
x = layers.Conv2D(32, 3, activation='relu')(inputs)
x = layers.MaxPooling2D()(x)
x = layers.Conv2D(64, 3, activation='relu')(x)
x = layers.MaxPooling2D()(x)
x = layers.Flatten()(x)
x = layers.Dense(128, activation='relu')(x)
x = layers.Dropout(0.5)(x)
outputs = layers.Dense(10)(x)
functional_model = keras.Model(inputs, outputs)

# Subclassing API (most flexible)
class CustomModel(keras.Model):
    def __init__(self, num_classes=10):
        super().__init__()
        self.conv1 = layers.Conv2D(32, 3, activation='relu')
        self.pool1 = layers.MaxPooling2D()
        self.conv2 = layers.Conv2D(64, 3, activation='relu')
        self.pool2 = layers.MaxPooling2D()
        self.flatten = layers.Flatten()
        self.dense1 = layers.Dense(128, activation='relu')
        self.dropout = layers.Dropout(0.5)
        self.dense2 = layers.Dense(num_classes)

    def call(self, inputs, training=False):
        x = self.conv1(inputs)
        x = self.pool1(x)
        x = self.conv2(x)
        x = self.pool2(x)
        x = self.flatten(x)
        x = self.dense1(x)
        x = self.dropout(x, training=training)
        return self.dense2(x)

model = CustomModel(num_classes=10)
```

### Training with TensorFlow

```python
import tensorflow as tf
from tensorflow import keras

# Standard Keras training
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=['accuracy']
)

# Callbacks for training
callbacks = [
    keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    ),
    keras.callbacks.ModelCheckpoint(
        'best_model.keras',
        monitor='val_loss',
        save_best_only=True
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=5
    ),
    keras.callbacks.TensorBoard(
        log_dir='./logs',
        histogram_freq=1
    )
]

# Training with fit()
history = model.fit(
    train_dataset,
    epochs=100,
    validation_data=val_dataset,
    callbacks=callbacks
)

# Custom training loop with GradientTape
@tf.function
def train_step(model, optimizer, loss_fn, x, y):
    with tf.GradientTape() as tape:
        predictions = model(x, training=True)
        loss = loss_fn(y, predictions)

    gradients = tape.gradient(loss, model.trainable_variables)
    optimizer.apply_gradients(zip(gradients, model.trainable_variables))
    return loss

# Manual training loop
optimizer = keras.optimizers.Adam(learning_rate=1e-3)
loss_fn = keras.losses.SparseCategoricalCrossentropy(from_logits=True)

for epoch in range(epochs):
    for step, (x_batch, y_batch) in enumerate(train_dataset):
        loss = train_step(model, optimizer, loss_fn, x_batch, y_batch)

        if step % 100 == 0:
            print(f"Epoch {epoch}, Step {step}, Loss: {loss.numpy():.4f}")
```

### TensorFlow Ecosystem

```python
# TensorFlow Data API for efficient data loading
import tensorflow as tf

def create_dataset(data, labels, batch_size=32, training=True):
    dataset = tf.data.Dataset.from_tensor_slices((data, labels))

    if training:
        dataset = dataset.shuffle(buffer_size=10000)

    dataset = (dataset
        .batch(batch_size)
        .prefetch(tf.data.AUTOTUNE)
    )

    return dataset

# Data augmentation
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1),
])

# TensorFlow Datasets library
import tensorflow_datasets as tfds

# Load pre-built datasets
dataset, info = tfds.load('cifar10', with_info=True, as_supervised=True)
train_ds, test_ds = dataset['train'], dataset['test']

# TensorFlow Hub for pre-trained models
import tensorflow_hub as hub

# Use pre-trained feature extractor
feature_extractor = hub.KerasLayer(
    "https://tfhub.dev/google/imagenet/resnet_v2_50/feature_vector/5",
    trainable=False
)

model = tf.keras.Sequential([
    feature_extractor,
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(10)
])
```

### TensorFlow Serving and Deployment

```python
# Save model for serving
model.save('saved_model/my_model')

# Convert to TensorFlow Lite
converter = tf.lite.TFLiteConverter.from_saved_model('saved_model/my_model')
tflite_model = converter.convert()

# Save TFLite model
with open('model.tflite', 'wb') as f:
    f.write(tflite_model)

# Quantization for edge deployment
converter.optimizations = [tf.lite.Optimize.DEFAULT]
quantized_model = converter.convert()

# SavedModel signature for serving
@tf.function(input_signature=[tf.TensorSpec(shape=[None, 32, 32, 3], dtype=tf.float32)])
def serve_model(x):
    return model(x)

# Export with signature
tf.saved_model.save(model, 'serving_model', signatures={'serving_default': serve_model})
```

---

## JAX Functional Programming

JAX is Google's functional approach to numerical computing, combining NumPy's interface with automatic differentiation and XLA compilation.

### Core JAX Concepts

```python
import jax
import jax.numpy as jnp
from jax import grad, jit, vmap

# JAX arrays (similar to NumPy)
x = jnp.array([1.0, 2.0, 3.0, 4.0])
y = jnp.ones((3, 4))
z = jnp.zeros((2, 3, 4))

# Key difference: JAX arrays are immutable
# This will NOT modify x in place
# x[0] = 5.0  # Error!

# Instead, use functional updates
x_updated = x.at[0].set(5.0)

# Random number generation (requires explicit keys)
key = jax.random.PRNGKey(42)
random_values = jax.random.normal(key, shape=(3, 3))

# Split keys for multiple random operations
key, subkey1, subkey2 = jax.random.split(key, 3)
random1 = jax.random.uniform(subkey1, shape=(2, 2))
random2 = jax.random.uniform(subkey2, shape=(2, 2))
```

### Automatic Differentiation with grad

```python
import jax
import jax.numpy as jnp
from jax import grad

# Simple gradient computation
def f(x):
    return x ** 2 + 3 * x + 1

df_dx = grad(f)
print(f"f(2) = {f(2.0)}")           # 11.0
print(f"f'(2) = {df_dx(2.0)}")      # 7.0 (derivative: 2x + 3)

# Gradients with multiple inputs
def loss(w, x, y):
    pred = jnp.dot(x, w)
    return jnp.mean((pred - y) ** 2)

# Gradient with respect to first argument (w)
grad_loss = grad(loss, argnums=0)

# Gradient with respect to multiple arguments
grad_loss_multi = grad(loss, argnums=(0, 1))

# Value and gradient together
from jax import value_and_grad

loss_and_grad = value_and_grad(loss)
loss_val, grad_val = loss_and_grad(w, x, y)

# Higher-order derivatives
d2f_dx2 = grad(grad(f))  # Second derivative
print(f"f''(2) = {d2f_dx2(2.0)}")   # 2.0

# Jacobian and Hessian
from jax import jacfwd, jacrev, hessian

def vector_func(x):
    return jnp.array([x[0] ** 2, x[0] * x[1], x[1] ** 2])

jacobian = jacfwd(vector_func)
hess = hessian(f)
```

### JIT Compilation

```python
import jax
import jax.numpy as jnp
from jax import jit
import time

def slow_function(x):
    for i in range(100):
        x = jnp.sin(x) + jnp.cos(x)
    return x

# Without JIT
x = jnp.ones((1000, 1000))
start = time.time()
result = slow_function(x)
print(f"Without JIT: {time.time() - start:.3f}s")

# With JIT
fast_function = jit(slow_function)

# First call includes compilation time
_ = fast_function(x).block_until_ready()

start = time.time()
result = fast_function(x).block_until_ready()
print(f"With JIT: {time.time() - start:.3f}s")

# JIT as a decorator
@jit
def optimized_function(x, y):
    return jnp.dot(x, y) + jnp.sin(x)

# Static arguments (recompiled for different values)
@jax.jit
def func_with_static(x, n):
    return x ** n

# Mark arguments that should trigger recompilation
from functools import partial

@partial(jit, static_argnums=(1,))
def func_static_arg(x, n):
    return x ** n
```

### Vectorization with vmap

```python
import jax
import jax.numpy as jnp
from jax import vmap

# Function that operates on single examples
def single_example_forward(w, x):
    return jnp.dot(w, x)

# Vectorize over batch dimension
batched_forward = vmap(single_example_forward, in_axes=(None, 0))

# w: (features,), x_batch: (batch, features)
w = jnp.ones(10)
x_batch = jnp.ones((32, 10))
result = batched_forward(w, x_batch)  # (32,)

# Multiple vectorization axes
def pairwise_distance(x, y):
    return jnp.sqrt(jnp.sum((x - y) ** 2))

# Compute distances between all pairs
all_pairs_distance = vmap(vmap(pairwise_distance, in_axes=(None, 0)), in_axes=(0, None))

points = jnp.ones((100, 3))
distances = all_pairs_distance(points, points)  # (100, 100)

# Combining vmap with grad for per-example gradients
def loss_single(params, x, y):
    pred = jnp.dot(params, x)
    return (pred - y) ** 2

per_example_grads = vmap(grad(loss_single), in_axes=(None, 0, 0))
```

### Building Neural Networks with JAX

```python
import jax
import jax.numpy as jnp
from jax import random, grad, jit, vmap

def init_mlp_params(layer_sizes, key):
    """Initialize parameters for a multi-layer perceptron."""
    params = []
    keys = random.split(key, len(layer_sizes) - 1)

    for i, (in_size, out_size) in enumerate(zip(layer_sizes[:-1], layer_sizes[1:])):
        key_w, key_b = random.split(keys[i])
        # Xavier initialization
        w = random.normal(key_w, (in_size, out_size)) * jnp.sqrt(2.0 / in_size)
        b = jnp.zeros(out_size)
        params.append((w, b))

    return params

def mlp_forward(params, x):
    """Forward pass through MLP."""
    for w, b in params[:-1]:
        x = jnp.dot(x, w) + b
        x = jax.nn.relu(x)

    # Output layer (no activation)
    w, b = params[-1]
    return jnp.dot(x, w) + b

def loss_fn(params, x_batch, y_batch):
    """Cross-entropy loss."""
    logits = vmap(mlp_forward, in_axes=(None, 0))(params, x_batch)
    return jnp.mean(jax.nn.softmax_cross_entropy_with_logits(y_batch, logits))

@jit
def update(params, x_batch, y_batch, learning_rate):
    """Single gradient descent update."""
    loss, grads = value_and_grad(loss_fn)(params, x_batch, y_batch)
    params = jax.tree_map(lambda p, g: p - learning_rate * g, params, grads)
    return params, loss

# Training loop
key = random.PRNGKey(42)
params = init_mlp_params([784, 256, 128, 10], key)

for epoch in range(10):
    for x_batch, y_batch in train_loader:
        params, loss = update(params, x_batch, y_batch, learning_rate=0.01)
```

### Flax: High-Level JAX Library

```python
import flax.linen as nn
import jax
import jax.numpy as jnp
from flax.training import train_state
import optax

class CNN(nn.Module):
    """A simple CNN using Flax."""
    num_classes: int = 10

    @nn.compact
    def __call__(self, x, training: bool = True):
        x = nn.Conv(features=32, kernel_size=(3, 3))(x)
        x = nn.relu(x)
        x = nn.max_pool(x, window_shape=(2, 2), strides=(2, 2))

        x = nn.Conv(features=64, kernel_size=(3, 3))(x)
        x = nn.relu(x)
        x = nn.max_pool(x, window_shape=(2, 2), strides=(2, 2))

        x = x.reshape((x.shape[0], -1))  # Flatten
        x = nn.Dense(features=256)(x)
        x = nn.relu(x)
        x = nn.Dropout(rate=0.5, deterministic=not training)(x)
        x = nn.Dense(features=self.num_classes)(x)

        return x

# Initialize model
model = CNN(num_classes=10)
key = jax.random.PRNGKey(0)
params = model.init(key, jnp.ones([1, 32, 32, 3]))

# Create training state with Optax optimizer
tx = optax.adam(learning_rate=1e-3)
state = train_state.TrainState.create(
    apply_fn=model.apply,
    params=params['params'],
    tx=tx
)

# Training step
@jax.jit
def train_step(state, batch):
    def loss_fn(params):
        logits = state.apply_fn({'params': params}, batch['image'], training=True)
        loss = optax.softmax_cross_entropy_with_integer_labels(
            logits, batch['label']
        ).mean()
        return loss, logits

    grad_fn = jax.value_and_grad(loss_fn, has_aux=True)
    (loss, logits), grads = grad_fn(state.params)
    state = state.apply_gradients(grads=grads)

    return state, loss

# Inference step
@jax.jit
def inference_step(state, batch):
    logits = state.apply_fn({'params': state.params}, batch['image'], training=False)
    return jnp.argmax(logits, axis=-1)
```

---

## Keras High-Level API

Keras provides a high-level, user-friendly API for building neural networks. With Keras 3.0, it became multi-backend, supporting TensorFlow, JAX, and PyTorch.

### Keras 3.0 Multi-Backend

```python
import os
# Set backend before importing Keras
os.environ["KERAS_BACKEND"] = "jax"  # or "tensorflow" or "torch"

import keras
from keras import layers, Model

# Same code works across all backends
class TransformerBlock(layers.Layer):
    def __init__(self, embed_dim, num_heads, ff_dim, rate=0.1):
        super().__init__()
        self.att = layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim)
        self.ffn = keras.Sequential([
            layers.Dense(ff_dim, activation="relu"),
            layers.Dense(embed_dim),
        ])
        self.layernorm1 = layers.LayerNormalization(epsilon=1e-6)
        self.layernorm2 = layers.LayerNormalization(epsilon=1e-6)
        self.dropout1 = layers.Dropout(rate)
        self.dropout2 = layers.Dropout(rate)

    def call(self, inputs, training=False):
        attn_output = self.att(inputs, inputs)
        attn_output = self.dropout1(attn_output, training=training)
        out1 = self.layernorm1(inputs + attn_output)
        ffn_output = self.ffn(out1)
        ffn_output = self.dropout2(ffn_output, training=training)
        return self.layernorm2(out1 + ffn_output)
```

### Common Keras Patterns

```python
import keras
from keras import layers

# Custom Layers
class ResidualBlock(layers.Layer):
    def __init__(self, filters, **kwargs):
        super().__init__(**kwargs)
        self.filters = filters

    def build(self, input_shape):
        self.conv1 = layers.Conv2D(self.filters, 3, padding='same')
        self.bn1 = layers.BatchNormalization()
        self.conv2 = layers.Conv2D(self.filters, 3, padding='same')
        self.bn2 = layers.BatchNormalization()

        if input_shape[-1] != self.filters:
            self.shortcut = layers.Conv2D(self.filters, 1)
        else:
            self.shortcut = lambda x: x

    def call(self, inputs, training=False):
        x = self.conv1(inputs)
        x = self.bn1(x, training=training)
        x = keras.activations.relu(x)
        x = self.conv2(x)
        x = self.bn2(x, training=training)
        return keras.activations.relu(x + self.shortcut(inputs))

# Custom Training Loop
class CustomModel(keras.Model):
    def train_step(self, data):
        x, y = data

        with keras.backend.GradientTape() as tape:
            y_pred = self(x, training=True)
            loss = self.compute_loss(y=y, y_pred=y_pred)

        gradients = tape.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(gradients, self.trainable_variables))

        # Update metrics
        for metric in self.metrics:
            if metric.name == "loss":
                metric.update_state(loss)
            else:
                metric.update_state(y, y_pred)

        return {m.name: m.result() for m in self.metrics}

# Callbacks
class CustomCallback(keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs=None):
        if logs.get('val_accuracy') > 0.95:
            print(f"\nReached 95% accuracy, stopping training!")
            self.model.stop_training = True

# Learning Rate Schedules
lr_schedule = keras.optimizers.schedules.CosineDecay(
    initial_learning_rate=1e-3,
    decay_steps=10000,
    alpha=0.1
)

optimizer = keras.optimizers.Adam(learning_rate=lr_schedule)
```

### Transfer Learning with Keras

```python
import keras
from keras import layers

# Load pre-trained model
base_model = keras.applications.ResNet50(
    weights='imagenet',
    include_top=False,
    input_shape=(224, 224, 3)
)

# Freeze base model
base_model.trainable = False

# Build new model
inputs = keras.Input(shape=(224, 224, 3))
x = keras.applications.resnet50.preprocess_input(inputs)
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.5)(x)
outputs = layers.Dense(num_classes)(x)

model = keras.Model(inputs, outputs)

# Compile and train
model.compile(
    optimizer=keras.optimizers.Adam(1e-3),
    loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=['accuracy']
)

model.fit(train_ds, epochs=10, validation_data=val_ds)

# Fine-tuning: unfreeze some layers
base_model.trainable = True
for layer in base_model.layers[:-20]:
    layer.trainable = False

# Recompile with lower learning rate
model.compile(
    optimizer=keras.optimizers.Adam(1e-5),
    loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=['accuracy']
)

model.fit(train_ds, epochs=10, validation_data=val_ds)
```

---

## Framework Selection Guide

### Decision Matrix

| Factor | PyTorch | TensorFlow | JAX |
|--------|---------|------------|-----|
| **Learning Curve** | Easy | Medium | Hard |
| **Research Adoption** | Highest | Medium | Growing |
| **Production Deployment** | Good | Excellent | Limited |
| **Mobile/Edge** | TorchMobile | TFLite (Best) | Limited |
| **Debugging** | Excellent | Good | Challenging |
| **Community Size** | Large | Largest | Growing |
| **Documentation** | Excellent | Excellent | Good |
| **Pre-trained Models** | Excellent (HuggingFace) | Good (TF Hub) | Limited |

### Use Case Recommendations

**Choose PyTorch if:**
- You're doing research and need rapid prototyping
- You want the largest selection of pre-trained models (via HuggingFace)
- You prefer Pythonic, intuitive code
- You need excellent debugging capabilities
- You're working with NLP or Transformers

```python
# PyTorch excels at research prototyping
import torch
import torch.nn as nn

# Quick model definition
model = nn.Sequential(
    nn.Linear(784, 256),
    nn.ReLU(),
    nn.Linear(256, 10)
)

# Easy debugging - just add print statements
def forward_debug(x):
    x = model[0](x)
    print(f"After first layer: {x.shape}, mean: {x.mean():.4f}")
    x = model[1](x)
    x = model[2](x)
    return x
```

**Choose TensorFlow if:**
- Production deployment is a priority
- You need mobile/edge deployment (TFLite)
- You want a complete ecosystem (TF Extended, TF Serving)
- You're building enterprise applications
- You need strong TPU support

```python
# TensorFlow excels at production deployment
import tensorflow as tf

# Easy model export
model.save('production_model')

# Convert for mobile
converter = tf.lite.TFLiteConverter.from_saved_model('production_model')
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

# TensorFlow Serving integration
# docker run -p 8501:8501 --mount type=bind,source=/path/to/model,target=/models/my_model -e MODEL_NAME=my_model tensorflow/serving
```

**Choose JAX if:**
- You need maximum performance
- You're doing cutting-edge research
- You want functional programming paradigm
- You're working with large-scale distributed training
- You're at Google or using TPUs extensively

```python
# JAX excels at performance-critical code
import jax
import jax.numpy as jnp
from jax import pmap

# Automatic parallelization across devices
@pmap
def parallel_step(params, batch):
    loss, grads = jax.value_and_grad(loss_fn)(params, batch)
    return loss, grads

# Efficient transformations
@jax.jit
@jax.vmap
def batched_inference(params, x):
    return model_forward(params, x)
```

### Hybrid Approaches

Modern workflows often combine frameworks:

```python
# Train in PyTorch, deploy with ONNX
import torch
import onnx
import onnxruntime

# Export PyTorch model to ONNX
dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    export_params=True,
    opset_version=14,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
)

# Load and run with ONNX Runtime
session = onnxruntime.InferenceSession("model.onnx")
result = session.run(None, {"input": input_data.numpy()})
```

---

## Performance Comparison

### Benchmark Setup

```python
import time
import torch
import tensorflow as tf
import jax
import jax.numpy as jnp

def benchmark_function(fn, *args, warmup=5, runs=100):
    """Benchmark a function with warmup runs."""
    # Warmup
    for _ in range(warmup):
        fn(*args)

    # Benchmark
    start = time.perf_counter()
    for _ in range(runs):
        fn(*args)
    end = time.perf_counter()

    return (end - start) / runs * 1000  # ms per run
```

### Matrix Multiplication Comparison

```python
import numpy as np

# Setup
size = 4096
np_a = np.random.randn(size, size).astype(np.float32)
np_b = np.random.randn(size, size).astype(np.float32)

# PyTorch
torch_a = torch.from_numpy(np_a).cuda()
torch_b = torch.from_numpy(np_b).cuda()
torch.cuda.synchronize()

def pytorch_matmul():
    result = torch.matmul(torch_a, torch_b)
    torch.cuda.synchronize()
    return result

# TensorFlow
with tf.device('/GPU:0'):
    tf_a = tf.constant(np_a)
    tf_b = tf.constant(np_b)

@tf.function
def tf_matmul():
    return tf.matmul(tf_a, tf_b)

# JAX
jax_a = jnp.array(np_a)
jax_b = jnp.array(np_b)

@jax.jit
def jax_matmul():
    return jnp.matmul(jax_a, jax_b)

# Results (example on A100 GPU)
print(f"PyTorch: {benchmark_function(pytorch_matmul):.2f} ms")
print(f"TensorFlow: {benchmark_function(tf_matmul):.2f} ms")
print(f"JAX: {benchmark_function(jax_matmul):.2f} ms")

# Typical results:
# PyTorch: ~8.5 ms
# TensorFlow: ~8.7 ms
# JAX: ~7.2 ms (XLA optimization)
```

### Training Throughput Comparison

| Model | Framework | Images/sec (V100) | Images/sec (A100) |
|-------|-----------|-------------------|-------------------|
| ResNet-50 | PyTorch | ~1,200 | ~3,500 |
| ResNet-50 | TensorFlow | ~1,100 | ~3,200 |
| ResNet-50 | JAX | ~1,300 | ~3,800 |
| BERT-Base | PyTorch | ~350 | ~1,100 |
| BERT-Base | TensorFlow | ~320 | ~1,000 |
| BERT-Base | JAX | ~380 | ~1,200 |

### Memory Efficiency

```python
import torch
import gc

def measure_memory():
    """Measure GPU memory usage."""
    torch.cuda.synchronize()
    return torch.cuda.max_memory_allocated() / 1024**3  # GB

# PyTorch memory optimization techniques
torch.cuda.empty_cache()

# Gradient checkpointing (trade compute for memory)
from torch.utils.checkpoint import checkpoint

class MemoryEfficientModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = torch.nn.ModuleList([
            torch.nn.Linear(1024, 1024) for _ in range(20)
        ])

    def forward(self, x):
        for layer in self.layers:
            x = checkpoint(layer, x, use_reentrant=False)
        return x

# Mixed precision training
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()
with autocast():
    output = model(input)
    loss = criterion(output, target)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

---

## Migration Strategies

### TensorFlow 1.x to 2.x

```python
# TF 1.x style (deprecated)
import tensorflow.compat.v1 as tf1
tf1.disable_v2_behavior()

x = tf1.placeholder(tf1.float32, shape=[None, 784])
W = tf1.Variable(tf1.zeros([784, 10]))
b = tf1.Variable(tf1.zeros([10]))
y = tf1.matmul(x, W) + b

with tf1.Session() as sess:
    sess.run(tf1.global_variables_initializer())
    result = sess.run(y, feed_dict={x: data})

# TF 2.x style
import tensorflow as tf

class LinearModel(tf.keras.Model):
    def __init__(self):
        super().__init__()
        self.dense = tf.keras.layers.Dense(10)

    def call(self, x):
        return self.dense(x)

model = LinearModel()
result = model(data)  # Eager execution
```

### PyTorch to TensorFlow

```python
# PyTorch model
import torch
import torch.nn as nn

class PyTorchModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 64, 3, padding=1)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU()
        self.fc = nn.Linear(64 * 32 * 32, 10)

    def forward(self, x):
        x = self.relu(self.bn1(self.conv1(x)))
        x = x.view(x.size(0), -1)
        return self.fc(x)

# Equivalent TensorFlow model
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

class TensorFlowModel(keras.Model):
    def __init__(self):
        super().__init__()
        self.conv1 = layers.Conv2D(64, 3, padding='same')
        self.bn1 = layers.BatchNormalization()
        self.relu = layers.ReLU()
        self.flatten = layers.Flatten()
        self.fc = layers.Dense(10)

    def call(self, x, training=False):
        x = self.relu(self.bn1(self.conv1(x), training=training))
        x = self.flatten(x)
        return self.fc(x)

# Key differences to note:
# Channel order: PyTorch (N, C, H, W) vs TensorFlow (N, H, W, C)
# BatchNorm training mode must be explicitly passed
# view() -> Flatten() layer
```

### PyTorch to JAX/Flax

```python
# PyTorch model
import torch
import torch.nn as nn

class PyTorchMLP(nn.Module):
    def __init__(self, hidden_dim):
        super().__init__()
        self.fc1 = nn.Linear(784, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, 10)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x, training=True):
        x = torch.relu(self.fc1(x))
        x = self.dropout(x) if training else x
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

# Equivalent Flax model
import flax.linen as nn
import jax
import jax.numpy as jnp

class FlaxMLP(nn.Module):
    hidden_dim: int

    @nn.compact
    def __call__(self, x, training: bool = True):
        x = nn.relu(nn.Dense(self.hidden_dim)(x))
        x = nn.Dropout(rate=0.5, deterministic=not training)(x)
        x = nn.relu(nn.Dense(self.hidden_dim)(x))
        return nn.Dense(10)(x)

# Key differences:
# Flax uses dataclass-style config
# @nn.compact allows inline layer definition
# Dropout uses 'deterministic' instead of 'training'
# Parameters are managed externally in JAX
```

### Weight Transfer Between Frameworks

```python
import torch
import tensorflow as tf
import numpy as np

def transfer_conv_weights_torch_to_tf(torch_conv, tf_conv):
    """Transfer Conv2D weights from PyTorch to TensorFlow."""
    # PyTorch: (out_channels, in_channels, H, W)
    # TensorFlow: (H, W, in_channels, out_channels)

    torch_weights = torch_conv.weight.detach().numpy()
    torch_bias = torch_conv.bias.detach().numpy() if torch_conv.bias is not None else None

    # Transpose weights
    tf_weights = np.transpose(torch_weights, (2, 3, 1, 0))

    tf_conv.set_weights([tf_weights] + ([torch_bias] if torch_bias is not None else []))

def transfer_bn_weights_torch_to_tf(torch_bn, tf_bn):
    """Transfer BatchNorm weights from PyTorch to TensorFlow."""
    weights = [
        torch_bn.weight.detach().numpy(),      # gamma
        torch_bn.bias.detach().numpy(),        # beta
        torch_bn.running_mean.detach().numpy(),
        torch_bn.running_var.detach().numpy()
    ]
    tf_bn.set_weights(weights)

def transfer_linear_weights_torch_to_tf(torch_linear, tf_dense):
    """Transfer Linear/Dense weights from PyTorch to TensorFlow."""
    # PyTorch: (out_features, in_features)
    # TensorFlow: (in_features, out_features)

    torch_weights = torch_linear.weight.detach().numpy()
    torch_bias = torch_linear.bias.detach().numpy()

    tf_weights = np.transpose(torch_weights, (1, 0))
    tf_dense.set_weights([tf_weights, torch_bias])
```

---

## Interview Questions

### Conceptual Questions

**Q1: What are the main differences between static and dynamic computation graphs?**

**Static Graphs (TensorFlow 1.x):**
- Graph is defined before execution
- Requires compilation step
- Better optimization opportunities
- Harder to debug

**Dynamic Graphs (PyTorch, TF 2.x Eager):**
- Graph is built on-the-fly during execution
- More intuitive and Pythonic
- Easier debugging (use print, pdb)
- More flexible for variable-length inputs

```python
# Dynamic graph example (PyTorch)
def dynamic_forward(x, use_branch=True):
    if use_branch:  # Conditional execution based on Python value
        return torch.relu(x)
    else:
        return torch.sigmoid(x)

# This would be complex in static graph frameworks
```

**Q2: How does automatic differentiation work in deep learning frameworks?**

Automatic differentiation uses the chain rule to compute gradients:

1. **Forward pass**: Record operations in a computation graph
2. **Backward pass**: Traverse graph in reverse, accumulating gradients

```python
# Conceptual implementation
class Variable:
    def __init__(self, value, requires_grad=False):
        self.value = value
        self.grad = None
        self.requires_grad = requires_grad
        self.grad_fn = None

    def backward(self):
        if self.grad is None:
            self.grad = 1.0

        if self.grad_fn:
            self.grad_fn(self.grad)

def multiply(a, b):
    result = Variable(a.value * b.value)

    def grad_fn(grad):
        if a.requires_grad:
            a.grad = (a.grad or 0) + grad * b.value
        if b.requires_grad:
            b.grad = (b.grad or 0) + grad * a.value

    result.grad_fn = grad_fn
    return result
```

**Q3: What is XLA and why is it important for JAX?**

XLA (Accelerated Linear Algebra) is a domain-specific compiler for linear algebra:

- Fuses multiple operations into single kernels
- Eliminates intermediate memory allocations
- Optimizes for specific hardware (GPU, TPU)
- Enables cross-device code generation

```python
# JAX automatically uses XLA
@jax.jit  # Triggers XLA compilation
def fused_operations(x):
    # These operations get fused into a single kernel
    return jnp.sum(jnp.exp(x * 2 + 1))
```

### Practical Questions

**Q4: How would you debug a NaN loss in training?**

```python
import torch
import numpy as np

def debug_nan_loss(model, data, target):
    # 1. Check input data
    print(f"Input has NaN: {torch.isnan(data).any()}")
    print(f"Input range: [{data.min():.4f}, {data.max():.4f}]")

    # 2. Hook to monitor layer outputs
    activation_stats = {}

    def hook_fn(name):
        def hook(module, input, output):
            activation_stats[name] = {
                'has_nan': torch.isnan(output).any().item(),
                'has_inf': torch.isinf(output).any().item(),
                'mean': output.mean().item(),
                'std': output.std().item()
            }
        return hook

    hooks = []
    for name, module in model.named_modules():
        hooks.append(module.register_forward_hook(hook_fn(name)))

    # 3. Run forward pass
    output = model(data)

    # 4. Print stats
    for name, stats in activation_stats.items():
        if stats['has_nan'] or stats['has_inf']:
            print(f"PROBLEM in {name}: {stats}")

    # 5. Clean up hooks
    for hook in hooks:
        hook.remove()

    # Common fixes:
    # - Add eps to divisions: x / (y + 1e-8)
    # - Clamp values: torch.clamp(x, min=-1e6, max=1e6)
    # - Use stable implementations: log_softmax instead of log(softmax())
    # - Reduce learning rate
    # - Check for exploding gradients
```

**Q5: How do you choose between different optimizers?**

```python
import torch.optim as optim

# SGD with momentum - Good for CNNs, can achieve best generalization
optimizer = optim.SGD(model.parameters(), lr=0.1, momentum=0.9, weight_decay=1e-4)

# Adam - Good default, works well for most cases
optimizer = optim.Adam(model.parameters(), lr=1e-3, betas=(0.9, 0.999))

# AdamW - Better for Transformers, decoupled weight decay
optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=0.01)

# Recommendations:
# - CNNs (ImageNet): SGD + momentum + lr schedule
# - Transformers/NLP: AdamW + warmup + cosine decay
# - Quick prototyping: Adam
# - Fine-tuning: AdamW with lower lr (1e-5 to 1e-4)
```

**Q6: Explain gradient accumulation and when to use it.**

```python
# Gradient accumulation simulates larger batch sizes
accumulation_steps = 4  # Effective batch size = batch_size * accumulation_steps

optimizer.zero_grad()
for i, (data, target) in enumerate(train_loader):
    output = model(data)
    loss = criterion(output, target) / accumulation_steps  # Scale loss
    loss.backward()  # Accumulate gradients

    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()

# Use cases:
# GPU memory limitations (can't fit large batch)
# Training large models (LLMs)
# Matching paper results that used larger batches
```

### System Design Questions

**Q7: Design a distributed training system for a large language model.**

Key components:

1. **Data Parallelism**: Split batches across GPUs
2. **Model Parallelism**: Split model layers across GPUs
3. **Pipeline Parallelism**: Overlap computation between stages
4. **Gradient Synchronization**: All-reduce or parameter server

```python
# PyTorch Distributed Data Parallel
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

def setup(rank, world_size):
    dist.init_process_group("nccl", rank=rank, world_size=world_size)
    torch.cuda.set_device(rank)

def train(rank, world_size):
    setup(rank, world_size)

    model = LargeModel().to(rank)
    model = DDP(model, device_ids=[rank])

    # Gradient checkpointing for memory efficiency
    model.gradient_checkpointing_enable()

    # Mixed precision
    scaler = torch.cuda.amp.GradScaler()

    for data, target in train_loader:
        with torch.cuda.amp.autocast():
            output = model(data)
            loss = criterion(output, target)

        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
```

**Q8: How would you optimize inference latency for a production model?**

```python
# Model optimization
# Quantization
model_int8 = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)

# TorchScript compilation
scripted_model = torch.jit.script(model)
scripted_model = torch.jit.freeze(scripted_model)

# ONNX export with optimization
torch.onnx.export(model, dummy_input, "model.onnx", opset_version=14)

# TensorRT (for NVIDIA GPUs)
import torch_tensorrt

trt_model = torch_tensorrt.compile(model, inputs=[
    torch_tensorrt.Input(
        min_shape=[1, 3, 224, 224],
        opt_shape=[8, 3, 224, 224],
        max_shape=[32, 3, 224, 224],
        dtype=torch.float16
    )
])

# Batching strategies
# - Dynamic batching
# - Continuous batching for LLMs

# Hardware optimizations
# - Use appropriate precision (FP16, INT8)
# - Optimize memory layout
# - Use async execution
```

---

## Further Reading

### Official Documentation

- [PyTorch Documentation](https://pytorch.org/docs/)
- [TensorFlow Documentation](https://www.tensorflow.org/docs)
- [JAX Documentation](https://jax.readthedocs.io/)
- [Keras Documentation](https://keras.io/)

### Books and Courses

- "Deep Learning with PyTorch" - Eli Stevens, Luca Antiga
- "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow" - Aurelien Geron
- Fast.ai Practical Deep Learning Course
- Stanford CS231n, CS224n

### Research Papers

- "Automatic Differentiation in Machine Learning: a Survey" - Baydin et al.
- "PyTorch 2: Faster Machine Learning Through Dynamic Python Bytecode Transformation and Graph Compilation" - PyTorch Team
- "Compiling Machine Learning Programs via High-Level Tracing" - JAX Team

### Community Resources

- [PyTorch Forums](https://discuss.pytorch.org/)
- [TensorFlow Community](https://www.tensorflow.org/community)
- [HuggingFace Hub](https://huggingface.co/) - Pre-trained models for all frameworks
- [Papers With Code](https://paperswithcode.com/) - Implementations across frameworks

---

Mastering deep learning frameworks is essential for any machine learning practitioner. While PyTorch dominates research, TensorFlow excels in production, and JAX pushes the boundaries of performance. The key is understanding the strengths of each framework and choosing the right tool for your specific needs. As the field continues to advance, staying current with framework developments and best practices will remain crucial for success in deep learning.
