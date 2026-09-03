---
title: "Recommender Systems: Engineering Practice"
description: "Building production-grade recommender systems: retrieval, ranking, cold start, and A/B testing"
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - recommender systems
  - retrieval
  - ranking
  - engineering
status: imported
origin: old/src/content/docs/datascience/recommender-engineering.en.md
divergence: 0.205
issues: []
legacy:
  category: DataScience
  subcategory: Recommender
  order: 26
  lastUpdated: 2026-01-07
---

Recommender systems are one of the core components of modern internet products, from product recommendations on e-commerce platforms and content recommendations on video websites to information feed ranking on social media—recommender systems are everywhere. We'll explore how to build a production-grade recommender system from an engineering practice perspective, covering architecture design, retrieval strategies, ranking models, cold start solutions, and A/B testing.

## Recommender System Architecture Overview

### Core Challenges of Recommender Systems

Building recommender systems faces multiple challenges:

- **Massive data processing**: Hundreds of millions of users, tens of millions of items, trillions of behavioral data points
- **Real-time requirements**: Users expect millisecond-level recommendation responses
- **Multi-objective optimization**: Need to balance click-through rate, conversion rate, user retention, and other metrics
- **Cold start problem**: New users and new items lack historical data
- **System complexity**: Involves data pipelines, feature engineering, model training, online serving, and other components

### Classic Recommender System Architecture

A complete recommender system typically adopts a cascading architecture of "retrieval - pre-ranking - ranking - re-ranking":

```
User Request
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                       Retrieval Layer                        │
│         Quickly filter tens of thousands of candidates       │
│              from massive candidate pool                     │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│   │   CF    │ │ Vector  │ │ Popular │ │  Rule   │          │
│   │ Recall  │ │ Recall  │ │ Recall  │ │ Recall  │          │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │ ~10000 candidates
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       Pre-Ranking Layer                      │
│         Use lightweight model for quick filtering,           │
│              retain thousands of candidates                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ ~1000 candidates
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       Ranking Layer                          │
│         Use complex model for precise scoring,               │
│              select hundreds of candidates                   │
└─────────────────────────┬───────────────────────────────────┘
                          │ ~100 candidates
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       Re-Ranking Layer                       │
│         Consider diversity, business rules,                  │
│              generate final recommendation list              │
└─────────────────────────┬───────────────────────────────────┘
                          │ ~10-50 results
                          ▼
                     Final Recommendations
```

### Recommender System Data Flow Architecture

```
                     ┌─────────────────────────────────────────────┐
                     │              User Behavior Logs             │
                     │    (impressions, clicks, purchases, dwell   │
                     │              time, etc.)                    │
                     └──────────────────┬──────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
    ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
    │ Real-time     │           │    Batch      │           │     Data      │
    │ Stream        │           │  Processing   │           │  Warehouse    │
    │ Processing    │           │   (Spark)     │           │  (Hive/HDFS)  │
    │ (Flink/Kafka) │           │               │           │               │
    └───────┬───────┘           └───────┬───────┘           └───────┬───────┘
            │                           │                           │
            ▼                           ▼                           ▼
    ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
    │   Real-time   │           │   Offline     │           │    Sample     │
    │   Features    │           │   Features    │           │ Construction  │
    │   (Redis)     │           │   (HDFS)      │           │(Training Data)│
    └───────┬───────┘           └───────┬───────┘           └───────┬───────┘
            │                           │                           │
            └───────────────────────────┼───────────────────────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │  Model Training │
                               │  (TensorFlow/   │
                               │   PyTorch)      │
                               └────────┬────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │  Model Serving  │
                               │  (TF Serving/   │
                               │   TorchServe)   │
                               └────────┬────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │ Recommendation  │
                               │    Service      │
                               │(Online Inference│
                               └─────────────────┘
```

## Retrieval Strategies in Detail

The retrieval layer is the first checkpoint of the recommender system, aiming to quickly filter candidates that users might be interested in (tens of thousands) from the massive item pool (millions to billions), requiring high efficiency and high recall rate.

### Multi-Channel Retrieval Architecture

Production systems typically adopt multi-channel retrieval strategies, combining multiple retrieval sources:

```python
from typing import List, Dict, Set
from dataclasses import dataclass
import asyncio

@dataclass
class RecallResult:
    item_id: str
    score: float
    source: str

class MultiRecallEngine:
    """Multi-channel retrieval engine"""

    def __init__(self):
        self.recall_sources = {}

    def register_source(self, name: str, recall_func):
        """Register retrieval source"""
        self.recall_sources[name] = recall_func

    async def recall(self, user_id: str, context: Dict,
                     top_k: int = 1000) -> List[RecallResult]:
        """Execute multi-channel retrieval"""
        # Execute all retrieval sources in parallel
        tasks = [
            self._execute_recall(name, func, user_id, context)
            for name, func in self.recall_sources.items()
        ]
        results = await asyncio.gather(*tasks)

        # Merge and deduplicate
        merged = self._merge_results(results, top_k)
        return merged

    async def _execute_recall(self, name: str, func,
                               user_id: str, context: Dict):
        """Execute single retrieval channel"""
        try:
            items = await func(user_id, context)
            return [RecallResult(item_id=i['id'],
                                score=i['score'],
                                source=name) for i in items]
        except Exception as e:
            print(f"Recall source {name} failed: {e}")
            return []

    def _merge_results(self, all_results: List[List[RecallResult]],
                       top_k: int) -> List[RecallResult]:
        """Merge multi-channel retrieval results"""
        seen: Set[str] = set()
        merged = []

        # Simple merge strategy: sort by score, deduplicate
        all_items = [item for results in all_results for item in results]
        all_items.sort(key=lambda x: x.score, reverse=True)

        for item in all_items:
            if item.item_id not in seen:
                seen.add(item.item_id)
                merged.append(item)
                if len(merged) >= top_k:
                    break

        return merged
```

### Collaborative Filtering Retrieval

Collaborative filtering is the most classic retrieval method, based on the assumption that "similar users like similar items."

**Item-based Collaborative Filtering (ItemCF):**

```python
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict

class ItemCFRecall:
    """Item-based collaborative filtering retrieval"""

    def __init__(self, similarity_threshold: float = 0.1):
        self.item_similarity = None
        self.user_items = defaultdict(set)
        self.item_users = defaultdict(set)
        self.similarity_threshold = similarity_threshold

    def fit(self, interactions: List[Dict]):
        """
        Train item similarity matrix
        interactions: [{'user_id': 'u1', 'item_id': 'i1', 'rating': 5}, ...]
        """
        # Build user-item interactions
        for inter in interactions:
            user_id = inter['user_id']
            item_id = inter['item_id']
            self.user_items[user_id].add(item_id)
            self.item_users[item_id].add(user_id)

        # Build item-item co-occurrence matrix
        items = list(self.item_users.keys())
        item_idx = {item: idx for idx, item in enumerate(items)}
        n_items = len(items)

        # Use sparse matrix for similarity computation
        row, col, data = [], [], []
        for user, user_item_set in self.user_items.items():
            user_item_list = list(user_item_set)
            for i in user_item_list:
                for j in user_item_list:
                    if i != j:
                        row.append(item_idx[i])
                        col.append(item_idx[j])
                        data.append(1.0)

        co_matrix = csr_matrix((data, (row, col)), shape=(n_items, n_items))

        # Compute cosine similarity
        self.item_similarity = cosine_similarity(co_matrix)
        self.items = items
        self.item_idx = item_idx

    def recall(self, user_id: str, top_k: int = 100) -> List[Dict]:
        """Retrieve items for user"""
        if user_id not in self.user_items:
            return []

        user_interacted = self.user_items[user_id]
        candidates = defaultdict(float)

        # Find similar items based on user's historical interactions
        for item in user_interacted:
            if item not in self.item_idx:
                continue
            item_id = self.item_idx[item]
            similarities = self.item_similarity[item_id]

            for idx, sim in enumerate(similarities):
                candidate_item = self.items[idx]
                if candidate_item not in user_interacted and sim > self.similarity_threshold:
                    candidates[candidate_item] += sim

        # Sort and return
        sorted_candidates = sorted(candidates.items(),
                                   key=lambda x: x[1], reverse=True)
        return [{'id': item, 'score': score}
                for item, score in sorted_candidates[:top_k]]
```

### Vector Retrieval (Embedding Recall)

Vector retrieval is currently the most mainstream retrieval method, mapping users and items to the same vector space and using approximate nearest neighbor (ANN) algorithms for efficient search.

