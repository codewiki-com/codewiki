---
title: 自然语言处理(NLP)指南
description: 掌握NLP核心技术，从传统方法到大语言模型
track: ai
section: llm-basics
difficulty: advanced
tags:
  - NLP
  - 自然语言处理
  - 文本处理
  - BERT
status: imported
origin: old/src/content/docs/ai/nlp.zh.md
divergence: 0.248
issues: []
legacy:
  category: AI
  subcategory: NLP
  order: 6
  lastUpdated: 2026-01-07
---

自然语言处理（Natural Language Processing，NLP）是人工智能领域最重要的分支之一，它致力于让计算机理解、解释和生成人类语言。从搜索引擎、智能助手到机器翻译，NLP 技术已经深入我们生活的方方面面。本文将系统地介绍 NLP 的核心技术，从传统方法到现代深度学习模型，帮助你全面掌握这一领域的关键知识。

## NLP 任务概述

### 什么是自然语言处理？

自然语言处理是计算机科学、人工智能和语言学的交叉领域，其目标是使计算机能够处理和分析大量自然语言数据。NLP 技术需要解决人类语言的几个核心挑战：

1. **歧义性**：同一个词或句子可能有多种含义
2. **上下文依赖**：词义往往取决于上下文
3. **语言多样性**：不同语言有不同的语法和结构
4. **隐含知识**：理解语言需要常识和背景知识

### NLP 核心任务分类

NLP 任务可以分为以下几大类：

**1. 文本分类（Text Classification）**
- 情感分析：判断文本的情感倾向（正面/负面/中性）
- 垃圾邮件检测：识别垃圾邮件
- 主题分类：将文本归类到预定义的类别

**2. 序列标注（Sequence Labeling）**
- 命名实体识别（NER）：识别文本中的人名、地名、机构名等
- 词性标注（POS Tagging）：为每个词标注词性
- 分词：将连续文本切分为词语单元

**3. 文本生成（Text Generation）**
- 机器翻译：将文本从一种语言翻译为另一种
- 文本摘要：生成文本的简短摘要
- 对话系统：生成自然的对话回复

**4. 语义理解（Semantic Understanding）**
- 问答系统：根据问题从文本中找到答案
- 阅读理解：理解文章并回答相关问题
- 文本蕴含：判断两个句子之间的逻辑关系

**5. 信息抽取（Information Extraction）**
- 关系抽取：从文本中提取实体之间的关系
- 事件抽取：识别文本中描述的事件
- 知识图谱构建：从文本构建结构化知识

## 文本预处理

文本预处理是 NLP 流程的第一步，高质量的预处理直接影响模型的效果。

### 文本清洗

```python
import re
import unicodedata

def clean_text(text):
    """文本清洗函数"""
    # 1. Unicode 标准化
    text = unicodedata.normalize('NFKC', text)

    # 2. 转换为小写（英文场景）
    text = text.lower()

    # 3. 移除 HTML 标签
    text = re.sub(r'<[^>]+>', '', text)

    # 4. 移除 URL
    text = re.sub(r'http\S+|www\.\S+', '', text)

    # 5. 移除特殊字符（保留中文、英文、数字）
    text = re.sub(r'[^\w\s\u4e00-\u9fff]', '', text)

    # 6. 移除多余空白
    text = re.sub(r'\s+', ' ', text).strip()

    return text

# 示例
raw_text = "<p>这是一个测试文本！！！https://example.com @user #topic</p>"
cleaned = clean_text(raw_text)
print(cleaned)  # 输出: 这是一个测试文本 user topic
```

### 中文分词

中文没有天然的词语边界，分词是中文 NLP 的基础任务。

```python
import jieba
import jieba.posseg as pseg

# 基础分词
text = "自然语言处理是人工智能的重要分支"
words = jieba.lcut(text)
print(words)  # ['自然语言', '处理', '是', '人工智能', '的', '重要', '分支']

# 精确模式 vs 全模式
print(jieba.lcut(text, cut_all=False))  # 精确模式
print(jieba.lcut(text, cut_all=True))   # 全模式，输出所有可能的词

# 词性标注
words_with_pos = pseg.lcut(text)
for word, pos in words_with_pos:
    print(f"{word}/{pos}", end=" ")
# 输出: 自然语言/l 处理/v 是/v 人工智能/n 的/uj 重要/a 分支/n

# 添加自定义词典
jieba.add_word("自然语言处理", freq=1000, tag="nz")
jieba.add_word("深度学习")

# 加载用户词典文件
# jieba.load_userdict("user_dict.txt")
```

### 停用词处理

```python
def load_stopwords(filepath):
    """加载停用词表"""
    with open(filepath, 'r', encoding='utf-8') as f:
        stopwords = set(line.strip() for line in f)
    return stopwords

def remove_stopwords(words, stopwords):
    """移除停用词"""
    return [w for w in words if w not in stopwords and len(w) > 0]

# 常见中文停用词
chinese_stopwords = {'的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'}

text = "我今天去了北京，北京的天气很好"
words = jieba.lcut(text)
filtered_words = remove_stopwords(words, chinese_stopwords)
print(filtered_words)  # ['今天', '北京', '北京', '天气']
```

### 文本向量化

**词袋模型（Bag of Words）**

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

