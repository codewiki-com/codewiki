---
title: 推荐系统：工程实践
description: 构建生产级推荐系统：召回、排序、冷启动和A/B测试
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - 推荐系统
  - 召回
  - 排序
  - 工程
status: imported
origin: old/src/content/docs/datascience/recommender-engineering.zh.md
divergence: 0.205
issues: []
legacy:
  category: DataScience
  subcategory: Recommender
  order: 26
  lastUpdated: 2026-01-07
---

推荐系统是现代互联网产品的核心组件之一，从电商平台的商品推荐、视频网站的内容推荐，到社交媒体的信息流排序，推荐系统无处不在。本文将从工程实践的角度，深入探讨如何构建一个生产级的推荐系统，涵盖架构设计、召回策略、排序模型、冷启动解决方案以及A/B测试等关键主题。

## 推荐系统架构概述

### 推荐系统的核心挑战

构建推荐系统面临多重挑战：

- **海量数据处理**：亿级用户、千万级物品、万亿级行为数据
- **实时性要求**：用户期望毫秒级的推荐响应
- **多目标优化**：需要平衡点击率、转化率、用户留存等多个指标
- **冷启动问题**：新用户和新物品缺乏历史数据
- **系统复杂度**：涉及数据流、特征工程、模型训练、在线服务等多个环节

### 经典推荐系统架构

一个完整的推荐系统通常采用"召回-粗排-精排-重排"的级联架构：

```
用户请求
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                       召回层 (Recall)                        │
│         从海量候选集中快速筛选出万级候选物品                    │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│   │协同过滤 │ │向量召回 │ │热门召回 │ │ 规则召回│          │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │ ~10000 候选
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       粗排层 (Pre-Ranking)                   │
│              使用轻量级模型快速过滤，保留千级候选               │
└─────────────────────────┬───────────────────────────────────┘
                          │ ~1000 候选
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       精排层 (Ranking)                       │
│              使用复杂模型精确打分，选出百级候选                 │
└─────────────────────────┬───────────────────────────────────┘
                          │ ~100 候选
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       重排层 (Re-Ranking)                    │
│           考虑多样性、业务规则，生成最终推荐列表                │
└─────────────────────────┬───────────────────────────────────┘
                          │ ~10-50 结果
                          ▼
                     最终推荐结果
```

### 推荐系统数据流架构

```
                     ┌─────────────────────────────────────────────┐
                     │              用户行为日志                    │
                     │    (曝光、点击、购买、停留时长等)             │
                     └──────────────────┬──────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
    ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
    │   实时流处理   │           │   批量处理    │           │   数据仓库    │
    │   (Flink/Kafka)│           │   (Spark)     │           │   (Hive/HDFS) │
    └───────┬───────┘           └───────┬───────┘           └───────┬───────┘
            │                           │                           │
            ▼                           ▼                           ▼
    ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
    │   实时特征    │           │   离线特征    │           │   样本构建    │
    │   (Redis)     │           │   (HDFS)      │           │   (训练数据)  │
    └───────┬───────┘           └───────┬───────┘           └───────┬───────┘
            │                           │                           │
            └───────────────────────────┼───────────────────────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │    模型训练     │
                               │  (TensorFlow/   │
                               │   PyTorch)      │
                               └────────┬────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │    模型服务     │
                               │  (TF Serving/   │
                               │   TorchServe)   │
                               └────────┬────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │    推荐服务     │
                               │   (在线推理)    │
                               └─────────────────┘
```

## 召回策略详解

召回层是推荐系统的第一道关卡，目标是从海量物品库（百万到亿级）中快速筛选出用户可能感兴趣的候选集（万级），要求高效率、高召回率。

### 多路召回架构

实际生产系统通常采用多路召回策略，融合多种召回源：

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
    """多路召回引擎"""

    def __init__(self):
        self.recall_sources = {}

    def register_source(self, name: str, recall_func):
        """注册召回源"""
        self.recall_sources[name] = recall_func

    async def recall(self, user_id: str, context: Dict,
                     top_k: int = 1000) -> List[RecallResult]:
        """执行多路召回"""
        # 并行执行所有召回源
        tasks = [
            self._execute_recall(name, func, user_id, context)
            for name, func in self.recall_sources.items()
        ]
        results = await asyncio.gather(*tasks)

        # 合并去重
        merged = self._merge_results(results, top_k)
        return merged

    async def _execute_recall(self, name: str, func,
                               user_id: str, context: Dict):
        """执行单路召回"""
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
        """合并多路召回结果"""
        seen: Set[str] = set()
        merged = []

        # 简单合并策略：按分数排序，去重
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

### 协同过滤召回

协同过滤是最经典的召回方法，基于"相似用户喜欢相似物品"的假设。

**基于物品的协同过滤（ItemCF）：**

```python
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict

class ItemCFRecall:
    """基于物品的协同过滤召回"""

    def __init__(self, similarity_threshold: float = 0.1):
        self.item_similarity = None
        self.user_items = defaultdict(set)
        self.item_users = defaultdict(set)
        self.similarity_threshold = similarity_threshold

    def fit(self, interactions: List[Dict]):
        """
        训练物品相似度矩阵
        interactions: [{'user_id': 'u1', 'item_id': 'i1', 'rating': 5}, ...]
        """
        # 构建用户-物品交互
        for inter in interactions:
            user_id = inter['user_id']
            item_id = inter['item_id']
            self.user_items[user_id].add(item_id)
            self.item_users[item_id].add(user_id)

        # 构建物品-物品共现矩阵
        items = list(self.item_users.keys())
        item_idx = {item: idx for idx, item in enumerate(items)}
        n_items = len(items)

        # 使用稀疏矩阵计算相似度
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

        # 计算余弦相似度
        self.item_similarity = cosine_similarity(co_matrix)
        self.items = items
        self.item_idx = item_idx

    def recall(self, user_id: str, top_k: int = 100) -> List[Dict]:
        """为用户召回物品"""
        if user_id not in self.user_items:
            return []

        user_interacted = self.user_items[user_id]
        candidates = defaultdict(float)

        # 基于用户历史交互物品找相似物品
        for item in user_interacted:
            if item not in self.item_idx:
                continue
            item_id = self.item_idx[item]
            similarities = self.item_similarity[item_id]

            for idx, sim in enumerate(similarities):
                candidate_item = self.items[idx]
                if candidate_item not in user_interacted and sim > self.similarity_threshold:
                    candidates[candidate_item] += sim

        # 排序返回
        sorted_candidates = sorted(candidates.items(),
                                   key=lambda x: x[1], reverse=True)
        return [{'id': item, 'score': score}
                for item, score in sorted_candidates[:top_k]]
```

### 向量召回（Embedding Recall）

向量召回是目前最主流的召回方法，通过将用户和物品映射到同一向量空间，使用近似最近邻（ANN）算法实现高效检索。

