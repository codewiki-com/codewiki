---
title: 图机器学习：图神经网络
description: 掌握图神经网络核心模型：GCN、GraphSAGE和GAT
track: ai
section: deep-learning
difficulty: advanced
tags:
  - GNN
  - GCN
  - 图学习
  - 深度学习
  - PyTorch Geometric
status: imported
origin: old/src/content/docs/datascience/gnn.zh.md
divergence: 0.132
issues: []
legacy:
  category: DataScience
  subcategory: GraphML
  order: 27
  lastUpdated: 2026-01-07
---

图神经网络(Graph Neural Networks, GNN)是深度学习领域近年来最具影响力的研究方向之一。它将深度学习的强大表示能力扩展到图结构数据上，能够处理传统神经网络难以解决的非欧几里得数据问题。本文将系统介绍GNN的核心概念、主流模型架构及其PyTorch Geometric实现。

---

## 图数据结构基础

### 图的数学定义

图(Graph)是由节点(Nodes/Vertices)和边(Edges)组成的数据结构，形式化定义为 $G = (V, E)$，其中：

- $V = \{v_1, v_2, ..., v_n\}$ 是节点集合
- $E \subseteq V \times V$ 是边集合
- 节点数量 $|V| = n$，边数量 $|E| = m$

**图的类型：**

| 图类型 | 特点 | 应用场景 |
|-------|------|---------|
| 无向图 | 边没有方向，$(u, v) = (v, u)$ | 社交网络、分子结构 |
| 有向图 | 边有方向，$(u, v) \neq (v, u)$ | 引用网络、知识图谱 |
| 加权图 | 边带有权重 | 交通网络、推荐系统 |
| 异构图 | 节点/边有不同类型 | 知识图谱、电商网络 |
| 动态图 | 结构随时间变化 | 社交互动、金融交易 |

### 图的矩阵表示

#### 邻接矩阵(Adjacency Matrix)

邻接矩阵 $A \in \mathbb{R}^{n \times n}$ 表示节点之间的连接关系：

$$A_{ij} = \begin{cases} 1 & \text{if } (v_i, v_j) \in E \\ 0 & \text{otherwise} \end{cases}$$

```python
import numpy as np
import torch

# 创建一个简单图的邻接矩阵
# 图结构: 0 -- 1 -- 2
#              |
#              3
adj_matrix = np.array([
    [0, 1, 0, 0],  # 节点0连接节点1
    [1, 0, 1, 1],  # 节点1连接节点0, 2, 3
    [0, 1, 0, 0],  # 节点2连接节点1
    [0, 1, 0, 0],  # 节点3连接节点1
])

# 转换为PyTorch张量
A = torch.tensor(adj_matrix, dtype=torch.float32)
print(f"邻接矩阵:\n{A}")

# 计算度矩阵(Degree Matrix)
degrees = A.sum(dim=1)
D = torch.diag(degrees)
print(f"度矩阵:\n{D}")
```

#### 边索引表示(Edge Index)

在大规模稀疏图中，使用边索引比邻接矩阵更高效：

```python
import torch

# 边索引表示: [source_nodes, target_nodes]
# 同样的图结构
edge_index = torch.tensor([
    [0, 1, 1, 1, 2, 3],  # 源节点
    [1, 0, 2, 3, 1, 1],  # 目标节点
], dtype=torch.long)

print(f"边索引形状: {edge_index.shape}")  # [2, num_edges]
print(f"边的数量: {edge_index.shape[1]}")

# 节点特征矩阵
num_nodes = 4
feature_dim = 16
X = torch.randn(num_nodes, feature_dim)
print(f"节点特征矩阵形状: {X.shape}")  # [num_nodes, feature_dim]
```

### 图的性质与度量

```python
import networkx as nx
import numpy as np

def analyze_graph(edge_index, num_nodes):
    """分析图的基本性质"""
    # 创建NetworkX图
    G = nx.Graph()
    G.add_nodes_from(range(num_nodes))
    edges = edge_index.t().tolist()
    G.add_edges_from(edges)

    # 基本统计
    print(f"节点数: {G.number_of_nodes()}")
    print(f"边数: {G.number_of_edges()}")
    print(f"平均度: {2 * G.number_of_edges() / G.number_of_nodes():.2f}")

    # 连通性
    print(f"是否连通: {nx.is_connected(G)}")
    print(f"连通分量数: {nx.number_connected_components(G)}")

    # 聚类系数
    print(f"平均聚类系数: {nx.average_clustering(G):.4f}")

    # 中心性度量
    degree_centrality = nx.degree_centrality(G)
    betweenness = nx.betweenness_centrality(G)

    print(f"度中心性: {degree_centrality}")
    print(f"介数中心性: {betweenness}")

    return G

# 使用示例
edge_index = torch.tensor([[0,1,1,1,2,3], [1,0,2,3,1,1]])
G = analyze_graph(edge_index, 4)
```

---

## 消息传递框架

### 消息传递神经网络(MPNN)

消息传递是图神经网络的核心范式，它定义了节点如何聚合邻居信息来更新自身表示。MPNN框架包含三个核心操作：

1. **消息函数(Message Function)**: $m_{ij} = \phi(h_i, h_j, e_{ij})$
2. **聚合函数(Aggregation Function)**: $m_i = \bigoplus_{j \in \mathcal{N}(i)} m_{ij}$
3. **更新函数(Update Function)**: $h_i' = \psi(h_i, m_i)$

其中 $\mathcal{N}(i)$ 表示节点 $i$ 的邻居集合，$e_{ij}$ 是边特征。

```python
import torch
import torch.nn as nn

class MessagePassingLayer(nn.Module):
    """基础消息传递层实现"""
    def __init__(self, in_channels, out_channels, aggr='mean'):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.aggr = aggr

        # 消息函数的参数
        self.message_mlp = nn.Sequential(
            nn.Linear(2 * in_channels, out_channels),
            nn.ReLU(),
            nn.Linear(out_channels, out_channels)
        )

        # 更新函数的参数
        self.update_mlp = nn.Sequential(
            nn.Linear(in_channels + out_channels, out_channels),
            nn.ReLU()
        )

    def message(self, x_i, x_j):
        """计算从节点j到节点i的消息"""
        # 拼接源节点和目标节点特征
        return self.message_mlp(torch.cat([x_i, x_j], dim=-1))

    def aggregate(self, messages, index, num_nodes):
        """聚合邻居消息"""
        # 初始化输出
        out = torch.zeros(num_nodes, messages.size(-1), device=messages.device)

        if self.aggr == 'sum':
            out.scatter_add_(0, index.unsqueeze(-1).expand_as(messages), messages)
        elif self.aggr == 'mean':
            out.scatter_add_(0, index.unsqueeze(-1).expand_as(messages), messages)
            count = torch.zeros(num_nodes, device=messages.device)
            count.scatter_add_(0, index, torch.ones_like(index, dtype=torch.float))
            count = count.clamp(min=1).unsqueeze(-1)
            out = out / count
        elif self.aggr == 'max':
            out.scatter_reduce_(0, index.unsqueeze(-1).expand_as(messages),
                               messages, reduce='amax', include_self=False)

        return out

    def update(self, x, aggr_out):
        """更新节点表示"""
        return self.update_mlp(torch.cat([x, aggr_out], dim=-1))

    def forward(self, x, edge_index):
        """
        前向传播
        x: [num_nodes, in_channels] 节点特征
        edge_index: [2, num_edges] 边索引
        """
        row, col = edge_index  # row是目标节点，col是源节点

        # 获取源节点和目标节点的特征
        x_i = x[row]  # 目标节点特征
        x_j = x[col]  # 源节点特征

        # 计算消息
        messages = self.message(x_i, x_j)

        # 聚合消息
        aggr_out = self.aggregate(messages, row, x.size(0))

        # 更新节点表示
        out = self.update(x, aggr_out)

        return out

# 测试消息传递层
x = torch.randn(4, 16)  # 4个节点，16维特征
edge_index = torch.tensor([[0,1,1,1,2,3], [1,0,2,3,1,1]])

mp_layer = MessagePassingLayer(16, 32)
out = mp_layer(x, edge_index)
print(f"输出形状: {out.shape}")  # [4, 32]
```

### 聚合函数的选择

不同的聚合函数适用于不同场景：

