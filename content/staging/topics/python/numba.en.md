---
title: Python Numba JIT 编译
description: 深入理解 Numba JIT 编译：@jit、@njit、nopython 模式、向量化与 CUDA GPU 加速
track: python
section: typing-tooling
difficulty: advanced
tags:
  - Python
  - Numba
  - JIT
  - 性能优化
  - GPU
  - CUDA
  - 并行计算
status: imported
origin: old/src/content/docs/python/numba.en.md
divergence: 0.204
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 性能优化
  order: 50
  lastUpdated: 2026-01-07
---

## Concept Explanation

### What is Numba?

Numba is an open-source JIT (Just-In-Time) compiler that can compile Python and NumPy code into efficient machine code. By simply adding decorators, Numba can boost the execution speed of pure Python functions by tens or even hundreds of times, without modifying the code structure or learning a new programming language.

### Historical Background

Numba was developed by Anaconda (formerly Continuum Analytics) and was first released in 2012. Its design goal is to enable Python developers in scientific computing and data analysis to easily achieve performance close to C/Fortran while maintaining Python's simplicity and ease of use.

### What Problems Does It Solve?

Python, as an interpreted language, has relatively low performance when executing computationally intensive numerical tasks. Traditional solutions include:

1. **Using NumPy**: Vectorized operations, but still has Python interpreter overhead
2. **Writing C/C++ extensions**: Good performance but complex development
3. **Using Cython**: Requires learning new syntax, tedious compilation process

Numba provides a simpler solution:

```python
from numba import jit
import numpy as np

# Regular Python function - slow
def slow_sum(arr):
    total = 0
    for i in range(len(arr)):
        total += arr[i]
    return total

# Add @jit decorator - tens of times faster
@jit(nopython=True)
def fast_sum(arr):
    total = 0
    for i in range(len(arr)):
        total += arr[i]
    return total

arr = np.random.random(1000000)
# fast_sum is about 100 times faster than slow_sum
```

## Core Principles

### JIT Compilation Workflow

Numba's JIT compilation process consists of the following stages:

```
Python source code → Bytecode analysis → Type inference → LLVM IR → Machine code
```

1. **Bytecode analysis**: Numba analyzes the Python function's bytecode
2. **Type inference**: Infers variable types based on input parameters
3. **IR generation**: Generates LLVM Intermediate Representation (IR)
4. **Machine code compilation**: LLVM compiles IR into optimized machine code
5. **Caching**: Compilation results are cached, subsequent calls use them directly

### Type Inference Mechanism

```python
from numba import jit
import numpy as np

@jit(nopython=True)
def type_inference_example(x, y):
    # Numba automatically infers:
    # x: float64 (if a float is passed)
    # y: int64 (if an integer is passed)
    # result: float64 (floating-point operation result)
    result = x * 2.0 + y
    return result

# First call triggers compilation (for float64, int64)
print(type_inference_example(3.14, 10))

# Different parameter types trigger recompilation
print(type_inference_example(np.array([1.0, 2.0]), 5))
```

### nopython Mode vs object Mode

Numba has two compilation modes:

**nopython mode** (recommended):
- Compiles entirely to machine code, does not call the Python interpreter
- Best performance, typically 10-100 times faster than pure Python
- Limitation: Only supports types and operations that Numba supports

**object mode**:
- Falls back to Python object operations
- Poor performance, may be slower than pure Python
- Supports more Python features

```python
from numba import jit

# Force nopython mode, unsupported operations will raise errors
@jit(nopython=True)  # Equivalent to @njit
def nopython_func(x):
    return x ** 2

# Allow fallback to object mode (not recommended)
@jit(forceobj=True)
def object_func(x):
    return str(x)  # String operations require object mode
```

## Core Concepts

### @jit Decorator

`@jit` is Numba's most basic decorator:

```python
from numba import jit

# Basic usage
@jit
def basic_function(x, y):
    return x + y

# Usage with parameters
@jit(nopython=True, cache=True, parallel=True)
def optimized_function(arr):
    total = 0.0
    for i in range(len(arr)):
        total += arr[i]
    return total
```

Common parameter descriptions:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `nopython` | Force nopython mode | `False` |
| `cache` | Cache compilation results to disk | `False` |
| `parallel` | Enable automatic parallelization | `False` |
| `fastmath` | Use fast math operations (sacrifice precision) | `False` |
| `nogil` | Release GIL (use with parallel) | `False` |

### @njit Decorator

`@njit` is shorthand for `@jit(nopython=True)`, recommended for use:

