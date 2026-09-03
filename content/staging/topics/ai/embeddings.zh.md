---
title: 向量嵌入
description: 理解和使用向量嵌入进行语义搜索
track: ai
section: rag
difficulty: intermediate
tags:
  - 嵌入
  - 向量
  - 语义搜索
  - 相似度
status: imported
origin: old/src/content/docs/ai/embeddings.zh.md
divergence: 0.417
issues:
  - divergent
legacy:
  category: AI
  subcategory: NLP
  order: 27
  lastUpdated: 2026-01-07
---

向量嵌入（Embedding）是将文本、图像、音频等高维离散数据转换为低维连续向量表示的技术。嵌入向量能够捕捉数据的语义信息，使得语义相近的内容在向量空间中距离更近。嵌入技术是现代 NLP、推荐系统和语义搜索的核心基础，是每个 AI 工程师必须掌握的关键技术。

---

## 嵌入核心概念

### 什么是向量嵌入？

向量嵌入是一种将离散对象（如单词、句子、文档）映射到连续向量空间的技术。每个对象被表示为一个固定维度的实数向量，这些向量能够捕捉对象之间的语义关系。

**核心思想**：语义相近的内容在向量空间中距离更近。

```
"国王" -> [0.2, -0.4, 0.7, ...]
"王后" -> [0.3, -0.3, 0.6, ...]  # 与"国王"距离近
"汽车" -> [-0.5, 0.8, -0.2, ...] # 与"国王"距离远
```

### 嵌入的数学本质

嵌入本质上是一个映射函数 $f: X \rightarrow \mathbb{R}^d$，将输入空间 $X$ 映射到 $d$ 维实数向量空间。

**关键特性**：
- **稠密表示**：与稀疏的 one-hot 编码不同，嵌入是稠密的低维向量
- **语义编码**：向量的每个维度编码了某种语义特征
- **距离有意义**：向量间的距离反映了语义相似度

### 从 One-Hot 到 Embedding

| 特性 | One-Hot 编码 | 嵌入向量 |
|------|-------------|----------|
| 维度 | 词汇表大小（通常数万） | 固定维度（如 768、1024） |
| 表示方式 | 稀疏（只有一个 1） | 稠密（所有维度都有值） |
| 语义信息 | 无（正交向量） | 有（语义相近的向量接近） |
| 计算效率 | 低（高维稀疏） | 高（低维稠密） |

```python
import numpy as np

# One-Hot 编码示例（词汇表大小为 10000）
one_hot = np.zeros(10000)
one_hot[42] = 1  # "国王"的索引

# 嵌入向量示例（维度为 768）
embedding = np.array([0.2, -0.4, 0.7, ..., 0.1])  # 768 维稠密向量
```

### 嵌入的历史演进

1. **Word2Vec（2013）**
   - Google 提出，开创词向量先河
   - CBOW 和 Skip-gram 两种架构
   - 首次大规模验证"语义算术"：king - man + woman = queen

2. **GloVe（2014）**
   - Stanford 提出
   - 结合全局统计信息和局部上下文
   - 通过词共现矩阵分解学习

3. **FastText（2016）**
   - Facebook 提出
   - 考虑子词信息，处理未登录词
   - 对形态丰富的语言效果更好

4. **BERT/Transformer 嵌入（2018+）**
   - 上下文相关的动态嵌入
   - 同一个词在不同语境中有不同表示
   - 当前主流方案

---

## 文本嵌入模型

### OpenAI Embeddings

OpenAI 提供了高质量的文本嵌入 API，是商用场景的首选：

```python
from openai import OpenAI
from typing import List
import numpy as np

client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> List[float]:
    """获取单个文本的嵌入向量"""
    response = client.embeddings.create(
        input=text,
        model=model
    )
    return response.data[0].embedding

def get_embeddings_batch(texts: List[str], model: str = "text-embedding-3-small") -> np.ndarray:
    """批量获取嵌入向量"""
    response = client.embeddings.create(
        input=texts,
        model=model
    )
    return np.array([item.embedding for item in response.data])

# 使用示例
text = "机器学习是人工智能的一个分支"
embedding = get_embedding(text)
print(f"嵌入维度: {len(embedding)}")  # text-embedding-3-small: 1536
```

**OpenAI 嵌入模型对比**：

| 模型 | 维度 | 最大输入 | 特点 | 价格 |
|------|------|---------|------|------|
| text-embedding-3-small | 1536 | 8191 tokens | 性价比高 | $0.02/1M tokens |
| text-embedding-3-large | 3072 | 8191 tokens | 精度最高 | $0.13/1M tokens |
| text-embedding-ada-002 | 1536 | 8191 tokens | 旧版本 | $0.10/1M tokens |

**降维功能**：

```python
# text-embedding-3 系列支持降维
response = client.embeddings.create(
    input="你好世界",
    model="text-embedding-3-small",
    dimensions=256  # 将 1536 维降到 256 维
)
embedding = response.data[0].embedding
print(f"降维后维度: {len(embedding)}")  # 256
```

### Sentence-Transformers