# 示例文档
documents = [
    "机器学习是人工智能的子领域",
    "深度学习是机器学习的分支",
    "自然语言处理使用机器学习技术"
]

# 词袋模型
count_vec = CountVectorizer(tokenizer=jieba.lcut)
bow_matrix = count_vec.fit_transform(documents)
print("词汇表:", count_vec.get_feature_names_out())
print("词袋矩阵:\n", bow_matrix.toarray())

# TF-IDF 向量化
tfidf_vec = TfidfVectorizer(tokenizer=jieba.lcut)
tfidf_matrix = tfidf_vec.fit_transform(documents)
print("TF-IDF 矩阵:\n", tfidf_matrix.toarray())
```

**TF-IDF 详解**

TF-IDF（Term Frequency-Inverse Document Frequency）是一种统计方法，用于评估词语在文档集合中的重要程度：

$$
\text{TF-IDF}(t, d) = \text{TF}(t, d) \times \text{IDF}(t)
$$

其中：
- TF（词频）= 词语在文档中出现的次数 / 文档总词数
- IDF（逆文档频率）= log(文档总数 / 包含该词的文档数)

```python
import numpy as np

def compute_tfidf(documents, tokenizer):
    """手动实现 TF-IDF"""
    # 分词
    tokenized_docs = [tokenizer(doc) for doc in documents]

    # 构建词汇表
    vocab = list(set(word for doc in tokenized_docs for word in doc))
    vocab_idx = {word: i for i, word in enumerate(vocab)}

    # 计算 TF
    tf_matrix = np.zeros((len(documents), len(vocab)))
    for i, doc in enumerate(tokenized_docs):
        doc_len = len(doc)
        for word in doc:
            tf_matrix[i, vocab_idx[word]] += 1 / doc_len

    # 计算 IDF
    df = np.sum(tf_matrix > 0, axis=0)  # 文档频率
    idf = np.log(len(documents) / (df + 1)) + 1  # 平滑处理

    # 计算 TF-IDF
    tfidf_matrix = tf_matrix * idf

    return tfidf_matrix, vocab
```

## 传统 NLP 方法

在深度学习兴起之前，传统机器学习方法在 NLP 领域占据主导地位。

### 朴素贝叶斯分类

```python
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# 准备数据
texts = [
    "这部电影太棒了，强烈推荐", "剧情精彩，演技出色",
    "浪费时间，不值得看", "太无聊了，看睡着了",
    "画面很美，音乐动听", "故事老套，毫无新意"
]
labels = [1, 1, 0, 0, 1, 0]  # 1: 正面, 0: 负面

# 特征提取
vectorizer = TfidfVectorizer(tokenizer=jieba.lcut)
X = vectorizer.fit_transform(texts)

# 训练模型
X_train, X_test, y_train, y_test = train_test_split(X, labels, test_size=0.3)
clf = MultinomialNB()
clf.fit(X_train, y_train)

# 预测
y_pred = clf.predict(X_test)
print(classification_report(y_test, y_pred, target_names=['负面', '正面']))
```

### 隐马尔可夫模型（HMM）

HMM 常用于序列标注任务，如词性标注和命名实体识别。

```python
import numpy as np

class HMM:
    """简化版隐马尔可夫模型"""

    def __init__(self, n_states, n_observations):
        self.n_states = n_states
        self.n_obs = n_observations

        # 初始状态概率
        self.pi = np.ones(n_states) / n_states
        # 状态转移概率
        self.A = np.ones((n_states, n_states)) / n_states
        # 发射概率
        self.B = np.ones((n_states, n_observations)) / n_observations

    def viterbi(self, observations):
        """维特比算法：找到最可能的状态序列"""
        T = len(observations)

        # 动态规划表
        dp = np.zeros((T, self.n_states))
        backpointer = np.zeros((T, self.n_states), dtype=int)

        # 初始化
        dp[0] = self.pi * self.B[:, observations[0]]

        # 递推
        for t in range(1, T):
            for j in range(self.n_states):
                probs = dp[t-1] * self.A[:, j] * self.B[j, observations[t]]
                dp[t, j] = np.max(probs)
                backpointer[t, j] = np.argmax(probs)

        # 回溯
        states = np.zeros(T, dtype=int)
        states[-1] = np.argmax(dp[-1])
        for t in range(T-2, -1, -1):
            states[t] = backpointer[t+1, states[t+1]]

        return states
```

### 条件随机场（CRF）

CRF 是序列标注任务的经典模型，常与 BiLSTM 结合使用。

```python
# 使用 sklearn-crfsuite
import sklearn_crfsuite
from sklearn_crfsuite import metrics

def word2features(sent, i):
    """提取词语特征"""
    word = sent[i][0]
    features = {
        'word': word,
        'word.isdigit': word.isdigit(),
        'word.length': len(word),
    }

    if i > 0:
        prev_word = sent[i-1][0]
        features.update({
            '-1:word': prev_word,
            '-1:word.isdigit': prev_word.isdigit(),
        })
    else:
        features['BOS'] = True  # 句子开头

    if i < len(sent) - 1:
        next_word = sent[i+1][0]
        features.update({
            '+1:word': next_word,
            '+1:word.isdigit': next_word.isdigit(),
        })
    else:
        features['EOS'] = True  # 句子结尾

    return features

