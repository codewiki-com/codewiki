---
title: 推荐系统：深度学习方法
description: 掌握深度推荐模型：Wide & Deep、DeepFM、DIN和双塔模型
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - 深度学习
  - 推荐系统
  - DeepFM
  - 双塔模型
status: imported
origin: old/src/content/docs/datascience/deep-recommender.zh.md
divergence: 0.184
issues:
  - title-lang-en
  - title-language
legacy:
  category: DataScience
  subcategory: Recommender
  order: 25
  lastUpdated: 2026-01-07
---

深度学习的兴起为推荐系统带来了革命性的变革。相比传统的协同过滤和矩阵分解方法，深度推荐模型能够自动学习特征交叉、捕捉用户行为序列中的时序依赖、并支持多模态信息融合。本文将系统介绍深度推荐系统的核心模型架构与工程实践。

---

## 深度推荐系统演进

### 推荐系统发展历程

推荐系统经历了从协同过滤到深度学习的演进过程：

| 阶段 | 代表方法 | 特点 | 局限性 |
|------|----------|------|--------|
| 传统方法 | UserCF、ItemCF | 简单直观 | 稀疏性、冷启动 |
| 矩阵分解 | SVD、ALS、FM | 隐向量表示 | 线性交叉 |
| 深度学习 | Wide&Deep、DeepFM | 自动特征交叉 | 计算复杂 |
| 序列建模 | DIN、DIEN、SASRec | 兴趣演化 | 长序列建模 |
| 大规模检索 | 双塔模型、MIND | 高效召回 | 精排精度 |

### 深度推荐的核心优势

**1. 自动特征交叉**

传统方法需要手工设计特征组合，而深度模型可以自动学习高阶特征交互：

$$\text{传统: } y = w_1 x_1 + w_2 x_2 + w_{12} x_1 x_2 + ...$$

$$\text{深度: } y = f(x_1, x_2, ..., x_n) \text{ (自动学习任意阶交叉)}$$

**2. 多模态信息融合**

深度模型可以轻松融合不同类型的特征：
- 用户画像特征（稠密特征）
- 物品属性特征（类别特征）
- 行为序列特征（序列特征）
- 图文内容特征（多模态特征）

**3. 端到端学习**

从原始特征到最终预测，整个流程可以端到端优化：

```
原始特征 -> Embedding -> 特征交叉 -> 深度网络 -> 预测
```

### 推荐系统架构

现代推荐系统通常采用多阶段架构：

```
候选集(百万级)
    ↓ 召回层 (双塔模型、多路召回)
粗排集(万级)
    ↓ 粗排层 (简单模型快速筛选)
精排集(千级)
    ↓ 精排层 (复杂模型精细排序)
重排集(百级)
    ↓ 重排层 (多样性、业务规则)
展示结果(十级)
```

---

## Wide & Deep模型

### 模型动机

Google于2016年提出Wide & Deep模型，旨在同时实现：
- **记忆能力（Memorization）**：记住历史数据中的直接特征组合
- **泛化能力（Generalization）**：通过深度网络学习特征间的潜在关系

### 模型结构

Wide & Deep由两部分组成：

**Wide部分（线性模型）：**

$$y_{wide} = \mathbf{w}^T [\mathbf{x}, \phi(\mathbf{x})] + b$$

其中 $\phi(\mathbf{x})$ 是手工设计的交叉特征。

**Deep部分（深度神经网络）：**

$$\mathbf{a}^{(l+1)} = f(W^{(l)} \mathbf{a}^{(l)} + \mathbf{b}^{(l)})$$

**联合训练：**

$$P(y=1|\mathbf{x}) = \sigma(y_{wide} + y_{deep})$$

### PyTorch实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class WideAndDeep(nn.Module):
    """
    Wide & Deep模型

    参数:
        wide_dim: Wide部分输入维度（包含交叉特征）
        deep_input_dims: Deep部分各特征域的维度列表
        embed_dim: 嵌入维度
        hidden_dims: 隐藏层维度列表
        num_classes: 输出类别数（二分类为1）
        dropout: Dropout比率
    """
    def __init__(
        self,
        wide_dim: int,
        deep_input_dims: list,
        embed_dim: int = 8,
        hidden_dims: list = [256, 128, 64],
        num_classes: int = 1,
        dropout: float = 0.2
    ):
        super().__init__()

        # Wide部分：线性层
        self.wide = nn.Linear(wide_dim, num_classes)

        # Deep部分：Embedding层
        self.embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in deep_input_dims
        ])

        # Deep部分：MLP层
        deep_input_dim = len(deep_input_dims) * embed_dim
        layers = []
        prev_dim = deep_input_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, num_classes))
        self.deep = nn.Sequential(*layers)

    def forward(self, wide_input, deep_inputs):
        """
        前向传播

        参数:
            wide_input: Wide部分输入 (batch_size, wide_dim)
            deep_inputs: Deep部分输入列表 [(batch_size,), ...]

        返回:
            预测logits (batch_size, num_classes)
        """
        # Wide部分
        wide_out = self.wide(wide_input)

        # Deep部分：Embedding
        embed_list = [
            emb(deep_inputs[i])
            for i, emb in enumerate(self.embeddings)
        ]
        deep_input = torch.cat(embed_list, dim=-1)

        # Deep部分：MLP
        deep_out = self.deep(deep_input)

        # 联合输出
        output = wide_out + deep_out
        return output


# 使用示例
def demo_wide_and_deep():
    # 模拟数据
    batch_size = 32
    wide_dim = 100  # Wide特征维度

    # Deep部分：假设有5个类别特征，每个特征的取值数量
    deep_input_dims = [1000, 500, 100, 50, 20]  # 用户ID、物品ID、类目等

    # 创建模型
    model = WideAndDeep(
        wide_dim=wide_dim,
        deep_input_dims=deep_input_dims,
        embed_dim=16,
        hidden_dims=[256, 128, 64]
    )

    # 模拟输入
    wide_input = torch.randn(batch_size, wide_dim)
    deep_inputs = [
        torch.randint(0, dim, (batch_size,))
        for dim in deep_input_dims
    ]

    # 前向传播
    output = model(wide_input, deep_inputs)
    print(f"输出形状: {output.shape}")  # (32, 1)

    # 计算预测概率
    prob = torch.sigmoid(output)
    print(f"预测概率范围: [{prob.min():.4f}, {prob.max():.4f}]")


if __name__ == "__main__":
    demo_wide_and_deep()
```

### Wide & Deep的优缺点

**优点：**
- 结合了线性模型和深度模型的优势
- Wide部分可以记住重要的特征组合
- Deep部分可以泛化到未见过的特征组合

**缺点：**
- Wide部分需要手工设计交叉特征
- 特征工程依然重要
- 模型结构相对简单

---

## DeepFM模型

### 模型动机

DeepFM（2017）在Wide & Deep基础上，用FM（因子分解机）替换了Wide部分，实现了自动的二阶特征交叉，无需手工设计交叉特征。

### FM因子分解机

FM通过隐向量实现特征交叉：

$$y_{FM} = w_0 + \sum_{i=1}^{n} w_i x_i + \sum_{i=1}^{n} \sum_{j=i+1}^{n} \langle \mathbf{v}_i, \mathbf{v}_j \rangle x_i x_j$$

其中 $\mathbf{v}_i$ 是特征 $i$ 的隐向量，$\langle \cdot, \cdot \rangle$ 表示内积。

**FM的计算优化：**

二阶交叉项可以优化为 $O(nk)$ 复杂度：

$$\sum_{i=1}^{n} \sum_{j=i+1}^{n} \langle \mathbf{v}_i, \mathbf{v}_j \rangle x_i x_j = \frac{1}{2} \sum_{f=1}^{k} \left[ \left( \sum_{i=1}^{n} v_{i,f} x_i \right)^2 - \sum_{i=1}^{n} v_{i,f}^2 x_i^2 \right]$$

### DeepFM模型结构

```
输入特征
    ↓