Sentence-Transformers 是最流行的开源文本嵌入库，基于 Hugging Face Transformers：

```python
from sentence_transformers import SentenceTransformer
import numpy as np

# 加载模型
model = SentenceTransformer('all-MiniLM-L6-v2')  # 英文模型
# model = SentenceTransformer('BAAI/bge-large-zh-v1.5')  # 中文模型
# model = SentenceTransformer('BAAI/bge-m3')  # 多语言模型

# 生成嵌入
sentences = [
    "机器学习是人工智能的核心技术",
    "深度学习使用神经网络处理数据",
    "今天天气真不错"
]

embeddings = model.encode(sentences)
print(f"嵌入形状: {embeddings.shape}")  # (3, 384)

# 计算相似度
from sentence_transformers import util
cosine_scores = util.cos_sim(embeddings[0], embeddings[1:])
print(f"与第一句的相似度: {cosine_scores}")
```

**常用中文模型推荐**：

| 模型 | 维度 | 特点 | 推荐场景 |
|------|------|------|---------|
| BAAI/bge-large-zh-v1.5 | 1024 | 中文 SOTA | 中文语义搜索 |
| BAAI/bge-base-zh-v1.5 | 768 | 性能均衡 | 通用场景 |
| BAAI/bge-small-zh-v1.5 | 512 | 轻量快速 | 资源受限场景 |
| BAAI/bge-m3 | 1024 | 多语言支持 | 跨语言搜索 |
| moka-ai/m3e-large | 1024 | 中文优化 | 中文场景 |
| shibing624/text2vec-base-chinese | 768 | 通用文本 | 文本匹配 |

### BGE 系列模型详解

BGE（BAAI General Embedding）是目前最强的开源嵌入模型之一：

```python
from sentence_transformers import SentenceTransformer

# BGE 模型使用查询前缀以获得更好效果
model = SentenceTransformer('BAAI/bge-large-zh-v1.5')

# 对于检索场景，查询需要添加特定前缀
def encode_query(query: str) -> np.ndarray:
    """编码查询文本"""
    # BGE 推荐的查询前缀
    instruction = "为这个句子生成表示以用于检索相关文章："
    return model.encode(instruction + query)

def encode_documents(documents: List[str]) -> np.ndarray:
    """编码文档文本（无需前缀）"""
    return model.encode(documents)

# 使用示例
query = "什么是向量数据库？"
documents = [
    "向量数据库是专门用于存储和检索高维向量的数据库系统",
    "关系型数据库使用表格存储结构化数据",
    "今天的股票市场表现不错"
]

query_embedding = encode_query(query)
doc_embeddings = encode_documents(documents)

# 计算相似度
similarities = np.dot(doc_embeddings, query_embedding)
print(f"相似度: {similarities}")
```

### 多模态嵌入

现代嵌入模型也支持图像、音频等多模态数据：

```python
from sentence_transformers import SentenceTransformer
from PIL import Image

# 多模态模型：CLIP
model = SentenceTransformer('clip-ViT-B-32')

# 文本嵌入
texts = ["一只可爱的猫", "一辆红色的汽车"]
text_embeddings = model.encode(texts)

# 图像嵌入
images = [Image.open("cat.jpg"), Image.open("car.jpg")]
image_embeddings = model.encode(images)

# 跨模态相似度计算
from sentence_transformers import util
cross_similarities = util.cos_sim(text_embeddings, image_embeddings)
print(f"文本-图像相似度矩阵:\n{cross_similarities}")
```

---

## 相似度度量

选择合适的相似度度量方法对嵌入检索效果至关重要。

### 余弦相似度（Cosine Similarity）

最常用的文本相似度度量，测量两个向量方向的相似性：

$$\text{cosine}(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a} \cdot \mathbf{b}}{||\mathbf{a}|| \cdot ||\mathbf{b}||} = \frac{\sum_{i=1}^{n} a_i b_i}{\sqrt{\sum_{i=1}^{n} a_i^2} \cdot \sqrt{\sum_{i=1}^{n} b_i^2}}$$

```python
import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """计算余弦相似度"""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# 使用示例
vec1 = np.array([1, 2, 3])
vec2 = np.array([4, 5, 6])
similarity = cosine_similarity(vec1, vec2)
print(f"余弦相似度: {similarity:.4f}")  # 0.9746

# 批量计算
def cosine_similarity_matrix(embeddings: np.ndarray) -> np.ndarray:
    """计算嵌入矩阵的余弦相似度矩阵"""
    # 归一化
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normalized = embeddings / norms
    # 矩阵乘法得到相似度矩阵
    return np.dot(normalized, normalized.T)
```

**特点**：
- 值域：[-1, 1]，1 表示完全相同，-1 表示完全相反
- 对向量长度不敏感，只考虑方向
- 适合文本嵌入比较

### 欧氏距离（Euclidean Distance）

测量两个向量在空间中的直线距离：

$$d(\mathbf{a}, \mathbf{b}) = ||\mathbf{a} - \mathbf{b}|| = \sqrt{\sum_{i=1}^{n} (a_i - b_i)^2}$$

