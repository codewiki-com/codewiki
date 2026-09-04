---
title: 推荐系统完全指南
description: 掌握推荐系统算法，构建个性化推荐服务
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - 推荐系统
  - 协同过滤
  - 深度学习推荐
  - 个性化
status: imported
origin: old/src/content/docs/ai/recommendation.en.md
divergence: 0.21
issues:
  - title-lang-en
  - title-language
legacy:
  category: AI
  subcategory: Machine Learning
  order: 19
  lastUpdated: 2026-01-07
---

Recommendation systems are one of the core components of modern internet applications. From product recommendations on e-commerce platforms to content recommendations on video websites, from social media feeds to song recommendations in music apps, recommendation systems are everywhere. We'll cover the core algorithms and practical techniques of recommendation systems to help you build efficient personalized recommendation services.

---

## Overview of Recommendation Systems

### What is a Recommendation System

A recommendation system is an information filtering system that predicts content or products a user might be interested in by analyzing the user's historical behavior, preferences, and contextual information, and proactively pushes relevant recommendations to the user.

**Core Objectives of Recommendation Systems:**

- **User Perspective**: Help users discover content of interest, reducing information overload
- **Platform Perspective**: Improve user engagement, conversion rates, and business value
- **Content Perspective**: Give quality content more exposure opportunities

### Classification of Recommendation Systems

```python
# Main classification of recommendation systems
recommendation_systems = {
    "Collaborative Filtering": {
        "User-based CF": "Recommend based on similar users' preferences",
        "Item-based CF": "Recommend based on similar items",
        "Matrix Factorization": "By decomposing user-item interaction matrix"
    },
    "Content-Based": {
        "Feature Matching": "Based on matching item features with user preferences",
        "TF-IDF": "Based on text feature similarity",
        "Knowledge Graph": "Recommend based on semantic relationships"
    },
    "Deep Learning": {
        "Neural Collaborative Filtering": "NCF, DeepFM, etc.",
        "Sequential Recommendation": "RNN, Transformer based",
        "Graph Neural Networks": "GNN based recommendation"
    },
    "Hybrid Methods": "Combining advantages of multiple methods"
}
```

### Recommendation System Architecture

A complete recommendation system typically includes the following components:

```
+-----------------------------------------------------------+
|               Recommendation System Architecture           |
+-----------------------------------------------------------+
|  +---------+   +---------+   +---------+   +---------+    |
|  |Data     | -> |Feature  | -> |Recall   | -> |Ranking  |   |
|  |Collection|   |Engineering|   |Layer   | -> |Layer    |   |
|  +---------+   +---------+   +---------+   +---------+    |
|       |             |             |             |          |
|  User behavior   Feature      Candidate     Ranking        |
|  logs            storage      generation    model          |
|  Item attributes Embedding    Multi-channel CTR prediction |
|  Context info    Real-time    recall        Re-ranking     |
|                  features     Rough filter  strategy       |
+-----------------------------------------------------------+
```

---

## Collaborative Filtering

Collaborative Filtering is one of the most classic algorithms in recommendation systems. Its core idea is to use group behavior to predict individual preferences.

### User-based Collaborative Filtering (User-CF)

User-based collaborative filtering is based on the assumption that "similar users have similar preferences." It finds user groups with similar interests to the target user and recommends items they like to the target user.

**Algorithm Steps:**

1. Calculate similarity between users
2. Find the K users most similar to the target user
3. Recommend items that these similar users like to the target user

```python
import numpy as np
from collections import defaultdict
from typing import Dict, List, Tuple

class UserBasedCF:
    """User-based Collaborative Filtering Recommendation System"""

    def __init__(self, k_neighbors: int = 20):
        self.k_neighbors = k_neighbors
        self.user_item_matrix = None
        self.user_similarity = None
        self.user_mean_ratings = None

    def fit(self, ratings: Dict[int, Dict[int, float]]):
        """
        Train the model

        Args:
            ratings: User rating dictionary {user_id: {item_id: rating}}
        """
        # Get all users and items
        users = list(ratings.keys())
        items = set()
        for user_ratings in ratings.values():
            items.update(user_ratings.keys())
        items = list(items)

        # Build user-item rating matrix
        n_users, n_items = len(users), len(items)
        self.user_idx = {u: i for i, u in enumerate(users)}
        self.item_idx = {item: i for i, item in enumerate(items)}
        self.idx_user = {i: u for u, i in self.user_idx.items()}
        self.idx_item = {i: item for item, i in self.item_idx.items()}

        # Initialize matrix (use NaN for unrated items)
        self.user_item_matrix = np.full((n_users, n_items), np.nan)

        for user, user_ratings in ratings.items():
            for item, rating in user_ratings.items():
                self.user_item_matrix[self.user_idx[user], self.item_idx[item]] = rating

        # Calculate user average ratings
        self.user_mean_ratings = np.nanmean(self.user_item_matrix, axis=1)

        # Calculate user similarity matrix
        self._compute_similarity()

    def _compute_similarity(self):
        """Calculate cosine similarity between users"""
        n_users = self.user_item_matrix.shape[0]
        self.user_similarity = np.zeros((n_users, n_users))

        # Center ratings (subtract user mean)
        centered_matrix = self.user_item_matrix - self.user_mean_ratings[:, np.newaxis]
        centered_matrix = np.nan_to_num(centered_matrix, nan=0)

        # Calculate cosine similarity
        for i in range(n_users):
            for j in range(i, n_users):
                # Find items rated by both users
                mask_i = ~np.isnan(self.user_item_matrix[i])
                mask_j = ~np.isnan(self.user_item_matrix[j])
                common_mask = mask_i & mask_j

                if common_mask.sum() > 0:
                    vec_i = centered_matrix[i, common_mask]
                    vec_j = centered_matrix[j, common_mask]

                    norm_i = np.linalg.norm(vec_i)
                    norm_j = np.linalg.norm(vec_j)

                    if norm_i > 0 and norm_j > 0:
                        sim = np.dot(vec_i, vec_j) / (norm_i * norm_j)
                        self.user_similarity[i, j] = sim
                        self.user_similarity[j, i] = sim

    def predict(self, user_id: int, item_id: int) -> float:
        """Predict user rating for an item"""
        if user_id not in self.user_idx or item_id not in self.item_idx:
            return self.user_mean_ratings.mean()

        user_idx = self.user_idx[user_id]
        item_idx = self.item_idx[item_id]

        # Get users who rated this item
        rated_users = ~np.isnan(self.user_item_matrix[:, item_idx])

        # Get K neighbors with highest similarity
        similarities = self.user_similarity[user_idx].copy()
        similarities[user_idx] = -1  # Exclude self
        similarities[~rated_users] = -1  # Exclude users who haven't rated

        top_k_indices = np.argsort(similarities)[-self.k_neighbors:]
        top_k_indices = top_k_indices[similarities[top_k_indices] > 0]

        if len(top_k_indices) == 0:
            return self.user_mean_ratings[user_idx]

        # Weighted average predicted rating
        numerator = 0
        denominator = 0

        for neighbor_idx in top_k_indices:
            sim = self.user_similarity[user_idx, neighbor_idx]
            rating = self.user_item_matrix[neighbor_idx, item_idx]
            neighbor_mean = self.user_mean_ratings[neighbor_idx]

            numerator += sim * (rating - neighbor_mean)
            denominator += abs(sim)

        if denominator == 0:
            return self.user_mean_ratings[user_idx]

        return self.user_mean_ratings[user_idx] + numerator / denominator

    def recommend(self, user_id: int, n_items: int = 10) -> List[Tuple[int, float]]:
        """Recommend items for a user"""
        if user_id not in self.user_idx:
            return []

        user_idx = self.user_idx[user_id]

        # Get items not rated by the user
        unrated_items = np.where(np.isnan(self.user_item_matrix[user_idx]))[0]

        # Predict ratings
        predictions = []
        for item_idx in unrated_items:
            item_id = self.idx_item[item_idx]
            pred_rating = self.predict(user_id, item_id)
            predictions.append((item_id, pred_rating))

        # Sort by predicted rating
        predictions.sort(key=lambda x: x[1], reverse=True)

        return predictions[:n_items]


# Usage example
if __name__ == "__main__":
    # Simulated user rating data
    ratings = {
        1: {101: 5, 102: 3, 103: 4, 104: 4},
        2: {101: 3, 102: 1, 103: 2, 104: 3, 105: 3},
        3: {101: 4, 102: 3, 103: 4, 104: 3, 105: 5},
        4: {101: 3, 102: 3, 103: 1, 104: 5, 105: 4},
        5: {101: 1, 102: 5, 103: 5, 104: 2, 105: 1},
    }

    # Train model
    cf = UserBasedCF(k_neighbors=3)
    cf.fit(ratings)

    # Recommend for user 1
    recommendations = cf.recommend(user_id=1, n_items=5)
    print("Recommendations:", recommendations)
```