```python
import torch
from torch_scatter import scatter_mean, scatter_max, scatter_add

def aggregate_neighbors(messages, edge_index, num_nodes, aggr_type='mean'):
    """
    不同聚合策略的实现

    messages: [num_edges, feature_dim] 边消息
    edge_index: [2, num_edges] 边索引
    """
    target_idx = edge_index[0]  # 目标节点索引

    if aggr_type == 'mean':
        # 平均聚合：适用于大多数场景
        return scatter_mean(messages, target_idx, dim=0, dim_size=num_nodes)

    elif aggr_type == 'sum':
        # 求和聚合：保留邻居数量信息
        return scatter_add(messages, target_idx, dim=0, dim_size=num_nodes)

    elif aggr_type == 'max':
        # 最大值聚合：捕获最显著特征
        return scatter_max(messages, target_idx, dim=0, dim_size=num_nodes)[0]

    elif aggr_type == 'attention':
        # 注意力聚合：GAT使用
        pass  # 见GAT部分

    elif aggr_type == 'lstm':
        # LSTM聚合：GraphSAGE使用
        pass  # 见GraphSAGE部分

# 聚合函数特性对比
"""
| 聚合函数 | 排列不变性 | 表达能力 | 计算复杂度 | 适用场景 |
|---------|-----------|---------|-----------|---------|
| Mean    | 是        | 中      | O(1)      | 通用    |
| Sum     | 是        | 高      | O(1)      | 需要保留度信息 |
| Max     | 是        | 中      | O(1)      | 检测关键特征 |
| Attention| 是       | 高      | O(d)      | 异质邻居 |
| LSTM    | 否        | 最高    | O(k)      | 有序邻居 |
"""
```

---

## GCN图卷积网络

### GCN原理

图卷积网络(Graph Convolutional Network, GCN)是Kipf和Welling在2017年提出的经典模型。其核心思想是在谱域定义图卷积，并通过切比雪夫多项式近似简化计算。

**谱图卷积：**

图信号 $x$ 的谱卷积定义为：

$$g_\theta \star x = U g_\theta(\Lambda) U^T x$$

其中 $L = U \Lambda U^T$ 是图拉普拉斯矩阵的特征分解。

**GCN的一阶近似：**

$$H^{(l+1)} = \sigma(\tilde{D}^{-\frac{1}{2}} \tilde{A} \tilde{D}^{-\frac{1}{2}} H^{(l)} W^{(l)})$$

其中：
- $\tilde{A} = A + I_N$ 是添加自环的邻接矩阵
- $\tilde{D}_{ii} = \sum_j \tilde{A}_{ij}$ 是度矩阵
- $W^{(l)}$ 是可学习的权重矩阵
- $\sigma$ 是激活函数

### GCN从零实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GCNConv(nn.Module):
    """图卷积层的完整实现"""
    def __init__(self, in_channels, out_channels, bias=True):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels

        # 可学习参数
        self.weight = nn.Parameter(torch.Tensor(in_channels, out_channels))
        if bias:
            self.bias = nn.Parameter(torch.Tensor(out_channels))
        else:
            self.register_parameter('bias', None)

        self.reset_parameters()

    def reset_parameters(self):
        """Xavier初始化"""
        nn.init.xavier_uniform_(self.weight)
        if self.bias is not None:
            nn.init.zeros_(self.bias)

    def forward(self, x, edge_index, edge_weight=None):
        """
        前向传播
        x: [num_nodes, in_channels]
        edge_index: [2, num_edges]
        edge_weight: [num_edges] 可选的边权重
        """
        num_nodes = x.size(0)

        # 添加自环
        loop_index = torch.arange(num_nodes, device=edge_index.device)
        loop_index = loop_index.unsqueeze(0).repeat(2, 1)
        edge_index = torch.cat([edge_index, loop_index], dim=1)

        if edge_weight is not None:
            loop_weight = torch.ones(num_nodes, device=edge_weight.device)
            edge_weight = torch.cat([edge_weight, loop_weight])

        # 计算归一化系数 D^{-1/2}
        row, col = edge_index
        deg = torch.zeros(num_nodes, device=x.device)

        if edge_weight is None:
            deg.scatter_add_(0, row, torch.ones(row.size(0), device=x.device))
        else:
            deg.scatter_add_(0, row, edge_weight)

        deg_inv_sqrt = deg.pow(-0.5)
        deg_inv_sqrt[deg_inv_sqrt == float('inf')] = 0

        # 归一化: D^{-1/2} A D^{-1/2}
        if edge_weight is None:
            norm = deg_inv_sqrt[row] * deg_inv_sqrt[col]
        else:
            norm = deg_inv_sqrt[row] * edge_weight * deg_inv_sqrt[col]

        # 线性变换
        x = torch.matmul(x, self.weight)

        # 消息传递: 聚合邻居特征
        out = torch.zeros_like(x)
        for i in range(edge_index.size(1)):
            out[row[i]] += norm[i] * x[col[i]]

        if self.bias is not None:
            out += self.bias

        return out

class GCN(nn.Module):
    """完整的GCN模型"""
    def __init__(self, num_features, num_classes, hidden_channels=64,
                 num_layers=2, dropout=0.5):
        super().__init__()
        self.dropout = dropout

        self.convs = nn.ModuleList()
        self.convs.append(GCNConv(num_features, hidden_channels))

        for _ in range(num_layers - 2):
            self.convs.append(GCNConv(hidden_channels, hidden_channels))

        self.convs.append(GCNConv(hidden_channels, num_classes))

    def forward(self, x, edge_index):
        for i, conv in enumerate(self.convs[:-1]):
            x = conv(x, edge_index)
            x = F.relu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)

        x = self.convs[-1](x, edge_index)
        return x

# 测试GCN
num_nodes = 100
num_features = 16
num_classes = 5

x = torch.randn(num_nodes, num_features)
edge_index = torch.randint(0, num_nodes, (2, 300))

model = GCN(num_features, num_classes)
out = model(x, edge_index)
print(f"GCN输出形状: {out.shape}")  # [100, 5]
```

### GCN的矩阵形式实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GCNMatrixForm(nn.Module):
    """GCN的矩阵形式实现（更直观但不适合大图）"""
    def __init__(self, num_features, num_classes, hidden_channels=64):
        super().__init__()
        self.W1 = nn.Linear(num_features, hidden_channels, bias=False)
        self.W2 = nn.Linear(hidden_channels, num_classes, bias=False)

    def normalize_adj(self, adj):
        """计算归一化邻接矩阵: D^{-1/2} A D^{-1/2}"""
        # 添加自环
        adj = adj + torch.eye(adj.size(0), device=adj.device)

        # 计算度矩阵
        degree = adj.sum(dim=1)
        degree_inv_sqrt = degree.pow(-0.5)
        degree_inv_sqrt[degree_inv_sqrt == float('inf')] = 0

        # 归一化
        D_inv_sqrt = torch.diag(degree_inv_sqrt)
        return D_inv_sqrt @ adj @ D_inv_sqrt

    def forward(self, x, adj):
        """
        x: [num_nodes, num_features]
        adj: [num_nodes, num_nodes] 邻接矩阵
        """
        # 归一化邻接矩阵
        adj_norm = self.normalize_adj(adj)

        # 第一层: A_norm @ X @ W1
        x = adj_norm @ self.W1(x)
        x = F.relu(x)
        x = F.dropout(x, p=0.5, training=self.training)

        # 第二层: A_norm @ H @ W2
        x = adj_norm @ self.W2(x)

        return x

# 邻接矩阵形式测试
adj = torch.zeros(100, 100)
for i, j in zip(*edge_index.tolist()):
    adj[i, j] = 1
    adj[j, i] = 1  # 无向图

model_matrix = GCNMatrixForm(num_features, num_classes)
out_matrix = model_matrix(x, adj)
print(f"矩阵形式GCN输出: {out_matrix.shape}")
```

---

## GraphSAGE采样聚合

### GraphSAGE原理

GraphSAGE(Graph SAmple and aggreGatE)是Hamilton等人在2017年提出的可扩展图神经网络。它通过采样固定数量的邻居并学习聚合函数，实现了归纳式学习。

**核心创新：**

1. **邻居采样**: 每层随机采样固定数量邻居，降低计算复杂度
2. **多种聚合器**: Mean, LSTM, Pooling等多种聚合方式
3. **归纳学习**: 可以对训练时未见过的节点进行预测

