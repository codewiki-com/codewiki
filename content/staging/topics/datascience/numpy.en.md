---
title: NumPy Scientific Computing Guide
description: Master NumPy for efficient array computing
track: datascience
section: python-stack
difficulty: beginner
tags:
  - NumPy
  - Array
  - Scientific Computing
  - Python
status: imported
origin: old/src/content/docs/data/numpy.en.md
divergence: 0.189
issues: []
legacy:
  category: Data
  subcategory: Python
  order: 12
  lastUpdated: 2026-01-07
---

NumPy (Numerical Python) is the foundational library for scientific computing in Python, providing high-performance multidimensional array objects and a rich collection of mathematical functions. It serves as the cornerstone for data science, machine learning, and deep learning, with virtually all Python scientific computing libraries (such as Pandas, SciPy, Scikit-learn, and TensorFlow) built on top of NumPy.

## Why Choose NumPy?

### Performance Advantages

While Python's native lists are flexible, they are inefficient for large-scale numerical computations. NumPy achieves high performance through:

1. **Contiguous Memory Storage**: NumPy arrays are stored contiguously in memory, improving cache hit rates
2. **Fixed Data Types**: Eliminates Python object type checking overhead
3. **Vectorized Operations**: Implemented in C under the hood, avoiding Python loops
4. **SIMD Optimization**: Leverages CPU Single Instruction Multiple Data capabilities

```python
import numpy as np
import time

# Performance comparison: Python list vs NumPy array
size = 1000000

# Python list operation
python_list = list(range(size))
start = time.time()
python_result = [x * 2 for x in python_list]
print(f"Python list time: {time.time() - start:.4f} seconds")

# NumPy array operation
numpy_array = np.arange(size)
start = time.time()
numpy_result = numpy_array * 2
print(f"NumPy array time: {time.time() - start:.4f} seconds")

# NumPy is typically 10-100x faster than Python lists
```

## NumPy Array Basics (ndarray)

### What is ndarray?

The ndarray (N-dimensional array) is NumPy's core data structure. It is a multidimensional array object with the following key attributes:

```python
import numpy as np

# Create a simple array
arr = np.array([[1, 2, 3], [4, 5, 6]])

# Core ndarray attributes
print(f"Array contents:\n{arr}")
print(f"Number of dimensions (ndim): {arr.ndim}")      # 2
print(f"Shape: {arr.shape}")                           # (2, 3)
print(f"Total elements (size): {arr.size}")            # 6
print(f"Data type (dtype): {arr.dtype}")               # int64
print(f"Bytes per element (itemsize): {arr.itemsize}") # 8
print(f"Total bytes (nbytes): {arr.nbytes}")           # 48
```

### Data Types (dtype)

NumPy supports a rich variety of data types. Choosing the right type can optimize memory usage:

```python
# Common data types
int_arr = np.array([1, 2, 3], dtype=np.int32)       # 32-bit integer
float_arr = np.array([1.0, 2.0], dtype=np.float64)  # 64-bit float
bool_arr = np.array([True, False], dtype=np.bool_)  # Boolean
str_arr = np.array(['a', 'b'], dtype='U10')         # Unicode string

# Type conversion
arr = np.array([1.7, 2.3, 3.9])
int_arr = arr.astype(np.int32)  # Convert to integer (truncates decimals)
print(int_arr)  # [1 2 3]

# Available data types overview
print("Integer types: int8, int16, int32, int64")
print("Unsigned integers: uint8, uint16, uint32, uint64")
print("Floating point: float16, float32, float64")
print("Complex numbers: complex64, complex128")
```

## Array Creation and Initialization

### Creating from Python Data Structures

```python
# Create from list
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.array([[1, 2, 3], [4, 5, 6]])  # 2D array

# Create from tuple
arr3 = np.array((1, 2, 3))

# Create multidimensional array from nested lists
arr4 = np.array([[[1, 2], [3, 4]], [[5, 6], [7, 8]]])  # 3D array
print(f"3D array shape: {arr4.shape}")  # (2, 2, 2)
```

