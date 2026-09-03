---
title: RAG 检索增强生成
description: 掌握RAG系统的架构设计、向量数据库和优化策略
track: ai
section: rag
difficulty: advanced
tags:
  - RAG
  - LLM
  - 向量数据库
status: imported
origin: old/src/content/docs/ai/rag-retrieval-augmented-generation.zh.md
divergence: 0.236
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: AI
  subcategory: LLM
  order: 20
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 RAG？

RAG（Retrieval-Augmented Generation，检索增强生成）是一种将信息检索与大语言模型（LLM）生成能力相结合的技术架构。它通过在生成回答之前，先从外部知识库中检索相关信息，然后将检索到的上下文与用户查询一起输入到 LLM 中，从而生成更准确、更具时效性的回答。

RAG 的核心思想可以用一个简单的公式表达：

```
最终回答 = LLM(用户问题 + 检索到的相关文档)
```

### 为什么需要 RAG？

大语言模型虽然强大，但存在几个固有的局限性：

**1. 知识截止日期问题**

LLM 的知识仅限于训练数据的截止日期。例如，GPT-4 的知识截止于 2023 年 4 月，无法回答之后发生的事件或最新的技术更新。

**2. 幻觉问题（Hallucination）**

当 LLM 缺乏相关知识时，它可能会"编造"看似合理但实际错误的信息。这在需要准确性的场景（如医疗、法律、金融）中是不可接受的。

**3. 领域知识不足**

通用 LLM 对特定企业的内部知识、私有文档、专业领域术语了解有限。

**4. 可追溯性问题**

LLM 生成的答案难以追溯信息来源，无法验证其可靠性。

RAG 通过引入外部知识库有效解决了这些问题：

| 问题 | RAG 解决方案 |
|------|-------------|
| 知识过时 | 实时检索最新文档 |
| 幻觉问题 | 基于真实文档生成，减少编造 |
| 领域不足 | 接入企业私有知识库 |
| 不可追溯 | 返回引用来源，支持验证 |

### RAG 的发展历史

- **2020年**：Facebook AI Research（现 Meta AI）首次在论文《Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks》中提出 RAG 概念
- **2022年**：随着 ChatGPT 的爆发，RAG 成为企业应用 LLM 的主流方案
- **2023年**：各类 RAG 框架（LangChain、LlamaIndex）快速成熟，高级 RAG 技术涌现
- **2024年**：Graph RAG、Agentic RAG 等进阶架构开始流行

## 核心原理

### RAG 的工作流程

RAG 系统的运行可以分为两个主要阶段：

#### 阶段一：离线索引（Indexing）

```
原始文档 -> 文档加载 -> 文本分块 -> 向量嵌入 -> 存入向量数据库
```

1. **文档加载**：从各种来源（PDF、网页、数据库等）读取原始内容
2. **文本分块**：将长文档切分成适合处理的小块
3. **向量嵌入**：使用 Embedding 模型将文本转换为向量表示
4. **向量存储**：将向量及其元数据存入向量数据库

#### 阶段二：在线检索与生成（Retrieval & Generation）

```
用户查询 -> 查询嵌入 -> 相似度检索 -> 上下文构建 -> LLM生成 -> 返回答案
```

1. **查询嵌入**：将用户问题转换为向量
2. **相似度检索**：在向量数据库中找到最相似的文档块
3. **上下文构建**：将检索结果组装成提示词上下文
4. **LLM 生成**：将上下文与问题一起发送给 LLM
5. **答案返回**：返回生成的答案及引用来源

### 向量相似度计算

RAG 检索的核心是向量相似度计算，常用的度量方法包括：

**1. 余弦相似度（Cosine Similarity）**

```python
# 计算两个向量的余弦相似度
import numpy as np

def cosine_similarity(v1, v2):
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    return dot_product / (norm_v1 * norm_v2)
```

余弦相似度衡量两个向量方向的一致性，取值范围为 [-1, 1]，值越接近 1 表示越相似。

**2. 欧氏距离（Euclidean Distance）**

```python
def euclidean_distance(v1, v2):
    return np.linalg.norm(v1 - v2)
```

