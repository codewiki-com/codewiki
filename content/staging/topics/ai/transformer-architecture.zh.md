---
title: Transformer 架构完全指南
description: 掌握驱动现代 AI 的 Transformer 架构
track: ai
section: deep-learning
difficulty: advanced
tags:
  - Transformer
  - 注意力机制
  - NLP
  - 深度学习
status: imported
origin: old/src/content/docs/ai/transformer-architecture.zh.md
divergence: 0.201
issues: []
legacy:
  category: AI
  subcategory: Deep Learning
  order: 2
  lastUpdated: 2026-01-07
---

Transformer 是现代深度学习中最具革命性的架构之一，由 Google 团队在 2017 年的论文《Attention Is All You Need》中首次提出。它从根本上改变了自然语言处理（NLP）的研究方向，并逐渐扩展到计算机视觉、语音识别和许多其他领域。本综合指南探讨了 Transformer 架构的核心概念、技术细节和实际应用。

---

## 为什么选择 Transformer？

在 Transformer 出现之前，序列到序列（Seq2Seq）任务主要依赖循环神经网络（RNN）及其变体，如 LSTM 和 GRU。这些模型有几个关键限制：

1. **顺序计算约束**：RNN 必须按时间顺序逐步处理输入，无法并行化，训练效率低下
2. **长距离依赖问题**：虽然 LSTM 通过门控机制缓解了梯度消失问题，但处理超长序列仍然具有挑战性
3. **计算复杂度**：对于长度为 n 的序列，RNN 的时间复杂度为 O(n)，无法利用现代 GPU 的并行计算能力

Transformer 通过**自注意力机制**完美解决了这些问题：

- 允许模型直接关注序列中任意位置的信息，无论距离多远
- 支持高度并行化计算，大幅提升训练速度
- 通过多头注意力捕获不同层次的语义信息

### 核心理念

Transformer 的核心思想可以概括为："注意力就是你所需要的一切。"它完全摒弃了循环和卷积结构，仅依靠注意力机制来捕获输入序列中的全局依赖关系。这种设计使模型能够：

- 并行处理整个序列
- 直接建模任意两个位置之间的关系
- 通过堆叠多层学习越来越抽象的表示

---

## 注意力机制

注意力机制最初是为序列到序列模型开发的，用于帮助解码器关注输入序列的相关部分。基本直觉是，在生成输出时，并非所有输入元素都同等重要。

### 注意力背后的直觉

想象你正在将一个句子从英语翻译成法语。在生成每个法语单词时，你不会对所有英语单词给予相同的权重。相反，你会"关注"与该特定法语单词最相关的英语单词。

### 数学公式

给定查询向量 **q**、一组键向量 **K** 和相应的值向量 **V**，注意力输出计算为值的加权和，其中权重由查询-键兼容性确定。

得分函数测量查询和每个键之间的兼容性。常见的得分函数包括：

- **点积**：score(q, k) = q^T k
- **缩放点积**：score(q, k) = (q^T k) / sqrt(d_k)
- **加性（Bahdanau）**：score(q, k) = v^T tanh(W_q q + W_k k)

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

def basic_attention(query, keys, values):
    """
    基本注意力机制实现。

    Args:
        query: (batch_size, query_dim)
        keys: (batch_size, seq_len, key_dim)
        values: (batch_size, seq_len, value_dim)

    Returns:
        context: (batch_size, value_dim)
        attention_weights: (batch_size, seq_len)
    """
    # 使用点积计算注意力得分
    # query: (batch_size, 1, query_dim) unsqueeze 之后
    scores = torch.bmm(query.unsqueeze(1), keys.transpose(1, 2))
    # scores: (batch_size, 1, seq_len)

    # 应用 softmax 获取注意力权重
    attention_weights = F.softmax(scores, dim=-1)

    # 计算值的加权和
    context = torch.bmm(attention_weights, values)
    # context: (batch_size, 1, value_dim)

    return context.squeeze(1), attention_weights.squeeze(1)