### Creating with Built-in Functions

```python
# Create array of zeros
zeros = np.zeros((3, 4))
print(f"Zero array:\n{zeros}")

# Create array of ones
ones = np.ones((2, 3), dtype=np.int32)
print(f"Ones array:\n{ones}")

# Create array filled with specific value
full = np.full((2, 2), 7)
print(f"Filled array:\n{full}")

# Create identity matrix
eye = np.eye(3)
print(f"Identity matrix:\n{eye}")

# Create diagonal matrix
diag = np.diag([1, 2, 3, 4])
print(f"Diagonal matrix:\n{diag}")

# Create uninitialized array (fast, random values)
empty = np.empty((2, 3))
print(f"Uninitialized array:\n{empty}")
```

### Sequence Array Creation

```python
# arange: similar to Python range, but returns array
arr1 = np.arange(10)            # [0, 1, 2, ..., 9]
arr2 = np.arange(2, 10, 2)      # [2, 4, 6, 8]
arr3 = np.arange(0, 1, 0.1)     # Supports float step

# linspace: arithmetic sequence with specified number of elements
arr4 = np.linspace(0, 1, 5)     # [0, 0.25, 0.5, 0.75, 1]
arr5 = np.linspace(0, 1, 5, endpoint=False)  # Excludes endpoint

# logspace: geometric sequence (logarithmic space)
arr6 = np.logspace(0, 3, 4)     # [1, 10, 100, 1000]

# geomspace: geometric progression
arr7 = np.geomspace(1, 1000, 4) # [1, 10, 100, 1000]

print(f"Arithmetic sequence: {arr4}")
print(f"Geometric sequence: {arr6}")
```

### Array Shape Operations

```python
# reshape: change array shape
arr = np.arange(12)
reshaped = arr.reshape(3, 4)
print(f"Reshaped to 3x4:\n{reshaped}")

# Use -1 to auto-calculate dimension
auto_reshape = arr.reshape(2, -1)  # Auto-calculates to (2, 6)
print(f"Auto-calculated shape:\n{auto_reshape}")

# flatten and ravel: flatten array
flat = reshaped.flatten()   # Returns copy
ravel = reshaped.ravel()    # Returns view (more efficient)

# transpose: swap axes
transposed = reshaped.T
print(f"Transposed:\n{transposed}")

# Add and remove dimensions
arr = np.array([1, 2, 3])
expanded = np.expand_dims(arr, axis=0)  # Add dimension
expanded2 = arr[np.newaxis, :]          # Equivalent method
squeezed = np.squeeze(expanded)         # Remove length-1 dimensions
```

## Indexing and Slicing

### Basic Indexing

```python
# 1D array indexing
arr = np.array([10, 20, 30, 40, 50])
print(arr[0])      # 10 (first element)
print(arr[-1])     # 50 (last element)
print(arr[1:4])    # [20, 30, 40] (slice)
print(arr[::2])    # [10, 30, 50] (step of 2)
print(arr[::-1])   # [50, 40, 30, 20, 10] (reverse)

# 2D array indexing
arr2d = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
print(arr2d[0, 0])      # 1
print(arr2d[1, 2])      # 6
print(arr2d[0])         # [1, 2, 3] (first row)
print(arr2d[:, 1])      # [2, 5, 8] (second column)
print(arr2d[0:2, 1:3])  # [[2, 3], [5, 6]] (submatrix)
```

### Advanced Indexing

```python
# Integer array indexing (Fancy Indexing)
arr = np.array([10, 20, 30, 40, 50])
indices = np.array([0, 2, 4])
print(arr[indices])  # [10, 30, 50]

# Fancy indexing for 2D arrays
arr2d = np.arange(12).reshape(3, 4)
rows = np.array([0, 1, 2])
cols = np.array([0, 1, 2])
print(arr2d[rows, cols])  # [0, 5, 10] (diagonal elements)

# Boolean indexing
arr = np.array([1, 2, 3, 4, 5, 6])
mask = arr > 3
print(mask)        # [False, False, False, True, True, True]
print(arr[mask])   # [4, 5, 6]

# Compound conditions
mask = (arr > 2) & (arr < 5)
print(arr[mask])   # [3, 4]

# np.where: conditional indexing
indices = np.where(arr > 3)
print(indices)      # (array([3, 4, 5]),)
print(arr[indices]) # [4, 5, 6]

# np.where ternary expression usage
result = np.where(arr > 3, arr * 2, arr)
print(result)  # [1, 2, 3, 8, 10, 12]
```