def sent2features(sent):
    return [word2features(sent, i) for i in range(len(sent))]

def sent2labels(sent):
    return [label for token, label in sent]

# 训练 CRF 模型
crf = sklearn_crfsuite.CRF(
    algorithm='lbfgs',
    c1=0.1,
    c2=0.1,
    max_iterations=100
)
# crf.fit(X_train, y_train)
```

## 词嵌入（Word Embeddings）

词嵌入是将词语映射到稠密向量空间的技术，是现代 NLP 的基础。

### Word2Vec

Word2Vec 由 Google 在 2013 年提出，包含两种训练架构：CBOW 和 Skip-gram。

**Skip-gram 模型原理**

Skip-gram 的目标是根据中心词预测上下文词：

$$
P(w_o | w_c) = \frac{\exp(v_{w_o}^T v_{w_c})}{\sum_{w \in V} \exp(v_w^T v_{w_c})}
$$

```python
from gensim.models import Word2Vec
import jieba

# 准备语料
corpus = [
    "深度学习是机器学习的一个分支",
    "神经网络是深度学习的基础",
    "自然语言处理广泛应用深度学习",
    "计算机视觉也使用深度学习技术"
]

# 分词
tokenized_corpus = [jieba.lcut(doc) for doc in corpus]

# 训练 Word2Vec 模型
model = Word2Vec(
    sentences=tokenized_corpus,
    vector_size=100,      # 词向量维度
    window=5,             # 上下文窗口大小
    min_count=1,          # 最小词频
    workers=4,            # 训练线程数
    sg=1,                 # 1: Skip-gram, 0: CBOW
    epochs=100
)

# 获取词向量
vector = model.wv['深度学习']
print(f"词向量维度: {vector.shape}")

# 查找相似词
similar_words = model.wv.most_similar('深度学习', topn=5)
print("与'深度学习'最相似的词:")
for word, score in similar_words:
    print(f"  {word}: {score:.4f}")

# 词语类比
# 例如: 国王 - 男人 + 女人 = 女王
result = model.wv.most_similar(positive=['机器学习', '图像'], negative=['文本'], topn=1)

# 保存和加载模型
model.save("word2vec.model")
loaded_model = Word2Vec.load("word2vec.model")
```

### GloVe

GloVe（Global Vectors）结合了全局矩阵分解和局部上下文窗口的优点。

```python
# 使用预训练的 GloVe 向量
def load_glove_vectors(filepath, dim=300):
    """加载 GloVe 预训练词向量"""
    embeddings = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            values = line.split()
            word = values[0]
            vector = np.array(values[1:], dtype='float32')
            embeddings[word] = vector
    return embeddings

# 构建嵌入矩阵
def create_embedding_matrix(word_index, embeddings, dim=300):
    """创建词嵌入矩阵"""
    vocab_size = len(word_index) + 1
    embedding_matrix = np.zeros((vocab_size, dim))

    for word, idx in word_index.items():
        if word in embeddings:
            embedding_matrix[idx] = embeddings[word]
        else:
            # 未登录词使用随机初始化
            embedding_matrix[idx] = np.random.normal(0, 0.1, dim)

    return embedding_matrix
```

### FastText

FastText 考虑了词的子词信息，能更好地处理未登录词。

```python
from gensim.models import FastText

# 训练 FastText 模型
fasttext_model = FastText(
    sentences=tokenized_corpus,
    vector_size=100,
    window=5,
    min_count=1,
    workers=4,
    min_n=2,          # 最小 n-gram 长度
    max_n=5,          # 最大 n-gram 长度
    epochs=100
)

# FastText 可以为未见过的词生成向量
# 通过组合其子词的向量
oov_vector = fasttext_model.wv['深度神经网络学习']  # 即使词不在词表中也能生成向量
```

## 序列模型

### 循环神经网络（RNN）

RNN 通过隐藏状态传递序列信息。

```python
import torch
import torch.nn as nn

class SimpleRNN(nn.Module):
    """简单 RNN 实现"""

    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        self.hidden_size = hidden_size

        # RNN 层
        self.rnn = nn.RNN(input_size, hidden_size, batch_first=True)
        # 输出层
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        # x: (batch_size, seq_len, input_size)

        # 初始化隐藏状态
        h0 = torch.zeros(1, x.size(0), self.hidden_size)

        # RNN 前向传播
        out, hn = self.rnn(x, h0)
        # out: (batch_size, seq_len, hidden_size)
        # hn: (1, batch_size, hidden_size)

        # 取最后一个时间步的输出
        out = self.fc(out[:, -1, :])
        return out

