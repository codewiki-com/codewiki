---
title: 特征工程：特征提取技术
description: 掌握各类型数据的特征提取方法：数值、类别、文本和时间特征
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - 特征提取
  - 特征工程
  - 数据处理
  - ML
status: imported
origin: old/src/content/docs/datascience/feature-extraction.zh.md
divergence: 0.276
issues: []
legacy:
  category: DataScience
  subcategory: FeatureEngineering
  order: 8
  lastUpdated: 2026-01-07
---

特征提取（Feature Extraction）是机器学习流程中最关键的环节之一。正如业界流传的一句话："数据和特征决定了机器学习的上限，而模型和算法只是逼近这个上限。"本文将系统介绍各类数据的特征提取方法，帮助你掌握从原始数据中提取有效信息的核心技能。

## 特征提取概述

### 什么是特征提取

特征提取是将原始数据转换为能够被机器学习算法有效利用的数值表示的过程。原始数据可能是结构化的（如表格数据）或非结构化的（如文本、图像），通过特征提取，我们将这些数据转换为特征向量，供模型学习使用。

### 特征提取的重要性

**为什么特征提取如此重要？**

1. **提升模型性能**：好的特征能够更好地表达数据的内在规律，让模型更容易学习
2. **降低计算成本**：通过提取关键特征，可以减少数据维度，加速训练和推理
3. **增强可解释性**：精心设计的特征往往具有业务含义，便于解释模型决策
4. **处理多模态数据**：统一不同类型数据的表示形式，实现多源信息融合

### 特征类型分类

根据数据类型，特征可分为以下几类：

| 数据类型 | 示例 | 常用提取方法 |
|---------|------|-------------|
| 数值特征 | 年龄、收入、温度 | 标准化、归一化、分箱、多项式特征 |
| 类别特征 | 城市、性别、产品类型 | One-Hot、Label、Target、Embedding |
| 文本特征 | 评论、标题、文章 | TF-IDF、Word2Vec、BERT |
| 时间特征 | 日期、时间戳 | 周期特征、滞后特征、滑动窗口 |
| 图像特征 | 照片、医学影像 | CNN特征、HOG、SIFT |

## 数值特征处理

数值特征是最常见的特征类型，但原始数值往往需要经过变换才能发挥最佳效果。

### 标准化（Standardization）

标准化将特征转换为均值为0、标准差为1的分布，适用于大多数机器学习算法。

$$z = \frac{x - \mu}{\sigma}$$

```python
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler

# 创建示例数据
data = pd.DataFrame({
    'age': [25, 30, 35, 40, 45, 50, 55, 60],
    'income': [30000, 45000, 55000, 70000, 85000, 100000, 120000, 150000],
    'score': [60, 72, 85, 90, 78, 88, 95, 82]
})

# 标准化
scaler = StandardScaler()
data_standardized = scaler.fit_transform(data)

print("标准化后的数据：")
print(pd.DataFrame(data_standardized, columns=data.columns))
print(f"\n均值: {data_standardized.mean(axis=0)}")
print(f"标准差: {data_standardized.std(axis=0)}")
```

### 归一化（Normalization）

归一化将特征缩放到指定范围（通常是 [0, 1]），适用于需要特征在固定范围内的场景。

$$x_{norm} = \frac{x - x_{min}}{x_{max} - x_{min}}$$

```python
# 最小-最大归一化
min_max_scaler = MinMaxScaler(feature_range=(0, 1))
data_normalized = min_max_scaler.fit_transform(data)

print("归一化后的数据：")
print(pd.DataFrame(data_normalized, columns=data.columns))

# 自定义范围归一化
scaler_custom = MinMaxScaler(feature_range=(-1, 1))
data_custom = scaler_custom.fit_transform(data)
```

### 鲁棒缩放（Robust Scaling）

当数据存在异常值时，使用中位数和四分位距进行缩放更为稳健。

$$x_{robust} = \frac{x - median}{IQR}$$

```python
# 鲁棒缩放（对异常值不敏感）
robust_scaler = RobustScaler()
data_robust = robust_scaler.fit_transform(data)

print("鲁棒缩放后的数据：")
print(pd.DataFrame(data_robust, columns=data.columns))
```

### 对数变换与幂变换

对于偏态分布的数据，对数变换和幂变换可以使其更接近正态分布。

```python
from sklearn.preprocessing import PowerTransformer
import matplotlib.pyplot as plt

# 创建偏态数据
np.random.seed(42)
skewed_data = np.random.exponential(scale=2.0, size=1000).reshape(-1, 1)

# 对数变换（需要数据为正）
log_transformed = np.log1p(skewed_data)  # log(1 + x) 处理零值

# Box-Cox 变换（需要数据为正）
box_cox = PowerTransformer(method='box-cox')
box_cox_transformed = box_cox.fit_transform(skewed_data)

# Yeo-Johnson 变换（可处理负值）
yeo_johnson = PowerTransformer(method='yeo-johnson')
yeo_johnson_transformed = yeo_johnson.fit_transform(skewed_data)

print(f"原始数据偏度: {pd.Series(skewed_data.flatten()).skew():.4f}")
print(f"对数变换后偏度: {pd.Series(log_transformed.flatten()).skew():.4f}")
print(f"Box-Cox变换后偏度: {pd.Series(box_cox_transformed.flatten()).skew():.4f}")
```

### 分箱（Binning）

分箱将连续特征离散化，可以捕捉非线性关系并增强模型鲁棒性。

```python
from sklearn.preprocessing import KBinsDiscretizer

# 创建年龄数据
ages = np.array([18, 22, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]).reshape(-1, 1)

# 等宽分箱
equal_width = KBinsDiscretizer(n_bins=4, encode='ordinal', strategy='uniform')
ages_equal_width = equal_width.fit_transform(ages)

# 等频分箱
equal_freq = KBinsDiscretizer(n_bins=4, encode='ordinal', strategy='quantile')
ages_equal_freq = equal_freq.fit_transform(ages)

# K-means 分箱
kmeans_bins = KBinsDiscretizer(n_bins=4, encode='ordinal', strategy='kmeans')
ages_kmeans = kmeans_bins.fit_transform(ages)

# 自定义分箱
bins = [0, 18, 30, 45, 60, 100]
labels = ['未成年', '青年', '中年', '中老年', '老年']
ages_custom = pd.cut(ages.flatten(), bins=bins, labels=labels)

print("自定义分箱结果：")
print(ages_custom)
```