### Views vs Copies

```python
# Slicing creates a view (shared memory)
arr = np.array([1, 2, 3, 4, 5])
view = arr[1:4]
view[0] = 100
print(arr)  # [1, 100, 3, 4, 5] (original array also modified)

# Creating a copy
arr = np.array([1, 2, 3, 4, 5])
copy = arr[1:4].copy()
copy[0] = 100
print(arr)  # [1, 2, 3, 4, 5] (original array unchanged)

# Check if it's a view
print(view.base is arr)   # True (is a view)
print(copy.base is None)  # True (is a copy)
```

## Broadcasting

Broadcasting is one of NumPy's most powerful features, allowing arithmetic operations between arrays of different shapes.

### Broadcasting Rules

1. If two arrays have different numbers of dimensions, pad the shape of the smaller array with 1s on the left
2. If arrays differ in size along a dimension but one has size 1, stretch it to match
3. If arrays differ in size along a dimension and neither is 1, raise an error

```python
# Scalar and array
arr = np.array([1, 2, 3])
print(arr + 10)  # [11, 12, 13]

# 1D and 2D arrays
arr2d = np.array([[1, 2, 3], [4, 5, 6]])
arr1d = np.array([10, 20, 30])
print(arr2d + arr1d)
# [[11, 22, 33],
#  [14, 25, 36]]

# Column vector and row vector
col = np.array([[1], [2], [3]])  # (3, 1)
row = np.array([10, 20, 30])     # (3,) -> (1, 3)
print(col + row)
# [[11, 21, 31],
#  [12, 22, 32],
#  [13, 23, 33]]
```

### Practical Applications of Broadcasting

```python
# Image normalization (subtract mean from each channel)
image = np.random.rand(100, 100, 3)  # RGB image
channel_means = image.mean(axis=(0, 1))  # Mean of each channel
normalized = image - channel_means  # Broadcasting handles automatically

# Distance matrix computation
points = np.array([[0, 0], [1, 1], [2, 2], [3, 3]])
# Use broadcasting to compute differences between all point pairs
diff = points[:, np.newaxis, :] - points[np.newaxis, :, :]
distances = np.sqrt((diff ** 2).sum(axis=2))
print(f"Distance matrix:\n{distances}")

# Batch data processing
data = np.random.rand(1000, 10)  # 1000 samples, 10 features
weights = np.array([0.1, 0.2, 0.15, 0.1, 0.05, 0.1, 0.1, 0.08, 0.07, 0.05])
weighted_data = data * weights  # Broadcast applies weights
```

## Vectorized Operations

### Basic Arithmetic Operations

```python
a = np.array([1, 2, 3, 4])
b = np.array([5, 6, 7, 8])

# Element-wise operations
print(a + b)   # [ 6,  8, 10, 12]
print(a - b)   # [-4, -4, -4, -4]
print(a * b)   # [ 5, 12, 21, 32]
print(a / b)   # [0.2, 0.33, 0.43, 0.5]
print(a ** 2)  # [ 1,  4,  9, 16]
print(a % 2)   # [1, 0, 1, 0]
print(a // 2)  # [0, 1, 1, 2]

# Comparison operations
print(a > 2)   # [False, False, True, True]
print(a == b)  # [False, False, False, False]
```

### Aggregation Functions