# 使用示例
model = SimpleRNN(input_size=100, hidden_size=256, output_size=2)
x = torch.randn(32, 50, 100)  # batch=32, seq_len=50, input_dim=100
output = model(x)
print(output.shape)  # torch.Size([32, 2])
```

### LSTM（长短期记忆网络）

LSTM 通过门控机制解决了 RNN 的梯度消失问题。

```python
class LSTMClassifier(nn.Module):
    """LSTM 文本分类器"""

    def __init__(self, vocab_size, embed_dim, hidden_size, num_classes,
                 num_layers=2, dropout=0.5, bidirectional=True):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)

        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional
        )

        # 双向 LSTM 输出维度翻倍
        lstm_output_size = hidden_size * 2 if bidirectional else hidden_size

        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(lstm_output_size, num_classes)

    def forward(self, x):
        # x: (batch_size, seq_len)

        # 词嵌入
        embedded = self.embedding(x)
        # embedded: (batch_size, seq_len, embed_dim)

        # LSTM
        lstm_out, (hn, cn) = self.lstm(embedded)
        # lstm_out: (batch_size, seq_len, hidden_size * num_directions)

        # 使用最后一个时间步的输出
        # 对于双向 LSTM，拼接两个方向的最后隐藏状态
        if self.lstm.bidirectional:
            hidden = torch.cat((hn[-2], hn[-1]), dim=1)
        else:
            hidden = hn[-1]

        # 分类
        out = self.dropout(hidden)
        out = self.fc(out)
        return out

# LSTM 内部计算过程
class LSTMCell(nn.Module):
    """LSTM 单元的手动实现"""

    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.hidden_size = hidden_size

        # 输入门、遗忘门、输出门、候选细胞状态
        self.W_i = nn.Linear(input_size + hidden_size, hidden_size)
        self.W_f = nn.Linear(input_size + hidden_size, hidden_size)
        self.W_o = nn.Linear(input_size + hidden_size, hidden_size)
        self.W_c = nn.Linear(input_size + hidden_size, hidden_size)

    def forward(self, x, prev_state):
        h_prev, c_prev = prev_state

        # 拼接输入和上一时刻隐藏状态
        combined = torch.cat([x, h_prev], dim=1)

        # 计算各个门
        i = torch.sigmoid(self.W_i(combined))  # 输入门
        f = torch.sigmoid(self.W_f(combined))  # 遗忘门
        o = torch.sigmoid(self.W_o(combined))  # 输出门
        c_tilde = torch.tanh(self.W_c(combined))  # 候选细胞状态

        # 更新细胞状态
        c = f * c_prev + i * c_tilde

        # 计算隐藏状态
        h = o * torch.tanh(c)

        return h, c
```

### GRU（门控循环单元）

GRU 是 LSTM 的简化版本，参数更少但效果相近。

```python
class GRUClassifier(nn.Module):
    """GRU 文本分类器"""

    def __init__(self, vocab_size, embed_dim, hidden_size, num_classes):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.gru = nn.GRU(embed_dim, hidden_size, batch_first=True, bidirectional=True)
        self.fc = nn.Linear(hidden_size * 2, num_classes)

    def forward(self, x):
        embedded = self.embedding(x)
        _, hidden = self.gru(embedded)
        # 拼接双向 GRU 的最后隐藏状态
        hidden = torch.cat((hidden[-2], hidden[-1]), dim=1)
        return self.fc(hidden)
```

## 注意力机制

注意力机制让模型能够动态关注输入序列中的重要部分。

### 基础注意力机制

```python
class Attention(nn.Module):
    """加性注意力机制"""

    def __init__(self, hidden_size):
        super().__init__()
        self.W = nn.Linear(hidden_size, hidden_size)
        self.V = nn.Linear(hidden_size, 1)

    def forward(self, encoder_outputs, mask=None):
        # encoder_outputs: (batch_size, seq_len, hidden_size)

        # 计算注意力分数
        energy = torch.tanh(self.W(encoder_outputs))
        attention_scores = self.V(energy).squeeze(-1)
        # attention_scores: (batch_size, seq_len)

        # 应用 mask（如果有）
        if mask is not None:
            attention_scores = attention_scores.masked_fill(mask == 0, -1e9)

        # softmax 归一化
        attention_weights = torch.softmax(attention_scores, dim=1)

        # 加权求和
        context = torch.bmm(attention_weights.unsqueeze(1), encoder_outputs)
        # context: (batch_size, 1, hidden_size)

        return context.squeeze(1), attention_weights


class AttentionLSTM(nn.Module):
    """带注意力机制的 LSTM 分类器"""

    def __init__(self, vocab_size, embed_dim, hidden_size, num_classes):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_size, batch_first=True, bidirectional=True)
        self.attention = Attention(hidden_size * 2)
        self.fc = nn.Linear(hidden_size * 2, num_classes)

    def forward(self, x, mask=None):
        # 词嵌入
        embedded = self.embedding(x)

        # LSTM 编码
        lstm_out, _ = self.lstm(embedded)

        # 注意力
        context, attn_weights = self.attention(lstm_out, mask)

        # 分类
        output = self.fc(context)

        return output, attn_weights
