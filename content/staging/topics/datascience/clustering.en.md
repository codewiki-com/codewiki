---
title: "Classical ML: Clustering Algorithms"
description: "Master clustering methods: K-Means, DBSCAN, hierarchical clustering, and GMM"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - clustering
  - K-Means
  - DBSCAN
  - unsupervised learning
status: imported
origin: old/src/content/docs/datascience/clustering.en.md
divergence: 0.235
issues: []
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 16
  lastUpdated: 2026-01-07
---

Clustering is one of the most fundamental unsupervised learning techniques in machine learning. It involves grouping similar data points together without prior knowledge of class labels. This comprehensive guide covers major clustering algorithms, their mathematical foundations, implementation details, and practical evaluation methods.

## Understanding the Clustering Problem

### What is Clustering?

Clustering is the task of partitioning a dataset into groups (clusters) such that:
- Data points within the same cluster are highly similar
- Data points in different clusters are dissimilar

Unlike classification, clustering does not use predefined labels. The algorithm must discover natural groupings in the data based solely on the inherent structure.

**Formal Definition:**

Given a dataset $X = \{x_1, x_2, ..., x_n\}$ where each $x_i \in \mathbb{R}^d$, clustering aims to find a partition $C = \{C_1, C_2, ..., C_k\}$ where:
- $\bigcup_{i=1}^{k} C_i = X$ (all points are assigned)
- $C_i \cap C_j = \emptyset$ for $i \neq j$ (no overlap, for hard clustering)

### Types of Clustering

**Hard Clustering:**
- Each data point belongs to exactly one cluster
- Examples: K-Means, DBSCAN

**Soft (Fuzzy) Clustering:**
- Each data point has a probability of belonging to each cluster
- Examples: Gaussian Mixture Models, Fuzzy C-Means

**Hierarchical Clustering:**
- Creates a tree-like structure of clusters
- Can be agglomerative (bottom-up) or divisive (top-down)

### Common Applications

| Application Domain | Use Case | Algorithm Choice |
|-------------------|----------|------------------|
| Marketing | Customer segmentation | K-Means, GMM |
| Anomaly Detection | Fraud detection | DBSCAN, Isolation Forest |
| Image Processing | Image segmentation | K-Means, Mean Shift |
| Bioinformatics | Gene expression analysis | Hierarchical clustering |
| Document Analysis | Topic discovery | K-Means, LDA |
| Social Networks | Community detection | Spectral clustering |

### Distance Metrics

The choice of distance metric significantly impacts clustering results:

**Euclidean Distance:**
$$d(x, y) = \sqrt{\sum_{i=1}^{n}(x_i - y_i)^2}$$

**Manhattan Distance:**
$$d(x, y) = \sum_{i=1}^{n}|x_i - y_i|$$

**Cosine Similarity:**
$$\text{similarity}(x, y) = \frac{x \cdot y}{||x|| \cdot ||y||}$$

**Minkowski Distance:**
$$d(x, y) = \left(\sum_{i=1}^{n}|x_i - y_i|^p\right)^{1/p}$$

```python
from sklearn.metrics.pairwise import euclidean_distances, cosine_similarity, manhattan_distances
import numpy as np

# Sample data
X = np.array([[1, 2], [3, 4], [5, 6]])

# Calculate different distance metrics
euclidean_dist = euclidean_distances(X)
cosine_sim = cosine_similarity(X)
manhattan_dist = manhattan_distances(X)

print("Euclidean distances:\n", euclidean_dist)
print("\nCosine similarity:\n", cosine_sim)
print("\nManhattan distances:\n", manhattan_dist)
```

## K-Means Algorithm

K-Means is the most widely used clustering algorithm due to its simplicity and efficiency. It partitions data into K clusters by minimizing within-cluster variance.

### Algorithm Overview

**Objective Function (Inertia):**

K-Means minimizes the within-cluster sum of squares (WCSS):

$$J = \sum_{i=1}^{k}\sum_{x \in C_i}||x - \mu_i||^2$$

where $\mu_i$ is the centroid of cluster $C_i$.

**Algorithm Steps:**

1. **Initialization**: Randomly select K initial centroids
2. **Assignment**: Assign each point to the nearest centroid
3. **Update**: Recalculate centroids as the mean of assigned points
4. **Repeat**: Continue steps 2-3 until convergence

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs

# Generate sample data
np.random.seed(42)
X, y_true = make_blobs(n_samples=300, centers=4, cluster_std=0.6, random_state=42)

# Apply K-Means
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
y_kmeans = kmeans.fit_predict(X)

# Visualize results
plt.figure(figsize=(12, 5))

# Original data
plt.subplot(1, 2, 1)
plt.scatter(X[:, 0], X[:, 1], c='gray', alpha=0.6)
plt.title('Original Data')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')

# Clustered data
plt.subplot(1, 2, 2)
plt.scatter(X[:, 0], X[:, 1], c=y_kmeans, cmap='viridis', alpha=0.6)
plt.scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1],
            c='red', marker='X', s=200, edgecolors='black', label='Centroids')
plt.title('K-Means Clustering (K=4)')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.legend()

plt.tight_layout()
plt.show()

print(f"Inertia (WCSS): {kmeans.inertia_:.2f}")
print(f"Number of iterations: {kmeans.n_iter_}")
```

### Implementing K-Means from Scratch

```python
import numpy as np

class KMeansFromScratch:
    def __init__(self, n_clusters=3, max_iters=100, tol=1e-4, random_state=None):
        self.n_clusters = n_clusters
        self.max_iters = max_iters
        self.tol = tol
        self.random_state = random_state
        self.centroids = None
        self.labels = None
        self.inertia_ = None

    def fit(self, X):
        if self.random_state is not None:
            np.random.seed(self.random_state)

        n_samples, n_features = X.shape

        # Random initialization
        random_indices = np.random.choice(n_samples, self.n_clusters, replace=False)
        self.centroids = X[random_indices].copy()

        for iteration in range(self.max_iters):
            # Assignment step
            distances = self._compute_distances(X)
            self.labels = np.argmin(distances, axis=1)

            # Update step
            new_centroids = np.zeros((self.n_clusters, n_features))
            for k in range(self.n_clusters):
                cluster_points = X[self.labels == k]
                if len(cluster_points) > 0:
                    new_centroids[k] = cluster_points.mean(axis=0)
                else:
                    new_centroids[k] = self.centroids[k]

            # Check convergence
            centroid_shift = np.sum((new_centroids - self.centroids) ** 2)
            self.centroids = new_centroids

            if centroid_shift < self.tol:
                break

        # Calculate inertia
        self.inertia_ = self._compute_inertia(X)
        return self

    def predict(self, X):
        distances = self._compute_distances(X)
        return np.argmin(distances, axis=1)

    def fit_predict(self, X):
        self.fit(X)
        return self.labels

    def _compute_distances(self, X):
        distances = np.zeros((X.shape[0], self.n_clusters))
        for k in range(self.n_clusters):
            distances[:, k] = np.sqrt(np.sum((X - self.centroids[k]) ** 2, axis=1))
        return distances

    def _compute_inertia(self, X):
        inertia = 0
        for k in range(self.n_clusters):
            cluster_points = X[self.labels == k]
            if len(cluster_points) > 0:
                inertia += np.sum((cluster_points - self.centroids[k]) ** 2)
        return inertia

