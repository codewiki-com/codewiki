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
origin: old/src/content/docs/ai/recommendation.zh.md
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

推荐系统是现代互联网应用的核心组件之一，从电商平台的商品推荐到视频网站的内容推荐，从社交媒体的信息流到音乐应用的歌曲推荐，推荐系统无处不在。本文将深入介绍推荐系统的核心算法和实践技巧，帮助你构建高效的个性化推荐服务。

---

## 推荐系统概述

### 什么是推荐系统

推荐系统是一种信息过滤系统，通过分析用户的历史行为、偏好和上下文信息，预测用户可能感兴趣的内容或商品，并主动向用户推送相关推荐。

**推荐系统的核心目标：**

- **用户角度**：帮助用户发现感兴趣的内容，减少信息过载
- **平台角度**：提高用户粘性、转化率和商业价值
- **内容角度**：让优质内容获得更多曝光机会

### 推荐系统分类

```python
# 推荐系统主要分类
recommendation_systems = {
    "协同过滤": {
        "用户协同过滤": "基于相似用户的偏好进行推荐",
        "物品协同过滤": "基于相似物品进行推荐",
        "矩阵分解": "通过分解用户-物品交互矩阵"
    },
    "基于内容": {
        "特征匹配": "基于物品特征与用户偏好匹配",
        "TF-IDF": "基于文本特征相似度",
        "知识图谱": "基于语义关系进行推荐"
    },
    "深度学习": {
        "神经协同过滤": "NCF, DeepFM等",
        "序列推荐": "RNN, Transformer based",
        "图神经网络": "GNN based推荐"
    },
    "混合方法": "结合多种方法的优势"
}
```

### 推荐系统架构

一个完整的推荐系统通常包含以下组件：

```
+-----------------------------------------------------------+
|                     推荐系统架构                            |
+-----------------------------------------------------------+
|  +---------+   +---------+   +---------+   +---------+    |
|  |数据采集  | -> |特征工程  | -> |召回层   | -> |排序层   |   |
|  +---------+   +---------+   +---------+   +---------+    |
|       |             |             |             |          |
|  用户行为日志    特征存储       候选集生成     精排模型      |
|  物品属性       Embedding      多路召回       点击率预估    |
|  上下文信息     实时特征       粗排过滤       重排策略      |
+-----------------------------------------------------------+
```

---

## 协同过滤

协同过滤（Collaborative Filtering）是推荐系统中最经典的算法之一，其核心思想是利用群体的行为来预测个体的偏好。

### 用户协同过滤（User-CF）

用户协同过滤基于"相似用户有相似偏好"的假设，找到与目标用户兴趣相似的用户群体，将他们喜欢的物品推荐给目标用户。

**算法步骤：**

1. 计算用户之间的相似度
2. 找到与目标用户最相似的K个用户
3. 将这些相似用户喜欢的物品推荐给目标用户

