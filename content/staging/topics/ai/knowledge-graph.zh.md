---
title: 图机器学习：知识图谱
description: 构建和应用知识图谱：知识表示、图嵌入和链接预测
track: ai
section: deep-learning
difficulty: advanced
tags:
  - 知识图谱
  - 图嵌入
  - 链接预测
  - 知识表示
status: imported
origin: old/src/content/docs/datascience/knowledge-graph.zh.md
divergence: 0.187
issues: []
legacy:
  category: DataScience
  subcategory: GraphML
  order: 28
  lastUpdated: 2026-01-07
---

知识图谱（Knowledge Graph）是一种结构化的语义知识库，通过图的形式组织和表示实体之间的关系。它已成为人工智能领域的核心技术之一，广泛应用于搜索引擎、推荐系统、问答系统和智能助手等场景。本文将系统介绍知识图谱的核心概念、图嵌入技术和实际应用。

---

## 知识图谱概念

### 什么是知识图谱？

知识图谱是一种用图结构表示知识的方式，其中**节点**代表实体（Entity），**边**代表实体之间的关系（Relation）。它能够以机器可理解的方式存储和组织现实世界的知识。

**核心特点：**
- **结构化**：知识以结构化的形式存储，便于机器处理
- **语义丰富**：不仅存储数据，还包含数据之间的语义关系
- **可推理**：支持基于图结构的推理和查询
- **可扩展**：易于添加新的实体和关系

### 知名知识图谱项目

| 知识图谱 | 机构 | 规模 | 特点 |
|---------|------|------|------|
| Freebase | Google | 30亿三元组 | 已整合到Google Knowledge Graph |
| DBpedia | 社区 | 5.8亿三元组 | 从Wikipedia提取 |
| Wikidata | Wikimedia | 10亿+三元组 | 开放、协作编辑 |
| YAGO | Max Planck | 1.2亿三元组 | 高精度、本体丰富 |
| ConceptNet | MIT | 2100万三元组 | 常识知识 |
| CN-DBpedia | 复旦大学 | 千万级 | 中文知识图谱 |

### 应用场景

```
+------------------+     +------------------+     +------------------+
|    搜索引擎       |     |    推荐系统       |     |    智能问答       |
|  知识卡片展示     |     |  基于知识的推荐    |     |  KBQA系统        |
+------------------+     +------------------+     +------------------+
         |                       |                       |
         +-------------+---------+---------+-------------+
                       |                   |
              +------------------+ +------------------+
              |    金融风控       | |    医疗诊断       |
              |  关系网络分析     | |  疾病知识推理     |
              +------------------+ +------------------+
```

---

## 知识表示：三元组

### 三元组基础

知识图谱的基本单元是**三元组（Triple）**，表示为 `(头实体, 关系, 尾实体)` 或 `(h, r, t)`。

**示例三元组：**
```
(北京, 首都_属于, 中国)
(爱因斯坦, 出生地, 德国)
(Python, 发明者, Guido van Rossum)
(姚明, 身高, 226cm)
```

### 三元组的形式化定义

设知识图谱 $\mathcal{G} = (\mathcal{E}, \mathcal{R}, \mathcal{T})$，其中：
- $\mathcal{E}$：实体集合
- $\mathcal{R}$：关系集合
- $\mathcal{T} \subseteq \mathcal{E} \times \mathcal{R} \times \mathcal{E}$：三元组集合

每个三元组 $(h, r, t) \in \mathcal{T}$ 表示头实体 $h$ 与尾实体 $t$ 之间存在关系 $r$。

### Python中的知识图谱表示

```python
from dataclasses import dataclass
from typing import List, Dict, Set, Tuple, Optional
import networkx as nx
import numpy as np

@dataclass
class Triple:
    """三元组数据类"""
    head: str
    relation: str
    tail: str

    def __hash__(self):
        return hash((self.head, self.relation, self.tail))

    def __eq__(self, other):
        return (self.head, self.relation, self.tail) == \
               (other.head, other.relation, other.tail)

class KnowledgeGraph:
    """知识图谱基础类"""

    def __init__(self):
        self.triples: Set[Triple] = set()
        self.entities: Set[str] = set()
        self.relations: Set[str] = set()

        # 索引结构
        self.head_index: Dict[str, Set[Triple]] = {}
        self.tail_index: Dict[str, Set[Triple]] = {}
        self.relation_index: Dict[str, Set[Triple]] = {}

        # NetworkX图用于图算法
        self.graph = nx.MultiDiGraph()

    def add_triple(self, head: str, relation: str, tail: str) -> None:
        """添加三元组"""
        triple = Triple(head, relation, tail)

        if triple in self.triples:
            return

        self.triples.add(triple)
        self.entities.add(head)
        self.entities.add(tail)
        self.relations.add(relation)

        # 更新索引
        self._update_index(self.head_index, head, triple)
        self._update_index(self.tail_index, tail, triple)
        self._update_index(self.relation_index, relation, triple)

        # 更新NetworkX图
        self.graph.add_edge(head, tail, relation=relation)

    def _update_index(self, index: Dict, key: str, triple: Triple) -> None:
        """更新索引"""
        if key not in index:
            index[key] = set()
        index[key].add(triple)

    def get_triples_by_head(self, head: str) -> Set[Triple]:
        """根据头实体查询三元组"""
        return self.head_index.get(head, set())

    def get_triples_by_tail(self, tail: str) -> Set[Triple]:
        """根据尾实体查询三元组"""
        return self.tail_index.get(tail, set())

    def get_triples_by_relation(self, relation: str) -> Set[Triple]:
        """根据关系查询三元组"""
        return self.relation_index.get(relation, set())

    def get_neighbors(self, entity: str, direction: str = 'both') -> Set[str]:
        """获取实体的邻居节点"""
        neighbors = set()

        if direction in ['out', 'both']:
            for triple in self.get_triples_by_head(entity):
                neighbors.add(triple.tail)

        if direction in ['in', 'both']:
            for triple in self.get_triples_by_tail(entity):
                neighbors.add(triple.head)

        return neighbors

    def shortest_path(self, source: str, target: str) -> Optional[List[str]]:
        """计算两个实体之间的最短路径"""
        try:
            return nx.shortest_path(self.graph, source, target)
        except nx.NetworkXNoPath:
            return None

    def __len__(self) -> int:
        return len(self.triples)

    def statistics(self) -> Dict:
        """返回知识图谱统计信息"""
        return {
            'num_triples': len(self.triples),
            'num_entities': len(self.entities),
            'num_relations': len(self.relations),
            'avg_degree': 2 * len(self.triples) / len(self.entities) if self.entities else 0
        }

# 使用示例
kg = KnowledgeGraph()

# 添加知识
kg.add_triple("北京", "首都_属于", "中国")
kg.add_triple("上海", "城市_属于", "中国")
kg.add_triple("中国", "位于", "亚洲")
kg.add_triple("日本", "位于", "亚洲")
kg.add_triple("东京", "首都_属于", "日本")
kg.add_triple("爱因斯坦", "出生于", "德国")
kg.add_triple("爱因斯坦", "获得", "诺贝尔物理学奖")
kg.add_triple("居里夫人", "获得", "诺贝尔物理学奖")

print(f"知识图谱统计: {kg.statistics()}")
print(f"中国的邻居: {kg.get_neighbors('中国')}")
print(f"北京到亚洲的路径: {kg.shortest_path('北京', '亚洲')}")
```

### RDF与OWL

知识图谱常用 **RDF（Resource Description Framework）** 进行形式化表示，使用 **OWL（Web Ontology Language）** 定义本体。

```python
from rdflib import Graph, Namespace, Literal, URIRef
from rdflib.namespace import RDF, RDFS, XSD

# 创建RDF图
g = Graph()

# 定义命名空间
EX = Namespace("http://example.org/")
g.bind("ex", EX)

# 添加三元组
g.add((EX.Beijing, EX.capitalOf, EX.China))
g.add((EX.Beijing, RDF.type, EX.City))
g.add((EX.China, RDF.type, EX.Country))
g.add((EX.Beijing, EX.population, Literal(21540000, datatype=XSD.integer)))

# SPARQL查询
query = """
SELECT ?city ?country
WHERE {
    ?city ex:capitalOf ?country .
    ?city rdf:type ex:City .
}
"""

results = g.query(query)
for row in results:
    print(f"{row.city} is capital of {row.country}")

# 序列化为Turtle格式
print(g.serialize(format='turtle'))
```

---

## 知识图谱构建

### 构建流程

