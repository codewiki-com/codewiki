---
title: "Recommender Systems: Collaborative Filtering"
description: "Master recommendation basics: user/item-based CF and matrix factorization"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - collaborative filtering
  - recommender systems
  - matrix factorization
  - ALS
status: imported
origin: old/src/content/docs/datascience/collaborative-filtering.en.md
divergence: 0.206
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DataScience
  subcategory: Recommender
  order: 24
  lastUpdated: 2026-01-07
---

Recommender systems have become an integral part of modern digital experiences, powering personalized suggestions on platforms like Netflix, Amazon, Spotify, and YouTube. Among the various approaches to building recommender systems, Collaborative Filtering (CF) stands out as one of the most successful and widely adopted techniques. This comprehensive guide covers the fundamentals of recommender systems, deep dives into user-based and item-based collaborative filtering, explores similarity computation methods, examines matrix factorization techniques, and provides practical implementation examples.

## Recommender System Overview

### What is a Recommender System?

A recommender system is an information filtering system that predicts the preferences or ratings a user would give to items they have not yet interacted with. The goal is to help users discover relevant content from a large pool of options, reducing information overload and improving user experience.

**Core Components:**
- **Users**: Individuals who interact with the system
- **Items**: Products, content, or services being recommended
- **Interactions**: User actions such as ratings, purchases, clicks, or views
- **Recommendation Engine**: The algorithm that generates predictions

### Types of Recommender Systems

| Approach | Description | Strengths | Weaknesses |
|----------|-------------|-----------|------------|
| **Collaborative Filtering** | Uses collective user behavior patterns | Discovers latent features, no content analysis needed | Cold start problem, sparsity |
| **Content-Based** | Uses item attributes and user preferences | Works for new items, transparent recommendations | Limited discovery, requires rich content metadata |
| **Hybrid** | Combines multiple approaches | Mitigates individual weaknesses | Increased complexity |
| **Knowledge-Based** | Uses explicit domain knowledge | Handles complex requirements | Requires extensive domain expertise |

### Collaborative Filtering Philosophy

Collaborative filtering is based on a simple yet powerful assumption: **users who agreed in the past will agree in the future**. If User A and User B both liked movies X and Y, and User A also liked movie Z, then User B is likely to enjoy movie Z as well.

```python
import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.metrics.pairwise import cosine_similarity

# Example: User-Item interaction matrix
# Rows = Users, Columns = Items, Values = Ratings (0 = not rated)
ratings_matrix = np.array([
    [5, 3, 0, 1, 4],  # User 0
    [4, 0, 0, 1, 0],  # User 1
    [1, 1, 0, 5, 4],  # User 2
    [0, 0, 5, 4, 0],  # User 3
    [0, 1, 5, 4, 0],  # User 4
])

users = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve']
items = ['Item_A', 'Item_B', 'Item_C', 'Item_D', 'Item_E']

df = pd.DataFrame(ratings_matrix, index=users, columns=items)
print("User-Item Rating Matrix:")
print(df)
```

### Explicit vs Implicit Feedback

**Explicit Feedback:**
- Direct user input: ratings, likes/dislikes, reviews
- Clear indication of preference
- Often sparse (users rate few items)
- Examples: 5-star ratings, thumbs up/down

**Implicit Feedback:**
- Inferred from user behavior: views, clicks, purchases, time spent
- More abundant but noisier
- Only indicates positive preference (absence is ambiguous)
- Examples: purchase history, watch time, page views

```python
# Explicit feedback example
explicit_ratings = pd.DataFrame({
    'user_id': [1, 1, 2, 2, 3],
    'item_id': ['A', 'B', 'A', 'C', 'B'],
    'rating': [5, 3, 4, 2, 5]  # Direct ratings
})

# Implicit feedback example
implicit_interactions = pd.DataFrame({
    'user_id': [1, 1, 1, 2, 2, 3, 3, 3],
    'item_id': ['A', 'A', 'B', 'A', 'C', 'B', 'B', 'D'],
    'event_type': ['view', 'purchase', 'view', 'view', 'view', 'view', 'purchase', 'view'],
    'timestamp': pd.date_range('2024-01-01', periods=8, freq='H')
})

# Convert implicit to confidence scores
def compute_confidence(df, weights={'view': 1, 'purchase': 5}):
    """Convert implicit interactions to confidence scores."""
    df['weight'] = df['event_type'].map(weights)
    confidence = df.groupby(['user_id', 'item_id'])['weight'].sum().unstack(fill_value=0)
    return confidence

confidence_matrix = compute_confidence(implicit_interactions)
print("Implicit Confidence Matrix:")
print(confidence_matrix)
```

---

## User-Based Collaborative Filtering

User-based collaborative filtering (User-CF) recommends items by finding similar users and suggesting items that those similar users have liked. It operates on the principle that users with similar tastes in the past will have similar tastes in the future.

### Algorithm Overview

**Steps:**
1. Build a user-item interaction matrix
2. Compute similarity between all pairs of users
3. For a target user, find the k most similar users (neighbors)
4. Predict ratings for unrated items based on neighbors' ratings
5. Recommend top-N items with highest predicted ratings

```python
class UserBasedCF:
    """User-Based Collaborative Filtering implementation."""

    def __init__(self, k_neighbors=5, similarity_metric='cosine'):
        self.k = k_neighbors
        self.similarity_metric = similarity_metric
        self.user_similarity = None
        self.ratings_matrix = None
        self.user_means = None

    def fit(self, ratings_matrix):
        """
        Fit the model with a user-item ratings matrix.

        Parameters:
        -----------
        ratings_matrix : np.ndarray
            User-item matrix where rows are users and columns are items.
            0 indicates no rating.
        """
        self.ratings_matrix = ratings_matrix.copy()

        # Calculate user mean ratings (excluding zeros)
        masked = np.ma.masked_equal(ratings_matrix, 0)
        self.user_means = np.array(masked.mean(axis=1)).flatten()

        # Mean-center the ratings for similarity computation
        ratings_centered = ratings_matrix.copy().astype(float)
        for i in range(ratings_matrix.shape[0]):
            mask = ratings_matrix[i] != 0
            ratings_centered[i, mask] -= self.user_means[i]
            ratings_centered[i, ~mask] = 0

        # Compute user similarity matrix
        if self.similarity_metric == 'cosine':
            self.user_similarity = cosine_similarity(ratings_centered)
        elif self.similarity_metric == 'pearson':
            self.user_similarity = np.corrcoef(ratings_centered)
            self.user_similarity = np.nan_to_num(self.user_similarity)

        # Set self-similarity to 0 to exclude from neighbors
        np.fill_diagonal(self.user_similarity, 0)

        return self

    def predict(self, user_idx, item_idx):
        """
        Predict rating for a specific user-item pair.

        Returns weighted average of similar users' ratings.
        """
        # Get k most similar users who have rated this item
        similarities = self.user_similarity[user_idx].copy()

        # Only consider users who rated this item
        rated_mask = self.ratings_matrix[:, item_idx] != 0
        similarities[~rated_mask] = 0

        # Get top k neighbors
        top_k_idx = np.argsort(similarities)[-self.k:]
        top_k_sim = similarities[top_k_idx]

        if np.sum(np.abs(top_k_sim)) == 0:
            return self.user_means[user_idx]

        # Weighted average prediction
        neighbor_ratings = self.ratings_matrix[top_k_idx, item_idx]
        neighbor_means = self.user_means[top_k_idx]

        # Adjusted ratings (mean-centered)
        adjusted_ratings = neighbor_ratings - neighbor_means

        prediction = self.user_means[user_idx] + \
                     np.dot(top_k_sim, adjusted_ratings) / np.sum(np.abs(top_k_sim))

        return np.clip(prediction, 1, 5)  # Clip to valid rating range

    def recommend(self, user_idx, n_recommendations=5):
        """
        Generate top-N recommendations for a user.
        """
        predictions = []
        for item_idx in range(self.ratings_matrix.shape[1]):
            # Only predict for unrated items
            if self.ratings_matrix[user_idx, item_idx] == 0:
                pred = self.predict(user_idx, item_idx)
                predictions.append((item_idx, pred))

        # Sort by predicted rating and return top N
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:n_recommendations]


# Example usage
ratings = np.array([
    [5, 3, 0, 1, 4],
    [4, 0, 0, 1, 0],
    [1, 1, 0, 5, 4],
    [0, 0, 5, 4, 0],
    [0, 1, 5, 4, 0],
])

model = UserBasedCF(k_neighbors=3)
model.fit(ratings)

# Get recommendations for user 1 (Bob)
recommendations = model.recommend(user_idx=1, n_recommendations=3)
print(f"Top recommendations for Bob: {recommendations}")
```