Embedding层（共享）
    ↓
  ┌─────┴─────┐
  ↓           ↓
FM层        DNN层
  ↓           ↓
  └─────┬─────┘
        ↓
    联合输出
```

### PyTorch实现

```python
import torch
import torch.nn as nn


class FMLayer(nn.Module):
    """
    FM因子分解机层
    实现二阶特征交叉
    """
    def __init__(self):
        super().__init__()

    def forward(self, embeddings):
        """
        参数:
            embeddings: (batch_size, num_fields, embed_dim)
        返回:
            fm_output: (batch_size, 1)
        """
        # 优化计算 O(n*k)
        # sum_of_square: (batch_size, embed_dim)
        sum_of_square = torch.sum(embeddings, dim=1) ** 2
        # square_of_sum: (batch_size, embed_dim)
        square_of_sum = torch.sum(embeddings ** 2, dim=1)
        # 二阶交叉: (batch_size, 1)
        fm_output = 0.5 * torch.sum(sum_of_square - square_of_sum, dim=1, keepdim=True)

        return fm_output


class DeepFM(nn.Module):
    """
    DeepFM模型

    参数:
        feature_dims: 各特征域的维度列表
        embed_dim: 嵌入维度
        hidden_dims: DNN隐藏层维度
        dropout: Dropout比率
    """
    def __init__(
        self,
        feature_dims: list,
        embed_dim: int = 8,
        hidden_dims: list = [256, 128, 64],
        dropout: float = 0.2
    ):
        super().__init__()

        self.num_fields = len(feature_dims)
        self.embed_dim = embed_dim

        # 一阶特征权重
        self.first_order_weights = nn.ModuleList([
            nn.Embedding(dim, 1) for dim in feature_dims
        ])

        # 共享Embedding层（用于FM和DNN）
        self.embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in feature_dims
        ])

        # FM层
        self.fm = FMLayer()

        # DNN层
        dnn_input_dim = self.num_fields * embed_dim
        layers = []
        prev_dim = dnn_input_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, 1))
        self.dnn = nn.Sequential(*layers)

        # 偏置项
        self.bias = nn.Parameter(torch.zeros(1))

    def forward(self, inputs):
        """
        参数:
            inputs: 特征输入列表 [(batch_size,), ...]
        返回:
            logits: (batch_size, 1)
        """
        # 一阶特征
        first_order = torch.cat([
            self.first_order_weights[i](inputs[i])
            for i in range(self.num_fields)
        ], dim=1).sum(dim=1, keepdim=True)

        # 获取Embedding（共享）
        embeddings = torch.stack([
            self.embeddings[i](inputs[i])
            for i in range(self.num_fields)
        ], dim=1)  # (batch_size, num_fields, embed_dim)

        # FM二阶交叉
        fm_output = self.fm(embeddings)

        # DNN
        dnn_input = embeddings.view(-1, self.num_fields * self.embed_dim)
        dnn_output = self.dnn(dnn_input)

        # 联合输出
        output = self.bias + first_order + fm_output + dnn_output

        return output


class DeepFMWithDenseFeatures(nn.Module):
    """
    支持稠密特征的DeepFM
    同时处理类别特征和数值特征
    """
    def __init__(
        self,
        sparse_feature_dims: list,
        dense_feature_dim: int,
        embed_dim: int = 8,
        hidden_dims: list = [256, 128, 64],
        dropout: float = 0.2
    ):
        super().__init__()

        self.num_sparse_fields = len(sparse_feature_dims)
        self.dense_feature_dim = dense_feature_dim
        self.embed_dim = embed_dim

        # 稀疏特征Embedding
        self.sparse_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in sparse_feature_dims
        ])

        # 稀疏特征一阶权重
        self.sparse_first_order = nn.ModuleList([
            nn.Embedding(dim, 1) for dim in sparse_feature_dims
        ])

        # 稠密特征处理
        self.dense_embedding = nn.Linear(dense_feature_dim,
                                         dense_feature_dim * embed_dim)
        self.dense_first_order = nn.Linear(dense_feature_dim, 1)

        # FM层
        self.fm = FMLayer()

        # DNN层
        total_fields = self.num_sparse_fields + dense_feature_dim
        dnn_input_dim = total_fields * embed_dim

        layers = []
        prev_dim = dnn_input_dim
        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))
        self.dnn = nn.Sequential(*layers)

        self.bias = nn.Parameter(torch.zeros(1))

    def forward(self, sparse_inputs, dense_inputs):
        """
        参数:
            sparse_inputs: 稀疏特征列表 [(batch_size,), ...]
            dense_inputs: 稠密特征 (batch_size, dense_feature_dim)
        """
        batch_size = dense_inputs.shape[0]

        # 一阶特征
        sparse_first = torch.cat([
            self.sparse_first_order[i](sparse_inputs[i])
            for i in range(self.num_sparse_fields)
        ], dim=1).sum(dim=1, keepdim=True)

        dense_first = self.dense_first_order(dense_inputs)
        first_order = sparse_first + dense_first

        # 稀疏特征Embedding
        sparse_embeds = torch.stack([
            self.sparse_embeddings[i](sparse_inputs[i])
            for i in range(self.num_sparse_fields)
        ], dim=1)  # (batch_size, num_sparse, embed_dim)

        # 稠密特征Embedding
        dense_embeds = self.dense_embedding(dense_inputs)
        dense_embeds = dense_embeds.view(
            batch_size, self.dense_feature_dim, self.embed_dim
        )  # (batch_size, dense_dim, embed_dim)

        # 合并所有Embedding
        all_embeds = torch.cat([sparse_embeds, dense_embeds], dim=1)

        # FM交叉
        fm_output = self.fm(all_embeds)

        # DNN
        dnn_input = all_embeds.view(batch_size, -1)
        dnn_output = self.dnn(dnn_input)

        # 输出
        output = self.bias + first_order + fm_output + dnn_output
        return output


# 使用示例
def demo_deepfm():
    batch_size = 64

    # 定义特征维度
    sparse_dims = [10000, 5000, 1000, 500, 100]  # 5个类别特征
    dense_dim = 13  # 13个数值特征

    # 创建模型
    model = DeepFMWithDenseFeatures(
        sparse_feature_dims=sparse_dims,
        dense_feature_dim=dense_dim,
        embed_dim=16,
        hidden_dims=[256, 128, 64]
    )

    # 模拟输入
    sparse_inputs = [
        torch.randint(0, dim, (batch_size,))
        for dim in sparse_dims
    ]
    dense_inputs = torch.randn(batch_size, dense_dim)

    # 前向传播
    output = model(sparse_inputs, dense_inputs)
    print(f"DeepFM输出形状: {output.shape}")

    # 计算模型参数量
    total_params = sum(p.numel() for p in model.parameters())
    print(f"模型参数量: {total_params:,}")