```python
arr = np.array([[1, 2, 3], [4, 5, 6]])

# Global aggregation
print(np.sum(arr))     # 21
print(np.mean(arr))    # 3.5
print(np.std(arr))     # 1.707...
print(np.var(arr))     # 2.916...
print(np.min(arr))     # 1
print(np.max(arr))     # 6
print(np.prod(arr))    # 720 (product of all elements)

# Aggregation along axis
print(np.sum(arr, axis=0))    # [5, 7, 9] (column sums)
print(np.sum(arr, axis=1))    # [6, 15] (row sums)
print(np.mean(arr, axis=0))   # [2.5, 3.5, 4.5]

# Cumulative functions
print(np.cumsum(arr))   # [ 1,  3,  6, 10, 15, 21]
print(np.cumprod(arr))  # [  1,   2,   6,  24, 120, 720]

# Index functions
print(np.argmax(arr))          # 5 (flat index of maximum)
print(np.argmin(arr, axis=1))  # [0, 0] (index of min in each row)
```

### Logical Operations

```python
arr = np.array([1, 2, 3, 4, 5])

# Conditional checks
print(np.any(arr > 3))   # True (any element satisfies condition)
print(np.all(arr > 0))   # True (all elements satisfy condition)

# Logical operations
a = np.array([True, True, False, False])
b = np.array([True, False, True, False])
print(np.logical_and(a, b))  # [True, False, False, False]
print(np.logical_or(a, b))   # [True, True, True, False]
print(np.logical_not(a))     # [False, False, True, True]
print(np.logical_xor(a, b))  # [False, True, True, False]
```

## Mathematical Functions

### Basic Math Functions

```python
arr = np.array([1, 4, 9, 16, 25])

# Arithmetic functions
print(np.sqrt(arr))     # [1, 2, 3, 4, 5]
print(np.cbrt(arr))     # Cube root
print(np.abs([-1, -2, 3]))   # [1, 2, 3]
print(np.sign([-2, 0, 2]))   # [-1, 0, 1]

# Power and logarithm
print(np.exp([1, 2, 3]))        # [2.718, 7.389, 20.085]
print(np.log([1, np.e, 10]))    # [0, 1, 2.302] (natural log)
print(np.log10([1, 10, 100]))   # [0, 1, 2]
print(np.log2([1, 2, 4, 8]))    # [0, 1, 2, 3]
print(np.power([2, 3], [3, 2])) # [8, 9]

# Rounding functions
arr = np.array([1.2, 2.5, 3.7, -1.5])
print(np.floor(arr))   # [ 1,  2,  3, -2] (floor)
print(np.ceil(arr))    # [ 2,  3,  4, -1] (ceiling)
print(np.round(arr))   # [ 1,  2,  4, -2] (round)
print(np.trunc(arr))   # [ 1,  2,  3, -1] (truncate)
```

### Trigonometric Functions

```python
# Angle conversion
degrees = np.array([0, 30, 45, 60, 90])
radians = np.deg2rad(degrees)  # Degrees to radians
back_to_degrees = np.rad2deg(radians)  # Radians to degrees

# Trigonometric functions
print(np.sin(radians))    # [0, 0.5, 0.707, 0.866, 1]
print(np.cos(radians))    # [1, 0.866, 0.707, 0.5, 0]
print(np.tan(radians[:4])) # [0, 0.577, 1, 1.732]

# Inverse trigonometric functions
print(np.arcsin([0, 0.5, 1]))   # [0, 0.523, 1.570]
print(np.arccos([1, 0.5, 0]))   # [0, 1.047, 1.570]
print(np.arctan([0, 1]))        # [0, 0.785]

# Hyperbolic functions
print(np.sinh([0, 1]))  # Hyperbolic sine
print(np.cosh([0, 1]))  # Hyperbolic cosine
print(np.tanh([0, 1]))  # Hyperbolic tangent
```

### Statistical Functions

```python
data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# Basic statistics
print(np.mean(data))     # 5.5 (mean)
print(np.median(data))   # 5.5 (median)
print(np.std(data))      # 2.872 (standard deviation)
print(np.var(data))      # 8.25 (variance)

# Percentiles
print(np.percentile(data, 25))    # 3.25 (25th percentile)
print(np.percentile(data, 50))    # 5.5 (median)
print(np.percentile(data, [25, 50, 75]))  # Quartiles

# Covariance and correlation
x = np.array([1, 2, 3, 4, 5])
y = np.array([2, 4, 5, 4, 5])
print(np.cov(x, y))       # Covariance matrix
print(np.corrcoef(x, y))  # Correlation coefficient matrix

# Histogram
hist, bin_edges = np.histogram(data, bins=5)
print(f"Histogram: {hist}")
print(f"Bin edges: {bin_edges}")
```