**GraphSAGE更新公式：**

$$h_{\mathcal{N}(v)}^{(l)} = \text{AGGREGATE}^{(l)}(\{h_u^{(l-1)}, \forall u \in \mathcal{N}(v)\})$$

$$h_v^{(l)} = \sigma(W^{(l)} \cdot \text{CONCAT}(h_v^{(l-1)}, h_{\mathcal{N}(v)}^{(l)}))$$

### GraphSAGE实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import random

class SAGEConv(nn.Module):
    """GraphSAGE卷积层"""
    def __init__(self, in_channels, out_channels, aggr='mean',
                 normalize=True, bias=True):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.aggr = aggr
        self.normalize = normalize

        # 自身特征变换
        self.lin_self = nn.Linear(in_channels, out_channels, bias=bias)
        # 邻居特征变换
        self.lin_neigh = nn.Linear(in_channels, out_channels, bias=False)

        if aggr == 'lstm':
            self.lstm = nn.LSTM(in_channels, in_channels, batch_first=True)
        elif aggr == 'pool':
            self.pool_lin = nn.Linear(in_channels, in_channels)

        self.reset_parameters()

    def reset_parameters(self):
        self.lin_self.reset_parameters()
        self.lin_neigh.reset_parameters()

    def aggregate_mean(self, x, edge_index, num_nodes):
        """均值聚合"""
        row, col = edge_index
        out = torch.zeros(num_nodes, x.size(-1), device=x.device)
        count = torch.zeros(num_nodes, device=x.device)

        out.scatter_add_(0, row.unsqueeze(-1).expand(-1, x.size(-1)), x[col])
        count.scatter_add_(0, row, torch.ones_like(row, dtype=torch.float))
        count = count.clamp(min=1)

        return out / count.unsqueeze(-1)

    def aggregate_max_pool(self, x, edge_index, num_nodes):
        """最大池化聚合"""
        x_pool = F.relu(self.pool_lin(x))

        row, col = edge_index
        out = torch.full((num_nodes, x.size(-1)), float('-inf'), device=x.device)

        for i in range(edge_index.size(1)):
            out[row[i]] = torch.max(out[row[i]], x_pool[col[i]])

        out[out == float('-inf')] = 0
        return out

    def forward(self, x, edge_index):
        """
        x: [num_nodes, in_channels]
        edge_index: [2, num_edges]
        """
        num_nodes = x.size(0)

        # 聚合邻居特征
        if self.aggr == 'mean':
            neigh_agg = self.aggregate_mean(x, edge_index, num_nodes)
        elif self.aggr == 'pool':
            neigh_agg = self.aggregate_max_pool(x, edge_index, num_nodes)
        else:  # sum
            row, col = edge_index
            neigh_agg = torch.zeros(num_nodes, x.size(-1), device=x.device)
            neigh_agg.scatter_add_(0, row.unsqueeze(-1).expand(-1, x.size(-1)), x[col])

        # 变换并拼接
        out = self.lin_self(x) + self.lin_neigh(neigh_agg)

        # L2归一化
        if self.normalize:
            out = F.normalize(out, p=2, dim=-1)

        return out

class NeighborSampler:
    """邻居采样器"""
    def __init__(self, edge_index, num_nodes, sizes):
        """
        sizes: 每层采样的邻居数量列表，如[25, 10]
        """
        self.edge_index = edge_index
        self.num_nodes = num_nodes
        self.sizes = sizes

        # 构建邻接表
        self.adj_list = [[] for _ in range(num_nodes)]
        row, col = edge_index
        for i, j in zip(row.tolist(), col.tolist()):
            self.adj_list[i].append(j)

    def sample(self, batch_nodes):
        """
        采样多跳邻居
        返回: (sampled_nodes, sampled_edge_index, batch_size)
        """
        all_nodes = set(batch_nodes)
        sampled_edge_indices = []

        current_nodes = batch_nodes

        for size in self.sizes:
            neighbors = []
            edges_src = []
            edges_dst = []

            for node in current_nodes:
                node_neighbors = self.adj_list[node]
                if len(node_neighbors) > size:
                    sampled = random.sample(node_neighbors, size)
                else:
                    sampled = node_neighbors

                for neighbor in sampled:
                    edges_src.append(node)
                    edges_dst.append(neighbor)
                    neighbors.append(neighbor)

            all_nodes.update(neighbors)
            current_nodes = list(set(neighbors))

            if edges_src:
                sampled_edge_indices.append(
                    torch.tensor([edges_src, edges_dst], dtype=torch.long)
                )

        return list(all_nodes), sampled_edge_indices

class GraphSAGE(nn.Module):
    """完整的GraphSAGE模型"""
    def __init__(self, num_features, num_classes, hidden_channels=64,
                 num_layers=2, dropout=0.5, aggr='mean'):
        super().__init__()
        self.dropout = dropout
        self.num_layers = num_layers

        self.convs = nn.ModuleList()
        self.convs.append(SAGEConv(num_features, hidden_channels, aggr=aggr))

        for _ in range(num_layers - 2):
            self.convs.append(SAGEConv(hidden_channels, hidden_channels, aggr=aggr))

        self.convs.append(SAGEConv(hidden_channels, num_classes, aggr=aggr))

    def forward(self, x, edge_index):
        for i, conv in enumerate(self.convs[:-1]):
            x = conv(x, edge_index)
            x = F.relu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)

        x = self.convs[-1](x, edge_index)
        return x

# 测试GraphSAGE
model_sage = GraphSAGE(num_features, num_classes, aggr='mean')
out_sage = model_sage(x, edge_index)
print(f"GraphSAGE输出形状: {out_sage.shape}")
```

### Mini-batch训练

```python
import torch
from torch.utils.data import DataLoader

class GraphSAGEMiniBatch(nn.Module):
    """支持Mini-batch训练的GraphSAGE"""
    def __init__(self, num_features, num_classes, hidden_channels=64,
                 num_layers=2, sample_sizes=[25, 10]):
        super().__init__()
        self.num_layers = num_layers
        self.sample_sizes = sample_sizes

        self.convs = nn.ModuleList()
        self.convs.append(SAGEConv(num_features, hidden_channels))
        for _ in range(num_layers - 2):
            self.convs.append(SAGEConv(hidden_channels, hidden_channels))
        self.convs.append(SAGEConv(hidden_channels, num_classes))

    def forward(self, x, adjs):
        """
        x: 所有采样节点的特征
        adjs: 每层的边索引和采样信息
        """
        for i, (edge_index, size) in enumerate(adjs):
            x_target = x[:size]
            x = self.convs[i]((x, x_target), edge_index)
            if i != self.num_layers - 1:
                x = F.relu(x)
                x = F.dropout(x, p=0.5, training=self.training)

        return x

def train_minibatch(model, data, optimizer, batch_size=512):
    """Mini-batch训练函数"""
    model.train()

    # 随机打乱训练节点
    perm = torch.randperm(data.train_mask.sum())
    train_nodes = data.train_mask.nonzero().squeeze()[perm]

    total_loss = 0
    for i in range(0, len(train_nodes), batch_size):
        batch_nodes = train_nodes[i:i+batch_size]

        # 采样邻居（使用PyG的NeighborLoader）
        optimizer.zero_grad()

        out = model(data.x, data.edge_index)
        loss = F.cross_entropy(out[batch_nodes], data.y[batch_nodes])

        loss.backward()
        optimizer.step()

        total_loss += loss.item() * len(batch_nodes)

    return total_loss / len(train_nodes)