### Prediction Formula

The predicted rating $\hat{r}_{ui}$ for user $u$ on item $i$ is computed as:

$$\hat{r}_{ui} = \bar{r}_u + \frac{\sum_{v \in N(u)} sim(u, v) \cdot (r_{vi} - \bar{r}_v)}{\sum_{v \in N(u)} |sim(u, v)|}$$

Where:
- $\bar{r}_u$ is the mean rating of user $u$
- $N(u)$ is the set of k nearest neighbors of user $u$ who rated item $i$
- $sim(u, v)$ is the similarity between users $u$ and $v$
- $r_{vi}$ is the rating user $v$ gave to item $i$

### Advantages and Disadvantages

**Advantages:**
- Intuitive and easy to explain
- Can discover unexpected interests
- No need for item content information
- Works well when user-item matrix is dense

**Disadvantages:**
- Does not scale well (O(n^2) user comparisons)
- Sensitive to sparse data
- New users have no history (cold start)
- User preferences may change over time

---

## Item-Based Collaborative Filtering

Item-based collaborative filtering (Item-CF) takes a different approach: instead of finding similar users, it finds similar items. It recommends items similar to those the user has already liked.

### Algorithm Overview

**Steps:**
1. Build a user-item interaction matrix
2. Compute similarity between all pairs of items
3. For each item a user has rated, find the k most similar items
4. Predict ratings based on the user's ratings of similar items
5. Recommend top-N items with highest predicted ratings

```python
class ItemBasedCF:
    """Item-Based Collaborative Filtering implementation."""

    def __init__(self, k_neighbors=5, similarity_metric='cosine'):
        self.k = k_neighbors
        self.similarity_metric = similarity_metric
        self.item_similarity = None
        self.ratings_matrix = None

    def fit(self, ratings_matrix):
        """
        Fit the model with a user-item ratings matrix.

        Parameters:
        -----------
        ratings_matrix : np.ndarray
            User-item matrix where rows are users and columns are items.
        """
        self.ratings_matrix = ratings_matrix.copy()

        # Transpose: now rows are items, columns are users
        item_matrix = ratings_matrix.T.astype(float)

        # Mean-center each item's ratings
        item_centered = item_matrix.copy()
        for i in range(item_matrix.shape[0]):
            mask = item_matrix[i] != 0
            if np.sum(mask) > 0:
                mean_rating = np.mean(item_matrix[i, mask])
                item_centered[i, mask] -= mean_rating
                item_centered[i, ~mask] = 0

        # Compute item similarity matrix
        if self.similarity_metric == 'cosine':
            self.item_similarity = cosine_similarity(item_centered)
        elif self.similarity_metric == 'adjusted_cosine':
            # Adjusted cosine: center by user mean instead of item mean
            user_means = np.array([
                np.mean(ratings_matrix[u, ratings_matrix[u] != 0])
                if np.any(ratings_matrix[u] != 0) else 0
                for u in range(ratings_matrix.shape[0])
            ])
            adjusted = ratings_matrix.T.copy().astype(float)
            for i in range(adjusted.shape[0]):
                for u in range(adjusted.shape[1]):
                    if adjusted[i, u] != 0:
                        adjusted[i, u] -= user_means[u]
            self.item_similarity = cosine_similarity(adjusted)

        # Set self-similarity to 0
        np.fill_diagonal(self.item_similarity, 0)

        return self

    def predict(self, user_idx, item_idx):
        """
        Predict rating for a specific user-item pair.
        """
        # Get similarities of target item with all other items
        similarities = self.item_similarity[item_idx].copy()

        # Only consider items the user has rated
        user_ratings = self.ratings_matrix[user_idx]
        rated_mask = user_ratings != 0
        similarities[~rated_mask] = 0

        # Get top k similar items that user has rated
        top_k_idx = np.argsort(similarities)[-self.k:]
        top_k_sim = similarities[top_k_idx]

        if np.sum(np.abs(top_k_sim)) == 0:
            # Fallback to user's mean rating
            user_rated = user_ratings[user_ratings != 0]
            return np.mean(user_rated) if len(user_rated) > 0 else 3.0

        # Weighted average prediction
        neighbor_ratings = user_ratings[top_k_idx]
        prediction = np.dot(top_k_sim, neighbor_ratings) / np.sum(np.abs(top_k_sim))

        return np.clip(prediction, 1, 5)

    def recommend(self, user_idx, n_recommendations=5):
        """
        Generate top-N recommendations for a user.
        """
        predictions = []
        for item_idx in range(self.ratings_matrix.shape[1]):
            if self.ratings_matrix[user_idx, item_idx] == 0:
                pred = self.predict(user_idx, item_idx)
                predictions.append((item_idx, pred))

        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:n_recommendations]


# Example usage
item_cf = ItemBasedCF(k_neighbors=3, similarity_metric='adjusted_cosine')
item_cf.fit(ratings)

# Get recommendations for user 1 (Bob)
recommendations = item_cf.recommend(user_idx=1, n_recommendations=3)
print(f"Top recommendations for Bob (Item-CF): {recommendations}")
```

### Prediction Formula

The predicted rating $\hat{r}_{ui}$ for user $u$ on item $i$ is:

$$\hat{r}_{ui} = \frac{\sum_{j \in N(i)} sim(i, j) \cdot r_{uj}}{\sum_{j \in N(i)} |sim(i, j)|}$$

Where:
- $N(i)$ is the set of k items most similar to item $i$ that user $u$ has rated
- $sim(i, j)$ is the similarity between items $i$ and $j$
- $r_{uj}$ is the rating user $u$ gave to item $j$

### User-CF vs Item-CF Comparison

| Aspect | User-Based CF | Item-Based CF |
|--------|---------------|---------------|
| **Computation** | Compare users | Compare items |
| **Scalability** | Better when items >> users | Better when users >> items |
| **Stability** | Less stable (user preferences change) | More stable (item characteristics fixed) |
| **Update Frequency** | Recompute on new users | Similarity can be precomputed |
| **Use Case** | News, dynamic content | E-commerce, movies |
| **Amazon's Choice** | - | Adopted Item-CF for scalability |

---

## Similarity Computation

The choice of similarity metric significantly impacts recommendation quality. Different metrics capture different aspects of user or item similarity.

### Cosine Similarity

Measures the cosine of the angle between two vectors:

$$sim(u, v) = \frac{\vec{u} \cdot \vec{v}}{||\vec{u}|| \cdot ||\vec{v}||} = \frac{\sum_i r_{ui} \cdot r_{vi}}{\sqrt{\sum_i r_{ui}^2} \cdot \sqrt{\sum_i r_{vi}^2}}$$

```python
def cosine_sim(vec1, vec2):
    """
    Compute cosine similarity between two vectors.
    """
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return dot_product / (norm1 * norm2)

# Example
user1 = np.array([5, 3, 0, 1, 4])
user2 = np.array([4, 0, 0, 1, 0])

# Only consider co-rated items
mask = (user1 != 0) & (user2 != 0)
sim = cosine_sim(user1[mask], user2[mask])
print(f"Cosine similarity: {sim:.4f}")
```

### Pearson Correlation

Measures linear correlation between two vectors, accounting for rating scale differences:

$$sim(u, v) = \frac{\sum_i (r_{ui} - \bar{r}_u)(r_{vi} - \bar{r}_v)}{\sqrt{\sum_i (r_{ui} - \bar{r}_u)^2} \cdot \sqrt{\sum_i (r_{vi} - \bar{r}_v)^2}}$$

```python
def pearson_correlation(vec1, vec2):
    """
    Compute Pearson correlation between two vectors.
    Only considers co-rated items.
    """
    # Find co-rated items
    mask = (vec1 != 0) & (vec2 != 0)

    if np.sum(mask) < 2:
        return 0.0

    v1 = vec1[mask]
    v2 = vec2[mask]

    mean1 = np.mean(v1)
    mean2 = np.mean(v2)

    numerator = np.sum((v1 - mean1) * (v2 - mean2))
    denominator = np.sqrt(np.sum((v1 - mean1)**2)) * np.sqrt(np.sum((v2 - mean2)**2))

    if denominator == 0:
        return 0.0

    return numerator / denominator

# Example
sim = pearson_correlation(user1, user2)
print(f"Pearson correlation: {sim:.4f}")
```