if __name__ == "__main__":
    demo_deepfm()
```

### DeepFM的关键点

**1. Embedding共享**

FM层和DNN层共享同一套Embedding，这是DeepFM的核心设计：
- 减少参数量
- FM和DNN可以相互增强

**2. 无需特征工程**

相比Wide & Deep，DeepFM不需要手工设计交叉特征，FM层自动学习二阶交叉。

**3. 端到端训练**

整个模型可以端到端联合训练，避免了分阶段训练的复杂性。

---

## Deep Interest Network (DIN)

### 模型动机

传统推荐模型将用户历史行为通过简单的pooling（如mean/max）压缩成固定向量，丢失了行为的多样性信息。DIN（阿里巴巴，2018）引入注意力机制，针对不同的候选物品，自适应地从用户历史行为中提取相关兴趣。

### 核心思想

用户的兴趣是多样的，对于不同的候选物品，相关的历史行为不同：

- 用户浏览过：手机壳、耳机、运动鞋、书籍
- 候选物品：蓝牙耳机
- DIN关注：主要关注"耳机"这个历史行为

### 注意力权重计算

DIN使用一个小的注意力网络计算权重：

$$\alpha_i = \frac{\exp(a(\mathbf{e}_i, \mathbf{e}_a))}{\sum_j \exp(a(\mathbf{e}_j, \mathbf{e}_a))}$$

其中 $\mathbf{e}_i$ 是历史行为embedding，$\mathbf{e}_a$ 是候选物品embedding，$a(\cdot)$ 是注意力网络。

**注意力网络设计：**

```
[e_i, e_a, e_i - e_a, e_i * e_a] -> MLP -> attention_score
```

### PyTorch实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class AttentionLayer(nn.Module):
    """
    DIN注意力层
    计算候选物品与历史行为之间的注意力权重
    """
    def __init__(self, embed_dim: int, hidden_dims: list = [64, 32]):
        super().__init__()

        # 注意力网络输入: [embed, embed, embed-embed, embed*embed]
        input_dim = embed_dim * 4

        layers = []
        prev_dim = input_dim
        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.PReLU(),  # DIN使用PReLU
            ])
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))

        self.attention_net = nn.Sequential(*layers)

    def forward(self, query, keys, keys_mask=None):
        """
        参数:
            query: 候选物品embedding (batch_size, embed_dim)
            keys: 历史行为embedding (batch_size, seq_len, embed_dim)
            keys_mask: 历史行为mask (batch_size, seq_len), True表示有效
        返回:
            weighted_sum: 加权后的用户兴趣 (batch_size, embed_dim)
            attention_weights: 注意力权重 (batch_size, seq_len)
        """
        batch_size, seq_len, embed_dim = keys.shape

        # 扩展query以匹配keys的形状
        query = query.unsqueeze(1).expand(-1, seq_len, -1)

        # 构建注意力网络输入
        attention_input = torch.cat([
            keys,                    # 原始embedding
            query,                   # 候选embedding
            keys - query,            # 差值
            keys * query             # 元素积
        ], dim=-1)  # (batch_size, seq_len, embed_dim * 4)

        # 计算注意力分数
        attention_scores = self.attention_net(attention_input)
        attention_scores = attention_scores.squeeze(-1)  # (batch_size, seq_len)

        # 应用mask
        if keys_mask is not None:
            attention_scores = attention_scores.masked_fill(
                ~keys_mask, float('-inf')
            )

        # Softmax归一化
        attention_weights = F.softmax(attention_scores, dim=-1)

        # 处理全mask的情况
        if keys_mask is not None:
            attention_weights = attention_weights.masked_fill(
                ~keys_mask, 0.0
            )

        # 加权求和
        weighted_sum = torch.bmm(
            attention_weights.unsqueeze(1),
            keys
        ).squeeze(1)  # (batch_size, embed_dim)

        return weighted_sum, attention_weights


class DIN(nn.Module):
    """
    Deep Interest Network

    参数:
        user_feature_dims: 用户特征维度列表
        item_feature_dims: 物品特征维度列表
        embed_dim: 嵌入维度
        attention_hidden: 注意力网络隐藏层
        mlp_hidden: MLP隐藏层
        dropout: Dropout比率
    """
    def __init__(
        self,
        user_feature_dims: list,
        item_feature_dims: list,
        embed_dim: int = 32,
        attention_hidden: list = [64, 32],
        mlp_hidden: list = [256, 128, 64],
        dropout: float = 0.2
    ):
        super().__init__()

        self.embed_dim = embed_dim

        # 用户特征Embedding
        self.user_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in user_feature_dims
        ])

        # 物品特征Embedding
        self.item_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in item_feature_dims
        ])

        # 注意力层
        item_embed_total = len(item_feature_dims) * embed_dim
        self.attention = AttentionLayer(
            embed_dim=item_embed_total,
            hidden_dims=attention_hidden
        )

        # MLP层
        user_embed_total = len(user_feature_dims) * embed_dim
        mlp_input_dim = user_embed_total + item_embed_total * 2  # 用户 + 兴趣 + 候选

        layers = []
        prev_dim = mlp_input_dim
        for hidden_dim in mlp_hidden:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.PReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))
        self.mlp = nn.Sequential(*layers)

    def forward(
        self,
        user_features,
        candidate_features,
        history_features,
        history_mask=None
    ):
        """
        参数:
            user_features: 用户特征列表 [(batch_size,), ...]
            candidate_features: 候选物品特征列表 [(batch_size,), ...]
            history_features: 历史行为特征列表 [(batch_size, seq_len), ...]
            history_mask: 历史行为mask (batch_size, seq_len)
        返回:
            logits: (batch_size, 1)
        """
        # 用户特征Embedding
        user_embeds = torch.cat([
            emb(user_features[i])
            for i, emb in enumerate(self.user_embeddings)
        ], dim=-1)  # (batch_size, user_embed_total)

        # 候选物品Embedding
        candidate_embeds = torch.cat([
            emb(candidate_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)  # (batch_size, item_embed_total)

        # 历史行为Embedding
        batch_size = history_features[0].shape[0]
        seq_len = history_features[0].shape[1]

        history_embeds = torch.cat([
            emb(history_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)  # (batch_size, seq_len, item_embed_total)

        # 注意力计算
        interest_embed, attention_weights = self.attention(
            candidate_embeds,
            history_embeds,
            history_mask
        )

        # 拼接所有特征
        concat_features = torch.cat([
            user_embeds,
            interest_embed,
            candidate_embeds
        ], dim=-1)

        # MLP预测
        output = self.mlp(concat_features)

        return output, attention_weights


# DIN使用示例
def demo_din():
    batch_size = 32
    seq_len = 50  # 历史行为序列长度

    # 特征维度定义
    user_dims = [100000, 1000, 100]  # 用户ID、年龄段、性别
    item_dims = [500000, 10000, 1000]  # 物品ID、品牌、类目

    # 创建模型
    model = DIN(
        user_feature_dims=user_dims,
        item_feature_dims=item_dims,
        embed_dim=16,
        attention_hidden=[64, 32],
        mlp_hidden=[256, 128, 64]
    )

    # 模拟输入
    user_features = [
        torch.randint(0, dim, (batch_size,))
        for dim in user_dims
    ]

    candidate_features = [
        torch.randint(0, dim, (batch_size,))
        for dim in item_dims
    ]

    history_features = [
        torch.randint(0, dim, (batch_size, seq_len))
        for dim in item_dims
    ]

    # 历史行为mask（模拟不等长序列）
    history_lengths = torch.randint(10, seq_len, (batch_size,))
    history_mask = torch.arange(seq_len).expand(batch_size, -1) < history_lengths.unsqueeze(1)

    # 前向传播
    output, attention_weights = model(
        user_features,
        candidate_features,
        history_features,
        history_mask
    )

    print(f"DIN输出形状: {output.shape}")
    print(f"注意力权重形状: {attention_weights.shape}")

    # 验证注意力权重
    print(f"注意力权重和（应接近1）: {attention_weights[0, :history_lengths[0]].sum():.4f}")


if __name__ == "__main__":
    demo_din()
```

