---
title: 机器学习数学基础：线性代数
description: 掌握机器学习必备的线性代数知识：向量空间、矩阵运算、特征值分解和SVD
track: datascience
section: statistics
difficulty: intermediate
tags:
  - 线性代数
  - 数学
  - 机器学习
  - SVD
status: imported
origin: old/src/content/docs/datascience/linear-algebra.en.md
divergence: 0.193
issues:
  - title-lang-en
  - title-language
legacy:
  category: DataScience
  subcategory: Math
  order: 1
  lastUpdated: 2026-01-07
---

Linear algebra is one of the most important mathematical foundations for machine learning. From data representation to model optimization, from dimensionality reduction algorithms to neural networks, linear algebra is everywhere. This article covers the linear algebra knowledge commonly used in machine learning, and demonstrates its practical applications through NumPy code.

## Vector Spaces and Bases

### Basic Concepts of Vectors

In machine learning, vectors are the fundamental form of data representation. An n-dimensional vector can represent n features of a data point.

```python
import numpy as np

# Vector representation
# Row vector
row_vector = np.array([1, 2, 3])
print(f"Row vector: {row_vector}, shape: {row_vector.shape}")

# Column vector
col_vector = np.array([[1], [2], [3]])
print(f"Column vector:\n{col_vector}, shape: {col_vector.shape}")

# In machine learning, column vectors are typically used to represent data points
# Example: a sample with 3 features
sample = np.array([[170],   # height (cm)
                   [65],    # weight (kg)
                   [25]])   # age
print(f"Sample vector:\n{sample}")
```

### Vector Operations

```python
# Vector addition
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print(f"Vector addition: a + b = {a + b}")

# Scalar multiplication
c = 2
print(f"Scalar multiplication: {c} * a = {c * a}")

# Dot product (inner product)
dot_product = np.dot(a, b)  # or a @ b or np.inner(a, b)
print(f"Dot product: a . b = {dot_product}")  # 1*4 + 2*5 + 3*6 = 32

# Vector norms
# L1 norm (Manhattan distance)
l1_norm = np.linalg.norm(a, ord=1)
print(f"L1 norm: ||a||_1 = {l1_norm}")  # |1| + |2| + |3| = 6

# L2 norm (Euclidean distance)
l2_norm = np.linalg.norm(a, ord=2)
print(f"L2 norm: ||a||_2 = {l2_norm:.4f}")  # sqrt(1^2 + 2^2 + 3^2)

# Infinity norm
inf_norm = np.linalg.norm(a, ord=np.inf)
print(f"Infinity norm: ||a||_inf = {inf_norm}")  # max(|1|, |2|, |3|) = 3

# Vector normalization (unit vector)
unit_vector = a / np.linalg.norm(a)
print(f"Unit vector: {unit_vector}")
print(f"Norm of unit vector: {np.linalg.norm(unit_vector):.4f}")  # 1.0
```

### Vector Spaces and Subspaces

A vector space is a set of vectors that is closed under addition and scalar multiplication. In machine learning, data typically exists in high-dimensional vector spaces.

```python
# Linear combination
v1 = np.array([1, 0, 0])
v2 = np.array([0, 1, 0])
v3 = np.array([0, 0, 1])

# Any vector can be expressed as a linear combination of basis vectors
target = np.array([3, 4, 5])
# target = 3*v1 + 4*v2 + 5*v3
coefficients = np.array([3, 4, 5])
reconstructed = coefficients[0]*v1 + coefficients[1]*v2 + coefficients[2]*v3
print(f"Linear combination reconstruction: {reconstructed}")

# Linear independence test
# If the rank of the matrix equals the number of vectors, the vectors are linearly independent
vectors = np.array([[1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]])
rank = np.linalg.matrix_rank(vectors)
print(f"Matrix rank: {rank}")
print(f"Vectors are {'linearly independent' if rank == 3 else 'linearly dependent'}")
```

### Basis and Dimension

A basis is a set of linearly independent vectors in a vector space that spans the entire space.

```python
# Standard basis (orthogonal basis)
e1 = np.array([1, 0])
e2 = np.array([0, 1])

# Non-standard basis
b1 = np.array([1, 1])
b2 = np.array([1, -1])

# Verify that b1, b2 can serve as a basis for R^2
basis_matrix = np.column_stack([b1, b2])
print(f"Basis matrix:\n{basis_matrix}")
print(f"Rank of basis matrix: {np.linalg.matrix_rank(basis_matrix)}")

# Coordinate transformation: convert coordinates from standard basis to new basis
point_standard = np.array([3, 1])  # coordinates in standard basis

# Find coordinates in new basis: solve basis_matrix @ coords = point_standard
coords_new_basis = np.linalg.solve(basis_matrix, point_standard)
print(f"Coordinates in standard basis: {point_standard}")
print(f"Coordinates in new basis: {coords_new_basis}")

# Verification: reconstruct original vector using new coordinates and new basis
reconstructed = coords_new_basis[0] * b1 + coords_new_basis[1] * b2
print(f"Reconstruction verification: {reconstructed}")
```

### Orthogonality and Orthogonal Bases

Orthogonality is very important in machine learning; orthogonal bases make many computations simpler.

```python
# Check if vectors are orthogonal
def are_orthogonal(v1, v2, tolerance=1e-10):
    """Check if two vectors are orthogonal"""
    return abs(np.dot(v1, v2)) < tolerance

a = np.array([1, 0, 0])
b = np.array([0, 1, 0])
c = np.array([1, 1, 0])

print(f"a and b orthogonal: {are_orthogonal(a, b)}")  # True
print(f"a and c orthogonal: {are_orthogonal(a, c)}")  # False

# Gram-Schmidt orthogonalization
def gram_schmidt(vectors):
    """Gram-Schmidt orthogonalization process"""
    orthogonal = []
    for v in vectors:
        # Subtract projections onto existing orthogonal vectors
        for u in orthogonal:
            v = v - (np.dot(v, u) / np.dot(u, u)) * u
        if np.linalg.norm(v) > 1e-10:  # non-zero vector
            orthogonal.append(v)
    return np.array(orthogonal)

# Orthogonalize a set of vectors
vectors = np.array([[1, 1, 0],
                    [1, 0, 1],
                    [0, 1, 1]], dtype=float)
orthogonal_vectors = gram_schmidt(vectors)
print(f"Orthogonalized vectors:\n{orthogonal_vectors}")

# Verify orthogonality
print(f"v1.v2 = {np.dot(orthogonal_vectors[0], orthogonal_vectors[1]):.10f}")
print(f"v1.v3 = {np.dot(orthogonal_vectors[0], orthogonal_vectors[2]):.10f}")
print(f"v2.v3 = {np.dot(orthogonal_vectors[1], orthogonal_vectors[2]):.10f}")

# Orthonormalization (orthonormal basis)
orthonormal_vectors = orthogonal_vectors / np.linalg.norm(orthogonal_vectors, axis=1, keepdims=True)
print(f"Orthonormalized vectors:\n{orthonormal_vectors}")
```

## Matrix Operations

### Matrix Basics

In machine learning, matrices are used to represent datasets (one sample per row), weight parameters, transformations, etc.