### Adjusted Cosine Similarity

For item-based CF, accounts for user rating scale differences:

$$sim(i, j) = \frac{\sum_{u \in U} (r_{ui} - \bar{r}_u)(r_{uj} - \bar{r}_u)}{\sqrt{\sum_{u \in U} (r_{ui} - \bar{r}_u)^2} \cdot \sqrt{\sum_{u \in U} (r_{uj} - \bar{r}_u)^2}}$$

```python
def adjusted_cosine_similarity(ratings_matrix):
    """
    Compute adjusted cosine similarity between items.

    Parameters:
    -----------
    ratings_matrix : np.ndarray
        User-item matrix (users x items)

    Returns:
    --------
    np.ndarray : Item similarity matrix (items x items)
    """
    n_users, n_items = ratings_matrix.shape

    # Compute user means (only from rated items)
    user_means = np.zeros(n_users)
    for u in range(n_users):
        rated = ratings_matrix[u, ratings_matrix[u] != 0]
        user_means[u] = np.mean(rated) if len(rated) > 0 else 0

    # Subtract user means from ratings
    adjusted = ratings_matrix.copy().astype(float)
    for u in range(n_users):
        mask = ratings_matrix[u] != 0
        adjusted[u, mask] -= user_means[u]
        adjusted[u, ~mask] = 0

    # Compute item similarity
    item_sim = np.zeros((n_items, n_items))

    for i in range(n_items):
        for j in range(i, n_items):
            # Users who rated both items
            mask = (ratings_matrix[:, i] != 0) & (ratings_matrix[:, j] != 0)

            if np.sum(mask) == 0:
                continue

            vec_i = adjusted[mask, i]
            vec_j = adjusted[mask, j]

            numerator = np.dot(vec_i, vec_j)
            denominator = np.linalg.norm(vec_i) * np.linalg.norm(vec_j)

            if denominator > 0:
                item_sim[i, j] = numerator / denominator
                item_sim[j, i] = item_sim[i, j]

    return item_sim

# Example
item_sim_matrix = adjusted_cosine_similarity(ratings)
print("Adjusted Cosine Similarity Matrix:")
print(pd.DataFrame(item_sim_matrix, index=items, columns=items).round(3))
```

### Jaccard Similarity

For binary (implicit) feedback, measures overlap between sets:

$$sim(u, v) = \frac{|I_u \cap I_v|}{|I_u \cup I_v|}$$

```python
def jaccard_similarity(set1, set2):
    """
    Compute Jaccard similarity between two sets.
    """
    intersection = len(set1 & set2)
    union = len(set1 | set2)

    return intersection / union if union > 0 else 0

# Example: Items purchased by users
user1_items = {'A', 'B', 'D', 'E'}
user2_items = {'A', 'D', 'F'}

sim = jaccard_similarity(user1_items, user2_items)
print(f"Jaccard similarity: {sim:.4f}")
```

### Similarity Metric Comparison

| Metric | Best For | Handles Rating Scale | Sparsity Robust |
|--------|----------|---------------------|-----------------|
| **Cosine** | General purpose | No | Medium |
| **Pearson** | Users with different rating scales | Yes | Low |
| **Adjusted Cosine** | Item-based CF | Yes | Medium |
| **Jaccard** | Binary/implicit feedback | N/A | High |

---

## Matrix Factorization

Matrix factorization techniques decompose the sparse user-item matrix into lower-dimensional latent factor matrices. This approach captures hidden features that explain user preferences and item characteristics.

### Concept and Intuition

The idea is to represent users and items in a shared latent space of k dimensions:

$$R \approx U \cdot V^T$$

Where:
- $R$ is the $m \times n$ user-item rating matrix
- $U$ is the $m \times k$ user latent factor matrix
- $V$ is the $n \times k$ item latent factor matrix
- $k$ is the number of latent factors (typically 10-200)

Each latent factor might represent abstract concepts like "action vs romance" or "mainstream vs indie" for movies.

```python
import numpy as np

# Conceptual illustration of latent factors
# User factors: How much each user aligns with each latent factor
user_factors = np.array([
    [0.8, 0.2],  # User 0: likes action (factor 1), not romance (factor 2)
    [0.3, 0.9],  # User 1: likes romance more
    [0.6, 0.5],  # User 2: balanced
])

# Item factors: How much each item represents each latent factor
item_factors = np.array([
    [0.9, 0.1],  # Item A: action movie
    [0.2, 0.8],  # Item B: romance movie
    [0.5, 0.5],  # Item C: action-romance mix
])

# Predicted ratings = dot product of user and item factors
predicted_ratings = np.dot(user_factors, item_factors.T)
print("Predicted Rating Matrix:")
print(pd.DataFrame(
    predicted_ratings.round(2),
    index=['User_0', 'User_1', 'User_2'],
    columns=['Action', 'Romance', 'Mixed']
))
```

### Singular Value Decomposition (SVD)

SVD factorizes the matrix into three components:

$$R = U \Sigma V^T$$

Where $\Sigma$ is a diagonal matrix of singular values.

```python
from scipy.sparse.linalg import svds

def svd_recommendations(ratings_matrix, k=2):
    """
    Perform SVD-based matrix factorization.

    Parameters:
    -----------
    ratings_matrix : np.ndarray
        User-item matrix
    k : int
        Number of latent factors

    Returns:
    --------
    np.ndarray : Predicted ratings matrix
    """
    # Fill missing values with column means for SVD
    ratings_filled = ratings_matrix.copy().astype(float)
    col_means = np.nanmean(np.where(ratings_matrix == 0, np.nan, ratings_matrix), axis=0)
    col_means = np.nan_to_num(col_means, nan=0)

    for j in range(ratings_filled.shape[1]):
        ratings_filled[ratings_filled[:, j] == 0, j] = col_means[j]

    # Perform SVD
    U, sigma, Vt = svds(ratings_filled, k=k)

    # Reconstruct the matrix
    sigma_diag = np.diag(sigma)
    predicted = np.dot(np.dot(U, sigma_diag), Vt)

    return predicted


# Example
predicted = svd_recommendations(ratings, k=2)
print("\nSVD Predicted Ratings:")
print(pd.DataFrame(predicted.round(2), index=users, columns=items))
```

### Alternating Least Squares (ALS)

ALS is particularly effective for implicit feedback and scales well to large datasets. It alternates between fixing user factors and optimizing item factors, then vice versa.

**Objective Function:**

$$\min_{U, V} \sum_{(u,i) \in K} (r_{ui} - u_u^T v_i)^2 + \lambda (||U||^2 + ||V||^2)$$

Where $\lambda$ is the regularization parameter.

