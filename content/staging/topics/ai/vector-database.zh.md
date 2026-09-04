---
title: 向量数据库完全指南
description: 掌握向量数据库原理与实践，构建语义搜索应用
track: ai
section: rag
difficulty: intermediate
tags:
  - 向量数据库
  - Pinecone
  - Milvus
  - 语义搜索
status: imported
origin: old/src/content/docs/ai/vector-database.zh.md
divergence: 0.217
issues: []
legacy:
  category: AI
  subcategory: Infrastructure
  order: 11
  lastUpdated: 2026-01-07
---

## 概念解释

**向量数据库（Vector Database）** 是一种专门用于存储、索引和查询高维向量数据的数据库系统。在人工智能和机器学习时代，向量数据库已成为构建语义搜索、推荐系统和 RAG（检索增强生成）应用的核心基础设施。

### 为什么需要向量数据库？

传统数据库基于精确匹配进行查询，而向量数据库则支持**相似性搜索**——找到与查询向量最相似的向量集合。这种能力使其特别适合以下场景：

```
┌─────────────────────────────────────────────────────────────────┐
│                     向量数据库核心能力                            │
├─────────────────────────────────────────────────────────────────┤
│  语义搜索      │  理解查询意图，返回语义相关的结果                  │
├─────────────────────────────────────────────────────────────────┤
│  推荐系统      │  基于用户行为向量，推荐相似物品                    │
├─────────────────────────────────────────────────────────────────┤
│  图像检索      │  以图搜图，找到视觉相似的图片                      │
├─────────────────────────────────────────────────────────────────┤
│  RAG 应用      │  为 LLM 提供相关上下文，增强生成质量               │
├─────────────────────────────────────────────────────────────────┤
│  异常检测      │  识别与正常模式差异较大的数据点                    │
└─────────────────────────────────────────────────────────────────┘
```

### 向量是什么？

在机器学习中，向量是对数据的数值化表示。通过 Embedding 模型，我们可以将文本、图像、音频等非结构化数据转换为固定维度的浮点数数组：

```python
# 文本向量化示例
from openai import OpenAI

client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """将文本转换为向量"""
    response = client.embeddings.create(
        input=text,
        model=model
    )
    return response.data[0].embedding

# 示例：获取一段文本的向量表示
text = "向量数据库是构建 AI 应用的核心基础设施"
embedding = get_embedding(text)

print(f"向量维度: {len(embedding)}")  # 1536 维
print(f"前 5 个值: {embedding[:5]}")  # [-0.023, 0.045, -0.012, ...]
```

---

## 向量索引算法

向量数据库的核心挑战是如何在海量向量中快速找到最相似的向量。暴力搜索（逐一比较）的时间复杂度为 O(n)，对于百万级数据完全不可行。因此，需要使用近似最近邻（ANN）算法来加速搜索。

### HNSW（Hierarchical Navigable Small World）

HNSW 是目前最流行的向量索引算法，它构建了一个多层的图结构，实现了 O(log n) 的搜索复杂度。

```
┌─────────────────────────────────────────────────────────────────┐
│                    HNSW 多层图结构示意                           │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2（稀疏层）    ○───────────────○                         │
│                        │               │                         │
│  Layer 1（中间层）    ○───○───────○───○                         │
│                        │   │       │   │                         │
│  Layer 0（稠密层）    ○─○─○─○─○─○─○─○─○                         │
│                       ↑                                          │
│                    查询入口                                       │
└─────────────────────────────────────────────────────────────────┘
```

**HNSW 工作原理：**

1. **构建阶段**：每个向量以概率方式被分配到不同层级
2. **搜索阶段**：从最高层开始，贪婪地寻找最近邻，逐层下降
3. **优势**：查询速度快，召回率高，支持动态插入

```python
# 使用 hnswlib 构建 HNSW 索引
import hnswlib
import numpy as np

# 创建索引
dim = 1536  # 向量维度
num_elements = 100000  # 向量数量

# 初始化索引
index = hnswlib.Index(space='cosine', dim=dim)

# 设置索引参数
# M: 每个节点的最大连接数，影响构建速度和召回率
# ef_construction: 构建时的搜索宽度，越大索引质量越高
index.init_index(max_elements=num_elements, ef_construction=200, M=16)

# 生成示例数据
data = np.random.rand(num_elements, dim).astype('float32')

# 添加向量到索引
index.add_items(data, ids=np.arange(num_elements))

# 设置查询参数
# ef: 查询时的搜索宽度，越大召回率越高但速度越慢
index.set_ef(50)

# 执行查询
query_vector = np.random.rand(1, dim).astype('float32')
labels, distances = index.knn_query(query_vector, k=10)

print(f"最相似的 10 个向量 ID: {labels[0]}")
print(f"对应的距离: {distances[0]}")
```