# Test custom implementation
custom_kmeans = KMeansFromScratch(n_clusters=4, random_state=42)
custom_labels = custom_kmeans.fit_predict(X)
print(f"Custom K-Means Inertia: {custom_kmeans.inertia_:.2f}")
```

### Choosing Optimal K: The Elbow Method

The elbow method plots inertia against the number of clusters. The "elbow" point where the rate of decrease sharply changes suggests optimal K.

```python
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt

def elbow_method(X, k_range=range(1, 11)):
    """Find optimal K using elbow method."""
    inertias = []
    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X)
        inertias.append(kmeans.inertia_)

    plt.figure(figsize=(10, 6))
    plt.plot(k_range, inertias, 'bo-', linewidth=2, markersize=8)
    plt.xlabel('Number of Clusters (K)', fontsize=12)
    plt.ylabel('Inertia (WCSS)', fontsize=12)
    plt.title('Elbow Method for Optimal K', fontsize=14)
    plt.grid(True, alpha=0.3)

    # Annotate the elbow point
    for i, (k, inertia) in enumerate(zip(k_range, inertias)):
        plt.annotate(f'{inertia:.0f}', (k, inertia), textcoords="offset points",
                     xytext=(0, 10), ha='center', fontsize=8)
    plt.show()

    return inertias

inertias = elbow_method(X)
```

### K-Means++ Initialization

Standard K-Means with random initialization can converge to suboptimal solutions. K-Means++ provides smarter initialization that:
- Speeds up convergence
- Improves final clustering quality
- Reduces sensitivity to initialization

**K-Means++ Algorithm:**

1. Choose first centroid uniformly at random from data points
2. For each remaining centroid:
   - Calculate distance $D(x)$ from each point to nearest existing centroid
   - Choose next centroid with probability proportional to $D(x)^2$
3. Proceed with standard K-Means

```python
import numpy as np

def kmeans_plusplus_init(X, n_clusters, random_state=None):
    """K-Means++ initialization algorithm."""
    if random_state is not None:
        np.random.seed(random_state)

    n_samples = X.shape[0]
    centroids = []

    # Choose first centroid randomly
    first_idx = np.random.randint(n_samples)
    centroids.append(X[first_idx])

    # Choose remaining centroids
    for _ in range(1, n_clusters):
        # Calculate squared distances to nearest centroid
        distances = np.zeros(n_samples)
        for i, point in enumerate(X):
            min_dist = float('inf')
            for centroid in centroids:
                dist = np.sum((point - centroid) ** 2)
                min_dist = min(min_dist, dist)
            distances[i] = min_dist

        # Choose next centroid with probability proportional to D(x)^2
        probabilities = distances / distances.sum()
        next_idx = np.random.choice(n_samples, p=probabilities)
        centroids.append(X[next_idx])

    return np.array(centroids)

# Compare random vs K-Means++ initialization
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Random initialization
kmeans_random = KMeans(n_clusters=4, init='random', n_init=1, random_state=42)
labels_random = kmeans_random.fit_predict(X)
axes[0].scatter(X[:, 0], X[:, 1], c=labels_random, cmap='viridis', alpha=0.6)
axes[0].scatter(kmeans_random.cluster_centers_[:, 0], kmeans_random.cluster_centers_[:, 1],
                c='red', marker='X', s=200, edgecolors='black')
axes[0].set_title(f'Random Init (Inertia: {kmeans_random.inertia_:.2f})')

# K-Means++ initialization
kmeans_pp = KMeans(n_clusters=4, init='k-means++', n_init=1, random_state=42)
labels_pp = kmeans_pp.fit_predict(X)
axes[1].scatter(X[:, 0], X[:, 1], c=labels_pp, cmap='viridis', alpha=0.6)
axes[1].scatter(kmeans_pp.cluster_centers_[:, 0], kmeans_pp.cluster_centers_[:, 1],
                c='red', marker='X', s=200, edgecolors='black')
axes[1].set_title(f'K-Means++ Init (Inertia: {kmeans_pp.inertia_:.2f})')

plt.tight_layout()
plt.show()
```

### K-Means Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| Assumes spherical clusters | Cannot handle elongated or irregular shapes | Use DBSCAN or GMM |
| Sensitive to outliers | Outliers can significantly shift centroids | Remove outliers or use K-Medoids |
| Requires K specification | Number of clusters must be known | Use elbow method or silhouette analysis |
| Sensitive to initialization | May converge to local optima | Use K-Means++ or multiple runs |
| Assumes equal-sized clusters | May not work well with varying cluster sizes | Use GMM or density-based methods |

## DBSCAN: Density-Based Clustering

DBSCAN (Density-Based Spatial Clustering of Applications with Noise) identifies clusters as dense regions separated by sparse areas. Unlike K-Means, it can discover clusters of arbitrary shape and automatically detect outliers.

### Core Concepts

**Key Parameters:**
- **eps (epsilon)**: Maximum distance between two points to be considered neighbors
- **min_samples**: Minimum points required to form a dense region

**Point Classifications:**
- **Core Point**: Has at least min_samples neighbors within eps distance
- **Border Point**: Within eps of a core point but has fewer than min_samples neighbors
- **Noise Point**: Neither core nor border point (outlier)

**Definitions:**
- **Directly Density-Reachable**: Point q is directly density-reachable from p if q is within eps of p and p is a core point
- **Density-Reachable**: Transitive closure of directly density-reachable
- **Density-Connected**: Two points are density-connected if there exists a core point from which both are density-reachable

### DBSCAN Algorithm

```
1. Mark all points as unvisited
2. For each unvisited point P:
   a. Mark P as visited
   b. Find neighbors within eps distance
   c. If neighbors >= min_samples:
      - Create new cluster C
      - Add P to C
      - For each neighbor Q:
        - If Q is unvisited, mark visited and check its neighbors
        - If Q is not in any cluster, add Q to C
   d. Else mark P as noise (may later be border point)
```

```python
from sklearn.cluster import DBSCAN
from sklearn.datasets import make_moons
import matplotlib.pyplot as plt
import numpy as np

# Generate non-spherical data
X_moons, y_moons = make_moons(n_samples=300, noise=0.05, random_state=42)

# Apply DBSCAN
dbscan = DBSCAN(eps=0.2, min_samples=5)
labels = dbscan.fit_predict(X_moons)

# Identify core samples
core_samples_mask = np.zeros_like(labels, dtype=bool)
core_samples_mask[dbscan.core_sample_indices_] = True

# Visualize
plt.figure(figsize=(14, 5))

# K-Means for comparison
plt.subplot(1, 2, 1)
kmeans = KMeans(n_clusters=2, random_state=42)
km_labels = kmeans.fit_predict(X_moons)
plt.scatter(X_moons[:, 0], X_moons[:, 1], c=km_labels, cmap='viridis', alpha=0.6)
plt.title('K-Means (Fails on Non-Spherical Data)')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')

# DBSCAN results
plt.subplot(1, 2, 2)
unique_labels = set(labels)
colors = plt.cm.Spectral(np.linspace(0, 1, len(unique_labels)))