### 多项式特征

多项式特征可以捕捉特征之间的交互效应和非线性关系。

```python
from sklearn.preprocessing import PolynomialFeatures

# 原始特征
X = np.array([[2, 3], [3, 4], [4, 5]])

# 生成多项式特征（degree=2）
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X)

print("原始特征: [x1, x2]")
print("多项式特征: [x1, x2, x1^2, x1*x2, x2^2]")
print(f"特征名称: {poly.get_feature_names_out(['x1', 'x2'])}")
print(f"变换后:\n{X_poly}")

# 仅生成交互特征
interaction = PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)
X_interaction = interaction.fit_transform(X)
print(f"\n仅交互特征: {interaction.get_feature_names_out(['x1', 'x2'])}")
```

## 类别特征编码

类别特征是机器学习中常见但处理起来较为棘手的特征类型。选择合适的编码方法对模型性能有重要影响。

### Label Encoding（标签编码）

将类别映射为整数，适用于有序类别或树模型。

```python
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder

# 创建类别数据
data = pd.DataFrame({
    'city': ['北京', '上海', '广州', '深圳', '北京', '上海'],
    'education': ['高中', '本科', '硕士', '博士', '本科', '硕士'],
    'size': ['小', '中', '大', '小', '大', '中']
})

# Label Encoding（单列）
le = LabelEncoder()
data['city_encoded'] = le.fit_transform(data['city'])
print("城市编码映射:", dict(zip(le.classes_, range(len(le.classes_)))))

# Ordinal Encoding（有序类别，多列）
# 指定顺序
education_order = ['高中', '本科', '硕士', '博士']
size_order = ['小', '中', '大']

ordinal_encoder = OrdinalEncoder(categories=[education_order, size_order])
data[['education_encoded', 'size_encoded']] = ordinal_encoder.fit_transform(
    data[['education', 'size']]
)

print("\n编码后的数据：")
print(data)
```

### One-Hot Encoding（独热编码）

将每个类别转换为二进制向量，适用于无序类别特征。

```python
from sklearn.preprocessing import OneHotEncoder

# One-Hot Encoding
onehot_encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
city_onehot = onehot_encoder.fit_transform(data[['city']])

# 获取特征名称
feature_names = onehot_encoder.get_feature_names_out(['city'])
city_onehot_df = pd.DataFrame(city_onehot, columns=feature_names)

print("One-Hot 编码结果：")
print(city_onehot_df)

# 使用 Pandas 的 get_dummies（更简便）
city_dummies = pd.get_dummies(data['city'], prefix='city')
print("\nPandas get_dummies 结果：")
print(city_dummies)

# 处理高基数类别特征
# 方法1：只保留 Top N 类别
def top_n_encoding(series, n=10):
    top_categories = series.value_counts().head(n).index
    return series.apply(lambda x: x if x in top_categories else 'Other')

# 方法2：使用 drop='first' 避免虚拟变量陷阱
onehot_drop_first = OneHotEncoder(sparse_output=False, drop='first')
city_onehot_reduced = onehot_drop_first.fit_transform(data[['city']])
```

### Target Encoding（目标编码）

用目标变量的均值替换类别，适用于高基数类别特征。

```python
from category_encoders import TargetEncoder
import warnings
warnings.filterwarnings('ignore')

# 创建带目标变量的数据
data_with_target = pd.DataFrame({
    'city': ['北京', '上海', '广州', '深圳', '北京', '上海', '广州', '深圳'],
    'category': ['A', 'B', 'A', 'C', 'B', 'A', 'C', 'B'],
    'target': [1, 0, 1, 0, 1, 1, 0, 0]
})

# 使用 category_encoders 库
target_encoder = TargetEncoder(cols=['city', 'category'], smoothing=1.0)
data_target_encoded = target_encoder.fit_transform(
    data_with_target[['city', 'category']],
    data_with_target['target']
)

print("Target Encoding 结果：")
print(pd.concat([data_with_target, data_target_encoded.add_suffix('_encoded')], axis=1))

# 手动实现带平滑的 Target Encoding
def target_encode_smooth(df, col, target, smoothing=10):
    """
    带平滑的目标编码
    smoothing: 平滑参数，值越大越接近全局均值
    """
    global_mean = df[target].mean()
    agg = df.groupby(col)[target].agg(['mean', 'count'])

    # 贝叶斯平滑
    smooth_mean = (agg['count'] * agg['mean'] + smoothing * global_mean) / (agg['count'] + smoothing)

    return df[col].map(smooth_mean)

data_with_target['city_target_manual'] = target_encode_smooth(
    data_with_target, 'city', 'target', smoothing=5
)
```

### Frequency Encoding（频率编码）

用类别出现的频率替换类别值。

```python
def frequency_encoding(df, col):
    """频率编码"""
    freq = df[col].value_counts(normalize=True)
    return df[col].map(freq)

data_with_target['city_freq'] = frequency_encoding(data_with_target, 'city')

print("频率编码结果：")
print(data_with_target[['city', 'city_freq']])
```

### Binary Encoding（二进制编码）

将类别先转换为整数，再转换为二进制表示，适用于高基数特征。

```python
from category_encoders import BinaryEncoder

# 二进制编码
binary_encoder = BinaryEncoder(cols=['city'])
data_binary = binary_encoder.fit_transform(data_with_target[['city']])

print("二进制编码结果：")
print(data_binary)
```

### Embedding（嵌入编码）

使用神经网络学习类别的低维表示，适用于深度学习模型。

```python
import torch
import torch.nn as nn

# 定义 Embedding 层
num_categories = 4  # 类别数量
embedding_dim = 3   # 嵌入维度

# PyTorch Embedding
embedding = nn.Embedding(num_categories, embedding_dim)

# 类别索引
category_indices = torch.LongTensor([0, 1, 2, 3, 0, 1])

# 获取嵌入向量
embedded = embedding(category_indices)
print("Embedding 结果：")
print(embedded)

# 在 Keras/TensorFlow 中
"""
from tensorflow.keras.layers import Embedding

embedding_layer = Embedding(
    input_dim=num_categories,
    output_dim=embedding_dim,
    input_length=1
)
"""
```