欧氏距离衡量两点之间的直线距离，值越小表示越相似。

**3. 点积（Dot Product）**

```python
def dot_product(v1, v2):
    return np.dot(v1, v2)
```

点积在向量已归一化时等价于余弦相似度，计算效率更高。

## 核心要点

### RAG 系统架构

一个完整的 RAG 系统包含以下核心组件：

```
+-------------------------------------------------------------+
|                       RAG 系统架构                           |
+-------------------------------------------------------------+
|                                                             |
|  +-------------+    +-------------+    +-------------+      |
|  |  文档加载器  | -> |  文本分块器  | -> |  嵌入模型   |      |
|  |  Loaders    |    |  Splitters  |    |  Embeddings |      |
|  +-------------+    +-------------+    +------+------+      |
|                                              |              |
|                                              v              |
|  +-------------+    +-------------+    +-------------+      |
|  |  LLM 生成   | <- |  检索器     | <- |  向量数据库  |      |
|  |  Generation |    |  Retriever  |    |  VectorDB   |      |
|  +-------------+    +-------------+    +-------------+      |
|                                                             |
+-------------------------------------------------------------+
```

### 文档加载与解析

不同类型的文档需要不同的加载策略：

| 文档类型 | 推荐工具 | 特点 |
|---------|---------|------|
| PDF | PyPDF2, pdfplumber, Unstructured | pdfplumber 对表格支持较好 |
| Word | python-docx | 保留格式结构 |
| HTML | BeautifulSoup, Unstructured | 需要清理标签 |
| Markdown | 直接读取 | 保留结构信息 |
| 代码文件 | 按语言解析 | 保留语法结构 |
| 图片 | OCR (Tesseract, PaddleOCR) | 需要 OCR 预处理 |

```python
from langchain_community.document_loaders import (
    PyPDFLoader,
    UnstructuredWordDocumentLoader,
    WebBaseLoader,
)

# PDF 文档加载
pdf_loader = PyPDFLoader("document.pdf")
pdf_docs = pdf_loader.load()

# Word 文档加载
docx_loader = UnstructuredWordDocumentLoader("document.docx")
docx_docs = docx_loader.load()

# 网页加载
web_loader = WebBaseLoader("https://example.com/article")
web_docs = web_loader.load()
```

### 文本分块策略

文本分块是 RAG 系统中最关键的环节之一，直接影响检索效果。

**1. 固定大小分块（Fixed-size Chunking）**

```python
from langchain.text_splitter import CharacterTextSplitter

splitter = CharacterTextSplitter(
    chunk_size=1000,      # 每块字符数
    chunk_overlap=200,    # 重叠字符数
    separator="\n"        # 分隔符
)
chunks = splitter.split_documents(documents)
```

**2. 递归字符分块（Recursive Character Splitting）**

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", "。", "，", " ", ""]  # 按优先级尝试分隔
)
chunks = splitter.split_documents(documents)
```

**3. 语义分块（Semantic Chunking）**

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()
splitter = SemanticChunker(
    embeddings=embeddings,
    breakpoint_threshold_type="percentile"
)
chunks = splitter.split_documents(documents)
```

**4. 分块策略选择指南**

| 场景 | 推荐策略 | chunk_size | chunk_overlap |
|------|---------|------------|---------------|
| 通用问答 | 递归字符 | 500-1000 | 50-100 |
| 代码检索 | 按函数/类分块 | 变长 | 0 |
| 长文档 | 语义分块 | 动态 | - |
| 对话历史 | 固定大小 | 200-500 | 50 |

### 嵌入模型选择

嵌入模型（Embedding Model）将文本转换为高维向量，是 RAG 检索质量的关键。

**主流嵌入模型对比**

| 模型 | 维度 | 特点 | 适用场景 |
|------|------|------|---------|
| OpenAI text-embedding-3-small | 1536 | 性价比高，效果优秀 | 通用场景 |
| OpenAI text-embedding-3-large | 3072 | 效果最佳，成本较高 | 高精度需求 |
| Cohere embed-v3 | 1024 | 多语言支持好 | 多语言场景 |
| BGE-large-zh | 1024 | 中文效果优秀 | 中文专属场景 |
| Jina embeddings-v2 | 768 | 长文本支持（8K tokens）| 长文档场景 |
| all-MiniLM-L6-v2 | 384 | 开源免费，速度快 | 资源受限场景 |

