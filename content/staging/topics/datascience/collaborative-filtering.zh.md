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
origin: old/src/content/docs/datascience/collaborative-filtering.zh.md
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

推荐系统已成为现代数字体验中不可或缺的一部分，为 Netflix、Amazon、Spotify 和 YouTube 等平台提供个性化推荐。在构建推荐系统的各种方法中，协同过滤（Collaborative Filtering，简称 CF）是最成功和应用最广泛的技术之一。本综合指南涵盖推荐系统的基础知识、深入探讨基于用户和基于物品的协同过滤、探索相似度计算方法、研究矩阵分解技术，并提供实际的实现示例。

## 推荐系统概述

### 什么是推荐系统？

推荐系统是一种信息过滤系统，用于预测用户对尚未交互的物品的偏好或评分。其目标是帮助用户从大量选项中发现相关内容，减少信息过载并改善用户体验。

**核心组件：**
- **用户**：与系统交互的个体
- **物品**：被推荐的产品、内容或服务
- **交互**：用户行为，如评分、购买、点击或浏览
- **推荐引擎**：生成预测的算法

### 推荐系统的类型

| 方法 | 描述 | 优势 | 劣势 |
|----------|-------------|-----------|------------|
| **协同过滤** | 利用集体用户行为模式 | 发现潜在特征，无需内容分析 | 冷启动问题，稀疏性 |
| **基于内容** | 利用物品属性和用户偏好 | 对新物品有效，推荐透明 | 发现能力有限，需要丰富的内容元数据 |
| **混合方法** | 结合多种方法 | 缓解单一方法的缺点 | 复杂度增加 |
| **基于知识** | 使用显式领域知识 | 处理复杂需求 | 需要广泛的领域专业知识 |

### 协同过滤的理念

协同过滤基于一个简单但强大的假设：**过去意见一致的用户在未来也会意见一致**。如果用户 A 和用户 B 都喜欢电影 X 和 Y，而用户 A 还喜欢电影 Z，那么用户 B 很可能也会喜欢电影 Z。

```python
import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.metrics.pairwise import cosine_similarity

# 示例：用户-物品交互矩阵
# 行 = 用户，列 = 物品，值 = 评分（0 = 未评分）
ratings_matrix = np.array([
    [5, 3, 0, 1, 4],  # 用户 0
    [4, 0, 0, 1, 0],  # 用户 1
    [1, 1, 0, 5, 4],  # 用户 2
    [0, 0, 5, 4, 0],  # 用户 3
    [0, 1, 5, 4, 0],  # 用户 4
])

users = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve']
items = ['Item_A', 'Item_B', 'Item_C', 'Item_D', 'Item_E']

df = pd.DataFrame(ratings_matrix, index=users, columns=items)
print("用户-物品评分矩阵：")
print(df)
```

### 显式反馈 vs 隐式反馈

**显式反馈：**
- 用户直接输入：评分、喜欢/不喜欢、评论
- 明确表示偏好
- 通常较稀疏（用户只对少数物品评分）
- 例如：5 星评分、点赞/点踩

**隐式反馈：**
- 从用户行为推断：浏览、点击、购买、停留时间
- 数据更丰富但噪声更大
- 仅表示正向偏好（缺失是模糊的）
- 例如：购买历史、观看时长、页面浏览

```python
# 显式反馈示例
explicit_ratings = pd.DataFrame({
    'user_id': [1, 1, 2, 2, 3],
    'item_id': ['A', 'B', 'A', 'C', 'B'],
    'rating': [5, 3, 4, 2, 5]  # 直接评分
})

# 隐式反馈示例
implicit_interactions = pd.DataFrame({
    'user_id': [1, 1, 1, 2, 2, 3, 3, 3],
    'item_id': ['A', 'A', 'B', 'A', 'C', 'B', 'B', 'D'],
    'event_type': ['view', 'purchase', 'view', 'view', 'view', 'view', 'purchase', 'view'],
    'timestamp': pd.date_range('2024-01-01', periods=8, freq='H')
})

# 将隐式反馈转换为置信度分数
def compute_confidence(df, weights={'view': 1, 'purchase': 5}):
    """将隐式交互转换为置信度分数。"""
    df['weight'] = df['event_type'].map(weights)
    confidence = df.groupby(['user_id', 'item_id'])['weight'].sum().unstack(fill_value=0)
    return confidence

confidence_matrix = compute_confidence(implicit_interactions)
print("隐式置信度矩阵：")
print(confidence_matrix)
```

---

## 基于用户的协同过滤

基于用户的协同过滤（User-CF）通过找到相似用户并推荐这些相似用户喜欢的物品来进行推荐。它基于这样的原则：过去有相似品味的用户将来也会有相似的品味。

### 算法概述

**步骤：**
1. 构建用户-物品交互矩阵
2. 计算所有用户对之间的相似度
3. 对于目标用户，找到 k 个最相似的用户（邻居）
4. 根据邻居的评分预测未评分物品的评分
5. 推荐预测评分最高的前 N 个物品

```python
class UserBasedCF:
    """基于用户的协同过滤实现。"""

    def __init__(self, k_neighbors=5, similarity_metric='cosine'):
        self.k = k_neighbors
        self.similarity_metric = similarity_metric
        self.user_similarity = None
        self.ratings_matrix = None
        self.user_means = None

    def fit(self, ratings_matrix):
        """
        用用户-物品评分矩阵拟合模型。

        参数：
        -----------
        ratings_matrix : np.ndarray
            用户-物品矩阵，行是用户，列是物品。
            0 表示未评分。
        """
        self.ratings_matrix = ratings_matrix.copy()

        # 计算用户平均评分（排除零值）
        masked = np.ma.masked_equal(ratings_matrix, 0)
        self.user_means = np.array(masked.mean(axis=1)).flatten()

        # 对评分进行均值中心化以计算相似度
        ratings_centered = ratings_matrix.copy().astype(float)
        for i in range(ratings_matrix.shape[0]):
            mask = ratings_matrix[i] != 0
            ratings_centered[i, mask] -= self.user_means[i]
            ratings_centered[i, ~mask] = 0

        # 计算用户相似度矩阵
        if self.similarity_metric == 'cosine':
            self.user_similarity = cosine_similarity(ratings_centered)
        elif self.similarity_metric == 'pearson':
            self.user_similarity = np.corrcoef(ratings_centered)
            self.user_similarity = np.nan_to_num(self.user_similarity)

        # 将自身相似度设为 0 以从邻居中排除
        np.fill_diagonal(self.user_similarity, 0)

        return self

    def predict(self, user_idx, item_idx):
        """
        预测特定用户-物品对的评分。

        返回相似用户评分的加权平均值。
        """
        # 获取评分过该物品的 k 个最相似用户
        similarities = self.user_similarity[user_idx].copy()

        # 只考虑评分过该物品的用户
        rated_mask = self.ratings_matrix[:, item_idx] != 0
        similarities[~rated_mask] = 0

        # 获取前 k 个邻居
        top_k_idx = np.argsort(similarities)[-self.k:]
        top_k_sim = similarities[top_k_idx]

        if np.sum(np.abs(top_k_sim)) == 0:
            return self.user_means[user_idx]

        # 加权平均预测
        neighbor_ratings = self.ratings_matrix[top_k_idx, item_idx]
        neighbor_means = self.user_means[top_k_idx]

        # 调整后的评分（均值中心化）
        adjusted_ratings = neighbor_ratings - neighbor_means

        prediction = self.user_means[user_idx] + \
                     np.dot(top_k_sim, adjusted_ratings) / np.sum(np.abs(top_k_sim))

        return np.clip(prediction, 1, 5)  # 裁剪到有效评分范围

    def recommend(self, user_idx, n_recommendations=5):
        """
        为用户生成前 N 个推荐。
        """
        predictions = []
        for item_idx in range(self.ratings_matrix.shape[1]):
            # 只预测未评分的物品
            if self.ratings_matrix[user_idx, item_idx] == 0:
                pred = self.predict(user_idx, item_idx)
                predictions.append((item_idx, pred))

        # 按预测评分排序并返回前 N 个
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:n_recommendations]


# 使用示例
ratings = np.array([
    [5, 3, 0, 1, 4],
    [4, 0, 0, 1, 0],
    [1, 1, 0, 5, 4],
    [0, 0, 5, 4, 0],
    [0, 1, 5, 4, 0],
])

model = UserBasedCF(k_neighbors=3)
model.fit(ratings)

# 获取用户 1（Bob）的推荐
recommendations = model.recommend(user_idx=1, n_recommendations=3)
print(f"Bob 的推荐：{recommendations}")
```