```

---

## GAT图注意力网络

### GAT原理

图注意力网络(Graph Attention Network, GAT)由Velickovic等人在2018年提出。它使用注意力机制自动学习邻居的重要性权重。

**注意力系数计算：**

$$e_{ij} = \text{LeakyReLU}(\mathbf{a}^T [\mathbf{W}h_i \| \mathbf{W}h_j])$$

$$\alpha_{ij} = \text{softmax}_j(e_{ij}) = \frac{\exp(e_{ij})}{\sum_{k \in \mathcal{N}(i)} \exp(e_{ik})}$$

**节点更新：**

$$h_i' = \sigma(\sum_{j \in \mathcal{N}(i)} \alpha_{ij} \mathbf{W}h_j)$$

**多头注意力：**

$$h_i' = \|_{k=1}^{K} \sigma(\sum_{j \in \mathcal{N}(i)} \alpha_{ij}^k \mathbf{W}^k h_j)$$

### GAT实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GATConv(nn.Module):
    """图注意力卷积层"""
    def __init__(self, in_channels, out_channels, heads=8,
                 concat=True, dropout=0.6, negative_slope=0.2):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.heads = heads
        self.concat = concat
        self.dropout = dropout
        self.negative_slope = negative_slope

        # 线性变换
        self.W = nn.Linear(in_channels, heads * out_channels, bias=False)

        # 注意力参数
        self.a_src = nn.Parameter(torch.Tensor(1, heads, out_channels))
        self.a_dst = nn.Parameter(torch.Tensor(1, heads, out_channels))

        # 偏置
        if concat:
            self.bias = nn.Parameter(torch.Tensor(heads * out_channels))
        else:
            self.bias = nn.Parameter(torch.Tensor(out_channels))

        self.reset_parameters()

    def reset_parameters(self):
        nn.init.xavier_uniform_(self.W.weight)
        nn.init.xavier_uniform_(self.a_src)
        nn.init.xavier_uniform_(self.a_dst)
        nn.init.zeros_(self.bias)

    def forward(self, x, edge_index):
        """
        x: [num_nodes, in_channels]
        edge_index: [2, num_edges]
        """
        num_nodes = x.size(0)
        H, C = self.heads, self.out_channels

        # 线性变换: [num_nodes, heads * out_channels]
        x = self.W(x).view(num_nodes, H, C)

        # 添加自环
        loop_index = torch.arange(num_nodes, device=edge_index.device)
        loop_index = loop_index.unsqueeze(0).repeat(2, 1)
        edge_index = torch.cat([edge_index, loop_index], dim=1)

        row, col = edge_index

        # 计算注意力分数
        # e_ij = a_src^T * x_i + a_dst^T * x_j
        alpha_src = (x * self.a_src).sum(dim=-1)  # [num_nodes, heads]
        alpha_dst = (x * self.a_dst).sum(dim=-1)  # [num_nodes, heads]

        # 边的注意力分数
        alpha = alpha_src[row] + alpha_dst[col]  # [num_edges, heads]
        alpha = F.leaky_relu(alpha, negative_slope=self.negative_slope)

        # Softmax归一化
        alpha = self.softmax_per_node(alpha, row, num_nodes)

        # Dropout
        alpha = F.dropout(alpha, p=self.dropout, training=self.training)

        # 聚合邻居特征
        out = self.aggregate(x, edge_index, alpha, num_nodes)

        # 拼接或平均多头
        if self.concat:
            out = out.view(num_nodes, H * C)
        else:
            out = out.mean(dim=1)

        out = out + self.bias

        return out

    def softmax_per_node(self, alpha, index, num_nodes):
        """对每个节点的邻居进行softmax"""
        # 数值稳定性
        alpha_max = torch.zeros(num_nodes, alpha.size(-1), device=alpha.device)
        alpha_max.scatter_reduce_(0, index.unsqueeze(-1).expand_as(alpha),
                                  alpha, reduce='amax', include_self=False)
        alpha = alpha - alpha_max[index]

        # Softmax
        alpha = alpha.exp()
        alpha_sum = torch.zeros(num_nodes, alpha.size(-1), device=alpha.device)
        alpha_sum.scatter_add_(0, index.unsqueeze(-1).expand_as(alpha), alpha)
        alpha = alpha / (alpha_sum[index] + 1e-16)

        return alpha

    def aggregate(self, x, edge_index, alpha, num_nodes):
        """加权聚合"""
        row, col = edge_index
        H, C = self.heads, self.out_channels

        out = torch.zeros(num_nodes, H, C, device=x.device)

        # alpha: [num_edges, heads]
        # x[col]: [num_edges, heads, out_channels]
        weighted = alpha.unsqueeze(-1) * x[col]

        out.scatter_add_(0, row.view(-1, 1, 1).expand(-1, H, C), weighted)

        return out

class GAT(nn.Module):
    """完整的GAT模型"""
    def __init__(self, num_features, num_classes, hidden_channels=8,
                 heads=8, num_layers=2, dropout=0.6):
        super().__init__()
        self.dropout = dropout

        self.convs = nn.ModuleList()

        # 第一层
        self.convs.append(GATConv(num_features, hidden_channels,
                                   heads=heads, concat=True, dropout=dropout))

        # 中间层
        for _ in range(num_layers - 2):
            self.convs.append(GATConv(hidden_channels * heads, hidden_channels,
                                       heads=heads, concat=True, dropout=dropout))

        # 输出层：不拼接，取平均
        self.convs.append(GATConv(hidden_channels * heads, num_classes,
                                   heads=1, concat=False, dropout=dropout))

    def forward(self, x, edge_index):
        x = F.dropout(x, p=self.dropout, training=self.training)

        for i, conv in enumerate(self.convs[:-1]):
            x = conv(x, edge_index)
            x = F.elu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)

        x = self.convs[-1](x, edge_index)

        return x

# 测试GAT
model_gat = GAT(num_features, num_classes)
out_gat = model_gat(x, edge_index)
print(f"GAT输出形状: {out_gat.shape}")
```

### 注意力可视化

```python
import matplotlib.pyplot as plt
import networkx as nx

def visualize_attention(edge_index, attention_weights, node_labels=None):
    """可视化注意力权重"""
    G = nx.DiGraph()

    row, col = edge_index
    for i, (src, dst) in enumerate(zip(col.tolist(), row.tolist())):
        G.add_edge(src, dst, weight=attention_weights[i].mean().item())

    pos = nx.spring_layout(G, seed=42)

    plt.figure(figsize=(12, 8))

    # 绘制节点
    nx.draw_networkx_nodes(G, pos, node_color='lightblue',
                          node_size=500, alpha=0.9)

    # 绘制边，宽度与注意力权重成正比
    edges = G.edges()
    weights = [G[u][v]['weight'] * 5 for u, v in edges]

    nx.draw_networkx_edges(G, pos, edgelist=edges, width=weights,
                          alpha=0.6, edge_color='gray',
                          arrows=True, arrowsize=15)

    # 绘制标签
    if node_labels is None:
        node_labels = {i: str(i) for i in G.nodes()}
    nx.draw_networkx_labels(G, pos, node_labels, font_size=10)

    plt.title("GAT Attention Weights Visualization")
    plt.axis('off')
    plt.tight_layout()
    plt.savefig('gat_attention.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## 图任务类型

### 节点分类(Node Classification)

节点分类是最常见的图学习任务，目标是预测图中每个节点的类别标签。

```python
import torch
import torch.nn.functional as F
from sklearn.metrics import accuracy_score, f1_score, classification_report

def train_node_classification(model, data, optimizer, epochs=200):
    """节点分类训练"""
    best_val_acc = 0

    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()

        out = model(data.x, data.edge_index)
        loss = F.cross_entropy(out[data.train_mask], data.y[data.train_mask])

        loss.backward()
        optimizer.step()

        # 验证
        model.eval()
        with torch.no_grad():
            out = model(data.x, data.edge_index)
            pred = out.argmax(dim=1)

            train_acc = accuracy_score(
                data.y[data.train_mask].cpu(),
                pred[data.train_mask].cpu()
            )
            val_acc = accuracy_score(
                data.y[data.val_mask].cpu(),
                pred[data.val_mask].cpu()
            )

            if val_acc > best_val_acc:
                best_val_acc = val_acc
                best_model_state = model.state_dict().copy()

        if (epoch + 1) % 20 == 0:
            print(f'Epoch {epoch+1:03d}, Loss: {loss:.4f}, '
                  f'Train Acc: {train_acc:.4f}, Val Acc: {val_acc:.4f}')

    # 测试
    model.load_state_dict(best_model_state)
    model.eval()
    with torch.no_grad():
        out = model(data.x, data.edge_index)
        pred = out.argmax(dim=1)

        test_acc = accuracy_score(
            data.y[data.test_mask].cpu(),
            pred[data.test_mask].cpu()
        )
        test_f1 = f1_score(
            data.y[data.test_mask].cpu(),
            pred[data.test_mask].cpu(),
            average='macro'
        )

    print(f'\nTest Accuracy: {test_acc:.4f}, Test F1: {test_f1:.4f}')
    return test_acc, test_f1