```python
import numpy as np
from collections import defaultdict
from typing import Dict, List, Tuple

class UserBasedCF:
    """用户协同过滤推荐系统"""

    def __init__(self, k_neighbors: int = 20):
        self.k_neighbors = k_neighbors
        self.user_item_matrix = None
        self.user_similarity = None
        self.user_mean_ratings = None

    def fit(self, ratings: Dict[int, Dict[int, float]]):
        """
        训练模型

        Args:
            ratings: 用户评分字典 {user_id: {item_id: rating}}
        """
        # 获取所有用户和物品
        users = list(ratings.keys())
        items = set()
        for user_ratings in ratings.values():
            items.update(user_ratings.keys())
        items = list(items)

        # 构建用户-物品评分矩阵
        n_users, n_items = len(users), len(items)
        self.user_idx = {u: i for i, u in enumerate(users)}
        self.item_idx = {item: i for i, item in enumerate(items)}
        self.idx_user = {i: u for u, i in self.user_idx.items()}
        self.idx_item = {i: item for item, i in self.item_idx.items()}

        # 初始化矩阵（使用NaN表示未评分）
        self.user_item_matrix = np.full((n_users, n_items), np.nan)

        for user, user_ratings in ratings.items():
            for item, rating in user_ratings.items():
                self.user_item_matrix[self.user_idx[user], self.item_idx[item]] = rating

        # 计算用户平均评分
        self.user_mean_ratings = np.nanmean(self.user_item_matrix, axis=1)

        # 计算用户相似度矩阵
        self._compute_similarity()

    def _compute_similarity(self):
        """计算用户之间的余弦相似度"""
        n_users = self.user_item_matrix.shape[0]
        self.user_similarity = np.zeros((n_users, n_users))

        # 中心化评分（减去用户均值）
        centered_matrix = self.user_item_matrix - self.user_mean_ratings[:, np.newaxis]
        centered_matrix = np.nan_to_num(centered_matrix, nan=0)

        # 计算余弦相似度
        for i in range(n_users):
            for j in range(i, n_users):
                # 找到两个用户都评过分的物品
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
        """预测用户对物品的评分"""
        if user_id not in self.user_idx or item_id not in self.item_idx:
            return self.user_mean_ratings.mean()

        user_idx = self.user_idx[user_id]
        item_idx = self.item_idx[item_id]

        # 获取对该物品评过分的用户
        rated_users = ~np.isnan(self.user_item_matrix[:, item_idx])

        # 获取相似度最高的K个邻居
        similarities = self.user_similarity[user_idx].copy()
        similarities[user_idx] = -1  # 排除自己
        similarities[~rated_users] = -1  # 排除未评分用户

        top_k_indices = np.argsort(similarities)[-self.k_neighbors:]
        top_k_indices = top_k_indices[similarities[top_k_indices] > 0]

        if len(top_k_indices) == 0:
            return self.user_mean_ratings[user_idx]

        # 加权平均预测评分
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
        """为用户推荐物品"""
        if user_id not in self.user_idx:
            return []

        user_idx = self.user_idx[user_id]

        # 获取用户未评分的物品
        unrated_items = np.where(np.isnan(self.user_item_matrix[user_idx]))[0]

        # 预测评分
        predictions = []
        for item_idx in unrated_items:
            item_id = self.idx_item[item_idx]
            pred_rating = self.predict(user_id, item_id)
            predictions.append((item_id, pred_rating))

        # 按预测评分排序
        predictions.sort(key=lambda x: x[1], reverse=True)

        return predictions[:n_items]


# 使用示例
if __name__ == "__main__":
    # 模拟用户评分数据
    ratings = {
        1: {101: 5, 102: 3, 103: 4, 104: 4},
        2: {101: 3, 102: 1, 103: 2, 104: 3, 105: 3},
        3: {101: 4, 102: 3, 103: 4, 104: 3, 105: 5},
        4: {101: 3, 102: 3, 103: 1, 104: 5, 105: 4},
        5: {101: 1, 102: 5, 103: 5, 104: 2, 105: 1},
    }

    # 训练模型
    cf = UserBasedCF(k_neighbors=3)
    cf.fit(ratings)

    # 为用户1推荐
    recommendations = cf.recommend(user_id=1, n_items=5)
    print("推荐结果:", recommendations)
```

### 物品协同过滤（Item-CF）

物品协同过滤基于"相似物品会被同一用户喜欢"的假设，计算物品之间的相似度，推荐与用户历史喜欢物品相似的物品。

**Item-CF vs User-CF：**

| 特性 | User-CF | Item-CF |
|------|---------|---------|
| 适用场景 | 用户数量少，物品更新快 | 物品数量少，用户更新快 |
| 计算复杂度 | 用户相似度计算 | 物品相似度计算 |
| 实时性 | 需要频繁更新 | 物品相似度稳定 |
| 典型应用 | 新闻推荐 | 电商推荐 |

```python
class ItemBasedCF:
    """物品协同过滤推荐系统"""

    def __init__(self, k_neighbors: int = 20):
        self.k_neighbors = k_neighbors
        self.item_similarity = None

    def fit(self, ratings: Dict[int, Dict[int, float]]):
        """训练模型"""
        # 构建物品-用户倒排索引
        item_users = defaultdict(dict)
        for user, user_ratings in ratings.items():
            for item, rating in user_ratings.items():
                item_users[item][user] = rating

        items = list(item_users.keys())
        n_items = len(items)
        self.item_idx = {item: i for i, item in enumerate(items)}
        self.idx_item = {i: item for item, i in self.item_idx.items()}

        # 计算物品相似度
        self.item_similarity = np.zeros((n_items, n_items))

        for i, item_i in enumerate(items):
            for j, item_j in enumerate(items):
                if i >= j:
                    continue

                # 找到同时评价过两个物品的用户
                common_users = set(item_users[item_i].keys()) & set(item_users[item_j].keys())

                if len(common_users) > 0:
                    # 计算余弦相似度
                    vec_i = [item_users[item_i][u] for u in common_users]
                    vec_j = [item_users[item_j][u] for u in common_users]

                    sim = np.dot(vec_i, vec_j) / (np.linalg.norm(vec_i) * np.linalg.norm(vec_j))
                    self.item_similarity[i, j] = sim
                    self.item_similarity[j, i] = sim

        self.item_users = item_users
        self.ratings = ratings

    def recommend(self, user_id: int, n_items: int = 10) -> List[Tuple[int, float]]:
        """为用户推荐物品"""
        if user_id not in self.ratings:
            return []

        user_history = self.ratings[user_id]
        candidates = defaultdict(float)

        for item, rating in user_history.items():
            if item not in self.item_idx:
                continue
            item_idx = self.item_idx[item]

            # 找到相似物品
            similarities = self.item_similarity[item_idx]
            top_k = np.argsort(similarities)[-self.k_neighbors:]

            for similar_idx in top_k:
                similar_item = self.idx_item[similar_idx]
                if similar_item not in user_history:
                    candidates[similar_item] += similarities[similar_idx] * rating

        # 排序返回
        recommendations = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
        return recommendations[:n_items]
```