### 预测公式

用户 $u$ 对物品 $i$ 的预测评分 $\hat{r}_{ui}$ 计算如下：

$$\hat{r}_{ui} = \bar{r}_u + \frac{\sum_{v \in N(u)} sim(u, v) \cdot (r_{vi} - \bar{r}_v)}{\sum_{v \in N(u)} |sim(u, v)|}$$

其中：
- $\bar{r}_u$ 是用户 $u$ 的平均评分
- $N(u)$ 是用户 $u$ 的 k 个最近邻居中评分过物品 $i$ 的集合
- $sim(u, v)$ 是用户 $u$ 和 $v$ 之间的相似度
- $r_{vi}$ 是用户 $v$ 给物品 $i$ 的评分

### 优缺点

**优点：**
- 直观易于解释
- 能发现意想不到的兴趣
- 不需要物品内容信息
- 当用户-物品矩阵稠密时效果好

**缺点：**
- 扩展性差（O(n^2) 用户比较）
- 对稀疏数据敏感
- 新用户没有历史记录（冷启动）
- 用户偏好可能随时间变化

---

## 基于物品的协同过滤

基于物品的协同过滤（Item-CF）采用不同的方法：不是找相似用户，而是找相似物品。它推荐与用户已经喜欢的物品相似的物品。

### 算法概述

**步骤：**
1. 构建用户-物品交互矩阵
2. 计算所有物品对之间的相似度
3. 对于用户评分过的每个物品，找到 k 个最相似的物品
4. 根据用户对相似物品的评分预测评分
5. 推荐预测评分最高的前 N 个物品

```python
class ItemBasedCF:
    """基于物品的协同过滤实现。"""

    def __init__(self, k_neighbors=5, similarity_metric='cosine'):
        self.k = k_neighbors
        self.similarity_metric = similarity_metric
        self.item_similarity = None
        self.ratings_matrix = None

    def fit(self, ratings_matrix):
        """
        用用户-物品评分矩阵拟合模型。

        参数：
        -----------
        ratings_matrix : np.ndarray
            用户-物品矩阵，行是用户，列是物品。
        """
        self.ratings_matrix = ratings_matrix.copy()

        # 转置：现在行是物品，列是用户
        item_matrix = ratings_matrix.T.astype(float)

        # 对每个物品的评分进行均值中心化
        item_centered = item_matrix.copy()
        for i in range(item_matrix.shape[0]):
            mask = item_matrix[i] != 0
            if np.sum(mask) > 0:
                mean_rating = np.mean(item_matrix[i, mask])
                item_centered[i, mask] -= mean_rating
                item_centered[i, ~mask] = 0

        # 计算物品相似度矩阵
        if self.similarity_metric == 'cosine':
            self.item_similarity = cosine_similarity(item_centered)
        elif self.similarity_metric == 'adjusted_cosine':
            # 调整余弦：按用户均值中心化而非物品均值
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

        # 将自身相似度设为 0
        np.fill_diagonal(self.item_similarity, 0)

        return self

    def predict(self, user_idx, item_idx):
        """
        预测特定用户-物品对的评分。
        """
        # 获取目标物品与所有其他物品的相似度
        similarities = self.item_similarity[item_idx].copy()

        # 只考虑用户评分过的物品
        user_ratings = self.ratings_matrix[user_idx]
        rated_mask = user_ratings != 0
        similarities[~rated_mask] = 0

        # 获取用户评分过的前 k 个相似物品
        top_k_idx = np.argsort(similarities)[-self.k:]
        top_k_sim = similarities[top_k_idx]

        if np.sum(np.abs(top_k_sim)) == 0:
            # 回退到用户平均评分
            user_rated = user_ratings[user_ratings != 0]
            return np.mean(user_rated) if len(user_rated) > 0 else 3.0

        # 加权平均预测
        neighbor_ratings = user_ratings[top_k_idx]
        prediction = np.dot(top_k_sim, neighbor_ratings) / np.sum(np.abs(top_k_sim))

        return np.clip(prediction, 1, 5)

    def recommend(self, user_idx, n_recommendations=5):
        """
        为用户生成前 N 个推荐。
        """
        predictions = []
        for item_idx in range(self.ratings_matrix.shape[1]):
            if self.ratings_matrix[user_idx, item_idx] == 0:
                pred = self.predict(user_idx, item_idx)
                predictions.append((item_idx, pred))

        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:n_recommendations]


# 使用示例
item_cf = ItemBasedCF(k_neighbors=3, similarity_metric='adjusted_cosine')
item_cf.fit(ratings)

# 获取用户 1（Bob）的推荐
recommendations = item_cf.recommend(user_idx=1, n_recommendations=3)
print(f"Bob 的推荐（Item-CF）：{recommendations}")
```

### 预测公式

用户 $u$ 对物品 $i$ 的预测评分 $\hat{r}_{ui}$ 为：

$$\hat{r}_{ui} = \frac{\sum_{j \in N(i)} sim(i, j) \cdot r_{uj}}{\sum_{j \in N(i)} |sim(i, j)|}$$

其中：
- $N(i)$ 是用户 $u$ 评分过的与物品 $i$ 最相似的 k 个物品集合
- $sim(i, j)$ 是物品 $i$ 和 $j$ 之间的相似度
- $r_{uj}$ 是用户 $u$ 给物品 $j$ 的评分

### User-CF vs Item-CF 比较

| 方面 | 基于用户的 CF | 基于物品的 CF |
|--------|---------------|---------------|
| **计算** | 比较用户 | 比较物品 |
| **可扩展性** | 物品数 >> 用户数时更好 | 用户数 >> 物品数时更好 |
| **稳定性** | 较不稳定（用户偏好会变化） | 更稳定（物品特征固定） |
| **更新频率** | 新用户时需重新计算 | 相似度可预计算 |
| **使用场景** | 新闻、动态内容 | 电商、电影 |
| **Amazon 的选择** | - | 为了可扩展性采用 Item-CF |

---

## 相似度计算

相似度度量的选择对推荐质量有显著影响。不同的度量捕捉用户或物品相似性的不同方面。

### 余弦相似度

测量两个向量之间角度的余弦值：

$$sim(u, v) = \frac{\vec{u} \cdot \vec{v}}{||\vec{u}|| \cdot ||\vec{v}||} = \frac{\sum_i r_{ui} \cdot r_{vi}}{\sqrt{\sum_i r_{ui}^2} \cdot \sqrt{\sum_i r_{vi}^2}}$$

```python
def cosine_sim(vec1, vec2):
    """
    计算两个向量之间的余弦相似度。
    """
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return dot_product / (norm1 * norm2)

# 示例
user1 = np.array([5, 3, 0, 1, 4])
user2 = np.array([4, 0, 0, 1, 0])

# 只考虑共同评分的物品
mask = (user1 != 0) & (user2 != 0)
sim = cosine_sim(user1[mask], user2[mask])
print(f"余弦相似度：{sim:.4f}")
```

### 皮尔逊相关系数

测量两个向量之间的线性相关性，考虑评分尺度差异：

$$sim(u, v) = \frac{\sum_i (r_{ui} - \bar{r}_u)(r_{vi} - \bar{r}_v)}{\sqrt{\sum_i (r_{ui} - \bar{r}_u)^2} \cdot \sqrt{\sum_i (r_{vi} - \bar{r}_v)^2}}$$

```python
def pearson_correlation(vec1, vec2):
    """
    计算两个向量之间的皮尔逊相关系数。
    只考虑共同评分的物品。
    """
    # 找到共同评分的物品
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

# 示例
sim = pearson_correlation(user1, user2)
print(f"皮尔逊相关系数：{sim:.4f}")
```