for label, col in zip(unique_labels, colors):
    if label == -1:
        col = 'black'  # Noise points
        marker = 'x'
        label_name = 'Noise'
    else:
        marker = 'o'
        label_name = f'Cluster {label}'

    class_mask = labels == label
    # Core points
    xy = X_moons[class_mask & core_samples_mask]
    plt.scatter(xy[:, 0], xy[:, 1], c=[col], marker=marker, s=50, label=label_name)
    # Border points
    xy = X_moons[class_mask & ~core_samples_mask]
    plt.scatter(xy[:, 0], xy[:, 1], c=[col], marker=marker, s=20, alpha=0.5)

plt.title(f'DBSCAN (eps={dbscan.eps}, min_samples={dbscan.get_params()["min_samples"]})')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.legend()

plt.tight_layout()
plt.show()

# Print statistics
n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
n_noise = list(labels).count(-1)
print(f"Number of clusters: {n_clusters}")
print(f"Number of noise points: {n_noise}")
print(f"Number of core points: {len(dbscan.core_sample_indices_)}")
```

### Choosing DBSCAN Parameters

**K-Distance Graph Method for eps:**

Plot the distance to the k-th nearest neighbor for each point, sorted in ascending order. The "elbow" suggests a good eps value.

```python
from sklearn.neighbors import NearestNeighbors
import numpy as np
import matplotlib.pyplot as plt

def find_optimal_eps(X, min_samples=5):
    """Find optimal eps using k-distance graph."""
    # Calculate k-th nearest neighbor distances
    neighbors = NearestNeighbors(n_neighbors=min_samples)
    neighbors.fit(X)
    distances, _ = neighbors.kneighbors(X)

    # Get distance to k-th nearest neighbor (last column)
    k_distances = distances[:, -1]
    k_distances = np.sort(k_distances)

    plt.figure(figsize=(10, 6))
    plt.plot(range(len(k_distances)), k_distances, 'b-', linewidth=2)
    plt.xlabel('Points sorted by distance', fontsize=12)
    plt.ylabel(f'{min_samples}-th Nearest Neighbor Distance', fontsize=12)
    plt.title('K-Distance Graph for Optimal eps Selection', fontsize=14)
    plt.grid(True, alpha=0.3)

    # Mark potential elbow region
    plt.axhline(y=np.percentile(k_distances, 90), color='r', linestyle='--',
                label=f'90th percentile: {np.percentile(k_distances, 90):.3f}')
    plt.legend()
    plt.show()

    return k_distances

k_distances = find_optimal_eps(X_moons, min_samples=5)
```

### DBSCAN Implementation from Scratch

```python
import numpy as np
from collections import deque

class DBSCANFromScratch:
    def __init__(self, eps=0.5, min_samples=5):
        self.eps = eps
        self.min_samples = min_samples
        self.labels_ = None
        self.core_sample_indices_ = None

    def fit_predict(self, X):
        n_samples = X.shape[0]
        self.labels_ = np.full(n_samples, -1)  # -1 means unclassified/noise

        # Find neighbors for all points
        neighbors_list = self._find_all_neighbors(X)

        # Identify core points
        core_points = set()
        for i, neighbors in enumerate(neighbors_list):
            if len(neighbors) >= self.min_samples:
                core_points.add(i)
        self.core_sample_indices_ = np.array(list(core_points))

        cluster_id = 0

        for point_idx in range(n_samples):
            # Skip if already classified
            if self.labels_[point_idx] != -1:
                continue

            # Skip if not a core point
            if point_idx not in core_points:
                continue

            # Expand cluster from this core point
            self._expand_cluster(point_idx, neighbors_list, core_points, cluster_id)
            cluster_id += 1

        return self.labels_

    def _find_all_neighbors(self, X):
        """Find neighbors within eps for all points."""
        n_samples = X.shape[0]
        neighbors_list = []

        for i in range(n_samples):
            distances = np.sqrt(np.sum((X - X[i]) ** 2, axis=1))
            neighbors = np.where(distances <= self.eps)[0]
            neighbors_list.append(neighbors)

        return neighbors_list

    def _expand_cluster(self, seed_idx, neighbors_list, core_points, cluster_id):
        """Expand cluster using BFS."""
        queue = deque([seed_idx])
        self.labels_[seed_idx] = cluster_id

        while queue:
            current = queue.popleft()

            # Only core points can expand the cluster
            if current not in core_points:
                continue

            for neighbor in neighbors_list[current]:
                if self.labels_[neighbor] == -1:  # Unclassified or noise
                    self.labels_[neighbor] = cluster_id
                    queue.append(neighbor)

# Test custom implementation
custom_dbscan = DBSCANFromScratch(eps=0.2, min_samples=5)
custom_labels = custom_dbscan.fit_predict(X_moons)
print(f"Custom DBSCAN found {len(set(custom_labels)) - (1 if -1 in custom_labels else 0)} clusters")
```

### DBSCAN Advantages and Limitations

**Advantages:**
- No need to specify number of clusters
- Can find arbitrarily shaped clusters
- Robust to outliers (identifies them as noise)
- Only two parameters (eps, min_samples)

**Limitations:**
- Struggles with varying density clusters
- Sensitive to eps parameter
- Not suitable for high-dimensional data (curse of dimensionality)
- Cannot cluster data with large differences in densities

## Hierarchical Clustering

Hierarchical clustering creates a tree-like structure (dendrogram) representing nested clusters. It provides a complete picture of cluster relationships at all scales.

### Types of Hierarchical Clustering

**Agglomerative (Bottom-Up):**
1. Start with each point as its own cluster
2. Repeatedly merge the two closest clusters
3. Continue until all points are in one cluster

**Divisive (Top-Down):**
1. Start with all points in one cluster
2. Recursively split clusters
3. Continue until each point is its own cluster

### Linkage Methods

The linkage method determines how distance between clusters is calculated:

| Linkage | Description | Formula |
|---------|-------------|---------|
| Single | Minimum distance between any two points | $\min_{a \in A, b \in B} d(a, b)$ |
| Complete | Maximum distance between any two points | $\max_{a \in A, b \in B} d(a, b)$ |
| Average | Average distance between all pairs | $\frac{1}{|A||B|}\sum_{a \in A}\sum_{b \in B} d(a, b)$ |
| Ward | Minimizes variance increase | $\sum_{i} (x_i - \mu)^2$ increase |

```python
from scipy.cluster.hierarchy import dendrogram, linkage, fcluster
from sklearn.datasets import make_blobs
import matplotlib.pyplot as plt
import numpy as np

# Generate sample data
X_hier, _ = make_blobs(n_samples=50, centers=3, cluster_std=0.6, random_state=42)

# Compare different linkage methods
fig, axes = plt.subplots(2, 2, figsize=(14, 12))
linkage_methods = ['single', 'complete', 'average', 'ward']

for ax, method in zip(axes.flatten(), linkage_methods):
    Z = linkage(X_hier, method=method)
    dendrogram(Z, ax=ax, leaf_rotation=90, leaf_font_size=8)
    ax.set_title(f'{method.capitalize()} Linkage')
    ax.set_xlabel('Sample Index')
    ax.set_ylabel('Distance')