```

### 链接预测(Link Prediction)

链接预测的目标是预测图中节点之间是否存在边。

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from sklearn.metrics import roc_auc_score, average_precision_score

class LinkPredictor(nn.Module):
    """链接预测器"""
    def __init__(self, in_channels, hidden_channels):
        super().__init__()
        self.lin1 = nn.Linear(2 * in_channels, hidden_channels)
        self.lin2 = nn.Linear(hidden_channels, 1)

    def forward(self, z_src, z_dst):
        """
        z_src: 源节点嵌入 [num_edges, embed_dim]
        z_dst: 目标节点嵌入 [num_edges, embed_dim]
        """
        z = torch.cat([z_src, z_dst], dim=-1)
        z = F.relu(self.lin1(z))
        z = self.lin2(z)
        return z.squeeze(-1)

class GNNLinkPredictor(nn.Module):
    """GNN + 链接预测"""
    def __init__(self, num_features, hidden_channels, num_layers=2):
        super().__init__()
        self.encoder = GCN(num_features, hidden_channels, hidden_channels, num_layers)
        self.predictor = LinkPredictor(hidden_channels, hidden_channels)

    def encode(self, x, edge_index):
        return self.encoder(x, edge_index)

    def decode(self, z, edge_label_index):
        src, dst = edge_label_index
        return self.predictor(z[src], z[dst])

    def forward(self, x, edge_index, edge_label_index):
        z = self.encode(x, edge_index)
        return self.decode(z, edge_label_index)

def negative_sampling(edge_index, num_nodes, num_neg_samples):
    """负采样"""
    # 创建正边集合
    pos_edges = set(zip(edge_index[0].tolist(), edge_index[1].tolist()))

    neg_src = []
    neg_dst = []

    while len(neg_src) < num_neg_samples:
        src = torch.randint(0, num_nodes, (1,)).item()
        dst = torch.randint(0, num_nodes, (1,)).item()

        if src != dst and (src, dst) not in pos_edges:
            neg_src.append(src)
            neg_dst.append(dst)

    return torch.tensor([neg_src, neg_dst], dtype=torch.long)

def train_link_prediction(model, data, optimizer, epochs=100):
    """链接预测训练"""
    criterion = nn.BCEWithLogitsLoss()

    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()

        # 正样本
        pos_edge_index = data.train_pos_edge_index

        # 负采样
        neg_edge_index = negative_sampling(
            pos_edge_index,
            data.num_nodes,
            pos_edge_index.size(1)
        )

        # 合并正负样本
        edge_label_index = torch.cat([pos_edge_index, neg_edge_index], dim=1)
        edge_label = torch.cat([
            torch.ones(pos_edge_index.size(1)),
            torch.zeros(neg_edge_index.size(1))
        ])

        # 前向传播
        out = model(data.x, data.train_edge_index, edge_label_index)
        loss = criterion(out, edge_label)

        loss.backward()
        optimizer.step()

        if (epoch + 1) % 20 == 0:
            # 评估
            model.eval()
            with torch.no_grad():
                z = model.encode(data.x, data.train_edge_index)

                # 验证集评估
                pos_pred = model.decode(z, data.val_pos_edge_index)
                neg_pred = model.decode(z, data.val_neg_edge_index)

                preds = torch.cat([pos_pred, neg_pred]).sigmoid().cpu()
                labels = torch.cat([
                    torch.ones(data.val_pos_edge_index.size(1)),
                    torch.zeros(data.val_neg_edge_index.size(1))
                ])

                auc = roc_auc_score(labels, preds)
                ap = average_precision_score(labels, preds)

            print(f'Epoch {epoch+1:03d}, Loss: {loss:.4f}, '
                  f'Val AUC: {auc:.4f}, Val AP: {ap:.4f}')
```

### 图分类(Graph Classification)

图分类的目标是预测整个图的类别标签。

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import global_mean_pool, global_max_pool, global_add_pool

class GraphClassifier(nn.Module):
    """图分类模型"""
    def __init__(self, num_features, num_classes, hidden_channels=64,
                 num_layers=3, pool='mean'):
        super().__init__()
        self.pool_type = pool

        # 节点编码器
        self.convs = nn.ModuleList()
        self.bns = nn.ModuleList()

        self.convs.append(GCNConv(num_features, hidden_channels))
        self.bns.append(nn.BatchNorm1d(hidden_channels))

        for _ in range(num_layers - 1):
            self.convs.append(GCNConv(hidden_channels, hidden_channels))
            self.bns.append(nn.BatchNorm1d(hidden_channels))

        # 图级池化
        if pool == 'mean':
            self.pool = global_mean_pool
        elif pool == 'max':
            self.pool = global_max_pool
        elif pool == 'add':
            self.pool = global_add_pool

        # 分类头
        self.classifier = nn.Sequential(
            nn.Linear(hidden_channels, hidden_channels),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(hidden_channels, num_classes)
        )

    def forward(self, x, edge_index, batch):
        """
        x: [total_nodes, num_features] 所有图的节点特征
        edge_index: [2, total_edges] 所有图的边
        batch: [total_nodes] 节点到图的映射
        """
        # 节点嵌入
        for conv, bn in zip(self.convs, self.bns):
            x = conv(x, edge_index)
            x = bn(x)
            x = F.relu(x)
            x = F.dropout(x, p=0.5, training=self.training)

        # 图级池化
        x = self.pool(x, batch)  # [num_graphs, hidden_channels]

        # 分类
        x = self.classifier(x)

        return x

def train_graph_classification(model, train_loader, val_loader,
                               optimizer, epochs=100):
    """图分类训练"""
    criterion = nn.CrossEntropyLoss()
    best_val_acc = 0

    for epoch in range(epochs):
        model.train()
        total_loss = 0

        for batch in train_loader:
            optimizer.zero_grad()

            out = model(batch.x, batch.edge_index, batch.batch)
            loss = criterion(out, batch.y)

            loss.backward()
            optimizer.step()

            total_loss += loss.item() * batch.num_graphs

        train_loss = total_loss / len(train_loader.dataset)

        # 验证
        model.eval()
        correct = 0
        with torch.no_grad():
            for batch in val_loader:
                out = model(batch.x, batch.edge_index, batch.batch)
                pred = out.argmax(dim=1)
                correct += (pred == batch.y).sum().item()

        val_acc = correct / len(val_loader.dataset)

        if val_acc > best_val_acc:
            best_val_acc = val_acc

        if (epoch + 1) % 10 == 0:
            print(f'Epoch {epoch+1:03d}, Loss: {train_loss:.4f}, '
                  f'Val Acc: {val_acc:.4f}')

    return best_val_acc
```

---

## PyTorch Geometric实战

### 安装与环境配置

```bash
# 安装PyTorch Geometric
pip install torch-geometric

# 或者使用conda
conda install pyg -c pyg

# 安装额外依赖
pip install torch-scatter torch-sparse torch-cluster torch-spline-conv
```

### 数据加载与处理

```python
import torch
from torch_geometric.datasets import Planetoid, TUDataset
from torch_geometric.loader import DataLoader, NeighborLoader
from torch_geometric.transforms import NormalizeFeatures, RandomNodeSplit

# 加载节点分类数据集
dataset = Planetoid(root='data/Planetoid', name='Cora',
                   transform=NormalizeFeatures())
data = dataset[0]

print(f'数据集: {dataset}')
print(f'图数量: {len(dataset)}')
print(f'特征维度: {dataset.num_features}')
print(f'类别数: {dataset.num_classes}')
print(f'节点数: {data.num_nodes}')
print(f'边数: {data.num_edges}')
print(f'训练节点数: {data.train_mask.sum().item()}')

# 加载图分类数据集
graph_dataset = TUDataset(root='data/TUDataset', name='MUTAG')
print(f'图分类数据集: {graph_dataset}')
print(f'图数量: {len(graph_dataset)}')
print(f'特征维度: {graph_dataset.num_features}')
print(f'类别数: {graph_dataset.num_classes}')

# 划分训练/测试集
train_dataset = graph_dataset[:150]
test_dataset = graph_dataset[150:]

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