### 类别编码方法对比

| 编码方法 | 优点 | 缺点 | 适用场景 |
|---------|------|------|---------|
| Label Encoding | 简单、不增加维度 | 引入虚假顺序 | 有序类别、树模型 |
| One-Hot | 无顺序假设 | 高维稀疏 | 低基数无序类别 |
| Target Encoding | 考虑目标信息 | 可能过拟合 | 高基数类别 |
| Frequency | 简单、信息丰富 | 不区分同频类别 | 中等基数 |
| Binary | 维度适中 | 不够直观 | 高基数类别 |
| Embedding | 可学习表示 | 需要训练 | 深度学习 |

## 文本特征提取

文本数据是非结构化数据中最常见的类型。将文本转换为数值特征是NLP任务的基础。

### 词袋模型（Bag of Words）

最简单的文本特征提取方法，统计每个词的出现次数。

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

# 示例文本
documents = [
    '机器学习是人工智能的一个分支',
    '深度学习是机器学习的子领域',
    '自然语言处理使用机器学习技术',
    '计算机视觉和自然语言处理都是人工智能应用'
]

# 词袋模型
count_vectorizer = CountVectorizer()
bow_matrix = count_vectorizer.fit_transform(documents)

print("词汇表：")
print(count_vectorizer.get_feature_names_out())
print("\n词袋矩阵：")
print(bow_matrix.toarray())

# 设置参数
count_vectorizer_custom = CountVectorizer(
    max_features=100,      # 最大特征数
    min_df=2,              # 最小文档频率
    max_df=0.8,            # 最大文档频率（过滤高频词）
    ngram_range=(1, 2),    # 使用 unigram 和 bigram
    stop_words=None        # 停用词（中文需自定义）
)
```

### TF-IDF 特征

TF-IDF（词频-逆文档频率）考虑了词的重要性，降低常见词的权重。

$$\text{TF-IDF}(t, d) = \text{TF}(t, d) \times \text{IDF}(t)$$

其中：
- TF(t, d) = 词 t 在文档 d 中的频率
- IDF(t) = log(文档总数 / 包含词 t 的文档数)

```python
# TF-IDF 特征提取
tfidf_vectorizer = TfidfVectorizer(
    max_features=1000,
    min_df=2,
    max_df=0.85,
    ngram_range=(1, 2),
    sublinear_tf=True,     # 使用 1 + log(TF)
    norm='l2'              # L2 归一化
)

tfidf_matrix = tfidf_vectorizer.fit_transform(documents)

print("TF-IDF 特征矩阵形状:", tfidf_matrix.shape)
print("\nTF-IDF 矩阵：")
tfidf_df = pd.DataFrame(
    tfidf_matrix.toarray(),
    columns=tfidf_vectorizer.get_feature_names_out()
)
print(tfidf_df)

# 获取每个文档的关键词
def get_top_keywords(tfidf_matrix, feature_names, doc_index, top_n=5):
    """获取文档的 Top N 关键词"""
    row = tfidf_matrix[doc_index].toarray()[0]
    top_indices = row.argsort()[-top_n:][::-1]
    return [(feature_names[i], row[i]) for i in top_indices]

feature_names = tfidf_vectorizer.get_feature_names_out()
for i, doc in enumerate(documents):
    keywords = get_top_keywords(tfidf_matrix, feature_names, i)
    print(f"\n文档 {i+1} 关键词: {keywords}")
```

### Word2Vec 词向量

Word2Vec 学习词的分布式表示，能够捕捉词之间的语义关系。

```python
from gensim.models import Word2Vec
import jieba

# 中文分词
def tokenize(text):
    return list(jieba.cut(text))

# 分词处理
tokenized_docs = [tokenize(doc) for doc in documents]
print("分词结果：")
for tokens in tokenized_docs:
    print(tokens)

# 训练 Word2Vec 模型
word2vec_model = Word2Vec(
    sentences=tokenized_docs,
    vector_size=100,       # 词向量维度
    window=5,              # 上下文窗口大小
    min_count=1,           # 最小词频
    workers=4,             # 并行训练线程数
    sg=1,                  # 1=Skip-gram, 0=CBOW
    epochs=100
)

# 获取词向量
word = '机器学习'
if word in word2vec_model.wv:
    vector = word2vec_model.wv[word]
    print(f"\n'{word}' 的词向量维度: {vector.shape}")
    print(f"词向量前10维: {vector[:10]}")

# 计算词相似度
# word2vec_model.wv.most_similar('机器学习', topn=5)

# 文档向量：词向量的平均
def document_vector(doc, model):
    """通过词向量平均获取文档向量"""
    tokens = tokenize(doc)
    vectors = [model.wv[word] for word in tokens if word in model.wv]
    if vectors:
        return np.mean(vectors, axis=0)
    return np.zeros(model.vector_size)

doc_vectors = np.array([document_vector(doc, word2vec_model) for doc in documents])
print(f"\n文档向量矩阵形状: {doc_vectors.shape}")
```

### 预训练词向量

使用预训练的词向量可以获得更好的语义表示。

```python
# 加载预训练词向量（以 GloVe 为例）
def load_glove_vectors(glove_file, vocab=None):
    """
    加载 GloVe 预训练词向量
    glove_file: GloVe 文件路径
    vocab: 可选，仅加载词汇表中的词
    """
    embeddings = {}
    with open(glove_file, 'r', encoding='utf-8') as f:
        for line in f:
            values = line.split()
            word = values[0]
            if vocab is None or word in vocab:
                vector = np.asarray(values[1:], dtype='float32')
                embeddings[word] = vector
    return embeddings

# 使用 Gensim 加载预训练中文词向量
"""
from gensim.models import KeyedVectors

# 加载腾讯词向量
tencent_vectors = KeyedVectors.load_word2vec_format(
    'tencent-ailab-embedding-zh-d100-v0.2.0-s.txt',
    binary=False
)
"""

# 构建嵌入矩阵（用于深度学习模型）
def build_embedding_matrix(word_index, embeddings, embedding_dim):
    """
    构建嵌入矩阵
    word_index: 词到索引的映射
    embeddings: 预训练词向量字典
    embedding_dim: 嵌入维度
    """
    vocab_size = len(word_index) + 1
    embedding_matrix = np.zeros((vocab_size, embedding_dim))

    for word, idx in word_index.items():
        if word in embeddings:
            embedding_matrix[idx] = embeddings[word]
        else:
            # 未知词使用随机初始化
            embedding_matrix[idx] = np.random.normal(0, 0.1, embedding_dim)

    return embedding_matrix