```python
# OpenAI 嵌入
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 开源模型嵌入（本地运行）
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-zh-v1.5",
    model_kwargs={"device": "cuda"},
    encode_kwargs={"normalize_embeddings": True}
)

# 生成向量
vector = embeddings.embed_query("什么是机器学习？")
print(f"向量维度: {len(vector)}")  # 输出: 向量维度: 1024
```

### 向量数据库

向量数据库是存储和检索嵌入向量的专用数据库。

**主流向量数据库对比**

| 数据库 | 类型 | 特点 | 适用场景 |
|--------|------|------|---------|
| **Pinecone** | 云托管 | 全托管，高性能，易扩展 | 企业级生产环境 |
| **Milvus** | 开源/云 | 功能丰富，支持混合搜索 | 大规模部署 |
| **Chroma** | 开源 | 轻量易用，内存模式 | 开发测试、小规模应用 |
| **Weaviate** | 开源/云 | GraphQL API，模块化 | 需要图搜索场景 |
| **Qdrant** | 开源/云 | Rust 实现，高性能 | 性能敏感场景 |
| **FAISS** | 库 | Facebook 出品，纯算法 | 研究、嵌入应用 |
| **pgvector** | 扩展 | PostgreSQL 扩展 | 已有 PG 基础设施 |

#### Pinecone 使用示例

```python
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings

# 初始化 Pinecone
pc = Pinecone(api_key="your-api-key")

# 创建索引
pc.create_index(
    name="rag-index",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1")
)

# 使用 LangChain 集成
embeddings = OpenAIEmbeddings()
vectorstore = PineconeVectorStore.from_documents(
    documents=chunks,
    embedding=embeddings,
    index_name="rag-index"
)

# 检索
results = vectorstore.similarity_search("什么是RAG？", k=5)
```

#### Chroma 使用示例

```python
import chromadb
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

# 创建持久化客户端
client = chromadb.PersistentClient(path="./chroma_db")

# 使用 LangChain 集成
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db",
    collection_name="my_collection"
)

# 带分数的检索
results = vectorstore.similarity_search_with_score("什么是RAG？", k=5)
for doc, score in results:
    print(f"Score: {score:.4f} - {doc.page_content[:100]}")
```

#### Milvus 使用示例

```python
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType
from langchain_milvus import Milvus
from langchain_openai import OpenAIEmbeddings

# 连接 Milvus
connections.connect(host="localhost", port="19530")

# 使用 LangChain 集成
embeddings = OpenAIEmbeddings()
vectorstore = Milvus.from_documents(
    documents=chunks,
    embedding=embeddings,
    connection_args={"host": "localhost", "port": "19530"},
    collection_name="rag_collection"
)

# 检索
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
docs = retriever.invoke("什么是RAG？")
```

### 检索策略

#### 基础相似度检索

```python
# 简单的相似度检索
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5}
)
```

#### 最大边际相关性（MMR）检索

MMR 在保证相关性的同时增加结果多样性，避免返回内容重复的文档。

```python
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 5,              # 最终返回数量
        "fetch_k": 20,       # 候选集大小
        "lambda_mult": 0.7   # 多样性权重（0-1，越小越多样）
    }
)
```

#### 混合搜索（Hybrid Search）

结合关键词搜索（BM25）和向量搜索的优势。

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# BM25 关键词检索器
bm25_retriever = BM25Retriever.from_documents(documents)
bm25_retriever.k = 5

# 向量检索器
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# 混合检索器
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.4, 0.6]  # 权重分配
)

results = ensemble_retriever.invoke("什么是RAG？")
```

#### 重排序（Reranking）

使用专门的重排序模型对初步检索结果进行精排。

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank

# 初始检索器
base_retriever = vectorstore.as_retriever(search_kwargs={"k": 20})

# Cohere 重排序
reranker = CohereRerank(model="rerank-multilingual-v3.0", top_n=5)

# 组合检索器
compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=base_retriever
)

results = compression_retriever.invoke("什么是RAG？")
```