### IVF（Inverted File Index）

IVF 算法将向量空间划分为多个聚类（Voronoi 单元），查询时只搜索最相关的几个聚类。

```
┌─────────────────────────────────────────────────────────────────┐
│                    IVF 聚类分区示意                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌────────┐     ┌────────┐     ┌────────┐                     │
│    │ 聚类 1  │     │ 聚类 2  │     │ 聚类 3  │                     │
│    │  ○ ○   │     │  ○     │     │ ○ ○ ○  │                     │
│    │   ○    │     │ ○  ○   │     │   ○    │                     │
│    │  ★     │     │   ○    │     │  ○     │                     │
│    └────────┘     └────────┘     └────────┘                     │
│       ↑                                                          │
│    质心 1           质心 2          质心 3                        │
│                                                                  │
│  查询流程：1. 找到最近的 nprobe 个质心                            │
│           2. 只在这些聚类中搜索最近邻                             │
└─────────────────────────────────────────────────────────────────┘
```

**IVF 参数说明：**

- `nlist`：聚类数量，通常设置为 sqrt(n) 到 4*sqrt(n)
- `nprobe`：查询时搜索的聚类数量，越大召回率越高

```python
# 使用 Faiss 构建 IVF 索引
import faiss
import numpy as np

dim = 1536
num_elements = 100000

# 生成示例数据
data = np.random.rand(num_elements, dim).astype('float32')

# 创建 IVF 索引
nlist = 100  # 聚类数量
quantizer = faiss.IndexFlatL2(dim)  # 用于查找最近质心的索引
index = faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_L2)

# 训练索引（需要一部分数据来确定聚类中心）
index.train(data)

# 添加向量
index.add(data)

# 设置搜索参数
index.nprobe = 10  # 搜索 10 个最近的聚类

# 执行查询
query_vector = np.random.rand(1, dim).astype('float32')
distances, labels = index.search(query_vector, k=10)

print(f"最相似的 10 个向量 ID: {labels[0]}")
```

### 算法对比

| 特性 | HNSW | IVF |
|------|------|-----|
| 时间复杂度 | O(log n) | O(n/nlist * nprobe) |
| 空间复杂度 | 较高（需存储图结构） | 较低 |
| 构建速度 | 较慢 | 较快（需训练） |
| 动态插入 | 支持 | 需要重新训练 |
| 召回率 | 高 | 取决于 nprobe |
| 适用场景 | 高频查询，动态数据 | 大规模静态数据 |

---

## 相似度度量

选择合适的相似度度量方法对搜索质量至关重要。不同的度量方法适用于不同的应用场景。

### 余弦相似度（Cosine Similarity）

测量两个向量方向的相似程度，忽略向量长度。值域为 [-1, 1]，1 表示完全相同，-1 表示完全相反。

```python
import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """计算余弦相似度"""
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)

# 示例
vec_a = np.array([1, 2, 3])
vec_b = np.array([2, 4, 6])  # 与 vec_a 同方向，长度不同
vec_c = np.array([-1, -2, -3])  # 与 vec_a 反方向

print(f"a 和 b 的余弦相似度: {cosine_similarity(vec_a, vec_b):.4f}")  # 1.0
print(f"a 和 c 的余弦相似度: {cosine_similarity(vec_a, vec_c):.4f}")  # -1.0
```

**适用场景：** 文本相似度、语义搜索（因为 Embedding 向量已经归一化）

### 欧几里得距离（Euclidean Distance / L2）

测量两个向量在空间中的直线距离。值越小表示越相似。

```python
def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    """计算欧几里得距离"""
    return np.linalg.norm(a - b)

# 或者使用平方距离（避免开方运算，更快）
def squared_euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    """计算欧几里得距离的平方"""
    return np.sum((a - b) ** 2)

# 示例
vec_a = np.array([0, 0])
vec_b = np.array([3, 4])

print(f"欧几里得距离: {euclidean_distance(vec_a, vec_b):.4f}")  # 5.0
```

**适用场景：** 图像相似度、空间位置相关的搜索

### 内积（Inner Product / Dot Product）

计算两个向量的点积。对于归一化向量，内积等价于余弦相似度。