```

### 自注意力（Self-Attention）

自注意力允许序列中的每个位置关注所有其他位置。

```python
class SelfAttention(nn.Module):
    """自注意力机制"""

    def __init__(self, embed_dim, num_heads=8):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads

        assert self.head_dim * num_heads == embed_dim, "embed_dim 必须能被 num_heads 整除"

        self.W_q = nn.Linear(embed_dim, embed_dim)
        self.W_k = nn.Linear(embed_dim, embed_dim)
        self.W_v = nn.Linear(embed_dim, embed_dim)
        self.W_o = nn.Linear(embed_dim, embed_dim)

        self.scale = self.head_dim ** -0.5

    def forward(self, x, mask=None):
        batch_size, seq_len, _ = x.shape

        # 线性变换
        Q = self.W_q(x)
        K = self.W_k(x)
        V = self.W_v(x)

        # 分割为多头
        Q = Q.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        # Q, K, V: (batch_size, num_heads, seq_len, head_dim)

        # 计算注意力分数
        attention_scores = torch.matmul(Q, K.transpose(-2, -1)) * self.scale

        if mask is not None:
            attention_scores = attention_scores.masked_fill(mask == 0, -1e9)

        attention_weights = torch.softmax(attention_scores, dim=-1)

        # 加权求和
        out = torch.matmul(attention_weights, V)
        # out: (batch_size, num_heads, seq_len, head_dim)

        # 合并多头
        out = out.transpose(1, 2).contiguous().view(batch_size, seq_len, self.embed_dim)
        out = self.W_o(out)

        return out, attention_weights
```

## BERT 与预训练模型

BERT（Bidirectional Encoder Representations from Transformers）是 NLP 领域的里程碑式模型。

### BERT 架构与预训练任务

BERT 使用 Transformer 的 Encoder 结构，通过两个预训练任务学习语言表示：

1. **Masked Language Model (MLM)**：随机遮盖 15% 的词，让模型预测被遮盖的词
2. **Next Sentence Prediction (NSP)**：预测两个句子是否连续

```python
from transformers import BertTokenizer, BertModel, BertForSequenceClassification
import torch

# 加载预训练模型和分词器
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
model = BertModel.from_pretrained('bert-base-chinese')

# 文本编码
text = "自然语言处理是人工智能的重要分支"
inputs = tokenizer(
    text,
    return_tensors='pt',
    padding=True,
    truncation=True,
    max_length=128
)

print("Input IDs:", inputs['input_ids'])
print("Attention Mask:", inputs['attention_mask'])
print("Token Type IDs:", inputs['token_type_ids'])

# 获取 BERT 输出
with torch.no_grad():
    outputs = model(**inputs)

# last_hidden_state: 所有 token 的隐藏状态
last_hidden_state = outputs.last_hidden_state
print(f"Hidden state shape: {last_hidden_state.shape}")
# (batch_size, seq_len, hidden_size)

# pooler_output: [CLS] token 的输出，经过一层全连接
pooler_output = outputs.pooler_output
print(f"Pooler output shape: {pooler_output.shape}")
# (batch_size, hidden_size)
```

### BERT 微调实战

```python
from transformers import BertForSequenceClassification, AdamW, get_linear_schedule_with_warmup
from torch.utils.data import DataLoader, Dataset

class TextClassificationDataset(Dataset):
    """文本分类数据集"""

    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].squeeze(),
            'attention_mask': encoding['attention_mask'].squeeze(),
            'labels': torch.tensor(label)
        }


def train_bert_classifier(train_texts, train_labels, num_classes, epochs=3):
    """训练 BERT 分类器"""

    # 初始化
    tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
    model = BertForSequenceClassification.from_pretrained(
        'bert-base-chinese',
        num_labels=num_classes
    )

    # 准备数据
    dataset = TextClassificationDataset(train_texts, train_labels, tokenizer)
    dataloader = DataLoader(dataset, batch_size=16, shuffle=True)

    # 优化器
    optimizer = AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)

    # 学习率调度
    total_steps = len(dataloader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(0.1 * total_steps),
        num_training_steps=total_steps
    )

    # 训练
    model.train()
    for epoch in range(epochs):
        total_loss = 0
        for batch in dataloader:
            optimizer.zero_grad()

            outputs = model(
                input_ids=batch['input_ids'],
                attention_mask=batch['attention_mask'],
                labels=batch['labels']
            )

            loss = outputs.loss
            total_loss += loss.item()

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()

        avg_loss = total_loss / len(dataloader)
        print(f"Epoch {epoch+1}, Loss: {avg_loss:.4f}")

    return model, tokenizer
```

## Hugging Face Transformers

Hugging Face Transformers 库提供了便捷的预训练模型接口。

### 快速入门

```python
from transformers import pipeline

# 情感分析
sentiment_analyzer = pipeline("sentiment-analysis", model="uer/roberta-base-finetuned-dianping-chinese")
result = sentiment_analyzer("这家餐厅的菜品非常美味，服务也很周到")
print(result)  # [{'label': 'positive', 'score': 0.9998}]

# 命名实体识别
ner = pipeline("ner", model="uer/roberta-base-finetuned-cluener2020-chinese", aggregation_strategy="simple")
result = ner("张三在北京大学学习计算机科学")
print(result)

# 问答系统
qa = pipeline("question-answering", model="uer/roberta-base-chinese-extractive-qa")
result = qa(
    question="BERT是什么时候发布的？",
    context="BERT是Google在2018年发布的预训练语言模型，它在多项NLP任务上取得了突破性的效果。"
)
print(result)  # {'answer': '2018年', 'score': 0.95, ...}

# 文本生成
generator = pipeline("text-generation", model="gpt2-chinese-cluecorpussmall")
result = generator("人工智能的未来是", max_length=50, num_return_sequences=1)
print(result)