# 使用NeighborLoader进行大规模图采样
neighbor_loader = NeighborLoader(
    data,
    num_neighbors=[25, 10],  # 每层采样的邻居数
    batch_size=128,
    input_nodes=data.train_mask,
)

for batch in neighbor_loader:
    print(f'Batch节点数: {batch.num_nodes}')
    print(f'Batch边数: {batch.num_edges}')
    print(f'目标节点数: {batch.batch_size}')
    break
```

### 使用PyG内置层

```python
import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, SAGEConv, GATConv, GINConv
from torch_geometric.nn import global_mean_pool, global_add_pool

class PyGGCN(torch.nn.Module):
    """使用PyG的GCN"""
    def __init__(self, num_features, num_classes, hidden_channels=64):
        super().__init__()
        self.conv1 = GCNConv(num_features, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, num_classes)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=0.5, training=self.training)
        x = self.conv2(x, edge_index)
        return x

class PyGSAGE(torch.nn.Module):
    """使用PyG的GraphSAGE"""
    def __init__(self, num_features, num_classes, hidden_channels=64):
        super().__init__()
        self.conv1 = SAGEConv(num_features, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, num_classes)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=0.5, training=self.training)
        x = self.conv2(x, edge_index)
        return x

class PyGGAT(torch.nn.Module):
    """使用PyG的GAT"""
    def __init__(self, num_features, num_classes, hidden_channels=8, heads=8):
        super().__init__()
        self.conv1 = GATConv(num_features, hidden_channels, heads=heads,
                            dropout=0.6)
        self.conv2 = GATConv(hidden_channels * heads, num_classes, heads=1,
                            concat=False, dropout=0.6)

    def forward(self, x, edge_index):
        x = F.dropout(x, p=0.6, training=self.training)
        x = F.elu(self.conv1(x, edge_index))
        x = F.dropout(x, p=0.6, training=self.training)
        x = self.conv2(x, edge_index)
        return x

class PyGGIN(torch.nn.Module):
    """使用PyG的GIN（图同构网络）"""
    def __init__(self, num_features, num_classes, hidden_channels=64):
        super().__init__()

        nn1 = torch.nn.Sequential(
            torch.nn.Linear(num_features, hidden_channels),
            torch.nn.ReLU(),
            torch.nn.Linear(hidden_channels, hidden_channels)
        )
        nn2 = torch.nn.Sequential(
            torch.nn.Linear(hidden_channels, hidden_channels),
            torch.nn.ReLU(),
            torch.nn.Linear(hidden_channels, hidden_channels)
        )

        self.conv1 = GINConv(nn1)
        self.conv2 = GINConv(nn2)
        self.lin = torch.nn.Linear(hidden_channels, num_classes)

    def forward(self, x, edge_index, batch=None):
        x = F.relu(self.conv1(x, edge_index))
        x = F.relu(self.conv2(x, edge_index))

        if batch is not None:
            x = global_add_pool(x, batch)

        x = self.lin(x)
        return x
```

### 完整训练示例

```python
import torch
import torch.nn.functional as F
from torch_geometric.datasets import Planetoid
from torch_geometric.transforms import NormalizeFeatures
from torch_geometric.nn import GCNConv, GATConv

# 设置设备
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 加载Cora数据集
dataset = Planetoid(root='data/Planetoid', name='Cora',
                   transform=NormalizeFeatures())
data = dataset[0].to(device)

class GNN(torch.nn.Module):
    """灵活的GNN模型"""
    def __init__(self, model_type, num_features, num_classes,
                 hidden_channels=64, num_layers=2, heads=8, dropout=0.5):
        super().__init__()
        self.model_type = model_type
        self.dropout = dropout
        self.convs = torch.nn.ModuleList()

        if model_type == 'GCN':
            self.convs.append(GCNConv(num_features, hidden_channels))
            for _ in range(num_layers - 2):
                self.convs.append(GCNConv(hidden_channels, hidden_channels))
            self.convs.append(GCNConv(hidden_channels, num_classes))

        elif model_type == 'GAT':
            self.convs.append(GATConv(num_features, hidden_channels,
                                      heads=heads, dropout=dropout))
            for _ in range(num_layers - 2):
                self.convs.append(GATConv(hidden_channels * heads, hidden_channels,
                                         heads=heads, dropout=dropout))
            self.convs.append(GATConv(hidden_channels * heads, num_classes,
                                     heads=1, concat=False, dropout=dropout))

    def forward(self, x, edge_index):
        for i, conv in enumerate(self.convs[:-1]):
            x = conv(x, edge_index)
            x = F.elu(x) if self.model_type == 'GAT' else F.relu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)

        x = self.convs[-1](x, edge_index)
        return x

def train(model, data, optimizer):
    model.train()
    optimizer.zero_grad()

    out = model(data.x, data.edge_index)
    loss = F.cross_entropy(out[data.train_mask], data.y[data.train_mask])

    loss.backward()
    optimizer.step()

    return loss.item()

@torch.no_grad()
def evaluate(model, data):
    model.eval()
    out = model(data.x, data.edge_index)
    pred = out.argmax(dim=1)

    accs = []
    for mask in [data.train_mask, data.val_mask, data.test_mask]:
        correct = (pred[mask] == data.y[mask]).sum()
        accs.append(correct.item() / mask.sum().item())

    return accs

def run_experiment(model_type, data, epochs=200, lr=0.01, weight_decay=5e-4):
    """运行实验"""
    print(f'\n{"="*50}')
    print(f'Model: {model_type}')
    print(f'{"="*50}')

    model = GNN(
        model_type=model_type,
        num_features=dataset.num_features,
        num_classes=dataset.num_classes,
        hidden_channels=64 if model_type == 'GCN' else 8,
        heads=8
    ).to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=lr,
                                  weight_decay=weight_decay)

    best_val_acc = 0
    best_test_acc = 0

    for epoch in range(1, epochs + 1):
        loss = train(model, data, optimizer)
        train_acc, val_acc, test_acc = evaluate(model, data)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_test_acc = test_acc

        if epoch % 50 == 0:
            print(f'Epoch: {epoch:03d}, Loss: {loss:.4f}, '
                  f'Train: {train_acc:.4f}, Val: {val_acc:.4f}, '
                  f'Test: {test_acc:.4f}')

    print(f'\nBest Val Acc: {best_val_acc:.4f}')
    print(f'Best Test Acc: {best_test_acc:.4f}')

    return best_test_acc

# 运行不同模型的实验
results = {}
for model_type in ['GCN', 'GAT']:
    results[model_type] = run_experiment(model_type, data)

print('\n' + '='*50)
print('实验结果汇总:')
for model, acc in results.items():
    print(f'{model}: {acc:.4f}')
```

---

## 高级技巧与优化

### 过平滑问题

过平滑(Over-smoothing)是深层GNN的主要挑战，指节点表示随层数增加而趋于相同。

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv

class DeepGCNWithResidual(nn.Module):
    """带残差连接的深层GCN"""
    def __init__(self, num_features, num_classes, hidden_channels=64,
                 num_layers=8, dropout=0.5):
        super().__init__()
        self.num_layers = num_layers
        self.dropout = dropout

        self.convs = nn.ModuleList()
        self.bns = nn.ModuleList()

        # 输入投影
        self.input_proj = nn.Linear(num_features, hidden_channels)

        # GCN层
        for _ in range(num_layers):
            self.convs.append(GCNConv(hidden_channels, hidden_channels))
            self.bns.append(nn.BatchNorm1d(hidden_channels))

        # 输出层
        self.output = nn.Linear(hidden_channels, num_classes)

    def forward(self, x, edge_index):
        x = self.input_proj(x)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)

        for i in range(self.num_layers):
            identity = x  # 残差连接

            x = self.convs[i](x, edge_index)
            x = self.bns[i](x)
            x = F.relu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)

            x = x + identity  # 残差相加

        x = self.output(x)
        return x

class JKNet(nn.Module):
    """Jumping Knowledge Network: 结合不同层的表示"""
    def __init__(self, num_features, num_classes, hidden_channels=64,
                 num_layers=6, mode='cat'):
        super().__init__()
        self.num_layers = num_layers
        self.mode = mode

        self.convs = nn.ModuleList()
        self.convs.append(GCNConv(num_features, hidden_channels))
        for _ in range(num_layers - 1):
            self.convs.append(GCNConv(hidden_channels, hidden_channels))

        if mode == 'cat':
            self.output = nn.Linear(hidden_channels * num_layers, num_classes)
        elif mode == 'max':
            self.output = nn.Linear(hidden_channels, num_classes)
        elif mode == 'lstm':
            self.lstm = nn.LSTM(hidden_channels, hidden_channels,
                               batch_first=True, bidirectional=True)
            self.output = nn.Linear(2 * hidden_channels, num_classes)

    def forward(self, x, edge_index):
        layer_outputs = []

        for conv in self.convs:
            x = F.relu(conv(x, edge_index))
            x = F.dropout(x, p=0.5, training=self.training)
            layer_outputs.append(x)

        if self.mode == 'cat':
            # 拼接所有层输出
            x = torch.cat(layer_outputs, dim=-1)
        elif self.mode == 'max':
            # 逐元素最大值
            x = torch.stack(layer_outputs, dim=0).max(dim=0)[0]
        elif self.mode == 'lstm':
            # LSTM聚合
            x = torch.stack(layer_outputs, dim=1)  # [N, num_layers, H]
            x, _ = self.lstm(x)
            x = x[:, -1, :]  # 取最后时间步

        x = self.output(x)
        return x

def measure_smoothness(x, edge_index):
    """测量节点表示的平滑度（MAD: Mean Average Distance）"""
    row, col = edge_index

    # 计算邻居节点表示的差异
    diff = x[row] - x[col]
    mad = torch.abs(diff).mean()

    return mad.item()
```