### 调整余弦相似度

用于基于物品的 CF，考虑用户评分尺度差异：

$$sim(i, j) = \frac{\sum_{u \in U} (r_{ui} - \bar{r}_u)(r_{uj} - \bar{r}_u)}{\sqrt{\sum_{u \in U} (r_{ui} - \bar{r}_u)^2} \cdot \sqrt{\sum_{u \in U} (r_{uj} - \bar{r}_u)^2}}$$

```python
def adjusted_cosine_similarity(ratings_matrix):
    """
    计算物品之间的调整余弦相似度。

    参数：
    -----------
    ratings_matrix : np.ndarray
        用户-物品矩阵（用户 x 物品）

    返回：
    --------
    np.ndarray : 物品相似度矩阵（物品 x 物品）
    """
    n_users, n_items = ratings_matrix.shape

    # 计算用户均值（仅来自已评分物品）
    user_means = np.zeros(n_users)
    for u in range(n_users):
        rated = ratings_matrix[u, ratings_matrix[u] != 0]
        user_means[u] = np.mean(rated) if len(rated) > 0 else 0

    # 从评分中减去用户均值
    adjusted = ratings_matrix.copy().astype(float)
    for u in range(n_users):
        mask = ratings_matrix[u] != 0
        adjusted[u, mask] -= user_means[u]
        adjusted[u, ~mask] = 0

    # 计算物品相似度
    item_sim = np.zeros((n_items, n_items))

    for i in range(n_items):
        for j in range(i, n_items):
            # 同时评分两个物品的用户
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

# 示例
item_sim_matrix = adjusted_cosine_similarity(ratings)
print("调整余弦相似度矩阵：")
print(pd.DataFrame(item_sim_matrix, index=items, columns=items).round(3))
```

### 杰卡德相似度

用于二值（隐式）反馈，测量集合之间的重叠：

$$sim(u, v) = \frac{|I_u \cap I_v|}{|I_u \cup I_v|}$$

```python
def jaccard_similarity(set1, set2):
    """
    计算两个集合之间的杰卡德相似度。
    """
    intersection = len(set1 & set2)
    union = len(set1 | set2)

    return intersection / union if union > 0 else 0

# 示例：用户购买的物品
user1_items = {'A', 'B', 'D', 'E'}
user2_items = {'A', 'D', 'F'}

sim = jaccard_similarity(user1_items, user2_items)
print(f"杰卡德相似度：{sim:.4f}")
```

### 相似度度量比较

| 度量 | 最适用于 | 处理评分尺度 | 稀疏性鲁棒性 |
|--------|----------|---------------------|-----------------|
| **余弦** | 通用 | 否 | 中等 |
| **皮尔逊** | 评分尺度不同的用户 | 是 | 低 |
| **调整余弦** | 基于物品的 CF | 是 | 中等 |
| **杰卡德** | 二值/隐式反馈 | 不适用 | 高 |

---

## 矩阵分解

矩阵分解技术将稀疏的用户-物品矩阵分解为低维的潜在因子矩阵。这种方法捕捉解释用户偏好和物品特征的隐藏特征。

### 概念与直觉

其思想是在 k 维的共享潜在空间中表示用户和物品：

$$R \approx U \cdot V^T$$

其中：
- $R$ 是 $m \times n$ 的用户-物品评分矩阵
- $U$ 是 $m \times k$ 的用户潜在因子矩阵
- $V$ 是 $n \times k$ 的物品潜在因子矩阵
- $k$ 是潜在因子数量（通常为 10-200）

每个潜在因子可能代表抽象概念，如电影的"动作片 vs 爱情片"或"主流 vs 独立"。

```python
import numpy as np

# 潜在因子的概念说明
# 用户因子：每个用户与每个潜在因子的对齐程度
user_factors = np.array([
    [0.8, 0.2],  # 用户 0：喜欢动作片（因子 1），不喜欢爱情片（因子 2）
    [0.3, 0.9],  # 用户 1：更喜欢爱情片
    [0.6, 0.5],  # 用户 2：均衡
])

# 物品因子：每个物品代表每个潜在因子的程度
item_factors = np.array([
    [0.9, 0.1],  # 物品 A：动作电影
    [0.2, 0.8],  # 物品 B：爱情电影
    [0.5, 0.5],  # 物品 C：动作-爱情混合
])

# 预测评分 = 用户和物品因子的点积
predicted_ratings = np.dot(user_factors, item_factors.T)
print("预测评分矩阵：")
print(pd.DataFrame(
    predicted_ratings.round(2),
    index=['用户_0', '用户_1', '用户_2'],
    columns=['动作片', '爱情片', '混合片']
))
```

### 奇异值分解（SVD）

SVD 将矩阵分解为三个部分：

$$R = U \Sigma V^T$$

其中 $\Sigma$ 是奇异值的对角矩阵。

```python
from scipy.sparse.linalg import svds

def svd_recommendations(ratings_matrix, k=2):
    """
    执行基于 SVD 的矩阵分解。

    参数：
    -----------
    ratings_matrix : np.ndarray
        用户-物品矩阵
    k : int
        潜在因子数量

    返回：
    --------
    np.ndarray : 预测评分矩阵
    """
    # 用列均值填充缺失值以进行 SVD
    ratings_filled = ratings_matrix.copy().astype(float)
    col_means = np.nanmean(np.where(ratings_matrix == 0, np.nan, ratings_matrix), axis=0)
    col_means = np.nan_to_num(col_means, nan=0)

    for j in range(ratings_filled.shape[1]):
        ratings_filled[ratings_filled[:, j] == 0, j] = col_means[j]

    # 执行 SVD
    U, sigma, Vt = svds(ratings_filled, k=k)

    # 重建矩阵
    sigma_diag = np.diag(sigma)
    predicted = np.dot(np.dot(U, sigma_diag), Vt)

    return predicted


# 示例
predicted = svd_recommendations(ratings, k=2)
print("\nSVD 预测评分：")
print(pd.DataFrame(predicted.round(2), index=users, columns=items))
```

### 交替最小二乘法（ALS）

ALS 对隐式反馈特别有效，并且能很好地扩展到大型数据集。它交替固定用户因子并优化物品因子，然后反过来。

**目标函数：**

$$\min_{U, V} \sum_{(u,i) \in K} (r_{ui} - u_u^T v_i)^2 + \lambda (||U||^2 + ||V||^2)$$

其中 $\lambda$ 是正则化参数。