```python
class ALSRecommender:
    """
    Alternating Least Squares Matrix Factorization.
    """

    def __init__(self, n_factors=10, regularization=0.1, n_iterations=20):
        self.n_factors = n_factors
        self.reg = regularization
        self.n_iter = n_iterations
        self.user_factors = None
        self.item_factors = None

    def fit(self, ratings_matrix):
        """
        Fit the ALS model.

        Parameters:
        -----------
        ratings_matrix : np.ndarray
            User-item ratings matrix
        """
        n_users, n_items = ratings_matrix.shape

        # Initialize factor matrices randomly
        np.random.seed(42)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))

        # Create mask for observed ratings
        mask = ratings_matrix != 0

        for iteration in range(self.n_iter):
            # Fix items, solve for users
            self._update_users(ratings_matrix, mask)

            # Fix users, solve for items
            self._update_items(ratings_matrix, mask)

            # Calculate RMSE for monitoring
            if (iteration + 1) % 5 == 0:
                rmse = self._compute_rmse(ratings_matrix, mask)
                print(f"Iteration {iteration + 1}, RMSE: {rmse:.4f}")

        return self

    def _update_users(self, ratings, mask):
        """Update user factors while keeping item factors fixed."""
        n_users = ratings.shape[0]

        for u in range(n_users):
            # Items rated by user u
            rated_items = mask[u]
            if not np.any(rated_items):
                continue

            V_u = self.item_factors[rated_items]  # Items rated by user
            r_u = ratings[u, rated_items]  # Ratings by user

            # Solve: (V^T V + lambda*I) * x = V^T * r
            A = V_u.T @ V_u + self.reg * np.eye(self.n_factors)
            b = V_u.T @ r_u
            self.user_factors[u] = np.linalg.solve(A, b)

    def _update_items(self, ratings, mask):
        """Update item factors while keeping user factors fixed."""
        n_items = ratings.shape[1]

        for i in range(n_items):
            # Users who rated item i
            rating_users = mask[:, i]
            if not np.any(rating_users):
                continue

            U_i = self.user_factors[rating_users]
            r_i = ratings[rating_users, i]

            A = U_i.T @ U_i + self.reg * np.eye(self.n_factors)
            b = U_i.T @ r_i
            self.item_factors[i] = np.linalg.solve(A, b)

    def _compute_rmse(self, ratings, mask):
        """Compute RMSE on observed ratings."""
        predictions = self.user_factors @ self.item_factors.T
        errors = (ratings - predictions)[mask]
        return np.sqrt(np.mean(errors ** 2))

    def predict(self, user_idx, item_idx):
        """Predict rating for user-item pair."""
        return np.dot(self.user_factors[user_idx], self.item_factors[item_idx])

    def recommend(self, user_idx, n_recommendations=5, exclude_rated=True):
        """Generate recommendations for a user."""
        scores = self.user_factors[user_idx] @ self.item_factors.T

        if exclude_rated:
            # Set scores for already rated items to -inf
            rated_items = np.where(ratings[user_idx] != 0)[0]
            scores[rated_items] = -np.inf

        top_items = np.argsort(scores)[::-1][:n_recommendations]
        return [(idx, scores[idx]) for idx in top_items]


# Example usage
als = ALSRecommender(n_factors=3, regularization=0.1, n_iterations=20)
als.fit(ratings)

print("\nALS Recommendations for Bob:")
recs = als.recommend(user_idx=1, n_recommendations=3)
for item_idx, score in recs:
    print(f"  {items[item_idx]}: {score:.3f}")
```

### ALS for Implicit Feedback

For implicit feedback, we modify ALS to use confidence weights:

$$\min_{U, V} \sum_{u,i} c_{ui}(p_{ui} - u_u^T v_i)^2 + \lambda (||U||^2 + ||V||^2)$$

Where:
- $p_{ui} = 1$ if user $u$ interacted with item $i$, else $0$
- $c_{ui} = 1 + \alpha \cdot r_{ui}$ is the confidence in the preference

```python
class ImplicitALS:
    """
    ALS for implicit feedback data.
    Based on "Collaborative Filtering for Implicit Feedback Datasets" (Hu et al., 2008)
    """

    def __init__(self, n_factors=40, regularization=0.1, alpha=40, n_iterations=15):
        self.n_factors = n_factors
        self.reg = regularization
        self.alpha = alpha  # Confidence scaling factor
        self.n_iter = n_iterations

    def fit(self, interaction_matrix):
        """
        Fit the model on implicit feedback data.

        Parameters:
        -----------
        interaction_matrix : np.ndarray
            User-item interaction counts (e.g., number of plays, views)
        """
        n_users, n_items = interaction_matrix.shape

        # Binary preference matrix
        P = (interaction_matrix > 0).astype(float)

        # Confidence matrix: C = 1 + alpha * interactions
        C = 1 + self.alpha * interaction_matrix

        # Initialize factors
        np.random.seed(42)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))

        for iteration in range(self.n_iter):
            # Update users
            self._update_users_implicit(P, C)
            # Update items
            self._update_items_implicit(P, C)

            if (iteration + 1) % 5 == 0:
                loss = self._compute_loss(P, C)
                print(f"Iteration {iteration + 1}, Loss: {loss:.4f}")

        return self

    def _update_users_implicit(self, P, C):
        """Update user factors for implicit feedback."""
        VTV = self.item_factors.T @ self.item_factors
        reg_I = self.reg * np.eye(self.n_factors)

        for u in range(P.shape[0]):
            # Diagonal confidence matrix for user u
            C_u = np.diag(C[u])

            # (V^T C_u V + reg*I)^-1 V^T C_u p_u
            A = self.item_factors.T @ C_u @ self.item_factors + reg_I
            b = self.item_factors.T @ C_u @ P[u]
            self.user_factors[u] = np.linalg.solve(A, b)

    def _update_items_implicit(self, P, C):
        """Update item factors for implicit feedback."""
        UTU = self.user_factors.T @ self.user_factors
        reg_I = self.reg * np.eye(self.n_factors)

        for i in range(P.shape[1]):
            C_i = np.diag(C[:, i])

            A = self.user_factors.T @ C_i @ self.user_factors + reg_I
            b = self.user_factors.T @ C_i @ P[:, i]
            self.item_factors[i] = np.linalg.solve(A, b)

    def _compute_loss(self, P, C):
        """Compute weighted loss."""
        predictions = self.user_factors @ self.item_factors.T
        weighted_errors = C * (P - predictions) ** 2
        reg_term = self.reg * (
            np.sum(self.user_factors ** 2) + np.sum(self.item_factors ** 2)
        )
        return np.sum(weighted_errors) + reg_term

    def recommend(self, user_idx, n_recommendations=10):
        """Generate recommendations."""
        scores = self.user_factors[user_idx] @ self.item_factors.T
        top_items = np.argsort(scores)[::-1][:n_recommendations]
        return [(idx, scores[idx]) for idx in top_items]
```

### Stochastic Gradient Descent (SGD) Approach

SGD is an alternative optimization method that updates parameters after each observed rating:

```python
class SGDMatrixFactorization:
    """
    Matrix Factorization using Stochastic Gradient Descent.
    """

    def __init__(self, n_factors=10, learning_rate=0.01, regularization=0.02,
                 n_epochs=20, use_bias=True):
        self.n_factors = n_factors
        self.lr = learning_rate
        self.reg = regularization
        self.n_epochs = n_epochs
        self.use_bias = use_bias

    def fit(self, ratings_matrix):
        """
        Fit the model using SGD.
        """
        n_users, n_items = ratings_matrix.shape

        # Initialize parameters
        np.random.seed(42)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))

        if self.use_bias:
            self.global_mean = np.mean(ratings_matrix[ratings_matrix != 0])
            self.user_bias = np.zeros(n_users)
            self.item_bias = np.zeros(n_items)

        # Get observed ratings
        users, items = np.where(ratings_matrix != 0)
        ratings = ratings_matrix[users, items]

        for epoch in range(self.n_epochs):
            # Shuffle training data
            indices = np.random.permutation(len(ratings))

            for idx in indices:
                u, i, r = users[idx], items[idx], ratings[idx]

                # Compute prediction
                pred = self._predict_single(u, i)
                error = r - pred

                # Update biases
                if self.use_bias:
                    self.user_bias[u] += self.lr * (error - self.reg * self.user_bias[u])
                    self.item_bias[i] += self.lr * (error - self.reg * self.item_bias[i])

                # Update latent factors
                user_factor = self.user_factors[u].copy()
                self.user_factors[u] += self.lr * (
                    error * self.item_factors[i] - self.reg * self.user_factors[u]
                )
                self.item_factors[i] += self.lr * (
                    error * user_factor - self.reg * self.item_factors[i]
                )

            # Compute training RMSE
            if (epoch + 1) % 5 == 0:
                rmse = self._compute_rmse(ratings_matrix)
                print(f"Epoch {epoch + 1}, RMSE: {rmse:.4f}")

        return self

    def _predict_single(self, u, i):
        """Predict single rating."""
        pred = np.dot(self.user_factors[u], self.item_factors[i])
        if self.use_bias:
            pred += self.global_mean + self.user_bias[u] + self.item_bias[i]
        return pred

    def _compute_rmse(self, ratings_matrix):
        """Compute RMSE on observed ratings."""
        users, items = np.where(ratings_matrix != 0)
        predictions = np.array([self._predict_single(u, i) for u, i in zip(users, items)])
        actuals = ratings_matrix[users, items]
        return np.sqrt(np.mean((predictions - actuals) ** 2))

    def predict(self, user_idx, item_idx):
        """Predict rating."""
        return self._predict_single(user_idx, item_idx)

    def recommend(self, user_idx, n_recommendations=5, ratings_matrix=None):
        """Generate recommendations."""
        n_items = self.item_factors.shape[0]
        scores = np.array([self._predict_single(user_idx, i) for i in range(n_items)])

        if ratings_matrix is not None:
            # Exclude already rated items
            scores[ratings_matrix[user_idx] != 0] = -np.inf

        top_items = np.argsort(scores)[::-1][:n_recommendations]
        return [(idx, scores[idx]) for idx in top_items]


# Example
sgd_mf = SGDMatrixFactorization(n_factors=5, learning_rate=0.01, n_epochs=50)
sgd_mf.fit(ratings)

print("\nSGD-MF Recommendations for Bob:")
recs = sgd_mf.recommend(user_idx=1, n_recommendations=3, ratings_matrix=ratings)
for item_idx, score in recs:
    print(f"  {items[item_idx]}: {score:.3f}")
```