知识图谱的构建是一个复杂的流程，主要包括以下步骤：

```
+----------------+     +----------------+     +----------------+
|   数据采集      | --> |   信息抽取      | --> |   知识融合      |
| 结构化/非结构化  |     | NER/RE/EL     |     | 实体对齐/消歧    |
+----------------+     +----------------+     +----------------+
                                                     |
                                                     v
+----------------+     +----------------+     +----------------+
|   知识存储      | <-- |   质量评估      | <-- |   知识推理      |
|   图数据库      |     |   一致性检查     |     |   规则/嵌入     |
+----------------+     +----------------+     +----------------+
```

### 命名实体识别（NER）

```python
import torch
import torch.nn as nn
from transformers import BertModel, BertTokenizer
from typing import List, Tuple

class BiLSTM_CRF_NER(nn.Module):
    """BiLSTM-CRF命名实体识别模型"""

    def __init__(self, vocab_size: int, embed_dim: int, hidden_dim: int,
                 num_tags: int, dropout: float = 0.5):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim // 2,
            bidirectional=True, batch_first=True,
            dropout=dropout, num_layers=2
        )
        self.hidden2tag = nn.Linear(hidden_dim, num_tags)
        self.dropout = nn.Dropout(dropout)

        # CRF层
        self.num_tags = num_tags
        self.transitions = nn.Parameter(torch.randn(num_tags, num_tags))
        self.start_transitions = nn.Parameter(torch.randn(num_tags))
        self.end_transitions = nn.Parameter(torch.randn(num_tags))

    def _get_lstm_features(self, x: torch.Tensor) -> torch.Tensor:
        """获取LSTM特征"""
        embeds = self.dropout(self.embedding(x))
        lstm_out, _ = self.lstm(embeds)
        lstm_out = self.dropout(lstm_out)
        emissions = self.hidden2tag(lstm_out)
        return emissions

    def _forward_algorithm(self, emissions: torch.Tensor,
                          mask: torch.Tensor) -> torch.Tensor:
        """前向算法计算配分函数"""
        batch_size, seq_len, num_tags = emissions.shape

        # 初始化
        score = self.start_transitions + emissions[:, 0]

        for i in range(1, seq_len):
            broadcast_score = score.unsqueeze(2)
            broadcast_emissions = emissions[:, i].unsqueeze(1)
            next_score = broadcast_score + self.transitions + broadcast_emissions
            next_score = torch.logsumexp(next_score, dim=1)
            score = torch.where(mask[:, i].unsqueeze(1), next_score, score)

        score = score + self.end_transitions
        return torch.logsumexp(score, dim=1)

    def _score_sentence(self, emissions: torch.Tensor, tags: torch.Tensor,
                       mask: torch.Tensor) -> torch.Tensor:
        """计算给定标签序列的得分"""
        batch_size, seq_len = tags.shape

        score = self.start_transitions[tags[:, 0]]
        score = score + emissions[torch.arange(batch_size), 0, tags[:, 0]]

        for i in range(1, seq_len):
            score = score + self.transitions[tags[:, i-1], tags[:, i]] * mask[:, i]
            score = score + emissions[torch.arange(batch_size), i, tags[:, i]] * mask[:, i]

        last_tag_indices = mask.sum(dim=1).long() - 1
        last_tags = tags[torch.arange(batch_size), last_tag_indices]
        score = score + self.end_transitions[last_tags]

        return score

    def forward(self, x: torch.Tensor, tags: torch.Tensor,
                mask: torch.Tensor) -> torch.Tensor:
        """计算负对数似然损失"""
        emissions = self._get_lstm_features(x)
        forward_score = self._forward_algorithm(emissions, mask)
        gold_score = self._score_sentence(emissions, tags, mask)
        return (forward_score - gold_score).mean()

    def decode(self, x: torch.Tensor, mask: torch.Tensor) -> List[List[int]]:
        """Viterbi解码"""
        emissions = self._get_lstm_features(x)
        return self._viterbi_decode(emissions, mask)

    def _viterbi_decode(self, emissions: torch.Tensor,
                       mask: torch.Tensor) -> List[List[int]]:
        """Viterbi算法解码最优路径"""
        batch_size, seq_len, num_tags = emissions.shape

        score = self.start_transitions + emissions[:, 0]
        history = []

        for i in range(1, seq_len):
            broadcast_score = score.unsqueeze(2)
            broadcast_emissions = emissions[:, i].unsqueeze(1)
            next_score = broadcast_score + self.transitions + broadcast_emissions
            next_score, indices = next_score.max(dim=1)
            score = torch.where(mask[:, i].unsqueeze(1), next_score, score)
            history.append(indices)

        score = score + self.end_transitions

        # 回溯
        best_tags_list = []
        _, best_last_tags = score.max(dim=1)

        for idx in range(batch_size):
            best_tags = [best_last_tags[idx].item()]
            seq_length = mask[idx].sum().int().item()

            for hist in reversed(history[:seq_length-1]):
                best_tags.append(hist[idx, best_tags[-1]].item())

            best_tags.reverse()
            best_tags_list.append(best_tags)

        return best_tags_list

# 基于BERT的NER
class BERT_NER(nn.Module):
    """BERT命名实体识别模型"""

    def __init__(self, bert_model: str, num_tags: int, dropout: float = 0.1):
        super().__init__()
        self.bert = BertModel.from_pretrained(bert_model)
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_tags)

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor,
                labels: torch.Tensor = None) -> Tuple[torch.Tensor, torch.Tensor]:
        outputs = self.bert(input_ids, attention_mask=attention_mask)
        sequence_output = self.dropout(outputs.last_hidden_state)
        logits = self.classifier(sequence_output)

        loss = None
        if labels is not None:
            loss_fn = nn.CrossEntropyLoss(ignore_index=-100)
            loss = loss_fn(logits.view(-1, logits.size(-1)), labels.view(-1))

        return logits, loss
```

### 关系抽取（Relation Extraction）

```python
import torch
import torch.nn as nn
from transformers import BertModel

class RelationExtractor(nn.Module):
    """基于BERT的关系抽取模型"""

    def __init__(self, bert_model: str, num_relations: int, dropout: float = 0.1):
        super().__init__()
        self.bert = BertModel.from_pretrained(bert_model)
        hidden_size = self.bert.config.hidden_size

        # 实体标记嵌入
        self.entity_start_embedding = nn.Embedding(2, hidden_size)

        # 分类器
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size * 3, hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, num_relations)
        )

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor,
                head_positions: torch.Tensor, tail_positions: torch.Tensor,
                labels: torch.Tensor = None):
        """
        Args:
            input_ids: 输入token IDs
            attention_mask: 注意力掩码
            head_positions: 头实体位置
            tail_positions: 尾实体位置
            labels: 关系标签
        """
        outputs = self.bert(input_ids, attention_mask=attention_mask)
        sequence_output = outputs.last_hidden_state

        batch_size = input_ids.size(0)

        # 获取[CLS]表示
        cls_output = sequence_output[:, 0]

        # 获取实体表示
        head_output = sequence_output[
            torch.arange(batch_size), head_positions
        ]
        tail_output = sequence_output[
            torch.arange(batch_size), tail_positions
        ]

        # 拼接特征
        concat_output = torch.cat([cls_output, head_output, tail_output], dim=-1)
        logits = self.classifier(concat_output)

        loss = None
        if labels is not None:
            loss_fn = nn.CrossEntropyLoss()
            loss = loss_fn(logits, labels)

        return logits, loss

# 联合实体关系抽取
class JointExtractor(nn.Module):
    """联合实体关系抽取模型（TPLinker风格）"""

    def __init__(self, bert_model: str, num_relations: int, hidden_size: int = 256):
        super().__init__()
        self.bert = BertModel.from_pretrained(bert_model)
        bert_hidden = self.bert.config.hidden_size

        self.entity_head_extractor = nn.Linear(bert_hidden, 2)
        self.entity_tail_extractor = nn.Linear(bert_hidden, 2)

        # 关系抽取（头到头、尾到尾的配对）
        self.relation_head_extractor = nn.Linear(bert_hidden * 2, num_relations)
        self.relation_tail_extractor = nn.Linear(bert_hidden * 2, num_relations)

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor):
        outputs = self.bert(input_ids, attention_mask=attention_mask)
        hidden_states = outputs.last_hidden_state

        batch_size, seq_len, hidden_dim = hidden_states.shape

        # 实体头尾预测
        entity_heads = self.entity_head_extractor(hidden_states)
        entity_tails = self.entity_tail_extractor(hidden_states)

        # 构建配对表示用于关系预测
        # [batch, seq, seq, hidden*2]
        hidden_expand1 = hidden_states.unsqueeze(2).expand(-1, -1, seq_len, -1)
        hidden_expand2 = hidden_states.unsqueeze(1).expand(-1, seq_len, -1, -1)
        pair_hidden = torch.cat([hidden_expand1, hidden_expand2], dim=-1)

        # 关系预测
        relation_heads = self.relation_head_extractor(pair_hidden)
        relation_tails = self.relation_tail_extractor(pair_hidden)

        return {
            'entity_heads': entity_heads,
            'entity_tails': entity_tails,
            'relation_heads': relation_heads,
            'relation_tails': relation_tails
        }
```