plt.tight_layout()
plt.show()
```

### Dendrogram Interpretation and Cluster Extraction

```python
from scipy.cluster.hierarchy import dendrogram, linkage, fcluster
import matplotlib.pyplot as plt
import numpy as np

# Perform hierarchical clustering with Ward linkage
Z = linkage(X_hier, method='ward')

# Plot dendrogram with cut threshold
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Dendrogram with horizontal cut line
ax1 = axes[0]
threshold = 5
dendrogram(Z, ax=ax1, color_threshold=threshold)
ax1.axhline(y=threshold, color='r', linestyle='--', label=f'Cut at {threshold}')
ax1.set_title('Dendrogram with Cut Threshold')
ax1.set_xlabel('Sample Index')
ax1.set_ylabel('Distance (Ward)')
ax1.legend()

# Extract clusters at the threshold
labels = fcluster(Z, t=threshold, criterion='distance')
n_clusters = len(set(labels))

# Scatter plot of resulting clusters
ax2 = axes[1]
scatter = ax2.scatter(X_hier[:, 0], X_hier[:, 1], c=labels, cmap='viridis', s=50)
ax2.set_title(f'Hierarchical Clustering Result ({n_clusters} clusters)')
ax2.set_xlabel('Feature 1')
ax2.set_ylabel('Feature 2')
plt.colorbar(scatter, ax=ax2, label='Cluster')

plt.tight_layout()
plt.show()

# Alternatively, specify number of clusters
labels_3 = fcluster(Z, t=3, criterion='maxclust')
print(f"Cluster labels with 3 clusters: {labels_3}")
```

### Agglomerative Clustering with Scikit-learn

```python
from sklearn.cluster import AgglomerativeClustering
import matplotlib.pyplot as plt
import numpy as np

# Different configurations
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

configurations = [
    {'n_clusters': 3, 'linkage': 'ward'},
    {'n_clusters': 3, 'linkage': 'complete'},
    {'n_clusters': 3, 'linkage': 'average'},
    {'n_clusters': 3, 'linkage': 'single'}
]

for ax, config in zip(axes.flatten(), configurations):
    model = AgglomerativeClustering(**config)
    labels = model.fit_predict(X_hier)

    ax.scatter(X_hier[:, 0], X_hier[:, 1], c=labels, cmap='viridis', s=50)
    ax.set_title(f"Linkage: {config['linkage']}")
    ax.set_xlabel('Feature 1')
    ax.set_ylabel('Feature 2')

plt.suptitle('Agglomerative Clustering with Different Linkage Methods', fontsize=14)
plt.tight_layout()
plt.show()
```

### Hierarchical Clustering Complexity

| Aspect | Agglomerative | Divisive |
|--------|---------------|----------|
| Time Complexity | $O(n^3)$ or $O(n^2 \log n)$ with optimization | $O(2^n)$ |
| Space Complexity | $O(n^2)$ | $O(n^2)$ |
| Implementation | More common | Rarely used |
| Result | Complete hierarchy | Complete hierarchy |

## Gaussian Mixture Models (GMM)

GMM assumes data is generated from a mixture of several Gaussian distributions with unknown parameters. It provides soft clustering with probability assignments.

### Mathematical Foundation

**Probability Density Function:**

$$p(x) = \sum_{k=1}^{K} \pi_k \mathcal{N}(x | \mu_k, \Sigma_k)$$

where:
- $K$ = number of components
- $\pi_k$ = mixing coefficient (weight) for component k, $\sum_k \pi_k = 1$
- $\mu_k$ = mean of component k
- $\Sigma_k$ = covariance matrix of component k

**Gaussian Distribution:**

$$\mathcal{N}(x | \mu, \Sigma) = \frac{1}{(2\pi)^{d/2}|\Sigma|^{1/2}} \exp\left(-\frac{1}{2}(x-\mu)^T\Sigma^{-1}(x-\mu)\right)$$

### Expectation-Maximization (EM) Algorithm

GMM parameters are estimated using the EM algorithm:

**E-Step (Expectation):**
Calculate responsibility (posterior probability) that component k generated point n:

$$\gamma_{nk} = \frac{\pi_k \mathcal{N}(x_n | \mu_k, \Sigma_k)}{\sum_{j=1}^{K} \pi_j \mathcal{N}(x_n | \mu_j, \Sigma_j)}$$

**M-Step (Maximization):**
Update parameters using responsibilities:

$$N_k = \sum_{n=1}^{N} \gamma_{nk}$$

$$\mu_k^{new} = \frac{1}{N_k} \sum_{n=1}^{N} \gamma_{nk} x_n$$

$$\Sigma_k^{new} = \frac{1}{N_k} \sum_{n=1}^{N} \gamma_{nk} (x_n - \mu_k^{new})(x_n - \mu_k^{new})^T$$

$$\pi_k^{new} = \frac{N_k}{N}$$

### GMM Implementation

```python
from sklearn.mixture import GaussianMixture
from sklearn.datasets import make_blobs
import matplotlib.pyplot as plt
import numpy as np

# Generate data with varying cluster sizes
np.random.seed(42)
X1 = np.random.multivariate_normal([0, 0], [[1, 0.5], [0.5, 1]], 150)
X2 = np.random.multivariate_normal([4, 4], [[1.5, 0], [0, 0.5]], 100)
X3 = np.random.multivariate_normal([1, 5], [[0.5, 0], [0, 1.5]], 80)
X_gmm = np.vstack([X1, X2, X3])

# Fit GMM
gmm = GaussianMixture(n_components=3, covariance_type='full', random_state=42)
gmm.fit(X_gmm)

# Get predictions and probabilities
labels = gmm.predict(X_gmm)
probs = gmm.predict_proba(X_gmm)

# Visualization
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Hard clustering result
ax1 = axes[0]
ax1.scatter(X_gmm[:, 0], X_gmm[:, 1], c=labels, cmap='viridis', alpha=0.6)
ax1.scatter(gmm.means_[:, 0], gmm.means_[:, 1], c='red', marker='X',
            s=200, edgecolors='black', label='Centroids')
ax1.set_title('GMM Hard Clustering')
ax1.set_xlabel('Feature 1')
ax1.set_ylabel('Feature 2')
ax1.legend()

# Soft clustering (probability for each component)
ax2 = axes[1]
# Create contour plot showing probability densities
x_min, x_max = X_gmm[:, 0].min() - 1, X_gmm[:, 0].max() + 1
y_min, y_max = X_gmm[:, 1].min() - 1, X_gmm[:, 1].max() + 1
xx, yy = np.meshgrid(np.linspace(x_min, x_max, 100),
                      np.linspace(y_min, y_max, 100))
Z = -gmm.score_samples(np.c_[xx.ravel(), yy.ravel()])
Z = Z.reshape(xx.shape)

ax2.contour(xx, yy, Z, levels=20, cmap='viridis', alpha=0.5)
ax2.scatter(X_gmm[:, 0], X_gmm[:, 1], c=labels, cmap='viridis', alpha=0.6)
ax2.set_title('GMM Probability Density Contours')
ax2.set_xlabel('Feature 1')
ax2.set_ylabel('Feature 2')

plt.tight_layout()
plt.show()