```python
class ALSRecommender:
    """
    交替最小二乘矩阵分解。
    """

    def __init__(self, n_factors=10, regularization=0.1, n_iterations=20):
        self.n_factors = n_factors
        self.reg = regularization
        self.n_iter = n_iterations
        self.user_factors = None
        self.item_factors = None

    def fit(self, ratings_matrix):
        """
        拟合 ALS 模型。

        参数：
        -----------
        ratings_matrix : np.ndarray
            用户-物品评分矩阵
        """
        n_users, n_items = ratings_matrix.shape

        # 随机初始化因子矩阵
        np.random.seed(42)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))

        # 创建观察到的评分掩码
        mask = ratings_matrix != 0

        for iteration in range(self.n_iter):
            # 固定物品，求解用户
            self._update_users(ratings_matrix, mask)

            # 固定用户，求解物品
            self._update_items(ratings_matrix, mask)

            # 计算 RMSE 以监控
            if (iteration + 1) % 5 == 0:
                rmse = self._compute_rmse(ratings_matrix, mask)
                print(f"迭代 {iteration + 1}，RMSE：{rmse:.4f}")

        return self

    def _update_users(self, ratings, mask):
        """固定物品因子更新用户因子。"""
        n_users = ratings.shape[0]

        for u in range(n_users):
            # 用户 u 评分过的物品
            rated_items = mask[u]
            if not np.any(rated_items):
                continue

            V_u = self.item_factors[rated_items]  # 用户评分过的物品
            r_u = ratings[u, rated_items]  # 用户的评分

            # 求解：(V^T V + lambda*I) * x = V^T * r
            A = V_u.T @ V_u + self.reg * np.eye(self.n_factors)
            b = V_u.T @ r_u
            self.user_factors[u] = np.linalg.solve(A, b)

    def _update_items(self, ratings, mask):
        """固定用户因子更新物品因子。"""
        n_items = ratings.shape[1]

        for i in range(n_items):
            # 评分过物品 i 的用户
            rating_users = mask[:, i]
            if not np.any(rating_users):
                continue

            U_i = self.user_factors[rating_users]
            r_i = ratings[rating_users, i]

            A = U_i.T @ U_i + self.reg * np.eye(self.n_factors)
            b = U_i.T @ r_i
            self.item_factors[i] = np.linalg.solve(A, b)

    def _compute_rmse(self, ratings, mask):
        """计算观察到的评分的 RMSE。"""
        predictions = self.user_factors @ self.item_factors.T
        errors = (ratings - predictions)[mask]
        return np.sqrt(np.mean(errors ** 2))

    def predict(self, user_idx, item_idx):
        """预测用户-物品对的评分。"""
        return np.dot(self.user_factors[user_idx], self.item_factors[item_idx])

    def recommend(self, user_idx, n_recommendations=5, exclude_rated=True):
        """为用户生成推荐。"""
        scores = self.user_factors[user_idx] @ self.item_factors.T

        if exclude_rated:
            # 将已评分物品的分数设为 -inf
            rated_items = np.where(ratings[user_idx] != 0)[0]
            scores[rated_items] = -np.inf

        top_items = np.argsort(scores)[::-1][:n_recommendations]
        return [(idx, scores[idx]) for idx in top_items]


# 使用示例
als = ALSRecommender(n_factors=3, regularization=0.1, n_iterations=20)
als.fit(ratings)

print("\nALS 推荐给 Bob：")
recs = als.recommend(user_idx=1, n_recommendations=3)
for item_idx, score in recs:
    print(f"  {items[item_idx]}：{score:.3f}")
```

### 隐式反馈的 ALS

对于隐式反馈，我们修改 ALS 以使用置信度权重：

$$\min_{U, V} \sum_{u,i} c_{ui}(p_{ui} - u_u^T v_i)^2 + \lambda (||U||^2 + ||V||^2)$$

其中：
- $p_{ui} = 1$ 如果用户 $u$ 与物品 $i$ 交互过，否则为 $0$
- $c_{ui} = 1 + \alpha \cdot r_{ui}$ 是对偏好的置信度

```python
class ImplicitALS:
    """
    隐式反馈数据的 ALS。
    基于"Collaborative Filtering for Implicit Feedback Datasets"（Hu 等，2008）
    """

    def __init__(self, n_factors=40, regularization=0.1, alpha=40, n_iterations=15):
        self.n_factors = n_factors
        self.reg = regularization
        self.alpha = alpha  # 置信度缩放因子
        self.n_iter = n_iterations

    def fit(self, interaction_matrix):
        """
        在隐式反馈数据上拟合模型。

        参数：
        -----------
        interaction_matrix : np.ndarray
            用户-物品交互计数（例如，播放次数、浏览次数）
        """
        n_users, n_items = interaction_matrix.shape

        # 二值偏好矩阵
        P = (interaction_matrix > 0).astype(float)

        # 置信度矩阵：C = 1 + alpha * 交互次数
        C = 1 + self.alpha * interaction_matrix

        # 初始化因子
        np.random.seed(42)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))

        for iteration in range(self.n_iter):
            # 更新用户
            self._update_users_implicit(P, C)
            # 更新物品
            self._update_items_implicit(P, C)

            if (iteration + 1) % 5 == 0:
                loss = self._compute_loss(P, C)
                print(f"迭代 {iteration + 1}，损失：{loss:.4f}")

        return self

    def _update_users_implicit(self, P, C):
        """更新隐式反馈的用户因子。"""
        VTV = self.item_factors.T @ self.item_factors
        reg_I = self.reg * np.eye(self.n_factors)

        for u in range(P.shape[0]):
            # 用户 u 的对角置信度矩阵
            C_u = np.diag(C[u])

            # (V^T C_u V + reg*I)^-1 V^T C_u p_u
            A = self.item_factors.T @ C_u @ self.item_factors + reg_I
            b = self.item_factors.T @ C_u @ P[u]
            self.user_factors[u] = np.linalg.solve(A, b)

    def _update_items_implicit(self, P, C):
        """更新隐式反馈的物品因子。"""
        UTU = self.user_factors.T @ self.user_factors
        reg_I = self.reg * np.eye(self.n_factors)

        for i in range(P.shape[1]):
            C_i = np.diag(C[:, i])

            A = self.user_factors.T @ C_i @ self.user_factors + reg_I
            b = self.user_factors.T @ C_i @ P[:, i]
            self.item_factors[i] = np.linalg.solve(A, b)

    def _compute_loss(self, P, C):
        """计算加权损失。"""
        predictions = self.user_factors @ self.item_factors.T
        weighted_errors = C * (P - predictions) ** 2
        reg_term = self.reg * (
            np.sum(self.user_factors ** 2) + np.sum(self.item_factors ** 2)
        )
        return np.sum(weighted_errors) + reg_term

    def recommend(self, user_idx, n_recommendations=10):
        """生成推荐。"""
        scores = self.user_factors[user_idx] @ self.item_factors.T
        top_items = np.argsort(scores)[::-1][:n_recommendations]
        return [(idx, scores[idx]) for idx in top_items]
```

### 随机梯度下降（SGD）方法

SGD 是另一种优化方法，在每个观察到的评分后更新参数：

```python
class SGDMatrixFactorization:
    """
    使用随机梯度下降的矩阵分解。
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
        使用 SGD 拟合模型。
        """
        n_users, n_items = ratings_matrix.shape

        # 初始化参数
        np.random.seed(42)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))

        if self.use_bias:
            self.global_mean = np.mean(ratings_matrix[ratings_matrix != 0])
            self.user_bias = np.zeros(n_users)
            self.item_bias = np.zeros(n_items)

        # 获取观察到的评分
        users, items = np.where(ratings_matrix != 0)
        ratings = ratings_matrix[users, items]

        for epoch in range(self.n_epochs):
            # 打乱训练数据
            indices = np.random.permutation(len(ratings))

            for idx in indices:
                u, i, r = users[idx], items[idx], ratings[idx]

                # 计算预测
                pred = self._predict_single(u, i)
                error = r - pred

                # 更新偏置
                if self.use_bias:
                    self.user_bias[u] += self.lr * (error - self.reg * self.user_bias[u])
                    self.item_bias[i] += self.lr * (error - self.reg * self.item_bias[i])

                # 更新潜在因子
                user_factor = self.user_factors[u].copy()
                self.user_factors[u] += self.lr * (
                    error * self.item_factors[i] - self.reg * self.user_factors[u]
                )
                self.item_factors[i] += self.lr * (
                    error * user_factor - self.reg * self.item_factors[i]
                )

            # 计算训练 RMSE
            if (epoch + 1) % 5 == 0:
                rmse = self._compute_rmse(ratings_matrix)
                print(f"轮次 {epoch + 1}，RMSE：{rmse:.4f}")

        return self

    def _predict_single(self, u, i):
        """预测单个评分。"""
        pred = np.dot(self.user_factors[u], self.item_factors[i])
        if self.use_bias:
            pred += self.global_mean + self.user_bias[u] + self.item_bias[i]
        return pred

    def _compute_rmse(self, ratings_matrix):
        """计算观察到的评分的 RMSE。"""
        users, items = np.where(ratings_matrix != 0)
        predictions = np.array([self._predict_single(u, i) for u, i in zip(users, items)])
        actuals = ratings_matrix[users, items]
        return np.sqrt(np.mean((predictions - actuals) ** 2))

    def predict(self, user_idx, item_idx):
        """预测评分。"""
        return self._predict_single(user_idx, item_idx)

    def recommend(self, user_idx, n_recommendations=5, ratings_matrix=None):
        """生成推荐。"""
        n_items = self.item_factors.shape[0]
        scores = np.array([self._predict_single(user_idx, i) for i in range(n_items)])

        if ratings_matrix is not None:
            # 排除已评分的物品
            scores[ratings_matrix[user_idx] != 0] = -np.inf

        top_items = np.argsort(scores)[::-1][:n_recommendations]
        return [(idx, scores[idx]) for idx in top_items]


# 示例
sgd_mf = SGDMatrixFactorization(n_factors=5, learning_rate=0.01, n_epochs=50)
sgd_mf.fit(ratings)

print("\nSGD-MF 推荐给 Bob：")
recs = sgd_mf.recommend(user_idx=1, n_recommendations=3, ratings_matrix=ratings)
for item_idx, score in recs:
    print(f"  {items[item_idx]}：{score:.3f}")
```