**双塔模型（Two-Tower Model）：**

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class TwoTowerModel(nn.Module):
    """双塔召回模型"""

    def __init__(self, user_feature_dim: int, item_feature_dim: int,
                 embedding_dim: int = 128, hidden_dims: List[int] = [256, 128]):
        super().__init__()

        # 用户塔
        self.user_tower = self._build_tower(user_feature_dim, embedding_dim, hidden_dims)

        # 物品塔
        self.item_tower = self._build_tower(item_feature_dim, embedding_dim, hidden_dims)

        # 温度参数（用于softmax）
        self.temperature = nn.Parameter(torch.ones(1) * 0.07)

    def _build_tower(self, input_dim: int, output_dim: int,
                     hidden_dims: List[int]) -> nn.Sequential:
        """构建塔网络"""
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
        """编码用户特征"""
        embedding = self.user_tower(user_features)
        return F.normalize(embedding, p=2, dim=1)

    def encode_item(self, item_features: torch.Tensor) -> torch.Tensor:
        """编码物品特征"""
        embedding = self.item_tower(item_features)
        return F.normalize(embedding, p=2, dim=1)

    def forward(self, user_features: torch.Tensor,
                item_features: torch.Tensor) -> torch.Tensor:
        """计算用户-物品相似度"""
        user_emb = self.encode_user(user_features)
        item_emb = self.encode_item(item_features)

        # 计算余弦相似度
        similarity = torch.matmul(user_emb, item_emb.T) / self.temperature
        return similarity

    def compute_loss(self, user_features: torch.Tensor,
                     positive_items: torch.Tensor,
                     negative_items: torch.Tensor) -> torch.Tensor:
        """
        Batch内负采样的对比学习损失
        """
        user_emb = self.encode_user(user_features)
        pos_emb = self.encode_item(positive_items)
        neg_emb = self.encode_item(negative_items)

        # 正样本相似度
        pos_score = torch.sum(user_emb * pos_emb, dim=1)

        # 负样本相似度
        neg_score = torch.matmul(user_emb, neg_emb.T)

        # InfoNCE Loss
        logits = torch.cat([pos_score.unsqueeze(1), neg_score], dim=1) / self.temperature
        labels = torch.zeros(logits.size(0), dtype=torch.long, device=logits.device)
        loss = F.cross_entropy(logits, labels)

        return loss
```

**向量索引服务（基于Faiss）：**

```python
import faiss
import numpy as np
import json
from typing import List, Tuple

class VectorIndex:
    """向量索引服务"""

    def __init__(self, dimension: int, index_type: str = 'IVF'):
        self.dimension = dimension
        self.index_type = index_type
        self.index = None
        self.id_mapping = {}  # faiss_id -> item_id

    def build_index(self, embeddings: np.ndarray, item_ids: List[str],
                    nlist: int = 100, nprobe: int = 10):
        """
        构建向量索引
        embeddings: shape (n_items, dimension)
        """
        n_items = len(embeddings)

        if self.index_type == 'IVF':
            # IVF索引：适合大规模数据
            quantizer = faiss.IndexFlatIP(self.dimension)
            self.index = faiss.IndexIVFFlat(quantizer, self.dimension,
                                            min(nlist, n_items))
            self.index.train(embeddings.astype('float32'))
            self.index.nprobe = nprobe

        elif self.index_type == 'HNSW':
            # HNSW索引：查询速度更快
            self.index = faiss.IndexHNSWFlat(self.dimension, 32)

        elif self.index_type == 'Flat':
            # 精确搜索
            self.index = faiss.IndexFlatIP(self.dimension)

        # 添加向量
        self.index.add(embeddings.astype('float32'))

        # 建立ID映射
        for idx, item_id in enumerate(item_ids):
            self.id_mapping[idx] = item_id

    def search(self, query_embedding: np.ndarray,
               top_k: int = 100) -> List[Tuple[str, float]]:
        """
        向量检索
        query_embedding: shape (dimension,) or (1, dimension)
        """
        if len(query_embedding.shape) == 1:
            query_embedding = query_embedding.reshape(1, -1)

        # 执行搜索
        scores, indices = self.index.search(query_embedding.astype('float32'), top_k)

        # 转换结果
        results = []
        for idx, score in zip(indices[0], scores[0]):
            if idx >= 0:  # -1表示无效结果
                item_id = self.id_mapping.get(idx)
                if item_id:
                    results.append((item_id, float(score)))

        return results

    def save(self, path: str):
        """保存索引"""
        faiss.write_index(self.index, f"{path}/faiss.index")
        # 使用JSON保存ID映射（更安全）
        with open(f"{path}/id_mapping.json", 'w') as f:
            json.dump({str(k): v for k, v in self.id_mapping.items()}, f)

    def load(self, path: str):
        """加载索引"""
        self.index = faiss.read_index(f"{path}/faiss.index")
        # 使用JSON加载ID映射
        with open(f"{path}/id_mapping.json", 'r') as f:
            mapping = json.load(f)
            self.id_mapping = {int(k): v for k, v in mapping.items()}
```

### 其他召回策略

**热门召回：**

```python
class HotRecall:
    """热门物品召回"""

    def __init__(self, decay_factor: float = 0.95):
        self.hot_items = {}
        self.decay_factor = decay_factor

    def update(self, item_id: str, score: float = 1.0):
        """更新物品热度"""
        if item_id in self.hot_items:
            self.hot_items[item_id] = self.hot_items[item_id] * self.decay_factor + score
        else:
            self.hot_items[item_id] = score

    def recall(self, exclude_items: Set[str] = None,
               top_k: int = 100) -> List[Dict]:
        """召回热门物品"""
        exclude_items = exclude_items or set()

        candidates = [(item, score) for item, score in self.hot_items.items()
                      if item not in exclude_items]
        candidates.sort(key=lambda x: x[1], reverse=True)

        return [{'id': item, 'score': score}
                for item, score in candidates[:top_k]]
```

**标签/类目召回：**

```python
class TagRecall:
    """基于标签的召回"""

    def __init__(self):
        self.tag_items = defaultdict(list)  # tag -> [(item_id, score)]
        self.item_tags = defaultdict(set)   # item_id -> {tags}

    def index_item(self, item_id: str, tags: List[str], score: float = 1.0):
        """索引物品"""
        for tag in tags:
            self.tag_items[tag].append((item_id, score))
            self.item_tags[item_id].add(tag)

    def recall(self, user_interest_tags: List[str],
               exclude_items: Set[str] = None,
               top_k: int = 100) -> List[Dict]:
        """基于用户兴趣标签召回"""
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

## 粗排与精排

### 粗排层设计

粗排层需要在保证效率的前提下，对召回结果进行初步筛选。

**粗排模型设计原则：**

1. **模型简单**：使用轻量级模型，如逻辑回归、浅层神经网络
2. **特征精简**：只使用核心特征，避免复杂特征工程
3. **快速推理**：单次推理延迟控制在毫秒级

```python
class PreRankingModel(nn.Module):
    """粗排模型：轻量级双塔 + 简单交叉"""

    def __init__(self, user_dim: int, item_dim: int, hidden_dim: int = 64):
        super().__init__()

        # 用户特征编码
        self.user_encoder = nn.Sequential(
            nn.Linear(user_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )

        # 物品特征编码
        self.item_encoder = nn.Sequential(
            nn.Linear(item_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )

        # 交叉层（简单点积 + 浅层MLP）
        self.cross_layer = nn.Sequential(
            nn.Linear(hidden_dim * 3, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )

    def forward(self, user_features: torch.Tensor,
                item_features: torch.Tensor) -> torch.Tensor:
        user_emb = self.user_encoder(user_features)
        item_emb = self.item_encoder(item_features)

        # 特征交叉
        cross = user_emb * item_emb  # 逐元素乘积
        combined = torch.cat([user_emb, item_emb, cross], dim=1)

        score = self.cross_layer(combined)
        return torch.sigmoid(score)
```

### 精排层设计

精排层是推荐系统的核心，需要对候选物品进行精确打分。

**Deep & Cross Network（DCN）：**

```python
class CrossNetwork(nn.Module):
    """交叉网络层"""

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

        # Embedding层
        self.embeddings = nn.ModuleDict({
            name: nn.Embedding(dim, embedding_dim)
            for name, dim in sparse_feature_dims.items()
        })

        # 计算总输入维度
        total_dim = len(sparse_feature_dims) * embedding_dim + dense_feature_dim

        # Cross网络
        self.cross_network = CrossNetwork(total_dim, cross_layers)

        # Deep网络
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

        # 输出层
        self.output_layer = nn.Linear(total_dim + deep_layers[-1], 1)

    def forward(self, sparse_features: Dict[str, torch.Tensor],
                dense_features: torch.Tensor) -> torch.Tensor:
        # Embedding lookup
        embedded = [self.embeddings[name](sparse_features[name])
                    for name in self.embeddings.keys()]
        embedded = torch.cat(embedded, dim=1)

        # 拼接稀疏和稠密特征
        x0 = torch.cat([embedded.flatten(1), dense_features], dim=1)

        # Cross网络
        cross_out = self.cross_network(x0)

        # Deep网络
        deep_out = self.deep_network(x0)

        # 组合输出
        combined = torch.cat([cross_out, deep_out], dim=1)
        logits = self.output_layer(combined)

        return torch.sigmoid(logits)
```