# Print model parameters
print("GMM Parameters:")
print(f"Weights (mixing coefficients): {gmm.weights_}")
print(f"\nMeans:\n{gmm.means_}")
print(f"\nCovariance type: {gmm.covariance_type}")
print(f"Number of iterations: {gmm.n_iter_}")
print(f"Log-likelihood: {gmm.score(X_gmm):.4f}")
```

### Covariance Types

GMM supports different covariance matrix constraints:

| Type | Description | Parameters per Component |
|------|-------------|-------------------------|
| full | Full covariance matrix | $d(d+1)/2$ |
| tied | Same full covariance for all | $d(d+1)/2$ total |
| diag | Diagonal covariance | $d$ |
| spherical | Single variance (isotropic) | $1$ |

```python
# Compare covariance types
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
cov_types = ['full', 'tied', 'diag', 'spherical']

for ax, cov_type in zip(axes.flatten(), cov_types):
    gmm = GaussianMixture(n_components=3, covariance_type=cov_type, random_state=42)
    gmm.fit(X_gmm)
    labels = gmm.predict(X_gmm)

    ax.scatter(X_gmm[:, 0], X_gmm[:, 1], c=labels, cmap='viridis', alpha=0.6)
    ax.scatter(gmm.means_[:, 0], gmm.means_[:, 1], c='red', marker='X',
               s=200, edgecolors='black')
    ax.set_title(f'{cov_type} (BIC: {gmm.bic(X_gmm):.0f})')
    ax.set_xlabel('Feature 1')
    ax.set_ylabel('Feature 2')

plt.suptitle('GMM with Different Covariance Types', fontsize=14)
plt.tight_layout()
plt.show()
```

### Model Selection: BIC and AIC

Use information criteria to select optimal number of components:

- **BIC (Bayesian Information Criterion):** $BIC = -2 \log L + k \log n$
- **AIC (Akaike Information Criterion):** $AIC = -2 \log L + 2k$

where $L$ is likelihood, $k$ is number of parameters, $n$ is number of samples.

```python
def select_gmm_components(X, max_components=10):
    """Select optimal number of GMM components using BIC/AIC."""
    n_components_range = range(1, max_components + 1)
    bics = []
    aics = []

    for n_components in n_components_range:
        gmm = GaussianMixture(n_components=n_components, random_state=42)
        gmm.fit(X)
        bics.append(gmm.bic(X))
        aics.append(gmm.aic(X))

    plt.figure(figsize=(10, 6))
    plt.plot(n_components_range, bics, 'b-o', label='BIC', linewidth=2)
    plt.plot(n_components_range, aics, 'r-s', label='AIC', linewidth=2)
    plt.xlabel('Number of Components', fontsize=12)
    plt.ylabel('Information Criterion', fontsize=12)
    plt.title('GMM Model Selection', fontsize=14)
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.show()

    optimal_bic = np.argmin(bics) + 1
    optimal_aic = np.argmin(aics) + 1
    print(f"Optimal components by BIC: {optimal_bic}")
    print(f"Optimal components by AIC: {optimal_aic}")

    return optimal_bic, optimal_aic

optimal_bic, optimal_aic = select_gmm_components(X_gmm)
```

### GMM vs K-Means Comparison

| Aspect | K-Means | GMM |
|--------|---------|-----|
| Cluster Shape | Spherical only | Elliptical (any shape) |
| Cluster Assignment | Hard (one cluster) | Soft (probabilities) |
| Cluster Size | Assumes equal | Can vary |
| Density Information | No | Yes |
| Complexity | Lower | Higher |
| Initialization | K-Means++ | Random or K-Means |

## Clustering Evaluation Metrics

Evaluating clustering quality is challenging since we typically lack ground truth labels. Both internal and external metrics are used.

### Internal Metrics (No Ground Truth)

**Silhouette Score:**

Measures how similar a point is to its own cluster compared to other clusters.

$$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$$

where:
- $a(i)$ = mean distance to other points in same cluster
- $b(i)$ = mean distance to points in nearest other cluster

Range: [-1, 1], higher is better.

```python
from sklearn.metrics import silhouette_score, silhouette_samples
import matplotlib.pyplot as plt
import numpy as np

def evaluate_silhouette(X, labels):
    """Evaluate and visualize silhouette scores."""
    # Calculate silhouette score
    sil_avg = silhouette_score(X, labels)
    sample_silhouette_values = silhouette_samples(X, labels)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Silhouette plot
    n_clusters = len(set(labels))
    y_lower = 10

    for i in range(n_clusters):
        cluster_silhouette_values = sample_silhouette_values[labels == i]
        cluster_silhouette_values.sort()

        size_cluster_i = len(cluster_silhouette_values)
        y_upper = y_lower + size_cluster_i

        color = plt.cm.nipy_spectral(float(i) / n_clusters)
        ax1.fill_betweenx(np.arange(y_lower, y_upper),
                          0, cluster_silhouette_values,
                          facecolor=color, edgecolor=color, alpha=0.7)

        ax1.text(-0.05, y_lower + 0.5 * size_cluster_i, str(i))
        y_lower = y_upper + 10

    ax1.axvline(x=sil_avg, color='red', linestyle='--', label=f'Average: {sil_avg:.3f}')
    ax1.set_xlabel('Silhouette Coefficient')
    ax1.set_ylabel('Cluster')
    ax1.set_title('Silhouette Plot')
    ax1.legend()

    # Scatter plot
    colors = plt.cm.nipy_spectral(labels.astype(float) / n_clusters)
    ax2.scatter(X[:, 0], X[:, 1], c=colors, alpha=0.6)
    ax2.set_xlabel('Feature 1')
    ax2.set_ylabel('Feature 2')
    ax2.set_title(f'Clustering Result (Silhouette: {sil_avg:.3f})')

    plt.tight_layout()
    plt.show()

    return sil_avg

# Evaluate K-Means clustering
kmeans = KMeans(n_clusters=4, random_state=42)
labels = kmeans.fit_predict(X)
silhouette = evaluate_silhouette(X, labels)
```

**Calinski-Harabasz Index (CH Index):**

Also known as Variance Ratio Criterion. Measures ratio of between-cluster dispersion to within-cluster dispersion.

$$CH = \frac{B / (k-1)}{W / (n-k)}$$

where $B$ = between-cluster sum of squares, $W$ = within-cluster sum of squares.

Higher is better. No bounded range.

```python
from sklearn.metrics import calinski_harabasz_score

# Compare different numbers of clusters
ch_scores = []
sil_scores = []
k_range = range(2, 10)

for k in k_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X)
    ch_scores.append(calinski_harabasz_score(X, labels))
    sil_scores.append(silhouette_score(X, labels))

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

ax1.plot(k_range, ch_scores, 'b-o', linewidth=2)
ax1.set_xlabel('Number of Clusters')
ax1.set_ylabel('Calinski-Harabasz Index')
ax1.set_title('CH Index vs Number of Clusters')
ax1.grid(True, alpha=0.3)

ax2.plot(k_range, sil_scores, 'r-o', linewidth=2)
ax2.set_xlabel('Number of Clusters')
ax2.set_ylabel('Silhouette Score')
ax2.set_title('Silhouette Score vs Number of Clusters')
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