```python
def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    """计算欧氏距离"""
    return np.linalg.norm(a - b)

# 转换为相似度（距离越小，相似度越高）
def euclidean_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """将欧氏距离转换为相似度"""
    return 1 / (1 + euclidean_distance(a, b))
```

**特点**：
- 值域：[0, +∞)
- 对向量长度敏感
- 适合经过 L2 归一化的嵌入

### 点积（Dot Product）

最简单高效的相似度计算：

$$\text{dot}(\mathbf{a}, \mathbf{b}) = \mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{n} a_i b_i$$

```python
def dot_product(a: np.ndarray, b: np.ndarray) -> float:
    """计算点积"""
    return np.dot(a, b)

# 对于归一化的向量，点积等于余弦相似度
normalized_a = a / np.linalg.norm(a)
normalized_b = b / np.linalg.norm(b)
print(np.dot(normalized_a, normalized_b))  # 等于 cosine_similarity
```

**特点**：
- 计算效率最高
- 对于归一化向量，等价于余弦相似度
- 很多嵌入模型输出的就是归一化向量

### 曼哈顿距离（Manhattan Distance）

也称 L1 距离，测量沿坐标轴的总距离：

$$d(\mathbf{a}, \mathbf{b}) = \sum_{i=1}^{n} |a_i - b_i|$$

```python
def manhattan_distance(a: np.ndarray, b: np.ndarray) -> float:
    """计算曼哈顿距离"""
    return np.sum(np.abs(a - b))
```

### 相似度度量选择指南

| 度量方法 | 适用场景 | 是否需要归一化 | 计算效率 |
|---------|---------|--------------|---------|
| 余弦相似度 | 文本语义相似度 | 否 | 中 |
| 点积 | 归一化嵌入 | 是 | 高 |
| 欧氏距离 | 聚类、异常检测 | 推荐 | 中 |
| 曼哈顿距离 | 稀疏向量 | 否 | 中 |

```python
class SimilarityCalculator:
    """相似度计算器"""

    @staticmethod
    def compute(a: np.ndarray, b: np.ndarray, metric: str = "cosine") -> float:
        """统一的相似度计算接口"""
        if metric == "cosine":
            return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
        elif metric == "dot":
            return np.dot(a, b)
        elif metric == "euclidean":
            return 1 / (1 + np.linalg.norm(a - b))
        elif metric == "manhattan":
            return 1 / (1 + np.sum(np.abs(a - b)))
        else:
            raise ValueError(f"不支持的度量方法: {metric}")
```

---

## 嵌入应用场景

### 语义搜索

最常见的嵌入应用，将传统关键词搜索升级为语义理解搜索：

```python
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Tuple

class SemanticSearch:
    """语义搜索引擎"""

    def __init__(self, model_name: str = "BAAI/bge-base-zh-v1.5"):
        self.model = SentenceTransformer(model_name)
        self.documents = []
        self.embeddings = None

    def index(self, documents: List[str]):
        """索引文档"""
        self.documents = documents
        self.embeddings = self.model.encode(documents, normalize_embeddings=True)
        print(f"已索引 {len(documents)} 个文档")

    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """搜索相关文档"""
        # 编码查询
        query_embedding = self.model.encode(query, normalize_embeddings=True)

        # 计算相似度（归一化向量的点积等于余弦相似度）
        similarities = np.dot(self.embeddings, query_embedding)

        # 获取 top-k 结果
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append((self.documents[idx], similarities[idx]))

        return results

# 使用示例
search_engine = SemanticSearch()

documents = [
    "Python 是一种解释型、面向对象的编程语言",
    "机器学习是人工智能的一个子领域",
    "深度学习使用多层神经网络进行学习",
    "自然语言处理研究计算机如何理解人类语言",
    "向量数据库专门用于存储和检索嵌入向量"
]

search_engine.index(documents)

# 搜索
query = "AI 如何理解文本？"
results = search_engine.search(query, top_k=3)

for doc, score in results:
    print(f"[{score:.4f}] {doc}")
```

### 文本聚类

将语义相近的文本自动分组：

```python
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt

class TextClusterer:
    """文本聚类器"""

    def __init__(self, model_name: str = "BAAI/bge-base-zh-v1.5"):
        self.model = SentenceTransformer(model_name)

    def cluster(self, texts: List[str], n_clusters: int = 5) -> np.ndarray:
        """对文本进行聚类"""
        # 生成嵌入
        embeddings = self.model.encode(texts)

        # K-Means 聚类
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        labels = kmeans.fit_predict(embeddings)

        return labels, embeddings

    def visualize(self, embeddings: np.ndarray, labels: np.ndarray, texts: List[str]):
        """可视化聚类结果"""
        # t-SNE 降维
        tsne = TSNE(n_components=2, random_state=42)
        embeddings_2d = tsne.fit_transform(embeddings)

        # 绘图
        plt.figure(figsize=(12, 8))
        scatter = plt.scatter(embeddings_2d[:, 0], embeddings_2d[:, 1],
                             c=labels, cmap='tab10', alpha=0.6)
        plt.colorbar(scatter)
        plt.title("文本聚类可视化")
        plt.savefig("clustering.png")

# 使用示例
clusterer = TextClusterer()
texts = [
    "Python 编程入门", "Java 开发指南", "C++ 高级技巧",
    "机器学习算法", "深度学习框架", "神经网络原理",
    "投资理财建议", "股票市场分析", "基金选择策略"
]

labels, embeddings = clusterer.cluster(texts, n_clusters=3)
for text, label in zip(texts, labels):
    print(f"类别 {label}: {text}")
```