```python
# Matrix creation
A = np.array([[1, 2, 3],
              [4, 5, 6]])
print(f"Matrix A:\n{A}")
print(f"Shape: {A.shape}")  # (2, 3) - 2 rows, 3 columns

# Special matrices
identity = np.eye(3)  # Identity matrix
zeros = np.zeros((2, 3))  # Zero matrix
ones = np.ones((2, 3))  # All-ones matrix
diag = np.diag([1, 2, 3])  # Diagonal matrix

print(f"Identity matrix:\n{identity}")
print(f"Diagonal matrix:\n{diag}")

# Basic matrix properties
A = np.array([[1, 2], [3, 4], [5, 6]])
print(f"Transpose A^T:\n{A.T}")
print(f"Trace trace(A^T A): {np.trace(A.T @ A)}")  # Sum of diagonal elements
```

### Matrix Multiplication

Matrix multiplication is the most fundamental operation in machine learning.

```python
# Matrix multiplication
A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])

# Matrix multiplication (three equivalent notations)
C1 = np.dot(A, B)
C2 = A @ B
C3 = np.matmul(A, B)
print(f"Matrix multiplication AB:\n{C1}")

# Note: Matrix multiplication is not commutative
print(f"BA:\n{B @ A}")
print(f"AB == BA: {np.allclose(A @ B, B @ A)}")  # False

# Element-wise multiplication (Hadamard product)
hadamard = A * B
print(f"Hadamard product:\n{hadamard}")

# Matrix-vector multiplication
x = np.array([1, 2])
y = A @ x  # Matrix left-multiplies vector
print(f"Ax = {y}")

# Batch matrix-vector multiplication (common in machine learning)
# Multiple samples simultaneously transformed by a linear transformation
samples = np.array([[1, 2],
                    [3, 4],
                    [5, 6]])  # 3 samples, each 2-dimensional
W = np.array([[0.5, -0.5],
              [0.3, 0.7]])  # Weight matrix
# Each sample x is transformed to Wx
transformed = samples @ W.T  # (3, 2) @ (2, 2).T = (3, 2)
print(f"Batch transformation result:\n{transformed}")
```

### Matrix Inverse and Pseudo-inverse

```python
# Inverse of a square matrix
A = np.array([[1, 2],
              [3, 4]])

# Check if invertible (determinant is non-zero)
det_A = np.linalg.det(A)
print(f"Determinant det(A) = {det_A}")

if abs(det_A) > 1e-10:
    A_inv = np.linalg.inv(A)
    print(f"Inverse matrix A^(-1):\n{A_inv}")

    # Verify A @ A_inv = I
    print(f"A @ A^(-1):\n{A @ A_inv}")

# Moore-Penrose pseudo-inverse (for non-square and singular matrices)
B = np.array([[1, 2],
              [3, 4],
              [5, 6]])  # 3x2 matrix, not invertible

B_pinv = np.linalg.pinv(B)
print(f"Pseudo-inverse B^+:\n{B_pinv}")
print(f"Shape of B^+: {B_pinv.shape}")  # (2, 3)

# Property of pseudo-inverse: B @ B^+ @ B = B
print(f"B @ B^+ @ B:\n{B @ B_pinv @ B}")
```

### Matrix Decomposition Basics

```python
# LU decomposition
from scipy.linalg import lu

A = np.array([[2, 1, 1],
              [4, 3, 3],
              [8, 7, 9]], dtype=float)

P, L, U = lu(A)
print(f"P (permutation matrix):\n{P}")
print(f"L (lower triangular):\n{L}")
print(f"U (upper triangular):\n{U}")
print(f"Verify P @ L @ U = A:\n{P @ L @ U}")

# QR decomposition
A = np.array([[1, 2],
              [3, 4],
              [5, 6]], dtype=float)

Q, R = np.linalg.qr(A)
print(f"Q (orthogonal matrix):\n{Q}")
print(f"R (upper triangular matrix):\n{R}")
print(f"Verify Q @ R = A:\n{Q @ R}")

# Verify orthogonality of Q
print(f"Q^T @ Q:\n{Q.T @ Q}")  # Should be close to identity matrix
```

### Matrix Rank and Null Space

```python
# Matrix rank
A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])

rank = np.linalg.matrix_rank(A)
print(f"Matrix A:\n{A}")
print(f"Rank: {rank}")  # 2, because the third row is a linear combination of the first two

# Full rank matrix
B = np.array([[1, 0, 0],
              [0, 2, 0],
              [0, 0, 3]])
print(f"Rank of matrix B: {np.linalg.matrix_rank(B)}")  # 3

# Null space (kernel) - all x satisfying Ax = 0
# Using SVD to compute null space
def null_space(A, tol=1e-10):
    """Compute the null space of a matrix"""
    U, S, Vh = np.linalg.svd(A)
    null_mask = (S <= tol)
    null = Vh[null_mask].T
    return null

A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])
null = null_space(A)
if null.size > 0:
    print(f"Null space basis:\n{null}")
    # Verify A @ null approximately equals 0
    print(f"A @ null:\n{A @ null}")
```

## Linear Transformations

### Concept of Linear Transformations

A linear transformation is a mapping that preserves vector addition and scalar multiplication, and can be represented by a matrix.

```python
# Linear transformation examples
import matplotlib.pyplot as plt

def plot_transformation(A, title):
    """Visualize 2D linear transformation"""
    # Original vectors
    vectors = np.array([[1, 0], [0, 1], [1, 1], [-1, 1]])

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # Original vectors
    ax1 = axes[0]
    ax1.set_xlim(-3, 3)
    ax1.set_ylim(-3, 3)
    ax1.axhline(y=0, color='k', linewidth=0.5)
    ax1.axvline(x=0, color='k', linewidth=0.5)
    ax1.grid(True, alpha=0.3)
    for v in vectors:
        ax1.arrow(0, 0, v[0], v[1], head_width=0.1, head_length=0.1, fc='blue', ec='blue')
    ax1.set_title('Original Vectors')
    ax1.set_aspect('equal')

    # Transformed vectors
    ax2 = axes[1]
    ax2.set_xlim(-3, 3)
    ax2.set_ylim(-3, 3)
    ax2.axhline(y=0, color='k', linewidth=0.5)
    ax2.axvline(x=0, color='k', linewidth=0.5)
    ax2.grid(True, alpha=0.3)
    for v in vectors:
        tv = A @ v
        ax2.arrow(0, 0, tv[0], tv[1], head_width=0.1, head_length=0.1, fc='red', ec='red')
    ax2.set_title(f'After Transformation ({title})')
    ax2.set_aspect('equal')

    plt.tight_layout()
    plt.savefig(f'transform_{title}.png', dpi=100, bbox_inches='tight')
    plt.close()

# Scaling transformation
scale = np.array([[2, 0],
                  [0, 0.5]])
print(f"Scaling matrix:\n{scale}")

# Rotation transformation (counterclockwise 45 degrees)
theta = np.pi / 4
rotation = np.array([[np.cos(theta), -np.sin(theta)],
                     [np.sin(theta), np.cos(theta)]])
print(f"Rotation matrix (45 degrees):\n{rotation}")

# Shear transformation
shear = np.array([[1, 0.5],
                  [0, 1]])
print(f"Shear matrix:\n{shear}")

# Reflection transformation (about x-axis)
reflection = np.array([[1, 0],
                       [0, -1]])
print(f"Reflection matrix:\n{reflection}")

# Projection transformation (onto x-axis)
projection = np.array([[1, 0],
                       [0, 0]])
print(f"Projection matrix:\n{projection}")
```

### Composition of Transformations