**多目标排序模型（Multi-Task Learning）：**

```python
class MultiTaskRankingModel(nn.Module):
    """多目标排序模型（MMOE架构）"""

    def __init__(self, input_dim: int, num_experts: int = 4,
                 expert_dim: int = 128, num_tasks: int = 2):
        super().__init__()

        self.num_experts = num_experts
        self.num_tasks = num_tasks

        # Expert网络
        self.experts = nn.ModuleList([
            nn.Sequential(
                nn.Linear(input_dim, expert_dim),
                nn.ReLU(),
                nn.Linear(expert_dim, expert_dim),
                nn.ReLU()
            )
            for _ in range(num_experts)
        ])

        # Gate网络（每个任务一个）
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
        # 计算所有Expert的输出
        expert_outputs = [expert(x) for expert in self.experts]
        expert_outputs = torch.stack(expert_outputs, dim=1)  # (batch, num_experts, expert_dim)

        # 每个任务的输出
        task_outputs = []
        for i in range(self.num_tasks):
            # Gate权重
            gate_weight = self.gates[i](x)  # (batch, num_experts)

            # 加权组合Expert输出
            gate_weight = gate_weight.unsqueeze(2)  # (batch, num_experts, 1)
            expert_weighted = torch.sum(expert_outputs * gate_weight, dim=1)

            # Task Tower
            output = self.towers[i](expert_weighted)
            task_outputs.append(torch.sigmoid(output))

        return task_outputs


class MultiTaskLoss(nn.Module):
    """多目标损失函数"""

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

### 特征工程

特征是排序模型的核心，通常包括以下几类：

```python
from dataclasses import dataclass
from typing import Any, Dict, List
import numpy as np

@dataclass
class FeatureConfig:
    """特征配置"""
    name: str
    feature_type: str  # 'sparse', 'dense', 'sequence'
    dim: int = 1
    embedding_dim: int = 16

class FeatureExtractor:
    """特征提取器"""

    def __init__(self, feature_configs: List[FeatureConfig]):
        self.configs = {f.name: f for f in feature_configs}

    def extract_user_features(self, user: Dict) -> Dict[str, Any]:
        """提取用户特征"""
        features = {}

        # 用户基础特征
        features['user_id'] = user['user_id']
        features['user_age_bucket'] = self._age_bucket(user.get('age', 0))
        features['user_gender'] = user.get('gender', 'unknown')
        features['user_city_level'] = user.get('city_level', 0)

        # 用户统计特征
        features['user_click_count_7d'] = user.get('click_count_7d', 0)
        features['user_order_count_30d'] = user.get('order_count_30d', 0)
        features['user_avg_price'] = user.get('avg_price', 0.0)

        # 用户行为序列特征
        features['user_click_seq'] = user.get('recent_clicks', [])[:50]
        features['user_category_seq'] = user.get('recent_categories', [])[:20]

        return features

    def extract_item_features(self, item: Dict) -> Dict[str, Any]:
        """提取物品特征"""
        features = {}

        # 物品基础特征
        features['item_id'] = item['item_id']
        features['category_id'] = item.get('category_id', 0)
        features['brand_id'] = item.get('brand_id', 0)
        features['price_bucket'] = self._price_bucket(item.get('price', 0))

        # 物品统计特征
        features['item_ctr_7d'] = item.get('ctr_7d', 0.0)
        features['item_cvr_7d'] = item.get('cvr_7d', 0.0)
        features['item_exposure_count'] = item.get('exposure_count', 0)
        features['item_click_count'] = item.get('click_count', 0)

        return features

    def extract_context_features(self, context: Dict) -> Dict[str, Any]:
        """提取上下文特征"""
        features = {}

        # 时间特征
        features['hour'] = context.get('hour', 0)
        features['weekday'] = context.get('weekday', 0)
        features['is_weekend'] = 1 if context.get('weekday', 0) >= 5 else 0

        # 设备特征
        features['device_type'] = context.get('device_type', 'unknown')
        features['os'] = context.get('os', 'unknown')

        # 场景特征
        features['page_type'] = context.get('page_type', 'home')
        features['position'] = context.get('position', 0)

        return features

    def extract_cross_features(self, user_features: Dict,
                                item_features: Dict) -> Dict[str, Any]:
        """提取交叉特征"""
        features = {}

        # 用户-物品交叉
        features['user_category_match'] = int(
            item_features.get('category_id') in
            user_features.get('user_category_seq', [])
        )

        # 价格匹配度
        user_avg_price = user_features.get('user_avg_price', 0)
        item_price = item_features.get('price_bucket', 0)
        features['price_gap'] = abs(user_avg_price - item_price)

        return features

    def _age_bucket(self, age: int) -> int:
        """年龄分桶"""
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
        """价格分桶"""
        buckets = [10, 50, 100, 200, 500, 1000, 2000, 5000]
        for i, threshold in enumerate(buckets):
            if price < threshold:
                return i
        return len(buckets)
```

## 重排与多样性

重排层是推荐系统的最后一道关卡，需要在相关性的基础上考虑多样性、新鲜度、业务规则等因素。

### 多样性算法

**MMR（Maximal Marginal Relevance）：**

```python
import numpy as np
from typing import List, Tuple

def mmr_rerank(candidates: List[Dict],
               item_embeddings: Dict[str, np.ndarray],
               lambda_param: float = 0.5,
               top_k: int = 10) -> List[Dict]:
    """
    MMR重排序算法

    Args:
        candidates: 候选物品列表，每个物品包含'id'和'score'
        item_embeddings: 物品ID到向量的映射
        lambda_param: 相关性与多样性的权衡参数
        top_k: 返回结果数量
    """
    selected = []
    remaining = candidates.copy()

    while len(selected) < top_k and remaining:
        best_score = float('-inf')
        best_item = None

        for item in remaining:
            item_id = item['id']
            relevance = item['score']

            # 计算与已选物品的最大相似度
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

            # MMR得分 = lambda * relevance - (1-lambda) * max_similarity
            mmr_score = lambda_param * relevance - (1 - lambda_param) * max_sim

            if mmr_score > best_score:
                best_score = mmr_score
                best_item = item

        if best_item:
            selected.append(best_item)
            remaining.remove(best_item)

    return selected


def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    """计算余弦相似度"""
    if a is None or b is None:
        return 0.0
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)
```

**DPP（Determinantal Point Process）：**

```python
import numpy as np
from scipy.linalg import det, inv

class DPPReranker:
    """基于DPP的多样性重排序"""

    def __init__(self, alpha: float = 0.5):
        """
        Args:
            alpha: 相关性权重
        """
        self.alpha = alpha

    def rerank(self, candidates: List[Dict],
               embeddings: np.ndarray,
               top_k: int = 10) -> List[int]:
        """
        DPP重排序

        Args:
            candidates: 候选列表
            embeddings: 候选物品的embedding矩阵 (n, d)
            top_k: 返回数量

        Returns:
            选中物品的索引列表
        """
        n = len(candidates)
        scores = np.array([c['score'] for c in candidates])

        # 构建L矩阵
        # L_ij = q_i * q_j * S_ij
        # 其中q是质量分数，S是相似度矩阵
        quality = np.sqrt(scores)
        similarity = embeddings @ embeddings.T

        L = np.outer(quality, quality) * similarity
        L = self.alpha * np.diag(scores) + (1 - self.alpha) * L

        # 贪心选择
        selected = []
        remaining = list(range(n))

        while len(selected) < top_k and remaining:
            best_idx = None
            best_gain = float('-inf')

            for idx in remaining:
                if not selected:
                    gain = L[idx, idx]
                else:
                    # 计算条件增益
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

### 业务规则引擎