# 填空任务
fill_mask = pipeline("fill-mask", model="bert-base-chinese")
result = fill_mask("自然语言处理是[MASK]智能的重要分支")
print(result)
```

### 模型微调

```python
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)
from datasets import load_dataset
import evaluate

# 加载数据集
dataset = load_dataset("ChnSentiCorp", "default")

# 加载模型和分词器
model_name = "bert-base-chinese"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)

# 数据预处理
def preprocess_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        padding="max_length",
        max_length=128
    )

tokenized_dataset = dataset.map(preprocess_function, batched=True)

# 评估指标
accuracy = evaluate.load("accuracy")

def compute_metrics(eval_pred):
    predictions, labels = eval_pred
    predictions = predictions.argmax(axis=-1)
    return accuracy.compute(predictions=predictions, references=labels)

# 训练参数
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=64,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir="./logs",
    logging_steps=100,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
)

# 创建 Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["validation"],
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)

# 训练
trainer.train()

# 评估
eval_results = trainer.evaluate()
print(f"Evaluation results: {eval_results}")
```

### 使用不同的预训练模型

```python
from transformers import AutoTokenizer, AutoModel

# 中文 BERT 变体
models = {
    "bert-base-chinese": "Google 官方中文 BERT",
    "hfl/chinese-bert-wwm-ext": "哈工大讯飞全词遮罩 BERT",
    "hfl/chinese-roberta-wwm-ext": "中文 RoBERTa",
    "hfl/chinese-macbert-base": "中文 MacBERT",
    "IDEA-CCNL/Erlangshen-MegatronBert-1.3B": "二郎神大规模预训练模型",
}

# 加载示例
model_name = "hfl/chinese-roberta-wwm-ext"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# 获取句子表示
text = "自然语言处理技术日新月异"
inputs = tokenizer(text, return_tensors="pt")

with torch.no_grad():
    outputs = model(**inputs)
    # 使用 [CLS] token 作为句子表示
    sentence_embedding = outputs.last_hidden_state[:, 0, :]
    print(f"Sentence embedding shape: {sentence_embedding.shape}")
```

## 常见任务实战

### 文本分类完整流程

```python
import torch
from torch.utils.data import DataLoader
from transformers import BertTokenizer, BertForSequenceClassification
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import numpy as np

class TextClassifier:
    """BERT 文本分类器封装"""

    def __init__(self, model_name='bert-base-chinese', num_labels=2):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.model = BertForSequenceClassification.from_pretrained(
            model_name,
            num_labels=num_labels
        ).to(self.device)
        self.num_labels = num_labels

    def prepare_data(self, texts, labels=None, max_length=128, batch_size=32):
        """准备数据加载器"""
        encodings = self.tokenizer(
            texts,
            truncation=True,
            padding=True,
            max_length=max_length,
            return_tensors='pt'
        )

        if labels is not None:
            dataset = torch.utils.data.TensorDataset(
                encodings['input_ids'],
                encodings['attention_mask'],
                torch.tensor(labels)
            )
        else:
            dataset = torch.utils.data.TensorDataset(
                encodings['input_ids'],
                encodings['attention_mask']
            )

        return DataLoader(dataset, batch_size=batch_size, shuffle=(labels is not None))

    def train(self, train_texts, train_labels, val_texts=None, val_labels=None,
              epochs=3, lr=2e-5, batch_size=32):
        """训练模型"""
        train_loader = self.prepare_data(train_texts, train_labels, batch_size=batch_size)

        optimizer = torch.optim.AdamW(self.model.parameters(), lr=lr)

        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch in train_loader:
                input_ids, attention_mask, labels = [b.to(self.device) for b in batch]

                optimizer.zero_grad()
                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )
                loss = outputs.loss
                loss.backward()
                optimizer.step()

                total_loss += loss.item()

            avg_loss = total_loss / len(train_loader)
            print(f"Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.4f}")

            # 验证
            if val_texts and val_labels:
                val_acc = self.evaluate(val_texts, val_labels)
                print(f"Validation Accuracy: {val_acc:.4f}")

    def predict(self, texts, batch_size=32):
        """预测"""
        self.model.eval()
        loader = self.prepare_data(texts, batch_size=batch_size)

        predictions = []
        with torch.no_grad():
            for batch in loader:
                input_ids = batch[0].to(self.device)
                attention_mask = batch[1].to(self.device)

                outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
                preds = torch.argmax(outputs.logits, dim=1)
                predictions.extend(preds.cpu().numpy())

        return np.array(predictions)

    def evaluate(self, texts, labels):
        """评估"""
        predictions = self.predict(texts)
        accuracy = (predictions == np.array(labels)).mean()
        return accuracy

    def save(self, path):
        """保存模型"""
        self.model.save_pretrained(path)
        self.tokenizer.save_pretrained(path)

    def load(self, path):
        """加载模型"""
        self.model = BertForSequenceClassification.from_pretrained(path).to(self.device)
        self.tokenizer = BertTokenizer.from_pretrained(path)