```python
# Composition of transformations is implemented through matrix multiplication
# First rotate 45 degrees, then scale

theta = np.pi / 4
R = np.array([[np.cos(theta), -np.sin(theta)],
              [np.sin(theta), np.cos(theta)]])

S = np.array([[2, 0],
              [0, 0.5]])

# Composite transformation: first R then S, matrices apply from right to left
# T = S @ R means: first apply R, then apply S
T = S @ R
print(f"Composite transformation matrix T = S @ R:\n{T}")

# Verification
v = np.array([1, 0])
v_rotated = R @ v
v_final = S @ v_rotated
v_combined = T @ v
print(f"Step-by-step transformation result: {v_final}")
print(f"Composite transformation result: {v_combined}")
print(f"Results are identical: {np.allclose(v_final, v_combined)}")
```

### Applications of Linear Transformations in Machine Learning

```python
# Linear layer in neural networks
def linear_layer(X, W, b):
    """
    Linear layer: Y = XW^T + b
    X: (batch_size, input_dim) input data
    W: (output_dim, input_dim) weight matrix
    b: (output_dim,) bias vector
    """
    return X @ W.T + b

# Example: 3 samples, 4-dimensional input, 2-dimensional output
np.random.seed(42)
X = np.random.randn(3, 4)  # 3 samples, 4 features
W = np.random.randn(2, 4)  # output 2-dimensional
b = np.random.randn(2)     # bias

Y = linear_layer(X, W, b)
print(f"Input shape: {X.shape}")
print(f"Output shape: {Y.shape}")
print(f"Output:\n{Y}")

# Data standardization is also a linear transformation
def standardize(X):
    """Z-score standardization"""
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    return (X - mean) / std

X_std = standardize(X)
print(f"Mean after standardization: {X_std.mean(axis=0)}")  # close to 0
print(f"Standard deviation after standardization: {X_std.std(axis=0)}")  # close to 1
```

## Eigenvalues and Eigenvectors

### Concept of Eigenvalue Decomposition

Eigenvalues and eigenvectors are key to understanding matrices. For a square matrix A, if there exists a non-zero vector v and a scalar lambda such that:

$$Av = \lambda v$$

then lambda is an eigenvalue and v is the corresponding eigenvector.

```python
# Compute eigenvalues and eigenvectors
A = np.array([[4, 2],
              [1, 3]])

eigenvalues, eigenvectors = np.linalg.eig(A)
print(f"Matrix A:\n{A}")
print(f"Eigenvalues: {eigenvalues}")
print(f"Eigenvectors:\n{eigenvectors}")

# Verify Av = lambda*v
for i in range(len(eigenvalues)):
    lam = eigenvalues[i]
    v = eigenvectors[:, i]
    Av = A @ v
    lam_v = lam * v
    print(f"\nEigenvalue lambda{i+1} = {lam:.4f}")
    print(f"Eigenvector v{i+1} = {v}")
    print(f"Av = {Av}")
    print(f"lambda*v = {lam_v}")
    print(f"Verification passed: {np.allclose(Av, lam_v)}")
```

### Geometric Meaning of Eigenvalues

```python
# Eigenvectors represent the principal directions of the transformation
# Eigenvalues represent the scaling factor in that direction

def visualize_eigenvectors(A):
    """Visualize eigenvectors"""
    eigenvalues, eigenvectors = np.linalg.eig(A)

    # Generate points on a circle
    theta = np.linspace(0, 2*np.pi, 100)
    circle = np.array([np.cos(theta), np.sin(theta)])

    # Transformed ellipse
    ellipse = A @ circle

    plt.figure(figsize=(10, 5))

    # Original circle and transformed ellipse
    plt.subplot(1, 2, 1)
    plt.plot(circle[0], circle[1], 'b-', label='Original unit circle')
    plt.plot(ellipse[0], ellipse[1], 'r-', label='After transformation')

    # Draw eigenvectors
    for i in range(len(eigenvalues)):
        v = eigenvectors[:, i].real
        lam = eigenvalues[i].real
        plt.arrow(0, 0, v[0], v[1], head_width=0.1, head_length=0.05,
                  fc='green', ec='green', linewidth=2)
        plt.arrow(0, 0, lam*v[0], lam*v[1], head_width=0.1, head_length=0.05,
                  fc='orange', ec='orange', linewidth=2, linestyle='--')

    plt.xlim(-4, 4)
    plt.ylim(-4, 4)
    plt.grid(True, alpha=0.3)
    plt.axis('equal')
    plt.legend()
    plt.title('Geometric Meaning of Eigenvectors')

    plt.subplot(1, 2, 2)
    # Display matrix information
    info = f"Matrix A:\n{A}\n\n"
    info += f"Eigenvalues:\nlambda1 = {eigenvalues[0]:.3f}\nlambda2 = {eigenvalues[1]:.3f}\n\n"
    info += f"Eigenvectors:\nv1 = {eigenvectors[:, 0]}\nv2 = {eigenvectors[:, 1]}"
    plt.text(0.1, 0.5, info, fontsize=12, family='monospace',
             transform=plt.gca().transAxes, verticalalignment='center')
    plt.axis('off')

    plt.tight_layout()
    plt.savefig('eigenvectors_visualization.png', dpi=100, bbox_inches='tight')
    plt.close()

# Example
A = np.array([[3, 1],
              [1, 3]])
# visualize_eigenvectors(A)
eigenvalues, eigenvectors = np.linalg.eig(A)
print(f"Eigenvalues: {eigenvalues}")  # [4, 2]
print(f"Eigenvectors:\n{eigenvectors}")
```

### Eigenvalue Decomposition of Symmetric Matrices

Symmetric matrices are very common in machine learning (e.g., covariance matrices) and have nice properties.

```python
# Eigenvalue decomposition of symmetric matrices
# Eigenvalues of symmetric matrices are all real, and eigenvectors are orthogonal

# Create a symmetric matrix (covariance matrix)
np.random.seed(42)
X = np.random.randn(100, 3)  # 100 samples, 3 features
cov_matrix = np.cov(X.T)
print(f"Covariance matrix:\n{cov_matrix}")
print(f"Is symmetric: {np.allclose(cov_matrix, cov_matrix.T)}")

# Eigenvalue decomposition
eigenvalues, eigenvectors = np.linalg.eigh(cov_matrix)  # eigh is for symmetric matrices
print(f"\nEigenvalues: {eigenvalues}")
print(f"Eigenvectors:\n{eigenvectors}")

# Verify eigenvectors are orthogonal
print(f"\nOrthogonality verification (V^T V):\n{eigenvectors.T @ eigenvectors}")

# Spectral decomposition: A = V @ diag(lambda) @ V^T
Lambda = np.diag(eigenvalues)
A_reconstructed = eigenvectors @ Lambda @ eigenvectors.T
print(f"\nSpectral decomposition reconstruction error: {np.linalg.norm(cov_matrix - A_reconstructed):.2e}")
```

### Applications of Eigenvalues in Machine Learning

```python
# Check positive definiteness of a matrix (important in optimization problems)
def is_positive_definite(A):
    """Check if a matrix is positive definite"""
    try:
        eigenvalues = np.linalg.eigvalsh(A)
        return np.all(eigenvalues > 0)
    except:
        return False

# Positive definite matrix example
A_pd = np.array([[2, -1],
                 [-1, 2]])
print(f"Matrix A is positive definite: {is_positive_definite(A_pd)}")
print(f"Eigenvalues: {np.linalg.eigvalsh(A_pd)}")  # all positive

# Condition number (numerical stability)
def condition_number(A):
    """Compute the condition number of a matrix"""
    eigenvalues = np.abs(np.linalg.eigvals(A))
    return np.max(eigenvalues) / np.min(eigenvalues)

A = np.array([[1, 2],
              [1.001, 2]])  # ill-conditioned matrix
print(f"\nCondition number: {condition_number(A):.2f}")
print(f"NumPy condition number: {np.linalg.cond(A):.2f}")

# Power iteration method for largest eigenvalue
def power_iteration(A, num_iterations=100):
    """Power iteration method for largest eigenvalue and corresponding eigenvector"""
    n = A.shape[0]
    v = np.random.rand(n)
    v = v / np.linalg.norm(v)

    for _ in range(num_iterations):
        Av = A @ v
        v = Av / np.linalg.norm(Av)

    eigenvalue = v @ A @ v
    return eigenvalue, v

A = np.array([[4, 2],
              [1, 3]])
max_eigenvalue, max_eigenvector = power_iteration(A)
print(f"\nPower iteration result:")
print(f"Largest eigenvalue: {max_eigenvalue:.4f}")
print(f"Corresponding eigenvector: {max_eigenvector}")

# Verification
true_eigenvalues = np.linalg.eigvals(A)
print(f"True largest eigenvalue: {np.max(true_eigenvalues):.4f}")
```