---

## 处理隐式反馈

隐式反馈需要特殊处理，因为我们只观察到正向信号（交互），没有明确的负向信号。

### 隐式数据的挑战

**与显式反馈的主要区别：**
- 没有负反馈：没有交互是模糊的
- 置信度变化：一次购买与 100 次播放不同
- 没有评分尺度：交互通常是二值或基于计数的
- 数据更多但信号更嘈杂

### 置信度加权

```python
def create_implicit_dataset(interactions_df, alpha=40):
    """
    将交互计数转换为偏好和置信度矩阵。

    参数：
    -----------
    interactions_df : pd.DataFrame
        包含 'user_id'、'item_id'、'interaction_count' 的 DataFrame
    alpha : float
        置信度缩放因子

    返回：
    --------
    tuple : (偏好矩阵, 置信度矩阵)
    """
    # 创建交互的数据透视表
    interaction_matrix = interactions_df.pivot_table(
        index='user_id',
        columns='item_id',
        values='interaction_count',
        fill_value=0
    )

    # 二值偏好：有交互为 1，否则为 0
    P = (interaction_matrix > 0).astype(int).values

    # 置信度：交互越多越高
    # C = 1 + alpha * log(1 + interactions / epsilon)
    C = 1 + alpha * np.log1p(interaction_matrix.values)

    return P, C, interaction_matrix.index, interaction_matrix.columns

# 示例
implicit_df = pd.DataFrame({
    'user_id': [0, 0, 0, 1, 1, 2, 2, 2, 2],
    'item_id': [0, 1, 2, 0, 3, 1, 2, 3, 4],
    'interaction_count': [5, 1, 10, 3, 2, 1, 15, 8, 4]
})

P, C, users, items = create_implicit_dataset(implicit_df, alpha=40)
print("偏好矩阵 P：")
print(P)
print("\n置信度矩阵 C：")
print(C.round(1))
```

### 贝叶斯个性化排序（BPR）

BPR 专门为隐式反馈设计，优化物品的排序：

```python
class BPRMatrixFactorization:
    """
    隐式反馈的贝叶斯个性化排序。
    优化：用户偏好正样本物品而非负样本物品。
    """

    def __init__(self, n_factors=10, learning_rate=0.05, regularization=0.01,
                 n_epochs=100):
        self.n_factors = n_factors
        self.lr = learning_rate
        self.reg = regularization
        self.n_epochs = n_epochs

    def fit(self, interaction_matrix, n_negative_samples=5):
        """
        拟合 BPR 模型。

        参数：
        -----------
        interaction_matrix : np.ndarray
            二值用户-物品交互矩阵
        n_negative_samples : int
            每个正样本的负样本数量
        """
        n_users, n_items = interaction_matrix.shape

        # 初始化因子
        np.random.seed(42)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))

        # 获取正交互
        positive_users, positive_items = np.where(interaction_matrix > 0)
        n_positive = len(positive_users)

        for epoch in range(self.n_epochs):
            total_loss = 0

            # 打乱正样本
            indices = np.random.permutation(n_positive)

            for idx in indices:
                u = positive_users[idx]
                i = positive_items[idx]  # 正样本物品

                # 采样负样本物品
                negative_items = np.where(interaction_matrix[u] == 0)[0]
                if len(negative_items) == 0:
                    continue

                # 随机负样本
                j = np.random.choice(negative_items)

                # 计算 x_uij = x_ui - x_uj
                x_ui = np.dot(self.user_factors[u], self.item_factors[i])
                x_uj = np.dot(self.user_factors[u], self.item_factors[j])
                x_uij = x_ui - x_uj

                # Sigmoid 梯度
                sigmoid = 1 / (1 + np.exp(x_uij))

                # 更新因子
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

                # BPR 损失：-ln(sigmoid(x_uij))
                total_loss += -np.log(1 / (1 + np.exp(-x_uij)) + 1e-10)

            if (epoch + 1) % 20 == 0:
                print(f"轮次 {epoch + 1}，损失：{total_loss / n_positive:.4f}")

        return self

    def recommend(self, user_idx, n_recommendations=10):
        """生成推荐。"""
        scores = self.user_factors[user_idx] @ self.item_factors.T
        top_items = np.argsort(scores)[::-1][:n_recommendations]
        return [(idx, scores[idx]) for idx in top_items]
```

---

## 冷启动问题

冷启动问题是协同过滤中最重要的挑战之一，当系统没有足够的数据来做出准确的推荐时就会发生。

### 冷启动的类型

| 类型 | 描述 | 挑战 |
|------|-------------|-----------|
| **新用户** | 用户没有交互历史 | 无法找到相似用户或学习偏好 |
| **新物品** | 物品没有评分/交互 | 无法计算物品相似度 |
| **新系统** | 整个系统是新的 | 没有协同信号可用 |

### 新用户的解决方案

```python
class HybridCFWithContentFallback:
    """
    对冷启动用户回退到基于内容的混合推荐器。
    """

    def __init__(self, cf_model, item_features, min_interactions=5):
        self.cf_model = cf_model
        self.item_features = item_features  # 物品内容特征
        self.min_interactions = min_interactions

    def recommend(self, user_idx, user_profile=None, n_recommendations=10,
                  interaction_count=0):
        """
        生成带有冷启动处理的推荐。

        参数：
        -----------
        user_idx : int
            用户索引
        user_profile : dict
            可选的用户画像，用于基于内容的回退
        n_recommendations : int
            推荐数量
        interaction_count : int
            该用户的交互次数
        """
        if interaction_count >= self.min_interactions:
            # 数据充足：使用 CF
            return self.cf_model.recommend(user_idx, n_recommendations)
        else:
            # 冷启动：使用基于内容或热门推荐
            return self._content_based_recommend(user_profile, n_recommendations)

    def _content_based_recommend(self, user_profile, n_recommendations):
        """
        冷启动用户的基于内容推荐。
        """
        if user_profile is None:
            # 回退到基于热门度的推荐
            return self._popularity_based(n_recommendations)

        # 计算用户画像与物品之间的相似度
        from sklearn.metrics.pairwise import cosine_similarity

        user_vector = np.array(list(user_profile.values())).reshape(1, -1)
        similarities = cosine_similarity(user_vector, self.item_features).flatten()

        top_items = np.argsort(similarities)[::-1][:n_recommendations]
        return [(idx, similarities[idx]) for idx in top_items]

    def _popularity_based(self, n_recommendations):
        """
        基于热门度的回退。
        """
        # 返回最热门的物品（预计算）
        return [(i, 1.0) for i in range(n_recommendations)]


# 新用户冷启动的策略：
strategies = {
    "popularity": "推荐全局最热门的物品",
    "demographic": "基于用户人口统计信息推荐",
    "content_profile": "询问初始偏好，使用基于内容的方法",
    "exploration": "推荐多样化物品以快速学习偏好",
    "social": "基于好友的偏好推荐"
}
```

### 新物品的解决方案