#### 自查询检索（Self-Query）

让 LLM 自动从用户查询中提取元数据过滤条件。

```python
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.chains.query_constructor.schema import AttributeInfo
from langchain_openai import ChatOpenAI

# 定义元数据字段
metadata_field_info = [
    AttributeInfo(
        name="category",
        description="文档类别，如 'technical', 'business', 'legal'",
        type="string",
    ),
    AttributeInfo(
        name="year",
        description="文档发布年份",
        type="integer",
    ),
]

# 创建自查询检索器
llm = ChatOpenAI(model="gpt-4o", temperature=0)
retriever = SelfQueryRetriever.from_llm(
    llm=llm,
    vectorstore=vectorstore,
    document_contents="技术文档内容",
    metadata_field_info=metadata_field_info,
)

# 查询会自动提取过滤条件
results = retriever.invoke("2024年的技术文档中关于RAG的内容")
```

## 代码示例

### 完整的 RAG 系统实现

以下是一个使用 LangChain 构建的完整 RAG 系统示例：

```python
"""
完整的 RAG 系统实现
使用 LangChain + OpenAI + Chroma
"""

import os
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

class RAGSystem:
    """RAG 系统封装类"""

    def __init__(
        self,
        persist_directory: str = "./chroma_db",
        embedding_model: str = "text-embedding-3-small",
        llm_model: str = "gpt-4o",
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ):
        self.persist_directory = persist_directory
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # 初始化嵌入模型
        self.embeddings = OpenAIEmbeddings(model=embedding_model)

        # 初始化 LLM
        self.llm = ChatOpenAI(model=llm_model, temperature=0)

        # 初始化向量数据库
        self.vectorstore = None

        # 初始化文本分块器
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", "。", "！", "？", "，", " ", ""]
        )

        # RAG 提示词模板
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """你是一个专业的问答助手。请根据以下检索到的上下文信息回答用户的问题。

规则：
1. 只根据提供的上下文回答问题，不要编造信息
2. 如果上下文中没有相关信息，请明确说明"根据已有资料无法回答该问题"
3. 回答时请引用信息来源
4. 保持回答简洁、专业

上下文信息：
{context}
"""),
            ("human", "{question}")
        ])

    def load_documents(self, source_path: str) -> List:
        """加载文档"""
        if os.path.isfile(source_path):
            # 单个 PDF 文件
            if source_path.endswith(".pdf"):
                loader = PyPDFLoader(source_path)
            else:
                raise ValueError(f"不支持的文件类型: {source_path}")
        else:
            # 目录中的所有 PDF
            loader = DirectoryLoader(
                source_path,
                glob="**/*.pdf",
                loader_cls=PyPDFLoader,
                show_progress=True
            )

        documents = loader.load()
        print(f"加载了 {len(documents)} 个文档")
        return documents

    def create_index(self, documents: List) -> None:
        """创建向量索引"""
        # 文本分块
        chunks = self.text_splitter.split_documents(documents)
        print(f"分块后共 {len(chunks)} 个块")

        # 创建向量数据库
        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )
        print(f"向量数据库已创建并持久化到 {self.persist_directory}")

    def load_index(self) -> None:
        """加载已有索引"""
        self.vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings
        )
        print(f"已加载向量数据库: {self.persist_directory}")

    def format_docs(self, docs: List) -> str:
        """格式化检索到的文档"""
        formatted = []
        for i, doc in enumerate(docs, 1):
            source = doc.metadata.get("source", "未知来源")
            page = doc.metadata.get("page", "")
            formatted.append(f"[来源 {i}] {source} (第{page}页)\n{doc.page_content}")
        return "\n\n---\n\n".join(formatted)

    def query(
        self,
        question: str,
        k: int = 5,
        search_type: str = "similarity"
    ) -> Dict[str, Any]:
        """执行 RAG 查询"""
        if not self.vectorstore:
            raise ValueError("向量数据库未初始化，请先调用 create_index 或 load_index")

        # 创建检索器
        retriever = self.vectorstore.as_retriever(
            search_type=search_type,
            search_kwargs={"k": k}
        )

        # 构建 RAG Chain
        rag_chain = (
            {
                "context": retriever | self.format_docs,
                "question": RunnablePassthrough()
            }
            | self.prompt_template
            | self.llm
            | StrOutputParser()
        )

        # 获取检索的文档
        retrieved_docs = retriever.invoke(question)

        # 执行生成
        answer = rag_chain.invoke(question)

        return {
            "question": question,
            "answer": answer,
            "sources": [
                {
                    "content": doc.page_content[:200] + "...",
                    "metadata": doc.metadata
                }
                for doc in retrieved_docs
            ]
        }


# 使用示例
if __name__ == "__main__":
    # 初始化 RAG 系统
    rag = RAGSystem(
        persist_directory="./my_rag_db",
        chunk_size=800,
        chunk_overlap=150
    )

    # 方式1：从文档创建新索引
    # documents = rag.load_documents("./documents/")
    # rag.create_index(documents)

    # 方式2：加载已有索引
    # rag.load_index()

    # 执行查询
    # result = rag.query("什么是机器学习？", k=5)
    # print(f"问题: {result['question']}")
    # print(f"回答: {result['answer']}")
    # print(f"参考来源: {len(result['sources'])} 条")
```