## Eigenvalue Decomposition (EVD)

### Definition of Eigenvalue Decomposition

For a diagonalizable square matrix A, eigenvalue decomposition is expressed as:

$$A = V \Lambda V^{-1}$$

where V is the eigenvector matrix and Lambda is the diagonal matrix of eigenvalues.

```python
# Eigenvalue decomposition
A = np.array([[4, 2],
              [1, 3]])

eigenvalues, V = np.linalg.eig(A)
Lambda = np.diag(eigenvalues)

print(f"Matrix A:\n{A}")
print(f"Eigenvalues Lambda:\n{Lambda}")
print(f"Eigenvector matrix V:\n{V}")

# Reconstruct A = V @ Lambda @ V^(-1)
V_inv = np.linalg.inv(V)
A_reconstructed = V @ Lambda @ V_inv
print(f"\nReconstructed A:\n{A_reconstructed.real}")
print(f"Reconstruction error: {np.linalg.norm(A - A_reconstructed):.2e}")
```

### Eigenvalue Decomposition of Symmetric Matrices

Eigenvalue decomposition of symmetric matrices is simpler because eigenvectors are orthogonal:

$$A = V \Lambda V^T$$

```python
# Eigenvalue decomposition of symmetric matrices
A = np.array([[4, 2, 0],
              [2, 5, 3],
              [0, 3, 6]])

print(f"Symmetric matrix A:\n{A}")
print(f"Verify symmetry: {np.allclose(A, A.T)}")

# Use eigh for symmetric matrix decomposition
eigenvalues, V = np.linalg.eigh(A)
Lambda = np.diag(eigenvalues)

print(f"\nEigenvalues: {eigenvalues}")
print(f"Eigenvector matrix V:\n{V}")

# Verify orthogonality V^T V = I
print(f"\nV^T V:\n{V.T @ V}")

# Reconstruct A = V Lambda V^T
A_reconstructed = V @ Lambda @ V.T
print(f"\nReconstruction error: {np.linalg.norm(A - A_reconstructed):.2e}")
```

### Matrix Power Operations

Eigenvalue decomposition makes matrix power operations simple:

$$A^n = V \Lambda^n V^{-1}$$

```python
# Matrix power operations
A = np.array([[2, 1],
              [1, 2]])

eigenvalues, V = np.linalg.eig(A)
V_inv = np.linalg.inv(V)

# Compute A^10
n = 10
Lambda_n = np.diag(eigenvalues ** n)
A_n = V @ Lambda_n @ V_inv

print(f"A^{n} (via eigenvalue decomposition):\n{A_n.real}")

# Verification
A_n_direct = np.linalg.matrix_power(A, n)
print(f"A^{n} (direct computation):\n{A_n_direct}")
print(f"Error: {np.linalg.norm(A_n - A_n_direct):.2e}")

# Matrix exponential e^A
def matrix_exp_via_evd(A):
    """Compute matrix exponential via eigenvalue decomposition"""
    eigenvalues, V = np.linalg.eig(A)
    exp_Lambda = np.diag(np.exp(eigenvalues))
    return V @ exp_Lambda @ np.linalg.inv(V)

from scipy.linalg import expm
A = np.array([[1, 2],
              [0, 3]])
print(f"\ne^A (eigenvalue decomposition):\n{matrix_exp_via_evd(A).real}")
print(f"e^A (scipy):\n{expm(A)}")
```

## Singular Value Decomposition (SVD)

### Definition of SVD

Singular Value Decomposition is the most important matrix decomposition in linear algebra, applicable to any matrix (including non-square matrices):

$$A = U \Sigma V^T$$

where:
- U: m x m orthogonal matrix (left singular vectors)
- Sigma: m x n diagonal matrix (singular values)
- V: n x n orthogonal matrix (right singular vectors)

```python
# SVD decomposition
A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9],
              [10, 11, 12]])

print(f"Original matrix A ({A.shape[0]}x{A.shape[1]}):\n{A}")

# Full SVD
U, S, Vt = np.linalg.svd(A)

print(f"\nU ({U.shape[0]}x{U.shape[1]}):\n{U}")
print(f"\nSingular values S: {S}")
print(f"\nVt ({Vt.shape[0]}x{Vt.shape[1]}):\n{Vt}")

# Reconstruct original matrix
# Need to convert S to a diagonal matrix
Sigma = np.zeros_like(A, dtype=float)
np.fill_diagonal(Sigma, S)
A_reconstructed = U @ Sigma @ Vt

print(f"\nReconstructed A:\n{A_reconstructed}")
print(f"Reconstruction error: {np.linalg.norm(A - A_reconstructed):.2e}")
```

### Compact SVD and Truncated SVD

```python
# Compact SVD (economy SVD)
A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9],
              [10, 11, 12]])

U, S, Vt = np.linalg.svd(A, full_matrices=False)
print(f"Compact SVD:")
print(f"U shape: {U.shape}")  # (4, 3)
print(f"S length: {len(S)}")   # 3
print(f"Vt shape: {Vt.shape}")  # (3, 3)

# Truncated SVD (keep top k singular values)
def truncated_svd(A, k):
    """Truncated SVD: keep top k singular values"""
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    return U[:, :k], S[:k], Vt[:k, :]

# Use truncated SVD for low-rank approximation
k = 2
U_k, S_k, Vt_k = truncated_svd(A, k)
A_approx = U_k @ np.diag(S_k) @ Vt_k

print(f"\nRank-{k} approximation:")
print(f"Approximation matrix:\n{A_approx}")
print(f"Approximation error: {np.linalg.norm(A - A_approx):.4f}")
print(f"Original matrix rank: {np.linalg.matrix_rank(A)}")
```

### Relationship Between SVD and Eigenvalue Decomposition

```python
# Relationship between SVD and eigenvalue decomposition
A = np.array([[1, 2],
              [3, 4],
              [5, 6]])

U, S, Vt = np.linalg.svd(A)

# Eigenvalue decomposition of A^T A
AtA = A.T @ A
eigenvalues_AtA, eigenvectors_AtA = np.linalg.eigh(AtA)

print("Eigenvalue decomposition of A^T A:")
print(f"Eigenvalues: {np.sort(eigenvalues_AtA)[::-1]}")
print(f"Squared singular values: {S ** 2}")
print(f"Relationship: singular values = sqrt(eigenvalues)")

# Eigenvalue decomposition of A A^T
AAt = A @ A.T
eigenvalues_AAt, eigenvectors_AAt = np.linalg.eigh(AAt)

print(f"\nNon-zero eigenvalues of A A^T: {np.sort(eigenvalues_AAt)[::-1][:2]}")
print(f"Same as eigenvalues of A^T A")

# V is the eigenvectors of A^T A
print(f"\nVt.T (V):\n{Vt.T}")
# Note: signs may differ, but directions are the same
```