```python
from typing import List, Callable
from dataclasses import dataclass

@dataclass
class Rule:
    """重排规则"""
    name: str
    priority: int
    condition: Callable
    action: Callable

class RuleEngine:
    """规则引擎"""

    def __init__(self):
        self.rules: List[Rule] = []

    def add_rule(self, rule: Rule):
        """添加规则"""
        self.rules.append(rule)
        # 按优先级排序
        self.rules.sort(key=lambda x: x.priority, reverse=True)

    def apply(self, candidates: List[Dict], context: Dict) -> List[Dict]:
        """应用规则"""
        result = candidates.copy()

        for rule in self.rules:
            if rule.condition(context):
                result = rule.action(result, context)

        return result


# 规则示例
def create_common_rules() -> RuleEngine:
    """创建常用规则"""
    engine = RuleEngine()

    # 规则1：新品优先展示
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

    # 规则2：广告位插入
    engine.add_rule(Rule(
        name="ad_insertion",
        priority=90,
        condition=lambda ctx: ctx.get('show_ads', True),
        action=lambda items, ctx: insert_ads(items, ctx.get('ads', []))
    ))

    # 规则3：过滤已购买物品
    engine.add_rule(Rule(
        name="filter_purchased",
        priority=80,
        condition=lambda ctx: 'purchased_items' in ctx,
        action=lambda items, ctx: [
            item for item in items
            if item['id'] not in ctx['purchased_items']
        ]
    ))

    # 规则4：类目打散
    engine.add_rule(Rule(
        name="category_scatter",
        priority=70,
        condition=lambda ctx: ctx.get('enable_scatter', True),
        action=lambda items, ctx: scatter_by_category(items, max_consecutive=2)
    ))

    return engine


def insert_ads(items: List[Dict], ads: List[Dict]) -> List[Dict]:
    """插入广告"""
    result = []
    ad_positions = [3, 7, 15]  # 广告位置
    ad_idx = 0

    for i, item in enumerate(items):
        if i in ad_positions and ad_idx < len(ads):
            result.append(ads[ad_idx])
            ad_idx += 1
        result.append(item)

    return result


def scatter_by_category(items: List[Dict], max_consecutive: int = 2) -> List[Dict]:
    """类目打散"""
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
            # 所有类目都达到上限，重置计数
            category_count.clear()

    return result
```

## 冷启动解决方案

冷启动是推荐系统面临的核心挑战之一，包括新用户冷启动和新物品冷启动。

### 新用户冷启动

```python
class NewUserStrategy:
    """新用户冷启动策略"""

    def __init__(self):
        self.popular_items = []
        self.category_popular = {}
        self.demographic_popular = {}

    def update_popular_items(self, items: List[Dict]):
        """更新热门物品"""
        self.popular_items = sorted(items, key=lambda x: x['score'], reverse=True)[:100]

    def get_recommendations(self, user_info: Dict, top_k: int = 20) -> List[Dict]:
        """获取新用户推荐"""

        # 策略1：基于注册信息的推荐
        if user_info.get('interests'):
            return self._interest_based_recommend(user_info['interests'], top_k)

        # 策略2：基于人口统计学的推荐
        if user_info.get('age') and user_info.get('gender'):
            return self._demographic_based_recommend(user_info, top_k)

        # 策略3：基于地域的推荐
        if user_info.get('city'):
            return self._location_based_recommend(user_info['city'], top_k)

        # 兜底策略：热门推荐
        return self.popular_items[:top_k]

    def _interest_based_recommend(self, interests: List[str], top_k: int) -> List[Dict]:
        """基于兴趣标签推荐"""
        candidates = []
        for interest in interests:
            items = self.category_popular.get(interest, [])
            candidates.extend(items[:top_k // len(interests)])
        return candidates[:top_k]

    def _demographic_based_recommend(self, user_info: Dict, top_k: int) -> List[Dict]:
        """基于人口统计学推荐"""
        # 使用预先计算的人群-物品偏好矩阵
        age_group = self._get_age_group(user_info['age'])
        gender = user_info['gender']
        demographic_key = f"{age_group}_{gender}"

        # 返回该人群的热门物品
        return self.demographic_popular.get(demographic_key, self.popular_items)[:top_k]

    def _location_based_recommend(self, city: str, top_k: int) -> List[Dict]:
        """基于地域推荐"""
        # 返回该地区的热门物品
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
    """探索与利用策略（E&E）"""

    def __init__(self, epsilon: float = 0.1):
        self.epsilon = epsilon

    def select_items(self, exploitation_items: List[Dict],
                     exploration_items: List[Dict],
                     top_k: int = 20) -> List[Dict]:
        """
        混合探索与利用的推荐
        """
        import random

        result = []
        num_exploration = int(top_k * self.epsilon)
        num_exploitation = top_k - num_exploration

        # 利用：选择预测分数最高的物品
        result.extend(exploitation_items[:num_exploitation])

        # 探索：随机选择一些物品
        if exploration_items:
            explore_sample = random.sample(
                exploration_items,
                min(num_exploration, len(exploration_items))
            )
            result.extend(explore_sample)

        # 随机打乱，避免探索物品总在最后
        random.shuffle(result)
        return result


class BanditStrategy:
    """多臂老虎机策略"""

    def __init__(self, num_arms: int, alpha: float = 1.0):
        """
        Thompson Sampling实现
        """
        self.alpha = np.ones(num_arms)
        self.beta = np.ones(num_arms)

    def select_arm(self) -> int:
        """选择臂"""
        samples = np.random.beta(self.alpha, self.beta)
        return np.argmax(samples)

    def update(self, arm: int, reward: float):
        """更新参数"""
        self.alpha[arm] += reward
        self.beta[arm] += 1 - reward
```

### 新物品冷启动

```python
class NewItemStrategy:
    """新物品冷启动策略"""

    def __init__(self):
        self.content_model = None  # 基于内容的模型
        self.item_features = {}

    def get_similar_items(self, new_item: Dict, top_k: int = 10) -> List[str]:
        """基于内容找相似物品"""
        new_item_features = self._extract_features(new_item)

        similarities = []
        for item_id, features in self.item_features.items():
            sim = self._compute_similarity(new_item_features, features)
            similarities.append((item_id, sim))

        similarities.sort(key=lambda x: x[1], reverse=True)
        return [item_id for item_id, _ in similarities[:top_k]]

    def transfer_item_embedding(self, new_item: Dict) -> np.ndarray:
        """
        通过内容特征生成新物品的embedding
        适用于双塔模型场景
        """
        if self.content_model is None:
            raise ValueError("Content model not initialized")

        features = self._extract_features(new_item)
        embedding = self.content_model.predict(features)
        return embedding

    def _extract_features(self, item: Dict) -> np.ndarray:
        """提取物品内容特征"""
        features = []

        # 文本特征（标题、描述）
        if 'title' in item:
            title_emb = self._encode_text(item['title'])
            features.append(title_emb)

        # 类目特征
        if 'category' in item:
            cat_emb = self._encode_category(item['category'])
            features.append(cat_emb)

        # 属性特征
        if 'attributes' in item:
            attr_emb = self._encode_attributes(item['attributes'])
            features.append(attr_emb)

        return np.concatenate(features)

    def _encode_text(self, text: str) -> np.ndarray:
        """编码文本（可使用BERT等预训练模型）"""
        # 简化实现
        return np.random.randn(128)

    def _encode_category(self, category: str) -> np.ndarray:
        """编码类目"""
        return np.random.randn(32)

    def _encode_attributes(self, attributes: Dict) -> np.ndarray:
        """编码属性"""
        return np.random.randn(64)

    def _compute_similarity(self, feat1: np.ndarray, feat2: np.ndarray) -> float:
        """计算特征相似度"""
        return np.dot(feat1, feat2) / (np.linalg.norm(feat1) * np.linalg.norm(feat2) + 1e-8)


class ItemExposureController:
    """新物品曝光控制"""

    def __init__(self, min_exposure: int = 1000, boost_factor: float = 1.5):
        self.min_exposure = min_exposure
        self.boost_factor = boost_factor
        self.item_exposure = {}

    def should_boost(self, item_id: str) -> bool:
        """判断是否需要提升曝光"""
        exposure = self.item_exposure.get(item_id, 0)
        return exposure < self.min_exposure

    def boost_score(self, item_id: str, original_score: float) -> float:
        """提升物品分数"""
        if self.should_boost(item_id):
            exposure = self.item_exposure.get(item_id, 0)
            # 曝光越少，提升越多
            boost_ratio = 1 + (self.boost_factor - 1) * (1 - exposure / self.min_exposure)
            return original_score * boost_ratio
        return original_score

    def record_exposure(self, item_id: str):
        """记录曝光"""
        self.item_exposure[item_id] = self.item_exposure.get(item_id, 0) + 1
```