print(f"Optimal K by CH Index: {k_range[np.argmax(ch_scores)]}")
print(f"Optimal K by Silhouette: {k_range[np.argmax(sil_scores)]}")
```

**Davies-Bouldin Index:**

Measures average similarity between each cluster and its most similar cluster.

$$DB = \frac{1}{k}\sum_{i=1}^{k}\max_{j \neq i}\left(\frac{s_i + s_j}{d_{ij}}\right)$$

where $s_i$ = average distance within cluster i, $d_{ij}$ = distance between centroids.

Lower is better. Minimum value is 0.

```python
from sklearn.metrics import davies_bouldin_score

# Calculate Davies-Bouldin Index
db_scores = []
for k in k_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X)
    db_scores.append(davies_bouldin_score(X, labels))

plt.figure(figsize=(10, 6))
plt.plot(k_range, db_scores, 'g-o', linewidth=2)
plt.xlabel('Number of Clusters')
plt.ylabel('Davies-Bouldin Index')
plt.title('Davies-Bouldin Index (Lower is Better)')
plt.grid(True, alpha=0.3)
plt.show()

print(f"Optimal K by DB Index: {k_range[np.argmin(db_scores)]}")
```

### External Metrics (With Ground Truth)

When true labels are available (for validation or benchmarking):

```python
from sklearn.metrics import (adjusted_rand_score, normalized_mutual_info_score,
                            homogeneity_score, completeness_score, v_measure_score)

def external_evaluation(y_true, y_pred):
    """Evaluate clustering with ground truth labels."""
    metrics = {
        'Adjusted Rand Index': adjusted_rand_score(y_true, y_pred),
        'Normalized Mutual Information': normalized_mutual_info_score(y_true, y_pred),
        'Homogeneity': homogeneity_score(y_true, y_pred),
        'Completeness': completeness_score(y_true, y_pred),
        'V-measure': v_measure_score(y_true, y_pred)
    }

    print("External Evaluation Metrics:")
    print("-" * 40)
    for metric, score in metrics.items():
        print(f"{metric}: {score:.4f}")

    return metrics

# Assuming we have ground truth labels
X_eval, y_true = make_blobs(n_samples=300, centers=4, cluster_std=0.6, random_state=42)
kmeans = KMeans(n_clusters=4, random_state=42)
y_pred = kmeans.fit_predict(X_eval)

external_evaluation(y_true, y_pred)
```

### Metrics Summary Table

| Metric | Range | Optimal | Needs Labels | Use Case |
|--------|-------|---------|--------------|----------|
| Silhouette | [-1, 1] | Max | No | Cluster separation |
| Calinski-Harabasz | [0, inf] | Max | No | Cluster compactness |
| Davies-Bouldin | [0, inf] | Min | No | Cluster similarity |
| Adjusted Rand Index | [-0.5, 1] | Max | Yes | Label agreement |
| NMI | [0, 1] | Max | Yes | Information shared |
| V-measure | [0, 1] | Max | Yes | Homogeneity + completeness |

## Complete Scikit-learn Implementation

### Comprehensive Clustering Pipeline

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score
from sklearn.datasets import make_blobs, make_moons

class ClusteringPipeline:
    """Comprehensive clustering analysis pipeline."""

    def __init__(self, random_state=42):
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.results = {}

    def fit_all_algorithms(self, X, n_clusters=3, eps=0.5, min_samples=5):
        """Fit multiple clustering algorithms and compare results."""
        # Scale data
        X_scaled = self.scaler.fit_transform(X)

        # Define algorithms
        algorithms = {
            'K-Means': KMeans(n_clusters=n_clusters, random_state=self.random_state, n_init=10),
            'K-Means++': KMeans(n_clusters=n_clusters, init='k-means++',
                               random_state=self.random_state, n_init=10),
            'DBSCAN': DBSCAN(eps=eps, min_samples=min_samples),
            'Agglomerative (Ward)': AgglomerativeClustering(n_clusters=n_clusters, linkage='ward'),
            'Agglomerative (Complete)': AgglomerativeClustering(n_clusters=n_clusters, linkage='complete'),
            'GMM': GaussianMixture(n_components=n_clusters, random_state=self.random_state)
        }

        # Fit each algorithm and store results
        for name, algorithm in algorithms.items():
            if name == 'GMM':
                labels = algorithm.fit_predict(X_scaled)
            else:
                labels = algorithm.fit_predict(X_scaled)

            # Calculate metrics (only for non-trivial clusterings)
            n_labels = len(set(labels)) - (1 if -1 in labels else 0)
            if n_labels > 1 and n_labels < len(X):
                self.results[name] = {
                    'labels': labels,
                    'n_clusters': n_labels,
                    'silhouette': silhouette_score(X_scaled, labels) if -1 not in labels or sum(labels != -1) > n_labels else np.nan,
                    'calinski_harabasz': calinski_harabasz_score(X_scaled, labels) if -1 not in labels else np.nan,
                    'davies_bouldin': davies_bouldin_score(X_scaled, labels) if -1 not in labels else np.nan
                }
            else:
                self.results[name] = {
                    'labels': labels,
                    'n_clusters': n_labels,
                    'silhouette': np.nan,
                    'calinski_harabasz': np.nan,
                    'davies_bouldin': np.nan
                }

        return self

    def get_comparison_table(self):
        """Return comparison table of all algorithms."""
        data = []
        for name, result in self.results.items():
            data.append({
                'Algorithm': name,
                'Clusters Found': result['n_clusters'],
                'Silhouette': result['silhouette'],
                'Calinski-Harabasz': result['calinski_harabasz'],
                'Davies-Bouldin': result['davies_bouldin']
            })
        return pd.DataFrame(data)

    def plot_results(self, X, figsize=(16, 10)):
        """Visualize clustering results for all algorithms."""
        n_algorithms = len(self.results)
        n_cols = 3
        n_rows = (n_algorithms + n_cols - 1) // n_cols

        fig, axes = plt.subplots(n_rows, n_cols, figsize=figsize)
        axes = axes.flatten()

        X_scaled = self.scaler.transform(X)

        for idx, (name, result) in enumerate(self.results.items()):
            ax = axes[idx]
            labels = result['labels']
            n_clusters = result['n_clusters']
            silhouette = result['silhouette']

            # Handle noise points in DBSCAN
            unique_labels = set(labels)
            colors = plt.cm.Spectral(np.linspace(0, 1, len(unique_labels)))

            for label, color in zip(unique_labels, colors):
                if label == -1:
                    color = 'black'
                    marker = 'x'
                else:
                    marker = 'o'

                mask = labels == label
                ax.scatter(X_scaled[mask, 0], X_scaled[mask, 1],
                          c=[color], marker=marker, s=30, alpha=0.6)

            sil_str = f"{silhouette:.3f}" if not np.isnan(silhouette) else "N/A"
            ax.set_title(f'{name}\nClusters: {n_clusters}, Silhouette: {sil_str}')
            ax.set_xlabel('Feature 1')
            ax.set_ylabel('Feature 2')

        # Hide empty subplots
        for idx in range(len(self.results), len(axes)):
            axes[idx].set_visible(False)

        plt.tight_layout()
        plt.show()

    def find_optimal_k(self, X, k_range=range(2, 11)):
        """Find optimal number of clusters using multiple methods."""
        X_scaled = self.scaler.fit_transform(X)

        results = {'k': [], 'inertia': [], 'silhouette': [], 'calinski': [], 'davies': []}

        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=self.random_state, n_init=10)
            labels = kmeans.fit_predict(X_scaled)

            results['k'].append(k)
            results['inertia'].append(kmeans.inertia_)
            results['silhouette'].append(silhouette_score(X_scaled, labels))
            results['calinski'].append(calinski_harabasz_score(X_scaled, labels))
            results['davies'].append(davies_bouldin_score(X_scaled, labels))

        # Plot all metrics
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))

        axes[0, 0].plot(results['k'], results['inertia'], 'b-o', linewidth=2)
        axes[0, 0].set_xlabel('K')
        axes[0, 0].set_ylabel('Inertia')
        axes[0, 0].set_title('Elbow Method')
        axes[0, 0].grid(True, alpha=0.3)

        axes[0, 1].plot(results['k'], results['silhouette'], 'r-o', linewidth=2)
        axes[0, 1].set_xlabel('K')
        axes[0, 1].set_ylabel('Silhouette Score')
        axes[0, 1].set_title('Silhouette Analysis')
        axes[0, 1].grid(True, alpha=0.3)

        axes[1, 0].plot(results['k'], results['calinski'], 'g-o', linewidth=2)
        axes[1, 0].set_xlabel('K')
        axes[1, 0].set_ylabel('Calinski-Harabasz Index')
        axes[1, 0].set_title('CH Index Analysis')
        axes[1, 0].grid(True, alpha=0.3)

        axes[1, 1].plot(results['k'], results['davies'], 'm-o', linewidth=2)
        axes[1, 1].set_xlabel('K')
        axes[1, 1].set_ylabel('Davies-Bouldin Index')
        axes[1, 1].set_title('DB Index Analysis (Lower is Better)')
        axes[1, 1].grid(True, alpha=0.3)

        plt.tight_layout()
        plt.show()

        # Suggest optimal K
        optimal_sil = results['k'][np.argmax(results['silhouette'])]
        optimal_cal = results['k'][np.argmax(results['calinski'])]
        optimal_dav = results['k'][np.argmin(results['davies'])]

        print("Suggested Optimal K:")
        print(f"  By Silhouette Score: {optimal_sil}")
        print(f"  By Calinski-Harabasz Index: {optimal_cal}")
        print(f"  By Davies-Bouldin Index: {optimal_dav}")

        return pd.DataFrame(results)


# Example usage
if __name__ == "__main__":
    # Generate sample data
    X, y_true = make_blobs(n_samples=500, centers=4, cluster_std=0.8, random_state=42)

    # Create pipeline and run analysis
    pipeline = ClusteringPipeline(random_state=42)

    # Find optimal K first
    print("Finding optimal number of clusters...")
    k_results = pipeline.find_optimal_k(X)

    # Fit all algorithms with suggested K
    print("\nFitting clustering algorithms...")
    pipeline.fit_all_algorithms(X, n_clusters=4)

    # Show comparison table
    print("\nAlgorithm Comparison:")
    print(pipeline.get_comparison_table().to_string(index=False))

    # Visualize results
    pipeline.plot_results(X)
```