## Linear Algebra Operations

NumPy provides powerful linear algebra capabilities, primarily in the `np.linalg` module.

### Matrix Operations

```python
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

# Matrix multiplication
print(np.dot(A, B))       # Matrix multiplication
print(A @ B)              # Python 3.5+ matrix multiplication operator
print(np.matmul(A, B))    # Equivalent method

# Element-wise multiplication (not matrix multiplication)
print(A * B)  # [[ 5, 12], [21, 32]]

# Transpose
print(A.T)
print(np.transpose(A))

# Matrix trace
print(np.trace(A))  # 5 (sum of diagonal elements)

# Matrix rank
print(np.linalg.matrix_rank(A))  # 2
```

### Vector Operations

```python
v1 = np.array([1, 2, 3])
v2 = np.array([4, 5, 6])

# Dot product
print(np.dot(v1, v2))      # 32
print(v1 @ v2)             # 32

# Cross product
print(np.cross(v1, v2))    # [-3, 6, -3]

# Vector norms
print(np.linalg.norm(v1))          # L2 norm (Euclidean distance)
print(np.linalg.norm(v1, ord=1))   # L1 norm
print(np.linalg.norm(v1, ord=np.inf))  # Infinity norm

# Vector normalization
normalized = v1 / np.linalg.norm(v1)
print(normalized)
print(np.linalg.norm(normalized))  # 1.0
```

### Matrix Decomposition

```python
A = np.array([[1, 2], [3, 4]])

# Determinant
det = np.linalg.det(A)
print(f"Determinant: {det}")  # -2.0

# Inverse matrix
inv_A = np.linalg.inv(A)
print(f"Inverse matrix:\n{inv_A}")
print(f"Verify A @ inv_A:\n{A @ inv_A}")  # Identity matrix

# Eigenvalues and eigenvectors
eigenvalues, eigenvectors = np.linalg.eig(A)
print(f"Eigenvalues: {eigenvalues}")
print(f"Eigenvectors:\n{eigenvectors}")

# Singular Value Decomposition (SVD)
U, S, Vt = np.linalg.svd(A)
print(f"U:\n{U}")
print(f"S: {S}")
print(f"Vt:\n{Vt}")

# QR decomposition
Q, R = np.linalg.qr(A)
print(f"Q:\n{Q}")
print(f"R:\n{R}")

# Cholesky decomposition (requires positive definite matrix)
B = np.array([[4, 2], [2, 5]])
L = np.linalg.cholesky(B)
print(f"Cholesky L:\n{L}")
```

### Solving Linear Systems

```python
# Solve Ax = b
A = np.array([[3, 1], [1, 2]])
b = np.array([9, 8])

# Direct solution
x = np.linalg.solve(A, b)
print(f"Solution: {x}")  # [2, 3]

# Verification
print(f"Verify A @ x = {A @ x}")  # [9, 8]

# Least squares solution (overdetermined system)
A = np.array([[1, 1], [1, 2], [1, 3]])
b = np.array([1, 2, 2])
x, residuals, rank, s = np.linalg.lstsq(A, b, rcond=None)
print(f"Least squares solution: {x}")
print(f"Residuals: {residuals}")
```

## Random Number Generation

NumPy provides powerful random number generation capabilities. The new Generator API is recommended.

### Basic Random Numbers