```python
from numba import njit
import numpy as np

@njit
def matrix_multiply(A, B):
    """Manual implementation of matrix multiplication"""
    M, K = A.shape
    K2, N = B.shape
    assert K == K2

    C = np.zeros((M, N))
    for i in range(M):
        for j in range(N):
            for k in range(K):
                C[i, j] += A[i, k] * B[k, j]
    return C

A = np.random.random((100, 100))
B = np.random.random((100, 100))
result = matrix_multiply(A, B)
```

### Type Signatures

You can explicitly specify function signatures to avoid compilation delay on first call:

```python
from numba import njit, int64, float64

# Single signature
@njit(float64(float64, float64))
def add_floats(x, y):
    return x + y

# Multiple signatures (function overloading)
@njit([
    int64(int64, int64),
    float64(float64, float64)
])
def add_numbers(x, y):
    return x + y

# Array signature
@njit(float64[:](float64[:], float64))
def scale_array(arr, factor):
    return arr * factor
```

### @vectorize Decorator

`@vectorize` creates NumPy ufuncs (universal functions):

```python
from numba import vectorize, float64, int64
import numpy as np

# Create a vectorized function
@vectorize([float64(float64, float64)])
def fast_add(x, y):
    return x + y

# Supports broadcasting
a = np.array([1.0, 2.0, 3.0])
b = np.array([4.0, 5.0, 6.0])
print(fast_add(a, b))  # [5. 7. 9.]

# Scalar with array
print(fast_add(a, 10.0))  # [11. 12. 13.]
```

### @guvectorize Decorator

`@guvectorize` is used for generalized ufuncs, can handle multi-dimensional arrays:

```python
from numba import guvectorize, float64
import numpy as np

@guvectorize([(float64[:], float64[:], float64[:])], '(n),(n)->(n)')
def add_arrays(a, b, result):
    """Element-wise addition, result stored in result"""
    for i in range(len(a)):
        result[i] = a[i] + b[i]

# One-dimensional arrays
a = np.array([1.0, 2.0, 3.0])
b = np.array([4.0, 5.0, 6.0])
result = np.zeros(3)
add_arrays(a, b, result)
print(result)  # [5. 7. 9.]

# Reduction operation
@guvectorize([(float64[:], float64[:])], '(n)->()')
def sum_array(arr, result):
    """Sum an array"""
    total = 0.0
    for i in range(len(arr)):
        total += arr[i]
    result[0] = total

arr = np.array([1.0, 2.0, 3.0, 4.0])
result = np.zeros(1)
sum_array(arr, result)
print(result[0])  # 10.0
```

### Parallel Computing (prange)

Use `prange` instead of `range` to implement automatic parallelization:

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def parallel_sum(arr):
    """Parallel sum"""
    total = 0.0
    for i in prange(len(arr)):
        total += arr[i]
    return total

@njit(parallel=True)
def parallel_matrix_multiply(A, B):
    """Parallel matrix multiplication"""
    M, K = A.shape
    K2, N = B.shape
    C = np.zeros((M, N))

    for i in prange(M):  # Parallelize outer loop
        for j in range(N):
            for k in range(K):
                C[i, j] += A[i, k] * B[k, j]
    return C

# Test
arr = np.random.random(10000000)
print(parallel_sum(arr))

A = np.random.random((500, 500))
B = np.random.random((500, 500))
C = parallel_matrix_multiply(A, B)
```

### CUDA GPU Support

Numba supports NVIDIA GPU acceleration:

```python
from numba import cuda
import numpy as np
import math

# GPU kernel function
@cuda.jit
def gpu_add(a, b, result):
    """Perform vector addition on GPU"""
    idx = cuda.grid(1)  # Get global thread index
    if idx < len(a):
        result[idx] = a[idx] + b[idx]

# Host code
n = 1000000
a = np.random.random(n).astype(np.float32)
b = np.random.random(n).astype(np.float32)
result = np.zeros(n, dtype=np.float32)

# Copy data to GPU
d_a = cuda.to_device(a)
d_b = cuda.to_device(b)
d_result = cuda.to_device(result)

# Configure thread blocks
threads_per_block = 256
blocks_per_grid = (n + threads_per_block - 1) // threads_per_block

# Launch kernel
gpu_add[blocks_per_grid, threads_per_block](d_a, d_b, d_result)

# Copy result back to host
result = d_result.copy_to_host()
print(result[:10])
```

**CUDA Device Functions**:

```python
from numba import cuda
import math

# Device function (can be called by kernels)
@cuda.jit(device=True)
def device_sigmoid(x):
    return 1.0 / (1.0 + math.exp(-x))

@cuda.jit
def apply_sigmoid(arr, result):
    idx = cuda.grid(1)
    if idx < len(arr):
        result[idx] = device_sigmoid(arr[idx])
```

**Shared Memory Optimization**:

```python
from numba import cuda
import numpy as np