```python
def inner_product(a: np.ndarray, b: np.ndarray) -> float:
    """计算内积"""
    return np.dot(a, b)

# 对于归一化向量
def normalize(v: np.ndarray) -> np.ndarray:
    """向量归一化"""
    return v / np.linalg.norm(v)

vec_a = normalize(np.array([1, 2, 3]))
vec_b = normalize(np.array([2, 4, 6]))

# 归一化后，内积 = 余弦相似度
print(f"内积: {inner_product(vec_a, vec_b):.4f}")  # 1.0
```

**适用场景：** 推荐系统中的最大内积搜索（MIPS）

### 度量选择指南

```
┌─────────────────────────────────────────────────────────────────┐
│                    如何选择相似度度量？                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  向量已归一化？                                                   │
│       │                                                          │
│       ├─ 是 → 三种度量等价，选择计算最快的内积                      │
│       │                                                          │
│       └─ 否 → 是否关注向量长度？                                  │
│               │                                                  │
│               ├─ 是 → 欧几里得距离                                │
│               │                                                  │
│               └─ 否 → 余弦相似度                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 主流向量数据库对比

### 产品矩阵

| 产品 | 类型 | 开源 | 托管服务 | 特点 |
|------|------|------|----------|------|
| **Pinecone** | 云原生 | 否 | 是 | 全托管，开箱即用，企业级 |
| **Milvus** | 分布式 | 是 | Zilliz Cloud | 高性能，功能丰富 |
| **Chroma** | 嵌入式 | 是 | 否 | 轻量级，适合本地开发 |
| **Weaviate** | 云原生 | 是 | 是 | 内置向量化，GraphQL 接口 |
| **Qdrant** | 分布式 | 是 | 是 | Rust 实现，高性能 |
| **pgvector** | 扩展 | 是 | 是 | PostgreSQL 原生支持 |

### 选型建议

```
┌─────────────────────────────────────────────────────────────────┐
│                    向量数据库选型决策树                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  项目阶段？                                                       │
│       │                                                          │
│       ├─ 原型开发/POC → Chroma（零配置，本地运行）                 │
│       │                                                          │
│       └─ 生产环境                                                 │
│               │                                                  │
│               ├─ 已有 PostgreSQL → pgvector（复用现有基础设施）    │
│               │                                                  │
│               ├─ 追求简单 → Pinecone（全托管，无运维）             │
│               │                                                  │
│               └─ 需要私有化部署 → Milvus/Qdrant                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pinecone 实战

Pinecone 是一款全托管的向量数据库服务，以其简单易用和高可用性著称。

### 安装与配置

```bash
pip install pinecone-client
```

### 创建索引与基本操作

```python
from pinecone import Pinecone, ServerlessSpec

# 初始化客户端
pc = Pinecone(api_key="your-api-key")

# 创建索引
index_name = "semantic-search"

pc.create_index(
    name=index_name,
    dimension=1536,  # OpenAI text-embedding-3-small 的维度
    metric="cosine",
    spec=ServerlessSpec(
        cloud="aws",
        region="us-east-1"
    )
)

# 获取索引
index = pc.Index(index_name)

# 查看索引状态
print(index.describe_index_stats())
```

### 数据写入与查询

```python
import hashlib
from openai import OpenAI

openai_client = OpenAI()

def get_embedding(text: str) -> list[float]:
    """获取文本向量"""
    response = openai_client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def generate_id(text: str) -> str:
    """生成唯一 ID"""
    return hashlib.md5(text.encode()).hexdigest()

# 准备数据
documents = [
    {"text": "Python 是一种解释型编程语言", "category": "programming"},
    {"text": "向量数据库用于存储高维向量", "category": "database"},
    {"text": "机器学习是人工智能的子领域", "category": "ai"},
    {"text": "深度学习使用神经网络处理复杂模式", "category": "ai"},
]

# 批量写入向量
vectors = []
for doc in documents:
    embedding = get_embedding(doc["text"])
    vectors.append({
        "id": generate_id(doc["text"]),
        "values": embedding,
        "metadata": {
            "text": doc["text"],
            "category": doc["category"]
        }
    })

# 使用 upsert 写入（存在则更新，不存在则插入）
index.upsert(vectors=vectors)

# 语义查询
query_text = "什么是 AI？"
query_embedding = get_embedding(query_text)

results = index.query(
    vector=query_embedding,
    top_k=3,
    include_metadata=True
)

print("查询结果:")
for match in results.matches:
    print(f"  相似度: {match.score:.4f}")
    print(f"  内容: {match.metadata['text']}")
    print(f"  分类: {match.metadata['category']}")
    print()
```

### 元数据过滤