### Item-based Collaborative Filtering (Item-CF)

Item-based collaborative filtering is based on the assumption that "similar items will be liked by the same user." It calculates similarity between items and recommends items similar to what the user has historically liked.

**Item-CF vs User-CF:**

| Feature | User-CF | Item-CF |
|------|---------|---------|
| Use Case | Fewer users, items update frequently | Fewer items, users update frequently |
| Computational Complexity | User similarity calculation | Item similarity calculation |
| Real-time | Requires frequent updates | Item similarity is stable |
| Typical Application | News recommendation | E-commerce recommendation |

```python
class ItemBasedCF:
    """Item-based Collaborative Filtering Recommendation System"""

    def __init__(self, k_neighbors: int = 20):
        self.k_neighbors = k_neighbors
        self.item_similarity = None

    def fit(self, ratings: Dict[int, Dict[int, float]]):
        """Train the model"""
        # Build item-user inverted index
        item_users = defaultdict(dict)
        for user, user_ratings in ratings.items():
            for item, rating in user_ratings.items():
                item_users[item][user] = rating

        items = list(item_users.keys())
        n_items = len(items)
        self.item_idx = {item: i for i, item in enumerate(items)}
        self.idx_item = {i: item for item, i in self.item_idx.items()}

        # Calculate item similarity
        self.item_similarity = np.zeros((n_items, n_items))

        for i, item_i in enumerate(items):
            for j, item_j in enumerate(items):
                if i >= j:
                    continue

                # Find users who rated both items
                common_users = set(item_users[item_i].keys()) & set(item_users[item_j].keys())

                if len(common_users) > 0:
                    # Calculate cosine similarity
                    vec_i = [item_users[item_i][u] for u in common_users]
                    vec_j = [item_users[item_j][u] for u in common_users]

                    sim = np.dot(vec_i, vec_j) / (np.linalg.norm(vec_i) * np.linalg.norm(vec_j))
                    self.item_similarity[i, j] = sim
                    self.item_similarity[j, i] = sim

        self.item_users = item_users
        self.ratings = ratings

    def recommend(self, user_id: int, n_items: int = 10) -> List[Tuple[int, float]]:
        """Recommend items for a user"""
        if user_id not in self.ratings:
            return []

        user_history = self.ratings[user_id]
        candidates = defaultdict(float)

        for item, rating in user_history.items():
            if item not in self.item_idx:
                continue
            item_idx = self.item_idx[item]

            # Find similar items
            similarities = self.item_similarity[item_idx]
            top_k = np.argsort(similarities)[-self.k_neighbors:]

            for similar_idx in top_k:
                similar_item = self.idx_item[similar_idx]
                if similar_item not in user_history:
                    candidates[similar_item] += similarities[similar_idx] * rating

        # Sort and return
        recommendations = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
        return recommendations[:n_items]
```

### Matrix Factorization

Matrix factorization is an efficient implementation of collaborative filtering. It decomposes the high-dimensional sparse user-item interaction matrix into the product of two low-dimensional dense matrices, learning latent vector representations of users and items.

**SVD Decomposition:**

$$R \approx U \cdot \Sigma \cdot V^T$$

**Latent Factor Model (LFM):**

$$\hat{r}_{ui} = \mu + b_u + b_i + p_u^T \cdot q_i$$

Where $p_u$ is the latent vector of user $u$, and $q_i$ is the latent vector of item $i$.