**Two-Tower Model:**

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class TwoTowerModel(nn.Module):
    """Two-tower retrieval model"""

    def __init__(self, user_feature_dim: int, item_feature_dim: int,
                 embedding_dim: int = 128, hidden_dims: List[int] = [256, 128]):
        super().__init__()

        # User tower
        self.user_tower = self._build_tower(user_feature_dim, embedding_dim, hidden_dims)

        # Item tower
        self.item_tower = self._build_tower(item_feature_dim, embedding_dim, hidden_dims)

        # Temperature parameter (for softmax)
        self.temperature = nn.Parameter(torch.ones(1) * 0.07)

    def _build_tower(self, input_dim: int, output_dim: int,
                     hidden_dims: List[int]) -> nn.Sequential:
        """Build tower network"""
        layers = []
        prev_dim = input_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(0.2)
            ])
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, output_dim))
        return nn.Sequential(*layers)

    def encode_user(self, user_features: torch.Tensor) -> torch.Tensor:
        """Encode user features"""
        embedding = self.user_tower(user_features)
        return F.normalize(embedding, p=2, dim=1)

    def encode_item(self, item_features: torch.Tensor) -> torch.Tensor:
        """Encode item features"""
        embedding = self.item_tower(item_features)
        return F.normalize(embedding, p=2, dim=1)

    def forward(self, user_features: torch.Tensor,
                item_features: torch.Tensor) -> torch.Tensor:
        """Compute user-item similarity"""
        user_emb = self.encode_user(user_features)
        item_emb = self.encode_item(item_features)

        # Compute cosine similarity
        similarity = torch.matmul(user_emb, item_emb.T) / self.temperature
        return similarity

    def compute_loss(self, user_features: torch.Tensor,
                     positive_items: torch.Tensor,
                     negative_items: torch.Tensor) -> torch.Tensor:
        """
        Contrastive learning loss with in-batch negative sampling
        """
        user_emb = self.encode_user(user_features)
        pos_emb = self.encode_item(positive_items)
        neg_emb = self.encode_item(negative_items)

        # Positive sample similarity
        pos_score = torch.sum(user_emb * pos_emb, dim=1)

        # Negative sample similarity
        neg_score = torch.matmul(user_emb, neg_emb.T)

        # InfoNCE Loss
        logits = torch.cat([pos_score.unsqueeze(1), neg_score], dim=1) / self.temperature
        labels = torch.zeros(logits.size(0), dtype=torch.long, device=logits.device)
        loss = F.cross_entropy(logits, labels)

        return loss
```

**Vector Index Service (Faiss-based):**

```python
import faiss
import numpy as np
import json
from typing import List, Tuple

class VectorIndex:
    """Vector index service"""

    def __init__(self, dimension: int, index_type: str = 'IVF'):
        self.dimension = dimension
        self.index_type = index_type
        self.index = None
        self.id_mapping = {}  # faiss_id -> item_id

    def build_index(self, embeddings: np.ndarray, item_ids: List[str],
                    nlist: int = 100, nprobe: int = 10):
        """
        Build vector index
        embeddings: shape (n_items, dimension)
        """
        n_items = len(embeddings)

        if self.index_type == 'IVF':
            # IVF index: suitable for large-scale data
            quantizer = faiss.IndexFlatIP(self.dimension)
            self.index = faiss.IndexIVFFlat(quantizer, self.dimension,
                                            min(nlist, n_items))
            self.index.train(embeddings.astype('float32'))
            self.index.nprobe = nprobe

        elif self.index_type == 'HNSW':
            # HNSW index: faster query speed
            self.index = faiss.IndexHNSWFlat(self.dimension, 32)

        elif self.index_type == 'Flat':
            # Exact search
            self.index = faiss.IndexFlatIP(self.dimension)

        # Add vectors
        self.index.add(embeddings.astype('float32'))

        # Build ID mapping
        for idx, item_id in enumerate(item_ids):
            self.id_mapping[idx] = item_id

    def search(self, query_embedding: np.ndarray,
               top_k: int = 100) -> List[Tuple[str, float]]:
        """
        Vector search
        query_embedding: shape (dimension,) or (1, dimension)
        """
        if len(query_embedding.shape) == 1:
            query_embedding = query_embedding.reshape(1, -1)

        # Execute search
        scores, indices = self.index.search(query_embedding.astype('float32'), top_k)

        # Convert results
        results = []
        for idx, score in zip(indices[0], scores[0]):
            if idx >= 0:  # -1 indicates invalid result
                item_id = self.id_mapping.get(idx)
                if item_id:
                    results.append((item_id, float(score)))

        return results

    def save(self, path: str):
        """Save index"""
        faiss.write_index(self.index, f"{path}/faiss.index")
        # Use JSON to save ID mapping (more secure)
        with open(f"{path}/id_mapping.json", 'w') as f:
            json.dump({str(k): v for k, v in self.id_mapping.items()}, f)

    def load(self, path: str):
        """Load index"""
        self.index = faiss.read_index(f"{path}/faiss.index")
        # Use JSON to load ID mapping
        with open(f"{path}/id_mapping.json", 'r') as f:
            mapping = json.load(f)
            self.id_mapping = {int(k): v for k, v in mapping.items()}
```

### Other Retrieval Strategies

**Popular Item Retrieval:**

```python
class HotRecall:
    """Popular item retrieval"""

    def __init__(self, decay_factor: float = 0.95):
        self.hot_items = {}
        self.decay_factor = decay_factor

    def update(self, item_id: str, score: float = 1.0):
        """Update item popularity"""
        if item_id in self.hot_items:
            self.hot_items[item_id] = self.hot_items[item_id] * self.decay_factor + score
        else:
            self.hot_items[item_id] = score

    def recall(self, exclude_items: Set[str] = None,
               top_k: int = 100) -> List[Dict]:
        """Retrieve popular items"""
        exclude_items = exclude_items or set()

        candidates = [(item, score) for item, score in self.hot_items.items()
                      if item not in exclude_items]
        candidates.sort(key=lambda x: x[1], reverse=True)

        return [{'id': item, 'score': score}
                for item, score in candidates[:top_k]]
```

**Tag/Category Retrieval:**

```python
class TagRecall:
    """Tag-based retrieval"""

    def __init__(self):
        self.tag_items = defaultdict(list)  # tag -> [(item_id, score)]
        self.item_tags = defaultdict(set)   # item_id -> {tags}

    def index_item(self, item_id: str, tags: List[str], score: float = 1.0):
        """Index item"""
        for tag in tags:
            self.tag_items[tag].append((item_id, score))
            self.item_tags[item_id].add(tag)

    def recall(self, user_interest_tags: List[str],
               exclude_items: Set[str] = None,
               top_k: int = 100) -> List[Dict]:
        """Retrieve based on user interest tags"""
        exclude_items = exclude_items or set()
        candidates = defaultdict(float)

        for tag in user_interest_tags:
            for item_id, score in self.tag_items.get(tag, []):
                if item_id not in exclude_items:
                    candidates[item_id] += score

        sorted_candidates = sorted(candidates.items(),
                                   key=lambda x: x[1], reverse=True)
        return [{'id': item, 'score': score}
                for item, score in sorted_candidates[:top_k]]