---

## Handling Implicit Feedback

Implicit feedback requires special treatment because we only observe positive signals (interactions) without explicit negative signals.

### Challenges with Implicit Data

**Key Differences from Explicit Feedback:**
- No negative feedback: absence of interaction is ambiguous
- Confidence varies: a single purchase differs from 100 streams
- No rating scale: interactions are often binary or count-based
- More data but noisier signals

### Confidence Weighting

```python
def create_implicit_dataset(interactions_df, alpha=40):
    """
    Convert interaction counts to preference and confidence matrices.

    Parameters:
    -----------
    interactions_df : pd.DataFrame
        DataFrame with 'user_id', 'item_id', 'interaction_count'
    alpha : float
        Confidence scaling factor

    Returns:
    --------
    tuple : (preference_matrix, confidence_matrix)
    """
    # Create pivot table of interactions
    interaction_matrix = interactions_df.pivot_table(
        index='user_id',
        columns='item_id',
        values='interaction_count',
        fill_value=0
    )

    # Binary preference: 1 if any interaction, else 0
    P = (interaction_matrix > 0).astype(int).values

    # Confidence: higher for more interactions
    # C = 1 + alpha * log(1 + interactions / epsilon)
    C = 1 + alpha * np.log1p(interaction_matrix.values)

    return P, C, interaction_matrix.index, interaction_matrix.columns

# Example
implicit_df = pd.DataFrame({
    'user_id': [0, 0, 0, 1, 1, 2, 2, 2, 2],
    'item_id': [0, 1, 2, 0, 3, 1, 2, 3, 4],
    'interaction_count': [5, 1, 10, 3, 2, 1, 15, 8, 4]
})

P, C, users, items = create_implicit_dataset(implicit_df, alpha=40)
print("Preference Matrix P:")
print(P)
print("\nConfidence Matrix C:")
print(C.round(1))
```

### Bayesian Personalized Ranking (BPR)

BPR is designed specifically for implicit feedback, optimizing the ranking of items:

```python
class BPRMatrixFactorization:
    """
    Bayesian Personalized Ranking for implicit feedback.
    Optimizes: user prefers positive items over negative items.
    """

    def __init__(self, n_factors=10, learning_rate=0.05, regularization=0.01,
                 n_epochs=100):
        self.n_factors = n_factors
        self.lr = learning_rate
        self.reg = regularization
        self.n_epochs = n_epochs

    def fit(self, interaction_matrix, n_negative_samples=5):
        """
        Fit BPR model.

        Parameters:
        -----------
        interaction_matrix : np.ndarray
            Binary user-item interaction matrix
        n_negative_samples : int
            Number of negative samples per positive sample
        """
        n_users, n_items = interaction_matrix.shape

        # Initialize factors
        np.random.seed(42)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))

        # Get positive interactions
        positive_users, positive_items = np.where(interaction_matrix > 0)
        n_positive = len(positive_users)

        for epoch in range(self.n_epochs):
            total_loss = 0

            # Shuffle positive samples
            indices = np.random.permutation(n_positive)

            for idx in indices:
                u = positive_users[idx]
                i = positive_items[idx]  # Positive item

                # Sample negative items
                negative_items = np.where(interaction_matrix[u] == 0)[0]
                if len(negative_items) == 0:
                    continue

                # Random negative sample
                j = np.random.choice(negative_items)

                # Compute x_uij = x_ui - x_uj
                x_ui = np.dot(self.user_factors[u], self.item_factors[i])
                x_uj = np.dot(self.user_factors[u], self.item_factors[j])
                x_uij = x_ui - x_uj

                # Sigmoid gradient
                sigmoid = 1 / (1 + np.exp(x_uij))

                # Update factors
                self.user_factors[u] += self.lr * (
                    sigmoid * (self.item_factors[i] - self.item_factors[j])
                    - self.reg * self.user_factors[u]
                )
                self.item_factors[i] += self.lr * (
                    sigmoid * self.user_factors[u]
                    - self.reg * self.item_factors[i]
                )
                self.item_factors[j] += self.lr * (
                    -sigmoid * self.user_factors[u]
                    - self.reg * self.item_factors[j]
                )

                # BPR loss: -ln(sigmoid(x_uij))
                total_loss += -np.log(1 / (1 + np.exp(-x_uij)) + 1e-10)

            if (epoch + 1) % 20 == 0:
                print(f"Epoch {epoch + 1}, Loss: {total_loss / n_positive:.4f}")

        return self

    def recommend(self, user_idx, n_recommendations=10):
        """Generate recommendations."""
        scores = self.user_factors[user_idx] @ self.item_factors.T
        top_items = np.argsort(scores)[::-1][:n_recommendations]
        return [(idx, scores[idx]) for idx in top_items]
```

---

## The Cold Start Problem

The cold start problem is one of the most significant challenges in collaborative filtering, occurring when the system has insufficient data to make accurate recommendations.

### Types of Cold Start

| Type | Description | Challenge |
|------|-------------|-----------|
| **New User** | User has no interaction history | Cannot find similar users or learn preferences |
| **New Item** | Item has no ratings/interactions | Cannot compute item similarity |
| **New System** | Entire system is new | No collaborative signals available |

### Solutions for New Users

```python
class HybridCFWithContentFallback:
    """
    Hybrid recommender that falls back to content-based for cold start users.
    """

    def __init__(self, cf_model, item_features, min_interactions=5):
        self.cf_model = cf_model
        self.item_features = item_features  # Item content features
        self.min_interactions = min_interactions

    def recommend(self, user_idx, user_profile=None, n_recommendations=10,
                  interaction_count=0):
        """
        Generate recommendations with cold start handling.

        Parameters:
        -----------
        user_idx : int
            User index
        user_profile : dict
            Optional user profile for content-based fallback
        n_recommendations : int
            Number of recommendations
        interaction_count : int
            Number of interactions this user has
        """
        if interaction_count >= self.min_interactions:
            # Sufficient data: use CF
            return self.cf_model.recommend(user_idx, n_recommendations)
        else:
            # Cold start: use content-based or popularity
            return self._content_based_recommend(user_profile, n_recommendations)

    def _content_based_recommend(self, user_profile, n_recommendations):
        """
        Content-based recommendations for cold start users.
        """
        if user_profile is None:
            # Fall back to popularity-based
            return self._popularity_based(n_recommendations)

        # Compute similarity between user profile and items
        from sklearn.metrics.pairwise import cosine_similarity

        user_vector = np.array(list(user_profile.values())).reshape(1, -1)
        similarities = cosine_similarity(user_vector, self.item_features).flatten()

        top_items = np.argsort(similarities)[::-1][:n_recommendations]
        return [(idx, similarities[idx]) for idx in top_items]

    def _popularity_based(self, n_recommendations):
        """
        Popularity-based fallback.
        """
        # Return most popular items (pre-computed)
        return [(i, 1.0) for i in range(n_recommendations)]


# Strategies for new user cold start:
strategies = {
    "popularity": "Recommend most popular items globally",
    "demographic": "Recommend based on user demographics",
    "content_profile": "Ask for initial preferences, use content-based",
    "exploration": "Recommend diverse items to learn preferences quickly",
    "social": "Recommend based on friends' preferences"
}
```

### Solutions for New Items

```python
def handle_new_item_cold_start(item_content_features, existing_item_features,
                               item_ratings, k_similar=10):
    """
    Handle cold start for new items using content similarity.

    Parameters:
    -----------
    item_content_features : np.ndarray
        Content features of the new item
    existing_item_features : np.ndarray
        Content features of existing items
    item_ratings : np.ndarray
        Ratings matrix for existing items (users x items)
    k_similar : int
        Number of similar items to consider

    Returns:
    --------
    np.ndarray : Predicted ratings for all users
    """
    from sklearn.metrics.pairwise import cosine_similarity

    # Find similar existing items based on content
    similarities = cosine_similarity(
        item_content_features.reshape(1, -1),
        existing_item_features
    ).flatten()

    # Get top k similar items
    top_k_idx = np.argsort(similarities)[-k_similar:]
    top_k_sim = similarities[top_k_idx]

    # Predict ratings based on similar items' ratings
    # Weighted average of ratings from similar items
    predicted_ratings = np.zeros(item_ratings.shape[0])

    for u in range(item_ratings.shape[0]):
        user_ratings_for_similar = item_ratings[u, top_k_idx]
        rated_mask = user_ratings_for_similar != 0

        if np.sum(rated_mask) > 0:
            predicted_ratings[u] = np.average(
                user_ratings_for_similar[rated_mask],
                weights=top_k_sim[rated_mask]
            )

    return predicted_ratings
```