```python
# 使用元数据过滤查询结果
results = index.query(
    vector=query_embedding,
    top_k=5,
    include_metadata=True,
    filter={
        "category": {"$eq": "ai"}  # 只返回 AI 分类的结果
    }
)

# 支持的过滤操作符
# $eq: 等于
# $ne: 不等于
# $gt: 大于
# $gte: 大于等于
# $lt: 小于
# $lte: 小于等于
# $in: 在列表中
# $nin: 不在列表中
# $and: 逻辑与
# $or: 逻辑或

# 复杂过滤示例
complex_filter = {
    "$and": [
        {"category": {"$in": ["ai", "database"]}},
        {"created_at": {"$gte": "2024-01-01"}}
    ]
}
```

### Namespace 隔离

```python
# 使用命名空间隔离不同租户的数据
tenant_a_namespace = "tenant-a"
tenant_b_namespace = "tenant-b"

# 写入到不同命名空间
index.upsert(vectors=tenant_a_vectors, namespace=tenant_a_namespace)
index.upsert(vectors=tenant_b_vectors, namespace=tenant_b_namespace)

# 查询时指定命名空间
results = index.query(
    vector=query_embedding,
    top_k=10,
    namespace=tenant_a_namespace  # 只搜索租户 A 的数据
)
```

---

## Milvus 实战

Milvus 是一款高性能的开源向量数据库，支持分布式部署，适合大规模生产环境。

### 安装与启动

```bash
# 使用 Docker Compose 启动 Milvus
wget https://github.com/milvus-io/milvus/releases/download/v2.3.0/milvus-standalone-docker-compose.yml -O docker-compose.yml
docker-compose up -d

# 安装 Python SDK
pip install pymilvus
```

### 创建 Collection

```python
from pymilvus import (
    connections,
    utility,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
)

# 连接 Milvus
connections.connect("default", host="localhost", port="19530")

# 定义字段
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=2000),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
    FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=100),
]

# 创建 Schema
schema = CollectionSchema(
    fields=fields,
    description="Document embeddings for semantic search"
)

# 创建 Collection
collection_name = "documents"
collection = Collection(name=collection_name, schema=schema)

print(f"Collection {collection_name} 创建成功")
```

### 创建索引

```python
# 创建 HNSW 索引
index_params = {
    "metric_type": "COSINE",
    "index_type": "HNSW",
    "params": {
        "M": 16,  # 每个节点的最大连接数
        "efConstruction": 256  # 构建时的搜索宽度
    }
}

collection.create_index(
    field_name="embedding",
    index_params=index_params
)

# 或者使用 IVF_FLAT 索引（适合更大规模数据）
ivf_index_params = {
    "metric_type": "L2",
    "index_type": "IVF_FLAT",
    "params": {
        "nlist": 1024  # 聚类数量
    }
}
```

### 数据写入与查询

```python
from openai import OpenAI
import numpy as np

openai_client = OpenAI()

def get_embeddings(texts: list[str]) -> list[list[float]]:
    """批量获取向量"""
    response = openai_client.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )
    return [item.embedding for item in response.data]

# 准备数据
documents = [
    {"text": "Milvus 是一款开源向量数据库", "category": "database"},
    {"text": "HNSW 是高效的向量索引算法", "category": "algorithm"},
    {"text": "语义搜索理解查询的含义", "category": "search"},
]

texts = [doc["text"] for doc in documents]
categories = [doc["category"] for doc in documents]
embeddings = get_embeddings(texts)

# 插入数据
entities = [
    texts,      # text 字段
    embeddings,  # embedding 字段
    categories,  # category 字段
]

insert_result = collection.insert(entities)
print(f"插入 {len(insert_result.primary_keys)} 条数据")

# 加载 Collection 到内存（查询前必须）
collection.load()

# 执行查询
query_text = "什么是向量搜索？"
query_embedding = get_embeddings([query_text])[0]

search_params = {
    "metric_type": "COSINE",
    "params": {"ef": 64}  # HNSW 查询参数
}

results = collection.search(
    data=[query_embedding],
    anns_field="embedding",
    param=search_params,
    limit=5,
    output_fields=["text", "category"]
)

print("搜索结果:")
for hits in results:
    for hit in hits:
        print(f"  ID: {hit.id}")
        print(f"  距离: {hit.distance:.4f}")
        print(f"  文本: {hit.entity.get('text')}")
        print(f"  分类: {hit.entity.get('category')}")
        print()
```

### 标量过滤

```python
# 结合标量过滤的混合搜索
results = collection.search(
    data=[query_embedding],
    anns_field="embedding",
    param=search_params,
    limit=10,
    expr='category == "database"',  # 标量过滤表达式
    output_fields=["text", "category"]
)

# 支持的表达式
# ==, !=, >, >=, <, <=
# in, not in
# and, or, not
# like (模糊匹配)

# 复杂过滤示例
expr = 'category in ["database", "algorithm"] and text like "%向量%"'
```