```

## Pre-Ranking and Ranking

### Pre-Ranking Layer Design

The pre-ranking layer needs to perform initial filtering of retrieval results while ensuring efficiency.

**Pre-Ranking Model Design Principles:**

1. **Simple model**: Use lightweight models such as logistic regression, shallow neural networks
2. **Minimal features**: Only use core features, avoid complex feature engineering
3. **Fast inference**: Single inference latency controlled at millisecond level

```python
class PreRankingModel(nn.Module):
    """Pre-ranking model: lightweight two-tower + simple cross"""

    def __init__(self, user_dim: int, item_dim: int, hidden_dim: int = 64):
        super().__init__()

        # User feature encoder
        self.user_encoder = nn.Sequential(
            nn.Linear(user_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )

        # Item feature encoder
        self.item_encoder = nn.Sequential(
            nn.Linear(item_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )

        # Cross layer (simple dot product + shallow MLP)
        self.cross_layer = nn.Sequential(
            nn.Linear(hidden_dim * 3, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )

    def forward(self, user_features: torch.Tensor,
                item_features: torch.Tensor) -> torch.Tensor:
        user_emb = self.user_encoder(user_features)
        item_emb = self.item_encoder(item_features)

        # Feature crossing
        cross = user_emb * item_emb  # Element-wise product
        combined = torch.cat([user_emb, item_emb, cross], dim=1)

        score = self.cross_layer(combined)
        return torch.sigmoid(score)
```

### Ranking Layer Design

The ranking layer is the core of the recommender system, requiring precise scoring of candidate items.

**Deep & Cross Network (DCN):**

```python
class CrossNetwork(nn.Module):
    """Cross network layer"""

    def __init__(self, input_dim: int, num_layers: int = 3):
        super().__init__()
        self.num_layers = num_layers
        self.cross_weights = nn.ParameterList([
            nn.Parameter(torch.randn(input_dim, 1) * 0.01)
            for _ in range(num_layers)
        ])
        self.cross_biases = nn.ParameterList([
            nn.Parameter(torch.zeros(input_dim))
            for _ in range(num_layers)
        ])

    def forward(self, x0: torch.Tensor) -> torch.Tensor:
        xl = x0
        for i in range(self.num_layers):
            # x_{l+1} = x_0 * (xl^T * w_l) + b_l + xl
            cross = torch.matmul(xl.unsqueeze(2),
                                 x0.unsqueeze(1))  # batch, dim, dim
            cross = torch.sum(cross * self.cross_weights[i].T, dim=2)
            xl = cross + self.cross_biases[i] + xl
        return xl


class DCNv2(nn.Module):
    """Deep & Cross Network v2"""

    def __init__(self, sparse_feature_dims: Dict[str, int],
                 dense_feature_dim: int, embedding_dim: int = 16,
                 cross_layers: int = 3, deep_layers: List[int] = [256, 128, 64]):
        super().__init__()

        # Embedding layer
        self.embeddings = nn.ModuleDict({
            name: nn.Embedding(dim, embedding_dim)
            for name, dim in sparse_feature_dims.items()
        })

        # Calculate total input dimension
        total_dim = len(sparse_feature_dims) * embedding_dim + dense_feature_dim

        # Cross network
        self.cross_network = CrossNetwork(total_dim, cross_layers)

        # Deep network
        deep_layers_list = []
        prev_dim = total_dim
        for hidden_dim in deep_layers:
            deep_layers_list.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(0.2)
            ])
            prev_dim = hidden_dim
        self.deep_network = nn.Sequential(*deep_layers_list)

        # Output layer
        self.output_layer = nn.Linear(total_dim + deep_layers[-1], 1)

    def forward(self, sparse_features: Dict[str, torch.Tensor],
                dense_features: torch.Tensor) -> torch.Tensor:
        # Embedding lookup
        embedded = [self.embeddings[name](sparse_features[name])
                    for name in self.embeddings.keys()]
        embedded = torch.cat(embedded, dim=1)

        # Concatenate sparse and dense features
        x0 = torch.cat([embedded.flatten(1), dense_features], dim=1)

        # Cross network
        cross_out = self.cross_network(x0)

        # Deep network
        deep_out = self.deep_network(x0)

        # Combined output
        combined = torch.cat([cross_out, deep_out], dim=1)
        logits = self.output_layer(combined)

        return torch.sigmoid(logits)
```

**Multi-Task Ranking Model (Multi-Task Learning):**

```python
class MultiTaskRankingModel(nn.Module):
    """Multi-task ranking model (MMOE architecture)"""

    def __init__(self, input_dim: int, num_experts: int = 4,
                 expert_dim: int = 128, num_tasks: int = 2):
        super().__init__()

        self.num_experts = num_experts
        self.num_tasks = num_tasks

        # Expert networks
        self.experts = nn.ModuleList([
            nn.Sequential(
                nn.Linear(input_dim, expert_dim),
                nn.ReLU(),
                nn.Linear(expert_dim, expert_dim),
                nn.ReLU()
            )
            for _ in range(num_experts)
        ])

        # Gate networks (one per task)
        self.gates = nn.ModuleList([
            nn.Sequential(
                nn.Linear(input_dim, num_experts),
                nn.Softmax(dim=1)
            )
            for _ in range(num_tasks)
        ])

        # Task-specific Tower
        self.towers = nn.ModuleList([
            nn.Sequential(
                nn.Linear(expert_dim, 64),
                nn.ReLU(),
                nn.Linear(64, 1)
            )
            for _ in range(num_tasks)
        ])

    def forward(self, x: torch.Tensor) -> List[torch.Tensor]:
        # Compute all expert outputs
        expert_outputs = [expert(x) for expert in self.experts]
        expert_outputs = torch.stack(expert_outputs, dim=1)  # (batch, num_experts, expert_dim)

        # Output for each task
        task_outputs = []
        for i in range(self.num_tasks):
            # Gate weights
            gate_weight = self.gates[i](x)  # (batch, num_experts)

            # Weighted combination of expert outputs
            gate_weight = gate_weight.unsqueeze(2)  # (batch, num_experts, 1)
            expert_weighted = torch.sum(expert_outputs * gate_weight, dim=1)

            # Task Tower
            output = self.towers[i](expert_weighted)
            task_outputs.append(torch.sigmoid(output))

        return task_outputs


class MultiTaskLoss(nn.Module):
    """Multi-task loss function"""

    def __init__(self, task_weights: List[float] = None):
        super().__init__()
        self.task_weights = task_weights or [1.0, 1.0]
        self.bce_loss = nn.BCELoss()

    def forward(self, predictions: List[torch.Tensor],
                labels: List[torch.Tensor]) -> torch.Tensor:
        total_loss = 0
        for i, (pred, label) in enumerate(zip(predictions, labels)):
            task_loss = self.bce_loss(pred, label)
            total_loss += self.task_weights[i] * task_loss
        return total_loss
```

### Feature Engineering

Features are the core of ranking models, typically including the following categories:

```python
from dataclasses import dataclass
from typing import Any, Dict, List
import numpy as np

@dataclass
class FeatureConfig:
    """Feature configuration"""
    name: str
    feature_type: str  # 'sparse', 'dense', 'sequence'
    dim: int = 1
    embedding_dim: int = 16

class FeatureExtractor:
    """Feature extractor"""

    def __init__(self, feature_configs: List[FeatureConfig]):
        self.configs = {f.name: f for f in feature_configs}

    def extract_user_features(self, user: Dict) -> Dict[str, Any]:
        """Extract user features"""
        features = {}

        # User basic features
        features['user_id'] = user['user_id']
        features['user_age_bucket'] = self._age_bucket(user.get('age', 0))
        features['user_gender'] = user.get('gender', 'unknown')
        features['user_city_level'] = user.get('city_level', 0)

        # User statistical features
        features['user_click_count_7d'] = user.get('click_count_7d', 0)
        features['user_order_count_30d'] = user.get('order_count_30d', 0)
        features['user_avg_price'] = user.get('avg_price', 0.0)

        # User behavior sequence features
        features['user_click_seq'] = user.get('recent_clicks', [])[:50]
        features['user_category_seq'] = user.get('recent_categories', [])[:20]

        return features

    def extract_item_features(self, item: Dict) -> Dict[str, Any]:
        """Extract item features"""
        features = {}

        # Item basic features
        features['item_id'] = item['item_id']
        features['category_id'] = item.get('category_id', 0)
        features['brand_id'] = item.get('brand_id', 0)
        features['price_bucket'] = self._price_bucket(item.get('price', 0))

        # Item statistical features
        features['item_ctr_7d'] = item.get('ctr_7d', 0.0)
        features['item_cvr_7d'] = item.get('cvr_7d', 0.0)
        features['item_exposure_count'] = item.get('exposure_count', 0)
        features['item_click_count'] = item.get('click_count', 0)

        return features

    def extract_context_features(self, context: Dict) -> Dict[str, Any]:
        """Extract context features"""
        features = {}

        # Time features
        features['hour'] = context.get('hour', 0)
        features['weekday'] = context.get('weekday', 0)
        features['is_weekend'] = 1 if context.get('weekday', 0) >= 5 else 0

        # Device features
        features['device_type'] = context.get('device_type', 'unknown')
        features['os'] = context.get('os', 'unknown')

        # Scene features
        features['page_type'] = context.get('page_type', 'home')
        features['position'] = context.get('position', 0)

        return features

    def extract_cross_features(self, user_features: Dict,
                                item_features: Dict) -> Dict[str, Any]:
        """Extract cross features"""
        features = {}

        # User-item cross
        features['user_category_match'] = int(
            item_features.get('category_id') in
            user_features.get('user_category_seq', [])
        )

        # Price match
        user_avg_price = user_features.get('user_avg_price', 0)
        item_price = item_features.get('price_bucket', 0)
        features['price_gap'] = abs(user_avg_price - item_price)

        return features

    def _age_bucket(self, age: int) -> int:
        """Age bucketing"""
        if age < 18:
            return 0
        elif age < 25:
            return 1
        elif age < 35:
            return 2
        elif age < 45:
            return 3
        elif age < 55:
            return 4
        else:
            return 5

    def _price_bucket(self, price: float) -> int:
        """Price bucketing"""
        buckets = [10, 50, 100, 200, 500, 1000, 2000, 5000]
        for i, threshold in enumerate(buckets):
            if price < threshold:
                return i
        return len(buckets)
```

## Re-Ranking and Diversity

The re-ranking layer is the final checkpoint of the recommender system, needing to consider diversity, freshness, business rules, and other factors on top of relevance.

### Diversity Algorithms

**MMR (Maximal Marginal Relevance):**

```python
import numpy as np
from typing import List, Tuple

def mmr_rerank(candidates: List[Dict],
               item_embeddings: Dict[str, np.ndarray],
               lambda_param: float = 0.5,
               top_k: int = 10) -> List[Dict]:
    """
    MMR re-ranking algorithm

    Args:
        candidates: Candidate item list, each item contains 'id' and 'score'
        item_embeddings: Mapping from item ID to vector
        lambda_param: Trade-off parameter between relevance and diversity
        top_k: Number of results to return
    """
    selected = []
    remaining = candidates.copy()

    while len(selected) < top_k and remaining:
        best_score = float('-inf')
        best_item = None

        for item in remaining:
            item_id = item['id']
            relevance = item['score']

            # Calculate maximum similarity with selected items
            if selected:
                item_emb = item_embeddings.get(item_id)
                if item_emb is not None:
                    max_sim = max(
                        cosine_sim(item_emb, item_embeddings.get(s['id']))
                        for s in selected
                        if item_embeddings.get(s['id']) is not None
                    )
                else:
                    max_sim = 0
            else:
                max_sim = 0

            # MMR score = lambda * relevance - (1-lambda) * max_similarity
            mmr_score = lambda_param * relevance - (1 - lambda_param) * max_sim

            if mmr_score > best_score:
                best_score = mmr_score
                best_item = item

        if best_item:
            selected.append(best_item)
            remaining.remove(best_item)

    return selected


def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate cosine similarity"""
    if a is None or b is None:
        return 0.0
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)
```

**DPP (Determinantal Point Process):**

```python
import numpy as np
from scipy.linalg import det, inv

class DPPReranker:
    """DPP-based diversity re-ranking"""

    def __init__(self, alpha: float = 0.5):
        """
        Args:
            alpha: Relevance weight
        """
        self.alpha = alpha

    def rerank(self, candidates: List[Dict],
               embeddings: np.ndarray,
               top_k: int = 10) -> List[int]:
        """
        DPP re-ranking

        Args:
            candidates: Candidate list
            embeddings: Candidate item embedding matrix (n, d)
            top_k: Number to return

        Returns:
            List of selected item indices
        """
        n = len(candidates)
        scores = np.array([c['score'] for c in candidates])

        # Build L matrix
        # L_ij = q_i * q_j * S_ij
        # where q is quality score, S is similarity matrix
        quality = np.sqrt(scores)
        similarity = embeddings @ embeddings.T

        L = np.outer(quality, quality) * similarity
        L = self.alpha * np.diag(scores) + (1 - self.alpha) * L

        # Greedy selection
        selected = []
        remaining = list(range(n))

        while len(selected) < top_k and remaining:
            best_idx = None
            best_gain = float('-inf')

            for idx in remaining:
                if not selected:
                    gain = L[idx, idx]
                else:
                    # Calculate conditional gain
                    selected_L = L[np.ix_(selected, selected)]
                    cross_L = L[idx, selected]

                    if len(selected) == 1:
                        gain = L[idx, idx] - cross_L[0]**2 / selected_L
                    else:
                        try:
                            gain = L[idx, idx] - cross_L @ inv(selected_L) @ cross_L
                        except:
                            gain = L[idx, idx]

                if gain > best_gain:
                    best_gain = gain
                    best_idx = idx

            if best_idx is not None:
                selected.append(best_idx)
                remaining.remove(best_idx)

        return selected
```

### Business Rule Engine

```python
from typing import List, Callable
from dataclasses import dataclass

@dataclass
class Rule:
    """Re-ranking rule"""
    name: str
    priority: int
    condition: Callable
    action: Callable

class RuleEngine:
    """Rule engine"""

    def __init__(self):
        self.rules: List[Rule] = []

    def add_rule(self, rule: Rule):
        """Add rule"""
        self.rules.append(rule)
        # Sort by priority
        self.rules.sort(key=lambda x: x.priority, reverse=True)

    def apply(self, candidates: List[Dict], context: Dict) -> List[Dict]:
        """Apply rules"""
        result = candidates.copy()

        for rule in self.rules:
            if rule.condition(context):
                result = rule.action(result, context)

        return result


# Rule examples
def create_common_rules() -> RuleEngine:
    """Create common rules"""
    engine = RuleEngine()

    # Rule 1: New item priority display
    engine.add_rule(Rule(
        name="new_item_boost",
        priority=100,
        condition=lambda ctx: True,
        action=lambda items, ctx: sorted(
            items,
            key=lambda x: (x.get('is_new', 0), x['score']),
            reverse=True
        )
    ))

    # Rule 2: Ad slot insertion
    engine.add_rule(Rule(
        name="ad_insertion",
        priority=90,
        condition=lambda ctx: ctx.get('show_ads', True),
        action=lambda items, ctx: insert_ads(items, ctx.get('ads', []))
    ))

    # Rule 3: Filter purchased items
    engine.add_rule(Rule(
        name="filter_purchased",
        priority=80,
        condition=lambda ctx: 'purchased_items' in ctx,
        action=lambda items, ctx: [
            item for item in items
            if item['id'] not in ctx['purchased_items']
        ]
    ))

    # Rule 4: Category scattering
    engine.add_rule(Rule(
        name="category_scatter",
        priority=70,
        condition=lambda ctx: ctx.get('enable_scatter', True),
        action=lambda items, ctx: scatter_by_category(items, max_consecutive=2)
    ))

    return engine


def insert_ads(items: List[Dict], ads: List[Dict]) -> List[Dict]:
    """Insert ads"""
    result = []
    ad_positions = [3, 7, 15]  # Ad positions
    ad_idx = 0

    for i, item in enumerate(items):
        if i in ad_positions and ad_idx < len(ads):
            result.append(ads[ad_idx])
            ad_idx += 1
        result.append(item)

    return result


def scatter_by_category(items: List[Dict], max_consecutive: int = 2) -> List[Dict]:
    """Category scattering"""
    from collections import defaultdict

    result = []
    category_count = defaultdict(int)

    remaining = items.copy()
    while remaining:
        for item in remaining:
            category = item.get('category_id')
            if category_count[category] < max_consecutive:
                result.append(item)
                category_count[category] += 1
                remaining.remove(item)
                break
        else:
            # All categories reached limit, reset count
            category_count.clear()

    return result
```

## Cold Start Solutions

Cold start is one of the core challenges faced by recommender systems, including new user cold start and new item cold start.

### New User Cold Start

```python
class NewUserStrategy:
    """New user cold start strategy"""

    def __init__(self):
        self.popular_items = []
        self.category_popular = {}
        self.demographic_popular = {}

    def update_popular_items(self, items: List[Dict]):
        """Update popular items"""
        self.popular_items = sorted(items, key=lambda x: x['score'], reverse=True)[:100]

    def get_recommendations(self, user_info: Dict, top_k: int = 20) -> List[Dict]:
        """Get recommendations for new user"""

        # Strategy 1: Recommendations based on registration info
        if user_info.get('interests'):
            return self._interest_based_recommend(user_info['interests'], top_k)

        # Strategy 2: Recommendations based on demographics
        if user_info.get('age') and user_info.get('gender'):
            return self._demographic_based_recommend(user_info, top_k)

        # Strategy 3: Recommendations based on location
        if user_info.get('city'):
            return self._location_based_recommend(user_info['city'], top_k)

        # Fallback strategy: Popular recommendations
        return self.popular_items[:top_k]

    def _interest_based_recommend(self, interests: List[str], top_k: int) -> List[Dict]:
        """Interest tag based recommendations"""
        candidates = []
        for interest in interests:
            items = self.category_popular.get(interest, [])
            candidates.extend(items[:top_k // len(interests)])
        return candidates[:top_k]

    def _demographic_based_recommend(self, user_info: Dict, top_k: int) -> List[Dict]:
        """Demographics based recommendations"""
        # Use pre-computed demographic-item preference matrix
        age_group = self._get_age_group(user_info['age'])
        gender = user_info['gender']
        demographic_key = f"{age_group}_{gender}"

        # Return popular items for this demographic
        return self.demographic_popular.get(demographic_key, self.popular_items)[:top_k]

    def _location_based_recommend(self, city: str, top_k: int) -> List[Dict]:
        """Location based recommendations"""
        # Return popular items for this region
        return self.popular_items[:top_k]

    def _get_age_group(self, age: int) -> str:
        if age < 18:
            return "teen"
        elif age < 30:
            return "young"
        elif age < 45:
            return "middle"
        else:
            return "senior"


class ExplorationExploitationStrategy:
    """Exploration & Exploitation strategy (E&E)"""

    def __init__(self, epsilon: float = 0.1):
        self.epsilon = epsilon

    def select_items(self, exploitation_items: List[Dict],
                     exploration_items: List[Dict],
                     top_k: int = 20) -> List[Dict]:
        """
        Recommendations mixing exploration and exploitation
        """
        import random

        result = []
        num_exploration = int(top_k * self.epsilon)
        num_exploitation = top_k - num_exploration

        # Exploitation: Select items with highest predicted scores
        result.extend(exploitation_items[:num_exploitation])

        # Exploration: Randomly select some items
        if exploration_items:
            explore_sample = random.sample(
                exploration_items,
                min(num_exploration, len(exploration_items))
            )
            result.extend(explore_sample)

        # Shuffle randomly to avoid exploration items always at the end
        random.shuffle(result)
        return result


class BanditStrategy:
    """Multi-armed bandit strategy"""

    def __init__(self, num_arms: int, alpha: float = 1.0):
        """
        Thompson Sampling implementation
        """
        self.alpha = np.ones(num_arms)
        self.beta = np.ones(num_arms)

    def select_arm(self) -> int:
        """Select arm"""
        samples = np.random.beta(self.alpha, self.beta)
        return np.argmax(samples)

    def update(self, arm: int, reward: float):
        """Update parameters"""
        self.alpha[arm] += reward
        self.beta[arm] += 1 - reward
```

### New Item Cold Start

```python
class NewItemStrategy:
    """New item cold start strategy"""

    def __init__(self):
        self.content_model = None  # Content-based model
        self.item_features = {}

    def get_similar_items(self, new_item: Dict, top_k: int = 10) -> List[str]:
        """Find similar items based on content"""
        new_item_features = self._extract_features(new_item)

        similarities = []
        for item_id, features in self.item_features.items():
            sim = self._compute_similarity(new_item_features, features)
            similarities.append((item_id, sim))

        similarities.sort(key=lambda x: x[1], reverse=True)
        return [item_id for item_id, _ in similarities[:top_k]]

    def transfer_item_embedding(self, new_item: Dict) -> np.ndarray:
        """
        Generate embedding for new item through content features
        Applicable to two-tower model scenarios
        """
        if self.content_model is None:
            raise ValueError("Content model not initialized")

        features = self._extract_features(new_item)
        embedding = self.content_model.predict(features)
        return embedding

    def _extract_features(self, item: Dict) -> np.ndarray:
        """Extract item content features"""
        features = []

        # Text features (title, description)
        if 'title' in item:
            title_emb = self._encode_text(item['title'])
            features.append(title_emb)

        # Category features
        if 'category' in item:
            cat_emb = self._encode_category(item['category'])
            features.append(cat_emb)

        # Attribute features
        if 'attributes' in item:
            attr_emb = self._encode_attributes(item['attributes'])
            features.append(attr_emb)

        return np.concatenate(features)

    def _encode_text(self, text: str) -> np.ndarray:
        """Encode text (can use pre-trained models like BERT)"""
        # Simplified implementation
        return np.random.randn(128)

    def _encode_category(self, category: str) -> np.ndarray:
        """Encode category"""
        return np.random.randn(32)

    def _encode_attributes(self, attributes: Dict) -> np.ndarray:
        """Encode attributes"""
        return np.random.randn(64)

    def _compute_similarity(self, feat1: np.ndarray, feat2: np.ndarray) -> float:
        """Compute feature similarity"""
        return np.dot(feat1, feat2) / (np.linalg.norm(feat1) * np.linalg.norm(feat2) + 1e-8)


class ItemExposureController:
    """New item exposure control"""

    def __init__(self, min_exposure: int = 1000, boost_factor: float = 1.5):
        self.min_exposure = min_exposure
        self.boost_factor = boost_factor
        self.item_exposure = {}

    def should_boost(self, item_id: str) -> bool:
        """Determine if exposure boost is needed"""
        exposure = self.item_exposure.get(item_id, 0)
        return exposure < self.min_exposure

    def boost_score(self, item_id: str, original_score: float) -> float:
        """Boost item score"""
        if self.should_boost(item_id):
            exposure = self.item_exposure.get(item_id, 0)
            # Less exposure, more boost
            boost_ratio = 1 + (self.boost_factor - 1) * (1 - exposure / self.min_exposure)
            return original_score * boost_ratio
        return original_score

    def record_exposure(self, item_id: str):
        """Record exposure"""
        self.item_exposure[item_id] = self.item_exposure.get(item_id, 0) + 1
```

## Real-time Recommender Systems

### Real-time Feature System

```python
import redis
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class RealtimeFeatureStore:
    """Real-time feature store"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def update_user_behavior(self, user_id: str, item_id: str,
                             behavior_type: str, timestamp: int):
        """Update user real-time behavior"""
        # Update recent click sequence
        click_key = f"user:{user_id}:recent_clicks"
        self.redis.lpush(click_key, f"{item_id}:{timestamp}")
        self.redis.ltrim(click_key, 0, 49)  # Keep most recent 50
        self.redis.expire(click_key, 86400)  # 24 hour expiration

        # Update behavior count
        count_key = f"user:{user_id}:{behavior_type}_count"
        self.redis.incr(count_key)
        self.redis.expire(count_key, 86400)

        # Update category preference
        category = self._get_item_category(item_id)
        if category:
            cat_key = f"user:{user_id}:category_count"
            self.redis.hincrby(cat_key, category, 1)
            self.redis.expire(cat_key, 86400 * 7)  # 7 day expiration

    def get_user_realtime_features(self, user_id: str) -> Dict:
        """Get user real-time features"""
        features = {}

        # Recent click sequence
        click_key = f"user:{user_id}:recent_clicks"
        recent_clicks = self.redis.lrange(click_key, 0, 49)
        features['recent_clicks'] = [
            click.decode().split(':')[0] for click in recent_clicks
        ]

        # Behavior counts
        for behavior in ['click', 'cart', 'order']:
            count_key = f"user:{user_id}:{behavior}_count"
            count = self.redis.get(count_key)
            features[f'{behavior}_count_realtime'] = int(count) if count else 0

        # Category preference
        cat_key = f"user:{user_id}:category_count"
        category_counts = self.redis.hgetall(cat_key)
        features['category_preference'] = {
            k.decode(): int(v) for k, v in category_counts.items()
        }

        return features

    def update_item_stats(self, item_id: str, behavior_type: str):
        """Update item real-time statistics"""
        # Use time window statistics
        now = datetime.now()
        hour_key = now.strftime("%Y%m%d%H")

        # Hourly statistics
        stat_key = f"item:{item_id}:{behavior_type}:{hour_key}"
        self.redis.incr(stat_key)
        self.redis.expire(stat_key, 86400 * 2)  # 2 day expiration

    def get_item_realtime_stats(self, item_id: str) -> Dict:
        """Get item real-time statistics"""
        stats = {}
        now = datetime.now()

        for behavior in ['exposure', 'click', 'order']:
            # Last 1 hour
            hour_key = now.strftime("%Y%m%d%H")
            stat_key = f"item:{item_id}:{behavior}:{hour_key}"
            count = self.redis.get(stat_key)
            stats[f'{behavior}_1h'] = int(count) if count else 0

            # Last 24 hours
            total = 0
            for i in range(24):
                hour = (now - timedelta(hours=i)).strftime("%Y%m%d%H")
                stat_key = f"item:{item_id}:{behavior}:{hour}"
                count = self.redis.get(stat_key)
                total += int(count) if count else 0
            stats[f'{behavior}_24h'] = total

        # Calculate real-time CTR
        if stats['exposure_24h'] > 0:
            stats['ctr_24h'] = stats['click_24h'] / stats['exposure_24h']
        else:
            stats['ctr_24h'] = 0

        return stats

    def _get_item_category(self, item_id: str) -> Optional[str]:
        """Get item category"""
        cat = self.redis.hget("item:categories", item_id)
        return cat.decode() if cat else None