## 实时推荐系统

### 实时特征系统

```python
import redis
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class RealtimeFeatureStore:
    """实时特征存储"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def update_user_behavior(self, user_id: str, item_id: str,
                             behavior_type: str, timestamp: int):
        """更新用户实时行为"""
        # 更新最近点击序列
        click_key = f"user:{user_id}:recent_clicks"
        self.redis.lpush(click_key, f"{item_id}:{timestamp}")
        self.redis.ltrim(click_key, 0, 49)  # 保留最近50个
        self.redis.expire(click_key, 86400)  # 24小时过期

        # 更新行为计数
        count_key = f"user:{user_id}:{behavior_type}_count"
        self.redis.incr(count_key)
        self.redis.expire(count_key, 86400)

        # 更新类目偏好
        category = self._get_item_category(item_id)
        if category:
            cat_key = f"user:{user_id}:category_count"
            self.redis.hincrby(cat_key, category, 1)
            self.redis.expire(cat_key, 86400 * 7)  # 7天过期

    def get_user_realtime_features(self, user_id: str) -> Dict:
        """获取用户实时特征"""
        features = {}

        # 最近点击序列
        click_key = f"user:{user_id}:recent_clicks"
        recent_clicks = self.redis.lrange(click_key, 0, 49)
        features['recent_clicks'] = [
            click.decode().split(':')[0] for click in recent_clicks
        ]

        # 行为计数
        for behavior in ['click', 'cart', 'order']:
            count_key = f"user:{user_id}:{behavior}_count"
            count = self.redis.get(count_key)
            features[f'{behavior}_count_realtime'] = int(count) if count else 0

        # 类目偏好
        cat_key = f"user:{user_id}:category_count"
        category_counts = self.redis.hgetall(cat_key)
        features['category_preference'] = {
            k.decode(): int(v) for k, v in category_counts.items()
        }

        return features

    def update_item_stats(self, item_id: str, behavior_type: str):
        """更新物品实时统计"""
        # 使用时间窗口统计
        now = datetime.now()
        hour_key = now.strftime("%Y%m%d%H")

        # 小时级统计
        stat_key = f"item:{item_id}:{behavior_type}:{hour_key}"
        self.redis.incr(stat_key)
        self.redis.expire(stat_key, 86400 * 2)  # 2天过期

    def get_item_realtime_stats(self, item_id: str) -> Dict:
        """获取物品实时统计"""
        stats = {}
        now = datetime.now()

        for behavior in ['exposure', 'click', 'order']:
            # 最近1小时
            hour_key = now.strftime("%Y%m%d%H")
            stat_key = f"item:{item_id}:{behavior}:{hour_key}"
            count = self.redis.get(stat_key)
            stats[f'{behavior}_1h'] = int(count) if count else 0

            # 最近24小时
            total = 0
            for i in range(24):
                hour = (now - timedelta(hours=i)).strftime("%Y%m%d%H")
                stat_key = f"item:{item_id}:{behavior}:{hour}"
                count = self.redis.get(stat_key)
                total += int(count) if count else 0
            stats[f'{behavior}_24h'] = total

        # 计算实时CTR
        if stats['exposure_24h'] > 0:
            stats['ctr_24h'] = stats['click_24h'] / stats['exposure_24h']
        else:
            stats['ctr_24h'] = 0

        return stats

    def _get_item_category(self, item_id: str) -> Optional[str]:
        """获取物品类目"""
        cat = self.redis.hget("item:categories", item_id)
        return cat.decode() if cat else None
```

### 实时推荐服务

```python
import asyncio
from typing import Dict, List
import time

class RealtimeRecommender:
    """实时推荐服务"""

    def __init__(self, config: Dict):
        self.recall_engine = MultiRecallEngine()
        self.ranking_model = self._load_ranking_model(config['model_path'])
        self.feature_store = RealtimeFeatureStore(config['redis'])
        self.reranker = RuleEngine()

        # 性能监控
        self.latency_stats = {'recall': [], 'rank': [], 'rerank': []}

    async def recommend(self, user_id: str, context: Dict,
                       top_k: int = 20) -> Dict:
        """
        执行实时推荐

        Returns:
            {
                'items': [...],
                'latency': {'total': x, 'recall': x, 'rank': x, 'rerank': x}
            }
        """
        start_time = time.time()
        latency = {}

        # 1. 获取实时特征
        user_features = await self._get_user_features(user_id)

        # 2. 多路召回
        recall_start = time.time()
        candidates = await self.recall_engine.recall(user_id, context, top_k=1000)
        latency['recall'] = (time.time() - recall_start) * 1000

        # 3. 批量获取物品特征
        item_features = await self._batch_get_item_features(
            [c.item_id for c in candidates]
        )

        # 4. 排序
        rank_start = time.time()
        scored_items = await self._rank(user_features, item_features, candidates)
        latency['rank'] = (time.time() - rank_start) * 1000

        # 5. 重排序
        rerank_start = time.time()
        final_items = self.reranker.apply(scored_items[:100], context)[:top_k]
        latency['rerank'] = (time.time() - rerank_start) * 1000

        latency['total'] = (time.time() - start_time) * 1000

        return {
            'items': final_items,
            'latency': latency
        }

    async def _get_user_features(self, user_id: str) -> Dict:
        """获取用户特征（离线+实时）"""
        # 并行获取离线和实时特征
        offline_task = self._get_offline_user_features(user_id)
        realtime_task = asyncio.to_thread(
            self.feature_store.get_user_realtime_features, user_id
        )

        offline_features, realtime_features = await asyncio.gather(
            offline_task, realtime_task
        )

        # 合并特征
        return {**offline_features, **realtime_features}

    async def _batch_get_item_features(self, item_ids: List[str]) -> Dict[str, Dict]:
        """批量获取物品特征"""
        # 实际实现中可能使用批量Redis查询或特征缓存
        features = {}
        for item_id in item_ids:
            features[item_id] = await self._get_item_features(item_id)
        return features

    async def _rank(self, user_features: Dict, item_features: Dict[str, Dict],
                   candidates: List) -> List[Dict]:
        """排序"""
        # 准备批量推理的输入
        batch_features = []
        for candidate in candidates:
            item_feat = item_features.get(candidate.item_id, {})
            combined = self._combine_features(user_features, item_feat)
            batch_features.append(combined)

        # 批量推理
        scores = self.ranking_model.predict_batch(batch_features)

        # 组合结果
        results = []
        for candidate, score in zip(candidates, scores):
            results.append({
                'id': candidate.item_id,
                'score': float(score),
                'recall_source': candidate.source
            })

        # 按分数排序
        results.sort(key=lambda x: x['score'], reverse=True)
        return results

    def _combine_features(self, user_features: Dict, item_features: Dict) -> Dict:
        """组合用户和物品特征"""
        return {
            **{f'user_{k}': v for k, v in user_features.items()},
            **{f'item_{k}': v for k, v in item_features.items()}
        }

    async def _get_offline_user_features(self, user_id: str) -> Dict:
        """获取离线用户特征"""
        # 从特征存储获取离线特征
        return {}

    async def _get_item_features(self, item_id: str) -> Dict:
        """获取物品特征"""
        return {}

    def _load_ranking_model(self, model_path: str):
        """加载排序模型"""
        # 加载TensorFlow或PyTorch模型
        return None
```