### Geometric Meaning of SVD

```python
# Geometric meaning of SVD: any linear transformation can be decomposed into rotation-scaling-rotation
def visualize_svd(A):
    """Visualize the geometric meaning of SVD"""
    U, S, Vt = np.linalg.svd(A)

    # Generate points on a unit circle
    theta = np.linspace(0, 2*np.pi, 100)
    circle = np.array([np.cos(theta), np.sin(theta)])

    fig, axes = plt.subplots(1, 4, figsize=(16, 4))

    # Step 1: Original unit circle
    axes[0].plot(circle[0], circle[1], 'b-', linewidth=2)
    axes[0].set_xlim(-3, 3)
    axes[0].set_ylim(-3, 3)
    axes[0].set_aspect('equal')
    axes[0].grid(True, alpha=0.3)
    axes[0].set_title('Step 1: Unit Circle')

    # Step 2: V^T rotation
    rotated = Vt @ circle
    axes[1].plot(rotated[0], rotated[1], 'g-', linewidth=2)
    axes[1].set_xlim(-3, 3)
    axes[1].set_ylim(-3, 3)
    axes[1].set_aspect('equal')
    axes[1].grid(True, alpha=0.3)
    axes[1].set_title('Step 2: V^T Rotation')

    # Step 3: Sigma scaling
    Sigma = np.diag(S)
    scaled = Sigma @ rotated
    axes[2].plot(scaled[0], scaled[1], 'm-', linewidth=2)
    axes[2].set_xlim(-3, 3)
    axes[2].set_ylim(-3, 3)
    axes[2].set_aspect('equal')
    axes[2].grid(True, alpha=0.3)
    axes[2].set_title('Step 3: Sigma Scaling')

    # Step 4: U rotation (final result)
    final = U @ scaled
    axes[3].plot(final[0], final[1], 'r-', linewidth=2)
    axes[3].set_xlim(-3, 3)
    axes[3].set_ylim(-3, 3)
    axes[3].set_aspect('equal')
    axes[3].grid(True, alpha=0.3)
    axes[3].set_title('Step 4: U Rotation (Final)')

    plt.tight_layout()
    plt.savefig('svd_geometry.png', dpi=100, bbox_inches='tight')
    plt.close()

A = np.array([[2, 1],
              [1, 2]])
# visualize_svd(A)

# Verify decomposition
U, S, Vt = np.linalg.svd(A)
print(f"Matrix A:\n{A}")
print(f"Singular values: {S}")
print(f"U (rotation):\n{U}")
print(f"V^T (rotation):\n{Vt}")
```

### Applications of SVD

```python
# Image compression
def compress_image(image, k):
    """Compress image using SVD"""
    # Perform SVD on each color channel
    compressed = np.zeros_like(image, dtype=float)

    for channel in range(3):  # RGB
        U, S, Vt = np.linalg.svd(image[:, :, channel], full_matrices=False)
        compressed[:, :, channel] = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]

    return np.clip(compressed, 0, 255).astype(np.uint8)

# Simulate image compression
np.random.seed(42)
fake_image = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
compressed = compress_image(fake_image, k=20)

# Calculate compression ratio
original_size = 100 * 100 * 3
compressed_size = 3 * (100 * 20 + 20 + 20 * 100)  # U, S, Vt
print(f"Image compression example:")
print(f"Original size: {original_size}")
print(f"Compressed size: {compressed_size}")
print(f"Compression ratio: {original_size / compressed_size:.2f}x")

# Pseudo-inverse computation
def pseudo_inverse_via_svd(A, tol=1e-10):
    """Compute pseudo-inverse via SVD"""
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    # Take reciprocal of non-zero singular values
    S_inv = np.where(S > tol, 1/S, 0)
    return Vt.T @ np.diag(S_inv) @ U.T

A = np.array([[1, 2],
              [3, 4],
              [5, 6]])
A_pinv_svd = pseudo_inverse_via_svd(A)
A_pinv_numpy = np.linalg.pinv(A)
print(f"\nPseudo-inverse (SVD):\n{A_pinv_svd}")
print(f"Pseudo-inverse (NumPy):\n{A_pinv_numpy}")
print(f"Error: {np.linalg.norm(A_pinv_svd - A_pinv_numpy):.2e}")

# Least squares solution
def least_squares_svd(A, b):
    """Solve least squares problem min ||Ax - b|| via SVD"""
    A_pinv = pseudo_inverse_via_svd(A)
    return A_pinv @ b

A = np.array([[1, 1],
              [1, 2],
              [1, 3]])
b = np.array([1, 2, 2])
x_svd = least_squares_svd(A, b)
x_lstsq = np.linalg.lstsq(A, b, rcond=None)[0]
print(f"\nLeast squares solution (SVD): {x_svd}")
print(f"Least squares solution (lstsq): {x_lstsq}")
```

## Mathematical Principles of PCA

### PCA Overview

Principal Component Analysis (PCA) is the most commonly used dimensionality reduction method. Its mathematical essence is finding the directions of maximum variance in the data through eigenvalue decomposition or SVD.

```python
# Mathematical derivation of PCA
np.random.seed(42)

# Generate correlated data
n_samples = 200
mean = [0, 0]
cov = [[1, 0.8], [0.8, 1]]  # correlated 2D data
X = np.random.multivariate_normal(mean, cov, n_samples)

print(f"Data shape: {X.shape}")
print(f"Data mean: {X.mean(axis=0)}")
print(f"Data covariance:\n{np.cov(X.T)}")
```

### PCA via Covariance Matrix Method

```python
def pca_covariance(X, n_components):
    """
    Implement PCA via eigenvalue decomposition of covariance matrix

    Steps:
    1. Center the data
    2. Compute covariance matrix
    3. Perform eigenvalue decomposition on covariance matrix
    4. Select top k principal components
    """
    # 1. Center the data
    X_centered = X - X.mean(axis=0)

    # 2. Compute covariance matrix
    n = X.shape[0]
    cov_matrix = (X_centered.T @ X_centered) / (n - 1)

    # 3. Eigenvalue decomposition
    eigenvalues, eigenvectors = np.linalg.eigh(cov_matrix)

    # 4. Sort by eigenvalues in descending order
    idx = np.argsort(eigenvalues)[::-1]
    eigenvalues = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    # 5. Select top k principal components
    components = eigenvectors[:, :n_components]

    # 6. Project onto new space
    X_pca = X_centered @ components

    # Compute explained variance ratio
    explained_variance_ratio = eigenvalues / eigenvalues.sum()

    return X_pca, components, eigenvalues, explained_variance_ratio

# Apply PCA
X_pca, components, eigenvalues, var_ratio = pca_covariance(X, n_components=2)

print("PCA results (covariance matrix method):")
print(f"Principal components:\n{components}")
print(f"Eigenvalues: {eigenvalues}")
print(f"Explained variance ratio: {var_ratio}")
print(f"Cumulative explained variance: {np.cumsum(var_ratio)}")
```

### PCA via SVD Method