```

### Real-time Recommendation Service

```python
import asyncio
from typing import Dict, List
import time

class RealtimeRecommender:
    """Real-time recommendation service"""

    def __init__(self, config: Dict):
        self.recall_engine = MultiRecallEngine()
        self.ranking_model = self._load_ranking_model(config['model_path'])
        self.feature_store = RealtimeFeatureStore(config['redis'])
        self.reranker = RuleEngine()

        # Performance monitoring
        self.latency_stats = {'recall': [], 'rank': [], 'rerank': []}

    async def recommend(self, user_id: str, context: Dict,
                       top_k: int = 20) -> Dict:
        """
        Execute real-time recommendation

        Returns:
            {
                'items': [...],
                'latency': {'total': x, 'recall': x, 'rank': x, 'rerank': x}
            }
        """
        start_time = time.time()
        latency = {}

        # 1. Get real-time features
        user_features = await self._get_user_features(user_id)

        # 2. Multi-channel retrieval
        recall_start = time.time()
        candidates = await self.recall_engine.recall(user_id, context, top_k=1000)
        latency['recall'] = (time.time() - recall_start) * 1000

        # 3. Batch get item features
        item_features = await self._batch_get_item_features(
            [c.item_id for c in candidates]
        )

        # 4. Ranking
        rank_start = time.time()
        scored_items = await self._rank(user_features, item_features, candidates)
        latency['rank'] = (time.time() - rank_start) * 1000

        # 5. Re-ranking
        rerank_start = time.time()
        final_items = self.reranker.apply(scored_items[:100], context)[:top_k]
        latency['rerank'] = (time.time() - rerank_start) * 1000

        latency['total'] = (time.time() - start_time) * 1000

        return {
            'items': final_items,
            'latency': latency
        }

    async def _get_user_features(self, user_id: str) -> Dict:
        """Get user features (offline + real-time)"""
        # Get offline and real-time features in parallel
        offline_task = self._get_offline_user_features(user_id)
        realtime_task = asyncio.to_thread(
            self.feature_store.get_user_realtime_features, user_id
        )

        offline_features, realtime_features = await asyncio.gather(
            offline_task, realtime_task
        )

        # Merge features
        return {**offline_features, **realtime_features}

    async def _batch_get_item_features(self, item_ids: List[str]) -> Dict[str, Dict]:
        """Batch get item features"""
        # In actual implementation, may use batch Redis queries or feature caching
        features = {}
        for item_id in item_ids:
            features[item_id] = await self._get_item_features(item_id)
        return features

    async def _rank(self, user_features: Dict, item_features: Dict[str, Dict],
                   candidates: List) -> List[Dict]:
        """Ranking"""
        # Prepare input for batch inference
        batch_features = []
        for candidate in candidates:
            item_feat = item_features.get(candidate.item_id, {})
            combined = self._combine_features(user_features, item_feat)
            batch_features.append(combined)

        # Batch inference
        scores = self.ranking_model.predict_batch(batch_features)

        # Combine results
        results = []
        for candidate, score in zip(candidates, scores):
            results.append({
                'id': candidate.item_id,
                'score': float(score),
                'recall_source': candidate.source
            })

        # Sort by score
        results.sort(key=lambda x: x['score'], reverse=True)
        return results

    def _combine_features(self, user_features: Dict, item_features: Dict) -> Dict:
        """Combine user and item features"""
        return {
            **{f'user_{k}': v for k, v in user_features.items()},
            **{f'item_{k}': v for k, v in item_features.items()}
        }

    async def _get_offline_user_features(self, user_id: str) -> Dict:
        """Get offline user features"""
        # Get offline features from feature store
        return {}

    async def _get_item_features(self, item_id: str) -> Dict:
        """Get item features"""
        return {}

    def _load_ranking_model(self, model_path: str):
        """Load ranking model"""
        # Load TensorFlow or PyTorch model
        return None