### 矩阵分解（Matrix Factorization）

矩阵分解是协同过滤的一种高效实现，通过将高维稀疏的用户-物品交互矩阵分解为两个低维稠密矩阵的乘积，学习用户和物品的隐向量表示。

**SVD分解：**

$$R \approx U \cdot \Sigma \cdot V^T$$

**隐语义模型（LFM）：**

$$\hat{r}_{ui} = \mu + b_u + b_i + p_u^T \cdot q_i$$

其中 $p_u$ 是用户 $u$ 的隐向量，$q_i$ 是物品 $i$ 的隐向量。

```python
import numpy as np
from typing import Tuple

class MatrixFactorization:
    """矩阵分解推荐系统（使用SGD优化）"""

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
        训练矩阵分解模型

        Args:
            ratings: 评分数组
            user_ids: 用户ID数组
            item_ids: 物品ID数组
        """
        # 构建映射
        unique_users = np.unique(user_ids)
        unique_items = np.unique(item_ids)

        self.user_to_idx = {u: i for i, u in enumerate(unique_users)}
        self.item_to_idx = {item: i for i, item in enumerate(unique_items)}
        self.idx_to_user = {i: u for u, i in self.user_to_idx.items()}
        self.idx_to_item = {i: item for item, i in self.item_to_idx.items()}

        n_users = len(unique_users)
        n_items = len(unique_items)

        # 初始化参数
        self.global_mean = np.mean(ratings)
        self.user_bias = np.zeros(n_users)
        self.item_bias = np.zeros(n_items)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))

        # SGD训练
        for epoch in range(self.n_epochs):
            # 打乱数据
            indices = np.random.permutation(len(ratings))

            total_loss = 0
            for idx in indices:
                user = self.user_to_idx[user_ids[idx]]
                item = self.item_to_idx[item_ids[idx]]
                rating = ratings[idx]

                # 预测
                pred = self._predict_single(user, item)
                error = rating - pred
                total_loss += error ** 2

                # 更新偏置
                self.user_bias[user] += self.lr * (error - self.reg * self.user_bias[user])
                self.item_bias[item] += self.lr * (error - self.reg * self.item_bias[item])

                # 更新隐向量
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
        """预测单个评分"""
        return (
            self.global_mean +
            self.user_bias[user_idx] +
            self.item_bias[item_idx] +
            np.dot(self.user_factors[user_idx], self.item_factors[item_idx])
        )

    def predict(self, user_id: int, item_id: int) -> float:
        """预测用户对物品的评分"""
        if user_id not in self.user_to_idx or item_id not in self.item_to_idx:
            return self.global_mean

        user_idx = self.user_to_idx[user_id]
        item_idx = self.item_to_idx[item_id]

        return self._predict_single(user_idx, item_idx)

    def recommend(self, user_id: int, n_items: int = 10,
                  exclude_items: set = None) -> List[Tuple[int, float]]:
        """为用户推荐物品"""
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


# 使用示例
if __name__ == "__main__":
    # 模拟数据
    np.random.seed(42)
    n_samples = 1000
    user_ids = np.random.randint(0, 100, n_samples)
    item_ids = np.random.randint(0, 50, n_samples)
    ratings = np.random.randint(1, 6, n_samples).astype(float)

    # 训练模型
    mf = MatrixFactorization(n_factors=20, n_epochs=100)
    mf.fit(ratings, user_ids, item_ids)

    # 推荐
    recs = mf.recommend(user_id=0, n_items=5)
    print("推荐结果:", recs)
```

---

## 基于内容的推荐

基于内容的推荐（Content-Based Filtering）通过分析物品的内容特征和用户的偏好特征，推荐与用户历史偏好相似的物品。

### 特征提取

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