### Hybrid Approaches

```python
class HybridRecommender:
    """
    Hybrid recommender combining collaborative and content-based filtering.
    """

    def __init__(self, cf_weight=0.7, cb_weight=0.3):
        self.cf_weight = cf_weight
        self.cb_weight = cb_weight
        self.cf_model = None
        self.item_content_sim = None

    def fit(self, ratings_matrix, item_content_features):
        """
        Fit both CF and content-based components.
        """
        # Fit CF model
        self.cf_model = ALSRecommender(n_factors=10)
        self.cf_model.fit(ratings_matrix)

        # Compute item content similarity
        self.item_content_sim = cosine_similarity(item_content_features)

        self.ratings_matrix = ratings_matrix
        return self

    def recommend(self, user_idx, n_recommendations=10):
        """
        Generate hybrid recommendations.
        """
        n_items = self.ratings_matrix.shape[1]

        # CF scores
        cf_scores = self.cf_model.user_factors[user_idx] @ self.cf_model.item_factors.T

        # Content-based scores based on user's rated items
        user_ratings = self.ratings_matrix[user_idx]
        rated_items = np.where(user_ratings > 0)[0]

        if len(rated_items) > 0:
            # Average content similarity to rated items, weighted by ratings
            cb_scores = np.zeros(n_items)
            for i in rated_items:
                cb_scores += user_ratings[i] * self.item_content_sim[i]
            cb_scores /= np.sum(user_ratings[rated_items])
        else:
            cb_scores = np.zeros(n_items)

        # Combine scores
        hybrid_scores = self.cf_weight * cf_scores + self.cb_weight * cb_scores

        # Exclude rated items
        hybrid_scores[rated_items] = -np.inf

        top_items = np.argsort(hybrid_scores)[::-1][:n_recommendations]
        return [(idx, hybrid_scores[idx]) for idx in top_items]
```

---

## Implementation with Surprise Library

Surprise is a Python library specifically designed for building and analyzing recommender systems. It provides ready-to-use algorithms and evaluation tools.

### Installation and Setup

```python
# Installation
# pip install scikit-surprise

from surprise import Dataset, Reader, SVD, SVDpp, KNNBasic, KNNWithMeans
from surprise import accuracy
from surprise.model_selection import cross_validate, train_test_split, GridSearchCV
import pandas as pd

# Create sample data
ratings_data = pd.DataFrame({
    'user_id': ['U1', 'U1', 'U1', 'U2', 'U2', 'U2', 'U3', 'U3', 'U3', 'U4', 'U4'],
    'item_id': ['I1', 'I2', 'I3', 'I1', 'I2', 'I4', 'I2', 'I3', 'I4', 'I1', 'I3'],
    'rating': [5, 3, 4, 4, 5, 3, 2, 4, 5, 3, 4]
})

# Define rating scale
reader = Reader(rating_scale=(1, 5))

# Load data into Surprise format
data = Dataset.load_from_df(ratings_data[['user_id', 'item_id', 'rating']], reader)
```

### Basic Algorithms

```python
# User-based KNN
user_knn = KNNBasic(
    k=5,
    sim_options={
        'name': 'cosine',
        'user_based': True
    }
)

# Item-based KNN with mean centering
item_knn = KNNWithMeans(
    k=5,
    sim_options={
        'name': 'pearson',
        'user_based': False
    }
)

# SVD (Matrix Factorization)
svd = SVD(
    n_factors=50,
    n_epochs=20,
    lr_all=0.005,
    reg_all=0.02
)

# SVD++ (includes implicit feedback)
svdpp = SVDpp(
    n_factors=50,
    n_epochs=20,
    lr_all=0.005,
    reg_all=0.02
)
```

### Cross-Validation and Evaluation

```python
from surprise.model_selection import cross_validate

# Cross-validate SVD model
results = cross_validate(
    svd,
    data,
    measures=['RMSE', 'MAE'],
    cv=5,
    verbose=True
)

print(f"\nMean RMSE: {results['test_rmse'].mean():.4f}")
print(f"Mean MAE: {results['test_mae'].mean():.4f}")

# Compare multiple algorithms
algorithms = {
    'User-KNN': KNNBasic(k=5, sim_options={'name': 'cosine', 'user_based': True}),
    'Item-KNN': KNNBasic(k=5, sim_options={'name': 'cosine', 'user_based': False}),
    'SVD': SVD(n_factors=50),
    'SVD++': SVDpp(n_factors=50)
}

comparison_results = []
for name, algo in algorithms.items():
    results = cross_validate(algo, data, measures=['RMSE', 'MAE'], cv=5, verbose=False)
    comparison_results.append({
        'Algorithm': name,
        'RMSE': results['test_rmse'].mean(),
        'MAE': results['test_mae'].mean(),
        'Fit Time': results['fit_time'].mean(),
        'Test Time': results['test_time'].mean()
    })

comparison_df = pd.DataFrame(comparison_results)
print("\nAlgorithm Comparison:")
print(comparison_df.round(4))
```

### Hyperparameter Tuning

```python
from surprise.model_selection import GridSearchCV

# Define parameter grid for SVD
param_grid = {
    'n_factors': [20, 50, 100],
    'n_epochs': [10, 20, 30],
    'lr_all': [0.002, 0.005, 0.01],
    'reg_all': [0.01, 0.02, 0.05]
}

# Grid search
gs = GridSearchCV(SVD, param_grid, measures=['rmse', 'mae'], cv=3)
gs.fit(data)

# Best parameters
print(f"Best RMSE: {gs.best_score['rmse']:.4f}")
print(f"Best parameters: {gs.best_params['rmse']}")

# Train model with best parameters
best_svd = gs.best_estimator['rmse']
```

### Making Predictions and Recommendations

```python
from collections import defaultdict

def get_top_n_recommendations(predictions, n=10):
    """
    Generate top-N recommendations for each user.

    Parameters:
    -----------
    predictions : list
        List of Surprise Prediction objects
    n : int
        Number of recommendations per user

    Returns:
    --------
    dict : User -> list of (item, estimated_rating)
    """
    top_n = defaultdict(list)

    for uid, iid, true_r, est, _ in predictions:
        top_n[uid].append((iid, est))

    # Sort by estimated rating
    for uid, user_ratings in top_n.items():
        user_ratings.sort(key=lambda x: x[1], reverse=True)
        top_n[uid] = user_ratings[:n]

    return top_n


# Train-test split
trainset, testset = train_test_split(data, test_size=0.2)

# Train model
svd = SVD(n_factors=50, n_epochs=20)
svd.fit(trainset)

# Get predictions on test set
predictions = svd.test(testset)
print(f"Test RMSE: {accuracy.rmse(predictions):.4f}")

# Generate recommendations
# First, get all items not rated by each user
all_items = set(ratings_data['item_id'].unique())
user_items = ratings_data.groupby('user_id')['item_id'].apply(set).to_dict()

# Predict ratings for unrated items
anti_testset = []
for user in ratings_data['user_id'].unique():
    unrated_items = all_items - user_items.get(user, set())
    for item in unrated_items:
        anti_testset.append((user, item, 0))  # 0 is placeholder

predictions = svd.test(anti_testset)
top_n = get_top_n_recommendations(predictions, n=3)

print("\nTop-3 Recommendations:")
for user, recommendations in top_n.items():
    print(f"  {user}: {recommendations}")
```

### Complete Surprise Pipeline