### 高级 RAG 实现：多查询检索

```python
"""
多查询 RAG 实现
使用 LLM 生成多个查询变体，提高检索召回率
"""

from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate

def create_multi_query_retriever(vectorstore, llm=None):
    """创建多查询检索器"""

    if llm is None:
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

    # 自定义查询生成提示词
    query_prompt = PromptTemplate(
        input_variables=["question"],
        template="""你是一个 AI 语言模型助手。你的任务是生成 3 个不同版本的用户问题，
用于从向量数据库中检索相关文档。通过生成问题的多个角度，
你的目标是帮助用户克服基于距离的相似度搜索的一些局限性。

请提供这些用换行符分隔的替代问题。

原始问题: {question}

替代问题:"""
    )

    retriever = MultiQueryRetriever.from_llm(
        retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
        llm=llm,
        prompt=query_prompt
    )

    return retriever


# 使用示例
# multi_retriever = create_multi_query_retriever(vectorstore)
# docs = multi_retriever.invoke("RAG 的优点是什么？")
```

### 带对话历史的 RAG

```python
"""
带对话历史的 RAG 实现
支持多轮对话上下文
"""

from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

def create_conversational_rag_chain(vectorstore, llm):
    """创建支持对话历史的 RAG Chain"""

    # 上下文化问题的提示词
    contextualize_prompt = ChatPromptTemplate.from_messages([
        ("system", """根据对话历史和最新的用户问题，
重新表述一个独立的问题，该问题可以不依赖对话历史来理解。
不要回答问题，只需要在必要时重新表述问题，否则原样返回。"""),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])

    # 创建历史感知检索器
    history_aware_retriever = create_history_aware_retriever(
        llm, vectorstore.as_retriever(), contextualize_prompt
    )

    # 问答提示词
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", """你是一个专业的问答助手。根据以下检索到的上下文回答问题。
如果不知道答案，就说不知道。保持回答简洁。

{context}"""),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])

    # 创建问答 Chain
    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

    # 创建完整的 RAG Chain
    rag_chain = create_retrieval_chain(
        history_aware_retriever,
        question_answer_chain
    )

    return rag_chain


class ConversationalRAG:
    """对话式 RAG 封装"""

    def __init__(self, vectorstore, llm):
        self.chain = create_conversational_rag_chain(vectorstore, llm)
        self.chat_history = []

    def chat(self, message: str) -> str:
        """发送消息并获取回复"""
        response = self.chain.invoke({
            "input": message,
            "chat_history": self.chat_history
        })

        # 更新对话历史
        self.chat_history.extend([
            HumanMessage(content=message),
            AIMessage(content=response["answer"])
        ])

        return response["answer"]

    def clear_history(self):
        """清空对话历史"""
        self.chat_history = []


# 使用示例
# conv_rag = ConversationalRAG(vectorstore, llm)
# print(conv_rag.chat("什么是 RAG？"))
# print(conv_rag.chat("它有什么优点？"))  # 系统理解"它"指的是 RAG
# print(conv_rag.chat("能举个例子吗？"))
```