```

### Transformer Embeddings（BERT等）

使用 BERT 等预训练模型获取上下文相关的词表示。

```python
from transformers import BertTokenizer, BertModel
import torch

# 加载预训练 BERT 模型（中文）
model_name = 'bert-base-chinese'
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertModel.from_pretrained(model_name)

def get_bert_embedding(text, tokenizer, model):
    """
    获取文本的 BERT 嵌入
    返回 [CLS] token 的向量作为句子表示
    """
    # 分词
    inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=512)

    # 获取输出
    with torch.no_grad():
        outputs = model(**inputs)

    # 使用 [CLS] token 的输出作为句子表示
    cls_embedding = outputs.last_hidden_state[:, 0, :]

    # 或使用所有 token 的平均
    # mean_embedding = outputs.last_hidden_state.mean(dim=1)

    return cls_embedding.numpy()

# 获取句子嵌入
text = "机器学习是人工智能的重要分支"
embedding = get_bert_embedding(text, tokenizer, model)
print(f"BERT 嵌入维度: {embedding.shape}")

# 批量处理
def get_bert_embeddings_batch(texts, tokenizer, model, batch_size=32):
    """批量获取 BERT 嵌入"""
    embeddings = []

    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i+batch_size]
        inputs = tokenizer(batch_texts, return_tensors='pt',
                          padding=True, truncation=True, max_length=512)

        with torch.no_grad():
            outputs = model(**inputs)

        batch_embeddings = outputs.last_hidden_state[:, 0, :].numpy()
        embeddings.append(batch_embeddings)

    return np.vstack(embeddings)
```

### 文本特征工程最佳实践

```python
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD

# 完整的文本特征提取流水线
class TextFeatureExtractor:
    def __init__(self, method='tfidf', max_features=5000, n_components=100):
        self.method = method
        self.max_features = max_features
        self.n_components = n_components

    def fit_transform(self, texts):
        if self.method == 'tfidf':
            # TF-IDF + SVD 降维
            self.pipeline = Pipeline([
                ('tfidf', TfidfVectorizer(max_features=self.max_features)),
                ('svd', TruncatedSVD(n_components=self.n_components))
            ])
            return self.pipeline.fit_transform(texts)

        elif self.method == 'word2vec':
            # Word2Vec 平均
            tokenized = [tokenize(text) for text in texts]
            self.w2v_model = Word2Vec(tokenized, vector_size=self.n_components,
                                       min_count=1, epochs=50)
            return np.array([document_vector(text, self.w2v_model) for text in texts])

# 使用示例
extractor = TextFeatureExtractor(method='tfidf', max_features=1000, n_components=50)
text_features = extractor.fit_transform(documents)
print(f"文本特征矩阵形状: {text_features.shape}")
```

## 时间特征提取

时间特征在时序预测、用户行为分析等场景中至关重要。

### 基本时间特征

```python
import pandas as pd
from datetime import datetime

# 创建时间序列数据
dates = pd.date_range('2024-01-01', periods=100, freq='D')
df = pd.DataFrame({
    'date': dates,
    'value': np.random.randn(100).cumsum()
})

# 提取基本时间特征
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month
df['day'] = df['date'].dt.day
df['dayofweek'] = df['date'].dt.dayofweek  # 0=周一
df['dayofyear'] = df['date'].dt.dayofyear
df['weekofyear'] = df['date'].dt.isocalendar().week
df['quarter'] = df['date'].dt.quarter

# 时间部分（如果有时间戳）
# df['hour'] = df['datetime'].dt.hour
# df['minute'] = df['datetime'].dt.minute

print("基本时间特征：")
print(df.head(10))
```

### 周期性特征编码

使用正弦/余弦变换保持周期性特征的连续性。

```python
def cyclical_encoding(value, max_value):
    """
    周期性特征的正弦/余弦编码
    例如：一周7天，12个月等周期性特征
    """
    sin_val = np.sin(2 * np.pi * value / max_value)
    cos_val = np.cos(2 * np.pi * value / max_value)
    return sin_val, cos_val

# 月份周期编码
df['month_sin'], df['month_cos'] = cyclical_encoding(df['month'], 12)

# 星期周期编码
df['dayofweek_sin'], df['dayofweek_cos'] = cyclical_encoding(df['dayofweek'], 7)

# 一年中的天数周期编码
df['dayofyear_sin'], df['dayofyear_cos'] = cyclical_encoding(df['dayofyear'], 365)

print("周期性特征编码：")
print(df[['date', 'month', 'month_sin', 'month_cos']].head(10))
```

### 滞后特征（Lag Features）

滞后特征捕捉时间序列的自相关性。

```python
def create_lag_features(df, column, lags):
    """
    创建滞后特征
    df: DataFrame
    column: 目标列名
    lags: 滞后期数列表
    """
    for lag in lags:
        df[f'{column}_lag_{lag}'] = df[column].shift(lag)
    return df

# 创建滞后特征
df = create_lag_features(df, 'value', [1, 7, 14, 30])

print("滞后特征：")
print(df[['date', 'value', 'value_lag_1', 'value_lag_7']].head(10))
```

### 滑动窗口特征

滑动窗口统计特征捕捉局部趋势和模式。

```python
def create_rolling_features(df, column, windows):
    """
    创建滑动窗口特征
    windows: 窗口大小列表
    """
    for window in windows:
        # 滑动均值
        df[f'{column}_rolling_mean_{window}'] = df[column].rolling(window=window).mean()
        # 滑动标准差
        df[f'{column}_rolling_std_{window}'] = df[column].rolling(window=window).std()
        # 滑动最大值
        df[f'{column}_rolling_max_{window}'] = df[column].rolling(window=window).max()
        # 滑动最小值
        df[f'{column}_rolling_min_{window}'] = df[column].rolling(window=window).min()
    return df

# 创建滑动窗口特征
df = create_rolling_features(df, 'value', [7, 14, 30])