### 推荐系统

基于嵌入的内容推荐：

```python
from typing import Dict, List
import numpy as np

class ContentRecommender:
    """基于嵌入的内容推荐系统"""

    def __init__(self, model_name: str = "BAAI/bge-base-zh-v1.5"):
        self.model = SentenceTransformer(model_name)
        self.items: Dict[str, str] = {}  # item_id -> content
        self.embeddings: Dict[str, np.ndarray] = {}  # item_id -> embedding
        self.user_history: Dict[str, List[str]] = {}  # user_id -> [item_ids]

    def add_item(self, item_id: str, content: str):
        """添加物品"""
        self.items[item_id] = content
        self.embeddings[item_id] = self.model.encode(content)

    def record_interaction(self, user_id: str, item_id: str):
        """记录用户交互"""
        if user_id not in self.user_history:
            self.user_history[user_id] = []
        self.user_history[user_id].append(item_id)

    def get_user_embedding(self, user_id: str) -> np.ndarray:
        """计算用户兴趣向量（历史交互物品的平均嵌入）"""
        if user_id not in self.user_history:
            return None

        history_embeddings = [
            self.embeddings[item_id]
            for item_id in self.user_history[user_id]
            if item_id in self.embeddings
        ]

        if not history_embeddings:
            return None

        return np.mean(history_embeddings, axis=0)

    def recommend(self, user_id: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """为用户推荐物品"""
        user_embedding = self.get_user_embedding(user_id)
        if user_embedding is None:
            return []

        # 计算与所有物品的相似度
        scores = []
        seen_items = set(self.user_history.get(user_id, []))

        for item_id, item_embedding in self.embeddings.items():
            if item_id in seen_items:
                continue  # 排除已交互物品

            similarity = np.dot(user_embedding, item_embedding) / (
                np.linalg.norm(user_embedding) * np.linalg.norm(item_embedding)
            )
            scores.append((item_id, similarity))

        # 排序返回 top-k
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]

# 使用示例
recommender = ContentRecommender()

# 添加文章
articles = {
    "a1": "Python 机器学习入门教程",
    "a2": "深度学习框架 PyTorch 实战",
    "a3": "TensorFlow 神经网络开发",
    "a4": "Web 前端 React 开发指南",
    "a5": "Vue.js 组件化开发",
    "a6": "自然语言处理技术详解"
}

for aid, content in articles.items():
    recommender.add_item(aid, content)

# 记录用户行为
recommender.record_interaction("user1", "a1")
recommender.record_interaction("user1", "a2")

# 获取推荐
recommendations = recommender.recommend("user1", top_k=3)
print("推荐结果:")
for item_id, score in recommendations:
    print(f"  [{score:.4f}] {articles[item_id]}")
```

### 重复检测（去重）

检测语义相似的重复内容：

```python
from typing import List, Set, Tuple

class DuplicateDetector:
    """语义重复检测器"""

    def __init__(self, model_name: str = "BAAI/bge-base-zh-v1.5", threshold: float = 0.85):
        self.model = SentenceTransformer(model_name)
        self.threshold = threshold

    def find_duplicates(self, texts: List[str]) -> List[Tuple[int, int, float]]:
        """查找重复文本对"""
        embeddings = self.model.encode(texts, normalize_embeddings=True)

        duplicates = []
        n = len(texts)

        for i in range(n):
            for j in range(i + 1, n):
                similarity = np.dot(embeddings[i], embeddings[j])
                if similarity >= self.threshold:
                    duplicates.append((i, j, similarity))

        return duplicates

    def deduplicate(self, texts: List[str]) -> List[str]:
        """去除重复文本，保留每组重复中的第一个"""
        embeddings = self.model.encode(texts, normalize_embeddings=True)

        removed: Set[int] = set()
        n = len(texts)

        for i in range(n):
            if i in removed:
                continue
            for j in range(i + 1, n):
                if j in removed:
                    continue
                similarity = np.dot(embeddings[i], embeddings[j])
                if similarity >= self.threshold:
                    removed.add(j)

        return [texts[i] for i in range(n) if i not in removed]

# 使用示例
detector = DuplicateDetector(threshold=0.8)

texts = [
    "如何学习机器学习？",
    "机器学习应该怎么入门？",  # 与第一条语义重复
    "Python 编程教程",
    "学习 Python 编程的方法",  # 与第三条语义重复
    "今天天气真好"
]

# 查找重复
duplicates = detector.find_duplicates(texts)
print("发现重复:")
for i, j, sim in duplicates:
    print(f"  [{sim:.4f}] '{texts[i]}' <-> '{texts[j]}'")

# 去重
unique_texts = detector.deduplicate(texts)
print(f"\n去重后: {unique_texts}")
```