class ContentBasedRecommender:
    """基于内容的推荐系统"""

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
        训练模型

        Args:
            items_df: 物品数据框，必须包含'item_id'和content_column
            content_column: 内容特征列名
        """
        self.items_df = items_df.copy()

        # TF-IDF特征提取
        content = items_df[content_column].fillna('')
        self.item_profiles = self.tfidf.fit_transform(content)

        # 计算物品相似度矩阵
        self.item_similarity = cosine_similarity(self.item_profiles)

        # 构建索引
        self.item_to_idx = {
            item_id: idx for idx, item_id in enumerate(items_df['item_id'])
        }
        self.idx_to_item = {
            idx: item_id for item_id, idx in self.item_to_idx.items()
        }

    def get_similar_items(self, item_id: int, n_items: int = 10) -> List[Tuple[int, float]]:
        """获取相似物品"""
        if item_id not in self.item_to_idx:
            return []

        item_idx = self.item_to_idx[item_id]
        similarities = self.item_similarity[item_idx]

        # 排除自己
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
        基于用户历史推荐

        Args:
            user_history: 用户历史 [(item_id, rating), ...]
            n_items: 推荐数量
        """
        # 构建用户画像（历史物品的加权平均）
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

        # 计算与所有物品的相似度
        similarities = cosine_similarity(
            user_profile.reshape(1, -1),
            self.item_profiles
        ).flatten()

        # 排除已交互物品
        history_items = {item_id for item_id, _ in user_history}

        candidates = []
        for item_id, idx in self.item_to_idx.items():
            if item_id not in history_items:
                candidates.append((item_id, similarities[idx]))

        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:n_items]


# 使用示例
if __name__ == "__main__":
    # 模拟电影数据
    movies_df = pd.DataFrame({
        'item_id': [1, 2, 3, 4, 5],
        'title': ['动作片A', '动作片B', '爱情片C', '科幻片D', '科幻片E'],
        'description': [
            'action adventure explosion hero fighting',
            'action thriller chase combat hero',
            'romance love story relationship drama',
            'science fiction space alien future technology',
            'science fiction robot AI technology future'
        ]
    })

    # 训练模型
    recommender = ContentBasedRecommender()
    recommender.fit(movies_df, 'description')

    # 获取相似电影
    similar = recommender.get_similar_items(item_id=4, n_items=3)
    print("与科幻片D相似的电影:", similar)

    # 基于用户历史推荐
    user_history = [(1, 5), (2, 4)]  # 用户喜欢动作片
    recommendations = recommender.recommend_for_user(user_history, n_items=3)
    print("推荐结果:", recommendations)
```

### 知识图谱增强推荐

```python
from collections import defaultdict

class KnowledgeGraphRecommender:
    """基于知识图谱的推荐系统"""

    def __init__(self, embedding_dim: int = 64):
        self.embedding_dim = embedding_dim
        self.entity_embeddings = {}
        self.relation_embeddings = {}

    def build_graph(self, triplets: List[Tuple[str, str, str]]):
        """
        构建知识图谱

        Args:
            triplets: 三元组列表 [(head, relation, tail), ...]
        """
        self.graph = defaultdict(list)
        entities = set()
        relations = set()

        for head, relation, tail in triplets:
            self.graph[head].append((relation, tail))
            entities.add(head)
            entities.add(tail)
            relations.add(relation)

        # 初始化嵌入
        for entity in entities:
            self.entity_embeddings[entity] = np.random.randn(self.embedding_dim)
        for relation in relations:
            self.relation_embeddings[relation] = np.random.randn(self.embedding_dim)

    def get_entity_neighbors(self, entity: str, hops: int = 2) -> set:
        """获取实体的多跳邻居"""
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
        """基于实体推荐相关实体"""
        neighbors = self.get_entity_neighbors(entity, hops=2)

        # 按嵌入相似度排序
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

## 混合推荐系统

混合推荐系统结合多种推荐算法的优势，通常能获得比单一算法更好的推荐效果。

### 混合策略