## A/B测试设计

A/B测试是验证推荐系统改进效果的关键手段。

### A/B测试框架

```python
import hashlib
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Experiment:
    """实验配置"""
    name: str
    description: str
    start_time: datetime
    end_time: datetime
    traffic_ratio: float  # 实验流量比例
    buckets: Dict[str, float]  # 各桶的流量比例
    metrics: List[str]  # 关注的指标


class ABTestFramework:
    """A/B测试框架"""

    def __init__(self):
        self.experiments: Dict[str, Experiment] = {}

    def create_experiment(self, experiment: Experiment):
        """创建实验"""
        self.experiments[experiment.name] = experiment

    def get_bucket(self, experiment_name: str, user_id: str) -> Optional[str]:
        """
        获取用户所属的实验桶

        使用确定性分桶，确保同一用户始终进入同一桶
        """
        experiment = self.experiments.get(experiment_name)
        if not experiment:
            return None

        # 检查实验是否在有效期内
        now = datetime.now()
        if now < experiment.start_time or now > experiment.end_time:
            return None

        # 计算用户哈希值
        hash_key = f"{experiment_name}:{user_id}"
        hash_value = int(hashlib.md5(hash_key.encode()).hexdigest(), 16)
        ratio = (hash_value % 10000) / 10000.0

        # 判断是否进入实验
        if ratio > experiment.traffic_ratio:
            return None  # 不参与实验

        # 分配到具体桶
        normalized_ratio = ratio / experiment.traffic_ratio
        cumulative = 0
        for bucket_name, bucket_ratio in experiment.buckets.items():
            cumulative += bucket_ratio
            if normalized_ratio < cumulative:
                return bucket_name

        return list(experiment.buckets.keys())[-1]

    def log_exposure(self, experiment_name: str, user_id: str,
                    bucket: str, context: Dict):
        """记录实验曝光"""
        # 发送到日志系统
        log_data = {
            'experiment': experiment_name,
            'user_id': user_id,
            'bucket': bucket,
            'timestamp': datetime.now().isoformat(),
            'context': context
        }
        # 实际实现中发送到Kafka等消息队列
        print(f"Experiment exposure: {log_data}")

    def log_conversion(self, experiment_name: str, user_id: str,
                      metric: str, value: float):
        """记录实验转化"""
        log_data = {
            'experiment': experiment_name,
            'user_id': user_id,
            'metric': metric,
            'value': value,
            'timestamp': datetime.now().isoformat()
        }
        print(f"Experiment conversion: {log_data}")


class ExperimentAnalyzer:
    """实验分析器"""

    def __init__(self):
        pass

    def compute_metrics(self, experiment_name: str,
                       start_date: str, end_date: str) -> Dict:
        """
        计算实验指标

        Returns:
            {
                'bucket_a': {'ctr': 0.05, 'cvr': 0.02, ...},
                'bucket_b': {'ctr': 0.06, 'cvr': 0.025, ...}
            }
        """
        # 从数据仓库查询实验数据
        # 这里是简化实现
        return {}

    def compute_significance(self, control_data: List[float],
                            treatment_data: List[float]) -> Dict:
        """
        计算统计显著性

        使用t检验判断两组数据是否有显著差异
        """
        from scipy import stats
        import numpy as np

        # t检验
        t_stat, p_value = stats.ttest_ind(control_data, treatment_data)

        # 计算效果量（Cohen's d）
        control_mean = np.mean(control_data)
        treatment_mean = np.mean(treatment_data)
        pooled_std = np.sqrt((np.std(control_data)**2 + np.std(treatment_data)**2) / 2)
        effect_size = (treatment_mean - control_mean) / pooled_std

        # 计算相对提升
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
        """计算置信区间"""
        from scipy import stats
        import numpy as np

        n = len(data)
        mean = np.mean(data)
        se = stats.sem(data)

        h = se * stats.t.ppf((1 + confidence) / 2, n - 1)
        return (mean - h, mean + h)
```

### 常用实验指标

```python
from typing import Dict, List
from collections import defaultdict
import numpy as np
from datetime import datetime

class MetricsCalculator:
    """指标计算器"""

    def __init__(self):
        pass

    def calculate_ctr(self, exposures: int, clicks: int) -> float:
        """计算点击率"""
        return clicks / exposures if exposures > 0 else 0

    def calculate_cvr(self, clicks: int, orders: int) -> float:
        """计算转化率"""
        return orders / clicks if clicks > 0 else 0

    def calculate_gmv(self, orders: List[Dict]) -> float:
        """计算GMV"""
        return sum(order['amount'] for order in orders)

    def calculate_arpu(self, user_orders: Dict[str, List[Dict]]) -> float:
        """计算ARPU（每用户平均收入）"""
        total_revenue = sum(
            sum(order['amount'] for order in orders)
            for orders in user_orders.values()
        )
        return total_revenue / len(user_orders) if user_orders else 0

    def calculate_coverage(self, recommended_items: set,
                          total_items: set) -> float:
        """计算推荐覆盖率"""
        return len(recommended_items) / len(total_items) if total_items else 0

    def calculate_diversity(self, recommendations: List[List[Dict]]) -> float:
        """
        计算推荐多样性

        使用类目熵来衡量
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

        # 计算熵
        entropy = 0
        for count in category_counts.values():
            p = count / total
            if p > 0:
                entropy -= p * np.log2(p)

        return entropy

    def calculate_novelty(self, recommendations: List[List[Dict]],
                         item_popularity: Dict[str, int]) -> float:
        """
        计算推荐新颖度

        推荐物品的平均逆流行度
        """
        novelty_scores = []
        max_popularity = max(item_popularity.values()) if item_popularity else 1

        for rec_list in recommendations:
            for item in rec_list:
                item_id = item['id']
                popularity = item_popularity.get(item_id, 0)
                # 逆流行度
                novelty = 1 - (popularity / max_popularity)
                novelty_scores.append(novelty)

        return np.mean(novelty_scores) if novelty_scores else 0

    def calculate_serendipity(self, recommendations: List[Dict],
                             user_history: List[str],
                             item_similarity: Dict[str, Dict[str, float]]) -> float:
        """
        计算惊喜度

        衡量推荐物品与用户历史的差异程度
        """
        if not user_history or not recommendations:
            return 0

        serendipity_scores = []

        for rec_item in recommendations:
            rec_id = rec_item['id']
            # 计算与历史物品的最大相似度
            max_sim = 0
            for hist_id in user_history:
                sim = item_similarity.get(rec_id, {}).get(hist_id, 0)
                max_sim = max(max_sim, sim)

            # 惊喜度 = 1 - 最大相似度
            serendipity = 1 - max_sim
            serendipity_scores.append(serendipity)

        return np.mean(serendipity_scores)


class OnlineMetricsCollector:
    """在线指标收集器"""

    def __init__(self, metrics_config: Dict):
        self.config = metrics_config
        self.metrics_buffer = defaultdict(list)

    def record_exposure(self, user_id: str, item_ids: List[str],
                       experiment_bucket: str):
        """记录曝光"""
        for item_id in item_ids:
            self.metrics_buffer['exposures'].append({
                'user_id': user_id,
                'item_id': item_id,
                'bucket': experiment_bucket,
                'timestamp': datetime.now()
            })

    def record_click(self, user_id: str, item_id: str,
                    experiment_bucket: str, position: int):
        """记录点击"""
        self.metrics_buffer['clicks'].append({
            'user_id': user_id,
            'item_id': item_id,
            'bucket': experiment_bucket,
            'position': position,
            'timestamp': datetime.now()
        })

    def record_order(self, user_id: str, item_id: str,
                    experiment_bucket: str, amount: float):
        """记录订单"""
        self.metrics_buffer['orders'].append({
            'user_id': user_id,
            'item_id': item_id,
            'bucket': experiment_bucket,
            'amount': amount,
            'timestamp': datetime.now()
        })

    def flush(self):
        """刷新指标到存储"""
        # 发送到Kafka或直接写入数据库
        for metric_type, records in self.metrics_buffer.items():
            # 批量写入
            self._write_to_storage(metric_type, records)
        self.metrics_buffer.clear()

    def _write_to_storage(self, metric_type: str, records: List[Dict]):
        """写入存储"""
        pass
```