---

## Chroma 本地开发

Chroma 是一款轻量级的嵌入式向量数据库，非常适合本地开发和快速原型验证。

### 安装

```bash
pip install chromadb
```

### 基本使用

```python
import chromadb
from chromadb.utils import embedding_functions

# 创建客户端（持久化到磁盘）
client = chromadb.PersistentClient(path="./chroma_data")

# 或者使用内存模式（适合测试）
# client = chromadb.Client()

# 使用 OpenAI Embedding
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="your-api-key",
    model_name="text-embedding-3-small"
)

# 创建或获取 Collection
collection = client.get_or_create_collection(
    name="documents",
    embedding_function=openai_ef,
    metadata={"hnsw:space": "cosine"}  # 使用余弦相似度
)

# 添加文档（Chroma 会自动生成向量）
collection.add(
    ids=["doc1", "doc2", "doc3"],
    documents=[
        "Python 是最流行的编程语言之一",
        "向量数据库支持语义搜索",
        "机器学习改变了软件开发方式"
    ],
    metadatas=[
        {"source": "wiki", "category": "programming"},
        {"source": "blog", "category": "database"},
        {"source": "article", "category": "ai"}
    ]
)

print(f"Collection 中有 {collection.count()} 个文档")
```

### 查询与过滤

```python
# 语义查询
results = collection.query(
    query_texts=["什么是人工智能？"],
    n_results=3,
    include=["documents", "metadatas", "distances"]
)

print("查询结果:")
for i, doc in enumerate(results["documents"][0]):
    print(f"  文档: {doc}")
    print(f"  元数据: {results['metadatas'][0][i]}")
    print(f"  距离: {results['distances'][0][i]:.4f}")
    print()

# 带过滤的查询
results = collection.query(
    query_texts=["编程相关"],
    n_results=5,
    where={"category": "programming"},  # 元数据过滤
    where_document={"$contains": "Python"}  # 文档内容过滤
)

# 支持的 where 操作符
# $eq: 等于（默认）
# $ne: 不等于
# $gt, $gte, $lt, $lte: 比较
# $in, $nin: 包含/不包含
# $and, $or: 逻辑组合
```

### 更新与删除

```python
# 更新文档
collection.update(
    ids=["doc1"],
    documents=["Python 是一种强大且易学的编程语言"],
    metadatas=[{"source": "updated", "category": "programming"}]
)

# 删除文档
collection.delete(ids=["doc3"])

# 按条件删除
collection.delete(where={"category": "deprecated"})
```

### 与 LangChain 集成

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# 创建向量存储
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(
    collection_name="langchain_docs",
    embedding_function=embeddings,
    persist_directory="./chroma_langchain"
)

# 添加文档
texts = [
    "LangChain 是构建 LLM 应用的框架",
    "RAG 结合了检索和生成能力",
    "向量数据库是 RAG 的核心组件"
]
vectorstore.add_texts(texts)

# 相似性搜索
docs = vectorstore.similarity_search("什么是 RAG？", k=2)
for doc in docs:
    print(doc.page_content)
```

---

## 性能优化

### 批量操作

避免逐条写入，使用批量操作提升吞吐量。

```python
# 不推荐：逐条写入
for doc in documents:
    collection.add(ids=[doc["id"]], documents=[doc["text"]])

# 推荐：批量写入
BATCH_SIZE = 100
for i in range(0, len(documents), BATCH_SIZE):
    batch = documents[i:i + BATCH_SIZE]
    collection.add(
        ids=[doc["id"] for doc in batch],
        documents=[doc["text"] for doc in batch]
    )
```

### 索引参数调优

根据数据规模和查询需求调整索引参数。

```python
# HNSW 参数调优
# 数据量小（< 10 万）：M=16, efConstruction=128
# 数据量中（10-100 万）：M=32, efConstruction=256
# 数据量大（> 100 万）：M=48, efConstruction=512

# 查询参数调优
# 追求速度：ef=50
# 追求召回：ef=200
# 平衡：ef=100

# IVF 参数调优
# nlist = 4 * sqrt(n)  # n 为数据量
# nprobe = nlist / 10  # 约 10% 的聚类
```

### 向量降维

使用 PCA 或 Matryoshka 嵌入减少存储和计算开销。

```python
from sklearn.decomposition import PCA
import numpy as np

# 原始向量
original_dim = 1536
target_dim = 512
vectors = np.random.rand(10000, original_dim).astype('float32')