```python
from surprise import Dataset, Reader, SVD
from surprise.model_selection import cross_validate, GridSearchCV, train_test_split
from surprise import accuracy
import pandas as pd

class SurpriseRecommender:
    """
    Complete recommender system pipeline using Surprise library.
    """

    def __init__(self, algorithm='svd', **kwargs):
        self.algorithm_name = algorithm
        self.kwargs = kwargs
        self.model = None
        self.trainset = None

    def load_data(self, df, user_col='user_id', item_col='item_id',
                  rating_col='rating', rating_scale=(1, 5)):
        """Load data from pandas DataFrame."""
        reader = Reader(rating_scale=rating_scale)
        self.data = Dataset.load_from_df(
            df[[user_col, item_col, rating_col]], reader
        )
        self.df = df
        self.user_col = user_col
        self.item_col = item_col

    def cross_validate(self, cv=5):
        """Perform cross-validation."""
        model = self._create_model()
        results = cross_validate(
            model, self.data,
            measures=['RMSE', 'MAE'],
            cv=cv, verbose=True
        )
        return results

    def tune_hyperparameters(self, param_grid, cv=3):
        """Grid search for hyperparameter tuning."""
        model_class = self._get_model_class()
        gs = GridSearchCV(model_class, param_grid, measures=['rmse'], cv=cv)
        gs.fit(self.data)

        print(f"Best RMSE: {gs.best_score['rmse']:.4f}")
        print(f"Best params: {gs.best_params['rmse']}")

        self.kwargs.update(gs.best_params['rmse'])
        return gs.best_params['rmse']

    def fit(self, test_size=0.2):
        """Train the model."""
        trainset, testset = train_test_split(self.data, test_size=test_size)
        self.trainset = trainset
        self.testset = testset

        self.model = self._create_model()
        self.model.fit(trainset)

        # Evaluate on test set
        predictions = self.model.test(testset)
        rmse = accuracy.rmse(predictions)
        mae = accuracy.mae(predictions)

        print(f"Test RMSE: {rmse:.4f}")
        print(f"Test MAE: {mae:.4f}")

        return self

    def predict(self, user_id, item_id):
        """Predict rating for a user-item pair."""
        return self.model.predict(user_id, item_id).est

    def recommend(self, user_id, n=10):
        """Generate top-N recommendations for a user."""
        # Get items user has already rated
        rated_items = set(
            self.df[self.df[self.user_col] == user_id][self.item_col]
        )
        all_items = set(self.df[self.item_col].unique())
        unrated_items = all_items - rated_items

        # Predict ratings for unrated items
        predictions = []
        for item_id in unrated_items:
            pred = self.model.predict(user_id, item_id)
            predictions.append((item_id, pred.est))

        # Sort and return top N
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:n]

    def _create_model(self):
        """Create model instance."""
        model_class = self._get_model_class()
        return model_class(**self.kwargs)

    def _get_model_class(self):
        """Get model class based on algorithm name."""
        from surprise import SVD, SVDpp, KNNBasic, KNNWithMeans, NMF

        models = {
            'svd': SVD,
            'svdpp': SVDpp,
            'knn_basic': KNNBasic,
            'knn_means': KNNWithMeans,
            'nmf': NMF
        }
        return models.get(self.algorithm_name, SVD)


# Example usage
ratings_df = pd.DataFrame({
    'user_id': ['U1', 'U1', 'U1', 'U1', 'U2', 'U2', 'U2', 'U3', 'U3', 'U3',
                'U4', 'U4', 'U4', 'U5', 'U5'],
    'item_id': ['I1', 'I2', 'I3', 'I4', 'I1', 'I2', 'I5', 'I2', 'I3', 'I4',
                'I1', 'I3', 'I5', 'I2', 'I4'],
    'rating': [5, 3, 4, 2, 4, 5, 3, 2, 4, 5, 3, 4, 4, 5, 3]
})

# Initialize and use
recommender = SurpriseRecommender(
    algorithm='svd',
    n_factors=20,
    n_epochs=20,
    lr_all=0.005,
    reg_all=0.02
)

recommender.load_data(ratings_df)
recommender.fit(test_size=0.2)

# Get recommendations
print("\nRecommendations for U1:")
recs = recommender.recommend('U1', n=3)
for item, rating in recs:
    print(f"  {item}: {rating:.3f}")
```

---

## Evaluation Metrics

Proper evaluation is crucial for developing effective recommender systems. Different metrics capture different aspects of recommendation quality.

### Rating Prediction Metrics

```python
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error

def rating_metrics(y_true, y_pred):
    """
    Compute rating prediction metrics.
    """
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)

    return {
        'RMSE': rmse,
        'MAE': mae
    }
```

### Ranking Metrics

```python
def precision_at_k(recommended, relevant, k):
    """
    Precision@K: Fraction of recommended items that are relevant.
    """
    recommended_k = recommended[:k]
    relevant_set = set(relevant)
    hits = len(set(recommended_k) & relevant_set)
    return hits / k

def recall_at_k(recommended, relevant, k):
    """
    Recall@K: Fraction of relevant items that are recommended.
    """
    recommended_k = recommended[:k]
    relevant_set = set(relevant)
    hits = len(set(recommended_k) & relevant_set)
    return hits / len(relevant_set) if relevant_set else 0

def ndcg_at_k(recommended, relevant, k):
    """
    Normalized Discounted Cumulative Gain@K.
    Accounts for position of relevant items in ranking.
    """
    relevant_set = set(relevant)

    # DCG
    dcg = 0
    for i, item in enumerate(recommended[:k]):
        if item in relevant_set:
            dcg += 1 / np.log2(i + 2)  # i+2 because positions start at 1

    # Ideal DCG
    ideal_dcg = sum(1 / np.log2(i + 2) for i in range(min(len(relevant_set), k)))

    return dcg / ideal_dcg if ideal_dcg > 0 else 0

def map_at_k(recommended, relevant, k):
    """
    Mean Average Precision@K.
    """
    relevant_set = set(relevant)
    hits = 0
    precision_sum = 0

    for i, item in enumerate(recommended[:k]):
        if item in relevant_set:
            hits += 1
            precision_sum += hits / (i + 1)

    return precision_sum / min(len(relevant_set), k) if relevant_set else 0

def hit_rate(recommended, relevant, k):
    """
    Hit Rate@K: Whether at least one relevant item is in top-K.
    """
    recommended_k = set(recommended[:k])
    relevant_set = set(relevant)
    return 1 if recommended_k & relevant_set else 0


# Example evaluation
recommended_items = ['I3', 'I5', 'I2', 'I7', 'I1', 'I8', 'I4', 'I6']
relevant_items = ['I2', 'I5', 'I6']

print("Evaluation Metrics:")
print(f"  Precision@5: {precision_at_k(recommended_items, relevant_items, 5):.4f}")
print(f"  Recall@5: {recall_at_k(recommended_items, relevant_items, 5):.4f}")
print(f"  NDCG@5: {ndcg_at_k(recommended_items, relevant_items, 5):.4f}")
print(f"  MAP@5: {map_at_k(recommended_items, relevant_items, 5):.4f}")
print(f"  Hit Rate@5: {hit_rate(recommended_items, relevant_items, 5)}")
```

### Beyond Accuracy Metrics

```python
def coverage(all_recommendations, all_items):
    """
    Catalog Coverage: Fraction of items ever recommended.
    """
    recommended_items = set()
    for recs in all_recommendations:
        recommended_items.update(recs)
    return len(recommended_items) / len(all_items)

def diversity(recommendations, item_similarity_matrix, item_to_idx):
    """
    Intra-list Diversity: Average dissimilarity between recommended items.
    """
    indices = [item_to_idx[item] for item in recommendations]
    n = len(indices)

    if n < 2:
        return 0

    total_dissim = 0
    count = 0
    for i in range(n):
        for j in range(i + 1, n):
            total_dissim += 1 - item_similarity_matrix[indices[i], indices[j]]
            count += 1

    return total_dissim / count

def novelty(recommendations, item_popularity, n_users):
    """
    Novelty: Average self-information of recommended items.
    More novel = less popular items recommended.
    """
    novelty_scores = []
    for item in recommendations:
        pop = item_popularity.get(item, 1) / n_users
        novelty_scores.append(-np.log2(pop + 1e-10))
    return np.mean(novelty_scores)
```

---

## Best Practices and Production Tips

### Scalability Considerations