```python
# Recommended: Generator API (NumPy 1.17+)
rng = np.random.default_rng(seed=42)  # Create random number generator

# Uniform distribution [0, 1)
print(rng.random(5))           # 5 random numbers
print(rng.random((2, 3)))      # 2x3 random array

# Uniform distribution in specified range
print(rng.uniform(1, 10, 5))   # 5 random numbers in [1, 10)

# Random integers
print(rng.integers(0, 10, 5))        # 5 integers in [0, 10)
print(rng.integers(1, 7, (2, 3)))    # Simulating dice

# Random choice from array
arr = np.array(['A', 'B', 'C', 'D'])
print(rng.choice(arr, 3))               # Choose 3 (with replacement)
print(rng.choice(arr, 3, replace=False)) # Choose 3 (without replacement)
```

### Common Probability Distributions

```python
rng = np.random.default_rng(42)

# Normal distribution (Gaussian)
normal = rng.normal(loc=0, scale=1, size=1000)  # Mean 0, std 1
print(f"Normal distribution mean: {normal.mean():.3f}")
print(f"Normal distribution std: {normal.std():.3f}")

# Standard normal distribution
standard_normal = rng.standard_normal(1000)

# Binomial distribution
binomial = rng.binomial(n=10, p=0.5, size=1000)  # 10 trials, p=0.5

# Poisson distribution
poisson = rng.poisson(lam=5, size=1000)  # lambda=5

# Exponential distribution
exponential = rng.exponential(scale=1.0, size=1000)

# Gamma distribution
gamma = rng.gamma(shape=2, scale=2, size=1000)

# Beta distribution
beta = rng.beta(a=2, b=5, size=1000)

# Chi-square distribution
chisquare = rng.chisquare(df=3, size=1000)
```

### Random Permutation and Shuffling

```python
rng = np.random.default_rng(42)

# Shuffle array
arr = np.arange(10)
rng.shuffle(arr)  # In-place shuffle
print(f"Shuffled: {arr}")

# Return shuffled copy
arr = np.arange(10)
shuffled = rng.permutation(arr)  # Returns copy, original unchanged
print(f"Original array: {arr}")
print(f"Shuffled copy: {shuffled}")

# Generate random permutation
perm = rng.permutation(10)  # Random permutation of 0-9
print(f"Random permutation: {perm}")
```

### Setting Random Seed

```python
# Method 1: Create generator with seed (recommended)
rng = np.random.default_rng(42)
print(rng.random(3))

# Using same seed gives same results
rng = np.random.default_rng(42)
print(rng.random(3))  # Same as above

# Method 2: Legacy API (still works but not recommended)
np.random.seed(42)
print(np.random.rand(3))
```

## Performance Optimization Tips

### Avoid Python Loops

```python
# Bad practice: Using Python loops
def slow_function(arr):
    result = np.zeros_like(arr)
    for i in range(len(arr)):
        result[i] = arr[i] ** 2 + 2 * arr[i] + 1
    return result

# Good practice: Vectorized operations
def fast_function(arr):
    return arr ** 2 + 2 * arr + 1

# Performance comparison
arr = np.arange(100000)
# fast_function is typically 100x+ faster
```

### Use Views Instead of Copies

```python
# Prefer views when possible
arr = np.arange(1000000)

# View (efficient)
view = arr[::2]  # No data copying

# Copy (slow, uses memory)
copy = arr[::2].copy()  # Copies data

# Check if it's a view
print(view.base is arr)   # True
print(copy.base is None)  # True
```

### Use Appropriate Data Types

```python
# Choose appropriate types based on data range
small_ints = np.array([1, 2, 3, 4], dtype=np.int8)    # -128 to 127
large_ints = np.array([1, 2, 3, 4], dtype=np.int64)   # Larger range

print(f"int8 memory: {small_ints.nbytes} bytes")
print(f"int64 memory: {large_ints.nbytes} bytes")

# For floating point that doesn't need high precision, use float32
float32_arr = np.random.rand(1000000).astype(np.float32)
float64_arr = np.random.rand(1000000).astype(np.float64)
print(f"float32 memory: {float32_arr.nbytes / 1e6} MB")
print(f"float64 memory: {float64_arr.nbytes / 1e6} MB")
```

### Pre-allocate Arrays