print("滑动窗口特征：")
print(df[['date', 'value', 'value_rolling_mean_7', 'value_rolling_std_7']].head(15))
```

### 时间差特征

```python
# 计算与某个参考日期的时间差
reference_date = pd.Timestamp('2024-01-01')
df['days_since_start'] = (df['date'] - reference_date).dt.days

# 计算与上一条记录的时间差
df['days_since_last'] = df['date'].diff().dt.days

# 是否为特殊日期
df['is_weekend'] = df['dayofweek'].isin([5, 6]).astype(int)
df['is_month_start'] = df['date'].dt.is_month_start.astype(int)
df['is_month_end'] = df['date'].dt.is_month_end.astype(int)
df['is_quarter_start'] = df['date'].dt.is_quarter_start.astype(int)
df['is_quarter_end'] = df['date'].dt.is_quarter_end.astype(int)

print("时间差特征：")
print(df[['date', 'is_weekend', 'is_month_start', 'is_month_end']].head(35))
```

### 完整的时间特征工程

```python
class TimeFeatureExtractor:
    """时间特征提取器"""

    def __init__(self, date_column, value_column=None,
                 lags=None, windows=None):
        self.date_column = date_column
        self.value_column = value_column
        self.lags = lags or [1, 7, 14, 30]
        self.windows = windows or [7, 14, 30]

    def extract_features(self, df):
        df = df.copy()

        # 确保日期列是 datetime 类型
        df[self.date_column] = pd.to_datetime(df[self.date_column])

        # 基本时间特征
        df['year'] = df[self.date_column].dt.year
        df['month'] = df[self.date_column].dt.month
        df['day'] = df[self.date_column].dt.day
        df['dayofweek'] = df[self.date_column].dt.dayofweek
        df['dayofyear'] = df[self.date_column].dt.dayofyear
        df['weekofyear'] = df[self.date_column].dt.isocalendar().week.astype(int)
        df['quarter'] = df[self.date_column].dt.quarter

        # 周期性编码
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        df['dayofweek_sin'] = np.sin(2 * np.pi * df['dayofweek'] / 7)
        df['dayofweek_cos'] = np.cos(2 * np.pi * df['dayofweek'] / 7)

        # 特殊日期标记
        df['is_weekend'] = df['dayofweek'].isin([5, 6]).astype(int)
        df['is_month_start'] = df[self.date_column].dt.is_month_start.astype(int)
        df['is_month_end'] = df[self.date_column].dt.is_month_end.astype(int)

        # 滞后特征和滑动窗口特征（需要值列）
        if self.value_column:
            for lag in self.lags:
                df[f'lag_{lag}'] = df[self.value_column].shift(lag)

            for window in self.windows:
                df[f'rolling_mean_{window}'] = df[self.value_column].rolling(window).mean()
                df[f'rolling_std_{window}'] = df[self.value_column].rolling(window).std()

        return df

# 使用示例
time_extractor = TimeFeatureExtractor(
    date_column='date',
    value_column='value',
    lags=[1, 7, 14],
    windows=[7, 14]
)

df_with_features = time_extractor.extract_features(df)
print(f"时间特征提取后的列: {df_with_features.columns.tolist()}")
```

## 图像特征提取

图像数据的特征提取方法从传统的手工特征到深度学习特征，经历了巨大的演变。

### 传统图像特征

#### 颜色直方图

```python
import cv2
import numpy as np

def extract_color_histogram(image_path, bins=32):
    """
    提取颜色直方图特征
    """
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    features = []
    for i in range(3):  # RGB 三个通道
        hist = cv2.calcHist([image], [i], None, [bins], [0, 256])
        hist = cv2.normalize(hist, hist).flatten()
        features.extend(hist)

    return np.array(features)

# 使用示例
# features = extract_color_histogram('image.jpg')
# print(f"颜色直方图特征维度: {features.shape}")
```

#### HOG 特征（方向梯度直方图）

```python
from skimage.feature import hog
from skimage import io, color

def extract_hog_features(image_path, pixels_per_cell=(8, 8),
                         cells_per_block=(2, 2)):
    """
    提取 HOG 特征
    适用于目标检测和行人识别
    """
    image = io.imread(image_path)
    if len(image.shape) == 3:
        image = color.rgb2gray(image)

    features, hog_image = hog(
        image,
        orientations=9,
        pixels_per_cell=pixels_per_cell,
        cells_per_block=cells_per_block,
        block_norm='L2-Hys',
        visualize=True,
        feature_vector=True
    )

    return features, hog_image

# 使用示例
# features, hog_img = extract_hog_features('image.jpg')
# print(f"HOG 特征维度: {features.shape}")
```

### CNN 特征提取

使用预训练的 CNN 模型提取图像特征是当前最常用的方法。

```python
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image

class CNNFeatureExtractor:
    """
    使用预训练 CNN 提取图像特征
    """

    def __init__(self, model_name='resnet50', layer='avgpool'):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        # 加载预训练模型
        if model_name == 'resnet50':
            self.model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
            self.feature_dim = 2048
        elif model_name == 'vgg16':
            self.model = models.vgg16(weights=models.VGG16_Weights.IMAGENET1K_V1)
            self.feature_dim = 4096
        elif model_name == 'efficientnet_b0':
            self.model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
            self.feature_dim = 1280

        # 移除分类层
        if model_name in ['resnet50']:
            self.model = torch.nn.Sequential(*list(self.model.children())[:-1])

        self.model = self.model.to(self.device)
        self.model.set_training_mode(False)

        # 图像预处理
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def extract(self, image_path):
        """提取单张图像的特征"""
        image = Image.open(image_path).convert('RGB')
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            features = self.model(image_tensor)

        return features.squeeze().cpu().numpy()

    def extract_batch(self, image_paths, batch_size=32):
        """批量提取图像特征"""
        features = []

        for i in range(0, len(image_paths), batch_size):
            batch_paths = image_paths[i:i+batch_size]
            batch_images = []

            for path in batch_paths:
                image = Image.open(path).convert('RGB')
                image_tensor = self.transform(image)
                batch_images.append(image_tensor)

            batch_tensor = torch.stack(batch_images).to(self.device)

            with torch.no_grad():
                batch_features = self.model(batch_tensor)

            features.append(batch_features.squeeze().cpu().numpy())

        return np.vstack(features)