## 业务指标优化

### 多目标优化

```python
import numpy as np
from typing import Dict, List

class MultiObjectiveOptimizer:
    """多目标优化器"""

    def __init__(self, objective_weights: Dict[str, float]):
        """
        Args:
            objective_weights: {'ctr': 0.4, 'cvr': 0.3, 'gmv': 0.3}
        """
        self.weights = objective_weights
        self._normalize_weights()

    def _normalize_weights(self):
        """归一化权重"""
        total = sum(self.weights.values())
        self.weights = {k: v/total for k, v in self.weights.items()}

    def compute_final_score(self, predictions: Dict[str, float]) -> float:
        """
        计算最终得分

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
        帕累托排序

        找出帕累托最优解集合
        """
        n = len(candidates)
        dominated_count = [0] * n
        dominating_list = [[] for _ in range(n)]

        # 比较所有候选对
        for i in range(n):
            for j in range(i + 1, n):
                if self._dominates(candidates[i], candidates[j]):
                    dominated_count[j] += 1
                    dominating_list[i].append(j)
                elif self._dominates(candidates[j], candidates[i]):
                    dominated_count[i] += 1
                    dominating_list[j].append(i)

        # 分层
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

        # 按帕累托前沿排序
        result = []
        for front in fronts:
            for idx in front:
                candidates[idx]['pareto_rank'] = len(fronts)
                result.append(candidates[idx])

        return result

    def _dominates(self, a: Dict, b: Dict) -> bool:
        """判断a是否支配b"""
        dominated = False
        for objective in self.weights.keys():
            if a.get(objective, 0) < b.get(objective, 0):
                return False
            if a.get(objective, 0) > b.get(objective, 0):
                dominated = True
        return dominated


class ConstrainedOptimizer:
    """带约束的优化器"""

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
        """过滤并排序"""
        # 过滤不满足约束的候选
        filtered = [c for c in candidates if self._check_constraints(c)]

        # 按得分排序
        filtered.sort(key=lambda x: x.get('score', 0), reverse=True)

        return filtered

    def _check_constraints(self, candidate: Dict) -> bool:
        """检查约束条件"""
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
        """在保证多样性约束下优化"""
        from collections import defaultdict

        selected = []
        category_count = defaultdict(int)

        for candidate in sorted(candidates, key=lambda x: x['score'], reverse=True):
            if len(selected) >= top_k:
                break

            category = candidate.get('category_id')
            current_diversity = self._compute_diversity(category_count)

            # 检查添加此物品后多样性是否满足
            if current_diversity >= min_diversity or category_count[category] < 2:
                selected.append(candidate)
                category_count[category] += 1

        return selected

    def _compute_diversity(self, category_count: Dict[str, int]) -> float:
        """计算当前多样性（类目熵）"""
        total = sum(category_count.values())
        if total == 0:
            return 1.0

        entropy = 0
        for count in category_count.values():
            p = count / total
            if p > 0:
                entropy -= p * np.log2(p)

        # 归一化
        max_entropy = np.log2(len(category_count)) if category_count else 1
        return entropy / max_entropy if max_entropy > 0 else 0
```

### 业务规则与模型融合

```python
class BusinessRuleIntegrator:
    """业务规则与模型融合"""

    def __init__(self):
        self.rules = []

    def add_boost_rule(self, name: str, condition: callable,
                       boost_factor: float):
        """添加提升规则"""
        self.rules.append({
            'name': name,
            'type': 'boost',
            'condition': condition,
            'factor': boost_factor
        })

    def add_filter_rule(self, name: str, condition: callable):
        """添加过滤规则"""
        self.rules.append({
            'name': name,
            'type': 'filter',
            'condition': condition
        })

    def add_pin_rule(self, name: str, condition: callable, position: int):
        """添加置顶规则"""
        self.rules.append({
            'name': name,
            'type': 'pin',
            'condition': condition,
            'position': position
        })

    def apply(self, candidates: List[Dict], context: Dict) -> List[Dict]:
        """应用所有规则"""
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

        # 重新排序
        result.sort(key=lambda x: x['score'], reverse=True)

        # 插入置顶物品
        for item, position in sorted(pinned_items, key=lambda x: x[1]):
            result.insert(min(position, len(result)), item)

        return result


# 业务规则示例
def create_ecommerce_rules() -> BusinessRuleIntegrator:
    """创建电商推荐规则"""
    integrator = BusinessRuleIntegrator()

    # 规则1：促销商品提升
    integrator.add_boost_rule(
        name="promotion_boost",
        condition=lambda item, ctx: item.get('is_promotion', False),
        boost_factor=1.5
    )

    # 规则2：高毛利商品提升
    integrator.add_boost_rule(
        name="margin_boost",
        condition=lambda item, ctx: item.get('margin_rate', 0) > 0.3,
        boost_factor=1.2
    )

    # 规则3：过滤售罄商品
    integrator.add_filter_rule(
        name="filter_sold_out",
        condition=lambda item, ctx: item.get('stock', 0) == 0
    )

    # 规则4：过滤价格异常商品
    integrator.add_filter_rule(
        name="filter_price_anomaly",
        condition=lambda item, ctx: item.get('price', 0) < 1 or item.get('price', 0) > 100000
    )

    # 规则5：新品置顶
    integrator.add_pin_rule(
        name="new_item_pin",
        condition=lambda item, ctx: item.get('is_new', False) and ctx.get('page', 1) == 1,
        position=0
    )

    return integrator
```

## 系统监控与运维

### 监控指标体系

```python
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime
import time

@dataclass
class MonitoringConfig:
    """监控配置"""
    service_name: str
    alert_thresholds: Dict[str, float]
    sampling_rate: float = 1.0

class RecommenderMonitor:
    """推荐系统监控"""

    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.metrics_buffer = []

    def record_request(self, latency_ms: float,
                       recall_count: int,
                       rank_count: int,
                       final_count: int,
                       status: str):
        """记录请求指标"""
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

        # 检查是否需要告警
        self._check_alerts(metrics)

    def record_model_metrics(self, model_name: str,
                            inference_latency_ms: float,
                            batch_size: int):
        """记录模型推理指标"""
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
        """记录特征获取指标"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'feature_name': feature_name,
            'fetch_latency_ms': fetch_latency_ms,
            'hit_rate': hit_rate
        }
        self.metrics_buffer.append(metrics)

    def _check_alerts(self, metrics: Dict):
        """检查告警条件"""
        thresholds = self.config.alert_thresholds

        if metrics.get('latency_ms', 0) > thresholds.get('max_latency_ms', 500):
            self._send_alert(f"High latency: {metrics['latency_ms']}ms")

        if metrics.get('status') == 'error':
            self._send_alert(f"Request failed")

    def _send_alert(self, message: str):
        """发送告警"""
        print(f"ALERT [{self.config.service_name}]: {message}")


class ABTestMonitor:
    """A/B测试监控"""

    def __init__(self):
        self.experiment_metrics = {}

    def record_experiment_metrics(self, experiment_name: str,
                                  bucket: str,
                                  metric_name: str,
                                  value: float):
        """记录实验指标"""
        key = (experiment_name, bucket, metric_name)
        if key not in self.experiment_metrics:
            self.experiment_metrics[key] = []
        self.experiment_metrics[key].append({
            'value': value,
            'timestamp': datetime.now()
        })

    def get_experiment_summary(self, experiment_name: str) -> Dict:
        """获取实验摘要"""
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

### 异常检测与告警

```python
import numpy as np
from collections import deque
from typing import Optional