### Customer Segmentation Example

```python
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt

# Generate synthetic customer data
np.random.seed(42)
n_customers = 1000

customer_data = pd.DataFrame({
    'customer_id': range(1, n_customers + 1),
    'age': np.random.normal(40, 12, n_customers).clip(18, 80),
    'annual_income': np.random.lognormal(10.5, 0.5, n_customers).clip(20000, 200000),
    'spending_score': np.random.normal(50, 25, n_customers).clip(1, 100),
    'purchase_frequency': np.random.poisson(12, n_customers),
    'avg_transaction_value': np.random.lognormal(4, 0.8, n_customers).clip(10, 500)
})

# Feature engineering
customer_data['income_per_age'] = customer_data['annual_income'] / customer_data['age']
customer_data['total_annual_spend'] = (customer_data['purchase_frequency'] *
                                        customer_data['avg_transaction_value'] * 12)

# Select features for clustering
features = ['age', 'annual_income', 'spending_score', 'purchase_frequency',
            'avg_transaction_value', 'income_per_age', 'total_annual_spend']
X = customer_data[features].values

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Find optimal K
inertias = []
silhouettes = []
K_range = range(2, 11)

for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    inertias.append(kmeans.inertia_)
    silhouettes.append(silhouette_score(X_scaled, kmeans.labels_))

# Plot elbow and silhouette
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

ax1.plot(K_range, inertias, 'b-o', linewidth=2)
ax1.set_xlabel('Number of Clusters')
ax1.set_ylabel('Inertia')
ax1.set_title('Elbow Method')
ax1.grid(True, alpha=0.3)

ax2.plot(K_range, silhouettes, 'r-o', linewidth=2)
ax2.set_xlabel('Number of Clusters')
ax2.set_ylabel('Silhouette Score')
ax2.set_title('Silhouette Analysis')
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

# Apply K-Means with optimal K
optimal_k = 4
kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
customer_data['cluster'] = kmeans.fit_predict(X_scaled)

# Analyze clusters
cluster_summary = customer_data.groupby('cluster')[features].agg(['mean', 'std'])
print("\nCluster Summary:")
print(cluster_summary.to_string())

# Visualize with PCA
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

plt.figure(figsize=(10, 8))
scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=customer_data['cluster'],
                      cmap='viridis', alpha=0.6, s=50)
plt.xlabel(f'PC1 ({pca.explained_variance_ratio_[0]:.1%} variance)')
plt.ylabel(f'PC2 ({pca.explained_variance_ratio_[1]:.1%} variance)')
plt.title('Customer Segments (PCA Visualization)')
plt.colorbar(scatter, label='Cluster')
plt.show()

# Cluster profiling
print("\nCluster Profiles:")
for cluster in range(optimal_k):
    cluster_data = customer_data[customer_data['cluster'] == cluster]
    print(f"\nCluster {cluster} ({len(cluster_data)} customers):")
    print(f"  Avg Age: {cluster_data['age'].mean():.1f}")
    print(f"  Avg Income: ${cluster_data['annual_income'].mean():,.0f}")
    print(f"  Avg Spending Score: {cluster_data['spending_score'].mean():.1f}")
    print(f"  Avg Purchase Frequency: {cluster_data['purchase_frequency'].mean():.1f}")
    print(f"  Avg Transaction Value: ${cluster_data['avg_transaction_value'].mean():.2f}")
```

## Algorithm Selection Guide

### When to Use Each Algorithm

| Scenario | Recommended Algorithm | Reason |
|----------|----------------------|--------|
| Known number of clusters, spherical shapes | K-Means | Fast, simple, works well |
| Unknown number of clusters, noise present | DBSCAN | Auto-detects clusters and outliers |
| Need probability assignments | GMM | Provides soft clustering |
| Hierarchical structure matters | Hierarchical Clustering | Shows cluster relationships |
| Non-spherical clusters, no noise | GMM or Spectral | Handle complex shapes |
| Very large dataset | Mini-Batch K-Means | Scalable |
| High-dimensional data | K-Means after PCA | Reduce curse of dimensionality |
| Different density clusters | OPTICS or HDBSCAN | Handle varying densities |