---

## 图嵌入基础

### 为什么需要图嵌入？

知识图谱中的实体和关系是离散的符号，难以直接用于机器学习模型。**图嵌入（Graph Embedding）** 将实体和关系映射到连续的低维向量空间，使得：

1. **相似实体距离近**：语义相近的实体在向量空间中距离较近
2. **保持图结构**：嵌入向量能够反映图中的拓扑结构
3. **支持下游任务**：可用于链接预测、实体分类、关系推理等任务

### 嵌入学习的基本框架

```python
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from typing import Tuple, List
import numpy as np

class KGEmbeddingDataset(Dataset):
    """知识图谱嵌入训练数据集"""

    def __init__(self, triples: List[Tuple[int, int, int]],
                 num_entities: int, num_relations: int,
                 negative_sample_size: int = 10):
        self.triples = triples
        self.num_entities = num_entities
        self.num_relations = num_relations
        self.negative_sample_size = negative_sample_size

        # 构建三元组集合用于过滤假负样本
        self.triple_set = set(triples)

    def __len__(self):
        return len(self.triples)

    def __getitem__(self, idx):
        head, relation, tail = self.triples[idx]

        # 负采样：替换头实体或尾实体
        negative_samples = []
        while len(negative_samples) < self.negative_sample_size:
            if np.random.random() < 0.5:
                # 替换头实体
                neg_head = np.random.randint(self.num_entities)
                if (neg_head, relation, tail) not in self.triple_set:
                    negative_samples.append((neg_head, relation, tail))
            else:
                # 替换尾实体
                neg_tail = np.random.randint(self.num_entities)
                if (head, relation, neg_tail) not in self.triple_set:
                    negative_samples.append((head, relation, neg_tail))

        return {
            'positive': (head, relation, tail),
            'negative': negative_samples
        }

class BaseKGEModel(nn.Module):
    """知识图谱嵌入基类"""

    def __init__(self, num_entities: int, num_relations: int, embedding_dim: int):
        super().__init__()
        self.num_entities = num_entities
        self.num_relations = num_relations
        self.embedding_dim = embedding_dim

        # 实体和关系嵌入
        self.entity_embedding = nn.Embedding(num_entities, embedding_dim)
        self.relation_embedding = nn.Embedding(num_relations, embedding_dim)

        self._init_embeddings()

    def _init_embeddings(self):
        """初始化嵌入"""
        nn.init.xavier_uniform_(self.entity_embedding.weight)
        nn.init.xavier_uniform_(self.relation_embedding.weight)

    def score_function(self, head: torch.Tensor, relation: torch.Tensor,
                      tail: torch.Tensor) -> torch.Tensor:
        """评分函数（子类实现）"""
        raise NotImplementedError

    def forward(self, head_idx: torch.Tensor, relation_idx: torch.Tensor,
                tail_idx: torch.Tensor) -> torch.Tensor:
        head = self.entity_embedding(head_idx)
        relation = self.relation_embedding(relation_idx)
        tail = self.entity_embedding(tail_idx)
        return self.score_function(head, relation, tail)
```

---

## TransE/TransR模型

### TransE：平移距离模型

**TransE** 是最经典的知识图谱嵌入模型，其核心思想是将关系建模为实体间的平移操作。

**基本假设：** 对于正确的三元组 $(h, r, t)$，应满足 $\mathbf{h} + \mathbf{r} \approx \mathbf{t}$

**评分函数：**
$$f_r(h, t) = -||\mathbf{h} + \mathbf{r} - \mathbf{t}||_{L_1/L_2}$$

```python
class TransE(BaseKGEModel):
    """TransE模型实现"""

    def __init__(self, num_entities: int, num_relations: int,
                 embedding_dim: int, margin: float = 1.0, p_norm: int = 2):
        super().__init__(num_entities, num_relations, embedding_dim)
        self.margin = margin
        self.p_norm = p_norm

    def _init_embeddings(self):
        """TransE特定的初始化"""
        nn.init.xavier_uniform_(self.entity_embedding.weight)
        nn.init.xavier_uniform_(self.relation_embedding.weight)

        # 归一化实体嵌入
        with torch.no_grad():
            self.entity_embedding.weight.data = torch.nn.functional.normalize(
                self.entity_embedding.weight.data, p=2, dim=1
            )

    def score_function(self, head: torch.Tensor, relation: torch.Tensor,
                      tail: torch.Tensor) -> torch.Tensor:
        """计算TransE得分"""
        # score = -||h + r - t||
        return -torch.norm(head + relation - tail, p=self.p_norm, dim=-1)

    def loss(self, pos_head: torch.Tensor, pos_relation: torch.Tensor,
             pos_tail: torch.Tensor, neg_head: torch.Tensor,
             neg_relation: torch.Tensor, neg_tail: torch.Tensor) -> torch.Tensor:
        """基于margin的排序损失"""
        pos_score = self.forward(pos_head, pos_relation, pos_tail)
        neg_score = self.forward(neg_head, neg_relation, neg_tail)

        # Margin-based ranking loss
        # max(0, margin + d_pos - d_neg)
        return torch.relu(self.margin - pos_score + neg_score).mean()

    def regularization(self) -> torch.Tensor:
        """L2正则化"""
        entity_reg = torch.sum(self.entity_embedding.weight ** 2)
        relation_reg = torch.sum(self.relation_embedding.weight ** 2)
        return entity_reg + relation_reg

# TransE训练示例
def train_transe(model: TransE, train_data: DataLoader,
                 epochs: int = 100, lr: float = 0.01):
    """训练TransE模型"""
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    for epoch in range(epochs):
        total_loss = 0
        for batch in train_data:
            pos_h, pos_r, pos_t = batch['positive']
            neg_samples = batch['negative']

            # 随机选择一个负样本
            neg_idx = np.random.randint(len(neg_samples))
            neg_h, neg_r, neg_t = neg_samples[neg_idx]

            optimizer.zero_grad()
            loss = model.loss(pos_h, pos_r, pos_t, neg_h, neg_r, neg_t)
            loss.backward()

            # 梯度裁剪
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            optimizer.step()

            # 归一化实体嵌入
            with torch.no_grad():
                model.entity_embedding.weight.data = torch.nn.functional.normalize(
                    model.entity_embedding.weight.data, p=2, dim=1
                )

            total_loss += loss.item()

        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}, Loss: {total_loss/len(train_data):.4f}")
```

### TransR：关系空间模型

**TransR** 改进了 TransE 的局限性，允许每个关系有独立的投影空间。

**核心思想：** 实体在关系特定的空间中进行平移操作。

$$\mathbf{h}_r = \mathbf{h}\mathbf{M}_r, \quad \mathbf{t}_r = \mathbf{t}\mathbf{M}_r$$
$$f_r(h, t) = -||\mathbf{h}_r + \mathbf{r} - \mathbf{t}_r||$$