```python
import numpy as np
from typing import Tuple

class MatrixFactorization:
    """Matrix Factorization Recommendation System (using SGD optimization)"""

    def __init__(
        self,
        n_factors: int = 50,
        learning_rate: float = 0.01,
        regularization: float = 0.02,
        n_epochs: int = 100,
        random_state: int = 42
    ):
        self.n_factors = n_factors
        self.lr = learning_rate
        self.reg = regularization
        self.n_epochs = n_epochs
        np.random.seed(random_state)

    def fit(self, ratings: np.ndarray, user_ids: np.ndarray, item_ids: np.ndarray):
        """
        Train matrix factorization model

        Args:
            ratings: Rating array
            user_ids: User ID array
            item_ids: Item ID array
        """
        # Build mappings
        unique_users = np.unique(user_ids)
        unique_items = np.unique(item_ids)

        self.user_to_idx = {u: i for i, u in enumerate(unique_users)}
        self.item_to_idx = {item: i for i, item in enumerate(unique_items)}
        self.idx_to_user = {i: u for u, i in self.user_to_idx.items()}
        self.idx_to_item = {i: item for item, i in self.item_to_idx.items()}

        n_users = len(unique_users)
        n_items = len(unique_items)

        # Initialize parameters
        self.global_mean = np.mean(ratings)
        self.user_bias = np.zeros(n_users)
        self.item_bias = np.zeros(n_items)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))

        # SGD training
        for epoch in range(self.n_epochs):
            # Shuffle data
            indices = np.random.permutation(len(ratings))

            total_loss = 0
            for idx in indices:
                user = self.user_to_idx[user_ids[idx]]
                item = self.item_to_idx[item_ids[idx]]
                rating = ratings[idx]

                # Predict
                pred = self._predict_single(user, item)
                error = rating - pred
                total_loss += error ** 2

                # Update biases
                self.user_bias[user] += self.lr * (error - self.reg * self.user_bias[user])
                self.item_bias[item] += self.lr * (error - self.reg * self.item_bias[item])

                # Update latent factors
                user_factor = self.user_factors[user].copy()
                self.user_factors[user] += self.lr * (
                    error * self.item_factors[item] - self.reg * self.user_factors[user]
                )
                self.item_factors[item] += self.lr * (
                    error * user_factor - self.reg * self.item_factors[item]
                )

            rmse = np.sqrt(total_loss / len(ratings))
            if (epoch + 1) % 20 == 0:
                print(f"Epoch {epoch + 1}/{self.n_epochs}, RMSE: {rmse:.4f}")

    def _predict_single(self, user_idx: int, item_idx: int) -> float:
        """Predict a single rating"""
        return (
            self.global_mean +
            self.user_bias[user_idx] +
            self.item_bias[item_idx] +
            np.dot(self.user_factors[user_idx], self.item_factors[item_idx])
        )

    def predict(self, user_id: int, item_id: int) -> float:
        """Predict user rating for an item"""
        if user_id not in self.user_to_idx or item_id not in self.item_to_idx:
            return self.global_mean

        user_idx = self.user_to_idx[user_id]
        item_idx = self.item_to_idx[item_id]

        return self._predict_single(user_idx, item_idx)

    def recommend(self, user_id: int, n_items: int = 10,
                  exclude_items: set = None) -> List[Tuple[int, float]]:
        """Recommend items for a user"""
        if user_id not in self.user_to_idx:
            return []

        user_idx = self.user_to_idx[user_id]
        exclude_items = exclude_items or set()

        predictions = []
        for item_id, item_idx in self.item_to_idx.items():
            if item_id not in exclude_items:
                pred = self._predict_single(user_idx, item_idx)
                predictions.append((item_id, pred))

        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:n_items]


# Usage example
if __name__ == "__main__":
    # Simulated data
    np.random.seed(42)
    n_samples = 1000
    user_ids = np.random.randint(0, 100, n_samples)
    item_ids = np.random.randint(0, 50, n_samples)
    ratings = np.random.randint(1, 6, n_samples).astype(float)

    # Train model
    mf = MatrixFactorization(n_factors=20, n_epochs=100)
    mf.fit(ratings, user_ids, item_ids)

    # Recommend
    recs = mf.recommend(user_id=0, n_items=5)
    print("Recommendations:", recs)
```

---

## Content-Based Recommendation

Content-Based Filtering recommends items similar to users' historical preferences by analyzing item content features and user preference features.

### Feature Extraction

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