```python
# Bad practice: Dynamic expansion
def bad_append():
    result = np.array([])
    for i in range(10000):
        result = np.append(result, i)
    return result

# Good practice: Pre-allocation
def good_preallocate():
    result = np.zeros(10000)
    for i in range(10000):
        result[i] = i
    return result

# Best practice: Direct vectorization
def best_vectorized():
    return np.arange(10000)
```

### Using np.einsum for Complex Operations

```python
# einsum is a powerful tool for efficient tensor operations
A = np.random.rand(100, 200)
B = np.random.rand(200, 300)
C = np.random.rand(100, 300)

# Matrix multiplication
result = np.einsum('ij,jk->ik', A, B)

# Matrix transpose
transposed = np.einsum('ij->ji', A)

# Diagonal elements
diag = np.einsum('ii->i', np.eye(5))

# Trace
trace = np.einsum('ii->', np.array([[1, 2], [3, 4]]))

# Outer product
outer = np.einsum('i,j->ij', np.array([1, 2, 3]), np.array([4, 5]))

# Batch matrix multiplication
batch_A = np.random.rand(10, 3, 4)
batch_B = np.random.rand(10, 4, 5)
batch_result = np.einsum('nij,njk->nik', batch_A, batch_B)
```

### Memory Layout Optimization

```python
# C order (row-major) vs Fortran order (column-major)
arr_c = np.zeros((1000, 1000), order='C')  # C order (default)
arr_f = np.zeros((1000, 1000), order='F')  # Fortran order

# Row-wise access is faster with C order
# Column-wise access is faster with Fortran order

# Check array contiguity
print(arr_c.flags['C_CONTIGUOUS'])  # True
print(arr_c.flags['F_CONTIGUOUS'])  # False

# Use np.ascontiguousarray to ensure contiguity
arr = np.random.rand(100, 100)[:, ::2]  # Non-contiguous
contiguous = np.ascontiguousarray(arr)  # Convert to contiguous
```

## Interview Key Points

### Differences Between NumPy Arrays and Python Lists

```python
# Python list: Dynamic typing, elements can be different types
py_list = [1, 'hello', 3.14, True]

# NumPy array: Fixed type, all elements same type
np_array = np.array([1, 2, 3, 4])

# Key differences:
# Type: NumPy arrays are homogeneous (same type)
# Performance: NumPy uses contiguous memory, vectorized ops are faster
# Functionality: NumPy provides rich mathematical and scientific functions
# Memory: NumPy arrays use less memory
```

### How Broadcasting Works

```python
# Broadcasting rules (compare shapes from right to left):
# Dimensions are equal
# One of the dimensions is 1

# Example
a = np.ones((3, 4, 5))  # shape: (3, 4, 5)
b = np.ones((4, 5))     # shape: (4, 5) -> (1, 4, 5)
c = a + b               # shape: (3, 4, 5) - can broadcast

a = np.ones((3, 4))     # shape: (3, 4)
b = np.ones((3,))       # shape: (3,) -> (1, 3)
# c = a + b             # Error! (3, 4) and (1, 3) are incompatible
```

### Views vs Copies

```python
arr = np.array([1, 2, 3, 4, 5])

# Operations that create views (shared memory):
view1 = arr[1:4]           # Slicing
view2 = arr.reshape(5, 1)  # Reshape
view3 = arr.T              # Transpose

# Operations that create copies (independent memory):
copy1 = arr[[0, 2, 4]]     # Fancy indexing
copy2 = arr.copy()         # Explicit copy
copy3 = arr.flatten()      # Flatten
```

### Understanding the axis Parameter

```python
arr = np.array([[1, 2, 3],
                [4, 5, 6]])

# axis=0: Operate along first dimension (rows), result reduces rows
print(np.sum(arr, axis=0))  # [5, 7, 9]

# axis=1: Operate along second dimension (columns), result reduces columns
print(np.sum(arr, axis=1))  # [6, 15]

# Memory trick: The specified axis "disappears"
```

### Common Pitfalls