```python
class TransR(BaseKGEModel):
    """TransR模型实现"""

    def __init__(self, num_entities: int, num_relations: int,
                 entity_dim: int, relation_dim: int, margin: float = 1.0):
        self.entity_dim = entity_dim
        self.relation_dim = relation_dim

        super().__init__(num_entities, num_relations, entity_dim)

        # 关系嵌入维度可能不同
        self.relation_embedding = nn.Embedding(num_relations, relation_dim)

        # 关系投影矩阵
        self.projection_matrix = nn.Embedding(
            num_relations, entity_dim * relation_dim
        )

        self.margin = margin
        self._init_embeddings()

    def _init_embeddings(self):
        nn.init.xavier_uniform_(self.entity_embedding.weight)
        nn.init.xavier_uniform_(self.relation_embedding.weight)

        # 初始化投影矩阵为单位矩阵
        with torch.no_grad():
            for i in range(self.num_relations):
                proj = torch.eye(self.relation_dim, self.entity_dim).flatten()
                if self.relation_dim < self.entity_dim:
                    proj = torch.zeros(self.entity_dim * self.relation_dim)
                    eye = torch.eye(self.relation_dim)
                    proj[:self.relation_dim * self.relation_dim] = eye.flatten()
                self.projection_matrix.weight[i] = proj

    def project(self, entity: torch.Tensor, relation_idx: torch.Tensor) -> torch.Tensor:
        """将实体投影到关系空间"""
        proj_matrix = self.projection_matrix(relation_idx)
        proj_matrix = proj_matrix.view(-1, self.relation_dim, self.entity_dim)

        # entity: [batch, entity_dim] -> [batch, entity_dim, 1]
        entity = entity.unsqueeze(-1)

        # 投影: [batch, relation_dim, entity_dim] @ [batch, entity_dim, 1]
        projected = torch.bmm(proj_matrix, entity).squeeze(-1)

        return projected

    def score_function(self, head: torch.Tensor, relation: torch.Tensor,
                      tail: torch.Tensor, relation_idx: torch.Tensor = None) -> torch.Tensor:
        """TransR评分函数"""
        if relation_idx is None:
            raise ValueError("TransR requires relation_idx for projection")

        # 投影实体
        head_proj = self.project(head, relation_idx)
        tail_proj = self.project(tail, relation_idx)

        # 计算得分
        return -torch.norm(head_proj + relation - tail_proj, p=2, dim=-1)

    def forward(self, head_idx: torch.Tensor, relation_idx: torch.Tensor,
                tail_idx: torch.Tensor) -> torch.Tensor:
        head = self.entity_embedding(head_idx)
        relation = self.relation_embedding(relation_idx)
        tail = self.entity_embedding(tail_idx)

        return self.score_function(head, relation, tail, relation_idx)

class TransH(BaseKGEModel):
    """TransH模型：在关系特定的超平面上进行平移"""

    def __init__(self, num_entities: int, num_relations: int,
                 embedding_dim: int, margin: float = 1.0):
        super().__init__(num_entities, num_relations, embedding_dim)

        # 关系超平面的法向量
        self.normal_vectors = nn.Embedding(num_relations, embedding_dim)
        self.margin = margin

        nn.init.xavier_uniform_(self.normal_vectors.weight)

    def project_to_hyperplane(self, entity: torch.Tensor,
                             normal: torch.Tensor) -> torch.Tensor:
        """将实体投影到超平面"""
        # h_proj = h - (h^T * n) * n
        dot_product = (entity * normal).sum(dim=-1, keepdim=True)
        return entity - dot_product * normal

    def score_function(self, head: torch.Tensor, relation: torch.Tensor,
                      tail: torch.Tensor, normal: torch.Tensor = None) -> torch.Tensor:
        if normal is None:
            raise ValueError("TransH requires normal vector")

        # 投影到超平面
        head_proj = self.project_to_hyperplane(head, normal)
        tail_proj = self.project_to_hyperplane(tail, normal)

        return -torch.norm(head_proj + relation - tail_proj, p=2, dim=-1)

    def forward(self, head_idx: torch.Tensor, relation_idx: torch.Tensor,
                tail_idx: torch.Tensor) -> torch.Tensor:
        head = self.entity_embedding(head_idx)
        relation = self.relation_embedding(relation_idx)
        tail = self.entity_embedding(tail_idx)
        normal = self.normal_vectors(relation_idx)

        # 归一化法向量
        normal = torch.nn.functional.normalize(normal, p=2, dim=-1)

        return self.score_function(head, relation, tail, normal)
```

---

## ComplEx/RotatE模型

### ComplEx：复数嵌入

**ComplEx** 使用复数空间进行嵌入，能够有效建模**非对称关系**和**组合关系**。

**评分函数：**
$$f_r(h, t) = \text{Re}(\langle \mathbf{h}, \mathbf{r}, \bar{\mathbf{t}} \rangle)$$

其中 $\bar{\mathbf{t}}$ 是 $\mathbf{t}$ 的复共轭。

```python
class ComplEx(nn.Module):
    """ComplEx模型：复数空间知识图谱嵌入"""

    def __init__(self, num_entities: int, num_relations: int, embedding_dim: int):
        super().__init__()

        # 实部和虚部嵌入
        self.entity_re = nn.Embedding(num_entities, embedding_dim)
        self.entity_im = nn.Embedding(num_entities, embedding_dim)
        self.relation_re = nn.Embedding(num_relations, embedding_dim)
        self.relation_im = nn.Embedding(num_relations, embedding_dim)

        self._init_embeddings()

    def _init_embeddings(self):
        for emb in [self.entity_re, self.entity_im,
                   self.relation_re, self.relation_im]:
            nn.init.xavier_uniform_(emb.weight)

    def score_function(self, head_re: torch.Tensor, head_im: torch.Tensor,
                      relation_re: torch.Tensor, relation_im: torch.Tensor,
                      tail_re: torch.Tensor, tail_im: torch.Tensor) -> torch.Tensor:
        """
        ComplEx评分函数
        Re(<h, r, conj(t)>) = Re(h) * Re(r) * Re(t) + Re(h) * Im(r) * Im(t)
                            + Im(h) * Re(r) * Im(t) - Im(h) * Im(r) * Re(t)
        """
        score = (head_re * relation_re * tail_re +
                head_re * relation_im * tail_im +
                head_im * relation_re * tail_im -
                head_im * relation_im * tail_re)

        return score.sum(dim=-1)

    def forward(self, head_idx: torch.Tensor, relation_idx: torch.Tensor,
                tail_idx: torch.Tensor) -> torch.Tensor:
        head_re = self.entity_re(head_idx)
        head_im = self.entity_im(head_idx)
        relation_re = self.relation_re(relation_idx)
        relation_im = self.relation_im(relation_idx)
        tail_re = self.entity_re(tail_idx)
        tail_im = self.entity_im(tail_idx)

        return self.score_function(head_re, head_im, relation_re, relation_im,
                                  tail_re, tail_im)

    def loss(self, pos_score: torch.Tensor, neg_score: torch.Tensor,
             gamma: float = 1.0) -> torch.Tensor:
        """二元交叉熵损失"""
        pos_loss = torch.nn.functional.softplus(-pos_score)
        neg_loss = torch.nn.functional.softplus(neg_score)
        return (pos_loss + neg_loss).mean()

    def regularization(self, lambda_reg: float = 0.001) -> torch.Tensor:
        """L2正则化"""
        reg = 0
        for emb in [self.entity_re, self.entity_im,
                   self.relation_re, self.relation_im]:
            reg += torch.sum(emb.weight ** 2)
        return lambda_reg * reg
```

### RotatE：旋转嵌入

**RotatE** 将关系建模为复平面上的旋转，能够建模多种关系模式。

**核心思想：** $\mathbf{t} = \mathbf{h} \circ \mathbf{r}$，其中 $\circ$ 是Hadamard积，$\mathbf{r}$ 的模为1。

**评分函数：**
$$f_r(h, t) = -||\mathbf{h} \circ \mathbf{r} - \mathbf{t}||$$