```

## A/B Testing Design

A/B testing is a key means of validating the improvement effects of recommender systems.

### A/B Testing Framework

```python
import hashlib
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Experiment:
    """Experiment configuration"""
    name: str
    description: str
    start_time: datetime
    end_time: datetime
    traffic_ratio: float  # Experiment traffic ratio
    buckets: Dict[str, float]  # Traffic ratio for each bucket
    metrics: List[str]  # Metrics of interest


class ABTestFramework:
    """A/B testing framework"""

    def __init__(self):
        self.experiments: Dict[str, Experiment] = {}

    def create_experiment(self, experiment: Experiment):
        """Create experiment"""
        self.experiments[experiment.name] = experiment

    def get_bucket(self, experiment_name: str, user_id: str) -> Optional[str]:
        """
        Get the experiment bucket a user belongs to

        Use deterministic bucketing to ensure same user always enters same bucket
        """
        experiment = self.experiments.get(experiment_name)
        if not experiment:
            return None

        # Check if experiment is within valid period
        now = datetime.now()
        if now < experiment.start_time or now > experiment.end_time:
            return None

        # Calculate user hash value
        hash_key = f"{experiment_name}:{user_id}"
        hash_value = int(hashlib.md5(hash_key.encode()).hexdigest(), 16)
        ratio = (hash_value % 10000) / 10000.0

        # Determine if entering experiment
        if ratio > experiment.traffic_ratio:
            return None  # Not participating in experiment

        # Assign to specific bucket
        normalized_ratio = ratio / experiment.traffic_ratio
        cumulative = 0
        for bucket_name, bucket_ratio in experiment.buckets.items():
            cumulative += bucket_ratio
            if normalized_ratio < cumulative:
                return bucket_name

        return list(experiment.buckets.keys())[-1]

    def log_exposure(self, experiment_name: str, user_id: str,
                    bucket: str, context: Dict):
        """Log experiment exposure"""
        # Send to logging system
        log_data = {
            'experiment': experiment_name,
            'user_id': user_id,
            'bucket': bucket,
            'timestamp': datetime.now().isoformat(),
            'context': context
        }
        # In actual implementation, send to Kafka or other message queue
        print(f"Experiment exposure: {log_data}")

    def log_conversion(self, experiment_name: str, user_id: str,
                      metric: str, value: float):
        """Log experiment conversion"""
        log_data = {
            'experiment': experiment_name,
            'user_id': user_id,
            'metric': metric,
            'value': value,
            'timestamp': datetime.now().isoformat()
        }
        print(f"Experiment conversion: {log_data}")