# 使用示例
if __name__ == "__main__":
    # 准备数据
    texts = [
        "这部电影太精彩了，强烈推荐！",
        "剧情拖沓，浪费时间",
        "演员演技在线，故事感人",
        "特效很假，剧本很烂",
        # ... 更多数据
    ]
    labels = [1, 0, 1, 0]  # 1: 正面, 0: 负面

    # 划分数据集
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.2, random_state=42
    )

    # 训练
    classifier = TextClassifier(num_labels=2)
    classifier.train(train_texts, train_labels, val_texts, val_labels, epochs=3)

    # 预测
    test_texts = ["这是一部值得一看的好电影", "剧情无聊透顶"]
    predictions = classifier.predict(test_texts)
    print(f"Predictions: {predictions}")
```

### 命名实体识别（NER）

```python
from transformers import AutoTokenizer, AutoModelForTokenClassification
from transformers import pipeline
import torch

class NERModel:
    """命名实体识别模型"""

    def __init__(self, model_name="uer/roberta-base-finetuned-cluener2020-chinese"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForTokenClassification.from_pretrained(model_name)
        self.ner_pipeline = pipeline(
            "ner",
            model=self.model,
            tokenizer=self.tokenizer,
            aggregation_strategy="simple"
        )

        # 实体类型映射
        self.label_map = {
            "PER": "人名",
            "LOC": "地名",
            "ORG": "机构",
            "TIME": "时间",
        }

    def predict(self, text):
        """预测实体"""
        results = self.ner_pipeline(text)

        entities = []
        for item in results:
            entity = {
                "text": item["word"],
                "type": self.label_map.get(item["entity_group"], item["entity_group"]),
                "score": item["score"],
                "start": item["start"],
                "end": item["end"]
            }
            entities.append(entity)

        return entities

    def visualize(self, text):
        """可视化实体标注"""
        entities = self.predict(text)

        # 按位置排序
        entities = sorted(entities, key=lambda x: x["start"])

        result = []
        last_end = 0
        for entity in entities:
            # 添加实体前的普通文本
            result.append(text[last_end:entity["start"]])
            # 添加带标注的实体
            result.append(f"【{entity['text']}/{entity['type']}】")
            last_end = entity["end"]

        # 添加最后的文本
        result.append(text[last_end:])

        return "".join(result)


# 使用示例
ner = NERModel()
text = "张三于2023年在北京大学获得了计算机科学博士学位"
entities = ner.predict(text)
print("识别到的实体:")
for e in entities:
    print(f"  {e['text']} -> {e['type']} (置信度: {e['score']:.2f})")

print("\n标注结果:")
print(ner.visualize(text))
```

### 文本相似度计算

```python
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class SentenceSimilarity:
    """句子相似度计算"""

    def __init__(self, model_name='shibing624/text2vec-base-chinese'):
        self.model = SentenceTransformer(model_name)

    def encode(self, sentences):
        """编码句子"""
        return self.model.encode(sentences, normalize_embeddings=True)

    def similarity(self, sent1, sent2):
        """计算两个句子的相似度"""
        embeddings = self.encode([sent1, sent2])
        return cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]

    def find_most_similar(self, query, candidates, top_k=5):
        """在候选句子中找到最相似的"""
        query_embedding = self.encode([query])
        candidate_embeddings = self.encode(candidates)

        similarities = cosine_similarity(query_embedding, candidate_embeddings)[0]

        # 获取 top_k 索引
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append({
                "text": candidates[idx],
                "score": similarities[idx]
            })

        return results


# 使用示例
sim = SentenceSimilarity()

# 计算两个句子的相似度
sent1 = "今天天气真好"
sent2 = "今天的天气非常不错"
score = sim.similarity(sent1, sent2)
print(f"相似度: {score:.4f}")

# 语义搜索
query = "如何学习机器学习"
candidates = [
    "机器学习入门指南",
    "深度学习教程",
    "Python 编程基础",
    "人工智能学习路线",
    "数据分析方法"
]
results = sim.find_most_similar(query, candidates, top_k=3)
print("\n最相似的文档:")
for r in results:
    print(f"  {r['text']}: {r['score']:.4f}")
```

## 面试要点

### 核心概念题

**1. 什么是词嵌入？Word2Vec 的两种架构有什么区别？**

词嵌入是将词语映射到稠密向量空间的技术，使得语义相近的词在向量空间中距离较近。

Word2Vec 的两种架构：
- **CBOW（Continuous Bag of Words）**：根据上下文预测中心词，训练速度快，适合高频词
- **Skip-gram**：根据中心词预测上下文词，效果更好，适合低频词和小数据集

**2. LSTM 如何解决 RNN 的梯度消失问题？**

LSTM 通过引入三个门控机制：
- **遗忘门**：决定丢弃哪些信息
- **输入门**：决定存储哪些新信息
- **输出门**：决定输出哪些信息

细胞状态通过"高速公路"直接传递，梯度可以无损地流动，从而缓解梯度消失问题。

**3. 自注意力机制的计算复杂度是多少？如何优化？**

自注意力的时间和空间复杂度都是 O(n^2)，其中 n 是序列长度。

优化方法：
- **稀疏注意力**（Sparse Attention）：只计算部分位置的注意力
- **线性注意力**（Linear Attention）：使用核方法将复杂度降为 O(n)
- **局部敏感哈希**（LSH）：Reformer 使用的方法
- **滑动窗口**（Sliding Window）：Longformer 使用的方法

**4. BERT 的预训练任务有哪些？各自的作用是什么？**

- **Masked Language Model (MLM)**：随机遮盖 15% 的词让模型预测，学习双向上下文表示
- **Next Sentence Prediction (NSP)**：预测两个句子是否连续，学习句子间关系（后续研究表明 NSP 作用有限）

**5. BERT 和 GPT 的主要区别是什么？**

| 特性 | BERT | GPT |
|------|------|-----|
| 架构 | Transformer Encoder | Transformer Decoder |
| 注意力 | 双向（可以看到完整上下文）| 单向（只能看到左侧上下文）|
| 预训练 | MLM + NSP | 自回归语言建模 |
| 适用任务 | 理解类任务（分类、问答）| 生成类任务（文本生成）|

### 代码实现题

**1. 手写 Softmax 函数**

```python
import numpy as np