### 问答匹配

FAQ 系统中的问题匹配：

```python
class FAQMatcher:
    """FAQ 问答匹配系统"""

    def __init__(self, model_name: str = "BAAI/bge-base-zh-v1.5"):
        self.model = SentenceTransformer(model_name)
        self.questions = []
        self.answers = []
        self.embeddings = None

    def add_faq(self, question: str, answer: str):
        """添加 FAQ"""
        self.questions.append(question)
        self.answers.append(answer)

    def build_index(self):
        """构建索引"""
        self.embeddings = self.model.encode(self.questions, normalize_embeddings=True)

    def match(self, query: str, threshold: float = 0.7) -> Tuple[str, str, float]:
        """匹配最相似的问题"""
        query_embedding = self.model.encode(query, normalize_embeddings=True)
        similarities = np.dot(self.embeddings, query_embedding)

        best_idx = np.argmax(similarities)
        best_score = similarities[best_idx]

        if best_score < threshold:
            return None, "抱歉，没有找到相关问题。", best_score

        return self.questions[best_idx], self.answers[best_idx], best_score

# 使用示例
faq = FAQMatcher()
faq.add_faq("如何重置密码？", "请点击登录页面的'忘记密码'链接...")
faq.add_faq("如何修改个人信息？", "进入个人中心，点击编辑按钮...")
faq.add_faq("支持哪些支付方式？", "我们支持支付宝、微信支付和银行卡...")
faq.build_index()

query = "我忘记密码了怎么办"
matched_q, answer, score = faq.match(query)
print(f"匹配问题: {matched_q}")
print(f"相似度: {score:.4f}")
print(f"答案: {answer}")
```

---

## 实战代码示例

### 构建完整的嵌入服务

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List, Optional
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="嵌入服务 API")

# 全局模型实例
model = None

class EmbeddingRequest(BaseModel):
    texts: List[str]
    model: str = "BAAI/bge-base-zh-v1.5"
    normalize: bool = True

class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    model: str
    dimensions: int

class SimilarityRequest(BaseModel):
    text1: str
    text2: str

class SimilarityResponse(BaseModel):
    similarity: float

@app.on_event("startup")
async def load_model():
    """启动时加载模型"""
    global model
    logger.info("正在加载嵌入模型...")
    model = SentenceTransformer("BAAI/bge-base-zh-v1.5")
    logger.info("模型加载完成")

@app.post("/embed", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest):
    """生成嵌入向量"""
    if not request.texts:
        raise HTTPException(status_code=400, detail="texts 不能为空")

    try:
        embeddings = model.encode(
            request.texts,
            normalize_embeddings=request.normalize
        )

        return EmbeddingResponse(
            embeddings=embeddings.tolist(),
            model=request.model,
            dimensions=embeddings.shape[1]
        )
    except Exception as e:
        logger.error(f"嵌入生成失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/similarity", response_model=SimilarityResponse)
async def compute_similarity(request: SimilarityRequest):
    """计算文本相似度"""
    embeddings = model.encode(
        [request.text1, request.text2],
        normalize_embeddings=True
    )
    similarity = float(np.dot(embeddings[0], embeddings[1]))

    return SimilarityResponse(similarity=similarity)

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "model_loaded": model is not None}

# 运行: uvicorn embedding_service:app --host 0.0.0.0 --port 8000
```

### 使用 FAISS 进行高效检索

```python
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Tuple

class FAISSSearchEngine:
    """基于 FAISS 的高效向量搜索引擎"""

    def __init__(self, model_name: str = "BAAI/bge-base-zh-v1.5", dimension: int = 768):
        self.model = SentenceTransformer(model_name)
        self.dimension = dimension
        self.documents = []

        # 使用内积索引（对于归一化向量，内积等于余弦相似度）
        self.index = faiss.IndexFlatIP(dimension)

        # 如果有 GPU，可以使用 GPU 加速
        # self.index = faiss.index_cpu_to_gpu(
        #     faiss.StandardGpuResources(), 0, self.index
        # )

    def add_documents(self, documents: List[str]):
        """添加文档到索引"""
        self.documents.extend(documents)

        # 生成嵌入并归一化
        embeddings = self.model.encode(documents, normalize_embeddings=True)

        # 添加到 FAISS 索引
        self.index.add(embeddings.astype(np.float32))

        print(f"索引中共有 {self.index.ntotal} 个文档")

    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """搜索相似文档"""
        # 编码查询
        query_embedding = self.model.encode([query], normalize_embeddings=True)

        # FAISS 搜索
        scores, indices = self.index.search(query_embedding.astype(np.float32), top_k)

        # 组装结果
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents):
                results.append((self.documents[idx], float(score)))

        return results

    def save_index(self, path: str):
        """保存索引到文件"""
        faiss.write_index(self.index, path)

    def load_index(self, path: str):
        """从文件加载索引"""
        self.index = faiss.read_index(path)