### DIN的Dice激活函数

DIN还提出了Dice（Data-adaptive Activation Function），一种数据自适应的激活函数：

```python
class Dice(nn.Module):
    """
    Dice激活函数
    f(s) = p(s) * s + (1 - p(s)) * alpha * s
    其中 p(s) = sigmoid((s - E[s]) / sqrt(Var[s] + eps))
    """
    def __init__(self, num_features, eps=1e-8):
        super().__init__()
        self.bn = nn.BatchNorm1d(num_features, affine=False)
        self.alpha = nn.Parameter(torch.zeros(num_features))
        self.eps = eps

    def forward(self, x):
        # 标准化
        x_norm = self.bn(x)
        # 计算概率
        p = torch.sigmoid(x_norm)
        # Dice激活
        return p * x + (1 - p) * self.alpha * x
```

---

## DIEN序列模型

### 模型动机

DIN只考虑了用户兴趣的多样性，但没有建模兴趣的演化过程。DIEN（Deep Interest Evolution Network，2019）引入了GRU来捕捉兴趣的时序演化。

### 模型结构

DIEN包含三个核心模块：

1. **行为序列层**：将原始行为序列转换为embedding序列
2. **兴趣提取层**：使用GRU提取用户兴趣序列
3. **兴趣演化层**：使用带注意力的GRU（AUGRU）捕捉兴趣演化

### PyTorch实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class AUGRUCell(nn.Module):
    """
    Attention Update GRU Cell
    在GRU更新门上加入注意力权重
    """
    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size

        # 重置门
        self.W_r = nn.Linear(input_size + hidden_size, hidden_size)
        # 更新门
        self.W_z = nn.Linear(input_size + hidden_size, hidden_size)
        # 候选隐状态
        self.W_h = nn.Linear(input_size + hidden_size, hidden_size)

    def forward(self, x, h_prev, attention_score):
        """
        参数:
            x: 输入 (batch_size, input_size)
            h_prev: 上一时刻隐状态 (batch_size, hidden_size)
            attention_score: 注意力分数 (batch_size, 1)
        返回:
            h: 当前隐状态 (batch_size, hidden_size)
        """
        combined = torch.cat([x, h_prev], dim=-1)

        # 重置门
        r = torch.sigmoid(self.W_r(combined))
        # 更新门（原始）
        z = torch.sigmoid(self.W_z(combined))

        # 使用注意力调整更新门
        z_hat = attention_score * z

        # 候选隐状态
        combined_reset = torch.cat([x, r * h_prev], dim=-1)
        h_tilde = torch.tanh(self.W_h(combined_reset))

        # 最终隐状态
        h = (1 - z_hat) * h_prev + z_hat * h_tilde

        return h


class InterestExtractorLayer(nn.Module):
    """
    兴趣提取层
    使用GRU从行为序列中提取兴趣序列
    """
    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            batch_first=True
        )

    def forward(self, behavior_embeds, behavior_mask=None):
        """
        参数:
            behavior_embeds: (batch_size, seq_len, embed_dim)
            behavior_mask: (batch_size, seq_len)
        返回:
            interest_states: (batch_size, seq_len, hidden_size)
        """
        if behavior_mask is not None:
            # 获取实际序列长度
            lengths = behavior_mask.sum(dim=1).cpu()
            # Pack序列
            packed = nn.utils.rnn.pack_padded_sequence(
                behavior_embeds,
                lengths,
                batch_first=True,
                enforce_sorted=False
            )
            output, _ = self.gru(packed)
            interest_states, _ = nn.utils.rnn.pad_packed_sequence(
                output, batch_first=True
            )
        else:
            interest_states, _ = self.gru(behavior_embeds)

        return interest_states


class InterestEvolutionLayer(nn.Module):
    """
    兴趣演化层
    使用AUGRU捕捉与目标物品相关的兴趣演化
    """
    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.hidden_size = hidden_size
        self.augru_cell = AUGRUCell(input_size, hidden_size)

        # 注意力网络
        self.attention_net = nn.Sequential(
            nn.Linear(input_size * 4, 64),
            nn.PReLU(),
            nn.Linear(64, 1)
        )

    def forward(self, interest_states, target_embed, mask=None):
        """
        参数:
            interest_states: 兴趣序列 (batch_size, seq_len, input_size)
            target_embed: 目标物品embedding (batch_size, input_size)
            mask: 序列mask (batch_size, seq_len)
        返回:
            final_interest: 最终兴趣表示 (batch_size, hidden_size)
        """
        batch_size, seq_len, _ = interest_states.shape
        device = interest_states.device

        # 计算注意力分数
        target_expanded = target_embed.unsqueeze(1).expand(-1, seq_len, -1)
        attention_input = torch.cat([
            interest_states,
            target_expanded,
            interest_states - target_expanded,
            interest_states * target_expanded
        ], dim=-1)

        attention_scores = self.attention_net(attention_input).squeeze(-1)

        if mask is not None:
            attention_scores = attention_scores.masked_fill(~mask, float('-inf'))

        attention_weights = F.softmax(attention_scores, dim=-1)

        if mask is not None:
            attention_weights = attention_weights.masked_fill(~mask, 0.0)

        # AUGRU前向传播
        h = torch.zeros(batch_size, self.hidden_size, device=device)

        for t in range(seq_len):
            x_t = interest_states[:, t, :]
            a_t = attention_weights[:, t:t+1]
            h = self.augru_cell(x_t, h, a_t)

        return h