class ContentBasedRecommender:
    """Content-Based Recommendation System"""

    def __init__(self):
        self.tfidf = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.item_profiles = None
        self.item_similarity = None

    def fit(self, items_df: pd.DataFrame, content_column: str):
        """
        Train the model

        Args:
            items_df: Item dataframe, must contain 'item_id' and content_column
            content_column: Content feature column name
        """
        self.items_df = items_df.copy()

        # TF-IDF feature extraction
        content = items_df[content_column].fillna('')
        self.item_profiles = self.tfidf.fit_transform(content)

        # Calculate item similarity matrix
        self.item_similarity = cosine_similarity(self.item_profiles)

        # Build index
        self.item_to_idx = {
            item_id: idx for idx, item_id in enumerate(items_df['item_id'])
        }
        self.idx_to_item = {
            idx: item_id for item_id, idx in self.item_to_idx.items()
        }

    def get_similar_items(self, item_id: int, n_items: int = 10) -> List[Tuple[int, float]]:
        """Get similar items"""
        if item_id not in self.item_to_idx:
            return []

        item_idx = self.item_to_idx[item_id]
        similarities = self.item_similarity[item_idx]

        # Exclude self
        similar_indices = np.argsort(similarities)[::-1][1:n_items+1]

        results = [
            (self.idx_to_item[idx], similarities[idx])
            for idx in similar_indices
        ]

        return results

    def recommend_for_user(
        self,
        user_history: List[Tuple[int, float]],
        n_items: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Recommend based on user history

        Args:
            user_history: User history [(item_id, rating), ...]
            n_items: Number of recommendations
        """
        # Build user profile (weighted average of historical items)
        user_profile = np.zeros(self.item_profiles.shape[1])
        total_weight = 0

        for item_id, rating in user_history:
            if item_id in self.item_to_idx:
                item_idx = self.item_to_idx[item_id]
                user_profile += rating * self.item_profiles[item_idx].toarray().flatten()
                total_weight += rating

        if total_weight == 0:
            return []

        user_profile /= total_weight

        # Calculate similarity with all items
        similarities = cosine_similarity(
            user_profile.reshape(1, -1),
            self.item_profiles
        ).flatten()

        # Exclude items already interacted with
        history_items = {item_id for item_id, _ in user_history}

        candidates = []
        for item_id, idx in self.item_to_idx.items():
            if item_id not in history_items:
                candidates.append((item_id, similarities[idx]))

        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:n_items]


# Usage example
if __name__ == "__main__":
    # Simulated movie data
    movies_df = pd.DataFrame({
        'item_id': [1, 2, 3, 4, 5],
        'title': ['Action Movie A', 'Action Movie B', 'Romance Movie C', 'Sci-Fi Movie D', 'Sci-Fi Movie E'],
        'description': [
            'action adventure explosion hero fighting',
            'action thriller chase combat hero',
            'romance love story relationship drama',
            'science fiction space alien future technology',
            'science fiction robot AI technology future'
        ]
    })

    # Train model
    recommender = ContentBasedRecommender()
    recommender.fit(movies_df, 'description')

    # Get similar movies
    similar = recommender.get_similar_items(item_id=4, n_items=3)
    print("Movies similar to Sci-Fi Movie D:", similar)

    # Recommend based on user history
    user_history = [(1, 5), (2, 4)]  # User likes action movies
    recommendations = recommender.recommend_for_user(user_history, n_items=3)
    print("Recommendations:", recommendations)
```

### Knowledge Graph Enhanced Recommendation

```python
from collections import defaultdict

class KnowledgeGraphRecommender:
    """Knowledge Graph-Based Recommendation System"""

    def __init__(self, embedding_dim: int = 64):
        self.embedding_dim = embedding_dim
        self.entity_embeddings = {}
        self.relation_embeddings = {}

    def build_graph(self, triplets: List[Tuple[str, str, str]]):
        """
        Build knowledge graph

        Args:
            triplets: List of triplets [(head, relation, tail), ...]
        """
        self.graph = defaultdict(list)
        entities = set()
        relations = set()

        for head, relation, tail in triplets:
            self.graph[head].append((relation, tail))
            entities.add(head)
            entities.add(tail)
            relations.add(relation)

        # Initialize embeddings
        for entity in entities:
            self.entity_embeddings[entity] = np.random.randn(self.embedding_dim)
        for relation in relations:
            self.relation_embeddings[relation] = np.random.randn(self.embedding_dim)

    def get_entity_neighbors(self, entity: str, hops: int = 2) -> set:
        """Get multi-hop neighbors of an entity"""
        visited = {entity}
        current_layer = {entity}

        for _ in range(hops):
            next_layer = set()
            for node in current_layer:
                for relation, neighbor in self.graph.get(node, []):
                    if neighbor not in visited:
                        next_layer.add(neighbor)
                        visited.add(neighbor)
            current_layer = next_layer

        return visited - {entity}

    def recommend_by_entity(self, entity: str, n_items: int = 10) -> List[str]:
        """Recommend related entities based on an entity"""
        neighbors = self.get_entity_neighbors(entity, hops=2)

        # Sort by embedding similarity
        entity_emb = self.entity_embeddings.get(entity)
        if entity_emb is None:
            return list(neighbors)[:n_items]

        scored_neighbors = []
        for neighbor in neighbors:
            neighbor_emb = self.entity_embeddings.get(neighbor)
            if neighbor_emb is not None:
                similarity = np.dot(entity_emb, neighbor_emb) / (
                    np.linalg.norm(entity_emb) * np.linalg.norm(neighbor_emb)
                )
                scored_neighbors.append((neighbor, similarity))

        scored_neighbors.sort(key=lambda x: x[1], reverse=True)
        return [n for n, _ in scored_neighbors[:n_items]]
```

---

## Hybrid Recommendation Systems

Hybrid recommendation systems combine the advantages of multiple recommendation algorithms, typically achieving better recommendation results than single algorithms.

### Hybrid Strategies

```python
class HybridRecommender:
    """Hybrid Recommendation System"""

    def __init__(
        self,
        cf_model,
        content_model,
        cf_weight: float = 0.5,
        content_weight: float = 0.5
    ):
        self.cf_model = cf_model
        self.content_model = content_model
        self.cf_weight = cf_weight
        self.content_weight = content_weight

    def recommend(
        self,
        user_id: int,
        user_history: List[Tuple[int, float]],
        n_items: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Hybrid recommendation

        Supports multiple hybrid strategies:
        1. Weighted hybrid: Weighted sum of scores from different models
        2. Switching hybrid: Switch between models based on conditions
        3. Cascade hybrid: One model filters, another model ranks
        """
        # Get collaborative filtering recommendations
        cf_recs = self.cf_model.recommend(user_id, n_items=n_items * 2)
        cf_scores = {item_id: score for item_id, score in cf_recs}

        # Get content-based recommendations
        content_recs = self.content_model.recommend_for_user(
            user_history, n_items=n_items * 2
        )
        content_scores = {item_id: score for item_id, score in content_recs}

        # Merge candidate sets
        all_items = set(cf_scores.keys()) | set(content_scores.keys())

        # Calculate hybrid scores
        hybrid_scores = []
        for item_id in all_items:
            cf_score = cf_scores.get(item_id, 0)
            content_score = content_scores.get(item_id, 0)

            # Normalization
            cf_normalized = cf_score / max(cf_scores.values()) if cf_scores else 0
            content_normalized = content_score / max(content_scores.values()) if content_scores else 0

            hybrid_score = (
                self.cf_weight * cf_normalized +
                self.content_weight * content_normalized
            )
            hybrid_scores.append((item_id, hybrid_score))

        hybrid_scores.sort(key=lambda x: x[1], reverse=True)
        return hybrid_scores[:n_items]
```

---

## Deep Learning Recommendations

Deep learning applications in recommendation systems are becoming increasingly widespread, capable of automatically learning complex feature interactions and user behavior patterns.

### Neural Collaborative Filtering (NCF)

Neural Collaborative Filtering uses neural networks to replace the dot product operation in matrix factorization, enabling learning of more complex user-item interaction patterns.

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset

class NCFDataset(Dataset):
    """NCF Dataset"""

    def __init__(self, user_ids, item_ids, ratings):
        self.user_ids = torch.LongTensor(user_ids)
        self.item_ids = torch.LongTensor(item_ids)
        self.ratings = torch.FloatTensor(ratings)

    def __len__(self):
        return len(self.ratings)

    def __getitem__(self, idx):
        return self.user_ids[idx], self.item_ids[idx], self.ratings[idx]


class NeuralCollaborativeFiltering(nn.Module):
    """Neural Collaborative Filtering Model"""

    def __init__(
        self,
        n_users: int,
        n_items: int,
        embedding_dim: int = 64,
        mlp_layers: List[int] = [128, 64, 32]
    ):
        super().__init__()

        # GMF part embeddings
        self.gmf_user_embedding = nn.Embedding(n_users, embedding_dim)
        self.gmf_item_embedding = nn.Embedding(n_items, embedding_dim)

        # MLP part embeddings
        self.mlp_user_embedding = nn.Embedding(n_users, embedding_dim)
        self.mlp_item_embedding = nn.Embedding(n_items, embedding_dim)

        # MLP layers
        mlp_input_dim = embedding_dim * 2
        self.mlp_layers = nn.ModuleList()

        for layer_size in mlp_layers:
            self.mlp_layers.append(nn.Linear(mlp_input_dim, layer_size))
            self.mlp_layers.append(nn.ReLU())
            self.mlp_layers.append(nn.Dropout(0.2))
            mlp_input_dim = layer_size

        # Output layer
        self.output_layer = nn.Linear(embedding_dim + mlp_layers[-1], 1)

        self._init_weights()

    def _init_weights(self):
        """Initialize weights"""
        for module in self.modules():
            if isinstance(module, nn.Embedding):
                nn.init.normal_(module.weight, std=0.01)
            elif isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                nn.init.zeros_(module.bias)

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor) -> torch.Tensor:
        # GMF part
        gmf_user = self.gmf_user_embedding(user_ids)
        gmf_item = self.gmf_item_embedding(item_ids)
        gmf_output = gmf_user * gmf_item  # Element-wise multiplication

        # MLP part
        mlp_user = self.mlp_user_embedding(user_ids)
        mlp_item = self.mlp_item_embedding(item_ids)
        mlp_input = torch.cat([mlp_user, mlp_item], dim=-1)

        for layer in self.mlp_layers:
            mlp_input = layer(mlp_input)
        mlp_output = mlp_input

        # Merge outputs
        concat = torch.cat([gmf_output, mlp_output], dim=-1)
        output = self.output_layer(concat)

        return output.squeeze()


class NCFTrainer:
    """NCF Trainer"""

    def __init__(
        self,
        model: NeuralCollaborativeFiltering,
        learning_rate: float = 0.001,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
    ):
        self.model = model.to(device)
        self.device = device
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        self.criterion = nn.MSELoss()

    def train_epoch(self, dataloader: DataLoader) -> float:
        self.model.train()
        total_loss = 0

        for user_ids, item_ids, ratings in dataloader:
            user_ids = user_ids.to(self.device)
            item_ids = item_ids.to(self.device)
            ratings = ratings.to(self.device)

            self.optimizer.zero_grad()
            predictions = self.model(user_ids, item_ids)
            loss = self.criterion(predictions, ratings)
            loss.backward()
            self.optimizer.step()

            total_loss += loss.item() * len(ratings)

        return total_loss / len(dataloader.dataset)

    def validate(self, dataloader: DataLoader) -> float:
        self.model.train()
        total_loss = 0

        with torch.no_grad():
            for user_ids, item_ids, ratings in dataloader:
                user_ids = user_ids.to(self.device)
                item_ids = item_ids.to(self.device)
                ratings = ratings.to(self.device)

                predictions = self.model(user_ids, item_ids)
                loss = self.criterion(predictions, ratings)
                total_loss += loss.item() * len(ratings)

        return total_loss / len(dataloader.dataset)

    def fit(
        self,
        train_loader: DataLoader,
        val_loader: DataLoader,
        n_epochs: int = 50
    ):
        best_val_loss = float('inf')

        for epoch in range(n_epochs):
            train_loss = self.train_epoch(train_loader)
            val_loss = self.validate(val_loader)

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save(self.model.state_dict(), 'best_ncf_model.pt')

            if (epoch + 1) % 10 == 0:
                print(f"Epoch {epoch+1}/{n_epochs}")
                print(f"  Train Loss: {train_loss:.4f}")
                print(f"  Val Loss: {val_loss:.4f}")
```

### DeepFM

DeepFM combines Factorization Machines (FM) and Deep Neural Networks, capable of simultaneously learning low-order and high-order feature interactions.

```python
class DeepFM(nn.Module):
    """DeepFM Model"""

    def __init__(
        self,
        field_dims: List[int],
        embedding_dim: int = 16,
        mlp_dims: List[int] = [256, 128, 64]
    ):
        super().__init__()

        self.n_fields = len(field_dims)

        # Feature embeddings
        self.embeddings = nn.ModuleList([
            nn.Embedding(dim, embedding_dim) for dim in field_dims
        ])

        # First-order features (linear part)
        self.linear = nn.ModuleList([
            nn.Embedding(dim, 1) for dim in field_dims
        ])

        # FM second-order interaction part is implemented in forward

        # DNN part
        dnn_input_dim = self.n_fields * embedding_dim
        self.dnn_layers = nn.ModuleList()

        for mlp_dim in mlp_dims:
            self.dnn_layers.append(nn.Linear(dnn_input_dim, mlp_dim))
            self.dnn_layers.append(nn.BatchNorm1d(mlp_dim))
            self.dnn_layers.append(nn.ReLU())
            self.dnn_layers.append(nn.Dropout(0.2))
            dnn_input_dim = mlp_dim

        # Output layer
        self.output_layer = nn.Linear(mlp_dims[-1] + 1, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Input features [batch_size, n_fields]
        """
        # Get embeddings
        embed_list = []
        for i in range(self.n_fields):
            embed_list.append(self.embeddings[i](x[:, i]))
        embeddings = torch.stack(embed_list, dim=1)  # [batch, n_fields, embed_dim]

        # First-order features
        linear_out = sum([
            self.linear[i](x[:, i]).squeeze() for i in range(self.n_fields)
        ])

        # FM second-order interaction
        # sum_square: (sum(vi))^2
        sum_square = embeddings.sum(dim=1).pow(2).sum(dim=1)
        # square_sum: sum(vi^2)
        square_sum = embeddings.pow(2).sum(dim=1).sum(dim=1)
        fm_out = 0.5 * (sum_square - square_sum)

        # DNN part
        dnn_input = embeddings.view(embeddings.size(0), -1)
        for layer in self.dnn_layers:
            dnn_input = layer(dnn_input)
        dnn_out = dnn_input

        # Merge outputs
        combined = torch.cat([
            (linear_out + fm_out).unsqueeze(1),
            dnn_out
        ], dim=1)

        output = torch.sigmoid(self.output_layer(combined)).squeeze()

        return output
```

### Sequential Recommendation (Transformer-based)

```python
class TransformerRecommender(nn.Module):
    """Transformer-based Sequential Recommendation Model"""

    def __init__(
        self,
        n_items: int,
        embedding_dim: int = 128,
        n_heads: int = 4,
        n_layers: int = 2,
        max_seq_len: int = 50,
        dropout: float = 0.1
    ):
        super().__init__()

        self.item_embedding = nn.Embedding(n_items + 1, embedding_dim, padding_idx=0)
        self.position_embedding = nn.Embedding(max_seq_len, embedding_dim)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embedding_dim,
            nhead=n_heads,
            dim_feedforward=embedding_dim * 4,
            dropout=dropout,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)

        self.output_layer = nn.Linear(embedding_dim, n_items)
        self.dropout = nn.Dropout(dropout)

    def forward(
        self,
        item_seq: torch.Tensor,
        attention_mask: torch.Tensor = None
    ) -> torch.Tensor:
        """
        Args:
            item_seq: Item sequence [batch_size, seq_len]
            attention_mask: Attention mask
        """
        batch_size, seq_len = item_seq.shape

        # Get embeddings
        item_emb = self.item_embedding(item_seq)

        # Positional encoding
        positions = torch.arange(seq_len, device=item_seq.device)
        pos_emb = self.position_embedding(positions)

        # Merge embeddings
        hidden = self.dropout(item_emb + pos_emb)

        # Generate causal mask (prevent seeing future information)
        causal_mask = torch.triu(
            torch.ones(seq_len, seq_len, device=item_seq.device),
            diagonal=1
        ).bool()

        # Transformer encoding
        if attention_mask is not None:
            # padding mask
            key_padding_mask = ~attention_mask.bool()
        else:
            key_padding_mask = None

        hidden = self.transformer(
            hidden,
            mask=causal_mask,
            src_key_padding_mask=key_padding_mask
        )

        # Output prediction
        output = self.output_layer(hidden)

        return output

    def predict_next(self, item_seq: torch.Tensor, top_k: int = 10) -> torch.Tensor:
        """Predict next item"""
        self.train(False)
        with torch.no_grad():
            output = self.forward(item_seq)
            # Take prediction at last position in sequence
            last_output = output[:, -1, :]
            _, indices = torch.topk(last_output, top_k)
        return indices
```

---

## Evaluation Metrics

Evaluation of recommendation systems needs to be conducted from multiple dimensions, including accuracy, diversity, novelty, etc.

### Offline Evaluation Metrics

```python
import numpy as np
from typing import List, Dict
from collections import defaultdict

class RecommendationMetrics:
    """Recommendation System Evaluation Metrics"""

    @staticmethod
    def precision_at_k(recommended: List, relevant: set, k: int) -> float:
        """
        Precision@K

        Args:
            recommended: Recommendation list
            relevant: Set of relevant items
            k: Top-K
        """
        recommended_k = recommended[:k]
        hits = len(set(recommended_k) & relevant)
        return hits / k

    @staticmethod
    def recall_at_k(recommended: List, relevant: set, k: int) -> float:
        """
        Recall@K
        """
        if len(relevant) == 0:
            return 0.0
        recommended_k = recommended[:k]
        hits = len(set(recommended_k) & relevant)
        return hits / len(relevant)

    @staticmethod
    def ndcg_at_k(recommended: List, relevant: set, k: int) -> float:
        """
        Normalized Discounted Cumulative Gain@K

        NDCG measures ranking quality, with higher scores for relevant items ranked earlier
        """
        recommended_k = recommended[:k]

        # Calculate DCG
        dcg = 0.0
        for i, item in enumerate(recommended_k):
            if item in relevant:
                dcg += 1.0 / np.log2(i + 2)  # i starts from 0, so +2

        # Calculate ideal DCG
        ideal_dcg = sum([1.0 / np.log2(i + 2) for i in range(min(len(relevant), k))])

        if ideal_dcg == 0:
            return 0.0
        return dcg / ideal_dcg

    @staticmethod
    def map_at_k(recommended: List, relevant: set, k: int) -> float:
        """
        Mean Average Precision@K
        """
        recommended_k = recommended[:k]

        precisions = []
        hits = 0

        for i, item in enumerate(recommended_k):
            if item in relevant:
                hits += 1
                precisions.append(hits / (i + 1))

        if len(precisions) == 0:
            return 0.0
        return np.mean(precisions)

    @staticmethod
    def mrr(recommended: List, relevant: set) -> float:
        """
        Mean Reciprocal Rank

        Reciprocal of the rank of first relevant item
        """
        for i, item in enumerate(recommended):
            if item in relevant:
                return 1.0 / (i + 1)
        return 0.0

    @staticmethod
    def hit_rate_at_k(recommended: List, relevant: set, k: int) -> float:
        """
        Hit Rate@K

        Whether the recommendation list contains relevant items
        """
        recommended_k = recommended[:k]
        return 1.0 if len(set(recommended_k) & relevant) > 0 else 0.0

    @staticmethod
    def coverage(all_recommendations: List[List], n_items: int) -> float:
        """
        Coverage

        Proportion of items the recommendation system can recommend
        """
        recommended_items = set()
        for recs in all_recommendations:
            recommended_items.update(recs)
        return len(recommended_items) / n_items

    @staticmethod
    def diversity(recommended: List, item_similarity: np.ndarray) -> float:
        """
        Diversity

        Average dissimilarity between items in the recommendation list
        """
        if len(recommended) < 2:
            return 0.0

        total_dissimilarity = 0.0
        count = 0

        for i in range(len(recommended)):
            for j in range(i + 1, len(recommended)):
                total_dissimilarity += 1 - item_similarity[recommended[i], recommended[j]]
                count += 1

        return total_dissimilarity / count if count > 0 else 0.0

    @staticmethod
    def novelty(recommended: List, item_popularity: Dict[int, int], n_users: int) -> float:
        """
        Novelty

        Ability to recommend long-tail items, measured by self-information
        """
        if len(recommended) == 0:
            return 0.0

        novelty_scores = []
        for item in recommended:
            popularity = item_popularity.get(item, 1)
            # Self-information: -log2(popularity / n_users)
            novelty_scores.append(-np.log2(popularity / n_users))

        return np.mean(novelty_scores)


def run_model_assessment(
    model,
    test_data: Dict[int, set],
    k_values: List[int] = [5, 10, 20]
) -> Dict[str, Dict[int, float]]:
    """
    Evaluate recommendation model

    Args:
        model: Recommendation model
        test_data: Test data {user_id: {relevant_items}}
        k_values: List of K values for evaluation
    """
    metrics = RecommendationMetrics()
    results = defaultdict(lambda: defaultdict(list))

    for user_id, relevant_items in test_data.items():
        # Get recommendations
        recommendations = model.recommend(user_id, n_items=max(k_values))
        recommended_items = [item_id for item_id, _ in recommendations]

        for k in k_values:
            results['precision'][k].append(
                metrics.precision_at_k(recommended_items, relevant_items, k)
            )
            results['recall'][k].append(
                metrics.recall_at_k(recommended_items, relevant_items, k)
            )
            results['ndcg'][k].append(
                metrics.ndcg_at_k(recommended_items, relevant_items, k)
            )
            results['map'][k].append(
                metrics.map_at_k(recommended_items, relevant_items, k)
            )
            results['hit_rate'][k].append(
                metrics.hit_rate_at_k(recommended_items, relevant_items, k)
            )

    # Calculate averages
    avg_results = {}
    for metric_name, k_scores in results.items():
        avg_results[metric_name] = {
            k: np.mean(scores) for k, scores in k_scores.items()
        }

    return avg_results


# Print evaluation results
def print_assessment_results(results: Dict[str, Dict[int, float]]):
    """Print evaluation results"""
    print("\n" + "="*60)
    print("Recommendation System Evaluation Results")
    print("="*60)

    k_values = list(list(results.values())[0].keys())

    # Header
    header = f"{'Metric':<15}"
    for k in k_values:
        header += f"@{k:<10}"
    print(header)
    print("-"*60)

    # Results for each metric
    for metric_name, k_scores in results.items():
        row = f"{metric_name:<15}"
        for k in k_values:
            row += f"{k_scores[k]:.4f}     "
        print(row)

    print("="*60)
```

### A/B Testing

```python
from scipy import stats

class ABTest:
    """A/B Testing Framework"""

    def __init__(self, control_name: str = 'A', treatment_name: str = 'B'):
        self.control_name = control_name
        self.treatment_name = treatment_name

    def calculate_sample_size(
        self,
        baseline_rate: float,
        mde: float,  # minimum detectable effect
        alpha: float = 0.05,
        power: float = 0.8
    ) -> int:
        """
        Calculate required sample size

        Args:
            baseline_rate: Baseline conversion rate
            mde: Minimum detectable effect
            alpha: Significance level
            power: Statistical power
        """
        from scipy.stats import norm

        p1 = baseline_rate
        p2 = baseline_rate * (1 + mde)

        z_alpha = norm.ppf(1 - alpha / 2)
        z_beta = norm.ppf(power)

        p_bar = (p1 + p2) / 2

        n = (
            (z_alpha * np.sqrt(2 * p_bar * (1 - p_bar)) +
             z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
        ) / ((p2 - p1) ** 2)

        return int(np.ceil(n))

    def run_test(
        self,
        control_conversions: int,
        control_total: int,
        treatment_conversions: int,
        treatment_total: int,
        alpha: float = 0.05
    ) -> Dict:
        """
        Run A/B test

        Returns:
            Dictionary containing test results
        """
        control_rate = control_conversions / control_total
        treatment_rate = treatment_conversions / treatment_total

        # Chi-square test
        contingency_table = [
            [control_conversions, control_total - control_conversions],
            [treatment_conversions, treatment_total - treatment_conversions]
        ]
        chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)

        # Relative lift
        relative_lift = (treatment_rate - control_rate) / control_rate

        # Confidence interval
        se = np.sqrt(
            treatment_rate * (1 - treatment_rate) / treatment_total +
            control_rate * (1 - control_rate) / control_total
        )
        z = stats.norm.ppf(1 - alpha / 2)
        ci_lower = (treatment_rate - control_rate) - z * se
        ci_upper = (treatment_rate - control_rate) + z * se

        return {
            'control_rate': control_rate,
            'treatment_rate': treatment_rate,
            'relative_lift': relative_lift,
            'p_value': p_value,
            'significant': p_value < alpha,
            'confidence_interval': (ci_lower, ci_upper)
        }
```

---

## Industry Practices

### Recall and Ranking Architecture

```python
class IndustrialRecommender:
    """Industrial-Grade Recommendation System Architecture"""

    def __init__(self):
        self.recall_models = []  # Multi-channel recall
        self.ranker = None  # Ranking model
        self.reranker = None  # Re-ranking model

    def add_recall_model(self, name: str, model, weight: float = 1.0):
        """Add recall channel"""
        self.recall_models.append({
            'name': name,
            'model': model,
            'weight': weight
        })

    def set_ranker(self, ranker):
        """Set ranking model"""
        self.ranker = ranker

    def set_reranker(self, reranker):
        """Set re-ranking model"""
        self.reranker = reranker

    def recall(self, user_id: int, context: Dict, n_candidates: int = 500) -> List[int]:
        """
        Multi-channel recall

        Common recall channels:
        1. Collaborative filtering recall
        2. Vector recall (Embedding-based)
        3. Popular items recall
        4. Tag-based recall
        5. Real-time recall (based on recent behavior)
        """
        all_candidates = defaultdict(float)

        for recall_config in self.recall_models:
            model = recall_config['model']
            weight = recall_config['weight']

            candidates = model.recall(user_id, context, n_items=n_candidates // len(self.recall_models))

            for item_id, score in candidates:
                all_candidates[item_id] += score * weight

        # Sort by score, return candidate set
        sorted_candidates = sorted(
            all_candidates.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return [item_id for item_id, _ in sorted_candidates[:n_candidates]]

    def rank(
        self,
        user_id: int,
        candidates: List[int],
        context: Dict
    ) -> List[Tuple[int, float]]:
        """
        Ranking

        Use CTR prediction model to rank candidate set
        """
        if self.ranker is None:
            return [(item_id, 1.0) for item_id in candidates]

        scores = self.ranker.predict(user_id, candidates, context)

        ranked = list(zip(candidates, scores))
        ranked.sort(key=lambda x: x[1], reverse=True)

        return ranked

    def rerank(
        self,
        ranked_items: List[Tuple[int, float]],
        context: Dict
    ) -> List[Tuple[int, float]]:
        """
        Re-ranking

        Consider diversity, timeliness, business objectives, etc.
        """
        if self.reranker is None:
            return ranked_items

        return self.reranker.rerank(ranked_items, context)

    def recommend(
        self,
        user_id: int,
        context: Dict,
        n_items: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Complete recommendation pipeline
        """
        # 1. Recall
        candidates = self.recall(user_id, context)

        # 2. Rank
        ranked = self.rank(user_id, candidates, context)

        # 3. Re-rank
        final = self.rerank(ranked, context)

        return final[:n_items]
```

### Real-time Feature Engineering

```python
class FeatureStore:
    """Feature Store"""

    def __init__(self):
        self.user_features = {}  # User features
        self.item_features = {}  # Item features
        self.realtime_features = {}  # Real-time features

    def get_user_features(self, user_id: int) -> Dict:
        """Get user features"""
        return self.user_features.get(user_id, {})

    def get_item_features(self, item_id: int) -> Dict:
        """Get item features"""
        return self.item_features.get(item_id, {})

    def get_realtime_features(self, user_id: int) -> Dict:
        """
        Get real-time features

        Including:
        - Recently viewed items
        - Recently clicked categories
        - In-session behavior statistics
        - Real-time context (time, location, etc.)
        """
        return self.realtime_features.get(user_id, {})

    def build_feature_vector(
        self,
        user_id: int,
        item_id: int,
        context: Dict
    ) -> np.ndarray:
        """Build feature vector"""
        user_feat = self.get_user_features(user_id)
        item_feat = self.get_item_features(item_id)
        realtime_feat = self.get_realtime_features(user_id)

        # Merge features
        features = {
            **user_feat,
            **item_feat,
            **realtime_feat,
            **context
        }

        # Convert to vector (actual implementation needs feature engineering)
        return self._encode_features(features)

    def _encode_features(self, features: Dict) -> np.ndarray:
        """Feature encoding (simplified version)"""
        # Actual implementation needs feature normalization, categorical encoding, etc.
        return np.array(list(features.values()))
```

---

## Interview Key Points

### Common Interview Questions

**1. How to solve the cold start problem in collaborative filtering?**

```python
"""
Cold Start Solutions:

1. New User Cold Start:
   - Recommend based on demographic features
   - Popular items recommendation
   - Guide users to fill preference questionnaires
   - Utilize social relationships from registration

2. New Item Cold Start:
   - Content-based recommendation
   - Use item attribute similarity
   - Exploration and Exploitation

3. System Cold Start:
   - Introduce external data
   - Expert annotation
   - Hybrid recommendation strategies
"""
```

**2. How to solve the data sparsity problem?**

```python
"""
Data Sparsity Solutions:

1. Matrix Factorization:
   - Dimensionality reduction, learning dense representations
   - Regularization to prevent overfitting

2. Introduce Implicit Feedback:
   - Browsing, dwell time, and other behaviors
   - Negative sampling strategies

3. Feature Expansion:
   - Utilize item attributes
   - Knowledge graph supplementation

4. Transfer Learning:
   - Transfer knowledge from related domains
"""
```

**3. How to balance diversity and accuracy in recommendation systems?**

```python
"""
Balancing Diversity and Accuracy:

1. MMR (Maximal Marginal Relevance):
   score = lambda_param * relevance - (1 - lambda_param) * max_similarity_to_selected

2. DPP (Determinantal Point Process):
   Use determinant to model diversity

3. Slot-based Recommendation:
   Use different strategies for different positions

4. Multi-objective Optimization:
   Pareto optimal solutions
"""

class MMRReranker:
    """MMR Re-ranking"""

    def __init__(self, lambda_param: float = 0.7):
        self.lambda_param = lambda_param

    def rerank(
        self,
        items: List[Tuple[int, float]],
        item_similarity: Dict[Tuple[int, int], float],
        n_items: int = 10
    ) -> List[Tuple[int, float]]:
        selected = []
        candidates = list(items)

        while len(selected) < n_items and candidates:
            best_score = float('-inf')
            best_item = None

            for item_id, relevance in candidates:
                # Calculate maximum similarity with selected items
                if selected:
                    max_sim = max(
                        item_similarity.get((item_id, s_id), 0)
                        for s_id, _ in selected
                    )
                else:
                    max_sim = 0

                # MMR score
                mmr_score = (
                    self.lambda_param * relevance -
                    (1 - self.lambda_param) * max_sim
                )

                if mmr_score > best_score:
                    best_score = mmr_score
                    best_item = (item_id, relevance)

            if best_item:
                selected.append(best_item)
                candidates = [c for c in candidates if c[0] != best_item[0]]

        return selected
```

**4. Real-time Recommendation System Architecture Design**

```
+-------------------------------------------------------------------+
|              Real-time Recommendation System Architecture          |
+-------------------------------------------------------------------+
|                                                                    |
|  User Request -> API Gateway -> Recommendation Service             |
|                                   |                                |
|                    +--------------+--------------+                 |
|                    |                             |                 |
|              Feature Service              Model Service            |
|                    |                             |                 |
|            +-------+-------+    +-------+-------+-------+          |
|            |       |       |    |       |       |       |          |
|          Redis  HBase  Flink  Recall  Ranking  Re-rank             |
|        (Real-time)(Offline)(Streaming)                             |
|                                                                    |
|  Data Flow:                                                        |
|  User Behavior -> Kafka -> Flink -> Feature Update                 |
|                         -> HDFS -> Spark -> Model Training -> Deploy|
|                                                                    |
+-------------------------------------------------------------------+
```

### Core Knowledge Summary

| Topic | Key Points |
|------|----------|
| Collaborative Filtering | User-CF suitable for fewer users, more items; Item-CF suitable for fewer items, more users; Matrix factorization suitable for large-scale data |
| Content-Based | Does not depend on user behavior; High interpretability; Easy to fall into "filter bubble" |
| Deep Learning | NCF learns non-linear interactions; DeepFM handles feature interactions; Transformer models sequences |
| Evaluation Metrics | Accuracy (Precision/Recall/NDCG); Diversity; Coverage; Novelty |
| Industry Practice | Multi-channel recall + Ranking + Re-ranking; Feature engineering; A/B testing |

---

## Summary

Recommendation systems are a highly comprehensive field involving machine learning, deep learning, distributed systems, and other technical areas. This article introduced the core algorithms and practical techniques of recommendation systems:

1. **Collaborative Filtering** is the foundation of recommendation systems, including three main methods: user-based, item-based, and matrix factorization
2. **Content-Based Recommendation** recommends by analyzing item features and can effectively solve the cold start problem
3. **Deep Learning Recommendation** can automatically learn complex feature interactions and is the mainstream approach in current industry
4. **Evaluation Metrics** need to measure recommendation effectiveness from multiple dimensions, including accuracy, diversity, and novelty
5. **Industry Practice** adopts recall-ranking-re-ranking architecture, combined with real-time features and A/B testing for continuous optimization

Mastering this knowledge will enable you to design and build efficient personalized recommendation services, providing users with better experiences.

## Reference Resources

- [Recommender Systems Handbook](https://link.springer.com/book/10.1007/978-1-0716-2197-4)
- [Deep Learning for Recommender Systems](https://dl.acm.org/doi/10.1145/3285029)
- [Google Recommendations AI](https://cloud.google.com/recommendations)
- [Netflix Tech Blog - Recommendations](https://netflixtechblog.com/)