# PCA 降维
pca = PCA(n_components=target_dim)
reduced_vectors = pca.fit_transform(vectors)

print(f"降维后维度: {reduced_vectors.shape[1]}")
print(f"保留方差比例: {sum(pca.explained_variance_ratio_):.2%}")

# 或者使用支持可变维度的 Embedding 模型
# OpenAI text-embedding-3 支持 dimensions 参数
from openai import OpenAI

client = OpenAI()
response = client.embeddings.create(
    input="示例文本",
    model="text-embedding-3-small",
    dimensions=512  # 降低维度
)
```

### 量化压缩

使用量化技术减少内存占用。

```python
import faiss

dim = 1536
num_elements = 1000000

# 原始向量
vectors = np.random.rand(num_elements, dim).astype('float32')

# 使用 Product Quantization（PQ）压缩
m = 64  # 子空间数量
nbits = 8  # 每个子空间的比特数

# 创建 IVF-PQ 索引
nlist = 1024
quantizer = faiss.IndexFlatL2(dim)
index = faiss.IndexIVFPQ(quantizer, dim, nlist, m, nbits)

# 训练并添加向量
index.train(vectors)
index.add(vectors)

# 内存使用对比
flat_memory = num_elements * dim * 4  # float32
pq_memory = num_elements * m  # 每个向量只需 m 字节
print(f"原始内存: {flat_memory / 1e9:.2f} GB")
print(f"PQ 内存: {pq_memory / 1e9:.2f} GB")
print(f"压缩比: {flat_memory / pq_memory:.1f}x")
```

### 缓存策略

对热点查询结果进行缓存。

```python
from functools import lru_cache
import hashlib

# 使用 LRU 缓存
@lru_cache(maxsize=1000)
def cached_search(query_hash: str, top_k: int):
    # 实际查询逻辑
    return perform_vector_search(query_hash, top_k)

def search_with_cache(query_text: str, top_k: int = 10):
    # 生成查询哈希
    query_hash = hashlib.md5(query_text.encode()).hexdigest()
    return cached_search(query_hash, top_k)

# 使用 Redis 缓存（生产环境推荐）
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379)
CACHE_TTL = 3600  # 1 小时

def search_with_redis_cache(query_text: str, top_k: int = 10):
    cache_key = f"vector_search:{hashlib.md5(query_text.encode()).hexdigest()}"

    # 尝试从缓存获取
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # 执行查询
    results = perform_vector_search(query_text, top_k)

    # 写入缓存
    redis_client.setex(cache_key, CACHE_TTL, json.dumps(results))
    return results
```

---

## 与 LLM 应用集成

### RAG（检索增强生成）架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAG 系统架构                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  用户查询 ───→ Embedding ───→ 向量搜索 ───→ 相关文档              │
│                                      │                           │
│                                      ↓                           │
│                              构建增强 Prompt                      │
│                                      │                           │
│                                      ↓                           │
│                                LLM 生成回答                       │
│                                      │                           │
│                                      ↓                           │
│                               返回给用户                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 完整 RAG 实现

```python
from openai import OpenAI
import chromadb
from chromadb.utils import embedding_functions

class RAGSystem:
    def __init__(self, collection_name: str = "knowledge_base"):
        self.openai_client = OpenAI()
        self.chroma_client = chromadb.PersistentClient(path="./rag_data")

        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            model_name="text-embedding-3-small"
        )

        self.collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_function
        )

    def add_documents(self, documents: list[dict]):
        """添加文档到知识库"""
        self.collection.add(
            ids=[doc["id"] for doc in documents],
            documents=[doc["content"] for doc in documents],
            metadatas=[doc.get("metadata", {}) for doc in documents]
        )

    def retrieve(self, query: str, top_k: int = 5) -> list[str]:
        """检索相关文档"""
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            include=["documents", "distances"]
        )
        return results["documents"][0]

    def generate_answer(self, query: str, context: list[str]) -> str:
        """基于上下文生成回答"""
        context_text = "\n\n".join([f"[文档 {i+1}]\n{doc}"
                                    for i, doc in enumerate(context)])

        prompt = f"""基于以下参考文档回答用户的问题。
如果文档中没有相关信息，请诚实地说明。

参考文档：
{context_text}

用户问题：{query}

请提供准确、有帮助的回答："""

        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "你是一个专业的技术助手，基于提供的文档回答问题。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        return response.choices[0].message.content

    def query(self, question: str, top_k: int = 5) -> dict:
        """完整的 RAG 查询流程"""
        # 1. 检索相关文档
        relevant_docs = self.retrieve(question, top_k)

        # 2. 生成回答
        answer = self.generate_answer(question, relevant_docs)

        return {
            "question": question,
            "answer": answer,
            "sources": relevant_docs
        }