```python
class RotatE(nn.Module):
    """RotatE模型：旋转嵌入"""

    def __init__(self, num_entities: int, num_relations: int,
                 embedding_dim: int, gamma: float = 12.0):
        super().__init__()

        self.embedding_dim = embedding_dim
        self.gamma = gamma
        self.epsilon = 2.0

        # 嵌入范围
        self.embedding_range = (gamma + self.epsilon) / embedding_dim

        # 实体嵌入（复数）
        self.entity_re = nn.Embedding(num_entities, embedding_dim)
        self.entity_im = nn.Embedding(num_entities, embedding_dim)

        # 关系嵌入（相位角度）
        self.relation_phase = nn.Embedding(num_relations, embedding_dim)

        self._init_embeddings()

    def _init_embeddings(self):
        # 均匀初始化
        nn.init.uniform_(self.entity_re.weight, -self.embedding_range, self.embedding_range)
        nn.init.uniform_(self.entity_im.weight, -self.embedding_range, self.embedding_range)
        # 关系相位初始化在 [-pi, pi]
        nn.init.uniform_(self.relation_phase.weight, -np.pi, np.pi)

    def score_function(self, head_re: torch.Tensor, head_im: torch.Tensor,
                      relation_phase: torch.Tensor,
                      tail_re: torch.Tensor, tail_im: torch.Tensor) -> torch.Tensor:
        """
        RotatE评分函数
        h * r = (h_re + i*h_im) * (cos(phase) + i*sin(phase))
              = (h_re*cos - h_im*sin) + i*(h_re*sin + h_im*cos)
        """
        relation_re = torch.cos(relation_phase)
        relation_im = torch.sin(relation_phase)

        # 复数乘法：head * relation
        rotated_re = head_re * relation_re - head_im * relation_im
        rotated_im = head_re * relation_im + head_im * relation_re

        # 距离计算
        diff_re = rotated_re - tail_re
        diff_im = rotated_im - tail_im

        # L2范数
        score = torch.sqrt(diff_re ** 2 + diff_im ** 2 + 1e-9)
        score = self.gamma - score.sum(dim=-1)

        return score

    def forward(self, head_idx: torch.Tensor, relation_idx: torch.Tensor,
                tail_idx: torch.Tensor) -> torch.Tensor:
        head_re = self.entity_re(head_idx)
        head_im = self.entity_im(head_idx)
        relation_phase = self.relation_phase(relation_idx)
        tail_re = self.entity_re(tail_idx)
        tail_im = self.entity_im(tail_idx)

        return self.score_function(head_re, head_im, relation_phase, tail_re, tail_im)

    def loss(self, pos_score: torch.Tensor, neg_score: torch.Tensor,
             adversarial_temperature: float = 1.0) -> torch.Tensor:
        """自对抗负采样损失"""
        # 正样本损失
        pos_loss = -torch.nn.functional.logsigmoid(pos_score).mean()

        # 负样本权重（自对抗）
        neg_weights = torch.softmax(neg_score * adversarial_temperature, dim=-1).detach()
        neg_loss = -(neg_weights * torch.nn.functional.logsigmoid(-neg_score)).sum(dim=-1).mean()

        return (pos_loss + neg_loss) / 2

class DistMult(nn.Module):
    """DistMult模型：双线性对角模型"""

    def __init__(self, num_entities: int, num_relations: int, embedding_dim: int):
        super().__init__()

        self.entity_embedding = nn.Embedding(num_entities, embedding_dim)
        self.relation_embedding = nn.Embedding(num_relations, embedding_dim)

        nn.init.xavier_uniform_(self.entity_embedding.weight)
        nn.init.xavier_uniform_(self.relation_embedding.weight)

    def forward(self, head_idx: torch.Tensor, relation_idx: torch.Tensor,
                tail_idx: torch.Tensor) -> torch.Tensor:
        head = self.entity_embedding(head_idx)
        relation = self.relation_embedding(relation_idx)
        tail = self.entity_embedding(tail_idx)

        # 双线性评分: h^T * diag(r) * t = sum(h * r * t)
        return (head * relation * tail).sum(dim=-1)
```

### 模型对比

| 模型 | 评分函数 | 对称关系 | 反对称关系 | 逆关系 | 组合关系 |
|------|---------|---------|-----------|--------|---------|
| TransE | $-\|\|h+r-t\|\|$ | - | + | + | + |
| TransR | $-\|\|h_r+r-t_r\|\|$ | - | + | + | + |
| DistMult | $\langle h,r,t \rangle$ | + | - | - | - |
| ComplEx | $\text{Re}(\langle h,r,\bar{t} \rangle)$ | + | + | + | - |
| RotatE | $-\|\|h \circ r - t\|\|$ | + | + | + | + |

---

## 链接预测

### 任务定义

**链接预测（Link Prediction）** 是知识图谱最重要的任务之一，旨在预测缺失的三元组。

给定不完整的知识图谱和待预测的三元组 $(h, r, ?)$ 或 $(?, r, t)$，目标是找到最可能的实体。

### 模型性能测试

```python
import torch
import numpy as np
from typing import Dict, List, Tuple

class LinkPredictionTester:
    """链接预测性能测试器"""

    def __init__(self, model: nn.Module, test_triples: List[Tuple[int, int, int]],
                 all_triples: set, num_entities: int):
        self.model = model
        self.test_triples = test_triples
        self.all_triples = all_triples
        self.num_entities = num_entities

    @torch.no_grad()
    def run_test(self, batch_size: int = 100) -> Dict[str, float]:
        """测试模型性能"""
        self.model.eval()

        ranks_head = []
        ranks_tail = []

        for i in range(0, len(self.test_triples), batch_size):
            batch = self.test_triples[i:i+batch_size]

            for head, relation, tail in batch:
                # 尾实体预测
                tail_rank = self._get_rank(head, relation, tail, mode='tail')
                ranks_tail.append(tail_rank)

                # 头实体预测
                head_rank = self._get_rank(head, relation, tail, mode='head')
                ranks_head.append(head_rank)

        ranks = ranks_head + ranks_tail

        return {
            'MR': np.mean(ranks),
            'MRR': np.mean([1.0/r for r in ranks]),
            'Hits@1': np.mean([1 if r <= 1 else 0 for r in ranks]),
            'Hits@3': np.mean([1 if r <= 3 else 0 for r in ranks]),
            'Hits@10': np.mean([1 if r <= 10 else 0 for r in ranks]),
            'MR_head': np.mean(ranks_head),
            'MR_tail': np.mean(ranks_tail),
        }

    def _get_rank(self, head: int, relation: int, tail: int, mode: str) -> int:
        """计算排名（过滤设定）"""
        # 生成所有候选
        candidates = torch.arange(self.num_entities)

        if mode == 'tail':
            heads = torch.full_like(candidates, head)
            relations = torch.full_like(candidates, relation)
            tails = candidates
            true_entity = tail
        else:
            heads = candidates
            relations = torch.full_like(candidates, relation)
            tails = torch.full_like(candidates, tail)
            true_entity = head

        # 计算得分
        scores = self.model(heads, relations, tails)

        # 过滤已知三元组
        for e in range(self.num_entities):
            if mode == 'tail':
                if (head, relation, e) in self.all_triples and e != tail:
                    scores[e] = float('-inf')
            else:
                if (e, relation, tail) in self.all_triples and e != head:
                    scores[e] = float('-inf')

        # 计算排名
        sorted_indices = torch.argsort(scores, descending=True)
        rank = (sorted_indices == true_entity).nonzero().item() + 1

        return rank

# 完整的训练和测试流程
def train_and_test(model: nn.Module, train_data: DataLoader,
                   valid_data: List[Tuple], test_data: List[Tuple],
                   all_triples: set, num_entities: int,
                   epochs: int = 100, lr: float = 0.001):
    """完整的训练测试流程"""
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    best_mrr = 0

    for epoch in range(epochs):
        # 训练
        model.train()
        total_loss = 0

        for batch in train_data:
            optimizer.zero_grad()

            pos_h, pos_r, pos_t = batch['positive']
            neg_samples = batch['negative']

            # 计算正样本得分
            pos_score = model(
                torch.tensor([pos_h]),
                torch.tensor([pos_r]),
                torch.tensor([pos_t])
            )

            # 计算负样本得分
            neg_h = torch.tensor([s[0] for s in neg_samples])
            neg_r = torch.tensor([s[1] for s in neg_samples])
            neg_t = torch.tensor([s[2] for s in neg_samples])
            neg_score = model(neg_h, neg_r, neg_t)

            # 损失计算
            loss = model.loss(pos_score, neg_score)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        # 验证
        if (epoch + 1) % 10 == 0:
            tester = LinkPredictionTester(
                model, valid_data, all_triples, num_entities
            )
            metrics = tester.run_test()

            print(f"Epoch {epoch+1}")
            print(f"  Train Loss: {total_loss/len(train_data):.4f}")
            print(f"  Valid MRR: {metrics['MRR']:.4f}, Hits@10: {metrics['Hits@10']:.4f}")

            if metrics['MRR'] > best_mrr:
                best_mrr = metrics['MRR']
                torch.save(model.state_dict(), 'best_model.pt')

    # 测试
    model.load_state_dict(torch.load('best_model.pt'))
    tester = LinkPredictionTester(model, test_data, all_triples, num_entities)
    test_metrics = tester.run_test()

    print("\nTest Results:")
    for key, value in test_metrics.items():
        print(f"  {key}: {value:.4f}")

    return test_metrics
```

---

## 知识图谱补全

### 规则学习方法