```python
def handle_new_item_cold_start(item_content_features, existing_item_features,
                               item_ratings, k_similar=10):
    """
    使用内容相似度处理新物品的冷启动。

    参数：
    -----------
    item_content_features : np.ndarray
        新物品的内容特征
    existing_item_features : np.ndarray
        现有物品的内容特征
    item_ratings : np.ndarray
        现有物品的评分矩阵（用户 x 物品）
    k_similar : int
        考虑的相似物品数量

    返回：
    --------
    np.ndarray : 所有用户的预测评分
    """
    from sklearn.metrics.pairwise import cosine_similarity

    # 基于内容找到相似的现有物品
    similarities = cosine_similarity(
        item_content_features.reshape(1, -1),
        existing_item_features
    ).flatten()

    # 获取前 k 个相似物品
    top_k_idx = np.argsort(similarities)[-k_similar:]
    top_k_sim = similarities[top_k_idx]

    # 基于相似物品的评分预测评分
    # 相似物品评分的加权平均
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

### 混合方法

```python
class HybridRecommender:
    """
    结合协同过滤和基于内容过滤的混合推荐器。
    """

    def __init__(self, cf_weight=0.7, cb_weight=0.3):
        self.cf_weight = cf_weight
        self.cb_weight = cb_weight
        self.cf_model = None
        self.item_content_sim = None

    def fit(self, ratings_matrix, item_content_features):
        """
        拟合 CF 和基于内容的组件。
        """
        # 拟合 CF 模型
        self.cf_model = ALSRecommender(n_factors=10)
        self.cf_model.fit(ratings_matrix)

        # 计算物品内容相似度
        self.item_content_sim = cosine_similarity(item_content_features)

        self.ratings_matrix = ratings_matrix
        return self

    def recommend(self, user_idx, n_recommendations=10):
        """
        生成混合推荐。
        """
        n_items = self.ratings_matrix.shape[1]

        # CF 分数
        cf_scores = self.cf_model.user_factors[user_idx] @ self.cf_model.item_factors.T

        # 基于用户评分过的物品的内容分数
        user_ratings = self.ratings_matrix[user_idx]
        rated_items = np.where(user_ratings > 0)[0]

        if len(rated_items) > 0:
            # 与评分物品的平均内容相似度，按评分加权
            cb_scores = np.zeros(n_items)
            for i in rated_items:
                cb_scores += user_ratings[i] * self.item_content_sim[i]
            cb_scores /= np.sum(user_ratings[rated_items])
        else:
            cb_scores = np.zeros(n_items)

        # 合并分数
        hybrid_scores = self.cf_weight * cf_scores + self.cb_weight * cb_scores

        # 排除已评分的物品
        hybrid_scores[rated_items] = -np.inf

        top_items = np.argsort(hybrid_scores)[::-1][:n_recommendations]
        return [(idx, hybrid_scores[idx]) for idx in top_items]
```

---

## 使用 Surprise 库实现

Surprise 是一个专门用于构建和分析推荐系统的 Python 库。它提供了即用型算法和评估工具。

### 安装和设置

```python
# 安装
# pip install scikit-surprise

from surprise import Dataset, Reader, SVD, SVDpp, KNNBasic, KNNWithMeans
from surprise import accuracy
from surprise.model_selection import cross_validate, train_test_split, GridSearchCV
import pandas as pd

# 创建示例数据
ratings_data = pd.DataFrame({
    'user_id': ['U1', 'U1', 'U1', 'U2', 'U2', 'U2', 'U3', 'U3', 'U3', 'U4', 'U4'],
    'item_id': ['I1', 'I2', 'I3', 'I1', 'I2', 'I4', 'I2', 'I3', 'I4', 'I1', 'I3'],
    'rating': [5, 3, 4, 4, 5, 3, 2, 4, 5, 3, 4]
})

# 定义评分范围
reader = Reader(rating_scale=(1, 5))

# 将数据加载为 Surprise 格式
data = Dataset.load_from_df(ratings_data[['user_id', 'item_id', 'rating']], reader)
```

### 基本算法

```python
# 基于用户的 KNN
user_knn = KNNBasic(
    k=5,
    sim_options={
        'name': 'cosine',
        'user_based': True
    }
)

# 带均值中心化的基于物品的 KNN
item_knn = KNNWithMeans(
    k=5,
    sim_options={
        'name': 'pearson',
        'user_based': False
    }
)

# SVD（矩阵分解）
svd = SVD(
    n_factors=50,
    n_epochs=20,
    lr_all=0.005,
    reg_all=0.02
)

# SVD++（包含隐式反馈）
svdpp = SVDpp(
    n_factors=50,
    n_epochs=20,
    lr_all=0.005,
    reg_all=0.02
)
```

### 交叉验证和评估

```python
from surprise.model_selection import cross_validate

# 交叉验证 SVD 模型
results = cross_validate(
    svd,
    data,
    measures=['RMSE', 'MAE'],
    cv=5,
    verbose=True
)

print(f"\n平均 RMSE：{results['test_rmse'].mean():.4f}")
print(f"平均 MAE：{results['test_mae'].mean():.4f}")

# 比较多个算法
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
        '算法': name,
        'RMSE': results['test_rmse'].mean(),
        'MAE': results['test_mae'].mean(),
        '拟合时间': results['fit_time'].mean(),
        '测试时间': results['test_time'].mean()
    })

comparison_df = pd.DataFrame(comparison_results)
print("\n算法比较：")
print(comparison_df.round(4))
```

### 超参数调优

```python
from surprise.model_selection import GridSearchCV

# 为 SVD 定义参数网格
param_grid = {
    'n_factors': [20, 50, 100],
    'n_epochs': [10, 20, 30],
    'lr_all': [0.002, 0.005, 0.01],
    'reg_all': [0.01, 0.02, 0.05]
}

# 网格搜索
gs = GridSearchCV(SVD, param_grid, measures=['rmse', 'mae'], cv=3)
gs.fit(data)

# 最佳参数
print(f"最佳 RMSE：{gs.best_score['rmse']:.4f}")
print(f"最佳参数：{gs.best_params['rmse']}")

# 使用最佳参数训练模型
best_svd = gs.best_estimator['rmse']
```

### 进行预测和推荐

```python
from collections import defaultdict

def get_top_n_recommendations(predictions, n=10):
    """
    为每个用户生成前 N 个推荐。

    参数：
    -----------
    predictions : list
        Surprise Prediction 对象列表
    n : int
        每个用户的推荐数量

    返回：
    --------
    dict : 用户 -> (物品, 预估评分) 列表
    """
    top_n = defaultdict(list)

    for uid, iid, true_r, est, _ in predictions:
        top_n[uid].append((iid, est))

    # 按预估评分排序
    for uid, user_ratings in top_n.items():
        user_ratings.sort(key=lambda x: x[1], reverse=True)
        top_n[uid] = user_ratings[:n]

    return top_n


# 训练-测试分割
trainset, testset = train_test_split(data, test_size=0.2)

# 训练模型
svd = SVD(n_factors=50, n_epochs=20)
svd.fit(trainset)

# 在测试集上获取预测
predictions = svd.test(testset)
print(f"测试 RMSE：{accuracy.rmse(predictions):.4f}")

# 生成推荐
# 首先，获取每个用户未评分的所有物品
all_items = set(ratings_data['item_id'].unique())
user_items = ratings_data.groupby('user_id')['item_id'].apply(set).to_dict()

# 预测未评分物品的评分
anti_testset = []
for user in ratings_data['user_id'].unique():
    unrated_items = all_items - user_items.get(user, set())
    for item in unrated_items:
        anti_testset.append((user, item, 0))  # 0 是占位符

predictions = svd.test(anti_testset)
top_n = get_top_n_recommendations(predictions, n=3)

print("\n前 3 个推荐：")
for user, recommendations in top_n.items():
    print(f"  {user}：{recommendations}")
```

### 完整的 Surprise 流水线

```python
from surprise import Dataset, Reader, SVD
from surprise.model_selection import cross_validate, GridSearchCV, train_test_split
from surprise import accuracy
import pandas as pd