```python
# Pitfall 1: Integer division
a = np.array([1, 2, 3])
b = np.array([2, 2, 2])
print(a / b)   # [0.5, 1.0, 1.5] - Float division in Python 3
print(a // b)  # [0, 1, 1] - Integer division

# Pitfall 2: Comparing floats
a = 0.1 + 0.2
b = 0.3
print(a == b)  # False (floating point precision issue)
print(np.isclose(a, b))  # True (correct approach)
print(np.allclose([a], [b]))  # True (array comparison)

# Pitfall 3: Modifying views affects original array
arr = np.array([1, 2, 3, 4, 5])
view = arr[1:4]
view[0] = 100
print(arr)  # [1, 100, 3, 4, 5] (original array changed!)

# Pitfall 4: Empty array aggregation
empty = np.array([])
# print(np.max(empty))  # Error!
print(np.max(empty, initial=0))  # 0 (provide default value)
```

### Performance Optimization Interview Questions

```python
# Question: How to efficiently compute Euclidean distance between
# corresponding elements of two arrays?

# Inefficient approach
def slow_dist(a, b):
    return [np.sqrt((a[i] - b[i])**2) for i in range(len(a))]

# Efficient approach
def fast_dist(a, b):
    return np.sqrt((a - b)**2)

# Most efficient (using abs directly)
def fastest_dist(a, b):
    return np.abs(a - b)
```

### Practical Application Examples

```python
# Image processing: Grayscale conversion
def rgb_to_gray(image):
    """Convert RGB image to grayscale"""
    # image shape: (H, W, 3)
    weights = np.array([0.299, 0.587, 0.114])
    return np.dot(image[..., :3], weights)

# Machine learning: Feature standardization
def standardize(X):
    """Z-score standardization"""
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    return (X - mean) / std

# Numerical computing: Gradient computation
def numerical_gradient(f, x, h=1e-4):
    """Compute numerical gradient"""
    grad = np.zeros_like(x)
    for i in range(x.size):
        x_plus = x.copy()
        x_plus[i] += h
        x_minus = x.copy()
        x_minus[i] -= h
        grad[i] = (f(x_plus) - f(x_minus)) / (2 * h)
    return grad
```

## Summary

NumPy is the cornerstone of Python scientific computing. Mastering it is essential for data science, machine learning, and scientific research. Key takeaways include:

1. **ndarray is the core**: Understand its attributes, data types, and memory layout
2. **Think vectorized**: Avoid Python loops, leverage broadcasting and vectorized operations
3. **Flexible indexing**: Master basic indexing, fancy indexing, and boolean indexing
4. **Linear algebra fundamentals**: Know matrix operations and common decomposition methods
5. **Performance awareness**: Understand view/copy differences, choose appropriate data types

Learning NumPy is an ongoing journey. Practice with real projects to gradually improve your understanding and application of its advanced features.

## Further Reading

### Official Resources

- [NumPy Official Documentation](https://numpy.org/doc/stable/)
- [NumPy User Guide](https://numpy.org/doc/stable/user/index.html)
- [NumPy Quickstart Tutorial](https://numpy.org/doc/stable/user/quickstart.html)

### Advanced Learning

- **"Python for Data Analysis"** by Wes McKinney (Pandas author, covers NumPy extensively)
- **"Elegant SciPy"** by Juan Nunez-Iglesias, Stefan van der Walt, and Harriet Dashnow
- **"High Performance Python"** by Micha Gorelick and Ian Ozsvald

### Related Tools

- **SciPy**: Extended scientific computing capabilities built on NumPy
- **Pandas**: Data analysis library using NumPy arrays under the hood
- **CuPy**: GPU-accelerated NumPy-compatible library
- **JAX**: High-performance numerical computing with automatic differentiation

### Online Practice

- [NumPy 100 Exercises](https://github.com/rougier/numpy-100)
- [DataCamp NumPy Courses](https://www.datacamp.com/courses/intro-to-python-for-data-science)
- [Kaggle Learn - Python](https://www.kaggle.com/learn/python)

---

NumPy forms the foundation of the entire Python data science ecosystem. By building a solid understanding of its concepts and practicing regularly, you will be well-equipped to tackle complex numerical computing tasks efficiently.