# 使用示例
"""
extractor = CNNFeatureExtractor(model_name='resnet50')
features = extractor.extract('image.jpg')
print(f"CNN 特征维度: {features.shape}")

# 批量提取
image_paths = ['img1.jpg', 'img2.jpg', 'img3.jpg']
batch_features = extractor.extract_batch(image_paths)
print(f"批量特征矩阵形状: {batch_features.shape}")
"""
```

### Vision Transformer 特征

```python
from transformers import ViTModel, ViTImageProcessor
import torch
from PIL import Image

class ViTFeatureExtractor:
    """
    使用 Vision Transformer 提取图像特征
    """

    def __init__(self, model_name='google/vit-base-patch16-224'):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.processor = ViTImageProcessor.from_pretrained(model_name)
        self.model = ViTModel.from_pretrained(model_name).to(self.device)
        self.model.requires_grad_(False)

    def extract(self, image_path):
        """提取图像特征"""
        image = Image.open(image_path).convert('RGB')
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)

        with torch.no_grad():
            outputs = self.model(**inputs)

        # 使用 [CLS] token 作为图像表示
        features = outputs.last_hidden_state[:, 0, :]
        return features.squeeze().cpu().numpy()

# 使用示例
"""
vit_extractor = ViTFeatureExtractor()
features = vit_extractor.extract('image.jpg')
print(f"ViT 特征维度: {features.shape}")
"""
```

## 特征组合与交叉

特征组合可以捕捉特征之间的交互效应，提升模型表达能力。

### 数值特征组合

```python
def create_numeric_combinations(df, numeric_cols):
    """
    创建数值特征的组合
    """
    df = df.copy()

    for i, col1 in enumerate(numeric_cols):
        for col2 in numeric_cols[i+1:]:
            # 加法
            df[f'{col1}_plus_{col2}'] = df[col1] + df[col2]
            # 减法
            df[f'{col1}_minus_{col2}'] = df[col1] - df[col2]
            # 乘法
            df[f'{col1}_times_{col2}'] = df[col1] * df[col2]
            # 除法（避免除零）
            df[f'{col1}_div_{col2}'] = df[col1] / (df[col2] + 1e-8)

    return df

# 示例
data = pd.DataFrame({
    'height': [170, 175, 160, 180],
    'weight': [65, 70, 55, 80],
    'age': [25, 30, 28, 35]
})

data_combined = create_numeric_combinations(data, ['height', 'weight', 'age'])

# BMI 计算（常见的领域知识特征）
data['bmi'] = data['weight'] / (data['height'] / 100) ** 2
print(data)
```

### 类别特征交叉

```python
def create_categorical_crosses(df, cat_cols):
    """
    创建类别特征的交叉
    """
    df = df.copy()

    for i, col1 in enumerate(cat_cols):
        for col2 in cat_cols[i+1:]:
            df[f'{col1}_x_{col2}'] = df[col1].astype(str) + '_' + df[col2].astype(str)

    return df

# 示例
data = pd.DataFrame({
    'city': ['北京', '上海', '广州', '北京'],
    'category': ['电子', '服装', '食品', '电子'],
    'channel': ['线上', '线下', '线上', '线下']
})

data_crossed = create_categorical_crosses(data, ['city', 'category', 'channel'])
print(data_crossed)
```

### 数值-类别交叉

```python
def create_numeric_categorical_features(df, numeric_col, cat_col):
    """
    创建数值特征与类别特征的交叉统计
    """
    df = df.copy()

    # 按类别的统计特征
    agg = df.groupby(cat_col)[numeric_col].agg(['mean', 'std', 'min', 'max'])
    agg.columns = [f'{numeric_col}_{cat_col}_{stat}' for stat in agg.columns]

    df = df.merge(agg, left_on=cat_col, right_index=True, how='left')

    # 与类别均值的差异
    df[f'{numeric_col}_diff_from_{cat_col}_mean'] = (
        df[numeric_col] - df[f'{numeric_col}_{cat_col}_mean']
    )

    return df

# 示例
data = pd.DataFrame({
    'city': ['北京', '上海', '广州', '北京', '上海'],
    'sales': [1000, 1500, 800, 1200, 1600]
})

data_with_cross = create_numeric_categorical_features(data, 'sales', 'city')
print(data_with_cross)
```

## Scikit-learn 特征工程管道

### ColumnTransformer 综合处理

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif

# 创建综合数据
data = pd.DataFrame({
    'age': [25, 30, None, 40, 45],
    'income': [30000, 50000, 45000, None, 80000],
    'city': ['北京', '上海', '广州', '深圳', '北京'],
    'education': ['本科', '硕士', '博士', '本科', '硕士'],
    'target': [0, 1, 1, 0, 1]
})

# 定义特征列
numeric_features = ['age', 'income']
categorical_features = ['city']
ordinal_features = ['education']

# 数值特征处理管道
numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

# 类别特征处理管道
categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

# 有序特征处理管道
ordinal_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('ordinal', OrdinalEncoder(categories=[['本科', '硕士', '博士']]))
])

# 组合所有处理器
preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features),
        ('ord', ordinal_transformer, ordinal_features)
    ],
    remainder='drop'  # 或 'passthrough' 保留其他列
)

# 应用预处理
X = data.drop('target', axis=1)
y = data['target']
X_transformed = preprocessor.fit_transform(X)

print(f"处理后的特征矩阵形状: {X_transformed.shape}")
print(f"特征名称: {preprocessor.get_feature_names_out()}")
```

### 自定义 Transformer