```python
from collections import defaultdict
from typing import Set, Tuple, List

class RuleLearner:
    """基于规则的知识图谱补全"""

    def __init__(self, kg: KnowledgeGraph):
        self.kg = kg
        self.rules = []

    def learn_rules(self, min_support: int = 10, min_confidence: float = 0.5):
        """学习关联规则"""
        # 查找长度为2的路径规则: r1(X,Y) ^ r2(Y,Z) => r3(X,Z)
        path_rules = self._find_path_rules(min_support, min_confidence)
        self.rules.extend(path_rules)

        # 查找逆关系规则: r1(X,Y) => r2(Y,X)
        inverse_rules = self._find_inverse_rules(min_support, min_confidence)
        self.rules.extend(inverse_rules)

        return self.rules

    def _find_path_rules(self, min_support: int,
                         min_confidence: float) -> List[dict]:
        """发现路径规则"""
        rules = []

        # 统计 r1(h,m) ^ r2(m,t) 的出现次数
        path_counts = defaultdict(lambda: defaultdict(int))

        for triple1 in self.kg.triples:
            h, r1, m = triple1.head, triple1.relation, triple1.tail

            for triple2 in self.kg.get_triples_by_head(m):
                r2 = triple2.relation
                t = triple2.tail

                # 查找 r3(h, t)
                for triple3 in self.kg.get_triples_by_head(h):
                    if triple3.tail == t:
                        r3 = triple3.relation
                        path_counts[(r1, r2)][r3] += 1

        # 过滤并生成规则
        for (r1, r2), consequents in path_counts.items():
            body_count = sum(consequents.values())

            for r3, count in consequents.items():
                if count >= min_support:
                    confidence = count / body_count
                    if confidence >= min_confidence:
                        rules.append({
                            'type': 'path',
                            'body': [(r1, 'forward'), (r2, 'forward')],
                            'head': r3,
                            'support': count,
                            'confidence': confidence
                        })

        return rules

    def _find_inverse_rules(self, min_support: int,
                           min_confidence: float) -> List[dict]:
        """发现逆关系规则"""
        rules = []

        # 统计 r1(X,Y) 且 r2(Y,X) 同时存在的情况
        inverse_counts = defaultdict(int)
        r1_counts = defaultdict(int)

        for triple in self.kg.triples:
            h, r1, t = triple.head, triple.relation, triple.tail
            r1_counts[r1] += 1

            for triple2 in self.kg.get_triples_by_head(t):
                if triple2.tail == h:
                    r2 = triple2.relation
                    inverse_counts[(r1, r2)] += 1

        for (r1, r2), count in inverse_counts.items():
            if count >= min_support:
                confidence = count / r1_counts[r1]
                if confidence >= min_confidence:
                    rules.append({
                        'type': 'inverse',
                        'body': [(r1, 'forward')],
                        'head': r2,
                        'inverse': True,
                        'support': count,
                        'confidence': confidence
                    })

        return rules

    def apply_rules(self, max_iterations: int = 10) -> Set[Tuple[str, str, str]]:
        """应用规则推理新三元组"""
        new_triples = set()

        for iteration in range(max_iterations):
            iter_new = set()

            for rule in self.rules:
                if rule['type'] == 'path':
                    inferred = self._apply_path_rule(rule)
                elif rule['type'] == 'inverse':
                    inferred = self._apply_inverse_rule(rule)
                else:
                    continue

                # 过滤已存在的三元组
                for triple in inferred:
                    if Triple(*triple) not in self.kg.triples:
                        iter_new.add(triple)

            if not iter_new:
                break

            new_triples.update(iter_new)

            # 添加到知识图谱
            for h, r, t in iter_new:
                self.kg.add_triple(h, r, t)

        return new_triples

    def _apply_path_rule(self, rule: dict) -> Set[Tuple[str, str, str]]:
        """应用路径规则"""
        r1, _ = rule['body'][0]
        r2, _ = rule['body'][1]
        r3 = rule['head']

        inferred = set()

        for triple1 in self.kg.get_triples_by_relation(r1):
            h, m = triple1.head, triple1.tail

            for triple2 in self.kg.get_triples_by_head(m):
                if triple2.relation == r2:
                    t = triple2.tail
                    inferred.add((h, r3, t))

        return inferred

    def _apply_inverse_rule(self, rule: dict) -> Set[Tuple[str, str, str]]:
        """应用逆关系规则"""
        r1, _ = rule['body'][0]
        r2 = rule['head']

        inferred = set()

        for triple in self.kg.get_triples_by_relation(r1):
            h, t = triple.head, triple.tail
            inferred.add((t, r2, h))

        return inferred
```

### 基于嵌入的补全

```python
class EmbeddingBasedCompletion:
    """基于嵌入的知识图谱补全"""

    def __init__(self, model: nn.Module, entity_to_id: Dict[str, int],
                 relation_to_id: Dict[str, int], id_to_entity: Dict[int, str]):
        self.model = model
        self.entity_to_id = entity_to_id
        self.relation_to_id = relation_to_id
        self.id_to_entity = id_to_entity
        self.num_entities = len(entity_to_id)

    @torch.no_grad()
    def predict_tail(self, head: str, relation: str, top_k: int = 10) -> List[Tuple[str, float]]:
        """预测尾实体"""
        self.model.eval()

        head_id = self.entity_to_id[head]
        relation_id = self.relation_to_id[relation]

        # 计算所有候选实体的得分
        heads = torch.full((self.num_entities,), head_id)
        relations = torch.full((self.num_entities,), relation_id)
        tails = torch.arange(self.num_entities)

        scores = self.model(heads, relations, tails)

        # 获取top-k
        top_scores, top_indices = torch.topk(scores, top_k)

        results = []
        for score, idx in zip(top_scores.tolist(), top_indices.tolist()):
            entity = self.id_to_entity[idx]
            results.append((entity, score))

        return results

    @torch.no_grad()
    def predict_head(self, relation: str, tail: str, top_k: int = 10) -> List[Tuple[str, float]]:
        """预测头实体"""
        self.model.eval()

        relation_id = self.relation_to_id[relation]
        tail_id = self.entity_to_id[tail]

        heads = torch.arange(self.num_entities)
        relations = torch.full((self.num_entities,), relation_id)
        tails = torch.full((self.num_entities,), tail_id)

        scores = self.model(heads, relations, tails)
        top_scores, top_indices = torch.topk(scores, top_k)

        results = []
        for score, idx in zip(top_scores.tolist(), top_indices.tolist()):
            entity = self.id_to_entity[idx]
            results.append((entity, score))

        return results

    @torch.no_grad()
    def predict_relation(self, head: str, tail: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """预测关系"""
        self.model.eval()

        head_id = self.entity_to_id[head]
        tail_id = self.entity_to_id[tail]
        num_relations = len(self.relation_to_id)

        id_to_relation = {v: k for k, v in self.relation_to_id.items()}

        heads = torch.full((num_relations,), head_id)
        relations = torch.arange(num_relations)
        tails = torch.full((num_relations,), tail_id)

        scores = self.model(heads, relations, tails)
        top_scores, top_indices = torch.topk(scores, min(top_k, num_relations))

        results = []
        for score, idx in zip(top_scores.tolist(), top_indices.tolist()):
            relation = id_to_relation[idx]
            results.append((relation, score))

        return results

    def batch_completion(self, incomplete_triples: List[Tuple[str, str, str]],
                        top_k: int = 5) -> List[List[Tuple[str, float]]]:
        """批量补全"""
        results = []

        for h, r, t in incomplete_triples:
            if h == '?':
                predictions = self.predict_head(r, t, top_k)
            elif t == '?':
                predictions = self.predict_tail(h, r, top_k)
            elif r == '?':
                predictions = self.predict_relation(h, t, top_k)
            else:
                predictions = []

            results.append(predictions)

        return results
```

---

## 知识图谱问答

### KBQA系统架构

```
用户问题: "爱因斯坦出生在哪里？"
            |
            v
    +----------------+
    |   问题理解      |  (意图识别、实体识别)
    +----------------+
            |
            v
    +----------------+
    |   查询生成      |  (SPARQL/Cypher)
    +----------------+
            |
            v
    +----------------+
    |   知识检索      |  (图数据库查询)
    +----------------+
            |
            v
    +----------------+
    |   答案生成      |  (自然语言生成)
    +----------------+
            |
            v
    答案: "德国"
```

### 简单KBQA实现