## 最佳实践

### 文档预处理最佳实践

```python
def preprocess_document(text: str) -> str:
    """文档预处理"""
    import re

    # 移除多余空白
    text = re.sub(r'\s+', ' ', text)

    # 移除特殊字符（保留中文标点）
    text = re.sub(r'[^\w\s\u4e00-\u9fff，。！？；：""''（）【】]', '', text)

    # 移除页眉页脚（根据实际情况调整）
    text = re.sub(r'第\s*\d+\s*页', '', text)

    return text.strip()
```

### 元数据增强

```python
from datetime import datetime

def enhance_metadata(document, source_path: str) -> dict:
    """增强文档元数据"""
    return {
        "source": source_path,
        "filename": os.path.basename(source_path),
        "file_type": os.path.splitext(source_path)[1],
        "indexed_at": datetime.now().isoformat(),
        "char_count": len(document.page_content),
        # 可以添加更多业务相关的元数据
    }
```

### 检索质量监控

```python
def measure_retrieval_quality(
    query: str,
    retrieved_docs: List,
    ground_truth_docs: List
) -> Dict[str, float]:
    """测量检索质量"""

    retrieved_ids = set(doc.metadata.get("id") for doc in retrieved_docs)
    truth_ids = set(doc.metadata.get("id") for doc in ground_truth_docs)

    # 计算指标
    hits = len(retrieved_ids & truth_ids)

    precision = hits / len(retrieved_ids) if retrieved_ids else 0
    recall = hits / len(truth_ids) if truth_ids else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "hits": hits
    }
```

## 常见陷阱

### 分块过大或过小

**问题**：分块太大导致检索不精确，太小导致上下文不完整。

**解决方案**：
- 根据文档类型调整分块大小
- 使用重叠（overlap）保持上下文连续性
- 考虑使用父子文档策略

```python
# 父子文档策略示例
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore

# 小块用于检索
child_splitter = RecursiveCharacterTextSplitter(chunk_size=400)

# 大块用于上下文
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000)

store = InMemoryStore()
retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=store,
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,
)
```

### 忽略元数据过滤

**问题**：仅依赖向量相似度，忽略了结构化过滤的价值。

**解决方案**：结合元数据过滤提高精度。

```python
# 使用 Chroma 的 where 过滤
results = vectorstore.similarity_search(
    query="技术文档",
    k=5,
    filter={"category": "technical", "year": {"$gte": 2023}}
)
```

### 上下文窗口溢出

**问题**：检索太多文档导致超出 LLM 上下文限制。

**解决方案**：
- 限制检索数量
- 使用压缩策略
- 选择长上下文模型

```python
from langchain.retrievers.document_compressors import LLMChainExtractor

compressor = LLMChainExtractor.from_llm(llm)
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=base_retriever
)
```

### 缺乏查询理解

**问题**：用户查询模糊或口语化，直接检索效果差。

**解决方案**：使用 HyDE（Hypothetical Document Embeddings）。

```python
from langchain.chains import HypotheticalDocumentEmbedder

# 让 LLM 生成假设性答案，用其嵌入检索
embeddings = HypotheticalDocumentEmbedder.from_llm(
    llm=llm,
    base_embeddings=base_embeddings,
    prompt_key="web_search"  # 或自定义提示词
)
```

## 性能考量

### 向量数据库索引优化

```python
# Milvus 索引配置示例
index_params = {
    "metric_type": "COSINE",
    "index_type": "IVF_FLAT",  # 或 HNSW
    "params": {
        "nlist": 1024,  # IVF 聚类数
        # HNSW 参数
        # "M": 16,
        # "efConstruction": 200
    }
}
```

### 批量处理优化

```python
# 批量嵌入以减少 API 调用
def batch_embed(texts: List[str], batch_size: int = 100):
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_embeddings = embeddings_model.embed_documents(batch)
        all_embeddings.extend(batch_embeddings)
    return all_embeddings
```