class ExperimentAnalyzer:
    """Experiment analyzer"""

    def __init__(self):
        pass

    def compute_metrics(self, experiment_name: str,
                       start_date: str, end_date: str) -> Dict:
        """
        Compute experiment metrics

        Returns:
            {
                'bucket_a': {'ctr': 0.05, 'cvr': 0.02, ...},
                'bucket_b': {'ctr': 0.06, 'cvr': 0.025, ...}
            }
        """
        # Query experiment data from data warehouse
        # This is a simplified implementation
        return {}

    def compute_significance(self, control_data: List[float],
                            treatment_data: List[float]) -> Dict:
        """
        Compute statistical significance

        Use t-test to determine if there is significant difference between two groups
        """
        from scipy import stats
        import numpy as np

        # t-test
        t_stat, p_value = stats.ttest_ind(control_data, treatment_data)

        # Calculate effect size (Cohen's d)
        control_mean = np.mean(control_data)
        treatment_mean = np.mean(treatment_data)
        pooled_std = np.sqrt((np.std(control_data)**2 + np.std(treatment_data)**2) / 2)
        effect_size = (treatment_mean - control_mean) / pooled_std

        # Calculate relative lift
        relative_lift = (treatment_mean - control_mean) / control_mean * 100

        return {
            't_statistic': t_stat,
            'p_value': p_value,
            'effect_size': effect_size,
            'relative_lift': relative_lift,
            'is_significant': p_value < 0.05,
            'control_mean': control_mean,
            'treatment_mean': treatment_mean
        }

    def compute_confidence_interval(self, data: List[float],
                                   confidence: float = 0.95) -> tuple:
        """Compute confidence interval"""
        from scipy import stats
        import numpy as np

        n = len(data)
        mean = np.mean(data)
        se = stats.sem(data)

        h = se * stats.t.ppf((1 + confidence) / 2, n - 1)
        return (mean - h, mean + h)
```

### Common Experiment Metrics

```python
from typing import Dict, List
from collections import defaultdict
import numpy as np
from datetime import datetime

class MetricsCalculator:
    """Metrics calculator"""

    def __init__(self):
        pass

    def calculate_ctr(self, exposures: int, clicks: int) -> float:
        """Calculate click-through rate"""
        return clicks / exposures if exposures > 0 else 0

    def calculate_cvr(self, clicks: int, orders: int) -> float:
        """Calculate conversion rate"""
        return orders / clicks if clicks > 0 else 0

    def calculate_gmv(self, orders: List[Dict]) -> float:
        """Calculate GMV"""
        return sum(order['amount'] for order in orders)

    def calculate_arpu(self, user_orders: Dict[str, List[Dict]]) -> float:
        """Calculate ARPU (Average Revenue Per User)"""
        total_revenue = sum(
            sum(order['amount'] for order in orders)
            for orders in user_orders.values()
        )
        return total_revenue / len(user_orders) if user_orders else 0

    def calculate_coverage(self, recommended_items: set,
                          total_items: set) -> float:
        """Calculate recommendation coverage"""
        return len(recommended_items) / len(total_items) if total_items else 0

    def calculate_diversity(self, recommendations: List[List[Dict]]) -> float:
        """
        Calculate recommendation diversity

        Use category entropy as measure
        """
        category_counts = defaultdict(int)
        total = 0

        for rec_list in recommendations:
            for item in rec_list:
                category = item.get('category_id')
                if category:
                    category_counts[category] += 1
                    total += 1

        if total == 0:
            return 0

        # Calculate entropy
        entropy = 0
        for count in category_counts.values():
            p = count / total
            if p > 0:
                entropy -= p * np.log2(p)

        return entropy

    def calculate_novelty(self, recommendations: List[List[Dict]],
                         item_popularity: Dict[str, int]) -> float:
        """
        Calculate recommendation novelty

        Average inverse popularity of recommended items
        """
        novelty_scores = []
        max_popularity = max(item_popularity.values()) if item_popularity else 1

        for rec_list in recommendations:
            for item in rec_list:
                item_id = item['id']
                popularity = item_popularity.get(item_id, 0)
                # Inverse popularity
                novelty = 1 - (popularity / max_popularity)
                novelty_scores.append(novelty)

        return np.mean(novelty_scores) if novelty_scores else 0

    def calculate_serendipity(self, recommendations: List[Dict],
                             user_history: List[str],
                             item_similarity: Dict[str, Dict[str, float]]) -> float:
        """
        Calculate serendipity

        Measure the degree of difference between recommended items and user history
        """
        if not user_history or not recommendations:
            return 0

        serendipity_scores = []

        for rec_item in recommendations:
            rec_id = rec_item['id']
            # Calculate maximum similarity with historical items
            max_sim = 0
            for hist_id in user_history:
                sim = item_similarity.get(rec_id, {}).get(hist_id, 0)
                max_sim = max(max_sim, sim)

            # Serendipity = 1 - maximum similarity
            serendipity = 1 - max_sim
            serendipity_scores.append(serendipity)

        return np.mean(serendipity_scores)


class OnlineMetricsCollector:
    """Online metrics collector"""

    def __init__(self, metrics_config: Dict):
        self.config = metrics_config
        self.metrics_buffer = defaultdict(list)

    def record_exposure(self, user_id: str, item_ids: List[str],
                       experiment_bucket: str):
        """Record exposure"""
        for item_id in item_ids:
            self.metrics_buffer['exposures'].append({
                'user_id': user_id,
                'item_id': item_id,
                'bucket': experiment_bucket,
                'timestamp': datetime.now()
            })

    def record_click(self, user_id: str, item_id: str,
                    experiment_bucket: str, position: int):
        """Record click"""
        self.metrics_buffer['clicks'].append({
            'user_id': user_id,
            'item_id': item_id,
            'bucket': experiment_bucket,
            'position': position,
            'timestamp': datetime.now()
        })

    def record_order(self, user_id: str, item_id: str,
                    experiment_bucket: str, amount: float):
        """Record order"""
        self.metrics_buffer['orders'].append({
            'user_id': user_id,
            'item_id': item_id,
            'bucket': experiment_bucket,
            'amount': amount,
            'timestamp': datetime.now()
        })

    def flush(self):
        """Flush metrics to storage"""
        # Send to Kafka or write directly to database
        for metric_type, records in self.metrics_buffer.items():
            # Batch write
            self._write_to_storage(metric_type, records)
        self.metrics_buffer.clear()

    def _write_to_storage(self, metric_type: str, records: List[Dict]):
        """Write to storage"""
        pass
```

## Business Metric Optimization

### Multi-Objective Optimization

```python
import numpy as np
from typing import Dict, List