# 使用示例
rag = RAGSystem()

# 添加知识库文档
documents = [
    {"id": "1", "content": "向量数据库是专门用于存储和查询向量数据的数据库系统..."},
    {"id": "2", "content": "HNSW 算法通过构建多层图结构实现高效的近似最近邻搜索..."},
    {"id": "3", "content": "RAG（检索增强生成）结合了检索系统和大语言模型的优势..."},
]
rag.add_documents(documents)

# 查询
result = rag.query("向量数据库的工作原理是什么？")
print(f"回答: {result['answer']}")
print(f"\n参考来源: {len(result['sources'])} 个文档")
```

### 高级 RAG 技术

```python
class AdvancedRAG(RAGSystem):
    def hybrid_retrieve(self, query: str, top_k: int = 5) -> list[str]:
        """混合检索：结合语义搜索和关键词搜索"""
        # 语义搜索
        semantic_results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )

        # 关键词搜索（使用 where_document）
        keywords = self.extract_keywords(query)
        keyword_results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            where_document={"$contains": keywords[0]} if keywords else None
        )

        # 合并并去重
        all_docs = semantic_results["documents"][0] + keyword_results["documents"][0]
        unique_docs = list(dict.fromkeys(all_docs))

        return unique_docs[:top_k]

    def rerank(self, query: str, documents: list[str]) -> list[str]:
        """使用 LLM 对检索结果重排序"""
        if not documents:
            return []

        prompt = f"""对以下文档按照与查询的相关性进行排序。

查询：{query}

文档列表：
{chr(10).join([f'{i+1}. {doc[:200]}...' for i, doc in enumerate(documents)])}

请返回排序后的文档编号（最相关的在前），格式：1, 3, 2, 5, 4"""

        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        # 解析排序结果
        order_text = response.choices[0].message.content
        order = [int(x.strip()) - 1 for x in order_text.split(",") if x.strip().isdigit()]

        return [documents[i] for i in order if i < len(documents)]

    def query_with_rerank(self, question: str, top_k: int = 5) -> dict:
        """带重排序的 RAG 查询"""
        # 1. 检索更多候选文档
        candidates = self.retrieve(question, top_k * 2)

        # 2. 重排序
        reranked = self.rerank(question, candidates)[:top_k]

        # 3. 生成回答
        answer = self.generate_answer(question, reranked)

        return {
            "question": question,
            "answer": answer,
            "sources": reranked
        }

    def extract_keywords(self, text: str) -> list[str]:
        """提取关键词（简单实现）"""
        import re
        # 移除停用词，提取关键词
        words = re.findall(r'\w+', text)
        stopwords = {'的', '是', '在', '和', '了', '有', '什么', '怎么', '如何'}
        return [w for w in words if w not in stopwords and len(w) > 1]
```

---

## 面试要点

### 核心概念题

**Q1: 向量数据库与传统数据库的主要区别是什么？**

```
传统数据库：
- 基于精确匹配查询（SQL WHERE 条件）
- 使用 B-Tree、Hash 等索引
- 适合结构化数据

向量数据库：
- 基于相似性搜索（找最相似的 K 个）
- 使用 ANN 算法（HNSW、IVF）
- 适合非结构化数据的语义理解
```

**Q2: 什么是 Embedding？为什么需要它？**

```
Embedding 是将高维离散数据（文本、图像）映射到低维连续向量空间的技术。

为什么需要：
1. 计算机无法直接理解文本，需要数值表示
2. 向量空间中，语义相似的内容距离更近
3. 支持跨模态的相似性计算
```

**Q3: HNSW 和 IVF 算法的核心思想？**

```
HNSW：
- 构建多层导航图，高层稀疏，底层稠密
- 搜索时从高层开始，逐层下降
- 时间复杂度 O(log n)，支持动态插入

IVF：
- 将向量空间划分为 nlist 个聚类
- 查询时只搜索最近的 nprobe 个聚类
- 需要预先训练，不支持动态插入
```

### 系统设计题

**Q4: 如何设计一个支持百万级文档的 RAG 系统？**

```python
"""
设计要点：

1. 向量数据库选型
   - 使用 Milvus 或 Pinecone 支持大规模数据
   - 选择 HNSW 索引，M=32, efConstruction=256

2. 分片策略
   - 按文档类型或时间范围分片
   - 使用 Namespace 隔离不同租户

3. 缓存层
   - Redis 缓存热点查询结果
   - 本地缓存 Embedding 避免重复计算

4. 检索优化
   - 混合检索（语义 + 关键词）
   - 使用 Reranker 提升精度
   - 元数据过滤减少搜索范围

5. 架构示意
"""