### Algorithm Complexity Comparison

| Algorithm | Time Complexity | Space Complexity | Scalability |
|-----------|-----------------|------------------|-------------|
| K-Means | O(n * k * i * d) | O(n * d + k * d) | Good |
| Mini-Batch K-Means | O(n * k * d) | O(b * d + k * d) | Excellent |
| DBSCAN | O(n * log n) to O(n^2) | O(n) | Moderate |
| Hierarchical | O(n^3) or O(n^2 log n) | O(n^2) | Poor |
| GMM | O(n * k * d^2 * i) | O(n * k + k * d^2) | Moderate |

where: n = samples, k = clusters, i = iterations, d = dimensions, b = batch size

### Decision Flowchart

```
Start
  |
  v
Is K known? ---No---> Need outlier detection? ---Yes---> DBSCAN
  |                         |
  Yes                       No
  |                         |
  v                         v
Spherical clusters? ---No---> GMM or Spectral Clustering
  |
  Yes
  |
  v
Large dataset? ---Yes---> Mini-Batch K-Means
  |
  No
  |
  v
K-Means (with K-Means++ init)
```

## Best Practices and Common Pitfalls

### Best Practices

1. **Always scale features**: Most clustering algorithms are sensitive to feature scales
2. **Handle outliers**: Either remove them or use robust algorithms like DBSCAN
3. **Use multiple metrics**: No single metric is perfect; combine several for evaluation
4. **Validate cluster interpretability**: Clusters should make sense in context
5. **Consider domain knowledge**: Use business understanding to guide K selection
6. **Run multiple initializations**: K-Means can converge to local optima
7. **Visualize results**: Use PCA/t-SNE to understand cluster structure

### Common Pitfalls

| Pitfall | Impact | Solution |
|---------|--------|----------|
| Not scaling features | Dominant features bias results | Use StandardScaler |
| Wrong K selection | Poor cluster quality | Use multiple methods (elbow, silhouette) |
| Ignoring outliers | Distorted centroids | Use DBSCAN or remove outliers |
| High dimensionality | Curse of dimensionality | Apply PCA first |
| Assuming spherical clusters | Missing true structure | Use GMM or DBSCAN |
| Single initialization | Suboptimal solution | Use n_init > 1 in K-Means |

## Interview Key Points

### Common Interview Questions

**Q1: Explain the difference between K-Means and DBSCAN.**

K-Means:
- Requires specifying K (number of clusters)
- Assumes spherical, equally-sized clusters
- Sensitive to outliers
- Every point is assigned to a cluster

DBSCAN:
- Automatically determines number of clusters
- Can find arbitrarily shaped clusters
- Identifies outliers as noise
- Based on density, not distance to centroids

**Q2: How do you choose the optimal number of clusters?**

Multiple methods should be used together:
- Elbow method: Look for bend in inertia curve
- Silhouette analysis: Maximize average silhouette score
- Calinski-Harabasz Index: Maximize CH score
- Domain knowledge: Business requirements may dictate K
- Gap statistic: Compare to null reference distribution

**Q3: What is the difference between hard and soft clustering?**

Hard clustering:
- Each point belongs to exactly one cluster
- Examples: K-Means, DBSCAN
- Output: Discrete labels

Soft clustering:
- Each point has probability of belonging to each cluster
- Examples: GMM, Fuzzy C-Means
- Output: Probability distribution over clusters

**Q4: Why is feature scaling important for clustering?**

- Distance-based algorithms are affected by feature magnitudes
- Features with larger ranges will dominate distance calculations
- Scaling ensures all features contribute equally
- StandardScaler (z-score) or MinMaxScaler commonly used

**Q5: How does DBSCAN handle outliers?**

DBSCAN classifies points into three categories:
- Core points: Have min_samples neighbors within eps
- Border points: Within eps of core point but fewer neighbors
- Noise points: Neither core nor border (outliers)

Noise points are assigned label -1 and excluded from clusters.

**Q6: Explain the EM algorithm in GMM.**

E-Step (Expectation):
- Calculate responsibility (probability) that each component generated each point
- Uses current parameter estimates

M-Step (Maximization):
- Update parameters (means, covariances, weights) to maximize likelihood
- Uses responsibilities from E-step

Iterate until convergence (likelihood stops improving).

### Key Concepts Summary

| Concept | Definition | Importance |
|---------|------------|------------|
| Inertia | Within-cluster sum of squares | K-Means objective |
| Silhouette | Cluster cohesion vs separation | Cluster quality metric |
| Core Point | Point with min_samples neighbors | DBSCAN building block |
| Linkage | Method to measure cluster distance | Hierarchical clustering |
| Mixing Coefficient | Component weight in GMM | Soft clustering |
| Covariance Type | GMM parameter constraint | Model flexibility |

## Further Reading

### Recommended Books

- **"Pattern Recognition and Machine Learning"** (Christopher Bishop): Comprehensive coverage of GMM and EM
- **"Introduction to Statistical Learning"** (James et al.): Practical clustering overview
- **"Data Mining: Concepts and Techniques"** (Han, Kamber, Pei): DBSCAN and density-based methods
- **"Elements of Statistical Learning"** (Hastie et al.): Mathematical foundations

### Key Papers

- MacQueen, J. (1967): "Some methods for classification and analysis of multivariate observations" (K-Means)
- Ester, M. et al. (1996): "A density-based algorithm for discovering clusters" (DBSCAN)
- Arthur, D. & Vassilvitskii, S. (2007): "k-means++: The advantages of careful seeding"

### Online Resources

- [Scikit-learn Clustering Documentation](https://scikit-learn.org/stable/modules/clustering.html)
- [Google Machine Learning Crash Course - Clustering](https://developers.google.com/machine-learning/clustering)
- [Stanford CS229 Lecture Notes on Clustering](https://cs229.stanford.edu/)

### Advanced Topics

- **Spectral Clustering**: Graph-based clustering using eigendecomposition
- **HDBSCAN**: Hierarchical DBSCAN for varying density
- **Mean Shift**: Mode-seeking algorithm for finding dense regions
- **OPTICS**: Ordering points to identify clustering structure
- **Deep Clustering**: Using neural networks for clustering
- **Consensus Clustering**: Combining multiple clustering results

## Summary

This guide covered the fundamental clustering algorithms essential for any machine learning practitioner:

1. **K-Means**: The workhorse algorithm for partition-based clustering with spherical assumptions
2. **K-Means++**: Smart initialization for better convergence
3. **DBSCAN**: Density-based clustering that handles arbitrary shapes and identifies outliers
4. **Hierarchical Clustering**: Builds cluster hierarchies for interpretable results
5. **GMM**: Probabilistic clustering with soft assignments and flexible cluster shapes

Key takeaways:

- **No single algorithm fits all problems**: Choose based on data characteristics and requirements
- **Feature scaling is critical**: Always preprocess data before clustering
- **Use multiple evaluation metrics**: Silhouette, CH Index, and Davies-Bouldin provide different perspectives
- **Validate clusters**: Ensure clusters are meaningful and actionable in your domain
- **Consider computational complexity**: Scale algorithm choice to data size

Mastering these algorithms provides a strong foundation for unsupervised learning and enables effective data exploration, segmentation, and pattern discovery across various domains.