### 缓存策略

```python
from langchain.cache import SQLiteCache
from langchain.globals import set_llm_cache

# 设置 LLM 缓存
set_llm_cache(SQLiteCache(database_path=".langchain.db"))

# 或使用 Redis 缓存
from langchain.cache import RedisCache
from redis import Redis

set_llm_cache(RedisCache(redis_=Redis()))
```

### 异步处理

```python
import asyncio
from langchain_openai import ChatOpenAI

async def async_rag_query(questions: List[str]):
    """异步批量查询"""
    llm = ChatOpenAI(model="gpt-4o")

    async def query_one(question):
        return await llm.ainvoke(question)

    results = await asyncio.gather(*[query_one(q) for q in questions])
    return results
```

## 实战场景

### 场景一：企业知识库问答

```python
"""
企业知识库 RAG 系统
支持多种文档格式，带权限控制
"""

class EnterpriseKnowledgeBase:
    def __init__(self):
        self.vectorstore = None
        self.user_permissions = {}

    def ingest_documents(self, docs, department: str):
        """按部门摄入文档"""
        for doc in docs:
            doc.metadata["department"] = department
            doc.metadata["access_level"] = "internal"

        # 添加到向量库
        self.vectorstore.add_documents(docs)

    def query(self, question: str, user_id: str):
        """带权限检查的查询"""
        user_dept = self.user_permissions.get(user_id, {}).get("department")

        # 使用元数据过滤确保只返回用户有权访问的文档
        results = self.vectorstore.similarity_search(
            question,
            k=5,
            filter={"department": {"$in": [user_dept, "public"]}}
        )

        return results
```

### 场景二：代码库问答

```python
"""
代码库 RAG 系统
专门处理代码文件
"""

from langchain.text_splitter import Language, RecursiveCharacterTextSplitter

def create_code_splitter(language: str):
    """根据语言创建代码分块器"""
    lang_map = {
        "python": Language.PYTHON,
        "javascript": Language.JS,
        "typescript": Language.TS,
        "java": Language.JAVA,
        "go": Language.GO,
    }

    return RecursiveCharacterTextSplitter.from_language(
        language=lang_map.get(language, Language.PYTHON),
        chunk_size=1000,
        chunk_overlap=100
    )

# 代码问答提示词
CODE_QA_PROMPT = """你是一个代码助手。根据以下代码片段回答问题。

代码上下文：
{context}

问题：{question}

请提供准确的技术回答，如有必要可以展示代码示例。
"""
```

## RAG 评估

### 评估框架

RAG 系统的评估需要从多个维度进行：

| 维度 | 指标 | 说明 |
|------|------|------|
| 检索质量 | Precision@K, Recall@K, MRR, NDCG | 测量检索的准确性 |
| 生成质量 | Faithfulness, Answer Relevance | 测量生成答案的质量 |
| 端到端 | Answer Correctness | 测量最终答案的正确性 |

### 使用 RAGAS 进行评估

```python
from ragas import assess
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)
from datasets import Dataset

# 准备评估数据
assessment_data = {
    "question": ["什么是RAG？", "向量数据库有哪些？"],
    "answer": ["RAG是...", "常见的向量数据库包括..."],
    "contexts": [["RAG 定义...", "RAG 优势..."], ["Pinecone...", "Milvus..."]],
    "ground_truth": ["RAG是检索增强生成...", "主流向量数据库有Pinecone、Milvus..."]
}

dataset = Dataset.from_dict(assessment_data)

# 执行评估
result = assess(
    dataset=dataset,
    metrics=[
        faithfulness,        # 答案是否忠于上下文
        answer_relevancy,    # 答案与问题的相关性
        context_precision,   # 检索上下文的精确度
        context_recall,      # 检索上下文的召回率
    ]
)

print(result)
```

## 优化技巧

### 查询重写（Query Rewriting）

```python
QUERY_REWRITE_PROMPT = """将以下用户查询重写为更适合搜索的形式。
保持原意，但使用更专业、更具体的术语。

原始查询：{query}

重写后的查询："""
```

### 多路召回融合