```python
def pca_svd(X, n_components):
    """
    Implement PCA via SVD

    Advantages:
    1. More numerically stable
    2. No need to explicitly compute covariance matrix
    3. More computationally efficient (especially for high-dimensional data)
    """
    # 1. Center the data
    X_centered = X - X.mean(axis=0)

    # 2. SVD decomposition
    U, S, Vt = np.linalg.svd(X_centered, full_matrices=False)

    # 3. Principal components are the columns of V
    components = Vt.T[:, :n_components]

    # 4. Projection (can use U and S directly)
    X_pca = U[:, :n_components] * S[:n_components]
    # or X_pca = X_centered @ components

    # 5. Compute explained variance
    n = X.shape[0]
    explained_variance = (S ** 2) / (n - 1)
    explained_variance_ratio = explained_variance / explained_variance.sum()

    return X_pca, components, explained_variance[:n_components], explained_variance_ratio

# Apply SVD-PCA
X_pca_svd, components_svd, var_svd, var_ratio_svd = pca_svd(X, n_components=2)

print("\nPCA results (SVD method):")
print(f"Principal components:\n{components_svd}")
print(f"Explained variance: {var_svd}")
print(f"Explained variance ratio: {var_ratio_svd}")

# Verify both methods give consistent results
print(f"\nPrincipal components from both methods are consistent: {np.allclose(np.abs(components), np.abs(components_svd))}")
```

### Implementing PCA with scikit-learn

```python
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# Standardize data (optional but recommended)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Use sklearn PCA
pca = PCA(n_components=2)
X_pca_sklearn = pca.fit_transform(X)

print("sklearn PCA results:")
print(f"Principal components:\n{pca.components_.T}")
print(f"Explained variance: {pca.explained_variance_}")
print(f"Explained variance ratio: {pca.explained_variance_ratio_}")
print(f"Cumulative explained variance: {np.cumsum(pca.explained_variance_ratio_)}")

# Reconstruct data
X_reconstructed = pca.inverse_transform(X_pca_sklearn)
reconstruction_error = np.mean((X - X_reconstructed) ** 2)
print(f"Reconstruction error: {reconstruction_error:.6f}")
```

### PCA Visualization

```python
def visualize_pca(X, X_pca, components, title="PCA Visualization"):
    """Visualize PCA results"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Original data and principal component directions
    ax1 = axes[0]
    ax1.scatter(X[:, 0], X[:, 1], alpha=0.5, s=20)

    # Draw principal component directions
    mean = X.mean(axis=0)
    for i, (comp, var) in enumerate(zip(components.T, [2, 1])):
        ax1.arrow(mean[0], mean[1], comp[0]*var, comp[1]*var,
                  head_width=0.1, head_length=0.05, fc=f'C{i+1}', ec=f'C{i+1}',
                  linewidth=2, label=f'PC{i+1}')

    ax1.set_xlabel('X1')
    ax1.set_ylabel('X2')
    ax1.set_title('Original Data and Principal Component Directions')
    ax1.legend()
    ax1.axis('equal')
    ax1.grid(True, alpha=0.3)

    # Projected data
    ax2 = axes[1]
    ax2.scatter(X_pca[:, 0], X_pca[:, 1] if X_pca.shape[1] > 1 else np.zeros_like(X_pca[:, 0]),
                alpha=0.5, s=20)
    ax2.axhline(y=0, color='k', linewidth=0.5)
    ax2.axvline(x=0, color='k', linewidth=0.5)
    ax2.set_xlabel('PC1')
    ax2.set_ylabel('PC2')
    ax2.set_title('Data After PCA Projection')
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('pca_visualization.png', dpi=100, bbox_inches='tight')
    plt.close()

# visualize_pca(X, X_pca, components)
print("PCA visualization saved")
```

### Selecting the Number of Principal Components

```python
def select_n_components(X, variance_threshold=0.95):
    """Select number of principal components based on explained variance"""
    pca = PCA()
    pca.fit(X)

    cumsum = np.cumsum(pca.explained_variance_ratio_)
    n_components = np.argmax(cumsum >= variance_threshold) + 1

    return n_components, cumsum

# High-dimensional data example
np.random.seed(42)
X_high = np.random.randn(500, 50)  # 50-dimensional data

n_comp, cumsum = select_n_components(X_high, variance_threshold=0.95)
print(f"Number of components needed to retain 95% variance: {n_comp}")

# Visualization
plt.figure(figsize=(10, 5))
plt.subplot(1, 2, 1)
pca_full = PCA().fit(X_high)
plt.bar(range(1, len(pca_full.explained_variance_ratio_) + 1),
        pca_full.explained_variance_ratio_)
plt.xlabel('Principal Component')
plt.ylabel('Explained Variance Ratio')
plt.title('Explained Variance by Each Component')

plt.subplot(1, 2, 2)
plt.plot(range(1, len(cumsum) + 1), cumsum, 'bo-')
plt.axhline(y=0.95, color='r', linestyle='--', label='95% threshold')
plt.axvline(x=n_comp, color='g', linestyle='--', label=f'n={n_comp}')
plt.xlabel('Number of Components')
plt.ylabel('Cumulative Explained Variance')
plt.title('Cumulative Explained Variance Curve')
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('pca_variance_explained.png', dpi=100, bbox_inches='tight')
plt.close()
```

### PCA Application: Dimensionality Reduction and Visualization

```python
from sklearn.datasets import load_iris

# Load Iris dataset
iris = load_iris()
X_iris = iris.data  # (150, 4)
y_iris = iris.target

print(f"Iris data shape: {X_iris.shape}")
print(f"Feature names: {iris.feature_names}")

# PCA reduction to 2D
pca_iris = PCA(n_components=2)
X_iris_pca = pca_iris.fit_transform(X_iris)

print(f"\nShape after PCA reduction: {X_iris_pca.shape}")
print(f"Explained variance ratio: {pca_iris.explained_variance_ratio_}")
print(f"Cumulative explained variance: {sum(pca_iris.explained_variance_ratio_):.4f}")

# Visualization
plt.figure(figsize=(10, 8))
scatter = plt.scatter(X_iris_pca[:, 0], X_iris_pca[:, 1],
                      c=y_iris, cmap='viridis', alpha=0.7)
plt.colorbar(scatter, label='Class')
plt.xlabel(f'PC1 ({pca_iris.explained_variance_ratio_[0]:.2%})')
plt.ylabel(f'PC2 ({pca_iris.explained_variance_ratio_[1]:.2%})')
plt.title('Iris Dataset PCA Visualization')
plt.grid(True, alpha=0.3)
plt.savefig('iris_pca.png', dpi=100, bbox_inches='tight')
plt.close()

# View the meaning of principal components (feature weights)
print("\nFeature weights of principal components:")
for i, (comp, var) in enumerate(zip(pca_iris.components_,
                                     pca_iris.explained_variance_ratio_)):
    print(f"\nPC{i+1} (explained variance: {var:.2%}):")
    for feat, weight in zip(iris.feature_names, comp):
        print(f"  {feat}: {weight:.4f}")
```

## NumPy Linear Algebra Implementation

### Complete Matrix Decomposition Toolkit