```python
from scipy import sparse

def create_sparse_matrix(df, user_col, item_col, rating_col):
    """
    Create sparse matrix for memory efficiency.
    """
    # Create mappings
    users = df[user_col].unique()
    items = df[item_col].unique()

    user_to_idx = {u: i for i, u in enumerate(users)}
    item_to_idx = {i: j for j, i in enumerate(items)}

    # Create sparse matrix
    row = df[user_col].map(user_to_idx)
    col = df[item_col].map(item_to_idx)
    data = df[rating_col]

    sparse_matrix = sparse.csr_matrix(
        (data, (row, col)),
        shape=(len(users), len(items))
    )

    return sparse_matrix, user_to_idx, item_to_idx


# Approximate Nearest Neighbors for scaling similarity search
# pip install annoy
# from annoy import AnnoyIndex

def build_approximate_nn_index(item_factors, n_trees=10):
    """
    Build approximate nearest neighbors index for fast similarity search.
    Uses Annoy library for scalable similarity computation.
    """
    # Note: Requires annoy library
    # from annoy import AnnoyIndex

    n_items, n_factors = item_factors.shape

    # index = AnnoyIndex(n_factors, 'angular')  # angular = cosine similarity
    # for i in range(n_items):
    #     index.add_item(i, item_factors[i])
    # index.build(n_trees)
    # return index

    print("Install annoy library for approximate NN: pip install annoy")
    return None
```

### Online vs Offline Recommendations

```python
class ProductionRecommender:
    """
    Production-ready recommender with caching and fallbacks.
    """

    def __init__(self, model, cache_ttl=3600):
        self.model = model
        self.cache_ttl = cache_ttl
        self.recommendation_cache = {}
        self.popular_items = []

    def get_recommendations(self, user_id, n=10):
        """
        Get recommendations with caching and fallbacks.
        """
        # Check cache
        cache_key = f"{user_id}_{n}"
        if cache_key in self.recommendation_cache:
            cached = self.recommendation_cache[cache_key]
            if cached['timestamp'] > time.time() - self.cache_ttl:
                return cached['recommendations']

        try:
            # Try to get personalized recommendations
            recommendations = self.model.recommend(user_id, n)
        except Exception as e:
            # Fallback to popular items
            print(f"Falling back to popular items: {e}")
            recommendations = self.popular_items[:n]

        # Cache results
        self.recommendation_cache[cache_key] = {
            'recommendations': recommendations,
            'timestamp': time.time()
        }

        return recommendations

    def update_popular_items(self, interaction_data):
        """
        Update popular items list for fallback.
        """
        popularity = interaction_data.groupby('item_id').size()
        self.popular_items = popularity.sort_values(ascending=False).index.tolist()
```

### A/B Testing Framework

```python
import hashlib

def get_experiment_bucket(user_id, experiment_name, n_buckets=2):
    """
    Deterministically assign user to experiment bucket.
    """
    hash_input = f"{user_id}_{experiment_name}"
    hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
    return hash_value % n_buckets

def run_ab_test(user_id, model_a, model_b, experiment_name="recommender_test"):
    """
    Run A/B test between two recommender models.
    """
    bucket = get_experiment_bucket(user_id, experiment_name)

    if bucket == 0:
        model = model_a
        variant = 'A'
    else:
        model = model_b
        variant = 'B'

    recommendations = model.recommend(user_id)

    # Log experiment assignment for analysis
    log_experiment(user_id, experiment_name, variant, recommendations)

    return recommendations, variant

def log_experiment(user_id, experiment_name, variant, recommendations):
    """Log experiment assignment for later analysis."""
    # In production, log to analytics system
    print(f"User {user_id} assigned to variant {variant}")
```

---

## Interview Key Points

### Common Interview Questions

**Q1: Explain the difference between user-based and item-based collaborative filtering.**

User-based CF finds similar users and recommends items those similar users liked. Item-based CF finds items similar to what the user has liked. Item-based is often preferred in production because:
- Item similarities are more stable than user similarities
- Can be precomputed and cached
- Scales better when users >> items (common in e-commerce)

**Q2: How do you handle the cold start problem?**

Solutions vary by cold start type:
- **New users**: Use popularity-based recommendations, ask for preferences, leverage demographic data, or use content-based methods
- **New items**: Use content similarity to existing items, promote to diverse users for exploration
- **Hybrid approaches**: Combine CF with content-based methods

**Q3: What is matrix factorization and why is it useful?**

Matrix factorization decomposes the user-item matrix into lower-dimensional user and item factor matrices. Benefits include:
- Handles sparsity by learning latent representations
- Captures implicit relationships
- More scalable than memory-based methods
- Better generalization to unseen user-item pairs

**Q4: How do you evaluate a recommender system?**

Multiple metrics capture different aspects:
- **Accuracy**: RMSE, MAE for rating prediction
- **Ranking**: Precision@K, Recall@K, NDCG, MAP
- **Beyond accuracy**: Coverage, diversity, novelty, serendipity
- **Business metrics**: CTR, conversion rate, user engagement

**Q5: How do you handle implicit feedback?**

Key approaches:
- Convert to confidence scores (e.g., C = 1 + alpha * interactions)
- Use specialized algorithms (ALS for implicit, BPR)
- Model as preference (binary) with confidence weighting
- Sample negative examples carefully (unobserved != disliked)

### System Design Considerations

```
Recommender System Architecture:
================================

[User Request]
     |
     v
[API Gateway] ---> [Recommendation Service]
     |                     |
     |              [Model Serving]
     |                /         \
     |        [Real-time]    [Batch]
     |              |             |
     |        [User Context]  [Precomputed]
     |              |             |
     v              v             v
[Response] <--- [Ranking & Filtering]
                      |
                [A/B Test Assignment]
                      |
                [Logging & Analytics]
```

**Key Design Points:**
1. **Offline Training**: Train models periodically on historical data
2. **Online Serving**: Fast inference, often using precomputed scores
3. **Feature Store**: Real-time user/item features
4. **Caching**: Cache popular recommendations
5. **Fallbacks**: Popularity-based fallback for cold start
6. **Experimentation**: A/B testing infrastructure
7. **Monitoring**: Track recommendation quality metrics

---

## Further Reading

### Foundational Papers

- **"Amazon.com Recommendations: Item-to-Item Collaborative Filtering"** (Linden et al., 2003): Seminal paper on item-based CF at scale
- **"Matrix Factorization Techniques for Recommender Systems"** (Koren et al., 2009): Comprehensive overview of MF approaches
- **"Collaborative Filtering for Implicit Feedback Datasets"** (Hu et al., 2008): ALS for implicit feedback
- **"BPR: Bayesian Personalized Ranking from Implicit Feedback"** (Rendle et al., 2009): Pairwise learning for implicit data

### Books

- **"Recommender Systems Handbook"** (Ricci et al.): Comprehensive reference covering all aspects
- **"Practical Recommender Systems"** (Falk): Hands-on guide with practical implementations
- **"Mining of Massive Datasets"** (Leskovec et al.): Chapter on recommender systems with scalability focus

### Libraries and Tools

- **Surprise**: Python library for explicit feedback (scikit-surprise)
- **Implicit**: Python library for implicit feedback (benfred/implicit)
- **LightFM**: Hybrid recommender combining CF with content features
- **TensorFlow Recommenders**: Deep learning-based recommendations
- **RecBole**: Unified framework for reproducing recommendation algorithms

### Related Topics

- [Machine Learning Fundamentals](/ai/ml-fundamentals) - Core ML concepts
- [Deep Learning Basics](/ai/deep-learning-basics) - Neural network foundations for deep recommenders
- [Statistics Fundamentals](/data/statistics-fundamentals) - Statistical concepts for evaluation

---

## Summary

Collaborative filtering remains one of the most effective and widely-used approaches for building recommender systems. This guide covered:

1. **Fundamentals**: Understanding recommender systems and the CF philosophy
2. **Memory-Based Methods**: User-based and item-based collaborative filtering
3. **Similarity Metrics**: Cosine, Pearson, adjusted cosine, and Jaccard similarity
4. **Matrix Factorization**: SVD, ALS, and SGD-based approaches
5. **Implicit Feedback**: Handling non-explicit user signals
6. **Cold Start**: Strategies for new users and items
7. **Practical Implementation**: Using the Surprise library
8. **Evaluation**: Accuracy and beyond-accuracy metrics
9. **Production Tips**: Scalability, caching, and A/B testing

Key takeaways for practitioners:
- Start with simple baselines (popularity, item-based CF) before complex models
- Choose metrics that align with business objectives
- Address cold start explicitly in your design
- Consider hybrid approaches for robustness
- Invest in offline evaluation and online A/B testing
- Monitor and iterate continuously

Recommender systems are a continuously evolving field. While collaborative filtering provides a strong foundation, modern systems often combine CF with deep learning, knowledge graphs, and reinforcement learning for even better performance.