class ScalableRAGSystem:
    """百万级 RAG 系统架构"""

    def __init__(self):
        # 向量数据库（分布式部署）
        self.vector_db = MilvusClient(
            host="milvus-cluster",
            shards=4  # 4 分片
        )

        # 缓存层
        self.cache = RedisCache(
            host="redis-cluster",
            ttl=3600
        )

        # Embedding 服务（可横向扩展）
        self.embedding_service = EmbeddingService(
            model="text-embedding-3-small",
            batch_size=100
        )

    def ingest(self, documents: list[dict]):
        """文档摄入流水线"""
        # 1. 文档分块
        chunks = self.chunk_documents(documents)

        # 2. 批量生成 Embedding
        embeddings = self.embedding_service.encode_batch(
            [c["content"] for c in chunks]
        )

        # 3. 写入向量数据库
        self.vector_db.insert_batch(chunks, embeddings)

    def query(self, question: str) -> dict:
        """查询流程"""
        # 1. 检查缓存
        cache_key = self.get_cache_key(question)
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        # 2. 生成查询向量
        query_embedding = self.embedding_service.encode(question)

        # 3. 向量检索
        candidates = self.vector_db.search(
            vector=query_embedding,
            top_k=20,
            ef=100
        )

        # 4. 重排序
        reranked = self.rerank(question, candidates[:10])

        # 5. 生成回答
        answer = self.generate(question, reranked[:5])

        # 6. 写入缓存
        result = {"answer": answer, "sources": reranked[:5]}
        self.cache.set(cache_key, result)

        return result
```

**Q5: 如何衡量向量搜索的效果？**

```python
"""
核心指标：

1. 召回率（Recall@K）
   - 在 Top-K 结果中，相关文档的比例

2. 精确率（Precision@K）
   - Top-K 结果中，真正相关的文档比例

3. MRR（Mean Reciprocal Rank）
   - 第一个相关结果的排名倒数的平均值

4. NDCG（Normalized Discounted Cumulative Gain）
   - 考虑相关性程度和位置的综合指标
"""

def assess_retrieval(queries: list[dict], retriever) -> dict:
    """衡量检索效果"""
    recalls = []
    precisions = []
    mrrs = []

    for q in queries:
        query_text = q["query"]
        relevant_ids = set(q["relevant_doc_ids"])

        # 执行检索
        results = retriever.search(query_text, top_k=10)
        retrieved_ids = [r["id"] for r in results]

        # 计算 Recall@10
        hits = len(set(retrieved_ids) & relevant_ids)
        recall = hits / len(relevant_ids) if relevant_ids else 0
        recalls.append(recall)

        # 计算 Precision@10
        precision = hits / len(retrieved_ids) if retrieved_ids else 0
        precisions.append(precision)

        # 计算 MRR
        for i, doc_id in enumerate(retrieved_ids):
            if doc_id in relevant_ids:
                mrrs.append(1 / (i + 1))
                break
        else:
            mrrs.append(0)

    return {
        "recall@10": sum(recalls) / len(recalls),
        "precision@10": sum(precisions) / len(precisions),
        "mrr": sum(mrrs) / len(mrrs)
    }
```

### 实战经验题

**Q6: 生产环境中常见的问题及解决方案？**

```
1. 查询延迟高
   - 优化索引参数（降低 ef 值）
   - 使用近似搜索替代精确搜索
   - 引入缓存层

2. 召回率不足
   - 使用更好的 Embedding 模型
   - 增加 top_k 数量 + Reranker
   - 混合检索（语义 + 关键词）

3. 内存不足
   - 使用量化压缩（PQ、SQ）
   - 分片部署
   - 冷热数据分离

4. 数据更新慢
   - 使用支持动态插入的索引（HNSW）
   - 批量更新替代逐条更新
   - 异步写入队列
```

---

## 总结

向量数据库是构建现代 AI 应用的核心基础设施。掌握向量数据库需要理解：

1. **核心概念**：向量化、相似度度量、ANN 算法
2. **技术选型**：根据场景选择合适的产品（Pinecone/Milvus/Chroma）
3. **性能优化**：索引调优、批量操作、缓存策略
4. **实战应用**：RAG 系统设计、与 LLM 集成

随着大语言模型的普及，向量数据库的重要性将持续增长。建议从 Chroma 开始本地实践，逐步过渡到生产级的 Milvus 或 Pinecone。