class AnomalyDetector:
    """异常检测器"""

    def __init__(self, window_size: int = 100,
                 sigma_threshold: float = 3.0):
        self.window_size = window_size
        self.sigma_threshold = sigma_threshold
        self.history = deque(maxlen=window_size)

    def add_point(self, value: float) -> Optional[str]:
        """
        添加数据点并检测异常

        Returns:
            异常类型（如果有）或 None
        """
        if len(self.history) < self.window_size // 2:
            self.history.append(value)
            return None

        # 计算统计量
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
    """CTR异常检测"""

    def __init__(self):
        self.item_ctr_history = {}

    def check_item_ctr(self, item_id: str, ctr: float,
                       exposure_count: int) -> Optional[Dict]:
        """检查物品CTR是否异常"""
        if exposure_count < 100:
            return None  # 曝光量不足

        if item_id not in self.item_ctr_history:
            self.item_ctr_history[item_id] = deque(maxlen=24)  # 24小时

        history = self.item_ctr_history[item_id]

        if len(history) < 3:
            history.append(ctr)
            return None

        avg_ctr = np.mean(history)

        # CTR突然下降超过50%
        if ctr < avg_ctr * 0.5:
            return {
                'type': 'ctr_drop',
                'item_id': item_id,
                'current_ctr': ctr,
                'avg_ctr': avg_ctr,
                'drop_rate': (avg_ctr - ctr) / avg_ctr
            }

        # CTR突然上升超过100%（可能是刷量）
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
    """模型漂移检测"""

    def __init__(self, reference_distribution: Dict[str, float]):
        """
        Args:
            reference_distribution: 参考特征分布
        """
        self.reference = reference_distribution

    def check_drift(self, current_distribution: Dict[str, float],
                    threshold: float = 0.1) -> Optional[Dict]:
        """
        检测特征分布漂移

        使用KL散度衡量分布差异
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
        """计算KL散度"""
        kl = 0
        for key in p:
            if key in q and p[key] > 0 and q[key] > 0:
                kl += p[key] * np.log(p[key] / q[key])
        return kl
```

## 面试要点

### 常见面试问题

**Q1: 推荐系统为什么要分层（召回、粗排、精排、重排）？**

分层架构是为了平衡效果和效率：

- **召回层**：从海量物品（亿级）中快速筛选候选（万级），使用简单高效的算法
- **粗排层**：进一步筛选（千级），使用轻量级模型
- **精排层**：精确打分（百级），使用复杂模型确保效果
- **重排层**：考虑业务规则、多样性等，生成最终结果

每层逐步减少候选数量，允许后续层使用更复杂的模型。

**Q2: 如何评估推荐系统的效果？**

推荐系统评估需要综合考虑多个维度：

| 维度 | 指标 | 说明 |
|-----|------|------|
| 准确性 | CTR、CVR、AUC | 预测准确度 |
| 相关性 | NDCG、MAP | 排序质量 |
| 多样性 | 类目熵、ILS | 推荐结果多样性 |
| 覆盖率 | Item Coverage | 物品被推荐的比例 |
| 新颖度 | Novelty | 推荐冷门物品的能力 |
| 实时性 | 延迟P99 | 响应时间 |

**Q3: 冷启动问题怎么解决？**

新用户冷启动：
- 基于人口统计学特征推荐
- 基于注册时选择的兴趣标签
- 热门推荐作为兜底
- 引导用户提供反馈（探索）

新物品冷启动：
- 基于物品内容特征找相似物品
- 使用物品属性生成初始embedding
- 强制曝光策略（Explore & Exploit）
- 基于规则的初始流量分配

**Q4: 如何处理推荐系统中的偏差问题？**

常见偏差及解决方案：

| 偏差类型 | 描述 | 解决方案 |
|---------|------|---------|
| 位置偏差 | 用户更倾向点击靠前位置 | 位置因子建模、IPW校正 |
| 曝光偏差 | 只能观察到被推荐物品的反馈 | 因果推断、随机曝光 |
| 流行度偏差 | 热门物品获得更多曝光 | 逆倾向加权、多样性约束 |
| 反馈延迟偏差 | 转化行为存在延迟 | 延迟建模、多窗口样本 |

**Q5: 推荐系统如何保证线上稳定性？**

- **降级策略**：模型服务异常时降级到热门推荐
- **缓存机制**：缓存部分推荐结果，减少实时计算压力
- **限流熔断**：防止流量突增压垮系统
- **灰度发布**：新模型分阶段上线，及时回滚
- **监控告警**：实时监控关键指标，异常及时告警

### 系统设计面试示例

**题目：设计一个电商推荐系统**

**需求澄清：**
- 用户规模：1亿DAU
- 商品规模：1000万SKU
- QPS要求：10万
- 延迟要求：P99 < 100ms
- 业务指标：CTR、CVR、GMV

**高层设计：**

```
┌─────────────────────────────────────────────────────────────────────┐
│                            流量入口                                   │
│                        (Nginx/API Gateway)                          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                          推荐服务层                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 召回服务  │  │ 粗排服务  │  │ 精排服务  │  │ 重排服务  │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    向量索引     │    │    特征存储     │    │    模型服务     │
│    (Faiss)      │    │ (Redis/HBase)   │    │(TF Serving)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**关键设计点：**

1. **召回层**：多路召回（向量召回、协同过滤、热门、类目），总计返回10000候选

2. **粗排层**：轻量级双塔模型，筛选到1000

3. **精排层**：深度排序模型（DCN/MMOE），CTR+CVR多目标优化，筛选到100

4. **重排层**：MMR多样性算法 + 业务规则（促销置顶、类目打散）

5. **特征系统**：
   - 离线特征：用户画像、物品属性（存HBase）
   - 实时特征：最近行为序列（存Redis）

6. **高可用设计**：
   - 召回结果缓存（5分钟TTL）
   - 模型降级策略
   - 多机房部署

### 技术要点总结

1. **架构层面**：分层设计是核心，每层职责明确
2. **召回层面**：多路召回是标配，向量召回是趋势
3. **排序层面**：深度学习模型 + 多目标优化
4. **工程层面**：特征系统、实时性、稳定性是关键
5. **业务层面**：A/B测试驱动，持续迭代优化

## 总结

推荐系统工程是一个综合性很强的领域，涉及机器学习、分布式系统、实时计算等多个方向。本文从工程实践的角度，系统介绍了推荐系统的核心组件和关键技术：

1. **架构设计**：采用"召回-粗排-精排-重排"的级联架构，平衡效果与效率
2. **召回策略**：多路召回融合，向量召回是主流趋势
3. **排序模型**：深度学习模型主导，多目标优化成为标配
4. **冷启动**：结合内容特征和探索策略解决
5. **实时系统**：特征实时化、模型实时化是核心挑战
6. **A/B测试**：数据驱动决策，科学验证效果
7. **业务融合**：规则与模型结合，满足业务需求

推荐系统的发展日新月异，从协同过滤到深度学习，从离线批处理到实时推荐，技术在不断演进。掌握推荐系统工程的核心原理和实践经验，对于构建高质量的推荐产品至关重要。

## 延伸阅读

### 推荐论文

- **双塔模型**：《Sampling-Bias-Corrected Neural Modeling for Large Corpus Item Recommendations》
- **多目标优化**：《Modeling Task Relationships in Multi-task Learning with Multi-gate Mixture-of-Experts》
- **实时推荐**：《Real-time Attention Based Look-alike Model for Recommender System》
- **Debiasing**：《Unbiased Learning to Rank with Unbiased Propensity Estimation》

### 工业实践

- **阿里巴巴**：《Deep Interest Network for Click-Through Rate Prediction》
- **美团**：美团技术博客推荐系列
- **字节跳动**：《Deep Learning Recommendation Model for Personalization and Recommendation Systems》
- **Netflix**：Netflix Tech Blog 推荐系统文章

### 开源项目

- **DeepCTR**：深度学习CTR模型库
- **RecBole**：推荐系统研究框架
- **Faiss**：Facebook高效向量检索库
- **Feast**：特征存储系统