```

---

## 自注意力

自注意力（也称为内部注意力）是 Transformer 的核心组件。与传统注意力（查询来自一个序列，键/值来自另一个序列）不同，自注意力允许序列中的每个位置关注同一序列中的所有位置。

### 计算过程

给定输入序列嵌入 X（维度为 n x d，其中 n 是序列长度，d 是嵌入维度），自注意力计算过程如下：

**步骤 1：线性变换生成 Q、K、V**

```
Q = X @ W_Q
K = X @ W_K  
V = X @ W_V
```

其中：
- **Query（Q）**：表示当前位置想要查询的内容
- **Key（K）**：表示每个位置可以被查询的特征
- **Value（V）**：表示每个位置包含的实际信息

**步骤 2：计算注意力得分**

```
Attention(Q, K, V) = softmax(Q @ K^T / sqrt(d_k)) @ V
```

除以 sqrt(d_k) 可防止点积变得过大，这会将 softmax 函数推入梯度极小的区域。

### 直观理解

自注意力可以理解为一个**软字典查找**：
- Query 是你想问的问题
- Key 是字典中每个条目的索引
- Value 是每个条目的内容
- 通过计算 Query 和所有 Key 之间的相似度，我们获得权重系数
- 最终输出是所有 Value 的加权和

### 实现

```python
class SelfAttention(nn.Module):
    """自注意力机制实现。"""

    def __init__(self, embed_dim, dropout=0.1):
        super().__init__()
        self.embed_dim = embed_dim

        # 线性变换层
        self.W_q = nn.Linear(embed_dim, embed_dim)
        self.W_k = nn.Linear(embed_dim, embed_dim)
        self.W_v = nn.Linear(embed_dim, embed_dim)

        self.dropout = nn.Dropout(dropout)
        self.scale = math.sqrt(embed_dim)

    def forward(self, x, mask=None):
        """
        Args:
            x: 形状为 (batch_size, seq_len, embed_dim) 的输入张量
            mask: 可选的掩码张量
        Returns:
            注意力输出和注意力权重
        """
        # 计算 Q、K、V
        Q = self.W_q(x)  # (batch_size, seq_len, embed_dim)
        K = self.W_k(x)
        V = self.W_v(x)

        # 计算注意力得分
        # (batch_size, seq_len, seq_len)
        attn_scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale

        # 应用掩码（如果提供）
        if mask is not None:
            attn_scores = attn_scores.masked_fill(mask == 0, float('-inf'))

        # Softmax 归一化
        attn_weights = F.softmax(attn_scores, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # 加权和
        output = torch.matmul(attn_weights, V)

        return output, attn_weights
```

### 为什么要除以 sqrt(d_k)？

当维度 d_k 较大时，点积 Q * K 的幅度会变大。这会将 softmax 函数推入梯度极小的区域，使学习变得困难。通过除以 1/sqrt(d_k)，我们将点积的方差保持在大约 1，确保有效的梯度流动。

---

## 多头注意力

单个自注意力机制只能捕获一种类型的依赖关系。为了使模型能够同时关注来自不同表示子空间的信息，Transformer 引入了**多头注意力**。

### 设计原则

多头注意力将 Q、K、V 投影到 h 个不同的子空间，在每个子空间中独立计算注意力，然后连接结果：

```
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) @ W_O
```

其中每个头计算为：

```
head_i = Attention(Q @ W_i^Q, K @ W_i^K, V @ W_i^V)
```

### 优势

1. **多视角注意力**：不同的头可以关注不同类型的信息，如句法关系、语义关系、位置关系等
2. **增强表达能力**：多个子空间的组合提供更丰富的表示能力
3. **计算效率**：虽然有多个头，但每个头的维度相应减少，保持总计算量不变

### 实现

```python
class MultiHeadAttention(nn.Module):
    """多头注意力机制实现。"""

    def __init__(self, embed_dim, num_heads, dropout=0.1):
        super().__init__()
        assert embed_dim % num_heads == 0, "embed_dim 必须能被 num_heads 整除"

        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads

        # 组合的线性变换（更高效）
        self.W_qkv = nn.Linear(embed_dim, 3 * embed_dim)
        self.W_o = nn.Linear(embed_dim, embed_dim)

        self.dropout = nn.Dropout(dropout)
        self.scale = math.sqrt(self.head_dim)

    def forward(self, x, mask=None):
        """
        Args:
            x: 形状为 (batch_size, seq_len, embed_dim) 的输入张量
            mask: 可选的掩码张量
        Returns:
            多头注意力输出
        """
        batch_size, seq_len, _ = x.shape

        # 一次操作计算 Q、K、V
        qkv = self.W_qkv(x)  # (batch_size, seq_len, 3 * embed_dim)
        qkv = qkv.reshape(batch_size, seq_len, 3, self.num_heads, self.head_dim)
        qkv = qkv.permute(2, 0, 3, 1, 4)  # (3, batch_size, num_heads, seq_len, head_dim)
        Q, K, V = qkv[0], qkv[1], qkv[2]

        # 计算注意力得分
        # (batch_size, num_heads, seq_len, seq_len)
        attn_scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale

        if mask is not None:
            attn_scores = attn_scores.masked_fill(mask == 0, float('-inf'))

        attn_weights = F.softmax(attn_scores, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # 加权和并合并头
        # (batch_size, num_heads, seq_len, head_dim)
        attn_output = torch.matmul(attn_weights, V)

        # 重塑并投影
        attn_output = attn_output.transpose(1, 2).reshape(batch_size, seq_len, self.embed_dim)
        output = self.W_o(attn_output)

        return output
```

### 可视化多头注意力

每个注意力头学习关注输入的不同方面：

```
Head 1: 捕获句法依赖（主谓一致）
Head 2: 捕获语义关系（词义）
Head 3: 捕获位置模式（相邻词）
Head 4: 捕获长距离依赖（代词到先行词）
...
```

---

## 位置编码

由于 Transformer 完全基于注意力机制，它本身缺乏捕获序列顺序信息的能力。为了使模型能够利用位置信息，引入了**位置编码**。

### 正弦位置编码

原始 Transformer 使用正弦和余弦函数生成位置编码：

```
PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

其中 pos 是位置索引，i 是维度索引。

### 设计原理

这种编码方法有几个优点：
1. **唯一性**：每个位置都有唯一的编码
2. **有界性**：值在 [-1, 1] 之间，不随位置增长
3. **相对位置表示**：对于固定偏移 k，PE(pos+k) 可以表示为 PE(pos) 的线性函数
4. **泛化能力**：可以外推到训练期间未见过的序列长度

### 可学习位置编码

BERT 和其他模型使用可学习的位置嵌入，将位置编码视为可训练参数：

```python
class PositionalEncoding(nn.Module):
    """正弦位置编码。"""

    def __init__(self, embed_dim, max_len=5000, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)

        # 创建位置编码矩阵
        pe = torch.zeros(max_len, embed_dim)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, embed_dim, 2).float() * (-math.log(10000.0) / embed_dim)
        )

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_len, embed_dim)

        # 注册为 buffer（不通过梯度更新）
        self.register_buffer('pe', pe)

    def forward(self, x):
        """
        Args:
            x: 形状为 (batch_size, seq_len, embed_dim) 的输入张量
        """
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class LearnablePositionalEncoding(nn.Module):
    """可学习位置编码。"""

    def __init__(self, embed_dim, max_len=512, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)
        self.pe = nn.Embedding(max_len, embed_dim)

    def forward(self, x):
        seq_len = x.size(1)
        positions = torch.arange(seq_len, device=x.device).unsqueeze(0)
        x = x + self.pe(positions)
        return self.dropout(x)
```

### 现代位置编码

近期研究引入了几种替代方案：

1. **旋转位置嵌入（RoPE）**：用于 LLaMA，通过旋转矩阵编码位置
2. **ALiBi（带线性偏置的注意力）**：根据位置距离向注意力得分添加线性偏置
3. **相对位置编码**：编码 token 之间的相对位置而不是绝对位置

```python
class RotaryPositionalEncoding(nn.Module):
    """旋转位置嵌入（RoPE）- 简化实现。"""

    def __init__(self, dim, max_seq_len=2048, base=10000):
        super().__init__()
        inv_freq = 1.0 / (base ** (torch.arange(0, dim, 2).float() / dim))
        self.register_buffer('inv_freq', inv_freq)
        self.max_seq_len = max_seq_len

    def forward(self, x, seq_len):
        t = torch.arange(seq_len, device=x.device).type_as(self.inv_freq)
        freqs = torch.einsum('i,j->ij', t, self.inv_freq)
        emb = torch.cat((freqs, freqs), dim=-1)
        return emb.cos(), emb.sin()
```

---

## 编码器-解码器架构

完整的 Transformer 由**编码器**和**解码器**组成。

### 编码器结构

编码器由 N 个相同的堆叠层组成，每层包含两个子层：
1. **多头自注意力层**
2. **前馈网络（FFN）**

每个子层应用**残差连接**和**层归一化**：

```
output = LayerNorm(x + Sublayer(x))
```

### 解码器结构

解码器也由 N 个相同的堆叠层组成，但每层包含三个子层：
1. **掩码多头自注意力**（防止关注未来位置）
2. **编码器-解码器注意力**（交叉注意力）
3. **前馈网络**

掩码注意力确保在位置 i 生成输出时，模型只能关注位置 i 之前的位置，防止信息泄漏。

### 前馈网络

FFN 由两个线性变换组成，中间有一个非线性激活：

```
FFN(x) = GELU(x @ W_1 + b_1) @ W_2 + b_2
```

### 完整实现

```python
class TransformerEncoderLayer(nn.Module):
    """Transformer 编码器层。"""

    def __init__(self, embed_dim, num_heads, ff_dim, dropout=0.1):
        super().__init__()
        self.self_attn = MultiHeadAttention(embed_dim, num_heads, dropout)
        self.ffn = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout)
        )
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        # 自注意力 + 残差 + 层归一化
        attn_output = self.self_attn(x, mask)
        x = self.norm1(x + self.dropout(attn_output))

        # FFN + 残差 + 层归一化
        ffn_output = self.ffn(x)
        x = self.norm2(x + ffn_output)

        return x


class TransformerDecoderLayer(nn.Module):
    """Transformer 解码器层。"""

    def __init__(self, embed_dim, num_heads, ff_dim, dropout=0.1):
        super().__init__()
        self.self_attn = MultiHeadAttention(embed_dim, num_heads, dropout)
        self.cross_attn = MultiHeadAttention(embed_dim, num_heads, dropout)
        self.ffn = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout)
        )
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.norm3 = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, encoder_output, src_mask=None, tgt_mask=None):
        # 掩码自注意力
        attn_output = self.self_attn(x, tgt_mask)
        x = self.norm1(x + self.dropout(attn_output))

        # 交叉注意力（使用编码器输出作为 K、V）
        cross_output = self.cross_attn(x, src_mask)
        x = self.norm2(x + self.dropout(cross_output))

        # FFN
        ffn_output = self.ffn(x)
        x = self.norm3(x + ffn_output)

        return x


class Transformer(nn.Module):
    """完整的 Transformer 模型。"""

    def __init__(
        self,
        vocab_size,
        embed_dim=512,
        num_heads=8,
        num_encoder_layers=6,
        num_decoder_layers=6,
        ff_dim=2048,
        max_len=512,
        dropout=0.1
    ):
        super().__init__()

        # 嵌入层
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.pos_encoding = PositionalEncoding(embed_dim, max_len, dropout)

        # 编码器
        self.encoder_layers = nn.ModuleList([
            TransformerEncoderLayer(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(num_encoder_layers)
        ])

        # 解码器
        self.decoder_layers = nn.ModuleList([
            TransformerDecoderLayer(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(num_decoder_layers)
        ])

        # 输出层
        self.fc_out = nn.Linear(embed_dim, vocab_size)

        self.embed_dim = embed_dim
        self._init_parameters()

    def _init_parameters(self):
        """使用 Xavier 均匀分布初始化参数。"""
        for p in self.parameters():
            if p.dim() > 1:
                nn.init.xavier_uniform_(p)

    def encode(self, src, src_mask=None):
        x = self.embedding(src) * math.sqrt(self.embed_dim)
        x = self.pos_encoding(x)

        for layer in self.encoder_layers:
            x = layer(x, src_mask)

        return x

    def decode(self, tgt, encoder_output, src_mask=None, tgt_mask=None):
        x = self.embedding(tgt) * math.sqrt(self.embed_dim)
        x = self.pos_encoding(x)

        for layer in self.decoder_layers:
            x = layer(x, encoder_output, src_mask, tgt_mask)

        return x

    def forward(self, src, tgt, src_mask=None, tgt_mask=None):
        encoder_output = self.encode(src, src_mask)
        decoder_output = self.decode(tgt, encoder_output, src_mask, tgt_mask)
        output = self.fc_out(decoder_output)
        return output
```

### Pre-LN vs Post-LN

原始 Transformer 使用 **Post-LN**（先残差后归一化）：
```
output = LayerNorm(x + Sublayer(x))
```

后来的研究发现 **Pre-LN**（先归一化后残差）更稳定：
```
output = x + Sublayer(LayerNorm(x))
```

Pre-LN 优势：
- 训练更稳定，不易梯度爆炸
- 可以使用更大的学习率
- 不需要预热策略

---

## BERT vs GPT

BERT 和 GPT 是基于 Transformer 架构的两个代表性模型，采用了不同的设计理念。

### 架构比较

| 特性 | BERT | GPT |
|---------|------|-----|
| 使用组件 | 仅编码器 | 仅解码器 |
| 注意力方向 | 双向 | 单向（因果） |
| 训练目标 | MLM + NSP | 自回归 LM |
| 位置编码 | 可学习 | 可学习 |
| 典型应用 | 理解任务 | 生成任务 |

### BERT 的设计

BERT（来自 Transformer 的双向编码器表示）通过两个预训练任务使用双向注意力：

1. **掩码语言模型（MLM）**：随机掩盖输入中 15% 的 token，训练模型预测被掩盖的词
2. **下一句预测（NSP）**：判断两个句子是否连续

```python
class BERTModel(nn.Module):
    """简化的 BERT 模型实现。"""

    def __init__(self, vocab_size, embed_dim=768, num_heads=12,
                 num_layers=12, ff_dim=3072, max_len=512, dropout=0.1):
        super().__init__()

        # Token、Segment 和 Position 嵌入
        self.token_embedding = nn.Embedding(vocab_size, embed_dim)
        self.segment_embedding = nn.Embedding(2, embed_dim)
        self.position_embedding = nn.Embedding(max_len, embed_dim)

        self.norm = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

        # Transformer 编码器层
        self.layers = nn.ModuleList([
            TransformerEncoderLayer(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(num_layers)
        ])

    def forward(self, input_ids, segment_ids, attention_mask=None):
        seq_len = input_ids.size(1)
        positions = torch.arange(seq_len, device=input_ids.device).unsqueeze(0)

        # 组合三种嵌入
        x = (self.token_embedding(input_ids) +
             self.segment_embedding(segment_ids) +
             self.position_embedding(positions))
        x = self.dropout(self.norm(x))

        for layer in self.layers:
            x = layer(x, attention_mask)

        return x
```

### GPT 的设计

GPT（生成式预训练 Transformer）使用单向注意力（因果掩码）自回归生成文本：

```python
class GPTModel(nn.Module):
    """简化的 GPT 模型实现。"""

    def __init__(self, vocab_size, embed_dim=768, num_heads=12,
                 num_layers=12, ff_dim=3072, max_len=1024, dropout=0.1):
        super().__init__()

        self.token_embedding = nn.Embedding(vocab_size, embed_dim)
        self.position_embedding = nn.Embedding(max_len, embed_dim)

        self.dropout = nn.Dropout(dropout)

        self.layers = nn.ModuleList([
            TransformerEncoderLayer(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(num_layers)
        ])

        self.norm = nn.LayerNorm(embed_dim)
        self.lm_head = nn.Linear(embed_dim, vocab_size, bias=False)

        # 权重绑定
        self.lm_head.weight = self.token_embedding.weight

    def forward(self, input_ids):
        seq_len = input_ids.size(1)
        positions = torch.arange(seq_len, device=input_ids.device).unsqueeze(0)

        x = self.token_embedding(input_ids) + self.position_embedding(positions)
        x = self.dropout(x)

        # 创建因果掩码
        causal_mask = torch.triu(
            torch.ones(seq_len, seq_len, device=input_ids.device),
            diagonal=1
        ).bool()
        causal_mask = ~causal_mask  # 反转：True 表示可以关注

        for layer in self.layers:
            x = layer(x, causal_mask)

        x = self.norm(x)
        logits = self.lm_head(x)

        return logits
```

### 语言模型的演变

| 模型 | 年份 | 参数量 | 关键创新 |
|-------|------|------------|----------------|
| BERT-base | 2018 | 110M | 双向预训练 |
| GPT-2 | 2019 | 1.5B | 规模 + 零样本 |
| GPT-3 | 2020 | 175B | 少样本学习 |
| GPT-4 | 2023 | ~1.7T（估计） | 多模态 + RLHF |
| LLaMA | 2023 | 7B-70B | 高效训练 |

---

## 视觉 Transformer (ViT)

视觉 Transformer 成功地将 Transformer 架构应用于计算机视觉任务，展示了该架构的通用性。

### 核心思想

ViT 将图像划分为固定大小的图块，将每个图块线性投影为嵌入，然后像处理文本序列一样处理这些图块嵌入。

### 实现步骤

1. **图像分块**：将 H x W 的图像划分为 N 个大小为 P x P 的图块
2. **图块嵌入**：展平每个图块并线性投影到 D 维空间
3. **添加位置编码**：添加可学习的位置嵌入
4. **添加 CLS Token**：在序列前添加一个分类 token
5. **Transformer 编码**：通过多个 Transformer 编码器层处理
6. **分类输出**：使用 CLS token 输出进行分类

```python
class PatchEmbedding(nn.Module):
    """图像图块嵌入。"""

    def __init__(self, img_size=224, patch_size=16, in_channels=3, embed_dim=768):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.num_patches = (img_size // patch_size) ** 2

        # 使用卷积实现图块嵌入
        self.proj = nn.Conv2d(
            in_channels, embed_dim,
            kernel_size=patch_size, stride=patch_size
        )

    def forward(self, x):
        # x: (batch_size, channels, height, width)
        x = self.proj(x)  # (batch_size, embed_dim, h', w')
        x = x.flatten(2).transpose(1, 2)  # (batch_size, num_patches, embed_dim)
        return x


class VisionTransformer(nn.Module):
    """视觉 Transformer (ViT) 模型。"""

    def __init__(
        self,
        img_size=224,
        patch_size=16,
        in_channels=3,
        num_classes=1000,
        embed_dim=768,
        num_heads=12,
        num_layers=12,
        ff_dim=3072,
        dropout=0.1
    ):
        super().__init__()

        # 图块嵌入
        self.patch_embed = PatchEmbedding(
            img_size, patch_size, in_channels, embed_dim
        )
        num_patches = self.patch_embed.num_patches

        # CLS token 和位置嵌入
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        self.dropout = nn.Dropout(dropout)

        # Transformer 编码器
        self.layers = nn.ModuleList([
            TransformerEncoderLayer(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(num_layers)
        ])

        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, num_classes)

        # 初始化
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

    def forward(self, x):
        batch_size = x.shape[0]

        # 图块嵌入
        x = self.patch_embed(x)

        # 添加 CLS token
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)
        x = torch.cat([cls_tokens, x], dim=1)

        # 添加位置编码
        x = x + self.pos_embed
        x = self.dropout(x)

        # Transformer 编码
        for layer in self.layers:
            x = layer(x)

        x = self.norm(x)

        # 使用 CLS token 进行分类
        cls_output = x[:, 0]
        logits = self.head(cls_output)

        return logits
```

### ViT 变体和扩展

| 模型 | 创新 | 关键特性 |
|-------|------------|-------------|
| DeiT | 数据高效训练 | 知识蒸馏 |
| Swin Transformer | 层次化窗口 | 移位窗口注意力 |
| BEiT | 掩码图像建模 | BERT 风格预训练 |
| CLIP | 对比学习 | 文本-图像对齐 |
| DINO | 自监督 | 无需标签 |

---

## 实现细节

### 掩码类型

理解不同的掩码类型对于正确实现 Transformer 至关重要：

```python
def create_causal_mask(seq_len, device='cpu'):
    """
    为自回归生成创建因果掩码。
    防止关注未来位置。
    """
    mask = torch.triu(torch.ones(seq_len, seq_len, device=device), diagonal=1)
    return mask == 0  # True 表示可以关注


def create_padding_mask(seq, pad_idx=0):
    """
    创建填充掩码以忽略填充 token。
    """
    return (seq != pad_idx).unsqueeze(1).unsqueeze(2)


def create_masks(src, tgt, pad_idx=0):
    """为 Transformer 创建所有必要的掩码。"""

    # 源填充掩码：(batch_size, 1, 1, src_len)
    src_mask = (src != pad_idx).unsqueeze(1).unsqueeze(2)

    # 目标填充掩码：(batch_size, 1, 1, tgt_len)
    tgt_padding_mask = (tgt != pad_idx).unsqueeze(1).unsqueeze(2)

    # 因果掩码：(1, 1, tgt_len, tgt_len)
    tgt_len = tgt.size(1)
    causal_mask = torch.tril(torch.ones(tgt_len, tgt_len)).unsqueeze(0).unsqueeze(0)

    # 组合目标掩码
    tgt_mask = tgt_padding_mask & causal_mask.bool()

    return src_mask, tgt_mask
```

### 标签平滑

标签平滑是一种正则化技术，防止模型变得过于自信：

```python
class LabelSmoothingLoss(nn.Module):
    """标签平滑交叉熵损失。"""

    def __init__(self, num_classes, smoothing=0.1):
        super().__init__()
        self.num_classes = num_classes
        self.smoothing = smoothing
        self.confidence = 1.0 - smoothing

    def forward(self, pred, target):
        pred = pred.log_softmax(dim=-1)

        with torch.no_grad():
            true_dist = torch.zeros_like(pred)
            true_dist.fill_(self.smoothing / (self.num_classes - 1))
            true_dist.scatter_(1, target.unsqueeze(1), self.confidence)

        return torch.mean(torch.sum(-true_dist * pred, dim=-1))
```

### 学习率调度

原始 Transformer 使用带预热的特殊学习率调度：

```python
class TransformerLRScheduler:
    """
    原始论文中描述的学习率调度器。
    lr = d_model^(-0.5) * min(step^(-0.5), step * warmup_steps^(-1.5))
    """

    def __init__(self, optimizer, d_model, warmup_steps=4000):
        self.optimizer = optimizer
        self.d_model = d_model
        self.warmup_steps = warmup_steps
        self.step_num = 0

    def step(self):
        self.step_num += 1
        lr = self.get_lr()
        for param_group in self.optimizer.param_groups:
            param_group['lr'] = lr

    def get_lr(self):
        return self.d_model ** (-0.5) * min(
            self.step_num ** (-0.5),
            self.step_num * self.warmup_steps ** (-1.5)
        )
```

### 高效注意力实现

现代实现使用优化的注意力计算：

```python
# 使用 PyTorch 的 scaled_dot_product_attention（兼容 Flash Attention）
def efficient_attention(Q, K, V, mask=None):
    """
    使用 PyTorch 2.0+ scaled_dot_product_attention 的高效注意力。
    在可用时自动使用 Flash Attention。
    """
    return F.scaled_dot_product_attention(
        Q, K, V,
        attn_mask=mask,
        dropout_p=0.0,
        is_causal=False
    )
```

---

## 面试重点

### 基础概念问题

**问题1：为什么 Transformer 要除以 sqrt(d_k)？**

答：当 d_k 较大时，点积 Q 和 K 的幅度会变大。这会将 softmax 函数推入梯度极小的区域（梯度饱和）。除以 sqrt(d_k) 将点积的方差保持在大约 1，确保有效的梯度传播。

**问题2：多头注意力的目的是什么？**

答：多头注意力允许模型同时关注来自不同表示子空间的信息，提高模型的表达能力。不同的头可能学习不同类型的信息：句法依赖、语义关系、位置关系等。

**问题3：为什么 Transformer 需要位置编码？**

答：Transformer 的自注意力机制是排列不变的——打乱输入顺序不影响输出。位置编码为模型提供序列顺序信息，使其能够区分不同位置的 token。

### 进阶问题

**问题4：BERT 和 GPT 的主要区别是什么？**

答：
- BERT 使用双向注意力（看到完整上下文），GPT 使用单向注意力（只看到左侧上下文）
- BERT 使用 MLM 预训练（填空），GPT 使用自回归预训练（预测下一个 token）
- BERT 更适合理解任务，GPT 更适合生成任务

**问题5：层归一化和批归一化的区别？**

答：
- BN 跨批维度归一化，LN 跨特征维度归一化
- LN 不依赖批大小，更适合序列模型
- LN 在训练和推理时行为一致

**问题6：如何降低 Transformer 的计算复杂度？**

答：
- 稀疏注意力（如 Longformer、BigBird）
- 线性注意力（如 Performer、Linear Transformer）
- 局部注意力 + 全局 token
- 低秩分解
- Flash Attention 等高效实现
- 混合专家（MoE）

### 系统设计问题

**问题7：如何设计一个大规模 Transformer 训练系统？**

答：
- **数据并行**：将数据分布到多个 GPU
- **模型并行**：将模型拆分到多个 GPU（张量并行、流水线并行）
- **混合精度训练**：使用 FP16/BF16 减少内存
- **梯度检查点**：用计算换内存
- **ZeRO 优化**：分区优化器状态
- **Flash Attention**：内存高效的注意力计算

**问题8：如何处理超长序列？**

答：
- 滑动窗口注意力
- 层次化注意力
- 记忆/检索增强
- 稀疏注意力模式
- 状态空间模型（Mamba、RWKV）

### 代码实现问题

**问题9：实现因果掩码和填充掩码**

```python
def create_all_masks(src, tgt, pad_idx=0):
    """为 Transformer 创建所有必要的掩码。"""

    # 源填充掩码
    src_mask = (src != pad_idx).unsqueeze(1).unsqueeze(2)

    # 目标填充掩码
    tgt_padding_mask = (tgt != pad_idx).unsqueeze(1).unsqueeze(2)

    # 因果掩码
    tgt_len = tgt.size(1)
    causal_mask = torch.tril(torch.ones(tgt_len, tgt_len)).unsqueeze(0).unsqueeze(0)

    # 组合目标掩码
    tgt_mask = tgt_padding_mask & causal_mask.bool()

    return src_mask, tgt_mask
```

**问题10：实现一个简单的文本生成函数**

```python
def generate(model, prompt_ids, max_len=50, temperature=1.0, top_k=50):
    """
    使用 GPT 风格模型生成文本。

    Args:
        model: 训练好的 GPT 模型
        prompt_ids: 起始 token ID (batch_size, seq_len)
        max_len: 最大生成长度
        temperature: 采样温度
        top_k: Top-k 采样参数
    """
    model.eval()
    generated = prompt_ids.clone()
    EOS_TOKEN_ID = 2  # 示例 EOS token

    with torch.no_grad():
        for _ in range(max_len):
            # 获取最后位置的 logits
            logits = model(generated)[:, -1, :]

            # 应用温度
            logits = logits / temperature

            # Top-k 过滤
            if top_k > 0:
                indices_to_remove = logits < torch.topk(logits, top_k)[0][..., -1, None]
                logits[indices_to_remove] = float('-inf')

            # 从分布中采样
            probs = F.softmax(logits, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1)

            # 追加到序列
            generated = torch.cat([generated, next_token], dim=1)

            # 如果遇到 EOS token 则停止
            if next_token.item() == EOS_TOKEN_ID:
                break

    return generated
```

---

## 延伸阅读

### 基础论文

1. **《Attention Is All You Need》**（2017）- 原始 Transformer 论文
   - Vaswani 等人，Google Brain
   - 引入了自注意力和 Transformer 架构

2. **《BERT: Pre-training of Deep Bidirectional Transformers》**（2018）
   - Devlin 等人，Google AI Language
   - 双向预训练革命化了 NLP

3. **《Language Models are Unsupervised Multitask Learners》**（2019）- GPT-2
   - Radford 等人，OpenAI
   - 通过规模展示了涌现能力

4. **《An Image is Worth 16x16 Words》**（2020）- ViT
   - Dosovitskiy 等人，Google Brain
   - 将 Transformer 扩展到计算机视觉

5. **《FlashAttention: Fast and Memory-Efficient Exact Attention》**（2022）
   - Dao 等人，Stanford
   - 硬件感知的高效注意力实现

### 推荐资源

- **The Illustrated Transformer** by Jay Alammar - 最佳可视化教程
- **Hugging Face Transformers 库** - 工业级实现
- **Harvard NLP: The Annotated Transformer** - 带注释的 PyTorch 实现
- **Stanford CS224N** - 自然语言处理课程
- **Andrej Karpathy 的 "Let's build GPT"** - 从零开始实现

### 高级主题

1. **高效 Transformer**
   - Linformer、Performer、Longformer
   - FlashAttention、PagedAttention
   - 混合专家（MoE）

2. **多模态 Transformer**
   - CLIP、DALL-E、Flamingo
   - LLaVA、GPT-4V
   - 音频：Whisper、AudioLM

3. **大规模预训练**
   - 模型并行、数据并行、流水线并行
   - 混合精度训练、梯度检查点
   - RLHF 和对齐技术

4. **Transformer 理论**
   - 注意力机制的表达能力分析
   - 位置编码的理论基础
   - 缩放定律（Chinchilla、GPT-4）

### 开源实现

- **Hugging Face Transformers**：综合模型中心
- **PyTorch**：原生 Transformer 模块
- **JAX/Flax**：高性能实现
- **llama.cpp**：高效 CPU 推理
- **vLLM**：高吞吐量服务

---

## 总结

Transformer 架构通过自注意力机制实现了高效的序列数据并行处理，成为现代深度学习的基础架构。理解其核心组件（自注意力、多头注意力、位置编码、层归一化）及其设计原则，对于深入理解当前主流的大语言模型和视觉模型至关重要。

关键要点：

1. **自注意力**能够直接建模序列中任意位置之间的关系
2. **多头注意力**同时捕获不同类型的依赖关系
3. **位置编码**提供必要的序列顺序信息
4. **残差连接和层归一化**使深层网络的训练成为可能
5. **编码器-解码器结构**是灵活的——BERT 使用仅编码器，GPT 使用仅解码器

随着研究的持续推进，Transformer 在效率优化、多模态融合和长序列处理方面不断发展。它们将继续是深度学习中最重要的架构之一，推动下一代 AI 系统的发展。