class MultiObjectiveOptimizer:
    """Multi-objective optimizer"""

    def __init__(self, objective_weights: Dict[str, float]):
        """
        Args:
            objective_weights: {'ctr': 0.4, 'cvr': 0.3, 'gmv': 0.3}
        """
        self.weights = objective_weights
        self._normalize_weights()

    def _normalize_weights(self):
        """Normalize weights"""
        total = sum(self.weights.values())
        self.weights = {k: v/total for k, v in self.weights.items()}

    def compute_final_score(self, predictions: Dict[str, float]) -> float:
        """
        Compute final score

        Args:
            predictions: {'ctr': 0.05, 'cvr': 0.02, 'price': 100}
        """
        score = 0
        for objective, weight in self.weights.items():
            if objective in predictions:
                score += weight * predictions[objective]
        return score

    def pareto_rank(self, candidates: List[Dict]) -> List[Dict]:
        """
        Pareto ranking

        Find Pareto optimal solution set
        """
        n = len(candidates)
        dominated_count = [0] * n
        dominating_list = [[] for _ in range(n)]

        # Compare all candidate pairs
        for i in range(n):
            for j in range(i + 1, n):
                if self._dominates(candidates[i], candidates[j]):
                    dominated_count[j] += 1
                    dominating_list[i].append(j)
                elif self._dominates(candidates[j], candidates[i]):
                    dominated_count[i] += 1
                    dominating_list[j].append(i)

        # Layering
        fronts = []
        current_front = [i for i in range(n) if dominated_count[i] == 0]

        while current_front:
            fronts.append(current_front)
            next_front = []
            for i in current_front:
                for j in dominating_list[i]:
                    dominated_count[j] -= 1
                    if dominated_count[j] == 0:
                        next_front.append(j)
            current_front = next_front

        # Sort by Pareto front
        result = []
        for front in fronts:
            for idx in front:
                candidates[idx]['pareto_rank'] = len(fronts)
                result.append(candidates[idx])

        return result

    def _dominates(self, a: Dict, b: Dict) -> bool:
        """Determine if a dominates b"""
        dominated = False
        for objective in self.weights.keys():
            if a.get(objective, 0) < b.get(objective, 0):
                return False
            if a.get(objective, 0) > b.get(objective, 0):
                dominated = True
        return dominated


class ConstrainedOptimizer:
    """Constrained optimizer"""

    def __init__(self, constraints: Dict):
        """
        Args:
            constraints: {
                'min_price': 10,
                'max_price': 1000,
                'min_diversity': 0.3
            }
        """
        self.constraints = constraints

    def filter_and_rank(self, candidates: List[Dict]) -> List[Dict]:
        """Filter and rank"""
        # Filter candidates that don't satisfy constraints
        filtered = [c for c in candidates if self._check_constraints(c)]

        # Sort by score
        filtered.sort(key=lambda x: x.get('score', 0), reverse=True)

        return filtered

    def _check_constraints(self, candidate: Dict) -> bool:
        """Check constraint conditions"""
        if 'min_price' in self.constraints:
            if candidate.get('price', 0) < self.constraints['min_price']:
                return False
        if 'max_price' in self.constraints:
            if candidate.get('price', float('inf')) > self.constraints['max_price']:
                return False
        return True

    def optimize_with_diversity(self, candidates: List[Dict],
                               top_k: int,
                               min_diversity: float = 0.3) -> List[Dict]:
        """Optimize while ensuring diversity constraint"""
        from collections import defaultdict

        selected = []
        category_count = defaultdict(int)

        for candidate in sorted(candidates, key=lambda x: x['score'], reverse=True):
            if len(selected) >= top_k:
                break

            category = candidate.get('category_id')
            current_diversity = self._compute_diversity(category_count)

            # Check if diversity is satisfied after adding this item
            if current_diversity >= min_diversity or category_count[category] < 2:
                selected.append(candidate)
                category_count[category] += 1

        return selected

    def _compute_diversity(self, category_count: Dict[str, int]) -> float:
        """Compute current diversity (category entropy)"""
        total = sum(category_count.values())
        if total == 0:
            return 1.0

        entropy = 0
        for count in category_count.values():
            p = count / total
            if p > 0:
                entropy -= p * np.log2(p)

        # Normalize
        max_entropy = np.log2(len(category_count)) if category_count else 1
        return entropy / max_entropy if max_entropy > 0 else 0
```

### Business Rules and Model Integration

```python
class BusinessRuleIntegrator:
    """Business rules and model integration"""

    def __init__(self):
        self.rules = []

    def add_boost_rule(self, name: str, condition: callable,
                       boost_factor: float):
        """Add boost rule"""
        self.rules.append({
            'name': name,
            'type': 'boost',
            'condition': condition,
            'factor': boost_factor
        })

    def add_filter_rule(self, name: str, condition: callable):
        """Add filter rule"""
        self.rules.append({
            'name': name,
            'type': 'filter',
            'condition': condition
        })

    def add_pin_rule(self, name: str, condition: callable, position: int):
        """Add pin rule"""
        self.rules.append({
            'name': name,
            'type': 'pin',
            'condition': condition,
            'position': position
        })

    def apply(self, candidates: List[Dict], context: Dict) -> List[Dict]:
        """Apply all rules"""
        result = candidates.copy()
        pinned_items = []

        for rule in self.rules:
            if rule['type'] == 'filter':
                result = [c for c in result if not rule['condition'](c, context)]
            elif rule['type'] == 'boost':
                for c in result:
                    if rule['condition'](c, context):
                        c['score'] *= rule['factor']
            elif rule['type'] == 'pin':
                for c in result[:]:
                    if rule['condition'](c, context):
                        pinned_items.append((c, rule['position']))
                        result.remove(c)

        # Re-sort
        result.sort(key=lambda x: x['score'], reverse=True)

        # Insert pinned items
        for item, position in sorted(pinned_items, key=lambda x: x[1]):
            result.insert(min(position, len(result)), item)

        return result


# Business rule examples
def create_ecommerce_rules() -> BusinessRuleIntegrator:
    """Create e-commerce recommendation rules"""
    integrator = BusinessRuleIntegrator()

    # Rule 1: Promotion item boost
    integrator.add_boost_rule(
        name="promotion_boost",
        condition=lambda item, ctx: item.get('is_promotion', False),
        boost_factor=1.5
    )

    # Rule 2: High margin item boost
    integrator.add_boost_rule(
        name="margin_boost",
        condition=lambda item, ctx: item.get('margin_rate', 0) > 0.3,
        boost_factor=1.2
    )

    # Rule 3: Filter sold out items
    integrator.add_filter_rule(
        name="filter_sold_out",
        condition=lambda item, ctx: item.get('stock', 0) == 0
    )

    # Rule 4: Filter price anomaly items
    integrator.add_filter_rule(
        name="filter_price_anomaly",
        condition=lambda item, ctx: item.get('price', 0) < 1 or item.get('price', 0) > 100000
    )

    # Rule 5: New item pin to top
    integrator.add_pin_rule(
        name="new_item_pin",
        condition=lambda item, ctx: item.get('is_new', False) and ctx.get('page', 1) == 1,
        position=0
    )

    return integrator
```

## System Monitoring and Operations

### Monitoring Metrics System

```python
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime
import time

@dataclass
class MonitoringConfig:
    """Monitoring configuration"""
    service_name: str
    alert_thresholds: Dict[str, float]
    sampling_rate: float = 1.0