```python
import re
from typing import List, Optional, Tuple

class SimpleKBQA:
    """简单的知识图谱问答系统"""

    def __init__(self, kg: KnowledgeGraph):
        self.kg = kg

        # 问题模板到查询模式的映射
        self.question_patterns = [
            # (问题模式, 查询类型, 关系提取模式)
            (r'(.+)的(.+)是什么', 'tail', r'(.+)的(.+)'),
            (r'(.+)是(.+)的什么', 'relation', None),
            (r'什么是(.+)的(.+)', 'head', None),
            (r'(.+)在哪里', 'tail', r'(.+)的(出生地|所在地|位置)'),
            (r'谁是(.+)的(.+)', 'head', None),
            (r'(.+)是谁发明的', 'head', r'(.+)的(发明者|创造者)'),
        ]

        # 关系同义词映射
        self.relation_synonyms = {
            '出生地': ['出生于', '出生在', '诞生地'],
            '首都': ['首都_属于', '是...的首都'],
            '发明者': ['发明人', '创造者', '创始人'],
            '位于': ['在', '位置', '所在'],
        }

    def answer(self, question: str) -> Optional[str]:
        """回答问题"""
        # 1. 问题解析
        parsed = self._parse_question(question)
        if parsed is None:
            return self._fallback_answer(question)

        query_type, entity, relation = parsed

        # 2. 关系规范化
        normalized_relation = self._normalize_relation(relation)

        # 3. 执行查询
        if query_type == 'tail':
            results = self._query_tail(entity, normalized_relation)
        elif query_type == 'head':
            results = self._query_head(normalized_relation, entity)
        else:
            results = self._query_relation(entity, None)

        # 4. 生成答案
        if results:
            return self._generate_answer(question, results)
        else:
            return "抱歉，我无法找到相关信息。"

    def _parse_question(self, question: str) -> Optional[Tuple[str, str, str]]:
        """解析问题"""
        for pattern, query_type, extract_pattern in self.question_patterns:
            match = re.match(pattern, question)
            if match:
                groups = match.groups()
                if len(groups) >= 2:
                    return query_type, groups[0], groups[1] if len(groups) > 1 else None
                elif len(groups) == 1:
                    return query_type, groups[0], None
        return None

    def _normalize_relation(self, relation: str) -> List[str]:
        """关系规范化"""
        candidates = [relation]

        for canonical, synonyms in self.relation_synonyms.items():
            if relation in synonyms or relation == canonical:
                candidates.extend([canonical] + synonyms)

        return list(set(candidates))

    def _query_tail(self, head: str, relations: List[str]) -> List[str]:
        """查询尾实体"""
        results = []
        for relation in relations:
            for triple in self.kg.get_triples_by_head(head):
                if triple.relation == relation:
                    results.append(triple.tail)
        return results

    def _query_head(self, relations: List[str], tail: str) -> List[str]:
        """查询头实体"""
        results = []
        for relation in relations:
            for triple in self.kg.get_triples_by_tail(tail):
                if triple.relation == relation:
                    results.append(triple.head)
        return results

    def _query_relation(self, head: str, tail: str) -> List[str]:
        """查询关系"""
        results = []
        for triple in self.kg.get_triples_by_head(head):
            if tail is None or triple.tail == tail:
                results.append(triple.relation)
        return results

    def _generate_answer(self, question: str, results: List[str]) -> str:
        """生成自然语言答案"""
        if len(results) == 1:
            return results[0]
        elif len(results) > 1:
            return "、".join(results)
        else:
            return "未找到答案"

    def _fallback_answer(self, question: str) -> str:
        """使用嵌入模型进行模糊查询（后备方案）"""
        return "抱歉，我无法理解您的问题。请尝试换一种问法。"
```

---

## 实践应用

### 推荐系统中的知识图谱

```python
import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict, Tuple

class KGEnhancedRecommender(nn.Module):
    """知识图谱增强的推荐系统"""

    def __init__(self, num_users: int, num_items: int, num_entities: int,
                 num_relations: int, embedding_dim: int = 64):
        super().__init__()

        # 用户嵌入
        self.user_embedding = nn.Embedding(num_users, embedding_dim)

        # 项目嵌入（与知识图谱实体共享部分）
        self.item_embedding = nn.Embedding(num_items, embedding_dim)

        # 知识图谱嵌入
        self.entity_embedding = nn.Embedding(num_entities, embedding_dim)
        self.relation_embedding = nn.Embedding(num_relations, embedding_dim)

        # 注意力机制用于聚合邻居信息
        self.attention = nn.Sequential(
            nn.Linear(embedding_dim * 2, embedding_dim),
            nn.Tanh(),
            nn.Linear(embedding_dim, 1),
            nn.Softmax(dim=1)
        )

        # 预测层
        self.predictor = nn.Sequential(
            nn.Linear(embedding_dim * 2, embedding_dim),
            nn.ReLU(),
            nn.Linear(embedding_dim, 1),
            nn.Sigmoid()
        )

        self._init_weights()

    def _init_weights(self):
        for module in self.modules():
            if isinstance(module, nn.Embedding):
                nn.init.xavier_uniform_(module.weight)
            elif isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                if module.bias is not None:
                    nn.init.zeros_(module.bias)

    def aggregate_neighbors(self, item_idx: torch.Tensor,
                           neighbor_entities: torch.Tensor,
                           neighbor_relations: torch.Tensor) -> torch.Tensor:
        """聚合知识图谱邻居信息"""
        batch_size = item_idx.size(0)

        # 获取嵌入
        item_emb = self.item_embedding(item_idx)  # [batch, dim]
        entity_emb = self.entity_embedding(neighbor_entities)  # [batch, neighbors, dim]
        relation_emb = self.relation_embedding(neighbor_relations)  # [batch, neighbors, dim]

        # 计算注意力权重
        item_expanded = item_emb.unsqueeze(1).expand_as(entity_emb)
        concat = torch.cat([item_expanded, entity_emb], dim=-1)  # [batch, neighbors, dim*2]
        attention_weights = self.attention(concat)  # [batch, neighbors, 1]

        # 加权聚合
        # 考虑关系的影响
        neighbor_features = entity_emb * relation_emb
        aggregated = (attention_weights * neighbor_features).sum(dim=1)  # [batch, dim]

        return aggregated

    def forward(self, user_idx: torch.Tensor, item_idx: torch.Tensor,
                neighbor_entities: torch.Tensor,
                neighbor_relations: torch.Tensor) -> torch.Tensor:
        """
        Args:
            user_idx: 用户索引 [batch_size]
            item_idx: 项目索引 [batch_size]
            neighbor_entities: 项目的知识图谱邻居实体 [batch_size, num_neighbors]
            neighbor_relations: 对应的关系 [batch_size, num_neighbors]
        """
        # 用户表示
        user_emb = self.user_embedding(user_idx)  # [batch, dim]

        # 项目表示（融合知识图谱信息）
        item_emb = self.item_embedding(item_idx)  # [batch, dim]
        kg_info = self.aggregate_neighbors(item_idx, neighbor_entities, neighbor_relations)
        item_repr = item_emb + kg_info  # 残差连接

        # 预测
        concat = torch.cat([user_emb, item_repr], dim=-1)
        score = self.predictor(concat)

        return score.squeeze(-1)
```

### 医疗知识图谱应用