@cuda.jit
def matrix_multiply_shared(A, B, C):
    """Matrix multiplication using shared memory"""
    # Define shared memory
    TILE_SIZE = 16
    sA = cuda.shared.array((TILE_SIZE, TILE_SIZE), dtype=np.float32)
    sB = cuda.shared.array((TILE_SIZE, TILE_SIZE), dtype=np.float32)

    tx = cuda.threadIdx.x
    ty = cuda.threadIdx.y
    bx = cuda.blockIdx.x
    by = cuda.blockIdx.y

    row = by * TILE_SIZE + ty
    col = bx * TILE_SIZE + tx

    # Accumulator
    tmp = 0.0

    # Tiled computation
    for m in range((A.shape[1] + TILE_SIZE - 1) // TILE_SIZE):
        # Load into shared memory
        if row < A.shape[0] and m * TILE_SIZE + tx < A.shape[1]:
            sA[ty, tx] = A[row, m * TILE_SIZE + tx]
        else:
            sA[ty, tx] = 0.0

        if m * TILE_SIZE + ty < B.shape[0] and col < B.shape[1]:
            sB[ty, tx] = B[m * TILE_SIZE + ty, col]
        else:
            sB[ty, tx] = 0.0

        # Synchronize threads
        cuda.syncthreads()

        # Compute partial result
        for k in range(TILE_SIZE):
            tmp += sA[ty, k] * sB[k, tx]

        cuda.syncthreads()

    # Write back result
    if row < C.shape[0] and col < C.shape[1]:
        C[row, col] = tmp
```

## Code Examples

### Example 1: Numerical Computation Acceleration

```python
from numba import njit
import numpy as np
import time

# Monte Carlo method to calculate Pi
@njit
def monte_carlo_pi(n_samples):
    """Estimate Pi using Monte Carlo method"""
    inside = 0
    for _ in range(n_samples):
        x = np.random.random()
        y = np.random.random()
        if x**2 + y**2 <= 1.0:
            inside += 1
    return 4.0 * inside / n_samples

def pure_python_pi(n_samples):
    """Pure Python implementation"""
    import random
    inside = 0
    for _ in range(n_samples):
        x = random.random()
        y = random.random()
        if x**2 + y**2 <= 1.0:
            inside += 1
    return 4.0 * inside / n_samples

# Performance comparison
n = 10000000

# Warm up JIT
monte_carlo_pi(100)

start = time.time()
pi_numba = monte_carlo_pi(n)
numba_time = time.time() - start

start = time.time()
pi_python = pure_python_pi(n)
python_time = time.time() - start

print(f"Numba: Pi = {pi_numba:.6f}, Time: {numba_time:.3f} seconds")
print(f"Python: Pi = {pi_python:.6f}, Time: {python_time:.3f} seconds")
print(f"Speedup: {python_time / numba_time:.1f}x")
```

### Example 2: Image Processing

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def blur_image(image, kernel_size=5):
    """Gaussian blur (mean filter approximation)"""
    height, width = image.shape
    half_k = kernel_size // 2
    result = np.zeros_like(image)

    for i in prange(half_k, height - half_k):
        for j in range(half_k, width - half_k):
            total = 0.0
            count = 0
            for ki in range(-half_k, half_k + 1):
                for kj in range(-half_k, half_k + 1):
                    total += image[i + ki, j + kj]
                    count += 1
            result[i, j] = total / count

    return result

@njit
def sobel_edge_detection(image):
    """Sobel edge detection"""
    height, width = image.shape
    result = np.zeros_like(image)

    # Sobel operators
    Gx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float64)
    Gy = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float64)

    for i in range(1, height - 1):
        for j in range(1, width - 1):
            gx = 0.0
            gy = 0.0
            for ki in range(-1, 2):
                for kj in range(-1, 2):
                    pixel = image[i + ki, j + kj]
                    gx += pixel * Gx[ki + 1, kj + 1]
                    gy += pixel * Gy[ki + 1, kj + 1]
            result[i, j] = np.sqrt(gx**2 + gy**2)

    return result

# Test
image = np.random.random((1000, 1000))
blurred = blur_image(image)
edges = sobel_edge_detection(image)
print(f"Blurred image shape: {blurred.shape}")
print(f"Edge image shape: {edges.shape}")
```

### Example 3: Scientific Computing

```python
from numba import njit
import numpy as np

@njit
def runge_kutta_4(f, y0, t0, t1, n_steps):
    """Fourth-order Runge-Kutta method for solving ODEs

    Solves dy/dt = f(t, y)
    """
    dt = (t1 - t0) / n_steps
    t = t0
    y = y0

    results_t = np.zeros(n_steps + 1)
    results_y = np.zeros(n_steps + 1)
    results_t[0] = t
    results_y[0] = y

    for i in range(n_steps):
        k1 = f(t, y)
        k2 = f(t + dt/2, y + dt*k1/2)
        k3 = f(t + dt/2, y + dt*k2/2)
        k4 = f(t + dt, y + dt*k3)

        y = y + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
        t = t + dt

        results_t[i + 1] = t
        results_y[i + 1] = y

    return results_t, results_y

@njit
def harmonic_oscillator(t, y):
    """Simple harmonic motion dy/dt = -sin(y)"""
    return -np.sin(y)

# Solve
t, y = runge_kutta_4(harmonic_oscillator, 1.0, 0.0, 10.0, 1000)
print(f"t range: [{t[0]:.2f}, {t[-1]:.2f}]")
print(f"Final y value: {y[-1]:.6f}")
```

### Example 4: Parallel Data Processing

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def parallel_histogram(data, bins, min_val, max_val):
    """Parallel histogram computation"""
    n_bins = len(bins) - 1
    histogram = np.zeros(n_bins, dtype=np.int64)
    bin_width = (max_val - min_val) / n_bins

    for i in prange(len(data)):
        val = data[i]
        if min_val <= val < max_val:
            bin_idx = int((val - min_val) / bin_width)
            if bin_idx >= n_bins:
                bin_idx = n_bins - 1
            histogram[bin_idx] += 1

    return histogram

@njit(parallel=True)
def parallel_moving_average(data, window_size):
    """Parallel moving average"""
    n = len(data)
    result = np.zeros(n)
    half_window = window_size // 2

    for i in prange(n):
        start = max(0, i - half_window)
        end = min(n, i + half_window + 1)
        total = 0.0
        for j in range(start, end):
            total += data[j]
        result[i] = total / (end - start)

    return result

# Test
data = np.random.randn(10000000)

bins = np.linspace(-4, 4, 101)
hist = parallel_histogram(data, bins, -4.0, 4.0)
print(f"Histogram bin count: {len(hist)}")

smooth_data = parallel_moving_average(data, 5)
print(f"Smoothed data length: {len(smooth_data)}")
```

### Example 5: CUDA GPU Computing

```python
from numba import cuda
import numpy as np
import math

@cuda.jit
def mandelbrot_kernel(min_x, max_x, min_y, max_y, image, max_iters):
    """Mandelbrot set computation (GPU version)"""
    height, width = image.shape

    x, y = cuda.grid(2)

    if x < width and y < height:
        # Calculate complex plane coordinates
        real = min_x + (x / width) * (max_x - min_x)
        imag = min_y + (y / height) * (max_y - min_y)

        c = complex(real, imag)
        z = 0j

        for i in range(max_iters):
            z = z * z + c
            if abs(z) > 2:
                image[y, x] = i
                return

        image[y, x] = max_iters

def compute_mandelbrot_gpu(width, height, max_iters=256):
    """Compute Mandelbrot set on GPU"""
    # Allocate device memory
    image = cuda.device_array((height, width), dtype=np.int32)

    # Configure thread grid
    threads_per_block = (16, 16)
    blocks_per_grid_x = (width + threads_per_block[0] - 1) // threads_per_block[0]
    blocks_per_grid_y = (height + threads_per_block[1] - 1) // threads_per_block[1]
    blocks_per_grid = (blocks_per_grid_x, blocks_per_grid_y)

    # Launch kernel
    mandelbrot_kernel[blocks_per_grid, threads_per_block](
        -2.0, 1.0, -1.5, 1.5, image, max_iters
    )

    # Copy result back to host
    return image.copy_to_host()

# Usage example (requires CUDA environment)
# result = compute_mandelbrot_gpu(1920, 1080, 256)
# print(f"Mandelbrot image shape: {result.shape}")
```

## Best Practices

### Prefer @njit

```python
from numba import njit

# Recommended: Explicitly require nopython mode
@njit
def good_function(x):
    return x ** 2

# Not recommended: May fall back to object mode
from numba import jit

@jit
def maybe_slow_function(x):
    return x ** 2
```

### Enable Caching

```python
from numba import njit

# Enable disk caching to avoid repeated compilation
@njit(cache=True)
def cached_function(arr):
    total = 0.0
    for i in range(len(arr)):
        total += arr[i]
    return total
```

### Use Correct Data Types

```python
from numba import njit
import numpy as np

@njit
def type_aware_function(arr):
    # Initialize with the same type as input
    total = arr.dtype.type(0)  # Automatically match type
    for i in range(len(arr)):
        total += arr[i]
    return total

# Specify correct dtype
arr_float32 = np.random.random(1000).astype(np.float32)
arr_float64 = np.random.random(1000).astype(np.float64)

result32 = type_aware_function(arr_float32)  # Returns float32
result64 = type_aware_function(arr_float64)  # Returns float64
```

### Avoid Python Object Operations

```python
from numba import njit
import numpy as np

# Bad example: Using Python list
# @njit
# def bad_function():
#     result = []  # Python list not supported
#     for i in range(10):
#         result.append(i)
#     return result

# Good example: Using NumPy array
@njit
def good_function():
    result = np.zeros(10, dtype=np.int64)
    for i in range(10):
        result[i] = i
    return result
```

### Use prange Correctly

```python
from numba import njit, prange
import numpy as np

# Suitable for parallelization: Independent iterations
@njit(parallel=True)
def good_parallel(arr):
    result = np.zeros_like(arr)
    for i in prange(len(arr)):
        result[i] = arr[i] ** 2  # Each iteration is independent
    return result

# Needs reduction: Use correct pattern
@njit(parallel=True)
def parallel_reduction(arr):
    total = 0.0
    for i in prange(len(arr)):
        total += arr[i]  # Numba automatically handles reduction
    return total
```

### Warm Up JIT Compilation

```python
from numba import njit
import numpy as np
import time

@njit
def my_function(arr):
    return np.sum(arr ** 2)

# Warm up: First call triggers compilation
dummy = np.array([1.0, 2.0, 3.0])
my_function(dummy)  # Compile

# Now we can accurately measure performance
arr = np.random.random(1000000)
start = time.time()
result = my_function(arr)
elapsed = time.time() - start
print(f"Execution time: {elapsed:.4f} seconds")
```

### Use fastmath for Acceleration (Sacrificing Precision)

```python
from numba import njit
import numpy as np

# Default: Strict IEEE 754 floating-point arithmetic
@njit
def precise_function(arr):
    return np.sum(arr)

# fastmath: Faster but may have precision loss
@njit(fastmath=True)
def fast_function(arr):
    return np.sum(arr)

# Suitable for scenarios with low precision requirements
arr = np.random.random(1000000)
# fast_function may be 2-5 times faster, but results may differ slightly
```

## Common Pitfalls

### First Call Delay

```python
from numba import njit
import time

@njit
def slow_first_call(arr):
    return arr.sum()

arr = np.random.random(100)

# First call includes compilation time
start = time.time()
slow_first_call(arr)
print(f"First call: {time.time() - start:.4f} seconds")  # May be slow

# Subsequent calls are fast
start = time.time()
slow_first_call(arr)
print(f"Subsequent call: {time.time() - start:.6f} seconds")  # Very fast
```

**Solution**: Use `cache=True` or warm up.

### Unsupported Python Features

```python
from numba import njit

# Error: Dictionary comprehension not supported
# @njit
# def bad_dict_comp():
#     return {i: i**2 for i in range(10)}

# Error: set not supported
# @njit
# def bad_set():
#     return set([1, 2, 3])

# Error: try/except not supported
# @njit
# def bad_exception():
#     try:
#         return 1 / 0
#     except:
#         return 0

# Correct: Use supported types
@njit
def good_function():
    result = np.zeros(10)
    for i in range(10):
        result[i] = i ** 2
    return result
```

### String Operations Not Supported

```python
from numba import njit

# Error: String operations not supported
# @njit
# def bad_string():
#     s = "hello"
#     return s.upper()

# Solution: Handle strings outside Numba
def process_with_strings(arr):
    # String processing outside
    label = "result"

    @njit
    def numeric_part(arr):
        return arr.sum()

    result = numeric_part(arr)
    return f"{label}: {result}"
```

### Global Variable Trap

```python
from numba import njit
import numpy as np

# Trap: Global variables are captured at compile time
GLOBAL_VALUE = 10

@njit
def uses_global():
    return GLOBAL_VALUE * 2

print(uses_global())  # 20

GLOBAL_VALUE = 20  # Modify global variable
print(uses_global())  # Still 20! (Uses value at compile time)

# Solution: Pass variables as parameters
@njit
def better_function(value):
    return value * 2

print(better_function(10))  # 20
print(better_function(20))  # 40
```

### Type Mismatch Causing Repeated Compilation

```python
from numba import njit
import numpy as np

@njit
def type_sensitive(arr):
    return arr.sum()

# Each type combination triggers new compilation
arr_float32 = np.array([1.0, 2.0], dtype=np.float32)
arr_float64 = np.array([1.0, 2.0], dtype=np.float64)
arr_int32 = np.array([1, 2], dtype=np.int32)

type_sensitive(arr_float32)  # Compilation 1
type_sensitive(arr_float64)  # Compilation 2
type_sensitive(arr_int32)    # Compilation 3

# Solution: Unify data types
arr = np.array([1, 2], dtype=np.float64)  # Consistently use float64
```

### Recursion Depth Limitation

```python
from numba import njit

# Deep recursion may have issues
@njit
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Small values are fine
print(fibonacci(20))  # OK

# Large values may fail
# print(fibonacci(1000))  # May cause stack overflow

# Solution: Use iteration
@njit
def fibonacci_iterative(n):
    if n < 2:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
```

## Performance Considerations

### Compilation Overhead Analysis

```python
from numba import njit
import numpy as np
import time

@njit
def example_function(arr):
    return np.sum(arr ** 2)

arr = np.random.random(1000)

# First call (includes compilation)
start = time.time()
example_function(arr)
compile_time = time.time() - start

# Subsequent calls (pure execution)
times = []
for _ in range(100):
    start = time.time()
    example_function(arr)
    times.append(time.time() - start)

avg_time = np.mean(times)

print(f"Compilation time: {compile_time:.4f} seconds")
print(f"Average execution time: {avg_time:.6f} seconds")
print(f"Need {int(compile_time / avg_time)} calls to offset compilation overhead")
```

### When to Use Numba

| Scenario | Recommended | Reason |
|----------|-------------|--------|
| Numerical loop computation | Highly recommended | Significant performance improvement |
| NumPy array operations | Recommended | Can be further optimized |
| Large data processing | Recommended | Compilation overhead can be amortized |
| Simple one-time computation | Not recommended | Compilation overhead exceeds benefit |
| String/IO operations | Not supported | Use native Python |
| Complex object operations | Not recommended | Limited support |

### Memory Usage Optimization

```python
from numba import njit
import numpy as np

# In-place operation reduces memory allocation
@njit
def inplace_operation(arr):
    for i in range(len(arr)):
        arr[i] = arr[i] ** 2
    # Does not return new array, modifies in-place

# Pre-allocate output array
@njit
def preallocated_output(arr, result):
    for i in range(len(arr)):
        result[i] = arr[i] ** 2
    # Result written to pre-allocated array

# Usage example
arr = np.random.random(1000000)
result = np.empty_like(arr)
preallocated_output(arr, result)
```

### Parallel Efficiency Analysis

```python
from numba import njit, prange
import numpy as np
import time

@njit
def serial_compute(arr):
    result = np.zeros_like(arr)
    for i in range(len(arr)):
        result[i] = arr[i] ** 2 + np.sin(arr[i])
    return result

@njit(parallel=True)
def parallel_compute(arr):
    result = np.zeros_like(arr)
    for i in prange(len(arr)):
        result[i] = arr[i] ** 2 + np.sin(arr[i])
    return result

# Test different data sizes
for size in [1000, 10000, 100000, 1000000]:
    arr = np.random.random(size)

    # Warm up
    serial_compute(arr)
    parallel_compute(arr)

    # Measure
    start = time.time()
    for _ in range(10):
        serial_compute(arr)
    serial_time = (time.time() - start) / 10

    start = time.time()
    for _ in range(10):
        parallel_compute(arr)
    parallel_time = (time.time() - start) / 10

    speedup = serial_time / parallel_time
    print(f"Data size: {size:>8} | Serial: {serial_time:.6f}s | Parallel: {parallel_time:.6f}s | Speedup: {speedup:.2f}x")
```

## Real-World Scenarios

### Scenario 1: Quantitative Finance Computation

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def monte_carlo_option_pricing(S0, K, r, sigma, T, n_simulations, n_steps):
    """Monte Carlo option pricing

    Parameters:
        S0: Initial stock price
        K: Strike price
        r: Risk-free rate
        sigma: Volatility
        T: Time to expiration (years)
        n_simulations: Number of simulations
        n_steps: Number of time steps

    Returns:
        European call option price
    """
    dt = T / n_steps
    discount = np.exp(-r * T)

    payoffs = np.zeros(n_simulations)

    for i in prange(n_simulations):
        S = S0
        for j in range(n_steps):
            z = np.random.randn()
            S = S * np.exp((r - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)

        payoffs[i] = max(S - K, 0)

    option_price = discount * np.mean(payoffs)
    return option_price

# Usage example
price = monte_carlo_option_pricing(
    S0=100,      # Initial stock price
    K=105,       # Strike price
    r=0.05,      # Risk-free rate 5%
    sigma=0.2,   # Volatility 20%
    T=1.0,       # 1 year to expiration
    n_simulations=1000000,
    n_steps=252  # Trading days
)
print(f"Option price: ${price:.2f}")
```

### Scenario 2: Signal Processing

```python
from numba import njit
import numpy as np

@njit
def fft_cooley_tukey(x):
    """Cooley-Tukey FFT algorithm implementation"""
    n = len(x)

    if n == 1:
        return x.copy()

    if n % 2 != 0:
        raise ValueError("Length must be a power of 2")

    # Divide and conquer
    even = fft_cooley_tukey(x[0::2])
    odd = fft_cooley_tukey(x[1::2])

    # Combine
    result = np.zeros(n, dtype=np.complex128)
    for k in range(n // 2):
        t = np.exp(-2j * np.pi * k / n) * odd[k]
        result[k] = even[k] + t
        result[k + n // 2] = even[k] - t

    return result

@njit
def apply_low_pass_filter(signal, cutoff_ratio):
    """Low-pass filter"""
    n = len(signal)

    # FFT
    spectrum = np.fft.fft(signal)

    # Filter
    cutoff = int(n * cutoff_ratio)
    for i in range(cutoff, n - cutoff):
        spectrum[i] = 0

    # IFFT
    filtered = np.fft.ifft(spectrum)

    return np.real(filtered)

# Usage example
t = np.linspace(0, 1, 1024)
signal = np.sin(2 * np.pi * 5 * t) + 0.5 * np.sin(2 * np.pi * 50 * t)  # 5Hz + 50Hz
filtered = apply_low_pass_filter(signal, 0.1)  # Keep low frequencies
print(f"Original signal length: {len(signal)}")
print(f"Filtered signal length: {len(filtered)}")
```

### Scenario 3: Physics Simulation

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def n_body_simulation(positions, velocities, masses, dt, n_steps):
    """N-body problem simulation

    Parameters:
        positions: Position array (n, 3)
        velocities: Velocity array (n, 3)
        masses: Mass array (n,)
        dt: Time step
        n_steps: Number of simulation steps
    """
    G = 6.67430e-11  # Gravitational constant
    n = len(masses)
    softening = 1e-9  # Softening parameter to avoid division by zero

    for step in range(n_steps):
        # Calculate accelerations
        accelerations = np.zeros_like(positions)

        for i in prange(n):
            for j in range(n):
                if i != j:
                    r = positions[j] - positions[i]
                    dist = np.sqrt(np.sum(r**2) + softening**2)
                    accelerations[i] += G * masses[j] * r / dist**3

        # Update velocities and positions (Verlet integration)
        velocities += accelerations * dt
        positions += velocities * dt

    return positions, velocities

# Usage example: Three-body problem
positions = np.array([
    [0.0, 0.0, 0.0],
    [1e11, 0.0, 0.0],
    [0.5e11, 0.866e11, 0.0]
], dtype=np.float64)

velocities = np.array([
    [0.0, 0.0, 0.0],
    [0.0, 3e4, 0.0],
    [-2.6e4, -1.5e4, 0.0]
], dtype=np.float64)

masses = np.array([1.989e30, 1.989e30, 1.989e30], dtype=np.float64)  # Three solar masses

final_pos, final_vel = n_body_simulation(positions, velocities, masses, dt=3600, n_steps=1000)
print(f"Final positions:\n{final_pos}")
```

### Scenario 4: Machine Learning Core Computation

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def k_means_iteration(data, centroids):
    """K-Means single iteration

    Parameters:
        data: Data points (n_samples, n_features)
        centroids: Cluster centers (k, n_features)

    Returns:
        labels: Cluster label for each point
        new_centroids: Updated cluster centers
    """
    n_samples, n_features = data.shape
    k = len(centroids)

    # Assign labels
    labels = np.zeros(n_samples, dtype=np.int64)
    for i in prange(n_samples):
        min_dist = np.inf
        for j in range(k):
            dist = 0.0
            for f in range(n_features):
                dist += (data[i, f] - centroids[j, f]) ** 2
            if dist < min_dist:
                min_dist = dist
                labels[i] = j

    # Update cluster centers
    new_centroids = np.zeros_like(centroids)
    counts = np.zeros(k, dtype=np.int64)

    for i in range(n_samples):
        label = labels[i]
        counts[label] += 1
        for f in range(n_features):
            new_centroids[label, f] += data[i, f]

    for j in range(k):
        if counts[j] > 0:
            for f in range(n_features):
                new_centroids[j, f] /= counts[j]
        else:
            # Empty cluster, keep original center
            new_centroids[j] = centroids[j]

    return labels, new_centroids

def k_means(data, k, max_iters=100, tol=1e-4):
    """K-Means clustering"""
    n_samples = len(data)

    # Random initialization of cluster centers
    indices = np.random.choice(n_samples, k, replace=False)
    centroids = data[indices].copy()

    for i in range(max_iters):
        labels, new_centroids = k_means_iteration(data, centroids)

        # Check convergence
        shift = np.sqrt(np.sum((new_centroids - centroids) ** 2))
        if shift < tol:
            print(f"K-Means converged after {i+1} iterations")
            break

        centroids = new_centroids

    return labels, centroids

# Usage example
np.random.seed(42)
data = np.vstack([
    np.random.randn(1000, 2) + [0, 0],
    np.random.randn(1000, 2) + [5, 5],
    np.random.randn(1000, 2) + [10, 0]
])

labels, centroids = k_means(data, k=3)
print(f"Cluster centers:\n{centroids}")
```

## Interview Key Points

### What is Numba? What is its main purpose?

**Answer**: Numba is an open-source JIT (Just-In-Time) compiler that can compile Python and NumPy code into efficient machine code. It is mainly used for:
- Accelerating computationally intensive Python code
- Achieving performance close to C without modifying code structure
- Supporting CPU multi-core parallelization and NVIDIA GPU acceleration

### What is the difference between @jit and @njit?

**Answer**:
- `@jit`: By default allows fallback to object mode (if code contains unsupported features)
- `@njit`: Equivalent to `@jit(nopython=True)`, forces nopython mode, raises error if code contains unsupported features

Using `@njit` is recommended because object mode has poor performance and may be slower than pure Python.

### What is the difference between Numba's nopython mode and object mode?

**Answer**:
- **nopython mode**: Compiles entirely to machine code, does not call Python interpreter, best performance (typically 10-100 times faster)
- **object mode**: Uses Python object operations, poor performance, but supports more Python features

nopython mode limitations: Only supports data types supported by Numba (NumPy arrays, basic numeric types, etc.), does not support Python lists, dictionaries, strings, etc.

### How do you implement parallel computing with Numba?

**Answer**: Use `@njit(parallel=True)` decorator with `prange` instead of `range`:

```python
from numba import njit, prange

@njit(parallel=True)
def parallel_sum(arr):
    total = 0.0
    for i in prange(len(arr)):
        total += arr[i]
    return total
```

Numba automatically handles thread safety for reduction operations (like summation).

### What Python/NumPy features does Numba support?

**Answer**:
**Supported**:
- NumPy arrays and most NumPy functions
- Basic numeric types (int, float, complex)
- Tuples
- Loops, conditional statements
- Basic mathematical operations

**Not supported**:
- Python lists, dictionaries, sets
- String operations
- try/except exception handling
- Classes (limited support)
- Most Python standard library

### When should you NOT use Numba?

**Answer**:
- Simple one-time computations (compilation overhead exceeds benefit)
- Code involving strings, IO operations
- Need to use Python dictionaries, lists, and other data structures
- Calling unsupported third-party libraries
- Small data volume processing

### How to optimize Numba's first-call delay?

**Answer**:
1. **Use caching**: `@njit(cache=True)` caches compilation results to disk
2. **Warm up**: Call the function once before the performance-critical path
3. **Explicit signatures**: Declare type signatures in advance to avoid type inference
4. **AOT compilation**: Use `@cc.export` for ahead-of-time compilation

### How does Numba support GPU computing?

**Answer**: Numba supports NVIDIA GPU through the `numba.cuda` module:

```python
from numba import cuda

@cuda.jit
def gpu_kernel(arr):
    idx = cuda.grid(1)
    if idx < len(arr):
        arr[idx] = arr[idx] ** 2
```

Requires configuring thread blocks and grids, managing device memory, and using the CUDA programming model.

## Further Reading

### Official Resources

- [Numba Official Documentation](https://numba.pydata.org/numba-doc/latest/index.html) - The most authoritative reference documentation
- [Numba GitHub Repository](https://github.com/numba/numba) - Source code and issue tracking
- [Numba Examples Collection](https://numba.pydata.org/numba-doc/latest/user/examples.html) - Official example code

### Advanced Learning

- [CUDA Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/) - Understanding GPU programming model
- [LLVM Project](https://llvm.org/) - Understanding underlying compilation technology
- [NumPy Documentation](https://numpy.org/doc/) - Numba is tightly integrated with NumPy

### Related Technology Comparison

- **Cython**: Requires additional syntax, but supports wider Python features
- **PyPy**: Overall Python interpreter acceleration, but limited NumPy compatibility
- **JAX**: Developed by Google, supports automatic differentiation and GPU/TPU acceleration
- **CuPy**: GPU version of NumPy, API compatible

### Recommended Books

- "High Performance Python" - Covers various Python optimization techniques
- "Python for Data Analysis" - Data analysis performance optimization
- "Parallel Programming with Python" - Parallel computing practice

### Community Resources

- [Numba Users Mailing List](https://groups.google.com/g/numba-users) - Official user community
- [Stack Overflow numba tag](https://stackoverflow.com/questions/tagged/numba) - Q&A community
- [Real Python Numba Tutorial](https://realpython.com/numpy-tutorial/) - Getting started tutorial