def softmax(x, axis=-1):
    """数值稳定的 Softmax 实现"""
    # 减去最大值防止数值溢出
    x_max = np.max(x, axis=axis, keepdims=True)
    exp_x = np.exp(x - x_max)
    return exp_x / np.sum(exp_x, axis=axis, keepdims=True)

# 测试
x = np.array([1.0, 2.0, 3.0])
print(softmax(x))  # [0.0900, 0.2447, 0.6652]
```

**2. 实现简单的位置编码**

```python
import numpy as np
import torch
import torch.nn as nn

class PositionalEncoding(nn.Module):
    """Transformer 位置编码"""

    def __init__(self, d_model, max_len=5000):
        super().__init__()

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)

        pe = pe.unsqueeze(0)  # (1, max_len, d_model)
        self.register_buffer('pe', pe)

    def forward(self, x):
        # x: (batch_size, seq_len, d_model)
        return x + self.pe[:, :x.size(1), :]
```

**3. 实现 Beam Search 解码**

```python
def beam_search(model, start_token, end_token, max_len=50, beam_size=5):
    """Beam Search 解码算法"""

    # 初始化
    sequences = [[start_token]]  # 当前候选序列
    scores = [0.0]  # 对应的分数

    for _ in range(max_len):
        all_candidates = []

        for seq, score in zip(sequences, scores):
            if seq[-1] == end_token:
                all_candidates.append((seq, score))
                continue

            # 获取下一个词的概率分布
            logits = model.predict_next(seq)  # 假设的模型接口
            log_probs = np.log(softmax(logits))

            # 获取 top-k 候选
            top_k_indices = np.argsort(log_probs)[-beam_size:]

            for idx in top_k_indices:
                new_seq = seq + [idx]
                new_score = score + log_probs[idx]
                all_candidates.append((new_seq, new_score))

        # 保留分数最高的 beam_size 个序列
        all_candidates.sort(key=lambda x: x[1], reverse=True)
        sequences = [c[0] for c in all_candidates[:beam_size]]
        scores = [c[1] for c in all_candidates[:beam_size]]

        # 如果所有序列都已结束
        if all(seq[-1] == end_token for seq in sequences):
            break

    return sequences[0]  # 返回得分最高的序列
```

### 常见面试问题

**Q1: 如何处理 NLP 中的 OOV（Out-of-Vocabulary）问题？**

解决方案：
1. **子词分词**：使用 BPE、WordPiece、SentencePiece 等算法
2. **字符级模型**：直接在字符级别建模
3. **FastText**：利用子词信息生成 OOV 词的向量
4. **哈希技巧**：将 OOV 词映射到固定数量的桶中

**Q2: 如何评估文本生成模型的质量？**

自动评估指标：
- **BLEU**：基于 n-gram 精确率，常用于机器翻译
- **ROUGE**：基于召回率，常用于文本摘要
- **Perplexity**：困惑度，衡量语言模型质量
- **BERTScore**：基于 BERT 的语义相似度

人工评估：
- **流畅性**：生成文本是否通顺
- **相关性**：生成内容是否与输入相关
- **多样性**：生成结果是否丰富多样

**Q3: 在工业界部署 NLP 模型有哪些挑战？**

1. **模型压缩**：知识蒸馏、剪枝、量化
2. **推理加速**：ONNX 优化、TensorRT
3. **长文本处理**：滑动窗口、分层处理
4. **在线学习**：持续更新模型以适应新数据
5. **A/B 测试**：科学评估模型效果

## 总结

自然语言处理是一个快速发展的领域，从传统的统计方法到现代的深度学习模型，技术不断演进。掌握 NLP 需要理解：

1. **基础知识**：文本预处理、分词、词向量
2. **经典模型**：RNN、LSTM、注意力机制
3. **现代技术**：Transformer、BERT、GPT 系列
4. **实践能力**：使用 Hugging Face 等工具完成实际任务

随着大语言模型（LLM）的兴起，NLP 正在进入新的时代。建议持续关注最新研究，同时打牢基础，这样才能在这个领域持续成长。

## 参考资源

- [Hugging Face 官方文档](https://huggingface.co/docs)
- [Stanford CS224N: NLP with Deep Learning](https://web.stanford.edu/class/cs224n/)
- [BERT 论文](https://arxiv.org/abs/1810.04805)
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [中文 NLP 资源](https://github.com/fighting41love/funNLP)