class SurpriseRecommender:
    """
    使用 Surprise 库的完整推荐系统流水线。
    """

    def __init__(self, algorithm='svd', **kwargs):
        self.algorithm_name = algorithm
        self.kwargs = kwargs
        self.model = None
        self.trainset = None

    def load_data(self, df, user_col='user_id', item_col='item_id',
                  rating_col='rating', rating_scale=(1, 5)):
        """从 pandas DataFrame 加载数据。"""
        reader = Reader(rating_scale=rating_scale)
        self.data = Dataset.load_from_df(
            df[[user_col, item_col, rating_col]], reader
        )
        self.df = df
        self.user_col = user_col
        self.item_col = item_col

    def cross_validate(self, cv=5):
        """执行交叉验证。"""
        model = self._create_model()
        results = cross_validate(
            model, self.data,
            measures=['RMSE', 'MAE'],
            cv=cv, verbose=True
        )
        return results

    def tune_hyperparameters(self, param_grid, cv=3):
        """超参数调优的网格搜索。"""
        model_class = self._get_model_class()
        gs = GridSearchCV(model_class, param_grid, measures=['rmse'], cv=cv)
        gs.fit(self.data)

        print(f"最佳 RMSE：{gs.best_score['rmse']:.4f}")
        print(f"最佳参数：{gs.best_params['rmse']}")

        self.kwargs.update(gs.best_params['rmse'])
        return gs.best_params['rmse']

    def fit(self, test_size=0.2):
        """训练模型。"""
        trainset, testset = train_test_split(self.data, test_size=test_size)
        self.trainset = trainset
        self.testset = testset

        self.model = self._create_model()
        self.model.fit(trainset)

        # 在测试集上评估
        predictions = self.model.test(testset)
        rmse = accuracy.rmse(predictions)
        mae = accuracy.mae(predictions)

        print(f"测试 RMSE：{rmse:.4f}")
        print(f"测试 MAE：{mae:.4f}")

        return self

    def predict(self, user_id, item_id):
        """预测用户-物品对的评分。"""
        return self.model.predict(user_id, item_id).est

    def recommend(self, user_id, n=10):
        """为用户生成前 N 个推荐。"""
        # 获取用户已评分的物品
        rated_items = set(
            self.df[self.df[self.user_col] == user_id][self.item_col]
        )
        all_items = set(self.df[self.item_col].unique())
        unrated_items = all_items - rated_items

        # 预测未评分物品的评分
        predictions = []
        for item_id in unrated_items:
            pred = self.model.predict(user_id, item_id)
            predictions.append((item_id, pred.est))

        # 排序并返回前 N 个
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:n]

    def _create_model(self):
        """创建模型实例。"""
        model_class = self._get_model_class()
        return model_class(**self.kwargs)

    def _get_model_class(self):
        """根据算法名称获取模型类。"""
        from surprise import SVD, SVDpp, KNNBasic, KNNWithMeans, NMF

        models = {
            'svd': SVD,
            'svdpp': SVDpp,
            'knn_basic': KNNBasic,
            'knn_means': KNNWithMeans,
            'nmf': NMF
        }
        return models.get(self.algorithm_name, SVD)


# 使用示例
ratings_df = pd.DataFrame({
    'user_id': ['U1', 'U1', 'U1', 'U1', 'U2', 'U2', 'U2', 'U3', 'U3', 'U3',
                'U4', 'U4', 'U4', 'U5', 'U5'],
    'item_id': ['I1', 'I2', 'I3', 'I4', 'I1', 'I2', 'I5', 'I2', 'I3', 'I4',
                'I1', 'I3', 'I5', 'I2', 'I4'],
    'rating': [5, 3, 4, 2, 4, 5, 3, 2, 4, 5, 3, 4, 4, 5, 3]
})

# 初始化并使用
recommender = SurpriseRecommender(
    algorithm='svd',
    n_factors=20,
    n_epochs=20,
    lr_all=0.005,
    reg_all=0.02
)

recommender.load_data(ratings_df)
recommender.fit(test_size=0.2)

# 获取推荐
print("\nU1 的推荐：")
recs = recommender.recommend('U1', n=3)
for item, rating in recs:
    print(f"  {item}：{rating:.3f}")
```

---

## 评估指标

正确的评估对于开发有效的推荐系统至关重要。不同的指标捕捉推荐质量的不同方面。

### 评分预测指标

```python
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error

def rating_metrics(y_true, y_pred):
    """
    计算评分预测指标。
    """
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)

    return {
        'RMSE': rmse,
        'MAE': mae
    }
```

### 排序指标

```python
def precision_at_k(recommended, relevant, k):
    """
    Precision@K：推荐物品中相关物品的比例。
    """
    recommended_k = recommended[:k]
    relevant_set = set(relevant)
    hits = len(set(recommended_k) & relevant_set)
    return hits / k

def recall_at_k(recommended, relevant, k):
    """
    Recall@K：相关物品中被推荐的比例。
    """
    recommended_k = recommended[:k]
    relevant_set = set(relevant)
    hits = len(set(recommended_k) & relevant_set)
    return hits / len(relevant_set) if relevant_set else 0

def ndcg_at_k(recommended, relevant, k):
    """
    NDCG@K：归一化折损累计增益。
    考虑相关物品在排序中的位置。
    """
    relevant_set = set(relevant)

    # DCG
    dcg = 0
    for i, item in enumerate(recommended[:k]):
        if item in relevant_set:
            dcg += 1 / np.log2(i + 2)  # i+2 因为位置从 1 开始

    # 理想 DCG
    ideal_dcg = sum(1 / np.log2(i + 2) for i in range(min(len(relevant_set), k)))

    return dcg / ideal_dcg if ideal_dcg > 0 else 0

def map_at_k(recommended, relevant, k):
    """
    MAP@K：平均精度均值。
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
    Hit Rate@K：前 K 个中是否至少有一个相关物品。
    """
    recommended_k = set(recommended[:k])
    relevant_set = set(relevant)
    return 1 if recommended_k & relevant_set else 0


# 评估示例
recommended_items = ['I3', 'I5', 'I2', 'I7', 'I1', 'I8', 'I4', 'I6']
relevant_items = ['I2', 'I5', 'I6']

print("评估指标：")
print(f"  Precision@5：{precision_at_k(recommended_items, relevant_items, 5):.4f}")
print(f"  Recall@5：{recall_at_k(recommended_items, relevant_items, 5):.4f}")
print(f"  NDCG@5：{ndcg_at_k(recommended_items, relevant_items, 5):.4f}")
print(f"  MAP@5：{map_at_k(recommended_items, relevant_items, 5):.4f}")
print(f"  Hit Rate@5：{hit_rate(recommended_items, relevant_items, 5)}")
```

### 准确性之外的指标

```python
def coverage(all_recommendations, all_items):
    """
    目录覆盖率：曾被推荐的物品比例。
    """
    recommended_items = set()
    for recs in all_recommendations:
        recommended_items.update(recs)
    return len(recommended_items) / len(all_items)

def diversity(recommendations, item_similarity_matrix, item_to_idx):
    """
    列表内多样性：推荐物品之间的平均不相似度。
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
    新颖性：推荐物品的平均自信息。
    越新颖 = 推荐的物品越不热门。
    """
    novelty_scores = []
    for item in recommendations:
        pop = item_popularity.get(item, 1) / n_users
        novelty_scores.append(-np.log2(pop + 1e-10))
    return np.mean(novelty_scores)
```

---

## 最佳实践和生产提示

### 可扩展性考虑

```python
from scipy import sparse

def create_sparse_matrix(df, user_col, item_col, rating_col):
    """
    创建稀疏矩阵以提高内存效率。
    """
    # 创建映射
    users = df[user_col].unique()
    items = df[item_col].unique()

    user_to_idx = {u: i for i, u in enumerate(users)}
    item_to_idx = {i: j for j, i in enumerate(items)}

    # 创建稀疏矩阵
    row = df[user_col].map(user_to_idx)
    col = df[item_col].map(item_to_idx)
    data = df[rating_col]

    sparse_matrix = sparse.csr_matrix(
        (data, (row, col)),
        shape=(len(users), len(items))
    )

    return sparse_matrix, user_to_idx, item_to_idx


# 近似最近邻以扩展相似度搜索
# pip install annoy
# from annoy import AnnoyIndex