```python
class HybridRecommender:
    """混合推荐系统"""

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
        混合推荐

        支持多种混合策略：
        1. 加权混合：对不同模型的评分加权求和
        2. 切换混合：根据条件切换使用不同模型
        3. 级联混合：一个模型筛选，另一个模型精排
        """
        # 获取协同过滤推荐
        cf_recs = self.cf_model.recommend(user_id, n_items=n_items * 2)
        cf_scores = {item_id: score for item_id, score in cf_recs}

        # 获取内容推荐
        content_recs = self.content_model.recommend_for_user(
            user_history, n_items=n_items * 2
        )
        content_scores = {item_id: score for item_id, score in content_recs}

        # 合并候选集
        all_items = set(cf_scores.keys()) | set(content_scores.keys())

        # 计算混合分数
        hybrid_scores = []
        for item_id in all_items:
            cf_score = cf_scores.get(item_id, 0)
            content_score = content_scores.get(item_id, 0)

            # 归一化
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

## 深度学习推荐

深度学习在推荐系统中的应用越来越广泛，能够自动学习复杂的特征交互和用户行为模式。

### 神经协同过滤（NCF）

神经协同过滤使用神经网络替代矩阵分解中的点积操作，能够学习更复杂的用户-物品交互模式。

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset

class NCFDataset(Dataset):
    """NCF数据集"""

    def __init__(self, user_ids, item_ids, ratings):
        self.user_ids = torch.LongTensor(user_ids)
        self.item_ids = torch.LongTensor(item_ids)
        self.ratings = torch.FloatTensor(ratings)

    def __len__(self):
        return len(self.ratings)

    def __getitem__(self, idx):
        return self.user_ids[idx], self.item_ids[idx], self.ratings[idx]


class NeuralCollaborativeFiltering(nn.Module):
    """神经协同过滤模型"""

    def __init__(
        self,
        n_users: int,
        n_items: int,
        embedding_dim: int = 64,
        mlp_layers: List[int] = [128, 64, 32]
    ):
        super().__init__()

        # GMF部分的嵌入
        self.gmf_user_embedding = nn.Embedding(n_users, embedding_dim)
        self.gmf_item_embedding = nn.Embedding(n_items, embedding_dim)

        # MLP部分的嵌入
        self.mlp_user_embedding = nn.Embedding(n_users, embedding_dim)
        self.mlp_item_embedding = nn.Embedding(n_items, embedding_dim)

        # MLP层
        mlp_input_dim = embedding_dim * 2
        self.mlp_layers = nn.ModuleList()

        for layer_size in mlp_layers:
            self.mlp_layers.append(nn.Linear(mlp_input_dim, layer_size))
            self.mlp_layers.append(nn.ReLU())
            self.mlp_layers.append(nn.Dropout(0.2))
            mlp_input_dim = layer_size

        # 输出层
        self.output_layer = nn.Linear(embedding_dim + mlp_layers[-1], 1)

        self._init_weights()

    def _init_weights(self):
        """初始化权重"""
        for module in self.modules():
            if isinstance(module, nn.Embedding):
                nn.init.normal_(module.weight, std=0.01)
            elif isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                nn.init.zeros_(module.bias)

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor) -> torch.Tensor:
        # GMF部分
        gmf_user = self.gmf_user_embedding(user_ids)
        gmf_item = self.gmf_item_embedding(item_ids)
        gmf_output = gmf_user * gmf_item  # 逐元素相乘

        # MLP部分
        mlp_user = self.mlp_user_embedding(user_ids)
        mlp_item = self.mlp_item_embedding(item_ids)
        mlp_input = torch.cat([mlp_user, mlp_item], dim=-1)

        for layer in self.mlp_layers:
            mlp_input = layer(mlp_input)
        mlp_output = mlp_input

        # 合并输出
        concat = torch.cat([gmf_output, mlp_output], dim=-1)
        output = self.output_layer(concat)

        return output.squeeze()


class NCFTrainer:
    """NCF训练器"""

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
        self.model.eval()
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

DeepFM结合了因子分解机（FM）和深度神经网络，能够同时学习低阶和高阶特征交互。

```python
class DeepFM(nn.Module):
    """DeepFM模型"""

    def __init__(
        self,
        field_dims: List[int],
        embedding_dim: int = 16,
        mlp_dims: List[int] = [256, 128, 64]
    ):
        super().__init__()

        self.n_fields = len(field_dims)

        # 特征嵌入
        self.embeddings = nn.ModuleList([
            nn.Embedding(dim, embedding_dim) for dim in field_dims
        ])

        # 一阶特征（线性部分）
        self.linear = nn.ModuleList([
            nn.Embedding(dim, 1) for dim in field_dims
        ])

        # FM二阶交互部分已在forward中实现

        # DNN部分
        dnn_input_dim = self.n_fields * embedding_dim
        self.dnn_layers = nn.ModuleList()

        for mlp_dim in mlp_dims:
            self.dnn_layers.append(nn.Linear(dnn_input_dim, mlp_dim))
            self.dnn_layers.append(nn.BatchNorm1d(mlp_dim))
            self.dnn_layers.append(nn.ReLU())
            self.dnn_layers.append(nn.Dropout(0.2))
            dnn_input_dim = mlp_dim

        # 输出层
        self.output_layer = nn.Linear(mlp_dims[-1] + 1, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: 输入特征 [batch_size, n_fields]
        """
        # 获取嵌入
        embed_list = []
        for i in range(self.n_fields):
            embed_list.append(self.embeddings[i](x[:, i]))
        embeddings = torch.stack(embed_list, dim=1)  # [batch, n_fields, embed_dim]

        # 一阶特征
        linear_out = sum([
            self.linear[i](x[:, i]).squeeze() for i in range(self.n_fields)
        ])

        # FM二阶交互
        # sum_square: (sum(vi))^2
        sum_square = embeddings.sum(dim=1).pow(2).sum(dim=1)
        # square_sum: sum(vi^2)
        square_sum = embeddings.pow(2).sum(dim=1).sum(dim=1)
        fm_out = 0.5 * (sum_square - square_sum)

        # DNN部分
        dnn_input = embeddings.view(embeddings.size(0), -1)
        for layer in self.dnn_layers:
            dnn_input = layer(dnn_input)
        dnn_out = dnn_input

        # 合并输出
        combined = torch.cat([
            (linear_out + fm_out).unsqueeze(1),
            dnn_out
        ], dim=1)

        output = torch.sigmoid(self.output_layer(combined)).squeeze()

        return output
```

### 序列推荐（Transformer-based）

```python
class TransformerRecommender(nn.Module):
    """基于Transformer的序列推荐模型"""

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
            item_seq: 物品序列 [batch_size, seq_len]
            attention_mask: 注意力掩码
        """
        batch_size, seq_len = item_seq.shape

        # 获取嵌入
        item_emb = self.item_embedding(item_seq)

        # 位置编码
        positions = torch.arange(seq_len, device=item_seq.device)
        pos_emb = self.position_embedding(positions)

        # 合并嵌入
        hidden = self.dropout(item_emb + pos_emb)

        # 生成因果掩码（防止看到未来信息）
        causal_mask = torch.triu(
            torch.ones(seq_len, seq_len, device=item_seq.device),
            diagonal=1
        ).bool()

        # Transformer编码
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

        # 输出预测
        output = self.output_layer(hidden)

        return output

    def predict_next(self, item_seq: torch.Tensor, top_k: int = 10) -> torch.Tensor:
        """预测下一个物品"""
        self.eval()
        with torch.no_grad():
            output = self.forward(item_seq)
            # 取序列最后一个位置的预测
            last_output = output[:, -1, :]
            _, indices = torch.topk(last_output, top_k)
        return indices
```

---

## 评估指标

推荐系统的评估需要从多个维度进行，包括准确性、多样性、新颖性等。

### 离线评估指标

```python
import numpy as np
from typing import List, Dict
from collections import defaultdict

class RecommendationMetrics:
    """推荐系统评估指标"""

    @staticmethod
    def precision_at_k(recommended: List, relevant: set, k: int) -> float:
        """
        精确率@K

        Args:
            recommended: 推荐列表
            relevant: 相关物品集合
            k: Top-K
        """
        recommended_k = recommended[:k]
        hits = len(set(recommended_k) & relevant)
        return hits / k

    @staticmethod
    def recall_at_k(recommended: List, relevant: set, k: int) -> float:
        """
        召回率@K
        """
        if len(relevant) == 0:
            return 0.0
        recommended_k = recommended[:k]
        hits = len(set(recommended_k) & relevant)
        return hits / len(relevant)

    @staticmethod
    def ndcg_at_k(recommended: List, relevant: set, k: int) -> float:
        """
        归一化折损累积增益@K

        NDCG衡量排序质量，相关物品排名越靠前得分越高
        """
        recommended_k = recommended[:k]

        # 计算DCG
        dcg = 0.0
        for i, item in enumerate(recommended_k):
            if item in relevant:
                dcg += 1.0 / np.log2(i + 2)  # i从0开始，所以+2

        # 计算理想DCG
        ideal_dcg = sum([1.0 / np.log2(i + 2) for i in range(min(len(relevant), k))])

        if ideal_dcg == 0:
            return 0.0
        return dcg / ideal_dcg

    @staticmethod
    def map_at_k(recommended: List, relevant: set, k: int) -> float:
        """
        平均精确率@K (Mean Average Precision)
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
        平均倒数排名 (Mean Reciprocal Rank)

        第一个相关物品排名的倒数
        """
        for i, item in enumerate(recommended):
            if item in relevant:
                return 1.0 / (i + 1)
        return 0.0

    @staticmethod
    def hit_rate_at_k(recommended: List, relevant: set, k: int) -> float:
        """
        命中率@K

        推荐列表中是否包含相关物品
        """
        recommended_k = recommended[:k]
        return 1.0 if len(set(recommended_k) & relevant) > 0 else 0.0

    @staticmethod
    def coverage(all_recommendations: List[List], n_items: int) -> float:
        """
        覆盖率

        推荐系统能推荐出的物品占总物品的比例
        """
        recommended_items = set()
        for recs in all_recommendations:
            recommended_items.update(recs)
        return len(recommended_items) / n_items

    @staticmethod
    def diversity(recommended: List, item_similarity: np.ndarray) -> float:
        """
        多样性

        推荐列表中物品之间的平均不相似度
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
        新颖性

        推荐长尾物品的能力，使用自信息量衡量
        """
        if len(recommended) == 0:
            return 0.0

        novelty_scores = []
        for item in recommended:
            popularity = item_popularity.get(item, 1)
            # 自信息量：-log2(popularity / n_users)
            novelty_scores.append(-np.log2(popularity / n_users))

        return np.mean(novelty_scores)


def run_model_assessment(
    model,
    test_data: Dict[int, set],
    k_values: List[int] = [5, 10, 20]
) -> Dict[str, Dict[int, float]]:
    """
    评估推荐模型

    Args:
        model: 推荐模型
        test_data: 测试数据 {user_id: {relevant_items}}
        k_values: 评估的K值列表
    """
    metrics = RecommendationMetrics()
    results = defaultdict(lambda: defaultdict(list))

    for user_id, relevant_items in test_data.items():
        # 获取推荐
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

    # 计算平均值
    avg_results = {}
    for metric_name, k_scores in results.items():
        avg_results[metric_name] = {
            k: np.mean(scores) for k, scores in k_scores.items()
        }

    return avg_results


# 打印评估结果
def print_assessment_results(results: Dict[str, Dict[int, float]]):
    """打印评估结果"""
    print("\n" + "="*60)
    print("推荐系统评估结果")
    print("="*60)

    k_values = list(list(results.values())[0].keys())

    # 表头
    header = f"{'指标':<15}"
    for k in k_values:
        header += f"@{k:<10}"
    print(header)
    print("-"*60)

    # 各指标结果
    for metric_name, k_scores in results.items():
        row = f"{metric_name:<15}"
        for k in k_values:
            row += f"{k_scores[k]:.4f}     "
        print(row)

    print("="*60)
```

### A/B测试

```python
from scipy import stats

class ABTest:
    """A/B测试框架"""

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
        计算所需样本量

        Args:
            baseline_rate: 基线转化率
            mde: 最小可检测效应
            alpha: 显著性水平
            power: 统计功效
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
        运行A/B测试

        Returns:
            包含测试结果的字典
        """
        control_rate = control_conversions / control_total
        treatment_rate = treatment_conversions / treatment_total

        # 卡方检验
        contingency_table = [
            [control_conversions, control_total - control_conversions],
            [treatment_conversions, treatment_total - treatment_conversions]
        ]
        chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)

        # 相对提升
        relative_lift = (treatment_rate - control_rate) / control_rate

        # 置信区间
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

## 工业界实践

### 召回与排序架构

```python
class IndustrialRecommender:
    """工业级推荐系统架构"""

    def __init__(self):
        self.recall_models = []  # 多路召回
        self.ranker = None  # 精排模型
        self.reranker = None  # 重排模型

    def add_recall_model(self, name: str, model, weight: float = 1.0):
        """添加召回通道"""
        self.recall_models.append({
            'name': name,
            'model': model,
            'weight': weight
        })

    def set_ranker(self, ranker):
        """设置精排模型"""
        self.ranker = ranker

    def set_reranker(self, reranker):
        """设置重排模型"""
        self.reranker = reranker

    def recall(self, user_id: int, context: Dict, n_candidates: int = 500) -> List[int]:
        """
        多路召回

        常见召回通道：
        1. 协同过滤召回
        2. 向量召回（Embedding-based）
        3. 热门召回
        4. 标签召回
        5. 实时召回（基于最近行为）
        """
        all_candidates = defaultdict(float)

        for recall_config in self.recall_models:
            model = recall_config['model']
            weight = recall_config['weight']

            candidates = model.recall(user_id, context, n_items=n_candidates // len(self.recall_models))

            for item_id, score in candidates:
                all_candidates[item_id] += score * weight

        # 按分数排序，返回候选集
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
        精排

        使用点击率预估模型（CTR Model）对候选集进行排序
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
        重排

        考虑多样性、时效性、商业目标等因素
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
        完整推荐流程
        """
        # 1. 召回
        candidates = self.recall(user_id, context)

        # 2. 精排
        ranked = self.rank(user_id, candidates, context)

        # 3. 重排
        final = self.rerank(ranked, context)

        return final[:n_items]
```

### 实时特征工程

```python
class FeatureStore:
    """特征存储"""

    def __init__(self):
        self.user_features = {}  # 用户特征
        self.item_features = {}  # 物品特征
        self.realtime_features = {}  # 实时特征

    def get_user_features(self, user_id: int) -> Dict:
        """获取用户特征"""
        return self.user_features.get(user_id, {})

    def get_item_features(self, item_id: int) -> Dict:
        """获取物品特征"""
        return self.item_features.get(item_id, {})

    def get_realtime_features(self, user_id: int) -> Dict:
        """
        获取实时特征

        包括：
        - 最近浏览的物品
        - 最近点击的类目
        - 会话内行为统计
        - 实时上下文（时间、地点等）
        """
        return self.realtime_features.get(user_id, {})

    def build_feature_vector(
        self,
        user_id: int,
        item_id: int,
        context: Dict
    ) -> np.ndarray:
        """构建特征向量"""
        user_feat = self.get_user_features(user_id)
        item_feat = self.get_item_features(item_id)
        realtime_feat = self.get_realtime_features(user_id)

        # 合并特征
        features = {
            **user_feat,
            **item_feat,
            **realtime_feat,
            **context
        }

        # 转换为向量（实际中需要特征工程处理）
        return self._encode_features(features)

    def _encode_features(self, features: Dict) -> np.ndarray:
        """特征编码（简化版）"""
        # 实际中需要进行特征归一化、类别编码等处理
        return np.array(list(features.values()))
```

---

## 面试要点

### 常见面试题

**1. 协同过滤的冷启动问题如何解决？**

```python
"""
冷启动解决方案：

1. 新用户冷启动：
   - 基于人口统计学特征推荐
   - 热门物品推荐
   - 引导用户填写偏好问卷
   - 利用注册时的社交关系

2. 新物品冷启动：
   - 基于内容的推荐
   - 利用物品属性相似度
   - 探索与利用（Exploration & Exploitation）

3. 系统冷启动：
   - 引入外部数据
   - 专家标注
   - 混合推荐策略
"""
```

**2. 如何解决数据稀疏问题？**

```python
"""
数据稀疏解决方案：

1. 矩阵分解：
   - 降维处理，学习稠密表示
   - 正则化防止过拟合

2. 引入隐式反馈：
   - 浏览、停留时间等行为
   - 负采样策略

3. 特征扩展：
   - 利用物品属性
   - 知识图谱补充

4. 迁移学习：
   - 从相关领域迁移知识
"""
```

**3. 推荐系统的多样性与准确性如何平衡？**

```python
"""
多样性与准确性平衡：

1. MMR（Maximal Marginal Relevance）：
   score = lambda * relevance - (1 - lambda) * max_similarity_to_selected

2. DPP（Determinantal Point Process）：
   利用行列式建模多样性

3. 分slot推荐：
   不同位置使用不同策略

4. 多目标优化：
   帕累托最优解
"""

class MMRReranker:
    """MMR重排序"""

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
                # 计算与已选物品的最大相似度
                if selected:
                    max_sim = max(
                        item_similarity.get((item_id, s_id), 0)
                        for s_id, _ in selected
                    )
                else:
                    max_sim = 0

                # MMR分数
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

**4. 实时推荐系统架构设计**

```
+-------------------------------------------------------------------+
|                      实时推荐系统架构                                |
+-------------------------------------------------------------------+
|                                                                    |
|  用户请求 -> API Gateway -> 推荐服务                                |
|                              |                                     |
|                    +---------+---------+                           |
|                    |                   |                           |
|              特征服务            模型服务                            |
|                    |                   |                           |
|            +-------+-------+    +------+------+                    |
|            |       |       |    |      |      |                    |
|          Redis  Hbase  Flink  召回   精排   重排                    |
|         (实时)  (离线) (流式)                                       |
|                                                                    |
|  数据流：                                                           |
|  用户行为 -> Kafka -> Flink -> 特征更新                             |
|                    -> HDFS -> Spark -> 模型训练 -> 模型部署          |
|                                                                    |
+-------------------------------------------------------------------+
```

### 核心知识点总结

| 主题 | 核心要点 |
|------|----------|
| 协同过滤 | User-CF适合用户少物品多；Item-CF适合物品少用户多；矩阵分解适合大规模数据 |
| 内容推荐 | 不依赖用户行为；可解释性强；容易陷入"信息茧房" |
| 深度学习 | NCF学习非线性交互；DeepFM处理特征交互；Transformer建模序列 |
| 评估指标 | 准确性（Precision/Recall/NDCG）；多样性；覆盖率；新颖性 |
| 工业实践 | 多路召回+精排+重排；特征工程；A/B测试 |

---

## 总结

推荐系统是一个综合性很强的领域，涉及机器学习、深度学习、分布式系统等多个技术方向。本文介绍了推荐系统的核心算法和实践技巧：

1. **协同过滤**是推荐系统的基石，包括基于用户、基于物品和矩阵分解三种主要方法
2. **基于内容的推荐**通过分析物品特征进行推荐，能有效解决冷启动问题
3. **深度学习推荐**能够自动学习复杂的特征交互，是当前工业界的主流方案
4. **评估指标**需要从多个维度衡量推荐效果，包括准确性、多样性和新颖性
5. **工业实践**采用召回-精排-重排的架构，配合实时特征和A/B测试持续优化

掌握这些知识，你将能够设计和构建高效的个性化推荐服务，为用户提供更好的体验。

## 参考资源

- [Recommender Systems Handbook](https://link.springer.com/book/10.1007/978-1-0716-2197-4)
- [Deep Learning for Recommender Systems](https://dl.acm.org/doi/10.1145/3285029)
- [Google Recommendations AI](https://cloud.google.com/recommendations)
- [Netflix Tech Blog - Recommendations](https://netflixtechblog.com/)