class DIEN(nn.Module):
    """
    Deep Interest Evolution Network

    参数:
        user_feature_dims: 用户特征维度
        item_feature_dims: 物品特征维度
        embed_dim: 嵌入维度
        gru_hidden_size: GRU隐藏层大小
        mlp_hidden: MLP隐藏层
    """
    def __init__(
        self,
        user_feature_dims: list,
        item_feature_dims: list,
        embed_dim: int = 32,
        gru_hidden_size: int = 64,
        mlp_hidden: list = [256, 128, 64],
        dropout: float = 0.2
    ):
        super().__init__()

        self.embed_dim = embed_dim

        # Embedding层
        self.user_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in user_feature_dims
        ])
        self.item_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in item_feature_dims
        ])

        item_embed_total = len(item_feature_dims) * embed_dim

        # 兴趣提取层
        self.interest_extractor = InterestExtractorLayer(
            input_size=item_embed_total,
            hidden_size=gru_hidden_size
        )

        # 兴趣演化层
        self.interest_evolution = InterestEvolutionLayer(
            input_size=gru_hidden_size,
            hidden_size=gru_hidden_size
        )

        # 辅助损失：预测下一个行为
        self.auxiliary_net = nn.Linear(gru_hidden_size, item_embed_total)

        # MLP层
        user_embed_total = len(user_feature_dims) * embed_dim
        mlp_input_dim = user_embed_total + gru_hidden_size + item_embed_total

        layers = []
        prev_dim = mlp_input_dim
        for hidden_dim in mlp_hidden:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.PReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))
        self.mlp = nn.Sequential(*layers)

    def forward(
        self,
        user_features,
        candidate_features,
        history_features,
        history_mask=None,
        neg_history_features=None
    ):
        """
        参数:
            user_features: 用户特征
            candidate_features: 候选物品特征
            history_features: 历史正样本行为
            history_mask: 历史行为mask
            neg_history_features: 历史负样本（用于辅助损失）
        返回:
            logits: 预测分数
            auxiliary_loss: 辅助损失
        """
        # 用户Embedding
        user_embeds = torch.cat([
            emb(user_features[i])
            for i, emb in enumerate(self.user_embeddings)
        ], dim=-1)

        # 候选物品Embedding
        candidate_embeds = torch.cat([
            emb(candidate_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)

        # 历史行为Embedding
        history_embeds = torch.cat([
            emb(history_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)

        # 兴趣提取
        interest_states = self.interest_extractor(history_embeds, history_mask)

        # 兴趣演化
        evolved_interest = self.interest_evolution(
            interest_states, candidate_embeds, history_mask
        )

        # 拼接并预测
        concat_features = torch.cat([
            user_embeds,
            evolved_interest,
            candidate_embeds
        ], dim=-1)

        logits = self.mlp(concat_features)

        # 计算辅助损失
        auxiliary_loss = None
        if neg_history_features is not None and self.training:
            auxiliary_loss = self._auxiliary_loss(
                interest_states,
                history_embeds,
                neg_history_features,
                history_mask
            )

        return logits, auxiliary_loss

    def _auxiliary_loss(
        self,
        interest_states,
        pos_embeds,
        neg_features,
        mask
    ):
        """
        辅助损失：使用兴趣状态预测下一个行为
        """
        # 负样本Embedding
        neg_embeds = torch.cat([
            emb(neg_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)

        # 用h_t预测e_{t+1}
        pred_embeds = self.auxiliary_net(interest_states[:, :-1, :])
        pos_next = pos_embeds[:, 1:, :]
        neg_next = neg_embeds[:, 1:, :]

        # 正样本得分
        pos_scores = (pred_embeds * pos_next).sum(dim=-1)
        # 负样本得分
        neg_scores = (pred_embeds * neg_next).sum(dim=-1)

        # 交叉熵损失
        if mask is not None:
            mask = mask[:, 1:]  # 对齐
            pos_scores = pos_scores.masked_fill(~mask, 0)
            neg_scores = neg_scores.masked_fill(~mask, 0)
            valid_count = mask.sum()
        else:
            valid_count = pos_scores.numel()

        loss = -torch.log(torch.sigmoid(pos_scores - neg_scores) + 1e-8)

        return loss.sum() / (valid_count + 1e-8)


# DIEN使用示例
def demo_dien():
    batch_size = 32
    seq_len = 50

    user_dims = [100000, 100, 10]
    item_dims = [500000, 10000, 1000]

    model = DIEN(
        user_feature_dims=user_dims,
        item_feature_dims=item_dims,
        embed_dim=16,
        gru_hidden_size=64,
        mlp_hidden=[256, 128, 64]
    )

    # 模拟数据
    user_features = [torch.randint(0, d, (batch_size,)) for d in user_dims]
    candidate_features = [torch.randint(0, d, (batch_size,)) for d in item_dims]
    history_features = [torch.randint(0, d, (batch_size, seq_len)) for d in item_dims]
    neg_history_features = [torch.randint(0, d, (batch_size, seq_len)) for d in item_dims]

    history_lengths = torch.randint(10, seq_len, (batch_size,))
    history_mask = torch.arange(seq_len).expand(batch_size, -1) < history_lengths.unsqueeze(1)

    model.train()
    logits, aux_loss = model(
        user_features,
        candidate_features,
        history_features,
        history_mask,
        neg_history_features
    )

    print(f"DIEN输出形状: {logits.shape}")
    print(f"辅助损失: {aux_loss:.4f}")


if __name__ == "__main__":
    demo_dien()
```

---

## 双塔模型架构

### 模型动机

在大规模推荐系统中，候选物品可能达到百万甚至千万级别。双塔模型将用户和物品分别编码为独立的向量，通过向量相似度进行快速检索。

### 双塔结构

```
用户特征                物品特征
    ↓                       ↓
用户塔(User Tower)    物品塔(Item Tower)
    ↓                       ↓
用户向量                物品向量
    ↓                       ↓
    └───────┬───────────────┘
            ↓
      相似度计算(内积/余弦)
            ↓
         预测分数
```

### PyTorch实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class Tower(nn.Module):
    """
    塔结构：多层MLP
    """
    def __init__(
        self,
        input_dim: int,
        hidden_dims: list,
        output_dim: int,
        dropout: float = 0.2
    ):
        super().__init__()

        layers = []
        prev_dim = input_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, output_dim))
        self.mlp = nn.Sequential(*layers)

    def forward(self, x):
        return self.mlp(x)


class TwoTowerModel(nn.Module):
    """
    双塔模型

    参数:
        user_feature_dims: 用户特征维度列表
        item_feature_dims: 物品特征维度列表
        embed_dim: 嵌入维度
        tower_hidden: 塔内隐藏层
        output_dim: 输出向量维度
        temperature: Softmax温度系数
    """
    def __init__(
        self,
        user_feature_dims: list,
        item_feature_dims: list,
        embed_dim: int = 32,
        tower_hidden: list = [256, 128],
        output_dim: int = 64,
        temperature: float = 0.05,
        dropout: float = 0.2
    ):
        super().__init__()

        self.temperature = temperature

        # 用户特征Embedding
        self.user_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in user_feature_dims
        ])

        # 物品特征Embedding
        self.item_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in item_feature_dims
        ])

        # 用户塔
        user_input_dim = len(user_feature_dims) * embed_dim
        self.user_tower = Tower(
            input_dim=user_input_dim,
            hidden_dims=tower_hidden,
            output_dim=output_dim,
            dropout=dropout
        )

        # 物品塔
        item_input_dim = len(item_feature_dims) * embed_dim
        self.item_tower = Tower(
            input_dim=item_input_dim,
            hidden_dims=tower_hidden,
            output_dim=output_dim,
            dropout=dropout
        )

    def get_user_embedding(self, user_features):
        """获取用户向量"""
        user_embeds = torch.cat([
            emb(user_features[i])
            for i, emb in enumerate(self.user_embeddings)
        ], dim=-1)
        user_vector = self.user_tower(user_embeds)
        # L2归一化
        user_vector = F.normalize(user_vector, p=2, dim=-1)
        return user_vector

    def get_item_embedding(self, item_features):
        """获取物品向量"""
        item_embeds = torch.cat([
            emb(item_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)
        item_vector = self.item_tower(item_embeds)
        # L2归一化
        item_vector = F.normalize(item_vector, p=2, dim=-1)
        return item_vector

    def forward(self, user_features, item_features):
        """
        前向传播
        返回用户向量、物品向量和相似度分数
        """
        user_vector = self.get_user_embedding(user_features)
        item_vector = self.get_item_embedding(item_features)

        # 计算相似度（内积）
        similarity = torch.sum(user_vector * item_vector, dim=-1, keepdim=True)

        return user_vector, item_vector, similarity

    def compute_loss(
        self,
        user_features,
        pos_item_features,
        neg_item_features=None,
        in_batch_neg=True
    ):
        """
        计算损失

        参数:
            user_features: 用户特征
            pos_item_features: 正样本物品特征
            neg_item_features: 负样本物品特征（可选）
            in_batch_neg: 是否使用batch内负采样
        """
        user_vectors = self.get_user_embedding(user_features)
        pos_item_vectors = self.get_item_embedding(pos_item_features)

        if in_batch_neg:
            # Batch内负采样：每个用户的正样本是其他用户的负样本
            # 计算所有user-item对的相似度
            similarity_matrix = torch.mm(
                user_vectors, pos_item_vectors.t()
            ) / self.temperature  # (batch_size, batch_size)

            # 对角线是正样本
            labels = torch.arange(
                similarity_matrix.size(0),
                device=similarity_matrix.device
            )

            # 交叉熵损失
            loss = F.cross_entropy(similarity_matrix, labels)

        else:
            # 显式负采样
            neg_item_vectors = self.get_item_embedding(neg_item_features)

            pos_scores = torch.sum(
                user_vectors * pos_item_vectors, dim=-1
            ) / self.temperature
            neg_scores = torch.sum(
                user_vectors * neg_item_vectors, dim=-1
            ) / self.temperature

            # BPR损失或交叉熵损失
            loss = -torch.log(
                torch.sigmoid(pos_scores - neg_scores) + 1e-8
            ).mean()

        return loss


# 双塔模型使用示例
def demo_two_tower():
    batch_size = 128

    user_dims = [100000, 100, 10, 5]  # 用户ID、年龄、性别、会员等级
    item_dims = [500000, 10000, 1000, 100]  # 物品ID、品牌、类目、标签

    model = TwoTowerModel(
        user_feature_dims=user_dims,
        item_feature_dims=item_dims,
        embed_dim=32,
        tower_hidden=[256, 128],
        output_dim=64,
        temperature=0.05
    )

    # 模拟数据
    user_features = [torch.randint(0, d, (batch_size,)) for d in user_dims]
    pos_item_features = [torch.randint(0, d, (batch_size,)) for d in item_dims]

    # 训练模式
    model.train()
    loss = model.compute_loss(user_features, pos_item_features, in_batch_neg=True)
    print(f"训练损失: {loss:.4f}")

    # 推理模式：获取向量
    model.set_eval_mode()
    with torch.no_grad():
        user_vectors = model.get_user_embedding(user_features)
        item_vectors = model.get_item_embedding(pos_item_features)

        print(f"用户向量形状: {user_vectors.shape}")
        print(f"物品向量形状: {item_vectors.shape}")

        # 验证L2归一化
        print(f"向量范数: {torch.norm(user_vectors[0]):.4f}")


if __name__ == "__main__":
    demo_two_tower()
```

### 双塔模型的部署

双塔模型的关键优势是可以预计算物品向量，实现高效检索：

```python
import faiss
import numpy as np


class TwoTowerRetrieval:
    """
    双塔模型召回服务
    """
    def __init__(self, model, item_features_dict, device='cuda'):
        self.model = model
        self.device = device
        self.model.set_eval_mode()

        # 预计算所有物品向量
        self._build_item_index(item_features_dict)

    def _build_item_index(self, item_features_dict):
        """构建物品向量索引"""
        item_ids = list(item_features_dict.keys())
        item_vectors = []

        with torch.no_grad():
            for item_id in item_ids:
                features = item_features_dict[item_id]
                # 转换为tensor并获取向量
                features = [
                    torch.tensor([f]).to(self.device)
                    for f in features
                ]
                vector = self.model.get_item_embedding(features)
                item_vectors.append(vector.cpu().numpy())

        item_vectors = np.vstack(item_vectors).astype('float32')

        # 构建Faiss索引
        dimension = item_vectors.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # 内积相似度
        self.index.add(item_vectors)

        self.item_ids = item_ids
        print(f"索引构建完成，共 {len(item_ids)} 个物品")

    def retrieve(self, user_features, top_k=100):
        """
        召回Top-K物品

        参数:
            user_features: 用户特征
            top_k: 召回数量
        返回:
            item_ids: 召回物品ID列表
            scores: 相似度分数列表
        """
        with torch.no_grad():
            features = [
                torch.tensor([f]).to(self.device)
                for f in user_features
            ]
            user_vector = self.model.get_user_embedding(features)
            user_vector = user_vector.cpu().numpy().astype('float32')

        # Faiss检索
        scores, indices = self.index.search(user_vector, top_k)

        # 转换为物品ID
        retrieved_items = [self.item_ids[i] for i in indices[0]]

        return retrieved_items, scores[0].tolist()
```

---

## 负采样策略

### 负采样的重要性

在推荐系统中，正样本（用户交互过的物品）相对稀少，负样本的选择对模型性能影响很大。

### 常见负采样策略

**1. 随机负采样**

最简单的方式，从所有物品中随机选择：

```python
def random_negative_sampling(
    num_items: int,
    positive_items: set,
    num_negatives: int
) -> list:
    """
    随机负采样

    参数:
        num_items: 物品总数
        positive_items: 正样本物品集合
        num_negatives: 负样本数量
    """
    negatives = []
    while len(negatives) < num_negatives:
        item = np.random.randint(0, num_items)
        if item not in positive_items:
            negatives.append(item)
    return negatives
```

**2. 流行度采样**

按物品流行度采样，更热门的物品更可能被采样为负样本：

```python
def popularity_negative_sampling(
    item_popularity: np.ndarray,
    positive_items: set,
    num_negatives: int,
    alpha: float = 0.75
) -> list:
    """
    流行度负采样

    参数:
        item_popularity: 物品流行度数组
        positive_items: 正样本物品集合
        num_negatives: 负样本数量
        alpha: 平滑指数（Word2Vec使用0.75）
    """
    # 计算采样概率
    smoothed_popularity = item_popularity ** alpha
    sampling_prob = smoothed_popularity / smoothed_popularity.sum()

    negatives = []
    while len(negatives) < num_negatives:
        item = np.random.choice(len(item_popularity), p=sampling_prob)
        if item not in positive_items:
            negatives.append(item)
    return negatives
```

**3. Hard Negative Mining**

选择与正样本相似但实际为负样本的物品：

```python
def hard_negative_mining(
    user_vector: np.ndarray,
    item_vectors: np.ndarray,
    positive_items: set,
    num_negatives: int,
    num_candidates: int = 1000
) -> list:
    """
    Hard Negative Mining
    从相似但未交互的物品中选择负样本
    """
    # 计算与所有物品的相似度
    similarities = np.dot(item_vectors, user_vector)

    # 排除正样本
    for pos_item in positive_items:
        similarities[pos_item] = -np.inf

    # 选择相似度最高的候选
    top_candidates = np.argsort(similarities)[-num_candidates:]

    # 从候选中随机选择负样本
    negatives = np.random.choice(
        top_candidates,
        size=num_negatives,
        replace=False
    ).tolist()

    return negatives
```

**4. Batch内负采样**

利用同一batch内其他用户的正样本作为负样本：

```python
class InBatchNegativeSampling:
    """
    Batch内负采样
    """
    def __init__(self, temperature: float = 0.05):
        self.temperature = temperature

    def compute_loss(
        self,
        user_vectors: torch.Tensor,
        item_vectors: torch.Tensor
    ) -> torch.Tensor:
        """
        参数:
            user_vectors: (batch_size, dim)
            item_vectors: (batch_size, dim)
        """
        batch_size = user_vectors.shape[0]

        # 计算相似度矩阵
        similarity_matrix = torch.mm(
            user_vectors, item_vectors.t()
        ) / self.temperature

        # 对角线是正样本对
        labels = torch.arange(batch_size, device=similarity_matrix.device)

        # InfoNCE损失
        loss = F.cross_entropy(similarity_matrix, labels)

        return loss
```

**5. Mixed Negative Sampling**

结合多种策略：

```python
class MixedNegativeSampler:
    """
    混合负采样策略
    """
    def __init__(
        self,
        num_items: int,
        item_popularity: np.ndarray,
        random_ratio: float = 0.5,
        popular_ratio: float = 0.3,
        hard_ratio: float = 0.2
    ):
        self.num_items = num_items
        self.item_popularity = item_popularity
        self.random_ratio = random_ratio
        self.popular_ratio = popular_ratio
        self.hard_ratio = hard_ratio

        # 预计算流行度采样概率
        smoothed = item_popularity ** 0.75
        self.popular_prob = smoothed / smoothed.sum()

    def sample(
        self,
        positive_items: set,
        num_negatives: int,
        user_vector: np.ndarray = None,
        item_vectors: np.ndarray = None
    ) -> list:
        """
        混合采样
        """
        num_random = int(num_negatives * self.random_ratio)
        num_popular = int(num_negatives * self.popular_ratio)
        num_hard = num_negatives - num_random - num_popular

        negatives = set()

        # 随机采样
        while len(negatives) < num_random:
            item = np.random.randint(0, self.num_items)
            if item not in positive_items:
                negatives.add(item)

        # 流行度采样
        while len(negatives) < num_random + num_popular:
            item = np.random.choice(self.num_items, p=self.popular_prob)
            if item not in positive_items and item not in negatives:
                negatives.add(item)

        # Hard负采样
        if user_vector is not None and item_vectors is not None:
            similarities = np.dot(item_vectors, user_vector)
            for pos in positive_items:
                similarities[pos] = -np.inf
            for neg in negatives:
                similarities[neg] = -np.inf

            top_indices = np.argsort(similarities)[-num_hard*10:]
            hard_candidates = [
                i for i in top_indices
                if i not in positive_items and i not in negatives
            ]
            negatives.update(hard_candidates[:num_hard])

        return list(negatives)[:num_negatives]
```

---

## PyTorch完整实现

### 完整训练流程

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
from tqdm import tqdm
from collections import defaultdict


class RecommendationDataset(Dataset):
    """
    推荐系统数据集
    """
    def __init__(
        self,
        interactions: list,
        user_features: dict,
        item_features: dict,
        num_items: int,
        num_negatives: int = 4,
        item_popularity: np.ndarray = None
    ):
        """
        参数:
            interactions: [(user_id, item_id, label), ...]
            user_features: {user_id: [feature1, feature2, ...]}
            item_features: {item_id: [feature1, feature2, ...]}
            num_items: 物品总数
            num_negatives: 每个正样本的负样本数量
            item_popularity: 物品流行度
        """
        self.interactions = interactions
        self.user_features = user_features
        self.item_features = item_features
        self.num_items = num_items
        self.num_negatives = num_negatives
        self.item_popularity = item_popularity

        # 构建用户-物品交互集合
        self.user_positive_items = defaultdict(set)
        for user_id, item_id, label in interactions:
            if label == 1:
                self.user_positive_items[user_id].add(item_id)

        # 计算采样概率
        if item_popularity is not None:
            smoothed = item_popularity ** 0.75
            self.sampling_prob = smoothed / smoothed.sum()
        else:
            self.sampling_prob = None

    def __len__(self):
        return len(self.interactions)

    def __getitem__(self, idx):
        user_id, pos_item_id, _ = self.interactions[idx]

        # 获取用户特征
        user_feat = self.user_features[user_id]

        # 获取正样本物品特征
        pos_item_feat = self.item_features[pos_item_id]

        # 负采样
        positive_items = self.user_positive_items[user_id]
        neg_items = []

        while len(neg_items) < self.num_negatives:
            if self.sampling_prob is not None:
                neg_item = np.random.choice(
                    self.num_items, p=self.sampling_prob
                )
            else:
                neg_item = np.random.randint(0, self.num_items)

            if neg_item not in positive_items:
                neg_items.append(neg_item)

        # 获取负样本物品特征
        neg_item_feats = [self.item_features[i] for i in neg_items]

        return {
            'user_features': torch.tensor(user_feat, dtype=torch.long),
            'pos_item_features': torch.tensor(pos_item_feat, dtype=torch.long),
            'neg_item_features': torch.tensor(neg_item_feats, dtype=torch.long)
        }


class DeepRecommenderTrainer:
    """
    深度推荐模型训练器
    """
    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader = None,
        learning_rate: float = 1e-3,
        weight_decay: float = 1e-5,
        device: str = 'cuda'
    ):
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device

        self.optimizer = optim.Adam(
            model.parameters(),
            lr=learning_rate,
            weight_decay=weight_decay
        )

        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer,
            mode='min',
            factor=0.5,
            patience=3,
            verbose=True
        )

        self.best_val_loss = float('inf')
        self.train_losses = []
        self.val_losses = []

    def train_epoch(self):
        """训练一个epoch"""
        self.model.train()
        total_loss = 0
        num_batches = 0

        pbar = tqdm(self.train_loader, desc='Training')
        for batch in pbar:
            # 移动数据到设备
            user_features = batch['user_features'].to(self.device)
            pos_item_features = batch['pos_item_features'].to(self.device)
            neg_item_features = batch['neg_item_features'].to(self.device)

            # 转换特征格式
            user_feat_list = [
                user_features[:, i] for i in range(user_features.shape[1])
            ]
            pos_item_feat_list = [
                pos_item_features[:, i] for i in range(pos_item_features.shape[1])
            ]

            # 前向传播
            self.optimizer.zero_grad()

            # 获取向量
            user_vectors = self.model.get_user_embedding(user_feat_list)
            pos_item_vectors = self.model.get_item_embedding(pos_item_feat_list)

            # 计算正样本得分
            pos_scores = torch.sum(
                user_vectors * pos_item_vectors, dim=-1
            )

            # 计算负样本得分
            batch_size, num_neg, num_feat = neg_item_features.shape
            neg_scores_list = []

            for i in range(num_neg):
                neg_feat_list = [
                    neg_item_features[:, i, j] for j in range(num_feat)
                ]
                neg_vectors = self.model.get_item_embedding(neg_feat_list)
                neg_score = torch.sum(user_vectors * neg_vectors, dim=-1)
                neg_scores_list.append(neg_score)

            neg_scores = torch.stack(neg_scores_list, dim=1)

            # BPR损失
            diff = pos_scores.unsqueeze(1) - neg_scores
            loss = -torch.log(torch.sigmoid(diff) + 1e-8).mean()

            # 反向传播
            loss.backward()

            # 梯度裁剪
            torch.nn.utils.clip_grad_norm_(
                self.model.parameters(), max_norm=1.0
            )

            self.optimizer.step()

            total_loss += loss.item()
            num_batches += 1

            pbar.set_postfix({'loss': f'{loss.item():.4f}'})

        return total_loss / num_batches

    def train(
        self,
        num_epochs: int,
        early_stopping_patience: int = 10,
        save_path: str = 'best_model.pt'
    ):
        """完整训练流程"""
        patience_counter = 0

        for epoch in range(num_epochs):
            print(f"\nEpoch {epoch + 1}/{num_epochs}")

            # 训练
            train_loss = self.train_epoch()
            self.train_losses.append(train_loss)
            print(f"Train Loss: {train_loss:.4f}")

        return self.train_losses, self.val_losses


# 评估指标
class RecommendationMetrics:
    """
    推荐系统评估指标
    """
    @staticmethod
    def hit_rate_at_k(recommendations: list, ground_truth: set, k: int) -> float:
        """命中率@K"""
        hits = len(set(recommendations[:k]) & ground_truth)
        return 1.0 if hits > 0 else 0.0

    @staticmethod
    def ndcg_at_k(recommendations: list, ground_truth: set, k: int) -> float:
        """NDCG@K"""
        dcg = 0.0
        for i, item in enumerate(recommendations[:k]):
            if item in ground_truth:
                dcg += 1.0 / np.log2(i + 2)

        ideal_dcg = sum(1.0 / np.log2(i + 2) for i in range(min(k, len(ground_truth))))

        return dcg / ideal_dcg if ideal_dcg > 0 else 0.0

    @staticmethod
    def recall_at_k(recommendations: list, ground_truth: set, k: int) -> float:
        """Recall@K"""
        hits = len(set(recommendations[:k]) & ground_truth)
        return hits / len(ground_truth) if ground_truth else 0.0

    @staticmethod
    def precision_at_k(recommendations: list, ground_truth: set, k: int) -> float:
        """Precision@K"""
        hits = len(set(recommendations[:k]) & ground_truth)
        return hits / k

    @staticmethod
    def mrr(recommendations: list, ground_truth: set) -> float:
        """Mean Reciprocal Rank"""
        for i, item in enumerate(recommendations):
            if item in ground_truth:
                return 1.0 / (i + 1)
        return 0.0
```

---

## 面试要点

### 核心概念题

**Q1: Wide & Deep和DeepFM的区别是什么？**

- **Wide & Deep**：Wide部分是手工设计的交叉特征 + 线性模型，需要特征工程
- **DeepFM**：用FM替换Wide部分，自动学习二阶特征交叉，无需手工设计
- **共同点**：都是结合浅层和深层模型，Embedding共享

**Q2: DIN的注意力机制如何工作？**

DIN针对不同的候选物品，自适应地从用户历史行为中提取相关兴趣：
1. 计算候选物品与每个历史行为的注意力分数
2. 注意力网络输入：[行为embedding, 候选embedding, 差值, 元素积]
3. 通过Softmax归一化得到注意力权重
4. 加权求和得到用户兴趣表示

**Q3: 双塔模型的优缺点？**

**优点**：
- 用户和物品向量可以独立计算
- 物品向量可以离线预计算
- 支持ANN快速检索，适合大规模召回

**缺点**：
- 用户-物品交互建模较弱（只有内积）
- 无法建模复杂的交叉关系
- 精排效果不如复杂模型

**Q4: 负采样策略有哪些？如何选择？**

| 策略 | 特点 | 适用场景 |
|------|------|----------|
| 随机采样 | 简单高效 | 基础方法 |
| 流行度采样 | 避免推荐热门物品 | 冷启动场景 |
| Hard Negative | 更有挑战性的负样本 | 提升模型判别能力 |
| Batch内负采样 | 充分利用batch信息 | 大batch训练 |

**Q5: 如何处理用户行为序列？**

- **简单方法**：Mean/Max Pooling
- **注意力方法**：DIN根据候选物品动态加权
- **序列方法**：GRU/LSTM/Transformer建模时序依赖
- **兴趣演化**：DIEN使用AUGRU捕捉兴趣变化

### 工程实践题

**Q6: 如何部署双塔模型实现在线召回？**

1. 离线：计算所有物品向量，构建Faiss索引
2. 在线：实时计算用户向量，ANN检索Top-K
3. 增量更新：定期更新物品向量和索引

**Q7: 推荐系统的评估指标有哪些？**

- **精排指标**：AUC、LogLoss、GAUC
- **召回指标**：Recall@K、Hit Rate@K
- **排序指标**：NDCG@K、MRR、MAP
- **业务指标**：CTR、CVR、GMV、用户留存

**Q8: 如何处理冷启动问题？**

- **用户冷启动**：基于用户画像推荐、热门推荐、探索策略
- **物品冷启动**：基于内容推荐、相似物品、Bandit探索
- **系统冷启动**：引入先验知识、迁移学习

### 算法设计题

**Q9: 设计一个电商推荐系统的召回层**

```
多路召回策略:
1. 协同过滤召回：基于用户行为的I2I召回
2. 向量召回：双塔模型U2I召回
3. 热门召回：分类目热门物品
4. 实时召回：基于Session的实时兴趣
5. 内容召回：基于用户画像的标签匹配

召回融合:
- 各路召回去重
- 按来源分配配额
- 简单模型初排
```

**Q10: 如何优化序列推荐模型的效率？**

- **截断序列**：只使用最近N个行为
- **采样训练**：对长序列随机采样子序列
- **缓存机制**：缓存用户历史embedding
- **模型简化**：用轻量级模型近似注意力

---

## 延伸阅读

### 推荐论文

1. **Wide & Deep Learning** (2016) - Google
2. **DeepFM** (2017) - Huawei
3. **Deep Interest Network** (2018) - Alibaba
4. **Deep Interest Evolution Network** (2019) - Alibaba
5. **Sampling-Bias-Corrected Neural Modeling** (2019) - Google
6. **MIND: Multi-Interest Network** (2019) - Alibaba
7. **SASRec: Self-Attentive Sequential Recommendation** (2018)

### 开源框架

- **DeepCTR**：CTR预估模型集合
- **RecBole**：推荐系统基准库
- **TensorFlow Recommenders**：Google推荐系统库
- **Merlin**：NVIDIA推荐系统框架

### 进阶主题

- **多任务学习**：MMOE、PLE
- **图神经网络**：LightGCN、PinSage
- **强化学习推荐**：Bandit、RL4Rec
- **大模型推荐**：LLM4Rec、P5
- **联邦推荐**：隐私保护推荐

---

通过本文的学习，你应该能够：
1. 理解深度推荐系统的核心模型架构
2. 掌握Wide & Deep、DeepFM、DIN等经典模型的实现
3. 了解双塔模型的设计和部署方式
4. 熟悉各种负采样策略及其适用场景
5. 具备完整的深度推荐系统开发能力

深度推荐系统是一个快速发展的领域，持续关注最新研究成果和工业实践是保持竞争力的关键。建议多阅读顶会论文，参与实际项目，积累工程经验。