```python
class LinearAlgebraToolkit:
    """Linear Algebra Toolkit"""

    @staticmethod
    def gram_schmidt(vectors):
        """Gram-Schmidt orthogonalization"""
        n, m = vectors.shape
        orthogonal = np.zeros_like(vectors, dtype=float)

        for i in range(m):
            v = vectors[:, i].astype(float)
            for j in range(i):
                u = orthogonal[:, j]
                v = v - (np.dot(v, u) / np.dot(u, u)) * u
            orthogonal[:, i] = v

        # Normalize
        norms = np.linalg.norm(orthogonal, axis=0)
        orthonormal = orthogonal / norms
        return orthonormal

    @staticmethod
    def power_iteration(A, num_iterations=100, tol=1e-10):
        """Power iteration for largest eigenvalue"""
        n = A.shape[0]
        v = np.random.rand(n)
        v = v / np.linalg.norm(v)

        eigenvalue_old = 0
        for i in range(num_iterations):
            Av = A @ v
            v_new = Av / np.linalg.norm(Av)
            eigenvalue = v_new @ A @ v_new

            if abs(eigenvalue - eigenvalue_old) < tol:
                break
            eigenvalue_old = eigenvalue
            v = v_new

        return eigenvalue, v

    @staticmethod
    def qr_iteration(A, num_iterations=100, tol=1e-10):
        """QR iteration for all eigenvalues"""
        Ak = A.copy().astype(float)
        n = A.shape[0]

        for _ in range(num_iterations):
            Q, R = np.linalg.qr(Ak)
            Ak_new = R @ Q

            # Check convergence (lower triangle approaches 0)
            off_diag = np.sum(np.abs(np.tril(Ak_new, -1)))
            if off_diag < tol:
                break
            Ak = Ak_new

        return np.diag(Ak_new)

    @staticmethod
    def svd_via_evd(A):
        """Compute SVD via eigenvalue decomposition"""
        AtA = A.T @ A
        AAt = A @ A.T

        # V comes from A^T A
        eigenvalues_AtA, V = np.linalg.eigh(AtA)
        idx = np.argsort(eigenvalues_AtA)[::-1]
        eigenvalues_AtA = eigenvalues_AtA[idx]
        V = V[:, idx]

        # Singular values
        S = np.sqrt(np.maximum(eigenvalues_AtA, 0))

        # U comes from A A^T
        eigenvalues_AAt, U = np.linalg.eigh(AAt)
        idx = np.argsort(eigenvalues_AAt)[::-1]
        U = U[:, idx]

        return U, S, V.T

# Usage examples
toolkit = LinearAlgebraToolkit()

# Gram-Schmidt orthogonalization
vectors = np.array([[1, 1, 0],
                    [1, 0, 1],
                    [0, 1, 1]], dtype=float).T
orthonormal = toolkit.gram_schmidt(vectors)
print("Gram-Schmidt orthogonalization:")
print(f"Orthonormal matrix:\n{orthonormal}")
print(f"Verify orthogonality:\n{orthonormal.T @ orthonormal}")

# Power iteration
A = np.array([[4, 2],
              [1, 3]])
max_eig, max_vec = toolkit.power_iteration(A)
print(f"\nPower iteration largest eigenvalue: {max_eig:.6f}")

# QR iteration
eigenvalues = toolkit.qr_iteration(A)
print(f"QR iteration eigenvalues: {eigenvalues}")
print(f"NumPy eigenvalues: {np.linalg.eigvals(A)}")
```

### Linear System Solver

```python
class LinearSolver:
    """Linear System Solver"""

    @staticmethod
    def solve_lu(A, b):
        """Solve Ax = b using LU decomposition"""
        from scipy.linalg import lu_factor, lu_solve
        lu, piv = lu_factor(A)
        return lu_solve((lu, piv), b)

    @staticmethod
    def solve_cholesky(A, b):
        """Solve using Cholesky decomposition (requires A positive definite)"""
        L = np.linalg.cholesky(A)
        # Forward substitution: Ly = b
        y = np.linalg.solve(L, b)
        # Backward substitution: L^T x = y
        x = np.linalg.solve(L.T, y)
        return x

    @staticmethod
    def solve_qr(A, b):
        """Solve using QR decomposition"""
        Q, R = np.linalg.qr(A)
        # Rx = Q^T b
        return np.linalg.solve(R, Q.T @ b)

    @staticmethod
    def solve_svd(A, b, tol=1e-10):
        """Solve using SVD (including underdetermined and overdetermined systems)"""
        U, S, Vt = np.linalg.svd(A, full_matrices=False)
        # x = V @ S^(-1) @ U^T @ b
        S_inv = np.where(S > tol, 1/S, 0)
        return Vt.T @ (S_inv * (U.T @ b))

    @staticmethod
    def conjugate_gradient(A, b, x0=None, tol=1e-10, max_iter=1000):
        """Conjugate gradient method (requires A symmetric positive definite)"""
        n = len(b)
        x = x0 if x0 is not None else np.zeros(n)
        r = b - A @ x
        p = r.copy()

        for i in range(max_iter):
            Ap = A @ p
            alpha = np.dot(r, r) / np.dot(p, Ap)
            x = x + alpha * p
            r_new = r - alpha * Ap

            if np.linalg.norm(r_new) < tol:
                break

            beta = np.dot(r_new, r_new) / np.dot(r, r)
            p = r_new + beta * p
            r = r_new

        return x

# Usage examples
solver = LinearSolver()

# Positive definite matrix system
A = np.array([[4, 2],
              [2, 5]], dtype=float)
b = np.array([1, 2], dtype=float)

x_direct = np.linalg.solve(A, b)
x_cholesky = solver.solve_cholesky(A, b)
x_cg = solver.conjugate_gradient(A, b)

print("Linear system solving:")
print(f"Direct solve: {x_direct}")
print(f"Cholesky: {x_cholesky}")
print(f"Conjugate gradient: {x_cg}")

# Overdetermined system (least squares)
A_over = np.array([[1, 1],
                   [1, 2],
                   [1, 3]], dtype=float)
b_over = np.array([1, 2, 2], dtype=float)

x_lstsq = np.linalg.lstsq(A_over, b_over, rcond=None)[0]
x_svd = solver.solve_svd(A_over, b_over)

print(f"\nOverdetermined system least squares solution:")
print(f"lstsq: {x_lstsq}")
print(f"SVD: {x_svd}")
```

### Matrix Analysis Tools

```python
class MatrixAnalysis:
    """Matrix Analysis Tools"""

    @staticmethod
    def condition_number(A, p=2):
        """Compute condition number"""
        if p == 2:
            S = np.linalg.svd(A, compute_uv=False)
            return S[0] / S[-1] if S[-1] > 0 else np.inf
        else:
            return np.linalg.cond(A, p)

    @staticmethod
    def matrix_rank(A, tol=None):
        """Compute matrix rank"""
        S = np.linalg.svd(A, compute_uv=False)
        if tol is None:
            tol = S[0] * max(A.shape) * np.finfo(float).eps
        return np.sum(S > tol)

    @staticmethod
    def null_space(A, tol=1e-10):
        """Compute null space"""
        U, S, Vt = np.linalg.svd(A)
        null_mask = S <= tol
        null_dim = np.sum(null_mask)
        if null_dim == 0:
            return np.array([]).reshape(A.shape[1], 0)
        return Vt[-null_dim:].T

    @staticmethod
    def column_space(A, tol=1e-10):
        """Compute column space"""
        U, S, Vt = np.linalg.svd(A)
        rank = np.sum(S > tol)
        return U[:, :rank]

    @staticmethod
    def row_space(A, tol=1e-10):
        """Compute row space"""
        U, S, Vt = np.linalg.svd(A)
        rank = np.sum(S > tol)
        return Vt[:rank].T

    @staticmethod
    def is_symmetric(A, tol=1e-10):
        """Check if symmetric"""
        return np.allclose(A, A.T, atol=tol)

    @staticmethod
    def is_positive_definite(A):
        """Check if positive definite"""
        if not MatrixAnalysis.is_symmetric(A):
            return False
        try:
            eigenvalues = np.linalg.eigvalsh(A)
            return np.all(eigenvalues > 0)
        except:
            return False

    @staticmethod
    def spectral_radius(A):
        """Compute spectral radius"""
        eigenvalues = np.linalg.eigvals(A)
        return np.max(np.abs(eigenvalues))

# Usage examples
analysis = MatrixAnalysis()

A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])

print("Matrix analysis:")
print(f"Matrix A:\n{A}")
print(f"Rank: {analysis.matrix_rank(A)}")
print(f"Condition number: {analysis.condition_number(A):.2f}")
print(f"Spectral radius: {analysis.spectral_radius(A):.4f}")
print(f"Is symmetric: {analysis.is_symmetric(A)}")

# Null space
null = analysis.null_space(A)
if null.size > 0:
    print(f"Null space dimension: {null.shape[1]}")
    print(f"Verify A @ null:\n{A @ null}")

# Positive definite matrix
B = np.array([[4, 2],
              [2, 5]])
print(f"\nMatrix B is positive definite: {analysis.is_positive_definite(B)}")
print(f"Eigenvalues of B: {np.linalg.eigvalsh(B)}")
```