```python
from sklearn.base import BaseEstimator, TransformerMixin

class DateTimeFeatureExtractor(BaseEstimator, TransformerMixin):
    """
    自定义日期时间特征提取器
    """

    def __init__(self, date_column, drop_original=True):
        self.date_column = date_column
        self.drop_original = drop_original

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()

        # 确保是 datetime 类型
        X[self.date_column] = pd.to_datetime(X[self.date_column])

        # 提取时间特征
        X['year'] = X[self.date_column].dt.year
        X['month'] = X[self.date_column].dt.month
        X['day'] = X[self.date_column].dt.day
        X['dayofweek'] = X[self.date_column].dt.dayofweek
        X['is_weekend'] = X['dayofweek'].isin([5, 6]).astype(int)

        # 周期性编码
        X['month_sin'] = np.sin(2 * np.pi * X['month'] / 12)
        X['month_cos'] = np.cos(2 * np.pi * X['month'] / 12)

        if self.drop_original:
            X = X.drop(columns=[self.date_column])

        return X

    def get_feature_names_out(self, input_features=None):
        return ['year', 'month', 'day', 'dayofweek', 'is_weekend',
                'month_sin', 'month_cos']


class TextTfidfExtractor(BaseEstimator, TransformerMixin):
    """
    自定义文本 TF-IDF 特征提取器
    """

    def __init__(self, text_column, max_features=1000):
        self.text_column = text_column
        self.max_features = max_features
        self.vectorizer = TfidfVectorizer(max_features=max_features)

    def fit(self, X, y=None):
        self.vectorizer.fit(X[self.text_column])
        return self

    def transform(self, X):
        tfidf_features = self.vectorizer.transform(X[self.text_column])
        feature_names = [f'tfidf_{name}' for name in
                        self.vectorizer.get_feature_names_out()]
        return pd.DataFrame(
            tfidf_features.toarray(),
            columns=feature_names,
            index=X.index
        )


# 使用自定义 Transformer
datetime_extractor = DateTimeFeatureExtractor(date_column='date')
# text_extractor = TextTfidfExtractor(text_column='description', max_features=500)
```

### 完整的特征工程管道示例

```python
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_validate

def create_full_pipeline():
    """
    创建完整的特征工程和模型训练管道
    """

    # 数值特征处理
    numeric_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
    ])

    # 类别特征处理
    categorical_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    # 预处理器
    preprocessor = ColumnTransformer([
        ('num', numeric_transformer, ['age', 'income']),
        ('cat', categorical_transformer, ['city', 'category'])
    ])

    # 完整管道
    full_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('feature_selection', SelectKBest(f_classif, k=10)),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])

    return full_pipeline

# 使用示例
"""
pipeline = create_full_pipeline()
cv_results = cross_validate(pipeline, X, y, cv=5, scoring='accuracy')
print(f"交叉验证准确率: {cv_results['test_score'].mean():.4f} (+/- {cv_results['test_score'].std() * 2:.4f})")
"""
```

## 特征选择与降维

### 基于统计的特征选择

```python
from sklearn.feature_selection import (
    SelectKBest, f_classif, mutual_info_classif,
    SelectPercentile, VarianceThreshold
)

# 方差阈值选择（移除低方差特征）
variance_selector = VarianceThreshold(threshold=0.01)
X_high_variance = variance_selector.fit_transform(X_transformed)

# 基于统计检验选择（分类问题）
k_best_f = SelectKBest(score_func=f_classif, k=10)
X_kbest = k_best_f.fit_transform(X_transformed, y)

# 基于互信息选择
k_best_mi = SelectKBest(score_func=mutual_info_classif, k=10)
X_mi = k_best_mi.fit_transform(X_transformed, y)

print(f"选择后的特征数量: {X_kbest.shape[1]}")
```

### 基于模型的特征选择

```python
from sklearn.feature_selection import SelectFromModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LassoCV

# 基于树模型的特征重要性
rf_selector = SelectFromModel(
    RandomForestClassifier(n_estimators=100, random_state=42),
    threshold='median'
)
X_rf_selected = rf_selector.fit_transform(X_transformed, y)

# 基于 L1 正则化（Lasso）的特征选择
lasso_selector = SelectFromModel(
    LassoCV(cv=5, random_state=42),
    threshold=1e-5
)
# X_lasso_selected = lasso_selector.fit_transform(X_transformed, y)

# 查看被选中的特征
selected_mask = rf_selector.get_support()
print(f"选中的特征数量: {selected_mask.sum()}")
```

### 降维技术

```python
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.manifold import TSNE
import umap

# PCA 降维
pca = PCA(n_components=0.95)  # 保留 95% 方差
X_pca = pca.fit_transform(X_transformed)
print(f"PCA 后维度: {X_pca.shape[1]}")
print(f"解释方差比例: {pca.explained_variance_ratio_.sum():.4f}")

# SVD 降维（适用于稀疏矩阵）
svd = TruncatedSVD(n_components=50)
X_svd = svd.fit_transform(X_transformed)

# t-SNE 降维（用于可视化）
tsne = TSNE(n_components=2, random_state=42, perplexity=30)
X_tsne = tsne.fit_transform(X_transformed)

# UMAP 降维（速度更快，效果更好）
# reducer = umap.UMAP(n_components=2, random_state=42)
# X_umap = reducer.fit_transform(X_transformed)
```

## 实战案例：完整特征工程流程

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_validate
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report, roc_auc_score

class FeatureEngineeringPipeline:
    """
    完整的特征工程流水线
    """

    def __init__(self, numeric_features, categorical_features,
                 ordinal_features=None, text_features=None,
                 date_features=None):
        self.numeric_features = numeric_features
        self.categorical_features = categorical_features
        self.ordinal_features = ordinal_features or []
        self.text_features = text_features or []
        self.date_features = date_features or []
        self.preprocessor = None

    def _create_preprocessor(self):
        """创建预处理管道"""
        transformers = []

        # 数值特征处理
        if self.numeric_features:
            numeric_transformer = Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ])
            transformers.append(('num', numeric_transformer, self.numeric_features))

        # 类别特征处理
        if self.categorical_features:
            categorical_transformer = Pipeline([
                ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])
            transformers.append(('cat', categorical_transformer, self.categorical_features))

        self.preprocessor = ColumnTransformer(transformers, remainder='drop')
        return self.preprocessor

    def fit_transform(self, X, y=None):
        """拟合并转换数据"""
        if self.preprocessor is None:
            self._create_preprocessor()

        X_transformed = self.preprocessor.fit_transform(X)

        # 获取特征名称
        self.feature_names = self.preprocessor.get_feature_names_out()

        return X_transformed

    def transform(self, X):
        """转换新数据"""
        return self.preprocessor.transform(X)

    def get_feature_names(self):
        """获取特征名称"""
        return self.feature_names