class FAISSSearchEngineIVF:
    """使用 IVF 索引的大规模搜索引擎"""

    def __init__(self, model_name: str = "BAAI/bge-base-zh-v1.5",
                 dimension: int = 768, nlist: int = 100):
        self.model = SentenceTransformer(model_name)
        self.dimension = dimension
        self.nlist = nlist
        self.documents = []
        self.is_trained = False

        # IVF 索引需要先训练
        quantizer = faiss.IndexFlatIP(dimension)
        self.index = faiss.IndexIVFFlat(quantizer, dimension, nlist, faiss.METRIC_INNER_PRODUCT)

    def train(self, train_documents: List[str]):
        """训练索引（大规模数据时需要）"""
        embeddings = self.model.encode(train_documents, normalize_embeddings=True)
        self.index.train(embeddings.astype(np.float32))
        self.is_trained = True
        print("索引训练完成")

    def add_documents(self, documents: List[str]):
        """添加文档"""
        if not self.is_trained:
            raise RuntimeError("索引未训练，请先调用 train()")

        self.documents.extend(documents)
        embeddings = self.model.encode(documents, normalize_embeddings=True)
        self.index.add(embeddings.astype(np.float32))

    def search(self, query: str, top_k: int = 5, nprobe: int = 10) -> List[Tuple[str, float]]:
        """搜索（nprobe 控制搜索的聚类数量，越大越精确但越慢）"""
        self.index.nprobe = nprobe

        query_embedding = self.model.encode([query], normalize_embeddings=True)
        scores, indices = self.index.search(query_embedding.astype(np.float32), top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx < len(self.documents):
                results.append((self.documents[idx], float(score)))

        return results

# 使用示例
engine = FAISSSearchEngine()

# 添加文档
docs = [
    "机器学习是人工智能的核心技术之一",
    "深度学习在图像识别领域取得了巨大成功",
    "自然语言处理让计算机能够理解人类语言",
    "推荐系统可以预测用户的兴趣偏好",
    "向量数据库专门用于存储和检索高维向量"
]
engine.add_documents(docs)

# 搜索
results = engine.search("AI 如何理解文本", top_k=3)
for doc, score in results:
    print(f"[{score:.4f}] {doc}")
```

### 嵌入缓存与优化

```python
import hashlib
import json
from functools import lru_cache
from typing import Dict, List, Optional
import redis
import numpy as np

class EmbeddingCache:
    """嵌入缓存系统"""

    def __init__(self, model_name: str = "BAAI/bge-base-zh-v1.5",
                 redis_url: Optional[str] = None):
        self.model = SentenceTransformer(model_name)
        self.local_cache: Dict[str, np.ndarray] = {}

        # Redis 缓存（可选）
        self.redis_client = None
        if redis_url:
            self.redis_client = redis.from_url(redis_url)

    def _get_cache_key(self, text: str) -> str:
        """生成缓存键"""
        return hashlib.md5(text.encode()).hexdigest()

    def _get_from_cache(self, text: str) -> Optional[np.ndarray]:
        """从缓存获取嵌入"""
        key = self._get_cache_key(text)

        # 先查本地缓存
        if key in self.local_cache:
            return self.local_cache[key]

        # 再查 Redis 缓存
        if self.redis_client:
            cached = self.redis_client.get(f"emb:{key}")
            if cached:
                embedding = np.frombuffer(cached, dtype=np.float32)
                self.local_cache[key] = embedding
                return embedding

        return None

    def _set_cache(self, text: str, embedding: np.ndarray):
        """设置缓存"""
        key = self._get_cache_key(text)

        # 本地缓存
        self.local_cache[key] = embedding

        # Redis 缓存
        if self.redis_client:
            self.redis_client.set(
                f"emb:{key}",
                embedding.astype(np.float32).tobytes(),
                ex=86400  # 24 小时过期
            )

    def encode(self, texts: List[str], normalize: bool = True) -> np.ndarray:
        """带缓存的编码"""
        embeddings = []
        texts_to_encode = []
        indices_to_encode = []

        # 检查缓存
        for i, text in enumerate(texts):
            cached = self._get_from_cache(text)
            if cached is not None:
                embeddings.append(cached)
            else:
                texts_to_encode.append(text)
                indices_to_encode.append(i)
                embeddings.append(None)

        # 编码未缓存的文本
        if texts_to_encode:
            new_embeddings = self.model.encode(
                texts_to_encode,
                normalize_embeddings=normalize
            )

            # 更新结果和缓存
            for idx, text, emb in zip(indices_to_encode, texts_to_encode, new_embeddings):
                embeddings[idx] = emb
                self._set_cache(text, emb)

        return np.array(embeddings)

    def cache_stats(self) -> Dict:
        """缓存统计"""
        stats = {
            "local_cache_size": len(self.local_cache)
        }
        if self.redis_client:
            stats["redis_keys"] = self.redis_client.dbsize()
        return stats

# 使用示例
cache = EmbeddingCache(redis_url="redis://localhost:6379/0")

texts = ["第一次编码", "第二次编码", "第一次编码"]  # 第三个会命中缓存
embeddings = cache.encode(texts)
print(f"缓存统计: {cache.cache_stats()}")
```

---

## 最佳实践

### 模型选择

```python
# 根据场景选择合适的模型

# 中文语义搜索 - 首选 BGE 系列
model = SentenceTransformer("BAAI/bge-large-zh-v1.5")  # 最高精度
model = SentenceTransformer("BAAI/bge-base-zh-v1.5")   # 平衡选择
model = SentenceTransformer("BAAI/bge-small-zh-v1.5")  # 轻量级

# 多语言场景
model = SentenceTransformer("BAAI/bge-m3")

# 英文场景
model = SentenceTransformer("all-MiniLM-L6-v2")        # 快速
model = SentenceTransformer("all-mpnet-base-v2")       # 高精度

# 商业场景（高质量但付费）
# 使用 OpenAI text-embedding-3-small/large
```

### 文本预处理

```python
import re
from typing import List

def preprocess_text(text: str) -> str:
    """文本预处理"""
    # 去除多余空白
    text = re.sub(r'\s+', ' ', text).strip()

    # 去除特殊字符（根据需要调整）
    text = re.sub(r'[^\w\s\u4e00-\u9fff.,!?;:，。！？；：]', '', text)

    # 长度截断（大多数模型有最大长度限制）
    max_length = 512
    if len(text) > max_length:
        text = text[:max_length]

    return text

def preprocess_batch(texts: List[str]) -> List[str]:
    """批量预处理"""
    return [preprocess_text(t) for t in texts]
```

### 批量处理

```python
def encode_large_corpus(
    texts: List[str],
    model: SentenceTransformer,
    batch_size: int = 32,
    show_progress: bool = True
) -> np.ndarray:
    """大规模文本编码"""
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        embeddings = model.encode(batch, normalize_embeddings=True)
        all_embeddings.append(embeddings)

        if show_progress and (i // batch_size) % 10 == 0:
            print(f"已处理 {i + len(batch)}/{len(texts)}")

    return np.vstack(all_embeddings)
```

### 归一化处理

```python
# 方式 1：模型编码时归一化
embeddings = model.encode(texts, normalize_embeddings=True)

# 方式 2：手动归一化
def normalize_embeddings(embeddings: np.ndarray) -> np.ndarray:
    """L2 归一化"""
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    return embeddings / norms

# 归一化的好处：
# 点积等于余弦相似度，计算更快
# 向量比较更稳定
# 便于在向量数据库中使用
```

### 查询优化

```python
class QueryOptimizer:
    """查询优化器"""

    def __init__(self, model):
        self.model = model

    def add_query_instruction(self, query: str, task: str = "retrieval") -> str:
        """添加查询指令（某些模型需要）"""
        instructions = {
            "retrieval": "为这个句子生成表示以用于检索相关文章：",
            "classification": "为这个句子生成表示以用于分类：",
            "clustering": "为这个句子生成表示以用于聚类：",
        }
        instruction = instructions.get(task, "")
        return instruction + query

    def expand_query(self, query: str, synonyms: Dict[str, List[str]]) -> List[str]:
        """查询扩展"""
        queries = [query]

        for word, syns in synonyms.items():
            if word in query:
                for syn in syns:
                    queries.append(query.replace(word, syn))

        return queries

    def encode_query(self, query: str, task: str = "retrieval") -> np.ndarray:
        """编码查询"""
        optimized_query = self.add_query_instruction(query, task)
        return self.model.encode(optimized_query, normalize_embeddings=True)
```

### 错误处理

```python
from typing import Optional
import time

class RobustEmbedder:
    """健壮的嵌入生成器"""

    def __init__(self, model_name: str, max_retries: int = 3):
        self.model = SentenceTransformer(model_name)
        self.max_retries = max_retries

    def encode_with_retry(self, texts: List[str]) -> Optional[np.ndarray]:
        """带重试的编码"""
        for attempt in range(self.max_retries):
            try:
                return self.model.encode(texts, normalize_embeddings=True)
            except Exception as e:
                if attempt < self.max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"编码失败，{wait_time} 秒后重试: {e}")
                    time.sleep(wait_time)
                else:
                    print(f"编码最终失败: {e}")
                    return None

    def safe_encode(self, texts: List[str], fallback: Optional[np.ndarray] = None) -> np.ndarray:
        """安全编码，失败时返回默认值"""
        result = self.encode_with_retry(texts)
        if result is None:
            if fallback is not None:
                return fallback
            # 返回零向量作为最后手段
            return np.zeros((len(texts), 768))
        return result
```

---

## 面试要点

### 基础概念题

**Q1: 什么是向量嵌入？它的核心思想是什么？**

向量嵌入是将离散对象（如文本、图像）映射到连续向量空间的技术。核心思想是让语义相近的内容在向量空间中距离更近，从而可以通过向量运算来衡量语义相似度。

**Q2: 为什么嵌入比 One-Hot 编码更好？**

- 维度更低，计算效率高
- 稠密表示，包含更多信息
- 能够捕捉语义关系
- 支持语义计算（如相似度）

**Q3: Word2Vec 和 BERT 嵌入有什么区别？**

| 特性 | Word2Vec | BERT |
|------|----------|------|
| 表示类型 | 静态（每个词固定向量） | 动态（上下文相关） |
| 训练目标 | 预测周围词 | 掩码语言模型 |
| 多义词处理 | 不支持 | 支持 |
| 计算成本 | 低 | 高 |

### 技术深度题

**Q4: 如何选择相似度度量方法？**

- **余弦相似度**：最常用，对向量长度不敏感，适合文本
- **点积**：对于归一化向量等价于余弦相似度，计算最快
- **欧氏距离**：适合需要考虑向量大小的场景
- 选择建议：文本检索用余弦相似度，归一化向量用点积

**Q5: 如何优化大规模嵌入检索的性能？**

1. **向量归一化**：点积计算更快
2. **使用近似最近邻（ANN）算法**：如 HNSW、IVF
3. **批量处理**：减少模型调用开销
4. **缓存机制**：避免重复计算
5. **降维**：部分模型支持输出低维向量
6. **量化**：将 float32 量化为 int8

**Q6: BGE 模型为什么需要查询前缀？**

BGE 模型在训练时使用了指令调优，对查询添加特定前缀（如"为这个句子生成表示以用于检索相关文章："）可以让模型知道当前的任务类型，从而生成更适合该任务的嵌入向量。文档不需要前缀，因为它们是被检索的目标。

### 实践应用题

**Q7: 如何处理超长文本的嵌入？**

1. **分块处理**：将长文本分成多个块，分别嵌入
2. **摘要嵌入**：先提取摘要再嵌入
3. **池化策略**：对多个块的嵌入进行平均或加权池化
4. **使用支持长文本的模型**：如 text-embedding-3 支持 8K tokens

```python
def embed_long_text(text: str, model, max_length: int = 512) -> np.ndarray:
    """长文本嵌入"""
    chunks = [text[i:i+max_length] for i in range(0, len(text), max_length)]
    chunk_embeddings = model.encode(chunks, normalize_embeddings=True)
    # 平均池化
    return np.mean(chunk_embeddings, axis=0)
```

**Q8: 如何评估嵌入模型的质量？**

1. **内在评估**：
   - 词类比任务（king - man + woman = queen）
   - 词相似度任务（与人工标注对比）

2. **外在评估**：
   - 下游任务表现（分类、检索、聚类）
   - 检索指标（Recall@K、MRR、NDCG）

3. **常用基准**：
   - MTEB（Massive Text Embedding Benchmark）
   - C-MTEB（中文版）

### 系统设计题

**Q9: 设计一个生产级的语义搜索系统**

```
1. 离线流程：
   文档 -> 清洗预处理 -> 分块 -> 嵌入生成 -> 向量数据库

2. 在线流程：
   查询 -> 预处理 -> 查询嵌入 -> 向量检索 -> 重排序 -> 返回结果

3. 关键组件：
   - 嵌入服务（支持批量、缓存）
   - 向量数据库（Milvus/Pinecone）
   - 重排序模型（交叉编码器）
   - 监控告警
```

---

## 延伸阅读

### 经典论文

1. **Word2Vec**: Mikolov et al., "Efficient Estimation of Word Representations in Vector Space", 2013
2. **GloVe**: Pennington et al., "GloVe: Global Vectors for Word Representation", 2014
3. **Sentence-BERT**: Reimers & Gurevych, "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks", 2019
4. **BGE**: Xiao et al., "C-Pack: Packaged Resources To Advance General Chinese Embedding", 2023

### 推荐资源

1. **Sentence-Transformers 官方文档**: https://www.sbert.net/
2. **MTEB 排行榜**: https://huggingface.co/spaces/mteb/leaderboard
3. **OpenAI Embeddings Guide**: https://platform.openai.com/docs/guides/embeddings

### 相关主题

- **向量数据库**：Milvus、Pinecone、Chroma、FAISS
- **RAG 系统**：结合嵌入检索和 LLM 生成
- **多模态嵌入**：CLIP、ImageBind
- **嵌入微调**：针对特定领域优化嵌入模型

---

## 总结

向量嵌入是现代 AI 应用的基础技术，掌握嵌入技术对于构建语义搜索、推荐系统、RAG 等应用至关重要。

**核心要点**：

1. **概念理解**：嵌入将离散对象映射到连续向量空间，语义相近的内容距离更近
2. **模型选择**：根据语言、精度、速度需求选择合适的模型
3. **相似度度量**：余弦相似度最常用，归一化后可用点积加速
4. **应用场景**：语义搜索、聚类、推荐、去重、问答匹配
5. **工程实践**：批量处理、缓存、归一化、错误处理

随着大语言模型的发展，嵌入技术正在与 RAG、Agent 等技术深度融合。持续关注这一领域的最新进展，对于 AI 工程师来说至关重要。