```python
from langchain.retrievers import MergerRetriever

# 合并多个检索器的结果
lotr = MergerRetriever(retrievers=[
    vectorstore1.as_retriever(),
    vectorstore2.as_retriever(),
    bm25_retriever,
])
```

### 分层检索

```python
# 第一层：快速过滤（小模型）
# 第二层：精确检索（大模型）
# 第三层：重排序

def hierarchical_retrieval(query: str, k: int = 5):
    # 粗排：获取较多候选
    candidates = vectorstore.similarity_search(query, k=k * 4)

    # 精排：使用重排序模型
    reranked = reranker.rerank(query, candidates, top_n=k)

    return reranked
```

### 反馈学习

```python
def log_feedback(query: str, answer: str, feedback: int):
    """记录用户反馈用于改进"""
    feedback_store.add({
        "query": query,
        "answer": answer,
        "feedback": feedback,  # 1-5 评分
        "timestamp": datetime.now()
    })
```

## 面试要点

### 基础问题

1. **什么是 RAG？它解决了 LLM 的什么问题？**
   - RAG 是检索增强生成，结合检索与生成
   - 解决知识过时、幻觉、领域不足、不可追溯等问题

2. **RAG 的基本工作流程是什么？**
   - 离线：文档加载 -> 分块 -> 嵌入 -> 存储
   - 在线：查询嵌入 -> 检索 -> 构建上下文 -> LLM生成

3. **如何选择合适的分块策略？**
   - 根据文档类型、查询特点选择
   - 考虑 chunk_size 和 overlap 的平衡
   - 可使用递归分块或语义分块

### 进阶问题

4. **如何提高 RAG 系统的检索质量？**
   - 混合搜索（向量 + BM25）
   - 重排序（Reranking）
   - 查询重写
   - 多路召回融合

5. **如何测量 RAG 系统的效果？**
   - 检索指标：Precision, Recall, MRR, NDCG
   - 生成指标：Faithfulness, Relevance
   - 使用 RAGAS 等框架

6. **RAG 与微调（Fine-tuning）如何选择？**
   - RAG：知识频繁更新、需要引用来源、成本敏感
   - 微调：知识稳定、需要特定风格、性能优先
   - 可以结合使用

### 实战问题

7. **处理长文档时有哪些策略？**
   - 父子文档策略
   - Map-Reduce 方法
   - 分层索引

8. **如何处理多轮对话中的 RAG？**
   - 使用 history-aware retriever
   - 将历史对话纳入查询重写
   - 管理对话状态

9. **如何优化 RAG 系统的延迟？**
   - 缓存常见查询
   - 批量处理
   - 使用更快的嵌入模型
   - 优化向量数据库索引

10. **Graph RAG 与传统 RAG 有什么区别？**
    - Graph RAG 构建知识图谱
    - 能捕获实体间关系
    - 支持更复杂的推理

## 延伸阅读

### 官方文档

- [LangChain Documentation](https://python.langchain.com/docs/)
- [LlamaIndex Documentation](https://docs.llamaindex.ai/)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Chroma Documentation](https://docs.trychroma.com/)
- [Milvus Documentation](https://milvus.io/docs)

### 经典论文

- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) - RAG 原始论文
- [Dense Passage Retrieval for Open-Domain Question Answering](https://arxiv.org/abs/2004.04906) - DPR 论文
- [REALM: Retrieval-Augmented Language Model Pre-Training](https://arxiv.org/abs/2002.08909)
- [Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection](https://arxiv.org/abs/2310.11511)

### 推荐资源

- [RAG 实践指南](https://github.com/langchain-ai/rag-from-scratch) - LangChain 官方教程
- [Building RAG Applications](https://www.deeplearning.ai/short-courses/) - DeepLearning.AI 课程
- [Advanced RAG Techniques](https://blog.langchain.dev/) - LangChain 博客
- [Vector Database Comparison](https://benchmark.vectorview.ai/) - 向量数据库性能对比

### 社区资源

- [LangChain Discord](https://discord.gg/langchain)
- [Hugging Face Forums](https://discuss.huggingface.co/)
- [Reddit r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/)