# 使用示例
def run_feature_engineering_example():
    """运行特征工程示例"""

    # 1. 创建模拟数据
    np.random.seed(42)
    n_samples = 1000

    data = pd.DataFrame({
        'age': np.random.randint(18, 70, n_samples),
        'income': np.random.exponential(50000, n_samples),
        'credit_score': np.random.randint(300, 850, n_samples),
        'employment_years': np.random.randint(0, 40, n_samples),
        'city': np.random.choice(['北京', '上海', '广州', '深圳', '成都'], n_samples),
        'education': np.random.choice(['高中', '本科', '硕士', '博士'], n_samples),
        'loan_type': np.random.choice(['房贷', '车贷', '消费贷'], n_samples),
        'target': np.random.binomial(1, 0.3, n_samples)
    })

    # 添加一些缺失值
    data.loc[np.random.choice(data.index, 50), 'income'] = np.nan
    data.loc[np.random.choice(data.index, 30), 'credit_score'] = np.nan

    print("=== 原始数据 ===")
    print(data.head())
    print(f"\n数据形状: {data.shape}")
    print(f"缺失值:\n{data.isnull().sum()}")

    # 2. 特征工程
    X = data.drop('target', axis=1)
    y = data['target']

    # 划分数据集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 创建特征工程管道
    feature_pipeline = FeatureEngineeringPipeline(
        numeric_features=['age', 'income', 'credit_score', 'employment_years'],
        categorical_features=['city', 'education', 'loan_type']
    )

    # 转换数据
    X_train_transformed = feature_pipeline.fit_transform(X_train)
    X_test_transformed = feature_pipeline.transform(X_test)

    print(f"\n=== 特征工程后 ===")
    print(f"训练集形状: {X_train_transformed.shape}")
    print(f"测试集形状: {X_test_transformed.shape}")
    print(f"特征名称: {feature_pipeline.get_feature_names()[:10]}...")  # 显示前10个

    # 3. 模型训练与评估
    model = GradientBoostingClassifier(n_estimators=100, random_state=42)

    # 交叉验证
    cv_results = cross_validate(model, X_train_transformed, y_train, cv=5, scoring='roc_auc')
    print(f"\n=== 模型评估 ===")
    print(f"交叉验证 AUC: {cv_results['test_score'].mean():.4f} (+/- {cv_results['test_score'].std() * 2:.4f})")

    # 在测试集上评估
    model.fit(X_train_transformed, y_train)
    y_pred = model.predict(X_test_transformed)
    y_prob = model.predict_proba(X_test_transformed)[:, 1]

    print(f"\n测试集 AUC: {roc_auc_score(y_test, y_prob):.4f}")
    print("\n分类报告:")
    print(classification_report(y_test, y_pred))

    return model, feature_pipeline

# 运行示例
# model, pipeline = run_feature_engineering_example()
```

## 面试要点

### 常见面试问题

**Q1: 为什么要进行特征标准化？什么情况下不需要？**

标准化的作用：
- 加速梯度下降收敛
- 防止某些特征因数值范围大而主导模型
- 某些算法（如SVM、KNN）对特征尺度敏感

不需要标准化的情况：
- 树模型（决策树、随机森林、XGBoost）对特征尺度不敏感
- 已经在同一尺度的特征

**Q2: One-Hot 编码的优缺点是什么？高基数类别如何处理？**

优点：
- 无顺序假设
- 适合大多数算法

缺点：
- 高基数导致维度爆炸
- 稀疏矩阵

高基数处理方法：
- Target Encoding
- Frequency Encoding
- Binary Encoding
- Embedding（深度学习）
- 保留 Top N 类别

**Q3: TF-IDF 和 Word2Vec 的区别是什么？**

| 特性 | TF-IDF | Word2Vec |
|------|--------|----------|
| 表示类型 | 稀疏向量 | 稠密向量 |
| 语义信息 | 基于统计 | 捕捉语义 |
| 维度 | 词汇表大小 | 可设置（如100-300） |
| 训练数据 | 当前语料 | 需要大量语料 |
| 上下文 | 不考虑 | 考虑（CBOW/Skip-gram） |

**Q4: 如何处理时间序列中的数据泄露问题？**

- 滞后特征只能使用过去的数据
- 滑动窗口不能包含未来数据
- 交叉验证使用时间序列切分
- 特征工程在数据划分后进行

**Q5: 特征选择和降维的区别是什么？**

- **特征选择**：从原始特征中选择子集，保持特征的原始含义
- **降维**：将特征投影到低维空间，生成新特征

### 最佳实践总结

1. **理解业务**：领域知识是好特征的来源
2. **探索数据**：先做 EDA，了解数据分布和关系
3. **处理缺失值**：根据缺失机制选择合适的方法
4. **选择合适的编码**：根据特征类型和模型选择
5. **避免数据泄露**：特征工程在数据划分后进行
6. **使用 Pipeline**：保证训练和预测的一致性
7. **特征重要性分析**：理解哪些特征对模型有贡献
8. **迭代优化**：特征工程是迭代过程

## 延伸阅读

### 推荐书籍

- **《Feature Engineering for Machine Learning》** - Alice Zheng & Amanda Casari
- **《Python Feature Engineering Cookbook》** - Soledad Galli
- **《机器学习实战》** - 特征工程章节

### 在线资源

- [Scikit-learn 预处理文档](https://scikit-learn.org/stable/modules/preprocessing.html)
- [Category Encoders 文档](https://contrib.scikit-learn.org/category_encoders/)
- [Kaggle 特征工程教程](https://www.kaggle.com/learn/feature-engineering)
- [Feature Engine 库](https://feature-engine.readthedocs.io/)

### 进阶主题

- **自动特征工程**：Featuretools、AutoFeat
- **特征存储**：Feast、Tecton
- **深度特征合成**：DFS算法
- **图特征工程**：Node2Vec、GraphSAGE

## 总结

特征提取是机器学习中最重要的环节之一。本文系统介绍了各类数据的特征提取方法：

1. **数值特征**：标准化、归一化、分箱、多项式特征
2. **类别特征**：One-Hot、Label、Target、Embedding 编码
3. **文本特征**：词袋模型、TF-IDF、Word2Vec、BERT
4. **时间特征**：周期编码、滞后特征、滑动窗口
5. **图像特征**：传统特征、CNN特征、ViT特征
6. **特征组合**：数值组合、类别交叉、数值-类别交互

掌握特征提取技术需要：
- 扎实的统计和机器学习基础
- 对业务场景的深入理解
- 大量的实践经验积累
- 持续学习最新技术发展

好的特征工程往往比模型选择更能提升最终效果。希望本文能帮助你在特征工程的道路上走得更远。