def build_approximate_nn_index(item_factors, n_trees=10):
    """
    构建近似最近邻索引以加快相似度搜索。
    使用 Annoy 库进行可扩展的相似度计算。
    """
    # 注意：需要 annoy 库
    # from annoy import AnnoyIndex

    n_items, n_factors = item_factors.shape

    # index = AnnoyIndex(n_factors, 'angular')  # angular = 余弦相似度
    # for i in range(n_items):
    #     index.add_item(i, item_factors[i])
    # index.build(n_trees)
    # return index

    print("安装 annoy 库以使用近似最近邻：pip install annoy")
    return None
```

### 在线 vs 离线推荐

```python
class ProductionRecommender:
    """
    带有缓存和回退的生产就绪推荐器。
    """

    def __init__(self, model, cache_ttl=3600):
        self.model = model
        self.cache_ttl = cache_ttl
        self.recommendation_cache = {}
        self.popular_items = []

    def get_recommendations(self, user_id, n=10):
        """
        获取带有缓存和回退的推荐。
        """
        # 检查缓存
        cache_key = f"{user_id}_{n}"
        if cache_key in self.recommendation_cache:
            cached = self.recommendation_cache[cache_key]
            if cached['timestamp'] > time.time() - self.cache_ttl:
                return cached['recommendations']

        try:
            # 尝试获取个性化推荐
            recommendations = self.model.recommend(user_id, n)
        except Exception as e:
            # 回退到热门物品
            print(f"回退到热门物品：{e}")
            recommendations = self.popular_items[:n]

        # 缓存结果
        self.recommendation_cache[cache_key] = {
            'recommendations': recommendations,
            'timestamp': time.time()
        }

        return recommendations

    def update_popular_items(self, interaction_data):
        """
        更新热门物品列表用于回退。
        """
        popularity = interaction_data.groupby('item_id').size()
        self.popular_items = popularity.sort_values(ascending=False).index.tolist()
```

### A/B 测试框架

```python
import hashlib

def get_experiment_bucket(user_id, experiment_name, n_buckets=2):
    """
    确定性地将用户分配到实验桶。
    """
    hash_input = f"{user_id}_{experiment_name}"
    hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
    return hash_value % n_buckets

def run_ab_test(user_id, model_a, model_b, experiment_name="recommender_test"):
    """
    在两个推荐模型之间运行 A/B 测试。
    """
    bucket = get_experiment_bucket(user_id, experiment_name)

    if bucket == 0:
        model = model_a
        variant = 'A'
    else:
        model = model_b
        variant = 'B'

    recommendations = model.recommend(user_id)

    # 记录实验分配以供分析
    log_experiment(user_id, experiment_name, variant, recommendations)

    return recommendations, variant

def log_experiment(user_id, experiment_name, variant, recommendations):
    """记录实验分配以供后续分析。"""
    # 在生产中，记录到分析系统
    print(f"用户 {user_id} 分配到变体 {variant}")
```

---

## 面试要点

### 常见面试问题

**问题 1：解释基于用户和基于物品的协同过滤的区别。**

基于用户的 CF 找到相似用户并推荐这些相似用户喜欢的物品。基于物品的 CF 找到与用户已喜欢的物品相似的物品。在生产中通常首选基于物品的方法，因为：
- 物品相似度比用户相似度更稳定
- 可以预计算和缓存
- 当用户数 >> 物品数时扩展性更好（电商中常见）

**问题 2：如何处理冷启动问题？**

解决方案因冷启动类型而异：
- **新用户**：使用基于热门度的推荐、询问偏好、利用人口统计数据或使用基于内容的方法
- **新物品**：使用与现有物品的内容相似度，推广给多样化用户以进行探索
- **混合方法**：将 CF 与基于内容的方法结合

**问题 3：什么是矩阵分解，为什么有用？**

矩阵分解将用户-物品矩阵分解为低维的用户和物品因子矩阵。好处包括：
- 通过学习潜在表示处理稀疏性
- 捕捉隐式关系
- 比基于内存的方法更具可扩展性
- 对未见过的用户-物品对泛化更好

**问题 4：如何评估推荐系统？**

多个指标捕捉不同方面：
- **准确性**：评分预测的 RMSE、MAE
- **排序**：Precision@K、Recall@K、NDCG、MAP
- **准确性之外**：覆盖率、多样性、新颖性、意外性
- **业务指标**：点击率、转化率、用户参与度

**问题 5：如何处理隐式反馈？**

关键方法：
- 转换为置信度分数（例如，C = 1 + alpha * 交互次数）
- 使用专门的算法（隐式的 ALS、BPR）
- 建模为带有置信度加权的偏好（二值）
- 谨慎采样负样本（未观察到 != 不喜欢）

### 系统设计考虑

```
推荐系统架构：
================================

[用户请求]
     |
     v
[API 网关] ---> [推荐服务]
     |                     |
     |              [模型服务]
     |                /         \
     |        [实时]    [批处理]
     |              |             |
     |        [用户上下文]  [预计算]
     |              |             |
     v              v             v
[响应] <--- [排序和过滤]
                      |
                [A/B 测试分配]
                      |
                [日志和分析]
```

**关键设计要点：**
1. **离线训练**：定期在历史数据上训练模型
2. **在线服务**：快速推理，通常使用预计算分数
3. **特征存储**：实时用户/物品特征
4. **缓存**：缓存热门推荐
5. **回退**：冷启动的基于热门度的回退
6. **实验**：A/B 测试基础设施
7. **监控**：跟踪推荐质量指标

---

## 延伸阅读

### 基础论文

- **"Amazon.com Recommendations: Item-to-Item Collaborative Filtering"**（Linden 等，2003）：规模化基于物品 CF 的开创性论文
- **"Matrix Factorization Techniques for Recommender Systems"**（Koren 等，2009）：MF 方法的综合概述
- **"Collaborative Filtering for Implicit Feedback Datasets"**（Hu 等，2008）：隐式反馈的 ALS
- **"BPR: Bayesian Personalized Ranking from Implicit Feedback"**（Rendle 等，2009）：隐式数据的成对学习

### 书籍

- **"Recommender Systems Handbook"**（Ricci 等）：涵盖所有方面的综合参考
- **"Practical Recommender Systems"**（Falk）：带有实际实现的实践指南
- **"Mining of Massive Datasets"**（Leskovec 等）：关于推荐系统的章节，关注可扩展性

### 库和工具

- **Surprise**：显式反馈的 Python 库（scikit-surprise）
- **Implicit**：隐式反馈的 Python 库（benfred/implicit）
- **LightFM**：结合 CF 和内容特征的混合推荐器
- **TensorFlow Recommenders**：基于深度学习的推荐
- **RecBole**：复现推荐算法的统一框架

### 相关主题

- [机器学习基础](/ai/ml-fundamentals) - 核心 ML 概念
- [深度学习基础](/ai/deep-learning-basics) - 深度推荐器的神经网络基础
- [统计学基础](/data/statistics-fundamentals) - 评估的统计概念

---

## 总结

协同过滤仍然是构建推荐系统最有效和最广泛使用的方法之一。本指南涵盖了：

1. **基础**：理解推荐系统和 CF 理念
2. **基于内存的方法**：基于用户和基于物品的协同过滤
3. **相似度度量**：余弦、皮尔逊、调整余弦和杰卡德相似度
4. **矩阵分解**：SVD、ALS 和基于 SGD 的方法
5. **隐式反馈**：处理非显式用户信号
6. **冷启动**：新用户和新物品的策略
7. **实际实现**：使用 Surprise 库
8. **评估**：准确性和准确性之外的指标
9. **生产提示**：可扩展性、缓存和 A/B 测试

从业者的关键要点：
- 在复杂模型之前从简单基线开始（热门度、基于物品的 CF）
- 选择与业务目标一致的指标
- 在设计中明确解决冷启动问题
- 考虑混合方法以增强鲁棒性
- 投资于离线评估和在线 A/B 测试
- 持续监控和迭代

推荐系统是一个不断发展的领域。虽然协同过滤提供了坚实的基础，但现代系统通常将 CF 与深度学习、知识图谱和强化学习结合以获得更好的性能。