class RecommenderMonitor:
    """Recommender system monitor"""

    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.metrics_buffer = []

    def record_request(self, latency_ms: float,
                       recall_count: int,
                       rank_count: int,
                       final_count: int,
                       status: str):
        """Record request metrics"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'service': self.config.service_name,
            'latency_ms': latency_ms,
            'recall_count': recall_count,
            'rank_count': rank_count,
            'final_count': final_count,
            'status': status
        }

        self.metrics_buffer.append(metrics)

        # Check if alert is needed
        self._check_alerts(metrics)

    def record_model_metrics(self, model_name: str,
                            inference_latency_ms: float,
                            batch_size: int):
        """Record model inference metrics"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'model_name': model_name,
            'inference_latency_ms': inference_latency_ms,
            'batch_size': batch_size,
            'qps_per_item': batch_size / (inference_latency_ms / 1000)
        }
        self.metrics_buffer.append(metrics)

    def record_feature_metrics(self, feature_name: str,
                               fetch_latency_ms: float,
                               hit_rate: float):
        """Record feature fetch metrics"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'feature_name': feature_name,
            'fetch_latency_ms': fetch_latency_ms,
            'hit_rate': hit_rate
        }
        self.metrics_buffer.append(metrics)

    def _check_alerts(self, metrics: Dict):
        """Check alert conditions"""
        thresholds = self.config.alert_thresholds

        if metrics.get('latency_ms', 0) > thresholds.get('max_latency_ms', 500):
            self._send_alert(f"High latency: {metrics['latency_ms']}ms")

        if metrics.get('status') == 'error':
            self._send_alert(f"Request failed")

    def _send_alert(self, message: str):
        """Send alert"""
        print(f"ALERT [{self.config.service_name}]: {message}")


class ABTestMonitor:
    """A/B test monitor"""

    def __init__(self):
        self.experiment_metrics = {}

    def record_experiment_metrics(self, experiment_name: str,
                                  bucket: str,
                                  metric_name: str,
                                  value: float):
        """Record experiment metrics"""
        key = (experiment_name, bucket, metric_name)
        if key not in self.experiment_metrics:
            self.experiment_metrics[key] = []
        self.experiment_metrics[key].append({
            'value': value,
            'timestamp': datetime.now()
        })

    def get_experiment_summary(self, experiment_name: str) -> Dict:
        """Get experiment summary"""
        import numpy as np

        summary = {}
        for (exp_name, bucket, metric_name), values in self.experiment_metrics.items():
            if exp_name != experiment_name:
                continue

            if bucket not in summary:
                summary[bucket] = {}

            metric_values = [v['value'] for v in values]
            summary[bucket][metric_name] = {
                'mean': np.mean(metric_values),
                'std': np.std(metric_values),
                'count': len(metric_values),
                'p50': np.percentile(metric_values, 50),
                'p99': np.percentile(metric_values, 99)
            }

        return summary
```

### Anomaly Detection and Alerting

```python
import numpy as np
from collections import deque
from typing import Optional

class AnomalyDetector:
    """Anomaly detector"""

    def __init__(self, window_size: int = 100,
                 sigma_threshold: float = 3.0):
        self.window_size = window_size
        self.sigma_threshold = sigma_threshold
        self.history = deque(maxlen=window_size)

    def add_point(self, value: float) -> Optional[str]:
        """
        Add data point and detect anomaly

        Returns:
            Anomaly type (if any) or None
        """
        if len(self.history) < self.window_size // 2:
            self.history.append(value)
            return None

        # Calculate statistics
        mean = np.mean(self.history)
        std = np.std(self.history)

        if std == 0:
            std = 1e-6

        z_score = (value - mean) / std

        self.history.append(value)

        if abs(z_score) > self.sigma_threshold:
            if z_score > 0:
                return "spike"
            else:
                return "drop"

        return None


class CTRAnomalyDetector:
    """CTR anomaly detection"""

    def __init__(self):
        self.item_ctr_history = {}

    def check_item_ctr(self, item_id: str, ctr: float,
                       exposure_count: int) -> Optional[Dict]:
        """Check if item CTR is anomalous"""
        if exposure_count < 100:
            return None  # Insufficient exposure

        if item_id not in self.item_ctr_history:
            self.item_ctr_history[item_id] = deque(maxlen=24)  # 24 hours

        history = self.item_ctr_history[item_id]

        if len(history) < 3:
            history.append(ctr)
            return None

        avg_ctr = np.mean(history)

        # CTR suddenly dropped by more than 50%
        if ctr < avg_ctr * 0.5:
            return {
                'type': 'ctr_drop',
                'item_id': item_id,
                'current_ctr': ctr,
                'avg_ctr': avg_ctr,
                'drop_rate': (avg_ctr - ctr) / avg_ctr
            }

        # CTR suddenly increased by more than 100% (possibly fake traffic)
        if ctr > avg_ctr * 2:
            return {
                'type': 'ctr_spike',
                'item_id': item_id,
                'current_ctr': ctr,
                'avg_ctr': avg_ctr,
                'spike_rate': (ctr - avg_ctr) / avg_ctr
            }

        history.append(ctr)
        return None


class ModelDriftDetector:
    """Model drift detection"""

    def __init__(self, reference_distribution: Dict[str, float]):
        """
        Args:
            reference_distribution: Reference feature distribution
        """
        self.reference = reference_distribution

    def check_drift(self, current_distribution: Dict[str, float],
                    threshold: float = 0.1) -> Optional[Dict]:
        """
        Detect feature distribution drift

        Use KL divergence to measure distribution difference
        """
        kl_divergence = self._compute_kl_divergence(
            self.reference, current_distribution
        )

        if kl_divergence > threshold:
            return {
                'type': 'feature_drift',
                'kl_divergence': kl_divergence,
                'threshold': threshold
            }

        return None

    def _compute_kl_divergence(self, p: Dict[str, float],
                                q: Dict[str, float]) -> float:
        """Compute KL divergence"""
        kl = 0
        for key in p:
            if key in q and p[key] > 0 and q[key] > 0:
                kl += p[key] * np.log(p[key] / q[key])
        return kl
```

## Interview Key Points

### Common Interview Questions

**Q1: Why do recommender systems need layered architecture (retrieval, pre-ranking, ranking, re-ranking)?**

The layered architecture is designed to balance effectiveness and efficiency:

- **Retrieval layer**: Quickly filter candidates (tens of thousands) from massive items (billions), using simple and efficient algorithms
- **Pre-ranking layer**: Further filter (thousands), using lightweight models
- **Ranking layer**: Precise scoring (hundreds), using complex models to ensure effectiveness
- **Re-ranking layer**: Consider business rules, diversity, etc., to generate final results

Each layer progressively reduces the candidate count, allowing subsequent layers to use more complex models.

**Q2: How to evaluate the effectiveness of a recommender system?**

Recommender system evaluation needs to consider multiple dimensions:

| Dimension | Metrics | Description |
|-----------|---------|-------------|
| Accuracy | CTR, CVR, AUC | Prediction accuracy |
| Relevance | NDCG, MAP | Ranking quality |
| Diversity | Category entropy, ILS | Recommendation diversity |
| Coverage | Item Coverage | Proportion of items recommended |
| Novelty | Novelty | Ability to recommend unpopular items |
| Latency | P99 latency | Response time |

**Q3: How to solve the cold start problem?**

New user cold start:
- Recommendations based on demographic features
- Based on interest tags selected during registration
- Popular recommendations as fallback
- Guide users to provide feedback (exploration)

New item cold start:
- Find similar items based on item content features
- Use item attributes to generate initial embeddings
- Forced exposure strategy (Explore & Exploit)
- Rule-based initial traffic allocation

**Q4: How to handle bias problems in recommender systems?**

Common biases and solutions:

| Bias Type | Description | Solution |
|-----------|-------------|----------|
| Position bias | Users tend to click items at top positions | Position factor modeling, IPW correction |
| Exposure bias | Can only observe feedback for recommended items | Causal inference, random exposure |
| Popularity bias | Popular items get more exposure | Inverse propensity weighting, diversity constraints |
| Feedback delay bias | Conversion behavior has delay | Delay modeling, multi-window samples |

**Q5: How to ensure online stability of recommender systems?**

- **Degradation strategy**: Degrade to popular recommendations when model service fails
- **Caching mechanism**: Cache partial recommendation results to reduce real-time computation pressure
- **Rate limiting and circuit breaking**: Prevent traffic spikes from overwhelming the system
- **Gradual rollout**: Deploy new models in phases, rollback promptly if needed
- **Monitoring and alerting**: Real-time monitoring of key metrics, alert on anomalies

### System Design Interview Example

**Problem: Design an e-commerce recommendation system**

**Requirements clarification:**
- User scale: 100 million DAU
- Product scale: 10 million SKUs
- QPS requirement: 100,000
- Latency requirement: P99 < 100ms
- Business metrics: CTR, CVR, GMV

**High-level design:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Traffic Entry                             │
│                        (Nginx/API Gateway)                          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                       Recommendation Service Layer                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Retrieval│  │Pre-Rank  │  │ Ranking  │  │Re-Ranking│           │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Vector Index   │    │  Feature Store  │    │  Model Serving  │
│    (Faiss)      │    │ (Redis/HBase)   │    │(TF Serving)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Key design points:**

1. **Retrieval layer**: Multi-channel retrieval (vector recall, collaborative filtering, popular, category), returning 10,000 candidates total

2. **Pre-ranking layer**: Lightweight two-tower model, filtering to 1,000

3. **Ranking layer**: Deep ranking model (DCN/MMOE), CTR+CVR multi-objective optimization, filtering to 100

4. **Re-ranking layer**: MMR diversity algorithm + business rules (promotion pinning, category scattering)

5. **Feature system**:
   - Offline features: User profiles, item attributes (stored in HBase)
   - Real-time features: Recent behavior sequences (stored in Redis)

6. **High availability design**:
   - Retrieval result caching (5-minute TTL)
   - Model degradation strategy
   - Multi-datacenter deployment

### Technical Key Points Summary

1. **Architecture level**: Layered design is the core, each layer has clear responsibilities
2. **Retrieval level**: Multi-channel retrieval is standard, vector retrieval is the trend
3. **Ranking level**: Deep learning models + multi-objective optimization
4. **Engineering level**: Feature systems, real-time capability, stability are key
5. **Business level**: A/B testing driven, continuous iterative optimization

## Summary

Recommender system engineering is a highly comprehensive field, involving machine learning, distributed systems, real-time computing, and other areas. This article covered the core components and key technologies of recommender systems from an engineering practice perspective:

1. **Architecture design**: Adopts "retrieval-pre-ranking-ranking-re-ranking" cascading architecture, balancing effectiveness and efficiency
2. **Retrieval strategies**: Multi-channel retrieval fusion, vector retrieval is the mainstream trend
3. **Ranking models**: Deep learning models dominate, multi-objective optimization becomes standard
4. **Cold start**: Combining content features and exploration strategies
5. **Real-time systems**: Feature real-time capability, model real-time capability are core challenges
6. **A/B testing**: Data-driven decision making, scientific validation of effects
7. **Business integration**: Rules and models combined to meet business requirements

The development of recommender systems is changing rapidly, from collaborative filtering to deep learning, from offline batch processing to real-time recommendations, technology is constantly evolving. Mastering the core principles and practical experience of recommender system engineering is crucial for building high-quality recommendation products.

## Further Reading

### Recommended Papers

- **Two-Tower Model**: "Sampling-Bias-Corrected Neural Modeling for Large Corpus Item Recommendations"
- **Multi-Objective Optimization**: "Modeling Task Relationships in Multi-task Learning with Multi-gate Mixture-of-Experts"
- **Real-time Recommendations**: "Real-time Attention Based Look-alike Model for Recommender System"
- **Debiasing**: "Unbiased Learning to Rank with Unbiased Propensity Estimation"

### Industry Practice

- **Alibaba**: "Deep Interest Network for Click-Through Rate Prediction"
- **Meituan**: Meituan Tech Blog Recommendation Series
- **ByteDance**: "Deep Learning Recommendation Model for Personalization and Recommendation Systems"
- **Netflix**: Netflix Tech Blog Recommendation System Articles

### Open Source Projects

- **DeepCTR**: Deep Learning CTR Model Library
- **RecBole**: Recommender System Research Framework
- **Faiss**: Facebook Efficient Vector Retrieval Library
- **Feast**: Feature Store System