```python
class MedicalKG:
    """医疗知识图谱应用"""

    def __init__(self):
        self.kg = KnowledgeGraph()
        self._load_medical_knowledge()

    def _load_medical_knowledge(self):
        """加载医疗知识"""
        # 疾病-症状关系
        self.kg.add_triple("感冒", "症状", "发热")
        self.kg.add_triple("感冒", "症状", "咳嗽")
        self.kg.add_triple("感冒", "症状", "流鼻涕")
        self.kg.add_triple("流感", "症状", "发热")
        self.kg.add_triple("流感", "症状", "全身酸痛")
        self.kg.add_triple("肺炎", "症状", "发热")
        self.kg.add_triple("肺炎", "症状", "咳嗽")
        self.kg.add_triple("肺炎", "症状", "呼吸困难")

        # 疾病-药物关系
        self.kg.add_triple("感冒", "治疗药物", "感冒灵")
        self.kg.add_triple("感冒", "治疗药物", "板蓝根")
        self.kg.add_triple("流感", "治疗药物", "奥司他韦")
        self.kg.add_triple("肺炎", "治疗药物", "阿莫西林")

        # 药物-禁忌关系
        self.kg.add_triple("阿莫西林", "禁忌人群", "青霉素过敏者")
        self.kg.add_triple("奥司他韦", "禁忌人群", "肾功能不全者")

    def diagnose(self, symptoms: List[str]) -> List[Tuple[str, float]]:
        """根据症状进行疾病诊断"""
        disease_scores = {}

        for symptom in symptoms:
            # 查找具有该症状的疾病
            for triple in self.kg.get_triples_by_tail(symptom):
                if triple.relation == "症状":
                    disease = triple.head
                    disease_scores[disease] = disease_scores.get(disease, 0) + 1

        # 计算匹配度
        results = []
        for disease, count in disease_scores.items():
            # 获取疾病的所有症状
            all_symptoms = [t.tail for t in self.kg.get_triples_by_head(disease)
                          if t.relation == "症状"]
            match_rate = count / len(all_symptoms) if all_symptoms else 0
            results.append((disease, match_rate))

        results.sort(key=lambda x: x[1], reverse=True)
        return results

    def recommend_treatment(self, disease: str,
                           patient_conditions: List[str] = None) -> List[str]:
        """推荐治疗方案"""
        patient_conditions = patient_conditions or []

        # 获取可用药物
        medications = []
        for triple in self.kg.get_triples_by_head(disease):
            if triple.relation == "治疗药物":
                medication = triple.tail

                # 检查禁忌
                is_safe = True
                for contraindication in self.kg.get_triples_by_head(medication):
                    if contraindication.relation == "禁忌人群":
                        if contraindication.tail in patient_conditions:
                            is_safe = False
                            break

                if is_safe:
                    medications.append(medication)

        return medications

# 使用示例
medical_kg = MedicalKG()

# 症状诊断
symptoms = ["发热", "咳嗽"]
diagnosis = medical_kg.diagnose(symptoms)
print("可能的疾病:")
for disease, score in diagnosis:
    print(f"  {disease}: {score:.2%}")

# 治疗推荐
disease = "感冒"
treatments = medical_kg.recommend_treatment(disease)
print(f"\n{disease}的推荐治疗: {treatments}")
```

---

## 面试要点

### 基础概念题

**Q1: 什么是知识图谱？它与传统数据库有什么区别？**

A: 知识图谱是以图结构组织知识的语义网络，节点代表实体，边代表关系。与传统关系数据库的区别：
- **数据模型**：知识图谱使用图模型，关系数据库使用表格模型
- **关系表达**：知识图谱直接表达实体间关系，关系数据库需要通过外键关联
- **查询能力**：知识图谱擅长多跳查询和推理，关系数据库擅长结构化查询
- **扩展性**：知识图谱更容易扩展新的实体和关系类型

**Q2: 解释TransE模型的基本原理？**

A: TransE将关系建模为实体间的平移操作：
- 对于正确的三元组 $(h, r, t)$，期望 $\mathbf{h} + \mathbf{r} \approx \mathbf{t}$
- 评分函数：$f_r(h,t) = -||\mathbf{h} + \mathbf{r} - \mathbf{t}||$
- 训练目标：最小化正确三元组的距离，最大化错误三元组的距离
- 局限性：无法有效处理一对多、多对一和多对多关系

**Q3: TransE、TransR、ComplEx和RotatE各有什么特点？**

A:
- **TransE**：简单高效，将关系建模为平移，但不能处理复杂关系模式
- **TransR**：引入关系特定的投影空间，参数量大但能处理更复杂的关系
- **ComplEx**：使用复数嵌入，能够建模对称/反对称关系
- **RotatE**：将关系建模为复平面上的旋转，能够同时建模对称、反对称、逆和组合关系

### 进阶题目

**Q4: 如何测试知识图谱嵌入模型的性能？**

A: 主要通过链接预测任务进行测试：
```python
# 测试指标
metrics = {
    'MR': '平均排名，越小越好',
    'MRR': '平均倒数排名，越大越好',
    'Hits@K': '排名在前K的比例，越大越好'
}

# 测试设定
settings = {
    'Raw': '计算原始排名',
    'Filtered': '过滤训练集中已存在的三元组，更公平'
}
```

**Q5: 知识图谱补全有哪些方法？**

A:
1. **基于规则的方法**：
   - 学习关联规则（如路径规则、逆关系规则）
   - 使用规则进行推理

2. **基于嵌入的方法**：
   - 使用TransE/ComplEx等模型学习嵌入
   - 预测得分最高的实体

3. **混合方法**：
   - 结合规则和嵌入
   - 使用神经网络学习规则

**Q6: 如何将知识图谱应用于推荐系统？**

A:
```python
# 应用方式
applications = {
    '特征增强': '将KG嵌入作为物品/用户的额外特征',
    '路径推理': '通过KG中的路径解释推荐结果',
    '图神经网络': '使用GNN在KG上传播信息',
    '知识注意力': '使用注意力机制聚合KG邻居信息'
}
```

### 代码实现题

**Q7: 实现负采样函数**

```python
def negative_sampling(positive_triple: Tuple[int, int, int],
                     all_triples: Set[Tuple[int, int, int]],
                     num_entities: int,
                     num_samples: int = 10) -> List[Tuple[int, int, int]]:
    """负采样"""
    head, relation, tail = positive_triple
    negative_samples = []

    while len(negative_samples) < num_samples:
        if np.random.random() < 0.5:
            # 替换头实体
            neg_head = np.random.randint(num_entities)
            neg_triple = (neg_head, relation, tail)
        else:
            # 替换尾实体
            neg_tail = np.random.randint(num_entities)
            neg_triple = (head, relation, neg_tail)

        if neg_triple not in all_triples:
            negative_samples.append(neg_triple)

    return negative_samples
```

**Q8: 实现实体对齐（Entity Alignment）**

```python
def entity_alignment(kg1_entities: Dict[str, np.ndarray],
                    kg2_entities: Dict[str, np.ndarray],
                    seed_pairs: List[Tuple[str, str]],
                    top_k: int = 10) -> List[Tuple[str, str, float]]:
    """基于嵌入的实体对齐"""
    # 使用种子对学习映射
    if seed_pairs:
        source = np.array([kg1_entities[e1] for e1, e2 in seed_pairs])
        target = np.array([kg2_entities[e2] for e1, e2 in seed_pairs])

        # 学习正交变换 W: source @ W = target
        U, _, Vt = np.linalg.svd(source.T @ target)
        W = U @ Vt
    else:
        W = np.eye(len(next(iter(kg1_entities.values()))))

    # 对齐
    alignments = []
    for e1, emb1 in kg1_entities.items():
        transformed = emb1 @ W

        similarities = []
        for e2, emb2 in kg2_entities.items():
            sim = np.dot(transformed, emb2) / (
                np.linalg.norm(transformed) * np.linalg.norm(emb2) + 1e-9
            )
            similarities.append((e2, sim))

        similarities.sort(key=lambda x: x[1], reverse=True)
        for e2, sim in similarities[:top_k]:
            alignments.append((e1, e2, sim))

    return alignments
```

---

## 延伸阅读

### 推荐资源

1. **论文**
   - TransE: "Translating Embeddings for Modeling Multi-relational Data" (2013)
   - ComplEx: "Complex Embeddings for Simple Link Prediction" (2016)
   - RotatE: "RotatE: Knowledge Graph Embedding by Relational Rotation" (2019)
   - KGAT: "KGAT: Knowledge Graph Attention Network for Recommendation" (2019)

2. **工具库**
   - **PyKEEN**: Python知识图谱嵌入库
   - **OpenKE**: 清华开源知识嵌入工具包
   - **DGL-KE**: 基于DGL的知识图谱嵌入
   - **LibKGE**: 知识图谱嵌入基准库

3. **数据集**
   - FB15k-237: Freebase子集
   - WN18RR: WordNet子集
   - YAGO3-10: YAGO子集
   - Wikidata5M: 大规模Wikidata

### 进阶方向

1. **多模态知识图谱**
   - 图像+文本+知识
   - 跨模态实体链接

2. **时序知识图谱**
   - 时间感知的嵌入
   - 事件预测

3. **大规模知识图谱**
   - 分布式训练
   - 增量学习

4. **知识图谱与大语言模型**
   - LLM + KG融合
   - 知识增强的生成

---

## 总结

知识图谱作为人工智能的核心基础设施，在知识表示、推理和应用方面发挥着重要作用。本文系统介绍了：

1. **基础概念**：三元组表示、知识图谱构建流程
2. **嵌入技术**：TransE/TransR/ComplEx/RotatE等经典模型
3. **核心任务**：链接预测、知识图谱补全
4. **实际应用**：推荐系统、问答系统、医疗诊断

掌握知识图谱技术需要理解图论基础、机器学习原理和领域知识，建议通过动手实践加深理解。随着大语言模型的发展，知识图谱与LLM的结合将成为重要的研究方向。