## Interview Key Points Summary

### Core Concepts Quick Reference

```python
# Vector norms
v = np.array([3, 4])
print(f"L1 norm: {np.linalg.norm(v, 1)}")  # 7
print(f"L2 norm: {np.linalg.norm(v, 2)}")  # 5
print(f"L-infinity norm: {np.linalg.norm(v, np.inf)}")  # 4

# Matrix rank
A = np.array([[1, 2], [2, 4]])  # linearly dependent
print(f"Rank: {np.linalg.matrix_rank(A)}")  # 1

# Eigenvalues and singular values
A = np.array([[3, 1], [1, 3]])
eigenvalues = np.linalg.eigvals(A)
singular_values = np.linalg.svd(A, compute_uv=False)
print(f"Eigenvalues: {eigenvalues}")  # [4, 2]
print(f"Singular values: {singular_values}")  # [4, 2]

# Orthogonal matrix properties
Q = np.array([[0, -1], [1, 0]])  # 90-degree rotation
print(f"Q^T Q = I: {np.allclose(Q.T @ Q, np.eye(2))}")  # True
print(f"det(Q) = +/-1: {np.linalg.det(Q)}")  # 1
```

### Common Interview Questions

```python
"""
Q1: What's the difference between eigenvalue decomposition and SVD?
A:
- Eigenvalue decomposition: only for square matrices, A = V Lambda V^(-1)
- SVD: for any matrix, A = U Sigma V^T
- For symmetric matrices: they are equivalent because eigenvectors are orthogonal

Q2: Why does PCA use SVD instead of eigenvalue decomposition?
A:
- Numerical stability: SVD is more stable
- Computational efficiency: no need to compute covariance matrix
- Memory: covariance matrix is n x n, memory overhead is large when n is big

Q3: What is the significance of matrix rank?
A:
- Number of linearly independent rows/columns
- Dimension of image/column space
- Condition for system of equations to have solutions

Q4: What is a positive definite matrix? What properties does it have?
A:
- All eigenvalues are positive
- For any non-zero vector x, x^T A x > 0
- Can be Cholesky decomposed
- Guarantees convexity in optimization problems

Q5: What is the significance of condition number?
A:
- Measures numerical stability of a matrix
- Large condition number: ill-conditioned matrix, small perturbations cause large errors
- Condition number = largest singular value / smallest singular value
"""

# Code verification
A = np.array([[1, 1], [1, 1.001]])  # ill-conditioned matrix
print(f"Condition number: {np.linalg.cond(A):.0f}")  # very large

b1 = np.array([2, 2.001])
b2 = np.array([2, 2.002])  # tiny perturbation
x1 = np.linalg.solve(A, b1)
x2 = np.linalg.solve(A, b2)
print(f"Relative change in b: {np.linalg.norm(b2-b1)/np.linalg.norm(b1):.6f}")
print(f"Relative change in x: {np.linalg.norm(x2-x1)/np.linalg.norm(x1):.6f}")
```

### Applications in Machine Learning

```python
"""
Applications of linear algebra in machine learning:

1. Data Representation
   - Feature matrix X: (n_samples, n_features)
   - Weight matrix W: (input_dim, output_dim)

2. Linear Models
   - Linear regression: w = (X^T X)^(-1) X^T y
   - Ridge regression: w = (X^T X + lambda*I)^(-1) X^T y
   - Support Vector Machines: kernel matrix

3. Dimensionality Reduction
   - PCA: eigenvalue decomposition / SVD
   - LDA: generalized eigenvalue problem
   - Matrix factorization: NMF, ICA

4. Deep Learning
   - Forward propagation: matrix multiplication
   - Backpropagation: gradient computation
   - Weight initialization: singular value analysis
   - Batch normalization: covariance matrix

5. Recommender Systems
   - Matrix factorization: SVD
   - Collaborative filtering: similarity matrix

6. Natural Language Processing
   - Word embeddings: matrix factorization (LSA)
   - Attention mechanism: matrix operations
"""

# Example: implementing linear regression using linear algebra
def linear_regression_closed_form(X, y):
    """Closed-form solution: w = (X^T X)^(-1) X^T y"""
    return np.linalg.solve(X.T @ X, X.T @ y)

def ridge_regression(X, y, alpha=1.0):
    """Ridge regression: w = (X^T X + alpha*I)^(-1) X^T y"""
    n_features = X.shape[1]
    return np.linalg.solve(X.T @ X + alpha * np.eye(n_features), X.T @ y)

# Test
np.random.seed(42)
X = np.random.randn(100, 5)
X = np.column_stack([np.ones(100), X])  # add bias term
true_w = np.array([1, 2, -1, 0.5, 3, -2])
y = X @ true_w + 0.1 * np.random.randn(100)

w_ols = linear_regression_closed_form(X, y)
w_ridge = ridge_regression(X, y, alpha=0.1)

print(f"True weights: {true_w}")
print(f"OLS estimate: {w_ols}")
print(f"Ridge estimate: {w_ridge}")
```

## Further Reading

### Recommended Resources

**Books:**
- "Linear Algebra Done Right" - Sheldon Axler: Clear theory
- "Introduction to Linear Algebra" - Gilbert Strang: MIT classic textbook
- "Matrix Computations" - Golub & Van Loan: The bible of numerical linear algebra
- "Linear Algebra Done Right" (Chinese translation) - Axler

**Video Courses:**
- MIT 18.06 Linear Algebra - Gilbert Strang
- 3Blue1Brown - Essence of Linear Algebra (Highly recommended)
- Khan Academy Linear Algebra

**Online Resources:**
- NumPy official documentation: Linear algebra module
- SciPy linear algebra tutorial
- Matrix Cookbook: Matrix formula reference

### Advanced Topics

- **Sparse matrix operations**: Large-scale data processing
- **Tensor decomposition**: Multi-dimensional data analysis
- **Random matrix theory**: High-dimensional statistics
- **Matrix calculus**: Deep learning optimization
- **Numerical stability**: Floating-point precision
- **Parallel linear algebra**: GPU-accelerated computing

## Summary

Linear algebra is the mathematical cornerstone of machine learning. This article covered:

1. **Vector spaces and bases**: The foundation of data representation
2. **Matrix operations**: The core of data transformations
3. **Linear transformations**: Key to understanding neural networks
4. **Eigenvalue decomposition**: Understanding the essence of matrices
5. **SVD decomposition**: The most powerful matrix decomposition tool
6. **PCA principles**: Mathematical foundation of dimensionality reduction

This knowledge helps you understand machine learning algorithm principles and apply them in practice:
- Better handle numerical computation problems
- Understand and optimize model performance
- Debug and diagnose algorithm issues

We recommend deepening your understanding through extensive practice and real projects, combining mathematical knowledge with programming practice.