### DropEdge正则化

```python
import torch

def drop_edge(edge_index, p=0.5):
    """随机丢弃边"""
    num_edges = edge_index.size(1)
    mask = torch.rand(num_edges) > p
    return edge_index[:, mask]

class GCNWithDropEdge(nn.Module):
    """带DropEdge的GCN"""
    def __init__(self, num_features, num_classes, hidden_channels=64,
                 num_layers=4, drop_edge_rate=0.5):
        super().__init__()
        self.drop_edge_rate = drop_edge_rate

        self.convs = nn.ModuleList()
        self.convs.append(GCNConv(num_features, hidden_channels))
        for _ in range(num_layers - 2):
            self.convs.append(GCNConv(hidden_channels, hidden_channels))
        self.convs.append(GCNConv(hidden_channels, num_classes))

    def forward(self, x, edge_index):
        for i, conv in enumerate(self.convs[:-1]):
            # 训练时随机丢弃边
            if self.training:
                edge_index_drop = drop_edge(edge_index, self.drop_edge_rate)
            else:
                edge_index_drop = edge_index

            x = conv(x, edge_index_drop)
            x = F.relu(x)
            x = F.dropout(x, p=0.5, training=self.training)

        x = self.convs[-1](x, edge_index)
        return x
```

### 图数据增强

```python
import torch
import numpy as np
from torch_geometric.utils import dropout_edge, add_random_edge

class GraphAugmentation:
    """图数据增强策略"""

    @staticmethod
    def node_dropout(x, p=0.5):
        """节点特征dropout"""
        mask = torch.rand(x.size(0), 1, device=x.device) > p
        return x * mask

    @staticmethod
    def feature_masking(x, p=0.3):
        """特征维度mask"""
        mask = torch.rand(1, x.size(1), device=x.device) > p
        return x * mask

    @staticmethod
    def edge_perturbation(edge_index, num_nodes, add_ratio=0.1, drop_ratio=0.1):
        """边扰动：添加和删除边"""
        # 删除边
        edge_index, _ = dropout_edge(edge_index, p=drop_ratio)

        # 添加随机边
        num_add = int(edge_index.size(1) * add_ratio)
        new_src = torch.randint(0, num_nodes, (num_add,))
        new_dst = torch.randint(0, num_nodes, (num_add,))
        new_edges = torch.stack([new_src, new_dst])

        edge_index = torch.cat([edge_index, new_edges], dim=1)

        return edge_index

    @staticmethod
    def subgraph_sampling(x, edge_index, ratio=0.8):
        """子图采样"""
        num_nodes = x.size(0)
        num_sample = int(num_nodes * ratio)

        # 随机选择节点
        perm = torch.randperm(num_nodes)[:num_sample]

        # 创建节点映射
        node_mask = torch.zeros(num_nodes, dtype=torch.bool)
        node_mask[perm] = True

        # 筛选边
        row, col = edge_index
        edge_mask = node_mask[row] & node_mask[col]
        edge_index = edge_index[:, edge_mask]

        # 重新编号
        node_idx = torch.zeros(num_nodes, dtype=torch.long)
        node_idx[perm] = torch.arange(num_sample)
        edge_index = node_idx[edge_index]

        return x[perm], edge_index

class ContrastiveGNN(nn.Module):
    """对比学习GNN"""
    def __init__(self, encoder, hidden_channels, proj_channels=64):
        super().__init__()
        self.encoder = encoder

        # 投影头
        self.projector = nn.Sequential(
            nn.Linear(hidden_channels, proj_channels),
            nn.ReLU(),
            nn.Linear(proj_channels, proj_channels)
        )

    def forward(self, x, edge_index):
        h = self.encoder(x, edge_index)
        z = self.projector(h)
        return h, z

    def contrastive_loss(self, z1, z2, temperature=0.5):
        """InfoNCE损失"""
        # 归一化
        z1 = F.normalize(z1, dim=-1)
        z2 = F.normalize(z2, dim=-1)

        # 计算相似度
        sim = torch.mm(z1, z2.t()) / temperature

        # 正样本是对角线
        labels = torch.arange(z1.size(0), device=z1.device)

        loss = F.cross_entropy(sim, labels) + F.cross_entropy(sim.t(), labels)
        return loss / 2
```

---

## 面试要点

### 核心概念题

**Q1: 解释GCN的工作原理和其与传统CNN的区别？**

**GCN原理：**
- GCN在谱域定义图卷积，通过图拉普拉斯矩阵的特征分解实现
- 核心公式: $H' = \sigma(\tilde{D}^{-1/2}\tilde{A}\tilde{D}^{-1/2}HW)$
- 每个节点聚合邻居特征并进行线性变换

**与CNN的区别：**

| 特性 | CNN | GCN |
|-----|-----|-----|
| 数据类型 | 规则网格（图像） | 不规则图结构 |
| 邻居定义 | 固定窗口（3x3, 5x5） | 由图结构决定 |
| 参数共享 | 卷积核在所有位置共享 | 变换矩阵在所有节点共享 |
| 平移不变性 | 有 | 无（排列不变性） |

**Q2: 消息传递机制的三个核心步骤是什么？**

```python
"""
1. MESSAGE（消息计算）:
   - 计算从邻居节点j到目标节点i的消息
   - m_ij = phi(h_i, h_j, e_ij)

2. AGGREGATE（消息聚合）:
   - 将所有邻居消息聚合为一个向量
   - m_i = AGG({m_ij | j in N(i)})
   - 常用聚合: sum, mean, max, attention

3. UPDATE（节点更新）:
   - 结合原始特征和聚合消息更新节点表示
   - h_i' = psi(h_i, m_i)
"""
```

**Q3: GCN、GraphSAGE和GAT的主要区别？**

| 模型 | 聚合方式 | 归纳能力 | 计算复杂度 | 特点 |
|-----|---------|---------|-----------|------|
| GCN | 归一化求和 | 转导式 | O(|E|) | 谱域卷积，简单高效 |
| GraphSAGE | 可学习聚合器 | 归纳式 | O(k^L|V|) | 邻居采样，可扩展 |
| GAT | 注意力加权 | 归纳式 | O(|E|H) | 自适应邻居权重 |

**Q4: 什么是过平滑问题？如何解决？**

**过平滑定义：**
随着GNN层数增加，所有节点的表示趋于相同，丧失区分性。

**数学解释：**
GCN的传播本质是拉普拉斯平滑，多次迭代后节点表示收敛到平稳分布。

**解决方案：**
```python
"""
1. 残差连接: h' = h + GNN(h)
2. JumpingKnowledge: 结合不同层输出
3. DropEdge: 训练时随机丢弃边
4. PairNorm: 层间归一化保持表示多样性
5. 使用更少的层（通常2-3层足够）
6. 初始残差连接: h' = alpha*h0 + (1-alpha)*GNN(h)
"""
```

### 工程实践题

**Q5: 如何处理大规模图数据？**

```python
"""
1. 邻居采样（GraphSAGE风格）:
   - 每层采样固定数量邻居
   - 减少计算和内存开销

2. 子图采样（Cluster-GCN）:
   - 将图划分为多个子图
   - 每个batch处理一个或多个子图

3. 层采样（FastGCN）:
   - 每层独立采样节点
   - 使用重要性采样减少方差

4. 分布式训练:
   - 使用DGL或PyG的分布式API
   - 图分区 + 跨机器通信
"""

from torch_geometric.loader import NeighborLoader, ClusterLoader

# 邻居采样
neighbor_loader = NeighborLoader(
    data,
    num_neighbors=[25, 10],
    batch_size=1024,
    input_nodes=data.train_mask
)

# 子图采样
from torch_geometric.loader import ClusterData, ClusterLoader
cluster_data = ClusterData(data, num_parts=100)
cluster_loader = ClusterLoader(cluster_data, batch_size=10, shuffle=True)
```

**Q6: 如何选择合适的GNN模型？**

```python
"""
场景指南：

1. 节点分类（半监督）:
   - 小图: GCN, GAT
   - 大图: GraphSAGE + 采样

2. 链接预测:
   - 同质图: GCN/SAGE编码 + MLP解码
   - 异质图: RGCN, HGT

3. 图分类:
   - GIN (区分能力最强)
   - 配合图池化: DiffPool, TopK

4. 推荐系统:
   - LightGCN (简化的GCN)
   - PinSage (工业级方案)

5. 知识图谱:
   - R-GCN (关系感知)
   - CompGCN (成分感知)
"""
```

**Q7: GNN的常见调参技巧？**

```python
"""
超参数调优指南：

1. 层数:
   - 通常2-3层足够
   - 更深需要残差连接

2. 隐藏维度:
   - 64-256常见
   - GAT每头通常8-16

3. Dropout:
   - 特征dropout: 0.5-0.6
   - 注意力dropout: 0.6 (GAT)

4. 学习率:
   - GCN/SAGE: 0.01
   - GAT: 0.005
   - Adam优化器

5. 权重衰减:
   - 5e-4通常有效
   - Cora等小数据集更需要

6. 聚合方式:
   - 节点分类: mean通常最好
   - 图分类: sum保留结构信息
"""
```

### 算法设计题

**Q8: 设计一个处理异构图的GNN模型**

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class HeteroGNN(nn.Module):
    """异构图神经网络"""
    def __init__(self, in_channels_dict, hidden_channels, out_channels,
                 edge_types):
        super().__init__()

        # 不同类型节点的输入投影
        self.input_projs = nn.ModuleDict({
            node_type: nn.Linear(in_ch, hidden_channels)
            for node_type, in_ch in in_channels_dict.items()
        })

        # 不同类型边的变换
        self.edge_projs = nn.ModuleDict({
            f'{src}_{rel}_{dst}': nn.Linear(hidden_channels, hidden_channels)
            for src, rel, dst in edge_types
        })

        # 注意力参数
        self.attn = nn.Parameter(torch.Tensor(1, hidden_channels))

        # 输出层
        self.output = nn.Linear(hidden_channels, out_channels)

        self.reset_parameters()

    def reset_parameters(self):
        for proj in self.input_projs.values():
            nn.init.xavier_uniform_(proj.weight)
        for proj in self.edge_projs.values():
            nn.init.xavier_uniform_(proj.weight)
        nn.init.xavier_uniform_(self.attn)

    def forward(self, x_dict, edge_index_dict):
        """
        x_dict: {node_type: tensor}
        edge_index_dict: {(src, rel, dst): edge_index}
        """
        # 输入投影
        h_dict = {
            node_type: F.relu(self.input_projs[node_type](x))
            for node_type, x in x_dict.items()
        }

        # 消息传递
        out_dict = {node_type: [] for node_type in x_dict.keys()}

        for (src_type, rel, dst_type), edge_index in edge_index_dict.items():
            src, dst = edge_index

            # 变换源节点特征
            edge_key = f'{src_type}_{rel}_{dst_type}'
            msg = self.edge_projs[edge_key](h_dict[src_type][src])

            # 聚合
            aggr = torch.zeros(h_dict[dst_type].size(0), msg.size(-1),
                              device=msg.device)
            aggr.scatter_add_(0, dst.unsqueeze(-1).expand_as(msg), msg)

            out_dict[dst_type].append(aggr)

        # 合并不同关系的消息（使用注意力）
        result_dict = {}
        for node_type, messages in out_dict.items():
            if messages:
                stacked = torch.stack(messages, dim=1)  # [N, num_relations, H]
                attn_scores = (stacked * self.attn).sum(-1, keepdim=True)
                attn_weights = F.softmax(attn_scores, dim=1)
                result_dict[node_type] = (stacked * attn_weights).sum(dim=1)
            else:
                result_dict[node_type] = h_dict[node_type]

        return result_dict
```

**Q9: 实现图级别的对比学习**

```python
class GraphCL(nn.Module):
    """图对比学习"""
    def __init__(self, encoder, hidden_channels, proj_channels=64):
        super().__init__()
        self.encoder = encoder
        self.projector = nn.Sequential(
            nn.Linear(hidden_channels, proj_channels),
            nn.ReLU(),
            nn.Linear(proj_channels, proj_channels)
        )

    def augment(self, x, edge_index, batch):
        """图增强"""
        # 节点丢弃
        node_mask = torch.rand(x.size(0)) > 0.2
        x_aug = x.clone()
        x_aug[~node_mask] = 0

        # 边丢弃
        edge_mask = torch.rand(edge_index.size(1)) > 0.2
        edge_index_aug = edge_index[:, edge_mask]

        return x_aug, edge_index_aug

    def forward(self, x, edge_index, batch):
        # 原始图编码
        h1 = self.encoder(x, edge_index, batch)
        z1 = self.projector(h1)

        # 增强图编码
        x_aug, edge_index_aug = self.augment(x, edge_index, batch)
        h2 = self.encoder(x_aug, edge_index_aug, batch)
        z2 = self.projector(h2)

        return z1, z2

    def loss(self, z1, z2, temperature=0.5):
        """NT-Xent损失"""
        z1 = F.normalize(z1, dim=-1)
        z2 = F.normalize(z2, dim=-1)

        batch_size = z1.size(0)
        z = torch.cat([z1, z2], dim=0)

        sim = torch.mm(z, z.t()) / temperature
        sim_ij = torch.diag(sim, batch_size)
        sim_ji = torch.diag(sim, -batch_size)

        positives = torch.cat([sim_ij, sim_ji], dim=0)

        mask = (~torch.eye(2 * batch_size, dtype=bool, device=z.device)).float()
        negatives = sim * mask

        labels = torch.zeros(2 * batch_size, device=z.device, dtype=torch.long)
        logits = torch.cat([positives.unsqueeze(1), negatives], dim=1)

        return F.cross_entropy(logits, labels)
```

---

## 延伸阅读

### 推荐资源

1. **论文**
   - GCN: "Semi-Supervised Classification with Graph Convolutional Networks"
   - GraphSAGE: "Inductive Representation Learning on Large Graphs"
   - GAT: "Graph Attention Networks"
   - GIN: "How Powerful are Graph Neural Networks?"

2. **书籍与教程**
   - 《图表示学习》- William L. Hamilton
   - Stanford CS224W: Machine Learning with Graphs
   - PyTorch Geometric官方教程

3. **开源库**
   - PyTorch Geometric (PyG)
   - Deep Graph Library (DGL)
   - GraphNets (DeepMind)
   - Spektral (Keras)

### 进阶主题

- 图Transformer
- 时序图神经网络
- 3D分子图神经网络
- 图生成模型
- 可解释图神经网络
- 图神经网络的理论分析

---

通过本文的学习，你应该能够：

1. 理解图神经网络的核心原理和消息传递框架
2. 掌握GCN、GraphSAGE、GAT三大经典模型
3. 使用PyTorch Geometric实现各类图学习任务
4. 了解过平滑等常见问题及解决方案
5. 在面试中自信地回答GNN相关问题

图神经网络是一个快速发展的领域，新模型和新应用不断涌现。建议持续关注顶会论文，并通过实际项目积累经验。
